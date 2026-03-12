package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai

// region Imports
// region CodBi
// endregion CodBi
// region XIMA
// endregion XIMA
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
import java.lang.management.ManagementFactory
import java.net.HttpURLConnection
import java.net.ServerSocket
import java.net.URI
import java.nio.charset.StandardCharsets
import java.util.zip.ZipInputStream

// endregion Imports
/**
 * # Transcripts speech to text via a Whisper-Server.
 *
 * ## Domains to whitelist
 * - **github.com** — whisper-server binary releases (ggml-org/whisper.cpp) & ffmpeg
 *   (BtbN/FFmpeg-Builds)
 * - **objects.githubusercontent.com** — GitHub release asset CDN
 * - **huggingface.co** — Whisper GGML model downloads
 *
 * ## DSGVO / GDPR Compliance
 * All audio data is processed locally on the server (using a local server only). No data is
 * transmitted to any cloud service (Google, Microsoft, OpenAI, etc.). This makes it the ideal
 * solution for organizations that require DSGVO-compliant speech recognition.
 *
 * ## Plugin Properties
 * |Property                      |Type  |Default       |Description                                                                                                                            |
 * |------------------------------|------|--------------|---------------------------------------------------------------------------------------------------------------------------------------|
 * |`Active_AI`                   |String|—             |Must contain `whisper` to activate                                                                                                     |
 * |`AI_Remove`                   |—     |—             |If contains `whisper`, clean up all whisper files                                                                                      |
 * |`AI_Whisper_ModelUrl`         |URL   |ggml-small    |GGML model URL. Alternatives: ggml-base, ggml-medium, ggml-large-v3-turbo-q5_0                                                         |
 * |`AI_Whisper_Port`             |Int   |`8393`        |Local port for whisper-server                                                                                                          |
 * |`AI_Whisper_Release`          |String|`v1.7.6`      |whisper.cpp release tag for binary downloads                                                                                           |
 * |`AI_Whisper_NoGpu`            |Bool  |`false`       |Set `true` to disable GPU and force CPU-only                                                                                           |
 * |`AI_Whisper_Threads`          |Int   |physical cores|CPU threads for whisper-server                                                                                                         |
 * |`AI_Whisper_MaxRAMPercent`    |Double|`101.0`       |RAM usage threshold (%) — blocks requests when exceeded                                                                                |
 * |`AI_Whisper_MaxComputePercent`|Double|`101.0`       |Compute usage threshold (%) — gates on GPU% (CUDA) or CPU% (fallback). Blocks requests when exceeded                                   |
 * |`AI_Whisper_MaxCPUPercent`    |Double|—             |Legacy alias for MaxComputePercent (accepted as fallback)                                                                              |
 * |`AI_Whisper_ExternalUrl`      |URL   |—             |Base URL of an OpenAI-compatible speech-to-text API (e.g. `https://api.openai.com`). When set, the local whisper-server is NOT started.|
 * |`AI_Whisper_ExternalApiKey`   |String|—             |Bearer token / API key for the external API.                                                                                           |
 * |`AI_Whisper_ExternalModel`    |String|`whisper-1`   |Model name to send in the `model` field of the external API request.                                                                   |
 */
class Whisper : AI() {
  // region Companion Object
  companion object {
    /** The prefix for all Whisper related plugin properties. */
    private const val PROP_PREFIX = "AI_Whisper"
    /**
     * The port currently used by the active whisper-server instance. Used by
     * [AiProxy][com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.AiProxy] to
     * route `/v1/audio/transcriptions` requests. `0` means no server is running.
     */
    @Volatile
    @JvmStatic
    var activeWhisperPort: Int = 0
      internal set

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

  // endregion Companion Object
  // region Configuration Properties
  /** URL of the GGML Whisper model to download. Defaults to [DEFAULT_MODEL_URL] (ggml-small). */
  private var modelUrl = DEFAULT_MODEL_URL
  /** Local TCP port for the whisper-server process. */
  private var serverPort = 8393
  /** whisper.cpp GitHub release tag used to resolve binary download URLs. */
  private var whisperRelease = DEFAULT_WHISPER_RELEASE
  /** When `true`, GPU acceleration is disabled and whisper-server runs in CPU-only mode. */
  private var noGpu = false
  /**
   * Explicit CPU thread count for whisper-server, or `null` to auto-detect via
   * [detectPhysicalCores].
   */
  private var threadCount: Int? = null

  // ── External mode (OpenAI-compatible API) ─────────────────────────────
  /** Base URL of an external OpenAI-compatible speech-to-text API, or `null` for local mode. */
  private var externalUrl: String? = null
  /** Bearer token / API key for the external API. */
  private var externalApiKey: String? = null
  /** Model identifier sent in external API requests (e.g. `"whisper-1"`). */
  private var externalModel: String? = null
  /** `true` when [externalUrl] is set, meaning local whisper-server is NOT started. */
  private val isExternalMode: Boolean
    get() = externalUrl != null

  // ── Resource monitoring thresholds ───────────────────────────────────
  /** RAM usage threshold (%). Requests are blocked when system RAM exceeds this value. */
  private var maxRAMPercent = 101.0
  /**
   * Compute utilization threshold (percentage). When Whisper runs on GPU (CUDA), this gates on GPU
   * utilization via `nvidia-smi`. When Whisper runs on CPU, this gates on system-wide CPU
   * utilization. Default `101.0` effectively disables the gate.
   */
  private var maxComputePercent = 101.0
  /** Resource monitor daemon thread. */
  private var resourceMonitor: ResourceMonitor? = null
  // endregion Configuration Properties

  // region State

  /** `true` once the whisper-server (or external endpoint) is healthy and accepting requests. */
  @Volatile private var serverReady = false
  /** Captures the first fatal error during background initialization, if any. */
  @Volatile private var loadError: Throwable? = null
  /** Handle to the running whisper-server OS process. */
  @Volatile private var serverProcess: Process? = null
  /** Daemon thread forwarding whisper-server stdout to the CodBi log. */
  private var stdoutThread: Thread? = null
  /** Daemon thread forwarding whisper-server stderr to the CodBi log. */
  private var stderrThread: Thread? = null
  /** Root directory for all Whisper artifacts (`<pluginFolder>/ai/whisper`). */
  private var whisperDir: File? = null
  /** Directory containing the extracted whisper-server binary. */
  private var binDir: File? = null
  /** Directory containing downloaded GGML model files. */
  private var modelsDir: File? = null
  /** The downloaded GGML model [File] passed to whisper-server on startup. */
  private var modelFile: File? = null
  /** GPU backend detected at initialization (NONE, CUDA, or VULKAN). */
  private var detectedGpu: GpuBackend = GpuBackend.NONE
  /** Directory containing the ffmpeg binary, or `null` if ffmpeg was already on the system PATH. */
  private var ffmpegBinDir: File? = null
  /** `true` when ffmpeg is available (system PATH or downloaded), enabling the `--convert` flag. */
  private var ffmpegAvailable = false

  // endregion State
  // region Types
  /** Available GPU acceleration backends for whisper-server. */
  private enum class GpuBackend {
    /** No GPU detected — CPU-only mode. */
    NONE,
    /** NVIDIA CUDA (cuBLAS binary variant). */
    CUDA,
    /** Vulkan — falls back to BLAS variant since whisper.cpp has no Vulkan build. */
    VULKAN
  }

  /**
   * Describes the host operating system and architecture.
   *
   * @property os Normalized OS name (`"windows"`, `"linux"`, or `"macos"`).
   * @property arch CPU architecture (`"x86_64"` or `"aarch64"`).
   * @property exeName Expected whisper-server executable filename.
   */
  private data class Platform(val os: String, val arch: String, val exeName: String) {
    /** `true` on non-Windows platforms where the extracted binary needs `chmod +x`. */
    val needsChmod: Boolean
      get() = os != "windows"
  }

  // endregion Types
  /** Initializes the Whisper AI module. */
  init {
    idLogMessages = "Whisper"
  }

  /**
   * States the Name of this [AI].
   *
   * @return The servlet action name used to route requests to this AI module.
   */
  override fun getName(): String = "CodBi_AI_Whisper"

  // region Lifecycle
  /**
   * Initializes the Whisper AI module.
   *
   * Reads plugin properties, sets up directories, and launches a background thread that downloads
   * the whisper-server binary + model, ensures ffmpeg availability, and starts the server process.
   * In external mode, skips all local infrastructure.
   *
   * @param configData Plugin configuration providing properties and file-system helpers.
   */
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
    // region Set up directories
    whisperDir = File(configData.fileHelper.pluginFolder, "ai/whisper")
    binDir = File(whisperDir!!, "bin")
    modelsDir = File(whisperDir!!, "models")
    whisperDir!!.mkdirs()
    binDir!!.mkdirs()
    modelsDir!!.mkdirs()
    // endregion Set up directories
    // region Read plugin properties
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

    configData.properties
        .getProperty("${PROP_PREFIX}_MaxRAMPercent")
        ?.trim()
        ?.toDoubleOrNull()
        ?.let { if (it in 1.0..110.0) maxRAMPercent = it }

    val computePropValue =
        configData.properties.getProperty("${PROP_PREFIX}_MaxComputePercent")
            ?: configData.properties.getProperty("${PROP_PREFIX}_MaxCPUPercent")
    computePropValue?.trim()?.toDoubleOrNull()?.let { if (it in 1.0..110.0) maxComputePercent = it }

    configData.properties
        .getProperty("${PROP_PREFIX}_ExternalUrl")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { externalUrl = it.trimEnd('/') }

    configData.properties
        .getProperty("${PROP_PREFIX}_ExternalApiKey")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { externalApiKey = it }

    configData.properties
        .getProperty("${PROP_PREFIX}_ExternalModel")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let { externalModel = it }
    // endregion Read plugin properties
    // region Skip all local infrastructure.
    if (isExternalMode) {
      log(LogLevel.INFO, "Whisper external mode — using ${externalUrl}")
      log(LogLevel.INFO, "  Model: ${externalModel ?: "whisper-1"}")

      serverReady = true

      return
    }
    // endregion Skip all local infrastructure.
    // region Log server stats.
    log(LogLevel.INFO, "Whisper infrastructure initialized")
    log(LogLevel.INFO, "  Dir:     ${whisperDir!!.absolutePath}")
    log(LogLevel.INFO, "  Port:    $serverPort")
    log(LogLevel.INFO, "  Release: $whisperRelease")
    log(LogLevel.INFO, "  Model:   $modelUrl")
    log(LogLevel.INFO, "  GPU:     ${if (noGpu) "disabled (CPU-only)" else "enabled (auto)"}")
    // endregion Log server stats.
    Thread(
            {
              try {
                val platform = detectPlatform()

                log(LogLevel.INFO, "Platform: ${platform.os}/${platform.arch}")

                val binary = downloadWhisperBinary(platform)

                if (binary == null) {
                  loadError = IllegalStateException("Failed to download whisper-server binary")

                  return@Thread
                }

                val modelFileName = modelUrl.substringAfterLast("/")

                modelFile = File(modelsDir, modelFileName)

                if (!downloadWithResume(modelUrl, modelFile!!, "Whisper model")) {
                  loadError = IllegalStateException("Failed to download Whisper model")

                  return@Thread
                }

                ffmpegAvailable = ensureFfmpeg(platform)

                val started = startWhisperServer(binary, modelFile!!)

                if (!started) {
                  loadError = IllegalStateException("whisper-server failed to start")

                  return@Thread
                }

                resourceMonitor?.shutdown()

                resourceMonitor = ResourceMonitor().also { it.start() }
                serverReady = true

                log(LogLevel.INFO, "Whisper initialized and ready for requests on port $serverPort")
              } catch (X: Exception) {
                loadError = X

                log(LogLevel.ERROR, "Whisper initialization failed: ${X.message}", "", X)
              }
            },
            "whisper-init")
        .apply { isDaemon = true }
        .start()
  }

  /**
   * Shuts down the Whisper module — stops the resource monitor, kills the whisper-server process,
   * and resets readiness state.
   *
   * @param shutdownData Plugin shutdown context (may be `null`).
   */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    resourceMonitor?.shutdown()

    resourceMonitor = null

    stopServer()

    serverReady = false
    activeWhisperPort = 0

    super.shutdown(shutdownData)
  }

  // endregion Lifecycle
  // region Servlet
  /**
   * Handles incoming servlet requests for speech-to-text transcription.
   *
   * Supports `X-Health-Check: true` for readiness probes, enforces resource gates, collects audio
   * bytes from the request, and forwards them to either the local whisper-server or an external
   * OpenAI-compatible API.
   *
   * @param params Servlet action parameters containing headers, request parameters, and upload
   *   files.
   * @return JSON response with transcribed text or an error message.
   */
  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
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

      val displayModel =
          if (isExternalMode) externalModel ?: "whisper-1"
          else modelUrl.substringAfterLast("/").removeSuffix(".bin")
      val convertSupported = if (isExternalMode) true else ffmpegAvailable

      return jsonResponse(
          "{\"status\":\"ready\",\"model\":\"${jsonEscape(displayModel)}\",\"convertSupported\":$convertSupported}")
    }
    resourceMonitor?.let { monitor ->
      val reason = monitor.exceedReason()

      if (reason != null) {
        val waitSec = monitor.estimateWaitSeconds()

        log(LogLevel.WARNING, "Resource gate BLOCKED: $reason — estimated wait ${waitSec}s")

        return jsonResponse(
            "{\"error\":\"Server resources exceeded ($reason). Please retry in ~${waitSec} seconds.\",\"retryAfter\":$waitSec}")
      }
    }

    if (!serverReady) {
      val msg =
          if (loadError != null) "Whisper initialization failed: ${loadError?.message}"
          else "Whisper is still loading. Please try again shortly."

      return jsonResponse("{\"error\":\"${jsonEscape(msg)}\"}")
    }

    val language =
        params.headerMap.entries
            .find { it.key.equals("X-Language", ignoreCase = true) }
            ?.value
            ?.trim()

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

    val audioBytes = collectAudioBytes(params)

    if (audioBytes == null) {
      return jsonResponse("{\"error\":\"No audio file uploaded.\"}")
    }

    return try {
      val transcription =
          if (isExternalMode) transcribeAudioExternal(audioBytes, language)
          else transcribeAudio(audioBytes, language)

      log(
          LogLevel.INFO,
          "Transcription complete: ${transcription.length} chars" +
              if (transcription.length > 80) " (truncated)" else "")
      jsonResponse("{\"text\":\"${jsonEscape(transcription)}\"}")
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Transcription failed: ${X.message}", "", X)
      jsonResponse("{\"error\":\"${jsonEscape(X.message ?: "Transcription failed")}\"}")
    }
  }

  /**
   * Extracts audio bytes from the request — supports base64 data-URL params and multipart uploads.
   *
   * @param params Servlet parameters to extract audio from.
   * @return Raw audio bytes, or `null` if no audio data was found.
   */
  private fun collectAudioBytes(params: IPluginServletActionParams): ByteArray? {
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
        } catch (X: Exception) {
          log(LogLevel.WARNING, "Failed to decode base64 audio for '$key': ${X.message}")
        }
      }
    }

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

  // endregion Servlet
  // region Transcription
  /**
   * Forwards audio data to the local whisper-server `/inference` endpoint as multipart form data.
   *
   * @param audioBytes Raw audio bytes (WebM/Opus, WAV, etc.).
   * @param language Optional BCP-47 language hint (e.g. `"en"`, `"de"`), or `null` for auto-detect.
   * @return The transcribed text extracted from the JSON response.
   * @throws RuntimeException If the server returns a non-2xx HTTP status.
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
      out.write("--$boundary$lineEnd".toByteArray())
      out.write(
          "Content-Disposition: form-data; name=\"file\"; filename=\"audio.webm\"$lineEnd"
              .toByteArray())
      out.write("Content-Type: audio/webm$lineEnd$lineEnd".toByteArray())
      out.write(audioBytes)
      out.write(lineEnd.toByteArray())
      out.write("--$boundary$lineEnd".toByteArray())
      out.write(
          "Content-Disposition: form-data; name=\"response_format\"$lineEnd$lineEnd".toByteArray())
      out.write("json$lineEnd".toByteArray())
      out.write("--$boundary$lineEnd".toByteArray())
      out.write(
          "Content-Disposition: form-data; name=\"temperature\"$lineEnd$lineEnd".toByteArray())
      out.write("0.0$lineEnd".toByteArray())

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
        } catch (X: Exception) {
          ""
        }

    connection.disconnect()

    if (responseCode !in 200..299) {
      throw RuntimeException("whisper-server HTTP $responseCode: $body")
    }

    return extractTextFromJson(body)
  }

  /**
   * Forwards audio data to an external OpenAI-compatible `/v1/audio/transcriptions` endpoint.
   *
   * @param audioBytes Raw audio bytes (WebM/Opus, WAV, etc.).
   * @param language Optional BCP-47 language hint, or `null` for auto-detect.
   * @return The transcribed text extracted from the JSON response.
   * @throws RuntimeException If the external API returns a non-2xx HTTP status.
   */
  private fun transcribeAudioExternal(audioBytes: ByteArray, language: String?): String {
    val url = "${externalUrl}/v1/audio/transcriptions"
    val boundary = "----CodBiWhisper${System.currentTimeMillis()}"
    val lineEnd = "\r\n"
    val connection = URI(url).toURL().openConnection() as HttpURLConnection

    connection.requestMethod = "POST"
    connection.doOutput = true
    connection.connectTimeout = 10_000
    connection.readTimeout = 120_000
    connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")

    externalApiKey?.let { connection.setRequestProperty("Authorization", "Bearer $it") }

    connection.outputStream.buffered().use { out ->
      // Audio file part
      out.write("--$boundary$lineEnd".toByteArray())
      out.write(
          "Content-Disposition: form-data; name=\"file\"; filename=\"audio.webm\"$lineEnd"
              .toByteArray())
      out.write("Content-Type: audio/webm$lineEnd$lineEnd".toByteArray())
      out.write(audioBytes)
      out.write(lineEnd.toByteArray())
      out.write("--$boundary$lineEnd".toByteArray())
      out.write("Content-Disposition: form-data; name=\"model\"$lineEnd$lineEnd".toByteArray())
      out.write("${externalModel ?: "whisper-1"}$lineEnd".toByteArray())
      out.write("--$boundary$lineEnd".toByteArray())
      out.write(
          "Content-Disposition: form-data; name=\"response_format\"$lineEnd$lineEnd".toByteArray())
      out.write("json$lineEnd".toByteArray())
      out.write("--$boundary$lineEnd".toByteArray())
      out.write(
          "Content-Disposition: form-data; name=\"temperature\"$lineEnd$lineEnd".toByteArray())
      out.write("0.0$lineEnd".toByteArray())

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
        } catch (X: Exception) {
          ""
        }

    connection.disconnect()

    if (responseCode !in 200..299) {
      throw RuntimeException("External Whisper API HTTP $responseCode: $body")
    }

    return extractTextFromJson(body)
  }

  /**
   * Extracts the `"text"` field from a whisper-server JSON response.
   *
   * Uses a simple regex to avoid adding a Jackson dependency for a single field.
   *
   * @param json Raw JSON response body (e.g. `{"text":"hello world"}`).
   * @return The unescaped transcription text, or the trimmed input if no match is found.
   */
  private fun extractTextFromJson(json: String): String {
    val match = Regex(""""text"\s*:\s*"((?:[^"\\]|\\.)*)"""").find(json) ?: return json.trim()

    return match.groupValues[1]
        .replace("\\n", "\n")
        .replace("\\\"", "\"")
        .replace("\\\\", "\\")
        .trim()
  }

  // endregion Transcription
  // region Platform Detection
  /**
   * Detects the host operating system and CPU architecture.
   *
   * @return A [Platform] describing the OS, architecture, and expected executable name.
   */
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

  /**
   * Probes for available GPU acceleration backends.
   *
   * Checks for NVIDIA CUDA via `nvidia-smi`, then Vulkan via `vulkaninfo`. On macOS, Metal is built
   * into the standard binary so [NONE][GpuBackend.NONE] is returned.
   *
   * @return The best available [GpuBackend].
   */
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
    } catch (X: Exception) {}

    try {
      val proc = ProcessBuilder("vulkaninfo", "--summary").redirectErrorStream(true).start()
      val output = proc.inputStream.bufferedReader().readText().trim()

      if (proc.waitFor() == 0 && output.contains("deviceName", ignoreCase = true)) {
        log(LogLevel.INFO, "GPU: Vulkan available")

        return GpuBackend.VULKAN
      }
    } catch (X: Exception) {}

    log(LogLevel.INFO, "GPU: none — using CPU-only")

    return GpuBackend.NONE
  }

  /**
   * Detects the number of physical CPU cores on the host.
   *
   * Uses `wmic` on Windows and `nproc` on Linux/macOS. Falls back to [Runtime.availableProcessors]
   * if the command fails.
   *
   * @return Physical core count.
   */
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
    } catch (X: Exception) {
      Runtime.getRuntime().availableProcessors()
    }
  }

  // endregion Platform Detection
  // region FFmpeg Auto-Download
  /**
   * Ensures ffmpeg is available for whisper-server's `--convert` flag.
   *
   * First checks the system PATH; if not found on Windows, downloads a static build.
   *
   * @param platform The detected host [Platform].
   * @return `true` if ffmpeg is available after this call.
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
   * Currently only Windows x64 pre-built binaries are available.
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
   * whisper.cpp provides CPU, BLAS, and cuBLAS variants (no Vulkan).
   *
   * @param release The whisper.cpp release tag.
   * @param platformKey Platform key in `"os_arch"` format (e.g. `"windows_x86_64"`).
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
   * Detects the GPU backend, resolves the matching archive URL, downloads it (with resume support),
   * and extracts the executable. Purges old binaries when the release tag or GPU config changes.
   *
   * @param platform The detected host [Platform].
   * @return The whisper-server binary [File], or `null` on failure.
   */
  private fun downloadWhisperBinary(platform: Platform): File? {
    detectedGpu = detectGpu()

    log(LogLevel.INFO, "GPU backend: $detectedGpu")

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

  /**
   * Recursively searches a directory tree for an executable by name.
   *
   * @param dir Root directory to search.
   * @param exeName File name to match (e.g. `"whisper-server.exe"`).
   * @return The first matching [File], or `null` if not found.
   */
  private fun findExecutable(dir: File, exeName: String): File? {
    return dir.walkTopDown().find { it.name == exeName && it.isFile }
  }

  // endregion Binary Download
  // region Server Lifecycle
  /**
   * Launches the whisper-server process and waits for it to pass a health check.
   *
   * Configures CLI flags for GPU, threads, audio conversion, flash attention, and language
   * auto-detection. Spawns daemon threads to forward stdout/stderr to the CodBi log.
   *
   * @param binary The whisper-server executable.
   * @param model The GGML model file to load.
   * @return `true` if the server started and passed the health check.
   */
  private fun startWhisperServer(binary: File, model: File): Boolean {
    if (serverProcess != null) {
      log(LogLevel.WARNING, "Server already running — stopping first")
      stopServer()
    }

    serverPort = findFreePort(serverPort)
    activeWhisperPort = serverPort

    val resolvedThreads = threadCount ?: detectPhysicalCores()
    // region Log server stats.
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
    // endregion Log server stats.
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
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Failed to start whisper-server: ${X.message}", "", X)
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

  /**
   * Gracefully stops the whisper-server process, falling back to [Process.destroyForcibly] on
   * timeout.
   */
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
        log(LogLevel.WARNING, "Error stopping whisper-server: ${X.message}", "", X)

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
   * Tries up to 20 consecutive ports; falls back to an OS-assigned ephemeral port.
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
  // region Download Utilities
  /**
   * Downloads a file with HTTP range-resume support.
   *
   * Creates a `.complete` marker file on success. Skips the download entirely if the marker already
   * exists. Handles HTTP redirects (301, 302, 303, 307, 308) and partial content (206).
   *
   * @param url The download URL.
   * @param targetFile Destination [File] on disk.
   * @param label Human-readable label for log messages (e.g. `"Whisper model"`).
   * @return `true` if the file was downloaded (or already present) successfully.
   */
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
    } catch (X: Exception) {
      log(LogLevel.ERROR, "$label: download failed — ${X.message}. Will resume on next startup.")

      return false
    }
  }

  /**
   * Writes an [InputStream] to a file from scratch, logging download progress at 10% intervals.
   *
   * @param input The source stream.
   * @param target Destination file (overwritten).
   * @param label Human-readable label for log messages.
   * @param totalSize Expected total bytes (`-1` if unknown).
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
   * Appends an [InputStream] to an existing file for HTTP range-resume downloads.
   *
   * @param input The source stream.
   * @param target Destination file to append to.
   * @param label Human-readable label for log messages.
   * @param startOffset Byte offset where appending begins.
   * @param totalSize Expected total file size after completion.
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
            log(LogLevel.INFO, "$label: $pct% (resumed)")
            lastLogPercent = pct
          }
        }
      }
    }
  }

  /**
   * Extracts a ZIP archive to the target directory.
   *
   * Includes a zip-slip guard that rejects entries resolving outside [targetDir].
   *
   * @param zipFile The ZIP archive to extract.
   * @param targetDir Destination directory.
   * @throws SecurityException If a zip entry attempts path traversal (zip-slip).
   */
  private fun extractZip(zipFile: File, targetDir: File) {
    log(LogLevel.INFO, "Extracting ${zipFile.name} → ${targetDir.absolutePath}")

    targetDir.mkdirs()

    ZipInputStream(zipFile.inputStream()).use { zis ->
      var entry = zis.nextEntry

      while (entry != null) {
        val outFile = File(targetDir, entry.name)

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

  /**
   * Extracts a `.tar.gz` archive using the system `tar` command.
   *
   * @param tarGzFile The tar.gz archive to extract.
   * @param targetDir Destination directory.
   */
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

  // endregion Download Utilities
  // region JSON Helpers
  /**
   * Wraps a raw JSON string in a servlet response with UTF-8 encoding.
   *
   * @param json The JSON body to return.
   * @return A ready-to-send [IPluginServletActionRetVal].
   */
  private fun jsonResponse(json: String): IPluginServletActionRetVal {
    val resp =
        ServletResponse(EResponseType.JSON).apply {
          value = json
          encoding = StandardCharsets.UTF_8.name()
        }

    return PluginServletActionRetVal(resp)
  }

  /**
   * Escapes a string for safe embedding inside a JSON value.
   *
   * @param s The raw string to escape.
   * @return The string with backslashes, quotes, newlines, carriage returns, and tabs escaped.
   */
  private fun jsonEscape(s: String): String {
    return s.replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t")
  }

  /**
   * Logs a message with the `"Whisper"` prefix.
   *
   * @param importance Log severity level.
   * @param toLog Primary log message.
   * @param adjenct Additional context string (may be empty).
   * @param exception Optional throwable to include in the log entry.
   */
  override fun log(importance: LogLevel, toLog: String, adjenct: String, exception: Throwable?) {
    super.idLogMessages = "Whisper"
    super.log(importance, toLog, adjenct, exception)
  }

  // endregion JSON Helpers
  // region Resource Monitor
  /**
   * Daemon thread that periodically samples CPU, RAM, and (optionally) GPU utilization.
   *
   * Used by [execute] to gate incoming requests when system resources are under heavy load. GPU
   * polling is only active when CUDA is detected and `nvidia-smi` is available.
   */
  private inner class ResourceMonitor : Thread("codbi-whisper-resource-monitor") {
    /** System-wide CPU utilization (0–100). */
    @Volatile
    var cpuPercent = 0.0
      private set

    /** System-wide RAM utilization (0–100). */
    @Volatile
    var ramPercent = 0.0
      private set

    /** GPU utilization (0–100). Only populated when Whisper offloads to a CUDA GPU. */
    @Volatile
    var gpuPercent = 0.0
      private set

    /** `true` while the monitor loop should keep running. Set to `false` by [shutdown]. */
    @Volatile var running = true
    /** JMX bean for CPU/RAM metrics, or `null` if the cast fails. */
    private val osMxBean: com.sun.management.OperatingSystemMXBean? =
        try {
          ManagementFactory.getOperatingSystemMXBean() as? com.sun.management.OperatingSystemMXBean
        } catch (X: Exception) {
          null
        }
    /** `true` when `nvidia-smi` is available and returns numeric GPU utilization. */
    @Volatile private var gpuPollingAvailable = false

    /** Initialize the monitor. */
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

    /** Samples CPU, RAM, and GPU metrics every second until [running] is `false`. */
    override fun run() {
      while (running) {
        try {
          osMxBean?.let {
            cpuPercent = it.cpuLoad * 100.0

            val totalMem = it.totalMemorySize.toDouble()
            val freeMem = it.freeMemorySize.toDouble()

            ramPercent = if (totalMem > 0) (totalMem - freeMem) / totalMem * 100.0 else 0.0
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

    /**
     * Queries NVIDIA GPU utilization via `nvidia-smi`.
     *
     * @return GPU utilization percentage (0–100), or the last known value on failure.
     */
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

    /** Primary compute utilization: GPU% when CUDA is active, CPU% otherwise. */
    val computePercent: Double
      get() = if (gpuPollingAvailable) gpuPercent else cpuPercent

    /** Human-readable label for the active compute source (`"GPU"` or `"CPU"`). */
    val computeLabel: String
      get() = if (gpuPollingAvailable) "GPU" else "CPU"

    /**
     * Checks whether system resources are within configured thresholds.
     *
     * @return `true` if both compute and RAM utilization are below their respective maximums.
     */
    fun resourcesAvailable(): Boolean =
        computePercent < maxComputePercent && ramPercent < maxRAMPercent

    /**
     * Returns a human-readable reason string if any resource threshold is exceeded.
     *
     * @return Description of exceeded thresholds (e.g. `"GPU 95.2% >= 90%"`), or `null` if within
     *   limits.
     */
    fun exceedReason(): String? {
      val parts = mutableListOf<String>()

      if (computePercent >= maxComputePercent)
          parts.add("$computeLabel %.1f%% >= %.0f%%".format(computePercent, maxComputePercent))
      if (ramPercent >= maxRAMPercent)
          parts.add("RAM %.1f%% >= %.0f%%".format(ramPercent, maxRAMPercent))

      return if (parts.isEmpty()) null else parts.joinToString(", ")
    }

    /**
     * Estimates how many seconds the client should wait before retrying.
     *
     * Based on how far current utilization exceeds the configured thresholds.
     *
     * @return Estimated wait time in seconds, clamped to 5–120.
     */
    fun estimateWaitSeconds(): Int {
      val computeOver = (computePercent - maxComputePercent).coerceAtLeast(0.0)
      val ramOver = (ramPercent - maxRAMPercent).coerceAtLeast(0.0)

      return ((computeOver + ramOver) / 5.0).toInt().coerceIn(5, 120)
    }

    /** Signals the monitor loop to stop and interrupts the sleeping thread. */
    fun shutdown() {
      running = false

      interrupt()
    }
  }
  // endregion Resource Monitor
}
