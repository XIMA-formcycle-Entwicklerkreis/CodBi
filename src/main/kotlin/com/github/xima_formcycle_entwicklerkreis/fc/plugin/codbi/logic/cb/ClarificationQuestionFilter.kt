package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

/**
 * Enforces ONE rule of the clarification prompt in code: a question must never be asked twice.
 *
 * A small local model tends to re-ask a detail it has already received — or that the target element
 * already contains (observed: "Wie viele Tage sollen angezeigt werden?" asked twice and "Für
 * welchen Ort (Stadtname oder Koordinaten) soll die Wettervorhersage abgerufen werden?" three times
 * in one session). The prompts carry the rule, and this filter is the deterministic backstop for
 * it: when the round only repeats itself, the caller BUILDS instead of opening the popup again.
 *
 * There is deliberately NO round limit here — how many rounds are sensible is a judgement call the
 * prompt instructions make ("take everything that exists out of the existing element"), not a fixed
 * number.
 */
object ClarificationQuestionFilter {

  /**
   * Normalizes a question for comparison: lower case and every non-letter/digit character (question
   * marks, dashes, brackets, non-breaking hyphens from the model, ...) collapsed to a single space.
   * Umlauts are letters and are KEPT.
   */
  fun normalizeQuestion(text: String): String =
      text
          .lowercase()
          .map { if (it.isLetterOrDigit()) it else ' ' }
          .joinToString("")
          .split(' ')
          .filter { it.isNotBlank() }
          .joinToString(" ")

  /**
   * True when [question] was already asked: either the normalized texts are IDENTICAL, or they
   * share their first [STEM_LENGTH] characters — the model regularly re-asks the same thing with
   * only a different tail (an added "(z. B. 7 einzelne Felder)" or a shortened second wording).
   * Questions shorter than [MIN_STEM] characters are compared verbatim only, so short questions
   * cannot accidentally swallow each other.
   */
  fun isAlreadyAsked(question: String, askedQuestions: List<String>): Boolean {
    val key = normalizeQuestion(question)
    if (key.isEmpty()) return true
    for (asked in askedQuestions) {
      val previous = normalizeQuestion(asked)
      if (previous.isEmpty()) continue
      if (previous == key) return true
      val stem = minOf(previous.length, key.length, STEM_LENGTH)
      if (stem >= MIN_STEM && previous.take(stem) == key.take(stem)) return true
    }
    return false
  }

  /**
   * Drops every question that was already asked earlier. An EMPTY result means the assistant only
   * repeated itself — the caller must then build the form instead of asking the user again.
   */
  fun <T> dropAlreadyAsked(
      questions: List<T>,
      askedQuestions: List<String>,
      textOf: (T) -> String
  ): List<T> {
    if (askedQuestions.isEmpty()) return questions
    val asked = askedQuestions.filter { it.isNotBlank() }
    if (asked.isEmpty()) return questions
    return questions.filterNot { isAlreadyAsked(textOf(it), asked) }
  }

  /** Number of leading characters compared as a question "stem". */
  private const val STEM_LENGTH = 48

  /** Minimum stem length — shorter questions are only compared verbatim. */
  private const val MIN_STEM = 24
}
