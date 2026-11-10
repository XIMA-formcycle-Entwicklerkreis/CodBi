package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guards the teaching of the three EPs `F`, `Date.Arithmetic` and `Date.FromString`, split the way
 * the prompt architecture requires:
 * * **compact / pass-1 catalog** — ONLY "that the EP exists" + "when to use it" (no parameters, no
 *   examples), so the model can decide and then request the details on demand;
 * * **detailed EP reference + API reference + details index** — the full contract (slot order,
 *   value types, return types, pitfalls).
 *
 * Facts taken from the code:
 * * [`f.ts`](src/main/web/packages/form/src/js/EPs/f.ts): 3 parameters (property name, exact value,
 *   array), strict `===` comparison, ALWAYS returns an array;
 * * [`date.arithmetic.ts`](src/main/web/packages/form/src/js/EPs/date.arithmetic.ts): parameter 2
 *   is EITHER the format OR the first arithmetic op (decided by `+`/`-` in the value), tokens
 *   `<+|-><n><d|m|y>`, returns a `Date`;
 * * [`date.fromstring.ts`](src/main/web/packages/form/src/js/EPs/date.fromstring.ts): date string +
 *   optional format (default `DD.MM.YYYY`), returns `Array<Date|null>`.
 */
class DateAndFilterEpRuleTest {

  private fun prompt(name: String): String =
      DateAndFilterEpRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/$name")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("prompt $name missing")

  private fun resource(relative: String): String =
      DateAndFilterEpRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$relative")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled resource '$relative' not found")

  private fun compactEntry(id: String): String {
    val catalog = resource("codbi-core-elements-compact.md")

    return catalog.substringAfter("### $id\n").substringBefore("\n### ")
  }

  @Test
  fun `the compact catalog only says what each EP is and when to use it`() {
    for ((id, whenTrigger) in
        listOf(
            "F" to "den Eintrag mit",
            "Date.Arithmetic" to "in 3 Tagen",
            "Date.FromString" to "als Datum")) {
      val entry = compactEntry(id)
      assertTrue(entry.contains("USE WHEN"), "$id must have a USE WHEN purpose in pass-1")
      assertTrue(
          entry.contains(whenTrigger),
          "$id must name a language-agnostic trigger phrase ($whenTrigger)")
      assertFalse(
          entry.contains("Param["),
          "$id must NOT list parameters in the compact catalog (details are requested on demand)")
      assertFalse(
          entry.contains("{ $id >"), "$id must NOT show a full EP example in the compact catalog")
    }
    assertTrue(
        compactEntry("F").contains("Narrows a LIST"), "F's pass-1 value must be a list filter")
    assertTrue(
        compactEntry("Date.Arithmetic").contains("Moves a date"),
        "Date.Arithmetic's pass-1 value must be a date shift")
    assertTrue(
        compactEntry("Date.FromString").contains("Turns a date STRING into a date"),
        "Date.FromString's pass-1 value must be parsing a date string")
  }

  @Test
  fun `the detailed F section teaches slots, strictness, return type and outermost rule`() {
    val section =
        prompt("codbi-element-placeholders.md").substringAfter("## F\n").substringBefore("\n## ")
    assertTrue(
        section.contains("THREE parameters, in this exact order"), "the slot order must be stated")
    assertTrue(section.contains("Param[1] = the property NAME"), "slot 1 semantics")
    assertTrue(section.contains("Param[2] = the value to match"), "slot 2 semantics")
    assertTrue(section.contains("Param[3] = the ARRAY to scan"), "slot 3 semantics")
    assertTrue(
        section.contains("ALWAYS returns an ARRAY"),
        "the return type must be corrected (never a bare object)")
    assertTrue(section.contains("{ I > 0 ; { F >"), "the single-result pattern must be shown")
    assertTrue(section.contains("strict (`===`)"), "the strict comparison must be stated")
    assertTrue(section.contains("must be the OUTERMOST EP"), "the outermost rule must be kept")
    assertTrue(section.contains("WRONG: \"{ Sorted > { F >"), "the wrong wrapping must be kept")
  }

  @Test
  fun `the detailed date sections teach the format-or-operation slot and the return types`() {
    val eps = prompt("codbi-element-placeholders.md")
    val arithmetic =
        eps.substringAfter("## Date.Arithmetic\n").substringBefore("\n## Date.FromString")
    assertTrue(arithmetic.contains("EITHER the input FORMAT"), "param 2 is format OR operation")
    assertTrue(
        arithmetic.contains("is treated as arithmetic"), "the + / - heuristic must be explained")
    assertTrue(arithmetic.contains("`+1d`"), "arithmetic tokens must be listed")
    assertTrue(
        arithmetic.contains("{ Date.Arithmetic > 01.12.2026 ; +3d }"),
        "a shift example is required")
    assertTrue(arithmetic.contains("DATE OBJECT"), "the Date-object return type must be stated")
    assertTrue(
        arithmetic.contains("prefer `Date.FromString`"),
        "pure parsing must point to Date.FromString")
    assertTrue(
        arithmetic.contains("{ Date.Today > +3d }"), "today's shift must not use Date.Arithmetic")

    val fromString = eps.substringAfter("## Date.FromString\n").substringBefore("\n## ")
    assertTrue(fromString.contains("`DD.MM.YYYY` is assumed"), "the default format must be stated")
    assertTrue(fromString.contains("Array<Date|null>"), "the array return type must be stated")
    assertTrue(fromString.contains("{ I > 0 ; { Date.FromString"), "the I pick must be shown")
    assertTrue(
        fromString.contains("never pass the result into a string-parameter EP"),
        "the string-slot restriction must be stated")
  }

  @Test
  fun `the API reference and the details index carry the same contracts`() {
    val api = resource("codbi-core-api-compact.md")
    val f = api.substringAfter("- F:").substringBefore("- I:")
    assertTrue(
        f.contains("ALWAYS returns an ARRAY"), "the API reference must state F's return type")
    assertTrue(f.contains("STRICTLY"), "the API reference must state the strict comparison")
    assertTrue(
        f.contains("must be the OUTERMOST EP"), "the API reference must keep the outermost rule")
    val arithmetic = api.substringAfter("- Date.Arithmetic:").substringBefore("- Date.FromString:")
    assertTrue(
        arithmetic.contains("treated as arithmetic"), "the API reference must explain slot 2")
    assertTrue(arithmetic.contains("DATE OBJECT"), "the API reference must state the return type")
    val fromString = api.substringAfter("- Date.FromString:").substringBefore("- Date.Holidays:")
    assertTrue(
        fromString.contains("`DD.MM.YYYY` is assumed"), "the default format must be documented")
    assertTrue(fromString.contains("Array<Date|null>"), "the array return must be documented")

    val index = resource("codbi-core-details-index.json")
    val fIndex = index.substringAfter("\"F\": {").substringBefore("\"I\": {")
    assertTrue(
        fIndex.contains("ALWAYS returns an ARRAY"),
        "the index must not claim a single object is returned")
    assertTrue(fIndex.contains("OUTERMOST"), "the index must keep the outermost rule")
    val arithmeticIndex =
        index.substringAfter("\"Date.Arithmetic\": {").substringBefore("\"Date.FromString\": {")
    assertTrue(
        arithmeticIndex.contains("OR the FIRST arithmetic operation"),
        "the index must document the format-or-operation slot")
  }

  @Test
  fun `the always-sent rules summarise the date and filter contracts`() {
    val canonical = prompt("codbi-canonical-output-rules.md")
    assertTrue(
        canonical.contains("DATE AND FILTER EPs"),
        "the canonical rules must summarise the three EPs")
    assertTrue(
        canonical.contains("must be the OUTERMOST EP"),
        "the canonical rules must keep F's shape rule")
    assertTrue(
        canonical.contains("compare"), "the canonical rules must mention the strict comparison")
    assertFalse(canonical.contains("<!--SECTION:"), "the canonical rules must stay ungated")

    val task = prompt("codbi-form-task-instruction.md")
    assertTrue(
        task.contains("'den Eintrag mit der PLZ 91522 finden'"), "the map must carry an F example")
    assertTrue(
        task.contains("{ I > 0 ; { F > <property> ; <exact value> ; <array EP> } }"),
        "the F shape must be in the map")
    assertTrue(
        task.contains("{ Date.Arithmetic > 01.12.2026 ; +3d }"),
        "the map must carry the shift example")
    assertTrue(
        task.contains("{ Date.FromString > 01.12.2026 }"), "the map must carry the parse example")
  }
}
