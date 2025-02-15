package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.FormRenderCallback
import java.util.Locale.ENGLISH
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/** Tests for [CodbiFormRenderCallbackPlugin]. */
class CodbiFormRenderCallbackPluginTest {
  private val plugin = CodbiFormRenderCallbackPlugin()

  @Test
  fun getName() {
    assertEquals(
        "com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.CodbiFormRenderCallback",
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
  fun createCallbacks() {
    val callbacks = plugin.createCallbacks().toList()
    assertEquals(1, callbacks.size)
    assertSame(FormRenderCallback, callbacks[0])
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
