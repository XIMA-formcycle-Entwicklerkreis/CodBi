package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.BraveSearch

/**
 * Handles `CALL:search(query='...')` tool calls emitted by the model. Performs Brave web searches
 * and re-queries the model with injected search results — both synchronous and streaming variants.
 */
internal class WebSearchHandler(
    private val maxSearchRoundTrips: Int,
    private val searchFollowUpPrompt:
        (originalQuestion: String, detectedLang: DetectedLanguage?, isLastRound: Boolean) -> String,
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
    private val chatCompletion:
        (
            messagesJson: String,
            enableThinking: Boolean,
            idSlot: Int,
            maxThinkingTokens: Int?) -> String,
    private val streamChatCompletion:
        (
            messagesJson: String,
            session: StreamingSession,
            enableThinking: Boolean,
            idSlot: Int) -> Unit,
    private val log: (LogLevel, String) -> Unit
) {

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
  /** Appends the user's short location to the search query when it is not already present. */
  private fun enrichQuery(rawQuery: String, userLocation: String?): String {
    if (userLocation == null) return rawQuery
    val shortLocation = userLocation.substringBefore(",").trim()
    if (shortLocation.isEmpty() || rawQuery.contains(shortLocation, ignoreCase = true))
        return rawQuery
    return "$rawQuery $shortLocation"
        .also { log(LogLevel.INFO, "Location-enriched search query: '$it'") }
  }

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
}
