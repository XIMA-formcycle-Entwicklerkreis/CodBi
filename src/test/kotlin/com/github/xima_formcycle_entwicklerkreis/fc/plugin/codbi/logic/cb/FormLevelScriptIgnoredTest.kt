package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import java.lang.reflect.Method
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

/**
 * Verifies that the AI can NOT get JavaScript into the FORM itself:
 * - the top-level Formcycle CodingPanel fields `script` / `css` are stripped, so an AI-emitted
 *   `script` never reaches the persisted form (the original one is preserved), and
 * - a stale top-level `_customScript` marker (the removed form-level-JS marker — JavaScript now
 *   lives on the element that supports it) is IGNORED instead of being copied into the form JSON.
 *
 * Both form assistants carry a mirror-image `restoreStrippedFields`, so both are covered.
 */
class FormLevelScriptIgnoredTest {

  private val original = """{"lang":"de","script":"/* original-form-js */","items":[]}"""
  private val aiResult =
      """{"lang":"de","script":"evil();","_customScript":"alert(1);","items":[]}"""

  @Test
  fun formAssistantDropsFormLevelScriptAndStaleMarker() {
    val out = invoke(AIFormAssistant(), 2, aiResult, original)
    assertFalse(out.contains("_customScript"), "stale marker must not be persisted: $out")
    assertFalse(out.contains("alert(1)"), "stale form-level JS must not be persisted: $out")
    assertFalse(out.contains("evil()"), "AI must not write the form-level script: $out")
    assertTrue(
        out.contains("/* original-form-js */"),
        "the original form-level script must be preserved: $out")
  }

  @Test
  fun unifiedAssistantDropsFormLevelScriptAndStaleMarker() {
    val out = invoke(AICodBiAssistant(), 3, aiResult, original, "")
    assertFalse(out.contains("_customScript"), "stale marker must not be persisted: $out")
    assertFalse(out.contains("alert(1)"), "stale form-level JS must not be persisted: $out")
    assertFalse(out.contains("evil()"), "AI must not write the form-level script: $out")
    assertTrue(
        out.contains("/* original-form-js */"),
        "the original form-level script must be preserved: $out")
  }

  /** Reflectively calls the private `restoreStrippedFields` (arg count differs per assistant). */
  private fun invoke(assistant: Any, argCount: Int, vararg args: String): String {
    val types = Array(argCount) { String::class.java }
    val method: Method =
        assistant.javaClass.getDeclaredMethod("restoreStrippedFields", *types).apply {
          isAccessible = true
        }
    return method.invoke(assistant, *args) as String
  }
}
