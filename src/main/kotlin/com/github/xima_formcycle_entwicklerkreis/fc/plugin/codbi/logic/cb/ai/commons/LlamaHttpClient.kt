package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URI

/**
 * HTTP client for communicating with a local LLAMA-Server instance.
 *
 * Provides synchronous and streaming POST requests to the LLAMA-Server API. Port is supplied as a
 * lambda so it always resolves to the current active port.
 *
 * @param defaultPort Lambda returning the current server port. Called on each request.
 * @param log Log function for diagnostic output.
 */
class LlamaHttpClient(
    private val defaultPort: () -> Int,
    private val log: (LogLevel, String) -> Unit
) {

  /** Base URL for a specific port. */
  fun serverBaseUrl(port: Int): String = "http://127.0.0.1:$port"

  /** Base URL using the default port. */
  val serverBaseUrl: String
    get() = serverBaseUrl(defaultPort())

  /**
   * Sends a POST request to the LLAMA-Server and returns the response body.
   *
   * @param endpoint The API endpoint path (e.g., `/v1/chat/completions`).
   * @param jsonBody The JSON request body.
   * @param timeoutMs Read timeout in milliseconds.
   * @param port Optional port override. Defaults to the current server port.
   * @return The response body as a String.
   * @throws RuntimeException on non-2xx responses.
   */
  fun httpPost(
      endpoint: String,
      jsonBody: String,
      timeoutMs: Int = 300_000,
      port: Int = defaultPort()
  ): String {
    val url = "${serverBaseUrl(port)}$endpoint"
    val connection = URI(url).toURL().openConnection() as HttpURLConnection

    connection.requestMethod = "POST"
    connection.doOutput = true
    connection.connectTimeout = 5_000
    connection.readTimeout = timeoutMs
    connection.setRequestProperty("Content-Type", "application/json")
    connection.setRequestProperty("Accept", "application/json")
    connection.outputStream.use { os -> os.write(jsonBody.toByteArray(Charsets.UTF_8)) }

    val responseCode = connection.responseCode
    val body =
        try {
          (if (responseCode in 200..299) connection.inputStream else connection.errorStream)
              .bufferedReader()
              .readText()
        } catch (X: Exception) {
          "[body unreadable: ${X.javaClass.simpleName} — ${X.message}]"
        }

    connection.disconnect()

    if (responseCode !in 200..299) {
      throw RuntimeException("LLAMA-Server returned HTTP $responseCode: $body")
    }

    return body
  }

  /**
   * Sends a POST request to the LLAMA-Server and streams the response as SSE lines.
   *
   * ## SSE framing contract
   * The llama.cpp server emits a minimal SSE stream:
   * - Each chunk is a `data: {json}` line followed by a blank line.
   * - The stream ends with `data: [DONE]`.
   * - No `event:`, `id:`, or `retry:` fields are sent under normal operation.
   *
   * If the server ever emits those fields (e.g. after a llama.cpp upgrade), they are logged at INFO
   * level so the change is visible in diagnostics.
   *
   * @param endpoint The API endpoint path.
   * @param jsonBody The JSON request body (should include `"stream": true`).
   * @param onLine Callback invoked for each SSE `data: ` line as it arrives.
   * @param shouldStop Callback that returns `true` to abort streaming early.
   * @param timeoutMs Read timeout in milliseconds.
   * @param port Optional port override. Defaults to the current server port.
   * @throws RuntimeException if the server returns a non-2xx status code.
   */
  fun httpPostStreaming(
      endpoint: String,
      jsonBody: String,
      onLine: (String) -> Unit,
      shouldStop: () -> Boolean = { false },
      timeoutMs: Int = 300_000,
      port: Int = defaultPort()
  ) {
    val url = "${serverBaseUrl(port)}$endpoint"
    val connection = URI(url).toURL().openConnection() as HttpURLConnection

    connection.requestMethod = "POST"
    connection.doOutput = true
    connection.connectTimeout = 5_000
    connection.readTimeout = timeoutMs
    connection.setRequestProperty("Content-Type", "application/json")
    connection.setRequestProperty("Accept", "text/event-stream")
    connection.outputStream.use { os -> os.write(jsonBody.toByteArray(Charsets.UTF_8)) }

    val responseCode = connection.responseCode

    if (responseCode !in 200..299) {
      val errorBody =
          try {
            connection.errorStream.bufferedReader().readText()
          } catch (X: Exception) {
            "[body unreadable: ${X.javaClass.simpleName} — ${X.message}]"
          }

      connection.disconnect()

      throw RuntimeException("LLAMA-Server returned HTTP $responseCode: $errorBody")
    }

    try {
      BufferedReader(InputStreamReader(connection.inputStream, Charsets.UTF_8)).use { reader ->
        reader.lineSequence().forEach { line ->
          if (shouldStop()) {
            log(LogLevel.INFO, "Streaming aborted by stop request — disconnecting")

            return@use
          }

          if (line.startsWith("data: ")) {
            val data = line.removePrefix("data: ").trim()

            if (data != "[DONE]") {
              onLine(data)
            }
          } else if (line.startsWith("event:") ||
              line.startsWith("id:") ||
              line.startsWith("retry:")) {
            log(LogLevel.INFO, "SSE field received (unexpected from llama.cpp): $line")
          }
        }
      }
    } finally {
      connection.disconnect()
    }
  }
}
