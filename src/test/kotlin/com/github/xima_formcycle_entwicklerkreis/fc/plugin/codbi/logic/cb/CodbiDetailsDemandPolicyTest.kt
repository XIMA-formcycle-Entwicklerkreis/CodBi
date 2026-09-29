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

  // ------------------------------------------------------------------------------------------
  // repeatsPreviouslySent — the degenerate-loop guard that stops the runaway need_codbi_details
  // rerun loop (the model re-requests the SAME elements/widgets every pass, ~200k+ tokens).
  // ------------------------------------------------------------------------------------------

  private fun repeats(
      newElements: List<String>,
      newWidgets: List<String>,
      sentElements: List<String>,
      sentWidgets: List<String>
  ): Boolean =
      CodbiDetailsDemandPolicy.repeatsPreviouslySent(
          newElements, newWidgets, sentElements, sentWidgets)

  @Test
  fun `the exact same demand is a repeat`() {
    // The observed degenerate loop: the model re-requests the SAME form-element names as "elements"
    // and the SAME widget templates every rerun.
    assertTrue(
        repeats(
            newElements = listOf("spIntro", "spBenefits", "cbShowData", "fdPersonData"),
            newWidgets = listOf("XSpan", "XCheckbox", "XContainer", "XTextField"),
            sentElements = listOf("spIntro", "spBenefits", "cbShowData", "fdPersonData"),
            sentWidgets = listOf("XSpan", "XCheckbox", "XContainer", "XTextField")),
        "identical demand -> degenerate loop -> force final pass (no rerun)")
  }

  @Test
  fun `a reordered identical demand is still a repeat`() {
    // Set-equality is order-insensitive, so the model reordering the lists is still recognized
    // as a repetition instead of slipping through as "new information".
    assertTrue(
        repeats(
            newElements = listOf("fdPersonData", "spIntro", "cbShowData", "spBenefits"),
            newWidgets = listOf("XTextField", "XSpan", "XContainer", "XCheckbox"),
            sentElements = listOf("spIntro", "spBenefits", "cbShowData", "fdPersonData"),
            sentWidgets = listOf("XSpan", "XCheckbox", "XContainer", "XTextField")),
        "reordered identical demand is still a repeat")
  }

  @Test
  fun `a demand requesting a NEW element is NOT a repeat`() {
    // Fail-open: any genuinely new information must keep rerunning.
    assertFalse(
        repeats(
            newElements =
                listOf("spIntro", "spBenefits", "cbShowData", "fdPersonData", "tfStrasse"),
            newWidgets = listOf("XSpan", "XCheckbox", "XContainer", "XTextField"),
            sentElements = listOf("spIntro", "spBenefits", "cbShowData", "fdPersonData"),
            sentWidgets = listOf("XSpan", "XCheckbox", "XContainer", "XTextField")),
        "a new element is new information -> still rerun")
  }

  @Test
  fun `a demand requesting a NEW widget is NOT a repeat`() {
    assertFalse(
        repeats(
            newElements = listOf("spIntro", "spBenefits", "cbShowData", "fdPersonData"),
            newWidgets = listOf("XSpan", "XCheckbox", "XContainer", "XTextField", "XSelect"),
            sentElements = listOf("spIntro", "spBenefits", "cbShowData", "fdPersonData"),
            sentWidgets = listOf("XSpan", "XCheckbox", "XContainer", "XTextField")),
        "a new widget is new information -> still rerun")
  }

  @Test
  fun `only widgets repeat but elements differ is NOT a repeat`() {
    assertFalse(
        repeats(
            newElements = listOf("Holistic.Panels.Panels"),
            newWidgets = listOf("XSpan", "XCheckbox", "XContainer", "XTextField"),
            sentElements = listOf("spIntro", "spBenefits", "cbShowData", "fdPersonData"),
            sentWidgets = listOf("XSpan", "XCheckbox", "XContainer", "XTextField")),
        "different elements -> new information -> still rerun")
  }

  @Test
  fun `both empty demand vs both empty sent is a repeat but the caller guards that separately`() {
    // For completeness: two blank demands are equal, but a blank demand never enters the rerun loop
    // in the first place (CodbiDetailsDemandPolicy.isSpecified = false), so this cannot be reached.
    assertTrue(repeats(listOf(), listOf(), listOf(), listOf()))
  }
}
