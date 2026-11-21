package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import java.awt.Color
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.pdmodel.PDPage
import org.apache.pdfbox.pdmodel.PDPageContentStream
import org.apache.pdfbox.pdmodel.common.PDRectangle
import org.apache.pdfbox.pdmodel.font.PDType1Font
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Regression tests for [DocumentGraphics].
 *
 * Reported bug: an apple added to the source PDF as a VECTOR graphic never appeared in the
 * generated form, even when the page was rasterised - a graphic is not a printed "entry", so
 * nothing asked for it, and a vision model can only approximate what it sees. These tests pin the
 * two extraction paths (vector paths -> inline SVG, embedded bitmap -> PNG data URI) and the
 * filters that keep table rules and page backgrounds out.
 */
class DocumentGraphicsTest {

  private fun pdf(build: (PDDocument, PDPage, PDPageContentStream) -> Unit): ByteArray {
    PDDocument().use { document ->
      val page = PDPage(PDRectangle.A4)
      document.addPage(page)
      PDPageContentStream(document, page).use { content -> build(document, page, content) }
      val out = ByteArrayOutputStream()
      document.save(out)
      return out.toByteArray()
    }
  }

  @Test
  fun `a filled vector path becomes an inline SVG asset`() {
    val bytes = pdf { _, _, content ->
      // A rounded, apple-like silhouette drawn with two Bézier curves.
      content.setNonStrokingColor(Color(0xE3, 0x06, 0x13))
      content.moveTo(100f, 400f)
      content.curveTo(120f, 470f, 250f, 470f, 270f, 400f)
      content.curveTo(290f, 330f, 220f, 290f, 185f, 290f)
      content.curveTo(150f, 290f, 80f, 330f, 100f, 400f)
      content.fill()
      content.close()
    }

    val graphics = DocumentGraphics.extract(bytes)[1].orEmpty()

    assertEquals(1, graphics.size, "the drawing must be extracted as ONE graphic")
    val apple = graphics.first()
    assertEquals(DocumentGraphic.Kind.VECTOR, apple.kind)
    assertEquals("g1_1", apple.id)
    assertTrue(apple.svg!!.startsWith("<svg"), "the asset must be inline SVG")
    assertTrue(apple.svg.contains("<path d=\"M"), "the path must be inside the SVG")
    assertTrue(apple.svg.contains("fill=\"#e30613\""), "the fill colour must be kept")
    // The box is computed from the Bézier CONTROL points, so it is a few points wider than the
    // painted curve - irrelevant for placement, and it never clips the drawing.
    assertTrue(apple.widthPt in 150.0..230.0, "width in points: ${apple.widthPt}")
    assertTrue(apple.heightPt in 150.0..230.0, "height in points: ${apple.heightPt}")
    assertTrue(apple.describe().contains("{{GRAPHIC:g1_1}}"), "the prompt line names the token")
  }

  @Test
  fun `hairline separators are layout, not graphics`() {
    val bytes = pdf { _, _, content ->
      content.setStrokingColor(Color.BLACK)
      content.setLineWidth(0.5f)
      for (y in listOf(700f, 650f, 600f)) {
        content.moveTo(60f, y)
        content.lineTo(535f, y)
        content.stroke()
      }
      content.close()
    }

    assertTrue(DocumentGraphics.extract(bytes).isEmpty(), "table rules must not become assets")
  }

  @Test
  fun `a page-filling background fill is not a graphic`() {
    val bytes = pdf { _, page, content ->
      content.setNonStrokingColor(Color(240, 240, 246))
      content.addRect(0f, 0f, page.mediaBox.width, page.mediaBox.height)
      content.fill()
      content.close()
    }

    assertTrue(
        DocumentGraphics.extract(bytes).isEmpty(),
        "a background covering the page is the page, not artwork on it")
  }

  @Test
  fun `an embedded bitmap becomes a PNG data URI`() {
    val bytes = pdf { document, _, content ->
      val image = BufferedImage(200, 150, BufferedImage.TYPE_INT_RGB)
      val g = image.createGraphics()
      g.color = Color(0x33, 0x99, 0x33)
      g.fillOval(10, 10, 180, 130)
      g.dispose()
      content.drawImage(LosslessFactory.createFromImage(document, image), 120f, 600f, 200f, 150f)
      content.close()
    }

    val graphics = DocumentGraphics.extract(bytes)[1].orEmpty()

    assertEquals(1, graphics.size)
    val logo = graphics.first()
    assertEquals(DocumentGraphic.Kind.RASTER, logo.kind)
    assertTrue(logo.dataUri!!.startsWith("data:image/png;base64,"), "bitmap becomes a data URI")
    assertTrue(logo.html.startsWith("<img src='data:image/png;base64,"), "the html places an <img>")
    assertEquals(200.0, logo.widthPt)
    assertEquals(150.0, logo.heightPt)
  }

  @Test
  fun `a graphic is anchored between the printed lines around it`() {
    val bytes = pdf { _, _, content ->
      content.setFont(PDType1Font.HELVETICA, 12f)
      content.beginText()
      content.newLineAtOffset(72f, 560f)
      content.showText("Anlage 1 - Uebersicht")
      content.endText()
      content.setNonStrokingColor(Color(0xE3, 0x06, 0x13))
      content.addRect(100f, 400f, 150f, 100f)
      content.fill()
      content.beginText()
      content.newLineAtOffset(72f, 360f)
      content.showText("Bitte ankreuzen")
      content.endText()
      content.close()
    }

    val graphic = DocumentGraphics.extract(bytes)[1].orEmpty().first()

    assertTrue(
        graphic.anchorAbove?.contains("Anlage 1") == true, "line above was: ${graphic.anchorAbove}")
    assertTrue(
        graphic.anchorBelow?.contains("Bitte ankreuzen") == true,
        "line below was: ${graphic.anchorBelow}")
    assertTrue(
        graphic.describe().contains("directly BELOW the printed line 'Anlage 1"),
        "prompt line was: ${graphic.describe()}")
  }

  @Test
  fun `a stroke frame around a drawing is not part of the drawing`() {
    val bytes = pdf { _, _, content ->
      // A table cell / frame stroke around the artwork, as a form page is full of them.
      content.setStrokingColor(Color.BLACK)
      content.setLineWidth(1f)
      content.addRect(60f, 300f, 320f, 260f)
      content.stroke()
      // The actual artwork inside it.
      content.setNonStrokingColor(Color(0x33, 0x99, 0x33))
      content.addRect(150f, 380f, 80f, 60f)
      content.fill()
      content.close()
    }

    val graphics = DocumentGraphics.extract(bytes)[1].orEmpty()

    assertEquals(1, graphics.size, "the frame must not become a second graphic")
    val artwork = graphics.first()
    assertTrue(
        artwork.widthPt in 70.0..140.0,
        "the box must be the drawing's ink, not the frame (was ${artwork.widthPt})")
    assertTrue(
        artwork.heightPt in 50.0..130.0,
        "the box must be the drawing's ink, not the frame (was ${artwork.heightPt})")
  }

  @Test
  fun `a stroke-only cell box is layout, not a graphic`() {
    val bytes = pdf { _, _, content ->
      content.setStrokingColor(Color.BLACK)
      content.setLineWidth(1f)
      content.addRect(60f, 300f, 320f, 260f)
      content.stroke()
      content.close()
    }

    assertTrue(DocumentGraphics.extract(bytes).isEmpty(), "a plain cell box is not artwork")
  }

  @Test
  fun `non-PDF bytes yield no graphics`() {
    assertTrue(DocumentGraphics.extract(byteArrayOf(1, 2, 3, 4)).isEmpty())
  }

  /**
   * The reported "the apple moved further DOWN" run extracted TEN graphics from a three-page form,
   * nine of which were layout: three rows of printed checkbox glyphs (`484x13 pt`). Rendering them
   * as artwork added vertical space above the drawing and pushed it down the generated form.
   */
  @Test
  fun `a row of printed checkbox glyphs is layout, not a graphic`() {
    val bytes = pdf { _, _, content ->
      content.setNonStrokingColor(Color.BLACK)
      // Six filled squares in one line, close enough to be clustered as ONE object.
      for (i in 0 until 6) {
        content.addRect(60f + i * 13f, 300f, 9f, 9f)
        content.fill()
      }
      content.close()
    }

    assertTrue(
        DocumentGraphics.extract(bytes).isEmpty(),
        "a row of small squares is a row of glyphs, not one drawing")
  }

  @Test
  fun `a full-width ruled band is layout, not a graphic`() {
    val bytes = pdf { _, _, content ->
      content.setNonStrokingColor(Color(0xEE, 0xEE, 0xEE))
      // A shaded band across the whole text column, as a boxed headline band is printed.
      content.addRect(60f, 400f, 475f, 60f)
      content.fill()
      content.close()
    }

    assertTrue(
        DocumentGraphics.extract(bytes).isEmpty(),
        "a strip spanning the text column is layout, not artwork")
  }

  @Test
  fun `a mark crossed by the printed text is a glyph, not a graphic`() {
    val bytes = pdf { _, _, content ->
      // A single square sitting exactly in a printed line - e.g. the checkbox of "☐
      // Eigentuemer/in".
      content.setNonStrokingColor(Color.BLACK)
      content.addRect(60f, 505f, 9f, 9f)
      content.fill()
      content.setFont(PDType1Font.HELVETICA, 9f)
      content.beginText()
      // The printed line runs THROUGH the mark, exactly like the "☐ Eigentuemer/in" text run of the
      // real form (the checkbox is one of that line's glyphs).
      content.newLineAtOffset(60f, 505f)
      content.showText("Eigentuemer/in")
      content.endText()
      content.close()
    }

    assertTrue(
        DocumentGraphics.extract(bytes).isEmpty(),
        "a mark inside a printed line belongs to that line, not to the artwork")
  }
}
