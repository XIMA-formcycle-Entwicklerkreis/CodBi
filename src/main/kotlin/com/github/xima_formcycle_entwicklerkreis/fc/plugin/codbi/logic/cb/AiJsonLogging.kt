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
