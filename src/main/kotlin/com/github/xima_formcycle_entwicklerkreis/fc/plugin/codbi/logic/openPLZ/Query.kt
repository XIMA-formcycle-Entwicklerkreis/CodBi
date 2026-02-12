package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.openPLZ

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.CodbiFormResourcesPlugin
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
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong
import org.slf4j.LoggerFactory

/**
 * This servlet acts as a nano server to pass request from a form using the CodBi along with the
 * OpenPLZ REST API (checkout the **[documentation](https://www.openplzapi.org/de/)** for further
 * information about the header-parameter). Unlike the REST-Service returning paginated results,
 * this servlet accumulates all available data and returns it as a single block.
 *
 * Configuration Keys:
 * - OpenPLZ_URL: The URL of the endpoint to use.
 * - OpenPLZ_UpdateCycle: The number of hours to wait until a request causes a fresh REST-Request.
 *
 * Header:
 * - country: The country-code of the country to fetch the data of.
 * - orgaUnit: The organisational unit to fetch (e.g. /de/ **FederalStates**). This may be
 *   **FederalStates**, **FederalProvinces** or **Cantons**.
 * - officialKey The optional key (number) of a state, province or canton to get details from.
 * - detail: The optional detail to fetch about a certain state, province or canton identified by
 *   the **officialKey** (not optional if an official key is present). May be Municipalities, or
 *   Districts.
 * - param1 There may be up to four parameter passed along the request (e.g. **postalCode**,
 *   **name**, **locality**, **searchTerm**).
 * - param2 There may be up to four parameter passed along the request (e.g. **postalCode**,
 *   **name**, **locality**, **searchTerm**).
 * - param3 There may be up to four parameter passed along the request (e.g. **postalCode**,
 *   **name**, **locality**, **searchTerm**).
 * - param4 There may be up to four parameter passed along the request (e.g. **postalCode**,
 *   **name**, **locality**, **searchTerm**).
 */
class CodBiOpenPLZQueryAction : IPluginServletAction {
  /**
   * Stores the amount of hours that have to pass since a request to the OpenPLZ-API was made in
   * order to perform a re-request on request.
   */
  protected var hrsTillUpdate: Int = 18
  /** Stores the URL of the OpenPLZ-Endpoint. */
  protected var url: String = "https://openplzapi.org"
  /** The country code to use if none is provided. */
  protected var country: String = "de"
  /** Buffers the OpenPLZ-Request result to minimize re-requests. */
  protected val buffer: MutableMap<String, String> = ConcurrentHashMap()
  /** Stores the time the OpenPLZ-API was lastly contacted. */
  protected val lastContact = AtomicLong(System.currentTimeMillis())
  /** Guards cache eviction to avoid concurrent update races. */
  private val cacheLock = Any()

  /**
   * Retrieves the requested data from the OpenPLZ REST-Service.
   *
   * @param toRetrieveFrom The URL to retrieve the data from.
   * @return The requested JSON-Array.
   */
  protected fun retrieveData(toRetrieveFrom: String): Pair<Int, String?> {
    LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
        .info(
            "[[ CodBiOpenPLZQueryAction ] Fetching data from OpenPLZ REST with following URL: $toRetrieveFrom ]")

    var statusCode: Int

    try {
      val url: URL = URI(toRetrieveFrom).toURL()
      val connection = url.openConnection() as HttpURLConnection

      statusCode = connection.getResponseCode()
      buffer[toRetrieveFrom] =
          if (statusCode in 200..299) {
            lastContact.set(System.currentTimeMillis())

            connection.inputStream.bufferedReader(StandardCharsets.UTF_8).use { it.readText() }
          } else {
            val errorResult =
                connection.errorStream?.bufferedReader(StandardCharsets.UTF_8)?.use {
                  it.readText()
                }

            val errorMessage =
                "{\"error\": \"Retrieval from OpenPLZ API failed. Statuscode: $statusCode, Response: $errorResult, URL: \"$toRetrieveFrom \"}"

            errorMessage
          }

      connection.disconnect()
    } catch (e: IOException) {
      buffer[toRetrieveFrom] =
          "{\"error\": \"Error connecting to OpenPLZ API (${ url })\",\"details\": \"${ e.toString()}\"}"
      statusCode = 500
    }

    return Pair(statusCode, buffer[toRetrieveFrom])
  }

  /**
   * Updates the [username], [password] & [hrsTillUpdate].
   *
   * @return [null]
   */
  override fun validateConfigurationData(
      configData: IPluginValidationData
  ): IPluginInitializeValidationResult? {
    if (configData.properties.getProperty("OpenPLZ_UpdateCycle") != null)
        hrsTillUpdate = configData.properties.getProperty("OpenPLZ_UpdateCycle").toInt()
    if (configData.properties.getProperty("OpenPLZ_URL") != null)
        url = configData.properties.getProperty("OpenPLZ_URL")
    else url = "https://openplzapi.org"
    if (configData.properties.getProperty("OpenPLZ_Country") != null)
        country = configData.properties.getProperty("OpenPLZ_Country")
    else country = "de"

    return null
  }

  /** Returns "CodBi_OpenPLZ_Query" */
  override fun getName(): String {
    return "CodBi_OpenPLZ_Query"
  }

  /**
   * Sets the [username], [password] (also retrieving the contact directory into [buffer] using the
   * provided credentials) & optionally [url].
   */
  override fun initialize(configData: IPluginInitializeData) {
    if (configData.properties.getProperty("OpenPLZ_UpdateCycle") != null)
        hrsTillUpdate = configData.properties.getProperty("OpenPLZ_UpdateCycle").toInt()
    if (configData.properties.getProperty("OpenPLZ_URL") != null)
        url = configData.properties.getProperty("OpenPLZ_URL")
    else url = "https://openplzapi.org"
    if (configData.properties.getProperty("OpenPLZ_Country") != null)
        country = configData.properties.getProperty("OpenPLZ_Country")
    else country = "de"
  }

  /**
   * Retrieves the directory of authorities from the OpenPLZ-API. Missing implementation: Buffering
   * of data and re-requesting after a certain amounts of hours.
   */
  public override fun execute(p0: IPluginServletActionParams): IPluginServletActionRetVal {
    synchronized(cacheLock) {
      if (buffer.size > 100) {
        val firstKey = buffer.keys.firstOrNull()
        if (firstKey != null) {
          buffer.remove(firstKey)
        }
      }
    }
    // region Initialization
    val allResults = StringBuilder()
    var currentPage = 1
    var hasMorePages = true
    var pagesToRetrieve = p0.headerMap["X-PagesToLoad"]?.toIntOrNull()
    // endregion Initialization
    // region Build the Base URL (Path and existing Query Parameters)
    val baseUrlString = url.trimEnd('/')
    val officialSegment =
        if (!p0.headerMap["X-OfficialKey"].isNullOrBlank())
            "/${p0.headerMap["X-OfficialKey"]!!}/${p0.headerMap["X-Detail"]}"
        else ""
    val country =
        if (p0.headerMap["X-Country"].isNullOrEmpty()) this.country else p0.headerMap["X-Country"]
    val orgaUnit = p0.headerMap["X-OrgaUnit"] ?: ""
    val fullPath = "$baseUrlString/$country/$orgaUnit$officialSegment"
    val queryParams = mutableListOf<String>()
    val optionalKeys = listOf("X-Param1", "X-Param2", "X-Param3", "X-Param4")

    optionalKeys.forEach { key ->
      val value = p0.headerMap[key]

      if (!value.isNullOrBlank()) {
        val encodedValue =
            URLEncoder.encode(
                    value.replaceFirst("-", "=").replace(" ", "").replace("°", "^"),
                    StandardCharsets.UTF_8.toString())
                .replace("%3D", "=")
                .replace("%2B", "%20")

        queryParams.add(encodedValue)
      }
    }

    val baseQueryString = if (queryParams.isNotEmpty()) "?" + queryParams.joinToString("&") else ""
    // endregion Build the Base URL.
    do {
      val pageQueryParam =
          if (baseQueryString.isEmpty()) "?page=$currentPage&pageSize=50"
          else "$baseQueryString&page=$currentPage&pageSize=50"
      val pagedUrl = fullPath + pageQueryParam
      val finalBufferKey = pagedUrl
      val isBufferValid =
          buffer.containsKey(finalBufferKey) &&
              (System.currentTimeMillis() - lastContact.get()) / 3600000 < hrsTillUpdate

      if (!isBufferValid) {
        LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
            .info("Retrieving:" + finalBufferKey)
        val (currentStatusCode, currentJson) = retrieveData(finalBufferKey)

        if (currentStatusCode !in 200..299 ||
            currentJson == null ||
            currentJson.contains("\"error\"")) {
          allResults.clear()
          allResults.append(
              currentJson
                  ?: "{\"error\": \"Unbekannter Fehler beim Abrufen von Seite $currentPage\"}")

          break
        }
      }

      val jsonResult = buffer[finalBufferKey] ?: ""
      var cleanedJson = jsonResult.trim()

      if (cleanedJson.startsWith("[")) cleanedJson = cleanedJson.substring(1)
      if (cleanedJson.endsWith("]")) cleanedJson = cleanedJson.substring(0, cleanedJson.length - 1)
      if (cleanedJson.isNotEmpty()) {
        if (allResults.isNotEmpty()) allResults.append(",")

        allResults.append(cleanedJson)

        val objectCount = cleanedJson.count { it == '}' } // Grobe Zählung der Objekte

        if (objectCount < 50 || (pagesToRetrieve != null && currentPage > pagesToRetrieve))
            hasMorePages = false
        if (pagesToRetrieve == null || currentPage <= pagesToRetrieve) currentPage++
      } else hasMorePages = false
    } while (hasMorePages)

    val finalJsonResult = "[${allResults.toString()}]"
    val servletResponse = ServletResponse(EResponseType.HTML)
    servletResponse.encoding = StandardCharsets.UTF_8.name()
    servletResponse.value = finalJsonResult // Gib den kombinierten Datenblock zurück

    return PluginServletActionRetVal(servletResponse)
  }
}
