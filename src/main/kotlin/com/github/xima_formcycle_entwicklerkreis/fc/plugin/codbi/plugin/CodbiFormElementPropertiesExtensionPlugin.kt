package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.localize
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.DESIGNER_ELEMENT_PROPERTY_FUNCS
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.DESIGNER_ELEMENT_PROPERTY_FUNCS_NAME
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.PLUGIN_FORM_ELEMENT_PROPERTIES_EXTENSION_ID
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.PLUGIN_FORM_ELEMENT_PROPERTIES_EXTENSION_DESC
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.PLUGIN_FORM_ELEMENT_PROPERTIES_EXTENSION_NAME
import de.xima.fc.form.common.models.XItemPropertyDesc
import de.xima.fc.interfaces.plugin.param.form.IPluginFormElementPropertiesExtensionParams
import de.xima.fc.interfaces.plugin.retval.form.IPluginFormElementPropertiesExtensionRetVal
import de.xima.fc.plugin.interfaces.IFCRemoteSyncPlugin
import de.xima.fc.plugin.interfaces.form.IPluginFormElementPropertiesExtension
import java.util.*

/**
 * Plugin that makes additional form element properties known to the formcycle application.
 *
 * It exposes a CodBi configuration property on EVERY form element in the designer. The designer
 * renders a "CodBi" category in the element properties panel (right side) where the user can pick
 * functionalities and parameters that are written directly onto that element via `data-cb-func` /
 * `data-cb-*` attributes.
 *
 * @since 1.0.0
 */
class CodbiFormElementPropertiesExtensionPlugin :
    IPluginFormElementPropertiesExtension, IFCRemoteSyncPlugin {
  override fun getName(): String {
    // We use a fixed string, not the name of this class via reflection.
    // The class might be refactored, but the name must stay the same.
    return PLUGIN_FORM_ELEMENT_PROPERTIES_EXTENSION_ID
  }

  override fun getDisplayName(locale: Locale?): String {
    return localize(PLUGIN_FORM_ELEMENT_PROPERTIES_EXTENSION_NAME, locale ?: Locale.ENGLISH)
  }

  override fun getDescription(locale: Locale?): String {
    return localize(PLUGIN_FORM_ELEMENT_PROPERTIES_EXTENSION_DESC, locale ?: Locale.ENGLISH)
  }

  override fun extendExistingElement(
      params: IPluginFormElementPropertiesExtensionParams?
  ): IPluginFormElementPropertiesExtensionRetVal {
    return IPluginFormElementPropertiesExtensionRetVal {
      listOf(
          XItemPropertyDesc(DESIGNER_ELEMENT_PROPERTY_FUNCS, ""),
          XItemPropertyDesc(DESIGNER_ELEMENT_PROPERTY_FUNCS_NAME, ""))
    }
  }
}
