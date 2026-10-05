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

  /**
   * DEGENERATE-LOOP GUARD (early) — true when a `need_codbi_details` demand asks for SOMETHING NEW
   * that nonetheless CANNOT resolve, so the rerun would send the identical name index again and the
   * model would simply re-ask.
   *
   * Measured case: pass-2 answered
   * `{"status":"need_codbi_details","elements":["btlSend"],"widgets":["XButtonList"]}` where
   * `btlSend` is a FORM element name (the `elements` field is for CodBi FUNCTION ids) and
   * `XButtonList` had already been sent. Nothing new resolved, yet the request differed from the
   * sent set, so the set-equal guard did not fire until AFTER the run had paid one extra full ~57
   * KB pass-3 inference.
   *
   * [resolves] reports whether a set of newly named element ids maps to real CodBi knowledge (the
   * caller passes `CodbiCapabilities.buildFullSectionFor(ids).isNotBlank()`).
   *
   * Safety contract (fail-open): returning true requires ALL three of
   * - no widget that was not already sent (a new widget template may genuinely resolve), and
   * - at least one newly named element (an exact repeat is [repeatsPreviouslySent]'s job), and
   * - every newly named element id failing to resolve. Any genuinely resolvable new id therefore
   *   still reruns — unchanged behaviour.
   */
  fun addsNothingNewThatResolves(
      newElements: Collection<String>,
      newWidgets: Collection<String>,
      sentElements: Collection<String>,
      sentWidgets: Collection<String>,
      resolves: (Collection<String>) -> Boolean
  ): Boolean {
    if ((newWidgets.toSortedSet() - sentWidgets.toSortedSet()).isNotEmpty()) return false
    val freshElements = newElements.toSortedSet() - sentElements.toSortedSet()
    if (freshElements.isEmpty()) return false
    return !resolves(freshElements)
  }
}
