package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import java.lang.reflect.Method
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests for the backend auto-ensure of workflow-referenced buttons ([AICodBiAssistant]'s
 * `workflowSubmitButtons` / `ensureWorkflowButtonsInForm` / `germanButtonLabel`).
 *
 * Reproduces the regression where a two-lane approve ("Genehmigen") / reject ("Ablehnen") workflow
 * referenced buttons `btnApprove` + `btnReject`, but only ONE button (`btnApprove`) was created
 * with the wrong label "Senden", `btnReject` was never created, and the decision buttons were not
 * gated on the approval status ("Available if").
 *
 * The decision buttons now carry a `buttonStatus` (= the approval/pending state name) emitted by
 * the workflow AI; the backend resolves it to the WorkflowState UUID, hosts the buttons in a
 * DEDICATED, state-gated XButtonList (`statusdependent:"1"` + `viewstatus:[<state UUID>]`) so they
 * only appear while the record is in that state.
 */
class WorkflowSubmitButtonsTest {

  private val assistant = AICodBiAssistant()

  private fun method(name: String, vararg params: Class<*>): Method =
      AICodBiAssistant::class.java.getDeclaredMethod(name, *params).apply { isAccessible = true }

  // The `workflow` change-log array from the production run: two decision lanes, one submit
  // (Genehmigen, sends the mail, ends with a state change) and one inert (Ablehnen, SEQUENCE +
  // FC_RETURN). Both declare buttonStatus = the approval/pending state the buttons gate on.
  private val productionWorkflow =
      """
      [
        {
          "name": "Genehmigen - Oeffnungszeiten senden",
          "trigger": { "type": "FC_FORM_SUBMIT_BUTTON", "params": { "buttonName": "btnApprove" } },
          "elements": [
            { "name": "FC_FOR_EACH_LOOP", "nodeType": "FC_FOR_EACH_LOOP", "params": {} },
            { "name": "FC_EMAIL", "nodeType": "FC_EMAIL", "params": {} }
          ],
          "status": { "endpointState": "Genehmigt", "endpointType": "FC_CHANGE_STATE", "stateProperties": {} },
          "buttonStatus": "Wartet auf Genehmigung"
        },
        {
          "name": "Ablehnen - Keine Aktion",
          "trigger": { "type": "FC_FORM_SUBMIT_BUTTON", "params": { "buttonName": "btnReject" } },
          "elements": [ { "name": "Ablehnen - Keine Aktion", "nodeType": "SEQUENCE", "params": {} } ],
          "status": { "endpointState": "", "endpointType": "FC_RETURN", "stateProperties": {} },
          "buttonStatus": "Wartet auf Genehmigung"
        }
      ]
      """
          .trimIndent()

  private fun parseWorkflow(): JsonArray = JsonParser.parseString(productionWorkflow).asJsonArray

  /** A minimal form with one page and NO XButtonList until buttons are ensured. */
  private fun emptyForm(): String =
      """{"name":"form","structureVersion":1,"items":[{"className":"XPage","properties":{"id":"p1","name":"Seite 1","elements":[]}}]}"""

  // ---- Reflection helpers for the private WorkflowButtonNeed class -----------------------------

  private fun needClass(): Class<*> =
      Class.forName(
          "com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.AICodBiAssistant\$WorkflowButtonNeed")

  private fun readName(o: Any?): String =
      needClass()
          .getDeclaredMethod("getName")
          .apply { isAccessible = true }
          .invoke(o)
          .let { it as String }

  private fun readSubmit(o: Any?): Boolean =
      needClass()
          .getDeclaredMethod("getSubmit")
          .apply { isAccessible = true }
          .invoke(o)
          .let { it as Boolean }

  private fun readGate(o: Any?): String? =
      needClass()
          .getDeclaredMethod("getGateState")
          .apply { isAccessible = true }
          .invoke(o)
          .let { it as String? }

  private fun makeNeed(name: String, submit: Boolean, gate: String? = null): Any {
    val ctor =
        needClass()
            .getDeclaredConstructor(
                String::class.java, Boolean::class.javaPrimitiveType!!, String::class.java)
    ctor.isAccessible = true
    return ctor.newInstance(name, submit, gate)
  }

  private fun workflowSubmitButtons(nodes: JsonArray?): List<*>? =
      method("workflowSubmitButtons", JsonArray::class.java).invoke(assistant, nodes) as List<*>?

  @Suppress("UNCHECKED_CAST")
  private fun ensureWorkflowButtonsInForm(
      formJson: String,
      needs: List<Any>,
      gateStateIds: Map<String, String> = emptyMap()
  ): String? =
      method("ensureWorkflowButtonsInForm", String::class.java, List::class.java, Map::class.java)
          .invoke(assistant, formJson, needs as List<*>, gateStateIds) as String?

  private fun germanButtonLabel(name: String): String =
      method("germanButtonLabel", String::class.java).invoke(assistant, name) as String

  // ---- Tests -----------------------------------------------------------------------------------

  @Test
  fun collectsBothNamedButtonsWithCorrectSubmitRolesAndGateState() {
    val result = workflowSubmitButtons(parseWorkflow())!!
    assertEquals(2, result.size)
    val approve = result.first { readName(it) == "btnApprove" }
    val reject = result.first { readName(it) == "btnReject" }
    assertTrue(readSubmit(approve), "the Genehmigen lane performs an action -> submit")
    assertEquals(false, readSubmit(reject), "the Ablehnen lane is inert (SEQUENCE + FC_RETURN)")
    assertEquals("Wartet auf Genehmigung", readGate(approve))
    assertEquals("Wartet auf Genehmigung", readGate(reject))
  }

  @Test
  fun returnsNullWhenNoSubmitLaneExists() {
    val nodes = JsonArray()
    val lane = JsonObject()
    lane.addProperty("name", "Task")
    val trigger = JsonObject()
    trigger.addProperty("type", "FC_EMAIL") // not a button trigger
    lane.add("trigger", trigger)
    nodes.add(lane)
    assertNull(workflowSubmitButtons(nodes))
  }

  @Test
  fun returnsGenericSubmitWhenLaneHasNoButtonName() {
    val nodes = JsonArray()
    val lane = JsonObject()
    lane.addProperty("name", "Task")
    val trigger = JsonObject()
    trigger.addProperty("type", "FC_FORM_SUBMIT_BUTTON")
    trigger.add("params", JsonObject()) // empty buttonName -> fire on any button
    lane.add("trigger", trigger)
    val status = JsonObject()
    status.addProperty("endpointState", "Empfangen")
    status.addProperty("endpointType", "FC_CHANGE_STATE")
    lane.add("status", status)
    nodes.add(lane)
    val result = workflowSubmitButtons(nodes)!!
    assertEquals(1, result.size)
    // The "" placeholder means "ensure a submit button exists"; it is resolved to btnSenden
    // downstream in ensureWorkflowButtonsInForm / primarySubmitButtonName.
    assertEquals("", readName(result[0]))
    assertTrue(readSubmit(result[0]))
  }

  @Test
  fun createsBothDecisionButtonsInADedicatedGatedXButtonList() {
    val needs = (workflowSubmitButtons(parseWorkflow()) as List<Any>)
    val gateUuid = "11111111-2222-3333-4444-555555555555"
    val ensured =
        ensureWorkflowButtonsInForm(
            emptyForm(), needs, mapOf("Wartet auf Genehmigung" to gateUuid))!!
    val root = JsonParser.parseString(ensured).asJsonObject
    val lists =
        root.getAsJsonArray("items").filter {
          it.isJsonObject && it.asJsonObject.get("className")?.asString == "XButtonList"
        }
    // The two decision buttons live in ONE dedicated, gated XButtonList.
    assertEquals(1, lists.size, "one dedicated XButtonList should be created")
    val props = lists[0].asJsonObject.getAsJsonObject("properties")

    // The dedicated list is gated on the approval status ("Available if"). Formcycle expects the
    // flag as the STRING "1" and the state's WorkflowState UUID in "viewstatus".
    assertEquals("1", props.get("statusdependent").asString)
    val vs = props.getAsJsonArray("viewstatus")
    assertEquals(true, vs.any { it.isJsonPrimitive && it.asString == gateUuid })

    val buttons = props.getAsJsonArray("buttons")
    val byName = mutableMapOf<String, JsonObject>()
    for (b in buttons) {
      byName[b.asJsonObject.get("name").asString] = b.asJsonObject
    }
    assertTrue(byName.containsKey("btnApprove"))
    assertTrue(byName.containsKey("btnReject"))

    val approve = byName.getValue("btnApprove")
    assertEquals("Genehmigen", approve.get("value").asString)
    assertEquals(
        "submit",
        approve.getAsJsonObject("action").get("page").asString,
        "approve button must submit to fire the lane")

    val reject = byName.getValue("btnReject")
    assertEquals("Ablehnen", reject.get("value").asString)
    assertEquals(
        "",
        reject.getAsJsonObject("action").get("page").asString,
        "reject button must NOT submit (nothing happens)")
  }

  @Test
  fun relabelsExistingAutoCreatedButtonAndMovesItIntoGatedList() {
    // Simulate the regression: btnApprove exists already (auto-created as a "Senden" submit
    // button),
    // the workflow needs it labelled "Genehmigen" and gated. btnReject is missing.
    val form =
        """{"name":"form","items":[{"className":"XPage","properties":{"id":"p1","name":"S","elements":["btnList"]}},{"className":"XButtonList","properties":{"name":"btnList","id":"xi-btnlist","parentid":"p1","buttons":[{"name":"btnApprove","title":"","value":"Senden","action":{"page":"submit","value":"Senden","displayName":"Senden"}}]}}]}"""
    val needs = (workflowSubmitButtons(parseWorkflow()) as List<Any>)
    val gateUuid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    val ensured =
        ensureWorkflowButtonsInForm(form, needs, mapOf("Wartet auf Genehmigung" to gateUuid))!!
    val root = JsonParser.parseString(ensured).asJsonObject
    val lists =
        root.getAsJsonArray("items").filter {
          it.isJsonObject && it.asJsonObject.get("className")?.asString == "XButtonList"
        }
    // A dedicated gated list is created for the decision buttons (the original btnList keeps the
    // old "Senden" button object but is not the place the approver acts on).
    val gatedProps =
        lists
            .map { it.asJsonObject.getAsJsonObject("properties") }
            .first { it.get("statusdependent")?.asString == "1" }
    val buttons = gatedProps.getAsJsonArray("buttons")
    val byName = mutableMapOf<String, JsonObject>()
    for (b in buttons) {
      byName[b.asJsonObject.get("name").asString] = b.asJsonObject
    }
    assertEquals("Genehmigen", byName.getValue("btnApprove").get("value").asString)
    assertTrue(byName.containsKey("btnReject"))
    assertEquals("", byName.getValue("btnReject").getAsJsonObject("action").get("page").asString)
    val vs = gatedProps.getAsJsonArray("viewstatus")
    assertEquals(true, vs.any { it.isJsonPrimitive && it.asString == gateUuid })
    // The pre-existing button must NOT be duplicated in the original (ungated) btnList — the
    // decision button now lives ONLY in the dedicated gated list.
    val originalListButtons =
        lists
            .map { it.asJsonObject.getAsJsonObject("properties") }
            .first { it.get("statusdependent")?.asString != "1" }
            .getAsJsonArray("buttons")
    assertEquals(
        false,
        originalListButtons.any { it.asJsonObject.get("name")?.asString == "btnApprove" },
        "btnApprove must not remain in the ungated list")
  }

  @Test
  fun keepsPlainSubmitButtonUngated() {
    // A normal submit lane (no buttonStatus) must NOT be gated — it stays in the normal list.
    val nodes = JsonArray()
    val lane = JsonObject()
    lane.addProperty("name", "Empfang bestätigen")
    val trigger = JsonObject()
    trigger.addProperty("type", "FC_FORM_SUBMIT_BUTTON")
    val tp = JsonObject()
    tp.addProperty("buttonName", "btnSenden")
    trigger.add("params", tp)
    lane.add("trigger", trigger)
    val status = JsonObject()
    status.addProperty("endpointState", "Empfangen")
    status.addProperty("endpointType", "FC_CHANGE_STATE")
    lane.add("status", status)
    nodes.add(lane)

    val needs = (workflowSubmitButtons(nodes) as List<Any>)
    assertNull(readGate(needs.first()), "a plain Senden lane has no gate state")
    val ensured = ensureWorkflowButtonsInForm(emptyForm(), needs)!!
    val root = JsonParser.parseString(ensured).asJsonObject
    val lists =
        root.getAsJsonArray("items").filter {
          it.isJsonObject && it.asJsonObject.get("className")?.asString == "XButtonList"
        }
    assertEquals(1, lists.size)
    val props = lists[0].asJsonObject.getAsJsonObject("properties")
    assertEquals(false, props.has("statusdependent"), "an ungated button list must not be gated")
  }

  @Test
  fun fallsBackToStateNameWhenNoUuidIsResolved() {
    // When no workflow version/UUID is available (e.g. DB unavailable) the gate falls back to the
    // state NAME, but "statusdependent" is still the canonical string "1".
    val needs = (workflowSubmitButtons(parseWorkflow()) as List<Any>)
    val ensured = ensureWorkflowButtonsInForm(emptyForm(), needs)!!
    val root = JsonParser.parseString(ensured).asJsonObject
    val props =
        root
            .getAsJsonArray("items")
            .map { it.asJsonObject }
            .first { it.get("className")?.asString == "XButtonList" }
            .getAsJsonObject("properties")
    assertEquals("1", props.get("statusdependent").asString)
    val vs = props.getAsJsonArray("viewstatus")
    assertEquals(true, vs.any { it.isJsonPrimitive && it.asString == "Wartet auf Genehmigung" })
  }

  @Test
  fun mapsCommonTechnicalNamesToGermanLabels() {
    assertEquals("Genehmigen", germanButtonLabel("btnApprove"))
    assertEquals("Genehmigen", germanButtonLabel("btnGenehmigen"))
    assertEquals("Ablehnen", germanButtonLabel("btnReject"))
    assertEquals("Ablehnen", germanButtonLabel("btnAblehnen"))
    assertEquals("Senden", germanButtonLabel("btnSenden"))
    assertEquals("Weiter", germanButtonLabel("btnWeiter"))
  }
}
