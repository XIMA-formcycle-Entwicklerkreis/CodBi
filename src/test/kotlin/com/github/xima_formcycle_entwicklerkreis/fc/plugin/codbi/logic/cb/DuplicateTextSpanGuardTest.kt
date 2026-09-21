package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests [AICodBiAssistant]'s duplicate TEXT-element guard
 * ([AICodBiAssistant.dropDuplicateTextSpans]).
 *
 * A designed/"interactive" text is ONE XSpan whose `rtevalue` carries the styled HTML (plus an
 * in-`rtevalue` `<style>` block for the animation). The forced widget-template pass re-emitted that
 * text as a SECOND XSpan under a new name — observed: `spAdvantages` (the designed text) plus
 * `spKIVorteile` / `spKIVorteileDesign` with the same heading and bullet list — so one request
 * published the same text twice. The guard matches XSpans by their NORMALIZED VISIBLE TEXT and
 * drops a NEW copy (keeping the first / a pre-existing one), removes its reference from the
 * parent's `elements` array, and must never touch two genuinely different texts or a pre-existing
 * element.
 */
class DuplicateTextSpanGuardTest {

  private val assistant = AICodBiAssistant()

  /** Invokes the private guard and returns the (possibly rewritten) form JSON. */
  private fun guard(form: String, original: String): String {
    val method =
        AICodBiAssistant::class
            .java
            .getDeclaredMethod("dropDuplicateTextSpans", String::class.java, String::class.java)
            .apply { isAccessible = true }
    return method.invoke(assistant, form, original) as String
  }

  private fun names(json: String): List<String> =
      JsonParser.parseString(json).asJsonObject.getAsJsonArray("items").mapNotNull { el ->
        el.takeIf { it.isJsonObject }
            ?.asJsonObject
            ?.getAsJsonObject("properties")
            ?.get("name")
            ?.takeIf { it.isJsonPrimitive }
            ?.asString
      }

  private fun pageElements(json: String): List<String> =
      JsonParser.parseString(json)
          .asJsonObject
          .getAsJsonArray("items")
          .first { it.isJsonObject && it.asJsonObject.get("className")?.asString == "XPage" }
          .asJsonObject
          .getAsJsonObject("properties")
          .getAsJsonArray("elements")
          .map { it.asString }

  // The designed text — single quotes only, so it embeds in JSON without escaping. Because the
  // animation CSS lives in an in-rtevalue <style> block, the guard must strip that block before
  // comparing the VISIBLE text.
  private val designedText =
      "<style>@keyframes cbFadeIn{from{opacity:0;}to{opacity:1;}} .cbCard{animation:cbFadeIn .6s ease-out both;}</style><div class='cbCard'><h2>Vorteile der KI</h2><ul><li>Punkt eins</li><li>Punkt zwei</li></ul></div>"

  // The same visible text, only re-styled (different keyframes name, class and colour).
  private val designedTextRestyled =
      "<style>@keyframes cbKIFadeIn{from{opacity:0;}to{opacity:1;}} .cbKICard{animation:cbKIFadeIn .6s ease-out both;}</style><div class='cbKICard' style='background:#e6f7ff;'><h2>Vorteile der KI</h2><ul><li>Punkt eins</li><li>Punkt zwei</li></ul></div>"

  private val otherText =
      "<div class='cbOther'><h2>Ein ganz anderer Text</h2><p>Dieser Abschnitt doppelt gar nichts.</p></div>"

  private fun span(name: String, rte: String) =
      """{"className":"XSpan","properties":{"name":"$name","id":"xi-$name","rtevalue":"$rte"}}"""

  private fun page(elements: List<String>) =
      """{"className":"XPage","properties":{"name":"p1","id":"xi-p-1","elements":${elements.joinToString(",", "[", "]") { "\"$it\"" }}}}"""

  private fun form(items: List<String>) = """{"items":[${items.joinToString(",")}]}"""

  @Test
  fun `a new copy of an existing text span is dropped`() {
    val original = form(listOf(page(listOf("spAdvantages")), span("spAdvantages", designedText)))
    val result =
        form(
            listOf(
                page(listOf("spAdvantages", "spKIVorteileDesign")),
                span("spAdvantages", designedText),
                span("spKIVorteileDesign", designedText)))
    val json = guard(result, original)
    assertEquals(listOf("p1", "spAdvantages"), names(json))
    assertEquals(listOf("spAdvantages"), pageElements(json))
  }

  @Test
  fun `a second new span with a merely restyled copy is dropped`() {
    val result =
        form(
            listOf(
                page(listOf("spAdvantages", "spKIVorteile")),
                span("spAdvantages", designedText),
                span("spKIVorteile", designedTextRestyled)))
    val json = guard(result, """{"items":[]}""")
    assertEquals(listOf("p1", "spAdvantages"), names(json))
    assertEquals(listOf("spAdvantages"), pageElements(json))
  }

  @Test
  fun `two genuinely different texts are both kept`() {
    val result =
        form(
            listOf(
                page(listOf("spAdvantages", "spOther")),
                span("spAdvantages", designedText),
                span("spOther", otherText)))
    val json = guard(result, """{"items":[]}""")
    assertEquals(listOf("p1", "spAdvantages", "spOther"), names(json))
  }

  @Test
  fun `pre-existing text elements are never touched`() {
    val original =
        form(
            listOf(
                page(listOf("spA", "spB")), span("spA", designedText), span("spB", designedText)))
    val json = guard(original, original)
    assertEquals(listOf("p1", "spA", "spB"), names(json))
  }

  @Test
  fun `short repeated texts are not treated as duplicates`() {
    val result =
        form(listOf(page(listOf("spA", "spB")), span("spA", "Hallo"), span("spB", "Hallo")))
    val json = guard(result, """{"items":[]}""")
    assertEquals(listOf("p1", "spA", "spB"), names(json))
  }

  @Test
  fun `empty text elements are dropped (they render as a stray Text node)`() {
    // Observed: a rebuild pass emptied the two older spans and put the content into a third one,
    // leaving `"rtevalue":""` elements that render as a senseless "Text" node.
    val result =
        form(
            listOf(
                page(listOf("spAdvantages", "spKIVorteile", "spKIVorteileDesign")),
                span("spAdvantages", ""),
                span("spKIVorteile", "   "),
                span("spKIVorteileDesign", designedText)))
    val json = guard(result, """{"items":[]}""")
    assertEquals(listOf("p1", "spKIVorteileDesign"), names(json))
    assertEquals(listOf("spKIVorteileDesign"), pageElements(json))
  }

  /** Runs the guard and returns the `rtevalue` of the span named `spSvg`. */
  private fun rteValueOf(json: String): String =
      JsonParser.parseString(json)
          .asJsonObject
          .getAsJsonArray("items")
          .first { it.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString == "spSvg" }
          .asJsonObject
          .getAsJsonObject("properties")
          .get("rtevalue")
          .asString

  @Test
  fun `lowercased SVG names are repaired to their camelCase spelling`() {
    // SVG is case-sensitive: `viewbox`/`animatetransform`/`attributename`/`repeatcount` are ignored
    // by the browser, so the canvas is discarded and nothing animates.
    val lower =
        "<svg viewbox='0 0 300 100' width='100%'><circle r='20'><animatetransform attributename='transform' repeatcount='indefinite'/></circle></svg>"
    val rte =
        rteValueOf(
            guard(form(listOf(page(listOf("spSvg")), span("spSvg", lower))), """{"items":[]}"""))
    assertTrue(rte.contains("viewBox='0 0 300 100'"), rte)
    assertTrue(rte.contains("animateTransform"), rte)
    assertTrue(rte.contains("attributeName"), rte)
    assertTrue(rte.contains("repeatCount"), rte)
    assertFalse(rte.contains("viewbox"), rte)
  }

  @Test
  fun `other SVG names and hyphen-omitted attributes are repaired too`() {
    val messy =
        "<svg viewbox='0 0 300 100' preserveaspectratio='xMidYMid meet' baseprofile='full' zoomandpan='magnify'>" +
            "<defs><lineargradient id='g' gradientunits='objectBoundingBox'><stop offset='0' stopcolor='#fff' stopopacity='0.5'/></lineargradient>" +
            "<filter id='f'><fegaussianblur stddeviation='2' stitchtiles='stitch'>" +
            "<animatecolor attributename='fill'/><animate attributename='opacity' values='0'/></fegaussianblur></filter>" +
            "<clippath id='c'><path d='M0 0'/></clippath></defs>" +
            "<path stroke-dashoffset='5' strokewidth='2' fillopacity='.4'/>" +
            "<text horizoriginx='1' glyphref='g'>this viewbox is only a word</text><altglyph/><hkern/></svg>"
    val rte =
        rteValueOf(
            guard(form(listOf(page(listOf("spSvg")), span("spSvg", messy))), """{"items":[]}"""))
    // camelCase attributes (the ones the first, 13-entry map did NOT cover):
    assertTrue(rte.contains("viewBox='0 0 300 100'"), rte)
    assertTrue(rte.contains("preserveAspectRatio='xMidYMid meet'"), rte)
    assertTrue(rte.contains("baseProfile='full'"), rte)
    assertTrue(rte.contains("zoomAndPan='magnify'"), rte)
    assertTrue(rte.contains("gradientUnits='objectBoundingBox'"), rte)
    assertTrue(rte.contains("stdDeviation='2'"), rte)
    assertTrue(rte.contains("stitchTiles='stitch'"), rte)
    assertTrue(rte.contains("horizOriginX='1'"), rte)
    assertTrue(rte.contains("glyphRef='g'"), rte)
    assertTrue(rte.contains("attributeName='fill'"), rte)
    assertTrue(rte.contains("attributeName='opacity'"), rte)
    // camelCase elements, incl. the deprecated ones:
    assertTrue(rte.contains("<linearGradient"), rte)
    assertTrue(rte.contains("<clipPath"), rte)
    assertTrue(rte.contains("<feGaussianBlur"), rte)
    assertTrue(rte.contains("<animateColor"), rte)
    assertTrue(rte.contains("<altGlyph"), rte)
    assertTrue(rte.contains("<hKern"), rte)
    // hyphenated presentation attributes written WITHOUT the hyphen:
    assertTrue(rte.contains("stop-color='#fff'"), rte)
    assertTrue(rte.contains("stop-opacity='0.5'"), rte)
    assertTrue(rte.contains("stroke-width='2'"), rte)
    assertTrue(rte.contains("fill-opacity='.4'"), rte)
    // An already-correct name is left alone, a correct lower-case element/attribute is untouched
    // (`animate`, `values`), and a name that merely OCCURS in the text is never rewritten.
    assertTrue(rte.contains("stroke-dashoffset='5'"), rte)
    assertTrue(rte.contains("<animate attributeName='opacity' values='0'/>"), rte)
    assertTrue(rte.contains("this viewbox is only a word"), rte)
    assertFalse(rte.contains("<lineargradient"), rte)
    assertFalse(rte.contains("fegaussianblur"), rte)
  }

  @Test
  fun `a runtime-wired span is kept even when its rtevalue is empty`() {
    val injector =
        """{"className":"XSpan","properties":{"name":"spWired","id":"xi-sp-wired","rtevalue":""},"attributes":[{"text":"data-cb-func","value":"HTML.Text.Injector"}]}"""
    val result = form(listOf(page(listOf("spWired")), injector))
    val json = guard(result, """{"items":[]}""")
    assertEquals(listOf("p1", "spWired"), names(json))
  }
}
