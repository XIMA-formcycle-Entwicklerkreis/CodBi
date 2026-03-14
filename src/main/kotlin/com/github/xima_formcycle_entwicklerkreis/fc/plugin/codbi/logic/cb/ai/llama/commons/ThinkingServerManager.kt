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
 * Manages the lifecycle of a dedicated thinking LLAMA-Server process. Handles process startup, port
 * selection, health-check polling, and graceful shutdown.
 */
internal class ThinkingServerManager(
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

  /** The port the thinking server listens on. */
  @Volatile
  var port: Int = 0
    private set

  /** Whether the thinking server is ready for requests. */
  @Volatile
  var isReady: Boolean = false
    private set

  @Volatile private var process: Process? = null
  private var stdoutFuture: java.util.concurrent.Future<*>? = null
  private var stderrFuture: java.util.concurrent.Future<*>? = null

  /**
   * Starts the thinking LLAMA-Server process.
   *
   * @param binary The LLAMA-Server executable (shared with the fast server).
   * @param thinkingModelFile The thinking model GGUF file.
   * @param thinkingMmprojFile Optional vision projector for the thinking model.
   * @param executor Thread pool for stdout/stderr reader threads.
   * @return `true` if the server started and passed health checks.
   */
  fun start(
      binary: File,
      thinkingModelFile: File,
      thinkingMmprojFile: File?,
      executor: ExecutorService
  ): Boolean {
    port = findThinkingPort(mainServerPort + 100)

    val resolvedThreads = threadCount ?: detectPhysicalCores()
    val resolvedGpuLayers =
        when {
          gpuLayers >= 0 -> gpuLayers
          detectedGpu != GpuBackend.NONE -> 999
          else -> 0
        }

    log(LogLevel.INFO, "Starting thinking LLAMA-Server:")
    log(LogLevel.INFO, "  Binary:  ${binary.absolutePath}")
    log(
        LogLevel.INFO,
        "  Model:   ${thinkingModelFile.absolutePath} (${"%.0f".format(thinkingModelFile.length() / (1024.0 * 1024.0))} MB)")

    thinkingMmprojFile?.let { log(LogLevel.INFO, "  mmproj:  ${it.absolutePath}") }

    log(LogLevel.INFO, "  Port:    $port")

    val templateFile = File(binary.parentFile, "qwen3-thinking-template.jinja")
    val templateContent =
        javaClass
            .getResourceAsStream("/AI/llama/qwen3-chat-template.jinja")
            ?.bufferedReader()
            ?.readText() ?: throw IllegalStateException("Qwen3 chat template resource not found")

    templateFile.writeText(templateContent.trimIndent())

    val thinkingCtxSize = ctxSize * 2
    val command =
        mutableListOf(
            binary.absolutePath,
            "--model",
            thinkingModelFile.absolutePath,
            "--host",
            "127.0.0.1",
            "--port",
            port.toString(),
            "--threads",
            resolvedThreads.toString(),
            "--ctx-size",
            thinkingCtxSize.toString(),
            "--parallel",
            parallelSlots.toString(),
            "--n-gpu-layers",
            resolvedGpuLayers.toString(),
            "--jinja",
            "--chat-template-file",
            templateFile.absolutePath)

    if (thinkingMmprojFile != null && thinkingMmprojFile.exists()) {
      command.addAll(listOf("--mmproj", thinkingMmprojFile.absolutePath))
    }

    command.addAll(extraServerArgs)

    log(LogLevel.INFO, "Thinking server command: ${command.joinToString(" ")}")

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
                reader.lineSequence().forEach { line ->
                  log(LogLevel.INFO, "[thinking-server] $line")
                }
              }
            } catch (X: Exception) {
              log(LogLevel.WARNING, "Thinking server stdout reader failed: ${X.message}")
            }
          }

      stderrFuture =
          executor.submit {
            try {
              BufferedReader(InputStreamReader(proc.errorStream)).use { reader ->
                reader.lineSequence().forEach { line ->
                  log(LogLevel.INFO, "[thinking-server/err] $line")
                }
              }
            } catch (X: Exception) {
              log(LogLevel.WARNING, "Thinking server stderr reader failed: ${X.message}")
            }
          }

      val healthy = waitForHealth()

      if (!healthy) {
        log(LogLevel.ERROR, "Thinking server failed to become healthy")
        stop()

        return false
      }

      isReady = true
      log(LogLevel.INFO, "Thinking LLAMA-Server is healthy on port $port")

      return true
    } catch (X: Exception) {
      log(LogLevel.ERROR, "Failed to start thinking server: ${X.message}")
      stop()

      return false
    }
  }

  /**
   * Finds a free TCP port for the thinking server, starting from [preferredPort] and probing up to
   * 20 consecutive candidates.
   *
   * **Known limitation (TOCTOU):** Between closing the probe [java.net.ServerSocket] and the
   * llama-server process binding to the returned port, another process could claim it. Passing
   * `--port 0` to llama-server is not viable because llama-server does not expose which port the OS
   * actually assigned, so we must discover a free port ourselves and pass it explicitly. In
   * practice the race is unlikely on a single-purpose server, but port conflicts will surface as a
   * health-check failure and be logged.
   */
  private fun findThinkingPort(preferredPort: Int): Int {
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
   * Polls the thinking server `/health` endpoint until it reports healthy or the
   * [healthCheckTimeoutMs] deadline elapses.
   */
  private fun waitForHealth(): Boolean {
    val deadline = System.currentTimeMillis() + healthCheckTimeoutMs
    var lastError = ""

    while (System.currentTimeMillis() < deadline) {
      process?.let { proc ->
        if (!proc.isAlive) {
          log(LogLevel.ERROR, "Thinking server process died (exit code: ${proc.exitValue()})")

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

    log(LogLevel.ERROR, "Thinking server health check timed out. Last error: $lastError")

    return false
  }

  /** Destroys the thinking LLAMA-Server process and drains its I/O threads. */
  fun stop() {
    process?.let { proc ->
      log(LogLevel.INFO, "Stopping thinking LLAMA-Server...")

      try {
        proc.destroy()

        if (!proc.waitFor(10, TimeUnit.SECONDS)) {
          proc.destroyForcibly()
          proc.waitFor(5, TimeUnit.SECONDS)
        }

        log(LogLevel.INFO, "Thinking server stopped (exit code: ${proc.exitValue()})")
      } catch (X: Exception) {
        log(LogLevel.WARNING, "Error stopping thinking server: ${X.message}")

        try {
          proc.destroyForcibly()
        } catch (X: Exception) {
          log(LogLevel.WARNING, "Force-kill of thinking server also failed: ${X.message}")
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
   * explicitly `"ok"`. Falls back to a lenient substring check if the body is not valid JSON (e.g.
   * a plain-text "OK" from an older server build).
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
