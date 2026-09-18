package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonArray
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests for [AICodBiAssistant]'s `normalizeRowIds` guard.
 *
 * Formcycle renders every field that carries the same `rowid` together in ONE row (placed in the
 * container of the first carrier). A rowid groups RELATED fields (first+last name, street+house
 * number, PLZ+city, e-mail+phone) — between two and four of them, never more. The AI sometimes
 * copies a field's rowid (very often the default "0" of the applicant name pair) onto unrelated
 * fields, merging them all into one row that appears in the wrong container. The guard must keep a
 * rowid only for a single container holding a valid group (two to four fields) that shares one line
 * without pulling fields into another container.
 */
class FormRowidNormalizationTest {

  private val assistant = AICodBiAssistant()

  private fun normalize(json: String): JsonArray {
    val arr = JsonParser.parseString(json).asJsonArray
    AICodBiAssistant::class
        .java
        .getDeclaredMethod("normalizeRowIds", JsonArray::class.java)
        .apply { isAccessible = true }
        .invoke(assistant, arr)
    return arr
  }

  private fun rowidOf(arr: JsonArray, name: String): String? =
      arr.map { it.asJsonObject }
          .firstOrNull { it.getAsJsonObject("properties")?.get("name")?.asString == name }
          ?.getAsJsonObject("properties")
          ?.get("rowid")
          ?.takeIf { it.isJsonPrimitive }
          ?.asString

  private fun field(name: String, parent: String, rowid: String?): String {
    val row = if (rowid == null) "" else ""","rowid":"$rowid""""
    return """{"className":"XTextField","properties":{"name":"$name","parentid":"$parent"$row}}"""
  }

  @Test
  fun keepsTheTwoPairedFieldsOfOneContainer() {
    val arr = normalize("""[${field("a", "coApplicant", "0")},${field("b", "coApplicant", "0")}]""")
    assertEquals("0", rowidOf(arr, "a"))
    assertEquals("0", rowidOf(arr, "b"))
  }

  @Test
  fun keepsTheFirstGroupAndDetachesTheOthersWhenSharedAcrossContainers() {
    // Reproduces the regression: the applicant pair and the business fields all carry rowid "0".
    val arr =
        normalize(
            """[${field("firstName", "coApplicant", "0")},${field("lastName", "coApplicant", "0")},""" +
                """${field("businessName", "coBusiness", "0")},${field("street", "coBusiness", "0")},""" +
                """${field("plz", "coBusiness", "0")}]""")
    // The group in the FIRST container keeps the original row ...
    assertEquals("0", rowidOf(arr, "firstName"))
    assertEquals("0", rowidOf(arr, "lastName"))
    // ... the other container is detached onto a FRESH row of its own, so its fields keep sharing
    // one line WITHOUT being pulled into the first container's row (no merged mega-row).
    val detached = rowidOf(arr, "businessName")
    assertEquals(detached, rowidOf(arr, "street"))
    assertEquals(detached, rowidOf(arr, "plz"))
    assertTrue(detached != null && detached != "0", "the detached group must get a fresh rowid")
  }

  @Test
  fun keepsThreeRelatedFieldsOfOneContainer() {
    // Three related fields still share ONE line (e.g. first + middle + last name).
    val arr =
        normalize(
            """[${field("x", "coBusiness", "0")},${field("y", "coBusiness", "0")},${field("z", "coBusiness", "0")}]""")
    assertEquals("0", rowidOf(arr, "x"))
    assertEquals("0", rowidOf(arr, "y"))
    assertEquals("0", rowidOf(arr, "z"))
  }

  @Test
  fun keepsFourRelatedFieldsOfOneContainer() {
    // Four fields is the maximum for one line (e.g. street + house number + PLZ + city).
    val arr =
        normalize(
            """[${field("a", "coAddress", "0")},${field("b", "coAddress", "0")},""" +
                """${field("c", "coAddress", "0")},${field("d", "coAddress", "0")}]""")
    assertEquals("0", rowidOf(arr, "a"))
    assertEquals("0", rowidOf(arr, "b"))
    assertEquals("0", rowidOf(arr, "c"))
    assertEquals("0", rowidOf(arr, "d"))
  }

  @Test
  fun clearsRowidWhenMoreThanFourFieldsOfOneContainerShareIt() {
    // More than four fields on ONE line is unreadable - the cap splits them onto separate lines.
    val arr =
        normalize(
            """[${field("a", "coAddress", "0")},${field("b", "coAddress", "0")},""" +
                """${field("c", "coAddress", "0")},${field("d", "coAddress", "0")},""" +
                """${field("e", "coAddress", "0")}]""")
    assertNull(rowidOf(arr, "a"))
    assertNull(rowidOf(arr, "b"))
    assertNull(rowidOf(arr, "c"))
    assertNull(rowidOf(arr, "d"))
    assertNull(rowidOf(arr, "e"))
  }

  @Test
  fun leavesDistinctRowsUntouched() {
    val arr =
        normalize(
            """[${field("firstName", "coApplicant", "row-1")},${field("lastName", "coApplicant", "row-1")},""" +
                """${field("plz", "coBusiness", "row-2")},${field("city", "coBusiness", "row-2")}]""")
    assertEquals("row-1", rowidOf(arr, "firstName"))
    assertEquals("row-1", rowidOf(arr, "lastName"))
    assertEquals("row-2", rowidOf(arr, "plz"))
    assertEquals("row-2", rowidOf(arr, "city"))
  }

  @Test
  fun reassignsAFreshRowidForAPairInAnotherContainer() {
    // A move can make two containers each hold a VALID pair with the SAME rowid. Both pairs must
    // survive (no split) - the second one gets a fresh, collision-free rowid instead of being
    // cleared.
    val arr =
        normalize(
            """[${field("firstName", "coApplicant", "row-1")},${field("lastName", "coApplicant", "row-1")},""" +
                """${field("plz", "coBusiness", "row-1")},${field("city", "coBusiness", "row-1")}]""")
    assertEquals("row-1", rowidOf(arr, "firstName"))
    assertEquals("row-1", rowidOf(arr, "lastName"))
    val plz = rowidOf(arr, "plz")
    val city = rowidOf(arr, "city")
    assertEquals(plz, city, "the second pair must stay paired")
    assertTrue(
        plz != null && plz != "row-1", "the second pair must get a fresh, collision-free rowid")
  }
}
