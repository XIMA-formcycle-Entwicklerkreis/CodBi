package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai

// region Imports
// region DJL
// endregion DJL
// region CodBi
// endregion CodBi
// region XIMA
// endregion XIMA
import ai.djl.engine.Engine
import ai.djl.inference.Predictor
import ai.djl.onnxruntime.engine.OrtEngineProvider
import ai.djl.repository.zoo.ZooModel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI.LogLevel
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import java.io.File
import java.net.URI
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.jar.JarFile

// endregion Imports

/**
 * # Base class for all CodBi ONNX Runtime model implementations.
 *
 * ## Lifecycle / plugin properties
 * - **Automatic download + init**: If `Active_AI` contains **ONNX** (case-insensitive),
 *   [initialize] prepares the plugin directories, provisions native libraries, and registers the
 *   DJL ONNX engine.
 * - **Removal / cleanup**: If `AI_Remove` contains **ONNX** (case-insensitive), [initialize]
 *   deletes **all** ONNX-related files under `pluginRoot/ai/onnx/` (models + natives + caches) and
 *   the ONNX runtime is **not** initialized. Restart after wards and then remove the AI_Remove
 *   property to have all locked files removed.
 *
 * ## Download sources (URLs / endpoints)
 * This class downloads the official ONNX Runtime Maven artifact and model files thus access to
 * - **https://repo1.maven.org/maven2** is mandatory.
 *
 * ## Caching / "no re-download"
 * The downloaded runtimes are cached so that **no files are downloaded again** as long as they're
 * **not** cleaned up putting **ONNX** (case-insensitive) in **AI_Remove**.
 *
 * ## Approx. resources (very rough)
 * - **Disk** : ~20–40 MB cached jar + ~10–50 MB extracted natives per run dir (Windows DLLs can be
 *   locked until JVM exit, so old run dirs may remain until the next successful purge).
 * - **CPU/RAM** : **~100–400 MB RAM**
 *
 * ### DSGVO, EU-AI ACT & technical Advantages vs Dedicated Server AI Approach
 * - No separate AI server setup (fewer systems to secure and audit).
 * - Reduced data transfer: processing stays within the plugin runtime.
 * - Simpler compliance scope: fewer endpoints and lower operational overhead.
 * - Lower latency and fewer network dependencies for OCR execution.
 * - Easier data minimization: fewer data copies and storage locations.
 * - Clearer accountability boundaries for processor/controller roles.
 * - Simplified breach response: no separate AI server to manage in case of incidents.
 * - Easier implementation of data subject rights (access, deletion) without coordinating with a
 *   separate AI service.
 * - Plugin does not store image data or OCR results persistently, minimizing data retention
 *   concerns.
 * - Most unproblematic deletion request response: Data is never stored not even in server-backups
 *   so no deletion necessary.
 */
abstract class ONNX : AI() {
  companion object {
    /** Tracks if the ONNX Runtime Engine has been initialized. */
    private val initialized = AtomicBoolean(false)

    /**
     * Default ONNX Runtime version to download for native libraries.
     *
     * When **AI_Remove** contains ONNX, ONNX will not be activated and ONNX files will be removed.
     */
    private const val defaultOrtVersion = "1.19.2"

    /**
     * `onnxruntime-openvino` version from PyPI whose native DLL is ABI-compatible with the Maven
     * [defaultOrtVersion] JNI wrapper. The C API is stable within the same `major.minor` series, so
     * 1.19.0 works with the 1.19.2 `onnxruntime4j_jni.dll`.
     */
    private const val defaultOrtOpenVinoVersion = "1.19.0"
  }

  /** Tracks if this specific instance is active. */
  protected var isActive = false

  /**
   * `true` when the Maven `onnxruntime.dll` (CPU-only) was successfully replaced with the
   * OpenVINO-EP-enabled build from the `onnxruntime-openvino` PyPI wheel. Subclasses read this to
   * decide whether to register the OpenVINO EP (via the generic `addExecutionProvider` native
   * method, called through reflection).
   */
  protected var openVinoOrtReplaced = false

  /**
   * The directory that contains the OpenVINO EP DLLs (`onnxruntime_providers_shared.dll`,
   * `onnxruntime_providers_openvino.dll`) extracted from the PyPI wheel. This is the ONNX native
   * run directory at the time of extraction, which may differ from [nativeLibDir] if a subclass
   * (e.g.
   * [OpenVINO][com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.openvino.onnx.OpenVINO])
   * overrides [nativeLibDir] during its own initialisation.
   *
   * Subclasses use this to pre-load the EP DLLs via `System.load()` before registering the EP,
   * which is necessary on Windows because the ORT C code uses `GetModuleFileName()` to locate
   * provider DLLs relative to the loaded `onnxruntime.dll` — a path that may point to a now-deleted
   * run directory after hot reloads. Pre-loading places the DLLs in the OS module cache so that
   * `LoadLibrary` deduplicates by base name and returns the cached handle.
   */
  protected var openVinoEpNativeDir: File? = null

  /** The number of sets of model files to keep to prevent race conditions. Default ot **3**. */
  private var keepNewest = 3

  /**
   * Tracks if ONNX is marked for removal via **AI_Remove** (so future servlet execute-methods can
   * respond quickly).
   */
  protected var onnxMarkedForRemoval = false

  /** The directory where ONNX native libraries are stored. */
  protected var nativeLibDir: File? = null

  /** The directory where ONNX models are stored. */
  protected var modelDir: File? = null

  /** Pool of predictors for concurrent inference. */
  protected val predictorPools = ConcurrentHashMap<String, LinkedBlockingQueue<Predictor<*, *>>>()

  /** Loaded models. */
  protected val loadedModels = ConcurrentHashMap<String, ZooModel<*, *>>()

  init {
    idLogMessages = "ONNX"
  }

  /**
   * Remove all native libraries directory from previous runs keeping only as much recent ones
   * specified by [keepNewest].
   *
   * @param nativeRootDir The directory where the native directories shall reside.
   * @param keepNewest The number of sets of recent native libraries that shall be kept to avoid a
   *   race condition.
   */
  private fun purgeOldNativeRunDirs(nativeRootDir: File, keepNewest: Int) {
    val runs =
        nativeRootDir
            .listFiles()
            ?.filter { it.isDirectory && it.name.startsWith("run-") }
            ?.sortedByDescending { it.lastModified() } ?: return

    runs.drop(keepNewest).forEach { dir ->
      try {
        val deleted = dir.deleteRecursively()
        if (deleted) {
          log(LogLevel.INFO, "Deleted old native dir: ${dir.absolutePath}")
        } else {
          log(
              LogLevel.INFO,
              "Partially deleted old native dir (some files locked): ${dir.absolutePath}")
        }
      } catch (X: Exception) {
        log(
            LogLevel.WARNING,
            "Could not delete old native dir (likely locked): ${dir.absolutePath}",
            "",
            X)
      }
    }
  }

  /**
   * Represents the platform-specific details for the ONNX Runtime native libraries.
   *
   * @property mavenPlatformDir The directory name used in the Maven artifact (e.g., "win-x64",
   *   "linux-x64").
   * @property ortLibName The name of the main ONNX Runtime shared library (e.g., "onnxruntime.dll",
   *   "libonnxruntime.so").
   * @property jniLibName The name of the JNI shared library (e.g., "onnxruntime4j_jni.dll",
   *   "libonnxruntime4j_jni.so").
   */
  private data class OrtPlatform(
      /** The directory where the native ONNX libraries reside. */
      val mavenPlatformDir: String,
      /** The name of the main ONNX Runtime shared library. */
      val ortLibName: String,
      /** The name of the JNI shared library. */
      val jniLibName: String
  )

  /**
   * Determines the proper [OrtPlatform] corresponding to the server's os and archetype.
   *
   * @return The requested [OrtPlatform].
   */
  private fun resolveOrtPlatform(): OrtPlatform {
    val os = System.getProperty("os.name").lowercase()
    val arch = System.getProperty("os.arch").lowercase()

    return when {
      os.contains("win") && arch.contains("64") ->
          OrtPlatform("win-x64", "onnxruntime.dll", "onnxruntime4j_jni.dll")
      os.contains("mac") && (arch.contains("aarch") || arch == "arm") ->
          OrtPlatform("osx-aarch64", "libonnxruntime.dylib", "libonnxruntime4j_jni.dylib")
      os.contains("mac") ->
          OrtPlatform("osx-x64", "libonnxruntime.dylib", "libonnxruntime4j_jni.dylib")
      arch.contains("aarch") || arch == "arm" ->
          OrtPlatform("linux-aarch64", "libonnxruntime.so", "libonnxruntime4j_jni.so")
      else -> OrtPlatform("linux-x64", "libonnxruntime.so", "libonnxruntime4j_jni.so")
    }
  }

  /**
   * Determines the version of the ONNX runtime that is provided in the **pom.xml**.
   *
   * @return The [String] specifying the version.
   */
  private fun resolveOnnxruntimeVersionFromClasspath(): String? {
    val override = System.getProperty("codbi.onnxruntime.version")?.trim()

    if (!override.isNullOrEmpty() && override.lowercase() != "auto") return override

    // If not explicitly overridden, we default to a known-good version.
    if (override.isNullOrEmpty()) return defaultOrtVersion

    // `com.microsoft.onnxruntime:onnxruntime` jars ship `pom.xml` but (at least in 1.21.1) no
    // `pom.properties`.
    val pomXml =
        this.javaClass.classLoader.getResourceAsStream(
            "META-INF/maven/com.microsoft.onnxruntime/onnxruntime/pom.xml") ?: return null

    try {
      val text = pomXml.bufferedReader(Charsets.UTF_8).use { it.readText() }
      val match =
          Regex("<artifactId>onnxruntime</artifactId>\\s*<version>([^<]+)</version>").find(text)

      return match?.groupValues?.get(1)?.trim()?.takeIf { it.isNotEmpty() }
    } catch (X: Exception) {
      log(LogLevel.WARNING, "Failed to read ONNXRuntime version from pom.xml: ${X.message}")
      return null
    }
  }

  /**
   * Downloads a file from the specified URL to the target file location.
   *
   * @param url The URL to download from.
   * @param targetFile The file to write the downloaded content to.
   */
  private fun downloadFile(url: String, targetFile: File) {
    targetFile.parentFile?.mkdirs()

    URI(url)
        .toURL()
        .openConnection()
        .apply {
          connectTimeout = 15_000
          readTimeout = 600_000
          setRequestProperty("User-Agent", "CodBi-ONNX/1.0")
        }
        .getInputStream()
        .use { input -> targetFile.outputStream().use { output -> input.copyTo(output) } }
  }

  /**
   * Ensures ONNX Runtime native libraries exist under [nativeLibDir] by extracting them from the
   * official ONNX Runtime artifact downloaded from a Maven repository.
   *
   * @param targetDir The directory where the native libraries shall reside.
   * @return `true` if the libraries were successfully ensured, `false` otherwise.
   */
  private fun ensureNativeLibrariesFromMaven(targetDir: File): Boolean {
    val platform = resolveOrtPlatform()

    val requiredFiles =
        listOf(File(targetDir, platform.ortLibName), File(targetDir, platform.jniLibName))

    val version =
        resolveOnnxruntimeVersionFromClasspath()
            ?: run {
              log(LogLevel.ERROR, "Could not determine ONNXRuntime version from classpath")
              return false
            }

    // Cache the downloaded jar in a stable directory (nativeRoot/maven-cache) so we don't
    // re-download
    // on every init. Still extract natives into the per-run [targetDir] to avoid classloader
    // collisions.
    val nativeRootDir = targetDir.parentFile ?: targetDir
    val cacheDir = File(nativeRootDir, "maven-cache")

    cacheDir.mkdirs()

    val versionMarker = File(cacheDir, "onnxruntime.version")
    val currentMarker = if (versionMarker.exists()) versionMarker.readText().trim() else ""

    if (requiredFiles.all { it.exists() } && currentMarker == version) {
      log(LogLevel.INFO, "Native libraries already present in: ${targetDir.absolutePath}")
      return true
    }

    if (requiredFiles.any { it.exists() } && currentMarker != version) {
      log(
          LogLevel.INFO,
          "Replacing ONNX Runtime natives (have=\"$currentMarker\", want=\"$version\")")
      requiredFiles.forEach { runCatching { it.delete() } }
    }

    val jarCache = File(cacheDir, "onnxruntime-$version.jar")

    val jarFile =
        if (jarCache.exists() && jarCache.length() > 0L) {
          log(LogLevel.INFO, "Using cached ONNXRuntime jar: ${jarCache.absolutePath}")
          jarCache
        } else {
          val repo =
              System.getProperty("codbi.maven.repo.url")?.trim()?.trimEnd('/')
                  ?: "https://repo1.maven.org/maven2"
          val jarUrl =
              "$repo/com/microsoft/onnxruntime/onnxruntime/$version/onnxruntime-$version.jar"

          try {
            log(LogLevel.INFO, "Downloading ONNXRuntime natives from Maven repo: $jarUrl")
            downloadFile(jarUrl, jarCache)
            jarCache
          } catch (X: Exception) {
            log(LogLevel.ERROR, "Failed to download ONNXRuntime natives: ${X.message}", "", X)
            return false
          }
        }

    val entries =
        listOf(
            "ai/onnxruntime/native/${platform.mavenPlatformDir}/${platform.ortLibName}" to
                File(targetDir, platform.ortLibName),
            "ai/onnxruntime/native/${platform.mavenPlatformDir}/${platform.jniLibName}" to
                File(targetDir, platform.jniLibName))

    try {
      JarFile(jarFile).use { jar ->
        entries.forEach { (entryName, outFile) ->
          val entry = jar.getJarEntry(entryName)

          if (entry == null) {
            log(LogLevel.ERROR, "Missing native entry in ONNXRuntime jar: $entryName")
            return false
          }

          outFile.parentFile?.mkdirs()
          jar.getInputStream(entry).use { input ->
            outFile.outputStream().use { output -> input.copyTo(output) }
          }

          log(LogLevel.INFO, "Extracted ${outFile.name} to: ${targetDir.absolutePath}")
        }
      }

      if (!requiredFiles.all { it.exists() }) return false

      versionMarker.writeText(version)
      return true
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Failed to extract ONNXRuntime natives: ${X.message}", "", X)
      return false
    }
  }

  /**
   * Initializes the ONNX Runtime engine.
   *
   * @return `true` if initialization was successful, `false` otherwise.
   */
  protected fun initEngine(): Boolean {
    if (initialized.get()) return true

    try {
      val oldClassLoader = Thread.currentThread().contextClassLoader

      try {
        Thread.currentThread().contextClassLoader = this.javaClass.classLoader

        nativeLibDir?.let {
          System.setProperty("onnxruntime.native.path", it.absolutePath)
          log(LogLevel.INFO, "Set onnxruntime.native.path to: ${it.absolutePath}")
        }

        if (!Engine.getAllEngines().contains("OnnxRuntime")) {
          Engine.registerEngine(OrtEngineProvider())
        }

        log(
            LogLevel.INFO,
            "ONNX Runtime engine registered, available engines: ${Engine.getAllEngines()}")

        // -----------------------------------------------------------------------------------------
        // FIX: Pre-initialize HuggingFace Tokenizers (Rust Engine)
        // -----------------------------------------------------------------------------------------
        // The Tokenizers library needs to read 'tokenizers.properties' from its JAR to determine
        // the version. This often fails in plugin environments (AssertionError) unless the
        // ContextClassLoader is explicitly set to the plugin's classloader (which we have here).
        try {
          Class.forName("ai.djl.huggingface.tokenizers.jni.LibUtils")
          log(LogLevel.INFO, "Tokenizers (Rust) engine initialized/checked.")
        } catch (e: ClassNotFoundException) {
          // Ignore, module not present
        } catch (e: Throwable) {
          // Log but don't fail ONNX init, as Tokenizers might not be strictly required for all
          // models
          log(LogLevel.WARNING, "Failed to pre-initialize Tokenizers (Rust) engine: ${e.message}")
        }

        initialized.set(true)
        return true
      } finally {
        Thread.currentThread().contextClassLoader = oldClassLoader
      }
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Failed to initialize ONNX Runtime: ${X.message}")
      X.printStackTrace()

      return false
    }
  }

  /**
   * Initializes ONNX Runtime if **Active_AI** contains **ONNX**.
   *
   * @param configData The initialization data provided by the plugin framework.
   */
  override fun initialize(configData: IPluginInitializeData) {
    super.initialize(configData)

    // IMPORTANT (hot reload / re-init):
    // `initialize()` can be called multiple times on the same instance. Make sure we don't keep
    // stale state
    // from a previous init when ONNX is now disabled/removed.
    isActive = false
    onnxMarkedForRemoval = false
    nativeLibDir = null
    modelDir = null

    val activeAI = configData.properties.getProperty("Active_AI")?.lowercase() ?: ""

    if (!activeAI.contains("onnx")) {
      log(LogLevel.INFO, "ONNX not activated (Active_AI does not contain 'ONNX')")
      return
    }

    val aiRemove = configData.properties.getProperty("AI_Remove")?.lowercase() ?: ""

    if (aiRemove.lowercase().contains("onnx")) {
      log(LogLevel.INFO, "ONNX marked for removal in AI_Remove")

      onnxMarkedForRemoval = true
      cleanupFiles(configData.fileHelper.pluginFolder)
      return
    }

    val pluginDir = File(configData.fileHelper.pluginFolder, "ai/onnx")

    val nativeRootDir = File(pluginDir, "native")
    val nativeRunDir = File(nativeRootDir, "run-${System.currentTimeMillis()}")
    nativeLibDir = nativeRunDir
    modelDir = File(pluginDir, "models")

    nativeRootDir.mkdirs()
    nativeRunDir.mkdirs()
    modelDir?.mkdirs()

    val djlCache = File(pluginDir, "djl-cache")
    djlCache.mkdirs()
    System.setProperty("djl.cache.dir", djlCache.absolutePath)

    // region Try to purge old temporary native libraries folder
    keepNewest = configData.properties.getProperty("AI_ONNX_NativeTempToKeep")?.toIntOrNull() ?: 3

    purgeOldNativeRunDirs(nativeRootDir, keepNewest)
    // endregion Try to purge old temporary native libraries folder
    try {
      if (!ensureNativeLibrariesFromMaven(nativeLibDir!!)) {
        return
      }

      // Hook: allow subclasses to modify native libraries (e.g. replace
      // onnxruntime.dll with an EP-enabled build) BEFORE the engine is loaded.
      // Once initEngine() runs and a model calls Engine.getEngine("OnnxRuntime"),
      // the DLL is memory-mapped and can no longer be swapped.
      onNativeLibrariesExtracted()

      // If OpenVINO EP is desired (Active_AI contains "openvino"), replace Maven's
      // CPU-only onnxruntime.dll with the OpenVINO-enabled build from the PyPI
      // onnxruntime-openvino wheel. The ORT engine is a process-wide JVM singleton —
      // whichever ONNX subclass initialises first determines the DLL for ALL models.
      // This MUST happen before initEngine() / Engine.getEngine().
      if (activeAI.contains("openvino") && !openVinoOrtReplaced) {
        openVinoOrtReplaced = replaceOrtWithOpenVinoEnabled(nativeLibDir!!)
      }

      if (!initEngine()) {
        return
      }

      isActive = true
      log(LogLevel.INFO, "ONNX Runtime initialized successfully")
    } catch (X: Throwable) {
      log(LogLevel.ERROR, "ONNX setup failed: ${X.message}", "", X)
    }
  }

  /**
   * Hook called after ONNX Runtime native libraries have been extracted from the Maven artifact but
   * **before** the engine is initialised (and the DLL loaded into the JVM process).
   *
   * Subclasses can override this to replace or augment the native libraries — for example to swap
   * Maven's CPU-only `onnxruntime.dll` with an Execution-Provider-enabled build from PyPI.
   *
   * The default implementation is a no-op.
   */
  protected open fun onNativeLibrariesExtracted() {
    // no-op — subclasses override as needed
  }

  // region OpenVINO-enabled ORT replacement ------------------------------------------------

  /**
   * Replaces the Maven-downloaded `onnxruntime.dll` (CPU-only) with the OpenVINO-EP-enabled build
   * from Intel's `onnxruntime-openvino` PyPI wheel. The wheel additionally contains
   * `onnxruntime_providers_openvino.dll`, `onnxruntime_providers_shared.dll`, and bundled OpenVINO
   * runtime libraries.
   *
   * The JNI wrapper (`onnxruntime4j_jni.dll`) extracted from Maven is kept — it uses the stable ORT
   * C API which is backward-compatible within the same major.minor series.
   *
   * @param nativeDir The run directory that already contains the Maven-extracted DLLs.
   * @return `true` if the replacement succeeded, `false` on any error (models will fall back to
   *   CPU-only ORT in that case).
   */
  private fun replaceOrtWithOpenVinoEnabled(nativeDir: File): Boolean {
    // Currently Windows-only (win_amd64 wheel).  Linux/macOS can be added later.
    val os = (System.getProperty("os.name") ?: "").lowercase()
    if (!os.contains("win")) {
      log(LogLevel.INFO, "OpenVINO ORT replacement skipped — not a Windows system")
      return false
    }

    val ortOvVersion = defaultOrtOpenVinoVersion
    try {
      // ---- 1. Discover the wheel download URL via PyPI JSON API ----
      val pypiJson =
          URI("https://pypi.org/pypi/onnxruntime-openvino/$ortOvVersion/json")
              .toURL()
              .openConnection()
              .apply {
                connectTimeout = 15_000
                readTimeout = 30_000
              }
              .getInputStream()
              .bufferedReader()
              .readText()

      // Any Windows wheel works — the native DLLs inside are identical across Python versions.
      val wheelUrlMatch =
          Regex("\"url\"\\s*:\\s*\"(https://[^\"]+cp31[0-9][^\"]*win_amd64\\.whl)\"").find(pypiJson)
      val wheelUrl =
          wheelUrlMatch?.groupValues?.get(1)
              ?: throw RuntimeException(
                  "No Windows wheel found in PyPI metadata for onnxruntime-openvino $ortOvVersion")

      // ---- 2. Download wheel to a stable cache directory ----
      val cacheDir = File(nativeDir.parentFile ?: nativeDir, "maven-cache")
      cacheDir.mkdirs()
      val wheelFile = File(cacheDir, "onnxruntime-openvino-$ortOvVersion.whl")

      if (!wheelFile.exists() || wheelFile.length() < 10_000) {
        log(LogLevel.INFO, "Downloading onnxruntime-openvino $ortOvVersion wheel from PyPI...")
        URI(wheelUrl)
            .toURL()
            .openConnection()
            .apply {
              connectTimeout = 15_000
              readTimeout = 300_000
            }
            .getInputStream()
            .use { input -> wheelFile.outputStream().use { output -> input.copyTo(output) } }
        val sizeMB = String.format("%.1f", wheelFile.length() / (1024.0 * 1024.0))
        log(LogLevel.INFO, "Downloaded onnxruntime-openvino wheel ($sizeMB MB)")
      }

      // ---- 3. Back up the Maven onnxruntime.dll ----
      val originalOrt = File(nativeDir, "onnxruntime.dll")
      val backupOrt = File(nativeDir, "onnxruntime.dll.maven-original")
      if (originalOrt.exists() && !backupOrt.exists()) {
        originalOrt.copyTo(backupOrt)
        log(LogLevel.INFO, "Backed up Maven onnxruntime.dll → onnxruntime.dll.maven-original")
      }

      // ---- 4. Extract ALL DLLs from onnxruntime/capi/ in the wheel ----
      // This replaces onnxruntime.dll with the OpenVINO build and adds EP bridge DLLs
      // plus bundled OpenVINO runtime libraries.
      var extractedCount = 0
      java.util.zip.ZipFile(wheelFile).use { zip ->
        zip.entries()
            .asSequence()
            .filter {
              !it.isDirectory && it.name.startsWith("onnxruntime/capi/") && it.name.endsWith(".dll")
            }
            .forEach { entry ->
              val fileName = entry.name.substringAfterLast('/')
              val targetFile = File(nativeDir, fileName)
              zip.getInputStream(entry).use { input ->
                targetFile.outputStream().use { output -> input.copyTo(output) }
              }
              extractedCount++
              log(
                  LogLevel.INFO,
                  "Extracted $fileName (${targetFile.length()} bytes) → ${nativeDir.absolutePath}")
            }
      }

      val epDll = File(nativeDir, "onnxruntime_providers_openvino.dll")
      if (epDll.exists()) {
        openVinoEpNativeDir = nativeDir
        log(LogLevel.INFO, "Replaced Maven ORT with OpenVINO-enabled build ($extractedCount DLLs)")
        return true
      } else {
        log(
            LogLevel.WARNING,
            "onnxruntime_providers_openvino.dll not found after extraction — " +
                "wheel may have a different internal layout")
        return false
      }
    } catch (e: Exception) {
      log(
          LogLevel.WARNING,
          "Failed to provision OpenVINO ORT: ${e.message}. Models will use CPU-only.",
          "",
          e)
      return false
    }
  }

  // endregion OpenVINO-enabled ORT replacement ------------------------------------------------

  /**
   * Determines whether the ONNX runtime is active and ready for use.
   *
   * @return `true` if ONNX is active, `false` otherwise.
   */
  protected fun onnxIsReady(): Boolean = isActive

  /**
   * Cleans up ONNX files when AI_Remove contains ONNX.
   *
   * @param pluginFolder The root folder of the plugin.
   */
  private fun cleanupFiles(pluginFolder: File) {
    val onnxDir = File(pluginFolder, "ai/onnx")

    if (onnxDir.exists()) {
      onnxDir.deleteRecursively()
      log(LogLevel.INFO, "Cleaned up ONNX files")
    }

    val tokenizersDir = File(pluginFolder, "ai/tokenizers")

    if (tokenizersDir.exists()) {
      tokenizersDir.deleteRecursively()
      log(LogLevel.INFO, "Cleaned up tokenizers files")
    }

    val djlCacheDir = File(pluginFolder, "ai/djl-cache")

    if (djlCacheDir.exists()) {
      djlCacheDir.deleteRecursively()
      log(LogLevel.INFO, "Cleaned up DJL cache files")
    }
  }

  /**
   * Acquires a predictor from the pool.
   *
   * @param modelName The name of the model to acquire a predictor for.
   * @return A [Predictor] instance, or `null` if none could be acquired.
   */
  protected fun <I, O> acquirePredictor(modelName: String): Predictor<I, O>? {
    @Suppress("UNCHECKED_CAST")
    val pool = predictorPools[modelName] as? LinkedBlockingQueue<Predictor<I, O>> ?: return null

    return try {
      pool.poll(30, TimeUnit.SECONDS)
    } catch (X: InterruptedException) {
      Thread.currentThread().interrupt()
      throw IllegalStateException("Interrupted while acquiring predictor for $modelName", X)
    }
  }

  /**
   * Returns a predictor to the pool.
   *
   * @param modelName The name of the model the predictor belongs to.
   * @param predictor The [Predictor] instance to return.
   */
  protected fun <I, O> releasePredictor(modelName: String, predictor: Predictor<I, O>) {
    @Suppress("UNCHECKED_CAST")
    val pool = predictorPools[modelName] as? LinkedBlockingQueue<Predictor<I, O>> ?: return

    pool.offer(predictor)
  }

  /**
   * Shuts down ONNX Runtime and releases resources.
   *
   * @param shutdownData The shutdown data provided by the plugin framework.
   */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    super.shutdown(shutdownData)
    // endregion Close predictors.
    predictorPools.values.forEach { pool ->
      pool.forEach {
        try {
          it.close()
        } catch (X: Exception) {
          log(LogLevel.WARNING, "Predictor close failed (ignored): ${X.message}", "", X)
        }
      }
      pool.clear()
    }
    // endregion Close predictors.
    predictorPools.clear()
    // region Close loaded models.
    loadedModels.values.forEach {
      try {
        it.close()
      } catch (X: IllegalStateException) {
        // ORT may throw "Trying to close a closed SessionOptions." when shutdown is invoked twice
        // or
        // when a model was already closed by another plugin lifecycle path. Treat as best-effort.
        log(LogLevel.WARNING, "Model close failed (ignored): ${X.message}", "", X)
      } catch (X: Exception) {
        log(LogLevel.WARNING, "Model close failed (ignored): ${X.message}", "", X)
      }
    }
    // endregion Close loaded models.
    loadedModels.clear()

    // region Try to delete temporary native libraries.
    nativeLibDir?.let { dir ->
      try {
        dir.deleteRecursively()
        log(LogLevel.INFO, "Deleted native dir: ${dir.absolutePath}")
      } catch (X: Exception) {
        log(
            LogLevel.WARNING,
            "Could not delete native dir (likely locked): ${dir.absolutePath}",
            "",
            X)
      }
    }
    // endregion Try to delete temporary native libraries.
    isActive = false
    log(LogLevel.INFO, "ONNX Runtime shutdown complete")
  }

  /**
   * Sets the [idLogMessages] prior to [AI.log]ging.
   *
   * @param importance See [AI.log].
   * @param toLog See [AI.log].
   * @param adjenct See [AI.log].
   * @param exception See [AI.log].
   */
  override fun log(importance: LogLevel, toLog: String, adjenct: String, exception: Throwable?) {
    super.idLogMessages = "ONNX"

    super.log(importance, toLog, adjenct, exception)
  }
}
