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
}
