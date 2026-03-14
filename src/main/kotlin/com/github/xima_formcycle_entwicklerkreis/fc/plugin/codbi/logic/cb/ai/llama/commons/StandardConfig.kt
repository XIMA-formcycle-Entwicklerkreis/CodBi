package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import java.io.File

/** Immutable configuration parsed from plugin properties (all `AI_LLAMA_STD_*` keys). */
internal data class StandardConfig(
    val modelUrl: String,
    val mmprojUrl: String,
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
    /**
     * Plugin root folder on disk. `null` when the plugin framework does not provide a folder (e.g.
     * during unit tests or when the plugin is loaded from a non-file source). When `null`, features
     * that depend on local file access are silently skipped:
     * - SMTP mail config lookup ([NotificationService])
     * - Any future file-based caching
     */
    val pluginFolder: File?,
    val fallbackLocation: String?,
    /** Domain used for OpenStreetMap Nominatim reverse geocoding requests. */
    val nominatimDomain: String,
    /** Domain used for IP geolocation requests. */
    val ipGeolocationDomain: String,
    /**
     * Maximum number of search round-trips the model may perform before the answer is returned. On
     * intermediate rounds the model is told it may issue another search if results are
     * insufficient; on the final round it is instructed to give a direct answer. Default: 2.
     */
    val maxSearchRoundTrips: Int = 2
) {
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

  val isExternalMode: Boolean
    get() = externalUrl != null

  val hasThinkingModel: Boolean
    get() = thinkingModelUrl != null

  override fun toString(): String =
      "StandardConfig(modelUrl=$modelUrl, externalUrl=$externalUrl, " +
          "externalApiKey=${if (externalApiKey != null) "****" else "null"}, " +
          "externalModel=$externalModel, maxTokens=$maxTokens, " +
          "maxPixels=$maxPixels, maxRAMPercent=$maxRAMPercent, " +
          "maxComputePercent=$maxComputePercent, isExternalMode=$isExternalMode)"
}
