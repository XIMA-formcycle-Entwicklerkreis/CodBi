package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

// !!! REMINDER — NEVER embed AI prompt / system-prompt text in Kotlin files !!!
// All prompt text belongs in the .md files under
// src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/
// (see prompts/index.json) and is loaded via ChatPromptFragments / PromptLoader. Adding prompt
// strings to .kt files is forbidden — they get out of sync, go stale, and are never reseeded.
// Move any prompt text into the .md files instead.

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.BraveSearch
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.MailBridge
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
    private val langService: LanguageDetectionService,
    private val filterResults: Boolean
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

    val callPattern = Regex("""CALL:(?:search|fetch)\([^)]*\)""", RegexOption.IGNORE_CASE)
    for ((role, content) in effectiveHistory) {
      val sanitized = if (role == "assistant") callPattern.replace(content, "").trim() else content
      if (sanitized.isNotEmpty()) messages.add(message(role, sanitized))
    }

    val lang = detectedLang ?: langService.detectLanguage(question)

    if (lang != null) {
      messages.add(message("user", lang.userTurn))
      messages.add(message("assistant", lang.assistantTurn))

      if (effectiveHistory.isNotEmpty()) {
        messages.add(
            message(
                "system",
                ChatPromptFragments.section("language_switch", "language" to lang.languageName)
                    ?: ""))
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
              "<think>\n${lang?.thinkSeed ?: (ChatPromptFragments.section("think_seed") ?: "")}"))
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
        appendFetchInstructions()
      }

      if (MailBridge.isAvailable) {
        appendMailInstructions()
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
            java.time.format.DateTimeFormatter.ofPattern(
                "EEEE, d MMMM yyyy", java.util.Locale.ENGLISH))
    val currentTime =
        now.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm", java.util.Locale.ENGLISH))
    val daysInMonth = now.toLocalDate().lengthOfMonth()
    if (promptIdentity != null) {
      append(
          promptIdentity
              .replace("{date}", today)
              .replace("{time}", currentTime)
              .replace("{daysInMonth}", daysInMonth.toString()))
      append(" ")
    } else {
      append(
          ChatPromptFragments.section(
              "identity",
              "date" to today,
              "time" to currentTime,
              "daysInMonth" to daysInMonth.toString()) ?: "")
      append(" ")
    }
  }

  private fun StringBuilder.appendLocationPrompt(locationEnabled: Boolean, userLocation: String?) {
    if (locationEnabled && userLocation != null) {
      if (promptLocation != null) {
        append(promptLocation.replace("{location}", userLocation))
        append(" ")
      } else {
        append(ChatPromptFragments.section("location", "location" to userLocation) ?: "")
        append(" ")
      }
    } else if (locationEnabled) {
      append(ChatPromptFragments.section("location_unknown") ?: "")
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
      append(ChatPromptFragments.section("search") ?: "")
      append(" ")
    }

    appendSearchExamples(detectedLang, locationEnabled, userLocation)

    append(ChatPromptFragments.section("search_exceptions") ?: "")
    append(" ")

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
          ChatPromptFragments.section(
              "search_query_language", "language" to detectedLang.languageName) ?: "")
      append(" ")
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

    append(
        ChatPromptFragments.section("search_examples_product", "product" to productQ, "law" to lawQ)
            ?: "")
    append(" ")

    if (locationEnabled && userLocation != null) {
      val shortLocation = userLocation.substringBefore(",").trim()
      append(
          ChatPromptFragments.section(
              "search_examples_local",
              "weather" to weatherQ,
              "shortLocation" to shortLocation,
              "local" to localQ) ?: "")
      append(" ")
    } else {
      val tomorrow =
          if (detectedLang == null || detectedLang.languageName == "English") " tomorrow" else ""
      append(
          ChatPromptFragments.section(
              "search_examples_plain",
              "weather" to weatherQ,
              "tomorrow" to tomorrow,
              "local" to localQ) ?: "")
      append(" ")
    }
  }

  private fun StringBuilder.appendFetchInstructions() {
    append(ChatPromptFragments.section("fetch") ?: "")
    append(" ")
  }

  private fun StringBuilder.appendMailInstructions() {
    append(ChatPromptFragments.section("mail") ?: "")
    append(" ")
  }

  private fun StringBuilder.appendThinkingInstructions(detectedLang: DetectedLanguage?) {
    if (promptThinking != null) {
      append(promptThinking.replace("{language}", detectedLang?.languageName ?: "English"))
      append(" ")
    } else {
      val languageRule =
          if (detectedLang != null && detectedLang.languageName != "English") {
            ChatPromptFragments.section(
                "thinking_language_rule", "language" to detectedLang.languageName) ?: ""
          } else ""
      append(ChatPromptFragments.section("thinking", "languageRule" to languageRule) ?: "")
      append(" ")
    }
  }

  private fun StringBuilder.appendNoInternetPrompt() {
    if (promptNoInternet != null) {
      append(promptNoInternet)
      append(" ")
    } else {
      append(ChatPromptFragments.section("no_internet") ?: "")
      append(" ")
    }
  }

  private fun StringBuilder.appendRulesPrompt() {
    if (promptRules != null) {
      append(promptRules)
    } else {
      append(ChatPromptFragments.section("rules") ?: "")
    }
  }

  private fun StringBuilder.appendDocumentGrounding() {
    append(" ").append(ChatPromptFragments.section("document_grounding") ?: "")
  }

  private fun appendCapabilityReminder(
      messages: JsonArray,
      searchEnabled: Boolean,
      locationEnabled: Boolean,
      userLocation: String?
  ) {
    val capabilities = mutableListOf<String>()

    if (searchEnabled && BraveSearch.isAvailable) {
      capabilities.add("internet search via CALL:search and URL reading via CALL:fetch")
    }

    if (MailBridge.isAvailable) {
      capabilities.add("email sending via CALL:mail")
    }

    if (locationEnabled && userLocation != null) {
      capabilities.add("the user's location ($userLocation)")
    }

    if (capabilities.isNotEmpty()) {
      val capList = capabilities.joinToString(" and ")
      messages.add(
          message(
              "user",
              ChatPromptFragments.section("capability_user", "capabilities" to capList) ?: ""))
      messages.add(
          message(
              "assistant",
              ChatPromptFragments.section("capability_assistant", "capabilities" to capList) ?: ""))
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
