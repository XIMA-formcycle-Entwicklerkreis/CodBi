package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai

// region Imports
// region CodBi
// endregion CodBi
// region Google
// endregion Google
// region XIMA
// endregion XIMA
// region Tesseract
// endregion Tesseract
// region Java
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.AI
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.DpiUtil
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.ImagePreprocessor
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.ImageTransformer
import com.google.gson.Gson
import com.google.gson.JsonSyntaxException
import com.google.gson.reflect.TypeToken
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
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.File
import java.lang.management.ManagementFactory
import java.net.URI
import java.net.URLDecoder
import java.nio.ByteBuffer
import java.nio.FloatBuffer
import java.nio.IntBuffer
import java.nio.charset.StandardCharsets
import java.util.concurrent.*
import java.util.jar.JarFile
import javax.imageio.ImageIO
import javax.servlet.ServletException
import net.sourceforge.tess4j.ITessAPI
import net.sourceforge.tess4j.TessAPI1

// endregion Java
// endregion Imports
/**
 * # Performs OCR on one or multiple images using the
 * [Tesseract](https://github.com/tesseract-ocr/tesseract).
 *
 * Returns either the whole text of the document(s) parsed or, if a **X-OCR-Regex** is found in the
 * header, the text matching a specified regular expression, the text matching multiple named
 * regular expressions or whether the text matches a specified regular expression.
 *
 * Formcycle upload-fields that take advantage of CodBi's **Media.MultipleDownload** thus uploading
 * more than one image are supported. The JSON returned will hold the properties named according to
 * the transmitted file's names holding the found text.
 *
 * ## Plugin-Properties
 * - **AI_Tesseract_Languages** Optional three-letter language-code specification of language the
 *   Tesseract shall be able to recognize (defaults to **deu**). Multiple languages may be separated
 *   by a **+** (e.g. deu + eng). -- **AI_Tesseract_PoolSize ** Number of Tesseract-Instance that're
 *   concurrently available (see [sizePool]).
 * - **AI_Tesseract_MaxCPUPercent** CPU usage threshold (%) — blocks OCR requests when exceeded
 *   (default: `101.0`, effectively disabled).
 * - **AI_Tesseract_MaxRAMPercent** RAM usage threshold (%) — blocks OCR requests when exceeded
 *   (default: `101.0`, effectively disabled).
 *
 * ## URLs needed for proper initialization:
 * - **[https://repo1.maven.org/maven2](https://repo1.maven.org/maven2)**
 * - **[https://github.com/tesseract-ocr/tessdata_best/raw/main/](https://github.com/tesseract-ocr/tessdata_best)**
 *
 *   **The Maven repository's URL may be changed using the AI_Tesseract_MavenRepository plugin
 *   property.**
 *
 * ## Domains to whitelist
 * - **repo1.maven.org**
 * - **github.com**
 * - **raw.githubusercontent.com**
 * - **api.github.com**
 * - **objects.githubusercontent.com**
 *
 * ### DSGVO, EU-AI ACT & technical Advantages vs Dedicated Server AI Approach
 * - No separate AI server setup (fewer systems to secure and audit).
 * - Reduced data transfer: processing stays within the plugin runtime.
 * - Simpler compliance scope: fewer endpoints and lower operational overhead.
 * - Lower latency and fewer network dependencies for OCR execution.
 * - Easier data minimization: fewer data copies and storage locations.
 * - Clearer accountability boundaries for processor/controller roles.
 * - Simplified breach response: No separate AI server to manage in case of incidents.
 * - Easier implementation of data subject rights (access, deletion) without coordinating with a
 *   separate AI service.
 * - Plugin does not store image data or OCR results persistently, minimizing data retention
 *   concerns.
 * - Most unproblematic deletion request response: Data is never stored not even in server-backups
 *   so no deletion necessary.
 *
 * # Note On Removal
 * If OCR was activated once the DLL used is locked into memory, making it impossible to delete the
 * plugin's files from the server. That is a technical limitation of the Tesseract library and not a
 * CodBi-specific issue. If you want to remove the plugin after activation, you need to first
 * disable the plugin and then reboot the server. After that you can delete the plugin.
 */
class TesseractAction : AI() {
  // region Companion Object
  /** Companion for static members. */
  companion object {
    /**
     * The active [TesseractAction] instance — set when Tesseract is [ready], cleared on shutdown.
     */
    @Volatile @JvmStatic private var instance: TesseractAction? = null
    /** Whether Tesseract OSD (Orientation and Script Detection) is currently available. */
    @JvmStatic
    val isOsdAvailable: Boolean
      get() = instance?.ready == true && instance?.tessDataDir != null

    /**
     * Detects the orientation of the given image using Tesseract's OSD.
     *
     * @param image The image to analyze.
     * @param dpi The image resolution in DPI (dots per inch).
     * @return The correction angle (0, 90, 180, or 270) to apply, or 0 if detection is unavailable
     *   or fails.
     */
    @JvmStatic
    fun detectOrientation(image: BufferedImage, dpi: Int = 300): Int {
      val inst = instance ?: return 0

      if (!inst.ready) return 0

      return inst.detectBestOrientation(image, dpi)
    }

    /** Whether Tesseract OCR is ready to process requests. */
    @JvmStatic
    val isReady: Boolean
      get() = instance?.ready == true

    /**
     * Performs OCR directly on the given image bytes, returning a JSON result.
     *
     * Called by
     * [AiProxy][com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.AiProxy] for
     * external OCR requests — Tesseract runs in-process (JNI) so there is no HTTP server to forward
     * to, unlike LLAMA or Whisper.
     *
     * @param imageBytes The raw image bytes (PNG, JPEG, etc.).
     * @param mode The OCR mode: `print`, `extract`, `verify`, or `extract fields`.
     * @param options Additional options: `pattern`, `regex_flags`, `rotate`, `preprocess`,
     *   `field_patterns`.
     * @return A JSON string with the OCR result.
     */
    @JvmStatic
    fun performOcr(
        imageBytes: ByteArray,
        mode: String,
        options: Map<String, String> = emptyMap()
    ): String {
      val inst = instance ?: return """{"error":"Tesseract is not active"}"""

      if (!inst.ready) return """{"error":"Tesseract is not ready"}"""

      inst.resourceMonitor?.let { monitor ->
        val reason = monitor.exceedReason()

        if (reason != null) {
          val waitSec = monitor.estimateWaitSeconds()

          return """{"error":"Server resources exceeded ($reason). Please retry in ~${waitSec} seconds.","retryAfter":$waitSec}"""
        }
      }

      val rotate = options["rotate"]?.toIntOrNull() ?: 0
      val preprocess = options["preprocess"]?.lowercase() in listOf("true", "1")
      if (!AI.inferenceSemaphore.tryAcquire()) {
        val pos = AI.queueTickets.size
        val badge = AI.queueBadgeEnabled
        val waitMs = AI.estimateWaitMs(null)
        val waitField = if (waitMs != null) ",\"estimatedWaitMs\":$waitMs" else ""
        return """{"queued":true,"position":$pos,"queueBadge":$badge$waitField}"""
      }
      val directInferenceStartMs = System.currentTimeMillis()
      try {
        val rawText = inst.runOcrDirect(imageBytes, rotate, preprocess)

        return when (mode.lowercase()) {
          "print" -> Gson().toJson(mapOf("text" to rawText.trim()))
          "extract" -> {
            val pattern =
                options["pattern"]
                    ?: return """{"error":"Mode 'extract' requires 'pattern' option"}"""
            val flags = parseRegexFlagsDirect(options["regex_flags"])
            val matches =
                try {
                  pattern.toRegex(flags).findAll(rawText).map { it.value }.toList()
                } catch (X: Exception) {
                  listOf("Regex Error: ${X.message}")
                }

            Gson().toJson(mapOf("matches" to matches))
          }
          "verify" -> {
            val pattern =
                options["pattern"]
                    ?: return """{"error":"Mode 'verify' requires 'pattern' option"}"""
            val flags = parseRegexFlagsDirect(options["regex_flags"])
            val matched =
                try {
                  pattern.toRegex(flags).containsMatchIn(rawText)
                } catch (X: Exception) {
                  return """{"error":"Regex error: ${X.message}"}"""
                }
            Gson().toJson(mapOf("match" to matched))
          }
          "extract fields" -> {
            val fieldPatternsJson =
                options["field_patterns"]
                    ?: return """{"error":"Mode 'extract fields' requires 'field_patterns' option"}"""
            val fieldPatterns: Map<String, String> =
                try {
                  Gson()
                      .fromJson(
                          fieldPatternsJson, object : TypeToken<Map<String, String>>() {}.type)
                } catch (X: Exception) {
                  return """{"error":"Invalid field_patterns JSON: ${X.message}"}"""
                }

            val flags = parseRegexFlagsDirect(options["regex_flags"])
            val results = mutableMapOf<String, String?>()

            for ((field, pattern) in fieldPatterns) {
              results[field] =
                  try {
                    pattern.toRegex(flags).find(rawText)?.value
                  } catch (X: Exception) {
                    "Regex Error: ${X.message}"
                  }
            }
            Gson().toJson(results)
          }
          else ->
              """{"error":"Unsupported mode: $mode. Valid modes: print, extract, verify, extract fields"}"""
        }
      } finally {
        val durationMs = System.currentTimeMillis() - directInferenceStartMs
        AI.recordInferenceDuration("tesseract", durationMs)
        AI.inferenceSemaphore.release()
      }
    }

    /**
     * Parses regex flag characters into [RegexOption] values.
     *
     * @param flagsStr A string with flag characters: `i` (ignore case), `m` (multiline), `s` (dot
     *   matches all).
     * @return The corresponding set of [RegexOption].
     */
    private fun parseRegexFlagsDirect(flagsStr: String?): Set<RegexOption> {
      if (flagsStr.isNullOrEmpty()) return emptySet()

      val flags = mutableSetOf<RegexOption>()
      val lower = flagsStr.lowercase()

      if (lower.contains('i')) flags.add(RegexOption.IGNORE_CASE)
      if (lower.contains('m')) flags.add(RegexOption.MULTILINE)
      if (lower.contains('s')) flags.add(RegexOption.DOT_MATCHES_ALL)

      return flags
    }
  }

  // endregion Companion Object
  // region Configuration Properties
  /**
   * States whether this [TesseractAction] is currently active or not (**Active_AI** contains
   * **OCR** or not).
   */
  private var active = false
  /** The CodBi-Plugin's root directory. */
  private var pluginRoot: File? = null
  /** The tesseract-handle pool. */
  private val pool = LinkedBlockingQueue<ITessAPI.TessBaseAPI>()
  /** Tracks whether initialization finished successfully. */
  @Volatile private var ready = false
  /**
   * Specifies the size of the [pool]. Defaults to 2 to not exhaust the server. One should consider
   * the number of available CPU-Cores & RAM when determining the proper value for this property. A
   * good practice is Number of CPU-Cores / 2 = sizePool but RAM has also to be considered.
   * Calculate about 100MB per loaded language model. That is the approximate size of RAM needed for
   * one pool. So setting the [sizePool] to 2, will most probably consume 200MB.
   */
  private var sizePool = 2
  /** The directory where the temporary native libraries are stored. */
  private var dirTempNativeLibs: File? = null
  /** The directory where the Tesseract language models are stored. */
  private var tessDataDir: File? = null
  /** Tracks whether the Tesseract pool has been initialized. */
  private var isPoolInitialized = false
  /** RAM-Threshold */
  private var maxRAMPercent = 101.0
  /** CPU-Threshold */
  private var maxCPUPercent = 101.0
  /** Resource monitor daemon thread. */
  private var resourceMonitor: ResourceMonitor? = null

  // endregion Configuration Properties
  // region Regex Parsing
  /**
   * Parses the X-RegexFlags header and returns a set of RegexOption flags.
   *
   * @param params The [IPluginServletActionParams] containing the header map.
   * @return A set of RegexOption flags to apply to regex patterns.
   */
  private fun parseRegexFlags(params: IPluginServletActionParams): Set<RegexOption> {
    val flags = mutableSetOf<RegexOption>()
    val flagsHeader =
        params.headerMap.entries
            .find { it.key.equals("X-RegexFlags", ignoreCase = true) }
            ?.value
            ?.trim()
            ?.lowercase()

    if (!flagsHeader.isNullOrEmpty()) {
      if (flagsHeader.contains('i')) flags.add(RegexOption.IGNORE_CASE)
      if (flagsHeader.contains('m')) flags.add(RegexOption.MULTILINE)
      if (flagsHeader.contains('s')) flags.add(RegexOption.DOT_MATCHES_ALL)

      log(LogLevel.INFO, "Applied regex flags: $flags")
    }

    return flags
  }

  // endregion Regex Parsing
  // region Image Transformation (delegated to ImageTransformer)
  private fun rotate90(img: BufferedImage): BufferedImage = ImageTransformer.rotate90(img)

  private fun rotate180(img: BufferedImage): BufferedImage = ImageTransformer.rotate180(img)

  private fun rotate270(img: BufferedImage): BufferedImage = ImageTransformer.rotate270(img)

  // endregion Image Transformation
  // region DPI Utilities (delegated to DpiUtil)
  private fun readImageDPI(imageFile: File): Int =
      DpiUtil.readImageDPI(imageFile, "[ CodBi / AI / Tesseract ]")

  private fun readImageDPI(imageBytes: ByteArray): Int =
      DpiUtil.readImageDPI(imageBytes, "[ CodBi / AI / Tesseract ]")

  private fun writeImageWithDPI(image: BufferedImage, outputFile: File, dpi: Int = 300) =
      DpiUtil.writeImageWithDPI(image, outputFile, dpi, "[ CodBi / AI / Tesseract ]")

  // endregion DPI Utilities
  // region Tesseract JNI-Interaction
  /**
   * Sets the given [BufferedImage] on the Tesseract handle using an in-memory buffer.
   *
   * @param handle The Tesseract handle.
   * @param image The image to set.
   * @param dpi The DPI to apply as source resolution.
   */
  private fun setImageToTesseract(handle: ITessAPI.TessBaseAPI, image: BufferedImage, dpi: Int) {
    val width = image.width
    val height = image.height
    val pixels = image.getRGB(0, 0, width, height, null, 0, width)
    val buffer = ByteBuffer.allocateDirect(width * height * 4)

    for (pixel in pixels) {
      buffer.put((pixel shr 16 and 0xFF).toByte())
      buffer.put((pixel shr 8 and 0xFF).toByte())
      buffer.put((pixel and 0xFF).toByte())
      buffer.put((pixel shr 24 and 0xFF).toByte())
    }

    buffer.rewind()

    TessAPI1.TessBaseAPISetImage(handle, buffer, width, height, 4, width * 4)
    TessAPI1.TessBaseAPISetSourceResolution(handle, dpi)
  }

  /**
   * Detects the orientation of an image using Tesseract's built-in OSD (Orientation and Script
   * Detection).
   *
   * @param image The image to analyze.
   * @param tempFile Temporary file for saving the image.
   * @return The rotation angle (0, 90, 180, or 270) that should be applied to correct the
   *   orientation.
   */
  private fun detectBestOrientation(image: BufferedImage, dpi: Int): Int {
    val dataDir =
        tessDataDir
            ?: run {
              log(LogLevel.WARNING, "Tesseract data directory not initialized")

              return 0
            }
    try {
      val osdHandle = TessAPI1.TessBaseAPICreate()

      try {
        if (TessAPI1.TessBaseAPIInit3(osdHandle, dataDir.absolutePath, "osd") != 0) {
          log(
              LogLevel.WARNING,
              "Failed to initialize Tesseract with OSD data - osd.traineddata may be missing")

          return 0
        }

        TessAPI1.TessBaseAPISetPageSegMode(osdHandle, 0) // 0 = PSM_OSD_ONLY
        setImageToTesseract(osdHandle, image, dpi)

        val orientDegPtr = IntBuffer.allocate(1)
        val orientConfPtr = FloatBuffer.allocate(1)
        val scriptNamePtr = com.sun.jna.ptr.PointerByReference()
        val scriptConfPtr = FloatBuffer.allocate(1)

        val result =
            TessAPI1.TessBaseAPIDetectOrientationScript(
                osdHandle, orientDegPtr, orientConfPtr, scriptNamePtr, scriptConfPtr)

        if (result == 1) {
          val orientDeg = orientDegPtr.get(0)
          val orientConf = orientConfPtr.get(0)

          log(
              LogLevel.INFO,
              "Tesseract OSD detected orientation: ${orientDeg}° (confidence: ${orientConf})")

          val correctionAngle =
              when (orientDeg) {
                0 -> 0
                90 -> 270
                180 -> 180
                270 -> 90
                else -> 0
              }

          return correctionAngle
        }
      } finally {
        TessAPI1.TessBaseAPIDelete(osdHandle)
      }
    } catch (X: Exception) {
      log(LogLevel.WARNING, "Tesseract OSD failed: ${X.message}")
    }

    log(LogLevel.INFO, "Could not detect orientation, assuming no rotation needed")

    return 0
  }

  // endregion Tesseract JNI Interaction
  // region Image Preprocessing (delegated to ImagePreprocessor)
  /** Disk-based preprocessImage is deprecated for DSGVO compliance. */
  private fun preprocessImage(inputFile: File, params: IPluginServletActionParams): File =
      throw UnsupportedOperationException(
          "Disk-based preprocessImage is not supported. Use BufferedImage variant.")

  /** Checks X-Preprocess header and delegates to [ImagePreprocessor]. */
  private fun preprocessImage(
      image: BufferedImage,
      params: IPluginServletActionParams
  ): BufferedImage =
      ImagePreprocessor.preprocessImage(
          image, isPreprocessEnabled(params), logSignature = "[ CodBi / AI / Tesseract ]")

  private fun isPreprocessEnabled(params: IPluginServletActionParams): Boolean =
      params.headerMap.entries
          .find { it.key.equals("X-Preprocess", ignoreCase = true) }
          ?.value
          ?.trim()
          ?.lowercase() in listOf("true", "1")

  // endregion Image Preprocessing
  // region OCR Execution
  /**
   * Runs OCR fully in-memory without writing the image to disk.
   *
   * @param imageBytes The original image bytes.
   * @param params The servlet action parameters.
   * @return The extracted text.
   */
  private fun runOcrOnImageBytes(
      imageBytes: ByteArray,
      params: IPluginServletActionParams
  ): String {
    val originalDPI = readImageDPI(imageBytes)
    val originalImage = ImageIO.read(ByteArrayInputStream(imageBytes)) ?: return ""
    var correctedImage = originalImage
    val manualRotation =
        params.headerMap.entries
            .find { it.key.equals("X-Rotate", ignoreCase = true) }
            ?.value
            ?.trim()
            ?.toIntOrNull() ?: 0

    if (manualRotation != 0) {
      log(LogLevel.INFO, "Applying manual rotation from X-Rotate header: ${manualRotation}°")

      correctedImage =
          when (manualRotation) {
            90 -> rotate90(correctedImage)
            180 -> rotate180(correctedImage)
            270 -> rotate270(correctedImage)
            else -> {
              log(
                  LogLevel.WARNING,
                  "Invalid X-Rotate value: $manualRotation (use 0, 90, 180, or 270)")
              correctedImage
            }
          }
    } else {
      log(LogLevel.INFO, "Using Tesseract auto-detection to find best orientation...")

      val detectedAngle = detectBestOrientation(correctedImage, originalDPI)

      if (detectedAngle != 0) {
        correctedImage =
            when (detectedAngle) {
              90 -> rotate90(correctedImage)
              180 -> rotate180(correctedImage)
              270 -> rotate270(correctedImage)
              else -> correctedImage
            }

        log(LogLevel.INFO, "Applied auto-detected rotation: ${detectedAngle}°")
      }
    }

    val preprocessedImage = preprocessImage(correctedImage, params)

    log(LogLevel.INFO, "Pool status before borrow: ${pool.size} available of $sizePool")
    val handle =
        pool.poll(10, TimeUnit.SECONDS)
            ?: throw IllegalStateException(
                "[[ CodBi / AI / Tesseract ] Pool exhausted (available: ${pool.size}, configured: $sizePool) ]")

    try {
      setImageToTesseract(handle, preprocessedImage, originalDPI)

      val ptr = TessAPI1.TessBaseAPIGetUTF8Text(handle)
      val result = ptr?.getString(0, "UTF-8") ?: ""

      if (ptr != null) TessAPI1.TessDeleteText(ptr)

      TessAPI1.TessBaseAPIClear(handle)

      return result
    } finally {
      pool.offer(handle)
    }
  }

  /**
   * Runs OCR in-memory without requiring servlet action parameters. Used by [performOcr] for
   * external proxy requests.
   *
   * @param imageBytes The raw image bytes.
   * @param rotate Manual rotation angle (0, 90, 180, or 270).
   * @param preprocess Whether to apply image preprocessing (binarization, denoising).
   * @return The extracted text.
   */
  private fun runOcrDirect(imageBytes: ByteArray, rotate: Int, preprocess: Boolean): String {
    val originalDPI = readImageDPI(imageBytes)
    val originalImage = ImageIO.read(ByteArrayInputStream(imageBytes)) ?: return ""
    var correctedImage = originalImage

    if (rotate != 0) {
      correctedImage =
          when (rotate) {
            90 -> rotate90(correctedImage)
            180 -> rotate180(correctedImage)
            270 -> rotate270(correctedImage)
            else -> correctedImage
          }
    } else {
      val detectedAngle = detectBestOrientation(correctedImage, originalDPI)

      if (detectedAngle != 0) {
        correctedImage =
            when (detectedAngle) {
              90 -> rotate90(correctedImage)
              180 -> rotate180(correctedImage)
              270 -> rotate270(correctedImage)
              else -> correctedImage
            }
      }
    }

    val processedImage =
        if (preprocess)
            ImagePreprocessor.applyPreprocessing(
                    correctedImage, logSignature = "[ CodBi / AI / Tesseract ]")
                ?.image ?: correctedImage
        else correctedImage

    log(LogLevel.INFO, "Pool status before borrow: ${pool.size} available of $sizePool")
    val handle =
        pool.poll(10, TimeUnit.SECONDS)
            ?: throw IllegalStateException(
                "[[ CodBi / AI / Tesseract ] Pool exhausted (available: ${pool.size}, configured: $sizePool) ]")

    try {
      setImageToTesseract(handle, processedImage, originalDPI)

      val ptr = TessAPI1.TessBaseAPIGetUTF8Text(handle)
      val result = ptr?.getString(0, "UTF-8") ?: ""

      if (ptr != null) TessAPI1.TessDeleteText(ptr)

      TessAPI1.TessBaseAPIClear(handle)

      return result
    } finally {
      pool.offer(handle)
    }
  }

  // endregion OCR Execution
  // region Lifecycle
  /**
   * Specifies the name of this [IPluginServletAction].
   *
   * @return The requested [String].
   */
  override fun getName() = "CodBi_AI_Tesseract"

  /**
   * The method performing all tasks that are common to the [initialize] and the
   * [validateConfigurationData] methods.
   *
   * @param properties The [java.util.Properties] to acquire the plugin's properties from.
   * @param root The directory where the native libraries are stored. *
   */
  private fun commonInit(properties: java.util.Properties, root: File?): Boolean {
    val aiRemove = properties.getProperty("AI_Remove")?.lowercase() ?: ""
    val activeAI = properties.getProperty("Active_AI")?.lowercase() ?: ""

    if (aiRemove.contains("ocr") || !activeAI.contains("ocr")) {
      wipeLocalData()

      active = false
      ready = false
      instance = null

      return false
    }

    active = true

    if (root != null) {
      try {
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
            root.resolve("Resources/AI/Tesseract/Runtime/${ platformDirName }").apply { mkdirs() }

        if (os.contains("win")) ensureWindowsNativeLibs(dirNativeLibs, arch)
        else {
          log(LogLevel.INFO, "This is currently only available on Windows")

          return false
        }
        // region Clone libs into a fresh run dir (avoid locked DLLs)
        if (dirTempNativeLibs?.exists() != true) {
          val tmpDir = root.resolve("Resources/AI/Tesseract/TmpNatives").apply { mkdirs() }
          // Remove former library-clones
          tmpDir
              .listFiles { file -> file.isDirectory && file.name.startsWith("tesseract_run_") }
              ?.forEach { oldFolder -> oldFolder.deleteRecursively() }

          val tempNativeLibs = File(tmpDir, "tesseract_run_${ System.currentTimeMillis()}")

          tempNativeLibs.mkdirs()
          dirTempNativeLibs = tempNativeLibs

          dirNativeLibs.listFiles()?.forEach { file ->
            file.copyTo(File(tempNativeLibs, file.name), overwrite = true)
          }
        }
        // endregion Clone libs into a fresh run dir (avoid locked DLLs)
        val tempNativeLibs = dirTempNativeLibs ?: return false

        System.setProperty("jna.library.path", tempNativeLibs.absolutePath)
        System.setProperty("net.sourceforge.tess4j.extract.path", tempNativeLibs.absolutePath)
        System.setProperty("net.sourceforge.tess4j.skip.extract", "true")
        // region Ensure that the model files are available
        tessDataDir = root.resolve("Resources/AI/Tesseract/Models").apply { mkdirs() }

        val languages = properties.getProperty("AI_Tesseract_Languages")
        val langs =
            if (languages.isNullOrBlank()) listOf("deu")
            else languages.split("+").map { it.trim() }.filter { it.isNotBlank() }

        langs.forEach { lang -> ensureTessData(tessDataDir, lang) }
        // endregion Ensure that the model files are available
        // region Initialize / Manage pool
        val poolSizeProp = properties.getProperty("AI_Tesseract_PoolSize")?.toIntOrNull()
        val targetSize = if (poolSizeProp != null && poolSizeProp > 0) poolSizeProp else 2
        val langArg = if (languages.isNullOrBlank()) "deu" else languages.replace(" ", "")

        properties.getProperty("AI_Tesseract_MaxRAMPercent")?.trim()?.toDoubleOrNull()?.let {
          if (it in 1.0..110.0) maxRAMPercent = it
        }

        properties.getProperty("AI_Tesseract_MaxCPUPercent")?.trim()?.toDoubleOrNull()?.let {
          if (it in 1.0..110.0) maxCPUPercent = it
        }

        if (!isPoolInitialized) {
          sizePool = targetSize

          repeat(sizePool) { addHandleToPool(langArg) }

          if (pool.isEmpty()) {
            log(
                LogLevel.ERROR,
                "Pool initialization failed \u2014 no handles were created (requested $sizePool for language '$langArg')")
            throw IllegalStateException(
                "Tesseract pool is empty after initialization \u2014 check language data files in ${tessDataDir?.absolutePath}")
          }
          if (pool.size < sizePool) {
            log(
                LogLevel.WARNING,
                "Pool partially initialized: ${pool.size} of $sizePool handles created")
          }
          log(LogLevel.INFO, "Pool initialized: ${pool.size} handles for language '$langArg'")

          isPoolInitialized = true
        } else {
          if (targetSize != sizePool) {
            val delta = targetSize - sizePool

            if (delta > 0) {
              repeat(delta) { addHandleToPool(langArg) }
            } else {
              repeat(-delta) {
                val handle = pool.poll()

                if (handle != null) TessAPI1.TessBaseAPIDelete(handle)
              }
            }

            sizePool = targetSize

            log(LogLevel.INFO, "Size of Pool changed to $sizePool")
          }
        }
        // endregion Initialize / Manage pool
        resourceMonitor?.shutdown()
        resourceMonitor = ResourceMonitor().also { it.start() }

        ready = true
        instance = this
      } catch (X: Throwable) {
        ready = false
        instance = null

        log(LogLevel.ERROR, "Initialization Failure: ${ X.message }", "", X)

        return false
      }
    }

    return true
  }

  /**
   * Generates a new Tesseract-Handle and adds it to the [pool].
   *
   * @param lang The language this handle shall recognize.
   */
  private fun addHandleToPool(lang: String) {
    try {
      val dataDir =
          tessDataDir
              ?: run {
                log(
                    LogLevel.WARNING,
                    "Tesseract data directory not initialized for pool handle ($lang)")
                return
              }
      val tesseract = TessAPI1.TessBaseAPICreate()

      if (TessAPI1.TessBaseAPIInit3(tesseract, dataDir.absolutePath, lang) != 0) {
        TessAPI1.TessBaseAPIDelete(tesseract)
        throw ServletException(
            "[[ CodBi / AI /Tesseract ] Unknown initialization failure while creating a new handle ($lang) ]")
      }

      pool.put(tesseract)
      log(LogLevel.INFO, "Pool handle created for language '$lang' (pool size now: ${pool.size})")
    } catch (X: Throwable) {
      log(
          LogLevel.ERROR,
          "Failed to create pool handle ($lang) \u2014 pool may be undersized: ${ X.message }",
          "",
          X)
    }
  }

  /** Empties the [pool]. */
  private fun emptyPool() {
    while (pool.isNotEmpty()) {
      val handle = pool.poll()

      if (handle != null) TessAPI1.TessBaseAPIDelete(handle)
    }

    isPoolInitialized = false
  }

  /**
   * Initializes this plugin if the CodBi-Plugin-Property **Active_AI** contains **OCR** (case
   * insensitive). By determining the [pluginRoot] it tells the [execute]-method where to store the
   * temporary images. Furthermore, the appropriate native libraries for the server's os will be
   * extracted from the JAR and copied onto the server's drive prior to being cloned to be provided
   * as versions that won't be locked due to possible previous initializations of the plugin. This
   * servlet will check if the appropriate models for the languages specified via the
   * CodBi-Plugin-Property **AI_Tesseract_Languages** (e.g. deu+ita+eng or just deu) are already
   * present within the Plugin's local resources and download the model for each language
   * automatically, if not. If the property is not set **deu** will be assumed.
   *
   * @param configData The [IPluginInitializeData] as provided by the formcycle environment.
   */
  override fun initialize(configData: IPluginInitializeData) {
    super.initialize(configData)

    pluginRoot = configData.fileHelper.pluginFolder

    if (!commonInit(configData.properties, pluginRoot)) return

    janitorIDedImages = Executors.newSingleThreadScheduledExecutor()

    startJanitor()

    log(LogLevel.INFO, "Tesseract initialized.")
  }

  /**
   * Wipes the local data needed to run the Tesseract, if **Active_AI** does not contain **OCR**.
   * Furthermore, **AI_Tesseract_Languages** is checked for compliance to
   * **^[a-z]{3}(\s*\+\s*[a-z]{3})*$**, if it is set.
   *
   * @param configData The [IPluginValidationData] as provided by the formcycle environment.
   * @return Always **NULL**.
   * @throws IllegalArgumentException If **AI_Tesseract_Languages** does not comply to
   *   **^[a-z]{3}(\s*\+\s*[a-z]{3})*$**.
   */
  @Throws(IllegalArgumentException::class)
  override fun validateConfigurationData(
      configData: IPluginValidationData
  ): IPluginInitializeValidationResult? {
    if (!commonInit(configData.properties, pluginRoot)) return null

    val languages = configData.properties.getProperty("AI_Tesseract_Languages")

    if (languages != null && !Regex("""^[a-z]{3}(\s*\+\s*[a-z]{3})*$""").matches(languages))
        throw IllegalArgumentException(
            "[[ CodBi / AI / Tesseract ] Config property AI_Tesseract_Languages, if set, has to match to following regular expression: ^[a-z]{3}(\\s*\\+\\s*[a-z]{3})*\$.")

    return null
  }

  // endregion Lifecycle
  // region Execution Modes
  /**
   * Does, if activated by the CodBi-Plugin-Property **Active_AI** containing **OCR**, use [AI]'s
   * janitor to store images that have an ID (if transmitted in the header **X-OCR-Image-ID**) and
   * extracts all the text from the transmitted, or via **X-OCR-Image-ID** specified, images.
   *
   * #### **X-Mode** Options (case-insensitive):
   * - **print (default)**: Plain text extraction - extracts all text from the image(s).
   * - **extract**: Extracts text from image(s) and returns only the parts that match the regex
   *   pattern specified in the **X-Pattern** header.
   * - **verify**: Extracts text from image(s) and checks if the text matches the regex pattern
   *   specified in the **X-Pattern** header.
   * - **extract fields**: Extracts text from image(s) and applies multiple regex patterns from the
   *   **X-FieldPatterns** header (JSON array) to extract field values.
   *
   * @param params As provided by the formcycle environment.
   * @return A proper [IPluginServletActionRetVal].
   */
  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    log(LogLevel.INFO, "Received OCR Request")

    if (!active) {
      log(
          LogLevel.ERROR,
          "The Tesseract was invoked but is currently not active. In order to activate it the keyword \"OCR\" has to be placed into the CodBi-Plugin-Property \"Active_AI\".")

      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"The Tesseract is currently not active. In order to activate it the keyword OCR has to be placed into the CodBi-Plugin-Property Active_AI.\"}"))
    }

    if (!ready) {
      log(
          LogLevel.ERROR,
          "Tesseract is active but not ready — initialization may have failed (pool initialized: $isPoolInitialized, pool size: ${pool.size}, tessDataDir: ${tessDataDir?.absolutePath})")
      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"Tesseract is not ready — initialization failed. Check server logs for details.\"}"))
    }
    // ── Resource gate ──────────────────────────────────────────────────
    resourceMonitor?.let { monitor ->
      val reason = monitor.exceedReason()

      if (reason != null) {
        val waitSec = monitor.estimateWaitSeconds()

        log(LogLevel.WARNING, "Resource gate BLOCKED: $reason — estimated wait ${waitSec}s")

        return PluginServletActionRetVal(
            ServletResponse(
                EResponseType.JSON,
                "{\"error\":\"Server resources exceeded ($reason). Please retry in ~${waitSec} seconds.\",\"retryAfter\":$waitSec}"))
      }
    }
    // region Get mode from X-Mode header (case-insensitive)
    val modeHeader =
        params.headerMap.entries.find { it.key.equals("X-Mode", ignoreCase = true) }?.value?.trim()
    val mode = modeHeader?.lowercase()
    // endregion Get mode from X-Mode header (case-insensitive)
    val existingTicket =
        params.headerMap.entries
            .find { it.key.equals("X-Queue-Ticket", ignoreCase = true) }
            ?.value
            ?.trim()
    if (!AI.inferenceSemaphore.tryAcquire()) {
      AI.cleanupStaleTickets()
      val ticket = existingTicket ?: java.util.UUID.randomUUID().toString()
      AI.queueTickets[ticket] = System.currentTimeMillis()
      AI.ticketModelTypes[ticket] = "tesseract"
      val pos = (AI.queueTickets.size - 1).coerceAtLeast(1)
      val badge = AI.queueBadgeEnabled
      val waitMs = AI.estimateWaitMs(ticket)
      val waitField = if (waitMs != null) ",\"estimatedWaitMs\":$waitMs" else ""
      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              """{"queued":true,"position":$pos,"queueBadge":$badge,"queueTicket":"$ticket"$waitField}"""))
    }
    existingTicket?.let {
      AI.queueTickets[it] = Long.MAX_VALUE
      AI.ticketModelTypes[it] = "tesseract"
    }
    val tesseractInferenceStartMs = System.currentTimeMillis()
    try {
      return when (mode) {
        "print" -> executeModePrint(params)
        "extract" -> executeModeExtract(params)
        "verify" -> executeModeVerify(params)
        "extract fields" -> executeModeExtractFields(params)
        null ->
            PluginServletActionRetVal(
                ServletResponse(
                    EResponseType.JSON,
                    "{\"error\":\"No X-Mode specified. Specify a modus operandi (print, verify, extract, or extract fields).\"}"))
        else ->
            PluginServletActionRetVal(
                ServletResponse(
                    EResponseType.JSON,
                    "{\"error\":\"Unsupported X-Mode in request-header (valid modes are print, verify, extract, or extract fields):${ modeHeader }\"}"))
      }
    } finally {
      val durationMs = System.currentTimeMillis() - tesseractInferenceStartMs
      if (durationMs > 0) AI.recordInferenceDuration("tesseract", durationMs)
      AI.inferenceSemaphore.release()
      existingTicket?.let {
        AI.queueTickets.remove(it)
        AI.ticketModelTypes.remove(it)
      }
    }
  }

  // ── Shared OCR Pipeline ────────────────────────────────────────────

  /**
   * Shared OCR processing pipeline for all execution modes. Extracts raw OCR text from all images
   * in the request, handling both uploaded files and cached images.
   *
   * @param params The servlet action parameters.
   * @return Map of (imageName → rawOcrText).
   */
  private fun extractOcrTexts(params: IPluginServletActionParams): Map<String, String> {
    val ocrTexts = mutableMapOf<String, String>()
    val filesToDelete = mutableListOf<File>()
    val allowDiskCache = !params.headerMap["X-OCR-Image-ID"].isNullOrEmpty()

    try {
      if (!params.uploadFiles.isNullOrEmpty()) {
        params.uploadFiles?.forEach { (inputName, fileItem) ->
          if (!allowDiskCache) {
            val bytes =
                fileItem.stream().use { input ->
                  input.map { it.data }.reduce { acc, b -> acc + b }.orElse(byteArrayOf())
                }

            ocrTexts[inputName] = runOcrOnImageBytes(bytes, params)

            return@forEach
          }

          val distinctImageID = "${ params.headerMap["X-OCR-Image-ID"]}::${ inputName }"
          var tempFile: File? = null
          var shouldDeleteThisFile = true

          if (params.headerMap["X-OCR-Image-ID"] != null &&
              distinctImageID.isNotBlank() &&
              cacheIDedImages.containsKey(distinctImageID)) {
            log(LogLevel.INFO, "Using cached image for ID: $distinctImageID")

            tempFile = cacheIDedImages[distinctImageID]?.file
            shouldDeleteThisFile = false
          }

          if (tempFile == null || !tempFile.exists()) {
            tempFile = kotlin.io.path.createTempFile("ocr_${inputName}_", ".png").toFile()

            val createdTempFile =
                requireNotNull(tempFile) { "Temp file for OCR processing is missing." }

            fileItem.stream().use { input ->
              val bytes = input.map { it.data }.reduce { acc, b -> acc + b }.orElse(byteArrayOf())

              createdTempFile.writeBytes(bytes)
            }

            if (params.headerMap["X-OCR-Image-ID"] != null && distinctImageID.isNotBlank()) {
              cacheIDedImages[distinctImageID] = CachedImage(createdTempFile)
              shouldDeleteThisFile = false
            }
          }

          val tempFileLocal =
              requireNotNull(tempFile) { "Temp file for OCR processing is missing." }

          if (shouldDeleteThisFile) filesToDelete.add(tempFileLocal)

          val orientationCorrectedFile = correctOrientation(tempFileLocal, params, filesToDelete)
          val preprocessedFile = preprocessImage(orientationCorrectedFile, params)

          if (preprocessedFile != orientationCorrectedFile) filesToDelete.add(preprocessedFile)

          ocrTexts[inputName] = runOcrOnDiskFile(preprocessedFile, inputName)
        }
      } else {
        cacheIDedImages.entries
            .filter { it.key.startsWith("${ params.headerMap["X-OCR-Image-ID"] }::") }
            .map { it.value }
            .forEach { (image, _) ->
              val preprocessedFile = preprocessImage(image, params)

              if (preprocessedFile != image) filesToDelete.add(preprocessedFile)

              ocrTexts[image.name] = runOcrOnDiskFile(preprocessedFile, image.name)
            }
      }
    } catch (X: Exception) {
      logger.error("[[ CodBi / AI / Tesseract ]] Execution Error", X)
    }

    return ocrTexts
  }

  /**
   * Applies orientation correction to an image file using manual rotation (X-Rotate header) or
   * Tesseract auto-detection.
   */
  private fun correctOrientation(
      tempFile: File,
      params: IPluginServletActionParams,
      filesToDelete: MutableList<File>
  ): File {
    try {
      val originalDPI = readImageDPI(tempFile)
      var correctedImage = ImageIO.read(tempFile)
      val manualRotation =
          params.headerMap.entries
              .find { it.key.equals("X-Rotate", ignoreCase = true) }
              ?.value
              ?.trim()
              ?.toIntOrNull() ?: 0

      if (manualRotation != 0) {
        log(LogLevel.INFO, "Applying manual rotation from X-Rotate header: ${manualRotation}°")

        if (manualRotation !in listOf(90, 180, 270)) {
          log(LogLevel.WARNING, "Invalid X-Rotate value: $manualRotation (use 0, 90, 180, or 270)")
        }

        correctedImage = ImageTransformer.applyRotation(correctedImage, manualRotation)
      } else {
        log(LogLevel.INFO, "Using Tesseract auto-detection to find best orientation...")

        val detectedAngle = detectBestOrientation(correctedImage, originalDPI)

        if (detectedAngle != 0) {
          correctedImage = ImageTransformer.applyRotation(correctedImage, detectedAngle)

          log(LogLevel.INFO, "Applied auto-detected rotation: ${detectedAngle}°")
        }
      }

      val correctedFile = kotlin.io.path.createTempFile("ocr_oriented_", ".png").toFile()

      writeImageWithDPI(correctedImage, correctedFile, originalDPI)

      filesToDelete.add(correctedFile)

      return correctedFile
    } catch (X: Exception) {
      log(LogLevel.WARNING, "Orientation correction failed, using original: ${X.message}")

      return tempFile
    }
  }

  /**
   * Runs OCR on a disk file using TessBaseAPIProcessPages.
   *
   * @param file The preprocessed image file.
   * @param imageName The name of the image for error messages.
   * @return The extracted raw OCR text.
   */
  private fun runOcrOnDiskFile(file: File, imageName: String): String {
    log(LogLevel.INFO, "Pool status before borrow: ${pool.size} available of $sizePool")

    val handle =
        pool.poll(10, TimeUnit.SECONDS)
            ?: throw IllegalStateException(
                "Pool exhausted (available: ${pool.size}, configured: $sizePool)")

    try {
      log(LogLevel.INFO, "Processing ${ file.absolutePath }")

      TessAPI1.TessBaseAPIProcessPages(handle, file.absolutePath, null, 0, null)

      val ptr = TessAPI1.TessBaseAPIGetUTF8Text(handle)
      val result = ptr?.getString(0, "UTF-8") ?: ""

      log(LogLevel.INFO, "Extracted: ${ result.trim() }")

      if (ptr != null) TessAPI1.TessDeleteText(ptr)

      TessAPI1.TessBaseAPIClear(handle)

      return result
    } catch (X: Throwable) {
      throw ServletException("[[ CodBi / AI / Tesseract ] Processing $imageName failed with: $X.]")
    } finally {
      pool.offer(handle)
    }
  }

  /** Validates that upload files or a cached image ID are present. */
  private fun requireImagesPresent(
      params: IPluginServletActionParams
  ): IPluginServletActionRetVal? {
    if (params.uploadFiles.isNullOrEmpty() && params.headerMap["X-OCR-Image-ID"].isNullOrEmpty()) {
      val msg =
          "No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with."

      log(LogLevel.ERROR, msg)

      return PluginServletActionRetVal(ServletResponse(EResponseType.JSON, "{\"error\":\"$msg\"}"))
    }

    return null
  }

  /**
   * Decodes a URL-encoded header value. Returns null-pair on failure to trigger an error response.
   */
  private fun decodeHeader(headerName: String, encoded: String): String? {
    return try {
      URLDecoder.decode(encoded, StandardCharsets.UTF_8.toString())
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Failed to decode $headerName header: ${ X.message }")

      null
    }
  }

  // ── Mode Implementations ──────────────────────────────────────────

  /**
   * Mode print: Plain text extraction — extracts all text from the image(s).
   *
   * @param params As provided by the formcycle environment.
   * @return A proper [IPluginServletActionRetVal].
   */
  private fun executeModePrint(params: IPluginServletActionParams): IPluginServletActionRetVal {
    requireImagesPresent(params)?.let {
      return it
    }

    val ocrTexts = extractOcrTexts(params)
    val preserveWhitespace = !params.headerMap["X-Pattern"].isNullOrEmpty()
    val results = if (preserveWhitespace) ocrTexts else ocrTexts.mapValues { it.value.trim() }
    val jsonResponse = Gson().toJson(results)

    return PluginServletActionRetVal(
        ServletResponse(EResponseType.JSON).apply { value = jsonResponse })
  }

  /**
   * Mode extract: Extracts text from image(s) and returns only the parts that match the regex
   * pattern specified in the **X-Pattern** header.
   *
   * @param params As provided by the formcycle environment.
   * @return A proper [IPluginServletActionRetVal].
   */
  private fun executeModeExtract(params: IPluginServletActionParams): IPluginServletActionRetVal {
    log(LogLevel.INFO, "Received Extraction Request")

    requireImagesPresent(params)?.let {
      return it
    }

    val patternHeaderEncoded = params.headerMap["X-Pattern"]?.trim()

    if (patternHeaderEncoded.isNullOrEmpty()) {
      log(LogLevel.ERROR, "Mode extract requires X-Pattern header to be specified.")

      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"Mode extract requires X-Pattern header to be specified.\"}"))
    }

    val patternHeader =
        decodeHeader("X-Pattern", patternHeaderEncoded)
            ?: return PluginServletActionRetVal(
                ServletResponse(
                    EResponseType.JSON, "{\"error\":\"Failed to decode X-Pattern header.\"}"))

    val regexFlags = parseRegexFlags(params)
    val ocrTexts = extractOcrTexts(params)

    val results =
        ocrTexts.mapValues { (_, rawText) ->
          try {
            patternHeader.toRegex(regexFlags).findAll(rawText).map { it.value }.toList()
          } catch (X: Exception) {
            listOf("Regex Error: ${ X.message }")
          }
        }

    val jsonResponse = Gson().toJson(results)

    return PluginServletActionRetVal(
        ServletResponse(EResponseType.JSON).apply { value = jsonResponse })
  }

  /**
   * Mode verify: Extracts text from image(s) and checks if the text matches the regex pattern
   * specified in the **X-Pattern** header.
   *
   * @param params As provided by the formcycle environment.
   * @return A proper [IPluginServletActionRetVal] with boolean results indicating if each image's
   *   text matches the pattern.
   */
  private fun executeModeVerify(params: IPluginServletActionParams): IPluginServletActionRetVal {
    requireImagesPresent(params)?.let {
      return it
    }

    val patternHeaderEncoded = params.headerMap["X-Pattern"]?.trim()

    if (patternHeaderEncoded.isNullOrEmpty()) {
      log(LogLevel.ERROR, "Mode verify requires **X-Pattern** header to be specified.")

      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"Mode verify requires X-Pattern header to be specified.\"}"))
    }

    val patternHeader =
        decodeHeader("X-Pattern", patternHeaderEncoded)
            ?: return PluginServletActionRetVal(
                ServletResponse(
                    EResponseType.JSON, "{\"error\":\"Failed to decode X-Pattern header.\"}"))

    val regexFlags = parseRegexFlags(params)
    val ocrTexts = extractOcrTexts(params)

    val results =
        ocrTexts.mapValues { (_, rawText) ->
          try {
            patternHeader.toRegex(regexFlags).containsMatchIn(rawText)
          } catch (X: Exception) {
            log(LogLevel.ERROR, "Regex Error in verify mode: ${ X.message }")

            false
          }
        }

    val jsonResponse = Gson().toJson(results)

    return PluginServletActionRetVal(
        ServletResponse(EResponseType.HTML).apply {
          value = String(jsonResponse.toByteArray(StandardCharsets.UTF_8), StandardCharsets.UTF_8)
          encoding = StandardCharsets.UTF_8.name()
        })
  }

  /**
   * Extracts text from image(s) and applies multiple regex patterns from the **X-FieldPatterns**
   * header (JSON array) to extract field values.
   *
   * @param params As provided by the formcycle environment.
   * @return A proper [IPluginServletActionRetVal] with field extraction results for each image.
   */
  private fun executeModeExtractFields(
      params: IPluginServletActionParams
  ): IPluginServletActionRetVal {
    log(LogLevel.INFO, "Received Field Extraction Request")

    requireImagesPresent(params)?.let {
      return it
    }

    val fieldPatternsHeaderEncoded =
        params.headerMap.entries
            .find { it.key.equals("X-FieldPatterns", ignoreCase = true) }
            ?.value
            ?.trim()

    if (fieldPatternsHeaderEncoded.isNullOrEmpty()) {
      log(
          LogLevel.ERROR,
          "Mode extract fields requires **X-FieldPatterns** header to be specified.")

      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"Mode extract fields requires X-FieldPatterns header to be specified.\"}"))
    }

    val fieldPatternsHeader =
        decodeHeader("X-FieldPatterns", fieldPatternsHeaderEncoded)
            ?: return PluginServletActionRetVal(
                ServletResponse(
                    EResponseType.JSON, "{\"error\":\"Failed to decode X-FieldPatterns header.\"}"))

    val fieldPatterns =
        try {
          val gson = Gson()
          val type = object : TypeToken<List<Map<String, String>>>() {}.type
          val jsonArray = gson.fromJson<List<Map<String, String>>>(fieldPatternsHeader, type)

          jsonArray.map { entry ->
            entry.mapValues { (_, encodedPattern) ->
              try {
                URLDecoder.decode(encodedPattern, StandardCharsets.UTF_8.toString())
              } catch (X: Exception) {
                log(LogLevel.ERROR, "Failed to decode pattern for field: ${ X.message }")

                ""
              }
            }
          }
        } catch (X: JsonSyntaxException) {
          log(LogLevel.ERROR, "Failed to parse X-FieldPatterns JSON: ${ X.message }")

          return PluginServletActionRetVal(
              ServletResponse(
                  EResponseType.JSON,
                  "{\"error\":\"Failed to parse X-FieldPatterns JSON: ${ X.message }\"}"))
        } catch (X: Exception) {
          log(LogLevel.ERROR, "Error processing X-FieldPatterns: ${ X.message }")

          return PluginServletActionRetVal(
              ServletResponse(
                  EResponseType.JSON,
                  "{\"error\":\"Error processing X-FieldPatterns: ${ X.message }\"}"))
        }

    val regexFlags = parseRegexFlags(params)
    val ocrTexts = extractOcrTexts(params)
    val allFieldNames = fieldPatterns.flatMap { it.keys }.distinct()

    val results =
        ocrTexts.mapValues { (_, rawText) ->
          val imageFields = allFieldNames.associateWith { emptyList<String>() }.toMutableMap()

          fieldPatterns.forEach { fieldPatternMap ->
            fieldPatternMap.forEach { (fieldName, pattern) ->
              if (pattern.isNotBlank()) {
                try {
                  val matches =
                      pattern.toRegex(regexFlags).findAll(rawText).map { it.value }.toList()

                  log(
                      LogLevel.INFO,
                      "Field '$fieldName' / Expression: '$pattern' / Matches: $matches")

                  imageFields[fieldName] = matches
                } catch (X: Exception) {
                  log(LogLevel.ERROR, "Regex Error for field '$fieldName': ${ X.message }")

                  imageFields[fieldName] = emptyList()
                }
              } else {
                imageFields[fieldName] = emptyList()
              }
            }
          }

          imageFields.toMap()
        }

    val jsonResponse = Gson().toJson(results)

    return PluginServletActionRetVal(
        ServletResponse(EResponseType.HTML).apply {
          value = String(jsonResponse.toByteArray(StandardCharsets.UTF_8), StandardCharsets.UTF_8)
          encoding = StandardCharsets.UTF_8.name()
        })
  }

  // endregion Execution Modes
  // region Native-Library-Management (Tess4J / Lept4J)
  /**
   * Acquires the Maven repository URL from **AI_Tesseract_MavenRepository**. If this plugin
   * property is not set the standard repository
   * ([https://repo1.maven.org/maven2](https://repo1.maven.org/maven2)) will be returned.
   *
   * @return The proper URL.
   */
  private fun resolveMavenRepo(): String {
    val repo = System.getProperty("codbi.maven.repo.url")?.trim()?.trimEnd('/')

    return if (repo.isNullOrEmpty()) "https://repo1.maven.org/maven2" else repo
  }

  /**
   * Downloads from the specified **url** into the **target**.
   *
   * @param url The source file.
   * @param target The target file.
   */
  private fun downloadTo(url: String, target: File) {
    target.parentFile?.mkdirs()

    URI(url)
        .toURL()
        .openConnection()
        .apply {
          connectTimeout = 15_000
          readTimeout = 600_000

          setRequestProperty("User-Agent", "CodBi-Tesseract/1.0")
        }
        .getInputStream()
        .use { input -> target.outputStream().use { output -> input.copyTo(output) } }
  }

  /**
   * Extracts the element **toExtract** from the given **source** to the given **destination**.
   *
   * @param source The [File] to extract from.
   * @param toExtract The name of the element to extract.
   * @param destination The [File] to extract to.
   */
  private fun extractJarEntry(source: File, toExtract: String, destination: File) {
    if (destination.exists()) return

    try {
      JarFile(source).use { jf ->
        val entry =
            jf.getJarEntry(toExtract)
                ?: throw IllegalStateException(
                    "[[ CodBi / AI / Tesseract ] Missing native entry in jar: ${ source.name }::$toExtract ]")

        jf.getInputStream(entry).use { input ->
          destination.parentFile?.mkdirs()

          destination.outputStream().use { output -> input.copyTo(output) }
        }

        log(LogLevel.INFO, "Provisioned native lib: ${ destination.name }")
      }
    } catch (X: Throwable) {
      log(LogLevel.ERROR, "Failed to extract $toExtract from ${source.name}: ${X.message}")
    }
  }

  /**
   * Make sure that the native Windows-Libraries are available.
   *
   * @param dirNativeLibs The directory where the native libraries reside.
   * @param arch The archetype.
   */
  private fun ensureWindowsNativeLibs(dirNativeLibs: File?, arch: String) {
    if (dirNativeLibs == null) return

    val platformDir = if (arch.contains("64")) "win32-x86-64" else "win32-x86"
    val tesseractDll = File(dirNativeLibs, "libtesseract551.dll")
    val leptDll = File(dirNativeLibs, "libleptonica1850.dll")

    if (tesseractDll.exists() && leptDll.exists()) return

    val repo = resolveMavenRepo()
    val cache = dirNativeLibs.parentFile?.resolve("maven-cache")?.apply { mkdirs() } ?: return
    val vTess4j = System.getProperty("codbi.tess4j.version")?.trim()?.ifBlank { null } ?: "5.16.0"
    val vLept4j = System.getProperty("codbi.lept4j.version")?.trim()?.ifBlank { null } ?: "1.21.1"
    val tess4jJar = File(cache, "tess4j-$vTess4j.jar")
    val lept4jJar = File(cache, "lept4j-$vLept4j.jar")

    if (!tess4jJar.exists()) {
      val url = "$repo/net/sourceforge/tess4j/tess4j/$vTess4j/tess4j-$vTess4j.jar"

      log(LogLevel.INFO, "Downloading Tess4J natives from: $url")

      downloadTo(url, tess4jJar)
    }

    if (!lept4jJar.exists()) {
      val url = "$repo/net/sourceforge/lept4j/lept4j/$vLept4j/lept4j-$vLept4j.jar"

      log(LogLevel.INFO, "Downloading Lept4J natives from: $url")

      downloadTo(url, lept4jJar)
    }

    extractJarEntry(tess4jJar, "$platformDir/libtesseract551.dll", tesseractDll)
    extractJarEntry(lept4jJar, "$platformDir/libleptonica1850.dll", leptDll)
  }

  // endregion Native library management (Tess4J / Lept4J)
  // region Data Management
  /** Removes the native libraries and the models from the local repository. */
  private fun wipeLocalData() {
    pluginRoot?.resolve("Resources/AI/Tesseract")?.deleteRecursively()
    cacheIDedImages.values.forEach { it.file.delete() }
    cacheIDedImages.clear()
    emptyPool()
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
          downloadTo("$baseUrl$fileName", localFile)

          log(LogLevel.INFO, "Successfully downloaded $fileName.")
        } catch (X: Exception) {
          log(LogLevel.WARNING, "Failed to download $fileName: ${ X.message }.")
        }
      }
    }
  }

  // endregion Data Management
  // region Shutdown
  /**
   * Shuts down the [pool] and releases all Tesseract handles.
   *
   * @param shutdownData As provided by the formcycle environment.
   */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    super.shutdown(shutdownData)

    resourceMonitor?.shutdown()
    resourceMonitor = null

    emptyPool()

    ready = false
    instance = null
  }

  /**
   * Sets the [idLogMessages] prior to [AI.log]ging.
   *
   * @param importance See [AI.log].
   * @param toLog See [AI.log].
   */
  override fun log(importance: LogLevel, toLog: String, adjenct: String, exception: Throwable?) {
    super.idLogMessages = "Tesseract"

    super.log(importance, toLog, adjenct, exception)
  }

  // endregion Shutdown

  // region Resource Monitor
  private inner class ResourceMonitor : Thread("codbi-tesseract-resource-monitor") {
    @Volatile
    var cpuPercent = 0.0
      private set

    @Volatile
    var ramPercent = 0.0
      private set

    @Volatile var running = true

    private val osMxBean: com.sun.management.OperatingSystemMXBean? =
        try {
          ManagementFactory.getOperatingSystemMXBean() as? com.sun.management.OperatingSystemMXBean
        } catch (_: Exception) {
          null
        }

    init {
      isDaemon = true
    }

    override fun run() {
      while (running) {
        try {
          osMxBean?.let {
            cpuPercent = it.systemCpuLoad * 100.0

            val totalMem = it.totalPhysicalMemorySize.toDouble()
            val freeMem = it.freePhysicalMemorySize.toDouble()

            ramPercent = if (totalMem > 0) (totalMem - freeMem) / totalMem * 100.0 else 0.0
          }

          sleep(1000)
        } catch (_: InterruptedException) {
          break
        } catch (_: Exception) {}
      }
    }

    /**
     * Checks if the resources are available based on the current CPU and RAM usage.
     *
     * @return True if resources are available, false otherwise.
     */
    fun resourcesAvailable(): Boolean = cpuPercent < maxCPUPercent && ramPercent < maxRAMPercent

    /**
     * Provides a reason why the resources are currently exceeded, if applicable.
     *
     * @return A string describing the reason, or null if resources are not exceeded.
     */
    fun exceedReason(): String? {
      val parts = mutableListOf<String>()

      if (cpuPercent >= maxCPUPercent)
          parts.add("CPU %.1f%% >= %.0f%%".format(cpuPercent, maxCPUPercent))

      if (ramPercent >= maxRAMPercent)
          parts.add("RAM %.1f%% >= %.0f%%".format(ramPercent, maxRAMPercent))

      return if (parts.isEmpty()) null else parts.joinToString(", ")
    }

    /**
     * Estimates the wait time in seconds based on the current CPU and RAM usage.
     *
     * @return An estimated wait time in seconds, coerced between 5 and 120 seconds.
     */
    fun estimateWaitSeconds(): Int {
      val cpuOver = (cpuPercent - maxCPUPercent).coerceAtLeast(0.0)
      val ramOver = (ramPercent - maxRAMPercent).coerceAtLeast(0.0)

      return ((cpuOver + ramOver) / 5.0).toInt().coerceIn(5, 120)
    }

    /** Shuts down the resource monitor thread. */
    fun shutdown() {
      running = false

      interrupt()
    }
  }
  // endregion Resource Monitor
}
