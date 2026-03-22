package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.PLUGIN_FORM_RESOURCES_ID
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.PLUGIN_KEY
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.CodbiFormResourcesPlugin
import com.hp.gagawa.java.FertileNode
import com.hp.gagawa.java.Node
import com.hp.gagawa.java.elements.Link
import com.hp.gagawa.java.elements.Script
import de.xima.cmn.utils.XPathUtils.joinPath
import de.xima.fc.common.dom.Gagawa.*
import de.xima.fc.form.common.models.IXFormRenderConfig
import de.xima.fc.interfaces.plugin.param.form.IPluginFormRenderCallbackOnAfterRenderFormParams
import de.xima.fc.plugin.interfaces.form.IPluginFormRenderCallback
import de.xima.fc.utils.URLUtils.encodePathSegment
import org.apache.commons.lang3.StringUtils.splitPreserveAllTokens

/**
 * Helper class for modifying a rendered formcycle form.
 *
 * @since 1.0.0
 */
internal class FormRenderProcessor {
  private val form: Node
  private val html: Node?
  val renderConfig: IXFormRenderConfig

  /**
   * Constructs a new instance with a certain renderConfig, `<html>` and `<form>` element. Used
   * internally by other constructors, and by tests. Prefer other constructors for normal usage.
   *
   * @param renderConfig The render configuration of the form.
   * @param html The `<html>` element of the form, or `null` if only the form is rendered.
   * @param form The `<form>` element of the form.
   */
  internal constructor(renderConfig: IXFormRenderConfig, html: Node?, form: Node) {
    this.renderConfig = renderConfig
    this.html = html
    this.form = form
  }

  /**
   * Constructs a new instance from the `onAfterRender` parameters of a [IPluginFormRenderCallback].
   */
  internal constructor(
      params: IPluginFormRenderCallbackOnAfterRenderFormParams
  ) : this(params.formRenderConfig, params.html, params.form)

  /**
   * Inserts an additional JavaScript resource into the form, which is provided by the
   * [CodbiFormResourcesPlugin]. Either inserts an external `<script src="...">` or an inline
   * `<script>...</script>` element, depending on the [form configuration][IXFormRenderConfig].
   *
   * @param id The ID of the element to insert. Used to set the name and ID attributes of the
   *   inserted DOM element.
   * @param filePath The path to the resource, must be one of the keys as returned by the
   *   [CodbiFormResourcesPlugin.getResources].
   */
  fun insertFormResourcePluginScript(
      id: String,
      filePath: String,
      isModule: Boolean = true,
      prepend: Boolean = false
  ) {
    val node =
        if (renderConfig.isForceInline) {
          createScriptInline(id, readFormResourcePluginContent(filePath))
        } else {
          createScriptExternal(id, createFormResourcesPluginUrl(filePath), isModule)
        }
    if (prepend) {
      prependChild(form, node)
    } else {
      appendChild(form, node)
    }
  }

  /** Inserts a child node before all existing children of the given parent. */
  private fun prependChild(parent: Node, child: Node) {
    (parent as FertileNode).children.add(0, child)
    child.setParent(parent)
  }

  /**
   * Inserts an additional CSS resource into the form, which is provided by the
   * [CodbiFormResourcesPlugin]. Either inserts an external `<link rel="stylesheet" href="...">` or
   * an inline `<style>...</style>` element, depending on the
   * [form configuration][IXFormRenderConfig].
   *
   * @param id The ID of the element to insert. Used to set the name and ID attributes of the
   *   inserted DOM element.
   * @param filePath The path to the resource, must be one of the keys as returned by
   *   [CodbiFormResourcesPlugin.getResources].
   */
  fun insertFormResourcePluginStyle(id: String, filePath: String) {
    val target = resolveStyleInsertionTarget()
    if (renderConfig.isForceInline) {
      val content = readFormResourcePluginContent(filePath)
      appendChild(target, createStyle(id, content))
    } else {
      val url = createFormResourcesPluginUrl(filePath)
      appendChild(target, createStylesheetLink(id, url))
    }
  }

  /**
   * Resolves the DOM node where we should append a `<link rel="stylesheet">` or `<style>` tag. When
   * the form is rendered normally, this returns the `<head>` element. In case only the form without
   * the surrounding html is rendered, returns the `<form>` element.
   */
  private fun resolveStyleInsertionTarget(): Node {
    return if (renderConfig.isFormOnly) form else byTagName(html, "head")
  }

  /**
   * Inserts an inline script into the form.
   *
   * @param id See [createScriptInline].
   * @param content See [createScriptInline].
   */
  fun insertInlineScript(id: String, content: String) {
    appendChild(form, createScriptInline(id, content))
  }

  /**
   * Creates an inline script element with the given content and ID.
   *
   * ```html
   * <script id="ID" name="ID">content</script>
   * ```
   *
   * @param id The value for the ID and name attributes of the script element.
   * @param content The content of the script element.
   * @return The newly created script element.
   */
  private fun createScriptInline(id: String, content: String): Node {
    val style = newInlineScript(content, id)

    attr(style, "id", id)

    return style
  }

  /**
   * Creates an external script element of type module with the given URL and ID.
   *
   * ```html
   * <script id="id" name="id" src="url" type = "module"></script>
   * ```
   *
   * @param id The value for the ID and name attributes of the script element.
   * @param url The URL pointing to the JavaScript file.
   * @return The newly created script element.
   */
  private fun createScriptExternal(id: String, url: String, isModule: Boolean = true): Node {
    val script = Script(null)
    attr(script, "id", id)
    attr(script, "name", id)
    attr(script, "src", url)
    if (isModule) {
      attr(script, "type", "module")
    }
    attr(
        script,
        "onerror",
        "window.codbi.nncHandler('${url.substring(url.lastIndexOf('/')+1).replace(".js","")}');")

    return script
  }

  /**
   * Creates a style element with the given CSS content and with the given ID.
   *
   * ```html
   * <style id="id" name="id">content</style>
   * ```
   *
   * @param id The value for the ID and name attributes of the style element.
   * @param content The CSS content of the style element.
   * @return The newly created style element.
   */
  private fun createStyle(id: String, content: String): Node {
    val style = newInlineStyle(content, id)
    attr(style, "id", id)
    return style
  }

  /**
   * Creates a link element referencing a CSS stylesheet, with the given ID.
   *
   * ```html
   * <link id="ID" name="ID" rel="stylesheet" href="URL">
   * ```
   *
   * @param id The value for the ID and name attributes of the link element.
   * @param url The URL pointing to the CSS file.
   * @return The newly created link element.
   */
  private fun createStylesheetLink(id: String, url: String): Node {
    val link = Link()
    attr(link, "id", id)
    attr(link, "name", id)
    attr(link, "href", url)
    attr(link, "rel", "stylesheet")
    return link
  }

  /**
   * Reads the content of a resource provided by the [CodbiFormResourcesPlugin].
   *
   * @param filePath The path to the resource, must be one of the keys as returned by
   *   [CodbiFormResourcesPlugin.getResources].
   * @return The contents of the resource.
   */
  private fun readFormResourcePluginContent(filePath: String): String {
    val resource = CodbiFormResourcesPlugin.formResources[filePath]?.resource ?: return ""
    return resource.open().use { String(it.readAllBytes(), resource.charset) }
  }

  /**
   * Creates the URL for a resource provided by the [CodbiFormResourcesPlugin].
   *
   * @param filePath The path to the resource, must be one of the keys as returned by
   *   [CodbiFormResourcesPlugin.getResources].
   * @return The URL to the resource.
   */
  private fun createFormResourcesPluginUrl(filePath: String): String {
    // Pass each path segment through the URL encoder, e.g. foo%bar/baz => foo%25bar/baz
    val encodedPath =
        splitPreserveAllTokens(filePath, '/').joinToString("/") { encodePathSegment(it) }
    return joinPath(
        '/',
        renderConfig.baseIncludeUrl,
        "ressource",
        renderConfig.clientId,
        renderConfig.projektID,
        "plugin/form-resources",
        encodePathSegment(PLUGIN_KEY),
        encodePathSegment(PLUGIN_FORM_RESOURCES_ID),
        encodedPath)
  }
}
