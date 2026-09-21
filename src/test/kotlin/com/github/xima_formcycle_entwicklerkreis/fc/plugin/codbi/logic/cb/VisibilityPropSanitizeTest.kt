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
 * plain-string workflow-state UUIDs, and a `[!]` EXCLUSION marker that the model wrote as a
 * Java/JS-style concatenation (`"[!]" + "GOGO"`) must be collapsed into the single entry
 * `"[!]GOGO"` — otherwise the state name resolution would store a PLAIN entry and invert the
 * condition ("usable only in X" would become "read-only/available IN X").
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

  @Test
  fun `a correct exclusion entry is preserved`() {
    assertEquals("[\"[!]GOGO\"]", sanitize("readonly_viewstatus", """["[!]GOGO"]"""))
    assertEquals(
        "[\"[!]GOGO\",\"[!]WAITING\"]", sanitize("viewstatus", """["[!]GOGO","[!]WAITING"]"""))
  }

  @Test
  fun `a concatenated exclusion marker is collapsed into one entry`() {
    // Whichever shape the lenient JSON reader produces from a concatenation — the two entries
    // ["[!]","GOGO"], the glue text [!]" + "GOGO" or the stray operator ["[!]","+","GOGO"] — the
    // sanitizer must yield the SINGLE entry "[!]GOGO", because a PLAIN state entry would invert the
    // condition ("usable only in X" would become "read-only IN X").
    assertEquals("[\"[!]GOGO\"]", sanitize("readonly_viewstatus", """["[!]", "GOGO"]"""))
    assertEquals("[\"[!]GOGO\"]", sanitize("readonly_viewstatus", """["[!]\" + \"GOGO"]"""))
    assertEquals("[\"[!]GOGO\"]", sanitize("readonly_viewstatus", """["[!]","+","GOGO"]"""))
    // A lone marker is dropped (a bare `[!]` would satisfy the condition in EVERY state).
    assertEquals("[]", sanitize("readonly_viewstatus", """["[!]"]"""))
  }

  @Test
  fun `a string concatenation in the model response is repaired`() {
    // `["[!]" + "GOGO"]` is not even parseable JSON (gson: "Unterminated array"), so the WHOLE
    // response used to be discarded and the previous form kept. extractJson() therefore repairs the
    // concatenation glue before parsing.
    val method =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod("repairStringConcatenations", String::class.java)
            .apply { isAccessible = true }
    fun repaired(text: String): String = method.invoke(assistant, text) as String
    assertEquals("""["[!]GOGO"]""", repaired("""["[!]" + "GOGO"]"""))
    assertEquals(
        """{"readonly_viewstatus":["[!]WAITING"],"readonly_statusdependent":"1"}""",
        repaired("""{"readonly_viewstatus":["[!]"+"WAITING"],"readonly_statusdependent":"1"}"""))
    // An ESCAPED quote pair inside a legitimate string value must stay untouched.
    assertEquals("""{"a":"x\" + \"y"}""", repaired("""{"a":"x\" + \"y"}"""))
  }

  @Test
  fun `a misplaced exclusion marker is canonicalized`() {
    // The model regularly wraps the NAME in the marker's brackets, keeps only the exclamation mark
    // or
    // leaves a space after the marker. Such a value is unknown to the form designer (its status
    // list
    // builds the negated option id as the marker followed by the state id - see
    // DefaultFD2StatusProvider.createStatusJson), so the property would show NOTHING selected. All
    // variants are folded to the canonical "[!]<name>"; the later name resolution turns it into
    // "[!]<stateUuid>" = read-only in every state EXCEPT that one.
    assertEquals("[\"[!]GOGO\"]", sanitize("readonly_viewstatus", """["[!GOGO]"]"""))
    assertEquals("[\"[!]GOGO\"]", sanitize("readonly_viewstatus", """["!GOGO"]"""))
    assertEquals("[\"[!]GOGO\"]", sanitize("readonly_viewstatus", """["[!] GOGO"]"""))
    assertEquals("[\"[!]d195feee\"]", sanitize("viewstatus", """["[!d195feee]"]"""))
    // A plain entry must stay a plain entry (no marker is invented).
    assertEquals("[\"GOGO\"]", sanitize("viewstatus", """["GOGO"]"""))
  }
}
