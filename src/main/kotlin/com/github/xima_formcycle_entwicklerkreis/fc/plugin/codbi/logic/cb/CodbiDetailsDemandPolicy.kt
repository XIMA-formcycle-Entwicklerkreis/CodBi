package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

/**
 * LEVER (pass-2 token reduction) — is a `need_codbi_details` demand actually specified?
 *
 * The AI's demand-loading envelope must name WHAT it needs: one or more CodBi elements, one or more
 * Formcycle widgets, or both. A signal that names NOTHING (`elements` AND `widgets` both empty) is
 * an *unspecified* demand.
 *
 * Historically the assistant re-ran with the FULL compact API for such a blank signal — a blind
 * inference that adds no targeted knowledge and burns an entire pass. The guard treats a blank
 * demand as "no details requested": the caller falls through to its normal handling (rebuild
 * created widgets / applied / considered / blind pass), which already performs the correct
 * recovery.
 *
 * Safety contract (fail-open): the rerun is ONLY suppressed when the demand names nothing. Anything
 * named — an element, a widget, or both — still reruns exactly as before, so no legitimate targeted
 * request is ever dropped.
 */
internal object CodbiDetailsDemandPolicy {

  /**
   * True only when the demand names at least one element or one widget, i.e. it is a targeted
   * request worth a full compact-API rerun. A blank demand (both lists empty) returns false so the
   * caller does NOT waste a full inference on it.
   */
  fun isSpecified(elements: Collection<String>, widgets: Collection<String>): Boolean =
      elements.isNotEmpty() || widgets.isNotEmpty()
}
