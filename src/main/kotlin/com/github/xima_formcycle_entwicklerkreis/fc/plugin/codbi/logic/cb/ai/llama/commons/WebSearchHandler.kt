package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.BraveSearch
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.MailBridge
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.UrlFetcher

/**
 * Handles `CALL:search(query='...')` tool calls emitted by the model. Performs Brave web searches
 * and re-queries the model with injected search results — both synchronous and streaming variants.
 *
 * @param maxSearchRoundTrips Maximum number of search-then-answer iterations before forcing a
 *   direct answer.
 * @param searchFollowUpPrompt Builds the follow-up prompt given the original question, detected
 *   language, and whether this is the last round.
 * @param buildMessages Builds the OpenAI-compatible messages JSON for a chat completion request.
 * @param chatCompletion Sends a synchronous chat completion and returns the response text.
 * @param streamChatCompletion Sends a streaming chat completion, populating the given session.
 * @param log Logger callback for diagnostic messages.
 */
internal class WebSearchHandler(
    /** Maximum number of search-then-answer iterations before forcing a direct answer. */
    private val maxSearchRoundTrips: Int,
    /**
     * Builds the follow-up prompt given the original question, detected language, and whether this
     * is the last round.
     */
    private val searchFollowUpPrompt:
        (originalQuestion: String, detectedLang: DetectedLanguage?, isLastRound: Boolean) -> String,
    /** Builds the OpenAI-compatible messages JSON for a chat completion request. */
    private val buildMessages:
        (
            question: String,
            imageParts: List<String>,
            chatHistory: List<Pair<String, String>>,
            searchEnabled: Boolean,
            enableThinking: Boolean,
            detectedLang: DetectedLanguage?,
            locationEnabled: Boolean,
            userLocation: String?) -> String,
    /** Sends a synchronous chat completion and returns the response text. */
    private val chatCompletion:
        (
            messagesJson: String,
            enableThinking: Boolean,
            idSlot: Int,
            maxThinkingTokens: Int?) -> String,
    /** Sends a streaming chat completion, populating the given session. */
    private val streamChatCompletion:
        (
            messagesJson: String,
            session: StreamingSession,
            enableThinking: Boolean,
            idSlot: Int) -> Unit,
    /** Logger callback for diagnostic messages. */
    private val log: (LogLevel, String) -> Unit
) {

  /**
   * Appends the user's short location to the search query when it is not already present.
   *
   * @param rawQuery The original search query from the model.
   * @param userLocation The user's location string, or `null` if unavailable.
   * @return The enriched query, or the original if location is absent or already included.
   */
  private fun enrichQuery(rawQuery: String, userLocation: String?): String {
    if (userLocation == null) return rawQuery
    val shortLocation = userLocation.substringBefore(",").trim()
    if (shortLocation.isEmpty() || rawQuery.contains(shortLocation, ignoreCase = true))
        return rawQuery
    return "$rawQuery $shortLocation"
        .also { log(LogLevel.INFO, "Location-enriched search query: '$it'") }
  }

  /**
   * Checks if the model's response contains a `CALL:search(query='...')` marker. If so, performs a
   * Brave web search and re-queries the model with the results injected into the conversation
   * history.
   *
   * @param initialAnswer The model's first response (may contain CALL:search).
   * @param originalQuestion The user's original question.
   * @param imageParts Base64 image URIs (carried forward).
   * @param chatHistory Previous conversation turns.
   * @param enableThinking Whether thinking mode is on.
   * @param slotId The slot ID for inference.
   * @param detectedLang Pre-detected language result.
   * @param userLocation Resolved user location string.
   * @return The final answer (either the original or the search-augmented one).
   */
  fun handleSearchToolCall(
      initialAnswer: String,
      originalQuestion: String,
      imageParts: List<String>,
      chatHistory: List<Pair<String, String>>,
      enableThinking: Boolean,
      slotId: Int,
      detectedLang: DetectedLanguage? = null,
      userLocation: String? = null
  ): String {
    if (!BraveSearch.isAvailable) return initialAnswer

    var answer = initialAnswer

    for (round in 1..maxSearchRoundTrips) {
      val match = BraveSearch.CALL_SEARCH_PATTERN.find(answer) ?: break
      val query = enrichQuery(match.groupValues[1], userLocation)

      log(LogLevel.INFO, "Model requested web search (round $round): '$query'")

      val results =
          BraveSearch.search(query, detectedLang?.braveCountry, detectedLang?.languageName)

      if (results.isEmpty()) {
        log(LogLevel.WARNING, "Web search returned no results for: '$query'")

        break
      }

      val searchContext = BraveSearch.formatResultsForModel(results)
      val extendedHistory = chatHistory.toMutableList()

      extendedHistory.add("user" to originalQuestion)
      extendedHistory.add("assistant" to match.value)
      extendedHistory.add("user" to searchContext)

      val followUpQuestion =
          searchFollowUpPrompt(originalQuestion, detectedLang, round == maxSearchRoundTrips)
      val messages =
          buildMessages(
              followUpQuestion, imageParts, extendedHistory, true, false, detectedLang, false, null)
      answer = chatCompletion(messages, false, slotId, null)

      log(LogLevel.INFO, "Search-augmented answer (round $round): ${answer.take(120)}…")
    }

    return answer
  }

  /**
   * Handles `CALL:search` in streaming mode. When the completed stream text contains a search call,
   * performs the search and streams a follow-up completion.
   *
   * @param fullText The completed stream text (may contain CALL:search).
   * @param originalQuestion The user's original question.
   * @param imageParts Base64 image URIs (carried forward).
   * @param chatHistory Previous conversation turns.
   * @param session The streaming session to populate.
   * @param enableThinking Whether thinking mode is on.
   * @param slotId The slot ID for inference.
   * @param detectedLang Pre-detected language result.
   * @param userLocation Resolved user location string.
   */
  fun handleSearchToolCallStreaming(
      fullText: String,
      originalQuestion: String,
      imageParts: List<String>,
      chatHistory: List<Pair<String, String>>,
      session: StreamingSession,
      enableThinking: Boolean,
      slotId: Int,
      detectedLang: DetectedLanguage? = null,
      userLocation: String? = null
  ) {
    if (!BraveSearch.isAvailable) return

    var currentText = fullText

    for (round in 1..maxSearchRoundTrips) {
      val match = BraveSearch.CALL_SEARCH_PATTERN.find(currentText) ?: break
      val query = enrichQuery(match.groupValues[1], userLocation)

      log(LogLevel.INFO, "Streaming: Model requested web search (round $round): '$query'")

      val results =
          BraveSearch.search(query, detectedLang?.braveCountry, detectedLang?.languageName)

      if (results.isEmpty()) {
        if (round == 1) {
          session.replaceText("The web search returned no results. Please try a different query.")
        } else {
          log(
              LogLevel.WARNING,
              "Streaming: Web search returned no results for round $round: '$query'")
        }

        return
      }

      val searchContext = BraveSearch.formatResultsForModel(results)
      val priorReasoning = session.currentThinking().trim()
      val priorText = session.currentText()

      session.clearAll()

      if (priorReasoning.isNotEmpty()) {
        session.addThinking(priorReasoning)
        session.addThinking("\n\n---\n\n")
      }

      val searchLabel =
          detectedLang?.searchingLabel?.format(query)
              ?: "\uD83D\uDD0D Searching the web for: \"$query\""

      session.addThinking("$searchLabel\n\n")

      for ((index, result) in results.withIndex()) {
        session.addThinking(
            "[${index + 1}] ${result.title}\n    ${result.url}\n    ${result.description.take(150)}\n\n")
      }

      val analyzeLabel =
          detectedLang?.analyzingLabel?.format(results.size)
              ?: "Analyzing ${results.size} results to formulate an answer."

      session.addThinking(analyzeLabel)

      val extendedHistory = chatHistory.toMutableList()

      extendedHistory.add("user" to originalQuestion)
      extendedHistory.add("assistant" to match.value)
      extendedHistory.add("user" to searchContext)

      val followUpQuestion =
          searchFollowUpPrompt(originalQuestion, detectedLang, round == maxSearchRoundTrips)

      val messages =
          buildMessages(
              followUpQuestion, imageParts, extendedHistory, true, false, detectedLang, false, null)

      try {
        streamChatCompletion(messages, session, false, slotId)
      } catch (e: Exception) {
        // Restore prior text so the user sees the partial answer instead of an empty response
        session.clearAll()
        if (priorReasoning.isNotEmpty()) session.addThinking(priorReasoning)
        if (priorText.isNotEmpty()) session.addText(priorText)
        log(LogLevel.WARNING, "Streaming: Follow-up request failed in round $round: ${e.message}")

        return
      }

      currentText = session.currentText()
    }
  }

  /**
   * Checks if the model's response contains a `CALL:fetch(url='...')` marker. If so, fetches the
   * URL content and re-queries the model with the page text injected into the conversation history.
   *
   * @param initialAnswer The model's response (may contain CALL:fetch).
   * @param originalQuestion The user's original question.
   * @param imageParts Base64 image URIs (carried forward).
   * @param chatHistory Previous conversation turns.
   * @param enableThinking Whether thinking mode is on.
   * @param slotId The slot ID for inference.
   * @param detectedLang Pre-detected language result.
   * @return The final answer (either the original or the fetch-augmented one).
   */
  fun handleFetchToolCall(
      initialAnswer: String,
      originalQuestion: String,
      imageParts: List<String>,
      chatHistory: List<Pair<String, String>>,
      enableThinking: Boolean,
      slotId: Int,
      detectedLang: DetectedLanguage? = null
  ): String {
    if (!BraveSearch.isAvailable) return initialAnswer

    val match = UrlFetcher.CALL_FETCH_PATTERN.find(initialAnswer) ?: return initialAnswer
    val url = match.groupValues[1]

    log(LogLevel.INFO, "Model requested URL fetch: '$url'")

    val result = UrlFetcher.fetch(url)
    val fetchContext = UrlFetcher.formatResultForModel(result)
    val extendedHistory = chatHistory.toMutableList()

    extendedHistory.add("user" to originalQuestion)
    extendedHistory.add("assistant" to match.value)
    extendedHistory.add("user" to fetchContext)

    val followUpQuestion = searchFollowUpPrompt(originalQuestion, detectedLang, true)
    val messages =
        buildMessages(
            followUpQuestion, imageParts, extendedHistory, true, false, detectedLang, false, null)
    val answer = chatCompletion(messages, false, slotId, null)

    log(LogLevel.INFO, "Fetch-augmented answer: ${answer.take(120)}…")

    return answer
  }

  /**
   * Handles `CALL:fetch` in streaming mode. When the completed stream text contains a fetch call,
   * fetches the URL and streams a follow-up completion.
   *
   * @param fullText The completed stream text (may contain CALL:fetch).
   * @param originalQuestion The user's original question.
   * @param imageParts Base64 image URIs (carried forward).
   * @param chatHistory Previous conversation turns.
   * @param session The streaming session to populate.
   * @param enableThinking Whether thinking mode is on.
   * @param slotId The slot ID for inference.
   * @param detectedLang Pre-detected language result.
   */
  fun handleFetchToolCallStreaming(
      fullText: String,
      originalQuestion: String,
      imageParts: List<String>,
      chatHistory: List<Pair<String, String>>,
      session: StreamingSession,
      enableThinking: Boolean,
      slotId: Int,
      detectedLang: DetectedLanguage? = null
  ) {
    if (!BraveSearch.isAvailable) return

    val match = UrlFetcher.CALL_FETCH_PATTERN.find(fullText) ?: return
    val url = match.groupValues[1]

    log(LogLevel.INFO, "Streaming: Model requested URL fetch: '$url'")

    val result = UrlFetcher.fetch(url)

    if (result.error != null) {
      session.replaceText("Could not read the page: ${result.error}")
      return
    }

    val fetchContext = UrlFetcher.formatResultForModel(result)
    val priorReasoning = session.currentThinking().trim()
    val priorText = session.currentText()

    session.clearAll()

    if (priorReasoning.isNotEmpty()) {
      session.addThinking(priorReasoning)
      session.addThinking("\n\n---\n\n")
    }

    val readingLabel = detectedLang?.readingLabel?.format(url) ?: "\uD83D\uDCC4Reading: \"$url\""

    session.addThinking("$readingLabel\n\n")

    if (!result.title.isNullOrBlank()) {
      session.addThinking("Title: ${result.title}\n")
    }

    session.addThinking("Extracted ${result.text?.length ?: 0} characters of content.\n\n")

    val extendedHistory = chatHistory.toMutableList()

    extendedHistory.add("user" to originalQuestion)
    extendedHistory.add("assistant" to match.value)
    extendedHistory.add("user" to fetchContext)

    val followUpQuestion = searchFollowUpPrompt(originalQuestion, detectedLang, true)
    val messages =
        buildMessages(
            followUpQuestion, imageParts, extendedHistory, true, false, detectedLang, false, null)

    try {
      streamChatCompletion(messages, session, false, slotId)
    } catch (e: Exception) {
      session.clearAll()
      if (priorReasoning.isNotEmpty()) session.addThinking(priorReasoning)
      if (priorText.isNotEmpty()) session.addText(priorText)
      log(LogLevel.WARNING, "Streaming: Fetch follow-up request failed: ${e.message}")
    }
  }

  // region CALL:mail handling

  /**
   * Checks if the model's response contains a `CALL:mail(...)` marker. If so, sends the email and
   * re-queries the model with the result injected into the conversation history.
   *
   * @param initialAnswer The model's response (may contain CALL:mail).
   * @param originalQuestion The user's original question.
   * @param imageParts Base64 image URIs (carried forward).
   * @param chatHistory Previous conversation turns.
   * @param enableThinking Whether thinking mode is on.
   * @param slotId The slot ID for inference.
   * @param sessionId The streaming session ID (for rate limiting).
   * @param detectedLang Pre-detected language result.
   * @return The final answer (either the original or the mail-augmented one).
   */
  fun handleMailToolCall(
      initialAnswer: String,
      originalQuestion: String,
      imageParts: List<String>,
      chatHistory: List<Pair<String, String>>,
      enableThinking: Boolean,
      slotId: Int,
      sessionId: String,
      detectedLang: DetectedLanguage? = null,
      clientIP: String = "unknown"
  ): String {
    if (!MailBridge.isAvailable) return initialAnswer

    val match =
        MailBridge.CALL_MAIL_PATTERN.find(initialAnswer)
            ?: MailBridge.CALL_MAIL_PATTERN_TRUNCATED.find(initialAnswer)
            ?: return initialAnswer
    val to = MailBridge.cleanEmail(match.groupValues[1])
    val subject = match.groupValues[2]
    val body = match.groupValues[3]

    log(LogLevel.INFO, "Model requested mail send: to='$to', subject='${subject.take(50)}'")

    val result = MailBridge.sendMail(to, subject, body, sessionId, clientIP)

    // The body IS the answer — return it with a status note appended
    val statusNote =
        if (result.success) {
          "\n\n\u2709\uFE0F \u2192 $to \u2705"
        } else {
          "\n\n\u26A0 \u2709\uFE0F \u2192 $to \u274C ${result.error}"
        }

    log(LogLevel.INFO, "Mail result: success=${result.success}, returning body as answer")

    return body.trim() + statusNote
  }

  /**
   * Handles `CALL:mail` in streaming mode. When the completed stream text contains a mail call,
   * sends the email and streams a follow-up completion.
   *
   * @param fullText The completed stream text (may contain CALL:mail).
   * @param originalQuestion The user's original question.
   * @param imageParts Base64 image URIs (carried forward).
   * @param chatHistory Previous conversation turns.
   * @param session The streaming session to populate.
   * @param enableThinking Whether thinking mode is on.
   * @param slotId The slot ID for inference.
   * @param sessionId The streaming session ID (for rate limiting).
   * @param detectedLang Pre-detected language result.
   */
  fun handleMailToolCallStreaming(
      fullText: String,
      originalQuestion: String,
      imageParts: List<String>,
      chatHistory: List<Pair<String, String>>,
      session: StreamingSession,
      enableThinking: Boolean,
      slotId: Int,
      sessionId: String,
      detectedLang: DetectedLanguage? = null,
      clientIP: String = "unknown"
  ) {
    if (!MailBridge.isAvailable) return

    val match =
        MailBridge.CALL_MAIL_PATTERN.find(fullText)
            ?: MailBridge.CALL_MAIL_PATTERN_TRUNCATED.find(fullText)
            ?: return
    val to = MailBridge.cleanEmail(match.groupValues[1])
    val subject = match.groupValues[2]
    val body = match.groupValues[3]

    log(
        LogLevel.INFO,
        "Streaming: Model requested mail send: to='$to', subject='${subject.take(50)}'")

    val result = MailBridge.sendMail(to, subject, body, sessionId, clientIP)
    val priorReasoning = session.currentThinking().trim()

    session.clearAll()

    if (priorReasoning.isNotEmpty()) {
      session.addThinking(priorReasoning)
      session.addThinking("\n\n---\n\n")
    }

    val sendingLabel =
        detectedLang?.sendingMailLabel?.format(to) ?: "\u2709\uFE0F Sending email to: \"$to\""

    session.addThinking("$sendingLabel\n\n")
    session.addThinking("Subject: ${subject.take(100)}\n")

    if (result.success) {
      session.addThinking("\u2705\n\n")
    } else {
      session.addThinking("\u274C ${result.error}\n\n")
    }

    // The body IS the answer — show it as the visible response with a status note
    val statusNote =
        if (result.success) {
          "\n\n\u2709\uFE0F \u2192 $to \u2705"
        } else {
          "\n\n\u26A0 \u2709\uFE0F \u2192 $to \u274C ${result.error}"
        }

    session.addText(body.trim() + statusNote)

    log(LogLevel.INFO, "Streaming: Mail result: success=${result.success}, body shown as answer")
  }

  // endregion CALL:mail handling
}
