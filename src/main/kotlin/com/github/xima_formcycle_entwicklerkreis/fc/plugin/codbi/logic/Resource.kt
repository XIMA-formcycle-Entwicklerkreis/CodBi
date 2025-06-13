package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.exception.FCPluginException
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.io.IOException
import java.net.HttpURLConnection
import java.nio.charset.StandardCharsets
import java.util.*

/**
 * This servlet retrieves a resource form within it's JAR.
 *
 * The **Path**-URL-Parameter specifies the path within the JAR to retrieve the file from as also
 * the file's name.
 *
 * If there's no **Path** specified following will be used:
 * /com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg.
 */
class Resource : IPluginServletAction {
  companion object {
    private const val SVG_RESOURCE_PATH =
        "/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg"
    private const val CONTENT_TYPE_SVG = "image/svg+xml"
    private const val CONTENT_TYPE_PLAIN = "text/plain"
    private const val CACHE_CONTROL_HEADER = "public, max-age=31536000"
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
   */
  public override fun execute(p0: IPluginServletActionParams): IPluginServletActionRetVal {
    try {
      val svgInputStream =
          javaClass.getResourceAsStream(p0.requestParameters["Path"]?.first() ?: SVG_RESOURCE_PATH)

      if (svgInputStream == null) {
        val errorResponse =
            ServletResponse(EResponseType.HTML).apply {
              httpStatusCode = HttpURLConnection.HTTP_NOT_FOUND
              contentType =
                  getContentType(p0.requestParameters["Path"]?.first() ?: SVG_RESOURCE_PATH)
              value = "Nothing at path: $SVG_RESOURCE_PATH"
              encoding = StandardCharsets.UTF_8.name()
            }

        return PluginServletActionRetVal(errorResponse)
      }
      // #region Serve found resource
      val svgBytes = svgInputStream.readBytes()

      svgInputStream.close()

      val successResponse =
          ServletResponse(EResponseType.SHOW_FILE).apply {
            httpStatusCode = HttpURLConnection.HTTP_OK
            contentType = getContentType(p0.requestParameters["Path"]?.first() ?: SVG_RESOURCE_PATH)
            binValue = svgBytes
            httpHeader = Collections.singletonMap("Cache-Control", CACHE_CONTROL_HEADER)
          }

      return PluginServletActionRetVal(successResponse)
      // #endregion Serve found resource
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
