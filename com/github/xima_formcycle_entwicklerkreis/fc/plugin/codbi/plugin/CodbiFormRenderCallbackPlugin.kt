package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.localize
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.FormRenderCallback
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.PLUGIN_FORM_RENDER_CALLBACK_ID
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.PLUGIN_FORM_RENDER_CALLBACK_DESC
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.PLUGIN_FORM_RENDER_CALLBACK_NAME
import de.xima.fc.plugin.form.IFormRenderPluginCallback
import de.xima.fc.plugin.interfaces.IFCRemoteSyncPlugin
import de.xima.fc.plugin.interfaces.form.IPluginFormRenderCallback
import java.util.*

/**
 * Plugin that hooks into the form rendering process.
 *
 * Adds the code library as a script tag when the code library was enabled in the form designer.
 *
 * @since 1.0.0
 */
class CodbiFormRenderCallbackPlugin : IPluginFormRenderCallback, IFCRemoteSyncPlugin {
  override fun getName(): String {
    // We use a fixed string, not the name of this class via reflection
    // The class might be refactored, but the name must stay the same
    return PLUGIN_FORM_RENDER_CALLBACK_ID
  }

  override fun getDisplayName(locale: Locale?): String {
    return localize(PLUGIN_FORM_RENDER_CALLBACK_NAME, locale ?: Locale.ENGLISH)
  }

  override fun getDescription(locale: Locale?): String {
    return localize(PLUGIN_FORM_RENDER_CALLBACK_DESC, locale ?: Locale.ENGLISH)
  }

  override fun createCallbacks(): Iterable<IFormRenderPluginCallback> {
    return listOf(FormRenderCallback)
  }
}
