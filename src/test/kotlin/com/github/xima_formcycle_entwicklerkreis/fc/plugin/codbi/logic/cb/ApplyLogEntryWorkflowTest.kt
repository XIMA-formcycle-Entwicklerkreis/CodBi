package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests the WORKFLOW half of the inference-free re-apply behind the change log's per-node "apply
 * this entry again" button:
 * - [AiAssistantLog.computeAppliedWorkflowItems] extracts the stored full task specs from the node
 *   log into `items.workflow` and strips the private `_spec` key;
 * - [AiAssistantLog.mergeAppliedItems] combines the form and workflow halves into one payload;
 * - [AICodBiAssistant.selectLoggedWorkflowSpecs] selects the path(s) a per-node apply targets.
 *
 * The actual node/task re-creation goes through Formcycle's node/task API
 * ([AICodBiAssistant.applyLoggedWorkflowNodes] → [AICodBiAssistant.applyWorkflowOperation]) and is
 * exercised end-to-end against a server, not in this unit test — here only the deterministic,
 * side-effect-free parts are covered.
 */
class ApplyLogEntryWorkflowTest {

  private val assistant = AICodBiAssistant()

  /** A node log with one created path whose private `_spec` carries the full task spec. */
  private fun nodeLogWithSpec(): JsonArray {
    val spec =
        JsonParser.parseString(
                """
                {"taskName":"Approve","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{"buttonName":"btnApprove"},
                 "nodeType":"FC_CHANGE_STATE","nodeParams":{"state":"APPROVED"},"endpointState":"APPROVED",
                 "endpointType":"FC_CHANGE_STATE","operation":"create"}
                """
                    .trimIndent())
            .asJsonObject
    val path = JsonObject()
    path.addProperty("name", "Approve")
    val trigger = JsonObject()
    trigger.addProperty("type", "FC_FORM_SUBMIT_BUTTON")
    path.add("trigger", trigger)
    path.add("_spec", spec)
    val nodeLog = JsonArray()
    nodeLog.add(path)
    return nodeLog
  }

  /** The `items` payload shape the workflow half produces: `{workflow:{nodes:[{name,spec}]}}`. */
  private fun payloadWithWorkflow(vararg names: String): JsonObject {
    val nodes = JsonArray()
    for (n in names) {
      val o = JsonObject()
      o.addProperty("name", n)
      val spec = JsonObject()
      spec.addProperty("nodeType", "FC_EMAIL")
      o.add("spec", spec)
      nodes.add(o)
    }
    val workflow = JsonObject()
    workflow.add("nodes", nodes)
    val out = JsonObject()
    out.add("workflow", workflow)
    return out
  }

  // ---- computeAppliedWorkflowItems -------------------------------------------------------------

  @Test
  fun `extracts each created path spec into items_workflow and strips the private _spec`() {
    val nodeLog = nodeLogWithSpec()
    val items = AiAssistantLog.computeAppliedWorkflowItems(nodeLog)
    assertNotNull(items)
    val nodes = items!!.getAsJsonObject("workflow").getAsJsonArray("nodes")
    assertEquals(1, nodes.size(), nodes.toString())
    val entry = nodes[0].asJsonObject
    assertEquals("Approve", entry.get("name").asString)
    assertEquals("FC_CHANGE_STATE", entry.getAsJsonObject("spec").get("nodeType").asString)
    // The full trigger params must survive (they are what re-creates the path).
    assertEquals(
        "btnApprove",
        entry.getAsJsonObject("spec").getAsJsonObject("triggerParams").get("buttonName").asString)
    // The private `_spec` is stripped from the SAME array instance so the stored change description
    // (and the client payload) stay lean.
    assertNull(nodeLog[0].asJsonObject.get("_spec"), nodeLog.toString())
  }

  @Test
  fun `a node log without a usable spec yields no workflow items but still strips _spec`() {
    val path = JsonObject()
    path.addProperty("name", "Remove path")
    path.addProperty("_spec", "not-an-object")
    val nodeLog = JsonArray()
    nodeLog.add(path)
    assertNull(AiAssistantLog.computeAppliedWorkflowItems(nodeLog))
    assertNull(path.get("_spec"))
  }

  @Test
  fun `no node log yields no workflow items`() {
    assertNull(AiAssistantLog.computeAppliedWorkflowItems(null))
  }

  @Test
  fun `every created path is collected`() {
    val nodeLog = nodeLogWithSpec()
    val second = nodeLog[0].asJsonObject.deepCopy()
    second.addProperty("name", "Reject")
    nodeLog.add(second)
    val items = AiAssistantLog.computeAppliedWorkflowItems(nodeLog)!!
    val names =
        items.getAsJsonObject("workflow").getAsJsonArray("nodes").map {
          it.asJsonObject.get("name").asString
        }
    assertEquals(listOf("Approve", "Reject"), names)
  }

  // ---- mergeAppliedItems -----------------------------------------------------------------------

  @Test
  fun `merge keeps the form half, the workflow half, or both`() {
    val form = JsonParser.parseString("""{"form":{"created":[]}}""").asJsonObject
    val workflow = payloadWithWorkflow("Approve")
    val both = AiAssistantLog.mergeAppliedItems(form, workflow)
    assertNotNull(both!!.getAsJsonObject("form"))
    assertNotNull(both.getAsJsonObject("workflow"))
    val formOnly = AiAssistantLog.mergeAppliedItems(form, null)
    assertNotNull(formOnly!!.getAsJsonObject("form"))
    assertNull(formOnly.getAsJsonObject("workflow"))
    val workflowOnly = AiAssistantLog.mergeAppliedItems(null, workflow)
    assertNotNull(workflowOnly!!.getAsJsonObject("workflow"))
    assertNull(workflowOnly.getAsJsonObject("form"))
    assertNull(AiAssistantLog.mergeAppliedItems(null, null))
  }

  // ---- selectLoggedWorkflowSpecs ---------------------------------------------------------------

  @Test
  fun `selection by name returns only that path's spec`() {
    val items = payloadWithWorkflow("Approve", "Reject")
    val all = assistant.selectLoggedWorkflowSpecs(items, null)
    assertEquals(listOf("Approve", "Reject"), all.map { it.first })
    val one = assistant.selectLoggedWorkflowSpecs(items, "Reject")
    assertEquals(listOf("Reject"), one.map { it.first })
    assertTrue(assistant.selectLoggedWorkflowSpecs(items, "Nope").isEmpty())
  }

  @Test
  fun `an entry without workflow nodes selects nothing`() {
    assertTrue(assistant.selectLoggedWorkflowSpecs(JsonObject(), null).isEmpty())
  }

  @Test
  fun `a node entry without a spec object is skipped`() {
    val workflow = JsonObject()
    val nodes = JsonArray()
    val noSpec = JsonObject()
    noSpec.addProperty("name", "NoSpec")
    nodes.add(noSpec)
    workflow.add("nodes", nodes)
    val items = JsonObject()
    items.add("workflow", workflow)
    assertTrue(assistant.selectLoggedWorkflowSpecs(items, null).isEmpty())
  }
}
