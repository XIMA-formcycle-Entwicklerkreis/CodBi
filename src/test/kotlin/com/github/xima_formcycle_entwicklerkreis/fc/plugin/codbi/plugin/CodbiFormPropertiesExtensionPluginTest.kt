package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import java.util.Locale.ENGLISH
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/** Tests for [CodbiFormPropertiesExtensionPlugin]. */
class CodbiFormPropertiesExtensionPluginTest {
  private val plugin = CodbiFormPropertiesExtensionPlugin()

  @Test
  fun getName() {
    assertEquals(
        "com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.CodbiFormPropertiesExtension",
        plugin.name)
  }

  @Test
  fun getDisplayName() {
    assertTrue(plugin.getDisplayName(ENGLISH).length > 10)
  }

  @Test
  fun getDescription() {
    assertTrue(plugin.getDescription(ENGLISH).length > 10)
  }

  @Test
  fun extendFormProperties() {
    val result = plugin.extendFormProperties(null)
    assertEquals(5, result.additionalProperties.size)

    assertEquals("codbi-prop-enable", result.additionalProperties.get(0).name)
    assertEquals("0", result.additionalProperties.get(0).defaultValue)

    assertEquals("codbi-prop-standards", result.additionalProperties.get(1).name)
    assertEquals("Holistic.CSS.Standard", result.additionalProperties.get(1).defaultValue)

    assertEquals("codbi-prop-config-template", result.additionalProperties.get(2).name)
    assertEquals("default", result.additionalProperties.get(2).defaultValue)

    assertEquals("LDAP_URL", result.additionalProperties.get(3).name)
    assertEquals("", result.additionalProperties.get(3).defaultValue)

    assertEquals("LDAP_URL_BACKEND", result.additionalProperties.get(4).name)
    assertEquals("", result.additionalProperties.get(4).defaultValue)
  }

  @BeforeEach
  fun setUp() {
    plugin.testInit()
  }

  @AfterEach
  fun tearDown() {
    plugin.testDestroy()
  }
}
