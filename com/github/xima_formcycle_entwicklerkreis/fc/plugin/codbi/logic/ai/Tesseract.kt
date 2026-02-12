package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai

// region Imports
// region XIMA
// endregion XIMA
// region Tesseract
// endregion Tesseract
// region CodBi
// endregion CodBi
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI
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
import java.io.File
import java.net.URI
import java.util.concurrent.*
import javax.servlet.ServletException
import net.sourceforge.tess4j.ITessAPI
import net.sourceforge.tess4j.TessAPI1

// endregion Imports
/**
 * Performs OCR on one or multiple images using the
 * [Tesseract](https://github.com/tesseract-ocr/tesseract).
 *
 * Returns either the whole text of the document(s) parsed or, if a **X-OCR-Regex** is found in the
 * header, only the text matching that regular expression separated by **:-:**.
 *
 * Reusing images that were already uploaded is possible in order to optimize traffic. Passing an
 * **X-OCR-Image-ID** within the header when requesting the **CodBi_Tesseract**-Action will make the
 * image persist for a specific amount of milliseconds ([msExpirationIDedImages]). The expiration
 * may be changed using the **AI_Tesseract_IDedImageExpiration**-Plugin-Property.
 *
 * Formcycle upload-fields that take advantage of CodBi's **Media.MultipleDownload** thus uploaded
 * more than one image are supported. The JSON returned will hold the properties named according to
 * the transmitted file's names holding the found text.
 */
class TesseractAction : AI() {
  /**
   * States whether this [TesseractAction] is currently active or not (**Active_AI** contains
   * **OCR** or not).
   */
  protected var active = false
  /** The CodBi-Plugin's root directory. */
  private var pluginRoot: File? = null
  /** The tesseract-handle pool. */
  private val pool = LinkedBlockingQueue<ITessAPI.TessBaseAPI>()
  /**
   * Specifies the size of the [pool]. Defaults to 2 to not exhaust the server. One should consider
   * the number of available CPU-Cores & RAM when determining the proper value for this property. A
   * good practice is Number of CPU-Cores / 2 = sizePool but RAM has also to be considered.
   * Calculate about 100MB per loaded language model. That is the approximate size of RAM needed for
   * one pool. So setting the [sizePool] to 2, will most probably consume 200MB.
   */
  private val sizePool = 2

  /**
   * The name of this [IPluginServletAction].
   *
   * @return The requested [String].
   */
  override fun getName() = "CodBi_AI_Tesseract"

  /**
   * Initializes this plugin if the CodBi-Plugin-Property **Active_AI** contains **OCR**. By
   * determining the [pluginRoot] it tells the [execute]-method where to store the temporary images.
   * Furthermore, the appropriate native libraries for the server's os will be extracted from the
   * JAR and copied onto the server's drive prior to being cloned to be provided as versions that
   * won't be locked due to possible previous initializations of the plugin. This servlet will check
   * if the appropriate models for the languages specified via the CodBi-Plugin-Property
   * **AI_Tesseract_Languages** (e.g. deu+ita+eng or just deu) are already present within the
   * Plugin's local resources and download the model for each language automatically, if not. If the
   * property is not set **deu** will be assumed.
   *
   * @param configData The [IPluginInitializeData] as provided by the formcycle environment.
   */
  override fun initialize(configData: IPluginInitializeData) {
    // region Remove local native libs and models, if no OCR configured.
    if (!(configData.properties.getProperty("Active_AI")?.lowercase() ?: "").contains("ocr")) {
      wipeLocalData()

      return
    }

    active = true
    // region Remove local native libs and models, if no OCR configured.
    // region Begin the observation of the [cacheIDedImages].
    janitorIDedImages = Executors.newSingleThreadScheduledExecutor()

    startJanitor()
    // endregion Begin the observation of the [AI.cacheIDedImages].
    // region Remove former library-clones.
    pluginRoot = configData.fileHelper.pluginFolder

    val tmpDir = pluginRoot?.resolve("Resources/AI/Tesseract/TmpNatives")?.apply { mkdirs() }

    if (tmpDir?.exists() == false)
        throw ServletException("Main temporary folder could not be accessed.")

    tmpDir
        ?.listFiles { file -> file.isDirectory && file.name.startsWith("tesseract_run_") }
        ?.forEach { oldFolder -> oldFolder.deleteRecursively() }
    // endregion Remove former library-clones.
    // region Setting directory for the native libraries and generating temporary directory for them
    // to prevent locks.
    // region Create plugin folder for native libs.
    val os = System.getProperty("os.name").lowercase()
    val arch = System.getProperty("os.arch").lowercase()
    val platformDirName =
        when {
          os.contains("win") -> "win32-x86-64"
          os.contains("linux") -> "linux-x86-64"
          os.contains("mac") -> "darwin-aarch64"
          else -> "unknown"
        }
    val dirNativeLibs =
        pluginRoot?.resolve("Resources/AI/Tesseract/Runtime/${ platformDirName }")?.apply {
          mkdirs()
        }

    if (dirNativeLibs?.exists() == false)
        log(
            LogLevel.ERROR,
            "Could not create the directories (Resources/AI/Tesseract/Runtime/${ platformDirName }) within the plugin folder. ")
    // endregion Create plugin folder for native libs.
    // region Extract native libs from JAR into plugin directory
    val libSuffix = if (os.contains("win")) ".dll" else if (os.contains("mac")) ".dylib" else ".so"
    val libTesseract =
        if (os.contains("win")) "libtesseract530"
        else if (os.contains("mac")) "libtesseract" else "libtesseract.so.5.0.5"
    val libLept =
        if (os.contains("win")) "libleptonica1850"
        else if (os.contains("mac")) "liblept.5" else "liblept.so.5.0.4"

    if (dirNativeLibs?.listFiles().isNullOrEmpty()) {
      listOf("${ libTesseract }.${ libSuffix }", "${ libLept }.${ libSuffix }").forEach { dllName ->
        val inputStream =
            this.javaClass.getResourceAsStream(
                if (os.contains("win")) "/win32-x86-64"
                else if (os.contains("mac")) "/resources/AI/Tesseract/Runtime/linux-x86-64"
                else "/resources/AI/Tesseract/Runtime/darwin-aarch64")

        if (inputStream != null) {
          val targetFile = File(dirNativeLibs, dllName)

          inputStream.use { input ->
            targetFile.outputStream().use { output -> input.copyTo(output) }
          }

          log(
              LogLevel.INFO,
              "Extracted $dllName to plugin storage into directory \"Resources/AI/Tesseract/Runtime/${ if( os.contains("win")) "/win32-x86-64" else if( os.contains("mac")) "/resources/AI/Tesseract/Runtime/linux-x86-64" else "/resources/AI/Tesseract/Runtime/darwin-aarch64"}\".")
        } else {
          log(
              LogLevel.ERROR,
              "FAILED to find \"/${ if (os.contains("win")) "/win32-x86-64" else if (os.contains("mac")) "/resources/AI/Tesseract/Runtime/linux-x86-64" else "/resources/AI/Tesseract/Runtime/darwin-aarch64"}\" in JAR.")
        }
      }
    }
    // endregion Extract native libs from JAR into plugin directory
    val dirTempNativeLibs = File(tmpDir, "tesseract_run_${ System.currentTimeMillis()}")

    if (!dirTempNativeLibs.exists() && !dirTempNativeLibs.mkdirs())
        throw ServletException(
            "Temporary folder for library-clones could not be provided: \"${dirTempNativeLibs.absolutePath}\". Initialization failed.")
    // Copy libraries
    dirNativeLibs?.listFiles()?.forEach { file ->
      file.copyTo(File(dirTempNativeLibs, file.name), overwrite = true)
    }
    // endregion Setting directory for the native libraries and generating temporary directory for
    // them to prevent locks.
    try {
      // region Generating local model storage.
      val tessDataDir = pluginRoot?.resolve("Resources/AI/Tesseract/Models")?.apply { mkdirs() }

      if (pluginRoot?.resolve("Resources/AI/Tesseract/Models")?.exists() == false)
          log(
              LogLevel.ERROR,
              "Could not create the directory (Resources/AI/Tesseract/Models) within the plugin folder.")
      // endregion Generating local model storage.
      // region Ensuring requested models are in place.
      val languages = configData.properties.getProperty("AI_Tesseract_Languages")

      if (languages == null) ensureTessData(tessDataDir, "de")
      else
          languages
              .split("+")
              .filter { it.isNotBlank() }
              .forEach { lang -> ensureTessData(tessDataDir, lang.replace(" ", "")) }
      // endregion Ensuring requested models are in place.
      // region Initialize the tesseract
      repeat(sizePool) {
        try {
          // region Tell Tesseract where it's native libraries can be found.
          System.setProperty("jna.library.path", dirTempNativeLibs.absolutePath)
          System.setProperty("net.sourceforge.tess4j.extract.path", dirTempNativeLibs.absolutePath)
          System.setProperty("net.sourceforge.tess4j.skip.extract", "true")
          // endregion Tell Tesseract where it's native libraries can be found.
          val tesseract = TessAPI1.TessBaseAPICreate()

          if (TessAPI1.TessBaseAPIInit3(
              tesseract, tessDataDir?.absolutePath, languages.replace(" ", "")) != 0)
              throw ServletException("[[ CodBi / AI /Tesseract ] Unknown initialization failure.]")

          log(LogLevel.INFO, "Native handle (${ tesseract.hashCode()}) generated.")
          pool.put(tesseract)
        } catch (X: Throwable) {
          log(
              LogLevel.WARNING,
              ("Following non fatal exception occurred during Tesseract-Initialization: ${ X }."))
        }
      }
      // endregion Initialize the tesseract
      log(LogLevel.INFO, "Tesseract initialized.")
    } catch (X: Throwable) {
      log(LogLevel.ERROR, "Critical initialization Failure: ${ X }.")
    }
  }

  /**
   * Wipes the local data needed to run the Tesseract, if **Active_AI** does not contain **OCR**.
   * Furthermore, **AI_Tesseract_Languages** is checked for compliance to
   * **^[a-z]{3}(\s*\+\s*[a-z]{3})*$**, if it is set.
   *
   * @param configData The [IPluginValidationData] as provided by the formcycle environment.
   * @return Always NULL.
   * @throws IllegalArgumentException If **AI_Tesseract_Languages** does not comply to
   *   **^[a-z]{3}(\s*\+\s*[a-z]{3})*$**.
   */
  @Throws(IllegalArgumentException::class)
  override fun validateConfigurationData(
      configData: IPluginValidationData
  ): IPluginInitializeValidationResult? {
    if (configData.properties.getProperty("Active_AI").isNullOrEmpty()) return null
    // Remove local native libs and models, if no OCR configured.
    if (!(configData.properties.getProperty("Active_AI")?.lowercase() ?: "").contains("OCR"))
        wipeLocalData()
    if (!Regex("""^[a-z]{3}(\s*\+\s*[a-z]{3})*$""")
        .matches(configData.properties.getProperty("AI_Tesseract_Languages")))
        throw IllegalArgumentException(
            "[[ CodBi / AI / Tesseract ] Config property AI_Tesseract_Languages, if set, has to match to following regular expression: ^[a-z]{3}(\\s*\\+\\s*[a-z]{3})*\$.")

    return null
  }

  /**
   * Does, if activated by the CodBi-Plugin-Property **Active_AI** containing **OCR**, use [AI]'s
   * janitor to store images that have an ID (if transmitted in the header **X-OCR-Image-ID**) and
   * extracts all the text from the transmitted, or via **X-OCR-Image-ID** specified, images.
   *
   * If a **X-OCR-Regex** is found in the header only the text matching that regular expression will
   * be returned, separated by **:-:**.
   *
   * @param params As provided by the formcycle environment.
   * @return A proper [IPluginServletActionRetVal].
   */
  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    // region Check if the Tesseract is active.
    if (!active) {
      log(
          LogLevel.ERROR,
          "The Tesseract was invoked but is currently not active. In order to activate it the keyword \"OCR\" has to be placed into the CodBi-Plugin-Property \"Active_AI\".")

      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"The Tesseract is currently not active. In order to activate it the keyword OCR has to be placed into the CodBi-Plugin-Property Active_AI.\"}"))
    }
    // endregion Check if the Tesseract is active.
    if (params.uploadFiles.isNullOrEmpty() && params.headerMap["X-OCR-Image-ID"].isNullOrEmpty()) {
      log(
          LogLevel.ERROR,
          "No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with.")

      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with.\"}"))
    }
    val ocrResults = mutableMapOf<String, String>()
    val filesToDelete = mutableListOf<File>()

    try {
      if (!params.uploadFiles.isNullOrEmpty()) {
        params.uploadFiles?.forEach { (inputName, fileItem) ->
          val distinctImageID = "${params.headerMap["X-OCR-Image-ID"]}::${inputName}"
          var tempFile: File? = null
          var shouldDeleteThisFile = true
          // region Check if the image is already cached.
          if (distinctImageID.isNotBlank() && cacheIDedImages.containsKey(distinctImageID)) {
            tempFile = cacheIDedImages[distinctImageID]?.file
            shouldDeleteThisFile = false
          }
          // endregion Check if the image is already cached.
          // region Create file if not in cache and cache it X-OCR-Image-ID is set in header.
          if (tempFile == null || !tempFile.exists()) {
            tempFile = kotlin.io.path.createTempFile("ocr_${inputName}_", ".png").toFile()

            val createdTempFile =
                requireNotNull(tempFile) { "Temp file for OCR processing is missing." }

            fileItem.stream().use { input ->
              val bytes = input.map { it.data }.reduce { acc, b -> acc + b }.orElse(byteArrayOf())

              createdTempFile.writeBytes(bytes)
            }

            if (distinctImageID.isNotBlank()) {
              cacheIDedImages[distinctImageID] = CachedImage(createdTempFile)
              shouldDeleteThisFile = false
            }
          }
          // endregion Create file if not in cache and cache it X-OCR-Image-ID is set in header.
          val tempFileLocal =
              requireNotNull(tempFile) { "Temp file for OCR processing is missing." }
          if (shouldDeleteThisFile) filesToDelete.add(tempFileLocal)
          // region OCR Processing
          val handle =
              pool.poll(10, TimeUnit.SECONDS) ?: throw IllegalStateException("Pool exhausted")
          try {
            TessAPI1.TessBaseAPIProcessPages(handle, tempFileLocal.absolutePath, null, 0, null)

            val ptr = TessAPI1.TessBaseAPIGetUTF8Text(handle)

            if (ptr != null) {
              if (params.headerMap["X-OCR-Regex"].isNullOrEmpty())
                  ocrResults[inputName] = ptr.getString(0, "UTF-8").trim()
              else {
                val rawText = ptr.getString(0, "UTF-8") ?: ""
                val regexHeader = params.headerMap["X-OCR-Regex"]?.trim()

                ocrResults[inputName] =
                    if (!regexHeader.isNullOrEmpty()) {
                      try {
                        regexHeader
                            .toRegex()
                            .findAll(rawText)
                            .map { it.value }
                            .joinToString(":-:")
                            .ifEmpty { "No match" }
                      } catch (X: Exception) {
                        "Regex Error: ${ X.message }"
                      }
                    } else rawText.trim()
              }

              TessAPI1.TessDeleteText(ptr)
            }

            TessAPI1.TessBaseAPIClear(handle)
          } catch (X: Throwable) {
            throw ServletException(
                "[[ CodBi / AI / Tesseract ] Processing ${ inputName } failed with: ${ X }.]")
          } finally {
            pool.offer(handle)
          }
          // endregion OCR Processing
        }
      } else {
        cacheIDedImages.entries
            .filter { it.key.startsWith("${ params.headerMap["X-OCR-Image-ID"] }::") }
            .map { it.value }
            .forEach { (image, key) ->
              // region OCR Processing
              val handle =
                  pool.poll(10, TimeUnit.SECONDS) ?: throw IllegalStateException("Pool exhausted")
              try {
                TessAPI1.TessBaseAPIProcessPages(handle, image.absolutePath, null, 0, null)

                val ptr = TessAPI1.TessBaseAPIGetUTF8Text(handle)

                if (ptr != null) {
                  ocrResults[image.name] = ptr.getString(0, "UTF-8").trim()

                  TessAPI1.TessDeleteText(ptr)
                }

                TessAPI1.TessBaseAPIClear(handle)
              } catch (X: Throwable) {
                throw ServletException(
                    "[[ CodBi / AI / Tesseract ] Processing ${ image.name } failed with: ${ X }.]")
              } finally {
                pool.offer(handle)
              }
              // endregion OCR Processing
            }
      }
    } catch (e: Exception) {
      logger.error("[[ CodBi ]] Execution Error", e)
    }
    // region Generate response
    val jsonResponse =
        ocrResults.entries.joinToString(separator = ",", prefix = "{", postfix = "}") { (key, value)
          ->
          val escapedValue = value.replace("\"", "\\\"").replace("\n", "\\n")
          "\"$key\":\"$escapedValue\""
        }

    val servletResponse = ServletResponse(EResponseType.JSON).apply { value = jsonResponse }
    // endregion Generate response
    return PluginServletActionRetVal(servletResponse)
  }

  /** Removes the native libraries and the models from the local repository. */
  private fun wipeLocalData() {
    val os = System.getProperty("os.name").lowercase()

    pluginRoot
        ?.resolve(
            "Resources/AI/Tesseract/Runtime/${
      when {
        os.contains("win")      -> "win32-x86-64"
        os.contains("linux")    -> "linux-x86-64"
        os.contains("mac")      -> "darwin-aarch64"
      else -> "unknown"} }")
        ?.deleteRecursively()

    pluginRoot?.resolve("Resources/AI/Tesseract/Models")?.deleteRecursively()
  }

  /**
   * Checks if all models of the specified **language** exist within the **tessDataDir** and
   * downloads them if necessary.
   *
   * @param tessDataDir The directory where the language models reside.
   * @param language The languages to ensure the availability of.
   */
  private fun ensureTessData(tessDataDir: File?, language: String) {
    val dataDir = tessDataDir ?: return
    if (!dataDir.exists()) dataDir.mkdirs()

    val languagesToDownload = listOf("$language.traineddata", "osd.traineddata")
    val baseUrl = "https://github.com/tesseract-ocr/tessdata_best/raw/main/"

    languagesToDownload.forEach { fileName ->
      val localFile = File(dataDir, fileName)

      if (!localFile.exists() || localFile.length() == 0L) {
        log(LogLevel.INFO, "Downloading $fileName from GitHub...")

        try {
          URI.create("$baseUrl$fileName").toURL().openStream().use { input ->
            localFile.outputStream().use { output -> input.copyTo(output) }
          }

          log(LogLevel.INFO, "Successfully downloaded $fileName.")
        } catch (X: Exception) {
          log(LogLevel.WARNING, "Failed to download $fileName: ${ X.message }.")
        }
      }
    }
  }

  /**
   * Shuts down the [pool] and releases all Tesseract handles.
   *
   * @param shutdownData As provided by the formcycle environment.
   */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    super.shutdown(shutdownData)

    while (pool.isNotEmpty()) {
      val handle = pool.poll()

      if (handle != null) {
        TessAPI1.TessBaseAPIDelete(handle)

        log(LogLevel.INFO, "Native Tesseract handle (${ handle.hashCode()}) released.")
      }
    }
  }

  /**
   * Does [AI.log] the given [String] [toLog] having set the [idLogMessages] to **Tesseract** in
   * advance.
   *
   * @param importance See [AI.log].
   * @param toLog See [AI.log].
   */
  override fun log(importance: LogLevel, toLog: String) {
    idLogMessages = "Tesseract"

    super.log(importance, toLog)
  }
}
