package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import java.net.HttpURLConnection
import java.net.URI

/**
 * Stateless HTTP client for forwarding audio to a Whisper-compatible transcription endpoint.
 *
 * Supports two modes:
 * - **Local**: multipart POST to `http://127.0.0.1:<port>/inference` (whisper.cpp server).
 * - **External**: multipart POST to `<baseUrl>/v1/audio/transcriptions` (OpenAI-compatible API).
 *
 * @param log Log function for diagnostic output.
 */
class WhisperTranscriptionClient(private val log: (LogLevel, String) -> Unit) {

  /**
   * Sends audio bytes to the local whisper-server `/inference` endpoint.
   *
   * @param audioBytes Raw audio bytes (WebM/Opus, WAV, etc.).
   * @param port Local whisper-server port.
   * @param language Optional BCP-47 language hint (e.g. `"en"`, `"de"`), or `null` for auto-detect.
   * @return The transcribed text.
   * @throws RuntimeException If the server returns a non-2xx HTTP status.
   */
  fun transcribeLocal(audioBytes: ByteArray, port: Int, language: String?): String {
    val boundary = "----CodBiWhisper${System.currentTimeMillis()}"
    val connection =
        URI("http://127.0.0.1:$port/inference").toURL().openConnection() as HttpURLConnection

    connection.requestMethod = "POST"
    connection.doOutput = true
    connection.connectTimeout = 5_000
    connection.readTimeout = 120_000
    connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")

    writeMultipartBody(connection, boundary, audioBytes, language, null, null)

    return readResponse(connection, "whisper-server")
  }

  /**
   * Sends audio bytes to an external OpenAI-compatible `/v1/audio/transcriptions` endpoint.
   *
   * @param audioBytes Raw audio bytes (WebM/Opus, WAV, etc.).
   * @param baseUrl Base URL of the external API (e.g. `"https://api.openai.com"`).
   * @param apiKey Bearer token / API key, or `null` if not required.
   * @param model Model identifier (e.g. `"whisper-1"`).
   * @param language Optional BCP-47 language hint, or `null` for auto-detect.
   * @return The transcribed text.
   * @throws RuntimeException If the external API returns a non-2xx HTTP status.
   */
  fun transcribeExternal(
      audioBytes: ByteArray,
      baseUrl: String,
      apiKey: String?,
      model: String,
      language: String?
  ): String {
    val boundary = "----CodBiWhisper${System.currentTimeMillis()}"
    val connection =
        URI("$baseUrl/v1/audio/transcriptions").toURL().openConnection() as HttpURLConnection

    connection.requestMethod = "POST"
    connection.doOutput = true
    connection.connectTimeout = 10_000
    connection.readTimeout = 120_000
    connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")

    apiKey?.let { connection.setRequestProperty("Authorization", "Bearer $it") }

    writeMultipartBody(connection, boundary, audioBytes, language, model, null)

    return readResponse(connection, "External Whisper API")
  }

  /**
   * Writes a multipart/form-data body containing the audio file and optional metadata fields.
   *
   * @param connection The HTTP connection to write to.
   * @param boundary Multipart boundary string.
   * @param audioBytes Raw audio file content.
   * @param language Optional language hint.
   * @param model Optional model name (only sent if non-null).
   * @param extraFields Additional form fields to include (key → value).
   */
  private fun writeMultipartBody(
      connection: HttpURLConnection,
      boundary: String,
      audioBytes: ByteArray,
      language: String?,
      model: String?,
      @Suppress("SameParameterValue") extraFields: Map<String, String>?
  ) {
    val lineEnd = "\r\n"

    connection.outputStream.buffered().use { out ->
      // Audio file part
      out.write("--$boundary$lineEnd".toByteArray())
      out.write(
          "Content-Disposition: form-data; name=\"file\"; filename=\"audio.webm\"$lineEnd"
              .toByteArray())
      out.write("Content-Type: audio/webm$lineEnd$lineEnd".toByteArray())
      out.write(audioBytes)
      out.write(lineEnd.toByteArray())

      // Model (external API)
      if (model != null) {
        out.write("--$boundary$lineEnd".toByteArray())
        out.write("Content-Disposition: form-data; name=\"model\"$lineEnd$lineEnd".toByteArray())
        out.write("$model$lineEnd".toByteArray())
      }

      // Response format
      out.write("--$boundary$lineEnd".toByteArray())
      out.write(
          "Content-Disposition: form-data; name=\"response_format\"$lineEnd$lineEnd".toByteArray())
      out.write("json$lineEnd".toByteArray())

      // Temperature
      out.write("--$boundary$lineEnd".toByteArray())
      out.write(
          "Content-Disposition: form-data; name=\"temperature\"$lineEnd$lineEnd".toByteArray())
      out.write("0.0$lineEnd".toByteArray())

      // Language
      if (!language.isNullOrBlank()) {
        out.write("--$boundary$lineEnd".toByteArray())
        out.write("Content-Disposition: form-data; name=\"language\"$lineEnd$lineEnd".toByteArray())
        out.write("$language$lineEnd".toByteArray())
      }

      // Extra fields
      extraFields?.forEach { (key, value) ->
        out.write("--$boundary$lineEnd".toByteArray())
        out.write("Content-Disposition: form-data; name=\"$key\"$lineEnd$lineEnd".toByteArray())
        out.write("$value$lineEnd".toByteArray())
      }

      out.write("--$boundary--$lineEnd".toByteArray())
      out.flush()
    }
  }

  /**
   * Reads the HTTP response, extracts the `"text"` field from the JSON body, and disconnects.
   *
   * @param connection The HTTP connection to read from.
   * @param serverLabel Label for error messages (e.g. `"whisper-server"`, `"External Whisper
   *   API"`).
   * @return The transcribed text.
   * @throws RuntimeException on non-2xx response codes.
   */
  private fun readResponse(connection: HttpURLConnection, serverLabel: String): String {
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
      throw RuntimeException("$serverLabel HTTP $responseCode: $body")
    }

    return extractTextFromJson(body)
  }

  /**
   * Extracts the `"text"` field from a whisper JSON response.
   *
   * @param json Raw JSON response body (e.g. `{"text":"hello world"}`).
   * @return The unescaped transcription text.
   */
  private fun extractTextFromJson(json: String): String {
    val match = Regex(""""text"\s*:\s*"((?:[^"\\]|\\.)*)"""").find(json) ?: return json.trim()

    return match.groupValues[1]
        .replace("\\n", "\n")
        .replace("\\\"", "\"")
        .replace("\\\\", "\\")
        .trim()
  }
}
