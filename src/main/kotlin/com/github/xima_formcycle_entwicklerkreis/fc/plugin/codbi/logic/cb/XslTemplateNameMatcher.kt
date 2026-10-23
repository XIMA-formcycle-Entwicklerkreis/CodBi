package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

/**
 * Matches a transformation-template NAME the user wrote in prose against the XSL templates that
 * really exist for the client.
 *
 * A user names the template inside a sentence ("… und zuvor mit XXX transformiert werden", "mit der
 * XSLT-Vorlage XXX", "transformed by XXX"), so the name reaches the build pass in prose spelling —
 * not byte-identical to the stored one. Matching must therefore tolerate case, spaces, underscores,
 * hyphens, umlauts/ß variants and a trailing `.xsl`/`.xslt`, and should accept a clear partial
 * match ("Anschriftenreport" → "Anschriften Report 2024").
 *
 * Safety rule: a UNIQUE match is accepted, an AMBIGUOUS one is never guessed — the caller keeps the
 * node without a template (raw XML) instead of silently transforming with the wrong stylesheet.
 */
object XslTemplateNameMatcher {

  /**
   * A resolved template: [name] as stored, [exact] = true when the normalized names were identical.
   */
  data class Match(val name: String, val exact: Boolean)

  /**
   * Result of a lookup. [match] is set on success; otherwise [candidates] holds the ambiguous or
   * closest names so the caller can log them (an empty list means "nothing similar exists").
   */
  data class Result(val match: Match? = null, val candidates: List<String> = emptyList())

  /** Umlaut/ß folding so "Übersicht" matches "Uebersicht". */
  private val UMLAUTS = mapOf('ä' to "ae", 'ö' to "oe", 'ü' to "ue", 'ß' to "ss")

  /**
   * Reduces a template name to its comparison key: lower case, no `.xsl`/`.xslt` suffix, umlauts
   * folded and every non-letter/digit removed.
   */
  fun normalize(raw: String): String {
    val lowered = raw.trim().lowercase().removeSuffix(".xslt").removeSuffix(".xsl")
    val folded = buildString {
      for (ch in lowered) {
        val mapped = UMLAUTS[ch]
        if (mapped != null) append(mapped) else append(ch)
      }
    }
    return folded.filter { it.isLetterOrDigit() }
  }

  /**
   * Resolves [requested] against [available] (the client's real XSL template names).
   * 1. one name equal after [normalize] → exact match;
   * 2. else exactly one name that contains the requested key (or is contained in it) → partial
   *    match;
   * 3. else no match, with the ambiguous candidates (or an empty list) in [Result.candidates].
   */
  fun resolve(requested: String, available: List<String>): Result {
    val wanted = normalize(requested)
    if (wanted.isEmpty()) return Result()
    val exact = available.filter { normalize(it) == wanted }
    if (exact.size == 1) return Result(Match(exact.first(), exact = true))
    if (exact.size > 1) return Result(candidates = exact)
    // Very short keys would match almost any name — require at least 3 characters.
    if (wanted.length < 3) return Result()
    val partial =
        available.filter { name ->
          val key = normalize(name)
          key.isNotEmpty() && (key.contains(wanted) || wanted.contains(key))
        }
    return when (partial.size) {
      1 -> Result(Match(partial.first(), exact = false))
      else -> Result(candidates = partial.distinct())
    }
  }
}
