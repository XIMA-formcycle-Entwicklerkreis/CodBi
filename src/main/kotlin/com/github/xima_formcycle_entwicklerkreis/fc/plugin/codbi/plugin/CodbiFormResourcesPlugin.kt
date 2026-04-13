package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.localize
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.PLUGIN_FORM_RESOURCES_ID
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.RESOURCE_PATH_CODBI_CSS
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.RESOURCE_PATH_CODBI_SCRIPT
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.*
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeValidationResult
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginValidationData
import de.xima.fc.interfaces.plugin.param.form.IPluginFormResourcesParams
import de.xima.fc.interfaces.plugin.retval.form.IPluginFormResourceDescriptor
import de.xima.fc.plugin.interfaces.IFCRemoteSyncPlugin
import de.xima.fc.plugin.interfaces.form.IPluginFormResources
import de.xima.fc.plugin.models.retval.form.DefaultPluginFormResourceDescriptor
import de.xima.fc.workflow.ByteArrayResourceDescriptor
import de.xima.fc.workflow.UrlResourceDescriptor
import java.io.IOException // Neu: Für IOException
import java.net.URI
import java.nio.charset.StandardCharsets.UTF_8
import java.util.*
import java.util.jar.JarInputStream // Neu: Für das Scannen des JARs
import java.util.logging.Logger // Neu: Für Logging
import java.util.zip.ZipEntry // Neu: Für ZIP-Einträge

/**
 * Plugin that provides the frontend resources for the form designer to web forms.
 *
 * @since 1.0.0
 */
class CodbiFormResourcesPlugin : IPluginFormResources, IFCRemoteSyncPlugin {
  internal companion object {
    @Volatile var formResources: Map<String, IPluginFormResourceDescriptor> = emptyMap()
    private val LOG: Logger = Logger.getLogger(CodbiFormResourcesPlugin::class.java.name)
    private const val BASE_RESOURCE_PACKAGE =
        "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/"
  }

  override fun getName(): String {
    // We use a fixed string, not the name of this class via reflection
    // The class might be refactored, but the name must stay the same
    return PLUGIN_FORM_RESOURCES_ID
  }

  override fun getDisplayName(locale: Locale?): String {
    return localize(PLUGIN_FORM_RESOURCES_NAME, locale ?: Locale.ENGLISH)
  }

  override fun getDescription(locale: Locale?): String {
    return localize(PLUGIN_FORM_RESOURCES_DESC, locale ?: Locale.ENGLISH)
  }

  // region Tenant scope validation
  /**
   * Rejects tenant-level installation. CodBi must be installed as a **system plugin** because its
   * AI services bind local server ports that would conflict across tenants.
   */
  override fun validateConfigurationData(
      configData: IPluginValidationData
  ): IPluginInitializeValidationResult? {
    if (configData.client != null) {
      return object : IPluginInitializeValidationResult {
        override fun isValid() = false

        override fun getErrorMessages() =
            listOf("CodBi must be installed as a system plugin, not as a tenant plugin.")
      }
    }
    return null
  }

  // endregion Tenant scope validation

  /**
   * Registers all JS & CSS files from the **BASE_RESOURCE_PACKAGE** properly.
   *
   * @param initData As provided by the framework.
   */
  override fun initialize(initData: IPluginInitializeData?) {
    val stable = initData?.manifest?.versionSemVer?.isStable ?: false
    val version =
        if (stable) initData?.manifest?.version ?: "1.0.0"
        else System.currentTimeMillis().toString()
    val dynamicResources =
        mapOf(
                "LDAPSettings.js" to
                    createLDAPJsDescriptor(
                        initData?.properties?.getProperty("LDAP_URL") ?: "",
                        initData?.properties?.getProperty("LDAP_URL_BACKEND") ?: ""),
                "MatomoSettings.js" to
                    createMatomoJsDescriptor(
                        initData?.properties?.getProperty("Matomo_SiteID") ?: "",
                        initData?.properties?.getProperty("Matomo_URL") ?: ""),
                formResourceDescriptor("codbi.js", RESOURCE_PATH_CODBI_SCRIPT, version),
                formResourceDescriptor("codbi.css", RESOURCE_PATH_CODBI_CSS, version),
                formResourceDescriptor(
                    "config-template-default.js", RESOURCE_PATH_CODBI_SCRIPT, version),
                formResourceDescriptor(
                    "config-template-xtensible.js", RESOURCE_PATH_CODBI_SCRIPT, version))
            .toMutableMap()

    try {
      val classLoader = CodbiFormResourcesPlugin::class.java.classLoader
      val baseUrl = classLoader.getResource(BASE_RESOURCE_PACKAGE)

      if (baseUrl != null && baseUrl.protocol == "jar") { // If running from within a JAR...
        val jarPath = baseUrl.path.substring(5, baseUrl.path.indexOf("!"))
        val jarFile = java.io.File(jarPath)

        JarInputStream(jarFile.inputStream()).use { jarIs ->
          var entry: ZipEntry?

          while (jarIs.nextEntry.also { entry = it } != null) {
            val entryName = entry!!.name

            if (entryName.startsWith(BASE_RESOURCE_PACKAGE) && !entry!!.isDirectory) {
              val relativePath = entryName.substring(BASE_RESOURCE_PACKAGE.length)

              if (relativePath.endsWith(".js") || relativePath.endsWith(".css")) {
                dynamicResources[relativePath] =
                    formResourceDescriptor(relativePath, entryName, version).second

                LOG.info("Registered plugin resource: $relativePath")
              }
            }
          }
        }
      } else if (baseUrl != null && baseUrl.protocol == "file") { // If running on a filesystem...
        val baseDir = java.io.File(baseUrl.toURI())

        baseDir.walkTopDown().forEach { file ->
          if (file.isFile) {
            val relativePath =
                baseDir
                    .toPath()
                    .relativize(file.toPath())
                    .toString()
                    .replace("\\", "/") // Take windows path syntax into account.

            if (relativePath.endsWith(".js") || relativePath.endsWith(".css")) {
              dynamicResources[relativePath] =
                  formResourceDescriptor(
                          relativePath, BASE_RESOURCE_PACKAGE + relativePath, version)
                      .second

              LOG.info("Registered plugin resource (dev): $relativePath")
            }
          }
        }
      } else {
        LOG.warning("Unable to determine resource base URL protocol for $BASE_RESOURCE_PACKAGE")
      }
    } catch (X: IOException) {
      LOG.severe("Failed to scan plugin resources due to: ${X.message}")
    }

    formResources = dynamicResources
  }

  override fun shutdown(shutdownData: IPluginShutdownData?) {
    formResources = emptyMap()
  }

  override fun getResources(
      params: IPluginFormResourcesParams?
  ): Map<String, IPluginFormResourceDescriptor> {
    val matomoSiteId = "10"
    val matomoUrl = "https://analytics.example.com/"

    // 2. Generate the dynamic resource descriptor for the Matomo settings variable
    val matomoSettingsDescriptor = createMatomoJsDescriptor(matomoSiteId, matomoUrl)
    return formResources +
        ("MatomoSetting.js" to
            matomoSettingsDescriptor /*createSiteIdJsDescriptor(params?.javaClass?.getResource("Matomo_SiteID").toString(),params?.javaClass?.getResource("Matomo_URL").toString())*/)
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
            CodbiFormResourcesPlugin::class.java,
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

  /**
   * Creates a dynamic JS-Resource that writes the Matomo-Settings within the Plugin-Config
   * (**Matomo_SiteID** & **Matomo_URL**) into **window.codbi.Matomo.SiteID & -URL**.
   *
   * @param siteID The Matomo Site-ID to use for tracking.
   * @param url The URL to use for tracking.
   * @return The appropriate [IPluginFormResourceDescriptor].
   */
  private fun createMatomoJsDescriptor(siteID: String, url: String): IPluginFormResourceDescriptor {
    val safeSiteIdValue = siteID.replace("\"", "\\\"")
    val safeURLValue = url.replace("\"", "\\\"")
    val jsContent =
        "window.codbiSettings = window.codbiSettings || {}; window.codbiSettings.Matomo = window.codbiSettings.Matomo || {}; window.codbiSettings.Matomo.SiteID = \"${safeSiteIdValue}\"; window.codbiSettings.Matomo.URL = \"${safeURLValue}\";"
    val resource =
        ByteArrayResourceDescriptor(
            URI("plugin:${PLUGIN_FORM_RESOURCES_ID}/MatomoSettings.js?v=dynamic"),
            jsContent.toByteArray(UTF_8),
            UTF_8)

    return DefaultPluginFormResourceDescriptor.builder()
        .fileName("MatomoSettings.js")
        .mimeType("text/javascript")
        .resource(resource)
        .includeInForm(true)
        .build()
  }

  /**
   * Creates a dynamic JS-Resource that writes the LDAP-Settings within the Plugin-Config
   * (**LDAP_URL** & **LDAP_URL_BACKEND**) into **window.codbiSettings.LDAP.URL** &
   * **window.codbiSettings.LDAP.URL_BACKEND**.
   *
   * @param url The frontend URL of the Formcycle LDAP Request to use if no other has been
   *   specified.
   * @param urlBackend The backend URL of the Formcycle LDAP Request for backend-domain access.
   * @return The appropriate [IPluginFormResourceDescriptor].
   */
  private fun createLDAPJsDescriptor(
      url: String,
      urlBackend: String
  ): IPluginFormResourceDescriptor {
    val safeURLValue = url.replace("\"", "\\\"")
    val safeURLBackendValue = urlBackend.replace("\"", "\\\"")
    val jsBuilder =
        StringBuilder(
            "window.codbiSettings = window.codbiSettings || {}; window.codbiSettings.LDAP = window.codbiSettings.LDAP || {};")
    if (safeURLValue.isNotBlank()) {
      jsBuilder.append(" window.codbiSettings.LDAP.URL = \"${safeURLValue}\";")
    }
    if (safeURLBackendValue.isNotBlank()) {
      jsBuilder.append(" window.codbiSettings.LDAP.URL_BACKEND = \"${safeURLBackendValue}\";")
    }
    val jsContent = jsBuilder.toString()
    val resource =
        ByteArrayResourceDescriptor(
            URI("plugin:${PLUGIN_FORM_RESOURCES_ID}/LDAPSettings.js?v=dynamic"),
            jsContent.toByteArray(UTF_8),
            UTF_8)

    return DefaultPluginFormResourceDescriptor.builder()
        .fileName("LDAPSettings.js")
        .mimeType("text/javascript")
        .resource(resource)
        .includeInForm(true)
        .build()
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
  private fun templateFormResourceDescriptor(
      name: String,
      path: String,
      version: String
  ): Pair<String, IPluginFormResourceDescriptor> {
    val resource =
        UrlResourceDescriptor.forClasspathResource(
            CodbiFormResourcesPlugin::class.java,
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
