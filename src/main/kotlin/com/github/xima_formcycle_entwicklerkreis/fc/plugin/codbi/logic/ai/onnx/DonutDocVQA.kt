package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.onnx

// region Imports
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
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.io.File
import java.net.URL
import java.nio.file.Paths
import java.util.concurrent.CompletableFuture
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.TimeoutException
import java.util.jar.JarFile

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
    val resModelFiles =
        listOf("encoder_model_fp16.onnx", "decoder_model_fp16.onnx", "tokenizer.json")
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

  /** The [HuggingFaceTokenizer] for prompt encoding / answer decoding. */
  private var tokenizer: HuggingFaceTokenizer? = null

  /** Remember last load error so execute() can return a helpful message. */
  @Volatile private var loadError: Throwable? = null

  /** Tracks if models are fully loaded. */
  @Volatile private var modelsReady = false

  /** Directory containing model files. */
  private var donutModelDir: File? = null

  /** Plugin root folder (from [IPluginInitializeData.fileHelper]). */
  private var pluginFolder: File? = null

  /** Current run dir for extracted tokenizers natives. */
  private var tokenizersNativeRunDir: File? = null

  init {
    idLogMessages = "ONNX / DONUT"
  }

  private fun purgeOldDjlRunDirs(cacheRootDir: File, keepNewest: Int) {
    val runs =
        cacheRootDir
            .listFiles()
            ?.filter { it.isDirectory && it.name.startsWith("run-") }
            ?.sortedByDescending { it.lastModified() } ?: return

    runs.drop(keepNewest).forEach { dir ->
      try {
        dir.deleteRecursively()
        log(AI.LogLevel.INFO, "Deleted old DJL cache dir: ${dir.absolutePath}")
      } catch (X: Exception) {
        log(
            AI.LogLevel.WARNING,
            "Could not delete old DJL cache dir (likely locked): ${dir.absolutePath}",
            "",
            X)
      }
    }
  }

  private fun purgeOldTokenizersRunDirs(cacheRootDir: File, keepNewest: Int) {
    val runs =
        cacheRootDir
            .listFiles()
            ?.filter { it.isDirectory && it.name.startsWith("run-") }
            ?.sortedByDescending { it.lastModified() } ?: return

    runs.drop(keepNewest).forEach { dir ->
      try {
        dir.deleteRecursively()
        log(AI.LogLevel.INFO, "Deleted old tokenizers native dir: ${dir.absolutePath}")
      } catch (X: Exception) {
        log(
            AI.LogLevel.WARNING,
            "Could not delete old tokenizers native dir (likely locked): ${dir.absolutePath}",
            "",
            X)
      }
    }
  }

  private fun resolveTokenizersVersion(): String {
    val override = System.getProperty("codbi.djl.tokenizers.version")?.trim()
    if (!override.isNullOrEmpty()) return override
    return "0.36.0"
  }

  private fun detectTokenizersJarDir(): String? {
    val os = (System.getProperty("os.name") ?: "").lowercase()
    val arch = (System.getProperty("os.arch") ?: "").lowercase()

    if (os.contains("windows")) return "native/lib/win-x86_64/cpu"
    if (os.contains("linux")) {
      if (arch.contains("aarch64") || arch.contains("arm64")) return "native/lib/linux-aarch64/cpu"
      return "native/lib/linux-x86_64/cpu"
    }
    if (os.contains("mac")) return "native/lib/osx-aarch64/cpu"
    return null
  }

  private fun ensureTokenizersNativeLibraries(): Boolean {
    val jarDir = detectTokenizersJarDir()
    if (jarDir == null) {
      log(
          AI.LogLevel.ERROR,
          "Unsupported OS/arch for tokenizers natives (os.name=${System.getProperty("os.name")}, os.arch=${System.getProperty("os.arch")})")
      return false
    }

    val pluginRoot = pluginFolder
    if (pluginRoot == null) {
      log(AI.LogLevel.ERROR, "Tokenizers natives: pluginFolder not initialized yet")
      return false
    }

    val version = resolveTokenizersVersion()
    val root = File(pluginRoot, "ai/tokenizers/native")
    val runDir = File(root, "run-${System.currentTimeMillis()}")
    val cache = File(root, "maven-cache")
    root.mkdirs()
    runDir.mkdirs()
    cache.mkdirs()
    purgeOldTokenizersRunDirs(root, keepNewest = 3)

    val repo =
        System.getProperty("codbi.maven.repo.url")?.trim()?.trimEnd('/')
            ?: "https://repo1.maven.org/maven2"
    val jarUrl = "$repo/ai/djl/huggingface/tokenizers/$version/tokenizers-$version.jar"
    val jar = File(cache, "tokenizers-$version.jar")

    if (!jar.exists()) {
      try {
        log(AI.LogLevel.INFO, "Downloading tokenizers natives from Maven repo: $jarUrl")
        downloadTo(jarUrl, jar)
      } catch (X: Exception) {
        log(AI.LogLevel.ERROR, "Failed to download tokenizers jar: ${X.message}", "", X)
        return false
      }
    }

    val requiredNames =
        when {
          jarDir.contains("win-x86_64") ->
              listOf(
                  "tokenizers.dll", "libwinpthread-1.dll", "libstdc++-6.dll", "libgcc_s_seh-1.dll")
          jarDir.contains("linux-") -> listOf("libtokenizers.so")
          jarDir.contains("osx-") -> listOf("libtokenizers.dylib")
          else -> emptyList()
        }

    try {
      JarFile(jar).use { jf ->
        for (name in requiredNames) {
          val entryName = "$jarDir/$name"
          val entry =
              jf.getJarEntry(entryName)
                  ?: throw IllegalStateException(
                      "Missing tokenizers native entry in jar: $entryName")

          val outFile = File(runDir, name)
          jf.getInputStream(entry).use { input ->
            outFile.outputStream().use { output -> input.copyTo(output) }
          }
        }
      }
    } catch (X: Exception) {
      log(AI.LogLevel.ERROR, "Failed to extract tokenizers natives: ${X.message}", "", X)
      return false
    }

    val missing = requiredNames.filter { !File(runDir, it).exists() }
    if (missing.isNotEmpty()) {
      log(AI.LogLevel.ERROR, "Tokenizers natives missing after extraction: $missing")
      log(AI.LogLevel.ERROR, "Expected files in: ${runDir.absolutePath}")
      runDir.listFiles()?.forEach { file ->
        log(AI.LogLevel.ERROR, "  Found: ${file.name} (${file.length()} bytes)")
      }
      return false
    }

    // Verify all required files exist and log their sizes
    requiredNames.forEach { name ->
      val file = File(runDir, name)
      if (file.exists()) {
        log(
            AI.LogLevel.INFO,
            "Tokenizers native library verified: ${file.name} (${file.length()} bytes)")
      } else {
        log(AI.LogLevel.ERROR, "Tokenizers native library missing: ${file.absolutePath}")
      }
    }

    if (System.getProperty("RUST_FLAVOR").isNullOrEmpty()) System.setProperty("RUST_FLAVOR", "cpu")

    // Add tokenizers native directory to java.library.path so JNA can find the libraries
    val currentLibraryPath = System.getProperty("java.library.path") ?: ""
    val newLibraryPath =
        if (currentLibraryPath.isEmpty()) {
          runDir.absolutePath
        } else {
          "$currentLibraryPath${File.pathSeparator}${runDir.absolutePath}"
        }
    System.setProperty("java.library.path", newLibraryPath)
    log(
        AI.LogLevel.INFO,
        "Added tokenizers native dir to java.library.path: ${runDir.absolutePath}")

    // IMPORTANT:
    // tokenizers-0.36.0 has a Windows CPU bug: when RUST_LIBRARY_PATH points to a directory,
    // it tries to call `cudaArch.isEmpty()` and crashes if cudaArch is null.
    // If we point RUST_LIBRARY_PATH directly at the library file, it takes the "regular file" path
    // and avoids that NPE.
    val libFile =
        when {
          jarDir.contains("win-x86_64") -> File(runDir, "tokenizers.dll")
          jarDir.contains("linux-") -> File(runDir, "libtokenizers.so")
          jarDir.contains("osx-") -> File(runDir, "libtokenizers.dylib")
          else -> File(runDir, "tokenizers.dll")
        }
    System.setProperty("RUST_LIBRARY_PATH", libFile.absolutePath)
    tokenizersNativeRunDir = runDir
    log(AI.LogLevel.INFO, "Set RUST_LIBRARY_PATH to: ${libFile.absolutePath}")
    log(AI.LogLevel.INFO, "Tokenizers native libraries ready in: ${runDir.absolutePath}")
    return true
  }

  override fun getName(): String = "CodBi_AI_Donut_vQA"

  /** Initializes DONUT models if Active_AI contains both DONUT and ONNX. */
  override fun initialize(configData: IPluginInitializeData) {
    donutActive = false
    loadError = null
    modelsReady = false
    pluginFolder = configData.fileHelper.pluginFolder

    val aiRemove = configData.properties.getProperty("AI_Remove")?.lowercase() ?: ""
    if (aiRemove.contains("donut")) {
      cleanupDonutFiles()
      return
    }

    val activeAI = configData.properties.getProperty("Active_AI")?.lowercase() ?: ""
    donutActive = activeAI.contains("donut") && !activeAI.contains("donut_pytorch")

    if (donutActive) {
      if (!ensureTokenizersNativeLibraries()) {
        log(
            AI.LogLevel.ERROR,
            "Failed to set up tokenizers native libraries before ONNX initialization")
      }
    }

    // DJL HuggingFace tokenizers uses native libs and extracts them into the DJL cache dir.
    // In a hot-reload scenario, the exact same DLL path can be loaded by multiple classloaders and
    // fail.
    // Use a per-plugin-load DJL cache dir to avoid "already loaded in another classloader".
    val djlCacheRoot = File(configData.fileHelper.pluginFolder, "ai/djl-cache")
    val djlRunDir = File(djlCacheRoot, "run-${System.currentTimeMillis()}")
    djlCacheRoot.mkdirs()
    djlRunDir.mkdirs()
    purgeOldDjlRunDirs(djlCacheRoot, keepNewest = 3)
    System.setProperty("DJL_CACHE_DIR", djlRunDir.absolutePath)
    System.setProperty("ENGINE_CACHE_DIR", djlRunDir.absolutePath)
    log(AI.LogLevel.INFO, "Set DJL_CACHE_DIR / ENGINE_CACHE_DIR to: ${djlRunDir.absolutePath}")

    super.initialize(configData)

    if (!donutActive) {
      log(AI.LogLevel.INFO, "DONUT ONNX not activated")
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
      log(AI.LogLevel.ERROR, "DONUT setup failed: ${X.message}", "", X)
    }
  }

  private fun <T> runWithTimeout(name: String, timeoutSeconds: Long, work: () -> T): T {
    val future = CompletableFuture.supplyAsync { work() }
    try {
      return future.get(timeoutSeconds, TimeUnit.SECONDS)
    } catch (X: TimeoutException) {
      future.cancel(true)
      throw TimeoutException("$name timed out after ${timeoutSeconds}s")
    }
  }

  /** Loads encoder and decoder ONNX models. */
  private fun loadModels() {
    log(AI.LogLevel.INFO, "donutModelDir: $donutModelDir")
    val modelPath =
        donutModelDir?.absolutePath ?: throw IllegalStateException("Model directory not set")
    log(AI.LogLevel.INFO, "Model path: $modelPath")

    val encoderFile = File(modelPath, "encoder_model_fp16.onnx")
    val decoderFile = File(modelPath, "decoder_model_fp16.onnx")
    val encoderSize = encoderFile.length()
    val decoderSize = decoderFile.length()
    log(
        AI.LogLevel.INFO,
        "Encoder file exists: ${encoderFile.exists()}, size=${encoderSize}, path: ${encoderFile.absolutePath}")
    log(
        AI.LogLevel.INFO,
        "Decoder file exists: ${decoderFile.exists()}, size=${decoderSize}, path: ${decoderFile.absolutePath}")

    log(AI.LogLevel.INFO, "Building encoder criteria...")
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
        encoderModel =
            // runWithTimeout("encoderCriteria.loadModel()", 180) {
            encoderCriteria.loadModel() as ZooModel<NDList, NDList>
        // }
      } finally {
        Thread.currentThread().contextClassLoader = oldClassLoader
      }
      loadedModels["donut-encoder"] = encoderModel!!
      log(AI.LogLevel.INFO, "Encoder model loaded")
    } catch (X: Throwable) {
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
            .optModelPath(decoderFile.toPath())
            .optTranslator(
                translatorInstance as ai.djl.translate.Translator<Pair<DjlImage, String>, String>)
            .build()

    log(AI.LogLevel.INFO, "Loading decoder model...")
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

    log(AI.LogLevel.INFO, "Encoder and decoder models loaded")

    loadTokenizer(modelPath)
    initPredictorPools()
  }

  private fun downloadTo(url: String, targetFile: File) {
    targetFile.parentFile?.mkdirs()
    URL(url)
        .openConnection()
        .apply {
          connectTimeout = 15_000
          readTimeout = 600_000
          setRequestProperty("User-Agent", "CodBi-DONUT/1.0")
        }
        .getInputStream()
        .use { input -> targetFile.outputStream().use { output -> input.copyTo(output) } }
  }

  private fun ensureDonutModelFiles() {
    val dir = donutModelDir ?: return

    val base = "https://huggingface.co/Xenova/donut-base-finetuned-docvqa/resolve/main"
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

  private fun loadTokenizer(modelPath: String) {
    val oldClassLoader = Thread.currentThread().contextClassLoader
    try {
      Thread.currentThread().contextClassLoader = this.javaClass.classLoader

      // Explicitly load the tokenizers native library before creating HuggingFaceTokenizer
      // This is necessary because JNA caches java.library.path early, so setting it at runtime
      // doesn't work
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
            log(AI.LogLevel.INFO, "Tokenizers native library loaded successfully")
          } catch (X: UnsatisfiedLinkError) {
            log(AI.LogLevel.ERROR, "Failed to load tokenizers native library: ${X.message}", "", X)
            // Continue anyway - HuggingFaceTokenizer might still work
          }
        } else {
          log(
              AI.LogLevel.WARNING,
              "Tokenizers native library file not found: ${libFile.absolutePath}")
        }
      } else {
        log(AI.LogLevel.WARNING, "Tokenizers native run directory not set or doesn't exist")
      }

      val tokenizerPath = Paths.get(modelPath, "tokenizer.json")
      val tokenizerFile = File(tokenizerPath.toUri())
      if (!tokenizerFile.exists()) {
        throw IllegalStateException("Tokenizer file does not exist: ${tokenizerFile.absolutePath}")
      }
      log(AI.LogLevel.INFO, "Loading tokenizer from ${tokenizerFile.absolutePath}")
      tokenizer = HuggingFaceTokenizer.newInstance(tokenizerPath)
      log(AI.LogLevel.INFO, "Tokenizer loaded successfully from $tokenizerPath")
    } catch (X: Throwable) {
      log(AI.LogLevel.ERROR, "Failed to load tokenizer: ${X.javaClass.name}: ${X.message}", "", X)
      X.cause?.let {
        log(AI.LogLevel.ERROR, "Caused by: ${it.javaClass.name}: ${it.message}", "", it)
      }
      throw X
    } finally {
      Thread.currentThread().contextClassLoader = oldClassLoader
    }
  }

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
      log(AI.LogLevel.INFO, "Initialized predictor pool donut-encoder (size=$poolSize)")
    }

    if (!predictorPools.containsKey("donut-decoder-loop")) {
      val pool = LinkedBlockingQueue<ai.djl.inference.Predictor<*, *>>()
      repeat(poolSize) {
        pool.offer(
            loopModel.newPredictor(passThroughTranslator) as ai.djl.inference.Predictor<*, *>)
      }
      predictorPools["donut-decoder-loop"] = pool
      log(AI.LogLevel.INFO, "Initialized predictor pool donut-decoder-loop (size=$poolSize)")
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
    for (i in 0 until 50) {
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

  /** Handles incoming requests. */
  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    log(AI.LogLevel.INFO, "DONUT ONNX execute called")
    if (onnxMarkedForRemoval) {
      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"ONNX is disabled because AI_Remove contains ONNX\"}"))
    }
    if (!donutActive || !isActive) {
      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"DONUT ONNX is not active. donutActive=$donutActive, isActive=$isActive\"}"))
    }

    loadError?.let { err ->
      return errorResponse("DONUT ONNX failed to load models: ${err.message}")
    }
    if (!modelsReady || encoderModel == null || decoderModelForLoop == null || tokenizer == null) {
      return errorResponse("DONUT ONNX is not initialized")
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
      val tokenizer = tokenizer ?: return errorResponse("Tokenizer not loaded")

      params.uploadFiles?.forEach { (inputName, fileItem) ->
        log(AI.LogLevel.INFO, "Processing file: $inputName")

        val combinedBytes =
            fileItem.stream().use { stream ->
              stream.map { it.data }.reduce { acc, bytes -> acc + bytes }.orElse(byteArrayOf())
            }

        combinedBytes.inputStream().use { inputStream ->
          val djlImg = ImageFactory.getInstance().fromInputStream(inputStream)
          val results = mutableMapOf<String, String>()

          NDManager.newBaseManager().use { manager ->
            // region Image preprocessing
            val resizedImage = djlImg.resize(960, 1280, true)
            var array = resizedImage.toNDArray(manager)
            array = array.transpose(2, 0, 1).toType(DataType.FLOAT32, false)

            val mean = manager.create(floatArrayOf(0.485f, 0.456f, 0.406f)).reshape(3, 1, 1)
            val std = manager.create(floatArrayOf(0.229f, 0.224f, 0.225f)).reshape(3, 1, 1)
            array = array.div(255.0f).sub(mean).div(std)
            val pixelValues = array
            // endregion Image preprocessing

            val encoderPredictor =
                acquirePredictor<NDList, NDList>("donut-encoder")
                    ?: throw IllegalStateException("No predictor available for donut-encoder")

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
                  results[key] = "Error: ${X.message}"
                  log(AI.LogLevel.ERROR, "Error processing \"$question\": ${X.message}", "", X)
                }
              }
            } finally {
              releasePredictor("donut-decoder-loop", decoderPredictor)
            }
          }

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
    log(AI.LogLevel.INFO, "DONUT ONNX shutdown complete")
  }
}
