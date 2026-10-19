package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.MirrorFormAccess
import com.google.gson.GsonBuilder
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import org.slf4j.LoggerFactory

/**
 * Deterministic COPY of form elements that live in ANOTHER form.
 *
 * The assistant never re-authors a foreign element when the user chose COPY. Instead it emits one
 * top-level `_copyElements` directive:
 * ```
 * "_copyElements": [
 *   {"formKey":"project-3","element":"xi-div6","elementKey":"div6",
 *    "formName":"Meldeformular …","parentid":"p1","name":"div6","after":"tfExisting"}
 * ]
 * ```
 *
 * The server then reads the FULL source subtree through [MirrorFormAccess.mirrorSubtree] (the same
 * access layer the XMirror widget uses) and clones it into the current form:
 * - every node keeps its `className` and its complete `properties` (label, options, validation,
 *   `cssclasses`, `attributes`/CodBi wiring, repeatable flags, …),
 * - the hierarchy is rebuilt through `parentid` and the containers' `elements` arrays,
 * - ids and names are made unique in the target form; field names are namespaced with the copied
 *   root's name so they cannot collide with existing fields,
 * - references INSIDE the copied subtree (`[%field%]` placeholders, `hiddenif`/`readonlyif`/
 *   `requiredif`, data-cb-* selectors) are remapped to the new names/ids.
 *
 * This keeps the AI's output tiny and guarantees a faithful copy instead of a best-effort
 * re-creation from the compact element digest.
 */
internal object ForeignElementCopy {

  private val logger = LoggerFactory.getLogger(ForeignElementCopy::class.java)
  // HTML-bearing copied properties (rtevalue, helptext) must never be HTML-escaped on
  // re-serialization.
  private val gson = GsonBuilder().disableHtmlEscaping().create()

  /** Top-level AI marker carrying the copy requests. Consumed and removed by [apply]. */
  const val MARKER = "_copyElements"

  /** One requested copy. */
  internal data class CopySpec(
      val formKey: String,
      val element: String,
      val elementKey: String?,
      val formName: String?,
      val parent: String?,
      val name: String?,
      val after: String?,
      val before: String?,
  )

  /** Hierarchy/identity keys that are rebuilt for the copy instead of being copied verbatim. */
  private val STRUCTURAL_PROPS = setOf("name", "id", "parentid", "elements")

  /** Direct condition properties whose value is the CONTROLLING element's technical id. */
  private val REFERENCE_ID_KEYS = setOf("hiddenif", "readonlyif", "requiredif")

  /**
   * Applies every `_copyElements` directive to [formJson] and returns the modified form JSON.
   *
   * The marker is always stripped, even when copies cannot be resolved, so it can never leak into
   * the persisted form. Copy failures are logged and skipped; the rest of the AI's change stays
   * intact.
   */
  fun apply(formJson: String, userContext: Any?): String {
    val root =
        runCatching { JsonParser.parseString(formJson).asJsonObject }.getOrNull() ?: return formJson
    val raw = root.remove(MARKER) ?: return formJson
    val specs =
        if (raw.isJsonArray) raw.asJsonArray.mapNotNull { parseSpec(it) }
        else {
          // Tolerate the single-object shortcut on small models.
          listOfNotNull(parseSpec(raw))
        }
    if (specs.isEmpty()) return gson.toJson(root)
    if (userContext == null) {
      logger.warn(
          "[ForeignElementCopy] {} copy request(s) ignored: no user context available", specs.size)
      return gson.toJson(root)
    }
    var copied = 0
    for (spec in specs) {
      val subtree =
          runCatching { resolveSourceSubtree(userContext, spec) }
              .onFailure {
                logger.warn(
                    "[ForeignElementCopy] Reading source '{}/{}' failed: {}",
                    spec.formKey,
                    spec.element,
                    it.message)
              }
              .getOrNull()
      if (subtree == null || subtree.nodes.isEmpty()) {
        logger.warn(
            "[ForeignElementCopy] Source element '{}' was not found in form '{}' — copy skipped",
            spec.element,
            spec.formKey)
        continue
      }
      copied +=
          runCatching { copySubtree(root, spec, subtree.nodes) }
              .onFailure {
                logger.warn(
                    "[ForeignElementCopy] Copying '{}' from '{}' failed: {}",
                    spec.element,
                    spec.formKey,
                    it.message)
              }
              .getOrDefault(0)
    }
    logger.info("[ForeignElementCopy] {} item(s) copied from {} request(s)", copied, specs.size)
    return gson.toJson(root)
  }

  /**
   * Resolves the source subtree. FORMCYCLE's technical `id` / `name` are matched EXACTLY first;
   * when that fails, a case-insensitive name or the element's display LABEL is accepted as a
   * fallback (e.g. "Div 6" → `div6`). The label is only a convenience for the copy path — the
   * Mirror widget itself keeps its strict technical-name matching.
   */
  private fun resolveSourceSubtree(
      userContext: Any,
      spec: CopySpec
  ): MirrorFormAccess.MirrorSubtree? {
    MirrorFormAccess.mirrorSubtree(
            userContext, spec.formKey, spec.element, spec.formName, spec.elementKey)
        ?.let {
          return it
        }
    val elements =
        runCatching { MirrorFormAccess.listElements(userContext, spec.formKey, spec.formName) }
            .getOrDefault(emptyList())
    if (elements.isEmpty()) return null
    val wanted =
        listOfNotNull(spec.element, spec.elementKey)
            .map { normalizeLookup(it) }
            .filter { it.isNotEmpty() }
    if (wanted.isEmpty()) return null
    val match =
        elements.firstOrNull { e ->
          listOf(e.id, e.name, e.label).any { candidate -> normalizeLookup(candidate) in wanted }
        } ?: return null
    logger.info(
        "[ForeignElementCopy] Source '{}' resolved by label/name to '{}' ({})",
        spec.element,
        match.name,
        match.id)
    return MirrorFormAccess.mirrorSubtree(
        userContext, spec.formKey, match.id.ifBlank { match.name }, spec.formName, match.name)
  }

  /**
   * Normalizes an element name/label for the tolerant fallback lookup
   * (case/punctuation-insensitive).
   */
  private fun normalizeLookup(raw: String): String =
      raw.lowercase().replace(Regex("[^a-z0-9]+"), "")

  private fun parseSpec(el: JsonElement): CopySpec? {
    if (!el.isJsonObject) return null
    val o = el.asJsonObject
    fun str(vararg keys: String): String? {
      for (key in keys) {
        val v = o.get(key)?.takeIf { it.isJsonPrimitive }?.asString?.trim()
        if (!v.isNullOrEmpty()) return v
      }
      return null
    }
    val formKey = str("formKey", "form") ?: return null
    val element = str("element", "elementId", "elementRef") ?: return null
    if (formKey.contains('<') ||
        formKey.contains('>') ||
        element.contains('<') ||
        element.contains('>')) {
      // A template value copied verbatim (e.g. "project-<sourceFormId>") means the build pass never
      // received the real cross-form context. Refuse it instead of querying a bogus form.
      logger.warn(
          "[ForeignElementCopy] Copy directive contains a template placeholder (formKey='{}', element='{}') — ignored",
          formKey,
          element)
      return null
    }
    return CopySpec(
        formKey = formKey,
        element = element,
        elementKey = str("elementKey"),
        formName = str("formName"),
        parent = str("parentid", "parent"),
        name = str("name"),
        after = str("after"),
        before = str("before"))
  }

  /**
   * Clones [nodes] (parents before children, as returned by [MirrorFormAccess.mirrorSubtree]) into
   * [root]'s `items` array, under [CopySpec.parent] (or the first XPage when omitted).
   *
   * @return the number of created items (0 when the spec cannot be placed).
   */
  internal fun copySubtree(
      root: JsonObject,
      spec: CopySpec,
      nodes: List<MirrorFormAccess.MirrorNode>
  ): Int {
    val rootNode = nodes.firstOrNull() ?: return 0
    val items = root.getAsJsonArray("items") ?: JsonArray().also { root.add("items", it) }
    val rootIsPage = rootNode.className.equals("XPage", true)
    val rootIsHeaderOrFooter =
        rootNode.className.equals("XHeader", true) || rootNode.className.equals("XFooter", true)
    if (rootIsHeaderOrFooter) {
      logger.warn(
          "[ForeignElementCopy] Refusing to copy '{}' (a form may have only one {})",
          rootNode.name,
          rootNode.className)
      return 0
    }
    val parentItem = if (rootIsPage) null else resolveParent(root, items, spec.parent)
    // FORMCYCLE's `parentid` must reference the parent's technical ID (xi-…), never its name —
    // a name-based parentid leaves the child unattached and the form renders empty.
    val parentId = parentItem?.let { itemIdOf(it) ?: itemNameOf(it) }
    // An XMirror's children are designer-generated hidden placeholder copies; the widget itself
    // renders the source live. Copying only the widget avoids duplicating those hidden items.
    val nodesToCopy = if (rootNode.className.equals("XMirror", true)) listOf(rootNode) else nodes

    val usedNames = collectItemNames(root).toMutableSet()
    val usedIds = collectItemIds(root).toMutableSet()
    val rootName =
        uniqueName(usedNames, sanitizeName(spec.name ?: rootNode.name.ifBlank { "copyElement" }))
    usedNames.add(rootName)

    val newByRef = LinkedHashMap<String, JsonObject>()
    var created = 0
    for (node in nodesToCopy) {
      val isRoot = node.ref == rootNode.ref
      val sourceProps = toGsonProperties(node)
      val newName =
          if (isRoot) rootName
          else uniqueName(usedNames, rootName + "_" + sanitizeName(node.name.ifBlank { node.ref }))
      usedNames.add(newName)
      val newId = uniqueId(usedIds, "xi-" + sanitizeId(newName))
      usedIds.add(newId)

      // A Mirror-generated placeholder copy is hidden/disabled only so it never submits twice; a
      // COPY of such a node is a real field again, so those artifact flags are removed. A normal
      // source field's own `isdisabled` is preserved verbatim.
      val mirrorGenerated = sourceProps.has("codbi_mirror_owner")
      val props = JsonObject()
      for ((key, value) in sourceProps.entrySet()) {
        if (key in STRUCTURAL_PROPS || key == "formerProps" || key == "codbi_mirror_owner") continue
        if (key == "rowid") {
          val row = value.takeIf { it.isJsonPrimitive }?.asString?.trim()
          if (!row.isNullOrEmpty()) props.addProperty("rowid", rootName + "_" + row)
          continue
        }
        props.add(key, value.deepCopy())
      }
      if (mirrorGenerated) {
        props.remove("isdisabled")
        props.removeCssClass("codbi-mirror-copy")
      }
      props.addProperty("name", newName)
      props.addProperty("id", newId)
      val isPage = node.className.equals("XPage", true)
      val newParentId =
          when {
            isPage -> null
            isRoot -> parentId
            else -> node.parentRef?.let { newByRef[it] }?.let { itemIdOf(it) ?: itemNameOf(it) }
          }
      if (!newParentId.isNullOrBlank()) props.addProperty("parentid", newParentId)
      // `elements` is rebuilt from the copied children below (appendToElements creates it); never
      // keep the source form's child-name references.

      val item = JsonObject()
      item.addProperty("className", node.className)
      item.add("properties", props)
      items.add(item)
      newByRef[node.ref] = item
      created++

      if (isRoot) {
        if (!isPage && parentItem != null) insertIntoElements(parentItem, newName, spec)
      } else {
        node.parentRef?.let { pref -> newByRef[pref]?.let { appendToElements(it, newName) } }
      }
    }

    if (!rootNode.className.equals("XMirror", true)) {
      remapReferences(newByRef, nodesToCopy)
    }
    logger.info(
        "[ForeignElementCopy] Copied '{}' from '{}' as '{}' ({} item(s))",
        rootNode.name,
        spec.formKey,
        rootName,
        created)
    return created
  }

  /** Resolves the target page/container by technical name or id; defaults to the first XPage. */
  private fun resolveParent(root: JsonObject, items: JsonArray, requested: String?): JsonObject? {
    if (!requested.isNullOrBlank()) {
      for (el in items) {
        if (!el.isJsonObject) continue
        val item = el.asJsonObject
        if (itemNameOf(item) == requested || itemIdOf(item) == requested) return item
      }
      logger.warn(
          "[ForeignElementCopy] Target parent '{}' not found — placing the copy on the first page",
          requested)
    }
    for (el in items) {
      if (!el.isJsonObject) continue
      val item = el.asJsonObject
      if (item.get("className")?.takeIf { it.isJsonPrimitive }?.asString == "XPage") return item
    }
    return null
  }

  /**
   * Inserts [childName] into [parentItem]'s `properties.elements` — appended by default, or
   * directly after/before the sibling named by `spec.after` / `spec.before`.
   */
  private fun insertIntoElements(parentItem: JsonObject, childName: String, spec: CopySpec) {
    val props =
        parentItem.getAsJsonObject("properties")
            ?: JsonObject().also { parentItem.add("properties", it) }
    val elements =
        props.getAsJsonArray("elements") ?: JsonArray().also { props.add("elements", it) }
    if (elements.any { it.isJsonPrimitive && it.asString == childName }) return
    val after = spec.after?.takeIf { it.isNotBlank() }
    val before = spec.before?.takeIf { it.isNotBlank() }
    var index = elements.size()
    if (after != null) {
      elements.forEachIndexed { i, el ->
        if (el.isJsonPrimitive && el.asString == after) index = i + 1
      }
    } else if (before != null) {
      elements.forEachIndexed { i, el ->
        if (el.isJsonPrimitive && el.asString == before) index = i
      }
    }
    if (index < 0) index = 0
    if (index > elements.size()) index = elements.size()
    // Gson's JsonArray has no insert(at, element): rebuild the array with the new name at [index].
    val rebuilt = JsonArray()
    elements.forEachIndexed { i, el ->
      if (i == index) rebuilt.add(com.google.gson.JsonPrimitive(childName))
      rebuilt.add(el)
    }
    if (index >= elements.size()) rebuilt.add(com.google.gson.JsonPrimitive(childName))
    props.add("elements", rebuilt)
  }

  /** Appends [childName] to a copied container's `properties.elements` (no duplicates). */
  private fun appendToElements(parentItem: JsonObject, childName: String) {
    val props =
        parentItem.getAsJsonObject("properties")
            ?: JsonObject().also { parentItem.add("properties", it) }
    val elements =
        props.getAsJsonArray("elements") ?: JsonArray().also { props.add("elements", it) }
    if (elements.none { it.isJsonPrimitive && it.asString == childName }) {
      elements.add(com.google.gson.JsonPrimitive(childName))
    }
  }

  /**
   * Remaps references INSIDE the copied subtree from the source names/ids to the new ones:
   * - `[%fieldName%]` placeholders in any string property or attribute value,
   * - exact ids in `hiddenif` / `readonlyif` / `requiredif`,
   * - `.fieldName` selectors in `data-cb-*` attribute values.
   *
   * References to fields OUTSIDE the copied subtree stay unchanged — a copy cannot bring external
   * dependencies along.
   */
  private fun remapReferences(
      newByRef: Map<String, JsonObject>,
      nodes: List<MirrorFormAccess.MirrorNode>
  ) {
    val nameMap = LinkedHashMap<String, String>()
    val idMap = LinkedHashMap<String, String>()
    for (node in nodes) {
      val item = newByRef[node.ref] ?: continue
      val props = item.getAsJsonObject("properties") ?: continue
      val oldName = node.name
      val newName = props.get("name")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
      val oldId = node.properties.getString("id").orEmpty().ifBlank { node.name }
      val newId = props.get("id")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
      if (oldName.isNotBlank()) nameMap[oldName] = newName
      if (oldId.isNotBlank()) idMap[oldId] = newId
    }
    if (nameMap.isEmpty() && idMap.isEmpty()) return
    for (item in newByRef.values) {
      val props = item.getAsJsonObject("properties") ?: continue
      for (key in props.keySet().toList()) {
        if (key in STRUCTURAL_PROPS || key.startsWith("codbi_mirror_")) continue
        val value = props.get(key) ?: continue
        when {
          value.isJsonPrimitive && value.asJsonPrimitive.isString -> {
            val remapped = remapString(value.asString, nameMap, idMap, key in REFERENCE_ID_KEYS)
            if (remapped != value.asString) props.addProperty(key, remapped)
          }
          key == "attributes" && value.isJsonArray ->
              remapAttributeValues(value.asJsonArray, nameMap, idMap)
        }
      }
    }
  }

  private fun remapAttributeValues(
      attributes: JsonArray,
      nameMap: Map<String, String>,
      idMap: Map<String, String>
  ) {
    for (el in attributes) {
      if (!el.isJsonObject) continue
      val entry = el.asJsonObject
      val raw = entry.get("value")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
      val remapped = remapString(raw, nameMap, idMap, exactId = false)
      if (remapped != raw) entry.addProperty("value", remapped)
    }
  }

  private fun remapString(
      value: String,
      nameMap: Map<String, String>,
      idMap: Map<String, String>,
      exactId: Boolean
  ): String {
    var out = value
    for ((old, new) in nameMap) {
      out = out.replace("[%$old%]", "[%$new%]")
      // CSS/selector references used by several CodBi functionalities (e.g. data-cb-field).
      out = out.replace(".$old", ".$new")
    }
    if (exactId) {
      for ((old, new) in idMap) {
        if (out == old) out = new
      }
    }
    return out
  }

  private fun JsonObject.removeCssClass(cssClass: String) {
    val classes = get("cssclasses")?.takeIf { it.isJsonArray }?.asJsonArray ?: return
    val kept = JsonArray()
    for (el in classes) {
      if (el.isJsonPrimitive && el.asString == cssClass) continue
      kept.add(el)
    }
    if (kept.size() == 0) remove("cssclasses") else add("cssclasses", kept)
  }

  private fun toGsonProperties(node: MirrorFormAccess.MirrorNode): JsonObject =
      JsonParser.parseString(node.properties.toJSONString()).asJsonObject

  private fun itemNameOf(item: JsonObject?): String? {
    if (item == null) return null
    val props = item.getAsJsonObject("properties")
    val name = props?.get("name")?.takeIf { it.isJsonPrimitive }?.asString
    return name?.takeIf { it.isNotBlank() }
  }

  private fun itemIdOf(item: JsonObject): String? {
    val props = item.getAsJsonObject("properties")
    val id = props?.get("id")?.takeIf { it.isJsonPrimitive }?.asString
    if (!id.isNullOrBlank()) return id
    return item.get("id")?.takeIf { it.isJsonPrimitive }?.asString?.takeIf { it.isNotBlank() }
  }

  private fun collectItemNames(root: JsonObject): Set<String> {
    val out = LinkedHashSet<String>()
    root.getAsJsonArray("items")?.forEach { el ->
      if (el.isJsonObject) itemNameOf(el.asJsonObject)?.let { out.add(it) }
    }
    return out
  }

  private fun collectItemIds(root: JsonObject): Set<String> {
    val out = LinkedHashSet<String>()
    root.getAsJsonArray("items")?.forEach { el ->
      if (el.isJsonObject) itemIdOf(el.asJsonObject)?.let { out.add(it) }
    }
    return out
  }

  internal fun sanitizeName(raw: String): String {
    val t = raw.trim().replace(Regex("[^A-Za-z0-9_]+"), "_").trim('_')
    val s = t.ifEmpty { "copyElement" }
    return if (s.first().isDigit()) "e$s" else s
  }

  internal fun sanitizeId(raw: String): String = sanitizeName(raw)

  internal fun uniqueName(used: Set<String>, base: String): String {
    if (base !in used) return base
    var i = 2
    while ("${base}_$i" in used) i++
    return "${base}_$i"
  }

  internal fun uniqueId(used: Set<String>, base: String): String {
    if (base !in used) return base
    var i = 2
    while ("${base}_$i" in used) i++
    return "${base}_$i"
  }
}
