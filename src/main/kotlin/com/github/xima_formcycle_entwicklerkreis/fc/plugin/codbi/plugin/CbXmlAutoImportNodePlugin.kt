package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.workflow.XmlAutoImport
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants
import de.xima.fc.beans.interfaces.IGuiIcon
import de.xima.fc.entities.ProjektRessource
import de.xima.fc.interfaces.form.IFormDataAdapter
import de.xima.fc.interfaces.workflow.execution.INormalCompletionResult
import de.xima.fc.interfaces.workflow.mixin.IElementCategory
import de.xima.fc.interfaces.workflow.params.IGetElementPrototypesParams
import de.xima.fc.interfaces.workflow.params.INodeExecutionParams
import de.xima.fc.interfaces.workflow.retval.IResolvedFile
import de.xima.fc.interfaces.workflow.value.IValueDescriptor
import de.xima.fc.interfaces.workflow.value.IValueDescriptorFactory
import de.xima.fc.mdl.enums.ECommonFileSearchOptions
import de.xima.fc.mdl.ui.GuiIcon
import de.xima.fc.workflow.NodeKey
import de.xima.fc.workflow.UuidEntityRef
import de.xima.fc.workflow.mixin.APluginActionNodeHandler
import de.xima.fc.workflow.model.nodes.SingleFile
import de.xima.fc.workflow.taglib.model.ClientOpaqueColor
import java.util.Optional
import java.util.UUID
import org.slf4j.LoggerFactory

/**
 * Workflow node **cbXMLAutoImport**: reads an XML file and imports **every** value whose field
 * exists in the current form — without any per-field XPath mapping. Individual fields can be
 * excluded through the node's "Nicht zu setzende Werte" list.
 *
 * ```
 * [%$<node name>.RESULT.value%]           // human readable summary
 * [%$<node name>.RESULT.summary%]         // same as value
 * [%$<node name>.RESULT.format%]          // FORMCYCLE_XML or GENERIC_XML
 * [%$<node name>.RESULT.imported%]        // number of written fields
 * [%$<node name>.RESULT.excluded%]        // number of fields skipped through the exclusion list
 * [%$<node name>.RESULT.skipped%]         // number of fields kept (overwriteExisting=false)
 * [%$<node name>.RESULT.unknown%]         // number of values in the file that the form does not have
 * [%$<node name>.RESULT.fields%]          // list of "<field>=<value>" lines
 * [%$<node name>.RESULT.unknownFields%]   // names from the file that could not be matched
 * [%$<node name>.RESULT.excludedFields%]  // fields that were in the file but are excluded
 * ```
 *
 * Supported input formats (detected automatically):
 * - FORMCYCLE form-data XML (`xfc-data`, fields as `<field name="…"><plainValue>` /
 *   `<values><value>`), i.e. exactly what `FC_EXPORT_TO_XML` writes;
 * - generic XML where the element name or a `name`/`fieldName`/`technicalId`/`id` attribute matches
 *   a form element.
 *
 * Supported sources: a form upload element, a file of the form's file management, the file of a
 * previous workflow node, or an external URL — both through the designer's
 * `sourceType`/`sourceIdentifier` pair and through a FORMCYCLE-compatible `xmlSource`
 * (`SingleFile`).
 *
 * The node writes the values through [IFormDataAdapter.addRequestValue] and then persists the
 * record — the same mechanism `FC_IMPORT_FORM_VALUE_FROM_XML` uses, so aliases, repeated containers
 * and the form's own validation/persistence keep working.
 *
 * @since 1.1.0
 */
class CbXmlAutoImportNodePlugin : APluginActionNodeHandler<CbXmlAutoImportNodeProps>() {

  /** Registered node type — also the persisted `WorkflowNode` type. */
  override fun getName(): String = NODE_TYPE

  override fun getPropertiesViewXhtmlName(): String = PROPERTIES_VIEW

  override fun getMainCategory(params: IGetElementPrototypesParams): IElementCategory =
      ECodbiWorkflowElementCategory.MAIN_CODBI

  override fun getSubCategory(params: IGetElementPrototypesParams): IElementCategory =
      ECodbiWorkflowElementCategory.SUB_CODBI_XML

  /** Same icon the built-in "Import from XML" node uses. */
  override fun getPrototypeIcon(params: IGetElementPrototypesParams): IGuiIcon =
      GuiIcon.valueOf("ico-fc-file-xml")

  /** Dark-orange node accent in the workflow designer, matching the CodBi brand colour. */
  override fun getThemeColor(): ClientOpaqueColor = ClientOpaqueColor.ofRgb(255, 140, 0)

  override fun getResourceBundlePath(): String = Constants.RESOURCE_PATH_BUNDLE.removePrefix("/")

  override fun getSuccessValueDescriptor(factory: IValueDescriptorFactory): IValueDescriptor<*, *> =
      factory
          .recordBuilder()
          .optionalProperty("value", factory.string())
          .optionalProperty("summary", factory.string())
          .optionalProperty("format", factory.string())
          .optionalProperty("imported", factory.string())
          .optionalProperty("excluded", factory.string())
          .optionalProperty("skipped", factory.string())
          .optionalProperty("unknown", factory.string())
          .optionalProperty("fields", factory.listOfStrings())
          .optionalProperty("unknownFields", factory.listOfStrings())
          .optionalProperty("excludedFields", factory.listOfStrings())
          .build()

  override fun execute(
      params: INodeExecutionParams<CbXmlAutoImportNodeProps>
  ): INormalCompletionResult {
    val props = params.data
    val context = params.workflowContext
    val adapter = context.env().formDataAdapter

    logger.info(
        "[CodBi][XmlAutoImport] execute node='{}' sourceType='{}' identifier='{}' excluded={} overwrite={} trim={} repeats={} dryRun={}",
        props.name,
        props.sourceType,
        props.sourceIdentifier,
        props.excludedFields?.size,
        props.overwriteExisting,
        props.trimValues,
        props.importRepeatedValues,
        props.dryRun)

    val source = resolveSource(props)
    if (source == null) {
      logger.warn(
          "[CodBi][XmlAutoImport] node='{}' has no usable XML source (type='{}', identifier='{}')",
          props.name,
          props.sourceType,
          props.sourceIdentifier)
      params.softError(
          "SOURCE_REQUIRED",
          "Please configure the XML source: an upload element, a form file, a previous node or a URL.",
          emptyMap<String, Any>())
      return params.normalResult().build()
    }

    val file =
        try {
          val resolved: Optional<IResolvedFile> =
              context
                  .file()
                  .resolveReferencedFiles(params.node, source, ECommonFileSearchOptions.GENERIC)
                  .collectResult(params.standardFileErrorsSingle(false))
          resolved.map { it.file }.orElse(null)
        } catch (e: Exception) {
          logger.warn(
              "[CodBi][XmlAutoImport] node='{}' could not resolve the source: {}",
              props.name,
              e.message)
          logger.warn("[CodBi][XmlAutoImport] source resolution failure details", e)
          params.softError(
              "SOURCE_UNREADABLE",
              "The configured XML source could not be read: ${e.message}",
              emptyMap<String, Any>(),
              e)
          return params.normalResult().build()
        }

    if (file == null) {
      logger.warn(
          "[CodBi][XmlAutoImport] node='{}' found no file for the configured source", props.name)
      params.softError(
          "SOURCE_NOT_FOUND",
          "No file was found for the configured XML source.",
          emptyMap<String, Any>())
      return params.normalResult().build()
    }

    val writableFields = knownFieldNames(adapter)
    val aliases = runCatching { adapter.aliasFieldMap }.getOrDefault(emptyMap())
    val containers = knownContainerNames(adapter)
    val options =
        XmlAutoImport.Options(
            trimValues = props.trimValues,
            importRepeatedValues = props.importRepeatedValues,
            excludedFieldNames = props.excludedFields.orEmpty().toSet(),
            knownContainerNames = containers)
    // INFO on purpose: without these lines an "import did nothing" report cannot be diagnosed
    // (wrong source, wrong file, wrong format or an empty form field set).
    logger.info(
        "[CodBi][XmlAutoImport] node='{}' source file='{}' ({} bytes), form has {} writable field(s), " +
            "{} repeatable container(s) (aliases: {}), excluded={}, overwrite={}, repeats={}",
        props.name,
        file.absolutePath,
        file.length(),
        writableFields.size,
        containers.size,
        aliases.size,
        options.excludedFieldNames,
        props.overwriteExisting,
        props.importRepeatedValues)

    val plan =
        try {
          val bytes = file.readBytes()
          val rawText = String(bytes, Charsets.UTF_8)
          val persisted = XmlAutoImport.persistedValues(rawText)
          if (persisted != null) {
            logger.info(
                "[CodBi][XmlAutoImport] node='{}' detected FORMCYCLE PERSISTENCE form data " +
                    "(FC_EXPORT_TO_PERSISTENCE) with {} field(s)",
                props.name,
                persisted.size)
            logger.debug(
                "[CodBi][XmlAutoImport] node='{}' persisted field names: {}",
                props.name,
                persisted.keys.take(MAX_LOGGED_NAMES))
            XmlAutoImport.planPersisted(persisted, writableFields, aliases, options)
          } else {
            val document = XmlAutoImport.parse(bytes)
            val xmlPlan = XmlAutoImport.plan(document, writableFields, aliases, options)
            logger.info(
                "[CodBi][XmlAutoImport] node='{}' detected {} (root='{}') with {} matched field(s)",
                props.name,
                xmlPlan.format,
                document.documentElement?.nodeName,
                xmlPlan.entries.size)
            xmlPlan
          }
        } catch (e: Exception) {
          logger.warn(
              "[CodBi][XmlAutoImport] node='{}' could not parse '{}': {}",
              props.name,
              file.name,
              e.message)
          logger.warn("[CodBi][XmlAutoImport] XML parser failure details", e)
          params.softError(
              "XML_PARSE_ERROR",
              "The XML file could not be parsed: ${e.message}",
              emptyMap<String, Any>(),
              e)
          return params.normalResult().build()
        }

    logger.info(
        "[CodBi][XmlAutoImport] node='{}' plan: format={} matchedElements={} entries={} excluded={} unknown={}",
        props.name,
        plan.format,
        plan.matchedElements,
        plan.entries.size,
        plan.excludedFieldNames.size,
        plan.unknownFieldNames.size)

    // INFO on purpose: the exact field/value pairs are what the admin needs to compare against the
    // form after the redirect (see MAX_LOGGED_NAMES).
    plan.entries.take(MAX_LOGGED_NAMES).forEach { entry ->
      logger.info(
          "[CodBi][XmlAutoImport] node='{}'   {} <- '{}'",
          props.name,
          entry.fieldName,
          entry.values.joinToString(VALUE_SEPARATOR))
    }
    if (plan.entries.size > MAX_LOGGED_NAMES) {
      logger.info(
          "[CodBi][XmlAutoImport] node='{}'   … {} more field(s) not logged",
          props.name,
          plan.entries.size - MAX_LOGGED_NAMES)
    }
    if (plan.unknownFieldNames.isNotEmpty()) {
      logger.info(
          "[CodBi][XmlAutoImport] node='{}' values without a matching form field: {}",
          props.name,
          plan.unknownFieldNames.take(MAX_LOGGED_NAMES))
    }
    if (plan.excludedFieldNames.isNotEmpty()) {
      logger.info(
          "[CodBi][XmlAutoImport] node='{}' fields excluded by configuration: {}",
          props.name,
          plan.excludedFieldNames.take(MAX_LOGGED_NAMES))
    }

    val importedFields = ArrayList<String>(plan.entries.size)
    val skippedFields = ArrayList<String>()
    var applied = 0
    for (entry in plan.entries) {
      val values = if (props.importRepeatedValues) entry.values else entry.values.take(1)
      if (!props.overwriteExisting && !isBlank(adapter, entry.fieldName)) {
        logger.debug(
            "[CodBi][XmlAutoImport] node='{}' keeps existing value of field '{}'",
            props.name,
            entry.fieldName)
        skippedFields.add(entry.fieldName)
        continue
      }
      if (!props.dryRun) {
        adapter.addRequestValue(entry.fieldName, values)
        applied++
      }
      importedFields.add("${entry.fieldName}=${values.joinToString(VALUE_SEPARATOR)}")
    }

    if (!props.dryRun && applied > 0) {
      val recordId =
          runCatching {
                context.env().formRecord?.let { it.javaClass.getMethod("getId").invoke(it) }
              }
              .getOrNull()
      logger.info(
          "[CodBi][XmlAutoImport] node='{}' writing {} field(s) into form record {} and persisting",
          props.name,
          applied,
          recordId ?: "?")
      context.form().markFormDataChanged()
      context.form().persistFormRecord()
      logger.info(
          "[CodBi][XmlAutoImport] node='{}' form record {} persisted", props.name, recordId ?: "?")
    } else if (!props.dryRun) {
      logger.info(
          "[CodBi][XmlAutoImport] node='{}' nothing to write (applied=0) — record left unchanged",
          props.name)
    }

    val summary = buildString {
      append(if (props.dryRun) "checked " else "imported ")
      append(importedFields.size)
      append(" field(s) from ")
      append(file.name)
      if (plan.excludedFieldNames.isNotEmpty()) {
        append(", excluded ")
        append(plan.excludedFieldNames.size)
      }
      if (skippedFields.isNotEmpty()) {
        append(", kept ")
        append(skippedFields.size)
        append(" existing field(s)")
      }
      if (plan.unknownFieldNames.isNotEmpty()) {
        append(", ")
        append(plan.unknownFieldNames.size)
        append(" value(s) without a matching field")
      }
    }

    logger.info(
        "[CodBi][XmlAutoImport] node='{}' {} (format={}, imported={}, excluded={}, skipped={}, unknown={}, dryRun={})",
        props.name,
        summary,
        plan.format,
        importedFields.size,
        plan.excludedFieldNames.size,
        skippedFields.size,
        plan.unknownFieldNames.size,
        props.dryRun)

    if (plan.entries.isEmpty()) {
      logger.warn(
          "[CodBi][XmlAutoImport] node='{}' did not find a single value for a field of this form " +
              "(file='{}', format={})",
          props.name,
          file.name,
          plan.format)
      params.softError(
          "NO_MATCHING_FIELDS",
          "The XML file contains no value for a field of this form.",
          emptyMap<String, Any>())
    }

    return params
        .normalResult()
        .success { builder ->
          builder
              .asRecord()
              .property("value", summary)
              .property("summary", summary)
              .property("format", plan.format.name)
              .property("imported", importedFields.size.toString())
              .property("excluded", plan.excludedFieldNames.size.toString())
              .property("skipped", skippedFields.size.toString())
              .property("unknown", plan.unknownFieldNames.size.toString())
              .property("fields", importedFields)
              .property("unknownFields", plan.unknownFieldNames)
              .property("excludedFields", plan.excludedFieldNames)
              .build()
        }
        .build()
  }

  /**
   * Resolves the configured source. A FORMCYCLE-compatible [CbXmlAutoImportNodeProps.xmlSource]
   * wins; otherwise the designer's flat `sourceType`/`sourceIdentifier` pair is turned into a
   * [SingleFile].
   */
  private fun resolveSource(props: CbXmlAutoImportNodeProps): SingleFile? {
    val configured = props.xmlSource
    if (configured != null && hasReference(configured)) return configured
    val identifier = props.sourceIdentifier.orEmpty().trim()
    if (identifier.isEmpty()) return null
    return try {
      when (props.sourceType) {
        CbXmlAutoImportNodeProps.SOURCE_TYPE_UPLOAD -> SingleFile.forUploadElement(identifier)
        CbXmlAutoImportNodeProps.SOURCE_TYPE_URL -> SingleFile.forExternal(identifier)
        CbXmlAutoImportNodeProps.SOURCE_TYPE_FORM_RESOURCE -> formResourceSource(identifier)
        CbXmlAutoImportNodeProps.SOURCE_TYPE_PREVIOUS_NODE ->
            SingleFile.forWorkflowNode(NodeKey.of(identifier))
        else -> null
      }
    } catch (e: Exception) {
      logger.warn(
          "[CodBi][XmlAutoImport] node='{}' cannot build source type '{}' from '{}': {}",
          props.name,
          props.sourceType,
          identifier,
          e.message)
      null
    }
  }

  /** Builds a form-file source from the UUID of a `ProjektRessource`. */
  private fun formResourceSource(uuidText: String): SingleFile {
    val reference = UuidEntityRef.forUuid(UUID.fromString(uuidText), ProjektRessource::class.java)
    val source = SingleFile()
    source.resource = formFileItem(reference)
    return source
  }

  /** `ResourceItem.forFormFile(ref)` — split out so the nested type cannot break the call site. */
  private fun formFileItem(reference: UuidEntityRef) =
      de.xima.fc.mdl.resource.ResourceItem.forFormFile(reference)

  /** Whether the FORMCYCLE file reference actually points at something. */
  private fun hasReference(source: SingleFile): Boolean =
      source.resource != null ||
          !source.url.isNullOrBlank() ||
          !source.searchFilename.isNullOrBlank()

  /** All names the form can write to: metadata names, submitted values and alias targets. */
  private fun knownFieldNames(adapter: IFormDataAdapter): Set<String> {
    val names = LinkedHashSet<String>()
    runCatching { adapter.iFieldMetaDataMap }.getOrNull()?.keys?.let(names::addAll)
    runCatching { adapter.fieldValuesMap }.getOrNull()?.keys?.let(names::addAll)
    runCatching { adapter.aliasFieldMap }.getOrNull()?.values?.let(names::addAll)
    return names
  }

  /**
   * Technical names of the form's repeatable containers (`IFormDataAdapter.getDynContainerMap`).
   * They are needed to recognise the persisted `<container>_dyn_size` /
   * `<container>_dyn_<field>_<index>` keys of a repeatable container.
   */
  private fun knownContainerNames(adapter: IFormDataAdapter): Set<String> {
    val names = LinkedHashSet<String>()
    runCatching { adapter.iDynContainerMap }.getOrNull()?.keys?.let(names::addAll)
    runCatching { adapter.dynContainerMap }.getOrNull()?.keys?.let(names::addAll)
    return names
  }

  /** `true` when the field currently holds a visible value. */
  private fun isBlank(adapter: IFormDataAdapter, fieldName: String): Boolean =
      runCatching { adapter.getStringValue(fieldName) }.getOrNull().isNullOrBlank()

  private companion object {
    /** Registered node type (= persisted `WorkflowNode` type). */
    const val NODE_TYPE = "cbXMLAutoImport"

    /** Properties view rendered by the workflow designer. */
    const val PROPERTIES_VIEW = "CbXmlAutoImportNode.xhtml"

    /** Separator used when several values of a repeated element are logged/reported. */
    const val VALUE_SEPARATOR = " | "

    /** Upper bound of field names written to the debug log. */
    const val MAX_LOGGED_NAMES = 20

    val logger = LoggerFactory.getLogger(CbXmlAutoImportNodePlugin::class.java)
  }
}
