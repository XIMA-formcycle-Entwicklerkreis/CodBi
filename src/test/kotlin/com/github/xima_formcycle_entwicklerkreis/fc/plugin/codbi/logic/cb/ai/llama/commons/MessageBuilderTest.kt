package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.BraveSearch
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.MailBridge
import com.google.gson.JsonParser
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/**
 * Tests for [MessageBuilder] — system prompt construction, user turn building, message formatting.
 */
class MessageBuilderTest {

  private val logs = mutableListOf<String>()
  private lateinit var langService: LanguageDetectionService
  private lateinit var builder: MessageBuilder

  @AfterEach
  fun tearDown() {
    BraveSearch.apiKey = null
    MailBridge.enabled = false
  }

  @BeforeEach
  fun setUp() {
    logs.clear()
    langService = LanguageDetectionService(log = { _, msg -> logs.add(msg) })
    builder =
        MessageBuilder(
            promptIdentity = null,
            promptLocation = null,
            promptSearch = null,
            promptThinking = null,
            promptNoInternet = null,
            promptRules = null,
            isExternalMode = false,
            externalNoPrompt = false,
            langService = langService,
            filterResults = false)
  }

  // region Basic Message Structure

  @Nested
  inner class BasicMessageStructure {

    @Test
    fun returnsValidJsonArray() {
      val json = builder.buildMessages("Hello", emptyList(), emptyList())
      val arr = JsonParser.parseString(json).asJsonArray
      assertTrue(arr.size() > 0)
    }

    @Test
    fun startsWithSystemMessage() {
      val json = builder.buildMessages("Hello", emptyList(), emptyList())
      val arr = JsonParser.parseString(json).asJsonArray
      val first = arr[0].asJsonObject
      assertEquals("system", first.get("role").asString)
    }

    @Test
    fun endsWithUserMessage() {
      val json = builder.buildMessages("Hello", emptyList(), emptyList())
      val arr = JsonParser.parseString(json).asJsonArray
      val last = arr[arr.size() - 1].asJsonObject
      assertEquals("user", last.get("role").asString)
    }

    @Test
    fun userMessageContainsQuestion() {
      val json = builder.buildMessages("What is 2+2?", emptyList(), emptyList())
      val arr = JsonParser.parseString(json).asJsonArray
      val last = arr[arr.size() - 1].asJsonObject
      assertEquals("What is 2+2?", last.get("content").asString)
    }
  }

  // endregion

  // region System Prompt Content

  @Nested
  inner class SystemPromptContent {

    @Test
    fun defaultIdentityPromptContainsDate() {
      val json = builder.buildMessages("Hi", emptyList(), emptyList())
      val arr = JsonParser.parseString(json).asJsonArray
      val system = arr[0].asJsonObject.get("content").asString
      // Default prompt includes current date
      assertTrue(system.contains("202"), "System prompt should contain year: $system")
    }

    @Test
    fun customIdentityPrompt() {
      val custom =
          MessageBuilder(
              promptIdentity = "You are CodBi. Date: {date}, Time: {time}.",
              promptLocation = null,
              promptSearch = null,
              promptThinking = null,
              promptNoInternet = null,
              promptRules = null,
              isExternalMode = false,
              externalNoPrompt = false,
              langService = langService,
              filterResults = false)
      val json = custom.buildMessages("Hi", emptyList(), emptyList())
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(system.startsWith("You are CodBi."))
    }

    @Test
    fun noInternetPromptWhenSearchDisabled() {
      val json = builder.buildMessages("Hi", emptyList(), emptyList(), searchEnabled = false)
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(
          system.contains("internet access") || system.contains("NOT have internet"),
          "Should mention no internet: $system")
    }

    @Test
    fun externalModeNoPromptReturnsEmpty() {
      val ext =
          MessageBuilder(
              promptIdentity = null,
              promptLocation = null,
              promptSearch = null,
              promptThinking = null,
              promptNoInternet = null,
              promptRules = null,
              isExternalMode = true,
              externalNoPrompt = true,
              langService = langService,
              filterResults = false)
      val json = ext.buildMessages("Hi", emptyList(), emptyList())
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertEquals("", system)
    }
  }

  // endregion

  // region Chat History

  @Nested
  inner class ChatHistoryTest {

    @Test
    fun includesHistoryMessages() {
      val history = listOf("user" to "Hello", "assistant" to "Hi there!")
      val json = builder.buildMessages("Follow up", emptyList(), history)
      val arr = JsonParser.parseString(json).asJsonArray
      // Should have system + history (2) + possible lang turns + user turn
      assertTrue(arr.size() >= 4, "Expected at least 4 messages, got ${arr.size()}")
    }

    @Test
    fun deduplicatesLastUserMessage() {
      // If the last history entry matches the question, it should be dropped
      val history = listOf("user" to "same question")
      val json = builder.buildMessages("same question", emptyList(), history)
      val arr = JsonParser.parseString(json).asJsonArray
      // Count user messages — should not have duplicate
      val userMessages =
          (0 until arr.size())
              .map { arr[it].asJsonObject }
              .filter { it.get("role").asString == "user" }
              .map { it.get("content").asString }
      // The question should appear exactly once at the end (or via lang turns)
      val exactMatches = userMessages.count { it == "same question" }
      assertEquals(1, exactMatches, "Question should appear once: $userMessages")
    }
  }

  // endregion

  // region Image Parts

  @Nested
  inner class ImagePartsTest {

    @Test
    fun textOnlyUserTurn() {
      val json = builder.buildMessages("Hello", emptyList(), emptyList())
      val arr = JsonParser.parseString(json).asJsonArray
      val last = arr[arr.size() - 1].asJsonObject
      assertTrue(last.get("content").isJsonPrimitive, "Text-only should be a string")
    }

    @Test
    fun imageUserTurnHasMultiParts() {
      val images = listOf("data:image/png;base64,abc123")
      val json = builder.buildMessages("Describe this", images, emptyList())
      val arr = JsonParser.parseString(json).asJsonArray
      val last = arr[arr.size() - 1].asJsonObject
      assertTrue(last.get("content").isJsonArray, "Image turn should be array")
      val parts = last.get("content").asJsonArray
      assertTrue(parts.size() >= 2, "Should have image + text parts")
    }

    @Test
    fun imagePartHasCorrectStructure() {
      val images = listOf("data:image/png;base64,abc123")
      val json = builder.buildMessages("Describe", images, emptyList())
      val arr = JsonParser.parseString(json).asJsonArray
      val last = arr[arr.size() - 1].asJsonObject
      val parts = last.get("content").asJsonArray
      val imgPart = parts[0].asJsonObject
      assertEquals("image_url", imgPart.get("type").asString)
      assertNotNull(imgPart.get("image_url"))
    }

    @Test
    fun documentGroundingInSystemPrompt() {
      val images = listOf("data:image/png;base64,abc")
      val json = builder.buildMessages("Read doc", images, emptyList())
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(system.contains("DOCUMENT GROUNDING"), "Should have document grounding: $system")
    }
  }

  // endregion

  // region Thinking Mode

  @Nested
  inner class ThinkingModeTest {

    @Test
    fun thinkingModeAddsAssistantTurn() {
      val json = builder.buildMessages("Hi", emptyList(), emptyList(), enableThinking = true)
      val arr = JsonParser.parseString(json).asJsonArray
      val last = arr[arr.size() - 1].asJsonObject
      assertEquals("assistant", last.get("role").asString)
      assertTrue(last.get("content").asString.contains("<think>"))
    }

    @Test
    fun noThinkingTurnWhenDisabled() {
      val json = builder.buildMessages("Hi", emptyList(), emptyList(), enableThinking = false)
      val arr = JsonParser.parseString(json).asJsonArray
      val last = arr[arr.size() - 1].asJsonObject
      assertEquals("user", last.get("role").asString)
    }
  }

  // endregion

  // region Location

  @Nested
  inner class LocationTest {

    @Test
    fun locationPromptIncluded() {
      val json =
          builder.buildMessages(
              "Where to eat?",
              emptyList(),
              emptyList(),
              locationEnabled = true,
              userLocation = "Munich, Germany")
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(system.contains("Munich"), "Should mention location: $system")
    }

    @Test
    fun noLocationPromptWhenDisabled() {
      val json =
          builder.buildMessages(
              "Where to eat?",
              emptyList(),
              emptyList(),
              locationEnabled = false,
              userLocation = null)
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertFalse(system.contains("Munich"))
    }

    @Test
    fun locationEnabledButUnavailable() {
      val json =
          builder.buildMessages(
              "Weather?", emptyList(), emptyList(), locationEnabled = true, userLocation = null)
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(
          system.contains("could not be determined"),
          "Should mention location unavailable: $system")
    }
  }

  // endregion

  // region Search Instructions

  @Nested
  inner class SearchInstructionsTest {

    @Test
    fun includesSearchInstructionsWhenAvailable() {
      BraveSearch.apiKey = "test-key"
      val json = builder.buildMessages("Hello", emptyList(), emptyList(), searchEnabled = true)
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(system.contains("CALL:search"), "Should contain search instructions: $system")
    }

    @Test
    fun includesFetchInstructions() {
      BraveSearch.apiKey = "test-key"
      val json = builder.buildMessages("Hello", emptyList(), emptyList(), searchEnabled = true)
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(system.contains("CALL:fetch"), "Should contain fetch instructions: $system")
    }

    @Test
    fun includesMailInstructionsWhenAvailable() {
      BraveSearch.apiKey = "test-key"
      MailBridge.enabled = true
      val json = builder.buildMessages("Hello", emptyList(), emptyList(), searchEnabled = true)
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(system.contains("CALL:mail"), "Should contain mail instructions: $system")
    }

    @Test
    fun noMailInstructionsWhenDisabled() {
      BraveSearch.apiKey = "test-key"
      MailBridge.enabled = false
      val json = builder.buildMessages("Hello", emptyList(), emptyList(), searchEnabled = true)
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertFalse(system.contains("CALL:mail"), "Should not contain mail instructions: $system")
    }

    @Test
    fun noSearchInstructionsWhenDisabled() {
      BraveSearch.apiKey = "test-key"
      val json = builder.buildMessages("Hello", emptyList(), emptyList(), searchEnabled = false)
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertFalse(
          system.contains("CALL:search"), "Should not contain search when disabled: $system")
    }

    @Test
    fun includesSearchExamplesWithLocation() {
      BraveSearch.apiKey = "test-key"
      val json =
          builder.buildMessages(
              "Hello",
              emptyList(),
              emptyList(),
              searchEnabled = true,
              locationEnabled = true,
              userLocation = "Munich, Germany")
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(system.contains("Munich"), "Search examples should include location: $system")
    }

    @Test
    fun includesThinkingInstructions() {
      BraveSearch.apiKey = "test-key"
      val json =
          builder.buildMessages(
              "Hello", emptyList(), emptyList(), searchEnabled = true, enableThinking = true)
      val arr = JsonParser.parseString(json).asJsonArray
      val system = arr[0].asJsonObject.get("content").asString
      assertTrue(
          system.contains("THINKING MODE") || system.contains("<think>"),
          "Should contain thinking instructions: $system")
    }

    @Test
    fun sanitizeWarningInSearchInstructions() {
      BraveSearch.apiKey = "test-key"
      val json = builder.buildMessages("Hello", emptyList(), emptyList(), searchEnabled = true)
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(
          system.contains("SANITIZE"), "Should warn about sanitizing search queries: $system")
    }

    @Test
    fun exceptionMarkerInSearchInstructions() {
      BraveSearch.apiKey = "test-key"
      val json = builder.buildMessages("Hello", emptyList(), emptyList(), searchEnabled = true)
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(system.contains("<< >>"), "Should mention << >> exception marker: $system")
    }
  }

  // endregion

  // region Custom Prompts

  @Nested
  inner class CustomPromptsTest {

    @Test
    fun customLocationPromptWithSubstitution() {
      val custom =
          MessageBuilder(
              promptIdentity = null,
              promptSearch = null,
              promptThinking = null,
              promptNoInternet = null,
              promptRules = null,
              promptLocation = "User is near {location}.",
              isExternalMode = false,
              externalNoPrompt = false,
              langService = langService,
              filterResults = false)
      val json =
          custom.buildMessages(
              "Where?",
              emptyList(),
              emptyList(),
              locationEnabled = true,
              userLocation = "Berlin, Germany")
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(
          system.contains("User is near Berlin, Germany."),
          "Custom location should substitute: $system")
    }

    @Test
    fun customSearchPrompt() {
      BraveSearch.apiKey = "test-key"
      val custom =
          MessageBuilder(
              promptIdentity = null,
              promptLocation = null,
              promptThinking = null,
              promptNoInternet = null,
              promptRules = null,
              promptSearch = "Custom search instructions here.",
              isExternalMode = false,
              externalNoPrompt = false,
              langService = langService,
              filterResults = false)
      val json = custom.buildMessages("Hello", emptyList(), emptyList(), searchEnabled = true)
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(
          system.contains("Custom search instructions here."), "Custom search prompt: $system")
    }

    @Test
    fun customThinkingPromptWithLanguage() {
      BraveSearch.apiKey = "test-key"
      val custom =
          MessageBuilder(
              promptIdentity = null,
              promptLocation = null,
              promptSearch = null,
              promptNoInternet = null,
              promptRules = null,
              promptThinking = "Think in {language} please.",
              isExternalMode = false,
              externalNoPrompt = false,
              langService = langService,
              filterResults = false)
      val json =
          custom.buildMessages(
              "Hallo", emptyList(), emptyList(), searchEnabled = true, enableThinking = true)
      val arr = JsonParser.parseString(json).asJsonArray
      val system = arr[0].asJsonObject.get("content").asString
      assertTrue(system.contains("Think in"), "Custom thinking prompt should appear: $system")
    }

    @Test
    fun customNoInternetPrompt() {
      val custom =
          MessageBuilder(
              promptIdentity = null,
              promptLocation = null,
              promptSearch = null,
              promptThinking = null,
              promptRules = null,
              promptNoInternet = "No web access available.",
              isExternalMode = false,
              externalNoPrompt = false,
              langService = langService,
              filterResults = false)
      val json = custom.buildMessages("Hello", emptyList(), emptyList(), searchEnabled = false)
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(system.contains("No web access available."), "Custom no-internet: $system")
    }

    @Test
    fun customRulesPrompt() {
      val custom =
          MessageBuilder(
              promptIdentity = null,
              promptLocation = null,
              promptSearch = null,
              promptThinking = null,
              promptNoInternet = null,
              promptRules = "Always reply in formal German.",
              isExternalMode = false,
              externalNoPrompt = false,
              langService = langService,
              filterResults = false)
      val json = custom.buildMessages("Hello", emptyList(), emptyList())
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(system.contains("Always reply in formal German."), "Custom rules: $system")
    }

    @Test
    fun externalModeWithPrompt() {
      val ext =
          MessageBuilder(
              promptIdentity = null,
              promptLocation = null,
              promptSearch = null,
              promptThinking = null,
              promptNoInternet = null,
              promptRules = null,
              isExternalMode = true,
              externalNoPrompt = false,
              langService = langService,
              filterResults = false)
      val json = ext.buildMessages("Hello", emptyList(), emptyList())
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(system.isNotEmpty(), "External mode with prompt should have content")
    }
  }

  // endregion

  // region Capability Reminder

  @Nested
  inner class CapabilityReminderTest {

    @Test
    fun addsCapabilityReminderWhenSearchAvailable() {
      BraveSearch.apiKey = "test-key"
      val json = builder.buildMessages("Hello", emptyList(), emptyList(), searchEnabled = true)
      val arr = JsonParser.parseString(json).asJsonArray
      val allContent =
          (0 until arr.size())
              .map { arr[it].asJsonObject.get("content")?.asString ?: "" }
              .joinToString(" ")
      assertTrue(
          allContent.contains("CALL:search") || allContent.contains("internet search"),
          "Should mention search capability: $allContent")
    }

    @Test
    fun addsCapabilityReminderWithLocation() {
      BraveSearch.apiKey = "test-key"
      val json =
          builder.buildMessages(
              "Hello",
              emptyList(),
              emptyList(),
              searchEnabled = true,
              locationEnabled = true,
              userLocation = "Frankfurt, Germany")
      val fullJson = json
      assertTrue(
          fullJson.contains("Frankfurt") || fullJson.contains("location"),
          "Capability reminder should mention location in JSON")
    }

    @Test
    fun addsMailCapabilityReminder() {
      BraveSearch.apiKey = "test-key"
      MailBridge.enabled = true
      val json = builder.buildMessages("Hello", emptyList(), emptyList(), searchEnabled = true)
      val arr = JsonParser.parseString(json).asJsonArray
      val allContent =
          (0 until arr.size())
              .map { arr[it].asJsonObject.get("content")?.asString ?: "" }
              .joinToString(" ")
      assertTrue(
          allContent.contains("mail") || allContent.contains("email"),
          "Should mention mail capability")
    }
  }

  // endregion

  // region Rules and Language

  @Nested
  inner class RulesAndLanguageTest {

    @Test
    fun defaultRulesContainLanguageRule() {
      val json = builder.buildMessages("Hello", emptyList(), emptyList())
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(
          system.contains("LANGUAGE RULE") || system.contains("language"),
          "Default rules should mention language: $system")
    }

    @Test
    fun defaultRulesContainUnitConversion() {
      val json = builder.buildMessages("Hello", emptyList(), emptyList())
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(
          system.contains("metric") || system.contains("imperial") || system.contains("°C"),
          "Default rules should mention units: $system")
    }

    @Test
    fun defaultIdentityContainsDaysInMonth() {
      val json = builder.buildMessages("Hello", emptyList(), emptyList())
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertTrue(system.contains("days"), "Identity prompt should mention days: $system")
    }

    @Test
    fun customIdentityWithTimeSubstitution() {
      val custom =
          MessageBuilder(
              promptIdentity = "Bot here. Date={date} Time={time} Days={daysInMonth}.",
              promptLocation = null,
              promptSearch = null,
              promptThinking = null,
              promptNoInternet = null,
              promptRules = null,
              isExternalMode = false,
              externalNoPrompt = false,
              langService = langService,
              filterResults = false)
      val json = custom.buildMessages("Hi", emptyList(), emptyList())
      val system = JsonParser.parseString(json).asJsonArray[0].asJsonObject.get("content").asString
      assertFalse(system.contains("{date}"), "Should substitute date")
      assertFalse(system.contains("{time}"), "Should substitute time")
      assertFalse(system.contains("{daysInMonth}"), "Should substitute daysInMonth")
      assertTrue(system.startsWith("Bot here."))
    }

    @Test
    fun multipleImagesProducesMultipleParts() {
      val images = listOf("data:image/png;base64,abc", "data:image/png;base64,def")
      val json = builder.buildMessages("Describe", images, emptyList())
      val arr = JsonParser.parseString(json).asJsonArray
      val last = arr[arr.size() - 1].asJsonObject
      val parts = last.get("content").asJsonArray
      assertTrue(parts.size() >= 3, "Should have 2 images + 1 text part")
    }
  }

  // endregion
}
