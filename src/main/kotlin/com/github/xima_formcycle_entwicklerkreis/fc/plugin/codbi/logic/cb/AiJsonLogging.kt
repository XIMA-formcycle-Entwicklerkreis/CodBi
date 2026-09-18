package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonParser

/**
 * Minifies a JSON string to a single line for compact log output, so a pretty-printed AI
 * form/workflow response does not waste dozens of lines in the logging window (which would
 * otherwise hide most of the payload). When the input cannot be parsed as JSON (e.g. prose, or a
 * partially repaired / truncated fragment) its whitespace is collapsed instead, so logging never
 * fails and never spans many lines.
 *
 * This is the shared implementation; [AICodBiAssistant] historically carried an identical private
 * copy which shadows this name for calls made inside that class.
 */
internal fun compactJsonForLog(json: String): String {
  if (json.isBlank()) return json
  return try {
    JsonParser.parseString(json).toString()
  } catch (_: Exception) {
    json.replace(Regex("\\s+"), " ").trim()
  }
}

/** Default maximum number of characters of an AI response written to the log. */
internal const val MAX_RAW_RESPONSE_LOG_CHARS = 4000

/**
 * Truncates a raw AI response before it is logged so a degenerate repetition-loop response
 * (observed live: 133 KB of the same snippet repeated hundreds of times) cannot flood the server
 * log. Keeps the first [maxChars] characters and appends a `... [truncated N chars]` suffix when
 * the input is longer. Pure (no side effects) so it is unit-testable.
 */
internal fun truncateForLog(text: String, maxChars: Int = MAX_RAW_RESPONSE_LOG_CHARS): String {
  if (text.length <= maxChars) return text
  return text.take(maxChars) + "... [truncated ${text.length - maxChars} chars]"
}
