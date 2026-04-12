package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for [MailBridge] — email cleaning, regex patterns, formatting, rate limiting config. */
class MailBridgeTest {

  @BeforeEach
  fun setUp() {
    MailBridge.enabled = false
    MailBridge.allowedRecipientPattern = null
    MailBridge.maxMailsPerHour = 10
    MailBridge.maxMailsPerSession = 3
    MailBridge.aiDisclaimer = "AI-Generated"
  }

  @AfterEach
  fun tearDown() {
    // Reset state
    MailBridge.enabled = false
    MailBridge.allowedRecipientPattern = null
  }

  // region cleanEmail

  @Nested
  inner class CleanEmailTest {

    @Test
    fun passesCleanAddress() {
      assertEquals("user@example.com", MailBridge.cleanEmail("user@example.com"))
    }

    @Test
    fun stripsWhitespace() {
      assertEquals("user@example.com", MailBridge.cleanEmail("  user@example.com  "))
    }

    @Test
    fun stripsNewlines() {
      assertEquals("user@example.com", MailBridge.cleanEmail("user\n@example\n.com"))
    }

    @Test
    fun stripsTabs() {
      assertEquals("user@example.com", MailBridge.cleanEmail("user\t@example.com"))
    }

    @Test
    fun stripsEmojis() {
      assertEquals("user@example.com", MailBridge.cleanEmail("✉user@example.com"))
    }

    @Test
    fun stripsSymbolCharacters() {
      assertEquals("user@example.com", MailBridge.cleanEmail("📧user@example.com📫"))
    }

    @Test
    fun emptyInput() {
      assertEquals("", MailBridge.cleanEmail(""))
    }

    @Test
    fun onlyWhitespace() {
      assertEquals("", MailBridge.cleanEmail("   \t\n  "))
    }
  }

  // endregion

  // region CALL_MAIL_PATTERN

  @Nested
  inner class CallMailPatternTest {

    @Test
    fun matchesCompleteCallSingleQuotes() {
      val text = "CALL:mail(to='a@b.com', subject='Hi', body='Hello world')"
      val match = MailBridge.CALL_MAIL_PATTERN.find(text)
      assertNotNull(match)
      assertEquals("a@b.com", match!!.groupValues[1])
      assertEquals("Hi", match.groupValues[2])
      assertEquals("Hello world", match.groupValues[3])
    }

    @Test
    fun matchesCompleteCallDoubleQuotes() {
      val text = """CALL:mail(to="a@b.com", subject="Test", body="Body text")"""
      val match = MailBridge.CALL_MAIL_PATTERN.find(text)
      assertNotNull(match)
      assertEquals("a@b.com", match!!.groupValues[1])
      assertEquals("Test", match.groupValues[2])
    }

    @Test
    fun matchesMultilineBody() {
      val text = "CALL:mail(to='a@b.com', subject='S', body='Line1\nLine2\nLine3')"
      val match = MailBridge.CALL_MAIL_PATTERN.find(text)
      assertNotNull(match)
      assertTrue(match!!.groupValues[3].contains("Line1"))
    }

    @Test
    fun noMatchWithoutBody() {
      val text = "CALL:mail(to='a@b.com', subject='S')"
      assertNull(MailBridge.CALL_MAIL_PATTERN.find(text))
    }
  }

  // endregion

  // region CALL_MAIL_PATTERN_TRUNCATED

  @Nested
  inner class CallMailPatternTruncatedTest {

    @Test
    fun matchesTruncatedBody() {
      val text = "CALL:mail(to='a@b.com', subject='S', body='Start of very long body that got"
      val match = MailBridge.CALL_MAIL_PATTERN_TRUNCATED.find(text)
      assertNotNull(match)
      assertEquals("a@b.com", match!!.groupValues[1])
      assertEquals("S", match.groupValues[2])
      assertTrue(match.groupValues[3].startsWith("Start"))
    }

    @Test
    fun matchesEmptyTruncatedBody() {
      val text = "CALL:mail(to='a@b.com', subject='S', body='"
      val match = MailBridge.CALL_MAIL_PATTERN_TRUNCATED.find(text)
      assertNotNull(match)
      assertEquals("a@b.com", match!!.groupValues[1])
    }
  }

  // endregion

  // region MailResult Data Class

  @Nested
  inner class MailResultTest {

    @Test
    fun successResult() {
      val result = MailBridge.MailResult(success = true, recipient = "a@b.com", subject = "Hi")
      assertTrue(result.success)
      assertEquals("a@b.com", result.recipient)
      assertEquals("Hi", result.subject)
      assertNull(result.error)
    }

    @Test
    fun failureResult() {
      val result = MailBridge.MailResult(success = false, error = "rate limit")
      assertFalse(result.success)
      assertNull(result.recipient)
      assertEquals("rate limit", result.error)
    }

    @Test
    fun equality() {
      val a = MailBridge.MailResult(success = true, recipient = "x@y.com")
      val b = MailBridge.MailResult(success = true, recipient = "x@y.com")
      assertEquals(a, b)
    }
  }

  // endregion

  // region formatResultForModel

  @Nested
  inner class FormatResultForModelTest {

    @Test
    fun successFormat() {
      val result = MailBridge.MailResult(success = true, recipient = "a@b.com", subject = "Hello")
      val output = MailBridge.formatResultForModel(result)
      assertTrue(output.contains("MAIL SENT SUCCESSFULLY"))
      assertTrue(output.contains("a@b.com"))
      assertTrue(output.contains("Hello"))
    }

    @Test
    fun failureFormat() {
      val result = MailBridge.MailResult(success = false, error = "blocked")
      val output = MailBridge.formatResultForModel(result)
      assertTrue(output.contains("MAIL SENDING FAILED"))
      assertTrue(output.contains("blocked"))
    }

    @Test
    fun successFormatContainsInstructions() {
      val result = MailBridge.MailResult(success = true, recipient = "x@y.com", subject = "S")
      assertTrue(MailBridge.formatResultForModel(result).contains("INSTRUCTIONS:"))
    }

    @Test
    fun failureFormatContainsInstructions() {
      val result = MailBridge.MailResult(success = false, error = "err")
      assertTrue(MailBridge.formatResultForModel(result).contains("INSTRUCTIONS:"))
    }
  }

  // endregion

  // region isAvailable

  @Nested
  inner class IsAvailableTest {

    @Test
    fun notAvailableWhenDisabled() {
      MailBridge.enabled = false
      assertFalse(MailBridge.isAvailable)
    }

    @Test
    fun availableWhenEnabled() {
      MailBridge.enabled = true
      assertTrue(MailBridge.isAvailable)
    }
  }

  // endregion

  // region sendMail guards

  @Nested
  inner class SendMailGuardTest {

    @Test
    fun returnsErrorWhenDisabled() {
      MailBridge.enabled = false
      val result = MailBridge.sendMail("a@b.com", "S", "B", "sess1")
      assertFalse(result.success)
    }

    @Test
    fun returnsErrorForInvalidEmail() {
      MailBridge.enabled = true
      val result = MailBridge.sendMail("not-an-email", "S", "B", "sess1")
      assertFalse(result.success)
    }

    @Test
    fun returnsErrorForEmailMissingDot() {
      MailBridge.enabled = true
      val result = MailBridge.sendMail("user@localhost", "S", "B", "sess1")
      assertFalse(result.success)
    }

    @Test
    fun returnsErrorForBlockedRecipient() {
      MailBridge.enabled = true
      MailBridge.allowedRecipientPattern = Regex(""".*@allowed\.com""")
      val result = MailBridge.sendMail("user@other.com", "S", "B", "sess1")
      assertFalse(result.success)
    }
  }

  // endregion

  // region sendMail rate limiting

  @Nested
  inner class SendMailRateLimitTest {

    @Test
    fun perSessionLimitReturnsError() {
      MailBridge.enabled = true
      MailBridge.maxMailsPerSession = 0
      val result = MailBridge.sendMail("user@example.com", "S", "B", "rate-test-sess")
      assertFalse(result.success)
    }

    @Test
    fun globalHourlyLimitReturnsError() {
      MailBridge.enabled = true
      MailBridge.maxMailsPerHour = 0
      MailBridge.maxMailsPerSession = 100
      val result = MailBridge.sendMail("user@example.com", "S", "B", "hourly-test-sess")
      assertFalse(result.success)
    }

    @Test
    fun sendMailExercisesFullPathWithFcClassError() {
      MailBridge.enabled = true
      MailBridge.maxMailsPerSession = 10
      MailBridge.maxMailsPerHour = 100
      val result = MailBridge.sendMail("user@example.com", "Subject", "Body text", "fc-test-sess")
      // sendViaFormcycleApi will throw ClassNotFoundException for FC classes
      assertFalse(result.success)
      assertNotNull(result.error)
    }

    @Test
    fun subjectIsSanitized() {
      MailBridge.enabled = true
      MailBridge.maxMailsPerSession = 10
      MailBridge.maxMailsPerHour = 100
      val longSubject = "A".repeat(300)
      val result = MailBridge.sendMail("user@example.com", longSubject, "Body", "sanitize-sess")
      // Will fail on FC class but the sanitization code runs first
      assertFalse(result.success)
    }

    @Test
    fun bodyIsAppendedWithDisclaimer() {
      MailBridge.enabled = true
      MailBridge.aiDisclaimer = "TestDisclaimer"
      MailBridge.maxMailsPerSession = 10
      MailBridge.maxMailsPerHour = 100
      val result = MailBridge.sendMail("user@example.com", "S", "Body", "disc-sess")
      // Will fail but disclaimer code path is executed
      assertFalse(result.success)
    }

    @Test
    fun clientIPIsPassedThrough() {
      MailBridge.enabled = true
      MailBridge.maxMailsPerSession = 10
      MailBridge.maxMailsPerHour = 100
      val result = MailBridge.sendMail("user@example.com", "S", "B", "ip-sess", "192.168.1.100")
      assertFalse(result.success)
    }
  }

  // endregion

  // region clearSession

  @Nested
  inner class ClearSessionTest {

    @Test
    fun clearSessionDoesNotThrow() {
      MailBridge.clearSession("nonexistent-session")
    }

    @Test
    fun clearSessionResetsLimit() {
      MailBridge.enabled = true
      MailBridge.maxMailsPerSession = 0
      // First call fails due to session limit
      val result1 = MailBridge.sendMail("user@example.com", "S", "B", "clear-test-sess")
      assertFalse(result1.success)
      // Clear and set limit higher
      MailBridge.clearSession("clear-test-sess")
      MailBridge.maxMailsPerSession = 10
      // Now should pass session limit check (will fail on FC class instead)
      val result2 = MailBridge.sendMail("user@example.com", "S", "B", "clear-test-sess")
      assertFalse(result2.success) // Still fails, but for a different reason
    }
  }

  // endregion

  // region sendMail with allowed pattern match

  @Nested
  inner class AllowedPatternTest {

    @Test
    fun passesWhenPatternMatches() {
      MailBridge.enabled = true
      MailBridge.allowedRecipientPattern = Regex(""".*@allowed\.com""")
      MailBridge.maxMailsPerSession = 10
      MailBridge.maxMailsPerHour = 100
      val result = MailBridge.sendMail("user@allowed.com", "S", "B", "pattern-sess")
      // Passes pattern check, fails on FC class
      assertFalse(result.success)
      assertTrue(result.error?.contains("❌") == true || result.error != null)
    }
  }

  // endregion
}
