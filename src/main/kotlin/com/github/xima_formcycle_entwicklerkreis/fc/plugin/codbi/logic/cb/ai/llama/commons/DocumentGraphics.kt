package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import java.awt.geom.Point2D
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.util.Base64
import java.util.Locale
import javax.imageio.ImageIO
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import org.apache.pdfbox.contentstream.PDFGraphicsStreamEngine
import org.apache.pdfbox.cos.COSName
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.pdmodel.PDPage
import org.apache.pdfbox.pdmodel.graphics.color.PDColor
import org.apache.pdfbox.pdmodel.graphics.image.PDImage
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject
import org.apache.pdfbox.text.PDFTextStripper
import org.apache.pdfbox.text.TextPosition

/**
 * One GRAPHIC printed on a page of an attached document - a logo, an icon, an illustration, a seal,
 * a decorative drawing.
 *
 * Why this exists: a graphic is not a printed "entry", so transcribing the page text never produced
 * it, and a vision model can only APPROXIMATE what it sees. Here the artwork is taken out of the
 * PDF EXACTLY: a VECTOR graphic becomes inline SVG (real vector output, sharp at any size), a
 * bitmap becomes a PNG data URI. The model never sees the artwork itself - it only receives an id,
 * a kind and where the graphic sits on the page, and places it with the token `{{GRAPHIC:<id>}}`,
 * which the server replaces with the artwork. That is a mechanical substitution, not a semantic
 * decision.
 */
internal data class DocumentGraphic(
    /** Stable id used in the prompt token (`{{GRAPHIC:id}}`), unique within one document. */
    val id: String,
    /** 1-based page number the graphic is printed on. */
    val pageNo: Int,
    val kind: Kind,
    /** Size of the artwork in PDF points (72 pt = 1 inch). */
    val widthPt: Double,
    val heightPt: Double,
    /** Where the graphic sits vertically on its page: 0 = top edge, 1 = bottom edge. */
    val topFraction: Double,
    /** Inline SVG markup for a [Kind.VECTOR] graphic (already flipped to the SVG y axis). */
    val svg: String? = null,
    /** `data:image/png;base64,...` for a [Kind.RASTER] graphic. */
    val dataUri: String? = null,
    /**
     * The printed line DIRECTLY ABOVE the graphic, taken from the page's text layer. It is the
     * model's placement anchor: "put it between these two lines" is precise, "somewhere on the
     * page" is not - and a misplaced graphic is what a live run reported.
     */
    val anchorAbove: String? = null,
    /** The printed line DIRECTLY BELOW the graphic, from the page's text layer. */
    val anchorBelow: String? = null
) {
  internal enum class Kind {
    /** Real vector paths - emitted as inline SVG, so it stays sharp at every size. */
    VECTOR,

    /** An embedded bitmap - emitted as a PNG data URI. */
    RASTER
  }

  /** The HTML the server writes into the XSpan's `rtevalue` in place of the token. */
  val html: String
    get() =
        svg
            ?: dataUri?.let { "<img src='" + it + "' alt='' style='max-width:100%;height:auto;'>" }
            ?: ""

  /** One line for the prompt: the model needs the size and the position, never the artwork. */
  fun describe(): String {
    val w = widthPt.roundToInt()
    val h = heightPt.roundToInt()
    val place =
        when {
          topFraction < 0.2 -> "near the TOP of the page"
          topFraction < 0.45 -> "in the UPPER part of the page"
          topFraction < 0.65 -> "in the MIDDLE of the page"
          topFraction < 0.85 -> "in the LOWER part of the page"
          else -> "near the BOTTOM of the page"
        }
    val kindText =
        if (kind == Kind.VECTOR) "vector graphic (inline SVG)" else "bitmap graphic (image)"
    val anchor = buildString {
      if (anchorAbove == null && anchorBelow == null) return@buildString
      val where = mutableListOf<String>()
      if (anchorAbove != null) where += "directly BELOW the printed line '" + anchorAbove + "'"
      if (anchorBelow != null) where += "directly ABOVE the printed line '" + anchorBelow + "'"
      append(", printed ")
      append(where.joinToString(" and "))
    }
    return "- {{GRAPHIC:$id}} - $kindText, about ${w}x$h pt, $place$anchor"
  }
}

/**
 * Extracts the GRAPHICS of a PDF page-by-page, so a generated form can reproduce them.
 *
 * Two sources:
 * - VECTOR drawings: the content stream is walked with a [PDFGraphicsStreamEngine]; the filled and
 *   stroked paths are collected in DEVICE points, clustered by proximity (one cluster = one logo /
 *   illustration, not one path) and emitted as one inline `<svg>` with the SVG y axis.
 * - BITMAPS: the page's image XObjects (lossless PNG). Page backgrounds / scans are skipped by
 *   size, because a full-page scan is the page itself, not a graphic on it.
 *
 * Bounded on purpose: table rules, underlines, hairline separators and page-sized fills are dropped
 * (they are layout, not artwork), at most [MAX_PER_PAGE] graphics per page and [MAX_TOTAL] per
 * document are returned, and an enormously complex drawing falls back to nothing instead of
 * emitting a several-hundred-KB SVG.
 */
internal object DocumentGraphics {

  /** Maximum graphics returned per page (a logo row plus an illustration is about 2). */
  internal const val MAX_PER_PAGE = 6

  /** Maximum graphics returned for the whole document. */
  internal const val MAX_TOTAL = 24

  /** Bounding boxes closer than this (in points) belong to the SAME graphic. */
  private const val CLUSTER_GAP = 18f

  /** A cluster smaller than this (in points) is a bullet/marker, not a graphic. */
  private const val MIN_SIZE = 8f

  /** A cluster covering more than this share of the page is a background, not a graphic. */
  private const val MAX_PAGE_SHARE = 0.55

  /** A generated SVG bigger than this is not worth sending (and would blow up the prompt). */
  private const val MAX_SVG_CHARS = 120_000

  /**
   * How far (in points) a stroke may sit outside the filled ink and still belong to the drawing.
   */
  private const val INK_MARGIN = 12f

  /**
   * A mark smaller than this (in points) on both axes is a GLYPH (checkbox square), not a drawing.
   */
  private const val GLYPH_MAX = 14f

  /**
   * A strip at least this share of the page width and this many times wider than tall is LAYOUT.
   */
  private const val STRIP_WIDTH_SHARE = 0.45f

  private const val STRIP_ASPECT = 4f

  /** Hard stop for the path collector of one page (a CAD-like PDF must not stall the run). */
  private const val MAX_SHAPES_PER_PAGE = 20_000

  /** Raster graphics are downscaled so the data URI stays prompt-friendly. */
  private const val MAX_RASTER_SIDE = 900

  /**
   * All graphics of a PDF, grouped by 1-BASED page number. Never throws: a page that cannot be read
   * simply contributes nothing, so a usable document build is never lost because of a graphic.
   */
  internal fun extract(bytes: ByteArray): Map<Int, List<DocumentGraphic>> {
    if (bytes.isEmpty()) return emptyMap()
    return try {
      PDDocument.load(bytes).use { extract(it) }
    } catch (_: Exception) {
      emptyMap()
    }
  }

  /**
   * Same as [extract], for a document that is ALREADY open (the page splitter has it in hand, so
   * the PDF is parsed once per attachment instead of once per purpose).
   */
  internal fun extract(document: PDDocument): Map<Int, List<DocumentGraphic>> {
    return try {
      val byPage = LinkedHashMap<Int, List<DocumentGraphic>>()
      var total = 0
      for (index in 0 until document.numberOfPages) {
        if (total >= MAX_TOTAL) break
        val pageNo = index + 1
        val page = runCatching { document.getPage(index) }.getOrNull() ?: continue
        val found =
            runCatching { pageGraphics(document, page, pageNo) }
                .getOrDefault(emptyList())
                .take(max(0, min(MAX_PER_PAGE, MAX_TOTAL - total)))
        if (found.isEmpty()) continue
        total += found.size
        byPage[pageNo] = found
      }
      byPage
    } catch (_: Exception) {
      emptyMap()
    }
  }

  /** The graphics of ONE page, top to bottom, with ids `g<page>_<n>` (1-based). */
  private fun pageGraphics(document: PDDocument, page: PDPage, pageNo: Int): List<DocumentGraphic> {
    val box = page.cropBox ?: page.mediaBox ?: return emptyList()
    val pageHeight = box.height
    val pageTop = box.upperRightY
    val pageArea = box.width.toDouble() * pageHeight.toDouble()
    if (pageHeight <= 0f || pageArea <= 0.0) return emptyList()
    val out = mutableListOf<DocumentGraphic>()
    // The page's printed lines, used to say WHERE a graphic sits: "between these two printed lines"
    // is precise, "somewhere on the page" is not - a live run put the graphic on the wrong spot.
    val lines = runCatching { Lines.of(document, pageNo) }.getOrDefault(emptyList())

    // (1) VECTOR drawings - the actual reason this class exists (a logo is usually vector art).
    val shapes = runCatching { collectShapes(page) }.getOrDefault(emptyList())
    for (raw in cluster(shapes)) {
      // A form page is full of LAYOUT strokes: table rules, cell frames, underlines, separator
      // boxes. They were extracted as "graphics" too (six on one page in a live run), which both
      // cluttered the prompt and stretched a drawing's bounding box to its FRAME - so the anchor
      // line above a framed drawing was the one above the frame and the graphic landed one section
      // too low. Only the INK counts here.
      val cluster = refine(raw) ?: continue
      val w = cluster.maxX - cluster.minX
      val h = cluster.maxY - cluster.minY
      if (w < MIN_SIZE || h < MIN_SIZE) continue
      if (cluster.area > pageArea * MAX_PAGE_SHARE) continue
      if (isLayoutArtwork(cluster, box.width, pageTop, lines)) continue
      val svg = svgOf(cluster) ?: continue
      if (svg.length > MAX_SVG_CHARS) continue
      // Distance from the TOP of the page: the text layer measures from the top as well, so the
      // nearest line above/below the drawing can be picked directly.
      val topFromTop = pageTop - cluster.maxY
      val bottomFromTop = pageTop - cluster.minY
      val above = lines.filter { it.bottom <= topFromTop + 2f }.maxByOrNull { it.bottom }
      val below = lines.filter { it.top >= bottomFromTop - 2f }.minByOrNull { it.top }
      out +=
          DocumentGraphic(
              id = "g${pageNo}_${out.size + 1}",
              pageNo = pageNo,
              kind = DocumentGraphic.Kind.VECTOR,
              widthPt = w.toDouble(),
              heightPt = h.toDouble(),
              topFraction = ((pageTop - cluster.maxY) / pageHeight).toDouble().coerceIn(0.0, 1.0),
              svg = svg,
              anchorAbove = above?.text,
              anchorBelow = below?.text)
    }

    // (2) EMBEDDED BITMAPS (a logo exported as PNG/JPEG inside the PDF).
    out += rasterGraphics(page, pageNo, out.size + 1, pageArea)

    return out.sortedBy { it.topFraction }.take(MAX_PER_PAGE)
  }

  /**
   * The printed text lines of one page with their vertical extent, so a graphic can be anchored
   * between the lines it is printed between.
   *
   * A line's [Line.top]/[Line.bottom] are measured from the TOP of the page (PDFBox reports the
   * baseline in device space, from the top, for an unrotated page), which is the same direction the
   * vector clusters are measured in.
   */
  private class Lines : PDFTextStripper() {

    internal data class Line(
        /** Distance from the TOP of the page to the top of the line's glyphs. */
        val top: Float,
        /** Distance from the TOP of the page to the line's baseline. */
        val bottom: Float,
        /**
         * Horizontal extent, so a graphic can be told apart from the text it is printed next to.
         */
        val xMin: Float,
        val xMax: Float,
        val text: String
    )

    val lines = mutableListOf<Line>()

    init {
      sortByPosition = true
    }

    override fun writeString(text: String, textPositions: List<TextPosition>) {
      val first = textPositions.firstOrNull() ?: return
      val clean = text.replace(Regex("\\s+"), " ").trim()
      if (clean.isEmpty()) return
      val size = first.fontSizeInPt.takeIf { it > 0f } ?: 10f
      val label = if (clean.length > 90) clean.take(87) + "..." else clean
      val xMin = textPositions.minOf { it.xDirAdj }
      val xMax = textPositions.maxOf { it.xDirAdj + it.widthDirAdj }
      lines += Line(first.yDirAdj - size, first.yDirAdj, xMin, xMax, label)
    }

    companion object {
      /**
       * Reads the lines of ONE page. The stripping machinery emits lines from `getText`, not from
       * `processPage` alone, so the page range is pinned and the text is requested - the extractor
       * then sees exactly the strings the form build sees.
       */
      fun of(document: PDDocument, pageNo: Int): List<Line> =
          Lines()
              .also { collector ->
                collector.startPage = pageNo
                collector.endPage = pageNo
                runCatching { collector.getText(document) }
              }
              .lines
    }
  }

  // #region vector

  /** One painted path of the page, in DEVICE points (origin bottom-left, y up). */
  private data class Shape(
      val d: String,
      val fill: String?,
      val stroke: String?,
      val strokeWidth: Float,
      val minX: Float,
      val minY: Float,
      val maxX: Float,
      val maxY: Float,
      val pointCount: Int
  )

  private class Cluster(val shapes: List<Shape>) {
    val minX = shapes.minOf { it.minX }
    val minY = shapes.minOf { it.minY }
    val maxX = shapes.maxOf { it.maxX }
    val maxY = shapes.maxOf { it.maxY }
    val area = (maxX - minX).toDouble() * (maxY - minY).toDouble()
  }

  /** Walks the page content stream and collects every filled/stroked path. */
  private class VectorCollector(page: PDPage) : PDFGraphicsStreamEngine(page) {

    val shapes = mutableListOf<Shape>()
    private val d = StringBuilder()
    private var minX = Float.MAX_VALUE
    private var minY = Float.MAX_VALUE
    private var maxX = -Float.MAX_VALUE
    private var maxY = -Float.MAX_VALUE
    private var points = 0
    private var segments = 0
    private var lastX = 0f
    private var lastY = 0f

    override fun appendRectangle(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D) {
      val x = p0.x.toFloat()
      val y = p0.y.toFloat()
      d.append('M').append(num(x)).append(' ').append(num(y))
      grow(x, y)
      for (p in listOf(p1, p2, p3)) {
        d.append("L").append(num(p.x.toFloat())).append(' ').append(num(p.y.toFloat()))
        grow(p.x.toFloat(), p.y.toFloat())
      }
      d.append('Z')
      segments++
      lastX = x
      lastY = y
    }

    override fun moveTo(x: Float, y: Float) {
      if (d.isNotEmpty()) d.append(' ')
      d.append('M').append(num(x)).append(' ').append(num(y))
      grow(x, y)
      lastX = x
      lastY = y
    }

    override fun lineTo(x: Float, y: Float) {
      d.append('L').append(num(x)).append(' ').append(num(y))
      grow(x, y)
      segments++
      lastX = x
      lastY = y
    }

    override fun curveTo(x1: Float, y1: Float, x2: Float, y2: Float, x3: Float, y3: Float) {
      d.append('C')
          .append(num(x1))
          .append(' ')
          .append(num(y1))
          .append(' ')
          .append(num(x2))
          .append(' ')
          .append(num(y2))
          .append(' ')
          .append(num(x3))
          .append(' ')
          .append(num(y3))
      grow(x1, y1)
      grow(x2, y2)
      grow(x3, y3)
      segments++
      lastX = x3
      lastY = y3
    }

    override fun getCurrentPoint(): Point2D = Point2D.Float(lastX, lastY)

    override fun closePath() {
      if (d.isNotEmpty()) d.append('Z')
    }

    override fun endPath() {
      reset()
    }

    override fun clip(windingRule: Int) {
      // A clip path is not painted; it is discarded with the following endPath.
    }

    override fun strokePath() {
      commit(
          fill = null,
          stroke = rgb(getGraphicsState().strokingColor),
          width = getGraphicsState().lineWidth)
    }

    override fun fillPath(windingRule: Int) {
      commit(fill = rgb(getGraphicsState().nonStrokingColor), stroke = null, width = 0f)
    }

    override fun fillAndStrokePath(windingRule: Int) {
      commit(
          fill = rgb(getGraphicsState().nonStrokingColor),
          stroke = rgb(getGraphicsState().strokingColor),
          width = getGraphicsState().lineWidth)
    }

    override fun shadingFill(shadingName: COSName) {
      // A gradient fill has no per-path colour, so it is not turned into vector markup.
      reset()
    }

    override fun drawImage(image: PDImage) {
      // Images in the content stream are handled from the page's image XObjects (lossless).
    }

    private fun commit(fill: String?, stroke: String?, width: Float) {
      if (fill == null && stroke == null) {
        reset()
        return
      }
      if (segments > 0 && points >= 2 && minX <= maxX && minY <= maxY) {
        shapes +=
            Shape(
                d = d.toString(),
                fill = fill,
                stroke = stroke,
                strokeWidth = width,
                minX = minX,
                minY = minY,
                maxX = maxX,
                maxY = maxY,
                pointCount = points)
      }
      reset()
      if (shapes.size >= MAX_SHAPES_PER_PAGE) throw StopCollecting()
    }

    private fun grow(x: Float, y: Float) {
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
      points++
    }

    private fun reset() {
      d.setLength(0)
      minX = Float.MAX_VALUE
      minY = Float.MAX_VALUE
      maxX = -Float.MAX_VALUE
      maxY = -Float.MAX_VALUE
      points = 0
      segments = 0
    }
  }

  private class StopCollecting : RuntimeException()

  private fun collectShapes(page: PDPage): List<Shape> {
    val collector = VectorCollector(page)
    try {
      collector.processPage(page)
    } catch (_: StopCollecting) {
      // The page is too complex; the shapes collected so far are used.
    }
    return collector.shapes
  }

  /** Groups shapes whose bounding boxes touch or are closer than [CLUSTER_GAP] points. */
  private fun cluster(shapes: List<Shape>): List<Cluster> {
    if (shapes.isEmpty()) return emptyList()
    val used = BooleanArray(shapes.size)
    val out = mutableListOf<Cluster>()
    for (i in shapes.indices) {
      if (used[i]) continue
      used[i] = true
      val members = mutableListOf(shapes[i])
      var grew = true
      while (grew) {
        grew = false
        for (j in shapes.indices) {
          if (used[j]) continue
          if (members.any { near(it, shapes[j]) }) {
            members += shapes[j]
            used[j] = true
            grew = true
          }
        }
      }
      out += Cluster(members)
    }
    return out
  }

  /**
   * Narrows a cluster to the actual ARTWORK.
   *
   * Two problems a live run showed: one form page produced SIX "graphics" (table frames, cell boxes
   * and rules were extracted as artwork), and a drawing enclosed by a frame took that frame into
   * its bounding box - so its "printed line above" was the line above the FRAME and the graphic was
   * placed one section too low.
   *
   * Rules: a cluster without any filled shape is kept only when it contains curves (line art);
   * otherwise only straight rules and boxes remain, which are layout, not artwork. When the cluster
   * HAS filled ink, the frame strokes far outside that ink are dropped, so the bbox - and with it
   * the anchor line - is the drawing's own.
   */
  private fun refine(raw: Cluster): Cluster? {
    val filled = raw.shapes.filter { it.fill != null }
    if (filled.isEmpty()) {
      val hasCurve = raw.shapes.any { it.pointCount > 4 }
      return if (hasCurve) raw else null
    }
    val minX = filled.minOf { it.minX } - INK_MARGIN
    val minY = filled.minOf { it.minY } - INK_MARGIN
    val maxX = filled.maxOf { it.maxX } + INK_MARGIN
    val maxY = filled.maxOf { it.maxY } + INK_MARGIN
    val keep =
        raw.shapes.filter {
          it.fill != null ||
              (it.minX >= minX && it.maxX <= maxX && it.minY >= minY && it.maxY <= maxY)
        }
    return if (keep.isEmpty()) null else Cluster(keep)
  }

  /**
   * True when a cluster is LAYOUT, not artwork.
   *
   * A live run showed why this matters more than any placement logic: a three-page application form
   * produced TEN "graphics", but only ONE of them (the apple, `142x83 pt`) was a drawing. The rest
   * were rows of printed CHECKBOX GLYPHS (`484x13 pt`, three of them), ruled bands spanning the
   * whole text column (`485x68 pt`, `484x59 pt`, `484x85 pt`) and similar strips. The build
   * rendered every one of them as artwork on the page, which added vertical space above the drawing
   * and moved the apple FURTHER DOWN the form than it is in the PDF - no amount of anchor-matching
   * can compensate for artwork that should never have existed.
   *
   * Three independent signs identify layout, each of them alone insufficient but together exact:
   * 1. a printed TEXT LINE lies inside the cluster's box - a glyph row or a boxed headline band is
   *    always crossed by the words it belongs to, while an illustration stands alone;
   * 2. the cluster consists of several SMALL marks - a row of checkbox squares, never one picture;
   * 3. the cluster is a full-width STRIP far wider than tall - a rule, separator or table band.
   */
  private fun isLayoutArtwork(
      cluster: Cluster,
      pageWidth: Float,
      pageTop: Float,
      lines: List<Lines.Line>
  ): Boolean {
    val w = cluster.maxX - cluster.minX
    val h = cluster.maxY - cluster.minY
    if (w <= 0f || h <= 0f) return true
    val topFromTop = pageTop - cluster.maxY
    val bottomFromTop = pageTop - cluster.minY
    // (1) A printed line runs through the cluster: the marks ARE the printed text's glyphs.
    for (line in lines) {
      val overlap = min(line.bottom, bottomFromTop) - max(line.top, topFromTop)
      val lineHeight = (line.bottom - line.top).coerceAtLeast(1f)
      if (overlap >= lineHeight * 0.6f &&
          line.xMax > cluster.minX + 2f &&
          line.xMin < cluster.maxX - 2f) {
        return true
      }
    }
    // (2) Several small marks: a row of checkbox squares / bullets.
    val smallMarks =
        cluster.shapes.count { s ->
          (s.maxX - s.minX) <= GLYPH_MAX && (s.maxY - s.minY) <= GLYPH_MAX
        }
    if (smallMarks >= 3 && smallMarks * 2 >= cluster.shapes.size) return true
    // (3) A strip across the text column: a rule, a separator, a table band.
    if (w >= pageWidth * STRIP_WIDTH_SHARE && w / h >= STRIP_ASPECT) return true
    return false
  }

  private fun near(a: Shape, b: Shape): Boolean =
      b.minX <= a.maxX + CLUSTER_GAP &&
          b.maxX >= a.minX - CLUSTER_GAP &&
          b.minY <= a.maxY + CLUSTER_GAP &&
          b.maxY >= a.minY - CLUSTER_GAP

  /**
   * One inline `<svg>` for the cluster. The paths stay in PDF DEVICE coordinates; a single wrapping
   * `<g>` moves them into the cluster's box and flips the y axis (PDF points up, SVG points down),
   * so the drawing is upright and no coordinate has to be rewritten.
   */
  private fun svgOf(cluster: Cluster): String? {
    if (cluster.shapes.isEmpty()) return null
    val w = cluster.maxX - cluster.minX
    val h = cluster.maxY - cluster.minY
    if (w <= 0f || h <= 0f) return null
    return buildString {
      append("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 ")
      append(num(w))
      append(' ')
      append(num(h))
      append("\" width=\"")
      append(num(w))
      append("\" height=\"")
      append(num(h))
      append("\" role=\"img\">")
      append("<g transform=\"translate(")
      append(num(-cluster.minX))
      append(' ')
      append(num(h + cluster.minY))
      append(") scale(1,-1)\">")
      for (shape in cluster.shapes) {
        append("<path d=\"")
        append(shape.d)
        append("\" fill=\"")
        append(shape.fill ?: "none")
        append('"')
        if (shape.stroke != null) {
          append(" stroke=\"")
          append(shape.stroke)
          append("\" stroke-width=\"")
          append(num(max(shape.strokeWidth, 0.4f)))
          append('"')
        }
        append("/>")
      }
      append("</g></svg>")
    }
  }

  // #endregion

  // #region raster

  /** The page's embedded bitmap graphics, downscaled to a prompt-friendly PNG data URI. */
  private fun rasterGraphics(
      page: PDPage,
      pageNo: Int,
      firstIndex: Int,
      pageArea: Double
  ): List<DocumentGraphic> {
    val resources = page.resources ?: return emptyList()
    val out = mutableListOf<DocumentGraphic>()
    for (name in resources.xObjectNames) {
      if (out.size >= MAX_PER_PAGE) break
      val image =
          runCatching { resources.getXObject(name) }.getOrNull() as? PDImageXObject ?: continue
      if (image.isStencil) continue
      val w = image.width
      val h = image.height
      if (w < 48 || h < 48) continue
      // A full-page scan/background IS the page, not a graphic printed on it.
      if (w >= 1400 && h >= 1400) continue
      val pointsArea = w.toDouble() * h.toDouble()
      if (pointsArea > pageArea * 40.0) continue
      val buffered = runCatching { image.image }.getOrNull() ?: continue
      val scaled = downscale(buffered, MAX_RASTER_SIDE)
      val png = toPng(scaled) ?: continue
      out +=
          DocumentGraphic(
              id = "g${pageNo}_${firstIndex + out.size}",
              pageNo = pageNo,
              kind = DocumentGraphic.Kind.RASTER,
              widthPt = w.toDouble(),
              heightPt = h.toDouble(),
              // An XObject carries no position in the resources - the caller sorts these after the
              // vectors and the prompt only needs to know that they exist on this page.
              topFraction = 0.5,
              dataUri = "data:image/png;base64," + Base64.getEncoder().encodeToString(png))
    }
    return out
  }

  private fun downscale(image: BufferedImage, maxSide: Int): BufferedImage {
    val side = max(image.width, image.height)
    if (side <= maxSide) return image
    val scale = maxSide.toDouble() / side.toDouble()
    val w = max(1, (image.width * scale).roundToInt())
    val h = max(1, (image.height * scale).roundToInt())
    val out = BufferedImage(w, h, BufferedImage.TYPE_INT_RGB)
    val g = out.createGraphics()
    try {
      g.drawImage(image, 0, 0, w, h, null)
    } finally {
      g.dispose()
    }
    return out
  }

  private fun toPng(image: BufferedImage): ByteArray? =
      runCatching {
            val out = ByteArrayOutputStream()
            ImageIO.write(image, "PNG", out)
            out.toByteArray()
          }
          .getOrNull()

  // #endregion

  // #region helpers

  /** `#rrggbb` for a PDF colour (gray / RGB / CMYK); null when it cannot be expressed as RGB. */
  private fun rgb(color: PDColor?): String? {
    val components = color?.components ?: return null
    if (components.isEmpty()) return null
    val r: Float
    val g: Float
    val b: Float
    when (components.size) {
      1 -> {
        r = components[0]
        g = r
        b = r
      }
      3 -> {
        r = components[0]
        g = components[1]
        b = components[2]
      }
      4 -> {
        val k = components[3]
        r = (1f - components[0]) * (1f - k)
        g = (1f - components[1]) * (1f - k)
        b = (1f - components[2]) * (1f - k)
      }
      else -> return null
    }
    fun channel(value: Float) =
        (value.coerceIn(0f, 1f) * 255f).roundToInt().toString(16).padStart(2, '0')
    return "#" + channel(r) + channel(g) + channel(b)
  }

  /** Trims a float to at most two decimals without a locale-dependent separator. */
  private fun num(value: Float): String {
    val text = String.format(Locale.ROOT, "%.2f", value)
    return if (text.contains('.')) text.trimEnd('0').trimEnd('.') else text
  }

  // #endregion
}
