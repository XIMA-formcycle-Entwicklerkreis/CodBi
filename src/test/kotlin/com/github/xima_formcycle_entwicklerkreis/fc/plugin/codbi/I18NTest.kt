package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.FORM_TEST_STRING
import java.util.Locale
import java.util.Locale.ENGLISH
import java.util.Locale.GERMAN
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

/** Tests for I18N */
class I18NTest {
  @Test
  fun localize_EMessageKey_Locale() {
    assertEquals("test-de", localize(FORM_TEST_STRING, GERMAN))
    assertEquals("test-en", localize(FORM_TEST_STRING, ENGLISH))
    assertEquals("test-en", localize(FORM_TEST_STRING, Locale.forLanguageTag("klg")))
  }

  @Test
  fun localize_EMessageKey_Locale_String() {
    assertEquals("test-de", localize(FORM_TEST_STRING, GERMAN, "default"))
    assertEquals("test-en", localize(FORM_TEST_STRING, ENGLISH, "default"))
    assertEquals("test-en", localize(FORM_TEST_STRING, Locale.forLanguageTag("klg"), "default"))
  }

  @Test
  fun localize_String_Locale() {
    assertEquals("test-de", localize("form.test_string", GERMAN))
    assertEquals("test-en", localize("form.test_string", ENGLISH))
    assertEquals("?missing?", localize("missing", ENGLISH))
    assertEquals("test-en", localize("form.test_string", Locale.forLanguageTag("klg")))
  }

  @Test
  fun localize_String_Locale_String() {
    assertEquals("test-de", localize("form.test_string", GERMAN, "default"))
    assertEquals("test-en", localize("form.test_string", ENGLISH, "default"))
    assertEquals("default", localize("missing", ENGLISH, "default"))
    assertEquals("test-en", localize("form.test_string", Locale.forLanguageTag("klg"), "default"))
  }

  @Test
  fun emptyResourceBundle() {
    assertEquals("EMPTY_BUNDLE", EmptyResourceBundle.toString())
    assertEquals(emptyList<Any>(), EmptyResourceBundle.keys.toList())
    assertFalse(EmptyResourceBundle.containsKey("foo"))
    assertTrue(EmptyResourceBundle.runCatching { this.getString("foo") }.isFailure)
  }
}
