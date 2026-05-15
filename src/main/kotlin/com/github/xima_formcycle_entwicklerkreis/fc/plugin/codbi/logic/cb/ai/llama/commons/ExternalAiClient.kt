package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.ConnectException
import java.net.HttpURLConnection
import java.net.SocketTimeoutException
import java.net.URI

/**
 * Thrown when an external OpenAI-compatible API returns a non-2xx HTTP status. Using a dedicated
 * exception type allows callers to distinguish expected API-level errors (wrong model name, token
 * limit, auth failure, …) from unexpected infrastructure failures and log them accordingly.
 *
 * @param httpStatus The HTTP status code returned by the external API.
 * @param body The response body returned by the external API.
 */
class ExternalAiHttpException(val httpStatus: Int, val body: String) :
    RuntimeException("External AI returned HTTP $httpStatus: $body")

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
      val url = resolveUrl(endpoint)
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
        throw ExternalAiHttpException(responseCode, body)
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
      val url = resolveUrl(endpoint)
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

        throw ExternalAiHttpException(responseCode, errorBody)
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

  private fun resolveUrl(endpoint: String): String = "$baseUrl$endpoint"

  /**
   * Retries [action] once after a 1-second delay when it fails with a transient network exception
   * ([ConnectException] or [SocketTimeoutException]).
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
