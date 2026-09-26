package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests [FormDiffMarker] — the declaration that a form pass returned a DIFF (only the changed/new
 * items) rather than a whole form. The server splices onto the original form only when the
 * declaration is present, because omission alone is ambiguous.
 */
class FormDiffMarkerTest {

  @Test
  fun `the _diff true flag declares a diff`() {
    assertTrue(FormDiffMarker.isDeclared("""{"_diff": true, "items":[{"className":"XSpan"}]}"""))
    assertTrue(FormDiffMarker.isDeclared("""{"_diff":true,"items":[]}"""))
    // Whitespace around the colon is tolerated.
    assertTrue(FormDiffMarker.isDeclared("""{"_diff" :  true }"""))
  }

  @Test
  fun `the legacy _unchangedItems list still declares a diff`() {
    assertTrue(FormDiffMarker.isDeclared("""{"items":[],"_unchangedItems":["tfA","tfB"]}"""))
    assertTrue(FormDiffMarker.isDeclared("""{"_unchangedItems":[]}"""))
  }

  @Test
  fun `a plain form without a declaration is not a diff`() {
    assertFalse(FormDiffMarker.isDeclared("""{"items":[{"className":"XSpan"}]}"""))
    assertFalse(FormDiffMarker.isDeclared("""{"_diff": false, "items":[]}"""))
    assertFalse(FormDiffMarker.isDeclared("""{"title":"New form","items":[]}"""))
  }

  @Test
  fun `blank and null candidates are never a declaration`() {
    assertFalse(FormDiffMarker.isDeclared(null))
    assertFalse(FormDiffMarker.isDeclared(""))
    assertFalse(FormDiffMarker.isDeclared("   "))
  }

  @Test
  fun `the marker key is the expected stable key`() {
    // The key is part of the model-facing protocol — changing it silently would break the splice.
    assertTrue(FormDiffMarker.KEY == "_diff")
  }
}
