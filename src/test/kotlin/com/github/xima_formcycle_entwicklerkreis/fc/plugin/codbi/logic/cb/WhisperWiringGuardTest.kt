package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * SAFETY NET test for [AICodBiAssistant.stripUnavailableWhisperWiring]: when local Whisper is NOT
 * enabled on the installation, the generated form must not keep any Whisper wiring the model placed
 * on a field — the `Media.Input.Speech.Whisper` functionality from `data-cb-func` and the
 * `CodBi_XCL_Speech_Whisper` exclusion class from `cssclasses`. An unavailable backend cannot
 * produce a working mic, so persisting that wiring only yields a silently broken field. The
 * always-available Web Speech API (`Media.Input.Speech`) must be left untouched.
 *
 * Note: the function itself does not re-check [AI.isWhisperEnabled] — the caller
 * (`sanitizeAiFormItems`) only invokes it when Whisper is unavailable — so this test can exercise
 * it directly via reflection.
 */
class WhisperWiringGuardTest {

  private val assistant = AICodBiAssistant()

  /**
   * Invokes the private [AICodBiAssistant.stripUnavailableWhisperWiring] on [json] and returns the
   * fixed count.
   */
  private fun strip(json: String): Pair<Int, JsonArray> {
    val root = JsonParser.parseString(json).asJsonObject
    val items = root.getAsJsonArray("items")
    val method =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod("stripUnavailableWhisperWiring", JsonArray::class.java)
    method.isAccessible = true
    val fixed = method.invoke(assistant, items) as Int
    return fixed to root.getAsJsonArray("items")
  }

  private fun readCbFunc(item: JsonObject): String? {
    val attrs = item.getAsJsonObject("properties").getAsJsonArray("attributes")
    for (el in attrs) {
      val attr = el.asJsonObject
      if (attr.get("text")?.asString == "data-cb-func") return attr.get("value")?.asString
    }
    return null
  }

  private fun cssClasses(item: JsonObject): List<String> {
    val arr = item.getAsJsonObject("properties").getAsJsonArray("cssclasses")
    return arr.mapNotNull { it.takeIf { e -> e.isJsonPrimitive }?.asString }
  }

  @Test
  fun `whisper functionality and XCL class are stripped, web speech api is kept`() {
    val json =
        """
        {
          "items": [
            {
              "className": "XTextField",
              "properties": {
                "name": "speechField",
                "cssclasses": ["CodBi_XCL_Speech_Whisper", "my-style"],
                "attributes": [
                  {"text": "data-cb-func", "value": "Media.Input.Speech.Whisper"}
                ]
              }
            },
            {
              "className": "XTextField",
              "properties": {
                "name": "normalField",
                "attributes": [
                  {"text": "data-cb-func", "value": "Media.Input.Speech"}
                ]
              }
            }
          ]
        }
        """
            .trimIndent()

    val (fixed, items) = strip(json)

    assertEquals(1, fixed, "exactly the Whisper-wired field must be cleaned")
    val whisperField = items[0].asJsonObject
    assertTrue(
        readCbFunc(whisperField) == null,
        "the Whisper functionality must be removed from data-cb-func")
    assertEquals(
        listOf("my-style"), cssClasses(whisperField), "the Whisper XCL class must be removed")

    // The Web Speech API functionality is always available and must be preserved.
    val normalField = items[1].asJsonObject
    assertEquals(
        "Media.Input.Speech",
        readCbFunc(normalField),
        "the browser Web Speech API wiring must be left untouched")
  }

  @Test
  fun `whisper removed from a mixed data-cb-func list and nested plain attribute key`() {
    // Models sometimes put the attribute under the "name" key before normalization; the guard must
    // also read the standard "text" key and only drop the Whisper segment from a comma list.
    val json =
        """
        {
          "items": [
            {
              "className": "XTextField",
              "properties": {
                "name": "mixed",
                "cssclasses": ["CodBi_XCL_Speech_Whisper", "CodBi_XCL_Speech"],
                "attributes": [
                  {"text": "data-cb-func", "value": "Media.Input.Speech.Whisper,Media.Input.Speech"}
                ]
              }
            }
          ]
        }
        """
            .trimIndent()

    val (fixed, items) = strip(json)

    assertEquals(1, fixed)
    val field = items[0].asJsonObject
    assertEquals(
        "Media.Input.Speech",
        readCbFunc(field),
        "only the Whisper segment must be dropped from the comma list")
    assertEquals(
        listOf("CodBi_XCL_Speech"),
        cssClasses(field),
        "only the Whisper exclusion class must be dropped, the Web Speech XCL class stays")
  }

  @Test
  fun `untouched form yields a zero count`() {
    val json =
        """
        {
          "items": [
            {
              "className": "XTextField",
              "properties": {
                "name": "plain",
                "attributes": [{"text": "data-cb-func", "value": "Media.Input.Speech"}]
              }
            }
          ]
        }
        """
            .trimIndent()

    val (fixed, _) = strip(json)
    assertEquals(0, fixed)
  }

  @Test
  fun `speech availability note is non-empty only when whisper is unavailable`() {
    val method = AICodBiAssistant::class.java.getDeclaredMethod("speechAvailabilityNote")
    method.isAccessible = true
    val note = { method.invoke(assistant) as String }

    // Whisper enabled: the note must be empty (nothing to relay to the AI).
    val previous = AI.whisperEnabled
    try {
      AI.whisperEnabled = true
      assertEquals("", note(), "with Whisper available the note must be empty")

      // Whisper unavailable: the note must instruct the AI to prefer the available Web Speech API.
      AI.whisperEnabled = false
      val text = note()
      assertTrue(text.isNotBlank(), "with Whisper unavailable the note must be non-empty")
      assertTrue(
          text.contains("Media.Input.Speech.Whisper"),
          "the note must name the unavailable Whisper functionality, so the AI knows what to avoid")
      assertTrue(
          text.contains("Media.Input.Speech"),
          "the note must point to the always-available browser Web Speech API")
      // Round 4: local Whisper must NEVER be offered as a selectable option — not even flagged as
      // "may not function".
      assertTrue(
          text.contains("NEVER present \"use local Whisper\""),
          "the note must forbid offering local Whisper as a selectable option")
      // the note explicitly rules out even a "may not function" fallback for local Whisper:
      assertTrue(
          text.contains("\"may not function\""),
          "the note must explicitly exclude local Whisper even as a 'may not function' fallback")
      // Round 4: every question/message must be written in the user's latest prompt language.
      assertTrue(
          text.contains("EXACT SAME language as the user's latest prompt"),
          "the note must force the AI to reply in the user's prompt language")
      // Round 4: already-answered speech questions (e.g. "normales Textfeld") must not be re-asked.
      assertTrue(
          text.contains("NOT RE-ASKING"),
          "the note must tell the AI not to re-ask already-answered speech questions")
    } finally {
      AI.whisperEnabled = previous
    }
  }
}
