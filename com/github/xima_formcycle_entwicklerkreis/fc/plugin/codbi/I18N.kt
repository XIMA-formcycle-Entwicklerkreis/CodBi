package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.RESOURCE_PATH_BUNDLE
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey
import java.util.*
import java.util.Collections.emptyEnumeration
import org.apache.commons.lang3.StringUtils.defaultIfBlank
import org.apache.commons.lang3.StringUtils.removeStart

/**
 * Gets a localized string. Falls back to English when no localization is available for the given
 * locale.
 *
 * @param key Key of the localized string.
 * @param locale Locale for which to retrieve the localized string.
 * @param defaultValue Default value to return when no localized string was found for either the
 *   given locale or for English.
 * @return The localized string.
 * @since 1.0.0
 */
fun localize(key: EMessageKey, locale: Locale?, defaultValue: String = "?$key?"): String {
  return localize(key.value, locale, defaultValue)
}

/**
 * Gets a localized string. Falls back to English when no localization is available for the given
 * locale.
 *
 * @param key Key of the localized string.
 * @param locale Locale for which to retrieve the localized string.
 * @param defaultValue Default value to return when no localized string was found for either the
 *   given locale or for English.
 * @return The localized string.
 * @since 1.0.0
 */
fun localize(key: String, locale: Locale?, defaultValue: String = "?$key?"): String {
  return try {
    val bundle = getBundle(RESOURCE_PATH_BUNDLE, locale ?: Locale.ENGLISH)
    val defaultBundle = getBundle(RESOURCE_PATH_BUNDLE, Locale.ENGLISH)
    val value = if (bundle.containsKey(key)) bundle.getString(key) else defaultBundle.getString(key)
    defaultIfBlank(value, defaultValue)
  } catch (e: Exception) {
    defaultValue
  }
}

private fun getBundle(path: String, locale: Locale): ResourceBundle {
  return try {
    ResourceBundle.getBundle(
        removeStart(path, "/"),
        locale,
        ::getBundle::class.java.classLoader,
        ResourceBundle.Control.getControl(ResourceBundle.Control.FORMAT_PROPERTIES),
    )
  } catch (e: Exception) {
    EmptyResourceBundle
  }
}

/** An empty resource bundle, used as a fallback when none could be loaded. */
internal object EmptyResourceBundle : ResourceBundle() {
  override fun getKeys(): Enumeration<String> {
    return emptyEnumeration()
  }

  override fun toString(): String {
    return "EMPTY_BUNDLE"
  }

  override fun handleGetObject(key: String): Any? {
    return null
  }
}
