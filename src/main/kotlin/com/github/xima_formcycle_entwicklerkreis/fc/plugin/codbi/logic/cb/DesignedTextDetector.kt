package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

/**
 * Decides whether a request needs the DETAILED `XSpan` widget section in the pass-2 prompt.
 *
 * Why this exists: pass 1 only receives the CONDENSED widget reference
 * ([CodbiCapabilities.buildWidgetsSection], i.e. the `compact.formcycle_widgets` records), and the
 * parameter-complete `formcycle.widgets.<name>` sections are transmitted in pass 2 **only for the
 * widgets the model itself asked for** in its `need_codbi_details` response. A request for a
 * designed / animated text or an inline SVG illustration therefore lost the detailed `XSpan`
 * template — the illustration rules with the worked example and the forbidden-composition list —
 * whenever the model did not happen to request `XSpan` (observed: the form was built in pass 2 with
 * no `XSpan` guidance, which is where the naive single-`<rect>` drawings came from).
 *
 * [withXSpan] closes that hole deterministically: when the request talks about design / interaction
 * / illustration, `XSpan` is appended to the requested widget list so the detailed template is
 * always delivered in the pass that BUILDS the form. Adding it is cheap (one section) and can never
 * remove information.
 *
 * The detection is deliberately a LANGUAGE-AGNOSTIC keyword match (the form requests are free text
 * in any language), and it errs towards INCLUDING the section — a false positive only costs tokens.
 */
internal object DesignedTextDetector {

  /**
   * Substrings (lowercased) that mark a request for a designed / interactive text, a drawing or an
   * illustration. Covers the German requests this feature was built for ("in schönem Design",
   * "interaktiv", "animierte SVG Illustration", "Grafik", "Zeichnung", "Hinweis") plus the English
   * equivalents. Short/ambiguous tokens (`icon`, `hover`, `karte`) are intentional: they only widen
   * the delivered detail section.
   */
  private val HINTS: List<String> =
      listOf(
          "svg",
          "illustration",
          "illustrat",
          "illustrier",
          "zeichnung",
          "zeichne",
          "grafik",
          "grafisch",
          "graphic",
          "infografik",
          "piktogramm",
          "pictogram",
          "animier",
          "animated",
          "animation",
          "animate",
          "interaktiv",
          "interactive",
          "design",
          "gestaltung",
          "gestaltet",
          "aufgehübscht",
          "aufgewertet",
          "banner",
          "icon",
          "icon-",
          "sparkle",
          "hover",
          "hovereffekt",
          "highlight")

  /**
   * `true` when [prompt] asks for something that needs the detailed `XSpan` template (a designed /
   * interactive text, an animation, a drawing or an illustration). Also used for the diagnostic log
   * so a support case can be answered from the plugin log alone.
   */
  fun wantsDesignedTextOrIllustration(prompt: String?): Boolean {
    if (prompt.isNullOrBlank()) return false
    val lower = prompt.lowercase()
    return HINTS.any { it in lower }
  }

  /**
   * Returns [widgetIds] with `XSpan` appended when [prompt] needs the designed-text/illustration
   * rules and the caller did not request `XSpan` already (comparison trims and ignores case, since
   * the model may answer with `xspan`, `XSpan` or `XSpan `).
   */
  fun withXSpan(widgetIds: List<String>, prompt: String?): List<String> {
    if (!wantsDesignedTextOrIllustration(prompt)) return widgetIds
    val hasXSpan =
        widgetIds.any { it.trim().equals("XSpan", ignoreCase = true) } ||
            widgetIds.any { it.trim().equals("sp", ignoreCase = true) }
    return if (hasXSpan) widgetIds else widgetIds + "XSpan"
  }
}
