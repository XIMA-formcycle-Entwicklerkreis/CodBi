package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai

// region Imports
// region CodBi
// endregion CodBi
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
 * This [AI] gets activated if the CodBi-Plugin-Property **Active_AI** contains **PyTorch**
 * (case-insensitive) meaning that any subsequent keywords like e.g. **DONUT** will have no effect
 * if the mentioned property does not also include **PyTorch**.
 *
 * The servlet is self-sustainable in order to reduce the size of the plugin dramatically. It
 * downloads the native libraries to run **PyTorch** that're appropriate for the server Formcycle is
 * running on (Windows/Linux/MacOS) once activated automatically. It also downloads the models the
 * derived classes need by itself once the **Active_AI** states a keyword activating those derived
 * classes. Thus access to the Plugin's file directory is necessary. Also,
 * **https://repo1.maven.org** needs to be accessible when either installing, updating the plugin or
 * even when changing the properties if these changes lead to the activation of either **PyTorch**
 * only or any derived AI-Model (once the downloads are completed) no further access to any domain
 * is necessary anymore.
 *
 * **Consider that the downloading may take some minutes, depending on the sever's internet
 * connection.**
 *
 * ## **Removing AI**
 * In order to remove all the files that this class has downloaded and extracted the keyword
 * **PyTorch** has to be added to the **AI_Remove**-Plugin-Property. This will cause an automatic
 * clean up of all files related to **PyTorch** as also the models that were downloaded for derived
 * classes. If just the files related to a derived shall be removed each class defines its own
 * keyword. Some native libraries will most certainly be locked and thus undeleteable until the
 * **JVM** shuts down. Restarting the server will remove those last files automatically
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
   *   **AI_PyTorch_LibURL**. Defaults to OS-specific URL based on the server's operating system.
   */
  private var urlPyTorchNatives = getDefaultPyTorchLibURL()
  /**
   * The URL pointing to the .JARs to download, if needed, containing the **DJL** native libraries.
   * - The URL to the JNI-JAR may be changed by specifying the Plugin-Property
   *   **AI_PyTorch_JNIURL**. Defaults to OS-specific URL based on the server's operating system.
   */
  private var urlJNINatives = getDefaultPyTorchJNIURL()

  /**
   * Detects the operating system and returns the appropriate OS string for Maven artifact naming.
   *
   * @return OS string: "win-x86_64", "linux-x86_64", "osx-x86_64", or "osx-aarch64"
   */
  private fun getOSString(): String {
    val osName = System.getProperty("os.name").lowercase()
    val osArch = System.getProperty("os.arch").lowercase()

    return when {
      osName.contains("win") -> "win-x86_64"
      osName.contains("mac") -> {
        if (osArch.contains("aarch64") || osArch.contains("arm64")) "osx-aarch64" else "osx-x86_64"
      }
      else -> "linux-x86_64"
    }
  }

  /**
   * Gets the default PyTorch native library URL based on the current operating system.
   *
   * @return The default URL for PyTorch native CPU libraries.
   */
  private fun getDefaultPyTorchLibURL(): String {
    val osStr = getOSString()
    return "https://repo1.maven.org/maven2/ai/djl/pytorch/pytorch-native-cpu/2.7.1/pytorch-native-cpu-2.7.1-$osStr.jar"
  }

  /**
   * Gets the default PyTorch JNI library URL based on the current operating system.
   *
   * @return The default URL for PyTorch JNI libraries.
   */
  private fun getDefaultPyTorchJNIURL(): String {
    val osStr = getOSString()
    return "https://repo1.maven.org/maven2/ai/djl/pytorch/pytorch-jni/2.7.1-0.36.0/pytorch-jni-2.7.1-0.36.0-$osStr.jar"
  }

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
        configData.properties.getProperty("AI_PyTorch_LibURL") ?: getDefaultPyTorchLibURL()
    urlJNINatives =
        configData.properties.getProperty("AI_PyTorch_JNIURL") ?: getDefaultPyTorchJNIURL()
    // endregion Get Plugin-Properties
    // region Check for AI_Remove property
    if ((configData.properties.getProperty("AI_Remove")?.lowercase() ?: "").contains("pytorch")) {
      log(
          LogLevel.INFO,
          "AI_Remove property contains 'PyTorch'. Removing all PyTorch files and directories.")
      // region Clean up
      cleanupMemory()
      removePyTorchFiles(configData.fileHelper.pluginFolder)
      clearSharedModels()
      // endregion Clean up
      return null
    }
    // endregion Check for AI_Remove property
    if (configData.properties.getProperty("Active_AI")?.lowercase()?.contains("pytorch") == true &&
        !initialized.get())
        init(configData.fileHelper.pluginFolder)

    return null
  }

  /**
   * Prepares the [init]ialization by reading the [poolSize], the [urlPyTorchNatives] and the
   * [urlJNINatives]. Performs [init]ialization only if the Plugin-Property **Active_AI** contains
   * the keyword **PyTorch** (case-insensitive).
   *
   * @param configData Provided by the **Formcycle** environment.
   */
  override fun initialize(configData: IPluginInitializeData) {
    // region Check for AI_Remove property
    if ((configData.properties.getProperty("AI_Remove")?.lowercase() ?: "").contains("pytorch")) {
      log(
          LogLevel.INFO,
          "AI_Remove property contains 'PyTorch'. Removing all PyTorch files and directories.")
      // region Clean up
      cleanupMemory()
      removePyTorchFiles(configData.fileHelper.pluginFolder)
      clearSharedModels()
      // endregion Clean up
      return
    }
    // endregion Check for AI_Remove property
    if (configData.properties.getProperty("Active_AI")?.lowercase()?.contains("pytorch") == false ||
        initialized.get())
        return
    // region Get Plugin-Properties
    poolSize = configData.properties.getProperty("Pool_Size_PyTorch")?.toInt() ?: 2
    urlPyTorchNatives =
        configData.properties.getProperty("AI_PyTorch_LibURL") ?: getDefaultPyTorchLibURL()
    urlJNINatives =
        configData.properties.getProperty("AI_PyTorch_JNIURL") ?: getDefaultPyTorchJNIURL()
    // endregion Get Plugin-Properties
    super.initialize(configData)
    init(configData.fileHelper.pluginFolder)
  }

  /**
   * Initializes the **Pytorch-Engine** by setting up the necessary environmental variables,
   * downloading the native runtimes for appropriate for the os the server runs on (supporting
   * **Windows**, **Linux** & **MacOS**) and managing class loader switching for appropriate
   * resource discovery.
   *
   * @param pluginFolder The Plugin's directory.
   */
  fun init(pluginFolder: File) {
    log(LogLevel.INFO, "Initializing PyTorch Engine.")
    setupNativeEnvironment(pluginFolder)
    // region Acquire model, if necessary.
    val modelDir = File(pluginFolder, "ai/pytorch/models/$modelName")

    if (!modelDir.exists()) modelDir.mkdirs()
    if (!modelDir.exists()) log(LogLevel.INFO, "Creating Model directory \"$modelDir\" failed.")

    log(LogLevel.INFO, "Model directory is: $modelDir")
    ensureModelFiles(modelDir, pluginFolder)
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
          "The \"$modelName\" (class ${ this.javaClass.simpleName }) was initialized successfully using shared model with a pool of size ${pool.size}.")

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
    cleanupMemory()
  }

  /**
   * Cleans up in-memory resources (predictors, models) without invoking the shutdown lifecycle
   * method. This is used both during normal shutdown and when removing PyTorch via AI_Remove
   * property.
   */
  private fun cleanupMemory() {
    // Close all predictors in the pool
    while (pool.isNotEmpty()) {
      pool.poll()?.close()
    }

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
   * @param pluginFolder The plugin's folder on the server.
   */
  private fun ensureModelFiles(targetDir: File, pluginFolder: File) {
    if (!targetDir.exists()) targetDir.mkdirs()

    resModelFiles.forEach { name ->
      val targetFile = File(targetDir, name)

      if (!targetFile.exists()) {
        println("Downloading $name to ${targetFile.absolutePath}...")

        try {
          URI("$resModelBaseURL/$name").toURL().openStream().use { input ->
            FileOutputStream(targetFile).use { output -> input.copyTo(output) }
          }
          // Track downloaded file
          trackExtractedFile(targetFile, pluginFolder)
        } catch (X: Exception) {
          log(LogLevel.INFO, "Failed to download $name cause: $X")
        }
      } else {
        // File already exists, but we should still track it
        trackExtractedFile(targetFile, pluginFolder)
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

    val osStr = getOSString()
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
      val trackFileCallback: (File) -> Unit = { file -> trackExtractedFile(file, pluginFolder) }

      EngineLoader(this::log, listOf(urlPyTorchNatives, urlJNINatives), trackFileCallback)
          .ensureNativesExist(pytorchDir, jnilibDir, nativeLibDir, propertiesDir, "2.7.1")
      EngineLoader(this::log, listOf(urlPyTorchNatives, urlJNINatives), trackFileCallback)
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
          errorMessage.contains("already loaded in another classloader", ignoreCase = true))
          log(LogLevel.INFO, "Library already loaded (this is normal): ${ X.message }")
      else {
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

  /**
   * Removes all PyTorch-related files and directories that were downloaded and extracted. This
   * includes native libraries, model files, cache directories, and properties files. Also removes
   * empty directories after file deletion.
   *
   * @param pluginFolder The plugin's folder on the server.
   */
  private fun removePyTorchFiles(pluginFolder: File) {
    log(LogLevel.INFO, "Starting removal of PyTorch files and directories...")

    val trackedFiles = loadTrackedFiles(pluginFolder)
    val pathsToRemove = mutableSetOf<File>()

    trackedFiles.forEach { pathStr ->
      val file = File(pathStr)

      if (file.exists()) {
        pathsToRemove.add(file)
      }
    }

    // region Fallback if no tracked files exist
    if (pathsToRemove.isEmpty()) {
      log(LogLevel.INFO, "No tracked files found, using fallback paths for removal.")

      val baseDir = pluginFolder.resolve("plugin/root")
      val osStr = getOSString()

      pathsToRemove.add(baseDir.resolve("pytorch"))
      pathsToRemove.add(baseDir.resolve("jnilib"))
      pathsToRemove.add(baseDir.resolve("native/lib/$osStr"))
      pathsToRemove.add(baseDir.resolve("native/lib/pytorch.properties"))
      pathsToRemove.add(baseDir.resolve("native/lib/tokenizers.properties"))
      pathsToRemove.add(baseDir.resolve("jnilib/pytorch.properties"))
      pathsToRemove.add(pluginFolder.resolve("ai/pytorch"))
    }
    // endregion Fallback if no tracked files exist
    pathsToRemove.forEach { path ->
      if (path.exists()) {
        try {
          if (path.isFile) {
            val deleted = path.delete()

            if (deleted) {
              log(LogLevel.INFO, "Deleted file: ${path.absolutePath}")
            } else {
              val isWindows = System.getProperty("os.name").lowercase().contains("win")
              val isDll = path.name.endsWith(".dll", ignoreCase = true)

              if (isWindows && isDll) {
                path.deleteOnExit()

                log(
                    LogLevel.INFO,
                    "File locked. Marked for deletion on JVM exit: ${path.absolutePath}")
              } else {
                System.gc()
                Thread.sleep(100)

                val retryDeleted = path.delete()

                if (retryDeleted)
                    log(LogLevel.INFO, "Deleted file (after retry): ${path.absolutePath}")
                else {
                  path.deleteOnExit()
                  log(
                      LogLevel.WARNING,
                      "Failed to delete file, marked for deletion on JVM exit: ${path.absolutePath}")
                }
              }
            }
          } else if (path.isDirectory) {
            val deleted = path.deleteRecursively()

            if (deleted) log(LogLevel.INFO, "Deleted directory: ${path.absolutePath}")
            else deleteDirectoryWithFallback(path)
          }
        } catch (X: Exception) {
          log(LogLevel.ERROR, "Error removing ${path.absolutePath}: ${ X.message }")
          try {
            if (path.isFile) path.deleteOnExit()
          } catch (ex: Exception) {}
        }
      }
    }

    // region Remove empty parent directories
    val baseDir = pluginFolder.resolve("plugin/root")

    removeEmptyDirectories(baseDir.resolve("native/lib"))
    removeEmptyDirectories(baseDir.resolve("native"))
    removeEmptyDirectories(baseDir)
    removeEmptyDirectories(pluginFolder.resolve("plugin"))
    removeEmptyDirectories(pluginFolder.resolve("ai"))
    // endregion Remove empty parent directories
    // region Remove the tracking file
    val trackingFile = getTrackingFile(pluginFolder)
    if (trackingFile.exists()) {
      try {
        trackingFile.delete()

        log(LogLevel.INFO, "Removed tracking file: ${trackingFile.absolutePath}")
      } catch (X: Exception) {
        log(LogLevel.WARNING, "Failed to remove tracking file: ${ X.message }")
      }
    }
    // endregion Remove the tracking file
    log(LogLevel.INFO, "Finished removal of PyTorch files and directories.")
  }

  /**
   * Gets the file path where extracted files are tracked.
   *
   * @param pluginFolder The plugin's folder on the server.
   * @return The tracking file.
   */
  private fun getTrackingFile(pluginFolder: File): File {
    val trackingDir = pluginFolder.resolve("ai/pytorch")

    if (!trackingDir.exists()) trackingDir.mkdirs()

    return trackingDir.resolve(".extracted-files.txt")
  }

  /**
   * Tracks an extracted or downloaded **file** by adding it to the tracking file.
   *
   * @param file The file to track.
   * @param pluginFolder The plugin's folder on the server.
   */
  private fun trackExtractedFile(file: File, pluginFolder: File) {
    if (!file.exists()) return

    try {
      val trackingFile = getTrackingFile(pluginFolder)
      val absolutePath = file.absolutePath

      val existingFiles =
          if (trackingFile.exists()) trackingFile.readLines().toSet() else emptySet()

      if (!existingFiles.contains(absolutePath)) {
        trackingFile.appendText("$absolutePath\n")
        log(LogLevel.INFO, "Tracked file: $absolutePath")
      }
    } catch (X: Exception) {
      log(LogLevel.WARNING, "Failed to track file ${file.absolutePath}: ${ X.message }")
    }
  }

  /**
   * Loads the list of tracked files from disk.
   *
   * @param pluginFolder The plugin's folder on the server.
   * @return List of absolute file paths that were tracked.
   */
  private fun loadTrackedFiles(pluginFolder: File): List<String> {
    val trackingFile = getTrackingFile(pluginFolder)

    if (!trackingFile.exists()) {
      log(LogLevel.INFO, "No tracking file found at ${trackingFile.absolutePath}")

      return emptyList()
    }

    return try {
      trackingFile.readLines().filter { it.isNotBlank() }
    } catch (X: Exception) {
      log(LogLevel.WARNING, "Failed to load tracked files: ${ X.message }")

      emptyList()
    }
  }

  /**
   * Attempts to delete a directory, marking locked files for deletion on JVM exit if needed.
   *
   * @param directory The directory to delete.
   */
  private fun deleteDirectoryWithFallback(directory: File) {
    try {
      deleteDirectoryFilesRecursive(directory)

      if (directory.delete()) {
        log(
            LogLevel.INFO,
            "Deleted directory (after individual file deletion): ${directory.absolutePath}")
      } else {
        log(
            LogLevel.WARNING,
            "Directory still contains locked files, will be cleaned on JVM exit: ${directory.absolutePath}")
      }
    } catch (e: Exception) {
      log(LogLevel.WARNING, "Error during directory cleanup: ${e.message}")
    }
  }

  /**
   * Recursively deletes files in a directory, marking locked files for deletion on JVM exit.
   *
   * @param directory The directory to process.
   */
  private fun deleteDirectoryFilesRecursive(directory: File) {
    directory.listFiles()?.forEach { file ->
      if (file.isDirectory) {
        deleteDirectoryFilesRecursive(file)
      } else if (file.isFile) {
        if (!file.delete()) {
          val isWindows = System.getProperty("os.name").lowercase().contains("win")
          val isDll = file.name.endsWith(".dll", ignoreCase = true)

          if (isWindows && isDll) {
            file.deleteOnExit()
            log(LogLevel.INFO, "File locked, marked for deletion on JVM exit: ${file.absolutePath}")
          } else {
            file.deleteOnExit()
          }
        }
      }
    }
  }

  /**
   * Recursively removes empty directories starting from the given directory. Only removes
   * directories that become empty after file deletion.
   *
   * @param directory The directory to check and potentially remove.
   */
  private fun removeEmptyDirectories(directory: File) {
    if (!directory.exists() || !directory.isDirectory) return

    try {
      directory.listFiles()?.forEach { file -> if (file.isDirectory) removeEmptyDirectories(file) }

      val files = directory.listFiles()

      if (files == null || files.isEmpty()) {
        val deleted = directory.delete()

        if (deleted) {
          log(LogLevel.INFO, "Removed empty directory: ${directory.absolutePath}")

          directory.parentFile?.let { removeEmptyDirectories(it) }
        }
      }
    } catch (X: Exception) {
      log(
          LogLevel.WARNING,
          "Error checking/removing directory ${directory.absolutePath}: ${ X.message }")
    }
  }
}

/**
 * The class managing the loading and extraction of the **PyTorch**-Engine files.
 *
 * @param log The [PyTorch.log]ger to use.
 * @param libURLs The [List] <[PyTorch.urlPyTorchNatives],[PyTorch.urlJNINatives]>.
 * @param trackFile Callback function to track extracted files.
 */
class EngineLoader(
    private val log: (importance: LogLevel, toLog: String) -> Unit,
    libURLs: List<String>,
    private val trackFile: (File) -> Unit = {}
) {
  /** The **libURLs** passed to the constructor. */
  private val pytorchLibUrls = libURLs

  /**
   * Detects the operating system and returns the appropriate OS string for Maven artifact naming.
   *
   * @return OS string: "win-x86_64", "linux-x86_64", "osx-x86_64", or "osx-aarch64"
   */
  private fun getOSString(): String {
    val osName = System.getProperty("os.name").lowercase()
    val osArch = System.getProperty("os.arch").lowercase()

    return when {
      osName.contains("win") -> "win-x86_64"
      osName.contains("mac") -> {
        if (osArch.contains("aarch64") || osArch.contains("arm64")) "osx-aarch64" else "osx-x86_64"
      }
      else -> "linux-x86_64"
    }
  }

  /**
   * Gets the platform-specific library file extension.
   *
   * @return File extension: ".dll", ".so", or ".dylib"
   */
  private fun getPlatformExtension(): String {
    val osName = System.getProperty("os.name").lowercase()
    return when {
      osName.contains("win") -> ".dll"
      osName.contains("mac") -> ".dylib"
      else -> ".so"
    }
  }

  /**
   * Gets the platform-specific library name prefix.
   *
   * @return Prefix: "" for Windows, "lib" for Linux/macOS
   */
  private fun getLibraryPrefix(): String {
    return if (isWindows()) "" else "lib"
  }

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
    val platformExt = getPlatformExtension()
    val libPrefix = getLibraryPrefix()
    val checkFile = File(pytorchDir, "${libPrefix}torch$platformExt")

    if (checkFile.exists()) return

    val osStr = getOSString()
    val tempDir =
        File(System.getProperty("java.io.tmpdir"), "pytorch-extract-${ System.currentTimeMillis()}")

    tempDir.mkdirs()

    try {
      pytorchLibUrls.forEach { urlStr ->
        val url = URI(urlStr).toURL()
        val fileName = urlStr.substringAfterLast("/")
        val targetFile = File(tempDir, fileName)

        if (!targetFile.exists()) {
          log(LogLevel.INFO, "Downloading $fileName...")

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
      tempDir.deleteRecursively()
    }
  }

  /**
   * Extracts the contents of the given **jarFile** into the specified directories automatically
   * determining the destination of the content files.
   *
   * @param jarFile The **JAR** to extract from.
   * @param pytorchDir The directory where files that don't match the JAR-Structure shall reside.
   * @param jnilibDir The directory where JNI's the native files shall reside.
   * @param nativeLibDir The directory where PyTorch's native .dll/.so/.dylib shall reside.
   * @param propertiesDir The directory where the ".properties" shall reside.
   */
  private fun extractNativeLibs(
      jarFile: File,
      pytorchDir: File,
      jnilibDir: File,
      nativeLibDir: File,
      propertiesDir: File
  ) {
    val baseDir = pytorchDir.parentFile.parentFile
    // region Create directories
    pytorchDir.mkdirs()
    jnilibDir.mkdirs()
    nativeLibDir.mkdirs()
    propertiesDir.mkdirs()
    // endregion Create directories
    val isNativeCpuJar = jarFile.name.contains("pytorch-native-cpu", ignoreCase = true)
    val isJniJar = jarFile.name.contains("pytorch-jni", ignoreCase = true)
    val platformExt = getPlatformExtension()

    JarFile(jarFile).use { jar ->
      val entries = jar.entries()

      while (entries.hasMoreElements()) {
        val entry = entries.nextElement()
        val isNativeLib = entry.name.endsWith(platformExt, ignoreCase = true)
        val isProperties =
            entry.name.endsWith("pytorch.properties") ||
                entry.name.endsWith("tokenizers.properties")

        if (!isNativeLib && !isProperties) continue

        when {
          isNativeCpuJar -> {
            val fileName = File(entry.name).name
            val targetFile = File(pytorchDir, fileName)

            jar.getInputStream(entry).use { input ->
              Files.copy(input, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
            }
            trackFile(targetFile)
            log(LogLevel.INFO, "Extracted: ${entry.name} to ${targetFile.absolutePath}")
          }

          isJniJar && entry.name.startsWith("jnilib/") -> {
            val relativePath = entry.name.substringAfter("jnilib/")

            if (relativePath == "pytorch.properties") {
              val targetFile = File(baseDir, "jnilib/pytorch.properties")

              targetFile.parentFile.mkdirs()

              jar.getInputStream(entry).use { input ->
                Files.copy(input, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
              }
              trackFile(targetFile)
              log(LogLevel.INFO, "Extracted: ${entry.name} to ${targetFile.absolutePath}")
            } else {
              val targetFile = File(baseDir, "jnilib/$relativePath")

              targetFile.parentFile.mkdirs()

              jar.getInputStream(entry).use { input ->
                Files.copy(input, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
              }
              trackFile(targetFile)
              log(LogLevel.INFO, "Extracted: ${entry.name} to ${targetFile.absolutePath}")
            }
          }

          entry.name.startsWith("native/lib/") -> {
            val relativePath = entry.name.substringAfter("native/lib/")
            val targetFile = File(baseDir, "native/lib/$relativePath")
            targetFile.parentFile.mkdirs()

            jar.getInputStream(entry).use { input ->
              Files.copy(input, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
            }
            trackFile(targetFile)
            log(LogLevel.INFO, "Extracted: ${entry.name} to ${targetFile.absolutePath}")
          }

          else -> {
            val fileName = File(entry.name).name
            val targetFile = File(nativeLibDir, fileName)

            jar.getInputStream(entry).use { input ->
              Files.copy(input, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
            }
            trackFile(targetFile)
            log(LogLevel.INFO, "Extracted: $fileName to ${nativeLibDir.absolutePath} (fallback)")
          }
        }
      }
    }

    val pytorchPropsInPytorchDir = File(pytorchDir, "pytorch.properties")

    if (pytorchPropsInPytorchDir.exists() && isNativeCpuJar) {
      val targetPropsFile = File(propertiesDir, "pytorch.properties")

      Files.move(
          pytorchPropsInPytorchDir.toPath(),
          targetPropsFile.toPath(),
          StandardCopyOption.REPLACE_EXISTING)
      trackFile(targetPropsFile)
      log(LogLevel.INFO, "Moved pytorch.properties from pytorch/ to native/lib/")
    }

    ensurePytorchPropertiesComplete(propertiesDir)

    // Track properties file if it was created or updated
    val propertiesFile = File(propertiesDir, "pytorch.properties")
    if (propertiesFile.exists()) {
      trackFile(propertiesFile)
    }
  }

  /**
   * Ensures that the extracted **.property** files within a directory contain the necessary values
   * even creating one, if none is found.
   *
   * @param propertiesDir The directory to check the **.property** files in.
   */
  private fun ensurePytorchPropertiesComplete(propertiesDir: File) {
    val propertiesFile = File(propertiesDir, "pytorch.properties")

    if (!propertiesFile.exists()) {
      propertiesFile.writeText("version=2.7.1\nflavor=cpu\nlibraries=torch_cpu,torch,c10\n")

      log(LogLevel.INFO, "Created pytorch.properties with required fields")

      return
    }

    val existingProps = java.util.Properties()

    propertiesFile.inputStream().use { existingProps.load(it) }
    // region Check if necessary keys are existent
    val hasVersion = existingProps.containsKey("version")
    val hasFlavor = existingProps.containsKey("flavor")
    val hasLibraries = existingProps.containsKey("libraries")
    // endregion Check if necessary keys are existent
    // #region Set nonexistent ones
    if (!hasVersion || !hasFlavor || !hasLibraries) {
      if (!hasVersion) existingProps.setProperty("version", "2.7.1")
      if (!hasFlavor) existingProps.setProperty("flavor", "cpu")
      if (!hasLibraries) existingProps.setProperty("libraries", "torch_cpu,torch,c10")

      propertiesFile.outputStream().use {
        existingProps.store(it, "PyTorch native library properties")
      }

      log(LogLevel.INFO, "Updated pytorch.properties with missing required fields")
    }
    // #endregion Set nonexistent ones
  }

  /**
   * Ensures the existence of the specified tokenizers native library within the **targetDir** by
   * downloading and extracting it properly.
   *
   * @param targetDir The directory where the native library shall reside.
   * @param propertiesDir The directory where the tokenizer **.properties** shall reside.
   * @param version The tokenizer's library version to download an extract.
   */
  fun ensureTokenizersNativesExist(targetDir: File, propertiesDir: File, version: String) {
    // region Create directories
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
    // endregion Create directories
    val platformExt = getPlatformExtension()
    val libPrefix = getLibraryPrefix()
    val checkFile = File(targetDir, "${libPrefix}tokenizers$platformExt")

    if (checkFile.exists()) {
      log(LogLevel.INFO, "Tokenizers native libraries already exist, skipping download")

      return
    }
    // region Download
    val osStr = getOSString()
    val tokenizersNativeJarUrl =
        "https://repo1.maven.org/maven2/ai/djl/huggingface/tokenizers-native/$version/tokenizers-native-$version-$osStr.jar"
    val tokenizersMainJarUrl =
        "https://repo1.maven.org/maven2/ai/djl/huggingface/tokenizers/$version/tokenizers-$version.jar"

    try {
      log(LogLevel.INFO, "Attempting to download tokenizers native JAR...")

      val nativeUrl = URI(tokenizersNativeJarUrl).toURL()
      val nativeFileName = tokenizersNativeJarUrl.substringAfterLast("/")
      val nativeTargetFile = File(targetDir, nativeFileName)

      nativeUrl.openStream().use { input ->
        Files.copy(input, nativeTargetFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
      }

      log(LogLevel.INFO, "Downloaded $nativeFileName. Now extracting...")
      // endregion Download
      // region Extraction & Deployment
      val tempPytorchDir = File(targetDir.parentFile, "pytorch-temp")
      val tempJniDir = File(targetDir.parentFile, "jnilib-temp")

      extractNativeLibs(nativeTargetFile, tempPytorchDir, tempJniDir, targetDir, propertiesDir)

      tempPytorchDir.deleteRecursively()
      tempJniDir.deleteRecursively()
    } catch (X: Exception) {
      log(
          LogLevel.INFO,
          "Native JAR not found, trying to extract from main tokenizers JAR cause ${ X.message}")

      try {
        val mainUrl = URI(tokenizersMainJarUrl).toURL()
        val mainFileName = tokenizersMainJarUrl.substringAfterLast("/")
        val mainTargetFile = File(targetDir, mainFileName)

        mainUrl.openStream().use { input ->
          Files.copy(input, mainTargetFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
        }

        log(LogLevel.INFO, "Downloaded $mainFileName. Now extracting native libraries...")
        extractTokenizersFromJar(mainTargetFile, targetDir, propertiesDir)
      } catch (X2: Exception) {
        log(
            LogLevel.WARNING,
            "Could not download tokenizers JAR, trying classpath extraction: ${ X2.message }")
        extractTokenizersFromClasspath(targetDir, propertiesDir)
      }
      // endregion Extraction & Deployment
    }
  }

  /**
   * Performs the actual extraction of the tokenizers library from within the given **jarFile** into
   * the **targetDir** along with it's **.properties** into the **propertiesDir**.
   *
   * @param jarFile The **JAR** to extract from.
   * @param targetDir The directory where to extract the tokenizer native library to.
   * @param propertiesDir The directory where to extract the tokenizer's **.properties** file to.
   */
  private fun extractTokenizersFromJar(jarFile: File, targetDir: File, propertiesDir: File) {
    if (!targetDir.exists()) targetDir.mkdirs()
    if (!propertiesDir.exists()) propertiesDir.mkdirs()

    val platformExt = getPlatformExtension()

    JarFile(jarFile).use { jar ->
      val entries = jar.entries()

      while (entries.hasMoreElements()) {
        val entry = entries.nextElement()
        val isTokenizersLib =
            entry.name.endsWith(platformExt, ignoreCase = true) &&
                (entry.name.contains("tokenizers", ignoreCase = true) ||
                    entry.name.startsWith("native/"))
        val isTokenizersProperties = entry.name.endsWith("tokenizers.properties")

        if (isTokenizersLib || isTokenizersProperties) {
          val fileName = File(entry.name).name
          val destinationDir = if (isTokenizersProperties) propertiesDir else targetDir
          val targetFile = File(destinationDir, fileName)

          jar.getInputStream(entry).use { input ->
            Files.copy(input, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
          }
          trackFile(targetFile)
          log(LogLevel.INFO, "Extracted: $fileName to ${destinationDir.absolutePath}")
        }
      }
    }

    val deleted = jarFile.delete()

    if (deleted) log(LogLevel.INFO, "Deleted temporary JAR: ${jarFile.name}")
  }

  /**
   * Extracts the hugging face tokenizers native library using the **classloader** into the
   * specified **targetDir** and it's **.properties** file into the **propertiesDir**.
   *
   * @param targetDir The directory where the native library shall reside.
   * @param propertiesDir The directory where the **.properties** file shall reside.
   */
  private fun extractTokenizersFromClasspath(targetDir: File, propertiesDir: File) {
    if (!targetDir.exists()) targetDir.mkdirs()
    if (!propertiesDir.exists()) propertiesDir.mkdirs()

    try {
      val tokenizersClassUrl =
          this.javaClass.classLoader.getResource(
              "ai/djl/huggingface/tokenizers/HuggingFaceTokenizer.class")

      if (tokenizersClassUrl != null && tokenizersClassUrl.protocol == "jar") {
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
    } catch (X: Exception) {
      log(LogLevel.WARNING, "Could not extract tokenizers from classpath: ${ X.message}")
    }
  }

  /**
   * Determines if the server is running on Windows or not.
   *
   * @return **TRUE** if on Windows, otherwise **FALSE**.
   */
  private fun isWindows() = System.getProperty("os.name").lowercase().contains("win")
}
