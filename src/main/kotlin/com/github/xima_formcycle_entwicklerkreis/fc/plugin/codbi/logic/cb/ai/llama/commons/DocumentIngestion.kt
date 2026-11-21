package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.nio.charset.StandardCharsets
import java.util.zip.GZIPInputStream
import java.util.zip.ZipInputStream
import javax.imageio.ImageIO
import javax.xml.XMLConstants
import javax.xml.parsers.DocumentBuilder
import javax.xml.parsers.DocumentBuilderFactory
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.rendering.ImageType
import org.apache.pdfbox.rendering.PDFRenderer
import org.apache.pdfbox.text.PDFTextStripper
import org.w3c.dom.Document
import org.w3c.dom.Element
import org.w3c.dom.Node

/**
 * One page/section of an attached document, in the order the document presents it.
 *
 * The form build works through the attachment PAGE BY PAGE (one inference per page), so every part
 * carries either an image (a raster page) or its TEXT (a page/section of a text document). A text
 * part is strictly better where it exists: labels, checkbox glyphs and table columns arrive
 * verbatim instead of being guessed from pixels.
 */
internal sealed interface IngestedPart {
  /** The attachment/page name this part came from (e.g. `report_page_2.png`). */
  val name: String

  /**
   * A raster page, ready to be sent to the vision model (any format [ImageIO] can read).
   *
   * [graphics] are the artwork printed on that page (a logo, an icon, an illustration) taken out of
   * the PDF EXACTLY - see [DocumentGraphics]. A graphic is not a printed "entry", so it has to be
   * handed to the build separately.
   */
  data class Image(
      override val name: String,
      val bytes: ByteArray,
      val graphics: List<DocumentGraphic> = emptyList()
  ) : IngestedPart {
    // The bytes are compared by identity on purpose: a data class would compare array CONTENT and
    // walk the whole image on every equality check.
    override fun equals(other: Any?) = this === other

    override fun hashCode() = System.identityHashCode(this)
  }

  /** A text page/section (paragraphs, table rows, HTML, CSV, office document text). */
  data class Text(
      override val name: String,
      val text: String,
      val graphics: List<DocumentGraphic> = emptyList()
  ) : IngestedPart

  /** A file that cannot be used (with the reason, so the user gets an actionable message). */
  data class Unsupported(override val name: String, val reason: String) : IngestedPart
}

/**
 * Turns an attached file into [IngestedPart]s - the "acquire information for building forms" step.
 *
 * Everything here uses what the plugin already ships: the JDK (JPEG/PNG/GIF/BMP/TIFF, ZIP, GZIP),
 * PDFBox (PDF text layer + raster fallback) and the JDK's XML parser for the ZIP+XML office formats
 * (DOCX / ODT / XLSX / ODS / PPTX). No new dependency and no native code.
 *
 * Format detection uses the MAGIC BYTES first and the file extension only as a fallback, because
 * the browser reports a wrong type for several of these (a `.docx` is often sent as
 * `application/octet-stream`, a `.tif` not as an image at all).
 *
 * Everything is bounded: archives are expanded only up to [MAX_ARCHIVE_DEPTH],
 * [MAX_ARCHIVE_ENTRIES] and [MAX_ARCHIVE_BYTES], and text is truncated to [MAX_TEXT_CHARS]. A ZIP
 * bomb is therefore stopped before it reaches the model.
 *
 * Archives: [Format.ZIP] covers ZIP/JAR and the ZIP-based office formats with ONE reader. TAR
 * (including `.tar.gz`/`.tgz`) and plain GZIP are supported natively by the JDK. RAR and 7z need a
 * third-party native library, so they are reported as unsupported instead of failing silently.
 */
internal object DocumentIngestion {

  /** Maximum nesting level of archives (a ZIP inside a ZIP inside a ZIP is still expanded). */
  internal const val MAX_ARCHIVE_DEPTH = 3

  /** Maximum number of entries expanded from all archives together. */
  internal const val MAX_ARCHIVE_ENTRIES = 200

  /** Maximum number of uncompressed bytes read from all archives together. */
  internal const val MAX_ARCHIVE_BYTES = 80L * 1024 * 1024

  /** Maximum size of a single archive entry. */
  internal const val MAX_ENTRY_BYTES = 20L * 1024 * 1024

  /** Maximum characters of text taken from one document. */
  internal const val MAX_TEXT_CHARS = 200_000

  /** Rendering resolution used for PDF pages that carry no text layer. */
  internal const val PDF_RENDER_DPI = 150f

  /** The formats this step understands. */
  internal enum class Format {
    PNG,
    JPEG,
    GIF,
    BMP,
    WEBP,
    TIFF,
    PDF,
    ZIP,
    GZIP,
    TAR,
    DOCX,
    XLSX,
    ODT,
    ODS,
    PPTX,
    HTML,
    RTF,
    TEXT,
    OLE2,
    UNKNOWN
  }

  private val imageFormats = setOf(Format.PNG, Format.JPEG, Format.GIF, Format.BMP, Format.WEBP)

  private val textExtensions =
      setOf(
          "txt", "text", "md", "markdown", "csv", "tsv", "json", "xml", "xsd", "xsl", "xslt", "svg")

  private val archiveExtensions = setOf("zip", "jar", "tar", "gz", "tgz")

  private val unsupportedExtensions = setOf("rar", "7z", "xz", "bz2", "cab", "iso", "mdb", "accdb")

  /**
   * Ingests every attachment, in the order the client sent them.
   *
   * @param files attachment name → raw bytes (any type).
   * @param log diagnostic sink (warnings only).
   * @return the pages/sections in document order; never throws.
   */
  fun ingestAll(files: Map<String, ByteArray>, log: (String) -> Unit = {}): List<IngestedPart> {
    val budget = Budget()
    val out = mutableListOf<IngestedPart>()
    // The attachment map comes from the servlet's request parameters and has NO stable order, so a
    // rasterised multi-page document arrived as page 2, page 1, page 3 - and the form's pages were
    // built in exactly that order (reported: "the 2nd pdf page became the first form page"). Sort
    // by the page number the browser puts in the name (`…_page_2.png`), then by name, so the build
    // always sees the document's OWN order.
    val ordered =
        files.entries
            .sortedWith(compareBy({ pageNumberOf(it.key) ?: Int.MAX_VALUE }, { it.key }))
            .associate { it.key to it.value }
    for ((name, bytes) in ordered) {
      out += ingest(name, bytes, 0, budget, log)
      if (budget.exceeded) {
        log("Attachment budget exhausted - the remaining files are ignored")
        break
      }
    }
    return out
  }

  /**
   * The printed PAGE number an attachment name carries (`report_page_2.png` -> 2), or `null` when
   * the name has none.
   *
   * The client rasterises a document page by page and names the images `<base>_page_<n>.<ext>`
   * (1-based, in document order), so the name is the only reliable carrier of the page order across
   * the unordered request parameters.
   */
  internal fun pageNumberOf(name: String): Int? =
      Regex("_page_(\\d{1,4})\\.[A-Za-z0-9]{2,5}$")
          .find(name.trim())
          ?.groupValues
          ?.get(1)
          ?.toIntOrNull()
          ?.takeIf { it >= 1 }

  /** Ingests ONE file, recursing into archives while the budget allows. */
  internal fun ingest(
      name: String,
      bytes: ByteArray,
      depth: Int,
      budget: Budget,
      log: (String) -> Unit = {}
  ): List<IngestedPart> {
    if (bytes.isEmpty()) return listOf(IngestedPart.Unsupported(name, "empty file"))
    val format = detect(name, bytes)
    return try {
      when (format) {
        Format.PNG,
        Format.JPEG,
        Format.GIF,
        Format.BMP,
        Format.WEBP -> listOf(IngestedPart.Image(name, bytes))
        Format.TIFF -> splitTiff(name, bytes, log)
        Format.PDF -> readPdf(name, bytes, log)
        Format.ZIP,
        Format.DOCX,
        Format.XLSX,
        Format.ODT,
        Format.ODS,
        Format.PPTX -> expandZip(name, bytes, format, depth, budget, log)
        Format.GZIP -> {
          if (depth >= MAX_ARCHIVE_DEPTH) {
            listOf(IngestedPart.Unsupported(name, "archive nested too deeply"))
          } else {
            val inner =
                gunzip(bytes) ?: return listOf(IngestedPart.Unsupported(name, "unreadable gzip"))
            if (!budget.take(inner.size.toLong())) {
              listOf(IngestedPart.Unsupported(name, "archive budget exceeded"))
            } else ingest(stripExtension(name, "gz", "tgz"), inner, depth + 1, budget, log)
          }
        }
        Format.TAR -> {
          if (depth >= MAX_ARCHIVE_DEPTH) {
            listOf(IngestedPart.Unsupported(name, "archive nested too deeply"))
          } else expandTar(name, bytes, depth, budget, log)
        }
        Format.HTML -> listOf(IngestedPart.Text(name, htmlToText(decodeText(bytes))))
        Format.RTF -> listOf(IngestedPart.Text(name, rtfToText(decodeText(bytes))))
        Format.TEXT -> listOf(IngestedPart.Text(name, cap(decodeText(bytes))))
        Format.OLE2 ->
            listOf(
                IngestedPart.Unsupported(
                    name,
                    "legacy Office/OLE file - save it as .docx/.xlsx first (macros are never executed)"))
        Format.UNKNOWN -> listOf(IngestedPart.Unsupported(name, "unsupported file type"))
      }
    } catch (e: Exception) {
      log("Could not read attachment '$name' (${format.name.lowercase()}): ${e.message}")
      listOf(IngestedPart.Unsupported(name, e.message ?: "unreadable file"))
    }
  }

  /** Detects the format from the magic bytes, falling back to the file extension. */
  internal fun detect(name: String, bytes: ByteArray): Format {
    if (bytes.size >= 12) {
      val b = bytes
      if (b[0] == 0x25.toByte() &&
          b[1] == 0x50.toByte() &&
          b[2] == 0x44.toByte() &&
          b[3] == 0x46.toByte())
          return Format.PDF // %PDF
      if (b[0] == 0x89.toByte() &&
          b[1] == 0x50.toByte() &&
          b[2] == 0x4E.toByte() &&
          b[3] == 0x47.toByte())
          return Format.PNG
      if (b[0] == 0xFF.toByte() && b[1] == 0xD8.toByte() && b[2] == 0xFF.toByte())
          return Format.JPEG
      if (b[0] == 0x47.toByte() &&
          b[1] == 0x49.toByte() &&
          b[2] == 0x46.toByte() &&
          b[3] == 0x38.toByte())
          return Format.GIF
      if (b[0] == 0x42.toByte() && b[1] == 0x4D.toByte()) return Format.BMP
      if (b[0] == 0x49.toByte() &&
          b[1] == 0x49.toByte() &&
          b[2] == 0x2A.toByte() &&
          b[3] == 0x00.toByte())
          return Format.TIFF
      if (b[0] == 0x4D.toByte() &&
          b[1] == 0x4D.toByte() &&
          b[2] == 0x00.toByte() &&
          b[3] == 0x2A.toByte())
          return Format.TIFF
      if (b[0] == 0x1F.toByte() && b[1] == 0x8B.toByte()) return Format.GZIP
      if (b[0] == 0xD0.toByte() &&
          b[1] == 0xCF.toByte() &&
          b[2] == 0x11.toByte() &&
          b[3] == 0xE0.toByte())
          return Format.OLE2
      if (b[0] == 0x52.toByte() &&
          b[1] == 0x49.toByte() &&
          b[2] == 0x46.toByte() &&
          b[3] == 0x46.toByte() &&
          b[8] == 0x57.toByte() &&
          b[9] == 0x45.toByte() &&
          b[10] == 0x42.toByte() &&
          b[11] == 0x50.toByte())
          return Format.WEBP
      if (b[0] == 0x50.toByte() &&
          b[1] == 0x4B.toByte() &&
          b[2] == 0x03.toByte() &&
          b[3] == 0x04.toByte())
          return zipFormat(bytes)
      if (isTar(bytes)) return Format.TAR
    }
    val ext = name.substringAfterLast('.', "").lowercase()
    return when {
      ext == "tif" || ext == "tiff" -> Format.TIFF
      ext == "png" -> Format.PNG
      ext == "jpg" || ext == "jpeg" -> Format.JPEG
      ext == "gif" -> Format.GIF
      ext == "bmp" -> Format.BMP
      ext == "webp" -> Format.WEBP
      ext == "pdf" -> Format.PDF
      ext == "docx" -> Format.DOCX
      ext == "xlsx" -> Format.XLSX
      ext == "odt" -> Format.ODT
      ext == "ods" -> Format.ODS
      ext == "pptx" -> Format.PPTX
      ext == "html" || ext == "htm" || ext == "mht" || ext == "mhtml" -> Format.HTML
      ext == "rtf" -> Format.RTF
      ext in archiveExtensions -> if (ext == "gz" || ext == "tgz") Format.GZIP else Format.ZIP
      ext in textExtensions -> Format.TEXT
      ext == "doc" || ext == "xls" || ext == "ppt" || ext == "msg" -> Format.OLE2
      ext in unsupportedExtensions -> Format.UNKNOWN
      else -> Format.UNKNOWN
    }
  }

  /** Distinguishes the ZIP-based OFFICE formats (by their entry names) from a plain ZIP. */
  private fun zipFormat(bytes: ByteArray): Format {
    val names = zipEntryNames(bytes) ?: return Format.ZIP
    return when {
      "word/document.xml" in names -> Format.DOCX
      "xl/workbook.xml" in names -> Format.XLSX
      "ppt/presentation.xml" in names -> Format.PPTX
      "content.xml" in names -> odfOrZip(bytes)
      else -> Format.ZIP
    }
  }

  private fun odfOrZip(bytes: ByteArray): Format {
    val mime = zipEntryText(bytes, "mimetype") ?: return Format.ODT
    return when {
      mime.contains("spreadsheet") -> Format.ODS
      mime.contains("presentation") -> Format.PPTX
      else -> Format.ODT
    }
  }

  /** TAR has no leading magic; the `ustar` marker sits at offset 257. */
  private fun isTar(bytes: ByteArray): Boolean {
    if (bytes.size < 265) return false
    val marker = String(bytes, 257, 5, StandardCharsets.US_ASCII)
    if (marker != "ustar") return false
    // A first header must declare a plausible name, so a random blob is not mistaken for a TAR.
    return String(bytes, 0, 1, StandardCharsets.US_ASCII).trim().isNotEmpty()
  }

  // #region images

  /** Splits a (possibly multi-page) TIFF into one PNG per page - the standard scan container. */
  private fun splitTiff(name: String, bytes: ByteArray, log: (String) -> Unit): List<IngestedPart> {
    val reader =
        ImageIO.getImageReadersByFormatName("tiff").asSequence().firstOrNull()
            ?: return listOf(IngestedPart.Unsupported(name, "no TIFF decoder available"))
    val parts = mutableListOf<IngestedPart>()
    val input = ImageIO.createImageInputStream(ByteArrayInputStream(bytes)) ?: return emptyList()
    try {
      reader.setInput(input, false, true)
      val pages = runCatching { reader.getNumImages(true) }.getOrDefault(1)
      for (index in 0 until pages) {
        val image = runCatching { reader.read(index) }.getOrNull() ?: continue
        val png = toPng(image) ?: continue
        parts += IngestedPart.Image(pageName(name, index + 1, pages), png)
      }
    } finally {
      reader.dispose()
      runCatching { input.close() }
    }
    if (parts.size > 1) log("TIFF '$name' split into ${parts.size} page(s)")
    return parts
  }

  /** `report.tif` → `report_page_2.png` (the `_<n>` suffix keeps the page order stable). */
  private fun pageName(name: String, page: Int, total: Int): String {
    val base = name.substringBeforeLast('.', name)
    return if (total <= 1) "$base.png" else "${base}_page_$page.png"
  }

  private fun toPng(image: BufferedImage): ByteArray? =
      runCatching {
            val out = ByteArrayOutputStream()
            ImageIO.write(image, "PNG", out)
            out.toByteArray()
          }
          .getOrNull()

  // #region PDF

  /**
   * Reads a PDF page by page: a page WITH a text layer becomes a [IngestedPart.Text] (exact labels,
   * checkbox glyphs - and a fraction of the tokens), a page WITHOUT one is rasterised so the vision
   * model still sees it.
   */
  private fun readPdf(name: String, bytes: ByteArray, log: (String) -> Unit): List<IngestedPart> {
    val parts = mutableListOf<IngestedPart>()
    PDDocument.load(bytes).use { document ->
      val pages = document.numberOfPages
      val renderer by lazy { PDFRenderer(document) }
      // The ARTWORK of every page, taken out of the PDF exactly (vectors -> inline SVG, bitmaps ->
      // PNG data URI). A graphic is not a printed entry, so it is handed to the build separately -
      // otherwise a logo / illustration on the page never reaches the generated form.
      val graphicsByPage =
          runCatching { DocumentGraphics.extract(document) }.getOrDefault(emptyMap())
      if (graphicsByPage.isNotEmpty()) {
        log(
            "PDF '$name': ${graphicsByPage.values.sumOf { it.size }} graphic(s) extracted from " +
                "${graphicsByPage.size} page(s)")
      }
      for (index in 0 until pages) {
        val graphics = graphicsByPage[index + 1].orEmpty()
        val text =
            runCatching {
                  val stripper = PDFTextStripper()
                  stripper.startPage = index + 1
                  stripper.endPage = index + 1
                  stripper.getText(document).trim()
                }
                .getOrDefault("")
        if (text.isNotEmpty()) {
          parts += IngestedPart.Text(pageName(name, index + 1, pages), cap(text), graphics)
        } else {
          val image =
              runCatching {
                    toPng(renderer.renderImageWithDPI(index, PDF_RENDER_DPI, ImageType.RGB))
                  }
                  .getOrNull()
          if (image != null) {
            parts += IngestedPart.Image(pageName(name, index + 1, pages), image, graphics)
          }
        }
      }
      if (parts.size > 1) log("PDF '$name' split into ${parts.size} page(s)")
    }
    return parts
  }

  // #region archives

  /** Entry budget shared by ALL archives of one request (a nested bomb cannot multiply it). */
  internal class Budget {
    var entries = 0
    var bytes = 0L
    var exceeded = false

    fun take(size: Long): Boolean {
      if (entries >= MAX_ARCHIVE_ENTRIES || bytes + size > MAX_ARCHIVE_BYTES) {
        exceeded = true
        return false
      }
      entries++
      bytes += size
      return true
    }
  }

  private fun expandZip(
      name: String,
      bytes: ByteArray,
      format: Format,
      depth: Int,
      budget: Budget,
      log: (String) -> Unit
  ): List<IngestedPart> {
    val entries =
        readZipEntries(bytes) ?: return listOf(IngestedPart.Unsupported(name, "unreadable ZIP"))
    // The office formats are converted to TEXT (nothing to expand); a plain ZIP is expanded. A
    // document that marks printed page breaks becomes one text part per page, so the per-page build
    // still works on it.
    return when (format) {
      Format.DOCX -> splitIntoPages(name, docxToText(entries))
      Format.ODT -> splitIntoPages(name, odfToText(entries))
      Format.XLSX -> listOf(IngestedPart.Text(name, xlsxToText(entries)))
      Format.ODS -> listOf(IngestedPart.Text(name, odfToText(entries)))
      Format.PPTX -> listOf(IngestedPart.Text(name, pptxToText(entries)))
      else -> {
        if (depth >= MAX_ARCHIVE_DEPTH) {
          return listOf(IngestedPart.Unsupported(name, "archive nested too deeply"))
        }
        val out = mutableListOf<IngestedPart>()
        for ((entryName, entryBytes) in entries) {
          if (entryName.endsWith("/")) continue
          if (entryName.startsWith("__MACOSX/") || entryName.substringAfterLast('/') == ".DS_Store")
              continue
          if (!budget.take(entryBytes.size.toLong())) {
            log("Archive '$name': budget exceeded at '$entryName' - the rest is ignored")
            break
          }
          out += ingest(entryName.substringAfterLast('/'), entryBytes, depth + 1, budget, log)
        }
        if (out.isEmpty()) listOf(IngestedPart.Unsupported(name, "archive contains no usable file"))
        else out
      }
    }
  }

  /**
   * Reads the usable ZIP entries into memory. Bounded THREE times: per entry ([MAX_ENTRY_BYTES]),
   * by entry count ([MAX_ARCHIVE_ENTRIES]) and by the TOTAL uncompressed size
   * ([MAX_ARCHIVE_BYTES]) - a ZIP bomb is stopped here and never reaches the model.
   */
  private fun readZipEntries(bytes: ByteArray): Map<String, ByteArray>? =
      try {
        val out = LinkedHashMap<String, ByteArray>()
        var total = 0L
        var count = 0
        ZipInputStream(ByteArrayInputStream(bytes)).use { zip ->
          while (true) {
            val entry = zip.nextEntry ?: break
            if (entry.isDirectory) continue
            // Read ONE entry more than the expansion budget so the stop is REPORTED by
            // `expandZip`/`Budget` instead of silently truncating the archive.
            if (++count > MAX_ARCHIVE_ENTRIES + 1 || total >= MAX_ARCHIVE_BYTES) break
            val data =
                readLimited(zip, minOf(MAX_ENTRY_BYTES, MAX_ARCHIVE_BYTES - total)) ?: continue
            total += data.size
            out[entry.name] = data
          }
        }
        out
      } catch (_: Exception) {
        null
      }

  /** One [IngestedPart.Text] per printed page (a DOCX/ODT page break becomes `\\u000C`). */
  private fun splitIntoPages(name: String, text: String): List<IngestedPart> {
    val pages = text.split('\u000C').map { it.trim() }.filter { it.isNotEmpty() }
    if (pages.size <= 1) return listOf(IngestedPart.Text(name, text))
    return pages.mapIndexed { index, page ->
      IngestedPart.Text(pageName(name, index + 1, pages.size).substringBeforeLast('.'), cap(page))
    }
  }

  private fun zipEntryNames(bytes: ByteArray): Set<String>? = readZipEntryNames(bytes, 2000)

  private fun readZipEntryNames(bytes: ByteArray, limit: Int): Set<String>? =
      try {
        val names = LinkedHashSet<String>()
        ZipInputStream(ByteArrayInputStream(bytes)).use { zip ->
          while (names.size < limit) {
            val entry = zip.nextEntry ?: break
            names.add(entry.name)
          }
        }
        names
      } catch (_: Exception) {
        null
      }

  private fun zipEntryText(bytes: ByteArray, wanted: String): String? {
    val entries = readZipEntries(bytes) ?: return null
    return entries[wanted]?.toString(StandardCharsets.UTF_8)
  }

  /** Expands a TAR (also the decompressed payload of a `.tar.gz`). */
  private fun expandTar(
      name: String,
      bytes: ByteArray,
      depth: Int,
      budget: Budget,
      log: (String) -> Unit
  ): List<IngestedPart> {
    val out = mutableListOf<IngestedPart>()
    var offset = 0
    while (offset + 512 <= bytes.size) {
      val header = bytes.copyOfRange(offset, offset + 512)
      if (header.all { it == 0.toByte() }) break
      val entryName = String(header, 0, 100, StandardCharsets.UTF_8).trimEnd('\u0000')
      val sizeText = String(header, 124, 12, StandardCharsets.US_ASCII).trim().trimEnd('\u0000')
      val size = sizeText.toLongOrNull(8) ?: break
      val typeFlag = header[156].toInt().toChar()
      offset += 512
      val end = (offset + size).coerceAtMost(bytes.size.toLong()).toInt()
      val data = bytes.copyOfRange(offset, end)
      offset += ((size + 511) / 512 * 512).toInt()
      if (entryName.isEmpty() || typeFlag == '5') continue // directory
      if (size <= 0) continue
      if (!budget.take(data.size.toLong())) {
        log("Archive '$name': budget exceeded at '$entryName' - the rest is ignored")
        break
      }
      out += ingest(entryName.substringAfterLast('/'), data, depth + 1, budget, log)
    }
    return if (out.isEmpty())
        listOf(IngestedPart.Unsupported(name, "archive contains no usable file"))
    else out
  }

  private fun gunzip(bytes: ByteArray): ByteArray? =
      runCatching {
            GZIPInputStream(ByteArrayInputStream(bytes)).use { readLimited(it, MAX_ENTRY_BYTES) }
          }
          .getOrNull()

  /** Reads up to [limit] bytes; returns null when the stream is empty. */
  private fun readLimited(stream: java.io.InputStream, limit: Long): ByteArray? {
    val out = ByteArrayOutputStream()
    val buffer = ByteArray(16 * 1024)
    var total = 0L
    while (total < limit) {
      val read = stream.read(buffer)
      if (read <= 0) break
      val allowed = minOf(read.toLong(), limit - total).toInt()
      out.write(buffer, 0, allowed)
      total += allowed
      if (allowed < read) break
    }
    return if (out.size() == 0) null else out.toByteArray()
  }

  // #region office documents

  /**
   * DOCX → text. Paragraphs keep their line, table rows become `cell | cell` lines and a page break
   * starts a NEW part, so the per-page build still sees one part per printed page. Checkbox glyphs
   * arrive as text, which is exactly the "decision vs artefact" signal the build needs.
   */
  private fun docxToText(entries: Map<String, ByteArray>): String {
    val body = entries["word/document.xml"]?.toString(StandardCharsets.UTF_8) ?: return ""
    val xml = parseXml(body.toByteArray(StandardCharsets.UTF_8)) ?: return ""
    val sb = StringBuilder()
    appendDocxBlock(xml.documentElement, sb)
    return cap(sb.toString())
  }

  private fun appendDocxBlock(element: Element, sb: StringBuilder) {
    for (child in childElements(element)) {
      when (child.tagName.substringAfter(':')) {
        "p" -> {
          appendDocxParagraph(child, sb)
          sb.append('\n')
        }
        "tbl" -> {
          appendDocxTable(child, sb)
          sb.append('\n')
        }
        else -> appendDocxBlock(child, sb)
      }
    }
  }

  private fun appendDocxParagraph(paragraph: Element, sb: StringBuilder) {
    fun walk(node: Element) {
      for (child in childElements(node)) {
        when (child.tagName.substringAfter(':')) {
          "t" -> sb.append(child.textContent ?: "")
          "tab" -> sb.append('\t')
          "br" -> {
            val type = child.getAttribute("w:type").ifEmpty { child.getAttribute("type") }
            if (type == "page") sb.append('\n').append('\u000C') else sb.append('\n')
          }
          "cr" -> sb.append('\n')
          "sym" -> {
            val char = child.getAttribute("w:char").ifEmpty { child.getAttribute("char") }
            val code = char.toIntOrNull(16)
            if (code != null && code in 0xF000..0xF0FF) sb.append('\u2610')
          }
          else -> walk(child)
        }
      }
    }
    walk(paragraph)
  }

  private fun appendDocxTable(table: Element, sb: StringBuilder) {
    fun rows(node: Element) {
      for (child in childElements(node)) {
        when (child.tagName.substringAfter(':')) {
          "tr" -> {
            val cells = childElements(child).filter { it.tagName.substringAfter(':') == "tc" }
            val texts =
                cells.map { cell ->
                  val cellText = StringBuilder()
                  appendDocxBlock(cell, cellText)
                  cellText.toString().replace('\n', ' ').trim()
                }
            sb.append(texts.joinToString(" | ")).append('\n')
          }
          else -> rows(child)
        }
      }
    }
    rows(table)
  }

  /** ODT/ODS → text: `text:p`/`text:h` paragraphs and `table:table` rows. */
  private fun odfToText(entries: Map<String, ByteArray>): String {
    val body = entries["content.xml"]?.toString(StandardCharsets.UTF_8) ?: return ""
    val xml = parseXml(body.toByteArray(StandardCharsets.UTF_8)) ?: return ""
    val sb = StringBuilder()
    fun walk(node: Element) {
      for (child in childElements(node)) {
        when (child.tagName.substringAfter(':')) {
          "p",
          "h" -> sb.append(child.textContent ?: "").append('\n')
          "table-row" -> {
            val cells =
                childElements(child)
                    .filter { it.tagName.substringAfter(':') == "table-cell" }
                    .map { (it.textContent ?: "").replace('\n', ' ').trim() }
            sb.append(cells.joinToString(" | ")).append('\n')
          }
          else -> walk(child)
        }
      }
    }
    walk(xml.documentElement)
    return cap(sb.toString())
  }

  /** XLSX → text: one `cell | cell` line per row (shared strings resolved, numbers inline). */
  private fun xlsxToText(entries: Map<String, ByteArray>): String {
    val shared =
        entries["xl/sharedStrings.xml"]?.let { raw ->
          parseXml(raw)?.let { xml ->
            val list = mutableListOf<String>()
            fun collect(el: Element) {
              for (child in childElements(el)) {
                if (child.tagName.substringAfter(':') == "si") list += child.textContent ?: ""
                else collect(child)
              }
            }
            collect(xml.documentElement)
            list
          }
        } ?: emptyList()
    val sb = StringBuilder()
    val sheets =
        entries.keys.filter { it.startsWith("xl/worksheets/") && it.endsWith(".xml") }.sorted()
    for (sheet in sheets) {
      val raw = entries[sheet]?.toString(StandardCharsets.UTF_8) ?: continue
      val xml = parseXml(raw.toByteArray(StandardCharsets.UTF_8)) ?: continue
      sb.append("# ").append(sheet.substringAfterLast('/')).append('\n')
      fun walk(node: Element) {
        for (child in childElements(node)) {
          when (child.tagName.substringAfter(':')) {
            "row" -> {
              val cells =
                  childElements(child)
                      .filter { it.tagName.substringAfter(':') == "c" }
                      .map { cell ->
                        val type = cell.getAttribute("t")
                        val value =
                            childElements(cell)
                                .firstOrNull { it.tagName.substringAfter(':') in setOf("v", "t") }
                                ?.textContent ?: ""
                        if (type == "s") shared.getOrNull(value.toIntOrNull() ?: -1) ?: value
                        else value
                      }
              if (cells.any { it.isNotBlank() }) sb.append(cells.joinToString(" | ")).append('\n')
            }
            else -> walk(child)
          }
        }
      }
      walk(xml.documentElement)
    }
    return cap(sb.toString())
  }

  /** PPTX → text: every shape's text, slide by slide. */
  private fun pptxToText(entries: Map<String, ByteArray>): String {
    val sb = StringBuilder()
    val slides =
        entries.keys
            .filter { it.startsWith("ppt/slides/slide") && it.endsWith(".xml") }
            .sortedBy { it.filter(Char::isDigit).toIntOrNull() ?: 0 }
    for (slide in slides) {
      val raw = entries[slide]?.toString(StandardCharsets.UTF_8) ?: continue
      val xml = parseXml(raw.toByteArray(StandardCharsets.UTF_8)) ?: continue
      fun collect(el: Element) {
        for (child in childElements(el)) {
          if (child.tagName.substringAfter(':') == "t")
              sb.append(child.textContent ?: "").append(' ')
          else collect(child)
        }
      }
      collect(xml.documentElement)
      sb.append('\n')
    }
    return cap(sb.toString())
  }

  private fun childElements(element: Element): List<Element> {
    val out = mutableListOf<Element>()
    val nodes = element.childNodes
    for (i in 0 until nodes.length) {
      val node = nodes.item(i)
      if (node.nodeType == Node.ELEMENT_NODE) out += node as Element
    }
    return out
  }

  /** Parses XML with DTDs and EVERY external entity disabled (XXE-safe). */
  private fun parseXml(bytes: ByteArray): Document? =
      runCatching {
            val factory = DocumentBuilderFactory.newInstance()
            factory.isNamespaceAware = true
            factory.isXIncludeAware = false
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true)
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false)
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false)
            factory.setFeature(
                "http://apache.org/xml/features/nonvalidating/load-external-dtd", false)
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "")
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "")
            val builder: DocumentBuilder = factory.newDocumentBuilder()
            builder.parse(ByteArrayInputStream(bytes))
          }
          .getOrNull()

  // #region text helpers

  /**
   * HTML → text. Tags become whitespace (a block element a newline), character references are
   * decoded, and form controls become a visible marker so the model still sees them.
   */
  internal fun htmlToText(html: String): String {
    var text = html
    text = text.replace(Regex("(?is)<(script|style)[^>]*>.*?</\\1>"), " ")
    text = text.replace(Regex("(?is)<input[^>]*type=\"?(checkbox|radio)\"?[^>]*>"), "\u2610 ")
    text = text.replace(Regex("(?is)<input[^>]*>"), "____ ")
    text = text.replace(Regex("(?is)<(select|textarea)[^>]*>"), "____ ")
    text = text.replace(Regex("(?is)<br\\s*/?>"), "\n")
    text = text.replace(Regex("(?is)</(p|div|tr|li|h[1-6]|table|section|article)>"), "\n")
    text = text.replace(Regex("(?is)</t[dh]>"), " | ")
    text = text.replace(Regex("(?is)<[^>]+>"), "")
    text = decodeEntities(text)
    return cap(text.lines().joinToString("\n") { it.trim().replace(Regex("[ \t]+"), " ") }.trim())
  }

  /** RTF → text: control words dropped, hex escapes (cp1252) and escaped braces restored. */
  internal fun rtfToText(rtf: String): String {
    var text = rtf
    text = text.replace(Regex("(?s)\\\\*\\\\[a-zA-Z]+[^\\\\]*;?"), " ")
    text =
        text.replace(Regex("\\\\'([0-9a-fA-F]{2})")) { match ->
          String(byteArrayOf(match.groupValues[1].toInt(16).toByte()), charset("windows-1252"))
        }
    text = text.replace(Regex("\\\\par[d]?\\b"), "\n")
    text = text.replace(Regex("\\\\tab\\b"), "\t")
    text = text.replace(Regex("\\\\u-?\\d+\\??"), " ")
    text = text.replace(Regex("\\\\[a-zA-Z]+-?\\d* ?"), "")
    text = text.replace(Regex("[{}]"), "")
    return cap(text.lines().joinToString("\n") { it.trim() }.trim())
  }

  /**
   * Decodes the character references an office/HTML export uses. The reference names are assembled
   * from parts on purpose: written literally they would be indistinguishable from real markup.
   */
  internal fun decodeEntities(text: String): String {
    val amp = "&"
    val hash = "#"
    var out = text
    out = out.replace(amp + "nbsp;", " ")
    out = out.replace(amp + "amp;", amp)
    out = out.replace(amp + "lt;", "<")
    out = out.replace(amp + "gt;", ">")
    out = out.replace(amp + "quot;", "\"")
    out = out.replace(amp + "apos;", "'")
    out = out.replace(amp + hash + "39;", "'")
    out =
        out.replace(Regex(amp + hash + "(\\d+);")) { match ->
          match.groupValues[1].toIntOrNull()?.let { code -> String(Character.toChars(code)) } ?: ""
        }
    out =
        out.replace(Regex(amp + hash + "x([0-9a-fA-F]+);")) { match ->
          match.groupValues[1].toIntOrNull(16)?.let { code -> String(Character.toChars(code)) }
              ?: ""
        }
    return out
  }

  /** Decodes a text file: UTF-8 when it is valid, cp1252 otherwise (office exports on Windows). */
  internal fun decodeText(bytes: ByteArray): String {
    val utf8 =
        runCatching {
              StandardCharsets.UTF_8.newDecoder().decode(java.nio.ByteBuffer.wrap(bytes)).toString()
            }
            .getOrNull()
    val text = utf8 ?: String(bytes, charset("windows-1252"))
    return text.removePrefix("\uFEFF")
  }

  private fun cap(text: String): String =
      if (text.length <= MAX_TEXT_CHARS) text else text.substring(0, MAX_TEXT_CHARS)

  private fun stripExtension(name: String, vararg extensions: String): String {
    val lower = name.lowercase()
    for (ext in extensions) {
      if (lower.endsWith("." + ext)) return name.dropLast(ext.length + 1)
    }
    return name
  }
}
