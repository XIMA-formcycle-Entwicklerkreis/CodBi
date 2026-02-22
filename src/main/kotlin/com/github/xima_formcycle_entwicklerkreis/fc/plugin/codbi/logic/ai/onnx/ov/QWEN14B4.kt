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
import java.net.URI
import java.util.concurrent.LinkedBlockingQueue
import javax.imageio.ImageIO
import net.sourceforge.tess4j.TessAPI1

/** Translator logic for Qwen2.5-VL. Handles dynamic gridding and KV-cached decoding. */
class QwenVLTranslator(
    private val tokenizer: HuggingFaceTokenizer,
    private val log: (importance: AI.LogLevel, toLog: String, exception: Throwable?) -> Unit
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
    val maxPixels = 12845056 // from preprocessor_config.json

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

  @Volatile private var loadError: Throwable? = null
  @Volatile private var openVinoEPAvailable = false
  /** Controls whether the Vision Encoder uses OpenVINO EP (true) or optimized ORT CPU (false). */
  private var useOpenVinoVisionEP = false
  /** Describes which Vision Encoder variant is loaded (for logging). */
  private var activeVisionLabel = "not loaded"
  private var tokenizersNativeRunDir: File? = null
  private var maxTokens = 128
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
  private var modelBaseUrl =
      "https://huggingface.co/onnx-community/Qwen2-VL-2B-Instruct/resolve/main"

  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    log(
        AI.LogLevel.INFO,
        "Processing VQA request received (Vision: $activeVisionLabel)",
        " / QWEN",
        null)

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

    val finalResults = mutableMapOf<String, Map<String, String>>()
    try {
      val tokenizer =
          tokenizer
              ?: return PluginServletActionRetVal(
                  ServletResponse(EResponseType.JSON).apply {
                    value = "{\"error\":\"Tokenizer not loaded.\"}"
                    encoding = java.nio.charset.StandardCharsets.UTF_8.name()
                  })
      params.uploadFiles?.forEach { (inputName, fileItem) ->
        val combinedBytes =
            fileItem.stream().use { stream ->
              stream.map { it.data }.reduce { acc, bytes -> acc + bytes }.orElse(byteArrayOf())
            }

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

        rotatedBytes.inputStream().use { inputStream ->
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
              // Run vision encoding ONCE for all questions on the same image.
              // This saves ~11s per additional question.
              val visionResult = encodeVision(manager, visionPredictor, djlImg)

              questionsToAsk.forEach { (key, question) ->
                try {
                  results[key] = runQwenDecode(manager, decoderPredictor, question, visionResult)
                } catch (ex: Exception) {
                  results[key] = "Error: ${ex.message}"
                  log(AI.LogLevel.ERROR, "Error processing '$question': ${ex.message}", "", ex)
                }
              }
            } finally {
              releasePredictor("qwen-encoder", visionPredictor)
              releasePredictor("qwen-decoder", decoderPredictor)
            }
          }
          finalResults[inputName] = results.toMap()
        }
      }
      // Build JSON response
      val jsonResponse = buildString {
        append("{")
        finalResults.entries.forEachIndexed { fileIdx, (fileName, fileResults) ->
          if (fileIdx > 0) append(",")
          append("\"").append(fileName.replace("\"", "\\\"")).append("\":{")
          fileResults.entries.forEachIndexed { idx, (key, value) ->
            if (idx > 0) append(",")
            append("\"").append(key.replace("\"", "\\\"")).append("\": \"")
            append(value.replace("\"", "\\\"")).append("\"")
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
    if (!activeAi.contains("qwen14b4cpu")) {
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
    // Plugin property to toggle OpenVINO EP for Vision Encoder.
    // Default: false (ORT CPU is ~2s faster than OpenVINO EP on consumer CPUs).
    // Set to "true" on server-grade CPUs (Xeon with AVX-512/AMX) where OpenVINO EP may help.
    useOpenVinoVisionEP =
        configData.properties.getProperty("AI_ONNX_UseOpenVinoVisionEP")?.trim()?.lowercase()?.let {
          it == "true" || it == "1" || it == "yes"
        } ?: false
    log(
        AI.LogLevel.INFO,
        "OpenVINO EP available: $openVinoEPAvailable, Vision EP enabled: $useOpenVinoVisionEP",
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
      // Try quantized (QDQ format) vision encoder first — half the size (669 MB vs 1.33 GB),
      // uses QuantizeLinear/DequantizeLinear ops supported by both ORT CPU and OpenVINO EP.
      // The _int8.onnx variant uses ConvInteger ops which are NOT supported by either EP.
      // Falls back to FP16 if quantized model fails to load.
      val visionModelName: String
      if (openVinoEPAvailable) {
        // Try QDQ quantized model with OpenVINO EP first
        try {
          visionModelName = "vision_encoder_quantized.onnx"
          log(
              AI.LogLevel.INFO,
              "Lade Vision Encoder (QDQ INT8 + OpenVINO EP): ${modelPath.resolve(visionModelName)}",
              " / QWEN",
              null)
          visionEncoder =
              loadModelWithOpenVinoEP(modelPath, visionModelName, emptyMap(), passThroughTranslator)
          activeVisionLabel = "QDQ INT8 + OpenVINO EP"
          log(AI.LogLevel.INFO, "Vision Encoder loaded ($activeVisionLabel)", " / QWEN", null)
        } catch (e: Exception) {
          val rootMsg = (e.cause?.message ?: e.message ?: e.toString())
          log(
              AI.LogLevel.WARNING,
              "QDQ quantized vision encoder failed on OpenVINO EP: $rootMsg. Falling back to FP16...",
              " / QWEN",
              null)
          visionEncoder?.close()
          visionEncoder = null
          // Fallback: FP16 with OpenVINO EP
          log(
              AI.LogLevel.INFO,
              "Lade Vision Encoder (FP16 + OpenVINO EP): ${modelPath.resolve("vision_encoder_fp16.onnx")}",
              " / QWEN",
              null)
          visionEncoder =
              loadModelWithOpenVinoEP(
                  modelPath, "vision_encoder_fp16.onnx", emptyMap(), passThroughTranslator)
          activeVisionLabel = "FP16 + OpenVINO EP"
          log(AI.LogLevel.INFO, "Vision Encoder loaded ($activeVisionLabel)", " / QWEN", null)
        }
      } else {
        // No OpenVINO EP — try QDQ on ORT CPU, then FP16 fallback
        try {
          visionModelName = "vision_encoder_quantized.onnx"
          log(
              AI.LogLevel.INFO,
              "Lade Vision Encoder (QDQ INT8 + ORT CPU): ${modelPath.resolve(visionModelName)}",
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
            val visOptFile = modelPath.resolve("vision_encoder_quantized_cpu_optimized.onnx")
            visOpts.setOptimizedModelFilePath(visOptFile.toString())
            val visOptions = HashMap<String, Any>()
            visOptions["sessionOptions"] = visOpts
            val visM = ai.djl.Model.newInstance("vision_encoder_quantized", "OnnxRuntime")
            visM.load(modelPath.resolve(visionModelName), null, visOptions)
            visionEncoder = ZooModel(visM, passThroughTranslator)
          }
          activeVisionLabel = "QDQ INT8 + ORT CPU (threads=$physicalCores)"
          log(AI.LogLevel.INFO, "Vision Encoder loaded ($activeVisionLabel)", " / QWEN", null)
        } catch (e: Exception) {
          val rootMsg = (e.cause?.message ?: e.message ?: e.toString())
          log(
              AI.LogLevel.WARNING,
              "QDQ quantized vision encoder failed on ORT CPU: $rootMsg. Falling back to FP16...",
              " / QWEN",
              null)
          visionEncoder?.close()
          visionEncoder = null
          log(
              AI.LogLevel.INFO,
              "Lade Vision Encoder (FP16 + ORT CPU): ${modelPath.resolve("vision_encoder_fp16.onnx")}",
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
            val visOptFile = modelPath.resolve("vision_encoder_fp16_cpu_optimized.onnx")
            visOpts.setOptimizedModelFilePath(visOptFile.toString())
            val visOptions = HashMap<String, Any>()
            visOptions["sessionOptions"] = visOpts
            val visM = ai.djl.Model.newInstance("vision_encoder_fp16", "OnnxRuntime")
            visM.load(modelPath.resolve("vision_encoder_fp16.onnx"), null, visOptions)
            visionEncoder = ZooModel(visM, passThroughTranslator)
          }
          activeVisionLabel = "FP16 + ORT CPU (threads=$physicalCores)"
          log(AI.LogLevel.INFO, "Vision Encoder loaded ($activeVisionLabel)", " / QWEN", null)
        }
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

  /** Pre-computed vision encoder output, reusable across multiple questions on the same image. */
  private data class VisionResult(
      val imageEmbeds: ai.djl.ndarray.NDArray,
      val actualVisionTokens: Int,
      val mH: Int,
      val mW: Int
  )

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
    val translator = QwenVLTranslator(this.tokenizer!!) { _, _, _ -> }
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

    return VisionResult(imageEmbeds, actualVisionTokens, mH, mW)
  }

  /** Runs the decode loop for a single question, reusing pre-computed vision embeddings. */
  private fun runQwenDecode(
      manager: NDManager,
      decoderPredictor: Predictor<NDList, NDList>,
      question: String,
      vision: VisionResult
  ): String {
    // Build input_ids directly from tokenizer — avoids re-running the full image
    // preprocessing (resize, normalize, reshape) which is wasteful since vision
    // embeddings are already computed.
    val tokenizer = this.tokenizer!!
    val prePrompt =
        "<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n<|im_start|>user\n<|vision_start|>"
    val postPrompt = "<|vision_end|>\n$question<|im_end|>\n<|im_start|>assistant\n"
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
    for (i in 0 until maxTokens) {
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
          val reshapedVision =
              if (vision.imageEmbeds.shape.dimension() == 2) {
                vision.imageEmbeds.reshape(
                    1, vision.imageEmbeds.shape[0], vision.imageEmbeds.shape[1])
              } else {
                vision.imageEmbeds
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

      // Collect token id (decode once after loop to avoid per-token unicode issues)
      generatedIds.add(nextTokenId)

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
    while (osdPool.isNotEmpty()) TessAPI1.TessBaseAPIDelete(osdPool.poll())
    modelsReady = false
    super.shutdown(data)
  }
}
