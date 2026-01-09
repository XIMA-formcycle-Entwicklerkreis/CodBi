package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai

// region Imports
// region DJL
// endregion DJL
// region XIMA
// endregion XIMA
import ai.djl.huggingface.tokenizers.HuggingFaceTokenizer
import ai.djl.modality.cv.Image as DjlImage
import ai.djl.modality.cv.ImageFactory
import ai.djl.modality.cv.util.NDImageUtils
import ai.djl.ndarray.NDArray
import ai.djl.ndarray.NDList
import ai.djl.ndarray.types.DataType
import ai.djl.repository.zoo.Criteria
import ai.djl.training.ParameterStore
import ai.djl.translate.Translator
import ai.djl.translate.TranslatorContext
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeValidationResult
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginValidationData
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.io.File
import java.nio.file.Paths

// endregion Imports

/**
 * The specific Translator logic for the [DonutDocVQAAction]. Handles resizing, prompt generation,
 * and the autoregressive decoding loop.
 *
 * ## Model
 * Find all infos about the model on [HuggingFace](https://huggingface.co/Callari/donut-docvqa).
 */
class DocVQATranslator(
    private val modelDir: String,
    protected val log: (importance: AI.LogLevel, toLog: String) -> Unit
) : Translator<kotlin.Pair<DjlImage, String>, String> {
  /**
   * The [HuggingFaceTokenizer] needed to translate the tokens received into human-readable
   * [String]s and the questions to ask into model-readable tokens.
   */
  private var tokenizer: HuggingFaceTokenizer? = null

  /**
   * Sets **ai.djl.huggingface.tokenizers.version**, if not already done and initializes the
   * [tokenizer].
   *
   * @param ctx See [Translator.prepare].
   */
  override fun prepare(ctx: TranslatorContext) {
    val oldClassLoader = Thread.currentThread().contextClassLoader
    try {
      Thread.currentThread().contextClassLoader = this.javaClass.classLoader

      if (System.getProperty("ai.djl.huggingface.tokenizers.version") == null)
          System.setProperty("ai.djl.huggingface.tokenizers.version", "0.31.0")

      val tokenizerPath = Paths.get(modelDir, "tokenizer.json")

      tokenizer = HuggingFaceTokenizer.newInstance(tokenizerPath)
    } finally {
      Thread.currentThread().contextClassLoader = oldClassLoader
    }
  }

  /**
   * Transforms the incoming [DjlImage] in into a format that is appropriate for the **model** as it
   * also transforms the Question-[String] into the tokens the model does understand, add the
   * necessary tags around the question.
   *
   * @param ctx See [Translator.processInput].
   * @param input See [Translator.processInput].
   * @return See [Translator.processInput]
   */
  override fun processInput(ctx: TranslatorContext, input: kotlin.Pair<DjlImage, String>): NDList {
    log(AI.LogLevel.INFO, "Processing DocVQA-Input.")

    val manager = ctx.ndManager
    val image = input.first
    val question = input.second

    // region Image processing
    var array = image.toNDArray(manager)
    if (array.shape.dimension() == 4) array = array.squeeze(0)

    array = NDImageUtils.resize(array, 960, 1280)
    array = array.transpose(2, 0, 1)

    var pixelValues = array.toType(DataType.FLOAT32, false).div(255.0f)
    val mean = manager.create(floatArrayOf(0.485f, 0.456f, 0.406f)).reshape(3, 1, 1)
    val std = manager.create(floatArrayOf(0.229f, 0.224f, 0.225f)).reshape(3, 1, 1)

    pixelValues = pixelValues.sub(mean).div(std)
    // endregion Image processing
    ctx.setAttachment("pixel_values", pixelValues.expandDims(0))

    // region Create proper prompt
    val prompt = "<s_docvqa><s_question>$question</s_question><s_answer>"
    val encoding = tokenizer!!.encode(prompt)
    var finalIDs = encoding.ids
    // endregion Create proper prompt
    log(AI.LogLevel.INFO, "--- Incoming Request Generated IDs ---")

    finalIDs.forEach { id -> println("${id}") }

    log(AI.LogLevel.INFO, "-----------------DONE-----------------")
    // region Avoid no generation cause of final stop token
    if (finalIDs.isNotEmpty() && finalIDs.last() == 2L) {
      finalIDs = finalIDs.dropLast(1).toLongArray()
    }
    // endregion Avoid no generation cause of final stop token
    ctx.setAttachment("promptIds", finalIDs)

    val decoderInputIds = manager.create(finalIDs)

    return NDList(pixelValues.squeeze(), decoderInputIds.squeeze())
  }

  /**
   * Process the model's answer and turn it into a human-readable [String].
   *
   * @param ctx See [Translator.processOutput].
   * @param list See [Translator.processOutput].
   * @return See [Translator.processOutput].
   */
  override fun processOutput(ctx: TranslatorContext, list: NDList): String {
    log(AI.LogLevel.INFO, "Processing DocVQA-Output")

    val manager = ctx.ndManager
    val ps = ParameterStore(manager, false)
    val pixelValues =
        ctx.getAttachment("pixel_values") as? NDArray
            ?: throw IllegalStateException("Pixel values not found")
    val promptIds = ctx.getAttachment("promptIds") as LongArray
    val currentIds = promptIds.toMutableList()

    log(AI.LogLevel.INFO, "--- Incoming Output Received IDs ---")

    try {
      // region Autoregression
      for (i in 0 until 50) {
        val currentArray = currentIds.toLongArray()
        val currentSize = currentArray.size.toLong()
        val decoderInput = manager.create(currentArray).reshape(1, currentSize)
        val inputs = NDList(pixelValues, decoderInput)
        val output = ctx.model.block.forward(ps, inputs, false) as NDList
        val logits = output[0]
        val lastTokenLogits = logits.get(0).get(currentSize - 1)
        val nextTokenId = lastTokenLogits.argMax(0).getLong()

        log(AI.LogLevel.INFO, "Token: $nextTokenId.")

        decoderInput.close()
        output.close()
        lastTokenLogits.close()

        if (nextTokenId == 2L) break

        currentIds.add(nextTokenId)
      }
    } catch (X: Exception) {
      println("Error in Donut generation loop: ${X.message}")
    } finally {
      pixelValues.close()
    }
    // endregion Autoregression
    log(AI.LogLevel.INFO, "-----------------DONE-----------------")

    val answerIds = currentIds.drop(promptIds.size).toLongArray()
    val rawAnswer = tokenizer?.decode(answerIds) ?: ""

    return rawAnswer.replace("</s_answer>", "").replace("<s>", "").trim()
  }
}

/**
 * Processes uploaded images and answers questions about them.
 *
 * #### Header Parameters:
 * - X-Question-{key}: Question to ask about the document, where {key} is the result key (e.g.,
 *   X-Question-total: "Total?", X-Question-date: "Date?")
 *
 * #### Resources
 * On **Disk** the model takes up about **800MB** while in **RAM** it will need about **1GB**.
 */
class DonutDocVQAAction : PyTorch<kotlin.Pair<DjlImage, String>, String>() {
  /** See [PyTorch.resModelFiles]. */
  override val resModelBaseURL = "https://huggingface.co/Callari/donut-docvqa/resolve/main"
  /** See [PyTorch.modelName] */
  override val modelName = "donut-docvqa"
  /** See [PyTorch.modelName] */
  override val resModelFiles =
      listOf(
          "donut-docvqa.pt",
          "config.json",
          "tokenizer.json",
          "added_tokens.json",
          "special_tokens_map.json")

  /** Tracks if **DONUT** is present in the **AI_Remove** plugin property. */
  private var isDonutInAIRemove = false
  /** Tracks if **DONUT** is present in the **Active_AI** plugin property. */
  private var isDonutInActiveAI = false

  /**
   * Generates the [Criteria] defining how the model shall behave.
   *
   * @param modelDir The directory the
   */
  override fun buildCriteria(modelDir: File): Criteria<kotlin.Pair<DjlImage, String>, String> {
    log(LogLevel.INFO, "Building criteria with following model URL: ${modelDir.toURI().toString()}")
    return Criteria.builder()
        .setTypes(
            kotlin.Pair::class.java as Class<kotlin.Pair<DjlImage, String>>, String::class.java)
        .optModelUrls(modelDir.toURI().toString())
        .optModelName("donut-docvqa")
        .optEngine("PyTorch")
        .optOption("model_file", "donut_docvqa.pt") // Matches logic in base class renaming
        .optOption("trainParam", "false")
        .optOption("mapLocation", "true")
        .optOption("precxx11", "true")
        .optTranslator(DocVQATranslator(modelDir.absolutePath, this::log))
        .build()
  }

  override fun getName(): String? {
    // if( initialized.get()) return "DummyToAvoid_C10_Exception_${System.currentTimeMillis()}"

    return "CodBi_AI_Donut_QA"
  }

  /**
   * Removes the Donut DocVQA model from shared registry, cleans up this instance's memory and pool,
   * and deletes the model directory and files.
   *
   * @param pluginFolder The plugin folder where the model directory is located.
   */
  private fun removeDonutDocVQAModel(pluginFolder: File) {
    log(
        LogLevel.INFO,
        "AI_Remove property contains 'PT_DONUT_QA'. Removing Donut DocVQA model files and directory.")

    removeSharedModel(this.javaClass)

    while (pool.isNotEmpty()) pool.poll()?.close()

    model?.close()

    model = null

    initialized.set(false)

    val modelDir = File(pluginFolder, "ai/pytorch/models/$modelName")

    if (modelDir.exists()) {
      log(LogLevel.INFO, "Removing model directory: ${modelDir.absolutePath}")

      try {
        modelDir.deleteRecursively()
        log(LogLevel.INFO, "Successfully removed model directory: ${modelDir.absolutePath}")
      } catch (e: Exception) {
        log(
            LogLevel.ERROR,
            "Failed to remove model directory: ${modelDir.absolutePath}. Error: ${e.message}")
      }
    }
  }

  /**
   * Activates the **DONUT Q&A** model if the plugin's property **Active_AI** contains **DONUT**
   * (case-insensitive). Model-Data that has been downloaded can be automatically be removed by
   * adding **PT_DONUT_QA** to the plugin property **AI_Remove**.
   *
   * @param configData Provided by the Formcycle environment.
   */
  override fun initialize(configData: IPluginInitializeData) {
    val aiRemove = configData.properties.getProperty("AI_Remove")?.lowercase() ?: ""
    val activeAI = configData.properties.getProperty("Active_AI")?.lowercase() ?: ""

    isDonutInAIRemove = aiRemove.contains("donut")
    isDonutInActiveAI = activeAI.contains("donut")

    // region Check for AI_Remove property
    if (aiRemove.contains("pt_donut_qa")) {
      removeDonutDocVQAModel(configData.fileHelper.pluginFolder)

      return
    }
    // endregion Check for AI_Remove property
    if (!isDonutInActiveAI) return

    log(LogLevel.INFO, "Initializing PyTorch / Donut Q&A.")

    super.initialize(configData)
  }

  /**
   * Performs the actual request to the model by first identifying the questions to ask from the
   * received header, retrieving the uploaded file and do a [PyTorch.predict]ion with this data.
   * Once all questions have been asked and the responses received everything is sent back to the
   * client. Asking multiple questions for multiple images is supported. The question got to be in
   * the header like "**X-Question-{QuestionID}:What is the total?**"
   *
   * @param params
   * @return A proper message if this model is not [PyTorch.initialized] cause **DONUT** is missing
   *   in the Plugin-Property **Active_AI**, **DONUT** is not included in **AI_Remove** or both
   *   cases apply. With the model being [PyTorch.initialized], at least one image uploaded and at
   *   least one question in the header, the return value will be a JSON like: { "Image1filename": {
   *   "IdOfFirstQuestion":"Result, ... }, "Image2filename":{ ... }}
   */
  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    // region Check for AI_Remove
    if (isDonutInAIRemove)
        if (isDonutInActiveAI)
            return PluginServletActionRetVal(
                ServletResponse(
                    EResponseType.JSON,
                    "{\"error\":\"This model is excluded by having \\\"DONUT\\\" in the Plugin-Property \\\"AI_Remove\\\" and also included in \\\"Active_AI\\\". Remove DONUT from AI_Remove to be able to use this model.\"}"))
        else
            return PluginServletActionRetVal(
                ServletResponse(
                    EResponseType.JSON,
                    "{\"error\":\"This model is excluded by having \\\"DONUT\\\" in the Plugin-Property \\\"AI_Remove\\\". Remove DONUT from there to be able to use this model.\"}"))
    // endregion Check for AI_Remove (before Active_AI check)
    if (!initialized.get())
        return PluginServletActionRetVal(
            ServletResponse(
                EResponseType.JSON,
                "{\"error\":\"PyTorch DONUT DocV Q&A has not been activated. Add \\\"DONUT\\\" to the CodBi-Plugin-Property \\\"Active_AI\\\" in order to use this model.\"}"))

    log(LogLevel.INFO, "Processing incoming DocVQA-Request.")
    // region Determine questions to ask
    val questionsToAsk = mutableMapOf<String, String>()

    params.headerMap.forEach { (headerName, headerValue) ->
      if (headerName.startsWith("x-question-", ignoreCase = true)) {
        val key = headerName.lowercase().substringAfter("x-question-", "").lowercase()

        if (key.isNotBlank() && headerValue != null) {
          questionsToAsk[key] = headerValue

          log(
              LogLevel.INFO,
              "Found question header: $headerName -> key: '$key', question: '$headerValue'")
        }
      }
    }
    // region Determine questions to ask
    if (questionsToAsk.isEmpty()) {
      log(
          LogLevel.WARNING,
          "No X-Question-* headers found in request. No questions will be processed.")

      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"No questions provided. Please include X-Question-{key} headers with question text.\"}"))
    }

    val finalResults = mutableMapOf<String, Map<String, String>>()

    try {
      params.uploadFiles?.forEach { (inputName, fileItem) ->
        log(LogLevel.INFO, "Processing file: $inputName.")

        val combinedBytes =
            fileItem.stream().use { stream ->
              stream.map { it.data }.reduce { acc, bytes -> acc + bytes }.orElse(byteArrayOf())
            }

        combinedBytes.inputStream().use { inputStream ->
          val djlImg = ImageFactory.getInstance().fromInputStream(inputStream)
          val fileResults = mutableMapOf<String, String>()

          questionsToAsk.forEach { (key, question) ->
            log(LogLevel.INFO, "Asking \"$question\" ($key).")

            try {
              val answer = predict(Pair(djlImg, question))

              fileResults[key] = answer
            } catch (X: Throwable) {
              fileResults[key] = "Error: ${ X.message }"
            } catch (X: IllegalStateException) {
              log(LogLevel.INFO, "Pool depleted")

              fileResults[key] = "Error: ${ X.message }"
            }
          }

          finalResults[inputName] = fileResults
        }
      }
    } catch (X: Exception) {
      logger.error("Execution failed", X)

      return PluginServletActionRetVal(
          ServletResponse(EResponseType.JSON, "{\"error\":\"${ X.message}\"}"))
    }

    val jsonParts =
        finalResults.map { (filename, fields) ->
          val fieldJson =
              fields.entries.joinToString(",") { (k, v) ->
                "\"$k\":\"${v.replace("\"", "").replace("\n", " ")}\""
              }
          "\"$filename\": { $fieldJson }"
        }
    val jsonResponse = jsonParts.joinToString(",", "{", "}")

    return PluginServletActionRetVal(
        ServletResponse(EResponseType.JSON).apply { value = jsonResponse })
  }

  /**
   * Invokes [PyTorch.shutdown].
   *
   * @param shutdownData Provided by the Formcycle environment.
   */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    super.shutdown(shutdownData)
  }

  /**
   * Acquires the value of **Active_AI** and **AI_Remove** while removing the model data if
   * **AI_Remove** contains the keyword **DONUT**.
   *
   * @param configData Provided by the Formcycle environment.
   * @return Always **NULL**.
   */
  override fun validateConfigurationData(
      configData: IPluginValidationData
  ): IPluginInitializeValidationResult? {
    val aiRemove = configData.properties.getProperty("AI_Remove")?.lowercase() ?: ""
    val activeAI = configData.properties.getProperty("Active_AI")?.lowercase() ?: ""

    isDonutInAIRemove = aiRemove.contains("donut")
    isDonutInActiveAI = activeAI.contains("donut")

    if (aiRemove.contains("pt_donut_qa")) removeDonutDocVQAModel(configData.fileHelper.pluginFolder)

    return null
  }

  /**
   * Invokes [PyTorch.log] with the specified parameter and " / Donut DocV Q&A" + the specified
   * [adjenct].
   */
  override fun log(importance: LogLevel, toLog: String, adjenct: String) {
    super.log(importance, toLog, " / Donut DocV Q&A$adjenct")
  }
}
