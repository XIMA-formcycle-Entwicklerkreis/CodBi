package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import java.io.File

/**
 * Immutable configuration parsed from plugin properties (all `AI_LLAMA_STD_*` keys).
 *
 * @param modelUrl Download URL for the main GGUF model.
 * @param mmprojUrl Download URL for the multimodal projection model (vision), or `null` to run
 *   without vision support (text-only mode).
 * @param externalUrl Base URL of an external OpenAI-compatible API, or `null` for local mode.
 * @param externalApiKey API key for the external service, or `null`.
 * @param externalModel Model name to request from the external API, or `null`.
 * @param externalNoPrompt When `true`, skip injecting the system prompt in external mode.
 * @param thinkingModelUrl Download URL for a separate thinking/reasoning model, or `null`.
 * @param thinkingMmprojUrl Download URL for the thinking model's multimodal projection, or `null`.
 * @param promptIdentity Custom identity/system prompt override, or `null` for the built-in default.
 * @param promptLocation Custom location prompt template, or `null`.
 * @param promptSearch Custom search-tool instruction prompt, or `null`.
 * @param promptThinking Custom thinking-mode instruction prompt, or `null`.
 * @param promptNoInternet Custom prompt appended when web search is disabled, or `null`.
 * @param promptRules Custom rules/constraints appended to the system prompt, or `null`.
 * @param maxPixels Maximum total pixels allowed in uploaded images before down-scaling.
 * @param maxUploadBytes Maximum upload size in bytes for image/audio payloads.
 * @param maxTokens Maximum tokens the model may generate per response.
 * @param maxRAMPercent RAM utilization threshold (0–100) above which requests are rejected.
 * @param maxComputePercent Compute utilization threshold (0–100) above which requests are rejected.
 * @param checkIntervalHours Interval (in hours) between llama.cpp release update checks.
 * @param notifyEmail Email address to notify when a new llama.cpp release is available, or `null`.
 * @param pluginFolder Plugin root folder on disk. `null` when the plugin framework does not provide
 *   a folder (e.g. during unit tests or when the plugin is loaded from a non-file source). When
 *   `null`, features that depend on local file access are silently skipped (SMTP mail config
 *   lookup, file-based caching).
 * @param fallbackLocation Default location string used when IP geolocation fails, or `null`.
 * @param nominatimDomain Domain used for OpenStreetMap Nominatim reverse geocoding requests.
 * @param ipGeolocationDomain Domain used for IP geolocation requests.
 * @param maxSearchRoundTrips Maximum number of search round-trips the model may perform before the
 *   answer is returned. On intermediate rounds the model is told it may issue another search if
 *   results are insufficient; on the final round it is instructed to give a direct answer.
 * @param extraParamsJson Optional JSON object string of additional parameters to append to every
 *   API request body (e.g. `{"top_p":0.9,"seed":42}`). Blacklisted keys are silently removed during
 *   parsing. `null` means no extra params.
 * @param priceCurrency ISO 4217 currency code (e.g. `EUR`, `USD`) of the **standard** model's
 *   prices. `null` disables cost display for the standard model even when prices are configured.
 * @param pricePerMInput Price per 1,000,000 **input** tokens for the standard model, or `null` when
 *   the standard model has no configured price.
 * @param pricePerMOutput Price per 1,000,000 **output** tokens for the standard model, or `null`.
 * @param thinkingPriceCurrency ISO 4217 currency code of the **thinking** model's prices, or
 *   `null`.
 * @param thinkingPricePerMInput Price per 1,000,000 input tokens for the thinking model, or `null`.
 * @param thinkingPricePerMOutput Price per 1,000,000 output tokens for the thinking model, or
 *   `null`.
 */
internal data class StandardConfig(
    val modelUrl: String,
    val mmprojUrl: String?,
    val externalUrl: String?,
    val externalApiKey: String?,
    val externalModel: String?,
    val externalNoPrompt: Boolean,
    val thinkingModelUrl: String?,
    val thinkingMmprojUrl: String?,
    val promptIdentity: String?,
    val promptLocation: String?,
    val promptSearch: String?,
    val promptThinking: String?,
    val promptNoInternet: String?,
    val promptRules: String?,
    val maxPixels: Long,
    val maxUploadBytes: Long,
    val maxTokens: Int,
    val maxRAMPercent: Double,
    val maxComputePercent: Double,
    val checkIntervalHours: Long,
    val notifyEmail: String?,
    val pluginFolder: File?,
    val fallbackLocation: String?,
    val nominatimDomain: String,
    val ipGeolocationDomain: String,
    val maxSearchRoundTrips: Int = 2,
    val forcedLanguage: String? = null,
    val specialists: Map<String, SpecialistEntry> = emptyMap(),
    val externalSpecialists: Map<String, ExternalSpecialistEntry> = emptyMap(),
    val maxConcurrent: Int = 3,
    val extraParamsJson: String? = null,
    val priceCurrency: String? = null,
    val pricePerMInput: Double? = null,
    val pricePerMOutput: Double? = null,
    val thinkingPriceCurrency: String? = null,
    val thinkingPricePerMInput: Double? = null,
    val thinkingPricePerMOutput: Double? = null
) {
  /**
   * A local specialist model entry parsed from `AI_LLAMA_STD_SPECIALIST_XXX` plugin properties.
   *
   * @param modelUrl Download URL for the specialist GGUF model.
   * @param mmprojUrl Download URL for the specialist's mmproj file, or `null` if not
   *   vision-capable.
   * @param sha256 Optional SHA-256 digest (lowercase hex) to verify the GGUF after download.
   * @param mmprojSha256 Optional SHA-256 digest (lowercase hex) to verify the mmproj after
   *   download.
   * @param currency ISO 4217 currency code of this specialist's prices, or `null`.
   * @param pricePerMInput Price per 1,000,000 input tokens for this specialist, or `null`.
   * @param pricePerMOutput Price per 1,000,000 output tokens for this specialist, or `null`.
   */
  data class SpecialistEntry(
      val modelUrl: String,
      val mmprojUrl: String?,
      val sha256: String? = null,
      val mmprojSha256: String? = null,
      val currency: String? = null,
      val pricePerMInput: Double? = null,
      val pricePerMOutput: Double? = null
  )

  /**
   * An external specialist entry parsed from `AI_LLAMA_STD_EXT_SPECIALIST_XXX` plugin properties.
   *
   * @param url Base URL of the external OpenAI-compatible API.
   * @param apiKey API key sent as Bearer token, or `null` if not required.
   * @param model Model name to inject into requests, or `null` for the API default.
   * @param maxTokens Maximum tokens this specialist may generate per response, or `null` to fall
   *   back to the global [StandardConfig.maxTokens].
   * @param extraParams Extra JSON parameters injected into every request for this specialist (e.g.
   *   `{"temperature":0.0,"seed":42}`). Overrides the global [extraParamsJson].
   * @param currency ISO 4217 currency code of this specialist's prices, or `null`.
   * @param pricePerMInput Price per 1,000,000 input tokens for this specialist, or `null`.
   * @param pricePerMOutput Price per 1,000,000 output tokens for this specialist, or `null`.
   */
  data class ExternalSpecialistEntry(
      val url: String,
      val apiKey: String?,
      val model: String?,
      val maxTokens: Int? = null,
      val extraParams: String? = null,
      val currency: String? = null,
      val pricePerMInput: Double? = null,
      val pricePerMOutput: Double? = null
  )

  init {
    require(maxPixels > 0) { "maxPixels must be > 0, was $maxPixels" }
    require(maxUploadBytes > 0) { "maxUploadBytes must be > 0, was $maxUploadBytes" }
    require(maxTokens > 0) { "maxTokens must be > 0, was $maxTokens" }
    require(maxRAMPercent > 0.0) { "maxRAMPercent must be > 0, was $maxRAMPercent" }
    require(maxComputePercent > 0.0) { "maxComputePercent must be > 0, was $maxComputePercent" }
    require(nominatimDomain.isNotBlank()) { "nominatimDomain must not be blank" }
    require(ipGeolocationDomain.isNotBlank()) { "ipGeolocationDomain must not be blank" }
    require(maxSearchRoundTrips in 1..10) {
      "maxSearchRoundTrips must be in 1..10, was $maxSearchRoundTrips"
    }
  }

  /** `true` when an external OpenAI-compatible API is configured instead of the local server. */
  val isExternalMode: Boolean
    get() = externalUrl != null

  /** `true` when a separate thinking/reasoning model URL is configured. */
  val hasThinkingModel: Boolean
    get() = thinkingModelUrl != null

  /** `true` when at least one specialist (local or external) is configured. */
  val hasSpecialists: Boolean
    get() = specialists.isNotEmpty() || externalSpecialists.isNotEmpty()

  /**
   * Resolves the configured price per 1,000,000 tokens for the given model id, or `null` when no
   * price (input and output) is configured for that model. The returned [ModelPrice] carries the
   * currency of the resolved model (which may differ between models).
   *
   * @param modelId One of `"standard"`, `"thinking"`, `"specialist:<name>"`,
   *   `"ext-specialist:<name>"`.
   */
  fun priceForModel(modelId: String): ModelPrice? =
      when {
        modelId == "standard" -> buildPrice(priceCurrency, pricePerMInput, pricePerMOutput)
        modelId == "thinking" ->
            buildPrice(thinkingPriceCurrency, thinkingPricePerMInput, thinkingPricePerMOutput)
        modelId.startsWith("specialist:") -> {
          val name = modelId.removePrefix("specialist:")
          val entry =
              specialists.entries.firstOrNull { it.key.equals(name, ignoreCase = true) }?.value
          if (entry == null) null
          else buildPrice(entry.currency, entry.pricePerMInput, entry.pricePerMOutput)
        }
        modelId.startsWith("ext-specialist:") -> {
          val name = modelId.removePrefix("ext-specialist:")
          val entry =
              externalSpecialists.entries
                  .firstOrNull { it.key.equals(name, ignoreCase = true) }
                  ?.value
          if (entry == null) null
          else buildPrice(entry.currency, entry.pricePerMInput, entry.pricePerMOutput)
        }
        else -> null
      }

  /** Builds a [ModelPrice] for the given currency/prices, or `null` when either price is unset. */
  private fun buildPrice(currency: String?, priceIn: Double?, priceOut: Double?): ModelPrice? {
    val input = priceIn ?: return null
    val output = priceOut ?: return null
    return ModelPrice(currency = currency, pricePerMInput = input, pricePerMOutput = output)
  }

  /** Returns a summary string with the API key redacted. */
  override fun toString(): String =
      "StandardConfig(modelUrl=$modelUrl, externalUrl=$externalUrl, " +
          "externalApiKey=${if (externalApiKey != null) "****" else "null"}, " +
          "externalModel=$externalModel, maxTokens=$maxTokens, " +
          "maxPixels=$maxPixels, maxRAMPercent=$maxRAMPercent, " +
          "maxComputePercent=$maxComputePercent, isExternalMode=$isExternalMode)"
}

/**
 * Pricing information for an AI model: the cost per 1,000,000 input/output tokens and the currency
 * the prices are denominated in.
 *
 * @param currency ISO 4217 currency code (e.g. `EUR`, `USD`), or `null` when not configured.
 * @param pricePerMInput Price per 1,000,000 input tokens.
 * @param pricePerMOutput Price per 1,000,000 output tokens.
 */
data class ModelPrice(
    val currency: String?,
    val pricePerMInput: Double,
    val pricePerMOutput: Double
) {
  /**
   * Computes the estimated cost for [tokensIn] input and [tokensOut] output tokens. Returns `null`
   * when the token counts are both zero (nothing consumed).
   */
  fun costFor(tokensIn: Long, tokensOut: Long): Double? {
    val cost = tokensIn / 1_000_000.0 * pricePerMInput + tokensOut / 1_000_000.0 * pricePerMOutput
    return if (cost > 0.0) cost else null
  }
}
