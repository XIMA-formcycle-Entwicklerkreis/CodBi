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
      // `XMirror` implements two interfaces that both inherit `renderItemPreview` from
      // `IXItemBasic`, so the intended supertype must be named explicitly.
      super<IXItemWidget>.renderItemPreview(container, renderData, renderCtx, formRenderCtx)
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

  /** Human-readable label shown for this widget in the designer's element list. */
  override fun getLabel(locale: Locale): String =
      localize(EMessageKey.DESIGNER_WIDGET_MIRROR_LABEL, locale)
}
