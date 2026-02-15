package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.onnx

// region Imports
// region DJL
// endregion DJL
// region CodBi
// endregion CodBi
// region XIMA
// endregion XIMA
import ai.djl.huggingface.tokenizers.HuggingFaceTokenizer
import ai.djl.modality.cv.Image as DjlImage
import ai.djl.modality.cv.ImageFactory
import ai.djl.ndarray.NDArray
import ai.djl.ndarray.NDList
import ai.djl.ndarray.NDManager
import ai.djl.ndarray.types.DataType
import ai.djl.repository.zoo.Criteria
import ai.djl.repository.zoo.ZooModel
import ai.djl.translate.Batchifier
import ai.djl.translate.Translator
import ai.djl.translate.TranslatorContext
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.ONNX
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeValidationResult
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginValidationData
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.awt.geom.AffineTransform
import java.awt.image.AffineTransformOp
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.net.URI
import java.nio.file.Paths
import java.util.concurrent.CompletableFuture
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.TimeoutException
import javax.imageio.ImageIO
import net.sourceforge.tess4j.TessAPI1

// endregion Imports
/**
 * The specific Translator logic for the [DonutDocVQAAction]. Handles resizing, prompt generation,
 * and the autoregressive decoding loop for ONNX models.
 */
class DocVQATranslator(
    /** The directory where the models reside. */
    private val modelDir: String,
    /** The model used for encoding the images to process. */
    private val encoderModel: ZooModel<NDList, NDList>,
    /** The model to use for inference. */
    private var decoderModel: ZooModel<NDList, NDList>?,
    /**
     * The number of tokens at which the processing of an image will stop in order to prevent
     * endless processing (defaults to **100**).
     */
    public var maxTokens: Int = 100,
    /** The logger to use. */
    private val log: (importance: AI.LogLevel, toLog: String, exception: Throwable?) -> Unit
) : Translator<Pair<DjlImage, String>, String> {
  /** The [HuggingFaceTokenizer] for text encoding/decoding. */
  private var tokenizer: HuggingFaceTokenizer? = null
  /** Cached predictor for encoder. */
  private var encoderPredictor: ai.djl.inference.Predictor<NDList, NDList>? = null
  /** Cached predictor for autoregressive decoding. */
  private var decoderPredictor: ai.djl.inference.Predictor<NDList, NDList>? = null

  /**
   * Sets the encoder model and creates a predictor.
   *
   * @param model The [ZooModel] to use for encoding.
   */
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
   *
   * @param model The [ZooModel] to use for the first part of the decoding.
   * @param loopModel The [ZooModel] to use for all further decoding steps.
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

  /**
   * Initializes the tokenizer.
   *
   * @param ctx The [TranslatorContext] to use.
   */
  override fun prepare(ctx: TranslatorContext) {
    val oldClassLoader = Thread.currentThread().contextClassLoader

    try {
      Thread.currentThread().contextClassLoader = this.javaClass.classLoader

      val tokenizerPath = Paths.get(modelDir, "tokenizer.json")
      tokenizer = HuggingFaceTokenizer.newInstance(tokenizerPath)

      log(AI.LogLevel.INFO, "Tokenizer loaded from $tokenizerPath", null)
    } finally {
      Thread.currentThread().contextClassLoader = oldClassLoader
    }
  }

  /**
   * Processes the input image and question, runs the encoder, and prepares decoder inputs.
   *
   * @param ctx The [TranslatorContext] to use.
   * @param input The [Pair] to process.
   * @return The resulting [NDList].
   */
  override fun processInput(ctx: TranslatorContext, input: Pair<DjlImage, String>): NDList {
    val manager = ctx.ndManager
    val image = input.first
    val question = input.second
    // region Image preprocessing
    val resizedImage = image.resize(1280, 960, true)
    var array = resizedImage.toNDArray(manager)
    array = array.transpose(2, 0, 1).toType(DataType.FLOAT32, false)
    val mean = manager.create(floatArrayOf(0.485f, 0.456f, 0.406f)).reshape(3, 1, 1)
    val std = manager.create(floatArrayOf(0.229f, 0.224f, 0.225f)).reshape(3, 1, 1)
    array = array.div(255.0f).sub(mean).div(std)
    val pixelValues = array
    // endregion Image preprocessing
    // region Run encoder
    val encPredictor =
        encoderPredictor
            ?: throw IllegalStateException(
                "[[ CodBi / AI / ONNX / DONUT ] Encoder predictor not initialized }")
    val encoderInput = NDList(pixelValues)

    try {
      val encoderOutput = encPredictor.predict(encoderInput)
      val encoderHiddenStates = encoderOutput[0]
      val encoderHiddenStatesDetached = encoderHiddenStates.duplicate()

      ctx.setAttachment("encoder_hidden_states", encoderHiddenStatesDetached)

      encoderOutput.close()
    } catch (X: Exception) {
      log(AI.LogLevel.ERROR, "Encoder prediction failed: ${ X.message }", X)

      encoderInput.close()

      throw X
    }
    // endregion Run encoder
    // region Prompt encoding
    val prompt = "<s_docvqa><s_question>$question</s_question><s_answer>"
    var finalIDs = tokenizer?.encode(prompt)?.ids ?: longArrayOf()

    if (finalIDs.isNotEmpty() && finalIDs.last() == 2L)
        finalIDs = finalIDs.dropLast(1).toLongArray()

    ctx.setAttachment("promptIds", finalIDs)
    // endregion Prompt encoding
    val encoderHiddenStates =
        ctx.getAttachment("encoder_hidden_states") as? NDArray
            ?: throw IllegalStateException(
                "[[ CodBi / AI / ONNX / DONUT ] Encoder hidden states not found in context ]")
    val decoderInputIds = manager.create(finalIDs)

    return NDList(decoderInputIds, encoderHiddenStates)
  }

  /**
   * Autoregressive decoding loop.
   *
   * @param ctx The [TranslatorContext] to use.
   * @param list The [NDList] from [processInput].
   * @return The generated answer.
   */
  override fun processOutput(ctx: TranslatorContext, list: NDList): String {
    val manager = ctx.ndManager
    val encoderHiddenStates =
        ctx.getAttachment("encoder_hidden_states") as? NDArray
            ?: throw IllegalStateException(
                "[[ CodBi / AI / ONNX / DONUT ] Encoder hidden states not found ]")
    val promptIds = ctx.getAttachment("promptIds") as LongArray
    val currentIds = promptIds.toMutableList()

    try {
      val initialLogits = list[0]

      val seqLen = currentIds.size.toLong()
      val lastTokenLogits = initialLogits.get(seqLen - 1)
      var nextTokenId = lastTokenLogits.argMax(0).getLong()

      if (nextTokenId != 2L) currentIds.add(nextTokenId)

      val predictor =
          decoderPredictor
              ?: throw IllegalStateException(
                  "[[ CodBi / AI / ONNX / DONUT ] Decoder predictor not initialized ]")

      for (i in 0 until maxTokens) {
        if (nextTokenId == 2L) break

        val currentArray = currentIds.toLongArray()
        val decoderInput = manager.create(currentArray)
        val inputs = NDList(decoderInput, encoderHiddenStates)
        val output = predictor.predict(inputs)
        val logits = output[0]
        val newSeqLen = currentArray.size.toLong()
        val lastLogits = logits.get(newSeqLen - 1)

        nextTokenId = lastLogits.argMax(0).getLong()

        decoderInput.close()
        output.close()

        if (nextTokenId == 2L) break

        currentIds.add(nextTokenId)
      }
    } catch (X: Exception) {
      println("Error in Donut generation loop: ${ X.message }")
    } finally {
      val encoderOutput = ctx.getAttachment("encoder_output") as? NDList

      encoderOutput?.close()
    }

    val answerIds = currentIds.drop(promptIds.size).toLongArray()
    val rawAnswer = tokenizer?.decode(answerIds) ?: ""

    return rawAnswer.replace("</s_answer>", "").replace("<s>", "").trim()
  }
}

/**
 * # ONNX-based Donut Document Visual Question & Answering Action.
 *
 * Activated by adding **DONUT** and **ONNX** to the **Active_AI** plugin property.
 *
 * ## URLs needed for initialization
 * - [https://repo1.maven.org/maven2/ai/djl/huggingface/tokenizers/0.36.0/tokenizers-0.36.0.ja](https://repo1.maven.org/maven2/ai/djl/huggingface/tokenizers/0.36.0/tokenizers-0.36.0.ja)
 * - [https://huggingface.co/Xenova/donut-base-finetuned-docvqa/resolve/main/onnx/encoder_model_fp16.onnx](https://huggingface.co/Xenova/donut-base-finetuned-docvqa/resolve/main/onnx/encoder_model_fp16.onnx)
 * - [https://huggingface.co/Xenova/donut-base-finetuned-docvqa/resolve/main/onnx/decoder_model_fp16.onnx](https://huggingface.co/Xenova/donut-base-finetuned-docvqa/resolve/main/onnx/decoder_model_fp16.onnx)
 * - [https://huggingface.co/Xenova/donut-base-finetuned-docvqa/resolve/main/tokenizer.jso](https://huggingface.co/Xenova/donut-base-finetuned-docvqa/resolve/main/tokenizer.jso)
 *
 * **Once downloaded the initialization will reuse these files**.
 *
 * ## Plugin Options
 * * - **AI_ONNX_DONUT_NativeTempToKeep** States how many sets of native libraries shall be kept on
 *   disk in order to avoid race conditions. Default to **3**.
 * * - **AI_ONNX_DONUT_MaxTokens** States the number of tokens that have to be reached to force
 *   aborting processing to avoid infinite processing.
 * * - **AI_ONNX_DONUT_ModelDirectory** The direcotry where the model files shall be stored.
 * * - **AI_ONNX_DONUT_OSDPoolSize** Number of Tesseract OSD handles to keep in pool for automatic
 *   orientation detection. Defaults to **2**. Only used when OCR is active in Active_AI.
 *
 * ## Image Orientation Correction
 * The Donut model is sensitive to image orientation. There are two ways to handle rotation:
 *
 * **1. Manual Rotation (Priority):** Provide an **X-Rotate** header with the rotation angle:
 * - **X-Rotate: 90** - Rotate image 90° clockwise
 * - **X-Rotate: 180** - Rotate image 180°
 * - **X-Rotate: 270** - Rotate image 270° clockwise (90° counter-clockwise)
 *
 * **2. Automatic Detection (Fallback):** If no X-Rotate header is provided AND **OCR** is in the
 * **Active_AI** plugin property, Tesseract's OSD (Orientation and Script Detection) will
 * automatically detect and correct image orientation. This requires:
 * - **OCR** in Active_AI property (enables Tesseract)
 * - Tesseract's **osd.traineddata** file must be available
 *
 * **3. No Rotation:** If X-Rotate is not provided and OCR is not active, images are processed
 * as-is.
 *
 * Common use case: Photos taken in portrait mode on mobile devices often need 90° or 270° rotation.
 */
class DonutDocVQAAction : ONNX() {
  /** States the files to use for all instances. */
  companion object {
    val resModelFiles =
        listOf("encoder_model_fp16.onnx", "decoder_model_fp16.onnx", "tokenizer.json")
  }

  /**
   * The number of tokens at which the [execute] will stop in order to prevent endless processing
   * (defaults to **100**).
   */
  private var maxTokens = 100
  /** The number of sets of model files to keep to prevent race conditions. Default ot **3**. */
  private var keepNewest = 3
  /** Tracks if DONUT is present in Active_AI. */
  private var donutActive = false
  /** Tracks if OCR (Tesseract) is present in Active_AI for orientation detection. */
  private var ocrActive = false
  /** The size of the OSD handle pool for orientation detection. Defaults to 2. */
  private var osdPoolSize = 2
  /** Pool of Tesseract OSD handles for orientation detection. */
  private val osdPool =
      java.util.concurrent.LinkedBlockingQueue<net.sourceforge.tess4j.ITessAPI.TessBaseAPI>()
  /** Tracks whether the OSD pool has been initialized. */
  private var isOsdPoolInitialized = false
  /** The encoder model. */
  private var encoderModel: ZooModel<NDList, NDList>? = null
  /** The decoder model. */
  private var decoderModel: ZooModel<NDList, NDList>? = null
  /** Separate decoder model for autoregressive loop. */
  private var decoderModelForLoop: ZooModel<NDList, NDList>? = null
  /** The translator instance. */
  private var translator: DocVQATranslator? = null
  /** The [HuggingFaceTokenizer] for prompt encoding / answer decoding. */
  private var tokenizer: HuggingFaceTokenizer? = null
  /** Remember last load error so execute() can return a helpful message. */
  @Volatile private var loadError: Throwable? = null
  /** Tracks if models are fully loaded. */
  @Volatile private var modelsReady = false
  /** Directory containing model files. */
  private var donutModelDir: File? = null
  /** The plugin's root folder. */
  private var pluginFolder: File? = null
  /** Current run dir for extracted tokenizers natives. */
  private var tokenizersNativeRunDir: File? = null // Now set by TokenizersHelper
  /** The base URL for downloading the model files. */
  private var modelBaseUrl =
      "https://huggingface.co/Xenova/donut-base-finetuned-docvqa/resolve/main"

  /**
   * Sets the [idLogMessages] prior to [AI.log]ging.
   *
   * @param importance See [AI.log].
   * @param toLog See [AI.log].
   */
  override fun log(importance: LogLevel, toLog: String, adjenct: String, exception: Throwable?) {
    super.idLogMessages = "ONNX / DONUT"

    super.log(importance, toLog, adjenct, exception)
  }

  /**
   * Removes the temporary native libs that couldn't be removed before due to file locking.
   *
   * @param cacheRootDir The directory where all temporary native library folders reside.
   * @param keepNewest The number of directories to keep in order to prevent race conditions.
   */
  private fun purgeOldDjlRunDirs(cacheRootDir: File) {
    val runs =
        cacheRootDir
            .listFiles()
            ?.filter { it.isDirectory && it.name.startsWith("run-") }
            ?.sortedByDescending { it.lastModified() } ?: return

    runs.drop(keepNewest).forEach { dir ->
      try {
        dir.deleteRecursively()

        log(LogLevel.INFO, "Deleted old DJL cache dir: ${ dir.absolutePath}")
      } catch (X: Exception) {
        log(
            LogLevel.WARNING,
            "Could not delete old DJL cache dir (likely locked): ${ dir.absolutePath }",
            "",
            X)
      }
    }
  }

  /**
   * Removes the temporary tokenizer directories.
   *
   * @param cacheRootDir The directory where all temporary native library folders reside.
   * @param keepNewest The number of directories to keep in order to prevent race conditions.
   */
  // Removed: purgeOldTokenizersRunDirs, now handled by TokenizersHelper

  /**
   * Determines the current tokinzer version.
   *
   * @return Either the system property **codbi.djl.tokenizers.version** or 0.36.0 .
   */
  // Removed: resolveTokenizersVersion, now handled by TokenizersHelper

  /**
   * Determines the tokenizer directory according to the server's os and archetype.
   *
   * @return The path to the directory.
   */
  // Removed: detectTokenizersJarDir, now handled by TokenizersHelper

  /**
   * Acquires the native tokenizer libraries using TokenizersHelper and sets up environment
   * variables.
   *
   * @return true if successful, false otherwise.
   */
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

  /**
   * Specifies name of this [IPluginServletAction].
   *
   * @return The requested [String].
   */
  override fun getName(): String = "CodBi_AI_Donut_vQA"

  /**
   * Sets [keepNewest] according to **AI_ONNX_DONUT_NativeTempToKeep**, if available. Default to
   * **3**. Also sets [maxTokens] according to **AI_ONNX_DONUT_MaxTokens**, if available. Defaults
   * to **100**.
   *
   * @param configData As provided by the Formcycle environment.
   */
  override fun validateConfigurationData(
      configData: IPluginValidationData
  ): IPluginInitializeValidationResult? {
    // region Read the [maxTokens]
    val candidateMaxTokens =
        configData.properties.getProperty("AI_ONNX_DONUT_MaxTokens")?.toIntOrNull()

    maxTokens =
        if (candidateMaxTokens != null && candidateMaxTokens > 0) candidateMaxTokens else maxTokens
    // endregion Read the [maxTokens]
    // region Read [keepNewest]
    val candidateKeepNewest =
        configData.properties.getProperty("AI_ONNX_DONUT_NativeTempToKeep")?.toIntOrNull()

    keepNewest =
        if (candidateKeepNewest != null && candidateKeepNewest > 0) candidateKeepNewest else 3
    // endregion Read [keepNewest]
    // region Read [modelBaseUrl]
    val candidateModelBaseUrl =
        configData.properties.getProperty("AI_ONNX_DONUT_ModelDirectory")?.trim()

    if (!candidateModelBaseUrl.isNullOrEmpty()) modelBaseUrl = candidateModelBaseUrl
    // endregion Read [modelBaseUrl]
    return null
  }

  /** Initializes DONUT models if Active_AI contains both DONUT and ONNX. */
  override fun initialize(configData: IPluginInitializeData) {
    donutActive = false
    loadError = null
    modelsReady = false
    pluginFolder = configData.fileHelper.pluginFolder
    // region Read the [maxTokens]
    val candidateMaxTokens =
        configData.properties.getProperty("AI_ONNX_DONUT_MaxTokens")?.toIntOrNull()
    maxTokens = if (candidateMaxTokens != null && candidateMaxTokens > 0) candidateMaxTokens else 2
    // endregion Read the [maxTokens]
    // region Read [keepNewest]
    val candidateKeepNewest =
        configData.properties.getProperty("AI_ONNX_DONUT_NativeTempToKeep")?.toIntOrNull()
    keepNewest =
        if (candidateKeepNewest != null && candidateKeepNewest > 0) candidateKeepNewest else 3
    // endregion Read [keepNewest]
    // region Read [modelBaseUrl]
    val candidateModelBaseUrl =
        configData.properties.getProperty("AI_ONNX_DONUT_ModelDirectory")?.trim()

    if (!candidateModelBaseUrl.isNullOrEmpty()) modelBaseUrl = candidateModelBaseUrl
    // endregion Read [modelBaseUrl]
    val aiRemove = configData.properties.getProperty("AI_Remove")?.lowercase() ?: ""
    // region Check if files shall be purged
    if (aiRemove.contains("donut")) {
      cleanupDonutFiles()

      return
    }
    // endregion Check if files shall be purged
    val activeAI = configData.properties.getProperty("Active_AI")?.lowercase() ?: ""
    donutActive = activeAI.contains("donut") && !activeAI.contains("donut_pytorch")
    ocrActive = activeAI.contains("ocr")

    if (ocrActive) {
      log(AI.LogLevel.INFO, "OCR is active - automatic orientation detection will be available")

      // Read OSD pool size
      val candidateOsdPoolSize =
          configData.properties.getProperty("AI_ONNX_DONUT_OSDPoolSize")?.toIntOrNull()
      osdPoolSize =
          if (candidateOsdPoolSize != null && candidateOsdPoolSize > 0) candidateOsdPoolSize else 2
      log(AI.LogLevel.INFO, "OSD pool size set to: $osdPoolSize")

      // Initialize OSD pool
      val tessDataDir = File(configData.fileHelper.pluginFolder, "Resources/AI/Tesseract/Models")
      if (tessDataDir.exists()) {
        try {
          repeat(osdPoolSize) {
            val osdHandle = TessAPI1.TessBaseAPICreate()
            if (TessAPI1.TessBaseAPIInit3(osdHandle, tessDataDir.absolutePath, "osd") == 0) {
              TessAPI1.TessBaseAPISetPageSegMode(osdHandle, 0) // PSM_OSD_ONLY
              osdPool.put(osdHandle)
              log(AI.LogLevel.INFO, "Created OSD handle ${it + 1}/${osdPoolSize}")
            } else {
              log(AI.LogLevel.WARNING, "Failed to initialize OSD handle ${it + 1}")
              TessAPI1.TessBaseAPIDelete(osdHandle)
            }
          }
          isOsdPoolInitialized = true
          log(AI.LogLevel.INFO, "OSD pool initialized with ${osdPool.size} handles")
        } catch (e: Exception) {
          log(AI.LogLevel.WARNING, "Failed to initialize OSD pool: ${e.message}")
        }
      } else {
        log(
            AI.LogLevel.WARNING,
            "Tesseract tessdata directory not found at ${tessDataDir.absolutePath} - OSD pool not initialized")
      }
    }
    // region Check if tokenizer library can be made available
    if (donutActive)
        if (!ensureTokenizersNativeLibraries())
            log(
                AI.LogLevel.ERROR,
                "Failed to set up tokenizers native libraries before ONNX initialization")
    // endregion Check if tokenizer library can be made available
    val djlCacheRoot = File(configData.fileHelper.pluginFolder, "ai/djl-cache")
    val djlRunDir = File(djlCacheRoot, "run-${System.currentTimeMillis()}")

    djlCacheRoot.mkdirs()
    djlRunDir.mkdirs()
    purgeOldDjlRunDirs(djlCacheRoot)

    System.setProperty("DJL_CACHE_DIR", djlRunDir.absolutePath)
    System.setProperty("ENGINE_CACHE_DIR", djlRunDir.absolutePath)

    log(AI.LogLevel.INFO, "Set DJL_CACHE_DIR / ENGINE_CACHE_DIR to: ${djlRunDir.absolutePath}")

    super.initialize(configData)

    if (!donutActive) {
      log(AI.LogLevel.INFO, "DONUT not activated")

      return
    }

    try {
      if (onnxMarkedForRemoval || !onnxIsReady())
          throw IllegalStateException("ONNX Runtime is not available")

      donutModelDir = File(modelDir, "donut-docvqa")

      donutModelDir?.mkdirs()
      ensureDonutModelFiles()
      loadModels()

      modelsReady = true

      log(AI.LogLevel.INFO, "DONUT setup complete")
    } catch (X: Throwable) {
      loadError = X

      log(AI.LogLevel.ERROR, "DONUT setup failed cause: ${X.message}", "", X)
    }
  }

  /**
   * Run code as a [CompletableFuture] timing out.
   *
   * @param name The ijd of this run.
   * @param timeoutSeconds The number of seconds to wait 'till aborting.
   * @param work The code ot run.
   * @return The result of the runned code.
   */
  private fun <T> runWithTimeout(name: String, timeoutSeconds: Long, work: () -> T): T {
    val future = CompletableFuture.supplyAsync { work() }

    try {
      return future.get(timeoutSeconds, TimeUnit.SECONDS)
    } catch (X: TimeoutException) {
      future.cancel(true)

      throw TimeoutException(
          "[[ CodBi / AI / ONNX / DONUT ] Future \"$name\" timed out after ${timeoutSeconds}s ]")
    }
  }

  /** Loads encoder and decoder ONNX models. */
  private fun loadModels() {
    val modelPath =
        donutModelDir?.absolutePath
            ?: throw IllegalStateException(
                "[[ CodBi / AI / ONNX / DONUT ] Model directory not set ]")

    val encoderFile = File(modelPath, "encoder_model_fp16.onnx")
    val decoderFile = File(modelPath, "decoder_model_fp16.onnx")
    val encoderCriteria =
        Criteria.builder()
            .setTypes(NDList::class.java, NDList::class.java)
            .optEngine("OnnxRuntime")
            .optModelPath(encoderFile.toPath())
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
    } catch (X: Throwable) {
      log(AI.LogLevel.ERROR, "Failed to load encoder: ${ X.javaClass.name }: ${ X.message }", "", X)

      X.cause?.let {
        log(AI.LogLevel.ERROR, "Caused by: ${ it.javaClass.name}: ${ it.message}", "", it)
      }

      throw X
    }

    val translatorInstance =
        DocVQATranslator(modelPath, encoderModel!!, null, maxTokens) { level, msg, exc ->
          log(level, msg, "", exc)
        }

    translator = translatorInstance

    translatorInstance.setEncoderModel(encoderModel!!)

    log(LogLevel.INFO, "Building decoder criteria...")

    @Suppress("UNCHECKED_CAST")
    val decoderCriteria =
        Criteria.builder()
            .setTypes(Pair::class.java as Class<Pair<DjlImage, String>>, String::class.java)
            .optEngine("OnnxRuntime")
            .optModelPath(decoderFile.toPath())
            .optTranslator(translatorInstance as Translator<Pair<DjlImage, String>, String>)
            .build()

    log(LogLevel.INFO, "Loading decoder model...")

    decoderModel =
        runWithTimeout("decoderCriteria.loadModel()", 180) {
          decoderCriteria.loadModel() as ZooModel<NDList, NDList>
        }
    loadedModels["donut-decoder"] = decoderModel!!

    log(AI.LogLevel.INFO, "Loading decoder model for autoregressive loop...")

    val loopCriteria =
        Criteria.builder()
            .setTypes(NDList::class.java, NDList::class.java)
            .optEngine("OnnxRuntime")
            .optModelPath(decoderFile.toPath())
            .build()

    decoderModelForLoop =
        runWithTimeout("loopCriteria.loadModel()", 180) {
          loopCriteria.loadModel() as ZooModel<NDList, NDList>
        }

    loadedModels["donut-decoder-loop-model"] = decoderModelForLoop!!

    translatorInstance.setDecoderModel(decoderModel!!, decoderModelForLoop!!)

    log(LogLevel.INFO, "Encoder and decoder models loaded")

    loadTokenizer(modelPath)
    initPredictorPools()
  }

  /**
   * Downloads the specified [url] into the [targetFile].
   *
   * @param url The resource to download from.
   * @param targetFile The [File] to download to.
   */
  private fun downloadTo(url: String, targetFile: File) {
    targetFile.parentFile?.mkdirs()

    URI(url)
        .toURL()
        .openConnection()
        .apply {
          connectTimeout = 15_000
          readTimeout = 600_000

          setRequestProperty("User-Agent", "CodBi-DONUT/1.0")
        }
        .getInputStream()
        .use { input -> targetFile.outputStream().use { output -> input.copyTo(output) } }
  }

  /**
   * Acquires the model-files from
   * **https://huggingface.co/Xenova/donut-base-finetuned-docvqa/resolve/main**, if necessary.
   */
  private fun ensureDonutModelFiles() {
    val dir = donutModelDir ?: return
    val base = modelBaseUrl
    val files =
        mapOf(
            "encoder_model_fp16.onnx" to "$base/onnx/encoder_model_fp16.onnx",
            "decoder_model_fp16.onnx" to "$base/onnx/decoder_model_fp16.onnx",
            "tokenizer.json" to "$base/tokenizer.json")

    files.forEach { (name, url) ->
      val target = File(dir, name)

      if (target.exists()) return@forEach

      try {
        log(AI.LogLevel.INFO, "Downloading $name from Hugging Face")

        downloadTo(url, target)
      } catch (X: Exception) {
        log(AI.LogLevel.ERROR, "Failed to download $name: ${X.message}", "", X)
      }
    }
  }

  /**
   * Loads the tokanizer depending on which os formcycle is running on.
   *
   * @param modelPath the directory where the model files for all os and arches reside.
   */
  private fun loadTokenizer(modelPath: String) {
    val oldClassLoader = Thread.currentThread().contextClassLoader

    try {
      Thread.currentThread().contextClassLoader = this.javaClass.classLoader

      val nativeRunDir = tokenizersNativeRunDir

      if (nativeRunDir != null && nativeRunDir.exists()) {
        val os = (System.getProperty("os.name") ?: "").lowercase()
        val libFile =
            when {
              os.contains("windows") -> File(nativeRunDir, "tokenizers.dll")
              os.contains("linux") -> File(nativeRunDir, "libtokenizers.so")
              os.contains("mac") -> File(nativeRunDir, "libtokenizers.dylib")
              else -> File(nativeRunDir, "tokenizers.dll")
            }

        if (libFile.exists()) {
          try {
            log(
                AI.LogLevel.INFO,
                "Explicitly loading tokenizers native library: ${libFile.absolutePath}")
            System.load(libFile.absolutePath)
            log(LogLevel.INFO, "Tokenizers native library loaded successfully")
          } catch (X: UnsatisfiedLinkError) {
            log(
                AI.LogLevel.ERROR,
                "Failed to load tokenizers native library: ${ X.message }",
                "",
                X)
          }
        } else
            log(
                LogLevel.WARNING,
                "Tokenizers native library file not found: ${libFile.absolutePath}")
      } else log(LogLevel.WARNING, "Tokenizers native run directory not set or doesn't exist")

      val tokenizerPath = Paths.get(modelPath, "tokenizer.json")
      val tokenizerFile = File(tokenizerPath.toUri())

      if (!tokenizerFile.exists())
          throw IllegalStateException(
              "Following tokenizer file does not exist: ${ tokenizerFile.absolutePath }")

      log(AI.LogLevel.INFO, "Loading tokenizer from ${ tokenizerFile.absolutePath }")

      tokenizer = HuggingFaceTokenizer.newInstance(tokenizerPath)

      log(LogLevel.INFO, "Tokenizer loaded successfully from $tokenizerPath")
    } catch (X: Throwable) {
      log(
          AI.LogLevel.ERROR,
          "Failed to load tokenizer: ${ X.javaClass.name }: ${ X.message }",
          "",
          X)

      X.cause?.let {
        log(LogLevel.ERROR, "Caused by: ${ it.javaClass.name }: ${ it.message }", "", it)
      }

      throw X
    } finally {
      Thread.currentThread().contextClassLoader = oldClassLoader
    }
  }

  /** Generates the en- & de-coder predictors. */
  private fun initPredictorPools() {
    val encoderModel = encoderModel ?: return
    val loopModel = decoderModelForLoop ?: return

    val passThroughTranslator =
        object : Translator<NDList, NDList> {
          override fun processInput(ctx: TranslatorContext, input: NDList) = input

          override fun processOutput(ctx: TranslatorContext, list: NDList) = list

          override fun getBatchifier() = Batchifier.STACK
        }
    val poolSize = Runtime.getRuntime().availableProcessors().coerceAtLeast(2).coerceAtMost(8)

    if (!predictorPools.containsKey("donut-encoder")) {
      val pool = LinkedBlockingQueue<ai.djl.inference.Predictor<*, *>>()

      repeat(poolSize) {
        pool.offer(
            encoderModel.newPredictor(passThroughTranslator) as ai.djl.inference.Predictor<*, *>)
      }

      predictorPools["donut-encoder"] = pool

      log(AI.LogLevel.INFO, "Initialized encoder predictor pool (size = $poolSize)")
    }

    if (!predictorPools.containsKey("donut-decoder-loop")) {
      val pool = LinkedBlockingQueue<ai.djl.inference.Predictor<*, *>>()

      repeat(poolSize) {
        pool.offer(
            loopModel.newPredictor(passThroughTranslator) as ai.djl.inference.Predictor<*, *>)
      }

      predictorPools["donut-decoder-loop"] = pool

      log(AI.LogLevel.INFO, "Initialized decoder predictor pool (size = $poolSize)")
    }
  }

  /** Cleans up DONUT model files. */
  private fun cleanupDonutFiles() {
    donutModelDir?.deleteRecursively()

    pluginFolder?.let { root ->
      val tokenizersDir = File(root, "ai/tokenizers")

      if (tokenizersDir.exists()) {
        tokenizersDir.deleteRecursively()

        log(AI.LogLevel.INFO, "Cleaned up tokenizers files")
      }

      val djlCacheDir = File(root, "ai/djl-cache")

      if (djlCacheDir.exists()) {
        djlCacheDir.deleteRecursively()

        log(AI.LogLevel.INFO, "Cleaned up DJL cache files")
      }
    }

    log(AI.LogLevel.INFO, "DONUT ONNX files cleaned up")
  }

  /**
   * Inferes the answer to the specified **question** using the given **tokenizer** for translation
   * into XML with human-readable content and the given **predictor**.
   *
   * @param manager The [NDManager] to use.
   * @param tokenizer The [HuggingFaceTokenizer] to use to translate the tokens.
   * @param predictor The [ai.djl.inference.Predictor].
   * @param encoderHiddenStates The [NDArray] that accumulates the previous inference state to be
   *   used for the next inference.
   * @param question The XML-Question to respond to.
   */
  private fun runDocVqaDecode(
      manager: NDManager,
      tokenizer: HuggingFaceTokenizer,
      predictor: ai.djl.inference.Predictor<NDList, NDList>,
      encoderHiddenStates: NDArray,
      question: String
  ): String {
    val prompt = "<s_docvqa><s_question>$question</s_question><s_answer>"
    var promptIds = tokenizer.encode(prompt).ids

    if (promptIds.isNotEmpty() && promptIds.last() == 2L)
        promptIds = promptIds.dropLast(1).toLongArray()

    val currentIds = promptIds.toMutableList()

    for (i in 0 until maxTokens) {
      val currentArray = currentIds.toLongArray()
      val decoderInput = manager.create(currentArray)
      val output = predictor.predict(NDList(decoderInput, encoderHiddenStates))
      val logits = output[0]
      val seqLen = currentArray.size.toLong()
      val nextTokenId = logits.get(seqLen - 1).argMax(0).getLong()

      output.close()
      decoderInput.close()

      if (nextTokenId == 2L) break

      currentIds.add(nextTokenId)
    }

    val answerIds = currentIds.drop(promptIds.size).toLongArray()
    val rawAnswer = tokenizer.decode(answerIds)

    return rawAnswer.replace("</s_answer>", "").replace("<s>", "").trim()
  }

  /**
   * Detects the orientation of an image using Tesseract's OSD (Orientation and Script Detection).
   * This method uses a pool of pre-initialized OSD handles for better performance.
   *
   * @param image The image to analyze.
   * @param tessDataDir The directory containing Tesseract's tessdata (included for logging
   *   purposes).
   * @return The rotation angle (0, 90, 180, or 270) that should be applied to correct the
   *   orientation, or 0 if detection fails or OCR is not active.
   */
  private fun detectOrientation(image: BufferedImage, tessDataDir: File): Int {
    if (!ocrActive || !isOsdPoolInitialized) {
      log(
          LogLevel.INFO,
          "OSD not available - OCR active: $ocrActive, pool initialized: $isOsdPoolInitialized")
      return 0
    }

    // Acquire OSD handle from pool with timeout
    val osdHandle =
        try {
          osdPool.poll(10, java.util.concurrent.TimeUnit.SECONDS)
        } catch (e: InterruptedException) {
          log(LogLevel.WARNING, "Interrupted while waiting for OSD handle")
          return 0
        }

    if (osdHandle == null) {
      log(LogLevel.WARNING, "OSD pool exhausted - no handle available")
      return 0
    }

    try {
      val width = image.width
      val height = image.height
      val pixels = image.getRGB(0, 0, width, height, null, 0, width)
      val buffer = java.nio.ByteBuffer.allocateDirect(width * height * 4)

      for (pixel in pixels) {
        buffer.put((pixel shr 16 and 0xFF).toByte()) // R
        buffer.put((pixel shr 8 and 0xFF).toByte()) // G
        buffer.put((pixel and 0xFF).toByte()) // B
        buffer.put((pixel shr 24 and 0xFF).toByte()) // A
      }

      buffer.rewind()

      TessAPI1.TessBaseAPISetImage(osdHandle, buffer, width, height, 4, width * 4)

      val orientDegPtr = java.nio.IntBuffer.allocate(1)
      val orientConfPtr = java.nio.FloatBuffer.allocate(1)
      val scriptNamePtr = com.sun.jna.ptr.PointerByReference()
      val scriptConfPtr = java.nio.FloatBuffer.allocate(1)

      val result =
          TessAPI1.TessBaseAPIDetectOrientationScript(
              osdHandle, orientDegPtr, orientConfPtr, scriptNamePtr, scriptConfPtr)

      if (result == 1) {
        val orientDeg = orientDegPtr.get(0)
        val orientConf = orientConfPtr.get(0)
        log(
            LogLevel.INFO,
            "Tesseract OSD detected orientation: ${orientDeg}° (confidence: ${orientConf})")

        // Convert Tesseract's detected orientation to correction angle
        val correctionAngle =
            when (orientDeg) {
              0 -> 0
              90 -> 270 // Image is 90° rotated, need to rotate 270° to correct
              180 -> 180
              270 -> 90 // Image is 270° rotated, need to rotate 90° to correct
              else -> 0
            }

        return correctionAngle
      }
    } catch (e: Exception) {
      log(LogLevel.WARNING, "Tesseract OSD failed: ${e.message}")
    } finally {
      // Return handle to pool
      try {
        osdPool.put(osdHandle)
      } catch (e: InterruptedException) {
        log(LogLevel.WARNING, "Interrupted while returning OSD handle to pool")
      }
    }

    log(LogLevel.INFO, "Could not detect orientation, assuming no rotation needed")
    return 0
  }

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

  /** Handles incoming requests. */
  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    log(AI.LogLevel.INFO, "Processing request received")

    if (onnxMarkedForRemoval) {
      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"ONNX is disabled because AI_Remove contains ONNX.\"}"))
    }

    if (!donutActive || !isActive) {
      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"DONUT ONNX is not active. Check the plugin properties.}"))
    }

    loadError?.let { err ->
      return errorResponse("Failed to load model cause: ${err.message}.")
    }

    if (!modelsReady || encoderModel == null || decoderModelForLoop == null || tokenizer == null) {
      return errorResponse("DONUT is not initialized.")
    }

    val questionsToAsk = mutableMapOf<String, String>()

    params.headerMap.forEach { (headerName, headerValue) ->
      if (headerName.startsWith("x-question-", ignoreCase = true)) {
        val key = headerName.lowercase().substringAfter("x-question-", "").lowercase()
        if (key.isNotBlank() && headerValue != null) {
          // Try to decode header value as UTF-8 if misencoded
          val decodedValue =
              try {
                String(headerValue.toByteArray(Charsets.ISO_8859_1), Charsets.UTF_8)
              } catch (ex: Exception) {
                headerValue // fallback
              }
          questionsToAsk[key] = decodedValue
        }
      }
    }

    if (questionsToAsk.isEmpty()) {
      return errorResponse("No questions asked.")
    }

    val finalResults = mutableMapOf<String, Map<String, String>>()

    try {
      val tokenizer = tokenizer ?: return errorResponse("Tokenizer not loaded.")

      params.uploadFiles?.forEach { (inputName, fileItem) ->
        val combinedBytes =
            fileItem.stream().use { stream ->
              stream.map { it.data }.reduce { acc, bytes -> acc + bytes }.orElse(byteArrayOf())
            }

        // region Apply orientation correction (manual X-Rotate or automatic OSD)
        val rotatedBytes =
            try {
              val manualRotation =
                  params.headerMap.entries
                      .find { it.key.equals("X-Rotate", ignoreCase = true) }
                      ?.value
                      ?.trim()
                      ?.toIntOrNull()

              if (manualRotation != null && manualRotation != 0) {
                log(
                    LogLevel.INFO,
                    "Applying manual rotation from X-Rotate header: ${manualRotation}°")

                val bufferedImg = ImageIO.read(ByteArrayInputStream(combinedBytes))

                if (bufferedImg != null) {
                  val rotatedImg =
                      when (manualRotation) {
                        90,
                        180,
                        270 -> rotateImage(bufferedImg, manualRotation)
                        else -> {
                          log(
                              LogLevel.WARNING,
                              "Invalid X-Rotate value: $manualRotation (use 90, 180, or 270)")
                          bufferedImg
                        }
                      }

                  val baos = ByteArrayOutputStream()

                  ImageIO.write(rotatedImg, "PNG", baos)
                  baos.toByteArray()
                } else {
                  log(LogLevel.WARNING, "Failed to read image for rotation, using original")
                  combinedBytes
                }
              } else if (ocrActive) {
                // Automatic orientation detection using Tesseract OSD
                log(
                    LogLevel.INFO,
                    "No X-Rotate header provided - using Tesseract OSD for automatic orientation detection")

                val bufferedImg = ImageIO.read(ByteArrayInputStream(combinedBytes))

                if (bufferedImg != null) {
                  // Find tessdata directory (same as Tesseract plugin uses)
                  val tessDataDir = File(pluginFolder, "Resources/AI/Tesseract/Models")

                  if (tessDataDir.exists()) {
                    val detectedAngle = detectOrientation(bufferedImg, tessDataDir)

                    if (detectedAngle != 0) {
                      log(LogLevel.INFO, "Applying auto-detected rotation: ${detectedAngle}°")
                      val rotatedImg = rotateImage(bufferedImg, detectedAngle)

                      val baos = ByteArrayOutputStream()
                      ImageIO.write(rotatedImg, "PNG", baos)
                      baos.toByteArray()
                    } else {
                      log(LogLevel.INFO, "No rotation needed according to OSD")
                      combinedBytes
                    }
                  } else {
                    log(
                        LogLevel.WARNING,
                        "Tesseract tessdata directory not found at ${tessDataDir.absolutePath} - skipping OSD")
                    combinedBytes
                  }
                } else {
                  log(LogLevel.WARNING, "Failed to read image for OSD, using original")
                  combinedBytes
                }
              } else {
                // No rotation - neither manual nor automatic
                log(LogLevel.INFO, "No rotation applied - X-Rotate not provided and OCR not active")
                combinedBytes
              }
            } catch (e: Exception) {
              log(
                  LogLevel.WARNING,
                  "Image orientation correction failed: ${e.message}, using original image")
              combinedBytes
            }
        // endregion Apply orientation correction (manual X-Rotate or automatic OSD)

        rotatedBytes.inputStream().use { inputStream ->
          val djlImg = ImageFactory.getInstance().fromInputStream(inputStream)
          val results = mutableMapOf<String, String>()

          NDManager.newBaseManager().use { manager ->
            // region Image preprocessing (Letterboxing statt Stretching)
            val targetW = 960
            val targetH = 1280
            val origW = djlImg.width
            val origH = djlImg.height
            val scale = minOf(targetW.toFloat() / origW, targetH.toFloat() / origH)
            val newW = (origW * scale).toInt()
            val newH = (origH * scale).toInt()
            val resized = djlImg.resize(newH, newW, true)
            val factory = ImageFactory.getInstance()
            val base =
                java.awt.image.BufferedImage(
                    targetW, targetH, java.awt.image.BufferedImage.TYPE_INT_RGB)
            val g = base.createGraphics()
            g.color = java.awt.Color.WHITE
            g.fillRect(0, 0, targetW, targetH)
            val x = (targetW - newW) / 2
            val y = (targetH - newH) / 2
            g.drawImage(resized.getWrappedImage() as java.awt.Image, x, y, newW, newH, null)
            g.dispose()
            val padded: DjlImage = factory.fromImage(base)
            var array = padded.toNDArray(manager)
            array = array.transpose(2, 0, 1).toType(DataType.FLOAT32, false)
            val mean = manager.create(floatArrayOf(0.485f, 0.456f, 0.406f)).reshape(3, 1, 1)
            val std = manager.create(floatArrayOf(0.229f, 0.224f, 0.225f)).reshape(3, 1, 1)
            array = array.div(255.0f).sub(mean).div(std)
            val pixelValues = array
            // endregion Image preprocessing
            val encoderPredictor =
                acquirePredictor<NDList, NDList>("donut-encoder")
                    ?: throw IllegalStateException("No predictor available for donut-encoder")
            // region Predict
            val encoderOutput =
                try {
                  encoderPredictor.predict(NDList(pixelValues))
                } finally {
                  releasePredictor("donut-encoder", encoderPredictor)
                }
            val encoderHiddenStates = encoderOutput[0].duplicate()

            encoderOutput.close()

            val decoderPredictor =
                acquirePredictor<NDList, NDList>("donut-decoder-loop")
                    ?: throw IllegalStateException("No predictor available for donut-decoder-loop")

            try {
              questionsToAsk.forEach { (key, question) ->
                try {
                  results[key] =
                      runDocVqaDecode(
                          manager, tokenizer, decoderPredictor, encoderHiddenStates, question)
                } catch (X: Exception) {
                  results[key] = "Error: ${ X.message }"

                  log(LogLevel.ERROR, "Error processing \"$question\" cause: ${ X.message }", "", X)
                }
              }
            } finally {
              releasePredictor("donut-decoder-loop", decoderPredictor)
            }
            // endregion Predict
          }

          finalResults[inputName] = results.toMap()
        }
      }
      // region Format response
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
      // endregion Format response
      return PluginServletActionRetVal(ServletResponse(EResponseType.JSON, jsonResponse))
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Error processing request: ${ X.message }", "", X)

      return errorResponse("Processing error: ${ X.message }")
    }
  }

  /**
   * Creates a JSON-Error-Response containing an **error** element holding the [message].
   *
   * @param message The message that shall be included in the response.
   * @return The requested [IPluginServletActionRetVal].
   */
  private fun errorResponse(message: String): IPluginServletActionRetVal {
    return PluginServletActionRetVal(
        ServletResponse(EResponseType.JSON, "{\"error\":\"$message\"}"))
  }

  /**
   * Closes the [translator]'s predictor and releases the
   * [encoderModel],[decoderModel],[decoderModelForLoop] & the [tokenizer]. The [modelsReady] and
   * [donutActive] flags will are set to **false**. Also tries to delete the
   * [tokenizersNativeRunDir] for this run. There is a high probability that this will be locked. In
   * that case the initialization routine does clear the old temp directories anyways.
   *
   * @param shutdownData Provided by the Formcycle environment.
   */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    translator?.closePredictor()

    // Clean up OSD pool
    while (osdPool.isNotEmpty()) {
      val handle = osdPool.poll()
      if (handle != null) {
        try {
          TessAPI1.TessBaseAPIDelete(handle)
        } catch (e: Exception) {
          log(AI.LogLevel.WARNING, "Error deleting OSD handle during shutdown: ${e.message}")
        }
      }
    }
    isOsdPoolInitialized = false
    log(AI.LogLevel.INFO, "OSD pool cleaned up")

    encoderModel = null
    decoderModel = null
    decoderModelForLoop = null
    translator = null
    modelsReady = false
    donutActive = false

    tokenizersNativeRunDir?.let { dir ->
      try {
        dir.deleteRecursively()
        log(AI.LogLevel.INFO, "Deleted tokenizers native dir: ${dir.absolutePath}")
      } catch (X: Exception) {
        log(
            AI.LogLevel.WARNING,
            "Could not delete tokenizers native dir (likely locked): ${dir.absolutePath}",
            "",
            X)
      }
    }

    super.shutdown(shutdownData)

    log(LogLevel.INFO, "DONUT ONNX shutdown complete")
  }
}
