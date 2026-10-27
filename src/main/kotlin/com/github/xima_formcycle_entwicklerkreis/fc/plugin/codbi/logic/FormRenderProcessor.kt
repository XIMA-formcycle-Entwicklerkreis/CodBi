package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.MIRROR_CONDITION_MODEL_CSS_CLASS
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.MIRROR_COPIES_CSS_CLASS
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
    // The lookup key may be the BARE element id (e.g. `Appointments.js`), while the descriptor is
    // served under its folder-prefixed fileName (`Configurations/Appointments.js`). The URL must
    // use
    // the descriptor's own fileName, otherwise the resource servlet cannot resolve it.
    val servedName = CodbiFormResourcesPlugin.formResources[filePath]?.fileName ?: filePath
    val node =
        if (renderConfig.isForceInline) {
          createScriptInline(id, readFormResourcePluginContent(filePath))
        } else {
          createScriptExternal(id, createFormResourcesPluginUrl(servedName), isModule)
        }
    if (prepend) {
      prependChild(form, node)
    } else {
      appendChild(form, node)
    }
  }

  /**
   * Inserts an inline script that directly calls [window.codbi.nncHandler] to load code from the
   * database, bypassing the file-based resource path (avoiding 404 errors for DB-stored code).
   *
   * @param id The ID of the script element.
   * @param elementName The name of the standard/functionality/EP to load.
   */
  fun insertNncHandlerScript(id: String, elementName: String) {
    val script = createScriptInline(id, "window.codbi.nncHandler('$elementName');")
    appendChild(form, script)
  }

  /**
   * Inserts an inline script that removes the Mirror widget's persisted "registration" copies from
   * the published form.
   *
   * The Mirror renders the referenced source element LIVE, so those persisted copies must not be
   * part of the page at all: their markup is a DUPLICATE item tree (item wrapper, label, error
   * container), and the `codbi-mirror-copy` class that marks the fields themselves does not cover
   * those wrappers. `XMirror.renderItem` therefore nests the copies into a HIDDEN host, which this
   * script removes from the DOM (and keeps removed, should the form be re-rendered on the client).
   * Copies written by older plugin versions have no host yet — those are hidden by class instead.
   * Removing/ hiding with an inline script is more reliable than widget CSS, which is not
   * guaranteed to be included on the published form.
   */
  fun insertHideMirrorCopiesScript(id: String = "codbi-mirror-hide-copies") {
    val code =
        "(function(){var H='.$MIRROR_COPIES_CSS_CLASS';var f=function(){" +
            "var h=document.querySelectorAll(H);" +
            "for(var i=0;i<h.length;i++){if(h[i].parentNode){h[i].parentNode.removeChild(h[i]);}}" +
            "var n=document.querySelectorAll('.codbi-mirror-copy');" +
            "for(var j=0;j<n.length;j++){n[j].style.display='none';}};" +
            "if(document.readyState!=='loading'){f();}" +
            "else{document.addEventListener('DOMContentLoaded',f);}" +
            "try{new MutationObserver(f).observe(document.documentElement," +
            "{childList:true,subtree:true});}catch(e){}})();"
    appendChild(form, createScriptInline(id, code))
  }

  /**
   * Inserts an inline script that merges the **mirrored elements' validation models** into
   * FORMCYCLE's form model.
   *
   * `XMirror.renderItem` renders the referenced source element OUTSIDE the target form's item loop,
   * so FORMCYCLE never registers its element conditions (`hiddenif`, `readonlyif`, `requiredif`,
   * `equals`, groups, …) in `XM_FORM_MODEL`. It therefore emits the model of the mirrored subtree —
   * with every element id namespaced to the id used in the mirrored markup — as inert
   * `script.codbi-mirror-model` JSON blobs (see `XMirror.conditionModelBlob`).
   *
   * This script is appended at the END of the form, i.e. after the page assigned `XM_FORM_MODEL`
   * and before `$(document).ready` lets FORMCYCLE's form runtime initialize, so the conditions are
   * known when the runtime binds them. The merge is idempotent (ids are only ever added).
   */
  fun insertMirrorConditionModelScript(id: String = "codbi-mirror-model-merge") {
    val code =
        "(function(){var SEL='.$MIRROR_CONDITION_MODEL_CSS_CLASS';" +
            "function union(a,b){a=a||[];for(var i=0;i<b.length;i++){if(a.indexOf(b[i])<0){a.push(b[i]);}}return a;}" +
            "function merge(){var M=window.XM_FORM_MODEL;if(!M||!M.validation){return false;}" +
            "var V=M.validation,F=V.fields||(V.fields={}),R=V.revids||(V.revids={});" +
            "var b=document.querySelectorAll(SEL);" +
            "for(var i=0;i<b.length;i++){var d=null;" +
            "try{d=JSON.parse(b[i].textContent||b[i].innerHTML||'{}');}catch(e){continue;}" +
            "if(!d||typeof d!=='object'){continue;}" +
            // Tolerate both shapes: the blob normally carries `{fields, revids}` directly; a nested
            // `{validation:{fields, revids}}` (older/foreign producers) is unwrapped as well.
            "d=d.validation||d;" +
            "var k,p,df,o,f=d.fields||{};" +
            "for(k in f){if(!Object.prototype.hasOwnProperty.call(f,k)){continue;}" +
            "df=F[k]||(F[k]={});o=f[k]||{};" +
            "for(p in o){if(Object.prototype.hasOwnProperty.call(o,p)){df[p]=o[p];}}}" +
            "var r=d.revids||{},c,bk,tb,tg,id;" +
            "for(c in r){if(!Object.prototype.hasOwnProperty.call(r,c)){continue;}" +
            "bk=r[c];if(!bk){continue;}" +
            "if(c==='formula'){tg=R.formula||(R.formula={});" +
            "for(p in bk){if(!Object.prototype.hasOwnProperty.call(bk,p)){continue;}" +
            "tg[p]=union(tg[p]||[],bk[p]||[]);}}" +
            "else{tb=R[c]||(R[c]={});" +
            "for(id in bk){if(!Object.prototype.hasOwnProperty.call(bk,id)){continue;}" +
            "tb[id]=union(tb[id]||[],bk[id]||[]);}}}}" +
            "return true;}" +
            "if(!merge()){document.addEventListener('DOMContentLoaded',merge);}})();"
    insertInlineScript(id, code)
  }

  /**
   * Serialises the rendered `<form>` markup.
   *
   * Used to find out which elements the form ACTUALLY contains — in particular which
   * standard-configuration CSS classes are in use (see [FormRenderCallback]) — because those are
   * rendered onto the widgets and are not part of the persisted item attributes.
   *
   * @return The form's HTML markup, or an empty string when it cannot be serialised (a render must
   *   never fail because of this inspection).
   */
  fun renderedFormMarkup(): String =
      try {
        form.write()
      } catch (x: Exception) {
        ""
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
    // See insertFormResourcePluginScript: serve the descriptor's folder-prefixed fileName.
    val servedName = CodbiFormResourcesPlugin.formResources[filePath]?.fileName ?: filePath
    if (renderConfig.isForceInline) {
      val content = readFormResourcePluginContent(filePath)
      appendChild(target, createStyle(id, content))
    } else {
      val url = createFormResourcesPluginUrl(servedName)
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
