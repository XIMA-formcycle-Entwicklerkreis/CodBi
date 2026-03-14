package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.io.ByteArrayOutputStream
import java.nio.charset.StandardCharsets

/**
 * Handles incoming Whisper servlet requests: health-check probes, resource gating, audio
 * extraction, and transcription routing (local vs external).
 *
 * Extracted from `Whisper.kt` so the servlet class only handles configuration and lifecycle.
 *
 * @param log Logging callback `(LogLevel, message)`.
 */
class WhisperRequestHandler(private val log: (LogLevel, String) -> Unit) {

  /** When `true`, request headers/params are logged for debugging. Disable in production. */
  var debugRequests = false

  /** Header keys whose values are redacted in debug output. */
  private val sensitiveHeaders =
      setOf("authorization", "cookie", "x-api-key", "x-token", "x-secret")

  private val transcriptionClient by lazy {
    WhisperTranscriptionClient { level, msg -> log(level, msg) }
  }

  /**
   * Processes a servlet request for speech-to-text transcription.
   *
   * @param params Servlet action parameters containing headers, request parameters, and uploads.
   * @param serverManager The server manager providing readiness and resource state.
   * @param isExternalMode `true` when using an external OpenAI-compatible API.
   * @param externalUrl Base URL of the external API (if external mode).
   * @param externalApiKey Bearer token for the external API (if external mode).
   * @param externalModel Model identifier for the external API.
   * @param modelUrl The URL of the loaded model (used in health-check response).
   * @param ffmpegAvailable Whether ffmpeg is available for audio conversion.
   * @param autoDetectLanguage When `true`, skip browser language and let whisper auto-detect.
   * @return JSON response with transcribed text or an error message.
   */
  fun handle(
      params: IPluginServletActionParams,
      serverManager: WhisperServerManager,
      isExternalMode: Boolean,
      externalUrl: String?,
      externalApiKey: String?,
      externalModel: String?,
      modelUrl: String,
      ffmpegAvailable: Boolean,
      autoDetectLanguage: Boolean = false
  ): IPluginServletActionRetVal {
    // region Health Check
    if (params.headerMap.entries.any {
      it.key.equals("X-Health-Check", ignoreCase = true) &&
          it.value.equals("true", ignoreCase = true)
    }) {
      if (serverManager.loadError != null) {
        return jsonResponse(
            "{\"error\":\"${jsonEscape(serverManager.loadError?.message ?: "unknown")}\"}")
      }
      if (!serverManager.serverReady) {
        return jsonResponse(
            "{\"error\":\"Whisper is not ready yet. It may still be downloading or loading.\"}")
      }

      return jsonResponse(
          "{\"status\":\"ready\",\"model\":\"${jsonEscape(
              if (isExternalMode) externalModel ?: "whisper-1"
              else modelUrl.substringAfterLast("/").removeSuffix(".bin"))}\",\"convertSupported\":${if (isExternalMode) true else ffmpegAvailable}}")
    }
    // endregion Health Check
    // region Resource Gate
    val reason = serverManager.exceedReason()

    if (reason != null) {
      val waitSec = serverManager.estimateWaitSeconds()

      log(LogLevel.WARNING, "Resource gate BLOCKED: $reason — estimated wait ${waitSec}s")

      return jsonResponse(
          "{\"error\":\"Server resources exceeded ($reason). Please retry in ~${waitSec} seconds.\",\"retryAfter\":$waitSec}")
    }

    if (!serverManager.serverReady) {
      return jsonResponse(
          "{\"error\":\"${jsonEscape(
          if (serverManager.loadError != null)
              "Whisper initialization failed: ${serverManager.loadError?.message}"
          else "Whisper is still loading. Please try again shortly.")}\"}")
    }
    // endregion Resource Gate
    // region Debug Logging
    val language = resolveLanguage(params, autoDetectLanguage)

    if (debugRequests) {
      log(
          LogLevel.INFO,
          "REQUEST DEBUG \u2014 headers: ${params.headerMap.entries.joinToString { (k, v) ->
            if (sensitiveHeaders.contains(k.lowercase())) "$k=[REDACTED]" else "$k=$v"
          }}")
      log(
          LogLevel.INFO,
          "REQUEST DEBUG — params: ${params.requestParameters?.keys?.joinToString() ?: "none"}, " +
              "uploads: ${params.uploadFiles?.entries?.joinToString { (k, v) -> "$k(${v.size} parts)" } ?: "none"}")
    }
    // endregion Debug Logging
    // region Audio Extraction & Transcription
    val audioBytes = collectAudioBytes(params)

    if (audioBytes == null) {
      return jsonResponse("{\"error\":\"No audio file uploaded.\"}")
    }

    return try {
      val transcription =
          if (isExternalMode)
              transcriptionClient.transcribeExternal(
                  audioBytes, externalUrl!!, externalApiKey, externalModel ?: "whisper-1", language)
          else transcriptionClient.transcribeLocal(audioBytes, serverManager.serverPort, language)

      log(
          LogLevel.INFO,
          "Transcription complete: ${transcription.length} chars" +
              if (transcription.length > 80) " (truncated)" else "")
      jsonResponse("{\"text\":\"${jsonEscape(transcription)}\"}")
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Transcription failed: ${X.message}")
      jsonResponse("{\"error\":\"${jsonEscape(X.message ?: "Transcription failed")}\"}")
    }
    // endregion Audio Extraction & Transcription
  }

  // region Audio Collection

  /**
   * Extracts audio bytes from the request — supports base64 data-URL params and multipart uploads.
   *
   * @param params Servlet parameters to extract audio from.
   * @return Raw audio bytes, or `null` if no audio data was found.
   */
  private fun collectAudioBytes(params: IPluginServletActionParams): ByteArray? {
    params.requestParameters?.forEach { (key, values) ->
      if (key.startsWith("codbi-base64:")) {
        try {
          val bytes =
              java.util.Base64.getDecoder()
                  .decode((values.firstOrNull() ?: return@forEach).substringAfter(","))

          if (bytes.isNotEmpty()) {
            log(LogLevel.INFO, "Received audio via base64 param '$key': ${bytes.size} bytes")

            return bytes
          }
        } catch (X: Exception) {
          log(LogLevel.WARNING, "Failed to decode base64 audio for '$key': ${X.message}")
        }
      }
    }

    if (!params.uploadFiles.isNullOrEmpty()) {
      val (_, fileDataList) = params.uploadFiles.entries.firstOrNull() ?: return null
      val buffer = ByteArrayOutputStream()

      fileDataList.forEach { fd -> fd.data?.let { buffer.write(it) } }

      val combined = buffer.toByteArray()

      if (combined.isNotEmpty()) {
        log(LogLevel.INFO, "Received audio via multipart upload: ${combined.size} bytes")

        return combined
      }
    }

    log(LogLevel.WARNING, "No audio data found in request (checked base64 params and uploadFiles)")

    return null
  }

  // endregion Audio Collection
  // region Language Resolution

  /**
   * Resolves the language hint for transcription.
   *
   * Priority: explicit `X-Language` header > browser `Accept-Language` > `null` (auto-detect). When
   * [autoDetect] is `true`, browser language is skipped and `null` is returned unless `X-Language`
   * is explicitly set.
   */
  private fun resolveLanguage(params: IPluginServletActionParams, autoDetect: Boolean): String? {
    val explicit =
        params.headerMap.entries
            .find { it.key.equals("X-Language", ignoreCase = true) }
            ?.value
            ?.trim()
            ?.takeIf { it.isNotEmpty() }

    if (explicit != null) return explicit
    if (autoDetect) return null

    val acceptLanguage =
        params.headerMap.entries.find { it.key.equals("Accept-Language", ignoreCase = true) }?.value
            ?: return null

    // Parse primary language tag: "de-DE,de;q=0.9,en-US;q=0.8" → "de"
    val primary =
        acceptLanguage.split(",").firstOrNull()?.trim()?.split(";")?.firstOrNull()?.trim()
            ?: return null

    // Extract the two-letter language code (before any region subtag)
    val lang = primary.split("-").firstOrNull()?.lowercase()?.takeIf { it.length == 2 }

    if (lang != null) {
      log(
          LogLevel.INFO,
          "Using browser language hint: $lang (from Accept-Language: $acceptLanguage)")
    }

    return lang
  }

  // endregion Language Resolution
  // region JSON Helpers

  /**
   * Wraps a raw JSON string in a servlet response with UTF-8 encoding.
   *
   * @param json The JSON body to return.
   * @return A ready-to-send [IPluginServletActionRetVal].
   */
  private fun jsonResponse(json: String): IPluginServletActionRetVal {
    return PluginServletActionRetVal(
        ServletResponse(EResponseType.JSON).apply {
          value = json
          encoding = StandardCharsets.UTF_8.name()
        })
  }

  /**
   * Escapes a string for safe embedding inside a JSON value.
   *
   * @param s The raw string to escape.
   * @return The string with backslashes, quotes, newlines, carriage returns, and tabs escaped.
   */
  private fun jsonEscape(s: String): String {
    return s.replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t")
  }

  // endregion JSON Helpers
}
