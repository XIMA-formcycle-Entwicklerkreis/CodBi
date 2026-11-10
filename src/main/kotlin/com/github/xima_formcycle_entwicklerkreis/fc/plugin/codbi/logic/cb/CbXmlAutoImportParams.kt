package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

/**
 * Normalises the AI's node parameters for the CodBi **cbXMLAutoImport** workflow node.
 *
 * The node itself needs no per-field mapping (it imports every value whose field exists in the
 * form); the only field list it knows is the EXCLUSION list. Models emit that list in many shapes —
 * an array of names, an array of `{name}` objects, a comma/newline separated string or a name→value
 * map — so it is normalised here before it reaches the node's custom parameters.
 *
 * @since 1.1.0
 */
object CbXmlAutoImportParams {

  /** Parameter keys a model may use for the exclusion list. */
  val EXCLUSION_KEYS: List<String> =
      listOf("excludedFields", "excludeFields", "exclusions", "excluded", "skipFields")

  /**
   * Technical names of the fields that must NOT be filled, de-duplicated and in input order.
   *
   * @param nodeParams Node parameters as produced by the AI.
   */
  fun excludedFields(nodeParams: Map<String, Any>): List<String> {
    val raw = EXCLUSION_KEYS.firstNotNullOfOrNull { nodeParams[it] } ?: return emptyList()
    val names =
        when (raw) {
          is List<*> ->
              raw.mapNotNull { item ->
                when (item) {
                  is String -> item.trim().takeIf { it.isNotEmpty() }
                  is Map<*, *> ->
                      (item["name"] ?: item["field"] ?: item["fieldName"] ?: item["technicalId"])
                          ?.toString()
                          ?.trim()
                          ?.takeIf { it.isNotEmpty() }
                  else -> item?.toString()?.trim()?.takeIf { it.isNotEmpty() }
                }
              }
          is Map<*, *> ->
              raw.entries.mapNotNull { (key, value) ->
                when (value) {
                  // {field: false} means "do NOT import this field" — that is the exclusion.
                  is Boolean -> key?.toString()?.trim()?.takeIf { it.isNotEmpty() }
                  else ->
                      key?.toString()?.trim()?.takeIf { it.isNotEmpty() }
                          ?: value?.toString()?.trim()?.takeIf { it.isNotEmpty() }
                }
              }
          is String -> raw.split(',', ';', '\n').map { it.trim() }
          else -> emptyList()
        }
    return names.filter { it.isNotEmpty() }.distinct()
  }

  /**
   * Reads a boolean node parameter, accepting the shapes JSON models actually produce (`true`,
   * `"true"`, `1`, `"ja"`).
   *
   * @param nodeParams Node parameters as produced by the AI.
   * @param key Parameter name.
   * @param fallback Value used when the parameter is absent or unreadable.
   */
  fun flag(nodeParams: Map<String, Any>, key: String, fallback: Boolean): Boolean =
      when (val raw = nodeParams[key]) {
        is Boolean -> raw
        is Number -> raw.toInt() != 0
        is String ->
            when (raw.trim().lowercase()) {
              "true",
              "1",
              "yes",
              "ja",
              "on" -> true
              "false",
              "0",
              "no",
              "nein",
              "off" -> false
              else -> fallback
            }
        else -> fallback
      }
}
