package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai

// region Imports
import ai.djl.engine.Engine
import ai.djl.inference.Predictor
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

// endregion Imports

/**
 * # Base class for all CodBi PyTorch model implementations.
 *
 * ## Lifecycle / plugin properties
 * - **Automatic download + init**: If `Active_AI` contains **pytorch** (case-insensitive),
 *   [initialize] prepares the plugin directories, provisions native libraries (LibTorch), and
 *   registers the DJL PyTorch engine.
 * - **Removal / cleanup**: If `AI_Remove` contains **pytorch** (case-insensitive), [initialize]
 *   deletes **all** PyTorch-related files under `pluginRoot/ai/pytorch/` (models + natives +
 *   caches) and the PyTorch runtime is **not** initialized.
 *
 * ## Download sources (URLs / endpoints)
 * This class downloads the official DJL PyTorch engine and native libraries from:
 * - **https://repo1.maven.org/maven2** — DJL PyTorch engine JARs
 * - **https://publish.djl.ai** — LibTorch native libraries (fallback)
 *
 * ## Caching / "no re-download"
 * The downloaded runtimes are cached so that **no files are downloaded again** as long as they're
 * **not** cleaned up putting **pytorch** (case-insensitive) in **AI_Remove**.
 *
 * ## Approx. resources (very rough)
 * - **Disk** : ~300–700 MB cached LibTorch natives + model files
 * - **CPU/RAM** : ~500 MB–2 GB RAM depending on model size
 *
 * ### DSGVO, EU-AI ACT & technical Advantages
 * Same advantages as [ONNX] — data never leaves the machine, processing stays within the plugin
 * runtime. See [AI] for details.
 */
abstract class PyTorch : AI() {
  companion object {
    /** Tracks if the PyTorch Engine has been initialized JVM-wide. */
    private val initialized = AtomicBoolean(false)

    /**
     * Default LibTorch version. Must match the `pytorch-native-*` artifact version from DJL BOM.
     *
     * DJL 0.36.0 ships with LibTorch 2.7.1.
     */
    private const val defaultLibTorchVersion = "2.7.1"

    /** DJL engine version. Must match the `pytorch-engine` artifact version (same as BOM). */
    private const val defaultDjlVersion = "0.36.0"
  }

  /** Tracks if this specific instance is active. */
  protected var isActive = false

  /** Tracks if PyTorch is marked for removal via **AI_Remove**. */
  protected var pytorchMarkedForRemoval = false

  /** The directory where PyTorch native libraries are stored. */
  protected var nativeLibDir: File? = null

  /** The directory where PyTorch model files are stored. */
  protected var modelDir: File? = null

  /** Pool of predictors for concurrent inference. */
  protected val predictorPools = ConcurrentHashMap<String, LinkedBlockingQueue<Predictor<*, *>>>()

  /** Loaded models. */
  protected val loadedModels = ConcurrentHashMap<String, ZooModel<*, *>>()

  /** The number of sets of native library run dirs to keep for race-condition safety. */
  private var keepNewest = 3

  init {
    idLogMessages = "PyTorch"
  }

  // ── Native library provisioning ────────────────────────────────────────────

  /**
   * Represents platform-specific details for PyTorch native libraries.
   *
   * @property djlClassifier The Maven classifier for pyTorch native JARs (e.g. "win-x86_64").
   * @property libNames The shared library file names expected after extraction.
   */
  private data class PtPlatform(val djlClassifier: String, val libNames: List<String>)

  /** Determines the proper [PtPlatform] corresponding to the server's OS and architecture. */
  private fun resolvePtPlatform(): PtPlatform {
    val os = System.getProperty("os.name").lowercase()
    val arch = System.getProperty("os.arch").lowercase()

    return when {
      os.contains("win") && arch.contains("64") ->
          PtPlatform("win-x86_64", listOf("torch_cpu.dll", "c10.dll", "fbgemm.dll", "asmjit.dll"))
      os.contains("mac") && (arch.contains("aarch") || arch == "arm") ->
          PtPlatform("osx-aarch64", listOf("libtorch_cpu.dylib", "libc10.dylib"))
      os.contains("mac") -> PtPlatform("osx-x86_64", listOf("libtorch_cpu.dylib", "libc10.dylib"))
      arch.contains("aarch") || arch == "arm" ->
          PtPlatform("linux-aarch64", listOf("libtorch_cpu.so", "libc10.so"))
      else -> PtPlatform("linux-x86_64", listOf("libtorch_cpu.so", "libc10.so"))
    }
  }

  /**
   * Removes old temporary native library directories, keeping only the [keepNewest] most recent.
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
   * Downloads a file from the specified URL to the target file location.
   *
   * @param url The URL to download from.
   * @param targetFile The file to write the downloaded content to.
   */
  protected fun downloadFile(url: String, targetFile: File) {
    targetFile.parentFile?.mkdirs()
    URI(url)
        .toURL()
        .openConnection()
        .apply {
          connectTimeout = 15_000
          readTimeout = 600_000
          setRequestProperty("User-Agent", "CodBi-PyTorch/1.0")
        }
        .getInputStream()
        .use { input -> targetFile.outputStream().use { output -> input.copyTo(output) } }
  }

  /**
   * Ensures PyTorch native libraries are available. DJL's PyTorch engine handles native library
   * downloading automatically when the engine is first used. We configure the cache directory so
   * that download location is stable across hot reloads.
   *
   * If the Maven dependencies include `pytorch-native-cpu` as `provided` scope, we rely on DJL's
   * built-in download mechanism which caches LibTorch under the DJL cache directory.
   *
   * @param djlCacheDir The DJL cache directory where natives are stored.
   * @return `true` if the setup succeeded.
   */
  private fun ensureNativeLibraries(djlCacheDir: File): Boolean {
    try {
      // DJL handles LibTorch downloading automatically when the engine is first used.
      // We just ensure the cache directory is properly configured.
      djlCacheDir.mkdirs()
      System.setProperty("DJL_CACHE_DIR", djlCacheDir.absolutePath)
      System.setProperty("ENGINE_CACHE_DIR", djlCacheDir.absolutePath)

      // For offline mode, set PYTORCH_LIBRARY_PATH if natives are pre-provisioned
      val preProvisionedDir = File(djlCacheDir, "pytorch-native")
      if (preProvisionedDir.exists() && preProvisionedDir.isDirectory) {
        System.setProperty("PYTORCH_LIBRARY_PATH", preProvisionedDir.absolutePath)
        log(LogLevel.INFO, "Using pre-provisioned LibTorch from: ${preProvisionedDir.absolutePath}")
      }

      log(
          LogLevel.INFO,
          "PyTorch native libraries will be provisioned from DJL cache: ${djlCacheDir.absolutePath}")
      return true
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Failed to configure PyTorch native libraries: ${X.message}", "", X)
      return false
    }
  }

  // ── Engine initialization ──────────────────────────────────────────────────

  /**
   * Initializes the PyTorch engine via DJL.
   *
   * @return `true` if initialization was successful.
   */
  protected fun initEngine(): Boolean {
    if (initialized.get()) return true

    try {
      val oldClassLoader = Thread.currentThread().contextClassLoader

      try {
        Thread.currentThread().contextClassLoader = this.javaClass.classLoader

        // DJL PyTorch engine auto-discovers and registers itself via ServiceLoader.
        // If it's not available yet, register it explicitly.
        if (!Engine.getAllEngines().contains("PyTorch")) {
          try {
            // The PyTorch engine provider registers itself via META-INF/services
            val ptProvider =
                Class.forName("ai.djl.pytorch.engine.PtEngineProvider")
                    .getDeclaredConstructor()
                    .newInstance() as ai.djl.engine.EngineProvider
            Engine.registerEngine(ptProvider)
          } catch (e: ClassNotFoundException) {
            log(
                LogLevel.ERROR,
                "PyTorch engine provider not found on classpath. " +
                    "Ensure ai.djl.pytorch:pytorch-engine is in your dependencies.",
                "",
                e)
            return false
          }
        }

        log(
            LogLevel.INFO,
            "PyTorch engine registered, available engines: ${Engine.getAllEngines()}")

        // Pre-initialize HuggingFace Tokenizers (Rust) under plugin classloader
        try {
          Class.forName("ai.djl.huggingface.tokenizers.jni.LibUtils")
          log(LogLevel.INFO, "Tokenizers (Rust) engine initialized/checked.")
        } catch (_: ClassNotFoundException) {
          // Module not present — not required for all models
        } catch (e: Throwable) {
          log(LogLevel.WARNING, "Failed to pre-initialize Tokenizers (Rust) engine: ${e.message}")
        }

        initialized.set(true)
        return true
      } finally {
        Thread.currentThread().contextClassLoader = oldClassLoader
      }
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Failed to initialize PyTorch engine: ${X.message}")
      X.printStackTrace()
      return false
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Initializes PyTorch Runtime if **Active_AI** contains **pytorch**.
   *
   * @param configData The initialization data provided by the plugin framework.
   */
  override fun initialize(configData: IPluginInitializeData) {
    super.initialize(configData)

    // Reset state for hot-reload safety
    isActive = false
    pytorchMarkedForRemoval = false
    nativeLibDir = null
    modelDir = null

    val activeAI = configData.properties.getProperty("Active_AI")?.lowercase() ?: ""

    if (!activeAI.contains("pytorch")) {
      log(LogLevel.INFO, "PyTorch not activated (Active_AI does not contain 'pytorch')")
      return
    }

    val aiRemove = configData.properties.getProperty("AI_Remove")?.lowercase() ?: ""

    if (aiRemove.contains("pytorch")) {
      log(LogLevel.INFO, "PyTorch marked for removal in AI_Remove")
      pytorchMarkedForRemoval = true
      cleanupFiles(configData.fileHelper.pluginFolder)
      return
    }

    val pluginDir = File(configData.fileHelper.pluginFolder, "ai/pytorch")

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

    keepNewest =
        configData.properties.getProperty("AI_PyTorch_NativeTempToKeep")?.toIntOrNull() ?: 3
    purgeOldNativeRunDirs(nativeRootDir, keepNewest)

    try {
      if (!ensureNativeLibraries(djlCache)) {
        return
      }

      if (!initEngine()) {
        return
      }

      isActive = true
      log(LogLevel.INFO, "PyTorch Runtime initialized successfully")
    } catch (X: Throwable) {
      log(LogLevel.ERROR, "PyTorch setup failed: ${X.message}", "", X)
    }
  }

  /** Determines whether the PyTorch runtime is active and ready for use. */
  protected fun pytorchIsReady(): Boolean = isActive

  /** Cleans up PyTorch files when AI_Remove contains pytorch. */
  private fun cleanupFiles(pluginFolder: File) {
    val pytorchDir = File(pluginFolder, "ai/pytorch")
    if (pytorchDir.exists()) {
      pytorchDir.deleteRecursively()
      log(LogLevel.INFO, "Cleaned up PyTorch files")
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

  // ── Predictor pool management ──────────────────────────────────────────────

  /**
   * Acquires a predictor from the pool (blocking, 30s timeout).
   *
   * @param modelName The name of the model to acquire a predictor for.
   * @return A [Predictor] instance, or `null` if none could be acquired within 30 seconds.
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
   * Non-blocking variant of [acquirePredictor]. Returns a predictor immediately if one is idle, or
   * `null` without waiting.
   *
   * @param modelName The name of the model to acquire a predictor for.
   * @return A [Predictor] instance, or `null` if none is currently available.
   */
  protected fun <I, O> tryAcquirePredictor(modelName: String): Predictor<I, O>? {
    @Suppress("UNCHECKED_CAST")
    val pool = predictorPools[modelName] as? LinkedBlockingQueue<Predictor<I, O>> ?: return null
    return pool.poll()
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

  // ── Shutdown ───────────────────────────────────────────────────────────────

  /** Shuts down PyTorch Runtime and releases resources. */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    super.shutdown(shutdownData)

    // Close all predictors
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

    // Close loaded models
    loadedModels.values.forEach {
      try {
        it.close()
      } catch (X: IllegalStateException) {
        log(LogLevel.WARNING, "Model close failed (ignored): ${X.message}", "", X)
      } catch (X: Exception) {
        log(LogLevel.WARNING, "Model close failed (ignored): ${X.message}", "", X)
      }
    }
    loadedModels.clear()

    // Try to delete temporary native libraries
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
    log(LogLevel.INFO, "PyTorch Runtime shutdown complete")
  }

  // ── Logging ────────────────────────────────────────────────────────────────

  override fun log(importance: LogLevel, toLog: String, adjenct: String, exception: Throwable?) {
    super.idLogMessages = "PyTorch"
    super.log(importance, toLog, adjenct, exception)
  }
}
