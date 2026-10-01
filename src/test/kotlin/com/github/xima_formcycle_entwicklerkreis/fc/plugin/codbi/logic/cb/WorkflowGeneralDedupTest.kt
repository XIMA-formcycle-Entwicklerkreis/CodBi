package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Lever #5 of the input-token optimisation — de-duplicate the workflow-side
 * `formcycle-general-workflow` (`{{GENERAL}}`) against the workflow-nodes references (mechanism B:
 * every rule has ONE authoritative home, so the workflow pass does not pay twice for the same
 * instruction).
 *
 * The workflow system prompt (`codbi-workflow-task-instruction.md`) composes TWO always-present
 * inputs:
 * - `{{GENERAL}}` ← `formcycle.general_workflow` (`formcycle-general-workflow.md`, the lean
 *   decision core)
 * - `{{WORKFLOW_REFERENCE}}` ← pass-1: `compact.formcycle_workflow_nodes`
 *   (`formcycle-workflow-nodes-compact.md`, the compact header); pass-2: `formcycle.workflow_nodes`
 *   (`formcycle-workflow-nodes.md`, the detailed header).
 *
 * The de-dup is LOSSESS because the resources the workflow steps act on are carried by the workflow
 * reference in BOTH passes:
 * - pass-1 uses the COMPACT reference, whose header MUST carry the server-variable catalog + the
 *   technicalId/displayText output rules (added by Lever 5) — otherwise dropping them from
 *   `{{GENERAL}}` would silently lose them;
 * - pass-2 uses the DETAILED reference, which has always carried them.
 *
 * These tests run against the REAL bundled prompt files (not fixtures) and enforce the split in
 * BOTH directions, so a future edit that re-adds the server-variable catalog / technicalId rules to
 * `formcycle-general-workflow.md`, or strips them from the compact/detailed reference headers,
 * fails the build instead of silently losing or re-paying those tokens.
 */
class WorkflowGeneralDedupTest {

  private val generalResource =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-general-workflow.md"
  private val compactResource =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/formcycle-workflow-nodes-compact.md"
  private val detailedResource =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-workflow-nodes.md"

  private fun read(resource: String): String =
      WorkflowGeneralDedupTest::class
          .java
          .classLoader
          .getResourceAsStream(resource)
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled $resource not found on the classpath")

  private val general = read(generalResource)
  private val compact = read(compactResource)
  private val detailed = read(detailedResource)

  // --- the {{GENERAL}} decision core carries no duplicated annex ===

  @Test
  fun `the workflow general decision core carries no server-variable catalog`() {
    assertFalse(
        general.contains("AVAILABLE SERVER VARIABLES", ignoreCase = true),
        "the server-variable catalog must NOT live in formcycle-general-workflow (it is in the workflow reference)")
    assertFalse(
        general.contains("[%\\\$PROCESS_ID%]"),
        "the server-variable catalog entries must NOT be re-added to formcycle-general-workflow")
    assertFalse(
        general.contains("[%\\\$FORM_PROCESS_LINK%]"),
        "the link server-variable entries must NOT be re-added to formcycle-general-workflow")
  }

  @Test
  fun `the workflow general decision core carries no technicalId output rules`() {
    // The decision core may only REFER to the rules (a pointer), never state their operative
    // phrasing.
    // The actual technicalId vs displayText output rules live in the workflow reference.
    assertFalse(
        general.contains("FORM ELEMENTS entries have: 'technicalId'"),
        "the technicalId/displayText output rules must NOT be re-added to formcycle-general-workflow")
    assertFalse(
        general.contains("NO-MATCH RULE", ignoreCase = true),
        "the NO-MATCH triggerParams rule must NOT be re-added to formcycle-general-workflow")
    assertFalse(
        general.contains("copy its 'technicalId' EXACTLY"),
        "the technicalId-copying imperative must NOT be re-added to formcycle-general-workflow")
  }

  @Test
  fun `the workflow general decision core stays lean`() {
    // The whole de-dup exists to keep {{GENERAL}} small (was ~6KB before Lever 5). A full re-add of
    // the
    // server-variable catalog + technicalId rules + form-building prose must fail the build.
    val capped = 3_500
    assertTrue(
        general.length < capped,
        "formcycle-general-workflow must stay a lean decision core (is ${general.length} chars, cap $capped) — an annex was re-added")
  }

  // --- the annex lives in the workflow reference in BOTH passes ===

  @Test
  fun `the compact workflow reference header carries the server-variable catalog for pass-1`() {
    // Pass-1 composes the COMPACT reference with no {{GENERAL}} annex, so the compact header must
    // carry
    // the catalog to keep the removal from {{GENERAL}} lossless.
    assertTrue(
        compact.contains("AVAILABLE SERVER VARIABLES", ignoreCase = true),
        "pass-1's compact reference must carry the server-variable catalog")
    assertTrue(
        compact.contains("[%\\\$PROCESS_ID%]"), "missing a representative compact server variable")
    assertTrue(
        compact.contains("[%\\\$FORM_PROCESS_LINK%]"),
        "missing the process-link server variable in the compact reference")
  }

  @Test
  fun `the compact workflow reference header carries the technicalId rules for pass-1`() {
    assertTrue(
        compact.contains("FORM ELEMENTS entries have: 'technicalId'"),
        "pass-1's compact reference must carry the technicalId/displayText output rules")
    assertTrue(
        compact.contains("NO-MATCH RULE", ignoreCase = true),
        "the compact reference must carry the NO-MATCH triggerParams rule")
  }

  @Test
  fun `the detailed workflow reference header keeps the server-variable catalog and technicalId rules for pass-2`() {
    // Pass-2 composes the DETAILED reference; it has always carried the annex and must keep it.
    assertTrue(
        detailed.contains("AVAILABLE SERVER VARIABLES", ignoreCase = true),
        "pass-2's detailed reference must keep the server-variable catalog")
    assertTrue(
        detailed.contains("[%\\\$PROCESS_ID%]"),
        "missing a representative detailed server variable")
    assertTrue(
        detailed.contains("FORM ELEMENTS entries have: 'technicalId'"),
        "pass-2's detailed reference must keep the technicalId output rules")
  }
}
