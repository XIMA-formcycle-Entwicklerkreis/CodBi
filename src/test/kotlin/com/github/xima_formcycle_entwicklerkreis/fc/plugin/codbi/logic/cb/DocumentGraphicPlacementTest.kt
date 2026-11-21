package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons.DocumentGraphic
import com.google.gson.JsonParser
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Regression tests for the DOCUMENT GRAPHIC token substitution.
 *
 * Reported bug: an apple added to the source PDF as a vector graphic never appeared in the
 * generated form. The build now only PLACES a graphic - it writes `{{GRAPHIC:<id>}}` into an
 * XSpan's `rtevalue` - and the server writes the exact artwork (inline SVG / image data URI) into
 * that element. These tests pin that contract.
 */
class DocumentGraphicPlacementTest {

  private val assistant = AICodBiAssistant()

  private fun place(form: String, assets: Map<String, DocumentGraphic>): String =
      AICodBiAssistant::class
          .java
          .declaredMethods
          .first { it.name == "applyDocumentGraphics" && !it.isSynthetic }
          .apply { isAccessible = true }
          .invoke(assistant, form, assets) as String

  private fun vector(id: String = "g1_1") =
      DocumentGraphic(
          id = id,
          pageNo = 1,
          kind = DocumentGraphic.Kind.VECTOR,
          widthPt = 170.0,
          heightPt = 180.0,
          topFraction = 0.1,
          svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M0 0L1 1\"/></svg>")

  private fun raster(id: String = "g1_2") =
      DocumentGraphic(
          id = id,
          pageNo = 1,
          kind = DocumentGraphic.Kind.RASTER,
          widthPt = 200.0,
          heightPt = 150.0,
          topFraction = 0.5,
          dataUri = "data:image/png;base64,AAAA")

  private fun elements(json: String, container: String): List<String> =
      JsonParser.parseString(json)
          .asJsonObject
          .getAsJsonArray("items")
          .mapNotNull { it.takeIf { e -> e.isJsonObject }?.asJsonObject }
          .first { o -> o.getAsJsonObject("properties")?.get("name")?.asString == container }
          .getAsJsonObject("properties")
          .getAsJsonArray("elements")
          .map { it.asString }

  private fun rtevalue(json: String, name: String): String =
      JsonParser.parseString(json)
          .asJsonObject
          .getAsJsonArray("items")
          .mapNotNull { it.takeIf { e -> e.isJsonObject }?.asJsonObject }
          .first { o -> o.getAsJsonObject("properties")?.get("name")?.asString == name }
          .getAsJsonObject("properties")
          .get("rtevalue")
          .asString

  private fun parentId(json: String, name: String): String? =
      JsonParser.parseString(json)
          .asJsonObject
          .getAsJsonArray("items")
          .mapNotNull { it.takeIf { e -> e.isJsonObject }?.asJsonObject }
          .first { o -> o.getAsJsonObject("properties")?.get("name")?.asString == name }
          .getAsJsonObject("properties")
          .get("parentid")
          ?.asString

  @Test
  fun `a vector token becomes the exact inline SVG`() {
    val form =
        """{"items":[{"className":"XSpan","properties":{"name":"spLogo","rtevalue":"{{GRAPHIC:g1_1}}"}}]}"""

    val out = place(form, mapOf("g1_1" to vector()))

    assertFalse(out.contains("{{GRAPHIC:"), "the token must be gone")
    assertEquals(vector().svg, rtevalue(out, "spLogo"))
  }

  @Test
  fun `a bitmap token becomes an img with the data URI`() {
    val form =
        """{"items":[{"className":"XSpan","properties":{"name":"spFoto","rtevalue":"{{GRAPHIC:g1_2}}"}}]}"""

    val out = place(form, mapOf("g1_2" to raster()))

    val html = rtevalue(out, "spFoto")
    assertTrue(html.startsWith("<img src='data:image/png;base64,AAAA'"), "html was: $html")
  }

  @Test
  fun `the token may sit inside surrounding markup`() {
    val form =
        """{"items":[{"className":"XSpan","properties":{"name":"spHead","rtevalue":"<h2>Antrag</h2>{{GRAPHIC:g1_1}}"}}]}"""

    val out = place(form, mapOf("g1_1" to vector()))

    assertEquals("<h2>Antrag</h2>" + vector().svg, rtevalue(out, "spHead"))
  }

  @Test
  fun `a form without a token is left untouched`() {
    val form =
        """{"items":[{"className":"XSpan","properties":{"name":"spText","rtevalue":"Hallo"}}]}"""

    assertEquals(form, place(form, mapOf("g1_1" to vector())))
  }

  @Test
  fun `an unknown id stays literal instead of breaking the form`() {
    val form =
        """{"items":[{"className":"XSpan","properties":{"name":"spX","rtevalue":"{{GRAPHIC:g9_9}}"}}]}"""

    val out = place(form, mapOf("g1_1" to vector()))

    assertEquals("{{GRAPHIC:g9_9}}", rtevalue(out, "spX"))
  }

  /** The graphic XSpan sits in the wrong slot of its page (the reported "one section too low"). */
  private fun anchoredForm(): String =
      """{"items":[
           {"className":"XPage","properties":{"name":"pdfP1","id":"xi-p1","elements":["spIntro","spNext","spApple"]}},
           {"className":"XSpan","properties":{"name":"spIntro","id":"xi-1","rtevalue":"<h3>Anlage 1</h3>"}},
           {"className":"XSpan","properties":{"name":"spNext","id":"xi-2","rtevalue":"Bitte ankreuzen"}},
           {"className":"XSpan","properties":{"name":"spApple","id":"xi-3","parentid":"pdfP1","rtevalue":"{{GRAPHIC:g1_1}}"}}
         ]}"""

  @Test
  fun `the graphic is moved directly after the printed line above it`() {
    val asset = vector().copy(anchorAbove = "Anlage 1", anchorBelow = "Bitte ankreuzen")

    val out = place(anchoredForm(), mapOf("g1_1" to asset))

    assertEquals(listOf("spIntro", "spApple", "spNext"), elements(out, "pdfP1"))
  }

  @Test
  fun `the graphic is moved directly before the printed line below it`() {
    val asset = vector().copy(anchorAbove = null, anchorBelow = "bitte ankreuzen")

    val out = place(anchoredForm(), mapOf("g1_1" to asset))

    assertEquals(listOf("spIntro", "spApple", "spNext"), elements(out, "pdfP1"))
  }

  @Test
  fun `without a matching printed line the graphic keeps the slot the build chose`() {
    val out = place(anchoredForm(), mapOf("g1_1" to vector()))

    assertEquals(listOf("spIntro", "spNext", "spApple"), elements(out, "pdfP1"))
  }

  /**
   * The REAL Formcycle shape: `parentid` references the container's ID (`xi-p1`), never its name.
   * Looking the container up by name is what made every re-anchoring a silent no-op.
   */
  private fun idParentForm(): String =
      """{"items":[
           {"className":"XPage","properties":{"name":"pdfP1","id":"xi-p1","elements":["spIntro","spNext","spApple"]}},
           {"className":"XSpan","properties":{"name":"spIntro","id":"xi-1","parentid":"xi-p1","rtevalue":"<h3>Anlage 1</h3>"}},
           {"className":"XSpan","properties":{"name":"spNext","id":"xi-2","parentid":"xi-p1","rtevalue":"Bitte ankreuzen"}},
           {"className":"XSpan","properties":{"name":"spApple","id":"xi-3","parentid":"xi-p1","rtevalue":"{{GRAPHIC:g1_1}}"}}
         ]}"""

  @Test
  fun `an id based parentid still finds the container`() {
    val asset = vector().copy(anchorAbove = "Anlage 1")

    val out = place(idParentForm(), mapOf("g1_1" to asset))

    assertEquals(listOf("spIntro", "spApple", "spNext"), elements(out, "pdfP1"))
  }

  @Test
  fun `a graphic without any parentid is anchored through its container elements array`() {
    // A model that forgets `parentid` entirely must still be anchored - the container is then found
    // through the containers' `elements` arrays alone.
    val form =
        """{"items":[
             {"className":"XPage","properties":{"name":"pdfP1","id":"xi-p1","elements":["spIntro","spNext","spApple"]}},
             {"className":"XSpan","properties":{"name":"spIntro","id":"xi-1","rtevalue":"<h3>Anlage 1</h3>"}},
             {"className":"XSpan","properties":{"name":"spNext","id":"xi-2","rtevalue":"Bitte ankreuzen"}},
             {"className":"XSpan","properties":{"name":"spApple","id":"xi-3","rtevalue":"{{GRAPHIC:g1_1}}"}}
           ]}"""
    val asset = vector().copy(anchorAbove = "Anlage 1")

    val out = place(form, mapOf("g1_1" to asset))

    assertEquals(listOf("spIntro", "spApple", "spNext"), elements(out, "pdfP1"))
    assertEquals("xi-p1", parentId(out, "spApple"), "the container id must be re-pointed")
  }

  /** The printed line above the drawing lives in a nested block, not next to the graphic. */
  private fun nestedAnchorForm(): String =
      """{"items":[
           {"className":"XPage","properties":{"name":"pdfP1","id":"xi-p1","elements":["fsAdresse","spNext","spApple"]}},
           {"className":"XFieldSet","properties":{"name":"fsAdresse","id":"xi-fs-1","parentid":"xi-p1","elements":["spIntro","tfStreet"]}},
           {"className":"XSpan","properties":{"name":"spIntro","id":"xi-1","parentid":"xi-fs-1","rtevalue":"<h3>Anlage 1</h3>"}},
           {"className":"XTextField","properties":{"name":"tfStreet","id":"xi-2","parentid":"xi-fs-1","label":"Strasse"}},
           {"className":"XSpan","properties":{"name":"spNext","id":"xi-4","parentid":"xi-p1","rtevalue":"Bitte ankreuzen"}},
           {"className":"XSpan","properties":{"name":"spApple","id":"xi-3","parentid":"xi-p1","rtevalue":"{{GRAPHIC:g1_1}}"}}
         ]}"""

  @Test
  fun `an anchor inside a nested block moves the graphic behind that block`() {
    val asset = vector().copy(anchorAbove = "Anlage 1", anchorBelow = "Bitte ankreuzen")

    val out = place(nestedAnchorForm(), mapOf("g1_1" to asset))

    // After the fieldset that PRINTS the line - never inside it (that would push the drawing into
    // the fieldset's own two-column layout).
    assertEquals(listOf("fsAdresse", "spApple", "spNext"), elements(out, "pdfP1"))
    assertEquals(listOf("spIntro", "tfStreet"), elements(out, "fsAdresse"))
    assertEquals("xi-p1", parentId(out, "spApple"))
  }

  @Test
  fun `a printed line truncated by the extractor still anchors the graphic`() {
    val long =
        "Die nachfolgend aufgefuehrten Unterlagen sind vollstaendig beizufuegen, andernfalls kann der Antrag nicht bearbeitet werden"
    val form =
        """{"items":[
             {"className":"XPage","properties":{"name":"pdfP1","id":"xi-p1","elements":["spApple","spLong"]}},
             {"className":"XSpan","properties":{"name":"spApple","id":"xi-3","parentid":"xi-p1","rtevalue":"{{GRAPHIC:g1_1}}"}},
             {"className":"XSpan","properties":{"name":"spLong","id":"xi-4","parentid":"xi-p1","rtevalue":"$long"}}
           ]}"""
    // The extractor stores a printed line as 87 chars + "..." (see DocumentGraphics.Lines).
    val asset = vector().copy(anchorAbove = long.take(87) + "...")

    val out = place(form, mapOf("g1_1" to asset))

    assertEquals(listOf("spLong", "spApple"), elements(out, "pdfP1"))
  }

  @Test
  fun `a graphic the build parked in the WRONG container is moved to the printed line`() {
    val form =
        """{"items":[
             {"className":"XPage","properties":{"name":"pdfP1","id":"xi-p1","elements":["fsWrong","fsAdresse","spNext"]}},
             {"className":"XFieldSet","properties":{"name":"fsWrong","id":"xi-fs-w","parentid":"xi-p1","elements":["spApple"]}},
             {"className":"XSpan","properties":{"name":"spApple","id":"xi-3","parentid":"xi-fs-w","rtevalue":"{{GRAPHIC:g1_1}}"}},
             {"className":"XFieldSet","properties":{"name":"fsAdresse","id":"xi-fs-1","parentid":"xi-p1","elements":["spIntro"]}},
             {"className":"XSpan","properties":{"name":"spIntro","id":"xi-1","parentid":"xi-fs-1","rtevalue":"Anlage 1"}},
             {"className":"XSpan","properties":{"name":"spNext","id":"xi-4","parentid":"xi-p1","rtevalue":"Bitte ankreuzen"}}
           ]}"""
    val asset = vector().copy(anchorAbove = "Anlage 1")

    val out = place(form, mapOf("g1_1" to asset))

    // Out of the container the build guessed, into the page, directly behind the block that prints
    // the line - the flow order now matches the document.
    assertEquals(listOf("fsWrong", "fsAdresse", "spApple", "spNext"), elements(out, "pdfP1"))
    assertEquals(emptyList<String>(), elements(out, "fsWrong"))
    assertEquals("xi-p1", parentId(out, "spApple"), "the new container must own the element")
  }

  @Test
  fun `an anchor printed on another page never moves the graphic`() {
    val form =
        """{"items":[
             {"className":"XPage","properties":{"name":"pdfP1","id":"xi-p1","elements":["spApple"]}},
             {"className":"XPage","properties":{"name":"pdfP2","id":"xi-p2","elements":["spOther"]}},
             {"className":"XSpan","properties":{"name":"spApple","id":"xi-3","parentid":"xi-p1","rtevalue":"{{GRAPHIC:g1_1}}"}},
             {"className":"XSpan","properties":{"name":"spOther","id":"xi-4","parentid":"xi-p2","rtevalue":"Anlage 1"}}
           ]}"""
    val asset = vector().copy(anchorAbove = "Anlage 1")

    val out = place(form, mapOf("g1_1" to asset))

    assertEquals(listOf("spApple"), elements(out, "pdfP1"))
    assertEquals(listOf("spOther"), elements(out, "pdfP2"))
  }
}
