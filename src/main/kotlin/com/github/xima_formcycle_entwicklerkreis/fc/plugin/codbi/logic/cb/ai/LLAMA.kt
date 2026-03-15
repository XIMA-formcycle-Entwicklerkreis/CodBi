package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai

// region Imports
// region XIMA
// endregion XIMA
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.AI
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.DownloadManager
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.LlamaHttpClient
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.LlamaProcessManager
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.PlatformDetector
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.PlatformDetector.GpuBackend
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.PlatformDetector.Platform
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import java.io.File

// endregion Imports
/**
 * # Base class for AI models served via a local LLAMA server process.
 *
 * ## Plugin properties
 * |Property                    |Default       |Description                                       |
 * |----------------------------|--------------|--------------------------------------------------|
 * |`Active_AI`                 |—             |Must contain `llama_engine`                       |
 * |`AI_Remove`                 |—             |If contains `llama_engine`, clean up all          |
 * |`AI_LLAMA_ENGINE_Port`      |`8392`        |Local port for LLAMA-Server                       |
 * |`AI_LLAMA_ENGINE_Threads`   |physical cores|Number of CPU threads                             |
 * |`AI_LLAMA_ENGINE_CtxSize`   |`32768`       |Context window size (shared across parallel slots)|
 * |`AI_LLAMA_ENGINE_GpuLayers` |auto-detect   |Layers offloaded to GPU (-1 = auto)               |
 * |`AI_LLAMA_ENGINE_Release`   |`b8175`       |llama.cpp release tag for downloads               |
 * |`AI_LLAMA_ENGINE_ServerArgs`|—             |Extra CLI args for LLAMA-Server                   |
 * |`AI_LLAMA_ENGINE_Parallel`  |`4`           |Number of parallel inference slots                |
 *
 * ## Domains to whitelist
 * - **github.com** — llama-server binary releases
 * - **objects.githubusercontent.com** — GitHub release asset CDN
 *
 * ## DSGVO / EU-AI Act
 * - All data stays on the local machine.
 * - No external API calls.
 * - Same compliance advantages as all other CodBi AI implementations.
 */
abstract class LLAMA : AI() {
  // region Companion Object
  /** The companion for static members. */
  companion object {
    /** Default LLAMA-Server release tag for download URLs. */
    private const val DEFAULT_LLAMA_RELEASE = "b8175"
    /**
     * The port currently used by the active LLAMA-Server instance. Set when a [LLAMA] subclass
     * configures its [serverPort]. Used by [AiProxy] to route requests. `0` means no server is
     * configured yet.
     */
    @Volatile
    @JvmStatic
    var activeServerPort: Int = 0
      internal set

    /**
     * The port used by the dedicated thinking LLAMA-Server instance (if configured). Used by
     * [AiProxy] to route thinking-mode requests to the correct server. `0` means no dedicated
     * thinking server is running (hybrid mode or not configured).
     */
    @Volatile
    @JvmStatic
    var activeThinkingServerPort: Int = 0
      internal set
  }

  // endregion Companion Object
  // region Configuration Properties
  /** Port the LLAMA-Server will listen on. */
  protected var serverPort: Int = 8392
  /** Number of CPU threads for the server. `null` = auto-detect physical cores. */
  protected var threadCount: Int? = null
  /** Context window size in tokens. */
  protected var ctxSize: Int = 32768
  /**
   * Number of model layers to offload to GPU (not used when converting an image into tokens).
   * - `-1` = auto-detect (all layers offloaded when GPU is available, 0 otherwise)
   * - `0` = pure CPU
   * - `N` = offload exactly N layers
   */
  protected var gpuLayers: Int = -1
  /** The detected GPU backend, populated during [detectGpu]. */
  protected var detectedGpu: GpuBackend = GpuBackend.NONE
  /** Additional CLI arguments appended to the LLAMA-Server command. */
  protected var extraServerArgs: List<String> = emptyList()
  /** Maximum concurrent requests (slots) the server serves. */
  protected var parallelSlots: Int = 4
  // endregion Configuration Properties
  // region Server Binary Download URLs
  /**
   * Effective llama.cpp release tag used for building download URLs. Defaults to
   * [DEFAULT_LLAMA_RELEASE]. May be overridden by subclasses or plugin properties.
   */
  protected var llamaRelease: String = DEFAULT_LLAMA_RELEASE
  /**
   * CPU-only server binary download URLs per platform key (e.g. `"windows_x86_64"`). Populated by
   * [buildServerUrls] and may be partially overridden by subclass plugin properties.
   */
  protected val serverUrls: MutableMap<String, String> = buildServerUrls(DEFAULT_LLAMA_RELEASE)

  /**
   * Builds the platform→URL map for a given llama.cpp release tag (CPU-only).
   *
   * @param release The llama.cpp release tag (e.g. `"b8175"`).
   * @return A mutable map of platform key (e.g. `"windows_x86_64"`) to download URL.
   */
  protected fun buildServerUrls(release: String): MutableMap<String, String> {
    val base = "https://github.com/ggml-org/llama.cpp/releases/download/$release"

    return mutableMapOf(
        "windows_x86_64" to "$base/llama-$release-bin-win-cpu-x64.zip",
        "linux_x86_64" to "$base/llama-$release-bin-ubuntu-x64.tar.gz",
        "macos_x86_64" to "$base/llama-$release-bin-macos-x64.tar.gz",
        "macos_aarch64" to "$base/llama-$release-bin-macos-arm64.tar.gz")
  }

  /**
   * Resolves the best server binary download URL based on detected GPU backend.
   *
   * Priority: CUDA 12 → Vulkan → CPU.
   *
   * For CUDA builds on Windows, also returns the CUDA runtime DLL URL that must be downloaded and
   * extracted alongside the main binary.
   *
   * @param release The llama.cpp release tag.
   * @param platformKey Platform identifier (e.g. `"windows_x86_64"`).
   * @param gpuBackend The detected [GpuBackend].
   * @return A pair of (serverBinaryUrl, cudaDllUrl?). cudaDllUrl is non-null only for CUDA builds.
   */
  private fun resolveServerUrl(
      release: String,
      platformKey: String,
      gpuBackend: GpuBackend
  ): Pair<String, String?> {
    val base = "https://github.com/ggml-org/llama.cpp/releases/download/$release"

    if (platformKey.startsWith("macos")) {
      return Pair(serverUrls[platformKey] ?: buildServerUrls(release)[platformKey]!!, null)
    }
    if (gpuBackend == GpuBackend.CUDA) {
      return when (platformKey) {
        "windows_x86_64" ->
            Pair(
                "$base/llama-$release-bin-win-cuda-12.4-x64.zip",
                "$base/cudart-llama-bin-win-cuda-12.4-x64.zip")
        "linux_x86_64" -> Pair("$base/llama-$release-bin-ubuntu-vulkan-x64.tar.gz", null)
        else -> Pair(serverUrls[platformKey] ?: buildServerUrls(release)[platformKey]!!, null)
      }
    }

    if (gpuBackend == GpuBackend.VULKAN) {
      return when (platformKey) {
        "windows_x86_64" -> Pair("$base/llama-$release-bin-win-vulkan-x64.zip", null)
        "linux_x86_64" -> Pair("$base/llama-$release-bin-ubuntu-vulkan-x64.tar.gz", null)
        else -> Pair(serverUrls[platformKey] ?: buildServerUrls(release)[platformKey]!!, null)
      }
    }

    return Pair(serverUrls[platformKey] ?: buildServerUrls(release)[platformKey]!!, null)
  }

  // endregion Server Binary Download URLs
  // region State-Management
  /** Whether this instance is active and the server is running. */
  @Volatile protected var isActive = false
  /** The server binary executable file. */
  protected var serverBinary: File? = null
  /** Root directory for llama engine files under the plugin folder. */
  protected var llamaEngineDir: File? = null
  /** Directory where model files (GGUF) are stored. */
  protected var modelsDir: File? = null
  /** Directory where the server binary is stored. */
  protected var binDir: File? = null

  // endregion State-Management
  // region Delegate Instances
  /** Shared download manager for resumable downloads and archive extraction. */
  protected val downloadManager by lazy { DownloadManager { level, msg -> log(level, msg) } }
  /** HTTP client for communicating with the local LLAMA-Server. */
  protected val httpClient by lazy {
    LlamaHttpClient({ serverPort }) { level, msg -> log(level, msg) }
  }
  /** Process manager for the LLAMA-Server OS process. */
  protected val processManager by lazy { LlamaProcessManager { level, msg -> log(level, msg) } }

  /** Initializes this [AI] by setting its idLogMessages to `LLAMA`. */
  init {
    idLogMessages = "LLAMA"
  }

  // endregion Delegate Instances
  // region Platform Detection (delegates to PlatformDetector)

  /** Detects the current server platform from JVM system properties. */
  protected fun detectPlatform(): Platform =
      PlatformDetector.detectPlatform(log = { level, msg -> log(level, msg) })

  /** Detects the best available GPU backend on the current system. */
  protected fun detectGpu(): GpuBackend =
      PlatformDetector.detectGpu { level, msg -> log(level, msg) }

  /** Detects the number of physical CPU cores. Falls back to [Runtime.availableProcessors]. */
  protected fun detectPhysicalCores(): Int =
      PlatformDetector.detectPhysicalCores { level, msg -> log(level, msg) }

  // endregion Platform Detection

  // region Download & Extraction (delegates to DownloadManager)

  /** Downloads a file with HTTP Range resume support. See [DownloadManager.downloadWithResume]. */
  protected fun downloadWithResume(url: String, targetFile: File, label: String): Boolean =
      downloadManager.downloadWithResume(url, targetFile, label)

  /** Extracts a ZIP archive with Zip-Slip protection. See [DownloadManager.extractZip]. */
  protected fun extractZip(zipFile: File, targetDir: File) =
      downloadManager.extractZip(zipFile, targetDir)

  /** Extracts a .tar.gz archive via external `tar`. See [DownloadManager.extractTarGz]. */
  protected fun extractTarGz(tarGzFile: File, targetDir: File) =
      downloadManager.extractTarGz(tarGzFile, targetDir)

  /** Finds an executable recursively within a directory. See [DownloadManager.findExecutable]. */
  protected fun findExecutable(dir: File, exeName: String): File? =
      downloadManager.findExecutable(dir, exeName)

  // endregion Download & Extraction
  // region Server Binary Download
  /**
   * Downloads, extracts, and locates the LLAMA-Server binary for the current platform.
   *
   * This method handles:
   * 1. GPU detection (CUDA / Vulkan / CPU fallback)
   * 2. Release and GPU change detection (purges old downloads when the config changes)
   * 3. Download of the correct LLAMA-Server archive (with resume support)
   * 4. Download of CUDA runtime DLLs when needed (Windows + NVIDIA)
   * 5. Archive extraction (ZIP or tar.gz)
   * 6. `chmod +x` on Unix
   *
   * The result is stored in [serverBinary]. Subsequent calls skip the download if the binary is
   * already present and the release + GPU backend have not changed.
   *
   * @param platform The detected [Platform].
   * @return The LLAMA-Server binary [File], or `null` on failure.
   */
  protected fun downloadServerBinary(platform: Platform): File? {
    detectedGpu = detectGpu()

    log(LogLevel.INFO, "GPU backend: $detectedGpu")

    val releaseMarker = File(binDir, "release-tag.txt")
    val gpuMarker = File(binDir, "gpu-backend.txt")
    val installedRelease = if (releaseMarker.exists()) releaseMarker.readText().trim() else null
    val installedGpu = if (gpuMarker.exists()) gpuMarker.readText().trim() else null
    val releaseChanged = installedRelease != null && installedRelease != llamaRelease
    val gpuChanged = installedGpu != null && installedGpu != detectedGpu.name

    if (releaseChanged || gpuChanged) {
      val reason =
          when {
            releaseChanged && gpuChanged ->
                "release changed from $installedRelease to $llamaRelease " +
                    "and GPU changed from $installedGpu to ${detectedGpu.name}"
            releaseChanged -> "release changed from $installedRelease to $llamaRelease"
            else -> "GPU backend changed from $installedGpu to ${detectedGpu.name}"
          }

      log(LogLevel.INFO, "$reason — purging old binaries")

      binDir?.listFiles()?.forEach { f ->
        if (f.name != "release-tag.txt" && f.name != "gpu-backend.txt") {
          if (f.isDirectory) f.deleteRecursively() else f.delete()
        }
      }
    }

    val platformKey = "${platform.os}_${platform.arch}"
    val (serverArchiveUrl, cudaDllUrl) = resolveServerUrl(llamaRelease, platformKey, detectedGpu)

    log(LogLevel.INFO, "Server binary URL: $serverArchiveUrl")

    if (cudaDllUrl != null) {
      log(LogLevel.INFO, "CUDA runtime DLL URL: $cudaDllUrl")
    }

    val archiveFileName = serverArchiveUrl.substringAfterLast("/")
    val archiveFile = File(binDir, archiveFileName)
    val archiveMarker = File(binDir, "$archiveFileName.complete")

    if (!archiveMarker.exists()) {
      if (!downloadWithResume(serverArchiveUrl, archiveFile, "LLAMA-Server binary")) {
        log(LogLevel.ERROR, "Failed to download LLAMA-Server binary")

        return null
      }

      val extractDir = File(binDir, "extracted")

      if (archiveFileName.endsWith(".zip")) {
        extractZip(archiveFile, extractDir)
      } else {
        extractTarGz(archiveFile, extractDir)
      }

      if (cudaDllUrl != null) {
        val cudaArchiveName = cudaDllUrl.substringAfterLast("/")
        val cudaArchive = File(binDir, cudaArchiveName)

        if (downloadWithResume(cudaDllUrl, cudaArchive, "CUDA runtime DLLs")) {
          if (cudaArchiveName.endsWith(".zip")) {
            extractZip(cudaArchive, extractDir)
          } else {
            extractTarGz(cudaArchive, extractDir)
          }

          log(LogLevel.INFO, "CUDA runtime DLLs extracted")
        } else {
          log(
              LogLevel.WARNING,
              "Failed to download CUDA runtime DLLs — GPU acceleration may not work")
        }
      }

      releaseMarker.writeText(llamaRelease)
      gpuMarker.writeText(detectedGpu.name)
    }

    val extractDir = File(binDir, "extracted")
    val binary = findExecutable(extractDir, platform.exeName)

    if (binary == null) {
      log(LogLevel.ERROR, "Could not find ${platform.exeName} in extracted archive")

      return null
    }

    if (platform.needsChmod) {
      try {
        ProcessBuilder("chmod", "+x", binary.absolutePath)
            .redirectErrorStream(true)
            .start()
            .waitFor()
        log(LogLevel.INFO, "chmod +x: ${binary.absolutePath}")
      } catch (e: Exception) {
        log(LogLevel.WARNING, "chmod failed: ${e.message}")
      }
    }

    serverBinary = binary

    return binary
  }

  // endregion Server Binary Download
  // region ProcessBuilder (command building here, lifecycle delegates to LlamaProcessManager)

  /** The running LLAMA-Server [Process], or `null` if not started. */
  protected val serverProcess: Process?
    get() = processManager.process

  /**
   * Starts the LLAMA-Server process with the given model file.
   *
   * Builds the full command line (binary, model, GPU, threading, context, Qwen3 template, etc.)
   * then delegates process launch and health checking to [processManager].
   *
   * @param binary The LLAMA-Server executable.
   * @param modelFile The GGUF model file to load.
   * @param mmProjFile Optional: the multimodal projector file (for VLMs).
   * @return `true` if the server started and passed health checks.
   */
  protected fun startServer(binary: File, modelFile: File, mmProjFile: File? = null): Boolean {
    serverPort = processManager.findFreePort(serverPort)

    val resolvedThreads = threadCount ?: detectPhysicalCores()
    val resolvedGpuLayers =
        when {
          gpuLayers >= 0 -> gpuLayers
          detectedGpu != GpuBackend.NONE -> 999 // offload all layers; server clamps to actual count
          else -> 0
        }

    log(LogLevel.INFO, "Starting LLAMA-Server:")
    log(LogLevel.INFO, "  Binary:  ${binary.absolutePath}")
    log(
        LogLevel.INFO,
        "  Model:   ${modelFile.absolutePath} (${"%.0f".format(modelFile.length() / (1024.0 * 1024.0))} MB)")

    mmProjFile?.let { log(LogLevel.INFO, "  mmproj:  ${it.absolutePath}") }

    log(LogLevel.INFO, "  Port:    $serverPort")
    log(LogLevel.INFO, "  Threads: $resolvedThreads")
    log(LogLevel.INFO, "  Context: $ctxSize tokens")
    log(LogLevel.INFO, "  GPU layers: $resolvedGpuLayers (detected: $detectedGpu)")
    log(LogLevel.INFO, "  Parallel slots: $parallelSlots")

    val command =
        mutableListOf(
            binary.absolutePath,
            "--model",
            modelFile.absolutePath,
            "--host",
            "127.0.0.1",
            "--port",
            serverPort.toString(),
            "--threads",
            resolvedThreads.toString(),
            "--ctx-size",
            ctxSize.toString(),
            "--parallel",
            parallelSlots.toString(),
            "--n-gpu-layers",
            resolvedGpuLayers.toString(),
            "--jinja")

    val isQwen3 = modelFile.name.contains("qwen3", ignoreCase = true)

    if (isQwen3) {
      val templateFile = File(binary.parentFile, "qwen3-chat-template.jinja")
      val templateContent =
          javaClass
              .getResourceAsStream("/AI/llama/qwen3-chat-template.jinja")
              ?.bufferedReader()
              ?.readText() ?: throw IllegalStateException("Qwen3 chat template resource not found")

      templateFile.writeText(templateContent.trimIndent())
      command.addAll(listOf("--chat-template-file", templateFile.absolutePath))

      log(LogLevel.INFO, "  Template: ${templateFile.absolutePath} (Qwen3 override)")
    } else {
      log(LogLevel.INFO, "  Template: using GGUF-embedded template")
    }

    if (mmProjFile != null && mmProjFile.exists()) {
      command.addAll(listOf("--mmproj", mmProjFile.absolutePath))
    }

    command.addAll(extraServerArgs)

    try {
      val started = processManager.launchProcess(command, binary.parentFile, serverPort)

      if (started) {
        activeServerPort = serverPort
        log(LogLevel.INFO, "LLAMA-Server is healthy and ready on port $serverPort")
      }

      return started
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Failed to start LLAMA-Server: ${X.message}", "", X)
      stopServer()

      return false
    }
  }

  /** Stops the LLAMA-Server process and resets the active port. */
  protected fun stopServer() {
    processManager.stopProcess()
    activeServerPort = 0
  }

  /** Returns `true` if the server process is alive. */
  protected fun isServerAlive(): Boolean = processManager.isAlive()

  /**
   * Restarts the server (stop + start). Subclasses call this if the process dies mid-session.
   *
   * @return `true` if the restart succeeded.
   */
  protected fun restartServer(): Boolean {
    log(LogLevel.INFO, "Restarting LLAMA-Server...")
    stopServer()
    // Subclass must call startServer() again with proper files
    return false // subclass overrides with actual restart logic
  }

  // endregion ProcessBuilder

  // region Request (delegates to LlamaHttpClient)
  /** The base URL for the local LLAMA-Server API. */
  protected val serverBaseUrl: String
    get() = httpClient.serverBaseUrl

  /** Base URL for a specific port. */
  protected fun serverBaseUrl(port: Int): String = httpClient.serverBaseUrl(port)

  /** Sends a POST request to the LLAMA-Server and returns the response body. */
  protected fun httpPost(
      endpoint: String,
      jsonBody: String,
      timeoutMs: Int = 300_000,
      port: Int = serverPort
  ): String = httpClient.httpPost(endpoint, jsonBody, timeoutMs, port)

  /** Sends a streaming POST request to the LLAMA-Server (SSE). */
  protected fun httpPostStreaming(
      endpoint: String,
      jsonBody: String,
      onLine: (String) -> Unit,
      shouldStop: () -> Boolean = { false },
      timeoutMs: Int = 300_000,
      port: Int = serverPort
  ) = httpClient.httpPostStreaming(endpoint, jsonBody, onLine, shouldStop, timeoutMs, port)

  // endregion Request
  // region Lifecycle
  /**
   * Initializes the LLAMA infrastructure: creates directories, reads plugin properties. Subclasses
   * should call `super.initialize(configData)` then proceed with downloading and starting the
   * server.
   *
   * @param configData The plugin initialization data containing properties and file helpers.
   */
  override fun initialize(configData: IPluginInitializeData) {
    super.initialize(configData)

    val activeAI = configData.properties.getProperty("Active_AI")?.lowercase() ?: ""

    if (!activeAI.contains("llama_engine")) {
      log(LogLevel.INFO, "LLAMA not activated (Active_AI does not contain 'llama_engine')")

      return
    }

    val aiRemove = configData.properties.getProperty("AI_Remove")?.lowercase() ?: ""

    if (aiRemove.contains("llama_engine")) {
      log(LogLevel.INFO, "LLAMA marked for removal — cleaning up all files")

      val llamaDir = File(configData.fileHelper.pluginFolder, "ai/llama_engine")

      if (llamaDir.exists()) llamaDir.deleteRecursively()

      return
    }
    // region Set up directories
    llamaEngineDir = File(configData.fileHelper.pluginFolder, "ai/llama_engine")
    binDir = File(llamaEngineDir!!, "bin")
    modelsDir = File(llamaEngineDir!!, "models")
    llamaEngineDir!!.mkdirs()
    binDir!!.mkdirs()
    modelsDir!!.mkdirs()
    // endregion Set up directories
    // region Read plugin properties
    configData.properties.getProperty("AI_LLAMA_ENGINE_Port")?.trim()?.toIntOrNull()?.let {
      if (it in 1024..65535) {
        serverPort = it
      }
    }
    configData.properties.getProperty("AI_LLAMA_ENGINE_Threads")?.trim()?.toIntOrNull()?.let {
      if (it > 0) threadCount = it
    }

    configData.properties.getProperty("AI_LLAMA_ENGINE_CtxSize")?.trim()?.toIntOrNull()?.let {
      if (it > 0) ctxSize = it
    }

    configData.properties.getProperty("AI_LLAMA_ENGINE_GpuLayers")?.trim()?.toIntOrNull()?.let {
      if (it >= -1) gpuLayers = it
    }

    configData.properties.getProperty("AI_LLAMA_ENGINE_Parallel")?.trim()?.toIntOrNull()?.let {
      if (it > 0) parallelSlots = it
    }

    configData.properties
        .getProperty("AI_LLAMA_ENGINE_ServerArgs")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { extraServerArgs = parseCommandLineArgs(it) }

    configData.properties
        .getProperty("AI_LLAMA_ENGINE_Release")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { customRelease ->
          llamaRelease = customRelease

          val rebuilt = buildServerUrls(customRelease)

          serverUrls.clear()
          serverUrls.putAll(rebuilt)
        }
    // endregion Read plugin properties
    log(LogLevel.INFO, "LLAMA infrastructure initialized")
    log(LogLevel.INFO, "  Dir:     ${llamaEngineDir!!.absolutePath}")
    log(LogLevel.INFO, "  Port:    $serverPort")
    log(LogLevel.INFO, "  Release: $llamaRelease")
    log(LogLevel.INFO, "  Threads: ${threadCount ?: "auto-detect"}")
    log(LogLevel.INFO, "  Context: $ctxSize")
    log(LogLevel.INFO, "  GPU:     ${if (gpuLayers == -1) "auto-detect" else "$gpuLayers layers"}")
  }

  /**
   * Shuts down the LLAMA-Server process and releases resources.
   *
   * @param shutdownData The plugin shutdown data, or `null`.
   */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    stopServer()

    isActive = false

    super.shutdown(shutdownData)
  }

  // endregion Lifecycle
  // region Argument Parsing
  /**
   * Parses a command-line string into individual arguments, respecting double-quoted values.
   *
   * Examples:
   * - `--flag value` → `["--flag", "value"]`
   * - `--path "C:\My Folder\file"` → `["--path", "C:\My Folder\file"]`
   * - `--msg "hello world" --n 4` → `["--msg", "hello world", "--n", "4"]`
   */
  private fun parseCommandLineArgs(input: String): List<String> {
    val args = mutableListOf<String>()
    val current = StringBuilder()
    var inQuotes = false

    for (ch in input) {
      when {
        ch == '"' -> inQuotes = !inQuotes
        ch == ' ' && !inQuotes -> {
          if (current.isNotEmpty()) {
            args.add(current.toString())
            current.clear()
          }
        }
        else -> current.append(ch)
      }
    }

    if (current.isNotEmpty()) {
      args.add(current.toString())
    }

    return args
  }

  // endregion Argument Parsing
  // region Logging
  override fun log(importance: LogLevel, toLog: String, adjenct: String, exception: Throwable?) {
    super.idLogMessages = "LLAMA"
    super.log(importance, toLog, adjenct, exception)
  }
  // endregion Logging
}
