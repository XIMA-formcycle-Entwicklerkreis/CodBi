package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.google.gson.JsonParser
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.ServerSocket
import java.net.URI
import java.util.concurrent.TimeUnit

/**
 * Manages the lifecycle of a local LLAMA-Server OS process.
 *
 * Responsibilities:
 * - Launching the server process with a caller-provided command line
 * - Capturing stdout / stderr on daemon threads
 * - Polling the `/health` endpoint until the server is ready
 * - Graceful + forced shutdown
 * - Finding a free TCP port
 *
 * @param log Logging callback `(LogLevel, message)`.
 */
class LlamaProcessManager(private val log: (LogLevel, String) -> Unit) {
  /** The Companion for static members. */
  companion object {
    /** How long to wait for the server to become healthy after launch. */
    const val SERVER_START_TIMEOUT_MS = 120_000L
    /** Interval between health-check polls during startup. */
    private const val HEALTH_POLL_INTERVAL_MS = 1_000L
  }

  // region Process State

  /** The running server process, or `null` if not started. */
  @Volatile
  var process: Process? = null
    private set

  /** Thread that consumes server stdout. */
  @Volatile private var stdoutThread: Thread? = null

  /** Thread that consumes server stderr. */
  @Volatile private var stderrThread: Thread? = null

  // endregion Process State

  // region Launch

  /**
   * Launches the LLAMA-Server process and waits for it to become healthy.
   *
   * @param command Full command line (binary path first).
   * @param workingDir Working directory for the process.
   * @param port Port the server will listen on (used for health checks).
   * @return `true` if the server started and passed health checks.
   */
  fun launchProcess(command: List<String>, workingDir: File, port: Int): Boolean {
    if (process != null) {
      log(LogLevel.WARNING, "Server already running — stopping first")
      stopProcess()
    }

    log(LogLevel.INFO, "Command: ${command.joinToString(" ")}")

    val pb = ProcessBuilder(command)
    pb.directory(workingDir)
    pb.redirectErrorStream(false)
    pb.environment()["LLAMA_LOG_TIMESTAMPS"] = "1"

    val proc = pb.start()
    this.process = proc

    stdoutThread =
        Thread(
                {
                  try {
                    BufferedReader(InputStreamReader(proc.inputStream)).use { reader ->
                      reader.lineSequence().forEach { line -> log(LogLevel.INFO, "$line") }
                    }
                  } catch (_: Exception) {}
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
                    BufferedReader(InputStreamReader(proc.errorStream)).use { reader ->
                      reader.lineSequence().forEach { line -> log(LogLevel.INFO, "$line") }
                    }
                  } catch (_: Exception) {}
                },
                "llama-stderr")
            .apply {
              isDaemon = true
              start()
            }

    val healthy = waitForHealth(port)

    if (!healthy) {
      log(
          LogLevel.ERROR,
          "LLAMA-Server failed to become healthy within ${SERVER_START_TIMEOUT_MS / 1000}s")
      stopProcess()

      return false
    }

    return true
  }

  // endregion Launch

  // region Stop

  /**
   * Stops the server process gracefully. Tries `destroy()` first, then `destroyForcibly()` after a
   * timeout.
   */
  fun stopProcess() {
    process?.let { proc ->
      log(LogLevel.INFO, "Stopping LLAMA-Server...")

      try {
        proc.destroy()

        if (!proc.waitFor(10, TimeUnit.SECONDS)) {
          log(LogLevel.WARNING, "Graceful shutdown timed out — force killing")
          proc.destroyForcibly()
          proc.waitFor(5, TimeUnit.SECONDS)
        }

        log(LogLevel.INFO, "LLAMA-Server stopped (exit code: ${proc.exitValue()})")
      } catch (X: Exception) {
        log(LogLevel.WARNING, "Error stopping LLAMA-Server: ${X.message}")

        try {
          proc.destroyForcibly()
        } catch (_: Exception) {}
      }
    }

    process = null
    stdoutThread = null
    stderrThread = null
  }

  // endregion Stop

  // region Queries

  /** Returns `true` if the server process is alive. */
  fun isAlive(): Boolean = process?.isAlive == true

  /**
   * Finds a free TCP port starting from [preferredPort]. Probes upward (up to 20 attempts) until an
   * available port is found. Falls back to an OS-assigned ephemeral port if all probed ports are
   * busy.
   *
   * **TOCTOU note:** There is an inherent race between closing the probe socket and the child
   * process binding to the port. `SO_REUSEADDR` is set to minimize the window. llama-server does
   * not support port-0 allocation, so this probe-then-bind approach is the best available option.
   *
   * @param preferredPort The first port to try.
   * @return An available TCP port.
   */
  fun findFreePort(preferredPort: Int): Int {
    for (offset in 0 until 20) {
      val candidate = preferredPort + offset

      if (candidate > 65535) break

      try {
        ServerSocket(candidate).use { ss -> ss.reuseAddress = true }

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

  // endregion Queries

  // region Health Check

  /**
   * Polls the `/health` endpoint until it reports `ok`, or times out.
   *
   * @param port The port the server is listening on.
   * @return `true` if the server became healthy within [SERVER_START_TIMEOUT_MS].
   */
  private fun waitForHealth(port: Int): Boolean {
    val deadline = System.currentTimeMillis() + SERVER_START_TIMEOUT_MS
    var lastError = ""

    while (System.currentTimeMillis() < deadline) {
      // Check if process died
      process?.let { proc ->
        if (!proc.isAlive) {
          log(LogLevel.ERROR, "LLAMA-Server process died (exit code: ${proc.exitValue()})")

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

        if (responseCode == 200) {
          if (isHealthResponseOk(body)) {
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
   * Parses the `/health` response JSON and returns `true` only when the `status` field is
   * explicitly `"ok"`. Falls back to a lenient substring check if the body is not valid JSON (e.g.
   * a plain-text "OK" from an older server build).
   *
   * Expected response: `{"status":"ok"}` (llama.cpp ≥ b2899).
   *
   * @param body The raw HTTP response body from `/health`.
   * @return `true` if the status is `"ok"`.
   */
  private fun isHealthResponseOk(body: String): Boolean {
    return try {
      val obj = JsonParser.parseString(body).asJsonObject
      obj.get("status")?.asString?.equals("ok", ignoreCase = true) == true
    } catch (X: Exception) {
      // Lenient fallback for non-JSON responses (e.g. plain "OK")
      body.trim().equals("ok", ignoreCase = true)
    }
  }

  // endregion Health Check
}
