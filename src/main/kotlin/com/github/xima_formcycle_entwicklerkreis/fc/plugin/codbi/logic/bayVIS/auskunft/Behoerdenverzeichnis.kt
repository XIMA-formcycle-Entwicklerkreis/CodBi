package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.bayVIS.auskunft

import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeValidationResult
import de.xima.fc.interfaces.plugin.lifecycle.IPluginValidationData
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import java.nio.charset.StandardCharsets
import java.util.concurrent.atomic.AtomicLong

/**
 * This servlet acts as a nano server to pass request from a form using the CodBi along with the
 * BayVIS related functionalities to the BayVIS-API that way prevent the exposure of credentials.
 *
 * Configuration Keys:
 * - BayVIS_Benutzername: The username to use to log into the BayVIS-API.
 * - BayVIS_Passwort: The password to use to log into the BayVIS-API.
 * - BayVIS_EP_Behoerdenverzeichnis: Optional specification of where the endpoint for retrieving the
 *   authority directory can be found.
 */
class CodBiBayVISAuskunftBehoerdenverzeichnisAction : IPluginServletAction {
  /** Stores the username to use to log into the BayVIS-API. */
  protected var username: String? = ""
  /** Stores the password to use to log into the BayVIS-API. */
  protected var password: String? = ""
  /**
   * Stores the amount of hours that have to pass since a request to the BayVIS-API was made in
   * order to perform a re-request on request.
   */
  protected var hrsTillUpdate: Int = 18

  /** Stores the URL of the BayVIS-Endpoint */
  protected var url: String =
      "https://www.bayernportal-webservices.bayern.de/rest/allgemein/v3/behoerden"
  /** Buffers the BayVIS-Request result to minimize re-requests. */
  @Volatile protected var buffer: String? = null
  /** Stores the time the BayVIS-API was lastly contacted. */
  protected val lastContact = AtomicLong(System.currentTimeMillis())
  /** Guards refresh decisions to avoid concurrent update races. */
  private val cacheLock = Any()

  /**
   * Retrieves the contact directory from the BayVIS-API storing the result into the [buffer] and
   * updating the [lastContact].
   *
   * @return A [Pair] of [Int] & [String] stating the statuscode and the request's result (error
   *   message).
   */
  protected fun retrieveData(): Pair<Int, String?> {
    var statusCode = -1

    try {
      val url: URL = URI(url).toURL()
      val connection = url.openConnection() as HttpURLConnection

      connection.setRequestMethod("GET")
      connection.setRequestProperty(
          "Authorization",
          "Basic " +
              java.util.Base64.getEncoder()
                  .encodeToString(("$username:$password").toByteArray(StandardCharsets.UTF_8)))

      statusCode = connection.getResponseCode()
      buffer =
          if (statusCode in 200..299) {
            lastContact.set(System.currentTimeMillis())

            connection.inputStream.bufferedReader(StandardCharsets.UTF_8).use { it.readText() }
          } else {
            val errorResult =
                connection.errorStream?.bufferedReader(StandardCharsets.UTF_8)?.use {
                  it.readText()
                }

            val errorMessage =
                "{\"error\": \"Retrieval from BayVIS API failed. Statuscode: $statusCode, Response: $errorResult\"}"

            errorMessage
          }

      connection.disconnect()
    } catch (e: IOException) {
      buffer = "{\"error\": \"Error connecting to BayVIS API\"}"
      statusCode = 500
    }

    return Pair(statusCode, buffer)
  }

  /**
   * Updates the [username], [password] & [hrsTillUpdate].
   *
   * @return [null]
   */
  override fun validateConfigurationData(
      configData: IPluginValidationData
  ): IPluginInitializeValidationResult? {
    username = configData.properties.getProperty("BayVIS_Benutzername")
    password = configData.properties.getProperty("BayVIS_Passwort")

    if (configData.properties.getProperty("BayVIS_UpdateCycle") != null) {
      hrsTillUpdate = configData.properties.getProperty("BayVIS_UpdateCycle").toInt()
    }

    return null
  }

  /** Returns "CodBi_BayVIS_Auskunft_Behoerdenverzeichnis" */
  override fun getName(): String {
    return "CodBi_BayVIS_Auskunft_Behoerdenverzeichnis"
  }

  /**
   * Sets the [username], [password] (also retrieving the contact directory into [buffer] using the
   * provided credentials) & optionally [url].
   */
  override fun initialize(configData: IPluginInitializeData) {
    username = configData.properties.getProperty("BayVIS_Benutzername")
    password = configData.properties.getProperty("BayVIS_Passwort")

    if (configData.properties.getProperty("BayVIS_UpdateCycle") != null) {
      hrsTillUpdate = configData.properties.getProperty("BayVIS_UpdateCycle").toInt()
    }

    val newURL: String? = configData.properties.getProperty("BayVIS_EP_Behoerdenverzeichnis")

    if (newURL !== null) {
      url = newURL
    }

    retrieveData()
  }

  /**
   * Retrieves the directory of authorities from the BayVIS-API. Missing implementation: Buffering
   * of data and re-requesting after a certain amounts of hours.
   */
  public override fun execute(p0: IPluginServletActionParams): IPluginServletActionRetVal {
    // region Initialization
    val username = this.username
    val password = this.password
    val serviceUrl = this.url
    var statusCode = -1
    // endregion Initialization
    var needsFetch = false
    synchronized(cacheLock) {
      if (buffer == null ||
          (System.currentTimeMillis() - lastContact.get()) / 3600000 >= hrsTillUpdate) {
        needsFetch = true
      }
    }
    if (needsFetch) {
      retrieveData()
    }

    val servletResponse = ServletResponse(EResponseType.HTML)
    servletResponse.encoding = StandardCharsets.UTF_8.name()
    servletResponse.value = buffer

    return PluginServletActionRetVal(servletResponse)
  }
}
