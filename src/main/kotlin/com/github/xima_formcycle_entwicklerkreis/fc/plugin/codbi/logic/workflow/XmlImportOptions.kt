package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.workflow

import com.alibaba.fastjson.JSONArray
import com.alibaba.fastjson.JSONObject
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.MirrorFormAccess
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.WorkflowMirrorAccess
import java.util.UUID
import org.slf4j.LoggerFactory

/**
 * Supplies the option lists behind the **cbXMLAutoImport** designer view.
 *
 * The lists are exposed through the plugin servlet so the properties view needs no JSF backing
 * bean. Every method answers with `[{"value":"…","label":"…"}]`:
 * - [uploads] — file-upload elements of the form, `value` = technical element name,
 * - [resources] — files of the form's file management (`ProjektRessource`), `value` = uuid,
 * - [nodes] — workflow nodes of the active workflow version that can produce a file, `value` = node
 *   uuid,
 * - [fields] — form elements that can hold an imported value (used by the "Nicht zu setzende Werte"
 *   select), `value` = technical element name.
 *
 * @since 1.1.0
 */
object XmlImportOptions {

  /** Actions served by this object. */
  val ACTIONS: Set<String> = setOf("uploads", "resources", "nodes", "fields")

  /** File-upload elements of the form (`XUpload` and every plugin upload widget). */
  fun uploads(userContext: Any?, projectId: Long?): String {
    if (projectId == null) return "[]"
    val array = JSONArray()
    for (element in MirrorFormAccess.listElements(userContext, "project-$projectId")) {
      // `XUpload` is the standard file-upload widget; other installations name it differently
      // (`XFileUpload`, `XUploadArea`, …), so the class name is matched loosely.
      if (!element.className.contains(UPLOAD_MARKER, ignoreCase = true)) continue
      array.add(entry(element.name, label(element.label, element.name)))
    }
    logger.debug("[XmlImportOptions] uploads for project {} -> {}", projectId, array.size)
    return array.toJSONString()
  }

  /** Files of the form's file management as `value = resource uuid`. */
  fun resources(userContext: Any?, projectId: Long?): String {
    if (projectId == null) return "[]"
    val em = WorkflowMirrorAccess.entityManager(userContext) ?: return "[]"
    try {
      for (jpql in RESOURCE_QUERIES) {
        val rows = WorkflowMirrorAccess.query(em, jpql, mapOf("pid" to projectId))
        if (rows.isEmpty()) continue
        val array = JSONArray()
        for (row in rows) {
          if (row == null) continue
          val name = resourceName(row) ?: continue
          val uuid = resourceUuid(row) ?: continue
          array.add(entry(uuid, label(name, uuid)))
        }
        if (array.isNotEmpty()) {
          logger.debug("[XmlImportOptions] resources for project {} -> {}", projectId, array.size)
          return array.toJSONString()
        }
      }
      return "[]"
    } finally {
      WorkflowMirrorAccess.closeQuietly(em)
    }
  }

  /** Nodes of the active workflow version that can produce a file as `value = node uuid`. */
  fun nodes(userContext: Any?, projectId: Long?): String {
    if (projectId == null) return "[]"
    val em = WorkflowMirrorAccess.entityManager(userContext) ?: return "[]"
    try {
      val versionId =
          WorkflowMirrorAccess.query(em, ACTIVE_VERSION_QUERY, mapOf("pid" to projectId))
              .firstOrNull()
              ?.let { (it as? Number)?.toLong() }
              ?.takeIf { it > 0L }
              ?: WorkflowMirrorAccess.query(em, NEWEST_VERSION_QUERY, mapOf("pid" to projectId))
                  .firstOrNull()
                  ?.let { (it as? Number)?.toLong() }
              ?: return "[]"
      val taskIds =
          WorkflowMirrorAccess.query(em, TASKS_QUERY, mapOf("vid" to versionId)).mapNotNull {
            (it as? Number)?.toLong()
          }
      val all = JSONArray()
      val fileProducers = JSONArray()
      for (taskId in taskIds) {
        for (row in WorkflowMirrorAccess.query(em, NODES_QUERY, mapOf("tid" to taskId))) {
          val cols = row as? Array<*> ?: continue
          val uuid = cols.getOrNull(0)?.toString()?.takeIf { it.isNotBlank() } ?: continue
          val name = cols.getOrNull(1)?.toString().orEmpty()
          val type = cols.getOrNull(2)?.toString().orEmpty()
          val item = entry(uuid, label(name.ifBlank { type }, type))
          all.add(item)
          if (looksLikeFileProducer(type)) fileProducers.add(item)
        }
      }
      val result = if (fileProducers.isNotEmpty()) fileProducers else all
      logger.debug(
          "[XmlImportOptions] nodes for project {} (version {}) -> {} of {}",
          projectId,
          versionId,
          result.size,
          all.size)
      return result.toJSONString()
    } finally {
      WorkflowMirrorAccess.closeQuietly(em)
    }
  }

  /**
   * Form elements that can hold an imported VALUE as `value = technical name` — used by the "Nicht
   * zu setzende Werte" select. Layout elements, containers and file uploads are omitted: they have
   * no value to restore.
   */
  fun fields(userContext: Any?, projectId: Long?): String {
    if (projectId == null) return "[]"
    val array = JSONArray()
    for (element in MirrorFormAccess.listElements(userContext, "project-$projectId")) {
      if (element.name.isBlank()) continue
      if (!isFillable(element.className)) continue
      array.add(entry(element.name, label(element.label, element.name)))
    }
    logger.debug("[XmlImportOptions] fields for project {} -> {}", projectId, array.size)
    return array.toJSONString()
  }

  /** Dispatches one of [ACTIONS]; `null` when the action is not handled here. */
  fun build(action: String, userContext: Any?, projectId: Long?): String? =
      when (action) {
        "uploads" -> uploads(userContext, projectId)
        "resources" -> resources(userContext, projectId)
        "nodes" -> nodes(userContext, projectId)
        "fields" -> fields(userContext, projectId)
        else -> null
      }

  // region Helpers

  private fun entry(value: String, label: String): JSONObject =
      JSONObject().fluentPut("value", value).fluentPut("label", label)

  /**
   * Builds the display label of an option. Element labels are rich text in FORMCYCLE — they often
   * contain paragraph/strong markup or non-breaking-space entities — which must never leak into a
   * `<select><option>`.
   */
  private fun label(name: String, detail: String): String {
    val cleanName = plainText(name)
    val cleanDetail = plainText(detail)
    return when {
      cleanName.isBlank() -> cleanDetail
      cleanDetail.isBlank() || cleanName == cleanDetail -> cleanName
      else -> "$cleanName ($cleanDetail)"
    }
  }

  /** Removes HTML markup/entities and collapses whitespace — safe for option labels. */
  internal fun plainText(value: String): String {
    var text = value.replace(HTML_TAG_PATTERN, " ")
    for ((entity, replacement) in ENTITIES) {
      text = text.replace(entity, replacement)
    }
    return text.replace(WHITESPACE_PATTERN, " ").trim()
  }

  /** `true` for node types whose output is a file the following nodes can read. */
  private fun looksLikeFileProducer(type: String): Boolean {
    val upper = type.uppercase()
    if (FILE_NODE_TYPES.contains(upper)) return true
    return FILE_NODE_MARKERS.any { upper.contains(it) }
  }

  /**
   * `true` when a widget class can carry an imported value. Buttons, links, uploads and every
   * layout/static widget are excluded by CLASS-NAME MARKER (not by an exact-name list), so this
   * also covers plugin widgets such as `XActionButton` or `XLinkButton`.
   */
  internal fun isFillable(className: String): Boolean {
    val name = className.trim().lowercase()
    if (name.isEmpty()) return false
    return NON_FILLABLE_MARKERS.none { name.contains(it) }
  }

  /** Human readable resource name (getter names differ between FORMCYCLE versions). */
  private fun resourceName(row: Any): String? {
    for (getter in listOf("getName", "getUploadFileName", "getFilename", "getDateiname")) {
      val value = runCatching { row.javaClass.getMethod(getter).invoke(row) as? String }.getOrNull()
      if (!value.isNullOrBlank()) return value
    }
    return null
  }

  /** UUID of a file resource (prefers the UUID object, falls back to the id). */
  private fun resourceUuid(row: Any): String? =
      runCatching { row.javaClass.getMethod("getUUIDObject").invoke(row) as? UUID }
          .getOrNull()
          ?.toString()
          ?: runCatching { row.javaClass.getMethod("getUuid").invoke(row)?.toString() }.getOrNull()
          ?: runCatching { row.javaClass.getMethod("getId").invoke(row)?.toString() }.getOrNull()

  // endregion Helpers

  private const val UPLOAD_MARKER = "upload"

  /** Anything that looks like an HTML/XML tag. */
  private val HTML_TAG_PATTERN = Regex("<[^>]*>")

  /** Runs of whitespace (including the ones produced by stripping tags). */
  private val WHITESPACE_PATTERN = Regex("\\s+")

  /**
   * Named HTML entities that element labels actually contain. Built by concatenation so this source
   * file never contains the literal entity sequences.
   */
  private val ENTITIES: List<Pair<String, String>> =
      listOf(
          ("&" + "nbsp;") to " ",
          ("&" + "amp;") to "&",
          ("&" + "lt;") to "<",
          ("&" + "gt;") to ">",
          ("&" + "quot;") to "\"",
          ("&" + "#39;") to "'")

  /** `ProjektRessource` queries — the owning association is named differently across versions. */
  private val RESOURCE_QUERIES =
      listOf(
          "SELECT r FROM de.xima.fc.entities.ProjektRessource r WHERE r.projekt.id = :pid",
          "SELECT r FROM de.xima.fc.entities.ProjektRessource r WHERE r.project.id = :pid")

  /** Active `WorkflowVersion` of a project. */
  private const val ACTIVE_VERSION_QUERY =
      "SELECT p.activeWorkflowVersion.id FROM de.xima.fc.entities.Projekt p WHERE p.id = :pid"

  /** Newest `WorkflowVersion` of a project (fallback when none is marked active). */
  private const val NEWEST_VERSION_QUERY =
      "SELECT wv.id FROM de.xima.fc.entities.Projekt p JOIN p.workflowVersions wv " +
          "WHERE p.id = :pid ORDER BY wv.versionNumber DESC"

  /** Workflow paths (tasks) of a version. */
  private const val TASKS_QUERY =
      "SELECT t.id FROM de.xima.fc.entities.WorkflowTask t " +
          "JOIN t.process p JOIN p.version v WHERE v.id = :vid"

  /** Nodes of one workflow path: uuid, name, type. */
  private const val NODES_QUERY =
      "SELECT n.uuid, n.name, n.type FROM de.xima.fc.entities.WorkflowNode n WHERE n.task.id = :tid"

  /** Node types that definitely produce a file. */
  private val FILE_NODE_TYPES =
      setOf(
          "FC_EXPORT_TO_XML",
          "FC_FILL_PDF",
          "FC_FILL_WORD",
          "FC_CREATE_TEXT_FILE",
          "FC_COMPRESS_AS_ZIP",
          "FC_PROVIDE_RESOURCE",
          "FC_ENCODE_BASE64")

  /** Type name fragments that mark a file producer (covers plugin nodes as well). */
  private val FILE_NODE_MARKERS = listOf("FILE", "PDF", "WORD", "XML", "ZIP")

  /**
   * Class-name fragments of widgets that must NOT be offered as an import target: buttons/links
   * (they have no value), uploads (a file, not a value), containers/pages and layout/static
   * elements. Matching by fragment also covers plugin widgets.
   */
  private val NON_FILLABLE_MARKERS =
      listOf(
          "button",
          "submit",
          "link",
          "upload",
          "page",
          "fieldset",
          "container",
          "header",
          "footer",
          "content",
          "html",
          "image",
          "spacer",
          "line",
          "separator",
          "anchor",
          "navigation",
          "languageswitch",
          "captcha")

  private val logger = LoggerFactory.getLogger(XmlImportOptions::class.java)
}
