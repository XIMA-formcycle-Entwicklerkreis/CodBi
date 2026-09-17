package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonArray
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

/**
 * Tests for [AICodBiAssistant]'s `stripContainerPanelClasses`.
 *
 * UI.Panels panel-type CSS classes (`CodBi_HTML_Panel_Standard/Flat/Index/Minimal`,
 * `CodBi_HTML_Panel_NoCordion`) only work on an **XFieldSet** (they render the fieldset's legend as
 * the panel header). On an **XContainer / XContainerInvisible** they are INERT, so a leftover (e.g.
 * when the prompt MOVED the panel to a new outer wrapper but the original container kept its old
 * panel class) must be removed. The accordion membership classes (`CodBi_Accordion_A..D`) DO belong
 * on the wrapping container and must be kept.
 */
class FormContainerPanelClassStripTest {

  private val assistant = AICodBiAssistant()

  private fun strip(json: String): JsonArray {
    val arr = JsonParser.parseString(json).asJsonArray
    AICodBiAssistant::class
        .java
        .getDeclaredMethod("stripContainerPanelClasses", JsonArray::class.java)
        .apply { isAccessible = true }
        .invoke(assistant, arr)
    return arr
  }

  private fun classesOf(arr: JsonArray, name: String): List<String> {
    for (el in arr) {
      if (!el.isJsonObject) continue
      val obj = el.asJsonObject
      val p = obj.getAsJsonObject("properties") ?: continue
      if (p.get("name")?.asString != name) continue
      return p.getAsJsonArray("cssclasses")?.map { it.asString } ?: emptyList()
    }
    return emptyList()
  }

  private fun item(className: String, name: String, classes: String): String =
      """{"className":"$className","properties":{"name":"$name","id":"xi-$name","cssclasses":[$classes]}}"""

  @Test
  fun stripsFieldsetOnlyPanelClassFromContainer() {
    val arr =
        strip(
            """[${item("XContainer", "coOpeningHours", """"CodBi_HTML_Panel_Standard","Goon"""")}]""")
    assertEquals(listOf("Goon"), classesOf(arr, "coOpeningHours"))
  }

  @Test
  fun stripsPanelClassFromInvisibleContainer() {
    val arr = strip("""[${item("XContainerInvisible", "coX", """"CodBi_HTML_Panel_Flat"""")}]""")
    assertEquals(emptyList<String>(), classesOf(arr, "coX"))
  }

  @Test
  fun keepsAccordionClassOnContainer() {
    val arr =
        strip(
            """[${item("XContainer", "coAccordionWrapper", """"CodBi_Accordion_A","CodBi_HTML_Panel_Standard"""")}]""")
    assertEquals(listOf("CodBi_Accordion_A"), classesOf(arr, "coAccordionWrapper"))
  }

  @Test
  fun keepsPanelClassOnFieldset() {
    val arr = strip("""[${item("XFieldSet", "fsInhalt", """"CodBi_HTML_Panel_Standard"""")}]""")
    assertEquals(listOf("CodBi_HTML_Panel_Standard"), classesOf(arr, "fsInhalt"))
  }
}
