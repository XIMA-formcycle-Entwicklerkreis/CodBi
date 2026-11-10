package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Reported: for "Gib in der Konsole den Parameter FRID in der URL aus." the assistant did not know
 * the `URLParameter` EP at all.
 *
 * Facts taken from [`urlparameter.ts`](src/main/web/packages/form/src/js/EPs/urlparameter.ts):
 * * registered as `URLParameter` (exact spelling);
 * * one parameter — the NAME, validated with `REGEX(/[\w.-]+/)` and trimmed;
 * * `new URLSearchParams(window.location.search).get(name) ?? ""` — the result is a STRING and an
 *   absent parameter yields an EMPTY string (no error).
 */
class UrlParameterEpRuleTest {

  private fun resource(path: String): String =
      UrlParameterEpRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(path)
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("resource $path missing")

  private fun prompt(name: String): String =
      resource("com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/$name")

  private fun catalog(): String =
      resource(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-elements-compact.md")
          .replace("\r\n", "\n")

  private val correct = "{ URLParameter > FRID }"

  @Test
  fun `the compact catalog says that the EP exists and when to use it`() {
    val entry = catalog().substringAfter("### URLParameter\n").substringBefore("### ")
    assertTrue(
        entry.contains("URL query-string parameter"), "pass-1 must say what it reads: $entry")
    assertTrue(entry.contains("VALUE"), "pass-1 must say it returns the value: $entry")
    assertTrue(entry.contains("USE WHEN"), "pass-1 must carry a USE WHEN purpose: $entry")
    assertTrue(entry.contains("FRID"), "pass-1 must name a language-agnostic trigger: $entry")
    assertTrue(entry.contains("SV"), "pass-1 must separate it from the SV functionality: $entry")
    assertFalse(entry.contains("Param["), "pass-1 must NOT list parameters")
    assertFalse(entry.contains("{" + " URLParameter"), "pass-1 must NOT show a full EP example")
  }

  @Test
  fun `the detailed section teaches the single name parameter and the empty fallback`() {
    val section =
        prompt("codbi-element-placeholders.md")
            .substringAfter("## URLParameter\n")
            .substringBefore("\n## ")
    assertTrue(section.contains(correct), "the canonical idiom must be shown")
    assertTrue(section.contains("RAW name"), "the parameter must be the raw URL name")
    assertTrue(section.contains("case-sensitive"), "URL parameter names are case-sensitive")
    assertTrue(section.contains("EMPTY STRING"), "the absent-parameter fallback must be stated")
    assertTrue(section.contains("never throws"), "the no-error behaviour must be stated")
    assertTrue(section.contains("Net.URL"), "the Net.URL confusion must be excluded")
    assertTrue(section.contains("`SV` functionality"), "the SV confusion must be excluded")
    assertTrue(section.contains("{ FRID > }"), "the invented-id failure must be named")
    assertTrue(section.contains("{ URLParameter.FRID }"), "the composed-id failure must be named")
  }

  @Test
  fun `the API reference and the details index carry the EP`() {
    val api =
        resource(
            "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-api-compact.md")
    val entry = api.substringAfter("- URLParameter:").substringBefore("- V:")
    assertTrue(entry.contains("query-string parameter"), "the API reference must describe the EP")
    assertTrue(entry.contains("Param[1]: The NAME"), "the single parameter must be documented")
    assertTrue(entry.contains(correct), "the API reference must show the idiom")
    assertTrue(entry.contains("Net.URL"), "the API reference must exclude Net.URL")

    val index =
        resource(
            "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-details-index.json")
    val indexEntry = index.substringAfter("\"URLParameter\": {").substringBefore("\"V\": {")
    assertTrue(indexEntry.contains("query-string parameter"), "the index must describe the EP")
    assertTrue(indexEntry.contains(correct), "the index must show the idiom")
    assertTrue(indexEntry.contains("\"1\":"), "the index must declare the parameter")
  }

  @Test
  fun `the always-sent rules and the field map carry the rule`() {
    val canonical = prompt("codbi-canonical-output-rules.md")
    assertTrue(
        canonical.contains("READ THEM WITH THE `URLParameter` EP"),
        "the canonical rules must summarise the rule")
    assertTrue(canonical.contains(correct), "the canonical rules must carry the idiom")
    assertFalse(canonical.contains("<!--SECTION:"), "the canonical rules must stay ungated")

    val task = prompt("codbi-form-task-instruction.md")
    assertTrue(task.contains("'den Parameter <Name> aus der URL'"), "the field map needs a trigger")
    assertTrue(task.contains(correct), "the field map must carry the idiom")
  }
}
