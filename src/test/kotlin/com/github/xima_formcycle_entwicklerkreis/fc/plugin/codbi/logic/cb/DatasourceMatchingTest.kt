package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests for the pure FORMCYCLE-DATASOURCE helpers of [AICodBiAssistant]:
 * - `findClosestDatasource(requested, available)` matches a datasource name named by a request
 *   against the AVAILABLE names — exact, or case/whitespace-insensitive. A misspelled/unknown name
 *   (or a blank request) MUST return null so the caller asks the user instead of inventing one.
 * - `buildAvailableDatasourcesBlock(names)` formats the "AVAILABLE FORMCYCLE DATASOURCES" prompt
 *   block and returns null for an empty list, so nothing is injected when the lookup fails.
 *
 * Both are pure (no DB / no side effects) and are invoked reflectively here, matching the existing
 * test style in this package.
 */
class DatasourceMatchingTest {

  private val assistant = AICodBiAssistant()

  private fun findClosest(requested: String?, available: List<String>): String? {
    return AICodBiAssistant::class
        .java
        .getDeclaredMethod("findClosestDatasource", String::class.java, List::class.java)
        .apply { isAccessible = true }
        .invoke(assistant, requested, available) as? String
  }

  private fun buildBlock(available: List<String>): String? {
    return AICodBiAssistant::class
        .java
        .getDeclaredMethod("buildAvailableDatasourcesBlock", List::class.java)
        .apply { isAccessible = true }
        .invoke(assistant, available) as? String
  }

  @Test
  fun exactNameMatchesAndIsReturnedUnchanged() {
    val available = listOf("Staatsangehörigkeiten", "Land")
    assertEquals("Staatsangehörigkeiten", findClosest("Staatsangehörigkeiten", available))
  }

  @Test
  fun caseAndWhitespaceInsensitiveMatchReturnsCanonicalName() {
    val available = listOf("56_Staatsangehörigkeiten", "Land")
    // Leading/trailing whitespace AND different casing still resolve to the configured name.
    assertEquals("56_Staatsangehörigkeiten", findClosest("  56_staatsangehörigkeiten ", available))
  }

  @Test
  fun theCurrentlyWorkingCaseKeepsResolving() {
    // "Spalte 1 in der Quelle 56_Staatsangehörigkeiten" must NOT trigger a question.
    val available = listOf("56_Staatsangehörigkeiten", "Land", "Anrede")
    assertEquals("56_Staatsangehörigkeiten", findClosest("56_Staatsangehörigkeiten", available))
  }

  @Test
  fun misspelledOrUnknownNameDoesNotMatch() {
    val available = listOf("Staatsangehörigkeiten", "Land")
    assertNull(findClosest("Staatsangehoerigkeit", available))
    assertNull(findClosest("UnknownSource", available))
  }

  @Test
  fun blankOrNullRequestDoesNotMatch() {
    val available = listOf("Staatsangehörigkeiten")
    assertNull(findClosest(null, available))
    assertNull(findClosest("   ", available))
  }

  @Test
  fun emptyAvailableListNeverMatches() {
    assertNull(findClosest("Staatsangehörigkeiten", emptyList()))
  }

  @Test
  fun blockIsNullWhenNoNamesAreAvailable() {
    assertNull(buildBlock(emptyList()))
    assertNull(buildBlock(listOf("   ", "")))
  }

  @Test
  fun blockListsDistinctSortedNames() {
    val block = buildBlock(listOf("Land", "Anrede", "Land"))
    assertTrue(block != null, "a non-empty list must produce a block")
    assertTrue(block!!.contains("AVAILABLE FORMCYCLE DATASOURCES"))
    assertTrue(block.contains("Anrede"))
    assertTrue(block.contains("Land"))
    // "Land" appears once (deduplicated) and sorting puts "Anrede" before "Land".
    assertEquals(1, block.split("Land").size - 1)
    assertTrue(block.indexOf("Anrede") < block.indexOf("Land"))
  }
}
