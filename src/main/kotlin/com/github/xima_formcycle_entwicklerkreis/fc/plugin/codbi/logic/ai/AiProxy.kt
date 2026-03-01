package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai

// region Imports
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.net.HttpURLConnection
import java.net.URI
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.util.Base64
import org.slf4j.LoggerFactory

// endregion Imports

// ═══════════════════════════════════════════════════════════════════════════════
//  AiProxy — Authenticated reverse proxy to a local llama-server
// ═══════════════════════════════════════════════════════════════════════════════
//
// Exposes two llama-server endpoints through Formcycle's HTTP stack:
//
//   POST  <fc>/plugin?name=CodBi_AI_Proxy&endpoint=/v1/chat/completions
//   POST  <fc>/plugin?name=CodBi_AI_Proxy&endpoint=/completion
//
// Security is enforced via:
//   • IP whitelist            → plugin property  AI_Proxy_AllowedIPs
//   • HTTP Basic Auth         → plugin property  AI_Proxy_Users
//
// Every request is logged to the Formcycle database table `codbi_ai_proxy` with
// anonymised caller information (SHA-256 of username, first two octets of IP).
//
// ┌────────────────────────────────────┐
// │  External Client                   │
// │  Authorization: Basic base64(u:p)  │
// └──────────────┬─────────────────────┘
//                │  HTTPS (Formcycle port)
//                ▼
// ┌──────────────────────────────────────────┐
// │  Formcycle → AiProxy servlet             │
// │   1. Check IP against whitelist          │
// │   2. Verify Basic Auth credentials       │
// │   3. Forward POST body to llama-server   │
// │   4. Return response                     │
// │   5. Log (anonymised) into H2            │
// └──────────────────────────────────────────┘
//                │  HTTP 127.0.0.1:port
//                ▼
// ┌──────────────────────────────────────────┐
// │  llama-server (managed by LLAMA.kt)      │
// └──────────────────────────────────────────┘
//
// ## Plugin properties
// | Property               | Format                        | Example                           |
// |------------------------|-------------------------------|-----------------------------------|
// | `AI_Proxy_AllowedIPs`  | Comma-separated IPs / CIDRs  | `192.168.1.0/24,10.0.0.5`        |
// | `AI_Proxy_Users`       | Comma-separated user:pass     | `alice:secret1,bob:secret2`       |
//
// ## Database
// The audit table `codbi_ai_proxy` is managed by [AiProxyEntities] using Formcycle's
// IPluginEntities API with Liquibase schema migration and JPA for data access.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * # CodBi AI Proxy
 *
 * Servlet that proxies HTTP requests from authenticated external clients to the local llama-server
 * managed by [LLAMA]. Provides IP-based access control, multi-user Basic Auth, and anonymised
 * request logging into the Formcycle database.
 *
 * Database access is provided by [AiProxyEntities] via Formcycle's
 * [IPluginEntities][de.xima.fc.plugin.entities.IPluginEntities] API — the audit table schema is
 * managed by Liquibase and data access uses JPA.
 *
 * Formcycle auto-discovers this class because it implements [IPluginServletAction].
 */
class AiProxy : IPluginServletAction {

  private val logger = LoggerFactory.getLogger(AiProxy::class.java)

  // ── Configuration ──────────────────────────────────────────────────────

  /** Set of allowed IPs and CIDR ranges. Empty = deny all. */
  private var allowedIPs: Set<String> = emptySet()

  /** Map of username → password for Basic Auth. */
  private var credentials: Map<String, String> = emptyMap()

  /** Parsed CIDR entries for subnet matching. */
  private data class CidrEntry(val network: Long, val mask: Long)

  private var cidrEntries: List<CidrEntry> = emptyList()

  /** Plain IPs (no CIDR suffix) for exact matching. */
  private var exactIPs: Set<String> = emptySet()

  /** Allowed endpoint paths that can be proxied. */
  private val allowedEndpoints = setOf("/v1/chat/completions", "/completion")

  // ═══════════════════════════════════════════════════════════════════════
  //  Lifecycle
  // ═══════════════════════════════════════════════════════════════════════

  override fun getName(): String = "CodBi_AI_Proxy"

  /**
   * Reads plugin properties for IP whitelist and user credentials. Database setup is handled
   * separately by [AiProxyEntities].
   *
   * Expected properties:
   * - **AI_Proxy_AllowedIPs** — comma-separated IPs or CIDRs (e.g. `10.0.0.5,192.168.1.0/24`)
   * - **AI_Proxy_Users** — comma-separated `user:password` pairs
   */
  override fun initialize(configData: IPluginInitializeData) {
    // ── IP whitelist ─────────────────────────────────────────────────────
    val ipRaw = configData.properties.getProperty("AI_Proxy_AllowedIPs") ?: ""
    val entries = ipRaw.split(",").map { it.trim() }.filter { it.isNotEmpty() }
    val cidrs = mutableListOf<CidrEntry>()
    val exacts = mutableSetOf<String>()
    for (entry in entries) {
      if ("/" in entry) {
        parseCidr(entry)?.let { cidrs.add(it) }
      } else {
        exacts.add(entry)
      }
    }
    cidrEntries = cidrs
    exactIPs = exacts
    allowedIPs = exacts

    // ── Credentials ──────────────────────────────────────────────────────
    val usersRaw = configData.properties.getProperty("AI_Proxy_Users") ?: ""
    val creds = mutableMapOf<String, String>()
    for (pair in usersRaw.split(",").map { it.trim() }.filter { it.isNotEmpty() }) {
      val colonIdx = pair.indexOf(':')
      if (colonIdx > 0 && colonIdx < pair.length - 1) {
        val user = pair.substring(0, colonIdx)
        val pass = pair.substring(colonIdx + 1)
        creds[user] = pass
      } else {
        log("WARNING", "Ignoring malformed credential entry (expected user:password)")
      }
    }
    credentials = creds

    // ── Brave Search API key ────────────────────────────────────────────
    configData.properties
        .getProperty("AI_BraveSearch_ApiKey")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { BraveSearch.apiKey = it }

    log(
        "INFO",
        "Initialised — ${exactIPs.size + cidrEntries.size} IP rules, ${credentials.size} users, " +
            "BraveSearch: ${if (BraveSearch.isAvailable) "enabled" else "disabled"}")
  }

  override fun shutdown(shutdownData: IPluginShutdownData?) {
    log("INFO", "Shutting down AI Proxy")
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Request handling
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Processes an incoming proxy request.
   *
   * Expected parameters / headers:
   * - Query/form parameter **endpoint** — one of `/v1/chat/completions` or `/completion`
   * - HTTP header **Authorization** — `Basic base64(username:password)`
   * - HTTP header **X-Request-Body** — the JSON body to forward (Base64-encoded)
   * - Or form parameter **body** — the JSON body to forward (plain text)
   *
   * Caller IP is extracted from `X-Forwarded-For` or `X-Real-IP` headers, falling back to
   * `Remote-Addr`.
   */
  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val startMs = System.currentTimeMillis()

    // ── Resolve client IP ────────────────────────────────────────────────
    val clientIP = resolveClientIP(params)

    // ── IP whitelist check ───────────────────────────────────────────────
    if (!isIPAllowed(clientIP)) {
      log("WARNING", "Blocked request from $clientIP — not in whitelist")
      auditLog(clientIP, null, null, 403, "IP_DENIED", System.currentTimeMillis() - startMs)
      return errorResponse(403, """{"error":"Forbidden","message":"IP not allowed"}""")
    }

    // ── Basic Auth ───────────────────────────────────────────────────────
    val authHeader =
        params.headerMap.entries.find { it.key.equals("Authorization", ignoreCase = true) }?.value

    val username = authenticateBasicAuth(authHeader)
    if (username == null) {
      log("WARNING", "Authentication failed from $clientIP")
      auditLog(clientIP, null, null, 401, "AUTH_FAILED", System.currentTimeMillis() - startMs)
      return errorResponse(
          401,
          """{"error":"Unauthorized","message":"Invalid credentials"}""",
          mapOf("WWW-Authenticate" to "Basic realm=\"CodBi AI Proxy\""))
    }

    // ── Resolve endpoint ─────────────────────────────────────────────────
    val endpoint =
        params.requestParameters["endpoint"]?.firstOrNull()
            ?: params.headerMap.entries
                .find { it.key.equals("X-Endpoint", ignoreCase = true) }
                ?.value

    if (endpoint == null || endpoint !in allowedEndpoints) {
      log("WARNING", "Invalid endpoint '$endpoint' from $clientIP / $username")
      auditLog(
          clientIP, username, endpoint, 400, "BAD_ENDPOINT", System.currentTimeMillis() - startMs)
      return errorResponse(
          400,
          """{"error":"Bad Request","message":"Missing or invalid 'endpoint' parameter. Allowed: $allowedEndpoints"}""")
    }

    // ── Resolve request body ─────────────────────────────────────────────
    val requestBody = resolveRequestBody(params)
    if (requestBody == null) {
      auditLog(clientIP, username, endpoint, 400, "NO_BODY", System.currentTimeMillis() - startMs)
      return errorResponse(
          400,
          """{"error":"Bad Request","message":"No request body provided. Use 'body' parameter or 'X-Request-Body' header (Base64)."}""")
    }

    // ── Check llama-server availability ──────────────────────────────────
    val port = LLAMA.activeServerPort
    if (port == 0) {
      log("WARNING", "llama-server port not set — is the AI activated?")
      auditLog(
          clientIP,
          username,
          endpoint,
          503,
          "SERVER_UNAVAILABLE",
          System.currentTimeMillis() - startMs)
      return errorResponse(
          503, """{"error":"Service Unavailable","message":"AI server is not running"}""")
    }

    // ── Forward to llama-server ──────────────────────────────────────────
    return try {
      val serverUrl = "http://127.0.0.1:$port$endpoint"
      var response = forwardPost(serverUrl, requestBody)

      // ── CALL:search tool handling ──────────────────────────────────
      if (BraveSearch.isAvailable && endpoint == "/v1/chat/completions") {
        response = handleSearchInProxyResponse(response, requestBody, serverUrl)
      }

      val elapsedMs = System.currentTimeMillis() - startMs

      auditLog(clientIP, username, endpoint, 200, "OK", elapsedMs)
      log(
          "INFO",
          "Proxied $endpoint for ${anonymiseUser(username)} from ${anonymiseIP(clientIP)} (${elapsedMs}ms)")

      jsonResponse(response)
    } catch (ex: Exception) {
      val elapsedMs = System.currentTimeMillis() - startMs
      log("ERROR", "Proxy error for $endpoint: ${ex.message}")
      auditLog(
          clientIP, username, endpoint, 502, "PROXY_ERROR: ${ex.message?.take(200)}", elapsedMs)
      errorResponse(
          502,
          """{"error":"Bad Gateway","message":"Failed to reach AI server: ${escapeJson(ex.message ?: "unknown error")}"}""")
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  IP resolution & whitelist
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Extracts the client IP from proxy headers or falls back to
   * [IPluginServletActionParams.getRemoteAddr].
   */
  private fun resolveClientIP(params: IPluginServletActionParams): String {
    val headers = params.headerMap
    // X-Forwarded-For may contain a chain: "client, proxy1, proxy2"
    val xff = headers.entries.find { it.key.equals("X-Forwarded-For", ignoreCase = true) }?.value
    if (!xff.isNullOrBlank()) {
      return xff.split(",").first().trim()
    }
    val xri = headers.entries.find { it.key.equals("X-Real-IP", ignoreCase = true) }?.value
    if (!xri.isNullOrBlank()) {
      return xri.trim()
    }
    // Use the servlet container's remote address (provided by Formcycle)
    val raw = params.remoteAddr?.trim() ?: return "unknown"
    // Strip brackets that Java may add around IPv6 addresses: [::1] → ::1
    val stripped =
        if (raw.startsWith("[") && raw.endsWith("]")) raw.substring(1, raw.length - 1) else raw
    // Normalise IPv6 loopback variants to IPv4 loopback for simpler whitelist config
    return when (stripped) {
      "::1",
      "0:0:0:0:0:0:0:1" -> "127.0.0.1"
      else -> stripped
    }
  }

  /**
   * Checks whether [ip] is allowed by the configured whitelist. Supports exact matches and CIDR
   * subnet checks.
   */
  private fun isIPAllowed(ip: String): Boolean {
    if (exactIPs.isEmpty() && cidrEntries.isEmpty()) return false
    if (ip in exactIPs) return true
    // Check CIDR ranges
    val ipLong = ipToLong(ip) ?: return false
    return cidrEntries.any { (network, mask) -> (ipLong and mask) == network }
  }

  /** Parses a CIDR string like `192.168.1.0/24` into a [CidrEntry]. */
  private fun parseCidr(cidr: String): CidrEntry? {
    return try {
      val parts = cidr.split("/")
      val ip = ipToLong(parts[0]) ?: return null
      val prefix = parts[1].toInt()
      if (prefix !in 0..32) return null
      val mask = if (prefix == 0) 0L else (-1L shl (32 - prefix)) and 0xFFFFFFFFL
      CidrEntry(ip and mask, mask)
    } catch (_: Exception) {
      log("WARNING", "Failed to parse CIDR: $cidr")
      null
    }
  }

  /** Converts an IPv4 string to a numeric representation. */
  private fun ipToLong(ip: String): Long? {
    return try {
      val octets = ip.split(".")
      if (octets.size != 4) return null
      var result = 0L
      for (octet in octets) {
        val v = octet.toInt()
        if (v !in 0..255) return null
        result = (result shl 8) or v.toLong()
      }
      result
    } catch (_: Exception) {
      null
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Authentication
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Validates a `Basic` Authorization header against configured credentials.
   *
   * @return The username if valid, `null` otherwise.
   */
  private fun authenticateBasicAuth(authHeader: String?): String? {
    if (authHeader == null || !authHeader.startsWith("Basic ", ignoreCase = true)) return null
    return try {
      val decoded =
          String(Base64.getDecoder().decode(authHeader.substring(6).trim()), Charsets.UTF_8)
      val colonIdx = decoded.indexOf(':')
      if (colonIdx <= 0) return null
      val user = decoded.substring(0, colonIdx)
      val pass = decoded.substring(colonIdx + 1)
      if (credentials[user] == pass) user else null
    } catch (_: Exception) {
      null
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Request body resolution
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Extracts the JSON request body from either:
   * - Form/query parameter `body` (plain JSON text)
   * - Header `X-Request-Body` (Base64-encoded JSON)
   */
  private fun resolveRequestBody(params: IPluginServletActionParams): String? {
    // Try plain-text body parameter first
    val body = params.requestParameters["body"]?.firstOrNull()
    if (!body.isNullOrBlank()) return body

    // Try Base64-encoded header
    val b64 =
        params.headerMap.entries.find { it.key.equals("X-Request-Body", ignoreCase = true) }?.value
    if (!b64.isNullOrBlank()) {
      return try {
        String(Base64.getDecoder().decode(b64.trim()), Charsets.UTF_8)
      } catch (_: Exception) {
        null
      }
    }

    return null
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Web Search Tool (CALL:search) handling for proxy path
  // ═══════════════════════════════════════════════════════════════════════

  /** Maximum search round-trips in proxy mode. */
  private val maxSearchRoundTrips = 2

  /**
   * Inspects the llama-server response for `CALL:search(query='...')` markers. If found, performs a
   * Brave web search, injects the results into the conversation, and re-queries the model.
   *
   * @param responseJson The raw JSON response from llama-server.
   * @param originalRequestBody The original request body sent by the client.
   * @param serverUrl The llama-server URL.
   * @return The final response JSON (original or search-augmented).
   */
  private fun handleSearchInProxyResponse(
      responseJson: String,
      originalRequestBody: String,
      serverUrl: String
  ): String {
    var currentResponse = responseJson

    for (round in 1..maxSearchRoundTrips) {
      // Extract assistant content from the response
      val assistantContent = extractAssistantContent(currentResponse) ?: break
      val match = BraveSearch.CALL_SEARCH_PATTERN.find(assistantContent) ?: break

      val query = match.groupValues[1]
      log("INFO", "Proxy: Model requested web search (round $round): '$query'")

      val results = BraveSearch.search(query)
      if (results.isEmpty()) {
        log("WARNING", "Proxy: Web search returned no results for: '$query'")
        break
      }

      val searchContext = BraveSearch.formatResultsForModel(results)

      // Build a new request with the search results appended to the messages
      val augmentedBody =
          injectSearchResultsIntoRequest(originalRequestBody, assistantContent, searchContext)
              ?: break

      currentResponse = forwardPost(serverUrl, augmentedBody)
      log("INFO", "Proxy: Search-augmented response (round $round) received")
    }

    return currentResponse
  }

  /** Extracts the assistant's content text from an OpenAI-compatible chat completion response. */
  private fun extractAssistantContent(responseJson: String): String? {
    return try {
      val json = com.google.gson.JsonParser.parseString(responseJson).asJsonObject
      json
          .getAsJsonArray("choices")
          ?.get(0)
          ?.asJsonObject
          ?.getAsJsonObject("message")
          ?.get("content")
          ?.asString
    } catch (_: Exception) {
      null
    }
  }

  /**
   * Takes the original request body and appends the assistant's CALL:search response plus the
   * search results as a new user message to the messages array.
   *
   * @return The augmented request body JSON, or null on parse failure.
   */
  private fun injectSearchResultsIntoRequest(
      originalRequestBody: String,
      assistantContent: String,
      searchResults: String
  ): String? {
    return try {
      val json = com.google.gson.JsonParser.parseString(originalRequestBody).asJsonObject
      val messages = json.getAsJsonArray("messages") ?: return null

      // Append assistant's response (with CALL:search)
      val assistantMsg =
          com.google.gson.JsonObject().apply {
            addProperty("role", "assistant")
            addProperty("content", assistantContent)
          }
      messages.add(assistantMsg)

      // Append search results as user message
      val searchMsg =
          com.google.gson.JsonObject().apply {
            addProperty("role", "user")
            addProperty("content", searchResults)
          }
      messages.add(searchMsg)

      json.toString()
    } catch (ex: Exception) {
      log("WARNING", "Failed to inject search results: ${ex.message}")
      null
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  HTTP forwarding
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Forwards a JSON POST request to the llama-server and returns the response body.
   *
   * @param url Full URL including endpoint (e.g. `http://127.0.0.1:8392/v1/chat/completions`)
   * @param jsonBody The JSON request body.
   * @return The response body as a String.
   * @throws Exception on connection or HTTP errors.
   */
  private fun forwardPost(url: String, jsonBody: String): String {
    val connection = URI(url).toURL().openConnection() as HttpURLConnection
    connection.requestMethod = "POST"
    connection.doOutput = true
    connection.connectTimeout = 5_000
    connection.readTimeout = 300_000
    connection.setRequestProperty("Content-Type", "application/json")
    connection.setRequestProperty("Accept", "application/json")

    connection.outputStream.use { os -> os.write(jsonBody.toByteArray(Charsets.UTF_8)) }

    val responseCode = connection.responseCode
    val body =
        try {
          (if (responseCode in 200..299) connection.inputStream else connection.errorStream)
              .bufferedReader()
              .readText()
        } catch (_: Exception) {
          ""
        }
    connection.disconnect()

    if (responseCode !in 200..299) {
      throw RuntimeException("llama-server returned HTTP $responseCode: $body")
    }
    return body
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Anonymisation
  // ═══════════════════════════════════════════════════════════════════════

  /** SHA-256 hash of the username, truncated to 12 hex chars. */
  private fun anonymiseUser(username: String): String {
    val digest = MessageDigest.getInstance("SHA-256").digest(username.toByteArray(Charsets.UTF_8))
    return digest.joinToString("") { "%02x".format(it) }.take(12)
  }

  /**
   * Masks an IP address for privacy.
   * - IPv4: keeps the first two octets → `192.168.*.*`
   * - IPv6: keeps the first two groups → `2001:db8:*`
   */
  private fun anonymiseIP(ip: String): String {
    // IPv4
    val v4parts = ip.split(".")
    if (v4parts.size == 4) return "${v4parts[0]}.${v4parts[1]}.*.*"
    // IPv6
    val v6parts = ip.split(":")
    if (v6parts.size >= 3) return "${v6parts[0]}:${v6parts[1]}:*"
    return ip.take(45)
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Audit logging (database via JPA)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Inserts an anonymised audit log entry into `codbi_ai_proxy` using the JPA
   * [EntityManagerFactory][javax.persistence.EntityManagerFactory] provided by [AiProxyEntities].
   *
   * Each call creates its own [EntityManager][javax.persistence.EntityManager] for thread safety.
   * Failures are logged but do not affect the proxy response.
   */
  private fun auditLog(
      clientIP: String,
      username: String?,
      endpoint: String?,
      status: Int,
      detail: String,
      elapsedMs: Long
  ) {
    val emf = AiProxyEntities.entityManagerFactory
    if (emf == null) {
      log("WARNING", "Audit log skipped — database not ready yet")
      return
    }

    val em = emf.createEntityManager()
    try {
      em.transaction.begin()
      em.createNativeQuery(
              "INSERT INTO codbi_ai_proxy (user_hash, ip_masked, endpoint, status, detail, elapsed_ms) " +
                  "VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
          .apply {
            setParameter(1, username?.let { anonymiseUser(it) })
            setParameter(2, anonymiseIP(clientIP))
            setParameter(3, endpoint)
            setParameter(4, status)
            setParameter(5, detail.take(500))
            setParameter(6, elapsedMs)
            executeUpdate()
          }
      em.transaction.commit()
    } catch (ex: Exception) {
      if (em.transaction.isActive) {
        try {
          em.transaction.rollback()
        } catch (_: Exception) {}
      }
      log("WARNING", "Audit log insert failed: ${ex.message}")
    } finally {
      try {
        em.close()
      } catch (_: Exception) {}
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Response helpers
  // ═══════════════════════════════════════════════════════════════════════

  /** Returns a JSON response with HTTP 200. */
  private fun jsonResponse(json: String): IPluginServletActionRetVal {
    val resp =
        ServletResponse(EResponseType.JSON).apply {
          value = json
          encoding = StandardCharsets.UTF_8.name()
        }
    return PluginServletActionRetVal(resp)
  }

  /** Returns a JSON error response with a specific HTTP status code. */
  private fun errorResponse(
      statusCode: Int,
      json: String,
      extraHeaders: Map<String, String>? = null
  ): IPluginServletActionRetVal {
    val resp =
        ServletResponse(EResponseType.JSON).apply {
          httpStatusCode = statusCode
          value = json
          encoding = StandardCharsets.UTF_8.name()
          contentType = "application/json"
          if (extraHeaders != null) {
            httpHeader = extraHeaders
          }
        }
    return PluginServletActionRetVal(resp)
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Utilities
  // ═══════════════════════════════════════════════════════════════════════

  /** Escapes a string for safe inclusion in a JSON value. */
  private fun escapeJson(s: String): String =
      s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r")

  /** Simple console logger following the CodBi convention. */
  private fun log(level: String, message: String) {
    val formatted = "[[ CodBi / AI / Proxy ] $message ]"
    when (level) {
      "INFO" -> logger.info(formatted)
      "WARNING" -> logger.warn(formatted)
      "ERROR" -> logger.error(formatted)
    }
  }
}
