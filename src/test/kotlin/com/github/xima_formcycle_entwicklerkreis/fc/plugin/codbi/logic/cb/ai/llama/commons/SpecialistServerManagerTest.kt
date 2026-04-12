package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.PlatformDetector.GpuBackend
import com.sun.net.httpserver.HttpServer
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import java.io.ByteArrayInputStream
import java.io.File
import java.net.InetSocketAddress
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for [SpecialistServerManager] — initial state, constants, safe shutdown, and lifecycle. */
class SpecialistServerManagerTest {

  private val logMessages = mutableListOf<Pair<LogLevel, String>>()

  private fun createManager(
      name: String = "TestSpecialist",
      mainServerPort: Int = 8080,
      gpuLayers: Int = 0,
      ctxSize: Int = 4096,
      parallelSlots: Int = 1,
      detectedGpu: GpuBackend = GpuBackend.NONE,
      healthCheckTimeoutMs: Long = SpecialistServerManager.DEFAULT_HEALTH_CHECK_TIMEOUT_MS
  ): SpecialistServerManager {
    return SpecialistServerManager(
        name = name,
        mainServerPort = mainServerPort,
        threadCount = 4,
        gpuLayers = gpuLayers,
        detectedGpu = detectedGpu,
        ctxSize = ctxSize,
        parallelSlots = parallelSlots,
        extraServerArgs = emptyList(),
        detectPhysicalCores = { 4 },
        log = { level, msg -> logMessages.add(level to msg) },
        healthCheckTimeoutMs = healthCheckTimeoutMs)
  }

  // region Constants

  @Nested
  inner class ConstantsTest {

    @Test
    fun defaultHealthCheckTimeoutIs120Seconds() {
      assertEquals(120_000L, SpecialistServerManager.DEFAULT_HEALTH_CHECK_TIMEOUT_MS)
    }
  }

  // endregion

  // region Initial State

  @Nested
  inner class InitialStateTest {

    @Test
    fun portStartsAtZero() {
      val manager = createManager()

      assertEquals(0, manager.port)
    }

    @Test
    fun isNotReadyInitially() {
      val manager = createManager()

      assertFalse(manager.isReady)
    }
  }

  // endregion

  // region Stop

  @Nested
  inner class StopTest {

    @Test
    fun stopIsNoOpWhenNotStarted() {
      val manager = createManager()

      // Should not throw
      manager.stop()

      assertEquals(0, manager.port)
      assertFalse(manager.isReady)
    }

    @Test
    fun stopResetsState() {
      val manager = createManager()

      manager.stop()

      assertEquals(0, manager.port)
      assertFalse(manager.isReady)
    }

    @Test
    fun doubleStopIsIdempotent() {
      val manager = createManager()

      manager.stop()
      manager.stop()

      assertEquals(0, manager.port)
      assertFalse(manager.isReady)
    }

    @Test
    fun stopWithMockProcessDestroys() {
      val manager = createManager()
      val mockProcess = mockk<Process>(relaxed = true)
      every { mockProcess.waitFor(any(), any<TimeUnit>()) } returns true
      every { mockProcess.exitValue() } returns 0

      // Inject mock process via reflection
      val processField = SpecialistServerManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

      manager.stop()

      verify { mockProcess.destroy() }
      assertFalse(manager.isReady)
      assertEquals(0, manager.port)
    }

    @Test
    fun stopForciblyKillsWhenGracefulFails() {
      val manager = createManager()
      val mockProcess = mockk<Process>(relaxed = true)
      every { mockProcess.waitFor(10, TimeUnit.SECONDS) } returns false
      every { mockProcess.waitFor(5, TimeUnit.SECONDS) } returns true
      every { mockProcess.exitValue() } returns 137

      val processField = SpecialistServerManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

      manager.stop()

      verify { mockProcess.destroy() }
      verify { mockProcess.destroyForcibly() }
    }

    @Test
    fun stopHandlesProcessExceptionGracefully() {
      val manager = createManager()
      val mockProcess = mockk<Process>(relaxed = true)
      every { mockProcess.destroy() } throws RuntimeException("destroy failed")
      every { mockProcess.destroyForcibly() } returns mockProcess

      val processField = SpecialistServerManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

      // Should not throw
      manager.stop()

      verify { mockProcess.destroyForcibly() }
      assertTrue(logMessages.any { it.second.contains("Error stopping") })
    }

    @Test
    fun stopLogsExitCode() {
      val manager = createManager()
      val mockProcess = mockk<Process>(relaxed = true)
      every { mockProcess.waitFor(any(), any<TimeUnit>()) } returns true
      every { mockProcess.exitValue() } returns 42

      val processField = SpecialistServerManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

      manager.stop()

      assertTrue(logMessages.any { it.second.contains("42") })
    }
  }

  // endregion

  // region Constructor Parameters

  @Nested
  inner class ConstructorTest {

    @Test
    fun acceptsCustomName() {
      val manager = createManager(name = "Extractor")

      assertNotNull(manager)
    }

    @Test
    fun acceptsZeroGpuLayers() {
      val manager = createManager(gpuLayers = 0)

      assertNotNull(manager)
    }

    @Test
    fun acceptsAutoGpuLayers() {
      val manager = createManager(gpuLayers = -1)

      assertNotNull(manager)
    }

    @Test
    fun acceptsCustomCtxSize() {
      val manager = createManager(ctxSize = 16384)

      assertNotNull(manager)
    }

    @Test
    fun acceptsCustomParallelSlots() {
      val manager = createManager(parallelSlots = 8)

      assertNotNull(manager)
    }
  }

  // endregion

  // region isHealthResponseOk (via reflection)

  @Nested
  inner class IsHealthResponseOkTest {

    private fun callIsHealthResponseOk(body: String): Boolean {
      val manager = createManager()
      val method =
          SpecialistServerManager::class
              .java
              .getDeclaredMethod("isHealthResponseOk", String::class.java)
      method.isAccessible = true
      return method.invoke(manager, body) as Boolean
    }

    @Test
    fun returnsTrueForOkJson() {
      assertTrue(callIsHealthResponseOk("""{"status":"ok"}"""))
    }

    @Test
    fun returnsTrueForOkCaseInsensitive() {
      assertTrue(callIsHealthResponseOk("""{"status":"OK"}"""))
    }

    @Test
    fun returnsFalseForLoadingJson() {
      assertFalse(callIsHealthResponseOk("""{"status":"loading"}"""))
    }

    @Test
    fun returnsFalseForErrorJson() {
      assertFalse(callIsHealthResponseOk("""{"status":"error"}"""))
    }

    @Test
    fun returnsTrueForPlainTextOk() {
      assertTrue(callIsHealthResponseOk("ok"))
    }

    @Test
    fun returnsTrueForPlainTextOKUppercase() {
      assertTrue(callIsHealthResponseOk("OK"))
    }

    @Test
    fun returnsFalseForPlainTextNotOk() {
      assertFalse(callIsHealthResponseOk("loading"))
    }

    @Test
    fun returnsFalseForEmptyString() {
      assertFalse(callIsHealthResponseOk(""))
    }

    @Test
    fun returnsFalseForMissingStatusField() {
      assertFalse(callIsHealthResponseOk("""{"key":"value"}"""))
    }

    @Test
    fun returnsTrueForOkWithExtraFields() {
      assertTrue(callIsHealthResponseOk("""{"status":"ok","slots":4}"""))
    }

    @Test
    fun returnsFalseForJsonArray() {
      assertFalse(callIsHealthResponseOk("""[{"status":"ok"}]"""))
    }

    @Test
    fun returnsTrueForMixedCaseOk() {
      assertTrue(callIsHealthResponseOk("""{"status":"Ok"}"""))
    }

    @Test
    fun returnsFalseForNullStatusField() {
      assertFalse(callIsHealthResponseOk("""{"status":null}"""))
    }
  }

  // endregion

  // region findFreePort (via reflection)

  @Nested
  inner class FindFreePortTest {

    private fun callFindFreePort(preferredPort: Int, mainServerPort: Int = 8080): Int {
      val manager = createManager(mainServerPort = mainServerPort)
      val method =
          SpecialistServerManager::class.java.getDeclaredMethod("findFreePort", Int::class.java)
      method.isAccessible = true
      return method.invoke(manager, preferredPort) as Int
    }

    @Test
    fun findsAvailablePort() {
      val port = callFindFreePort(49200)
      assertTrue(port in 1..65535)
    }

    @Test
    fun skipsMainServerPort() {
      val port = callFindFreePort(8080, mainServerPort = 8080)
      // Should not return 8080 (the mainServerPort)
      assertNotEquals(8080, port)
    }

    @Test
    fun handlesHighPortRange() {
      val port = callFindFreePort(65530)
      assertTrue(port in 1..65535)
    }

    @Test
    fun skipsPortsBeyond65535() {
      // Starts near max — candidates above 65535 should be skipped
      val port = callFindFreePort(65534)
      assertTrue(port in 1..65535)
    }

    @Test
    fun skipsBusyPort() {
      val ss = java.net.ServerSocket(0)
      val busyPort = ss.localPort
      try {
        val port = callFindFreePort(busyPort)
        assertTrue(port in 1..65535)
      } finally {
        ss.close()
      }
    }
  }

  // endregion

  // region start — with real health check server

  @Nested
  inner class StartWithHealthCheckTest {

    @Test
    fun startFailsWithInvalidBinary() {
      val manager = createManager(healthCheckTimeoutMs = 3000)
      val binary = File("nonexistent-binary-xyz-123")
      val model = File("nonexistent-model.gguf")
      val executor = Executors.newFixedThreadPool(2)

      try {
        val result = manager.start(binary, model, null, executor)
        assertFalse(result)
        assertFalse(manager.isReady)
        assertTrue(logMessages.any { it.second.contains("Failed to start") })
      } finally {
        executor.shutdownNow()
      }
    }

    @Test
    fun startSucceedsWithHealthyServer() {
      // Start a temporary health server
      val healthServer = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
      val healthPort = healthServer.address.port
      healthServer.createContext("/health") { exchange ->
        val body = """{"status":"ok"}"""
        val bytes = body.toByteArray()
        exchange.sendResponseHeaders(200, bytes.size.toLong())
        exchange.responseBody.use { it.write(bytes) }
      }
      healthServer.executor = null
      healthServer.start()

      val manager = createManager(healthCheckTimeoutMs = 5000)

      // Create a real executable (cmd /c exit 0) that stays alive briefly
      val binDir = createTempDir("specialist-test")
      val script: File
      val isWindows = System.getProperty("os.name").lowercase().contains("win")
      if (isWindows) {
        script = File(binDir, "fake-server.cmd")
        script.writeText("@echo off\r\nping -n 6 127.0.0.1 >nul\r\n")
      } else {
        script = File(binDir, "fake-server.sh")
        script.writeText("#!/bin/sh\nsleep 5\n")
        script.setExecutable(true)
      }

      // We can't easily make the real process listen on the health port,
      // so instead we test the findFreePort + waitForHealth path using reflection

      // Test the waitForHealth directly with the real health server
      val portField = SpecialistServerManager::class.java.getDeclaredField("port")
      portField.isAccessible = true
      portField.set(manager, healthPort)

      // Create a mock process that reports alive
      val mockProcess = mockk<Process>(relaxed = true)
      every { mockProcess.isAlive } returns true
      every { mockProcess.inputStream } returns ByteArrayInputStream(ByteArray(0))
      every { mockProcess.errorStream } returns ByteArrayInputStream(ByteArray(0))

      val processField = SpecialistServerManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

      val waitMethod = SpecialistServerManager::class.java.getDeclaredMethod("waitForHealth")
      waitMethod.isAccessible = true
      val healthy = waitMethod.invoke(manager) as Boolean

      assertTrue(healthy)

      healthServer.stop(0)
      binDir.deleteRecursively()
    }

    @Test
    fun waitForHealthReturnsFalseOnTimeout() {
      val manager = createManager(healthCheckTimeoutMs = 2000)

      // Set port to something nobody is listening on
      val portField = SpecialistServerManager::class.java.getDeclaredField("port")
      portField.isAccessible = true
      portField.set(manager, 1)

      val waitMethod = SpecialistServerManager::class.java.getDeclaredMethod("waitForHealth")
      waitMethod.isAccessible = true
      val healthy = waitMethod.invoke(manager) as Boolean

      assertFalse(healthy)
      assertTrue(logMessages.any { it.second.contains("timed out") })
    }

    @Test
    fun waitForHealthReturnsFalseWhenProcessDies() {
      val manager = createManager(healthCheckTimeoutMs = 5000)

      val mockProcess = mockk<Process>(relaxed = true)
      every { mockProcess.isAlive } returns false
      every { mockProcess.exitValue() } returns 1

      val processField = SpecialistServerManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

      val portField = SpecialistServerManager::class.java.getDeclaredField("port")
      portField.isAccessible = true
      portField.set(manager, 1)

      val waitMethod = SpecialistServerManager::class.java.getDeclaredMethod("waitForHealth")
      waitMethod.isAccessible = true
      val healthy = waitMethod.invoke(manager) as Boolean

      assertFalse(healthy)
      assertTrue(logMessages.any { it.second.contains("process died") })
    }

    @Test
    fun waitForHealthHandlesNon200Response() {
      val healthServer = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
      val healthPort = healthServer.address.port
      healthServer.createContext("/health") { exchange ->
        exchange.sendResponseHeaders(503, -1)
        exchange.responseBody.close()
      }
      healthServer.executor = null
      healthServer.start()

      val manager = createManager(healthCheckTimeoutMs = 3000)

      val portField = SpecialistServerManager::class.java.getDeclaredField("port")
      portField.isAccessible = true
      portField.set(manager, healthPort)

      val waitMethod = SpecialistServerManager::class.java.getDeclaredMethod("waitForHealth")
      waitMethod.isAccessible = true
      val healthy = waitMethod.invoke(manager) as Boolean

      assertFalse(healthy)
      healthServer.stop(0)
    }

    @Test
    fun waitForHealthHandlesNonOkStatus() {
      val healthServer = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
      val healthPort = healthServer.address.port
      healthServer.createContext("/health") { exchange ->
        val body = """{"status":"loading"}"""
        val bytes = body.toByteArray()
        exchange.sendResponseHeaders(200, bytes.size.toLong())
        exchange.responseBody.use { it.write(bytes) }
      }
      healthServer.executor = null
      healthServer.start()

      val manager = createManager(healthCheckTimeoutMs = 3000)

      val portField = SpecialistServerManager::class.java.getDeclaredField("port")
      portField.isAccessible = true
      portField.set(manager, healthPort)

      val waitMethod = SpecialistServerManager::class.java.getDeclaredMethod("waitForHealth")
      waitMethod.isAccessible = true
      val healthy = waitMethod.invoke(manager) as Boolean

      assertFalse(healthy)
      healthServer.stop(0)
    }
  }

  // endregion

  // region start — command building and exception handling

  @Nested
  inner class StartMethodTest {

    @Test
    fun startWithInvalidBinaryReturnsFalse() {
      val manager = createManager()
      val binary = File.createTempFile("fake-server", ".bin")
      binary.deleteOnExit()
      val model = File.createTempFile("model", ".gguf")
      model.deleteOnExit()
      val executor = Executors.newFixedThreadPool(2)
      try {
        val result = manager.start(binary, model, null, executor)
        assertFalse(result, "start() should return false when binary is not executable")
      } finally {
        executor.shutdownNow()
      }
    }

    @Test
    fun startLogsCommand() {
      val manager = createManager()
      val binary = File.createTempFile("fake-server", ".bin")
      binary.deleteOnExit()
      val model = File.createTempFile("model", ".gguf")
      model.deleteOnExit()
      val executor = Executors.newFixedThreadPool(2)
      try {
        manager.start(binary, model, null, executor)
      } finally {
        executor.shutdownNow()
      }
      assertTrue(
          logMessages.any { it.second.contains("command:") },
          "Should log the full command; logs=$logMessages")
    }

    @Test
    fun startWithGpuLayersIncludesInCommand() {
      val manager = createManager(gpuLayers = 42)
      val binary = File.createTempFile("fake-server", ".bin")
      binary.deleteOnExit()
      val model = File.createTempFile("model", ".gguf")
      model.deleteOnExit()
      val executor = Executors.newFixedThreadPool(2)
      try {
        manager.start(binary, model, null, executor)
      } finally {
        executor.shutdownNow()
      }
      assertTrue(
          logMessages.any { it.second.contains("42") }, "Should include GPU layers in command")
    }

    @Test
    fun startWithGpuDetectedUses999() {
      val manager = createManager(gpuLayers = -1, detectedGpu = GpuBackend.CUDA)
      val binary = File.createTempFile("fake-server", ".bin")
      binary.deleteOnExit()
      val model = File.createTempFile("model", ".gguf")
      model.deleteOnExit()
      val executor = Executors.newFixedThreadPool(2)
      try {
        manager.start(binary, model, null, executor)
      } finally {
        executor.shutdownNow()
      }
      assertTrue(
          logMessages.any { it.second.contains("999") },
          "CUDA GPU detected with gpuLayers=-1 → 999")
    }

    @Test
    fun startWithNoGpuUses0() {
      val manager = createManager(gpuLayers = -1, detectedGpu = GpuBackend.NONE)
      val binary = File.createTempFile("fake-server", ".bin")
      binary.deleteOnExit()
      val model = File.createTempFile("model", ".gguf")
      model.deleteOnExit()
      val executor = Executors.newFixedThreadPool(2)
      try {
        manager.start(binary, model, null, executor)
      } finally {
        executor.shutdownNow()
      }
      val cmdLog = logMessages.firstOrNull { it.second.contains("command:") }?.second ?: ""
      assertTrue(
          cmdLog.contains("--n-gpu-layers") && cmdLog.contains(" 0"),
          "NONE GPU → 0 layers; cmd=$cmdLog")
    }

    @Test
    fun startWithMmprojIncludesMmprojFlag() {
      val manager = createManager()
      val binary = File.createTempFile("fake-server", ".bin")
      binary.deleteOnExit()
      val model = File.createTempFile("model", ".gguf")
      model.deleteOnExit()
      val mmproj = File.createTempFile("mmproj", ".gguf")
      mmproj.deleteOnExit()
      val executor = Executors.newFixedThreadPool(2)
      try {
        manager.start(binary, model, mmproj, executor)
      } finally {
        executor.shutdownNow()
      }
      assertTrue(logMessages.any { it.second.contains("mmproj") }, "Should log mmproj info")
    }

    @Test
    fun startLogsModelAndPort() {
      val manager = createManager()
      val binary = File.createTempFile("fake-server", ".bin")
      binary.deleteOnExit()
      val model = File.createTempFile("model", ".gguf")
      model.deleteOnExit()
      val executor = Executors.newFixedThreadPool(2)
      try {
        manager.start(binary, model, null, executor)
      } finally {
        executor.shutdownNow()
      }
      assertTrue(logMessages.any { it.second.contains("Model:") })
      assertTrue(logMessages.any { it.second.contains("Port:") })
      assertTrue(logMessages.any { it.second.contains("Binary:") })
    }

    @Test
    fun startCallsStopOnFailure() {
      val manager = createManager()
      val binary = File.createTempFile("fake-server", ".bin")
      binary.deleteOnExit()
      val model = File.createTempFile("model", ".gguf")
      model.deleteOnExit()
      val executor = Executors.newFixedThreadPool(2)
      try {
        manager.start(binary, model, null, executor)
      } finally {
        executor.shutdownNow()
      }
      // After failed start, isReady should still be false
      assertFalse(manager.isReady)
    }

    @Test
    fun startWithQwen3ModelNameLoadsTemplate() {
      val manager = createManager()
      val binary = File.createTempFile("fake-server", ".bin")
      binary.deleteOnExit()
      // Qwen3 model name triggers template loading
      val model = File(binary.parentFile, "qwen3-specialist-test.gguf")
      model.createNewFile()
      model.deleteOnExit()
      val executor = Executors.newFixedThreadPool(2)
      try {
        manager.start(binary, model, null, executor)
      } finally {
        executor.shutdownNow()
        // Clean up template file
        File(binary.parentFile, "qwen3-specialist-TestSpecialist-template.jinja").delete()
      }
      assertTrue(
          logMessages.any {
            it.second.contains("Qwen3 override") || it.second.contains("Template:")
          },
          "Qwen3 model should trigger template loading; logs=$logMessages")
    }
  }

  // endregion
}
