package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.AI
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.io.BufferedReader
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.io.InputStreamReader
import java.io.RandomAccessFile
import java.net.HttpURLConnection
import java.net.ServerSocket
import java.net.URI
import java.nio.charset.StandardCharsets
import java.util.zip.ZipInputStream

// ═══════════════════════════════════════════════════════════════════════════════
//  Whisper — "Swan Architecture" for on-premise speech-to-text
// ═══════════════════════════════════════════════════════════════════════════════
//
// Manages the full lifecycle of a whisper.cpp server running as an external OS
// process. The TypeScript frontend (media.input.speech.whisper.ts) records audio
// in the browser, sends it here, and this servlet forwards it to the local
// whisper-server for transcription.
//
// ┌────────────────────────────────────────────────────────────────────┐
// │  Formcycle JVM (Tomcat)                                           │
// │  ┌──────────────────────────────────────────────────────────────┐ │
// │  │  CodBi Plugin — Whisper Servlet                              │ │
// │  │   ├─ initialize()  → detect OS → download → ProcessBuilder  │ │
// │  │   ├─ execute()     → forward audio to 127.0.0.1:port        │ │
// │  │   └─ shutdown()    → process.destroy()                      │ │
// │  └──────────────────────────────────────────────────────────────┘ │
// │                         ↕  HTTP (localhost only)                  │
// │  ┌──────────────────────────────────────────────────────────────┐ │
// │  │  whisper-server  (separate OS process)                       │ │
// │  │   ├─ GGML Whisper model loaded in native C++ memory         │ │
// │  │   ├─ POST /inference endpoint on 127.0.0.1:port             │ │
// │  │   └─ If OOM → OS kills THIS process, Tomcat stays alive     │ │
// │  └──────────────────────────────────────────────────────────────┘ │
// └────────────────────────────────────────────────────────────────────┘
//
// ## DSGVO / GDPR Compliance
// All audio data is processed locally on the server. No data is transmitted to
// any cloud service (Google, Microsoft, OpenAI, etc.). This makes it the ideal
// solution for organizations that require DSGVO-compliant speech recognition.
//
// ## Plugin Properties
// | Property                     | Type   | Default                          | Description
//                                     |
// |------------------------------|--------|----------------------------------|----------------------------------------------------------|
// | `Active_AI`                  | String | —                                | Must contain
// `whisper` to activate                       |
// | `AI_Remove`                  | —      | —                                | If contains
// `whisper`, clean up all whisper files         |
// | `AI_Whisper_ModelUrl`        | URL    | ggml-small                       | GGML model URL.
// Alternatives: ggml-base, ggml-medium, ggml-large-v3-turbo-q5_0 |
// | `AI_Whisper_Port`            | Int    | `8393`                           | Local port for
// whisper-server                            |
// | `AI_Whisper_Release`         | String | `v1.7.6`                         | whisper.cpp release
// tag for binary downloads              |
// | `AI_Whisper_NoGpu`            | Bool   | `false`                          | Set `true` to
// disable GPU and force CPU-only              |
// | `AI_Whisper_Threads`         | Int    | physical cores                   | CPU threads for
// whisper-server                           |
// ═══════════════════════════════════════════════════════════════════════════════

class Whisper : AI() {

  companion object {
    private const val PROP_PREFIX = "AI_Whisper"

    /**
     * Default Whisper model: small — fast transcription with good accuracy (~466 MB). Users can
     * override to large-v3-turbo-q5_0 for max quality via plugin property.
     */
    private const val DEFAULT_MODEL_URL =
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"

    /** Default whisper.cpp release tag. Pre-built binaries started from v1.7.6. */
    private const val DEFAULT_WHISPER_RELEASE = "v1.7.6"

    /** Startup health-check timeout. */
    private const val SERVER_START_TIMEOUT_MS = 120_000L

    /** Interval between health-check polls. */
    private const val HEALTH_POLL_INTERVAL_MS = 1_000L

    /** Buffer size for resumable downloads (64 KB). */
    private const val DOWNLOAD_BUFFER_SIZE = 65_536

    /** User-Agent for download requests. */
    private const val USER_AGENT = "CodBi-Whisper/1.0"

    /** Pre-built static ffmpeg download URL for Windows x64 (BtbN builds on GitHub). */
    private const val FFMPEG_DOWNLOAD_URL_WIN64 =
        "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
  }

  // ── Configuration ────────────────────────────────────────────────────

  private var modelUrl = DEFAULT_MODEL_URL
  private var serverPort = 8393
  private var whisperRelease = DEFAULT_WHISPER_RELEASE
  private var noGpu = false
  private var threadCount: Int? = null

  // ── State ────────────────────────────────────────────────────────────

  @Volatile private var serverReady = false
  @Volatile private var loadError: Throwable? = null
  @Volatile private var serverProcess: Process? = null
  private var stdoutThread: Thread? = null
  private var stderrThread: Thread? = null
  private var whisperDir: File? = null
  private var binDir: File? = null
  private var modelsDir: File? = null
  private var modelFile: File? = null
  private var detectedGpu: GpuBackend = GpuBackend.NONE
  private var ffmpegBinDir: File? = null
  private var ffmpegAvailable = false

  // ── GPU Backend ──────────────────────────────────────────────────────

  private enum class GpuBackend {
    NONE,
    CUDA,
    VULKAN
  }

  private data class Platform(val os: String, val arch: String, val exeName: String) {
    val needsChmod: Boolean
      get() = os != "windows"
  }

  init {
    idLogMessages = "Whisper"
  }

  override fun getName(): String = "CodBi_AI_Whisper"

  // ═══════════════════════════════════════════════════════════════════════
  //  Lifecycle
  // ═══════════════════════════════════════════════════════════════════════

  override fun initialize(configData: IPluginInitializeData) {
    super.initialize(configData)

    val activeAi = configData.properties.getProperty("Active_AI")?.lowercase() ?: ""
    if (!activeAi.contains("whisper")) {
      log(LogLevel.INFO, "Whisper not activated (Active_AI does not contain 'whisper')")
      return
    }

    val aiRemove = configData.properties.getProperty("AI_Remove")?.lowercase() ?: ""
    if (aiRemove.contains("whisper")) {
      log(LogLevel.INFO, "Whisper marked for removal — cleaning up all files")
      val dir = File(configData.fileHelper.pluginFolder, "ai/whisper")
      if (dir.exists()) dir.deleteRecursively()
      return
    }

    // Set up directories
    whisperDir = File(configData.fileHelper.pluginFolder, "ai/whisper")
    binDir = File(whisperDir!!, "bin")
    modelsDir = File(whisperDir!!, "models")
    whisperDir!!.mkdirs()
    binDir!!.mkdirs()
    modelsDir!!.mkdirs()

    // Read plugin properties
    configData.properties
        .getProperty("${PROP_PREFIX}_ModelUrl")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { modelUrl = it }
    configData.properties.getProperty("${PROP_PREFIX}_Port")?.trim()?.toIntOrNull()?.let {
      if (it in 1024..65535) serverPort = it
    }
    configData.properties
        .getProperty("${PROP_PREFIX}_Release")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { whisperRelease = it }
    configData.properties.getProperty("${PROP_PREFIX}_NoGpu")?.trim()?.lowercase()?.let {
      noGpu = it == "true" || it == "1"
    }
    configData.properties.getProperty("${PROP_PREFIX}_Threads")?.trim()?.toIntOrNull()?.let {
      if (it > 0) threadCount = it
    }

    log(LogLevel.INFO, "Whisper infrastructure initialized")
    log(LogLevel.INFO, "  Dir:     ${whisperDir!!.absolutePath}")
    log(LogLevel.INFO, "  Port:    $serverPort")
    log(LogLevel.INFO, "  Release: $whisperRelease")
    log(LogLevel.INFO, "  Model:   $modelUrl")
    log(LogLevel.INFO, "  GPU:     ${if (noGpu) "disabled (CPU-only)" else "enabled (auto)"}")

    // Launch the full pipeline in a background thread so Formcycle doesn't block on startup
    Thread(
            {
              try {
                val platform = detectPlatform()
                log(LogLevel.INFO, "Platform: ${platform.os}/${platform.arch}")

                // Download whisper-server binary
                val binary = downloadWhisperBinary(platform)
                if (binary == null) {
                  loadError = IllegalStateException("Failed to download whisper-server binary")
                  return@Thread
                }

                // Download Whisper GGML model
                val modelFileName = modelUrl.substringAfterLast("/")
                modelFile = File(modelsDir, modelFileName)
                if (!downloadWithResume(modelUrl, modelFile!!, "Whisper model")) {
                  loadError = IllegalStateException("Failed to download Whisper model")
                  return@Thread
                }

                // Ensure ffmpeg is available for audio format conversion (--convert)
                ffmpegAvailable = ensureFfmpeg(platform)

                // Start whisper-server
                val started = startWhisperServer(binary, modelFile!!)
                if (!started) {
                  loadError = IllegalStateException("whisper-server failed to start")
                  return@Thread
                }

                serverReady = true
                log(LogLevel.INFO, "Whisper initialized and ready for requests on port $serverPort")
              } catch (e: Exception) {
                loadError = e
                log(LogLevel.ERROR, "Whisper initialization failed: ${e.message}", "", e)
              }
            },
            "whisper-init")
        .apply { isDaemon = true }
        .start()
  }

  override fun shutdown(shutdownData: IPluginShutdownData?) {
    stopServer()
    serverReady = false
    super.shutdown(shutdownData)
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Servlet — execute()
  // ═══════════════════════════════════════════════════════════════════════

  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    // ── Health-check shortcut ──────────────────────────────────────────
    val isHealthCheck =
        params.headerMap.entries.any {
          it.key.equals("X-Health-Check", ignoreCase = true) &&
              it.value.equals("true", ignoreCase = true)
        }
    if (isHealthCheck) {
      if (loadError != null) {
        return jsonResponse("{\"error\":\"${jsonEscape(loadError?.message ?: "unknown")}\"}")
      }
      if (!serverReady) {
        return jsonResponse(
            "{\"error\":\"Whisper is not ready yet. It may still be downloading or loading.\"}")
      }
      val displayModel = modelUrl.substringAfterLast("/").removeSuffix(".bin")
      return jsonResponse(
          "{\"status\":\"ready\",\"model\":\"${jsonEscape(displayModel)}\",\"convertSupported\":$ffmpegAvailable}")
    }

    // ── Readiness gate ──────────────────────────────────────────────────
    if (!serverReady) {
      val msg =
          if (loadError != null) "Whisper initialization failed: ${loadError?.message}"
          else "Whisper is still loading. Please try again shortly."
      return jsonResponse("{\"error\":\"${jsonEscape(msg)}\"}")
    }

    // ── Extract language header ─────────────────────────────────────────
    val language =
        params.headerMap.entries
            .find { it.key.equals("X-Language", ignoreCase = true) }
            ?.value
            ?.trim()

    // ── Debug: dump what's actually in the request ─────────────────────
    log(LogLevel.INFO, "REQUEST DEBUG — headers: ${params.headerMap.keys.joinToString()}")
    log(
        LogLevel.INFO,
        "REQUEST DEBUG — requestParameters keys: ${params.requestParameters?.keys?.joinToString() ?: "null"}")
    params.requestParameters?.forEach { (key, values) ->
      val preview = values.firstOrNull()?.take(120) ?: "(empty)"
      log(LogLevel.INFO, "REQUEST DEBUG — param '$key' = $preview")
    }
    log(
        LogLevel.INFO,
        "REQUEST DEBUG — uploadFiles keys: ${params.uploadFiles?.keys?.joinToString() ?: "null"}")
    params.uploadFiles?.forEach { (key, fileDataList) ->
      val totalSize = fileDataList.sumOf { it.data?.size ?: 0 }
      log(
          LogLevel.INFO,
          "REQUEST DEBUG — uploadFile '$key': ${fileDataList.size} parts, $totalSize bytes total")
    }

    // ── Collect audio data from upload ──────────────────────────────────
    val audioBytes = collectAudioBytes(params)
    if (audioBytes == null) {
      return jsonResponse("{\"error\":\"No audio file uploaded.\"}")
    }

    // ── Forward to whisper-server ───────────────────────────────────────
    return try {
      val transcription = transcribeAudio(audioBytes, language)
      log(
          LogLevel.INFO,
          "Transcription complete: ${transcription.length} chars" +
              if (transcription.length > 80) " (truncated)" else "")
      jsonResponse("{\"text\":\"${jsonEscape(transcription)}\"}")
    } catch (e: Exception) {
      log(LogLevel.ERROR, "Transcription failed: ${e.message}", "", e)
      jsonResponse("{\"error\":\"${jsonEscape(e.message ?: "Transcription failed")}\"}")
    }
  }

  /**
   * Extracts audio bytes from the request — supports base64 data-URL params and multipart uploads.
   */
  private fun collectAudioBytes(params: IPluginServletActionParams): ByteArray? {
    // Primary: base64 data-URL in request parameters (same pattern as LLAMA Standard images)
    params.requestParameters?.forEach { (key, values) ->
      if (key.startsWith("codbi-base64:")) {
        val dataUrl = values.firstOrNull() ?: return@forEach
        val base64 = dataUrl.substringAfter(",")
        try {
          val bytes = java.util.Base64.getDecoder().decode(base64)
          if (bytes.isNotEmpty()) {
            log(LogLevel.INFO, "Received audio via base64 param '$key': ${bytes.size} bytes")
            return bytes
          }
        } catch (e: Exception) {
          log(LogLevel.WARNING, "Failed to decode base64 audio for '$key': ${e.message}")
        }
      }
    }

    // Fallback: multipart file upload
    if (!params.uploadFiles.isNullOrEmpty()) {
      val (_, fileDataList) = params.uploadFiles.entries.firstOrNull() ?: return null
      val combined =
          fileDataList.fold(byteArrayOf()) { acc, fd -> acc + (fd.data ?: byteArrayOf()) }
      if (combined.isNotEmpty()) {
        log(LogLevel.INFO, "Received audio via multipart upload: ${combined.size} bytes")
        return combined
      }
    }

    log(LogLevel.WARNING, "No audio data found in request (checked base64 params and uploadFiles)")
    return null
  }

  /**
   * Forwards audio data to the local whisper-server `/inference` endpoint as multipart form data.
   *
   * @return The transcribed text extracted from the JSON response.
   */
  private fun transcribeAudio(audioBytes: ByteArray, language: String?): String {
    val boundary = "----CodBiWhisper${System.currentTimeMillis()}"
    val lineEnd = "\r\n"

    val connection =
        URI("http://127.0.0.1:$serverPort/inference").toURL().openConnection() as HttpURLConnection
    connection.requestMethod = "POST"
    connection.doOutput = true
    connection.connectTimeout = 5_000
    connection.readTimeout = 120_000 // Whisper transcription can take time for long audio
    connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")

    connection.outputStream.buffered().use { out ->
      // Audio file part
      out.write("--$boundary$lineEnd".toByteArray())
      out.write(
          "Content-Disposition: form-data; name=\"file\"; filename=\"audio.webm\"$lineEnd"
              .toByteArray())
      out.write("Content-Type: audio/webm$lineEnd$lineEnd".toByteArray())
      out.write(audioBytes)
      out.write(lineEnd.toByteArray())

      // response_format part
      out.write("--$boundary$lineEnd".toByteArray())
      out.write(
          "Content-Disposition: form-data; name=\"response_format\"$lineEnd$lineEnd".toByteArray())
      out.write("json$lineEnd".toByteArray())

      // temperature part (0 = greedy decoding for best accuracy)
      out.write("--$boundary$lineEnd".toByteArray())
      out.write(
          "Content-Disposition: form-data; name=\"temperature\"$lineEnd$lineEnd".toByteArray())
      out.write("0.0$lineEnd".toByteArray())

      // language part (optional)
      if (!language.isNullOrBlank()) {
        out.write("--$boundary$lineEnd".toByteArray())
        out.write("Content-Disposition: form-data; name=\"language\"$lineEnd$lineEnd".toByteArray())
        out.write("$language$lineEnd".toByteArray())
      }

      out.write("--$boundary--$lineEnd".toByteArray())
      out.flush()
    }

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
      throw RuntimeException("whisper-server HTTP $responseCode: $body")
    }

    // Parse JSON response: {"text":"..."}
    return extractTextFromJson(body)
  }

  /** Extracts the "text" field from a whisper-server JSON response. */
  private fun extractTextFromJson(json: String): String {
    // Simple JSON extraction — avoids adding a Jackson dependency for one field.
    // The whisper-server response format is: {"text":"transcribed text here"}
    val match = Regex(""""text"\s*:\s*"((?:[^"\\]|\\.)*)"""").find(json) ?: return json.trim()
    return match.groupValues[1]
        .replace("\\n", "\n")
        .replace("\\\"", "\"")
        .replace("\\\\", "\\")
        .trim()
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Platform Detection
  // ═══════════════════════════════════════════════════════════════════════

  private fun detectPlatform(): Platform {
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
          else -> "x86_64"
        }
    val exeName = if (os == "windows") "whisper-server.exe" else "whisper-server"

    log(LogLevel.INFO, "Detected platform: $os / $arch → binary: $exeName")
    return Platform(os, arch, exeName)
  }

  private fun detectGpu(): GpuBackend {
    val osName = System.getProperty("os.name").lowercase()
    if (osName.contains("mac") || osName.contains("darwin")) {
      log(LogLevel.INFO, "GPU: macOS — Metal built into standard binary")
      return GpuBackend.NONE
    }

    try {
      val proc =
          ProcessBuilder("nvidia-smi", "--query-gpu=name", "--format=csv,noheader")
              .redirectErrorStream(true)
              .start()
      val output = proc.inputStream.bufferedReader().readText().trim()
      if (proc.waitFor() == 0 &&
          output.isNotBlank() &&
          !output.contains("failed", ignoreCase = true)) {
        log(LogLevel.INFO, "GPU: NVIDIA CUDA — $output")
        return GpuBackend.CUDA
      }
    } catch (_: Exception) {}

    try {
      val proc = ProcessBuilder("vulkaninfo", "--summary").redirectErrorStream(true).start()
      val output = proc.inputStream.bufferedReader().readText().trim()
      if (proc.waitFor() == 0 && output.contains("deviceName", ignoreCase = true)) {
        log(LogLevel.INFO, "GPU: Vulkan available")
        return GpuBackend.VULKAN
      }
    } catch (_: Exception) {}

    log(LogLevel.INFO, "GPU: none — using CPU-only")
    return GpuBackend.NONE
  }

  private fun detectPhysicalCores(): Int {
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
  //  FFmpeg Auto-Download
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Ensures ffmpeg is available for whisper-server's `--convert` flag. First checks the system
   * PATH; if not found, downloads a static build.
   */
  private fun ensureFfmpeg(platform: Platform): Boolean {
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

    val ffmpegDir = File(whisperDir!!, "ffmpeg")
    ffmpegDir.mkdirs()

    val archiveName = FFMPEG_DOWNLOAD_URL_WIN64.substringAfterLast("/")
    val archiveFile = File(ffmpegDir, archiveName)
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

  private fun isFfmpegOnPath(): Boolean {
    return try {
      val proc = ProcessBuilder("ffmpeg", "-version").redirectErrorStream(true).start()
      proc.inputStream.bufferedReader().readText()
      proc.waitFor() == 0
    } catch (_: Exception) {
      false
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Binary Download
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Builds platform-specific download URLs for a given whisper.cpp release. Note: whisper.cpp only
   * provides pre-built Windows binaries.
   */
  private fun buildWhisperServerUrls(release: String): Map<String, String> {
    val base = "https://github.com/ggml-org/whisper.cpp/releases/download/$release"
    return mapOf("windows_x86_64" to "$base/whisper-bin-x64.zip")
  }

  /**
   * Resolves the best server binary URL based on detected GPU backend. whisper.cpp provides: CPU,
   * BLAS, and cuBLAS variants (no Vulkan).
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

    // No Vulkan variant exists for whisper.cpp — use BLAS build for better perf
    if (gpuBackend == GpuBackend.VULKAN) {
      log(LogLevel.INFO, "No Vulkan build for whisper.cpp — using BLAS variant")
      return Pair("$base/whisper-blas-bin-x64.zip", null)
    }

    return Pair(cpuUrls[platformKey] ?: cpuUrls.values.first(), null)
  }

  /**
   * Downloads, extracts, and locates the whisper-server binary for the current platform.
   *
   * @return The whisper-server binary [File], or `null` on failure.
   */
  private fun downloadWhisperBinary(platform: Platform): File? {
    detectedGpu = detectGpu()
    log(LogLevel.INFO, "GPU backend: $detectedGpu")

    // Check for release or GPU changes
    val releaseMarker = File(binDir, "release-tag.txt")
    val gpuMarker = File(binDir, "gpu-backend.txt")
    val installedRelease = if (releaseMarker.exists()) releaseMarker.readText().trim() else null
    val installedGpu = if (gpuMarker.exists()) gpuMarker.readText().trim() else null

    if ((installedRelease != null && installedRelease != whisperRelease) ||
        (installedGpu != null && installedGpu != detectedGpu.name)) {
      log(LogLevel.INFO, "Configuration changed — purging old binaries")
      binDir?.listFiles()?.forEach { f ->
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
    val archiveMarker = File(binDir, "$archiveFileName.complete")

    if (!archiveMarker.exists()) {
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

      // Download CUDA runtime DLLs if needed
      if (cudaDllUrl != null) {
        val cudaArchiveName = cudaDllUrl.substringAfterLast("/")
        val cudaArchive = File(binDir, cudaArchiveName)
        if (downloadWithResume(cudaDllUrl, cudaArchive, "CUDA runtime DLLs")) {
          if (cudaArchiveName.endsWith(".zip")) {
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
      } catch (e: Exception) {
        log(LogLevel.WARNING, "chmod failed: ${e.message}")
      }
    }

    return binary
  }

  private fun findExecutable(dir: File, exeName: String): File? {
    return dir.walkTopDown().find { it.name == exeName && it.isFile }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Server Lifecycle
  // ═══════════════════════════════════════════════════════════════════════

  private fun startWhisperServer(binary: File, model: File): Boolean {
    if (serverProcess != null) {
      log(LogLevel.WARNING, "Server already running — stopping first")
      stopServer()
    }

    serverPort = findFreePort(serverPort)
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

    // whisper-server uses GPU by default; --no-gpu disables it
    if (noGpu || detectedGpu == GpuBackend.NONE) {
      command.add("--no-gpu")
    }

    // Accept any audio format (WebM/Opus, MP4, etc.) — requires ffmpeg on PATH
    if (ffmpegAvailable) {
      command.add("--convert")
    } else {
      log(LogLevel.WARNING, "ffmpeg not available — whisper-server will only accept WAV audio")
    }

    // Performance: flash attention — significantly faster self-attention computation
    command.add("--flash-attn")

    // Performance: disable cross-chunk context — each chunk processed independently (faster)
    command.add("--no-context")

    // Language: auto-detect by default (whisper-server defaults to "en" otherwise)
    command.addAll(listOf("--language", "auto"))

    log(LogLevel.INFO, "Command: ${command.joinToString(" ")}")

    try {
      val pb = ProcessBuilder(command)
      pb.directory(binary.parentFile)
      pb.redirectErrorStream(false)

      // Add downloaded ffmpeg to PATH so whisper-server can invoke it for --convert
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
                    } catch (_: Exception) {}
                  },
                  "whisper-stderr")
              .apply {
                isDaemon = true
                start()
              }

      val healthy = waitForHealth()
      if (!healthy) {
        log(
            LogLevel.ERROR,
            "whisper-server failed health check within ${SERVER_START_TIMEOUT_MS / 1000}s")
        stopServer()
        return false
      }

      log(LogLevel.INFO, "whisper-server is healthy and ready on port $serverPort")
      return true
    } catch (e: Exception) {
      log(LogLevel.ERROR, "Failed to start whisper-server: ${e.message}", "", e)
      stopServer()
      return false
    }
  }

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
      } catch (_: Exception) {}

      Thread.sleep(HEALTH_POLL_INTERVAL_MS)
    }
    return false
  }

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
      } catch (e: Exception) {
        log(LogLevel.WARNING, "Error stopping whisper-server: ${e.message}", "", e)
        try {
          proc.destroyForcibly()
        } catch (_: Exception) {}
      }
    }
    serverProcess = null
    stdoutThread = null
    stderrThread = null
  }

  private fun findFreePort(preferredPort: Int): Int {
    for (offset in 0 until 20) {
      val candidate = preferredPort + offset
      if (candidate > 65535) break
      try {
        ServerSocket(candidate).use {}
        if (offset > 0) log(LogLevel.INFO, "Port $preferredPort busy — using $candidate")
        return candidate
      } catch (_: Exception) {}
    }
    return try {
      ServerSocket(0).use { it.localPort }.also { log(LogLevel.WARNING, "OS assigned port $it") }
    } catch (_: Exception) {
      preferredPort
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Download Utilities (adapted from LLAMA.kt)
  // ═══════════════════════════════════════════════════════════════════════

  private fun downloadWithResume(url: String, targetFile: File, label: String): Boolean {
    val markerFile = File(targetFile.parent, "${targetFile.name}.complete")
    if (targetFile.exists() && markerFile.exists()) {
      log(
          LogLevel.INFO,
          "$label already downloaded (${"%.1f".format(targetFile.length() / (1024.0 * 1024.0))} MB)")
      return true
    }

    targetFile.parentFile?.mkdirs()
    val existingBytes = if (targetFile.exists()) targetFile.length() else 0L

    log(
        LogLevel.INFO,
        "$label: starting download from $url" +
            if (existingBytes > 0)
                " (resuming from ${"%.1f".format(existingBytes / (1024.0 * 1024.0))} MB)"
            else "")

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
            log(LogLevel.INFO, "$label: file already complete")
          } else {
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
          }
          log(LogLevel.ERROR, "$label: redirect with no Location header")
          return false
        }
        416 -> log(LogLevel.INFO, "$label: HTTP 416 — file is likely complete")
        else -> {
          log(LogLevel.ERROR, "$label: download failed — HTTP $responseCode")
          connection.disconnect()
          return false
        }
      }

      connection.disconnect()
      markerFile.writeText("${targetFile.length()}")
      log(
          LogLevel.INFO,
          "$label: download complete (${"%.1f".format(targetFile.length() / (1024.0 * 1024.0))} MB)")
      return true
    } catch (e: Exception) {
      log(LogLevel.ERROR, "$label: download failed — ${e.message}. Will resume on next startup.")
      return false
    }
  }

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
            log(LogLevel.INFO, "$label: $pct% (resumed)")
            lastLogPercent = pct
          }
        }
      }
    }
  }

  private fun extractZip(zipFile: File, targetDir: File) {
    log(LogLevel.INFO, "Extracting ${zipFile.name} → ${targetDir.absolutePath}")
    targetDir.mkdirs()
    ZipInputStream(zipFile.inputStream()).use { zis ->
      var entry = zis.nextEntry
      while (entry != null) {
        val outFile = File(targetDir, entry.name)
        // Guard against zip-slip: ensure the extracted path stays within targetDir
        if (!outFile.canonicalPath.startsWith(targetDir.canonicalPath + File.separator) &&
            outFile.canonicalPath != targetDir.canonicalPath) {
          throw SecurityException("Zip entry outside target dir: ${entry.name}")
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
  }

  private fun extractTarGz(tarGzFile: File, targetDir: File) {
    log(LogLevel.INFO, "Extracting ${tarGzFile.name} → ${targetDir.absolutePath}")
    targetDir.mkdirs()
    val pb = ProcessBuilder("tar", "xzf", tarGzFile.absolutePath, "-C", targetDir.absolutePath)
    pb.redirectErrorStream(true)
    val process = pb.start()
    val output = process.inputStream.bufferedReader().readText()
    val exitCode = process.waitFor()
    if (exitCode != 0) {
      log(LogLevel.WARNING, "tar extraction exit code $exitCode: $output")
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  JSON Helpers
  // ═══════════════════════════════════════════════════════════════════════

  private fun jsonResponse(json: String): IPluginServletActionRetVal {
    val resp =
        ServletResponse(EResponseType.JSON).apply {
          value = json
          encoding = StandardCharsets.UTF_8.name()
        }
    return PluginServletActionRetVal(resp)
  }

  private fun jsonEscape(s: String): String {
    return s.replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t")
  }

  override fun log(importance: LogLevel, toLog: String, adjenct: String, exception: Throwable?) {
    super.idLogMessages = "Whisper"
    super.log(importance, toLog, adjenct, exception)
  }
}
