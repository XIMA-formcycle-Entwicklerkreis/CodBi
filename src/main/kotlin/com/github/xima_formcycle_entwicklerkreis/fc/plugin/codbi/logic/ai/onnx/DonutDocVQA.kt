package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.onnx

// region Imports
import ai.djl.huggingface.tokenizers.HuggingFaceTokenizer
import ai.djl.modality.cv.Image as DjlImage
import ai.djl.modality.cv.ImageFactory
import ai.djl.ndarray.NDArray
import ai.djl.ndarray.NDList
import ai.djl.ndarray.types.DataType
import ai.djl.repository.zoo.Criteria
import ai.djl.repository.zoo.ZooModel
import ai.djl.translate.Batchifier
import ai.djl.translate.Translator
import ai.djl.translate.TranslatorContext
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.ONNX
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.io.File
import java.nio.file.Paths
import java.util.concurrent.CompletableFuture
import java.util.concurrent.ConcurrentHashMap

// endregion Imports

/**
 * The specific Translator logic for the [DonutDocVQAAction]. Handles resizing, prompt generation,
 * and the autoregressive decoding loop for ONNX models.
 */
class DocVQATranslator(
    private val modelDir: String,
    private val encoderModel: ZooModel<NDList, NDList>,
    private var decoderModel: ZooModel<NDList, NDList>?,
    protected val log: (importance: AI.LogLevel, toLog: String, exception: Throwable?) -> Unit
) : Translator<kotlin.Pair<DjlImage, String>, String> {

  /** The [HuggingFaceTokenizer] for text encoding/decoding. */
  private var tokenizer: HuggingFaceTokenizer? = null

  /** Cached predictor for encoder. */
  private var encoderPredictor: ai.djl.inference.Predictor<NDList, NDList>? = null

  /** Cached predictor for autoregressive decoding. */
  private var decoderPredictor: ai.djl.inference.Predictor<NDList, NDList>? = null

  /** Sets the encoder model and creates a predictor. */
  fun setEncoderModel(model: ZooModel<NDList, NDList>) {
    val passThroughTranslator =
        object : Translator<NDList, NDList> {
          override fun processInput(ctx: TranslatorContext, input: NDList) = input

          override fun processOutput(ctx: TranslatorContext, list: NDList) = list

          override fun getBatchifier() = Batchifier.STACK
        }
    encoderPredictor = model.newPredictor(passThroughTranslator)
  }

  /**
   * Sets the decoder model after it's loaded. Also creates a predictor from a separate model
   * instance for the autoregressive loop.
   */
  fun setDecoderModel(model: ZooModel<NDList, NDList>, loopModel: ZooModel<NDList, NDList>) {
    decoderModel = model
    val passThroughTranslator =
        object : Translator<NDList, NDList> {
          override fun processInput(ctx: TranslatorContext, input: NDList) = input

          override fun processOutput(ctx: TranslatorContext, list: NDList) = list

          override fun getBatchifier() = Batchifier.STACK
        }
    decoderPredictor = loopModel.newPredictor(passThroughTranslator)
  }

  /** Closes the cached predictors. */
  fun closePredictor() {
    encoderPredictor?.close()
    encoderPredictor = null
    decoderPredictor?.close()
    decoderPredictor = null
  }

  /** Initializes the tokenizer. */
  override fun prepare(ctx: TranslatorContext) {
    val oldClassLoader = Thread.currentThread().contextClassLoader
    try {
      Thread.currentThread().contextClassLoader = this.javaClass.classLoader

      if (System.getProperty("ai.djl.huggingface.tokenizers.version") == null)
          System.setProperty("ai.djl.huggingface.tokenizers.version", "0.31.0")

      val tokenizerPath = Paths.get(modelDir, "tokenizer.json")
      tokenizer = HuggingFaceTokenizer.newInstance(tokenizerPath)

      log(AI.LogLevel.INFO, "Tokenizer loaded from $tokenizerPath", null)
    } finally {
      Thread.currentThread().contextClassLoader = oldClassLoader
    }
  }

  /** Processes the input image and question, runs the encoder, and prepares decoder inputs. */
  override fun processInput(ctx: TranslatorContext, input: kotlin.Pair<DjlImage, String>): NDList {
    log(AI.LogLevel.INFO, "Processing DocVQA-Input (ONNX)", null)

    val manager = ctx.ndManager
    val image = input.first
    val question = input.second

    // region Image preprocessing
    val resizedImage = image.resize(960, 1280, true)
    var array = resizedImage.toNDArray(manager)
    array = array.transpose(2, 0, 1).toType(DataType.FLOAT32, false)

    val mean = manager.create(floatArrayOf(0.485f, 0.456f, 0.406f)).reshape(3, 1, 1)
    val std = manager.create(floatArrayOf(0.229f, 0.224f, 0.225f)).reshape(3, 1, 1)
    array = array.div(255.0f).sub(mean).div(std)

    val pixelValues = array
    log(AI.LogLevel.INFO, "Pixel values shape before encoder: ${pixelValues.shape}", null)
    // endregion Image preprocessing

    // region Run encoder
    val encPredictor =
        encoderPredictor ?: throw IllegalStateException("Encoder predictor not initialized")
    val encoderInput = NDList(pixelValues)
    log(
        AI.LogLevel.INFO,
        "Encoder input NDList size: ${encoderInput.size}, first array shape: ${encoderInput[0].shape}",
        null)

    try {
      val encoderOutput = encPredictor.predict(encoderInput)
      val encoderHiddenStates = encoderOutput[0]

      val encoderHiddenStatesDetached = encoderHiddenStates.duplicate()

      ctx.setAttachment("encoder_hidden_states", encoderHiddenStatesDetached)
      log(AI.LogLevel.INFO, "Encoder output shape: ${encoderHiddenStatesDetached.shape}", null)

      encoderOutput.close()
    } catch (e: Exception) {
      log(AI.LogLevel.ERROR, "Encoder prediction failed: ${e.message}", e)
      encoderInput.close()
      throw e
    }
    // endregion Run encoder

    // region Prompt encoding
    val prompt = "<s_docvqa><s_question>$question</s_question><s_answer>"
    var finalIDs = tokenizer?.encode(prompt)?.ids ?: longArrayOf()

    if (finalIDs.isNotEmpty() && finalIDs.last() == 2L) {
      finalIDs = finalIDs.dropLast(1).toLongArray()
    }

    ctx.setAttachment("promptIds", finalIDs)
    // endregion Prompt encoding

    val encoderHiddenStates =
        ctx.getAttachment("encoder_hidden_states") as? NDArray
            ?: throw IllegalStateException("Encoder hidden states not found in context")
    val decoderInputIds = manager.create(finalIDs)

    log(AI.LogLevel.INFO, "Starting decoding with prompt length ${finalIDs.size}", null)

    return NDList(decoderInputIds, encoderHiddenStates)
  }

  /** Autoregressive decoding loop. */
  override fun processOutput(ctx: TranslatorContext, list: NDList): String {
    log(AI.LogLevel.INFO, "Processing DocVQA-Output (ONNX)", null)

    val manager = ctx.ndManager
    val encoderHiddenStates =
        ctx.getAttachment("encoder_hidden_states") as? NDArray
            ?: throw IllegalStateException("Encoder hidden states not found")
    val promptIds = ctx.getAttachment("promptIds") as LongArray
    val currentIds = promptIds.toMutableList()

    try {
      val initialLogits = list[0]
      log(AI.LogLevel.INFO, "Initial logits shape: ${initialLogits.shape}", null)
      val seqLen = currentIds.size.toLong()
      val lastTokenLogits = initialLogits.get(seqLen - 1)
      var nextTokenId = lastTokenLogits.argMax(0).getLong()
      log(AI.LogLevel.INFO, "First predicted token ID: $nextTokenId", null)

      if (nextTokenId != 2L) currentIds.add(nextTokenId)

      val predictor =
          decoderPredictor ?: throw IllegalStateException("Decoder predictor not initialized")

      for (i in 0 until 50) {
        if (nextTokenId == 2L) break

        val currentArray = currentIds.toLongArray()
        val decoderInput = manager.create(currentArray)
        val inputs = NDList(decoderInput, encoderHiddenStates)
        val output = predictor.predict(inputs)
        val logits = output[0]
        log(AI.LogLevel.INFO, "Logits shape in loop: ${logits.shape}", null)
        val newSeqLen = currentArray.size.toLong()
        val lastLogits = logits.get(newSeqLen - 1)
        nextTokenId = lastLogits.argMax(0).getLong()
        log(AI.LogLevel.INFO, "Predicted token ID at step $i: $nextTokenId", null)

        decoderInput.close()
        output.close()

        if (nextTokenId == 2L) break
        currentIds.add(nextTokenId)
      }
    } catch (X: Exception) {
      println("Error in Donut generation loop: ${X.message}")
    } finally {
      val encoderOutput = ctx.getAttachment("encoder_output") as? NDList
      encoderOutput?.close()
    }

    log(AI.LogLevel.INFO, "Generated ${currentIds.size - promptIds.size} tokens", null)

    val answerIds = currentIds.drop(promptIds.size).toLongArray()
    val rawAnswer = tokenizer?.decode(answerIds) ?: ""
    log(AI.LogLevel.INFO, "Raw answer: $rawAnswer", null)
    return rawAnswer.replace("</s_answer>", "").replace("<s>", "").trim()
  }
}

/**
 * ONNX-based Donut Document Visual Question Answering Action.
 *
 * Activated by adding **DONUT** and **ONNX** to the **Active_AI** plugin property.
 */
class DonutDocVQAAction : ONNX() {

  companion object {
    val resModelFiles = listOf("donut-encoder.onnx", "donut-decoder.onnx", "tokenizer.json")
  }

  /** Tracks if DONUT is present in Active_AI. */
  private var donutActive = false

  /** The encoder model. */
  private var encoderModel: ZooModel<NDList, NDList>? = null

  /** The decoder model. */
  private var decoderModel: ZooModel<NDList, NDList>? = null

  /** Separate decoder model for autoregressive loop. */
  private var decoderModelForLoop: ZooModel<NDList, NDList>? = null

  /** The translator instance. */
  private var translator: DocVQATranslator? = null

  /** Directory containing model files. */
  private var donutModelDir: File? = null

  init {
    idLogMessages = "ONNX / DONUT"
  }

  override fun getName(): String = "CodBi_AI_Donut_vQA"

  /** Initializes DONUT models if Active_AI contains both DONUT and ONNX. */
  override fun initialize(configData: IPluginInitializeData) {
    super.initialize(configData)

    val activeAI = configData.properties.getProperty("Active_AI")?.lowercase() ?: ""
    donutActive = activeAI.contains("donut") && !activeAI.contains("donut_pytorch")

    if (!donutActive) {
      log(AI.LogLevel.INFO, "DONUT ONNX not activated")
      return
    }

    val aiRemove = configData.properties.getProperty("AI_Remove")?.lowercase() ?: ""
    if (aiRemove.contains("donut")) {
      cleanupDonutFiles()
      return
    }

    donutModelDir = File(modelDir, "donut-docvqa")
    donutModelDir?.mkdirs()

    val missingFiles = resModelFiles.filter { !File(donutModelDir, it).exists() }
    if (missingFiles.isNotEmpty()) {
      log(AI.LogLevel.INFO, "Missing model files: $missingFiles")
      return
    }

    try {
      log(AI.LogLevel.INFO, "Starting to load models")
      loadModels()
      log(AI.LogLevel.INFO, "DONUT ONNX models loaded successfully")
    } catch (X: Exception) {
      log(AI.LogLevel.ERROR, "Failed to load DONUT ONNX models: ${X.message}", "", X)
    }
  }

  /** Loads encoder and decoder ONNX models. */
  private fun loadModels() {
    log(AI.LogLevel.INFO, "donutModelDir: $donutModelDir")
    val modelPath =
        donutModelDir?.absolutePath ?: throw IllegalStateException("Model directory not set")
    log(AI.LogLevel.INFO, "Model path: $modelPath")

    val encoderFile = File(modelPath, "donut-encoder.onnx")
    val decoderFile = File(modelPath, "donut-decoder.onnx")
    log(
        AI.LogLevel.INFO,
        "Encoder file exists: ${encoderFile.exists()}, path: ${encoderFile.absolutePath}")
    log(
        AI.LogLevel.INFO,
        "Decoder file exists: ${decoderFile.exists()}, path: ${decoderFile.absolutePath}")

    log(AI.LogLevel.INFO, "Building encoder criteria...")
    val encoderCriteria =
        Criteria.builder()
            .setTypes(NDList::class.java, NDList::class.java)
            .optEngine("OnnxRuntime")
            .optModelPath(Paths.get(modelPath))
            .optOption("modelName", "donut-encoder")
            .build()

    log(AI.LogLevel.INFO, "Loading encoder model...")
    try {
      val oldClassLoader = Thread.currentThread().contextClassLoader
      try {
        Thread.currentThread().contextClassLoader = this.javaClass.classLoader
        encoderModel = encoderCriteria.loadModel() as ZooModel<NDList, NDList>
      } finally {
        Thread.currentThread().contextClassLoader = oldClassLoader
      }
      loadedModels["donut-encoder"] = encoderModel!!
      log(AI.LogLevel.INFO, "Encoder model loaded")
    } catch (X: Exception) {
      log(AI.LogLevel.ERROR, "Failed to load encoder: ${X.javaClass.name}: ${X.message}", "", X)
      X.cause?.let {
        log(AI.LogLevel.ERROR, "Caused by: ${it.javaClass.name}: ${it.message}", "", it)
      }
      throw X
    }

    val translatorInstance =
        DocVQATranslator(modelPath, encoderModel!!, null) { level, msg, exc ->
          log(level, msg, "", exc)
        }
    translator = translatorInstance
    translatorInstance.setEncoderModel(encoderModel!!)

    log(AI.LogLevel.INFO, "Building decoder criteria...")
    @Suppress("UNCHECKED_CAST")
    val decoderCriteria =
        Criteria.builder()
            .setTypes(Pair::class.java as Class<Pair<DjlImage, String>>, String::class.java)
            .optEngine("OnnxRuntime")
            .optModelPath(Paths.get(modelPath))
            .optOption("modelName", "donut-decoder")
            .optTranslator(
                translatorInstance as ai.djl.translate.Translator<Pair<DjlImage, String>, String>)
            .build()

    log(AI.LogLevel.INFO, "Loading decoder model...")
    decoderModel = decoderCriteria.loadModel() as ZooModel<NDList, NDList>
    loadedModels["donut-decoder"] = decoderModel!!

    log(AI.LogLevel.INFO, "Loading decoder model for autoregressive loop...")
    val loopCriteria =
        Criteria.builder()
            .setTypes(NDList::class.java, NDList::class.java)
            .optEngine("OnnxRuntime")
            .optModelPath(Paths.get(modelPath))
            .optOption("modelName", "donut-decoder")
            .build()
    decoderModelForLoop = loopCriteria.loadModel() as ZooModel<NDList, NDList>
    translatorInstance.setDecoderModel(decoderModel!!, decoderModelForLoop!!)

    log(AI.LogLevel.INFO, "Encoder and decoder models loaded")
  }

  /** Cleans up DONUT model files. */
  private fun cleanupDonutFiles() {
    donutModelDir?.deleteRecursively()
    log(AI.LogLevel.INFO, "DONUT ONNX files cleaned up")
  }

  /** Handles incoming requests. */
  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    log(AI.LogLevel.INFO, "DONUT ONNX execute called")
    if (!donutActive || !isActive) {
      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"DONUT ONNX is not active. donutActive=$donutActive, isActive=$isActive\"}"))
    }

    // Get questions from headers
    val questionsToAsk = mutableMapOf<String, String>()
    params.headerMap.forEach { (headerName, headerValue) ->
      if (headerName.startsWith("x-question-", ignoreCase = true)) {
        val key = headerName.lowercase().substringAfter("x-question-", "").lowercase()
        if (key.isNotBlank() && headerValue != null) {
          questionsToAsk[key] = headerValue
        }
      }
    }

    if (questionsToAsk.isEmpty()) {
      return errorResponse("No questions provided")
    }

    val finalResults = mutableMapOf<String, Map<String, String>>()

    try {
      params.uploadFiles?.forEach { (inputName, fileItem) ->
        log(AI.LogLevel.INFO, "Processing file: $inputName")

        val combinedBytes =
            fileItem.stream().use { stream ->
              stream.map { it.data }.reduce { acc, bytes -> acc + bytes }.orElse(byteArrayOf())
            }

        combinedBytes.inputStream().use { inputStream ->
          val djlImg = ImageFactory.getInstance().fromInputStream(inputStream)
          val results = ConcurrentHashMap<String, String>()

          val futures =
              questionsToAsk.map { (key, question) ->
                CompletableFuture.supplyAsync {
                  try {
                    decoderModel?.newPredictor()?.use { predictor ->
                      @Suppress("UNCHECKED_CAST")
                      val typedPredictor =
                          predictor as ai.djl.inference.Predictor<Pair<DjlImage, String>, String>
                      val answer = typedPredictor.predict(Pair(djlImg, question))
                      results[key] = answer
                    }
                  } catch (X: Exception) {
                    results[key] = "Error: ${X.message}"
                    log(AI.LogLevel.ERROR, "Error processing \"$question\": ${X.message}", "", X)
                  }
                }
              }

          CompletableFuture.allOf(*futures.toTypedArray()).join()
          finalResults[inputName] = results.toMap()
        }
      }

      val jsonResponse = buildString {
        append("{")
        finalResults.entries.forEachIndexed { fileIdx, (fileName, fileResults) ->
          if (fileIdx > 0) append(",")
          append("\"${fileName.replace("\"", "\\\"")}\":{")
          fileResults.entries.forEachIndexed { idx, (key, value) ->
            if (idx > 0) append(",")
            append("\"${key.replace("\"", "\\\"")}\": \"${value.replace("\"", "\\\"")}\"")
          }
          append("}")
        }
        append("}")
      }

      return PluginServletActionRetVal(ServletResponse(EResponseType.JSON, jsonResponse))
    } catch (X: Exception) {
      log(AI.LogLevel.ERROR, "Error processing request: ${X.message}", "", X)
      return errorResponse("Processing error: ${X.message}")
    }
  }

  /** Creates an error response. */
  private fun errorResponse(message: String): IPluginServletActionRetVal {
    return PluginServletActionRetVal(
        ServletResponse(EResponseType.JSON, "{\"error\":\"$message\"}"))
  }

  /** Shuts down and releases resources. */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    translator?.closePredictor()
    encoderModel?.close()
    decoderModel?.close()
    decoderModelForLoop?.close()
    encoderModel = null
    decoderModel = null
    decoderModelForLoop = null
    translator = null
    donutActive = false

    super.shutdown(shutdownData)
    log(AI.LogLevel.INFO, "DONUT ONNX shutdown complete")
  }
}
