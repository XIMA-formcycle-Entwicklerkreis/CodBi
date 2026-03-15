package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai

// region Imports
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.AI
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.WhisperRequestHandler
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.WhisperServerManager
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import java.io.File

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
 * |`AI_Whisper_ReleaseBaseUrl`   |URL   |GitHub release|Base URL prefix used to download whisper.cpp release assets (release tag is appended automatically).                                   |
 * |`AI_Whisper_NoGpu`            |Bool  |`false`       |Set `true` to disable GPU and force CPU-only                                                                                           |
 * |`AI_Whisper_Threads`          |Int   |physical cores|CPU threads for whisper-server                                                                                                         |
 * |`AI_Whisper_MaxRAMPercent`    |Double|`101.0`       |RAM usage threshold (%) — blocks requests when exceeded                                                                                |
 * |`AI_Whisper_MaxComputePercent`|Double|`101.0`       |Compute usage threshold (%) — gates on GPU% (CUDA) or CPU% (fallback). Blocks requests when exceeded                                   |
 * |`AI_Whisper_MaxCPUPercent`    |Double|—             |Legacy alias for MaxComputePercent (accepted as fallback)                                                                              |
 * |`AI_Whisper_ExternalUrl`      |URL   |—             |Base URL of an OpenAI-compatible speech-to-text API (e.g. `https://api.openai.com`). When set, the local whisper-server is NOT started.|
 * |`AI_Whisper_ExternalApiKey`   |String|—             |Bearer token / API key for the external API.                                                                                           |
 * |`AI_Whisper_ExternalModel`    |String|`whisper-1`   |Model name to send in the `model` field of the external API request.                                                                   |*  |`AI_Whisper_AutoDetectLanguage`|Boolean|`false`|When `true`, whisper always auto-detects the spoken language. Default (`false`) uses the browser's `Accept-Language` as a hint.|
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
    /** Default base URL prefix for whisper.cpp release downloads. */
    private const val DEFAULT_WHISPER_RELEASE_BASE_URL =
        "https://github.com/ggml-org/whisper.cpp/releases/download"
  }

  // endregion Companion Object
  // region Configuration Properties
  /** URL of the GGML Whisper model to download. Defaults to [DEFAULT_MODEL_URL] (ggml-small). */
  private var modelUrl = DEFAULT_MODEL_URL
  /** Local TCP port for the whisper-server process. */
  private var serverPort = 8393
  /** whisper.cpp GitHub release tag used to resolve binary download URLs. */
  private var whisperRelease = DEFAULT_WHISPER_RELEASE
  /** Base URL prefix used to resolve whisper.cpp release asset downloads. */
  private var whisperReleaseBaseUrl = DEFAULT_WHISPER_RELEASE_BASE_URL
  /** When `true`, GPU acceleration is disabled and whisper-server runs in CPU-only mode. */
  private var noGpu = false
  /**
   * Explicit CPU thread count for whisper-server, or `null` to auto-detect via physical-core
   * detection.
   */
  private var threadCount: Int? = null

  /** Base URL of an external OpenAI-compatible speech-to-text API, or `null` for local mode. */
  private var externalUrl: String? = null
  /** Bearer token / API key for the external API. */
  private var externalApiKey: String? = null
  /** Model identifier sent in external API requests (e.g. `"whisper-1"`). */
  private var externalModel: String? = null
  /** `true` when [externalUrl] is set, meaning local whisper-server is NOT started. */
  private val isExternalMode: Boolean
    get() = externalUrl != null

  /** RAM usage threshold (%). Requests are blocked when system RAM exceeds this value. */
  private var maxRAMPercent = 101.0
  /**
   * Compute utilization threshold (percentage). When Whisper runs on GPU (CUDA), this gates on GPU
   * utilization via `nvidia-smi`. When Whisper runs on CPU, this gates on system-wide CPU
   * utilization. Default `101.0` effectively disables the gate.
   */
  private var maxComputePercent = 101.0
  /**
   * When `true`, whisper always auto-detects the spoken language instead of using the browser's
   * `Accept-Language` header as a hint. Default is `false` (browser language).
   */
  private var autoDetectLanguage = false
  // endregion Configuration Properties

  // region State
  /** Root directory for all Whisper artifacts (`<pluginFolder>/ai/whisper`). */
  private var whisperDir: File? = null
  /** Directory containing the extracted whisper-server binary. */
  private var binDir: File? = null
  /** Directory containing downloaded GGML model files. */
  private var modelsDir: File? = null
  // endregion State

  // region Delegates
  private val serverManager by lazy { WhisperServerManager { level, msg -> log(level, msg) } }
  private val requestHandler by lazy { WhisperRequestHandler { level, msg -> log(level, msg) } }

  // endregion Delegates
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
  private lateinit var pluginProperties: java.util.Properties

  override fun initialize(configData: IPluginInitializeData) {
    super.initialize(configData)

    if (!(configData.properties.getProperty("Active_AI")?.lowercase() ?: "").contains("whisper")) {
      log(LogLevel.INFO, "Whisper not activated (Active_AI does not contain 'whisper')")

      return
    }

    if ((configData.properties.getProperty("AI_Remove")?.lowercase() ?: "").contains("whisper")) {
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
    readPluginProperties(configData)
    pluginProperties = configData.properties
    // endregion Read plugin properties
    // region External mode — skip all local infrastructure.
    if (isExternalMode) {
      log(LogLevel.INFO, "Whisper external mode — using ${externalUrl}")
      log(LogLevel.INFO, "  Model: ${externalModel ?: "whisper-1"}")

      serverManager.setExternalReady()

      return
    }
    // endregion External mode
    // region Log server stats.
    log(LogLevel.INFO, "Whisper infrastructure initialized")
    log(LogLevel.INFO, "  Dir:     ${whisperDir!!.absolutePath}")
    log(LogLevel.INFO, "  Port:    $serverPort")
    log(LogLevel.INFO, "  Release: $whisperRelease")
    log(LogLevel.INFO, "  Release base URL: $whisperReleaseBaseUrl")
    log(LogLevel.INFO, "  Model:   $modelUrl")
    log(LogLevel.INFO, "  GPU:     ${if (noGpu) "disabled (CPU-only)" else "enabled (auto)"}")
    // endregion Log server stats.
    serverManager.startAsync(
        preferredPort = serverPort,
        whisperRelease = whisperRelease,
        whisperReleaseBaseUrl = whisperReleaseBaseUrl,
        modelUrl = modelUrl,
        modelsDir = modelsDir!!,
        binDir = binDir!!,
        whisperDir = whisperDir!!,
        noGpu = noGpu,
        threadCount = threadCount,
        maxRAMPercent = maxRAMPercent,
        maxComputePercent = maxComputePercent,
        onReady = { port -> activeWhisperPort = port })
  }

  /**
   * Shuts down the Whisper module — stops the resource monitor, kills the whisper-server process,
   * and resets readiness state.
   *
   * @param shutdownData Plugin shutdown context (may be `null`).
   */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    serverManager.shutdown()

    activeWhisperPort = 0

    super.shutdown(shutdownData)
  }

  // endregion Lifecycle
  // region Servlet

  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    return requestHandler.handle(
        params = params,
        serverManager = serverManager,
        isExternalMode = isExternalMode,
        externalUrl = externalUrl,
        externalApiKey = externalApiKey,
        externalModel = externalModel,
        modelUrl = modelUrl,
        ffmpegAvailable = serverManager.ffmpegAvailable,
        autoDetectLanguage = autoDetectLanguage,
        pluginProperties = pluginProperties)
  }

  // endregion Servlet
  // region Plugin Properties

  /**
   * Reads all `AI_Whisper_*` plugin properties from the configuration.
   *
   * @param configData Plugin configuration providing properties.
   */
  private fun readPluginProperties(configData: IPluginInitializeData) {
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

    configData.properties
        .getProperty("${PROP_PREFIX}_ReleaseBaseUrl")
        ?.trim()
        ?.trimEnd('/')
        ?.takeIf { it.isNotEmpty() }
        ?.let { whisperReleaseBaseUrl = it }

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

    configData.properties
        .getProperty("${PROP_PREFIX}_AutoDetectLanguage")
        ?.trim()
        ?.lowercase()
        ?.let { autoDetectLanguage = it == "true" || it == "1" }
  }

  // endregion Plugin Properties
  // region Logging

  override fun log(importance: LogLevel, toLog: String, adjenct: String, exception: Throwable?) {
    super.idLogMessages = "Whisper"
    super.log(importance, toLog, adjenct, exception)
  }

  // endregion Logging
}
