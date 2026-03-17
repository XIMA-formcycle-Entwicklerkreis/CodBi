package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama

// region Imports
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.BraveSearch
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.LLAMA
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons.*
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.plugin.exception.FCPluginException
import java.io.File
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

// endregion Imports
/**
 * Standard — Generic GGUF model runner via local LLAMA-Server process. All AI computation happens
 * in the external LLAMA-Server process. If it OOMs the Tomcat JVM stays alive — only the
 * LLAMA-Server dies.
 *
 * ## Plugin Properties
 * |Property                            |Type   |Default                       |Description                                                                                                                                                                 |
 * |------------------------------------|-------|------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
 * |`Active_AI`                         |String |—                             |Must contain `llama_std` to activate this model                                                                                                                             |
 * |`AI_LLAMA_STD_ModelUrl`             |URL    |Qwen3-VL-2B Q4_K_M HuggingFace|Download URL for the GGUF model file                                                                                                                                        |
 * |`AI_LLAMA_STD_MmprojUrl`            |URL    |Qwen3-VL-2B mmproj HuggingFace|Download URL for the vision projector (mmproj) file                                                                                                                         |
 * |`AI_LLAMA_STD_MaxPixels`            |Long   |`3211264`                     |Max pixel budget for image downscaling (min 3136)                                                                                                                           |
 * |`AI_LLAMA_STD_MaxUploadBytes`       |Long   |`52428800`                    |Max raw image size in bytes before decoding (default 50 MB, min 1 MB)                                                                                                       |
 * |`AI_LLAMA_STD_MaxTokens`            |Int    |`2048`                        |Maximum tokens to generate per response                                                                                                                                     |
 * |`AI_LLAMA_STD_MaxRAMPercent`        |Double |`101.0`                       |RAM usage threshold (%) — blocks requests when exceeded                                                                                                                     |
 * |`AI_LLAMA_STD_MaxComputePercent`    |Double |`101.0`                       |Compute usage threshold (%) — gates on GPU% (CUDA) or CPU% (fallback). Blocks requests when exceeded                                                                        |
 * |`AI_LLAMA_STD_MaxCPUPercent`        |Double |—                             |Legacy alias for MaxComputePercent (accepted as fallback)                                                                                                                   |
 * |`AI_LLAMA_STD_LlamaRelease`         |String |`b8175`                       |llama.cpp release tag for server binary download                                                                                                                            |
 * |`AI_LLAMA_STD_ServerUrl_<platform>` |URL    |(auto from release tag)       |Per-platform override for the LLAMA-Server binary URL                                                                                                                       |
 * |`AI_LLAMA_STD_UpdateCheckHours`     |Long   |`24`                          |Hours between GitHub release checks (0 = disabled)                                                                                                                          |
 * |`AI_LLAMA_STD_NotifyEmail`          |String |—                             |Email address for update notifications                                                                                                                                      |
 * |`AI_LLAMA_STD_ThinkingModelUrl`     |URL    |—                             |Download URL for a dedicated thinking model GGUF (optional)                                                                                                                 |
 * |`AI_LLAMA_STD_ThinkingMmprojUrl`    |URL    |—                             |Download URL for the thinking model's mmproj file (optional)                                                                                                                |
 * |`AI_LLAMA_STD_ExternalUrl`          |URL    |—                             |Base URL of an external OpenAI-compatible API; overrides local model                                                                                                        |
 * |`AI_LLAMA_STD_ExternalApiKey`       |String |—                             |API key for the external AI (sent as Bearer token)                                                                                                                          |
 * |`AI_LLAMA_STD_ExternalModel`        |String |—                             |Model name for the external API (e.g. gpt-4o, claude-3-opus)                                                                                                                |
 * |`AI_LLAMA_STD_ExternalNoPrompt`     |Boolean|`false`                       |When `true`, skips all built-in system-prompt sections (§1–§6) for the external AI — sends only the user message and chat history.                                          |
 * |`AI_LLAMA_STD_PromptIdentity`       |String |(built-in)                    |Override the identity/role sentence ("You are a helpful assistant..."). Use `{date}` for today's date, `{time}` for current time.                                           |
 * |`AI_LLAMA_STD_PromptLocation`       |String |(built-in)                    |Override the location-context instruction. Use `{location}` as placeholder.                                                                                                 |
 * |`AI_LLAMA_STD_PromptSearch`         |String |(built-in)                    |Override the CALL:search instruction block (before examples).                                                                                                               |
 * |`AI_LLAMA_STD_PromptThinking`       |String |(built-in)                    |Override the thinking-mode instruction. Use `{language}` as placeholder.                                                                                                    |
 * |`AI_LLAMA_STD_PromptNoInternet`     |String |(built-in)                    |Override the no-internet-access warning.                                                                                                                                    |
 * |`AI_LLAMA_STD_PromptRules`          |String |(built-in)                    |Override the general rules (language, measurements, independence).                                                                                                          |
 * |`AI_LLAMA_STD_FallbackLocation`     |String |—                             |Fallback location string used when geolocation fails (e.g. `Ansbach, Nürnberger Straße 32, Bayern, Deutschland`)                                                            |
 * |`AI_LLAMA_STD_NominatimDomain`      |String |`nominatim.openstreetmap.org` |Domain for reverse geocoding requests (without path).                                                                                                                       |
 * |`AI_LLAMA_STD_IpGeolocationDomain`  |String |`ipwho.is`                    |Domain for IP geolocation requests (without path).                                                                                                                          |
 * |`AI_BraveSearch_ApiKey`             |String |—                             |Brave Search API key — enables web search tool for the model                                                                                                                |
 * |`AI_LLAMA_STD_Language`             |String |—                             |Two-letter ISO 639-1 code (e.g. `de`, `fr`) — forces the AI to respond in this language, skipping auto-detection. Overridden by per-functionality `responselanguage` toLoad.|
 * |`AI_LLAMA_STD_SPECIALIST_XXX`       |URL    |—                             |Download URL for a specialist GGUF model named `XXX`. The name is chosen by the administrator and matched case-insensitively by the `specialist` toLoad property.           |
 * |`AI_LLAMA_STD_SPECIALIST_MMProj_XXX`|URL    |—                             |Download URL for the specialist `XXX`'s multimodal projector (mmproj). Optional — omit if the specialist model has no vision capability.                                    |
 *
 * ## Domains to whitelist
 * - **github.com** — LLAMA-Server binary releases & release-check API
 * - **api.github.com** — latest-release version checks
 * - **objects.githubusercontent.com** — GitHub release asset CDN
 * - **huggingface.co** — GGUF model & mmproj downloads
 * - **nominatim.openstreetmap.org** — reverse geocoding for location context
 * - **ipwho.is** — IP-based geolocation fallback
 * - **api.search.brave.com** — Brave web search (only when `AI_BraveSearch_ApiKey` is configured)
 */
class Standard : LLAMA() {
  // region Constants
  /** Companion for static members. */
  companion object {
    /** Plugin property name prefix for this model. */
    private const val PROP_PREFIX = "AI_LLAMA_STD"
    /** Default GGUF model URL: Qwen3-VL-2B-Instruct Q4_K_M quantization (~1.1 GB). */
    private const val DEFAULT_MODEL_URL =
        "https://huggingface.co/Qwen/Qwen3-VL-2B-Instruct-GGUF/resolve/main/Qwen3VL-2B-Instruct-Q4_K_M.gguf"
    /** Default mmproj (multimodal vision projector) URL (~819 MB). */
    private const val DEFAULT_MMPROJ_URL =
        "https://huggingface.co/Qwen/Qwen3-VL-2B-Instruct-GGUF/resolve/main/mmproj-Qwen3VL-2B-Instruct-F16.gguf"
    /** GitHub API endpoint for the latest llama.cpp release. */
    private const val GITHUB_RELEASES_API =
        "https://api.github.com/repos/ggml-org/llama.cpp/releases/latest"
    /** Default interval (hours) between update checks. 0 = disabled. */
    private const val DEFAULT_CHECK_INTERVAL_HOURS = 24L
    /** Default domain for OpenStreetMap Nominatim reverse geocoding. */
    private const val DEFAULT_NOMINATIM_DOMAIN = "nominatim.openstreetmap.org"
    /** Default domain for IP geolocation fallback requests. */
    private const val DEFAULT_IP_GEOLOCATION_DOMAIN = "ipwho.is"
  }

  // endregion Constants
  // region Fields
  /** Immutable configuration parsed from plugin properties. */
  private lateinit var config: StandardConfig
  // region Thinking model state
  private var thinkingModelFile: File? = null
  /** The multimodal vision projector file for the thinking model. */
  private var thinkingMmprojFile: File? = null
  /** The server manager for the thinking model. */
  private var thinkingServer: ThinkingServerManager? = null
  /** Whether the thinking server is ready to accept requests. */
  private val thinkingServerReady: Boolean
    get() = thinkingServer?.isReady == true

  /** The port on which the thinking server is listening. */
  private val thinkingServerPort: Int
    get() = thinkingServer?.port ?: 0

  // endregion Thinking model state
  // region Specialist model state
  /** Active specialist server managers, keyed by lowercase specialist name. */
  private val specialistServers = ConcurrentHashMap<String, SpecialistServerManager>()
  /** Whether all specialist servers have been processed (started or failed). */
  @Volatile private var specialistsReady = false
  // endregion Specialist model state
  // region Model state
  /** The resource monitor for the standard model. */
  private var resourceMonitor: ResourceMonitor? = null
  /** The file for the standard model. */
  private var modelFile: File? = null
  /** The multimodal vision projector file for the standard model. */
  private var mmprojFile: File? = null
  /** The error encountered during model loading, if any. */
  @Volatile private var loadError: Throwable? = null
  /** Whether the standard model server is ready to accept requests. */
  @Volatile private var serverReady = false
  // endregion Model state
  // region Thread pool
  /** Counter for active threads in the executor service. */
  private val threadCounter = AtomicInteger(0)
  /** The executor service for managing background tasks. */
  private var executor: ExecutorService? = null
  // endregion Thread pool
  // region Service instances
  /** The image processing service instance. */
  private var imageService: ImageProcessingService? = null
  /** The geolocation service instance. */
  private var geoService: GeoLocationService? = null
  /** The language detection service instance. */
  private var langService: LanguageDetectionService? = null
  /** The notification service instance. */
  private var notificationService: NotificationService? = null
  /** The external AI client instance. */
  private var externalClient: ExternalAiClient? = null
  /** The message builder instance. */
  private var messageBuilder: MessageBuilder? = null
  /** The chat completion service instance. */
  private var chatCompletionService: ChatCompletionService? = null
  /** The web search handler instance. */
  private var webSearchHandler: WebSearchHandler? = null
  // endregion Service instances
  // endregion Fields

  // region Token Streaming Infrastructure
  // StreamingSession is now a standalone class -- see StreamingSession.kt

  /**
   * Active streaming sessions, keyed by UUID. Cleaned up on completion or after TTL (5 min normal,
   * 10 min thinking).
   */
  private val streamingSessions = ConcurrentHashMap<String, StreamingSession>()

  /** Slots currently occupied by an active streaming request (slot → count). */
  private val activeStreamingSlots = ConcurrentHashMap<Int, Int>()

  /** Removes streaming sessions past their TTL: 5 min for normal, 10 min for thinking mode. */
  private fun cleanupStaleSessions() {
    streamingSessions.entries.removeIf {
      val ttl = if (it.value.enableThinking) 10 * 60 * 1000L else 5 * 60 * 1000L

      it.value.startTime + ttl < System.currentTimeMillis()
    }
  }

  // endregion Token Streaming Infrastructure

  // region Resource Monitoring
  // Extracted to standalone ResourceMonitor class -- see ResourceMonitor.kt
  // endregion Resource Monitoring
  // region Lifecycle
  /** @return The unique plugin name used for servlet registration. */
  override fun getName(): String = "CodBi_AI_LLAMA_STD"

  /**
   * Reads all `$PROP_PREFIX`-prefixed plugin properties and returns an immutable [StandardConfig].
   *
   * @param configData The plugin initialization payload containing all configured properties.
   * @return The parsed and validated immutable runtime configuration.
   */
  private fun readPluginProperties(configData: IPluginInitializeData): StandardConfig {
    val props = configData.properties
    fun str(key: String): String? =
        props.getProperty("${PROP_PREFIX}_$key")?.trim()?.takeIf { it.isNotEmpty() }
    fun int(key: String): Int? = props.getProperty("${PROP_PREFIX}_$key")?.trim()?.toIntOrNull()
    fun dbl(key: String): Double? =
        props.getProperty("${PROP_PREFIX}_$key")?.trim()?.toDoubleOrNull()
    fun lng(key: String): Long? = props.getProperty("${PROP_PREFIX}_$key")?.trim()?.toLongOrNull()

    // Side effects on LLAMA base class
    str("LlamaRelease")?.let { customRelease ->
      llamaRelease = customRelease
      serverUrls.clear()
      serverUrls.putAll(buildServerUrls(customRelease))
      log(LogLevel.INFO, "Llama release overridden to: $customRelease")
    }
    serverUrls.keys.toList().forEach { platform ->
      str("ServerUrl_$platform")?.let { serverUrls[platform] = it }
    }
    props
        .getProperty("AI_BraveSearch_ApiKey")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { BraveSearch.apiKey = it }

    val noPromptRaw = props.getProperty("${PROP_PREFIX}_ExternalNoPrompt")?.trim()?.lowercase()
    return StandardConfig(
        modelUrl = str("ModelUrl") ?: DEFAULT_MODEL_URL,
        mmprojUrl = str("MmprojUrl") ?: DEFAULT_MMPROJ_URL,
        externalUrl = str("ExternalUrl")?.trimEnd('/'),
        externalApiKey = str("ExternalApiKey"),
        externalModel = str("ExternalModel"),
        externalNoPrompt = noPromptRaw == "true" || noPromptRaw == "1" || noPromptRaw == "yes",
        thinkingModelUrl = str("ThinkingModelUrl"),
        thinkingMmprojUrl = str("ThinkingMmprojUrl"),
        promptIdentity = str("PromptIdentity"),
        promptLocation = str("PromptLocation"),
        promptSearch = str("PromptSearch"),
        promptThinking = str("PromptThinking"),
        promptNoInternet = str("PromptNoInternet"),
        promptRules = str("PromptRules"),
        maxPixels = lng("MaxPixels")?.takeIf { it >= 3136 } ?: 3_211_264L,
        maxUploadBytes = lng("MaxUploadBytes")?.takeIf { it >= 1_048_576 } ?: (50L * 1024 * 1024),
        maxTokens = int("MaxTokens")?.takeIf { it > 0 } ?: 2048,
        maxRAMPercent = dbl("MaxRAMPercent")?.takeIf { it in 1.0..110.0 } ?: 101.0,
        maxComputePercent =
            (dbl("MaxComputePercent") ?: dbl("MaxCPUPercent"))?.takeIf { it in 1.0..110.0 }
                ?: 101.0,
        checkIntervalHours =
            lng("UpdateCheckHours")?.takeIf { it >= 0 } ?: DEFAULT_CHECK_INTERVAL_HOURS,
        notifyEmail = str("NotifyEmail"),
        pluginFolder = configData.fileHelper.pluginFolder,
        fallbackLocation = str("FallbackLocation"),
        nominatimDomain = str("NominatimDomain") ?: DEFAULT_NOMINATIM_DOMAIN,
        ipGeolocationDomain = str("IpGeolocationDomain") ?: DEFAULT_IP_GEOLOCATION_DOMAIN,
        maxSearchRoundTrips = int("MaxSearchRoundTrips")?.takeIf { it in 1..10 } ?: 2,
        forcedLanguage = str("Language")?.trim()?.takeIf { it.length == 2 },
        specialists = parseSpecialists(props))
  }

  /**
   * Scans all plugin properties for `AI_LLAMA_STD_SPECIALIST_XXX` entries (excluding
   * `SPECIALIST_MMProj_`) and pairs each with its optional `SPECIALIST_MMProj_XXX` counterpart.
   *
   * @param props The raw plugin properties map.
   * @return A case-preserving map of specialist name → [StandardConfig.SpecialistEntry].
   */
  private fun parseSpecialists(
      props: java.util.Properties
  ): Map<String, StandardConfig.SpecialistEntry> {
    val prefix = "${PROP_PREFIX}_SPECIALIST_"
    val mmprojPrefix = "${PROP_PREFIX}_SPECIALIST_MMProj_"
    val specialists = mutableMapOf<String, StandardConfig.SpecialistEntry>()

    for (key in props.stringPropertyNames()) {
      if (!key.startsWith(prefix)) continue
      // Skip MMProj entries — they're looked up as companions below
      if (key.startsWith(mmprojPrefix)) continue

      val specialistName = key.removePrefix(prefix).trim()
      if (specialistName.isEmpty()) continue

      val modelUrl = props.getProperty(key)?.trim()?.takeIf { it.isNotEmpty() } ?: continue
      val mmprojUrl =
          props.getProperty("${mmprojPrefix}$specialistName")?.trim()?.takeIf { it.isNotEmpty() }

      specialists[specialistName] =
          StandardConfig.SpecialistEntry(modelUrl = modelUrl, mmprojUrl = mmprojUrl)
    }

    return specialists
  }

  /**
   * Reads all plugin properties, downloads model files if needed, launches the LLAMA-Server
   * process, and starts the resource monitor and version-check daemon.
   *
   * Does nothing if `Active_AI` does not contain `llama_std`.
   *
   * @param configData The formcycle initialisation payload containing plugin properties and file
   *   helpers.
   */
  override fun initialize(configData: IPluginInitializeData) {
    idLogMessages = "LlamaSrv"
    // Check activation: must contain "llama_std" (case-insensitive)
    val activeAiRaw = configData.properties.getProperty("Active_AI") ?: ""
    val activeAi = activeAiRaw.lowercase()

    if (!activeAi.contains("llama_std")) {
      log(LogLevel.INFO, "Standard initialization skipped because Active_AI='$activeAiRaw'")

      return
    }

    // Reset stale state from any previous initialization attempt
    loadError = null
    serverReady = false
    specialistsReady = false

    super.initialize(configData) // Let base class set up directories and read LLAMA properties
    config = readPluginProperties(configData)
    // region Create services
    val logFn: (LogLevel, String) -> Unit = { level, msg -> log(level, msg) }

    imageService = ImageProcessingService(config.maxPixels, config.maxUploadBytes, logFn)
    geoService = GeoLocationService(logFn, config.nominatimDomain, config.ipGeolocationDomain)
    langService = LanguageDetectionService(logFn)

    val platform = detectPlatform()

    executor?.shutdownNow()
    executor =
        Executors.newCachedThreadPool { r ->
          Thread(r, "codbi-llama-${threadCounter.getAndIncrement()}").apply { isDaemon = true }
        }

    notificationService =
        NotificationService(
            llamaRelease = llamaRelease,
            platformKey = "${platform.os}_${platform.arch}",
            notifyEmail = config.notifyEmail,
            pluginFolder = config.pluginFolder,
            llamaEngineDir = llamaEngineDir!!,
            propPrefix = PROP_PREFIX,
            githubReleasesApi = GITHUB_RELEASES_API,
            buildServerUrls = ::buildServerUrls,
            log = logFn,
            executor = executor!!)

    if (config.externalUrl != null) {
      externalClient =
          ExternalAiClient(config.externalUrl!!, config.externalApiKey, config.externalModel, logFn)
    }

    thinkingServer =
        ThinkingServerManager(
            mainServerPort = serverPort,
            threadCount = threadCount,
            gpuLayers = gpuLayers,
            detectedGpu = detectedGpu,
            ctxSize = ctxSize,
            parallelSlots = parallelSlots,
            extraServerArgs = extraServerArgs,
            detectPhysicalCores = ::detectPhysicalCores,
            log = logFn)

    messageBuilder =
        MessageBuilder(
            promptIdentity = config.promptIdentity,
            promptLocation = config.promptLocation,
            promptSearch = config.promptSearch,
            promptThinking = config.promptThinking,
            promptNoInternet = config.promptNoInternet,
            promptRules = config.promptRules,
            isExternalMode = config.isExternalMode,
            externalNoPrompt = config.externalNoPrompt,
            langService = langService!!)

    chatCompletionService =
        ChatCompletionService(
            serverPort = { serverPort },
            maxTokens = { config.maxTokens },
            isExternalMode = { config.isExternalMode },
            externalUrl = { config.externalUrl },
            thinkingServerReady = { thinkingServerReady },
            thinkingServerPort = { thinkingServerPort },
            localPost = ::httpPost,
            localPostStreaming = ::httpPostStreaming,
            externalPost =
                externalClient?.let { c -> { e: String, b: String, t: Int -> c.post(e, b, t) } },
            externalPostStreaming =
                externalClient?.let { c ->
                  { e: String, b: String, ol: (String) -> Unit, ss: () -> Boolean, t: Int ->
                    c.postStreaming(e, b, ol, ss, t)
                  }
                },
            injectModelField = externalClient?.let { c -> { b: String -> c.injectModelField(b) } },
            log = logFn)

    webSearchHandler =
        WebSearchHandler(
            maxSearchRoundTrips = config.maxSearchRoundTrips,
            searchFollowUpPrompt = { q, dl, last ->
              langService!!.searchFollowUpPrompt(q, dl, last)
            },
            buildMessages = { q, ip, ch, se, et, dl, le, ul ->
              messageBuilder!!.buildMessages(q, ip, ch, se, et, dl, le, ul)
            },
            chatCompletion = { mj, et, ids, mt ->
              chatCompletionService!!.chatCompletion(mj, et, ids, mt)
            },
            streamChatCompletion = { mj, s, et, ids ->
              chatCompletionService!!.streamChatCompletion(mj, s, et, ids)
            },
            log = logFn)

    // endregion Create services
    // region Log server state.
    log(LogLevel.INFO, "Llama release: $llamaRelease")
    log(LogLevel.INFO, "Model URL:   ${config.modelUrl}")
    log(LogLevel.INFO, "mmproj URL:  ${config.mmprojUrl}")
    log(LogLevel.INFO, "MaxPixels:   ${config.maxPixels}")
    log(LogLevel.INFO, "MaxUpload:   ${config.maxUploadBytes / (1024 * 1024)} MB")
    log(LogLevel.INFO, "MaxTokens:   ${config.maxTokens}")

    if (config.isExternalMode) {
      log(
          LogLevel.INFO,
          "External AI: ${config.externalUrl} (model: ${config.externalModel ?: "default"})")
    }

    if (config.hasThinkingModel) {
      log(LogLevel.INFO, "Thinking model URL:   ${config.thinkingModelUrl}")
      log(LogLevel.INFO, "Thinking mmproj URL:  ${config.thinkingMmprojUrl}")
    } else {
      log(LogLevel.INFO, "Thinking model: hybrid mode (no separate model configured)")
    }

    if (config.hasSpecialists) {
      log(LogLevel.INFO, "Specialists: ${config.specialists.size} configured")
      for ((name, entry) in config.specialists) {
        log(LogLevel.INFO, "  $name: ${entry.modelUrl}")
        if (entry.mmprojUrl != null) log(LogLevel.INFO, "    mmproj: ${entry.mmprojUrl}")
      }
    } else {
      log(LogLevel.INFO, "Specialists: none configured")
    }

    log(
        LogLevel.INFO,
        "BraveSearch: ${if (BraveSearch.isAvailable) "enabled" else "disabled (no API key)"}")
    log(
        LogLevel.INFO,
        "Update check: every ${config.checkIntervalHours}h" +
            (if (config.checkIntervalHours == 0L) " (disabled)" else ""))

    if (config.isExternalMode) {
      log(LogLevel.INFO, "External AI mode — skipping local model download and server startup")
      log(LogLevel.INFO, "  URL:   ${config.externalUrl}")
      log(
          LogLevel.INFO,
          "  Model: ${config.externalModel ?: "(not set — WARNING: most APIs require a model name)"}")
      log(
          LogLevel.INFO,
          "  Key:   ${if (config.externalApiKey != null) "(set, ${config.externalApiKey!!.length} chars)" else "(not set)"}")

      isActive = true
      serverReady = true
      // Start resource monitor (still useful for resource-gate even with external AI)
      startResourceMonitor(logFn)
      notificationService?.start(config.checkIntervalHours)
      log(LogLevel.INFO, "Standard (external) initialized and ready for requests")

      return
    }
    // endregion Log server state.
    // Start resource monitor
    startResourceMonitor(logFn)

    executor!!.submit {
      try {
        val platform = detectPlatform()

        log(LogLevel.INFO, "Platform: ${platform.os}/${platform.arch}")

        val binary = downloadServerBinary(platform)

        if (binary == null) {
          loadError = IllegalStateException("Failed to download LLAMA-Server binary")

          return@submit
        }

        val modelFileName = config.modelUrl.substringAfterLast("/")

        modelFile = File(modelsDir, modelFileName)

        if (!downloadWithResume(config.modelUrl, modelFile!!, "GGUF model")) {
          loadError = IllegalStateException("Failed to download GGUF model")

          return@submit
        }

        val mmprojFileName = config.mmprojUrl.substringAfterLast("/")

        mmprojFile = File(modelsDir, mmprojFileName)

        if (!downloadWithResume(config.mmprojUrl, mmprojFile!!, "mmproj (vision projector)")) {
          loadError = IllegalStateException("Failed to download mmproj file")

          return@submit
        }

        val started = startServer(binary, modelFile!!, mmprojFile)

        if (!started) {
          loadError = IllegalStateException("LLAMA-Server failed to start")

          return@submit
        }

        isActive = true
        serverReady = true

        log(LogLevel.INFO, "Standard (llama) fast model initialized and ready for requests")

        if (config.hasThinkingModel) {
          val thinkingModelFileName = config.thinkingModelUrl!!.substringAfterLast("/")

          thinkingModelFile = File(modelsDir, thinkingModelFileName)

          if (!downloadWithResume(
              config.thinkingModelUrl!!, thinkingModelFile!!, "Thinking GGUF model")) {
            log(LogLevel.WARNING, "Failed to download thinking model — using fast model only")
            thinkingModelFile = null
          }

          if (thinkingModelFile != null && config.thinkingMmprojUrl != null) {
            val thinkingMmprojFileName = config.thinkingMmprojUrl!!.substringAfterLast("/")

            thinkingMmprojFile = File(modelsDir, thinkingMmprojFileName)

            if (!downloadWithResume(
                config.thinkingMmprojUrl!!, thinkingMmprojFile!!, "Thinking mmproj")) {
              log(LogLevel.WARNING, "Failed to download thinking mmproj — using fast model only")

              thinkingModelFile = null
              thinkingMmprojFile = null
            }
          }
        }

        if (thinkingModelFile != null) {
          val thinkingStarted =
              thinkingServer!!.start(binary, thinkingModelFile!!, thinkingMmprojFile, executor!!)

          if (thinkingStarted) {
            activeThinkingServerPort = thinkingServer!!.port

            log(LogLevel.INFO, "Thinking model server started on port ${thinkingServer!!.port}")
          } else {
            log(LogLevel.WARNING, "Thinking server failed to start — using fast model only")

            thinkingModelFile = null
          }
        }

        // Start specialist servers
        if (config.hasSpecialists) {
          var portOffset = 0

          for ((name, entry) in config.specialists) {
            log(LogLevel.INFO, "Downloading specialist '$name' model: ${entry.modelUrl}")

            val specModelFile = File(modelsDir, entry.modelUrl.substringAfterLast("/"))

            if (!downloadWithResume(entry.modelUrl, specModelFile, "Specialist '$name' model")) {
              log(LogLevel.WARNING, "Failed to download specialist '$name' model — skipping")
              continue
            }

            var specMmprojFile: File? = null

            if (entry.mmprojUrl != null) {
              specMmprojFile = File(modelsDir, entry.mmprojUrl.substringAfterLast("/"))

              if (!downloadWithResume(
                  entry.mmprojUrl, specMmprojFile, "Specialist '$name' mmproj")) {
                log(
                    LogLevel.WARNING,
                    "Failed to download specialist '$name' mmproj — starting without vision")
                specMmprojFile = null
              }
            }

            val manager =
                SpecialistServerManager(
                    name = name,
                    mainServerPort = serverPort,
                    threadCount = threadCount,
                    gpuLayers = gpuLayers,
                    detectedGpu = detectedGpu,
                    ctxSize = ctxSize,
                    parallelSlots = parallelSlots,
                    extraServerArgs = extraServerArgs,
                    detectPhysicalCores = ::detectPhysicalCores,
                    log = logFn)

            val specStarted =
                manager.start(
                    binary,
                    specModelFile,
                    specMmprojFile,
                    executor!!,
                    preferredPortStart = serverPort + 200 + portOffset)

            if (specStarted) {
              specialistServers[name.lowercase()] = manager

              log(LogLevel.INFO, "Specialist '$name' server started on port ${manager.port}")
            } else {
              log(LogLevel.WARNING, "Specialist '$name' server failed to start — skipping")
            }

            portOffset += 20
          }
        }

        specialistsReady = true

        log(LogLevel.INFO, "Standard (llama) fully initialized and ready for requests")
      } catch (e: Exception) {
        loadError = e

        log(LogLevel.ERROR, "Initialization failed: ${e.message}", "", e)
      }
    }
    // Start the update checker independently of server startup
    notificationService?.start(config.checkIntervalHours)
  }

  /**
   * Shuts down any existing resource monitor and starts a fresh one.
   *
   * @param logFn Logger callback used by the monitor for diagnostics.
   */
  private fun startResourceMonitor(logFn: (LogLevel, String) -> Unit) {
    resourceMonitor?.shutdown()
    resourceMonitor =
        ResourceMonitor(
                detectedGpu, gpuLayers, config.maxComputePercent, config.maxRAMPercent, logFn)
            .also { it.start(executor!!) }
  }

  /**
   * Tears down all background resources: update checker, resource monitor, streaming sessions,
   * thinking server, and the base-class server process.
   *
   * @param shutdownData The formcycle shutdown payload (may be `null`).
   */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    notificationService?.shutdown()
    notificationService = null
    resourceMonitor?.shutdown()
    resourceMonitor = null
    serverReady = false

    thinkingServer?.stop()
    thinkingServer = null
    activeThinkingServerPort = 0

    specialistServers.values.forEach { it.stop() }
    specialistServers.clear()
    specialistsReady = false

    externalClient = null
    messageBuilder = null
    chatCompletionService = null
    webSearchHandler = null

    streamingSessions.clear()

    executor?.shutdownNow()
    try {
      executor?.awaitTermination(5, TimeUnit.SECONDS)
    } catch (_: InterruptedException) {
      Thread.currentThread().interrupt()
    }
    executor = null

    super.shutdown(shutdownData)
  }

  // endregion Lifecycle
  // region Thinking Model Server
  // Extracted to ThinkingServerManager -- see ThinkingServerManager.kt
  // endregion Thinking Model Server
  // region Servlet-Execution
  /**
   * Routes incoming requests to one of three handlers:
   * 1. [handleStreamPoll] -- returns the current state of an in-flight streaming session.
   * 2. [handleHealthCheck] -- returns server readiness, model info, and resource status.
   * 3. [handleNewQuestion] -- processes a new question (streaming or synchronous).
   *
   * @param params Servlet execution context with request headers and payload data.
   * @return A JSON servlet response containing polling data, health state, or inference output.
   * @throws FCPluginException If request handling fails unexpectedly.
   */
  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    try {
      val pollId =
          params.headerMap.entries.find { it.key.equals("X-Stream-Poll", ignoreCase = true) }?.value

      if (pollId != null) return handleStreamPoll(pollId, params)

      val isHealthCheck =
          params.headerMap.entries.any {
            it.key.equals("X-Health-Check", ignoreCase = true) &&
                it.value.equals("true", ignoreCase = true)
          }

      if (isHealthCheck) return handleHealthCheck()

      return handleNewQuestion(params)
    } catch (e: FCPluginException) {
      throw e
    } catch (e: Exception) {
      throw FCPluginException("Unexpected error in CodBi AI LLAMA STD: ${e.message}", e)
    }
  }

  /**
   * Returns the current state of an in-flight streaming session identified by [pollId]. Handles
   * stop requests via X-Stream-Stop header.
   *
   * @param pollId The stream session identifier from `X-Stream-Poll`.
   * @param params The current servlet action parameters and headers.
   * @return A JSON response with stream text, completion flag, optional error, and metadata.
   */
  private fun handleStreamPoll(
      pollId: String,
      params: IPluginServletActionParams
  ): IPluginServletActionRetVal {
    cleanupStaleSessions()

    val wantsStop =
        params.headerMap.entries.any {
          it.key.equals("X-Stream-Stop", ignoreCase = true) &&
              it.value.equals("true", ignoreCase = true)
        }
    val session = streamingSessions[pollId]

    if (session != null && wantsStop) {
      session.stopRequested = true

      log(LogLevel.INFO, "Stop requested for stream $pollId")
    }

    if (session == null) {
      return gsonResponse(ErrorResponse("Unknown or expired stream session."))
    }

    val text = session.currentText()
    val done = session.done
    val err = session.error
    val resStatus = session.resourceStatus

    session.resourceStatus = null

    val visibleText = if (!session.searching && text.trimStart().startsWith("CALL")) "" else text
    val thinkingText = session.currentThinking()

    val confidence =
        if (done && session.logprobsAvailable) {
          val uncertainTokens = mutableListOf<UncertainToken>()
          var charOffset = 0
          for ((tok, lp) in session.snapshotLogprobs()) {
            if (lp < -2.0) uncertainTokens.add(UncertainToken(tok, lp, charOffset))
            charOffset += tok.length
          }
          ConfidenceData(
              mean = session.meanLogprob(),
              uncertainTokens = uncertainTokens,
              logprobRepetition = if (session.logprobRepetitionDetected) true else null)
        } else null

    val response =
        StreamPollResponse(
            text = visibleText,
            done = if (err != null) true else done,
            error = err,
            resourceStatus = resStatus,
            searching = if (session.searching) true else null,
            searchQuery = session.searchQuery,
            thinking = thinkingText.ifEmpty { null },
            modelType = session.modelType,
            i18n =
                I18nLabels(
                    reasoningLabel = session.labels.reasoningLabel,
                    showReasoningLabel = session.labels.showReasoningLabel,
                    showSourcesLabel = session.labels.showSourcesLabel,
                    searchingLabel = session.labels.searchingLabel,
                    searchingLabelNoQuery = session.labels.searchingLabelNoQuery,
                    thinkingLabel = session.labels.thinkingLabel,
                    copyResponseLabel = session.labels.copyResponseLabel,
                    copyReasoningLabel = session.labels.copyReasoningLabel),
            confidence = confidence)

    return gsonResponse(response)
  }

  /**
   * Returns server readiness status, model info, and optional thinking-model state.
   *
   * @return A health-check response describing readiness or initialization errors.
   */
  private fun handleHealthCheck(): IPluginServletActionRetVal {
    if (loadError != null) {
      return gsonResponse(ErrorResponse("Failed to initialize: ${loadError?.message ?: "unknown"}"))
    }

    if (!::config.isInitialized) {
      return gsonResponse(ErrorResponse("Plugin is still initializing. Please wait."))
    }

    if (config.isExternalMode) {
      val probeError = externalClient?.probeAvailability()

      if (probeError != null) {
        return gsonResponse(ErrorResponse(probeError))
      }
    }

    if (!config.isExternalMode && !serverReady) {
      return gsonResponse(
          ErrorResponse("Model is not ready yet. It may still be downloading or loading."))
    }

    val displayModel =
        if (config.isExternalMode) {
          (config.externalModel ?: "External AI").substringAfterLast("/")
        } else {
          val raw = config.modelUrl.substringAfterLast("/").removeSuffix(".gguf")

          raw.replace(Regex("-[QFqf][0-9_]+[A-Za-z_]*$"), "")
        }

    val healthResponse =
        if (thinkingServerReady && config.thinkingModelUrl != null) {
          val raw = config.thinkingModelUrl!!.substringAfterLast("/").removeSuffix(".gguf")
          val name = raw.replace(Regex("-[QFqf][0-9_]+[A-Za-z_]*$"), "")
          HealthCheckResponse(status = "ready", model = displayModel, thinkingModel = name)
        } else if (config.hasThinkingModel && !thinkingServerReady) {
          HealthCheckResponse(status = "ready", model = displayModel, pendingThinkingModel = true)
        } else {
          HealthCheckResponse(status = "ready", model = displayModel)
        }

    return gsonResponse(healthResponse)
  }

  /** All values parsed from request headers for a new question. */
  private data class RequestContext(
      val questions: Map<String, String>,
      val chatHistory: List<Pair<String, String>>,
      val imageData: Map<String, ByteArray>,
      val manualRotation: Int?,
      val slotId: Int,
      val enableThinking: Boolean,
      val thinkingTokenBudget: Int?,
      val searchEnabled: Boolean,
      val locationEnabled: Boolean,
      val userLatitude: String?,
      val userLongitude: String?,
      val clientIP: String?,
      val wantsStream: Boolean,
      val forcedLanguageCode: String?,
      val specialistName: String?
  )

  /**
   * Parses all request headers into a [RequestContext], or `null` if no questions were asked.
   *
   * @param params The servlet request context containing incoming headers and uploads.
   * @return A parsed [RequestContext], or `null` when no question headers are present.
   */
  private fun parseRequestHeaders(params: IPluginServletActionParams): RequestContext? {
    val questions = mutableMapOf<String, String>()
    params.headerMap.forEach { (headerName, headerValue) ->
      if (headerName.startsWith("x-question-", ignoreCase = true)) {
        val key = headerName.lowercase().substringAfter("x-question-", "")
        if (key.isNotBlank() && headerValue != null) {
          questions[key] =
              try {
                String(java.util.Base64.getDecoder().decode(headerValue), Charsets.UTF_8)
              } catch (e: Exception) {
                try {
                  String(headerValue.toByteArray(Charsets.ISO_8859_1), Charsets.UTF_8)
                } catch (e: Exception) {
                  headerValue
                }
              }
        }
      }
    }
    if (questions.isEmpty()) return null
    val chatHistory: List<Pair<String, String>> = run {
      val raw =
          params.headerMap.entries
              .find { it.key.equals("X-Chat-History", ignoreCase = true) }
              ?.value ?: return@run emptyList()
      try {
        val decoded = String(java.util.Base64.getDecoder().decode(raw), Charsets.UTF_8)
        val array = com.google.gson.JsonParser.parseString(decoded).asJsonArray
        array.map {
          val obj = it.asJsonObject
          Pair(obj.get("role").asString, obj.get("content").asString)
        }
      } catch (e: Exception) {
        log(LogLevel.WARNING, "Failed to parse chat history: ${e.message}")
        emptyList()
      }
    }
    if (chatHistory.isNotEmpty()) {
      log(LogLevel.INFO, "Chat history: ${chatHistory.size} turns")
    }
    val headers = params.headerMap
    val slotId: Int = run {
      val sid =
          headers.entries.find { it.key.equals("X-Session-Id", ignoreCase = true) }?.value
              ?: return@run -1
      Math.floorMod(sid.hashCode(), parallelSlots).also {
        log(LogLevel.INFO, "Session ${sid.take(8)}… → slot $it (of $parallelSlots)")
      }
    }
    val userWantsThinking =
        headers.entries.any {
          it.key.equals("X-Thinking", ignoreCase = true) &&
              it.value.equals("true", ignoreCase = true)
        }
    val enableThinking = userWantsThinking && thinkingServerReady
    log(
        LogLevel.INFO,
        "Thinking mode: ${when {
          enableThinking -> "dedicated (port $thinkingServerPort)"
          userWantsThinking -> "unavailable (thinking server not ready, using fast model)"
          else -> "off"
        }}")
    val searchEnabled =
        headers.entries.none {
          it.key.equals("X-Search", ignoreCase = true) &&
              it.value.equals("false", ignoreCase = true)
        }
    log(LogLevel.INFO, "Search enabled: $searchEnabled")
    val locationEnabled =
        headers.entries.any {
          it.key.equals("X-Location", ignoreCase = true) &&
              it.value.equals("true", ignoreCase = true)
        }
    val userLatitude =
        headers.entries.firstOrNull { it.key.equals("X-Latitude", ignoreCase = true) }?.value
    val userLongitude =
        headers.entries.firstOrNull { it.key.equals("X-Longitude", ignoreCase = true) }?.value
    log(
        LogLevel.INFO,
        "Location enabled: $locationEnabled" +
            if (userLatitude != null && userLongitude != null)
                " (lat=$userLatitude, lon=$userLongitude)"
            else "")
    val clientIP =
        if (locationEnabled) {
          val xff =
              headers.entries.find { it.key.equals("X-Forwarded-For", ignoreCase = true) }?.value
          if (!xff.isNullOrBlank()) xff.split(",").first().trim()
          else {
            val xri = headers.entries.find { it.key.equals("X-Real-IP", ignoreCase = true) }?.value
            if (!xri.isNullOrBlank()) xri.trim() else params.remoteAddr?.trim() ?: "unknown"
          }
        } else null
    return RequestContext(
        questions = questions,
        chatHistory = chatHistory,
        imageData = imageService!!.collectImageData(params),
        manualRotation =
            headers.entries
                .find { it.key.equals("X-Rotate", ignoreCase = true) }
                ?.value
                ?.trim()
                ?.toIntOrNull(),
        slotId = slotId,
        enableThinking = enableThinking,
        thinkingTokenBudget =
            headers.entries
                .find { it.key.equals("X-Max-Thinking-Tokens", ignoreCase = true) }
                ?.value
                ?.trim()
                ?.toIntOrNull(),
        searchEnabled = searchEnabled,
        locationEnabled = locationEnabled,
        userLatitude = userLatitude,
        userLongitude = userLongitude,
        clientIP = clientIP,
        wantsStream =
            headers.entries.any {
              it.key.equals("X-Stream", ignoreCase = true) &&
                  it.value.equals("true", ignoreCase = true)
            },
        forcedLanguageCode =
            headers.entries
                .find { it.key.equals("X-Forced-Language", ignoreCase = true) }
                ?.value
                ?.trim()
                ?.takeIf { it.length == 2 } ?: config.forcedLanguage,
        specialistName =
            headers.entries
                .find { it.key.equals("X-Specialist", ignoreCase = true) }
                ?.value
                ?.trim()
                ?.takeIf { it.isNotEmpty() })
  }

  /**
   * Resolves the user's location from coordinates or IP, or `null` if location is disabled.
   *
   * @param ctx Parsed request context containing location-related flags and values.
   * @return A resolved location string, fallback location, or `null` when unavailable.
   */
  private fun resolveLocation(ctx: RequestContext): String? {
    if (!ctx.locationEnabled) return null
    if (ctx.userLatitude != null && ctx.userLongitude != null)
        return geoService!!.reverseGeocode(ctx.userLatitude, ctx.userLongitude)
    return ctx.clientIP?.let { geoService!!.geolocateByIP(it) } ?: config.fallbackLocation
  }

  /**
   * Detects the language of the question using the configured inference backend.
   *
   * @param question The user question to classify.
   * @return Detected language metadata, or `null` if detection fails.
   */
  private fun detectLanguage(question: String): DetectedLanguage? =
      langService!!.detectLanguageViaModel(question) { body ->
        if (config.isExternalMode)
            externalClient!!.post(
                "/v1/chat/completions", externalClient!!.injectModelField(body), timeoutMs = 15_000)
        else httpPost("/v1/chat/completions", body, timeoutMs = 15_000, port = serverPort)
      }

  /**
   * Resolves the response language — forced code takes precedence over model/regex detection.
   *
   * @param question The user question text.
   * @param forcedCode Two-letter ISO 639-1 code from toLoad or plugin property, or `null`.
   * @return Detected language metadata, or `null` for English / unrecognised codes.
   */
  private fun resolveLanguage(question: String, forcedCode: String?): DetectedLanguage? {
    if (forcedCode != null) {
      val forced = langService!!.lookupByCode(forcedCode)
      if (forced != null) {
        log(LogLevel.INFO, "Language forced to ${forced.languageName} (code=$forcedCode)")
        return forced
      }
      val name = langService!!.languageNameForCode(forcedCode)
      log(
          LogLevel.WARNING,
          "Forced language code '$forcedCode' resolved to '$name' but no localised prompts — falling back to detection")
    }
    return detectLanguage(question)
  }

  /**
   * Resolves the specialist server port for the given name, or `null` if the name is unset,
   * unknown, or the specialist server is not ready.
   *
   * @param specialistName The case-insensitive specialist name from the `X-Specialist` header.
   * @return The specialist server's port, or `null` to use the default server.
   */
  private fun resolveSpecialistPort(specialistName: String?): Int? {
    if (specialistName == null) return null
    val key = specialistName.lowercase()
    val manager = specialistServers[key]
    if (manager == null) {
      val isConfigured =
          config.specialists.keys.any { it.equals(specialistName, ignoreCase = true) }
      if (isConfigured && !specialistsReady) {
        log(
            LogLevel.WARNING,
            "Specialist '$specialistName' is still starting — using default model")
      } else if (isConfigured) {
        log(LogLevel.WARNING, "Specialist '$specialistName' failed to start — using default model")
      } else {
        log(
            LogLevel.WARNING,
            "Unknown specialist '$specialistName' — no matching AI_LLAMA_STD_SPECIALIST_$specialistName property found")
      }
      return null
    }
    if (!manager.isReady) {
      log(LogLevel.WARNING, "Specialist '$specialistName' server not ready — using default model")
      return null
    }
    log(LogLevel.INFO, "Routing to specialist '$specialistName' on port ${manager.port}")
    return manager.port
  }

  /**
   * Validates server state, parses request headers, and dispatches to [executeStreaming] or
   * [executeSynchronous].
   *
   * @param params Servlet execution context with headers and uploaded payloads.
   * @return A servlet response containing either an error payload or inference result.
   */
  private fun handleNewQuestion(params: IPluginServletActionParams): IPluginServletActionRetVal {
    log(
        LogLevel.INFO,
        "Processing VQA request" +
            if (config.isExternalMode) " (external: ${config.externalUrl})"
            else " (LLAMA-Server on port $serverPort)")
    resourceMonitor?.let { monitor ->
      val reason = monitor.exceedReason()
      if (reason != null) {
        val waitSec = monitor.estimateWaitSeconds()
        log(LogLevel.WARNING, "Resource gate BLOCKED: $reason — estimated wait ${waitSec}s")
        return gsonResponse(
            ErrorResponse(
                "Server resources exceeded ($reason). Please retry in ~${waitSec} seconds.",
                retryAfter = waitSec))
      }
    }
    if (loadError != null) {
      return gsonResponse(ErrorResponse("Failed to initialize: ${loadError?.message ?: "unknown"}"))
    }
    if (!config.isExternalMode && (!serverReady || !isServerAlive())) {
      if (serverReady && !isServerAlive()) {
        log(LogLevel.WARNING, "LLAMA-Server process died — attempting restart")
        serverReady = false
        val binary = serverBinary
        val model = modelFile
        if (binary != null && model != null) {
          val restarted = startServer(binary, model, mmprojFile)
          if (restarted) {
            serverReady = true
            isActive = true
          } else {
            return gsonResponse(ErrorResponse("LLAMA-Server crashed and restart failed."))
          }
        }
      }
      if (!serverReady) {
        return gsonResponse(
            ErrorResponse("Model is not ready yet. It may still be downloading or loading."))
      }
    }
    val ctx =
        parseRequestHeaders(params) ?: return gsonResponse(ErrorResponse("No questions asked."))
    return if (ctx.wantsStream) executeStreaming(ctx) else executeSynchronous(ctx)
  }

  /**
   * Starts a background streaming session and returns the session UUID immediately.
   *
   * @param ctx Parsed request context for the incoming question and options.
   * @return A response containing the newly created stream session ID.
   */
  private fun executeStreaming(ctx: RequestContext): IPluginServletActionRetVal {
    cleanupStaleSessions()
    val sessionId = UUID.randomUUID().toString()
    val session = StreamingSession(enableThinking = ctx.enableThinking)
    streamingSessions[sessionId] = session
    if (ctx.slotId >= 0) activeStreamingSlots.merge(ctx.slotId, 1, Int::plus)
    executor!!.submit {
      try {
        val question = ctx.questions.values.first()
        val detectedLang = resolveLanguage(question, ctx.forcedLanguageCode)
        if (detectedLang != null) {
          session.labels =
              SessionLabels(
                  reasoningLabel = detectedLang.uiReasoningLabel,
                  showReasoningLabel = detectedLang.uiShowReasoningLabel,
                  showSourcesLabel = detectedLang.uiShowSourcesLabel,
                  searchingLabel = detectedLang.uiSearchingLabel,
                  searchingLabelNoQuery = detectedLang.uiSearchingLabelNoQuery,
                  thinkingLabel = detectedLang.uiThinkingLabel,
                  copyResponseLabel = detectedLang.uiCopyResponseLabel,
                  copyReasoningLabel = detectedLang.uiCopyReasoningLabel)
        }
        val userLocation = resolveLocation(ctx)
        val specialistPort = resolveSpecialistPort(ctx.specialistName)
        try {
          val imageParts =
              if (ctx.imageData.isNotEmpty()) {
                imageService!!.prepareImageParts(ctx.imageData, ctx.manualRotation)
              } else emptyList()
          val messages =
              messageBuilder!!.buildMessages(
                  question,
                  imageParts,
                  ctx.chatHistory,
                  ctx.searchEnabled,
                  ctx.enableThinking,
                  detectedLang,
                  ctx.locationEnabled,
                  userLocation)
          if (ctx.enableThinking || ctx.locationEnabled) {
            log(LogLevel.INFO, "Messages JSON (first 500): ${messages.take(500)}")
          }
          chatCompletionService!!.streamChatCompletion(
              messages, session, ctx.enableThinking, ctx.slotId, specialistPort)
          val fullText = session.currentText()
          val thinkText = session.currentThinking()
          log(
              LogLevel.INFO,
              "Stream done. Text: ${fullText.take(80)}…, Thinking: ${thinkText.take(120)}… (${thinkText.length} chars)")
          if (ctx.searchEnabled &&
              BraveSearch.isAvailable &&
              BraveSearch.CALL_SEARCH_PATTERN.containsMatchIn(fullText)) {
            val rawQuery = BraveSearch.CALL_SEARCH_PATTERN.find(fullText)?.groupValues?.get(1) ?: ""
            session.searchQuery = BraveSearch.sanitizeQuery(rawQuery, detectedLang?.languageName)
            session.searching = true
            session.clearText()
            webSearchHandler!!.handleSearchToolCallStreaming(
                fullText,
                question,
                imageParts,
                ctx.chatHistory,
                session,
                ctx.enableThinking,
                ctx.slotId,
                detectedLang,
                userLocation)
            session.searching = false
            session.searchQuery = null
          }
        } catch (e: Exception) {
          session.error = e.message ?: "Unknown error"
          log(LogLevel.ERROR, "Streaming error: ${e.message}", "", e)
        } finally {
          if (ctx.enableThinking &&
              session.currentText().isBlank() &&
              session.currentThinking().isNotBlank()) {
            log(
                LogLevel.INFO,
                "Thinking model failed to produce answer — falling back to fast model")
            val fallbackWarningEnglish =
                "The thinking model used all available tokens for reasoning without producing a final answer. The fast model was used to generate this response instead."
            val translatedWarning =
                try {
                  val lang = detectedLang?.languageName ?: "English"
                  if (lang == "English") {
                    "⚠ $fallbackWarningEnglish"
                  } else {
                    val prompt =
                        """[{"role":"user","content":"Translate the following message to $lang. Output ONLY the translated sentence, nothing else: '$fallbackWarningEnglish'"}]"""
                    "⚠ " +
                        chatCompletionService!!
                            .chatCompletion(prompt, enableThinking = false, idSlot = ctx.slotId)
                            .trim()
                            .removeSurrounding("\"")
                            .removeSurrounding("'")
                  }
                } catch (e: Exception) {
                  log(LogLevel.WARNING, "Fallback warning translation failed: ${e.message}")
                  "⚠ $fallbackWarningEnglish"
                }
            session.addThinking("\n$translatedWarning\n")
            session.modelType = "fast"
            session.clearText()
            val reasoning =
                session
                    .currentThinking()
                    .replace("[Reasoning truncated — repetition detected]", "")
                    .replace("[Reasoning truncated — repetitive pattern detected]", "")
                    .trim()
            val fallbackMessages =
                messageBuilder!!.buildMessages(
                    question,
                    emptyList(),
                    ctx.chatHistory,
                    ctx.searchEnabled,
                    enableThinking = false,
                    detectedLang = detectedLang,
                    locationEnabled = ctx.locationEnabled,
                    userLocation = userLocation)
            val messagesWithReasoning =
                if (reasoning.length > 50) {
                  val reasoningSnippet =
                      if (reasoning.length > 4000) reasoning.takeLast(4000) else reasoning
                  val injection =
                      ",{\"role\":\"system\",\"content\":\"" +
                          "A previous analysis of this question produced the following reasoning " +
                          "(it was interrupted before a final answer could be generated). " +
                          "Use these insights to formulate your answer:\\n\\n" +
                          jsonEscape(reasoningSnippet) +
                          "\"}]"
                  fallbackMessages.removeSuffix("]") + injection
                } else {
                  fallbackMessages
                }
            chatCompletionService!!.streamChatCompletion(
                messagesWithReasoning, session, false, ctx.slotId)
            val fallbackText = session.currentText()
            if (ctx.searchEnabled &&
                BraveSearch.isAvailable &&
                BraveSearch.CALL_SEARCH_PATTERN.containsMatchIn(fallbackText)) {
              val rawQuery =
                  BraveSearch.CALL_SEARCH_PATTERN.find(fallbackText)?.groupValues?.get(1) ?: ""
              session.searchQuery = BraveSearch.sanitizeQuery(rawQuery, detectedLang?.languageName)
              session.searching = true
              session.clearText()
              webSearchHandler!!.handleSearchToolCallStreaming(
                  fallbackText,
                  question,
                  emptyList(),
                  ctx.chatHistory,
                  session,
                  false,
                  ctx.slotId,
                  detectedLang,
                  userLocation)
              session.searching = false
              session.searchQuery = null
            }
          }
          if (session.currentText().isBlank() && session.error == null) {
            log(
                LogLevel.WARNING,
                "Model produced no visible text for question: '${question.take(100)}' — generating fallback")
            try {
              val lang = detectedLang?.languageName ?: "English"
              val fallbackPrompt =
                  """[{"role":"user","content":"Translate the following message to $lang. Output ONLY the translated sentence, nothing else: 'I was unable to generate a response. Please try rephrasing your question.'"}]"""
              val translated =
                  chatCompletionService!!
                      .chatCompletion(fallbackPrompt, enableThinking = false, idSlot = ctx.slotId)
                      .trim()
                      .removeSurrounding("\"")
                      .removeSurrounding("'")
              if (translated.isNotBlank()) {
                session.replaceText(translated)
              }
            } catch (e: Exception) {
              log(LogLevel.WARNING, "Fallback translation failed: ${e.message}")
            }
          }
          val truncationMarkers =
              listOf(
                  "[Reasoning truncated — repetition detected]",
                  "[Reasoning truncated — repetitive pattern detected]")
          val lang = detectedLang?.languageName
          if (lang != null && lang != "English") {
            for (marker in truncationMarkers) {
              if (session.thinkingContains(marker)) {
                try {
                  val prompt =
                      """[{"role":"user","content":"Translate the following message to $lang. Output ONLY the translated sentence in square brackets, nothing else: '$marker'"}]"""
                  val translated =
                      chatCompletionService!!
                          .chatCompletion(prompt, enableThinking = false, idSlot = ctx.slotId)
                          .trim()
                          .removeSurrounding("\"")
                          .removeSurrounding("'")
                  if (translated.isNotBlank()) {
                    session.replaceThinkingMarker(marker, translated)
                  }
                } catch (e: Exception) {
                  log(LogLevel.WARNING, "Truncation marker translation failed: ${e.message}")
                }
              }
            }
          }
          session.done = true
        }
      } finally {
        if (ctx.slotId >= 0)
            activeStreamingSlots.merge(ctx.slotId, -1) { a, b ->
              (a + b).let { if (it <= 0) null else it }
            }
      }
    }
    log(LogLevel.INFO, "Streaming session started: $sessionId")
    return gsonResponse(StreamIdResponse(sessionId))
  }

  /**
   * Processes questions synchronously and returns all answers.
   *
   * @param ctx Parsed request context for synchronous execution.
   * @return A servlet JSON response containing per-question answers or an error.
   */
  private fun executeSynchronous(ctx: RequestContext): IPluginServletActionRetVal {
    // If the hashed slot is occupied by an active stream, let llama-server auto-assign a free slot
    val effectiveSlot =
        if (ctx.slotId >= 0 && activeStreamingSlots.containsKey(ctx.slotId)) {
          log(LogLevel.INFO, "Slot ${ctx.slotId} occupied by stream — using auto-assign")
          -1
        } else ctx.slotId
    val syncCtx = if (effectiveSlot != ctx.slotId) ctx.copy(slotId = effectiveSlot) else ctx

    val finalResults = mutableMapOf<String, Map<String, String>>()
    val specialistPort = resolveSpecialistPort(syncCtx.specialistName)
    try {
      val imageParts =
          if (syncCtx.imageData.isNotEmpty()) {
            imageService!!.prepareImageParts(syncCtx.imageData, syncCtx.manualRotation)
          } else emptyList()
      for ((questionKey, question) in syncCtx.questions) {
        val detectedLang = resolveLanguage(question, syncCtx.forcedLanguageCode)
        val userLocation = resolveLocation(syncCtx)
        val messages =
            messageBuilder!!.buildMessages(
                question,
                imageParts,
                syncCtx.chatHistory,
                syncCtx.searchEnabled,
                syncCtx.enableThinking,
                detectedLang,
                syncCtx.locationEnabled,
                userLocation)
        var answer =
            chatCompletionService!!.chatCompletion(
                messages,
                syncCtx.enableThinking,
                syncCtx.slotId,
                syncCtx.thinkingTokenBudget,
                specialistPort)
        if (syncCtx.enableThinking && answer.isBlank()) {
          log(
              LogLevel.INFO,
              "Thinking model produced no visible answer for Q[$questionKey] — falling back to fast model")
          val fallbackMessages =
              messageBuilder!!.buildMessages(
                  question,
                  imageParts,
                  syncCtx.chatHistory,
                  syncCtx.searchEnabled,
                  enableThinking = false,
                  detectedLang,
                  syncCtx.locationEnabled,
                  userLocation)
          answer =
              chatCompletionService!!.chatCompletion(
                  fallbackMessages, enableThinking = false, idSlot = syncCtx.slotId)
        }
        if (syncCtx.searchEnabled) {
          answer =
              webSearchHandler!!.handleSearchToolCall(
                  answer,
                  question,
                  imageParts,
                  syncCtx.chatHistory,
                  syncCtx.enableThinking,
                  syncCtx.slotId,
                  detectedLang,
                  userLocation)
        }
        finalResults[questionKey] = mapOf("answer" to answer)
        log(LogLevel.INFO, "Q[$questionKey]: ${question.take(80)}… → $answer")
      }
    } catch (e: Exception) {
      log(LogLevel.ERROR, "Inference error: ${e.message}", "", e)
      return gsonResponse(ErrorResponse(e.message ?: "Inference failed"))
    }
    return gsonResponse(finalResults)
  }

  // endregion Servlet-Execution
  // region Logging
  /**
   * Logs a message with the `LlamaSrv` identifier prefix.
   *
   * @param importance The severity level.
   * @param toLog The main log message.
   * @param adjenct Additional context appended to the message.
   * @param exception Optional throwable to attach.
   */
  override fun log(importance: LogLevel, toLog: String, adjenct: String, exception: Throwable?) {
    super.idLogMessages = "LlamaSrv"
    super.log(importance, toLog, adjenct, exception)
  }

  // endregion Logging
}
