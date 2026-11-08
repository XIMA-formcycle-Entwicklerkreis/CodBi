package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guards the "CodBi disabled" rule block (`codbi-codbi-disabled.md` -> key `codbi.codbi_disabled`),
 * which is appended to the clarification prompt, pass-1, the blind/retry pass and the apply pass
 * whenever the form assistant dialog's CodBi switch is OFF.
 *
 * The contract under test is the CLARIFICATION QUESTION SHAPE for a requested behaviour a plain
 * Formcycle widget cannot provide (blocking specific dates/values, AI validation, autocomplete,
 * ...): the question must (1) name what the plain widget cannot do, (2) say that enabling the CodBi
 * switch adds a functionality that can do exactly that, and (3) offer how to proceed. It must NOT
 * ask for a message placeholder (the "XXX" in a dictated error text) instead of the missing
 * capability — that answer tells the user nothing about why the field cannot do it.
 */
class CodbiDisabledRulesTest {

  private fun rules(): String =
      CodbiDisabledRulesTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-codbi-disabled.md")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled codbi-codbi-disabled.md not found")

  @Test
  fun `the clarification question must explain the capability gap and offer the CodBi switch`() {
    val text = rules()
    listOf(
            "WHAT THE PLAIN WIDGET CANNOT DO",
            "WHAT THE CODBI SWITCH WOULD ADD",
            "HOW TO PROCEED",
            "Schalter „CodBi“ im Form-Assistenten einschalten")
        .forEach { part ->
          assertTrue(text.contains(part), "missing mandatory question part: $part")
        }
  }

  @Test
  fun `the message placeholder must never become the question`() {
    val text = rules()
    assertTrue(
        text.contains("never ask for the text/placeholder", ignoreCase = true),
        "the rules must forbid asking for the message placeholder instead of the capability")
  }

  @Test
  fun `the clarification round must be answered in the JSON envelope`() {
    // Observed drift: the model mirrored the block's a/b/c example and answered in PROSE, so the
    // parser found no question and the run built an empty form. The block must demand the envelope.
    val text = rules()
    assertTrue(
        text.contains(""""status":"need_clarification""""),
        "the rules must show/require the need_clarification JSON envelope")
    assertTrue(
        text.contains("NEVER write an \"a) … b) … c) …\" list", ignoreCase = true) ||
            text.contains("a) … b) … c)", ignoreCase = true),
        "the rules must forbid an a/b/c list inside the question text")
  }

  @Test
  fun `the CodBi option must be marked machine-readably so the switch can be turned on`() {
    // The clarification popup offers a "CodBi-Funktionen aktivieren" option. Picking it must NOT
    // just build the plain field: the assistant switches the CodBi switch on and repeats the
    // request with the functionality catalog. To do that without matching the user's wording (or
    // language), the model marks ITS OWN option via `codbiOption` in the envelope.
    val text = rules()
    assertTrue(
        text.contains("\"codbiOption\""),
        "the clarification envelope must carry the codbiOption marker")
    assertTrue(
        text.contains("repeated VERBATIM in `codbiOption`", ignoreCase = true),
        "the marked option must be repeated verbatim so a click on it can be recognized")
    assertTrue(
        text.contains("switches the CodBi switch ON", ignoreCase = true) ||
            text.contains("switch the CodBi switch on", ignoreCase = true),
        "the rules must state what selecting the marked option does (switch CodBi on + re-run)")
  }

  @Test
  fun `the build pass must sanction the widget details request for a new field`() {
    // Observed failure: with the switch OFF the model answered the BUILD pass with an empty "items"
    // array, so the answered clarification produced no form at all. The block must state that for a
    // field that is not in the form yet the widget details request IS the sanctioned build-pass
    // answer — the field is then created in the next pass with its real template.
    val text = rules()
    assertTrue(
        text.contains(
            "the sanctioned build-pass answer IS the widget details request", ignoreCase = true),
        "the build pass must sanction the widget details request for a widget not in the form yet")
    assertTrue(
        text.contains(
            "An answer that neither emits items nor names a widget class is the only FAIL"),
        "the block must state that only a truly empty answer is a failure")
  }

  @Test
  fun `no CodBi wiring may be instructed and details stay widget-only`() {
    val text = rules()
    assertTrue(
        text.contains("elements` array MUST stay EMPTY"),
        "the details request must stay widget-only in a CodBi-disabled run")
    assertTrue(
        text.contains("NEVER emit a widget whose template you were not given"),
        "the widget-template rule must stay explicit")
    // Pass-1 stays LEAN: templates are requested, never shipped with the pass-1 prompt.
    assertTrue(
        text.contains("WIDGET TEMPLATES ARE REQUESTED, NEVER INVENTED"),
        "the request-details protocol for widget templates must stay explicit")
  }
}
