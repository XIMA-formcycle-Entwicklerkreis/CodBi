package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.slf4j.LoggerFactory

/**
 * Per-user access control for which CodBi element prompts may be transmitted to the AI.
 *
 * The prompt content of a listed element is suppressed **exactly as if the element had been
 * deactivated in the Prompt Manager** — it is omitted from every reference / details section the AI
 * receives ([CodbiCapabilities], [LocalApiDocPrompts]) and from the cross-cutting prompts that
 * hard-code element templates (`codbi.general`). Two plugin-property mechanisms are supported:
 * 1. **`AI_FormAssistant_ForbiddenElements_NonSyncUsers`** — a CSV of CodBi elements. Whenever the
 *    current user is NOT one of the users listed in `APIDoc_UsersAllowedToSYNC`, the prompts of the
 *    listed elements are never transmitted to the AI (for sync-allowed users they remain visible).
 * 2. **`AI_FormAssistant_ForbiddenElements_<username>`** — any plugin property starting with
 *    `AI_FormAssistant_ForbiddenElements_` (other than the reserved `…_NonSyncUsers`) whose
 *    remainder is a user name (e.g. `AI_FormAssistant_ForbiddenElements_john.doe`). For exactly
 *    that user the prompts of the listed elements are never transmitted to the AI; for all other
 *    users they stay visible.
 *
 * Element entries in the CSV may be given as display names (`AI.LLAMA.CHAT`), as prompt keys
 * (`codbi.functionalities.ai_llama_chat`) or as the normalized element identifier
 * (`ai_llama_chat`); all forms are matched case-insensitively.
 *
 * The `APIDoc_UsersAllowedToSYNC` semantics (lower-cased CSV, matched against the lower-cased
 * logged-in user) mirror the Local API-Doc store's `StructuredDataStoreAction`.
 */
internal object CodBiElementAccess {

  private val logger = LoggerFactory.getLogger(CodBiElementAccess::class.java)

  /** Plugin property holding the CSV of users allowed to sync the API-Documentation. */
  private const val SYNC_USERS_PROPERTY = "APIDoc_UsersAllowedToSYNC"

  /** Plugin property hiding elements for users NOT allowed to sync the API-Documentation. */
  private const val NON_SYNC_FORBIDDEN_PROPERTY = "AI_FormAssistant_ForbiddenElements_NonSyncUsers"

  /** Suffix of the reserved non-sync property (not a user name). */
  private const val NON_SYNC_SUFFIX = "NonSyncUsers"

  /** Prefix of the per-user forbidden-element plugin properties. */
  private const val PER_USER_FORBIDDEN_PREFIX = "AI_FormAssistant_ForbiddenElements_"

  /**
   * A hidden CodBi element: its normalized identifier plus the name token as written in the CSV.
   */
  private data class HiddenElement(val id: String, val name: String)

  /**
   * The per-request hidden set: normalized ids (record filtering) + name tokens (prose scrubbing).
   */
  private data class HiddenSet(val ids: Set<String>, val names: Set<String>)

  /** Users allowed to sync the API-Documentation (lower-cased). */
  @Volatile private var syncUsers: Set<String> = emptySet()

  /** Elements hidden for users NOT in [syncUsers]. */
  @Volatile private var nonSyncHiddenElements: Set<HiddenElement> = emptySet()

  /** Lower-cased username → elements hidden for that user. */
  @Volatile private var perUserHiddenElements: Map<String, Set<HiddenElement>> = emptyMap()

  /** Thread-local carrying the hidden set of the current request's user. */
  private val hiddenForRequest = ThreadLocal<HiddenSet?>()

  /**
   * Reads the relevant plugin properties. Idempotent — the properties are global to the plugin, so
   * it may safely be called from any servlet-action `initialize` implementation.
   *
   * @param properties The plugin configuration properties.
   */
  fun initialize(properties: java.util.Properties) {
    syncUsers = parseCsv(properties.getProperty(SYNC_USERS_PROPERTY)).map { it.lowercase() }.toSet()
    nonSyncHiddenElements = parseHidden(properties.getProperty(NON_SYNC_FORBIDDEN_PROPERTY))
    val perUser = HashMap<String, Set<HiddenElement>>()
    properties.stringPropertyNames().forEach { key ->
      if (key.startsWith(PER_USER_FORBIDDEN_PREFIX)) {
        val suffix = key.removePrefix(PER_USER_FORBIDDEN_PREFIX).trim()
        // "NonSyncUsers" is the reserved non-sync property, not a user name.
        if (suffix.isNotEmpty() && !suffix.equals(NON_SYNC_SUFFIX, ignoreCase = true)) {
          perUser[suffix.lowercase()] = parseHidden(properties.getProperty(key))
        }
      }
    }
    perUserHiddenElements = perUser
    logger.info(
        "[CodBiElementAccess] Configured — syncUsers={}, nonSyncHiddenElements={}, perUserHiddenElements={}",
        syncUsers.size,
        nonSyncHiddenElements.size,
        perUserHiddenElements.size)
  }

  /**
   * Runs [block] as the given [username]: the per-request hidden set is computed from the plugin
   * configuration and every CodBi reference built inside [block] (via [CodbiCapabilities] /
   * [LocalApiDocPrompts]) will omit the hidden elements. The thread-local state is always cleared,
   * even when [block] throws.
   *
   * @param username The login name of the user running the inference, or `null` if unknown.
   * @param block The request handling that may build AI prompts.
   * @return The result of [block].
   */
  fun <T> runForUser(username: String?, block: () -> T): T {
    hiddenForRequest.set(hiddenElementsFor(username))
    try {
      return block()
    } finally {
      hiddenForRequest.remove()
    }
  }

  /**
   * Returns the normalized identifiers of the elements hidden for the current request's user (set
   * via [runForUser]), or an empty set when no user-scoped filter is active.
   */
  fun hiddenElementIdentifiers(): Set<String> = hiddenForRequest.get()?.ids ?: emptySet()

  /**
   * Returns `true` when the prompt record with the given [promptKey] / [displayName] must be
   * omitted from what is transmitted to the AI for the current request's user. When no user-scoped
   * filter is active, this always returns `false`.
   *
   * @param promptKey The record's prompt key (e.g. `codbi.functionalities.ai_llama_chat`).
   * @param displayName The record's display name (e.g. `AI.LLAMA.CHAT`), or `null`.
   */
  fun isHidden(promptKey: String, displayName: String?): Boolean {
    val hidden = hiddenForRequest.get()?.ids ?: return false
    if (hidden.isEmpty()) return false
    val normalizedKey = normalize(promptKey)
    if (normalizedKey.isNotEmpty() && normalizedKey in hidden) return true
    val lastSegment = normalize(promptKey.substringAfterLast('.'))
    if (lastSegment.isNotEmpty() && lastSegment in hidden) return true
    if (!displayName.isNullOrBlank() && normalize(displayName) in hidden) return true
    return false
  }

  /**
   * Removes from [text] the parts that are dedicated to a currently hidden element, so hidden
   * elements are not leaked to the AI through cross-cutting prompts such as `codbi.general` (which
   * hard-code element templates) or the bundled fallback references. What is removed:
   * - fenced code blocks (```…```) that build a hidden element,
   * - paragraphs whose first line names a hidden element as their subject (e.g. `##
   *   Sys.Log.Console` or `CRITICAL — Sys.Log.Console …`),
   * - paragraphs that assign a hidden element to `data-cb-func` / `data-cb-Data`,
   * - remaining inline mentions of a hidden element's name (e.g. `console output →
   *   Sys.Log.Console`).
   *
   * When no user-scoped filter is active (or nothing is hidden), [text] is returned unchanged.
   */
  fun scrub(text: String): String {
    val hiddenSet = hiddenForRequest.get() ?: return text
    if (hiddenSet.ids.isEmpty()) return text
    val ids = hiddenSet.ids
    val names = hiddenSet.names
    val lines = text.split("\n").toMutableList()
    val out = StringBuilder()
    var i = 0
    while (i < lines.size) {
      val line = lines[i]
      val trimmed = line.trim()
      if (trimmed.startsWith("```")) {
        // Fenced code block: collect it (including both fences).
        val block = mutableListOf(line)
        i++
        while (i < lines.size && !lines[i].trim().startsWith("```")) {
          block.add(lines[i])
          i++
        }
        if (i < lines.size) {
          block.add(lines[i])
          i++
        }
        if (!blockReferencesHidden(block, ids)) {
          block.forEach { out.append(it).append('\n') }
        }
        continue
      }
      if (trimmed.isNotEmpty()) {
        // Paragraph: contiguous non-blank lines that do not start a new code block.
        val para = mutableListOf(line)
        i++
        while (i < lines.size) {
          val next = lines[i]
          val nt = next.trim()
          if (next.isBlank() || nt.startsWith("```")) break
          para.add(next)
          i++
        }
        if (paragraphDedicatedToHidden(para, ids)) {
          // Drop the paragraph; keep a single blank separator line (if any) so the remaining
          // blocks stay visually separated.
          if (i < lines.size && lines[i].isBlank()) {
            out.append('\n')
            i++
          }
        } else {
          para.forEach { out.append(removeNameMentions(it, names)).append('\n') }
        }
        continue
      }
      out.append(line).append('\n')
      i++
    }
    return out.toString().trimEnd()
  }

  /** Returns `true` when any line of the fenced code [block] references a hidden element. */
  private fun blockReferencesHidden(block: List<String>, ids: Set<String>): Boolean =
      block.any { line -> lineReferencesHidden(line, ids) }

  /**
   * Returns `true` when the paragraph is dedicated to a hidden element, i.e. its first line names a
   * hidden element as its subject, or it assigns a hidden element to `data-cb-func` /
   * `data-cb-Data`. A generic paragraph that merely lists many elements and mentions "data-cb-func"
   * in passing does NOT qualify.
   */
  private fun paragraphDedicatedToHidden(para: List<String>, ids: Set<String>): Boolean {
    if (para.isEmpty()) return false
    val subjectNorm = normalize(paragraphSubject(para[0]))
    if (subjectNorm.isNotEmpty() &&
        ids.any { h ->
          subjectNorm == h ||
              subjectNorm.startsWith("${h}_") ||
              subjectNorm.startsWith("$h ") ||
              subjectNorm.startsWith("$h:")
        }) {
      return true
    }
    return para.any { line -> lineAssignsHiddenElement(line, ids) }
  }

  /**
   * Strips leading markdown heading marks, list markers and an optional `CRITICAL —` prefix from a
   * paragraph's first line, yielding its subject (e.g. `Sys.Log.Console is a …`).
   */
  private fun paragraphSubject(firstLine: String): String =
      firstLine
          .trim()
          .removePrefix("#")
          .trim()
          .removePrefix("-")
          .trim()
          .removePrefix("CRITICAL")
          .trim()
          .removePrefix("—")
          .trim()
          .removePrefix("-")
          .trim()

  /**
   * Returns `true` when the line assigns a hidden element as the value of `data-cb-func` /
   * `data-cb-Data` (e.g. `data-cb-func="Sys.Log.Console"`), as opposed to merely mentioning the
   * element or the attribute name in shared prose.
   */
  private fun lineAssignsHiddenElement(line: String, ids: Set<String>): Boolean {
    val lower = line.lowercase()
    if (!lower.contains("data-cb-func") && !lower.contains("data-cb-data")) return false
    val valueRegex = Regex("data-cb-[a-z-]+\\s*=\\s*[\"']?([^\"'\\s>,}]+)")
    return valueRegex.findAll(lower).any { m ->
      val norm = normalize(m.groupValues[1])
      norm.isNotEmpty() && ids.any { h -> norm == h || norm.startsWith("$h") }
    }
  }

  /** Returns `true` when the line's normalized content mentions a hidden element. */
  private fun lineReferencesHidden(line: String, ids: Set<String>): Boolean {
    val norm = normalize(line)
    return ids.any { h -> norm.contains(h) }
  }

  /**
   * Removes inline mentions of a hidden element's name from [line] (case-insensitive) and cleans up
   * the leftover "→ …" fragment / double spaces.
   */
  private fun removeNameMentions(line: String, names: Set<String>): String {
    var result = line
    for (name in names) {
      if (name.isNotEmpty()) {
        result = result.replace(name, "", ignoreCase = true)
      }
    }
    // Remove the dangling arrow fragment that remains after an inline name was stripped.
    result = result.replace(Regex("\\s*→\\s*[.,;]"), "")
    return result.replace(Regex("\\s{2,}"), " ").trimEnd()
  }

  /** Computes the per-request hidden set for [username]. */
  private fun hiddenElementsFor(username: String?): HiddenSet {
    val ids = LinkedHashSet<String>()
    val names = LinkedHashSet<String>()
    val add = { elements: Set<HiddenElement> ->
      elements.forEach { e ->
        ids.add(e.id)
        if (e.name.isNotEmpty()) names.add(e.name)
      }
    }
    val normalizedUsername = username?.trim()?.lowercase()
    // Elements configured via AI_FormAssistant_ForbiddenElements_NonSyncUsers are hidden for every
    // user that is NOT allowed to sync the API-Documentation.
    if (normalizedUsername == null || normalizedUsername !in syncUsers) {
      add(nonSyncHiddenElements)
    }
    // Elements configured via AI_FormAssistant_ForbiddenElements_<username> are hidden only for
    // that exact user.
    perUserHiddenElements[normalizedUsername]?.let { add(it) }
    return HiddenSet(ids, names)
  }

  /** Splits a CSV value into trimmed, non-empty entries. */
  private fun parseCsv(value: String?): List<String> =
      value?.split(",")?.map { it.trim() }?.filter { it.isNotEmpty() } ?: emptyList()

  /** Parses a CSV of element names into [HiddenElement]s (normalized id + original name token). */
  private fun parseHidden(value: String?): Set<HiddenElement> =
      parseCsv(value)
          .mapNotNull { raw ->
            val id = normalize(raw)
            if (id.isEmpty()) null else HiddenElement(id, raw)
          }
          .toSet()

  /**
   * Normalizes an element name / prompt key to a stable identifier (e.g. `AI.LLAMA.CHAT` →
   * `ai_llama_chat`).
   */
  private fun normalize(raw: String): String =
      raw.trim().lowercase().replace(Regex("[^a-z0-9_]"), "_").replace(Regex("_+"), "_").trim('_')
}
