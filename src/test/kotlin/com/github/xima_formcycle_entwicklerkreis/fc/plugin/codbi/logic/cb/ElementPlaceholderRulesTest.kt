package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guards that the AI is taught the difference between a FUNCTIONALITY and an ELEMENT PLACEHOLDER
 * (EP), and that every EP has its own entry in the EP section of the compact element catalog.
 *
 * Reported case: "Füge eine Auswahl ein die alle im BayVIS registrierten Ämter anzeigt." used
 * `BayVIS.Behoerden` as `data-cb-func` instead of wiring it into `HTML.Select.Injection`'s `Values`
 * parameter. The rule existed in the pass-1 decision core, but neither the compact catalog nor the
 * pass-2 structure rules stated what an EP is and where it belongs.
 */
class ElementPlaceholderRulesTest {

  private fun resource(relative: String): String =
      ElementPlaceholderRulesTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$relative")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() }
          ?.replace("\r\n", "\n") ?: error("bundled resource '$relative' not found")

  @Test
  fun `the catalog preamble explains functionality vs element placeholder vs standard class`() {
    val catalog = resource("codbi-core-elements-compact.md")
    val preamble = catalog.substringBefore("\n## ")
    assertTrue(
        preamble.contains("FUNCTIONALITY = something you APPLY to an element"),
        "the preamble must define a functionality")
    assertTrue(
        preamble.contains("ELEMENT PLACEHOLDER (EP) = a VALUE you place INSIDE a parameter"),
        "the preamble must define an element placeholder")
    assertTrue(
        preamble.contains("HTML.Select.Injection: Values"),
        "the preamble must name the consuming parameter per functionality")
    assertTrue(
        preamble.contains("An EP is NEVER the element you build and NEVER the function"),
        "the preamble must forbid an EP as the element/function")
    assertTrue(
        preamble.contains("STANDARD CLASS = a styling/configuration class"),
        "the preamble must define a standard class")
  }

  @Test
  fun `the catalog EP section states that EPs are parameter values`() {
    val catalog = resource("codbi-core-elements-compact.md")
    val section = catalog.substringAfter("## Element Placeholders\n").substringBefore("\n### ")
    assertTrue(
        section.contains("NEVER the element you build and NEVER the functionality"),
        "the EP section must state the rule before the entries")
    assertTrue(
        section.contains("Request these entries only to learn the exact EP id"),
        "the EP section must say why an EP entry is requested")
    assertTrue(
        section.contains("wire them into the element that consumes them"),
        "the EP section must say the EP is wired into a consumer")
    assertTrue(
        section.contains("HTML.Select.Injection: Values"),
        "the EP rule must name the consuming parameter of HTML.Select.Injection")
    assertTrue(
        section.contains("a parameter name of a DIFFERENT functionality is silently ignored"),
        "the EP rule must warn about using a foreign functionality parameter name")
  }

  @Test
  fun `every element placeholder has an entry in the EP section of the catalog`() {
    val catalog = resource("codbi-core-elements-compact.md")
    val section = catalog.substringAfter("## Element Placeholders\n").substringBefore("\n## ")
    val epIds =
        listOf(
            "AI.LLAMA.STD.QA",
            "Date.Today",
            "Date.FromString",
            "Date.Holidays",
            "JSON.Path",
            "Data.Join",
            "Data.CSV",
            "Net.URL",
            "DOM.Query",
            "F",
            "I",
            "V",
            "Sorted",
            "Unique",
            "OpenPLZ",
            "OpenPLZ.Localities",
            "OpenPLZ.Streets",
            "OpenPLZ.OrganizationalUnits",
            "OpenPLZ.TextSearch",
            "BayVIS.Behoerden",
            "BayVIS.Behoerden.ID",
            "BayVIS.Behoerden.Details",
            "BayVIS.Behoerden.Details.Gebaeude",
            "BayVIS.Behoerden.Gebaeude.ID",
            "BayVIS.Ansprechpartner",
            "BayVIS.Ansprechpartner.ID",
            "BayVIS.Ansprechpartner.Details")
    for (id in epIds) {
      assertTrue(
          section.contains("### $id\n"),
          "the EP section must contain an entry for '$id' (what it does + USE WHEN)")
    }
  }

  @Test
  fun `the pass-2 API reference rules that an EP is a value`() {
    val api = resource("codbi-core-api-compact.md")
    val section =
        api.substringAfter("## Element Placeholders (EPs)").substringBefore("\n- AI.LLAMA")
    assertTrue(
        section.contains("RULE: an EP is a VALUE, never an element and never the functionality"),
        "the API EP section must open with the rule")
    assertTrue(
        section.contains("HTML.Select.Injection + Values = { BayVIS.Behoerden > bezeichnung }"),
        "the API rule must carry the reported example")
    assertTrue(
        section.contains("HTML.Select.Injection: Values"),
        "the API rule must name the consuming parameter of HTML.Select.Injection")
  }

  @Test
  fun `both structure-rules prompts teach the EP vs functionality rule`() {
    for (file in
        listOf(
            "prompts/codbi-form-structure-rules.decision.md",
            "prompts/codbi-form-structure-rules.md")) {
      val rules = resource(file)
      assertTrue(
          rules.contains("ELEMENT PLACEHOLDER vs FUNCTIONALITY (never mix them up)"),
          "$file must carry the EP vs functionality rule")
      assertTrue(
          rules.contains("it is NEVER the functionality (data-cb-func keeps the functionality id"),
          "$file must forbid the EP in data-cb-func")
      assertTrue(
          rules.contains("data-cb-Values=\"{ BayVIS.Behoerden > bezeichnung }\""),
          "$file must carry the authorities example")
      assertTrue(
          rules.contains("HTML.Select.Injection: data-cb-Values"),
          "$file must name the consuming parameter per functionality")
    }
  }
}
