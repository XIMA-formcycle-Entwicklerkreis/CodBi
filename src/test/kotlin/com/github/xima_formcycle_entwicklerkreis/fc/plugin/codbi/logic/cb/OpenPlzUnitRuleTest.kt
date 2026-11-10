package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Reported: for "Gib in der Konsole alle Kantone der Schweiz aus die in OpenPLZ registriert sind."
 * the assistant produced `{ OpenPLZ > Schweiz }`.
 *
 * Facts taken from
 * [`openplz.organizationalunits.ts`](src/main/web/packages/form/src/js/EPs/openplz.organizationalunits.ts):
 * * the EP "does not search for units but rather returns all available ones";
 * * slot 1 is validated against `(de|en|at|li|ch)` — a country NAME is never accepted;
 * * slot 2 is the orgaUnit (`FederalStates`, `FederalProvinces`, `Cantons`);
 * * slots 3/4 are the official key and `Municipalities` / `Districts`.
 *
 * The teaching must stay language-agnostic: cantons/provinces/states are recognised by MEANING.
 */
class OpenPlzUnitRuleTest {

  private fun resource(path: String): String =
      OpenPlzUnitRuleTest::class
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

  private val wrong = "{ OpenPLZ > Schweiz }"
  private val right = "{ OpenPLZ.OrganizationalUnits > ch ; Cantons }"

  @Test
  fun `the compact catalog sends cantons to the organisational-units EP`() {
    val units =
        catalog().substringAfter("### OpenPLZ.OrganizationalUnits\n").substringBefore("### ")
    assertTrue(
        units.contains("ALL organisational units"),
        "pass-1 must say it returns the whole list: $units")
    assertTrue(units.contains("Kantone"), "pass-1 must name the canton trigger: $units")
    assertTrue(units.contains("Cantons"), "pass-1 must name the unit token: $units")
    assertTrue(units.contains("2-letter CODE"), "pass-1 must require the country code: $units")
    assertTrue(units.contains("USE WHEN"), "pass-1 must carry a USE WHEN purpose: $units")
    assertFalse(units.contains("Param["), "pass-1 must NOT list parameters")
    assertFalse(units.contains("{ OpenPLZ"), "pass-1 must NOT show a full EP example")

    val generic = catalog().substringAfter("### OpenPLZ\n").substringBefore("### ")
    assertTrue(
        generic.contains("GENERIC"), "pass-1 must mark OpenPLZ as the generic call: $generic")
    assertTrue(
        generic.contains("NOT the EP for"),
        "pass-1 must deny the all-units use of the generic EP: $generic")
  }

  @Test
  fun `the detailed OpenPLZ section teaches the country code and the unit tokens`() {
    val section =
        prompt("codbi-element-placeholders.md")
            .substringAfter("## OpenPLZ EPs\n")
            .substringBefore("\n## ")
    assertTrue(
        section.contains("PICK THE EP BY WHAT IS BEING LOOKED FOR"),
        "the EP choice must be taught by meaning")
    assertTrue(section.contains(wrong), "the reported failure must be documented")
    assertTrue(section.contains(right), "the correct shape must be shown")
    assertTrue(
        section.contains("THE COUNTRY IS ALWAYS ITS 2-LETTER CODE"),
        "the country-code rule must be explicit")
    assertTrue(
        section.contains("THE ORGA-UNIT TOKEN IS CAPITALIZED ENGLISH"),
        "the unit tokens must be explicit")
    assertTrue(section.contains("FederalStates"), "the federal-state token must be named")
    assertTrue(section.contains("FederalProvinces"), "the province token must be named")
    assertTrue(
        section.contains("returns all available ones"),
        "the EP contract (a list, not a search) must be quoted")
  }

  @Test
  fun `the API reference and the details index never use the generic EP for a canton list`() {
    val api =
        resource(
            "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-api-compact.md")
    assertTrue(api.contains(right), "the API reference must carry the correct example")
    assertFalse(api.contains("{ OpenPLZ > ch ; Cantons }"), "the wrong example must be gone")
    assertTrue(api.contains("2-letter CODE"), "the API reference must require the country code")

    val units =
        api.substringAfter("- OpenPLZ.OrganizationalUnits:").substringBefore("- OpenPLZ.Streets:")
    assertTrue(units.contains("Cantons"), "the unit tokens must be documented")
    assertTrue(units.contains("ORGANISATIONAL UNIT"), "the second slot must be named by meaning")

    val index =
        resource(
            "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-details-index.json")
    val indexUnits =
        index
            .substringAfter("\"OpenPLZ.OrganizationalUnits\": {")
            .substringBefore("\"OpenPLZ.Streets\": {")
    assertTrue(indexUnits.contains("Cantons"), "the index must name the unit tokens")
    assertTrue(indexUnits.contains("2-letter CODE"), "the index must require the country code")
    val indexGeneric = index.substringAfter("\"OpenPLZ\": {").substringBefore("\"Sorted\": {")
    assertTrue(
        indexGeneric.contains("2-letter CODE"), "the generic entry must require the country code")
  }

  @Test
  fun `the always-sent rules and the field map carry the same rule`() {
    val canonical = prompt("codbi-canonical-output-rules.md")
    assertTrue(
        canonical.contains("A COUNTRY IS A CODE AND CANTONS ARE ORGANISATIONAL UNITS"),
        "the canonical rules must summarise the rule")
    assertTrue(canonical.contains(wrong), "the canonical rules must carry the failure")
    assertTrue(canonical.contains(right), "the canonical rules must carry the correct shape")
    assertFalse(canonical.contains("<!--SECTION:"), "the canonical rules must stay ungated")

    val task = prompt("codbi-form-task-instruction.md")
    assertTrue(task.contains("'Kantone der Schweiz'"), "the field map must carry the trigger")
    assertTrue(task.contains(right), "the field map must carry the correct shape")
    assertFalse(
        task.contains("'{ OpenPLZ > ch ; Cantons }'") ||
            task.contains("→ { OpenPLZ > ch ; Cantons }"),
        "the field map must not teach the generic EP for a canton list")
  }
}
