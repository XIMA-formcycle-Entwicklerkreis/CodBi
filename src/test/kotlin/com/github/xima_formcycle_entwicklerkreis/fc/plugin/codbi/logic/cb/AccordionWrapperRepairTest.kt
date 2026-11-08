package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

/**
 * Tests for [AICodBiAssistant.addMissingWrapperAccordion].
 *
 * Reported case: "Füge zwei panels ein von denen nur eines gleichzeitig aufgeklappt sein kann." —
 * the finished form contained `fdPanelOne` and `fdPanelTwo`, both carrying
 * `data-cb-Accordion="myAccordion"`, while the wrapping `fdAccordionWrapper` carried NO attribute
 * at all. The repeated set name alone joins nothing, so the two panels unfolded independently and
 * the form had no accordion. The repair must add the missing `HTML.Panel.Accordion` to the wrapper.
 */
class AccordionWrapperRepairTest {

  private val assistant = AICodBiAssistant()

  private fun arr(json: String): JsonArray = JsonParser.parseString(json).asJsonArray

  private fun propsOf(arr: JsonArray, name: String): JsonObject {
    for (el in arr) {
      if (!el.isJsonObject) continue
      val p = el.asJsonObject.getAsJsonObject("properties") ?: continue
      if (p.get("name")?.asString == name) return p
    }
    error("item '$name' not found")
  }

  private fun attrOf(props: JsonObject, key: String): String? {
    val attrs = props.getAsJsonArray("attributes") ?: return null
    for (e in attrs) {
      if (!e.isJsonObject) continue
      val o = e.asJsonObject
      if (o.get("text")?.asString.equals(key, ignoreCase = true)) return o.get("value")?.asString
    }
    return null
  }

  private fun member(name: String, group: String, directKey: Boolean = false): String =
      if (directKey) {
        """{"className":"XContainer","properties":{"name":"$name","data-cb-Accordion":"$group"}}"""
      } else {
        """{"className":"XContainer","properties":{"name":"$name","attributes":[{"text":"data-cb-Accordion","value":"$group"}]}}"""
      }

  private fun wrapper(
      name: String,
      children: List<String>,
      classes: List<String> = emptyList(),
      extraAttrs: String = "",
  ): String {
    val cls = classes.joinToString(",") { "\"$it\"" }
    val attrs = if (extraAttrs.isBlank()) "" else ",\"attributes\":[$extraAttrs]"
    val elems = children.joinToString(",") { "\"$it\"" }
    return """{"className":"XContainer","properties":{"name":"$name","id":"xi-$name","elements":[$elems],"cssclasses":[$cls]$attrs}}"""
  }

  private fun form(vararg items: String): JsonArray = arr("[" + items.joinToString(",") + "]")

  @Test
  fun addsTheAccordionToTheWrapperWhenOnlyTheMembersDeclareIt() {
    val a =
        form(
            wrapper("fdAccordionWrapper", listOf("fdPanelOne", "fdPanelTwo")),
            member("fdPanelOne", "myAccordion"),
            member("fdPanelTwo", "myAccordion"))
    assertEquals(1, assistant.addMissingWrapperAccordion(a))
    val wrapperProps = propsOf(a, "fdAccordionWrapper")
    assertEquals("HTML.Panel.Accordion", attrOf(wrapperProps, "data-cb-func"))
    assertEquals("myAccordion", attrOf(wrapperProps, "data-cb-Accordion"))
  }

  @Test
  fun copiesTheSetNameVerbatimAlsoFromDirectPropertyKeys() {
    val a =
        form(
            wrapper("wrap", listOf("p1", "p2")),
            member("p1", "gruen", directKey = true),
            member("p2", "gruen", directKey = true))
    assertEquals(1, assistant.addMissingWrapperAccordion(a))
    assertEquals("gruen", attrOf(propsOf(a, "wrap"), "data-cb-Accordion"))
  }

  @Test
  fun leavesAWrapperThatAlreadyCarriesTheAccordionClassUntouched() {
    val a =
        form(
            wrapper("wrap", listOf("p1", "p2"), classes = listOf("CodBi_Accordion_A")),
            member("p1", "CodBi_Accordion_Set_A"),
            member("p2", "CodBi_Accordion_Set_A"))
    assertEquals(0, assistant.addMissingWrapperAccordion(a))
    assertNull(attrOf(propsOf(a, "wrap"), "data-cb-func"))
  }

  @Test
  fun leavesAWrapperThatAlreadyCarriesTheAccordionFunctionUntouched() {
    val existing =
        "{\"text\":\"data-cb-func\",\"value\":\"HTML.Panel.Accordion\"}," +
            "{\"text\":\"data-cb-Accordion\",\"value\":\"s1\"}"
    val a =
        form(
            wrapper("wrap", listOf("p1", "p2"), extraAttrs = existing),
            member("p1", "s1"),
            member("p2", "s1"))
    assertEquals(0, assistant.addMissingWrapperAccordion(a))
    assertEquals("s1", attrOf(propsOf(a, "wrap"), "data-cb-Accordion"))
  }

  @Test
  fun doesNothingWhenTheMembersDisagreeOnTheSetName() {
    val a = form(wrapper("wrap", listOf("p1", "p2")), member("p1", "eins"), member("p2", "zwei"))
    assertEquals(0, assistant.addMissingWrapperAccordion(a))
    assertNull(attrOf(propsOf(a, "wrap"), "data-cb-func"))
  }

  @Test
  fun doesNothingWithoutAccordionMembers() {
    val a =
        form(
            wrapper("wrap", listOf("tfName", "tfMail")),
            "{\"className\":\"XTextField\",\"properties\":{\"name\":\"tfName\"}}",
            "{\"className\":\"XTextField\",\"properties\":{\"name\":\"tfMail\"}}")
    assertEquals(0, assistant.addMissingWrapperAccordion(a))
    assertFalse(propsOf(a, "wrap").has("attributes"))
  }
}
