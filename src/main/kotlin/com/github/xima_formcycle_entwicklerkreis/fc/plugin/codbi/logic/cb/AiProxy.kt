package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

// region Imports
// region XIMA
// endregion XIMA
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.LLAMA
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.TesseractAction
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.Whisper
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.net.HttpURLConnection
import java.net.URI
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.util.Base64

// endregion Imports

/**
 * # [CodBi] / [AI] Proxy — Authenticated reverse proxy to local LLAMA-server, Whisper-server, and
 * Tesseract OCR.
 *
 * Servlet that proxies HTTP requests from authenticated external clients to local AI servers
 * managed by [LLAMA] and [Whisper], and to the in-process [TesseractAction] OCR engine. Provides
 * IP-based access control, multi-user Basic Auth, and anonymised request logging into the Formcycle
 * database.
 *
 * Exposes the following endpoints through Formcycle's HTTP stack:
 *
 *     POST  <fc>/plugin?name=CodBi_AI_Proxy&endpoint=/v1/chat/completions
 *     POST  <fc>/plugin?name=CodBi_AI_Proxy&endpoint=/completion
 *     POST  <fc>/plugin?name=CodBi_AI_Proxy&endpoint=/v1/audio/transcriptions
 *     POST  <fc>/plugin?name=CodBi_AI_Proxy&endpoint=/v1/ocr
 *
 * LLAMA and Whisper requests are forwarded via HTTP to their respective local server processes.
 * Tesseract requests are handled in-process via JNI (no external server) through
 * [TesseractAction.performOcr].
 *
 * Security is enforced via:
 * - IP whitelist → plugin property `AI_Proxy_AllowedIPs`
 * - HTTP Basic Auth → plugin property `AI_Proxy_Users`
 *
 * Every request is logged to the Formcycle database table `codbi_ai_proxy` with anonymised caller
 * information (SHA-256 of username, first two octets of IP).
 *
 * ## Plugin properties
 * | Property              | Format                      | Example                     |
 * |-----------------------|-----------------------------|-----------------------------|
 * | `AI_Proxy_AllowedIPs` | Comma-separated IPs / CIDRs | `192.168.1.0/24,10.0.0.5`   |
 * | `AI_Proxy_Users`      | Comma-separated user:pass   | `alice:secret1,bob:secret2` |
 *
 * ## Database
 * The audit table `codbi_ai_proxy` is managed by [AiProxyEntities] using Formcycle's
 * [IPluginEntities][de.xima.fc.plugin.entities.IPluginEntities] API — the audit table schema is
 * managed by Liquibase and data access uses JPA.
 */
class AiProxy : AI() {
  // region Configuration-Properties
  /** Set of allowed IPs and CIDR ranges. Empty = deny all. */
  private var allowedIPs: Set<String> = emptySet()
  /** Map of username → password for Basic Auth. */
  private var credentials: Map<String, String> = emptyMap()

  /** Parsed CIDR entries for subnet matching. */
  private data class CidrEntry(val network: Long, val mask: Long)

  /** Parsed CIDR entries for subnet matching. */
  private var cidrEntries: List<CidrEntry> = emptyList()
  /** Plain IPs (no CIDR suffix) for exact matching. */
  private var exactIPs: Set<String> = emptySet()
  /** Allowed endpoint paths that can be proxied. */
  private val allowedEndpoints =
      setOf("/v1/chat/completions", "/completion", "/v1/audio/transcriptions", "/v1/ocr")

  /** The name of this servlet. */
  override fun getName(): String = "CodBi_AI_Proxy"

  // endregion Configuration-Properties
  /**
   * Reads plugin properties for IP whitelist and user credentials. Database setup is handled
   * separately by [AiProxyEntities].
   *
   * @param configData Provided by the Formcycle environment.
   */
  override fun initialize(configData: IPluginInitializeData) {
    super.initialize(configData)

    idLogMessages = "AI / Proxy"

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

    // region Credentials
    val usersRaw = configData.properties.getProperty("AI_Proxy_Users") ?: ""
    val creds = mutableMapOf<String, String>()

    for (pair in usersRaw.split(",").map { it.trim() }.filter { it.isNotEmpty() }) {
      val colonIdx = pair.indexOf(':')

      if (colonIdx > 0 && colonIdx < pair.length - 1) {
        val user = pair.substring(0, colonIdx)
        val pass = pair.substring(colonIdx + 1)
        creds[user] = pass
      } else {
        log(LogLevel.WARNING, "Ignoring malformed credential entry (expected user:password)")
      }
    }
    credentials = creds
    // endregion Credentials
    // Brave Search
    configData.properties
        .getProperty("AI_BraveSearch_ApiKey")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { BraveSearch.apiKey = it }
    configData.properties
        .getProperty("AI_BraveSearch_MaxResults")
        ?.trim()
        ?.toIntOrNull()
        ?.takeIf { it in 1..20 }
        ?.let { BraveSearch.maxResults = it }
    // Mail Bridge (enabled by default unless explicitly disabled)
    configData.properties.getProperty("AI_Mail_Enabled")?.trim()?.lowercase()?.let { value ->
      MailBridge.enabled = value in listOf("true", "1", "yes")
    }
    configData.properties
        .getProperty("AI_Mail_AllowedRecipients")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { MailBridge.allowedRecipientPattern = Regex(it, RegexOption.IGNORE_CASE) }
    configData.properties.getProperty("AI_Mail_MaxPerHour")?.trim()?.toIntOrNull()?.let {
      MailBridge.maxMailsPerHour = it
    }
    configData.properties
        .getProperty("AI_Mail_MaxPerSession")
        ?.trim()
        ?.toIntOrNull()
        ?.takeIf { it > 0 }
        ?.let { MailBridge.maxMailsPerSession = it }
    configData.properties
        .getProperty("AI_Mail_Disclaimer")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { MailBridge.aiDisclaimer = it }
    // MailBridge reads AiProxyEntities.entityManagerFactory lazily at send time

    log(
        LogLevel.INFO,
        "Initialised — ${exactIPs.size + cidrEntries.size} IP rules, ${credentials.size} users, " +
            "BraveSearch: ${if (BraveSearch.isAvailable) "enabled" else "disabled"}, " +
            "Mail: ${if (MailBridge.isAvailable) "enabled" else "disabled"}")
  }

  /**
   * Initiates a task that removes unused images that're expired ([msExpirationIDedImages]) from the
   * cache ([cacheIDedImages]).
   *
   * @param shutdownData Provided by the Formcycle environment.
   */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    log(LogLevel.INFO, "Shutting down AI Proxy")
    super.shutdown(shutdownData)
  }

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
    val clientIP = resolveClientIP(params)

    if (!isIPAllowed(clientIP)) {
      log(LogLevel.WARNING, "Blocked request from $clientIP — not in whitelist")
      auditLog(clientIP, null, null, 403, "IP_DENIED", System.currentTimeMillis() - startMs)

      return errorResponse(403, """{"error":"Forbidden","message":"IP not allowed"}""")
    }

    // region Authentication.
    val authHeader =
        params.headerMap.entries.find { it.key.equals("Authorization", ignoreCase = true) }?.value

    val username = authenticateBasicAuth(authHeader)
    if (username == null) {
      log(LogLevel.WARNING, "Authentication failed from $clientIP")
      auditLog(clientIP, null, null, 401, "AUTH_FAILED", System.currentTimeMillis() - startMs)

      return errorResponse(
          401,
          """{"error":"Unauthorized","message":"Invalid credentials"}""",
          mapOf("WWW-Authenticate" to "Basic realm=\"CodBi AI Proxy\""))
    }
    // endregion Authentication.
    // region Resolve endpoint.
    val endpoint =
        params.requestParameters["endpoint"]?.firstOrNull()
            ?: params.headerMap.entries
                .find { it.key.equals("X-Endpoint", ignoreCase = true) }
                ?.value

    if (endpoint == null || endpoint !in allowedEndpoints) {
      log(LogLevel.WARNING, "Invalid endpoint '$endpoint' from $clientIP / $username")
      auditLog(
          clientIP, username, endpoint, 400, "BAD_ENDPOINT", System.currentTimeMillis() - startMs)
      return errorResponse(
          400,
          """{"error":"Bad Request","message":"Missing or invalid 'endpoint' parameter. Allowed: $allowedEndpoints"}""")
    }
    // endregion Resolve endpoint.
    // region Resolve Request-Body.
    val requestBody = resolveRequestBody(params)

    if (requestBody == null) {
      auditLog(clientIP, username, endpoint, 400, "NO_BODY", System.currentTimeMillis() - startMs)

      return errorResponse(
          400,
          """{"error":"Bad Request","message":"No request body provided. Use 'body' parameter or 'X-Request-Body' header (Base64)."}""")
    }
    // endregion Resolve Request-Body.
    // region Route to appropriate backend.
    val isWhisperRequest = endpoint == "/v1/audio/transcriptions"

    if (isWhisperRequest) {
      val whisperPort = Whisper.activeWhisperPort
      if (whisperPort == 0) {
        log(LogLevel.WARNING, "whisper-server port not set — is Whisper activated?")
        auditLog(
            clientIP,
            username,
            endpoint,
            503,
            "WHISPER_UNAVAILABLE",
            System.currentTimeMillis() - startMs)
        return errorResponse(
            503, """{ "error":"Service Unavailable","message":"Whisper server is not running"}""")
      }

      return try {
        val response = forwardMultipartToWhisper(whisperPort, requestBody)
        val elapsedMs = System.currentTimeMillis() - startMs
        auditLog(clientIP, username, endpoint, 200, "OK", elapsedMs)
        log(
            LogLevel.INFO,
            "Proxied $endpoint for ${anonymiseUser(username)} from ${anonymiseIP(clientIP)} (${elapsedMs}ms)")
        jsonResponse(response)
      } catch (X: Exception) {
        val elapsedMs = System.currentTimeMillis() - startMs
        log(LogLevel.ERROR, "Whisper proxy error: ${X.message}")
        auditLog(
            clientIP, username, endpoint, 502, "PROXY_ERROR: ${X.message?.take(200)}", elapsedMs)
        errorResponse(
            502,
            """{ "error":"Bad Gateway","message":"Failed to reach Whisper server: ${escapeJson(X.message ?: "unknown error")}"}""")
      }
    }

    if (endpoint == "/v1/ocr") {
      if (!TesseractAction.isReady) {
        log(LogLevel.WARNING, "Tesseract not ready — is OCR activated?")
        auditLog(
            clientIP,
            username,
            endpoint,
            503,
            "TESSERACT_UNAVAILABLE",
            System.currentTimeMillis() - startMs)
        return errorResponse(
            503, """{"error":"Service Unavailable","message":"Tesseract OCR is not running"}""")
      }

      return try {
        val response = handleOcrRequest(requestBody)
        val elapsedMs = System.currentTimeMillis() - startMs
        auditLog(clientIP, username, endpoint, 200, "OK", elapsedMs)
        log(
            LogLevel.INFO,
            "Proxied $endpoint for ${anonymiseUser(username)} from ${anonymiseIP(clientIP)} (${elapsedMs}ms)")
        jsonResponse(response)
      } catch (X: Exception) {
        val elapsedMs = System.currentTimeMillis() - startMs
        log(LogLevel.ERROR, "Tesseract proxy error: ${X.message}")
        auditLog(
            clientIP, username, endpoint, 502, "PROXY_ERROR: ${X.message?.take(200)}", elapsedMs)
        errorResponse(
            502,
            """{"error":"Bad Gateway","message":"Tesseract OCR failed: ${escapeJson(X.message ?: "unknown error")}"}""")
      }
    }
    // endregion Route to appropriate backend.
    // region Determine LLAMA-Server availability.
    val basePort = LLAMA.activeServerPort

    if (basePort == 0) {
      log(LogLevel.WARNING, "llama-server port not set — is the AI activated?")

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
    // endregion Determine LLAMA-Server availability.
    // region Determine Target-Server (thinking vs normal).
    val thinkingPort = LLAMA.activeThinkingServerPort
    val wantsThinking = isThinkingRequest(params, requestBody)
    val port = if (wantsThinking && thinkingPort > 0) thinkingPort else basePort

    if (wantsThinking) {
      log(
          LogLevel.INFO,
          "Thinking mode requested — routing to port $port" +
              if (thinkingPort > 0) " (dedicated)" else " (hybrid, no dedicated thinking server)")
    }
    // endregion Determine Target-Server (thinking vs normal).
    // region Forwarding.
    val readTimeoutMs = if (wantsThinking) 600_000 else 300_000

    return try {
      val serverUrl = "http://127.0.0.1:$port$endpoint"
      var response = forwardPost(serverUrl, requestBody, readTimeoutMs)
      // region Brave Search.
      if (BraveSearch.isAvailable && endpoint == "/v1/chat/completions") {
        response = handleSearchInProxyResponse(response, requestBody, serverUrl)
      }
      // endregion Brave Search.
      // region URL Fetch.
      if (BraveSearch.isAvailable && endpoint == "/v1/chat/completions") {
        response = handleFetchInProxyResponse(response, requestBody, serverUrl)
      }
      // endregion URL Fetch.
      // region Mail.
      if (MailBridge.isAvailable && endpoint == "/v1/chat/completions") {
        response = handleMailInProxyResponse(response, requestBody, serverUrl, clientIP)
      }
      // endregion Mail.
      val elapsedMs = System.currentTimeMillis() - startMs

      auditLog(clientIP, username, endpoint, 200, "OK", elapsedMs)
      log(
          LogLevel.INFO,
          "Proxied $endpoint for ${anonymiseUser(username)} from ${anonymiseIP(clientIP)} (${elapsedMs}ms)")

      jsonResponse(response)
    } catch (X: Exception) {
      val elapsedMs = System.currentTimeMillis() - startMs

      log(LogLevel.ERROR, "Proxy error for $endpoint: ${X.message}")

      auditLog(clientIP, username, endpoint, 502, "PROXY_ERROR: ${X.message?.take(200)}", elapsedMs)
      errorResponse(
          502,
          """{"error":"Bad Gateway","message":"Failed to reach AI server: ${escapeJson(X.message ?: "unknown error")}"}""")
    }
  }

  // endregion Forwarding
  // region Thinking-Mode-Detection
  /**
   * Determines whether the request wants thinking/reasoning mode. Checks (in order):
   * 1. `X-Thinking: true` header (used by CodBi chat frontend)
   * 2. `"enable_thinking":true` in the JSON request body (OpenAI-compatible)
   *
   * @param params Provided by the Formcycle environment.
   * @param requestBody Provided by the Formcycle environment.
   */
  private fun isThinkingRequest(params: IPluginServletActionParams, requestBody: String): Boolean {
    val xThinking =
        params.headerMap.entries.find { it.key.equals("X-Thinking", ignoreCase = true) }?.value

    if (xThinking.equals("true", ignoreCase = true)) return true

    return requestBody.contains(""""enable_thinking"\s*:\s*true""".toRegex())
  }

  // endregion Thinking-Mode-Detection
  // region IP-Resolution & whitelisting
  /**
   * Extracts the client IP from proxy headers or falls back
   * to * [IPluginServletActionParams.getRemoteAddr].
   *
   * @param params As provided by the Formcycle environment.
   * @return The resolved client IP as a String, or `unknown` if it cannot be determined.
   */
  private fun resolveClientIP(params: IPluginServletActionParams): String {
    val headers = params.headerMap
    val xff = headers.entries.find { it.key.equals("X-Forwarded-For", ignoreCase = true) }?.value

    if (!xff.isNullOrBlank()) {
      return xff.split(",").first().trim()
    }

    val xri = headers.entries.find { it.key.equals("X-Real-IP", ignoreCase = true) }?.value

    if (!xri.isNullOrBlank()) {
      return xri.trim()
    }

    val raw = params.remoteAddr?.trim() ?: return "unknown"
    val stripped =
        if (raw.startsWith("[") && raw.endsWith("]")) raw.substring(1, raw.length - 1) else raw

    return when (stripped) {
      "::1",
      "0:0:0:0:0:0:0:1" -> "127.0.0.1"
      else -> stripped
    }
  }

  /**
   * Checks whether [ip] is allowed by the configured whitelist. Supports exact matches and CIDR
   * subnet checks.
   *
   * @param ip The client IP to check.
   * @return `true` if the IP is allowed, `false` otherwise.
   */
  private fun isIPAllowed(ip: String): Boolean {
    if (exactIPs.isEmpty() && cidrEntries.isEmpty()) return false
    if (ip in exactIPs) return true

    val ipLong = ipToLong(ip) ?: return false

    return cidrEntries.any { (network, mask) -> (ipLong and mask) == network }
  }

  /**
   * Parses a CIDR string like `192.168.1.0/24` into a [CidrEntry].
   *
   * @param cidr The CIDR string to parse.
   * @return A [CidrEntry] if parsing is successful, `null` otherwise.
   */
  private fun parseCidr(cidr: String): CidrEntry? {
    return try {
      val parts = cidr.split("/")
      val ip = ipToLong(parts[0]) ?: return null
      val prefix = parts[1].toInt()

      if (prefix !in 0..32) return null

      val mask = if (prefix == 0) 0L else (-1L shl (32 - prefix)) and 0xFFFFFFFFL

      CidrEntry(ip and mask, mask)
    } catch (X: Exception) {
      log(LogLevel.WARNING, "Failed to parse CIDR: $cidr")

      null
    }
  }

  /**
   * Converts an IPv4 string to a numeric representation.
   *
   * @param ip The IPv4 address as a string.
   * @return The numeric representation of the IP, or `null` if invalid.
   */
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
    } catch (X: Exception) {
      null
    }
  }

  // endregion IP-Resolution & whitelisting
  // region Authentication
  /**
   * Validates a `Basic` Authorization header against configured credentials.
   *
   * @param authHeader The value of the `Authorization` header.
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
    } catch (X: Exception) {
      null
    }
  }

  // endregion Authentication
  // region Response Helpers
  /**
   * Extracts the JSON request body from either:
   * - Form/query parameter `body` (plain JSON text)
   * - Header `X-Request-Body` (Base64-encoded JSON)
   *
   * @param params As provided by the Formcycle environment.
   * @return The request body as a String, or `null` if not found or invalid.
   */
  private fun resolveRequestBody(params: IPluginServletActionParams): String? {
    val body = params.requestParameters["body"]?.firstOrNull()

    if (!body.isNullOrBlank()) return body

    val b64 =
        params.headerMap.entries.find { it.key.equals("X-Request-Body", ignoreCase = true) }?.value

    if (!b64.isNullOrBlank()) {
      return try {
        String(Base64.getDecoder().decode(b64.trim()), Charsets.UTF_8)
      } catch (X: Exception) {
        null
      }
    }

    return null
  }

  // endregion Response Helpers
  // region CALL:search handling
  /** Maximum search round-trips in proxy mode. */
  private val maxSearchRoundTrips = 2

  /**
   * Inspects the LLAMA-Server response for `CALL:search(query='...')` markers. If found, performs a
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
      val assistantContent = extractAssistantContent(currentResponse) ?: break
      val match = BraveSearch.CALL_SEARCH_PATTERN.find(assistantContent) ?: break
      val query = match.groupValues[1]

      log(LogLevel.INFO, "Proxy: Model requested web search (round $round): '$query'")

      val results = BraveSearch.search(query)

      if (results.isEmpty()) {
        log(LogLevel.WARNING, "Proxy: Web search returned no results for: '$query'")

        break
      }

      val searchContext = BraveSearch.formatResultsForModel(results)
      val augmentedBody =
          injectSearchResultsIntoRequest(originalRequestBody, assistantContent, searchContext)
              ?: break

      currentResponse = forwardPost(serverUrl, augmentedBody)

      log(LogLevel.INFO, "Proxy: Search-augmented response (round $round) received")
    }

    return currentResponse
  }

  /**
   * Extracts the assistant's content text from an OpenAI-compatible chat completion response.
   *
   * @param responseJson The raw JSON response from llama-server.
   * @return The assistant's content if found, or `null` on parse failure or if the expected
   *   structure is not present.
   */
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
    } catch (X: Exception) {
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
      val assistantMsg =
          com.google.gson.JsonObject().apply {
            addProperty("role", "assistant")
            addProperty("content", assistantContent)
          }

      messages.add(assistantMsg)

      val searchMsg =
          com.google.gson.JsonObject().apply {
            addProperty("role", "user")
            addProperty("content", searchResults)
          }

      messages.add(searchMsg)

      json.toString()
    } catch (X: Exception) {
      log(LogLevel.WARNING, "Failed to inject search results: ${X.message}")

      null
    }
  }

  // endregion CALL:search handling
  // region CALL:fetch handling
  /**
   * Inspects the LLAMA-Server response for `CALL:fetch(url='...')` markers. If found, fetches the
   * URL content, injects it into the conversation, and re-queries the model.
   *
   * @param responseJson The raw JSON response from llama-server.
   * @param originalRequestBody The original request body sent by the client.
   * @param serverUrl The llama-server URL.
   * @return The final response JSON (original or fetch-augmented).
   */
  private fun handleFetchInProxyResponse(
      responseJson: String,
      originalRequestBody: String,
      serverUrl: String
  ): String {
    val assistantContent = extractAssistantContent(responseJson) ?: return responseJson
    val match = UrlFetcher.CALL_FETCH_PATTERN.find(assistantContent) ?: return responseJson
    val url = match.groupValues[1]

    log(LogLevel.INFO, "Proxy: Model requested URL fetch: '$url'")

    val result = UrlFetcher.fetch(url)
    val fetchContext = UrlFetcher.formatResultForModel(result)
    val augmentedBody =
        injectSearchResultsIntoRequest(originalRequestBody, assistantContent, fetchContext)
            ?: return responseJson

    val finalResponse = forwardPost(serverUrl, augmentedBody)

    log(LogLevel.INFO, "Proxy: Fetch-augmented response received")

    return finalResponse
  }

  // endregion CALL:fetch handling
  // region CALL:mail handling
  /**
   * Inspects the LLAMA-Server response for `CALL:mail(to='...', subject='...', body='...')`
   * markers. If found, sends the email via [MailBridge], injects the result into the conversation,
   * and re-queries the model.
   */
  private fun handleMailInProxyResponse(
      responseJson: String,
      originalRequestBody: String,
      serverUrl: String,
      clientIP: String = "unknown"
  ): String {
    val assistantContent = extractAssistantContent(responseJson) ?: return responseJson
    val match = MailBridge.CALL_MAIL_PATTERN.find(assistantContent) ?: return responseJson
    val to = match.groupValues[1]
    val subject = match.groupValues[2]
    val body = match.groupValues[3]

    log(LogLevel.INFO, "Proxy: Model requested mail send to: '$to'")

    val result = MailBridge.sendMail(to, subject, body, "proxy", clientIP)
    val mailContext = MailBridge.formatResultForModel(result)
    val augmentedBody =
        injectSearchResultsIntoRequest(originalRequestBody, assistantContent, mailContext)
            ?: return responseJson

    val finalResponse = forwardPost(serverUrl, augmentedBody)

    log(LogLevel.INFO, "Proxy: Mail-augmented response received (success=${result.success})")

    return finalResponse
  }

  // endregion CALL:mail handling
  // region HTTP-Forwarding
  /**
   * Forwards a JSON POST request to the llama-server and returns the response body.
   *
   * @param url Full URL including endpoint (e.g. `http://127.0.0.1:8392/v1/chat/completions`)
   * @param jsonBody The JSON request body.
   * @return The response body as a String.
   * @throws Exception on connection or HTTP errors.
   */
  private fun forwardPost(url: String, jsonBody: String, readTimeoutMs: Int = 300_000): String {
    val connection = URI(url).toURL().openConnection() as HttpURLConnection

    connection.requestMethod = "POST"
    connection.doOutput = true
    connection.connectTimeout = 5_000
    connection.readTimeout = readTimeoutMs
    connection.setRequestProperty("Content-Type", "application/json")
    connection.setRequestProperty("Accept", "application/json")

    connection.outputStream.use { os -> os.write(jsonBody.toByteArray(Charsets.UTF_8)) }

    val responseCode = connection.responseCode
    val body =
        try {
          (if (responseCode in 200..299) connection.inputStream else connection.errorStream)
              .bufferedReader()
              .readText()
        } catch (X: Exception) {
          ""
        }
    connection.disconnect()

    if (responseCode !in 200..299) {
      throw RuntimeException("llama-server returned HTTP $responseCode: $body")
    }

    return body
  }

  // endregion HTTP-Forwarding
  // region Whisper-Forwarding
  /**
   * Forwards a transcription request to the local whisper-server as multipart form data.
   *
   * The [requestBody] is expected to be a JSON object with at least a `file` field containing
   * Base64-encoded audio. Optional fields: `language`, `response_format`, `temperature`.
   *
   * @param whisperPort The port where whisper-server is listening.
   * @param requestBody The JSON request body from the client.
   * @return The response body (JSON) from the whisper-server.
   * @throws RuntimeException on connection/IO or non-2xx HTTP errors.
   */
  private fun forwardMultipartToWhisper(whisperPort: Int, requestBody: String): String {
    val json =
        try {
          com.google.gson.JsonParser.parseString(requestBody).asJsonObject
        } catch (e: Exception) {
          throw RuntimeException("Invalid JSON request body: ${e.message}")
        }

    val fileB64 =
        json.get("file")?.asString ?: throw RuntimeException("Missing 'file' field in request body")
    val audioBytes =
        try {
          java.util.Base64.getDecoder().decode(fileB64)
        } catch (e: Exception) {
          throw RuntimeException("Invalid Base64 in 'file' field: ${e.message}")
        }
    val language = json.get("language")?.asString
    val responseFormat = json.get("response_format")?.asString ?: "json"
    val temperature = json.get("temperature")?.asString ?: "0.0"

    val boundary = "----CodBiProxy${System.currentTimeMillis()}"
    val lineEnd = "\r\n"
    val url = "http://127.0.0.1:$whisperPort/inference"

    val connection = URI(url).toURL().openConnection() as HttpURLConnection
    connection.requestMethod = "POST"
    connection.doOutput = true
    connection.connectTimeout = 5_000
    connection.readTimeout = 120_000
    connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")

    connection.outputStream.buffered().use { out ->
      out.write("--$boundary$lineEnd".toByteArray())
      out.write(
          "Content-Disposition: form-data; name=\"file\"; filename=\"audio.webm\"$lineEnd"
              .toByteArray())
      out.write("Content-Type: audio/webm$lineEnd$lineEnd".toByteArray())
      out.write(audioBytes)
      out.write(lineEnd.toByteArray())

      out.write("--$boundary$lineEnd".toByteArray())
      out.write(
          "Content-Disposition: form-data; name=\"response_format\"$lineEnd$lineEnd".toByteArray())
      out.write("$responseFormat$lineEnd".toByteArray())

      out.write("--$boundary$lineEnd".toByteArray())
      out.write(
          "Content-Disposition: form-data; name=\"temperature\"$lineEnd$lineEnd".toByteArray())
      out.write("$temperature$lineEnd".toByteArray())

      if (!language.isNullOrBlank()) {
        out.write("--$boundary$lineEnd".toByteArray())
        out.write("Content-Disposition: form-data; name=\"language\"$lineEnd$lineEnd".toByteArray())
        out.write("$language$lineEnd".toByteArray())
      }

      out.write("--$boundary--$lineEnd".toByteArray())
      out.flush()
    }

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
      throw RuntimeException("whisper-server returned HTTP $responseCode: $body")
    }
    return body
  }

  // endregion Whisper-Forwarding
  // region Tesseract-OCR
  /**
   * Handles an OCR request by delegating to [TesseractAction.performOcr] in-process.
   *
   * Tesseract runs via JNI (no external server), so unlike LLAMA/Whisper this calls into the same
   * JVM rather than forwarding HTTP.
   *
   * Expected JSON body:
   * ```json
   * {
   *   "image": "<base64-encoded image>",
   *   "mode": "print|extract|verify|extract fields",
   *   "pattern": "optional regex",
   *   "regex_flags": "ims",
   *   "rotate": 0,
   *   "preprocess": false,
   *   "field_patterns": {"field1": "regex1", "field2": "regex2"}
   * }
   * ```
   *
   * @param requestBody The JSON request body from the client.
   * @return The OCR result as a JSON string.
   * @throws RuntimeException on invalid JSON or missing required fields.
   */
  private fun handleOcrRequest(requestBody: String): String {
    val json =
        try {
          com.google.gson.JsonParser.parseString(requestBody).asJsonObject
        } catch (e: Exception) {
          throw RuntimeException("Invalid JSON request body: ${e.message}")
        }

    val imageB64 =
        json.get("image")?.asString
            ?: throw RuntimeException("Missing 'image' field in request body")
    val imageBytes =
        try {
          java.util.Base64.getDecoder().decode(imageB64)
        } catch (e: Exception) {
          throw RuntimeException("Invalid Base64 in 'image' field: ${e.message}")
        }

    val mode =
        json.get("mode")?.asString ?: throw RuntimeException("Missing 'mode' field in request body")

    val options = mutableMapOf<String, String>()
    json.get("pattern")?.asString?.let { options["pattern"] = it }
    json.get("regex_flags")?.asString?.let { options["regex_flags"] = it }
    json.get("rotate")?.asString?.let { options["rotate"] = it }
        ?: json.get("rotate")?.asInt?.let { options["rotate"] = it.toString() }
    json.get("preprocess")?.let { el ->
      options["preprocess"] =
          if (el.isJsonPrimitive && el.asJsonPrimitive.isBoolean) el.asBoolean.toString()
          else el.asString
    }
    json.get("field_patterns")?.let { options["field_patterns"] = it.toString() }

    return TesseractAction.performOcr(imageBytes, mode, options)
  }

  // endregion Tesseract-OCR
  // region Anonymisation
  /** SHA-256 hash of the username, truncated to 12 hex chars. */
  private fun anonymiseUser(username: String): String {
    val digest = MessageDigest.getInstance("SHA-256").digest(username.toByteArray(Charsets.UTF_8))

    return digest.joinToString("") { "%02x".format(it) }.take(12)
  }

  /**
   * Masks an IP address for privacy.
   * - IPv4: keeps the first two octets → `192.168.*.*`
   * - IPv6: keeps the first two groups → `2001:db8:*`
   *
   * @param ip The original IP address.
   * @return The anonymised IP address.
   */
  private fun anonymiseIP(ip: String): String {
    val v4parts = ip.split(".")

    if (v4parts.size == 4) return "${v4parts[0]}.${v4parts[1]}.*.*"

    val v6parts = ip.split(":")

    if (v6parts.size >= 3) return "${v6parts[0]}:${v6parts[1]}:*"

    return ip.take(45)
  }

  // endregion Anonymisation
  // region Audit-Logging
  /**
   * Inserts an anonymised audit log entry into `codbi_ai_proxy` using the JPA
   * [EntityManagerFactory][javax.persistence.EntityManagerFactory] provided by [AiProxyEntities].
   *
   * Each call creates its own [EntityManager][javax.persistence.EntityManager] for thread safety.
   * Failures are logged but do not affect the proxy response.
   *
   * @param clientIP The client's IP address (anonymised within this method).
   * @param username The authenticated username (anonymised within this method), or `null if
   *   authentication failed.
   * @param endpoint The API endpoint being accessed.
   * @param status The HTTP status code of the response.
   * @param detail Additional details about the request or response.
   * @param elapsedMs The time taken to process the request, in milliseconds.
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
      log(LogLevel.WARNING, "Audit log skipped — database not ready yet")

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
    } catch (X: Exception) {
      if (em.transaction.isActive) {
        try {
          em.transaction.rollback()
        } catch (X: Exception) {}
      }

      log(LogLevel.WARNING, "Audit log insert failed: ${X.message}")
    } finally {
      try {
        em.close()
      } catch (X: Exception) {}
    }
  }

  // region Responses
  /** Returns a JSON response with HTTP 200. */
  private fun jsonResponse(json: String): IPluginServletActionRetVal {
    val resp =
        ServletResponse(EResponseType.JSON).apply {
          value = json
          encoding = StandardCharsets.UTF_8.name()
        }
    return PluginServletActionRetVal(resp)
  }

  /**
   * Returns a JSON error response with a specific HTTP status code.
   *
   * @param statusCode The HTTP status code to return (e.g. 400, 401, 403, 500).
   * @param json The JSON body to return, typically containing `error` and ` message` fields.
   * @param extraHeaders Optional additional HTTP headers to include in the response.
   * @return An [IPluginServletActionRetVal] containing the error response.
   */
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

  // endregion Responses
  /**
   * Escapes a string for safe inclusion in a JSON value.
   *
   * @param s The string to escape.
   * @return The escaped string, with special characters replaced by their JSON escape sequences.
   */
  private fun escapeJson(s: String): String =
      s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r")
}
