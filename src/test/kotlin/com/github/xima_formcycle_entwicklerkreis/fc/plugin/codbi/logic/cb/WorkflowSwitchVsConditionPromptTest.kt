package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Guard for the WORKFLOW branching decision: a request that names SEVERAL DISTINCT states/values of
 * the SAME field, each with its OWN actions, must be built as ONE `FC_SWITCH` — never as nested or
 * chained `FC_MULTIPLE_CONDITION` ("if") nodes.
 *
 * The reported case produced two nested `FC_MULTIPLE_CONDITION` nodes for
 * "wenn in Popel 'Haus' steht eine Mail …, wenn dort aber 'AST' steht, die Datei herunterladen",
 * although the backend already creates a real switch/case structure from `_cases` /
 * `_defaultChildNodes`. The guidance must be LANGUAGE-AGNOSTIC (judged by meaning, never keywords)
 * and reach every pass:
 *
 * 1. the always-sent build instruction (`codbi-workflow-task-instruction.md`),
 * 2. the pass-1 compact catalogue (`formcycle-workflow-nodes-compact.md`, whose FIRST line is the
 *    only text pass-1 ships per node), and
 * 3. the pass-2 detailed reference (`formcycle-workflow-nodes.md`).
 *
 * A silent regression (dropping the rule, re-wording the compact line so pass-1 no longer sees the
 * choice, or re-allowing the nested-if emulation) fails the build here instead of producing the
 * wrong workflow shape again.
 */
class WorkflowSwitchVsConditionPromptTest {

  private val resourceBase =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/"

  private fun read(resource: String): String =
      WorkflowSwitchVsConditionPromptTest::class
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
  fun `the always-sent instruction prescribes FC_SWITCH for a multi-case decision on one field`() {
    assertTrue(
        instruction.contains("\"FC_SWITCH\""),
        "the workflow build instruction must name the REGISTERED switch node type so the model emits it")
    assertTrue(
        instruction.contains("MULTI-CASE", ignoreCase = true),
        "the instruction must state the multi-case rule that selects FC_SWITCH")
    assertTrue(
        instruction.contains("switchValue") && instruction.contains("_cases"),
        "the instruction must name the FC_SWITCH parameters (switchValue + _cases) so the shape is emittable")
    assertTrue(
        instruction.contains("NEVER build a switch out of if-nodes", ignoreCase = true),
        "the instruction must FORBID emulating a switch with if-nodes")
  }

  @Test
  fun `the instruction scopes the if-else rule to ONE single yes-no condition and points to FC_SWITCH`() {
    assertTrue(
        instruction.contains("IF/ELSE FOR ONE SINGLE YES/NO CONDITION"),
        "the existing if/else rule must stay, but explicitly scoped to a single yes/no condition")
    assertTrue(
        instruction.contains("a MULTI-CASE decision over the SAME field is ONE FC_SWITCH"),
        "the if/else rule must point a multi-case decision to FC_SWITCH instead of applying to it")
  }

  @Test
  fun `the pass-1 compact entries make the switch-vs-condition choice visible on their FIRST line`() {
    val switchLine = firstLineAfterHeading(compact, "FC_SWITCH")
    assertTrue(
        switchLine.startsWith("FC_SWITCH —"),
        "the compact entry must keep the 'NAME — purpose' form, got: $switchLine")
    assertTrue(
        switchLine.contains("switch/case", ignoreCase = true) &&
            switchLine.contains("FC_MULTIPLE_CONDITION"),
        "pass 1 only sees the compact entry's FIRST line, so it must say switch/case AND forbid the " +
            "nested-condition emulation: $switchLine")
    assertTrue(
        switchLine.length <= 200,
        "the compact first line must stay within the 200-char condense cap or pass 1 sees '…': $switchLine")

    val conditionLine = firstLineAfterHeading(compact, "FC_MULTIPLE_CONDITION")
    assertTrue(
        conditionLine.startsWith("FC_MULTIPLE_CONDITION —"),
        "the compact entry must keep the 'NAME — purpose' form, got: $conditionLine")
    assertTrue(
        conditionLine.contains("FC_SWITCH"),
        "the FC_MULTIPLE_CONDITION compact line must point a multi-case decision to FC_SWITCH: $conditionLine")
    assertTrue(
        conditionLine.length <= 200,
        "the compact first line must stay within the 200-char condense cap or pass 1 sees '…': $conditionLine")
  }

  @Test
  fun `the detailed reference forbids emulating a switch with conditions in both node sections`() {
    assertTrue(
        detailed.contains("NEVER EMULATE A SWITCH WITH CONDITION NODES"),
        "the detailed FC_MULTIPLE_CONDITION section must forbid building a switch out of conditions")
    assertTrue(
        detailed.contains("NEVER emulate a switch with IF-nodes"),
        "the detailed FC_SWITCH section must forbid the if-node emulation and name the switch node")
  }

  @Test
  fun `the detailed reference documents the FC_SWITCH shape and the reported two-case example`() {
    assertTrue(
        detailed.contains("caseValues") && detailed.contains("_defaultChildNodes"),
        "the detailed FC_SWITCH section must document the _cases/caseValues shape")
    assertTrue(
        detailed.contains("\"nodeType\":\"FC_SWITCH\"") &&
            detailed.contains("\"caseValues\":[\"Haus\"]") &&
            detailed.contains("\"caseValues\":[\"AST\"]"),
        "the reported Haus/AST case must be documented as ONE FC_SWITCH with two cases")
  }
}
