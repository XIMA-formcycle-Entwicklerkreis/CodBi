package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

/**
 * Immutable UI label strings for a streaming session. Set once based on the detected language and
 * never modified afterwards.
 *
 * @param reasoningLabel Label shown while reasoning is in progress.
 * @param showReasoningLabel Toggle label for expanding the reasoning section.
 * @param showSourcesLabel Toggle label for expanding the sources section.
 * @param searchingLabel Label shown during web search, with `%s` placeholder for the query.
 * @param searchingLabelNoQuery Label shown during web search when the query is not yet known.
 * @param thinkingLabel Label shown while the model is thinking.
 * @param copyResponseLabel Label for the "copy response" action.
 * @param copyReasoningLabel Label for the "copy reasoning" action.
 */
internal data class SessionLabels(
    val reasoningLabel: String = "Reasoning\u2026",
    val showReasoningLabel: String = "Show reasoning",
    val showSourcesLabel: String = "Show sources",
    val searchingLabel: String = "Searching the internet for \u201C%s\u201D\u2026",
    val searchingLabelNoQuery: String = "Searching the internet\u2026",
    val readingLabel: String = "Reading page: \u201C%s\u201D\u2026",
    val readingLabelNoUrl: String = "Reading page content\u2026",
    val sendingMailLabel: String = "Sending email to \u201C%s\u201D\u2026",
    val sendingMailLabelNoRecipient: String = "Sending email\u2026",
    val thinkingLabel: String = "Thinking\u2026",
    val copyResponseLabel: String = "Response",
    val copyReasoningLabel: String = "Reasoning"
)

/**
 * Holds the state of an in-flight streaming request. The background thread appends generated text
 * chunks.
 *
 * **Thread-safety contract:** All mutable text/logprob state and the [done] flag are guarded by
 * [lock]. Callers that need an atomic snapshot of (done + text) must use [snapshot]. Scalar status
 * flags ([error], [stopRequested], etc.) are `@Volatile` for simple visibility.
 */
internal class StreamingSession(
    /** Start time of the session in milliseconds since epoch. */
    val startTime: Long = System.currentTimeMillis(),
    /** Whether this session uses thinking mode (longer TTL). */
    val enableThinking: Boolean = false
) {
  /** Updated on every poll so the session stays alive while the client is connected. */
  @Volatile var lastActivityTime: Long = startTime
  /** Lock object for synchronizing access to mutable state. */
  private val lock = Any()

  /** Accumulated generated text so far. */
  private val textChunks = ArrayList<String>()
  /** Accumulated thinking/reasoning text (from <think> blocks). */
  private val thinkingChunks = ArrayList<String>()

  /** Whether generation is complete. Guarded by [lock] for atomic snapshots with text. */
  var done: Boolean = false
    get() = synchronized(lock) { field }
    set(value) = synchronized(lock) { field = value }

  /** Error message, or `null` if no error has occurred. */
  @Volatile var error: String? = null
  /** Whether the client has requested early termination of this session. */
  @Volatile var stopRequested = false
  /** Human-readable resource-exhaustion status, or `null` when resources are available. */
  @Volatile var resourceStatus: String? = null
  /** `true` while a web search is in flight. */
  @Volatile var searching = false
  /** The current web search query, or `null` if no search is active. */
  @Volatile var searchQuery: String? = null
  /** `true` while a URL fetch is in flight. */
  @Volatile var fetching = false
  /** The URL currently being fetched, or `null` if no fetch is active. */
  @Volatile var fetchUrl: String? = null
  /** `true` while an email is being sent. */
  @Volatile var sendingMail = false
  /** The recipient of the email being sent, or `null` if none. */
  @Volatile var mailRecipient: String? = null
  /** The model type label for this session (`"thinking"` or `"fast"`). */
  @Volatile var modelType: String = if (enableThinking) "thinking" else "fast"
  /** Localized UI labels. Set once after language detection; defaults to English. */
  @Volatile var labels: SessionLabels = SessionLabels()
  /** Queue position while waiting for the inference semaphore. 0 = not queued / running. */
  @Volatile var queuePosition: Int = 0
  /** The ticket UUID assigned to this session in [AI.queueTickets], or `null` if external. */
  @Volatile var queueTicket: String? = null
  // region Auto-Mail Forward
  /** Email address for auto-forwarding the response, or `null` if disabled. */
  @Volatile var autoMailTo: String? = null
  /** Status of the auto-mail forward: `true` = sent, `false` = failed, `null` = not attempted. */
  @Volatile var autoMailSent: Boolean? = null
  /** Error message if auto-mail forward failed. */
  @Volatile var autoMailError: String? = null
  // endregion Auto-Mail Forward
  // region Confidence-Tracking
  /** Per-token logprob entries: Pair(token, logprob). Only visible (non-thinking) tokens. */
  private val tokenLogprobs = ArrayList<Pair<String, Double>>()
  /** `true` when the model supports log-probability output. */
  @Volatile var logprobsAvailable = false
  /** `true` when repeated low-confidence tokens have been detected. */
  @Volatile var logprobRepetitionDetected = false

  // endregion Confidence-Tracking
  // region Synchronized list accessors

  /**
   * Appends a visible text chunk to the output buffer.
   *
   * @param chunk The text fragment to append.
   */
  fun addText(chunk: String): Unit =
      synchronized(lock) {
        textChunks.add(chunk)
        Unit
      }

  /** Discards all accumulated visible text chunks. */
  fun clearText(): Unit = synchronized(lock) { textChunks.clear() }

  /**
   * Replaces all accumulated text with a single new value.
   *
   * @param text The replacement text.
   */
  fun replaceText(text: String): Unit =
      synchronized(lock) {
        textChunks.clear()
        textChunks.add(text)
        Unit
      }

  /** @return The number of visible text chunks accumulated so far. */
  fun textSize(): Int = synchronized(lock) { textChunks.size }

  /**
   * Appends a thinking/reasoning text chunk.
   *
   * @param chunk The thinking fragment to append.
   */
  fun addThinking(chunk: String): Unit =
      synchronized(lock) {
        thinkingChunks.add(chunk)
        Unit
      }

  /** Discards all accumulated thinking chunks. */
  fun clearThinking(): Unit = synchronized(lock) { thinkingChunks.clear() }

  /** @return `true` if no thinking chunks have been accumulated. */
  fun thinkingIsEmpty(): Boolean = synchronized(lock) { thinkingChunks.isEmpty() }

  /**
   * Checks whether any thinking chunk contains the given text.
   *
   * @param text The substring to search for.
   * @return `true` if any thinking chunk contains [text].
   */
  fun thinkingContains(text: String): Boolean =
      synchronized(lock) { thinkingChunks.any { it.contains(text) } }

  /**
   * Replaces the first occurrence of [marker] within the thinking chunks with [replacement].
   *
   * @param marker The substring to find.
   * @param replacement The string to substitute in its place.
   */
  fun replaceThinkingMarker(marker: String, replacement: String): Unit =
      synchronized(lock) {
        val idx = thinkingChunks.indexOfFirst { it.contains(marker) }
        if (idx >= 0) thinkingChunks[idx] = thinkingChunks[idx].replace(marker, replacement)
      }

  /**
   * Records a token log-probability entry for confidence tracking.
   *
   * @param token The generated token text.
   * @param logprob The log-probability of the token.
   */
  fun addLogprob(token: String, logprob: Double): Unit =
      synchronized(lock) {
        tokenLogprobs.add(Pair(token, logprob))
        Unit
      }

  /** Discards all recorded log-probability entries. */
  fun clearLogprobs(): Unit = synchronized(lock) { tokenLogprobs.clear() }

  /** @return The number of log-probability entries recorded so far. */
  fun logprobsSize(): Int = synchronized(lock) { tokenLogprobs.size }

  /**
   * Returns the last [n] log-probability entries as a defensive copy.
   *
   * @param n The number of trailing entries to return.
   * @return A list of the most recent (token, logprob) pairs.
   */
  fun logprobsTail(n: Int): List<Pair<String, Double>> =
      synchronized(lock) { tokenLogprobs.takeLast(n).toList() }

  /** @return A defensive copy of all recorded log-probability entries. */
  fun snapshotLogprobs(): List<Pair<String, Double>> =
      synchronized(lock) { ArrayList(tokenLogprobs) }

  /** Discards all text, thinking, and log-probability data. */
  fun clearAll(): Unit =
      synchronized(lock) {
        textChunks.clear()
        thinkingChunks.clear()
        tokenLogprobs.clear()
      }

  /**
   * Mean logprob across all visible tokens.
   *
   * @return The average log-probability, or `null` if no tokens have been collected.
   */
  fun meanLogprob(): Double? =
      synchronized(lock) {
        if (tokenLogprobs.isEmpty()) null
        else tokenLogprobs.sumOf { it.second } / tokenLogprobs.size
      }

  // endregion Synchronized list accessors

  /** @return All visible text chunks concatenated into a single string. */
  fun currentText(): String = synchronized(lock) { textChunks.joinToString("") }

  /** @return All thinking/reasoning chunks concatenated into a single string. */
  fun currentThinking(): String = synchronized(lock) { thinkingChunks.joinToString("") }

  /**
   * Returns an atomic snapshot of the done flag and current text, ensuring no race between an
   * in-progress write and the done flag.
   *
   * @return A pair of (done, concatenated text).
   */
  fun snapshot(): Pair<Boolean, String> =
      synchronized(lock) { Pair(done, textChunks.joinToString("")) }
}
