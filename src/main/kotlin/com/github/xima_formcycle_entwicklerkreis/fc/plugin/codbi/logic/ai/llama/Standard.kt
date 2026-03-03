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
            ctxSize.toString(),
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
      val jsonValue =
          if (err != null) {
            "{\"text\":\"${jsonEscape(visibleText)}\",\"done\":true,\"error\":\"${jsonEscape(err)}\"$resStatusJson$searchingJson$searchQueryJson$thinkingJson$modelTypeJson}"
          } else {
            "{\"text\":\"${jsonEscape(visibleText)}\",\"done\":$done$resStatusJson$searchingJson$searchQueryJson$thinkingJson$modelTypeJson}"
          }
      return jsonResponse(jsonValue)
    }
    // ── End stream-poll shortcut ──────────────────────────────────────────────

    log(LogLevel.INFO, "Processing VQA request (llama-server on port $serverPort)")

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
    if (!serverReady || !isServerAlive()) {
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
                try {
                  val question = questions.values.first()
                  val imageParts =
                      if (images.isNotEmpty()) {
                        prepareImageParts(images, rotation)
                      } else emptyList()

                  val messages =
                      buildMessages(question, imageParts, history, searchEnabled, enableThinking)
                  if (enableThinking)
                      log(LogLevel.INFO, "Messages JSON (first 400): ${messages.take(400)}")

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
                    session.searchQuery = BraveSearch.sanitizeQuery(rawQuery)
                    // Signal the client to show a search animation
                    session.searching = true
                    // Strip the CALL:search text so it's not displayed
                    session.textChunks.clear()

                    handleSearchToolCallStreaming(
                        fullText, question, imageParts, history, session, enableThinking, slot)
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
                    val question = questions.values.first()
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
                            question, emptyList(), history, searchEnabled, enableThinking = false)
                    streamChatCompletion(fallbackMessages, session, false, slot)
                    val fallbackText = session.currentText()

                    // If the fast model emitted CALL:search, handle it
                    if (searchEnabled &&
                        BraveSearch.isAvailable &&
                        BraveSearch.CALL_SEARCH_PATTERN.containsMatchIn(fallbackText)) {
                      val rawQuery =
                          BraveSearch.CALL_SEARCH_PATTERN.find(fallbackText)?.groupValues?.get(1)
                              ?: ""
                      session.searchQuery = BraveSearch.sanitizeQuery(rawQuery)
                      session.searching = true
                      session.textChunks.clear()
                      handleSearchToolCallStreaming(
                          fallbackText, question, emptyList(), history, session, false, slot)
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
        val messages =
            buildMessages(question, imageParts, chatHistory, searchEnabled, enableThinking)
        var answer = chatCompletion(messages, enableThinking, slotId)

        // ── CALL:search tool loop ──────────────────────────────────────
        if (searchEnabled) {
          answer =
              handleSearchToolCall(
                  answer, question, imageParts, chatHistory, enableThinking, slotId)
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
      slotId: Int
  ): String {
    if (!BraveSearch.isAvailable) return initialAnswer

    var answer = initialAnswer
    for (round in 1..maxSearchRoundTrips) {
      val match = BraveSearch.CALL_SEARCH_PATTERN.find(answer) ?: break
      val query = match.groupValues[1]
      log(LogLevel.INFO, "Model requested web search (round $round): '$query'")

      val results = BraveSearch.search(query)
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

      val followUpQuestion = searchFollowUpPrompt(originalQuestion)
      // Don't pre-fill thinking for the follow-up — the answer must be visible text
      val messages =
          buildMessages(followUpQuestion, imageParts, extendedHistory, enableThinking = false)
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
      slotId: Int
  ) {
    if (!BraveSearch.isAvailable) return

    val match = BraveSearch.CALL_SEARCH_PATTERN.find(fullText) ?: return
    val query = match.groupValues[1]
    log(LogLevel.INFO, "Streaming: Model raw output: '${fullText.take(200)}'")
    log(LogLevel.INFO, "Streaming: Model requested web search: '$query'")

    val results = BraveSearch.search(query)
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
    session.thinkingChunks.add("\uD83D\uDD0D Searching the web for: \"$query\"\n\n")
    for ((index, result) in results.withIndex()) {
      session.thinkingChunks.add(
          "[${index + 1}] ${result.title}\n    ${result.url}\n    ${result.description.take(150)}\n\n")
    }
    session.thinkingChunks.add("Analyzing ${results.size} results to formulate an answer.")

    val extendedHistory = chatHistory.toMutableList()
    extendedHistory.add("user" to originalQuestion)
    // Only pass the CALL:search command as assistant context, NOT the entire (possibly repetitive)
    // thinking text.
    // The full thinking text can be thousands of chars and would overflow the fast model's context.
    val assistantContext = match.value
    extendedHistory.add("assistant" to assistantContext)
    extendedHistory.add("user" to searchContext)

    val followUpQuestion = searchFollowUpPrompt(originalQuestion)
    // Don't pre-fill thinking for the follow-up — the answer must be visible text
    val messages =
        buildMessages(followUpQuestion, imageParts, extendedHistory, enableThinking = false)
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
      enableThinking: Boolean = false
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
      if (searchEnabled && BraveSearch.isAvailable) {
        append(
            "When you need current info, reply ONLY with CALL:search(query='your search query'). ")
        append(
            "The search query MUST be about the user's ACTUAL topic. Extract the core subject from the user's question. ")
        append(
            "SANITIZE: remove person names, serial numbers, IDs, and any code mixing letters+digits. Keep brand names and topic keywords. ")
        append(
            "Example: user asks about a product error → CALL:search(query='[product] [error] fix'). ")
        append(
            "Example: user asks about contract law → CALL:search(query='[topic] contract termination'). ")
        append("Example: user asks about weather → CALL:search(query='weather forecast [city]'). ")
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
          append(
              "Only AFTER you have finished thinking and closed </think>, output CALL:search as your visible answer if needed. ")
          append("NEVER put CALL:search inside <think> tags. Think first, then decide. ")
        }
      }
      append(
          "CRITICAL RULE: You MUST respond in the SAME language the user uses. If the user writes in German, you MUST think AND answer in German. If in English, think and answer in English. Match the user's language exactly — this applies to ALL output including your reasoning/thinking.")
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

      // User message with optional images
      // Detect the user's language and inject an immediate reminder right before their message.
      // Models attend most to the tokens closest to generation, so this is far more effective
      // than a system prompt instruction alone.
      val langHint = detectLanguageHint(question)
      if (langHint != null) {
        append(",{\"role\":\"system\",\"content\":\"${jsonEscape(langHint)}\"}")
      }
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
        val thinkSeed = detectThinkingSeed(question)
        append(",{\"role\":\"assistant\",\"content\":\"<think>\\n$thinkSeed\"}")
      }

      append("]")
    }
  }

  /**
   * Detects the user's language from their question and returns a short instruction telling the
   * model to reason and answer in that language. Returns null if the language appears to be English
   * (the model's default).
   */
  private fun detectLanguageHint(question: String): String? {
    // Pad with spaces so first/last words match markers like " ist "
    val lower = " ${question.lowercase()} "
    // German indicators: common words, umlauts, ß
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
      return "WICHTIG: Der Benutzer schreibt auf Deutsch. Du MUSST auf Deutsch denken UND antworten. Alle Überlegungen (reasoning/thinking) und die finale Antwort MÜSSEN auf Deutsch sein."
    }
    // Italian indicators — checked BEFORE French/Spanish since they share markers like "una",
    // "per", "con"
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
      return "IMPORTANTE: L'utente scrive in italiano. DEVI pensare E rispondere in italiano. Tutti i ragionamenti (reasoning/thinking) e la risposta finale DEVONO essere in italiano."
    }
    // French indicators
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
            "é",
            "è",
            "ê",
            "ç")
    if (frenchMarkers.count { lower.contains(it) } >= 2) {
      return "IMPORTANT : L'utilisateur écrit en français. Tu DOIS penser ET répondre en français."
    }
    // Spanish indicators
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
      return "IMPORTANTE: El usuario escribe en español. DEBES pensar Y responder en español."
    }
    return null // English or unknown — no extra hint needed
  }

  /**
   * Returns a short opening phrase in the user's language to seed the `<think>` block. By
   * pre-filling the start of reasoning in the target language, the model continues reasoning in
   * that language instead of defaulting to English.
   */
  private fun detectThinkingSeed(question: String): String {
    // Pad with spaces so first/last words match markers like " ist "
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
            " über ")
    val germanHits = germanMarkers.count { lower.contains(it) }
    if (germanHits >= 2 ||
        (germanHits >= 1 && listOf("ä", "ö", "ü", "ß").any { lower.contains(it) })) {
      return "SPRACHE: Deutsch. Denke auf Deutsch. Antworte auf Deutsch. Kurz denken, NICHT wiederholen."
    }
    val frenchMarkers =
        listOf(" est ", " les ", " des ", " une ", " dans ", " pour ", " avec ", "é", "è", "ç")
    if (frenchMarkers.count { lower.contains(it) } >= 2) {
      return "LANGUE: Français. Réfléchis en français. Réponds en français. Sois bref, NE te répète PAS."
    }
    val spanishMarkers = listOf(" es ", " los ", " las ", " una ", " para ", " con ", "ñ", "¿")
    if (spanishMarkers.count { lower.contains(it) } >= 2) {
      return "IDIOMA: Español. Piensa en español. Responde en español. Sé breve, NO repitas."
    }
    val italianMarkers =
        listOf(
            " è ",
            " il ",
            " la ",
            " le ",
            " gli ",
            " dei ",
            " della ",
            " per ",
            " con ",
            " che ",
            " come ",
            " sono ",
            " non ")
    if (italianMarkers.count { lower.contains(it) } >= 2) {
      return "LINGUA: Italiano. Pensa in italiano. Rispondi in italiano. Sii breve, NON ripetere."
    }
    return "Think briefly. Do NOT repeat yourself." // English
  }

  /** Returns a follow-up prompt for answering from search results in the user's language. */
  private fun searchFollowUpPrompt(originalQuestion: String): String {
    val lower = " ${originalQuestion.lowercase()} "
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
            " über ")
    val germanHits = germanMarkers.count { lower.contains(it) }
    if (germanHits >= 2 ||
        (germanHits >= 1 && listOf("ä", "ö", "ü", "ß").any { lower.contains(it) })) {
      return "Gib eine kurze, direkte Antwort auf Deutsch in 2-4 Sätzen basierend auf den Suchergebnissen. Füge Links wie [Norton](https://norton.com) oder [Dell](https://dell.com) hinzu. Wiederhole dich nicht. Antworte AUF DEUTSCH."
    }
    val italianMarkers =
        listOf(
            " è ",
            " il ",
            " la ",
            " le ",
            " gli ",
            " dei ",
            " della ",
            " per ",
            " con ",
            " che ",
            " come ",
            " sono ",
            " non ")
    if (italianMarkers.count { lower.contains(it) } >= 2) {
      return "Dai una risposta breve e diretta in italiano in 2-4 frasi usando i risultati di ricerca. Aggiungi link come [Norton](https://norton.com) o [Dell](https://dell.com). Non ripetere. Rispondi IN ITALIANO."
    }
    val frenchMarkers =
        listOf(" est ", " les ", " des ", " une ", " dans ", " pour ", " avec ", "é", "è", "ç")
    if (frenchMarkers.count { lower.contains(it) } >= 2) {
      return "Donne une réponse courte et directe en français en 2-4 phrases en utilisant les résultats de recherche. Ajoute des liens comme [Norton](https://norton.com) ou [Dell](https://dell.com). Ne te répète pas. Réponds EN FRANÇAIS."
    }
    val spanishMarkers = listOf(" es ", " los ", " las ", " una ", " para ", " con ", "ñ", "¿")
    if (spanishMarkers.count { lower.contains(it) } >= 2) {
      return "Da una respuesta corta y directa en español en 2-4 oraciones usando los resultados de búsqueda. Agrega enlaces como [Norton](https://norton.com) o [Dell](https://dell.com). No te repitas. Responde EN ESPAÑOL."
    }
    return "Give a short, direct answer in 2-4 sentences using the search results. Add links like [Norton](https://norton.com) or [Dell](https://dell.com). Do not repeat yourself."
  }

  /**
   * Sends a synchronous chat completion request to the local llama-server.
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
    val useThinkingServer = enableThinking && thinkingServerReady
    val targetPort = if (useThinkingServer) thinkingServerPort else serverPort

    val requestBody = buildString {
      append("{\"messages\":$messagesJson")
      // Thinking mode needs a larger token budget: reasoning tokens + answer
      val effectiveMaxTokens =
          if (enableThinking) (maxTokens * 2).coerceAtLeast(3072) else maxTokens
      append(",\"max_tokens\":$effectiveMaxTokens")
      append(",\"temperature\":${if (enableThinking) "0.5" else "0.1"}")
      append(",\"repetition_penalty\":${if (enableThinking) "1.5" else "1.1"}")
      append(",\"frequency_penalty\":${if (enableThinking) "1.0" else "0.5"}")
      append(",\"presence_penalty\":${if (enableThinking) "0.6" else "0.0"}")
      append(",\"stream\":false")
      // Thinking is handled via <think> pre-fill + filterThinkTags, not server-side enable_thinking
      if (idSlot >= 0) append(",\"id_slot\":$idSlot")
      append("}")
    }

    if (useThinkingServer) {
      log(LogLevel.INFO, "Routing to thinking server on port $thinkingServerPort")
    }

    // Thinking mode needs longer timeout: reasoning tokens + answer vs just answer
    val timeoutMs = if (enableThinking) 600_000 else 300_000
    val response =
        httpPost("/v1/chat/completions", requestBody, timeoutMs = timeoutMs, port = targetPort)

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
    val useThinkingServer = enableThinking && thinkingServerReady
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

    val requestBody = buildString {
      append("{\"messages\":$messagesJson")
      // Thinking mode needs a larger token budget: reasoning tokens + answer
      val effectiveMaxTokens =
          if (enableThinking) (maxTokens * 2).coerceAtLeast(3072) else maxTokens
      append(",\"max_tokens\":$effectiveMaxTokens")
      append(",\"temperature\":${if (enableThinking) "0.5" else "0.1"}")
      append(",\"repetition_penalty\":${if (enableThinking) "1.5" else "1.1"}")
      append(",\"frequency_penalty\":${if (enableThinking) "1.0" else "0.5"}")
      append(",\"presence_penalty\":${if (enableThinking) "0.6" else "0.0"}")
      append(",\"stream\":true")
      // Thinking is handled via <think> pre-fill + filterThinkTags, not server-side enable_thinking
      if (idSlot >= 0) append(",\"id_slot\":$idSlot")
      append("}")
    }

    if (useThinkingServer) {
      log(LogLevel.INFO, "Routing stream to thinking server on port $thinkingServerPort")
    }

    httpPostStreaming(
        "/v1/chat/completions",
        requestBody,
        onLine = { data ->
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
        shouldStop = { session.stopRequested || repetitionDetected },
        // Thinking mode needs longer timeout: reasoning tokens + answer vs just answer
        timeoutMs = if (enableThinking) 600_000 else 300_000,
        port = targetPort)
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
