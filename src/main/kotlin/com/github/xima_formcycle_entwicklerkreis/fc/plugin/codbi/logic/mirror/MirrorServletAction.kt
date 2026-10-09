package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror

import com.alibaba.fastjson.JSONArray
import com.alibaba.fastjson.JSONObject
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.MIRROR_SERVLET_ACTION_NAME
import de.xima.fc.form.common.models.XForm
import de.xima.fc.form.common.models.XFormRenderConfig
import de.xima.fc.form.common.models.XFormRenderContext
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import org.slf4j.LoggerFactory

/**
 * Servlet action that exposes the cross-form element access of [MirrorFormAccess] to the browser.
 *
 * It is used by
 * - the form designer, to populate the Mirror widget's “source form” / “source element” dropdowns
 *   (`action=forms`, `action=elements&form=<formKey>`), and
 * - (indirectly) the assistant, through [MirrorFormAccess].
 *
 * Endpoint: `plugin?name=CodBi_Mirror&action=…`.
 *
 * @since 1.0.0
 */
class MirrorServletAction : IPluginServletAction {

  private companion object {
    /**
     * FORMCYCLE frontend form THEME CSS resources (in the `fc-form-renderer` jar). Served verbatim
     * so the element preview is styled like a published form.
     */
    val THEME_CSS_PATHS =
        listOf(
            "de/xima/fc/form/renderer/themes/classic/030-default.css",
            "de/xima/fc/form/renderer/themes/classic/030-default-template.css",
            "de/xima/fc/form/renderer/themes/modern/031-extended.css",
            "de/xima/fc/form/renderer/themes/modern/031-extended-template.css")
  }

  private val logger = LoggerFactory.getLogger(MirrorServletAction::class.java)

  override fun getName(): String = MIRROR_SERVLET_ACTION_NAME

  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val action = params.requestParameters["action"]?.firstOrNull()?.trim()?.lowercase().orEmpty()
    val benutzer = backendUser(params)
    val userContext = MirrorFormAccess.userContextFor(benutzer)
    logger.info(
        "[MirrorServletAction] action='{}' benutzer={} userContext={} formParam='{}'",
        action.ifBlank { "forms" },
        benutzer?.javaClass?.name ?: "null",
        userContext?.javaClass?.name ?: "null",
        params.requestParameters["form"]?.firstOrNull() ?: "")
    return try {
      when (action) {
        "elements" -> {
          val json = elementsJson(userContext, params)
          logger.info("[MirrorServletAction] action='elements' -> {} chars", json.length)
          jsonResponse(json)
        }
        "fields" -> {
          val json = fieldsJson(userContext, params)
          logger.info("[MirrorServletAction] action='fields' -> {} chars", json.length)
          jsonResponse(json)
        }
        "tree" -> {
          val json = treeJson(userContext, params)
          logger.info("[MirrorServletAction] action='tree' -> {} chars", json.length)
          jsonResponse(json)
        }
        "version" -> {
          val json = versionJson(userContext, params)
          logger.info("[MirrorServletAction] action='version' -> {}", json)
          jsonResponse(json)
        }
        "preview" -> htmlResponse(previewHtml(userContext, params))
        "css" -> htmlResponse(formCss(userContext, params))
        "wrapper" ->
            htmlResponse(
                MirrorFormAccess.formRootClasses(
                    userContext, params.requestParameters["form"]?.firstOrNull()))
        else -> {
          val json = formsJson(userContext, params)
          logger.info("[MirrorServletAction] action='forms' -> {} chars", json.length)
          jsonResponse(json)
        }
      }
    } catch (x: Exception) {
      logger.warn("[MirrorServletAction] action '{}' failed: {}", action, x.message, x)
      jsonResponse("[]")
    }
  }

  /**
   * Returns just the latest form version id of a form (`form` request param) as `{"version":
   * <id>}`. Used by the designer to detect that a Mirror's source form changed since the Mirror was
   * last synchronized, and to refresh it.
   */
  private fun versionJson(userContext: Any?, params: IPluginServletActionParams): String {
    val formKey = params.requestParameters["form"]?.firstOrNull()
    return JSONObject()
        .fluentPut("version", MirrorFormAccess.latestVersionId(userContext, formKey))
        .fluentPut("revision", MirrorFormAccess.formRevision(userContext, formKey))
        .toJSONString()
  }

  /**
   * Renders the referenced element of a foreign form the way the designer preview would, using a
   * minimal [XFormRenderConfig]/[XFormRenderContext]. Returns "" when the reference is incomplete
   * or the element cannot be rendered.
   */
  private fun previewHtml(userContext: Any?, params: IPluginServletActionParams): String {
    val formKey = params.requestParameters["form"]?.firstOrNull()
    val elementRef = params.requestParameters["element"]?.firstOrNull()
    if (formKey.isNullOrBlank() || elementRef.isNullOrBlank()) return ""
    return try {
      val config =
          XFormRenderConfig().apply {
            setDesignerPreview(true)
            setFormOnly(true)
            setProjektID(MirrorFormAccess.projectIdOf(formKey) ?: 0L)
          }
      MirrorFormAccess.renderElementHtml(
          userContext, formKey, elementRef, config, XFormRenderContext()) ?: ""
    } catch (x: Exception) {
      logger.warn("[MirrorServletAction] preview render failed: {}", x.message)
      ""
    }
  }

  private fun formsJson(userContext: Any?, params: IPluginServletActionParams): String {
    val array = JSONArray()
    for (form in MirrorFormAccess.listForms(userContext)) {
      array.add(
          JSONObject()
              .fluentPut("id", form.id)
              .fluentPut("key", form.key)
              .fluentPut("name", form.name))
    }
    return array.toJSONString()
  }

  private fun elementsJson(userContext: Any?, params: IPluginServletActionParams): String {
    val formKey = params.requestParameters["form"]?.firstOrNull()
    return MirrorFormAccess.elementsTreeAsJson(MirrorFormAccess.listElements(userContext, formKey))
  }

  /**
   * Lists the VALUE-ABLE sub-fields of a single source element (`form`, `element` request params).
   * The designer uses this to materialize the source element as real child items of the Mirror with
   * their native field names, so the values they submit become usable as `[%fieldName%]`
   * placeholders and the fields appear in the placeholder dialog.
   *
   * Each entry also carries the source field's `properties`, so the child item is created with the
   * source field's label, options, placeholder, required flag, etc. — i.e. it looks and behaves
   * like the source field instead of falling back to the widget defaults.
   */
  private fun fieldsJson(userContext: Any?, params: IPluginServletActionParams): String {
    val formKey = params.requestParameters["form"]?.firstOrNull()
    val elementRef = params.requestParameters["element"]?.firstOrNull()
    val array = JSONArray()
    for (field in MirrorFormAccess.valueAbleFields(userContext, formKey, elementRef)) {
      array.add(
          JSONObject()
              .fluentPut("id", field.id)
              .fluentPut("name", field.name)
              .fluentPut("label", field.label)
              .fluentPut("className", field.className)
              .fluentPut("properties", field.properties))
    }
    return array.toJSONString()
  }

  /**
   * Returns the FULL subtree of a single source element (`form`, `element` request params) as `{
   * "version": <source form version>, "items": [ { ref, parentRef, name, className, properties } ]
   * }`.
   *
   * The designer materializes every node as a real item, preserving the `parentRef` nesting, so the
   * Mirror reproduces the source element's structure (containers/fieldsets included). `version`
   * lets the designer detect that the source changed and refresh a stale Mirror.
   */
  private fun treeJson(userContext: Any?, params: IPluginServletActionParams): String {
    val formKey = params.requestParameters["form"]?.firstOrNull()
    val elementRef = params.requestParameters["element"]?.firstOrNull()
    val subtree = MirrorFormAccess.mirrorSubtree(userContext, formKey, elementRef)
    if (subtree == null) {
      return "{\"version\":0,\"items\":[]}"
    }
    val items = JSONArray()
    for (node in subtree.nodes) {
      items.add(
          JSONObject()
              .fluentPut("ref", node.ref)
              .fluentPut("parentRef", node.parentRef)
              .fluentPut("name", node.name)
              .fluentPut("className", node.className)
              .fluentPut("properties", node.properties))
    }
    return JSONObject()
        .fluentPut("version", subtree.version)
        .fluentPut("revision", subtree.revision)
        .fluentPut("items", items)
        .toJSONString()
  }

  /**
   * Reads the backend user from the request without a compile-time dependency on the entity type.
   */
  private fun backendUser(params: IPluginServletActionParams): Any? =
      runCatching { params.javaClass.getMethod("getBenutzer").invoke(params) }.getOrNull()

  /**
   * Returns the CSS needed to render the previewed element like a published form: the FORMCYCLE
   * frontend FORM THEME CSS (shipped in the `fc-form-renderer` jar) followed by the form's own user
   * CSS. The server-rendered element markup is frontend markup, so it must be styled by this CSS —
   * not by the designer's own styles (which do not apply to that markup).
   */
  private fun formCss(userContext: Any?, params: IPluginServletActionParams): String {
    val formKey = params.requestParameters["form"]?.firstOrNull() ?: return ""
    val themeCss = THEME_CSS_PATHS.joinToString("\n") { path -> readClasspathText(path) }
    val userCss =
        try {
          MirrorFormAccess.loadFormJson(userContext, formKey)?.let { XForm(it).getUserCSS() } ?: ""
        } catch (x: Exception) {
          logger.warn("[MirrorServletAction] form user CSS failed: {}", x.message)
          ""
        }
    val css = themeCss + "\n" + userCss
    logger.info(
        "[MirrorServletAction] css: theme={} user={} total={}",
        themeCss.length,
        userCss.length,
        css.length)
    return css
  }

  /**
   * Reads a UTF-8 text resource from the classpath, trying several classloaders (the plugin's
   * classloader is often isolated and does not see the FORMCYCLE server jars' resources) and both
   * the plain and leading-slash resource paths. Returns "" when it is not found anywhere.
   */
  private fun readClasspathText(path: String): String {
    val candidates = listOf(path, "/$path")
    val loaders =
        listOf(
            MirrorServletAction::class.java.classLoader,
            Thread.currentThread().contextClassLoader,
            ClassLoader.getSystemClassLoader(),
            runCatching { Class.forName("de.xima.fc.form.renderer.XFormRenderer").classLoader }
                .getOrNull())
    for (loader in loaders) {
      if (loader == null) continue
      for (candidate in candidates) {
        val text =
            runCatching {
                  val stream = loader.getResourceAsStream(candidate) ?: return@runCatching null
                  stream.bufferedReader(Charsets.UTF_8).use { it.readText() }
                }
                .getOrNull()
        if (!text.isNullOrEmpty()) {
          logger.info(
              "[MirrorServletAction] theme CSS found: {} ({} chars)", candidate, text.length)
          return text
        }
      }
    }
    logger.warn("[MirrorServletAction] theme CSS NOT found on the classpath: {}", path)
    return ""
  }

  private fun jsonResponse(json: String): IPluginServletActionRetVal =
      PluginServletActionRetVal(ServletResponse(EResponseType.JSON, json))

  private fun htmlResponse(html: String): IPluginServletActionRetVal =
      PluginServletActionRetVal(ServletResponse(EResponseType.HTML, html))
}
