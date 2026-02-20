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

  private val mean = floatArrayOf(0.481f, 0.458f, 0.408f)
  private val std = floatArrayOf(0.269f, 0.261f, 0.276f)

  override fun prepare(ctx: TranslatorContext) {
    // Ignored. We are using the globally loaded tokenizer.
  }

  override fun processInput(ctx: TranslatorContext, input: Pair<DjlImage, String>): NDList {
    val manager = ctx.ndManager
    val image = input.first
    val question = input.second

    // 1. Resize auf Vielfaches von 56
    val factor = 56
    val newW = (image.width / factor).coerceAtLeast(1) * factor
    val newH = (image.height / factor).coerceAtLeast(1) * factor
    val resized = image.resize(newW, newH, true)

    // 2. Normalisierung
    var array = resized.toNDArray(manager).transpose(2, 0, 1).toType(DataType.FLOAT32, false)
    val meanND = manager.create(mean).reshape(3, 1, 1)
    val stdND = manager.create(std).reshape(3, 1, 1)
    array = array.div(255f).sub(meanND).div(stdND)

    // 3. Patching
    val p = 14L
    val h = newH.toLong()
    val w = newW.toLong()
    val gridH = h / p
    val gridW = w / p

    val pixelValues =
        array
            .reshape(3L, gridH, p, gridW, p)
            .transpose(1, 3, 0, 2, 4)
            .reshape(gridH * gridW, 3 * p * p)

    // 4. Grid Fix
    val t = 1L
    val thwData = longArrayOf(t, gridH, gridW / 2)
    val imageGridThw = manager.create(thwData).reshape(1, 3)

    // 5. Tokenisierung (Now guaranteed to work!)
    val prompt =
        "<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n" +
            "<|im_start|>user\n<|vision_start|><|image_pad|><|vision_end|>$question<|im_end|>\n" +
            "<|im_start|>assistant\n"

    val ids = tokenizer.encode(prompt).ids
    val inputIdsND = manager.create(ids).reshape(1, ids.size.toLong())

    return NDList().apply {
      add(pixelValues.apply { name = "pixel_values" })
      add(imageGridThw.apply { name = "grid_thw" })
      add(inputIdsND.apply { name = "input_ids" })
    }
  }

  override fun processOutput(ctx: TranslatorContext, list: NDList): NDList = list
}

class QWEN2B164CPU : ONNX() {
  // toSafeF16 is no longer needed; engine handles types internally.
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

  // Use predictorPools from base class ONNX; do not redeclare or override
  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    log(AI.LogLevel.INFO, "Processing VQA request received")

    if (loadError != null) {
      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON, "{\"error\":\"Failed to load model: ${loadError?.message}\"}"))
    }
    if (!modelsReady || visionEncoder == null || decoderModel == null || tokenizer == null) {
      return PluginServletActionRetVal(
          ServletResponse(EResponseType.JSON, "{\"error\":\"Qwen-VL is not initialized.\"}"))
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
      return PluginServletActionRetVal(
          ServletResponse(EResponseType.JSON, "{\"error\":\"No questions asked.\"}"))
    }

    val finalResults = mutableMapOf<String, Map<String, String>>()
    try {
      val tokenizer =
          tokenizer
              ?: return PluginServletActionRetVal(
                  ServletResponse(EResponseType.JSON, "{\"error\":\"Tokenizer not loaded.\"}"))
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
                    val detectedAngle = 0 // OSD logic placeholder (implement if needed)
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
      return PluginServletActionRetVal(ServletResponse(EResponseType.JSON, jsonResponse))
    } catch (ex: Exception) {
      log(AI.LogLevel.ERROR, "Error processing VQA request: ${ex.message}", "", ex)
      return PluginServletActionRetVal(
          ServletResponse(EResponseType.JSON, "{\"error\":\"Processing error: ${ex.message}\"}"))
    }
  }

  override fun getName(): String = "CodBi_AI_Qwen_vQA"

  private fun ensureTokenizersNativeLibraries(): Boolean {
    val pluginRoot =
        pluginFolder
            ?: run {
              log(AI.LogLevel.ERROR, "Tokenizers natives: pluginFolder not initialized yet")
              return false
            }
    val runDir = TokenizersHelper.ensureTokenizersNativeLibraries(pluginRoot, this::log, 3)
    if (runDir == null) {
      log(AI.LogLevel.ERROR, "Failed to set up tokenizers native libraries via TokenizersHelper")
      return false
    }
    // Set java.library.path and RUST_LIBRARY_PATH as before
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
    log(AI.LogLevel.INFO, "Set RUST_LIBRARY_PATH to: ${libFile.absolutePath}")
    log(AI.LogLevel.INFO, "Tokenizers native libraries ready in: ${runDir.absolutePath}")
    return true
  }

  override fun initialize(configData: IPluginInitializeData) {
    // 0. Gate initialization by Active_AI: only initialize if explicitly enabled
    val activeAiRaw = configData.properties.getProperty("Active_AI") ?: ""
    val activeAi = activeAiRaw.lowercase()
    if (!activeAi.contains("qwen14b4cpu")) {
      log(
          AI.LogLevel.INFO,
          "QWEN14B4CPU initialization skipped because Active_AI='$activeAiRaw'",
          " / QWEN")
      qwenActive = false
      return
    }

    // 1. Grundlegende Pfade aus configData sofort setzen
    this.pluginFolder = configData.fileHelper.pluginFolder

    // 2. Deine spezifischen Pfade initialisieren (WICHTIG: VOR loadModels)
    // 'modelDir' kommt aus der Basisklasse ONNX, wir hängen unseren Unterordner an
    val baseModelDir = File(configData.fileHelper.pluginFolder, "ai/onnx/models")
    this.donutModelDir = File(baseModelDir, "qwen-vl")
    this.donutModelDir?.mkdirs()

    // 3. Tokenizer-Natives (Rust) bereitstellen
    ensureTokenizersNativeLibraries()

    // 4. Basis-Initialisierung (Kopiert ONNX-DLLs, registriert Engine)
    super.initialize(configData)

    // 5. Erst jetzt, wo Pfade UND Engine bereit sind, Modelle laden
    qwenActive = true
    if (onnxIsReady()) {
      try {
        ensureModelFiles() // Prüft/Downloadet die 4GB Dateien
        loadModels()
        this.modelsReady = true
      } catch (e: Exception) {
        this.loadError = e
        log(AI.LogLevel.ERROR, "Fehler beim Laden der Qwen-Modelle", "", e)
      }
    }
  }

  /**
   * Loads the Qwen-VL Vision Encoder and Decoder models using the ONNX Runtime engine. Ensures the
   * thread context classloader is set correctly for the formcycle environment.
   */
  private fun loadModels() {
    // 1. Lokale Referenz auf das Model-Verzeichnis (Null-Safety für Zeile 172)
    val safeModelDir =
        donutModelDir
            ?: throw IllegalStateException(
                "Modellverzeichnis (donutModelDir) ist nicht initialisiert.")
    val modelPath = safeModelDir.toPath()

    val oldClassLoader = Thread.currentThread().contextClassLoader

    try {
      // 2. ClassLoader auf das Plugin-JAR umbiegen (verhindert JNI-Fehler in Servlet-Containern)
      Thread.currentThread().contextClassLoader = this.javaClass.classLoader

      log(AI.LogLevel.INFO, "Initialisiere Qwen-Infrastruktur...", " / QWEN")

      // 3. ONNX Engine Check (verhindert 'OrtEnvironment already exists' Fehler)
      try {
        // Wir prüfen, ob die Engine über die Basisklasse bereits im Register ist
        ai.djl.engine.Engine.getEngine("OnnxRuntime")
        log(AI.LogLevel.INFO, "ONNX Runtime Engine ist bereit.", " / QWEN")
      } catch (e: Exception) {
        log(AI.LogLevel.INFO, "Registriere ONNX Engine manuell...", " / QWEN")
        ai.djl.engine.Engine.registerEngine(ai.djl.onnxruntime.engine.OrtEngineProvider())
      }

      // --- VISION ENCODER LADEN ---
      log(
          AI.LogLevel.INFO,
          "Lade Vision Encoder: ${modelPath.resolve("vision_encoder_fp16.onnx")}",
          " / QWEN")

      val visionCriteria =
          Criteria.builder()
              .setTypes(NDList::class.java, NDList::class.java)
              .optModelPath(modelPath.resolve("vision_encoder_fp16.onnx"))
              .optEngine("OnnxRuntime")
              .optOption("inter_op_num_threads", "1") // Verringert CPU-Last während Initialisierung
              .build()

      visionEncoder = visionCriteria.loadModel()

      // --- DECODER MODEL LADEN ---
      log(
          AI.LogLevel.INFO,
          "Lade Decoder Model (dieser Schritt benötigt ca. 4GB RAM)...",
          " / QWEN")
      val decoderCriteria =
          Criteria.builder()
              .setTypes(NDList::class.java, NDList::class.java)
              .optOption("memoryPatternOptimization", "false")
              .optOption("cpuArenaAllocator", "false")
              .optModelPath(modelPath.resolve("decoder_model_merged_q4.onnx"))
              .optEngine("OnnxRuntime")
              .build()
      decoderModel = decoderCriteria.loadModel()

      // --- EMBEDDING MODEL LADEN ---
      log(AI.LogLevel.INFO, "Lade Embedding Model...", " / QWEN")
      val embedCriteria =
          Criteria.builder()
              .setTypes(NDList::class.java, NDList::class.java)
              .optModelPath(modelPath.resolve("embed_tokens_fp16.onnx"))
              .optEngine("OnnxRuntime")
              .build()
      embedModel = embedCriteria.loadModel()

      // --- TOKENIZER & POOLS ---
      log(AI.LogLevel.INFO, "Initialisiere Tokenizer und Predictor-Pools...", " / QWEN")

      tokenizer = HuggingFaceTokenizer.newInstance(modelPath.resolve("tokenizer.json"))

      // Pools initialisieren (begrenzt auf 1, um OOM in formcycle zu vermeiden)
      initPredictorPools()

      log(AI.LogLevel.INFO, "Qwen-VL erfolgreich geladen und einsatzbereit.", " / QWEN")
    } catch (e: Exception) {
      // Spezielle Behandlung für das "OrtEnvironment"-Singleton Problem
      if (e.cause?.message?.contains("OrtEnvironment") == true ||
          e.message?.contains("already exists") == true) {
        log(
            AI.LogLevel.WARNING,
            "ONNX Environment ist bereits aktiv. Modelle werden eventuell trotzdem geladen...",
            " / QWEN")
      } else {
        log(
            AI.LogLevel.ERROR,
            "Kritischer Fehler beim Laden der Qwen-Modelle: ${e.message}",
            " / QWEN",
            e)
        throw e
      }
    } finally {
      // 4. ClassLoader unbedingt zurücksetzen
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

          override fun getBatchifier() = null // Disable batchifier to avoid extra batch dimension
        }

    // --- WICHTIG: POOL-GRÖSSE LIMITIEREN ---
    // Da Qwen ca. 4GB RAM pro Instanz schluckt, limitieren wir auf 1 (oder max 2 bei viel RAM)
    val maxParallelInferences = 1

    log(
        AI.LogLevel.INFO,
        "Initialisiere Qwen Predictor-Pools (Size: $maxParallelInferences)...",
        " / QWEN")

    // Encoder-Pool (Vision)
    if (!predictorPools.containsKey("qwen-encoder")) {
      val pool = LinkedBlockingQueue<Predictor<*, *>>()
      repeat(maxParallelInferences) { pool.offer(encoder.newPredictor(passThroughTranslator)) }
      predictorPools["qwen-encoder"] = pool
    }

    // Decoder-Pool (Sprache/Logik)
    if (!predictorPools.containsKey("qwen-decoder")) {
      val pool = LinkedBlockingQueue<Predictor<*, *>>()
      repeat(maxParallelInferences) { pool.offer(decoder.newPredictor(passThroughTranslator)) }
      predictorPools["qwen-decoder"] = pool
    }

    log(
        AI.LogLevel.INFO,
        "Predictor-Pools bereit. Parallele Inferenz limitiert auf $maxParallelInferences.",
        " / QWEN")
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

    // 2. Setup Loop Variables
    var currentInputIds = inputs[2]
    var pastKeyValues: NDList? = null
    var finalAnswer = ""
    var pastSeqLen = 0
    val numKv = 28
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
        val padIdx = ids.indexOf(imagePadTokenId)

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

          log(
              AI.LogLevel.INFO,
              "Vision injected. New embed shape: ${inputEmbeds.shape}",
              "AI / ONNX / QWEN",
              null)
        }
      }

      val currentSeqLen = inputEmbeds.shape[1].toInt()
      val totalSeqLen = pastSeqLen + currentSeqLen

      // C. Forward Pass inside a sub-manager
      val loopOutput =
          manager.newSubManager().use { sub ->
            val subInputs = NDList()

            // 1. Inputs Embeds (Length: currentSeqLen)
            subInputs.add(
                sub.create(inputEmbeds.toFloatArray()).reshape(inputEmbeds.shape).apply {
                  name = "inputs_embeds"
                })

            // 2. Attention Mask (Length: totalSeqLen)
            val attentionMask =
                sub.ones(ai.djl.ndarray.types.Shape(1, totalSeqLen.toLong()), DataType.INT64)
            subInputs.add(attentionMask.apply { name = "attention_mask" })

            // 3. Position IDs (Length: currentSeqLen) -> THIS STRICT MATCH FIXES THE `Mul_2` CRASH
            val posArray =
                LongArray(3 * 1 * currentSeqLen) { idx ->
                  val seqIdx = idx % currentSeqLen
                  (seqIdx + pastSeqLen).toLong()
                }
            subInputs.add(
                sub.create(posArray).reshape(3, 1, currentSeqLen.toLong()).apply {
                  name = "position_ids"
                })

            // 4. Past Key Values (Exact dynamic size, NO padding)
            if (pastKeyValues != null) {
              for (k in 0 until pastKeyValues!!.size) {
                val p = pastKeyValues!![k]
                subInputs.add(sub.create(p.toFloatArray()).reshape(p.shape).apply { name = p.name })
              }
            } else {
              for (j in 0 until numKv) {
                subInputs.add(
                    sub.zeros(ai.djl.ndarray.types.Shape(1, 2, 0L, kvHeadDim), DataType.FLOAT32)
                        .apply { name = "past_key_values.$j.key" })
                subInputs.add(
                    sub.zeros(ai.djl.ndarray.types.Shape(1, 2, 0L, kvHeadDim), DataType.FLOAT32)
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

      val logits = loopOutput[0]
      val nextTokenId = logits.get(0, -1).argMax(0).getLong()

      // D. Terminate on End-Of-String
      if (nextTokenId == 151643L || nextTokenId == 151645L) {
        loopOutput.close()
        break
      }

      finalAnswer += tokenizer!!.decode(longArrayOf(nextTokenId))

      // E. Prepare next iteration
      currentInputIds.close()
      currentInputIds = manager.create(longArrayOf(nextTokenId)).reshape(1, 1)

      // F. Update KV Cache dynamically
      val nextKVs = NDList()
      for (j in 0 until numKv) {
        val outK = loopOutput[1 + (j * 2)]
        val outV = loopOutput[2 + (j * 2)]
        val outLen = outK.shape[2].toInt()

        // Safely handle both single-step and concatenated output formats
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
    return finalAnswer.trim()
  }

  // [Rest of your Orientation and Servlet Logic remains unchanged...]

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
        log(AI.LogLevel.INFO, "Downloading model file: $name from $url", "AI / ONNX / QWEN", null)
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
        log(AI.LogLevel.INFO, "Downloaded $name ($sizeStr)", "AI / ONNX / QWEN")
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
        log(AI.LogLevel.INFO, "Model file already exists: $name ($sizeStr)", "AI / ONNX / QWEN")
      }
    }
  }

  // Use acquirePredictor and releasePredictor from base class ONNX; do not override

  override fun shutdown(data: IPluginShutdownData?) {
    while (osdPool.isNotEmpty()) TessAPI1.TessBaseAPIDelete(osdPool.poll())
    modelsReady = false
    super.shutdown(data)
  }
}
