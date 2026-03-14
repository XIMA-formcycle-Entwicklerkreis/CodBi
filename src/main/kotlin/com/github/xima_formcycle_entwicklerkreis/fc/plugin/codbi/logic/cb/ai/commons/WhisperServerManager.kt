package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.PlatformDetector.GpuBackend
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.PlatformDetector.Platform
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import java.lang.management.ManagementFactory
import java.net.HttpURLConnection
import java.net.ServerSocket
import java.net.URI

/**
 * Manages the full lifecycle of a local whisper-server instance: binary download, FFmpeg
 * provisioning, process launch, health-checking, resource monitoring, and shutdown.
 *
 * Extracted from `Whisper.kt` so the servlet class only handles configuration and request routing.
 *
 * @param log Logging callback `(LogLevel, message)`.
 */
class WhisperServerManager(private val log: (LogLevel, String) -> Unit) {

  companion object {
    /** Startup health-check timeout. */
    private const val SERVER_START_TIMEOUT_MS = 120_000L
    /** Interval between health-check polls. */
    private const val HEALTH_POLL_INTERVAL_MS = 1_000L
    /** Pre-built static ffmpeg download URL for Windows x64 (BtbN builds on GitHub). */
    private const val FFMPEG_DOWNLOAD_URL_WIN64 =
        "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
  }

  // region State

  /** `true` once the whisper-server is healthy and accepting requests. */
  @Volatile
  var serverReady = false
    private set

  /** Captures the first fatal error during background initialization, if any. */
  @Volatile
  var loadError: Throwable? = null
    private set

  /** The TCP port the running server listens on. `0` means no server is running. */
  @Volatile
  var serverPort = 0
    private set

  /** GPU backend detected at initialization. */
  var detectedGpu: GpuBackend = GpuBackend.NONE
    private set

  /** `true` when ffmpeg is available, enabling the `--convert` flag. */
  var ffmpegAvailable = false
    private set

  /** Handle to the running whisper-server OS process. */
  @Volatile private var serverProcess: Process? = null
  /** Daemon thread forwarding whisper-server stdout to the CodBi log. */
  private var stdoutThread: Thread? = null
  /** Daemon thread forwarding whisper-server stderr to the CodBi log. */
  private var stderrThread: Thread? = null
  /** Directory containing the ffmpeg binary (if downloaded), or `null`. */
  private var ffmpegBinDir: File? = null
  /** Resource monitor daemon thread. */
  private var resourceMonitor: ResourceMonitor? = null

  /** Marks the server as ready without starting a local process (external API mode). */
  fun setExternalReady() {
    serverReady = true
  }

  // endregion State
  // region Download Delegates

  private val downloadManager by lazy { DownloadManager { level, msg -> log(level, msg) } }

  private fun downloadWithResume(url: String, targetFile: File, label: String): Boolean =
      downloadManager.downloadWithResume(url, targetFile, label)

  private fun extractZip(zipFile: File, targetDir: File) =
      downloadManager.extractZip(zipFile, targetDir)

  private fun extractTarGz(tarGzFile: File, targetDir: File) =
      downloadManager.extractTarGz(tarGzFile, targetDir)

  private fun findExecutable(dir: File, exeName: String): File? =
      downloadManager.findExecutable(dir, exeName)

  // endregion Download Delegates
  // region Platform Detection Delegates

  private fun detectPlatform(): Platform =
      PlatformDetector.detectPlatform(
          { level, msg -> log(level, msg) }, "whisper-server.exe", "whisper-server")

  private fun detectGpu(): GpuBackend = PlatformDetector.detectGpu { level, msg -> log(level, msg) }

  private fun detectPhysicalCores(): Int =
      PlatformDetector.detectPhysicalCores { level, msg -> log(level, msg) }

  // endregion Platform Detection Delegates
  // region Initialization

  /**
   * Starts background initialization: downloads the whisper-server binary and model, ensures
   * ffmpeg, launches the server, and starts the resource monitor.
   *
   * @param preferredPort The TCP port to try first.
   * @param whisperRelease whisper.cpp release tag (e.g. `"v1.7.6"`).
   * @param modelUrl URL of the GGML model to download.
   * @param modelsDir Directory to store downloaded models.
   * @param binDir Directory to store extracted binaries.
   * @param whisperDir Root directory for all Whisper artifacts.
   * @param noGpu When `true`, GPU acceleration is disabled.
   * @param threadCount Explicit thread count, or `null` to auto-detect.
   * @param maxRAMPercent RAM usage threshold for resource gating.
   * @param maxComputePercent Compute usage threshold for resource gating.
   * @param onReady Called when the server is fully ready (for updating static port fields).
   */
  fun startAsync(
      preferredPort: Int,
      whisperRelease: String,
      modelUrl: String,
      modelsDir: File,
      binDir: File,
      whisperDir: File,
      noGpu: Boolean,
      threadCount: Int?,
      maxRAMPercent: Double,
      maxComputePercent: Double,
      onReady: (port: Int) -> Unit
  ) {
    Thread(
            {
              try {
                val platform = detectPlatform()

                log(LogLevel.INFO, "Platform: ${platform.os}/${platform.arch}")

                val binary = downloadBinary(platform, binDir, whisperRelease, noGpu)

                if (binary == null) {
                  loadError = IllegalStateException("Failed to download whisper-server binary")

                  return@Thread
                }

                val modelFile = File(modelsDir, modelUrl.substringAfterLast("/"))

                if (!downloadWithResume(modelUrl, modelFile, "Whisper model")) {
                  loadError = IllegalStateException("Failed to download Whisper model")

                  return@Thread
                }

                ffmpegAvailable = ensureFfmpeg(platform, whisperDir)

                if (!startServer(binary, modelFile, preferredPort, noGpu, threadCount)) {
                  loadError = IllegalStateException("whisper-server failed to start")

                  return@Thread
                }

                resourceMonitor?.shutdown()

                resourceMonitor =
                    ResourceMonitor(detectedGpu, noGpu, maxComputePercent, maxRAMPercent, log)
                        .also { it.start() }
                serverReady = true
                onReady(serverPort)

                log(LogLevel.INFO, "Whisper initialized and ready for requests on port $serverPort")
              } catch (X: Exception) {
                loadError = X

                log(LogLevel.ERROR, "Whisper initialization failed: ${X.message}")
              }
            },
            "whisper-init")
        .apply { isDaemon = true }
        .start()
  }

  // endregion Initialization
  // region Resource Monitoring

  /**
   * Returns a human-readable reason if resource thresholds are exceeded, or `null` if available.
   */
  fun exceedReason(): String? = resourceMonitor?.exceedReason()

  /** Estimated seconds the client should wait before retrying. */
  fun estimateWaitSeconds(): Int = resourceMonitor?.estimateWaitSeconds() ?: 10

  // endregion Resource Monitoring
  // region Shutdown

  /** Stops the resource monitor, kills the server process, and resets readiness state. */
  fun shutdown() {
    resourceMonitor?.shutdown()
    resourceMonitor = null

    stopServer()

    serverReady = false
    serverPort = 0
  }

  // endregion Shutdown
  // region FFmpeg Auto-Download

  /**
   * Ensures ffmpeg is available for whisper-server's `--convert` flag.
   *
   * @param platform The detected host [Platform].
   * @param whisperDir Root Whisper artifact directory.
   * @return `true` if ffmpeg is available after this call.
   */
  private fun ensureFfmpeg(platform: Platform, whisperDir: File): Boolean {
    if (isFfmpegOnPath()) {
      log(LogLevel.INFO, "ffmpeg already available on system PATH")

      return true
    }

    if (platform.os != "windows") {
      log(
          LogLevel.WARNING,
          "ffmpeg not found — please install it manually (no auto-download for ${platform.os})")

      return false
    }

    log(LogLevel.INFO, "ffmpeg not found on PATH — downloading static build...")

    val ffmpegDir = File(whisperDir, "ffmpeg")

    ffmpegDir.mkdirs()

    val archiveFile = File(ffmpegDir, FFMPEG_DOWNLOAD_URL_WIN64.substringAfterLast("/"))
    val extractDir = File(ffmpegDir, "extracted")

    if (!downloadWithResume(FFMPEG_DOWNLOAD_URL_WIN64, archiveFile, "ffmpeg")) {
      log(LogLevel.ERROR, "Failed to download ffmpeg")

      return false
    }

    if (!extractDir.exists() || extractDir.list()?.isEmpty() != false) {
      extractZip(archiveFile, extractDir)
    }

    val ffmpegExe = extractDir.walkTopDown().find { it.name == "ffmpeg.exe" && it.isFile }

    if (ffmpegExe == null) {
      log(LogLevel.ERROR, "Could not find ffmpeg.exe in extracted archive")

      return false
    }

    ffmpegBinDir = ffmpegExe.parentFile

    log(LogLevel.INFO, "ffmpeg available at: ${ffmpegExe.absolutePath}")

    return true
  }

  /**
   * Checks whether `ffmpeg` is already available on the system PATH.
   *
   * @return `true` if `ffmpeg -version` exits with code 0.
   */
  private fun isFfmpegOnPath(): Boolean {
    return try {
      val proc = ProcessBuilder("ffmpeg", "-version").redirectErrorStream(true).start()

      proc.inputStream.bufferedReader().readText()
      proc.waitFor() == 0
    } catch (X: Exception) {
      false
    }
  }

  // endregion FFmpeg Auto-Download
  // region Binary Download

  /**
   * Builds platform-specific download URLs for a given whisper.cpp release.
   *
   * @param release The whisper.cpp GitHub release tag (e.g. `"v1.7.6"`).
   * @return A map of `"os_arch"` keys to archive download URLs.
   */
  private fun buildWhisperServerUrls(release: String): Map<String, String> {
    val base = "https://github.com/ggml-org/whisper.cpp/releases/download/$release"

    return mapOf("windows_x86_64" to "$base/whisper-bin-x64.zip")
  }

  /**
   * Resolves the best server binary URL based on the detected GPU backend.
   *
   * @param release The whisper.cpp release tag.
   * @param platformKey Platform key in `"os_arch"` format.
   * @param gpuBackend Detected [GpuBackend] to select the optimal binary variant.
   * @return A pair of (archive URL, optional CUDA DLL URL).
   */
  private fun resolveWhisperUrl(
      release: String,
      platformKey: String,
      gpuBackend: GpuBackend
  ): Pair<String, String?> {
    val base = "https://github.com/ggml-org/whisper.cpp/releases/download/$release"
    val cpuUrls = buildWhisperServerUrls(release)

    if (platformKey != "windows_x86_64") {
      log(
          LogLevel.WARNING,
          "No pre-built whisper.cpp binaries for $platformKey — falling back to CPU")

      return Pair(cpuUrls[platformKey] ?: cpuUrls.values.first(), null)
    }

    if (gpuBackend == GpuBackend.CUDA) {
      return Pair("$base/whisper-cublas-12.4.0-bin-x64.zip", null)
    }

    if (gpuBackend == GpuBackend.VULKAN) {
      log(LogLevel.INFO, "No Vulkan build for whisper.cpp — using BLAS variant")

      return Pair("$base/whisper-blas-bin-x64.zip", null)
    }

    return Pair(cpuUrls[platformKey] ?: cpuUrls.values.first(), null)
  }

  /**
   * Downloads, extracts, and locates the whisper-server binary for the current platform.
   *
   * @param platform The detected host [Platform].
   * @param binDir Directory for binary extraction.
   * @param whisperRelease whisper.cpp release tag.
   * @param noGpu Whether GPU is disabled.
   * @return The whisper-server binary [File], or `null` on failure.
   */
  private fun downloadBinary(
      platform: Platform,
      binDir: File,
      whisperRelease: String,
      noGpu: Boolean
  ): File? {
    detectedGpu = detectGpu()

    log(LogLevel.INFO, "GPU backend: $detectedGpu")

    val releaseMarker = File(binDir, "release-tag.txt")
    val gpuMarker = File(binDir, "gpu-backend.txt")
    val installedRelease = if (releaseMarker.exists()) releaseMarker.readText().trim() else null
    val installedGpu = if (gpuMarker.exists()) gpuMarker.readText().trim() else null

    if ((installedRelease != null && installedRelease != whisperRelease) ||
        (installedGpu != null && installedGpu != detectedGpu.name)) {
      log(LogLevel.INFO, "Configuration changed — purging old binaries")

      binDir.listFiles()?.forEach { f ->
        if (f.name != "release-tag.txt" && f.name != "gpu-backend.txt") {
          if (f.isDirectory) f.deleteRecursively() else f.delete()
        }
      }
    }

    val platformKey = "${platform.os}_${platform.arch}"
    val (archiveUrl, cudaDllUrl) = resolveWhisperUrl(whisperRelease, platformKey, detectedGpu)

    log(LogLevel.INFO, "Whisper binary URL: $archiveUrl")

    val archiveFileName = archiveUrl.substringAfterLast("/")
    val archiveFile = File(binDir, archiveFileName)
    if (!File(binDir, "$archiveFileName.complete").exists()) {
      if (!downloadWithResume(archiveUrl, archiveFile, "whisper-server binary")) {
        log(LogLevel.ERROR, "Failed to download whisper-server binary")

        return null
      }

      val extractDir = File(binDir, "extracted")

      if (archiveFileName.endsWith(".zip")) {
        extractZip(archiveFile, extractDir)
      } else {
        extractTarGz(archiveFile, extractDir)
      }

      if (cudaDllUrl != null) {
        val cudaArchive = File(binDir, cudaDllUrl.substringAfterLast("/"))

        if (downloadWithResume(cudaDllUrl, cudaArchive, "CUDA runtime DLLs")) {
          if (cudaArchive.name.endsWith(".zip")) {
            extractZip(cudaArchive, extractDir)
          } else {
            extractTarGz(cudaArchive, extractDir)
          }
        } else {
          log(LogLevel.WARNING, "Failed to download CUDA DLLs — GPU acceleration may not work")
        }
      }

      releaseMarker.writeText(whisperRelease)
      gpuMarker.writeText(detectedGpu.name)
    }

    val binary = findExecutable(File(binDir, "extracted"), platform.exeName)

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
      } catch (e: Exception) {
        log(LogLevel.WARNING, "chmod failed: ${e.message}")
      }
    }

    return binary
  }

  // endregion Binary Download
  // region Server Lifecycle

  /**
   * Launches the whisper-server process and waits for it to pass a health check.
   *
   * @param binary The whisper-server executable.
   * @param model The GGML model file to load.
   * @param preferredPort The TCP port to try first.
   * @param noGpu Whether GPU is disabled.
   * @param threadCount Explicit thread count, or `null` to auto-detect.
   * @return `true` if the server started and passed the health check.
   */
  private fun startServer(
      binary: File,
      model: File,
      preferredPort: Int,
      noGpu: Boolean,
      threadCount: Int?
  ): Boolean {
    if (serverProcess != null) {
      log(LogLevel.WARNING, "Server already running — stopping first")
      stopServer()
    }

    serverPort = findFreePort(preferredPort)

    val resolvedThreads = threadCount ?: detectPhysicalCores()

    log(LogLevel.INFO, "Starting whisper-server:")
    log(LogLevel.INFO, "  Binary:  ${binary.absolutePath}")
    log(
        LogLevel.INFO,
        "  Model:   ${model.absolutePath} (${"%.0f".format(model.length() / (1024.0 * 1024.0))} MB)")
    log(LogLevel.INFO, "  Port:    $serverPort")
    log(LogLevel.INFO, "  Threads: $resolvedThreads")
    log(
        LogLevel.INFO,
        "  GPU:     ${if (noGpu) "disabled" else "enabled"} (detected: $detectedGpu)")

    val command =
        mutableListOf(
            binary.absolutePath,
            "--model",
            model.absolutePath,
            "--host",
            "127.0.0.1",
            "--port",
            serverPort.toString(),
            "--threads",
            resolvedThreads.toString())

    if (noGpu || detectedGpu == GpuBackend.NONE) {
      command.add("--no-gpu")
    }
    if (ffmpegAvailable) {
      command.add("--convert")
    } else {
      log(LogLevel.WARNING, "ffmpeg not available — whisper-server will only accept WAV audio.")
    }

    command.add("--flash-attn")
    command.add("--no-context")
    command.addAll(listOf("--language", "auto"))

    log(LogLevel.INFO, "Command: ${command.joinToString(" ")}")

    try {
      val pb = ProcessBuilder(command)

      pb.directory(binary.parentFile)
      pb.redirectErrorStream(false)

      if (ffmpegBinDir != null) {
        val env = pb.environment()
        val pathKey = env.keys.find { it.equals("PATH", ignoreCase = true) } ?: "PATH"

        env[pathKey] = "${ffmpegBinDir!!.absolutePath}${File.pathSeparator}${env[pathKey] ?: ""}"

        log(LogLevel.INFO, "Added ffmpeg to server PATH: ${ffmpegBinDir!!.absolutePath}")
      }

      val process = pb.start()
      this.serverProcess = process

      stdoutThread =
          Thread(
                  {
                    try {
                      BufferedReader(InputStreamReader(process.inputStream)).use { reader ->
                        reader.lineSequence().forEach { line ->
                          log(LogLevel.INFO, "[whisper-server] $line")
                        }
                      }
                    } catch (_: Exception) {}
                  },
                  "whisper-stdout")
              .apply {
                isDaemon = true
                start()
              }

      stderrThread =
          Thread(
                  {
                    try {
                      BufferedReader(InputStreamReader(process.errorStream)).use { reader ->
                        reader.lineSequence().forEach { line ->
                          log(LogLevel.INFO, "[whisper-server/err] $line")
                        }
                      }
                    } catch (X: Exception) {}
                  },
                  "whisper-stderr")
              .apply {
                isDaemon = true
                start()
              }

      if (!waitForHealth()) {
        log(
            LogLevel.ERROR,
            "whisper-server failed health check within ${SERVER_START_TIMEOUT_MS / 1000}s")
        stopServer()

        return false
      }

      log(LogLevel.INFO, "whisper-server is healthy and ready on port $serverPort")

      return true
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Failed to start whisper-server: ${X.message}")
      stopServer()

      return false
    }
  }

  /**
   * Polls the whisper-server `/health` endpoint until it returns HTTP 200 or the deadline expires.
   *
   * @return `true` if the server became healthy within [SERVER_START_TIMEOUT_MS].
   */
  private fun waitForHealth(): Boolean {
    val deadline = System.currentTimeMillis() + SERVER_START_TIMEOUT_MS

    while (System.currentTimeMillis() < deadline) {
      serverProcess?.let { proc ->
        if (!proc.isAlive) {
          log(LogLevel.ERROR, "whisper-server died (exit code: ${proc.exitValue()})")

          return false
        }
      }

      try {
        val conn =
            URI("http://127.0.0.1:$serverPort/health").toURL().openConnection() as HttpURLConnection

        conn.connectTimeout = 2_000
        conn.readTimeout = 2_000
        conn.requestMethod = "GET"

        val code = conn.responseCode

        conn.disconnect()

        if (code == 200) return true
      } catch (X: Exception) {}

      Thread.sleep(HEALTH_POLL_INTERVAL_MS)
    }

    return false
  }

  /** Gracefully stops the whisper-server process, falling back to [Process.destroyForcibly]. */
  private fun stopServer() {
    serverProcess?.let { proc ->
      log(LogLevel.INFO, "Stopping whisper-server...")

      try {
        proc.destroy()
        if (!proc.waitFor(10, java.util.concurrent.TimeUnit.SECONDS)) {
          proc.destroyForcibly()
          proc.waitFor(5, java.util.concurrent.TimeUnit.SECONDS)
        }

        log(LogLevel.INFO, "whisper-server stopped (exit code: ${proc.exitValue()})")
      } catch (X: Exception) {
        log(LogLevel.WARNING, "Error stopping whisper-server: ${X.message}")

        try {
          proc.destroyForcibly()
        } catch (_: Exception) {}
      }
    }

    serverProcess = null
    stdoutThread = null
    stderrThread = null
  }

  /**
   * Finds an available TCP port starting from the preferred port.
   *
   * @param preferredPort The port to try first.
   * @return An available port number.
   */
  private fun findFreePort(preferredPort: Int): Int {
    for (offset in 0 until 20) {
      val candidate = preferredPort + offset

      if (candidate > 65535) break
      try {
        ServerSocket(candidate).use {}
        if (offset > 0) log(LogLevel.INFO, "Port $preferredPort busy — using $candidate")

        return candidate
      } catch (X: Exception) {}
    }

    return try {
      ServerSocket(0).use { it.localPort }.also { log(LogLevel.WARNING, "OS assigned port $it") }
    } catch (X: Exception) {
      preferredPort
    }
  }

  // endregion Server Lifecycle
  // region Resource Monitor

  /**
   * Daemon thread that periodically samples CPU, RAM, and (optionally) GPU utilization. Used to
   * gate incoming requests when system resources are under heavy load.
   */
  private class ResourceMonitor(
      private val detectedGpu: GpuBackend,
      private val noGpu: Boolean,
      private val maxComputePercent: Double,
      private val maxRAMPercent: Double,
      private val log: (LogLevel, String) -> Unit
  ) : Thread("codbi-whisper-resource-monitor") {

    @Volatile
    var cpuPercent = 0.0
      private set

    @Volatile
    var ramPercent = 0.0
      private set

    @Volatile
    var gpuPercent = 0.0
      private set

    @Volatile var running = true

    private val osMxBean: com.sun.management.OperatingSystemMXBean? =
        try {
          ManagementFactory.getOperatingSystemMXBean() as? com.sun.management.OperatingSystemMXBean
        } catch (X: Exception) {
          null
        }

    @Volatile private var gpuPollingAvailable = false

    init {
      isDaemon = true

      val usesGpu = detectedGpu == GpuBackend.CUDA && !noGpu

      if (usesGpu) {
        try {
          val probe =
              ProcessBuilder(
                      "nvidia-smi", "--query-gpu=utilization.gpu", "--format=csv,noheader,nounits")
                  .redirectErrorStream(true)
                  .start()
          val output = probe.inputStream.bufferedReader().readText().trim()

          probe.waitFor()

          if (probe.exitValue() == 0 && output.toDoubleOrNull() != null) {
            gpuPollingAvailable = true

            log(
                LogLevel.INFO,
                "Resource monitor: GPU utilization polling active (CUDA via nvidia-smi)")
          }
        } catch (X: Exception) {}
      }

      if (!gpuPollingAvailable && usesGpu) {
        log(
            LogLevel.INFO,
            "Resource monitor: GPU detected but nvidia-smi unavailable — falling back to CPU monitoring")
      }
    }

    override fun run() {
      while (running) {
        try {
          osMxBean?.let {
            cpuPercent = it.cpuLoad * 100.0

            val totalMem = it.totalMemorySize.toDouble()

            ramPercent =
                if (totalMem > 0) (totalMem - it.freeMemorySize.toDouble()) / totalMem * 100.0
                else 0.0
          }

          if (gpuPollingAvailable) {
            gpuPercent = pollGpuUtilization()
          }

          sleep(1000)
        } catch (X: InterruptedException) {
          break
        } catch (X: Exception) {}
      }
    }

    private fun pollGpuUtilization(): Double {
      return try {
        val proc =
            ProcessBuilder(
                    "nvidia-smi", "--query-gpu=utilization.gpu", "--format=csv,noheader,nounits")
                .redirectErrorStream(true)
                .start()

        val output = proc.inputStream.bufferedReader().readText().trim()

        proc.waitFor()
        output.lines().firstOrNull()?.trim()?.toDoubleOrNull() ?: gpuPercent
      } catch (X: Exception) {
        gpuPercent
      }
    }

    private val computePercent: Double
      get() = if (gpuPollingAvailable) gpuPercent else cpuPercent

    private val computeLabel: String
      get() = if (gpuPollingAvailable) "GPU" else "CPU"

    fun exceedReason(): String? {
      val parts = mutableListOf<String>()

      if (computePercent >= maxComputePercent)
          parts.add("$computeLabel %.1f%% >= %.0f%%".format(computePercent, maxComputePercent))
      if (ramPercent >= maxRAMPercent)
          parts.add("RAM %.1f%% >= %.0f%%".format(ramPercent, maxRAMPercent))

      return if (parts.isEmpty()) null else parts.joinToString(", ")
    }

    fun estimateWaitSeconds(): Int {
      return (((computePercent - maxComputePercent).coerceAtLeast(0.0) +
              (ramPercent - maxRAMPercent).coerceAtLeast(0.0)) / 5.0)
          .toInt()
          .coerceIn(5, 120)
    }

    fun shutdown() {
      running = false

      interrupt()
    }
  }

  // endregion Resource Monitor
}
