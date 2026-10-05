package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Regression tests for LEVER 1 (token reduction) — the FORM ELEMENTS document handed to the
 * WORKFLOW step (`condenseFormElementsForWorkflow`).
 *
 * The workflow pass never builds or validates a form field: it only REFERENCES one (the
 * `technicalId` inside `[%name%]` / `triggerParams.buttonName`) and MATCHES it by `displayText`. So
 * the per-element build/validate config (`required`, `placeholder`, `actionPage`) is dead weight
 * there and must be dropped, while `technicalId`, `type`, `displayText` and the XSelect `options`
 * ({text,value}) mapping must survive (an `FC_IF` condition may reference an option VALUE).
 *
 * The block travels on BOTH workflow passes (pass-1 decides, pass-2 carries the requested node
 * details), so every stripped character is paid twice per run.
 *
 * Fail-open: a malformed input must come back unchanged, and a blank/null input must pass through
 * untouched — an unparseable block must never starve (or break) the workflow prompt.
 */
class WorkflowFormElementsCondenseTest {

  private val assistant = AICodBiAssistant()

  private fun condense(input: String?): String? =
      AICodBiAssistant::class
          .java
          .getDeclaredMethod("condenseFormElementsForWorkflow", String::class.java)
          .apply { isAccessible = true }
          .invoke(assistant, input) as String?

  private fun arr(json: String) = JsonParser.parseString(json).asJsonArray

  private fun fullInput(): String =
      // Mirrors the shape emitted by extractFormElementsFromJson.
      """
      [
        {"technicalId":"feld_name","type":"XTextField","displayText":"Nachname","required":true,"placeholder":"Muster"},
        {"technicalId":"zustaendigkeit","type":"XSelect","displayText":"Zuständigkeit","required":true,"placeholder":"bitte wählen",
         "options":[{"text":"Ja","value":"y-1"},{"text":"Nein","value":"n-0"}]},
        {"technicalId":"senden","type":"BUTTON","displayText":"Absenden","actionPage":"finish"}
      ]
      """
          .trimIndent()

  @Test
  fun `keeps ids types labels and xselect options`() {
    val out = arr(condense(fullInput())!!)
    assertEquals(3, out.size())
    assertEquals("feld_name", out[0].asJsonObject.get("technicalId").asString)
    assertEquals("XTextField", out[0].asJsonObject.get("type").asString)
    assertEquals("Nachname", out[0].asJsonObject.get("displayText").asString)
    // XSelect options survive verbatim so an option-value reference (e.g. an FC_IF on "Ja")
    // resolves.
    val sel = out[1].asJsonObject
    assertEquals("zustaendigkeit", sel.get("technicalId").asString)
    val opts = sel.getAsJsonArray("options")
    assertEquals(2, opts.size())
    assertEquals("Ja", opts[0].asJsonObject.get("text").asString)
    assertEquals("y-1", opts[0].asJsonObject.get("value").asString)
    // The BUTTON keeps the identity the submit trigger binds to.
    assertEquals("senden", out[2].asJsonObject.get("technicalId").asString)
    assertEquals("Absenden", out[2].asJsonObject.get("displayText").asString)
  }

  @Test
  fun `drops the build-validate config flags that are dead weight for the workflow step`() {
    val out = condense(fullInput())!!
    assertTrue(!out.contains("required"), "required must be dropped for the workflow step")
    assertTrue(!out.contains("placeholder"), "placeholder must be dropped for the workflow step")
    assertTrue(!out.contains("actionPage"), "actionPage must be dropped for the workflow step")
    assertTrue(!out.contains("Muster"), "placeholder value must not leak through")
    assertTrue(!out.contains("bitte wählen"), "placeholder value must not leak through")
    assertTrue(!out.contains("finish"), "actionPage value must not leak through")
  }

  @Test
  fun `is strictly smaller than the full version`() {
    val full = fullInput()
    val out = condense(full)!!
    assertTrue(
        out.length < full.length, "condensed length ${out.length} must be < full ${full.length}")
  }

  @Test
  fun `fail-open on malformed input returns the original unchanged`() {
    val notJson = "this is not json at all"
    assertEquals(notJson, condense(notJson))
    val notArray = """{"technicalId":"x","type":"XTextField"}"""
    assertEquals(notArray, condense(notArray))
  }

  @Test
  fun `blank and null inputs pass through untouched`() {
    assertNull(condense(null))
    assertEquals("", condense(""))
    assertEquals("   ", condense("   "))
  }
}
