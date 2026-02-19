package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai

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

abstract class ONNX : AI() {
  companion object {
    /** Tracks if the ONNX Runtime Engine has been initialized globally in the JVM. */
    private val initialized = AtomicBoolean(false)

    /**
     * Upgrade auf 1.20.1 für IR 10 Support (Qwen2.5). WICHTIG: Das Maven-Artefakt heißt
     * 'onnxruntime4j'.
     */
    private const val defaultOrtVersion = "1.20.0"
  }

  protected var isActive = false
  private var keepNewest = 3
  protected var onnxMarkedForRemoval = false
  protected var nativeLibDir: File? = null
  protected var modelDir: File? = null

  protected val predictorPools = ConcurrentHashMap<String, LinkedBlockingQueue<Predictor<*, *>>>()
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
        log(LogLevel.WARNING, "Could not delete old native dir (locked): ${dir.absolutePath}")
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

  private fun resolveOnnxruntimeVersionFromClasspath(): String {
    val override = System.getProperty("codbi.onnxruntime.version")?.trim()
    if (!override.isNullOrEmpty() && override.lowercase() != "auto") return override
    return defaultOrtVersion
  }

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

  private fun ensureNativeLibrariesFromMaven(targetDir: File): Boolean {
    val platform = resolveOrtPlatform()
    val version = resolveOnnxruntimeVersionFromClasspath()

    // WICHTIG: Microsoft hat die JARs mit den DLLs ab 1.20.0 in 'onnxruntime4j' verschoben.
    // Das Basis-Paket 'onnxruntime' enthält keine Dateien mehr.
    val artifactId = "onnxruntime"
    val groupPath = "com/microsoft/onnxruntime"
    val repo = "https://repo.maven.apache.org/maven2"

    // Die korrekte URL für das JAR mit den DLLs
    val jarUrl = "$repo/$groupPath/$artifactId/$version/$artifactId-$version.jar"

    val nativeRootDir = targetDir.parentFile ?: targetDir
    val cacheDir = File(nativeRootDir, "maven-cache")
    cacheDir.mkdirs()

    val jarCache = File(cacheDir, "$artifactId-$version.jar")

    // Download-Logik
    if (!jarCache.exists() || jarCache.length() < 1000) { // Check auf korrekte Dateigröße
      try {
        log(LogLevel.INFO, "Downloading ONNXRuntime natives from: $jarUrl")
        downloadFile(jarUrl, jarCache)
      } catch (X: Exception) {
        log(LogLevel.ERROR, "Download failed for $jarUrl: ${X.message}")
        return false
      }
    }

    // Extraktion aus dem JAR
    // Pfad im JAR: ai/onnxruntime/native/win-x64/onnxruntime.dll
    val entries =
        listOf(
            "ai/onnxruntime/native/${platform.mavenPlatformDir}/${platform.ortLibName}" to
                File(targetDir, platform.ortLibName),
            "ai/onnxruntime/native/${platform.mavenPlatformDir}/${platform.jniLibName}" to
                File(targetDir, platform.jniLibName))

    return try {
      JarFile(jarCache).use { jar ->
        entries.forEach { (entryName, outFile) ->
          // Wir suchen den Eintrag (manchmal mit führendem Slash im JAR)
          val entry = jar.getJarEntry(entryName) ?: jar.getJarEntry("/$entryName")
          if (entry == null) {
            log(LogLevel.ERROR, "Entry $entryName not found in $jarUrl")
            return false
          }
          outFile.parentFile?.mkdirs()
          jar.getInputStream(entry).use { input ->
            outFile.outputStream().use { output -> input.copyTo(output) }
          }
        }
      }
      log(LogLevel.INFO, "Successfully extracted ONNX 1.20.0 natives.")
      true
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Extraction failed: ${X.message}")
      false
    }
  }

  protected fun initEngine(): Boolean {
    if (initialized.get()) {
      // Falls bereits initialisiert, setzen wir nur den Pfad für den aktuellen Run
      nativeLibDir?.let { System.setProperty("onnxruntime.native.path", it.absolutePath) }
      return true
    }

    val oldClassLoader = Thread.currentThread().contextClassLoader
    try {
      Thread.currentThread().contextClassLoader = this.javaClass.classLoader

      // Wir nutzen das Verzeichnis, das wir in initialize() erstellt haben
      nativeLibDir?.let {
        System.setProperty("onnxruntime.native.path", it.absolutePath)
        log(LogLevel.INFO, "Set onnxruntime.native.path to: ${it.absolutePath}")
      }

      // Engine registrieren (Klassen werden jetzt im JAR gefunden)
      if (!Engine.getAllEngines().contains("OnnxRuntime")) {
        Engine.registerEngine(OrtEngineProvider())
      }

      log(LogLevel.INFO, "ONNX Runtime engine registered: ${Engine.getAllEngines()}")
      initialized.set(true)
      return true
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Engine init failed: ${X.message}")
      return false
    } finally {
      Thread.currentThread().contextClassLoader = oldClassLoader
    }
  }

  override fun initialize(configData: IPluginInitializeData) {
    super.initialize(configData)

    isActive = false
    onnxMarkedForRemoval = false

    val activeAI = configData.properties.getProperty("Active_AI")?.lowercase() ?: ""
    if (!activeAI.contains("onnx")) return

    val aiRemove = configData.properties.getProperty("AI_Remove")?.lowercase() ?: ""
    if (aiRemove.contains("onnx")) {
      onnxMarkedForRemoval = true
      cleanupFiles(configData.fileHelper.pluginFolder)
      return
    }

    val pluginDir = File(configData.fileHelper.pluginFolder, "ai/onnx")
    val nativeRootDir = File(pluginDir, "native")
    val nativeRunDir = File(nativeRootDir, "run-${System.currentTimeMillis()}")

    this.nativeLibDir = nativeRunDir
    this.modelDir = File(pluginDir, "models")

    nativeRunDir.mkdirs()
    modelDir?.mkdirs()

    val djlCache = File(pluginDir, "djl-cache")
    djlCache.mkdirs()
    System.setProperty("djl.cache.dir", djlCache.absolutePath)

    keepNewest = configData.properties.getProperty("AI_ONNX_NativeTempToKeep")?.toIntOrNull() ?: 3
    purgeOldNativeRunDirs(nativeRootDir, keepNewest)

    try {
      if (ensureNativeLibrariesFromMaven(nativeRunDir)) {
        if (initEngine()) {
          isActive = true
          log(LogLevel.INFO, "ONNX Runtime initialized successfully")
        }
      }
    } catch (X: Throwable) {
      log(LogLevel.ERROR, "ONNX setup failed", "", X)
    }
  }

  protected fun onnxIsReady(): Boolean = isActive

  private fun cleanupFiles(pluginFolder: File) {
    listOf("ai/onnx", "ai/tokenizers", "ai/djl-cache").forEach { path ->
      val dir = File(pluginFolder, path)
      if (dir.exists()) {
        dir.deleteRecursively()
        log(LogLevel.INFO, "Cleaned up: $path")
      }
    }
  }

  protected fun <I, O> acquirePredictor(modelName: String): Predictor<I, O>? {
    @Suppress("UNCHECKED_CAST")
    val pool = predictorPools[modelName] as? LinkedBlockingQueue<Predictor<I, O>> ?: return null
    return pool.poll(60, TimeUnit.SECONDS) // Qwen braucht länger zum Freigeben
  }

  protected fun <I, O> releasePredictor(modelName: String, predictor: Predictor<I, O>) {
    @Suppress("UNCHECKED_CAST")
    val pool = predictorPools[modelName] as? LinkedBlockingQueue<Predictor<I, O>> ?: return
    pool.offer(predictor)
  }

  override fun shutdown(shutdownData: IPluginShutdownData?) {
    super.shutdown(shutdownData)
    predictorPools.values.forEach { pool ->
      pool.forEach { runCatching { it.close() } }
      pool.clear()
    }
    predictorPools.clear()
    loadedModels.values.forEach { runCatching { it.close() } }
    loadedModels.clear()
    isActive = false
  }

  override fun log(importance: LogLevel, toLog: String, adjenct: String, exception: Throwable?) {
    super.idLogMessages = "ONNX"
    super.log(importance, toLog, adjenct, exception)
  }
}
