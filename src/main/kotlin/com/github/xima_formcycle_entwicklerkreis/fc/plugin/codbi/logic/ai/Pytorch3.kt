package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai

import ai.djl.Model
import ai.djl.engine.Engine
import ai.djl.huggingface.tokenizers.HuggingFaceTokenizer
import ai.djl.inference.Predictor
import ai.djl.modality.cv.Image as DjlImage
import ai.djl.modality.cv.ImageFactory
import ai.djl.ndarray.NDArray
import ai.djl.ndarray.NDList
import ai.djl.pytorch.engine.PtEngineProvider
import ai.djl.repository.zoo.Criteria
import ai.djl.training.ParameterStore
import ai.djl.translate.Translator
import ai.djl.translate.TranslatorContext
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.DonutEngineWrapper.POOL_SIZE
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.DonutEngineWrapper.criteria
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.DonutEngineWrapper.model
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeValidationResult
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginValidationData
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.io.BufferedInputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.nio.file.Paths
import java.security.MessageDigest
import java.util.*
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream

object DonutEngineWrapper {
  public var criteria: Criteria<DjlImage, String>? = null

  const val EXPECTED_SHA256 = "690bcc1bea84f9c76608d05453dac7246c44aec5809709f1937966f91f1659a3"
  private val initialized = AtomicBoolean(false)
  public var model: ai.djl.Model? = null
  public val pool = LinkedBlockingQueue<Predictor<DjlImage, String>>()
  public const val POOL_SIZE = 1

  fun calculateChecksum(file: File): String {
    val digest = MessageDigest.getInstance("SHA-256")
    FileInputStream(file).use { fis ->
      val buffer = ByteArray(8192)
      var bytesRead = fis.read(buffer)
      while (bytesRead != -1) {
        digest.update(buffer, 0, bytesRead)
        bytesRead = fis.read(buffer)
      }
    }
    return digest.digest().joinToString("") { "%02x".format(it) }
  }

  fun getRemoteSize(fileUrl: String): Long {
    var currentUrl = fileUrl
    for (i in 0..4) { // Manual redirect handling
      val connection = URL(currentUrl).openConnection() as HttpURLConnection
      connection.requestMethod = "HEAD"
      connection.instanceFollowRedirects = false

      val responseCode = connection.responseCode
      if (responseCode in 300..399) {
        currentUrl = connection.getHeaderField("Location") ?: break
        continue
      }

      if (responseCode == HttpURLConnection.HTTP_OK) {
        // content-length returns a Long (bytes)
        return connection.contentLengthLong
      }
      break
    }
    return -1L
  }

  fun isValidSha256(hash: String?): Boolean {
    if (hash == null || hash.length != 64) {
      return false
    }
    // Regex: Match only numbers and lowercase/uppercase a-f
    val hexRegex = Regex("^[0-9a-fA-F]{64}$")
    return hexRegex.matches(hash)
  }

  fun getRemoteChecksum(fileUrl: String): String? {
    var currentUrl = fileUrl
    var connection: HttpURLConnection

    // Follow up to 5 redirects manually for the HEAD request
    for (i in 0..4) {
      val url = URL(currentUrl)
      connection = url.openConnection() as HttpURLConnection
      connection.requestMethod = "HEAD"
      connection.instanceFollowRedirects = false // HEAD redirects are tricky

      val responseCode = connection.responseCode
      if (responseCode == HttpURLConnection.HTTP_MOVED_TEMP ||
          responseCode == HttpURLConnection.HTTP_MOVED_PERM ||
          responseCode == 307 ||
          responseCode == 308) {

        currentUrl = connection.getHeaderField("Location")
        continue
      }

      if (responseCode == HttpURLConnection.HTTP_OK) {
        // HF specific header for LFS files
        val hfHash = connection.getHeaderField("X-Linked-Etag") ?: connection.getHeaderField("ETag")

        return hfHash?.replace("\"", "")?.removePrefix("sha256:")
      }
      break
    }
    return null
  }

  public var modelDir: File? = null

  fun maybeInitialize(pluginFolder: File) {
    modelDir = File(pluginFolder, "models/donut-base-v2")
    if (!modelDir!!.exists()) modelDir?.mkdirs()

    val modelFiles =
        mapOf(
            "pytorch_model.bin" to
                "https://huggingface.co/naver-clova-ix/donut-base-finetuned-cord-v2/resolve/main/pytorch_model.bin",
            "config.json" to
                "https://huggingface.co/naver-clova-ix/donut-base-finetuned-cord-v2/resolve/main/config.json",
            "tokenizer.json" to
                "https://huggingface.co/naver-clova-ix/donut-base-finetuned-cord-v2/resolve/main/tokenizer.json")

    // 1. Automatic Download Logic
    /* modelFiles.forEach { (originalName, downloadUrl) ->
        // Wir bestimmen den Namen, den wir im Dateisystem haben wollen
        val desiredName = if (originalName == "pytorch_model.bin") "donut_rvl_linear.pt" else originalName
        val targetFile = File(modelDir, desiredName)
        val legacyFile = File(modelDir, "pytorch_model.bin")

        when {
            // Fall 1: Die Datei existiert bereits mit dem richtigen Namen (.pt)
            targetFile.exists() -> {
                println("Datei ${targetFile.name} ist bereits vorhanden. Überspringe Download.")
            }

            // Fall 2: Die Datei existiert noch mit dem alten Namen (.bin) -> Umbenennen statt Download
            originalName == "pytorch_model.bin" && legacyFile.exists() -> {
                println("Alte Datei gefunden. Benenne ${legacyFile.name} in ${targetFile.name} um...")
                if (legacyFile.renameTo(targetFile)) {
                    println("Umbenennung erfolgreich.")
                } else {
                    println("Fehler beim Umbenennen!")
                }
            }

            // Fall 3: Nichts davon trifft zu -> Herunterladen
            else -> {
                println("Lade $originalName herunter und speichere als ${targetFile.name}...")
                URL(downloadUrl).openStream().use { inputStream ->
                    Files.copy(inputStream, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
                }
                println("Download von ${targetFile.name} abgeschlossen.")
            }
        }
    }*/
    println("defining criteria model 2")
    // 2. Link the downloaded files via Criteria
    criteria =
        Criteria.builder()
            .setTypes(DjlImage::class.java, String::class.java)
            // Use the absolute local path to the folder we just populated
            .optModelUrls(modelDir?.toURI().toString())
            .optEngine("PyTorch")
            // Explicitly name the weight file so DJL doesn't look for rpc.pt
            .optOption("model_file", "donut_rvl_linear2.pt")
            .optOption("trainParam", "false")
            .optOption("mapLocation", "true")
            .optModelName("donut_rvl_linear.pt")
            .optOption("precxx11", "true")
            .optTranslator(DonutTranslator(modelDir!!.absolutePath))
            .build()
    println("loading criteria model")

    try {} // model = criteria?.loadModel()}
    catch (x: Throwable) {
      println("Failed to load model cause: ${x}")
    }

    println("criteria model geladen")

    initialized.set(true)
    println("Donut-Modell geladen und Pool mit $POOL_SIZE Predictoren befüllt.")
    // ...

    // ... proceed to create predictor
  }

  fun getPredictorPool() = pool

  fun shutdown() {
    while (pool.isNotEmpty()) {
      pool.poll()?.close()
    }
    model?.close()
    model = null
    initialized.set(false)
  }
}

/** Separater Translator zur besseren Strukturierung */
class DonutTranslator(private val modelDir: String) : Translator<DjlImage, String> {

  private var tokenizer: HuggingFaceTokenizer? = null

  override fun prepare(ctx: TranslatorContext) {
    val oldClassLoader = Thread.currentThread().contextClassLoader
    Thread.currentThread().contextClassLoader = this.javaClass.classLoader
    if (System.getProperty("ai.djl.huggingface.tokenizers.version") == null) {
      System.setProperty("ai.djl.huggingface.tokenizers.version", "0.31.0")
    }
    // Lädt die tokenizer.json aus deinem Modell-Ordner
    val tokenizerPath = Paths.get(modelDir, "tokenizer.json")
    println("Tokenizer Path:${tokenizerPath}")
    tokenizer = HuggingFaceTokenizer.newInstance(tokenizerPath)
    val tasks = arrayOf("<s_cord-v2>", "<s_rvlcdip>", "<s_ticket>", "<s_docvqa>", "<s_gen_prompt>")
    tasks.forEach { task ->
      val ids = tokenizer?.encode(task)?.ids
      println("Task: $task hat die IDs: ${ids?.joinToString()}")
    }

    for (id in 57579 downTo 0) {
      try {
        val text = tokenizer?.decode(longArrayOf(id.toLong()))
        if (text != null && text.contains("<s_")) {
          println("Mögliches Task-Token gefunden: ID $id ist $text")
          // Teste diese ID im Modell!
        }
      } catch (e: Exception) {}
    }
    Thread.currentThread().contextClassLoader = oldClassLoader
  }

  var pixelValues: NDArray? = null

  override fun processInput(ctx: TranslatorContext, input: DjlImage): NDList {
    // ... (Image Loading / Resizing / Normalization same as before) ...
    // ... (Set "pixel_values" attachment same as before) ...

    // 1. Get the Question from the Context (passed from the Predictor)
    val question =
        ctx.getAttachment("question") as? String ?: "What is the document type?" // Default fallback

    // 2. Construct the Prompt Sequence
    // Format: <s_docvqa><s_question>{question}</s_question><s_answer>
    val prompt = "<s_docvqa><s_question>$question</s_question><s_answer>"

    // 3. Encode the Prompt
    val encoding = tokenizer!!.encode(prompt)
    val inputIds = encoding.ids

    // 4. Create Decoder Input
    // We send the full prompt sequence so the model knows the context
    val decoderInputIds = ctx.ndManager.create(inputIds)

    // Return SQUEEZED (3D image, 1D ids)
    return NDList(pixelValues.squeeze(), decoderInputIds.squeeze())
  }

  override fun processOutput(ctx: TranslatorContext, list: NDList): String {
    println("processoutput invoked")
    val manager = ctx.ndManager
    val ps = ParameterStore(manager, false)

    // 1. Holen der Bild-Features (muss im processInput als Attachment abgelegt worden sein)
    val pixelValues =
        ctx.getAttachment("pixel_values") as? NDArray
            ?: throw IllegalStateException("Pixel values not found in context. Check processInput!")

    val resultIds = mutableListOf<Long>()

    // 2. Start-Token für RVL-CDIP festlegen.
    // Laut deinem Log ist 34791 das Token, das den Task <s_rvlcdip> abschließt.
    var currentTokenId = 34791L

    println("[DonutAI] Starte RVL-CDIP Inferenz-Schleife...")

    try {
      for (i in 0 until 200) { // Limit auf 200 Tokens für die Performance
        println("loop: ${i}")
        // 3. Input-Tensor erstellen: Exakt Shape [1, 1]
        // Das entspricht der Matrix 1024x1024 im exportierten Modell
        val decoderInput = manager.create(longArrayOf(currentTokenId)).reshape(1, 1)

        val inputs = NDList(pixelValues, decoderInput.expandDims(0))

        // 4. Forward Pass (Modell-Rechnung)
        val output = ctx.model.block.forward(ps, inputs, false) as NDList
        val logits = output[0]

        // 5. Das wahrscheinlichste nächste Token ermitteln (ArgMax)
        val nextTokenId = logits.argMax(-1).toLongArray()[0]

        // Ressourcen sofort freigeben
        decoderInput.close()
        output.close()

        // 6. Abbruchbedingungen
        if (nextTokenId == 2L) { // 2 ist das EOS (End of Sentence) Token
          println("[DonutAI] EOS erreicht nach $i Schritten.")
          break
        }

        // Loop-Schutz: Falls das Modell anfängt, sich ständig zu wiederholen
        if (resultIds.size > 5 && resultIds.takeLast(3).all { it == nextTokenId }) {
          println("[DonutAI] Loop erkannt, breche ab.")
          break
        }

        resultIds.add(nextTokenId)

        // Das generierte Token wird der Input für den nächsten Schritt
        currentTokenId = nextTokenId

        // Optional: Debug-Ausgabe alle 10 Tokens
        if (i % 10 == 0 && i > 0) {
          println("[DonutAI] Generiere Token $i...")
        }
      }
    } catch (e: Exception) {
      println("[DonutAI] Fehler während der Generierung: ${e.message}")
      e.printStackTrace()
    } finally {
      pixelValues.close()
    }

    // 7. Dekodieren der ID-Liste in lesbaren Text (XML/JSON Struktur)
    val finalString = tokenizer?.decode(resultIds.toLongArray()) ?: ""
    println("[DonutAI] Generierter Text: $finalString")

    return finalString
  }
}

class NativeDownloader(private val logger: org.slf4j.Logger) {
  fun ensureNativesExist(targetDir: File, version: String) {
    val checkFile = File(targetDir, if (isWindows()) "torch.dll" else "libtorch.so")
    if (checkFile.exists()) {
      logger.info("📦 Native Libs vorhanden: ${targetDir.absolutePath}")
      return
    }
    val osStr = if (isWindows()) "win-x86_64" else "linux-x86_64"
    val downloadUrl = "https://publish.djl.ai/pytorch/$version/$osStr/cpu/native/lib.zip"

    logger.info("⬇️ Lade Natives herunter: $downloadUrl")
    try {
      targetDir.mkdirs()
      downloadAndUnzip(downloadUrl, targetDir)
    } catch (e: Exception) {
      logger.error("❌ Download fehlgeschlagen", e)
      throw RuntimeException("Konnte PyTorch Natives nicht laden.")
    }
  }

  private fun downloadAndUnzip(urlStr: String, targetDir: File) {
    val url = URL(urlStr)
    val conn = url.openConnection()
    conn.connectTimeout = 15000
    conn.readTimeout = 60000
    conn.getInputStream().use { input ->
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
  }

  private fun isWindows() = System.getProperty("os.name").lowercase().contains("win")
}

/**
 * DonutAction zur Extraktion von Informationen aus Dokumenten mittels Deep Learning. Nutzt DJL
 * (Deep Java Library) und das Donut-Modell (naver-clova-ix/donut-base).
 */
class DonutAction2 : AI() {

  private var active = false
  private var pluginRoot: File? = null

  // Pool für Predictoren (da ein Predictor nicht thread-safe ist)
  private val pool = LinkedBlockingQueue<Predictor<DjlImage, String>>()
  private val sizePool = 1 // Donut ist sehr RAM-intensiv, daher klein starten

  override fun getName() = "CodBi_Donut"

  companion object {
    init {
      System.setProperty("PYTORCH_VERSION", "2.7.1") // Muss zur JNI/Native-Version passen
      System.setProperty("ai.djl.pytorch.version", "2.7.1")
      System.setProperty("ai.djl.pytorch.jni_version", "2.7.1")
      System.setProperty("ai.djl.pytorch.num_interop_threads", "1")
      System.setProperty("ai.djl.pytorch.num_threads", "1")
      System.setProperty("ai.djl.huggingface.tokenizers.version", "0.36.0")
      // System.setProperty("DJL_CACHE_DIR", "C:/formcycle/djl_cache")
      // System.setProperty("ENGINE_CACHE_DIR", "C:/formcycle/djl_cache")
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
  }

  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    if (!active) {
      return PluginServletActionRetVal(
          ServletResponse(EResponseType.JSON, "{\"error\":\"Donut AI ist nicht aktiv.\"}"))
    }
    println("XXX21")
    if (DonutEngineWrapper.model == null) {

      val oldClassLoader = Thread.currentThread().contextClassLoader
      Thread.currentThread().contextClassLoader = this.javaClass.classLoader
      model = criteria?.loadModel()

      repeat(DonutEngineWrapper.POOL_SIZE) {
        val predictor =
            model?.newPredictor(DonutTranslator(DonutEngineWrapper.modelDir!!.absolutePath))
        DonutEngineWrapper.pool.offer(predictor)
      }

      Thread.currentThread().contextClassLoader = oldClassLoader
    }

    val ocrResults = mutableMapOf<String, String>()

    try {
      params.uploadFiles?.forEach { (inputName, fileItem) ->
        val combinedBytes =
            fileItem.stream().use { stream ->
              stream.map { it.data }.reduce { acc, bytes -> acc + bytes }.orElse(byteArrayOf())
            }

        combinedBytes.inputStream().use { inputStream ->
          val djlImg = ImageFactory.getInstance().fromInputStream(inputStream)

          // Predictor aus dem statischen Pool des Wrappers holen
          val predictor =
              DonutEngineWrapper.getPredictorPool().poll(30, TimeUnit.SECONDS)
                  ?: throw IllegalStateException("AI Pool Timeout")

          try {
            val resultJson = predictor.predict(djlImg)
            ocrResults[inputName] = resultJson
          } finally {
            DonutEngineWrapper.getPredictorPool().offer(predictor)
          }
        }
      }
    } catch (e: Exception) {
      log(LogLevel.ERROR, "Fehler bei Donut-Execution: ${e.message} / ${ e.stackTraceToString()}")
      return PluginServletActionRetVal(
          ServletResponse(EResponseType.JSON, "{\"error\":\"${e.message}\"}"))
    }

    val jsonResponse = ocrResults.entries.joinToString(",", "{", "}") { (k, v) -> "\"$k\":$v" }
    return PluginServletActionRetVal(
        ServletResponse(EResponseType.JSON).apply { value = jsonResponse })
  }

  override fun shutdown(shutdownData: IPluginShutdownData?) {

    // Hinweis: In einer Plugin-Umgebung ist es oft sicherer, den Pool NICHT zu leeren,
    // wenn er statisch ist, da die DLLs eh geladen bleiben.
    // Aber für sauberes Memory-Management rufen wir es auf.
    DonutEngineWrapper.shutdown()
  }

  override fun validateConfigurationData(
      configData: IPluginValidationData
  ): IPluginInitializeValidationResult? {
    // Validierung analog zu Tesseract, falls spezifische Sprachen nötig wären
    return null
  }

  override fun log(importance: LogLevel, toLog: String) {
    idLogMessages = "DonutAI"
    super.log(importance, toLog)
  }
}
