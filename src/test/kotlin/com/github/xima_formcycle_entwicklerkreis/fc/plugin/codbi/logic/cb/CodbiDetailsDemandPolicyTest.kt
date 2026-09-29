package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests [CodbiDetailsDemandPolicy] — the pass-2 token reduction that stops a `need_codbi_details`
 * signal with NO named elements and NO named widgets from re-sending the FULL compact API as a
 * blind inference.
 *
 * A demand that names something (elements, widgets, or both) must keep rerunning exactly as before
 * (fail-open). Only a blank demand — the "<unspecified>" case seen in the logs — is suppressed and
 * passed down to the normal recovery handling instead.
 */
class CodbiDetailsDemandPolicyTest {

  private fun specified(
      elements: List<String> = emptyList(),
      widgets: List<String> = emptyList()
  ): Boolean = CodbiDetailsDemandPolicy.isSpecified(elements, widgets)

  @Test
  fun `a blank demand is NOT specified`() {
    assertFalse(specified(), "both lists empty -> no targeted rerun")
  }

  @Test
  fun `an empty elements list alone is not specified`() {
    assertFalse(specified(elements = emptyList(), widgets = emptyList()))
  }

  @Test
  fun `a named element is specified`() {
    assertTrue(specified(elements = listOf("Holistic.Panels.Panels")))
  }

  @Test
  fun `a named widget is specified`() {
    assertTrue(specified(widgets = listOf("XContainer")))
  }

  @Test
  fun `blank strings are filtered upstream so trimmed names still count as specified`() {
    // The parser (extractCodbiDetailsRequest) trims and drops empty entries before this policy is
    // consulted; a name that survives is a real demand.
    assertTrue(specified(elements = listOf("  Holistic.Panels.Panels  ")))
  }

  @Test
  fun `elements and widgets together are specified`() {
    assertTrue(specified(elements = listOf("Holistic.Panels.Panels"), widgets = listOf("XSpan")))
  }

  @Test
  fun `empty collections from a caller are handled the same as blank lists`() {
    assertFalse(specified(elements = listOf(), widgets = listOf()))
    assertFalse(specified(elements = emptyList<String>(), widgets = emptyList<String>()))
  }
}
