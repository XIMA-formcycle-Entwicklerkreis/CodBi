package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai

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
import java.util.concurrent.*
import javax.imageio.ImageIO
import net.sourceforge.tess4j.ITessAPI
import net.sourceforge.tess4j.TessAPI1

/**
 * Performs OCR on one or multiple images using the
 * [Tesseract](https://github.com/tesseract-ocr/tesseract).
 *
 * Reusing images that were already uploaded is possible in order to optimize traffic. Passing an
 * **X-OCR-Image-ID** within the header when requesting the **CodBi_Tesseract**-Action will make the
 * image persist for a specific amount of milliseconds ([msExpirationIDedImages]). The expiration
 * may be changed using the **AI_Tesseract_IDedImageExpiration**-Plugin-Property.
 */
class TesseractAction : AI(), IPluginServletAction {

  /** The CodBi-Plugin's root directory. */
  private var pluginRoot: File? = null

  /** The [tesseract]-handle pool. */
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
  override fun getName() = "CodBi_Tesseract"

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
    if (!(configData.properties.getProperty("Active_AI")?.lowercase() ?: "").contains("OCR")) {
      wipeLocalData()

      return
    }
    // region Remove local native libs and models, if no OCR configured.
    // region Begin the observation of the [cacheIDedImages].
    janitorIDedImages = Executors.newSingleThreadScheduledExecutor()

    startJanitor()
    // endregion Begin the observation of the [cacheIDedImages].
    // region Remove former library-clones.
    val tmpDir = File(System.getProperty("java.io.tmpdir"))

    tmpDir
        .listFiles { file -> file.isDirectory && file.name.startsWith("tesseract_run_") }
        ?.forEach { oldFolder -> oldFolder.deleteRecursively() }
    // endregion Remove former library-clones.
    pluginRoot = configData.fileHelper.pluginFolder
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

    if (pluginRoot?.resolve("Resources/AI/Tesseract/Runtime/${ platformDirName }")?.exists() ==
        false)
        logger.error(
            "[[ CodBi / AI / Tesseract ]] Could not create the directories (Resources/AI/Tesseract/Runtime/${ platformDirName }) within the plugin folder.]")
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

          logger.info(
              "[[ CodBi / AI / Tesseract ]] Extracted $dllName to plugin storage into directory \"Resources/AI/Tesseract/Runtime/${ if( os.contains("win")) "/win32-x86-64" else if( os.contains("mac")) "/resources/AI/Tesseract/Runtime/linux-x86-64" else "/resources/AI/Tesseract/Runtime/darwin-aarch64"}\".]")
        } else {
          logger.error(
              "[[ CodBi / AI / Tesseract ]] FAILED to find \"/${ if (os.contains("win")) "/win32-x86-64" else if (os.contains("mac")) "/resources/AI/Tesseract/Runtime/linux-x86-64" else "/resources/AI/Tesseract/Runtime/darwin-aarch64"}\" in JAR.]")
        }
      }
    }
    // endregion Extract native libs from JAR into plugin directory
    val dirTempNativeLibs = File(tmpDir, "tesseract_run_${ System.currentTimeMillis() }")

    if (!dirTempNativeLibs.exists())
        logger.error(
            "[[ CodBi / AI / Tesseract ]] Temporary folder for library-clones could not be provided: ${dirTempNativeLibs.absolutePath}.]")
    // Copy libraries
    dirNativeLibs?.listFiles()?.forEach { file ->
      file.copyTo(File(dirTempNativeLibs, file.name), overwrite = true)
    }
    // region Tell Tesseract where it's native libraries can be found.
    System.setProperty("jna.library.path", dirTempNativeLibs.absolutePath)
    System.setProperty("net.sourceforge.tess4j.extract.path", dirTempNativeLibs.absolutePath)
    // endregion Tell Tesseract where it's native libraries can be found.
    // endregion Setting directory for the native libraries and generating temporary directory for
    // them to prevent locks.
    try {
      // region Generating local model storage.
      val tessDataDir = pluginRoot?.resolve("Resources/AI/Tesseract/Models")?.apply { mkdirs() }

      if (pluginRoot?.resolve("Resources/AI/Tesseract/Models")?.exists() == false)
          logger.error(
              "[[ CodBi / AI / Tesseract ]] Could not create the directory (Resources/AI/Tesseract/Models) within the plugin folder.]")
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
        val tesseract = TessAPI1.TessBaseAPICreate()

        if (TessAPI1.TessBaseAPIInit3(
            tesseract, tessDataDir?.absolutePath, languages.replace(" ", "")) != 0) {
          logger.error("[[ CodBi / AI / Tesseract ] Unknown initialization failure. ]")

          return
        }

        pool.put(tesseract)
      }
      // endregion Initialize the tesseract
      ImageIO.setUseCache(false)
      logger.info("[[ CodBi ]] Tesseract initialized.")
    } catch (X: Throwable) {
      logger.error("[[ CodBi ]] Critical initialization Failure", X)
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
    // Remove local native libs and models, if no OCR configured.
    if (!(configData.properties.getProperty("Active_AI")?.lowercase() ?: "").contains("OCR"))
        wipeLocalData()
    if (!Regex("""^[a-z]{3}(\s*\+\s*[a-z]{3})*$""")
        .matches(configData.properties.getProperty("AI_Tesseract_Languages")))
        throw IllegalArgumentException(
            "[[ CodBi / AI / Tesseract ] Config property AI_Tesseract_Languages, if set, has to match to following regular expression: ^[a-z]{3}(\\s*\\+\\s*[a-z]{3})*\$.")

    return null
  }

  /**  */
  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    logger.info("pool size:${pool.size}")
    val ocrResults = mutableMapOf<String, String>()

    var result = ""
    var tempFile: File? = null
    var shouldDelete = true // Default: delete after use
    val filesToDelete = mutableListOf<File>()
    logger.info("GGGuploadfiles:${params.uploadFiles.keys}")
    try {
      // 1. Try Cache first
      params.uploadFiles?.forEach { (inputName, fileItem) ->
        val distinctImageID = "${ params.headerMap["X-OCR-Image-ID"]}::${inputName}"
        var tempFile: File? = null
        var shouldDeleteThisFile = true

        // 2. Check Cache (This logic assumes the ID applies to the first file or a specific
        // mapping)
        // If you have multiple IDs, you'd need a different header strategy.
        if (!distinctImageID.isNullOrBlank() && cacheIDedImages.containsKey(distinctImageID)) {
          tempFile = cacheIDedImages[distinctImageID]?.file
          shouldDeleteThisFile = false
        }

        // 3. Create file if not in cache
        if (tempFile == null || !tempFile.exists()) {
          tempFile = kotlin.io.path.createTempFile("ocr_${inputName}_", ".png").toFile()

          fileItem.stream().use { input ->
            val bytes = input.map { it.data }.reduce { acc, b -> acc + b }.orElse(byteArrayOf())
            tempFile!!.writeBytes(bytes)
          }

          if (!distinctImageID.isNullOrBlank()) {
            cacheIDedImages[distinctImageID] = CachedImage(tempFile!!)
            shouldDeleteThisFile = false
          }
        }

        if (shouldDeleteThisFile) filesToDelete.add(tempFile!!)

        // 4. OCR Processing
        val handle =
            pool.poll(10, TimeUnit.SECONDS) ?: throw IllegalStateException("Pool exhausted")
        try {
          TessAPI1.TessBaseAPIProcessPages(handle, tempFile!!.absolutePath, null, 0, null)
          val ptr = TessAPI1.TessBaseAPIGetUTF8Text(handle)
          if (ptr != null) {
            // Store result using the input field name as the key
            ocrResults[inputName] = ptr.getString(0, "UTF-8").trim()

            TessAPI1.TessDeleteText(ptr)
          }
          TessAPI1.TessBaseAPIClear(handle)
        } finally {
          pool.offer(handle)
        }
      }
    } catch (e: Exception) {
      logger.error("[[ CodBi ]] Execution Error", e)
    } finally {
      // 5. Final Cleanup Logic
      if (shouldDelete && tempFile != null && tempFile!!.exists()) {
        val deleted = tempFile!!.delete()
        logger.info("[[ CodBi ]] Transient file deleted: $deleted")
      }
    }

    val jsonResponse =
        ocrResults.entries.joinToString(separator = ",", prefix = "{", postfix = "}") { (key, value)
          ->
          // Escape double quotes in the value to prevent breaking the JSON
          val escapedValue = value.replace("\"", "\\\"").replace("\n", "\\n")
          "\"$key\":\"$escapedValue\""
        }
    logger.info("JJJ:", jsonResponse.toString())
    val servletResponse = ServletResponse(EResponseType.JSON).apply { value = jsonResponse }
    return PluginServletActionRetVal(servletResponse)
  }

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

  private fun ensureTessData(tessDataDir: File?, language: String) {

    if (!tessDataDir?.exists()!!) tessDataDir.mkdirs()

    // We need both the specific language AND the OSD (Orientation) file
    val languagesToDownload = listOf("$language.traineddata", "osd.traineddata")
    val baseUrl = "https://github.com/tesseract-ocr/tessdata_best/raw/main/"

    languagesToDownload.forEach { fileName ->
      val localFile = File(tessDataDir, fileName)

      if (!localFile.exists() || localFile.length() == 0L) {
        logger.info("[[ CodBi ]] Downloading $fileName from GitHub...")
        try {
          java.net.URL(baseUrl + fileName).openStream().use { input ->
            localFile.outputStream().use { output -> input.copyTo(output) }
          }
          logger.info("[[ CodBi ]] Successfully downloaded $fileName")
        } catch (e: Exception) {
          logger.error("[[ CodBi ]] Failed to download $fileName: ${e.message}")
        }
      }
    }
  }

  fun startJanitor() {
    janitorIDedImages?.scheduleAtFixedRate(
        {
          val now = System.currentTimeMillis()
          val iterator = cacheIDedImages.entries.iterator()

          while (iterator.hasNext()) {
            val entry = iterator.next()

            // HERE is where CACHE_EXPIRATION_MS is used:
            val age = now - entry.value.timestamp

            if (age > msExpirationIDedImages) {
              // The file has expired
              entry.value.file.delete()
              iterator.remove()
              logger.info("[[ CodBi ]] Janitor: Purged image ${entry.key} (Age: ${age/1000}s)")
            }
          }
        },
        1,
        1,
        TimeUnit.MINUTES)
  }

  override fun shutdown(shutdownData: IPluginShutdownData?) {
    super.shutdown(shutdownData)

    // 1. Tell the janitor to stop accepting tasks and shut down
    janitorIDedImages?.shutdown()

    try {
      // 2. Wait a few seconds for current cleanup tasks to finish
      if (janitorIDedImages?.awaitTermination(5, TimeUnit.SECONDS) == false) {
        janitorIDedImages?.shutdownNow() // Force kill if it's taking too long
      }
    } catch (e: InterruptedException) {
      janitorIDedImages?.shutdownNow()
    }

    janitorIDedImages = null // Clear the reference for Garbage Collection

    // ... clean up Tesseract pool and imageCache files ...

    while (pool.isNotEmpty()) {
      val handle = pool.poll() // Takes the next available handle
      if (handle != null) {
        TessAPI1.TessBaseAPIDelete(handle)
        logger.info("[[ CodBi ]] Native Tesseract handle released.")
      }
    }

    // 3. Clear the image cache files
    cacheIDedImages.values.forEach { it.file.delete() }
    cacheIDedImages.clear()
  }
}
