package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Regression tests for the clarify-round FORM ELEMENTS condensation
 * (`condenseFormElementsForClarify`). The clarification round NEVER builds or verifies the form —
 * it only resolves references and decides whether to ask the user — so the per-element
 * build/validate config (`required`, `placeholder`, `actionPage`) is dead weight there and must be
 * dropped, while `technicalId`, `type`, `displayText` and — critically for XSelect — the `options`
 * ({text,value}) mapping must survive. Without the options the AI cannot resolve which value an
 * option like "Ja" maps to and wrongly asks the user (e.g. "Welcher Wert wird verwendet, wenn 'Ja'
 * gewählt wird?").
 *
 * Fail-open gagged: a malformed input must come back unchanged so a bad block never starves the
 * clarify round of context, and a blank/null input must pass through untouched.
 */
class ClarifyFormElementsCondenseTest {

  private val assistant = AICodBiAssistant()

  private fun condense(input: String?): String? =
      AICodBiAssistant::class
          .java
          .getDeclaredMethod("condenseFormElementsForClarify", String::class.java)
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
    // XSelect options must survive verbatim so option-value mapping still resolves.
    val sel = out[1].asJsonObject
    assertEquals("zustaendigkeit", sel.get("technicalId").asString)
    val opts = sel.getAsJsonArray("options")
    assertEquals(2, opts.size())
    assertEquals("Ja", opts[0].asJsonObject.get("text").asString)
    assertEquals("y-1", opts[0].asJsonObject.get("value").asString)
    assertEquals("Nein", opts[1].asJsonObject.get("text").asString)
    assertEquals("n-0", opts[1].asJsonObject.get("value").asString)
    // BUTTON keeps its identity/type/label too.
    assertEquals("senden", out[2].asJsonObject.get("technicalId").asString)
    assertEquals("Absenden", out[2].asJsonObject.get("displayText").asString)
  }

  @Test
  fun `drops the build-validate config flags that are dead weight for clarify`() {
    val out = condense(fullInput())!!
    assertTrue(!out.contains("required"), "required must be dropped for the clarify round")
    assertTrue(!out.contains("placeholder"), "placeholder must be dropped for the clarify round")
    assertTrue(!out.contains("actionPage"), "actionPage must be dropped for the clarify round")
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
  fun `option mapping still resolves so the ai never re-asks Ja`() {
    // The whole point of keeping options: the AI can map an option label to its value and must not
    // ask the user for it. Guard that the mapping text is present in the condensed output.
    val out = condense(fullInput())!!
    assertTrue(
        out.contains("Ja") && out.contains("y-1"), "option {text,value} mapping must survive")
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
    // Fail-open: the exact input comes back unchanged so a blank/missing block never disturbs the
    // surrounding prompt assembly. Null stays null; blank strings stay blank strings.
    assertNull(condense(null))
    assertEquals("", condense(""))
    assertEquals("   ", condense("   "))
  }
}
