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
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.concurrent.ConcurrentHashMap

/**
 * Single nano-server proxy for **every** BayernPortal (BayVIS) REST v3 resource that the dedicated
 * servlets ([CodBiBayVISAuskunftBehoerdenverzeichnisAction],
 * [CodBiBayVISAuskunftBehoerdendetailsAction], [CodBiBayVISAuskunftGebaeudedetailsAction],
 * [CodBiBayVISAuskunftAnsprechpartnerverzeichnisAction],
 * [CodBiBayVISAuskunftAnsprechpartnerdetailsAction]) do not cover.
 *
 * The dedicated servlets and their element placeholders stay untouched — this servlet only ADDS the
 * resources documented at `https://www.baybw-services.bayern.de/restapi.htm`:
 *
 * |`Service` header value                 |BayernPortal resource                                 |
 * |---------------------------------------|------------------------------------------------------|
 * |`leistungen`                           |`/leistungen`                                         |
 * |`leistungen.details`                   |`/leistungen/{id}`                                    |
 * |`leistungsbeschreibungen`              |`/leistungsbeschreibungen`                            |
 * |`leistungsbeschreibungen.details`      |`/leistungsbeschreibungen/{id}`                       |
 * |`lebenslagen`                          |`/lebenslagen`                                        |
 * |`lebenslagen.details`                  |`/lebenslagen/{id}`                                   |
 * |`behoerden.leistungen`                 |`/behoerden/{id}/leistungen`                          |
 * |`behoerden.abgegebene-leistungen`      |`/behoerden/{id}/abgegebene-leistungen`               |
 * |`behoerden.ansprechpartner`            |`/behoerden/{id}/ansprechpartner`                     |
 * |`behoerden.gebaeude.ansprechpartner`   |`/behoerden/{id}/gebaeude/{id2}/ansprechpartner/{id3}`|
 * |`ansprechpartner.leistungen`           |`/ansprechpartner/{id}/leistungen`                    |
 * |`dienststellen`                        |`/dienststellen`                                      |
 * |`dienststellen.details`                |`/dienststellen/{id}`                                 |
 * |`dienststellen.leistungen`             |`/dienststellen/{id}/leistungen`                      |
 * |`dienststellen.formulare`              |`/dienststellen/{id}/formulare`                       |
 * |`dienststellen.onlineverfahren`        |`/dienststellen/{id}/onlineverfahren`                 |
 * |`dienststellen.leistungsbeschreibungen`|`/dienststellen/{id}/leistungsbeschreibungen`         |
 * |`dienststellen.lebenslagen`            |`/dienststellen/{id}/lebenslagen`                     |
 *
 * Unlike the dedicated servlets (whose element placeholders parse the XML default representation of
 * the API) this servlet asks the portal for `application/json`, so the new element placeholders can
 * parse the body with `JSON.parse` without guessing the XML envelope names.
 *
 * Request headers:
 * - `Service` (required): one of the whitelisted keys above — an unknown key is rejected, so the
 *   frontend can never call an arbitrary path with the plugin's credentials.
 * - `ID` / `ID2` / `ID3` (optional, depending on the resource): the numeric path ids; they are
 *   percent-encoded and substituted into `{id}`, `{id2}` and `{id3}`.
 * - `Full` (optional): `true` / `false` — forwarded as the `full` query parameter.
 * - `Gemeindekennziffer` (optional): 8-digit official municipality key — forwarded as
 *   `gemeindekennziffer`.
 *
 * Configuration Keys:
 * - BayVIS_Benutzername: The username to use to log into the BayVIS-API.
 * - BayVIS_Passwort: The password to use to log into the BayVIS-API.
 * - BayVIS_UpdateCycle: Hours after which a cached result is re-requested.
 * - BayVIS_EP_Ressourcen: Optional base URL of the REST v3 API (default
 *   `https://www.bayernportal-webservices.bayern.de/rest/allgemein/v3`).
 */
class CodBiBayVISAuskunftRessourcenAction : IPluginServletAction {
  companion object {
    /** The `name=` value the frontend uses to reach this servlet. */
    const val NAME: String = "CodBi_BayVIS_Auskunft_Ressourcen"

    /** Default base URL of the BayernPortal REST v3 API (no trailing slash). */
    const val DEFAULT_BASE_URL: String =
        "https://www.bayernportal-webservices.bayern.de/rest/allgemein/v3"

    /**
     * Whitelist of the supported resources: the `Service` header value maps to the path template
     * appended to [DEFAULT_BASE_URL] (or to `BayVIS_EP_Ressourcen`).
     */
    val RESOURCES: Map<String, String> =
        linkedMapOf(
            "leistungen" to "/leistungen",
            "leistungen.details" to "/leistungen/{id}",
            "leistungsbeschreibungen" to "/leistungsbeschreibungen",
            "leistungsbeschreibungen.details" to "/leistungsbeschreibungen/{id}",
            "lebenslagen" to "/lebenslagen",
            "lebenslagen.details" to "/lebenslagen/{id}",
            "behoerden.leistungen" to "/behoerden/{id}/leistungen",
            "behoerden.abgegebene-leistungen" to "/behoerden/{id}/abgegebene-leistungen",
            "behoerden.ansprechpartner" to "/behoerden/{id}/ansprechpartner",
            "behoerden.gebaeude.ansprechpartner" to
                "/behoerden/{id}/gebaeude/{id2}/ansprechpartner/{id3}",
            "ansprechpartner.leistungen" to "/ansprechpartner/{id}/leistungen",
            "dienststellen" to "/dienststellen",
            "dienststellen.details" to "/dienststellen/{id}",
            "dienststellen.leistungen" to "/dienststellen/{id}/leistungen",
            "dienststellen.formulare" to "/dienststellen/{id}/formulare",
            "dienststellen.onlineverfahren" to "/dienststellen/{id}/onlineverfahren",
            "dienststellen.leistungsbeschreibungen" to
                "/dienststellen/{id}/leistungsbeschreibungen",
            "dienststellen.lebenslagen" to "/dienststellen/{id}/lebenslagen",
        )

    /** Documented BOOLEAN query parameters: request header name → BayernPortal parameter name. */
    val BOOLEAN_QUERY_PARAMETERS: Map<String, String> =
        linkedMapOf(
            "Full" to "full",
            "MitRegionalenErgaenzungen" to "mitRegionalenErgaenzungen",
            "SicheresKontaktformular" to "sicheresKontaktformular",
            "MitIDallgemeineDaten" to "mitIDallgemeineDaten",
        )

    /** The documented contact-selection modes of `behoerdenAnsprechpartnerZuordnungen`. */
    val CONTACT_MODES: List<String> = listOf("DIREKTBEVORZUGT", "DIREKT", "ALLE", "NEIN")

    /** An official 8-digit municipality key (`gemeindekennziffer`), e.g. "09162000". */
    private val GEMEINDEKENNZIFFER: Regex = Regex("^\\d{8}$")
  }

  /** Stores the username to use to log into the BayVIS-API. */
  protected var username: String? = ""
  /** Stores the password to use to log into the BayVIS-API. */
  protected var password: String? = ""
  /** Stores the base URL of the BayVIS-REST-API. */
  protected var baseUrl: String = DEFAULT_BASE_URL
  /**
   * Stores the amount of hours that have to pass since a request to the BayVIS-API was made in
   * order to perform a re-request on request.
   */
  protected var hrsTillUpdate: Int = 18

  /** Stores the time the BayVIS-API was lastly contacted per cache key. */
  protected val lastContact: MutableMap<String, Long> = ConcurrentHashMap()
  /** Buffers the BayVIS-Request results by cache key to minimize re-requests. */
  protected val buffer: MutableMap<String, String> = ConcurrentHashMap()
  /** Guards refresh decisions to avoid concurrent update races. */
  private val cacheLock = Any()

  /**
   * Percent-encodes a value for use as a URL path segment (spaces become %20, not '+'; other
   * reserved characters are escaped).
   *
   * @param value The raw value to encode.
   * @return The percent-encoded path segment.
   */
  private fun pathSegment(value: String): String =
      URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20")

  /**
   * Percent-encodes a value for use inside a query string.
   *
   * @param value The raw value to encode.
   * @return The percent-encoded query value.
   */
  private fun queryValue(value: String): String = URLEncoder.encode(value, StandardCharsets.UTF_8)

  /**
   * Builds the absolute URL of the requested resource from the whitelisted template and the
   * documented query parameters.
   *
   * Only these query parameters are forwarded, and every value is validated — a typo must not turn
   * into a silently different (or unlocalized) answer:
   * - `Full` → `full` (boolean)
   * - `MitRegionalenErgaenzungen` → `mitRegionalenErgaenzungen` (boolean)
   * - `SicheresKontaktformular` → `sicheresKontaktformular` (boolean)
   * - `MitIDallgemeineDaten` → `mitIDallgemeineDaten` (boolean)
   * - `Gemeindekennziffer` → `gemeindekennziffer` (8 digits; without it the portal delivers NO
   *   competent authorities and no regional supplements for a Leistungsbeschreibung)
   * - `BehoerdenAnsprechpartnerZuordnungen` → `behoerdenAnsprechpartnerZuordnungen`
   *   (`DIREKTBEVORZUGT` | `DIREKT` | `ALLE` | `NEIN`)
   *
   * @param service The whitelisted `Service` key.
   * @param ids The id values for `{id}`, `{id2}` and `{id3}` (missing ones stay empty).
   * @param params The servlet params (for the optional query headers).
   * @return A [Pair] of the absolute URL and an error message — exactly one of them is `null`.
   */
  protected fun buildUrl(
      service: String,
      ids: List<String?>,
      params: IPluginServletActionParams
  ): Pair<String?, String?> {
    val template = RESOURCES[service] ?: return Pair(null, "Unknown BayVIS resource '$service'.")

    var path = template
    val replacements = arrayOf("{id}", "{id2}", "{id3}")

    for ((index, placeholder) in replacements.withIndex()) {
      if (!path.contains(placeholder)) continue
      val value = ids.getOrNull(index)?.trim().orEmpty()

      if (value.isEmpty()) {
        return Pair(null, "BayVIS resource '$service' requires a path id (header ID/ID2/ID3).")
      }

      path = path.replace(placeholder, pathSegment(value))
    }

    val query = ArrayList<String>()

    for ((header, parameter) in BOOLEAN_QUERY_PARAMETERS) {
      val raw = params.headerMap[header]?.trim() ?: continue

      if (raw.isEmpty()) continue

      when (raw.lowercase()) {
        "true",
        "false" -> query.add("$parameter=${queryValue(raw.lowercase())}")
        else -> return Pair(null, "'$header' must be \"true\" or \"false\" (got \"$raw\").")
      }
    }

    val gemeindekennziffer = params.headerMap["Gemeindekennziffer"]?.trim()

    if (!gemeindekennziffer.isNullOrEmpty()) {
      if (!GEMEINDEKENNZIFFER.matches(gemeindekennziffer)) {
        return Pair(
            null,
            "'Gemeindekennziffer' must be an 8-digit official municipality key " +
                "(e.g. \"09162000\" for Munich), got \"$gemeindekennziffer\".")
      }

      query.add("gemeindekennziffer=${queryValue(gemeindekennziffer)}")
    }

    val contacts = params.headerMap["BehoerdenAnsprechpartnerZuordnungen"]?.trim()

    if (!contacts.isNullOrEmpty()) {
      val mode = contacts.uppercase()

      if (!CONTACT_MODES.contains(mode)) {
        return Pair(
            null,
            "'BehoerdenAnsprechpartnerZuordnungen' must be one of " +
                "${CONTACT_MODES.joinToString(", ")} (got \"$contacts\").")
      }

      query.add("behoerdenAnsprechpartnerZuordnungen=$mode")
    }

    val url =
        baseUrl.trimEnd('/') + path + if (query.isEmpty()) "" else "?" + query.joinToString("&")

    return Pair(url, null)
  }

  /**
   * Retrieves the requested resource from the BayVIS-API, storing the result into the [buffer] and
   * updating the [lastContact].
   *
   * @param key The cache key of the request.
   * @param url The absolute URL to call.
   * @param service The service label used in error messages.
   * @return A [Pair] of [Int] & [String] stating the statuscode and the request's result.
   */
  protected fun retrieveData(key: String, url: String, service: String): Pair<Int, String?> {
    var statusCode: Int

    try {
      val target: URL = URI(url).toURL()
      val connection = target.openConnection() as HttpURLConnection
      // Never let a hanging/blocked endpoint stall the plugin start-up.
      connection.connectTimeout = 10_000
      connection.readTimeout = 20_000

      connection.setRequestMethod("GET")
      connection.setRequestProperty(
          "Authorization",
          "Basic " +
              java.util.Base64.getEncoder()
                  .encodeToString(("$username:$password").toByteArray(StandardCharsets.UTF_8)))
      // JSON keeps the client-side parsing deterministic (no XML envelope names to guess).
      connection.setRequestProperty("Accept", "application/json")

      statusCode = connection.getResponseCode()
      buffer[key] =
          if (statusCode in 200..299) {
            lastContact[key] = System.currentTimeMillis()

            readBody(connection.inputStream.bufferedReader(StandardCharsets.UTF_8))
          } else {
            val errorResult =
                connection.errorStream?.bufferedReader(StandardCharsets.UTF_8)?.use {
                  it.readText()
                }

            BayVISAuskunftErrors.describe(service, url, statusCode, errorResult)
          }

      connection.disconnect()
    } catch (e: IOException) {
      buffer[key] = BayVISAuskunftErrors.connectionFailure(url, e)
      statusCode = 500
    }

    return Pair(statusCode, buffer[key])
  }

  /** Reads a response body with the reader, closing it afterwards. */
  private fun readBody(reader: java.io.BufferedReader): String = reader.use { it.readText() }

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

  /** Returns "CodBi_BayVIS_Auskunft_Ressourcen" */
  override fun getName(): String = NAME

  /** Sets the [username], [password] & optionally [baseUrl]. */
  override fun initialize(configData: IPluginInitializeData) {
    this.username = configData.properties.getProperty("BayVIS_Benutzername")
    this.password = configData.properties.getProperty("BayVIS_Passwort")

    if (configData.properties.getProperty("BayVIS_UpdateCycle") != null) {
      hrsTillUpdate = configData.properties.getProperty("BayVIS_UpdateCycle").toInt()
    }

    val newURL: String? = configData.properties.getProperty("BayVIS_EP_Ressourcen")

    if (!newURL.isNullOrBlank()) {
      this.baseUrl = newURL
    }
    // Never let a malformed endpoint abort the plugin start (see BayVISAuskunftStartup). Only the
    // URL itself is validated here: no resource is fetched at start-up, because every resource
    // (except the two collections) needs an id that is only known at form runtime.
    BayVISAuskunftStartup.startupCheck("Ressourcen", baseUrl, configData.client) {
      java.net.URI("${baseUrl.trimEnd('/')}/dienststellen").toURL()
      200
    }
  }

  /**
   * Retrieves the whitelisted resource from the BayVIS-API if it isn't already [buffer]ed or the
   * [hrsTillUpdate] have passed.
   */
  public override fun execute(p0: IPluginServletActionParams): IPluginServletActionRetVal {
    val service = p0.headerMap["Service"]?.trim().orEmpty()

    if (service.isEmpty() || !RESOURCES.containsKey(service)) {
      return jsonResponse(
          """{"error":${quote("Unknown BayVIS resource '${service.replace("\"", "")}'. Supported: ${RESOURCES.keys.joinToString(", ")}")}}""")
    }

    val (builtUrl, buildError) =
        buildUrl(service, listOf(p0.headerMap["ID"], p0.headerMap["ID2"], p0.headerMap["ID3"]), p0)

    if (buildError != null || builtUrl == null) {
      return jsonResponse(
          """{"error":${quote(buildError ?: "Unable to build the BayVIS resource URL.")}}""")
    }

    val url: String = builtUrl

    val key = "$service|$url"
    var needsFetch = false

    synchronized(cacheLock) {
      val fetchedAt = lastContact[key] ?: 0L
      val stale = System.currentTimeMillis() - fetchedAt >= hrsTillUpdate.toLong() * 3_600_000L

      if (buffer[key] == null || stale) needsFetch = true
    }

    if (needsFetch) retrieveData(key, url, service)

    val servletResponse = ServletResponse(EResponseType.HTML)
    servletResponse.encoding = StandardCharsets.UTF_8.name()
    servletResponse.value = buffer[key]

    return PluginServletActionRetVal(servletResponse)
  }

  /** Escapes a [String] for use inside a JSON string literal. */
  private fun quote(value: String): String {
    val escaped =
        value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r")
    return "\"$escaped\""
  }

  private fun jsonResponse(json: String): IPluginServletActionRetVal =
      PluginServletActionRetVal(ServletResponse(EResponseType.HTML, json))
}
