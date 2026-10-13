package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.localize
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.functionality.XFunctionality
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.XMirror
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.PLUGIN_FORM_ELEMENT_WIDGET_ID
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.PLUGIN_FORM_ELEMENT_WIDGET_DESC
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.PLUGIN_FORM_ELEMENT_WIDGET_NAME
import de.xima.fc.form.common.models.IXItemWidget
import de.xima.fc.plugin.interfaces.form.IPluginFormElementWidget
import java.util.Locale

/**
 * Plugin that registers the CodBi custom widgets with FORMCYCLE.
 *
 * Contributes the CodBi custom widgets: the [XMirror] widget (mirrors a form element of another
 * form) and the [XFunctionality] widget (wraps one form element and applies CodBi functionalities
 * to it). Add further CodBi widgets to [getWidgets] as they are implemented.
 *
 * @since 1.0.0
 */
class CodbiFormElementWidgetPlugin : IPluginFormElementWidget {

  override fun getName(): String {
    // Fixed string, not the class name via reflection — the class may be refactored, the plugin id
    // must stay stable.
    return PLUGIN_FORM_ELEMENT_WIDGET_ID
  }

  override fun getDisplayName(locale: Locale?): String {
    return localize(PLUGIN_FORM_ELEMENT_WIDGET_NAME, locale ?: Locale.ENGLISH)
  }

  override fun getDescription(locale: Locale?): String {
    return localize(PLUGIN_FORM_ELEMENT_WIDGET_DESC, locale ?: Locale.ENGLISH)
  }

  /** The widget classes contributed by this plugin. */
  override fun getWidgets(locale: Locale?): List<Class<out IXItemWidget>> =
      listOf(XMirror::class.java, XFunctionality::class.java)
}
