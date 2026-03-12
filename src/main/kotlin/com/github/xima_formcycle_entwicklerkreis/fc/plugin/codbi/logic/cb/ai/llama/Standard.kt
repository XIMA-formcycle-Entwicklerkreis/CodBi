package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama

// region Imports
// region CodBi
// endregion CodBi
// region XIMA
// endregion XIMA
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.BraveSearch
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.LLAMA
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.TesseractAction
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.awt.geom.AffineTransform
import java.awt.image.BufferedImage
import java.io.BufferedReader
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.lang.management.ManagementFactory
import java.net.HttpURLConnection
import java.net.Socket
import java.net.URI
import java.nio.charset.StandardCharsets
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Properties
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import javax.imageio.ImageIO

// endregion Imports
/**
 * Standard — Generic GGUF model runner via local LLAMA-Server process. All AI computation happens
 * in the external LLAMA-Server process. If it OOMs the Tomcat JVM stays alive — only the
 * LLAMA-Server dies.
 *
 * ## Plugin Properties
 * |Property                           |Type   |Default                       |Description                                                                                                                       |
 * |-----------------------------------|-------|------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
 * |`Active_AI`                        |String |—                             |Must contain `llama_std` to activate this model                                                                                   |
 * |`AI_LLAMA_STD_ModelUrl`            |URL    |Qwen3-VL-2B Q4_K_M HuggingFace|Download URL for the GGUF model file                                                                                              |
 * |`AI_LLAMA_STD_MmprojUrl`           |URL    |Qwen3-VL-2B mmproj HuggingFace|Download URL for the vision projector (mmproj) file                                                                               |
 * |`AI_LLAMA_STD_MaxPixels`           |Int    |`3211264`                     |Max pixel budget for image downscaling (min 3136)                                                                                 |
 * |`AI_LLAMA_STD_MaxTokens`           |Int    |`2048`                        |Maximum tokens to generate per response                                                                                           |
 * |`AI_LLAMA_STD_MaxRAMPercent`       |Double |`101.0`                       |RAM usage threshold (%) — blocks requests when exceeded                                                                           |
 * |`AI_LLAMA_STD_MaxComputePercent`   |Double |`101.0`                       |Compute usage threshold (%) — gates on GPU% (CUDA) or CPU% (fallback). Blocks requests when exceeded                              |
 * |`AI_LLAMA_STD_MaxCPUPercent`       |Double |—                             |Legacy alias for MaxComputePercent (accepted as fallback)                                                                         |
 * |`AI_LLAMA_STD_LlamaRelease`        |String |`b8175`                       |llama.cpp release tag for server binary download                                                                                  |
 * |`AI_LLAMA_STD_ServerUrl_<platform>`|URL    |(auto from release tag)       |Per-platform override for the LLAMA-Server binary URL                                                                             |
 * |`AI_LLAMA_STD_UpdateCheckHours`    |Long   |`24`                          |Hours between GitHub release checks (0 = disabled)                                                                                |
 * |`AI_LLAMA_STD_NotifyEmail`         |String |—                             |Email address for update notifications                                                                                            |
 * |`AI_LLAMA_STD_ThinkingModelUrl`    |URL    |—                             |Download URL for a dedicated thinking model GGUF (optional)                                                                       |
 * |`AI_LLAMA_STD_ThinkingMmprojUrl`   |URL    |—                             |Download URL for the thinking model's mmproj file (optional)                                                                      |
 * |`AI_LLAMA_STD_ExternalUrl`         |URL    |—                             |Base URL of an external OpenAI-compatible API; overrides local model                                                              |
 * |`AI_LLAMA_STD_ExternalApiKey`      |String |—                             |API key for the external AI (sent as Bearer token)                                                                                |
 * |`AI_LLAMA_STD_ExternalModel`       |String |—                             |Model name for the external API (e.g. gpt-4o, claude-3-opus)                                                                      |
 * |`AI_LLAMA_STD_ExternalNoPrompt`    |Boolean|`false`                       |When `true`, skips all built-in system-prompt sections (§1–§6) for the external AI — sends only the user message and chat history.|
 * |`AI_LLAMA_STD_PromptIdentity`      |String |(built-in)                    |Override the identity/role sentence ("You are a helpful assistant..."). Use `{date}` as placeholder for today's date.             |
 * |`AI_LLAMA_STD_PromptLocation`      |String |(built-in)                    |Override the location-context instruction. Use `{location}` as placeholder.                                                       |
 * |`AI_LLAMA_STD_PromptSearch`        |String |(built-in)                    |Override the CALL:search instruction block (before examples).                                                                     |
 * |`AI_LLAMA_STD_PromptThinking`      |String |(built-in)                    |Override the thinking-mode instruction. Use `{language}` as placeholder.                                                          |
 * |`AI_LLAMA_STD_PromptNoInternet`    |String |(built-in)                    |Override the no-internet-access warning.                                                                                          |
 * |`AI_LLAMA_STD_PromptRules`         |String |(built-in)                    |Override the general rules (language, measurements, independence).                                                                |
 * |`AI_BraveSearch_ApiKey`            |String |—                             |Brave Search API key — enables web search tool for the model                                                                      |
 *
 * ## Domains to whitelist
 * - **github.com** — LLAMA-Server binary releases & release-check API
 * - **api.github.com** — latest-release version checks
 * - **objects.githubusercontent.com** — GitHub release asset CDN
 * - **huggingface.co** — GGUF model & mmproj downloads
 * - **nominatim.openstreetmap.org** — reverse geocoding for location context
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
  }

  // endregion Constants

  // region Fields
  private var modelUrl = DEFAULT_MODEL_URL
  private var mmprojUrl = DEFAULT_MMPROJ_URL

  // region External-AI settings.
  /** Base URL for an external OpenAI-compatible API (e.g. "https://api.openai.com/v1"). */
  private var externalUrl: String? = null
  /** API key for the external AI service (sent as Bearer token). */
  private var externalApiKey: String? = null
  /** Model identifier for the external API (e.g. "gpt-4o", "claude-3-opus-20240229"). */
  private var externalModel: String? = null
  /** Whether to use an external AI service instead of the local LLAMA-Server. */
  private val isExternalMode: Boolean
    get() = externalUrl != null

  /** When true, all built-in system-prompt sections (§1–§6) are skipped for external AI. */
  private var externalNoPrompt = false
  // endregion External-AI settings.
  // region Thinking model settings
  /** URL for the thinking model GGUF file. */
  private var thinkingModelUrl: String? = null
  /** URL for the thinking model mmproj file. */
  private var thinkingMmprojUrl: String? = null
  // endregion Thinking model settings
  // region Manage the thinking model's state.
  /** Whether a dedicated thinking model is configured (separate from the fast model). */
  private val hasThinkingModel: Boolean
    get() = thinkingModelUrl != null

  /** Downloaded thinking model GGUF file. */
  private var thinkingModelFile: File? = null
  /** Downloaded thinking model mmproj file (may be null if no vision needed). */
  private var thinkingMmprojFile: File? = null
  /** The port the thinking model's LLAMA-Server listens on. */
  @Volatile private var thinkingServerPort: Int = 0
  /** The running thinking LLAMA-Server process. */
  @Volatile private var thinkingServerProcess: Process? = null
  /** Whether the thinking server is ready for requests. */
  @Volatile private var thinkingServerReady = false
  /** Threads consuming thinking server stdout/stderr. */
  private var thinkingStdoutThread: Thread? = null
  /** Thread consuming thinking server stderr. */
  private var thinkingStderrThread: Thread? = null
  // endregion Manage the thinking model's state.
  // region Prompt-Overrides
  /** Override for the identity/role sentence. `{date}` is replaced with today's date. */
  private var promptIdentity: String? = null
  /**
   * Override for the location-context instruction. `{location}` is replaced with the resolved
   * location.
   */
  private var promptLocation: String? = null
  /** Override for the CALL:search instruction block (before examples). */
  private var promptSearch: String? = null
  /**
   * Override for the thinking-mode instruction. `{language}` is replaced with the detected language
   * name.
   */
  private var promptThinking: String? = null
  /** Override for the no-internet-access warning. */
  private var promptNoInternet: String? = null
  /** Override for the general rules (language, measurements, question independence). */
  private var promptRules: String? = null
  // endregion Prompt-Overrides
  // region Model settings.
  /** Maximum pixel budget for downscaling images before encoding as base64. */
  private var maxPixels = 3_211_264 // ≈ 1792×1792
  /** Maximum tokens to generate in the response. */
  private var maxTokens = 2048
  /** Resource monitoring thresholds. */
  private var maxRAMPercent = 101.0
  /**
   * Compute utilization threshold (percentage). When the model runs on GPU (CUDA), this gates on
   * GPU utilization via `nvidia-smi`. When the model runs on CPU, this gates on system-wide CPU
   * utilization. Default `101.0` effectively disables the gate.
   */
  private var maxComputePercent = 101.0
  /** Resource monitor daemon thread. */
  private var resourceMonitor: ResourceMonitor? = null
  /** Model file reference after download. */
  private var modelFile: File? = null
  /** Vision projector file reference after download. */
  private var mmprojFile: File? = null
  /** Error during initialization (shown to callers). */
  @Volatile private var loadError: Throwable? = null
  /** Whether the server is ready for requests. */
  @Volatile private var serverReady = false
  // endregion Model settings.
  // region Version-Check settings
  /** Hours between GitHub release checks. 0 = disabled. */
  private var checkIntervalHours = DEFAULT_CHECK_INTERVAL_HOURS
  /** Optional override for the notification recipient email. */
  private var notifyEmail: String? = null
  /** Plugin folder root — used to locate system-mail.properties. */
  private var pluginFolder: File? = null
  /** Daemon thread that periodically checks for new releases. */
  private var updateChecker: Thread? = null
  /** Last release tag for which a notification was already sent (in-memory + persisted). */
  @Volatile private var lastNotifiedRelease: String? = null

  // endregion Version-Check settings
  // endregion Fields

  // region Token Streaming Infrastructure
  /**
   * Holds the state of an in-flight streaming request. The background thread appends generated text
   * chunks.
   */
  private class StreamingSession(
      /** Start time of the session in milliseconds since epoch. */
      val startTime: Long = System.currentTimeMillis(),
      /** Whether this session uses thinking mode (longer TTL). */
      val enableThinking: Boolean = false
  ) {
    /** Accumulated generated text so far. */
    val textChunks = java.util.concurrent.CopyOnWriteArrayList<String>()
    /** Accumulated thinking/reasoning text (from <think> blocks). */
    val thinkingChunks = java.util.concurrent.CopyOnWriteArrayList<String>()
    @Volatile var done = false
    @Volatile var error: String? = null
    @Volatile var stopRequested = false
    @Volatile var resourceStatus: String? = null
    @Volatile var searching = false
    @Volatile var searchQuery: String? = null
    @Volatile var modelType: String = if (enableThinking) "thinking" else "fast"
    @Volatile var uiReasoningLabel: String = "Reasoning\u2026"
    @Volatile var uiShowReasoningLabel: String = "Show reasoning"
    @Volatile var uiShowSourcesLabel: String = "Show sources"
    @Volatile var uiSearchingLabel: String = "Searching the internet for \u201C%s\u201D\u2026"
    @Volatile var uiSearchingLabelNoQuery: String = "Searching the internet\u2026"
    @Volatile var uiThinkingLabel: String = "Thinking\u2026"
    @Volatile var uiCopyResponseLabel: String = "Response"
    @Volatile var uiCopyReasoningLabel: String = "Reasoning"
    // region Confidence-Tracking
    /** Per-token logprob entries: Pair(token, logprob). Only visible (non-thinking) tokens. */
    val tokenLogprobs = java.util.concurrent.CopyOnWriteArrayList<Pair<String, Double>>()
    @Volatile var logprobsAvailable = false
    @Volatile var logprobRepetitionDetected = false

    /** Mean logprob across all visible tokens, or null if none collected. */
    fun meanLogprob(): Double? {
      val lps = tokenLogprobs

      if (lps.isEmpty()) return null

      return lps.sumOf { it.second } / lps.size
    }

    // endregion Confidence-Tracking
    /**
     * Retrieves the current accumulated visible text (from the main response) and thinking text
     * (from <think> blocks).
     *
     * @return All visible text chunks concatenated into a single string.
     */
    fun currentText(): String = textChunks.joinToString("")

    /**
     * Retrieves the current accumulated thinking/reasoning text from <think> blocks.
     *
     * @return All thinking/reasoning chunks concatenated into a single string.
     */
    fun currentThinking(): String = thinkingChunks.joinToString("")
  }

  /**
   * Active streaming sessions, keyed by UUID. Cleaned up on completion or after TTL (5 min normal,
   * 10 min thinking).
   */
  private val streamingSessions = ConcurrentHashMap<String, StreamingSession>()

  /** Removes streaming sessions past their TTL: 5 min for normal, 10 min for thinking mode. */
  private fun cleanupStaleSessions() {
    val now = System.currentTimeMillis()

    streamingSessions.entries.removeIf {
      val ttl = if (it.value.enableThinking) 10 * 60 * 1000L else 5 * 60 * 1000L

      it.value.startTime + ttl < now
    }
  }

  // endregion Token Streaming Infrastructure

  // region Resource Monitoring

  /**
   * Starts a background thread that periodically cleans up stale streaming sessions. Should be
   * called during initialization.
   */
  private inner class ResourceMonitor : Thread("codbi-llama-resource-monitor") {
    @Volatile
    var cpuPercent = 0.0
      private set

    @Volatile
    var ramPercent = 0.0
      private set

    /** GPU utilization (0–100). Only populated when the model offloads to a CUDA GPU. */
    @Volatile
    var gpuPercent = 0.0
      private set

    /** `true` when the model is offloaded to a CUDA GPU and `nvidia-smi` is available. */
    val gpuMonitored: Boolean
      get() = gpuPollingAvailable

    @Volatile var running = true
    /** Operating system MXBean for CPU and memory monitoring. */
    private val osMxBean: com.sun.management.OperatingSystemMXBean? =
        try {
          ManagementFactory.getOperatingSystemMXBean() as? com.sun.management.OperatingSystemMXBean
        } catch (_: Exception) {
          null
        }
    /**
     * Whether GPU polling is active. True when:
     * - The detected backend is CUDA
     * - The model offloads at least one layer to GPU (`gpuLayers != 0`)
     * - The first `nvidia-smi` probe succeeded
     */
    @Volatile private var gpuPollingAvailable = false

    /** Initializes the monitor. */
    init {
      isDaemon = true

      val usesGpu = detectedGpu == GpuBackend.CUDA && gpuLayers != 0

      if (usesGpu) {
        try {
          val probe =
              ProcessBuilder(
                      "nvidia-smi", "--query-gpu=utilization.gpu", "--format=csv,noheader,nounits")
                  .redirectErrorStream(true)
                  .start()
          val output = probe.inputStream.bufferedReader().readText().trim()

          probe.waitFor()

          if (probe.exitValue() == 0 && output.toDoubleOrNull() != null) {
            gpuPollingAvailable = true

            log(
                LogLevel.INFO,
                "Resource monitor: GPU utilization polling active (CUDA via nvidia-smi)")
          }
        } catch (X: Exception) {}
      }

      if (!gpuPollingAvailable && usesGpu) {
        log(
            LogLevel.INFO,
            "Resource monitor: GPU detected but nvidia-smi unavailable — falling back to CPU monitoring")
      }
    }

    /** The main monitoring loop. */
    override fun run() {
      while (running) {
        try {
          osMxBean?.let {
            cpuPercent = it.cpuLoad * 100.0
            val totalMem = it.totalMemorySize.toDouble()
            val freeMem = it.freeMemorySize.toDouble()
            ramPercent = if (totalMem > 0) (totalMem - freeMem) / totalMem * 100.0 else 0.0
          }

          if (gpuPollingAvailable) {
            gpuPercent = pollGpuUtilization()
          }

          sleep(1000)
        } catch (X: InterruptedException) {
          break
        } catch (X: Exception) {}
      }
    }

    /** Queries `nvidia-smi` for the current GPU utilization percentage. */
    private fun pollGpuUtilization(): Double {
      return try {
        val proc =
            ProcessBuilder(
                    "nvidia-smi", "--query-gpu=utilization.gpu", "--format=csv,noheader,nounits")
                .redirectErrorStream(true)
                .start()
        val output = proc.inputStream.bufferedReader().readText().trim()

        proc.waitFor()

        output.lines().firstOrNull()?.trim()?.toDoubleOrNull() ?: gpuPercent
      } catch (X: Exception) {
        gpuPercent
      }
    }

    /** The effective compute utilization: GPU% when offloaded to GPU, CPU% otherwise. */
    val computePercent: Double
      get() = if (gpuPollingAvailable) gpuPercent else cpuPercent

    /** The label for the compute metric ("GPU" or "CPU"). */
    val computeLabel: String
      get() = if (gpuPollingAvailable) "GPU" else "CPU"

    /** @return `true` when both compute and RAM utilisation are below their thresholds. */
    fun resourcesAvailable(): Boolean =
        computePercent < maxComputePercent && ramPercent < maxRAMPercent

    /**
     * Describes why resource thresholds are exceeded.
     *
     * @return A human-readable reason string, or `null` when resources are within limits.
     */
    fun exceedReason(): String? {
      val parts = mutableListOf<String>()

      if (computePercent >= maxComputePercent)
          parts.add("$computeLabel %.1f%% >= %.0f%%".format(computePercent, maxComputePercent))
      if (ramPercent >= maxRAMPercent)
          parts.add("RAM %.1f%% >= %.0f%%".format(ramPercent, maxRAMPercent))

      return if (parts.isEmpty()) null else parts.joinToString(", ")
    }

    /**
     * Estimates how long a caller should wait before retrying, based on how far over the thresholds
     * the metrics are.
     *
     * @return Seconds to wait, clamped to 5–120.
     */
    fun estimateWaitSeconds(): Int {
      val computeOver = (computePercent - maxComputePercent).coerceAtLeast(0.0)
      val ramOver = (ramPercent - maxRAMPercent).coerceAtLeast(0.0)

      return ((computeOver + ramOver) / 5.0).toInt().coerceIn(5, 120)
    }

    /** Stops the monitoring loop and interrupts the daemon thread. */
    fun shutdown() {
      running = false

      interrupt()
    }
  }

  // endregion Resource Monitoring
  // region Lifecycle
  /** @return The unique plugin name used for servlet registration. */
  override fun getName(): String = "CodBi_AI_LLAMA_STD"

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

    super.initialize(configData) // Let base class set up directories and read LLAMA properties
    // region Read external AI properties
    configData.properties
        .getProperty("${PROP_PREFIX}_ExternalUrl")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { externalUrl = it.trimEnd('/') }

    configData.properties
        .getProperty("${PROP_PREFIX}_ExternalApiKey")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { externalApiKey = it }

    configData.properties
        .getProperty("${PROP_PREFIX}_ExternalModel")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { externalModel = it }

    configData.properties.getProperty("${PROP_PREFIX}_ExternalNoPrompt")?.trim()?.lowercase()?.let {
      externalNoPrompt = it == "true" || it == "1" || it == "yes"
    }

    configData.properties
        .getProperty("${PROP_PREFIX}_ModelUrl")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { modelUrl = it }

    configData.properties
        .getProperty("${PROP_PREFIX}_MmprojUrl")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { mmprojUrl = it }

    configData.properties
        .getProperty("${PROP_PREFIX}_ThinkingModelUrl")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { thinkingModelUrl = it }

    configData.properties
        .getProperty("${PROP_PREFIX}_ThinkingMmprojUrl")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { thinkingMmprojUrl = it }

    configData.properties
        .getProperty("${PROP_PREFIX}_PromptIdentity")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { promptIdentity = it }

    configData.properties
        .getProperty("${PROP_PREFIX}_PromptLocation")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { promptLocation = it }

    configData.properties
        .getProperty("${PROP_PREFIX}_PromptSearch")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { promptSearch = it }

    configData.properties
        .getProperty("${PROP_PREFIX}_PromptThinking")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { promptThinking = it }

    configData.properties
        .getProperty("${PROP_PREFIX}_PromptNoInternet")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { promptNoInternet = it }

    configData.properties
        .getProperty("${PROP_PREFIX}_PromptRules")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { promptRules = it }

    configData.properties.getProperty("${PROP_PREFIX}_MaxPixels")?.trim()?.toIntOrNull()?.let {
      if (it >= 3136) maxPixels = it
    }

    configData.properties.getProperty("${PROP_PREFIX}_MaxTokens")?.trim()?.toIntOrNull()?.let {
      if (it > 0) maxTokens = it
    }

    configData.properties
        .getProperty("${PROP_PREFIX}_MaxRAMPercent")
        ?.trim()
        ?.toDoubleOrNull()
        ?.let { if (it in 1.0..110.0) maxRAMPercent = it }

    val computePropValue =
        configData.properties.getProperty("${PROP_PREFIX}_MaxComputePercent")
            ?: configData.properties.getProperty("${PROP_PREFIX}_MaxCPUPercent")
    computePropValue?.trim()?.toDoubleOrNull()?.let { if (it in 1.0..110.0) maxComputePercent = it }

    configData.properties
        .getProperty("${PROP_PREFIX}_LlamaRelease")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { customRelease ->
          llamaRelease = customRelease
          val rebuilt = buildServerUrls(customRelease)

          serverUrls.clear()
          serverUrls.putAll(rebuilt)
          log(LogLevel.INFO, "Llama release overridden to: $customRelease")
        }

    serverUrls.keys.toList().forEach { platform ->
      configData.properties
          .getProperty("${PROP_PREFIX}_ServerUrl_$platform")
          ?.trim()
          ?.takeIf { it.isNotEmpty() }
          ?.let { customUrl -> serverUrls[platform] = customUrl }
    }

    configData.properties
        .getProperty("${PROP_PREFIX}_UpdateCheckHours")
        ?.trim()
        ?.toLongOrNull()
        ?.let { if (it >= 0) checkIntervalHours = it }

    configData.properties
        .getProperty("${PROP_PREFIX}_NotifyEmail")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { notifyEmail = it }

    pluginFolder = configData.fileHelper.pluginFolder

    configData.properties
        .getProperty("AI_BraveSearch_ApiKey")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { BraveSearch.apiKey = it }
    // endregion Read external AI properties
    // region Log server state.
    log(LogLevel.INFO, "Llama release: $llamaRelease")
    log(LogLevel.INFO, "Model URL:   $modelUrl")
    log(LogLevel.INFO, "mmproj URL:  $mmprojUrl")
    log(LogLevel.INFO, "MaxPixels:   $maxPixels")
    log(LogLevel.INFO, "MaxTokens:   $maxTokens")

    if (isExternalMode) {
      log(LogLevel.INFO, "External AI: $externalUrl (model: ${externalModel ?: "default"})")
    }

    if (hasThinkingModel) {
      log(LogLevel.INFO, "Thinking model URL:   $thinkingModelUrl")
      log(LogLevel.INFO, "Thinking mmproj URL:  $thinkingMmprojUrl")
    } else {
      log(LogLevel.INFO, "Thinking model: hybrid mode (no separate model configured)")
    }

    log(
        LogLevel.INFO,
        "BraveSearch: ${if (BraveSearch.isAvailable) "enabled" else "disabled (no API key)"}")
    log(
        LogLevel.INFO,
        "Update check: every ${checkIntervalHours}h" +
            (if (checkIntervalHours == 0L) " (disabled)" else ""))

    if (isExternalMode) {
      log(LogLevel.INFO, "External AI mode — skipping local model download and server startup")
      log(LogLevel.INFO, "  URL:   $externalUrl")
      log(
          LogLevel.INFO,
          "  Model: ${externalModel ?: "(not set — WARNING: most APIs require a model name)"}")
      log(
          LogLevel.INFO,
          "  Key:   ${if (externalApiKey != null) "(set, ${externalApiKey!!.length} chars)" else "(not set)"}")

      isActive = true
      serverReady = true
      // Start resource monitor (still useful for resource-gate even with external AI)
      resourceMonitor?.shutdown()
      resourceMonitor = ResourceMonitor().also { it.start() }
      startVersionChecker()
      log(LogLevel.INFO, "Standard (external) initialized and ready for requests")

      return
    }
    // endregion Log server state.
    // Start resource monitor
    resourceMonitor?.shutdown()
    resourceMonitor = ResourceMonitor().also { it.start() }

    Thread(
            {
              try {
                val platform = detectPlatform()

                log(LogLevel.INFO, "Platform: ${platform.os}/${platform.arch}")

                val binary = downloadServerBinary(platform)

                if (binary == null) {
                  loadError = IllegalStateException("Failed to download LLAMA-Server binary")

                  return@Thread
                }

                val modelFileName = modelUrl.substringAfterLast("/")

                modelFile = File(modelsDir, modelFileName)

                if (!downloadWithResume(modelUrl, modelFile!!, "GGUF model")) {
                  loadError = IllegalStateException("Failed to download GGUF model")

                  return@Thread
                }

                val mmprojFileName = mmprojUrl.substringAfterLast("/")

                mmprojFile = File(modelsDir, mmprojFileName)

                if (!downloadWithResume(mmprojUrl, mmprojFile!!, "mmproj (vision projector)")) {
                  loadError = IllegalStateException("Failed to download mmproj file")

                  return@Thread
                }

                val started = startServer(binary, modelFile!!, mmprojFile)

                if (!started) {
                  loadError = IllegalStateException("LLAMA-Server failed to start")

                  return@Thread
                }

                isActive = true
                serverReady = true

                log(LogLevel.INFO, "Standard (llama) fast model initialized and ready for requests")

                if (hasThinkingModel) {
                  val thinkingModelFileName = thinkingModelUrl!!.substringAfterLast("/")

                  thinkingModelFile = File(modelsDir, thinkingModelFileName)

                  if (!downloadWithResume(
                      thinkingModelUrl!!, thinkingModelFile!!, "Thinking GGUF model")) {
                    log(
                        LogLevel.WARNING,
                        "Failed to download thinking model — using fast model only")
                    thinkingModelFile = null
                  }

                  if (thinkingModelFile != null && thinkingMmprojUrl != null) {
                    val thinkingMmprojFileName = thinkingMmprojUrl!!.substringAfterLast("/")

                    thinkingMmprojFile = File(modelsDir, thinkingMmprojFileName)

                    if (!downloadWithResume(
                        thinkingMmprojUrl!!, thinkingMmprojFile!!, "Thinking mmproj")) {
                      log(
                          LogLevel.WARNING,
                          "Failed to download thinking mmproj — using fast model only")

                      thinkingModelFile = null
                      thinkingMmprojFile = null
                    }
                  }
                }

                if (thinkingModelFile != null) {
                  val thinkingStarted = startThinkingServer(binary)

                  if (thinkingStarted) {
                    thinkingServerReady = true
                    activeThinkingServerPort = thinkingServerPort

                    log(LogLevel.INFO, "Thinking model server started on port $thinkingServerPort")
                  } else {
                    log(LogLevel.WARNING, "Thinking server failed to start — using fast model only")

                    thinkingModelFile = null
                  }
                }

                log(LogLevel.INFO, "Standard (llama) fully initialized and ready for requests")
              } catch (X: Exception) {
                loadError = X

                log(LogLevel.ERROR, "Initialization failed: ${X.message}", "", X)
              }
            },
            "llama-srv-init")
        .apply { isDaemon = true }
        .start()
    // Start the update checker independently of server startup
    startVersionChecker()
  }

  /**
   * Tears down all background resources: update checker, resource monitor, streaming sessions,
   * thinking server, and the base-class server process.
   *
   * @param shutdownData The formcycle shutdown payload (may be `null`).
   */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    updateChecker?.interrupt()
    updateChecker = null
    resourceMonitor?.shutdown()
    resourceMonitor = null
    serverReady = false
    thinkingServerReady = false

    stopThinkingServer()

    streamingSessions.clear()
    super.shutdown(shutdownData)
  }

  // endregion Lifecycle
  // region Thinking Model Server
  /**
   * Starts a second LLAMA-Server instance for the dedicated thinking model. Uses the same binary
   * but a different port and model file.
   *
   * @param binary The LLAMA-Server executable (shared with the fast server).
   * @return `true` if the thinking server started and passed health checks.
   */
  private fun startThinkingServer(binary: File): Boolean {
    val thinkModel = thinkingModelFile ?: return false

    thinkingServerPort = findThinkingPort(serverPort + 100)

    val resolvedThreads = threadCount ?: detectPhysicalCores()
    val resolvedGpuLayers =
        when {
          gpuLayers >= 0 -> gpuLayers
          detectedGpu != GpuBackend.NONE -> 999
          else -> 0
        }

    log(LogLevel.INFO, "Starting thinking LLAMA-Server:")
    log(LogLevel.INFO, "  Binary:  ${binary.absolutePath}")
    log(
        LogLevel.INFO,
        "  Model:   ${thinkModel.absolutePath} (${"%.0f".format(thinkModel.length() / (1024.0 * 1024.0))} MB)")

    thinkingMmprojFile?.let { log(LogLevel.INFO, "  mmproj:  ${it.absolutePath}") }

    log(LogLevel.INFO, "  Port:    $thinkingServerPort")

    val templateFile = File(binary.parentFile, "qwen3-thinking-template.jinja")

    templateFile.writeText(
        """{%- if messages[0].role == 'system' %}{%- set system_message = messages[0].content %}{%- set loop_messages = messages[1:] %}{%- else %}{%- set system_message = 'You are a helpful assistant.' %}{%- set loop_messages = messages %}{%- endif %}{{- '<|im_start|>system\n' + system_message + '<|im_end|>\n' }}{%- for message in loop_messages %}{%- if message.role == 'user' %}{%- if message.content is string %}{{- '<|im_start|>user\n' + message.content + '<|im_end|>\n' }}{%- else %}{{- '<|im_start|>user\n' }}{%- for part in message.content %}{%- if part.type == 'text' %}{{- part.text }}{%- endif %}{%- endfor %}{{- '<|im_end|>\n' }}{%- endif %}{%- elif message.role == 'assistant' %}{%- if message.reasoning_content is defined and message.reasoning_content is not none %}{{- '<|im_start|>assistant\n<think>\n' + message.reasoning_content + '\n</think>\n' + message.content + '<|im_end|>\n' }}{%- else %}{{- '<|im_start|>assistant\n' + message.content + '<|im_end|>\n' }}{%- endif %}{%- endif %}{%- endfor %}{%- if add_generation_prompt %}{{- '<|im_start|>assistant\n' }}{%- if enable_thinking is defined and enable_thinking is true %}{{- '<think>\n' }}{%- endif %}{%- endif %}"""
            .trimIndent())

    val thinkingCtxSize = ctxSize * 2
    val command =
        mutableListOf(
            binary.absolutePath,
            "--model",
            thinkModel.absolutePath,
            "--host",
            "127.0.0.1",
            "--port",
            thinkingServerPort.toString(),
            "--threads",
            resolvedThreads.toString(),
            "--ctx-size",
            thinkingCtxSize.toString(),
            "--parallel",
            parallelSlots.toString(),
            "--n-gpu-layers",
            resolvedGpuLayers.toString(),
            "--jinja",
            "--chat-template-file",
            templateFile.absolutePath)

    if (thinkingMmprojFile != null && thinkingMmprojFile!!.exists()) {
      command.addAll(listOf("--mmproj", thinkingMmprojFile!!.absolutePath))
    }

    command.addAll(extraServerArgs)

    log(LogLevel.INFO, "Thinking server command: ${command.joinToString(" ")}")

    try {
      val pb = ProcessBuilder(command)

      pb.directory(binary.parentFile)
      pb.redirectErrorStream(false)
      pb.environment()["LLAMA_LOG_TIMESTAMPS"] = "1"

      val process = pb.start()

      thinkingServerProcess = process
      thinkingStdoutThread =
          Thread(
                  {
                    try {
                      BufferedReader(InputStreamReader(process.inputStream)).use { reader ->
                        reader.lineSequence().forEach { line ->
                          log(LogLevel.INFO, "[thinking-server] $line")
                        }
                      }
                    } catch (X: Exception) {}
                  },
                  "thinking-stdout")
              .apply {
                isDaemon = true
                start()
              }

      thinkingStderrThread =
          Thread(
                  {
                    try {
                      BufferedReader(InputStreamReader(process.errorStream)).use { reader ->
                        reader.lineSequence().forEach { line ->
                          log(LogLevel.INFO, "[thinking-server/err] $line")
                        }
                      }
                    } catch (X: Exception) {}
                  },
                  "thinking-stderr")
              .apply {
                isDaemon = true
                start()
              }

      val healthy = waitForThinkingHealth()

      if (!healthy) {
        log(LogLevel.ERROR, "Thinking server failed to become healthy")
        stopThinkingServer()

        return false
      }

      log(LogLevel.INFO, "Thinking LLAMA-Server is healthy on port $thinkingServerPort")

      return true
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Failed to start thinking server: ${X.message}", "", X)
      stopThinkingServer()

      return false
    }
  }

  /**
   * Finds a free TCP port for the thinking server, starting from [preferredPort] and probing up to
   * 20 consecutive candidates.
   *
   * @param preferredPort The first port to try.
   * @return A free port number, or a system-assigned ephemeral port as last resort.
   */
  private fun findThinkingPort(preferredPort: Int): Int {
    for (offset in 0 until 20) {
      val candidate = preferredPort + offset

      if (candidate > 65535 || candidate == serverPort) continue
      try {
        java.net.ServerSocket(candidate).use { /* port is free */ }
        return candidate
      } catch (X: Exception) {}
    }

    return try {
      java.net.ServerSocket(0).use { it.localPort }
    } catch (X: Exception) {
      preferredPort
    }
  }

  /**
   * Polls the thinking server `/health` endpoint until it reports healthy or the 120 s deadline
   * elapses.
   *
   * @return `true` if the server became healthy within the deadline.
   */
  private fun waitForThinkingHealth(): Boolean {
    val deadline = System.currentTimeMillis() + 120_000L
    var lastError = ""

    while (System.currentTimeMillis() < deadline) {
      thinkingServerProcess?.let { proc ->
        if (!proc.isAlive) {
          log(LogLevel.ERROR, "Thinking server process died (exit code: ${proc.exitValue()})")

          return false
        }
      }

      try {
        val connection =
            URI("http://127.0.0.1:$thinkingServerPort/health").toURL().openConnection()
                as HttpURLConnection

        connection.connectTimeout = 2_000
        connection.readTimeout = 2_000
        connection.requestMethod = "GET"

        val responseCode = connection.responseCode
        val body =
            try {
              connection.inputStream.bufferedReader().readText()
            } catch (X: Exception) {
              ""
            }

        connection.disconnect()

        if (responseCode == 200 &&
            (body.contains("ok", ignoreCase = true) || body.contains("\"status\""))) {
          return true
        }

        lastError = "HTTP $responseCode: $body"
      } catch (X: Exception) {
        lastError = X.message ?: "connection refused"
      }

      Thread.sleep(1_000L)
    }

    log(LogLevel.ERROR, "Thinking server health check timed out. Last error: $lastError")

    return false
  }

  /** Destroys the thinking LLAMA-Server process and drains its I/O threads. */
  private fun stopThinkingServer() {
    thinkingServerProcess?.let { proc ->
      log(LogLevel.INFO, "Stopping thinking LLAMA-Server...")

      try {
        proc.destroy()

        if (!proc.waitFor(10, java.util.concurrent.TimeUnit.SECONDS)) {
          proc.destroyForcibly()
          proc.waitFor(5, java.util.concurrent.TimeUnit.SECONDS)
        }

        log(LogLevel.INFO, "Thinking server stopped (exit code: ${proc.exitValue()})")
      } catch (X: Exception) {
        log(LogLevel.WARNING, "Error stopping thinking server: ${X.message}")

        try {
          proc.destroyForcibly()
        } catch (X: Exception) {}
      }
    }

    thinkingServerProcess = null
    thinkingStdoutThread = null
    thinkingStderrThread = null
    thinkingServerReady = false

    activeThinkingServerPort = 0
  }

  // endregion Thinking Model Server
  // region Servlet-Execution
  /**
   * Handles three flows:
   * 1. **Stream-poll** — returns the current state of an in-flight streaming session.
   * 2. **Health check** — returns server readiness, model info, and resource status.
   * 3. **New question** — collects images, detects language, builds the prompt, and either streams
   *    the response (background thread + poll UUID) or returns it synchronously.
   *
   * @param params The servlet action parameters (headers, upload files, etc.).
   * @return A JSON response wrapped in [IPluginServletActionRetVal].
   */
  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val pollId =
        params.headerMap.entries.find { it.key.equals("X-Stream-Poll", ignoreCase = true) }?.value

    if (pollId != null) {
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
        return jsonResponse("{\"error\":\"Unknown or expired stream session.\"}")
      }

      val text = session.currentText()
      val done = session.done
      val err = session.error
      val resStatus = session.resourceStatus

      session.resourceStatus = null

      val visibleText = if (!session.searching && text.trimStart().startsWith("CALL")) "" else text
      val resStatusJson =
          if (resStatus != null) ",\"resourceStatus\":\"${jsonEscape(resStatus)}\"" else ""
      val searchingJson = if (session.searching) ",\"searching\":true" else ""
      val searchQueryJson =
          session.searchQuery?.let { ",\"searchQuery\":\"${jsonEscape(it)}\"" } ?: ""
      val thinkingText = session.currentThinking()
      val thinkingJson =
          if (thinkingText.isNotEmpty()) ",\"thinking\":\"${jsonEscape(thinkingText)}\"" else ""
      val modelTypeJson = ",\"modelType\":\"${session.modelType}\""
      val i18nJson =
          ",\"i18n\":{" +
              "\"reasoningLabel\":\"${jsonEscape(session.uiReasoningLabel)}\"," +
              "\"showReasoningLabel\":\"${jsonEscape(session.uiShowReasoningLabel)}\"," +
              "\"showSourcesLabel\":\"${jsonEscape(session.uiShowSourcesLabel)}\"," +
              "\"searchingLabel\":\"${jsonEscape(session.uiSearchingLabel)}\"," +
              "\"searchingLabelNoQuery\":\"${jsonEscape(session.uiSearchingLabelNoQuery)}\"," +
              "\"thinkingLabel\":\"${jsonEscape(session.uiThinkingLabel)}\"," +
              "\"copyResponseLabel\":\"${jsonEscape(session.uiCopyResponseLabel)}\"," +
              "\"copyReasoningLabel\":\"${jsonEscape(session.uiCopyReasoningLabel)}\"" +
              "}"
      // region Confidence-Data
      val confidenceJson =
          if (done && session.logprobsAvailable) {
            val mean = session.meanLogprob()
            val meanStr = if (mean != null) "%.4f".format(java.util.Locale.ROOT, mean) else "null"
            val uncertainTokens = buildString {
              append("[")

              var charOffset = 0
              var first = true

              for ((tok, lp) in session.tokenLogprobs) {
                if (lp < -2.0) {
                  if (!first) append(",")
                  append(
                      "{\"t\":\"${jsonEscape(tok)}\",\"lp\":${"%.3f".format(java.util.Locale.ROOT, lp)},\"o\":$charOffset}")
                  first = false
                }

                charOffset += tok.length
              }

              append("]")
            }

            val repFlag =
                if (session.logprobRepetitionDetected) ",\"logprobRepetition\":true" else ""
            ",\"confidence\":{\"mean\":$meanStr,\"uncertainTokens\":$uncertainTokens$repFlag}"
          } else ""
      // endregion Confidence-Data
      val jsonValue =
          if (err != null) {
            "{\"text\":\"${jsonEscape(visibleText)}\",\"done\":true,\"error\":\"${jsonEscape(err)}\"$resStatusJson$searchingJson$searchQueryJson$thinkingJson$modelTypeJson$i18nJson$confidenceJson}"
          } else {
            "{\"text\":\"${jsonEscape(visibleText)}\",\"done\":$done$resStatusJson$searchingJson$searchQueryJson$thinkingJson$modelTypeJson$i18nJson$confidenceJson}"
          }

      return jsonResponse(jsonValue)
    }

    val isHealthCheck =
        params.headerMap.entries.any {
          it.key.equals("X-Health-Check", ignoreCase = true) &&
              it.value.equals("true", ignoreCase = true)
        }

    if (isHealthCheck) {
      if (loadError != null) {
        return jsonResponse(
            "{\"error\":\"Failed to initialize: ${jsonEscape(loadError?.message ?: "unknown")}\"}")
      }

      if (!isExternalMode && !serverReady) {
        return jsonResponse(
            "{\"error\":\"Model is not ready yet. It may still be downloading or loading.\"}")
      }

      val displayModel =
          if (isExternalMode) {
            (externalModel ?: "External AI").substringAfterLast("/")
          } else {
            val raw = modelUrl.substringAfterLast("/").removeSuffix(".gguf")

            raw.replace(Regex("-[QFqf][0-9_]+[A-Za-z_]*$"), "")
          }
      val thinkingModelJson =
          if (thinkingServerReady && thinkingModelUrl != null) {
            val raw = thinkingModelUrl!!.substringAfterLast("/").removeSuffix(".gguf")
            val name = raw.replace(Regex("-[QFqf][0-9_]+[A-Za-z_]*$"), "")
            ",\"thinkingModel\":\"${jsonEscape(name)}\""
          } else if (hasThinkingModel && !thinkingServerReady) {
            ",\"pendingThinkingModel\":true"
          } else ""

      return jsonResponse(
          "{\"status\":\"ready\",\"model\":\"${jsonEscape(displayModel)}\"$thinkingModelJson}")
    }

    log(
        LogLevel.INFO,
        "Processing VQA request" +
            if (isExternalMode) " (external: $externalUrl)"
            else " (LLAMA-Server on port $serverPort)")

    resourceMonitor?.let { monitor ->
      val reason = monitor.exceedReason()

      if (reason != null) {
        val waitSec = monitor.estimateWaitSeconds()

        log(LogLevel.WARNING, "Resource gate BLOCKED: $reason — estimated wait ${waitSec}s")

        return jsonResponse(
            "{\"error\":\"Server resources exceeded ($reason). Please retry in ~${waitSec} seconds.\",\"retryAfter\":$waitSec}")
      }
    }

    if (loadError != null) {
      return jsonResponse(
          "{\"error\":\"Failed to initialize: ${jsonEscape(loadError?.message ?: "unknown")}\"}")
    }

    if (!isExternalMode && (!serverReady || !isServerAlive())) {
      // Attempt restart if server died
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
            return jsonResponse("{\"error\":\"LLAMA-Server crashed and restart failed.\"}")
          }
        }
      }

      if (!serverReady) {
        return jsonResponse(
            "{\"error\":\"Model is not ready yet. It may still be downloading or loading.\"}")
      }
    }

    val questionsToAsk = mutableMapOf<String, String>()

    params.headerMap.forEach { (headerName, headerValue) ->
      if (headerName.startsWith("x-question-", ignoreCase = true)) {
        val key = headerName.lowercase().substringAfter("x-question-", "").lowercase()

        if (key.isNotBlank() && headerValue != null) {
          val decodedValue =
              try {
                val bytes = java.util.Base64.getDecoder().decode(headerValue)
                String(bytes, Charsets.UTF_8)
              } catch (X: Exception) {
                try {
                  String(headerValue.toByteArray(Charsets.ISO_8859_1), Charsets.UTF_8)
                } catch (X: Exception) {
                  headerValue
                }
              }

          questionsToAsk[key] = decodedValue
        }
      }
    }

    if (questionsToAsk.isEmpty()) {
      return jsonResponse("{\"error\":\"No questions asked.\"}")
    }

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
      } catch (X: Exception) {
        log(LogLevel.WARNING, "Failed to parse chat history: ${X.message}")

        emptyList()
      }
    }

    if (chatHistory.isNotEmpty()) {
      log(LogLevel.INFO, "Chat history: ${chatHistory.size} turns")
    }

    val fileDataMap = collectImageData(params)
    val manualRotation =
        params.headerMap.entries
            .find { it.key.equals("X-Rotate", ignoreCase = true) }
            ?.value
            ?.trim()
            ?.toIntOrNull()
    val slotId: Int = run {
      val sid =
          params.headerMap.entries.find { it.key.equals("X-Session-Id", ignoreCase = true) }?.value
              ?: return@run -1
      Math.floorMod(sid.hashCode(), parallelSlots).also {
        log(LogLevel.INFO, "Session ${sid.take(8)}… → slot $it (of $parallelSlots)")
      }
    }
    val userWantsThinking =
        params.headerMap.entries.any {
          it.key.equals("X-Thinking", ignoreCase = true) &&
              it.value.equals("true", ignoreCase = true)
        }
    val enableThinking = userWantsThinking && thinkingServerReady
    val thinkingMode =
        when {
          enableThinking -> "dedicated (port $thinkingServerPort)"
          userWantsThinking -> "unavailable (thinking server not ready, using fast model)"
          else -> "off"
        }
    log(LogLevel.INFO, "Thinking mode: $thinkingMode")

    val thinkingTokenBudget =
        params.headerMap.entries
            .find { it.key.equals("X-Max-Thinking-Tokens", ignoreCase = true) }
            ?.value
            ?.trim()
            ?.toIntOrNull()
    val searchEnabled =
        params.headerMap.entries.none {
          it.key.equals("X-Search", ignoreCase = true) &&
              it.value.equals("false", ignoreCase = true)
        }

    log(LogLevel.INFO, "Search enabled: $searchEnabled")

    val locationEnabled =
        params.headerMap.entries.any {
          it.key.equals("X-Location", ignoreCase = true) &&
              it.value.equals("true", ignoreCase = true)
        }
    val userLatitude =
        params.headerMap.entries
            .firstOrNull { it.key.equals("X-Latitude", ignoreCase = true) }
            ?.value
    val userLongitude =
        params.headerMap.entries
            .firstOrNull { it.key.equals("X-Longitude", ignoreCase = true) }
            ?.value

    log(
        LogLevel.INFO,
        "Location enabled: $locationEnabled" +
            if (userLatitude != null && userLongitude != null)
                " (lat=$userLatitude, lon=$userLongitude)"
            else "")

    val clientIP =
        if (locationEnabled) {
          val headers = params.headerMap
          val xff =
              headers.entries.find { it.key.equals("X-Forwarded-For", ignoreCase = true) }?.value
          if (!xff.isNullOrBlank()) xff.split(",").first().trim()
          else {
            val xri = headers.entries.find { it.key.equals("X-Real-IP", ignoreCase = true) }?.value
            if (!xri.isNullOrBlank()) xri.trim() else params.remoteAddr?.trim() ?: "unknown"
          }
        } else null
    val wantsStream =
        params.headerMap.entries.any {
          it.key.equals("X-Stream", ignoreCase = true) && it.value.equals("true", ignoreCase = true)
        }

    if (wantsStream) {
      cleanupStaleSessions()

      val sessionId = UUID.randomUUID().toString()
      val session = StreamingSession(enableThinking = enableThinking)

      streamingSessions[sessionId] = session

      val questions = questionsToAsk.toMap()
      val images = fileDataMap.toMap()
      val rotation = manualRotation
      val history = chatHistory.toList()
      val slot = slotId

      Thread(
              {
                val question = questions.values.first()
                val detectedLang = detectLanguageViaModel(question)

                if (detectedLang != null) {
                  session.uiReasoningLabel = detectedLang.uiReasoningLabel
                  session.uiShowReasoningLabel = detectedLang.uiShowReasoningLabel
                  session.uiShowSourcesLabel = detectedLang.uiShowSourcesLabel
                  session.uiSearchingLabel = detectedLang.uiSearchingLabel
                  session.uiSearchingLabelNoQuery = detectedLang.uiSearchingLabelNoQuery
                  session.uiThinkingLabel = detectedLang.uiThinkingLabel
                  session.uiCopyResponseLabel = detectedLang.uiCopyResponseLabel
                  session.uiCopyReasoningLabel = detectedLang.uiCopyReasoningLabel
                }

                val userLocation =
                    if (locationEnabled) {
                      if (userLatitude != null && userLongitude != null)
                          reverseGeocode(userLatitude, userLongitude)
                      else
                          clientIP?.let { geolocateByIP(it) }
                              ?: "Ansbach, Nürnberger Straße 32, Bayern, Deutschland" // TODO:
                      // remove
                      // hardcoded
                      // test
                      // fallback
                    } else null

                try {
                  val imageParts =
                      if (images.isNotEmpty()) {
                        prepareImageParts(images, rotation)
                      } else emptyList()

                  val messages =
                      buildMessages(
                          question,
                          imageParts,
                          history,
                          searchEnabled,
                          enableThinking,
                          detectedLang,
                          locationEnabled,
                          userLocation)

                  if (enableThinking || locationEnabled)
                      log(LogLevel.INFO, "Messages JSON (first 500): ${messages.take(500)}")

                  streamChatCompletion(messages, session, enableThinking, slot)

                  val fullText = session.currentText()
                  val thinkText = session.currentThinking()

                  log(
                      LogLevel.INFO,
                      "Stream done. Text: ${fullText.take(80)}…, Thinking: ${thinkText.take(120)}… (${thinkText.length} chars)")

                  if (searchEnabled &&
                      BraveSearch.isAvailable &&
                      BraveSearch.CALL_SEARCH_PATTERN.containsMatchIn(fullText)) {
                    val rawQuery =
                        BraveSearch.CALL_SEARCH_PATTERN.find(fullText)?.groupValues?.get(1) ?: ""
                    session.searchQuery =
                        BraveSearch.sanitizeQuery(rawQuery, detectedLang?.languageName)
                    session.searching = true
                    session.textChunks.clear()

                    handleSearchToolCallStreaming(
                        fullText,
                        question,
                        imageParts,
                        history,
                        session,
                        enableThinking,
                        slot,
                        detectedLang,
                        userLocation)
                    session.searching = false
                    session.searchQuery = null
                  }
                } catch (X: Exception) {
                  session.error = X.message ?: "Unknown error"

                  log(LogLevel.ERROR, "Streaming error: ${X.message}", "", X)
                } finally {
                  if (enableThinking &&
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
                                chatCompletion(prompt, enableThinking = false, idSlot = slot)
                                    .trim()
                                    .removeSurrounding("\"")
                                    .removeSurrounding("'")
                          }
                        } catch (X: Exception) {
                          log(LogLevel.WARNING, "Fallback warning translation failed: ${X.message}")
                          "⚠ $fallbackWarningEnglish"
                        }

                    session.thinkingChunks.add("\n$translatedWarning\n")
                    session.modelType = "fast"
                    session.textChunks.clear()

                    val reasoning =
                        session
                            .currentThinking()
                            .replace("[Reasoning truncated \u2014 repetition detected]", "")
                            .replace("[Reasoning truncated \u2014 repetitive pattern detected]", "")
                            .trim()
                    val fallbackMessages =
                        buildMessages(
                            question,
                            emptyList(),
                            history,
                            searchEnabled,
                            enableThinking = false,
                            detectedLang = detectedLang,
                            locationEnabled = locationEnabled,
                            userLocation = userLocation)
                    val messagesWithReasoning =
                        if (reasoning.length > 50) {
                          val reasoningSnippet =
                              if (reasoning.length > 4000) {
                                reasoning.takeLast(4000)
                              } else {
                                reasoning
                              }
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

                    streamChatCompletion(messagesWithReasoning, session, false, slot)

                    val fallbackText = session.currentText()

                    if (searchEnabled &&
                        BraveSearch.isAvailable &&
                        BraveSearch.CALL_SEARCH_PATTERN.containsMatchIn(fallbackText)) {
                      val rawQuery =
                          BraveSearch.CALL_SEARCH_PATTERN.find(fallbackText)?.groupValues?.get(1)
                              ?: ""
                      session.searchQuery =
                          BraveSearch.sanitizeQuery(rawQuery, detectedLang?.languageName)
                      session.searching = true

                      session.textChunks.clear()
                      handleSearchToolCallStreaming(
                          fallbackText,
                          question,
                          emptyList(),
                          history,
                          session,
                          false,
                          slot,
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
                          chatCompletion(fallbackPrompt, enableThinking = false, idSlot = slot)
                              .trim()
                              .removeSurrounding("\"")
                              .removeSurrounding("'")
                      if (translated.isNotBlank()) {
                        session.textChunks.clear()
                        session.textChunks.add(translated)
                      }
                    } catch (X: Exception) {
                      log(LogLevel.WARNING, "Fallback translation failed: ${X.message}")
                    }
                  }

                  val truncationMarkers =
                      listOf(
                          "[Reasoning truncated \u2014 repetition detected]",
                          "[Reasoning truncated \u2014 repetitive pattern detected]")
                  val lang = detectedLang?.languageName

                  if (lang != null && lang != "English") {
                    for (marker in truncationMarkers) {
                      val idx = session.thinkingChunks.indexOfFirst { it.contains(marker) }

                      if (idx >= 0) {
                        try {
                          val prompt =
                              """[{"role":"user","content":"Translate the following message to $lang. Output ONLY the translated sentence in square brackets, nothing else: '$marker'"}]"""
                          val translated =
                              chatCompletion(prompt, enableThinking = false, idSlot = slot)
                                  .trim()
                                  .removeSurrounding("\"")
                                  .removeSurrounding("'")

                          if (translated.isNotBlank()) {
                            session.thinkingChunks[idx] =
                                session.thinkingChunks[idx].replace(marker, translated)
                          }
                        } catch (X: Exception) {
                          log(
                              LogLevel.WARNING,
                              "Truncation marker translation failed: ${X.message}")
                        }
                      }
                    }
                  }

                  session.done = true
                }
              },
              "llama-srv-stream-$sessionId")
          .apply { isDaemon = true }
          .start()

      log(LogLevel.INFO, "Streaming session started: $sessionId")

      return jsonResponse("{\"streamId\":\"$sessionId\"}")
    }

    val finalResults = mutableMapOf<String, Map<String, String>>()

    try {
      val imageParts =
          if (fileDataMap.isNotEmpty()) {
            prepareImageParts(fileDataMap, manualRotation)
          } else emptyList()

      for ((questionKey, question) in questionsToAsk) {
        val detectedLang = detectLanguageViaModel(question)
        val userLocation =
            if (locationEnabled) {
              if (userLatitude != null && userLongitude != null)
                  reverseGeocode(userLatitude, userLongitude)
              else
                  clientIP?.let { geolocateByIP(it) }
                      ?: "Ansbach, Nürnberger Straße 32, Bayern, Deutschland" // TODO: remove
              // hardcoded test
              // fallback
            } else null

        val messages =
            buildMessages(
                question,
                imageParts,
                chatHistory,
                searchEnabled,
                enableThinking,
                detectedLang,
                locationEnabled,
                userLocation)
        var answer = chatCompletion(messages, enableThinking, slotId, thinkingTokenBudget)

        if (enableThinking && answer.isBlank()) {
          log(
              LogLevel.INFO,
              "Thinking model produced no visible answer for Q[$questionKey] — falling back to fast model")

          val fallbackMessages =
              buildMessages(
                  question,
                  imageParts,
                  chatHistory,
                  searchEnabled,
                  enableThinking = false,
                  detectedLang,
                  locationEnabled,
                  userLocation)

          answer = chatCompletion(fallbackMessages, enableThinking = false, idSlot = slotId)
        }

        if (searchEnabled) {
          answer =
              handleSearchToolCall(
                  answer,
                  question,
                  imageParts,
                  chatHistory,
                  enableThinking,
                  slotId,
                  detectedLang,
                  userLocation)
        }

        finalResults[questionKey] = mapOf("answer" to answer)

        log(LogLevel.INFO, "Q[$questionKey]: ${question.take(80)}… → $answer")
      }
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Inference error: ${X.message}", "", X)

      return jsonResponse("{\"error\":\"${jsonEscape(X.message ?: "Inference failed")}\"}")
    }

    val jsonBody = buildString {
      append("{")

      val entries = finalResults.entries.toList()

      for ((idx, entry) in entries.withIndex()) {
        append("\"${jsonEscape(entry.key)}\":{")

        val innerEntries = entry.value.entries.toList()

        for ((iIdx, inner) in innerEntries.withIndex()) {
          append("\"${jsonEscape(inner.key)}\":\"${jsonEscape(inner.value)}\"")
          if (iIdx < innerEntries.size - 1) append(",")
        }

        append("}")

        if (idx < entries.size - 1) append(",")
      }
      append("}")
    }

    return jsonResponse(jsonBody)
  }

  // endregion Servlet execute
  // region Image Handling
  /**
   * Collects image data from both multipart upload files and base64 data-URL parameters.
   *
   * @param params The servlet action parameters containing upload files and headers.
   * @return A map of input name → raw image bytes.
   */
  private fun collectImageData(params: IPluginServletActionParams): Map<String, ByteArray> {
    val fileDataMap = mutableMapOf<String, ByteArray>()

    params.uploadFiles?.forEach { (inputName, fileDataList) ->
      val combinedBytes =
          fileDataList.fold(byteArrayOf()) { acc, fd -> acc + (fd.data ?: byteArrayOf()) }

      if (combinedBytes.isNotEmpty()) {
        fileDataMap[inputName] = combinedBytes

        log(LogLevel.INFO, "Upload image '$inputName': ${combinedBytes.size} bytes")
      }
    }

    params.requestParameters?.forEach { (key, values) ->
      if (key.startsWith("codbi-base64:")) {
        val imageName = key.removePrefix("codbi-base64:")
        val dataUrl = values.firstOrNull() ?: return@forEach
        val base64 = dataUrl.substringAfter(",")

        try {
          val bytes = java.util.Base64.getDecoder().decode(base64)

          if (bytes.isNotEmpty()) {
            fileDataMap[imageName] = bytes

            log(LogLevel.INFO, "Base64 param image '$imageName': ${bytes.size} bytes")
          }
        } catch (X: Exception) {
          log(LogLevel.WARNING, "Failed to decode base64 for '$imageName': ${X.message}")
        }
      }
    }

    log(
        LogLevel.INFO,
        "Image data: ${fileDataMap.size} images, " +
            "path = ${if (fileDataMap.isNotEmpty()) "IMAGE" else "TEXT-ONLY"}")

    return fileDataMap
  }

  /**
   * Prepares image data for the OpenAI-compatible API: applies rotation, downscales to fit the
   * pixel budget, and encodes as base64 PNG.
   *
   * @return List of base64-encoded PNG strings (data URI format: `data:image/png;base64,...`)
   */
  private fun prepareImageParts(
      fileDataMap: Map<String, ByteArray>,
      manualRotation: Int?
  ): List<String> {
    val entries =
        fileDataMap.entries.sortedWith(
            compareBy {
              Regex("_(\\d+)\\.[^.]+$").find(it.key)?.groupValues?.get(1)?.toIntOrNull() ?: 0
            })

    return entries.mapNotNull { (inputName, imageBytes) ->
      try {
        val rotatedBytes = run {
          val buf = ImageIO.read(ByteArrayInputStream(imageBytes)) ?: return@run imageBytes
          val degrees =
              if (manualRotation != null && manualRotation != 0) {
                manualRotation
              } else if (TesseractAction.isOsdAvailable) {
                val detected = TesseractAction.detectOrientation(buf)

                if (detected != 0) {
                  log(
                      LogLevel.INFO,
                      "Tesseract OSD auto-detected rotation for '$inputName': ${detected}°")
                }

                detected
              } else 0

          if (degrees != 0) {
            when (degrees) {
              90,
              180,
              270 -> {
                val rotated = rotateImage(buf, degrees)
                val baos = ByteArrayOutputStream()
                ImageIO.write(rotated, "PNG", baos)
                baos.toByteArray()
              }
              else -> imageBytes
            }
          } else imageBytes
        }

        val finalBytes = downscaleIfNeeded(rotatedBytes)
        val base64 = java.util.Base64.getEncoder().encodeToString(finalBytes)

        log(LogLevel.INFO, "Image '$inputName' prepared: ${finalBytes.size} bytes → base64")
        "data:image/png;base64,$base64"
      } catch (X: Exception) {
        log(LogLevel.WARNING, "Failed to prepare image '$inputName': ${X.message}")

        null
      }
    }
  }

  /**
   * Downscales image bytes if the total pixel count exceeds [maxPixels].
   *
   * @param imageBytes Raw image bytes (PNG, JPEG, etc.).
   * @return Downscaled PNG bytes, or the original bytes if no scaling was needed.
   */
  private fun downscaleIfNeeded(imageBytes: ByteArray): ByteArray {
    try {
      val img = ImageIO.read(ByteArrayInputStream(imageBytes)) ?: return imageBytes
      val totalPixels = img.width.toLong() * img.height.toLong()

      if (totalPixels <= maxPixels) return imageBytes

      val scale = Math.sqrt(maxPixels.toDouble() / totalPixels)
      val newW = (img.width * scale).toInt().coerceAtLeast(28)
      val newH = (img.height * scale).toInt().coerceAtLeast(28)

      log(
          LogLevel.INFO,
          "Backend downscaling: ${img.width}\u00d7${img.height} (${totalPixels}px) \u2192 " +
              "${newW}\u00d7${newH} (maxPixels=$maxPixels)")

      val scaled = BufferedImage(newW, newH, BufferedImage.TYPE_INT_RGB)
      val g2d = scaled.createGraphics()

      g2d.setRenderingHint(
          java.awt.RenderingHints.KEY_INTERPOLATION,
          java.awt.RenderingHints.VALUE_INTERPOLATION_BILINEAR)
      g2d.drawImage(img, 0, 0, newW, newH, null)
      g2d.dispose()

      val baos = ByteArrayOutputStream()

      ImageIO.write(scaled, "PNG", baos)

      return baos.toByteArray()
    } catch (X: Exception) {
      log(LogLevel.WARNING, "Downscale failed: ${X.message} — using original")

      return imageBytes
    }
  }

  /**
   * Rotates a [BufferedImage] by 90, 180, or 270 degrees.
   *
   * @param image The source image.
   * @param degrees Rotation angle (must be a multiple of 90).
   * @return A new [BufferedImage] with the rotation applied.
   */
  private fun rotateImage(image: BufferedImage, degrees: Int): BufferedImage {
    val rads = Math.toRadians(degrees.toDouble())
    val sin = Math.abs(Math.sin(rads))
    val cos = Math.abs(Math.cos(rads))
    val w = image.width
    val h = image.height
    val newW = Math.floor(w * cos + h * sin).toInt()
    val newH = Math.floor(h * cos + w * sin).toInt()
    val rotated =
        BufferedImage(
            newW, newH, image.type.let { if (it == 0) BufferedImage.TYPE_INT_ARGB else it })
    val g2d = rotated.createGraphics()
    val at = AffineTransform()

    at.translate(newW / 2.0, newH / 2.0)
    at.rotate(rads, 0.0, 0.0)
    at.translate(-w / 2.0, -h / 2.0)
    g2d.transform = at
    g2d.drawImage(image, 0, 0, null)
    g2d.dispose()

    return rotated
  }

  // endregion Image Handling
  // region Web Search Tool
  /** Maximum number of search round-trips to prevent infinite loops. */
  private val maxSearchRoundTrips = 2

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
   * @return The final answer (either the original or the search-augmented one).
   */
  private fun handleSearchToolCall(
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
      var query = match.groupValues[1]

      log(LogLevel.INFO, "Model requested web search (round $round): '$query'")

      if (userLocation != null) {
        val shortLocation = userLocation.substringBefore(",").trim()

        if (shortLocation.isNotEmpty() && !query.contains(shortLocation, ignoreCase = true)) {
          query = "$query $shortLocation"

          log(LogLevel.INFO, "Location-enriched search query: '$query'")
        }
      }

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

      val followUpQuestion = searchFollowUpPrompt(originalQuestion, detectedLang)
      val messages =
          buildMessages(
              followUpQuestion,
              imageParts,
              extendedHistory,
              enableThinking = false,
              detectedLang = detectedLang)
      answer = chatCompletion(messages, false, slotId)

      log(LogLevel.INFO, "Search-augmented answer (round $round): ${answer.take(120)}…")
    }

    return answer
  }

  /**
   * Handles `CALL:search` in streaming mode. When the completed stream text contains a search call,
   * performs the search and streams a follow-up completion.
   *
   * @param initialAnswer The model's first response (may contain CALL:search).
   * @param originalQuestion The user's original question.
   * @param imageParts Base64 image URIs (carried forward).
   * @param chatHistory Previous conversation turns.
   * @param enableThinking Whether thinking mode is on.
   * @param slotId The slot ID for inference.
   * @return The final answer (either the original or the search-augmented one).
   */
  private fun handleSearchToolCallStreaming(
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

    val match = BraveSearch.CALL_SEARCH_PATTERN.find(fullText) ?: return
    var query = match.groupValues[1]

    log(LogLevel.INFO, "Streaming: Model raw output: '${fullText.take(200)}'")
    log(LogLevel.INFO, "Streaming: Model requested web search: '$query'")

    if (userLocation != null) {
      val shortLocation = userLocation.substringBefore(",").trim()

      if (shortLocation.isNotEmpty() && !query.contains(shortLocation, ignoreCase = true)) {
        query = "$query $shortLocation"

        log(LogLevel.INFO, "Streaming: Location-enriched search query: '$query'")
      }
    }

    val results = BraveSearch.search(query, detectedLang?.braveCountry, detectedLang?.languageName)

    if (results.isEmpty()) {
      session.textChunks.clear()
      session.textChunks.add("The web search returned no results. Please try a different query.")

      return
    }

    val searchContext = BraveSearch.formatResultsForModel(results)
    val priorReasoning = session.currentThinking().trim()

    session.textChunks.clear()
    session.thinkingChunks.clear()
    session.tokenLogprobs.clear()

    if (priorReasoning.isNotEmpty()) {
      session.thinkingChunks.add(priorReasoning)
      session.thinkingChunks.add("\n\n---\n\n")
    }

    val searchLabel =
        detectedLang?.searchingLabel?.format(query)
            ?: "\uD83D\uDD0D Searching the web for: \"$query\""

    session.thinkingChunks.add("$searchLabel\n\n")

    for ((index, result) in results.withIndex()) {
      session.thinkingChunks.add(
          "[${index + 1}] ${result.title}\n    ${result.url}\n    ${result.description.take(150)}\n\n")
    }

    val analyzeLabel =
        detectedLang?.analyzingLabel?.format(results.size)
            ?: "Analyzing ${results.size} results to formulate an answer."

    session.thinkingChunks.add(analyzeLabel)

    val extendedHistory = chatHistory.toMutableList()

    extendedHistory.add("user" to originalQuestion)

    val assistantContext = match.value

    extendedHistory.add("assistant" to assistantContext)
    extendedHistory.add("user" to searchContext)

    val followUpQuestion = searchFollowUpPrompt(originalQuestion, detectedLang)

    val messages =
        buildMessages(
            followUpQuestion,
            imageParts,
            extendedHistory,
            enableThinking = false,
            detectedLang = detectedLang)

    streamChatCompletion(messages, session, false, slotId)
  }

  // endregion Web Search Tool
  // region Message Building
  /**
   * Builds OpenAI-compatible messages array for /v1/chat/completions.
   *
   * @param question The user's question text.
   * @param imageParts Base64 data URIs for images (may be empty for text-only).
   * @param chatHistory Previous conversation turns.
   * @return JSON string of the messages array.
   */
  private fun buildMessages(
      question: String,
      imageParts: List<String>,
      chatHistory: List<Pair<String, String>>,
      searchEnabled: Boolean = true,
      enableThinking: Boolean = false,
      detectedLang: DetectedLanguage? = null,
      locationEnabled: Boolean = false,
      userLocation: String? = null
  ): String {
    return buildString {
      append("[")

      val today =
          java.time.LocalDate.now()
              .format(
                  java.time.format.DateTimeFormatter.ofPattern(
                      "d MMMM yyyy", java.util.Locale.ENGLISH))

      append("{\"role\":\"system\",\"content\":\"")

      val skipPrompts = isExternalMode && externalNoPrompt

      if (!skipPrompts) {
        if (promptIdentity != null) {
          append(promptIdentity!!.replace("{date}", today))
          append(" ")
        } else {
          append("You are a helpful assistant. Today is $today. Answer precisely and concisely. ")
        }

        if (locationEnabled && userLocation != null) {
          if (promptLocation != null) {
            append(promptLocation!!.replace("{location}", userLocation))
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

        if (searchEnabled && BraveSearch.isAvailable) {
          if (promptSearch != null) {
            append(promptSearch!!)
            append(" ")
          } else {
            append(
                "When you need current info, reply ONLY with CALL:search(query='your search query'). ")
            append(
                "CRITICAL: For questions about specific factual details (phone numbers, addresses, opening hours, prices, contact info, official data), " +
                    "you MUST ALWAYS use CALL:search — NEVER answer from memory alone. " +
                    "Even if a similar question was answered earlier in this conversation, ALWAYS search again — previous answers may have been given without internet access and could be wrong. ")
            append(
                "The search query MUST be about the user's ACTUAL topic. Extract the core subject from the user's question. ")
            append(
                "SANITIZE: remove person names, serial numbers, IDs, and any code mixing letters+digits. Keep brand names and topic keywords. ")
          }

          if (detectedLang != null && detectedLang.languageName != "English") {
            append(
                "IMPORTANT: Always write search queries in ${detectedLang.languageName}, NEVER in English. ")

            val productQ = detectedLang.exampleProductQuery
            val lawQ = detectedLang.exampleLawQuery
            val weatherQ = detectedLang.exampleWeatherQuery
            val localQ = detectedLang.exampleLocalQuery

            append("Example: user asks about a product error → CALL:search(query='$productQ'). ")
            append("Example: user asks about contract law → CALL:search(query='$lawQ'). ")

            if (locationEnabled && userLocation != null) {
              val shortLocation = userLocation.substringBefore(",").trim()

              append(
                  "Example: user asks about weather → CALL:search(query='$weatherQ $shortLocation'). ")
              append(
                  "Example: user asks where to eat → CALL:search(query='$localQ $shortLocation'). ")
            } else {
              append("Example: user asks about weather → CALL:search(query='$weatherQ'). ")
              append("Example: user asks where to eat → CALL:search(query='$localQ'). ")
            }
          } else {
            append(
                "Example: user asks about a product error → CALL:search(query='ProductName error fix'). ")
            append(
                "Example: user asks about contract law → CALL:search(query='contract termination rules'). ")

            if (locationEnabled && userLocation != null) {
              val shortLocation = userLocation.substringBefore(",").trim()

              append(
                  "Example: user asks about weather → CALL:search(query='weather forecast $shortLocation'). ")
              append(
                  "Example: user asks where to eat → CALL:search(query='restaurants near me $shortLocation'). ")
            } else {
              append(
                  "Example: user asks about weather → CALL:search(query='weather forecast tomorrow'). ")
              append("Example: user asks where to eat → CALL:search(query='restaurants near me'). ")
            }
          }

          append(
              "EXCEPTION: If the user wraps a word in << >>, copy it into the query verbatim with the << >> markers. ")
          append(
              "Example: 'What did << Elon Musk >> say about AI?' → CALL:search(query='<< Elon Musk >> AI statements'). ")
          append(
              "Never include person names in the query UNLESS they are wrapped in << >>. Never use '...' as the query. ")
          append(
              "IMPORTANT: The search query must match the user's actual question topic — never copy an example query. ")

          if (enableThinking) {
            if (promptThinking != null) {
              val langName = detectedLang?.languageName ?: "English"

              append(promptThinking!!.replace("{language}", langName))
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
        }

        if (!searchEnabled || !BraveSearch.isAvailable) {
          if (promptNoInternet != null) {
            append(promptNoInternet!!)
            append(" ")
          } else {
            append(
                "IMPORTANT: You do NOT have internet access. " +
                    "NEVER fabricate or guess ANY information you are not certain about. " +
                    "If you do not know something, clearly say so and suggest the user enable internet search or look it up directly. " +
                    "Do NOT invent plausible-sounding answers — honesty about your limits is always better than a wrong answer. ")
          }
        }

        if (promptRules != null) {
          append(promptRules!!)
        } else {
          append(
              "CRITICAL LANGUAGE RULE: Always respond in the EXACT language of the user's CURRENT message. If the user switches language mid-conversation, switch with them immediately. Never mention or reference products, brands, or services that are not part of the user's question. ")
          append(
              "When mentioning measurements, always show BOTH metric and imperial units: °C (°F), km (mi), m (ft), kg (lbs), km/h (mph), liters (gallons), cm (in), etc. ")
          append(
              "Each question is independent — answer ONLY the current question. Do NOT repeat or mix in information from previous answers unless the user explicitly refers to them.")
        }

        if (imageParts.isNotEmpty()) {
          append(
              " DOCUMENT GROUNDING: The user has uploaded a document. " +
                  "Answer ONLY based on what you can actually see in the provided document image(s). " +
                  "Do NOT recite general knowledge about the type of document, its typical contents, or information you may know from training data. " +
                  "If the document is unreadable or a specific detail is not visible, say so honestly instead of guessing or filling in from general knowledge. " +
                  "Internet search, if available, should only be used when the user explicitly asks for external information — never to supplement or replace what is in the document.")
        }
      }
      append("\"}")

      var effectiveHistory =
          if (chatHistory.isNotEmpty() &&
              chatHistory.last().first == "user" &&
              chatHistory.last().second == question) {
            chatHistory.dropLast(1)
          } else {
            chatHistory
          }

      for ((role, content) in effectiveHistory) {
        append(",{\"role\":\"${jsonEscape(role)}\",\"content\":\"${jsonEscape(content)}\"}")
      }

      val lang = detectedLang ?: detectLanguage(question)

      if (lang != null) {
        append(",{\"role\":\"user\",\"content\":\"${jsonEscape(lang.userTurn)}\"}")
        append(",{\"role\":\"assistant\",\"content\":\"${jsonEscape(lang.assistantTurn)}\"}")

        if (effectiveHistory.isNotEmpty()) {
          append(
              ",{\"role\":\"system\",\"content\":\"LANGUAGE SWITCH: The user is now writing in ${lang.languageName}. You MUST respond ENTIRELY in ${lang.languageName}, regardless of what language was used earlier in the conversation.\"}")
        }
      }

      if (effectiveHistory.isNotEmpty()) {
        val capabilities = mutableListOf<String>()

        if (searchEnabled && BraveSearch.isAvailable) {
          capabilities.add("internet search via CALL:search")
        }

        if (locationEnabled && userLocation != null) {
          capabilities.add("the user's location ($userLocation)")
        }

        if (capabilities.isNotEmpty()) {
          val capList = capabilities.joinToString(" and ")

          append(",{\"role\":\"user\",\"content\":\"Do you have access to $capList now?\"}")
          append(
              ",{\"role\":\"assistant\",\"content\":\"Yes! I now have access to $capList. " +
                  "Disregard anything I said earlier about not being able to help — I can now answer fully.\"}")
        }
      }

      append(",{\"role\":\"user\",\"content\":")

      if (imageParts.isNotEmpty()) {
        append("[")

        for (imageUri in imageParts) {
          append("{\"type\":\"image_url\",\"image_url\":{\"url\":\"${jsonEscape(imageUri)}\"}},")
        }

        append("{\"type\":\"text\",\"text\":\"${jsonEscape(question)}\"}")
        append("]")
      } else {
        append("\"${jsonEscape(question)}\"")
      }

      append("}")

      if (enableThinking) {
        val thinkSeed =
            if (lang != null) lang.thinkSeed else "Think briefly. Do NOT repeat yourself."

        append(",{\"role\":\"assistant\",\"content\":\"<think>\\n$thinkSeed\"}")
      }

      append("]")
    }
  }

  // endregion Message Building
  // region Language Detection & Geolocation
  /**
   * Holds the language-negotiation strings for a detected non-English language.
   *
   * @property userTurn "Let's talk in [language]" — injected as a fake user turn.
   * @property assistantTurn Short confirmation — injected as the assistant's reply.
   * @property thinkSeed Opening phrase pre-filled into the `<think>` block.
   * @property searchPrompt Follow-up instruction for answering from search results.
   * @property searchingLabel Localized "Searching the web for" label (with %s placeholder for
   *   query).
   * @property analyzingLabel Localized "Analyzing N results" label (with %d placeholder for count).
   */
  private data class DetectedLanguage(
      val userTurn: String,
      val assistantTurn: String,
      val thinkSeed: String,
      val searchPrompt: String,
      val searchingLabel: String = "\uD83D\uDD0D Searching the web for: \"%s\"",
      val analyzingLabel: String = "Analyzing %d results to formulate an answer.",
      val braveCountry: String? = null,
      val languageName: String = "English",
      val exampleProductQuery: String = "ProductName error fix",
      val exampleLawQuery: String = "contract termination rules",
      val exampleWeatherQuery: String = "weather forecast",
      val exampleLocalQuery: String = "restaurants near me",
      val uiReasoningLabel: String = "Reasoning\u2026",
      val uiShowReasoningLabel: String = "Show reasoning",
      val uiShowSourcesLabel: String = "Show sources",
      val uiSearchingLabel: String = "Searching the internet for \u201C%s\u201D\u2026",
      val uiSearchingLabelNoQuery: String = "Searching the internet\u2026",
      val uiThinkingLabel: String = "Thinking\u2026",
      val uiCopyResponseLabel: String = "Response",
      val uiCopyReasoningLabel: String = "Reasoning"
  )

  /** Pre-built language negotiation objects keyed by lowercase language name. */
  private val languageMap: Map<String, DetectedLanguage> =
      mapOf(
              "german" to
                  DetectedLanguage(
                      userTurn = "Lass uns auf Deutsch reden.",
                      assistantTurn = "Klar, ich antworte auf Deutsch!",
                      thinkSeed =
                          "SPRACHE: Deutsch. Alles auf Deutsch — auch dieses Denken. Denke auf Deutsch. Antworte auf Deutsch. Kurz denken, NICHT wiederholen.",
                      searchPrompt =
                          "Gib eine kurze, direkte Antwort auf Deutsch in 2-4 Sätzen basierend auf den Suchergebnissen. Füge relevante Links aus den Ergebnissen als Markdown-Links hinzu. Wiederhole dich nicht. Antworte AUF DEUTSCH.",
                      searchingLabel = "\uD83D\uDD0D Suche im Web: \"%s\"",
                      analyzingLabel = "%d Ergebnisse werden analysiert…",
                      braveCountry = "DE",
                      languageName = "German",
                      exampleProductQuery = "ProduktName Fehler Lösung",
                      exampleLawQuery = "Vertragskündigung Regeln",
                      exampleWeatherQuery = "Wettervorhersage",
                      exampleLocalQuery = "Restaurant in der Nähe",
                      uiReasoningLabel = "Denkt nach\u2026",
                      uiShowReasoningLabel = "Denkprozess anzeigen",
                      uiShowSourcesLabel = "Quellen anzeigen",
                      uiSearchingLabel = "Suche im Internet nach \u201E%s\u201C\u2026",
                      uiSearchingLabelNoQuery = "Suche im Internet\u2026",
                      uiThinkingLabel = "Denkt nach\u2026",
                      uiCopyResponseLabel = "Antwort",
                      uiCopyReasoningLabel = "Denkprozess"),
              "deutsch" to null,
              "italian" to
                  DetectedLanguage(
                      userTurn = "Parliamo in italiano.",
                      assistantTurn = "Certo, rispondo in italiano!",
                      thinkSeed =
                          "LINGUA: Italiano. Tutto in italiano — anche questo ragionamento. Pensa in italiano. Rispondi in italiano. Sii breve, NON ripetere.",
                      searchPrompt =
                          "Dai una risposta breve e diretta in italiano in 2-4 frasi usando i risultati di ricerca. Aggiungi link rilevanti dai risultati come link Markdown. Non ripetere. Rispondi IN ITALIANO.",
                      searchingLabel = "\uD83D\uDD0D Ricerca web: \"%s\"",
                      analyzingLabel = "Analisi di %d risultati in corso…",
                      braveCountry = "IT",
                      languageName = "Italian",
                      exampleProductQuery = "NomeProdotto errore soluzione",
                      exampleLawQuery = "risoluzione contratto regole",
                      exampleWeatherQuery = "previsioni meteo",
                      exampleLocalQuery = "ristoranti vicino a me",
                      uiReasoningLabel = "Ragionamento\u2026",
                      uiShowReasoningLabel = "Mostra ragionamento",
                      uiShowSourcesLabel = "Mostra fonti",
                      uiSearchingLabel = "Ricerca in Internet per \u201C%s\u201D\u2026",
                      uiSearchingLabelNoQuery = "Ricerca in Internet\u2026",
                      uiThinkingLabel = "Sto pensando\u2026",
                      uiCopyResponseLabel = "Risposta",
                      uiCopyReasoningLabel = "Ragionamento"),
              "italiano" to null,
              "french" to
                  DetectedLanguage(
                      userTurn = "Parlons en français.",
                      assistantTurn = "Bien sûr, je réponds en français !",
                      thinkSeed =
                          "LANGUE: Français. Tout en français — y compris cette réflexion. Réfléchis en français. Réponds en français. Sois bref, NE te répète PAS.",
                      searchPrompt =
                          "Donne une réponse courte et directe en français en 2-4 phrases en utilisant les résultats de recherche. Ajoute des liens pertinents depuis les résultats comme liens Markdown. Ne te répète pas. Réponds EN FRANÇAIS.",
                      searchingLabel = "\uD83D\uDD0D Recherche web : \u00ab %s \u00bb",
                      analyzingLabel = "Analyse de %d résultats en cours…",
                      braveCountry = "FR",
                      languageName = "French",
                      exampleProductQuery = "NomProduit erreur solution",
                      exampleLawQuery = "résiliation contrat règles",
                      exampleWeatherQuery = "prévisions météo",
                      exampleLocalQuery = "restaurants près de moi",
                      uiReasoningLabel = "Réflexion\u2026",
                      uiShowReasoningLabel = "Afficher le raisonnement",
                      uiShowSourcesLabel = "Afficher les sources",
                      uiSearchingLabel = "Recherche sur Internet \u00ab %s \u00bb\u2026",
                      uiSearchingLabelNoQuery = "Recherche sur Internet\u2026",
                      uiThinkingLabel = "Réflexion en cours\u2026",
                      uiCopyResponseLabel = "Réponse",
                      uiCopyReasoningLabel = "Raisonnement"),
              "français" to null,
              "francais" to null,
              "spanish" to
                  DetectedLanguage(
                      userTurn = "Hablemos en español.",
                      assistantTurn = "¡Claro, respondo en español!",
                      thinkSeed =
                          "IDIOMA: Español. Todo en español — incluido este razonamiento. Piensa en español. Responde en español. Sé breve, NO repitas.",
                      searchPrompt =
                          "Da una respuesta corta y directa en español en 2-4 oraciones usando los resultados de búsqueda. Agrega enlaces relevantes de los resultados como enlaces Markdown. No te repitas. Responde EN ESPAÑOL.",
                      searchingLabel = "\uD83D\uDD0D Búsqueda web: \"%s\"",
                      analyzingLabel = "Analizando %d resultados…",
                      braveCountry = "ES",
                      languageName = "Spanish",
                      exampleProductQuery = "NombreProducto error solución",
                      exampleLawQuery = "rescisión contrato reglas",
                      exampleWeatherQuery = "pronóstico del tiempo",
                      exampleLocalQuery = "restaurantes cerca de mí",
                      uiReasoningLabel = "Razonando\u2026",
                      uiShowReasoningLabel = "Mostrar razonamiento",
                      uiShowSourcesLabel = "Mostrar fuentes",
                      uiSearchingLabel = "Buscando en Internet \u201C%s\u201D\u2026",
                      uiSearchingLabelNoQuery = "Buscando en Internet\u2026",
                      uiThinkingLabel = "Pensando\u2026",
                      uiCopyResponseLabel = "Respuesta",
                      uiCopyReasoningLabel = "Razonamiento"),
              "español" to null,
              "espanol" to null,
              "portuguese" to
                  DetectedLanguage(
                      userTurn = "Vamos falar em português.",
                      assistantTurn = "Claro, respondo em português!",
                      thinkSeed =
                          "IDIOMA: Português. Tudo em português — incluindo este raciocínio. Pense em português. Responda em português. Seja breve, NÃO repita.",
                      searchPrompt =
                          "Dê uma resposta curta e direta em português em 2-4 frases usando os resultados de pesquisa. Adicione links relevantes dos resultados como links Markdown. Não se repita. Responda EM PORTUGUÊS.",
                      searchingLabel = "\uD83D\uDD0D Busca na web: \"%s\"",
                      analyzingLabel = "Analisando %d resultados…",
                      braveCountry = "BR",
                      languageName = "Portuguese",
                      exampleProductQuery = "NomeProduto erro solução",
                      exampleLawQuery = "rescisão contrato regras",
                      exampleWeatherQuery = "previsão do tempo",
                      exampleLocalQuery = "restaurantes perto de mim",
                      uiReasoningLabel = "Raciocinando\u2026",
                      uiShowReasoningLabel = "Mostrar raciocínio",
                      uiShowSourcesLabel = "Mostrar fontes",
                      uiSearchingLabel = "Pesquisando na Internet por \u201C%s\u201D\u2026",
                      uiSearchingLabelNoQuery = "Pesquisando na Internet\u2026",
                      uiThinkingLabel = "Pensando\u2026",
                      uiCopyResponseLabel = "Resposta",
                      uiCopyReasoningLabel = "Raciocínio"),
              "português" to null,
              "portugues" to null,
              "dutch" to
                  DetectedLanguage(
                      userTurn = "Laten we Nederlands praten.",
                      assistantTurn = "Natuurlijk, ik antwoord in het Nederlands!",
                      thinkSeed =
                          "TAAL: Nederlands. Alles in het Nederlands — ook dit denkproces. Denk in het Nederlands. Antwoord in het Nederlands. Wees kort, herhaal NIET.",
                      searchPrompt =
                          "Geef een kort, direct antwoord in het Nederlands in 2-4 zinnen op basis van de zoekresultaten. Voeg relevante links uit de resultaten toe als Markdown-links. Herhaal niet. Antwoord IN HET NEDERLANDS.",
                      searchingLabel = "\uD83D\uDD0D Zoeken op het web: \"%s\"",
                      analyzingLabel = "%d resultaten worden geanalyseerd…",
                      braveCountry = "NL",
                      languageName = "Dutch",
                      exampleProductQuery = "ProductNaam fout oplossing",
                      exampleLawQuery = "contractontbinding regels",
                      exampleWeatherQuery = "weersvoorspelling",
                      exampleLocalQuery = "restaurants in de buurt",
                      uiReasoningLabel = "Aan het nadenken\u2026",
                      uiShowReasoningLabel = "Redenering tonen",
                      uiShowSourcesLabel = "Bronnen tonen",
                      uiSearchingLabel = "Zoeken op internet naar \u201C%s\u201D\u2026",
                      uiSearchingLabelNoQuery = "Zoeken op internet\u2026",
                      uiThinkingLabel = "Aan het nadenken\u2026",
                      uiCopyResponseLabel = "Antwoord",
                      uiCopyReasoningLabel = "Redenering"),
              "nederlands" to null,
              "turkish" to
                  DetectedLanguage(
                      userTurn = "Türkçe konuşalım.",
                      assistantTurn = "Tabii, Türkçe cevap veriyorum!",
                      thinkSeed =
                          "DİL: Türkçe. Her şeyi Türkçe yaz — bu düşünme süreci dahil. Türkçe düşün. Türkçe cevapla. Kısa tut, tekrar ETME.",
                      searchPrompt =
                          "Arama sonuçlarını kullanarak Türkçe olarak 2-4 cümlelik kısa ve doğrudan bir yanıt ver. Sonuçlardan ilgili bağlantıları Markdown bağlantıları olarak ekle. Tekrar etme. TÜRKÇE CEVAPLA.",
                      searchingLabel = "\uD83D\uDD0D Web'de aranıyor: \"%s\"",
                      analyzingLabel = "%d sonuç analiz ediliyor…",
                      braveCountry = "TR",
                      languageName = "Turkish",
                      exampleProductQuery = "ÜrünAdı hata çözüm",
                      exampleLawQuery = "sözleşme feshi kuralları",
                      exampleWeatherQuery = "hava durumu tahmini",
                      exampleLocalQuery = "yakınımdaki restoranlar",
                      uiReasoningLabel = "Düşünüyor\u2026",
                      uiShowReasoningLabel = "Akıl yürütmeyi göster",
                      uiShowSourcesLabel = "Kaynakları göster",
                      uiSearchingLabel = "İnternette aranıyor: \u201C%s\u201D\u2026",
                      uiSearchingLabelNoQuery = "İnternette aranıyor\u2026",
                      uiThinkingLabel = "Düşünüyor\u2026",
                      uiCopyResponseLabel = "Yanıt",
                      uiCopyReasoningLabel = "Akıl yürütme"),
              "türkçe" to null,
              "turkce" to null,
              "japanese" to
                  DetectedLanguage(
                      userTurn = "日本語で話しましょう。",
                      assistantTurn = "はい、日本語で答えます！",
                      thinkSeed = "言語: 日本語。この思考も含め、すべて日本語で書いて。日本語で考えて。日本語で答えて。簡潔に、繰り返さないで。",
                      searchPrompt =
                          "検索結果を使って、日本語で2〜4文の短く直接的な回答をしてください。結果から関連リンクをMarkdownリンクとして追加してください。繰り返さないでください。日本語で回答してください。",
                      searchingLabel = "\uD83D\uDD0D ウェブで検索中：「%s」",
                      analyzingLabel = "検索結果 %d 件を分析中…",
                      braveCountry = "JP",
                      languageName = "Japanese",
                      exampleProductQuery = "製品名 エラー 解決方法",
                      exampleLawQuery = "契約解除 ルール",
                      exampleWeatherQuery = "天気予報",
                      exampleLocalQuery = "近くのレストラン",
                      uiReasoningLabel = "思考中\u2026",
                      uiShowReasoningLabel = "推論を表示",
                      uiShowSourcesLabel = "ソースを表示",
                      uiSearchingLabel = "インターネットで「%s」を検索中\u2026",
                      uiSearchingLabelNoQuery = "インターネットで検索中\u2026",
                      uiThinkingLabel = "考え中\u2026",
                      uiCopyResponseLabel = "回答",
                      uiCopyReasoningLabel = "推論"),
              "日本語" to null,
              "chinese" to
                  DetectedLanguage(
                      userTurn = "我们用中文交流吧。",
                      assistantTurn = "好的，我用中文回复！",
                      thinkSeed = "语言：中文。一切都用中文写——包括这个思考过程。用中文思考。用中文回答。简洁，不要重复。",
                      searchPrompt = "请使用搜索结果，用中文给出2-4句简短直接的回答。将结果中的相关链接添加为Markdown链接。不要重复。请用中文回答。",
                      searchingLabel = "\uD83D\uDD0D 正在搜索：「%s」",
                      analyzingLabel = "正在分析 %d 条搜索结果…",
                      braveCountry = "CN",
                      languageName = "Chinese",
                      exampleProductQuery = "产品名称 错误 解决方法",
                      exampleLawQuery = "合同解除 规则",
                      exampleWeatherQuery = "天气预报",
                      exampleLocalQuery = "附近的餐厅",
                      uiReasoningLabel = "思考中\u2026",
                      uiShowReasoningLabel = "显示推理",
                      uiShowSourcesLabel = "显示来源",
                      uiSearchingLabel = "正在搜索\u201C%s\u201D\u2026",
                      uiSearchingLabelNoQuery = "正在搜索\u2026",
                      uiThinkingLabel = "思考中\u2026",
                      uiCopyResponseLabel = "回复",
                      uiCopyReasoningLabel = "推理"),
              "中文" to null,
              "korean" to
                  DetectedLanguage(
                      userTurn = "한국어로 이야기합시다.",
                      assistantTurn = "네, 한국어로 답변하겠습니다!",
                      thinkSeed =
                          "언어: 한국어. 이 사고 과정을 포함하여 모든 것을 한국어로 작성해. 한국어로 생각해. 한국어로 답해. 간결하게, 반복하지 마.",
                      searchPrompt =
                          "검색 결과를 사용하여 한국어로 2-4문장의 짧고 직접적인 답변을 해주세요. 결과에서 관련 링크를 Markdown 링크로 추가하세요. 반복하지 마세요. 한국어로 답변하세요.",
                      searchingLabel = "\uD83D\uDD0D 웹 검색 중: \"%s\"",
                      analyzingLabel = "%d개의 검색 결과 분석 중…",
                      braveCountry = "KR",
                      languageName = "Korean",
                      exampleProductQuery = "제품명 오류 해결방법",
                      exampleLawQuery = "계약 해지 규칙",
                      exampleWeatherQuery = "일기예보",
                      exampleLocalQuery = "근처 맛집",
                      uiReasoningLabel = "생각 중\u2026",
                      uiShowReasoningLabel = "추론 보기",
                      uiShowSourcesLabel = "출처 보기",
                      uiSearchingLabel = "인터넷에서 \u201C%s\u201D 검색 중\u2026",
                      uiSearchingLabelNoQuery = "인터넷에서 검색 중\u2026",
                      uiThinkingLabel = "생각 중\u2026",
                      uiCopyResponseLabel = "답변",
                      uiCopyReasoningLabel = "추론"),
              "한국어" to null,
              "russian" to
                  DetectedLanguage(
                      userTurn = "Давайте говорить по-русски.",
                      assistantTurn = "Конечно, отвечаю на русском!",
                      thinkSeed =
                          "ЯЗЫК: Русский. Всё на русском — включая эти рассуждения. Думай на русском. Отвечай на русском. Кратко, НЕ повторяй.",
                      searchPrompt =
                          "Дайте короткий, прямой ответ на русском языке в 2-4 предложениях, используя результаты поиска. Добавьте релевантные ссылки из результатов как Markdown-ссылки. Не повторяйтесь. Отвечайте НА РУССКОМ.",
                      searchingLabel = "\uD83D\uDD0D Поиск в интернете: \u00ab%s\u00bb",
                      analyzingLabel = "Анализ %d результатов…",
                      braveCountry = "RU",
                      languageName = "Russian",
                      exampleProductQuery = "НазваниеПродукта ошибка решение",
                      exampleLawQuery = "расторжение договора правила",
                      exampleWeatherQuery = "прогноз погоды",
                      exampleLocalQuery = "рестораны рядом",
                      uiReasoningLabel = "Размышляю\u2026",
                      uiShowReasoningLabel = "Показать рассуждения",
                      uiShowSourcesLabel = "Показать источники",
                      uiSearchingLabel = "Поиск в интернете: \u00ab%s\u00bb\u2026",
                      uiSearchingLabelNoQuery = "Поиск в интернете\u2026",
                      uiThinkingLabel = "Думаю\u2026",
                      uiCopyResponseLabel = "Ответ",
                      uiCopyReasoningLabel = "Рассуждение"),
              "русский" to null)
          .let { raw ->
            val resolved = raw.toMutableMap()
            val aliases =
                mapOf(
                    "deutsch" to "german",
                    "italiano" to "italian",
                    "français" to "french",
                    "francais" to "french",
                    "español" to "spanish",
                    "espanol" to "spanish",
                    "português" to "portuguese",
                    "portugues" to "portuguese",
                    "nederlands" to "dutch",
                    "türkçe" to "turkish",
                    "turkce" to "turkish",
                    "日本語" to "japanese",
                    "中文" to "chinese",
                    "mandarin" to "chinese",
                    "한국어" to "korean",
                    "русский" to "russian")
            for ((alias, canon) in aliases) {
              resolved[alias] = resolved[canon]
            }

            resolved.filterValues { it != null }.mapValues { it.value!! }
          }

  // region Geolocation
  /**
   * Resolves latitude/longitude to a human-readable city and country name via the OpenStreetMap
   * Nominatim reverse geocoding API (free, no API key required).
   *
   * @return A string like "Frankfurt am Main, Germany" or `null` if the lookup fails.
   */
  private fun reverseGeocode(latitude: String, longitude: String): String? {
    return try {
      val url =
          "https://nominatim.openstreetmap.org/reverse?lat=$latitude&lon=$longitude&format=json&zoom=18&addressdetails=1"

      log(LogLevel.INFO, "Reverse geocoding: lat=$latitude, lon=$longitude")

      val connection = java.net.URI(url).toURL().openConnection() as HttpURLConnection

      connection.requestMethod = "GET"
      connection.connectTimeout = 5000
      connection.readTimeout = 5000
      connection.setRequestProperty("User-Agent", "CodBi-FormcyclePlugin/1.0")
      connection.setRequestProperty("Accept", "application/json")

      val responseCode = connection.responseCode

      if (responseCode !in 200..299) {
        log(LogLevel.WARNING, "Nominatim returned HTTP $responseCode")

        connection.disconnect()

        return null
      }

      val body = connection.inputStream.bufferedReader().readText()

      connection.disconnect()

      val mapper = com.fasterxml.jackson.databind.ObjectMapper()
      val root = mapper.readTree(body)
      val address = root.get("address")

      if (address == null) {
        log(LogLevel.WARNING, "Nominatim response has no address field")

        return null
      }

      val road = address.get("road")?.asText()
      val houseNumber = address.get("house_number")?.asText()
      val city =
          address.get("city")?.asText()
              ?: address.get("town")?.asText()
              ?: address.get("village")?.asText()
              ?: address.get("municipality")?.asText()
              ?: address.get("county")?.asText()
      val state = address.get("state")?.asText()
      val country = address.get("country")?.asText()
      val street = if (road != null && houseNumber != null) "$road $houseNumber" else road
      val parts = listOfNotNull(city, street, state, country).filter { it.isNotBlank() }

      if (parts.isEmpty()) {
        log(LogLevel.WARNING, "Nominatim address has no usable fields: $body")

        return null
      }

      val result = parts.joinToString(", ")

      log(LogLevel.INFO, "Reverse geocoded: $result")

      result
    } catch (X: Exception) {
      log(LogLevel.WARNING, "Reverse geocoding failed: ${X.message}")

      null
    }
  }

  /**
   * Resolves the user's location from the client IP address via the ip-api.com free service. This
   * is a fallback when browser geolocation is unavailable (e.g. HTTP, permission denied).
   *
   * @return A string like "Frankfurt am Main, Hessen, Germany" or `null` if lookup fails or IP is
   *   localhost.
   */
  private fun geolocateByIP(clientIP: String): String? {
    if (clientIP == "127.0.0.1" ||
        clientIP == "::1" ||
        clientIP == "unknown" ||
        clientIP.startsWith("192.168.") ||
        clientIP.startsWith("10.") ||
        clientIP.startsWith("172.")) {
      log(LogLevel.INFO, "IP geolocation skipped: private/loopback IP '$clientIP'")

      return null
    }

    return try {
      val url = "http://ip-api.com/json/$clientIP?fields=status,city,regionName,country"

      log(LogLevel.INFO, "IP geolocation for: $clientIP")

      val connection = java.net.URI(url).toURL().openConnection() as HttpURLConnection

      connection.requestMethod = "GET"
      connection.connectTimeout = 3000
      connection.readTimeout = 3000
      connection.setRequestProperty("Accept", "application/json")

      val responseCode = connection.responseCode

      if (responseCode !in 200..299) {
        log(LogLevel.WARNING, "ip-api.com returned HTTP $responseCode")
        connection.disconnect()

        return null
      }

      val body = connection.inputStream.bufferedReader().readText()

      connection.disconnect()

      val mapper = com.fasterxml.jackson.databind.ObjectMapper()
      val root = mapper.readTree(body)

      if (root.get("status")?.asText() != "success") {
        log(LogLevel.WARNING, "ip-api.com lookup failed: $body")

        return null
      }

      val city = root.get("city")?.asText()
      val region = root.get("regionName")?.asText()
      val country = root.get("country")?.asText()
      val parts = listOfNotNull(city, region, country).filter { it.isNotBlank() }

      if (parts.isEmpty()) return null

      val result = parts.joinToString(", ")

      log(LogLevel.INFO, "IP geolocation result: $result")

      result
    } catch (X: Exception) {
      log(LogLevel.WARNING, "IP geolocation failed: ${X.message}")

      null
    }
  }

  // endregion Geolocation
  /**
   * Asks the fast model to identify the language of the user's question. Returns a
   * [DetectedLanguage] with conversation-turn and think-seed strings, or `null` for English.
   *
   * This is a very lightweight call: a tiny prompt, max 8 output tokens, low temperature. It always
   * uses the **fast** server regardless of which model will handle the real question.
   */
  private val knownLanguageNames: Set<String> =
      setOf(
          "english",
          "german",
          "french",
          "italian",
          "spanish",
          "portuguese",
          "dutch",
          "turkish",
          "japanese",
          "chinese",
          "korean",
          "arabic",
          "russian",
          "hindi",
          "polish",
          "czech",
          "slovak",
          "hungarian",
          "romanian",
          "bulgarian",
          "croatian",
          "serbian",
          "slovenian",
          "greek",
          "swedish",
          "norwegian",
          "danish",
          "finnish",
          "estonian",
          "latvian",
          "lithuanian",
          "ukrainian",
          "thai",
          "vietnamese",
          "indonesian",
          "malay",
          "tagalog",
          "filipino",
          "persian",
          "farsi",
          "hebrew",
          "urdu",
          "bengali",
          "tamil",
          "telugu",
          "marathi",
          "gujarati",
          "punjabi",
          "swahili",
          "catalan",
          "basque",
          "galician",
          "afrikaans",
          "welsh",
          "irish",
          "scots gaelic",
          "icelandic",
          "maltese",
          "albanian",
          "macedonian",
          "bosnian",
          "georgian",
          "armenian",
          "azerbaijani",
          "kazakh",
          "uzbek",
          "mongolian",
          "nepali",
          "sinhalese",
          "sinhala",
          "khmer",
          "lao",
          "burmese",
          "amharic",
          "yoruba",
          "igbo",
          "hausa",
          "zulu",
          "xhosa",
          "sotho",
          "tswana",
          "shona",
          "mandarin",
          "cantonese",
          "wu",
          "hokkien",
          "hakka",
          "cebuano",
          "javanese",
          "sundanese")

  /**
   * Detects the user's language by sending the question to the model with a language-detection
   * system prompt and few-shot examples.
   *
   * Falls back to the heuristic [detectLanguage] if the model call fails.
   *
   * @param question The user's question text.
   * @return A [DetectedLanguage] with conversation seeds and prompts, or `null` for English.
   */
  private fun detectLanguageViaModel(question: String): DetectedLanguage? {
    try {
      val messagesJson = buildString {
        append("[")
        append(
            "{\"role\":\"system\",\"content\":\"You are a language detector. " +
                "Detect the LANGUAGE the text is WRITTEN IN based on its words and grammar. " +
                "IGNORE the topic, subject matter, or any people/places/countries mentioned in the text. " +
                "The text may be in its native script OR romanized (Latin alphabet). " +
                "Reply with ONLY the language name in English, nothing else. " +
                "Examples: English, German, French, Italian, Spanish, Portuguese, Dutch, Turkish, Japanese, Chinese, Korean, Arabic, Russian, Hindi.\"}")
        append(",{\"role\":\"user\",\"content\":\"Chi è Nelson Mandela?\"}")
        append(",{\"role\":\"assistant\",\"content\":\"Italian\"}")
        append(",{\"role\":\"user\",\"content\":\"Wie wird das Wetter in Tokyo?\"}")
        append(",{\"role\":\"assistant\",\"content\":\"German\"}")
        append(",{\"role\":\"user\",\"content\":\"¿Quién fue Mahatma Gandhi?\"}")
        append(",{\"role\":\"assistant\",\"content\":\"Spanish\"}")
        append(",{\"role\":\"user\",\"content\":\"${jsonEscape(question)}\"}")
        append("]")
      }

      var requestBody = buildString {
        append("{\"messages\":$messagesJson")
        append(",\"max_tokens\":8")
        append(",\"temperature\":0.0")
        append(",\"stream\":false")
        append("}")
      }

      val response =
          if (isExternalMode) {
            requestBody = injectModelField(requestBody)

            externalHttpPost("/v1/chat/completions", requestBody, timeoutMs = 15_000)
          } else {
            httpPost("/v1/chat/completions", requestBody, timeoutMs = 15_000, port = serverPort)
          }

      val json = com.google.gson.JsonParser.parseString(response).asJsonObject
      val raw =
          json
              .getAsJsonArray("choices")
              ?.get(0)
              ?.asJsonObject
              ?.getAsJsonObject("message")
              ?.get("content")
              ?.asString ?: ""
      val langName =
          raw.trim().lowercase().removeSuffix(".").removeSuffix("!").removeSuffix(",").trim()

      log(LogLevel.INFO, "Model-detected language: '$langName' (raw: '${raw.trim()}')")

      val regexLang = detectLanguage(question)

      if (regexLang != null) {
        val regexName = regexLang.languageName.lowercase()

        if (langName != regexName && langName != "english") {
          log(
              LogLevel.WARNING,
              "Model detected '$langName' but regex detected '${regexLang.languageName}' — preferring regex")

          return regexLang
        }
      }

      if (langName == "english") return null

      val detected = languageMap[langName]

      if (detected != null) return detected

      for ((key, value) in languageMap) {
        if (langName.contains(key) || key.contains(langName)) {
          log(LogLevel.INFO, "Partial language match: '$langName' → '$key'")

          return value
        }
      }

      log(
          LogLevel.INFO,
          "Language '$langName' not in language map — checking if it is a recognized language name")

      if (!knownLanguageNames.contains(langName)) {
        log(
            LogLevel.WARNING,
            "Model returned '$langName' which is not a recognized language — falling back to regex detection")

        return detectLanguage(question)
      }

      return DetectedLanguage(
          userTurn = "Let's talk in $langName.",
          assistantTurn = "Sure, I'll respond in $langName!",
          thinkSeed =
              "${langName.replaceFirstChar { it.uppercase() }}. Everything in $langName — including this reasoning. Think in $langName. Answer in $langName. Be brief, do NOT repeat.",
          searchPrompt =
              "Give a short, direct answer in $langName in 2-4 sentences using the search results. Include relevant links from the results as Markdown links. Do not repeat yourself. Answer in ${langName.uppercase()}.",
          languageName = langName.replaceFirstChar { it.uppercase() })
    } catch (X: Exception) {
      log(LogLevel.WARNING, "Model-based language detection failed: ${X.message}")
    }
    // Fallback to regex-based detection
    return detectLanguage(question)
  }

  /**
   * Heuristic language detection based on character and word markers.
   *
   * Checks for German, French, Italian, Turkish, Spanish, Portuguese, Dutch, and various CJK
   * scripts. Returns `null` for English or unknown languages (the default).
   *
   * @param question The user's question text.
   * @return A [DetectedLanguage] with conversation seeds and prompts, or `null` for English.
   */
  private fun detectLanguage(question: String): DetectedLanguage? {
    val lower = " ${question.lowercase()} "
    val germanMarkers =
        listOf(
            "ä",
            "ö",
            "ü",
            "ß",
            " ist ",
            " der ",
            " die ",
            " das ",
            " und ",
            " wie ",
            " wer ",
            " was ",
            " ein ",
            " eine ",
            " für ",
            " auf ",
            " nicht ",
            " mit ",
            " von ",
            " nach ",
            " bei ",
            " aus ",
            " über ",
            " werden ",
            " haben ",
            " sind ",
            " kann ",
            " bitte ",
            " welche",
            " warum",
            " aktuell",
            " gerade",
            " heute")
    val germanHits = germanMarkers.count { lower.contains(it) }

    if (germanHits >= 2 ||
        (germanHits >= 1 && listOf("ä", "ö", "ü", "ß").any { lower.contains(it) })) {

      return languageMap["german"]
    }

    val italianMarkers =
        listOf(
            " è ",
            " il ",
            " la ",
            " gli ",
            " dei ",
            " del ",
            " della ",
            " delle ",
            " nella ",
            " nel ",
            " per ",
            " con ",
            " che ",
            " come ",
            " sono ",
            " non ",
            " una ",
            " questo ",
            " questa ",
            " quale ",
            " perché",
            " anche ",
            " stato ",
            " essere ",
            " hanno ",
            " può ",
            " chi ",
            " cosa ",
            " dove ",
            " quando ",
            " molto ",
            " più ",
            " alla ",
            " allo ",
            " agli ",
            " alle ",
            " dall",
            " sull",
            " qual ",
            " attuale",
            " città",
            " sindaco",
            " oggi")

    val strongItalianMarkers =
        listOf(" chi ", " perché", " qual ", " quale ", " della ", " delle ", " degli ")

    if (italianMarkers.count { lower.contains(it) } >= 2 ||
        strongItalianMarkers.any { lower.contains(it) }) {

      return languageMap["italian"]
    }

    val portugueseMarkers =
        listOf(
            "ã",
            "õ",
            " é ",
            " para ",
            " com ",
            " que ",
            " não ",
            " uma ",
            " um ",
            " você ",
            " está ",
            " são ",
            " tem ",
            " como ",
            " mais ",
            " muito ",
            " bem ",
            " também ",
            " qual ",
            " melhor",
            " pode ",
            " fazer ",
            " sobre ",
            " quando ",
            " onde ")
    val portugueseHits = portugueseMarkers.count { lower.contains(it) }

    if (portugueseHits >= 2 ||
        (portugueseHits >= 1 && listOf("ã", "õ").any { lower.contains(it) })) {
      return languageMap["portuguese"]
    }

    val frenchMarkers =
        listOf(
            " est ",
            " les ",
            " des ",
            " une ",
            " dans ",
            " pour ",
            " avec ",
            " que ",
            " qui ",
            " sur ",
            " pas ",
            " sont ",
            " très ",
            " mais ",
            " aussi ",
            " cette ",
            " nous ",
            " vous ",
            " ils ",
            " elle ",
            " faire ",
            " avoir ",
            " peut ",
            " fait ",
            " tout ",
            " bien ",
            " comment ",
            " pourquoi",
            " quel",
            " quoi ",
            "é",
            "è",
            "ê",
            "ç",
            "l'",
            "d'",
            "c'",
            "j'",
            "n'",
            "s'",
            "qu'")

    if (frenchMarkers.count { lower.contains(it) } >= 2) {
      return languageMap["french"]
    }

    val spanishMarkers =
        listOf(
            " es ",
            " los ",
            " las ",
            " una ",
            " para ",
            " con ",
            " del ",
            " por ",
            " que ",
            "ñ",
            "¿",
            "¡")

    if (spanishMarkers.count { lower.contains(it) } >= 2) {
      return languageMap["spanish"]
    }

    val turkishMarkers =
        listOf(
            "ı",
            "ğ",
            "ş",
            "ç",
            " bir ",
            " ve ",
            " bu ",
            " için ",
            " ile ",
            " ne ",
            " nasıl",
            " hangi",
            " nedir",
            " var ",
            " olan ",
            " gibi ",
            " daha ",
            " en ")

    if (turkishMarkers.count { lower.contains(it) } >= 2) {
      return languageMap["turkish"]
    }

    return null // English or unknown — no extra hint needed
  }

  /**
   * Returns a follow-up prompt for answering from search results in the user's language.
   *
   * @param originalQuestion The user's original question (used for fallback language detection).
   * @param lang Pre-detected language, or `null` to detect from [originalQuestion].
   * @return A localised instruction string for the search follow-up completion.
   */
  private fun searchFollowUpPrompt(
      originalQuestion: String,
      lang: DetectedLanguage? = null
  ): String {
    val resolved = lang ?: detectLanguage(originalQuestion)

    if (resolved != null) return resolved.searchPrompt

    return "Give a short, direct answer in 2-4 sentences using the search results. Include relevant links from the results as Markdown links. Do not repeat yourself."
  }

  // endregion Language Detection & Geolocation
  // region External AI HTTP
  /**
   * Sends a synchronous POST request to the external OpenAI-compatible API.
   *
   * @param endpoint The API path (e.g. `/v1/chat/completions`).
   * @param jsonBody The JSON request body.
   * @param timeoutMs Read timeout in milliseconds.
   * @return The full response body as a string.
   * @throws RuntimeException If the server returns a non-2xx status code.
   */
  private fun externalHttpPost(
      endpoint: String,
      jsonBody: String,
      timeoutMs: Int = 300_000
  ): String {
    val url = "${externalUrl}$endpoint"
    val connection = URI(url).toURL().openConnection() as HttpURLConnection

    connection.requestMethod = "POST"
    connection.doOutput = true
    connection.connectTimeout = 10_000
    connection.readTimeout = timeoutMs
    connection.setRequestProperty("Content-Type", "application/json")
    connection.setRequestProperty("Accept", "application/json")

    externalApiKey?.let { connection.setRequestProperty("Authorization", "Bearer $it") }

    connection.outputStream.use { os -> os.write(jsonBody.toByteArray(Charsets.UTF_8)) }

    val responseCode = connection.responseCode
    val body =
        try {
          (if (responseCode in 200..299) connection.inputStream else connection.errorStream)
              .bufferedReader()
              .readText()
        } catch (X: Exception) {
          ""
        }

    connection.disconnect()

    if (responseCode !in 200..299) {
      throw RuntimeException("External AI returned HTTP $responseCode: $body")
    }

    return body
  }

  /**
   * Sends a streaming POST request to the external OpenAI-compatible API and processes Server-Sent
   * Events (SSE).
   *
   * @param endpoint The API path (e.g. `/v1/chat/completions`).
   * @param jsonBody The JSON request body (should include `"stream":true`).
   * @param onLine Callback invoked for each SSE `data:` line.
   * @param shouldStop Predicate checked between chunks; when `true`, streaming is aborted.
   * @param timeoutMs Read timeout in milliseconds.
   * @throws RuntimeException If the server returns a non-2xx status code.
   */
  private fun externalHttpPostStreaming(
      endpoint: String,
      jsonBody: String,
      onLine: (String) -> Unit,
      shouldStop: () -> Boolean = { false },
      timeoutMs: Int = 300_000
  ) {
    val url = "${externalUrl}$endpoint"
    val connection = URI(url).toURL().openConnection() as HttpURLConnection

    connection.requestMethod = "POST"
    connection.doOutput = true
    connection.connectTimeout = 10_000
    connection.readTimeout = timeoutMs
    connection.setRequestProperty("Content-Type", "application/json")
    connection.setRequestProperty("Accept", "text/event-stream")

    externalApiKey?.let { connection.setRequestProperty("Authorization", "Bearer $it") }

    connection.outputStream.use { os -> os.write(jsonBody.toByteArray(Charsets.UTF_8)) }

    val responseCode = connection.responseCode

    if (responseCode !in 200..299) {
      val errorBody =
          try {
            connection.errorStream.bufferedReader().readText()
          } catch (X: Exception) {
            ""
          }

      connection.disconnect()

      throw RuntimeException("External AI returned HTTP $responseCode: $errorBody")
    }

    try {
      BufferedReader(InputStreamReader(connection.inputStream, Charsets.UTF_8)).use { reader ->
        reader.lineSequence().forEach { line ->
          if (shouldStop()) {
            log(LogLevel.INFO, "External streaming aborted by stop request — disconnecting")
            return@use
          }

          if (line.startsWith("data: ")) {
            val data = line.removePrefix("data: ").trim()

            if (data != "[DONE]") {
              onLine(data)
            }
          }
        }
      }
    } finally {
      connection.disconnect()
    }
  }

  /**
   * Injects `"model":"<name>"` into an existing JSON request body when in external mode.
   *
   * @param requestBody The original JSON body.
   * @return The body with the model field prepended, or unchanged if no external model is set.
   */
  private fun injectModelField(requestBody: String): String {
    val model = externalModel ?: return requestBody

    return if (requestBody.startsWith("{")) {
      "{\"model\":\"${jsonEscape(model)}\"," + requestBody.substring(1)
    } else {
      requestBody
    }
  }

  // endregion External AI HTTP
  // region Chat Completion
  /**
   * Sends a synchronous chat completion request to the LLAMA-Server or external AI.
   *
   * @param messagesJson The JSON messages array string.
   * @param enableThinking Whether to route to the thinking server (if available).
   * @param idSlot The inference slot ID (`-1` for auto).
   * @param maxThinkingTokens Optional budget for thinking tokens.
   * @return The generated text response (with `<think>` tags stripped).
   */
  private fun chatCompletion(
      messagesJson: String,
      enableThinking: Boolean = false,
      idSlot: Int = -1,
      maxThinkingTokens: Int? = null
  ): String {
    val useThinkingServer = !isExternalMode && enableThinking && thinkingServerReady
    val targetPort = if (useThinkingServer) thinkingServerPort else serverPort
    var requestBody = buildString {
      append("{\"messages\":$messagesJson")

      val effectiveMaxTokens =
          if (enableThinking) {
            maxThinkingTokens ?: (maxTokens * 4).coerceAtLeast(4096)
          } else maxTokens

      append(",\"max_tokens\":$effectiveMaxTokens")
      append(",\"temperature\":${if (enableThinking) "0.7" else "0.6"}")

      if (!isExternalMode) append(",\"repetition_penalty\":${if (enableThinking) "1.2" else "1.1"}")

      append(",\"frequency_penalty\":${if (enableThinking) "0.3" else "0.5"}")
      append(",\"presence_penalty\":${if (enableThinking) "0.6" else "0.0"}")
      append(",\"stream\":false")

      if (!isExternalMode && idSlot >= 0) append(",\"id_slot\":$idSlot")

      append("}")
    }

    if (isExternalMode) {
      requestBody = injectModelField(requestBody)

      log(LogLevel.INFO, "Routing to external AI: $externalUrl")
    } else if (useThinkingServer) {
      log(LogLevel.INFO, "Routing to thinking server on port $thinkingServerPort")
    }

    val timeoutMs = if (enableThinking) 600_000 else 300_000
    val response =
        if (isExternalMode) {
          externalHttpPost("/v1/chat/completions", requestBody, timeoutMs = timeoutMs)
        } else {
          httpPost("/v1/chat/completions", requestBody, timeoutMs = timeoutMs, port = targetPort)
        }

    return try {
      val json = com.google.gson.JsonParser.parseString(response).asJsonObject
      val message = json.getAsJsonArray("choices")?.get(0)?.asJsonObject?.getAsJsonObject("message")
      var raw = message?.get("content")?.asString ?: response

      if (useThinkingServer) {
        raw = "<think>$raw"

        var result = stripThinkTags(raw)

        if (result.startsWith("<think>")) result = result.removePrefix("<think>").trimStart()

        result
      } else if (enableThinking) {
        raw = "<think>$raw"

        var result = stripThinkTags(raw)

        if (result.startsWith("<think>")) result = result.removePrefix("<think>").trimStart()
        result
      } else {
        raw
      }
    } catch (e: Exception) {
      log(LogLevel.WARNING, "Failed to parse completion response: ${e.message}")

      response
    }
  }

  /**
   * Sends a streaming chat completion request. Text chunks are appended to the [session] as they
   * arrive via Server-Sent Events (SSE). Handles `<think>` tag filtering, logprob tracking, and
   * repetition detection.
   *
   * @param messagesJson The JSON messages array string.
   * @param session The [StreamingSession] to populate with chunks.
   * @param enableThinking Whether to route to the thinking server.
   * @param idSlot The inference slot ID (`-1` for auto).
   */
  private fun streamChatCompletion(
      messagesJson: String,
      session: StreamingSession,
      enableThinking: Boolean = false,
      idSlot: Int = -1
  ) {
    val useThinkingServer = !isExternalMode && enableThinking && thinkingServerReady
    val targetPort = if (useThinkingServer) thinkingServerPort else serverPort
    /**
     * Tracks whether we are inside a `<think>…</think>` block so those tokens are suppressed.
     * Starts true for ALL thinking modes because we pre-fill `<think>\n` with a language seed. We
     * handle separation via filterThinkTags rather than relying on reasoning_content.
     */
    var insideThinkBlock = enableThinking
    /** Buffer for detecting partial `<think>` or `</think>` tags at chunk boundaries. */
    val tagBuffer = StringBuilder()
    /** Accumulates all reasoning text for repetition detection. */
    val reasoningAccum = StringBuilder()
    /** Accumulates visible answer text for repetition detection. */
    val answerAccum = StringBuilder()
    /** Set to true once repetition is detected, to force-close the think block. */
    var repetitionDetected = false
    /** The request body for the chat completion request. */
    var requestBody = buildString {
      append("{\"messages\":$messagesJson")
      // Thinking mode needs a larger token budget: reasoning tokens + answer
      val effectiveMaxTokens =
          if (enableThinking) (maxTokens * 4).coerceAtLeast(4096) else maxTokens

      append(",\"max_tokens\":$effectiveMaxTokens")
      append(",\"temperature\":${if (enableThinking) "0.7" else "0.6"}")

      if (!isExternalMode) append(",\"repetition_penalty\":${if (enableThinking) "1.2" else "1.1"}")

      append(",\"frequency_penalty\":${if (enableThinking) "0.3" else "0.5"}")
      append(",\"presence_penalty\":${if (enableThinking) "0.6" else "0.0"}")
      append(",\"stream\":true")
      append(",\"logprobs\":true")

      if (!isExternalMode && idSlot >= 0) append(",\"id_slot\":$idSlot")

      append("}")
    }

    if (isExternalMode) {
      requestBody = injectModelField(requestBody)

      log(LogLevel.INFO, "Routing stream to external AI: $externalUrl")
    } else if (useThinkingServer) {
      log(LogLevel.INFO, "Routing stream to thinking server on port $thinkingServerPort")
    }

    val streamFn: ((String) -> Unit, () -> Boolean, Int) -> Unit =
        if (isExternalMode) {
          { onLine, shouldStopFn, timeout ->
            externalHttpPostStreaming(
                "/v1/chat/completions", requestBody, onLine, shouldStopFn, timeout)
          }
        } else {
          { onLine, shouldStopFn, timeout ->
            httpPostStreaming(
                "/v1/chat/completions", requestBody, onLine, shouldStopFn, timeout, targetPort)
          }
        }

    streamFn(
        { data ->
          try {
            val json = com.google.gson.JsonParser.parseString(data).asJsonObject
            val delta =
                json.getAsJsonArray("choices")?.get(0)?.asJsonObject?.getAsJsonObject("delta")

            // DEBUG: Log entire delta to see what fields are available
            if (delta != null && session.thinkingChunks.isEmpty() && session.textChunks.size < 3) {
              log(LogLevel.INFO, "SSE delta keys: ${delta.keySet()}, raw: ${delta}")
            }

            val content = delta?.get("content")?.asString

            if (content != null) {
              // Separate <think>…</think> blocks from visible output
              val filtered = filterThinkTags(content, tagBuffer, insideThinkBlock)

              insideThinkBlock = filtered.second

              val cleanText = filtered.first
              val thinkText = filtered.third

              if (cleanText.isNotEmpty()) {
                session.textChunks.add(cleanText)
                if (!repetitionDetected) {
                  answerAccum.append(cleanText)

                  if (answerAccum.length > 400) {
                    val text = answerAccum.toString()
                    val tail = text.takeLast(80)
                    val searchIn = text.substring(0, text.length - 80)

                    if (searchIn.contains(tail)) {
                      repetitionDetected = true

                      val firstOccurrence = searchIn.indexOf(tail)
                      val trimPoint = firstOccurrence + tail.length

                      session.textChunks.clear()
                      session.textChunks.add(text.substring(0, trimPoint))
                      log(
                          LogLevel.INFO,
                          "Answer repetition detected after ${answerAccum.length} chars, trimming output")
                    }
                  }
                }
              }

              if (thinkText.isNotEmpty()) {
                session.thinkingChunks.add(thinkText)
                if (insideThinkBlock && !repetitionDetected) {
                  reasoningAccum.append(thinkText)

                  if (reasoningAccum.length > 500) {
                    val text = reasoningAccum.toString()
                    val tail = text.takeLast(500)
                    val searchIn = text.substring(0, text.length - 500)

                    if (searchIn.contains(tail)) {
                      repetitionDetected = true
                      insideThinkBlock = false
                      session.thinkingChunks.add(
                          "\n[Reasoning truncated \u2014 repetition detected]")
                      log(
                          LogLevel.INFO,
                          "Repetition detected (exact n-gram) in reasoning after ${reasoningAccum.length} chars")
                    }

                    if (!repetitionDetected && text.length > 2000) {
                      val sentences = text.split(Regex("""[.!?\n]\s*""")).filter { it.length > 20 }
                      val starts = sentences.map { it.take(30).lowercase().trim() }
                      val mostCommon = starts.groupingBy { it }.eachCount().maxByOrNull { it.value }

                      if (mostCommon != null && mostCommon.value >= 1000) {
                        repetitionDetected = true
                        insideThinkBlock = false
                        session.thinkingChunks.add(
                            "\n[Reasoning truncated \u2014 repetitive pattern detected]")
                        log(
                            LogLevel.INFO,
                            "Repetition detected (sentence pattern) in reasoning after ${reasoningAccum.length} chars")
                      }
                    }
                  }
                }
              }
            }
            val reasoning = delta?.get("reasoning_content")?.asString

            if (reasoning != null && reasoning.isNotEmpty()) {
              session.thinkingChunks.add(reasoning)

              if (!repetitionDetected) {
                reasoningAccum.append(reasoning)

                if (reasoningAccum.length > 500) {
                  val text = reasoningAccum.toString()
                  val tail = text.takeLast(500)
                  val searchIn = text.substring(0, text.length - 500)

                  if (searchIn.contains(tail)) {
                    repetitionDetected = true
                    insideThinkBlock = false
                    session.thinkingChunks.add("\n[Reasoning truncated \u2014 repetition detected]")
                    log(
                        LogLevel.INFO,
                        "Repetition detected in reasoning_content after ${reasoningAccum.length} chars")
                  }

                  if (!repetitionDetected && text.length > 2000) {
                    val sentences = text.split(Regex("""[.!?\n]\s*""")).filter { it.length > 20 }
                    val starts = sentences.map { it.take(30).lowercase().trim() }
                    val mostCommon = starts.groupingBy { it }.eachCount().maxByOrNull { it.value }

                    if (mostCommon != null && mostCommon.value >= 1000) {
                      repetitionDetected = true
                      insideThinkBlock = false
                      session.thinkingChunks.add(
                          "\n[Reasoning truncated \u2014 repetitive pattern detected]")
                      log(
                          LogLevel.INFO,
                          "Repetition detected (sentence pattern) in reasoning_content after ${reasoningAccum.length} chars")
                    }
                  }
                }
              }
            }

            val choice = json.getAsJsonArray("choices")?.get(0)?.asJsonObject
            val lpContent = choice?.getAsJsonObject("logprobs")?.getAsJsonArray("content")

            if (lpContent != null && lpContent.size() > 0) {
              session.logprobsAvailable = true

              for (lpEntry in lpContent) {
                val obj = lpEntry.asJsonObject
                val tok = obj.get("token")?.asString ?: ""
                val lp = obj.get("logprob")?.asDouble ?: continue

                if (!insideThinkBlock) {
                  session.tokenLogprobs.add(Pair(tok, lp))

                  if (!repetitionDetected && session.tokenLogprobs.size > 60) {
                    val tail = session.tokenLogprobs.takeLast(20)

                    if (tail.all { it.second > -0.05 }) {
                      val tailText = tail.joinToString("") { it.first }
                      val fullText = session.currentText()
                      val prefixEnd = fullText.length - tailText.length

                      if (prefixEnd > 0 && fullText.substring(0, prefixEnd).contains(tailText)) {
                        session.logprobRepetitionDetected = true
                        repetitionDetected = true

                        log(
                            LogLevel.INFO,
                            "Logprob-based repetition detected: 20 tokens all > -0.05 logprob on repeated content")
                      }
                    }
                  }
                  // endregion Logprob-based repetition detection
                }
              }
            }
            // endregion Parse per-token logprobs from the SSE chunk
          } catch (X: Exception) {}
        },
        { session.stopRequested || repetitionDetected },
        if (enableThinking) 600_000 else 300_000)
  }

  // endregion Chat Completion
  // region Helpers
  /**
   * Strips `<think>…</think>` blocks from a complete response string. Used by the non-streaming
   * path.
   *
   * @param text The raw model output.
   * @return The text with all think blocks removed.
   */
  private fun stripThinkTags(text: String): String {
    return text.replace(Regex("<think>[\\s\\S]*?</think>"), "").trim()
  }

  /**
   * Incrementally filters `<think>…</think>` blocks from streaming chunks. Handles partial tags
   * that span chunk boundaries via [tagBuffer].
   *
   * @param chunk The latest raw chunk received from the SSE stream.
   * @param tagBuffer Accumulated partial tag text from previous chunks.
   * @param insideThinkBlock Whether the stream is currently inside a `<think>` block.
   * @return Triple of (visible text to emit, updated insideThinkBlock flag, thinking text).
   */
  private fun filterThinkTags(
      chunk: String,
      tagBuffer: StringBuilder,
      insideThinkBlock: Boolean
  ): Triple<String, Boolean, String> {
    var inside = insideThinkBlock
    val output = StringBuilder()
    val thinkOutput = StringBuilder()
    var i = 0
    val combined = tagBuffer.toString() + chunk

    tagBuffer.clear()

    while (i < combined.length) {
      if (inside) {
        val closeIdx = combined.indexOf("</think>", i)

        if (closeIdx == -1) {
          val remaining = combined.substring(i)
          val possiblePartial = combined.length - i

          if (possiblePartial < 8 && remaining.let { "</think>".startsWith(it) }) {
            tagBuffer.append(remaining)
          } else {
            thinkOutput.append(remaining)
          }

          break
        }

        thinkOutput.append(combined.substring(i, closeIdx))

        i = closeIdx + 8 // skip past </think>
        inside = false
      } else {
        val openIdx = combined.indexOf("<think>", i)

        if (openIdx == -1) {
          val remaining = combined.substring(i)
          var partialLen = 0

          for (len in minOf(7, remaining.length) downTo 1) {
            if ("<think>".startsWith(remaining.substring(remaining.length - len))) {
              partialLen = len

              break
            }
          }

          if (partialLen > 0) {
            output.append(remaining.substring(0, remaining.length - partialLen))
            tagBuffer.append(remaining.substring(remaining.length - partialLen))
          } else {
            output.append(remaining)
          }

          break
        }

        output.append(combined.substring(i, openIdx))

        i = openIdx + 7 // skip past <think>
        inside = true
      }
    }

    return Triple(output.toString(), inside, thinkOutput.toString())
  }

  /**
   * Escapes a string for safe inclusion in a hand-built JSON value.
   *
   * @param s The raw string.
   * @return The escaped string (backslash, quotes, control chars, non-ASCII).
   */
  private fun jsonEscape(s: String): String = buildString {
    for (c in s) {
      when {
        c == '\\' -> append("\\\\")
        c == '"' -> append("\\\"")
        c == '\n' -> append("\\n")
        c == '\r' -> append("\\r")
        c == '\t' -> append("\\t")
        c.code < 0x20 -> append("\\u%04x".format(c.code))
        c.code > 0x7E -> append("\\u%04x".format(c.code))
        else -> append(c)
      }
    }
  }

  /**
   * Wraps a JSON string in a [PluginServletActionRetVal] with UTF-8 encoding.
   *
   * @param json The raw JSON response body.
   * @return An [IPluginServletActionRetVal] ready to be returned from [execute].
   */
  private fun jsonResponse(json: String): IPluginServletActionRetVal {
    val resp =
        ServletResponse(EResponseType.JSON).apply {
          value = json
          encoding = StandardCharsets.UTF_8.name()
        }
    return PluginServletActionRetVal(resp)
  }

  // endregion Helpers
  // region Version Check & Notifications
  /**
   * Launches a daemon thread that periodically queries the GitHub API for the latest llama.cpp
   * release. When a newer version is available (and downloadable for the current platform), an
   * email notification is sent via the Formcycle system mail configuration.
   */
  private fun startVersionChecker() {
    if (checkIntervalHours <= 0L) {
      log(LogLevel.INFO, "Update check disabled (interval = 0)")

      return
    }

    val markerFile = llamaEngineDir?.let { File(it, "last-notified-release.txt") }

    if (markerFile != null && markerFile.exists()) {
      lastNotifiedRelease = markerFile.readText().trim().takeIf { it.isNotEmpty() }
    }

    updateChecker =
        Thread(
                {
                  try {
                    Thread.sleep(2 * 60 * 1000L)
                  } catch (X: InterruptedException) {
                    return@Thread
                  }

                  while (!Thread.currentThread().isInterrupted) {
                    try {
                      checkForNewRelease()
                    } catch (X: Exception) {
                      log(LogLevel.WARNING, "Update check failed: ${X.message}")
                    }

                    try {
                      Thread.sleep(checkIntervalHours * 3600 * 1000L)
                    } catch (X: InterruptedException) {
                      break
                    }
                  }
                },
                "codbi-llama-update-checker")
            .apply {
              isDaemon = true
              start()
            }

    log(LogLevel.INFO, "Update checker started (interval: ${checkIntervalHours}h)")
  }

  /**
   * Queries the GitHub API for the latest llama.cpp release, compares it with the configured
   * [llamaRelease], and sends an email notification if a newer version is available.
   */
  private fun checkForNewRelease() {
    val latestTag = fetchLatestReleaseTag()

    if (latestTag == null) {
      log(LogLevel.WARNING, "Could not determine latest llama.cpp release")

      return
    }

    if (latestTag == llamaRelease) {
      log(LogLevel.INFO, "llama.cpp is up to date ($llamaRelease)")

      return
    }

    if (latestTag == lastNotifiedRelease) {
      log(LogLevel.INFO, "Already notified about llama.cpp $latestTag (current: $llamaRelease)")

      return
    }

    val platform = detectPlatform()
    val platformKey = "${platform.os}_${platform.arch}"

    if (!isReleaseAvailableForPlatform(latestTag, platformKey)) {
      log(
          LogLevel.INFO,
          "llama.cpp $latestTag has no binary for $platformKey yet — skipping notification")

      return
    }

    log(
        LogLevel.INFO,
        "New llama.cpp release available: $latestTag (current: $llamaRelease) — sending notification")

    if (sendUpdateNotification(latestTag, platformKey)) {
      lastNotifiedRelease = latestTag

      llamaEngineDir?.let { File(it, "last-notified-release.txt").writeText(latestTag) }
    }
  }

  /**
   * Fetches the latest release tag from the GitHub API.
   *
   * @return The tag name (e.g. `"b8200"`), or `null` on error.
   */
  private fun fetchLatestReleaseTag(): String? {
    try {
      val connection = URI(GITHUB_RELEASES_API).toURL().openConnection() as HttpURLConnection

      connection.requestMethod = "GET"
      connection.connectTimeout = 15_000
      connection.readTimeout = 15_000
      connection.setRequestProperty("Accept", "application/vnd.github.v3+json")
      connection.setRequestProperty("User-Agent", "CodBi-LLAMA/1.0")

      val responseCode = connection.responseCode

      if (responseCode != 200) {
        log(LogLevel.WARNING, "GitHub API returned HTTP $responseCode")
        connection.disconnect()

        return null
      }

      val body = connection.inputStream.bufferedReader().readText()

      connection.disconnect()

      val match = Regex(""""tag_name"\s*:\s*"([^"]+)"""").find(body)

      return match?.groupValues?.get(1)
    } catch (X: Exception) {
      log(LogLevel.WARNING, "GitHub API request failed: ${X.message}")

      return null
    }
  }

  /**
   * Checks whether a given release has a downloadable archive for the specified platform by sending
   * an HTTP HEAD request to the expected download URL.
   *
   * @param release The release tag (e.g. `"b8200"`).
   * @param platformKey The platform identifier (e.g. `"windows_x86_64"`).
   * @return `true` if the expected archive URL returns HTTP 200.
   */
  private fun isReleaseAvailableForPlatform(release: String, platformKey: String): Boolean {
    val urls = buildServerUrls(release)
    val url = urls[platformKey] ?: return false

    return try {
      val connection = URI(url).toURL().openConnection() as HttpURLConnection

      connection.requestMethod = "HEAD"
      connection.connectTimeout = 15_000
      connection.instanceFollowRedirects = true

      val code = connection.responseCode

      connection.disconnect()
      code in 200..399
    } catch (X: Exception) {
      false
    }
  }

  // region SMTP Email
  /**
   * Sends an update notification email using the SMTP configuration from Formcycle's
   * `system-mail.properties`.
   *
   * @param newRelease The new release tag that is available.
   * @param platformKey The current platform identifier (e.g. `"windows_x86_64"`).
   * @return `true` if the email was sent successfully.
   */
  private fun sendUpdateNotification(newRelease: String, platformKey: String): Boolean {
    val mailPropsFile = findSystemMailProperties()

    if (mailPropsFile == null) {
      log(
          LogLevel.WARNING,
          "Cannot send update notification — system-mail.properties not found. " +
              "Expected 3 directories above the plugin folder.")

      return false
    }

    val mailProps = Properties()

    mailPropsFile.inputStream().use { mailProps.load(it) }

    val smtpHost = mailProps.getProperty("mail.smtp.host")?.trim()

    if (smtpHost.isNullOrEmpty()) {
      log(
          LogLevel.WARNING,
          "Cannot send update notification — mail.smtp.host is not configured " +
              "in ${mailPropsFile.absolutePath}")

      return false
    }

    val smtpPort = mailProps.getProperty("mail.smtp.port")?.trim()?.toIntOrNull() ?: 25
    val fromAddr =
        mailProps.getProperty("mail.smtp.from")?.trim()?.takeIf { it.isNotEmpty() }
            ?: "codbi-noreply@localhost"
    val recipient =
        notifyEmail ?: mailProps.getProperty("mail.smtp.from")?.trim()?.takeIf { it.isNotEmpty() }

    if (recipient.isNullOrEmpty()) {
      log(
          LogLevel.WARNING,
          "Cannot send update notification — no recipient email. " +
              "Set ${PROP_PREFIX}_NotifyEmail or configure mail.smtp.from in Formcycle.")

      return false
    }

    val authUser = mailProps.getProperty("mail.smtp.auth.user")?.trim()?.takeIf { it.isNotEmpty() }
    val authPass =
        mailProps.getProperty("mail.smtp.auth.password")?.trim()?.takeIf { it.isNotEmpty() }
    val subject = "[CodBi] New llama.cpp release available: $newRelease (current: $llamaRelease)"
    val body = buildString {
      appendLine("A new version of llama.cpp is available.")
      appendLine()
      appendLine("  Current release : $llamaRelease")
      appendLine("  Latest release  : $newRelease")
      appendLine("  Platform        : $platformKey")
      appendLine()
      appendLine("Release page:")
      appendLine("  https://github.com/ggml-org/llama.cpp/releases/tag/$newRelease")
      appendLine()
      appendLine("To upgrade, set the plugin property:")
      appendLine("  ${PROP_PREFIX}_LlamaRelease = $newRelease")
      appendLine()
      appendLine("The server will automatically download the new binaries on next restart.")
      appendLine()
      appendLine("-- CodBi AI / LLAMA update checker")
    }

    return sendSmtpEmail(smtpHost, smtpPort, fromAddr, recipient, authUser, authPass, subject, body)
  }

  /**
   * Locates Formcycle's `system-mail.properties` by navigating upward from the plugin folder.
   *
   * Plugin folder layout: `xfc-server/config/plugins/system/<uuid>/` Target file:
   * `xfc-server/config/system-mail.properties` → 3 directories up from the plugin folder.
   *
   * @return The properties [File], or `null` if not found.
   */
  private fun findSystemMailProperties(): File? {
    var dir = pluginFolder ?: return null

    repeat(3) { dir = dir.parentFile ?: return null }

    val candidate = File(dir, "system-mail.properties")

    return if (candidate.exists()) candidate else null
  }

  /**
   * Sends a plain-text email via raw SMTP (no external mail library required).
   *
   * Supports optional AUTH LOGIN. Does **not** support STARTTLS — suitable for localhost or
   * trusted-network relay servers as typically configured in Formcycle.
   *
   * @param host SMTP server hostname.
   * @param port SMTP server port.
   * @param from Sender email address.
   * @param to Recipient email address.
   * @param subject Email subject line.
   * @param body Plain-text email body.
   * @param username Optional AUTH LOGIN username.
   * @param password Optional AUTH LOGIN password.
   * @return `true` if the server accepted the message (250 response after DATA).
   * @throws Exception Propagates socket or I/O errors.
   */
  private fun sendSmtpEmail(
      host: String,
      port: Int,
      from: String,
      to: String,
      user: String?,
      password: String?,
      subject: String,
      body: String
  ): Boolean {
    try {
      Socket(host, port).use { socket ->
        socket.soTimeout = 30_000

        val reader = BufferedReader(InputStreamReader(socket.getInputStream(), Charsets.UTF_8))
        val writer = OutputStreamWriter(socket.getOutputStream(), Charsets.UTF_8)

        fun readResponse(): String {
          var line: String

          do {
            line = reader.readLine() ?: throw Exception("SMTP connection closed unexpectedly")
          } while (line.length >= 4 && line[3] == '-') // multi-line continues with "250-..."

          return line
        }
        /** Sends a command and reads the response. */
        fun send(cmd: String): String {
          writer.write(cmd + "\r\n")
          writer.flush()

          return readResponse()
        }

        readResponse()
        send("EHLO codbi-llama")

        if (!user.isNullOrEmpty() && !password.isNullOrEmpty()) {
          send("AUTH LOGIN")
          send(java.util.Base64.getEncoder().encodeToString(user.toByteArray()))

          val authResp = send(java.util.Base64.getEncoder().encodeToString(password.toByteArray()))

          if (!authResp.startsWith("235")) {
            log(LogLevel.WARNING, "SMTP AUTH failed: $authResp")
            return false
          }
        }

        send("MAIL FROM:<$from>")
        send("RCPT TO:<$to>")
        send("DATA")

        val now = ZonedDateTime.now().format(DateTimeFormatter.RFC_1123_DATE_TIME)

        writer.write("Date: $now\r\n")
        writer.write("From: CodBi AI <$from>\r\n")
        writer.write("To: $to\r\n")
        writer.write("Subject: $subject\r\n")
        writer.write("Content-Type: text/plain; charset=UTF-8\r\n")
        writer.write("X-Mailer: CodBi-LLAMA/1.0\r\n")
        writer.write("\r\n")

        for (line in body.lines()) {
          if (line.startsWith(".")) writer.write(".")

          writer.write(line + "\r\n")
        }

        writer.write(".\r\n")
        writer.flush()

        val dataResp = readResponse()

        send("QUIT")

        if (dataResp.startsWith("250")) {
          log(LogLevel.INFO, "Update notification email sent to $to")

          return true
        } else {
          log(LogLevel.WARNING, "SMTP server rejected message: $dataResp")

          return false
        }
      }
    } catch (e: Exception) {
      log(LogLevel.ERROR, "Failed to send notification email: ${e.message}")

      return false
    }
  }

  // endregion SMTP Email
  // endregion Version Check & Notifications
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
