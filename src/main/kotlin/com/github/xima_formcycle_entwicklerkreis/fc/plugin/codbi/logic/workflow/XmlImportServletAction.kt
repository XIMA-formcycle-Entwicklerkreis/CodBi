package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.workflow

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.MirrorFormAccess
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.XML_IMPORT_SERVLET_ACTION_NAME
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import org.slf4j.LoggerFactory

/**
 * Servlet action behind the designer view of the **cbXMLAutoImport** node. It answers the option
 * lists for the source pickers (`uploads`, `resources`, `nodes`) and for the "Nicht zu setzende
 * Werte" select (`fields`) — see [XmlImportOptions] for the payload.
 *
 * The same actions are ALSO served by the CodBi Mirror action, so the designer view keeps working
 * even when only that action is registered; the view therefore talks to `CodBi_Mirror` by default.
 *
 * @since 1.1.0
 */
class XmlImportServletAction : IPluginServletAction {

  override fun getName(): String = XML_IMPORT_SERVLET_ACTION_NAME

  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val action = params.requestParameters["action"]?.firstOrNull()?.trim()?.lowercase().orEmpty()
    val projectId = projectId(params)
    val userContext = MirrorFormAccess.userContextFor(backendUser(params))
    logger.debug(
        "[XmlImportServletAction] action='{}' projectId={} userContextPresent={}",
        action,
        projectId,
        userContext != null)
    if (projectId == null) {
      logger.warn(
          "[XmlImportServletAction] action='{}' without a project id — check the designer view's " +
              "data-project-id (request params: {})",
          action,
          params.requestParameters.keys)
    }
    return try {
      val json = XmlImportOptions.build(action, userContext, projectId)
      if (json == null) logger.warn("[XmlImportServletAction] unknown action '{}'", action)
      jsonResponse(json ?: "[]")
    } catch (x: Exception) {
      logger.warn("[XmlImportServletAction] action '{}' failed: {}", action, x.message, x)
      jsonResponse("[]")
    }
  }

  /** Reads the project id from `project=project-7` / `form=project-7` / `projectId=7`. */
  private fun projectId(params: IPluginServletActionParams): Long? {
    val raw =
        params.requestParameters["project"]?.firstOrNull()
            ?: params.requestParameters["form"]?.firstOrNull()
            ?: params.requestParameters["projectId"]?.firstOrNull()
            ?: params.requestParameters["formId"]?.firstOrNull()
            ?: return null
    return raw.trim().replace(PREFIX_PATTERN, "").toLongOrNull()
  }

  /** Backend user of the current request (`IPluginServletActionParams.getBenutzer`). */
  private fun backendUser(params: IPluginServletActionParams): Any? =
      runCatching { params.javaClass.getMethod("getBenutzer").invoke(params) }.getOrNull()

  private fun jsonResponse(json: String): IPluginServletActionRetVal =
      PluginServletActionRetVal(ServletResponse(EResponseType.JSON, json))

  private companion object {
    /** Strips a `project-` / `project_` prefix from a project/form key. */
    val PREFIX_PATTERN = Regex("^project[-_]?", RegexOption.IGNORE_CASE)

    val logger = LoggerFactory.getLogger(XmlImportServletAction::class.java)
  }
}
