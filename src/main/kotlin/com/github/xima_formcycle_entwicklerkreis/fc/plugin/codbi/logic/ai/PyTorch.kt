package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai

// region Imports
// region DJL
// endregion DJL
// region XIMA
// endregion XIMA
import ai.djl.engine.Engine
import ai.djl.inference.Predictor
import ai.djl.pytorch.engine.PtEngineProvider
import ai.djl.repository.zoo.Criteria
import ai.djl.repository.zoo.ZooModel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI.LogLevel
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeValidationResult
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginValidationData
import java.io.File
import java.io.FileOutputStream
import java.net.URI
import java.net.URL
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.jar.JarFile

// endregion Imports
/**
 * The CodBi's base class for all PyTorch Model Implementations. Handles **Native Library loading**,
 * **Model file downloading**, and **Predictor Pooling**. PyTorch's native libraries consume about
 * **300MB** of the server's RAM.
 *
 * This [AI] gets activated if the CodBi-Plugin-Property **Active_AI** contains **PyTorch** meaning
 * that any subsequent keywords like e.g. **DONUT** will have no effect if the mentioned property
 * does not also include **PyTorch**.
 *
 * @param I The Input type for the model (e.g. **[Pair] < [Image], [String] >**)
 * @param O The Output type for the model (e.g. **[String]**)
 */
abstract class PyTorch<I, O> : AI() {
  /**
   * Companion object to store models shared across all PyTorch instances. Models are stored by
   * their derived class type, so all instances of the same derived class (e.g., DonutDocVQA) share
   * the same model, but different derived classes have separate models.
   */
  companion object {
    /**
     * Thread-safe map storing loaded models by their derived class type.
     * - **Key**: Class <*> (the derived class type, e.g., DonutDocVQA::class.java)
     * - **Value**: ZooModel <*, *> (stored as Any? due to type erasure)
     */
    private val sharedModels = ConcurrentHashMap<Class<*>, Any?>()

    /**
     * Gets a shared model by the derived class type.
     *
     * @param clazz The class type of the derived PyTorch class.
     * @return The model if found, null otherwise.
     */
    @Suppress("UNCHECKED_CAST")
    fun <I, O> getSharedModel(clazz: Class<*>): ZooModel<I, O>? {
      return sharedModels[clazz] as? ZooModel<I, O>
    }

    /**
     * Stores a model in the shared registry.
     *
     * @param clazz The class type of the derived PyTorch class.
     * @param model The model to store.
     */
    fun <I, O> setSharedModel(clazz: Class<*>, model: ZooModel<I, O>) {
      sharedModels[clazz] = model
    }

    /**
     * Checks if a model is already loaded in the shared registry for a given class type.
     *
     * @param clazz The class type of the derived PyTorch class.
     * @return true if the model is loaded, false otherwise.
     */
    fun isModelShared(clazz: Class<*>): Boolean {
      return sharedModels.containsKey(clazz) && sharedModels[clazz] != null
    }

    /**
     * Removes a model from the shared registry.
     *
     * @param clazz The class type of the derived PyTorch class.
     */
    fun removeSharedModel(clazz: Class<*>) {
      sharedModels.remove(clazz)
    }

    /** Clears all shared models from the registry. */
    fun clearSharedModels() {
      sharedModels.clear()
    }
  }

  /** States whether this [AI] has already been initialized. */
  protected val initialized = AtomicBoolean(false)
  /** The model used. */
  protected var model: ZooModel<I, O>? = null
  /** A [LinkedBlockingQueue] of [Predictor]s to use by the implementing class. */
  public val pool = LinkedBlockingQueue<Predictor<I, O>>()
  /**
   * Determines the [pool]'s size (defaults to 2). About 40MB of inference memory are consumed by
   * each predictor to consider.
   * - May be set by Plugin-Property **Pool_Size_PyTorch**.
   */
  private var poolSize: Int = 2
  /**
   * Specifies the number of threads (where each thread uses one cpu core) that PyTorch may use
   * concurrently. This value is used to set the **ai.djl.pytorch.num_threads** system property.
   */
  private var concurrentThreads = 1
  /**
   * The name of the model to acquire, if necessary (e.g.
   * **naver-clova-ix/donut-base-finetuned-docvqa**)
   */
  abstract val modelName: String
  /** The base URL pointing to the online resource holding the model data. */
  abstract val resModelBaseURL: String
  /**
   * The list of files to download from the repository (specified by [resModelFiles]) needed for the
   * model to run, if they're not already present.
   */
  abstract val resModelFiles: List<String>
  /**
   * The URL pointing to the .JARs to download, if needed, containing the **PyTorch** native
   * libraries.
   * - The URL to the PyTorch-JAR may be changed by specifying the Plugin-Property
   *   **AI_PyTorch_LibURL**. Default to:
   *   "https://repo1.maven.org/maven2/ai/djl/pytorch/pytorch-native-cpu/2.7.1/pytorch-native-cpu-2.7.1-win-x86_64.jar".
   */
  private var urlPyTorchNatives =
      "https://repo1.maven.org/maven2/ai/djl/pytorch/pytorch-native-cpu/2.7.1/pytorch-native-cpu-2.7.1-win-x86_64.jar"
  /**
   * The URL pointing to the .JARs to download, if needed, containing the **DJL** native libraries.
   * - The URL to the JNI-JAR may be changed by specifying the Plugin-Property
   *   **AI_PyTorch_JNIURL**. Default to:
   *   "https://repo1.maven.org/maven2/ai/djl/pytorch/pytorch-jni/2.7.1-0.36.0/pytorch-jni-2.7.1-0.36.0.jar".
   */
  private var urlJNINatives =
      "https://repo1.maven.org/maven2/ai/djl/pytorch/pytorch-jni/2.7.1-0.36.0/pytorch-jni-2.7.1-0.36.0.jar"

  /**
   * Builds the definition on how the model interprets it's data.
   *
   * @param modelDir The directory where model files reside.
   * @return The requested [Criteria].
   */
  abstract fun buildCriteria(modelDir: File): Criteria<I, O>

  /**
   * Updates the [poolSize].
   *
   * @param configData Provided by the **Formcycle** environment.
   */
  override fun validateConfigurationData(
      configData: IPluginValidationData
  ): IPluginInitializeValidationResult? {
    // region Get Plugin-Properties
    poolSize = configData.properties.getProperty("Pool_Size_PyTorch")?.toInt() ?: 2
    urlPyTorchNatives =
        configData.properties.getProperty("AI_PyTorch_LibURL")
            ?: "https://repo1.maven.org/maven2/ai/djl/pytorch/pytorch-native-cpu/2.7.1/pytorch-native-cpu-2.7.1-win-x86_64.jar"
    urlJNINatives =
        configData.properties.getProperty("AI_PyTorch_JNIURL")
            ?: "https://repo1.maven.org/maven2/ai/djl/pytorch/pytorch-jni/2.7.1-0.36.0/pytorch-jni-2.7.1-0.36.0.jar"
    // endregion Get Plugin-Properties
    return null
  }

  /**
   * Initializes the **Pytorch-Engine** by setting up the necessary environmental variables,
   * downloading the native runtimes for appropriate for the os the server runs on (supporting
   * **Windows**, **Linux** & **MacOS**) and managing class loader switching for appropriate
   * resource discovery.
   *
   * @param configData Provided by the **Formcycle** environment.
   */
  override fun initialize(configData: IPluginInitializeData) {
    if (configData.properties.getProperty("Active_AI")?.contains("PyTorch") == false) return
    if (initialized.get()) return
    // region Get Plugin-Properties
    poolSize = configData.properties.getProperty("Pool_Size_PyTorch")?.toInt() ?: 2
    urlPyTorchNatives =
        configData.properties.getProperty("AI_PyTorch_LibURL")
            ?: "https://repo1.maven.org/maven2/ai/djl/pytorch/pytorch-native-cpu/2.7.1/pytorch-native-cpu-2.7.1-win-x86_64.jar"
    urlJNINatives =
        configData.properties.getProperty("AI_PyTorch_JNIURL")
            ?: "https://repo1.maven.org/maven2/ai/djl/pytorch/pytorch-jni/2.7.1-0.36.0/pytorch-jni-2.7.1-0.36.0.jar"
    // endregion Get Plugin-Properties
    super.initialize(configData)

    log(LogLevel.INFO, "Initializing PyTorch Engine.")
    setupNativeEnvironment(configData.fileHelper.pluginFolder)
    // region Acquire model, if necessary.
    val modelDir = File(configData.fileHelper.pluginFolder, "ai/pytorch/models/$modelName")

    if (!modelDir.exists()) modelDir.mkdirs()
    if (!modelDir.exists()) log(LogLevel.INFO, "Creating Model directory \"$modelDir\" failed.")

    log(LogLevel.INFO, "Model directory is: $modelDir")
    ensureModelFiles(modelDir)
    // endregion Acquire model, if necessary.
    // region Acquire Model from companion, if available.
    // Check if model is already loaded in shared registry for this derived class type
    val sharedModel = getSharedModel<I, O>(this.javaClass)

    if (sharedModel != null) {
      log(
          LogLevel.INFO,
          "Model for class ${this.javaClass.simpleName} found in companion. Reusing existing model.")

      this.model = sharedModel
      // Fill pool if empty
      if (pool.isEmpty()) {
        log(LogLevel.INFO, "Filling pool with $poolSize predictor(s) from shared model")

        repeat(poolSize) {
          val predictor = model?.newPredictor()

          if (predictor != null) {
            pool.offer(predictor)

            log(LogLevel.INFO, "Added new predictor ($predictor) to the pool")
          }
        }
      }

      initialized.set(true)
      log(
          LogLevel.INFO,
          "The \"$modelName\" (class ${this.javaClass.simpleName}) was initialized successfully using shared model with pool size of ${pool.size}.")

      return
    }
    // endregion Acquire Model from companion, if available.
    // region Load Model
    log(LogLevel.INFO, "Model is not available in companion. Creating new model.")

    val criteria = buildCriteria(modelDir)

    log(
        LogLevel.INFO,
        "Criteria build successfully:\r\nModel: ${ criteria.modelName }\r\nFile: ${ criteria.options["model_file"]}\r\n")

    try {
      // region Switch classloader
      val oldClassLoader = Thread.currentThread().contextClassLoader

      Thread.currentThread().contextClassLoader = this.javaClass.classLoader
      // endregion Switch classloader
      this.model = criteria.loadModel()

      // Store model in shared registry for reuse by other instances of the same derived class
      if (this.model != null) {
        setSharedModel(this.javaClass, this.model!!)
        log(
            LogLevel.INFO,
            "Model for class ${this.javaClass.simpleName} stored in shared registry for reuse by other instances of this class.")
      }

      log(LogLevel.INFO, "Filling pool with $poolSize predictor(s)")
      // region Fill pool
      repeat(poolSize) {
        val predictor = model?.newPredictor()

        if (predictor != null) {
          pool.offer(predictor)

          log(LogLevel.INFO, "Added new predictor ($predictor) to the pool")
        }
      }
      // endregion Fill pool
      Thread.currentThread().contextClassLoader = oldClassLoader

      initialized.set(true)

      log(
          LogLevel.INFO,
          "The \"$modelName\" was initialized successfully with pool a size of $poolSize.")
    } catch (X: Exception) {
      // Check if the exception message indicates an already-loaded library
      val errorMessage = X.message ?: ""
      if (errorMessage.contains("already loaded", ignoreCase = true) ||
          errorMessage.contains("already loaded in another classloader", ignoreCase = true)) {
        log(LogLevel.INFO, "Library already loaded (this is normal): ${ X.message }")

        if (!initialized.get())
            log(LogLevel.WARNING, "Model initialization may have failed: $modelName")
      } else
          log(LogLevel.ERROR, "Failed to load model $modelName cause: $X / ${X.printStackTrace()}")
    }
    // endregion Load Model
  }

  /**
   * Performs a prediction using a [Predictor] from the [pool] giving up after the specified
   * **timeout** which defaults to 30 seconds.
   *
   * @param input The [I]nput to predict on.
   * @param timeout The number of seconds to wait for a [Predictor] from the [pool] before giving up
   *   (default to 30 seconds.
   * @return The resulting [O]utput.
   */
  fun predict(input: I, timeout: Long = 30): O {
    log(LogLevel.INFO, "Starting prediction (runtime initialized: ${initialized.get()})")
    log(LogLevel.INFO, "Retrieving predictor from pool (current size: ${pool.size})")

    val predictor = pool.poll(timeout, TimeUnit.SECONDS) ?: null

    if (predictor == null) {
      log(LogLevel.INFO, "Timeout in retrieving predictor ($timeout seconds) surpassed")

      throw IllegalStateException("Timeout in retrieving predictor ($timeout seconds) surpassed")
    }

    log(LogLevel.INFO, "Predicting")

    return try {
      predictor.predict(input)
    } finally {
      pool.offer(predictor)

      log(LogLevel.INFO, "Finished prediction and released predictor to the pool")
    }
  }

  /**
   * Gets the shared model from the registry if available. This will return the model shared by all
   * instances of this derived class.
   *
   * @return The shared model if found, null otherwise.
   */
  fun getSharedModel(): ZooModel<I, O>? = getSharedModel<I, O>(this.javaClass)

  /**
   * Clears the [pool] and sets [initialized] to **false**. If the model is shared, it will not be
   * closed (other instances may be using it).
   *
   * @param shutdownData Provided by the Formcycle environment.
   */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    super.shutdown(shutdownData)

    while (pool.isNotEmpty()) pool.poll()?.close()

    val isShared = isModelShared(this.javaClass)

    if (isShared)
        log(
            LogLevel.INFO,
            "Model for class ${this.javaClass.simpleName} is shared. Not closing to preserve for other instances of this class.")
    else model?.close()

    model = null

    initialized.set(false)
  }

  /**
   * Checks whether the [resModelFiles] are already present downloading them, if not.
   *
   * @param targetDir The absolute path to the directory to download the model files to.
   */
  private fun ensureModelFiles(targetDir: File) {
    if (!targetDir.exists()) targetDir.mkdirs()

    resModelFiles.forEach { name ->
      val targetFile = File(targetDir, name)

      if (!targetFile.exists()) {
        println("Downloading $name to ${targetFile.absolutePath}...")

        try {
          URI("$resModelBaseURL/$name").toURL().openStream().use { input ->
            FileOutputStream(targetFile).use { output -> input.copyTo(output) }
          }
        } catch (X: Exception) {
          log(LogLevel.INFO, "Failed to download $name cause: $X")
        }
      }
    }
  }

  /**
   * Sets the **DJL** & **PyTorch** properties as needed. Downloads and extracts the proper native
   * libraries according to the Server's OS into the needed directories (just as Maven would have if
   * the scope was **compile**).
   *
   * @param pluginFolder The plugin's folder on the server.
   */
  private fun setupNativeEnvironment(pluginFolder: File) {
    System.setProperty("PYTORCH_VERSION", "2.7.1")
    System.setProperty("ai.djl.pytorch.version", "2.7.1")
    System.setProperty("ai.djl.pytorch.num_interop_threads", "1")
    System.setProperty("ai.djl.pytorch.num_threads", "1")
    System.setProperty("ai.djl.huggingface.tokenizers.version", "0.31.0")

    val osStr =
        if (System.getProperty("os.name").lowercase().contains("win")) "win-x86_64"
        else "linux-x86_64"
    val baseDir = pluginFolder.resolve("plugin/root")
    val pytorchDir = baseDir.resolve("pytorch/cpu/$osStr")
    val jnilibDir = baseDir.resolve("jnilib/$osStr/cpu")
    val nativeLibDir = baseDir.resolve("native/lib/$osStr/cpu")
    val propertiesDir = baseDir.resolve("native/lib")
    val nativePath = pytorchDir.absolutePath

    System.setProperty("ai.djl.pytorch.nostack", "true")
    System.setProperty("ai.djl.pytorch.library_path", nativePath)
    System.setProperty("PYTORCH_LIBRARY_PATH", nativePath)
    System.setProperty("ai.djl.pytorch.native_helper_path", nativePath)
    System.setProperty(
        "ai.djl.cache_dir", pluginFolder.resolve("ai/pytorch/.djl-cache").absolutePath)

    log(LogLevel.INFO, "Set PyTorch library path to: $nativePath")

    val oldClassLoader = Thread.currentThread().contextClassLoader

    try {
      EngineLoader(this::log, listOf(urlPyTorchNatives, urlJNINatives))
          .ensureNativesExist(pytorchDir, jnilibDir, nativeLibDir, propertiesDir, "2.7.1")
      EngineLoader(this::log, listOf(urlPyTorchNatives, urlJNINatives))
          .ensureTokenizersNativesExist(nativeLibDir, propertiesDir, "0.31.0")
      cleanupNonPlatformLibraries(pytorchDir)
      cleanupNonPlatformLibraries(jnilibDir)
      cleanupNonPlatformLibraries(nativeLibDir)

      val allDirs = listOf(pytorchDir, jnilibDir, nativeLibDir)

      allDirs.forEach { dir ->
        val libFiles =
            dir.listFiles { file ->
              file.isFile &&
                  (file.name.endsWith(".dll") ||
                      file.name.endsWith(".so") ||
                      file.name.endsWith(".dylib"))
            } ?: emptyArray()

        log(LogLevel.INFO, "Found ${libFiles.size} libraries in ${dir.name}:")

        libFiles.forEach { log(LogLevel.INFO, "  - ${it.name}") }
      }
    } finally {
      Thread.currentThread().contextClassLoader = oldClassLoader
    }

    val pathSeparator = File.pathSeparator
    val currentPath = System.getProperty("java.library.path") ?: ""
    val pathsToAdd = listOf(pytorchDir, jnilibDir, nativeLibDir).map { it.absolutePath }
    val newPath =
        (currentPath.split(pathSeparator).toSet() + pathsToAdd).joinToString(pathSeparator)

    System.setProperty("java.library.path", newPath)

    try {
      if (!Engine.getAllEngines().contains("PyTorch")) {
        Engine.registerEngine(PtEngineProvider())

        log(LogLevel.INFO, "PyTorch engine registered successfully")
      }
    } catch (X: Exception) {
      val errorMessage = X.message ?: ""

      if (errorMessage.contains("already loaded", ignoreCase = true) ||
          errorMessage.contains("already loaded in another classloader", ignoreCase = true)) {
        log(LogLevel.INFO, "Library already loaded (this is normal): ${ X.message }")
      } else {
        log(LogLevel.ERROR, "Failed to register PyTorch Engine: ${ X.message }")

        throw X
      }
    }
  }

  /**
   * Removes libraries that're not destined for the server's OS.
   *
   * @param nativesDir The directory to clean containing the native libraries.
   */
  private fun cleanupNonPlatformLibraries(nativesDir: File) {
    val isWindows = System.getProperty("os.name").lowercase().contains("win")
    val isMac = System.getProperty("os.name").lowercase().contains("mac")
    val extensionsToDelete =
        when {
          isWindows -> listOf(".so", ".dylib")
          isMac -> listOf(".dll", ".so")
          else -> listOf(".dll", ".dylib")
        }

    nativesDir.listFiles()?.forEach { file ->
      if (file.isFile) {
        val fileName = file.name.lowercase()
        val isNonPlatform =
            extensionsToDelete.any { ext -> fileName.endsWith(ext, ignoreCase = true) }

        if (isNonPlatform) {
          val deleted = file.delete()

          if (deleted) log(LogLevel.INFO, "Removed non-platform library: ${ file.name }")
        }
      }
    }
  }

  /**
   * Sets the [idLogMessages] prior to [AI.log]ging.
   *
   * @param importance See [AI.log].
   * @param toLog See [AI.log].
   */
  override fun log(importance: LogLevel, toLog: String) {
    super.idLogMessages = "PyTorch"

    super.log(importance, toLog)
  }
}

/**
 * The class managing the loading and extraction of the **PyTorch**-Engine files.
 *
 * @param log The [PyTorch.log]ger to use.
 * @param libURLs The [List] <[PyTorch.urlPyTorchNatives],[PyTorch.urlJNINatives]>.
 */
class EngineLoader(
    private val log: (importance: LogLevel, toLog: String) -> Unit,
    libURLs: List<String>
) {
  /** The **libURLs** passed to the constructor. */
  private val pytorchLibUrls = libURLs

  /**
   * Ensures that the plugin's folder contains all libraries files within the proper directories for
   * the **PyTorch-Engine** to run.
   *
   * @param pytorchDir The directory where files that don't match the JAR-Structure shall reside.
   * @param jnilibDir The directory where the JNI libraries shall reside.
   * @param nativeLibDir The directory where the native libraries shall reside.
   * @param propertiesDir The directory where the **.properties** files shall reside.
   */
  fun ensureNativesExist(
      pytorchDir: File,
      jnilibDir: File,
      nativeLibDir: File,
      propertiesDir: File,
      version: String
  ) {
    // region Create directories
    pytorchDir.mkdirs()
    jnilibDir.mkdirs()
    nativeLibDir.mkdirs()
    propertiesDir.mkdirs()
    // endregion Create directories
    val checkFile = File(pytorchDir, if (isWindows()) "torch.dll" else "libtorch.so")

    if (checkFile.exists()) return

    val osStr = if (isWindows()) "win-x86_64" else "linux-x86_64"
    val tempDir =
        File(System.getProperty("java.io.tmpdir"), "pytorch-extract-${ System.currentTimeMillis()}")

    tempDir.mkdirs()

    try {
      pytorchLibUrls.forEach { urlStr ->
        val url = URL(urlStr)
        val fileName = urlStr.substringAfterLast("/")
        val targetFile = File(tempDir, fileName)

        if (!targetFile.exists()) {
          println("Downloading $fileName...")
          url.openStream().use { input ->
            Files.copy(input, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
          }
        }
        log(
            LogLevel.INFO,
            "Downloaded following native library $fileName from $urlStr. Now extracting...")
        extractNativeLibs(targetFile, pytorchDir, jnilibDir, nativeLibDir, propertiesDir)
      }
    } finally {
      // Cleanup temp directory
      tempDir.deleteRecursively()
    }
    /*try {
        targetDir.mkdirs()
        URL(downloadUrl).openStream().use { input ->
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
        log(AI.LogLevel.ERROR,"Download failed cause: ${e}")
    }*/
  }

  fun extractNativeLibs(
      jarFile: File,
      pytorchDir: File,
      jnilibDir: File,
      nativeLibDir: File,
      propertiesDir: File
  ) {
    // Get base directory (plugin/root)
    val baseDir = pytorchDir.parentFile.parentFile

    // Create directories
    pytorchDir.mkdirs()
    jnilibDir.mkdirs()
    nativeLibDir.mkdirs()
    propertiesDir.mkdirs()

    val isNativeCpuJar = jarFile.name.contains("pytorch-native-cpu", ignoreCase = true)
    val isJniJar = jarFile.name.contains("pytorch-jni", ignoreCase = true)
    val isWindows = isWindows()

    // Determine platform-specific library extension
    val platformExt =
        when {
          isWindows -> ".dll"
          System.getProperty("os.name").lowercase().contains("mac") -> ".dylib"
          else -> ".so"
        }

    JarFile(jarFile).use { jar ->
      val entries = jar.entries()
      while (entries.hasMoreElements()) {
        val entry = entries.nextElement()

        // Filter by platform: only extract libraries for current platform
        val isNativeLib = entry.name.endsWith(platformExt, ignoreCase = true)
        val isProperties =
            entry.name.endsWith("pytorch.properties") ||
                entry.name.endsWith("tokenizers.properties")

        if (!isNativeLib && !isProperties) continue

        // Determine destination based on JAR structure
        when {
          // ALL files from pytorch-native-cpu JAR go to pytorch/cpu/win-x86_64/
          isNativeCpuJar -> {
            // Extract all files from pytorch-native-cpu JAR to pytorch/cpu/win-x86_64/
            val fileName = File(entry.name).name
            val targetFile = File(pytorchDir, fileName)
            jar.getInputStream(entry).use { input ->
              Files.copy(input, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
            }
            println("Extracted: ${entry.name} to ${targetFile.absolutePath}")
          }
          // ALL files from pytorch-jni JAR go to jnilib/ with OS-specific structure
          isJniJar && entry.name.startsWith("jnilib/") -> {
            val relativePath = entry.name.substringAfter("jnilib/")
            // pytorch.properties goes directly to jnilib/ (no OS subfolder)
            if (relativePath == "pytorch.properties") {
              val targetFile = File(baseDir, "jnilib/pytorch.properties")
              targetFile.parentFile.mkdirs()
              jar.getInputStream(entry).use { input ->
                Files.copy(input, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
              }
              println("Extracted: ${entry.name} to ${targetFile.absolutePath}")
            } else {
              // All other files go to jnilib/[os-specific]/ maintaining JAR structure
              val targetFile = File(baseDir, "jnilib/$relativePath")
              targetFile.parentFile.mkdirs()
              jar.getInputStream(entry).use { input ->
                Files.copy(input, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
              }
              println("Extracted: ${entry.name} to ${targetFile.absolutePath}")
            }
          }
          // Everything else (MinGW DLLs, tokenizers) goes to native/lib/win-x86_64/cpu/
          entry.name.startsWith("native/lib/") -> {
            // Extract with JAR path structure: native/lib/win-x86_64/cpu/*.dll
            val relativePath = entry.name.substringAfter("native/lib/")
            val targetFile = File(baseDir, "native/lib/$relativePath")
            targetFile.parentFile.mkdirs()
            jar.getInputStream(entry).use { input ->
              Files.copy(input, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
            }
            println("Extracted: ${entry.name} to ${targetFile.absolutePath}")
          }
          // Fallback: extract to native/lib/ (for files not matching JAR structure)
          else -> {
            val fileName = File(entry.name).name
            val fallbackPath = File(nativeLibDir, fileName).toPath()
            jar.getInputStream(entry).use { input ->
              Files.copy(input, fallbackPath, StandardCopyOption.REPLACE_EXISTING)
            }
            println("Extracted: $fileName to ${nativeLibDir.absolutePath} (fallback)")
          }
        }
      }
    }

    // Move pytorch.properties from pytorch/ to native/lib/ if it was extracted there
    val pytorchPropsInPytorchDir = File(pytorchDir, "pytorch.properties")
    if (pytorchPropsInPytorchDir.exists() && isNativeCpuJar) {
      val targetPropsFile = File(propertiesDir, "pytorch.properties")
      Files.move(
          pytorchPropsInPytorchDir.toPath(),
          targetPropsFile.toPath(),
          StandardCopyOption.REPLACE_EXISTING)
      println("Moved pytorch.properties from pytorch/ to native/lib/")
    }

    // Ensure pytorch.properties has all required fields
    ensurePytorchPropertiesComplete(propertiesDir)
  }

  private fun ensurePytorchPropertiesComplete(propertiesDir: File) {
    val propertiesFile = File(propertiesDir, "pytorch.properties")
    if (!propertiesFile.exists()) {
      // Create properties file with required fields
      propertiesFile.writeText("version=2.7.1\nflavor=cpu\nlibraries=torch_cpu,torch,c10\n")
      println("Created pytorch.properties with required fields")
      return
    }

    // Read existing properties
    val existingProps = java.util.Properties()
    propertiesFile.inputStream().use { existingProps.load(it) }

    // Check if all required fields are present
    val hasVersion = existingProps.containsKey("version")
    val hasFlavor = existingProps.containsKey("flavor")
    val hasLibraries = existingProps.containsKey("libraries")

    if (!hasVersion || !hasFlavor || !hasLibraries) {
      // Update properties file with missing fields
      if (!hasVersion) existingProps.setProperty("version", "2.7.1")
      if (!hasFlavor) existingProps.setProperty("flavor", "cpu")
      if (!hasLibraries) existingProps.setProperty("libraries", "torch_cpu,torch,c10")

      propertiesFile.outputStream().use {
        existingProps.store(it, "PyTorch native library properties")
      }
      println("Updated pytorch.properties with missing required fields")
    }
  }

  fun ensureTokenizersNativesExist(targetDir: File, propertiesDir: File, version: String) {
    if (!targetDir.exists()) targetDir.mkdirs()
    if (!targetDir.exists())
        log(
            LogLevel.INFO,
            "Could not create directory (\"$targetDir\") for tokenizers native libraries.")
    if (!propertiesDir.exists()) propertiesDir.mkdirs()
    if (!propertiesDir.exists())
        log(
            LogLevel.INFO,
            "Could not create directory (\"$propertiesDir\") for tokenizers properties.")

    val checkFile = File(targetDir, if (isWindows()) "tokenizers.dll" else "libtokenizers.so")
    if (checkFile.exists()) {
      log(LogLevel.INFO, "Tokenizers native libraries already exist, skipping download")
      return
    }

    val osStr = if (isWindows()) "win-x86_64" else "linux-x86_64"
    // Versuche zuerst die separate native JAR, falls vorhanden
    val tokenizersNativeJarUrl =
        "https://repo1.maven.org/maven2/ai/djl/huggingface/tokenizers-native/$version/tokenizers-native-$version-$osStr.jar"
    val tokenizersMainJarUrl =
        "https://repo1.maven.org/maven2/ai/djl/huggingface/tokenizers/$version/tokenizers-$version.jar"

    try {
      // Versuche native JAR zuerst
      log(LogLevel.INFO, "Attempting to download tokenizers native JAR...")
      val nativeUrl = URL(tokenizersNativeJarUrl)
      val nativeFileName = tokenizersNativeJarUrl.substringAfterLast("/")
      val nativeTargetFile = File(targetDir, nativeFileName)

      nativeUrl.openStream().use { input ->
        Files.copy(input, nativeTargetFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
      }
      log(LogLevel.INFO, "Downloaded $nativeFileName. Now extracting...")
      // Tokenizers go to native/lib/, create dummy dirs for other paths
      val tempPytorchDir = File(targetDir.parentFile, "pytorch-temp")
      val tempJniDir = File(targetDir.parentFile, "jnilib-temp")
      extractNativeLibs(nativeTargetFile, tempPytorchDir, tempJniDir, targetDir, propertiesDir)
      tempPytorchDir.deleteRecursively()
      tempJniDir.deleteRecursively()
    } catch (e: Exception) {
      log(
          LogLevel.INFO,
          "Native JAR not found, trying to extract from main tokenizers JAR: ${e.message}")
      // Falls keine separate native JAR existiert, extrahiere aus der Haupt-JAR
      try {
        val mainUrl = URL(tokenizersMainJarUrl)
        val mainFileName = tokenizersMainJarUrl.substringAfterLast("/")
        val mainTargetFile = File(targetDir, mainFileName)

        mainUrl.openStream().use { input ->
          Files.copy(input, mainTargetFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
        }
        log(LogLevel.INFO, "Downloaded $mainFileName. Now extracting native libraries...")
        extractTokenizersFromJar(mainTargetFile, targetDir, propertiesDir)
      } catch (e2: Exception) {
        log(
            LogLevel.WARNING,
            "Could not download tokenizers JAR, trying classpath extraction: ${e2.message}")
        // Als letzter Versuch: Extrahiere aus dem Classpath
        extractTokenizersFromClasspath(targetDir, propertiesDir)
      }
    }
  }

  private fun extractTokenizersFromJar(jarFile: File, targetDir: File, propertiesDir: File) {
    if (!targetDir.exists()) targetDir.mkdirs()
    if (!propertiesDir.exists()) propertiesDir.mkdirs()

    val isWindows = isWindows()
    // Determine platform-specific library extension
    val platformExt =
        when {
          isWindows -> ".dll"
          System.getProperty("os.name").lowercase().contains("mac") -> ".dylib"
          else -> ".so"
        }

    JarFile(jarFile).use { jar ->
      val entries = jar.entries()
      while (entries.hasMoreElements()) {
        val entry = entries.nextElement()

        // Filter by platform: only extract libraries for current platform
        val isTokenizersLib =
            entry.name.endsWith(platformExt, ignoreCase = true) &&
                (entry.name.contains("tokenizers", ignoreCase = true) ||
                    entry.name.startsWith("native/"))
        val isTokenizersProperties = entry.name.endsWith("tokenizers.properties")

        if (isTokenizersLib || isTokenizersProperties) {
          val fileName = File(entry.name).name

          // Native Bibliotheken in targetDir, Properties-Dateien in propertiesDir
          val destinationDir = if (isTokenizersProperties) propertiesDir else targetDir
          val targetPath = File(destinationDir, fileName).toPath()

          jar.getInputStream(entry).use { input ->
            Files.copy(input, targetPath, StandardCopyOption.REPLACE_EXISTING)
          }
          log(LogLevel.INFO, "Extracted: $fileName to ${destinationDir.absolutePath}")
        }
      }
    }
    // Nach der Extraktion die JAR löschen
    val deleted = jarFile.delete()
    if (deleted) log(LogLevel.INFO, "Deleted temporary JAR: ${jarFile.name}")
  }

  // ZZZ
  private fun extractTokenizersFromClasspath(targetDir: File, propertiesDir: File) {
    if (!targetDir.exists()) targetDir.mkdirs()
    if (!propertiesDir.exists()) propertiesDir.mkdirs()

    try {
      val tokenizersClassUrl =
          this.javaClass.classLoader.getResource(
              "ai/djl/huggingface/tokenizers/HuggingFaceTokenizer.class")
      if (tokenizersClassUrl != null && tokenizersClassUrl.protocol == "jar") {
        // Extract JAR path from jar:file:/path/to.jar!/path
        val jarPath = tokenizersClassUrl.path.substringAfter("file:").substringBefore("!")
        val jarFile = File(jarPath)
        if (jarFile.exists()) {
          log(LogLevel.INFO, "Extracting tokenizers libraries from classpath JAR: $jarFile")
          extractTokenizersFromJar(jarFile, targetDir, propertiesDir)
        } else {
          log(LogLevel.WARNING, "Tokenizers JAR not found at: $jarPath")
        }
      } else {
        log(LogLevel.WARNING, "Could not locate tokenizers JAR in classpath")
      }
    } catch (e: Exception) {
      log(LogLevel.WARNING, "Could not extract tokenizers from classpath: ${e.message}")
    }
  }

  private fun isWindows() = System.getProperty("os.name").lowercase().contains("win")
}
