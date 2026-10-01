package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests the PASS-1 NAME-ONLY catalogs (Lever 2.4): [CodbiCapabilities.buildSectionCondensed] and
 * [CodbiCapabilities.buildWidgetsSectionCondensed].
 *
 * Pass-1 only DECIDES what to change and which details to request (via `need_codbi_details`); the
 * exact JSON specs arrive in pass-2. So pass-1 needs the element NAMES (to build the request), not
 * the per-entry prose. The name-only variants keep every heading AND the section PREAMBLE verbatim
 * (the preamble carries the decision-critical GENERAL RULES — e.g. the widget catalog's "LABELS —
 * never use generic placeholders such as 'Label'" rule) and DROP each entry's body prose entirely.
 *
 * Without a DB the object falls back to the bundled resources (`codbi-core-elements-compact.md` /
 * `formcycle-widgets-compact.md`), so these tests exercise the real production resources.
 */
class CodbiCapabilitiesPass1NameOnlyTest {

  @Test
  fun `elements catalog keeps every heading but drops the per-entry prose`() {
    val nameOnly = CodbiCapabilities.buildSectionCondensed()
    val full = CodbiCapabilities.buildSection()

    // All headings survive — both the group heading and the per-entry `###` headings.
    assertTrue(nameOnly.contains("## Functionalities"), "group heading dropped")
    assertTrue(nameOnly.contains("\n### AI.LLAMA.CHAT\n"), "element heading dropped")
    assertTrue(nameOnly.contains("\n### Date.Frame\n"), "element heading dropped")
    assertTrue(nameOnly.contains("\n### HTML.CSS\n"), "element heading dropped")

    // Per-entry body prose is gone. These are actual prose lines that follow a `###` heading.
    assertFalse(
        nameOnly.contains("Applicable on a container element to embed an AI chat widget"),
        "entry prose leaked into the name-only elements catalog")
    assertFalse(
        nameOnly.contains("For a date range (start/minimum + end/maximum date"),
        "entry prose leaked into the name-only elements catalog")

    // The name-only catalog is strictly smaller than the full catalog it replaces.
    assertTrue(
        nameOnly.length in 1 until full.length,
        "name-only(${nameOnly.length}) !< full(${full.length})")
  }

  @Test
  fun `widgets catalog keeps every heading but drops the per-widget prose`() {
    val nameOnly = CodbiCapabilities.buildWidgetsSectionCondensed()
    val full = CodbiCapabilities.buildWidgetsSection()

    // Every widget `##` heading survives.
    assertTrue(nameOnly.contains("\n## XTextField\n"), "widget heading dropped")
    assertTrue(nameOnly.contains("\n## XTextArea\n"), "widget heading dropped")
    assertTrue(nameOnly.contains("\n## XButtonList\n"), "widget heading dropped")
    assertTrue(nameOnly.contains("\n## XPage\n"), "widget heading dropped")

    // Per-widget body prose is gone.
    assertFalse(
        nameOnly.contains("Single-line text input"),
        "entry prose leaked into the name-only widgets catalog")
    assertFalse(
        nameOnly.contains("Multi-line text input"),
        "entry prose leaked into the name-only widgets catalog")

    // The name-only catalog is strictly smaller than the full catalog it replaces.
    assertTrue(
        nameOnly.length in 1 until full.length,
        "name-only(${nameOnly.length}) !< full(${full.length})")
  }

  @Test
  fun `elements preamble and group headings are preserved verbatim`() {
    val nameOnly = CodbiCapabilities.buildSectionCondensed()

    // The preamble (before the first `##` entry) and the group headings are decision-critical and
    // must be kept verbatim, not truncated.
    assertTrue(
        nameOnly.contains("Element-only reference: what each functionality, element placeholder,"),
        "elements preamble was not preserved verbatim")
  }

  @Test
  fun `widgets preamble keeps the decision-critical LABELS rule but drops clarification-only paragraphs`() {
    val nameOnly = CodbiCapabilities.buildWidgetsSectionCondensed()

    // The decision-critical GENERAL RULE must survive name-only condensation.
    assertTrue(
        nameOnly.contains("LABELS — Every interactive element you create MUST carry"),
        "the LABELS general rule was dropped from the widgets preamble")

    // The clarification-only preamble paragraphs are removed by
    // `dropClarificationOnlyParagraphs` (pass-1 must NOT ask), and they are also decision-core
    // redundant. Their removal must not re-introduce them as entry prose either.
    assertFalse(
        nameOnly.contains("REQUIRED OPTIONS — Several widgets have mandatory options"),
        "clarification-only 'REQUIRED OPTIONS' paragraph leaked back into the widgets catalog")
    assertFalse(
        nameOnly.contains("EXISTING FORM ELEMENTS —"),
        "clarification-only 'EXISTING FORM ELEMENTS' paragraph leaked back into the widgets catalog")
  }

  @Test
  fun `name-only catalogs are a fraction of the full catalogs they replace`() {
    // Lever 2.4's whole point: names alone are enough to *request* details, so pass-1 should not
    // carry the per-entry prose. This guard keeps the saving from silently regressing.
    val elementsNameOnly = CodbiCapabilities.buildSectionCondensed()
    val elementsFull = CodbiCapabilities.buildSection()
    val widgetsNameOnly = CodbiCapabilities.buildWidgetsSectionCondensed()
    val widgetsFull = CodbiCapabilities.buildWidgetsSection()

    assertTrue(
        elementsNameOnly.length * 2 < elementsFull.length,
        "elements name-only (${elementsNameOnly.length}) is not a fraction of full (${elementsFull.length})")
    assertTrue(
        widgetsNameOnly.length * 2 < widgetsFull.length,
        "widgets name-only (${widgetsNameOnly.length}) is not a fraction of full (${widgetsFull.length})")
  }
}
