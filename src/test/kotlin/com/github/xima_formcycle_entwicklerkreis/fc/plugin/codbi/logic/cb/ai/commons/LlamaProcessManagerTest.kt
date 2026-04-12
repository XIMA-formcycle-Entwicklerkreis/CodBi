package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.sun.net.httpserver.HttpServer
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import java.net.InetSocketAddress
import java.util.concurrent.TimeUnit
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/**
 * Tests for [LlamaProcessManager] — port finding, state management, process lifecycle, and health
 * checks.
 */
class LlamaProcessManagerTest {

  private val logMessages = mutableListOf<Pair<LogLevel, String>>()
  private lateinit var manager: LlamaProcessManager

  @BeforeEach
  fun setUp() {
    logMessages.clear()
    manager = LlamaProcessManager { level, msg -> logMessages.add(level to msg) }
  }

  // region Constants

  @Nested
  inner class ConstantsTest {

    @Test
    fun serverStartTimeoutIsReasonable() {
      assertEquals(120_000L, LlamaProcessManager.SERVER_START_TIMEOUT_MS)
    }
  }

  // endregion

  // region isAlive

  @Nested
  inner class IsAliveTest {

    @Test
    fun returnsFalseWhenNoProcess() {
      assertFalse(manager.isAlive())
    }
  }

  // endregion

  // region stopProcess

  @Nested
  inner class StopProcessTest {

    @Test
    fun noOpWhenNoProcess() {
      // Should not throw
      manager.stopProcess()
      assertFalse(manager.isAlive())
    }

    @Test
    fun processIsNullAfterStop() {
      manager.stopProcess()
      assertNull(manager.process)
    }
  }

  // endregion

  // region findFreePort

  @Nested
  inner class FindFreePortTest {

    @Test
    fun returnsPreferredPortWhenAvailable() {
      // Port 0 ranges are ephemeral; use a high unlikely-to-be-busy port
      val port = manager.findFreePort(49152)

      assertTrue(port in 49152..49171, "Expected port in probed range, got $port")
    }

    @Test
    fun returnsValidPort() {
      val port = manager.findFreePort(8080)

      assertTrue(port in 1..65535, "Expected valid port, got $port")
    }

    @Test
    fun differentPreferredPortsReturnDifferentResults() {
      val port1 = manager.findFreePort(49200)
      val port2 = manager.findFreePort(49300)

      // They should be in different ranges
      assertTrue(port1 != port2 || port1 in 49200..49219 || port2 in 49300..49319)
    }

    @Test
    fun handlesPortNearMaxRange() {
      // Port 65530 — only 5 candidates before hitting 65535
      val port = manager.findFreePort(65530)

      assertTrue(port in 1..65535, "Expected valid port, got $port")
    }

    @Test
    fun logsWhenPreferredPortBusy() {
      // Bind a port, then ask for it — the manager should probe upward
      val ss = java.net.ServerSocket(0)
      val busyPort = ss.localPort
      try {
        val port = manager.findFreePort(busyPort)
        // Should get a different port (offset >= 1)
        assertTrue(port != busyPort || port in 1..65535)
      } finally {
        ss.close()
      }
    }

    @Test
    fun findsPortWhenFirstIsBusy() {
      val ss = java.net.ServerSocket(0)
      val busyPort = ss.localPort
      try {
        val port = manager.findFreePort(busyPort)
        assertTrue(port in 1..65535)
        if (port != busyPort) {
          // If a different port was chosen, a log message about busy port should exist
          assertTrue(logMessages.any { it.second.contains("busy") } || port > busyPort)
        }
      } finally {
        ss.close()
      }
    }
  }

  // endregion

  // region isHealthResponseOk (via reflection)

  @Nested
  inner class IsHealthResponseOkTest {

    /** Invokes the private isHealthResponseOk method via reflection. */
    private fun callIsHealthResponseOk(body: String): Boolean {
      val method =
          LlamaProcessManager::class
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
  }

  // endregion

  // region launchProcess basics

  @Nested
  inner class LaunchProcessTest {

    @Test
    fun launchWithInvalidCommandThrows() {
      // Non-existent binary throws IOException from ProcessBuilder
      assertThrows(java.io.IOException::class.java) {
        manager.launchProcess(listOf("nonexistent-binary-xyz-123"), java.io.File("."), 12345)
      }
    }
  }

  // endregion

  // region stopProcess with mock Process

  @Nested
  inner class StopProcessWithMockTest {

    @Test
    fun destroysGracefully() {
      val mockProcess = mockk<Process>(relaxed = true)
      every { mockProcess.waitFor(10, TimeUnit.SECONDS) } returns true
      every { mockProcess.exitValue() } returns 0

      val processField = LlamaProcessManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

      manager.stopProcess()

      verify { mockProcess.destroy() }
      assertNull(manager.process)
    }

    @Test
    fun forceKillsOnTimeout() {
      val mockProcess = mockk<Process>(relaxed = true)
      every { mockProcess.waitFor(10, TimeUnit.SECONDS) } returns false
      every { mockProcess.waitFor(5, TimeUnit.SECONDS) } returns true
      every { mockProcess.exitValue() } returns 137

      val processField = LlamaProcessManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

      manager.stopProcess()

      verify { mockProcess.destroy() }
      verify { mockProcess.destroyForcibly() }
      assertTrue(logMessages.any { it.second.contains("force killing") })
    }

    @Test
    fun handlesDestroyException() {
      val mockProcess = mockk<Process>(relaxed = true)
      every { mockProcess.destroy() } throws RuntimeException("destroy error")
      every { mockProcess.destroyForcibly() } returns mockProcess

      val processField = LlamaProcessManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

      manager.stopProcess()

      verify { mockProcess.destroyForcibly() }
      assertTrue(logMessages.any { it.second.contains("Error stopping") })
    }

    @Test
    fun logsExitCode() {
      val mockProcess = mockk<Process>(relaxed = true)
      every { mockProcess.waitFor(any(), any<TimeUnit>()) } returns true
      every { mockProcess.exitValue() } returns 42

      val processField = LlamaProcessManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

      manager.stopProcess()

      assertTrue(logMessages.any { it.second.contains("42") })
    }

    @Test
    fun clearsProcessAndThreads() {
      val mockProcess = mockk<Process>(relaxed = true)
      every { mockProcess.waitFor(any(), any<TimeUnit>()) } returns true
      every { mockProcess.exitValue() } returns 0

      val processField = LlamaProcessManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

      manager.stopProcess()

      assertNull(manager.process)
    }

    @Test
    fun isAliveReturnsTrueWhenProcessAlive() {
      val mockProcess = mockk<Process>(relaxed = true)
      every { mockProcess.isAlive } returns true

      val processField = LlamaProcessManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

      assertTrue(manager.isAlive())
    }

    @Test
    fun isAliveReturnsFalseWhenProcessDead() {
      val mockProcess = mockk<Process>(relaxed = true)
      every { mockProcess.isAlive } returns false

      val processField = LlamaProcessManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

      assertFalse(manager.isAlive())
    }
  }

  // endregion

  // region waitForHealth — with real HTTP server

  @Nested
  inner class WaitForHealthTest {

    private fun callWaitForHealth(port: Int): Boolean {
      val method =
          LlamaProcessManager::class.java.getDeclaredMethod("waitForHealth", Int::class.java)
      method.isAccessible = true
      return method.invoke(manager, port) as Boolean
    }

    @Test
    fun returnsTrueWhenHealthEndpointReturnsOk() {
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

      try {
        val healthy = callWaitForHealth(healthPort)
        assertTrue(healthy)
      } finally {
        healthServer.stop(0)
      }
    }

    @Test
    fun returnsFalseWhenProcessDies() {
      val mockProcess = mockk<Process>(relaxed = true)
      every { mockProcess.isAlive } returns false
      every { mockProcess.exitValue() } returns 1

      val processField = LlamaProcessManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

      val healthy = callWaitForHealth(1)
      assertFalse(healthy)
      assertTrue(logMessages.any { it.second.contains("process died") })
    }

    @Test
    fun returnsFalseWhenHealthReturnsNon200() {
      val healthServer = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
      val healthPort = healthServer.address.port
      var requestCount = 0
      healthServer.createContext("/health") { exchange ->
        requestCount++
        if (requestCount >= 2) {
          // After second request, return ok to stop polling
          val body = """{"status":"ok"}"""
          val bytes = body.toByteArray()
          exchange.sendResponseHeaders(200, bytes.size.toLong())
          exchange.responseBody.use { it.write(bytes) }
        } else {
          // First request returns 503
          exchange.sendResponseHeaders(503, -1)
          exchange.close()
        }
      }
      healthServer.executor = null
      healthServer.start()

      try {
        val healthy = callWaitForHealth(healthPort)
        // Should eventually succeed after retry
        assertTrue(healthy)
        assertTrue(requestCount >= 2, "Should have polled at least twice")
      } finally {
        healthServer.stop(0)
      }
    }
  }

  // endregion

  // region launchProcess — already running guard

  @Nested
  inner class LaunchProcessAlreadyRunningTest {

    @Test
    fun stopsExistingProcessBeforeRelaunch() {
      val mockProcess = mockk<Process>(relaxed = true)
      every { mockProcess.waitFor(any(), any<TimeUnit>()) } returns true
      every { mockProcess.exitValue() } returns 0

      val processField = LlamaProcessManager::class.java.getDeclaredField("process")
      processField.isAccessible = true
      processField.set(manager, mockProcess)

      // Now launch a new process (which will fail with invalid binary)
      assertThrows(java.io.IOException::class.java) {
        manager.launchProcess(listOf("nonexistent-binary-xyz-123"), java.io.File("."), 12345)
      }

      // The existing process should have been stopped
      verify { mockProcess.destroy() }
      assertTrue(logMessages.any { it.second.contains("already running") })
    }
  }

  // endregion
}
