package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import java.io.File
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

/** Tests for [StandardConfig] validation and computed properties. */
class StandardConfigTest {

  /** Builds a valid default config for use as a baseline. */
  private fun validConfig(
      modelUrl: String = "https://example.com/model.gguf",
      mmprojUrl: String = "https://example.com/mmproj.gguf",
      externalUrl: String? = null,
      externalApiKey: String? = null,
      externalModel: String? = null,
      externalNoPrompt: Boolean = false,
      disableFrequencyPenalty: Boolean = false,
      thinkingModelUrl: String? = null,
      thinkingMmprojUrl: String? = null,
      promptIdentity: String? = null,
      promptLocation: String? = null,
      promptSearch: String? = null,
      promptThinking: String? = null,
      promptNoInternet: String? = null,
      promptRules: String? = null,
      maxPixels: Long = 1_000_000L,
      maxUploadBytes: Long = 10_000_000L,
      maxTokens: Int = 2048,
      maxRAMPercent: Double = 90.0,
      maxComputePercent: Double = 90.0,
      checkIntervalHours: Long = 24L,
      notifyEmail: String? = null,
      pluginFolder: File? = null,
      fallbackLocation: String? = null,
      nominatimDomain: String = "nominatim.openstreetmap.org",
      ipGeolocationDomain: String = "ip-api.com",
      maxSearchRoundTrips: Int = 2,
      forcedLanguage: String? = null,
      specialists: Map<String, StandardConfig.SpecialistEntry> = emptyMap(),
      externalSpecialists: Map<String, StandardConfig.ExternalSpecialistEntry> = emptyMap(),
      maxConcurrent: Int = 3
  ) =
      StandardConfig(
          modelUrl,
          mmprojUrl,
          externalUrl,
          externalApiKey,
          externalModel,
          externalNoPrompt,
          disableFrequencyPenalty,
          thinkingModelUrl,
          thinkingMmprojUrl,
          promptIdentity,
          promptLocation,
          promptSearch,
          promptThinking,
          promptNoInternet,
          promptRules,
          maxPixels,
          maxUploadBytes,
          maxTokens,
          maxRAMPercent,
          maxComputePercent,
          checkIntervalHours,
          notifyEmail,
          pluginFolder,
          fallbackLocation,
          nominatimDomain,
          ipGeolocationDomain,
          maxSearchRoundTrips,
          forcedLanguage,
          specialists,
          externalSpecialists,
          maxConcurrent)

  @Nested
  inner class ValidationTests {

    @Test
    fun validConfigCreatesSuccessfully() {
      assertDoesNotThrow { validConfig() }
    }

    @Test
    fun rejectsZeroMaxPixels() {
      assertThrows<IllegalArgumentException> { validConfig(maxPixels = 0L) }
    }

    @Test
    fun rejectsNegativeMaxPixels() {
      assertThrows<IllegalArgumentException> { validConfig(maxPixels = -1L) }
    }

    @Test
    fun rejectsZeroMaxUploadBytes() {
      assertThrows<IllegalArgumentException> { validConfig(maxUploadBytes = 0L) }
    }

    @Test
    fun rejectsZeroMaxTokens() {
      assertThrows<IllegalArgumentException> { validConfig(maxTokens = 0) }
    }

    @Test
    fun rejectsNegativeMaxTokens() {
      assertThrows<IllegalArgumentException> { validConfig(maxTokens = -100) }
    }

    @Test
    fun rejectsZeroMaxRAMPercent() {
      assertThrows<IllegalArgumentException> { validConfig(maxRAMPercent = 0.0) }
    }

    @Test
    fun rejectsNegativeMaxRAMPercent() {
      assertThrows<IllegalArgumentException> { validConfig(maxRAMPercent = -1.0) }
    }

    @Test
    fun rejectsZeroMaxComputePercent() {
      assertThrows<IllegalArgumentException> { validConfig(maxComputePercent = 0.0) }
    }

    @Test
    fun rejectsBlankNominatimDomain() {
      assertThrows<IllegalArgumentException> { validConfig(nominatimDomain = "") }
    }

    @Test
    fun rejectsWhitespaceNominatimDomain() {
      assertThrows<IllegalArgumentException> { validConfig(nominatimDomain = "   ") }
    }

    @Test
    fun rejectsBlankIpGeolocationDomain() {
      assertThrows<IllegalArgumentException> { validConfig(ipGeolocationDomain = "") }
    }

    @Test
    fun rejectsMaxSearchRoundTripsZero() {
      assertThrows<IllegalArgumentException> { validConfig(maxSearchRoundTrips = 0) }
    }

    @Test
    fun rejectsMaxSearchRoundTripsAboveTen() {
      assertThrows<IllegalArgumentException> { validConfig(maxSearchRoundTrips = 11) }
    }

    @Test
    fun acceptsMaxSearchRoundTripsAtBoundaries() {
      assertDoesNotThrow { validConfig(maxSearchRoundTrips = 1) }
      assertDoesNotThrow { validConfig(maxSearchRoundTrips = 10) }
    }
  }

  @Nested
  inner class ComputedPropertyTests {

    @Test
    fun isExternalModeWhenExternalUrlSet() {
      val config = validConfig(externalUrl = "https://api.openai.com/v1")
      assertTrue(config.isExternalMode)
    }

    @Test
    fun isNotExternalModeWhenExternalUrlNull() {
      val config = validConfig(externalUrl = null)
      assertFalse(config.isExternalMode)
    }

    @Test
    fun hasThinkingModelWhenUrlSet() {
      val config = validConfig(thinkingModelUrl = "https://example.com/thinking.gguf")
      assertTrue(config.hasThinkingModel)
    }

    @Test
    fun hasNoThinkingModelWhenUrlNull() {
      val config = validConfig(thinkingModelUrl = null)
      assertFalse(config.hasThinkingModel)
    }

    @Test
    fun hasSpecialistsWithLocalSpecialists() {
      val config =
          validConfig(
              specialists =
                  mapOf(
                      "code" to
                          StandardConfig.SpecialistEntry("https://example.com/code.gguf", null)))
      assertTrue(config.hasSpecialists)
    }

    @Test
    fun hasSpecialistsWithExternalSpecialists() {
      val config =
          validConfig(
              externalSpecialists =
                  mapOf(
                      "code" to
                          StandardConfig.ExternalSpecialistEntry(
                              "https://api.example.com", null, "gpt-4")))
      assertTrue(config.hasSpecialists)
    }

    @Test
    fun noSpecialistsWhenBothEmpty() {
      val config = validConfig()
      assertFalse(config.hasSpecialists)
    }
  }

  @Nested
  inner class ToStringTests {

    @Test
    fun redactsApiKey() {
      val config = validConfig(externalApiKey = "super-secret-key")
      val str = config.toString()
      assertFalse(str.contains("super-secret-key"))
      assertTrue(str.contains("****"))
    }

    @Test
    fun showsNullWhenNoApiKey() {
      val config = validConfig(externalApiKey = null)
      val str = config.toString()
      assertTrue(str.contains("externalApiKey=null"))
    }

    @Test
    fun includesModelUrl() {
      val config = validConfig(modelUrl = "https://example.com/model.gguf")
      assertTrue(config.toString().contains("https://example.com/model.gguf"))
    }
  }

  @Nested
  inner class SpecialistEntryTests {

    @Test
    fun specialistEntryHoldsFields() {
      val entry =
          StandardConfig.SpecialistEntry(
              "https://example.com/model.gguf", "https://example.com/mmproj.gguf")
      assertEquals("https://example.com/model.gguf", entry.modelUrl)
      assertEquals("https://example.com/mmproj.gguf", entry.mmprojUrl)
    }

    @Test
    fun specialistEntryAllowsNullMmproj() {
      val entry = StandardConfig.SpecialistEntry("https://example.com/model.gguf", null)
      assertNull(entry.mmprojUrl)
    }

    @Test
    fun externalSpecialistEntryHoldsFields() {
      val entry =
          StandardConfig.ExternalSpecialistEntry("https://api.example.com", "key123", "gpt-4")
      assertEquals("https://api.example.com", entry.url)
      assertEquals("key123", entry.apiKey)
      assertEquals("gpt-4", entry.model)
    }

    @Test
    fun externalSpecialistEntryAllowsNulls() {
      val entry = StandardConfig.ExternalSpecialistEntry("https://api.example.com", null, null)
      assertNull(entry.apiKey)
      assertNull(entry.model)
    }
  }
}
