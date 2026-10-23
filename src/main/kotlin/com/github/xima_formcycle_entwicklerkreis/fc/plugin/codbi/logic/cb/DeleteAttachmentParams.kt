package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.Gson

/**
 * Builds the `attachmentsToDelete` fragment of an FC_DELETE_ATTACHMENT node from the AI's
 * `nodeParams`.
 *
 * The REAL props shape is `FcDeleteAttachmentProps.attachmentsToDelete` (a `MultiAttachment`): `{
 * attachments: [AttachmentItem], searchFilenamePattern, searchSourceTypes }` with `AttachmentItem =
 * { type: PREVIOUS_NODE | SEARCH | UPLOAD, identifier, nodeKey }`. The model correctly emits that
 * nested object, so the parser MUST read the nested shape — reading only top-level keys silently
 * produced a node with no selection at all (observed: the model sent
 * `{"attachmentsToDelete":{"attachments":[{"type":"SEARCH"}],"searchFilenamePattern":"KOALA.JPG"}}`
 * and the builder dropped it).
 *
 * A flat shape (`attachments: [...]`, `fileName`, `pattern`, …) is still accepted, because smaller
 * models sometimes collapse the nesting.
 */
internal object DeleteAttachmentParams {

  private val gson = Gson()

  /** Keys a model may use for the file-name pattern (flat or nested). */
  private val PATTERN_KEYS =
      listOf(
          "searchFilenamePattern",
          "fileName",
          "attachmentName",
          "attachmentFileName",
          "filename",
          "file",
          "pattern")

  /**
   * Returns the `"attachmentsToDelete":{…}` fragment (without the surrounding braces) for
   * [nodeParams], or `null` when neither a file name nor an upload field was supplied.
   */
  fun fragmentJson(nodeParams: Map<String, Any?>): String? {
    val nested = nodeParams["attachmentsToDelete"] as? Map<*, *>
    fun value(key: String): Any? = nodeParams[key] ?: nested?.get(key)
    fun text(key: String): String = (value(key) as? String)?.trim().orEmpty()

    val rawItems = (value("attachments") as? List<*>).orEmpty()
    val pattern =
        PATTERN_KEYS.firstNotNullOfOrNull { key -> text(key).takeIf { it.isNotEmpty() } } ?: ""
    val searchItemRequested =
        rawItems.any { item ->
          item is Map<*, *> && (item["type"] as? String).equals("SEARCH", ignoreCase = true)
        }
    // UPLOAD items carry the upload field's technicalId in "identifier"; a bare string is accepted.
    val uploadIdentifiers =
        rawItems
            .mapNotNull { item ->
              when (item) {
                is String -> item.trim().takeIf { it.isNotEmpty() }
                is Map<*, *> ->
                    if ((item["type"] as? String).equals("UPLOAD", ignoreCase = true))
                        (item["identifier"] as? String)?.trim()?.takeIf { it.isNotEmpty() }
                    else null
                else -> null
              }
            }
            .distinct()
    val sourceTypes =
        (value("searchSourceTypes") as? List<*>)
            ?.filterIsInstance<String>()
            ?.map { it.trim().uppercase() }
            ?.filter { it in WorkflowAttachmentSources.TYPES }
            ?.distinct()
            .orEmpty()

    val wantSearch = pattern.isNotEmpty() || searchItemRequested
    if (!wantSearch && uploadIdentifiers.isEmpty()) return null

    val items = mutableListOf<String>()
    if (wantSearch) items.add("""{"type":"SEARCH"}""")
    uploadIdentifiers.forEach { id ->
      items.add("""{"type":"UPLOAD","identifier":${gson.toJson(id)}}""")
    }
    val patternJson =
        if (wantSearch && pattern.isNotEmpty())
            ""","searchFilenamePattern":${gson.toJson(pattern)}"""
        else ""
    val sourcesJson =
        if (wantSearch && sourceTypes.isNotEmpty())
            ""","searchSourceTypes":[${sourceTypes.joinToString(",") { gson.toJson(it) }}]"""
        else ""
    return """"attachmentsToDelete":{"attachments":[${items.joinToString(",")}]$patternJson$sourcesJson}"""
  }
}
