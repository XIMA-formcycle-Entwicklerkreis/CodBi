package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.PlatformDetector.GpuBackend
import com.google.gson.JsonParser
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URI
import java.util.concurrent.ExecutorService
import java.util.concurrent.TimeUnit

/**
 * Manages the lifecycle of a dedicated specialist LLAMA-Server process. Each specialist runs its
 * own model on a separate port, sharing the same binary as the main server.
 *
 * Unlike [ThinkingServerManager], specialist servers use the standard context size and detect the
 * chat template from the model filename (Qwen3 override when applicable, otherwise GGUF-embedded).
 *
 * @param name Human-readable specialist name (e.g. "Extractor") — used in log messages.
 * @param mainServerPort Port of the primary LLAMA-Server, used to avoid collisions.
 * @param threadCount Fixed thread count for inference, or `null` to auto-detect physical cores.
 * @param gpuLayers Number of model layers to offload to GPU (0 = CPU only, -1 = auto).
 * @param detectedGpu The GPU backend detected on the current platform.
 * @param ctxSize Context window size (in tokens).
 * @param parallelSlots Number of parallel inference slots.
 * @param extraServerArgs Additional CLI arguments forwarded to the llama-server process.
 * @param detectPhysicalCores Callback that returns the number of physical CPU cores.
 * @param log Logger callback for diagnostic messages.
 * @param healthCheckTimeoutMs Maximum time (ms) to wait for the server to become healthy.
 */
internal class SpecialistServerManager(
    private val name: String,
    private val mainServerPort: Int,
    private val threadCount: Int?,
    private val gpuLayers: Int,
    private val detectedGpu: GpuBackend,
    private val ctxSize: Int,
    private val parallelSlots: Int,
    private val extraServerArgs: List<String>,
    private val detectPhysicalCores: () -> Int,
    private val log: (LogLevel, String) -> Unit,
    private val healthCheckTimeoutMs: Long = DEFAULT_HEALTH_CHECK_TIMEOUT_MS
) {
  companion object {
    /** Default timeout for health-check polling (120 seconds). */
    const val DEFAULT_HEALTH_CHECK_TIMEOUT_MS = 120_000L
  }

  /** The port the specialist server listens on. */
  @Volatile
  var port: Int = 0
    private set

  /** Whether the specialist server is ready for requests. */
  @Volatile
  var isReady: Boolean = false
    private set

  /** The specialist server OS process, or `null` when not running. */
  @Volatile private var process: Process? = null
  /** Future for the stdout reader thread. */
  private var stdoutFuture: java.util.concurrent.Future<*>? = null
  /** Future for the stderr reader thread. */
  private var stderrFuture: java.util.concurrent.Future<*>? = null

  /**
   * Starts the specialist LLAMA-Server process.
   *
   * @param binary The LLAMA-Server executable (shared with the main server).
   * @param modelFile The specialist model GGUF file.
   * @param mmprojFile Optional vision projector for the specialist model.
   * @param executor Thread pool for stdout/stderr reader threads.
   * @param preferredPortStart Starting port for free-port probing.
   * @return `true` if the server started and passed health checks.
   */
  fun start(
      binary: File,
      modelFile: File,
      mmprojFile: File?,
      executor: ExecutorService,
      preferredPortStart: Int = mainServerPort + 200
  ): Boolean {
    port = findFreePort(preferredPortStart)

    log(LogLevel.INFO, "Starting specialist '$name' LLAMA-Server:")
    log(LogLevel.INFO, "  Binary:  ${binary.absolutePath}")
    log(
        LogLevel.INFO,
        "  Model:   ${modelFile.absolutePath} (${"%.0f".format(modelFile.length() / (1024.0 * 1024.0))} MB)")

    mmprojFile?.let { log(LogLevel.INFO, "  mmproj:  ${it.absolutePath}") }

    log(LogLevel.INFO, "  Port:    $port")

    val command =
        mutableListOf(
            binary.absolutePath,
            "--model",
            modelFile.absolutePath,
            "--host",
            "127.0.0.1",
            "--port",
            port.toString(),
            "--threads",
            (threadCount ?: detectPhysicalCores()).toString(),
            "--ctx-size",
            ctxSize.toString(),
            "--parallel",
            parallelSlots.toString(),
            "--n-gpu-layers",
            (when {
                  gpuLayers >= 0 -> gpuLayers
                  detectedGpu != GpuBackend.NONE -> 999
                  else -> 0
                })
                .toString(),
            "--jinja")

    // Apply Qwen3 chat template if model filename suggests Qwen3
    val isQwen3 = modelFile.name.contains("qwen3", ignoreCase = true)

    if (isQwen3) {
      val templateFile = File(binary.parentFile, "qwen3-specialist-$name-template.jinja")
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

    if (mmprojFile != null && mmprojFile.exists()) {
      command.addAll(listOf("--mmproj", mmprojFile.absolutePath))
    }

    command.addAll(extraServerArgs)

    log(LogLevel.INFO, "Specialist '$name' command: ${command.joinToString(" ")}")

    try {
      val pb = ProcessBuilder(command)

      pb.directory(binary.parentFile)
      pb.redirectErrorStream(false)
      pb.environment()["LLAMA_LOG_TIMESTAMPS"] = "1"

      val proc = pb.start()

      process = proc
      stdoutFuture =
          executor.submit {
            try {
              BufferedReader(InputStreamReader(proc.inputStream)).use { reader ->
                reader.lineSequence().forEach { line -> log(LogLevel.INFO, "[$name] $line") }
              }
            } catch (X: Exception) {
              log(LogLevel.WARNING, "Specialist '$name' stdout reader failed: ${X.message}")
            }
          }

      stderrFuture =
          executor.submit {
            try {
              BufferedReader(InputStreamReader(proc.errorStream)).use { reader ->
                reader.lineSequence().forEach { line -> log(LogLevel.INFO, "[$name] $line") }
              }
            } catch (X: Exception) {
              log(LogLevel.WARNING, "Specialist '$name' stderr reader failed: ${X.message}")
            }
          }

      val healthy = waitForHealth()

      if (!healthy) {
        log(LogLevel.ERROR, "Specialist '$name' server failed to become healthy")
        stop()

        return false
      }

      isReady = true
      log(LogLevel.INFO, "Specialist '$name' LLAMA-Server is healthy on port $port")

      return true
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Failed to start specialist '$name' server: ${X.message}")
      stop()

      return false
    }
  }

  /**
   * Finds a free TCP port starting from [preferredPort], probing up to 20 consecutive candidates.
   *
   * @param preferredPort The first port to try.
   * @return An available TCP port.
   */
  private fun findFreePort(preferredPort: Int): Int {
    for (offset in 0 until 20) {
      val candidate = preferredPort + offset

      if (candidate > 65535 || candidate == mainServerPort) continue
      try {
        java.net.ServerSocket(candidate).use { ss -> ss.reuseAddress = true }
        return candidate
      } catch (_: Exception) {
        /* port in use, try next */
      }
    }

    return try {
      java.net.ServerSocket(0).use { it.localPort }
    } catch (X: Exception) {
      preferredPort
    }
  }

  /**
   * Polls the specialist server `/health` endpoint until it reports healthy or the
   * [healthCheckTimeoutMs] deadline elapses.
   *
   * @return `true` if the server became healthy within the timeout.
   */
  private fun waitForHealth(): Boolean {
    val deadline = System.currentTimeMillis() + healthCheckTimeoutMs
    var lastError = ""

    while (System.currentTimeMillis() < deadline) {
      process?.let { proc ->
        if (!proc.isAlive) {
          log(
              LogLevel.ERROR,
              "Specialist '$name' server process died (exit code: ${proc.exitValue()})")

          return false
        }
      }

      try {
        val connection =
            URI("http://127.0.0.1:$port/health").toURL().openConnection() as HttpURLConnection

        connection.connectTimeout = 2_000
        connection.readTimeout = 2_000
        connection.requestMethod = "GET"

        val responseCode = connection.responseCode
        val body =
            try {
              connection.inputStream.bufferedReader().readText()
            } catch (X: Exception) {
              "[body unreadable: ${X.javaClass.simpleName} — ${X.message}]"
            }

        connection.disconnect()

        if (responseCode == 200 && isHealthResponseOk(body)) {
          return true
        }

        lastError = "HTTP $responseCode: $body"
      } catch (X: Exception) {
        lastError = X.message ?: "connection refused"
      }

      Thread.sleep(1_000L)
    }

    log(LogLevel.ERROR, "Specialist '$name' health check timed out. Last error: $lastError")

    return false
  }

  /** Destroys the specialist LLAMA-Server process and drains its I/O threads. */
  fun stop() {
    process?.let { proc ->
      log(LogLevel.INFO, "Stopping specialist '$name' LLAMA-Server...")

      try {
        proc.destroy()

        if (!proc.waitFor(10, TimeUnit.SECONDS)) {
          proc.destroyForcibly()
          proc.waitFor(5, TimeUnit.SECONDS)
        }

        log(LogLevel.INFO, "Specialist '$name' stopped (exit code: ${proc.exitValue()})")
      } catch (X: Exception) {
        log(LogLevel.WARNING, "Error stopping specialist '$name' server: ${X.message}")

        try {
          proc.destroyForcibly()
        } catch (X: Exception) {
          log(LogLevel.WARNING, "Force-kill of specialist '$name' server also failed: ${X.message}")
        }
      }
    }

    stdoutFuture?.let { future ->
      future.cancel(true)
      try {
        future.get(2, TimeUnit.SECONDS)
      } catch (_: Exception) {
        /* reader may already be done */
      }
    }
    stderrFuture?.let { future ->
      future.cancel(true)
      try {
        future.get(2, TimeUnit.SECONDS)
      } catch (_: Exception) {
        /* reader may already be done */
      }
    }

    process = null
    stdoutFuture = null
    stderrFuture = null
    isReady = false
    port = 0
  }

  /**
   * Parses the `/health` response JSON and returns `true` only when the `status` field is
   * explicitly `"ok"`.
   *
   * @param body The raw HTTP response body from `/health`.
   * @return `true` if the status is `"ok"`.
   */
  private fun isHealthResponseOk(body: String): Boolean {
    return try {
      val obj = JsonParser.parseString(body).asJsonObject
      obj.get("status")?.asString?.equals("ok", ignoreCase = true) == true
    } catch (_: Exception) {
      body.trim().equals("ok", ignoreCase = true)
    }
  }
}
