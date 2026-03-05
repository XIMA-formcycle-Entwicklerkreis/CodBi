package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.llama

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.BraveSearch
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.LLAMA
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

// ═══════════════════════════════════════════════════════════════════════════════
//  Standard — Generic GGUF model runner via local llama-server process
// ═══════════════════════════════════════════════════════════════════════════════
//
// Implements the "Swan Architecture" for any GGUF model:
//   1. Downloads llama-server binary (platform-specific)
//   2. Downloads a configurable GGUF model + optional vision projector
//   3. Launches llama-server as a separate OS process
//   4. Sends OpenAI-compatible /v1/chat/completions requests with base64 images
//
// All AI computation happens in the external llama-server process.
// If it OOMs the Tomcat JVM stays alive — only the llama-server dies.
//
// ## Plugin Properties
//
// | Property                           | Type    | Default                          | Description
//                                                |
// |------------------------------------|---------|----------------------------------|--------------------------------------------------------------|
// | `Active_AI`                        | String  | —                                | Must contain
// `llama_std` to activate this model               |
// | `AI_LLAMA_STD_ModelUrl`             | URL     | Qwen3-VL-2B Q4_K_M HuggingFace  | Download URL
// for the GGUF model file                         |
// | `AI_LLAMA_STD_MmprojUrl`            | URL     | Qwen3-VL-2B mmproj HuggingFace  | Download URL
// for the vision projector (mmproj) file          |
// | `AI_LLAMA_STD_MaxPixels`            | Int     | `3211264`                        | Max pixel
// budget for image downscaling (min 3136)            |
// | `AI_LLAMA_STD_MaxTokens`            | Int     | `2048`                           | Maximum
// tokens to generate per response                      |
// | `AI_LLAMA_STD_MaxRAMPercent`        | Double  | `101.0`                          | RAM usage
// threshold (%) — blocks requests when exceeded      |
// | `AI_LLAMA_STD_MaxCPUPercent`        | Double  | `101.0`                          | CPU usage
// threshold (%) — blocks requests when exceeded      |
// | `AI_LLAMA_STD_LlamaRelease`         | String  | `b8175`                          | llama.cpp
// release tag for server binary download             |
// | `AI_LLAMA_STD_ServerUrl_<platform>` | URL     | (auto from release tag)          | Per-platform
// override for the llama-server binary URL        |
// | `AI_LLAMA_STD_UpdateCheckHours`     | Long    | `24`                             | Hours
// between
// GitHub release checks (0 = disabled)           |
// | `AI_LLAMA_STD_NotifyEmail`          | String  | —                                | Email
// address
// for update notifications                       |
// | `AI_LLAMA_STD_ThinkingModelUrl`    | URL     | —                                | Download URL
// for a dedicated thinking model GGUF (optional) |
// | `AI_LLAMA_STD_ThinkingMmprojUrl`   | URL     | —                                | Download URL
// for the thinking model's mmproj file (optional)|
// | `AI_LLAMA_STD_ExternalUrl`          | URL     | —                                | Base URL of
// an external OpenAI-compatible API; overrides local model |
// | `AI_LLAMA_STD_ExternalApiKey`       | String  | —                                | API key for
// the external AI (sent as Bearer token)                   |
// | `AI_LLAMA_STD_ExternalModel`        | String  | —                                | Model name
// for the external API (e.g. gpt-4o, claude-3-opus)       |
// | `AI_BraveSearch_ApiKey`            | String  | —                                | Brave Search
// API key — enables web search tool for the model |
//
// ═══════════════════════════════════════════════════════════════════════════════

class Standard : LLAMA() {

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

  // ── Configurable URLs (overridable via plugin properties) ─────────────────
  private var modelUrl = DEFAULT_MODEL_URL
  private var mmprojUrl = DEFAULT_MMPROJ_URL

  // ── External AI settings (overrides local model when set) ─────────────────
  /** Base URL for an external OpenAI-compatible API (e.g. "https://api.openai.com/v1"). */
  private var externalUrl: String? = null
  /** API key for the external AI service (sent as Bearer token). */
  private var externalApiKey: String? = null
  /** Model identifier for the external API (e.g. "gpt-4o", "claude-3-opus-20240229"). */
  private var externalModel: String? = null
  /** Whether to use an external AI service instead of the local llama-server. */
  private val isExternalMode: Boolean
    get() = externalUrl != null

  // ── Thinking model URLs (optional — enables dedicated thinking server) ────
  private var thinkingModelUrl: String? = null
  private var thinkingMmprojUrl: String? = null

  // ── Thinking model state ──────────────────────────────────────────────────
  /** Whether a dedicated thinking model is configured (separate from the fast model). */
  private val hasThinkingModel: Boolean
    get() = thinkingModelUrl != null

  /** Downloaded thinking model GGUF file. */
  private var thinkingModelFile: File? = null

  /** Downloaded thinking model mmproj file (may be null if no vision needed). */
  private var thinkingMmprojFile: File? = null

  /** The port the thinking model's llama-server listens on. */
  @Volatile private var thinkingServerPort: Int = 0

  /** The running thinking llama-server process. */
  @Volatile private var thinkingServerProcess: Process? = null

  /** Whether the thinking server is ready for requests. */
  @Volatile private var thinkingServerReady = false

  /** Threads consuming thinking server stdout/stderr. */
  private var thinkingStdoutThread: Thread? = null
  private var thinkingStderrThread: Thread? = null

  // ── Model / inference settings ────────────────────────────────────────────
  /** Maximum pixel budget for downscaling images before encoding as base64. */
  private var maxPixels = 3_211_264 // ≈ 1792×1792

  /** Maximum tokens to generate in the response. */
  private var maxTokens = 2048

  /** Resource monitoring thresholds. */
  private var maxRAMPercent = 101.0
  private var maxCPUPercent = 101.0

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

  // ── Version check settings ────────────────────────────────────────────
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

  // ── Token Streaming Infrastructure ────────────────────────────────────────

  /**
   * Holds the state of an in-flight streaming request. The background thread appends generated text
   * chunks; polling requests read them.
   */
  private class StreamingSession(
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
    /** When true the client should show a "searching the web" animation. */
    @Volatile var searching = false
    /** The search query text shown to the user while searching. */
    @Volatile var searchQuery: String? = null
    /** Which model produced the response: "fast" or "thinking". */
    @Volatile var modelType: String = if (enableThinking) "thinking" else "fast"

    // ── Localized UI labels (set after language detection) ──
    @Volatile var uiReasoningLabel: String = "Reasoning\u2026"
    @Volatile var uiShowReasoningLabel: String = "Show reasoning"
    @Volatile var uiShowSourcesLabel: String = "Show sources"
    @Volatile var uiSearchingLabel: String = "Searching the internet for \u201C%s\u201D\u2026"
    @Volatile var uiSearchingLabelNoQuery: String = "Searching the internet\u2026"
    @Volatile var uiThinkingLabel: String = "Thinking\u2026"

    fun currentText(): String = textChunks.joinToString("")

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

  // ── ResourceMonitor inner class ───────────────────────────────────────────

  private inner class ResourceMonitor : Thread("codbi-llama-resource-monitor") {
    @Volatile
    var cpuPercent = 0.0
      private set

    @Volatile
    var ramPercent = 0.0
      private set

    @Volatile var running = true

    private val osMxBean: com.sun.management.OperatingSystemMXBean? =
        try {
          ManagementFactory.getOperatingSystemMXBean() as? com.sun.management.OperatingSystemMXBean
        } catch (_: Exception) {
          null
        }

    init {
      isDaemon = true
    }

    override fun run() {
      while (running) {
        try {
          osMxBean?.let {
            cpuPercent = it.cpuLoad * 100.0
            val totalMem = it.totalMemorySize.toDouble()
            val freeMem = it.freeMemorySize.toDouble()
            ramPercent = if (totalMem > 0) (totalMem - freeMem) / totalMem * 100.0 else 0.0
          }
          sleep(1000)
        } catch (_: InterruptedException) {
          break
        } catch (_: Exception) {
          /* ignore */
        }
      }
    }

    fun resourcesAvailable(): Boolean = cpuPercent < maxCPUPercent && ramPercent < maxRAMPercent

    fun exceedReason(): String? {
      val parts = mutableListOf<String>()
      if (cpuPercent >= maxCPUPercent)
          parts.add("CPU %.1f%% >= %.0f%%".format(cpuPercent, maxCPUPercent))
      if (ramPercent >= maxRAMPercent)
          parts.add("RAM %.1f%% >= %.0f%%".format(ramPercent, maxRAMPercent))
      return if (parts.isEmpty()) null else parts.joinToString(", ")
    }

    fun estimateWaitSeconds(): Int {
      val cpuOver = (cpuPercent - maxCPUPercent).coerceAtLeast(0.0)
      val ramOver = (ramPercent - maxRAMPercent).coerceAtLeast(0.0)
      return ((cpuOver + ramOver) / 5.0).toInt().coerceIn(5, 120)
    }

    fun shutdown() {
      running = false
      interrupt()
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Lifecycle
  // ═══════════════════════════════════════════════════════════════════════════

  override fun getName(): String = "CodBi_AI_LLAMA_STD"

  override fun initialize(configData: IPluginInitializeData) {
    idLogMessages = "LlamaSrv"

    // Check activation: must contain "llama_std" (case-insensitive)
    val activeAiRaw = configData.properties.getProperty("Active_AI") ?: ""
    val activeAi = activeAiRaw.lowercase()
    if (!activeAi.contains("llama_std")) {
      log(LogLevel.INFO, "Standard initialization skipped because Active_AI='$activeAiRaw'")
      return
    }

    // Let base class set up directories and read LLAMA properties
    super.initialize(configData)

    // Read external AI properties (if set, overrides local model entirely)
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

    // Read model-specific plugin properties
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

    // Read optional thinking model URLs (dedicated thinking server)
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
    configData.properties
        .getProperty("${PROP_PREFIX}_MaxCPUPercent")
        ?.trim()
        ?.toDoubleOrNull()
        ?.let { if (it in 1.0..110.0) maxCPUPercent = it }

    // Override llama.cpp release tag if configured
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

    // Override server URLs if configured per-platform
    serverUrls.keys.toList().forEach { platform ->
      configData.properties
          .getProperty("${PROP_PREFIX}_ServerUrl_$platform")
          ?.trim()
          ?.takeIf { it.isNotEmpty() }
          ?.let { customUrl -> serverUrls[platform] = customUrl }
    }

    // Read update-check properties
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

    // Store plugin folder for locating system-mail.properties later
    pluginFolder = configData.fileHelper.pluginFolder

    // ── Brave Search API key ────────────────────────────────────────────
    configData.properties
        .getProperty("AI_BraveSearch_ApiKey")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { BraveSearch.apiKey = it }

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

    // ── External AI mode: skip local server startup entirely ────────────────
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

    // Start resource monitor
    resourceMonitor?.shutdown()
    resourceMonitor = ResourceMonitor().also { it.start() }

    // Launch the full pipeline in a background thread so Formcycle doesn't block on startup.
    Thread(
            {
              try {
                // ── Phase 1: Intelligence ──
                val platform = detectPlatform()
                log(LogLevel.INFO, "Platform: ${platform.os}/${platform.arch}")

                // ── Phase 2: Fetch ──
                // Download llama-server binary (GPU auto-detection, change detection, CUDA DLLs)
                val binary = downloadServerBinary(platform)
                if (binary == null) {
                  loadError = IllegalStateException("Failed to download llama-server binary")
                  return@Thread
                }

                // Download model GGUF
                val modelFileName = modelUrl.substringAfterLast("/")
                modelFile = File(modelsDir, modelFileName)
                if (!downloadWithResume(modelUrl, modelFile!!, "GGUF model")) {
                  loadError = IllegalStateException("Failed to download GGUF model")
                  return@Thread
                }

                // Download mmproj (vision projector)
                val mmprojFileName = mmprojUrl.substringAfterLast("/")
                mmprojFile = File(modelsDir, mmprojFileName)
                if (!downloadWithResume(mmprojUrl, mmprojFile!!, "mmproj (vision projector)")) {
                  loadError = IllegalStateException("Failed to download mmproj file")
                  return@Thread
                }

                // ── Phase 3: Ignition — Start fast/normal model server ──
                // Start the fast model FIRST so it's available immediately,
                // even while the thinking model is still downloading.
                val started = startServer(binary, modelFile!!, mmprojFile)
                if (!started) {
                  loadError = IllegalStateException("llama-server failed to start")
                  return@Thread
                }

                isActive = true
                serverReady = true
                log(LogLevel.INFO, "Standard (llama) fast model initialized and ready for requests")

                // ── Phase 4: Download + start thinking model (if configured) ──
                // This happens AFTER the fast server is ready, so requests
                // can be served while the thinking model downloads.
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
              } catch (e: Exception) {
                loadError = e
                log(LogLevel.ERROR, "Initialization failed: ${e.message}", "", e)
              }
            },
            "llama-srv-init")
        .apply { isDaemon = true }
        .start()

    // Start the update checker independently of server startup
    startVersionChecker()
  }

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

  // ═══════════════════════════════════════════════════════════════════════════
  //  Thinking Model Server
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Starts a second llama-server instance for the dedicated thinking model. Uses the same binary
   * but a different port and model file.
   *
   * @param binary The llama-server executable (shared with the fast server).
   * @return `true` if the thinking server started and passed health checks.
   */
  private fun startThinkingServer(binary: File): Boolean {
    val thinkModel = thinkingModelFile ?: return false

    // Pick a port offset from the main server
    thinkingServerPort = findThinkingPort(serverPort + 100)

    val resolvedThreads = threadCount ?: detectPhysicalCores()

    val resolvedGpuLayers =
        when {
          gpuLayers >= 0 -> gpuLayers
          detectedGpu != GpuBackend.NONE -> 999
          else -> 0
        }

    log(LogLevel.INFO, "Starting thinking llama-server:")
    log(LogLevel.INFO, "  Binary:  ${binary.absolutePath}")
    log(
        LogLevel.INFO,
        "  Model:   ${thinkModel.absolutePath} (${"%.0f".format(thinkModel.length() / (1024.0 * 1024.0))} MB)")
    thinkingMmprojFile?.let { log(LogLevel.INFO, "  mmproj:  ${it.absolutePath}") }
    log(LogLevel.INFO, "  Port:    $thinkingServerPort")

    // Write the Qwen3 Jinja template for thinking (same template, the model is expected to think)
    val templateFile = File(binary.parentFile, "qwen3-thinking-template.jinja")
    templateFile.writeText(
        """{%- if messages[0].role == 'system' %}{%- set system_message = messages[0].content %}{%- set loop_messages = messages[1:] %}{%- else %}{%- set system_message = 'You are a helpful assistant.' %}{%- set loop_messages = messages %}{%- endif %}{{- '<|im_start|>system\n' + system_message + '<|im_end|>\n' }}{%- for message in loop_messages %}{%- if message.role == 'user' %}{%- if message.content is string %}{{- '<|im_start|>user\n' + message.content + '<|im_end|>\n' }}{%- else %}{{- '<|im_start|>user\n' }}{%- for part in message.content %}{%- if part.type == 'text' %}{{- part.text }}{%- endif %}{%- endfor %}{{- '<|im_end|>\n' }}{%- endif %}{%- elif message.role == 'assistant' %}{%- if message.reasoning_content is defined and message.reasoning_content is not none %}{{- '<|im_start|>assistant\n<think>\n' + message.reasoning_content + '\n</think>\n' + message.content + '<|im_end|>\n' }}{%- else %}{{- '<|im_start|>assistant\n' + message.content + '<|im_end|>\n' }}{%- endif %}{%- endif %}{%- endfor %}{%- if add_generation_prompt %}{{- '<|im_start|>assistant\n' }}{%- if enable_thinking is defined and enable_thinking is true %}{{- '<think>\n' }}{%- endif %}{%- endif %}"""
            .trimIndent())

    // Thinking needs a bigger per-slot context: max_tokens is up to maxTokens*4 and the
    // remaining budget must still hold the system prompt, chat history, and (optionally bulky)
    // search instructions.  Double the base ctxSize so the per-slot context is 2× the fast
    // server's, without touching parallelSlots.
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
    // Note: --reasoning-format deepseek is intentionally NOT used here.
    // We handle <think>/</ think> separation ourselves via filterThinkTags + pre-fill seeding,
    // which allows us to seed the reasoning language (e.g. German) via the <think> pre-fill.

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
                    } catch (_: Exception) {}
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
                    } catch (_: Exception) {}
                  },
                  "thinking-stderr")
              .apply {
                isDaemon = true
                start()
              }

      // Wait for thinking server health
      val healthy = waitForThinkingHealth()
      if (!healthy) {
        log(LogLevel.ERROR, "Thinking server failed to become healthy")
        stopThinkingServer()
        return false
      }

      log(LogLevel.INFO, "Thinking llama-server is healthy on port $thinkingServerPort")
      return true
    } catch (e: Exception) {
      log(LogLevel.ERROR, "Failed to start thinking server: ${e.message}", "", e)
      stopThinkingServer()
      return false
    }
  }

  /** Finds a free port for the thinking server, starting from [preferredPort]. */
  private fun findThinkingPort(preferredPort: Int): Int {
    for (offset in 0 until 20) {
      val candidate = preferredPort + offset
      if (candidate > 65535 || candidate == serverPort) continue
      try {
        java.net.ServerSocket(candidate).use { /* port is free */ }
        return candidate
      } catch (_: Exception) {
        /* in use */
      }
    }
    return try {
      java.net.ServerSocket(0).use { it.localPort }
    } catch (_: Exception) {
      preferredPort
    }
  }

  /** Polls the thinking server `/health` endpoint until it reports healthy. */
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
            } catch (_: Exception) {
              ""
            }
        connection.disconnect()

        if (responseCode == 200 &&
            (body.contains("ok", ignoreCase = true) || body.contains("\"status\""))) {
          return true
        }
        lastError = "HTTP $responseCode: $body"
      } catch (e: Exception) {
        lastError = e.message ?: "connection refused"
      }

      Thread.sleep(1_000L)
    }

    log(LogLevel.ERROR, "Thinking server health check timed out. Last error: $lastError")
    return false
  }

  /** Stops the thinking llama-server process. */
  private fun stopThinkingServer() {
    thinkingServerProcess?.let { proc ->
      log(LogLevel.INFO, "Stopping thinking llama-server...")
      try {
        proc.destroy()
        if (!proc.waitFor(10, java.util.concurrent.TimeUnit.SECONDS)) {
          proc.destroyForcibly()
          proc.waitFor(5, java.util.concurrent.TimeUnit.SECONDS)
        }
        log(LogLevel.INFO, "Thinking server stopped (exit code: ${proc.exitValue()})")
      } catch (e: Exception) {
        log(LogLevel.WARNING, "Error stopping thinking server: ${e.message}")
        try {
          proc.destroyForcibly()
        } catch (_: Exception) {}
      }
    }
    thinkingServerProcess = null
    thinkingStdoutThread = null
    thinkingStderrThread = null
    thinkingServerReady = false
    activeThinkingServerPort = 0
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Servlet execute — the entry point for every AI request
  // ═══════════════════════════════════════════════════════════════════════════

  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    // ── Stream-poll shortcut ──────────────────────────────────────────────────
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
      // Don't remove session immediately on done — the client may miss the done signal
      // (e.g. if it returns early on CALL:search detection). TTL cleanup handles removal.

      // Suppress CALL:search command text from ever reaching the client.
      // If the accumulated text contains CALL it is a tool invocation — return empty text.
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
              "\"thinkingLabel\":\"${jsonEscape(session.uiThinkingLabel)}\"" +
              "}"
      val jsonValue =
          if (err != null) {
            "{\"text\":\"${jsonEscape(visibleText)}\",\"done\":true,\"error\":\"${jsonEscape(err)}\"$resStatusJson$searchingJson$searchQueryJson$thinkingJson$modelTypeJson$i18nJson}"
          } else {
            "{\"text\":\"${jsonEscape(visibleText)}\",\"done\":$done$resStatusJson$searchingJson$searchQueryJson$thinkingJson$modelTypeJson$i18nJson}"
          }
      return jsonResponse(jsonValue)
    }
    // ── End stream-poll shortcut ──────────────────────────────────────────────

    // ── Health-check shortcut ─────────────────────────────────────────────────
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
      // Model is ready (or in external mode) — include model name for the UI
      val displayModel =
          if (isExternalMode) {
            // External model name, e.g. "meta-llama/llama-4-scout-17b-16e-instruct"
            // Show only the part after the last slash for cleaner display
            (externalModel ?: "External AI").substringAfterLast("/")
          } else {
            // Local GGUF filename → friendly name: strip extension + quantization suffix
            // e.g. "Qwen3VL-2B-Instruct-Q4_K_M.gguf" → "Qwen3VL-2B-Instruct"
            val raw = modelUrl.substringAfterLast("/").removeSuffix(".gguf")
            raw.replace(Regex("-[QFqf][0-9_]+[A-Za-z_]*$"), "")
          }
      return jsonResponse("{\"status\":\"ready\",\"model\":\"${jsonEscape(displayModel)}\"}")
    }
    // ── End health-check shortcut ─────────────────────────────────────────────

    log(
        LogLevel.INFO,
        "Processing VQA request" +
            if (isExternalMode) " (external: $externalUrl)"
            else " (llama-server on port $serverPort)")

    // ── Resource gate ─────────────────────────────────────────────────────────
    resourceMonitor?.let { monitor ->
      val reason = monitor.exceedReason()
      if (reason != null) {
        val waitSec = monitor.estimateWaitSeconds()
        log(LogLevel.WARNING, "Resource gate BLOCKED: $reason — estimated wait ${waitSec}s")
        return jsonResponse(
            "{\"error\":\"Server resources exceeded ($reason). Please retry in ~${waitSec} seconds.\",\"retryAfter\":$waitSec}")
      }
    }

    // ── Readiness checks ──────────────────────────────────────────────────────
    if (loadError != null) {
      return jsonResponse(
          "{\"error\":\"Failed to initialize: ${jsonEscape(loadError?.message ?: "unknown")}\"}")
    }
    if (!isExternalMode && (!serverReady || !isServerAlive())) {
      // Attempt restart if server died
      if (serverReady && !isServerAlive()) {
        log(LogLevel.WARNING, "llama-server process died — attempting restart")
        serverReady = false
        val binary = serverBinary
        val model = modelFile
        if (binary != null && model != null) {
          val restarted = startServer(binary, model, mmprojFile)
          if (restarted) {
            serverReady = true
            isActive = true
          } else {
            return jsonResponse("{\"error\":\"llama-server crashed and restart failed.\"}")
          }
        }
      }
      if (!serverReady) {
        return jsonResponse(
            "{\"error\":\"Model is not ready yet. It may still be downloading or loading.\"}")
      }
    }

    // ── Parse questions from headers ──────────────────────────────────────────
    val questionsToAsk = mutableMapOf<String, String>()
    params.headerMap.forEach { (headerName, headerValue) ->
      if (headerName.startsWith("x-question-", ignoreCase = true)) {
        val key = headerName.lowercase().substringAfter("x-question-", "").lowercase()
        if (key.isNotBlank() && headerValue != null) {
          // Header value is Base64-encoded UTF-8 from the client
          val decodedValue =
              try {
                val bytes = java.util.Base64.getDecoder().decode(headerValue)
                String(bytes, Charsets.UTF_8)
              } catch (_: Exception) {
                // Fallback: try raw ISO-8859-1 → UTF-8 re-interpretation
                try {
                  String(headerValue.toByteArray(Charsets.ISO_8859_1), Charsets.UTF_8)
                } catch (_: Exception) {
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

    // ── Parse chat history ────────────────────────────────────────────────────
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

    // ── Collect image data ────────────────────────────────────────────────────
    val fileDataMap = collectImageData(params)

    // ── Rotation ──────────────────────────────────────────────────────────────
    val manualRotation =
        params.headerMap.entries
            .find { it.key.equals("X-Rotate", ignoreCase = true) }
            ?.value
            ?.trim()
            ?.toIntOrNull()

    // ── Session-based slot isolation ─────────────────────────────────────────
    val slotId: Int = run {
      val sid =
          params.headerMap.entries.find { it.key.equals("X-Session-Id", ignoreCase = true) }?.value
              ?: return@run -1
      Math.floorMod(sid.hashCode(), parallelSlots).also {
        log(LogLevel.INFO, "Session ${sid.take(8)}… → slot $it (of $parallelSlots)")
      }
    }

    // ── Thinking mode ─────────────────────────────────────────────────────────
    // Only enable thinking when the dedicated thinking server is available.
    // The fast (Instruct) model cannot handle <think> pre-fill — it produces
    // garbage/nothing. Without a dedicated thinking model, skip thinking entirely.
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

    // ── Search toggle ─────────────────────────────────────────────────────────
    val searchEnabled =
        params.headerMap.entries.none {
          it.key.equals("X-Search", ignoreCase = true) &&
              it.value.equals("false", ignoreCase = true)
        }
    log(LogLevel.INFO, "Search enabled: $searchEnabled")

    // ── Location toggle ───────────────────────────────────────────────────────
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

    // Resolve client IP for IP-based geolocation fallback
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

    // ── Streaming path ────────────────────────────────────────────────────────
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
                // Detect language via a fast model call BEFORE the main completion.
                // Declared outside try so it's available in the finally fallback path.
                val question = questions.values.first()
                val detectedLang = detectLanguageViaModel(question)
                // Set localized UI labels on the session for the poll response
                if (detectedLang != null) {
                  session.uiReasoningLabel = detectedLang.uiReasoningLabel
                  session.uiShowReasoningLabel = detectedLang.uiShowReasoningLabel
                  session.uiShowSourcesLabel = detectedLang.uiShowSourcesLabel
                  session.uiSearchingLabel = detectedLang.uiSearchingLabel
                  session.uiSearchingLabelNoQuery = detectedLang.uiSearchingLabelNoQuery
                  session.uiThinkingLabel = detectedLang.uiThinkingLabel
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

                  // Always stream directly to the user for immediate feedback
                  streamChatCompletion(messages, session, enableThinking, slot)
                  val fullText = session.currentText()
                  val thinkText = session.currentThinking()
                  log(
                      LogLevel.INFO,
                      "Stream done. Text: ${fullText.take(80)}…, Thinking: ${thinkText.take(120)}… (${thinkText.length} chars)")

                  // After streaming completes, check if the model wants a web search.
                  // Only check visible text for CALL:search — if the model placed it inside
                  // <think> tags, it was reasoning about searching, not requesting it.
                  // The auto-search fallback in the finally block handles the case where
                  // thinking produced no visible answer.
                  if (searchEnabled &&
                      BraveSearch.isAvailable &&
                      BraveSearch.CALL_SEARCH_PATTERN.containsMatchIn(fullText)) {
                    // Extract the search query for the client indicator (sanitized)
                    val rawQuery =
                        BraveSearch.CALL_SEARCH_PATTERN.find(fullText)?.groupValues?.get(1) ?: ""
                    session.searchQuery =
                        BraveSearch.sanitizeQuery(rawQuery, detectedLang?.languageName)
                    // Signal the client to show a search animation
                    session.searching = true
                    // Strip the CALL:search text so it's not displayed
                    session.textChunks.clear()

                    handleSearchToolCallStreaming(
                        fullText,
                        question,
                        imageParts,
                        history,
                        session,
                        enableThinking,
                        slot,
                        detectedLang)
                    session.searching = false
                    session.searchQuery = null
                  }
                } catch (ex: Exception) {
                  session.error = ex.message ?: "Unknown error"
                  log(LogLevel.ERROR, "Streaming error: ${ex.message}", "", ex)
                } finally {
                  // If the model produced only reasoning (no visible answer), keep reasoning
                  // in the collapsible section and show a helpful visible message instead
                  // of dumping raw reasoning into the chat bubble.
                  if (enableThinking &&
                      session.currentText().isBlank() &&
                      session.currentThinking().isNotBlank()) {
                    // Thinking model failed to produce a visible answer — fall back to
                    // the fast model (non-thinking) and let IT decide whether a web search
                    // is needed via CALL:search, rather than forcing a search every time.
                    log(
                        LogLevel.INFO,
                        "Thinking model failed to produce answer — falling back to fast model")
                    session.thinkingChunks.add(
                        "\n⚠ The thinking model used all available tokens for reasoning without producing a final answer. The fast model was used to generate this response instead.\n")
                    session.modelType = "fast"
                    session.textChunks.clear()
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
                    streamChatCompletion(fallbackMessages, session, false, slot)
                    val fallbackText = session.currentText()

                    // If the fast model emitted CALL:search, handle it
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
                          detectedLang)
                      session.searching = false
                      session.searchQuery = null
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

    // ── Non-streaming path ────────────────────────────────────────────────────
    val finalResults = mutableMapOf<String, Map<String, String>>()

    try {
      val imageParts =
          if (fileDataMap.isNotEmpty()) {
            prepareImageParts(fileDataMap, manualRotation)
          } else emptyList()

      for ((questionKey, question) in questionsToAsk) {
        // Detect language via a fast model call BEFORE the main completion
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
        var answer = chatCompletion(messages, enableThinking, slotId)

        // ── CALL:search tool loop ──────────────────────────────────────
        if (searchEnabled) {
          answer =
              handleSearchToolCall(
                  answer, question, imageParts, chatHistory, enableThinking, slotId, detectedLang)
        }

        finalResults[questionKey] = mapOf("answer" to answer)
        log(LogLevel.INFO, "Q[$questionKey]: ${question.take(80)}… → ${answer.take(80)}…")
      }
    } catch (e: Exception) {
      log(LogLevel.ERROR, "Inference error: ${e.message}", "", e)
      return jsonResponse("{\"error\":\"${jsonEscape(e.message ?: "Inference failed")}\"}")
    }

    // Build response JSON
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

  // ═══════════════════════════════════════════════════════════════════════════
  //  Image Handling
  // ═══════════════════════════════════════════════════════════════════════════

  /** Collects image data from both multipart upload files and base64 data-URL parameters. */
  private fun collectImageData(params: IPluginServletActionParams): Map<String, ByteArray> {
    val fileDataMap = mutableMapOf<String, ByteArray>()

    // From multipart uploads
    params.uploadFiles?.forEach { (inputName, fileDataList) ->
      val combinedBytes =
          fileDataList.fold(byteArrayOf()) { acc, fd -> acc + (fd.data ?: byteArrayOf()) }
      if (combinedBytes.isNotEmpty()) {
        fileDataMap[inputName] = combinedBytes
        log(LogLevel.INFO, "Upload image '$inputName': ${combinedBytes.size} bytes")
      }
    }

    // From base64 data-URL text parameters
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
        } catch (e: Exception) {
          log(LogLevel.WARNING, "Failed to decode base64 for '$imageName': ${e.message}")
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
        // Apply manual rotation if requested
        val rotatedBytes =
            if (manualRotation != null && manualRotation != 0) {
              val buf = ImageIO.read(ByteArrayInputStream(imageBytes))
              if (buf != null) {
                val rotated =
                    when (manualRotation) {
                      90,
                      180,
                      270 -> rotateImage(buf, manualRotation)
                      else -> buf
                    }
                val baos = ByteArrayOutputStream()
                ImageIO.write(rotated, "PNG", baos)
                baos.toByteArray()
              } else imageBytes
            } else imageBytes

        // Server-side downscale gate
        val finalBytes = downscaleIfNeeded(rotatedBytes)

        // Encode as base64
        val base64 = java.util.Base64.getEncoder().encodeToString(finalBytes)
        log(LogLevel.INFO, "Image '$inputName' prepared: ${finalBytes.size} bytes → base64")
        "data:image/png;base64,$base64"
      } catch (e: Exception) {
        log(LogLevel.WARNING, "Failed to prepare image '$inputName': ${e.message}")
        null
      }
    }
  }

  /** Downscales image bytes if the total pixel count exceeds [maxPixels]. */
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
    } catch (e: Exception) {
      log(LogLevel.WARNING, "Downscale failed: ${e.message} — using original")
      return imageBytes
    }
  }

  /** Rotates a [BufferedImage] by 90, 180, or 270 degrees. */
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

  // ═══════════════════════════════════════════════════════════════════════════
  //  Web Search Tool (CALL:search) handling
  // ═══════════════════════════════════════════════════════════════════════════

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
      detectedLang: DetectedLanguage? = null
  ): String {
    if (!BraveSearch.isAvailable) return initialAnswer

    var answer = initialAnswer
    for (round in 1..maxSearchRoundTrips) {
      val match = BraveSearch.CALL_SEARCH_PATTERN.find(answer) ?: break
      val query = match.groupValues[1]
      log(LogLevel.INFO, "Model requested web search (round $round): '$query'")

      val results =
          BraveSearch.search(query, detectedLang?.braveCountry, detectedLang?.languageName)
      if (results.isEmpty()) {
        log(LogLevel.WARNING, "Web search returned no results for: '$query'")
        break
      }

      val searchContext = BraveSearch.formatResultsForModel(results)

      // Build extended conversation: original history + user question + assistant's CALL + search
      // results. Only pass the CALL:search command, not any surrounding reasoning text.
      val extendedHistory = chatHistory.toMutableList()
      extendedHistory.add("user" to originalQuestion)
      extendedHistory.add("assistant" to match.value)
      extendedHistory.add("user" to searchContext)

      val followUpQuestion = searchFollowUpPrompt(originalQuestion, detectedLang)
      // Don't pre-fill thinking for the follow-up — the answer must be visible text
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
   */
  private fun handleSearchToolCallStreaming(
      fullText: String,
      originalQuestion: String,
      imageParts: List<String>,
      chatHistory: List<Pair<String, String>>,
      session: StreamingSession,
      enableThinking: Boolean,
      slotId: Int,
      detectedLang: DetectedLanguage? = null
  ) {
    if (!BraveSearch.isAvailable) return

    val match = BraveSearch.CALL_SEARCH_PATTERN.find(fullText) ?: return
    val query = match.groupValues[1]
    log(LogLevel.INFO, "Streaming: Model raw output: '${fullText.take(200)}'")
    log(LogLevel.INFO, "Streaming: Model requested web search: '$query'")

    val results = BraveSearch.search(query, detectedLang?.braveCountry, detectedLang?.languageName)
    if (results.isEmpty()) {
      session.textChunks.clear()
      session.textChunks.add("The web search returned no results. Please try a different query.")
      return
    }

    val searchContext = BraveSearch.formatResultsForModel(results)

    // Preserve any actual reasoning the model produced before requesting search
    val priorReasoning = session.currentThinking().trim()

    // Clear the CALL:search text from the stream and replace with new completion
    session.textChunks.clear()
    session.thinkingChunks.clear()

    // Build the collapsible section content:
    // - If there was real reasoning before the search, show it first
    // - Then show the search sources
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
    // Only pass the CALL:search command as assistant context, NOT the entire (possibly repetitive)
    // thinking text.
    // The full thinking text can be thousands of chars and would overflow the fast model's context.
    val assistantContext = match.value
    extendedHistory.add("assistant" to assistantContext)
    extendedHistory.add("user" to searchContext)

    val followUpQuestion = searchFollowUpPrompt(originalQuestion, detectedLang)
    // Don't pre-fill thinking for the follow-up — the answer must be visible text
    val messages =
        buildMessages(
            followUpQuestion,
            imageParts,
            extendedHistory,
            enableThinking = false,
            detectedLang = detectedLang)
    streamChatCompletion(messages, session, false, slotId)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  OpenAI-Compatible Chat Completion
  // ═══════════════════════════════════════════════════════════════════════════

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

      // System prompt
      val today =
          java.time.LocalDate.now()
              .format(
                  java.time.format.DateTimeFormatter.ofPattern(
                      "d MMMM yyyy", java.util.Locale.ENGLISH))
      append("{\"role\":\"system\",\"content\":\"")
      append("You are a helpful assistant. Today is $today. Answer precisely and concisely. ")
      // Location context — inject early so the model sees it before search instructions
      if (locationEnabled && userLocation != null) {
        append(
            "IMPORTANT: The user is located near $userLocation. " +
                "Use this as the DEFAULT area for any location-dependent question (weather, nearby places, directions, local events). " +
                "This is the user's approximate area, NOT a specific address — never cite it as an address in answers. " +
                "If the user EXPLICITLY names a different city or place, use that location instead. ")
      } else if (locationEnabled) {
        append(
            "The user enabled location sharing but their location could not be determined. " +
                "If the question depends on location, ask the user to specify their city or region. ")
      }
      if (searchEnabled && BraveSearch.isAvailable) {
        append(
            "When you need current info, reply ONLY with CALL:search(query='your search query'). ")
        append(
            "The search query MUST be about the user's ACTUAL topic. Extract the core subject from the user's question. ")
        append(
            "SANITIZE: remove person names, serial numbers, IDs, and any code mixing letters+digits. Keep brand names and topic keywords. ")
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
      append(
          "Always respond in the same language the user writes in. Never mention or reference products, brands, or services that are not part of the user's question. ")
      append(
          "When mentioning measurements, always show BOTH metric and imperial units: °C (°F), km (mi), m (ft), kg (lbs), km/h (mph), liters (gallons), cm (in), etc. ")
      append(
          "Each question is independent — answer ONLY the current question. Do NOT repeat or mix in information from previous answers unless the user explicitly refers to them.")
      append("\"}")

      // Chat history — skip the last entry if it duplicates the current question
      // (the frontend pushes the user message to history before sending the request)
      val effectiveHistory =
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

      // Language negotiation: inject a short user→assistant turn that naturally sets the
      // conversation language.  "Let's talk in [X]" → "Sure!" is far more reliable than
      // system-prompt instructions for small models.
      val lang = detectedLang ?: detectLanguage(question)
      if (lang != null) {
        append(",{\"role\":\"user\",\"content\":\"${jsonEscape(lang.userTurn)}\"}")
        append(",{\"role\":\"assistant\",\"content\":\"${jsonEscape(lang.assistantTurn)}\"}")
      }

      // User message with optional images
      append(",{\"role\":\"user\",\"content\":")
      if (imageParts.isNotEmpty()) {
        // Multi-part content (images + text)
        append("[")
        for (imageUri in imageParts) {
          append("{\"type\":\"image_url\",\"image_url\":{\"url\":\"${jsonEscape(imageUri)}\"}},")
        }
        append("{\"type\":\"text\",\"text\":\"${jsonEscape(question)}\"}")
        append("]")
      } else {
        // Text-only content
        append("\"${jsonEscape(question)}\"")
      }
      append("}")

      // Pre-fill assistant response with <think> + language seed for ALL thinking modes.
      // This forces the model to start reasoning in the user's language.
      // We handle the <think>/</think> separation ourselves via filterThinkTags
      // instead of relying on reasoning_content (which doesn't support language seeding).
      if (enableThinking) {
        val thinkSeed =
            if (lang != null) lang.thinkSeed else "Think briefly. Do NOT repeat yourself."
        append(",{\"role\":\"assistant\",\"content\":\"<think>\\n$thinkSeed\"}")
      }

      append("]")
    }
  }

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
      // ── Frontend UI labels (sent to client for i18n) ──
      /** Label shown while the model is generating reasoning tokens (e.g. "Reasoning…"). */
      val uiReasoningLabel: String = "Reasoning\u2026",
      /** Label for the collapsible reasoning section (e.g. "Show reasoning"). */
      val uiShowReasoningLabel: String = "Show reasoning",
      /** Label for the collapsible sources section (e.g. "Show sources"). */
      val uiShowSourcesLabel: String = "Show sources",
      /**
       * Label shown while searching the internet with query (e.g. "Searching the internet for
       * \"%s\"…").
       */
      val uiSearchingLabel: String = "Searching the internet for \u201C%s\u201D\u2026",
      /**
       * Label shown while searching the internet without query (e.g. "Searching the internet…").
       */
      val uiSearchingLabelNoQuery: String = "Searching the internet\u2026",
      /** Label shown as initial "Thinking..." bubble before response starts. */
      val uiThinkingLabel: String = "Thinking\u2026"
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
                      uiThinkingLabel = "Denkt nach\u2026"),
              "deutsch" to null, // alias — resolved below
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
                      uiThinkingLabel = "Sto pensando\u2026"),
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
                      uiThinkingLabel = "Réflexion en cours\u2026"),
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
                      uiThinkingLabel = "Pensando\u2026"),
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
                      uiThinkingLabel = "Pensando\u2026"),
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
                      uiThinkingLabel = "Aan het nadenken\u2026"),
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
                      uiThinkingLabel = "Düşünüyor\u2026"),
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
                      uiThinkingLabel = "考え中\u2026"),
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
                      uiThinkingLabel = "思考中\u2026"),
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
                      uiThinkingLabel = "생각 중\u2026"),
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
                      uiThinkingLabel = "Думаю\u2026"),
              "русский" to null)
          .let { raw ->
            // Resolve aliases: "deutsch" → same as "german", etc.
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

      // Parse the JSON response to extract street, city, state, country
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

      // Build street part: "Nürnberger Straße 32" or just "Nürnberger Straße"
      val street = if (road != null && houseNumber != null) "$road $houseNumber" else road
      val parts = listOfNotNull(city, street, state, country).filter { it.isNotBlank() }
      if (parts.isEmpty()) {
        log(LogLevel.WARNING, "Nominatim address has no usable fields: $body")
        return null
      }
      val result = parts.joinToString(", ")
      log(LogLevel.INFO, "Reverse geocoded: $result")
      result
    } catch (ex: Exception) {
      log(LogLevel.WARNING, "Reverse geocoding failed: ${ex.message}")
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
    // Skip loopback / private IPs — they can't be geolocated
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
    } catch (ex: Exception) {
      log(LogLevel.WARNING, "IP geolocation failed: ${ex.message}")
      null
    }
  }

  /**
   * Asks the fast model to identify the language of the user's question. Returns a
   * [DetectedLanguage] with conversation-turn and think-seed strings, or `null` for English.
   *
   * This is a very lightweight call: a tiny prompt, max 8 output tokens, low temperature. It always
   * uses the **fast** server regardless of which model will handle the real question.
   */
  private fun detectLanguageViaModel(question: String): DetectedLanguage? {
    try {
      val messagesJson = buildString {
        append("[")
        append(
            "{\"role\":\"system\",\"content\":\"You are a language detector. The text may be in its native script OR romanized (written in Latin alphabet). Identify the ACTUAL language, not the script. Reply with ONLY the language name in English, nothing else. Examples: English, German, French, Italian, Spanish, Portuguese, Dutch, Turkish, Japanese, Chinese, Korean, Arabic, Russian, Hindi.\"}")
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
      // The model should respond with a single word like "German" or "French"
      val langName =
          raw.trim().lowercase().removeSuffix(".").removeSuffix("!").removeSuffix(",").trim()
      log(LogLevel.INFO, "Model-detected language: '$langName' (raw: '${raw.trim()}')")

      if (langName == "english") return null
      // Look up in our language map
      val detected = languageMap[langName]
      if (detected != null) return detected

      // Try partial match (e.g. model says "brazilian portuguese" → "portuguese")
      for ((key, value) in languageMap) {
        if (langName.contains(key) || key.contains(langName)) {
          log(LogLevel.INFO, "Partial language match: '$langName' → '$key'")
          return value
        }
      }

      log(
          LogLevel.INFO,
          "Language '$langName' not in language map — building generic negotiation turn")
      // Dynamically build a DetectedLanguage for any language the model identifies.
      // The "Let's talk in [X]" turn works universally even for languages we don't have
      // pre-built templates for.
      return DetectedLanguage(
          userTurn = "Let's talk in $langName.",
          assistantTurn = "Sure, I'll respond in $langName!",
          thinkSeed =
              "${langName.replaceFirstChar { it.uppercase() }}. Everything in $langName — including this reasoning. Think in $langName. Answer in $langName. Be brief, do NOT repeat.",
          searchPrompt =
              "Give a short, direct answer in $langName in 2-4 sentences using the search results. Include relevant links from the results as Markdown links. Do not repeat yourself. Answer in ${langName.uppercase()}.",
          languageName = langName.replaceFirstChar { it.uppercase() })
    } catch (e: Exception) {
      log(LogLevel.WARNING, "Model-based language detection failed: ${e.message}")
    }
    // Fallback to regex-based detection
    return detectLanguage(question)
  }

  /**
   * Detects the user's language from their question and returns conversation-turn strings that
   * naturally set the model's response language. Returns `null` for English (the default).
   *
   * The approach is deliberately simple: a fake "Let's talk in [X]" → "Sure!" exchange at the start
   * of the conversation is far more reliable than system-prompt instructions for small models.
   */
  private fun detectLanguage(question: String): DetectedLanguage? {
    val lower = " ${question.lowercase()} "

    // --- German ---
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

    // --- Italian (before French/Spanish — they share markers) ---
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
    if (italianMarkers.count { lower.contains(it) } >= 2) {
      return languageMap["italian"]
    }

    // --- Portuguese (before French/Spanish — ã and õ are uniquely Portuguese) ---
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

    // --- French ---
    // French uses heavy apostrophe contractions (l', d', c', j', n', qu') that break
    // space-padded matching.  Include those as highly distinctive markers.
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

    // --- Spanish ---
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

    // --- Turkish ---
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

  // detectThinkingSeed is no longer needed — the think seed is part of DetectedLanguage.
  // Language detection for the think seed is done once in detectLanguage() and reused.

  /** Returns a follow-up prompt for answering from search results in the user's language. */
  private fun searchFollowUpPrompt(
      originalQuestion: String,
      lang: DetectedLanguage? = null
  ): String {
    val resolved = lang ?: detectLanguage(originalQuestion)
    if (resolved != null) return resolved.searchPrompt
    return "Give a short, direct answer in 2-4 sentences using the search results. Include relevant links from the results as Markdown links. Do not repeat yourself."
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  External AI HTTP helpers
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Sends a synchronous POST request to the external OpenAI-compatible API. Adds Authorization
   * header and returns the response body.
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
        } catch (_: Exception) {
          ""
        }
    connection.disconnect()

    if (responseCode !in 200..299) {
      throw RuntimeException("External AI returned HTTP $responseCode: $body")
    }
    return body
  }

  /**
   * Sends a streaming POST request to the external OpenAI-compatible API. Processes Server-Sent
   * Events (SSE) and invokes the callback for each data line.
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
          } catch (_: Exception) {
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
   * Injects `"model":"<name>"` into an existing JSON request body when in external mode. Inserts
   * the field right after the opening `{`.
   */
  private fun injectModelField(requestBody: String): String {
    val model = externalModel ?: return requestBody
    return if (requestBody.startsWith("{")) {
      "{\"model\":\"${jsonEscape(model)}\"," + requestBody.substring(1)
    } else {
      requestBody
    }
  }

  /**
   * Sends a synchronous chat completion request to the llama-server or external AI.
   *
   * @param messagesJson The JSON messages array string.
   * @return The generated text response.
   */
  private fun chatCompletion(
      messagesJson: String,
      enableThinking: Boolean = false,
      idSlot: Int = -1
  ): String {
    // Route to dedicated thinking server if available, otherwise use main server
    val useThinkingServer = !isExternalMode && enableThinking && thinkingServerReady
    val targetPort = if (useThinkingServer) thinkingServerPort else serverPort

    var requestBody = buildString {
      append("{\"messages\":$messagesJson")
      // Thinking mode needs a larger token budget: reasoning tokens + answer
      val effectiveMaxTokens =
          if (enableThinking) (maxTokens * 4).coerceAtLeast(4096) else maxTokens
      append(",\"max_tokens\":$effectiveMaxTokens")
      append(",\"temperature\":${if (enableThinking) "0.5" else "0.1"}")
      if (!isExternalMode) append(",\"repetition_penalty\":${if (enableThinking) "1.5" else "1.1"}")
      append(",\"frequency_penalty\":${if (enableThinking) "1.0" else "0.5"}")
      append(",\"presence_penalty\":${if (enableThinking) "0.6" else "0.0"}")
      append(",\"stream\":false")
      // Thinking is handled via <think> pre-fill + filterThinkTags, not server-side enable_thinking
      if (!isExternalMode && idSlot >= 0) append(",\"id_slot\":$idSlot")
      append("}")
    }

    if (isExternalMode) {
      requestBody = injectModelField(requestBody)
      log(LogLevel.INFO, "Routing to external AI: $externalUrl")
    } else if (useThinkingServer) {
      log(LogLevel.INFO, "Routing to thinking server on port $thinkingServerPort")
    }

    // Thinking mode needs longer timeout: reasoning tokens + answer vs just answer
    val timeoutMs = if (enableThinking) 600_000 else 300_000
    val response =
        if (isExternalMode) {
          externalHttpPost("/v1/chat/completions", requestBody, timeoutMs = timeoutMs)
        } else {
          httpPost("/v1/chat/completions", requestBody, timeoutMs = timeoutMs, port = targetPort)
        }

    // Parse the response to extract generated text
    return try {
      val json = com.google.gson.JsonParser.parseString(response).asJsonObject
      val message = json.getAsJsonArray("choices")?.get(0)?.asJsonObject?.getAsJsonObject("message")
      var raw = message?.get("content")?.asString ?: response

      if (useThinkingServer) {
        // Dedicated thinking server: content is already clean, reasoning is in reasoning_content
        raw
      } else if (enableThinking) {
        // Hybrid mode / pre-fill approach: response doesn't include the opening <think> we sent,
        // so prepend it for stripThinkTags to match correctly.
        raw = "<think>$raw"
        var result = stripThinkTags(raw)
        // If model didn't close </think>, stripThinkTags leaves <think> prefix — remove it
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
   * Sends a streaming chat completion request. Text chunks are appended to the session as they
   * arrive via Server-Sent Events (SSE).
   */
  private fun streamChatCompletion(
      messagesJson: String,
      session: StreamingSession,
      enableThinking: Boolean = false,
      idSlot: Int = -1
  ) {
    // Route to dedicated thinking server if available, otherwise use main server
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

    var requestBody = buildString {
      append("{\"messages\":$messagesJson")
      // Thinking mode needs a larger token budget: reasoning tokens + answer
      val effectiveMaxTokens =
          if (enableThinking) (maxTokens * 4).coerceAtLeast(4096) else maxTokens
      append(",\"max_tokens\":$effectiveMaxTokens")
      append(",\"temperature\":${if (enableThinking) "0.5" else "0.1"}")
      if (!isExternalMode) append(",\"repetition_penalty\":${if (enableThinking) "1.5" else "1.1"}")
      append(",\"frequency_penalty\":${if (enableThinking) "1.0" else "0.5"}")
      append(",\"presence_penalty\":${if (enableThinking) "0.6" else "0.0"}")
      append(",\"stream\":true")
      // Thinking is handled via <think> pre-fill + filterThinkTags, not server-side enable_thinking
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
                // --- Repetition detection for visible answer text ---
                if (!repetitionDetected) {
                  answerAccum.append(cleanText)
                  if (answerAccum.length > 150) {
                    val text = answerAccum.toString()
                    val tail = text.takeLast(50)
                    val searchIn = text.substring(0, text.length - 50)
                    if (searchIn.contains(tail)) {
                      repetitionDetected = true
                      // Trim the repeated tail from the visible output
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
                // --- Repetition detection for reasoning ---
                // Use relaxed thresholds for reasoning: the model needs more room to
                // explore ideas before we declare it stuck in a loop.
                if (insideThinkBlock && !repetitionDetected) {
                  reasoningAccum.append(thinkText)
                  if (reasoningAccum.length > 400) {
                    val text = reasoningAccum.toString()
                    val tail = text.takeLast(80)
                    val searchIn = text.substring(0, text.length - 80)
                    if (searchIn.contains(tail)) {
                      repetitionDetected = true
                      insideThinkBlock = false
                      session.thinkingChunks.add("\n[Reasoning truncated — repetition detected]")
                      log(
                          LogLevel.INFO,
                          "Repetition detected (exact n-gram) in reasoning after ${reasoningAccum.length} chars")
                    }
                    if (!repetitionDetected && text.length > 600) {
                      val sentences = text.split(Regex("""[.!?\n]\s*""")).filter { it.length > 20 }
                      val starts = sentences.map { it.take(30).lowercase().trim() }
                      val mostCommon = starts.groupingBy { it }.eachCount().maxByOrNull { it.value }
                      if (mostCommon != null && mostCommon.value >= 4) {
                        repetitionDetected = true
                        insideThinkBlock = false
                        session.thinkingChunks.add(
                            "\n[Reasoning truncated — repetitive pattern detected]")
                        log(
                            LogLevel.INFO,
                            "Repetition detected (sentence pattern) in reasoning after ${reasoningAccum.length} chars")
                      }
                    }
                  }
                }
              }
            }
            // llama.cpp with enable_thinking sends reasoning in a separate field
            val reasoning = delta?.get("reasoning_content")?.asString
            if (reasoning != null && reasoning.isNotEmpty()) {
              session.thinkingChunks.add(reasoning)
              // Also check reasoning_content for repetition
              if (!repetitionDetected) {
                reasoningAccum.append(reasoning)
                if (reasoningAccum.length > 400) {
                  val text = reasoningAccum.toString()
                  val tail = text.takeLast(80)
                  val searchIn = text.substring(0, text.length - 80)
                  if (searchIn.contains(tail)) {
                    repetitionDetected = true
                    insideThinkBlock = false
                    session.thinkingChunks.add("\n[Reasoning truncated — repetition detected]")
                    log(
                        LogLevel.INFO,
                        "Repetition detected in reasoning_content after ${reasoningAccum.length} chars")
                  }
                  if (!repetitionDetected && text.length > 600) {
                    val sentences = text.split(Regex("""[.!?\n]\s*""")).filter { it.length > 20 }
                    val starts = sentences.map { it.take(30).lowercase().trim() }
                    val mostCommon = starts.groupingBy { it }.eachCount().maxByOrNull { it.value }
                    if (mostCommon != null && mostCommon.value >= 4) {
                      repetitionDetected = true
                      insideThinkBlock = false
                      session.thinkingChunks.add(
                          "\n[Reasoning truncated — repetitive pattern detected]")
                      log(
                          LogLevel.INFO,
                          "Repetition detected (sentence pattern) in reasoning_content after ${reasoningAccum.length} chars")
                    }
                  }
                }
              }
            }
          } catch (_: Exception) {
            /* skip malformed SSE chunk */
          }
        },
        { session.stopRequested || repetitionDetected },
        // Thinking mode needs longer timeout: reasoning tokens + answer vs just answer
        if (enableThinking) 600_000 else 300_000)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Strips `<think>…</think>` blocks from a complete response string. Used by the non-streaming
   * path.
   */
  private fun stripThinkTags(text: String): String {
    return text.replace(Regex("<think>[\\s\\S]*?</think>"), "").trim()
  }

  /**
   * Incrementally filters `<think>…</think>` blocks from streaming chunks. Handles partial tags
   * that span chunk boundaries via [tagBuffer].
   *
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
        // Look for </think>
        val closeIdx = combined.indexOf("</think>", i)
        if (closeIdx == -1) {
          // Accumulate thinking text
          val remaining = combined.substring(i)
          // Might end with a partial </think> tag
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
        // Look for <think>
        val openIdx = combined.indexOf("<think>", i)
        if (openIdx == -1) {
          // Check for partial <think> at end of chunk
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

  /** Escapes a string for safe inclusion in a hand-built JSON value. */
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

  /** Builds a JSON response with proper content type and encoding. */
  private fun jsonResponse(json: String): IPluginServletActionRetVal {
    val resp =
        ServletResponse(EResponseType.JSON).apply {
          value = json
          encoding = StandardCharsets.UTF_8.name()
        }
    return PluginServletActionRetVal(resp)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Version Check — periodic check for new llama.cpp releases
  // ═══════════════════════════════════════════════════════════════════════════

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

    // Restore last-notified release from disk so we don't re-notify after restart
    val markerFile = llamaEngineDir?.let { File(it, "last-notified-release.txt") }
    if (markerFile != null && markerFile.exists()) {
      lastNotifiedRelease = markerFile.readText().trim().takeIf { it.isNotEmpty() }
    }

    updateChecker =
        Thread(
                {
                  // Initial delay: 2 minutes after plugin startup
                  try {
                    Thread.sleep(2 * 60 * 1000L)
                  } catch (_: InterruptedException) {
                    return@Thread
                  }

                  while (!Thread.currentThread().isInterrupted) {
                    try {
                      checkForNewRelease()
                    } catch (e: Exception) {
                      log(LogLevel.WARNING, "Update check failed: ${e.message}")
                    }
                    try {
                      Thread.sleep(checkIntervalHours * 3600 * 1000L)
                    } catch (_: InterruptedException) {
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

    // Already notified for this version?
    if (latestTag == lastNotifiedRelease) {
      log(LogLevel.INFO, "Already notified about llama.cpp $latestTag (current: $llamaRelease)")
      return
    }

    // Verify that the new release actually has a binary for our platform
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
      // Persist to disk so we don't re-notify after restart
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

      // Extract "tag_name" from JSON without a full parser
      val match = Regex(""""tag_name"\s*:\s*"([^"]+)"""").find(body)
      return match?.groupValues?.get(1)
    } catch (e: Exception) {
      log(LogLevel.WARNING, "GitHub API request failed: ${e.message}")
      return null
    }
  }

  /**
   * Checks whether a given release has a downloadable archive for the specified platform by sending
   * an HTTP HEAD request to the expected download URL.
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
    } catch (_: Exception) {
      false
    }
  }

  /**
   * Sends an update notification email using the SMTP configuration from Formcycle's
   * `system-mail.properties`.
   *
   * @param newRelease The new release tag that is available.
   * @param platformKey The current platform identifier (e.g. `"windows_x86_64"`).
   * @return `true` if the email was sent successfully.
   */
  private fun sendUpdateNotification(newRelease: String, platformKey: String): Boolean {
    // Locate system-mail.properties by navigating up from the plugin folder
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
   */
  private fun findSystemMailProperties(): File? {
    var dir = pluginFolder ?: return null
    // Navigate up 3 levels: <uuid>/ → system/ → plugins/ → config/
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
   * @return `true` if the server accepted the message (250 response after DATA).
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

        /** Reads a (possibly multi-line) SMTP response and returns the last line. */
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

        // Read server greeting
        readResponse()

        // EHLO
        send("EHLO codbi-llama")

        // AUTH LOGIN if credentials are provided
        if (!user.isNullOrEmpty() && !password.isNullOrEmpty()) {
          send("AUTH LOGIN")
          send(java.util.Base64.getEncoder().encodeToString(user.toByteArray()))
          val authResp = send(java.util.Base64.getEncoder().encodeToString(password.toByteArray()))
          if (!authResp.startsWith("235")) {
            log(LogLevel.WARNING, "SMTP AUTH failed: $authResp")
            return false
          }
        }

        // Envelope
        send("MAIL FROM:<$from>")
        send("RCPT TO:<$to>")
        send("DATA")

        // Message headers + body (dot-stuffed)
        val now = ZonedDateTime.now().format(DateTimeFormatter.RFC_1123_DATE_TIME)
        writer.write("Date: $now\r\n")
        writer.write("From: CodBi AI <$from>\r\n")
        writer.write("To: $to\r\n")
        writer.write("Subject: $subject\r\n")
        writer.write("Content-Type: text/plain; charset=UTF-8\r\n")
        writer.write("X-Mailer: CodBi-LLAMA/1.0\r\n")
        writer.write("\r\n")
        // Dot-stuff lines that start with a period (RFC 5321 §4.5.2)
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

  // ═══════════════════════════════════════════════════════════════════════════
  //  Logging override
  // ═══════════════════════════════════════════════════════════════════════════

  override fun log(importance: LogLevel, toLog: String, adjenct: String, exception: Throwable?) {
    super.idLogMessages = "LlamaSrv"
    super.log(importance, toLog, adjenct, exception)
  }
}
