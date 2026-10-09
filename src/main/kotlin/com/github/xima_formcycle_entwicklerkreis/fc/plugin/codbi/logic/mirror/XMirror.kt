package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.localize
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey
import com.hp.gagawa.java.elements.Div
import de.xima.fc.form.common.XPropertyEnum
import de.xima.fc.form.common.models.IXFormRenderContext
import de.xima.fc.form.common.models.IXItemWidget
import de.xima.fc.form.common.models.XItemPropertyDesc
import de.xima.fc.form.common.models.XItemRenderCtx
import de.xima.fc.form.common.models.XItemRenderData
import java.util.Locale

/**
 * The CodBi **Mirror** widget: a reference to a form element (and its children) that lives in
 * **another** form. The widget stores only a reference (source form + source element); at render
 * time (designer preview and live form) the referenced element is resolved from the source form and
 * rendered exactly as it is rendered there. Because the reference is resolved on every render, a
 * change to the source element is reflected automatically.
 *
 * The source form / element are chosen through the dependent dropdowns registered by the designer
 * plugin (see `packages/designer/src/js/register-custom-properties.ts`), which are backed by
 * [MirrorFormAccess].
 *
 * @since 1.0.0
 */
class XMirror : IXItemWidget {

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

    // Register with formcycle so child elements can attach to this container and apply the standard
    // HTML/validation attributes.
    renderCtx.registerParent(wrapper)
    renderCtx.addHtmlAttributes(wrapper)
    @Suppress("DEPRECATION") renderCtx.addValidationAttributes(wrapper)

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
    // When the reference cannot be resolved (unconfigured widget, deleted source element, …) the
    // wrapper stays empty — an empty container renders harmlessly in both the designer and the
    // form.
    if (mirrored != null) {
      wrapper.appendChild(mirrored)
    }

    container.appendChild(wrapper)
  }

  /**
   * Renders the widget in the FORMCYCLE Designer canvas.
   *
   * This override is REQUIRED: [IXItemWidget]'s default [renderItemPreview] does NOT call
   * [renderItem] — it emits a generic placeholder (a `XWidgetIcon` puzzle icon plus the widget
   * label), which is why the Mirror previously never showed the mirrored content in the designer.
   * We instead render the referenced element exactly like in the live form. Only when the widget is
   * still unconfigured (no source form/element) do we fall back to the default placeholder, so a
   * freshly dropped Mirror still shows a hint of what it is.
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
      super.renderItemPreview(container, renderData, renderCtx, formRenderCtx)
    } else {
      renderItem(container, renderData, renderCtx, formRenderCtx)
    }
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
