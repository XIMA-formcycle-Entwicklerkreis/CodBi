package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.localize
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.PLUGIN_FORM_DESIGNER_RESOURCE_ID
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.RESOURCE_PATH_DESIGNER_FRAME_CSS
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.RESOURCE_PATH_DESIGNER_SCRIPT
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.PLUGIN_FORM_DESIGNER_RESOURCE_DESC
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.PLUGIN_FORM_DESIGNER_RESOURCE_NAME
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.helper.IPluginFileHelper
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
import org.slf4j.LoggerFactory

/**
 * Plugin that includes an additional CSS and JavaScript resource in the form designer.
 *
 * The JavaScript adds new properties to the form tab in the properties panel on the right-hand side
 * of the form designer. This lets the user configure the code library dynamically, e.g. whether to
 * enable the code library or which configuration template to use.
 *
 * An interface to facilitate the input of functionalities and their parameter as also element
 * placeholder including information on all those elements is made possible by the data this plugin
 * provides in the global variables **window.CodbiPluginData.fileListing**,
 * **window.CodbiPluginData.fslFunctionalities** and **window.CodbiPluginData.detFunctionalities**.
 *
 * An interface to facilitate the input of CSS-Classes defined by the CodBi-Standardconfigurations
 * that're currently selected is made possible through the data this plugin provides in the global
 * variable **window.CodbiPluginData.detStandards**.
 *
 * @since 1.0.0
 */
class CodbiFormDesignerResourcePlugin : IPluginFormDesignerResource {
  /** Holds the stylesheet for this resource. */
  @Volatile private var cssResource: IResourceDescriptor? = null
  /** Holds the javascript resource for this plugin. */
  @Volatile private var jsResource: IResourceDescriptor? = null
  /** Holds the directory the **standard**-configurations reside in. */
  private val dirStandards: String = "./src/main/web/packages/form/src/js/Configurations"
  /** Accessor to the plugin's file storage. */
  private var fileHelper: IPluginFileHelper? = null

  /** Gets the name of this plugin. */
  override fun getName(): String {
    // We use a fixed string, not the name of this class via reflection
    // The class might be refactored, but the name must stay the same
    return PLUGIN_FORM_DESIGNER_RESOURCE_ID
  }

  /** Gets the display name of this plugin. */
  override fun getDisplayName(locale: Locale?): String {
    return localize(PLUGIN_FORM_DESIGNER_RESOURCE_NAME, locale ?: Locale.ENGLISH)
  }

  /** Gets the description of this plugin. */
  override fun getDescription(locale: Locale?): String {
    return localize(PLUGIN_FORM_DESIGNER_RESOURCE_DESC, locale ?: Locale.ENGLISH)
  }

  /**
   * Initializes this plugin by setting it's version and creates the necessary javascript with
   * corresponding stylesheet.
   */
  override fun initialize(initData: IPluginInitializeData?) {
    this.fileHelper = initData?.fileHelper

    val stable = initData?.manifest?.versionSemVer?.isStable ?: false
    val version =
        if (stable) initData?.manifest?.version ?: "1.0.0"
        else System.currentTimeMillis().toString()
    cssResource = createResource("designer-frame.css", RESOURCE_PATH_DESIGNER_FRAME_CSS, version)
    jsResource = createResource("designer.js", RESOURCE_PATH_DESIGNER_SCRIPT, version)
    // region Inject available standard configuration via JS defining a global variable for them.
    val fileListingString = getFileListingAsString(dirStandards)
    val fslFunctionalities =
        getFileListingAsString("./src/main/web/packages/form/src/js/Functionalities")
    val fslElementplaceholder = getFileListingAsString("./src/main/web/packages/form/src/js/EPs")
    val detFunctionalities = getDetails("./src/main/web/packages/form/src/js/Functionalities")
    val detElementplaceholder = getDetails("./src/main/web/packages/form/src/js/EPs")
    val detStandards = getDetails("./src/main/web/packages/form/src/js/Configurations")
    val localCode =
        fileHelper
            ?.pluginFolder
            ?.listFiles()
            ?.filter { it.isFile }
            ?.filter { it.name.lowercase().endsWith(".js") }
            ?.map { it.nameWithoutExtension }
            ?.joinToString(separator = ",")

    jsResource =
        createDynamicJsResource(
            "designer.js",
            RESOURCE_PATH_DESIGNER_SCRIPT,
            version,
            fileListingString,
            fslFunctionalities,
            detFunctionalities,
            fslElementplaceholder,
            detElementplaceholder,
            detStandards,
            localCode)
    // endregion Inject available standard configuration via JS defining a global variable for them.
  }

  /** Gets the designer's style. */
  override fun getCssResource(
      params: IPluginFormDesignerResourceGetResourceParams?
  ): IResourceDescriptor {
    return cssResource ?: throw IllegalStateException("Plugin not initialized")
  }

  /** Gets the designer's javascript. */
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
      fileListing: String,
      fslFunctionalities: String,
      detFunctionalities: String,
      fslElementplaceholder: String,
      detElementplaceholder: String,
      detStandards: String,
      detLocalCode: String?,
  ): IResourceDescriptor {
    val uri = URI("plugin:${PLUGIN_FORM_DESIGNER_RESOURCE_ID}/${name}?v=${version}")
    val clazz = CodbiFormDesignerResourcePlugin::class.java
    // region Retrieve original content.
    val originalJsContentStream =
        clazz.getResourceAsStream(path)
            ?: throw IllegalStateException("Resource not found in classpath: $path")
    val originalJsContent = originalJsContentStream.bufferedReader(UTF_8).use { it.readText() }
    // endregion Retrieve original content.
    val escapedFileListing =
        fileListing
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("'", "\\'")
    val escapedFslFunctionalities =
        fslFunctionalities
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("'", "\\'")
    val escapedFslElementplaceholder =
        fslElementplaceholder
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("'", "\\'")
    val escapedDetFunctionalities =
        detFunctionalities
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("'", "\\'")
    val escapedDetElementplaceholder =
        detElementplaceholder
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("'", "\\'")
    val escapedDetStandards =
        detStandards
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("'", "\\'")
    // Prepend to original file code
    val combinedJsContent =
        """
            window.CodbiPluginData                          = window.CodbiPluginData || {};
            window.CodbiPluginData.fileListing              = "$escapedFileListing";
            window.CodbiPluginData.fslFunctionalities       = "$escapedFslFunctionalities";
            window.CodbiPluginData.detFunctionalities       = JSON.parse("$escapedDetFunctionalities");
            window.CodbiPluginData.fslElementplaceholder    = "$escapedFslElementplaceholder";
            window.CodbiPluginData.detElementplaceholder    = JSON.parse("$escapedDetElementplaceholder");
            window.CodbiPluginData.detStandards             = JSON.parse("$escapedDetStandards");
            window.CodbiPluginData.docsAPI                  = window.CodbiPluginData.docsAPI || {};
            window.CodbiPluginData.docsAPI.en               = "https://waxcode.net/x/CodBi";
            window.CodbiPluginData.localCode                = "${ detLocalCode }";

            $originalJsContent
        """
            .trimIndent()

    return ByteArrayResourceDescriptor(uri, combinedJsContent.toByteArray(UTF_8), UTF_8)
  }

  /**
   * Retrieves a listing of files from [dirStandards].
   *
   * @return The name of the files contained in [dirStandards].
   */
  private fun getFileListingAsString(toGetFrom: String): String {
    val directory = File(toGetFrom)

    if (!directory.exists() || !directory.isDirectory) {
      println("WARNING: Following standard configuration directory was not found: $toGetFrom")

      return "[]"
    }

    val files = directory.listFiles()
    val fileNames =
        files
            ?.filter { it.isFile }
            ?.filter { !it.name.lowercase().endsWith(".json") }
            ?.map { it.name } ?: emptyList()

    return JSONArray(fileNames).toString()
  }

  /**
   * Retrieves the content of every .json file that corresponds to a functionality .ts file. The
   * JSON content will be mapped to the name of the functionality's name.
   *
   * @param toExtractFrom The path to the directory containing the .ts & .json functionality files.
   * @return A JSON string representing a map where keys are functionality names and values are the
   *   content of their corresponding .json files.
   */
  private fun getDetails(toExtractFrom: String): String {
    val directory = File(toExtractFrom)

    if (!directory.exists() || !directory.isDirectory) {
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .warn("Functionalities directory not found: $toExtractFrom")

      return "{}"
    }
    // region Generate JSON
    val tsFiles = directory.listFiles()?.filter { it.isFile && it.extension == "ts" } ?: emptyList()
    val combinedJsonContent = mutableMapOf<String, Any>()
    val objectMapper = ObjectMapper().registerKotlinModule()

    for (tsFile in tsFiles) {
      val fileName = tsFile.nameWithoutExtension
      val jsonFileName = "$fileName.json"
      val jsonFile = File(directory, jsonFileName)

      if (jsonFile.exists() && jsonFile.isFile) {
        try {
          combinedJsonContent[fileName] =
              objectMapper.readValue(jsonFile.readText(UTF_8), Any::class.java)
        } catch (X: Exception) {
          LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
              .error(
                  "Error reading or parsing JSON file ${ jsonFile.absolutePath }: ${ X.message }")
        }
      }
    }
    // endregion Generate JSON
    return objectMapper.writeValueAsString(combinedJsonContent)
  }
}
