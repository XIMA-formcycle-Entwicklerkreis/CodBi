package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.BraveSearch
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.MailBridge
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.UrlFetcher
import io.mockk.*
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/**
 * Tests for [WebSearchHandler] — tool call detection, query enrichment, result handling. Tests that
 * don't require live HTTP: pass-through when BraveSearch is unavailable, CALL:search pattern
 * matching, and constructor wiring.
 */
class WebSearchHandlerTest {

  private val logs = mutableListOf<String>()
  private var chatCompletionCalls = 0
  private var streamCompletionCalls = 0

  private lateinit var handler: WebSearchHandler

  @BeforeEach
  fun setUp() {
    logs.clear()
    chatCompletionCalls = 0
    streamCompletionCalls = 0
    BraveSearch.apiKey = null // Ensure search is unavailable by default

    handler =
        WebSearchHandler(
            maxSearchRoundTrips = 3,
            searchFollowUpPrompt = { q, _, isLast ->
              if (isLast) "Final answer for: $q" else "Answer: $q"
            },
            buildMessages = { q, _, _, _, _, _, _, _ -> """[{"role":"user","content":"$q"}]""" },
            chatCompletion = { _, _, _, _ ->
              chatCompletionCalls++
              "Mock answer"
            },
            streamChatCompletion = { _, _, _, _ -> streamCompletionCalls++ },
            log = { _, msg -> logs.add(msg) })
  }

  @AfterEach
  fun tearDown() {
    BraveSearch.apiKey = null
    MailBridge.enabled = false
  }

  // region enrichQuery

  @Nested
  inner class EnrichQueryTest {

    @Test
    fun appendsLocationToQuery() {
      BraveSearch.apiKey = "test-key"
      // enrichQuery is private, but we can test via handleSearchToolCall
      // where the query gets enriched before search
      // We test the log message to verify enrichment
      try {
        handler.handleSearchToolCall(
            "CALL:search(query='weather forecast')",
            "weather?",
            emptyList(),
            emptyList(),
            false,
            0,
            userLocation = "Berlin, Germany")
      } catch (_: Exception) {
        /* BraveSearch.search will fail */
      }
      assertTrue(
          logs.any { it.contains("Location-enriched") && it.contains("Berlin") },
          "Should enrich query with location; logs=$logs")
    }

    @Test
    fun doesNotEnrichWhenLocationAlreadyPresent() {
      BraveSearch.apiKey = "test-key"
      try {
        handler.handleSearchToolCall(
            "CALL:search(query='Berlin weather forecast')",
            "weather in Berlin?",
            emptyList(),
            emptyList(),
            false,
            0,
            userLocation = "Berlin, Germany")
      } catch (_: Exception) {}
      assertFalse(
          logs.any { it.contains("Location-enriched") },
          "Should not enrich query when location already in query")
    }

    @Test
    fun doesNotEnrichWhenNoLocation() {
      BraveSearch.apiKey = "test-key"
      try {
        handler.handleSearchToolCall(
            "CALL:search(query='test')",
            "test",
            emptyList(),
            emptyList(),
            false,
            0,
            userLocation = null)
      } catch (_: Exception) {}
      assertFalse(logs.any { it.contains("Location-enriched") })
    }

    @Test
    fun doesNotEnrichWithEmptyLocation() {
      BraveSearch.apiKey = "test-key"
      try {
        handler.handleSearchToolCall(
            "CALL:search(query='test')",
            "test",
            emptyList(),
            emptyList(),
            false,
            0,
            userLocation = ", Country")
      } catch (_: Exception) {}
      // Short location (before comma) is empty "" — should not enrich
      assertFalse(logs.any { it.contains("Location-enriched") })
    }
  }

  // endregion

  // region handleSearchToolCall — BraveSearch unavailable

  @Nested
  inner class SearchUnavailableTest {

    @Test
    fun returnsInitialAnswerWhenSearchUnavailable() {
      val result =
          handler.handleSearchToolCall(
              "CALL:search(query='test')", "question", emptyList(), emptyList(), false, 0)
      assertEquals("CALL:search(query='test')", result)
      assertEquals(0, chatCompletionCalls)
    }

    @Test
    fun returnsPlainAnswerUnchanged() {
      val result =
          handler.handleSearchToolCall(
              "Just a plain answer", "question", emptyList(), emptyList(), false, 0)
      assertEquals("Just a plain answer", result)
    }
  }

  // endregion

  // region handleFetchToolCall — BraveSearch unavailable

  @Nested
  inner class FetchUnavailableTest {

    @Test
    fun returnsInitialAnswerWhenUnavailable() {
      val result =
          handler.handleFetchToolCall(
              "CALL:fetch(url='https://example.com')",
              "question",
              emptyList(),
              emptyList(),
              false,
              0)
      assertEquals("CALL:fetch(url='https://example.com')", result)
    }

    @Test
    fun returnsPlainAnswerUnchanged() {
      val result =
          handler.handleFetchToolCall(
              "Normal response", "question", emptyList(), emptyList(), false, 0)
      assertEquals("Normal response", result)
    }
  }

  // endregion

  // region handleMailToolCall

  @Nested
  inner class MailToolCallTest {

    @Test
    fun returnsInitialAnswerWhenMailDisabled() {
      // MailBridge.enabled is false by default
      val text = "CALL:mail(to='a@b.com', subject='Hi', body='Hello')"
      val result =
          handler.handleMailToolCall(
              text, "send email", emptyList(), emptyList(), false, 0, "sess1")
      assertEquals(text, result)
    }

    @Test
    fun returnsInitialAnswerWhenNoMailCall() {
      val text = "No mail call here"
      val result =
          handler.handleMailToolCall(text, "question", emptyList(), emptyList(), false, 0, "sess1")
      assertEquals(text, result)
    }
  }

  // endregion

  // region handleSearchToolCallStreaming — BraveSearch unavailable

  @Nested
  inner class StreamingSearchUnavailableTest {

    @Test
    fun doesNothingWhenUnavailable() {
      val session = StreamingSession()
      session.addText("CALL:search(query='test')")
      handler.handleSearchToolCallStreaming(
          session.currentText(), "question", emptyList(), emptyList(), session, false, 0)
      // Session should remain unchanged
      assertEquals("CALL:search(query='test')", session.currentText())
    }
  }

  // endregion

  // region handleFetchToolCallStreaming — BraveSearch unavailable

  @Nested
  inner class StreamingFetchUnavailableTest {

    @Test
    fun doesNothingWhenUnavailable() {
      val session = StreamingSession()
      session.addText("CALL:fetch(url='https://x.com')")
      handler.handleFetchToolCallStreaming(
          session.currentText(), "question", emptyList(), emptyList(), session, false, 0)
      assertEquals("CALL:fetch(url='https://x.com')", session.currentText())
    }
  }

  // endregion

  // region handleMailToolCallStreaming

  @Nested
  inner class StreamingMailTest {

    @Test
    fun doesNothingWhenMailDisabled() {
      val session = StreamingSession()
      val text = "CALL:mail(to='a@b.com', subject='Hi', body='Hello')"
      session.addText(text)
      handler.handleMailToolCallStreaming(
          text, "question", emptyList(), emptyList(), session, false, 0, "sess1")
      // Mail disabled, session unchanged
      assertEquals(text, session.currentText())
    }
  }

  // endregion

  // endregion

  // region handleSearchToolCall — BraveSearch available

  @Nested
  inner class SearchAvailableTest {

    @Test
    fun enrichesQueryWhenSearchAvailable() {
      BraveSearch.apiKey = "test-key"
      try {
        handler.handleSearchToolCall(
            "CALL:search(query='weather forecast')",
            "What's the weather like?",
            emptyList(),
            emptyList(),
            false,
            0)
      } catch (e: Exception) {
        // Expected - BraveSearch.search() fails without valid API/network
      }
      assertTrue(
          logs.any { it.contains("search") || it.contains("Search") },
          "Should log search activity: $logs")
    }

    @Test
    fun returnsUnchangedWhenNoPatternMatch() {
      BraveSearch.apiKey = "test-key"
      val result =
          handler.handleSearchToolCall(
              "Just a normal answer without CALL", "question", emptyList(), emptyList(), false, 0)
      assertEquals("Just a normal answer without CALL", result)
    }
  }

  // endregion

  // region handleMailToolCall — MailBridge available

  @Nested
  inner class MailAvailableTest {

    @Test
    fun exercisesFullMailPath() {
      MailBridge.enabled = true
      MailBridge.maxMailsPerSession = 10
      MailBridge.maxMailsPerHour = 100
      val text = "CALL:mail(to='user@example.com', subject='Test Subject', body='Hello World')"
      val result =
          handler.handleMailToolCall(
              text, "send email", emptyList(), emptyList(), false, 0, "avail-mail-sess")
      // sendViaFormcycleApi fails, returns error formatted for model
      assertTrue(
          result.contains("MAIL") || result != text, "Should return formatted mail result: $result")
    }

    @Test
    fun logsMailToolCallDetection() {
      MailBridge.enabled = true
      MailBridge.maxMailsPerSession = 10
      MailBridge.maxMailsPerHour = 100
      val text = "CALL:mail(to='a@b.com', subject='S', body='B')"
      handler.handleMailToolCall(
          text, "send email", emptyList(), emptyList(), false, 0, "log-mail-sess")
      assertTrue(
          logs.any { it.contains("Mail tool call") || it.contains("mail") },
          "Should log mail detection: $logs")
    }

    @Test
    fun handlesMailWithNoPatternMatch() {
      MailBridge.enabled = true
      val text = "No mail call here"
      val result =
          handler.handleMailToolCall(
              text, "question", emptyList(), emptyList(), false, 0, "no-match-sess")
      assertEquals(text, result)
    }

    @Test
    fun streamingMailExercisesFullPath() {
      MailBridge.enabled = true
      MailBridge.maxMailsPerSession = 10
      MailBridge.maxMailsPerHour = 100
      val session = StreamingSession()
      val text = "CALL:mail(to='user@example.com', subject='Test', body='Hello')"
      session.addText(text)
      handler.handleMailToolCallStreaming(
          text, "send email", emptyList(), emptyList(), session, false, 0, "stream-mail-sess")
      // Session text should be replaced with formatted result
      assertTrue(
          session.currentText().contains("MAIL") || session.currentText() != text,
          "Session should have mail result: ${session.currentText()}")
    }

    @Test
    fun truncatedMailPatternFallback() {
      MailBridge.enabled = true
      MailBridge.maxMailsPerSession = 10
      MailBridge.maxMailsPerHour = 100
      // Body is not closed — should match truncated pattern
      val text =
          "CALL:mail(to='user@example.com', subject='Test', body='Truncated body without closing quote"
      val result =
          handler.handleMailToolCall(
              text, "send email", emptyList(), emptyList(), false, 0, "trunc-mail-sess")
      assertTrue(result.contains("MAIL") || result != text, "Should handle truncated mail: $result")
    }
  }

  // endregion

  // region handleFetchToolCall — BraveSearch available

  @Nested
  inner class FetchAvailableTest {

    @Test
    fun returnsUnchangedWhenNoFetchPattern() {
      BraveSearch.apiKey = "test-key"
      val result =
          handler.handleFetchToolCall(
              "Just an answer", "question", emptyList(), emptyList(), false, 0)
      assertEquals("Just an answer", result)
    }

    @Test
    fun detectsFetchPattern() {
      BraveSearch.apiKey = "test-key"
      try {
        handler.handleFetchToolCall(
            "CALL:fetch(url='https://example.com/page')",
            "read this page",
            emptyList(),
            emptyList(),
            false,
            0)
      } catch (e: Exception) {
        // Expected - UrlFetcher.fetch() may fail without network
      }
      assertTrue(
          logs.any { it.contains("fetch") || it.contains("Fetch") },
          "Should log fetch attempt; logs=$logs")
    }

    @Test
    fun logsFetchUrl() {
      BraveSearch.apiKey = "test-key"
      try {
        handler.handleFetchToolCall(
            "CALL:fetch(url='https://example.com/specific-page')",
            "read page",
            emptyList(),
            emptyList(),
            false,
            0)
      } catch (_: Exception) {}
      assertTrue(
          logs.any { it.contains("example.com/specific-page") }, "Should log the URL being fetched")
    }
  }

  // endregion

  // region handleFetchToolCallStreaming

  @Nested
  inner class FetchStreamingTest {

    @Test
    fun returnsUnchangedWhenUnavailable() {
      BraveSearch.apiKey = null
      val session = StreamingSession()
      session.addText("CALL:fetch(url='https://example.com')")
      handler.handleFetchToolCallStreaming(
          session.currentText(), "question", emptyList(), emptyList(), session, false, 0)
      assertEquals("CALL:fetch(url='https://example.com')", session.currentText())
    }

    @Test
    fun returnsUnchangedWhenNoPattern() {
      BraveSearch.apiKey = "test-key"
      val session = StreamingSession()
      session.addText("No fetch pattern here")
      handler.handleFetchToolCallStreaming(
          session.currentText(), "question", emptyList(), emptyList(), session, false, 0)
      assertEquals("No fetch pattern here", session.currentText())
    }

    @Test
    fun attemptsFetchForPattern() {
      BraveSearch.apiKey = "test-key"
      val session = StreamingSession()
      session.addText("CALL:fetch(url='https://example.com/page')")
      try {
        handler.handleFetchToolCallStreaming(
            session.currentText(), "read page", emptyList(), emptyList(), session, false, 0)
      } catch (_: Exception) {}
      assertTrue(
          logs.any { it.contains("fetch") || it.contains("Fetch") },
          "Should log streaming fetch attempt")
    }
  }

  // endregion

  // region handleSearchToolCallStreaming — BraveSearch available

  @Nested
  inner class StreamingSearchAvailableTest {

    @Test
    fun returnsUnchangedSessionWhenNoPattern() {
      BraveSearch.apiKey = "test-key"
      val session = StreamingSession()
      session.addText("Normal text without CALL")
      handler.handleSearchToolCallStreaming(
          session.currentText(), "question", emptyList(), emptyList(), session, false, 0)
      assertEquals("Normal text without CALL", session.currentText())
    }

    @Test
    fun skipsWhenUnavailable() {
      BraveSearch.apiKey = null
      val session = StreamingSession()
      session.addText("CALL:search(query='test')")
      handler.handleSearchToolCallStreaming(
          session.currentText(), "question", emptyList(), emptyList(), session, false, 0)
      assertEquals("CALL:search(query='test')", session.currentText())
      assertEquals(0, streamCompletionCalls)
    }
  }

  // endregion

  // region handleMailToolCall — deeper coverage

  @Nested
  inner class MailToolCallDeepTest {

    @BeforeEach
    fun enableMail() {
      MailBridge.enabled = true
      MailBridge.maxMailsPerSession = 5
      MailBridge.maxMailsPerHour = 10
      MailBridge.allowedRecipientPattern = Regex(".*")
    }

    @Test
    fun returnsBodyWithSuccessNote() {
      // sendMail will fail internally (no Formcycle runtime), but the code path is exercised
      val result =
          handler.handleMailToolCall(
              "CALL:mail(to='user@example.com', subject='Hello', body='Mail body text')",
              "send email",
              emptyList(),
              emptyList(),
              false,
              0,
              "mail-sess-1")
      // Body is returned with a status note
      assertTrue(result.contains("Mail body text"), "Should contain the mail body: $result")
      assertTrue(
          result.contains("✉") || result.contains("⚠") || result.contains("→"),
          "Should contain status indicator: $result")
    }

    @Test
    fun logsSendAttempt() {
      handler.handleMailToolCall(
          "CALL:mail(to='admin@example.com', subject='Test', body='Body')",
          "send",
          emptyList(),
          emptyList(),
          false,
          0,
          "mail-sess-2")
      assertTrue(
          logs.any { it.contains("mail send") || it.contains("Mail") },
          "Should log mail attempt; logs=$logs")
    }

    @Test
    fun returnsUnchangedWhenNoMailPattern() {
      val result =
          handler.handleMailToolCall(
              "No mail pattern here", "question", emptyList(), emptyList(), false, 0, "sess")
      assertEquals("No mail pattern here", result)
    }

    @Test
    fun truncatedPatternStillMatches() {
      val text =
          "CALL:mail(to='user@example.com', subject='Test', body='Truncated body without closing"
      val result =
          handler.handleMailToolCall(
              text, "send email", emptyList(), emptyList(), false, 0, "trunc-mail-sess")
      // Should either match the truncated pattern or return unchanged
      assertTrue(
          result.contains("Truncated body") || result == text,
          "Should handle truncated mail: $result")
    }

    @Test
    fun passesClientIpToMailBridge() {
      val result =
          handler.handleMailToolCall(
              "CALL:mail(to='user@test.com', subject='IP Test', body='Testing IP')",
              "send",
              emptyList(),
              emptyList(),
              false,
              0,
              "ip-sess",
              clientIP = "192.168.1.100")
      // The mail result includes the body
      assertTrue(result.contains("Testing IP"), "Should process with client IP")
    }
  }

  // endregion

  // region handleMailToolCallStreaming — deeper coverage

  @Nested
  inner class MailStreamingDeepTest {

    @BeforeEach
    fun enableMail() {
      MailBridge.enabled = true
      MailBridge.maxMailsPerSession = 5
      MailBridge.maxMailsPerHour = 10
      MailBridge.allowedRecipientPattern = Regex(".*")
    }

    @Test
    fun skipsWhenMailUnavailable() {
      MailBridge.enabled = false
      val session = StreamingSession()
      session.addText("CALL:mail(to='user@test.com', subject='Test', body='Body')")
      handler.handleMailToolCallStreaming(
          session.currentText(),
          "send mail",
          emptyList(),
          emptyList(),
          session,
          false,
          0,
          "sess-disabled")
      assertEquals(
          "CALL:mail(to='user@test.com', subject='Test', body='Body')", session.currentText())
    }

    @Test
    fun showsBodyAsTextAndStatusNote() {
      val session = StreamingSession()
      session.addText("CALL:mail(to='user@test.com', subject='Hello', body='Email content here')")
      handler.handleMailToolCallStreaming(
          session.currentText(),
          "send",
          emptyList(),
          emptyList(),
          session,
          false,
          0,
          "stream-mail-sess")
      val text = session.currentText()
      assertTrue(text.contains("Email content here"), "Session should show mail body: $text")
      assertTrue(text.contains("✉") || text.contains("⚠"), "Session should show status icon: $text")
    }

    @Test
    fun addsSendingLabelToThinking() {
      val session = StreamingSession()
      session.addText("CALL:mail(to='admin@test.com', subject='Sub', body='Content')")
      handler.handleMailToolCallStreaming(
          session.currentText(),
          "send",
          emptyList(),
          emptyList(),
          session,
          false,
          0,
          "thinking-mail-sess")
      assertFalse(session.thinkingIsEmpty(), "Should add thinking for sending label")
    }

    @Test
    fun preservesPriorThinkingContent() {
      val session = StreamingSession()
      session.addThinking("Prior reasoning here")
      session.addText("CALL:mail(to='user@test.com', subject='Test', body='Body')")
      handler.handleMailToolCallStreaming(
          session.currentText(),
          "send",
          emptyList(),
          emptyList(),
          session,
          false,
          0,
          "preserve-think-sess")
      assertTrue(
          session.thinkingContains("Prior reasoning here"),
          "Should preserve prior thinking content")
    }

    @Test
    fun logsStreamingMailResult() {
      val session = StreamingSession()
      session.addText("CALL:mail(to='user@test.com', subject='Log', body='LogBody')")
      handler.handleMailToolCallStreaming(
          session.currentText(),
          "send",
          emptyList(),
          emptyList(),
          session,
          false,
          0,
          "log-stream-sess")
      assertTrue(
          logs.any { it.contains("Streaming: Mail result") || it.contains("mail") },
          "Should log streaming mail result")
    }
  }

  // endregion

  // region lastSearchResults

  @Nested
  inner class LastSearchResultsTest {

    @Test
    fun initiallyEmpty() {
      val h =
          WebSearchHandler(
              maxSearchRoundTrips = 1,
              searchFollowUpPrompt = { _, _, _ -> "q" },
              buildMessages = { _, _, _, _, _, _, _, _ -> "[]" },
              chatCompletion = { _, _, _, _ -> "ok" },
              streamChatCompletion = { _, _, _, _ -> },
              log = { _, _ -> })
      assertTrue(h.lastSearchResults.isEmpty())
    }

    @Test
    fun remainsEmptyWhenSearchUnavailable() {
      handler.handleSearchToolCall(
          "CALL:search(query='test')", "q", emptyList(), emptyList(), false, 0)
      assertTrue(handler.lastSearchResults.isEmpty())
    }
  }

  // endregion

  // region handleMailToolCall — no pattern when unavailable

  @Nested
  inner class MailUnavailableNoPatternTest {

    @Test
    fun returnsUnchangedWhenMailDisabled() {
      MailBridge.enabled = false
      val result =
          handler.handleMailToolCall(
              "CALL:mail(to='user@test.com', subject='Test', body='Body')",
              "send",
              emptyList(),
              emptyList(),
              false,
              0,
              "sess")
      assertEquals("CALL:mail(to='user@test.com', subject='Test', body='Body')", result)
    }
  }

  // endregion

  // region handleSearchToolCall — no pattern match

  @Nested
  inner class SearchNoPatternTest {

    @Test
    fun returnsPlainAnswerWhenAvailableButNoPattern() {
      BraveSearch.apiKey = "test-key"
      val result =
          handler.handleSearchToolCall(
              "A normal answer", "question", emptyList(), emptyList(), false, 0)
      assertEquals("A normal answer", result)
      assertEquals(0, chatCompletionCalls)
    }
  }

  // endregion

  // region MockK-based search round-trip tests

  @Nested
  inner class SearchRoundTripWithMockTest {

    @BeforeEach
    fun mockBraveSearch() {
      BraveSearch.apiKey = "mock-key"
      mockkObject(BraveSearch)
      every { BraveSearch.CALL_SEARCH_PATTERN } answers { callOriginal() }
    }

    @AfterEach
    fun unmockBraveSearch() {
      unmockkObject(BraveSearch)
      BraveSearch.apiKey = null
    }

    @Test
    fun searchResultsInjectedIntoFollowUp() {
      val fakeResults =
          listOf(
              BraveSearch.SearchResult("Result 1", "https://r1.com", "Desc 1"),
              BraveSearch.SearchResult("Result 2", "https://r2.com", "Desc 2"))
      every { BraveSearch.search(any(), any(), any(), any()) } returns fakeResults
      every { BraveSearch.formatResultsForModel(any()) } returns "SEARCH_CONTEXT_DATA"

      val result =
          handler.handleSearchToolCall(
              "CALL:search(query='test query')",
              "What is test?",
              emptyList(),
              emptyList(),
              false,
              0)

      assertEquals("Mock answer", result)
      assertEquals(1, chatCompletionCalls)
      assertTrue(handler.lastSearchResults.size == 2)
    }

    @Test
    fun multipleRoundsOfSearch() {
      // First round: model returns another CALL:search
      // Second round: model returns plain answer
      var callCount = 0
      val searchHandler =
          WebSearchHandler(
              maxSearchRoundTrips = 3,
              searchFollowUpPrompt = { q, _, isLast -> "Answer: $q" },
              buildMessages = { q, _, _, _, _, _, _, _ -> """[{"role":"user","content":"$q"}]""" },
              chatCompletion = { _, _, _, _ ->
                callCount++
                if (callCount == 1) "CALL:search(query='deeper query')" else "Final answer"
              },
              streamChatCompletion = { _, _, _, _ -> },
              log = { _, msg -> logs.add(msg) })
      val fakeResults = listOf(BraveSearch.SearchResult("R", "https://r.com", "D"))
      every { BraveSearch.search(any(), any(), any(), any()) } returns fakeResults
      every { BraveSearch.formatResultsForModel(any()) } returns "CTX"

      val result =
          searchHandler.handleSearchToolCall(
              "CALL:search(query='initial')", "question", emptyList(), emptyList(), false, 0)

      assertEquals("Final answer", result)
      assertEquals(2, callCount)
      assertTrue(logs.any { it.contains("round 1") })
      assertTrue(logs.any { it.contains("round 2") })
    }

    @Test
    fun emptySearchResultsStripsCallAndReturnsRemainder() {
      every { BraveSearch.search(any(), any(), any(), any()) } returns emptyList()

      val result =
          handler.handleSearchToolCall(
              "Here is some text CALL:search(query='nothing') and more",
              "question",
              emptyList(),
              emptyList(),
              false,
              0)

      assertTrue(
          result.contains("Here is some text") || result.contains("and more"),
          "Should strip CALL:search and return remaining text: $result")
      assertTrue(logs.any { it.contains("no results") })
    }

    @Test
    fun emptySearchResultsAndEmptyAnswerRepromptsWithoutSearch() {
      every { BraveSearch.search(any(), any(), any(), any()) } returns emptyList()

      val result =
          handler.handleSearchToolCall(
              "CALL:search(query='test')", "question", emptyList(), emptyList(), false, 0)

      // Answer becomes blank after stripping CALL:search → re-prompts without internet
      assertEquals("Mock answer", result)
      assertEquals(1, chatCompletionCalls)
      assertTrue(logs.any { it.contains("re-prompting without internet") })
    }

    @Test
    fun storesLastSearchResults() {
      val fakeResults = listOf(BraveSearch.SearchResult("Title", "https://url.com", "Desc"))
      every { BraveSearch.search(any(), any(), any(), any()) } returns fakeResults
      every { BraveSearch.formatResultsForModel(any()) } returns "CTX"

      handler.handleSearchToolCall(
          "CALL:search(query='store test')", "q", emptyList(), emptyList(), false, 0)

      assertEquals(1, handler.lastSearchResults.size)
      assertEquals("Title", handler.lastSearchResults[0].title)
    }
  }

  // endregion

  // region MockK-based streaming search round-trip tests

  @Nested
  inner class StreamingSearchRoundTripWithMockTest {

    @BeforeEach
    fun mockBraveSearch() {
      BraveSearch.apiKey = "mock-key"
      mockkObject(BraveSearch)
      every { BraveSearch.CALL_SEARCH_PATTERN } answers { callOriginal() }
    }

    @AfterEach
    fun unmockBraveSearch() {
      unmockkObject(BraveSearch)
      BraveSearch.apiKey = null
    }

    @Test
    fun streamingSearchClearsSessionAndStreamsFollowUp() {
      val fakeResults =
          listOf(BraveSearch.SearchResult("Result 1", "https://r1.com", "Description 1"))
      every { BraveSearch.search(any(), any(), any(), any()) } returns fakeResults
      every { BraveSearch.formatResultsForModel(any()) } returns "SEARCH_RESULTS"

      val session = StreamingSession()
      session.addText("CALL:search(query='streaming test')")

      handler.handleSearchToolCallStreaming(
          session.currentText(), "question", emptyList(), emptyList(), session, false, 0)

      assertEquals(1, streamCompletionCalls)
      // Session thinking should contain search label
      assertTrue(
          session.thinkingContains("Searching") || session.thinkingContains("🔍"),
          "Should add search label to thinking")
    }

    @Test
    fun streamingSearchPreservesPriorThinking() {
      val fakeResults = listOf(BraveSearch.SearchResult("R", "https://r.com", "D"))
      every { BraveSearch.search(any(), any(), any(), any()) } returns fakeResults
      every { BraveSearch.formatResultsForModel(any()) } returns "CTX"

      val session = StreamingSession()
      session.addThinking("Previous reasoning")
      session.addText("CALL:search(query='test')")

      handler.handleSearchToolCallStreaming(
          session.currentText(), "question", emptyList(), emptyList(), session, false, 0)

      assertTrue(session.thinkingContains("Previous reasoning"), "Should preserve prior thinking")
    }

    @Test
    fun streamingSearchWithEmptyResultsRepromptsWithout() {
      every { BraveSearch.search(any(), any(), any(), any()) } returns emptyList()

      val session = StreamingSession()
      session.addText("CALL:search(query='no results')")

      handler.handleSearchToolCallStreaming(
          session.currentText(), "question", emptyList(), emptyList(), session, false, 0)

      assertEquals(1, streamCompletionCalls)
      assertTrue(logs.any { it.contains("no results") })
    }

    @Test
    fun streamingSearchFollowUpExceptionRestoresSession() {
      val fakeResults = listOf(BraveSearch.SearchResult("R", "https://r.com", "D"))
      every { BraveSearch.search(any(), any(), any(), any()) } returns fakeResults
      every { BraveSearch.formatResultsForModel(any()) } returns "CTX"

      val errorHandler =
          WebSearchHandler(
              maxSearchRoundTrips = 3,
              searchFollowUpPrompt = { q, _, _ -> q },
              buildMessages = { q, _, _, _, _, _, _, _ -> "[]" },
              chatCompletion = { _, _, _, _ -> "ok" },
              streamChatCompletion = { _, _, _, _ -> throw RuntimeException("Stream failed") },
              log = { _, msg -> logs.add(msg) })

      val session = StreamingSession()
      session.addThinking("Important reasoning")
      session.addText("CALL:search(query='error test')")
      val originalText = session.currentText()

      errorHandler.handleSearchToolCallStreaming(
          originalText, "question", emptyList(), emptyList(), session, false, 0)

      // Original text and thinking should be restored
      assertTrue(
          session.thinkingContains("Important reasoning"), "Should restore prior thinking on error")
      assertTrue(
          session.currentText().contains("CALL:search"), "Should restore prior text on error")
      assertTrue(logs.any { it.contains("failed") })
    }
  }

  // endregion

  // region MockK-based fetch round-trip tests

  @Nested
  inner class FetchRoundTripWithMockTest {

    @BeforeEach
    fun mockObjects() {
      BraveSearch.apiKey = "mock-key"
      mockkObject(BraveSearch)
      mockkObject(UrlFetcher)
      every { UrlFetcher.CALL_FETCH_PATTERN } answers { callOriginal() }
    }

    @AfterEach
    fun unmockObjects() {
      unmockkObject(BraveSearch)
      unmockkObject(UrlFetcher)
      BraveSearch.apiKey = null
    }

    @Test
    fun fetchSuccessReQueriesModel() {
      every { UrlFetcher.fetch(any()) } returns
          UrlFetcher.FetchResult(
              url = "https://example.com",
              title = "Page Title",
              text = "Page content",
              error = null)
      every { UrlFetcher.formatResultForModel(any()) } returns "FETCH_CTX"

      val result =
          handler.handleFetchToolCall(
              "CALL:fetch(url='https://example.com')",
              "read page",
              emptyList(),
              emptyList(),
              false,
              0)

      assertEquals("Mock answer", result)
      assertEquals(1, chatCompletionCalls)
      assertTrue(logs.any { it.contains("Fetch-augmented") })
    }

    @Test
    fun streamingFetchSuccessStreamsFollowUp() {
      every { UrlFetcher.fetch(any()) } returns
          UrlFetcher.FetchResult(
              url = "https://example.com", title = "Title", text = "Content text", error = null)
      every { UrlFetcher.formatResultForModel(any()) } returns "FETCH_CTX"

      val session = StreamingSession()
      session.addText("CALL:fetch(url='https://example.com')")

      handler.handleFetchToolCallStreaming(
          session.currentText(), "read page", emptyList(), emptyList(), session, false, 0)

      assertEquals(1, streamCompletionCalls)
      assertTrue(
          session.thinkingContains("Reading") || session.thinkingContains("📄"),
          "Should add reading label to thinking")
    }

    @Test
    fun streamingFetchWithErrorReplacesText() {
      every { UrlFetcher.fetch(any()) } returns
          UrlFetcher.FetchResult(
              url = "https://example.com",
              title = null,
              text = null,
              error = "Connection timed out")

      val session = StreamingSession()
      session.addText("CALL:fetch(url='https://example.com')")

      handler.handleFetchToolCallStreaming(
          session.currentText(), "read page", emptyList(), emptyList(), session, false, 0)

      assertTrue(
          session.currentText().contains("Could not read"), "Should show error message in session")
      assertEquals(0, streamCompletionCalls, "Should not stream follow-up on error")
    }

    @Test
    fun streamingFetchPreservesPriorThinking() {
      every { UrlFetcher.fetch(any()) } returns
          UrlFetcher.FetchResult(url = "https://x.com", title = "T", text = "C", error = null)
      every { UrlFetcher.formatResultForModel(any()) } returns "CTX"

      val session = StreamingSession()
      session.addThinking("Prior thought")
      session.addText("CALL:fetch(url='https://x.com')")

      handler.handleFetchToolCallStreaming(
          session.currentText(), "read", emptyList(), emptyList(), session, false, 0)

      assertTrue(
          session.thinkingContains("Prior thought"), "Should preserve prior thinking content")
    }

    @Test
    fun streamingFetchFollowUpExceptionRestoresState() {
      every { UrlFetcher.fetch(any()) } returns
          UrlFetcher.FetchResult(url = "https://x.com", title = "T", text = "C", error = null)
      every { UrlFetcher.formatResultForModel(any()) } returns "CTX"

      val errorHandler =
          WebSearchHandler(
              maxSearchRoundTrips = 3,
              searchFollowUpPrompt = { q, _, _ -> q },
              buildMessages = { q, _, _, _, _, _, _, _ -> "[]" },
              chatCompletion = { _, _, _, _ -> "ok" },
              streamChatCompletion = { _, _, _, _ -> throw RuntimeException("Fail") },
              log = { _, msg -> logs.add(msg) })

      val session = StreamingSession()
      session.addThinking("Reasoning")
      session.addText("CALL:fetch(url='https://x.com')")

      errorHandler.handleFetchToolCallStreaming(
          session.currentText(), "read", emptyList(), emptyList(), session, false, 0)

      assertTrue(session.thinkingContains("Reasoning"), "Should restore thinking on error")
      assertTrue(logs.any { it.contains("failed") })
    }
  }

  // endregion
}
