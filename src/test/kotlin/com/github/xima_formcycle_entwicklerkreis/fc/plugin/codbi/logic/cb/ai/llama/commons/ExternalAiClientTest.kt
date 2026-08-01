package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.sun.net.httpserver.HttpServer
import java.net.InetSocketAddress
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance

/** Tests for [ExternalAiClient] — model injection, sync POST, streaming POST, and retry logic. */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ExternalAiClientTest {

  private val logMessages = mutableListOf<Pair<LogLevel, String>>()

  private lateinit var server: HttpServer
  private var serverPort: Int = 0

  @BeforeAll
  fun startServer() {
    server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
    serverPort = server.address.port

    // 200 OK with JSON body
    server.createContext("/v1/completions") { exchange ->
      val reqBody = exchange.requestBody.bufferedReader().readText()
      val authHeader = exchange.requestHeaders.getFirst("Authorization")
      val resp = """{"result":"ok","auth":"$authHeader","echo":${reqBody.length}}"""
      val bytes = resp.toByteArray(Charsets.UTF_8)
      exchange.sendResponseHeaders(200, bytes.size.toLong())
      exchange.responseBody.use { it.write(bytes) }
    }

    // 500 error
    server.createContext("/v1/fail") { exchange ->
      exchange.requestBody.bufferedReader().readText()
      val body = """{"error":"server error"}"""
      val bytes = body.toByteArray(Charsets.UTF_8)
      exchange.sendResponseHeaders(500, bytes.size.toLong())
      exchange.responseBody.use { it.write(bytes) }
    }

    // SSE streaming
    server.createContext("/v1/stream") { exchange ->
      exchange.requestBody.bufferedReader().readText()
      exchange.sendResponseHeaders(200, 0)
      exchange.responseBody.use { out ->
        out.write("data: {\"delta\":\"A\"}\n\n".toByteArray())
        out.write("data: {\"delta\":\"B\"}\n\n".toByteArray())
        out.write("data: [DONE]\n\n".toByteArray())
        out.flush()
      }
    }

    // SSE with unexpected fields
    server.createContext("/v1/stream-extra") { exchange ->
      exchange.requestBody.bufferedReader().readText()
      exchange.sendResponseHeaders(200, 0)
      exchange.responseBody.use { out ->
        out.write("event: update\n".toByteArray())
        out.write("id: 42\n".toByteArray())
        out.write("retry: 5000\n".toByteArray())
        out.write("data: {\"delta\":\"X\"}\n\n".toByteArray())
        out.write("data: [DONE]\n\n".toByteArray())
        out.flush()
      }
    }

    server.executor = null
    server.start()
  }

  @AfterAll
  fun stopServer() {
    server.stop(0)
  }

  @BeforeEach
  fun setUp() {
    logMessages.clear()
  }

  // region injectModelField

  @Nested
  inner class InjectModelFieldTest {

    @Test
    fun injectsModelIntoValidJson() {
      val client = createClient(model = "gpt-4o")
      val body = """{"messages":[],"max_tokens":100}"""

      val result = client.injectModelField(body)

      assertTrue(result.contains("\"model\""))
      assertTrue(result.contains("gpt-4o"))
      assertTrue(result.contains("\"messages\""))
      assertTrue(result.contains("\"max_tokens\""))
    }

    @Test
    fun returnsUnchangedWhenNoModel() {
      val client = createClient(model = null)
      val body = """{"messages":[],"max_tokens":100}"""

      val result = client.injectModelField(body)

      assertEquals(body, result)
    }

    @Test
    fun overridesExistingModelField() {
      val client = createClient(model = "gpt-4o")
      val body = """{"model":"old-model","messages":[]}"""

      val result = client.injectModelField(body)

      assertTrue(result.contains("gpt-4o"))
      // Gson addProperty overwrites existing key
      val parsed = com.google.gson.JsonParser.parseString(result).asJsonObject
      assertEquals("gpt-4o", parsed.get("model").asString)
    }

    @Test
    fun returnsOriginalOnInvalidJson() {
      val client = createClient(model = "gpt-4o")
      val body = "not-json"

      val result = client.injectModelField(body)

      assertEquals("not-json", result)
      assertTrue(logMessages.any { it.second.contains("Failed to inject model field") })
    }

    @Test
    fun handlesEmptyJsonObject() {
      val client = createClient(model = "claude-3")
      val body = "{}"

      val result = client.injectModelField(body)

      val parsed = com.google.gson.JsonParser.parseString(result).asJsonObject
      assertEquals("claude-3", parsed.get("model").asString)
    }

    @Test
    fun preservesAllExistingFields() {
      val client = createClient(model = "llama-3")
      val body = """{"messages":[],"max_tokens":500,"temperature":0.7,"stream":true}"""

      val result = client.injectModelField(body)
      val parsed = com.google.gson.JsonParser.parseString(result).asJsonObject

      assertEquals("llama-3", parsed.get("model").asString)
      assertEquals(500, parsed.get("max_tokens").asInt)
      assertEquals(0.7, parsed.get("temperature").asDouble, 0.001)
      assertTrue(parsed.get("stream").asBoolean)
    }

    @Test
    fun handlesModelWithSpecialCharacters() {
      val client = createClient(model = "org/model-v2.1:latest")

      val result = client.injectModelField("{}")
      val parsed = com.google.gson.JsonParser.parseString(result).asJsonObject

      assertEquals("org/model-v2.1:latest", parsed.get("model").asString)
    }

    @Test
    fun handlesEmptyModelString() {
      val client = createClient(model = "")

      val result = client.injectModelField("""{"messages":[]}""")
      val parsed = com.google.gson.JsonParser.parseString(result).asJsonObject

      assertEquals("", parsed.get("model").asString)
    }
  }

  // endregion

  // region Constructor & Constants

  @Nested
  inner class ConstructorTest {

    @Test
    fun acceptsNullApiKey() {
      val client = createClient(apiKey = null)

      assertNotNull(client)
    }

    @Test
    fun acceptsNullModel() {
      val client = createClient(model = null)

      assertNotNull(client)
    }

    @Test
    fun acceptsBothNull() {
      val client = createClient(apiKey = null, model = null)

      assertNotNull(client)
    }
  }

  // endregion

  // region post (sync HTTP)

  @Nested
  inner class PostTest {

    @Test
    fun returnsResponseBodyOn200() {
      val client = createClient(baseUrl = "http://127.0.0.1:$serverPort")
      val result = client.post("/v1/completions", """{"prompt":"test"}""")

      assertTrue(result.contains("\"result\":\"ok\""))
    }

    @Test
    fun sendsAuthorizationHeader() {
      val client = createClient(baseUrl = "http://127.0.0.1:$serverPort", apiKey = "sk-abc123")
      val result = client.post("/v1/completions", """{}""")

      assertTrue(result.contains("Bearer sk-abc123"))
    }

    @Test
    fun noAuthHeaderWhenApiKeyNull() {
      val client = createClient(baseUrl = "http://127.0.0.1:$serverPort", apiKey = null)
      val result = client.post("/v1/completions", """{}""")

      assertTrue(result.contains("\"auth\":\"null\""))
    }

    @Test
    fun throwsOnNon2xxResponse() {
      val client = createClient(baseUrl = "http://127.0.0.1:$serverPort")

      val ex = assertThrows(RuntimeException::class.java) { client.post("/v1/fail", """{}""") }

      assertTrue(ex.message!!.contains("500"))
    }

    @Test
    fun throwsOnUnreachableHost() {
      val client = createClient(baseUrl = "http://127.0.0.1:1")

      // Should fail with connection refused or timeout — and retry once
      assertThrows(Exception::class.java) { client.post("/v1/test", """{}""", timeoutMs = 2000) }
    }
  }

  // endregion

  // region postStreaming (SSE HTTP)

  @Nested
  inner class PostStreamingTest {

    @Test
    fun streamsMultipleChunks() {
      val client = createClient(baseUrl = "http://127.0.0.1:$serverPort")
      val chunks = mutableListOf<String>()

      client.postStreaming("/v1/stream", """{"stream":true}""", { chunks.add(it) })

      assertEquals(2, chunks.size)
      assertTrue(chunks[0].contains("\"delta\":\"A\""))
      assertTrue(chunks[1].contains("\"delta\":\"B\""))
    }

    @Test
    fun doesNotForwardDoneMarker() {
      val client = createClient(baseUrl = "http://127.0.0.1:$serverPort")
      val chunks = mutableListOf<String>()

      client.postStreaming("/v1/stream", """{}""", { chunks.add(it) })

      assertFalse(chunks.any { it.contains("[DONE]") })
    }

    @Test
    fun abortsWhenShouldStopTrue() {
      val client = createClient(baseUrl = "http://127.0.0.1:$serverPort")
      val chunks = mutableListOf<String>()

      client.postStreaming(
          "/v1/stream", """{}""", { chunks.add(it) }, shouldStop = { chunks.size >= 1 })

      assertTrue(chunks.size <= 2)
    }

    @Test
    fun logsUnexpectedSseFields() {
      val client = createClient(baseUrl = "http://127.0.0.1:$serverPort")
      val chunks = mutableListOf<String>()

      client.postStreaming("/v1/stream-extra", """{}""", { chunks.add(it) })

      val sseLogCount = logMessages.count { it.second.contains("SSE field received") }
      assertTrue(sseLogCount >= 3, "Expected 3+ SSE field logs, got $sseLogCount")
    }

    @Test
    fun throwsOnNon2xxStreamResponse() {
      val client = createClient(baseUrl = "http://127.0.0.1:$serverPort")

      val ex =
          assertThrows(RuntimeException::class.java) {
            client.postStreaming("/v1/fail", """{}""", {})
          }

      assertTrue(ex.message!!.contains("500"))
    }
  }

  // endregion

  // region retryOnTransientFailure

  @Nested
  inner class RetryTest {

    @Test
    fun retriesOnConnectionRefused() {
      val client = createClient(baseUrl = "http://127.0.0.1:1")

      // Should log a retry warning before the second failure
      assertThrows(Exception::class.java) { client.post("/v1/test", """{}""", timeoutMs = 2000) }

      assertTrue(logMessages.any { it.second.contains("retrying") })
    }
  }

  // endregion

  // region Helper

  private fun createClient(
      baseUrl: String = "http://localhost:8080",
      apiKey: String? = "test-key",
      model: String? = null
  ): ExternalAiClient {
    return ExternalAiClient(
        baseUrl, apiKey, model, log = { level, msg -> logMessages.add(level to msg) })
  }

  // endregion
}
