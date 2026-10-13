package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.functionality

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.localize
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey
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
 * The CodBi **Functionality** widget: a thin container that wraps **exactly one** FORMCYCLE form
 * element and carries the CodBi functionalities (and their parameters) that shall be applied to
 * that contained element.
 *
 * Like [de.xima.fc.form.common.items.XContainer] and the CodBi
 * [com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.XMirror] widget, this
 * widget implements [IXItemAppendable] and calls `renderCtx.registerParent`, so FORMCYCLE nests the
 * widget's CHILD items (the single contained form element, materialized by the designer) into it.
 * The child therefore renders **exactly like it does in the frontend** — in the design canvas *and*
 * in the published form.
 *
 * The chosen functionalities / parameters are stored as ordinary item properties (see
 * [getAvailableProperties]) and are surfaced to the designer as `data-cb-*` attributes on the
 * contained element, so the CodBi runtime applies them unchanged.
 *
 * @since 1.0.0
 */
class XFunctionality : IXItemWidget, IXItemAppendable {

  override fun renderItem(
      container: Div,
      renderData: XItemRenderData,
      renderCtx: XItemRenderCtx,
      formRenderCtx: IXFormRenderContext
  ) {
    val wrapper = Div()
    applyWrapperClasses(wrapper, renderData)
    // Carry this widget's own identifiers on the container (the child item references it via its
    // `parentid`); same convention as FORMCYCLE's own `XContainer`.
    renderData.id?.takeIf { it.isNotBlank() }?.let { wrapper.setAttribute("id", it) }
    renderData.name?.takeIf { it.isNotBlank() }?.let { wrapper.setAttribute("data-name", it) }
    renderCtx.addHtmlAttributes(wrapper)

    // The renderer re-renders the widget IN PLACE, so drop whatever a previous pass left behind.
    removePreviousRender(container)
    container.appendChild(wrapper)

    // Register this wrapper as the current parent so FORMCYCLE appends the widget's PERSISTED CHILD
    // items (the single contained form element) into it — rendering it like the frontend.
    renderCtx.registerParent(wrapper)
  }

  /**
   * Renders the widget in the FORMCYCLE Designer canvas. Because the child item is a REAL form item
   * nested into the container, the designer already renders the contained element exactly like the
   * frontend. Only an unconfigured widget (no contained element yet) shows the branded placeholder.
   */
  override fun renderItemPreview(
      container: Div,
      renderData: XItemRenderData,
      renderCtx: XItemRenderCtx,
      formRenderCtx: IXFormRenderContext
  ) {
    val elementRef = renderData.get(Constants.FUNCTIONALITY_PROPERTY_ELEMENT)?.getString()
    if (elementRef.isNullOrBlank()) {
      removePreviousRender(container)
      val locale = Locale.forLanguageTag(renderData.getXFormRenderConfig().getLang() ?: "en")
      val placeholder = Div()
      placeholder.setCSSClass("codbi-functionality-placeholder")
      placeholder.setStyle("padding:8px;text-align:center;color:#6b7280;")
      val icon = Div()
      icon.setCSSClass("codbi-functionality-icon")
      icon.setStyle("display:block;margin:0 auto 6px;width:28px;height:28px;")
      // Inline SVG markup (not a CSS background): the designer canvas neither loads this widget's
      // CSS nor reliably honours data-URI backgrounds, whereas inline markup always renders.
      icon.appendChild(RawMarkup(ICON_SVG))
      placeholder.appendChild(icon)
      placeholder.appendText(
          org.owasp.encoder.Encode.forHtml(
              localize(EMessageKey.DESIGNER_WIDGET_FUNCTIONALITY_LABEL, locale)))
      container.appendChild(placeholder)
      return
    }
    val wrapper = Div()
    applyWrapperClasses(wrapper, renderData)
    renderData.id?.takeIf { it.isNotBlank() }?.let { wrapper.setAttribute("id", it) }
    renderCtx.addHtmlAttributes(wrapper)
    removePreviousRender(container)
    container.appendChild(wrapper)
    renderCtx.registerParent(wrapper)
  }

  /** Applies the widget's own CSS class plus any user-configured custom classes to [wrapper]. */
  private fun applyWrapperClasses(wrapper: Div, renderData: XItemRenderData) {
    val customClasses = renderData.cssClassesCustom
    wrapper.setCSSClass(
        if (customClasses.isNullOrBlank()) Constants.FUNCTIONALITY_CSS_CLASS
        else "${Constants.FUNCTIONALITY_CSS_CLASS} $customClasses")
  }

  /**
   * Removes any node a previous render pass left in [container] — this widget's own wrapper or
   * FORMCYCLE's default `XWidgetIcon` placeholder — so re-rendering REPLACES its content instead of
   * appending a second copy (e.g. after changing the contained element in the designer).
   */
  private fun removePreviousRender(container: Div) {
    container.children.toList().filter(::isFunctionalityOrPlaceholder).forEach {
      container.removeChild(it)
    }
  }

  /** Whether [node] is this widget's rendered wrapper or FORMCYCLE's default widget placeholder. */
  private fun isFunctionalityOrPlaceholder(node: Node): Boolean {
    if (node !is Div) return false
    val cssClass = node.getCSSClass().orEmpty()
    if (cssClass.contains(Constants.FUNCTIONALITY_CSS_CLASS) || cssClass.contains("XWidgetIcon")) {
      return true
    }
    return node.children.any(::isFunctionalityOrPlaceholder)
  }

  /**
   * The configurable properties exposed in the form designer:
   * - the chosen functionalities (+ cached display names),
   * - the single contained (referenced) form element (+ cached display label), and
   * - the standard CSS/attribute properties shared by every widget.
   *
   * The `*_name` properties only cache human-readable labels for the designer.
   */
  override fun getAvailableProperties(locale: Locale): ArrayList<XItemPropertyDesc> {
    return arrayListOf(
        XItemPropertyDesc(Constants.FUNCTIONALITY_PROPERTY_FUNCS, ""),
        XItemPropertyDesc(Constants.FUNCTIONALITY_PROPERTY_FUNCS_NAME, ""),
        XItemPropertyDesc(Constants.FUNCTIONALITY_PROPERTY_ELEMENT, ""),
        XItemPropertyDesc(Constants.FUNCTIONALITY_PROPERTY_ELEMENT_NAME, ""),
        XItemPropertyDesc(Constants.FUNCTIONALITY_PROPERTY_PREVIEW, ""),
        XItemPropertyDesc(XPropertyEnum.cssclasses),
        XItemPropertyDesc(XPropertyEnum.cssclasseswrapper),
        XItemPropertyDesc(XPropertyEnum.ishidden),
        XItemPropertyDesc(XPropertyEnum.attributes))
  }

  /** The Functionality widget only displays the contained element; it never submits a value. */
  override fun isSubmitsValues(): Boolean = false

  /** Short, globally unique element-name prefix. */
  override fun getPrefix(): String = Constants.FUNCTIONALITY_PREFIX

  /**
   * Custom icon shown for this widget in the designer's element list/palette: the CodBi logo
   * brackets flanking a technical `F`.
   *
   * FORMCYCLE renders a `ico-fc-*` value as `<i class="ico-fc-*">` (a CSS class, never a URL), so
   * the icon is painted via [getCssData] using [ICON_SVG] as a data URI.
   */
  override fun getIcon(): String = "ico-fc-XFunctionality"

  /** CSS painting [ICON_SVG] for the `.ico-fc-XFunctionality` class returned by [getIcon]. */
  override fun getCssData(): String =
      ".ico-fc-XFunctionality{background-image:url(\"${iconDataUri()}\");" +
          "background-repeat:no-repeat;background-position:center;background-size:1.15em 1.15em;" +
          "filter:drop-shadow(0 0 1.5px rgba(56,189,248,0.85)) " +
          "drop-shadow(0 0 3px rgba(37,99,235,0.45));" +
          "display:inline-block;width:1.15em;height:1.15em;vertical-align:middle}" +
          ".ico-fc-XFunctionality::before{content:\"\" !important}" +
          ".codbi-functionality-icon svg{display:block;" +
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
     * The Functionality widget icon: the CodBi logo's technical brackets flanking a stylized `F`
     * (instead of the `CB` monogram), carrying the same technical ornaments (double-rail strokes,
     * stealth chevron notches) as the rest of the CodBi icon set.
     */
    const val ICON_SVG =
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' width='28' height='28'>" +
            // CodBi logo brackets (same as the Mirror icon).
            "<g fill='none' stroke='#ff8c00' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'>" +
            "<path d='M11 9 L4 9 L4 39 L11 39'/><path d='M37 9 L44 9 L44 39 L37 39'/></g>" +
            // Soft, out-of-focus glow behind the glyph.
            "<path d='M19 12 H34' fill='none' stroke='#38bdf8' stroke-opacity='0.45' stroke-width='6' " +
            "stroke-linecap='round'/>" +
            // The stylized `F` — a two-rail stem plus two arms, echoing the Mirror icon's rails.
            "<g fill='none' stroke='#2563eb' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'>" +
            "<path d='M20 12 V36'/><path d='M22.5 12 V36'/>" +
            "<path d='M20 12 H34'/><path d='M20 14.5 H32'/>" +
            "<path d='M20 23 H30'/><path d='M20 25.5 H29'/></g>" +
            // Crisp, technical stealth chevron notches on the arm ends (the CodBi "ornament").
            "<g fill='none' stroke='#0f172a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" +
            "<path d='M32 10.4 L34 12 L32 13.6'/><path d='M30 12.4 L32 14 L30 15.6'/>" +
            "<path d='M28 21.4 L30 23 L28 24.6'/><path d='M27 23.4 L29 25 L27 26.6'/>" +
            "<path d='M18.4 34 L20 36 L21.6 34'/></g></svg>"
  }

  /** Human-readable label shown for this widget in the designer's element list. */
  override fun getLabel(locale: Locale): String =
      localize(EMessageKey.DESIGNER_WIDGET_FUNCTIONALITY_LABEL, locale)
}
