package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * The clarification dialog must never ask the same question twice — that is what made the popup run
 * through eight rounds for a single "make the existing calculator prettier" request. How MANY
 * rounds are sensible stays a prompt decision; there is deliberately no round cap in the code.
 */
class ClarificationQuestionFilterTest {

  @Test
  fun `normalizeQuestion folds casing, punctuation and non-breaking hyphens`() {
    assertEquals(
        "wie viele tage sollen angezeigt werden",
        ClarificationQuestionFilter.normalizeQuestion("Wie viele Tage sollen angezeigt werden?"))
    assertEquals(
        ClarificationQuestionFilter.normalizeQuestion("Welche Art\u00ADvon Rechner?"),
        ClarificationQuestionFilter.normalizeQuestion("welche art von rechner"))
  }

  @Test
  fun `a verbatim re-ask is detected`() {
    assertTrue(
        ClarificationQuestionFilter.isAlreadyAsked(
            "F\u00FCr welchen Ort (Stadtname oder Koordinaten) soll die Wettervorhersage abgerufen werden?",
            listOf(
                "F\u00FCr welchen Ort (Stadtname oder Koordinaten) soll die Wettervorhersage abgerufen werden?")))
    assertTrue(
        ClarificationQuestionFilter.isAlreadyAsked(
            "\u00F6ffnungszeiten", listOf("\u00D6ffnungszeiten?")))
  }

  @Test
  fun `a re-ask with a different tail is detected`() {
    val asked =
        listOf(
            "Wie sollen die Wetterillustrationen pro Tag dargestellt werden? Bitte w\u00E4hlen Sie, ob Sie f\u00FCr jeden der 7 Tage ein separates Icon-Feld oder ein gemeinsames Feld w\u00FCnschen.")
    assertTrue(
        ClarificationQuestionFilter.isAlreadyAsked(
            "Wie sollen die Wetterillustrationen pro Tag dargestellt werden?", asked))
  }

  @Test
  fun `a genuinely different question is kept`() {
    val asked = listOf("Wie viele Tage sollen angezeigt werden?")
    assertFalse(
        ClarificationQuestionFilter.isAlreadyAsked(
            "Soll die Clear-Taste das Eingabefeld komplett leeren?", asked))
    // Two SHORT questions must never swallow each other.
    assertFalse(
        ClarificationQuestionFilter.isAlreadyAsked("Wie viele Tage?", listOf("Wie viele Tasten?")))
  }

  @Test
  fun `dropAlreadyAsked removes the repeats and keeps the new questions`() {
    val questions =
        listOf(
            "Wie viele Tage sollen angezeigt werden?",
            "Soll das Ergebnis schreibgesch\u00FCtzt sein?")
    val asked = listOf("wie viele tage sollen angezeigt werden")
    assertEquals(
        listOf("Soll das Ergebnis schreibgesch\u00FCtzt sein?"),
        ClarificationQuestionFilter.dropAlreadyAsked(questions, asked) { it })
  }

  @Test
  fun `dropAlreadyAsked keeps everything when nothing was asked before`() {
    val questions = listOf("Wie viele Tage sollen angezeigt werden?")
    assertEquals(
        questions, ClarificationQuestionFilter.dropAlreadyAsked(questions, emptyList()) { it })
    assertEquals(
        questions, ClarificationQuestionFilter.dropAlreadyAsked(questions, listOf("  ")) { it })
  }
}
