package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Regression tests for the per-page DOCUMENT build: where the pages of an attached document end up.
 *
 * Reported bug: the request said "the PDF's first page can be shown on the page 'Angaben', create a
 * new page for each of the other pages". The build produced three pages, but (a) page 1 was not
 * written into the existing page 'Angaben' - its whole first section was orphaned onto the LAST
 * page
 * - and (b) nothing carried a placement decision, so the page order could not be enforced.
 *
 * The page names are dictated by the server (`pdfP<n>`, or `p1` for an empty form) and the model
 * only decides WHERE the document's pages belong (`_documentPagePlacement`). These tests pin the
 * structural half: the model's decision is joined with the real page items, whatever shape the
 * answer has, and the created pages are put behind the anchor's SUBTREE.
 */
class DocumentPagePlacementTest {

  private val assistant = AICodBiAssistant()

  private fun invokeString(name: String, vararg args: Any?): String =
      AICodBiAssistant::class
          .java
          .declaredMethods
          .first { it.name == name && !it.isSynthetic }
          .apply { isAccessible = true }
          .invoke(assistant, *args) as String

  private fun invokeRaw(name: String, vararg args: Any?): Any? =
      AICodBiAssistant::class
          .java
          .declaredMethods
          .first { it.name == name && !it.isSynthetic }
          .apply { isAccessible = true }
          .invoke(assistant, *args)

  private fun invokePair(name: String, vararg args: Any?): Pair<String?, String> {
    @Suppress("UNCHECKED_CAST")
    return invokeRaw(name, *args) as Pair<String?, String>
  }

  private fun items(json: String): JsonArray =
      JsonParser.parseString(json).asJsonObject.getAsJsonArray("items")

  private fun names(json: String): List<String> =
      items(json).mapNotNull { el ->
        el.takeIf { it.isJsonObject }
            ?.asJsonObject
            ?.getAsJsonObject("properties")
            ?.get("name")
            ?.takeIf { it.isJsonPrimitive }
            ?.asString
      }

  private fun page(json: String, name: String): JsonObject? =
      items(json)
          .mapNotNull { it.takeIf { e -> e.isJsonObject }?.asJsonObject }
          .firstOrNull { o ->
            o.get("className")?.asString == "XPage" &&
                o.getAsJsonObject("properties")?.get("name")?.asString == name
          }

  /**
   * A spliced form: two existing pages with their own children, then the document's two new pages.
   */
  private fun splicedForm(): String =
      """
      {"items":[
        {"className":"XPage","properties":{"name":"Hinweise","id":"xi-p-1","elements":["tfH"]}},
        {"className":"XTextField","properties":{"name":"tfH","parentid":"Hinweise"}},
        {"className":"XPage","properties":{"name":"Angaben","id":"xi-p-3","elements":["tfA"]}},
        {"className":"XTextField","properties":{"name":"tfA","parentid":"Angaben"}},
        {"className":"XPage","properties":{"name":"pdfP2","elements":["tfB"]}},
        {"className":"XTextField","properties":{"name":"tfB","parentid":"pdfP2"}},
        {"className":"XPage","properties":{"name":"pdfP3","elements":["tfC"]}},
        {"className":"XTextField","properties":{"name":"tfC","parentid":"pdfP3"}}
      ]}
      """
          .trimIndent()

  @Test
  fun `replacePage puts the document pages behind the anchor page and its children`() {
    val out =
        invokeString(
            "placeDocumentPages",
            splicedForm(),
            listOf("Angaben", "pdfP2", "pdfP3"),
            "replacePage:Angaben",
            emptySet<String>())
    val order = names(out)
    assertEquals(8, order.size, "no item may be lost: $order")
    assertTrue(
        order.indexOf("tfA") < order.indexOf("pdfP2"),
        "the created page must not land between the anchor page and its own children: $order")
    assertTrue(order.indexOf("pdfP2") < order.indexOf("pdfP3"), "document order: $order")
    assertTrue(order.indexOf("Hinweise") < order.indexOf("Angaben"), "existing order kept: $order")
  }

  @Test
  fun `beforeAll and afterAll place the document pages in front of or behind every existing page`() {
    val front =
        names(
            invokeString(
                "placeDocumentPages",
                splicedForm(),
                listOf("pdfP2", "pdfP3"),
                "beforeAll",
                emptySet<String>()))
    assertTrue(front.indexOf("pdfP2") < front.indexOf("Hinweise"), "beforeAll: $front")
    val back =
        names(
            invokeString(
                "placeDocumentPages",
                splicedForm(),
                listOf("pdfP2", "pdfP3"),
                "afterAll",
                emptySet<String>()))
    assertTrue(
        back.indexOf("tfA") < back.indexOf("pdfP2"),
        "afterAll must follow the last page and its children: $back")
  }

  private fun desired(
      existing: List<String>,
      pageOrder: List<String>,
      placement: String?,
      requested: List<String> = emptyList()
  ): List<String> {
    @Suppress("UNCHECKED_CAST")
    return invokeRaw("desiredPageLayout", existing, pageOrder, placement, requested) as List<String>
  }

  private fun enforce(json: String, layout: List<String>): String {
    val field =
        AICodBiAssistant::class.java.getDeclaredField("documentPageLayout").apply {
          isAccessible = true
        }
    @Suppress("UNCHECKED_CAST") val holder = field.get(assistant) as ThreadLocal<List<String>?>
    holder.set(layout)
    val method =
        AICodBiAssistant::class
            .java
            .declaredMethods
            .first { it.name == "enforcePageLayout" && !it.isSynthetic }
            .apply { isAccessible = true }
    val root = JsonParser.parseString(json).asJsonObject
    method.invoke(assistant, root)
    return root.toString()
  }

  @Test
  fun `the captured layout keeps the form's own pages in their original order`() {
    assertEquals(
        listOf("Hinweise", "Angaben", "pdfP2", "pdfP3"),
        desired(
            listOf("Hinweise", "Angaben"),
            listOf("Angaben", "pdfP2", "pdfP3"),
            "replacePage:Angaben"))
    assertEquals(
        listOf("Hinweise", "Angaben", "pdfP1", "pdfP2"),
        desired(listOf("Hinweise", "Angaben"), listOf("pdfP1", "pdfP2"), "afterAll"))
    assertEquals(
        listOf("pdfP1", "pdfP2", "Hinweise", "Angaben"),
        desired(listOf("Hinweise", "Angaben"), listOf("pdfP1", "pdfP2"), "beforeAll"))
  }

  @Test
  fun `the page order the model read out of the request wins over the placement default`() {
    // "Die Seite 'Hinweise' soll die erste Seite sein" while the document's first page goes onto
    // "Angaben": the model states the whole order, and the server only applies it.
    assertEquals(
        listOf("Hinweise", "Angaben", "pdfP2", "pdfP3"),
        desired(
            listOf("Hinweise", "Angaben"),
            listOf("Angaben", "pdfP2", "pdfP3"),
            "replacePage:Angaben",
            listOf("Hinweise", "Angaben", "pdfP2", "pdfP3")))
    // The model may also decide that a document page comes FIRST - its reading of the intent
    // decides.
    assertEquals(
        listOf("pdfP1", "Hinweise", "Angaben"),
        desired(
            listOf("Hinweise", "Angaben"),
            listOf("pdfP1"),
            "afterAll",
            listOf("pdfP1", "Hinweise", "Angaben")))
    // A page the model did not mention is never dropped - it follows the ones it ordered.
    assertEquals(
        listOf("Hinweise", "Angaben", "pdfP1", "pdfP2"),
        desired(
            listOf("Hinweise", "Angaben"),
            listOf("pdfP1", "pdfP2"),
            "afterAll",
            listOf("Hinweise", "Angaben")))
  }

  @Test
  fun `the page-order marker is read and removed`() {
    val answer =
        invokeRaw(
            "takeDocumentPageOrder",
            """{"_diff":true,"_pageOrder":["Hinweise","Angaben","pdfP2"],"items":[]}""")
    @Suppress("UNCHECKED_CAST") val pair = answer as Pair<List<String>, String>
    assertEquals(listOf("Hinweise", "Angaben", "pdfP2"), pair.first)
    assertTrue(!pair.second.contains("_pageOrder"), "the marker must never reach the form")
  }

  @Test
  fun `the final step restores the page order the build decided`() {
    // The state observed after the post-processing chain: the form's own first page ended up BEHIND
    // the page the document was mapped onto.
    val broken =
        """
        {"items":[
          {"className":"XPage","properties":{"name":"Angaben","id":"xi-p-3","elements":["tfA"]}},
          {"className":"XTextField","properties":{"name":"tfA","parentid":"Angaben"}},
          {"className":"XPage","properties":{"name":"pdfP2","id":"xi-p-9","elements":["tfB"]}},
          {"className":"XTextField","properties":{"name":"tfB","parentid":"pdfP2"}},
          {"className":"XPage","properties":{"name":"Hinweise","id":"xi-p-1","elements":["tfH"]}},
          {"className":"XTextField","properties":{"name":"tfH","parentid":"Hinweise"}}
        ]}
        """
            .trimIndent()
    val out = enforce(broken, listOf("Hinweise", "Angaben", "pdfP2"))
    val pages = names(out).filter { it in setOf("Hinweise", "Angaben", "pdfP2") }
    assertEquals(listOf("Hinweise", "Angaben", "pdfP2"), pages)
    assertEquals(6, names(out).size, "no item may be lost: ${names(out)}")
    // The children still belong to their page.
    val tfA =
        page(out, "Angaben")!!.getAsJsonObject("properties").getAsJsonArray("elements")[0].asString
    assertEquals("tfA", tfA)
  }

  @Test
  fun `a pre-existing page is never relocated, even when the answer names it`() {
    val out =
        invokeString(
            "placeDocumentPages",
            splicedForm(),
            listOf("Hinweise", "pdfP2"),
            "afterAll",
            setOf("Hinweise", "Angaben"))
    val order = names(out)
    assertTrue(
        order.indexOf("Hinweise") < order.indexOf("Angaben"),
        "an existing page must never be moved by the placement: $order")
    assertTrue(
        order.indexOf("pdfP2") > order.indexOf("tfA"), "the created page still goes last: $order")
  }

  @Test
  fun `an answer without any page item is wrapped into the designated existing page`() {
    val answer =
        """{"_diff":true,"items":[{"className":"XTextField","properties":{"name":"tfNeu"}}]}"""
    val out =
        invokeString(
            "adoptIntoExistingPage", answer, "Angaben", "xi-p-3", setOf("Hinweise", "Angaben"))
    val angaben = page(out, "Angaben")
    assertNotNull(angaben, "the elements must be put on the designated page: $out")
    assertEquals("xi-p-3", angaben!!.getAsJsonObject("properties").get("id").asString)
    assertEquals(
        listOf("tfNeu"),
        angaben.getAsJsonObject("properties").getAsJsonArray("elements").map { it.asString })
    assertEquals(
        "Angaben",
        items(out)[1].asJsonObject.getAsJsonObject("properties").get("parentid").asString)
  }

  @Test
  fun `a page the model created under another name is renamed onto the designated page`() {
    val answer =
        """
        {"_diff":true,"items":[
          {"className":"XPage","properties":{"name":"p1","elements":["tfNeu"]}},
          {"className":"XTextField","properties":{"name":"tfNeu","parentid":"p1"}}
        ]}
        """
            .trimIndent()
    val out =
        invokeString(
            "adoptIntoExistingPage", answer, "Angaben", "xi-p-3", setOf("Hinweise", "Angaben"))
    assertNotNull(page(out, "Angaben"), "the created page must be renamed: $out")
    assertTrue(page(out, "p1") == null, "the old page name must be gone: $out")
    assertEquals(
        "Angaben",
        items(out)[1].asJsonObject.getAsJsonObject("properties").get("parentid").asString)
  }

  @Test
  fun `a page carried by the answer under another name is renamed to the dictated name`() {
    val answer =
        """
        {"_diff":true,"items":[
          {"className":"XPage","properties":{"name":"Seite2","elements":["tfB"]}},
          {"className":"XTextField","properties":{"name":"tfB","parentid":"Seite2"}}
        ]}
        """
            .trimIndent()
    val out = invokeString("forceCreatedPageName", answer, "pdfP2", emptySet<String>())
    assertNotNull(page(out, "pdfP2"), "the page name is dictated by the server: $out")
    assertEquals(
        "pdfP2", items(out)[1].asJsonObject.getAsJsonObject("properties").get("parentid").asString)
  }

  @Test
  fun `wrapping keeps the nesting of containers inside the answer`() {
    val answer =
        """
        {"_diff":true,"items":[
          {"className":"XContainer","properties":{"name":"c1","elements":["tfIn"]}},
          {"className":"XTextField","properties":{"name":"tfIn","parentid":"c1"}}
        ]}
        """
            .trimIndent()
    val out = invokeString("forceCreatedPageName", answer, "pdfP1", emptySet<String>())
    assertNotNull(page(out, "pdfP1"), "the elements must get a page: $out")
    val c1 = items(out)[1].asJsonObject.getAsJsonObject("properties")
    val tfIn = items(out)[2].asJsonObject.getAsJsonObject("properties")
    assertEquals(
        "pdfP1", c1.get("parentid").asString, "the top-level container belongs to the page")
    assertEquals("c1", tfIn.get("parentid").asString, "the nested field keeps its container")
  }

  @Test
  fun `the placement marker is read and removed`() {
    val (mode, withoutMarker) =
        invokePair(
            "takeDocumentPlacement",
            """{"_diff":true,"_documentPagePlacement":"replacePage:Angaben","items":[]}""")
    assertEquals("replacePage:Angaben", mode)
    assertTrue(
        !withoutMarker.contains("_documentPagePlacement"), "the marker must never reach the form")
  }
}
