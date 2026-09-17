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
 * container of the first carrier). The AI sometimes copies a field's rowid (very often the default
 * "0" of the applicant name pair) onto unrelated fields, merging them all into one row that appears
 * in the wrong container. The guard must keep a rowid only for a single container holding exactly
 * the two paired fields and clear it from every other carrier.
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
  fun keepsPairOnlyForOneContainerWhenSharedAcrossContainers() {
    // Reproduces the regression: the applicant pair and the business fields all carry rowid "0".
    val arr =
        normalize(
            """[${field("firstName", "coApplicant", "0")},${field("lastName", "coApplicant", "0")},""" +
                """${field("businessName", "coBusiness", "0")},${field("street", "coBusiness", "0")},""" +
                """${field("plz", "coBusiness", "0")}]""")
    // The pair in the FIRST container holding exactly two fields keeps its row ...
    assertEquals("0", rowidOf(arr, "firstName"))
    assertEquals("0", rowidOf(arr, "lastName"))
    // ... every other carrier is cleared so it spans its own line (no merged mega-row).
    assertNull(rowidOf(arr, "businessName"))
    assertNull(rowidOf(arr, "street"))
    assertNull(rowidOf(arr, "plz"))
  }

  @Test
  fun clearsRowidWhenMoreThanTwoFieldsOfOneContainerShareIt() {
    val arr =
        normalize(
            """[${field("x", "coBusiness", "0")},${field("y", "coBusiness", "0")},${field("z", "coBusiness", "0")}]""")
    assertNull(rowidOf(arr, "x"))
    assertNull(rowidOf(arr, "y"))
    assertNull(rowidOf(arr, "z"))
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
