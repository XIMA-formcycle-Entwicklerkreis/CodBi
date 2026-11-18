package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guards [salvageTruncatedItems]: when the model runs out of output budget MID-ITEM, the complete
 * leading elements of `items` must survive so the caller can ask for the still-missing ones instead
 * of paying for a complete rebuild.
 *
 * Reported case: a 2-page PDF produced a correct, fully classed address group in the build pass and
 * was cut at `$.items[42].properties.fullwidth`; the whole answer was discarded and a weaker
 * "complete form" pass rebuilt it with merged address fields and no OpenPLZ classes.
 */
class TruncatedItemsSalvageTest {

  private fun names(json: String): List<String> =
      JsonParser.parseString(json).asJsonObject.getAsJsonArray("items").map {
        it.asJsonObject.getAsJsonObject("properties").get("name").asString
      }

  @Test
  fun `keeps the complete leading items of a cut-off answer`() {
    val truncated =
        """{"_diff":true,"items":[""" +
            """{"className":"XTextField","properties":{"name":"tfStrasse"}},""" +
            """{"className":"XTextField","properties":{"name":"tfHausnummer"}},""" +
            """{"className":"XTextField","properties":{"name":"tfPLZ","label":"PL""" // cut
    // mid-value
    val salvaged = salvageTruncatedItems(truncated)
    assertTrue(salvaged != null, "a truncated items array must be salvaged")
    assertEquals(listOf("tfStrasse", "tfHausnummer"), names(salvaged!!))
    assertTrue(salvaged.contains("\"_diff\":true"), "the diff marker is required: $salvaged")
  }

  @Test
  fun `drops a half written item that does not parse`() {
    val truncated =
        """{"items":[{"className":"A","properties":{"name":"a"}},{"className":"B","propert"""
    val salvaged = salvageTruncatedItems(truncated)
    assertEquals(listOf("a"), names(salvaged!!))
  }

  @Test
  fun `never shortens an answer whose items array closed`() {
    val complete = """{"_diff":true,"items":[{"className":"A","properties":{"name":"a"}}]}"""
    assertNull(salvageTruncatedItems(complete))
  }

  @Test
  fun `an items-like word inside a value does not confuse the locator`() {
    val truncated =
        """{"items":[{"className":"XSpan","properties":{"name":"spIntro",""" +
            """"rtevalue":"<p>items: a, b</p>"}},{"className":"XTextField","properties":""" +
            """{"name":"tfName"}}"""
    val salvaged = salvageTruncatedItems(truncated)
    assertEquals(listOf("spIntro", "tfName"), names(salvaged!!))
  }

  @Test
  fun `prose is not salvaged`() {
    assertNull(salvageTruncatedItems("I cannot build that form because the options are unknown."))
  }

  @Test
  fun `an answer that is cut inside its first item yields no salvage`() {
    val partial = """{"items":[{"className":"A","properties":{"name":""" + "\"a"
    assertNull(salvageTruncatedItems(partial))
  }
}
