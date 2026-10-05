package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonObject
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests for [AICodBiAssistant]'s `normalizeButtonActionOptionIds` guard.
 *
 * A button action's `optionId` (and, when it mirrors it, the action `value`) is the MACHINE value
 * the FORMCYCLE designer stores for the dropdown selection — NOT the human label it displays. It is
 * derived from `page` + `check` by the designer's own function (verified in
 * `form-designer.min.js`):
 * - submit -> "submit + check", submitNoCheck -> "submit", submitSave -> "save + check",
 *   submitSaveNoCheck -> "save", submitPreview -> "submit no save", submitPreviewWindowed ->
 *   "submit no save popup"
 * - any other page -> the page value itself, or "<page> + check" when check=true (so "next + check"
 *   / "previous + check"; the designer only DISPLAYS these as "next page + check" / "previous
 *   page + check"). The guard repairs an EXISTING optionId, never introduces one, and leaves "" /
 *   "-1" pages alone.
 */
class ButtonActionOptionIdTest {

  private val assistant = AICodBiAssistant()

  private fun normalize(json: String): Pair<Boolean, JsonObject> {
    val root = JsonParser.parseString(json).asJsonObject
    val changed =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod("normalizeButtonActionOptionIds", JsonObject::class.java)
            .apply { isAccessible = true }
            .invoke(assistant, root) as Boolean
    return changed to root
  }

  private fun action(root: JsonObject, index: Int): JsonObject {
    val list = root.getAsJsonArray("items")[0].asJsonObject
    val buttons = list.getAsJsonObject("properties").getAsJsonArray("buttons")
    return buttons[index].asJsonObject.getAsJsonObject("action")
  }

  private fun form(vararg buttons: String): String =
      "{\"items\":[{\"className\":\"XButtonList\",\"properties\":{\"name\":\"btlNav\"," +
          "\"buttons\":[${buttons.joinToString(",")}]}}]}"

  @Test
  fun `keeps the correct machine value for a next-page button`() {
    val (changed, root) =
        normalize(
            form(
                "{\"name\":\"btnNext\",\"value\":\"Weiter\",\"action\":{\"page\":\"next\",\"check\":true,\"optionId\":\"next + check\"}}"))
    assertFalse(changed)
    assertEquals("next + check", action(root, 0).get("optionId").asString)
  }

  @Test
  fun `repairs the human display label stored as optionId`() {
    val (changed, root) =
        normalize(
            form(
                "{\"name\":\"btnNext\",\"value\":\"Weiter\",\"action\":{\"page\":\"next\",\"check\":true,\"optionId\":\"next page + check\",\"value\":\"next page + check\"}}"))
    assertTrue(changed)
    val a = action(root, 0)
    assertEquals("next + check", a.get("optionId").asString)
    // the stock default mirrors optionId into action.value — keep them consistent
    assertEquals("next + check", a.get("value").asString)
  }

  @Test
  fun `maps previous and submit actions`() {
    val (changed, root) =
        normalize(
            form(
                "{\"name\":\"btnPrev\",\"value\":\"Zurück\",\"action\":{\"page\":\"previous\",\"check\":false,\"optionId\":\"previous page\"}}",
                "{\"name\":\"btnSubmit\",\"value\":\"Senden\",\"action\":{\"page\":\"submit\",\"check\":true,\"optionId\":\"submit\"}}",
                "{\"name\":\"btnSave\",\"value\":\"Speichern\",\"action\":{\"page\":\"submitSave\",\"check\":false,\"optionId\":\"x\"}}"))
    assertTrue(changed)
    assertEquals("previous", action(root, 0).get("optionId").asString)
    assertEquals("submit + check", action(root, 1).get("optionId").asString)
    assertEquals("save + check", action(root, 2).get("optionId").asString)
  }

  @Test
  fun `treats a json boolean check as checked`() {
    val (changed, root) =
        normalize(
            form(
                "{\"name\":\"btnNext\",\"value\":\"Weiter\",\"action\":{\"page\":\"next\",\"check\":true,\"optionId\":\"next page + check\"}}"))
    assertTrue(changed)
    assertEquals("next + check", action(root, 0).get("optionId").asString)
  }

  @Test
  fun `does not introduce an optionId where none exists`() {
    val (changed, root) =
        normalize(
            form(
                "{\"name\":\"btnNext\",\"value\":\"Weiter\",\"action\":{\"page\":\"next\",\"check\":true}}"))
    assertFalse(changed)
    assertFalse(action(root, 0).has("optionId"))
  }

  @Test
  fun `leaves an empty or custom action untouched`() {
    val (changed, root) =
        normalize(
            form(
                "{\"name\":\"btnJs\",\"value\":\"Los\",\"action\":{\"page\":\"\",\"check\":false,\"customAction\":\"doIt()\",\"optionId\":\"custom\"}}"))
    assertFalse(changed)
    assertEquals("custom", action(root, 0).get("optionId").asString)
  }
}
