package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.ConnectException
import java.net.HttpURLConnection
import java.net.SocketTimeoutException
import java.net.URI

/**
 * HTTP client for an external OpenAI-compatible API. Handles both synchronous and Server-Sent Event
 * (SSE) streaming requests. Adds Bearer-token authentication and model-field injection.
 */
internal class ExternalAiClient(
    private val baseUrl: String,
    private val apiKey: String?,
    private val model: String?,
    private val log: (LogLevel, String) -> Unit
) {

  companion object {
    /** TCP connect timeout — short to fail fast on unreachable hosts. */
    private const val CONNECT_TIMEOUT_MS = 10_000

    /** Default read timeout — generous to allow large model responses. */
    private const val DEFAULT_READ_TIMEOUT_MS = 300_000

    /** Delay before a single retry on transient network failures. */
    private const val RETRY_DELAY_MS = 1_000L
  }

  /**
   * Sends a synchronous POST request.
   *
   * @param endpoint The API path (e.g. `/v1/chat/completions`).
   * @param jsonBody The JSON request body.
   * @param timeoutMs Read timeout in milliseconds.
   * @return The full response body as a string.
   * @throws RuntimeException If the server returns a non-2xx status code.
   */
  fun post(endpoint: String, jsonBody: String, timeoutMs: Int = DEFAULT_READ_TIMEOUT_MS): String {
    return retryOnTransientFailure {
      val url = "$baseUrl$endpoint"
      val connection = URI(url).toURL().openConnection() as HttpURLConnection

      connection.requestMethod = "POST"
      connection.doOutput = true
      connection.connectTimeout = CONNECT_TIMEOUT_MS
      connection.readTimeout = timeoutMs
      connection.setRequestProperty("Content-Type", "application/json")
      connection.setRequestProperty("Accept", "application/json")

      apiKey?.let { connection.setRequestProperty("Authorization", "Bearer $it") }

      connection.outputStream.use { os -> os.write(jsonBody.toByteArray(Charsets.UTF_8)) }

      val responseCode = connection.responseCode
      val body =
          try {
            (if (responseCode in 200..299) connection.inputStream else connection.errorStream)
                .bufferedReader()
                .readText()
          } catch (e: Exception) {
            log(LogLevel.WARNING, "Failed to read response body: ${e.message}")
            ""
          }

      connection.disconnect()

      if (responseCode !in 200..299) {
        throw RuntimeException("External AI returned HTTP $responseCode: $body")
      }

      body
    }
  }

  /**
   * Sends a streaming POST request and processes Server-Sent Events (SSE).
   *
   * @param endpoint The API path (e.g. `/v1/chat/completions`).
   * @param jsonBody The JSON request body (should include `"stream":true`).
   * @param onLine Callback invoked for each SSE `data:` line.
   * @param shouldStop Predicate checked between chunks; when `true`, streaming is aborted.
   * @param timeoutMs Read timeout in milliseconds.
   * @throws RuntimeException If the server returns a non-2xx status code.
   */
  fun postStreaming(
      endpoint: String,
      jsonBody: String,
      onLine: (String) -> Unit,
      shouldStop: () -> Boolean = { false },
      timeoutMs: Int = DEFAULT_READ_TIMEOUT_MS
  ) {
    retryOnTransientFailure {
      val url = "$baseUrl$endpoint"
      val connection = URI(url).toURL().openConnection() as HttpURLConnection

      connection.requestMethod = "POST"
      connection.doOutput = true
      connection.connectTimeout = CONNECT_TIMEOUT_MS
      connection.readTimeout = timeoutMs
      connection.setRequestProperty("Content-Type", "application/json")
      connection.setRequestProperty("Accept", "text/event-stream")

      apiKey?.let { connection.setRequestProperty("Authorization", "Bearer $it") }

      connection.outputStream.use { os -> os.write(jsonBody.toByteArray(Charsets.UTF_8)) }

      val responseCode = connection.responseCode

      if (responseCode !in 200..299) {
        val errorBody =
            try {
              connection.errorStream.bufferedReader().readText()
            } catch (e: Exception) {
              log(LogLevel.WARNING, "Failed to read error body: ${e.message}")
              ""
            }

        connection.disconnect()

        throw RuntimeException("External AI returned HTTP $responseCode: $errorBody")
      }

      try {
        BufferedReader(InputStreamReader(connection.inputStream, Charsets.UTF_8)).use { reader ->
          reader.lineSequence().forEach { line ->
            if (shouldStop()) {
              log(LogLevel.INFO, "External streaming aborted by stop request — disconnecting")
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
              log(LogLevel.INFO, "SSE field received (unexpected from external AI): $line")
            }
          }
        }
      } finally {
        connection.disconnect()
      }
    }
  }

  /**
   * Probes whether the configured external AI endpoint is reachable and usable for inference.
   *
   * The probe first tries `GET /v1/models`, which is commonly available on OpenAI-compatible
   * servers. If that endpoint is unsupported (`404` or `405`), it falls back to probing the base
   * URL directly. Network failures and non-success responses are reported as a human-readable error
   * string.
   *
   * @param timeoutMs Connect/read timeout in milliseconds for the probe.
   * @return `null` when the external endpoint appears reachable, otherwise an error message.
   */
  fun probeAvailability(timeoutMs: Int = 5_000): String? {
    val modelProbeError = probeEndpoint("/v1/models", timeoutMs)

    if (modelProbeError == null) {
      return null
    }

    if (modelProbeError.startsWith("HTTP 404") || modelProbeError.startsWith("HTTP 405")) {
      val baseProbeError = probeEndpoint("", timeoutMs)

      if (baseProbeError == null) {
        return null
      }

      return "External AI unavailable: $baseProbeError"
    }

    return "External AI unavailable: $modelProbeError"
  }

  /**
   * Sends a lightweight GET probe to one endpoint and returns `null` on success.
   *
   * @param endpoint API path to probe.
   * @param timeoutMs Connect/read timeout in milliseconds.
   * @return `null` when the endpoint is reachable, otherwise a short error description.
   */
  private fun probeEndpoint(endpoint: String, timeoutMs: Int): String? {
    return try {
      val url = "$baseUrl$endpoint"
      val connection = URI(url).toURL().openConnection() as HttpURLConnection

      connection.requestMethod = "GET"
      connection.connectTimeout = timeoutMs
      connection.readTimeout = timeoutMs
      connection.setRequestProperty("Accept", "application/json")

      apiKey?.let { connection.setRequestProperty("Authorization", "Bearer $it") }

      val responseCode = connection.responseCode
      val body =
          try {
            (if (responseCode in 200..299) connection.inputStream else connection.errorStream)
                ?.bufferedReader()
                ?.readText() ?: ""
          } catch (_: Exception) {
            ""
          }

      connection.disconnect()

      when {
        responseCode in 200..299 -> null
        responseCode == 401 -> "HTTP 401: unauthorized"
        responseCode == 403 -> "HTTP 403: forbidden"
        body.isNotBlank() -> "HTTP $responseCode: ${body.take(200)}"
        else -> "HTTP $responseCode"
      }
    } catch (e: Exception) {
      e.message ?: e.javaClass.simpleName
    }
  }

  /**
   * Executes [action] and retries it once after a short delay when a transient network failure
   * occurs.
   *
   * @param action The operation to execute.
   * @return The result produced by [action].
   * @throws ConnectException If both attempts fail with connection errors.
   * @throws SocketTimeoutException If both attempts fail with read/connect timeouts.
   */
  private fun <T> retryOnTransientFailure(action: () -> T): T {
    return try {
      action()
    } catch (e: ConnectException) {
      log(LogLevel.WARNING, "Connection refused, retrying in 1 s: ${e.message}")
      Thread.sleep(RETRY_DELAY_MS)
      action()
    } catch (e: SocketTimeoutException) {
      log(LogLevel.WARNING, "Connection timed out, retrying in 1 s: ${e.message}")
      Thread.sleep(RETRY_DELAY_MS)
      action()
    }
  }

  /**
   * Injects `"model":"<name>"` into an existing JSON request body.
   *
   * @param requestBody The original JSON body.
   * @return The body with the model field prepended, or unchanged if no model is configured.
   */
  fun injectModelField(requestBody: String): String {
    val m = model ?: return requestBody
    return try {
      val json = com.google.gson.JsonParser.parseString(requestBody).asJsonObject
      json.addProperty("model", m)
      json.toString()
    } catch (e: Exception) {
      log(LogLevel.WARNING, "Failed to inject model field via JSON parse: ${e.message}")
      requestBody
    }
  }
}
