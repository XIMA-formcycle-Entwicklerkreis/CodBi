package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests [SvgNameRepair] — the deterministic SVG element/attribute name repair that runs on the
 * FINAL form JSON of the simpler [AIFormAssistant] (the unified [AICodBiAssistant] carries its own
 * mirror-image implementation).
 *
 * The observed defect: a generated "animated SVG illustration" used lowercased names (`viewbox`,
 * `preserveaspectratio`, `radialgradient`) — SVG is CASE-SENSITIVE, so the browser silently ignored
 * them: the canvas was discarded and NOTHING animated, even though the CSS `@keyframes` were
 * present and correct.
 */
class SvgNameRepairTest {

  private fun formWithRte(rte: String): String =
      """{"items":[{"className":"XPage","properties":{"name":"p1","id":"xi-p-1","elements":["spText"]}},{"className":"XSpan","properties":{"name":"spText","id":"xi-spText","rtevalue":"$rte"}}]}"""

  private fun rteValueOf(json: String): String =
      JsonParser.parseString(json)
          .asJsonObject
          .getAsJsonArray("items")
          .map { it.asJsonObject }
          .first { it.get("className")?.asString == "XSpan" }
          .getAsJsonObject("properties")
          .get("rtevalue")
          .asString

  private fun repair(rte: String): String =
      rteValueOf(SvgNameRepair.repairXSpanRtevalues(formWithRte(rte)))

  @Test
  fun `lowercased svg names are restored to camelCase`() {
    val rte =
        "<style>@keyframes rotateGlobe{to{transform:rotate(360deg);}}</style>" +
            "<svg viewbox='0 0 800 200' preserveaspectratio='xMidYMid meet' width='100%' xmlns='http://www.w3.org/2000/svg'>" +
            "<defs><radialgradient id='g'><stop offset='0' stopcolor='#fff'/></radialgradient></defs>" +
            "<circle cx='620' cy='100' r='50' fill='url(#g)'/></svg>"
    val fixed = repair(rte)
    assertTrue(fixed.contains("viewBox='0 0 800 200'"), fixed)
    assertTrue(fixed.contains("preserveAspectRatio='xMidYMid meet'"), fixed)
    assertTrue(fixed.contains("<radialGradient id='g'>"), fixed)
    assertTrue(fixed.contains("</radialGradient>"), fixed)
    assertTrue(fixed.contains("stop-color='#fff'"), fixed)
    assertFalse(fixed.contains("viewbox"), fixed)
    assertFalse(fixed.contains("preserveaspectratio"), fixed)
    assertFalse(fixed.contains("radialgradient"), fixed)
  }

  @Test
  fun `smil animation names are restored so the animation is not silently discarded`() {
    val rte =
        "<svg viewBox='0 0 300 100'><circle class='globe' cx='150' cy='50' r='30'>" +
            "<animatetransform attributename='transform' attributetype='XML' type='rotate' from='0 150 50' to='360 150 50' dur='10s' repeatcount='indefinite'/>" +
            "</circle></svg>"
    val fixed = repair(rte)
    assertTrue(fixed.contains("<animateTransform"), fixed)
    assertTrue(fixed.contains("attributeName='transform'"), fixed)
    assertTrue(fixed.contains("attributeType='XML'"), fixed)
    assertTrue(fixed.contains("repeatCount='indefinite'"), fixed)
    assertFalse(fixed.contains("animatetransform"), fixed)
    assertFalse(fixed.contains("repeatcount"), fixed)
  }

  @Test
  fun `hyphen-omitted presentation attributes are restored`() {
    val rte =
        "<svg viewBox='0 0 100 100'><path d='M0,0 L10,10' strokewidth='2' strokelinecap='round' fillopacity='0.5' stroke-dashoffset='3'/></svg>"
    val fixed = repair(rte)
    assertTrue(fixed.contains("stroke-width='2'"), fixed)
    assertTrue(fixed.contains("stroke-linecap='round'"), fixed)
    assertTrue(fixed.contains("fill-opacity='0.5'"), fixed)
    // An already correct, hyphenated attribute is left alone.
    assertTrue(fixed.contains("stroke-dashoffset='3'"), fixed)
  }

  @Test
  fun `filter and clip element names are restored`() {
    val rte =
        "<svg viewBox='0 0 100 100'><defs>" +
            "<lineargradient id='lg'><stop offset='0' stop-opacity='1'/></lineargradient>" +
            "<clippath id='cp'><rect width='10' height='10'/></clippath>" +
            "<filter id='f'><fegaussianblur stddeviation='3'/></filter>" +
            "</defs></svg>"
    val fixed = repair(rte)
    assertTrue(fixed.contains("<linearGradient id='lg'>"), fixed)
    assertTrue(fixed.contains("</linearGradient>"), fixed)
    assertTrue(fixed.contains("<clipPath id='cp'>"), fixed)
    assertTrue(fixed.contains("<feGaussianBlur stdDeviation='3'/>"), fixed)
    assertFalse(fixed.contains("lineargradient"), fixed)
    assertFalse(fixed.contains("clippath"), fixed)
    assertFalse(fixed.contains("fegaussianblur"), fixed)
    assertFalse(fixed.contains("stddeviation"), fixed)
  }

  @Test
  fun `deprecated element names are restored`() {
    val rte = "<svg viewBox='0 0 10 10'><altglyph x='1'/><animatecolor attributeName='fill'/></svg>"
    val fixed = repair(rte)
    assertTrue(fixed.contains("<altGlyph x='1'/>"), fixed)
    assertTrue(fixed.contains("<animateColor attributeName='fill'/>"), fixed)
    assertFalse(fixed.contains("altglyph"), fixed)
    assertFalse(fixed.contains("animatecolor"), fixed)
  }

  @Test
  fun `prose that merely mentions a name is never rewritten`() {
    val rte =
        "<div><p>Ein viewbox ist nur ein Wort, und ein lineargradient auch.</p>" +
            "<p>stroke-width bleibt ohnehin korrekt.</p></div>"
    assertEquals(rte, repair(rte))
  }

  @Test
  fun `already correct svg markup is left byte-identical`() {
    val rte =
        "<style>@keyframes cbFade{from{opacity:0;}to{opacity:1;}}</style>" +
            "<svg viewBox='0 0 480 300' preserveAspectRatio='xMidYMid meet' width='100%'>" +
            "<defs><linearGradient id='cbBg'><stop offset='0' stop-color='#fff'/></linearGradient></defs>" +
            "<rect x='0' y='0' width='10' height='10' fill='url(#cbBg)'/>" +
            "<circle class='cbDot' cx='5' cy='5' r='2'><animateTransform attributeName='transform' attributeType='XML' type='rotate' dur='2s' repeatCount='indefinite'/></circle>" +
            "</svg>"
    assertEquals(rte, repair(rte))
  }

  // region transform-box repair (the drifting "rotating globe")

  @Test
  fun `a transform-origin rule without transform-box gains fill-box`() {
    // Observed: `.globe{...;transform-origin:center}` — with the initial `transform-box:view-box`
    // the origin is the SVG VIEWPORT centre, so the globe ORBITS instead of spinning in place.
    val rte =
        "<style>.globe{animation:spin 5s linear infinite;transform-origin:center}</style>" +
            "<svg viewBox='0 0 300 100'><circle class='globe' cx='200' cy='50' r='30'/></svg>"
    val fixed = repair(rte)
    assertTrue(fixed.contains("transform-origin:center;transform-box:fill-box;"), fixed)
  }

  @Test
  fun `an existing trailing semicolon is not duplicated`() {
    val rte = "<style>.g{transform-origin:bottom center;}</style>"
    val fixed = repair(rte)
    assertTrue(fixed.contains("transform-origin:bottom center;transform-box:fill-box;}"), fixed)
    assertFalse(fixed.contains(";;"), fixed)
  }

  @Test
  fun `a rule that already declares transform-box is left alone`() {
    val rte = "<style>.g{transform-origin:center;transform-box:view-box;}</style>"
    assertEquals(rte, repair(rte))
  }

  @Test
  fun `a rule without transform-origin is left alone`() {
    val rte =
        "<style>@keyframes spin{to{transform:rotate(360deg);}} .g{animation:spin 5s linear}</style>"
    assertEquals(rte, repair(rte))
  }

  @Test
  fun `a nested reduced-motion rule keeps its block structure`() {
    val rte =
        "<style>@media (prefers-reduced-motion: reduce){.g{animation:none;} .h{transform-origin:center}}</style>"
    val fixed = repair(rte)
    // The inner `.h` rule is repaired, the outer @media wrapper and the untouched `.g` survive.
    assertTrue(fixed.contains(".h{transform-origin:center;transform-box:fill-box;}"), fixed)
    assertTrue(fixed.contains(".g{animation:none;}"), fixed)
    assertTrue(fixed.startsWith("<style>@media (prefers-reduced-motion: reduce){"), fixed)
  }

  @Test
  fun `transform-box repair is also exposed on its own for the unified assistant`() {
    val items =
        JsonParser.parseString(
                """[{"className":"XSpan","properties":{"name":"spText","rtevalue":"<style>.g{transform-origin:center}</style>"}}]""")
            .asJsonArray
    assertTrue(SvgNameRepair.repairTransformBoxes(items))
    val rte = items[0].asJsonObject.getAsJsonObject("properties").get("rtevalue").asString
    assertTrue(rte.contains("transform-box:fill-box;"), rte)
    // Second call: nothing left to repair.
    assertFalse(SvgNameRepair.repairTransformBoxes(items))
  }

  @Test
  fun `a transform-origin in ordinary prose is never touched`() {
    val rte = "<div><p>Set transform-origin:center on the shape.</p></div>"
    assertEquals(rte, repair(rte))
  }

  // endregion

  // region the animated `transform` vs. `transform` ATTRIBUTE conflict

  /**
   * The real markup of the run that produced the drift: the globe group carries a CSS-animated
   * `transform` class AND its own `transform` attribute, so the animation erases the translate and
   * the globe renders at the SVG origin.
   */
  private val driftingGlobe =
      "<style>@keyframes spG{to{transform:rotate(360deg);}} .spGlobe{animation:spG 10s linear infinite;transform-box:fill-box;transform-origin:center;}</style>" +
          "<svg viewBox='0 0 480 200'><g class='spGlobe' transform='translate(340,30)'><circle r='30'/></g></svg>"

  @Test
  fun `a transform attribute on an animated element is moved into a wrapper group`() {
    val fixed = repair(driftingGlobe)
    assertTrue(
        fixed.contains(
            "<g transform='translate(340,30)'><g class='spGlobe'><circle r='30'/></g></g>"),
        fixed)
    // The animated element itself must no longer carry the attribute.
    assertFalse(fixed.contains("class='spGlobe' transform="), fixed)
  }

  @Test
  fun `a self-closing animated element with a transform attribute is wrapped too`() {
    val rte =
        "<style>@keyframes spS{to{transform:rotate(360deg);}} .spSpin{animation:spS 4s linear infinite;}</style>" +
            "<svg viewBox='0 0 100 100'><circle class='spSpin' transform='translate(10,20)' r='5'/></svg>"
    val fixed = repair(rte)
    assertTrue(
        fixed.contains("<g transform='translate(10,20)'><circle class='spSpin' r='5'/></g>"), fixed)
  }

  @Test
  fun `an element whose animation does not change transform keeps its attribute`() {
    val rte =
        "<style>@keyframes spF{to{opacity:0;}} .spFade{animation:spF 2s linear infinite;}</style>" +
            "<svg viewBox='0 0 100 100'><g class='spFade' transform='translate(10,20)'><circle r='5'/></g></svg>"
    assertEquals(rte, repair(rte))
  }

  @Test
  fun `an animated transform element without a transform attribute is left alone`() {
    val rte =
        "<style>@keyframes spG{to{transform:rotate(360deg);}} .spGlobe{animation:spG 10s linear infinite;}</style>" +
            "<svg viewBox='0 0 100 100'><g class='spGlobe'><circle r='5'/></g></svg>"
    assertEquals(rte, repair(rte))
  }

  @Test
  fun `a keyframe that only changes transform-box relevant properties is not treated as animated`() {
    val rte =
        "<style>@keyframes spO{from{opacity:0;}to{opacity:1;}} .spIn{animation:spO 1s ease-out both;}</style>" +
            "<svg viewBox='0 0 100 100'><g class='spIn' transform='translate(4,4)'><rect width='9' height='9'/></g></svg>"
    assertEquals(rte, repair(rte))
  }

  @Test
  fun `the animated-transform repair is idempotent`() {
    val items =
        JsonParser.parseString(
                """[{"className":"XSpan","properties":{"name":"spText","rtevalue":"<style>@keyframes spG{to{transform:rotate(360deg);}} .spGlobe{animation:spG 10s linear infinite;}</style><svg viewBox='0 0 10 10'><g class='spGlobe' transform='translate(1,2)'><circle r='3'/></g></svg>"}}]""")
            .asJsonArray
    assertTrue(SvgNameRepair.repairAnimatedTransforms(items))
    val once = items[0].asJsonObject.getAsJsonObject("properties").get("rtevalue").asString
    assertTrue(once.contains("<g transform='translate(1,2)'><g class='spGlobe'>"), once)
    assertFalse(SvgNameRepair.repairAnimatedTransforms(items))
  }

  @Test
  fun `an unclosed svg never produces a dangling wrapper on malformed markup`() {
    // No `<style>` at all -> the fix is a no-op and the markup is returned byte-identical.
    val rte =
        "<svg viewBox='0 0 10 10'><g class='spGlobe' transform='translate(1,2)'><circle r='3'/></svg>"
    assertEquals(rte, repair(rte))
  }

  // endregion

  @Test
  fun `form without any XSpan is returned unchanged`() {
    val json =
        """{"items":[{"className":"XTextfield","properties":{"name":"tf1","id":"xi-tf1"}}]}"""
    assertEquals(json, SvgNameRepair.repairXSpanRtevalues(json))
  }

  @Test
  fun `invalid json never throws and is returned unchanged`() {
    val broken = """{"items":[{"className":"XSpan","properties":{"rtevalue":"<svg viewbox"""
    assertEquals(broken, SvgNameRepair.repairXSpanRtevalues(broken))
  }
}
