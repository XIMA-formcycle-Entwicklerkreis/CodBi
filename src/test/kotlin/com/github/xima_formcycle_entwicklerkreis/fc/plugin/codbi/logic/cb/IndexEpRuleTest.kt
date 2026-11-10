package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guards the teaching of the `I` element placeholder, split the way the prompt architecture
 * requires: the **compact** catalog only says THAT it exists and WHEN to use it, while the
 * **detailed** references carry the full contract.
 *
 * Facts taken from [`i.ts`](src/main/web/packages/form/src/js/EPs/i.ts):
 * * parameters: `1` = index (string or number, `parseInt(trim())`), `2` = the array;
 * * 0-based (`params[1][Number.parseInt(params[0])]`);
 * * a NON-array second parameter with index `0` is returned unchanged, any other index throws a
 *   `CodBiError` ("The second parameter of I must be an array …").
 */
class IndexEpRuleTest {

  private fun prompt(name: String): String =
      IndexEpRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/$name")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("prompt $name missing")

  private fun resource(relative: String): String =
      IndexEpRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$relative")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled resource '$relative' not found")

  @Test
  fun `the compact catalog only says what I is and when to use it`() {
    val entry =
        resource("codbi-core-elements-compact.md")
            .substringAfter("### I\n")
            .substringBefore("\n### ")
    assertTrue(entry.contains("0-based"), "pass-1 must state the position base")
    assertTrue(entry.contains("USE WHEN"), "pass-1 must carry a USE WHEN purpose")
    assertTrue(entry.contains("returns an ARRAY"), "pass-1 must name the array precondition")
    assertTrue(entry.contains("den ersten Treffer"), "pass-1 must name a language-agnostic trigger")
    assertFalse(entry.contains("Param["), "pass-1 must NOT list parameters")
    assertFalse(entry.contains("{ I >"), "pass-1 must NOT show a full EP example")
  }

  @Test
  fun `the detailed I section teaches slots, array-only usage and the tolerance`() {
    val section =
        prompt("codbi-element-placeholders.md").substringAfter("## I\n").substringBefore("\n## ")
    assertTrue(
        section.contains("TWO parameters in this exact order"), "the slot order must be stated")
    assertTrue(section.contains("Param[1] = the INDEX"), "slot 1 semantics")
    assertTrue(section.contains("Param[2] = the ARRAY-returning EP"), "slot 2 semantics")
    assertTrue(section.contains("0-based"), "the base of the index must be stated")
    assertTrue(
        section.contains("only when the inner EP yields an ARRAY"),
        "the array precondition must be explicit")
    assertTrue(
        section.contains("{ I > 0 ; { BayVIS.Behoerden.ID > Amt für Digitales } }"),
        "the canonical idiom must be shown")
    assertTrue(
        section.contains("DO NOT use `I` on an EP that already returns a SINGLE value"),
        "single-value EPs must be excluded")
    assertTrue(section.contains("THROWS a CodBiError"), "the non-array error must be documented")
    assertTrue(section.contains("OUT OF RANGE"), "the out-of-range behaviour must be documented")
  }

  @Test
  fun `the API reference and the details index declare the real slots`() {
    val api = resource("codbi-core-api-compact.md")
    val entry = api.substringAfter("- I:").substringBefore("- JSON.Path:")
    assertFalse(
        entry.contains("Parameters: none."), "the API reference must not say 'no parameters'")
    assertTrue(entry.contains("0-based"), "the API reference must state the base")
    assertTrue(entry.contains("Param[1]: The INDEX"), "slot 1 must be documented")
    assertTrue(entry.contains("Param[2]: The ARRAY-returning EP"), "slot 2 must be documented")
    assertTrue(entry.contains("THROWS"), "the non-array error must be documented")

    val index = resource("codbi-core-details-index.json")
    val indexEntry = index.substringAfter("\"I\": {").substringBefore("\"JSON.Path\": {")
    assertFalse(indexEntry.contains("\"parameters\": {}"), "the index must declare the slots")
    assertTrue(indexEntry.contains("0-based"), "the index must state the base")
    assertTrue(indexEntry.contains("ARRAY"), "the index must name the array parameter")
  }

  @Test
  fun `the always-sent rules and the field map carry the I contract`() {
    val canonical = prompt("codbi-canonical-output-rules.md")
    assertTrue(canonical.contains("INDEX EP I"), "the canonical rules must summarise I")
    assertTrue(canonical.contains("the first match"), "the { I > 0 } idiom must be named")
    assertTrue(canonical.contains("needs NO I"), "the single-value exclusion must be stated")
    assertFalse(canonical.contains("<!--SECTION:"), "the canonical rules must stay ungated")

    val task = prompt("codbi-form-task-instruction.md")
    assertTrue(task.contains("'den ersten Treffer'"), "the field map must carry an I trigger")
    assertTrue(task.contains("{ I > 0 ; <array EP> }"), "the field map must carry the I shape")
  }
}
