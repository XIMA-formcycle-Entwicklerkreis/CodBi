package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * The DATAQUERY-TABLE clarification rule (`<!--CLARIFY:datasource-->`) teaches the clarify round to
 * ask for the COLUMNS and their header labels — user-visible content that cannot be derived.
 *
 * It is deliberately NOT keyword-gated: the tag is not registered in the section-trigger map, so
 * the block is always kept (unknown tag ⇒ fail-open) and the MODEL decides by meaning whether the
 * request needs it. A keyword list in the backend must never decide that — see the round's own
 * "when the request asks …" wording.
 */
class ClarificationDatasourceSectionTest {

  private val assistant = AICodBiAssistant()

  private fun gate(template: String, corpus: String, topics: Set<String> = emptySet()): String {
    val method =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod(
                "applyClarificationSections",
                String::class.java,
                String::class.java,
                Set::class.java)
    method.isAccessible = true
    return method.invoke(assistant, template, corpus, topics) as String
  }

  private val template =
      """
      BASE
      <!--CLARIFY:datasource-->
      ASK FOR COLUMNS
      <!--/CLARIFY:datasource-->
      <!--CLARIFY:payment-->
      PAYMENT MATRIX
      <!--/CLARIFY:payment-->
      """
          .trimIndent()

  @Test
  fun `the datasource rule always reaches the clarify round`() {
    for (corpus in
        listOf(
            "Füge eine Tabelle hinzu die den inhalt der Altstadtfest abfrage zeigt.",
            "Füge ein Textfeld für den Vornamen hinzu.",
            "Mach das Formular schöner.")) {
      val gated = gate(template, corpus)
      assertTrue(gated.contains("ASK FOR COLUMNS"), "$corpus: $gated")
      assertFalse(gated.contains("<!--CLARIFY:"), "markers must be stripped: $gated")
    }
  }

  @Test
  fun `other scenario blocks stay keyword-gated`() {
    val gated = gate(template, "Füge ein Textfeld für den Vornamen hinzu.")

    assertFalse(gated.contains("PAYMENT MATRIX"), "unrelated blocks must stay gated out: $gated")
  }

  @Test
  fun `the bundled clarification template still carries the rule`() {
    val path =
        "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-clarification.md"
    val stream = javaClass.classLoader.getResourceAsStream(path)
    assertNotNull(stream, "the bundled clarification prompt must be on the classpath")
    val text = stream!!.bufferedReader().use { it.readText() }

    assertTrue(
        text.contains("<!--CLARIFY:datasource-->") && text.contains("<!--/CLARIFY:datasource-->"),
        "the DQ.Table.View clarification block must exist in codbi-clarification.md")
    assertTrue(
        text.contains("ASK ONE question that collects"), "the block must ask for the columns")
    assertTrue(
        text.contains("ALL FOUR facts"),
        "the question must cover the query column, header label, JSON flag and width")
  }

  @Test
  fun `the build prompt maps all four column facts and forbids an empty column list`() {
    val path =
        "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-functionalities.md"
    val stream = javaClass.classLoader.getResourceAsStream(path)
    assertNotNull(stream, "the bundled functionality prompt must be on the classpath")
    val text = stream!!.bufferedReader().use { it.readText() }

    assertTrue(
        text.contains("header LABEL") &&
            text.contains("QUERY COLUMN") &&
            text.contains("JSON flag") &&
            text.contains("WIDTH"),
        "the column mapping must name label, query column, JSON flag and width")
    assertTrue(
        text.contains("data-cb-columns=\"\"") && text.contains("FAIL"),
        "an empty data-cb-columns must be called out as a FAIL")
  }
}
