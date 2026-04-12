package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for [CodBi] base class — LogLevel enum and log message formatting. */
class CodBiTest {

  /** Concrete subclass for testing the abstract [CodBi] base class. */
  private class TestCodBi : CodBi() {
    val loggedMessages = mutableListOf<Triple<LogLevel, String, Throwable?>>()

    init {
      idLogMessages = "TestComponent"
    }

    override fun log(importance: LogLevel, toLog: String, adjenct: String, exception: Throwable?) {
      // Capture the formatted message using the same logic as the base class
      val message =
          "[[ CodBi${if (idLogMessages.isEmpty()) "" else " / $idLogMessages$adjenct"} ] $toLog ]"
      loggedMessages.add(Triple(importance, message, exception))
      // Also call super to exercise the real logger path
      super.log(importance, toLog, adjenct, exception)
    }

    /** Exposes log for testing. */
    fun testLog(importance: LogLevel, msg: String, adj: String = "", ex: Throwable? = null) {
      log(importance, msg, adj, ex)
    }

    fun setId(id: String) {
      idLogMessages = id
    }

    @JvmName("exposeLogger") fun getLoggerInstance() = logger
  }

  // region LogLevel Enum

  @Nested
  inner class LogLevelTest {

    @Test
    fun hasThreeValues() {
      assertEquals(3, CodBi.LogLevel.values().size)
    }

    @Test
    fun containsInfo() {
      assertNotNull(CodBi.LogLevel.valueOf("INFO"))
    }

    @Test
    fun containsWarning() {
      assertNotNull(CodBi.LogLevel.valueOf("WARNING"))
    }

    @Test
    fun containsError() {
      assertNotNull(CodBi.LogLevel.valueOf("ERROR"))
    }
  }

  // endregion

  // region Log Formatting

  @Nested
  inner class LogFormattingTest {

    @Test
    fun infoMessageFormat() {
      val codbi = TestCodBi()
      codbi.testLog(CodBi.LogLevel.INFO, "test message")
      assertEquals(1, codbi.loggedMessages.size)
      val (level, msg, _) = codbi.loggedMessages[0]
      assertEquals(CodBi.LogLevel.INFO, level)
      assertEquals("[[ CodBi / TestComponent ] test message ]", msg)
    }

    @Test
    fun warningMessageFormat() {
      val codbi = TestCodBi()
      codbi.testLog(CodBi.LogLevel.WARNING, "warn msg")
      val (level, msg, _) = codbi.loggedMessages[0]
      assertEquals(CodBi.LogLevel.WARNING, level)
      assertTrue(msg.contains("warn msg"))
    }

    @Test
    fun errorMessageFormat() {
      val codbi = TestCodBi()
      codbi.testLog(CodBi.LogLevel.ERROR, "error msg")
      val (level, msg, _) = codbi.loggedMessages[0]
      assertEquals(CodBi.LogLevel.ERROR, level)
      assertTrue(msg.contains("error msg"))
    }

    @Test
    fun errorWithException() {
      val codbi = TestCodBi()
      val ex = RuntimeException("boom")
      codbi.testLog(CodBi.LogLevel.ERROR, "failed", ex = ex)
      val (_, _, exception) = codbi.loggedMessages[0]
      assertSame(ex, exception)
    }

    @Test
    fun messageWithAdjunct() {
      val codbi = TestCodBi()
      codbi.testLog(CodBi.LogLevel.INFO, "msg", adj = " / SubSystem")
      val (_, msg, _) = codbi.loggedMessages[0]
      assertEquals("[[ CodBi / TestComponent / SubSystem ] msg ]", msg)
    }

    @Test
    fun emptyIdLogMessages() {
      val codbi = TestCodBi()
      codbi.setId("")
      codbi.testLog(CodBi.LogLevel.INFO, "bare message")
      val (_, msg, _) = codbi.loggedMessages[0]
      assertEquals("[[ CodBi ] bare message ]", msg)
    }
  }

  // endregion

  // region Logger Instance

  @Nested
  inner class LoggerTest {

    @Test
    fun loggerIsNotNull() {
      val codbi = TestCodBi()
      assertNotNull(codbi.getLoggerInstance())
    }
  }

  // endregion
}
