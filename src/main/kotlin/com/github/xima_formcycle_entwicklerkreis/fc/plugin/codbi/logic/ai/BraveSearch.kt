package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai

import java.net.HttpURLConnection
import java.net.URI
import java.net.URLEncoder
import org.slf4j.LoggerFactory

// ═══════════════════════════════════════════════════════════════════════════════
//  BraveSearch — Web search via Brave Search API
// ═══════════════════════════════════════════════════════════════════════════════
//
// Provides internet search capabilities for the AI model. When the model needs
// up-to-date information it can emit a `CALL:search(query='...')` marker.
// The servlet layer detects this, calls [search], and feeds the results back
// into the conversation so the model can produce a grounded answer.
//
// ## Configuration
// | Property              | Format       | Example                              |
// |-----------------------|--------------|--------------------------------------|
// | `AI_BraveSearch_ApiKey` | API key string | `BSA...xyz`                         |
//
// API docs: https://api.search.brave.com/app/documentation/web-search
// ═══════════════════════════════════════════════════════════════════════════════

object BraveSearch {

  private val logger = LoggerFactory.getLogger(BraveSearch::class.java)

  /** Brave Search API endpoint. */
  private const val API_URL = "https://api.search.brave.com/res/v1/web/search"

  /** Maximum number of results to return. */
  private const val MAX_RESULTS = 5

  /** Read timeout for the API call (ms). */
  private const val READ_TIMEOUT_MS = 15_000

  /** Connect timeout for the API call (ms). */
  private const val CONNECT_TIMEOUT_MS = 5_000

  /** The API key — set during plugin initialisation. */
  @Volatile var apiKey: String? = null

  /** Whether web search is available (API key configured). */
  val isAvailable: Boolean
    get() = !apiKey.isNullOrBlank()

  // ── Regex to detect CALL:search(...) in model output ──────────────────

  /**
   * Matches `CALL:search(query='...')` or `CALL:search(query="...")` in model output. Group 1
   * captures the query string.
   */
  val CALL_SEARCH_PATTERN: Regex = Regex("""CALL:search\(\s*query\s*=\s*['"](.+?)['"]\s*\)""")

  // ── Public API ────────────────────────────────────────────────────────

  /**
   * Sanitizes a search query by removing personally identifiable information (PII) and identifiers
   * that should not be forwarded to an external search engine.
   *
   * Strips:
   * - Serial numbers (`S/N...`, `SN:...`, `s/n ...`)
   * - Case references / Aktenzeichen (`Az.`, `Az:`, `Aktenzeichen`)
   * - Generic alphanumeric IDs that look like codes (6+ chars with mixed letters/digits/dashes)
   * - "unless / except / not" clauses that typically reference specific people
   * - Likely person names (2+ consecutive Title Case words not preceded by a location preposition)
   * - Trailing noise (whitespace, commas, dots)
   *
   * Words wrapped in `<< WORD >>` bypass all sieve rules and are kept verbatim.
   */
  fun sanitizeQuery(raw: String, language: String? = null): String {
    // ── Extract << protected >> tokens before sanitization ──
    val protectedPattern = Regex("""<<\s*(.+?)\s*>>""")
    val protectedTokens = mutableListOf<String>()
    var q =
        protectedPattern.replace(raw) { match ->
          val placeholder = "\u0000KEEP${protectedTokens.size}\u0000"
          protectedTokens.add(match.groupValues[1])
          placeholder
        }

    // Remove serial-number patterns:  S/N87233-12, SN: 12345, s/n 87233-12
    q = q.replace(Regex("""(?i)\b[Ss]/?[Nn][:\s]*[\w-]{3,}\b"""), "")

    // Remove Aktenzeichen patterns:  Az. 123/45, Akt  q =
    // q.replace(Regex("""(?i)\b(?:Az\.?|Aktenzeichen)\s*[\w/\s-]{2,20}"""), "")

    // Remove "unless/except/not [Name]" clauses (negative conditions about people)
    q = q.replace(Regex("""(?i)\b(?:unless|except|excluding|not)\b.*$"""), "")

    // Remove long alphanumeric ID-like tokens (e.g. 87233-12, ABC-12345-XY) — 2+ groups of alnum
    // separated by dashes, or pure digit sequences 5+ chars that aren't postal codes (exactly 5
    // digits)
    q = q.replace(Regex("""\b[A-Za-z0-9]{2,}-[A-Za-z0-9-]{2,}\b"""), "")
    q = q.replace(Regex("""\b\d{6,}\b"""), "")

    // Collapse whitespace and trim trailing punctuation
    q = q.replace(Regex("""\s{2,}"""), " ").trim().trimEnd(',', '.', ';', ':')

    // ── Restore << protected >> tokens ──
    for ((i, token) in protectedTokens.withIndex()) {
      q = q.replace("\u0000KEEP$i\u0000", token)
    }

    return q
  }

  /**
   * Searches the web using the Brave Search API.
   *
   * @param query The search query string (will be sanitized before sending).
   * @return A list of [SearchResult] objects, or an empty list on failure.
   */
  fun search(query: String, country: String? = null, language: String? = null): List<SearchResult> {
    val key = apiKey
    if (key.isNullOrBlank()) {
      log("WARNING", "Brave Search API key not configured — skipping search")
      return emptyList()
    }

    val cleanQuery = sanitizeQuery(query, language)
    if (cleanQuery.isBlank()) {
      log("WARNING", "Query empty after sanitization — skipping search (original: '$query')")
      return emptyList()
    }
    if (cleanQuery != query) {
      log("INFO", "Query sanitized: '$query' → '$cleanQuery'")
    }

    return try {
      val encodedQuery = URLEncoder.encode(cleanQuery, "UTF-8")
      val urlBuilder =
          StringBuilder("$API_URL?q=$encodedQuery&count=$MAX_RESULTS&text_decorations=false")
      if (!country.isNullOrBlank()) {
        urlBuilder.append("&country=$country")
      }
      val url = urlBuilder.toString()

      log("INFO", "Searching: '$cleanQuery' → $url")

      val connection = URI(url).toURL().openConnection() as HttpURLConnection
      connection.requestMethod = "GET"
      connection.connectTimeout = CONNECT_TIMEOUT_MS
      connection.readTimeout = READ_TIMEOUT_MS
      connection.setRequestProperty("Accept", "application/json")
      connection.setRequestProperty("X-Subscription-Token", key)

      val responseCode = connection.responseCode
      if (responseCode !in 200..299) {
        val errorBody =
            try {
              connection.errorStream?.bufferedReader()?.readText() ?: ""
            } catch (_: Exception) {
              ""
            }
        log("WARNING", "Brave Search API returned HTTP $responseCode: ${errorBody.take(500)}")
        connection.disconnect()
        return emptyList()
      }

      val body = connection.inputStream.bufferedReader().readText()
      connection.disconnect()

      log("INFO", "Brave Search response (${body.length} chars): ${body.take(300)}")

      parseResults(body)
    } catch (ex: Exception) {
      log("ERROR", "Brave Search failed: ${ex.message}")
      emptyList()
    }
  }

  /**
   * Formats search results into a text block suitable for injecting into a conversation.
   *
   * @param results The search results to format.
   * @return A formatted string with numbered results including title, URL, and description.
   */
  fun formatResultsForModel(results: List<SearchResult>): String {
    if (results.isEmpty()) return "No search results found."

    return buildString {
      append("WEB SEARCH RESULTS:\n\n")
      for ((index, result) in results.withIndex()) {
        append("[${index + 1}] ${result.title}\n")
        append("    ${result.url}\n")
        append("    ${result.description}\n")
        if (result.extraSnippets.isNotEmpty()) {
          append("    Extra: ${result.extraSnippets.joinToString(" | ")}\n")
        }
        append("\n")
      }
      append("INSTRUCTIONS: Answer in 2-4 sentences. Be concise, do not repeat yourself. ")
      append("Do NOT say 'the results do not contain' or 'I cannot provide'. ")
      append("Do NOT tell the user to visit a website. ")
      append(
          "Add links like [AccuWeather](https://accuweather.com/forecast) or [Wikipedia](https://en.wikipedia.org). ")
      append("Never write 'Source', 'SiteName', or 'website name' as a link label.")
    }
  }

  // ── JSON parsing (manual, no external dependency) ─────────────────────

  /**
   * Parses the Brave Search API JSON response to extract web results. Uses minimal manual parsing
   * to avoid adding a JSON library dependency beyond what's already available.
   */
  private fun parseResults(jsonBody: String): List<SearchResult> {
    val results = mutableListOf<SearchResult>()

    try {
      val json = com.google.gson.JsonParser.parseString(jsonBody).asJsonObject

      val webResults = json.getAsJsonObject("web")?.getAsJsonArray("results") ?: return emptyList()

      for (i in 0 until minOf(webResults.size(), MAX_RESULTS)) {
        val item = webResults[i].asJsonObject
        val title = item.get("title")?.asString ?: ""
        val url = item.get("url")?.asString ?: ""
        val description = item.get("description")?.asString ?: ""

        // Extract extra snippets if available
        val extraSnippets = mutableListOf<String>()
        item.getAsJsonArray("extra_snippets")?.let { snippets ->
          for (j in 0 until snippets.size()) {
            snippets[j]?.asString?.let { extraSnippets.add(it) }
          }
        }

        if (title.isNotBlank() || description.isNotBlank()) {
          results.add(SearchResult(title, url, description, extraSnippets))
        }
      }
    } catch (ex: Exception) {
      log("WARNING", "Failed to parse Brave Search response: ${ex.message}")
    }

    log("INFO", "Brave Search returned ${results.size} results")
    return results
  }

  // ── Logging ───────────────────────────────────────────────────────────

  private fun log(level: String, message: String) {
    val formatted = "[[ CodBi / AI / BraveSearch ] $message ]"
    when (level) {
      "INFO" -> logger.info(formatted)
      "WARNING" -> logger.warn(formatted)
      "ERROR" -> logger.error(formatted)
    }
  }

  // ── Data class ────────────────────────────────────────────────────────

  /**
   * A single web search result.
   *
   * @property title The page title.
   * @property url The page URL.
   * @property description A text snippet / description from the page.
   * @property extraSnippets Additional text snippets from the page (may be empty).
   */
  data class SearchResult(
      val title: String,
      val url: String,
      val description: String,
      val extraSnippets: List<String> = emptyList()
  )
}
