package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for [jsonEscape] and JSON data classes in JsonUtil.kt. */
class JsonUtilTest {

  @Nested
  inner class JsonEscapeTest {

    @Test
    fun escapesBackslash() {
      assertEquals("\\\\", jsonEscape("\\"))
    }

    @Test
    fun escapesDoubleQuotes() {
      assertEquals("\\\"", jsonEscape("\""))
    }

    @Test
    fun escapesNewline() {
      assertEquals("\\n", jsonEscape("\n"))
    }

    @Test
    fun escapesCarriageReturn() {
      assertEquals("\\r", jsonEscape("\r"))
    }

    @Test
    fun escapesTab() {
      assertEquals("\\t", jsonEscape("\t"))
    }

    @Test
    fun escapesControlCharacters() {
      // Null char (0x00) should be escaped as \u0000
      assertEquals("\\u0000", jsonEscape("\u0000"))
      // Bell (0x07) should be escaped as \u0007
      assertEquals("\\u0007", jsonEscape("\u0007"))
      // Form feed (0x0C) should be escaped as \u000c
      assertEquals("\\u000c", jsonEscape("\u000C"))
    }

    @Test
    fun leavesNormalTextUnchanged() {
      assertEquals("Hello, world!", jsonEscape("Hello, world!"))
    }

    @Test
    fun handlesEmptyString() {
      assertEquals("", jsonEscape(""))
    }

    @Test
    fun handlesMixedContent() {
      val input = "He said \"hello\"\nand\\then\tleft"
      val expected = "He said \\\"hello\\\"\\nand\\\\then\\tleft"
      assertEquals(expected, jsonEscape(input))
    }

    @Test
    fun handlesUnicodeCharacters() {
      // Non-ASCII should pass through unchanged
      assertEquals("日本語テスト", jsonEscape("日本語テスト"))
      assertEquals("Ünïcödé", jsonEscape("Ünïcödé"))
    }

    @Test
    fun handlesMultipleControlCharsInSequence() {
      assertEquals("\\u0001\\u0002\\u0003", jsonEscape("\u0001\u0002\u0003"))
    }

    @Test
    fun handlesAllEscapableCharsInOneString() {
      val input = "\\\"\n\r\t"
      val expected = "\\\\\\\"\\n\\r\\t"
      assertEquals(expected, jsonEscape(input))
    }
  }

  @Nested
  inner class DataClassTests {

    @Test
    fun errorResponseSerializesCorrectly() {
      val error = ErrorResponse("something failed")
      assertEquals("something failed", error.error)
      assertNull(error.retryAfter)
    }

    @Test
    fun errorResponseWithRetryAfter() {
      val error = ErrorResponse("rate limited", retryAfter = 30)
      assertEquals("rate limited", error.error)
      assertEquals(30, error.retryAfter)
    }

    @Test
    fun streamIdResponseHoldsId() {
      val resp = StreamIdResponse("abc-123")
      assertEquals("abc-123", resp.streamId)
    }

    @Test
    fun healthCheckResponseDefaults() {
      val resp = HealthCheckResponse()
      assertNull(resp.status)
      assertNull(resp.model)
      assertNull(resp.thinkingModel)
      assertNull(resp.pendingThinkingModel)
      assertNull(resp.error)
      assertNull(resp.queueBadge)
    }

    @Test
    fun healthCheckResponseWithValues() {
      val resp =
          HealthCheckResponse(
              status = "ok",
              model = "llama3",
              thinkingModel = "deepseek",
              pendingThinkingModel = true,
              error = null,
              queueBadge = false)
      assertEquals("ok", resp.status)
      assertEquals("llama3", resp.model)
      assertEquals("deepseek", resp.thinkingModel)
      assertTrue(resp.pendingThinkingModel!!)
      assertFalse(resp.queueBadge!!)
    }

    @Test
    fun i18nLabelsHoldsAllFields() {
      val labels =
          I18nLabels(
              reasoningLabel = "Reasoning",
              showReasoningLabel = "Show reasoning",
              showSourcesLabel = "Show sources",
              searchingLabel = "Searching",
              searchingLabelNoQuery = "Searching...",
              readingLabel = "Reading",
              readingLabelNoUrl = "Reading page...",
              sendingMailLabel = "Sending",
              sendingMailLabelNoRecipient = "Sending email...",
              thinkingLabel = "Thinking",
              copyResponseLabel = "Response",
              copyReasoningLabel = "Reasoning")
      assertEquals("Reasoning", labels.reasoningLabel)
      assertEquals("Thinking", labels.thinkingLabel)
    }

    @Test
    fun uncertainTokenHoldsFields() {
      val token = UncertainToken(t = "maybe", lp = -2.5, o = 42)
      assertEquals("maybe", token.t)
      assertEquals(-2.5, token.lp)
      assertEquals(42, token.o)
    }

    @Test
    fun confidenceDataWithOptionalRepetition() {
      val data =
          ConfidenceData(
              mean = 0.85,
              uncertainTokens = listOf(UncertainToken("a", -1.0, 1)),
              logprobRepetition = true)
      assertEquals(0.85, data.mean)
      assertEquals(1, data.uncertainTokens.size)
      assertTrue(data.logprobRepetition!!)
    }

    @Test
    fun confidenceDataWithoutRepetition() {
      val data = ConfidenceData(mean = null, uncertainTokens = emptyList())
      assertNull(data.mean)
      assertTrue(data.uncertainTokens.isEmpty())
      assertNull(data.logprobRepetition)
    }

    @Test
    fun streamPollResponseMinimal() {
      val resp = StreamPollResponse(text = "Hello", done = false)
      assertEquals("Hello", resp.text)
      assertFalse(resp.done)
      assertNull(resp.error)
      assertNull(resp.searching)
      assertNull(resp.confidence)
      assertNull(resp.queuePosition)
    }

    @Test
    fun streamPollResponseFull() {
      val resp =
          StreamPollResponse(
              text = "Answer",
              done = true,
              error = null,
              resourceStatus = "ok",
              searching = true,
              searchQuery = "weather",
              fetching = false,
              fetchUrl = null,
              sendingMail = false,
              mailRecipient = null,
              thinking = "deep thought",
              modelType = "llama3",
              confidence = ConfidenceData(0.9, emptyList()),
              queuePosition = 3,
              queueBadge = true,
              estimatedWaitMs = 5000L,
              autoMailSent = false,
              autoMailError = null)
      assertTrue(resp.done)
      assertEquals("Answer", resp.text)
      assertEquals("weather", resp.searchQuery)
      assertEquals(3, resp.queuePosition)
      assertEquals(5000L, resp.estimatedWaitMs)
    }
  }

  @Nested
  inner class GsonInstanceTests {

    @Test
    fun gsonWithNullsSerializesNullFields() {
      val json = gsonWithNulls.toJson(ErrorResponse("fail", retryAfter = null))
      assertTrue(json.contains("\"retryAfter\":null"))
    }

    @Test
    fun gsonCompactOmitsNullFields() {
      val json = gsonCompact.toJson(ErrorResponse("fail", retryAfter = null))
      assertFalse(json.contains("retryAfter"))
    }

    @Test
    fun gsonRoundTripPreservesData() {
      val original = StreamIdResponse("test-id-456")
      val json = gsonCompact.toJson(original)
      val deserialized = gsonCompact.fromJson(json, StreamIdResponse::class.java)
      assertEquals(original, deserialized)
    }

    @Test
    fun gsonSerializesConfidenceDataCorrectly() {
      val data =
          ConfidenceData(
              mean = 0.75,
              uncertainTokens =
                  listOf(UncertainToken("word1", -1.5, 10), UncertainToken("word2", -3.0, 20)),
              logprobRepetition = false)
      val json = gsonCompact.toJson(data)
      assertTrue(json.contains("\"mean\":0.75"))
      assertTrue(json.contains("\"word1\""))
      assertTrue(json.contains("\"word2\""))
    }
  }
}
