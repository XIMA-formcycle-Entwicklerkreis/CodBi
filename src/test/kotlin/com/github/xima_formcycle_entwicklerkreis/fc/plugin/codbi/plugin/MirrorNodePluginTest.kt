package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.alibaba.fastjson.JSON
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.MirrorTriggerPaths
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.WorkflowLaneMaterializer
import de.xima.cmn.reader.JsonReader
import de.xima.fc.interfaces.workflow.params.IGetElementPrototypesParams
import de.xima.fc.interfaces.workflow.value.ValueBuilderOptions
import de.xima.fc.workflow.processor.value.ValueDescriptorFactory
import io.mockk.mockk
import java.util.Locale
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class MirrorNodePluginTest {
  private val plugin = MirrorNodePlugin()
  private val params = mockk<IGetElementPrototypesParams>(relaxed = true)

  /**
   * Minimal stand-in for a FORMCYCLE `WorkflowNode`: [MirrorNodePlugin] reads nodes purely by
   * reflection (`getId`/`getType`/`getName`/`getParent`/`getChildren`), so a plain class is enough.
   * The backing fields are `@JvmField`s so the generated accessors do not clash with the explicit
   * `getXyz()` methods.
   */
  class StubNode(
      @JvmField val id: Long,
      @JvmField val type: String,
      @JvmField val nodeName: String,
  ) {
    @JvmField var parent: StubNode? = null
    @JvmField val children: MutableList<StubNode> = mutableListOf()

    fun getId(): Long = id

    fun getType(): String = type

    fun getName(): String = nodeName

    fun getParent(): StubNode? = parent

    fun getChildren(): List<StubNode> = children
  }

  @Test
  fun `uses a stable technical name`() {
    assertEquals("Mirror", plugin.name)
  }

  @Test
  fun `provides the properties view`() {
    assertEquals("MirrorNode.xhtml", plugin.propertiesViewXhtmlName)
  }

  @Test
  fun `provides localized display name and description`() {
    assertEquals("Mirror", plugin.getDisplayName(Locale.ENGLISH))
    assertTrue(plugin.getDescription(Locale.ENGLISH).isNotBlank())
    assertEquals("Spiegel", plugin.getDisplayName(Locale.GERMAN))
  }

  @Test
  fun `uses the CodBi workflow categories`() {
    val main = plugin.getMainCategory(params)
    val sub = plugin.getSubCategory(params)

    assertEquals("CodBi", main.getName(Locale.ENGLISH))
    assertEquals("Mirror", sub.getName(Locale.ENGLISH))
    assertEquals("Spiegel", sub.getName(Locale.GERMAN))
  }

  @Test
  fun `reuses the mirror widget icon`() {
    val icon = plugin.getPrototypeIcon(params)

    assertNotNull(icon)
    assertEquals("fa fa-clone", icon.styleClass)
    assertTrue(icon.style.contains("mirror-icon.svg"))
  }

  @Test
  fun `builds the prototype icon with the request context path`() {
    val icon = plugin.buildPrototypeIcon("/formcycle")

    assertEquals("fa fa-clone", icon.styleClass)
    assertTrue(icon.style.contains("/formcycle/plugin?name=Resource"))
    assertTrue(icon.style.contains("mirror-icon.svg"))
  }

  @Test
  fun `properties view offers form and path pickers`() {
    val view = plugin.propertiesViewXhtml.readText()

    assertTrue(view.contains("data-codbi-mirror-node"))
    assertTrue(view.contains("workflow-mirror-node.js"))
    assertTrue(view.contains("codbiMirrorStore"))
    assertTrue(view.contains("id=\"mirrorSourceForm\""))
    assertTrue(view.contains("id=\"mirrorPathId\""))
    assertTrue(view.contains("codbiMirrorPreview"))
  }

  @Test
  fun `persists source form and path through the workflow props serializer`() {
    val props =
        MirrorNodeProps().apply {
          sourceForm = "project-7"
          sourceFormName = "Antrag"
          pathId = "42"
          pathName = "Bestätigung"
          outputMode = "NODES"
        }

    val restored = JSON.parseObject(JSON.toJSONString(props), MirrorNodeProps::class.java)

    assertEquals("project-7", restored.sourceForm)
    assertEquals("Antrag", restored.sourceFormName)
    assertEquals("42", restored.pathId)
    assertEquals("Bestätigung", restored.pathName)
    assertEquals("NODES", restored.outputMode)
  }

  @Test
  fun `success result keeps the resolved value with the strict result builder`() {
    // The workflow engine builds the success value with `ValueBuilderOptions.immutable()`, i.e.
    // strict acceptance criteria. `value` is therefore declared as a plain string.
    val descriptor =
        plugin.getSuccessValueDescriptor(ValueDescriptorFactory.getInstance()).asRecord()

    val result =
        descriptor
            .builder(ValueBuilderOptions.immutable())
            .property("form", "Antrag")
            .property("path", "Bestätigung")
            .property("trigger", "FC_FORM_SUBMIT_BUTTON: Absenden")
            .property("summary", "Antrag / Bestätigung (2 nodes)")
            .property("value", "Antrag / Bestätigung (2 nodes)")
            .property("nodes", listOf("SEQUENCE: Start", "FC_EMAIL: Mail"))
            .property("nodeCount", "2")
            .property("revision", "123")
            .build()

    assertEquals("Antrag / Bestätigung (2 nodes)", result["value"])
    assertEquals(listOf("SEQUENCE: Start", "FC_EMAIL: Mail"), result["nodes"])
  }

  @Test
  fun `uses the CodBi dark-orange theme colour`() {
    assertEquals("#FF8C00", plugin.themeColor.toHexString())
  }

  @Test
  fun `lane detection accepts an empty lane so the mirrored nodes can be created`() {
    // Reflecting path: root SEQUENCE that contains nothing but the Mirror node. This is the state
    // of
    // a freshly configured form — previously the lane lookup returned null ("SKIPPED:no-lane"), so
    // neither the lazy re-sync nor the reflector registration ever ran and the source nodes were
    // never created.
    val root = StubNode(1, "SEQUENCE", "FcSequenceHandler")
    val mirror = StubNode(2, "Mirror", "Spiegel").also { it.parent = root }
    root.children.add(mirror)

    val lane = plugin.locateLane(mirror)

    assertNotNull(lane)
    assertEquals(root, lane!!.laneParent)
    assertTrue(lane.children.isEmpty(), "an empty lane must be reported, not skipped")
    assertEquals("FcSequenceHandler:0 downstream siblings", lane.label)
  }

  @Test
  fun `lane detection returns the downstream siblings of the mirror node`() {
    val root = StubNode(1, "SEQUENCE", "FcSequenceHandler")
    val mirror = StubNode(2, "Mirror", "Spiegel").also { it.parent = root }
    val mail = StubNode(3, "FC_EMAIL", "Mail").also { it.parent = root }
    val state = StubNode(4, "FC_CHANGE_STATE", "Status").also { it.parent = root }
    root.children.addAll(listOf(mirror, mail, state))

    val lane = plugin.locateLane(mirror)

    assertNotNull(lane)
    assertEquals(root, lane!!.laneParent)
    assertEquals(listOf(mail, state), lane.children)
    assertEquals("FcSequenceHandler:2 downstream siblings", lane.label)
  }

  @Test
  fun `lane detection skips a mirror node that is the path root node`() {
    // With no parent there is no container to create the mirrored nodes in — the plugin must report
    // "no lane" (and log why) instead of trying to rebuild into a non-existent container.
    val mirror = StubNode(2, "Mirror", "Spiegel")

    assertNull(plugin.locateLane(mirror))
  }

  @Test
  fun `syncEndpoint defaults to true and pauseSync to false`() {
    val props = MirrorNodeProps()

    assertTrue(props.syncEndpoint, "the source endpoint is synced by default")
    assertFalse(props.pauseSync, "sync is not paused by default")
  }

  @Test
  fun `persists the syncEndpoint and pauseSync options`() {
    val props =
        MirrorNodeProps().apply {
          sourceForm = "project-7"
          pathId = "42"
          syncEndpoint = false
          pauseSync = true
        }

    val restored = JSON.parseObject(JSON.toJSONString(props), MirrorNodeProps::class.java)

    assertFalse(restored.syncEndpoint)
    assertTrue(restored.pauseSync)
  }

  @Test
  fun `endpoint node types are recognised`() {
    assertTrue(WorkflowLaneMaterializer.isTerminalEndpointType("FC_CHANGE_STATE"))
    assertTrue(WorkflowLaneMaterializer.isTerminalEndpointType("FC_RETURN"))
    assertTrue(WorkflowLaneMaterializer.isTerminalEndpointType("FC_DELETE_FORM_RECORD"))
    assertTrue(WorkflowLaneMaterializer.isTerminalEndpointType("FC_QUEUE_TASK"))
    assertFalse(WorkflowLaneMaterializer.isTerminalEndpointType("SEQUENCE"))
    assertFalse(WorkflowLaneMaterializer.isTerminalEndpointType("FC_EMAIL"))
    assertFalse(WorkflowLaneMaterializer.isTerminalEndpointType(null))
  }

  @Test
  fun `content revision changes when a referenced status is renamed`() {
    // An endpoint only carries the state UUID, so renaming the status changes neither the node name
    // nor its params — the name map has to contribute to the revision, otherwise a rename alone
    // would
    // never re-materialize the reflected lane.
    val node =
        WorkflowLaneMaterializer.SourceNode(
            id = 1L,
            uuid = "node-uuid",
            type = "FC_CHANGE_STATE",
            name = "Status setzen",
            description = "",
            paramsJson = """{"targetState":{"uuid":"state-uuid"}}""",
            children = emptyList())
    val base =
        WorkflowLaneMaterializer.SourceLane(
            pathId = 42L,
            pathName = "Pfad",
            triggerType = "FC_CYC",
            roots = listOf(node),
            revision = 0,
            sourceStatesByUuid = mapOf("state-uuid" to "Gesendet"))

    assertEquals(
        WorkflowLaneMaterializer.contentRevision(base),
        WorkflowLaneMaterializer.contentRevision(base.copy()),
        "an unchanged lane must keep its revision")
    assertNotEquals(
        WorkflowLaneMaterializer.contentRevision(base),
        WorkflowLaneMaterializer.contentRevision(
            base.copy(sourceStatesByUuid = mapOf("state-uuid" to "Versendet"))),
        "renaming the referenced status must change the revision")
  }

  @Test
  fun `terminal endpoint of a lane is its last child when terminal`() {
    val mail = StubNode(2, "FC_EMAIL", "Mail")
    val state = StubNode(3, "FC_CHANGE_STATE", "Status")

    assertEquals(state, WorkflowLaneMaterializer.terminalEndpointOf(listOf(mail, state)))
    assertNull(
        WorkflowLaneMaterializer.terminalEndpointOf(listOf(state, mail)),
        "a terminal node that is not last is not the lane endpoint")
  }

  /**
   * The Mirror node of a created reflecting path is persisted through the node API, and
   * `AWorkflowElement.customParameters` is annotated `@NotNull` + `@JsonObject`, validated with
   * FORMCYCLE's own strict reader. An invalid payload aborts the insert with "muss ein gueltiges
   * JSON-Objekt sein" — which is what made the created path silently end up without its Mirror
   * node.
   */
  @Test
  fun `mirror node params are a valid JSON object`() {
    val json =
        MirrorTriggerPaths.mirrorNodeParams(
            "project-1010",
            MirrorTriggerPaths.SourcePath(
                taskId = 2406L,
                taskName = "Verarbeitungskette 2",
                triggerType = "FC_FORM_SUBMIT_BUTTON",
                triggerName = "btn2.btnWOW",
                triggerParams = """{"button":"btn2"}"""))

    assertTrue(JsonReader.isValidJsonObject(json), "not a valid JSON object: $json")

    val obj = JSON.parseObject(json)
    assertEquals("Mirror", obj.getString("name"))
    assertEquals("project-1010", obj.getString("sourceForm"))
    assertEquals("2406", obj.getString("pathId"))
    assertEquals("Verarbeitungskette 2", obj.getString("pathName"))
    assertTrue(obj.getBooleanValue("autoSync"))
    assertTrue(obj.getBooleanValue("syncEndpoint"))
    assertFalse(obj.getBooleanValue("pauseSync"))
  }

  /**
   * A submit button inside an `XButtonList` keeps its SOURCE name in the mirrored copy (the Mirror
   * only namespaces item `name`s), so the reflected trigger must keep referencing that name —
   * prefixing it would make the trigger never match the click and the form would fall through to
   * the default "submitted successfully" page.
   */
  @Test
  fun `trigger remap prefixes only names that exist namespaced in the reflecting form`() {
    val source =
        MirrorTriggerPaths.SourcePath(
            taskId = 1L,
            taskName = "Pfad",
            triggerType = "FC_FORM_SUBMIT_BUTTON",
            triggerName = "btn2.btnWOW",
            triggerParams = """{"buttonName":"btnWOW","field":"tf1"}""")
    val tokens = setOf("btnWOW", "tf1")

    val remapped =
        MirrorTriggerPaths.remapTriggerParams(source, tokens, "mir1_", setOf("btnWOW", "mir1_tf1"))

    // Compared semantically: the remap re-serializes the JSON document.
    assertEquals(
        JSON.parseObject("""{"buttonName":"btnWOW","field":"mir1_tf1"}"""),
        JSON.parseObject(remapped))
  }

  @Test
  fun `trigger remap keeps a reference that the reflecting form only has unnamespaced`() {
    val source =
        MirrorTriggerPaths.SourcePath(
            taskId = 1L,
            taskName = "Pfad",
            triggerType = "FC_FORM_SUBMIT_BUTTON",
            triggerName = "btn2.btnWOW",
            triggerParams = """{"buttonName":"btnWOW"}""")

    val remapped =
        MirrorTriggerPaths.remapTriggerParams(source, setOf("btnWOW"), "mir1_", setOf("btnWOW"))

    assertEquals("""{"buttonName":"btnWOW"}""", remapped)
  }

  @Test
  fun `trigger remap prefixes the mirrored segments of a qualified name`() {
    val source =
        MirrorTriggerPaths.SourcePath(
            taskId = 1L,
            taskName = "Pfad",
            triggerType = "FC_QUALIFIED_FORM_SUBMIT_BUTTON",
            triggerName = "btn2.btnWOW",
            triggerParams = """{"fieldTechnicalId":"btn2.btnWOW"}""")

    val remapped =
        MirrorTriggerPaths.remapTriggerParams(
            source, setOf("btn2", "btnWOW"), "mir1_", setOf("mir1_btn2", "btnWOW"))

    assertEquals("""{"fieldTechnicalId":"mir1_btn2.btnWOW"}""", remapped)
  }

  /**
   * FORMCYCLE validates the submitted button key (`xf-action`) against the form MODEL and rejects
   * the request otherwise (`Button key <key> not found … was the form submit manipulated?`). The
   * Mirror's copy of an `XButtonList` therefore namespaces its `buttons[].name` entries, and the
   * copied trigger must use the SAME namespaced keys (top-level `name`, `button.name`,
   * `button.qualifier`).
   */
  @Test
  fun `trigger remap namespaces button keys like the mirrored copy does`() {
    val source =
        MirrorTriggerPaths.SourcePath(
            taskId = 1L,
            taskName = "Pfad",
            triggerType = "FC_QUALIFIED_FORM_SUBMIT_BUTTON",
            triggerName = "btn2.btnWOW",
            triggerParams =
                """{"button":{"name":"btnWOW","qualifier":"btn2"},"name":"btnWOW","field":"tf1"}""")

    val remapped =
        MirrorTriggerPaths.remapTriggerParams(
            source,
            setOf("btn2", "btnWOW", "tf1"),
            "mir1_",
            setOf("mir1_btn2", "mir1_btnWOW", "mir1_tf1"))

    assertEquals(
        JSON.parseObject(
            """{"button":{"name":"mir1_btnWOW","qualifier":"mir1_btn2"},"name":"mir1_btnWOW","field":"mir1_tf1"}"""),
        JSON.parseObject(remapped))
  }

  /**
   * A copy that is not namespaced yet (older form) keeps the plain keys, so the click still
   * matches.
   */
  @Test
  fun `trigger remap keeps plain button keys while the copy has no namespace`() {
    val source =
        MirrorTriggerPaths.SourcePath(
            taskId = 1L,
            taskName = "Pfad",
            triggerType = "FC_QUALIFIED_FORM_SUBMIT_BUTTON",
            triggerName = "btn2.btnWOW",
            triggerParams =
                """{"button":{"name":"btnWOW","qualifier":"btn2"},"name":"btnWOW","field":"tf1"}""")

    val remapped =
        MirrorTriggerPaths.remapTriggerParams(
            source, setOf("btn2", "btnWOW", "tf1"), "mir1_", setOf("btn2", "btnWOW", "mir1_tf1"))

    assertEquals(
        JSON.parseObject(
            """{"button":{"name":"btnWOW","qualifier":"btn2"},"name":"btnWOW","field":"mir1_tf1"}"""),
        JSON.parseObject(remapped))
  }

  @Test
  fun `the temporary endpoint of a created path is a terminal endpoint`() {
    // A path that only holds the Mirror node has no endpoint and is reported as invalid by the
    // designer, so createPath appends a temporary FC_RETURN — it must count as a terminal endpoint.
    assertTrue(
        WorkflowLaneMaterializer.isTerminalEndpointType(
            MirrorTriggerPaths.PLACEHOLDER_ENDPOINT_TYPE),
        "the temporary endpoint must be a terminal lane endpoint")
  }

  @Test
  fun `mirror node params escape quotes and backslashes in the path name`() {
    val json =
        MirrorTriggerPaths.mirrorNodeParams(
            "project-1",
            MirrorTriggerPaths.SourcePath(
                taskId = 7L,
                taskName = """Pfad "A" \ B""",
                triggerType = "FC_MANUAL",
                triggerName = "manuell",
                triggerParams = ""))

    assertTrue(JsonReader.isValidJsonObject(json), "not a valid JSON object: $json")
    assertEquals("""Pfad "A" \ B""", JSON.parseObject(json).getString("pathName"))
  }
}
