package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests for [AICodBiAssistant]'s `parseClarificationRequest` tolerance.
 *
 * A rejected clarification is worse than a sloppy one: the meta response is then spliced as if it
 * were the form, so the user never sees the question AND the form does not change. This reproduced
 * in production with a singular `"question"` STRING instead of the canonical `"questions"` array:
 *
 * `{"status":"need_clarification","question":"Bitte geben Sie den genauen Namen der Datenquelle
 * an"}`
 */
class ClarificationRequestParsingTest {

  private val assistant = AICodBiAssistant()

  private fun parse(json: String): Any? =
      AICodBiAssistant::class
          .java
          .getDeclaredMethod("parseClarificationRequest", String::class.java)
          .apply { isAccessible = true }
          .invoke(assistant, json)

  @Suppress("UNCHECKED_CAST")
  private fun questions(result: Any?): List<Any> {
    if (result == null) return emptyList()
    val getter = result.javaClass.getDeclaredMethod("getQuestions").apply { isAccessible = true }
    return getter.invoke(result) as List<Any>
  }

  private fun textOf(question: Any): String? =
      question.javaClass
          .getDeclaredMethod("getQuestion")
          .apply { isAccessible = true }
          .invoke(question) as? String

  private fun idOf(question: Any): String? =
      question.javaClass.getDeclaredMethod("getId").apply { isAccessible = true }.invoke(question)
          as? String

  @Suppress("UNCHECKED_CAST")
  private fun optionsOf(question: Any): List<Any> =
      question.javaClass
          .getDeclaredMethod("getOptions")
          .apply { isAccessible = true }
          .invoke(question) as? List<Any> ?: emptyList()

  @Test
  fun parsesTheCanonicalQuestionsArray() {
    val parsed =
        parse(
            """{"status":"need_clarification","questions":[{"id":"q1","question":"Welche Quelle?","options":["56_Staatsangehoerigkeiten"],"allowFreeText":false,"multiSelect":false}]}""")
    val questions = questions(parsed)
    assertEquals(1, questions.size)
    assertEquals("q1", idOf(questions[0]))
    assertEquals("Welche Quelle?", textOf(questions[0]))
    assertEquals(listOf("56_Staatsangehoerigkeiten"), optionsOf(questions[0]))
  }

  @Test
  fun parsesTheSingularQuestionStringShapeThatBrokeInProduction() {
    val parsed =
        parse(
            """{"status":"need_clarification","question":"Bitte geben Sie den genauen Namen der Datenquelle (Quelle) an."}""")
    val questions = questions(parsed)
    assertEquals(
        1, questions.size, "a singular `question` string must still become a real question")
    assertEquals(
        "Bitte geben Sie den genauen Namen der Datenquelle (Quelle) an.", textOf(questions[0]))
    assertEquals("q1", idOf(questions[0]))
    assertTrue(optionsOf(questions[0]).isEmpty())
  }

  @Test
  fun parsesAQuestionTextUnderTheAlternateTextKey() {
    val parsed = parse("""{"status":"need_clarification","question":{"text":"Which source?"}}""")
    val questions = questions(parsed)
    assertEquals(1, questions.size)
    assertEquals("Which source?", textOf(questions[0]))
  }

  @Test
  fun parsesAnArrayOfPlainQuestionStrings() {
    val parsed =
        parse("""{"status":"need_clarification","questions":["Which source?","Which column?"]}""")
    val questions = questions(parsed)
    assertEquals(2, questions.size)
    assertEquals("Which source?", textOf(questions[0]))
    assertEquals("Which column?", textOf(questions[1]))
    assertEquals("q1", idOf(questions[0]))
    assertEquals("q2", idOf(questions[1]))
  }

  @Test
  fun ignoresAnEmptyQuestionsArray() {
    assertNull(parse("""{"status":"need_clarification","questions":[]}"""))
  }

  @Test
  fun ignoresAQuestionWithoutUsableText() {
    assertNull(
        parse("""{"status":"need_clarification","questions":[{"id":"q1","question":"  "}]}"""))
  }

  @Test
  fun ignoresResponsesThatAreNotClarifications() {
    assertNull(parse("""{"items":[]}"""))
    assertNull(parse("""{"status":"NO_CLARIFICATION"}"""))
    assertNull(parse("not json at all"))
  }
}
