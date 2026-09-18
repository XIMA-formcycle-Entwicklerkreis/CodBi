package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonArray
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests for [AICodBiAssistant]'s `applyNewDatasourceSelectGuards` (NEW-item datasource validation +
 * duplicate-NEW-datasource-select removal) and the shared `truncateForLog` log guard.
 *
 * The guard is invoked reflectively here, matching the existing test style in this package
 * ([DatasourceMatchingTest], [FormRowidNormalizationTest]). Only elements NEW in the current run
 * are ever touched; pre-existing elements are preserved verbatim (the absolute preserve rule).
 */
class DatasourceSelectGuardsTest {

  private val assistant = AICodBiAssistant()

  private fun guard(formJson: String, originalJson: String, available: List<String>): String {
    return AICodBiAssistant::class
        .java
        .getDeclaredMethod(
            "applyNewDatasourceSelectGuards",
            String::class.java,
            String::class.java,
            List::class.java)
        .apply { isAccessible = true }
        .invoke(assistant, formJson, originalJson, available) as String
  }

  // ---- JSON fixtures -------------------------------------------------------------------------

  private fun quote(value: String): String =
      "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\""

  private fun select(
      name: String,
      datasource: String? = null,
      dstextidx: String? = null,
      dsvalueidx: String? = null,
      label: String? = null
  ): String {
    val props = mutableListOf<String>()
    props.add("\"name\":${quote(name)}")
    if (datasource != null) props.add("\"datasource\":${quote(datasource)}")
    if (dstextidx != null) props.add("\"dstextidx\":$dstextidx")
    if (dsvalueidx != null) props.add("\"dsvalueidx\":$dsvalueidx")
    if (label != null) props.add("\"label\":${quote(label)}")
    return """{"className":"XSelect","properties":{${props.joinToString(",")}}}"""
  }

  private fun page(name: String, elements: List<String>): String =
      """{"className":"XPage","properties":{"name":${quote(name)},"elements":[${
          elements.joinToString(",") { quote(it) }
      }]}}"""

  private fun form(vararg items: String): String = """{"items":[${items.joinToString(",")}]}"""

  private fun items(json: String): JsonArray =
      JsonParser.parseString(json).asJsonObject.getAsJsonArray("items")

  private fun itemNames(json: String): List<String> =
      items(json).mapNotNull {
        if (it.isJsonObject)
            it.asJsonObject
                .getAsJsonObject("properties")
                ?.get("name")
                ?.takeIf { n -> n.isJsonPrimitive }
                ?.asString
        else null
      }

  private fun datasourceOf(json: String, name: String): String? =
      items(json)
          .map { it.asJsonObject }
          .firstOrNull { it.getAsJsonObject("properties")?.get("name")?.asString == name }
          ?.getAsJsonObject("properties")
          ?.get("datasource")
          ?.takeIf { it.isJsonPrimitive }
          ?.asString

  private fun elementsOf(json: String, container: String): List<String> =
      items(json)
          .map { it.asJsonObject }
          .firstOrNull { it.getAsJsonObject("properties")?.get("name")?.asString == container }
          ?.getAsJsonObject("properties")
          ?.getAsJsonArray("elements")
          ?.map { it.asString } ?: emptyList()

  // ---- Guard 1: dedupe -----------------------------------------------------------------------

  @Test
  fun identicalNewDatasourceSelectsKeepTheFirstAndDropTheLater() {
    val original = form(page("pg1", emptyList()))
    val formJson =
        form(
            page("pg1", listOf("selNewSourceCol1", "selTestCol1")),
            select("selNewSourceCol1", datasource = "Test"),
            select("selTestCol1", datasource = "Test"))

    val result = guard(formJson, original, listOf("Test"))

    // The later duplicate is gone from the items array ...
    assertTrue("selNewSourceCol1" in itemNames(result))
    assertFalse("selTestCol1" in itemNames(result))
    // ... and from its parent's "elements" array ...
    assertEquals(listOf("selNewSourceCol1"), elementsOf(result, "pg1"))
    // ... while the surviving select keeps its binding.
    assertEquals("Test", datasourceOf(result, "selNewSourceCol1"))
  }

  @Test
  fun selectsWithDifferentDatasourcesAreBothKept() {
    val original = form(page("pg1", emptyList()))
    val formJson =
        form(
            page("pg1", listOf("sel1", "sel2")),
            select("sel1", datasource = "Test"),
            select("sel2", datasource = "Land"))

    val result = guard(formJson, original, listOf("Test", "Land"))

    assertEquals(listOf("sel1", "sel2"), elementsOf(result, "pg1"))
    assertEquals("Test", datasourceOf(result, "sel1"))
    assertEquals("Land", datasourceOf(result, "sel2"))
  }

  // ---- Guard 1: preserve pre-existing
  // -----------------------------------------------------------------

  @Test
  fun preExistingDuplicatePairAndUnknownDatasourceAreUntouched() {
    // Both selects already existed in the input form (names present in originalJson): the dedupe
    // must not remove one, and the unknown datasource must not be cleared.
    val original =
        form(
            page("pg1", listOf("selA", "selB")),
            select("selA", datasource = "Test"),
            select("selB", datasource = "Test"),
            select("selOld", datasource = "MySource"))
    val formJson = original

    val result = guard(formJson, original, listOf("Test"))

    assertTrue("selA" in itemNames(result))
    assertTrue("selB" in itemNames(result))
    assertEquals(listOf("selA", "selB"), elementsOf(result, "pg1"))
    assertEquals("MySource", datasourceOf(result, "selOld"))
  }

  // ---- Guard 2: validation -------------------------------------------------------------------

  @Test
  fun misspelledNewDatasourceIsNormalizedToTheCanonicalName() {
    val original = form(page("pg1", emptyList()))
    val formJson =
        form(
            page("pg1", listOf("sel1")), select("sel1", datasource = "  56_staatsangehörigkeiten "))

    val result = guard(formJson, original, listOf("56_Staatsangehörigkeiten"))

    assertEquals("56_Staatsangehörigkeiten", datasourceOf(result, "sel1"))
  }

  @Test
  fun unknownNewDatasourceIsCleared() {
    val original = form(page("pg1", emptyList()))
    val formJson = form(page("pg1", listOf("sel1")), select("sel1", datasource = "UnknownSource"))

    val result = guard(formJson, original, listOf("Test", "Land"))

    assertNull(datasourceOf(result, "sel1"))
  }

  @Test
  fun emptyAvailableListChangesNothing() {
    val original = form(page("pg1", emptyList()))
    val formJson = form(page("pg1", listOf("sel1")), select("sel1", datasource = "UnknownSource"))

    val result = guard(formJson, original, emptyList())

    // No validation possible -> the binding must survive untouched (never destroy bindings).
    assertEquals("UnknownSource", datasourceOf(result, "sel1"))
    assertEquals(listOf("pg1", "sel1"), itemNames(result))
  }

  // ---- Log hygiene ---------------------------------------------------------------------------

  @Test
  fun rawResponseLoggingIsTruncated() {
    val huge = "x".repeat(30_000)
    val truncated = truncateForLog(huge)
    assertTrue(truncated.length < huge.length)
    assertTrue(truncated.contains("[truncated 26000 chars]"))
    // A short response is logged verbatim.
    assertEquals("short", truncateForLog("short"))
  }
}
