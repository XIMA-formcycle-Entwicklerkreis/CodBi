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
  fun datasourceNamesAreNeverGuessedByCharacters() {
    // Choosing WHICH datasource fits is the MODEL's job (by meaning). The server matcher must NOT
    // fold spellings or prefixes, so a name the model re-authored (dropped "56_", added the real
    // umlaut) does NOT silently bind — the model is expected to have copied a listed name verbatim
    // or asked instead.
    val available = listOf("56_Staatsangehoerigkeiten", "Test")
    assertNull(findClosest("Staatsangehörigkeiten", available))
    assertNull(findClosest("Staatsangehoerigkeiten", available))
    assertEquals("56_Staatsangehoerigkeiten", findClosest("56_Staatsangehoerigkeiten", available))
  }

  @Test
  fun blockTellsTheModelToChooseByMeaningAndAskWhenUnsure() {
    val block = buildBlock(listOf("56_Staatsangehoerigkeiten", "Test"))!!
    assertTrue(block.contains("VERBATIM"))
    assertTrue(block.contains("CHOOSE BY MEANING"))
    assertTrue(block.contains("ASK the user"))
    // When asking, the model must offer ONLY the datasources that plausibly fit (the candidates)
    // and
    // say how many fit — never dump the whole list (observed regression: all 3 sources were offered
    // for a request that clearly matched only 2).
    assertTrue(block.contains("offer ONLY the candidate names that plausibly FIT"))
    assertTrue(block.contains("do NOT dump the entire list"))
    assertTrue(block.contains("naming how many"))
    // WIDGET BY INTENT (language-agnostic): a requested INPUT FIELD bound to the datasource is the
    // DS-widget text field XTextfieldAdvanced (a SELECTION stays a plain XSelect).
    assertTrue(block.contains("XTextfieldAdvanced"))
    assertTrue(block.contains("WIDGET BY INTENT"))
    assertTrue(block.contains("LANGUAGE-AGNOSTIC"))
    // FILTER-THROUGH wiring: the DS-widget property `xtf_ds_param` (label "filter through") must be
    // set to the id of the separate filter field.
    assertTrue(block.contains("xtf_ds_param"))
    assertTrue(block.contains("filter through"))
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
