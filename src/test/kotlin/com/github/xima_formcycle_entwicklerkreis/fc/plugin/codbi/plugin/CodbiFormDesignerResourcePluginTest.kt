package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import java.nio.charset.StandardCharsets.UTF_8
import java.util.Locale.ENGLISH
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/** Tests for [CodbiFormDesignerResourcePlugin]. */
class CodbiFormDesignerResourcePluginTest {
  private val plugin = CodbiFormDesignerResourcePlugin()

  @Test
  fun getName() {
    assertEquals(
        "com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.CodbiFormDesignerResource",
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
  fun getCssResource() {
    val resource = plugin.getCssResource(null)
    val content = resource.open().use { String(it.readAllBytes(), UTF_8) }
    assertEquals("UTF-8", resource.charset.name())
    assertTrue(content.length > 10)
  }

  @Test
  fun getJavaScriptResource() {
    val resource = plugin.getJavaScriptResource(null)
    val content = resource.open().use { String(it.readAllBytes(), UTF_8) }
    assertEquals("UTF-8", resource.charset.name())
    assertTrue(content.length > 100)
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
