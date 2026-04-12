package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi

import java.util.Locale
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for I18N — EmptyResourceBundle and localize fallback behaviour. */
class I18NTest {

  @Nested
  inner class EmptyResourceBundleTest {

    @Test
    fun toStringReturnsEmptyBundle() {
      assertEquals("EMPTY_BUNDLE", EmptyResourceBundle.toString())
    }

    @Test
    fun keysEnumerationIsEmpty() {
      assertEquals(emptyList<Any>(), EmptyResourceBundle.keys.toList())
    }

    @Test
    fun containsKeyReturnsFalse() {
      assertFalse(EmptyResourceBundle.containsKey("foo"))
      assertFalse(EmptyResourceBundle.containsKey(""))
      assertFalse(EmptyResourceBundle.containsKey("any.key"))
    }

    @Test
    fun getStringThrows() {
      assertTrue(EmptyResourceBundle.runCatching { this.getString("foo") }.isFailure)
    }
  }

  @Nested
  inner class LocalizeFallbackTest {

    @Test
    fun missingKeyReturnsDefault() {
      // When the resource bundle doesn't contain the key, the default "?key?" is returned
      val result = localize("nonexistent.key.xyz", Locale.ENGLISH)
      assertEquals("?nonexistent.key.xyz?", result)
    }

    @Test
    fun missingKeyReturnsCustomDefault() {
      val result = localize("nonexistent.key.xyz", Locale.ENGLISH, "custom-default")
      assertEquals("custom-default", result)
    }

    @Test
    fun nullLocaleUsesEnglishFallback() {
      // With null locale, it should not crash and should return something
      val result = localize("nonexistent.key", null)
      assertEquals("?nonexistent.key?", result)
    }

    @Test
    fun unknownLocaleReturnsDefault() {
      val result = localize("nonexistent.key", Locale.forLanguageTag("xx"))
      assertEquals("?nonexistent.key?", result)
    }
  }
}
