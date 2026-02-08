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
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

/**
 * This servlet acts as a nano server to pass request from a form using the CodBi along with the
 * BayVIS related functionalities to the BayVIS-API that way prevent the exposure of credentials.
 *
 * Configuration Keys:
 * - BayVIS_Benutzername: The username to use to log into the BayVIS-API.
 * - BayVIS_Passwort: The password to use to log into the BayVIS-API.
 * - BayVIS_EP_Ansprechpartnerdetails: Optional specification of where the endpoint for retrieving
 *   the authority directory can be found.
 */
class CodBiBayVISAuskunftAnsprechpartnerdetailsAction : IPluginServletAction {
  /** Stores the username to use to log into the BayVIS-API. */
  private var username: String? = ""
  /** Stores the password to use to log into the BayVIS-API. */
  private var password: String? = ""
  /** Stores the URL of the BayVIS-Endpoint */
  private var url: String =
      "https://www.bayernportal-webservices.bayern.de/rest/allgemein/v3/ansprechpartner/"
  /**
   * Stores the amount of hours that have to pass since a request to the BayVIS-API was made in
   * order to perform a re-request on request.
   */
  private var hrsTillUpdate: Int = 18
  /** Stores the time the BayVIS-API was lastly contacted. */
  private val lastContact = AtomicLong(System.currentTimeMillis())
  /** Stores the result's of BayVIS-Requests by ID. */
  private val buffer: MutableMap<String, String> = ConcurrentHashMap()
  /** Guards refresh decisions to avoid concurrent update races. */
  private val cacheLock = Any()

  /**
   * Retrieves the contact details from the BayVIS-API storing the result into the [buffer] and
   * updating the [lastContact].
   *
   * @param id The contact's ID
   * @return A [Pair] of [Int] & [String] stating the statuscode and the request's result (error
   *   message).
   */
  private fun retrieveData(id: String): Pair<Int, String?> {
    var statusCode = -1

    try {
      val url: URL = URI(url + id).toURL()
      val connection = url.openConnection() as HttpURLConnection

      connection.setRequestMethod("GET")
      connection.setRequestProperty(
          "Authorization",
          "Basic " +
              java.util.Base64.getEncoder()
                  .encodeToString(("$username:$password").toByteArray(StandardCharsets.UTF_8)))
      connection.setRequestProperty("Accept", "application/xml")

      statusCode = connection.getResponseCode()
      buffer[id] =
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
      buffer[id] = "{\"error\": \"Error connecting to BayVIS API\"}"
      statusCode = 500
    }

    return Pair(statusCode, buffer[id])
  }

  /**
   * Updates the [username], [password], [hrsTillUpdate] and re-retrieves all contact data for each
   * key in [buffer] so that the data can be updated manually.
   *
   * @return [null]
   */
  override fun validateConfigurationData(
      configData: IPluginValidationData
  ): IPluginInitializeValidationResult? {
    // #region Update
    username = configData.properties.getProperty("BayVIS_Benutzername")
    password = configData.properties.getProperty("BayVIS_Passwort")

    if (configData.properties.getProperty("BayVIS_UpdateCycle") != null) {
      hrsTillUpdate = configData.properties.getProperty("BayVIS_UpdateCycle").toInt()
    }
    // #endregion Update
    for (key in buffer.keys) {
      retrieveData(key)
    }

    return null
  }

  /** Returns "CodBi_BayVIS_Auskunft_Ansprechpartnerdetails" */
  override fun getName(): String {
    return "CodBi_BayVIS_Auskunft_Ansprechpartnerdetails"
  }

  /** Sets the [username],[password] & optionally [url]. */
  override fun initialize(configData: IPluginInitializeData) {
    this.username = configData.properties.getProperty("BayVIS_Benutzername")
    this.password = configData.properties.getProperty("BayVIS_Passwort")

    val newURL: String? = configData.properties.getProperty("BayVIS_EP_Ansprechpartnerdetails")

    if (newURL !== null) {
      this.url = newURL
    }
  }

  /**
   * Retrieves the directory of authorities from the BayVIS-API if it isn't already [buffer]ed or
   * the [hrsTillUpdate] have passed.
   */
  public override fun execute(p0: IPluginServletActionParams): IPluginServletActionRetVal {
    val id =
        p0.headerMap["ID"] ?: return PluginServletActionRetVal(ServletResponse(EResponseType.HTML))

    var needsFetch = false
    synchronized(cacheLock) {
      if (buffer[id] == null ||
          (System.currentTimeMillis() - lastContact.get()) / 3600000 >= hrsTillUpdate) {
        needsFetch = true
      }
    }
    if (needsFetch) {
      retrieveData(id)
    }

    val servletResponse = ServletResponse(EResponseType.HTML)
    servletResponse.encoding = StandardCharsets.UTF_8.name()
    servletResponse.value = buffer[id]

    return PluginServletActionRetVal(servletResponse)
  }
}
