package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.slf4j.LoggerFactory

/**
 * Pass-1 "capability/section gating": optionally drops whole `<!--SECTION:tag-->
 * … <!--/SECTION:tag-->` blocks from the pass-1 decision cores, so a plain request does not pay for
 * instruction blocks that cannot apply to it.
 *
 * The final keep-set is the **UNION** of two signals (the third "nothing matched" case fails OPEN):
 * 1. **the AI's `sections` array** — the PRIMARY signal, decided by the SAME always-run
 *    chat-classification call that already returns `topics` (no extra inference). See
 *    [com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.AICodBiAssistant]'
 *    `produceChatAnswer`.
 * 2. **deterministic detectors** (below) — the strongest, zero-inference signal; they only ADD
 *    recall and can never remove a block the AI wanted.
 *
 * A block is dropped **only** when the AI omitted its tag AND no detector matched it; every other
 * case keeps the block. This biases the design against the dangerous error (dropping a needed rule)
 * over the cheap one (keeping an unneeded rule). See the design in
 * `plans/formassistant-input-token-optimization.md`.
 *
 * Failure modes are all fail-open:
 * - a tag that is not in [KNOWN_TAGS] keeps its block;
 * - an unbalanced marker (open without close) keeps the body, only the marker token is removed;
 * - a `null`/blank corpus and empty AI sections simply keep every block that no detector rejects.
 */
internal object PromptSectionGate {

  private val logger = LoggerFactory.getLogger(PromptSectionGate::class.java)

  private const val BEGIN_MARKER = "<!--SECTION:"

  /** A complete block: `<!--SECTION:tag[,tag]-->` body `<!--/SECTION:tag[,tag]-->`. */
  private val BLOCK = Regex("<!--SECTION:([a-z0-9_,]+)-->([\\s\\S]*?)<!--/SECTION:[a-z0-9_,]+-->")

  /** Leftover/unbalanced marker tokens (removed so no marker ever reaches the model). */
  private val STRAY_MARKER = Regex("<!--/?SECTION:[a-z0-9_,]+-->")

  /**
   * The tags the gate understands. A tag outside this set fails open (its block is kept), so a
   * prompt authored with a newer tag than this build never loses content.
   */
  val KNOWN_TAGS: Set<String> =
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
          "appointment",
          // Build-SCOPE tags (not CodBi capabilities): rules that only matter when the request
          // actually BUILDS form structure (creates/groups fields, buttons) or REMOVES elements.
          // A plain edit (rename a label) needs none of them.
          "field_creation",
          "removal",
          // The server-variable placeholder catalog [%\$...%] is large (~3KB) and only useful when
          // the request/email body actually references a placeholder. Demand-gated in the pass-2
          // apply prompt: kept only when the request/form references a [%\$...%] placeholder; the
          // plain /email/ form edits do not need it.
          "server_vars")

  /**
   * [KNOWN_TAGS] normalised to the comparison form. The AI is TOLD the exact members and told never
   * to invent others, but it may still answer with a variant spelling the prompt did not intend
   * (`designed-text`, `AI Chat`, `EP wiring`). Normalising BOTH sides means such variants still
   * match a marker tag instead of being wrongly treated as an unknown tag.
   */
  private val KNOWN_TAGS_NORMALIZED: Set<String> = KNOWN_TAGS.map { normalizeTag(it) }.toSet()

  /**
   * Tags whose block is so large that an AI-only inclusion (the classifier's "when UNSURE, INCLUDE
   * it") is not worth its cost — see [resolveKeepTags]. They require the deterministic detector.
   */
  private val DETECTOR_REQUIRED_TAGS: Set<String> =
      setOf("svg", "custom_js").map { normalizeTag(it) }.toSet()

  /**
   * The comparison form of a tag: lowercase with every non-alphanumeric character removed, so
   * `designed_text`, `designed-text` and `Designed Text` all collapse to `designedtext`.
   */
  private fun normalizeTag(tag: String): String =
      tag.trim().lowercase().replace(Regex("[^a-z0-9]"), "")

  /**
   * Deterministic detectors: `tag → patterns` over the lowercased request corpus. Patterns are
   * deliberately GENEROUS (a false positive keeps a block — harmless; a false negative would drop
   * one — the error this design guards against). Covers de/en/it/nl/fr wording.
   */
  private val KEYWORDS: Map<String, List<Regex>> =
      mapOf(
          "translation" to
              patterns(
                  "übersetz",
                  "uebersetz",
                  "translate",
                  "translation",
                  "traduire",
                  "traduz",
                  "vertaal",
                  "ins englische",
                  "into english",
                  "ins französische",
                  "in french",
                  "ins italienische",
                  "in italian",
                  "ins niederländische",
                  "in dutch",
                  "ins spanische",
                  "in spanish"),
          "designed_text" to
              patterns(
                  "schön",
                  "schoen",
                  "design",
                  "interaktiv",
                  "interactive",
                  "animier",
                  "animat",
                  "hover",
                  "styl",
                  "card",
                  "karte",
                  "aufgewertet"),
          "svg" to
              patterns(
                  "svg",
                  "illustration",
                  "illustrier",
                  "zeichnung",
                  "drawing",
                  "diagram",
                  "grafik",
                  "graphic"),
          "custom_js" to
              patterns(
                  "javascript",
                  "\\bjs\\b",
                  "rechner",
                  "calculator",
                  "berechn",
                  "calculation",
                  "client-side",
                  "validier",
                  "validation",
                  "script"),
          "panels" to
              patterns(
                  "panel",
                  "accordion",
                  "aufklapp",
                  "zuklapp",
                  "zugeklappt",
                  "eingeklappt",
                  "collapsib",
                  "collapse",
                  "einklapp",
                  "ausklapp",
                  "falten"),
          "photocropper" to
              patterns(
                  "fotocropper",
                  "cropper",
                  "\\bcrop\\b",
                  "zuschneiden",
                  "bildausschnitt",
                  "fotocrop"),
          "ep_wiring" to
              patterns(
                  "bayvis",
                  "bayernportal",
                  "bayern-portal",
                  "bavaria portal",
                  "bavarian portal",
                  "elementplaceholder",
                  "element placeholder",
                  "injector",
                  "\\bmapper\\b",
                  "data.join",
                  "json.set",
                  "html.text",
                  "platzhalter",
                  "placeholder"),
          "address" to
              patterns(
                  "adresse",
                  "address",
                  "anschrift",
                  "\\bplz\\b",
                  "postal",
                  "hausnummer",
                  "straße",
                  "strasse",
                  "\\bort\\b",
                  "locality"),
          "logging" to patterns("konsole", "console", "sys.log", "logge", "\\blog\\b", "logging"),
          "datasource" to
              patterns(
                  "datenquelle",
                  "datasource",
                  "\\bquelle\\b",
                  "\\bspalte\\b",
                  "\\bcolumn\\b",
                  "datenabfrage",
                  "datenbank"),
          "navbar" to
              patterns(
                  "navbar",
                  "navigationsleiste",
                  "\\bnavigation\\b",
                  "sprachwechsel",
                  "sprachumschalter",
                  "language switch",
                  "form.navigator"),
          "repeatable" to
              patterns(
                  "wiederhol",
                  "repeat",
                  "dynamisch",
                  "dynamic",
                  "weitere zeile",
                  "zeile hinzufügen",
                  "eintrag hinzufügen",
                  "add another",
                  "another entry"),
          "upload" to
              patterns(
                  "upload",
                  "hochladen",
                  "datei",
                  "\\bfile\\b",
                  "anhang",
                  "attachment",
                  "vorschau",
                  "preview",
                  "mehrere dateien"),
          "approval" to
              patterns(
                  "genehmig",
                  "ablehn",
                  "approve",
                  "reject",
                  "freigabe",
                  "\\bapproval\\b",
                  "antrag genehm"),
          "bundid" to
              patterns(
                  "bundid",
                  "bundesid",
                  "bürgerkonto",
                  "buergerkonto",
                  "personalausweis",
                  "\\belster\\b",
                  "captcha",
                  "signatur",
                  "signature"),
          "aichat" to
              patterns("ki-chat", "ai chat", "chatbot", "ai.llama.chat", "ki-assistent", "ki bot"),
          "css" to
              patterns(
                  "\\bcss\\b",
                  "eigenes css",
                  "farbe",
                  "\\bcolor\\b",
                  "farben",
                  "schriftart",
                  "\\bfont\\b",
                  "\\bstyle\\b"),
          "date" to
              patterns(
                  "geburtsdatum", "birthdate", "birth date", "no future date", "zukunftsdatum"),
          "appointment" to
              patterns(
                  "termin",
                  "appointment",
                  "kalender",
                  "calendar",
                  "buchung",
                  "booking",
                  "zeitfenster",
                  "slot"),
          // Build-scope: deliberately NARROW — a creation VERB, never the bare noun. "Ändere das
          // Label des Vorname-Feldes" must not fire it (the noun "Feld" is not an instruction to
          // build), and a false positive here keeps ~12 k chars of construction rules that a plain
          // edit does not need. A missed creation request only keeps those rules (fail-open), which
          // is the safe direction. "einfügen"/"platzieren" are included because a creation request
          // often phrases placement as "Füge ein Feld ein" / "Platziere ein Feld unter …" — without
          // the familiar "hinzu/anlegen/erstell" verbs — and the placement rules would otherwise be
          // dropped for a request that is actually building.
          "field_creation" to
              patterns(
                  "hinzu",
                  "anlegen",
                  "anlege",
                  "erstell",
                  "erzeuge",
                  "gruppier",
                  "füge",
                  "fuege",
                  "einfüg",
                  "einfueg",
                  "platzier",
                  "\\badd a (new )?field\\b",
                  "\\badd (a )?new\\b",
                  "\\bnew field\\b",
                  "\\bcreate (a )?(new )?(field|container|button)\\b",
                  "\\binsert (a )?new\\b"),
          "removal" to
              patterns(
                  "lösch",
                  "loesch",
                  "entfern",
                  "\\bremove\\b",
                  "\\bdelete\\b",
                  "\\breset\\b",
                  "zurücksetzen",
                  "zuruecksetzen"))

  private fun patterns(vararg raw: String): List<Regex> =
      raw.map { Regex(it, RegexOption.IGNORE_CASE) }

  /**
   * Returns the tags the deterministic detectors recognise in [corpus] (the request plus any
   * clarification answers / chat history). Never throws; a blank corpus yields an empty set.
   */
  fun detect(corpus: String?): Set<String> {
    if (corpus.isNullOrBlank()) return emptySet()
    val found = linkedSetOf<String>()
    for ((tag, patterns) in KEYWORDS) {
      if (patterns.any { it.containsMatchIn(corpus) }) found.add(tag)
    }
    return found
  }

  /**
   * Resolves the effective keep-set: the UNION of the AI's [aiSections] and the deterministic
   * [detect] over [corpus]. Tags are normalised to trimmed lowercase.
   */
  fun resolveKeepTags(aiSections: Collection<String>?, corpus: String?): Set<String> {
    val keep = linkedSetOf<String>()
    // Detector tags are already canonical; normalise anyway so the whole set has ONE comparison
    // form.
    val detected = detect(corpus).map { normalizeTag(it) }.toSet()
    aiSections?.forEach { raw ->
      val tag = normalizeTag(raw)
      if (tag.isEmpty()) return@forEach
      // A few tags gate a VERY LARGE block — `svg` selects the illustration half of the `XSpan`
      // widget template (~15–20 k chars), `custom_js` its script mechanism. For those, a "when
      // unsure, INCLUDE it" answer from the classifier costs far more than the block it protects:
      // measured on a live build run, an AI-only `svg` kept ~20 k chars of illustration rules for a
      // request that animates with CSS only. They are therefore honoured only when the
      // DETERMINISTIC
      // detector matched too. The build pass can still pull the block on demand via
      // `need_codbi_details`, so nothing becomes unreachable.
      if (tag in DETECTOR_REQUIRED_TAGS && tag !in detected) return@forEach
      keep.add(tag)
    }
    detected.forEach { keep.add(it) }
    return keep
  }

  /**
   * Drops every `<!--SECTION:tag--> … <!--/SECTION:tag-->` block whose tag is in neither [keepTags]
   * nor "unknown" (fail-open), and strips the markers from the kept blocks. A `null`/empty
   * [keepTags] therefore keeps only blocks with an unknown tag.
   */
  fun applySectionGates(text: String, keepTags: Set<String>): String {
    if (!text.contains(BEGIN_MARKER)) return text
    val keep = keepTags.map { normalizeTag(it) }.filter { it.isNotEmpty() }.toSet()
    var droppedChars = 0
    var droppedBlocks = 0
    val gated =
        BLOCK.replace(text) { match ->
          val tags =
              match.groupValues[1].split(",").map { normalizeTag(it) }.filter { it.isNotEmpty() }
          val keepBlock = tags.isEmpty() || tags.any { it in keep || it !in KNOWN_TAGS_NORMALIZED }
          if (keepBlock) {
            match.groupValues[2]
          } else {
            droppedChars += match.value.length
            droppedBlocks++
            ""
          }
        }
    // Fail-open for unbalanced markers: drop the marker token, keep whatever body follows.
    val cleaned = STRAY_MARKER.replace(gated, "")
    logger.info(
        "[PromptSectionGate] section gating: {} -> {} chars ({} block(s) dropped, ~{} chars; keep={})",
        text.length,
        cleaned.length,
        droppedBlocks,
        droppedChars,
        keep.sorted())
    return cleaned
  }
}
