package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.localize
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.DESIGNER_PROPERTY_CONFIG_TEMPLATE
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.DESIGNER_PROPERTY_CONFIG_TEMPLATE_DEFAULT
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.DESIGNER_PROPERTY_ENABLE_CODBI
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.DESIGNER_PROPERTY_ENABLE_CODBI_DEFAULT
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.DESIGNER_PROPERTY_STANDARDS
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.DESIGNER_PROPERTY_STANDARDS_DEFAULT
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.PLUGIN_FORM_PROPERTIES_EXTENSION_ID
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.PLUGIN_FORM_PROPERTIES_EXTENSION_DESC
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.PLUGIN_FORM_PROPERTIES_EXTENSION_NAME
import de.xima.fc.form.common.models.XItemPropertyDesc
import de.xima.fc.interfaces.plugin.param.form.IPluginFormPropertiesExtensionParams
import de.xima.fc.interfaces.plugin.retval.form.IPluginFormPropertiesExtensionRetVal
import de.xima.fc.plugin.interfaces.IFCRemoteSyncPlugin
import de.xima.fc.plugin.interfaces.form.IPluginFormPropertiesExtension
import java.util.*

/**
 * Plugin that makes additional form properties known to the formcycle application.
 *
 * These properties let the user configure the code library dynamically, e.g. whether to enable the
 * code library or which configuration template to use.
 *
 * @since 1.0.0
 */
class CodbiFormPropertiesExtensionPlugin : IPluginFormPropertiesExtension, IFCRemoteSyncPlugin {
  override fun getName(): String {
    // We use a fixed string, not the name of this class via reflection
    // The class might be refactored, but the name must stay the same
    return PLUGIN_FORM_PROPERTIES_EXTENSION_ID
  }

  override fun getDisplayName(locale: Locale?): String {
    return localize(PLUGIN_FORM_PROPERTIES_EXTENSION_NAME, locale ?: Locale.ENGLISH)
  }

  override fun getDescription(locale: Locale?): String {
    return localize(PLUGIN_FORM_PROPERTIES_EXTENSION_DESC, locale ?: Locale.ENGLISH)
  }

  override fun extendFormProperties(
      params: IPluginFormPropertiesExtensionParams?
  ): IPluginFormPropertiesExtensionRetVal {
    return IPluginFormPropertiesExtensionRetVal {
      listOf(
          XItemPropertyDesc(DESIGNER_PROPERTY_ENABLE_CODBI, DESIGNER_PROPERTY_ENABLE_CODBI_DEFAULT),
          XItemPropertyDesc(DESIGNER_PROPERTY_STANDARDS, DESIGNER_PROPERTY_STANDARDS_DEFAULT),
          XItemPropertyDesc(
              DESIGNER_PROPERTY_CONFIG_TEMPLATE, DESIGNER_PROPERTY_CONFIG_TEMPLATE_DEFAULT))
    }
  }
}
