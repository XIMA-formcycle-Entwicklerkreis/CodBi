package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai

// region Imports
// region XIMA
// endregion XIMA
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.AI
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import java.io.BufferedReader
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.io.InputStreamReader
import java.io.RandomAccessFile
import java.net.HttpURLConnection
import java.net.ServerSocket
import java.net.URI
import java.util.zip.ZipInputStream

// endregion Imports
/**
 * # Base class for AI models served via a local LLAMA server process.
 *
 * ## Phases
 * 1. **Intelligence** — Detect OS (`os.name`) and architecture (`os.arch`)
 * 2. **Fetch** — Download the correct LLAMA-Server binary + GGUF model (with resume support)
 * 3. **Ignition** — Launch the server via [ProcessBuilder] on a local port
 * 4. **Request** — All inference goes through `http://127.0.0.1:{port}/v1/chat/completions`.
 *
 * ## Crash isolation
 * Because the AI runs in a **separate OS process**, if the model runs out of RAM, the OS kills the
 * LLAMA-Server process but the Formcycle Tomcat JVM does not even feel a bump.
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
    /** How long to wait for the server to become healthy after launch. */
    private const val SERVER_START_TIMEOUT_MS = 120_000L
    /** Interval between health-check polls during startup. */
    private const val HEALTH_POLL_INTERVAL_MS = 1_000L
    /** Buffer size for resumable downloads (64 KB). */
    private const val DOWNLOAD_BUFFER_SIZE = 65_536
    /** User-Agent for download requests. */
    private const val USER_AGENT = "CodBi-LLAMA/1.0"
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
  /** The running LLAMA-Server [Process], or `null` if not started. */
  @Volatile protected var serverProcess: Process? = null
  /** Thread that consumes server stdout. */
  private var stdoutThread: Thread? = null
  /** Thread that consumes server stderr. */
  private var stderrThread: Thread? = null
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

  /** Initializes this [AI] by setting its idLogMessages to `LLAMA`. */
  init {
    idLogMessages = "LLAMA"
  }

  // endregion State-Management
  // region OS Detection
  /**
   * Represents a detected server platform.
   *
   * @property os Normalized OS name: `windows`, `linux`, or `macos`.
   * @property arch Normalized architecture: `x86_64`, `aarch64`.
   * @property exeName The expected executable name on this platform.
   */
  data class Platform(val os: String, val arch: String, val exeName: String) {
    val needsChmod: Boolean // True if the server binary needs `chmod +x` before it can be executed.
      get() = os != "windows"
  }

  /**
   * Detected GPU backend on the current system. Used to select the correct LLAMA-Server binary
   * variant.
   */
  enum class GpuBackend {
    /** No GPU or GPU detection disabled. Use CPU-only binary. */
    NONE,
    /** NVIDIA GPU detected via `nvidia-smi`. Use CUDA binary. */
    CUDA,
    /** Vulkan-capable GPU detected via `vulkaninfo`. Works with AMD, Intel, and NVIDIA. */
    VULKAN
  }

  /**
   * Detects the current server platform from JVM system properties.
   *
   * @return The detected [Platform].
   */
  protected fun detectPlatform(): Platform {
    val osName = System.getProperty("os.name").lowercase()
    val osArch = System.getProperty("os.arch").lowercase()

    val os =
        when {
          osName.contains("win") -> "windows"
          osName.contains("mac") || osName.contains("darwin") -> "macos"
          else -> "linux"
        }
    val arch =
        when {
          osArch.contains("aarch") || osArch == "arm64" -> "aarch64"
          osArch.contains("64") -> "x86_64"
          else -> "x86_64" // fallback
        }
    val exeName = if (os == "windows") "llama-server.exe" else "LLAMA-Server"

    log(LogLevel.INFO, "Detected platform: $os / $arch → binary: $exeName")

    return Platform(os, arch, exeName)
  }

  /**
   * Detects the best available GPU backend on the current system.
   *
   * Detection order:
   * 1. **NVIDIA CUDA** — Runs `nvidia-smi` and checks for a valid GPU name.
   * 2. **Vulkan** — Runs `vulkaninfo --summary` and checks for a GPU device.
   * 3. **NONE** — If neither is available, falls back to CPU-only.
   *
   * MacOS is excluded because llama.cpp uses Metal natively (the standard macOS binary already
   * includes Metal/GPU support, no separate build is needed).
   *
   * @return The detected [GpuBackend].
   */
  protected fun detectGpu(): GpuBackend {
    val osName = System.getProperty("os.name").lowercase()

    if (osName.contains("mac") || osName.contains("darwin")) {
      log(LogLevel.INFO, "GPU detection: macOS — Metal is built into the standard binary")

      return GpuBackend.NONE
    }

    try {
      val proc =
          ProcessBuilder("nvidia-smi", "--query-gpu=name", "--format=csv,noheader")
              .redirectErrorStream(true)
              .start()
      val output = proc.inputStream.bufferedReader().readText().trim()
      val exitCode = proc.waitFor()

      if (exitCode == 0 && output.isNotBlank() && !output.contains("failed", ignoreCase = true)) {
        log(LogLevel.INFO, "GPU detection: NVIDIA CUDA available — $output")

        return GpuBackend.CUDA
      }
    } catch (X: Exception) {}

    try {
      val proc = ProcessBuilder("vulkaninfo", "--summary").redirectErrorStream(true).start()
      val output = proc.inputStream.bufferedReader().readText().trim()
      val exitCode = proc.waitFor()

      if (exitCode == 0 && output.contains("deviceName", ignoreCase = true)) {
        val deviceMatch =
            Regex("""deviceName\s*=\s*(.+)""", RegexOption.IGNORE_CASE)
                .find(output)
                ?.groupValues
                ?.get(1)
                ?.trim()
        log(LogLevel.INFO, "GPU detection: Vulkan available — ${deviceMatch ?: "device found"}")

        return GpuBackend.VULKAN
      }
    } catch (X: Exception) {}

    log(LogLevel.INFO, "GPU detection: no GPU backend found — using CPU-only")

    return GpuBackend.NONE
  }

  /**
   * Detects the number of physical CPU cores (not hyper-threaded logical processors). Falls back to
   * [Runtime.availableProcessors] if detection fails.
   *
   * @return The number of physical CPU cores.
   */
  protected fun detectPhysicalCores(): Int {
    return try {
      val os = System.getProperty("os.name").lowercase()
      val (command, regex) =
          if (os.contains("win")) {
            listOf("wmic", "cpu", "get", "NumberOfCores", "/value") to
                Regex("""NumberOfCores=(\d+)""")
          } else {
            listOf("nproc", "--all") to Regex("""(\d+)""")
          }
      val process = ProcessBuilder(command).redirectErrorStream(true).start()
      val output = process.inputStream.bufferedReader().readText()
      process.waitFor()
      regex.find(output)?.groupValues?.get(1)?.toIntOrNull()
          ?: Runtime.getRuntime().availableProcessors()
    } catch (X: Exception) {
      Runtime.getRuntime().availableProcessors()
    }
  }

  // endregion OS Detection

  // region Download with Resume
  /**
   * Downloads a file from [url] to [targetFile] with **HTTP Range resume** support.
   *
   * If the target file already exists partially (e.g., from a previous interrupted download), it
   * sends a `Range: bytes=<existing>-` header so the server continues from where it left off. If
   * the server does not support Range requests (no 206 response), the file is re-downloaded from
   * the beginning.
   *
   * @param url The URL to download.
   * @param targetFile The destination file.
   * @param label A human-readable label for log messages (e.g., "GGUF model").
   * @return `true` if the download succeeded (or the file already existed at full size).
   *
   * The method also creates a marker file (`<targetFile>.complete`) upon successful completion,
   * which is used to quickly check.
   */
  protected fun downloadWithResume(url: String, targetFile: File, label: String): Boolean {
    val markerFile = File(targetFile.parent, "${targetFile.name}.complete")

    if (targetFile.exists() && markerFile.exists()) {
      val sizeMB = "%.1f".format(targetFile.length() / (1024.0 * 1024.0))

      log(LogLevel.INFO, "$label already downloaded ($sizeMB MB): ${targetFile.name}")

      return true
    }

    targetFile.parentFile?.mkdirs()

    val existingBytes = if (targetFile.exists()) targetFile.length() else 0L

    log(
        LogLevel.INFO,
        "$label: starting download from $url" +
            (if (existingBytes > 0)
                " (resuming from ${"%.1f".format(existingBytes / (1024.0 * 1024.0))} MB)"
            else ""))

    try {
      val connection = URI(url).toURL().openConnection() as HttpURLConnection

      connection.connectTimeout = 30_000
      connection.readTimeout = 600_000
      connection.setRequestProperty("User-Agent", USER_AGENT)
      connection.instanceFollowRedirects = true

      if (existingBytes > 0) {
        connection.setRequestProperty("Range", "bytes=$existingBytes-")
      }

      connection.connect()

      val responseCode = connection.responseCode

      when (responseCode) {
        HttpURLConnection.HTTP_PARTIAL -> {
          log(
              LogLevel.INFO,
              "$label: server supports resume (206), continuing from byte $existingBytes")
          appendStreamToFile(
              connection.inputStream,
              targetFile,
              label,
              existingBytes,
              existingBytes + connection.contentLengthLong)
        }

        HttpURLConnection.HTTP_OK -> {
          val totalSize = connection.contentLengthLong

          if (existingBytes > 0 && existingBytes == totalSize) {
            log(
                LogLevel.INFO,
                "$label: file already complete (${"%.1f".format(totalSize / (1024.0 * 1024.0))} MB)")
          } else {
            if (existingBytes > 0) {
              log(
                  LogLevel.INFO,
                  "$label: server does not support resume, re-downloading from scratch")
            }

            writeStreamToFile(connection.inputStream, targetFile, label, totalSize)
          }
        }

        HttpURLConnection.HTTP_MOVED_TEMP,
        HttpURLConnection.HTTP_MOVED_PERM,
        HttpURLConnection.HTTP_SEE_OTHER,
        307,
        308 -> {
          val redirectUrl = connection.getHeaderField("Location")

          connection.disconnect()

          if (redirectUrl != null) {
            log(LogLevel.INFO, "$label: following redirect → $redirectUrl")
            return downloadWithResume(redirectUrl, targetFile, label)
          } else {
            log(LogLevel.ERROR, "$label: redirect with no Location header (HTTP $responseCode)")

            return false
          }
        }

        HttpURLConnection.HTTP_ENTITY_TOO_LARGE,
        416 -> {
          // 416 Range Not Satisfiable — file is probably already complete
          log(LogLevel.INFO, "$label: HTTP 416 — existing file is likely complete")
        }
        else -> {
          log(LogLevel.ERROR, "$label: download failed — HTTP $responseCode")
          connection.disconnect()

          return false
        }
      }

      connection.disconnect()
      markerFile.writeText("${targetFile.length()}")

      val sizeMB = "%.1f".format(targetFile.length() / (1024.0 * 1024.0))

      log(LogLevel.INFO, "$label: download complete ($sizeMB MB)")

      return true
    } catch (X: Exception) {
      val partialMB = "%.1f".format(targetFile.length() / (1024.0 * 1024.0))

      log(
          LogLevel.ERROR,
          "$label: download failed at $partialMB MB — ${X.message}. " +
              "The download will resume on next startup.",
          "",
          X)
      return false
    }
  }

  /**
   * Writes an input stream to a file from scratch, logging progress.
   *
   * @param input The source stream to read from.
   * @param target The destination file (overwritten if it exists).
   * @param label A human-readable label for log messages.
   * @param totalSize Expected total size in bytes (for progress logging). Use `0` if unknown.
   */
  private fun writeStreamToFile(input: InputStream, target: File, label: String, totalSize: Long) {
    FileOutputStream(target, false).use { output ->
      val buffer = ByteArray(DOWNLOAD_BUFFER_SIZE)
      var bytesWritten = 0L
      var lastLogPercent = -1
      var read: Int

      while (input.read(buffer).also { read = it } != -1) {
        output.write(buffer, 0, read)
        bytesWritten += read

        if (totalSize > 0) {
          val pct = (bytesWritten * 100 / totalSize).toInt()

          if (pct != lastLogPercent && pct % 10 == 0) {
            log(
                LogLevel.INFO,
                "$label: $pct% (${"%.0f".format(bytesWritten / (1024.0 * 1024.0))} / " +
                    "${"%.0f".format(totalSize / (1024.0 * 1024.0))} MB)")
            lastLogPercent = pct
          }
        }
      }
    }
  }

  /**
   * Appends an input stream to an existing file (for resume), logging progress.
   *
   * @param input The source stream to read from.
   * @param target The destination file to append to.
   * @param label A human-readable label for log messages.
   * @param startOffset Byte offset where appending starts (i.e. the existing file size).
   * @param totalSize Expected total size in bytes (for progress logging).
   */
  private fun appendStreamToFile(
      input: InputStream,
      target: File,
      label: String,
      startOffset: Long,
      totalSize: Long
  ) {
    RandomAccessFile(target, "rw").use { raf ->
      raf.seek(startOffset)

      val buffer = ByteArray(DOWNLOAD_BUFFER_SIZE)
      var bytesWritten = startOffset
      var lastLogPercent = -1
      var read: Int

      while (input.read(buffer).also { read = it } != -1) {
        raf.write(buffer, 0, read)
        bytesWritten += read

        if (totalSize > 0) {
          val pct = (bytesWritten * 100 / totalSize).toInt()

          if (pct != lastLogPercent && pct % 10 == 0) {
            log(
                LogLevel.INFO,
                "$label: $pct% (resumed, ${"%.0f".format(bytesWritten / (1024.0 * 1024.0))} / " +
                    "${"%.0f".format(totalSize / (1024.0 * 1024.0))} MB)")
            lastLogPercent = pct
          }
        }
      }
    }
  }

  /**
   * Extracts a ZIP archive to a target directory. Used for LLAMA-Server binary archives from GitHub
   * releases.
   *
   * @param zipFile The ZIP archive to extract.
   * @param targetDir The directory to extract into (created if it does not exist).
   */
  protected fun extractZip(zipFile: File, targetDir: File) {
    log(LogLevel.INFO, "Extracting ${zipFile.name} → ${targetDir.absolutePath}")

    targetDir.mkdirs()
    val canonicalTarget = targetDir.canonicalPath
    ZipInputStream(zipFile.inputStream()).use { zis ->
      var entry = zis.nextEntry

      while (entry != null) {
        val outFile = File(targetDir, entry.name)

        if (!outFile.canonicalPath.startsWith(canonicalTarget + File.separator) &&
            outFile.canonicalPath != canonicalTarget) {
          throw SecurityException("Zip Slip: entry '${entry.name}' escapes target directory")
        }

        if (entry.isDirectory) {
          outFile.mkdirs()
        } else {
          outFile.parentFile?.mkdirs()
          FileOutputStream(outFile).use { out -> zis.copyTo(out) }
        }

        zis.closeEntry()

        entry = zis.nextEntry
      }
    }

    log(LogLevel.INFO, "Extraction complete")
  }

  /**
   * Extracts a .tar.gz archive to a target directory. Used for LLAMA-Server binary archives for
   * Linux/macOS.
   *
   * @param tarGzFile The tar.gz archive to extract.
   * @param targetDir The directory to extract into (created if it does not exist).
   */
  protected fun extractTarGz(tarGzFile: File, targetDir: File) {
    log(LogLevel.INFO, "Extracting ${tarGzFile.name} → ${targetDir.absolutePath}")

    targetDir.mkdirs()

    // Pre-scan: reject archives containing directory-traversal entries
    val listPb = ProcessBuilder("tar", "tzf", tarGzFile.absolutePath)
    listPb.redirectErrorStream(true)
    val listProcess = listPb.start()
    val entries = listProcess.inputStream.bufferedReader().readText()
    listProcess.waitFor()
    val traversalEntry = entries.lineSequence().firstOrNull { it.contains("..") }
    if (traversalEntry != null) {
      throw SecurityException("Zip Slip: tar entry '$traversalEntry' contains directory traversal")
    }

    val pb = ProcessBuilder("tar", "xzf", tarGzFile.absolutePath, "-C", targetDir.absolutePath)

    pb.redirectErrorStream(true)

    val process = pb.start()
    val output = process.inputStream.bufferedReader().readText()
    val exitCode = process.waitFor()

    if (exitCode != 0) {
      log(LogLevel.WARNING, "tar extraction exit code $exitCode: $output")
    }

    log(LogLevel.INFO, "Extraction complete")
  }

  /**
   * Finds an executable file recursively within a directory, matching [exeName]. Handles archives
   * that place the binary in a nested subdirectory.
   *
   * @param dir The root directory to search.
   * @param exeName The executable file name to find (e.g. `"llama-server.exe"`).
   * @return The executable [File], or `null` if not found.
   */
  protected fun findExecutable(dir: File, exeName: String): File? {
    return dir.walkTopDown().find { it.name == exeName && it.isFile }
  }

  // endregion Download with Resume
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
  // region ProcessBuilder
  /**
   * Starts the LLAMA-Server process with the given model file.
   *
   * @param binary The LLAMA-Server executable.
   * @param modelFile The GGUF model file to load.
   * @param mmProjFile Optional: the multimodal projector file (for VLMs).
   * @return `true` if the server started and passed health checks.
   */
  protected fun startServer(binary: File, modelFile: File, mmProjFile: File? = null): Boolean {
    if (serverProcess != null) {
      log(LogLevel.WARNING, "Server already running — stopping first")

      stopServer()
    }

    serverPort = findFreePort(serverPort)
    activeServerPort = serverPort

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

      templateFile.writeText(
          """{%- if messages[0].role == 'system' %}{%- set system_message = messages[0].content %}{%- set loop_messages = messages[1:] %}{%- else %}{%- set system_message = 'You are a helpful assistant.' %}{%- set loop_messages = messages %}{%- endif %}{{- '<|im_start|>system\n' + system_message + '<|im_end|>\n' }}{%- for message in loop_messages %}{%- if message.role == 'user' %}{%- if message.content is string %}{{- '<|im_start|>user\n' + message.content + '<|im_end|>\n' }}{%- else %}{{- '<|im_start|>user\n' }}{%- for part in message.content %}{%- if part.type == 'text' %}{{- part.text }}{%- endif %}{%- endfor %}{{- '<|im_end|>\n' }}{%- endif %}{%- elif message.role == 'assistant' %}{%- if message.reasoning_content is defined and message.reasoning_content is not none %}{{- '<|im_start|>assistant\n<think>\n' + message.reasoning_content + '\n</think>\n' + message.content + '<|im_end|>\n' }}{%- else %}{{- '<|im_start|>assistant\n' + message.content + '<|im_end|>\n' }}{%- endif %}{%- endif %}{%- endfor %}{%- if add_generation_prompt %}{{- '<|im_start|>assistant\n' }}{%- if enable_thinking is defined and enable_thinking is true %}{{- '<think>\n' }}{%- endif %}{%- endif %}"""
              .trimIndent())
      command.addAll(listOf("--chat-template-file", templateFile.absolutePath))

      log(LogLevel.INFO, "  Template: ${templateFile.absolutePath} (Qwen3 override)")
    } else {
      log(LogLevel.INFO, "  Template: using GGUF-embedded template")
    }

    if (mmProjFile != null && mmProjFile.exists()) {
      command.addAll(listOf("--mmproj", mmProjFile.absolutePath))
    }

    command.addAll(extraServerArgs)

    log(LogLevel.INFO, "Command: ${command.joinToString(" ")}")

    try {
      val pb = ProcessBuilder(command)

      pb.directory(binary.parentFile)
      pb.redirectErrorStream(false)
      pb.environment()["LLAMA_LOG_TIMESTAMPS"] = "1"

      val process = pb.start()

      this.serverProcess = process

      stdoutThread =
          Thread(
                  {
                    try {
                      BufferedReader(InputStreamReader(process.inputStream)).use { reader ->
                        reader.lineSequence().forEach { line ->
                          log(LogLevel.INFO, "[LLAMA-Server] $line")
                        }
                      }
                    } catch (X: Exception) {}
                  },
                  "llama-stdout")
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
                          log(LogLevel.INFO, "[LLAMA-Server/err] $line")
                        }
                      }
                    } catch (X: Exception) {}
                  },
                  "llama-stderr")
              .apply {
                isDaemon = true

                start()
              }

      val healthy = waitForHealth()

      if (!healthy) {
        log(
            LogLevel.ERROR,
            "LLAMA-Server failed to become healthy within ${SERVER_START_TIMEOUT_MS / 1000}s")
        stopServer()

        return false
      }

      log(LogLevel.INFO, "LLAMA-Server is healthy and ready on port $serverPort")

      return true
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Failed to start LLAMA-Server: ${X.message}", "", X)
      stopServer()

      return false
    }
  }

  /**
   * Finds a free TCP port starting from [preferredPort]. Probes upward (up to 20 attempts) until an
   * available port is found. Falls back to an OS-assigned ephemeral port if all probed ports are
   * busy.
   *
   * @param preferredPort The first port to try.
   * @return An available TCP port.
   */
  private fun findFreePort(preferredPort: Int): Int {
    for (offset in 0 until 20) {
      val candidate = preferredPort + offset

      if (candidate > 65535) break
      try {
        ServerSocket(candidate).use { /* port is free */ }

        if (offset > 0) {
          log(LogLevel.INFO, "Port $preferredPort is busy — using $candidate instead")
        }

        return candidate
      } catch (X: Exception) {}
    }

    return try {
      ServerSocket(0)
          .use { it.localPort }
          .also { port ->
            log(
                LogLevel.WARNING,
                "Ports $preferredPort–${preferredPort + 19} all busy — OS assigned port $port")
          }
    } catch (X: Exception) {
      log(
          LogLevel.WARNING,
          "Could not find free port, falling back to $preferredPort: ${X.message}")

      preferredPort
    }
  }

  /**
   * Polls the LLAMA-Server `/health` endpoint until it reports `ok`, or times out.
   *
   * @return `true` if the server became healthy within [SERVER_START_TIMEOUT_MS].
   */
  private fun waitForHealth(): Boolean {
    val deadline = System.currentTimeMillis() + SERVER_START_TIMEOUT_MS
    var lastError = ""

    while (System.currentTimeMillis() < deadline) {
      // Check if process died
      serverProcess?.let { proc ->
        if (!proc.isAlive) {
          log(LogLevel.ERROR, "LLAMA-Server process died (exit code: ${proc.exitValue()})")

          return false
        }
      }

      try {
        val connection =
            URI("http://127.0.0.1:$serverPort/health").toURL().openConnection() as HttpURLConnection

        connection.connectTimeout = 2_000
        connection.readTimeout = 2_000
        connection.requestMethod = "GET"

        val responseCode = connection.responseCode
        val body =
            try {
              connection.inputStream.bufferedReader().readText()
            } catch (X: Exception) {
              ""
            }

        connection.disconnect()

        if (responseCode == 200) {
          if (body.contains("ok", ignoreCase = true) || body.contains("\"status\"")) {
            return true
          }
        }

        lastError = "HTTP $responseCode: $body"
      } catch (X: Exception) {
        lastError = X.message ?: "connection refused"
      }

      Thread.sleep(HEALTH_POLL_INTERVAL_MS)
    }

    log(LogLevel.ERROR, "Health check timed out. Last error: $lastError")

    return false
  }

  /**
   * Stops the LLAMA-Server process gracefully. Tries `destroy()` first, then `destroyForcibly()`.
   */
  protected fun stopServer() {
    serverProcess?.let { proc ->
      log(LogLevel.INFO, "Stopping LLAMA-Server...")

      try {
        proc.destroy()

        if (!proc.waitFor(10, java.util.concurrent.TimeUnit.SECONDS)) {
          log(LogLevel.WARNING, "Graceful shutdown timed out — force killing")

          proc.destroyForcibly()
          proc.waitFor(5, java.util.concurrent.TimeUnit.SECONDS)
        }

        log(LogLevel.INFO, "LLAMA-Server stopped (exit code: ${proc.exitValue()})")
      } catch (X: Exception) {
        log(LogLevel.WARNING, "Error stopping LLAMA-Server: ${X.message}", "", X)

        try {
          proc.destroyForcibly()
        } catch (X: Exception) {}
      }
    }

    serverProcess = null
    stdoutThread = null
    stderrThread = null
  }

  /**
   * Checks if the server process is alive.
   *
   * @return `true` if the [serverProcess] is running.
   */
  protected fun isServerAlive(): Boolean = serverProcess?.isAlive == true

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

  // region Request
  /** The base URL for the local LLAMA-Server API. */
  protected val serverBaseUrl: String
    get() = "http://127.0.0.1:$serverPort"

  /**
   * Base URL for a specific port.
   *
   * @param port The port number.
   * @return The base URL string.
   */
  protected fun serverBaseUrl(port: Int): String = "http://127.0.0.1:$port"

  /**
   * Sends a POST request to the LLAMA-Server and returns the response body.
   *
   * @param endpoint The API endpoint path (e.g., `/v1/chat/completions`).
   * @param jsonBody The JSON request body.
   * @param timeoutMs Read timeout in milliseconds.
   * @param port Optional port override. Defaults to [serverPort].
   * @return The response body as a String.
   * @throws Exception on connection/IO errors.
   */
  protected fun httpPost(
      endpoint: String,
      jsonBody: String,
      timeoutMs: Int = 300_000,
      port: Int = serverPort
  ): String {
    val url = "${serverBaseUrl(port)}$endpoint"
    val connection = URI(url).toURL().openConnection() as HttpURLConnection

    connection.requestMethod = "POST"
    connection.doOutput = true
    connection.connectTimeout = 5_000
    connection.readTimeout = timeoutMs
    connection.setRequestProperty("Content-Type", "application/json")
    connection.setRequestProperty("Accept", "application/json")
    connection.outputStream.use { os -> os.write(jsonBody.toByteArray(Charsets.UTF_8)) }

    val responseCode = connection.responseCode
    val body =
        try {
          (if (responseCode in 200..299) connection.inputStream else connection.errorStream)
              .bufferedReader()
              .readText()
        } catch (X: Exception) {
          ""
        }

    connection.disconnect()

    if (responseCode !in 200..299) {
      throw RuntimeException("LLAMA-Server returned HTTP $responseCode: $body")
    }

    return body
  }

  /**
   * Sends a POST request to the LLAMA-Server and returns the response as a stream of lines (for
   * Server-Sent Events / SSE streaming).
   *
   * @param endpoint The API endpoint path.
   * @param jsonBody The JSON request body (should include `"stream": true`).
   * @param onLine Callback invoked for each SSE `data: ` line as it arrives.
   * @param shouldStop Callback that returns `true` to abort streaming early.
   * @param timeoutMs Read timeout in milliseconds.
   * @param port Optional port override. Defaults to [serverPort].
   * @throws RuntimeException if the server returns a non-2xx status code.
   */
  protected fun httpPostStreaming(
      endpoint: String,
      jsonBody: String,
      onLine: (String) -> Unit,
      shouldStop: () -> Boolean = { false },
      timeoutMs: Int = 300_000,
      port: Int = serverPort
  ) {
    val url = "${serverBaseUrl(port)}$endpoint"
    val connection = URI(url).toURL().openConnection() as HttpURLConnection

    connection.requestMethod = "POST"
    connection.doOutput = true
    connection.connectTimeout = 5_000
    connection.readTimeout = timeoutMs
    connection.setRequestProperty("Content-Type", "application/json")
    connection.setRequestProperty("Accept", "text/event-stream")
    connection.outputStream.use { os -> os.write(jsonBody.toByteArray(Charsets.UTF_8)) }

    val responseCode = connection.responseCode

    if (responseCode !in 200..299) {
      val errorBody =
          try {
            connection.errorStream.bufferedReader().readText()
          } catch (X: Exception) {
            ""
          }

      connection.disconnect()

      throw RuntimeException("LLAMA-Server returned HTTP $responseCode: $errorBody")
    }

    try {
      BufferedReader(InputStreamReader(connection.inputStream, Charsets.UTF_8)).use { reader ->
        reader.lineSequence().forEach { line ->
          if (shouldStop()) {
            log(LogLevel.INFO, "Streaming aborted by stop request — disconnecting")

            return@use
          }

          if (line.startsWith("data: ")) {
            val data = line.removePrefix("data: ").trim()

            if (data != "[DONE]") {
              onLine(data)
            }
          }
        }
      }
    } finally {
      connection.disconnect()
    }
  }

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
        activeServerPort = it
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
        ?.let { extraServerArgs = it.split(" ").filter { arg -> arg.isNotBlank() } }

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
  // region Logging
  override fun log(importance: LogLevel, toLog: String, adjenct: String, exception: Throwable?) {
    super.idLogMessages = "LLAMA"
    super.log(importance, toLog, adjenct, exception)
  }
  // endregion Logging
}
