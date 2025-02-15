package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.CodbiConfigTemplate
import java.util.Locale.ENGLISH
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/** Tests for [CodbiFormResourcesPlugin]. */
class CodbiFormResourcesPluginTest {
  private val plugin = CodbiFormResourcesPlugin()

  @Test
  fun getName() {
    assertEquals(
        "com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.CodbiFormResources", plugin.name)
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
  fun getResources_containsMainResources() {
    val resources = plugin.getResources(null)

    resources["codbi.js"]!!.resource.open().use { assertTrue(it.readAllBytes().size > 50) }
    resources["codbi.css"]!!.resource.open().use { assertTrue(it.readAllBytes().size > 50) }

    assertEquals("text/javascript", resources["codbi.js"]?.mimeType)
    assertEquals("text/css", resources["codbi.css"]?.mimeType)

    assertFalse(resources["codbi.js"]!!.isIncludeInForm)
    assertFalse(resources["codbi.css"]!!.isIncludeInForm)

    assertEquals("codbi.js", resources["codbi.js"]?.fileName)
    assertEquals("codbi.css", resources["codbi.css"]?.fileName)
  }

  @Test
  fun getResources_containsAllConfigTemplates() {
    val resources = plugin.getResources(null)

    CodbiConfigTemplate.entries.forEach { e ->
      val name = "config-template-${e.value}.js"
      assertEquals(name, resources[name]?.fileName)
      assertFalse(resources[name]!!.isIncludeInForm)
      assertEquals("text/javascript", resources[name]?.mimeType)
      resources[name]!!.resource.open().use { assertTrue(it.readAllBytes().size > 50) }
    }
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
