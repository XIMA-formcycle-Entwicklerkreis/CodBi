package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Lever 2 (workflow decision-core split) — regression tests for the WORKFLOW branch of the clarify
 * round.
 *
 * The clarify AI ONLY resolves references to existing workflow nodes/tasks ("add an approval step
 * after the 'Freigabe' node", "attach the submit button to node X"); it never builds or verifies
 * the workflow. So the workflow branch of `buildClarificationSystemPrompt` receives a CONDENSED
 * decision core (task name + trigger type + each existing node's name/type in its parent/child tree
 * — the heavy `description`/`customParameters`/`id` are dropped) via
 * `buildWorkflowStructureContext(..., condensed = true)`, exactly mirroring the condensed
 * form-structure core.
 *
 * These tests exercise the deterministic seam: when a non-blank `workflowStructureContext` reaches
 * `buildClarificationSystemPrompt`, the "CURRENT WORKFLOW STRUCTURE" instruction block must be
 * appended to the final system prompt (so references resolve to an EXACT existing node); when the
 * structure is null/blank the block must be ABSENT (fail-open — a form-only request never
 * references workflow nodes, and an unreadable workflow must not disturb the rest of the prompt).
 *
 * NOTE: `buildWorkflowStructureContext` itself is DB-backed (`formcycleEntityManager`) and returns
 * null (fail-open) without a live server, so — as with the other workflow DB operations exercised
 * end-to-end — its condensed/vs-full serialization is asserted here only through the seam that
 * consumes it.
 */
class ClarifyWorkflowStructureCoreTest {

  private val assistant = AICodBiAssistant()

  private fun buildSystemPrompt(workflowStructureContext: String?): String {
    val method =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod(
                "buildClarificationSystemPrompt",
                String::class.java, // prompt
                String::class.java, // intent
                String::class.java, // formElements
                String::class.java, // formStructureContext
                String::class.java, // workflowStructureContext
                String::class.java, // textSpanContentContext
                String::class.java, // clarificationContext
                String::class.java, // chatContext
                String::class.java, // changeHistoryContext
                String::class.java, // formListContext
                String::class.java, // formKey
                String::class.java, // currentFormTitle
                Boolean::class.javaPrimitiveType, // useCodbi
                Boolean::class.javaPrimitiveType, // askAllQuestions
                String::class.java, // completionPages
                String::class.java, // formVariables
                String::class.java, // workflowMails
                String::class.java, // availableDatasources
                Set::class.java) // clarificationTopics
    method.isAccessible = true
    return method.invoke(
        assistant,
        "add an approval step after the 'Freigabe' node",
        "workflow",
        null,
        null,
        workflowStructureContext,
        null,
        "",
        "",
        null,
        null,
        null,
        null,
        true,
        false,
        null,
        null,
        null,
        null,
        emptySet<Any>()) as String
  }

  // A realistic CONDENSED decision core exactly as buildWorkflowStructureContext(condensed=true)
  // would serialize: task name + trigger type, and each node's type + name in a parent/child tree —
  // NO id / description / customParameters.
  private val condensedCore =
      """
      [{"name":"Antrag","trigger":{"type":"form.submit"},
        "rootNode":{"type":"start","name":"Start","children":[
          {"type":"wfinbox","name":"Freigabe","children":[
            {"type":"fcmail","name":"Mail an Genehmiger"}
          ]}
        ]}}]
      """
          .trimIndent()

  /** Form-only and blank workflow rounds must not carry the workflow block (fail-open). */
  @Test
  fun `blank or null workflow structure injects no workflow block`() {
    val promptNonNull = buildSystemPrompt("   ")
    assertFalse(
        promptNonNull.contains("CURRENT WORKFLOW STRUCTURE"),
        "blank workflow structure must inject no workflow block")
    assertFalse(
        promptNonNull.contains("parent/child tree"),
        "blank workflow structure must not leak the workflow instruction")
  }

  @Test
  fun `null workflow structure still produces a working system prompt`() {
    val prompt = buildSystemPrompt(null)
    // The rest of the prompt must still assemble (the bundled template is used, with its
    // response-contract literals), just without the workflow block.
    assertTrue(
        prompt.contains("need_clarification"), "the system prompt must still assemble its contract")
    assertFalse(
        prompt.contains("CURRENT WORKFLOW STRUCTURE"), "null workflow must not inject its block")
  }

  @Test
  fun `a workflow structure yields the EXACT-node resolve instruction`() {
    val prompt = buildSystemPrompt(condensedCore)
    // The clarify round must resolve a named node to that EXACT node, not re-ask which one.
    assertTrue(prompt.contains("CURRENT WORKFLOW STRUCTURE (existing triggers and nodes)"))
    assertTrue(
        prompt.contains("target that EXACT node"),
        "the resolve-to-EXACT-node imperative must survive")
    assertTrue(
        prompt.contains("do NOT ask which node it means"),
        "the do-not-re-ask-which-node imperative must survive")
  }

  @Test
  fun `the condensed workflow core content reaches the final prompt`() {
    val prompt = buildSystemPrompt(condensedCore)
    // The decision core's reference surface must survive end-to-end: task name, trigger type, and
    // the named node the user can reference ("Freigabe").
    assertTrue(prompt.contains("Freigabe"), "the named node must reach the final prompt")
    assertTrue(prompt.contains("Antrag"), "the task name must reach the final prompt")
    assertTrue(prompt.contains("parent/child tree"), "the tree framing must reach the final prompt")
  }
}
