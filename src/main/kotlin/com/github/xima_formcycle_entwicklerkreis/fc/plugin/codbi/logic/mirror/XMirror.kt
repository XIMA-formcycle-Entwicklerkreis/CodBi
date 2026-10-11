package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.localize
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey
import com.hp.gagawa.java.FertileNode
import com.hp.gagawa.java.Node
import com.hp.gagawa.java.elements.Div
import de.xima.fc.form.common.XPropertyEnum
import de.xima.fc.form.common.models.IXFormRenderContext
import de.xima.fc.form.common.models.IXItemAppendable
import de.xima.fc.form.common.models.IXItemWidget
import de.xima.fc.form.common.models.XItemPropertyDesc
import de.xima.fc.form.common.models.XItemRenderCtx
import de.xima.fc.form.common.models.XItemRenderData
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.Locale

/**
 * The CodBi **Mirror** widget: a reference to a form element (and its children) that lives in
 * **another** form.
 *
 * The widget itself renders only an (initially empty) CONTAINER — it implements
 * [de.xima.fc.form.common.models.IXItemAppendable] and calls `renderCtx.registerParent` so
 * FORMCYCLE nests the widget's CHILD items into it, exactly like
 * `de.xima.fc.form.common.items.XContainer`.
 *
 * The child items are REAL copies of the source element's value-able fields. They are materialized
 * by the designer (see `packages/designer/src/js/MirrorChildItems.ts`) when the source element is
 * chosen, each carrying the source field's NATIVE `name`. Because they are ordinary form items they
 * render, submit under that name (so `[%fieldName%]` resolves in this form's workflows/mails) and
 * appear in the placeholder dialog automatically.
 *
 * The source form / element are chosen through the dependent dropdowns registered by the designer
 * plugin (see `packages/designer/src/js/register-custom-properties.ts`), which are backed by
 * [MirrorFormAccess].
 *
 * @since 1.0.0
 */
class XMirror : IXItemWidget, IXItemAppendable {

  override fun renderItem(
      container: Div,
      renderData: XItemRenderData,
      renderCtx: XItemRenderCtx,
      formRenderCtx: IXFormRenderContext
  ) {
    val wrapper = Div()
    val customClasses = renderData.cssClassesCustom
    wrapper.setCSSClass(
        if (customClasses.isNullOrBlank()) Constants.MIRROR_CSS_CLASS
        else "${Constants.MIRROR_CSS_CLASS} $customClasses")
    // Carry this widget's own identifiers on the container (the child items reference it via their
    // `parentid`); same convention as FORMCYCLE's own `XContainer`.
    renderData.id?.takeIf { it.isNotBlank() }?.let { wrapper.setAttribute("id", it) }
    renderData.name?.takeIf { it.isNotBlank() }?.let { wrapper.setAttribute("data-name", it) }
    renderCtx.addHtmlAttributes(wrapper)

    // LIVE rendering (the published form): resolve the referenced element from the SOURCE form on
    // EVERY render, so a later change to the source is reflected immediately in the frontend. The
    // mirrored inputs keep the source field NAMES — that is what makes `[%name%]` resolvable in
    // workflows/mails — while their ids are namespaced with this widget's id so they cannot clash
    // with the target form's own ids.
    val formRef = renderData.get(Constants.MIRROR_PROPERTY_FORM)?.getString()
    val elementRef = renderData.get(Constants.MIRROR_PROPERTY_ELEMENT)?.getString()
    val mirrored =
        if (formRef.isNullOrBlank() || elementRef.isNullOrBlank()) {
          null
        } else {
          MirrorFormAccess.renderElementNode(
              MirrorFormAccess.systemContext(),
              formRef,
              elementRef,
              renderData.getXFormRenderConfig(),
              formRenderCtx)
        }
    if (mirrored != null) {
      namespaceLinkedIds(mirrored, mirrorIdPrefix(renderData), mirrorNamePrefix(renderData))
      wrapper.appendChild(mirrored)
    }

    // The renderer re-renders the widget IN PLACE, so drop whatever a previous pass left behind.
    removePreviousRender(container)
    container.appendChild(wrapper)

    // Register this wrapper as the current parent so FORMCYCLE appends the widget's PERSISTED CHILD
    // items (the registration copies that make the fields appear in the placeholder dialog) into
    // it.
    // Those copies are hidden at runtime via `getCssData`, so only the live-rendered fields show.
    renderCtx.registerParent(wrapper)
  }

  /**
   * Renders the widget in the FORMCYCLE Designer canvas.
   *
   * Unlike [renderItem] (published form, LIVE source rendering) the designer renders only the
   * container; the persisted child items nest into it and stay visible/usable on the canvas. Only
   * when the widget is still unconfigured (no source form/element) do we fall back to
   * [IXItemWidget]'s default placeholder, so a freshly dropped Mirror still shows a hint.
   */
  override fun renderItemPreview(
      container: Div,
      renderData: XItemRenderData,
      renderCtx: XItemRenderCtx,
      formRenderCtx: IXFormRenderContext
  ) {
    val formRef = renderData.get(Constants.MIRROR_PROPERTY_FORM)?.getString()
    val elementRef = renderData.get(Constants.MIRROR_PROPERTY_ELEMENT)?.getString()
    if (formRef.isNullOrBlank() || elementRef.isNullOrBlank()) {
      removePreviousRender(container)
      // The default `IXItemWidget.renderItemPreview` renders FORMCYCLE's generic `XWidgetIcon`
      // placeholder (a puzzle piece) — which ignores `getIcon()`. We render our OWN icon instead,
      // so
      // a freshly dropped Mirror already shows the custom CodBi mirror icon plus the widget label.
      val locale = Locale.forLanguageTag(renderData.getXFormRenderConfig().getLang() ?: "en")
      val placeholder = Div()
      placeholder.setCSSClass("codbi-mirror-placeholder")
      placeholder.setStyle("padding:8px;text-align:center;color:#6b7280;")
      val icon = Div()
      icon.setCSSClass("codbi-mirror-icon")
      icon.setStyle("display:block;margin:0 auto 6px;width:28px;height:28px;")
      // Embed the icon as INLINE SVG markup, NOT as a CSS background: the designer canvas neither
      // loads this widget's CSS nor reliably honours inline `style`/data-URI backgrounds, whereas
      // inline markup is emitted verbatim and always renders.
      icon.appendChild(RawMarkup(ICON_SVG))
      placeholder.appendChild(icon)
      placeholder.appendText(
          org.owasp.encoder.Encode.forHtml(
              localize(EMessageKey.DESIGNER_WIDGET_MIRROR_LABEL, locale)))
      container.appendChild(placeholder)
      return
    }
    val wrapper = Div()
    val customClasses = renderData.cssClassesCustom
    wrapper.setCSSClass(
        if (customClasses.isNullOrBlank()) Constants.MIRROR_CSS_CLASS
        else "${Constants.MIRROR_CSS_CLASS} $customClasses")
    renderData.id?.takeIf { it.isNotBlank() }?.let { wrapper.setAttribute("id", it) }
    renderCtx.addHtmlAttributes(wrapper)
    removePreviousRender(container)
    container.appendChild(wrapper)
    renderCtx.registerParent(wrapper)
  }

  /**
   * A form-unique prefix for the mirrored content, derived from this widget's own element id. The
   * prefix is `<mirror element id>_`, e.g. `xi-mirror-3_xi-tf-1`.
   */
  private fun mirrorIdPrefix(renderData: XItemRenderData): String {
    val base =
        renderData.id?.takeIf { it.isNotBlank() }
            ?: renderData.name?.takeIf { it.isNotBlank() }
            ?: Constants.MIRROR_PREFIX
    return "${base}_"
  }

  /**
   * The namespace prefix for the mirrored FIELDS: the Mirror widget's own NAME followed by an
   * underscore (e.g. `mirFormElement_`). Prefixing the field names prevents collisions with fields
   * of the same name that live directly in the target form, and it is the name the workflow
   * placeholder dialog exposes (the registration copies use the identical prefix).
   */
  private fun mirrorNamePrefix(renderData: XItemRenderData): String {
    val base =
        renderData.name?.takeIf { it.isNotBlank() }
            ?: renderData.id?.takeIf { it.isNotBlank() }
            ?: Constants.MIRROR_PREFIX
    return "${base}_"
  }

  /**
   * Rewrites the identifiers inside the live-rendered subtree: `id` (and everything that references
   * an id) gets [idPrefix] so the mirrored copy's DOM ids stay unique within the target form; the
   * FIELD NAMES (`name`/`data-name`) get [namePrefix] so a mirrored field cannot collide with a
   * field of the same name in the target form. The namespaced name is what the workflow placeholder
   * dialog lists (the registration copies use the identical prefix).
   */
  private fun namespaceLinkedIds(node: Node, idPrefix: String, namePrefix: String) {
    for (attr in listOf("id", "for", "list", "headers")) {
      val value = node.getAttribute(attr)
      if (!value.isNullOrBlank()) node.setAttribute(attr, idPrefix + value)
    }
    for (attr in listOf("aria-labelledby", "aria-controls", "aria-describedby", "aria-owns")) {
      val value = node.getAttribute(attr)
      if (!value.isNullOrBlank()) {
        node.setAttribute(
            attr, value.split(' ').filter { it.isNotEmpty() }.joinToString(" ") { idPrefix + it })
      }
    }
    for (attr in listOf("name", "data-name")) {
      val value = node.getAttribute(attr)
      if (!value.isNullOrBlank()) node.setAttribute(attr, namePrefix + value)
    }
    if (node is FertileNode) {
      node.children.forEach { namespaceLinkedIds(it, idPrefix, namePrefix) }
    }
  }

  /**
   * Removes any node a previous render pass left in [container] — this widget's own `codbi-mirror`
   * wrapper or FORMCYCLE's default `XWidgetIcon` placeholder — so that re-rendering the widget
   * REPLACES its content instead of appending a second copy (e.g. after changing the linked source
   * element in the designer).
   */
  private fun removePreviousRender(container: Div) {
    container.children.toList().filter(::isMirrorOrPlaceholder).forEach {
      container.removeChild(it)
    }
  }

  /** Whether [node] is this widget's rendered wrapper or FORMCYCLE's default widget placeholder. */
  private fun isMirrorOrPlaceholder(node: Node): Boolean {
    if (node !is Div) return false
    val cssClass = node.getCSSClass().orEmpty()
    if (cssClass.contains(Constants.MIRROR_CSS_CLASS) || cssClass.contains("XWidgetIcon")) {
      return true
    }
    return node.children.any(::isMirrorOrPlaceholder)
  }

  /**
   * The configurable properties exposed in the form designer:
   * - the source form / source element (edited via the CodBi Mirror dropdowns), and
   * - the standard CSS/attribute properties shared by every widget.
   *
   * The `*_name` properties only cache the human-readable source title/label for the designer; they
   * are not used at render time.
   */
  override fun getAvailableProperties(locale: Locale): ArrayList<XItemPropertyDesc> {
    return arrayListOf(
        XItemPropertyDesc(Constants.MIRROR_PROPERTY_FORM, ""),
        XItemPropertyDesc(Constants.MIRROR_PROPERTY_FORM_NAME, ""),
        XItemPropertyDesc(Constants.MIRROR_PROPERTY_ELEMENT, ""),
        XItemPropertyDesc(Constants.MIRROR_PROPERTY_ELEMENT_NAME, ""),
        XItemPropertyDesc(XPropertyEnum.cssclasses),
        XItemPropertyDesc(XPropertyEnum.cssclasseswrapper),
        XItemPropertyDesc(XPropertyEnum.ishidden),
        XItemPropertyDesc(XPropertyEnum.attributes))
  }

  /** The Mirror only displays content; it never submits a value of its own. */
  override fun isSubmitsValues(): Boolean = false

  /** Short, globally unique element-name prefix. */
  override fun getPrefix(): String = Constants.MIRROR_PREFIX

  /**
   * Custom icon shown for this widget in the designer's element list/palette: a mirrored software
   * component with a CodBi dark-orange accent.
   *
   * IMPORTANT: for any icon that does NOT start with `ico-fc-` or `fa-`, the designer treats the
   * value as a URL to an SVG: it fetches it and inlines the `<svg>` into the palette element (and
   * falls back to `<img src>`). Returning a CSS class therefore produced a broken image. We return
   * the (relative) URL of the icon served by the plugin's `Resource` servlet instead.
   */
  override fun getIcon(): String = "ico-fc-XMirror"

  /**
   * CSS painted with the designer (and the published form): paints [ICON_SVG] for the
   * `.ico-fc-XMirror` class returned by [getIcon].
   *
   * FORMCYCLE renders an icon returned as `ico-fc-*` as `<i class="ico-fc-*">` (a CSS class, never
   * a URL) — so we must paint it here. A data URI is used because a resource URL cannot be built
   * server-side (the servlet context path is not known to the widget), and a relative URL resolves
   * against the designer's deep page path and 404s.
   *
   * The layered `drop-shadow`s add the "cool blur" glow around the technical arrow (the arrow also
   * carries an out-of-focus beam stroke, see [ICON_SVG]).
   */
  override fun getCssData(): String =
      ".ico-fc-XMirror{background-image:url(\"${iconDataUri()}\");" +
          "background-repeat:no-repeat;background-position:center;background-size:1.15em 1.15em;" +
          "filter:drop-shadow(0 0 1.5px rgba(56,189,248,0.85)) " +
          "drop-shadow(0 0 3px rgba(37,99,235,0.45));" +
          "display:inline-block;width:1.15em;height:1.15em;vertical-align:middle}" +
          ".ico-fc-XMirror::before{content:\"\" !important}" +
          // The placeholder icon (a freshly dropped, unconfigured Mirror) is rendered inline in the
          // canvas; give its SVG the same glow. This stylesheet is what reaches the canvas iframe
          // (the designer's own frame.css does not).
          ".codbi-mirror-icon svg{display:block;" +
          "filter:drop-shadow(0 0 1.5px rgba(56,189,248,0.85)) " +
          "drop-shadow(0 0 3px rgba(37,99,235,0.45))}"

  /** [ICON_SVG] as a self-contained data URI (UTF-8, percent-encoded). */
  private fun iconDataUri(): String =
      "data:image/svg+xml;charset=utf-8," +
          URLEncoder.encode(ICON_SVG, StandardCharsets.UTF_8).replace("+", "%20")

  /**
   * A gagawa node whose [write] emits [markup] verbatim. Used to embed the icon's SVG inline so the
   * designer canvas shows it without depending on any external stylesheet or data-URI background.
   */
  private class RawMarkup(private val markup: String) : Node("span") {
    override fun write(): String = markup
  }

  private companion object {
    /**
     * The Mirror widget icon: a perspective mirror frame (its left side nearer to the observer)
     * pierced by a technical, two-headed beam arrow, flanked by two CodBi brackets.
     *
     * The arrow is drawn as a soft, out-of-focus “beam” stroke (light blue, lower opacity) with the
     * crisp two-rail arrow and stealth chevrons on top — so it reads as a glowing, blurred beam
     * rather than a plain line. Additional glow comes from the `drop-shadow`s in [getCssData] and,
     * for the badge/preview, from `frame.css`.
     *
     * Kept in sync with `src/main/resources/.../codbi/mirror-icon.svg` and the badge icon in
     * `packages/designer/src/js/CodbiElementMarkers.ts`.
     */
    const val ICON_SVG =
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' width='28' height='28'>" +
            "<g fill='none' stroke='#ff8c00' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'>" +
            "<path d='M11 9 L4 9 L4 39 L11 39'/><path d='M37 9 L44 9 L44 39 L37 39'/></g>" +
            "<path d='M17 11 L32 16 L32 32 L17 37 Z' fill='#2563eb' fill-opacity='0.12' " +
            "stroke='#2563eb' stroke-width='2.6' stroke-linejoin='round'/>" +
            // Blurred "beam" behind the arrow — reads as a glowing, out-of-focus shaft.
            "<path d='M8 24 H40' fill='none' stroke='#38bdf8' stroke-opacity='0.55' stroke-width='6' " +
            "stroke-linecap='round'/>" +
            // Crisp, technical two-rail arrow with stealth chevrons on both ends.
            "<g fill='none' stroke='#0f172a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" +
            "<path d='M13 24 H35'/><path d='M13.5 22 H34.5'/>" +
            "<path d='M18 20 L13 24 L18 28'/><path d='M16 21.2 L13 24 L16 26.8'/>" +
            "<path d='M30 20 L35 24 L30 28'/><path d='M32 21.2 L35 24 L32 26.8'/></g>" +
            // Near (left) frame edge drawn LAST so it sits ON TOP of the arrow.
            "<path d='M17 11 L17 37' fill='none' stroke='#2563eb' stroke-width='2.6' " +
            "stroke-linecap='round' stroke-linejoin='round'/></svg>"
  }

  /** Human-readable label shown for this widget in the designer's element list. */
  override fun getLabel(locale: Locale): String =
      localize(EMessageKey.DESIGNER_WIDGET_MIRROR_LABEL, locale)
}
