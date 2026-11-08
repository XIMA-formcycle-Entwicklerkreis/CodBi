package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonArray
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests for [AICodBiAssistant]'s `normalizeAttributeEntryKeys`.
 *
 * Reported case: pass-2 returned the correct `HTML.Select.Injection` wiring, but every attribute
 * entry used `{"name": "data-cb-func", "value": …}` instead of the canonical `{"text": …, "value":
 * …}`. Such entries are invisible to the `data-cb-*` promotion, the runtime loader and the publish
 * step, so the functionality appeared applied while no parameter took effect.
 */
class AttributeEntryKeyNormalizationTest {

  private val assistant = AICodBiAssistant()

  private fun normalize(json: String): JsonArray {
    val arr = JsonParser.parseString(json).asJsonArray
    AICodBiAssistant::class
        .java
        .getDeclaredMethod("normalizeAttributeEntryKeys", JsonArray::class.java)
        .apply { isAccessible = true }
        .invoke(assistant, arr)
    return arr
  }

  private fun firstAttr(arr: JsonArray): com.google.gson.JsonObject {
    val props = arr.get(0).asJsonObject.getAsJsonObject("properties")
    return props.getAsJsonArray("attributes").get(0).asJsonObject
  }

  @Test
  fun renamesTheNameKeyToTextAndKeepsTheValue() {
    val arr =
        normalize(
            """[{"className":"XSelect","properties":{"name":"selAemter","attributes":[
                 {"name":"data-cb-func","value":"HTML.Select.Injection"},
                 {"name":"data-cb-Values","value":"{ BayVIS.Behoerden > bezeichnung }"}]}}]""")
    val attrs = arr.get(0).asJsonObject.getAsJsonObject("properties").getAsJsonArray("attributes")
    for (attr in attrs) {
      assertTrue(attr.asJsonObject.has("text"), "every entry must carry the canonical 'text' key")
      assertFalse(attr.asJsonObject.has("name"), "the 'name' key must be gone")
    }
    assertEquals("data-cb-func", attrs.get(0).asJsonObject.get("text").asString)
    assertEquals("HTML.Select.Injection", attrs.get(0).asJsonObject.get("value").asString)
    assertEquals("data-cb-Values", attrs.get(1).asJsonObject.get("text").asString)
  }

  @Test
  fun leavesCanonicalEntriesUntouched() {
    val arr =
        normalize(
            """[{"className":"XSelect","properties":{"name":"s","attributes":[
                 {"text":"data-cb-func","value":"HTML.Select.Injection"}]}}]""")
    assertEquals("data-cb-func", firstAttr(arr).get("text").asString)
    assertFalse(firstAttr(arr).has("name"))
  }

  @Test
  fun alsoNormalizesItemLevelAttributes() {
    val arr =
        normalize(
            """[{"className":"XSelect","attributes":[{"name":"data-cb-Values","value":"{ V > x }"}]}]""")
    val attr = arr.get(0).asJsonObject.getAsJsonArray("attributes").get(0).asJsonObject
    assertEquals("data-cb-Values", attr.get("text").asString)
    assertEquals("{ V > x }", attr.get("value").asString)
  }
}
