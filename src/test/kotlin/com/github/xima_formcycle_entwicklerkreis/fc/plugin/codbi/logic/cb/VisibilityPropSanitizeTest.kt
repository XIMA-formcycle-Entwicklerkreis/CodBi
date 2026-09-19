package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonElement
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

/**
 * Tests [AICodBiAssistant]'s visibility/access-control sanitizer.
 *
 * The state/user-group availability FLAGS must end up as the design-time STRING `"1"`/`"0"` that
 * Formcycle persists — the designer's own default form template stores e.g. `"statusdependent":""`
 * and Formcycle compares the value against `"1"` — no matter whether the model emitted a JSON
 * boolean or a string. The `*viewstatus` / `*viewusergroup` arrays must keep only their
 * plain-string workflow-state UUIDs.
 */
class VisibilityPropSanitizeTest {

  private val assistant = AICodBiAssistant()

  /** Invokes the private sanitizer and returns the sanitized value as raw JSON (or `null`). */
  private fun sanitize(key: String, valueJson: String): String? {
    val method =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod(
                "sanitizeVisibilityProp", String::class.java, JsonElement::class.java)
            .apply { isAccessible = true }
    val result = method.invoke(assistant, key, JsonParser.parseString(valueJson)) as JsonElement?
    return result?.toString()
  }

  @Test
  fun `a boolean flag is normalized to the design-time string`() {
    assertEquals("\"1\"", sanitize("statusdependent", "true"))
    assertEquals("\"0\"", sanitize("statusdependent", "false"))
    assertEquals("\"1\"", sanitize("readonly_usergrouppendant", "true"))
    assertEquals("\"0\"", sanitize("readonly_statusdependent", "false"))
  }

  @Test
  fun `a string flag is kept and normalized`() {
    assertEquals("\"1\"", sanitize("readonly_statusdependent", "\"1\""))
    assertEquals("\"0\"", sanitize("usergrouppendent", "\"0\""))
    assertEquals("\"0\"", sanitize("usergrouppendent", "\"false\""))
    // The designer's default form template stores an EMPTY string for a disabled flag.
    assertEquals("\"0\"", sanitize("statusdependent", "\"\""))
  }

  @Test
  fun `an unsupported flag shape is dropped`() {
    assertNull(sanitize("statusdependent", "{}"))
    assertNull(sanitize("statusdependent", "2"))
    assertNull(sanitize("statusdependent", "\"maybe\""))
    assertNull(sanitize("unknownproperty", "\"1\""))
  }

  @Test
  fun `viewstatus keeps only plain string entries`() {
    assertEquals("[\"abc\",\"def\"]", sanitize("viewstatus", "[\"abc\", 1, \"def\", {}]"))
    assertEquals(
        "[\"[!]3f2b19c4-1111\"]", sanitize("readonly_viewstatus", "[\"[!]3f2b19c4-1111\"]"))
    assertNull(sanitize("viewstatus", "\"abc\""))
  }
}
