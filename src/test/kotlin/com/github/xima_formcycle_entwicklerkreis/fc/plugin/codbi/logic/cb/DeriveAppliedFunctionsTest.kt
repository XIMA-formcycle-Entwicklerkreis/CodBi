package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonArray
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Regression tests for the Lever 6 HYBRID `_codbiApplicability` report:
 * [`AICodBiAssistant.deriveAppliedFunctionsFromDiff`] and
 * [`AICodBiAssistant.mergeDerivedAppliedIntoReport`].
 *
 * The model no longer lists footprint-bearing CodBi FUNCTIONS in `applied` (to save output tokens —
 * the bulky `{"id",targets}` entries). The server derives them from the before/after form diff and
 * merges them back into the report, while PRESERVING:
 * - the model's footprint-less `Holistic.*` standard activations (they leave no form trace), and
 * - the model's `considered` / `codbiVerdict` / counts signals.
 *
 * Invariants under test:
 * - A `data-cb-func` that appears on an element which did not carry it before is derived as an
 *   applied `{"id","targets"}` entry (targets = the element's `properties.name`).
 * - A function present both before AND after is NOT re-reported (no noisy duplicates).
 * - Comma-separated `data-cb-func` values and the object-map attributes shape are both handled.
 * - `mergeDerivedAppliedIntoReport` drops any footprint-bearing `applied` entry the model emitted,
 *   keeps `Holistic.*` entries, and preserves every other report signal.
 * - A missing report is synthesized so downstream Holistic handling still sees an `applied` array.
 */
class DeriveAppliedFunctionsTest {

  private val assistant = AICodBiAssistant()

  private fun derive(original: String?, modified: String?): JsonArray =
      AICodBiAssistant::class
          .java
          .getDeclaredMethod(
              "deriveAppliedFunctionsFromDiff", String::class.java, String::class.java)
          .apply { isAccessible = true }
          .invoke(assistant, original, modified) as JsonArray

  private fun merge(report: String?, derived: JsonArray): String =
      AICodBiAssistant::class
          .java
          .getDeclaredMethod(
              "mergeDerivedAppliedIntoReport", String::class.java, JsonArray::class.java)
          .apply { isAccessible = true }
          .invoke(assistant, report, derived) as String

  private fun formJson(vararg items: String): String =
      """
      {
        "title": "t",
        "items": [
          ${items.joinToString(",\n          ")}
        ]
      }
      """
          .trimIndent()

  // ---------------------------------------------------------------------------------------------
  // deriveAppliedFunctionsFromDiff
  // ---------------------------------------------------------------------------------------------

  @Test
  fun `derives a function newly attached to an existing element`() {
    val before =
        formJson(
            """{"className":"XTextField","properties":{"name":"tfA","id":"xi-a","attributes":[{"text":"data-cb-func","value":"CodBi_NoFutureDate"}]}}""")
    val after =
        formJson(
            """{"className":"XTextField","properties":{"name":"tfA","id":"xi-a","attributes":[{"text":"data-cb-func","value":"CodBi_NoFutureDate,CodBi_TrimOnBlur"}]}}""")

    val out = derive(before, after)

    assertEquals(1, out.size())
    val entry = out[0].asJsonObject
    assertEquals("CodBi_TrimOnBlur", entry.get("id").asString)
    assertEquals(listOf("tfA"), entry.get("targets").asJsonArray.map { it.asString })
  }

  @Test
  fun `derives a function on a brand-new element`() {
    val before = formJson("""{"className":"XTextField","properties":{"name":"tfA","id":"xi-a"}}""")
    val after =
        formJson(
            """{"className":"XTextField","properties":{"name":"tfA","id":"xi-a"}}""",
            """{"className":"XTextField","properties":{"name":"tfB","id":"xi-b","attributes":[{"text":"data-cb-func","value":"HTML.Input.REGEX"}]}}""")

    val out = derive(before, after)

    assertEquals(1, out.size())
    assertEquals("HTML.Input.REGEX", out[0].asJsonObject.get("id").asString)
    assertEquals(listOf("tfB"), out[0].asJsonObject.get("targets").asJsonArray.map { it.asString })
  }

  @Test
  fun `does not re-report a function present before and after`() {
    val before =
        formJson(
            """{"className":"XTextField","properties":{"name":"tfA","id":"xi-a","attributes":[{"text":"data-cb-func","value":"CodBi_NoFutureDate"}]}}""")
    val after =
        formJson(
            """{"className":"XTextField","properties":{"name":"tfA","id":"xi-a","attributes":[{"text":"data-cb-func","value":"CodBi_NoFutureDate"}]}}""")

    assertTrue(derive(before, after).size() == 0)
  }

  @Test
  fun `handles the object-map attributes shape`() {
    val before =
        formJson(
            """{"className":"XTextField","properties":{"name":"tfA","id":"xi-a","attributes":{}}}""")
    val after =
        formJson(
            """{"className":"XTextField","properties":{"name":"tfA","id":"xi-a","attributes":{"data-cb-func":"Time.Frame"}}}""")

    val out = derive(before, after)

    assertEquals(1, out.size())
    assertEquals("Time.Frame", out[0].asJsonObject.get("id").asString)
  }

  @Test
  fun `returns empty when either side is blank`() {
    assertTrue(derive(null, "{}").size() == 0)
    assertTrue(derive("{}", null).size() == 0)
    assertTrue(derive("  ", "{}").size() == 0)
    assertTrue(derive(null, null).size() == 0)
  }

  @Test
  fun `returns empty on malformed input without throwing`() {
    assertTrue(derive("{ not json", "{}").size() == 0)
    assertTrue(derive("{}", "{ not json").size() == 0)
  }

  // ---------------------------------------------------------------------------------------------
  // mergeDerivedAppliedIntoReport
  // ---------------------------------------------------------------------------------------------

  private val derivedOnlyFunc = """[{"id":"CodBi_TrimOnBlur","targets":["tfA"]}]"""

  @Test
  fun `replaces footprint-bearing model applied entries with derived ones`() {
    // The model still (incorrectly) listed a footprint-bearing entry in applied — the merge must
    // drop it in favour of the diff-derived entry.
    val modelReport =
        """
        {
          "codbiVerdict": "applied",
          "formElementsProcessed": 5,
          "codbiElementsEvaluated": 2,
          "considered": [{"id":"CodBi.TrimOnBlur","targets":["tfA"]}],
          "applied": [{"id":"CodBi.TrimOnBlur","targets":["tfA"]}]
        }
        """
            .trimIndent()

    val out =
        JsonParser.parseString(
                merge(modelReport, JsonParser.parseString(derivedOnlyFunc).asJsonArray))
            .asJsonObject

    val applied = out.get("applied").asJsonArray
    assertEquals(1, applied.size())
    assertEquals("CodBi_TrimOnBlur", applied[0].asJsonObject.get("id").asString)
    assertEquals(
        listOf("tfA"), applied[0].asJsonObject.get("targets").asJsonArray.map { it.asString })
    // Signals preserved verbatim.
    assertEquals("applied", out.get("codbiVerdict").asString)
    assertEquals(5, out.get("formElementsProcessed").asInt)
    assertEquals(2, out.get("codbiElementsEvaluated").asInt)
    assertEquals(
        "CodBi.TrimOnBlur", out.get("considered").asJsonArray[0].asJsonObject.get("id").asString)
  }

  @Test
  fun `keeps footprint-less holistic activations alongside derived entries`() {
    val modelReport =
        """
        {
          "codbiVerdict": "applied",
          "considered": [],
          "applied": [{"id":"Holistic.CSS.Standard","targets":[]}]
        }
        """
            .trimIndent()

    val out =
        JsonParser.parseString(
                merge(modelReport, JsonParser.parseString(derivedOnlyFunc).asJsonArray))
            .asJsonObject

    val applied = out.get("applied").asJsonArray
    val ids = applied.map { it.asJsonObject.get("id").asString }.toSet()
    assertTrue(ids.contains("CodBi_TrimOnBlur"), "derived footprint-bearing func must be present")
    assertTrue(ids.contains("Holistic.CSS.Standard"), "footprint-less holistic must be preserved")
  }

  @Test
  fun `synthesizes a report when the model omitted it`() {
    val out =
        JsonParser.parseString(merge(null, JsonParser.parseString(derivedOnlyFunc).asJsonArray))
            .asJsonObject

    val applied = out.get("applied").asJsonArray
    assertEquals(1, applied.size())
    assertEquals("CodBi_TrimOnBlur", applied[0].asJsonObject.get("id").asString)
  }

  @Test
  fun `synthesizes empty report without an applied key when nothing derived and no holistic`() {
    val out = JsonParser.parseString(merge(null, JsonArray())).asJsonObject
    assertFalse(out.has("applied"), "no applied key when nothing was derived")
  }

  @Test
  fun `preserves considered and verdict when model emits no applied at all`() {
    val modelReport =
        """
        {
          "codbiVerdict": "none",
          "considered": [{"id":"HTML.Panel","targets":["w1"]}]
        }
        """
            .trimIndent()

    val out =
        JsonParser.parseString(
                merge(modelReport, JsonParser.parseString(derivedOnlyFunc).asJsonArray))
            .asJsonObject

    assertEquals("none", out.get("codbiVerdict").asString)
    assertEquals("HTML.Panel", out.get("considered").asJsonArray[0].asJsonObject.get("id").asString)
    assertEquals(
        "CodBi_TrimOnBlur", out.get("applied").asJsonArray[0].asJsonObject.get("id").asString)
  }
}
