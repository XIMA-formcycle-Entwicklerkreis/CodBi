package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

// region Imports
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons.ChatPromptFragments
import java.net.HttpURLConnection
import java.net.URI
import java.net.URLEncoder

// endregion Imports

/**
 * # UrlFetcher — Lightweight HTML-to-text extractor
 *
 * Fetches a URL and extracts readable text content from HTML pages. Used by the AI model via
 * `CALL:fetch(url='...')` markers to read web page content when search result snippets are
 * insufficient.
 *
 * ## Domains to whitelist
 * - Any domain the user or search results reference (outgoing HTTPS GET only)
 *
 * ## Security
 * - Only `http` and `https` schemes are allowed (no `file:`, `ftp:`, `data:`, etc.)
 * - Private/internal IP ranges are blocked to prevent SSRF
 * - Response size is capped at [MAX_BODY_BYTES] to prevent memory exhaustion
 * - Output text is truncated to [MAX_TEXT_CHARS] to fit model context windows
 */
object UrlFetcher : CodBi() {
  init {
    idLogMessages = "AI / UrlFetcher"
  }

  /** Maximum response body size in bytes (2 MB). */
  private const val MAX_BODY_BYTES = 2 * 1024 * 1024
  /** Maximum extracted text length in characters, to fit model context windows. */
  private const val MAX_TEXT_CHARS = 12_000
  /** Read timeout for fetching a URL (ms). */
  private const val READ_TIMEOUT_MS = 15_000
  /** Connect timeout for fetching a URL (ms). */
  private const val CONNECT_TIMEOUT_MS = 5_000
  /** User-Agent header sent with fetch requests. */
  private const val USER_AGENT =
      "Mozilla/5.0 (compatible; CodBi/1.0; +https://github.com/XIMA-formcycle-Entwicklerkreis)"

  /** Matches `CALL:fetch(url='...')` or `CALL:fetch(url="...")` in model output. */
  val CALL_FETCH_PATTERN: Regex = Regex("""CALL:fetch\(\s*url\s*=\s*['"](.+?)['"]\s*\)""")

  /** IP ranges that must be blocked to prevent SSRF attacks. */
  private val BLOCKED_HOST_PATTERNS =
      listOf(
          Regex("""^localhost$""", RegexOption.IGNORE_CASE),
          Regex("""^127\.\d+\.\d+\.\d+$"""),
          Regex("""^10\.\d+\.\d+\.\d+$"""),
          Regex("""^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$"""),
          Regex("""^192\.168\.\d+\.\d+$"""),
          Regex("""^0\.0\.0\.0$"""),
          Regex("""^\[::1]$"""),
          Regex("""^169\.254\.\d+\.\d+$"""))

  /**
   * Validates that a URL is safe to fetch (public HTTP/HTTPS, no internal IPs).
   *
   * @param url The URL string to validate.
   * @return `true` if the URL is safe to fetch.
   */
  private fun isSafeUrl(url: String): Boolean {
    val uri =
        try {
          URI(url)
        } catch (_: Exception) {
          return false
        }
    val scheme = uri.scheme?.lowercase() ?: return false
    if (scheme != "http" && scheme != "https") return false
    val host = uri.host ?: return false
    return BLOCKED_HOST_PATTERNS.none { it.containsMatchIn(host) }
  }

  /**
   * Fetches a URL and extracts readable text content.
   *
   * @param url The URL to fetch.
   * @return A [FetchResult] containing the extracted text and metadata, or an error message.
   */
  fun fetch(url: String): FetchResult {
    if (!isSafeUrl(url)) {
      log(LogLevel.WARNING, "Blocked unsafe URL: '$url'")
      return FetchResult(url = url, error = "URL is not allowed (only public HTTP/HTTPS URLs).")
    }

    return try {
      val connection = URI(url).toURL().openConnection() as HttpURLConnection
      connection.requestMethod = "GET"
      connection.connectTimeout = CONNECT_TIMEOUT_MS
      connection.readTimeout = READ_TIMEOUT_MS
      connection.setRequestProperty("User-Agent", USER_AGENT)
      connection.setRequestProperty(
          "Accept", "text/html,application/xhtml+xml,text/plain,*/*;q=0.8")
      connection.instanceFollowRedirects = true

      val responseCode = connection.responseCode
      if (responseCode !in 200..299) {
        connection.disconnect()
        return FetchResult(url = url, error = "HTTP $responseCode")
      }

      val contentType = connection.contentType ?: ""
      val rawBytes = connection.inputStream.use { it.readNBytes(MAX_BODY_BYTES) }
      connection.disconnect()

      val body = String(rawBytes, Charsets.UTF_8)
      val text =
          if (contentType.contains("html", ignoreCase = true)) {
            extractTextFromHtml(body)
          } else {
            body
          }

      val truncated =
          if (text.length > MAX_TEXT_CHARS) text.take(MAX_TEXT_CHARS) + "\n[…truncated]" else text

      log(LogLevel.INFO, "Fetched '$url': ${rawBytes.size} bytes → ${truncated.length} chars text")

      FetchResult(url = url, title = extractTitle(body, contentType), text = truncated)
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Failed to fetch '$url': ${X.message}")
      FetchResult(url = url, error = "Fetch failed: ${X.message}")
    }
  }

  /**
   * Formats a fetch result into a text block suitable for injecting into a conversation.
   *
   * @param result The fetch result to format.
   * @return A formatted string with the page content.
   */
  fun formatResultForModel(result: FetchResult): String {
    if (result.error != null) {
      return "PAGE FETCH FAILED for ${result.url}: ${result.error}\n" +
          "INSTRUCTIONS: Inform the user that you could not read the page and answer based on what you already know."
    }

    return buildString {
      append("PAGE CONTENT FROM: ${result.url}\n")
      if (!result.title.isNullOrBlank()) append("TITLE: ${result.title}\n")
      append("\n${result.text}\n\n")
      append(ChatPromptFragments.section("page_content") ?: "")
    }
  }

  /**
   * Extracts readable text from an HTML document by stripping tags, scripts, styles, and
   * normalizing whitespace.
   *
   * @param html The raw HTML string.
   * @return Extracted text content.
   */
  private fun extractTextFromHtml(html: String): String {
    var text = html
    // Remove script and style blocks entirely
    text = text.replace(Regex("""<script[^>]*>[\s\S]*?</script>""", RegexOption.IGNORE_CASE), " ")
    text = text.replace(Regex("""<style[^>]*>[\s\S]*?</style>""", RegexOption.IGNORE_CASE), " ")
    text = text.replace(Regex("""<nav[^>]*>[\s\S]*?</nav>""", RegexOption.IGNORE_CASE), " ")
    text = text.replace(Regex("""<footer[^>]*>[\s\S]*?</footer>""", RegexOption.IGNORE_CASE), " ")
    text = text.replace(Regex("""<header[^>]*>[\s\S]*?</header>""", RegexOption.IGNORE_CASE), " ")
    // Remove HTML comments
    text = text.replace(Regex("""<!--[\s\S]*?-->"""), " ")
    // Replace block-level tags with newlines for readability
    text =
        text.replace(
            Regex("""<(?:br|p|div|h[1-6]|li|tr|dt|dd)[^>]*>""", RegexOption.IGNORE_CASE), "\n")
    // Strip remaining HTML tags
    text = text.replace(Regex("""<[^>]+>"""), " ")
    // Decode common HTML entities
    text =
        text
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", "\"")
            .replace("&#39;", "'")
            .replace("&nbsp;", " ")
    // Decode numeric HTML entities
    text =
        text.replace(Regex("""&#(\d+);""")) { match ->
          val code = match.groupValues[1].toIntOrNull()
          if (code != null && code in 32..126) code.toChar().toString() else " "
        }
    // Normalize whitespace
    text = text.replace(Regex("""\t"""), " ")
    text = text.replace(Regex("""[ ]{2,}"""), " ")
    text = text.replace(Regex("""\n[ ]+"""), "\n")
    text = text.replace(Regex("""\n{3,}"""), "\n\n")
    return text.trim()
  }

  /**
   * Extracts the page title from an HTML document.
   *
   * @param body The raw HTML/text body.
   * @param contentType The Content-Type header value.
   * @return The page title, or `null` if not found.
   */
  private fun extractTitle(body: String, contentType: String): String? {
    if (!contentType.contains("html", ignoreCase = true)) return null
    val match = Regex("""<title[^>]*>(.*?)</title>""", RegexOption.IGNORE_CASE).find(body)
    return match?.groupValues?.get(1)?.replace(Regex("""<[^>]+>"""), "")?.trim()?.take(200)
  }

  /**
   * A fetched web page result.
   *
   * @property url The original URL that was fetched.
   * @property title The page title (if available).
   * @property text The extracted text content.
   * @property error Error message if the fetch failed, or `null` on success.
   */
  data class FetchResult(
      val url: String,
      val title: String? = null,
      val text: String? = null,
      val error: String? = null
  )
}

/**
 * # BraveSearch — Web search via Brave Search API
 *
 * Provides internet search capabilities for the AI model. When the model needs up-to-date
 * information it can emit a `CALL:search(query='...')` marker. The servlet layer detects this,
 * calls [search], and feeds the results back into the conversation so the model can produce a
 * grounded answer.
 *
 * ## Configuration
 * | Property                    | Format         | Example     |
 * |-----------------------------|----------------|-------------|
 * | `AI_BraveSearch_ApiKey`     | API key string | `BSA...xyz` |
 * | `AI_BraveSearch_MaxResults` | Integer (1–20) | `5`         |
 *
 * API docs:
 * [https://api.search.brave.com/app/documentation/web-search](https://api.search.brave.com/app/documentation/web-search)
 *
 * ## Domains to whitelist
 * - **api.search.brave.com** — Brave Search API endpoint
 */
object BraveSearch : CodBi() {
  /** Initializes this [CodBi]-Class by setting it's [idLogMessages] to `AI / BraveSearch`. */
  init {
    idLogMessages = "AI / BraveSearch"
  }

  /** Brave Search API endpoint. */
  private const val API_URL = "https://api.search.brave.com/res/v1/web/search"
  /** Default maximum number of results to return. */
  private const val DEFAULT_MAX_RESULTS = 5
  /** Maximum number of results to return (configurable via `AI_BraveSearch_MaxResults`). */
  @Volatile var maxResults: Int = DEFAULT_MAX_RESULTS
  /** Read timeout for the API call (ms). */
  private const val READ_TIMEOUT_MS = 15_000
  /** Connect timeout for the API call (ms). */
  private const val CONNECT_TIMEOUT_MS = 5_000
  /** The API key — set during plugin initialisation. */
  @Volatile var apiKey: String? = null
  /** Whether to filter sensitive data from queries (default: false, set by plugin property). */
  @Volatile var filterResults: Boolean = false
  /** Whether web search is available (API key configured). */
  val isAvailable: Boolean
    get() = !apiKey.isNullOrBlank()

  /**
   * Matches `CALL:search(query='...')`, `CALL:search(query="...")`, or positional
   * `CALL:search('...')` / `CALL:search("...")` in model output.
   */
  val CALL_SEARCH_PATTERN: Regex = Regex("""CALL:search\(\s*(?:query\s*=\s*)?['"](.+?)['"]\s*\)""")

  /**
   * Sanitizes a search query by removing personally identifiable information (PII) and identifiers
   * that should not be forwarded to an external search engine. Serves as a second layer of defense
   * in addition to possible instructions in the prompt to the model to avoid including sensitive
   * information in the query.
   *
   * Strips:
   * - Serial numbers (`S/N...`, `SN:...`, `s/n ...`)
   * - Case references / Aktenzeichen (`Az.`, `Az:`, `Aktenzeichen`)
   * - Generic alphanumeric IDs that look like codes (6+ chars with mixed letters/digits/dashes)
   * - "unless / except / not" clauses that typically reference specific people
   * - Email addresses
   * - Phone numbers (international and local formats)
   * - IBAN, SSN-style national ID numbers
   * - Date-of-birth patterns (`DOB:`, `born on`, `Geb.`)
   * - Street addresses (house number + street name, EN/DE)
   * - Trailing noise (whitespace, commas, dots)
   *
   * Words wrapped in `<< WORD >>` bypass all sieve rules and are kept verbatim.
   *
   * @param raw The raw query string to sanitize.
   * @param language Optional language code (e.g. "en", "de") to help with language-specific
   *   patterns (e.g. name detection). If null, only generic patterns are applied
   * @param filterOverride Per-request override for [filterResults]. When non-null, takes precedence
   *   over the global [filterResults] flag.
   * @return The santiazed [raw]-[String].
   */
  @Suppress("UNUSED_PARAMETER")
  fun sanitizeQuery(
      raw: String,
      language: String? = null,
      filterOverride: Boolean? = null
  ): String {
    if (!(filterOverride ?: filterResults)) {
      // Only restore protected tokens, do not strip anything else
      val protectedPattern = Regex("""<<\s*(.+?)\s*>>""")
      val protectedTokens = mutableListOf<String>()
      var q =
          protectedPattern.replace(raw) { match ->
            val placeholder = "\u0000KEEP${protectedTokens.size}\u0000"
            protectedTokens.add(match.groupValues[1])
            placeholder
          }
      for ((i, token) in protectedTokens.withIndex()) {
        q = q.replace("\u0000KEEP$i\u0000", token)
      }
      return q
    }
    // ...existing code (full sanitization)...
    val protectedPattern = Regex("""<<\s*(.+?)\s*>>""")
    val protectedTokens = mutableListOf<String>()
    var q =
        protectedPattern.replace(raw) { match ->
          val placeholder = "\u0000KEEP${protectedTokens.size}\u0000"
          protectedTokens.add(match.groupValues[1])
          placeholder
        }

    q =
        q.replace(
            Regex("""(?i)\b[Ss]/?[Nn][:\s]*[\w-]{3,}\b"""),
            "") // Remove serial-number patterns:  S/N87233-12, SN: 12345, s/n 87233-12
    q =
        q.replace(
            Regex("""(?i)\b(?:unless|except|excluding|not)\b.*$"""),
            "") // Remove "unless/except/not [Name]" clauses (negative conditions about people)
    // Remove long alphanumeric ID-like tokens (e.g. 87233-12, ABC-12345-XY) — 2+ groups of alnum
    // separated by dashes, or pure digit sequences 5+ chars that aren't postal codes (exactly 5
    // digits)
    q = q.replace(Regex("""\b[A-Za-z0-9]{2,}-[A-Za-z0-9-]{2,}\b"""), "")
    q = q.replace(Regex("""\b\d{6,}\b"""), "")
    // Email addresses
    q = q.replace(Regex("""[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}"""), "")
    // Phone numbers — international (+49 123 ...) and local (0123-456789, (0123) 456789)
    q = q.replace(Regex("""(?:\+\d{1,3}[\s.-]?)?\(?\d{2,5}\)?[\s.-]?\d{3,}[\s.-]?\d{2,}"""), "")
    // IBAN (2 letters + 2 digits + groups of 4 alnum)
    q =
        q.replace(
            Regex(
                """\b[A-Z]{2}\d{2}[\s]?[A-Z0-9]{4}(?:[\s]?[A-Z0-9]{4}){2,7}(?:[\s]?[A-Z0-9]{1,4})?\b"""),
            "")
    // SSN-style (US: 123-45-6789)
    q = q.replace(Regex("""\b\d{3}-\d{2}-\d{4}\b"""), "")
    // Date of birth patterns (DOB: 01/02/1990, Geb. 01.02.1990)
    q =
        q.replace(
            Regex(
                """(?i)\b(?:DOB|born on|Geb\.?|Geburtsdatum)[:\s]*\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}\b"""),
            "")
    // Street addresses — house number + street name (common EN/DE patterns)
    q =
        q.replace(
            Regex(
                """(?i)\b\d{1,5}\s+(?:[NSEW]\.\?\s+)?(?:[A-Za-z\u00C0-\u00FF]+\s){1,3}(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Ln\.?|Straße|Str\.?|Weg|Gasse|Platz|Allee)\b"""),
            "")
    // Person names — 3+ consecutive Title-Case words (Uppercase + 2 lowercase min).
    // Requires 3+ words to avoid false positives with German capitalized nouns
    // (e.g., "Wettervorhersage Ansbach" should NOT be stripped).
    // Protected tokens (<< >>) are already extracted before this runs, so intentional
    // names/brands wrapped in << >> won't be touched by this pattern.
    q = q.replace(Regex("""\b[A-ZÄÖÜ][a-zäöüß]{2,}(?:\s+[A-ZÄÖÜ][a-zäöüß]{2,}){2,}\b"""), "")
    q =
        q.replace(Regex("""\s{2,}"""), " ")
            .trim()
            .trimEnd(',', '.', ';', ':') // Collapse whitespace and trim trailing punctuation
    // region Restore << protected >> tokens.
    for ((i, token) in protectedTokens.withIndex()) {
      q = q.replace("\u0000KEEP$i\u0000", token)
    }
    // endregion Restore << protected >> tokens.
    return q
  }

  /**
   * Searches the web using the Brave Search API.
   *
   * @param query The search query string (will be sanitized before sending).
   * @param country Optional 2-letter country code to localize results (e.g. "US", "DE").
   * @param language Optional language code to help with query sanitization (e.g. "en", "de").
   * @param filterOverride Per-request override for [filterResults]. When non-null, takes precedence
   *   over the global [filterResults] flag during sanitization.
   * @return A list of [SearchResult] objects, or an empty list on failure.
   */
  fun search(
      query: String,
      country: String? = null,
      language: String? = null,
      filterOverride: Boolean? = null
  ): List<SearchResult> {
    val key = apiKey

    if (key.isNullOrBlank()) {
      log(LogLevel.WARNING, "Brave Search API key not configured — skipping search")

      return emptyList()
    }

    val cleanQuery = sanitizeQuery(query, language, filterOverride)

    if (cleanQuery.isBlank()) {
      log(LogLevel.WARNING, "Query empty after sanitization — skipping search (original: '$query')")

      return emptyList()
    }

    if (cleanQuery != query) {
      log(LogLevel.INFO, "Query sanitized: '$query' → '$cleanQuery'")
    }

    return try {
      val encodedQuery = URLEncoder.encode(cleanQuery, "UTF-8")
      val urlBuilder =
          StringBuilder("$API_URL?q=$encodedQuery&count=$maxResults&text_decorations=false")

      if (!country.isNullOrBlank()) {
        urlBuilder.append("&country=$country")
      }

      val url = urlBuilder.toString()

      log(LogLevel.INFO, "Searching: '$cleanQuery' → $url")

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
            } catch (X: Exception) {
              ""
            }

        log(
            LogLevel.WARNING,
            "Brave Search API returned HTTP $responseCode: ${errorBody.take(500)}")
        connection.disconnect()

        return emptyList()
      }

      val body = connection.inputStream.bufferedReader().readText()

      connection.disconnect()

      log(LogLevel.INFO, "Brave Search response (${body.length} chars): ${body.take(300)}")

      parseResults(body)
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Brave Search failed: ${X.message}")
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
      // region Common guidance
      append(ChatPromptFragments.section("search_results") ?: "")
      // endregion Common guidance
    }
  }

  /**
   * Parses the Brave Search API JSON response to extract web results. Uses minimal manual parsing
   * to avoid adding a JSON library dependency beyond what's already available.
   *
   * @param jsonBody The raw JSON response body from the Brave Search API.
   * @return A list of [SearchResult] objects extracted from the response.
   */
  private fun parseResults(jsonBody: String): List<SearchResult> {
    val results = mutableListOf<SearchResult>()

    try {
      val json = com.google.gson.JsonParser.parseString(jsonBody).asJsonObject
      val webResults = json.getAsJsonObject("web")?.getAsJsonArray("results") ?: return emptyList()

      for (i in 0 until minOf(webResults.size(), maxResults)) {
        val item = webResults[i].asJsonObject
        val title = item.get("title")?.asString ?: ""
        val url = item.get("url")?.asString ?: ""
        val description = item.get("description")?.asString ?: ""
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
    } catch (X: Exception) {
      log(LogLevel.WARNING, "Failed to parse Brave Search response: ${X.message}")
    }

    log(LogLevel.INFO, "Brave Search returned ${results.size} results")

    return results
  }

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
