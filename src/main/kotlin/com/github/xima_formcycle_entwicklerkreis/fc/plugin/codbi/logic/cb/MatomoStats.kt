package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import java.net.HttpURLConnection
import java.net.URI
import java.net.URLEncoder
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale
import org.slf4j.LoggerFactory

/**
 * Backend helper that queries the Matomo server configured via the plugin properties
 * `AI_FormAssistant_Matomo_URL` and `AI_FormAssistant_Matomo_APIKey` and builds a compact
 * statistics summary of the current form for the AI assistant.
 *
 * The Matomo instance is expected to run the **FormAnalytics** plugin — the same one the "XIMA
 * Formular-Matomo Tracking" dashboard uses. The methods queried here follow the official Matomo
 * Reporting API reference (developer.matomo.org/guides/reporting-api):
 * - `Actions.getPageTitles` — per-page (per-form) metrics (nb_hits, nb_visits, bounce/exit rates,
 *   average time on page, ...) used to rank the forms and to match the current form;
 * - `SitesManager.getAllSites` — the sites the token can access;
 * - `FormAnalytics.getForms` / `getMostUsedFields` / `getFieldTimings` / `getFieldCorrections` /
 *   `getDropOffFields` / `getEntryFields` / `getUneededFields` — per-form field analytics
 *   (corrections, interactions, per-field timings/hesitation, where users abandon, which fields are
 *   skipped);
 * - `FormAnalytics.getSummary` / `getCurrentMostPopularForms` / `getCounters` — per-form overview
 *   (conversion/abandonment), the currently most popular forms and live counters.
 *
 * Every call is best-effort: when the plugin is not installed, a method is missing, or a query
 * fails, that section is simply omitted from the summary — the remaining statistics still reach the
 * AI. When either plugin property is missing the assistant tells the user that the administrator
 * has to configure them; the Matomo calls are never attempted then.
 */
object MatomoStats {
  private val logger = LoggerFactory.getLogger(MatomoStats::class.java)
  private val gson: Gson = GsonBuilder().create()

  /**
   * Per-thread collector of the sanitized Matomo API requests made during the current statistics
   * query — lets the assistant show "what was sent to Matomo" alongside the received response. The
   * auth token is never recorded.
   */
  private val activeRequests = ThreadLocal<MutableList<JsonObject>>()

  /** True when both the Matomo URL and the API key are configured. */
  @JvmStatic
  fun isConfigured(): Boolean = !AI.matomoUrl.isNullOrBlank() && !AI.matomoApiKey.isNullOrBlank()

  /**
   * Queries the Matomo server for the statistics of the form whose title matches [formTitle],
   * restricted to the requested [period] ("day" / "week" / "range" / "month", default "month") and
   * [date]/[dateTo] ("yesterday", "today", ISO dates — for "range", two ISO dates mark start and
   * end), and returns a compact JSON summary for the AI. [focus] ("current_form" / "all_forms")
   * controls whether the per-field analytics of the current form are included for month queries.
   * Returns `null` when the plugin properties are not configured, when the form cannot be
   * identified, or when the query fails.
   */
  @JvmStatic
  fun queryFormStats(
      formTitle: String?,
      period: String? = null,
      date: String? = null,
      dateTo: String? = null,
      focus: String? = null
  ): String? {
    val baseUrl = AI.matomoUrl?.trim()?.trimEnd('/')
    val token = AI.matomoApiKey?.trim()
    if (baseUrl.isNullOrBlank() || token.isNullOrBlank()) return null
    if (formTitle.isNullOrBlank()) return null
    val resolvedPeriod =
        when (period?.trim()?.lowercase()) {
          "day" -> "day"
          "week" -> "week"
          "range" -> "range"
          else -> "month"
        }
    val resolvedDate =
        date?.trim()?.takeIf { it.isNotBlank() }
            ?: if (resolvedPeriod == "day") "yesterday" else "today"
    val resolvedDateTo = dateTo?.trim()?.takeIf { it.isNotBlank() }
    val resolvedFocus = focus?.trim()?.lowercase()
    return try {
      activeRequests.set(mutableListOf())
      val root = JsonObject()
      root.addProperty("formTitle", formTitle)
      root.addProperty("period", resolvedPeriod)
      root.addProperty(
          "note",
          "Statistics come from the Matomo server configured via the plugin properties AI_FormAssistant_Matomo_URL and AI_FormAssistant_Matomo_APIKey.")
      val normalizedTitle = normalize(formTitle)
      when (resolvedPeriod) {
        "day" -> addDayStats(root, baseUrl, token, normalizedTitle, resolvedDate)
        "week" -> addWeekStats(root, baseUrl, token, normalizedTitle)
        "range" ->
            addRangeStats(root, baseUrl, token, normalizedTitle, resolvedDate, resolvedDateTo)
        else -> addMonthStats(root, baseUrl, token, normalizedTitle, resolvedFocus)
      }
      // The exact (sanitized) requests sent to Matomo, for the assistant's raw-data view.
      val recorded = activeRequests.get()
      if (!recorded.isNullOrEmpty()) {
        root.add("matomoRequests", JsonArray().also { arr -> for (r in recorded) arr.add(r) })
      }
      gson.toJson(root)
    } catch (e: Exception) {
      logger.warn("[MatomoStats] queryFormStats failed: {}", e.message)
      null
    } finally {
      activeRequests.remove()
    }
  }

  /**
   * Month statistics (default): ranks ALL tracked forms across every site by their monthly views
   * (the FormAnalytics plugin is where the actual per-form view counts live —
   * `Actions.getPageTitles` is often empty for these forms), exposes the top 10, aggregates the
   * totals (`allFormsTotal`), matches the current form, and — unless [focus] is "all_forms" — adds
   * the FormAnalytics per-field/site-level data of the current form. This is the "last 30 days" /
   * "most called forms" view.
   */
  private fun addMonthStats(
      root: JsonObject,
      baseUrl: String,
      token: String,
      normalizedTitle: String,
      focus: String?
  ) {
    root.addProperty("periodLabel", "last 30 days")
    // Standard page titles (best effort): their page-level metrics (nb_hits, bounce/exit rate, ...)
    // are merged into the ranking when the forms are also tracked as standard page views.
    val pageEntries =
        flattenEntries(apiCall(baseUrl, token, "Actions.getPageTitles", "all", "month", "today"))
    val pageByTitle = HashMap<String, JsonObject>()
    for (p in pageEntries) {
      val label = p.get("label")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
      pageByTitle[normalize(label)] = p
    }
    // All tracked forms across every site (FormAnalytics.getSummary) — the authoritative list.
    val allForms = collectAllForms(baseUrl, token)

    val ranked = JsonArray()
    var match: JsonObject? = null
    var totalViews = 0.0
    var totalStarters = 0.0
    var totalSubmitters = 0.0

    if (allForms.isNotEmpty()) {
      for ((i, obj) in
          allForms.sortedByDescending { pageValue(it, "nb_form_viewers") }.withIndex()) {
        val label = obj.get("label")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
        val keep = JsonObject()
        keep.addProperty("rank", i + 1)
        keep.addProperty("title", label)
        keep.addProperty("siteId", obj.get("siteId")?.takeIf { it.isJsonPrimitive }?.asString)
        keep.addProperty(
            "idsiteform", obj.get("idsiteform")?.takeIf { it.isJsonPrimitive }?.asString)
        keep.addProperty("nb_views", pageValue(obj, "nb_form_viewers"))
        keep.addProperty("nb_starters", pageValue(obj, "nb_form_starters"))
        keep.addProperty("nb_submitters", pageValue(obj, "nb_form_submitters"))
        keep.addProperty("nb_conversions", pageValue(obj, "nb_form_conversions"))
        // Enrich with standard page metrics when the form is also tracked as a page title.
        pageByTitle[normalize(label)]?.let { page ->
          keep.addProperty("nb_hits", pageValue(page, "nb_hits"))
          keep.addProperty("nb_visits", pageValue(page, "nb_visits"))
          keep.addProperty("bounce_rate", pageValue(page, "bounce_rate"))
          keep.addProperty("exit_rate", pageValue(page, "exit_rate"))
        }
        ranked.add(keep)
        totalViews += pageValue(obj, "nb_form_viewers")
        totalStarters += pageValue(obj, "nb_form_starters")
        totalSubmitters += pageValue(obj, "nb_form_submitters")
        if (match == null && matches(label, normalizedTitle)) {
          keep.addProperty("isCurrentForm", true)
          match = keep
        }
      }
    } else if (pageEntries.isNotEmpty()) {
      // Fallback: only standard page titles are available.
      for ((i, obj) in pageEntries.sortedByDescending { pageValue(it, "nb_hits") }.withIndex()) {
        val label = obj.get("label")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
        val keep = JsonObject()
        keep.addProperty("rank", i + 1)
        keep.addProperty("title", label)
        keep.addProperty("nb_hits", pageValue(obj, "nb_hits"))
        keep.addProperty("nb_visits", pageValue(obj, "nb_visits"))
        keep.addProperty("bounce_rate", pageValue(obj, "bounce_rate"))
        keep.addProperty("exit_rate", pageValue(obj, "exit_rate"))
        ranked.add(keep)
        totalViews += pageValue(obj, "nb_hits")
        if (match == null && matches(label, normalizedTitle)) {
          keep.addProperty("isCurrentForm", true)
          match = keep
        }
      }
    }

    root.add("allFormsRanked", ranked)
    root.add(
        "top10MostCalledForms",
        JsonArray().also { arr ->
          for (el in ranked) {
            if (arr.size() >= 10) break
            arr.add(el)
          }
        })
    root.add(
        "allFormsTotal",
        JsonObject().also { t ->
          t.addProperty("forms", ranked.size())
          t.addProperty("nb_views", totalViews)
          t.addProperty("nb_starters", totalStarters)
          t.addProperty("nb_submitters", totalSubmitters)
        })

    if (match == null) {
      root.addProperty("thisFormFound", false)
      root.addProperty(
          "hint",
          "The current form could not be matched to any tracked form/page title in Matomo (no " +
              "tracking data, or the tracked page title differs from the form title).")
    } else {
      root.addProperty("thisFormFound", true)
      root.add("thisForm", match)
    }

    // Per-field analytics of the CURRENT form — only when the question targets the current form
    // (focus "all_forms" asks about all forms, so per-field data is irrelevant noise).
    if (focus != "all_forms") {
      val pluginData = queryFormAnalytics(baseUrl, token, normalizedTitle)
      if (pluginData != null) {
        for ((key, value) in pluginData.entrySet()) root.add(key, value)
      }
    }
  }

  /**
   * Collects every tracked form across all accessible sites together with its monthly view/start/
   * submit counts (via `FormAnalytics.getSummary`, flat=1). Each row is tagged with its `siteId`.
   * Best-effort: sites without the FormAnalytics plugin or failed calls are skipped.
   */
  private fun collectAllForms(baseUrl: String, token: String): List<JsonObject> {
    val out = mutableListOf<JsonObject>()
    val sites =
        apiCall(baseUrl, token, "SitesManager.getAllSites", null) as? JsonArray ?: return out
    for (site in sites) {
      if (!site.isJsonObject) continue
      val siteId =
          site.asJsonObject.get("idsite")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
      val rows =
          flattenEntries(
              apiCall(
                  baseUrl,
                  token,
                  "FormAnalytics.getSummary",
                  siteId,
                  "month",
                  "today",
                  null,
                  mapOf("flat" to "1")))
      for (r in rows) {
        val label = r.get("label")?.takeIf { it.isJsonPrimitive }?.asString
        if (label.isNullOrBlank()) continue
        r.addProperty("siteId", siteId)
        out.add(r)
      }
    }
    return out
  }

  /**
   * Week statistics: the per-day page views of the current form over the last 7 days (`dailyTrend`,
   * days without tracked visits filled with 0), a derived `yesterday` entry, and a `weekSummary`
   * aggregate.
   */
  private fun addWeekStats(
      root: JsonObject,
      baseUrl: String,
      token: String,
      normalizedTitle: String
  ) {
    val todayDate = LocalDate.now()
    buildDailyTrend(
        root,
        baseUrl,
        token,
        normalizedTitle,
        todayDate.minusDays(6),
        todayDate,
        "last 7 days",
        includeYesterday = true)
  }

  /**
   * Custom date-range statistics (`period=range`): the per-day page views of the current form over
   * an arbitrary [fromIso]..[toIso] range (e.g. "Montag bis heute"). When the range is missing or
   * invalid, falls back to the last 7 days.
   */
  private fun addRangeStats(
      root: JsonObject,
      baseUrl: String,
      token: String,
      normalizedTitle: String,
      fromIso: String?,
      toIso: String?
  ) {
    val from = fromIso?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
    val to = toIso?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
    val today = LocalDate.now()
    val (effectiveFrom, effectiveTo) =
        when {
          from != null && to != null && !to.isBefore(from) -> from to to
          else -> (today.minusDays(6)) to today
        }
    buildDailyTrend(
        root,
        baseUrl,
        token,
        normalizedTitle,
        effectiveFrom,
        effectiveTo,
        "$effectiveFrom to $effectiveTo",
        includeYesterday =
            !effectiveFrom.isAfter(today.minusDays(1)) && !effectiveTo.isBefore(today.minusDays(1)))
  }

  /**
   * Builds a per-day `dailyTrend` for [from]..[to] (zero-filled, each entry with correct `weekday`
   * / `weekdayDe` labels), a `weekSummary` aggregate, and — when [includeYesterday] — a `yesterday`
   * entry. Queries Matomo with `period=day&date=<from>,<to>`.
   */
  private fun buildDailyTrend(
      root: JsonObject,
      baseUrl: String,
      token: String,
      normalizedTitle: String,
      from: LocalDate,
      to: LocalDate,
      periodLabel: String,
      includeYesterday: Boolean
  ) {
    root.addProperty("periodLabel", periodLabel)
    val dailyRaw = apiCall(baseUrl, token, "Actions.getPageTitles", "all", "day", "$from,$to")
    if (dailyRaw == null) {
      root.addProperty("thisFormFound", false)
      root.addProperty(
          "hint",
          "The daily statistics for the requested period could not be retrieved from Matomo.")
      return
    }
    val dailyByDate = flattenDaily(dailyRaw)
    val trend = JsonArray()
    var totalHits = 0.0
    var totalVisits = 0.0
    var date = from
    while (!date.isAfter(to)) {
      val iso = date.toString()
      val row =
          dailyByDate[iso]?.firstOrNull { obj ->
            matches(
                obj.get("label")?.takeIf { it.isJsonPrimitive }?.asString ?: "", normalizedTitle)
          }
      val hits = row?.let { pageValue(it, "nb_hits") } ?: 0.0
      val visits = row?.let { pageValue(it, "nb_visits") } ?: 0.0
      val o = JsonObject()
      o.addProperty("date", iso)
      o.addProperty("weekday", date.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
      o.addProperty("weekdayDe", date.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.GERMAN))
      o.addProperty("nb_hits", hits)
      o.addProperty("nb_visits", visits)
      trend.add(o)
      totalHits += hits
      totalVisits += visits
      date = date.plusDays(1)
    }
    root.add("dailyTrend", trend)
    if (includeYesterday) {
      val yesterdayIso = LocalDate.now().minusDays(1).toString()
      val yesterdayRow =
          trend.firstOrNull {
            it.isJsonObject && it.asJsonObject.get("date")?.asString == yesterdayIso
          }
      if (yesterdayRow != null) root.add("yesterday", yesterdayRow.asJsonObject)
    }
    val summary = JsonObject()
    summary.addProperty("days", trend.size())
    summary.addProperty("nb_hits", totalHits)
    summary.addProperty("nb_visits", totalVisits)
    root.add("weekSummary", summary)
    val anyHit = trend.any { it.isJsonObject && pageValue(it.asJsonObject, "nb_hits") > 0 }
    root.addProperty("thisFormFound", anyHit)
    if (!anyHit) {
      root.addProperty(
          "hint",
          "The current form had no tracked visits in the requested period, or its tracked page " +
              "title differs from the form title.")
    }
  }

  /**
   * Single-day statistics: the current form's metrics on [date] ("yesterday", "today", or an ISO
   * date) plus a compact ranking of the most-called forms on that day (`topFormsDay`).
   */
  private fun addDayStats(
      root: JsonObject,
      baseUrl: String,
      token: String,
      normalizedTitle: String,
      date: String
  ) {
    val dayDate =
        if (date == "today" || date == "yesterday" || DATE_KEY.matches(date)) date else "yesterday"
    root.addProperty("periodLabel", dayDate)
    val pageTitles = apiCall(baseUrl, token, "Actions.getPageTitles", "all", "day", dayDate)
    val entries = flattenEntries(pageTitles)
    val ranked = JsonArray()
    var match: JsonObject? = null
    for ((i, obj) in entries.sortedByDescending { pageValue(it, "nb_hits") }.withIndex()) {
      val label = obj.get("label")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
      val keep = JsonObject()
      keep.addProperty("rank", i + 1)
      keep.addProperty("title", label)
      keep.addProperty("nb_hits", pageValue(obj, "nb_hits"))
      keep.addProperty("nb_visits", pageValue(obj, "nb_visits"))
      keep.addProperty("bounce_rate", pageValue(obj, "bounce_rate"))
      keep.addProperty("exit_rate", pageValue(obj, "exit_rate"))
      keep.addProperty("avg_time_on_page_seconds", pageValue(obj, "avg_time_on_page"))
      ranked.add(keep)
      if (match == null && matches(label, normalizedTitle)) {
        keep.addProperty("isCurrentForm", true)
        match = keep
      }
    }
    root.add(
        "topFormsDay",
        JsonArray().also { arr ->
          for (el in ranked) {
            if (arr.size() >= 10) break
            arr.add(el)
          }
        })
    if (match == null) {
      root.addProperty("thisFormFound", false)
      root.addProperty(
          "hint",
          "The current form could not be matched to any tracked form/page title in Matomo for " +
              "$dayDate (no tracking data that day, or the tracked page title differs from the form title).")
    } else {
      root.addProperty("thisFormFound", true)
      match.addProperty("date", dayDate)
      val resolvedIso =
          when (dayDate) {
            "today" -> LocalDate.now().toString()
            "yesterday" -> LocalDate.now().minusDays(1).toString()
            else -> dayDate
          }
      val actualDate = runCatching { LocalDate.parse(resolvedIso) }.getOrNull()
      if (actualDate != null) {
        match.addProperty(
            "weekday", actualDate.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
        match.addProperty(
            "weekdayDe", actualDate.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.GERMAN))
      }
      root.add("day", match)
    }
  }

  /**
   * Locates the current form inside the FormAnalytics plugin (by normalized name) and returns an
   * object with the per-field analytics and the site-level overview. All methods are best-effort —
   * a missing/unavailable method just omits its key. Returns `null` when no site/form could be
   * matched or every call failed.
   */
  private fun queryFormAnalytics(
      baseUrl: String,
      token: String,
      normalizedTitle: String
  ): JsonObject? {
    return try {
      val sites =
          apiCall(baseUrl, token, "SitesManager.getAllSites", null) as? JsonArray ?: return null
      for (site in sites) {
        if (!site.isJsonObject) continue
        val siteObj = site.asJsonObject
        val siteId = siteObj.get("idsite")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
        val forms =
            apiCall(baseUrl, token, "FormAnalytics.getForms", siteId) as? JsonArray ?: continue
        var idForm: String? = null
        for (f in forms) {
          if (!f.isJsonObject) continue
          val name = f.asJsonObject.get("name")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
          if (matches(name, normalizedTitle)) {
            idForm =
                f.asJsonObject.get("idsiteform")?.takeIf { it.isJsonPrimitive }?.asString
                    ?: f.asJsonObject.get("idform")?.takeIf { it.isJsonPrimitive }?.asString
            break
          }
        }
        if (idForm == null) continue

        val out = JsonObject()

        // --- Per-field analytics of the current form (all best effort) ---
        val fieldAnalytics = JsonObject()
        addCompactReport(
            fieldAnalytics,
            "mostUsedFields",
            apiCall(
                baseUrl,
                token,
                "FormAnalytics.getMostUsedFields",
                siteId,
                "month",
                "today",
                idForm))
        addCompactReport(
            fieldAnalytics,
            "fieldCorrections",
            apiCall(
                baseUrl,
                token,
                "FormAnalytics.getFieldCorrections",
                siteId,
                "month",
                "today",
                idForm))
        addCompactReport(
            fieldAnalytics,
            "fieldTimings",
            apiCall(
                baseUrl, token, "FormAnalytics.getFieldTimings", siteId, "month", "today", idForm))
        addCompactReport(
            fieldAnalytics,
            "dropOffFields",
            apiCall(
                baseUrl, token, "FormAnalytics.getDropOffFields", siteId, "month", "today", idForm))
        addCompactReport(
            fieldAnalytics,
            "entryFields",
            apiCall(
                baseUrl, token, "FormAnalytics.getEntryFields", siteId, "month", "today", idForm))
        addCompactReport(
            fieldAnalytics,
            "unneededFields",
            apiCall(
                baseUrl, token, "FormAnalytics.getUneededFields", siteId, "month", "today", idForm))
        if (fieldAnalytics.size() > 0) {
          fieldAnalytics.addProperty(
              "interpretation",
              "fieldTimings = average time users spend in a field (high = hesitation / long " +
                  "fill-in). fieldCorrections = how often a field's value was corrected (high = " +
                  "error-prone input, e.g. wrong format). dropOffFields = fields where users give up " +
                  "and leave the form (abandonment). entryFields = the first field users interact " +
                  "with. unneededFields = fields users skip / do not fill (candidates for removal). " +
                  "mostUsedFields = fields with the most interactions.")
          out.add("fieldAnalytics", fieldAnalytics)
        }

        // --- Site-level overview & live reports (no idForm needed) ---
        addCompactReport(
            out,
            "siteSummary",
            apiCall(
                baseUrl,
                token,
                "FormAnalytics.getSummary",
                siteId,
                "month",
                "today",
                null,
                mapOf("flat" to "1")))
        addCompactReport(
            out,
            "currentMostPopularForms",
            apiCall(
                baseUrl,
                token,
                "FormAnalytics.getCurrentMostPopularForms",
                siteId,
                null,
                null,
                null,
                mapOf("lastMinutes" to "60", "filter_limit" to "10")))
        addCompactReport(
            out,
            "liveCounters",
            apiCall(
                baseUrl,
                token,
                "FormAnalytics.getCounters",
                siteId,
                null,
                null,
                null,
                mapOf("lastMinutes" to "60")))

        if (out.size() > 0) return out
      }
      null
    } catch (e: Exception) {
      logger.warn("[MatomoStats] queryFormAnalytics failed: {}", e.message)
      null
    }
  }

  /**
   * POSTs one Matomo API call to `<baseUrl>/index.php` and returns the parsed JSON (usually a
   * [JsonArray] for data methods, a [JsonObject] for single results or errors). Returns `null` on
   * transport/parse errors. [period]/[date] may be omitted for live reports
   * (`getCurrentMostPopularForms`, `getCounters`, ...); [extra] adds arbitrary extra parameters.
   */
  private fun apiCall(
      baseUrl: String,
      token: String,
      method: String,
      idSite: String?,
      period: String? = "month",
      date: String? = "today",
      idForm: String? = null,
      extra: Map<String, String> = emptyMap()
  ): Any? {
    return try {
      val params =
          mutableListOf(
              "module=API",
              "method=${urlEncode(method)}",
              "format=JSON",
              "token_auth=${urlEncode(token)}")
      if (!period.isNullOrBlank()) params.add("period=${urlEncode(period)}")
      if (!date.isNullOrBlank()) params.add("date=${urlEncode(date)}")
      if (!idSite.isNullOrBlank()) params.add("idSite=${urlEncode(idSite)}")
      if (!idForm.isNullOrBlank()) params.add("idForm=${urlEncode(idForm)}")
      for ((key, value) in extra) params.add("${urlEncode(key)}=${urlEncode(value)}")
      val body = params.joinToString("&")
      // Record the sanitized request (never the token) so the assistant can show what was sent.
      activeRequests
          .get()
          ?.add(
              JsonObject().also { req ->
                req.addProperty("endpoint", "$baseUrl/index.php")
                req.addProperty("method", method)
                req.addProperty("period", period)
                req.addProperty("date", date)
                req.addProperty("idSite", idSite)
                req.addProperty("idForm", idForm)
                if (extra.isNotEmpty()) {
                  req.add(
                      "extra",
                      JsonObject().also { e ->
                        for ((key, value) in extra) e.addProperty(key, value)
                      })
                }
              })
      val connection = URI("$baseUrl/index.php").toURL().openConnection() as HttpURLConnection
      connection.requestMethod = "POST"
      connection.doOutput = true
      connection.connectTimeout = 8_000
      connection.readTimeout = 30_000
      connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
      connection.setRequestProperty("Accept", "application/json")
      connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
      val code = connection.responseCode
      val raw =
          if (code in 200..299) {
            connection.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
          } else {
            connection.errorStream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: ""
          }
      try {
        JsonParser.parseString(raw)
      } catch (e: Exception) {
        logger.warn("[MatomoStats] Non-JSON response from {}: {}", method, raw.take(200))
        null
      }
    } catch (e: Exception) {
      logger.warn("[MatomoStats] apiCall '{}' failed: {}", method, e.message)
      null
    }
  }

  /**
   * Adds the top rows of a report as a compact array of the row's scalar fields (label/name plus
   * the numeric metrics) under [key]. Skips errors/empty results so a missing method or plugin
   * cannot break the summary.
   */
  private fun addCompactReport(target: JsonObject, key: String, data: Any?, maxRows: Int = 10) {
    val rows = flattenEntries(data)
    if (rows.isEmpty()) return
    val arr = JsonArray()
    for (row in rows) {
      if (arr.size() >= maxRows) break
      val o = JsonObject()
      for ((k, v) in row.entrySet()) {
        // Keep only scalar fields (label/name + numeric metrics); drop nested arrays/objects.
        if (v.isJsonPrimitive) o.add(k, v)
      }
      if (o.size() > 0) arr.add(o)
    }
    if (arr.size() > 0) target.add(key, arr)
  }

  /**
   * Normalizes a Matomo result into a flat list of row objects. Matomo returns several shapes: a
   * plain array, `{rows:[...]}` (DataTable), `{siteId: [...]}` (idSite=all), or an error object —
   * all are handled here.
   */
  private fun flattenEntries(parsed: Any?): List<JsonObject> {
    val out = mutableListOf<JsonObject>()
    when (parsed) {
      is JsonArray -> {
        for (el in parsed) if (el.isJsonObject) out.add(el.asJsonObject)
      }
      is JsonObject -> {
        // DataTable shape: {"rows": [...]}
        val rowsEl = parsed.get("rows")
        if (rowsEl is JsonArray) {
          for (el in rowsEl) if (el.isJsonObject) out.add(el.asJsonObject)
          return out
        }
        // idSite=all shape: {siteId: [...]}
        for ((_, v) in parsed.entrySet()) {
          if (v is JsonArray) {
            for (el in v) if (el.isJsonObject) out.add(el.asJsonObject)
          } else if (v.isJsonObject) {
            out.add(v.asJsonObject)
          }
        }
      }
    }
    return out
  }

  /**
   * Flattens a daily Matomo report (`period=day&date=last7`) into a map keyed by the ISO date. The
   * API returns several shapes: `{date: [...]}`, `{date: {"rows":[...]}}`, or — for `idSite=all` —
   * `{siteId: {date: [...]}}`. Only rows under an ISO date key (`YYYY-MM-DD`) are collected, so
   * numeric site ids never become dates. Returns an empty map when nothing can be parsed.
   */
  private fun flattenDaily(parsed: Any?): Map<String, List<JsonObject>> {
    val out = LinkedHashMap<String, MutableList<JsonObject>>()
    fun collect(el: JsonElement?, currentDate: String?) {
      when (el) {
        is JsonObject -> {
          val rows = el.get("rows")
          if (rows is JsonArray) {
            if (currentDate != null) {
              val list = out.getOrPut(currentDate) { mutableListOf() }
              for (r in rows) if (r.isJsonObject) list.add(r.asJsonObject)
            }
          } else {
            for ((key, value) in el.entrySet()) {
              val date = if (DATE_KEY.matches(key)) key else currentDate
              collect(value, date)
            }
          }
        }
        is JsonArray -> {
          if (currentDate != null) {
            val list = out.getOrPut(currentDate) { mutableListOf() }
            for (r in el) if (r.isJsonObject) list.add(r.asJsonObject)
          }
        }
        else -> {}
      }
    }
    collect(parsed as? JsonElement, null)
    return out
  }

  /** Matches Matomo's ISO date keys (`YYYY-MM-DD`) inside daily reports. */
  private val DATE_KEY = Regex("^\\d{4}-\\d{2}-\\d{2}$")

  /** Lowercases and strips umlauts/punctuation so "Straße" matches "strasse". */
  private fun normalize(str: String): String =
      str.lowercase()
          .replace("ä", "ae")
          .replace("ö", "oe")
          .replace("ü", "ue")
          .replace("ß", "ss")
          .replace(Regex("[^a-z0-9]"), "")

  private fun matches(label: String, normalized: String): Boolean {
    if (normalized.isBlank()) return false
    val n = normalize(label)
    return n == normalized || (n.isNotBlank() && (n.contains(normalized) || normalized.contains(n)))
  }

  /** Numeric value of a page metric (handles "%" and German comma decimals). */
  private fun pageValue(obj: JsonObject, key: String): Double {
    val v = obj.get(key) ?: return 0.0
    if (!v.isJsonPrimitive) return 0.0
    return v.asString.removeSuffix("%").replace(",", ".").toDoubleOrNull() ?: 0.0
  }

  private fun urlEncode(s: String): String = URLEncoder.encode(s, "UTF-8")
}
