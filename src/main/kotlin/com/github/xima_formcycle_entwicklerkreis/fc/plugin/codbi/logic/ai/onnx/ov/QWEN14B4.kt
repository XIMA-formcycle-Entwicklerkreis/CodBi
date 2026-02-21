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
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.ONNX
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.onnx.TokenizersHelper
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

class QWEN2B164CPU : ONNX() {
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
    log(AI.LogLevel.INFO, "Processing VQA request received", " / QWEN", null)

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
              questionsToAsk.forEach { (key, question) ->
                try {
                  results[key] =
                      runQwenInference(manager, visionPredictor, decoderPredictor, djlImg, question)
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

      log(
          AI.LogLevel.INFO,
          "Lade Vision Encoder: ${modelPath.resolve("vision_encoder_fp16.onnx")}",
          " / QWEN",
          null)

      val visionCriteria =
          Criteria.builder()
              .setTypes(NDList::class.java, NDList::class.java)
              .optModelPath(modelPath.resolve("vision_encoder_fp16.onnx"))
              .optEngine("OnnxRuntime")
              .optOption("inter_op_num_threads", "1")
              .build()

      visionEncoder = visionCriteria.loadModel()

      log(
          AI.LogLevel.INFO,
          "Lade Decoder Model (dieser Schritt benötigt ca. 4GB RAM)...",
          " / QWEN",
          null)
      val decoderCriteria =
          Criteria.builder()
              .setTypes(NDList::class.java, NDList::class.java)
              .optOption("memoryPatternOptimization", "false")
              .optOption("cpuArenaAllocator", "false")
              .optModelPath(modelPath.resolve("decoder_model_merged_q4.onnx"))
              .optEngine("OnnxRuntime")
              .build()
      decoderModel = decoderCriteria.loadModel()

      log(AI.LogLevel.INFO, "Lade Embedding Model...", " / QWEN", null)
      val embedCriteria =
          Criteria.builder()
              .setTypes(NDList::class.java, NDList::class.java)
              .optModelPath(modelPath.resolve("embed_tokens_fp16.onnx"))
              .optEngine("OnnxRuntime")
              .build()
      embedModel = embedCriteria.loadModel()

      log(AI.LogLevel.INFO, "Initialisiere Tokenizer und Predictor-Pools...", " / QWEN", null)

      tokenizer = HuggingFaceTokenizer.newInstance(modelPath.resolve("tokenizer.json"))
      initPredictorPools()

      log(AI.LogLevel.INFO, "Qwen-VL erfolgreich geladen und einsatzbereit.", " / QWEN", null)
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

  private fun initPredictorPools() {
    val encoder = visionEncoder ?: return
    val decoder = decoderModel ?: return

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

    log(
        AI.LogLevel.INFO,
        "Predictor-Pools bereit. Parallele Inferenz limitiert auf $maxParallelInferences.",
        " / QWEN",
        null)
  }

  private fun runQwenInference(
      manager: NDManager,
      visionPredictor: Predictor<NDList, NDList>,
      decoderPredictor: Predictor<NDList, NDList>,
      image: DjlImage,
      question: String
  ): String {
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

    // 1. Vision Encoding
    val inputs = translator.processInput(ctx, Pair(image, question))

    val visionOutput =
        visionPredictor.predict(
            NDList(
                inputs[0].apply { name = "pixel_values" }, inputs[1].apply { name = "grid_thw" }))
    val imageEmbeds = visionOutput[0]

    // DYNAMIC 3D GRID CALCULATION
    // Vision encoder output is post-spatial-merge: [numMergedPatches, hidden_size]
    var actualVisionTokens =
        if (imageEmbeds.shape.dimension() == 2) imageEmbeds.shape[0].toInt()
        else imageEmbeds.shape[1].toInt()

    // Validate against grid_thw: after spatial merge, expected = gridT * (gridH/2) * (gridW/2)
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
      // Fallback: try to factor actualVisionTokens into mH x mW
      val root = Math.sqrt(actualVisionTokens.toDouble()).toInt()
      for (i in root downTo 1) {
        if (actualVisionTokens % i == 0) {
          mH = i
          mW = actualVisionTokens / i
          break
        }
      }
    }

    // 2. Setup Loop Variables
    var currentInputIds = inputs[2]
    var pastKeyValues: NDList? = null
    val generatedIds = mutableListOf<Long>()
    var pastSeqLen = 0
    var padIdx = -1
    var logicalPos = 0L
    val numKv = 28
    // Qwen2-VL-2B: hidden_size=1536, num_attention_heads=12, num_key_value_heads=2 → head_dim=128
    val numKvHeads = 2L
    val kvHeadDim = 128L

    val embedPredictor =
        embedModel?.newPredictor(
            object : Translator<NDList, NDList> {
              override fun processInput(ctx: TranslatorContext, input: NDList) = input

              override fun processOutput(ctx: TranslatorContext, list: NDList) = list

              override fun getBatchifier() = null
            }) ?: throw IllegalStateException("No predictor available for embed-tokens")

    // 3. Decoding Loop
    for (i in 0 until maxTokens) {
      var inputEmbeds = embedPredictor.predict(NDList(currentInputIds))[0]

      // B. VISION INJECTION: Splice vision features on first step
      if (i == 0) {
        val ids = currentInputIds.toLongArray()
        val imagePadTokenId = 151655L
        padIdx = ids.indexOf(imagePadTokenId)

        if (padIdx != -1) {
          val reshapedVision =
              if (imageEmbeds.shape.dimension() == 2) {
                imageEmbeds.reshape(1, imageEmbeds.shape[0], imageEmbeds.shape[1])
              } else {
                imageEmbeds
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

      // C. Forward Pass inside a sub-manager
      val loopOutput =
          manager.newSubManager().use { sub ->
            val subInputs = NDList()

            // 1. Inputs Embeds
            subInputs.add(
                sub.create(inputEmbeds.toFloatArray()).reshape(inputEmbeds.shape).apply {
                  name = "inputs_embeds"
                })

            // 2. Attention Mask
            // Follow ONNX export spec: 2D INT64 mask (batch, seq_len) with ones.
            val attentionMaskShape = ai.djl.ndarray.types.Shape(1, totalSeqLen.toLong())
            val attentionMask = sub.ones(attentionMaskShape, DataType.INT64)
            subInputs.add(attentionMask.apply { name = "attention_mask" })

            // 3. Position IDs (Dynamic 3D mRoPE implementation)
            // Shape: (3, batch=1, seq_len) where dim 0 = [temporal_ids, height_ids, width_ids]
            val posArray = LongArray(3 * currentSeqLen)

            if (i == 0 && padIdx != -1 && inputEmbeds.shape[1] > 1) {
              // Spatial "island" for merged image tokens with mRoPE coordinates.
              // mH = mergedGridH, mW = mergedGridW from the vision encoder output.
              val stepPadIdx = padIdx
              for (pos in 0 until currentSeqLen) {
                if (pos >= stepPadIdx && pos < stepPadIdx + actualVisionTokens) {
                  // VISION COORDINATES: T stays at logicalPos, H/W get offsets
                  val gridPos = pos - stepPadIdx
                  val hPos = (gridPos / mW).toLong()
                  val wPos = (gridPos % mW).toLong()
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
                  if (pos == stepPadIdx + actualVisionTokens - 1) {
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

            subInputs.add(
                sub.create(posArray)
                    .toType(DataType.INT64, false)
                    .reshape(3L, 1L, currentSeqLen.toLong())
                    .apply { name = "position_ids" })

            // 4. Past Key Values
            if (pastKeyValues != null) {
              for (k in 0 until pastKeyValues!!.size) {
                val p = pastKeyValues!![k]
                subInputs.add(sub.create(p.toFloatArray()).reshape(p.shape).apply { name = p.name })
              }
            } else {
              for (j in 0 until numKv) {
                subInputs.add(
                    sub.zeros(
                            ai.djl.ndarray.types.Shape(1, numKvHeads, 0L, kvHeadDim),
                            DataType.FLOAT32)
                        .apply { name = "past_key_values.$j.key" })
                subInputs.add(
                    sub.zeros(
                            ai.djl.ndarray.types.Shape(1, numKvHeads, 0L, kvHeadDim),
                            DataType.FLOAT32)
                        .apply { name = "past_key_values.$j.value" })
              }
            }

            val subOut = decoderPredictor.predict(subInputs)

            val parentOut = NDList()
            for (o in subOut) {
              parentOut.add(manager.create(o.toFloatArray(), o.shape).apply { name = o.name })
            }

            subOut.close()
            parentOut
          }

      // ROBUST LOGIT EXTRACTION
      val logits = loopOutput[0]
      val nextTokenId =
          if (logits.shape.dimension() == 3) {
            logits.get(":, -1, :").squeeze().argMax().getLong()
          } else {
            logits.get("-1, :").squeeze().argMax().getLong()
          }

      // D. Terminate on End-Of-String
      if (nextTokenId == 151643L || nextTokenId == 151645L) {
        loopOutput.close()
        break
      }

      // Collect token id (decode once after loop to avoid per-token unicode issues)
      generatedIds.add(nextTokenId)

      // E. Prepare next iteration
      currentInputIds.close()
      currentInputIds = manager.create(longArrayOf(nextTokenId)).reshape(1, 1)

      // F. Update KV Cache dynamically
      val nextKVs = NDList()
      for (j in 0 until numKv) {
        val outK = loopOutput[1 + (j * 2)]
        val outV = loopOutput[2 + (j * 2)]
        val outLen = outK.shape[2].toInt()

        val finalK =
            if (outLen == totalSeqLen) {
              outK
            } else if (outLen == currentSeqLen && pastKeyValues != null) {
              pastKeyValues!![j * 2].concat(outK, 2)
            } else outK

        val finalV =
            if (outV.shape[2].toInt() == totalSeqLen) {
              outV
            } else if (outV.shape[2].toInt() == currentSeqLen && pastKeyValues != null) {
              pastKeyValues!![j * 2 + 1].concat(outV, 2)
            } else outV

        nextKVs.add(finalK.duplicate().apply { name = "past_key_values.$j.key" })
        nextKVs.add(finalV.duplicate().apply { name = "past_key_values.$j.value" })
      }

      pastKeyValues?.close()
      pastKeyValues = nextKVs

      pastSeqLen += currentSeqLen
    }

    embedPredictor.close()

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
