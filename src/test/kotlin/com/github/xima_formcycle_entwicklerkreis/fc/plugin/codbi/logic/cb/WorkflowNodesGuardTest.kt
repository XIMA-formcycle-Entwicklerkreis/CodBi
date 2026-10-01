package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Test

/**
 * Lever #7 of the input-token optimisation — "targeted `formcycle` key loads + `workflow_nodes`
 * regression guard".
 *
 * `PromptLoader.loadCategory(em, "formcycle")` materialises EVERY `formcycle.*` key (including the
 * ~109 KB `formcycle.workflow_nodes` CLOB) into a map on every call. The form-assistant paths
 * (`buildCodbiFormSystemPrompt`, `loadCodbiApplyPrompt`, `loadCodbiRethinkPrompt`,
 * `buildWidgetNameIndex`) now load only the single keys they actually consume
 * (`formcycle.general_decision` / `formcycle.general_apply` / `formcycle.widgets`), so the
 * workflow-only reference never enters a form-assistant prompt.
 *
 * These tests run against the REAL bundled prompt files and enforce that the FORM-assistant keys
 * NEVER carry the workflow-node reference material (which lives solely in
 * `formcycle-workflow-nodes.md`), in BOTH directions:
 * - a form key that grows back a workflow-node block (the `endpointType` / `triggerParams` /
 *   `chainedNodes` / `FC_DOI_INIT` output rules) fails the build, and
 * - the workflow-nodes file MUST stay a separate resource (it is never stitched into a form key).
 *
 * If a future edit re-adds `PromptLoader.loadCategory(em, "formcycle")` to a form path (or merges
 * the workflow-nodes block into a form key to "save a file"), one of these assertions fails.
 */
class WorkflowNodesGuardTest {

  /** The keys the form-assistant paths actually load (targeted single-key loads). */
  private val formKeys =
      listOf(
          "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-general.decision.md",
          "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-general-apply.md",
          "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-widgets.md")

  /** The workflow-only reference that must NEVER enter a form-assistant prompt. */
  private val workflowNodesResource =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-workflow-nodes.md"

  private fun read(resource: String): String =
      WorkflowNodesGuardTest::class
          .java
          .classLoader
          .getResourceAsStream(resource)
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled $resource not found on the classpath")

  // --- the workflow-only reference material lives ONLY in formcycle-workflow-nodes.md ===

  /** Distinctive workflow-output markers that have no place in a form build prompt. */
  private val wfOnlyMarkers =
      listOf(
          "Formcycle Workflow Nodes",
          "triggerParams",
          "endpointType",
          "chainedNodes",
          "FC_DOI_INIT")

  @Test
  fun `the workflow-nodes reference exists as a separate file`() {
    val wf = read(workflowNodesResource)
    // The point of Lever 7 is that this ~109 KB reference is only materialised by code that loads
    // it
    // explicitly. Assert it is a real, large, standalone resource — not an empty stub.
    assertFalse(
        wf.isBlank(),
        "formcycle-workflow-nodes.md must remain a real reference (Lever 7 targets skipping it, not deleting it)")
    assertFalse(
        wf.contains("END-NODE-REFERENCE"),
        "the workflow-nodes reference must be a full, live document")
  }

  @Test
  fun `none of the form-assistant keys carry the workflow-only output rules`() {
    // If any form key contained these markers, the workflow-node build rules would have leaked into
    // a form prompt (either by re-adding loadCategory(prefix=formcycle) or by merging the file).
    for (resource in formKeys) {
      val content = read(resource)
      for (marker in wfOnlyMarkers) {
        assertFalse(
            content.contains(marker, ignoreCase = true),
            "'$marker' leaked into $resource — formcycle.workflow_nodes must never enter a form-assistant prompt")
      }
    }
  }

  @Test
  fun `each form key stays lean (far smaller than the workflow-nodes reference)`() {
    // A form key that grows to the size of the workflow-nodes CLOB signals that the workflow
    // reference has been (re)merged into it. The workflow-nodes reference (~110 KB) is the LARGEST
    // single resource; `formcycle-widgets.md` (~73 KB) is legitimately big, but NO form-assistant
    // key
    // may ever match or exceed the workflow reference size — merging the ~110 KB block into a form
    // key would roughly double the largest form key and fail this assertion.
    val wfSize = read(workflowNodesResource).length
    for (resource in formKeys) {
      val size = read(resource).length
      assertFalse(
          size >= wfSize,
          "$resource grew to ${size} chars (>= the ${wfSize}-char workflow-nodes reference) — " +
              "formcycle.workflow_nodes may have been merged into a form-assistant key")
    }
  }
}
