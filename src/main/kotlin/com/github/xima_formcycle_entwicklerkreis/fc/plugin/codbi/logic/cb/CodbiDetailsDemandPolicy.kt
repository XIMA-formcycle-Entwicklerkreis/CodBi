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

  /**
   * DEGENERATE-LOOP GUARD: true when a newly received `need_codbi_details` demand names the SAME
   * elements AND the SAME widgets that were already sent for the current rerun (set-equal,
   * order-insensitive so a reordered request is still recognized as a repeat).
   *
   * This happens when the model misuses the "elements" field (which is for CodBi FUNCTION ids) by
   * listing FORM element names — e.g. "spIntro", "cbShowData", "fdPersonData" — that never resolve
   * to a CodBi id. Because the name index (rather than targeted details) is sent back, the model
   * never gets the targeted templates it expects and re-asks for the exact same thing on every
   * rerun, degrading a run into ~10 full ~62KB payload re-emissions (~200k+ tokens) for a
   * near-identical form. Re-sending an identical payload cannot produce anything new, so a repeat
   * is a signal to stop looping and escalate to the forced final complete-form pass.
   *
   * Safety contract (fail-open): only an EXACT set-equal repeat of BOTH lists is suppressed. A
   * demand that names anything NEW (an extra element, an extra widget, or a changed list) still
   * reruns — a genuine request for fresh details is never dropped.
   */
  fun repeatsPreviouslySent(
      newElements: Collection<String>,
      newWidgets: Collection<String>,
      sentElements: Collection<String>,
      sentWidgets: Collection<String>
  ): Boolean =
      newElements.toSortedSet() == sentElements.toSortedSet() &&
          newWidgets.toSortedSet() == sentWidgets.toSortedSet()
}
