package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI.LogLevel
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

// ═══════════════════════════════════════════════════════════════════════════════
//  LLAMA — "Swan Architecture" base class
// ═══════════════════════════════════════════════════════════════════════════════
//
// Manages the full lifecycle of a llama.cpp server running as an external OS
// process. Subclasses only need to specify WHAT to download (model GGUF, mmproj)
// and HOW to configure the server (context size, GPU layers, etc.).
//
// ┌────────────────────────────────────────────────────────────────────┐
// │  Formcycle JVM (Tomcat)                                           │
// │  ┌──────────────────────────────────────────────────────────────┐ │
// │  │  CodBi Plugin                                                │ │
// │  │   ├─ initialize()  → detect OS → download → ProcessBuilder  │ │
// │  │   ├─ execute()     → HTTP POST to 127.0.0.1:port            │ │
// │  │   └─ shutdown()    → process.destroy()                      │ │
// │  └──────────────────────────────────────────────────────────────┘ │
// │                         ↕  HTTP (localhost only)                  │
// │  ┌──────────────────────────────────────────────────────────────┐ │
// │  │  llama-server  (separate OS process)                         │ │
// │  │   ├─ GGUF model loaded in native C++ memory                 │ │
// │  │   ├─ OpenAI-compatible API on 127.0.0.1:port                │ │
// │  │   └─ If OOM → OS kills THIS process, Tomcat stays alive     │ │
// │  └──────────────────────────────────────────────────────────────┘ │
// └────────────────────────────────────────────────────────────────────┘
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * # Base class for AI models served via a local llama.cpp server process.
 *
 * This class implements the "Swan Architecture": a graceful one-click experience for the user, with
 * complex orchestration hidden underneath.
 *
 * ## Phases
 * 1. **Intelligence** — Detect OS (`os.name`) and architecture (`os.arch`)
 * 2. **Fetch** — Download the correct llama-server binary + GGUF model (with resume support)
 * 3. **Ignition** — Launch the server via [ProcessBuilder] on a local port
 * 4. **Request** — All inference goes through `http://127.0.0.1:{port}/v1/chat/completions`
 *
 * ## Crash isolation
 * Because the AI runs in a **separate OS process**, if the model runs out of RAM, the OS kills the
 * llama-server process — but the Formcycle Tomcat JVM does not even feel a bump.
 *
 * ## Plugin properties
 * | Property                 | Default        | Description                                        |
 * |--------------------------|----------------|----------------------------------------------------|
 * | `Active_AI`              | —              | Must contain `llamacpp`                            |
 * | `AI_Remove`              | —              | If contains `llamacpp`, clean up all               |
 * | `AI_LlamaCpp_Port`       | `8392`         | Local port for llama-server                        |
 * | `AI_LlamaCpp_Threads`    | physical cores | Number of CPU threads                              |
 * | `AI_LlamaCpp_CtxSize`    | `32768`        | Context window size (shared across parallel slots) |
 * | `AI_LlamaCpp_GpuLayers`  | auto-detect    | Layers offloaded to GPU (-1 = auto)                |
 * | `AI_LlamaCpp_Release`    | `b8175`        | llama.cpp release tag for downloads                |
 * | `AI_LlamaCpp_ServerArgs` | —              | Extra CLI args for llama-server                    |
 *
 * ## DSGVO / EU-AI Act
 * All data stays on the local machine. No external API calls. Same compliance advantages as all
 * other CodBi AI implementations — see [AI] for details.
 */
abstract class LLAMA : AI() {

  companion object {
    /** How long to wait for the server to become healthy after launch. */
    private const val SERVER_START_TIMEOUT_MS = 120_000L

    /** Interval between health-check polls during startup. */
    private const val HEALTH_POLL_INTERVAL_MS = 1_000L

    /** Buffer size for resumable downloads (64 KB). */
    private const val DOWNLOAD_BUFFER_SIZE = 65_536

    /** User-Agent for download requests. */
    private const val USER_AGENT = "CodBi-LLAMA/1.0"

    /** Default llama-server release tag for download URLs. */
    private const val DEFAULT_LLAMA_RELEASE = "b8175"

    /**
     * The port currently used by the active llama-server instance. Set when a [LLAMA] subclass
     * configures its [serverPort]. Used by [AiProxy] to route requests. `0` means no server is
     * configured yet.
     */
    @Volatile
    @JvmStatic
    var activeServerPort: Int = 0
      internal set
  }

  // ── Configuration (set by subclass or plugin properties) ─────────────

  /** Port the llama-server will listen on. */
  protected var serverPort: Int = 8392

  /** Number of CPU threads for the server. `null` = auto-detect physical cores. */
  protected var threadCount: Int? = null

  /** Context window size in tokens. */
  protected var ctxSize: Int = 32768

  /**
   * Number of model layers to offload to GPU.
   * - `-1` = auto-detect (all layers offloaded when GPU is available, 0 otherwise)
   * - `0` = pure CPU
   * - `N` = offload exactly N layers
   */
  protected var gpuLayers: Int = -1

  /** The detected GPU backend, populated during [detectGpu]. */
  protected var detectedGpu: GpuBackend = GpuBackend.NONE

  /** Additional CLI arguments appended to the llama-server command. */
  protected var extraServerArgs: List<String> = emptyList()

  /** Maximum concurrent requests (slots) the server serves. */
  protected var parallelSlots: Int = 4

  // ── Server binary download URLs ──────────────────────────────────────

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

  /** Builds the platform→URL map for a given llama.cpp release tag (CPU-only). */
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
   * @return A pair of (serverBinaryUrl, cudaDllUrl?). cudaDllUrl is non-null only for CUDA builds.
   */
  private fun resolveServerUrl(
      release: String,
      platformKey: String,
      gpuBackend: GpuBackend
  ): Pair<String, String?> {
    val base = "https://github.com/ggml-org/llama.cpp/releases/download/$release"

    // macOS: standard binary already includes Metal/GPU — always use it
    if (platformKey.startsWith("macos")) {
      return Pair(serverUrls[platformKey] ?: buildServerUrls(release)[platformKey]!!, null)
    }

    if (gpuBackend == GpuBackend.CUDA) {
      return when (platformKey) {
        "windows_x86_64" ->
            Pair(
                "$base/llama-$release-bin-win-cuda-12.4-x64.zip",
                "$base/cudart-llama-bin-win-cuda-12.4-x64.zip")
        "linux_x86_64" ->
            Pair(
                "$base/llama-$release-bin-ubuntu-vulkan-x64.tar.gz",
                null) // Linux CUDA builds are not consistently available — use Vulkan as NVIDIA
        // fallback
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

  // ── State ────────────────────────────────────────────────────────────

  /** The running llama-server [Process], or `null` if not started. */
  @Volatile protected var serverProcess: Process? = null

  /** Thread that consumes server stdout. */
  private var stdoutThread: Thread? = null

  /** Thread that consumes server stderr. */
  private var stderrThread: Thread? = null

  /** Whether this instance is active and the server is running. */
  @Volatile protected var isActive = false

  /** The server binary executable file. */
  protected var serverBinary: File? = null

  /** Root directory for llama.cpp files under the plugin folder. */
  protected var llamaCppDir: File? = null

  /** Directory where model files (GGUF) are stored. */
  protected var modelsDir: File? = null

  /** Directory where the server binary is stored. */
  protected var binDir: File? = null

  init {
    idLogMessages = "LLAMA"
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Phase 1 — Intelligence (OS Detection)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Represents a detected server platform.
   *
   * @property os Normalized OS name: `windows`, `linux`, or `macos`.
   * @property arch Normalized architecture: `x86_64`, `aarch64`.
   * @property exeName The expected executable name on this platform.
   */
  data class Platform(val os: String, val arch: String, val exeName: String) {
    /** True if the server binary needs `chmod +x` before it can be executed. */
    val needsChmod: Boolean
      get() = os != "windows"
  }

  /**
   * Detected GPU backend on the current system. Used to select the correct llama-server binary
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

  /** Detects the current server platform from JVM system properties. */
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
    val exeName = if (os == "windows") "llama-server.exe" else "llama-server"

    log(LogLevel.INFO, "Detected platform: $os / $arch → binary: $exeName")
    return Platform(os, arch, exeName)
  }

  /**
   * Detects the best available GPU backend on the current system.
   *
   * Detection order:
   * 1. **NVIDIA CUDA** — runs `nvidia-smi` and checks for a valid GPU name.
   * 2. **Vulkan** — runs `vulkaninfo --summary` and checks for a GPU device.
   * 3. **NONE** — if neither is available, falls back to CPU-only.
   *
   * macOS is excluded because llama.cpp uses Metal natively (the standard macOS binary already
   * includes Metal/GPU support, no separate build is needed).
   *
   * @return The detected [GpuBackend].
   */
  protected fun detectGpu(): GpuBackend {
    val osName = System.getProperty("os.name").lowercase()

    // macOS always uses Metal via the standard binary — no separate GPU build needed
    if (osName.contains("mac") || osName.contains("darwin")) {
      log(LogLevel.INFO, "GPU detection: macOS — Metal is built into the standard binary")
      return GpuBackend.NONE
    }

    // 1. Try NVIDIA CUDA via nvidia-smi
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
    } catch (_: Exception) {
      // nvidia-smi not found or not executable
    }

    // 2. Try Vulkan via vulkaninfo
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
    } catch (_: Exception) {
      // vulkaninfo not found or not executable
    }

    log(LogLevel.INFO, "GPU detection: no GPU backend found — using CPU-only")
    return GpuBackend.NONE
  }

  /**
   * Detects the number of physical CPU cores (not hyper-threaded logical processors). Falls back to
   * [Runtime.availableProcessors] if detection fails.
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
    } catch (_: Exception) {
      Runtime.getRuntime().availableProcessors()
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Phase 2 — Fetch (Download with Resume)
  // ═══════════════════════════════════════════════════════════════════════

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
   */
  protected fun downloadWithResume(url: String, targetFile: File, label: String): Boolean {
    // Check if already fully downloaded (using a marker file)
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
      // Follow redirects (important for GitHub/HuggingFace)
      connection.instanceFollowRedirects = true

      if (existingBytes > 0) {
        connection.setRequestProperty("Range", "bytes=$existingBytes-")
      }

      connection.connect()
      val responseCode = connection.responseCode

      when (responseCode) {
        HttpURLConnection.HTTP_PARTIAL -> {
          // Server supports resume — append to existing file
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
          // Full download (server doesn't support Range, or file was 0 bytes)
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
          // Manual redirect handling (some servers need this)
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

      // Write completion marker
      markerFile.writeText("${targetFile.length()}")
      val sizeMB = "%.1f".format(targetFile.length() / (1024.0 * 1024.0))
      log(LogLevel.INFO, "$label: download complete ($sizeMB MB)")
      return true
    } catch (e: Exception) {
      val partialMB = "%.1f".format(targetFile.length() / (1024.0 * 1024.0))
      log(
          LogLevel.ERROR,
          "$label: download failed at $partialMB MB — ${e.message}. " +
              "The download will resume on next startup.",
          "",
          e)
      return false
    }
  }

  /** Writes an input stream to a file from scratch, logging progress. */
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

  /** Appends an input stream to an existing file (for resume), logging progress. */
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
   * Extracts a ZIP archive to a target directory. Used for llama-server binary archives from GitHub
   * releases.
   */
  protected fun extractZip(zipFile: File, targetDir: File) {
    log(LogLevel.INFO, "Extracting ${zipFile.name} → ${targetDir.absolutePath}")
    targetDir.mkdirs()
    ZipInputStream(zipFile.inputStream()).use { zis ->
      var entry = zis.nextEntry
      while (entry != null) {
        val outFile = File(targetDir, entry.name)
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
   * Extracts a .tar.gz archive to a target directory. Used for llama-server binary archives for
   * Linux/macOS.
   */
  protected fun extractTarGz(tarGzFile: File, targetDir: File) {
    log(LogLevel.INFO, "Extracting ${tarGzFile.name} → ${targetDir.absolutePath}")
    targetDir.mkdirs()
    // Use system tar command for simplicity (available on Linux/macOS/modern Windows)
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
   */
  protected fun findExecutable(dir: File, exeName: String): File? {
    return dir.walkTopDown().find { it.name == exeName && it.isFile }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Server Binary Download (GPU auto-detection + download + extraction)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Downloads, extracts, and locates the llama-server binary for the current platform.
   *
   * This method handles:
   * 1. GPU detection (CUDA / Vulkan / CPU fallback)
   * 2. Release and GPU change detection (purges old downloads when the config changes)
   * 3. Download of the correct llama-server archive (with resume support)
   * 4. Download of CUDA runtime DLLs when needed (Windows + NVIDIA)
   * 5. Archive extraction (ZIP or tar.gz)
   * 6. `chmod +x` on Unix
   *
   * The result is stored in [serverBinary]. Subsequent calls skip the download if the binary is
   * already present and the release + GPU backend have not changed.
   *
   * @param platform The detected [Platform].
   * @return The llama-server binary [File], or `null` on failure.
   */
  protected fun downloadServerBinary(platform: Platform): File? {
    // Detect GPU backend
    detectedGpu = detectGpu()
    log(LogLevel.INFO, "GPU backend: $detectedGpu")

    // Check if the installed release or GPU backend changed
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

    // Resolve the best server binary URL based on detected GPU
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
      if (!downloadWithResume(serverArchiveUrl, archiveFile, "llama-server binary")) {
        log(LogLevel.ERROR, "Failed to download llama-server binary")
        return null
      }
      // Extract the archive
      val extractDir = File(binDir, "extracted")
      if (archiveFileName.endsWith(".zip")) {
        extractZip(archiveFile, extractDir)
      } else {
        extractTarGz(archiveFile, extractDir)
      }

      // Download and extract CUDA runtime DLLs if needed
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

      // Record the installed release tag and GPU backend for future change detection
      releaseMarker.writeText(llamaRelease)
      gpuMarker.writeText(detectedGpu.name)
    }

    // Find the executable
    val extractDir = File(binDir, "extracted")
    val binary = findExecutable(extractDir, platform.exeName)
    if (binary == null) {
      log(LogLevel.ERROR, "Could not find ${platform.exeName} in extracted archive")
      return null
    }

    // Make executable on Unix
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

  // ═══════════════════════════════════════════════════════════════════════
  //  Phase 3 — Ignition (ProcessBuilder)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Starts the llama-server process with the given model file.
   *
   * @param binary The llama-server executable.
   * @param modelFile The GGUF model file to load.
   * @param mmProjFile Optional: the multimodal projector file (for VLMs).
   * @return `true` if the server started and passed health checks.
   */
  protected fun startServer(binary: File, modelFile: File, mmProjFile: File? = null): Boolean {
    if (serverProcess != null) {
      log(LogLevel.WARNING, "Server already running — stopping first")
      stopServer()
    }

    // Auto-detect a free port if the configured one is already taken
    serverPort = findFreePort(serverPort)
    activeServerPort = serverPort

    val resolvedThreads = threadCount ?: detectPhysicalCores()

    // Resolve GPU layers: -1 means auto (offload everything when a GPU build is used)
    val resolvedGpuLayers =
        when {
          gpuLayers >= 0 -> gpuLayers
          detectedGpu != GpuBackend.NONE -> 999 // offload all layers; server clamps to actual count
          else -> 0
        }

    log(LogLevel.INFO, "Starting llama-server:")
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
            resolvedGpuLayers.toString())

    if (mmProjFile != null && mmProjFile.exists()) {
      command.addAll(listOf("--mmproj", mmProjFile.absolutePath))
    }

    command.addAll(extraServerArgs)

    log(LogLevel.INFO, "Command: ${command.joinToString(" ")}")

    try {
      val pb = ProcessBuilder(command)
      pb.directory(binary.parentFile)
      pb.redirectErrorStream(false)

      // Set environment for llama.cpp
      pb.environment()["LLAMA_LOG_TIMESTAMPS"] = "1"

      val process = pb.start()
      this.serverProcess = process

      // Consume stdout on a daemon thread
      stdoutThread =
          Thread(
                  {
                    try {
                      BufferedReader(InputStreamReader(process.inputStream)).use { reader ->
                        reader.lineSequence().forEach { line ->
                          log(LogLevel.INFO, "[llama-server] $line")
                        }
                      }
                    } catch (_: Exception) {
                      /* process ended */
                    }
                  },
                  "llama-stdout")
              .apply {
                isDaemon = true
                start()
              }

      // Consume stderr on a daemon thread
      stderrThread =
          Thread(
                  {
                    try {
                      BufferedReader(InputStreamReader(process.errorStream)).use { reader ->
                        reader.lineSequence().forEach { line ->
                          log(LogLevel.INFO, "[llama-server/err] $line")
                        }
                      }
                    } catch (_: Exception) {
                      /* process ended */
                    }
                  },
                  "llama-stderr")
              .apply {
                isDaemon = true
                start()
              }

      // Wait for server to become healthy
      val healthy = waitForHealth()
      if (!healthy) {
        log(
            LogLevel.ERROR,
            "llama-server failed to become healthy within ${SERVER_START_TIMEOUT_MS / 1000}s")
        stopServer()
        return false
      }

      log(LogLevel.INFO, "llama-server is healthy and ready on port $serverPort")
      return true
    } catch (e: Exception) {
      log(LogLevel.ERROR, "Failed to start llama-server: ${e.message}", "", e)
      stopServer()
      return false
    }
  }

  /**
   * Finds a free TCP port starting from [preferredPort]. Probes upward (up to 20 attempts) until an
   * available port is found. Falls back to an OS-assigned ephemeral port if all probed ports are
   * busy.
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
      } catch (_: Exception) {
        // Port is in use, try next
      }
    }
    // All probed ports busy — let the OS pick one
    return try {
      ServerSocket(0)
          .use { it.localPort }
          .also { port ->
            log(
                LogLevel.WARNING,
                "Ports $preferredPort–${preferredPort + 19} all busy — OS assigned port $port")
          }
    } catch (e: Exception) {
      log(
          LogLevel.WARNING,
          "Could not find free port, falling back to $preferredPort: ${e.message}")
      preferredPort
    }
  }

  /** Polls the llama-server `/health` endpoint until it reports `ok`, or times out. */
  private fun waitForHealth(): Boolean {
    val deadline = System.currentTimeMillis() + SERVER_START_TIMEOUT_MS
    var lastError = ""

    while (System.currentTimeMillis() < deadline) {
      // Check if process died
      serverProcess?.let { proc ->
        if (!proc.isAlive) {
          log(LogLevel.ERROR, "llama-server process died (exit code: ${proc.exitValue()})")
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
            } catch (_: Exception) {
              ""
            }
        connection.disconnect()

        if (responseCode == 200) {
          // Check if response indicates "ok" status
          if (body.contains("ok", ignoreCase = true) || body.contains("\"status\"")) {
            return true
          }
        }
        lastError = "HTTP $responseCode: $body"
      } catch (e: Exception) {
        lastError = e.message ?: "connection refused"
      }

      Thread.sleep(HEALTH_POLL_INTERVAL_MS)
    }

    log(LogLevel.ERROR, "Health check timed out. Last error: $lastError")
    return false
  }

  /**
   * Stops the llama-server process gracefully. Tries `destroy()` first, then `destroyForcibly()`.
   */
  protected fun stopServer() {
    serverProcess?.let { proc ->
      log(LogLevel.INFO, "Stopping llama-server...")
      try {
        proc.destroy()
        if (!proc.waitFor(10, java.util.concurrent.TimeUnit.SECONDS)) {
          log(LogLevel.WARNING, "Graceful shutdown timed out — force killing")
          proc.destroyForcibly()
          proc.waitFor(5, java.util.concurrent.TimeUnit.SECONDS)
        }
        log(LogLevel.INFO, "llama-server stopped (exit code: ${proc.exitValue()})")
      } catch (e: Exception) {
        log(LogLevel.WARNING, "Error stopping llama-server: ${e.message}", "", e)
        try {
          proc.destroyForcibly()
        } catch (_: Exception) {}
      }
    }
    serverProcess = null
    stdoutThread = null
    stderrThread = null
  }

  /** Checks if the server process is alive. */
  protected fun isServerAlive(): Boolean = serverProcess?.isAlive == true

  /**
   * Restarts the server (stop + start). Subclasses call this if the process dies mid-session.
   *
   * @return `true` if the restart succeeded.
   */
  protected fun restartServer(): Boolean {
    log(LogLevel.INFO, "Restarting llama-server...")
    stopServer()
    // Subclass must call startServer() again with proper files
    return false // subclass overrides with actual restart logic
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Phase 4 — HTTP Client (Request)
  // ═══════════════════════════════════════════════════════════════════════

  /** The base URL for the local llama-server API. */
  protected val serverBaseUrl: String
    get() = "http://127.0.0.1:$serverPort"

  /**
   * Sends a POST request to the llama-server and returns the response body.
   *
   * @param endpoint The API endpoint path (e.g., `/v1/chat/completions`).
   * @param jsonBody The JSON request body.
   * @param timeoutMs Read timeout in milliseconds.
   * @return The response body as a String.
   * @throws Exception on connection/IO errors.
   */
  protected fun httpPost(endpoint: String, jsonBody: String, timeoutMs: Int = 300_000): String {
    val url = "$serverBaseUrl$endpoint"
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
        } catch (_: Exception) {
          ""
        }
    connection.disconnect()

    if (responseCode !in 200..299) {
      throw RuntimeException("llama-server returned HTTP $responseCode: $body")
    }
    return body
  }

  /**
   * Sends a POST request to the llama-server and returns the response as a stream of lines (for
   * Server-Sent Events / SSE streaming).
   *
   * @param endpoint The API endpoint path.
   * @param jsonBody The JSON request body (should include `"stream": true`).
   * @param onLine Callback invoked for each SSE `data: ` line as it arrives.
   * @param timeoutMs Read timeout in milliseconds.
   */
  protected fun httpPostStreaming(
      endpoint: String,
      jsonBody: String,
      onLine: (String) -> Unit,
      shouldStop: () -> Boolean = { false },
      timeoutMs: Int = 300_000
  ) {
    val url = "$serverBaseUrl$endpoint"
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
          } catch (_: Exception) {
            ""
          }
      connection.disconnect()
      throw RuntimeException("llama-server returned HTTP $responseCode: $errorBody")
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

  // ═══════════════════════════════════════════════════════════════════════
  //  Lifecycle
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Initializes the LLAMA infrastructure: creates directories, reads plugin properties. Subclasses
   * should call `super.initialize(configData)` then proceed with downloading and starting the
   * server.
   */
  override fun initialize(configData: IPluginInitializeData) {
    super.initialize(configData)

    val activeAI = configData.properties.getProperty("Active_AI")?.lowercase() ?: ""
    if (!activeAI.contains("llamacpp")) {
      log(LogLevel.INFO, "LLAMA not activated (Active_AI does not contain 'llamacpp')")
      return
    }

    val aiRemove = configData.properties.getProperty("AI_Remove")?.lowercase() ?: ""
    if (aiRemove.contains("llamacpp")) {
      log(LogLevel.INFO, "LLAMA marked for removal — cleaning up all files")
      val llamaDir = File(configData.fileHelper.pluginFolder, "ai/llamacpp")
      if (llamaDir.exists()) llamaDir.deleteRecursively()
      return
    }

    // Set up directories
    llamaCppDir = File(configData.fileHelper.pluginFolder, "ai/llamacpp")
    binDir = File(llamaCppDir!!, "bin")
    modelsDir = File(llamaCppDir!!, "models")
    llamaCppDir!!.mkdirs()
    binDir!!.mkdirs()
    modelsDir!!.mkdirs()

    // Read plugin properties
    configData.properties.getProperty("AI_LlamaCpp_Port")?.trim()?.toIntOrNull()?.let {
      if (it in 1024..65535) {
        serverPort = it
        activeServerPort = it
      }
    }
    configData.properties.getProperty("AI_LlamaCpp_Threads")?.trim()?.toIntOrNull()?.let {
      if (it > 0) threadCount = it
    }
    configData.properties.getProperty("AI_LlamaCpp_CtxSize")?.trim()?.toIntOrNull()?.let {
      if (it > 0) ctxSize = it
    }
    configData.properties.getProperty("AI_LlamaCpp_GpuLayers")?.trim()?.toIntOrNull()?.let {
      if (it >= -1) gpuLayers = it
    }
    configData.properties.getProperty("AI_LlamaCpp_Parallel")?.trim()?.toIntOrNull()?.let {
      if (it > 0) parallelSlots = it
    }
    configData.properties
        .getProperty("AI_LlamaCpp_ServerArgs")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { extraServerArgs = it.split(" ").filter { arg -> arg.isNotBlank() } }
    configData.properties
        .getProperty("AI_LlamaCpp_Release")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { customRelease ->
          llamaRelease = customRelease
          val rebuilt = buildServerUrls(customRelease)
          serverUrls.clear()
          serverUrls.putAll(rebuilt)
        }

    log(LogLevel.INFO, "LLAMA infrastructure initialized")
    log(LogLevel.INFO, "  Dir:     ${llamaCppDir!!.absolutePath}")
    log(LogLevel.INFO, "  Port:    $serverPort")
    log(LogLevel.INFO, "  Release: $llamaRelease")
    log(LogLevel.INFO, "  Threads: ${threadCount ?: "auto-detect"}")
    log(LogLevel.INFO, "  Context: $ctxSize")
    log(LogLevel.INFO, "  GPU:     ${if (gpuLayers == -1) "auto-detect" else "$gpuLayers layers"}")
  }

  /** Shuts down the llama-server process and releases resources. */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    stopServer()
    isActive = false
    super.shutdown(shutdownData)
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Logging
  // ═══════════════════════════════════════════════════════════════════════

  override fun log(importance: LogLevel, toLog: String, adjenct: String, exception: Throwable?) {
    super.idLogMessages = "LLAMA"
    super.log(importance, toLog, adjenct, exception)
  }
}
