package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

/**
 * LEVER 1 (token reduction) — may the dedicated clarify round be SKIPPED?
 *
 * The clarify round is a full inference of its own (measured ~8.7 k input tokens ≈ 15 % of a run)
 * whose content is re-sent to pass-1 immediately afterwards. It is however **not** a pure question
 * round: it is the ONLY place in a run that services the AI's `need_form_list` /
 * `need_chat_history` requests, and the `changeHistoryContext` it loads reaches pass-1, the
 * workflow pass and the mail/endpage multilingualization passes. Skipping it naively would silently
 * break "do the same as on form X" / "apply the same as last week".
 *
 * The resulting contract (see `plans/formassistant-token-reduction-remaining.md` §Lever 1):
 * 1. **The AI signal is the ONLY authority for a skip** — and it is language-agnostic, because the
 *    tier-1 chat classification decides `needsClarification` / `needsToolContext` by MEANING,
 *    exactly like `topics` / `sections` today.
 * 2. **Deterministic layers may only VETO a skip** (force the round), never authorise one. That is
 *    what keeps the de/en/it/nl/fr/es/pl/tr keyword list in [ClarificationReferenceDetector]
 *    harmless: an uncovered language simply contributes no veto and the AI stays the deciding
 *    signal. "The detector found nothing" must NEVER appear in the skip condition.
 * 3. **Every unknown fails OPEN** — a missing envelope key (older installed prompt, strict-retry
 *    response, classification failure) keeps the round exactly as before this change.
 */
internal object ClarifySkipPolicy {

  /**
   * Returns a human-readable reason when the clarify round may be skipped, or `null` when it must
   * run. `null` is the fail-open answer, so every branch below returns `null` unless the skip is
   * fully authorised.
   *
   * @param needsClarification the tier-1 answer; `null` = the key was absent → fail open.
   * @param needsToolContext the tier-1 `form_list` / `chat_history` request; `null` = key absent →
   *   fail open, empty set = explicitly "nothing to load".
   * @param hasClarificationAnswers true when this run carries the user's answers to an earlier
   *   round — a genuinely NEW follow-up question may still remain, so such a re-run is never
   *   skipped.
   * @param referenceVeto true when a deterministic detector matched a reference to earlier work or
   *   another form — a veto only; a miss is not a skip authorisation.
   */
  fun skipReason(
      needsClarification: Boolean?,
      needsToolContext: Set<String>?,
      hasClarificationAnswers: Boolean,
      referenceVeto: Boolean
  ): String? {
    // The AI explicitly said "no question is needed" (a missing key is NOT a no).
    if (needsClarification != false) return null
    // The AI explicitly said "nothing to load first" (a missing key is NOT an empty request).
    if (needsToolContext == null) return null
    if (needsToolContext.isNotEmpty()) return null
    // A re-run that already carries answers must be able to ask one genuine follow-up.
    if (hasClarificationAnswers) return null
    // Deterministic signals can only FORCE the round.
    if (referenceVeto) return null
    return "tier-1 needsClarification=false, needsToolContext=[] and no reference veto"
  }
}

/**
 * Deterministic **veto** for the clarify-skip: does the request refer to earlier work or to ANOTHER
 * form, i.e. does the clarify round have to load context (form list / change history) before it can
 * decide?
 *
 * It can only FORCE the clarify round — it never authorises a skip. Consequences of that inversion:
 * - the coverage is deliberately generous and slightly over-eager (a false positive costs one
 *   clarify inference; a false negative would otherwise be masked by the AI signal, which stays the
 *   deciding authority);
 * - the keyword lists below are a *recall* aid, not the decision: a request in a language they do
 *   not cover is still handled correctly, because the language-agnostic AI signal decides.
 */
internal object ClarificationReferenceDetector {

  /** Lowercased literal needles — matched with [String.contains], no regex semantics involved. */
  private val NEEDLES: List<String> =
      listOf(
          // German
          "wie letzte woche",
          "wie letzter woche",
          "wie bisher",
          "wie vorher",
          "wie zuvor",
          "wie damals",
          "wie früher",
          "wie in der letzten",
          "wie bei der letzten",
          "letzter stand",
          "bereits konfiguriert",
          "früher konfiguriert",
          "vorherige anfrage",
          "frühere anfrage",
          "genau wie",
          "genauso wie",
          "analog zu",
          "wie oben",
          "anderes formular",
          "andere formular",
          "ein anderes",
          // English
          "like before",
          "as before",
          "as last week",
          "same as",
          "like the last",
          "last time",
          "previous run",
          "previous version",
          "earlier work",
          "as we did",
          "like previously",
          "another form",
          // Italian
          "come prima",
          "come l'altra volta",
          "un altro modulo",
          "stessa cosa",
          // Dutch
          "zoals eerder",
          "zoals vorige",
          "een ander formulier",
          "net zoals",
          // French
          "comme avant",
          "comme la dernière fois",
          "un autre formulaire",
          "comme précédemment",
          // Spanish
          "como antes",
          "otro formulario",
          "como la última vez",
          // Polish
          "jak wcześniej",
          "inny formularz",
          "tak jak",
          // Turkish
          "daha önce",
          "başka form",
          "geçen sefer")

  /** True when the request (plus chat history) refers to earlier work or to another form. */
  fun wantsFormOrHistoryContext(corpus: String?): Boolean {
    val text = corpus?.lowercase() ?: return false
    if (text.isBlank()) return false
    return NEEDLES.any { text.contains(it) }
  }
}
