package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guards the `HTML.SETAttribute` teaching.
 *
 * Reported case: "Erstell ein Eingabefeld für ein Datum und setzen das title Attribut des neuen
 * Eingabefeldes auf JOJO." The assistant created the date input but did not apply
 * `HTML.SETAttribute` (data-cb-name="title" + data-cb-toset="JOJO"). The prompts only taught the
 * OPPOSITE cases - "a Help/hint must NEVER be set via HTML.SETAttribute + data-cb-name=\"title\""
 * and "NEVER mark a field required via HTML.SETAttribute title" - and the pass-2 details had no
 * parameters for the functionality at all, so a literally requested title attribute fell through.
 */
class SetAttributeRuleTest {

  private fun resource(relative: String): String =
      SetAttributeRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$relative")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() }
          ?.replace("\r\n", "\n") ?: error("bundled resource '$relative' not found")

  @Test
  fun `the catalog entry covers a literally requested title attribute`() {
    val catalog = resource("codbi-core-elements-compact.md")
    val entry = catalog.substringAfter("### HTML.SETAttribute").substringBefore("\n### ")
    assertTrue(entry.contains("ONE HTML attribute"), "the entry must say it sets ONE attribute")
    assertTrue(entry.contains("title, placeholder, readonly, disabled"), "title must be named")
    assertTrue(
        entry.contains("set the title attribute of that field to X"),
        "the entry must map the reported title-attribute request")
    assertTrue(
        entry.contains("also on a field you create in the SAME request"),
        "the entry must allow it on a field created in the same request")
    assertTrue(
        entry.contains("NOT for the Formcycle Help"), "the entry must keep the Help distinction")
    assertTrue(entry.contains("required=1"), "the entry must keep the required distinction")
  }

  @Test
  fun `the pass-2 details document both parameters with the title example`() {
    val api = resource("codbi-core-api-compact.md")
    val entry = api.substringAfter("- HTML.SETAttribute:").substringBefore("\n- HTML.Text.Injector")
    assertTrue(
        entry.contains("Sets ONE HTML attribute (including style)"),
        "the details must describe what it does")
    assertTrue(entry.contains("Name: REQUIRED"), "the Name parameter must be documented")
    assertTrue(entry.contains("ToSet: REQUIRED"), "the ToSet parameter must be documented")
    assertTrue(entry.contains("`data-cb-name`"), "the Name attribute must be named")
    assertTrue(entry.contains("`data-cb-toset`"), "the ToSet attribute must be named")
    assertTrue(entry.contains("title attribute is JOJO"), "the reported example must be present")
    assertTrue(
        entry.contains("NOT the Formcycle Help") && entry.contains("NOT the required flag"),
        "the details must keep both distinctions")
  }

  @Test
  fun `both structure-rules prompts allow an explicitly requested title attribute`() {
    for (file in
        listOf(
            "prompts/codbi-form-structure-rules.decision.md",
            "prompts/codbi-form-structure-rules.md")) {
      val rules = resource(file)
      assertTrue(
          rules.contains("`title` ATTRIBUTE"),
          "$file must distinguish the title ATTRIBUTE from the Help/hint")
      assertTrue(rules.contains("data-cb-name=\"title\""), "$file must show the exact title wiring")
      assertTrue(rules.contains("HTML.SETAttribute"), "$file must name the functionality")
    }
  }

  @Test
  fun `the decision and rethink cores do not let the required rule forbid a requested title`() {
    for (file in listOf("prompts/codbi-general.decision.md", "prompts/codbi-general-rethink.md")) {
      val core = resource(file)
      assertTrue(
          core.contains("a title attribute the user EXPLICITLY asked for is NOT a required flag"),
          "$file must carve out the explicitly requested title attribute")
    }
  }
}
