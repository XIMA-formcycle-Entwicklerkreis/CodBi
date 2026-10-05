package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

/**
 * Regression tests for the shapes the workflow AI uses to ask for node/trigger details
 * (`extractWorkflowDetailsRequest`).
 *
 * Every shape below was observed from a real model, in this order across the session:
 * 1. `{"status":"need_workflow_node_details","nodes":["FC_EMAIL"],"triggers":["FC_FORM_SUBMIT_BUTTON"]}`
 * 2. `{"nodes":["FC_EMAIL"],"triggers":["FC_FORM_SUBMIT_BUTTON"]}` (no "status")
 * 3. `{"need_workflow_node_details":{"nodes":["FC_EMAIL"],"triggers":["FC_FORM_SUBMIT_BUTTON"]}}`
 * 4. `{"triggers":[{"triggerType":"FC_FORM_SUBMIT_BUTTON"}],"nodes":[{"nodeType":"FC_EMAIL"}]}`
 *
 * Shape 3 previously aborted the build; shape 4 did too (an OBJECT element was not read as a name,
 * so both lists came back empty, the request was mistaken for a task and produced 0 specs → "The AI
 * did not return a workflow specification"). All four must resolve to the same signal, and a real
 * TASK object must still NOT be mistaken for a details request.
 */
class WorkflowDetailsRequestShapesTest {

  private val assistant = AICodBiAssistant()

  /** The private extractor returns a private data class; reflect the nodes/triggers out of it. */
  private fun extract(json: String): Pair<List<String>, List<String>>? {
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
    return nodes to triggers
  }

  @Test
  fun `shape 1 - strict status form`() {
    val r =
        extract(
            """{"status":"need_workflow_node_details","nodes":["FC_EMAIL"],"triggers":["FC_FORM_SUBMIT_BUTTON"]}""")
    assertEquals(listOf("FC_EMAIL") to listOf("FC_FORM_SUBMIT_BUTTON"), r)
  }

  @Test
  fun `shape 2 - flat form without status`() {
    val r = extract("""{"nodes":["FC_EMAIL"],"triggers":["FC_FORM_SUBMIT_BUTTON"]}""")
    assertEquals(listOf("FC_EMAIL") to listOf("FC_FORM_SUBMIT_BUTTON"), r)
  }

  @Test
  fun `shape 3 - nested wrapper form`() {
    val r =
        extract(
            """{"need_workflow_node_details":{"nodes":["FC_EMAIL"],"triggers":["FC_FORM_SUBMIT_BUTTON"]}}""")
    assertEquals(listOf("FC_EMAIL") to listOf("FC_FORM_SUBMIT_BUTTON"), r)
  }

  @Test
  fun `shape 4 - object elements carrying nodeType and triggerType`() {
    val r =
        extract(
            """{"triggers":[{"triggerType":"FC_FORM_SUBMIT_BUTTON"}],"nodes":[{"nodeType":"FC_EMAIL"}]}""")
    assertEquals(listOf("FC_EMAIL") to listOf("FC_FORM_SUBMIT_BUTTON"), r)
  }

  @Test
  fun `shape 4b - object elements carrying name or id`() {
    val r =
        extract("""{"nodes":[{"name":"FC_EMAIL"}],"triggers":[{"id":"FC_FORM_SUBMIT_BUTTON"}]}""")
    assertEquals(listOf("FC_EMAIL") to listOf("FC_FORM_SUBMIT_BUTTON"), r)
  }

  @Test
  fun `a real task object is NOT a details request`() {
    val task =
        """{"taskName":"Mail senden","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{"buttonName":"btnSend"},"nodeType":"FC_EMAIL","nodeParams":{"to":"a@b.de"},"endpointState":"Gesendet","endpointType":"FC_CHANGE_STATE"}"""
    assertNull(extract(task))
  }

  @Test
  fun `prose is not a details request`() {
    assertNull(extract("Wie soll die aktuelle Uhrzeit dargestellt werden?"))
  }

  @Test
  fun `a nodes array with only unusable elements is not a details request`() {
    assertNull(extract("""{"nodes":[{"unknown":"x"}],"triggers":[]}"""))
  }
}
