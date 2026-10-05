package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonObject
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests for [AICodBiAssistant]'s `resolveNavigationPageTargets` guard.
 *
 * FORMCYCLE cannot navigate to a logical "next": `action.page` is written verbatim as
 * `data-target-page` and `gotoPage(name)` matches a REAL page name. So the guard resolves
 * "next"/"previous" to a concrete target:
 * - with the XNavigationBar plugin installed → its registered custom action (`xnavbar_next_check`,
 *   … + `customAction`/`customClassNames`), which navigates logically (rename-proof);
 * - otherwise → the adjacent page NAME.
 */
class ButtonNavigationTargetTest {

  private val assistant = AICodBiAssistant()

  private fun resolve(json: String, useNavigationPlugin: Boolean): Pair<Boolean, JsonObject> {
    val root = JsonParser.parseString(json).asJsonObject
    val changed =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod(
                "resolveNavigationPageTargets",
                JsonObject::class.java,
                Boolean::class.javaPrimitiveType)
            .apply { isAccessible = true }
            .invoke(assistant, root, useNavigationPlugin) as Boolean
    return changed to root
  }

  private fun action(root: JsonObject, btnListName: String, btnName: String): JsonObject {
    val items = root.getAsJsonArray("items")
    val list =
        items
            .map { it.asJsonObject }
            .first { it.getAsJsonObject("properties").get("name").asString == btnListName }
    val buttons = list.getAsJsonObject("properties").getAsJsonArray("buttons")
    return buttons
        .map { it.asJsonObject }
        .first { it.get("name").asString == btnName }
        .getAsJsonObject("action")
  }

  private val twoPageForm =
      """
      {"lang":"de","items":[
        {"className":"XPage","properties":{"name":"p1","id":"xi-p1","elements":["co1","btl1"]}},
        {"className":"XPage","properties":{"name":"Daten","id":"xi-p-daten","elements":["btl2"]}},
        {"className":"XContainer","properties":{"name":"co1","id":"xi-co1","parentid":"xi-p1","elements":["tf1"]}},
        {"className":"XTextField","properties":{"name":"tf1","id":"xi-tf1","parentid":"xi-co1"}},
        {"className":"XButtonList","properties":{"name":"btl1","id":"xi-btl1","buttons":[
          {"name":"btnNext","value":"Weiter","action":{"page":"next","check":true,"optionId":"next + check","value":""}},
          {"name":"btnSubmit","value":"Senden","action":{"page":"submit","check":true,"optionId":"submit + check","value":""}}]}},
        {"className":"XButtonList","properties":{"name":"btl2","id":"xi-btl2","buttons":[
          {"name":"btnBack","value":"Zurück","action":{"page":"previous","check":false,"optionId":"previous"}}]}}
      ]}
      """
          .trimIndent()

  @Test
  fun `without the plugin resolves next to the following page name`() {
    val (changed, root) = resolve(twoPageForm, false)
    assertTrue(changed)
    val a = action(root, "btl1", "btnNext")
    assertEquals("Daten", a.get("page").asString)
    assertEquals("Daten + check", a.get("optionId").asString)
    assertEquals("Daten + check", a.get("value").asString)
  }

  @Test
  fun `without the plugin resolves previous to the preceding page name`() {
    val (changed, root) = resolve(twoPageForm, false)
    assertTrue(changed)
    val a = action(root, "btl2", "btnBack")
    assertEquals("p1", a.get("page").asString)
    assertEquals("p1", a.get("optionId").asString)
  }

  @Test
  fun `with the plugin uses the xnavbar custom action (rename-proof)`() {
    val (changed, root) = resolve(twoPageForm, true)
    assertTrue(changed)
    val next = action(root, "btl1", "btnNext")
    assertEquals("xnavbar_next_check", next.get("page").asString)
    assertEquals("xnavbar_next_check", next.get("customAction").asString)
    assertEquals(
        "xnavbar-button xnavbar-button--next xnavbar-button--check",
        next.get("customClassNames").asString)
    assertEquals(false, next.get("check").asBoolean)
    assertEquals("xnavbar_next_check", next.get("optionId").asString)
    assertEquals("xnavbar_next_check", next.get("value").asString)
    assertEquals("weiter + prüfen", next.get("displayName").asString)

    val back = action(root, "btl2", "btnBack")
    assertEquals("xnavbar_prev", back.get("page").asString)
    assertEquals("xnavbar-button xnavbar-button--prev", back.get("customClassNames").asString)
    assertEquals("zurück", back.get("displayName").asString)
  }

  @Test
  fun `leaves submit buttons untouched`() {
    val (_, root) = resolve(twoPageForm, true)
    val a = action(root, "btl1", "btnSubmit")
    assertEquals("submit", a.get("page").asString)
    assertEquals("submit + check", a.get("optionId").asString)
  }

  @Test
  fun `does nothing for a single-page form`() {
    val single =
        """
        {"items":[
          {"className":"XPage","properties":{"name":"p1","id":"xi-p1","elements":["btl1"]}},
          {"className":"XButtonList","properties":{"name":"btl1","id":"xi-btl1","buttons":[
            {"name":"btnNext","value":"Weiter","action":{"page":"next","check":true,"optionId":"next + check"}}]}}
        ]}
        """
            .trimIndent()
    val (changed, root) = resolve(single, true)
    assertFalse(changed)
    assertEquals("next", action(root, "btl1", "btnNext").get("page").asString)
  }
}
