package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests for [AICodBiAssistant]'s OpenPLZ address repair, which CREATES the missing `tfStrasse` /
 * `tfHausnummer` fields AFTER the AI has produced its form.
 *
 * A street and its house number belong on ONE line, and Formcycle renders siblings side by side
 * only when they carry the SAME `rowid` - a field without a rowid spans a complete line of its own.
 * The AI never sees these server-created fields, so the repair has to group them itself.
 */
class OpenPlzAddressRowGroupingTest {

  private val assistant = AICodBiAssistant()

  private val base =
      JsonParser.parseString(
              """{"XTextField":{"properties":{"name":"","id":"","label":"","required":"0","fullwidth":"0"}}}""")
          .asJsonObject

  private fun apply(json: String): JsonArray {
    val arr = JsonParser.parseString(json).asJsonArray
    AICodBiAssistant::class
        .java
        .getDeclaredMethod(
            "applyOpenPlzAddressClasses", JsonArray::class.java, JsonObject::class.java)
        .apply { isAccessible = true }
        .invoke(assistant, arr, base)
    return arr
  }

  private fun item(arr: JsonArray, name: String): JsonObject? =
      arr.map { it.asJsonObject }
          .firstOrNull { it.getAsJsonObject("properties")?.get("name")?.asString == name }

  private fun rowidOf(arr: JsonArray, name: String): String? =
      item(arr, name)
          ?.getAsJsonObject("properties")
          ?.get("rowid")
          ?.takeIf { it.isJsonPrimitive }
          ?.asString

  private fun containerElements(arr: JsonArray): List<String> =
      item(arr, "coAddress")?.getAsJsonObject("properties")?.getAsJsonArray("elements")?.map {
        it.asString
      } ?: emptyList()

  /** A PLZ + Ort address group without any street / house-number field. */
  private fun addressGroup(extraItems: String = "", extraElements: String = ""): String =
      """[{"className":"XContainer","properties":{"name":"coAddress","id":"xi-co-address","elements":["tfPLZ","tfOrt"$extraElements]}},""" +
          """{"className":"XTextField","properties":{"name":"tfPLZ","id":"xi-tf-plz","parentid":"xi-co-address","cssclasses":["CodBi_OpenPLZ_AC_SET_PLZ"]}},""" +
          """{"className":"XTextField","properties":{"name":"tfOrt","id":"xi-tf-ort","parentid":"xi-co-address","cssclasses":["CodBi_OpenPLZ_AC_SET_Locality"]}}""" +
          (if (extraItems.isEmpty()) "]" else ",$extraItems]")

  @Test
  fun createsTheStreetHouseNumberPairOnOneSharedRow() {
    val arr = apply(addressGroup())
    val street = rowidOf(arr, "tfStrasse")
    assertNotNull(street, "the created street field must be grouped into a row")
    assertEquals(
        street, rowidOf(arr, "tfHausnummer"), "street and house number must share ONE rowid")
    assertTrue(containerElements(arr).containsAll(listOf("tfStrasse", "tfHausnummer")))
  }

  @Test
  fun groupsAnExistingStreetFieldWithoutARowidIntoTheSameRow() {
    val arr =
        apply(
            addressGroup(
                extraItems =
                    """{"className":"XTextField","properties":{"name":"tfStrasse","id":"xi-tf-strasse","parentid":"xi-co-address","cssclasses":["CodBi_OpenPLZ_AC_SET_Street"]}}""",
                extraElements = ""","tfStrasse""""))
    val street = rowidOf(arr, "tfStrasse")
    assertNotNull(street, "the existing street field must be pulled into the row")
    assertEquals(street, rowidOf(arr, "tfHausnummer"))
  }

  @Test
  fun joinsTheRowAnAlreadyGroupedFieldBelongsTo() {
    // The existing street field is already grouped on row-7; the created house number must join it
    // instead of starting a second row (which would split the pair again).
    val arr =
        apply(
            addressGroup(
                extraItems =
                    """{"className":"XTextField","properties":{"name":"tfStrasse","id":"xi-tf-strasse","parentid":"xi-co-address","rowid":"row-7","cssclasses":["CodBi_OpenPLZ_AC_SET_Street"]}}""",
                extraElements = ""","tfStrasse""""))
    assertEquals("row-7", rowidOf(arr, "tfStrasse"))
    assertEquals("row-7", rowidOf(arr, "tfHausnummer"))
  }

  @Test
  fun neverReusesARowidThatIsAlreadyTakenElsewhere() {
    val arr =
        apply(
            """[{"className":"XContainer","properties":{"name":"coAddress","id":"xi-co-address","elements":["tfPLZ","tfOrt"]}},""" +
                """{"className":"XTextField","properties":{"name":"tfPLZ","id":"xi-tf-plz","parentid":"xi-co-address","cssclasses":["CodBi_OpenPLZ_AC_SET_PLZ"]}},""" +
                """{"className":"XTextField","properties":{"name":"tfOrt","id":"xi-tf-ort","parentid":"xi-co-address","cssclasses":["CodBi_OpenPLZ_AC_SET_Locality"]}},""" +
                """{"className":"XTextField","properties":{"name":"tfVorname","id":"xi-tf-vorname","parentid":"xi-co-address","rowid":"row-1"}}]""")
    val street = rowidOf(arr, "tfStrasse")
    assertNotNull(street)
    assertTrue(street != "row-1", "the new row must not collide with an existing rowid")
    assertEquals(street, rowidOf(arr, "tfHausnummer"))
  }

  @Test
  fun leavesACompleteAddressGroupUntouched() {
    val arr =
        apply(
            addressGroup(
                extraItems =
                    """{"className":"XTextField","properties":{"name":"tfStrasse","id":"xi-tf-strasse","parentid":"xi-co-address","cssclasses":["CodBi_OpenPLZ_AC_SET_Street"]}},""" +
                        """{"className":"XTextField","properties":{"name":"tfHausnummer","id":"xi-tf-hausnummer","parentid":"xi-co-address","cssclasses":["CodBi_OpenPLZ_AC_SET_BuildingNumber"]}}""",
                extraElements = ""","tfStrasse","tfHausnummer""""))
    // Nothing is created, so the repair must not invent a row for a complete group.
    assertNull(rowidOf(arr, "tfStrasse"))
    assertNull(rowidOf(arr, "tfHausnummer"))
  }
}
