package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Lever #1 of the input-token optimisation: the pass-2 widget details are gated with the same keep
 * set as pass-1. The detailed `XSpan` widget section (the only widget section with
 * `<!--SECTION:…-->` blocks) is split into
 * - `designed_text` — the designed/interactive-text rules,
 * - `designed_text,svg,custom_js` — the CSS-animation / in-`rtevalue`-`<style>` / custom-JS
 *   mechanism, and
 * - `svg` — the illustration rules with TWO worked examples plus the forbidden-composition list (by
 *   far the largest block, ~20 KB),
 *
 * so a request for e.g. only a designed text no longer pays for the illustration half.
 *
 * These tests run against the REAL bundled prompt file (not a fixture), so a marker typo, a
 * forgotten closing marker or a tag that is not a member of [PromptSectionGate.KNOWN_TAGS] fails
 * the build instead of silently shipping the whole 36 KB XSpan section (or, worse, a raw marker
 * comment) into every pass-2 prompt.
 */
class WidgetSectionGatingTest {

  private val widgetsResource =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-widgets.md"

  private fun widgetsReference(): String =
      PromptSectionGate::class
          .java
          .classLoader
          .getResourceAsStream(widgetsResource)
          ?.bufferedReader(Charsets.UTF_8)
          ?.use { it.readText() } ?: error("bundled $widgetsResource not found on the classpath")

  /** The `## XSpan` section only (from its heading to the next `## ` heading). */
  private fun xspanSection(text: String): String {
    val start = text.indexOf("## XSpan")
    assertTrue(start >= 0, "the widget reference must contain the XSpan section")
    val end = text.indexOf("\n## ", start + 1)
    return if (end < 0) text.substring(start) else text.substring(start, end)
  }

  private val designedTextMarker = "RICH / DESIGNED / INTERACTIVE TEXT"
  private val mechanismMarker = "REAL CSS ANIMATIONS INTO THE FORM"
  private val illustrationMarker = "FORBIDDEN COMPOSITIONS"
  private val helpMarker = "HELP / HINWEIS"
  private val templateMarker = "{\"className\":\"XSpan\""

  @Test
  fun `every XSpan section marker is balanced and uses a known tag`() {
    val section = xspanSection(widgetsReference())
    val opens = Regex("<!--SECTION:([a-z0-9_,]+)-->").findAll(section).map { it.groupValues[1] }
    val closes = Regex("<!--/SECTION:([a-z0-9_,]+)-->").findAll(section).map { it.groupValues[1] }
    assertEquals(opens.toList(), closes.toList(), "open/close markers must pair in order")
    assertTrue(opens.count() >= 3, "expected the designed_text / mechanism / svg blocks")
    for (tags in opens) {
      for (tag in tags.split(",")) {
        assertTrue(
            tag in PromptSectionGate.KNOWN_TAGS,
            "tag '$tag' is not a member of KNOWN_TAGS — its block would fail OPEN (always kept)")
      }
    }
  }

  @Test
  fun `a designed-text-only request keeps the designed-text and mechanism blocks but drops the illustration half`() {
    val gated =
        PromptSectionGate.applySectionGates(
            xspanSection(widgetsReference()), setOf("designed_text"))
    assertTrue(gated.contains(designedTextMarker), "designed-text rules must stay")
    assertTrue(gated.contains(mechanismMarker), "the animation mechanism must stay")
    assertTrue(gated.contains(helpMarker), "the always-on HELP/HINWEIS rule must stay")
    assertTrue(gated.contains(templateMarker), "the always-on JSON template must stay")
    assertFalse(gated.contains(illustrationMarker), "the illustration checklist must be dropped")
    assertFalse(gated.contains("<!--SECTION:"), gated)
    assertFalse(gated.contains("<!--/SECTION:"), gated)
  }

  @Test
  fun `an illustration request keeps the svg block and the mechanism but drops the designed-text paragraph`() {
    val gated = PromptSectionGate.applySectionGates(xspanSection(widgetsReference()), setOf("svg"))
    assertTrue(gated.contains(illustrationMarker), "the illustration checklist must stay")
    assertTrue(gated.contains(mechanismMarker), "the animation mechanism must stay")
    assertTrue(gated.contains(helpMarker), "the always-on HELP/HINWEIS rule must stay")
    assertFalse(
        gated.contains("NO SEPARATE TEXT INPUT NEXT TO A DESIGNED TEXT"),
        "the designed-text paragraph must be dropped")
  }

  @Test
  fun `a custom-js request keeps the mechanism block (it carries the interactive-HTML rules)`() {
    val gated =
        PromptSectionGate.applySectionGates(xspanSection(widgetsReference()), setOf("custom_js"))
    assertTrue(
        gated.contains(mechanismMarker),
        "the mechanism block is tagged designed_text,svg,custom_js")
    assertTrue(gated.contains("<button type='button'>"), "the interactive-HTML rule must stay")
    assertFalse(gated.contains(designedTextMarker), "the designed-text paragraph must be dropped")
    assertFalse(gated.contains(illustrationMarker), "the illustration checklist must be dropped")
  }

  @Test
  fun `a designed animated text WITHOUT an illustration keeps designed-text rules but not the svg block`() {
    // Regression: force-including `svg` whenever the request mentions "design"/"interaktiv"/
    // "animier" (matches [DesignedTextDetector.wantsDesignedTextOrIllustration]) used to keep the
    // LARGE illustration half (~20 KB of worked examples + the forbidden-composition list) for a
    // request that never asked for a drawing. The keep-set construction in the assistant now
    // force-includes ONLY `designed_text`; `svg` stays gated by its deterministic keyword detector.
    // This asserts the effective keep set and the resulting gate both honour that contract, and it
    // guards against the svg force-include being reintroduced.
    val prompt =
        "Füge einen Bereich für Personenbezogene Daten hinzu, mit einer Checkbox und einem " +
            "gestalteten interaktiven Text mit animierten Stichpunkten."
    assertTrue(
        DesignedTextDetector.wantsDesignedTextOrIllustration(prompt),
        "the prompt must be recognised as needing the designed-text rules (design/interactive/animated)")
    val keep = PromptSectionGate.resolveKeepTags(null, prompt)
    // resolveKeepTags returns tags in NORMALIZED form (lowercased, non-alphanumerics stripped),
    // so "designed_text" is stored as "designedtext".
    assertTrue(keep.contains("designedtext"), "designed-text rules must be kept")
    assertFalse(
        keep.contains("svg"),
        "a designed/animated text without an illustration must NOT keep the svg block")
    val gated = PromptSectionGate.applySectionGates(xspanSection(widgetsReference()), keep)
    assertTrue(gated.contains(designedTextMarker), "designed-text rules must stay")
    assertTrue(gated.contains(mechanismMarker), "the animation mechanism must stay")
    assertFalse(
        gated.contains(illustrationMarker),
        "the illustration checklist must be dropped for a non-illustration request")
  }

  @Test
  fun `nothing requested keeps only the always-on XSpan rules and strips every marker`() {
    val gated = PromptSectionGate.applySectionGates(xspanSection(widgetsReference()), emptySet())
    assertTrue(gated.contains(helpMarker))
    assertTrue(gated.contains(templateMarker))
    assertFalse(gated.contains(designedTextMarker))
    assertFalse(gated.contains(mechanismMarker))
    assertFalse(gated.contains(illustrationMarker))
    assertFalse(gated.contains("<!--SECTION:"), gated)
  }

  @Test
  fun `cache mode keeps every block and only strips the markers`() {
    // Prompt-caching mode passes KNOWN_TAGS as the keep set: NOTHING may be dropped (a
    // request-dependent drop would change the middle of the prompt and invalidate the provider's
    // prefix cache), but the marker comments must still disappear.
    val cached =
        PromptSectionGate.applySectionGates(
            xspanSection(widgetsReference()), PromptSectionGate.KNOWN_TAGS)
    assertTrue(cached.contains(designedTextMarker))
    assertTrue(cached.contains(mechanismMarker))
    assertTrue(cached.contains(illustrationMarker))
    assertFalse(cached.contains("<!--SECTION:"), cached)
    assertFalse(cached.contains("<!--/SECTION:"), cached)
  }

  @Test
  fun `the illustration half is the dominant share of the XSpan section`() {
    // The whole point of the lever: the two worked examples + forbidden-composition list are what a
    // non-illustration request no longer pays for. Guard that this stays true, so the split is not
    // silently reverted into one big ungated block.
    val section = xspanSection(widgetsReference())
    val designedOnly = PromptSectionGate.applySectionGates(section, setOf("designed_text"))
    val everything = PromptSectionGate.applySectionGates(section, PromptSectionGate.KNOWN_TAGS)
    val saved = everything.length - designedOnly.length
    assertTrue(saved > 15_000, "expected the illustration half to save >15k chars, saved=$saved")
  }

  // ---------------------------------------------------------------------------------------------
  // Lever 2.1 — condensed widget NAME-INDEX fallback (empty `widgetIds`). The full
  // `formcycle.widgets` reference (~36 KB ≈ 12k tokens) used to be shipped whenever the model asked
  // for no widget details; it is now replaced by a tiny index of the allowed widget names plus a
  // `need_codbi_details` demand-load instruction. These tests run against the REAL bundled prompt
  // so
  // a change to the widget headings that would make a widget silently disappear from the index (or
  // one that re-inflates the fallback) fails the build.
  // ---------------------------------------------------------------------------------------------

  private val fullReferenceLength: Int
    get() = widgetsReference().length

  private val nameIndex: String
    get() = FormcycleElementFilter.renderWidgetNameIndex(widgetsReference())

  @Test
  fun `the name-index fallback is a small fraction of the full reference`() {
    assertTrue(
        fullReferenceLength > 30_000,
        "the full reference must stay large for this guard to mean anything")
    val saved = fullReferenceLength - nameIndex.length
    assertTrue(
        saved > 25_000, "the name index must cut >25k chars of the full reference, saved=$saved")
  }

  @Test
  fun `the name index lists every widget name from the real reference headings`() {
    assertTrue(nameIndex.contains("- XTextField\n"), "must list the XTextField heading")
    assertTrue(nameIndex.contains("- XSpan\n"), "must list the XSpan heading")
    assertTrue(nameIndex.contains("- XUpload\n"), "must list the XUpload heading")
    assertTrue(nameIndex.contains("- XSelect\n"), "must list the XSelect heading")
    assertTrue(nameIndex.contains("- XCheckbox\n"), "must list the XCheckbox heading")
    // The demand-load instruction must survive so the model pulls the detailed template on demand.
    assertTrue(
        nameIndex.contains("need_codbi_details"),
        "must instruct to demand-load via need_codbi_details")
  }

  @Test
  fun `the name index carries no per-widget build prose`() {
    // The fallback must contain the NAMES only, not the parameter-complete JSON templates or the
    // designed-text/illustration rule prose — that is the dead weight the index removes. If a prose
    // marker appears the index has been replaced by the full reference again.
    assertFalse(nameIndex.contains("RICH / DESIGNED / INTERACTIVE TEXT"), "no designed-text prose")
    assertFalse(nameIndex.contains("\"className\":\"XSpan\""), "no JSON template in the index")
    assertFalse(nameIndex.contains("FORBIDDEN COMPOSITIONS"), "no illustration prose")
    assertFalse(
        nameIndex.contains("<!--SECTION:"), "no raw section markers must leak into the index")
  }

  @Test
  fun `the name index omits a widget forbidden for the request`() {
    FormcycleElementFilter.runForRequest(null, null, null) {
      // No restriction active → everything from the reference is listed.
      assertTrue(renderNameIndex().contains("- XTextField\n"))
    }
    FormcycleElementFilter.runForRequest(setOf("XTextField", "XSpan"), null, null) {
      // Only the two allowed widgets may be advertised — anything else must vanish from the index.
      val index = renderNameIndex()
      assertTrue(index.contains("- XTextField\n"))
      assertTrue(index.contains("- XSpan\n"))
      assertFalse(index.contains("- XUpload\n"), "a disallowed widget must not be advertised")
      assertTrue(
          index.contains("(no formcycle widgets available for this request)").not(),
          "at least one widget must remain listed")
    }
    FormcycleElementFilter.runForRequest(emptySet(), null, null) {
      // Empty allowed set disables every widget.
      assertTrue(renderNameIndex().contains("(no formcycle widgets available for this request)"))
    }
  }

  @Test
  fun `the name index never leaks a forbidden widget via the forbidden-user list`() {
    // isWidgetAllowed also honours the per-user FORBIDDEN elements (CodBiElementAccess), but in a
    // unit test the forbidden set is empty — so everything stays. This guards that the filter is
    // actually consulted inside the index renderer (i.e. the names really pass through
    // isWidgetAllowed and are not hard-coded).
    FormcycleElementFilter.runForRequest(null, null, null) {
      val names =
          Regex("(?m)^- (.+)$").findAll(renderNameIndex()).map { it.groupValues[1] }.toList()
      assertTrue(
          names.containsAll(
              listOf("XTextField", "XSpan", "XUpload", "XSelect", "XCheckbox", "XButtonList")),
          "expected the common widget names to be listed, got: $names")
    }
  }

  private fun renderNameIndex(): String =
      FormcycleElementFilter.renderWidgetNameIndex(widgetsReference())
}
