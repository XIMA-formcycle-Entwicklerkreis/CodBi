package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.PlatformDetector.GpuBackend
import java.lang.management.ManagementFactory
import java.util.concurrent.ExecutorService

/**
 * Periodically polls CPU, RAM, and (when CUDA is active) GPU utilization. Used by the servlet to
 * gate incoming requests when resources are exhausted.
 *
 * @param detectedGpu The GPU backend detected on the current platform.
 * @param gpuLayers Number of model layers offloaded to GPU (0 = CPU only).
 * @param maxComputePercent Threshold (0–100) above which compute (CPU or GPU) is considered
 *   exhausted.
 * @param maxRAMPercent Threshold (0–100) above which RAM is considered exhausted.
 * @param log Logger callback for diagnostic messages.
 */
internal class ResourceMonitor(
    private val detectedGpu: GpuBackend,
    private val gpuLayers: Int,
    private val maxComputePercent: Double,
    private val maxRAMPercent: Double,
    private val log: (LogLevel, String) -> Unit
) : Runnable {
  private var future: java.util.concurrent.Future<*>? = null

  /**
   * Submits this monitor to the given executor and stores the resulting [Future].
   *
   * @param exec The executor service that will run the monitoring loop.
   */
  fun start(exec: ExecutorService) {
    future = exec.submit(this)
  }

  @Volatile
  var cpuPercent = 0.0
    private set

  @Volatile
  var ramPercent = 0.0
    private set

  /** GPU utilization (0–100). Only populated when the model offloads to a CUDA GPU. */
  @Volatile
  var gpuPercent = 0.0
    private set

  /** `true` when the model is offloaded to a CUDA GPU and `nvidia-smi` is available. */
  val gpuMonitored: Boolean
    get() = gpuPollingAvailable

  @Volatile var running = true
  /** Operating system MXBean for CPU and memory monitoring (requires Oracle/OpenJDK). */
  private val osMxBean: com.sun.management.OperatingSystemMXBean? =
      try {
        ManagementFactory.getOperatingSystemMXBean() as? com.sun.management.OperatingSystemMXBean
      } catch (_: Exception) {
        null
      }

  init {
    if (osMxBean == null) {
      log(
          LogLevel.WARNING,
          "Resource monitor: com.sun.management.OperatingSystemMXBean unavailable — " +
              "CPU/RAM monitoring will be inactive. This JVM may not be Oracle/OpenJDK.")
    }
  }

  /** Cached ProcessBuilder for nvidia-smi — avoids re-creating on every poll. */
  private val gpuProcessBuilder =
      ProcessBuilder("nvidia-smi", "--query-gpu=utilization.gpu", "--format=csv,noheader,nounits")
          .redirectErrorStream(true)

  /**
   * Whether GPU polling is active. True when:
   * - The detected backend is CUDA
   * - The model offloads at least one layer to GPU (`gpuLayers != 0`)
   * - The first `nvidia-smi` probe succeeded
   */
  @Volatile private var gpuPollingAvailable = false

  /** Initializes GPU polling. */
  init {
    val usesGpu = detectedGpu == GpuBackend.CUDA && gpuLayers != 0

    if (usesGpu) {
      try {
        val probe = gpuProcessBuilder.start()
        val output = probe.inputStream.bufferedReader().readText().trim()

        probe.waitFor()

        if (probe.exitValue() == 0 && output.toDoubleOrNull() != null) {
          gpuPollingAvailable = true

          log(
              LogLevel.INFO,
              "Resource monitor: GPU utilization polling active (CUDA via nvidia-smi)")
        }
      } catch (X: Exception) {
        log(LogLevel.INFO, "GPU polling probe failed: ${X.message}")
      }
    }

    if (!gpuPollingAvailable && usesGpu) {
      log(
          LogLevel.INFO,
          "Resource monitor: GPU detected but nvidia-smi unavailable — falling back to CPU monitoring")
    }
  }

  /** The main monitoring loop. Polls every 3 seconds. */
  @Suppress("DEPRECATION")
  override fun run() {
    while (running) {
      try {
        osMxBean?.let {
          cpuPercent = it.systemCpuLoad * 100.0
          val totalMem = it.totalPhysicalMemorySize.toDouble()

          ramPercent =
              if (totalMem > 0) (totalMem - it.freePhysicalMemorySize.toDouble()) / totalMem * 100.0
              else 0.0
        }

        if (gpuPollingAvailable) {
          gpuPercent = pollGpuUtilization()
        }

        Thread.sleep(3000)
      } catch (X: InterruptedException) {
        running = false
        break
      } catch (X: Exception) {
        log(LogLevel.WARNING, "Resource monitor error: ${X.message}")
      }
    }
  }

  /**
   * Queries `nvidia-smi` for the current GPU utilization percentage.
   *
   * @return GPU utilization (0–100), or the last known value on error.
   */
  private fun pollGpuUtilization(): Double {
    return try {
      val proc = gpuProcessBuilder.start()

      proc.waitFor()

      proc.inputStream
          .bufferedReader()
          .readText()
          .trim()
          .lines()
          .firstOrNull()
          ?.trim()
          ?.toDoubleOrNull() ?: gpuPercent
    } catch (X: Exception) {
      gpuPercent
    }
  }

  /** The effective compute utilization: GPU% when offloaded to GPU, CPU% otherwise. */
  val computePercent: Double
    get() = if (gpuPollingAvailable) gpuPercent else cpuPercent

  /** The label for the compute metric ("GPU" or "CPU"). */
  val computeLabel: String
    get() = if (gpuPollingAvailable) "GPU" else "CPU"

  /** @return `true` when both compute and RAM utilisation are below their thresholds. */
  fun resourcesAvailable(): Boolean =
      computePercent < maxComputePercent && ramPercent < maxRAMPercent

  /**
   * Describes why resource thresholds are exceeded.
   *
   * @return A human-readable reason string, or `null` when resources are within limits.
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
   * Estimates how long a caller should wait before retrying, based on how far over the thresholds
   * the metrics are.
   *
   * @return Seconds to wait, clamped to 5–120.
   */
  fun estimateWaitSeconds(): Int {
    // Every 5 percentage points of total overage ≈ 1 extra second of wait e.g. CPU 20% over + RAM
    // 10% over = 30% total → 6s wait (clamped to 5–120).
    val overageToSecondsDivisor = 5.0

    return (((computePercent - maxComputePercent).coerceAtLeast(0.0) +
            (ramPercent - maxRAMPercent).coerceAtLeast(0.0)) / overageToSecondsDivisor)
        .toInt()
        .coerceIn(5, 120)
  }

  /** Stops the monitoring loop and cancels the background task. */
  fun shutdown() {
    running = false

    future?.cancel(true)
  }
}
