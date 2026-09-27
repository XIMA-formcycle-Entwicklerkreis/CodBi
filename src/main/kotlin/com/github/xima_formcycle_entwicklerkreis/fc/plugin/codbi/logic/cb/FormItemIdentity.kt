package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonObject
import com.google.gson.JsonParser

/**
 * Identity of AI-emitted form items — the `properties.name` the whole merge pipeline keys on.
 *
 * **Why this exists (a real, silent failure):** the pass-1 diff protocol asks for a property-level
 * patch — *"a MODIFIED item carries ONLY the properties you actually change"*. A small model then
 * omits the (unchanged) identity key `properties.name`, emitting e.g.
 * `{"className":"XTextField","properties":{"label":"Vor-Name"}}`. Every merge path
 * ([`restoreStrippedFields()`] and [`splicePass2IntoPass1()`]) matches items by NAME, so such a
 * patch matched nothing and was dropped **without a warning**: the request "rename the label"
 * produced a byte-identical form while the change log showed exactly one re-emitted item
 * (`form-pass-1 re-emission stats: items re-emitted=1 (existing=0, new=1)`).
 *
 * [resolveName] recovers the frequent case where the model kept `properties.id` but dropped the
 * name, and returns `null` — a case the callers now WARN about instead of ignoring — when the item
 * carries no identity at all. Guessing by `className` is deliberately not attempted: several
 * elements routinely share one (nine `XTextField` in the reference form).
 */
internal object FormItemIdentity {

  /** Builds `properties.id` → `properties.name` from the items of the ORIGINAL form. */
  fun nameById(items: Iterable<JsonObject>?): Map<String, String> {
    if (items == null) return emptyMap()
    val index = mutableMapOf<String, String>()
    for (item in items) {
      val props = item.getAsJsonObject("properties") ?: continue
      val id = props.get("id")?.takeIf { it.isJsonPrimitive }?.asString
      val name = props.get("name")?.takeIf { it.isJsonPrimitive }?.asString
      if (!id.isNullOrBlank() && !name.isNullOrBlank()) index[id] = name
    }
    return index
  }

  /**
   * The technical element name of an AI item: `properties.name`, else a top-level `name`, else the
   * name of the original element whose `properties.id` this item carries. `null` when the item
   * cannot be identified at all (the caller must warn, never drop silently).
   */
  fun resolveName(item: JsonObject, nameById: Map<String, String>): String? {
    val props = item.getAsJsonObject("properties")
    val direct =
        props?.get("name")?.takeIf { it.isJsonPrimitive }?.asString?.takeIf { it.isNotBlank() }
            ?: item.get("name")?.takeIf { it.isJsonPrimitive }?.asString?.takeIf { it.isNotBlank() }
    if (direct != null) return direct
    val id = props?.get("id")?.takeIf { it.isJsonPrimitive }?.asString
    return if (id.isNullOrBlank()) null else nameById[id]
  }

  /**
   * How many items of [aiJson] carry **neither** `properties.id` **nor** `properties.name` — i.e.
   * can be matched by nothing. Used by the caller to trigger ONE repair round instead of silently
   * dropping the change. Returns 0 for anything that does not parse.
   *
   * Note: an item that HAS an `id` is not counted here even when that id is unknown to the caller —
   * the id-based matching can still resolve it, and a genuinely unknown id is a different failure.
   */
  fun countWithoutIdentity(aiJson: String?): Int {
    if (aiJson.isNullOrBlank()) return 0
    return try {
      val items = JsonParser.parseString(aiJson).asJsonObject.getAsJsonArray("items") ?: return 0
      items.count { el ->
        if (!el.isJsonObject) return@count false
        val props = el.asJsonObject.getAsJsonObject("properties")
        props == null || (!props.has("id") && !props.has("name"))
      }
    } catch (_: Exception) {
      0
    }
  }
}
