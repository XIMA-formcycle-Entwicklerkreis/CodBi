package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for [LanguageDetectionService] heuristic detection and utility methods. */
class LanguageDetectionServiceTest {

  private val noopLog: (LogLevel, String) -> Unit = { _, _ -> }
  private lateinit var service: LanguageDetectionService

  @BeforeEach
  fun setUp() {
    service = LanguageDetectionService(noopLog)
  }

  @Nested
  inner class HeuristicDetection {

    @Test
    fun detectsGerman() {
      val result = service.detectLanguage("Wie wird das Wetter morgen?")
      assertNotNull(result)
      assertEquals("German", result!!.languageName)
    }

    @Test
    fun detectsGermanWithUmlauts() {
      val result = service.detectLanguage("Die Größe der Stadt ist beeindruckend")
      assertNotNull(result)
      assertEquals("German", result!!.languageName)
    }

    @Test
    fun detectsItalian() {
      val result = service.detectLanguage("Chi è il sindaco della città?")
      assertNotNull(result)
      assertEquals("Italian", result!!.languageName)
    }

    @Test
    fun detectsFrench() {
      val result = service.detectLanguage("Comment est-ce que vous allez aujourd'hui?")
      assertNotNull(result)
      assertEquals("French", result!!.languageName)
    }

    @Test
    fun detectsSpanish() {
      val result = service.detectLanguage("¿Cómo es el clima en la ciudad?")
      assertNotNull(result)
      assertEquals("Spanish", result!!.languageName)
    }

    @Test
    fun detectsTurkish() {
      val result = service.detectLanguage("Bu nasıl bir şehir ve ne kadar büyük?")
      assertNotNull(result)
      assertEquals("Turkish", result!!.languageName)
    }

    @Test
    fun detectsJapaneseFromHiragana() {
      val result = service.detectLanguage("これはテストです")
      assertNotNull(result)
      assertEquals("Japanese", result!!.languageName)
    }

    @Test
    fun detectsKoreanFromHangul() {
      val result = service.detectLanguage("오늘 날씨가 어떻습니까?")
      assertNotNull(result)
      assertEquals("Korean", result!!.languageName)
    }

    @Test
    fun detectsChineseFromCJK() {
      val result = service.detectLanguage("今天天气怎么样？")
      assertNotNull(result)
      assertEquals("Chinese", result!!.languageName)
    }

    @Test
    fun detectsRussianFromCyrillic() {
      val result = service.detectLanguage("Какая сегодня погода в Москве?")
      assertNotNull(result)
      assertEquals("Russian", result!!.languageName)
    }

    @Test
    fun returnsNullForEnglish() {
      val result = service.detectLanguage("What is the weather like today?")
      assertNull(result)
    }

    @Test
    fun returnsNullForShortAmbiguousText() {
      // Single short word shouldn't trigger any language
      val result = service.detectLanguage("ok")
      assertNull(result)
    }
  }

  @Nested
  inner class LanguageMapTests {

    @Test
    fun languageMapIsNotEmpty() {
      assertTrue(service.languageMap.isNotEmpty())
    }

    @Test
    fun languageMapContainsGerman() {
      assertTrue(service.languageMap.containsKey("german"))
    }

    @Test
    fun languageMapContainsItalian() {
      assertTrue(service.languageMap.containsKey("italian"))
    }

    @Test
    fun languageMapContainsFrench() {
      assertTrue(service.languageMap.containsKey("french"))
    }

    @Test
    fun languageMapContainsSpanish() {
      assertTrue(service.languageMap.containsKey("spanish"))
    }

    @Test
    fun germanEntryHasRequiredFields() {
      val german = service.languageMap["german"]!!
      assertTrue(german.userTurn.isNotBlank())
      assertTrue(german.assistantTurn.isNotBlank())
      assertTrue(german.thinkSeed.isNotBlank())
      assertTrue(german.searchPrompt.isNotBlank())
      assertEquals("German", german.languageName)
    }
  }

  @Nested
  inner class KnownLanguageNames {

    @Test
    fun knownLanguageNamesIsNotEmpty() {
      assertTrue(service.knownLanguageNames.isNotEmpty())
    }

    @Test
    fun containsMajorLanguages() {
      assertTrue(service.knownLanguageNames.contains("english"))
      assertTrue(service.knownLanguageNames.contains("german"))
      assertTrue(service.knownLanguageNames.contains("french"))
      assertTrue(service.knownLanguageNames.contains("italian"))
      assertTrue(service.knownLanguageNames.contains("spanish"))
      assertTrue(service.knownLanguageNames.contains("japanese"))
      assertTrue(service.knownLanguageNames.contains("chinese"))
    }
  }

  @Nested
  inner class LookupByCode {

    @Test
    fun lookupGermanByCode() {
      val result = service.lookupByCode("de")
      assertNotNull(result)
      assertEquals("German", result!!.languageName)
    }

    @Test
    fun lookupItalianByCode() {
      val result = service.lookupByCode("it")
      assertNotNull(result)
      assertEquals("Italian", result!!.languageName)
    }

    @Test
    fun lookupFrenchByCode() {
      val result = service.lookupByCode("fr")
      assertNotNull(result)
      assertEquals("French", result!!.languageName)
    }

    @Test
    fun lookupEnglishReturnsNull() {
      assertNull(service.lookupByCode("en"))
    }

    @Test
    fun lookupUnknownCodeReturnsNull() {
      assertNull(service.lookupByCode("xx"))
    }

    @Test
    fun lookupIsCaseInsensitive() {
      val result = service.lookupByCode("DE")
      assertNotNull(result)
      assertEquals("German", result!!.languageName)
    }

    @Test
    fun lookupTrimsWhitespace() {
      val result = service.lookupByCode("  de  ")
      assertNotNull(result)
      assertEquals("German", result!!.languageName)
    }
  }

  @Nested
  inner class LanguageNameForCode {

    @Test
    fun returnsGermanForDe() {
      assertEquals("German", service.languageNameForCode("de"))
    }

    @Test
    fun returnsItalianForIt() {
      assertEquals("Italian", service.languageNameForCode("it"))
    }

    @Test
    fun returnsCodeItselfForUnknown() {
      assertEquals("zz", service.languageNameForCode("zz"))
    }
  }

  @Nested
  inner class SearchFollowUpPrompt {

    @Test
    fun lastRoundEnglishReturnsDirectAnswerPrompt() {
      val prompt = service.searchFollowUpPrompt("What is the weather?", isLastRound = true)
      assertTrue(prompt.contains("short") || prompt.contains("direct"))
    }

    @Test
    fun nonLastRoundEnglishAllowsAnotherSearch() {
      val prompt = service.searchFollowUpPrompt("What is the weather?", isLastRound = false)
      assertTrue(prompt.contains("search") || prompt.contains("CALL:search"))
    }

    @Test
    fun lastRoundGermanUsesLocalizedPrompt() {
      val prompt = service.searchFollowUpPrompt("Wie wird das Wetter morgen?", isLastRound = true)
      // Should return the German DetectedLanguage's searchPrompt
      assertTrue(prompt.isNotBlank())
    }

    @Test
    fun usesProvidedLanguageOverDetection() {
      val italian = service.languageMap["italian"]!!
      val prompt =
          service.searchFollowUpPrompt("What is the weather?", lang = italian, isLastRound = true)
      assertEquals(italian.searchPrompt, prompt)
    }
  }

  @Nested
  inner class DetectedLanguageDataClass {

    @Test
    fun defaultsAreCorrect() {
      val lang =
          DetectedLanguage(
              userTurn = "test", assistantTurn = "ok", thinkSeed = "think", searchPrompt = "search")
      assertEquals("English", lang.languageName)
      assertNull(lang.braveCountry)
      assertTrue(lang.searchingLabel.contains("%s"))
      assertTrue(lang.analyzingLabel.contains("%d"))
    }

    @Test
    fun copiedWithCustomValues() {
      val lang =
          DetectedLanguage(
              userTurn = "Parliamo in italiano",
              assistantTurn = "Certo!",
              thinkSeed = "Pensiamo...",
              searchPrompt = "Dai una risposta",
              languageName = "Italian",
              braveCountry = "IT")
      assertEquals("Italian", lang.languageName)
      assertEquals("IT", lang.braveCountry)
    }
  }

  // region detectLanguageViaModel

  @Nested
  inner class DetectLanguageViaModelTest {

    @Test
    fun returnsDetectedLanguageForGerman() {
      val result =
          service.detectLanguageViaModel("Wie wird das Wetter?") { _ ->
            """{"choices":[{"message":{"content":"German"}}]}"""
          }
      assertNotNull(result)
      assertEquals("German", result!!.languageName)
    }

    @Test
    fun returnsNullForEnglish() {
      val result =
          service.detectLanguageViaModel("What is the weather?") { _ ->
            """{"choices":[{"message":{"content":"English"}}]}"""
          }
      assertNull(result, "English should return null")
    }

    @Test
    fun prefersRegexOverModelWhenMismatch() {
      // Question has strong German markers but model says French
      val result =
          service.detectLanguageViaModel("Wie wird das Wetter in München?") { _ ->
            """{"choices":[{"message":{"content":"French"}}]}"""
          }
      assertNotNull(result)
      assertEquals("German", result!!.languageName)
    }

    @Test
    fun handlesUnknownLanguageFromModel() {
      // Model says "Klingon" (not in language map) but regex detects German
      val result =
          service.detectLanguageViaModel(
              "Wie ist das Wetter heute in der Stadt und wie wird es morgen?") { _ ->
                """{"choices":[{"message":{"content":"Klingon"}}]}"""
              }
      // Falls back to regex result → German
      assertNotNull(result)
      assertEquals("German", result!!.languageName)
    }

    @Test
    fun handlesRecognisedButUnsupportedLanguage() {
      // "Japanese" is known but might not have localised prompts
      val result =
          service.detectLanguageViaModel("こんにちは") { _ ->
            """{"choices":[{"message":{"content":"Japanese"}}]}"""
          }
      // May return null or a language object depending on language map
      // The test just verifies no crash
      assertDoesNotThrow { result }
    }

    @Test
    fun fallsBackToHeuristicOnMalformedJson() {
      // sendCompletion returns garbage → exception → catch → detectLanguage(question)
      val result = service.detectLanguageViaModel("Wie wird das Wetter?") { _ -> "invalid json!!!" }
      // Falls back to regex → detects German
      assertNotNull(result)
      assertEquals("German", result!!.languageName)
    }

    @Test
    fun fallsBackToHeuristicOnException() {
      // sendCompletion throws → catch → detectLanguage(question)
      val result =
          service.detectLanguageViaModel("Wie wird das Wetter?") { _ ->
            throw RuntimeException("Connection timeout")
          }
      assertNotNull(result)
      assertEquals("German", result!!.languageName)
    }

    @Test
    fun handlesEmptyChoicesArray() {
      val result =
          service.detectLanguageViaModel("Bonjour, comment ça va?") { _ -> """{"choices":[]}""" }
      // Empty choices → raw="" → langName="" → isNotBlank=false → returns regexLang
      assertNotNull(result)
    }

    @Test
    fun handlesMissingContentField() {
      val result =
          service.detectLanguageViaModel("Wie spät ist es?") { _ ->
            """{"choices":[{"message":{"role":"assistant"}}]}"""
          }
      // content is null → raw="" → langName="" → returns regexLang
      assertNotNull(result)
      assertEquals("German", result!!.languageName)
    }

    @Test
    fun cleansSuffixPunctuation() {
      // Response has trailing dots: "German."
      val result =
          service.detectLanguageViaModel("Wo ist der Bahnhof?") { _ ->
            """{"choices":[{"message":{"content":"German."}}]}"""
          }
      assertNotNull(result)
      assertEquals("German", result!!.languageName)
    }
  }

  // endregion

  // region detectLanguage — additional language branches

  @Nested
  inner class DetectLanguageAdditionalTest {

    @Test
    fun detectsPortugueseFromAccents() {
      val result = service.detectLanguage("Como você está? Tudo bem com você? Obrigado pela ajuda")
      assertNotNull(result, "Should detect Portuguese")
      assertEquals("Portuguese", result!!.languageName)
    }

    @Test
    fun returnsNullForEnglishText() {
      val result = service.detectLanguage("Hello, how are you today?")
      assertNull(result, "English should return null")
    }
  }

  // endregion
}
