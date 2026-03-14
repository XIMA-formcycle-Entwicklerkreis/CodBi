package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import java.net.HttpURLConnection
import java.net.InetAddress
import java.util.concurrent.ConcurrentHashMap

/**
 * Resolves geographic locations from coordinates (reverse geocoding) and IP addresses. Uses
 * OpenStreetMap Nominatim for reverse geocoding and ipwho.is for IP-based geolocation.
 *
 * @param log Logger callback for diagnostic messages.
 * @param nominatimDomain Domain for Nominatim reverse geocoding requests.
 * @param ipGeolocationDomain Domain for IP geolocation requests.
 */
internal class GeoLocationService(
    private val log: (LogLevel, String) -> Unit,
    nominatimDomain: String = DEFAULT_NOMINATIM_DOMAIN,
    ipGeolocationDomain: String = DEFAULT_IP_GEOLOCATION_DOMAIN
) {

  companion object {
    /** Shared JSON mapper used to parse Nominatim and ipwho.is API responses. */
    private val mapper = com.fasterxml.jackson.databind.ObjectMapper()

    /** Nominatim connect and read timeout. */
    private const val NOMINATIM_TIMEOUT_MS = 5_000

    /** IP geolocation connect and read timeout. */
    private const val IP_GEO_TIMEOUT_MS = 3_000

    /** Cache entry lifetime (10 minutes). */
    private const val CACHE_TTL_MS = 600_000L

    /** Maximum cached geocode entries before stale eviction is forced. */
    private const val CACHE_MAX_SIZE = 100

    /** Default OpenStreetMap Nominatim domain. */
    private const val DEFAULT_NOMINATIM_DOMAIN = "nominatim.openstreetmap.org"

    /** Default ipwho.is domain for IP geolocation. */
    private const val DEFAULT_IP_GEOLOCATION_DOMAIN = "ipwho.is"
  }

  /** Time-limited cache for reverse geocoding results, keyed by rounded lat/lon. */
  private val geocodeCache = ConcurrentHashMap<String, Pair<Long, String?>>()

  /** Base reverse-geocoding endpoint built from the configured Nominatim domain. */
  private val nominatimReverseBaseUrl =
      "https://${nominatimDomain.trim().removePrefix("https://").removePrefix("http://").trimEnd('/')}/reverse"

  /** Base endpoint for IP geolocation requests. */
  private val ipGeolocationBaseUrl =
      "https://${ipGeolocationDomain.trim().removePrefix("https://").removePrefix("http://").trimEnd('/')}"

  /**
   * Resolves latitude/longitude to a human-readable city and country name via the OpenStreetMap
   * Nominatim reverse geocoding API (free, no API key required).
   *
   * @return A string like "Frankfurt am Main, Germany" or `null` if the lookup fails.
   */
  fun reverseGeocode(latitude: String, longitude: String): String? {
    val cacheKey = "${roundCoord(latitude)},${roundCoord(longitude)}"

    geocodeCache[cacheKey]?.let { (timestamp, value) ->
      if (System.currentTimeMillis() - timestamp < CACHE_TTL_MS) {
        log(LogLevel.INFO, "Reverse geocode cache hit: $value")

        return value
      }
    }

    return try {
      log(LogLevel.INFO, "Reverse geocoding: lat=$latitude, lon=$longitude")

      val connection =
          java.net
              .URI(
                  "$nominatimReverseBaseUrl?lat=$latitude&lon=$longitude&format=json&zoom=18&addressdetails=1")
              .toURL()
              .openConnection() as HttpURLConnection

      connection.requestMethod = "GET"
      connection.connectTimeout = NOMINATIM_TIMEOUT_MS
      connection.readTimeout = NOMINATIM_TIMEOUT_MS
      connection.setRequestProperty("User-Agent", "CodBi-FormcyclePlugin/1.0")
      connection.setRequestProperty("Accept", "application/json")

      val responseCode = connection.responseCode

      if (responseCode !in 200..299) {
        log(LogLevel.WARNING, "Nominatim returned HTTP $responseCode")

        connection.disconnect()

        return null
      }

      val body = connection.inputStream.bufferedReader().readText()

      connection.disconnect()

      val root = mapper.readTree(body)
      val address = root.get("address")

      if (address == null) {
        log(LogLevel.WARNING, "Nominatim response has no address field")

        return null
      }

      val road = address.get("road")?.asText()
      val houseNumber = address.get("house_number")?.asText()
      val city =
          address.get("city")?.asText()
              ?: address.get("town")?.asText()
              ?: address.get("village")?.asText()
              ?: address.get("municipality")?.asText()
              ?: address.get("county")?.asText()
      val state = address.get("state")?.asText()
      val country = address.get("country")?.asText()
      val street = if (road != null && houseNumber != null) "$road $houseNumber" else road
      val parts = listOfNotNull(city, street, state, country).filter { it.isNotBlank() }

      if (parts.isEmpty()) {
        log(LogLevel.WARNING, "Nominatim address has no usable fields: $body")

        return null
      }

      val result = parts.joinToString(", ")

      log(LogLevel.INFO, "Reverse geocoded: $result")

      cacheResult(cacheKey, result)

      result
    } catch (e: Exception) {
      log(LogLevel.WARNING, "Reverse geocoding failed: ${e.message}")

      null
    }
  }

  /**
   * Resolves the user's location from the client IP address via ipwho.is (free, HTTPS). This is a
   * fallback when browser geolocation is unavailable (e.g. HTTP, permission denied).
   *
   * @return A string like "Frankfurt am Main, Hessen, Germany" or `null` if lookup fails or IP is
   *   private/loopback.
   */
  fun geolocateByIP(clientIP: String): String? {
    if (clientIP == "unknown") {
      log(LogLevel.INFO, "IP geolocation skipped: unresolvable client IP")

      return null
    }

    return try {
      val addr = InetAddress.getByName(clientIP)

      if (addr.isLoopbackAddress || addr.isSiteLocalAddress) {
        log(LogLevel.INFO, "IP geolocation skipped: private/loopback IP '$clientIP'")

        return null
      }

      log(LogLevel.INFO, "IP geolocation for: $clientIP")

      val connection =
          java.net.URI("$ipGeolocationBaseUrl/$clientIP").toURL().openConnection()
              as HttpURLConnection

      connection.requestMethod = "GET"
      connection.connectTimeout = IP_GEO_TIMEOUT_MS
      connection.readTimeout = IP_GEO_TIMEOUT_MS
      connection.setRequestProperty("Accept", "application/json")

      val responseCode = connection.responseCode

      if (responseCode !in 200..299) {
        log(LogLevel.WARNING, "ipwho.is returned HTTP $responseCode")
        connection.disconnect()

        return null
      }

      connection.disconnect()

      val root = mapper.readTree(connection.inputStream.bufferedReader().readText())

      if (root.get("success")?.asBoolean() != true) {
        log(LogLevel.WARNING, "ipwho.is lookup failed: ${root.get("message")?.asText()}")

        return null
      }

      val parts =
          listOfNotNull(
                  root.get("city")?.asText(),
                  root.get("region")?.asText(),
                  root.get("country")?.asText())
              .filter { it.isNotBlank() }

      if (parts.isEmpty()) return null

      val result = parts.joinToString(", ")

      log(LogLevel.INFO, "IP geolocation result: $result")

      result
    } catch (e: Exception) {
      log(LogLevel.WARNING, "IP geolocation failed: ${e.message}")

      null
    }
  }

  /** Rounds a coordinate string to 3 decimal places (~111 m) for cache-key grouping. */
  private fun roundCoord(coord: String): String {
    return String.format(java.util.Locale.US, "%.3f", coord.toDoubleOrNull() ?: return coord)
  }

  /** Stores a geocode result and evicts stale entries if the cache exceeds its size limit. */
  private fun cacheResult(key: String, value: String?) {
    geocodeCache[key] = System.currentTimeMillis() to value

    if (geocodeCache.size > CACHE_MAX_SIZE) {
      geocodeCache.entries.removeIf { System.currentTimeMillis() - it.value.first > CACHE_TTL_MS }
    }
  }
}
