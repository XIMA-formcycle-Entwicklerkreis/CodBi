package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Reported twice for the same prompt:
 *
 * `Erstelle ein Text welches die Kontaktdaten aus dem BayVIS von Salvatore Callari enthält.`
 *
 * The log showed `Chat two-tier: hasQuestion=false, hasInstructions=false` — the request to CREATE
 * content was classified as neither a question nor an instruction, so the answer-only path replied
 * "Ok, mache ich." and the form was never built. Two causes are covered here:
 * 1. the chat prompt only taught acknowledgements of previous work and let a build request fall
 *    into that exception, plus it did not forbid promising the work in `answer`;
 * 2. a MISSING `hasInstructions` key defaulted to `false`, which silently discarded the change.
 *
 * The second one is fixed structurally (presence check + fail-open), the first by teaching only —
 * no keyword or semantic heuristic decides whether a message is an instruction.
 */
class ChatAnswerInstructionRuleTest {

  private val assistant = AICodBiAssistant()

  private fun prompt(name: String): String =
      ChatAnswerInstructionRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/$name")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("prompt $name missing")

  private fun parse(raw: String): Any? {
    val method =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod("parseChatAnswerRaw", String::class.java, String::class.java)
    method.isAccessible = true
    return method.invoke(assistant, raw, """[{"role":"system","content":"x"}]""")
  }

  private fun hasInstructions(result: Any?): Boolean {
    assertNotNull(result, "the envelope must parse")
    val getter = result!!.javaClass.getDeclaredMethod("getHasInstructions")
    getter.isAccessible = true
    return getter.invoke(result) as Boolean
  }

  @Test
  fun `creating content is taught as a change instruction`() {
    val chat = prompt("codbi-chat-system-prompt.md")
    assertTrue(
        chat.contains("CREATING CONTENT IS A CHANGE INSTRUCTION"),
        "the chat prompt must teach that PRODUCING content is a form change")
    assertTrue(
        chat.contains("Erstelle einen Text, der die Kontaktdaten aus dem BayVIS"),
        "the reported build request must appear as an example of an instruction")
    assertTrue(
        chat.contains("NEVER an acknowledgment and NEVER answered by promising to do it"),
        "such a request must not be treated as an acknowledgement")
  }

  @Test
  fun `the neutral-acknowledgement exception no longer swallows a request`() {
    val chat = prompt("codbi-chat-system-prompt.md")
    assertTrue(
        chat.contains("ONLY a message that is NOTHING BUT a short acknowledgment"),
        "the exception must be limited to messages that ask for nothing")
    assertTrue(
        chat.contains("as soon as the message asks for anything"),
        "any request must leave the exception — regardless of its wording or length")
  }

  @Test
  fun `the answer field may not promise the work`() {
    val chat = prompt("codbi-chat-system-prompt.md")
    assertTrue(
        chat.contains("\"answer\" MUST be an EMPTY string"),
        "without a question the answer must be empty")
    assertTrue(
        chat.contains("NEVER a promise, plan or acknowledgement"),
        "a promise in the answer replaces the modification pass")
    assertTrue(
        chat.contains("\"Ok, mache ich.\""),
        "the production failure wording must be named explicitly")
    assertTrue(
        chat.contains("an acknowledgement here replaces that pass and leaves the form untouched"),
        "the prompt must state the consequence")
  }

  @Test
  fun `the retry prompt repeats the rule and emits the intent`() {
    val retry = prompt("codbi-retry-chat.md")
    assertTrue(
        retry.contains("\"intent\":\"form\"|\"workflow\"|\"both\"|\"none\""),
        "the retry envelope must carry the intent key as well")
    assertTrue(
        retry.contains("including \"create a text that contains"),
        "the retry prompt must keep the create-content rule")
    assertTrue(
        retry.contains("never \"Ok, mache ich.\""),
        "the retry prompt must forbid the acknowledgement answer")
  }

  @Test
  fun `a missing hasInstructions key fails open`() {
    // The model emits a partial envelope (no `hasInstructions`) — defaulting to false used to
    // discard the change and answer "Ok, mache ich." instead of building the form.
    val result = parse("""{"hasQuestion":false,"answer":""}""")
    assertTrue(hasInstructions(result), "an absent key must not downgrade the run to answer-only")
  }

  @Test
  fun `an explicit false keeps a neutral acknowledgement answer-only`() {
    val result = parse("""{"hasQuestion":false,"hasInstructions":false,"answer":""}""")
    assertFalse(hasInstructions(result), "the AI's explicit decision stays authoritative")
  }

  @Test
  fun `an explicit true is unchanged`() {
    val result = parse("""{"hasQuestion":false,"hasInstructions":true,"answer":""}""")
    assertTrue(hasInstructions(result))
  }
}
