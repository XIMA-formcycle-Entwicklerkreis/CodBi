package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Reported: for "Gib in der Konsole die Mail-Adresse des Mitarbeiters Salvatore Callari aus dem
 * LDAP aus." the assistant produced `{ LDAP.Find > filter ; givenName = Salvatore | sn = Callari
 * }`.
 *
 * Facts taken from [`ldap.find.ts`](src/main/web/packages/form/src/js/EPs/ldap.find.ts):
 * * slot 1 is validated with `REGEX(/(AND|OR)/i)` and mapped `and -> "%26"`, `or -> "|"`, anything
 *   else -> `"%26"` (silently AND) — so `filter` is never a mode;
 * * slot 2 is `^\w+\s*=\s*[\w.@+-]+(?:\s*\|\s*\w+\s*=\s*[\w.@+-]+)*$` — ALL conditions in ONE
 *   parameter, separated by `|`;
 * * slot 3 is the optional url (`IF(DEFINED(), REGEX(url))`).
 *
 * The teaching must stay language-agnostic: the mode is decided by MEANING, never by a keyword.
 */
class LdapFindModeRuleTest {

  private fun resource(path: String): String =
      LdapFindModeRuleTest::class
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

  private val wrong = "{ LDAP.Find > filter ; givenName = Salvatore | sn = Callari }"
  private val right = "{ LDAP.Find > AND ; givenName = Salvatore | sn = Callari }"

  @Test
  fun `the compact catalog names the combining mode without listing parameters`() {
    val entry = catalog().substringAfter("### LDAP.Find\n").substringBefore("### ")
    assertTrue(
        entry.contains("COMBINING MODE"), "pass-1 must name the first slot by meaning: $entry")
    assertTrue(entry.contains("AND"), "pass-1 must name the AND token: $entry")
    assertTrue(entry.contains("OR"), "pass-1 must name the OR token: $entry")
    assertTrue(entry.contains("attribute = value"), "pass-1 must name the condition shape: $entry")
    assertTrue(entry.contains("USE WHEN"), "pass-1 must carry a USE WHEN purpose: $entry")
    assertFalse(entry.contains("Param["), "pass-1 must NOT list parameters")
    assertFalse(entry.contains("{ LDAP.Find"), "pass-1 must NOT show a full EP example")
  }

  @Test
  fun `the detailed section forbids a descriptive word in slot one`() {
    val section =
        prompt("codbi-element-placeholders.md")
            .substringAfter("## LDAP.Find\n")
            .substringBefore("\n## ")
    assertTrue(section.contains("COMBINING MODE"), "the mode slot must be named")
    assertTrue(
        section.contains("NOT a word describing the query"), "descriptive words must be banned")
    assertTrue(section.contains("`filter`"), "the reported word must be named")
    assertTrue(section.contains("EMPTY slot means AND"), "the empty slot must be defined")
    assertTrue(section.contains("separated by `|`"), "the condition separator must be stated")
    assertTrue(
        section.contains("DECIDING THE MODE BY MEANING"), "the mode must be decided by meaning")
    assertTrue(section.contains(wrong), "the reported failure must be documented")
    assertTrue(section.contains(right), "the correct shape must be shown")
    assertTrue(
        section.contains("NEVER spread the conditions over several parameters"),
        "one condition per slot must be forbidden")
  }

  @Test
  fun `the API reference and the details index describe the mode and the conditions`() {
    val api =
        resource(
            "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-api-compact.md")
    val entry = api.substringAfter("- LDAP.Find:").substringBefore("- Net.URL:")
    assertFalse(
        entry.contains("The mode to use for the filter."), "the ambiguous old wording must be gone")
    assertTrue(entry.contains("LOGICAL COMBINING MODE"), "the API reference must name the mode")
    assertTrue(entry.contains("EXACTLY `AND` or `OR`"), "the allowed tokens must be exact")
    assertTrue(entry.contains(wrong), "the reported failure must be documented")
    assertTrue(entry.contains(right), "the correct shape must be documented")

    val index =
        resource(
            "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-details-index.json")
    val indexEntry = index.substringAfter("\"LDAP.Find\": {").substringBefore("\"Net.URL\": {")
    assertFalse(
        indexEntry.contains("The mode to use for the filter."),
        "the index must not repeat the ambiguous wording")
    assertTrue(indexEntry.contains("COMBINING MODE"), "the index must name the mode")
    assertTrue(indexEntry.contains("joined by |"), "the index must state the separator")
  }

  @Test
  fun `the always-sent rules and the field map carry the mode rule`() {
    val canonical = prompt("codbi-canonical-output-rules.md")
    assertTrue(
        canonical.contains("THE FIRST SLOT IS A COMBINING MODE"),
        "the canonical rules must summarise the mode rule")
    assertTrue(canonical.contains(wrong), "the canonical rules must carry the failure")
    assertTrue(canonical.contains(right), "the canonical rules must carry the correct shape")
    assertFalse(canonical.contains("<!--SECTION:"), "the canonical rules must stay ungated")

    val task = prompt("codbi-form-task-instruction.md")
    assertTrue(task.contains("'LDAP sn=<Name>'"), "the field map must keep an LDAP trigger")
    assertTrue(task.contains("COMBINING MODE"), "the field map must name the mode slot")
    assertTrue(task.contains(wrong), "the field map must carry the failure")
  }
}
