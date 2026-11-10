package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Reported prompt:
 *
 * `Gib in der Konsole die diesjährigen Feiertage von Bayern und Hessen aus.`
 *
 * The assistant emitted `{ Holiday.BavariaAndHesse > list }` — an EP id that does not exist plus a
 * property that does not exist — instead of `{ Date.Holidays > by ; he ; THIS_YEAR }`.
 *
 * Root causes covered here:
 * 1. the pass-1 catalog described `Date.Holidays` as "the public holidays of the requested year(s)"
 *    — no STATES at all, so the model believed the EP could not express "Bayern und Hessen";
 * 2. the authoritative pass-2 blob (and the bundled details index) even declared `- Date.Holidays:
 *    The requested years.` / `Parameters: none.` (the index entry had been built from the file's
 *    LEADING TYPE doc, `ApiRequest`, not from the EP), i.e. the EP looked like a parameterless
 *    "years" thing — an invented state-specific id was the only way left;
 * 3. no rule said that states/regions/years are PARAMETERS and that an EP id is never composed from
 *    the words of a request.
 */
class HolidayEpUsageRuleTest {

  private fun prompt(name: String): String =
      HolidayEpUsageRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/$name")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("prompt $name missing")

  private fun resource(relative: String): String =
      HolidayEpUsageRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$relative")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled resource '$relative' not found")

  @Test
  fun `the EP reference teaches one parameter per state`() {
    val eps = prompt("codbi-element-placeholders.md")
    assertTrue(
        eps.contains("Date.Holidays — SEVERAL STATES, AND THE IDS THAT DO NOT EXIST"),
        "the EP reference must carry a dedicated several-states section")
    assertTrue(
        eps.contains("{ Date.Holidays > by ; he ; THIS_YEAR }"),
        "the reported request must be answered with the two-state example")
    assertTrue(
        eps.contains("Reported failure — WRONG: `{ Holiday.BavariaAndHesse > list }`"),
        "the invented id must be documented as the failure")
    assertTrue(eps.contains("the EP catalogue is FIXED"), "the fixed catalogue must be stated")
    assertTrue(
        eps.contains("returns an ARRAY of holiday names and has NO property parameter"),
        "the missing `list` property must be explained")
  }

  @Test
  fun `an EP id is never composed from the words of the request`() {
    val phrase = "NEVER COMPOSE AN EP ID FROM WORDS OF THE REQUEST"
    for (file in
        listOf("codbi-general.md", "codbi-general.decision.md", "codbi-general-rethink.md")) {
      val text = prompt(file)
      assertTrue(text.contains(phrase), "$file must forbid composing EP ids from the request")
      assertTrue(
          text.contains("Holiday.BavariaAndHesse"),
          "$file must name the invented id as the counter-example")
    }
    val general = prompt("codbi-general.md")
    assertTrue(
        general.contains("{ Date.Holidays > by ; he ; THIS_YEAR }"),
        "the decision core must show the correct two-state call")
  }

  @Test
  fun `the pass-1 entry names the states and the fixed catalogue`() {
    val entry =
        resource("codbi-core-elements-compact.md")
            .substringAfter("### Date.Holidays\n")
            .substringBefore("\n### ")
    assertTrue(entry.contains("BUNDESL"), "the pass-1 entry must name the BUNDESLÄNDER")
    assertTrue(
        entry.contains("the ONLY holiday EP"), "the pass-1 entry must state it is the only one")
    assertTrue(
        entry.contains("{ Date.Holidays > by ; he ; THIS_YEAR }"),
        "the pass-1 entry must show the two-state example")
    assertFalse(
        entry.contains("of the requested year(s)"), "the old years-only wording must be gone")
  }

  @Test
  fun `the API reference no longer claims a parameterless EP`() {
    val api = resource("codbi-core-api-compact.md")
    val entry = api.substringAfter("- Date.Holidays:").substringBefore("- Date.Today:")
    assertFalse(
        entry.contains("Parameters: none."),
        "the API reference must not declare Date.Holidays parameterless")
    assertTrue(entry.contains("by (Bayern)"), "the API reference must list the state abbreviations")
    assertTrue(
        entry.contains("{ Date.Holidays > by ; he ; THIS_YEAR }"),
        "the API reference must carry the two-state example")
    assertTrue(
        entry.contains("WRONG (reported failure): `{ Holiday.BavariaAndHesse > list }`"),
        "the API reference must keep the reported failure")
    assertTrue(
        entry.contains("There is NO property parameter"),
        "the API reference must state that no property parameter exists")
  }

  @Test
  fun `the bundled details index describes the EP, not its leading type doc`() {
    val index = resource("codbi-core-details-index.json")
    val entry = index.substringAfter("\"Date.Holidays\": {").substringBefore("\"Date.Today\": {")
    assertFalse(
        entry.contains("The type of requests needed to identify identical requests."),
        "the index must not use the ApiRequest type doc as the EP description")
    assertFalse(entry.contains("\"parameters\": {}"), "the index must not declare no parameters")
    assertTrue(entry.contains("THIS_YEAR"), "the index must document the THIS_YEAR token")
    assertTrue(entry.contains("bw, by, be"), "the index must document the state abbreviations")
  }

  @Test
  fun `the always-sent canonical rules carry the EP id safety net`() {
    // The pass-2 stack gates whole `<!--SECTION:…-->` blocks: with 'sections: [logging]' every EP
    // rule of the decision core was dropped and the model only had the NAME INDEX. The canonical
    // rules are appended unconditionally, so the decisive EP knowledge must live there too.
    val canonical = prompt("codbi-canonical-output-rules.md")
    assertTrue(
        canonical.contains("the id catalogue is FIXED, the request's words are PARAMETERS"),
        "the canonical rules must state that EP ids are fixed and request words are parameters")
    assertFalse(
        canonical.contains("<!--SECTION:"),
        "the canonical rules must stay OUTSIDE section markers so the gate can never drop them")
    assertTrue(
        canonical.contains("{ Holiday.Bavaria > list ; Holiday.Hessen > list }"),
        "the second reported invention must be documented verbatim")
    assertTrue(
        canonical.contains("{ Date.Holidays > by ; he ; THIS_YEAR }"),
        "the correct two-state call must be in the always-sent rules")
    assertTrue(
        canonical.contains(
            "{ BayVIS.Behoerden.Details > { I > 0 ; { BayVIS.Behoerden.ID > Amt für"),
        "the BayVIS single-field chain must be in the always-sent rules")
    assertTrue(
        canonical.contains("REQUEST its details"),
        "the fallback must be 'request details', never inventing an id")
  }

  @Test
  fun `the chat prompt demands ep_wiring whenever an EP is involved`() {
    val chat = prompt("codbi-chat-system-prompt.md")
    assertTrue(
        chat.contains("EVERY request whose value comes from an ELEMENT PLACEHOLDER"),
        "the sections doc must tie EP usage to the ep_wiring section")
    assertTrue(
        chat.contains("ALWAYS include \"ep_wiring\" TOGETHER WITH \"logging\""),
        "a console-logging request with an EP must keep ep_wiring as well")
    assertTrue(
        chat.contains("\"logging\" alone is NOT enough"),
        "the reported run kept only [logging] — that must be forbidden explicitly")
  }

  @Test
  fun `the field-creation map carries the holiday request`() {
    val task = prompt("codbi-form-task-instruction.md")
    assertTrue(
        task.contains("'Feiertage von Bayern und Hessen dieses Jahr'"),
        "the pass-2 mapping list must carry the reported holiday request")
    assertTrue(
        task.contains("NEVER an invented id like { Holiday.BavariaAndHesse > list }"),
        "the mapping must exclude invented holiday ids")
  }
}
