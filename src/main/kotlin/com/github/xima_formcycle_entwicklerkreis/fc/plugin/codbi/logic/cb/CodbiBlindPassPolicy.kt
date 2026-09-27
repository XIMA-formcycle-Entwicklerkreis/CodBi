package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

/**
 * LEVER (pass-2 token reduction) — may the BLIND CodBi reconsideration pass be skipped?
 *
 * `runFormModification` runs a blind pass-2 whenever pass-1 produced a form but its
 * `_codbiApplicability` did not name any applied/considered CodBi id and no "nothing applies"
 * signal was detectable in the raw text. That pass re-sends the ENTIRE CodBi/widget reference —
 * measured at 72.8 k chars (`formcycle-widgets.md`) and up to ~133.8 k chars
 * (`{{CODBI_FULL_SECTION}}`) — i.e. it costs about as much as everything else in the run together.
 *
 * Pass-1 already received the gated CodBi decision core and the condensed catalogs, so the blind
 * pass is a *duplicate* of a decision the run has already paid for. It is therefore skipped when
 * nothing in the run indicates that a CodBi decision still has to be made. Every check is
 * fail-open: any indication of CodBi interest (a capability section, a newly created widget,
 * existing `data-cb-` wiring) or the absence of a usable form keeps the pass exactly as before.
 *
 * The "no capability section" test uses the SAME keep set that gated the pass-1 instruction blocks
 * ([PromptSectionGate.resolveKeepTags]): when the request's sections contain no CodBi-capable area,
 * the CodBi instruction blocks were already withheld from pass-1 — a second, costlier opinion on
 * the same question cannot add knowledge the run deliberately did not send.
 */
internal object CodbiBlindPassPolicy {

  /**
   * Keep-tags that mean "this request may still need a CodBi decision": each maps to a CodBi
   * element or a server-side standard configuration. `translation` is included so a translation can
   * never reach the blind branch through this gate (it is separately guarded).
   */
  val COD_BI_CAPABLE_TAGS: Set<String> =
      setOf(
          "translation",
          "designed_text",
          "svg",
          "custom_js",
          "panels",
          "photocropper",
          "ep_wiring",
          "address",
          "logging",
          "datasource",
          "navbar",
          "repeatable",
          "upload",
          "approval",
          "bundid",
          "aichat",
          "css",
          "date",
          "appointment")

  private val CAPABLE_NORMALIZED: Set<String> = COD_BI_CAPABLE_TAGS.map { normalize(it) }.toSet()

  private fun normalize(tag: String): String =
      tag.trim().lowercase().replace(Regex("[^a-z0-9]"), "")

  /** True when any keep-tag maps to a CodBi-capable area (unknown tags simply do not match). */
  fun hasCodbiCapableSection(keepTags: Collection<String>?): Boolean {
    if (keepTags.isNullOrEmpty()) return false
    return keepTags.any { normalize(it) in CAPABLE_NORMALIZED }
  }

  /**
   * True only when the blind CodBi reconsideration is provably redundant:
   * - pass-1 produced a usable form (otherwise the blind pass is the RECOVERY pass for prose output
   *   and must run);
   * - no new Formcycle widget was created (its exact template is unknown without the pass — the
   *   caller reruns with templates for that case);
   * - the pass-1 output contains no `data-cb-` wiring (the AI already made a CodBi decision);
   * - the request's keep set carries no CodBi-capable area.
   */
  fun maySkipBlindPass(
      pass1ProducedForm: Boolean,
      createdWidgets: Boolean,
      touchesCodbiInOutput: Boolean,
      keepTags: Collection<String>?
  ): Boolean {
    if (!pass1ProducedForm) return false
    if (createdWidgets) return false
    if (touchesCodbiInOutput) return false
    if (hasCodbiCapableSection(keepTags)) return false
    return true
  }
}
