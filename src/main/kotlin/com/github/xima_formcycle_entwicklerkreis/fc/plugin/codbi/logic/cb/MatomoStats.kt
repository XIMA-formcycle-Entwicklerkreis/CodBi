package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import java.net.HttpURLConnection
import java.net.URI
import java.net.URLEncoder
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

  /** True when both the Matomo URL and the API key are configured. */
  @JvmStatic
  fun isConfigured(): Boolean = !AI.matomoUrl.isNullOrBlank() && !AI.matomoApiKey.isNullOrBlank()

  /**
   * Queries the Matomo server for the statistics of the form whose title matches [formTitle] and
   * returns a compact JSON summary for the AI. Returns `null` when the plugin properties are not
   * configured, when the form cannot be identified, or when the query fails.
   */
  @JvmStatic
  fun queryFormStats(formTitle: String?): String? {
    val baseUrl = AI.matomoUrl?.trim()?.trimEnd('/')
    val token = AI.matomoApiKey?.trim()
    if (baseUrl.isNullOrBlank() || token.isNullOrBlank()) return null
    if (formTitle.isNullOrBlank()) return null
    return try {
      val root = JsonObject()
      root.addProperty("formTitle", formTitle)
      root.addProperty("period", "month")
      root.addProperty("periodLabel", "last 30 days")
      root.addProperty(
          "note",
          "Statistics come from the Matomo server configured via the plugin properties AI_FormAssistant_Matomo_URL and AI_FormAssistant_Matomo_APIKey.")

      // 1. All page titles (forms) across every site — used for the overall ranking ("top 10 most
      //    called forms") and for matching the current form.
      val pageTitles = apiCall(baseUrl, token, "Actions.getPageTitles", "all", "month", "today")
      val entries = flattenEntries(pageTitles)
      val normalizedTitle = normalize(formTitle)
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
        keep.addProperty("avg_page_load_time_seconds", pageValue(obj, "avg_page_load_time"))
        ranked.add(keep)
        if (match == null && matches(label, normalizedTitle)) {
          keep.addProperty("isCurrentForm", true)
          match = keep
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

      // 2. FormAnalytics plugin data (best effort, per site): per-field analytics plus the
      //    site-level overview / live reports. Merged as additional top-level keys.
      val pluginData = queryFormAnalytics(baseUrl, token, normalizedTitle)
      if (pluginData != null) {
        for ((key, value) in pluginData.entrySet()) root.add(key, value)
      }

      gson.toJson(root)
    } catch (e: Exception) {
      logger.warn("[MatomoStats] queryFormStats failed: {}", e.message)
      null
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
