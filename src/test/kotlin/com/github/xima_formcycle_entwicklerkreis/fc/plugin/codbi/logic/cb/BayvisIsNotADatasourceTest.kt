package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Reported: "Erstelle ein Text welches die Kontaktdaten aus dem BayVIS von Salvatore Callari
 * enthält." now reaches the build, but the clarify round asked
 *
 * `Welchen der vorhandenen Formcycle-Datenquellen-Namen möchten Sie für die Anzeige der
 * Kontaktdaten verwenden?`
 *
 * — i.e. the assistant treated BayVIS as a Formcycle datasource problem. BayVIS (Bayernportal) data
 * is produced at RUNTIME by the BayVIS element placeholders, so no datasource exists, none may be
 * bound and none may be asked for. The exclusion is taught where the datasource list is injected
 * (it reaches the clarify, pass-1 and pass-2 prompts) and in the prompts that discuss datasources.
 * The decision itself stays with the AI — nothing here matches keywords.
 */
class BayvisIsNotADatasourceTest {

  private val assistant = AICodBiAssistant()

  private fun resource(path: String): String =
      BayvisIsNotADatasourceTest::class
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

  @Suppress("UNCHECKED_CAST")
  private fun datasourceBlock(names: List<String>): String? {
    val method =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod("buildAvailableDatasourcesBlock", List::class.java)
    method.isAccessible = true
    return method.invoke(assistant, names) as String?
  }

  @Test
  fun `the injected datasource list excludes BayVIS data`() {
    val block = datasourceBlock(listOf("56_Staatsangehoerigkeiten", "Laenderliste"))
    assertNotNull(block, "the datasource block must still be produced")
    val text = block!!
    assertTrue(
        text.contains("BAYVIS / BAYERNPORTAL DATA IS NEVER ONE OF THESE DATASOURCES"),
        "the always-injected block must exclude BayVIS data: $text")
    assertTrue(
        text.contains("{ BayVIS.Ansprechpartner.Details > { I > 0 ; { BayVIS.Ansprechpartner.ID"),
        "the exclusion must show the real person chain")
    assertTrue(
        text.contains("{ BayVIS.Behoerden > bezeichnung }"),
        "the exclusion must show the authority list EP")
    assertTrue(
        text.contains("NEVER ask the user which Formcycle datasource to use for BayVIS data"),
        "asking for a datasource must be forbidden explicitly")
    assertTrue(
        text.contains("HTML.Text.Mapper"),
        "the exclusion must name the consuming functionality for a text block")
  }

  @Test
  fun `the clarification prompt forbids a datasource question for BayVIS`() {
    val clarify = prompt("codbi-clarification.md")
    assertTrue(
        clarify.contains("BAYVIS / BAYERNPORTAL DATA IS NEVER A FORMCYCLE DATASOURCE"),
        "the clarify prompt must carry the rule itself (it overrides the datasource block)")
    assertTrue(
        clarify.contains("answer NO_CLARIFICATION for every datasource question"),
        "a BayVIS request must never produce a datasource question")
    assertTrue(
        clarify.contains("NEVER treat \"BayVIS\" as a datasource name"),
        "the system name must not be mistaken for a datasource name")
    assertTrue(
        clarify.contains("BAYVIS DATA IS NOT A DATASOURCE (see the BayVIS rule above)"),
        "the datasource section must repeat the exclusion")
  }

  @Test
  fun `the pass-1 decision core excludes BayVIS from the datasource rules`() {
    val decision = prompt("codbi-general.decision.md")
    assertTrue(
        decision.contains("EXCLUSION — BayVIS / Bayernportal data"),
        "the decision core must exclude BayVIS from the datasource section")
    assertTrue(
        decision.contains(
            "The datasource rules of this section apply ONLY to real Formcycle datasources"),
        "the decision core must scope its datasource rules")
  }

  @Test
  fun `the long-form general prompt excludes BayVIS from the datasource section`() {
    val general = prompt("codbi-general.md")
    assertTrue(
        general.contains("EXCLUSION - BAYVIS / BAYERNPORTAL DATA IS NEVER A FORMCYCLE DATASOURCE"),
        "the general prompt must check the exclusion before the datasource rules")
    assertTrue(
        general.contains("They are NOT in the AVAILABLE FORMCYCLE DATASOURCES list"),
        "the general prompt must state that BayVIS is not a listed datasource")
  }

  @Test
  fun `the EP reference states that BayVIS is never a datasource`() {
    val eps = prompt("codbi-element-placeholders.md")
    assertTrue(
        eps.contains("CRITICAL — BAYVIS DATA IS NEVER A FORMCYCLE DATASOURCE"),
        "the EP reference must state the exclusion")
    assertTrue(
        eps.contains("needs NO `datasource`, NO `data-cb-dataquery`"),
        "the EP reference must spell out what is NOT needed")
  }

  @Test
  fun `both BayVIS catalog entries carry the exclusion`() {
    val details = catalog().substringAfter("### BayVIS.Ansprechpartner.Details\n")
    assertTrue(
        details.lines().take(2).joinToString("\n").contains("NEVER a Formcycle datasource"),
        "the person details entry must exclude a datasource")

    val behoerden = catalog().substringAfter("### BayVIS.Behoerden\n")
    assertTrue(
        behoerden.lines().take(2).joinToString("\n").contains("NEVER a Formcycle datasource"),
        "the authority directory entry must exclude a datasource")
  }
}
