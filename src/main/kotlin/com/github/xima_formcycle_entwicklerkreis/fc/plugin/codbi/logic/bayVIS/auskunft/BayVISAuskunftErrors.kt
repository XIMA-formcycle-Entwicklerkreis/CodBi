package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.bayVIS.auskunft

/**
 * Builds the `{"error": …}` payload the BayVIS proxy servlets put into their buffer when the
 * upstream call fails.
 *
 * Previously every servlet wrapped the raw error stream verbatim: `{"error": "Retrieval from BayVIS
 * API failed. Statuscode: 403, Response: <!DOCTYPE html> …"}` — so a portal block page was handed
 * to the form element as data (including its inline base64 logo), and the message did not say WHY
 * the call failed. This helper derives a human-readable REASON from the status code, recognises an
 * HTML page (i.e. the answer did not come from the REST API at all) and keeps only a short,
 * tag-stripped excerpt of the body.
 *
 * The JSON shape (`{"error": "…"}`) is unchanged, so existing form elements / EPs keep working.
 */
internal object BayVISAuskunftErrors {

  /** Maximum length of the body excerpt appended to the message. */
  private const val MAX_EXCERPT = 240

  /**
   * Describes a non-2xx response of a BayVIS endpoint.
   *
   * @param service Short service label used in the message (e.g. "Behoerdenverzeichnis").
   * @param endpoint The URL that was called (without credentials).
   * @param statusCode The HTTP status returned by the portal.
   * @param body The raw error body, if the portal sent one.
   * @return A JSON object string of the form `{"error":"…"}`.
   */
  fun describe(service: String, endpoint: String, statusCode: Int, body: String?): String {
    val html = looksLikeHtml(body)
    val reason = explain(statusCode, html)
    val excerpt = excerptOf(body)
    val message = buildString {
      append("BayVIS '")
      append(service)
      append("' failed with HTTP ")
      append(statusCode)
      append(": ")
      append(reason)
      append(" Endpoint: ")
      append(endpoint)
      if (excerpt.isNotEmpty()) {
        append(" | Response excerpt: ")
        append(excerpt)
      }
    }
    return """{"error":${quote(message)}}"""
  }

  /**
   * Describes a transport failure (DNS, TLS, timeout, connection refused …) instead of the generic
   * "Error connecting to BayVIS API".
   *
   * @param endpoint The URL that could not be reached.
   * @param cause The underlying I/O exception.
   * @return A JSON object string of the form `{"error":"…"}`.
   */
  fun connectionFailure(endpoint: String, cause: Exception): String {
    val detail = cause.message?.trim().orEmpty()
    val message = buildString {
      append("BayVIS endpoint '")
      append(endpoint)
      append("' could not be reached")
      append(
          when {
            detail.isEmpty() -> "."
            detail.contains("timed out", ignoreCase = true) ->
                ": the connection timed out — the server's IP may not be released for the BayernPortal, or a firewall blocks the call."
            else -> ": $detail"
          })
    }
    return """{"error":${quote(message)}}"""
  }

  /**
   * Warning text for the FORMCYCLE plugin manager when the initial fetch failed with [statusCode].
   * Plain text (no JSON, no body excerpt) so it reads well as a plugin message.
   */
  fun startupWarning(service: String, endpoint: String, statusCode: Int): String =
      "BayVIS '$service' could not be loaded while the CodBi plugin started (HTTP $statusCode): " +
          explain(statusCode, html = false) +
          " Endpoint: $endpoint"

  /**
   * Warning text for the FORMCYCLE plugin manager when the initial fetch threw (invalid URL,
   * timeout, TLS failure …). Plain text, so it reads well as a plugin message.
   */
  fun startupWarning(service: String, endpoint: String, cause: Throwable): String {
    val detail = cause.message?.trim()?.takeIf { it.isNotEmpty() } ?: cause.javaClass.simpleName
    return "BayVIS '$service' could not be loaded while the CodBi plugin started: $detail " +
        "Endpoint: $endpoint"
  }

  /** Maps the HTTP status (and whether an HTML page was returned) to a concrete reason. */
  fun explain(statusCode: Int, html: Boolean): String =
      when (statusCode) {
        401 ->
            "the credentials were rejected (HTTP 401) — check the plugin properties " +
                "BayVIS_Benutzername and BayVIS_Passwort."
        403 ->
            "access denied by the BayernPortal (HTTP 403) — the request was refused BEFORE it " +
                "reached the BayVIS REST API. In practice either the calling server's IP is not " +
                "released for BayVIS, the credentials are not valid for this endpoint " +
                "(expired/revoked), or the request contingent per hour was exceeded — the portal " +
                "also answers 403 (and not 429) when its hourly quota for this client is used up, " +
                "and the same call works again once the quota has reset at the next hour. Verify " +
                "the server IP with the BayVIS operator, the credentials in BayVIS_Benutzername / " +
                "BayVIS_Passwort, and the number of requests per hour (increase BayVIS_UpdateCycle " +
                "when the retrieval interval is too short)."
        404 ->
            "the endpoint does not exist (HTTP 404) — check the configured URL " +
                "(BayVIS_EP_* property) including the '/rest/…/v3' path."
        405 -> "the HTTP method is not allowed for this endpoint (HTTP 405) — check the URL."
        406 ->
            "the portal does not accept the requested response format (HTTP 406) — check the URL."
        415 -> "the portal rejected the request format (HTTP 415)."
        429 ->
            "the portal's rate limit was hit (HTTP 429) — increase BayVIS_UpdateCycle so the data " +
                "is fetched less often."
        in 500..599 ->
            "the BayVIS server reported an internal error (HTTP $statusCode) — retry later; if it " +
                "persists the service is down or this server IP is blocked."
        else ->
            if (html) {
              "the portal answered with an HTML page instead of API data (HTTP $statusCode) — " +
                  "the request was handled by the portal/WAF, not by the BayVIS REST API."
            } else {
              "unexpected response (HTTP $statusCode)."
            }
      }

  /** True when the body looks like an HTML document rather than XML/JSON API data. */
  private fun looksLikeHtml(body: String?): Boolean {
    if (body.isNullOrBlank()) return false
    val head = body.take(512).lowercase()
    return head.contains("<!doctype html") || head.contains("<html")
  }

  /** Strips markup and collapses whitespace, so only a short readable excerpt remains. */
  private fun excerptOf(body: String?): String {
    if (body.isNullOrBlank()) return ""
    val text =
        body
            .replace(Regex("(?is)<script.*?</script>"), " ")
            .replace(Regex("(?is)<style.*?</style>"), " ")
            // The portal page embeds its logo as a base64 data URI — drop it entirely.
            .replace(Regex("(?is)<img[^>]*>"), " ")
            .replace(Regex("(?s)<[^>]*>"), " ")
            // Entity names are built by concatenation: a literal "&…;" sequence gets mangled by
            // editors/tools that treat the source as HTML.
            .replace("&" + "nbsp;", " ")
            .replace("&" + "amp;", "&")
            .replace("&" + "quot;", "\"")
            .replace("&" + "lt;", "<")
            .replace("&" + "gt;", ">")
            .replace(Regex("\\s+"), " ")
            .trim()
    return if (text.length <= MAX_EXCERPT) text else text.take(MAX_EXCERPT) + "…"
  }

  /**
   * Minimal JSON string escaping (the messages are built by hand, like the rest of these servlets).
   */
  private fun quote(value: String): String = buildString {
    append('"')
    for (c in value) {
      when (c) {
        '"' -> append("\\\"")
        '\\' -> append("\\\\")
        '\n' -> append("\\n")
        '\r' -> append("\\r")
        '\t' -> append("\\t")
        else -> if (c < ' ') append(String.format("\\u%04x", c.code)) else append(c)
      }
    }
    append('"')
  }
}
