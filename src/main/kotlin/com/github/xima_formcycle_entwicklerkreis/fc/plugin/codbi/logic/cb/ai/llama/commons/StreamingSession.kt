package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

/**
 * Immutable UI label strings for a streaming session. Set once based on the detected language and
 * never modified afterwards.
 */
internal data class SessionLabels(
    val reasoningLabel: String = "Reasoning\u2026",
    val showReasoningLabel: String = "Show reasoning",
    val showSourcesLabel: String = "Show sources",
    val searchingLabel: String = "Searching the internet for \u201C%s\u201D\u2026",
    val searchingLabelNoQuery: String = "Searching the internet\u2026",
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
  private val lock = Any()

  /** Accumulated generated text so far. */
  private val textChunks = ArrayList<String>()
  /** Accumulated thinking/reasoning text (from <think> blocks). */
  private val thinkingChunks = ArrayList<String>()

  /** Whether generation is complete. Guarded by [lock] for atomic snapshots with text. */
  var done: Boolean = false
    get() = synchronized(lock) { field }
    set(value) = synchronized(lock) { field = value }

  @Volatile var error: String? = null
  @Volatile var stopRequested = false
  @Volatile var resourceStatus: String? = null
  @Volatile var searching = false
  @Volatile var searchQuery: String? = null
  @Volatile var modelType: String = if (enableThinking) "thinking" else "fast"

  /** Localized UI labels. Set once after language detection; defaults to English. */
  @Volatile var labels: SessionLabels = SessionLabels()

  // region Confidence-Tracking
  /** Per-token logprob entries: Pair(token, logprob). Only visible (non-thinking) tokens. */
  private val tokenLogprobs = ArrayList<Pair<String, Double>>()
  @Volatile var logprobsAvailable = false
  @Volatile var logprobRepetitionDetected = false

  // endregion Confidence-Tracking

  // region Synchronized list accessors

  fun addText(chunk: String): Unit =
      synchronized(lock) {
        textChunks.add(chunk)
        Unit
      }

  fun clearText(): Unit = synchronized(lock) { textChunks.clear() }

  fun replaceText(text: String): Unit =
      synchronized(lock) {
        textChunks.clear()
        textChunks.add(text)
        Unit
      }

  fun textSize(): Int = synchronized(lock) { textChunks.size }

  fun addThinking(chunk: String): Unit =
      synchronized(lock) {
        thinkingChunks.add(chunk)
        Unit
      }

  fun clearThinking(): Unit = synchronized(lock) { thinkingChunks.clear() }

  fun thinkingIsEmpty(): Boolean = synchronized(lock) { thinkingChunks.isEmpty() }

  fun thinkingContains(text: String): Boolean =
      synchronized(lock) { thinkingChunks.any { it.contains(text) } }

  fun replaceThinkingMarker(marker: String, replacement: String): Unit =
      synchronized(lock) {
        val idx = thinkingChunks.indexOfFirst { it.contains(marker) }
        if (idx >= 0) thinkingChunks[idx] = thinkingChunks[idx].replace(marker, replacement)
      }

  fun addLogprob(token: String, logprob: Double): Unit =
      synchronized(lock) {
        tokenLogprobs.add(Pair(token, logprob))
        Unit
      }

  fun clearLogprobs(): Unit = synchronized(lock) { tokenLogprobs.clear() }

  fun logprobsSize(): Int = synchronized(lock) { tokenLogprobs.size }

  fun logprobsTail(n: Int): List<Pair<String, Double>> =
      synchronized(lock) { tokenLogprobs.takeLast(n).toList() }

  fun snapshotLogprobs(): List<Pair<String, Double>> =
      synchronized(lock) { ArrayList(tokenLogprobs) }

  fun clearAll(): Unit =
      synchronized(lock) {
        textChunks.clear()
        thinkingChunks.clear()
        tokenLogprobs.clear()
      }

  /** Mean logprob across all visible tokens, or null if none collected. */
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
   */
  fun snapshot(): Pair<Boolean, String> =
      synchronized(lock) { Pair(done, textChunks.joinToString("")) }
}
