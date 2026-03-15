package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.BraveSearch
import com.google.gson.JsonArray
import com.google.gson.JsonObject

/**
 * Builds OpenAI-compatible messages arrays for `/v1/chat/completions`. Injects system prompts,
 * search instructions, thinking-mode directives, language-detection turns, and image content parts.
 */
internal class MessageBuilder(
    private val promptIdentity: String?,
    private val promptLocation: String?,
    private val promptSearch: String?,
    private val promptThinking: String?,
    private val promptNoInternet: String?,
    private val promptRules: String?,
    private val isExternalMode: Boolean,
    private val externalNoPrompt: Boolean,
    private val langService: LanguageDetectionService
) {
  /**
   * Builds the messages JSON array for a chat completion request.
   *
   * @param question The user's question text.
   * @param imageParts Base64 data URIs for images (may be empty for text-only).
   * @param chatHistory Previous conversation turns.
   * @param searchEnabled Whether web search is available.
   * @param enableThinking Whether thinking mode is on.
   * @param detectedLang Pre-detected language (or null for auto-detect).
   * @param locationEnabled Whether location context is enabled.
   * @param userLocation Resolved location string (or null).
   * @return JSON string of the messages array.
   */
  fun buildMessages(
      question: String,
      imageParts: List<String>,
      chatHistory: List<Pair<String, String>>,
      searchEnabled: Boolean = true,
      enableThinking: Boolean = false,
      detectedLang: DetectedLanguage? = null,
      locationEnabled: Boolean = false,
      userLocation: String? = null
  ): String {
    val messages = JsonArray()

    val systemPrompt =
        buildSystemPrompt(
            searchEnabled,
            enableThinking,
            detectedLang,
            locationEnabled,
            userLocation,
            imageParts.isNotEmpty())
    messages.add(message("system", systemPrompt))

    val effectiveHistory =
        if (chatHistory.isNotEmpty() &&
            chatHistory.last().first == "user" &&
            chatHistory.last().second == question) {
          chatHistory.dropLast(1)
        } else {
          chatHistory
        }

    for ((role, content) in effectiveHistory) {
      messages.add(message(role, content))
    }

    val lang = detectedLang ?: langService.detectLanguage(question)

    if (lang != null) {
      messages.add(message("user", lang.userTurn))
      messages.add(message("assistant", lang.assistantTurn))

      if (effectiveHistory.isNotEmpty()) {
        messages.add(
            message(
                "system",
                "LANGUAGE SWITCH: The user is now writing in ${lang.languageName}. " +
                    "You MUST respond ENTIRELY in ${lang.languageName}, regardless of what language was used earlier in the conversation."))
      }
    }

    if (effectiveHistory.isNotEmpty()) {
      appendCapabilityReminder(messages, searchEnabled, locationEnabled, userLocation)
    }

    messages.add(buildUserTurn(question, imageParts))

    if (enableThinking) {
      messages.add(
          message(
              "assistant",
              "<think>\n${lang?.thinkSeed ?: "Think briefly. Do NOT repeat yourself."}"))
    }

    return gsonCompact.toJson(messages)
  }

  private fun buildSystemPrompt(
      searchEnabled: Boolean,
      enableThinking: Boolean,
      detectedLang: DetectedLanguage?,
      locationEnabled: Boolean,
      userLocation: String?,
      hasImages: Boolean
  ): String {
    if (isExternalMode && externalNoPrompt) return ""

    return buildString {
      appendIdentityPrompt()
      appendLocationPrompt(locationEnabled, userLocation)

      if (searchEnabled && BraveSearch.isAvailable) {
        appendSearchInstructions(detectedLang, locationEnabled, userLocation, enableThinking)
      }

      if (!searchEnabled || !BraveSearch.isAvailable) {
        appendNoInternetPrompt()
      }

      appendRulesPrompt()

      if (hasImages) {
        appendDocumentGrounding()
      }
    }
  }

  private fun StringBuilder.appendIdentityPrompt() {
    val now = java.time.LocalDateTime.now()
    val today =
        now.format(
            java.time.format.DateTimeFormatter.ofPattern("d MMMM yyyy", java.util.Locale.ENGLISH))
    val currentTime =
        now.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm", java.util.Locale.ENGLISH))
    if (promptIdentity != null) {
      append(promptIdentity.replace("{date}", today).replace("{time}", currentTime))
      append(" ")
    } else {
      append(
          "You are a helpful assistant. Today is $today, current time is $currentTime. Answer precisely and concisely. ")
    }
  }

  private fun StringBuilder.appendLocationPrompt(locationEnabled: Boolean, userLocation: String?) {
    if (locationEnabled && userLocation != null) {
      if (promptLocation != null) {
        append(promptLocation.replace("{location}", userLocation))
        append(" ")
      } else {
        append(
            "IMPORTANT: The user is located near $userLocation. " +
                "Use this as the DEFAULT area for any location-dependent question (weather, nearby places, directions, local events). " +
                "This is the user's approximate area, NOT a specific address — never cite it as an address in answers. " +
                "If the user EXPLICITLY names a different city or place, use that location instead. ")
      }
    } else if (locationEnabled) {
      append(
          "The user enabled location sharing but their location could not be determined. " +
              "If the question depends on location, ask the user to specify their city or region. ")
    }
  }

  private fun StringBuilder.appendSearchInstructions(
      detectedLang: DetectedLanguage?,
      locationEnabled: Boolean,
      userLocation: String?,
      enableThinking: Boolean
  ) {
    if (promptSearch != null) {
      append(promptSearch)
      append(" ")
    } else {
      append("When you need current info, reply ONLY with CALL:search(query='your search query'). ")
      append(
          "CRITICAL: For questions about specific factual details (phone numbers, addresses, opening hours, prices, contact info, official data), " +
              "you MUST ALWAYS use CALL:search — NEVER answer from memory alone. " +
              "Even if a similar question was answered earlier in this conversation, ALWAYS search again — previous answers may have been given without internet access and could be wrong. ")
      append(
          "The search query MUST be about the user's ACTUAL topic. Extract the core subject from the user's question. ")
      append(
          "SANITIZE: remove person names, serial numbers, IDs, and any code mixing letters+digits. Keep brand names and topic keywords. ")
    }

    appendSearchExamples(detectedLang, locationEnabled, userLocation)

    append(
        "EXCEPTION: If the user wraps a word in << >>, copy it into the query verbatim with the << >> markers. ")
    append(
        "Example: 'What did << Elon Musk >> say about AI?' → CALL:search(query='<< Elon Musk >> AI statements'). ")
    append(
        "Never include person names in the query UNLESS they are wrapped in << >>. Never use '...' as the query. ")
    append(
        "IMPORTANT: The search query must match the user's actual question topic — never copy an example query. ")

    if (enableThinking) {
      appendThinkingInstructions(detectedLang)
    }
  }

  private fun StringBuilder.appendSearchExamples(
      detectedLang: DetectedLanguage?,
      locationEnabled: Boolean,
      userLocation: String?
  ) {
    val productQ: String
    val lawQ: String
    val weatherQ: String
    val localQ: String

    if (detectedLang != null && detectedLang.languageName != "English") {
      append(
          "IMPORTANT: Always write search queries in ${detectedLang.languageName}, NEVER in English. ")
      productQ = detectedLang.exampleProductQuery
      lawQ = detectedLang.exampleLawQuery
      weatherQ = detectedLang.exampleWeatherQuery
      localQ = detectedLang.exampleLocalQuery
    } else {
      productQ = "ProductName error fix"
      lawQ = "contract termination rules"
      weatherQ = "weather forecast"
      localQ = "restaurants near me"
    }

    append("Example: user asks about a product error → CALL:search(query='$productQ'). ")
    append("Example: user asks about contract law → CALL:search(query='$lawQ'). ")

    if (locationEnabled && userLocation != null) {
      val shortLocation = userLocation.substringBefore(",").trim()
      append("Example: user asks about weather → CALL:search(query='$weatherQ $shortLocation'). ")
      append("Example: user asks where to eat → CALL:search(query='$localQ $shortLocation'). ")
    } else {
      append(
          "Example: user asks about weather → CALL:search(query='$weatherQ${if (detectedLang == null || detectedLang.languageName == "English") " tomorrow" else ""}'). ")
      append("Example: user asks where to eat → CALL:search(query='$localQ'). ")
    }
  }

  private fun StringBuilder.appendThinkingInstructions(detectedLang: DetectedLanguage?) {
    if (promptThinking != null) {
      append(promptThinking.replace("{language}", detectedLang?.languageName ?: "English"))
      append(" ")
    } else {
      append("THINKING MODE: You MUST reason thoroughly FIRST inside <think>...</think>. ")

      if (detectedLang != null && detectedLang.languageName != "English") {
        append(
            "CRITICAL: Your reasoning inside <think> tags MUST be written in ${detectedLang.languageName}, NOT in English. ")
      }

      append(
          "Only AFTER you have finished thinking and closed </think>, output CALL:search as your visible answer if needed. ")
      append("NEVER put CALL:search inside <think> tags. Think first, then decide. ")
    }
  }

  private fun StringBuilder.appendNoInternetPrompt() {
    if (promptNoInternet != null) {
      append(promptNoInternet)
      append(" ")
    } else {
      append(
          "IMPORTANT: You do NOT have internet access. " +
              "NEVER fabricate or guess ANY information you are not certain about. " +
              "If you do not know something, clearly say so and suggest the user enable internet search or look it up directly. " +
              "Do NOT invent plausible-sounding answers — honesty about your limits is always better than a wrong answer. ")
    }
  }

  private fun StringBuilder.appendRulesPrompt() {
    if (promptRules != null) {
      append(promptRules)
    } else {
      append(
          "CRITICAL LANGUAGE RULE: Always respond in the EXACT language of the user's CURRENT message. If the user switches language mid-conversation, switch with them immediately. Never mention or reference products, brands, or services that are not part of the user's question. ")
      append(
          "When mentioning measurements, always show BOTH metric and imperial units: °C (°F), km (mi), m (ft), kg (lbs), km/h (mph), liters (gallons), cm (in), etc. ")
      append(
          "Each question is independent — answer ONLY the current question. Do NOT repeat or mix in information from previous answers unless the user explicitly refers to them.")
    }
  }

  private fun StringBuilder.appendDocumentGrounding() {
    append(
        " DOCUMENT GROUNDING: The user has uploaded a document. " +
            "Answer ONLY based on what you can actually see in the provided document image(s). " +
            "Do NOT recite general knowledge about the type of document, its typical contents, or information you may know from training data. " +
            "If the document is unreadable or a specific detail is not visible, say so honestly instead of guessing or filling in from general knowledge. " +
            "Internet search, if available, should only be used when the user explicitly asks for external information — never to supplement or replace what is in the document.")
  }

  private fun appendCapabilityReminder(
      messages: JsonArray,
      searchEnabled: Boolean,
      locationEnabled: Boolean,
      userLocation: String?
  ) {
    val capabilities = mutableListOf<String>()

    if (searchEnabled && BraveSearch.isAvailable) {
      capabilities.add("internet search via CALL:search")
    }

    if (locationEnabled && userLocation != null) {
      capabilities.add("the user's location ($userLocation)")
    }

    if (capabilities.isNotEmpty()) {
      val capList = capabilities.joinToString(" and ")
      messages.add(message("user", "Do you have access to $capList now?"))
      messages.add(
          message(
              "assistant",
              "Yes! I now have access to $capList. " +
                  "Disregard anything I said earlier about not being able to help — I can now answer fully."))
    }
  }

  private fun buildUserTurn(question: String, imageParts: List<String>): JsonObject {
    val msg = JsonObject()
    msg.addProperty("role", "user")

    if (imageParts.isNotEmpty()) {
      val parts = JsonArray()
      for (imageUri in imageParts) {
        val imgPart = JsonObject()
        imgPart.addProperty("type", "image_url")
        val imgUrl = JsonObject()
        imgUrl.addProperty("url", imageUri)
        imgPart.add("image_url", imgUrl)
        parts.add(imgPart)
      }
      val textPart = JsonObject()
      textPart.addProperty("type", "text")
      textPart.addProperty("text", question)
      parts.add(textPart)
      msg.add("content", parts)
    } else {
      msg.addProperty("content", question)
    }

    return msg
  }

  private fun message(role: String, content: String): JsonObject {
    val obj = JsonObject()
    obj.addProperty("role", role)
    obj.addProperty("content", content)
    return obj
  }
}
