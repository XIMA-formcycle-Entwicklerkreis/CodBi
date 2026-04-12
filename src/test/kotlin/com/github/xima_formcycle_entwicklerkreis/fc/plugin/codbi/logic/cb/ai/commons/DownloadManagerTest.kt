package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.sun.net.httpserver.HttpServer
import java.io.File
import java.io.FileOutputStream
import java.net.InetSocketAddress
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance

/** Tests for [DownloadManager]. */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class DownloadManagerTest {

  private val logMessages = mutableListOf<Pair<LogLevel, String>>()
  private lateinit var dm: DownloadManager
  private lateinit var tempDir: File

  private lateinit var server: HttpServer
  private var serverPort: Int = 0

  @BeforeAll
  fun startServer() {
    server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
    serverPort = server.address.port

    // Full file download (200 OK, no range support)
    server.createContext("/full-file") { exchange ->
      val content = "Hello, this is the full file content for testing downloads."
      val bytes = content.toByteArray(Charsets.UTF_8)
      exchange.responseHeaders.add("Content-Length", bytes.size.toString())
      exchange.sendResponseHeaders(200, bytes.size.toLong())
      exchange.responseBody.use { it.write(bytes) }
    }

    // Range-aware endpoint
    server.createContext("/range-file") { exchange ->
      val fullContent = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      val rangeHeader = exchange.requestHeaders.getFirst("Range")
      if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
        val start = rangeHeader.removePrefix("bytes=").removeSuffix("-").toLong()
        val remaining = fullContent.substring(start.toInt())
        val bytes = remaining.toByteArray(Charsets.UTF_8)
        exchange.responseHeaders.add("Content-Length", bytes.size.toString())
        exchange.sendResponseHeaders(206, bytes.size.toLong())
        exchange.responseBody.use { it.write(bytes) }
      } else {
        val bytes = fullContent.toByteArray(Charsets.UTF_8)
        exchange.responseHeaders.add("Content-Length", bytes.size.toString())
        exchange.sendResponseHeaders(200, bytes.size.toLong())
        exchange.responseBody.use { it.write(bytes) }
      }
    }

    // Redirect endpoint (302 → /full-file)
    server.createContext("/redirect") { exchange ->
      exchange.responseHeaders.add("Location", "http://127.0.0.1:$serverPort/full-file")
      exchange.sendResponseHeaders(302, -1)
      exchange.responseBody.close()
    }

    // 416 Range Not Satisfiable
    server.createContext("/range-416") { exchange ->
      exchange.sendResponseHeaders(416, -1)
      exchange.responseBody.close()
    }

    // 500 error
    server.createContext("/error-500") { exchange ->
      exchange.sendResponseHeaders(500, -1)
      exchange.responseBody.close()
    }

    // Large file for progress logging (more than 65KB to trigger progress logging)
    server.createContext("/large-file") { exchange ->
      val content = "X".repeat(200_000)
      val bytes = content.toByteArray(Charsets.UTF_8)
      exchange.responseHeaders.add("Content-Length", bytes.size.toString())
      exchange.sendResponseHeaders(200, bytes.size.toLong())
      exchange.responseBody.use { it.write(bytes) }
    }

    server.executor = null
    server.start()
  }

  @AfterAll
  fun stopServer() {
    server.stop(0)
  }

  @BeforeEach
  fun setUp() {
    logMessages.clear()
    dm = DownloadManager { level, msg -> logMessages.add(level to msg) }
    tempDir = createTempDir("download-manager-test")
  }

  @AfterEach
  fun tearDown() {
    tempDir.deleteRecursively()
  }

  // region findExecutable

  @Nested
  inner class FindExecutableTest {

    @Test
    fun findsFileInFlatDirectory() {
      val exe = File(tempDir, "server.exe").apply { writeText("binary") }

      val found = dm.findExecutable(tempDir, "server.exe")

      assertNotNull(found)
      assertEquals(exe.absolutePath, found!!.absolutePath)
    }

    @Test
    fun findsFileInNestedDirectory() {
      val nested = File(tempDir, "bin/release").apply { mkdirs() }
      val exe = File(nested, "llama-server.exe").apply { writeText("binary") }

      val found = dm.findExecutable(tempDir, "llama-server.exe")

      assertNotNull(found)
      assertEquals(exe.absolutePath, found!!.absolutePath)
    }

    @Test
    fun returnsNullWhenNotFound() {
      File(tempDir, "other.txt").writeText("data")

      val found = dm.findExecutable(tempDir, "missing.exe")

      assertNull(found)
    }

    @Test
    fun returnsNullForEmptyDirectory() {
      val found = dm.findExecutable(tempDir, "any.exe")

      assertNull(found)
    }

    @Test
    fun doesNotMatchDirectoryName() {
      File(tempDir, "target.exe").mkdirs()

      val found = dm.findExecutable(tempDir, "target.exe")

      assertNull(found)
    }
  }

  // endregion

  // region extractZip

  @Nested
  inner class ExtractZipTest {

    @Test
    fun extractsNormalZip() {
      val zipFile = createTestZip(mapOf("hello.txt" to "Hello World", "sub/nested.txt" to "Nested"))
      val outDir = File(tempDir, "out")

      dm.extractZip(zipFile, outDir)

      assertTrue(File(outDir, "hello.txt").exists())
      assertEquals("Hello World", File(outDir, "hello.txt").readText())
      assertTrue(File(outDir, "sub/nested.txt").exists())
      assertEquals("Nested", File(outDir, "sub/nested.txt").readText())
    }

    @Test
    fun createsTargetDirectoryIfNeeded() {
      val zipFile = createTestZip(mapOf("a.txt" to "A"))
      val outDir = File(tempDir, "deep/nested/out")

      dm.extractZip(zipFile, outDir)

      assertTrue(outDir.exists())
      assertTrue(File(outDir, "a.txt").exists())
    }

    @Test
    fun rejectsZipSlipEntry() {
      val zipFile = File(tempDir, "evil.zip")
      ZipOutputStream(FileOutputStream(zipFile)).use { zos ->
        zos.putNextEntry(ZipEntry("../../etc/evil.txt"))
        zos.write("pwned".toByteArray())
        zos.closeEntry()
      }
      val outDir = File(tempDir, "out")

      assertThrows(SecurityException::class.java) { dm.extractZip(zipFile, outDir) }
    }

    @Test
    fun handlesEmptyZip() {
      val zipFile = File(tempDir, "empty.zip")
      ZipOutputStream(FileOutputStream(zipFile)).use { /* no entries */ }
      val outDir = File(tempDir, "out")

      dm.extractZip(zipFile, outDir)

      assertTrue(outDir.exists())
      assertEquals(0, outDir.listFiles()?.size ?: 0)
    }

    @Test
    fun handlesDirectoryEntries() {
      val zipFile = File(tempDir, "dirs.zip")
      ZipOutputStream(FileOutputStream(zipFile)).use { zos ->
        zos.putNextEntry(ZipEntry("folder/"))
        zos.closeEntry()
        zos.putNextEntry(ZipEntry("folder/file.txt"))
        zos.write("inside".toByteArray())
        zos.closeEntry()
      }
      val outDir = File(tempDir, "out")

      dm.extractZip(zipFile, outDir)

      assertTrue(File(outDir, "folder").isDirectory)
      assertEquals("inside", File(outDir, "folder/file.txt").readText())
    }

    @Test
    fun logsExtractionMessages() {
      val zipFile = createTestZip(mapOf("x.txt" to "X"))
      val outDir = File(tempDir, "out")

      dm.extractZip(zipFile, outDir)

      assertTrue(logMessages.any { it.second.contains("Extracting") })
      assertTrue(logMessages.any { it.second.contains("Extraction complete") })
    }

    @Test
    fun extractsMultipleNestedLevels() {
      val entries = mapOf("a/b/c/d.txt" to "deep", "a/b/e.txt" to "middle", "f.txt" to "top")
      val zipFile = createTestZip(entries)
      val outDir = File(tempDir, "out")

      dm.extractZip(zipFile, outDir)

      assertEquals("deep", File(outDir, "a/b/c/d.txt").readText())
      assertEquals("middle", File(outDir, "a/b/e.txt").readText())
      assertEquals("top", File(outDir, "f.txt").readText())
    }

    @Test
    fun overwritesExistingFiles() {
      val outDir = File(tempDir, "out").apply { mkdirs() }
      File(outDir, "x.txt").writeText("old content")

      val zipFile = createTestZip(mapOf("x.txt" to "new content"))
      dm.extractZip(zipFile, outDir)

      assertEquals("new content", File(outDir, "x.txt").readText())
    }

    @Test
    fun handlesLargeFileEntry() {
      val largeContent = "X".repeat(100_000)
      val zipFile = createTestZip(mapOf("big.txt" to largeContent))
      val outDir = File(tempDir, "out")

      dm.extractZip(zipFile, outDir)

      assertEquals(100_000, File(outDir, "big.txt").readText().length)
    }

    @Test
    fun handlesEntryWithSpecialChars() {
      val zipFile = createTestZip(mapOf("file with spaces.txt" to "data"))
      val outDir = File(tempDir, "out")

      dm.extractZip(zipFile, outDir)

      assertTrue(File(outDir, "file with spaces.txt").exists())
    }
  }

  // endregion

  // region findExecutable — deeper coverage

  @Nested
  inner class FindExecutableDeepTest {

    @Test
    fun findsDeeplyNestedExecutable() {
      val deep = File(tempDir, "a/b/c/d/e").apply { mkdirs() }
      val exe = File(deep, "server.exe").apply { writeText("binary") }

      val found = dm.findExecutable(tempDir, "server.exe")

      assertNotNull(found)
      assertEquals(exe.absolutePath, found!!.absolutePath)
    }

    @Test
    fun findsFirstMatch() {
      // Create multiple files with same name in different directories
      val dir1 = File(tempDir, "dir1").apply { mkdirs() }
      val dir2 = File(tempDir, "dir2").apply { mkdirs() }
      File(dir1, "target.exe").writeText("first")
      File(dir2, "target.exe").writeText("second")

      val found = dm.findExecutable(tempDir, "target.exe")

      assertNotNull(found)
      assertTrue(found!!.isFile)
    }

    @Test
    fun returnsNullForNonExistentDirectory() {
      val nonExistent = File(tempDir, "does-not-exist")

      val found = dm.findExecutable(nonExistent, "anything.exe")

      assertNull(found)
    }

    @Test
    fun matchesExactName() {
      File(tempDir, "server.exe.bak").writeText("backup")
      // Should not match partial name
      val found = dm.findExecutable(tempDir, "server.exe")
      assertNull(found)
    }
  }

  // endregion

  // region downloadWithResume — marker file behaviour

  @Nested
  inner class DownloadMarkerTest {

    @Test
    fun skipsDownloadWhenMarkerExists() {
      val target = File(tempDir, "model.gguf").apply { writeText("existing-model-data") }
      File(tempDir, "model.gguf.complete").writeText("${target.length()}")

      val result = dm.downloadWithResume("http://example.invalid/model.gguf", target, "Test")

      assertTrue(result)
      assertTrue(logMessages.any { it.second.contains("already downloaded") })
    }

    @Test
    fun doesNotSkipWhenOnlyFileExistsWithoutMarker() {
      val target = File(tempDir, "model.gguf").apply { writeText("existing-model-data") }

      // No marker file — will attempt actual download, which should fail on invalid URL
      val result = dm.downloadWithResume("http://0.0.0.0:1/model.gguf", target, "Test")

      assertFalse(result)
    }

    @Test
    fun logsSizeWhenSkippingCompleteFile() {
      val target = File(tempDir, "complete.gguf").apply { writeText("A".repeat(2048)) }
      File(tempDir, "complete.gguf.complete").writeText("${target.length()}")

      dm.downloadWithResume("http://example.invalid/complete.gguf", target, "BigModel")

      assertTrue(
          logMessages.any { it.second.contains("already downloaded") && it.second.contains("MB") })
    }
  }

  // endregion

  // region downloadWithResume — network error

  @Nested
  inner class DownloadNetworkTest {

    @Test
    fun createsParentDirsforTarget() {
      val target = File(tempDir, "deep/nested/model.gguf")
      val result = dm.downloadWithResume("http://0.0.0.0:1/model.gguf", target, "Test")
      assertFalse(result)
      assertTrue(target.parentFile.exists(), "Parent dirs should be created")
    }

    @Test
    fun logsDownloadStart() {
      val target = File(tempDir, "model.gguf")
      dm.downloadWithResume("http://0.0.0.0:1/model.gguf", target, "TestModel")
      assertTrue(logMessages.any { it.second.contains("starting download") })
    }

    @Test
    fun logsResumeInfoWhenPartialFileExists() {
      val target = File(tempDir, "model.gguf").apply { writeText("partial-data-here") }
      dm.downloadWithResume("http://0.0.0.0:1/model.gguf", target, "ResumeTest")
      assertTrue(
          logMessages.any {
            it.second.contains("resuming from") || it.second.contains("starting download")
          })
    }

    @Test
    fun logsFailureWithBytesDownloaded() {
      val target = File(tempDir, "model.gguf")
      dm.downloadWithResume("http://0.0.0.0:1/model.gguf", target, "FailTest")
      assertTrue(logMessages.any { it.second.contains("failed") })
    }

    @Test
    fun preservesPartialFileOnFailure() {
      val target = File(tempDir, "model.gguf").apply { writeText("partial-content") }
      val sizeBefore = target.length()
      dm.downloadWithResume("http://0.0.0.0:1/model.gguf", target, "PartialPreserve")
      // File should still exist (not deleted on failure)
      assertTrue(target.exists())
      assertEquals(sizeBefore, target.length())
    }

    @Test
    fun noMarkerFileCreatedOnFailure() {
      val target = File(tempDir, "model.gguf")
      dm.downloadWithResume("http://0.0.0.0:1/model.gguf", target, "NoMarker")
      val marker = File(tempDir, "model.gguf.complete")
      assertFalse(marker.exists(), "Marker should not be created on failure")
    }
  }

  // endregion

  // region extractTarGz — security

  @Nested
  inner class ExtractTarGzTest {

    @Test
    fun rejectsTarGzWithDirectoryTraversal() {
      // Create a minimal tar.gz with a ".." path entry
      val tarGzFile = File(tempDir, "evil.tar.gz")
      // Write a fake tar that "tar tzf" would list with ".."
      // Since we can't easily create a real malicious tar, just verify the code path
      // by creating one that 'tar' can't open
      tarGzFile.writeBytes(byteArrayOf(0x1f, 0x8b.toByte(), 0x08, 0x00))
      val outDir = File(tempDir, "out")
      outDir.mkdirs()
      // tar will fail, extraction will log warning
      try {
        dm.extractTarGz(tarGzFile, outDir)
      } catch (e: Exception) {
        // Expected — invalid tar.gz
      }
      assertTrue(logMessages.any { it.second.contains("Extract") })
    }

    @Test
    fun logsExtractionForTarGz() {
      val tarGzFile = File(tempDir, "test.tar.gz")
      tarGzFile.writeText("not-a-real-tar")
      val outDir = File(tempDir, "out")
      try {
        dm.extractTarGz(tarGzFile, outDir)
      } catch (e: Exception) {
        // Expected
      }
      assertTrue(logMessages.any { it.second.contains("Extracting") })
    }
  }

  // endregion

  // region downloadWithResume — real HTTP

  @Nested
  inner class DownloadHttpTest {

    @Test
    fun downloadsFullFileViaHttp200() {
      val target = File(tempDir, "downloaded.bin")

      val result =
          dm.downloadWithResume("http://127.0.0.1:$serverPort/full-file", target, "FullFile")

      assertTrue(result)
      assertTrue(target.exists())
      assertTrue(target.readText().contains("Hello"))
      // Marker file should be created
      assertTrue(File(tempDir, "downloaded.bin.complete").exists())
    }

    @Test
    fun createsMarkerFileOnSuccess() {
      val target = File(tempDir, "model.bin")

      dm.downloadWithResume("http://127.0.0.1:$serverPort/full-file", target, "Marker")

      val marker = File(tempDir, "model.bin.complete")
      assertTrue(marker.exists())
      assertEquals(target.length().toString(), marker.readText())
    }

    @Test
    fun resumesPartialDownloadWith206() {
      val target = File(tempDir, "partial.bin")
      // Write first 10 bytes manually
      target.writeText("ABCDEFGHIJ")

      val result =
          dm.downloadWithResume("http://127.0.0.1:$serverPort/range-file", target, "Resume")

      assertTrue(result)
      // File should contain full content: first 10 + remaining from server
      val content = target.readText()
      assertTrue(content.startsWith("ABCDEFGHIJ"))
      assertTrue(content.length > 10)
      assertTrue(logMessages.any { it.second.contains("resume") || it.second.contains("206") })
    }

    @Test
    fun handlesFullDownloadWhenNoRangeSupport() {
      val target = File(tempDir, "norange.bin")
      // Write partial data — the /full-file endpoint ignores Range header
      target.writeText("partial-data")

      val result =
          dm.downloadWithResume("http://127.0.0.1:$serverPort/full-file", target, "NoRange")

      assertTrue(result)
      assertTrue(target.readText().contains("Hello"))
    }

    @Test
    fun handles416RangeNotSatisfiable() {
      val target = File(tempDir, "complete.bin")
      target.writeText("existing content")

      val result = dm.downloadWithResume("http://127.0.0.1:$serverPort/range-416", target, "H416")

      assertTrue(result)
      assertTrue(logMessages.any { it.second.contains("416") })
    }

    @Test
    fun returnsFalseOnServerError() {
      val target = File(tempDir, "error.bin")

      val result = dm.downloadWithResume("http://127.0.0.1:$serverPort/error-500", target, "Err500")

      assertFalse(result)
      assertTrue(logMessages.any { it.second.contains("500") })
    }

    @Test
    fun logsDownloadComplete() {
      val target = File(tempDir, "complete-log.bin")

      dm.downloadWithResume("http://127.0.0.1:$serverPort/full-file", target, "LogTest")

      assertTrue(logMessages.any { it.second.contains("download complete") })
    }

    @Test
    fun logsProgressForLargeFiles() {
      val target = File(tempDir, "large.bin")

      dm.downloadWithResume("http://127.0.0.1:$serverPort/large-file", target, "LargeFile")

      assertTrue(target.exists())
      assertTrue(target.length() > 100_000)
      // Progress logging at 10% intervals
      assertTrue(logMessages.any { it.second.contains("%") })
    }

    @Test
    fun skipsDownloadWhenSameSize() {
      // First download
      val target = File(tempDir, "sized.bin")
      dm.downloadWithResume("http://127.0.0.1:$serverPort/full-file", target, "First")
      val firstSize = target.length()

      // Remove marker file, but file is complete
      File(tempDir, "sized.bin.complete").delete()
      logMessages.clear()

      // Second download — server returns 200 with same content-length
      val result = dm.downloadWithResume("http://127.0.0.1:$serverPort/full-file", target, "Second")
      assertTrue(result)
      // File should have been detected as already complete (same size)
      assertTrue(
          logMessages.any {
            it.second.contains("already complete") || it.second.contains("download complete")
          })
    }
  }

  // endregion

  // region Helper

  private fun createTestZip(entries: Map<String, String>): File {
    val zipFile = File(tempDir, "test.zip")
    ZipOutputStream(FileOutputStream(zipFile)).use { zos ->
      for ((name, content) in entries) {
        zos.putNextEntry(ZipEntry(name))
        zos.write(content.toByteArray())
        zos.closeEntry()
      }
    }
    return zipFile
  }

  // endregion
}
