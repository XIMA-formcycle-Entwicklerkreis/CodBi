package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.holidays

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
import org.slf4j.LoggerFactory

/**
 * This servlet retrieves german holidays from **get.api-feiertage.de** acting as a cache for
 * reoccurring data.
 */
class FeiertageDEAction : IPluginServletAction {
  /** Stores the data for a request. */
  protected data class HolidaysRequest(
      val years: String,
      val states: String,
      val augsburg: Boolean,
      val katholic: Boolean
  )

  /** Stores the result's of **get.api-feiertage.de**-Requests by [HolidaysRequest]. */
  protected var buffer: MutableMap<HolidaysRequest, String?> = mutableMapOf()
  /** Stores the URL of the Holiday-API endpoint. */
  protected var url: String = "https://get.api-feiertage.de"
  /**
   * Stores the amount of hours that have to pass since a request to the Holdays-API was made in
   * order to perform a re-request on request.
   */
  protected var hrsTillUpdate: Int = 1
  /** Stores the time the BayVIS-API was lastly contacted. */
  protected var lastContact: Long = System.currentTimeMillis()

  /**
   * Retrieves the holidays from **get.api-feiertage.de**storing the result into the [buffer].
   *
   * @param years See **https://www.api-feiertage.de**.
   * @param states See **https://www.api-feiertage.de**.
   * @param augsburg See **https://www.api-feiertage.de**.
   * @param catholic See **https://www.api-feiertage.de**.
   * @return See **https://www.api-feiertage.de**.
   */
  protected fun retrieveData(
      years: String,
      states: String,
      augsburg: Boolean,
      catholic: Boolean
  ): Pair<Int, String?> {
    var statusCode = -1

    try {
      val url: URL =
          URI(
                  url +
                      "?years=" +
                      years +
                      "&states=" +
                      states +
                      "&augsburg=" +
                      if (augsburg) "1" else "0" + "&katholic=" + if (catholic) "1" else "0")
              .toURL()
      val connection = url.openConnection() as HttpURLConnection

      connection.setRequestMethod("GET")
      LoggerFactory.getLogger(FeiertageDEAction::class.java).info("X2")
      statusCode = connection.getResponseCode()
      buffer[HolidaysRequest(years, states, augsburg, catholic)] =
          if (statusCode in 200..299) {
            lastContact = System.currentTimeMillis()

            connection.inputStream.bufferedReader(StandardCharsets.UTF_8).use { it.readText() }
          } else {
            val errorResult =
                connection.errorStream?.bufferedReader(StandardCharsets.UTF_8)?.use {
                  it.readText()
                }

            val errorMessage =
                "{\"error\": \"Retrieval from https://get.api-feiertage.de failed. Statuscode: $statusCode, Response: $errorResult\"}"

            errorMessage
          }
      LoggerFactory.getLogger(FeiertageDEAction::class.java)
          .info("TTT:" + buffer[HolidaysRequest(years, states, augsburg, catholic)])
      connection.disconnect()
    } catch (e: IOException) {
      buffer[HolidaysRequest(years, states, augsburg, catholic)] =
          "{\"error\": \"Error connecting to https://get.api-feiertage.de\"}"
      statusCode = 500
    }

    return Pair(statusCode, buffer[HolidaysRequest(years, states, augsburg, catholic)])
  }

  /**
   * Updates the [hrsTillUpdate] and re-retrieves all contact data for each key in [buffer] so that
   * the data can be updated manually.
   *
   * @return [null]
   */
  override fun validateConfigurationData(
      configData: IPluginValidationData
  ): IPluginInitializeValidationResult? {
    // #region Update
    if (configData.properties.getProperty("BayVIS_UpdateCycle") != null) {
      hrsTillUpdate = configData.properties.getProperty("BayVIS_UpdateCycle").toInt()
    }
    // #endregion Update
    for (key in buffer.keys) {
      retrieveData(key.years, key.states, key.augsburg, key.katholic)
    }

    return null
  }

  /** Returns "CodBi_Holidays_FeiertageDE" */
  override fun getName(): String {
    return "CodBi_Holidays_FeiertageDE"
  }

  /** Sets the optional [url]. */
  override fun initialize(configData: IPluginInitializeData) {
    val newURL: String? = configData.properties.getProperty("CodBi_EP_FeiertageDEAction")

    if (newURL !== null) {
      this.url = newURL
    }
  }

  /**
   * Retrieves the days from the Holiday-API if it isn't already [buffer]ed or the [hrsTillUpdate]
   * have passed.
   */
  public override fun execute(p0: IPluginServletActionParams): IPluginServletActionRetVal {
    LoggerFactory.getLogger(FeiertageDEAction::class.java)
        .info(
            "x1:" +
                (buffer[
                        HolidaysRequest(
                            p0.headerMap["years"]!!,
                            p0.headerMap["states"]!!,
                            p0.headerMap["augsburg"]!!.toBoolean(),
                            p0.headerMap["catholic"]!!.toBoolean())] == null)
                    .toString())

    if (buffer[
        HolidaysRequest(
            p0.headerMap["years"]!!,
            p0.headerMap["states"]!!,
            p0.headerMap["augsburg"]!!.toBoolean(),
            p0.headerMap["catholic"]!!.toBoolean())] == null ||
        (lastContact - System.currentTimeMillis()) / 3600000 <= hrsTillUpdate) {
      LoggerFactory.getLogger(FeiertageDEAction::class.java).info("x1.1")
      retrieveData(
          p0.headerMap["years"]!!,
          p0.headerMap["states"]!!,
          p0.headerMap["augsburg"]!!.toBoolean(),
          p0.headerMap["catholic"]!!.toBoolean())
    }

    val servletResponse = ServletResponse(EResponseType.HTML)
    servletResponse.encoding = StandardCharsets.UTF_8.name()
    servletResponse.value =
        buffer[
            HolidaysRequest(
                p0.headerMap["years"]!!,
                p0.headerMap["states"]!!,
                p0.headerMap["augsburg"]!!.toBoolean(),
                p0.headerMap["catholic"]!!.toBoolean())]

    return PluginServletActionRetVal(servletResponse)
  }
}
