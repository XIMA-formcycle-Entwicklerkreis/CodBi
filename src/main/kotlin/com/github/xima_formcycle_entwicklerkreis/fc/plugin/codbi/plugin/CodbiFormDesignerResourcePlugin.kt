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
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.URI
import java.nio.charset.StandardCharsets.UTF_8
import java.util.*
import java.util.stream.Collectors
import org.json.JSONArray
import org.slf4j.LoggerFactory

/**
 * Plugin that includes an additional CSS and JavaScript resource in the form designer.
 *
 * @since 1.0.0
 */
class CodbiFormDesignerResourcePlugin : IPluginFormDesignerResource {

  /** Holds the stylesheet for this resource. */
  @Volatile private var cssResource: IResourceDescriptor? = null

  /** Holds the javascript resource for this plugin. */
  @Volatile private var jsResource: IResourceDescriptor? = null

  /** Accessor to the plugin's file storage. */
  private var fileHelper: IPluginFileHelper? = null

  private val resourceRoot = "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi"

  override fun getName(): String {
    return PLUGIN_FORM_DESIGNER_RESOURCE_ID
  }

  override fun getDisplayName(locale: Locale?): String {
    return localize(PLUGIN_FORM_DESIGNER_RESOURCE_NAME, locale ?: Locale.ENGLISH)
  }

  override fun getDescription(locale: Locale?): String {
    return localize(PLUGIN_FORM_DESIGNER_RESOURCE_DESC, locale ?: Locale.ENGLISH)
  }

  override fun initialize(initData: IPluginInitializeData?) {
    this.fileHelper = initData?.fileHelper

    val stable = initData?.manifest?.versionSemVer?.isStable ?: false
    val version =
        if (stable) initData?.manifest?.version ?: "1.0.0"
        else System.currentTimeMillis().toString()

    cssResource = createResource("designer-frame.css", RESOURCE_PATH_DESIGNER_FRAME_CSS, version)
    jsResource = createResource("designer.js", RESOURCE_PATH_DESIGNER_SCRIPT, version)

    // region Inject available standard configuration via JS defining a global variable for them.
    val fileListing = getFileListingAsString("$resourceRoot/Configurations")
    val fslFunctionalities = getFileListingAsString("$resourceRoot/Functionalities")
    val fslElementplaceholder = getFileListingAsString("$resourceRoot/EPs")
    val detFunctionalities = getDetails("$resourceRoot/Functionalities")
    val detElementplaceholder = getDetails("$resourceRoot/EPs")
    val detStandards = getDetails("$resourceRoot/Configurations")
    val localCode = "ddd:" + fileHelper?.pluginFolder?.name

    // Collect Docs_Frontend_XX plugin properties → docsAPI language map.
    val docsApiUrls = mutableMapOf<String, String>()
    docsApiUrls["en"] = "https://codbi.pages.dev"
    initData?.properties?.stringPropertyNames()?.forEach { key ->
      if (key.startsWith("Docs_Frontend_", ignoreCase = true) && key.length > 14) {
        val lang = key.substring(14).lowercase()
        val url = initData.properties.getProperty(key)?.trim()
        if (!url.isNullOrBlank() && lang.matches(Regex("[a-z]{2}"))) {
          docsApiUrls[lang] = url
        }
      }
    }

    jsResource =
        createDynamicJsResource(
            "designer.js",
            RESOURCE_PATH_DESIGNER_SCRIPT,
            version,
            fileListing,
            fslFunctionalities,
            detFunctionalities,
            fslElementplaceholder,
            detElementplaceholder,
            detStandards,
            localCode,
            docsApiUrls)
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

  private fun createResource(name: String, path: String, version: String): IResourceDescriptor {
    val uri = URI("plugin:${PLUGIN_FORM_DESIGNER_RESOURCE_ID}/${name}?v=${version}")
    val clazz = CodbiFormDesignerResourcePlugin::class.java
    return UrlResourceDescriptor.forClasspathResource(clazz, path, uri, UTF_8)
  }

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
      docsApiUrls: Map<String, String> = mapOf("en" to "https://codbi.pages.dev"),
  ): IResourceDescriptor {
    val uri = URI("plugin:${PLUGIN_FORM_DESIGNER_RESOURCE_ID}/${name}?v=${version}")
    val clazz = CodbiFormDesignerResourcePlugin::class.java

    val originalJsContentStream =
        clazz.getResourceAsStream(path)
            ?: throw IllegalStateException("Resource not found in classpath: $path")
    val originalJsContent = originalJsContentStream.bufferedReader(UTF_8).use { it.readText() }

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
${docsApiUrls.entries.joinToString("\n") { (lang, url) ->
    val safeUrl = url.replace("\\", "\\\\").replace("\"", "\\\"")
    "            window.CodbiPluginData.docsAPI.${lang}               = \"${safeUrl}\";"
}}
            window.CodbiPluginData.localCode                = "$detLocalCode";

            $originalJsContent
        """
            .trimIndent()

    return ByteArrayResourceDescriptor(uri, combinedJsContent.toByteArray(UTF_8), UTF_8)
  }

  private fun getFileListingAsString(toGetFrom: String): String {
    val classLoader = CodbiFormDesignerResourcePlugin::class.java.classLoader
    val files =
        try {
          val isr = InputStreamReader(classLoader.getResourceAsStream(toGetFrom) ?: return "[]")
          BufferedReader(isr).use { it.lines().collect(Collectors.toList()) }
        } catch (e: Exception) {
          LoggerFactory.getLogger(CodbiFormDesignerResourcePlugin::class.java)
              .warn("Directory '$toGetFrom' not found in classpath. Error: ${e.message}")
          return "[]"
        }

    val fileNames =
        files
            .filter {
              it.endsWith(".js") &&
                  !it.endsWith(".json") &&
                  !it.endsWith(".json.js") &&
                  !it.startsWith("chunk")
            }
            .map { it }
    return JSONArray(fileNames).toString()
  }

  private fun getDetails(toExtractFrom: String): String {
    val objectMapper = ObjectMapper().registerKotlinModule()
    val combinedJsonContent = mutableMapOf<String, Any>()
    val classLoader = CodbiFormDesignerResourcePlugin::class.java.classLoader
    if (classLoader.getResource(toExtractFrom) == null) {
      return "{\"problem\":\"directory not found\"}"
    }

    val filesInJar =
        try {
          InputStreamReader(
                  classLoader.getResourceAsStream(toExtractFrom)
                      ?: return "{\"problem\":\"directory not found\"}")
              .useLines { it.toList() }
        } catch (e: Exception) {
          LoggerFactory.getLogger(CodbiFormDesignerResourcePlugin::class.java)
              .warn("Error reading resource directory: $toExtractFrom, Error: ${e.message}")
          return "{\"problem\":\"directory not found\"}"
        }
    LoggerFactory.getLogger(CodbiFormDesignerResourcePlugin::class.java)
        .error("Files in JAR(" + toExtractFrom + ")" + filesInJar)
    val tsFileNames = filesInJar.filter { !it.startsWith("CHUNK") && it.endsWith(".js") }
    LoggerFactory.getLogger(CodbiFormDesignerResourcePlugin::class.java)
        .error("Files in JAR TS(" + tsFileNames + ")" + filesInJar)
    for (tsFileName in tsFileNames) {
      val jsonFileName = "${tsFileName.substringBeforeLast('.')}.json"
      val jsonResourcePath = "$toExtractFrom/$jsonFileName"
      val jsonStream = classLoader.getResourceAsStream(jsonResourcePath)
      LoggerFactory.getLogger(CodbiFormDesignerResourcePlugin::class.java)
          .error("JSON Stream for ${jsonFileName}" + jsonStream)
      if (jsonStream != null) {
        try {
          combinedJsonContent[tsFileName.substringBeforeLast('.')] =
              objectMapper.readValue(jsonStream, Any::class.java)
        } catch (x: Exception) {
          LoggerFactory.getLogger(CodbiFormDesignerResourcePlugin::class.java)
              .error(
                  "Error reading or parsing JSON from classpath resource '$jsonResourcePath': ${x.message}")
        }
      }
    }
    LoggerFactory.getLogger(CodbiFormDesignerResourcePlugin::class.java)
        .error("X:" + combinedJsonContent)
    return objectMapper.writeValueAsString(combinedJsonContent)
  }
}
