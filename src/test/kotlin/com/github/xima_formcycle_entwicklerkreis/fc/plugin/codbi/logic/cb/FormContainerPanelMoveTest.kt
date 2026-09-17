package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonArray
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

/**
 * Tests for [AICodBiAssistant]'s `stripPanelFromInnerContainerWrappedByNewPanel`.
 *
 * The prompt "the weekday container should no longer be the collapsible panel itself, but a
 * container AROUND the weekday container" makes the AI create a NEW outer wrapper carrying the
 * HTML.Panel and remove the panel attributes from the inner container. The generic restore in
 * `restoreStrippedFields` then re-adds the ORIGINAL `attributes` (with `html.panel`) onto the inner
 * container because the AI omitted that key — producing TWO nested collapsible panels. The guard
 * removes the duplicated panel from the INNER container, but ONLY when its parent is an AI-created
 * panel wrapper (a container that did not exist in the original form).
 */
class FormContainerPanelMoveTest {

  private val assistant = AICodBiAssistant()

  private val panelAttrs =
      """{"text":"data-cb-func","value":"html.panel"},""" +
          """{"text":"data-cb-generateheader","value":"true"},""" +
          """{"text":"data-cb-autoheadertitle","value":"\u00d6ffnungszeiten"}"""

  private val accordionAttrs =
      """{"text":"data-cb-func","value":"HTML.Panel.Accordion"},""" +
          """{"text":"data-cb-Accordion","value":"accordionGroup"}"""

  private fun container(
      name: String,
      id: String,
      parent: String?,
      elements: String,
      attrs: String
  ): String {
    val parentProp = if (parent == null) "" else ""","parentid":"$parent""""
    val attrsProp = if (attrs.isEmpty()) "" else ""","attributes":[$attrs]"""
    return """{"className":"XContainer","properties":{"name":"$name","id":"$id","elements":[$elements]$parentProp$attrsProp}}"""
  }

  private fun runGuard(result: String, original: String): JsonArray {
    val resultArr = JsonParser.parseString(result).asJsonArray
    val originalArr = JsonParser.parseString(original).asJsonArray
    AICodBiAssistant::class
        .java
        .getDeclaredMethod(
            "stripPanelFromInnerContainerWrappedByNewPanel",
            JsonArray::class.java,
            JsonArray::class.java)
        .apply { isAccessible = true }
        .invoke(assistant, resultArr, originalArr)
    return resultArr
  }

  private fun propsOf(arr: JsonArray, name: String) =
      arr.mapNotNull { it.takeIf { e -> e.isJsonObject }?.asJsonObject }
          .firstOrNull { it.getAsJsonObject("properties")?.get("name")?.asString == name }
          ?.getAsJsonObject("properties")

  private fun attrsOf(arr: JsonArray, name: String): List<String> {
    val attrs = propsOf(arr, name)?.getAsJsonArray("attributes") ?: return emptyList()
    return attrs.map { a ->
      val o = a.asJsonObject
      "${o.get("text")?.asString}=${o.get("value")?.asString}"
    }
  }

  private fun propOf(arr: JsonArray, name: String, key: String): String? =
      propsOf(arr, name)?.get(key)?.takeIf { it.isJsonPrimitive }?.asString

  @Test
  fun stripsInnerPanelWhenMovedToNewOuterWrapper() {
    val acc = container("coAccordionWrapper", "xi-acc", null, """"coOuter"""", accordionAttrs)
    val outer = container("coOuter", "xi-outer", "xi-acc", """"coInner"""", panelAttrs)
    val inner = container("coInner", "xi-inner", "xi-outer", """"selWeekday"""", panelAttrs)
    val result = "[$acc,$outer,$inner]"

    // Original: accordion wrapper + inner container (panel) — the outer wrapper does NOT exist yet.
    val accOld = container("coAccordionWrapper", "xi-acc", null, """"coInner"""", accordionAttrs)
    val innerOld = container("coInner", "xi-inner", "xi-acc", """"selWeekday"""", panelAttrs)
    val sel = """{"className":"XSelect","properties":{"name":"selWeekday","id":"xi-sel"}}"""
    val original = "[$accOld,$innerOld,$sel]"

    val arr = runGuard(result, original)

    // The inner container's duplicated panel is gone ...
    assertEquals(emptyList<String>(), attrsOf(arr, "coInner"))
    // ... the new outer wrapper KEEPS the panel ...
    assertEquals(
        listOf(
            "data-cb-func=html.panel",
            "data-cb-generateheader=true",
            "data-cb-autoheadertitle=\u00d6ffnungszeiten"),
        attrsOf(arr, "coOuter"))
    // ... and the accordion wrapper (HTML.Panel.Accordion, NOT html.panel) is untouched.
    assertEquals(
        listOf("data-cb-func=HTML.Panel.Accordion", "data-cb-Accordion=accordionGroup"),
        attrsOf(arr, "coAccordionWrapper"))
  }

  @Test
  fun keepsInnerPanelWhenWrapperAlreadyExistedInOriginal() {
    val acc = container("coAccordionWrapper", "xi-acc", null, """"coOuter"""", accordionAttrs)
    val outer = container("coOuter", "xi-outer", "xi-acc", """"coInner"""", panelAttrs)
    val inner = container("coInner", "xi-inner", "xi-outer", """"selWeekday"""", panelAttrs)
    val result = "[$acc,$outer,$inner]"

    // Original ALREADY contains the outer wrapper → this is NOT the "panel was moved" case.
    val accOld = container("coAccordionWrapper", "xi-acc", null, """"coOuter"""", accordionAttrs)
    val outerOld = container("coOuter", "xi-outer", "xi-acc", """"coInner"""", panelAttrs)
    val innerOld = container("coInner", "xi-inner", "xi-outer", """"selWeekday"""", panelAttrs)
    val original = "[$accOld,$outerOld,$innerOld]"

    val arr = runGuard(result, original)
    assertEquals(
        listOf(
            "data-cb-func=html.panel",
            "data-cb-generateheader=true",
            "data-cb-autoheadertitle=\u00d6ffnungszeiten"),
        attrsOf(arr, "coInner"))
  }

  @Test
  fun doesNotStripWhenParentIsNotAPanel() {
    val acc = container("coAccordionWrapper", "xi-acc", null, """"coWrapper"""", accordionAttrs)
    val wrapper = container("coWrapper", "xi-w", "xi-acc", """"coInner"""", "")
    val inner = container("coInner", "xi-inner", "xi-w", """"selWeekday"""", panelAttrs)
    val result = "[$acc,$wrapper,$inner]"

    val accOld = container("coAccordionWrapper", "xi-acc", null, """"coInner"""", accordionAttrs)
    val innerOld = container("coInner", "xi-inner", "xi-acc", """"selWeekday"""", panelAttrs)
    val original = "[$accOld,$innerOld]"

    val arr = runGuard(result, original)
    assertEquals(
        listOf(
            "data-cb-func=html.panel",
            "data-cb-generateheader=true",
            "data-cb-autoheadertitle=\u00d6ffnungszeiten"),
        attrsOf(arr, "coInner"))
  }

  @Test
  fun stripsInnerPanelInDirectKeyForm() {
    // The AI/restore sometimes keeps data-cb-* as direct property keys instead of the array form.
    val acc =
        """{"className":"XContainer","properties":{"name":"coAccordionWrapper","id":"xi-acc","elements":["coOuter"]}}"""
    val outer =
        """{"className":"XContainer","properties":{"name":"coOuter","id":"xi-outer","parentid":"xi-acc","elements":["coInner"],"data-cb-func":"html.panel"}}"""
    val inner =
        """{"className":"XContainer","properties":{"name":"coInner","id":"xi-inner","parentid":"xi-outer","elements":["selWeekday"],"data-cb-func":"html.panel","data-cb-generateheader":"true","data-cb-folded":"true"}}"""
    val result = "[$acc,$outer,$inner]"

    val accOld =
        """{"className":"XContainer","properties":{"name":"coAccordionWrapper","id":"xi-acc","elements":["coInner"]}}"""
    val innerOld =
        """{"className":"XContainer","properties":{"name":"coInner","id":"xi-inner","parentid":"xi-acc","elements":["selWeekday"],"data-cb-func":"html.panel"}}"""
    val original = "[$accOld,$innerOld]"

    val arr = runGuard(result, original)
    assertNull(propOf(arr, "coInner", "data-cb-func"))
    assertNull(propOf(arr, "coInner", "data-cb-generateheader"))
    assertNull(propOf(arr, "coInner", "data-cb-folded"))
    // The outer wrapper is untouched.
    assertEquals("html.panel", propOf(arr, "coOuter", "data-cb-func"))
  }
}
