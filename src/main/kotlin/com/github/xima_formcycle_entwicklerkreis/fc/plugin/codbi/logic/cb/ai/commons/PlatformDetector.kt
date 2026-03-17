package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import java.util.concurrent.TimeUnit

/**
 * Detects the current server platform, GPU backend, and physical CPU core count.
 *
 * All methods are stateless and accept a log function for diagnostic output. This class is shared
 * between LLAMA-Server (text/vision) and Whisper-Server (speech-to-text).
 */
object PlatformDetector {

  /**
   * Represents a detected server platform.
   *
   * @property os Normalized OS name: `windows`, `linux`, or `macos`.
   * @property arch Normalized architecture: `x86_64`, `aarch64`.
   * @property exeName The expected executable name on this platform.
   */
  data class Platform(val os: String, val arch: String, val exeName: String) {
    val needsChmod: Boolean
      get() = os != "windows"
  }

  /**
   * Detected GPU backend on the current system. Used to select the correct server binary variant.
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
   * @param log Log function for diagnostic output.
   * @return The detected [Platform].
   */
  fun detectPlatform(
      log: (LogLevel, String) -> Unit,
      windowsExeName: String = "llama-server.exe",
      unixExeName: String = "LLAMA-Server"
  ): Platform {
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
    val exeName = if (os == "windows") windowsExeName else unixExeName

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
   * @param log Log function for diagnostic output.
   * @return The detected [GpuBackend].
   */
  fun detectGpu(log: (LogLevel, String) -> Unit): GpuBackend {
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
      val exited = proc.waitFor(10, TimeUnit.SECONDS)

      if (!exited) {
        proc.destroyForcibly()
        log(LogLevel.WARNING, "GPU detection: nvidia-smi timed out after 10 s")
      } else if (proc.exitValue() == 0 &&
          output.isNotBlank() &&
          !output.contains("failed", ignoreCase = true)) {
        log(LogLevel.INFO, "GPU detection: NVIDIA CUDA available — $output")

        return GpuBackend.CUDA
      }
    } catch (e: Exception) {
      log(
          LogLevel.INFO,
          "GPU detection: nvidia-smi not available (${e.javaClass.simpleName}: ${e.message})")
    }

    try {
      val proc = ProcessBuilder("vulkaninfo", "--summary").redirectErrorStream(true).start()
      val output = proc.inputStream.bufferedReader().readText().trim()
      val exited = proc.waitFor(10, TimeUnit.SECONDS)

      if (!exited) {
        proc.destroyForcibly()
        log(LogLevel.WARNING, "GPU detection: vulkaninfo timed out after 10 s")
      } else if (proc.exitValue() == 0 && output.contains("deviceName", ignoreCase = true)) {
        val deviceMatch =
            Regex("""deviceName\s*=\s*(.+)""", RegexOption.IGNORE_CASE)
                .find(output)
                ?.groupValues
                ?.get(1)
                ?.trim()
        log(LogLevel.INFO, "GPU detection: Vulkan available — ${deviceMatch ?: "device found"}")

        return GpuBackend.VULKAN
      }
    } catch (e: Exception) {
      log(
          LogLevel.INFO,
          "GPU detection: vulkaninfo not available (${e.javaClass.simpleName}: ${e.message})")
    }

    log(LogLevel.INFO, "GPU detection: no GPU backend found — using CPU-only")

    return GpuBackend.NONE
  }

  /**
   * Detects the number of physical CPU cores (not hyper-threaded logical processors). Falls back to
   * [Runtime.availableProcessors] if detection fails.
   *
   * @param log Log function for diagnostic output.
   * @return The number of physical CPU cores.
   */
  fun detectPhysicalCores(log: (LogLevel, String) -> Unit): Int {
    return try {
      val os = System.getProperty("os.name").lowercase()

      if (os.contains("win")) {
        detectPhysicalCoresWindows(log)
      } else {
        val process = ProcessBuilder("nproc", "--all").redirectErrorStream(true).start()
        val output = process.inputStream.bufferedReader().readText()
        val exited = process.waitFor(5, TimeUnit.SECONDS)

        if (!exited) {
          process.destroyForcibly()
          log(LogLevel.WARNING, "Core detection: nproc timed out after 5 s")
          Runtime.getRuntime().availableProcessors()
        } else {
          Regex("""(\d+)""").find(output)?.groupValues?.get(1)?.toIntOrNull()
              ?: Runtime.getRuntime().availableProcessors()
        }
      }
    } catch (e: Exception) {
      log(
          LogLevel.INFO,
          "Core detection failed (${e.javaClass.simpleName}: ${e.message}), using availableProcessors()")
      Runtime.getRuntime().availableProcessors()
    }
  }

  /**
   * Detects physical cores on Windows, trying `wmic` first, then PowerShell `Get-CimInstance` as
   * fallback (since `wmic` is deprecated/removed on newer Windows).
   */
  private fun detectPhysicalCoresWindows(log: (LogLevel, String) -> Unit): Int {
    // Try wmic first (fast, available on older Windows)
    try {
      val wmicProcess =
          ProcessBuilder("wmic", "cpu", "get", "NumberOfCores", "/value")
              .redirectErrorStream(true)
              .start()
      val wmicOutput = wmicProcess.inputStream.bufferedReader().readText()
      val wmicExited = wmicProcess.waitFor(5, TimeUnit.SECONDS)

      if (!wmicExited) wmicProcess.destroyForcibly()

      if (wmicExited) {
        val cores =
            Regex("""NumberOfCores=(\d+)""")
                .findAll(wmicOutput)
                .mapNotNull { it.groupValues[1].toIntOrNull() }
                .sum()
        if (cores > 0) return cores
      }
    } catch (_: Exception) {
      // wmic not available — fall through to PowerShell
    }

    // Fallback: PowerShell Get-CimInstance
    try {
      val psProcess =
          ProcessBuilder(
                  "powershell",
                  "-NoProfile",
                  "-Command",
                  "(Get-CimInstance Win32_Processor | Measure-Object -Property NumberOfCores -Sum).Sum")
              .redirectErrorStream(true)
              .start()
      val psOutput = psProcess.inputStream.bufferedReader().readText().trim()
      val psExited = psProcess.waitFor(10, TimeUnit.SECONDS)

      if (!psExited) {
        psProcess.destroyForcibly()
        log(LogLevel.WARNING, "Core detection: PowerShell timed out after 10 s")
      } else {
        val cores = Regex("""(\d+)""").find(psOutput)?.groupValues?.get(1)?.toIntOrNull()
        if (cores != null && cores > 0) {
          log(LogLevel.INFO, "Core detection: $cores physical cores (via PowerShell)")
          return cores
        }
      }
    } catch (e: Exception) {
      log(LogLevel.INFO, "Core detection: PowerShell fallback failed (${e.message})")
    }

    return Runtime.getRuntime().availableProcessors()
  }
}
