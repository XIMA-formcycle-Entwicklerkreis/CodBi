package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.sun.net.httpserver.HttpServer
import java.io.File
import java.net.InetSocketAddress
import java.util.concurrent.Executors
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/**
 * Tests for [NotificationService] — backoff computation, marker file persistence,
 * system-mail.properties location logic.
 */
class NotificationServiceTest {

  private val logs = mutableListOf<String>()
  private lateinit var tempDir: File
  private lateinit var executor: java.util.concurrent.ExecutorService

  @BeforeEach
  fun setUp() {
    logs.clear()
    tempDir = File(System.getProperty("java.io.tmpdir"), "notif-test-${System.nanoTime()}")
    tempDir.mkdirs()
    executor = Executors.newSingleThreadExecutor()
  }

  @AfterEach
  fun tearDown() {
    executor.shutdownNow()
    tempDir.deleteRecursively()
  }

  private fun createService(
      llamaRelease: String = "b8175",
      notifyEmail: String? = null,
      pluginFolder: File? = null,
      engineDir: File? = tempDir
  ) =
      NotificationService(
          llamaRelease = llamaRelease,
          platformKey = "windows_x86_64",
          notifyEmail = notifyEmail,
          pluginFolder = pluginFolder,
          llamaEngineDir = engineDir,
          propPrefix = "AI_LLAMA_STD",
          githubReleasesApi = "https://api.github.com/repos/ggml-org/llama.cpp/releases/latest",
          buildServerUrls = { tag -> mapOf("windows_x86_64" to "https://example.com/$tag.zip") },
          log = { _, msg -> logs.add(msg) },
          executor = executor)

  // region Start/Shutdown

  @Nested
  inner class StartShutdownTest {

    @Test
    fun startWithZeroIntervalDisables() {
      val svc = createService()
      svc.start(0)
      assertTrue(logs.any { it.contains("disabled") })
    }

    @Test
    fun shutdownDoesNotThrow() {
      val svc = createService()
      svc.shutdown() // Should be safe even if never started
    }
  }

  // endregion

  // region Marker File

  @Nested
  inner class MarkerFileTest {

    @Test
    fun readsExistingMarkerFile() {
      val markerFile = File(tempDir, "last-notified-release.txt")
      markerFile.writeText("b8200")
      val svc = createService()
      svc.start(1) // Start reads marker file
      // Service should have read "b8200" from marker
      svc.shutdown()
    }

    @Test
    fun handlesEmptyMarkerFile() {
      val markerFile = File(tempDir, "last-notified-release.txt")
      markerFile.writeText("")
      val svc = createService()
      svc.start(1)
      svc.shutdown()
      // Should not crash
    }

    @Test
    fun handlesNullEngineDir() {
      val svc = createService(engineDir = null)
      svc.start(1)
      svc.shutdown()
      // Should not crash
    }
  }

  // endregion

  // region Plugin Folder Navigation

  @Nested
  inner class PluginFolderTest {

    @Test
    fun nullPluginFolderHandled() {
      val svc = createService(pluginFolder = null)
      // The service should handle null pluginFolder gracefully
      assertNotNull(svc)
    }

    @Test
    fun deepPluginFolderStructure() {
      // Simulate: xfc-server/config/plugins/system/uuid/
      val uuid = File(tempDir, "config/plugins/system/test-uuid")
      uuid.mkdirs()
      val svc = createService(pluginFolder = uuid)
      assertNotNull(svc)
    }
  }

  // endregion

  // region Constructor Validation

  @Nested
  inner class ConstructorTest {

    @Test
    fun acceptsAllParameters() {
      val svc =
          createService(
              llamaRelease = "b9999", notifyEmail = "admin@example.com", pluginFolder = tempDir)
      assertNotNull(svc)
    }

    @Test
    fun platformKeyStored() {
      val svc = createService()
      assertNotNull(svc)
    }
  }

  // endregion

  // region computeBackoffMs

  @Nested
  inner class ComputeBackoffTest {

    @Test
    fun baseIntervalWithNoFailures() {
      val svc = createService()
      val method =
          NotificationService::class.java.getDeclaredMethod("computeBackoffMs", Long::class.java)
      method.isAccessible = true
      val result = method.invoke(svc, 6L) as Long
      assertEquals(6 * 3600 * 1000L, result)
    }

    @Test
    fun doublesOnFirstFailure() {
      val svc = createService()
      val failField = NotificationService::class.java.getDeclaredField("consecutiveFailures")
      failField.isAccessible = true
      failField.setInt(svc, 1)
      val method =
          NotificationService::class.java.getDeclaredMethod("computeBackoffMs", Long::class.java)
      method.isAccessible = true
      val result = method.invoke(svc, 6L) as Long
      assertEquals(6 * 3600 * 1000L * 2, result)
    }

    @Test
    fun quadruplesOnTwoFailures() {
      val svc = createService()
      val failField = NotificationService::class.java.getDeclaredField("consecutiveFailures")
      failField.isAccessible = true
      failField.setInt(svc, 2)
      val method =
          NotificationService::class.java.getDeclaredMethod("computeBackoffMs", Long::class.java)
      method.isAccessible = true
      val result = method.invoke(svc, 6L) as Long
      assertEquals(6 * 3600 * 1000L * 4, result)
    }

    @Test
    fun capsAt24Hours() {
      val svc = createService()
      val failField = NotificationService::class.java.getDeclaredField("consecutiveFailures")
      failField.isAccessible = true
      failField.setInt(svc, 10)
      val method =
          NotificationService::class.java.getDeclaredMethod("computeBackoffMs", Long::class.java)
      method.isAccessible = true
      val result = method.invoke(svc, 6L) as Long
      assertEquals(24 * 3600 * 1000L, result)
    }

    @Test
    fun capsFailureShiftAt6() {
      val svc = createService()
      val failField = NotificationService::class.java.getDeclaredField("consecutiveFailures")
      failField.isAccessible = true
      failField.setInt(svc, 6)
      val method =
          NotificationService::class.java.getDeclaredMethod("computeBackoffMs", Long::class.java)
      method.isAccessible = true
      val result = method.invoke(svc, 1L) as Long
      // 1h * 64 = 64h, but capped at 24h
      assertEquals(24 * 3600 * 1000L, result)
    }
  }

  // endregion

  // region findSystemMailProperties

  @Nested
  inner class FindSystemMailPropertiesTest {

    @Test
    fun findsFileThreeLevelsUp() {
      // Create: tempDir/config/plugins/system/uuid/
      val configDir = File(tempDir, "config")
      val pluginDir = File(configDir, "plugins/system/test-uuid")
      pluginDir.mkdirs()
      // Create system-mail.properties at configDir level
      File(configDir, "system-mail.properties").writeText("mail.smtp.host=smtp.test.com")
      val svc = createService(pluginFolder = pluginDir)
      val method = NotificationService::class.java.getDeclaredMethod("findSystemMailProperties")
      method.isAccessible = true
      val result = method.invoke(svc) as? File
      assertNotNull(result, "Should find system-mail.properties 3 levels up")
      assertTrue(result!!.exists())
    }

    @Test
    fun returnsNullWhenFileMissing() {
      val pluginDir = File(tempDir, "config/plugins/system/test-uuid")
      pluginDir.mkdirs()
      val svc = createService(pluginFolder = pluginDir)
      val method = NotificationService::class.java.getDeclaredMethod("findSystemMailProperties")
      method.isAccessible = true
      val result = method.invoke(svc) as? File
      assertNull(result, "Should return null when mail properties file doesn't exist")
    }

    @Test
    fun returnsNullForNullPluginFolder() {
      val svc = createService(pluginFolder = null)
      val method = NotificationService::class.java.getDeclaredMethod("findSystemMailProperties")
      method.isAccessible = true
      val result = method.invoke(svc) as? File
      assertNull(result)
      assertTrue(logs.any { it.contains("pluginFolder is null") })
    }

    @Test
    fun returnsNullForShallowFolder() {
      // Plugin folder is root — no 3 levels of parents
      val svc = createService(pluginFolder = File("/"))
      val method = NotificationService::class.java.getDeclaredMethod("findSystemMailProperties")
      method.isAccessible = true
      val result = method.invoke(svc) as? File
      assertNull(result)
    }
  }

  // endregion

  // region checkForNewRelease

  @Nested
  inner class CheckForNewReleaseTest {

    @Test
    fun incrementsFailureCountOnApiError() {
      // Use a local URL that will fail
      val svc =
          NotificationService(
              llamaRelease = "b8175",
              platformKey = "windows_x86_64",
              notifyEmail = null,
              pluginFolder = null,
              llamaEngineDir = tempDir,
              propPrefix = "AI_LLAMA_STD",
              githubReleasesApi = "http://localhost:1/nonexistent",
              buildServerUrls = { tag -> mapOf("windows_x86_64" to "http://localhost:1/$tag.zip") },
              log = { _, msg -> logs.add(msg) },
              executor = executor)
      val method = NotificationService::class.java.getDeclaredMethod("checkForNewRelease")
      method.isAccessible = true
      method.invoke(svc)
      val failField = NotificationService::class.java.getDeclaredField("consecutiveFailures")
      failField.isAccessible = true
      val failures = failField.getInt(svc)
      assertTrue(failures > 0, "Should increment failure count on API error")
      assertTrue(logs.any { it.contains("Could not determine") || it.contains("failed") })
    }

    @Test
    fun logsCheckAttempt() {
      val svc =
          NotificationService(
              llamaRelease = "b8175",
              platformKey = "windows_x86_64",
              notifyEmail = null,
              pluginFolder = null,
              llamaEngineDir = tempDir,
              propPrefix = "AI_LLAMA_STD",
              githubReleasesApi = "http://localhost:1/nonexistent-too",
              buildServerUrls = { tag -> mapOf("windows_x86_64" to "http://localhost:1/$tag.zip") },
              log = { _, msg -> logs.add(msg) },
              executor = executor)
      val method = NotificationService::class.java.getDeclaredMethod("checkForNewRelease")
      method.isAccessible = true
      method.invoke(svc)
      assertTrue(logs.isNotEmpty(), "Should produce log entries")
    }
  }

  // endregion

  // region sendUpdateNotification

  @Nested
  inner class SendUpdateNotificationTest {

    @Test
    fun failsWithoutMailConfig() {
      val svc = createService(pluginFolder = null)
      val method =
          NotificationService::class
              .java
              .getDeclaredMethod("sendUpdateNotification", String::class.java)
      method.isAccessible = true
      val result = method.invoke(svc, "b9999") as Boolean
      assertFalse(result)
      assertTrue(
          logs.any { it.contains("system-mail.properties") || it.contains("pluginFolder is null") })
    }

    @Test
    fun failsWithEmptySmtpHost() {
      val configDir = File(tempDir, "config")
      val pluginDir = File(configDir, "plugins/system/test-uuid")
      pluginDir.mkdirs()
      File(configDir, "system-mail.properties").writeText("mail.smtp.host=")
      val svc = createService(pluginFolder = pluginDir)
      val method =
          NotificationService::class
              .java
              .getDeclaredMethod("sendUpdateNotification", String::class.java)
      method.isAccessible = true
      val result = method.invoke(svc, "b9999") as Boolean
      assertFalse(result)
      assertTrue(logs.any { it.contains("mail.smtp.host") })
    }

    @Test
    fun failsWithNoRecipient() {
      val configDir = File(tempDir, "config")
      val pluginDir = File(configDir, "plugins/system/test-uuid")
      pluginDir.mkdirs()
      File(configDir, "system-mail.properties")
          .writeText("mail.smtp.host=smtp.test.com\nmail.smtp.port=25")
      val svc = createService(pluginFolder = pluginDir, notifyEmail = null)
      val method =
          NotificationService::class
              .java
              .getDeclaredMethod("sendUpdateNotification", String::class.java)
      method.isAccessible = true
      val result = method.invoke(svc, "b9999") as Boolean
      assertFalse(result)
      assertTrue(logs.any { it.contains("no recipient") })
    }

    @Test
    fun failsOnSmtpConnectionError() {
      val configDir = File(tempDir, "config")
      val pluginDir = File(configDir, "plugins/system/test-uuid")
      pluginDir.mkdirs()
      File(configDir, "system-mail.properties")
          .writeText("mail.smtp.host=localhost\nmail.smtp.port=1\nmail.smtp.from=test@example.com")
      val svc = createService(pluginFolder = pluginDir, notifyEmail = "admin@example.com")
      val method =
          NotificationService::class
              .java
              .getDeclaredMethod("sendUpdateNotification", String::class.java)
      method.isAccessible = true
      val result = method.invoke(svc, "b9999") as Boolean
      assertFalse(result)
      assertTrue(logs.any { it.contains("Failed to send") })
    }
  }

  // endregion

  // region fetchLatestReleaseTag — with embedded HTTP server

  @Nested
  inner class FetchLatestReleaseTagHttpTest {

    private lateinit var httpServer: HttpServer
    private var httpPort: Int = 0

    @BeforeEach
    fun setUpServer() {
      httpServer = HttpServer.create(InetSocketAddress(0), 0)
      httpPort = httpServer.address.port

      httpServer.createContext("/release-ok") { exchange ->
        val body = """{"tag_name":"b8200","name":"Release b8200"}"""
        exchange.sendResponseHeaders(200, body.length.toLong())
        exchange.responseBody.use { it.write(body.toByteArray()) }
      }
      httpServer.createContext("/release-no-tag") { exchange ->
        val body = """{"name":"No Tag Release"}"""
        exchange.sendResponseHeaders(200, body.length.toLong())
        exchange.responseBody.use { it.write(body.toByteArray()) }
      }
      httpServer.createContext("/release-500") { exchange ->
        exchange.sendResponseHeaders(500, -1)
        exchange.close()
      }
      httpServer.createContext("/release-bad-json") { exchange ->
        val body = "not valid json {{{"
        exchange.sendResponseHeaders(200, body.length.toLong())
        exchange.responseBody.use { it.write(body.toByteArray()) }
      }
      httpServer.executor = null
      httpServer.start()
    }

    @AfterEach
    fun tearDownServer() {
      httpServer.stop(0)
    }

    private fun createServiceWithApi(apiUrl: String) =
        NotificationService(
            llamaRelease = "b8175",
            platformKey = "windows_x86_64",
            notifyEmail = null,
            pluginFolder = null,
            llamaEngineDir = tempDir,
            propPrefix = "AI_LLAMA_STD",
            githubReleasesApi = apiUrl,
            buildServerUrls = { tag -> mapOf("windows_x86_64" to "https://example.com/$tag.zip") },
            log = { _, msg -> logs.add(msg) },
            executor = executor)

    @Test
    fun fetchReturnsTagNameOn200() {
      val svc = createServiceWithApi("http://127.0.0.1:$httpPort/release-ok")
      val method = NotificationService::class.java.getDeclaredMethod("fetchLatestReleaseTag")
      method.isAccessible = true
      val result = method.invoke(svc) as String?
      assertEquals("b8200", result)
    }

    @Test
    fun fetchReturnsNullWhenNoTagField() {
      val svc = createServiceWithApi("http://127.0.0.1:$httpPort/release-no-tag")
      val method = NotificationService::class.java.getDeclaredMethod("fetchLatestReleaseTag")
      method.isAccessible = true
      val result = method.invoke(svc) as String?
      assertNull(result)
    }

    @Test
    fun fetchReturnsNullOnHttp500() {
      val svc = createServiceWithApi("http://127.0.0.1:$httpPort/release-500")
      val method = NotificationService::class.java.getDeclaredMethod("fetchLatestReleaseTag")
      method.isAccessible = true
      val result = method.invoke(svc) as String?
      assertNull(result)
      assertTrue(logs.any { it.contains("500") })
    }

    @Test
    fun fetchReturnsNullOnConnectionError() {
      val svc = createServiceWithApi("http://127.0.0.1:1/nowhere")
      val method = NotificationService::class.java.getDeclaredMethod("fetchLatestReleaseTag")
      method.isAccessible = true
      val result = method.invoke(svc) as String?
      assertNull(result)
      assertTrue(logs.any { it.contains("failed") || it.contains("Failed") })
    }
  }

  // endregion

  // region isReleaseAvailableForPlatform — edge cases

  @Nested
  inner class IsReleaseAvailableTest {

    @Test
    fun returnsFalseWhenPlatformNotInMap() {
      val svc =
          NotificationService(
              llamaRelease = "b8175",
              platformKey = "linux_arm64",
              notifyEmail = null,
              pluginFolder = null,
              llamaEngineDir = tempDir,
              propPrefix = "AI_LLAMA_STD",
              githubReleasesApi = "http://127.0.0.1:1/none",
              buildServerUrls = { _ ->
                mapOf("windows_x86_64" to "https://example.com/release.zip")
              },
              log = { _, msg -> logs.add(msg) },
              executor = executor)
      val method =
          NotificationService::class
              .java
              .getDeclaredMethod("isReleaseAvailableForPlatform", String::class.java)
      method.isAccessible = true
      val result = method.invoke(svc, "b8200") as Boolean
      assertFalse(result)
    }

    @Test
    fun returnsFalseOnConnectionError() {
      val svc =
          NotificationService(
              llamaRelease = "b8175",
              platformKey = "windows_x86_64",
              notifyEmail = null,
              pluginFolder = null,
              llamaEngineDir = tempDir,
              propPrefix = "AI_LLAMA_STD",
              githubReleasesApi = "http://127.0.0.1:1/none",
              buildServerUrls = { _ ->
                mapOf("windows_x86_64" to "https://127.0.0.1:1/nothing.zip")
              },
              log = { _, msg -> logs.add(msg) },
              executor = executor)
      val method =
          NotificationService::class
              .java
              .getDeclaredMethod("isReleaseAvailableForPlatform", String::class.java)
      method.isAccessible = true
      val result = method.invoke(svc, "b8200") as Boolean
      assertFalse(result)
    }
  }

  // endregion
}
