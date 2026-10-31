package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonParser
import java.util.UUID
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Regression tests for the cross-form record node, whose properties stayed EMPTY in the designer
 * although the node itself was created correctly.
 *
 * The installed plugin's props class is `de.xima.advanced.model.node.CreateRemoteFormRecordProps`
 * with the fields `inboxRef`, `useNewWf`, `projectRef` ("Formular", @NotNull), `statusRef`
 * ("Ziel-Status", `de.xima.fc.entities.Status`), `transferAttachments`, `copyAll`, `elementsToCopy`
 * and `attachmentFilter`. The previously emitted keys (`project`, `stateNewRecord`,
 * `otherAttachments`, `copyOtherAttachments`) do not exist there and were therefore ignored.
 */
class RemoteFormRecordParamsTest {

  private val projectUuid = UUID.fromString("3ca93027-b9c0-4bc3-8023-1a3d8982cfe9")
  private val statusUuid = UUID.fromString("3fe42a7b-a2bf-4add-b4a3-825bd4e16f65")
  private val inboxUuid = UUID.fromString("8b7c1a52-2c43-4a1f-9d55-0d0f5c1a2b3c")

  private fun defaultTarget(
      inbox: UUID? = inboxUuid,
      inboxName: String? = "FOR 308",
      usesNewWorkflow: Boolean = false
  ) =
      RemoteFormRecordTarget(
          usesNewWorkflow = usesNewWorkflow,
          statusUuid = statusUuid,
          statusName = "Eingegangen",
          requestedStatusFound = true,
          availableStatuses = listOf("Eingegangen"),
          inboxUuid = inbox,
          inboxName = inboxName,
          requestedInboxFound = inbox != null,
          availableInboxes = listOf("FOR 308", "FOR 512"))

  private fun props(
      nodeParams: Map<String, Any?>,
      projectUuid: UUID? = this.projectUuid,
      target: RemoteFormRecordTarget? = defaultTarget()
  ) =
      JsonParser.parseString(
              "{${RemoteFormRecordParams.propsJson(nodeParams, projectUuid, target)}}")
          .asJsonObject

  @Test
  fun `the target form is written to projectRef with the Projekt entity class`() {
    val props = props(emptyMap())

    val projectRef = props.getAsJsonObject("projectRef")
    assertEquals(projectUuid.toString(), projectRef.get("uuid").asString)
    assertEquals(
        RemoteFormRecordParams.PROJEKT_ENTITY_CLASS, projectRef.get("entityClass").asString)
    // The old, non-existent keys must never come back.
    assertNull(props.get("project"))
    assertNull(props.get("stateNewRecord"))
    assertNull(props.get("otherAttachments"))
    assertNull(props.get("copyOtherAttachments"))
  }

  @Test
  fun `the target inbox is written to inboxRef as a Postfach reference`() {
    val props = props(emptyMap())

    val inboxRef = props.getAsJsonObject("inboxRef")
    assertEquals(inboxUuid.toString(), inboxRef.get("uuid").asString)
    assertEquals(RemoteFormRecordParams.INBOX_ENTITY_CLASS, inboxRef.get("entityClass").asString)
  }

  @Test
  fun `without a resolved inbox no inboxRef is emitted`() {
    // The inbox property is optional: without one the plugin keeps the target form's default inbox,
    // so a request that names no inbox (or an unknown one) must not produce a dangling reference.
    val props = props(emptyMap(), target = defaultTarget(inbox = null, inboxName = null))

    assertNull(props.get("inboxRef"))
    assertTrue(props.has("projectRef"))
  }

  @Test
  fun `an inbox name matches the stored spelling modulo spacing and zero padding`() {
    // The user wrote "FOR 308" while the client's inbox is named "FOR 0308" — the NAME is
    // translated,
    // the decision (which inbox) is not touched.
    assertEquals(
        RemoteFormRecordParams.normalizeInboxKey("FOR 0308"),
        RemoteFormRecordParams.normalizeInboxKey("FOR 308"))
    assertEquals(
        RemoteFormRecordParams.normalizeInboxKey("Zentrales Postfach"),
        RemoteFormRecordParams.normalizeInboxKey("zentrales-postfach"))
    assertNotEquals(
        RemoteFormRecordParams.normalizeInboxKey("FOR 0308"),
        RemoteFormRecordParams.normalizeInboxKey("FOR 0512"))
  }

  @Test
  fun `the attachments array of the model is accepted like files`() {
    // A live run emitted the REAL MultiFile items instead of the documented "files" list.
    val props =
        props(mapOf("attachments" to listOf(mapOf("type" to "UPLOAD", "identifier" to "upload1"))))

    assertTrue(props.get("transferAttachments").asBoolean)
    val resources = props.getAsJsonObject("attachmentFilter").getAsJsonArray("resources")
    assertEquals(1, resources.size())
    assertEquals("UPLOAD", resources[0].asJsonObject.get("type").asString)
    assertEquals("upload1", resources[0].asJsonObject.get("identifier").asString)
  }

  @Test
  fun `a SEARCH attachment item selects no upload field and transfers nothing`() {
    val props = props(mapOf("attachments" to listOf(mapOf("type" to "SEARCH"))))

    assertNull(props.get("transferAttachments"))
    assertNull(props.get("attachmentFilter"))
  }

  @Test
  fun `the inbox name is read from the node params in its alternative spellings`() {
    assertEquals(
        "FOR 308", RemoteFormRecordParams.requestedInboxName(mapOf("inboxName" to "FOR 308")))
    assertEquals(
        "FOR 308", RemoteFormRecordParams.requestedInboxName(mapOf("postfach" to " FOR 308 ")))
    assertEquals(
        "FOR 308", RemoteFormRecordParams.requestedInboxName(mapOf("targetInbox" to "FOR 308")))
    assertEquals("", RemoteFormRecordParams.requestedInboxName(emptyMap()))
    // The attribute mapping of the SAME node must never be mistaken for an inbox name.
    assertEquals(
        "",
        RemoteFormRecordParams.requestedInboxName(
            mapOf("elementsToCopy" to listOf(mapOf("name" to "feld", "value" to "[%tf1%]")))))
  }

  @Test
  fun `the requested status is written to statusRef as a Status reference`() {
    val props = props(emptyMap())

    val statusRef = props.getAsJsonObject("statusRef")
    assertEquals(statusUuid.toString(), statusRef.get("uuid").asString)
    assertEquals(RemoteFormRecordParams.STATUS_ENTITY_CLASS, statusRef.get("entityClass").asString)
    assertFalse(props.get("useNewWf").asBoolean)
  }

  @Test
  fun `a target form with the new workflow gets no preset status`() {
    val props =
        props(
            emptyMap(),
            target =
                RemoteFormRecordTarget(
                    usesNewWorkflow = true,
                    statusUuid = statusUuid,
                    statusName = "Eingegangen",
                    requestedStatusFound = true,
                    availableStatuses = listOf("Eingegangen")))

    // `useNewWf` mirrors Projekt.isUsesNewWorkflow() — the plugin hides the status selector then
    // and
    // the target workflow processes the new record instead.
    assertTrue(props.get("useNewWf").asBoolean)
    assertNull(props.get("statusRef"))
    assertTrue(props.has("projectRef"))
  }

  @Test
  fun `an unbound target form emits no projectRef but stays valid JSON`() {
    val props = props(emptyMap(), projectUuid = null)

    assertNull(props.get("projectRef"))
    assertFalse(props.get("useNewWf").asBoolean)
    assertFalse(props.get("copyAll").asBoolean)
  }

  @Test
  fun `the upload field becomes transferAttachments plus an UPLOAD resource filter`() {
    val props = props(mapOf("files" to listOf("upload1")))

    assertTrue(props.get("transferAttachments").asBoolean)
    val resources = props.getAsJsonObject("attachmentFilter").getAsJsonArray("resources")
    assertEquals(1, resources.size())
    assertEquals("UPLOAD", resources[0].asJsonObject.get("type").asString)
    assertEquals("upload1", resources[0].asJsonObject.get("identifier").asString)
  }

  @Test
  fun `assignments become Setting objects and copyAll is passed through`() {
    val props =
        props(
            mapOf(
                "copyAll" to true,
                "elementsToCopy" to listOf(mapOf("name" to "feldZiel", "value" to "[%tf1%]"))))

    assertTrue(props.get("copyAll").asBoolean)
    val settings = props.getAsJsonArray("elementsToCopy")
    assertEquals(1, settings.size())
    val setting = settings[0].asJsonObject
    assertEquals("feldZiel", setting.get("name").asString)
    assertEquals("[%tf1%]", setting.get("value").asString)
    assertTrue(setting.get("nameEditable").asBoolean)
    assertTrue(setting.get("valueEditable").asBoolean)
  }

  @Test
  fun `no attachments and no assignments keep those members out`() {
    val props = props(emptyMap())

    assertNull(props.get("transferAttachments"))
    assertNull(props.get("attachmentFilter"))
    assertNull(props.get("elementsToCopy"))
  }
}
