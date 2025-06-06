package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.localize
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.PLUGIN_FORM_DESIGNER_RESOURCE_ID
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.RESOURCE_PATH_DESIGNER_FRAME_CSS
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.RESOURCE_PATH_DESIGNER_SCRIPT
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.PLUGIN_FORM_DESIGNER_RESOURCE_DESC
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.PLUGIN_FORM_DESIGNER_RESOURCE_NAME
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.param.form.IPluginFormDesignerResourceGetResourceParams
import de.xima.fc.interfaces.workflow.IResourceDescriptor
import de.xima.fc.plugin.interfaces.form.IPluginFormDesignerResource
import de.xima.fc.workflow.ByteArrayResourceDescriptor
import de.xima.fc.workflow.UrlResourceDescriptor
import java.io.File
import java.net.URI
import java.nio.charset.StandardCharsets.UTF_8
import java.util.*
import org.json.JSONArray

/**
 * Plugin that includes an additional CSS and JavaScript resource in the form designer.
 *
 * The JavaScript adds new properties to the form tab in the properties panel on the right-hand side
 * of the form designer. This lets the user configure the code library dynamically, e.g. whether to
 * enable the code library or which configuration template to use.
 *
 * @since 1.0.0
 */
class CodbiFormDesignerResourcePlugin : IPluginFormDesignerResource {
  @Volatile private var cssResource: IResourceDescriptor? = null
  @Volatile private var jsResource: IResourceDescriptor? = null
  private val dirStandards: String = "./src/main/web/packages/form/src/js/Configurations"

  override fun getName(): String {
    // We use a fixed string, not the name of this class via reflection
    // The class might be refactored, but the name must stay the same
    return PLUGIN_FORM_DESIGNER_RESOURCE_ID
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
    cssResource = createResource("designer-frame.css", RESOURCE_PATH_DESIGNER_FRAME_CSS, version)
    jsResource = createResource("designer.js", RESOURCE_PATH_DESIGNER_SCRIPT, version)
    // region Inject available standard configuration via JS defining a global variable for them.
    val fileListingString = getFileListingAsString()
    jsResource =
        createDynamicJsResource(
            "designer.js", RESOURCE_PATH_DESIGNER_SCRIPT, version, fileListingString)
    // endregion Inject available standard configuration via JS defining a global variable for them.
  }

  override fun getCssResource(
      params: IPluginFormDesignerResourceGetResourceParams?
  ): IResourceDescriptor {
    return cssResource ?: throw IllegalStateException("Plugin not initialized")
  }

  override fun getJavaScriptResource(
      params: IPluginFormDesignerResourceGetResourceParams?
  ): IResourceDescriptor {
    return jsResource ?: throw IllegalStateException("Plugin not initialized")
  }

  /**
   * Creates the resource descriptor for a CSS or JavaScript resource.
   *
   * This is one of the resources that were created by the `src/main/web/packages/designer` frontend
   * project build.
   *
   * @param name File name of the resource. This is used by formcycle to create a URL to the
   *   resource.
   * @param path Internal path of the resource, must point to an existing resource in the class path
   *   of this plugin JAR. This is used to read the content of the resource.
   * @return The resource descriptor for the resource.
   */
  private fun createResource(name: String, path: String, version: String): IResourceDescriptor {
    val uri = URI("plugin:${PLUGIN_FORM_DESIGNER_RESOURCE_ID}/${name}?v=${version}")
    val clazz = CodbiFormDesignerResourcePlugin::class.java

    return UrlResourceDescriptor.forClasspathResource(clazz, path, uri, UTF_8)
  }

  /**
   * Creates a dynamic JavaScript resource by reading an existing JS file and prepending a global
   * variable containing the file listing.
   */
  private fun createDynamicJsResource(
      name: String,
      path: String,
      version: String,
      fileListing: String
  ): IResourceDescriptor {
    val uri = URI("plugin:${PLUGIN_FORM_DESIGNER_RESOURCE_ID}/${name}?v=${version}")
    val clazz = CodbiFormDesignerResourcePlugin::class.java
    // #region Retrieve original content.
    val originalJsContentStream =
        clazz.getResourceAsStream(path)
            ?: throw IllegalStateException("Resource not found in classpath: $path")
    val originalJsContent = originalJsContentStream.bufferedReader(UTF_8).use { it.readText() }
    // #endregion Retrieve original content.
    val escapedFileListing =
        fileListing
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("'", "\\'")
    // Prepend to original file code
    val combinedJsContent =
        """
            window.CodbiPluginData = window.CodbiPluginData || {};
            window.CodbiPluginData.fileListing = "$escapedFileListing";
            $originalJsContent
        """
            .trimIndent()

    return ByteArrayResourceDescriptor(uri, combinedJsContent.toByteArray(UTF_8), UTF_8)
  }

  /**
   * Retrieves a listing of files from [dirStandards].
   *
   * @return The name of the files contained in [dirStandards].]
   */
  private fun getFileListingAsString(): String {
    val directory = File(dirStandards)

    if (!directory.exists() || !directory.isDirectory) {
      println("WARNING: Following standard configuration directory was not found: ${dirStandards}")

      return "[]"
    }

    val files = directory.listFiles()
    val fileNames = files?.filter { it.isFile }?.map { it.name } ?: emptyList()

    return JSONArray(fileNames).toString()
  }
}
