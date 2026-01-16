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
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

// endregion Imports

/**
 * The CodBi's base class for all ONNX Runtime Model Implementations.
 *
 * This [AI] gets activated if the CodBi-Plugin-Property **Active_AI** contains **ONNX**
 * (case-insensitive).
 */
abstract class ONNX : AI() {
  companion object {
    /** Tracks if the ONNX Runtime Engine has been initialized. */
    private val initialized = AtomicBoolean(false)
  }

  /** Tracks if this specific instance is active. */
  protected var isActive = false

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

  /** Extracts ONNX Runtime native libraries from JAR to plugin directory. */
  private fun extractNativeLibraries(targetDir: File): Boolean {
    val os = System.getProperty("os.name").lowercase()
    val arch = System.getProperty("os.arch").lowercase()
    val libSuffix = if (os.contains("win")) ".dll" else if (os.contains("mac")) ".dylib" else ".so"

    val platformDir =
        when {
          os.contains("win") && arch.contains("64") -> "win-x86_64"
          os.contains("mac") && (arch.contains("aarch") || arch == "arm") -> "osx-aarch64"
          os.contains("mac") -> "osx-x86_64"
          arch.contains("aarch") || arch == "arm" -> "linux-aarch64"
          else -> "linux-x86_64"
        }

    val resourcePath = "/com/microsoft/onnxruntime/$platformDir"
    val libNames = listOf("onnxruntime", "onnxruntime4j_jni")

    if (targetDir.listFiles()?.any { it.name.endsWith(libSuffix) } == true) {
      log(LogLevel.INFO, "Native libraries already present in: ${targetDir.absolutePath}")
      return true
    }

    var extracted = false
    libNames.forEach { libName ->
      val fullLibName = "${libName}${libSuffix}"
      val resourceStream = this.javaClass.getResourceAsStream("$resourcePath/$fullLibName")

      if (resourceStream != null) {
        try {
          val targetFile = File(targetDir, fullLibName)
          resourceStream.use { input ->
            targetFile.outputStream().use { output -> input.copyTo(output) }
          }
          log(LogLevel.INFO, "Extracted $fullLibName to: ${targetDir.absolutePath}")
          extracted = true
        } catch (X: Exception) {
          log(LogLevel.ERROR, "Failed to extract $fullLibName: ${X.message}")
        }
      } else {
        log(LogLevel.WARNING, "Native library $fullLibName not found at $resourcePath in JAR")
      }
    }

    return extracted
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

    val activeAI = configData.properties.getProperty("Active_AI")?.lowercase() ?: ""

    if (!activeAI.contains("onnx")) {
      log(LogLevel.INFO, "ONNX not activated (Active_AI does not contain 'ONNX')")
      return
    }

    val aiRemove = configData.properties.getProperty("AI_Remove")?.lowercase() ?: ""
    if (aiRemove.contains("onnx")) {
      log(LogLevel.INFO, "ONNX marked for removal in AI_Remove")
      cleanupFiles(configData.fileHelper.pluginFolder)
      return
    }

    val pluginDir = File(configData.fileHelper.pluginFolder, "ai/onnx")
    nativeLibDir = File(pluginDir, "native")
    modelDir = File(pluginDir, "models")

    nativeLibDir?.mkdirs()
    modelDir?.mkdirs()

    if (!extractNativeLibraries(nativeLibDir!!)) {
      log(
          LogLevel.WARNING,
          "Could not extract native libraries from JAR, DJL will extract to temp directory")
    }

    if (!initEngine()) {
      log(LogLevel.ERROR, "Failed to initialize ONNX Runtime engine")
      return
    }

    isActive = true
    log(LogLevel.INFO, "ONNX Runtime initialized successfully")
  }

  /** Cleans up ONNX files when AI_Remove contains ONNX. */
  private fun cleanupFiles(pluginFolder: File) {
    val pluginDir = File(pluginFolder, "ai/onnx")
    if (pluginDir.exists()) {
      pluginDir.deleteRecursively()
      log(LogLevel.INFO, "Cleaned up ONNX files")
    }
  }

  /** Acquires a predictor from the pool. */
  protected fun <I, O> acquirePredictor(modelName: String): Predictor<I, O>? {
    @Suppress("UNCHECKED_CAST")
    val pool = predictorPools[modelName] as? LinkedBlockingQueue<Predictor<I, O>> ?: return null
    return pool.poll(30, TimeUnit.SECONDS)
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
      pool.forEach { it.close() }
      pool.clear()
    }
    predictorPools.clear()

    loadedModels.values.forEach { it.close() }
    loadedModels.clear()

    isActive = false
    log(LogLevel.INFO, "ONNX Runtime shutdown complete")
  }
}
