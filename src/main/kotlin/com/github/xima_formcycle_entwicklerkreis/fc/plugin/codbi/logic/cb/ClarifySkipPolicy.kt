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
   * @param endingPageVeto true when a deterministic detector matched a workflow that needs an
   *   Abschlussseite/HTML template but the user did NOT name a concrete existing one — the clarify
   *   round MUST run so the user is offered the AVAILABLE pages by name. A veto only.
   */
  fun skipReason(
      needsClarification: Boolean?,
      needsToolContext: Set<String>?,
      hasClarificationAnswers: Boolean,
      referenceVeto: Boolean,
      endingPageVeto: Boolean = false
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
    // When the workflow needs an ending page the user did not name, force the round so the user is
    // asked which AVAILABLE Abschlussseite to use instead of the build silently guessing a name.
    if (endingPageVeto) return null
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

  /**
   * Free-form "element … from <another form>" phrasings that the literal needles above cannot
   * enumerate because the form TITLE is arbitrary (e.g. "aus dem Meldeformular für besonders
   * geschützte Wirbeltiere", "from the Meldeformular form"). A hit only forces the clarify round
   * (the AI then resolves the title and asks COPY vs. MIRROR); a false positive costs one cheap
   * clarification inference, a false negative would silently copy/mirror the wrong thing.
   */
  private val OTHER_FORM_PHRASE =
      Regex(
          "(?i)(?:\\baus\\s+(?:dem|der|einem|einer)\\s+[\\p{L}0-9_\\- ]{0,60}form(?:ular)?\\b)" +
              "|(?:\\bvon\\s+(?:dem|der|einem|einer)\\s+[\\p{L}0-9_\\- ]{0,60}form(?:ular)?\\b)" +
              "|(?:\\bfrom\\s+(?:the\\s+)?[\\p{L}0-9_\\- ]{0,60}form\\b)")

  /** True when the request (plus chat history) refers to earlier work or to another form. */
  fun wantsFormOrHistoryContext(corpus: String?): Boolean {
    val text = corpus?.lowercase() ?: return false
    if (text.isBlank()) return false
    if (OTHER_FORM_PHRASE.containsMatchIn(text)) return true
    return NEEDLES.any { text.contains(it) }
  }

  /**
   * True when the request explicitly talks about an element/form of ANOTHER form (e.g. "aus dem
   * Meldeformular", "from the report form"). Unlike [wantsFormOrHistoryContext], this does NOT fire
   * for "like last week" / "same as before" — it is used to proactively load the foreign form's
   * list/elements so the build pass always has real keys instead of the prompt template
   * placeholders.
   */
  fun mentionsForeignForm(corpus: String?): Boolean {
    val text = corpus?.lowercase() ?: return false
    return text.isNotBlank() && OTHER_FORM_PHRASE.containsMatchIn(text)
  }
}

/**
 * Deterministic **veto** BACKSTOP for the clarify-skip: does the workflow request NEED an
 * Abschlussseite / HTML template (an ending page, e.g. shown after Submit, FC_SHOW_TEMPLATE,
 * FC_DOI_INIT successPage/failurePage) while the user did NOT name a concrete EXISTING one?
 *
 * When such a request is silently built, the workflow AI guesses a template NAME that is rarely an
 * exact match, `resolveHtmlTemplateUuid` returns null and an FC_SHOW_TEMPLATE node is created with
 * `htmlTemplate:null` (a broken node). That is why the clarify round MUST run for these requests so
 * the AVAILABLE ABSCHLUSSSEITEN are offered to the user by name instead.
 *
 * AI-AS-DECISION-MAKER (Round 9): the tier-1 chat classification is now the PRIMARY authority for
 * this intent via its `needsEndingPage` key (decided by MEANING, not keywords — see
 * `codbi-chat-system-prompt.md`). This detector is therefore a SCOPED FALLBACK ONLY: it is
 * consulted when the AI returned no verdict (`needsEndingPage` absent — an older installed prompt,
 * a strict-retry response, or a classification failure), so a weak/older model can never silently
 * build a broken FC_SHOW_TEMPLATE. When the AI DID return a verdict, the detector is bypassed — the
 * AI's `false` suppresses the veto even if these keywords would have fired (e.g. a REDIRECT / URL
 * forward like "beim Klick auf Senden soll auf www.google.de umgeleitet werden" is FC_REDIRECT, not
 * an ending-page pick).
 *
 * Like all deterministic layers it only FORCES the round (a veto) — it never authorises a skip. A
 * request that names a concrete existing template (an exact/substring match in the available list)
 * or needs no ending page at all contributes no veto.
 */
internal object EndingPageNeedDetector {

  /**
   * STRONG ending-page signals — unambiguous references to an ending page / Abschlussseite / HTML
   * template shown after Submit. When one of these is present the request genuinely concerns an
   * ending page (FC_SHOW_TEMPLATE), so a missing concrete name must force the "which one?" clarify
   * round. These alone are enough to veto.
   */
  private val STRONG_PAGE_NEEDLES: List<String> =
      listOf(
          // German
          "abschlussseite",
          "abschluss seite",
          "endseite",
          "html-vorlage",
          "html vorlage",
          "html-template",
          "html template",
          "vorlage für die abschlussseite",
          "bestätigungsseite",
          "erfolgsseite",
          "erfolgseite",
          "fehlerseite",
          "fehler seite",
          "abschluss",
          // English
          "ending page",
          "completion page",
          "success page",
          "failure page",
          "error page",
          "thank you page",
          "html template",
          "html-template",
          "show a page",
          "show the page",
          "landing page",
          "done page",
          // Italian
          "pagina di chiusura",
          "pagina finale",
          "pagina di conferma",
          "pagina di successo",
          "pagina di errore",
          "modello html",
          // Dutch
          "afsluitpagina",
          "eindpagina",
          "bevestigingspagina",
          "succespagina",
          "foutpagina",
          "html-sjabloon",
          // French
          "page de fin",
          "page de confirmation",
          "page de succès",
          "page d'erreur",
          "page finale",
          "modèle html",
          // Spanish
          "página de cierre",
          "página final",
          "página de confirmación",
          "página de éxito",
          "página de error",
          "plantilla html",
          // Polish
          "strona końcowa",
          "strona zakończenia",
          "strona potwierdzenia",
          "strona sukcesu",
          "strona błędu",
          "szablon html",
          // Turkish
          "bitiş sayfası",
          "tamamlanma sayfası",
          "onay sayfası",
          "başarı sayfası",
          "hata sayfası",
          "html şablonu")

  /**
   * Lowercased literal needles signalling an explicit REDIRECT / URL forward (FC_REDIRECT) instead
   * of an Abschlussseite. When such an intent is present the request is clearly NOT asking to pick
   * one of the available ending-page templates, so the ending-page veto must not fire.
   */
  private val REDIRECT_NEEDLES: List<String> =
      listOf(
          // German
          "umleiten",
          "umleitung",
          "umgeleitet",
          "weiterleiten",
          "weiterleitung",
          "weitergeleitet",
          "weiterverweisen",
          "weiterverweisung",
          "verweisen auf",
          "verweist auf",
          "geleitet",
          "weiter auf ",
          "redirect",
          "weitergeführt",
          "weitergefuhrt",
          // URL / protocol markers (language-neutral)
          "externer link",
          "internetadresse",
          "webadresse")

  /**
   * True when the request clearly expresses a redirect/URL intent (FC_REDIRECT), not an ending
   * page.
   */
  private fun mentionsRedirect(text: String): Boolean {
    if (text.isBlank()) return false
    // A URL anywhere in the request is a strong redirect signal (nothing to "select" as a
    // template).
    if (text.contains("www.") ||
        text.contains("http://") ||
        text.contains("https://") ||
        text.contains("http ")) {
      return true
    }
    // Otherwise require one of the redirect verbs/nouns, but require a target so a bare "redirect"
    // during an ending-page clarification chat does not get over-interpreted.
    val hasRedirectWord = REDIRECT_NEEDLES.any { text.contains(it, ignoreCase = true) }
    if (!hasRedirectWord) return false
    // A redirect intent must name/provide somewhere to go: a URL token, "google.de", "zu ...", or
    // a visible domain-ish token. This keeps genuine ending-page requests (e.g. "nach dem Senden
    // eine Erfolgsseite anzeigen") from being blocked by the shared submit/redirect vocabulary.
    val toTarget =
        Regex("(?:zu|auf|an|nach|weiter(?:zuleiten|leiten|geleitet|gelangt))\\s+[a-z0-9._-]+")
    val domainLike = Regex("(?:[a-z0-9-]+\\.)+[a-z]{2,}(?:[/?#]\\S*)?")
    val leadingDot =
        text.contains(".de") ||
            text.contains(".com") ||
            text.contains(".at") ||
            text.contains(".ch") ||
            text.contains(".eu") ||
            text.contains(".io")
    return toTarget.containsMatchIn(text) || domainLike.containsMatchIn(text) || leadingDot
  }

  /**
   * True when the request clearly needs an ending page and does NOT name a concrete existing one.
   *
   * @param corpus the raw request (prompt + chat context), lowercased internally.
   * @param availablePages the condensed list of available Abschlussseite names (the "AVAILABLE
   *   COMPLETION PAGES/HTML TEMPLATES" names, comma/line separated), or null when unknown. When
   *   null (no list available) a needs-page hit without a named page still vetoes, because we
   *   cannot prove the user named a real one.
   */
  fun needsEndingPageButNotNamed(corpus: String?, availablePages: String?): Boolean {
    val text = corpus?.lowercase() ?: return false
    if (text.isBlank()) return false
    // A request that clearly asks for a redirect / URL forward is NOT asking to pick an
    // Abschlussseite template — the model should build an FC_REDIRECT node instead of being forced
    // into the "which ending page?" question. Suppress the veto in that case.
    if (mentionsRedirect(text)) return false
    // Only a STRONG ending-page signal proves an Abschlussseite is really implied. A bare generic
    // "when Submit is clicked / after sending" phrase (WEAK) could equally mean a mail, a redirect
    // or any other post-submit action, so it must never force the ending-page question on its own.
    val mentionsPageStrong = STRONG_PAGE_NEEDLES.any { text.contains(it) }
    if (!mentionsPageStrong) return false
    if (namesConcretePage(text, availablePages)) return false
    return true
  }

  /**
   * Decides the effective ending-page veto from the AI's tier-1 verdict and the deterministic
   * fallback. The AI is the AUTHORITY (AI-as-decision-maker, Round 9):
   * - `aiVerdict == true` → veto fires (`true`), even if the keyword fallback would not have hit.
   * - `aiVerdict == false` → veto SUPPRESSED (`false`), even if the keyword fallback would have
   *   fired — e.g. a REDIRECT/URL-forward request that the model recognised as FC_REDIRECT.
   * - `aiVerdict == null` → the AI did not decide (older installed prompt, strict-retry response,
   *   or classification failure) — FAIL OPEN to [needsEndingPageButNotNamed]'s [fallbackVeto], the
   *   scoped keyword backstop so a weak/older model can never silently build a broken
   *   FC_SHOW_TEMPLATE.
   */
  fun resolveVeto(aiVerdict: Boolean?, fallbackVeto: Boolean): Boolean =
      when (aiVerdict) {
        true -> true
        false -> false
        null -> fallbackVeto
      }

  /**
   * True when the user named a concrete (resolvable) ending page among the available ones.
   *
   * Resolution follows the user's required priority — EXACT first, then APPROXIMATE, then SENSIBLE:
   * 1. **Exact** — the whole available page name appears verbatim (delimiter-bounded) in the
   *    request, so a request mentioning "Senden erfolgreich" is NOT falsely matched by the
   *    available "Senden erfolgreich 2" (and vice-versa).
   * 2. **Approximate** — a close variant of the name appears: the request contains a phrase whose
   *    normalised (lowercase, diacritic-stripped, punctuation-collapsed) form is within a small
   *    allowed token edit distance of a whole available name (catches typos and minor declension).
   * 3. **Sensible** — the request shares the name's *distinguishing* tokens: every substantive
   *    token of an available name appears in the request (e.g. "Fehler 2" ↔ "Allgemeiner Fehler 2",
   *    "Erfolgreich" ↔ "Erfolgreich übermittelt"). Generic filler tokens (articles, prepositions,
   *    common numerals) are ignored so a mere mention of "seite"/"fehler" alone is NOT treated as
   *    naming a concrete page.
   *
   * The veto is only suppressed on a *confident* match; anything ambiguous still forces the clarify
   * round (fail-safe). Matching the normalised form keeps it case- and diacritic-agnostic.
   */
  private fun namesConcretePage(text: String, availablePages: String?): Boolean {
    val names = extractNames(availablePages) ?: return false
    val corpus = normalize(text)
    if (corpus.isBlank()) return false
    val exactNames = names.map { normalize(it) }.filter { it.isNotBlank() }
    // 1) EXACT whole-token containment.
    if (exactNames.any { n -> wholeTokenOf(n).containsMatchIn(corpus) }) return true
    // 2) APPROXIMATE — whole available name as a fuzzy substring of the corpus (allow one typo).
    for (n in exactNames) {
      if (fuzzyContains(corpus, n)) return true
    }
    // 3) SENSIBLE — all substantive tokens of an available name appear in the corpus.
    for (n in exactNames) {
      if (sensibleMatch(corpus, n)) return true
    }
    return false
  }

  /** Lowercases, strips diacritics and collapses non-alphanumerics to a single space. */
  private fun normalize(s: String): String {
    val decomposed = java.text.Normalizer.normalize(s.lowercase(), java.text.Normalizer.Form.NFD)
    val sb = StringBuilder(decomposed.length)
    for (c in decomposed) {
      when {
        c in 'a'..'z' || c in '0'..'9' -> sb.append(c)
        c == 'ß' -> sb.append("ss")
        c.isLetterOrDigit() -> sb.append(c.lowercaseChar())
        sb.isNotEmpty() && sb.last() != ' ' -> sb.append(' ')
      }
    }
    return sb.toString().trim()
  }

  /** Whole available name as a delimiter-bounded token phrase within the normalised corpus. */
  private fun wholeTokenOf(name: String): Regex =
      Regex("(?:^|[^a-z0-9])" + Regex.escape(name) + "(?:$|[^a-z0-9])")

  /**
   * True when `name`, as a sequence of tokens, appears inside `corpus` with at most one token that
   * differs by a single character (a typo/declension), or when the (short) name appears plainly.
   */
  private fun fuzzyContains(corpus: String, name: String): Boolean {
    if (name.length < 4) return corpus.contains(name)
    val nameTokens = name.split(' ')
    // Scan every token-aligned window of the corpus of the same length as the name.
    val corpusTokens = corpus.split(' ').filter { it.isNotBlank() }
    if (corpusTokens.isEmpty()) return false
    for (w in 0..(corpusTokens.size - nameTokens.size)) {
      var allowedErrors = 1
      var matchedSoFar = true
      for (k in nameTokens.indices) {
        val ct = corpusTokens[w + k]
        val nt = nameTokens[k]
        if (ct == nt) continue
        // Allow at most one token that is a near-identical variant.
        if (levenshtein(ct, nt) <= 1 && nt.length >= 4) {
          if (allowedErrors <= 0) {
            matchedSoFar = false
            break
          }
          allowedErrors--
        } else {
          matchedSoFar = false
          break
        }
      }
      if (matchedSoFar) return true
    }
    return false
  }

  /**
   * Sensible match: every *substantive* token (letters only, length >= 3, not a generic filler) of
   * the available name appears as a whole token in the corpus. A name consisting solely of fillers
   * never matches, so it stays "unnamed" and forces the clarify round.
   */
  private fun sensibleMatch(corpus: String, name: String): Boolean {
    val tokens = name.split(' ').filter { it.length >= 3 && !isFiller(it) }
    if (tokens.size < 2) return false
    val corpusSet = corpus.split(' ').filter { it.isNotBlank() }.toSet()
    return tokens.all { corpusSet.contains(it) }
  }

  /** Filler tokens (articles, prepositions, common numerals) that add no distinguishing signal. */
  private fun isFiller(tok: String): Boolean = tok in FILLER_TOKENS

  private val FILLER_TOKENS: Set<String> =
      setOf(
          "der",
          "die",
          "das",
          "den",
          "dem",
          "des",
          "ein",
          "eine",
          "einen",
          "einem",
          "eines",
          "and",
          "the",
          "a",
          "an",
          "of",
          "for",
          "with",
          "auf",
          "nach",
          "mit",
          "von",
          "aus",
          "bei",
          "zum",
          "zur",
          "für",
          "uber",
          "unter",
          "seite",
          "page",
          "html",
          "template")

  /** Classic iterative Levenshtein edit distance (two-row dynamic programming). */
  private fun levenshtein(a: String, b: String): Int {
    if (a == b) return 0
    if (a.isEmpty()) return b.length
    if (b.isEmpty()) return a.length
    val n = b.length
    var prev = IntArray(n + 1) { it }
    var curr = IntArray(n + 1)
    for (i in 1..a.length) {
      curr[0] = i
      for (j in 1..n) {
        val cost = if (a[i - 1] == b[j - 1]) 0 else 1
        curr[j] = minOf(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
      }
      val tmp = prev
      prev = curr
      curr = tmp
    }
    return prev[n]
  }

  /** Splits a condensed list (comma/line separated) into non-blank names, or null when none. */
  private fun extractNames(availablePages: String?): List<String>? {
    if (availablePages.isNullOrBlank()) return null
    val names = availablePages.split(',', '\n', ';').map { it.trim() }.filter { it.isNotEmpty() }
    return names.ifEmpty { null }
  }
}
