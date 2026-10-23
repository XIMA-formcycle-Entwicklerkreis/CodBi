package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

/**
 * Repairs AI-generated workflow specs before they are persisted.
 *
 * Two real defects motivated this object (observed on a live build):
 * 1. **Node-type aliasing (the serious one).** A plugin node is registered under its handler's
 *    `getName()` — for CodBi's Extended Accessor that is `CodbiExtendedAccessor`, NOT the handler
 *    class name. The prompt also mentions the class name (needed to identify the handler), and the
 *    model duly emitted `com.github…CodbiExtendedAccessorNodePlugin` as its `nodeType`. formcycle
 *    persisted that string but then logged `Cannot validate node of kind
 *    '…CodbiExtendedAccessorNodePlugin', no handler was registered for that node` and could not
 *    analyse it — i.e. the node is dead weight in the workflow. A manually created node of the same
 *    type carries `ITEM_TYPE = 'CodbiExtendedAccessor'`.
 * 2. **Dangling node-result placeholders.** `[%$<taskName>.RESULT.value%]` refers to the node by
 *    its persisted name, and that name is sanitized (punctuation is stripped, so a taskName `"Mail
 *    an A@B.C senden"` becomes `"Mail an ABC senden"`). The placeholder kept the raw name and
 *    therefore resolved to nothing.
 * 3. **Wrong download node.** For an explicit DOWNLOAD intent the model sometimes emitted the older
 *    `FC_PROVIDE_RESOURCE` instead of `FC_RETURN_FILE`. A chained provide-resource node that
 *    targets a preceding node (`sourceNode`) is rewritten to `FC_RETURN_FILE`, which is the node
 *    that returns the produced file to the user's browser.
 *
 * Both repairs are pure string/map normalisation and are applied once, right after the AI response
 * is parsed — so every downstream path (creation, chained nodes, nested `_childNodes`) sees the
 * corrected spec.
 */
internal object WorkflowSpecNormalizer {

  /** The workflow-node type the Extended Accessor handler is REGISTERED under. */
  const val EXTENDED_ACCESSOR_NODE_TYPE = "CodbiExtendedAccessor"

  /** The handler class — an accepted alias only; never valid as a persisted `ITEM_TYPE`. */
  const val EXTENDED_ACCESSOR_HANDLER_CLASS =
      "com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.CodbiExtendedAccessorNodePlugin"

  /** Node collections that may hold further node objects (nested maps). */
  private val CHILD_COLLECTIONS =
      listOf(
          "chainedNodes",
          "_childNodes",
          "_handlerChildNodes",
          "nodes",
          "cases",
          "_cases",
          "children")

  /**
   * Maps every accepted spelling of a node type to the type formcycle actually resolves.
   *
   * Accepts the registered name, the handler class (fully qualified or as a trailing segment) and
   * the human display labels — the latter as a last-resort repair, because a display label as a
   * node type would otherwise create an unresolvable node.
   */
  fun canonicalNodeType(raw: String?): String {
    val type = raw?.trim().orEmpty()
    if (type.isEmpty()) return type
    return when {
      type == EXTENDED_ACCESSOR_NODE_TYPE -> EXTENDED_ACCESSOR_NODE_TYPE
      type == EXTENDED_ACCESSOR_HANDLER_CLASS -> EXTENDED_ACCESSOR_NODE_TYPE
      type.endsWith(".CodbiExtendedAccessorNodePlugin") -> EXTENDED_ACCESSOR_NODE_TYPE
      type.equals("Extended Accessor", ignoreCase = true) -> EXTENDED_ACCESSOR_NODE_TYPE
      type.equals("Erweiterter Zugriff", ignoreCase = true) -> EXTENDED_ACCESSOR_NODE_TYPE
      // Common misspelling of the import node: models often pluralise "VALUES". formcycle only
      // resolves the registered singular type.
      type.equals("FC_IMPORT_FORM_VALUES_FROM_XML", ignoreCase = true) ->
          "FC_IMPORT_FORM_VALUE_FROM_XML"
      type.equals("Import form values from XML", ignoreCase = true) ->
          "FC_IMPORT_FORM_VALUE_FROM_XML"
      type.equals("XML importieren", ignoreCase = true) -> "FC_IMPORT_FORM_VALUE_FROM_XML"
      // FC_RENEW_PROCESS_ID — the registered type plus its display labels in the four shipped
      // languages; a label used as a node type would create an unresolvable node.
      type.equals("FC_RENEW_PROCESSID", ignoreCase = true) -> "FC_RENEW_PROCESS_ID"
      type.equals("FC_RENEW_PROCESS_ID", ignoreCase = true) -> "FC_RENEW_PROCESS_ID"
      type.equals("Create new process ID", ignoreCase = true) -> "FC_RENEW_PROCESS_ID"
      type.equals("Neue Prozess-ID vergeben", ignoreCase = true) -> "FC_RENEW_PROCESS_ID"
      type.equals("Maak nieuw Process ID van formulier record", ignoreCase = true) ->
          "FC_RENEW_PROCESS_ID"
      type.equals("Assegnare un nuovo ID di processo", ignoreCase = true) -> "FC_RENEW_PROCESS_ID"
      else -> type
    }
  }

  /**
   * Mirrors the node/task name sanitisation applied when a workflow node is created, so a rename
   * computed here matches the name that is persisted.
   */
  fun sanitizeName(name: String): String =
      // \p{L}/\p{N} keep unicode letters (umlauts) and digits; formcycle additionally accepts
      // spaces, hyphens, round parentheses and underscores.
      name.replace(Regex("[^\\p{L}\\p{N} _\\-()]"), "").trim()

  /**
   * Collects `raw taskName -> sanitised node name` for every node object in [node] (including
   * chained/child nodes), so result placeholders can be rewritten.
   */
  fun collectRenames(node: Map<*, *>, into: MutableMap<String, String>) {
    val rawName =
        ((node["taskName"] ?: node["taskname"] ?: node["name"]) as? String)?.trim().orEmpty()
    if (rawName.isNotEmpty()) {
      val sanitised = sanitizeName(rawName)
      if (sanitised.isNotEmpty() && sanitised != rawName) into[rawName] = sanitised
    }
    for (key in CHILD_COLLECTIONS) {
      (node[key] as? List<*>)?.forEach { child ->
        if (child is Map<*, *>) collectRenames(child, into)
      }
    }
  }

  /**
   * Returns a normalised copy of [node]: node types are canonicalised and every string (at any
   * nesting depth) has its `[%$<raw name>.RESULT…%]` references rewritten to the persisted name.
   */
  fun normalizeNode(node: Map<*, *>, renames: Map<String, String>): Map<String, Any> {
    val out = LinkedHashMap<String, Any>()
    for ((rawKey, value) in node) {
      val key = rawKey?.toString() ?: continue
      out[key] =
          when {
            key == "nodeType" && value is String -> {
              val canonical = canonicalNodeType(value)
              // DOWNLOAD INTENT = FC_RETURN_FILE. Models occasionally still emit the older
              // FC_PROVIDE_RESOURCE when the user asked for a download; when it targets a
              // PRECEDING node its params carry sourceNode "%prev%" (either flat or inside
              // nodeParams), so it is a download node — rewrite it to FC_RETURN_FILE (the node that
              // returns the file to the browser). A standalone provide-resource node (no
              // sourceNode anywhere) keeps its own semantics.
              val params = node["nodeParams"] as? Map<*, *>
              val targetsPrevious =
                  listOf("sourceNode", "sourceNodeId", "sourceNodeUuid").any { key ->
                    node.containsKey(key) || params?.containsKey(key) == true
                  }
              if (canonical == "FC_PROVIDE_RESOURCE" && targetsPrevious) {
                "FC_RETURN_FILE"
              } else {
                canonical
              }
            }
            value is String -> rewritePlaceholders(value, renames)
            value is Map<*, *> -> normalizeNode(value, renames)
            value is List<*> ->
                value.map { item ->
                  when (item) {
                    is Map<*, *> -> normalizeNode(item, renames)
                    is String -> rewritePlaceholders(item, renames)
                    else -> item ?: ""
                  }
                }
            else -> value ?: ""
          }
    }
    return out
  }

  /** Rewrites `[%$<raw name>.RESULT…%]` to the sanitised node name. */
  fun rewritePlaceholders(value: String, renames: Map<String, String>): String {
    if (renames.isEmpty() || !value.contains(".RESULT")) return value
    var out = value
    for ((rawName, sanitised) in renames) {
      // Concatenated so the literal "$" of the SYSTEM placeholder stays intact.
      out = out.replace("[%\$" + rawName + ".", "[%\$" + sanitised + ".")
    }
    return out
  }
}
