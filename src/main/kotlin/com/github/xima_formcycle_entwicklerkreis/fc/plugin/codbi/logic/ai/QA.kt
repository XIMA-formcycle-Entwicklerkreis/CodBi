package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai

import ai.djl.engine.Engine
import ai.djl.huggingface.tokenizers.HuggingFaceTokenizer
import ai.djl.inference.Predictor
import ai.djl.modality.cv.Image as DjlImage
import ai.djl.modality.cv.ImageFactory
import ai.djl.modality.cv.util.NDImageUtils
import ai.djl.ndarray.NDArray
import ai.djl.ndarray.NDList
import ai.djl.ndarray.types.DataType
import ai.djl.pytorch.engine.PtEngineProvider
import ai.djl.repository.zoo.Criteria
import ai.djl.training.ParameterStore
import ai.djl.translate.Translator
import ai.djl.translate.TranslatorContext
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI.LogLevel
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
import java.io.BufferedInputStream
import java.io.File
import java.io.FileOutputStream
import java.net.URL
import java.nio.file.Paths
import java.util.*
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream
import org.slf4j.LoggerFactory

object DonutEngineWrapper {
  // UPDATED: Use Pair for Input (Image + Question)
  public var criteria: Criteria<kotlin.Pair<DjlImage, String>, String>? = null
  private val initialized = AtomicBoolean(false)
  public var model: ai.djl.Model? = null

  // UPDATED: Predictor Pool now handles Pairs
  public val pool = LinkedBlockingQueue<Predictor<kotlin.Pair<DjlImage, String>, String>>()
  public const val POOL_SIZE = 1

  public var modelDir: File? = null

  fun maybeInitialize(pluginFolder: File) {
    modelDir = File(pluginFolder, "models/donut-docvqa")
    if (!modelDir!!.exists()) modelDir?.mkdirs()

    // UPDATED: Switch to DocVQA Model Files
    val modelFiles =
        mapOf(
            "pytorch_model.bin" to
                "https://huggingface.co/naver-clova-ix/donut-base-finetuned-docvqa/resolve/main/pytorch_model.bin",
            "config.json" to
                "https://huggingface.co/naver-clova-ix/donut-base-finetuned-docvqa/resolve/main/config.json",
            "tokenizer.json" to
                "https://huggingface.co/naver-clova-ix/donut-base-finetuned-docvqa/resolve/main/tokenizer.json",
            // CRITICAL: added_tokens.json is required for <s_question> tags
            "added_tokens.json" to
                "https://huggingface.co/naver-clova-ix/donut-base-finetuned-docvqa/resolve/main/added_tokens.json",
            "special_tokens_map.json" to
                "https://huggingface.co/naver-clova-ix/donut-base-finetuned-docvqa/resolve/main/special_tokens_map.json")

    // 1. Download Logic
    modelFiles.forEach { (name, urlStr) ->
      val targetFile = File(modelDir, if (name == "pytorch_model.bin") "donut_docvqa.pt" else name)
      if (!targetFile.exists()) {
        println("Downloading $name...")
        URL(urlStr).openStream().use { input ->
          FileOutputStream(targetFile).use { output -> input.copyTo(output) }
        }
      }
    }

    println("defining criteria model (DocVQA)")

    // 2. Link files via Criteria
    criteria =
        Criteria.builder()
            .setTypes(
                kotlin.Pair::class.java as Class<kotlin.Pair<DjlImage, String>>,
                String::class.java) // Input is Pair, Output is String
            .optModelUrls(modelDir?.toURI().toString())
            .optEngine("PyTorch")
            .optOption("model_file", "donut_docvqa.pt")
            .optOption("trainParam", "false")
            .optOption("mapLocation", "true")
            .optModelName("donut_docvqa")
            .optOption("precxx11", "true")
            .optTranslator(DonutTranslator(modelDir!!.absolutePath))
            .build()

    try {
      // Just creating the criteria here, actual load happens in execute if null
    } catch (x: Throwable) {
      println("Failed to build criteria: ${x}")
    }

    initialized.set(true)
  }

  fun shutdown() {
    while (pool.isNotEmpty()) {
      pool.poll()?.close()
    }
    model?.close()
    model = null
    initialized.set(false)
  }
}

/**
 * Translator now accepts Pair<Image, String> The String is the Question (e.g., "What is the
 * total?")
 */
class DonutTranslator(private val modelDir: String) :
    Translator<kotlin.Pair<DjlImage, String>, String> {

  private var tokenizer: HuggingFaceTokenizer? = null

  override fun prepare(ctx: TranslatorContext) {
    val oldClassLoader = Thread.currentThread().contextClassLoader
    Thread.currentThread().contextClassLoader = this.javaClass.classLoader
    if (System.getProperty("ai.djl.huggingface.tokenizers.version") == null) {
      System.setProperty("ai.djl.huggingface.tokenizers.version", "0.31.0")
    }

    val tokenizerPath = Paths.get(modelDir, "tokenizer.json")
    tokenizer = HuggingFaceTokenizer.newInstance(tokenizerPath)

    Thread.currentThread().contextClassLoader = oldClassLoader
  }

  override fun processInput(ctx: TranslatorContext, input: kotlin.Pair<DjlImage, String>): NDList {
    val manager = ctx.ndManager

    // 1. Unpack Input
    val image = input.first
    val question = input.second
    println("Current question:${question}")
    // 2. Image Processing
    var array = image.toNDArray(manager)
    if (array.shape.dimension() == 4) {
      array = array.squeeze(0)
    }
    array = NDImageUtils.resize(array, 960, 1280)
    array = array.transpose(2, 0, 1)
    var pixelValues = array.toType(DataType.FLOAT32, false).div(255.0f)
    val mean = manager.create(floatArrayOf(0.485f, 0.456f, 0.406f)).reshape(3, 1, 1)
    val std = manager.create(floatArrayOf(0.229f, 0.224f, 0.225f)).reshape(3, 1, 1)
    pixelValues = pixelValues.sub(mean).div(std)

    // Save 4D for the manual loop
    ctx.setAttachment("pixel_values", pixelValues.expandDims(0))

    // 3. Prompt Construction for DocVQA
    // Format: <s_docvqa><s_question>{question}</s_question><s_answer>
    val prompt = "<s_docvqa><s_question>$question</s_question><s_answer>"

    var encoding = tokenizer!!.encode(prompt)
    var finalIDs = encoding.ids
    finalIDs = encoding.ids.dropLast(1).toLongArray()
    println("startids:")

    finalIDs.forEach { id -> println("${id}") }
    val promptIds = finalIDs

    // IMPORTANT: We need to know where the prompt ends to start generating the answer
    // We pass the last token of the prompt to processOutput to start the loop
    val lastPromptToken = promptIds.last()
    ctx.setAttachment("promptIds", promptIds)

    // Create Decoder Input (Feed the whole prompt sequence to context)
    val decoderInputIds = manager.create(promptIds)

    // Return SQUEEZED values (3D image, 1D ids) so DJL Predictor adds the batch dim
    return NDList(pixelValues.squeeze(), decoderInputIds.squeeze())
  }

  override fun processOutput(ctx: TranslatorContext, list: NDList): String {
    println("process output called")
    val manager = ctx.ndManager
    val ps = ParameterStore(manager, false)

    val pixelValues =
        ctx.getAttachment("pixel_values") as? NDArray
            ?: throw IllegalStateException("Pixel values not found")

    // Start generating FROM the end of the question
    val promptIds = ctx.getAttachment("promptIds") as LongArray

    val currentIds = promptIds.toMutableList()

    try {
      // Loop to generate the answer (usually short, 30 tokens is plenty for extraction)
      for (i in 0 until 50) {

        val decoderInput =
            manager.create(currentIds.toLongArray()).reshape(1, currentIds.size.toLong())

        // Inputs: Image Features + Current Decoder Token
        val inputs = NDList(pixelValues, decoderInput)

        val output = ctx.model.block.forward(ps, inputs, false) as NDList
        val logits = output[0]
        val lastTokenLogits = logits.get(":, -1, :")

        // ArgMax to get the predicted ID
        val nextTokenId = lastTokenLogits.argMax(1).getLong(0)

        decoderInput.close()
        output.close()
        lastTokenLogits.close()
        println("Next Token (maybe break):${nextTokenId}")
        // EOS Token is 2
        if (nextTokenId == 2L) break

        currentIds.add(nextTokenId)
      }
    } catch (e: Exception) {
      println("Error in generation loop: ${e.message}")
    } finally {
      pixelValues.close()
    }
    val answerIds = currentIds.drop(promptIds.size).toLongArray()
    return tokenizer?.decode(answerIds) ?: ""
  }
}

class NativeDownloader(private val logger: org.slf4j.Logger) {
  fun ensureNativesExist(targetDir: File, version: String) {
    val checkFile = File(targetDir, if (isWindows()) "torch.dll" else "libtorch.so")
    if (checkFile.exists()) return

    val osStr = if (isWindows()) "win-x86_64" else "linux-x86_64"
    val downloadUrl = "https://publish.djl.ai/pytorch/$version/$osStr/cpu/native/lib.zip"

    try {
      targetDir.mkdirs()
      val url = URL(downloadUrl)
      url.openStream().use { input ->
        BufferedInputStream(input).use { buffered ->
          ZipInputStream(buffered).use { zip ->
            var entry: ZipEntry?
            while (zip.nextEntry.also { entry = it } != null) {
              val file = File(targetDir, entry!!.name)
              if (entry!!.isDirectory) file.mkdirs()
              else {
                file.parentFile.mkdirs()
                FileOutputStream(file).use { zip.copyTo(it) }
              }
            }
          }
        }
      }
    } catch (e: Exception) {
      logger.error("Download failed", e)
    }
  }

  private fun isWindows() = System.getProperty("os.name").lowercase().contains("win")
}

class DonutAction2QA : IPluginServletAction {
  /**
   * The predicate used to [log] messages related to CodBi / AI to the console (defaults to **CodBi
   * / AI**).
   */
  protected var idLogMessages = ""

  /** Defines the various importance-states that can be passed to the [log]ger. */
  enum class LogLevel {
    INFO,
    WARNING,
    ERROR
  }

  protected open fun log(importance: LogLevel, toLog: String) {
    when (importance) {
      LogLevel.INFO ->
          logger.info(
              "[[ CodBi / AI${ if( idLogMessages.isEmpty()) "" else " / $idLogMessages"} ]] $toLog ]")
      LogLevel.WARNING ->
          logger.warn(
              "[[ CodBi / AI${ if( idLogMessages.isEmpty()) "" else " / $idLogMessages"} ]] $toLog ]")
      LogLevel.ERROR ->
          logger.error(
              "[[ CodBi / AI${ if( idLogMessages.isEmpty()) "" else " / $idLogMessages"} ]] $toLog ]")
    }
  }

  /** The [org.slf4j.Logger] for this [TesseractAction]. */
  protected val logger = LoggerFactory.getLogger(TesseractAction::class.java)

  private var active = false

  override fun getName() = "CodBi_Donut_QA"

  companion object {
    init {
      System.setProperty("PYTORCH_VERSION", "2.7.1")
      System.setProperty("ai.djl.pytorch.version", "2.7.1")
      System.setProperty("ai.djl.pytorch.num_interop_threads", "1")
      System.setProperty("ai.djl.pytorch.num_threads", "1")
      System.setProperty("ai.djl.huggingface.tokenizers.version", "0.36.0")
    }
  }

  fun getLoadedLibraries(loader: ClassLoader): List<String> {
    try {
      // Zugriff auf das private Feld 'nativeLibraries' im ClassLoader
      val field = ClassLoader::class.java.getDeclaredField("nativeLibraries")
      field.isAccessible = true

      val libs = field.get(loader) as? Vector<*> ?: return emptyList()

      return libs.mapNotNull { lib ->
        try {
          // Das Objekt 'lib' ist vom Typ ClassLoader$NativeLibrary
          val nameField = lib!!.javaClass.getDeclaredField("name")
          nameField.isAccessible = true
          nameField.get(lib) as String
        } catch (e: Exception) {
          "Unbekannte Lib (Fehler: ${e.message})"
        }
      }
    } catch (e: Exception) {
      return listOf("Fehler beim Zugriff auf nativeLibraries: ${e.message}")
    }
  }

  override fun initialize(configData: IPluginInitializeData) {

    println("Init DocVQA")
    if (!(configData.properties.getProperty("Active_AI")?.lowercase() ?: "").contains("donut")) {
      return
    }

    System.setProperty("java.library.path", System.getProperty("java.library.path") + "")

    val djlCache = File(configData.fileHelper.pluginFolder, "djl_cache")
    if (!djlCache.exists()) djlCache.mkdirs()

    try {
      try {
        // Check if PyTorch is already loaded; if not, register it manually
        if (!Engine.getAllEngines().contains("PyTorch")) {
          Engine.registerEngine(PtEngineProvider())
        }
      } catch (e: Exception) {
        // Log this specifically to see if the provider class itself is missing
        logger.error("Failed to manually register PyTorch Engine", e)
      }
      // WICHTIG: Kontext-Classloader für DJL-Discovery kurzzeitig umschalten

      val oldClassLoader = Thread.currentThread().contextClassLoader
      try {
        val nativesDir = configData.fileHelper.pluginFolder.resolve("pytorch-natives")

        NativeDownloader(logger).ensureNativesExist(nativesDir, "2.4.0")

        val libs =
            listOf(
                "libiomp5md.dll",
                "mkl_core.1.dll",
                "mkl_intel_thread.1.dll",
                "mkl_def.1.dll",
                "asmjit.dll",
                "fbgemm.dll",
                "uv.dll", /*"c10.dll",*/
                "torch_cpu.dll",
                "torch.dll",
                "djl_torch.dll")

        println("XIX14")

        var current: ClassLoader? = this.javaClass.classLoader // ClassLoader.getSystemClassLoader()
        /*while (current != null) {
            println("Loader: $current")
            current = current.parent
        }*/

        try {
          // Hol dir den aktuellen ClassLoader deines Plugins
          val myLoader = current

          // Rufe die Funktion auf
          val loadedLibs = getLoadedLibraries(myLoader!!)

          // Ausgabe der Liste
          if (loadedLibs.isEmpty()) {
            println("Keine nativen Bibliotheken für diesen ClassLoader registriert.")
          } else {
            println("--- Geladene Native Libs ($myLoader) ---")
            loadedLibs.forEach { libPath -> println("Geladen: $libPath") }
            println("------------------------------------------")
          }
        } catch (e: Exception) {
          println("Fehler beim Auslesen der Lib-Liste: ${e.message}")
        }

        if (System.getProperty("os.name").lowercase().contains("win")) {
          libs.forEach { lib ->
            val f = File(nativesDir, lib)
            if (f.exists()) {
              try {
                System.load(f.absolutePath)
              } catch (e: UnsatisfiedLinkError) {
                // DAS ist der wichtige Teil: Wenn sie schon geladen ist (anderer Plugin-Deploy),
                // ist das KEIN Fehler, sondern gut! Wir loggen es nur als Debug.
                logger.debug("⚠️ DLL $lib war bereits geladen (das ist okay).")
              } catch (e: Exception) {
                logger.warn("Fehler beim Laden von $lib: ${e.message}")
              }
            }
          }
        }
        Thread.currentThread().contextClassLoader = current
        // Wrapper initialisieren (geschützt gegen Mehrfach-Laden)

        println("Führe MaybeInitialize aus....")
        DonutEngineWrapper.maybeInitialize(nativesDir)

        active = true
        log(LogLevel.INFO, "Donut AI über Wrapper erfolgreich gestartet.")
      } finally {
        Thread.currentThread().contextClassLoader = oldClassLoader
      }
    } catch (e: Exception) {
      log(LogLevel.ERROR, "Kritischer Fehler bei Donut-Initialisierung: ${e.message}")
      e.printStackTrace()
    }

    println("Init DocVQA finished")
  }

  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    if (!active)
        return PluginServletActionRetVal(
            ServletResponse(EResponseType.JSON, "{\"error\":\"Inactive\"}"))
    println("XXX:105")
    // Initialize Model if null
    if (DonutEngineWrapper.model == null) {
      val oldClassLoader = Thread.currentThread().contextClassLoader
      Thread.currentThread().contextClassLoader = this.javaClass.classLoader
      DonutEngineWrapper.model = DonutEngineWrapper.criteria?.loadModel()

      repeat(DonutEngineWrapper.POOL_SIZE) {
        val predictor =
            DonutEngineWrapper.model?.newPredictor(
                DonutTranslator(DonutEngineWrapper.modelDir!!.absolutePath))
        DonutEngineWrapper.pool.offer(predictor)
      }
      Thread.currentThread().contextClassLoader = oldClassLoader
    }

    // --- DEFINE QUESTIONS HERE ---
    // These are the fields you want to extract from ANY document
    val questionsToAsk =
        mapOf(
            // "doc_type" to "What type of document is this?",
            // "title" to "What is the title?",
            "total" to "What is Betrag?",
            // "date" to "What is the date?",
            // x"sender" to "Who is the sender?"
        )

    val finalResults = mutableMapOf<String, Map<String, String>>()

    try {
      params.uploadFiles?.forEach { (inputName, fileItem) ->
        val combinedBytes =
            fileItem.stream().use { stream ->
              stream.map { it.data }.reduce { acc, bytes -> acc + bytes }.orElse(byteArrayOf())
            }

        combinedBytes.inputStream().use { inputStream ->
          val djlImg = ImageFactory.getInstance().fromInputStream(inputStream)

          val fileResults = mutableMapOf<String, String>()

          // Loop through questions for this single image
          questionsToAsk.forEach { (key, question) ->
            val predictor =
                DonutEngineWrapper.pool.poll(30, TimeUnit.SECONDS)
                    ?: throw IllegalStateException("Pool Timeout")

            try {
              // Pass Pair(Image, Question)
              val answer = predictor.predict(kotlin.Pair(djlImg, question))
              fileResults[key] = answer
            } catch (e: Exception) {
              fileResults[key] = "Error: ${e.message}"
            } finally {
              DonutEngineWrapper.pool.offer(predictor)
            }
          }
          finalResults[inputName] = fileResults
        }
      }
    } catch (e: Exception) {
      log(LogLevel.ERROR, "Execution failed: ${e.message}")
      return PluginServletActionRetVal(
          ServletResponse(EResponseType.JSON, "{\"error\":\"${e.message}\"}"))
    }

    // Convert Map to JSON String manually
    val jsonParts =
        finalResults.map { (filename, fields) ->
          val fieldJson =
              fields.entries.joinToString(",") { (k, v) -> "\"$k\":\"${v.replace("\"", "")}\"" }
          "\"$filename\": { $fieldJson }"
        }
    val jsonResponse = jsonParts.joinToString(",", "{", "}")
    println("RESULT:${jsonResponse}")
    return PluginServletActionRetVal(
        ServletResponse(EResponseType.JSON).apply { value = jsonResponse })
  }

  override fun shutdown(shutdownData: IPluginShutdownData?) {
    DonutEngineWrapper.shutdown()
  }

  override fun validateConfigurationData(
      configData: IPluginValidationData
  ): IPluginInitializeValidationResult? = null
}
