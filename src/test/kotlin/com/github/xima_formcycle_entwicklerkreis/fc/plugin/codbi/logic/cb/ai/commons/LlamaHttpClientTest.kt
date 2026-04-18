package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.sun.net.httpserver.HttpServer
import java.net.InetSocketAddress
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance

/** Tests for [LlamaHttpClient] — URL construction, sync POST, and streaming POST. */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class LlamaHttpClientTest {

  private val logMessages = mutableListOf<Pair<LogLevel, String>>()

  private lateinit var server: HttpServer
  private var serverPort: Int = 0

  @BeforeAll
  fun startServer() {
    server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
    serverPort = server.address.port

    // --- /v1/chat/completions: returns a valid JSON response
    server.createContext("/v1/chat/completions") { exchange ->
      @Suppress("UNUSED_VARIABLE")
      val _requestBody = exchange.requestBody.bufferedReader().readText()
      val response = """{"choices":[{"message":{"content":"Hello from test server"}}]}"""
      val bytes = response.toByteArray(Charsets.UTF_8)
      exchange.sendResponseHeaders(200, bytes.size.toLong())
      exchange.responseBody.use { it.write(bytes) }
    }

    // --- /v1/error: returns 500
    server.createContext("/v1/error") { exchange ->
      val body = """{"error":"internal server error"}"""
      val bytes = body.toByteArray(Charsets.UTF_8)
      exchange.sendResponseHeaders(500, bytes.size.toLong())
      exchange.responseBody.use { it.write(bytes) }
    }

    // --- /v1/stream: returns SSE data lines
    server.createContext("/v1/stream") { exchange ->
      exchange.requestBody.bufferedReader().readText() // drain request
      exchange.sendResponseHeaders(200, 0)
      exchange.responseBody.use { out ->
        out.write("data: {\"chunk\":1}\n\n".toByteArray())
        out.write("data: {\"chunk\":2}\n\n".toByteArray())
        out.write("data: {\"chunk\":3}\n\n".toByteArray())
        out.write("data: [DONE]\n\n".toByteArray())
        out.flush()
      }
    }

    // --- /v1/stream-with-events: returns SSE with event/id/retry fields
    server.createContext("/v1/stream-with-events") { exchange ->
      exchange.requestBody.bufferedReader().readText()
      exchange.sendResponseHeaders(200, 0)
      exchange.responseBody.use { out ->
        out.write("event: message\n".toByteArray())
        out.write("id: 1\n".toByteArray())
        out.write("retry: 3000\n".toByteArray())
        out.write("data: {\"chunk\":1}\n\n".toByteArray())
        out.write("data: [DONE]\n\n".toByteArray())
        out.flush()
      }
    }

    // --- /v1/stream-error: returns 502
    server.createContext("/v1/stream-error") { exchange ->
      exchange.requestBody.bufferedReader().readText()
      val body = "Bad Gateway"
      val bytes = body.toByteArray(Charsets.UTF_8)
      exchange.sendResponseHeaders(502, bytes.size.toLong())
      exchange.responseBody.use { it.write(bytes) }
    }

    // --- /v1/echo: echoes the request body back
    server.createContext("/v1/echo") { exchange ->
      val requestBody = exchange.requestBody.bufferedReader().readText()
      val bytes = requestBody.toByteArray(Charsets.UTF_8)
      exchange.sendResponseHeaders(200, bytes.size.toLong())
      exchange.responseBody.use { it.write(bytes) }
    }

    server.executor = null
    server.start()
  }

  @AfterAll
  fun stopServer() {
    server.stop(0)
  }

  private fun createClient(port: Int = serverPort): LlamaHttpClient {
    logMessages.clear()
    return LlamaHttpClient({ port }) { level, msg -> logMessages.add(level to msg) }
  }

  // region serverBaseUrl

  @Nested
  inner class ServerBaseUrlTest {

    @Test
    fun constructsUrlFromPort() {
      val client = createClient()

      assertEquals("http://127.0.0.1:8080", client.serverBaseUrl(8080))
    }

    @Test
    fun constructsUrlFromDifferentPort() {
      val client = createClient()

      assertEquals("http://127.0.0.1:9090", client.serverBaseUrl(9090))
    }

    @Test
    fun handlesHighPort() {
      val client = createClient()

      assertEquals("http://127.0.0.1:65535", client.serverBaseUrl(65535))
    }

    @Test
    fun propertyUsesDefaultPort() {
      val client = LlamaHttpClient({ 7777 }) { level, msg -> logMessages.add(level to msg) }

      assertEquals("http://127.0.0.1:7777", client.serverBaseUrl)
    }

    @Test
    fun propertyReflectsChangingPort() {
      var port = 8080
      val client = LlamaHttpClient({ port }) { level, msg -> logMessages.add(level to msg) }

      assertEquals("http://127.0.0.1:8080", client.serverBaseUrl)

      port = 9090
      assertEquals("http://127.0.0.1:9090", client.serverBaseUrl)
    }

    @Test
    fun explicitPortOverridesDefault() {
      val client = createClient()

      assertEquals("http://127.0.0.1:3000", client.serverBaseUrl(3000))
    }
  }

  // endregion

  // region httpPost

  @Nested
  inner class HttpPostTest {

    @Test
    fun returnsResponseBodyOn200() {
      val client = createClient()
      val result =
          client.httpPost("/v1/chat/completions", """{"prompt":"test"}""", port = serverPort)

      assertTrue(result.contains("Hello from test server"))
    }

    @Test
    fun throwsOnNon2xxResponse() {
      val client = createClient()

      val ex =
          assertThrows(RuntimeException::class.java) {
            client.httpPost("/v1/error", """{"prompt":"test"}""", port = serverPort)
          }

      assertTrue(ex.message!!.contains("500"))
    }

    @Test
    fun echoesSentBody() {
      val client = createClient()
      val body = """{"model":"test","prompt":"echo me"}"""
      val result = client.httpPost("/v1/echo", body, port = serverPort)

      assertEquals(body, result)
    }

    @Test
    fun usesDefaultPortWhenNotOverridden() {
      val client = createClient(serverPort)
      val result = client.httpPost("/v1/chat/completions", """{"prompt":"test"}""")

      assertTrue(result.contains("Hello from test server"))
    }

    @Test
    fun throwsOnConnectionRefused() {
      val client = createClient(1) // port 1 — unreachable

      assertThrows(Exception::class.java) {
        client.httpPost("/v1/test", """{}""", timeoutMs = 2000, port = 1)
      }
    }
  }

  // endregion

  // region httpPostStreaming

  @Nested
  inner class HttpPostStreamingTest {

    @Test
    fun streamsMultipleChunks() {
      val client = createClient()
      val chunks = mutableListOf<String>()

      client.httpPostStreaming(
          "/v1/stream", """{"stream":true}""", { chunks.add(it) }, port = serverPort)

      assertEquals(3, chunks.size)
      assertTrue(chunks[0].contains("\"chunk\":1"))
      assertTrue(chunks[1].contains("\"chunk\":2"))
      assertTrue(chunks[2].contains("\"chunk\":3"))
    }

    @Test
    fun stopsDoneMarkerNotForwarded() {
      val client = createClient()
      val chunks = mutableListOf<String>()

      client.httpPostStreaming("/v1/stream", """{}""", { chunks.add(it) }, port = serverPort)

      // [DONE] should NOT be forwarded to onLine
      assertFalse(chunks.any { it.contains("[DONE]") })
    }

    @Test
    fun abortsWhenShouldStopReturnsTrue() {
      val client = createClient()
      val chunks = mutableListOf<String>()

      client.httpPostStreaming(
          "/v1/stream",
          """{}""",
          { chunks.add(it) },
          shouldStop = { chunks.size >= 1 },
          port = serverPort)

      // Should have stopped after first chunk
      assertTrue(chunks.size <= 2, "Expected at most 2 chunks but got ${chunks.size}")
    }

    @Test
    fun logsUnexpectedSseFields() {
      val client = createClient()
      logMessages.clear()
      val chunks = mutableListOf<String>()

      client.httpPostStreaming(
          "/v1/stream-with-events", """{}""", { chunks.add(it) }, port = serverPort)

      // event:, id:, retry: should be logged
      val sseLogCount = logMessages.count { it.second.contains("SSE field received") }
      assertTrue(sseLogCount >= 3, "Expected at least 3 SSE field logs, got $sseLogCount")
    }

    @Test
    fun throwsOnNon2xxStreamResponse() {
      val client = createClient()

      val ex =
          assertThrows(RuntimeException::class.java) {
            client.httpPostStreaming("/v1/stream-error", """{}""", {}, port = serverPort)
          }

      assertTrue(ex.message!!.contains("502"))
    }

    @Test
    fun throwsOnConnectionRefusedStreaming() {
      val client = createClient(1)

      assertThrows(Exception::class.java) {
        client.httpPostStreaming("/v1/test", """{}""", {}, port = 1)
      }
    }
  }

  // endregion
}
