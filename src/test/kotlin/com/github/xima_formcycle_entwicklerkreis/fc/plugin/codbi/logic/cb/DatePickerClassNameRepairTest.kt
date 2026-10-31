package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonObject
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Regression for the "Füge zwei Datumsfelder ein die einen Zeitrahmen abbilden." run.
 *
 * The model emitted the NON-EXISTENT widget `XDatePicker` (Formcycle has no such className; a date
 * field is an `XTextField` with `datatype` "dateDE"/"date"). [AICodBiAssistant]'
 * `sanitizeAiFormItems` drops every item with an unknown className, so BOTH date fields vanished
 * and the run produced nothing at all — even though the requested CodBi wiring
 * (`CodBi_DateFrame_1_Begin` + `CodBi_DateFrame_1_End`) was already correct. The canonicalization
 * must convert such an item into a real date field and keep everything else (id, label, cssclasses,
 * container references).
 */
class DatePickerClassNameRepairTest {

  private val assistant = AICodBiAssistant()

  private fun sanitize(itemsJson: String): JsonObject {
    val root = JsonParser.parseString(itemsJson).asJsonObject
    val method =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod("sanitizeAiFormItems", JsonObject::class.java)
    method.isAccessible = true
    method.invoke(assistant, root)
    return root
  }

  private fun JsonObject.name(): String = getAsJsonObject("properties")?.get("name")?.asString ?: ""

  @Test
  fun `an invented XDatePicker becomes an XTextField date field instead of being dropped`() {
    val root =
        sanitize(
            """
            {"items":[
              {"className":"XPage","properties":{"name":"p1","id":"xi-p-1",
                "elements":["tfStartDatum","tfEndDatum"]}},
              {"className":"XDatePicker","properties":{"name":"tfStartDatum","id":"xi-start-datum",
                "label":"Startdatum","datatype":"date","cssclasses":["CodBi_DateFrame_1_Begin"]}},
              {"className":"XDatePicker","properties":{"name":"tfEndDatum","id":"xi-end-datum",
                "label":"Enddatum","cssclasses":["CodBi_DateFrame_1_End"]}}
            ]}
            """
                .trimIndent())

    val items = root.getAsJsonArray("items")
    assertEquals(3, items.size(), "no item may be dropped: $root")

    val names = items.map { it.asJsonObject.name() }
    assertTrue("tfStartDatum" in names, "the start date field must survive: $names")
    assertTrue("tfEndDatum" in names, "the end date field must survive: $names")

    for (el in items) {
      val o = el.asJsonObject
      if (o.get("className").asString == "XPage") continue
      assertEquals("XTextField", o.get("className").asString, "wrong className: $o")
      val datatype = o.getAsJsonObject("properties").get("datatype").asString
      assertTrue(datatype.startsWith("date"), "datatype must stay a date type: $o")
    }

    // The CodBi frame wiring must be preserved on both fields ...
    val start = items.map { it.asJsonObject }.first { it.name() == "tfStartDatum" }
    val end = items.map { it.asJsonObject }.first { it.name() == "tfEndDatum" }
    assertTrue(
        start.getAsJsonObject("properties").toString().contains("CodBi_DateFrame_1_Begin"),
        "start field must keep its CodBi_DateFrame_1_Begin class: $start")
    assertTrue(
        end.getAsJsonObject("properties").toString().contains("CodBi_DateFrame_1_End"),
        "end field must keep its CodBi_DateFrame_1_End class: $end")
    assertEquals("xi-start-datum", start.getAsJsonObject("properties").get("id").asString)

    // ... and the page must still reference both fields (no dangling-reference pruning).
    val page = items.map { it.asJsonObject }.first { it.get("className").asString == "XPage" }
    val elements = page.getAsJsonObject("properties").getAsJsonArray("elements")
    assertEquals(2, elements.size(), "container references must not be pruned: $page")
  }

  @Test
  fun `a real XTextField date field is left untouched`() {
    val root =
        sanitize(
            """
            {"items":[
              {"className":"XTextField","properties":{"name":"tfGeburtsdatum","id":"xi-tf-geburtsdatum",
                "label":"Geburtsdatum","datatype":"dateDE","cssclasses":["CodBi_NoFutureDate"]}}
            ]}
            """
                .trimIndent())
    val item = root.getAsJsonArray("items").first().asJsonObject
    assertEquals("XTextField", item.get("className").asString)
    assertEquals("dateDE", item.getAsJsonObject("properties").get("datatype").asString)
  }

  @Test
  fun `other unknown classNames are still dropped`() {
    val root =
        sanitize(
            """
            {"items":[
              {"className":"XBananaWidget","properties":{"name":"tfBanane","id":"xi-tf-banane"}}
            ]}
            """
                .trimIndent())
    val items = root.getAsJsonArray("items")
    assertFalse(
        items.map { it.asJsonObject.get("className").asString }.contains("XBananaWidget"),
        "a genuinely unknown className must still be dropped: $root")
  }
}
