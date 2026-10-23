package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.Gson

/**
 * Builds the `nodeParams` of an FC_WRITE_FORM_RECORD_ATTRIBUTES node ("Set server attribute").
 *
 * From `FcWriteFormRecordAttrProps` (formcycle 8.5.3) the ONLY configuration is `customAttributes`
 * (a `List<Setting<String>>` → `[{"name":…,"value":…}]`, rendered in the designer as the
 * "Modifications" table) plus the boolean `writeAttributesToForm`. The executor writes the pairs
 * into `Vorgang.customAttributes` and (optionally) into matching form fields, then persists.
 *
 * The model does not always use that key: it emits `attributes`, the UI label `modifications`, a
 * name→value object, a single `{key,value}` object or even flat `attributeKey`/`value` parameters.
 * Reading only one shape produced nodes with an EMPTY "Modifications" table — this parser accepts
 * every shape and always emits `customAttributes`.
 */
internal object RecordAttributesParams {

  private val gson = Gson()

  /** Containers the model may use for the attribute list/object. */
  private val CONTAINER_KEYS =
      listOf(
          "customAttributes", "attributes", "modifications", "modification", "values", "settings")

  /** Keys that carry the attribute NAME inside an item. */
  private val NAME_KEYS = listOf("name", "key", "attribute", "attributeKey", "setting", "field")

  /** Keys that carry the attribute VALUE inside an item. */
  private val VALUE_KEYS = listOf("value", "text", "content")

  private fun booleanOf(value: Any?): Boolean? =
      when (value) {
        is Boolean -> value
        is String ->
            when (value.trim().lowercase()) {
              "true",
              "yes",
              "ja",
              "1" -> true
              "false",
              "no",
              "nein",
              "0" -> false
              else -> null
            }
        is Number -> value.toInt() != 0
        else -> null
      }

  /**
   * Returns the `"customAttributes":[…],"writeAttributesToForm":… ` fragment (without the
   * surrounding braces), or `null` when the model supplied no attribute at all.
   */
  fun fragmentJson(nodeParams: Map<String, Any?>): String? {
    val collected = LinkedHashMap<String, String>()
    fun add(name: Any?, value: Any?) {
      val key = name?.toString()?.trim()?.takeIf { it.isNotEmpty() } ?: return
      collected.putIfAbsent(key, value?.toString() ?: "")
    }

    fun addItem(item: Any?) {
      when (item) {
        is Map<*, *> -> {
          val name =
              NAME_KEYS.firstNotNullOfOrNull {
                item[it]?.toString()?.takeIf { s -> s.isNotBlank() }
              }
          val value = VALUE_KEYS.firstNotNullOfOrNull { item[it] }?.toString()
          add(name, value ?: "")
        }
        // "zzz=xxx" / "zzz: xxx"
        is String -> {
          val trimmed = item.trim()
          if (trimmed.isEmpty()) return
          val eq = trimmed.indexOf('=')
          val colon = trimmed.indexOf(':')
          when {
            eq > 0 -> add(trimmed.substring(0, eq), trimmed.substring(eq + 1))
            colon > 0 -> add(trimmed.substring(0, colon), trimmed.substring(colon + 1))
            else -> add(trimmed, "")
          }
        }
        else -> {}
      }
    }

    for (key in CONTAINER_KEYS) {
      when (val raw = nodeParams[key]) {
        is List<*> -> raw.forEach { addItem(it) }
        is Map<*, *> -> {
          val looksLikeSingleItem =
              NAME_KEYS.any { raw[it] != null } && VALUE_KEYS.any { raw[it] != null }
          if (looksLikeSingleItem) addItem(raw)
          // name -> value dictionary, e.g. {"zzz":"xxx"}
          else raw.forEach { (k, v) -> add(k, v) }
        }
        else -> {}
      }
    }
    // Flat single-attribute shorthand.
    add(
        nodeParams["attributeKey"]
            ?: nodeParams["attribute"]
            ?: nodeParams["key"]
            ?: nodeParams["name"],
        nodeParams["value"])

    if (collected.isEmpty()) return null
    val writeToForm =
        booleanOf(nodeParams["writeAttributesToForm"])
            ?: booleanOf(nodeParams["writeToForm"])
            ?: booleanOf(nodeParams["alsoWriteToForm"])
            ?: false
    val attributesJson =
        collected.map { (name, value) ->
          """{"name":${gson.toJson(name)},"value":${gson.toJson(value)}}"""
        }
    return """"customAttributes":[${attributesJson.joinToString(",")}],"writeAttributesToForm":$writeToForm"""
  }
}
