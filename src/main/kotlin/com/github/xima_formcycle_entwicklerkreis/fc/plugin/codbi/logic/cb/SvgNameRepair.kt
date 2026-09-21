package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.GsonBuilder
import com.google.gson.JsonArray
import com.google.gson.JsonParser
import org.slf4j.LoggerFactory

/**
 * Deterministic repair of the SVG ELEMENT/ATTRIBUTE names inside the AI's text elements
 * (`XSpan.properties.rtevalue`).
 *
 * SVG markup is CASE-SENSITIVE, and a wrongly spelled name is SILENTLY IGNORED by the browser:
 * - a wrong `viewBox` spelling (`viewbox`) discards the canvas, so the drawing is cut off;
 * - a wrong `animateTransform` / `attributeName` / `repeatCount` discards the animation entirely,
 *   so an "animated" illustration renders static;
 * - a wrong `linearGradient` / `clipPath` / `feDropShadow` drops that element (no fill, no clip, no
 *   shadow);
 * - a hyphen-omitted presentation attribute (`strokewidth` instead of `stroke-width`, `stopcolor`
 *   instead of `stop-color`) leaves the shape unstyled.
 *
 * The repair is POSITION-AWARE so it can never touch prose: an ELEMENT name is only rewritten right
 * after `<` / `</` and before whitespace/`>`/`/`, and an ATTRIBUTE name only after whitespace and
 * before `=` — a word that merely occurs in the visible text (`"this viewbox is only a word"`) is
 * left alone. The lookup key is the lowercased name with the spece's hyphens removed, so BOTH the
 * casing mistake and the hyphen-omission mistake resolve to the same canonical entry.
 *
 * NOTE: [AICodBiAssistant] carries an equivalent private implementation (its
 * `normalizeSvgAttributeNames`), mirroring how that class duplicates several helpers of this one.
 * Keep the two registries in sync.
 */
internal object SvgNameRepair {

  private val logger = LoggerFactory.getLogger(SvgNameRepair::class.java)
  private val gson = GsonBuilder().create()

  /**
   * The COMPLETE set of camelCase SVG/SMIL ELEMENT names (SVG 1.1 + SVG 2 + SMIL, including the
   * deprecated `animateColor` / `altGlyph*` / `hKern` / `vKern`). Only names that are NOT already
   * all-lowercase are listed — every other element name (`svg`, `g`, `defs`, `rect`, `circle`,
   * `path`, `line`, `ellipse`, `polygon`, `polyline`, `text`, `tspan`, `use`, `symbol`, `marker`,
   * `mask`, `pattern`, `filter`, `image`, `animate`, `set`, `stop`, `a`, `switch`, `view`,
   * `metadata`, `title`, `desc`, `style`, `script`, `mpath`, `cursor`, ...) is already correct.
   */
  private val CANONICAL_ELEMENTS =
      listOf(
          "altGlyph",
          "altGlyphDef",
          "altGlyphItem",
          "animateColor",
          "animateMotion",
          "animateTransform",
          "clipPath",
          "feBlend",
          "feColorMatrix",
          "feComponentTransfer",
          "feComposite",
          "feConvolveMatrix",
          "feDiffuseLighting",
          "feDisplacementMap",
          "feDistantLight",
          "feDropShadow",
          "feFlood",
          "feFuncA",
          "feFuncB",
          "feFuncG",
          "feFuncR",
          "feGaussianBlur",
          "feImage",
          "feMerge",
          "feMergeNode",
          "feMorphology",
          "feOffset",
          "fePointLight",
          "feSpecularLighting",
          "feSpotLight",
          "feTile",
          "feTurbulence",
          "foreignObject",
          "glyphRef",
          "hKern",
          "linearGradient",
          "radialGradient",
          "textPath",
          "vKern")

  /**
   * The COMPLETE set of NON-lowercase SVG/SMIL ATTRIBUTE names — the camelCase attributes and the
   * hyphenated presentation attributes (`stroke-width`, `stop-color`, `font-size`, ...). Every
   * attribute that is already all-lowercase (`x`, `d`, `id`, `class`, `href`, `offset`, `order`,
   * `mode`, `type`, ...) needs no entry.
   */
  private val CANONICAL_ATTRIBUTES =
      listOf(
          "alignment-baseline",
          "attributeName",
          "attributeType",
          "baseFrequency",
          "baseProfile",
          "baseline-shift",
          "calcMode",
          "clip-rule",
          "clipPathUnits",
          "color-interpolation",
          "color-interpolation-filters",
          "color-rendering",
          "contentScriptType",
          "contentStyleType",
          "diffuseConstant",
          "dominant-baseline",
          "edgeMode",
          "enable-background",
          "externalResourcesRequired",
          "fill-opacity",
          "fill-rule",
          "filterRes",
          "filterUnits",
          "flood-color",
          "flood-opacity",
          "font-family",
          "font-size",
          "font-size-adjust",
          "font-stretch",
          "font-style",
          "font-variant",
          "font-weight",
          "glyph-orientation-horizontal",
          "glyph-orientation-vertical",
          "glyphRef",
          "gradientTransform",
          "gradientUnits",
          "horizAdvX",
          "horizOriginX",
          "horizOriginY",
          "image-rendering",
          "kernelMatrix",
          "kernelUnitLength",
          "keyPoints",
          "keySplines",
          "keyTimes",
          "lengthAdjust",
          "letter-spacing",
          "lighting-color",
          "markerHeight",
          "markerUnits",
          "markerWidth",
          "maskContentUnits",
          "maskUnits",
          "numOctaves",
          "paint-order",
          "pathLength",
          "patternContentUnits",
          "patternTransform",
          "patternUnits",
          "pointer-events",
          "preserveAlpha",
          "preserveAspectRatio",
          "primitiveUnits",
          "refX",
          "refY",
          "rendering-intent",
          "repeatCount",
          "repeatDur",
          "requiredExtensions",
          "requiredFeatures",
          "shape-rendering",
          "specularConstant",
          "specularExponent",
          "spreadMethod",
          "startOffset",
          "stdDeviation",
          "stitchTiles",
          "stop-color",
          "stop-opacity",
          "stroke-dasharray",
          "stroke-dashoffset",
          "stroke-linecap",
          "stroke-linejoin",
          "stroke-miterlimit",
          "stroke-opacity",
          "stroke-width",
          "surfaceScale",
          "systemLanguage",
          "tableValues",
          "targetX",
          "targetY",
          "text-anchor",
          "text-decoration",
          "text-rendering",
          "textLength",
          "unicode-bidi",
          "vector-effect",
          "vertAdvY",
          "vertOriginX",
          "vertOriginY",
          "viewBox",
          "viewTarget",
          "word-spacing",
          "writing-mode",
          "xChannelSelector",
          "yChannelSelector",
          "zoomAndPan")

  private val ELEMENT_BY_KEY = CANONICAL_ELEMENTS.associateBy { it.svgNameKey() }
  private val ATTRIBUTE_BY_KEY = CANONICAL_ATTRIBUTES.associateBy { it.svgNameKey() }

  /**
   * `<name` / `</name` followed by whitespace / `>` / `/` — an ELEMENT position (closing tags too).
   */
  private val ELEMENT_RX = Regex("(?i)(</?)([a-z][a-z0-9-]*)(?=[\\s/>])")

  /** Whitespace + `name` + `=` — an ATTRIBUTE position. */
  private val ATTRIBUTE_RX = Regex("(?i)(\\s)([a-z][a-z0-9-]*)(\\s*=)")

  /** Lookup key: lowercased with the spec's hyphens removed (`stroke-width` -> `strokewidth`). */
  private fun String.svgNameKey(): String = lowercase().replace("-", "")

  /** An innermost CSS declaration block (`{…}`) — a rule, never a nested `@media` wrapper. */
  private val CSS_BLOCK_RX = Regex("\\{([^{}]*)\\}")

  /**
   * Repairs the `rtevalue` of every `XSpan` in [formJson]; returns the (possibly) rewritten JSON.
   */
  fun repairXSpanRtevalues(formJson: String): String {
    return try {
      val root = JsonParser.parseString(formJson).asJsonObject
      val items = root.getAsJsonArray("items") ?: return formJson
      if (!repairItems(items)) return formJson
      gson.toJson(root)
    } catch (e: Exception) {
      logger.warn("[SvgNameRepair] XSpan rtevalue repair failed: {}", e.message)
      formJson
    }
  }

  /**
   * Repairs the `rtevalue` of every `XSpan` in [items] IN PLACE (SVG names + `transform-box`);
   * returns `true` when something was rewritten.
   */
  fun repairItems(items: JsonArray): Boolean {
    val changed =
        mapXSpanRtevalues(items) {
          repairAnimatedTransformAttributesIn(repairTransformBoxIn(repairNamesIn(it)))
        }
    if (changed) {
      logger.info(
          "[SvgNameRepair] Repaired the illustration markup of a text element (SVG names / transform-box / animated transform)")
    }
    return changed
  }

  /**
   * Repairs ONLY the `transform-box` defect of every `XSpan` in [items] IN PLACE; returns `true`
   * when something was rewritten. Exposed separately because [AICodBiAssistant] carries its own
   * copy of the SVG NAME repair but not of this one.
   */
  fun repairTransformBoxes(items: JsonArray): Boolean =
      mapXSpanRtevalues(items) { repairTransformBoxIn(it) }

  /**
   * Repairs ONLY the "animating `transform` on an element that also carries a `transform`
   * ATTRIBUTE" defect of every `XSpan` in [items] IN PLACE; returns `true` when something was
   * rewritten. Exposed separately for [AICodBiAssistant] like [repairTransformBoxes].
   */
  fun repairAnimatedTransforms(items: JsonArray): Boolean =
      mapXSpanRtevalues(items) { repairAnimatedTransformAttributesIn(it) }

  /** Applies [transform] to the `rtevalue` of every `XSpan` in [items] that contains markup. */
  private fun mapXSpanRtevalues(items: JsonArray, transform: (String) -> String): Boolean {
    var changed = false
    for (item in items) {
      if (!item.isJsonObject) continue
      val o = item.asJsonObject
      if (o.get("className")?.takeIf { it.isJsonPrimitive }?.asString != "XSpan") continue
      val props = o.getAsJsonObject("properties") ?: continue
      val rte = props.get("rtevalue")?.takeIf { it.isJsonPrimitive }?.asString ?: continue
      if (rte.indexOf('<') < 0) continue
      val fixed = transform(rte)
      if (fixed != rte) {
        props.addProperty("rtevalue", fixed)
        changed = true
      }
    }
    return changed
  }

  /** Rewrites the misspelled SVG ELEMENT/ATTRIBUTE names of one `rtevalue`. */
  internal fun repairNamesIn(rte: String): String {
    val elements =
        ELEMENT_RX.replace(rte) { m ->
          val canonical = ELEMENT_BY_KEY[m.groupValues[2].svgNameKey()]
          if (canonical == null) m.value else m.groupValues[1] + canonical
        }
    return ATTRIBUTE_RX.replace(elements) { m ->
      val canonical = ATTRIBUTE_BY_KEY[m.groupValues[2].svgNameKey()]
      if (canonical == null) m.value else m.groupValues[1] + canonical + m.groupValues[3]
    }
  }

  /**
   * Adds `transform-box:fill-box` to every CSS rule that sets `transform-origin` without it.
   *
   * Why this is a repair and not a style opinion: the initial value of `transform-box` is
   * `view-box`, so `transform-origin:center` / `bottom center` inside an INLINE SVG resolves
   * against the whole SVG VIEWPORT instead of the shape's own box. The observed effect is a
   * "rotating globe" that visibly ORBITS (or a shape that drifts off its position) — the animation
   * runs, but it does the opposite of what was asked ("der Globus soll sich um die eigene Achse
   * drehen"). With `transform-box:fill-box` the origin is the shape's own bounding box, so a spin
   * spins in place.
   *
   * Only rules WITHOUT an existing `transform-box` are touched (an explicit value always wins), and
   * only inside the AI-authored `<style>` of a text element.
   */
  internal fun repairTransformBoxIn(rte: String): String {
    var changed = false
    val fixed =
        CSS_BLOCK_RX.replace(rte) { m ->
          val body = m.groupValues[1]
          if (body.contains("transform-origin") && !body.contains("transform-box")) {
            changed = true
            // The block's LAST declaration may omit its semicolon — add one when it is missing so
            // the appended declaration cannot be glued onto the previous value.
            val separator = if (body.trimEnd().endsWith(";")) "" else ";"
            m.value.dropLast(1) + separator + "transform-box:fill-box;}"
          } else {
            m.value
          }
        }
    if (changed) {
      logger.info(
          "[SvgNameRepair] Added the missing transform-box:fill-box to a transform-origin rule")
    }
    return if (changed) fixed else rte
  }

  /**
   * Any start/end tag, with its attribute text isolated (quoted values may contain `>`). The
   * unquoted part excludes `/` so a self-closing tag's slash is captured by the last group instead
   * of being swallowed into the attribute text.
   */
  private val TAG_RX =
      Regex("""<(/?)([A-Za-z][A-Za-z0-9:_-]*)((?:[^>"'/]|"[^"]*"|'[^']*')*)(/?)>""")

  /** `<style>…</style>` — the animation CSS of one text element. */
  private val STYLE_BLOCK_RX = Regex("""(?is)<style[^>]*>(.*?)</style>""")

  /**
   * A selector and its declaration block — matched innermost-first, so nested `@media` survives.
   */
  private val SELECTOR_BLOCK_RX = Regex("""([^{}]*)\{([^{}]*)\}""")

  /** `@keyframes <name>{` — the block body is extracted separately (it contains braces). */
  private val KEYFRAMES_RX = Regex("""(?is)@keyframes\s+([A-Za-z_][\w-]*)\s*\{""")

  /** `animation: …` / `animation-name: …` declarations of a rule. */
  private val ANIMATION_VALUE_RX = Regex("""(?i)animation(?:-name)?\s*:\s*([^;}]+)""")

  /** `.<class>` inside a selector. */
  private val SELECTOR_CLASS_RX = Regex("""\.([A-Za-z_][\w-]*)""")

  /** `class="…"` / `class='…'` of a tag. */
  private val CLASS_ATTR_RX = Regex("""(?i)\sclass\s*=\s*["']([^"']*)["']""")

  /** `transform="…"` / `transform='…'` of a tag (the leading space belongs to the match). */
  private val TRANSFORM_ATTR_RX = Regex("""(?i)\stransform\s*=\s*["'][^"']*["']""")

  /**
   * Returns the text inside the brace block that starts right after `pos`, or `null` if unclosed.
   */
  private fun braceBodyAfter(text: String, pos: Int): String? {
    var depth = 1
    var i = pos
    while (i < text.length) {
      when (text[i]) {
        '{' -> depth++
        '}' -> {
          depth--
          if (depth == 0) return text.substring(pos, i)
        }
      }
      i++
    }
    return null
  }

  /**
   * The class names whose CSS rule ANIMATES `transform` — i.e. the classes whose animation erases a
   * `transform` presentation attribute of the same element (see
   * [repairAnimatedTransformAttributesIn]).
   */
  internal fun transformAnimatedClasses(rte: String): Set<String> {
    val style = STYLE_BLOCK_RX.find(rte)?.groupValues?.get(1) ?: return emptySet()
    // The `@keyframes` that actually change `transform`.
    val animatedNames =
        KEYFRAMES_RX.findAll(style)
            .filter { m ->
              val body = braceBodyAfter(style, m.range.last + 1)
              body != null && Regex("""(?i)transform\s*:""").containsMatchIn(body)
            }
            .map { it.groupValues[1].lowercase() }
            .toSet()
    if (animatedNames.isEmpty()) return emptySet()
    val classes = LinkedHashSet<String>()
    for (m in SELECTOR_BLOCK_RX.findAll(style)) {
      val selector = m.groupValues[1]
      if (selector.contains("@keyframes")) continue
      val animation =
          ANIMATION_VALUE_RX.findAll(m.groupValues[2])
              .joinToString(" ") { it.groupValues[1] }
              .lowercase()
      if (animation.isEmpty()) continue
      if (animatedNames.none { animation.contains(it) }) continue
      SELECTOR_CLASS_RX.findAll(selector).forEach { classes.add(it.groupValues[1]) }
    }
    return classes
  }

  /**
   * Moves a `transform` ATTRIBUTE into a wrapping `<g>` when the element's own class CSS-animates
   * `transform`.
   *
   * Why: a CSS animation of `transform` REPLACES the element's `transform` presentation attribute
   * (animations outrank presentation attributes), so `<g class='spGlobe'
   * transform='translate(340,30)'>` loses its `translate(340,30)` for the whole duration of the
   * animation — the globe then renders at the SVG ORIGIN and rotates there, overlapping the first
   * drawing element and leaving its intended place empty. Observed in a real run. Wrapping the
   * element (`<g transform='translate(340,30)'><g class='spGlobe'>…</g></g>`) keeps the positioning
   * and the animation independent, which is exactly what the widget reference tells the model to
   * do.
   *
   * Only elements that carry BOTH an animated-`transform` class and a `transform` attribute are
   * touched; the rewrite is idempotent (the inner element loses the attribute) and leaves all other
   * markup byte-identical.
   */
  internal fun repairAnimatedTransformAttributesIn(rte: String): String {
    val classes = transformAnimatedClasses(rte)
    if (classes.isEmpty() || !rte.contains("transform=")) return rte
    val out = StringBuilder(rte.length + 64)
    val names = ArrayDeque<String>()
    val wrapped = ArrayDeque<Boolean>()
    var last = 0
    for (m in TAG_RX.findAll(rte)) {
      out.append(rte, last, m.range.first)
      last = m.range.last + 1
      val attrs = m.groupValues[3]
      val name = m.groupValues[2]
      val selfClosing = m.groupValues[4] == "/"
      if (m.groupValues[1] == "/") {
        out.append(m.value)
        var anyWrapper = false
        var matched = false
        while (names.isNotEmpty()) {
          val openName = names.removeLast()
          val wasWrapped = wrapped.removeLast()
          if (wasWrapped) anyWrapper = true
          if (openName.equals(name, ignoreCase = true)) {
            matched = true
            break
          }
        }
        if (matched && anyWrapper) out.append("</g>")
        continue
      }
      val transform = TRANSFORM_ATTR_RX.find(attrs)?.value
      val classNames =
          CLASS_ATTR_RX.find(attrs)?.groupValues?.get(1)?.split(Regex("""\s+""")) ?: emptyList()
      val needsWrapper = transform != null && classNames.any { it in classes }
      if (!needsWrapper) {
        out.append(m.value)
        if (!selfClosing) {
          names.addLast(name)
          wrapped.addLast(false)
        }
        continue
      }
      val cleaned = attrs.replace(transform!!, "")
      out.append("<g ").append(transform.trim()).append(">")
      out.append('<').append(name).append(cleaned)
      if (selfClosing) {
        out.append("/></g>")
      } else {
        out.append('>')
        names.addLast(name)
        wrapped.addLast(true)
      }
    }
    out.append(rte, last, rte.length)
    val result = out.toString()
    if (result != rte) {
      logger.info(
          "[SvgNameRepair] Moved a `transform` attribute into a wrapper <g> (the element's CSS transform animation would otherwise erase it)")
    }
    return result
  }
}
