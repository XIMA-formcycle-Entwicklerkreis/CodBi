package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai

// region Imports
import ai.djl.engine.Engine
import ai.djl.inference.Predictor
import ai.djl.onnxruntime.engine.OrtEngineProvider
import ai.djl.repository.zoo.ZooModel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI.LogLevel
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import java.io.File
import java.net.URL
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
 * - **Automatic download + init**: if `Active_AI` contains **ONNX** (case-insensitive),
 *   [initialize] prepares the plugin directories, provisions native libraries, and registers the
 *   DJL ONNX engine.
 * - **Removal / cleanup**: if `AI_Remove` contains **ONNX** (case-insensitive), [initialize]
 *   deletes **all** ONNX-related files under `pluginRoot/ai/onnx/` (models + natives + caches) and
 *   the ONNX runtime is **not** initialized.
 *
 * ## Download sources (URLs / endpoints)
 * This class downloads the official ONNX Runtime Maven artifact and model files thus access to
 * - **https://repo1.maven.org/maven2** is mandatory.
 *
 * ## Caching / "no re-download"
 * The downloaded runtimes are cached so that **no files are downloaded again** as long as they're
 * **not** cleaned up putting **ONNX** (case insensitive) in **AI_Remove**.
 *
 * ## Approx. resources (very rough)
 * - **Disk** : ~20–40 MB cached jar + ~10–50 MB extracted natives per run dir (Windows DLLs can be
 *   locked until JVM exit, so old run dirs may remain until the next successful purge).
 * - **CPU/RAM** : **~100–400 MB RAM**
 */
abstract class ONNX : AI() {
  companion object {
    /** Tracks if the ONNX Runtime Engine has been initialized. */
    private val initialized = AtomicBoolean(false)

    /**
     * Default ONNX Runtime version to download for native libraries.
     *
     * When `AI_Remove` contains ONNX, ONNX will not be activated and ONNX files will be removed.
     *
     * @remarks We pin this to 1.19.2 because newer Windows builds (>= 1.21) can trigger
     *   `UnsatisfiedLinkError` depending on the JDK / VC runtime environment.
     */
    private const val defaultOrtVersion = "1.19.2"
  }

  /** Tracks if this specific instance is active. */
  protected var isActive = false

  /** Tracks if ONNX is marked for removal via `AI_Remove` (so execute() can respond quickly). */
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

  private fun purgeOldNativeRunDirs(nativeRootDir: File, keepNewest: Int) {
    val runs =
        nativeRootDir
            .listFiles()
            ?.filter { it.isDirectory && it.name.startsWith("run-") }
            ?.sortedByDescending { it.lastModified() } ?: return

    runs.drop(keepNewest).forEach { dir ->
      try {
        dir.deleteRecursively()
        log(LogLevel.INFO, "Deleted old native dir: ${dir.absolutePath}")
      } catch (X: Exception) {
        log(
            LogLevel.WARNING,
            "Could not delete old native dir (likely locked): ${dir.absolutePath}",
            "",
            X)
      }
    }
  }

  private data class OrtPlatform(
      val mavenPlatformDir: String,
      val ortLibName: String,
      val jniLibName: String
  )

  private fun resolveOrtPlatform(): OrtPlatform {
    val os = System.getProperty("os.name").lowercase()
    val arch = System.getProperty("os.arch").lowercase()

    // Matches the layout inside `com.microsoft.onnxruntime:onnxruntime` jars:
    // `ai/onnxruntime/native/<platform>/...`
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

  private fun downloadFile(url: String, targetFile: File) {
    targetFile.parentFile?.mkdirs()

    URL(url)
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

  /** Initializes the ONNX Runtime engine. */
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

  /** Initializes ONNX Runtime if **Active_AI** contains **ONNX**. */
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

    // Use a unique native directory per plugin-load to avoid:
    // "onnxruntime.dll already loaded in another classloader" (hot reload / multiple classloaders).
    val nativeRootDir = File(pluginDir, "native")
    val nativeRunDir = File(nativeRootDir, "run-${System.currentTimeMillis()}")
    nativeLibDir = nativeRunDir
    modelDir = File(pluginDir, "models")

    nativeRootDir.mkdirs()
    nativeRunDir.mkdirs()
    modelDir?.mkdirs()

    // -----------------------------------------------------------------------------------------
    // FIX: Configure DJL Cache Directory
    // -----------------------------------------------------------------------------------------
    // Ensure DJL downloads any additional natives (like Tokenizers) to the plugin folder
    // instead of the system user home (~/.djl), which might be read-only or shared.
    val djlCache = File(pluginDir, "djl-cache")
    djlCache.mkdirs()
    System.setProperty("djl.cache.dir", djlCache.absolutePath)

    // Best-effort cleanup so old run folders don't accumulate forever.
    // If a previous classloader still has a DLL loaded, Windows will lock it and deletion will
    // fail.
    purgeOldNativeRunDirs(nativeRootDir, keepNewest = 3)

    try {
      if (!ensureNativeLibrariesFromMaven(nativeLibDir!!)) {
        return
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

  protected fun onnxIsReady(): Boolean = isActive

  /** Cleans up ONNX files when AI_Remove contains ONNX. */
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

  /** Acquires a predictor from the pool. */
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

  /** Returns a predictor to the pool. */
  protected fun <I, O> releasePredictor(modelName: String, predictor: Predictor<I, O>) {
    @Suppress("UNCHECKED_CAST")
    val pool = predictorPools[modelName] as? LinkedBlockingQueue<Predictor<I, O>> ?: return
    pool.offer(predictor)
  }

  /** Shuts down ONNX Runtime and releases resources. */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    super.shutdown(shutdownData)

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
    predictorPools.clear()

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
    loadedModels.clear()

    // Best-effort: on Windows the loaded DLLs are typically locked until JVM exit,
    // so this may fail (and that's OK).
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

    isActive = false
    log(LogLevel.INFO, "ONNX Runtime shutdown complete")
  }
}
