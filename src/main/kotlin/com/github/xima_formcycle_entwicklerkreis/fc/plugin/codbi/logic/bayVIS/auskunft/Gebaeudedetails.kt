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

/**
 * This servlet acts as a nano server to pass request from a form using the CodBi along with the
 * BayVIS related functionalities to the BayVIS-API that way prevent the exposure of credentials.
 *
 * Configuration Keys:
 * - BayVIS_Benutzername: The username to use to log into the BayVIS-API.
 * - BayVIS_Passwort: The password to use to log into the BayVIS-API.
 * - BayVIS_EP_Gebaeudedetails: Optional specification of where the endpoint for retrieving the
 *   authority directory can be found.
 */
class CodBiBayVISAuskunftGebaeudedetailsAction : IPluginServletAction {
  /** Stores the username to use to log into the BayVIS-API. */
  protected var username: String? = ""
  /** Stores the password to use to log into the BayVIS-API. */
  protected var password: String? = ""
  /** Stores the URL of the BayVIS-Endpoint */
  protected var url: String =
      "https://www.bayernportal-webservices.bayern.de/rest/allgemein/v3/behoerden/"
  /**
   * Stores the amount of hours that have to pass since a request to the BayVIS-API was made in
   * order to perform a re-request on request.
   */
  protected var hrsTillUpdate: Int = 18

  /** Stores the time the BayVIS-API was lastly contacted. */
  protected var lastContact: Long = System.currentTimeMillis()
  /** Stores the result's of BayVIS-Requests by ID. */
  protected var buffer: MutableMap<String, String> = mutableMapOf()

  /**
   * Retrieves the contact details from the BayVIS-API storing the result into the [buffer] and
   * updating the [lastContact].
   *
   * @param id The contact's ID
   * @return A [Pair] of [Int] & [String] stating the statuscode and the request's result (error
   *   message).
   */
  protected fun retrieveData(id: String, gebaeudeID: String): Pair<Int, String?> {
    var statusCode = -1

    try {
      val url: URL = URI("$url$id/gebaeude/$gebaeudeID").toURL()
      val connection = url.openConnection() as HttpURLConnection

      connection.setRequestMethod("GET")
      connection.setRequestProperty(
          "Authorization",
          "Basic " +
              java.util.Base64.getEncoder()
                  .encodeToString(("$username:$password").toByteArray(StandardCharsets.UTF_8)))

      statusCode = connection.getResponseCode()
      buffer[id] =
          if (statusCode in 200..299) {
            lastContact = System.currentTimeMillis()

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
    return null
  }

  /** Returns "CodBi_BayVIS_Auskunft_Gebaeudedetails" */
  override fun getName(): String {
    return "CodBi_BayVIS_Auskunft_Gebaeudedetails"
  }

  /** Sets the [username],[password] & optionally [url]. */
  override fun initialize(configData: IPluginInitializeData) {
    this.username = configData.properties.getProperty("BayVIS_Benutzername")
    this.password = configData.properties.getProperty("BayVIS_Passwort")

    val newURL: String? = configData.properties.getProperty("BayVIS_EP_Gebaeudedetails")

    if (newURL !== null) {
      this.url = newURL
    }
  }

  /**
   * Retrieves the directory of authorities from the BayVIS-API if it isn't already [buffer]ed or
   * the [hrsTillUpdate] have passed.
   */
  public override fun execute(p0: IPluginServletActionParams): IPluginServletActionRetVal {
    if (p0.headerMap["ID"] == null)
        return PluginServletActionRetVal(ServletResponse(EResponseType.HTML))

    if (buffer[p0.headerMap["ID"]] == null ||
        (System.currentTimeMillis() - lastContact) / 3600000 >= hrsTillUpdate) {
      retrieveData(p0.headerMap["ID"]!!, p0.headerMap["GebaeudeID"]!!)
    }

    val servletResponse = ServletResponse(EResponseType.HTML)
    servletResponse.encoding = StandardCharsets.UTF_8.name()
    servletResponse.value = buffer[p0.headerMap["ID"]]

    return PluginServletActionRetVal(servletResponse)
  }
}
