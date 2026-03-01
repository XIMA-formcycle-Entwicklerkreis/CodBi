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
// `qwen3srv` to activate this model               |
// | `AI_Qwen3Srv_ModelUrl`             | URL     | Qwen3-VL-2B Q4_K_M HuggingFace  | Download URL
// for the GGUF model file                         |
// | `AI_Qwen3Srv_MmprojUrl`            | URL     | Qwen3-VL-2B mmproj HuggingFace  | Download URL
// for the vision projector (mmproj) file          |
// | `AI_Qwen3Srv_MaxPixels`            | Int     | `3211264`                        | Max pixel
// budget for image downscaling (min 3136)            |
// | `AI_Qwen3Srv_MaxTokens`            | Int     | `2048`                           | Maximum
// tokens to generate per response                      |
// | `AI_Qwen3Srv_MaxRAMPercent`        | Double  | `101.0`                          | RAM usage
// threshold (%) — blocks requests when exceeded      |
// | `AI_Qwen3Srv_MaxCPUPercent`        | Double  | `101.0`                          | CPU usage
// threshold (%) — blocks requests when exceeded      |
// | `AI_Qwen3Srv_LlamaRelease`         | String  | `b8175`                          | llama.cpp
// release tag for server binary download             |
// | `AI_Qwen3Srv_ServerUrl_<platform>` | URL     | (auto from release tag)          | Per-platform
// override for the llama-server binary URL        |
// | `AI_Qwen3Srv_UpdateCheckHours`     | Long    | `24`                             | Hours between
// GitHub release checks (0 = disabled)           |
// | `AI_Qwen3Srv_NotifyEmail`          | String  | —                                | Email address
// for update notifications                       |
// | `AI_BraveSearch_ApiKey`            | String  | —                                | Brave Search
// API key — enables web search tool for the model |
//
// ═══════════════════════════════════════════════════════════════════════════════

class Standard : LLAMA() {

  companion object {
    /** Plugin property name prefix for this model. */
    private const val PROP_PREFIX = "AI_Qwen3Srv"

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
  private class StreamingSession(val startTime: Long = System.currentTimeMillis()) {
    /** Accumulated generated text so far. */
    val textChunks = java.util.concurrent.CopyOnWriteArrayList<String>()
    @Volatile var done = false
    @Volatile var error: String? = null
    @Volatile var stopRequested = false
    @Volatile var resourceStatus: String? = null
    /** When true the client should show a "searching the web" animation. */
    @Volatile var searching = false

    fun currentText(): String = textChunks.joinToString("")
  }

  /** Active streaming sessions, keyed by UUID. Cleaned up on completion or after 5 min TTL. */
  private val streamingSessions = ConcurrentHashMap<String, StreamingSession>()

  /** Removes streaming sessions older than 5 minutes. */
  private fun cleanupStaleSessions() {
    val cutoff = System.currentTimeMillis() - 5 * 60 * 1000
    streamingSessions.entries.removeIf { it.value.startTime < cutoff }
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

    // Check activation: must contain "qwen3srv"
    val activeAiRaw = configData.properties.getProperty("Active_AI") ?: ""
    val activeAi = activeAiRaw.lowercase()
    if (!activeAi.contains("qwen3srv")) {
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

                // ── Phase 3: Ignition ──
                val started = startServer(binary, modelFile!!, mmprojFile)
                if (!started) {
                  loadError = IllegalStateException("llama-server failed to start")
                  return@Thread
                }

                isActive = true
                serverReady = true
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
    streamingSessions.clear()
    super.shutdown(shutdownData)
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
      if (done) streamingSessions.remove(pollId)

      val resStatusJson =
          if (resStatus != null) ",\"resourceStatus\":\"${jsonEscape(resStatus)}\"" else ""
      val searchingJson = if (session.searching) ",\"searching\":true" else ""
      val jsonValue =
          if (err != null) {
            "{\"text\":\"${jsonEscape(text)}\",\"done\":true,\"error\":\"${jsonEscape(err)}\"$resStatusJson$searchingJson}"
          } else {
            "{\"text\":\"${jsonEscape(text)}\",\"done\":$done$resStatusJson$searchingJson}"
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
          val decodedValue =
              try {
                String(headerValue.toByteArray(Charsets.ISO_8859_1), Charsets.UTF_8)
              } catch (_: Exception) {
                headerValue
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
    val enableThinking =
        params.headerMap.entries.any {
          it.key.equals("X-Thinking", ignoreCase = true) &&
              it.value.equals("true", ignoreCase = true)
        }
    log(LogLevel.INFO, "Thinking mode: $enableThinking")

    // ── Streaming path ────────────────────────────────────────────────────────
    val wantsStream =
        params.headerMap.entries.any {
          it.key.equals("X-Stream", ignoreCase = true) && it.value.equals("true", ignoreCase = true)
        }

    if (wantsStream) {
      cleanupStaleSessions()
      val sessionId = UUID.randomUUID().toString()
      val session = StreamingSession()
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

                  val messages = buildMessages(question, imageParts, history)

                  // Always stream directly to the user for immediate feedback
                  streamChatCompletion(messages, session, enableThinking, slot)
                  val fullText = session.currentText()

                  // After streaming completes, check if the model wants a web search
                  if (BraveSearch.isAvailable &&
                      BraveSearch.CALL_SEARCH_PATTERN.containsMatchIn(fullText)) {
                    // Signal the client to show a search animation
                    session.searching = true
                    // Strip the CALL:search text so it's not displayed
                    session.textChunks.clear()

                    handleSearchToolCallStreaming(
                        fullText, question, imageParts, history, session, enableThinking, slot)
                    session.searching = false
                  }
                } catch (ex: Exception) {
                  session.error = ex.message ?: "Unknown error"
                  log(LogLevel.ERROR, "Streaming error: ${ex.message}", "", ex)
                } finally {
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
        val messages = buildMessages(question, imageParts, chatHistory)
        var answer = chatCompletion(messages, enableThinking, slotId)

        // ── CALL:search tool loop ──────────────────────────────────────
        answer =
            handleSearchToolCall(answer, question, imageParts, chatHistory, enableThinking, slotId)

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
      // results
      val extendedHistory = chatHistory.toMutableList()
      extendedHistory.add("user" to originalQuestion)
      extendedHistory.add("assistant" to answer)
      extendedHistory.add("user" to searchContext)

      val messages =
          buildMessages(
              "Use the search results to give a direct answer. Summarize the facts. Never say you cannot answer. Add [Source](URL) links.",
              imageParts,
              extendedHistory)
      answer = chatCompletion(messages, enableThinking, slotId)
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

    // Clear the CALL:search text from the stream and replace with new completion
    session.textChunks.clear()

    val extendedHistory = chatHistory.toMutableList()
    extendedHistory.add("user" to originalQuestion)
    extendedHistory.add("assistant" to fullText)
    extendedHistory.add("user" to searchContext)

    val messages =
        buildMessages(
            "Use the search results to give a direct answer. Summarize the facts. Never say you cannot answer. Add [Source](URL) links.",
            imageParts,
            extendedHistory)
    streamChatCompletion(messages, session, enableThinking, slotId)
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
      chatHistory: List<Pair<String, String>>
  ): String {
    return buildString {
      append("[")

      // System prompt
      append(
          "{\"role\":\"system\",\"content\":\"You are a helpful assistant. Answer precisely and concisely. ")
      if (BraveSearch.isAvailable) {
        append(
            "If you need current info from the internet, reply ONLY with CALL:search(query='your actual question'). ")
        append(
            "Example: User asks 'weather tomorrow in Berlin' you reply CALL:search(query='weather forecast Berlin tomorrow'). ")
        append("Replace the query with the real search terms, never use '...' as the query.")
      }
      append("\"}")

      // Chat history
      for ((role, content) in chatHistory) {
        append(",{\"role\":\"${jsonEscape(role)}\",\"content\":\"${jsonEscape(content)}\"}")
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

      append("]")
    }
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
    val requestBody = buildString {
      append("{\"messages\":$messagesJson")
      append(",\"max_tokens\":$maxTokens")
      append(",\"temperature\":${if (enableThinking) "0.6" else "0.1"}")
      append(",\"repetition_penalty\":1.1")
      append(",\"frequency_penalty\":0.5")
      append(",\"enable_thinking\":$enableThinking")
      append(",\"stream\":false")
      if (idSlot >= 0) append(",\"id_slot\":$idSlot")
      append("}")
    }

    val response = httpPost("/v1/chat/completions", requestBody)

    // Parse the response to extract generated text
    return try {
      val json = com.google.gson.JsonParser.parseString(response).asJsonObject
      val raw =
          json
              .getAsJsonArray("choices")
              ?.get(0)
              ?.asJsonObject
              ?.getAsJsonObject("message")
              ?.get("content")
              ?.asString ?: response
      stripThinkTags(raw)
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
    /** Tracks whether we are inside a `<think>…</think>` block so those tokens are suppressed. */
    var insideThinkBlock = false
    /** Buffer for detecting partial `<think>` or `</think>` tags at chunk boundaries. */
    val tagBuffer = StringBuilder()

    val requestBody = buildString {
      append("{\"messages\":$messagesJson")
      append(",\"max_tokens\":$maxTokens")
      append(",\"temperature\":${if (enableThinking) "0.6" else "0.1"}")
      append(",\"repetition_penalty\":1.1")
      append(",\"frequency_penalty\":0.5")
      append(",\"enable_thinking\":$enableThinking")
      append(",\"stream\":true")
      if (idSlot >= 0) append(",\"id_slot\":$idSlot")
      append("}")
    }

    httpPostStreaming(
        "/v1/chat/completions",
        requestBody,
        onLine = { data ->
          try {
            val json = com.google.gson.JsonParser.parseString(data).asJsonObject
            val delta =
                json.getAsJsonArray("choices")?.get(0)?.asJsonObject?.getAsJsonObject("delta")
            val content = delta?.get("content")?.asString
            if (content != null) {
              // Strip <think>…</think> blocks from streaming output
              val filtered = filterThinkTags(content, tagBuffer, insideThinkBlock)
              insideThinkBlock = filtered.second
              val cleanText = filtered.first
              if (cleanText.isNotEmpty()) {
                session.textChunks.add(cleanText)
              }
            }
          } catch (_: Exception) {
            /* skip malformed SSE chunk */
          }
        },
        shouldStop = { session.stopRequested })
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
   * @return Pair of (filtered text to emit, updated insideThinkBlock flag).
   */
  private fun filterThinkTags(
      chunk: String,
      tagBuffer: StringBuilder,
      insideThinkBlock: Boolean
  ): Pair<String, Boolean> {
    var inside = insideThinkBlock
    val output = StringBuilder()
    var i = 0
    val combined = tagBuffer.toString() + chunk
    tagBuffer.clear()

    while (i < combined.length) {
      if (inside) {
        // Look for </think>
        val closeIdx = combined.indexOf("</think>", i)
        if (closeIdx == -1) {
          // Might end with a partial </think> tag
          val possiblePartial = combined.length - i
          if (possiblePartial < 8 && combined.substring(i).let { "</think>".startsWith(it) }) {
            tagBuffer.append(combined.substring(i))
          }
          break
        }
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
    return Pair(output.toString(), inside)
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
    val markerFile = llamaCppDir?.let { File(it, "last-notified-release.txt") }
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
      llamaCppDir?.let { File(it, "last-notified-release.txt").writeText(latestTag) }
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
