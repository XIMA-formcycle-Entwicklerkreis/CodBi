package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

/**
 * # MailBridge — AI-initiated email sending with rate limiting
 *
 * Allows the AI model to send emails via `CALL:mail(to='...', subject='...', body='...')` markers.
 * Uses FORMCYCLE's mail API at runtime: obtains the system mail context via
 * `MailContextProvider.getSystemContext()`, then sends through `SimpleTextMail`.
 *
 * ## Security & Rate Limiting
 * - Global cap: max [GLOBAL_MAX_MAILS_PER_HOUR] mails per hour across all sessions
 * - Per-session cap: max [SESSION_MAX_MAILS] mails per streaming session
 * - Recipient whitelist: only addresses matching [allowedRecipientPattern] are permitted
 * - Subject and body are sanitized (no header injection)
 *
 * ## Configuration
 * | Property                    | Format         | Example             |
 * |-----------------------------|----------------|---------------------|
 * | `AI_Mail_Enabled`           | `true`/`false` | `true`              |
 * | `AI_Mail_AllowedRecipients` | Regex pattern  | `.*@mycompany\.com` |
 * | `AI_Mail_MaxPerHour`        | Integer        | `10`                |
 * | `AI_Mail_Disclaimer`        | Free text      | `AI-Generated`      |
 */
object MailBridge : CodBi() {
  init {
    idLogMessages = "AI / MailBridge"
  }

  // region Configuration (set during plugin initialisation)

  /** Whether the mail bridge is enabled. Enable via `AI_Mail_Enabled=true`. */
  @Volatile var enabled: Boolean = false

  /** Regex pattern that recipient addresses must match. `null` = allow all. */
  @Volatile var allowedRecipientPattern: Regex? = null

  /** Maximum mails per hour (global across all sessions). */
  @Volatile var maxMailsPerHour: Int = 10

  /** Disclaimer text appended to every AI-sent email. Customise via `AI_Mail_Disclaimer`. */
  @Volatile var aiDisclaimer: String = "AI-Generated"

  // endregion Configuration

  // region Constants

  /** Per-session maximum to prevent a single conversation from spamming. */
  private const val SESSION_MAX_MAILS = 3

  /** Default global hourly cap. */
  private const val GLOBAL_MAX_MAILS_PER_HOUR = 10

  /**
   * Matches `CALL:mail(to='...', subject='...', body='...')` in model output (complete pattern).
   */
  val CALL_MAIL_PATTERN: Regex =
      Regex(
          """CALL:mail\(\s*to\s*=\s*['"](.+?)['"]\s*,\s*subject\s*=\s*['"](.+?)['"]\s*,\s*body\s*=\s*['"](.+?)['"]\s*\)""",
          RegexOption.DOT_MATCHES_ALL)

  /**
   * Fallback pattern for truncated CALL:mail where the body was cut off by token limit. Captures
   * to, subject, and whatever body text is available (even without closing quote/paren).
   */
  val CALL_MAIL_PATTERN_TRUNCATED: Regex =
      Regex(
          """CALL:mail\(\s*to\s*=\s*['"](.+?)['"]\s*,\s*subject\s*=\s*['"](.+?)['"]\s*,\s*body\s*=\s*['"](.*)""",
          RegexOption.DOT_MATCHES_ALL)

  /**
   * Cleans an email address captured from model output. Strips emojis, icons (e.g. ✉), whitespace,
   * and newlines.
   */
  fun cleanEmail(raw: String): String = raw.replace(Regex("[\\s\\p{So}\\p{Cn}]"), "").trim()

  // endregion Constants

  // region Rate Limiting State

  /** Tracks mails sent per session ID. */
  private val sessionMailCounts = ConcurrentHashMap<String, AtomicInteger>()

  /** Timestamps (epoch millis) of all mails sent in the current sliding window. */
  private val globalMailTimestamps = java.util.concurrent.ConcurrentLinkedQueue<Long>()

  // endregion Rate Limiting State

  /**
   * Whether the mail bridge is ready to send. If the system mail context is unavailable at runtime,
   * `sendMail` will return an error.
   */
  val isAvailable: Boolean
    get() = enabled

  /**
   * Attempts to send an email on behalf of the AI model.
   *
   * @param to Recipient email address.
   * @param subject Email subject.
   * @param body Email body (plain text).
   * @param sessionId The streaming session ID for per-session rate limiting.
   * @param clientIP The IP address of the requesting client (for audit logging).
   * @return A [MailResult] indicating success or failure with a reason.
   */
  fun sendMail(
      to: String,
      subject: String,
      body: String,
      sessionId: String,
      clientIP: String = "unknown"
  ): MailResult {
    if (!enabled) {
      return MailResult(success = false, error = "Mail sending is disabled.")
    }

    // Validate recipient against whitelist
    val pattern = allowedRecipientPattern
    if (pattern != null && !pattern.matches(to)) {
      log(LogLevel.WARNING, "Blocked mail to '$to' — does not match allowed recipient pattern")
      return MailResult(
          success = false, error = "Recipient '$to' is not in the allowed recipients list.")
    }

    // Basic email format validation
    if (!to.contains("@") || !to.contains(".")) {
      return MailResult(success = false, error = "Invalid email address: '$to'.")
    }

    // Per-session rate limit
    val sessionCount = sessionMailCounts.computeIfAbsent(sessionId) { AtomicInteger(0) }
    if (sessionCount.get() >= SESSION_MAX_MAILS) {
      log(
          LogLevel.WARNING,
          "Session $sessionId exceeded per-session mail limit ($SESSION_MAX_MAILS)")
      return MailResult(
          success = false,
          error = "Mail limit reached for this conversation (max $SESSION_MAX_MAILS per session).")
    }

    // Global hourly rate limit
    val now = System.currentTimeMillis()
    val oneHourAgo = now - 3_600_000L
    // Purge old timestamps
    while (true) {
      val oldest = globalMailTimestamps.peek() ?: break
      if (oldest < oneHourAgo) globalMailTimestamps.poll() else break
    }
    if (globalMailTimestamps.size >= maxMailsPerHour) {
      log(LogLevel.WARNING, "Global hourly mail limit reached ($maxMailsPerHour/hour)")
      return MailResult(
          success = false, error = "Global mail limit reached. Please try again later.")
    }

    // Sanitize subject (prevent header injection)
    val safeSubject = subject.replace(Regex("[\r\n]"), " ").take(200)
    val safeBody = body.take(50_000) + "\n\n\u2728 $aiDisclaimer"

    return try {
      sendViaFormcycleApi(to, safeSubject, safeBody)

      // Record successful send for rate limiting
      sessionCount.incrementAndGet()
      globalMailTimestamps.add(now)

      log(
          LogLevel.INFO,
          "MAIL_AUDIT | ${java.time.Instant.ofEpochMilli(now)} | ip=$clientIP | to=$to")
      MailResult(success = true, recipient = to, subject = safeSubject)
    } catch (e: Exception) {
      log(LogLevel.ERROR, "Failed to send mail to '$to': ${e.message}")
      MailResult(success = false, error = "Failed to send email: ${e.message}")
    }
  }

  /**
   * Sends an email via the FORMCYCLE mail API using reflection.
   * 1. Obtains the system `IMailContext` via `MailContextProvider.getSystemContext()`
   * 2. Reads sender address/name from the context's `IMailServerData`
   * 3. Creates `SimpleTextMail(subject, body, bodyMimeType, from, senderName, to)`
   * 4. Calls `context.send(mail)`
   *
   * All FC mail classes are in `fc-logic` (test-scoped at compile time) but available at runtime,
   * so reflection is required.
   */
  private fun sendViaFormcycleApi(to: String, subject: String, body: String) {
    // 1. Get system mail context via MailContextProvider (static, no DB query needed)
    val contextProviderClass = Class.forName("de.xima.fc.mail.MailContextProvider")
    val mailContext =
        contextProviderClass.getMethod("getSystemContext").invoke(null)
            ?: throw IllegalStateException("No system mail server configured in FORMCYCLE")

    // 2. Get sender info from the context's server data
    val serverData =
        mailContext.javaClass.getMethod("getServerData").invoke(mailContext)
            ?: throw IllegalStateException("Mail context has no server data")
    val senderAddr =
        serverData.javaClass.getMethod("getSenderAddress").invoke(serverData) as? String
            ?: throw IllegalStateException("No sender address configured in system mail server")
    val senderName =
        serverData.javaClass.getMethod("getSenderName").invoke(serverData) as? String ?: "CodBi AI"

    // 3. Create SimpleTextMail(subject, body, bodyMimeType, from, senderName, to)
    val simpleTextMailClass = Class.forName("de.xima.fc.mail.type.SimpleTextMail")
    val mail =
        simpleTextMailClass
            .getConstructor(
                String::class.java, // subject
                String::class.java, // body
                String::class.java, // bodyMimeType
                String::class.java, // from
                String::class.java, // senderName
                String::class.java // to
                )
            .newInstance(subject, body, "text/plain", senderAddr, senderName, to)

    // 4. Send via IMailContext.send(IBaseMailData)
    val mailContextInterface = Class.forName("de.xima.fc.mail.interfaces.IMailContext")
    val baseMailDataClass = Class.forName("de.xima.fc.interfaces.mail.IBaseMailData")
    mailContextInterface.getMethod("send", baseMailDataClass).invoke(mailContext, mail)
  }

  /** Formats a mail result into a text block suitable for injecting into the conversation. */
  fun formatResultForModel(result: MailResult): String {
    return if (result.success) {
      "MAIL SENT SUCCESSFULLY to ${result.recipient} with subject \"${result.subject}\".\n" +
          "INSTRUCTIONS: Briefly confirm to the user that the email was sent. " +
          "Mention the recipient and subject. Do not repeat the full email body."
    } else {
      "MAIL SENDING FAILED: ${result.error}\n" +
          "INSTRUCTIONS: Inform the user that the email could not be sent and explain the reason. " +
          "Do NOT retry automatically."
    }
  }

  /**
   * Cleans up rate-limiting state for a finished session.
   *
   * @param sessionId The session ID to remove.
   */
  fun clearSession(sessionId: String) {
    sessionMailCounts.remove(sessionId)
  }

  /**
   * Result of an email send attempt.
   *
   * @property success Whether the email was sent.
   * @property recipient The recipient address (on success).
   * @property subject The sanitized subject (on success).
   * @property error Error message (on failure).
   */
  data class MailResult(
      val success: Boolean,
      val recipient: String? = null,
      val subject: String? = null,
      val error: String? = null
  )
}
