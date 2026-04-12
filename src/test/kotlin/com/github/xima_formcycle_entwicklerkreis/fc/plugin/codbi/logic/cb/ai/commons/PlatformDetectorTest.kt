package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for [PlatformDetector]. */
class PlatformDetectorTest {

  /** No-op logger for tests. */
  private val noopLog: (LogLevel, String) -> Unit = { _, _ -> }

  @Nested
  inner class PlatformDataClass {

    @Test
    fun windowsPlatformDoesNotNeedChmod() {
      val platform = PlatformDetector.Platform("windows", "x86_64", "llama-server.exe")
      assertFalse(platform.needsChmod)
    }

    @Test
    fun linuxPlatformNeedsChmod() {
      val platform = PlatformDetector.Platform("linux", "x86_64", "LLAMA-Server")
      assertTrue(platform.needsChmod)
    }

    @Test
    fun macosPlatformNeedsChmod() {
      val platform = PlatformDetector.Platform("macos", "aarch64", "LLAMA-Server")
      assertTrue(platform.needsChmod)
    }

    @Test
    fun platformPropertiesAreCorrect() {
      val platform = PlatformDetector.Platform("linux", "aarch64", "my-binary")
      assertEquals("linux", platform.os)
      assertEquals("aarch64", platform.arch)
      assertEquals("my-binary", platform.exeName)
    }

    @Test
    fun platformEquality() {
      val a = PlatformDetector.Platform("windows", "x86_64", "test.exe")
      val b = PlatformDetector.Platform("windows", "x86_64", "test.exe")
      assertEquals(a, b)
      assertEquals(a.hashCode(), b.hashCode())
    }

    @Test
    fun platformInequality() {
      val a = PlatformDetector.Platform("windows", "x86_64", "test.exe")
      val b = PlatformDetector.Platform("linux", "x86_64", "test")
      assertNotEquals(a, b)
    }
  }

  @Nested
  inner class GpuBackendEnum {

    @Test
    fun hasThreeValues() {
      val values = PlatformDetector.GpuBackend.entries
      assertEquals(3, values.size)
    }

    @Test
    fun containsExpectedValues() {
      assertNotNull(PlatformDetector.GpuBackend.valueOf("NONE"))
      assertNotNull(PlatformDetector.GpuBackend.valueOf("CUDA"))
      assertNotNull(PlatformDetector.GpuBackend.valueOf("VULKAN"))
    }
  }

  @Nested
  inner class DetectPlatformTest {

    @Test
    fun detectsCurrentPlatform() {
      val platform = PlatformDetector.detectPlatform(noopLog)
      assertNotNull(platform)
      assertTrue(platform.os in listOf("windows", "linux", "macos"))
      assertTrue(platform.arch in listOf("x86_64", "aarch64"))
      assertTrue(platform.exeName.isNotBlank())
    }

    @Test
    fun respectsCustomExeNames() {
      val platform =
          PlatformDetector.detectPlatform(
              noopLog, windowsExeName = "custom-win.exe", unixExeName = "CustomUnix")
      val osName = System.getProperty("os.name").lowercase()
      if (osName.contains("win")) {
        assertEquals("custom-win.exe", platform.exeName)
      } else {
        assertEquals("CustomUnix", platform.exeName)
      }
    }

    @Test
    fun logsDetectedPlatform() {
      val messages = mutableListOf<String>()
      val log: (LogLevel, String) -> Unit = { _, msg -> messages.add(msg) }

      PlatformDetector.detectPlatform(log)

      assertTrue(messages.any { it.contains("Detected platform") })
    }
  }

  @Nested
  inner class DetectPhysicalCoresTest {

    @Test
    fun returnsPositiveCoreCount() {
      val cores = PlatformDetector.detectPhysicalCores(noopLog)
      assertTrue(cores > 0, "Core count should be positive, was $cores")
    }

    @Test
    fun coreCountReasonable() {
      val cores = PlatformDetector.detectPhysicalCores(noopLog)
      assertTrue(cores <= 1024, "Core count should be reasonable (<= 1024), was $cores")
    }

    @Test
    fun coreCountConsistentAcrossCalls() {
      val cores1 = PlatformDetector.detectPhysicalCores(noopLog)
      val cores2 = PlatformDetector.detectPhysicalCores(noopLog)
      assertEquals(cores1, cores2)
    }
  }

  @Nested
  inner class DetectGpuTest {

    @Test
    fun returnsValidGpuBackend() {
      val gpu = PlatformDetector.detectGpu(noopLog)
      assertNotNull(gpu)
      assertTrue(gpu in PlatformDetector.GpuBackend.entries)
    }

    @Test
    fun logsDetectionActivity() {
      val messages = mutableListOf<String>()
      val log: (LogLevel, String) -> Unit = { _, msg -> messages.add(msg) }

      PlatformDetector.detectGpu(log)

      assertTrue(messages.any { it.contains("GPU detection") })
    }

    @Test
    fun gpuDetectionIsConsistent() {
      val gpu1 = PlatformDetector.detectGpu(noopLog)
      val gpu2 = PlatformDetector.detectGpu(noopLog)
      assertEquals(gpu1, gpu2)
    }
  }

  @Nested
  inner class PlatformCopyTest {

    @Test
    fun dataCopyCopiesAllFields() {
      val original = PlatformDetector.Platform("linux", "x86_64", "server")
      val copy = original.copy(os = "macos")
      assertEquals("macos", copy.os)
      assertEquals("x86_64", copy.arch)
      assertEquals("server", copy.exeName)
    }

    @Test
    fun toStringContainsFields() {
      val platform = PlatformDetector.Platform("windows", "x86_64", "test.exe")
      val str = platform.toString()
      assertTrue(str.contains("windows"))
      assertTrue(str.contains("x86_64"))
      assertTrue(str.contains("test.exe"))
    }
  }
}
