package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror

import com.google.gson.JsonObject
import org.slf4j.LoggerFactory

/**
 * Builds the `customParameters` JSON of the CodBi workflow **Mirror** node for an AI-generated
 * workflow.
 *
 * The Mirror node (`WorkflowNode.type = "Mirror"`, see `MirrorNodePlugin`) stores the source form
 * (`project-<id>`) and the numeric id of one of that form's workflow paths (`WorkflowTask`). The
 * language model never sees foreign workflow-path ids and it must not invent them, so it emits only
 * what it can actually know:
 * ```
 * {"nodeType":"Mirror","nodeParams":{"sourceForm":"project-<id>"|"<form title>",
 *  "pathName":"<exact name of the source workflow path>", ...}}
 * ```
 *
 * This builder resolves these inputs to the canonical parameter set:
 *
 * | input (any of)                                        | resolved to                    |
 * |-------------------------------------------------------|--------------------------------|
 * | `sourceForm` / `formKey` / `form`                     | `sourceForm` = `project-<id>`  |
 * | `sourceFormName` / `formName` / `formTitle`           | `sourceFormName` = form title  |
 * | `pathId` (numeric)                                    | `pathId` (used as given)       |
 * | `pathName` / `sourcePathName` / `path` / `sourcePath` | `pathId` + `pathName` resolved |
 *
 * Resolution failures never abort the workflow build: the node is written with whatever was
 * resolvable (so the designer shows it and the user can pick the path there) and the problem is
 * logged.
 *
 * @since 1.1.0
 */
object AiMirrorNodeParams {

  private val logger = LoggerFactory.getLogger(AiMirrorNodeParams::class.java)

  /** Registered node type of the CodBi workflow Mirror node. */
  const val NODE_TYPE = "Mirror"

  /** Output modes of the node (see `EMirrorOutputMode`). */
  private const val MODE_SUMMARY = "SUMMARY"
  private const val MODE_NODES = "NODES"

  /**
   * Builds the Mirror node `customParameters` JSON.
   *
   * @param userContext FORMCYCLE user context (may be `null` — then only the given values are
   *   used).
   * @param params the AI's `nodeParams` map (unknown key shapes are tolerated).
   * @param nodeName name of the node as derived by the assistant.
   * @param nodeDescription description of the node as derived by the assistant.
   */
  fun build(
      userContext: Any?,
      params: Map<*, *>,
      nodeName: String?,
      nodeDescription: String?,
  ): String {
    val requestedForm =
        firstString(
            params, "sourceForm", "formKey", "form", "sourceFormKey", "projectName", "project")
    val requestedFormName =
        firstString(
            params, "sourceFormName", "formName", "formTitle", "sourceFormTitle", "projectTitle")
    val requestedPathId = firstString(params, "pathId", "sourcePathId")
    val requestedPathName =
        firstString(params, "pathName", "sourcePathName", "path", "sourcePath", "taskName")

    // 1. Source form: accept a technical key ("project-<id>"), a bare project id or a title.
    val forms = runCatching { MirrorFormAccess.listForms(userContext) }.getOrDefault(emptyList())
    var projectId = MirrorFormAccess.projectIdOf(requestedForm)
    if (projectId == null) {
      projectId =
          runCatching {
                MirrorFormAccess.resolveProjectId(
                    userContext,
                    requestedForm.takeIf { it.isNotBlank() },
                    requestedFormName.takeIf { it.isNotBlank() })
              }
              .getOrNull()
    }
    if (projectId == null) {
      // The model may have written the human title into "sourceForm" (or the key into the name).
      val match =
          matchForm(forms, requestedForm)
              ?: matchForm(forms, requestedFormName)
              ?: matchForm(forms, requestedForm.replace("project-", ""))
      projectId = match?.id
    }
    val formKey =
        when {
          projectId != null -> MirrorFormAccess.formKey(projectId)
          requestedForm.isNotBlank() -> requestedForm
          else -> ""
        }
    val formName =
        forms.firstOrNull { it.key == formKey }?.name?.takeIf { it.isNotBlank() }
            ?: requestedFormName

    // 2. Source workflow path: a numeric id wins, otherwise resolve the NAME against the form's
    //    active workflow version — the model names the path (e.g. "Senden bestaetigen"), never its
    // id.
    var pathId = requestedPathId.trim().toLongOrNull()?.takeIf { it > 0L }
    var pathName = requestedPathName
    if (pathId == null && requestedPathName.isNotBlank() && formKey.isNotBlank()) {
      val paths =
          runCatching { WorkflowMirrorAccess.listPaths(userContext, formKey, formName) }
              .getOrDefault(emptyList())
      val match = matchPath(paths, requestedPathName)
      if (match != null) {
        pathId = match.id
        pathName = match.name
      } else {
        logger.warn(
            "[AiMirrorNodeParams] Mirror node '{}': the source form '{}' has no workflow path " +
                "matching '{}' — the node keeps the name and has no path id",
            nodeName,
            formKey,
            requestedPathName)
      }
    } else if (pathId != null && pathName.isBlank()) {
      // A given id without a name: fill the display name from the source form when possible.
      pathName =
          runCatching { WorkflowMirrorAccess.listPaths(userContext, formKey, formName) }
              .getOrDefault(emptyList())
              .firstOrNull { it.id == pathId }
              ?.name
              .orEmpty()
    }
    if (formKey.isBlank()) {
      logger.warn(
          "[AiMirrorNodeParams] Mirror node '{}': no source form could be resolved from " +
              "'{}' / '{}'",
          nodeName,
          requestedForm,
          requestedFormName)
    }

    val outputMode =
        firstString(params, "outputMode", "mode").trim().uppercase().takeIf {
          it == MODE_SUMMARY || it == MODE_NODES
        } ?: MODE_SUMMARY

    val json = JsonObject()
    json.addProperty("name", nodeName?.takeIf { it.isNotBlank() } ?: NODE_TYPE)
    json.addProperty(
        "description",
        nodeDescription?.takeIf { it.isNotBlank() }
            ?: ("Mirror of " + pathName.ifBlank { formName }.ifBlank { "workflow path" }))
    json.addProperty("sourceForm", formKey)
    json.addProperty("sourceFormName", formName)
    json.addProperty("pathId", pathId?.toString() ?: "")
    json.addProperty("pathName", pathName)
    json.addProperty("outputMode", outputMode)
    json.addProperty("autoSync", flag(params, "autoSync", true))
    json.addProperty("syncEndpoint", flag(params, "syncEndpoint", true))
    json.addProperty("pauseSync", flag(params, "pauseSync", false))

    logger.info(
        "[AiMirrorNodeParams] Mirror node '{}' resolved: sourceForm='{}' ({}) pathId={} path='{}' " +
            "outputMode={}",
        nodeName,
        formKey,
        formName,
        pathId,
        pathName,
        outputMode)
    return json.toString()
  }

  /** Resolves a form by technical key, project id or title (exact, then prefix/contains match). */
  private fun matchForm(
      forms: List<MirrorFormAccess.MirrorForm>,
      wanted: String?,
  ): MirrorFormAccess.MirrorForm? {
    val target = wanted?.trim().orEmpty()
    if (target.isEmpty()) return null
    val lower = target.lowercase()
    return forms.firstOrNull { it.key.equals(target, ignoreCase = true) }
        ?: forms.firstOrNull { it.name.equals(target, ignoreCase = true) }
        ?: forms.firstOrNull { it.name.length >= 4 && it.name.lowercase().contains(lower) }
        ?: forms.firstOrNull { it.name.length >= 4 && lower.contains(it.name.lowercase()) }
  }

  /** Resolves a workflow path by name (exact, then prefix, then contains — case-insensitive). */
  private fun matchPath(
      paths: List<WorkflowMirrorAccess.MirrorPath>,
      wanted: String,
  ): WorkflowMirrorAccess.MirrorPath? {
    val target = wanted.trim()
    if (target.isEmpty()) return null
    val lower = target.lowercase()
    return paths.firstOrNull { it.name.equals(target, ignoreCase = true) }
        ?: paths.firstOrNull { it.name.lowercase().startsWith(lower) }
        ?: paths.firstOrNull { it.name.lowercase().contains(lower) }
        ?: paths.firstOrNull { it.name.length >= 4 && lower.contains(it.name.lowercase()) }
  }

  /** First non-blank string value of [keys] in [params]. */
  private fun firstString(params: Map<*, *>, vararg keys: String): String {
    for (key in keys) {
      val value = params[key] ?: continue
      val text = value.toString().trim()
      if (text.isNotEmpty()) return text
    }
    return ""
  }

  /** Boolean flag that accepts JSON booleans, numbers and the usual textual spellings. */
  private fun flag(params: Map<*, *>, key: String, fallback: Boolean): Boolean =
      when (val value = params[key]) {
        is Boolean -> value
        is Number -> value.toInt() != 0
        is String ->
            when (value.trim().lowercase()) {
              "true",
              "1",
              "yes",
              "ja",
              "on" -> true
              "false",
              "0",
              "no",
              "nein",
              "off" -> false
              else -> fallback
            }
        else -> fallback
      }
}
