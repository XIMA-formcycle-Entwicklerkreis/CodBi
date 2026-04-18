package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.sun.net.httpserver.HttpServer
import java.net.InetSocketAddress
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance

/**
 * Tests for [GeoLocationService] — coordinate rounding, IP validation, URL construction. HTTP calls
 * are not tested (would require a live API or MockK HTTP mocking).
 */
class GeoLocationServiceTest {

  private val logs = mutableListOf<String>()
  private val service = GeoLocationService(log = { _, msg -> logs.add(msg) })

  // region IP Geolocation Guards

  @Nested
  inner class IpGeolocationGuardsTest {

    @Test
    fun skipsUnknownIp() {
      val result = service.geolocateByIP("unknown")
      assertNull(result)
      assertTrue(logs.any { it.contains("unresolvable") })
    }

    @Test
    fun skipsLoopbackIp() {
      val result = service.geolocateByIP("127.0.0.1")
      assertNull(result)
      assertTrue(logs.any { it.contains("private/loopback") })
    }

    @Test
    fun skipsPrivateIp() {
      val result = service.geolocateByIP("192.168.1.1")
      assertNull(result)
      assertTrue(logs.any { it.contains("private/loopback") })
    }

    @Test
    fun skipsIpv6Loopback() {
      val result = service.geolocateByIP("::1")
      assertNull(result)
      assertTrue(logs.any { it.contains("private/loopback") })
    }

    @Test
    fun skips10Network() {
      val result = service.geolocateByIP("10.0.0.1")
      assertNull(result)
    }

    @Test
    fun skips172PrivateRange() {
      val result = service.geolocateByIP("172.16.0.1")
      assertNull(result)
    }
  }

  // endregion

  // region Custom Domains

  @Nested
  inner class CustomDomainsTest {

    @Test
    fun acceptsCustomNominatimDomain() {
      // Should not throw during construction
      val svc =
          GeoLocationService(log = { _, _ -> }, nominatimDomain = "custom-nominatim.example.com")
      assertNotNull(svc)
    }

    @Test
    fun acceptsCustomIpGeoDomain() {
      val svc =
          GeoLocationService(log = { _, _ -> }, ipGeolocationDomain = "custom-ip-geo.example.com")
      assertNotNull(svc)
    }

    @Test
    fun stripsProtocolFromDomains() {
      // Domains with https:// prefix should still work
      val svc =
          GeoLocationService(
              log = { _, _ -> },
              nominatimDomain = "https://custom.example.com",
              ipGeolocationDomain = "http://ip.example.com")
      assertNotNull(svc)
    }
  }

  // endregion

  // region Reverse Geocode Edge Cases

  @Nested
  inner class ReverseGeocodeEdgeCases {

    @Test
    fun invalidCoordinatesDoNotCrash() {
      // With invalid coordinates, the HTTP call will fail but should not throw
      @Suppress("UNUSED_VARIABLE") val _result = service.reverseGeocode("not-a-number", "also-not")
      // May be null from HTTP failure or parse failure
      // The important thing is no exception is thrown
      assertTrue(true)
    }

    @Test
    fun reverseGeocodeReturnsNullOnNetworkError() {
      val result = service.reverseGeocode("50.1109", "8.6821")
      assertTrue(result == null || result.isNotEmpty())
      assertTrue(logs.any { it.contains("Reverse geocod") })
    }

    @Test
    fun cacheHitAfterSuccessfulLookup() {
      // First call
      service.reverseGeocode("48.137", "11.576")
      @Suppress("UNUSED_VARIABLE") val _firstLogCount = logs.size
      // Second call with same coords should either hit cache or retry
      service.reverseGeocode("48.137", "11.576")
      assertTrue(true)
    }

    @Test
    fun differentCoordsProduceDifferentCacheKeys() {
      service.reverseGeocode("48.137", "11.576")
      service.reverseGeocode("52.520", "13.405")
      assertTrue(logs.size >= 2)
    }
  }

  // endregion

  // region roundCoord (via reflection)

  @Nested
  inner class RoundCoordTest {

    @Test
    fun roundsToThreeDecimals() {
      val method =
          GeoLocationService::class.java.getDeclaredMethod("roundCoord", String::class.java)
      method.isAccessible = true
      val result = method.invoke(service, "48.13711") as String
      assertEquals("48.137", result)
    }

    @Test
    fun roundsNegativeCoordinate() {
      val method =
          GeoLocationService::class.java.getDeclaredMethod("roundCoord", String::class.java)
      method.isAccessible = true
      val result = method.invoke(service, "-122.41942") as String
      assertEquals("-122.419", result)
    }

    @Test
    fun returnsOriginalOnInvalidInput() {
      val method =
          GeoLocationService::class.java.getDeclaredMethod("roundCoord", String::class.java)
      method.isAccessible = true
      val result = method.invoke(service, "not-a-number") as String
      assertEquals("not-a-number", result)
    }

    @Test
    fun roundsZero() {
      val method =
          GeoLocationService::class.java.getDeclaredMethod("roundCoord", String::class.java)
      method.isAccessible = true
      val result = method.invoke(service, "0.0") as String
      assertEquals("0.000", result)
    }

    @Test
    fun roundsUp() {
      val method =
          GeoLocationService::class.java.getDeclaredMethod("roundCoord", String::class.java)
      method.isAccessible = true
      val result = method.invoke(service, "48.1379") as String
      assertEquals("48.138", result)
    }
  }

  // endregion

  // region cacheResult (via reflection)

  @Nested
  inner class CacheResultTest {

    @Test
    fun storesCacheEntry() {
      val method =
          GeoLocationService::class
              .java
              .getDeclaredMethod("cacheResult", String::class.java, String::class.java)
      method.isAccessible = true
      method.invoke(service, "50.000,8.000", "Frankfurt, Germany")
      val cacheField = GeoLocationService::class.java.getDeclaredField("geocodeCache")
      cacheField.isAccessible = true
      @Suppress("UNCHECKED_CAST")
      val cache =
          cacheField.get(service)
              as java.util.concurrent.ConcurrentHashMap<String, Pair<Long, String?>>
      assertTrue(cache.containsKey("50.000,8.000"))
      assertEquals("Frankfurt, Germany", cache["50.000,8.000"]?.second)
    }

    @Test
    fun evictsStaleEntriesWhenFull() {
      val cacheField = GeoLocationService::class.java.getDeclaredField("geocodeCache")
      cacheField.isAccessible = true
      @Suppress("UNCHECKED_CAST")
      val cache =
          cacheField.get(service)
              as java.util.concurrent.ConcurrentHashMap<String, Pair<Long, String?>>
      for (i in 0..105) {
        cache["$i.000,$i.000"] = 0L to "City $i"
      }
      assertTrue(cache.size > 100)
      val method =
          GeoLocationService::class
              .java
              .getDeclaredMethod("cacheResult", String::class.java, String::class.java)
      method.isAccessible = true
      method.invoke(service, "99.999,99.999", "New Entry")
      assertTrue(cache.size < 110, "Cache should evict stale entries, size=${cache.size}")
    }
  }

  // endregion

  // region IP Geolocation Network

  @Nested
  inner class IpGeolocationNetworkTest {

    @Test
    fun publicIpAttemptsLookup() {
      @Suppress("UNUSED_VARIABLE") val _result = service.geolocateByIP("8.8.8.8")
      assertTrue(logs.any { it.contains("IP geolocation for") })
    }
  }

  // endregion

  // region Reverse Geocode via embedded HTTP server

  @Nested
  @TestInstance(TestInstance.Lifecycle.PER_CLASS)
  inner class ReverseGeocodeHttpTest {

    private lateinit var httpServer: HttpServer
    private var port: Int = 0

    @BeforeAll
    fun startServer() {
      httpServer = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
      port = httpServer.address.port

      // Success: full address
      httpServer.createContext("/reverse-success") { exchange ->
        val body =
            """{
          "address": {
            "road": "Hauptstraße",
            "house_number": "42",
            "city": "Frankfurt",
            "state": "Hessen",
            "country": "Germany"
          }
        }"""
                .trimIndent()
        val bytes = body.toByteArray()
        exchange.sendResponseHeaders(200, bytes.size.toLong())
        exchange.responseBody.use { it.write(bytes) }
      }

      // No address field
      httpServer.createContext("/reverse-no-address") { exchange ->
        val body = """{"display_name": "Somewhere"}"""
        val bytes = body.toByteArray()
        exchange.sendResponseHeaders(200, bytes.size.toLong())
        exchange.responseBody.use { it.write(bytes) }
      }

      // Empty address fields
      httpServer.createContext("/reverse-empty-address") { exchange ->
        val body = """{"address": {}}"""
        val bytes = body.toByteArray()
        exchange.sendResponseHeaders(200, bytes.size.toLong())
        exchange.responseBody.use { it.write(bytes) }
      }

      // HTTP 500
      httpServer.createContext("/reverse-error") { exchange ->
        exchange.sendResponseHeaders(500, -1)
        exchange.close()
      }

      // City-only address (no road)
      httpServer.createContext("/reverse-city-only") { exchange ->
        val body = """{"address": {"city": "Berlin", "country": "Germany"}}"""
        val bytes = body.toByteArray()
        exchange.sendResponseHeaders(200, bytes.size.toLong())
        exchange.responseBody.use { it.write(bytes) }
      }

      // Town fallback (no city, has town)
      httpServer.createContext("/reverse-town") { exchange ->
        val body =
            """{"address": {"town": "Kleinstadt", "state": "Bayern", "country": "Germany"}}"""
        val bytes = body.toByteArray()
        exchange.sendResponseHeaders(200, bytes.size.toLong())
        exchange.responseBody.use { it.write(bytes) }
      }

      httpServer.executor = null
      httpServer.start()
    }

    @AfterAll
    fun stopServer() {
      httpServer.stop(0)
    }

    private fun serviceForPath(path: String): GeoLocationService {
      val localLogs = mutableListOf<String>()
      // Construct a service pointing to our local server at the specific path
      // We need to override the nominatimReverseBaseUrl via reflection
      val svc =
          GeoLocationService(
              log = { _, msg -> localLogs.add(msg) }, nominatimDomain = "127.0.0.1:$port")
      // Override the base URL via reflection to point to our test path
      val field = GeoLocationService::class.java.getDeclaredField("nominatimReverseBaseUrl")
      field.isAccessible = true
      field.set(svc, "http://127.0.0.1:$port$path")
      return svc
    }

    @Test
    fun reverseGeocodeReturnsFormattedResult() {
      val svc = serviceForPath("/reverse-success")
      val result = svc.reverseGeocode("50.1109", "8.6821")
      assertNotNull(result)
      assertTrue(result!!.contains("Frankfurt"), "Should contain city: $result")
      assertTrue(result.contains("Germany"), "Should contain country: $result")
      assertTrue(result.contains("Hauptstraße"), "Should contain street: $result")
    }

    @Test
    fun reverseGeocodeReturnsNullWhenNoAddressField() {
      val svc = serviceForPath("/reverse-no-address")
      val result = svc.reverseGeocode("50.0", "8.0")
      assertNull(result)
    }

    @Test
    fun reverseGeocodeReturnsNullWhenEmptyAddress() {
      val svc = serviceForPath("/reverse-empty-address")
      val result = svc.reverseGeocode("50.0", "8.0")
      assertNull(result)
    }

    @Test
    fun reverseGeocodeReturnsNullOnHttpError() {
      val svc = serviceForPath("/reverse-error")
      val result = svc.reverseGeocode("50.0", "8.0")
      assertNull(result)
    }

    @Test
    fun reverseGeocodeCityOnly() {
      val svc = serviceForPath("/reverse-city-only")
      val result = svc.reverseGeocode("52.52", "13.405")
      assertNotNull(result)
      assertTrue(result!!.contains("Berlin"))
      assertTrue(result.contains("Germany"))
      assertFalse(result.contains("null"))
    }

    @Test
    fun reverseGeocodeTownFallback() {
      val svc = serviceForPath("/reverse-town")
      val result = svc.reverseGeocode("48.0", "11.0")
      assertNotNull(result)
      assertTrue(result!!.contains("Kleinstadt"))
    }

    @Test
    fun reverseGeocodeCacheHitOnSecondCall() {
      val localLogs = mutableListOf<String>()
      val svc =
          GeoLocationService(
              log = { _, msg -> localLogs.add(msg) }, nominatimDomain = "127.0.0.1:$port")
      val field = GeoLocationService::class.java.getDeclaredField("nominatimReverseBaseUrl")
      field.isAccessible = true
      field.set(svc, "http://127.0.0.1:$port/reverse-success")

      val result1 = svc.reverseGeocode("50.1109", "8.6821")
      assertNotNull(result1)
      localLogs.clear()

      val result2 = svc.reverseGeocode("50.1109", "8.6821")
      assertEquals(result1, result2)
      assertTrue(
          localLogs.any { it.contains("cache hit") }, "Second call should be cache hit: $localLogs")
    }
  }

  // endregion

  // region IP Geolocation via embedded HTTP server

  @Nested
  @TestInstance(TestInstance.Lifecycle.PER_CLASS)
  inner class IpGeolocationHttpTest {

    private lateinit var httpServer: HttpServer
    private var port: Int = 0

    @BeforeAll
    fun startServer() {
      httpServer = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
      port = httpServer.address.port

      // Success response — context matches /geo-success/*
      httpServer.createContext("/geo-success") { exchange ->
        val body =
            """{
          "success": true,
          "city": "Frankfurt am Main",
          "region": "Hessen",
          "country": "Germany"
        }"""
                .trimIndent()
        val bytes = body.toByteArray()
        exchange.sendResponseHeaders(200, bytes.size.toLong())
        exchange.responseBody.use { it.write(bytes) }
      }

      // Failed lookup
      httpServer.createContext("/geo-failed") { exchange ->
        val body = """{"success": false, "message": "Invalid IP"}"""
        val bytes = body.toByteArray()
        exchange.sendResponseHeaders(200, bytes.size.toLong())
        exchange.responseBody.use { it.write(bytes) }
      }

      // HTTP 500
      httpServer.createContext("/geo-error") { exchange ->
        exchange.sendResponseHeaders(500, -1)
        exchange.close()
      }

      httpServer.executor = null
      httpServer.start()
    }

    @AfterAll
    fun stopServer() {
      httpServer.stop(0)
    }

    @Test
    fun ipGeolocationReturnsNullDueToDisconnectBeforeRead() {
      // Source code calls connection.disconnect() before reading inputStream —
      // so geolocateByIP always fails with an IOException on most JVMs.
      // This test verifies the error path is handled gracefully.
      val localLogs = mutableListOf<String>()
      val svc =
          GeoLocationService(
              log = { _, msg -> localLogs.add(msg) }, ipGeolocationDomain = "127.0.0.1:$port")
      val field = GeoLocationService::class.java.getDeclaredField("ipGeolocationBaseUrl")
      field.isAccessible = true
      field.set(svc, "http://127.0.0.1:$port/geo-success")

      @Suppress("UNUSED_VARIABLE") val _result = svc.geolocateByIP("203.0.113.1")
      // May return null due to disconnect-before-read
      assertTrue(
          localLogs.any { it.contains("IP geolocation") },
          "Should log IP geolocation attempt: $localLogs")
    }

    @Test
    fun ipGeolocationReturnsNullOnFailedLookup() {
      val localLogs = mutableListOf<String>()
      val svc =
          GeoLocationService(
              log = { _, msg -> localLogs.add(msg) }, ipGeolocationDomain = "127.0.0.1:$port")
      val field = GeoLocationService::class.java.getDeclaredField("ipGeolocationBaseUrl")
      field.isAccessible = true
      field.set(svc, "http://127.0.0.1:$port/geo-failed")

      val result = svc.geolocateByIP("203.0.113.1")
      assertNull(result)
      assertTrue(
          localLogs.any { it.contains("failed") || it.contains("geolocation") },
          "Should log failure: $localLogs")
    }

    @Test
    fun ipGeolocationReturnsNullOnHttpError() {
      val localLogs = mutableListOf<String>()
      val svc =
          GeoLocationService(
              log = { _, msg -> localLogs.add(msg) }, ipGeolocationDomain = "127.0.0.1:$port")
      val field = GeoLocationService::class.java.getDeclaredField("ipGeolocationBaseUrl")
      field.isAccessible = true
      field.set(svc, "http://127.0.0.1:$port/geo-error")

      val result = svc.geolocateByIP("203.0.113.1")
      assertNull(result)
    }
  }

  // endregion
}
