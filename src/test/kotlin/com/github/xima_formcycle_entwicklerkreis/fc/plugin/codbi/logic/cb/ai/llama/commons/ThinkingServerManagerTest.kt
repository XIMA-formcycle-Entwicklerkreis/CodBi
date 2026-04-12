package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.PlatformDetector.GpuBackend
import com.sun.net.httpserver.HttpServer
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import java.net.InetSocketAddress
import java.util.concurrent.TimeUnit
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for [ThinkingServerManager] — initial state, constants, shutdown, and lifecycle. */
class ThinkingServerManagerTest {

  private val logMessages = mutableListOf<Pair<LogLevel, String>>()

  private fun createManager(
      mainServerPort: Int = 8080,
      gpuLayers: Int = 0,
      ctxSize: Int = 4096,
      parallelSlots: Int = 1,
      detectedGpu: GpuBackend = GpuBackend.NONE,
      healthCheckTimeoutMs: Long = ThinkingServerManager.DEFAULT_HEALTH_CHECK_TIMEOUT_MS
  ): ThinkingServerManager {
    return ThinkingServerManager(
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
      assertEquals(120_000L, ThinkingServerManager.DEFAULT_HEALTH_CHECK_TIMEOUT_MS)
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

      val processField = ThinkingServerManager::class.java.getDeclaredField("process")
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

      val processField = ThinkingServerManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

      manager.stop()

      verify { mockProcess.destroy() }
      verify { mockProcess.destroyForcibly() }
    }

    @Test
    fun stopHandlesExceptionGracefully() {
      val manager = createManager()
      val mockProcess = mockk<Process>(relaxed = true)
      every { mockProcess.destroy() } throws RuntimeException("destroy failed")
      every { mockProcess.destroyForcibly() } returns mockProcess

      val processField = ThinkingServerManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

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

      val processField = ThinkingServerManager::class.java.getDeclaredField("process")
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
    fun acceptsZeroGpuLayers() {
      val manager = createManager(gpuLayers = 0)
      assertNotNull(manager)
    }

    @Test
    fun acceptsNegativeGpuLayers() {
      val manager = createManager(gpuLayers = -1)
      assertNotNull(manager)
    }

    @Test
    fun acceptsCustomCtxSize() {
      val manager = createManager(ctxSize = 8192)
      assertNotNull(manager)
    }

    @Test
    fun acceptsCustomParallelSlots() {
      val manager = createManager(parallelSlots = 4)
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
          ThinkingServerManager::class
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
    fun returnsFalseForNullStatusField() {
      assertFalse(callIsHealthResponseOk("""{"status":null}"""))
    }
  }

  // endregion

  // region findThinkingPort (via reflection)

  @Nested
  inner class FindThinkingPortTest {

    private fun callFindThinkingPort(preferredPort: Int, mainServerPort: Int = 8080): Int {
      val manager = createManager(mainServerPort = mainServerPort)
      val method =
          ThinkingServerManager::class.java.getDeclaredMethod("findThinkingPort", Int::class.java)
      method.isAccessible = true
      return method.invoke(manager, preferredPort) as Int
    }

    @Test
    fun findsAvailablePort() {
      val port = callFindThinkingPort(49300)
      assertTrue(port in 1..65535)
    }

    @Test
    fun skipsMainServerPort() {
      val port = callFindThinkingPort(8080, mainServerPort = 8080)
      assertNotEquals(8080, port)
    }

    @Test
    fun handlesHighPortRange() {
      val port = callFindThinkingPort(65530)
      assertTrue(port in 1..65535)
    }

    @Test
    fun skipsBusyPort() {
      val ss = java.net.ServerSocket(0)
      val busyPort = ss.localPort
      try {
        val port = callFindThinkingPort(busyPort)
        assertTrue(port in 1..65535)
      } finally {
        ss.close()
      }
    }
  }

  // endregion

  // region waitForHealth — with real HTTP server

  @Nested
  inner class WaitForHealthTest {

    @Test
    fun returnsTrueWhenHealthy() {
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

      val portField = ThinkingServerManager::class.java.getDeclaredField("port")
      portField.isAccessible = true
      portField.set(manager, healthPort)

      val waitMethod = ThinkingServerManager::class.java.getDeclaredMethod("waitForHealth")
      waitMethod.isAccessible = true
      val healthy = waitMethod.invoke(manager) as Boolean

      assertTrue(healthy)
      healthServer.stop(0)
    }

    @Test
    fun returnsFalseOnTimeout() {
      val manager = createManager(healthCheckTimeoutMs = 2000)

      val portField = ThinkingServerManager::class.java.getDeclaredField("port")
      portField.isAccessible = true
      portField.set(manager, 1)

      val waitMethod = ThinkingServerManager::class.java.getDeclaredMethod("waitForHealth")
      waitMethod.isAccessible = true
      val healthy = waitMethod.invoke(manager) as Boolean

      assertFalse(healthy)
      assertTrue(logMessages.any { it.second.contains("timed out") })
    }

    @Test
    fun returnsFalseWhenProcessDies() {
      val manager = createManager(healthCheckTimeoutMs = 5000)

      val mockProcess = mockk<Process>(relaxed = true)
      every { mockProcess.isAlive } returns false
      every { mockProcess.exitValue() } returns 1

      val processField = ThinkingServerManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

      val portField = ThinkingServerManager::class.java.getDeclaredField("port")
      portField.isAccessible = true
      portField.set(manager, 1)

      val waitMethod = ThinkingServerManager::class.java.getDeclaredMethod("waitForHealth")
      waitMethod.isAccessible = true
      val healthy = waitMethod.invoke(manager) as Boolean

      assertFalse(healthy)
      assertTrue(logMessages.any { it.second.contains("process died") })
    }

    @Test
    fun returnsFalseForNon200Health() {
      val healthServer = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
      val healthPort = healthServer.address.port
      healthServer.createContext("/health") { exchange ->
        exchange.sendResponseHeaders(503, -1)
        exchange.responseBody.close()
      }
      healthServer.executor = null
      healthServer.start()

      val manager = createManager(healthCheckTimeoutMs = 3000)

      val portField = ThinkingServerManager::class.java.getDeclaredField("port")
      portField.isAccessible = true
      portField.set(manager, healthPort)

      val waitMethod = ThinkingServerManager::class.java.getDeclaredMethod("waitForHealth")
      waitMethod.isAccessible = true
      val healthy = waitMethod.invoke(manager) as Boolean

      assertFalse(healthy)
      healthServer.stop(0)
    }

    @Test
    fun returnsFalseForNonOkStatus() {
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

      val portField = ThinkingServerManager::class.java.getDeclaredField("port")
      portField.isAccessible = true
      portField.set(manager, healthPort)

      val waitMethod = ThinkingServerManager::class.java.getDeclaredMethod("waitForHealth")
      waitMethod.isAccessible = true
      val healthy = waitMethod.invoke(manager) as Boolean

      assertFalse(healthy)
      healthServer.stop(0)
    }
  }

  // endregion

  // region start — failure paths

  @Nested
  inner class StartTest {

    @Test
    fun startFailsWithInvalidBinary() {
      val manager = createManager(healthCheckTimeoutMs = 3000)
      val binary = java.io.File("nonexistent-binary-xyz-123")
      val model = java.io.File("nonexistent-model.gguf")
      val executor = java.util.concurrent.Executors.newFixedThreadPool(2)

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
    fun startWithTempFilesReturnsFalse() {
      val manager = createManager()
      val binary = java.io.File.createTempFile("fake-server", ".bin")
      binary.deleteOnExit()
      val model = java.io.File.createTempFile("model", ".gguf")
      model.writeText("fake model data")
      model.deleteOnExit()
      val executor = java.util.concurrent.Executors.newFixedThreadPool(2)
      try {
        val result = manager.start(binary, model, null, executor)
        assertFalse(result)
      } finally {
        executor.shutdownNow()
      }
    }

    @Test
    fun startLogsModelSizeAndPort() {
      val manager = createManager()
      val binary = java.io.File.createTempFile("fake-server", ".bin")
      binary.deleteOnExit()
      val model = java.io.File.createTempFile("model", ".gguf")
      model.writeText("x".repeat(2048))
      model.deleteOnExit()
      val executor = java.util.concurrent.Executors.newFixedThreadPool(2)
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
    fun startWithMmprojLogsIt() {
      val manager = createManager()
      val binary = java.io.File.createTempFile("fake-server", ".bin")
      binary.deleteOnExit()
      val model = java.io.File.createTempFile("model", ".gguf")
      model.deleteOnExit()
      val mmproj = java.io.File.createTempFile("mmproj", ".gguf")
      mmproj.deleteOnExit()
      val executor = java.util.concurrent.Executors.newFixedThreadPool(2)
      try {
        manager.start(binary, model, mmproj, executor)
      } finally {
        executor.shutdownNow()
      }
      assertTrue(logMessages.any { it.second.contains("mmproj") })
    }

    @Test
    fun startWithGpuCudaUses999Layers() {
      val manager = createManager(gpuLayers = -1, detectedGpu = GpuBackend.CUDA)
      val binary = java.io.File.createTempFile("fake-server", ".bin")
      binary.deleteOnExit()
      val model = java.io.File.createTempFile("model", ".gguf")
      model.deleteOnExit()
      val executor = java.util.concurrent.Executors.newFixedThreadPool(2)
      try {
        manager.start(binary, model, null, executor)
      } finally {
        executor.shutdownNow()
      }
      val cmdLog = logMessages.firstOrNull { it.second.contains("command:") }?.second ?: ""
      assertTrue(cmdLog.contains("999"), "CUDA → 999 GPU layers; cmd=$cmdLog")
    }

    @Test
    fun startWithNoGpuUses0Layers() {
      val manager = createManager(gpuLayers = -1, detectedGpu = GpuBackend.NONE)
      val binary = java.io.File.createTempFile("fake-server", ".bin")
      binary.deleteOnExit()
      val model = java.io.File.createTempFile("model", ".gguf")
      model.deleteOnExit()
      val executor = java.util.concurrent.Executors.newFixedThreadPool(2)
      try {
        manager.start(binary, model, null, executor)
      } finally {
        executor.shutdownNow()
      }
      val cmdLog = logMessages.firstOrNull { it.second.contains("command:") }?.second ?: ""
      assertTrue(
          cmdLog.contains("--n-gpu-layers") && cmdLog.contains(" 0"),
          "NONE → 0 layers; cmd=$cmdLog")
    }

    @Test
    fun startUsesDoubleCtxSize() {
      val manager = createManager(ctxSize = 2048)
      val binary = java.io.File.createTempFile("fake-server", ".bin")
      binary.deleteOnExit()
      val model = java.io.File.createTempFile("model", ".gguf")
      model.deleteOnExit()
      val executor = java.util.concurrent.Executors.newFixedThreadPool(2)
      try {
        manager.start(binary, model, null, executor)
      } finally {
        executor.shutdownNow()
      }
      val cmdLog = logMessages.firstOrNull { it.second.contains("command:") }?.second ?: ""
      assertTrue(cmdLog.contains("4096"), "Thinking ctx-size should be 2* base; cmd=$cmdLog")
    }
  }

  // endregion
}
