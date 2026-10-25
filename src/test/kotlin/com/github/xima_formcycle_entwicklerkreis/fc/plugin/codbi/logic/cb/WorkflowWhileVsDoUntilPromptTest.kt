package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guard for the WORKFLOW loop decision: whether a request becomes a `FC_WHILE_LOOP` (PRE-check) or a
 * `FC_DO_UNTIL_LOOP` (POST-check) follows the ORDER of the request's clauses, not a keyword.
 *
 * The reported case "Setze den Wert Koala in Popel solange der Wert Nice in Popel steht" names the
 * ACTION first and the STATE afterwards, so the action must run at least once (POST-check) —
 * building a pre-check loop there lets the action run zero times, which contradicts the request.
 * The guidance must be LANGUAGE-AGNOSTIC (the words "solange"/"while"/"as long as" appear in BOTH
 * shapes) and reach every pass:
 *
 * 1. the always-sent build instruction (`codbi-workflow-task-instruction.md`),
 * 2. the pass-1 compact catalogue (`formcycle-workflow-nodes-compact.md`, whose FIRST line is the
 *    only text pass-1 ships per node), and
 * 3. the pass-2 detailed reference (`formcycle-workflow-nodes.md`).
 *
 * A silent regression (dropping the rule, re-wording a compact line so pass 1 no longer sees the
 * clause-order distinction, or documenting `FC_DO_UNTIL_LOOP` only for the "first do, then check"
 * wording) fails the build here instead of producing the wrong loop again.
 */
class WorkflowWhileVsDoUntilPromptTest {

  private val resourceBase = "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/"

  private fun read(resource: String): String =
      WorkflowWhileVsDoUntilPromptTest::class
          .java
          .classLoader
          .getResourceAsStream(resourceBase + resource)
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled $resource not found on the classpath")

  private val instruction = read("prompts/codbi-workflow-task-instruction.md")
  private val compact = read("formcycle-workflow-nodes-compact.md")
  private val detailed = read("prompts/formcycle-workflow-nodes.md")

  /** The first (non-blank) line beneath a `### <heading>` section — the line pass-1 receives. */
  private fun firstLineAfterHeading(text: String, heading: String): String =
      text.lineSequence()
          .dropWhile { !it.startsWith("### $heading") }
          .drop(1)
          .firstOrNull { it.isNotBlank() }
          .orEmpty()

  @Test
  fun `the always-sent instruction decides the loop type by clause order, not by a keyword`() {
    assertTrue(
        instruction.contains("FC_WHILE_LOOP") && instruction.contains("FC_DO_UNTIL_LOOP"),
        "the build instruction must name BOTH loop node types so either one can be emitted")
    assertTrue(
        instruction.contains("THE ORDER OF THE REQUEST'S CLAUSES DECIDES", ignoreCase = true),
        "the instruction must state that the CLAUSE ORDER decides between the two loop types")
    assertTrue(
        instruction.contains("CONDITION is named FIRST", ignoreCase = true) &&
            instruction.contains("ACTION is named FIRST", ignoreCase = true),
        "the instruction must spell out both readings: condition first -> FC_WHILE_LOOP, action " +
            "first -> FC_DO_UNTIL_LOOP")
    assertTrue(
        instruction.contains("never by a keyword", ignoreCase = true),
        "the decision must be language-agnostic — the same words appear in both shapes")
  }

  @Test
  fun `the instruction carries the reported action-first case as a post-check loop`() {
    assertTrue(
        instruction.contains("Setze den Wert Koala in Popel solange der Wert Nice in Popel steht"),
        "the reported prompt must be kept as the worked example so the mapping stays verifiable")
    assertTrue(
        instruction.contains("FC_DO_UNTIL_LOOP with \"fieldTechnicalId\""),
        "the reported (action-first) example must resolve to FC_DO_UNTIL_LOOP with that condition")
    assertTrue(
        instruction.contains("Solange Popel Nice ist, setze Popel auf Koala") &&
            instruction.contains("SAME nodeParams on FC_WHILE_LOOP"),
        "the reversed (condition-first) wording must be the FC_WHILE_LOOP counterpart of the example")
  }

  @Test
  fun `the pass-1 compact entries make the clause order visible on their FIRST line`() {
    val whileLine = firstLineAfterHeading(compact, "FC_WHILE_LOOP")
    assertTrue(
        whileLine.startsWith("FC_WHILE_LOOP —"),
        "the compact entry must keep the 'NAME — purpose' form, got: $whileLine")
    assertTrue(
        whileLine.contains("PRE-CHECK") && whileLine.contains("CONDITION is named FIRST"),
        "pass 1 only sees the compact entry's FIRST line, so it must say PRE-CHECK and that the " +
            "CONDITION comes first: $whileLine")
    assertTrue(
        whileLine.length <= 200,
        "the compact first line must stay within the 200-char condense cap or pass 1 sees '…': $whileLine")

    val doUntilLine = firstLineAfterHeading(compact, "FC_DO_UNTIL_LOOP")
    assertTrue(
        doUntilLine.startsWith("FC_DO_UNTIL_LOOP —"),
        "the compact entry must keep the 'NAME — purpose' form, got: $doUntilLine")
    assertTrue(
        doUntilLine.contains("POST-CHECK") && doUntilLine.contains("ACTION is named FIRST"),
        "the FC_DO_UNTIL_LOOP compact line must say POST-CHECK and that the ACTION comes first: $doUntilLine")
    assertTrue(
        doUntilLine.length <= 200,
        "the compact first line must stay within the 200-condense cap or pass 1 sees '…': $doUntilLine")
  }

  @Test
  fun `the detailed reference documents the clause-order rule and the reported example`() {
    assertTrue(
        detailed.contains("CHOOSING BETWEEN FC_WHILE_LOOP AND FC_DO_UNTIL_LOOP"),
        "the detailed reference must keep an explicit chooser between the two loop nodes")
    assertTrue(
        detailed.contains("ORDER of the request's clauses", ignoreCase = true),
        "the chooser must be based on the clause order, in any language")
    assertTrue(
        detailed.contains("Setze den Wert Koala in Popel solange der Wert Nice in Popel steht") &&
            detailed.contains("\"value\":\"Koala\"") &&
            detailed.contains("\"nodeType\":\"FC_DO_UNTIL_LOOP\""),
        "the detailed reference must carry the reported case as an emittable FC_DO_UNTIL_LOOP example")
  }
}
