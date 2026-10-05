package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests for [ReCaptchaDetector] — the deterministic GOOGLE-reCAPTCHA-vs-generic-captcha steering.
 *
 * The detector's whole point is that a "reCAPTCHA" request (a Google brand term, written the same
 * in every language) must NEVER yield the built-in `XCaptcha` widget, while a plain captcha request
 * must keep doing so. These tests lock in BOTH directions (positive AND negative) so a future
 * loosening of the matcher cannot silently turn every captcha into a reCAPTCHA.
 */
class ReCaptchaDetectorTest {

  // region mentionsReCaptcha

  @Test
  fun brandTermMatchesInAnyWrapping() {
    // The exact reported failure, plus punctuation / spacing / casing variants and a German phrase.
    assertTrue(ReCaptchaDetector.mentionsReCaptcha("reCaptcha (das von Google) einfügen"))
    assertTrue(ReCaptchaDetector.mentionsReCaptcha("Google reCAPTCHA"))
    assertTrue(ReCaptchaDetector.mentionsReCaptcha("re-captcha"))
    assertTrue(ReCaptchaDetector.mentionsReCaptcha("re captcha bitte"))
    assertTrue(ReCaptchaDetector.mentionsReCaptcha("RECAPTCHA v2"))
    assertTrue(ReCaptchaDetector.mentionsReCaptcha("Google-Captcha einbauen"))
  }

  @Test
  fun genericCaptchaRequestDoesNotMatch() {
    // Plain challenge-captcha requests must NOT be steered to XReCaptcha.
    assertFalse(ReCaptchaDetector.mentionsReCaptcha("Captcha-Schutz hinzufügen"))
    assertFalse(ReCaptchaDetector.mentionsReCaptcha("insert a captcha with 10 characters"))
    assertFalse(ReCaptchaDetector.mentionsReCaptcha("mit Captcha sichern"))
    assertFalse(ReCaptchaDetector.mentionsReCaptcha(null))
    assertFalse(ReCaptchaDetector.mentionsReCaptcha(""))
    assertFalse(ReCaptchaDetector.mentionsReCaptcha("   "))
  }

  // endregion

  // region ensureReCaptchaDetails

  @Test
  fun reCaptchaRequestForcesTheDetailSectionIn() {
    val widgets = listOf("XTextField", "XCaptcha")
    assertEquals(
        listOf("XTextField", "XCaptcha", "XReCaptcha"),
        ReCaptchaDetector.ensureReCaptchaDetails(widgets, "ein reCaptcha einfügen"))
  }

  @Test
  fun noDuplicateWhenXReCaptchaAlreadyRequested() {
    val widgets = listOf("XReCaptcha", "XTextField")
    assertEquals(widgets, ReCaptchaDetector.ensureReCaptchaDetails(widgets, "Google reCAPTCHA"))
    // The model may answer with a differently-cased / padded name.
    assertEquals(
        listOf(" xrecaptcha "),
        ReCaptchaDetector.ensureReCaptchaDetails(listOf(" xrecaptcha "), "Google reCAPTCHA"))
  }

  @Test
  fun genericCaptchaRequestLeavesTheWidgetListAlone() {
    val widgets = listOf("XCaptcha", "XTextField")
    assertEquals(widgets, ReCaptchaDetector.ensureReCaptchaDetails(widgets, "Captcha-Schutz"))
    assertEquals(emptyList<String>(), ReCaptchaDetector.ensureReCaptchaDetails(emptyList(), null))
  }

  // endregion

  // region applyReCaptchaIntentGuard

  private val captchaForm =
      """
      {"items":[
        {"className":"XCaptcha","properties":{"name":"captcha1","id":"xi-captcha1","minlength":"10","maxlength":"10"}},
        {"className":"XTextField","properties":{"name":"tfName","id":"xi-tf"}}
      ]}
      """
          .trimIndent()

  @Test
  fun guardRewritesGenericCaptchaToReCaptchaAndDropsLengthProps() {
    val out = ReCaptchaDetector.applyReCaptchaIntentGuard(captchaForm, "reCaptcha (das von Google)")
    assertEquals(listOf("XReCaptcha", "XTextField"), ReCaptchaDetector.itemClassNames(out))
    val props =
        JsonParser.parseString(out)
            .asJsonObject
            .getAsJsonArray("items")
            .first { it.asJsonObject.get("className").asString == "XReCaptcha" }
            .asJsonObject
            .getAsJsonObject("properties")
    // The captcha-only challenge-length props must not survive on a reCAPTCHA.
    assertFalse(props.has("minlength"))
    assertFalse(props.has("maxlength"))
    // Identity is preserved so the designer/apply-from-log can still match the element.
    assertEquals("captcha1", props.get("name").asString)
    assertEquals("xi-captcha1", props.get("id").asString)
  }

  @Test
  fun guardLeavesAGenericCaptchaRequestUntouched() {
    val out = ReCaptchaDetector.applyReCaptchaIntentGuard(captchaForm, "Captcha-Schutz")
    assertEquals(captchaForm, out)
    assertEquals(listOf("XCaptcha", "XTextField"), ReCaptchaDetector.itemClassNames(out))
  }

  @Test
  fun guardDoesNotRewriteWhenAReCaptchaAlreadyExists() {
    val alreadyReCaptcha =
        """
        {"items":[
          {"className":"XReCaptcha","properties":{"name":"captcha1"}},
          {"className":"XCaptcha","properties":{"name":"captcha2"}}
        ]}
        """
            .trimIndent()
    assertEquals(
        alreadyReCaptcha,
        ReCaptchaDetector.applyReCaptchaIntentGuard(alreadyReCaptcha, "Google reCAPTCHA"))
  }

  @Test
  fun guardIsANoOpWithoutACaptcha() {
    val noCaptcha = """{"items":[{"className":"XTextField","properties":{"name":"tf"}}]}"""
    assertEquals(
        noCaptcha, ReCaptchaDetector.applyReCaptchaIntentGuard(noCaptcha, "Google reCAPTCHA"))
  }

  // endregion
}
