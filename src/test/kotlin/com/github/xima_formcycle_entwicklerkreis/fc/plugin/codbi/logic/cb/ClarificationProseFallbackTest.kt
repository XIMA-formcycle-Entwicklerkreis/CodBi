package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * The clarify round is taught to answer the sentinel or the JSON envelope, but models sometimes
 * answer a genuine question as a bare sentence:
 *
 * `Welche Spalten der Datenquelle **INHALT.Antrag … Altstadtfest 2027** sollen in der Tabelle
 * angezeigt werden, und welche Überschrift (sollen) jede Spalte bekommen? …`
 *
 * [AICodBiAssistant.parseClarificationRequest] can only parse JSON, so such an answer used to be
 * treated as "no question": the popup was never shown and the build ran with missing parameters.
 * The fallback is LANGUAGE-AGNOSTIC — any prose that is neither the sentinel nor a JSON shape is
 * the question the model wanted to ask.
 */
class ClarificationProseFallbackTest {

  private val assistant = AICodBiAssistant()

  private fun prose(raw: String): Any? {
    val method =
        AICodBiAssistant::class.java.getDeclaredMethod("clarificationFromProse", String::class.java)
    method.isAccessible = true
    return method.invoke(assistant, raw)
  }

  @Suppress("UNCHECKED_CAST")
  private fun questionTexts(result: Any?): List<String> {
    if (result == null) return emptyList()
    val questions =
        result.javaClass.getMethod("getQuestions").invoke(result) as? List<Any?>
            ?: return emptyList()
    return questions.mapNotNull { q ->
      if (q == null) null
      else {
        val getter = q.javaClass.getDeclaredMethod("getQuestion")
        getter.isAccessible = true
        getter.invoke(q) as? String
      }
    }
  }

  @Test
  fun `the production prose question becomes one free-text clarification`() {
    val raw =
        "Welche\u202FSpalten\u202Fder\u202FDatenquelle\u202F**INHALT.Antrag\u202Fauf\u202FZulassung" +
            "\u202Fzur\u202FTeilnahme\u202Fam\u202FAnsbacher\u202FAltstadtfest\u202F2027**\u202Fsollen" +
            "\u202Fin\u202Fder\u202FTabelle\u202Fangezeigt\u202Fwerden,\u202Fund\u202Fwelche\u202FÜberschrift" +
            "\u202F(sollen)\u202Fjede\u202FSpalte\u202Fbekommen?\u202F(Mehrfachauswahl\u202F+ Freitext)"

    val result = prose(raw)
    assertNotNull(result, "a genuine prose question must not be discarded")

    val texts = questionTexts(result)
    assertEquals(1, texts.size, "exactly one free-text question expected: $result")
    val text = texts.single()
    assertTrue(text.contains("?"), "the question mark must survive: $text")
    assertTrue(
        text.contains("Welche Spalten der Datenquelle INHALT.Antrag"),
        "Unicode spaces must be normalised to single spaces: $text")
    assertFalse(text.contains("\u202F"), "narrow no-break spaces must be normalised: $text")
    assertFalse(text.contains("**"), "markdown emphasis must be stripped: $text")
  }

  @Test
  fun `prose in any language is accepted, with or without a question mark`() {
    val texts = questionTexts(prose("Welche Spalten sollen angezeigt werden"))
    assertEquals(1, texts.size)
    assertEquals("Welche Spalten sollen angezeigt werden", texts.single())

    // No keyword/question-word list decides this — any prose is the model's question.
    assertEquals(1, questionTexts(prose("Qué columnas deben mostrarse")).size)
    assertEquals(1, questionTexts(prose("Quelles colonnes afficher")).size)
  }

  @Test
  fun `the sentinel and empty answers are not questions`() {
    assertNull(prose(""))
    assertNull(prose("   "))
    assertNull(prose("NO_CLARIFICATION"))
  }

  @Test
  fun `json shapes and overlong answers are rejected`() {
    // The canonical envelope stays with the JSON parser, not with this fallback.
    assertNull(prose("""{"status":"need_clarification","questions":["x?"]}"""))
    assertNull(prose("""[{"question":"x?"}]"""))
    assertNull(prose("Welche Spalten? " + "x".repeat(700)))
  }
}
