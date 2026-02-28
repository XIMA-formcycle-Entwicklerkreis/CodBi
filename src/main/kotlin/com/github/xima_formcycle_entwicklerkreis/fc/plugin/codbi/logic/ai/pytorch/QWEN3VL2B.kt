package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.pytorch

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.LlamaCpp
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.awt.geom.AffineTransform
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.lang.management.ManagementFactory
import java.nio.charset.StandardCharsets
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import javax.imageio.ImageIO

// ═══════════════════════════════════════════════════════════════════════════════
//  QWEN3VL2B — Qwen3-VL-2B-Instruct via local llama-server process
// ═══════════════════════════════════════════════════════════════════════════════
//
// Implements the "Swan Architecture" for Qwen3-VL-2B-Instruct:
//   1. Downloads llama-server binary (platform-specific)
//   2. Downloads Qwen3-VL-2B-Instruct GGUF model + vision projector
//   3. Launches llama-server as a separate OS process
//   4. Sends OpenAI-compatible /v1/chat/completions requests with base64 images
//
// All AI computation happens in the external llama-server process.
// If it OOMs the Tomcat JVM stays alive — only the llama-server dies.
// ═══════════════════════════════════════════════════════════════════════════════

class QWEN3VL2B : LlamaCpp() {

  companion object {
    /** Plugin property name prefix for this model. */
    private const val PROP_PREFIX = "AI_Qwen3Srv"

    /** Default GGUF model URL: Qwen3-VL-2B-Instruct Q4_K_M quantization (~1.1 GB). */
    private const val DEFAULT_MODEL_URL =
        "https://huggingface.co/Qwen/Qwen3-VL-2B-Instruct-GGUF/resolve/main/Qwen3VL-2B-Instruct-Q4_K_M.gguf"

    /** Default mmproj (multimodal vision projector) URL (~819 MB). */
    private const val DEFAULT_MMPROJ_URL =
        "https://huggingface.co/Qwen/Qwen3-VL-2B-Instruct-GGUF/resolve/main/mmproj-Qwen3VL-2B-Instruct-F16.gguf"

    /** Default llama-server release tag for download URLs. */
    private const val LLAMA_RELEASE = "b8175"

    /** GitHub release base URL for llama.cpp binaries. */
    private const val LLAMA_RELEASE_BASE =
        "https://github.com/ggml-org/llama.cpp/releases/download/$LLAMA_RELEASE"
  }

  // ── Server binary download URLs per platform ──────────────────────────────
  private val serverUrls: Map<String, String> =
      mapOf(
          "windows_x86_64" to "$LLAMA_RELEASE_BASE/llama-$LLAMA_RELEASE-bin-win-cpu-x64.zip",
          "linux_x86_64" to "$LLAMA_RELEASE_BASE/llama-$LLAMA_RELEASE-bin-ubuntu-x64.tar.gz",
          "macos_x86_64" to "$LLAMA_RELEASE_BASE/llama-$LLAMA_RELEASE-bin-macos-x64.tar.gz",
          "macos_aarch64" to "$LLAMA_RELEASE_BASE/llama-$LLAMA_RELEASE-bin-macos-arm64.tar.gz")

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

  private inner class ResourceMonitor : Thread("codbi-qwen3srv-resource-monitor") {
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

  override fun getName(): String = "CodBi_AI_Qwen3_Server"

  override fun initialize(configData: IPluginInitializeData) {
    idLogMessages = "Qwen3Srv"

    // Check activation: must contain "qwen3srv"
    val activeAiRaw = configData.properties.getProperty("Active_AI") ?: ""
    val activeAi = activeAiRaw.lowercase()
    if (!activeAi.contains("qwen3srv")) {
      log(LogLevel.INFO, "QWEN3VL2B initialization skipped because Active_AI='$activeAiRaw'")
      return
    }

    // Let base class set up directories and read LlamaCpp properties
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

    // Override server URLs if configured per-platform
    serverUrls.keys.forEach { platform ->
      configData.properties
          .getProperty("${PROP_PREFIX}_ServerUrl_$platform")
          ?.trim()
          ?.takeIf { it.isNotEmpty() }
          ?.let { customUrl ->
            // Mutable copy for dynamic URL override
            (serverUrls as? MutableMap)?.put(platform, customUrl)
          }
    }

    log(LogLevel.INFO, "Model URL:   $modelUrl")
    log(LogLevel.INFO, "mmproj URL:  $mmprojUrl")
    log(LogLevel.INFO, "MaxPixels:   $maxPixels")
    log(LogLevel.INFO, "MaxTokens:   $maxTokens")

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
                // Download server binary
                val serverArchiveUrl = serverUrls["${platform.os}_${platform.arch}"]
                if (serverArchiveUrl == null) {
                  loadError =
                      IllegalStateException(
                          "No llama-server binary available for ${platform.os}/${platform.arch}")
                  log(LogLevel.ERROR, loadError!!.message!!)
                  return@Thread
                }

                val archiveFileName = serverArchiveUrl.substringAfterLast("/")
                val archiveFile = File(binDir, archiveFileName)
                val archiveMarker = File(binDir, "$archiveFileName.complete")

                if (!archiveMarker.exists()) {
                  if (!downloadWithResume(serverArchiveUrl, archiveFile, "llama-server binary")) {
                    loadError = IllegalStateException("Failed to download llama-server binary")
                    return@Thread
                  }
                  // Extract the archive
                  val extractDir = File(binDir, "extracted")
                  if (archiveFileName.endsWith(".zip")) {
                    extractZip(archiveFile, extractDir)
                  } else {
                    extractTarGz(archiveFile, extractDir)
                  }
                }

                // Find the executable
                val extractDir = File(binDir, "extracted")
                val binary = findExecutable(extractDir, platform.exeName)
                if (binary == null) {
                  loadError =
                      IllegalStateException(
                          "Could not find ${platform.exeName} in extracted archive")
                  log(LogLevel.ERROR, loadError!!.message!!)
                  return@Thread
                }

                // Make executable on Unix
                if (platform.needsChmod) {
                  try {
                    ProcessBuilder("chmod", "+x", binary.absolutePath)
                        .redirectErrorStream(true)
                        .start()
                        .waitFor()
                    log(LogLevel.INFO, "chmod +x: ${binary.absolutePath}")
                  } catch (e: Exception) {
                    log(LogLevel.WARNING, "chmod failed: ${e.message}")
                  }
                }
                serverBinary = binary

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
                log(LogLevel.INFO, "QWEN3VL2B fully initialized and ready for requests")
              } catch (e: Exception) {
                loadError = e
                log(LogLevel.ERROR, "Initialization failed: ${e.message}", "", e)
              }
            },
            "qwen3srv-init")
        .apply { isDaemon = true }
        .start()
  }

  override fun shutdown(shutdownData: IPluginShutdownData?) {
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
      val jsonValue =
          if (err != null) {
            "{\"text\":\"${jsonEscape(text)}\",\"done\":true,\"error\":\"${jsonEscape(err)}\"$resStatusJson}"
          } else {
            "{\"text\":\"${jsonEscape(text)}\",\"done\":$done$resStatusJson}"
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
            "{\"error\":\"Qwen3-VL is not ready yet. Model may still be downloading or loading.\"}")
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

      Thread(
              {
                try {
                  val question = questions.values.first()
                  val imageParts =
                      if (images.isNotEmpty()) {
                        prepareImageParts(images, rotation)
                      } else emptyList()

                  val messages = buildMessages(question, imageParts, history)
                  streamChatCompletion(messages, session, enableThinking)
                } catch (ex: Exception) {
                  session.error = ex.message ?: "Unknown error"
                  log(LogLevel.ERROR, "Streaming error: ${ex.message}", "", ex)
                } finally {
                  session.done = true
                }
              },
              "qwen3srv-stream-$sessionId")
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
        val answer = chatCompletion(messages, enableThinking)
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
      append("{\"role\":\"system\",\"content\":\"You are a helpful document analysis assistant. ")
      append("Answer questions about the provided documents precisely and concisely. ")
      append("If you cannot determine the answer from the image, say so clearly.\"}")

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
  private fun chatCompletion(messagesJson: String, enableThinking: Boolean = false): String {
    val requestBody = buildString {
      append("{\"messages\":$messagesJson")
      append(",\"max_tokens\":$maxTokens")
      append(",\"temperature\":${if (enableThinking) "0.6" else "0.1"}")
      append(",\"enable_thinking\":$enableThinking")
      append(",\"stream\":false")
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
      enableThinking: Boolean = false
  ) {
    /** Tracks whether we are inside a `<think>…</think>` block so those tokens are suppressed. */
    var insideThinkBlock = false
    /** Buffer for detecting partial `<think>` or `</think>` tags at chunk boundaries. */
    val tagBuffer = StringBuilder()

    val requestBody = buildString {
      append("{\"messages\":$messagesJson")
      append(",\"max_tokens\":$maxTokens")
      append(",\"temperature\":${if (enableThinking) "0.6" else "0.1"}")
      append(",\"enable_thinking\":$enableThinking")
      append(",\"stream\":true")
      append("}")
    }

    httpPostStreaming(
        "/v1/chat/completions",
        requestBody,
        onLine = { data ->
          if (session.stopRequested) return@httpPostStreaming
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
        })
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
  //  Logging override
  // ═══════════════════════════════════════════════════════════════════════════

  override fun log(importance: LogLevel, toLog: String, adjenct: String, exception: Throwable?) {
    super.idLogMessages = "Qwen3Srv"
    super.log(importance, toLog, adjenct, exception)
  }
}
