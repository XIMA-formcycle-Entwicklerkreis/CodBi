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
    private val log: (LogLevel, String) -> Unit,
    private val extraParams: String? = null
) {

  companion object {
    /** TCP connect timeout — short to fail fast on unreachable hosts. */
    private const val CONNECT_TIMEOUT_MS = 10_000

    /** Default read timeout — generous to allow large model responses. */
    private const val DEFAULT_READ_TIMEOUT_MS = 300_000

    /** Delay before a single retry on transient network failures. */
    private const val RETRY_DELAY_MS = 1_000L

    /** Number of retries (in addition to the first attempt) for HTTP 429 rate limits. */
    private const val RATE_LIMIT_RETRIES = 2

    /** Base backoff for 429 retries — grows linearly (3 s, then 6 s). */
    private const val RATE_LIMIT_BACKOFF_MS = 3_000L
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
   * Retries [action] on transient failures:
   * - a single 1-second retry for network errors ([ConnectException], [SocketTimeoutException]);
   * - a few retries with increasing backoff for HTTP 429 rate limits from the external provider
   *   (bounded, so the request never hangs forever — after the retries are exhausted the 429 is
   *   rethrown and surfaced to the caller).
   */
  private fun <T> retryOnTransientFailure(action: () -> T): T {
    var rateLimitAttempts = 0
    while (true) {
      try {
        return action()
      } catch (e: ConnectException) {
        log(LogLevel.WARNING, "Connection refused, retrying in 1 s: ${e.message}")
        Thread.sleep(RETRY_DELAY_MS)
        return action()
      } catch (e: SocketTimeoutException) {
        log(LogLevel.WARNING, "Connection timed out, retrying in 1 s: ${e.message}")
        Thread.sleep(RETRY_DELAY_MS)
        return action()
      } catch (e: ExternalAiHttpException) {
        if (e.httpStatus == 429 && rateLimitAttempts < RATE_LIMIT_RETRIES) {
          rateLimitAttempts++
          val wait = RATE_LIMIT_BACKOFF_MS * rateLimitAttempts
          log(LogLevel.WARNING, "External AI rate limited (HTTP 429), retrying in ${wait / 1000} s")
          Thread.sleep(wait)
          continue
        }
        throw e
      }
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

  /**
   * Injects the specialist-specific extra JSON parameters (e.g. `{"temperature":0.0}`) into the
   * request body. The parameters are merged into the root JSON object. Existing keys are
   * overwritten so specialist params take precedence over globally set ones.
   *
   * @param requestBody The original JSON body.
   * @return The body with extra parameters merged in, or unchanged if no extra params are set.
   */
  fun injectExtraParams(requestBody: String): String {
    val ep = extraParams ?: return requestBody
    return try {
      val json = com.google.gson.JsonParser.parseString(requestBody).asJsonObject
      val extra = com.google.gson.JsonParser.parseString(ep).asJsonObject
      for (key in extra.keySet()) {
        json.add(key, extra.get(key))
      }
      json.toString()
    } catch (e: Exception) {
      log(LogLevel.WARNING, "Failed to inject extra params via JSON parse: ${e.message}")
      requestBody
    }
  }
}
