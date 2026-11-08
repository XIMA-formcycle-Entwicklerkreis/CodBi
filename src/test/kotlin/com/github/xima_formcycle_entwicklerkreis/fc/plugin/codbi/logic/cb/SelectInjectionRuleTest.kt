package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guards the `HTML.Select.Injection` teaching.
 *
 * Reported case: "Füge eine Auswahl ein die alle im BayVIS registrierten Ämter anzeigt." The
 * assistant applied the ELEMENT PLACEHOLDER `BayVIS.Behoerden` as if it were a functionality
 * (`data-cb-func="BayVIS.Behoerden"` + `data-cb-replacements` + `data-cb-property="innerHTML"`) and
 * left a bare `Bitte wählen` option, instead of wiring `data-cb-func="HTML.Select.Injection"` +
 * `data-cb-Values="{ BayVIS.Behoerden > bezeichnung }"`.
 */
class SelectInjectionRuleTest {

  private fun resource(relative: String): String =
      SelectInjectionRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$relative")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() }
          ?.replace("\r\n", "\n") ?: error("bundled resource '$relative' not found")

  @Test
  fun `the pass-1 catalog says the EP is a VALUE and covers the authorities request`() {
    val catalog = resource("codbi-core-elements-compact.md")
    val injection = catalog.substringAfter("### HTML.Select.Injection").substringBefore("\n### ")
    assertTrue(
        injection.contains("ELEMENT PLACEHOLDER (EP)"), "the entry must name the EP as the source")
    assertTrue(
        injection.contains("NEVER the functionality"),
        "the entry must forbid using it as the function")
    assertTrue(
        injection.contains("alle im BayVIS registrierten Aemter"),
        "the entry must map the reported authorities request")
    assertTrue(
        injection.contains("NOT active in this form"),
        "the entry must cover an inactive standard-configuration class")
    val bayvis = catalog.substringAfter("### BayVIS.Behoerden\n").substringBefore("\n### ")
    assertTrue(
        bayvis.contains("{ BayVIS.Behoerden > bezeichnung }"),
        "the EP entry must show the exact value wiring for the authority list")
    assertTrue(
        bayvis.contains("NEVER in the functionality"),
        "the EP entry must say it never goes into the functionality parameter")
  }

  @Test
  fun `the pass-2 details document every injection parameter and the BayVIS example`() {
    val api = resource("codbi-core-api-compact.md")
    val entry =
        api.substringAfter("- HTML.Select.Injection:").substringBefore("\n- HTML.SETAttribute")
    assertTrue(
        entry.contains("Populates the tagged XSelect with one option per entry"),
        "the details must describe what the functionality does")
    assertTrue(
        entry.contains("NEVER the functionality"), "the details must forbid the EP as the function")
    assertTrue(
        entry.contains("{ BayVIS.Behoerden > bezeichnung }"),
        "the Values parameter must carry the reported authority example")
    assertTrue(
        entry.contains("\"TRUE\" to clear the existing options"),
        "ReClean must be documented as the TRUE to clear the options")
    assertTrue(
        entry.contains("OpenPLZ.Localities would then show the postalCode"),
        "TextProperty/ValueProperty must be documented with the postalCode pitfall")
    assertTrue(
        entry.contains("The parameter is Values (data-cb-Values)"),
        "the details must name Values as the parameter this functionality reads")
    assertTrue(
        entry.contains("are NOT read by this functionality"),
        "the details must say the HTML.Text.Mapper parameters do nothing here")
    assertFalse(entry.contains("Configures 'TextProperty'"), "no generated filler may remain")
  }

  @Test
  fun `the long-form reference carries the BayVIS wiring and the EP rule`() {
    val details = resource("prompts/codbi-functionalities.md")
    val section = details.substringAfter("## HTML.Select.Injection").substringBefore("\n## ")
    assertTrue(
        section.contains("data-cb-Values for the BayVIS authority directory"),
        "the section must document the BayVIS value wiring")
    assertTrue(
        section.contains("{ BayVIS.Behoerden > bezeichnung }"),
        "the section must carry the exact BayVIS placeholder")
    assertTrue(
        section.contains("is an ELEMENT PLACEHOLDER and is NEVER a functionality"),
        "the section must state that an EP is never the functionality")
    assertTrue(
        section.contains("that is the HTML.Text.Mapper wiring"),
        "the section must name the wrong wiring the model produced")
    assertTrue(
        section.contains("a class of an INACTIVE standard configuration is INERT"),
        "the section must explain that an inactive standard-configuration class does nothing")
  }

  @Test
  fun `the build instruction carries the exact authorities wiring`() {
    val build = resource("prompts/codbi-form-task-instruction.md")
    val line =
        build.lines().firstOrNull { it.startsWith("- Auswahl aller Aemter/Behoerden") }
            ?: error("the authorities mapping line is missing")
    assertTrue(
        line.contains("data-cb-func=\"HTML.Select.Injection\""),
        "the mapping must use the injection")
    assertTrue(
        line.contains("{ BayVIS.Behoerden > bezeichnung }"), "the mapping must carry the EP value")
    assertTrue(
        line.contains("NEVER into data-cb-func"), "the mapping must forbid the EP as the function")
    assertTrue(
        line.contains("inactive configuration is inert"),
        "the mapping must explain the inactive-class case")
  }
}
