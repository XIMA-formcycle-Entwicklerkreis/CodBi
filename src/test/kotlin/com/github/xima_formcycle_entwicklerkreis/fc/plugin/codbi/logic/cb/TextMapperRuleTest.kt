package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guards the "text that CONTAINS a person's contact data" teaching.
 *
 * Reported case: "Erstelle ein Text welches die Kontaktdaten aus dem BayVIS von Salvatore Callari
 * enthält." Three runs produced (1) an XSpan with invented literal text and a raw
 * `[[INJECTOR_REPLACEMENT]]`, (2) the same again, and (3) `HTML.Text.Injector` with
 * `data-cb-replacement="IST"` - never `HTML.Text.Mapper` with the BayVIS person EP.
 *
 * The condensed catalog only had to say WHAT the two text functionalities and the person EPs are
 * for and WHEN to use them (and which ids to request together); the detailed reference carries the
 * parameters and the exact chaining.
 */
class TextMapperRuleTest {

  private fun resource(relative: String): String =
      TextMapperRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$relative")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() }
          ?.replace("\r\n", "\n") ?: error("bundled resource '$relative' not found")

  @Test
  fun `the condensed catalog separates Injector from Mapper by MEANING`() {
    val catalog = resource("codbi-core-elements-compact.md")
    val injector = catalog.substringAfter("### HTML.Text.Injector").substringBefore("\n### ")
    assertTrue(
        injector.contains("Puts ONE plain value"),
        "the injector must be described as a SINGLE plain value")
    assertTrue(
        injector.contains("is HTML.Text.Mapper, NOT this"),
        "a text that CONTAINS data must be routed to the Mapper")
    val mapper = catalog.substringAfter("### HTML.Text.Mapper").substringBefore("\n### ")
    assertTrue(
        mapper.contains("properties of ONE object"), "the mapper must be object/template based")
    assertTrue(
        mapper.contains("a text must CONTAIN data"), "the mapper must map the reported request")
    assertTrue(
        mapper.contains("request it TOGETHER WITH the element placeholder"),
        "the mapper entry must demand the supplying EP in the same details request")
  }

  @Test
  fun `the person EPs say what they return and which id to request with them`() {
    val catalog = resource("codbi-core-elements-compact.md")
    val details =
        catalog.substringAfter("### BayVIS.Ansprechpartner.Details").substringBefore("\n### ")
    assertTrue(
        details.contains("complete record OBJECT"), "the Details EP must be an object source")
    assertTrue(
        details.contains("TOGETHER WITH HTML.Text.Mapper"),
        "the Details EP must ask for the Mapper in the same request")
    assertTrue(details.contains("apTelefon*"), "the Details EP must name the phone parts")
    val id = catalog.substringAfter("### BayVIS.Ansprechpartner.ID").substringBefore("\n### ")
    assertTrue(id.contains("as an ARRAY"), "the ID EP returns an array")
    assertTrue(
        id.contains("TOGETHER WITH BayVIS.Ansprechpartner.Details"),
        "the ID EP must point at the Details EP that consumes it")
    assertTrue(id.contains("{ I > 0 ; ... }"), "the ID EP must show that I>0 takes the first id")
  }

  @Test
  fun `the detailed reference documents the Injector parameters`() {
    val api = resource("codbi-core-api-compact.md")
    val injector =
        api.substringAfter("- HTML.Text.Injector:").substringBefore("\n- HTML.Text.Mapper:")
    assertTrue(injector.contains("Placeholder: The string inside the element Property"))
    assertTrue(injector.contains("Replacement: ONE plain string"))
    assertTrue(injector.contains("Property: The RUNTIME property"))
    assertTrue(
        injector.contains("for several record properties use HTML.Text.Mapper"),
        "the injector must point at the Mapper for several values")
  }

  @Test
  fun `the detailed reference carries the person chain and the mapper wiring`() {
    val api = resource("codbi-core-api-compact.md")
    val details =
        api.substringAfter("- BayVIS.Ansprechpartner.Details:")
            .substringBefore("\n- BayVIS.Ansprechpartner.ID:")
    assertTrue(
        details.contains("{ I > 0 ; { BayVIS.Ansprechpartner.ID > Salvatore Callari } }"),
        "the Details EP must show the ID chaining")
    assertTrue(
        details.contains("apTelefonDurchwahl"), "the result object properties must be listed")
    assertTrue(
        details.contains("HTML.Text.Mapper's data-cb-replacements"),
        "the Details EP must say it feeds the Mapper")
    assertFalse(details.contains("like e.g."), "the truncated jsdoc filler must be gone")
    val id =
        api.substringAfter("- BayVIS.Ansprechpartner.ID:")
            .substringBefore("\n- BayVIS.Ansprechpartner:")
    assertTrue(id.contains("as an ARRAY"), "the ID EP details must say it returns an array")
  }
}
