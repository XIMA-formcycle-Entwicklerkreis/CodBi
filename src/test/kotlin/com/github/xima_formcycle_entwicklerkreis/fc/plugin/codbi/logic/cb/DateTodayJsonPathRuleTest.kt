package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guards the teaching of `Date.Today` and `JSON.Path`, split the way the prompt architecture
 * requires: the **compact** catalog only says THAT both exist and WHEN to use them, while the
 * **detailed** references carry the full contract.
 *
 * Facts taken from [`date.today.ts`](src/main/web/packages/form/src/js/EPs/date.today.ts) and
 * [`json.path.ts`](src/main/web/packages/form/src/js/EPs/json.path.ts):
 * * `Date.Today` is declared `@INSTANCE.POST(Date)` and returns `new Date()` for `NOW`/no parameter
 *   (`processArithmeticParams` applies `±Nd/m/y`) — i.e. a **Date OBJECT**, never a string;
 * * `JSON.Path` takes `params[0]` = the OBJECT and `params[1]` = the dotted path;
 *   `current.indexOf("()") === -1 ? acc[current] : acc[current.substring(0, indexOf("()"))]()`
 *   means a segment written `name()` CALLS a **parameterless method**;
 * * a path interrupted by `undefined`/`null` throws a `CodBiError`.
 *
 * Reported failure: "Gib in der Konsole getMonth() von dem heutigen Tag aus." produced
 * `data-cb-Data = getMonth()`; correct is `{ JSON.Path > { Date.Today > NOW } ; getMonth() }`.
 */
class DateTodayJsonPathRuleTest {

  private val idiom = "{ JSON.Path > { Date.Today > NOW } ; getMonth() }"

  private fun prompt(name: String): String =
      DateTodayJsonPathRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/$name")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("prompt $name missing")

  private fun resource(relative: String): String =
      DateTodayJsonPathRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$relative")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled resource '$relative' not found")

  private fun section(markdown: String, heading: String, nextHeading: String): String =
      markdown.substringAfter("$heading\n").substringBefore("\n$nextHeading")

  @Test
  fun `the compact catalog only says what Date Today and JSON Path are and when to use them`() {
    val compact = resource("codbi-core-elements-compact.md")

    val today = section(compact, "### Date.Today", "### ")
    assertTrue(today.contains("date OBJECT"), "pass-1 must state that today is an OBJECT")
    assertTrue(today.contains("NOT a formatted string"), "pass-1 must deny the string form")
    assertTrue(today.contains("USE WHEN"), "pass-1 must carry a USE WHEN purpose")
    assertTrue(today.contains("getMonth()"), "pass-1 must name a language-agnostic trigger")
    assertFalse(today.contains("Param["), "pass-1 must NOT list parameters")
    assertFalse(today.contains("{ Date.Today"), "pass-1 must NOT show a full EP example")

    val path = section(compact, "### JSON.Path", "### ")
    assertTrue(path.contains("PARAMETERLESS METHOD"), "pass-1 must name the method-call capability")
    assertTrue(path.contains("name()"), "pass-1 must show the bracket syntax")
    assertTrue(path.contains("USE WHEN"), "pass-1 must carry a USE WHEN purpose")
    assertTrue(path.contains("getMonth()"), "pass-1 must name a language-agnostic trigger")
    assertFalse(path.contains("Param["), "pass-1 must NOT list parameters")
    assertFalse(path.contains("{ JSON.Path"), "pass-1 must NOT show a full EP example")
  }

  @Test
  fun `the detailed Date Today section teaches the object return type and member access`() {
    val section = section(prompt("codbi-element-placeholders.md"), "## Date.Today", "## ")
    assertTrue(section.contains("DATE OBJECT"), "the return type must be stated")
    assertTrue(section.contains("never a formatted string"), "the string confusion must be denied")
    assertTrue(section.contains("`NOW`"), "the NOW token must be named")
    assertTrue(section.contains("`+1d`"), "the arithmetic tokens must be named")
    assertTrue(
        section.contains("READING A MEMBER OF TODAY'S DATE"),
        "member access on today's date must be taught")
    assertTrue(section.contains(idiom), "the canonical idiom must be shown")
    assertTrue(section.contains("neither a value nor an EP"), "a bare member name must be rejected")
    assertTrue(
        section.contains("empty arithmetic slot"),
        "an empty '{ Date.Today > }' slot must be banned")
  }

  @Test
  fun `the detailed JSON Path section teaches fixed order, properties and method calls`() {
    val section = section(prompt("codbi-element-placeholders.md"), "## JSON.Path", "## ")
    assertTrue(section.contains("OBJECT first"), "the fixed parameter order must be stated")
    assertTrue(section.contains("READS A PROPERTY"), "property reads must be taught")
    assertTrue(section.contains("PARAMETERLESS METHOD"), "method calls must be taught")
    assertTrue(section.contains("ROUND BRACKETS"), "the bracket syntax must be explained")
    assertTrue(section.contains("getMonth()"), "a method-call example must be shown")
    assertTrue(section.contains(idiom), "the canonical idiom must be shown")
    assertTrue(
        section.contains("data-cb-Data = getMonth()"), "the reported failure must be documented")
    assertTrue(section.contains("CodBiError"), "the interrupted-path error must be documented")
  }

  @Test
  fun `the API reference and the details index declare the object and the member access`() {
    val api = resource("codbi-core-api-compact.md")

    val today = api.substringAfter("- Date.Today:").substringBefore("- Date.Weekends:")
    assertTrue(today.contains("DATE OBJECT"), "the API reference must state the return type")
    assertTrue(today.contains("getMonth()"), "the API reference must show the member access")
    assertFalse(today.contains("e.g.\n"), "the truncated parameter text must be gone")

    val path = api.substringAfter("- JSON.Path:").substringBefore("- LDAP.Find:")
    assertTrue(path.contains("PARAMETERLESS METHOD"), "method calls must be documented")
    assertTrue(path.contains("ROUND BRACKETS"), "the bracket syntax must be documented")
    assertTrue(path.contains("getMonth()"), "a method-call example must be documented")
    assertFalse(
        path.contains("out of the one given in the."), "the truncated sentence must be gone")

    val index = resource("codbi-core-details-index.json")

    val indexToday =
        index.substringAfter("\"Date.Today\": {").substringBefore("\"Date.Weekends\": {")
    assertTrue(indexToday.contains("DATE OBJECT"), "the index must state the return type")

    val indexPath = index.substringAfter("\"JSON.Path\": {").substringBefore("\"LDAP.Find\": {")
    assertTrue(indexPath.contains("PARAMETERLESS METHOD"), "the index must name method calls")
    assertTrue(indexPath.contains("getMonth()"), "the index must show the syntax")
  }

  @Test
  fun `the always-sent rules, the decision cores and the field map carry the rule`() {
    val canonical = prompt("codbi-canonical-output-rules.md")
    assertTrue(
        canonical.contains("OBJECT-PRODUCING EPs AND MEMBER ACCESS"),
        "the canonical rules must summarise the rule")
    assertTrue(canonical.contains(idiom), "the canonical rules must carry the idiom")
    assertTrue(canonical.contains("data-cb-Data = getMonth()"), "the failure must be named")
    assertFalse(canonical.contains("<!--SECTION:"), "the canonical rules must stay ungated")

    for (core in
        listOf("codbi-general.md", "codbi-general.decision.md", "codbi-general-rethink.md")) {
      val text = prompt(core)
      assertTrue(
          text.contains("OBJECT-PRODUCING EPs AND MEMBER ACCESS"),
          "$core must carry the object/member rule")
      assertTrue(text.contains(idiom), "$core must carry the idiom")
    }

    val task = prompt("codbi-form-task-instruction.md")
    assertTrue(
        task.contains("'getMonth() von dem heutigen Tag'"), "the field map must carry a trigger")
    assertTrue(task.contains(idiom), "the field map must carry the idiom")
  }
}
