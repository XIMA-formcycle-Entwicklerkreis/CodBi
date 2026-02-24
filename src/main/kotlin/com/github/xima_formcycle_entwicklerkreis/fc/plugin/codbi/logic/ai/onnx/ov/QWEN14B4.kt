package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.onnx.ov

import ai.djl.huggingface.tokenizers.HuggingFaceTokenizer
import ai.djl.inference.Predictor
import ai.djl.modality.cv.Image as DjlImage
import ai.djl.modality.cv.ImageFactory
import ai.djl.ndarray.NDList
import ai.djl.ndarray.NDManager
import ai.djl.ndarray.types.DataType
import ai.djl.repository.zoo.Criteria
import ai.djl.repository.zoo.ZooModel
import ai.djl.translate.Translator
import ai.djl.translate.TranslatorContext
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.onnx.TokenizersHelper
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.openvino.onnx.OpenVINO
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.awt.geom.AffineTransform
import java.awt.image.AffineTransformOp
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.File
import java.lang.management.ManagementFactory
import java.net.URI
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.LinkedBlockingQueue
import javax.imageio.ImageIO
import net.sourceforge.tess4j.TessAPI1

/** Translator logic for Qwen2.5-VL. Handles dynamic gridding and KV-cached decoding. */
class QwenVLTranslator(
    private val tokenizer: HuggingFaceTokenizer,
    private val log: (importance: AI.LogLevel, toLog: String, exception: Throwable?) -> Unit,
    /**
     * Upper pixel budget for the smart-resize step. Images with more total pixels than this are
     * downscaled proportionally before patch extraction. Lower values = faster inference but less
     * fine-grained detail.
     *
     * Reference: HF preprocessor_config.json default is 12845056 (~3586×3586). Recommended: 3211264
     * (~1792×1792 → ≈4096 vision tokens at merge_size=2).
     */
    private val maxPixels: Int = 3211264
) : Translator<Pair<DjlImage, String>, NDList> {

  // Exact values from preprocessor_config.json of onnx-community/Qwen2-VL-2B-Instruct
  private val mean = floatArrayOf(0.48145466f, 0.4578275f, 0.40821073f)
  private val std = floatArrayOf(0.26862954f, 0.26130258f, 0.27577711f)

  override fun prepare(ctx: TranslatorContext) {
    // Ignored. We are using the globally loaded tokenizer.
  }

  override fun processInput(ctx: TranslatorContext, input: Pair<DjlImage, String>): NDList {
    val manager = ctx.ndManager
    val image = input.first
    val question = input.second

    // --- Qwen2-VL vision config constants ---
    val patchSize = 14L
    val temporalPatchSize = 2L
    val mergeSize = 2L
    val factor = (patchSize * mergeSize).toInt() // 28 – matches HF preprocessor
    val minPixels = 3136 // from preprocessor_config.json
    // maxPixels is now a constructor parameter (default 3211264 ≈ 1792×1792)

    // 1. Smart resize (match HF Qwen2VLImageProcessor.smart_resize)
    var newH = (Math.round(image.height.toDouble() / factor) * factor).toInt().coerceAtLeast(factor)
    var newW = (Math.round(image.width.toDouble() / factor) * factor).toInt().coerceAtLeast(factor)
    if (newH.toLong() * newW.toLong() > maxPixels) {
      val beta = Math.sqrt(image.height.toDouble() * image.width.toDouble() / maxPixels)
      newH = (Math.floor(image.height / beta / factor) * factor).toInt().coerceAtLeast(factor)
      newW = (Math.floor(image.width / beta / factor) * factor).toInt().coerceAtLeast(factor)
    } else if (newH.toLong() * newW.toLong() < minPixels) {
      val beta =
          Math.sqrt(minPixels.toDouble() / (image.height.toDouble() * image.width.toDouble()))
      newH = (Math.ceil(image.height * beta / factor) * factor).toInt().coerceAtLeast(factor)
      newW = (Math.ceil(image.width * beta / factor) * factor).toInt().coerceAtLeast(factor)
    }
    val resized = image.resize(newW, newH, true)

    // 2. Normalize: HWC->CHW, rescale 1/255, ImageNet normalize
    var array = resized.toNDArray(manager).transpose(2, 0, 1).toType(DataType.FLOAT32, false)
    val meanND = manager.create(mean).reshape(3, 1, 1)
    val stdND = manager.create(std).reshape(3, 1, 1)
    array = array.div(255f).sub(meanND).div(stdND)
    // array shape: [3, newH, newW]

    val h = newH.toLong()
    val w = newW.toLong()
    val c = 3L
    val gridH = h / patchSize // full spatial grid height
    val gridW = w / patchSize // full spatial grid width
    val gridT = 1L // single image
    val mergedGridH = gridH / mergeSize
    val mergedGridW = gridW / mergeSize

    // 3. Temporal duplication: single frame → 2 identical frames for temporal_patch_size=2
    //    [3, H, W] → [1, 3, H, W] → concat → [2, 3, H, W]
    val frame = array.reshape(1L, c, h, w)
    val temporal = frame.concat(frame, 0) // [2, 3, H, W] = [temporalPatchSize, C, H, W]

    // 4. Reshape & transpose to match HF Qwen2VLImageProcessor merge pattern.
    //    This produces pixel_values in the exact order the ONNX vision encoder expects.
    //    Source:  (gridT, temporalPatch, C, mergedGridH, merge, patchH, mergedGridW, merge, patchW)
    //    Target:  (gridT, mergedGridH, mergedGridW, merge_h, merge_w, C, temporal, patchH, patchW)
    //    Perm:    (0, 3, 6, 4, 7, 2, 1, 5, 8)
    val reshaped =
        temporal.reshape(
            gridT,
            temporalPatchSize,
            c,
            mergedGridH,
            mergeSize,
            patchSize,
            mergedGridW,
            mergeSize,
            patchSize)
    val transposed = reshaped.transpose(0, 3, 6, 4, 7, 2, 1, 5, 8)

    val numMergedPatches = gridT * mergedGridH * mergedGridW
    val dimPerPatch = c * temporalPatchSize * mergeSize * mergeSize * patchSize * patchSize // 4704
    val pixelValues =
        transposed.reshape(numMergedPatches, dimPerPatch).toType(DataType.FLOAT32, false)

    // 5. grid_thw: [1, 3] with (gridT, gridH, gridW) – full grid, NOT merged
    val thwData = longArrayOf(gridT, gridH, gridW)
    val imageGridThw = manager.create(thwData).toType(DataType.INT64, false).reshape(1, 3)

    log(
        AI.LogLevel.INFO,
        "Preprocessed image: ${image.width}x${image.height} → ${newW}x${newH}, gridH=$gridH gridW=$gridW, mergedPatches=$numMergedPatches, pixelValues=${pixelValues.shape}, dimPerPatch=$dimPerPatch",
        null)
    val question2 =
        """
    Analysiere das Bild genau. Es handelt sich um eine Zahlungsverfahrensauswahl von PayBL. 
    Extrahiere die folgenden Daten als JSON:
    {
      "behoerde": "Welche Behörde wird genannt?",
      "verwendungszweck": "Wie lautet der Verwendungszweck?",
      "betrag": "Wie hoch ist der Betrag?",
      "name": "Auf welchen Namen läuft der Vorgang?"
    }
    Antworte NUR im JSON-Format.
"""
            .trimIndent()
    // 5. Tokenisierung (Explicit splitting to guarantee <|image_pad|> token ID 151655 is present)
    val prePrompt =
        "<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n<|im_start|>user\n<|vision_start|>"
    val postPrompt = "<|vision_end|>\n$question<|im_end|>\n<|im_start|>assistant\n"

    val preIds = tokenizer.encode(prePrompt).ids
    val postIds = tokenizer.encode(postPrompt).ids

    // Safely inject the image_pad token ID (151655) exactly where it belongs
    val combinedIds = LongArray(preIds.size + 1 + postIds.size)
    System.arraycopy(preIds, 0, combinedIds, 0, preIds.size)
    combinedIds[preIds.size] = 151655L
    System.arraycopy(postIds, 0, combinedIds, preIds.size + 1, postIds.size)

    log(
        AI.LogLevel.INFO,
        "Tokenized prompt dynamically. Total sequence length: ${combinedIds.size}",
        null)

    val inputIdsND = manager.create(combinedIds).reshape(1, combinedIds.size.toLong())

    return NDList().apply {
      add(pixelValues.apply { name = "pixel_values" })
      add(imageGridThw.apply { name = "grid_thw" })
      add(inputIdsND.apply { name = "input_ids" })
    }
  }

  override fun processOutput(ctx: TranslatorContext, list: NDList): NDList = list
}

class QWEN2B164CPU : OpenVINO() {
  /**
   * Rotates a BufferedImage by the specified degrees (90, 180, or 270).
   *
   * @param img The image to rotate.
   * @param degrees The rotation angle in degrees (90, 180, or 270).
   * @return The rotated image.
   */
  private fun rotateImage(img: BufferedImage, degrees: Int): BufferedImage {
    val width = img.width
    val height = img.height
    val at = AffineTransform()
    val (resultWidth, resultHeight) =
        when (degrees) {
          90 -> {
            at.translate(height.toDouble(), 0.0)
            at.rotate(Math.PI / 2)
            Pair(height, width)
          }
          180 -> {
            at.translate(width.toDouble(), height.toDouble())
            at.rotate(Math.PI)
            Pair(width, height)
          }
          270 -> {
            at.translate(0.0, width.toDouble())
            at.rotate(-Math.PI / 2)
            Pair(height, width)
          }
          else -> return img
        }
    val result = BufferedImage(resultWidth, resultHeight, img.type)
    val op = AffineTransformOp(at, AffineTransformOp.TYPE_BILINEAR)
    return op.filter(img, result)
  }

  /**
   * Downscales image bytes if the total pixel count exceeds [maxPixels]. This is the authoritative
   * server-side gate — even if the frontend skips downscaling (bug, bypass, or non-browser client),
   * the backend enforces the budget.
   *
   * @param imageBytes Raw image bytes (any format ImageIO can read).
   * @return Downscaled PNG bytes if the image exceeded the budget, or the original bytes unchanged.
   */
  private fun downscaleIfNeeded(imageBytes: ByteArray): ByteArray {
    try {
      val img = ImageIO.read(ByteArrayInputStream(imageBytes)) ?: return imageBytes
      val totalPixels = img.width.toLong() * img.height.toLong()
      if (totalPixels <= maxPixels) return imageBytes

      val scale = Math.sqrt(maxPixels.toDouble() / totalPixels)
      val newW = (img.width * scale).toInt().coerceAtLeast(28) // 28 = patchSize * mergeSize
      val newH = (img.height * scale).toInt().coerceAtLeast(28)

      log(
          AI.LogLevel.INFO,
          "Backend downscaling: ${img.width}\u00d7${img.height} (${totalPixels}px) \u2192 ${newW}\u00d7${newH} (maxPixels=$maxPixels)",
          " / QWEN",
          null)

      val scaled = BufferedImage(newW, newH, BufferedImage.TYPE_INT_RGB)
      val g2d = scaled.createGraphics()
      g2d.setRenderingHint(
          java.awt.RenderingHints.KEY_INTERPOLATION,
          java.awt.RenderingHints.VALUE_INTERPOLATION_BILINEAR)
      g2d.drawImage(img, 0, 0, newW, newH, null)
      g2d.dispose()

      val baos = java.io.ByteArrayOutputStream()
      ImageIO.write(scaled, "PNG", baos)
      return baos.toByteArray()
    } catch (e: Exception) {
      log(
          AI.LogLevel.WARNING,
          "Backend downscale failed, using original: ${e.message}",
          " / QWEN",
          null)
      return imageBytes
    }
  }

  // ── Resource monitoring ──────────────────────────────────────────────────
  /**
   * Maximum allowed system RAM usage (0–100%). Inference is paused/rejected when exceeded.
   * Configurable via plugin property **AI_ONNX_QWEN_MaxRAMPercent**. Default: 85.
   */
  private var maxRAMPercent = 85.0
  /**
   * Maximum allowed system CPU usage (0–100%). Inference is paused/rejected when exceeded.
   * Configurable via plugin property **AI_ONNX_QWEN_MaxCPUPercent**. Default: 90.
   */
  private var maxCPUPercent = 90.0
  /** Background thread that samples CPU/RAM every second and exposes latest readings. */
  private var resourceMonitor: ResourceMonitor? = null
  // ── End resource monitoring ──────────────────────────────────────────────

  @Volatile private var loadError: Throwable? = null
  @Volatile private var openVinoEPAvailable = false
  /**
   * Vision encoder variant: "quantized" (QDQ INT8, fast) or "fp16" (full precision, higher
   * quality).
   */
  private var visionEncoderMode = "quantized"
  /** Describes which Vision Encoder variant is loaded (for logging). */
  private var activeVisionLabel = "not loaded"
  /**
   * Maximum number of vision-encoder results kept in the LRU cache before the oldest is evicted.
   */
  private val MAX_VISION_CACHE_ENTRIES = 10
  private var tokenizersNativeRunDir: File? = null
  private var maxTokens = Int.MAX_VALUE
  /**
   * Upper pixel budget for the vision encoder's smart-resize step. Configurable via plugin property
   * **AI_ONNX_QWEN_MaxPixels**. Default: 3211264 (≈1792×1792 → ~4096 vision tokens). HF default
   * would be 12845056.
   */
  private var maxPixels = 3211264
  private var keepNewest = 3
  private var qwenActive = false
  private var ocrActive = false
  private val osdPool = LinkedBlockingQueue<net.sourceforge.tess4j.ITessAPI.TessBaseAPI>()
  private var isOsdPoolInitialized = false

  private var visionEncoder: ZooModel<NDList, NDList>? = null
  private var decoderModel: ZooModel<NDList, NDList>? = null
  private var embedModel: ZooModel<NDList, NDList>? = null
  private var tokenizer: HuggingFaceTokenizer? = null

  @Volatile private var modelsReady = false
  private var donutModelDir: File? = null
  private var pluginFolder: File? = null
  /**
   * Cache: file-content SHA-256 → VisionResult. Avoids re-encoding the same image on every chat
   * message. LRU-bounded: when `MAX_VISION_CACHE_ENTRIES` is exceeded the oldest entry is evicted
   * and its native NDArray memory is freed. Access-ordered LinkedHashMap ensures LRU behaviour.
   */
  private val visionCacheLock = Any()
  private val visionCache =
      object : LinkedHashMap<String, VisionResult>(16, 0.75f, true) {
        override fun removeEldestEntry(
            eldest: MutableMap.MutableEntry<String, VisionResult>
        ): Boolean {
          return size > MAX_VISION_CACHE_ENTRIES
        }
      }
  private var modelBaseUrl =
      "https://huggingface.co/onnx-community/Qwen2-VL-2B-Instruct/resolve/main"

  // ── Token Streaming Infrastructure ──────────────────────────────────────────
  /**
   * Holds the state of an in-flight streaming decode. The background thread appends token IDs;
   * polling requests read them.
   */
  private class StreamingSession(
      val tokenizer: HuggingFaceTokenizer,
      val startTime: Long = System.currentTimeMillis()
  ) {
    val generatedIds = CopyOnWriteArrayList<Long>()
    @Volatile var done = false
    @Volatile var error: String? = null
    @Volatile var stopRequested = false
    /**
     * Resource status notification for the frontend overlay (e.g. "paused", "resumed", "timeout").
     * Cleared after each poll read.
     */
    @Volatile var resourceStatus: String? = null

    /** Decodes all tokens accumulated so far into a UTF-8 string. */
    fun currentText(): String {
      if (generatedIds.isEmpty()) return ""
      return try {
        tokenizer.decode(generatedIds.toLongArray()).trim()
      } catch (_: Exception) {
        generatedIds.joinToString(" ")
      }
    }
  }

  /** Active streaming sessions, keyed by UUID. Cleaned up on completion or after 5 min TTL. */
  private val streamingSessions = ConcurrentHashMap<String, StreamingSession>()

  // ── ResourceMonitor inner class ────────────────────────────────────────────
  /**
   * Lightweight daemon thread that samples system CPU load and RAM usage every second. Provides
   * [cpuPercent] and [ramPercent] as volatile fields for lock-free reads. Also exposes
   * [awaitResources] which blocks the calling thread until both metrics drop below the configured
   * thresholds (or the given timeout expires).
   */
  private inner class ResourceMonitor : Thread("codbi-resource-monitor") {
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
            val cpu = it.cpuLoad * 100.0 // JDK 14+; fallback = getSystemCpuLoad()
            cpuPercent = if (cpu >= 0) cpu else 0.0
            val totalMem = it.totalMemorySize
            val freeMem = it.freeMemorySize
            ramPercent =
                if (totalMem > 0) (totalMem - freeMem).toDouble() / totalMem * 100.0 else 0.0
          }
          sleep(1000)
        } catch (_: InterruptedException) {
          break
        } catch (_: Exception) {
          /* keep sampling */
        }
      }
    }

    /** @return `true` if both CPU and RAM are below their configured thresholds right now. */
    fun resourcesAvailable(): Boolean = cpuPercent < maxCPUPercent && ramPercent < maxRAMPercent

    /**
     * Returns a human-readable reason string if resources are currently exceeded, or `null` if OK.
     */
    fun exceedReason(): String? {
      val parts = mutableListOf<String>()
      if (cpuPercent >= maxCPUPercent)
          parts.add("CPU %.1f%% >= %.0f%%".format(cpuPercent, maxCPUPercent))
      if (ramPercent >= maxRAMPercent)
          parts.add("RAM %.1f%% >= %.0f%%".format(ramPercent, maxRAMPercent))
      return if (parts.isEmpty()) null else parts.joinToString(", ")
    }

    /**
     * Blocks until resources drop below thresholds or [maxWaitMs] elapses.
     *
     * @return estimated remaining wait in ms (0 = resources OK, -1 = timed out)
     */
    fun awaitResources(maxWaitMs: Long = 60_000L): Long {
      val t0 = System.currentTimeMillis()
      while (!resourcesAvailable()) {
        val elapsed = System.currentTimeMillis() - t0
        if (elapsed >= maxWaitMs) return -1
        try {
          sleep(500)
        } catch (_: InterruptedException) {
          return -1
        }
      }
      return 0
    }

    /**
     * Estimates how many seconds until resources may become available, based on recent readings.
     * Simple heuristic: 1 second per 5% overshoot per exceeded metric.
     */
    fun estimateWaitSeconds(): Int {
      var estimate = 0.0
      if (cpuPercent >= maxCPUPercent) estimate += (cpuPercent - maxCPUPercent) / 5.0
      if (ramPercent >= maxRAMPercent) estimate += (ramPercent - maxRAMPercent) / 5.0
      return estimate.toInt().coerceAtLeast(2)
    }

    fun shutdown() {
      running = false
      interrupt()
    }
  }

  // ── End ResourceMonitor inner class ────────────────────────────────────────

  /** Evicts sessions older than 5 minutes (safety net for abandoned polls). */
  private fun cleanupStaleSessions() {
    val now = System.currentTimeMillis()
    streamingSessions.entries.removeIf { now - it.value.startTime > 5 * 60 * 1000 }
  }

  // ── End Token Streaming Infrastructure ──────────────────────────────────────

  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    // ── Stream-poll shortcut ──────────────────────────────────────────────────
    val pollId =
        params.headerMap.entries.find { it.key.equals("X-Stream-Poll", ignoreCase = true) }?.value
    if (pollId != null) {
      cleanupStaleSessions()
      // Check for stop request piggybacked onto a poll
      val wantsStop =
          params.headerMap.entries.any {
            it.key.equals("X-Stream-Stop", ignoreCase = true) &&
                it.value.equals("true", ignoreCase = true)
          }
      val session = streamingSessions[pollId]
      if (session != null && wantsStop) {
        session.stopRequested = true
        log(AI.LogLevel.INFO, "Stop requested for stream $pollId", " / QWEN / STREAM", null)
      }
      if (session == null) {
        val resp =
            ServletResponse(EResponseType.JSON).apply {
              value = "{\"error\":\"Unknown or expired stream session.\"}"
              encoding = java.nio.charset.StandardCharsets.UTF_8.name()
            }
        return PluginServletActionRetVal(resp)
      }
      val text = session.currentText()
      val done = session.done
      val err = session.error
      // Read and clear the resource status (consumed once per poll)
      val resStatus = session.resourceStatus
      session.resourceStatus = null
      if (done) streamingSessions.remove(pollId)
      fun jsonEscapePoll(s: String): String = buildString {
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
      val resStatusJson =
          if (resStatus != null) ",\"resourceStatus\":\"${jsonEscapePoll(resStatus)}\"" else ""
      val jsonValue =
          if (err != null) {
            "{\"text\":\"${jsonEscapePoll(text)}\",\"done\":true,\"error\":\"${jsonEscapePoll(err)}\"$resStatusJson}"
          } else {
            "{\"text\":\"${jsonEscapePoll(text)}\",\"done\":$done$resStatusJson}"
          }
      val resp =
          ServletResponse(EResponseType.JSON).apply {
            value = jsonValue
            encoding = java.nio.charset.StandardCharsets.UTF_8.name()
          }
      return PluginServletActionRetVal(resp)
    }
    // ── End stream-poll shortcut ──────────────────────────────────────────────

    log(
        AI.LogLevel.INFO,
        "Processing VQA request received (Vision: $activeVisionLabel)",
        " / QWEN",
        null)

    // ── Resource gate: reject if system is overloaded ─────────────────────────
    resourceMonitor?.let { monitor ->
      val reason = monitor.exceedReason()
      if (reason != null) {
        val waitSec = monitor.estimateWaitSeconds()
        log(
            AI.LogLevel.WARNING,
            "Resource gate BLOCKED: $reason — estimated wait ${waitSec}s",
            " / QWEN",
            null)
        val resp =
            ServletResponse(EResponseType.JSON).apply {
              value =
                  "{\"error\":\"Server resources exceeded ($reason). Please retry in ~${waitSec} seconds.\",\"retryAfter\":$waitSec}"
              encoding = java.nio.charset.StandardCharsets.UTF_8.name()
            }
        return PluginServletActionRetVal(resp)
      }
      log(
          AI.LogLevel.INFO,
          "Resource gate OK: CPU=%.1f%% (max %.0f%%), RAM=%.1f%% (max %.0f%%)"
              .format(monitor.cpuPercent, maxCPUPercent, monitor.ramPercent, maxRAMPercent),
          " / QWEN",
          null)
    }
    // ── End resource gate ─────────────────────────────────────────────────────

    if (loadError != null) {
      val resp =
          ServletResponse(EResponseType.JSON).apply {
            value = "{\"error\":\"Failed to load model: ${loadError?.message}\"}"
            encoding = java.nio.charset.StandardCharsets.UTF_8.name()
          }
      return PluginServletActionRetVal(resp)
    }
    if (!modelsReady || visionEncoder == null || decoderModel == null || tokenizer == null) {
      val resp =
          ServletResponse(EResponseType.JSON).apply {
            value = "{\"error\":\"Qwen-VL is not initialized.\"}"
            encoding = java.nio.charset.StandardCharsets.UTF_8.name()
          }
      return PluginServletActionRetVal(resp)
    }

    // 1. Parse questions from headers
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
      val resp =
          ServletResponse(EResponseType.JSON).apply {
            value = "{\"error\":\"No questions asked.\"}"
            encoding = java.nio.charset.StandardCharsets.UTF_8.name()
          }
      return PluginServletActionRetVal(resp)
    }

    // ── Parse chat history for multi-turn context ─────────────────────────────
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
        log(AI.LogLevel.WARNING, "Failed to parse chat history: ${e.message}", " / QWEN", null)
        emptyList()
      }
    }
    if (chatHistory.isNotEmpty()) {
      log(AI.LogLevel.INFO, "Chat history: ${chatHistory.size} turns", " / QWEN", null)
    }
    // ── End parse chat history ─────────────────────────────────────────────────

    // ── Streaming start: background decode + immediate return ─────────────────
    val wantsStream =
        params.headerMap.entries.any {
          it.key.equals("X-Stream", ignoreCase = true) && it.value.equals("true", ignoreCase = true)
        }
    if (wantsStream) {
      cleanupStaleSessions()
      val tok =
          tokenizer
              ?: return PluginServletActionRetVal(
                  ServletResponse(EResponseType.JSON).apply {
                    value = "{\"error\":\"Tokenizer not loaded.\"}"
                    encoding = java.nio.charset.StandardCharsets.UTF_8.name()
                  })
      val sessionId = UUID.randomUUID().toString()
      val session = StreamingSession(tok)
      streamingSessions[sessionId] = session

      // Eagerly read file bytes BEFORE returning (servlet may reclaim resources).
      // Cache uploadFiles locally — the getter may re-parse the multipart body each call.
      val uploadedFiles = params.uploadFiles
      log(
          AI.LogLevel.INFO,
          "Streaming: uploadFiles count = ${uploadedFiles?.size ?: 0}",
          " / QWEN / STREAM",
          null)
      val fileDataMap = mutableMapOf<String, ByteArray>()
      uploadedFiles?.forEach { (inputName, fileDataList) ->
        for (fd in fileDataList) {
          val bytes = fd.data ?: byteArrayOf()
          log(
              AI.LogLevel.INFO,
              "Streaming file '$inputName' [${fd.name}]: getData=${bytes.size} bytes, getSize=${fd.size}, contentType=${fd.contentType}",
              " / QWEN / STREAM",
              null)
          if (bytes.isNotEmpty()) {
            fileDataMap[inputName] = bytes
          }
        }
      }
      // Fallback: decode images sent as base64 data-URL text parameters
      // (bypasses formcycle's multipart parser which returns 0-byte FileData).
      params.requestParameters?.forEach { (key, values) ->
        if (key.startsWith("codbi-base64:")) {
          val imageName = key.removePrefix("codbi-base64:")
          val dataUrl = values.firstOrNull() ?: return@forEach
          val base64 = dataUrl.substringAfter(",")
          try {
            val bytes = java.util.Base64.getDecoder().decode(base64)
            if (bytes.isNotEmpty()) {
              fileDataMap[imageName] = bytes
              log(
                  AI.LogLevel.INFO,
                  "Base64 param image '$imageName': ${bytes.size} bytes",
                  " / QWEN / STREAM",
                  null)
            }
          } catch (e: Exception) {
            log(
                AI.LogLevel.WARNING,
                "Failed to decode base64 for '$imageName': ${e.message}",
                " / QWEN / STREAM",
                null)
          }
        }
      }
      log(
          AI.LogLevel.INFO,
          "Streaming: fileDataMap entries = ${fileDataMap.size}, path = ${if (fileDataMap.isNotEmpty()) "IMAGE" else "TEXT-ONLY"}",
          " / QWEN / STREAM",
          null)
      val manualRotation =
          params.headerMap.entries
              .find { it.key.equals("X-Rotate", ignoreCase = true) }
              ?.value
              ?.trim()
              ?.toIntOrNull()
      val questions = questionsToAsk.toMap()

      Thread {
            try {
              if (fileDataMap.isNotEmpty()) {
                // --- Image path (streaming) ---
                val (inputName, combinedBytes) = fileDataMap.entries.first()
                val rotatedBytes =
                    try {
                      if (manualRotation != null && manualRotation != 0) {
                        val buf = ImageIO.read(ByteArrayInputStream(combinedBytes))
                        if (buf != null) {
                          val rot =
                              when (manualRotation) {
                                90,
                                180,
                                270 -> rotateImage(buf, manualRotation)
                                else -> buf
                              }
                          val baos = java.io.ByteArrayOutputStream()
                          ImageIO.write(rot, "PNG", baos)
                          baos.toByteArray()
                        } else combinedBytes
                      } else combinedBytes
                    } catch (_: Exception) {
                      combinedBytes
                    }

                // Server-side downscale gate: enforce maxPixels even if client skipped it
                val finalBytes = downscaleIfNeeded(rotatedBytes)

                finalBytes.inputStream().use { inputStream ->
                  val djlImg = ImageFactory.getInstance().fromInputStream(inputStream)
                  val ortEngine = ai.djl.engine.Engine.getEngine("OnnxRuntime")
                  (ortEngine as ai.djl.engine.Engine).newBaseManager().use { manager: NDManager ->
                    val visionPred =
                        acquirePredictor<NDList, NDList>("qwen-encoder")
                            ?: throw IllegalStateException(
                                "No predictor available for qwen-encoder")
                    val decoderPred =
                        acquirePredictor<NDList, NDList>("qwen-decoder")
                            ?: throw IllegalStateException(
                                "No predictor available for qwen-decoder")
                    try {
                      val contentHash =
                          java.security.MessageDigest.getInstance("SHA-256")
                              .digest(finalBytes)
                              .joinToString("") { "%02x".format(it) }
                      val cached = synchronized(visionCacheLock) { visionCache[contentHash] }
                      val visionResult =
                          if (cached != null) {
                            cached
                          } else {
                            val r = encodeVision(manager, visionPred, djlImg)
                            synchronized(visionCacheLock) { visionCache[contentHash] = r }
                            r
                          }
                      val question = questions.values.first()
                      runQwenDecode(
                          manager,
                          decoderPred,
                          question,
                          visionResult,
                          onToken = { tokenId -> session.generatedIds.add(tokenId) },
                          shouldStop = { session.stopRequested },
                          chatHistory = chatHistory,
                          resourceNotify = { status -> session.resourceStatus = status })
                    } finally {
                      releasePredictor("qwen-encoder", visionPred)
                      releasePredictor("qwen-decoder", decoderPred)
                    }
                  }
                }
              } else {
                // --- Text-only path (streaming) ---
                val ortEngine = ai.djl.engine.Engine.getEngine("OnnxRuntime")
                (ortEngine as ai.djl.engine.Engine).newBaseManager().use { manager: NDManager ->
                  val decoderPred =
                      acquirePredictor<NDList, NDList>("qwen-decoder")
                          ?: throw IllegalStateException("No predictor available for qwen-decoder")
                  try {
                    val question = questions.values.first()
                    runQwenDecodeTextOnly(
                        manager,
                        decoderPred,
                        question,
                        onToken = { tokenId -> session.generatedIds.add(tokenId) },
                        shouldStop = { session.stopRequested },
                        chatHistory = chatHistory,
                        resourceNotify = { status -> session.resourceStatus = status })
                  } finally {
                    releasePredictor("qwen-decoder", decoderPred)
                  }
                }
              }
            } catch (ex: Exception) {
              session.error = ex.message ?: "Unknown error"
              log(
                  AI.LogLevel.ERROR,
                  "Streaming decode error: ${ex.message}",
                  " / QWEN / STREAM",
                  ex)
            } finally {
              session.done = true
            }
          }
          .apply {
            isDaemon = true
            name = "qwen-stream-$sessionId"
          }
          .start()

      log(AI.LogLevel.INFO, "Streaming session started: $sessionId", " / QWEN / STREAM", null)
      val resp =
          ServletResponse(EResponseType.JSON).apply {
            value = "{\"streamId\":\"$sessionId\"}"
            encoding = java.nio.charset.StandardCharsets.UTF_8.name()
          }
      return PluginServletActionRetVal(resp)
    }
    // ── End streaming start ───────────────────────────────────────────────────

    val finalResults = mutableMapOf<String, Map<String, String>>()
    try {
      val tokenizer =
          tokenizer
              ?: return PluginServletActionRetVal(
                  ServletResponse(EResponseType.JSON).apply {
                    value = "{\"error\":\"Tokenizer not loaded.\"}"
                    encoding = java.nio.charset.StandardCharsets.UTF_8.name()
                  })

      val uploadedFilesSync = params.uploadFiles
      // Build file data map from both uploadFiles and base64 request parameters
      val fileDataMapSync = mutableMapOf<String, ByteArray>()
      uploadedFilesSync?.forEach { (inputName, fileDataList) ->
        val combinedBytes =
            fileDataList.fold(byteArrayOf()) { acc, fd -> acc + (fd.data ?: byteArrayOf()) }
        if (combinedBytes.isNotEmpty()) {
          fileDataMapSync[inputName] = combinedBytes
        }
      }
      // Fallback: decode images sent as base64 data-URL text parameters
      params.requestParameters?.forEach { (key, values) ->
        if (key.startsWith("codbi-base64:")) {
          val imageName = key.removePrefix("codbi-base64:")
          val dataUrl = values.firstOrNull() ?: return@forEach
          val base64 = dataUrl.substringAfter(",")
          try {
            val bytes = java.util.Base64.getDecoder().decode(base64)
            if (bytes.isNotEmpty()) {
              fileDataMapSync[imageName] = bytes
              log(
                  AI.LogLevel.INFO,
                  "Base64 param image '$imageName': ${bytes.size} bytes",
                  " / QWEN",
                  null)
            }
          } catch (e: Exception) {
            log(
                AI.LogLevel.WARNING,
                "Failed to decode base64 for '$imageName': ${e.message}",
                " / QWEN",
                null)
          }
        }
      }
      val hasFiles = fileDataMapSync.isNotEmpty()
      log(
          AI.LogLevel.INFO,
          "Non-streaming: hasFiles = $hasFiles (uploadFiles size = ${uploadedFilesSync?.size ?: 0}, fileDataMap = ${fileDataMapSync.size})",
          " / QWEN",
          null)

      if (hasFiles) {
        // --- Image-based VQA path ---
        fileDataMapSync.forEach { (inputName, combinedBytes) ->

          // Orientation correction (manual X-Rotate or OSD)
          val rotatedBytes =
              try {
                val manualRotation =
                    params.headerMap.entries
                        .find { it.key.equals("X-Rotate", ignoreCase = true) }
                        ?.value
                        ?.trim()
                        ?.toIntOrNull()
                if (manualRotation != null && manualRotation != 0) {
                  val bufferedImg = ImageIO.read(ByteArrayInputStream(combinedBytes))
                  if (bufferedImg != null) {
                    val rotatedImg =
                        when (manualRotation) {
                          90,
                          180,
                          270 -> rotateImage(bufferedImg, manualRotation)
                          else -> bufferedImg
                        }
                    val baos = java.io.ByteArrayOutputStream()
                    ImageIO.write(rotatedImg, "PNG", baos)
                    baos.toByteArray()
                  } else combinedBytes
                } else if (ocrActive) {
                  val bufferedImg = ImageIO.read(ByteArrayInputStream(combinedBytes))
                  if (bufferedImg != null) {
                    val tessDataDir = File(pluginFolder, "Resources/AI/Tesseract/Models")
                    if (tessDataDir.exists()) {
                      val detectedAngle = 0 // OSD logic placeholder
                      if (detectedAngle != 0) {
                        val rotatedImg = rotateImage(bufferedImg, detectedAngle)
                        val baos = java.io.ByteArrayOutputStream()
                        ImageIO.write(rotatedImg, "PNG", baos)
                        baos.toByteArray()
                      } else combinedBytes
                    } else combinedBytes
                  } else combinedBytes
                } else combinedBytes
              } catch (_: Exception) {
                combinedBytes
              }

          // Server-side downscale gate: enforce maxPixels even if client skipped it
          val finalBytes = downscaleIfNeeded(rotatedBytes)

          finalBytes.inputStream().use { inputStream ->
            val djlImg = ImageFactory.getInstance().fromInputStream(inputStream)
            val results = mutableMapOf<String, String>()
            val ortEngine = ai.djl.engine.Engine.getEngine("OnnxRuntime")
            (ortEngine as ai.djl.engine.Engine).newBaseManager().use { manager: NDManager ->
              val visionPredictor =
                  acquirePredictor<NDList, NDList>("qwen-encoder")
                      ?: throw IllegalStateException("No predictor available for qwen-encoder")
              val decoderPredictor =
                  acquirePredictor<NDList, NDList>("qwen-decoder")
                      ?: throw IllegalStateException("No predictor available for qwen-decoder")
              try {
                // Vision caching: hash file bytes to avoid re-encoding unchanged images.
                val contentHash =
                    java.security.MessageDigest.getInstance("SHA-256")
                        .digest(finalBytes)
                        .joinToString("") { "%02x".format(it) }
                val cached = synchronized(visionCacheLock) { visionCache[contentHash] }
                val visionResult =
                    if (cached != null) {
                      log(
                          AI.LogLevel.INFO,
                          "Vision cache HIT — reusing ($contentHash)",
                          " / QWEN / PERF",
                          null)
                      cached
                    } else {
                      log(
                          AI.LogLevel.INFO,
                          "Vision cache MISS — encoding image ($contentHash)",
                          " / QWEN / PERF",
                          null)
                      val result = encodeVision(manager, visionPredictor, djlImg)
                      synchronized(visionCacheLock) { visionCache[contentHash] = result }
                      result
                    }

                // Batch ALL questions into a single decode pass.
                // This avoids redundant ~10s prefill per additional question.
                val batchedResults =
                    runQwenDecodeMulti(manager, decoderPredictor, questionsToAsk, visionResult)
                results.putAll(batchedResults)
              } finally {
                releasePredictor("qwen-encoder", visionPredictor)
                releasePredictor("qwen-decoder", decoderPredictor)
              }
            }
            finalResults[inputName] = results.toMap()
          }
        }
      } else {
        // --- Text-only chat path (no files uploaded) ---
        log(AI.LogLevel.INFO, "Text-only chat request (no files)", " / QWEN", null)
        val results = mutableMapOf<String, String>()
        val ortEngine = ai.djl.engine.Engine.getEngine("OnnxRuntime")
        (ortEngine as ai.djl.engine.Engine).newBaseManager().use { manager: NDManager ->
          val decoderPredictor =
              acquirePredictor<NDList, NDList>("qwen-decoder")
                  ?: throw IllegalStateException("No predictor available for qwen-decoder")
          try {
            questionsToAsk.forEach { (key, question) ->
              try {
                results[key] =
                    runQwenDecodeTextOnly(
                        manager, decoderPredictor, question, chatHistory = chatHistory)
              } catch (ex: Exception) {
                results[key] = "Error: ${ex.message}"
                log(
                    AI.LogLevel.ERROR,
                    "Error processing text-only '$question': ${ex.message}",
                    "",
                    ex)
              }
            }
          } finally {
            releasePredictor("qwen-decoder", decoderPredictor)
          }
        }
        finalResults["text"] = results.toMap()
      }
      // Build JSON response (all non-ASCII escaped as \uXXXX for charset safety)
      fun jsonEscape(s: String): String = buildString {
        for (c in s) {
          when {
            c == '\\' -> append("\\\\")
            c == '"' -> append("\\\"")
            c == '\n' -> append("\\n")
            c == '\r' -> append("\\r")
            c == '\t' -> append("\\t")
            c.code < 0x20 -> append("\\u%04x".format(c.code)) // other control chars
            c.code > 0x7E -> append("\\u%04x".format(c.code)) // non-ASCII → \uXXXX
            else -> append(c)
          }
        }
      }
      val jsonResponse = buildString {
        append("{")
        finalResults.entries.forEachIndexed { fileIdx, (fileName, fileResults) ->
          if (fileIdx > 0) append(",")
          append("\"").append(jsonEscape(fileName)).append("\":{")
          fileResults.entries.forEachIndexed { idx, (key, value) ->
            if (idx > 0) append(",")
            append("\"").append(jsonEscape(key)).append("\": \"")
            append(jsonEscape(value))
            append("\"")
          }
          append("}")
        }
        append("}")
      }
      log(
          AI.LogLevel.INFO,
          "VQA processing completed. Returning response: $jsonResponse",
          " / OpenVINO / QWEN 14B 16-4",
          null)
      val resp =
          ServletResponse(EResponseType.JSON).apply {
            value = jsonResponse
            encoding = java.nio.charset.StandardCharsets.UTF_8.name()
          }
      return PluginServletActionRetVal(resp)
    } catch (ex: Exception) {
      log(
          AI.LogLevel.ERROR,
          "Error processing VQA request: ${ex.message}",
          " / OpenVINO / QWEN 14B 16-4",
          ex)
      val resp =
          ServletResponse(EResponseType.JSON).apply {
            value = "{\"error\":\"Processing error: ${ex.message}\"}"
            encoding = java.nio.charset.StandardCharsets.UTF_8.name()
          }
      return PluginServletActionRetVal(resp)
    }
  }

  override fun getName(): String = "CodBi_AI_Qwen_vQA"

  private fun ensureTokenizersNativeLibraries(): Boolean {
    val pluginRoot =
        pluginFolder
            ?: run {
              log(
                  AI.LogLevel.ERROR,
                  "Tokenizers natives: pluginFolder not initialized yet",
                  " / QWEN",
                  null)
              return false
            }
    val runDir = TokenizersHelper.ensureTokenizersNativeLibraries(pluginRoot, this::log, 3)
    if (runDir == null) {
      log(
          AI.LogLevel.ERROR,
          "Failed to set up tokenizers native libraries via TokenizersHelper",
          " / QWEN",
          null)
      return false
    }
    val currentLibraryPath = System.getProperty("java.library.path") ?: ""
    val newLibraryPath =
        if (currentLibraryPath.isEmpty()) runDir.absolutePath
        else "$currentLibraryPath${File.pathSeparator}${runDir.absolutePath}"
    System.setProperty("java.library.path", newLibraryPath)
    val os = (System.getProperty("os.name") ?: "").lowercase()
    val libFile =
        when {
          os.contains("windows") -> File(runDir, "tokenizers.dll")
          os.contains("linux") -> File(runDir, "libtokenizers.so")
          os.contains("mac") -> File(runDir, "libtokenizers.dylib")
          else -> File(runDir, "tokenizers.dll")
        }
    System.setProperty("RUST_LIBRARY_PATH", libFile.absolutePath)
    tokenizersNativeRunDir = runDir
    log(AI.LogLevel.INFO, "Set RUST_LIBRARY_PATH to: ${libFile.absolutePath}", " / QWEN", null)
    log(
        AI.LogLevel.INFO,
        "Tokenizers native libraries ready in: ${runDir.absolutePath}",
        " / QWEN",
        null)
    return true
  }

  override fun initialize(configData: IPluginInitializeData) {
    val activeAiRaw = configData.properties.getProperty("Active_AI") ?: ""
    val activeAi = activeAiRaw.lowercase()
    if (!activeAi.contains("qwen2q4")) {
      log(
          AI.LogLevel.INFO,
          "QWEN14B4CPU initialization skipped because Active_AI='$activeAiRaw'",
          " / QWEN",
          null)
      qwenActive = false
      return
    }

    this.pluginFolder = configData.fileHelper.pluginFolder
    val baseModelDir = File(configData.fileHelper.pluginFolder, "ai/onnx/models")
    this.donutModelDir = File(baseModelDir, "qwen-vl")
    this.donutModelDir?.mkdirs()

    ensureTokenizersNativeLibraries()
    super.initialize(configData)

    qwenActive = true

    // The Maven onnxruntime.dll is replaced with the OpenVINO-enabled build in
    // ONNX.initialize() (before the engine singleton is loaded into the JVM).
    // Read the result from the parent class field.
    openVinoEPAvailable = openVinoOrtReplaced
    // Plugin property to select vision encoder variant.
    // Values: "quantized" (default, QDQ INT8, ~3.7s, 669 MB) or "fp16" (full precision, ~10s, 1.33
    // GB).
    visionEncoderMode =
        configData.properties.getProperty("AI_ONNX_VisionEncoder")?.trim()?.lowercase()?.let {
          if (it == "fp16" || it == "fp16" || it == "full") "fp16" else "quantized"
        } ?: "quantized"
    // Read configurable maxPixels (image pixel budget for vision encoder)
    configData.properties.getProperty("AI_ONNX_QWEN_MaxPixels")?.trim()?.toIntOrNull()?.let {
      if (it >= 3136) {
        maxPixels = it
        log(AI.LogLevel.INFO, "MaxPixels set to $it from config", " / QWEN", null)
      }
    }
    // Read resource-monitoring thresholds
    configData.properties.getProperty("AI_ONNX_QWEN_MaxRAMPercent")?.trim()?.toDoubleOrNull()?.let {
      if (it in 1.0..100.0) {
        maxRAMPercent = it
      }
    }
    configData.properties.getProperty("AI_ONNX_QWEN_MaxCPUPercent")?.trim()?.toDoubleOrNull()?.let {
      if (it in 1.0..100.0) {
        maxCPUPercent = it
      }
    }
    log(
        AI.LogLevel.INFO,
        "Resource thresholds: MaxRAM=${maxRAMPercent}%, MaxCPU=${maxCPUPercent}%",
        " / QWEN",
        null)
    // Start resource monitor daemon thread
    resourceMonitor?.shutdown()
    resourceMonitor = ResourceMonitor().also { it.start() }
    log(
        AI.LogLevel.INFO,
        "OpenVINO EP available: $openVinoEPAvailable, Vision encoder mode: $visionEncoderMode",
        " / QWEN",
        null)
    if (openVinoEPAvailable) {
      log(
          AI.LogLevel.INFO,
          "OpenVINO EP is available — models will use OpenVINO acceleration",
          " / QWEN",
          null)
    } else {
      log(
          AI.LogLevel.INFO,
          "OpenVINO EP not available — models will use CPU-only ORT",
          " / QWEN",
          null)
    }

    if (onnxIsReady()) {
      try {
        ensureModelFiles()
        loadModels()
        this.modelsReady = true
      } catch (e: Exception) {
        this.loadError = e
        log(AI.LogLevel.ERROR, "Fehler beim Laden der Qwen-Modelle", " / QWEN", e)
      }
    }
  }

  private fun loadModels() {
    val safeModelDir =
        donutModelDir
            ?: throw IllegalStateException(
                "Modellverzeichnis (donutModelDir) ist nicht initialisiert.")
    val modelPath = safeModelDir.toPath()
    val oldClassLoader = Thread.currentThread().contextClassLoader

    try {
      Thread.currentThread().contextClassLoader = this.javaClass.classLoader

      log(AI.LogLevel.INFO, "Initialisiere Qwen-Infrastruktur...", " / QWEN", null)

      try {
        ai.djl.engine.Engine.getEngine("OnnxRuntime")
        log(AI.LogLevel.INFO, "ONNX Runtime Engine ist bereit.", " / QWEN", null)
      } catch (e: Exception) {
        log(AI.LogLevel.INFO, "Registriere ONNX Engine manuell...", " / QWEN", null)
        ai.djl.engine.Engine.registerEngine(ai.djl.onnxruntime.engine.OrtEngineProvider())
      }

      // Create a pass-through translator used for all three models
      val passThroughTranslator =
          object : Translator<NDList, NDList> {
            override fun processInput(ctx: TranslatorContext, input: NDList) = input

            override fun processOutput(ctx: TranslatorContext, list: NDList) = list

            override fun getBatchifier() = null
          }

      // Use physical core count (not logical) to avoid Hyper-Threading contention
      // on P-cores. On hybrid Intel CPUs (12th/13th gen), HT threads share AVX2
      // execution units, which HURTS compute-bound ViT/MatMul workloads.
      val physicalCores = getPhysicalCoreCount()
      log(
          AI.LogLevel.INFO,
          "CPU topology: ${Runtime.getRuntime().availableProcessors()} logical, $physicalCores physical cores",
          " / QWEN",
          null)

      // --- Vision Encoder ---
      // Plugin setting AI_ONNX_VisionEncoder selects the variant:
      //   "quantized" (default) = QDQ INT8 (669 MB, ~3.7s) — QuantizeLinear/DequantizeLinear ops
      //   "fp16"               = Full precision (1.33 GB, ~10s) — best quality
      // Each variant tries OpenVINO EP first (if available), then falls back to ORT CPU.
      val wantFP16 = visionEncoderMode == "fp16"
      val visionModelFile =
          if (wantFP16) "vision_encoder_fp16.onnx" else "vision_encoder_quantized.onnx"
      val visionModeTag = if (wantFP16) "FP16" else "QDQ INT8"
      log(
          AI.LogLevel.INFO,
          "Vision Encoder mode: $visionModeTag (setting: $visionEncoderMode)",
          " / QWEN",
          null)

      if (openVinoEPAvailable) {
        // Load with OpenVINO EP
        log(
            AI.LogLevel.INFO,
            "Lade Vision Encoder ($visionModeTag + OpenVINO EP): ${modelPath.resolve(visionModelFile)}",
            " / QWEN",
            null)
        visionEncoder =
            loadModelWithOpenVinoEP(modelPath, visionModelFile, emptyMap(), passThroughTranslator)
        activeVisionLabel = "$visionModeTag + OpenVINO EP"
        log(AI.LogLevel.INFO, "Vision Encoder loaded ($activeVisionLabel)", " / QWEN", null)
      } else {
        // Load with optimized ORT CPU session
        log(
            AI.LogLevel.INFO,
            "Lade Vision Encoder ($visionModeTag + ORT CPU): ${modelPath.resolve(visionModelFile)}",
            " / QWEN",
            null)
        run {
          val visOpts = ai.onnxruntime.OrtSession.SessionOptions()
          visOpts.setOptimizationLevel(ai.onnxruntime.OrtSession.SessionOptions.OptLevel.ALL_OPT)
          visOpts.setExecutionMode(
              ai.onnxruntime.OrtSession.SessionOptions.ExecutionMode.SEQUENTIAL)
          visOpts.setIntraOpNumThreads(physicalCores)
          visOpts.setMemoryPatternOptimization(true)
          visOpts.setCPUArenaAllocator(true)
          val baseName = visionModelFile.removeSuffix(".onnx")
          val visOptFile = modelPath.resolve("${baseName}_cpu_optimized.onnx")
          visOpts.setOptimizedModelFilePath(visOptFile.toString())
          val visOptions = HashMap<String, Any>()
          visOptions["sessionOptions"] = visOpts
          val visM = ai.djl.Model.newInstance(baseName, "OnnxRuntime")
          visM.load(modelPath.resolve(visionModelFile), null, visOptions)
          visionEncoder = ZooModel(visM, passThroughTranslator)
        }
        activeVisionLabel = "$visionModeTag + ORT CPU (threads=$physicalCores)"
        log(AI.LogLevel.INFO, "Vision Encoder loaded ($activeVisionLabel)", " / QWEN", null)
      }

      // --- Decoder Model ---
      log(AI.LogLevel.INFO, "Lade Decoder Model (CPU, ~4GB RAM)...", " / QWEN", null)
      run {
        val decOpts = ai.onnxruntime.OrtSession.SessionOptions()
        decOpts.setOptimizationLevel(ai.onnxruntime.OrtSession.SessionOptions.OptLevel.ALL_OPT)
        decOpts.setExecutionMode(ai.onnxruntime.OrtSession.SessionOptions.ExecutionMode.SEQUENTIAL)
        decOpts.setIntraOpNumThreads(physicalCores)
        decOpts.setMemoryPatternOptimization(true)
        decOpts.setCPUArenaAllocator(true)
        val decOptFile = modelPath.resolve("decoder_model_merged_q4_optimized.onnx")
        decOpts.setOptimizedModelFilePath(decOptFile.toString())
        val decOptions = HashMap<String, Any>()
        decOptions["sessionOptions"] = decOpts
        val decM = ai.djl.Model.newInstance("decoder_model_merged_q4", "OnnxRuntime")
        decM.load(modelPath.resolve("decoder_model_merged_q4.onnx"), null, decOptions)
        decoderModel = ZooModel(decM, passThroughTranslator)
      }
      log(
          AI.LogLevel.INFO,
          "Decoder Model loaded (CPU, ALL_OPT, SEQUENTIAL, threads=$physicalCores)",
          " / QWEN",
          null)

      // --- Embedding Model ---
      log(AI.LogLevel.INFO, "Lade Embedding Model (CPU)...", " / QWEN", null)
      embedModel =
          Criteria.builder()
              .setTypes(NDList::class.java, NDList::class.java)
              .optModelPath(modelPath.resolve("embed_tokens_fp16.onnx"))
              .optEngine("OnnxRuntime")
              .build()
              .loadModel()
      log(AI.LogLevel.INFO, "Embedding Model loaded (CPU)", " / QWEN", null)

      log(AI.LogLevel.INFO, "Initialisiere Tokenizer und Predictor-Pools...", " / QWEN", null)

      tokenizer = HuggingFaceTokenizer.newInstance(modelPath.resolve("tokenizer.json"))
      initPredictorPools()

      // --- Warmup inference ---
      // The first ORT predict() call is significantly slower due to:
      // 1) Memory arena initialization & allocation pattern discovery
      // 2) OpenVINO IR compilation from ONNX (if not in cache_dir yet)
      // 3) CPU instruction cache warming (branch prediction, TLB)
      // Running a dummy inference here moves that cost from the first user request
      // to the server startup phase.
      try {
        log(AI.LogLevel.INFO, "Running warmup inference...", " / QWEN", null)
        val t0w = System.currentTimeMillis()
        val ortEngine = ai.djl.engine.Engine.getEngine("OnnxRuntime")
        (ortEngine as ai.djl.engine.Engine).newBaseManager().use { warmupMgr ->
          // Warmup vision encoder: minimal 1-patch input
          val visionPred = acquirePredictor<NDList, NDList>("qwen-encoder")
          if (visionPred != null) {
            try {
              val dummyPixels =
                  warmupMgr.zeros(ai.djl.ndarray.types.Shape(1, 4704), DataType.FLOAT32).apply {
                    name = "pixel_values"
                  }
              val dummyThw =
                  warmupMgr.create(longArrayOf(1, 1, 1)).reshape(1, 3).apply { name = "grid_thw" }
              visionPred.predict(NDList(dummyPixels, dummyThw))
            } catch (_: Exception) {
              /* warmup failure is non-fatal */
            } finally {
              releasePredictor("qwen-encoder", visionPred)
            }
          }

          // Warmup embed model: single token
          val embedPred = acquirePredictor<NDList, NDList>("qwen-embed")
          if (embedPred != null) {
            try {
              val dummyIds = warmupMgr.create(longArrayOf(151643L)).reshape(1, 1)
              embedPred.predict(NDList(dummyIds))
            } catch (_: Exception) {} finally {
              releasePredictor("qwen-embed", embedPred)
            }
          }

          // Warmup decoder: minimal 1-token prefill with empty KV cache
          val decPred = acquirePredictor<NDList, NDList>("qwen-decoder")
          if (decPred != null) {
            try {
              val dummyEmbed =
                  warmupMgr.zeros(ai.djl.ndarray.types.Shape(1, 1, 1536), DataType.FLOAT32).apply {
                    name = "inputs_embeds"
                  }
              val dummyMask =
                  warmupMgr.ones(ai.djl.ndarray.types.Shape(1, 1), DataType.INT64).apply {
                    name = "attention_mask"
                  }
              val dummyPos =
                  warmupMgr.zeros(ai.djl.ndarray.types.Shape(3, 1, 1), DataType.INT64).apply {
                    name = "position_ids"
                  }
              val decInput = NDList(dummyEmbed, dummyMask, dummyPos)
              // 28 KV pairs with empty sequence dimension
              for (j in 0 until 28) {
                decInput.add(
                    warmupMgr
                        .zeros(ai.djl.ndarray.types.Shape(1, 2, 0, 128), DataType.FLOAT32)
                        .apply { name = "past_key_values.$j.key" })
                decInput.add(
                    warmupMgr
                        .zeros(ai.djl.ndarray.types.Shape(1, 2, 0, 128), DataType.FLOAT32)
                        .apply { name = "past_key_values.$j.value" })
              }
              decPred.predict(decInput)
            } catch (_: Exception) {} finally {
              releasePredictor("qwen-decoder", decPred)
            }
          }
        }
        val warmupMs = System.currentTimeMillis() - t0w
        log(AI.LogLevel.INFO, "Warmup complete: ${warmupMs}ms", " / QWEN / PERF", null)
      } catch (e: Exception) {
        log(AI.LogLevel.WARNING, "Warmup failed (non-fatal): ${e.message}", " / QWEN", null)
      }

      val epLabel = "Vision: $activeVisionLabel, Decoder: ORT CPU SEQUENTIAL"
      log(
          AI.LogLevel.INFO,
          "Qwen-VL erfolgreich geladen und einsatzbereit ($epLabel).",
          " / QWEN",
          null)
    } catch (e: Exception) {
      if (e.cause?.message?.contains("OrtEnvironment") == true ||
          e.message?.contains("already exists") == true) {
        log(
            AI.LogLevel.WARNING,
            "ONNX Environment ist bereits aktiv. Modelle werden eventuell trotzdem geladen...",
            " / QWEN",
            null)
      } else {
        log(
            AI.LogLevel.ERROR,
            "Kritischer Fehler beim Laden der Qwen-Modelle: ${e.message}",
            " / QWEN",
            e)
        throw e
      }
    } finally {
      Thread.currentThread().contextClassLoader = oldClassLoader
    }
  }

  /**
   * Returns the number of **physical** CPU cores (not logical/HT processors). On Intel hybrid
   * architectures (12th/13th/14th gen), [Runtime.availableProcessors] returns the logical count
   * (P-cores×2 for HT + E-cores), but for compute-bound AVX2 workloads like ViT inference, using
   * only physical core count avoids Hyper-Threading contention where two logical threads on the
   * same P-core compete for the same SIMD execution units.
   */
  private fun getPhysicalCoreCount(): Int {
    return try {
      val process =
          ProcessBuilder("wmic", "cpu", "get", "NumberOfCores", "/value")
              .redirectErrorStream(true)
              .start()
      val output = process.inputStream.bufferedReader().readText()
      process.waitFor()
      val match = Regex("""NumberOfCores=(\d+)""").find(output)
      match?.groupValues?.get(1)?.toIntOrNull() ?: Runtime.getRuntime().availableProcessors()
    } catch (_: Exception) {
      Runtime.getRuntime().availableProcessors()
    }
  }

  /**
   * Loads an ONNX model using DJL's Model API with a pre-configured ORT SessionOptions that
   * includes the OpenVINO execution provider. DJL's `OrtModel.getSessionOptions()` recognises the
   * `"sessionOptions"` key and uses the supplied object instead of creating a new one, while still
   * applying additional string options (like `interOpNumThreads`).
   */
  private fun loadModelWithOpenVinoEP(
      modelDir: java.nio.file.Path,
      modelFileName: String,
      extraOpts: Map<String, String>,
      translator: Translator<NDList, NDList>
  ): ZooModel<NDList, NDList> {
    val sessionOptions = ai.onnxruntime.OrtSession.SessionOptions()
    sessionOptions.setOptimizationLevel(ai.onnxruntime.OrtSession.SessionOptions.OptLevel.ALL_OPT)
    // SEQUENTIAL mode: all intra-op threads collaborate on each operator.
    // Avoids thread over-subscription from concurrent inter-op + intra-op threads.
    sessionOptions.setExecutionMode(
        ai.onnxruntime.OrtSession.SessionOptions.ExecutionMode.SEQUENTIAL)
    sessionOptions.setIntraOpNumThreads(Runtime.getRuntime().availableProcessors())
    // Cache the optimized graph to disk so subsequent loads skip graph optimization.
    val optFile = modelDir.resolve(modelFileName.removeSuffix(".onnx") + "_optimized.onnx")
    sessionOptions.setOptimizedModelFilePath(optFile.toString())
    addOpenVinoEPViaReflection(sessionOptions)
    // Build an options map: the pre-configured SessionOptions + any extra string options
    val options = HashMap<String, Any>()
    options["sessionOptions"] = sessionOptions
    options.putAll(extraOpts)

    val model = ai.djl.Model.newInstance(modelFileName.removeSuffix(".onnx"), "OnnxRuntime")
    model.load(modelDir.resolve(modelFileName), null, options)
    return ZooModel(model, translator)
  }

  /**
   * Registers the OpenVINO Execution Provider on the given [SessionOptions] by calling the generic
   * (non-`#ifdef`-guarded) **private native** method `addExecutionProvider` via reflection.
   *
   * ### Why reflection?
   *
   * The Maven `onnxruntime` JAR ships an `onnxruntime4j_jni.dll` compiled **without**
   * `USE_OPENVINO`. The public `SessionOptions.addOpenVINO()` Java method delegates to a JNI native
   * whose C++ body is wrapped in `#ifdef USE_OPENVINO … #else throw … #endif`, so it always throws
   * *"This binary was not compiled with OpenVINO support"*.
   *
   * However the same JNI DLL also exposes a **generic** native method `addExecutionProvider(long
   * apiHandle, long nativeHandle, String epName, String[] keys, String[] vals)` which is **not**
   * guarded by any `#ifdef`. It forwards directly to
   * `OrtApi::SessionOptionsAppendExecutionProvider` in `onnxruntime.dll`. Because we replaced
   * Maven's CPU-only `onnxruntime.dll` with the OpenVINO-enabled build from PyPI, that C-API
   * function **does** recognise the `"OpenVINO"` name (mixed case — the error message misleadingly
   * shows `'OPENVINO'`) and registers the EP successfully.
   *
   * @throws RuntimeException if the reflective call fails for any reason (missing method, security
   *   manager, etc.).
   */
  private fun addOpenVinoEPViaReflection(sessionOptions: ai.onnxruntime.OrtSession.SessionOptions) {
    val epDir = openVinoEpNativeDir

    // 1. Obtain OnnxRuntime.ortApiHandle (package-private static field)
    val ortClass = Class.forName("ai.onnxruntime.OnnxRuntime")
    val apiHandleField = ortClass.getDeclaredField("ortApiHandle")
    apiHandleField.isAccessible = true
    val apiHandle = apiHandleField.getLong(null)

    // 2. Obtain SessionOptions.nativeHandle (private instance field)
    val soClass = ai.onnxruntime.OrtSession.SessionOptions::class.java
    val nativeHandleField = soClass.getDeclaredField("nativeHandle")
    nativeHandleField.isAccessible = true
    val nativeHandle = nativeHandleField.getLong(sessionOptions)

    // 3. Obtain the private native addExecutionProvider method
    val addEpMethod =
        soClass.getDeclaredMethod(
            "addExecutionProvider",
            Long::class.javaPrimitiveType,
            Long::class.javaPrimitiveType,
            String::class.java,
            Array<String>::class.java,
            Array<String>::class.java)
    addEpMethod.isAccessible = true

    // --- EP registration with error-parse-retry ----------------------------------
    // ORT's C code (provider_bridge_ort.cc) locates provider DLLs relative to the
    // loaded onnxruntime.dll using GetModuleFileName(). That path is set at the OS
    // level when System.load() first loads the DLL and NEVER changes — even across
    // hot-deploy cycles that create new run directories and delete old ones.
    //
    // Neither Java's onnxruntime.native.path property nor OnnxRuntime.libraryDirPathProperty
    // reliably reflects the true OS-level load path (they get reset when the ORT Java
    // class reloads in a new ClassLoader, while the OS module path stays the same).
    //
    // Strategy: attempt the EP registration; if the C code fails with "LoadLibrary
    // failed … when trying to load <full_path>", parse that path to learn the EXACT
    // directory the C code expects, recreate it, copy all EP DLLs there, and retry.
    val epDllNames =
        listOf("onnxruntime_providers_shared.dll", "onnxruntime_providers_openvino.dll")
    val repairedDirs = mutableSetOf<String>()
    var lastError: Throwable? = null

    for (attempt in 1..3) {
      try {
        addEpMethod.invoke(
            sessionOptions,
            apiHandle,
            nativeHandle,
            // The ORT C API uses a case-sensitive comparison: "OpenVINO" (mixed case).
            // CPU_FP32 is deprecated but the only device_type that works in ORT-OpenVINO
            // 1.19. The newer "CPU" + "precision" API is not supported in this version.
            "OpenVINO",
            arrayOf("device_type", "num_of_threads", "cache_dir"),
            arrayOf(
                "CPU_FP32",
                "${Runtime.getRuntime().availableProcessors()}",
                (donutModelDir?.resolve("ov_cache")?.also { it.mkdirs() }?.absolutePath ?: "")))
        val cacheDir = donutModelDir?.resolve("ov_cache")
        val cacheFiles = cacheDir?.listFiles()?.size ?: 0
        log(
            AI.LogLevel.INFO,
            "OpenVINO EP registered (attempt $attempt). Threads: ${Runtime.getRuntime().availableProcessors()}, cache_dir: ${cacheDir?.absolutePath} ($cacheFiles cached files)",
            " / QWEN / EP",
            null)
        return // success
      } catch (ite: java.lang.reflect.InvocationTargetException) {
        val cause = ite.cause ?: ite
        lastError = cause
        val msg = cause.message ?: ""

        // Parse the directory the C code tried to load from:
        //   LoadLibrary failed with error 126 "" when trying to load "<full_path>"
        val pathMatch = Regex("""when trying to load "(.+?)"""").find(msg)
        if (pathMatch != null && epDir != null) {
          val expectedDllPath = java.io.File(pathMatch.groupValues[1])
          val expectedDir = expectedDllPath.parentFile

          if (expectedDir != null && !repairedDirs.contains(expectedDir.absolutePath)) {
            log(
                AI.LogLevel.INFO,
                "Attempt $attempt: ORT C code expects EP DLLs in ${expectedDir.absolutePath} " +
                    "(exists=${expectedDir.exists()}). Copying from ${epDir.absolutePath}...",
                " / QWEN / EP",
                null)
            if (!expectedDir.exists()) expectedDir.mkdirs()

            // Copy EP DLLs (onnxruntime_providers_shared.dll, onnxruntime_providers_openvino.dll)
            for (dllName in epDllNames) {
              val src = java.io.File(epDir, dllName)
              val dst = java.io.File(expectedDir, dllName)
              if (src.exists()) {
                safeCopyDll(src, dst)
              }
            }

            // Also copy OpenVINO runtime DLLs (openvino.dll, tbb12.dll, etc.) into the
            // same directory.  When ORT's LoadLibrary loads onnxruntime_providers_openvino.dll,
            // Windows resolves its transitive imports by searching the DLL's own directory
            // FIRST.  Having the OpenVINO runtime DLLs there guarantees they are found
            // regardless of whether System.load() pre-loading makes them visible to the
            // native loader.
            val ovBinDir = openVinoBinDir
            if (ovBinDir != null && ovBinDir.isDirectory) {
              ovBinDir
                  .listFiles()
                  ?.filter { it.name.endsWith(".dll") }
                  ?.forEach { ovDll ->
                    val dst = java.io.File(expectedDir, ovDll.name)
                    safeCopyDll(ovDll, dst)
                  }
              log(
                  AI.LogLevel.INFO,
                  "  Copied OpenVINO runtime DLLs from ${ovBinDir.absolutePath}",
                  " / QWEN / EP",
                  null)
            } else {
              log(
                  AI.LogLevel.WARNING,
                  "  OpenVINO bin dir not available — cannot copy runtime DLLs",
                  " / QWEN / EP",
                  null)
            }
            repairedDirs.add(expectedDir.absolutePath)
            continue // retry with the EP DLLs now in place
          }
        }
        // Cannot parse the expected directory or already tried — give up
        throw cause
      }
    }
    throw lastError ?: RuntimeException("OpenVINO EP registration failed after retries")
  }

  /**
   * Copies a DLL to [dst], tolerating locked files (common on Windows when the DLL is loaded by the
   * OS from a previous deploy cycle).
   */
  private fun safeCopyDll(src: java.io.File, dst: java.io.File) {
    try {
      src.copyTo(dst, overwrite = true)
    } catch (ex: java.nio.file.FileAlreadyExistsException) {
      // Destination is locked — file exists, which is all we need.
    } catch (ex: java.io.IOException) {
      if (!dst.exists()) throw ex
      // Copy failed but file exists at destination — acceptable.
    }
  }

  private fun initPredictorPools() {
    val encoder = visionEncoder ?: return
    val decoder = decoderModel ?: return
    val embed = embedModel ?: return

    val passThroughTranslator =
        object : Translator<NDList, NDList> {
          override fun processInput(ctx: TranslatorContext, input: NDList) = input

          override fun processOutput(ctx: TranslatorContext, list: NDList) = list

          override fun getBatchifier() = null
        }

    val maxParallelInferences = 1

    log(
        AI.LogLevel.INFO,
        "Initialisiere Qwen Predictor-Pools (Size: $maxParallelInferences)...",
        " / QWEN",
        null)

    if (!predictorPools.containsKey("qwen-encoder")) {
      val pool = LinkedBlockingQueue<Predictor<*, *>>()
      repeat(maxParallelInferences) { pool.offer(encoder.newPredictor(passThroughTranslator)) }
      predictorPools["qwen-encoder"] = pool
    }

    if (!predictorPools.containsKey("qwen-decoder")) {
      val pool = LinkedBlockingQueue<Predictor<*, *>>()
      repeat(maxParallelInferences) { pool.offer(decoder.newPredictor(passThroughTranslator)) }
      predictorPools["qwen-decoder"] = pool
    }

    if (!predictorPools.containsKey("qwen-embed")) {
      val pool = LinkedBlockingQueue<Predictor<*, *>>()
      repeat(maxParallelInferences) { pool.offer(embed.newPredictor(passThroughTranslator)) }
      predictorPools["qwen-embed"] = pool
    }

    log(
        AI.LogLevel.INFO,
        "Predictor-Pools bereit. Parallele Inferenz limitiert auf $maxParallelInferences.",
        " / QWEN",
        null)
  }

  /**
   * Pre-computed vision encoder output, reusable across multiple questions on the same image.
   * Stores pure JVM data (FloatArray + shape) instead of native NDArray references so that cached
   * results survive across request-scoped NDManager lifetimes.
   */
  private data class VisionResult(
      val embedData: FloatArray,
      val embedShape: LongArray,
      val actualVisionTokens: Int,
      val mH: Int,
      val mW: Int
  ) {
    /** Reconstructs a live NDArray from the cached float data under the given [manager]. */
    fun toNDArray(manager: NDManager): ai.djl.ndarray.NDArray =
        manager.create(embedData, ai.djl.ndarray.types.Shape(*embedShape))
  }

  /**
   * Encodes an image through the vision encoder ONCE. The result can be reused for multiple
   * questions on the same image, saving ~11s per additional question.
   */
  private fun encodeVision(
      manager: NDManager,
      visionPredictor: Predictor<NDList, NDList>,
      image: DjlImage
  ): VisionResult {
    // Use a dummy question to get the preprocessed pixel_values and grid_thw.
    // The question text does not affect vision preprocessing.
    val translator = QwenVLTranslator(this.tokenizer!!, { _, _, _ -> }, maxPixels)
    val ctx =
        object : TranslatorContext {
          override fun getNDManager() = manager

          override fun getPredictorManager() = manager

          override fun getModel() = null

          override fun getBlock() = null

          override fun getMetrics() = null

          override fun getAttachment(key: String) = null

          override fun setAttachment(key: String, value: Any) {}

          override fun close() {}
        }
    val inputs = translator.processInput(ctx, Pair(image, ""))

    log(
        AI.LogLevel.INFO,
        "Image to encode: ${image.width}×${image.height} (${image.width * image.height} px)",
        " / QWEN / PERF",
        null)

    val t0Vision = System.currentTimeMillis()
    val visionOutput =
        visionPredictor.predict(
            NDList(
                inputs[0].apply { name = "pixel_values" }, inputs[1].apply { name = "grid_thw" }))
    val imageEmbeds = visionOutput[0]
    val visionMs = System.currentTimeMillis() - t0Vision
    log(
        AI.LogLevel.INFO,
        "Vision encoding: ${visionMs}ms (shape: ${imageEmbeds.shape})",
        " / QWEN / PERF",
        null)

    // DYNAMIC 3D GRID CALCULATION
    var actualVisionTokens =
        if (imageEmbeds.shape.dimension() == 2) imageEmbeds.shape[0].toInt()
        else imageEmbeds.shape[1].toInt()

    var mH = 1
    var mW = actualVisionTokens
    try {
      val gridThwArr = inputs[1].toLongArray()
      if (gridThwArr.size >= 3) {
        val gridH = gridThwArr[1].toInt()
        val gridW = gridThwArr[2].toInt()
        val mergeSize = 2
        val mergedH = gridH / mergeSize
        val mergedW = gridW / mergeSize
        val expectedTokens = mergedH * mergedW
        mH = mergedH
        mW = mergedW
        if (expectedTokens != actualVisionTokens) {
          log(
              AI.LogLevel.WARNING,
              "Vision token count mismatch: encoder=$actualVisionTokens, expected=$expectedTokens",
              " / QWEN",
              null)
          actualVisionTokens = expectedTokens
        }
      }
    } catch (e: Exception) {
      log(
          AI.LogLevel.WARNING,
          "Failed to validate grid_thw against vision output: ${e.message}",
          " / QWEN",
          e)
      val root = Math.sqrt(actualVisionTokens.toDouble()).toInt()
      for (i in root downTo 1) {
        if (actualVisionTokens % i == 0) {
          mH = i
          mW = actualVisionTokens / i
          break
        }
      }
    }

    // Copy to JVM heap so the cached result survives after the request-scoped NDManager closes.
    val embedData = imageEmbeds.toFloatArray()
    val embedShape = imageEmbeds.shape.shape
    return VisionResult(embedData, embedShape, actualVisionTokens, mH, mW)
  }

  /**
   * Batches multiple questions into a single decode pass to avoid redundant prefill. For N
   * questions, this saves (N-1) × ~10s of prefill time.
   *
   * Strategy:
   * - 1 question → direct single-question decode (no overhead)
   * - N questions → combined prompt asking for JSON output, parsed back to per-key results. Falls
   *   back to per-question decode if JSON parsing fails.
   */
  private fun runQwenDecodeMulti(
      manager: NDManager,
      decoderPredictor: Predictor<NDList, NDList>,
      questions: Map<String, String>,
      vision: VisionResult
  ): Map<String, String> {
    // Single question: no batching overhead
    if (questions.size == 1) {
      val (key, question) = questions.entries.first()
      return try {
        mapOf(key to runQwenDecode(manager, decoderPredictor, question, vision))
      } catch (ex: Exception) {
        log(AI.LogLevel.ERROR, "Error processing '$question': ${ex.message}", "", ex)
        mapOf(key to "Error: ${ex.message}")
      }
    }

    // Multiple questions: combine into one prompt with JSON output
    log(
        AI.LogLevel.INFO,
        "Batching ${questions.size} questions into single decode pass",
        " / QWEN",
        null)
    val questionList = questions.entries.joinToString("\n") { (key, q) -> "- $key: $q" }
    val combinedQuestion =
        "Answer each question about this image. Return ONLY a JSON object. " +
            "Use EXACTLY these IDs as keys (not the question text):\n\n" +
            "$questionList\n\n" +
            "Example format: {\"xi-tf-7\": \"answer1\", \"xi-tf-2\": \"answer2\"}"
    val batchedTokenLimit = (maxTokens * questions.size).coerceAtMost(1024)

    try {
      val rawOutput =
          runQwenDecode(manager, decoderPredictor, combinedQuestion, vision, batchedTokenLimit)
      log(
          AI.LogLevel.INFO,
          "Batched decode raw output (${rawOutput.length} chars): ${rawOutput.take(500)}",
          " / QWEN",
          null)

      // Extract JSON from possible markdown code block ```json ... ```
      val jsonStr =
          rawOutput
              .replace(Regex("```json\\s*"), "")
              .replace(Regex("```\\s*$"), "")
              .replace(Regex("^```\\s*"), "")
              .trim()

      // Parse JSON — look for the question keys in the output
      val results = mutableMapOf<String, String>()
      for ((key, _) in questions) {
        // Try to extract value for this key from the JSON string.
        // Pattern: "key" : "value" or "key": "value" (handles escaped quotes in value)
        val keyPattern = Regex("\"${Regex.escape(key)}\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"")
        val match = keyPattern.find(jsonStr)
        if (match != null) {
          results[key] =
              match.groupValues[1].replace("\\\"", "\"").replace("\\n", "\n").replace("\\\\", "\\")
        }
      }

      if (results.size == questions.size) {
        log(
            AI.LogLevel.INFO,
            "Batched decode: all ${questions.size} answers parsed successfully",
            " / QWEN",
            null)
        return results
      }

      // Some keys missing — log which ones and fall through to per-question fallback
      val missing = questions.keys - results.keys
      log(
          AI.LogLevel.WARNING,
          "Batched decode: ${results.size}/${questions.size} parsed, missing keys: $missing. Falling back to per-question for missing.",
          " / QWEN",
          null)
      // Return what we have, fill missing with per-question decode
      for (key in missing) {
        try {
          results[key] = runQwenDecode(manager, decoderPredictor, questions[key]!!, vision)
        } catch (ex: Exception) {
          results[key] = "Error: ${ex.message}"
          log(AI.LogLevel.ERROR, "Error processing '${questions[key]}': ${ex.message}", "", ex)
        }
      }
      return results
    } catch (ex: Exception) {
      log(
          AI.LogLevel.WARNING,
          "Batched decode failed: ${ex.message}. Falling back to per-question decode.",
          " / QWEN",
          null)
      // Full fallback: run each question independently
      val results = mutableMapOf<String, String>()
      questions.forEach { (key, question) ->
        try {
          results[key] = runQwenDecode(manager, decoderPredictor, question, vision)
        } catch (e: Exception) {
          results[key] = "Error: ${e.message}"
          log(AI.LogLevel.ERROR, "Error processing '$question': ${e.message}", "", e)
        }
      }
      return results
    }
  }

  /** Runs the decode loop for a text-only prompt (no image / no vision injection). */
  private fun runQwenDecodeTextOnly(
      manager: NDManager,
      decoderPredictor: Predictor<NDList, NDList>,
      question: String,
      tokenLimit: Int = maxTokens,
      onToken: ((Long) -> Unit)? = null,
      shouldStop: (() -> Boolean)? = null,
      chatHistory: List<Pair<String, String>> = emptyList(),
      resourceNotify: ((String) -> Unit)? = null
  ): String {
    val tokenizer = this.tokenizer!!
    val prompt =
        if (chatHistory.isNotEmpty()) {
          buildString {
            append("<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n")
            for ((role, content) in chatHistory) {
              append("<|im_start|>").append(role).append("\n")
              append(content).append("<|im_end|>\n")
            }
            append("<|im_start|>assistant\n")
          }
        } else {
          "<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n" +
              "<|im_start|>user\n$question<|im_end|>\n<|im_start|>assistant\n"
        }
    val inputIds = tokenizer.encode(prompt).ids

    var currentInputIds = manager.create(inputIds).reshape(1, inputIds.size.toLong())
    var pastKeyValues: NDList? = null
    val generatedIds = mutableListOf<Long>()
    var pastSeqLen = 0
    var logicalPos = 0L
    val numKv = 28
    val numKvHeads = 2L
    val kvHeadDim = 128L

    @Suppress("UNCHECKED_CAST")
    val embedPredictor =
        acquirePredictor<NDList, NDList>("qwen-embed")
            ?: throw IllegalStateException("No predictor available for qwen-embed")

    val t0Loop = System.currentTimeMillis()
    var totalEmbedMs = 0L
    var totalDecodeMs = 0L
    var totalKvMs = 0L
    var prefillMs = 0L
    for (i in 0 until tokenLimit) {
      val tStep = System.currentTimeMillis()
      val tEmbed = System.currentTimeMillis()
      val inputEmbeds = embedPredictor.predict(NDList(currentInputIds))[0]
      totalEmbedMs += System.currentTimeMillis() - tEmbed

      val currentSeqLen = inputEmbeds.shape[1].toInt()
      val totalSeqLen = pastSeqLen + currentSeqLen

      val decInputs = NDList()
      decInputs.add(inputEmbeds.apply { name = "inputs_embeds" })

      val attentionMask =
          manager.ones(ai.djl.ndarray.types.Shape(1, totalSeqLen.toLong()), DataType.INT64)
      decInputs.add(attentionMask.apply { name = "attention_mask" })

      // Position IDs — all 3 mRoPE axes equal for text-only
      val posArray = LongArray(3 * currentSeqLen)
      for (pos in 0 until currentSeqLen) {
        posArray[pos] = logicalPos
        posArray[currentSeqLen + pos] = logicalPos
        posArray[2 * currentSeqLen + pos] = logicalPos
        logicalPos++
      }
      val posIds =
          manager
              .create(posArray)
              .toType(DataType.INT64, false)
              .reshape(3L, 1L, currentSeqLen.toLong())
      decInputs.add(posIds.apply { name = "position_ids" })

      if (pastKeyValues != null) {
        for (p in pastKeyValues!!) decInputs.add(p)
      } else {
        for (j in 0 until numKv) {
          decInputs.add(
              manager
                  .zeros(ai.djl.ndarray.types.Shape(1, numKvHeads, 0L, kvHeadDim), DataType.FLOAT32)
                  .apply { name = "past_key_values.$j.key" })
          decInputs.add(
              manager
                  .zeros(ai.djl.ndarray.types.Shape(1, numKvHeads, 0L, kvHeadDim), DataType.FLOAT32)
                  .apply { name = "past_key_values.$j.value" })
        }
      }

      val tDec = System.currentTimeMillis()
      val decOutput = decoderPredictor.predict(decInputs)
      totalDecodeMs += System.currentTimeMillis() - tDec

      attentionMask.close()
      posIds.close()

      val logits = decOutput[0]
      val nextTokenId =
          if (logits.shape.dimension() == 3) {
            logits.get(":, -1, :").squeeze().argMax().getLong()
          } else {
            logits.get("-1, :").squeeze().argMax().getLong()
          }

      if (nextTokenId == 151643L || nextTokenId == 151645L) break
      if (shouldStop?.invoke() == true) break

      // Resource throttle: pause token generation if CPU/RAM thresholds exceeded
      resourceMonitor?.let { monitor ->
        if (!monitor.resourcesAvailable()) {
          val reason = monitor.exceedReason() ?: "resources exceeded"
          log(
              AI.LogLevel.INFO,
              "TextOnly decode PAUSED at token $i: $reason",
              " / QWEN / PERF",
              null)
          resourceNotify?.invoke("\u23F8 Paused \u2014 $reason. Waiting for resources...")
          val waitResult = monitor.awaitResources(30_000L)
          if (waitResult == -1L) {
            log(
                AI.LogLevel.WARNING,
                "TextOnly decode TIMEOUT waiting for resources after 30s",
                " / QWEN / PERF",
                null)
            resourceNotify?.invoke("\u26A0 Timed out after 30s \u2014 continuing anyway")
          } else {
            log(AI.LogLevel.INFO, "TextOnly decode RESUMED (resources OK)", " / QWEN / PERF", null)
            resourceNotify?.invoke("\u25B6 Resumed")
          }
        }
      }

      generatedIds.add(nextTokenId)
      onToken?.invoke(nextTokenId)
      currentInputIds.close()
      currentInputIds = manager.create(longArrayOf(nextTokenId)).reshape(1, 1)

      val tKv = System.currentTimeMillis()
      val nextKVs = NDList()
      for (j in 0 until numKv) {
        val outK = decOutput[1 + (j * 2)]
        val outV = decOutput[2 + (j * 2)]
        val outLen = outK.shape[2].toInt()

        val finalK =
            if (outLen == totalSeqLen) outK
            else if (outLen == currentSeqLen && pastKeyValues != null)
                pastKeyValues!![j * 2].concat(outK, 2)
            else outK

        val finalV =
            if (outV.shape[2].toInt() == totalSeqLen) outV
            else if (outV.shape[2].toInt() == currentSeqLen && pastKeyValues != null)
                pastKeyValues!![j * 2 + 1].concat(outV, 2)
            else outV

        nextKVs.add(
            manager.create(finalK.toByteBuffer(), finalK.shape, DataType.FLOAT32).apply {
              name = "past_key_values.$j.key"
            })
        nextKVs.add(
            manager.create(finalV.toByteBuffer(), finalV.shape, DataType.FLOAT32).apply {
              name = "past_key_values.$j.value"
            })
      }

      pastKeyValues?.close()
      pastKeyValues = nextKVs
      totalKvMs += System.currentTimeMillis() - tKv

      val stepMs = System.currentTimeMillis() - tStep
      if (i == 0) {
        prefillMs = stepMs
        log(
            AI.LogLevel.INFO,
            "TextOnly prefill (${currentSeqLen} tokens → 1): ${stepMs}ms",
            " / QWEN / PERF",
            null)
      }
      pastSeqLen += currentSeqLen
    }

    val loopMs = System.currentTimeMillis() - t0Loop
    val tokens = generatedIds.size
    val tokPerSec = if (loopMs > 0) tokens * 1000.0 / loopMs else 0.0
    log(
        AI.LogLevel.INFO,
        "TextOnly decode: ${loopMs}ms, $tokens tokens (%.1f tok/s). Prefill: ${prefillMs}ms"
            .format(tokPerSec),
        " / QWEN / PERF",
        null)

    releasePredictor("qwen-embed", embedPredictor)

    return try {
      tokenizer.decode(generatedIds.toLongArray()).trim()
    } catch (e: Exception) {
      generatedIds.joinToString(" ")
    }
  }

  /** Runs the decode loop for a single question, reusing pre-computed vision embeddings. */
  private fun runQwenDecode(
      manager: NDManager,
      decoderPredictor: Predictor<NDList, NDList>,
      question: String,
      vision: VisionResult,
      tokenLimit: Int = maxTokens,
      onToken: ((Long) -> Unit)? = null,
      shouldStop: (() -> Boolean)? = null,
      chatHistory: List<Pair<String, String>> = emptyList(),
      resourceNotify: ((String) -> Unit)? = null
  ): String {
    // Build input_ids directly from tokenizer — avoids re-running the full image
    // preprocessing (resize, normalize, reshape) which is wasteful since vision
    // embeddings are already computed.
    val tokenizer = this.tokenizer!!
    val prePrompt: String
    val postPrompt: String
    if (chatHistory.size > 1) {
      // Multi-turn: include text-only history before the current (vision) turn.
      // The image is always anchored to the latest user message.
      prePrompt = buildString {
        append("<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n")
        for (i in 0 until chatHistory.size - 1) {
          val (role, content) = chatHistory[i]
          append("<|im_start|>").append(role).append("\n")
          append(content).append("<|im_end|>\n")
        }
        append("<|im_start|>user\n<|vision_start|>")
      }
      val lastContent = chatHistory.last().second
      postPrompt = "<|vision_end|>\n$lastContent<|im_end|>\n<|im_start|>assistant\n"
    } else {
      prePrompt =
          "<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n<|im_start|>user\n<|vision_start|>"
      postPrompt = "<|vision_end|>\n$question<|im_end|>\n<|im_start|>assistant\n"
    }
    val preIds = tokenizer.encode(prePrompt).ids
    val postIds = tokenizer.encode(postPrompt).ids
    val combinedIds = LongArray(preIds.size + 1 + postIds.size)
    System.arraycopy(preIds, 0, combinedIds, 0, preIds.size)
    combinedIds[preIds.size] = 151655L // <|image_pad|>
    System.arraycopy(postIds, 0, combinedIds, preIds.size + 1, postIds.size)

    // 2. Setup Loop Variables
    var currentInputIds = manager.create(combinedIds).reshape(1, combinedIds.size.toLong())
    var pastKeyValues: NDList? = null
    val generatedIds = mutableListOf<Long>()
    var pastSeqLen = 0
    var padIdx = -1
    var logicalPos = 0L
    val numKv = 28
    // Qwen2-VL-2B: hidden_size=1536, num_attention_heads=12, num_key_value_heads=2 → head_dim=128
    val numKvHeads = 2L
    val kvHeadDim = 128L

    @Suppress("UNCHECKED_CAST")
    val embedPredictor =
        acquirePredictor<NDList, NDList>("qwen-embed")
            ?: throw IllegalStateException("No predictor available for qwen-embed")

    // 3. Decoding Loop
    val t0Loop = System.currentTimeMillis()
    var totalEmbedMs = 0L
    var totalDecodeMs = 0L
    var totalKvMs = 0L
    var prefillMs = 0L
    for (i in 0 until tokenLimit) {
      val tStep = System.currentTimeMillis()
      val tEmbed = System.currentTimeMillis()
      var inputEmbeds = embedPredictor.predict(NDList(currentInputIds))[0]
      totalEmbedMs += System.currentTimeMillis() - tEmbed

      // B. VISION INJECTION: Splice vision features on first step
      if (i == 0) {
        val ids = currentInputIds.toLongArray()
        val imagePadTokenId = 151655L
        padIdx = ids.indexOf(imagePadTokenId)

        if (padIdx != -1) {
          val visionArray = vision.toNDArray(manager)
          val reshapedVision =
              if (visionArray.shape.dimension() == 2) {
                visionArray.reshape(1, visionArray.shape[0], visionArray.shape[1])
              } else {
                visionArray
              }

          val pre = inputEmbeds.get(":, :$padIdx, :")
          val post = inputEmbeds.get(":, ${padIdx + 1}:, :")

          inputEmbeds = pre.concat(reshapedVision, 1).concat(post, 1)
        } else {
          log(
              AI.LogLevel.WARNING,
              "No <|image_pad|> token found in sequence. Vision injection skipped.",
              " / QWEN",
              null)
        }
      }

      val currentSeqLen = inputEmbeds.shape[1].toInt()
      val totalSeqLen = pastSeqLen + currentSeqLen

      // C. Forward Pass — zero-copy optimized
      //    Old version copied ALL tensors through Java heap (including ~191MB logits tensor).
      //    Now: inputs passed by reference, logits accessed directly, only KV cache copied.
      val decInputs = NDList()

      // 1. Inputs Embeds — pass by reference, no copy!
      decInputs.add(inputEmbeds.apply { name = "inputs_embeds" })

      // 2. Attention Mask (INT64 ones — cheap to create)
      val attentionMask =
          manager.ones(ai.djl.ndarray.types.Shape(1, totalSeqLen.toLong()), DataType.INT64)
      decInputs.add(attentionMask.apply { name = "attention_mask" })

      // 3. Position IDs (Dynamic 3D mRoPE implementation)
      // Shape: (3, batch=1, seq_len) where dim 0 = [temporal_ids, height_ids, width_ids]
      val posArray = LongArray(3 * currentSeqLen)

      if (i == 0 && padIdx != -1 && inputEmbeds.shape[1] > 1) {
        // Spatial "island" for merged image tokens with mRoPE coordinates.
        // mH = mergedGridH, mW = mergedGridW from the vision encoder output.
        val stepPadIdx = padIdx
        for (pos in 0 until currentSeqLen) {
          if (pos >= stepPadIdx && pos < stepPadIdx + vision.actualVisionTokens) {
            // VISION COORDINATES: T stays at logicalPos, H/W get offsets
            val gridPos = pos - stepPadIdx
            val hPos = (gridPos / vision.mW).toLong()
            val wPos = (gridPos % vision.mW).toLong()
            posArray[pos] = logicalPos // temporal
            posArray[currentSeqLen + pos] = logicalPos + hPos // height
            posArray[2 * currentSeqLen + pos] = logicalPos + wPos // width
          } else {
            // TEXT COORDINATES: all three axes equal
            posArray[pos] = logicalPos
            posArray[currentSeqLen + pos] = logicalPos
            posArray[2 * currentSeqLen + pos] = logicalPos
            logicalPos++
            // After the image island, bump logicalPos for spatial separation
            if (pos == stepPadIdx + vision.actualVisionTokens - 1) {
              logicalPos++
            }
          }
        }
      } else {
        for (pos in 0 until currentSeqLen) {
          posArray[pos] = logicalPos
          posArray[currentSeqLen + pos] = logicalPos
          posArray[2 * currentSeqLen + pos] = logicalPos
          logicalPos++
        }
      }

      val posIds =
          manager
              .create(posArray)
              .toType(DataType.INT64, false)
              .reshape(3L, 1L, currentSeqLen.toLong())
      decInputs.add(posIds.apply { name = "position_ids" })

      // 4. Past Key Values — pass by reference, no copy!
      //    KV tensors live in the parent manager (or are empty on first step).
      //    The predictor only reads them during inference.
      if (pastKeyValues != null) {
        for (p in pastKeyValues!!) decInputs.add(p)
      } else {
        for (j in 0 until numKv) {
          decInputs.add(
              manager
                  .zeros(ai.djl.ndarray.types.Shape(1, numKvHeads, 0L, kvHeadDim), DataType.FLOAT32)
                  .apply { name = "past_key_values.$j.key" })
          decInputs.add(
              manager
                  .zeros(ai.djl.ndarray.types.Shape(1, numKvHeads, 0L, kvHeadDim), DataType.FLOAT32)
                  .apply { name = "past_key_values.$j.value" })
        }
      }

      val tDec = System.currentTimeMillis()
      val decOutput = decoderPredictor.predict(decInputs)
      totalDecodeMs += System.currentTimeMillis() - tDec

      // Clean up single-use input tensors (predict is synchronous, safe to close)
      attentionMask.close()
      posIds.close()

      // LOGIT EXTRACTION — directly from predictor output.
      // Avoids copying the ~191MB logits tensor (seqLen × 151,936 vocab × 4 bytes)
      // through Java heap just to extract a single Long token ID.
      val logits = decOutput[0]
      val nextTokenId =
          if (logits.shape.dimension() == 3) {
            logits.get(":, -1, :").squeeze().argMax().getLong()
          } else {
            logits.get("-1, :").squeeze().argMax().getLong()
          }

      // D. Terminate on End-Of-String
      if (nextTokenId == 151643L || nextTokenId == 151645L) {
        break
      }
      // E. Terminate on external stop request
      if (shouldStop?.invoke() == true) {
        break
      }

      // Resource throttle: pause token generation if CPU/RAM thresholds exceeded
      resourceMonitor?.let { monitor ->
        if (!monitor.resourcesAvailable()) {
          val reason = monitor.exceedReason() ?: "resources exceeded"
          log(
              AI.LogLevel.INFO,
              "Vision decode PAUSED at token ${generatedIds.size}: $reason",
              " / QWEN / PERF",
              null)
          resourceNotify?.invoke("\u23F8 Paused \u2014 $reason. Waiting for resources...")
          val waitResult = monitor.awaitResources(30_000L)
          if (waitResult == -1L) {
            log(
                AI.LogLevel.WARNING,
                "Vision decode TIMEOUT waiting for resources after 30s",
                " / QWEN / PERF",
                null)
            resourceNotify?.invoke("\u26A0 Timed out after 30s \u2014 continuing anyway")
          } else {
            log(AI.LogLevel.INFO, "Vision decode RESUMED (resources OK)", " / QWEN / PERF", null)
            resourceNotify?.invoke("\u25B6 Resumed")
          }
        }
      }

      // Collect token id (decode once after loop to avoid per-token unicode issues)
      generatedIds.add(nextTokenId)
      onToken?.invoke(nextTokenId)

      // E. Prepare next iteration
      currentInputIds.close()
      currentInputIds = manager.create(longArrayOf(nextTokenId)).reshape(1, 1)

      // F. Update KV Cache — copy only the 56 KV tensors to parent manager.
      //    Outputs live in the predictor's internal manager which resets on next predict().
      //    We skip the logits tensor entirely (token ID already extracted above).
      val tKv = System.currentTimeMillis()
      val nextKVs = NDList()
      for (j in 0 until numKv) {
        val outK = decOutput[1 + (j * 2)]
        val outV = decOutput[2 + (j * 2)]
        val outLen = outK.shape[2].toInt()

        val finalK =
            if (outLen == totalSeqLen) outK
            else if (outLen == currentSeqLen && pastKeyValues != null)
                pastKeyValues!![j * 2].concat(outK, 2)
            else outK

        val finalV =
            if (outV.shape[2].toInt() == totalSeqLen) outV
            else if (outV.shape[2].toInt() == currentSeqLen && pastKeyValues != null)
                pastKeyValues!![j * 2 + 1].concat(outV, 2)
            else outV

        // Copy KV tensors to parent manager (predictor resets its internal manager on
        // next predict() call, freeing all output tensors). Use toByteBuffer() instead of
        // toFloatArray() to avoid the Java float[] heap allocation — ByteBuffer can be a
        // direct native buffer, cutting the copy from 2 passes (native→heap→native) to 1.
        nextKVs.add(
            manager.create(finalK.toByteBuffer(), finalK.shape, DataType.FLOAT32).apply {
              name = "past_key_values.$j.key"
            })
        nextKVs.add(
            manager.create(finalV.toByteBuffer(), finalV.shape, DataType.FLOAT32).apply {
              name = "past_key_values.$j.value"
            })
      }

      pastKeyValues?.close()
      pastKeyValues = nextKVs
      totalKvMs += System.currentTimeMillis() - tKv

      val stepMs = System.currentTimeMillis() - tStep
      if (i == 0) {
        prefillMs = stepMs
        log(
            AI.LogLevel.INFO,
            "Prefill step (${currentSeqLen} tokens → 1): ${stepMs}ms",
            " / QWEN / PERF",
            null)
      }

      pastSeqLen += currentSeqLen
    }

    val loopMs = System.currentTimeMillis() - t0Loop
    val tokens = generatedIds.size
    val tokPerSec = if (loopMs > 0) tokens * 1000.0 / loopMs else 0.0
    log(
        AI.LogLevel.INFO,
        "Decoding loop: ${loopMs}ms, $tokens tokens (%.1f tok/s). Prefill: ${prefillMs}ms, Embed: ${totalEmbedMs}ms, Decode: ${totalDecodeMs}ms, KV-cache: ${totalKvMs}ms"
            .format(tokPerSec),
        " / QWEN / PERF",
        null)

    releasePredictor("qwen-embed", embedPredictor)

    // Decode all generated ids at once to avoid garbled unicode from per-token decoding
    return try {
      tokenizer!!.decode(generatedIds.toLongArray()).trim()
    } catch (e: Exception) {
      log(
          AI.LogLevel.WARNING,
          "Failed to decode generated tokens as whole: ${e.message}",
          " / QWEN",
          e)
      // Fallback: join raw ids as string
      generatedIds.joinToString(" ")
    }
  }

  private fun ensureModelFiles() {
    val dir = donutModelDir ?: return
    val base = modelBaseUrl
    val files =
        mapOf(
            "vision_encoder_quantized.onnx" to "$base/onnx/vision_encoder_quantized.onnx",
            "vision_encoder_fp16.onnx" to "$base/onnx/vision_encoder_fp16.onnx",
            "decoder_model_merged_q4.onnx" to "$base/onnx/decoder_model_merged_q4.onnx",
            "embed_tokens_fp16.onnx" to "$base/onnx/embed_tokens_fp16.onnx",
            "tokenizer.json" to "$base/tokenizer.json")
    files.forEach { (name, url) ->
      val target = File(dir, name)
      if (!target.exists()) {
        log(
            AI.LogLevel.INFO,
            "Downloading model file: $name from $url",
            "/ OpenVINO / QWEN 14B 16-4",
            null)
        val connection = URI(url).toURL().openConnection().apply { connectTimeout = 15000 }
        var bytesCopied: Long = 0
        connection.getInputStream().use { input ->
          target.outputStream().use { output -> bytesCopied = input.copyTo(output) }
        }
        val sizeStr =
            when {
              bytesCopied >= 1024L * 1024 * 1024 ->
                  String.format("%.2f GB", bytesCopied / (1024.0 * 1024 * 1024))
              bytesCopied >= 1024L * 1024 -> String.format("%.2f MB", bytesCopied / (1024.0 * 1024))
              else -> String.format("%.2f KB", bytesCopied / 1024.0)
            }
        log(AI.LogLevel.INFO, "Downloaded $name ($sizeStr)", "/ OpenVINO / QWEN 14B 16-4", null)
      } else {
        val existingSize = target.length()
        val sizeStr =
            when {
              existingSize >= 1024L * 1024 * 1024 ->
                  String.format("%.2f GB", existingSize / (1024.0 * 1024 * 1024))
              existingSize >= 1024L * 1024 ->
                  String.format("%.2f MB", existingSize / (1024.0 * 1024))
              else -> String.format("%.2f KB", existingSize / 1024.0)
            }
        log(
            AI.LogLevel.INFO,
            "Model file already exists: $name ($sizeStr)",
            "/ OpenVINO / QWEN 14B 16-4",
            null)
      }
    }
  }

  override fun shutdown(data: IPluginShutdownData?) {
    resourceMonitor?.shutdown()
    resourceMonitor = null
    streamingSessions.clear()
    synchronized(visionCacheLock) { visionCache.clear() }
    while (osdPool.isNotEmpty()) TessAPI1.TessBaseAPIDelete(osdPool.poll())
    modelsReady = false
    super.shutdown(data)
  }
}
