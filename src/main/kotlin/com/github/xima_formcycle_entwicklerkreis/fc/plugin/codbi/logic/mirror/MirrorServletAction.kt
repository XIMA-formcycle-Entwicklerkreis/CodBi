package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror

import com.alibaba.fastjson.JSONArray
import com.alibaba.fastjson.JSONObject
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.InstalledFormcycleElements
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
import java.net.URLEncoder
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
        "widgets" -> jsonResponse(widgetsJson(params))
        "render" -> htmlResponse(renderCurrentHtml(params))
        "form" -> htmlResponse(formDocument(params))
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
  /**
   * Lists the FORMCYCLE form-element TYPES available on this installation: FORMCYCLE's core widgets
   * plus every plugin-provided widget detected via [InstalledFormcycleElements]. Used so a
   * contained element can be one of ANY installed widget type — not just the hard-coded core list.
   */
  private fun widgetsJson(params: IPluginServletActionParams): String {
    val types = LinkedHashSet<String>()
    types.addAll(InstalledFormcycleElements.CORE_WIDGETS)
    // Plugin-provided widgets (XCaptcha, XFormula, XRating, …) — best effort; the detector is
    // fail-closed and simply contributes nothing when the registry is unavailable.
    runCatching { types.addAll(InstalledFormcycleElements.snapshotFor(params).widgets) }
    // The CodBi Mirror is a real, droppable widget and a valid contained element.
    types.add("XMirror")
    val array = JSONArray()
    types.sorted().forEach { array.add(it) }
    logger.info("[MirrorServletAction] action='widgets' -> {} type(s)", array.size)
    return array.toJSONString()
  }

  /**
   * Renders a single element of the CURRENT form from the posted form JSON (`json` request param)
   * plus the element reference (`element`). Used by the per-element preview to show the element
   * exactly like the frontend (same server-side designer-preview path as the Mirror's hover
   * preview).
   */
  private fun renderCurrentHtml(params: IPluginServletActionParams): String {
    val rawJson = params.requestParameters["json"]?.firstOrNull() ?: return ""
    val elementRef = params.requestParameters["element"]?.firstOrNull() ?: return ""
    return try {
      val parsed = JSONObject.parseObject(rawJson)
      val config =
          XFormRenderConfig().apply {
            setDesignerPreview(true)
            setFormOnly(true)
          }
      MirrorFormAccess.renderElementFromJsonHtml(parsed, elementRef, config, XFormRenderContext())
          ?: ""
    } catch (x: Exception) {
      logger.warn("[MirrorServletAction] action 'render' failed: {}", x.message)
      ""
    }
  }

  /**
   * Returns a COMPLETE, standalone HTML document for the CURRENT form (posted as `json`), used by
   * the **per-element whole-form preview**: the document is loaded into a hidden, same-origin
   * iframe so the FORMCYCLE + CodBi runtime scripts initialize a REAL form instance — full
   * form-level fidelity (navigator, conditional visibility, per-element functionalities) instead of
   * patching a single element client-side.
   *
   * The document combines the server-rendered whole-form body (see
   * [MirrorFormAccess.renderWholeFormBody]) with the platform theme CSS, the form's user CSS, the
   * FORMCYCLE runtime includes (jQuery/jQuery-UI/response.js — resolved from the platform through
   * reflection) and the CodBi runtime script.
   */
  private fun formDocument(params: IPluginServletActionParams): String {
    val rawJson = params.requestParameters["json"]?.firstOrNull() ?: return ""
    val projectId = params.requestParameters["project"]?.firstOrNull()?.trim()?.toLongOrNull()
    val lang = params.requestParameters["lang"]?.firstOrNull()?.trim()
    return try {
      val parsed = JSONObject.parseObject(rawJson)
      val form = XForm(parsed)
      val config =
          XFormRenderConfig().apply {
            setDesignerPreview(true)
            setPreview(true)
            setUsejq(true)
            setUseui(true)
            setUsecss(true)
            if (projectId != null && projectId > 0) setProjektID(projectId)
            if (!lang.isNullOrBlank()) setLang(lang)
          }
      val body = MirrorFormAccess.renderWholeFormBody(parsed, config, XFormRenderContext()) ?: ""
      if (body.isBlank()) {
        logger.warn("[MirrorServletAction] action 'form': nothing rendered")
        return ""
      }
      val modern = MirrorFormAccess.isModernTheme(form)
      val formClasses = MirrorFormAccess.rootClassesOf(form)
      val bodyClass = "body xm-body" + if (modern) " modern" else ""
      val themeCss = THEME_CSS_PATHS.joinToString("\n") { path -> readClasspathText(path) }
      val userCss = MirrorFormAccess.userCssOf(form)
      val (cssIncludes, jsIncludes) = platformIncludes()
      val base = includesBaseUrl()
      val query = includesQuery()
      val sb = StringBuilder()
      sb.append("<!doctype html><html><head><meta charset=\"utf-8\">")
      // The client prepends a <base href> so all root-relative resource URLs resolve against the
      // designer page's origin (the plugin servlet and platform includes are same-origin).
      sb.append("<style>").append(themeCss).append("</style>")
      sb.append("<style>").append(userCss).append("</style>")
      for (href in cssIncludes) {
        sb.append("<link rel=\"stylesheet\" href=\"")
            .append(base)
            .append(href)
            .append(query)
            .append("\">")
      }
      sb.append("</head><body class=\"").append(bodyClass).append("\">")
      sb.append("<form class=\"")
          .append(formClasses)
          .append("\" method=\"post\" action=\"#\" onsubmit=\"return false\">")
      sb.append(body)
      for (src in jsIncludes) {
        sb.append("<script src=\"").append(base).append(src).append(query).append("\"></script>")
      }
      sb.append("<script src=\"").append(codbiScriptUrl()).append("\"></script>")
      // Apply the CodBi functionalities once the runtime and the DOM are ready.
      sb.append(
          "<script>(function(){function r(){try{window.codbi&&window.codbi.checkAttributes&&window.codbi.checkAttributes();}catch(e){}}if(document.readyState!=='loading'){setTimeout(r,0);}else{document.addEventListener('DOMContentLoaded',function(){setTimeout(r,0);});}})();</script>")
      sb.append("</form></body></html>")
      val html = sb.toString()
      logger.info("[MirrorServletAction] action='form' -> {} chars", html.length)
      html
    } catch (x: Exception) {
      logger.warn("[MirrorServletAction] action 'form' failed: {}", x.message)
      ""
    }
  }

  /**
   * Root-relative URL of the CodBi form runtime script (served by the plugin's `Resource` servlet).
   */
  private fun codbiScriptUrl(): String {
    val path =
        URLEncoder.encode(
            "/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi.js",
            java.nio.charset.StandardCharsets.UTF_8.name())
    return "plugin?name=Resource&Path=$path"
  }

  /**
   * Resolves the FORMCYCLE form-runtime include files (JS + CSS) from the platform.
   * `fc-form-renderer` is NOT a compile dependency of this plugin, so the builder is accessed
   * through reflection; on any failure an empty pair is returned and the preview simply lacks the
   * platform runtime.
   */
  private fun platformIncludes(): Pair<List<String>, List<String>> {
    return try {
      val clazz = Class.forName("de.xima.fc.form.renderer.XFormIncludesBuilder")
      val builder = clazz.getDeclaredConstructor().newInstance()
      // MANDATORY: `relative(true)` — otherwise buildJsIncludes/buildCssIncludes return the FULL
      // classpath resource path (e.g. `form/includes/010-jquery-min.js`). Prefixing that with the
      // includes base URL duplicated the path and every include 404'd. The platform itself uses the
      // builder strictly in relative mode (see XFormRenderer.appendJSFolderIncludes).
      clazz.getMethod("relative", java.lang.Boolean.TYPE).invoke(builder, true)
      clazz.getMethod("useJquery", java.lang.Boolean.TYPE).invoke(builder, true)
      runCatching { clazz.getMethod("useJqueryUi", java.lang.Boolean.TYPE).invoke(builder, true) }
      runCatching { clazz.getMethod("useResponseJs", java.lang.Boolean.TYPE).invoke(builder, true) }
      val js =
          (clazz.getMethod("buildJsIncludes").invoke(builder) as? List<*>)?.map { it.toString() }
              ?: emptyList()
      val css =
          (clazz.getMethod("buildCssIncludes").invoke(builder) as? List<*>)?.map { it.toString() }
              ?: emptyList()
      logger.info("[MirrorServletAction] action='form' includes: {} js, {} css", js.size, css.size)
      css to js
    } catch (x: Exception) {
      logger.warn("[MirrorServletAction] platform includes unavailable: {}", x.message)
      emptyList<String>() to emptyList<String>()
    }
  }

  /**
   * The platform's includes base URL (`XFormRendererConfig.getIncludesURL()`, e.g.
   * `https://host/context/form/includes/`), falling back to the includes resource path
   * (`XFormRendererConfig.getIncludesPath()`, e.g. `form/includes/`) so the URLs stay usable even
   * when the URL is not configured.
   */
  private fun includesBaseUrl(): String {
    val url = xfcRendererConfig("getIncludesURL")
    if (!url.isNullOrBlank()) return url
    val path = xfcRendererConfig("getIncludesPath").orEmpty()
    return if (path.isBlank()) "" else path.trimEnd('/') + "/"
  }

  /** The platform's cache-busting query for include URLs (`?…`), or `""`. */
  private fun includesQuery(): String = xfcRendererConfig("getNoCacheQuestParameter").orEmpty()

  /**
   * Invokes a static `XFormRendererConfig` getter via reflection (`fc-form-renderer` is not a
   * compile dep).
   */
  private fun xfcRendererConfig(method: String): String? =
      runCatching {
            Class.forName("de.xima.fc.form.renderer.XFormRendererConfig")
                .getMethod(method)
                .invoke(null) as? String
          }
          .getOrNull()

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
