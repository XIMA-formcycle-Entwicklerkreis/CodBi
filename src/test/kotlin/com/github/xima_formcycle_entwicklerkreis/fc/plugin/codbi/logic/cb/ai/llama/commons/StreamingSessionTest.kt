package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for [StreamingSession] — thread-safe text/thinking accumulation & state management. */
class StreamingSessionTest {

  private lateinit var session: StreamingSession

  @BeforeEach
  fun setUp() {
    session = StreamingSession(enableThinking = false)
  }

  // region Text Operations

  @Nested
  inner class TextOperations {

    @Test
    fun startsEmpty() {
      assertEquals("", session.currentText())
      assertEquals(0, session.textSize())
    }

    @Test
    fun addTextAccumulates() {
      session.addText("Hello")
      session.addText(" World")
      assertEquals("Hello World", session.currentText())
      assertEquals(2, session.textSize())
    }

    @Test
    fun clearText() {
      session.addText("content")
      session.clearText()
      assertEquals("", session.currentText())
      assertEquals(0, session.textSize())
    }

    @Test
    fun replaceText() {
      session.addText("old1")
      session.addText("old2")
      session.replaceText("new")
      assertEquals("new", session.currentText())
      assertEquals(1, session.textSize())
    }
  }

  // endregion

  // region Thinking Operations

  @Nested
  inner class ThinkingOperations {

    @Test
    fun startsEmpty() {
      assertEquals("", session.currentThinking())
      assertTrue(session.thinkingIsEmpty())
    }

    @Test
    fun addThinkingAccumulates() {
      session.addThinking("step 1")
      session.addThinking(" step 2")
      assertEquals("step 1 step 2", session.currentThinking())
      assertFalse(session.thinkingIsEmpty())
    }

    @Test
    fun clearThinking() {
      session.addThinking("reasoning")
      session.clearThinking()
      assertTrue(session.thinkingIsEmpty())
      assertEquals("", session.currentThinking())
    }

    @Test
    fun thinkingContains() {
      session.addThinking("analyzing data")
      assertTrue(session.thinkingContains("analyzing"))
      assertFalse(session.thinkingContains("missing"))
    }

    @Test
    fun replaceThinkingMarker() {
      session.addThinking("Loading [PLACEHOLDER] done")
      session.replaceThinkingMarker("[PLACEHOLDER]", "results")
      assertEquals("Loading results done", session.currentThinking())
    }

    @Test
    fun replaceThinkingMarkerNoMatch() {
      session.addThinking("no marker here")
      session.replaceThinkingMarker("[MISSING]", "x")
      assertEquals("no marker here", session.currentThinking())
    }
  }

  // endregion

  // region ClearAll

  @Nested
  inner class ClearAllTest {

    @Test
    fun clearsEverything() {
      session.addText("text")
      session.addThinking("thought")
      session.addLogprob("token", -0.5)
      session.clearAll()
      assertEquals("", session.currentText())
      assertEquals("", session.currentThinking())
      assertEquals(0, session.logprobsSize())
    }
  }

  // endregion

  // region Snapshot

  @Nested
  inner class SnapshotTest {

    @Test
    fun snapshotNotDone() {
      session.addText("partial")
      val (done, text) = session.snapshot()
      assertFalse(done)
      assertEquals("partial", text)
    }

    @Test
    fun snapshotDone() {
      session.addText("complete")
      session.done = true
      val (done, text) = session.snapshot()
      assertTrue(done)
      assertEquals("complete", text)
    }
  }

  // endregion

  // region Done Flag

  @Nested
  inner class DoneFlagTest {

    @Test
    fun defaultsFalse() {
      assertFalse(session.done)
    }

    @Test
    fun canBeSet() {
      session.done = true
      assertTrue(session.done)
    }
  }

  // endregion

  // region Logprobs

  @Nested
  inner class LogprobsTest {

    @Test
    fun startsEmpty() {
      assertEquals(0, session.logprobsSize())
      assertNull(session.meanLogprob())
    }

    @Test
    fun addLogprob() {
      session.addLogprob("hello", -1.0)
      session.addLogprob("world", -2.0)
      assertEquals(2, session.logprobsSize())
    }

    @Test
    fun meanLogprob() {
      session.addLogprob("a", -1.0)
      session.addLogprob("b", -3.0)
      assertEquals(-2.0, session.meanLogprob()!!, 0.001)
    }

    @Test
    fun logprobsTail() {
      session.addLogprob("a", -1.0)
      session.addLogprob("b", -2.0)
      session.addLogprob("c", -3.0)
      val tail = session.logprobsTail(2)
      assertEquals(2, tail.size)
      assertEquals("b", tail[0].first)
      assertEquals("c", tail[1].first)
    }

    @Test
    fun snapshotLogprobs() {
      session.addLogprob("x", -0.5)
      val snapshot = session.snapshotLogprobs()
      assertEquals(1, snapshot.size)
      assertEquals("x", snapshot[0].first)
    }

    @Test
    fun clearLogprobs() {
      session.addLogprob("a", -1.0)
      session.clearLogprobs()
      assertEquals(0, session.logprobsSize())
    }
  }

  // endregion

  // region Volatile Flags

  @Nested
  inner class VolatileFlagsTest {

    @Test
    fun defaultStates() {
      assertNull(session.error)
      assertFalse(session.stopRequested)
      assertNull(session.resourceStatus)
      assertFalse(session.searching)
      assertNull(session.searchQuery)
      assertFalse(session.fetching)
      assertNull(session.fetchUrl)
      assertFalse(session.sendingMail)
      assertNull(session.mailRecipient)
      assertEquals(0, session.queuePosition)
      assertNull(session.queueTicket)
    }

    @Test
    fun setSearching() {
      session.searching = true
      session.searchQuery = "test query"
      assertTrue(session.searching)
      assertEquals("test query", session.searchQuery)
    }

    @Test
    fun setFetching() {
      session.fetching = true
      session.fetchUrl = "https://example.com"
      assertTrue(session.fetching)
      assertEquals("https://example.com", session.fetchUrl)
    }

    @Test
    fun errorState() {
      session.error = "Something failed"
      assertEquals("Something failed", session.error)
    }

    @Test
    fun stopRequested() {
      session.stopRequested = true
      assertTrue(session.stopRequested)
    }
  }

  // endregion

  // region SessionLabels

  @Nested
  inner class SessionLabelsTest {

    @Test
    fun defaultLabels() {
      val labels = SessionLabels()
      assertTrue(labels.reasoningLabel.contains("Reasoning"))
      assertTrue(labels.showReasoningLabel.contains("reasoning"))
      assertTrue(labels.thinkingLabel.contains("Thinking"))
    }

    @Test
    fun customLabels() {
      val labels =
          SessionLabels(
              reasoningLabel = "Denken…",
              showReasoningLabel = "Gedanken zeigen",
              thinkingLabel = "Denkt…")
      assertEquals("Denken…", labels.reasoningLabel)
      assertEquals("Gedanken zeigen", labels.showReasoningLabel)
    }

    @Test
    fun searchingLabelFormat() {
      val labels = SessionLabels()
      val formatted = labels.searchingLabel.format("weather forecast")
      assertTrue(formatted.contains("weather forecast"))
    }

    @Test
    fun equality() {
      assertEquals(SessionLabels(), SessionLabels())
    }

    @Test
    fun copy() {
      val original = SessionLabels()
      val modified = original.copy(thinkingLabel = "Custom")
      assertEquals("Custom", modified.thinkingLabel)
      assertNotEquals(original.thinkingLabel, modified.thinkingLabel)
    }
  }

  // endregion

  // region ModelType

  @Nested
  inner class ModelTypeTest {

    @Test
    fun defaultFast() {
      val s = StreamingSession(enableThinking = false)
      assertEquals("fast", s.modelType)
    }

    @Test
    fun thinkingMode() {
      val s = StreamingSession(enableThinking = true)
      assertEquals("thinking", s.modelType)
    }
  }

  // endregion

  // region AutoMail

  @Nested
  inner class AutoMailTest {

    @Test
    fun defaultsNull() {
      assertNull(session.autoMailTo)
      assertNull(session.autoMailSent)
      assertNull(session.autoMailError)
    }

    @Test
    fun setAutoMail() {
      session.autoMailTo = "user@example.com"
      session.autoMailSent = true
      assertEquals("user@example.com", session.autoMailTo)
      assertTrue(session.autoMailSent!!)
    }

    @Test
    fun autoMailFailed() {
      session.autoMailTo = "user@example.com"
      session.autoMailSent = false
      session.autoMailError = "SMTP timeout"
      assertFalse(session.autoMailSent!!)
      assertEquals("SMTP timeout", session.autoMailError)
    }
  }

  // endregion
}
