package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonObject
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests for [AICodBiAssistant]'s `fillNavigatorOptionsFromPages` guard.
 *
 * The model sometimes emits an XNavigationBar ("Form.Navigator") with an EMPTY `options` array, so
 * the rendered bar shows no steps and the form's pages cannot be reached from it. The guard fills
 * the options from the form's XPages: `value` = the page's `name` (the identifier the bar navigates
 * to), `text` = the page's `header`/title when set, else the page's `name`.
 */
class NavigatorOptionsFillTest {

  private val assistant = AICodBiAssistant()

  private fun fill(json: String): Pair<Boolean, JsonObject> {
    val root = JsonParser.parseString(json).asJsonObject
    val changed =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod("fillNavigatorOptionsFromPages", JsonObject::class.java)
            .apply { isAccessible = true }
            .invoke(assistant, root) as Boolean
    return changed to root
  }

  private fun options(root: JsonObject): com.google.gson.JsonArray? {
    val items = root.getAsJsonArray("items")
    val nav =
        items
            .map { it.asJsonObject }
            .firstOrNull { it.get("className")?.asString == "XNavigationBar" }
    return nav?.getAsJsonObject("properties")?.getAsJsonArray("options")
  }

  private val emptyNavbarTwoPages =
      """
      {"lang":"de","items":[
        {"className":"XPage","properties":{"name":"p1","id":"xi-p1","header":"Personendaten"}},
        {"className":"XPage","properties":{"name":"Daten","id":"xi-p-daten"}},
        {"className":"XNavigationBar","properties":{"name":"navbar","id":"xi-navbar-1","options":[]}}
      ]}
      """
          .trimIndent()

  @Test
  fun `an empty navbar options array is filled from every page`() {
    val (changed, root) = fill(emptyNavbarTwoPages)
    assertTrue(changed)
    val opts = options(root)!!
    assertEquals(2, opts.size())
    // page order preserved; text = header when set, else the page name; value = page name
    assertEquals("Personendaten", opts[0].asJsonObject.get("text").asString)
    assertEquals("p1", opts[0].asJsonObject.get("value").asString)
    assertEquals("Daten", opts[1].asJsonObject.get("text").asString)
    assertEquals("Daten", opts[1].asJsonObject.get("value").asString)
  }

  @Test
  fun `a usable options array is left untouched`() {
    val withOptions =
        """
        {"items":[
          {"className":"XPage","properties":{"name":"p1","id":"xi-p1"}},
          {"className":"XPage","properties":{"name":"Daten","id":"xi-p-daten"}},
          {"className":"XNavigationBar","properties":{"name":"navbar","id":"xi-navbar-1",
            "options":[{"text":"Start","value":"p1"},{"text":"Daten","value":"Daten"}]}}
        ]}
        """
            .trimIndent()
    val (changed, root) = fill(withOptions)
    assertFalse(changed)
    assertEquals("Start", options(root)!![0].asJsonObject.get("text").asString)
  }

  @Test
  fun `options that only carry blank values are treated as empty and refilled`() {
    val blankValues =
        """
        {"items":[
          {"className":"XPage","properties":{"name":"p1","id":"xi-p1"}},
          {"className":"XNavigationBar","properties":{"name":"navbar","id":"xi-navbar-1",
            "options":[{"text":"","value":""}]}}
        ]}
        """
            .trimIndent()
    val (changed, root) = fill(blankValues)
    assertTrue(changed)
    val opts = options(root)!!
    assertEquals(1, opts.size())
    assertEquals("p1", opts[0].asJsonObject.get("value").asString)
  }

  @Test
  fun `a navbar with no pages and no options is untouched`() {
    val noPages =
        """
        {"items":[
          {"className":"XNavigationBar","properties":{"name":"navbar","id":"xi-navbar-1","options":[]}}
        ]}
        """
            .trimIndent()
    val (changed, root) = fill(noPages)
    assertFalse(changed)
    // options array stays present (empty), not removed
    assertTrue(options(root)!!.isEmpty)
  }

  @Test
  fun `a form without any navbar is untouched`() {
    val noNavbar =
        """
        {"items":[
          {"className":"XPage","properties":{"name":"p1","id":"xi-p1"}}
        ]}
        """
            .trimIndent()
    val (changed, root) = fill(noNavbar)
    assertFalse(changed)
    assertNull(options(root))
  }
}
