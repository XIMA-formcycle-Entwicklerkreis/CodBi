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
import java.net.URI
import java.util.zip.ZipInputStream

// ═══════════════════════════════════════════════════════════════════════════════
//  LlamaCpp — "Swan Architecture" base class
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
 * | Property                 | Default        | Description                          |
 * |--------------------------|----------------|--------------------------------------|
 * | `Active_AI`              | —              | Must contain `llamacpp`              |
 * | `AI_Remove`              | —              | If contains `llamacpp`, clean up all |
 * | `AI_LlamaCpp_Port`       | `8392`         | Local port for llama-server          |
 * | `AI_LlamaCpp_Threads`    | physical cores | Number of CPU threads                |
 * | `AI_LlamaCpp_CtxSize`    | `4096`         | Context window size                  |
 * | `AI_LlamaCpp_GpuLayers`  | `0`            | Layers offloaded to GPU (0 = CPU)    |
 * | `AI_LlamaCpp_ServerArgs` | —              | Extra CLI args for llama-server      |
 *
 * ## DSGVO / EU-AI Act
 * All data stays on the local machine. No external API calls. Same compliance advantages as all
 * other CodBi AI implementations — see [AI] for details.
 */
abstract class LlamaCpp : AI() {

  companion object {
    /** How long to wait for the server to become healthy after launch. */
    private const val SERVER_START_TIMEOUT_MS = 120_000L

    /** Interval between health-check polls during startup. */
    private const val HEALTH_POLL_INTERVAL_MS = 1_000L

    /** Buffer size for resumable downloads (64 KB). */
    private const val DOWNLOAD_BUFFER_SIZE = 65_536

    /** User-Agent for download requests. */
    private const val USER_AGENT = "CodBi-LlamaCpp/1.0"
  }

  // ── Configuration (set by subclass or plugin properties) ─────────────

  /** Port the llama-server will listen on. */
  protected var serverPort: Int = 8392

  /** Number of CPU threads for the server. `null` = auto-detect physical cores. */
  protected var threadCount: Int? = null

  /** Context window size in tokens. */
  protected var ctxSize: Int = 4096

  /** Number of model layers to offload to GPU. 0 = pure CPU. */
  protected var gpuLayers: Int = 0

  /** Additional CLI arguments appended to the llama-server command. */
  protected var extraServerArgs: List<String> = emptyList()

  /** Maximum concurrent requests (slots) the server serves. */
  protected var parallelSlots: Int = 1

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
    idLogMessages = "LlamaCpp"
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

    val resolvedThreads = threadCount ?: detectPhysicalCores()
    log(LogLevel.INFO, "Starting llama-server:")
    log(LogLevel.INFO, "  Binary:  ${binary.absolutePath}")
    log(
        LogLevel.INFO,
        "  Model:   ${modelFile.absolutePath} (${"%.0f".format(modelFile.length() / (1024.0 * 1024.0))} MB)")
    mmProjFile?.let { log(LogLevel.INFO, "  mmproj:  ${it.absolutePath}") }
    log(LogLevel.INFO, "  Port:    $serverPort")
    log(LogLevel.INFO, "  Threads: $resolvedThreads")
    log(LogLevel.INFO, "  Context: $ctxSize tokens")
    log(LogLevel.INFO, "  GPU layers: $gpuLayers")
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
            gpuLayers.toString())

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

    BufferedReader(InputStreamReader(connection.inputStream, Charsets.UTF_8)).use { reader ->
      reader.lineSequence().forEach { line ->
        if (line.startsWith("data: ")) {
          val data = line.removePrefix("data: ").trim()
          if (data != "[DONE]") {
            onLine(data)
          }
        }
      }
    }
    connection.disconnect()
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Lifecycle
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Initializes the LlamaCpp infrastructure: creates directories, reads plugin properties.
   * Subclasses should call `super.initialize(configData)` then proceed with downloading and
   * starting the server.
   */
  override fun initialize(configData: IPluginInitializeData) {
    super.initialize(configData)

    val activeAI = configData.properties.getProperty("Active_AI")?.lowercase() ?: ""
    if (!activeAI.contains("llamacpp")) {
      log(LogLevel.INFO, "LlamaCpp not activated (Active_AI does not contain 'llamacpp')")
      return
    }

    val aiRemove = configData.properties.getProperty("AI_Remove")?.lowercase() ?: ""
    if (aiRemove.contains("llamacpp")) {
      log(LogLevel.INFO, "LlamaCpp marked for removal — cleaning up all files")
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
      if (it in 1024..65535) serverPort = it
    }
    configData.properties.getProperty("AI_LlamaCpp_Threads")?.trim()?.toIntOrNull()?.let {
      if (it > 0) threadCount = it
    }
    configData.properties.getProperty("AI_LlamaCpp_CtxSize")?.trim()?.toIntOrNull()?.let {
      if (it > 0) ctxSize = it
    }
    configData.properties.getProperty("AI_LlamaCpp_GpuLayers")?.trim()?.toIntOrNull()?.let {
      if (it >= 0) gpuLayers = it
    }
    configData.properties.getProperty("AI_LlamaCpp_Parallel")?.trim()?.toIntOrNull()?.let {
      if (it > 0) parallelSlots = it
    }
    configData.properties
        .getProperty("AI_LlamaCpp_ServerArgs")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { extraServerArgs = it.split(" ").filter { arg -> arg.isNotBlank() } }

    log(LogLevel.INFO, "LlamaCpp infrastructure initialized")
    log(LogLevel.INFO, "  Dir:     ${llamaCppDir!!.absolutePath}")
    log(LogLevel.INFO, "  Port:    $serverPort")
    log(LogLevel.INFO, "  Threads: ${threadCount ?: "auto-detect"}")
    log(LogLevel.INFO, "  Context: $ctxSize")
    log(LogLevel.INFO, "  GPU:     $gpuLayers layers")
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
    super.idLogMessages = "LlamaCpp"
    super.log(importance, toLog, adjenct, exception)
  }
}
