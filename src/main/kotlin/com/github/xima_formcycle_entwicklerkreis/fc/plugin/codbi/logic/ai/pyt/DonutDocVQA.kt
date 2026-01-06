package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai

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

/** Concrete Implementation of the PyTorch wrapper for Donut DocVQA. */

/**
 * The specific Translator logic for Donut DocVQA. Handles resizing, prompt generation, and the
 * autoregressive decoding loop.
 */
class DocVQATranslator(
    private val modelDir: String,
    protected val log: (importance: AI.LogLevel, toLog: String) -> Unit
) : Translator<kotlin.Pair<DjlImage, String>, String> {
  private var tokenizer: HuggingFaceTokenizer? = null

  override fun prepare(ctx: TranslatorContext) {
    // Safe classloading for HuggingFace Tokenizer
    val oldClassLoader = Thread.currentThread().contextClassLoader
    try {
      Thread.currentThread().contextClassLoader = this.javaClass.classLoader
      if (System.getProperty("ai.djl.huggingface.tokenizers.version") == null) {
        System.setProperty("ai.djl.huggingface.tokenizers.version", "0.31.0")
      }
      val tokenizerPath = Paths.get(modelDir, "tokenizer.json")
      tokenizer = HuggingFaceTokenizer.newInstance(tokenizerPath)
    } finally {
      Thread.currentThread().contextClassLoader = oldClassLoader
    }
  }

  override fun processInput(ctx: TranslatorContext, input: kotlin.Pair<DjlImage, String>): NDList {
    log(AI.LogLevel.INFO, "Processing DocVQA-Input.")
    val manager = ctx.ndManager
    val image = input.first
    val question = input.second

    // 1. Image Preprocessing (Standard Donut normalization)
    var array = image.toNDArray(manager)
    if (array.shape.dimension() == 4) array = array.squeeze(0)

    array = NDImageUtils.resize(array, 960, 1280)
    array = array.transpose(2, 0, 1)

    var pixelValues = array.toType(DataType.FLOAT32, false).div(255.0f)
    val mean = manager.create(floatArrayOf(0.485f, 0.456f, 0.406f)).reshape(3, 1, 1)
    val std = manager.create(floatArrayOf(0.229f, 0.224f, 0.225f)).reshape(3, 1, 1)
    pixelValues = pixelValues.sub(mean).div(std)

    // Save 4D for the manual loop in processOutput
    ctx.setAttachment("pixel_values", pixelValues.expandDims(0))

    // 2. Prompt Construction
    val prompt = "<s_docvqa><s_question>$question</s_question><s_answer>"
    val encoding = tokenizer!!.encode(prompt)
    var finalIDs = encoding.ids
    // region Logging
    log(AI.LogLevel.INFO, "--- Incoming Request Generated IDs ---")
    println("Prompt: $prompt")

    finalIDs.forEach { id -> println("${id}") }

    log(AI.LogLevel.INFO, "-----------------DONE-----------------")
    // endregion Logging
    // Remove explicit EOS (2L) if present to allow generation
    if (finalIDs.isNotEmpty() && finalIDs.last() == 2L) {
      finalIDs = finalIDs.dropLast(1).toLongArray()
    }

    ctx.setAttachment("promptIds", finalIDs)

    // 3. Initial Decoder Input
    // Note: For processInput, we don't strictly need to be correct if we ignore
    // the first forward pass result, BUT to avoid crashes on models with fixed inputs,
    // we can pass the whole prompt.
    val decoderInputIds = manager.create(finalIDs)

    return NDList(pixelValues.squeeze(), decoderInputIds.squeeze())
  }

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
      // Autoregressive Decoding Loop
      for (i in 0 until 50) {
        val currentArray = currentIds.toLongArray()
        val currentSize = currentArray.size.toLong()

        // DYNAMIC RESHAPE: [1, SequenceLength]
        val decoderInput = manager.create(currentArray).reshape(1, currentSize)

        val inputs = NDList(pixelValues, decoderInput)
        val output = ctx.model.block.forward(ps, inputs, false) as NDList
        val logits = output[0]

        // Get prediction for the last token position
        val lastTokenLogits = logits.get(0).get(currentSize - 1)
        val nextTokenId = lastTokenLogits.argMax(0).getLong()

        println("Token: $nextTokenId.")
        decoderInput.close()
        output.close()
        lastTokenLogits.close()

        if (nextTokenId == 2L) break // EOS
        currentIds.add(nextTokenId)
      }
    } catch (e: Exception) {
      println("Error in Donut generation loop: ${e.message}")
    } finally {
      pixelValues.close()
    }
    log(AI.LogLevel.INFO, "-----------------DONE-----------------")
    // Decode only the new answer part
    val answerIds = currentIds.drop(promptIds.size).toLongArray()
    val rawAnswer = tokenizer?.decode(answerIds) ?: ""

    // Clean up common Donut artifacts
    return rawAnswer.replace("</s_answer>", "").replace("<s>", "").trim()
  }
}

/** The Plugin Action Entry Point. Now simplified thanks to the Base Class. */
class DonutDocVQAAction : PyTorch<kotlin.Pair<DjlImage, String>, String>() {
  override val resModelBaseURL = "https://huggingface.co/Callari/donut-docvqa/resolve/main"
  override val modelName = "donut-docvqa"

  // Define the files needed for Donut
  override val resModelFiles =
      listOf(
          "donut-docvqa.pt",
          "config.json",
          "tokenizer.json",
          "added_tokens.json",
          "special_tokens_map.json")

  override fun buildCriteria(modelDir: File): Criteria<kotlin.Pair<DjlImage, String>, String> {
    println("XDON2")
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

  override fun initialize(configData: IPluginInitializeData) {
    if (!(configData.properties.getProperty("Active_AI")?.lowercase() ?: "").contains("donut")) {
      return
    }

    log(LogLevel.INFO, "Initializing PyTorch / Donut VQ&A.")

    super.initialize(configData)
  }

  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    log(LogLevel.INFO, "Processing incoming DocVQA-Request.")
    // --- QUESTIONS CONFIG ---
    val questionsToAsk = mapOf("total" to "Betrag?", "date" to "Datum?")

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

          // Execute questions sequentially using the Base Class Wrapper
          questionsToAsk.forEach { (key, question) ->
            log(LogLevel.INFO, "Asking \"$question\" ($key).")
            try {
              val answer = predict(kotlin.Pair(djlImg, question))
              fileResults[key] = answer
            } catch (e: Throwable) {
              fileResults[key] = "Error: ${e.message}"
            } catch (e: IllegalStateException) {
              log(LogLevel.INFO, "Pool depleted")

              fileResults[key] = "Error: ${e.message}"
            }
          }
          finalResults[inputName] = fileResults
        }
      }
    } catch (e: Exception) {
      logger.error("Execution failed", e)
      return PluginServletActionRetVal(
          ServletResponse(EResponseType.JSON, "{\"error\":\"${e.message}\"}"))
    }

    // Simple JSON Builder
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

  override fun shutdown(shutdownData: IPluginShutdownData?) {
    super.shutdown()
  }

  override fun validateConfigurationData(
      configData: IPluginValidationData
  ): IPluginInitializeValidationResult? = null

  override fun log(importance: LogLevel, toLog: String) {
    super.idLogMessages = "Donut DocV Q&A"

    super.log(importance, toLog)
  }
}
