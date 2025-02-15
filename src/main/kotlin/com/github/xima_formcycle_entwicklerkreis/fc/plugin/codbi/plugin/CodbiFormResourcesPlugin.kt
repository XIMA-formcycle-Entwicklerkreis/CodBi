package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.localize
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.CodbiConfigTemplate
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.PLUGIN_FORM_RESOURCES_ID
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.RESOURCE_PATH_CODBI_CONFIG_TEMPLATE_SCRIPT
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.RESOURCE_PATH_CODBI_CSS
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.RESOURCE_PATH_CODBI_SCRIPT
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.PLUGIN_FORM_DESIGNER_RESOURCE_DESC
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.PLUGIN_FORM_DESIGNER_RESOURCE_NAME
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.param.form.IPluginFormResourcesParams
import de.xima.fc.interfaces.plugin.retval.form.IPluginFormResourceDescriptor
import de.xima.fc.plugin.interfaces.form.IPluginFormResources
import de.xima.fc.plugin.models.retval.form.DefaultPluginFormResourceDescriptor
import de.xima.fc.workflow.UrlResourceDescriptor
import java.net.URI
import java.nio.charset.StandardCharsets.UTF_8
import java.util.*

/**
 * Plugin that provides the frontend resources for the form designer to web forms.
 *
 * @since 1.0.0
 */
class CodbiFormResourcesPlugin : IPluginFormResources {
  internal companion object {
    @Volatile var formResources: Map<String, IPluginFormResourceDescriptor> = emptyMap()
  }

  override fun getName(): String {
    // We use a fixed string, not the name of this class via reflection
    // The class might be refactored, but the name must stay the same
    return PLUGIN_FORM_RESOURCES_ID
  }

  override fun getDisplayName(locale: Locale?): String {
    return localize(PLUGIN_FORM_DESIGNER_RESOURCE_NAME, locale ?: Locale.ENGLISH)
  }

  override fun getDescription(locale: Locale?): String {
    return localize(PLUGIN_FORM_DESIGNER_RESOURCE_DESC, locale ?: Locale.ENGLISH)
  }

  override fun initialize(initData: IPluginInitializeData?) {
    val stable = initData?.manifest?.versionSemVer?.isStable ?: false
    val version =
        if (stable) initData?.manifest?.version ?: "1.0.0"
        else System.currentTimeMillis().toString()
    formResources =
        mapOf(
            formResourceDescriptor("codbi.js", RESOURCE_PATH_CODBI_SCRIPT, version),
            formResourceDescriptor("codbi.css", RESOURCE_PATH_CODBI_CSS, version),
            *createConfigTemplateResourceDescriptors(version))
  }

  override fun shutdown(shutdownData: IPluginShutdownData?) {
    formResources = emptyMap()
  }

  override fun getResources(
      params: IPluginFormResourcesParams?
  ): Map<String, IPluginFormResourceDescriptor> {
    return formResources
  }

  /**
   * Creates the JavaScript form resources for each available configuration template. These files
   * were created by the `src/main/web/packages/form` frontend project build.
   *
   * @param version The version of the resources, i.e. the version of this plugin. This is used for
   *   caching purposes.
   * @return A list of pairs, each pair with the name and the resource descriptor for the
   *   configuration template.
   */
  private fun createConfigTemplateResourceDescriptors(
      version: String
  ): Array<Pair<String, IPluginFormResourceDescriptor>> {
    return CodbiConfigTemplate.entries
        .map {
          formResourceDescriptor(
              "config-template-${it.value}.js",
              RESOURCE_PATH_CODBI_CONFIG_TEMPLATE_SCRIPT.format(it.value),
              version)
        }
        .toTypedArray()
  }

  /**
   * Creates the form resource descriptor for a CSS or JavaScript resource contained in this plugin
   * JAR file. This is one of the files that were created by the `src/main/web/packages/form`
   * frontend project build.
   *
   * @param name The file name of the resource (can be a path such as `subfolder/resource.js`). This
   *   is the name formcycle will use to create the URL to the resource.
   * @param path The internal path to the resource within the class path of this plugin JAR file.
   *   This is used to read and provide the contents of the resource.
   * @param version The version of the resource, i.e. the version of this plugin. This is used for
   *   caching purposes.
   * @return A pair with the name and the resource descriptor for the given resource.
   */
  private fun formResourceDescriptor(
      name: String,
      path: String,
      version: String
  ): Pair<String, IPluginFormResourceDescriptor> {
    val resource =
        UrlResourceDescriptor.forClasspathResource(
            CodbiFormDesignerResourcePlugin::class.java,
            path,
            URI("plugin:${PLUGIN_FORM_RESOURCES_ID}/${name}?v=${version}"),
            UTF_8,
        )
    val mimeType =
        when {
          name.endsWith(".js") -> "text/javascript"
          name.endsWith(".css") -> "text/css"
          else -> "application/octet-stream"
        }
    val descriptor =
        DefaultPluginFormResourceDescriptor.builder()
            .fileName(name)
            .mimeType(mimeType)
            .resource(resource)
            .includeInForm(false)
            .build()
    return name to descriptor
  }
}
