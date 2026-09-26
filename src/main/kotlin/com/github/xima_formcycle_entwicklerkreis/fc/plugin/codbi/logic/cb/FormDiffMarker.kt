package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

/**
 * The top-level marker with which a form pass declares that its response is a **FORM DIFF** — only
 * the changed/new items — rather than a whole form.
 *
 * `{"_diff": true}` is the current marker (emitted together with a `items` array that contains ONLY
 * the added / modified / re-shaped items). Every item the diff does **not** re-emit is kept
 * verbatim by the server, so omission means UNCHANGED; an element leaves the form ONLY when it is
 * named in the separate `_removedItems` list.
 *
 * The legacy `_unchangedItems` list (the pre-`_diff` protocol, still present in prompts installed
 * before this marker existed) is accepted as an equivalent declaration for backward compatibility.
 *
 * The declaration is required because omission alone is ambiguous: a response that simply lists
 * fewer items could also be a whole new form, and the server must not splice in the wrong
 * direction.
 */
internal object FormDiffMarker {

  /** The top-level key of the diff flag. Never form data — it is stripped before persisting. */
  const val KEY = "_diff"

  private val TRUE_FLAG = Regex("\"" + KEY + "\"\\s*:\\s*true")

  /** The legacy declaration (a `_unchangedItems` list) also counts as "this is a diff". */
  private const val LEGACY_KEY = "_unchangedItems"

  /**
   * `true` when [candidate] declares itself a diff — either the `"_diff": true` flag or the legacy
   * `_unchangedItems` list. Never throws; a blank/`null` candidate is never a declaration.
   */
  fun isDeclared(candidate: String?): Boolean {
    if (candidate.isNullOrBlank()) return false
    if (candidate.contains("\"$LEGACY_KEY\"")) return true
    return TRUE_FLAG.containsMatchIn(candidate)
  }
}
