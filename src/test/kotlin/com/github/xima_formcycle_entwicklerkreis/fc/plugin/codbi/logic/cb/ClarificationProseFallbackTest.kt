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
  fun `the clarification prompt forbids answering with an acknowledgement`() {
    val prompt =
        ClarificationProseFallbackTest::class
            .java
            .classLoader
            .getResourceAsStream(
                "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/codbi-clarification.md")
            ?.bufferedReader(Charsets.UTF_8)
            ?.use { it.readText() } ?: error("clarification prompt missing")
    assertTrue(
        prompt.contains("AN ACKNOWLEDGEMENT IS NOT A QUESTION"),
        "the clarify prompt must forbid acknowledgement answers")
    assertTrue(
        prompt.contains("answer EXACTLY the sentinel NO_CLARIFICATION"),
        "the clarify prompt must point at the sentinel when nothing is to ask")
  }

  @Test
  fun `a bare acknowledgement is not a question`() {
    // Reported: the build request "Erstelle ein Text welches die Kontaktdaten aus dem BayVIS von
    // Salvatore Callari enthält." made the model answer "Ok, mache ich." and the popup showed that
    // promise as the question. An acknowledgement carries no ask, so the round must yield NO
    // question (the build then runs immediately).
    assertNull(prose("Ok, mache ich."), "a promise ending like a statement is not a question")
    assertNull(prose("Mache ich."), "a promise ending like a statement is not a question")
    assertNull(prose("Alles klar"), "a two-word confirmation is not a question")
    assertNull(prose("Ok"))
    assertNull(prose("Got it!"), "an exclamation is not a question")
    assertNull(prose("Sure, I will do that."), "a status sentence is not a question")
  }

  @Test
  fun `a numbered-choice offer ending with a period is still a question`() {
    // Reported: with local Whisper not active, the model answers the speech-field build request in
    // pass-2 with prose that lists numbered options and ends with a period (not a question mark):
    // "Lokale Whisper-Spracherkennung ist auf dieser Installation nicht aktiv. Bitte wählen Sie:
    // 1. Lokale Whisper-Spracherkennung trotzdem verwenden 2. Die Web Speech API des Browsers
    // verwenden 3. Kein Sprachfeld einfügen.". Without numbered-option recognition this was treated
    // as an acknowledgement (ends like a statement, no "?") and the user never saw the choices.
    assertEquals(
        1,
        questionTexts(
                prose(
                    "Lokale Whisper-Spracherkennung ist nicht aktiv. Bitte wählen Sie: 1. Whisper " +
                        "trotzdem verwenden 2. Web Speech API verwenden 3. Kein Sprachfeld einfügen."))
            .size,
        "a prose choice offer with explicit numbered options must surface as a clarification")

    // The numbered-option recognition is structural, not language/keyword-based — works in any
    // language and with both "." / ")" list markers.
    assertEquals(
        1, questionTexts(prose("Elija: 1) usar Whisper 2) usar Web Speech 3) no añadir")).size)
    assertEquals(1, questionTexts(prose("Escolha: (1) Whisper (2) Web Speech API")).size)
  }

  @Test
  fun `a long imperative instructional clarification without a question mark is still a question`() {
    // Reported regression: the model asks genuinely for user input as multi-clause imperative
    // instructional prose with NO "?" and NO numbered list, ending in a period: "Bitte geben Sie
    // den
    // gewünschten Anzeigetext (Label) und optional einen Feldnamen (ID) für das neue Eingabefeld an
    // (z.B. „Ihre Nachricht", id = „msgInput"). Sie können das Feld-ID-Feld leer lassen, wenn Sie
    // keinen speziellen Namen benötigen." The previous gate treated ANY statement-ending prose as
    // an
    // acknowledgement and silently swallowed this real clarification — the popup never appeared.
    // The acknowledgement exception must only apply to SHORT promises, so this LONG ask is
    // surfaced.
    assertEquals(
        1,
        questionTexts(
                prose(
                    "Bitte geben Sie den gewünschten Anzeigetext (Label) und optional einen " +
                        "Feldnamen (ID) für das neue Eingabefeld an (z.B. \"Ihre Nachricht\", " +
                        "id = \"msgInput\"). Sie können das Feld-ID-Feld leer lassen, wenn Sie " +
                        "keinen speziellen Namen benötigen."))
            .size,
        "a long imperative/instructional ask without '?' must surface as a clarification")

    // The disambiguation is length-based and language-agnostic (no keywords) — a long
    // statement-ending
    // ask in any language is a clarification, not an acknowledgement.
    assertEquals(
        1,
        questionTexts(
                prose(
                    "Por favor, indíqueme el texto visible (etiqueta) y opcionalmente el nombre " +
                        "del campo (ID) para el nuevo campo de entrada. Puede dejar el ID vacío si no " +
                        "necesita un nombre especial."))
            .size)
  }

  @Test
  fun `a short question with a question mark is still a question`() {
    assertEquals(1, questionTexts(prose("Welche Spalten?")).size)
    assertEquals(1, questionTexts(prose("¿Qué columnas?")).size)
  }

  @Test
  fun `json shapes and overlong answers are rejected`() {
    // The canonical envelope stays with the JSON parser, not with this fallback.
    assertNull(prose("""{"status":"need_clarification","questions":["x?"]}"""))
    assertNull(prose("""[{"question":"x?"}]"""))
    assertNull(prose("Welche Spalten? " + "x".repeat(700)))
  }
}
