package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guards the PANEL / ACCORDION teaching: what the two functionalities are for, that their standard
 * CONFIGURATION CLASSES exist and shall be PREFERRED, and that the details list their parameters.
 *
 * Reported case: "Füge zwei panels ein von denen nur eines gleichzeitig aufgeklappt sein kann." —
 * the assistant produced one wrapper with two containers but tagged only one of them (and the
 * wrapper not at all), and it reached for the functionalities although the panel/accordion classes
 * still existed in that form. The TEACHING therefore lives in exactly two places: the pass-1
 * element catalog (the compact prompt: what it is for + prefer the classes) and the pass-2 details
 * (all parameters), plus a single short pointer in the always-sent build instruction.
 */
class PanelAccordionRuleTest {

  private fun resource(relative: String): String =
      PanelAccordionRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$relative")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled resource '$relative' not found")

  @Test
  fun `the pass-1 catalog states what panels and accordions are for and prefers the classes`() {
    val catalog = resource("codbi-core-elements-compact.md")
    val accordion = catalog.substringAfter("### HTML.Panel.Accordion").substringBefore("\n### ")
    assertTrue(
        accordion.contains("mutually exclusive"), "the accordion entry must say what it does")
    assertTrue(
        accordion.contains("`Accordion`") && accordion.contains("every member panel repeats it"),
        "the accordion entry must name the group parameter and that members repeat it")
    assertTrue(
        accordion.contains("PREFER the class"),
        "the accordion entry must prefer the standard class")
    assertTrue(
        accordion.contains("WITHOUT this on the wrapper"),
        "the accordion entry must warn that the set name on the members alone joins nothing")
    assertTrue(
        accordion.contains("TOGETHER WITH UI.Panels"),
        "the accordion entry must ask for the UI.Panels detail in the SAME request")
    // NOTE: "### HTML.Panel.Accordion" precedes "### HTML.Panel" — match the newline so the
    // accordion entry is not picked up instead.
    val panel = catalog.substringAfter("### HTML.Panel\n").substringBefore("\n### ")
    assertTrue(panel.contains("collapsible panel"), "the panel entry must say what it does")
    assertTrue(
        panel.contains("AutoHeaderTitle"), "the panel entry must name the header title param")
    assertTrue(
        panel.contains("PREFER the classes"), "the panel entry must prefer the standard classes")
    assertTrue(
        panel.contains("on a container that also carries a non-empty `AutoHeaderTitle`"),
        "the panel entry must allow the CLASS on a container that supplies its own title")
    val uiPanels = catalog.substringAfter("### UI.Panels").substringBefore("\n### ")
    assertTrue(
        uiPanels.contains("CodBi_HTML_Panel_Standard") && uiPanels.contains("CodBi_Accordion_A"),
        "the UI.Panels entry must list the panel AND accordion classes")
    assertTrue(
        uiPanels.contains("PREFER these classes"),
        "the UI.Panels entry must say the classes come before the functionalities")
    assertTrue(
        uiPanels.contains("carries its own non-empty `AutoHeaderTitle`"),
        "the UI.Panels entry must say a panel class also fits a container with its own title")
  }

  @Test
  fun `the pass-2 details document the parameters of both functionalities`() {
    val api = resource("codbi-core-api-compact.md")
    val accordion = api.substringAfter("- HTML.Panel.Accordion").substringBefore("\n- ")
    assertTrue(accordion.contains("MANDATORY"), "the accordion set name must be marked mandatory")
    assertTrue(
        accordion.contains("there is no `data-cb-accordion=\"true\"`"),
        "the accordion entry must debunk the non-existent boolean flag")
    assertTrue(
        accordion.contains("SAME `data-cb-Accordion="),
        "the accordion entry must repeat the set name on every member panel")
    val panel = api.substringAfter("- HTML.Panel:").substringBefore("\n- HTML.Select.Favorites")
    for (param in
        listOf(
            "Folded",
            "GenerateHeader",
            "AutoHeaderTitle",
            "AutoHeaderLevel",
            "AutoHeaderTitleSupplementsSpacer",
            "Accordion",
            "Scroll:",
            "ScrollBlock",
            "ScrollToTop",
            "CSSHeaderUnfolded",
            "CSSHeaderFolded",
            "CSSHeaderHover",
            "CSSHeaderActive",
            "CSSBeforeHeaderContent",
            "CSSAfterHeaderContent",
            "CSSAnimFadeINPanel",
            "CSSRequiredFieldsContent",
            "DCSSHeaderUnfolded")) {
      assertTrue(panel.contains(param), "the HTML.Panel details must document '$param'")
    }
    assertFalse(
        panel.contains("ScrollToTop: Configures"),
        "the details must not fall back to the generated 'Configures …' filler")
  }

  @Test
  fun `the long-form functionality reference carries both panel sections`() {
    val details = resource("prompts/codbi-functionalities.md")
    val panel =
        details.substringAfter("## HTML.Panel\n").substringBefore("\n## HTML.Panel.Accordion")
    assertTrue(
        panel.contains("CodBi_HTML_Panel_Header"),
        "the panel section must name the header mechanism")
    assertTrue(
        panel.contains("GenerateHeader") && panel.contains("AutoHeaderTitle"),
        "the panel section must document the generated header")
    assertTrue(panel.contains("Accordion"), "the panel section must document its Accordion param")
    val accordion = details.substringAfter("## HTML.Panel.Accordion").substringBefore("\n## ")
    assertTrue(accordion.contains("SET NAME"), "the accordion section must document the set name")
  }

  @Test
  fun `the build instruction carries ONE panels block that prefers the classes`() {
    val build = resource("prompts/codbi-form-task-instruction.md")
    val panelLines = build.lines().filter { it.startsWith("PANELS") }
    assertTrue(
        panelLines.size == 1,
        "exactly ONE panels/accordions block may exist (found ${panelLines.size}) — the parameters " +
            "belong to the details, not to the always-sent instruction")
    val line = panelLines.single()
    assertTrue(
        line.contains("PREFER the UI.Panels standard CSS classes"),
        "the block must prefer the standard classes")
    assertTrue(
        line.contains("EVERY member XFieldSet INSIDE it"),
        "the block must require a panel on every accordion member")
    assertTrue(
        line.contains(
            "an XContainer/XContainerInvisible may carry the same class when it sets its OWN non-empty data-cb-autoheadertitle"),
        "the block must allow the class on a container that supplies its own title")
    assertTrue(
        line.contains("HTML.Panel.Accordion"),
        "the block must name the functionality fallback for an exhausted A-D")
    assertTrue(
        line.contains(
            "an accordion whose wrapper has neither a CodBi_Accordion_* class nor HTML.Panel.Accordion"),
        "the block must state that a wrapper WITHOUT an accordion is a FAIL")
    assertTrue(
        line.contains("the repeated set name on the members alone joins nothing"),
        "the block must state that the set name on the members alone joins nothing")
  }
}
