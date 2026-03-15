package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.io.RandomAccessFile
import java.net.HttpURLConnection
import java.net.URI
import java.util.zip.ZipInputStream

/**
 * Handles resumable HTTP file downloads and archive extraction.
 *
 * Supports:
 * - HTTP Range-based resume for partially downloaded files.
 * - Marker files (`.complete`) for skipping already-finished downloads.
 * - ZIP archive extraction with Zip-Slip protection.
 * - tar.gz extraction via external `tar` command with directory-traversal safety check.
 * - Recursive executable search within extracted archive directories.
 *
 * @param log Log function for progress and diagnostic output.
 */
class DownloadManager(private val log: (LogLevel, String) -> Unit) {
  /* Companion for static members. */
  companion object {
    /** Buffer size for resumable downloads (64 KB). */
    private const val DOWNLOAD_BUFFER_SIZE = 65_536
    /** User-Agent for download requests. */
    private const val USER_AGENT = "CodBi-LLAMA/1.0"
  }

  /**
   * Downloads a file from [url] to [targetFile] with **HTTP Range resume** support.
   *
   * If the target file already exists partially (e.g., from a previous interrupted download), it
   * sends a `Range: bytes=<existing>-` header so the server continues from where it left off. If
   * the server does not support Range requests (no 206 response), the file is re-downloaded from
   * the beginning.
   *
   * @param url The URL to download.
   * @param targetFile The destination file.
   * @param label A human-readable label for log messages (e.g., "GGUF model").
   * @return `true` if the download succeeded (or the file already existed at full size).
   *
   * The method also creates a marker file (`<targetFile>.complete`) upon successful completion,
   * which is used to quickly check.
   */
  fun downloadWithResume(url: String, targetFile: File, label: String): Boolean {
    val markerFile = File(targetFile.parent, "${targetFile.name}.complete")

    if (targetFile.exists() && markerFile.exists()) {
      val sizeMB = "%.1f".format(targetFile.length() / (1024.0 * 1024.0))

      log(LogLevel.INFO, "$label already downloaded ($sizeMB MB): ${targetFile.name}")

      return true
    }

    targetFile.parentFile?.mkdirs()

    val existingBytes = if (targetFile.exists()) targetFile.length() else 0L

    log(
        LogLevel.INFO,
        "$label: starting download from $url" +
            (if (existingBytes > 0)
                " (resuming from ${"%.1f".format(existingBytes / (1024.0 * 1024.0))} MB)"
            else ""))

    try {
      val connection = URI(url).toURL().openConnection() as HttpURLConnection

      connection.connectTimeout = 30_000
      connection.readTimeout = 600_000
      connection.setRequestProperty("User-Agent", USER_AGENT)
      connection.instanceFollowRedirects = true

      if (existingBytes > 0) {
        connection.setRequestProperty("Range", "bytes=$existingBytes-")
      }

      connection.connect()

      val responseCode = connection.responseCode

      when (responseCode) {
        HttpURLConnection.HTTP_PARTIAL -> {
          log(
              LogLevel.INFO,
              "$label: server supports resume (206), continuing from byte $existingBytes")
          appendStreamToFile(
              connection.inputStream,
              targetFile,
              label,
              existingBytes,
              existingBytes + connection.contentLengthLong)
        }

        HttpURLConnection.HTTP_OK -> {
          val totalSize = connection.contentLengthLong

          if (existingBytes > 0 && existingBytes == totalSize) {
            log(
                LogLevel.INFO,
                "$label: file already complete (${"%.1f".format(totalSize / (1024.0 * 1024.0))} MB)")
          } else {
            if (existingBytes > 0) {
              log(
                  LogLevel.INFO,
                  "$label: server does not support resume, re-downloading from scratch")
            }

            writeStreamToFile(connection.inputStream, targetFile, label, totalSize)
          }
        }

        HttpURLConnection.HTTP_MOVED_TEMP,
        HttpURLConnection.HTTP_MOVED_PERM,
        HttpURLConnection.HTTP_SEE_OTHER,
        307,
        308 -> {
          val redirectUrl = connection.getHeaderField("Location")

          connection.disconnect()

          if (redirectUrl != null) {
            log(LogLevel.INFO, "$label: following redirect → $redirectUrl")
            return downloadWithResume(redirectUrl, targetFile, label)
          } else {
            log(LogLevel.ERROR, "$label: redirect with no Location header (HTTP $responseCode)")

            return false
          }
        }

        HttpURLConnection.HTTP_ENTITY_TOO_LARGE,
        416 -> {
          // 416 Range Not Satisfiable — file is probably already complete
          log(LogLevel.INFO, "$label: HTTP 416 — existing file is likely complete")
        }
        else -> {
          log(LogLevel.ERROR, "$label: download failed — HTTP $responseCode")
          connection.disconnect()

          return false
        }
      }

      connection.disconnect()
      markerFile.writeText("${targetFile.length()}")

      val sizeMB = "%.1f".format(targetFile.length() / (1024.0 * 1024.0))

      log(LogLevel.INFO, "$label: download complete ($sizeMB MB)")

      return true
    } catch (X: Exception) {
      val partialMB = "%.1f".format(targetFile.length() / (1024.0 * 1024.0))

      log(
          LogLevel.ERROR,
          "$label: download failed at $partialMB MB — ${X.message}. " +
              "The download will resume on next startup.")
      return false
    }
  }

  /**
   * Writes an input stream to a file from scratch, logging progress.
   *
   * @param input The source stream to read from.
   * @param target The destination file (overwritten if it exists).
   * @param label A human-readable label for log messages.
   * @param totalSize Expected total size in bytes (for progress logging). Use `0` if unknown.
   */
  private fun writeStreamToFile(input: InputStream, target: File, label: String, totalSize: Long) {
    FileOutputStream(target, false).use { output ->
      val buffer = ByteArray(DOWNLOAD_BUFFER_SIZE)
      var bytesWritten = 0L
      var lastLogPercent = -1
      var read: Int

      while (input.read(buffer).also { read = it } != -1) {
        output.write(buffer, 0, read)
        bytesWritten += read

        if (totalSize > 0) {
          val pct = (bytesWritten * 100 / totalSize).toInt()

          if (pct != lastLogPercent && pct % 10 == 0) {
            log(
                LogLevel.INFO,
                "$label: $pct% (${"%.0f".format(bytesWritten / (1024.0 * 1024.0))} / " +
                    "${"%.0f".format(totalSize / (1024.0 * 1024.0))} MB)")
            lastLogPercent = pct
          }
        }
      }
    }
  }

  /**
   * Appends an input stream to an existing file (for resume), logging progress.
   *
   * @param input The source stream to read from.
   * @param target The destination file to append to.
   * @param label A human-readable label for log messages.
   * @param startOffset Byte offset where appending starts (i.e. the existing file size).
   * @param totalSize Expected total size in bytes (for progress logging).
   */
  private fun appendStreamToFile(
      input: InputStream,
      target: File,
      label: String,
      startOffset: Long,
      totalSize: Long
  ) {
    RandomAccessFile(target, "rw").use { raf ->
      raf.seek(startOffset)

      val buffer = ByteArray(DOWNLOAD_BUFFER_SIZE)
      var bytesWritten = startOffset
      var lastLogPercent = -1
      var read: Int

      while (input.read(buffer).also { read = it } != -1) {
        raf.write(buffer, 0, read)
        bytesWritten += read

        if (totalSize > 0) {
          val pct = (bytesWritten * 100 / totalSize).toInt()

          if (pct != lastLogPercent && pct % 10 == 0) {
            log(
                LogLevel.INFO,
                "$label: $pct% (resumed, ${"%.0f".format(bytesWritten / (1024.0 * 1024.0))} / " +
                    "${"%.0f".format(totalSize / (1024.0 * 1024.0))} MB)")
            lastLogPercent = pct
          }
        }
      }
    }
  }

  /**
   * Extracts a ZIP archive to a target directory with Zip-Slip protection.
   *
   * @param zipFile The ZIP archive to extract.
   * @param targetDir The directory to extract into (created if it does not exist).
   * @throws SecurityException if any entry escapes the target directory.
   */
  fun extractZip(zipFile: File, targetDir: File) {
    log(LogLevel.INFO, "Extracting ${zipFile.name} → ${targetDir.absolutePath}")

    targetDir.mkdirs()
    val canonicalTarget = targetDir.canonicalPath
    ZipInputStream(zipFile.inputStream()).use { zis ->
      var entry = zis.nextEntry

      while (entry != null) {
        val outFile = File(targetDir, entry.name)

        if (!outFile.canonicalPath.startsWith(canonicalTarget + File.separator) &&
            outFile.canonicalPath != canonicalTarget) {
          throw SecurityException("Zip Slip: entry '${entry.name}' escapes target directory")
        }

        if (entry.isDirectory) {
          outFile.mkdirs()
        } else {
          outFile.parentFile?.mkdirs()
          FileOutputStream(outFile).use { out -> zis.copyTo(out) }
        }

        zis.closeEntry()

        entry = zis.nextEntry
      }
    }

    log(LogLevel.INFO, "Extraction complete")
  }

  /**
   * Extracts a .tar.gz archive to a target directory via external `tar` command.
   *
   * Pre-scans the archive entries to reject any containing directory-traversal (`..`).
   *
   * @param tarGzFile The tar.gz archive to extract.
   * @param targetDir The directory to extract into (created if it does not exist).
   * @throws SecurityException if any entry contains directory traversal.
   */
  fun extractTarGz(tarGzFile: File, targetDir: File) {
    log(LogLevel.INFO, "Extracting ${tarGzFile.name} → ${targetDir.absolutePath}")

    targetDir.mkdirs()

    // Pre-scan: reject archives containing directory-traversal entries
    val listPb = ProcessBuilder("tar", "tzf", tarGzFile.absolutePath)
    listPb.redirectErrorStream(true)
    val listProcess = listPb.start()
    val entries = listProcess.inputStream.bufferedReader().readText()
    listProcess.waitFor()
    val traversalEntry = entries.lineSequence().firstOrNull { it.contains("..") }
    if (traversalEntry != null) {
      throw SecurityException("Zip Slip: tar entry '$traversalEntry' contains directory traversal")
    }

    val pb = ProcessBuilder("tar", "xzf", tarGzFile.absolutePath, "-C", targetDir.absolutePath)

    pb.redirectErrorStream(true)

    val process = pb.start()
    val output = process.inputStream.bufferedReader().readText()
    val exitCode = process.waitFor()

    if (exitCode != 0) {
      log(LogLevel.WARNING, "tar extraction exit code $exitCode: $output")
    }

    log(LogLevel.INFO, "Extraction complete")
  }

  /**
   * Finds an executable file recursively within a directory, matching [exeName].
   *
   * @param dir The root directory to search.
   * @param exeName The executable file name to find (e.g. `"llama-server.exe"`).
   * @return The executable [File], or `null` if not found.
   */
  fun findExecutable(dir: File, exeName: String): File? {
    return dir.walkTopDown().find { it.name == exeName && it.isFile }
  }
}
