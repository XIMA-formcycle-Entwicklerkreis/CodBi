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
  companion object {
    /** Maximum number of pages fetched in one refresh (guards against an endless paging loop). */
    private const val MAX_PAGES: Int = 50
    /** Authorities requested per page — the API's documented maximum. */
    private const val PAGE_SIZE: Int = 100
  }

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

  /** One response page of the authority list. */
  private class Page(val status: Int, val body: String?, val hasNext: Boolean)

  /**
   * Retrieves the whole authority directory from the BayVIS-API storing the result into the
   * [buffer] and updating the [lastContact].
   *
   * The REST API answers at most [PAGE_SIZE] authorities per request and advertises further pages
   * through the `Link: <…>; rel="next"` response header. Every page is therefore fetched and the
   * XML documents are merged into ONE document with the SAME root element, so an element
   * placeholder still receives exactly the structure it always received (a single `…Response` with
   * one `<behoerde>` per authority) — just with all authorities instead of only the first 100.
   *
   * Any anomaly falls back to the previous single-request behaviour: a failing first page, a
   * missing/suspicious root element or a SOAP endpoint all yield the un-paged result, so a
   * deployment that worked before keeps working unchanged.
   *
   * @return A [Pair] of [Int] & [String] stating the statuscode and the request's result (error
   *   message).
   */
  protected fun retrieveData(): Pair<Int, String?> {
    val pages = ArrayList<String>()
    // A SOAP endpoint (version 1/2 setups) has no paging and must be called exactly as configured.
    val paged = !url.contains("/soap", ignoreCase = true)

    if (paged) {
      var page = 0
      var hasNext = true

      while (hasNext && page < MAX_PAGES) {
        val result = retrievePage(page)

        if (result.status !in 200..299 || result.body == null) {
          // Page 0 failed → never regress a legacy/custom endpoint: call it as configured and
          // report that result (identical to the behaviour before paging was introduced).
          if (pages.isEmpty()) return retrieveSingle()

          // A later page failed → keep the pages received so far instead of losing the directory.
          break
        }

        pages.add(result.body)
        hasNext = result.hasNext
        page++
      }
    }

    if (pages.isEmpty()) return retrieveSingle()

    val merged = mergePages(pages)

    buffer = merged
    return Pair(200, merged)
  }

  /**
   * Calls the configured endpoint exactly as configured (no paging parameters) and buffers the
   * result — the behaviour of this servlet before paging was introduced.
   */
  private fun retrieveSingle(): Pair<Int, String?> {
    val result = retrievePage(null)

    buffer = result.body
    return Pair(result.status, result.body)
  }

  /**
   * Appends the paging parameters to the configured URL, honouring an already present query string.
   *
   * @param page The 0-based page index to request.
   * @return The absolute URL of that page.
   */
  private fun pageUrl(page: Int): String {
    val separator = if (url.contains('?')) '&' else '?'

    return "$url${separator}page=$page&size=$PAGE_SIZE"
  }

  /**
   * Performs one GET against the BayVIS-API.
   *
   * @param page The 0-based page index to request, or `null` to call the configured URL unchanged.
   * @return The response [Page], including whether the API advertised a following page.
   */
  private fun retrievePage(page: Int?): Page {
    val target = if (page == null) url else pageUrl(page)
    var statusCode: Int

    try {
      val connection = URI(target).toURL().openConnection() as HttpURLConnection
      // Never let a hanging/blocked endpoint stall the plugin start-up.
      connection.connectTimeout = 10_000
      connection.readTimeout = 20_000

      connection.setRequestMethod("GET")
      connection.setRequestProperty(
          "Authorization",
          "Basic " +
              java.util.Base64.getEncoder()
                  .encodeToString(("$username:$password").toByteArray(StandardCharsets.UTF_8)))

      statusCode = connection.getResponseCode()

      val body =
          if (statusCode in 200..299) {
            lastContact.set(System.currentTimeMillis())

            connection.inputStream.bufferedReader(StandardCharsets.UTF_8).use { it.readText() }
          } else {
            val errorResult =
                connection.errorStream?.bufferedReader(StandardCharsets.UTF_8)?.use {
                  it.readText()
                }

            BayVISAuskunftErrors.describe("Behoerdenverzeichnis", target, statusCode, errorResult)
          }

      val hasNext =
          statusCode in 200..299 &&
              connection.headerFields.entries.any { (name, values) ->
                name != null &&
                    name.equals("Link", ignoreCase = true) &&
                    values.any { it.contains("rel=\"next\"") }
              }

      connection.disconnect()

      return Page(statusCode, body, hasNext)
    } catch (e: IOException) {
      return Page(500, BayVISAuskunftErrors.connectionFailure(target, e), false)
    }
  }

  /**
   * Merges the XML documents of several pages into ONE document with the root element of the first
   * page. Returns the first page unchanged whenever the structure cannot be recognised, so a merge
   * problem can never corrupt the data handed to the element placeholders.
   *
   * @param pages The XML bodies, one per page, in request order.
   * @return The merged XML document.
   */
  private fun mergePages(pages: List<String>): String {
    val first = pages.first()

    if (pages.size == 1) return first

    return try {
      val start = rootOpenStart(first)
      val openEnd = first.indexOf('>', start)

      if (start < 0 || openEnd < 0) return first

      val openTag = first.substring(start, openEnd + 1)
      val rootName =
          Regex("""^<\s*([A-Za-z0-9_:.\-]+)""").find(openTag)?.groupValues?.get(1) ?: return first
      val closeTag = "</$rootName>"
      val inner = pages.map { pageInner(it, closeTag) ?: return first }.joinToString(separator = "")

      first.substring(0, openEnd + 1) + inner + closeTag
    } catch (e: RuntimeException) {
      first
    }
  }

  /** Returns the index of the first character of the root element's open tag. */
  private fun rootOpenStart(body: String): Int {
    val prologEnd = if (body.trimStart().startsWith("<?xml")) body.indexOf("?>") + 2 else 0

    return body.indexOf('<', if (prologEnd < 0) 0 else prologEnd)
  }

  /** Returns the content of the root element, or `null` when the body has another structure. */
  private fun pageInner(body: String, closeTag: String): String? {
    val start = rootOpenStart(body)

    if (start < 0) return null

    val openEnd = body.indexOf('>', start)
    val closeStart = body.lastIndexOf(closeTag)

    if (openEnd < 0 || closeStart < openEnd) return null

    return body.substring(openEnd + 1, closeStart)
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

    // NEVER throw here: FC's PluginHelper turns an exception into "plugin invalid". A failed call
    // is
    // recorded as a WARNING (server log + FORMCYCLE protocol entry) instead, and the result stays
    // VALID — an invalid result would make FORMCYCLE refuse to ignite the whole CodBi plugin.
    BayVISAuskunftStartup.startupCheck("Behoerdenverzeichnis", url, configData.client) {
      retrieveData().first
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

    BayVISAuskunftStartup.startupCheck("Behoerdenverzeichnis", url, configData.client) {
      retrieveData().first
    }
  }

  /**
   * Retrieves the directory of authorities from the BayVIS-API. Missing implementation: Buffering
   * of data and re-requesting after a certain amounts of hours.
   */
  public override fun execute(p0: IPluginServletActionParams): IPluginServletActionRetVal {
    // region Initialization

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
