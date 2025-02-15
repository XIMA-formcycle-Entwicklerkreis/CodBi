package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import de.xima.fc.interfaces.plugin.param.form.IPluginFormRenderCallbackOnAfterRenderFormParams
import de.xima.fc.interfaces.plugin.retval.form.IPluginFormRenderCallbackOnAfterRenderFormRetVal
import de.xima.fc.plugin.form.IFormRenderPluginCallback

/**
 * A form render callback invoked after formcycle finished creating the HTML for a form.
 *
 * Inspects the form settings with regard to the configured code library settings. If the code
 * library was enabled in the designer, adds the required CSS and JavaScript resources to the form.
 *
 * Also, if the code library was enabled, the user can configure additional settings such as the
 * configuration template to use. This render callback also adjusts the form to reflect these
 * settings.
 *
 * @since 1.0.0
 */
internal object FormRenderCallback : IFormRenderPluginCallback {
  /**
   * Checks if the code library was enabled, and if so, takes the appropriate actions.
   *
   * @param params The parameters of the form render callback, as provided by formcycle.
   * @return Always null, we only mutate the form in-place.
   */
  override fun onAfterRenderForm(
      params: IPluginFormRenderCallbackOnAfterRenderFormParams?
  ): IPluginFormRenderCallbackOnAfterRenderFormRetVal? {
    val properties = params?.xForm?.formProperties?.let { CodbiFormProperties(it) }
    val renderProcessor = params?.let { FormRenderProcessor(it) }
    if (renderProcessor != null && properties?.enabled == true) {
      processCodeLib(renderProcessor, properties)
    }
    return null
  }

  /**
   * Called when the code library was enabled. Inserts the required CSS and JavaScript resources;
   * and also takes the appropriate actions for the additional settings, such as adding data
   * attributes etc.
   */
  private fun processCodeLib(
      renderProcessor: FormRenderProcessor,
      properties: CodbiFormProperties
  ) {
    // Insert the main CSS and JavaScript for the code library
    renderProcessor.insertFormResourcePluginScript("codbi-script", "codbi.js")
    renderProcessor.insertFormResourcePluginStyle("codbi-style", "codbi.css")

    // Insert the JavaScript for the selected configuration template
    properties.configTemplate.run {
      renderProcessor.insertFormResourcePluginScript(
          "codbi-config-template", "config-template-${this.value}.js")
    }
  }
}
