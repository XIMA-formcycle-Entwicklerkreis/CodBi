package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonParser
import org.slf4j.LoggerFactory

/**
 * Deterministic steering + safety net for the GOOGLE reCAPTCHA vs. the built-in challenge captcha.
 *
 * ## Why this exists
 * A Formcycle installation may contain BOTH a generic challenge captcha (`XCaptcha`, CAPTCHA
 * plugin) and a Google-hosted reCAPTCHA (`XReCaptcha`, reCAPTCHA plugin). Pass 1 receives only the
 * condensed WIDGET NAME INDEX, and pass 2 receives **only the sections of the widgets the model
 * itself requested** — so when the model answers a "reCAPTCHA" request with the generic `XCaptcha`,
 * it never even reaches the `XReCaptcha` template. Observed: "insert a reCaptcha (the one from
 * google)" produced a plain `XCaptcha`.
 *
 * ## Detection is LANGUAGE-AGNOSTIC
 * "reCAPTCHA" is a Google brand term written identically in essentially every language, so
 * normalising the prompt (lowercase + strip every non-alphanumeric character) and looking for the
 * substring `recaptcha` distinguishes a Google reCAPTCHA request ("reCAPTCHA" / "re captcha" /
 * "re-captcha" / "Google reCAPTCHA" / a localised spelling) from a GENERIC captcha request in ANY
 * language. As a secondary net, the co-occurrence of `google` and `captcha` (e.g. a loosely worded
 * "a Google captcha") is also treated as a reCAPTCHA request. A request that only says
 * "captcha"/"Captcha-Schutz" never matches and keeps producing the built-in `XCaptcha`.
 *
 * ## Two consumers
 * - [ensureReCaptchaDetails] — the pass-2 widget list: force-adds `XReCaptcha` so the
 *   parameter-complete template is always delivered on a reCAPTCHA request (mirrors
 *   [DesignedTextDetector.withXSpan]).
 * - [applyReCaptchaIntentGuard] — the FINISHED form: when the request names a Google reCAPTCHA and
 *   the model still emitted the generic `XCaptcha`, rewrite those items to `XReCaptcha` so the
 *   correct widget is guaranteed regardless of the model's choice (mirrors the deterministic
 *   OpenPLZ / People safety nets).
 */
internal object ReCaptchaDetector {

  private val logger = LoggerFactory.getLogger(ReCaptchaDetector::class.java)

  /** The Google brand term, normalized (lowercase, no punctuation/whitespace). */
  private const val RECAPTCHA = "recaptcha"

  private fun normalize(text: String): String = text.lowercase().filter { it.isLetterOrDigit() }

  /**
   * `true` when [prompt] asks for a GOOGLE reCAPTCHA (as opposed to a generic challenge captcha),
   * in ANY language. See the class doc for why the brand-term match is language-agnostic.
   */
  fun mentionsReCaptcha(prompt: String?): Boolean {
    if (prompt.isNullOrBlank()) return false
    val n = normalize(prompt)
    if (RECAPTCHA in n) return true
    // Secondary net: a loosely worded "a Google captcha" (no "re") still means reCAPTCHA — the
    // built-in challenge captcha is never called a "Google" captcha.
    return "google" in n && "captcha" in n
  }

  /**
   * Returns [widgetIds] with `XReCaptcha` appended when [prompt] names a Google reCAPTCHA and the
   * caller did not request `XReCaptcha` already (comparison trims and ignores case, since the model
   * may answer with `xrecaptcha`, `XReCaptcha` or `XReCaptcha `). Adding the section is cheap and
   * can only ever hand the build pass the correct template, so it errs towards INCLUDING it.
   */
  fun ensureReCaptchaDetails(widgetIds: List<String>, prompt: String?): List<String> {
    if (!mentionsReCaptcha(prompt)) return widgetIds
    val hasReCaptcha = widgetIds.any { it.trim().equals("XReCaptcha", ignoreCase = true) }
    return if (hasReCaptcha) widgetIds else widgetIds + "XReCaptcha"
  }

  /**
   * Rewrites generic `XCaptcha` items to `XReCaptcha` on the FINISHED form JSON when the request
   * names a Google reCAPTCHA.
   * - No-op when the request is NOT a reCAPTCHA request (a generic captcha request is left
   *   untouched).
   * - No-op when the form already contains an `XReCaptcha` (never rewrite in the presence of the
   *   correct widget — avoids turning a deliberately kept captcha into a second reCAPTCHA).
   * - The captcha-only challenge-length properties (`minlength`/`maxlength`) are dropped; the
   *   reCAPTCHA key properties (`xrecaptcha_site_key`/`xrecaptcha_secret_key`) are left empty — the
   *   widget still renders and the keys can be filled in the designer.
   *
   * Pure (parses/serialises JSON and logs; no DB/IO) so it is unit-testable. On ANY failure
   * [formJson] is returned unchanged.
   */
  fun applyReCaptchaIntentGuard(formJson: String, prompt: String?): String {
    if (!mentionsReCaptcha(prompt)) return formJson
    return try {
      val root = JsonParser.parseString(formJson).asJsonObject
      val items = root.getAsJsonArray("items") ?: return formJson

      // Do not touch a form that already carries a reCAPTCHA — rewriting a co-existing captcha
      // would create a second one.
      for (el in items) {
        if (!el.isJsonObject) continue
        val cls = el.asJsonObject.get("className")?.takeIf { it.isJsonPrimitive }?.asString
        if (cls != null && cls.equals("XReCaptcha", ignoreCase = true)) return formJson
      }

      var converted = 0
      for (el in items) {
        if (!el.isJsonObject) continue
        val item = el.asJsonObject
        val cls = item.get("className")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
        if (!cls.equals("XCaptcha", ignoreCase = true)) continue
        item.addProperty("className", "XReCaptcha")
        item.getAsJsonObject("properties")?.let { props ->
          props.remove("minlength")
          props.remove("maxlength")
        }
        converted++
      }
      if (converted == 0) return formJson
      logger.info(
          "[ReCaptchaDetector] Rewrote {} generic XCaptcha item(s) to XReCaptcha — the request names a Google reCAPTCHA",
          converted)
      root.toString()
    } catch (e: Exception) {
      logger.warn("[ReCaptchaDetector] reCAPTCHA intent guard failed: {}", e.message)
      formJson
    }
  }

  /** Test/debug helper: the className of every item, in order. Never throws. */
  internal fun itemClassNames(formJson: String): List<String> {
    return try {
      val root = JsonParser.parseString(formJson).asJsonObject
      val items = root.getAsJsonArray("items") ?: return emptyList()
      items.mapNotNull { el ->
        el.takeIf { it.isJsonObject }
            ?.asJsonObject
            ?.get("className")
            ?.takeIf { it.isJsonPrimitive }
            ?.asString
      }
    } catch (_: Exception) {
      emptyList()
    }
  }
}
