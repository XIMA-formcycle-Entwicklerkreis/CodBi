package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * STAGE 2 (two-tier split of the existing-workflow-structure block) — regression tests for the
 * demand path and the bounded-mode contract.
 *
 * Two things are exercised without a live FORMCYCLE server:
 * 1. `extractWorkflowDetailsRequest` must now additionally surface `instanceIds` — the numeric ids
 *    of EXISTING nodes whose FULL current bodies the model demands directly (a replace/modify of a
 *    node it only saw as a truncated preview). The ids travel on the same envelope used for node /
 *    trigger schema names (`need_workflow_node_details`), in the same three shape variants, and
 *    must be deduped; non-numeric entries are dropped (the demand path only serves real node ids).
 * 2. `buildWorkflowSystemPrompt` must accept the new bounded-mode parameters
 *    (`existingStructureBounded`, `existingStructureDemandedIds`). It is DB-backed (it returns the
 *    classpath fallback prompt when no entity manager is live), so the fail-open contract — the new
 *    bounded flag never changes the output when the structure itself is absent — is asserted
 *    through the deterministic fallback return.
 *
 * The full filtered-by-id re-render of `buildWorkflowStructureContext` itself is DB-backed and
 * therefore asserted through this demand-path seam plus the bounded preamble contract (see the plan
 * doc §6 for the server-side corpus check).
 */
class WorkflowExistingStructureSliceTest {

  private val assistant = AICodBiAssistant()

  /** Reflect out (nodes, triggers, instanceIds) from the private details signal. */
  private fun extract(json: String): Triple<List<String>, List<String>, List<String>>? {
    val method =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod("extractWorkflowDetailsRequest", String::class.java)
            .apply { isAccessible = true }
    val signal = method.invoke(assistant, json) ?: return null
    val cls = signal.javaClass
    @Suppress("UNCHECKED_CAST")
    val nodes =
        cls.getDeclaredMethod("getNodes").apply { isAccessible = true }.invoke(signal)
            as List<String>
    @Suppress("UNCHECKED_CAST")
    val triggers =
        cls.getDeclaredMethod("getTriggers").apply { isAccessible = true }.invoke(signal)
            as List<String>
    @Suppress("UNCHECKED_CAST")
    val instanceIds =
        cls.getDeclaredMethod("getInstanceIds").apply { isAccessible = true }.invoke(signal)
            as List<String>
    return Triple(nodes, triggers, instanceIds)
  }

  @Test
  fun `strict status form surfaces instanceIds`() {
    val r =
        extract(
            """{"status":"need_workflow_node_details","instanceIds":[123,456],"nodes":["FC_EMAIL"]}""")
    assertEquals(Triple(listOf("FC_EMAIL"), emptyList<String>(), listOf("123", "456")), r)
  }

  @Test
  fun `nested wrapper form surfaces instanceIds`() {
    val r = extract("""{"need_workflow_node_details":{"instanceIds":[7,8]}}""")
    assertEquals(Triple(emptyList<String>(), emptyList<String>(), listOf("7", "8")), r)
  }

  @Test
  fun `tolerant flat form surfaces instanceIds`() {
    val r = extract("""{"instanceIds":[99]}""")
    assertEquals(Triple(emptyList<String>(), emptyList<String>(), listOf("99")), r)
  }

  @Test
  fun `instanceIds accept string-typed numeric ids and dedupe`() {
    val r = extract("""{"status":"need_workflow_node_details","instanceIds":["42",42,"42"]}""")
    assertEquals(Triple(emptyList<String>(), emptyList<String>(), listOf("42")), r)
  }

  @Test
  fun `non-numeric instanceIds entries are dropped`() {
    val r =
        extract("""{"status":"need_workflow_node_details","instanceIds":["abc",123,null,456.0]}""")
    // 456.0 parses as a Double → toLong → "456"; non-numeric and null entries are dropped.
    assertEquals(Triple(emptyList<String>(), emptyList<String>(), listOf("123", "456")), r)
  }

  @Test
  fun `a demand with only unusable instanceIds is not a request`() {
    // Non-numeric ids yield an empty instanceIds list AND no node/trigger names → not a request.
    val r = extract("""{"instanceIds":["abc"]}""")
    assertEquals(null, r)
  }

  /** The bounded-mode params must be present on the private prompt builder (wiring compiles). */
  @Test
  fun `buildWorkflowSystemPrompt accepts the bounded-mode params`() {
    val method =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod(
                "buildWorkflowSystemPrompt",
                String::class.java, // formContext
                String::class.java, // repeatableContainers
                String::class.java, // htmlTemplates
                String::class.java, // completionPages
                String::class.java, // workflowStates
                String::class.java, // inboxes
                String::class.java, // messageServices
                String::class.java, // triggers
                String::class.java, // existingWorkflowNodes
                List::class.java, // requestedNodes
                List::class.java, // requestedTriggers
                String::class.java, // clarificationContext
                String::class.java, // chatContext
                String::class.java, // changeHistoryContext
                String::class.java, // formVariables
                String::class.java, // existingWorkflowStructure
                Boolean::class.javaPrimitiveType, // existingStructureBounded
                Set::class.java) // existingStructureDemandedIds
    assertNotNull(method)
    method.isAccessible = true
    // Fail-open: with no entity manager the builder returns the classpath fallback prompt whether
    // or
    // not the bounded flag is set — the new flag must never change the no-DB result.
    val resultBothFlags =
        method.invoke(
            assistant,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            emptyList<Any>(),
            emptyList<Any>(),
            null,
            null,
            null,
            null,
            null,
            true,
            emptySet<Any>()) as String
    val resultNoFlags =
        method.invoke(
            assistant,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            emptyList<Any>(),
            emptyList<Any>(),
            null,
            null,
            null,
            null,
            null,
            false,
            emptySet<Any>()) as String
    assertTrue(resultBothFlags.isNotBlank())
    assertEquals(resultNoFlags, resultBothFlags)
  }
}
