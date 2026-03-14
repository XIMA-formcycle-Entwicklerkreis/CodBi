package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.google.gson.JsonParser
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.Socket
import java.net.URI
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Properties
import java.util.concurrent.ExecutorService
import java.util.concurrent.atomic.AtomicReference

/**
 * Periodically checks GitHub for a newer llama.cpp release and sends email notifications via SMTP
 * when an update is available.
 *
 * @param llamaRelease The currently configured llama.cpp release tag (e.g. "b8175").
 * @param platformKey The current platform identifier (e.g. "windows_x86_64").
 * @param notifyEmail Optional email address for notifications.
 * @param pluginFolder Plugin root folder — used to locate system-mail.properties.
 * @param llamaEngineDir Engine directory where the last-notified marker file is persisted.
 * @param propPrefix Plugin property prefix (e.g. "AI_LLAMA_STD").
 * @param githubReleasesApi URL for the GitHub releases API endpoint.
 * @param buildServerUrls Function that builds platform-specific download URLs for a release tag.
 * @param log Logger callback for diagnostic messages.
 */
internal class NotificationService(
    private val llamaRelease: String,
    private val platformKey: String,
    private val notifyEmail: String?,
    private val pluginFolder: File?,
    private val llamaEngineDir: File?,
    private val propPrefix: String,
    private val githubReleasesApi: String,
    private val buildServerUrls: (String) -> Map<String, String>,
    private val log: (LogLevel, String) -> Unit,
    private val executor: ExecutorService
) {

  /** Last release tag for which a notification was already sent. */
  private val lastNotifiedRelease = AtomicReference<String?>(null)

  /** Consecutive GitHub API failure count for exponential backoff. */
  private var consecutiveFailures = 0

  /** Background task that periodically checks for new releases. */
  private var updateChecker: java.util.concurrent.Future<*>? = null

  /**
   * Launches a daemon thread that periodically queries the GitHub API for the latest llama.cpp
   * release. When a newer version is available (and downloadable for the current platform), an
   * email notification is sent via the Formcycle system mail configuration.
   *
   * @param checkIntervalHours Hours between checks. 0 = disabled.
   */
  fun start(checkIntervalHours: Long) {
    if (checkIntervalHours <= 0L) {
      log(LogLevel.INFO, "Update check disabled (interval = 0)")

      return
    }

    val markerFile = llamaEngineDir?.let { File(it, "last-notified-release.txt") }

    if (markerFile != null && markerFile.exists()) {
      lastNotifiedRelease.set(markerFile.readText().trim().takeIf { it.isNotEmpty() })
    }

    updateChecker =
        executor.submit {
          try {
            Thread.sleep(2 * 60 * 1000L)
          } catch (X: InterruptedException) {
            return@submit
          }

          while (!Thread.currentThread().isInterrupted) {
            try {
              checkForNewRelease()
            } catch (X: Exception) {
              log(LogLevel.WARNING, "Update check failed: ${X.message}")
            }

            val backoffMs = computeBackoffMs(checkIntervalHours)

            try {
              Thread.sleep(backoffMs)
            } catch (X: InterruptedException) {
              break
            }
          }
        }

    log(LogLevel.INFO, "Update checker started (interval: ${checkIntervalHours}h)")
  }

  /** Stops the update checker background task. */
  fun shutdown() {
    updateChecker?.cancel(true)
    updateChecker = null
  }

  /**
   * Computes the sleep interval with exponential backoff on consecutive failures. Normal interval
   * is [checkIntervalHours]. Each failure doubles the wait, capped at 24 hours.
   */
  private fun computeBackoffMs(checkIntervalHours: Long): Long {
    val baseMs = checkIntervalHours * 3600 * 1000L

    if (consecutiveFailures == 0) return baseMs

    val backoffMs = baseMs * (1L shl consecutiveFailures.coerceAtMost(6))
    val maxMs = 24 * 3600 * 1000L

    return backoffMs.coerceAtMost(maxMs)
  }

  /**
   * Queries the GitHub API for the latest llama.cpp release, compares it with the configured
   * release, and sends an email notification if a newer version is available.
   */
  @Synchronized
  private fun checkForNewRelease() {
    val latestTag = fetchLatestReleaseTag()

    if (latestTag == null) {
      consecutiveFailures++
      log(
          LogLevel.WARNING,
          "Could not determine latest llama.cpp release (failure #$consecutiveFailures)")

      return
    }

    consecutiveFailures = 0

    if (latestTag == llamaRelease) {
      log(LogLevel.INFO, "llama.cpp is up to date ($llamaRelease)")

      return
    }

    if (latestTag == lastNotifiedRelease.get()) {
      log(LogLevel.INFO, "Already notified about llama.cpp $latestTag (current: $llamaRelease)")

      return
    }

    if (!isReleaseAvailableForPlatform(latestTag)) {
      log(
          LogLevel.INFO,
          "llama.cpp $latestTag has no binary for $platformKey yet — skipping notification")

      return
    }

    log(
        LogLevel.INFO,
        "New llama.cpp release available: $latestTag (current: $llamaRelease) — sending notification")

    if (sendUpdateNotification(latestTag)) {
      lastNotifiedRelease.set(latestTag)

      llamaEngineDir?.let { File(it, "last-notified-release.txt").writeText(latestTag) }
    }
  }

  /**
   * Fetches the latest release tag from the GitHub API.
   *
   * @return The tag name (e.g. `"b8200"`), or `null` on error.
   */
  private fun fetchLatestReleaseTag(): String? {
    try {
      val connection = URI(githubReleasesApi).toURL().openConnection() as HttpURLConnection

      connection.requestMethod = "GET"
      connection.connectTimeout = 15_000
      connection.readTimeout = 15_000
      connection.setRequestProperty("Accept", "application/vnd.github.v3+json")
      connection.setRequestProperty("User-Agent", "CodBi-LLAMA/1.0")

      val responseCode = connection.responseCode

      if (responseCode != 200) {
        log(LogLevel.WARNING, "GitHub API returned HTTP $responseCode")
        connection.disconnect()

        return null
      }

      val body = connection.inputStream.bufferedReader().readText()

      connection.disconnect()

      val json = JsonParser.parseString(body).asJsonObject

      return json.get("tag_name")?.asString
    } catch (X: Exception) {
      log(LogLevel.WARNING, "GitHub API request failed: ${X.message}")

      return null
    }
  }

  /**
   * Checks whether a given release has a downloadable archive for the current platform by sending
   * an HTTPS HEAD request to the expected download URL.
   *
   * @param release The release tag (e.g. `"b8200"`).
   * @return `true` if the expected archive URL returns HTTP 200.
   */
  private fun isReleaseAvailableForPlatform(release: String): Boolean {
    val urls = buildServerUrls(release)
    val url = (urls[platformKey] ?: return false).replace("http://", "https://")

    return try {
      val connection = URI(url).toURL().openConnection() as HttpURLConnection

      connection.requestMethod = "HEAD"
      connection.connectTimeout = 15_000
      connection.instanceFollowRedirects = true

      val code = connection.responseCode

      connection.disconnect()
      code in 200..399
    } catch (X: Exception) {
      false
    }
  }

  /**
   * Sends an update notification email using the SMTP configuration from Formcycle's
   * `system-mail.properties`.
   *
   * @param newRelease The new release tag that is available.
   * @return `true` if the email was sent successfully.
   */
  private fun sendUpdateNotification(newRelease: String): Boolean {
    val mailPropsFile = findSystemMailProperties()

    if (mailPropsFile == null) {
      log(
          LogLevel.WARNING,
          "Cannot send update notification — system-mail.properties not found. " +
              "Expected 3 directories above the plugin folder.")

      return false
    }

    val mailProps = Properties()

    mailPropsFile.inputStream().use { mailProps.load(it) }

    val smtpHost = mailProps.getProperty("mail.smtp.host")?.trim()

    if (smtpHost.isNullOrEmpty()) {
      log(
          LogLevel.WARNING,
          "Cannot send update notification — mail.smtp.host is not configured " +
              "in ${mailPropsFile.absolutePath}")

      return false
    }

    val smtpPort = mailProps.getProperty("mail.smtp.port")?.trim()?.toIntOrNull() ?: 25
    val fromAddr =
        mailProps.getProperty("mail.smtp.from")?.trim()?.takeIf { it.isNotEmpty() }
            ?: "codbi-noreply@localhost"
    val recipient =
        notifyEmail ?: mailProps.getProperty("mail.smtp.from")?.trim()?.takeIf { it.isNotEmpty() }

    if (recipient.isNullOrEmpty()) {
      log(
          LogLevel.WARNING,
          "Cannot send update notification — no recipient email. " +
              "Set ${propPrefix}_NotifyEmail or configure mail.smtp.from in Formcycle.")

      return false
    }

    val authUser = mailProps.getProperty("mail.smtp.auth.user")?.trim()?.takeIf { it.isNotEmpty() }
    val authPass =
        mailProps.getProperty("mail.smtp.auth.password")?.trim()?.takeIf { it.isNotEmpty() }
    val subject = "[CodBi] New llama.cpp release available: $newRelease (current: $llamaRelease)"
    val body = buildString {
      appendLine("A new version of llama.cpp is available.")
      appendLine()
      appendLine("  Current release : $llamaRelease")
      appendLine("  Latest release  : $newRelease")
      appendLine("  Platform        : $platformKey")
      appendLine()
      appendLine("Release page:")
      appendLine("  https://github.com/ggml-org/llama.cpp/releases/tag/$newRelease")
      appendLine()
      appendLine("To upgrade, set the plugin property:")
      appendLine("  ${propPrefix}_LlamaRelease = $newRelease")
      appendLine()
      appendLine("The server will automatically download the new binaries on next restart.")
      appendLine()
      appendLine("-- CodBi AI / LLAMA update checker")
    }

    return sendSmtpEmail(smtpHost, smtpPort, fromAddr, recipient, authUser, authPass, subject, body)
  }

  /**
   * Locates Formcycle's `system-mail.properties` by navigating upward from the plugin folder.
   *
   * Plugin folder layout: `xfc-server/config/plugins/system/<uuid>/` Target file:
   * `xfc-server/config/system-mail.properties` → 3 directories up from the plugin folder.
   *
   * @return The properties [File], or `null` if not found.
   */
  private fun findSystemMailProperties(): File? {
    if (pluginFolder == null) {
      log(
          LogLevel.WARNING,
          "Cannot locate system-mail.properties — pluginFolder is null. " +
              "Email notifications will be skipped.")
      return null
    }

    var dir: File = pluginFolder

    dir = dir.parentFile ?: return null
    dir = dir.parentFile ?: return null
    dir = dir.parentFile ?: return null

    val candidate = File(dir, "system-mail.properties")

    return if (candidate.exists()) candidate else null
  }

  /**
   * Sends a plain-text email via raw SMTP (no external mail library required).
   *
   * Supports optional AUTH LOGIN. Does **not** support STARTTLS — suitable for localhost or
   * trusted-network relay servers as typically configured in Formcycle.
   *
   * @param host SMTP server hostname.
   * @param port SMTP server port.
   * @param from Sender email address.
   * @param to Recipient email address.
   * @param subject Email subject line.
   * @param body Plain-text email body.
   * @param user Optional AUTH LOGIN username.
   * @param password Optional AUTH LOGIN password.
   * @return `true` if the server accepted the message (250 response after DATA).
   */
  private fun sendSmtpEmail(
      host: String,
      port: Int,
      from: String,
      to: String,
      user: String?,
      password: String?,
      subject: String,
      body: String
  ): Boolean {
    try {
      Socket(host, port).use { socket ->
        socket.soTimeout = 30_000

        val reader = BufferedReader(InputStreamReader(socket.getInputStream(), Charsets.UTF_8))
        val writer = OutputStreamWriter(socket.getOutputStream(), Charsets.UTF_8)

        fun readResponse(): String {
          var line: String

          do {
            line = reader.readLine() ?: throw Exception("SMTP connection closed unexpectedly")
          } while (line.length >= 4 && line[3] == '-') // multi-line continues with "250-..."

          return line
        }
        /** Sends a command and reads the response. */
        fun send(cmd: String): String {
          writer.write(cmd + "\r\n")
          writer.flush()

          return readResponse()
        }

        readResponse()
        send("EHLO codbi-llama")

        if (!user.isNullOrEmpty() && !password.isNullOrEmpty()) {
          send("AUTH LOGIN")
          send(java.util.Base64.getEncoder().encodeToString(user.toByteArray()))

          val authResp = send(java.util.Base64.getEncoder().encodeToString(password.toByteArray()))

          if (!authResp.startsWith("235")) {
            log(LogLevel.WARNING, "SMTP AUTH failed: $authResp")
            return false
          }
        }

        send("MAIL FROM:<$from>")
        send("RCPT TO:<$to>")
        send("DATA")

        val now = ZonedDateTime.now().format(DateTimeFormatter.RFC_1123_DATE_TIME)

        writer.write("Date: $now\r\n")
        writer.write("From: CodBi AI <$from>\r\n")
        writer.write("To: $to\r\n")
        writer.write("Subject: $subject\r\n")
        writer.write("Content-Type: text/plain; charset=UTF-8\r\n")
        writer.write("X-Mailer: CodBi-LLAMA/1.0\r\n")
        writer.write("\r\n")

        for (line in body.lines()) {
          if (line.startsWith(".")) writer.write(".")

          writer.write(line + "\r\n")
        }

        writer.write(".\r\n")
        writer.flush()

        val dataResp = readResponse()

        send("QUIT")

        if (dataResp.startsWith("250")) {
          log(LogLevel.INFO, "Update notification email sent to $to")

          return true
        } else {
          log(LogLevel.WARNING, "SMTP server rejected message: $dataResp")

          return false
        }
      }
    } catch (e: Exception) {
      log(LogLevel.ERROR, "Failed to send notification email: ${e.message}")

      return false
    }
  }
}
