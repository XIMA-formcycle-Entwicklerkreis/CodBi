package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Reported prompt:
 *
 * `Gib die Wochenenden bis zum 01.12.2026 aus.`
 *
 * The assistant emitted `{ Date.Weekends > { Date.Today > } ; { Date.FromString > 01.12.2026 ;
 * dd.MM.yyyy } }` — two DATE OBJECTS in parameters that the EP validates as `dd.MM.yyyy` STRINGS
 * ([`date.weekends.ts`](src/main/web/packages/form/src/js/EPs/date.weekends.ts): `@AE.PRE([new
 * TYPE("string"), new REGEX(REGEX.stdExp.date)])`, parameters split on "." into day/month/year) —
 * plus a `Date.Today` with an EMPTY arithmetic parameter. Correct: `{ Date.Weekends > 01.12.2026
 * }`.
 *
 * Root causes covered:
 * 1. the pass-1 catalog described the EP by its IMPLEMENTATION ("Registers the weekend EP (plus the
 *    CSS injection it needs)"), so its argument type was invisible;
 * 2. the API reference and the details index declared it `Parameters: none.` / `"parameters": {}` —
 *    an EP without parameters invites wrapping values that look "more correct";
 * 3. no rule said that an EP's declared ARGUMENT TYPE is binding (string vs date object) — the same
 *    class of error as the earlier id/order inventions.
 */
class DateEpValueTypeRuleTest {

  private fun prompt(name: String): String =
      DateEpValueTypeRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/$name")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("prompt $name missing")

  private fun resource(relative: String): String =
      DateEpValueTypeRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$relative")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled resource '$relative' not found")

  private val wrongEp =
      "{ Date.Weekends > { Date.Today >  } ; { Date.FromString > 01.12.2026 ; dd.MM.yyyy } }"

  @Test
  fun `the EP reference teaches the dd MM yyyy string arguments`() {
    val eps = prompt("codbi-element-placeholders.md")
    val section = eps.substringAfter("## Date.Weekends\n").substringBefore("\n## ")
    assertTrue(section.isNotBlank(), "the EP reference must contain a Date.Weekends section")
    assertTrue(
        section.contains("PLAIN STRINGS in `dd.MM.yyyy`"), "the argument format must be named")
    assertTrue(
        section.contains("DATE OBJECT is rejected"),
        "the type restriction must be stated explicitly")
    assertTrue(section.contains(wrongEp), "the reported wrong EP must be documented")
    assertTrue(
        section.contains("CORRECT: `{ Date.Weekends > 01.12.2026 }`"),
        "the correct call must be shown")
    assertTrue(
        section.contains("ONE parameter = the END of the range"),
        "the one-vs-two parameter semantics must be documented")
    assertTrue(
        section.contains("`{ Date.Today }` is enough"),
        "the empty Date.Today arithmetic must be corrected")
    assertTrue(
        section.contains("TWO parameters = begin `;` end"),
        "the EP reference must teach the two-parameter range")
    assertTrue(
        section.contains("{ Date.Weekends > 01.12.2026 ; 31.12.2026 }"),
        "the EP reference must show a bounded range example")
  }

  @Test
  fun `the pass-1 entry describes the value, not the implementation`() {
    val entry =
        resource("codbi-core-elements-compact.md")
            .substringAfter("### Date.Weekends\n")
            .substringBefore("\n### ")
    assertTrue(entry.contains("WEEKEND dates"), "pass-1 must say what the EP produces")
    assertTrue(entry.contains("dd.MM.yyyy STRINGS"), "pass-1 must name the argument type")
    assertTrue(entry.contains("NEVER date objects"), "pass-1 must exclude date objects")
    assertFalse(
        entry.contains("Registers the weekend EP"),
        "the implementation wording that hid the contract must be gone")
  }

  @Test
  fun `the API reference and the details index declare the real parameters`() {
    val api = resource("codbi-core-api-compact.md")
    val apiEntry = api.substringAfter("- Date.Weekends:").substringBefore("- DOM.Query:")
    assertFalse(
        apiEntry.contains("Parameters: none."), "the API reference must not say 'no parameters'")
    assertTrue(apiEntry.contains("dd.MM.yyyy"), "the API reference must name the string format")
    assertTrue(
        apiEntry.contains("WRONG (reported failure)"), "the API reference must keep the failure")
    assertTrue(
        apiEntry.contains("A DATE OBJECT is NOT accepted"),
        "the API reference must state the rejected type")

    val index = resource("codbi-core-details-index.json")
    val indexEntry =
        index.substringAfter("\"Date.Weekends\": {").substringBefore("\"DOM.Query\": {")
    assertFalse(
        indexEntry.contains("Registers the \\\"Date.Weekend\\\"-EP"),
        "the index must not use the registration sentence as the description")
    assertFalse(indexEntry.contains("\"parameters\": {}"), "the index must declare the parameters")
    assertTrue(indexEntry.contains("dd.MM.yyyy"), "the index must document the dd.MM.yyyy strings")
  }

  @Test
  fun `the always-sent rules state that an EP argument type is binding`() {
    val canonical = prompt("codbi-canonical-output-rules.md")
    assertTrue(
        canonical.contains("ARGUMENT TYPES AND SLOT SEMANTICS ARE PART OF THE EP CONTRACT"),
        "the canonical rules must state that the declared argument type AND slot meaning are binding")
    assertTrue(
        canonical.contains(wrongEp), "the reported wrong EP must be in the always-sent rules")
    assertTrue(
        canonical.contains("{ Date.Weekends > 01.12.2026 }"),
        "the correct call must be in the always-sent rules")
    assertTrue(
        canonical.contains("param 1 = START, param 2 = END"),
        "the always-sent rules must teach the two-parameter range semantics")
    assertTrue(
        canonical.contains("{ Date.Weekends > 01.12.2026 ; 31.12.2026 }"),
        "the always-sent rules must show a bounded range example")
    assertFalse(
        canonical.contains("<!--SECTION:"), "the canonical rules must stay outside section markers")
  }

  @Test
  fun `the one-vs-two-parameter semantics is taught in every always-relevant layer`() {
    val cores = listOf("codbi-general.md", "codbi-general.decision.md", "codbi-general-rethink.md")
    for (file in cores) {
      val text = prompt(file)
      assertTrue(
          text.contains("a BOUNDED range uses TWO strings, param 1 = START, param 2 = END"),
          "$file must teach the bounded two-parameter range")
      assertTrue(
          text.contains("{ Date.Weekends > 01.12.2026 ; 31.12.2026 }"),
          "$file must show the bounded range example")
      assertTrue(
          text.contains("ONE dd.MM.yyyy string = the range END"),
          "$file must state the single-parameter meaning (today … given date)")
    }
    val task = prompt("codbi-form-task-instruction.md")
    assertTrue(
        task.contains("ONE parameter = from TODAY up to that date"),
        "the field-creation map must state the single-parameter meaning")
    assertTrue(
        task.contains("{ Date.Weekends > 01.12.2026 ; 31.12.2026 }"),
        "the field-creation map must show the bounded range example")
    val compact =
        resource("codbi-core-elements-compact.md")
            .substringAfter("### Date.Weekends\n")
            .substringBefore("\n### ")
    assertTrue(
        compact.contains("TWO parameters = START `;` END"), "pass-1 must teach the range form")
    assertTrue(
        compact.contains("{ Date.Weekends > 01.12.2026 ; 31.12.2026 }"),
        "pass-1 must show the bounded range example")
  }

  @Test
  fun `every decision core carries the argument-type rule`() {
    for (file in
        listOf("codbi-general.md", "codbi-general.decision.md", "codbi-general-rethink.md")) {
      val text = prompt(file)
      assertTrue(
          text.contains("EP ARGUMENT TYPES (language-agnostic)"),
          "$file must carry the argument-type rule")
      assertTrue(
          text.contains("{ Date.Weekends > 01.12.2026 }"), "$file must show the correct call")
    }
  }
}
