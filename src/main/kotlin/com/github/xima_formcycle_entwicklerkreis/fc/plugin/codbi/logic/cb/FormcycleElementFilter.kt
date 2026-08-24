package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

/**
 * Request-scoped filter that restricts which FORMCYCLE widgets / workflow nodes / triggers may be
 * described to the AI. Mirrors [CodBiElementAccess]: a per-request thread-local holds the
 * **allowed** element sets (normalized identifiers), and the prompt builders ([CodbiCapabilities],
 * [PromptLoader], the form/workflow assistants) consult it while assembling the widget / workflow
 * node reference sections. Elements whose section is filtered out are simply omitted from the
 * prompt — the AI never learns about them and therefore cannot request/create them.
 *
 * Semantics:
 * - A `null` allowed set for a category means **no restriction** (every element of that category is
 *   allowed) — the default, and the behaviour of requests that do not opt into the "non-installed
 *   elements" feature.
 * - A non-`null` set restricts that category to exactly the listed identifiers (normalized
 *   case-insensitively); an **empty** set disables every element of that category.
 *
 * Normalization strips every non-alphanumeric character and lowercases, so `XTextField` matches the
 * compact key `compact.formcycle_widgets.xtextfield`, and `FC_EMAIL` matches `fc_email`.
 */
internal object FormcycleElementFilter {

  /** The per-request allowed sets (`null` = no restriction for that category). */
  private data class Allowed(
      val widgets: Set<String>?,
      val nodes: Set<String>?,
      val triggers: Set<String>?
  )

  private val allowedForRequest = ThreadLocal<Allowed?>()

  /**
   * Runs [block] with the given allowed element sets active for the current thread. The
   * thread-local state is always cleared, even when [block] throws.
   *
   * @param allowedWidgets Widget identifiers to allow, or `null` for no restriction.
   * @param allowedNodes Workflow-node type identifiers to allow, or `null` for no restriction.
   * @param allowedTriggers Workflow-trigger type identifiers to allow, or `null` for no
   *   restriction.
   * @param block The request handling that may build AI prompts.
   * @return The result of [block].
   */
  fun <T> runForRequest(
      allowedWidgets: Set<String>?,
      allowedNodes: Set<String>?,
      allowedTriggers: Set<String>?,
      block: () -> T
  ): T {
    allowedForRequest.set(
        Allowed(
            allowedWidgets?.normalizeSet(),
            allowedNodes?.normalizeSet(),
            allowedTriggers?.normalizeSet()))
    try {
      return block()
    } finally {
      allowedForRequest.remove()
    }
  }

  /** Returns `true` when a widget restriction is active for the current request. */
  fun isWidgetFiltering(): Boolean = allowedForRequest.get()?.widgets != null

  /** Returns `true` when a workflow-node restriction is active for the current request. */
  fun isNodeFiltering(): Boolean = allowedForRequest.get()?.nodes != null

  /** Returns `true` when a workflow-trigger restriction is active for the current request. */
  fun isTriggerFiltering(): Boolean = allowedForRequest.get()?.triggers != null

  /**
   * Returns `true` when the widget with the given identifier may be transmitted to the AI. When no
   * widget restriction is active (or [id] is blank), this always returns `true`.
   */
  fun isWidgetAllowed(id: String?): Boolean {
    if (id.isNullOrBlank()) return true
    val allowed = allowedForRequest.get()?.widgets ?: return true
    return normalize(id) in allowed
  }

  /**
   * Returns `true` when the workflow node with the given type identifier may be transmitted to the
   * AI. When no node restriction is active (or [id] is blank), this always returns `true`.
   */
  fun isNodeAllowed(id: String?): Boolean {
    if (id.isNullOrBlank()) return true
    val allowed = allowedForRequest.get()?.nodes ?: return true
    return normalize(id) in allowed
  }

  /**
   * Returns `true` when the workflow trigger with the given type identifier may be transmitted to
   * the AI. When no trigger restriction is active (or [id] is blank), this always returns `true`.
   */
  fun isTriggerAllowed(id: String?): Boolean {
    if (id.isNullOrBlank()) return true
    val allowed = allowedForRequest.get()?.triggers ?: return true
    return normalize(id) in allowed
  }

  /**
   * Removes every `## <name>`-style section from [text] whose heading is NOT an allowed widget (per
   * [isWidgetAllowed]). The preamble before the first `##` heading is always kept, so general rules
   * and instructions survive. Used to filter the full `formcycle.widgets` reference (which is one
   * blob with `## XTextField` sections) when only some widgets are allowed.
   */
  fun scrubWidgetSections(text: String): String {
    if (!isWidgetFiltering()) return text
    return scrubSections(
        text, isAllowed = { normalize(it) in (allowedForRequest.get()?.widgets ?: emptySet()) })
  }

  /**
   * Same as [scrubWidgetSections], but for the workflow-node reference (sections headed `###
   * <name>`).
   */
  fun scrubNodeSections(text: String): String {
    if (!isNodeFiltering()) return text
    return scrubSections(
        text, isAllowed = { normalize(it) in (allowedForRequest.get()?.nodes ?: emptySet()) })
  }

  /**
   * Same as [scrubWidgetSections], but for the workflow-trigger reference (sections headed `###
   * <name>`).
   */
  fun scrubTriggerSections(text: String): String {
    if (!isTriggerFiltering()) return text
    return scrubSections(
        text, isAllowed = { normalize(it) in (allowedForRequest.get()?.triggers ?: emptySet()) })
  }

  /**
   * Removes hard-coded prompt prose that is dedicated to a workflow node which is **not** allowed
   * for the current request. Prompt templates embed node-specific instruction blocks (e.g. the AKDB
   * ePayBL payment instructions in the workflow task instruction, the classify-intent and the
   * clarification templates) that would otherwise keep instructing the AI to create a node the user
   * disabled ("Nicht installierte Elemente erstellen" OFF) even though the dynamic node-reference
   * sections are already filtered. A block is removed when it references a disallowed hard-coded
   * node (by its fully-qualified class name or one of its known aliases): standalone paragraphs are
   * dropped up to the next blank line, list items together with their indented continuations.
   * Everything not dedicated to a disallowed node (e.g. general FC_EMAIL / FC_REDIRECT guidance) is
   * preserved. No-op when node filtering is inactive.
   */
  fun scrubNodeProse(text: String): String {
    if (!isNodeFiltering()) return text
    val lines = text.split("\n").toMutableList()
    val out = ArrayList<String>(lines.size)
    var i = 0
    while (i < lines.size) {
      val line = lines[i]
      if (!referencesDisallowedHardcodedNode(line)) {
        out.add(line)
        i++
        continue
      }
      val trimmed = line.trimStart()
      val isListItem =
          trimmed.startsWith("- ") ||
              trimmed.startsWith("* ") ||
              trimmed.startsWith("+ ") ||
              NUMERIC_ITEM_RE.matches(trimmed)
      val indent = leadingWhitespace(line)
      i++
      if (isListItem) {
        // List item: drop it and its indented continuations until a blank line or a NEW item at the
        // same or a lesser indentation (e.g. the ePayBL bullets inside the "required values" list,
        // whose general neighbours like "- FC_REDIRECT" must survive).
        while (i < lines.size) {
          val n = lines[i]
          val ni = leadingWhitespace(n)
          val nt = n.trim()
          if (nt.isEmpty()) break
          val newItem =
              nt.startsWith("- ") ||
                  nt.startsWith("* ") ||
                  nt.startsWith("+ ") ||
                  NUMERIC_ITEM_RE.matches(nt)
          if (newItem && ni <= indent) break
          i++
        }
      } else {
        // Standalone paragraph opener: drop the whole paragraph up to the next blank line.
        while (i < lines.size && lines[i].trim().isNotEmpty()) i++
      }
    }
    return out.joinToString("\n").trim()
  }

  /**
   * Returns `true` when a line opens a prose block dedicated to a hard-coded workflow node that is
   * not allowed. Only the nodes in [HARDCODED_NODE_PROSE] are considered (the prompt templates'
   * static, node-specific instruction blocks); when such a node IS allowed the block is kept.
   */
  private fun referencesDisallowedHardcodedNode(line: String): Boolean {
    val allowed = allowedForRequest.get()?.nodes ?: return false
    val lower = line.lowercase()
    for ((fqcn, markers) in HARDCODED_NODE_PROSE) {
      if (isNodeAllowedDeep(fqcn, allowed)) continue
      if (lower.contains(fqcn.lowercase())) return true
      if (markers.any { lower.contains(it) }) return true
    }
    return false
  }

  /**
   * Whether a node referenced by its fully-qualified class name / type is allowed. Tolerates the
   * compact-key vs. class-name identifier mismatch: the compact node keys embed the node's class
   * name (e.g. `..._paymentinitplugin`), so a class-name reference matches when an allowed key ends
   * with it.
   */
  private fun isNodeAllowedDeep(node: String, allowed: Set<String>): Boolean {
    val n = normalize(node)
    if (n.isEmpty()) return true
    if (n in allowed) return true
    return allowed.any { it.endsWith(n) }
  }

  private fun leadingWhitespace(s: String): Int {
    val idx = s.indexOfFirst { it != ' ' && it != '\t' }
    return if (idx < 0) s.length else idx
  }

  private val NUMERIC_ITEM_RE = Regex("""\d+[.)]\s""")

  /**
   * Hard-coded, node-specific prose blocks in the prompt templates, keyed by the workflow node they
   * describe together with the markers the templates use to reference it.
   */
  private val HARDCODED_NODE_PROSE: List<Pair<String, List<String>>> =
      listOf(
          "de.xima.akdb.epay.logic.plugin.node.PaymentInitPlugin" to
              listOf(
                  "payment / order forms",
                  "payment notification matrix",
                  "payment failure recording",
                  "epaybl",
                  "akdb e-payment",
                  "akdb payment"))

  /**
   * Generic markdown section scrubber: keeps the preamble (everything before the first `##`/`###`
   * heading) and keeps every section whose heading is [isAllowed]. Headings themselves are matched
   * against the normalized element identifier; the heading line's `#` markers and any leading `###
   * ` / `## ` prefix are stripped before matching.
   */
  private fun scrubSections(text: String, isAllowed: (String) -> Boolean): String {
    val lines = text.split("\n").toMutableList()
    val out = StringBuilder()
    var i = 0
    // Preamble: everything up to the first `##`/`###` heading.
    while (i < lines.size) {
      val line = lines[i]
      val trimmed = line.trimStart()
      if (trimmed.startsWith("### ") || trimmed.startsWith("## ")) break
      out.append(line).append('\n')
      i++
    }
    // Sections: a heading plus its body until the next heading.
    while (i < lines.size) {
      val headingLine = lines[i]
      val heading = headingLine.trimStart()
      if (!heading.startsWith("### ") && !heading.startsWith("## ")) {
        // A stray non-heading line (blank/separator) before a section — keep it.
        out.append(headingLine).append('\n')
        i++
        continue
      }
      val name = heading.removePrefix("### ").removePrefix("## ").trim()
      val keep = isAllowed(normalize(name))
      val section = StringBuilder()
      i++
      while (i < lines.size) {
        val line = lines[i]
        val t = line.trimStart()
        if (t.startsWith("### ") || t.startsWith("## ")) break
        section.append(line).append('\n')
        i++
      }
      if (keep) {
        out.append(headingLine).append('\n').append(section)
      }
    }
    return out.toString().trimEnd()
  }

  /**
   * Normalizes an element identifier (e.g. `FC_EMAIL`, `fc_email`, `XTextField` → `xtextfield`).
   */
  fun normalize(raw: String): String = raw.trim().lowercase().replace(Regex("[^a-z0-9]"), "")

  private fun Set<String>.normalizeSet(): Set<String> =
      map { normalize(it) }.filter { it.isNotEmpty() }.toSet()
}
