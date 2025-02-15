package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.CodbiConfigTemplate
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.DESIGNER_PROPERTY_CONFIG_TEMPLATE
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.DESIGNER_PROPERTY_CONFIG_TEMPLATE_DEFAULT
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.DESIGNER_PROPERTY_ENABLE_CODBI
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.DESIGNER_PROPERTY_ENABLE_CODBI_DEFAULT
import de.xima.fc.form.common.models.XFormProperties
import java.util.Locale.ROOT

/**
 * Wraps an [XFormProperties] object and exposes methods to access properties specific to the code
 * library.
 *
 * @since 1.0.0
 */
internal class CodbiFormProperties(private val properties: XFormProperties) {
  /** Whether the code library is enabled for the form. */
  val enabled
    get(): Boolean =
        booleanProperty(DESIGNER_PROPERTY_ENABLE_CODBI, DESIGNER_PROPERTY_ENABLE_CODBI_DEFAULT)

  /** The configuration template for the code library, if any. */
  val configTemplate
    get(): CodbiConfigTemplate =
        enumProperty<CodbiConfigTemplate>(
            DESIGNER_PROPERTY_CONFIG_TEMPLATE,
            DESIGNER_PROPERTY_CONFIG_TEMPLATE_DEFAULT,
            { it.value })

  /**
   * Gets a boolean value at the given key from the form properties, falling back to the default if
   * unavailable.
   *
   * @param key The key of the property.
   * @param defaultValue The default value to return when the property is not set, e.g. `0` for
   *   `false`.
   * @return The boolean value at the given key, or the default value if the property is not set.
   */
  private fun booleanProperty(key: String, defaultValue: String): Boolean {
    val value = stringProperty(key, defaultValue)
    return convertToBoolean(value)
  }

  /**
   * Gets a string value at the given key from the form properties, falling back to the default if
   * unavailable.
   *
   * @param key The key of the property.
   * @param defaultValue The default value to return when the property is not set.
   * @return The string value at the given key, or the default value if the property is not set.
   */
  private fun stringProperty(key: String, defaultValue: String): String {
    return properties.getProperty(key).getDefaultString(defaultValue)
  }

  /**
   * Gets an enum constant at the given key from the form properties. Reads the string value of the
   * property at the key, then chooses the enum constant whose `by` function returns the same value.
   *
   * @param key The key of the property.
   * @param defaultValue The default value to return when the property is not set.
   * @param by A function that returns the string representation of an enum constant.
   */
  private inline fun <reified E : Enum<E>> enumProperty(
      key: String,
      defaultValue: String,
      by: (E) -> String
  ): E {
    val value = stringProperty(key, defaultValue)
    return enumValues<E>().firstOrNull { by(it) == value }
        ?: enumValues<E>().firstOrNull { by(it) == defaultValue }
        ?: throw IllegalArgumentException("Illegal default enum value $defaultValue")
  }

  /**
   * Converts a string representing a boolean value to a boolean, using the convention as employed
   * by the formcycle form designer.
   */
  private fun convertToBoolean(value: String): Boolean {
    return when (value.lowercase(ROOT)) {
      "",
      "false",
      "0" -> false
      else -> true
    }
  }
}
