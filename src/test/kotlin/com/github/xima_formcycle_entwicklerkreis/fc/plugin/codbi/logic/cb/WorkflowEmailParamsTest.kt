package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

/**
 * Tests for [AICodBiAssistant]'s `workflowParamString` coercion.
 *
 * The workflow AI sometimes emits a scalar node parameter (e.g. an FC_EMAIL recipient "to") as a
 * JSON ARRAY - `["Amt@Ansbach.de"]` - which a plain `as? String` cast drops to an empty value,
 * leaving the mail with NO recipient. The coercion must accept a String and join a List into a
 * single comma-separated string.
 */
class WorkflowEmailParamsTest {

  private val assistant = AICodBiAssistant()

  private fun paramString(params: Map<String, Any>, key: String): String =
      AICodBiAssistant::class
          .java
          .getDeclaredMethod("workflowParamString", Map::class.java, String::class.java)
          .apply { isAccessible = true }
          .invoke(assistant, params, key) as String

  @Test
  fun acceptsPlainString() {
    assertEquals("Amt@Ansbach.de", paramString(mapOf("to" to "Amt@Ansbach.de"), "to"))
  }

  @Test
  fun joinsSingleElementArrayAsTheAiEmitsIt() {
    assertEquals("Amt@Ansbach.de", paramString(mapOf("to" to listOf("Amt@Ansbach.de")), "to"))
  }

  @Test
  fun joinsMultipleArrayEntries() {
    assertEquals("a@b.de, c@d.de", paramString(mapOf("to" to listOf("a@b.de", "c@d.de")), "to"))
  }

  @Test
  fun trimsAndDropsBlankEntries() {
    assertEquals(
        "a@b.de, c@d.de", paramString(mapOf("to" to listOf(" a@b.de ", "", "  ", "c@d.de")), "to"))
  }

  @Test
  fun emptyWhenMissingOrNotATextValue() {
    assertEquals("", paramString(emptyMap(), "to"))
    assertEquals("", paramString(mapOf("to" to 42), "to"))
  }
}
