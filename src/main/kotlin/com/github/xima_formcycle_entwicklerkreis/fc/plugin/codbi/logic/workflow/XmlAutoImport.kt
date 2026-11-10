package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.workflow

import de.xima.fc.utils.FormDataUtils
import java.io.ByteArrayInputStream
import java.io.File
import javax.xml.parsers.DocumentBuilderFactory
import org.w3c.dom.Attr
import org.w3c.dom.Document
import org.w3c.dom.Element
import org.w3c.dom.Node
import org.xml.sax.ErrorHandler
import org.xml.sax.SAXParseException

/**
 * Reads a stored form-state XML file and turns it into "write THIS value into THAT form field"
 * instructions — without any manually configured XPath mapping.
 *
 * FORMCYCLE's own `FC_IMPORT_FORM_VALUE_FROM_XML` node only writes the fields listed in its
 * `xpathMapping` property ("Zu setzende Werte"); every other value in the file is ignored. This
 * planner is the counterpart for the CodBi `cbXMLAutoImport` node: it discovers the values in the
 * file on its own and matches them against the fields the form actually has.
 *
 * Two XML shapes are recognized:
 * 1. **formcycle form-data XML** (`FC_EXPORT_TO_XML`, root tag `xfc-data`): every `<field
 *    name="…">` element provides one field; the value lives in `<plainValue>` and/or in
 *    `<values><value index="…">…</value></values>` (repetitions).
 * 2. **generic XML**: every leaf element whose tag name matches a form field uses its text as the
 *    value; an attribute whose NAME is a form field uses the attribute value, an attribute whose
 *    VALUE is a form field (e.g. `<field name="firstName">`) uses the element text.
 *
 * @since 1.1.0
 */
object XmlAutoImport {

  /** Root tag of the FORMCYCLE form-data XML written by `FC_EXPORT_TO_XML`. */
  const val FORMCYCLE_ROOT_TAG: String = "xfc-data"

  /** Tag of one field element in the FORMCYCLE form-data XML. */
  const val FORMCYCLE_FIELD_TAG: String = "field"

  /** Attribute holding the form element's technical name on [FORMCYCLE_FIELD_TAG]. */
  const val FORMCYCLE_NAME_ATTRIBUTE: String = "name"

  /** Element holding the plain (unformatted) value of a field. */
  const val FORMCYCLE_PLAIN_VALUE_TAG: String = "plainValue"

  /** Element wrapping the single values of a repeated field. */
  const val FORMCYCLE_VALUES_TAG: String = "values"

  /** Element holding one value of a repeated field. */
  const val FORMCYCLE_VALUE_TAG: String = "value"

  /** Marker that identifies a java.beans XMLEncoder/XMLDecoder document. */
  private const val PERSISTENCE_MARKER: String = "java.beans.XMLEncoder"

  /** Keys of the persistence document that carry metadata, not field values. */
  private const val PERSISTENCE_RESERVED_PREFIX: String = "xfc-persist-"

  /** Row count of a repeatable container in a persisted form (`<container>_dyn_size`). */
  private const val DYNAMIC_SIZE_SUFFIX: String = "_dyn_size"

  /** One row field of a repeatable container (`<container>_dyn_<field>_<index>`). */
  private val DYNAMIC_FIELD_PATTERN: Regex = Regex("""(.+)_dyn_(.+)_(\d+)$""")

  /** One repetition of a self-repeating element (`<field>_quest_<index>`). */
  private val QUESTION_INDEX_PATTERN: Regex = Regex("""(.+)_quest_(\d+)$""")

  /** Which XML shape was detected. */
  enum class Format {
    /** FORMCYCLE form-data XML (`xfc-data` / `field[@name]`). */
    FORMCYCLE_XML,

    /**
     * FORMCYCLE persistence document written by `FC_EXPORT_TO_PERSISTENCE` (java.beans XMLEncoder:
     * `<void method="put"><string>field</string>…`).
     */
    PERSISTENCE_XML,

    /** Any other XML: element name / name attribute is matched against the form's field names. */
    GENERIC_XML,
  }

  /** Options controlling how values are read out of the document. */
  data class Options(
      /** Trims surrounding whitespace (pretty-printed XML otherwise imports indentation). */
      val trimValues: Boolean = true,
      /** Keeps all values of a repeated element instead of only the first one. */
      val importRepeatedValues: Boolean = true,
      /**
       * Form fields that must NOT be written ("Nicht zu setzende Werte"). Names may be technical
       * names or aliases; they are resolved like the names in the file.
       */
      val excludedFieldNames: Set<String> = emptySet(),
      /**
       * Technical names of the form's REPEATABLE containers. A persisted form stores a container's
       * row count (`<container>_dyn_size`) and its rows (`<container>_dyn_<field>_<index>`) as
       * separate keys; those keys are written VERBATIM so the record keeps every repetition.
       */
      val knownContainerNames: Set<String> = emptySet(),
  )

  /**
   * One field that shall be written.
   *
   * @property fieldName Technical name of the form element the value belongs to.
   * @property values Values found in the file (more than one for repeated elements).
   * @property rawName Name as written in the file (may be an alias of [fieldName]).
   */
  data class Entry(val fieldName: String, val values: List<String>, val rawName: String)

  /**
   * Result of matching a document against the fields of the form.
   *
   * @property format Detected XML shape.
   * @property entries Fields of the form that were found — and can be written.
   * @property unknownFieldNames Names that occur in the file, but not in the form (never written).
   * @property matchedElements Number of XML elements that contributed a value.
   */
  data class Plan(
      val format: Format,
      val entries: List<Entry>,
      val unknownFieldNames: List<String>,
      val matchedElements: Int,
      /** Fields that WERE in the file but are excluded from importing. */
      val excludedFieldNames: List<String> = emptyList(),
  ) {
    /** `true` when the file contains not a single value for a field of this form. */
    val isEmpty: Boolean
      get() = entries.isEmpty()
  }

  /**
   * Parses [file] into a DOM document with entity expansion and external DTDs disabled (XXE).
   *
   * @throws Exception when the file is not well-formed XML.
   */
  fun parse(file: File): Document = file.readBytes().let(::parse)

  /**
   * Parses [bytes] into a DOM document with entity expansion and external DTDs disabled (XXE).
   *
   * @throws Exception when the content is not well-formed XML.
   */
  fun parse(bytes: ByteArray): Document {
    val factory = DocumentBuilderFactory.newInstance()
    factory.isNamespaceAware = false
    factory.isExpandEntityReferences = false
    runCatching { factory.isXIncludeAware = false }
    setFeature(factory, "http://apache.org/xml/features/disallow-doctype-decl", true)
    setFeature(factory, "http://xml.org/sax/features/external-general-entities", false)
    setFeature(factory, "http://xml.org/sax/features/external-parameter-entities", false)
    setFeature(factory, "http://apache.org/xml/features/nonvalidating/load-external-dtd", false)
    val builder = factory.newDocumentBuilder()
    builder.setErrorHandler(ThrowingErrorHandler)
    return builder.parse(ByteArrayInputStream(bytes))
  }

  private fun setFeature(factory: DocumentBuilderFactory, feature: String, value: Boolean) {
    runCatching { factory.setFeature(feature, value) }
  }

  /**
   * Matches the values of [document] against [knownFieldNames] and returns what can be imported.
   *
   * @param document Parsed XML file (see [parse]).
   * @param knownFieldNames Technical names of the form's elements (field name source of truth).
   * @param aliasToFieldName Optional alias → technical name mapping (`IFormDataAdapter` alias map).
   * @param options Read options, see [Options].
   */
  fun plan(
      document: Document,
      knownFieldNames: Set<String>,
      aliasToFieldName: Map<String, String> = emptyMap(),
      options: Options = Options(),
  ): Plan {
    val collector = Collector(knownFieldNames, aliasToFieldName, options)
    val fieldElements = collectFormcycleFields(document)
    if (fieldElements.isNotEmpty()) {
      for (element in fieldElements) {
        collector.add(
            element.getAttribute(FORMCYCLE_NAME_ATTRIBUTE).orEmpty(), readFormcycleValues(element))
      }
      return collector.plan(Format.FORMCYCLE_XML)
    }
    for (element in collectLeafElements(document)) {
      val text = element.textContent.orEmpty()
      for ((rawName, value) in genericCandidates(element, collector.resolver, text)) {
        collector.add(rawName, listOf(value))
      }
    }
    return collector.plan(Format.GENERIC_XML)
  }

  /**
   * `true` when [rawText] is a FORMCYCLE **persistence** form-data document — the file written by
   * `FC_EXPORT_TO_PERSISTENCE`. That file is NOT a `<xfc-data>` export: it is a java.beans
   * XMLEncoder/XMLDecoder document (`<java …><object class="java.util.HashMap">… <void
   * method="put">`), which is why the XML auto-import would otherwise find no field at all.
   */
  fun isPersistedFormData(rawText: String): Boolean =
      rawText.contains(PERSISTENCE_MARKER) ||
          (rawText.contains("<void") && rawText.contains("method=\"put\""))

  /**
   * Reads a FORMCYCLE **persistence** form-data document (see [isPersistedFormData]) into a `field
   * name -> values` map, using FORMCYCLE's own deserializer. Returns `null` when the text is not a
   * persistence document; an empty map when it is one but carries no field values.
   *
   * @param rawText Whole file content (UTF-8).
   */
  fun persistedValues(rawText: String): Map<String, List<String>>? {
    if (!isPersistedFormData(rawText)) return null
    val values =
        runCatching { FormDataUtils.deserializeFormData(rawText) }.getOrNull() ?: return emptyMap()
    return values
        .filterKeys { !it.startsWith(PERSISTENCE_RESERVED_PREFIX) }
        .mapValues { (_, list) -> list.filterNotNull() }
  }

  /**
   * Matches the values of a FORMCYCLE persistence document (see [persistedValues]) against the
   * fields of the form.
   *
   * @param values `field name -> values`, as returned by [persistedValues].
   * @param knownFieldNames Technical names of the form's elements (field name source of truth).
   * @param aliasToFieldName Optional alias → technical name mapping (`IFormDataAdapter` alias map).
   * @param options Read options, see [Options].
   */
  fun planPersisted(
      values: Map<String, List<String>>,
      knownFieldNames: Set<String>,
      aliasToFieldName: Map<String, String> = emptyMap(),
      options: Options = Options(),
  ): Plan {
    // Container bases that actually occur in the file — needed to recognise `<container>_dyn_size`
    // even when the form's container map is empty or names its containers differently.
    val dynamicBases =
        values.keys
            .mapNotNull { key ->
              when {
                key.endsWith(DYNAMIC_SIZE_SUFFIX) -> key.removeSuffix(DYNAMIC_SIZE_SUFFIX)
                else -> DYNAMIC_FIELD_PATTERN.matchEntire(key)?.groupValues?.get(1)
              }
            }
            .toSet()
    val collector = Collector(knownFieldNames, aliasToFieldName, options, dynamicBases)
    for ((name, list) in values) {
      collector.add(name, list)
    }
    return collector.plan(Format.PERSISTENCE_XML)
  }

  /** Collects the matched values of one document; shared by [plan] and [planPersisted]. */
  private class Collector(
      knownFieldNames: Set<String>,
      aliasToFieldName: Map<String, String>,
      private val options: Options,
      /** Container bases that occur in the document (see [planPersisted]). */
      private val dynamicBases: Set<String> = emptySet(),
  ) {
    val resolver: FieldResolver = FieldResolver(knownFieldNames, aliasToFieldName)
    private val excluded: Set<String> =
        options.excludedFieldNames
            .mapNotNull { resolver.resolve(it) ?: it.trim().takeIf(String::isNotEmpty) }
            .toSet()
    private val entries = LinkedHashMap<String, Entry>()
    private val unknown = LinkedHashSet<String>()
    private val excludedNames = LinkedHashSet<String>()
    private var matched = 0

    fun add(rawName: String, values: List<String>) {
      val clean = rawName.trim()
      if (clean.isEmpty()) return
      // Persisted repeatable containers: `<container>_dyn_size`, `<container>_dyn_<field>_<i>` and
      // `<field>_quest_<i>` are written VERBATIM — the form data adapter needs exactly those keys
      // to rebuild the container's rows and every repetition.
      val dynamic = dynamicKey(clean)
      if (dynamic != null) {
        if (dynamic.excluded) {
          excludedNames.add(dynamic.excludedField)
          return
        }
        matched += values.size.coerceAtLeast(1)
        entries[dynamic.key] = Entry(dynamic.key, effectiveValues(values), clean)
        return
      }
      val fieldName = resolver.resolve(clean)
      if (fieldName == null) {
        unknown.add(clean)
        return
      }
      if (excluded.contains(fieldName)) {
        excludedNames.add(fieldName)
        return
      }
      val effective = effectiveValues(values)
      matched += values.size.coerceAtLeast(1)
      val previous = entries[fieldName]
      entries[fieldName] =
          if (previous == null) Entry(fieldName, effective, clean)
          else previous.copy(values = previous.values + effective)
    }

    /** Trims the values and honours [Options.importRepeatedValues]. */
    private fun effectiveValues(values: List<String>): List<String> {
      val usable =
          values.mapNotNull { value -> value.let { if (options.trimValues) it.trim() else it } }
      return when {
        usable.isEmpty() -> listOf("")
        options.importRepeatedValues -> usable
        else -> usable.take(1)
      }
    }

    /**
     * A dynamic container key that must be written verbatim, or `null`.
     *
     * The FIELD part decides: as soon as the row field (or the repeated field) exists in the form,
     * the key is kept — no matter how the form names or registers its containers.
     * `<container>_dyn_size` is kept when the container is known OR when the document itself
     * contains `<container>_dyn_…` keys.
     */
    private fun dynamicKey(name: String): DynamicKey? {
      if (name.endsWith(DYNAMIC_SIZE_SUFFIX)) {
        val container = name.removeSuffix(DYNAMIC_SIZE_SUFFIX)
        val known =
            options.knownContainerNames.contains(container) || dynamicBases.contains(container)
        if (!known) return null
        return DynamicKey(name, excluded.contains(container), container)
      }
      DYNAMIC_FIELD_PATTERN.matchEntire(name)?.let { match ->
        val field = resolver.resolve(match.groupValues[2]) ?: return null
        return DynamicKey(name, excluded.contains(field), field)
      }
      QUESTION_INDEX_PATTERN.matchEntire(name)?.let { match ->
        val field = resolver.resolve(match.groupValues[1]) ?: return null
        return DynamicKey(name, excluded.contains(field), field)
      }
      return null
    }

    /** A verbatim key to write, plus whether its base field is excluded. */
    private class DynamicKey(
        val key: String,
        val excluded: Boolean,
        val excludedField: String,
    )

    fun plan(format: Format): Plan =
        Plan(format, entries.values.toList(), unknown.toList(), matched, excludedNames.toList())
  }

  /** All `field` elements of a FORMCYCLE form-data XML, in document order. */
  private fun collectFormcycleFields(document: Document): List<Element> {
    val nodes = document.getElementsByTagName("*")
    val elements = ArrayList<Element>()
    for (index in 0 until nodes.length) {
      val node = nodes.item(index)
      if (node is Element &&
          node.nodeName.equals(FORMCYCLE_FIELD_TAG, ignoreCase = true) &&
          node.getAttribute(FORMCYCLE_NAME_ATTRIBUTE).orEmpty().isNotBlank()) {
        elements.add(node)
      }
    }
    return elements
  }

  /** Values of one `field` element: `<values><value>…</value></values>` or `<plainValue>`. */
  private fun readFormcycleValues(field: Element): List<String> {
    val values = ArrayList<String>()
    forEachChildElement(field) { child ->
      if (child.nodeName.equals(FORMCYCLE_VALUES_TAG, ignoreCase = true)) {
        forEachChildElement(child) { value ->
          if (value.nodeName.equals(FORMCYCLE_VALUE_TAG, ignoreCase = true)) {
            values.add(value.textContent.orEmpty())
          }
        }
      }
    }
    if (values.isNotEmpty()) return values
    forEachChildElement(field) { child ->
      if (child.nodeName.equals(FORMCYCLE_PLAIN_VALUE_TAG, ignoreCase = true)) {
        values.add(child.textContent.orEmpty())
      }
    }
    if (values.isNotEmpty()) return values
    return listOf(field.textContent.orEmpty())
  }

  private fun forEachChildElement(parent: Element, action: (Element) -> Unit) {
    val children = parent.childNodes
    for (index in 0 until children.length) {
      val node = children.item(index)
      if (node is Element && node.nodeType == Node.ELEMENT_NODE) action(node)
    }
  }

  /** Leaf elements (no element children) of the whole document, in document order. */
  private fun collectLeafElements(document: Document): List<Element> {
    val nodes = document.getElementsByTagName("*")
    val elements = ArrayList<Element>()
    for (index in 0 until nodes.length) {
      val element = nodes.item(index) as? Element ?: continue
      if (!hasElementChild(element)) elements.add(element)
    }
    return elements
  }

  private fun hasElementChild(element: Element): Boolean {
    val children = element.childNodes
    for (index in 0 until children.length) {
      val node = children.item(index)
      if (node is Element && node.nodeType == Node.ELEMENT_NODE) return true
    }
    return false
  }

  /**
   * Field values a GENERIC XML element provides: its tag name (with the element text) and every
   * attribute whose name — or whose value — is the technical name of a form element.
   */
  private fun genericCandidates(
      element: Element,
      resolver: FieldResolver,
      text: String,
  ): List<Pair<String, String>> {
    val result = ArrayList<Pair<String, String>>()
    val tag = element.nodeName
    if (tag.isNotBlank() && resolver.resolve(tag) != null) result.add(tag to text)
    val attributes = element.attributes
    for (index in 0 until attributes.length) {
      val attribute = attributes.item(index) as? Attr ?: continue
      val name = attribute.name.orEmpty()
      val value = attribute.value.orEmpty()
      when {
        name.isNotBlank() && resolver.resolve(name) != null -> result.add(name to value)
        value.isNotBlank() && resolver.resolve(value) != null -> result.add(value to text)
      }
    }
    return result
  }

  /** Resolves a name from the file to the technical name of a form element. */
  private class FieldResolver(
      knownFieldNames: Set<String>,
      aliasToFieldName: Map<String, String>,
  ) {
    private val known: Set<String> = knownFieldNames.filter { it.isNotBlank() }.toSet()
    private val knownByLowerCase: Map<String, String> = known.associateBy { it.lowercase() }
    private val aliases: Map<String, String> =
        aliasToFieldName
            .filterKeys { it.isNotBlank() }
            .filterValues { it.isNotBlank() }
            .mapKeys { it.key.trim() }
    private val aliasByLowerCase: Map<String, String> = aliases.mapKeys { it.key.lowercase() }

    fun resolve(rawName: String): String? {
      val name = rawName.trim()
      if (name.isEmpty()) return null
      if (known.contains(name)) return name
      aliases[name]?.let {
        return it
      }
      knownByLowerCase[name.lowercase()]?.let {
        return it
      }
      return aliasByLowerCase[name.lowercase()]
    }
  }

  /** Aborts parsing on any XML error instead of silently printing it to `stderr`. */
  private object ThrowingErrorHandler : ErrorHandler {
    override fun warning(exception: SAXParseException) = Unit

    override fun error(exception: SAXParseException) = throw exception

    override fun fatalError(exception: SAXParseException) = throw exception
  }
}
