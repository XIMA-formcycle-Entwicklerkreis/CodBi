package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Reported prompt:
 *
 * `Gib in der Konsole die Antwort des Spezialisten Cerebras zu "Wie wird das Wetter morgen?" aus.`
 *
 * The log showed the run being routed through the CHAT answer pass (`Classify → Chat two-tier:
 * question detected — running full-answer tier`) and the assistant replying "Alles klar!", i.e. the
 * form was never touched. Two knowledge gaps caused it:
 * 1. the CHAT/classification prompt carried NO CodBi element knowledge at all — it could not know
 *    that the ELEMENT PLACEHOLDER `AI.LLAMA.STD.QA` is what ACQUIRES the AI answer and that
 *    `Sys.Log.Console` only OUTPUTS it, so the quoted question ("Wie wird das Wetter morgen?") was
 *    read as a question to answer in the chat bubble instead of as the placeholder's payload;
 * 2. the condensed pass-1 element catalog described `AI.LLAMA.STD.QA` as an answer "about an
 *    uploaded document" (the semantics of the AI.LLAMA.STANDARD.QA functionality), which made the
 *    request look incomplete/clarifiable.
 *
 * Nothing here decides a classification by keyword: the rules are taught in the prompts, and these
 * assertions stop the teaching from silently disappearing again.
 */
class ChatConsoleAiAnswerRuleTest {

  private fun prompt(name: String): String =
      ChatConsoleAiAnswerRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/$name")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("prompt $name missing")

  private fun resource(relative: String): String =
      ChatConsoleAiAnswerRuleTest::class
          .java
          .classLoader
          .getResourceAsStream(
              "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/$relative")
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled resource '$relative' not found")

  @Test
  fun `the chat prompt treats console output of an AI answer as an instruction`() {
    val chat = prompt("codbi-chat-system-prompt.md")
    assertTrue(
        chat.contains("OUTPUT / PRINT / LOG SOMETHING TO THE CONSOLE IS AN INSTRUCTION"),
        "the chat prompt must teach that console output is a build instruction, not a question")
    assertTrue(
        chat.contains("hasInstructions=true, hasQuestion=false, intent=\"form\""),
        "the console-output rule must set the envelope flags explicitly")
    assertTrue(
        chat.contains("\"sections\" MUST include \"logging\""),
        "the console-output rule must select the logging section")
    assertTrue(
        chat.contains("A QUESTION QUOTED INSIDE SUCH A REQUEST IS DATA"),
        "the quoted question must be taught as the placeholder payload, never as a question")
    assertTrue(
        chat.lowercase().contains("never reply with an empty answer or an acknowledgment"),
        "the reported empty/'Alles klar!' answer must be forbidden for such a request")
  }

  @Test
  fun `the chat prompt knows which CodBi element acquires the AI answer`() {
    val chat = prompt("codbi-chat-system-prompt.md")
    assertTrue(
        chat.contains("`AI.LLAMA.STD.QA` is the CodBi element that ACQUIRES an AI answer"),
        "the chat prompt must name the EP as the AI-answer producer")
    assertTrue(
        chat.contains("NOT a CodBi functionality and NOT a `data-cb-func` value"),
        "the EP must not be mistaken for a functionality")
    assertTrue(
        chat.contains("data-cb-func=\"Sys.Log.Console\""),
        "the chat prompt must name the functionality that outputs the value")
    assertTrue(
        chat.contains("6 SPECIALIST"), "the EP parameter order must name the specialist slot")
    assertTrue(
        chat.contains("{ AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true ; ; ; ; Cerebras }"),
        "the specialist example must stay in the prompt")
    assertTrue(
        chat.contains("data-cb-Specialist is the attribute of an AI FUNCTIONALITY"),
        "the difference between the EP parameter and the functionality attribute must be stated")
    assertTrue(
        chat.contains("needs NO uploaded document"),
        "the document-QA confusion must be excluded explicitly")
  }

  @Test
  fun `the pass-1 catalog no longer describes the EP as a document question`() {
    val catalog = resource("codbi-core-elements-compact.md")
    val entry = catalog.substringAfter("### AI.LLAMA.STD.QA\n").substringBefore("\n### ")
    assertTrue(
        entry.contains("FREE question"),
        "the pass-1 entry must describe the EP as a free-question AI answer")
    assertTrue(
        entry.contains("NO uploaded document"),
        "the pass-1 entry must exclude the document-analysis functionality")
    assertTrue(
        entry.contains("NAMED AI SPECIALIST"),
        "the pass-1 entry must state that a named specialist is a valid setting")
    assertTrue(
        !entry.contains("answer of a document question"),
        "the old document-QA wording must not come back")
  }

  @Test
  fun `the pass-2 EP reference teaches the specialist parameter`() {
    val eps = prompt("codbi-element-placeholders.md")
    val section = eps.substringAfter("## AI.LLAMA.STD.QA\n").substringBefore("\n## ")
    assertTrue(
        section.contains("SPECIALIST (Param[6])"),
        "the EP reference must teach the specialist parameter explicitly")
    assertTrue(
        section.contains(
            "{ AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true ; ; ; ; Cerebras }"),
        "the EP reference must carry the specialist example")
    assertTrue(
        section.contains("an omitted slot SHIFTS all later parameters"),
        "the empty-slot rule must be stated")
  }

  @Test
  fun `the logging rules wire the specialist into the EP`() {
    for (file in listOf("codbi-general.md", "codbi-general.decision.md")) {
      val rules = prompt(file)
      assertTrue(
          rules.contains(
              "{ AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true ; ; ; ; Cerebras }"),
          "$file must carry the specialist example for a logged AI answer")
      assertTrue(
          rules.contains("ai.llama.standard.qa"),
          "$file must point the document case to the document functionality")
    }
  }

  @Test
  fun `a requested but unavailable web search has its own fragment`() {
    val fragments = prompt("codbi-llm-chat-fragments.md")
    assertTrue(
        fragments.contains("## no_internet_requested"),
        "the fragment catalogue must carry the 'search requested but unavailable' rule")
    assertTrue(
        fragments.contains("Internet access WAS REQUESTED"),
        "the fragment must state that search was requested, not that the model lacks the ability")
    assertTrue(
        fragments.contains("web search is currently NOT available on this installation"),
        "the fragment must name the real reason (no search API key), not model ignorance")
  }

  @Test
  fun `the intent router knows the reported prompt`() {
    val classify = prompt("codbi-classify-intent.md")
    assertTrue(
        classify.contains(
            "Gib in der Konsole die Antwort des Spezialisten Cerebras zu 'Wie wird das Wetter morgen?' aus"),
        "the reported prompt must be an explicit intent example")
    assertTrue(
        classify.contains("the quoted question is that placeholder's data"),
        "the router must state that the quoted question is placeholder data")
    assertTrue(
        classify.contains("the element placeholder AI.LLAMA.STD.QA"),
        "the router must call AI.LLAMA.STD.QA an element placeholder, not a functionality")
  }
}
