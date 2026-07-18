package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.exception.FCPluginException
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.nio.charset.StandardCharsets
import java.nio.file.Files
import java.util.*

/**
 * This servlet retrieves a resource form within it's JAR or from an external override directory.
 *
 * The **Path**-URL-Parameter specifies the path within the JAR to retrieve the file from as also
 * the file's name.
 *
 * If there's no **Path** specified following will be used:
 * /com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg.
 *
 * ## External Override
 * If the system property **CodBi_ExternalResourceDir** is set or the plugin property
 * **ExternalResourceDir** is configured, the servlet checks that directory first before falling
 * back to the classpath. This allows updating resources (e.g. TinyMCE) at runtime without
 * redeploying the JAR.
 */
class Resource : IPluginServletAction {
  companion object {
    private const val SVG_RESOURCE_PATH =
        "/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg"
    private const val ALLOWED_PREFIX = "/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/"
    private const val CONTENT_TYPE_SVG = "image/svg+xml"
    private const val CONTENT_TYPE_PLAIN = "text/plain"
    private const val CACHE_CONTROL_HEADER = "public, max-age=31536000"
    private const val SYSTEM_PROP_EXTERNAL_DIR = "CodBi_ExternalResourceDir"

    /** The external override directory, or null if not configured. */
    @Volatile
    var externalResourceDir: String? = null
      private set

    /**
     * Sets the external resource override directory. Called during plugin initialization.
     *
     * @param dir The absolute path to the external resource directory, or null to disable.
     */
    fun setExternalResourceDir(dir: String?) {
      externalResourceDir = dir
    }
  }

  private val availableMimeTypes =
      mapOf(
          "svg" to "image/svg+xml",
          "png" to "image/png",
          "jpg" to "image/jpeg",
          "jpeg" to "image/jpeg",
          "gif" to "image/gif",
          "css" to "text/css",
          "js" to "application/javascript",
          "html" to "text/html",
          "json" to "application/json",
          "xml" to "application/xml",
          "txt" to "text/plain",
          "pdf" to "application/pdf",
          "ico" to "image/x-icon")

  /** Returns "Resource" */
  override fun getName(): String {
    return "Resource"
  }

  /**
   * Retrieves the content-type to server for the file at the specified **path** using the available
   * [availableMimeTypes].
   *
   * @param path The path to the resource.
   * @return The corresponding mime-type, or "application/octet-stream" if the extension is not in
   *   [availableMimeTypes].
   */
  private fun getContentType(path: String): String {
    val extension = path.substringAfterLast('.', "").lowercase(Locale.ROOT)

    return availableMimeTypes[extension] ?: "application/octet-stream"
  }

  /**
   * Retrieves the file using the provided **Path**-URL-Parameter or
   * /com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg, if none was
   * provided.
   *
   * Tries the external override directory first (if configured), then falls back to the classpath.
   */
  public override fun execute(p0: IPluginServletActionParams): IPluginServletActionRetVal {
    try {
      val requestedPath = p0.requestParameters["Path"]?.first() ?: SVG_RESOURCE_PATH

      if (!requestedPath.startsWith(ALLOWED_PREFIX) || requestedPath.contains("..")) {
        val errorResponse =
            ServletResponse(EResponseType.HTML).apply {
              httpStatusCode = HttpURLConnection.HTTP_FORBIDDEN
              contentType = CONTENT_TYPE_PLAIN
              value = "Forbidden: invalid resource path"
              encoding = StandardCharsets.UTF_8.name()
            }

        return PluginServletActionRetVal(errorResponse)
      }

      // #region Compute relative path within the codbi resource tree
      // Strip the ALLOWED_PREFIX to get the relative path (e.g. "tinymce/tinymce.min.js")
      val relativePath = requestedPath.substring(ALLOWED_PREFIX.length)
      // #endregion Compute relative path within the codbi resource tree

      // #region Try external override directory first
      val externalDirPath = externalResourceDir ?: System.getProperty(SYSTEM_PROP_EXTERNAL_DIR)

      if (externalDirPath != null && externalDirPath.isNotBlank()) {
        val externalFile = File(externalDirPath, relativePath)

        if (externalFile.exists() && externalFile.isFile) {
          val fileBytes = Files.readAllBytes(externalFile.toPath())

          val successResponse =
              ServletResponse(EResponseType.SHOW_FILE).apply {
                httpStatusCode = HttpURLConnection.HTTP_OK
                contentType = getContentType(relativePath)
                binValue = fileBytes
                httpHeader = Collections.singletonMap("Cache-Control", CACHE_CONTROL_HEADER)
              }

          return PluginServletActionRetVal(successResponse)
        }
      }
      // #endregion Try external override directory first

      // #region Fall back to classpath resource from JAR
      val svgInputStream = javaClass.getResourceAsStream(requestedPath)

      if (svgInputStream == null) {
        val errorResponse =
            ServletResponse(EResponseType.HTML).apply {
              httpStatusCode = HttpURLConnection.HTTP_NOT_FOUND
              contentType = getContentType(requestedPath)
              value = "Nothing at path: $requestedPath"
              encoding = StandardCharsets.UTF_8.name()
            }

        return PluginServletActionRetVal(errorResponse)
      }
      // #region Serve found resource
      val svgBytes = svgInputStream.use { it.readBytes() }

      val successResponse =
          ServletResponse(EResponseType.SHOW_FILE).apply {
            httpStatusCode = HttpURLConnection.HTTP_OK
            contentType = getContentType(requestedPath)
            binValue = svgBytes
            httpHeader = Collections.singletonMap("Cache-Control", CACHE_CONTROL_HEADER)
          }

      return PluginServletActionRetVal(successResponse)
      // #endregion Serve found resource
      // #endregion Fall back to classpath resource from JAR
    } catch (x: IOException) {
      val errorResponse =
          ServletResponse(EResponseType.HTML).apply {
            httpStatusCode = HttpURLConnection.HTTP_INTERNAL_ERROR // 500 Internal Server Error
            contentType = CONTENT_TYPE_PLAIN
            value = "Internal Server Error: Could not serve resource cause: ${x.message}"
            encoding = StandardCharsets.UTF_8.name()
          }

      return PluginServletActionRetVal(errorResponse)
    } catch (x: Exception) {
      throw FCPluginException(
          "Following unexpected error occurred in serving the resource: ${ x.message }", x)
    }
  }
}
