package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.nio.charset.StandardCharsets

/** Shared Gson instance — includes null fields in the output. */
internal val gsonWithNulls: Gson = GsonBuilder().serializeNulls().create()

/** Shared Gson instance — omits null fields for compact API output. */
internal val gsonCompact: Gson = Gson()

// region Response Data Classes

/** Generic error response. */
internal data class ErrorResponse(val error: String, val retryAfter: Int? = null)

/** Response when a streaming session is started. */
internal data class StreamIdResponse(val streamId: String)

/** Health-check response. */
internal data class HealthCheckResponse(
    val status: String? = null,
    val model: String? = null,
    val thinkingModel: String? = null,
    val pendingThinkingModel: Boolean? = null,
    val error: String? = null,
    val queueBadge: Boolean? = null
)

/** I18n labels for the streaming UI. */
internal data class I18nLabels(
    val reasoningLabel: String,
    val showReasoningLabel: String,
    val showSourcesLabel: String,
    val searchingLabel: String,
    val searchingLabelNoQuery: String,
    val thinkingLabel: String,
    val copyResponseLabel: String,
    val copyReasoningLabel: String
)

/** A single uncertain token entry in confidence data. */
internal data class UncertainToken(val t: String, val lp: Double, val o: Int)

/** Confidence metrics for a completed response. */
internal data class ConfidenceData(
    val mean: Double?,
    val uncertainTokens: List<UncertainToken>,
    /** Nullable so that `gsonCompact` omits the field entirely when not detected. */
    val logprobRepetition: Boolean? = null
)

/** Streaming poll response — the main SSE status payload. */
internal data class StreamPollResponse(
    val text: String,
    val done: Boolean,
    val error: String? = null,
    val resourceStatus: String? = null,
    val searching: Boolean? = null,
    val searchQuery: String? = null,
    val thinking: String? = null,
    val modelType: String? = null,
    val i18n: I18nLabels? = null,
    val confidence: ConfidenceData? = null,
    val queuePosition: Int? = null
)

// endregion Response Data Classes

/** Serializes any object to JSON and wraps it in a servlet response. */
internal fun gsonResponse(obj: Any): IPluginServletActionRetVal =
    jsonResponse(gsonCompact.toJson(obj))

/**
 * Escapes a string for safe inclusion in a hand-built JSON value.
 *
 * @param s The raw string.
 * @return The escaped string (backslash, quotes, control chars, non-ASCII).
 */
internal fun jsonEscape(s: String): String = buildString {
  for (c in s) {
    when {
      c == '\\' -> append("\\\\")
      c == '"' -> append("\\\"")
      c == '\n' -> append("\\n")
      c == '\r' -> append("\\r")
      c == '\t' -> append("\\t")
      c.code < 0x20 -> append("\\u%04x".format(c.code))
      else -> append(c)
    }
  }
}

/**
 * Wraps a JSON string in a [PluginServletActionRetVal] with UTF-8 encoding.
 *
 * @param json The raw JSON response body.
 * @return An [IPluginServletActionRetVal] ready to be returned from the servlet execute method.
 */
internal fun jsonResponse(json: String): IPluginServletActionRetVal {
  val resp =
      ServletResponse(EResponseType.JSON).apply {
        value = json
        encoding = StandardCharsets.UTF_8.name()
      }
  return PluginServletActionRetVal(resp)
}
