package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.alibaba.fastjson.JSON
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.MirrorFormAccess
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.MirrorTriggerPaths
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.WorkflowLaneMaterializer
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants
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
  fun `content revision changes when the external access flag of a referenced status changes`() {
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
            sourceStatesByUuid = mapOf("state-uuid" to "Gesendet"),
            sourceStatesExternalAccess = mapOf("state-uuid" to true))

    assertEquals(
        WorkflowLaneMaterializer.contentRevision(base),
        WorkflowLaneMaterializer.contentRevision(base.copy()),
        "an unchanged lane must keep its revision")
    assertNotEquals(
        WorkflowLaneMaterializer.contentRevision(base),
        WorkflowLaneMaterializer.contentRevision(
            base.copy(sourceStatesExternalAccess = mapOf("state-uuid" to false))),
        "toggling external access on the referenced status must change the revision")
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
   * The OWNERSHIP proof used to decide whether a reflecting path already exists is the `Mirror`
   * node inside it: its params name the source path. That is version independent — it keeps working
   * when `WorkflowTask.description` (the older, marker-based proof) does not survive the entity
   * create, which is what made the widget create a fresh set of paths on every re-selection ("3
   * become 6").
   */
  @Test
  fun `mirror node params name the source path they mirror`() {
    val json =
        MirrorTriggerPaths.mirrorNodeParams(
            "project-1010",
            MirrorTriggerPaths.SourcePath(
                taskId = 2406L,
                taskName = "Verarbeitungskette 2",
                triggerType = "FC_FORM_SUBMIT_BUTTON",
                triggerName = "btn2.btnWOW",
                triggerParams = """{"button":"btn2"}"""))

    assertEquals(
        "project-1010#2406",
        MirrorTriggerPaths.mirrorSourceKeyOf(json),
        "the created Mirror node must identify exactly the source path it mirrors")
  }

  /** A node without a usable source reference must not claim any source path. */
  @Test
  fun `mirror node params without a source path claim nothing`() {
    assertNull(MirrorTriggerPaths.mirrorSourceKeyOf("{}"))
    assertNull(MirrorTriggerPaths.mirrorSourceKeyOf("""{"sourceForm":"project-1"}"""))
    assertNull(MirrorTriggerPaths.mirrorSourceKeyOf("""{"pathId":"7"}"""))
    assertNull(MirrorTriggerPaths.mirrorSourceKeyOf("not json"))
  }

  /** The description marker (legacy proof) is parsed back into the same source key. */
  @Test
  fun `ownership marker names its source path`() {
    assertEquals(
        "project-3406#3652",
        MirrorTriggerPaths.sourceKeyOfMarker("[CodBi Mirror] source=project-3406#3652"))
    assertNull(MirrorTriggerPaths.sourceKeyOfMarker("a path the user created"))
    assertNull(MirrorTriggerPaths.sourceKeyOfMarker("[CodBi Mirror] temporary endpoint"))
  }

  /**
   * A reflected workflow path is a COPY of the source path, but node parameters reference FORM
   * ELEMENTS by technical id/name — e.g. `FC_IMPORT_FORM_VALUE_FROM_XML` keeps its “XML-Quelle” in
   * `xmlSource.resource.identifier` and its target fields in `xpathMapping[].name`. Copied verbatim
   * those keep naming an element that exists only in the SOURCE form, which is why the reflected
   * node showed an EMPTY element picker. They must be re-pointed at the mirrored copies.
   */
  @Test
  fun `parameter remap re-points form element references at the mirrored copies`() {
    val sourceParams =
        """{"xmlSource":{"resource":{"type":"UPLOAD","identifier":"upl1"}},""" +
            """"xpathMapping":[{"name":"tfName","value":"/a/b"}]}"""
    val elementRefs =
        mapOf("upl1" to "mir1_upl1", "xi-upl-1" to "xi-upl-4", "tfName" to "mir1_tfName")

    val (remapped, _) =
        WorkflowLaneMaterializer.remapParams(
            null, null, emptyMap(), emptyMap(), emptyMap(), sourceParams, elementRefs)

    val obj = JSON.parseObject(remapped)
    assertEquals(
        "mir1_upl1",
        obj.getJSONObject("xmlSource").getJSONObject("resource").getString("identifier"),
        "the XML source must name the MIRRORED upload field")
    assertEquals(
        "mir1_tfName",
        obj.getJSONArray("xpathMapping").getJSONObject(0).getString("name"),
        "the xpath target field must name the MIRRORED field")
  }

  /** `[%field%]` placeholders inside a copied node's strings follow the mirrored name as well. */
  @Test
  fun `parameter remap rewrites field placeholders to the mirrored names`() {
    val (remapped, _) =
        WorkflowLaneMaterializer.remapParams(
            null,
            null,
            emptyMap(),
            emptyMap(),
            emptyMap(),
            """{"body":"<p>[%tfName%] / [%unknownField%]</p>"}""",
            mapOf("tfName" to "mir1_tfName"))

    assertTrue(remapped.contains("[%mir1_tfName%]"), remapped)
    assertTrue(
        remapped.contains("[%unknownField%]"), "an unreferenced placeholder must stay intact")
  }

  /** A field OUTSIDE the mirrored element has no copy and must keep its source reference. */
  @Test
  fun `parameter remap leaves references without a mirrored copy untouched`() {
    val (remapped, _) =
        WorkflowLaneMaterializer.remapParams(
            null,
            null,
            emptyMap(),
            emptyMap(),
            emptyMap(),
            """{"uploadField":"uplOutside"}""",
            mapOf("upl1" to "mir1_upl1"))

    assertTrue(remapped.contains("\"uplOutside\""), remapped)
  }

  /**
   * A `FC_QUALIFIED_FORM_SUBMIT_BUTTON` may name its button list by the element's INTERNAL id
   * (`xi-btn-5`) — which a multi-button `XButton` trigger does. The mirrored copy is always named
   * `<mirrorName>_<TECHNICAL NAME>`, so prefixing the id produced a reference that exists nowhere:
   * the reflected trigger showed no button selected and never fired.
   */
  @Test
  fun `trigger remap translates an element id reference to the mirrored name`() {
    val source =
        MirrorTriggerPaths.SourcePath(
            taskId = 7L,
            taskName = "Zwei Buttons",
            triggerType = "FC_QUALIFIED_FORM_SUBMIT_BUTTON",
            triggerName = "xi-btn-5.btnA",
            triggerParams = """{"button":{"name":"btnA","qualifier":"xi-btn-5"}}""")

    val remapped =
        MirrorTriggerPaths.remapTriggerParams(
            source,
            setOf("xi-div-6", "xi-btn-5", "btnA", "btnB"),
            "mir3_",
            emptySet(),
            emptyMap(),
            mapOf("xi-btn-5" to "btnList7"))

    val button = JSON.parseObject(remapped).getJSONObject("button")
    assertEquals("mir3_btnList7", button.getString("qualifier"), remapped)
    assertEquals("mir3_btnA", button.getString("name"), remapped)
  }

  /** A reference whose mirrored COPY already exists is taken from the copy verbatim. */
  @Test
  fun `trigger remap prefers the mirrored copy of a reference`() {
    val source =
        MirrorTriggerPaths.SourcePath(
            taskId = 7L,
            taskName = "Zwei Buttons",
            triggerType = "FC_QUALIFIED_FORM_SUBMIT_BUTTON",
            triggerName = "btnList7.btnA",
            triggerParams = """{"button":{"name":"btnA","qualifier":"btnList7"}}""")

    val remapped =
        MirrorTriggerPaths.remapTriggerParams(
            source,
            setOf("btnList7", "btnA"),
            "mir3_",
            setOf("mir3_btnList7", "mir3_btnA"),
            mapOf("btnList7" to "mir3_btnList7", "btnA" to "mir3_btnA"))

    val button = JSON.parseObject(remapped).getJSONObject("button")
    assertEquals("mir3_btnList7", button.getString("qualifier"), remapped)
    assertEquals("mir3_btnA", button.getString("name"), remapped)
  }

  /** An id without a known technical name is left alone instead of becoming a bogus name. */
  @Test
  fun `trigger remap keeps an unresolvable element id unchanged`() {
    val source =
        MirrorTriggerPaths.SourcePath(
            taskId = 7L,
            taskName = "Fremd",
            triggerType = "FC_FORM_SUBMIT_BUTTON",
            triggerName = "btnX",
            triggerParams = """{"buttonName":"xi-unknown"}""")

    val remapped =
        MirrorTriggerPaths.remapTriggerParams(
            source, setOf("xi-unknown"), "mir3_", emptySet(), emptyMap(), emptyMap())

    assertEquals("""{"buttonName":"xi-unknown"}""", remapped)
  }

  /**
   * The property the widget stores its created-path references under must have a REAL name. It used
   * to be read through a constants key that did not exist in `constants.properties`, so the
   * designer persisted the array under the literal key `undefined` — unreadable for the server-side
   * sync that the source save runs.
   */
  @Test
  fun `the triggered-path reference property is a real constant`() {
    assertEquals("codbi_mirror_triggered_refs", Constants.MIRROR_PROPERTY_TRIGGERED_REFS)
    assertEquals(
        "codbi_mirror_create_triggered_paths", Constants.MIRROR_PROPERTY_CREATE_TRIGGERED_PATHS)
    assertEquals("codbi_mirror_form", Constants.MIRROR_PROPERTY_FORM)
  }

  /**
   * Creating the opt-in paths from a source save needs a source project — never loops on garbage.
   */
  @Test
  fun `ensuring triggered paths needs a source project`() {
    assertEquals(
        "SKIPPED:invalid-source", MirrorTriggerPaths.ensureTriggeredPathsForSourceProject(null, 0L))
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

  /**
   * The event engine never SCANS all triggers: it queries them by the search terms the trigger
   * handler filters for (`buttonName` / `buttonQualifier`). A reflected trigger without those rows
   * is never a candidate, so the click is accepted but no workflow path runs.
   */
  @Test
  fun `qualified submit trigger needs button name and qualifier search terms`() {
    val terms =
        MirrorTriggerPaths.triggerSearchTerms(
            "FC_QUALIFIED_FORM_SUBMIT_BUTTON",
            """{"button":{"qualifier":"mir1_btn2","name":"mir1_btnWOW"},"name":"mir1_btnWOW"}""")

    assertEquals(listOf("buttonName" to "mir1_btnWOW", "buttonQualifier" to "mir1_btn2"), terms)
  }

  @Test
  fun `plain submit trigger needs only the button name and other types need none`() {
    assertEquals(
        listOf("buttonName" to "btnWOW"),
        MirrorTriggerPaths.triggerSearchTerms(
            "FC_FORM_SUBMIT_BUTTON", """{"buttonName":"btnWOW"}"""))
    assertTrue(
        MirrorTriggerPaths.triggerSearchTerms("FC_MANUAL", """{"name":"manuell"}""").isEmpty(),
        "a manual trigger is not looked up by a button search term")
  }

  /**
   * The live-rendered mirrored subtree must carry the NAMESPACED names already in its MODEL:
   * FORMCYCLE registers a button list's submit buttons in the form request session while the item
   * renders, keyed by `Pair(buttonListName, buttonName)`, and rejects a submit whose key is missing
   * there ("Button key … not found in current form request session - was the form submit
   * manipulated?"). Prefixing only the emitted markup is therefore not enough.
   */
  @Test
  fun `namespacing an element names its items and button entries in the model`() {
    val form =
        JSON.parseObject(
            """
            {"items":[
              {"className":"XFieldSet","properties":{"id":"xi-fs-2","name":"fs2",
                "elements":["xi-btn2","xi-tf"]}},
              {"className":"XButtonList","properties":{"id":"xi-btn2","name":"btn2",
                "parentid":"xi-fs-2","buttons":[{"name":"btnWOW","value":"-1"}]}},
              {"className":"XTextField","properties":{"id":"xi-tf","name":"tf1",
                "parentid":"xi-fs-2"}}
            ]}
            """
                .trimIndent())

    assertTrue(MirrorFormAccess.namespaceElementNames(form, "xi-fs-2", "mir1_"))

    val items = form.getJSONArray("items")
    val names = (0 until items.size).map { items.getJSONObject(it).getJSONObject("properties") }
    assertEquals("mir1_fs2", names[0].getString("name"))
    assertEquals("mir1_btn2", names[1].getString("name"))
    assertEquals("mir1_tf1", names[2].getString("name"))
    // ids stay untouched — the persisted copies, the `data-xm-appendable` marker and the namespaced
    // validation model refer to them.
    assertEquals("xi-btn2", names[1].getString("id"))
    assertEquals("xi-fs-2", names[1].getString("parentid"))
    // A button entry is not an item, so its key needs the prefix explicitly: this IS the key
    // FORMCYCLE validates the click against.
    assertEquals("mir1_btnWOW", names[1].getJSONArray("buttons").getJSONObject(0).getString("name"))
  }

  @Test
  fun `namespacing an element follows name based parent references`() {
    val form =
        JSON.parseObject(
            """
            {"items":[
              {"className":"XFieldSet","properties":{"id":"xi-fs-2","name":"fs2"}},
              {"className":"XTextField","properties":{"id":"xi-tf","name":"tf1","parentid":"fs2"}}
            ]}
            """
                .trimIndent())

    assertTrue(MirrorFormAccess.namespaceElementNames(form, "xi-fs-2", "mir1_"))

    val child = form.getJSONArray("items").getJSONObject(1).getJSONObject("properties")
    assertEquals("mir1_tf1", child.getString("name"))
    assertEquals("mir1_fs2", child.getString("parentid"))
  }

  @Test
  fun `namespacing an element is idempotent and ignores a blank prefix`() {
    val form =
        JSON.parseObject(
            """{"items":[{"className":"XTextField","properties":{"id":"xi-tf","name":"tf1"}}]}""")

    assertFalse(MirrorFormAccess.namespaceElementNames(form, "xi-tf", " "))
    assertTrue(MirrorFormAccess.namespaceElementNames(form, "xi-tf", "mir1_"))
    assertFalse(
        MirrorFormAccess.namespaceElementNames(form, "xi-tf", "mir1_"),
        "a second pass must not double the prefix")
    assertEquals(
        "mir1_tf1",
        form.getJSONArray("items").getJSONObject(0).getJSONObject("properties").getString("name"))
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
