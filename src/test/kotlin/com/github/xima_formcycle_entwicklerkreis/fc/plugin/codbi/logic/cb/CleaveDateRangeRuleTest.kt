package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guards the "a Cleave date field bounds its dates ITSELF" documentation.
 *
 * Reported case: "Füge noch ein Eingabfeld mit automatisch formatierter Eingabe für ein Datum in
 * das Formular ein. Es sollen nur Daten von 01.12.2025 bis 01.2026 eingegeben werden können." — the
 * assistant applied `HTML.Input.Cleave` correctly but never restricted the enterable dates: it did
 * not know that Cleave carries its OWN `DateMin`/`DateMax` parameters (`data-cb-datemin` /
 * `data-cb-datemax`, values in the AMERICAN `YYYY-MM-DD` form) and instead tried `Date.Min` — whose
 * companion identity `Date.Max` does not exist at all, so nothing was ever bound.
 *
 * The three places that must carry the wiring are checked here: the pass-1 element catalog (the
 * ONLY detail pass-1 sees), the pass-2 functionality reference (the details a targeted rerun
 * delivers) and the compact API reference. The "Date.Min/Date.Max" identity is additionally
 * forbidden, because naming a non-existent functionality invites exactly that wrong wiring.
 */
class CleaveDateRangeRuleTest {

  private fun resource(relative: String): String =
      CleaveDateRangeRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$relative")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled resource '$relative' not found")

  @Test
  fun `the pass-1 catalog tells that Cleave bounds dates with its own DateMin and DateMax`() {
    val catalog = resource("codbi-core-elements-compact.md")
    val cleave = catalog.substringAfter("### HTML.Input.Cleave").substringBefore("\n### ")
    assertTrue(
        cleave.contains("`DateMin`") && cleave.contains("`DateMax`"),
        "the pass-1 Cleave entry must name its own DateMin/DateMax parameters")
    assertTrue(
        cleave.contains("YYYY-MM-DD"),
        "the pass-1 Cleave entry must state the American YYYY-MM-DD form of the bounds")
    assertTrue(
        cleave.contains("NEVER Date.Min"),
        "the pass-1 Cleave entry must forbid Date.Min for a Cleave-bounded date field")
  }

  @Test
  fun `the pass-2 reference documents the exact Cleave date-range wiring`() {
    val details = resource("prompts/codbi-functionalities.md")
    val cleave = details.substringAfter("## HTML.Input.Cleave").substringBefore("\n## ")
    assertTrue(cleave.contains("data-cb-datemin"), "the details must name data-cb-datemin")
    assertTrue(cleave.contains("data-cb-datemax"), "the details must name data-cb-datemax")
    assertTrue(
        cleave.contains("2025-12-01"), "the details must show the German→American conversion")
    assertTrue(
        cleave.contains("do NOT invent a `Date.Max`"),
        "the details must forbid inventing the non-existent Date.Max functionality")
  }

  @Test
  fun `the compact API reference states the YYYY-MM-DD requirement`() {
    val api = resource("codbi-core-api-compact.md")
    assertTrue(api.contains("DateMin"), "the API reference must document DateMin")
    assertTrue(api.contains("YYYY-MM-DD"), "the API reference must require the YYYY-MM-DD form")
    // Even a targeted Date.Min rerun must learn that a Cleave date field is wired differently:
    // pass-1
    // asked for Date.Min, so THIS is the text pass-2 received.
    assertTrue(
        api.contains("RELATIVE ONLY — ONE BOUND ONLY — NOT FOR A CLEAVE DATE FIELD"),
        "the Date.Min entry must reject absolute dates and point a Cleave field to its own parameters")
  }

  @Test
  fun `the decision cores decide the Cleave wiring BEFORE any Date_Min reasoning`() {
    // The failing run requested Date.Min only, so the rule has to sit at the TOP of the date
    // section
    // (and must be present in the full-file variant too).
    for (file in listOf("prompts/codbi-general.decision.md", "prompts/codbi-general.md")) {
      val text = resource(file)
      assertTrue(
          text.contains("AUTO-FORMATTED (CLEAVE) DATE FIELD") ||
              text.contains("Auto-formatted (Cleave) date field"),
          "$file must carry the prominent Cleave-date-range rule")
      assertTrue(
          text.contains("data-cb-datemin") && text.contains("data-cb-datemax"),
          "$file must name the two Cleave parameters")
    }
  }

  @Test
  fun `no prompt pretends that a Date_Max functionality exists`() {
    // `Date.Min/Date.Max` used to be written as if it were one identity, which made the model emit
    // data-cb-func="Date.Max" + data-cb-maximum — a functionality the runtime does not know.
    for (file in
        listOf(
            "prompts/codbi-general.md",
            "prompts/codbi-general.decision.md",
            "prompts/codbi-general-rethink.md",
            "codbi-core-elements-compact.md")) {
      val text = resource(file)
      assertFalse(
          text.contains("Date.Min/Date.Max"),
          "$file must not present Date.Min/Date.Max as a single functionality")
    }
  }
}
