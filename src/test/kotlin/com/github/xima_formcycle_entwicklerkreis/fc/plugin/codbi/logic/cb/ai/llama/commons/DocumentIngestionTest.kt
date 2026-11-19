package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.util.zip.GZIPOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import javax.imageio.ImageIO
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertInstanceOf
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests for the attachment ingestion step: what an attached file contributes to the form build.
 *
 * The pipeline used to accept rasters only, so a Word template, an Excel option list or a scan
 * archive had to be converted by hand. These tests pin the new formats AND the guards (archive
 * budget, unknown/OLE formats) that keep a hostile file from reaching the model.
 */
class DocumentIngestionTest {

  private fun zip(vararg entries: Pair<String, ByteArray>): ByteArray {
    val out = ByteArrayOutputStream()
    ZipOutputStream(out).use { zip ->
      for ((name, data) in entries) {
        zip.putNextEntry(ZipEntry(name))
        zip.write(data)
        zip.closeEntry()
      }
    }
    return out.toByteArray()
  }

  private fun png(width: Int = 4, height: Int = 4): ByteArray {
    val out = ByteArrayOutputStream()
    ImageIO.write(BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), "PNG", out)
    return out.toByteArray()
  }

  private fun text(value: String): ByteArray = value.toByteArray(Charsets.UTF_8)

  @Test
  fun `a plain text file becomes one text part`() {
    val parts = DocumentIngestion.ingestAll(mapOf("felder.txt" to text("Name;Pflicht\nVorname;ja")))
    assertEquals(1, parts.size)
    val part = assertInstanceOf(IngestedPart.Text::class.java, parts[0])
    assertTrue(part.text.contains("Vorname"))
  }

  @Test
  fun `a zip is expanded and its entries keep the archive order`() {
    val archive = zip("a/notiz.md" to text("# Antrag"), "b/bild.png" to png())
    val parts = DocumentIngestion.ingestAll(mapOf("unterlagen.zip" to archive))
    assertEquals(2, parts.size)
    assertInstanceOf(IngestedPart.Text::class.java, parts[0])
    assertInstanceOf(IngestedPart.Image::class.java, parts[1])
  }

  @Test
  fun `a nested zip is expanded and a nested image is decodable`() {
    val inner = zip("scan.png" to png())
    val outer = zip("inner.zip" to inner)
    val parts = DocumentIngestion.ingestAll(mapOf("paket.zip" to outer))
    assertEquals(1, parts.size)
    val image = assertInstanceOf(IngestedPart.Image::class.java, parts[0])
    assertTrue(image.bytes.isNotEmpty())
  }

  @Test
  fun `a docx is converted to text with tables checkboxes and page breaks`() {
    val document =
        """
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Antrag auf Erteilung</w:t></w:r></w:p>
            <w:p><w:r><w:t>Ich bin einverstanden</w:t></w:r></w:p>
            <w:tbl><w:tr><w:tc><w:p><w:r><w:t>Name</w:t></w:r></w:p></w:tc>
                        <w:tc><w:p><w:r><w:t>Muster</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
            <w:p><w:r><w:br w:type="page"/><w:t>Seite 2 Inhalt</w:t></w:r></w:p>
          </w:body>
        </w:document>
        """
            .trimIndent()
    val docx = zip("[Content_Types].xml" to text("<Types/>"), "word/document.xml" to text(document))

    val parts = DocumentIngestion.ingestAll(mapOf("antrag.docx" to docx))
    assertEquals(2, parts.size, "a page break must start a new part: $parts")
    val first = assertInstanceOf(IngestedPart.Text::class.java, parts[0])
    assertTrue(first.text.contains("Antrag auf Erteilung"), first.text)
    assertTrue(first.text.contains("Name | Muster"), "tables stay readable: ${first.text}")
    val second = assertInstanceOf(IngestedPart.Text::class.java, parts[1])
    assertTrue(second.text.contains("Seite 2 Inhalt"), second.text)
  }

  @Test
  fun `an xlsx option list becomes rows of text`() {
    val strings =
        """
        <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
          <si><t>Bayern</t></si><si><t>Sachsen</t></si>
        </sst>
        """
            .trimIndent()
    val sheet =
        """
        <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
          <sheetData><row r="1"><c t="s"><v>0</v></c><c t="s"><v>1</v></c></row></sheetData>
        </worksheet>
        """
            .trimIndent()
    val xlsx =
        zip(
            "xl/workbook.xml" to text("<workbook/>"),
            "xl/sharedStrings.xml" to text(strings),
            "xl/worksheets/sheet1.xml" to text(sheet))

    val parts = DocumentIngestion.ingestAll(mapOf("laender.xlsx" to xlsx))
    val part = assertInstanceOf(IngestedPart.Text::class.java, parts[0])
    assertTrue(part.text.contains("Bayern | Sachsen"), part.text)
  }

  @Test
  fun `an html form keeps its controls as visible markers`() {
    val html =
        "<html><body><label>Name</label><input type=\"text\">" +
            "<input type=\"checkbox\"> Ja <select><option>A</option></select></body></html>"
    val parts = DocumentIngestion.ingestAll(mapOf("formular.html" to text(html)))
    val part = assertInstanceOf(IngestedPart.Text::class.java, parts[0])
    assertTrue(part.text.contains("Name"), part.text)
    assertTrue(part.text.contains("\u2610"), "checkbox marker: ${part.text}")
    assertTrue(part.text.contains("____"), "input marker: ${part.text}")
  }

  @Test
  fun `a gzip payload is decompressed and re-detected`() {
    val out = ByteArrayOutputStream()
    GZIPOutputStream(out).use { it.write(text("Feldliste: Name, Vorname")) }
    val parts = DocumentIngestion.ingestAll(mapOf("felder.txt.gz" to out.toByteArray()))
    val part = assertInstanceOf(IngestedPart.Text::class.java, parts[0])
    assertTrue(part.text.contains("Feldliste"))
  }

  @Test
  fun `a tar archive is expanded`() {
    val content = text("Feld: Name")
    val name = "felder.txt"
    val header = ByteArray(512)
    name.toByteArray().copyInto(header, 0)
    "0000644".toByteArray().copyInto(header, 100)
    String.format("%011o", content.size).toByteArray().copyInto(header, 124)
    "0".toByteArray().copyInto(header, 156)
    "ustar".toByteArray().copyInto(header, 257)
    val padded = content + ByteArray((512 - content.size % 512) % 512)
    val tar = header + padded + ByteArray(1024)

    val parts = DocumentIngestion.ingestAll(mapOf("paket.tar" to tar))
    val part = assertInstanceOf(IngestedPart.Text::class.java, parts[0])
    assertTrue(part.text.contains("Feld: Name"), part.text)
  }

  @Test
  fun `a multi-page tiff becomes one image part per page`() {
    val writer = ImageIO.getImageWritersByFormatName("tiff").asSequence().firstOrNull()
    if (writer == null) return // no TIFF encoder in this JDK - nothing to test here
    val out = ByteArrayOutputStream()
    ImageIO.createImageOutputStream(out).use { ios ->
      writer.output = ios
      // A multi-page TIFF is a WRITE SEQUENCE - writing two frames without one overwrites.
      writer.prepareWriteSequence(null)
      writer.writeToSequence(javax.imageio.IIOImage(BufferedImage(3, 3, 1), null, null), null)
      writer.writeToSequence(javax.imageio.IIOImage(BufferedImage(3, 3, 1), null, null), null)
      writer.endWriteSequence()
    }
    val parts = DocumentIngestion.ingestAll(mapOf("scan.tif" to out.toByteArray()))
    assertEquals(2, parts.size, "each TIFF page must be its own part: $parts")
    assertTrue(parts.all { it is IngestedPart.Image })
    assertEquals("scan_page_1.png", (parts[0] as IngestedPart.Image).name)
    assertEquals("scan_page_2.png", (parts[1] as IngestedPart.Image).name)
  }

  @Test
  fun `a pdf with a text layer becomes text pages`() {
    val pdf =
        org.apache.pdfbox.pdmodel.PDDocument().use { document ->
          for (label in listOf("Antrag auf Erteilung", "Seite 2 Inhalt")) {
            val page = org.apache.pdfbox.pdmodel.PDPage()
            document.addPage(page)
            org.apache.pdfbox.pdmodel
                .PDPageContentStream(
                    document,
                    page,
                    org.apache.pdfbox.pdmodel.PDPageContentStream.AppendMode.APPEND,
                    true,
                    true)
                .use { content ->
                  content.beginText()
                  // PDFBox 2.x: the standard-14 fonts are constants (3.x uses Standard14Fonts).
                  content.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 12f)
                  content.newLineAtOffset(40f, 700f)
                  content.showText(label)
                  content.endText()
                }
          }
          val out = ByteArrayOutputStream()
          document.save(out)
          out.toByteArray()
        }
    val parts = DocumentIngestion.ingestAll(mapOf("antrag.pdf" to pdf))
    assertEquals(2, parts.size, "one part per PDF page: $parts")
    val first = assertInstanceOf(IngestedPart.Text::class.java, parts[0])
    assertTrue(first.text.contains("Antrag auf Erteilung"), first.text)
    val second = assertInstanceOf(IngestedPart.Text::class.java, parts[1])
    assertTrue(second.text.contains("Seite 2 Inhalt"), second.text)
    // A text page costs no image budget at all.
    assertTrue(parts.none { it is IngestedPart.Image })
  }

  @Test
  fun `a pdf without a text layer is rasterised`() {
    val pdf =
        org.apache.pdfbox.pdmodel.PDDocument().use { document ->
          document.addPage(org.apache.pdfbox.pdmodel.PDPage())
          val out = ByteArrayOutputStream()
          document.save(out)
          out.toByteArray()
        }
    val parts = DocumentIngestion.ingestAll(mapOf("scan.pdf" to pdf))
    assertEquals(1, parts.size, "a text-free page must still become a page: $parts")
    val image = assertInstanceOf(IngestedPart.Image::class.java, parts[0])
    assertTrue(image.bytes.isNotEmpty(), "the rasterised page must carry image data")
  }

  @Test
  fun `a legacy ole file is reported as unsupported with an actionable reason`() {
    val ole =
        byteArrayOf(0xD0.toByte(), 0xCF.toByte(), 0x11.toByte(), 0xE0.toByte()) + ByteArray(600)
    val parts = DocumentIngestion.ingestAll(mapOf("alt.doc" to ole))
    val part = assertInstanceOf(IngestedPart.Unsupported::class.java, parts[0])
    assertTrue(part.reason.contains("docx"), part.reason)
  }

  @Test
  fun `an unknown binary is not passed to the model`() {
    val parts = DocumentIngestion.ingestAll(mapOf("blob.bin" to ByteArray(600) { 0x7F }))
    assertInstanceOf(IngestedPart.Unsupported::class.java, parts[0])
  }

  @Test
  fun `the archive budget stops a bomb instead of expanding it`() {
    val big = ByteArray(1024)
    val entries = (1..(DocumentIngestion.MAX_ARCHIVE_ENTRIES + 20)).map { "f$it.txt" to big }
    val archive = zip(*entries.toTypedArray())
    val warnings = mutableListOf<String>()
    val parts = DocumentIngestion.ingestAll(mapOf("bomb.zip" to archive)) { warnings += it }
    assertTrue(
        parts.size <= DocumentIngestion.MAX_ARCHIVE_ENTRIES,
        "the entry budget must cap the expansion, got ${parts.size}")
    assertTrue(warnings.isNotEmpty(), "the budget stop must be reported")
  }

  @Test
  fun `a character reference in html is decoded`() {
    val amp = "&"
    val html = "<p>A" + amp + "amp;B " + amp + "lt;tag" + amp + "gt;</p>"
    val out = DocumentIngestion.htmlToText(html)
    assertTrue(out.contains("A" + amp + "B"), out)
    assertTrue(out.contains("<tag>"), out)
  }

  @Test
  fun `detection prefers the magic bytes over a misleading extension`() {
    val pngBytes = png()
    assertEquals(DocumentIngestion.Format.PNG, DocumentIngestion.detect("tarnung.pdf", pngBytes))
  }
}
