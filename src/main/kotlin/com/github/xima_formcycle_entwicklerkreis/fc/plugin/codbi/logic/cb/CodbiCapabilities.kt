package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodbiEntities
import com.google.gson.GsonBuilder
import org.slf4j.LoggerFactory

/** Loads and caches the compact CodBi API reference section injected into AI system prompts. */
internal object CodbiCapabilities {

  private val logger = LoggerFactory.getLogger(CodbiCapabilities::class.java)
  private val gson = GsonBuilder().create()

  private const val ELEMENTS_ONLY_RESOURCE =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-elements-compact.md"
  private const val FULL_API_RESOURCE =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-api-compact.md"
  private const val DETAILS_INDEX_RESOURCE =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-details-index.json"
  private const val FORMCYCLE_WIDGETS_ONLY_RESOURCE =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/formcycle-widgets-compact.md"

  @Volatile private var cachedElements: String? = null
  @Volatile private var elementsBuiltAt: Long = 0L
  @Volatile private var cachedFull: String? = null
  @Volatile private var fullBuiltAt: Long = 0L
  @Volatile private var cachedDetailsIndex: Map<String, Any>? = null
  @Volatile private var detailsIndexBuiltAt: Long = 0L
  private const val CACHE_TTL_MS = 5 * 60 * 1000L

  /** Returns the default capabilities section (elements only). */
  fun buildSection(): String {
    return buildSectionBase() + localCondensedSection()
  }

  /** Returns the full compact API section (elements + parameters + classes). */
  fun buildFullSection(): String {
    return buildFullSectionBase() + localDetailedSection()
  }

  /** Builds the (cached) base elements section without the local API-Doc prompts. */
  private fun buildSectionBase(): String {
    // Prefer the database so deactivated compact elements are excluded from the AI's pass-1
    // reference; fall back to the bundled classpath resource when the DB is unavailable/empty.
    val fromDb = buildElementsFromDb()
    if (fromDb != null) return fromDb
    val now = System.currentTimeMillis()
    cachedElements
        ?.takeIf { now - elementsBuiltAt < CACHE_TTL_MS }
        ?.let {
          return it
        }
    return synchronized(CodbiCapabilities) {
      val now2 = System.currentTimeMillis()
      cachedElements?.takeIf { now2 - elementsBuiltAt < CACHE_TTL_MS }
          ?: buildElementsFresh().also {
            cachedElements = it
            elementsBuiltAt = now2
          }
    }
  }

  /** Builds the (cached) base full section without the local API-Doc prompts. */
  private fun buildFullSectionBase(): String {
    // Prefer the DB so user edits/deactivations of the detailed prompts are reflected; fall back
    // to the bundled classpath resource when the DB is unavailable or the category is empty.
    val fromDb = buildFullFromDb()
    if (fromDb != null) return fromDb
    val now = System.currentTimeMillis()
    cachedFull
        ?.takeIf { now - fullBuiltAt < CACHE_TTL_MS }
        ?.let {
          return it
        }
    return synchronized(CodbiCapabilities) {
      val now2 = System.currentTimeMillis()
      cachedFull?.takeIf { now2 - fullBuiltAt < CACHE_TTL_MS }
          ?: buildFullFresh().also {
            cachedFull = it
            fullBuiltAt = now2
          }
    }
  }

  /** Loads the condensed section of the local API-Doc CodBi elements (AI-capable only). */
  private fun localCondensedSection(): String {
    val emf = CodbiEntities.entityManagerFactory ?: return ""
    val em = emf.createEntityManager()
    return try {
      LocalApiDocPrompts.condensedSection(em)
    } catch (e: Exception) {
      logger.warn("[CodbiCapabilities] Failed to load local condensed section: {}", e.message)
      ""
    } finally {
      em.close()
    }
  }

  /** Loads the detailed section of the local API-Doc CodBi elements (AI-capable only). */
  private fun localDetailedSection(): String {
    val emf = CodbiEntities.entityManagerFactory ?: return ""
    val em = emf.createEntityManager()
    return try {
      LocalApiDocPrompts.detailedSection(em)
    } catch (e: Exception) {
      logger.warn("[CodbiCapabilities] Failed to load local detailed section: {}", e.message)
      ""
    } finally {
      em.close()
    }
  }

  /**
   * Loads the detailed sections of the requested local API-Doc CodBi elements (AI-capable only).
   */
  private fun localRequestedDetails(requestedIds: List<String>): String {
    val emf = CodbiEntities.entityManagerFactory ?: return ""
    val em = emf.createEntityManager()
    return try {
      LocalApiDocPrompts.requestedDetails(em, requestedIds)
    } catch (e: Exception) {
      logger.warn("[CodbiCapabilities] Failed to load local requested details: {}", e.message)
      ""
    } finally {
      em.close()
    }
  }

  /**
   * Rebuilds the full CodBi reference from the detailed DB prompts (codbi.functionalities.* /
   * codbi.element_placeholders.* / codbi.standard_configurations.*) — active only — grouped by
   * category, so user edits and deactivations are reflected. Returns `null` to fall back to the
   * bundled resource when the DB is unavailable or the category has no active entries.
   */
  private fun buildFullFromDb(): String? {
    val emf = CodbiEntities.entityManagerFactory ?: return null
    val em = emf.createEntityManager()
    try {
      // The local API-Doc manager is the source of truth for its elements — exclude any prompt rows
      // (e.g. leftovers from an earlier sync) that carry the same key as a local AI-capable
      // element.
      val localKeys = LocalApiDocPrompts.detailedPromptKeys(em)
      val records =
          PromptLoader.loadCategoryRecords(em, "codbi.").filter {
            it.promptKey !in localKeys &&
                !CodBiElementAccess.isHidden(it.promptKey, it.displayName) &&
                (it.promptKey.startsWith("codbi.functionalities.") ||
                    it.promptKey.startsWith("codbi.element_placeholders.") ||
                    it.promptKey.startsWith("codbi.standard_configurations."))
          }
      if (records.isEmpty()) return null
      val groups = LinkedHashMap<String, MutableList<PromptLoader.PromptRecord>>()
      for (r in records) {
        val cat = r.promptKey.removePrefix("codbi.").substringBefore('.')
        groups.getOrPut(cat) { mutableListOf() }.add(r)
      }
      val sb = StringBuilder("\n\nCODBI CORE COMPONENTS API (COMPACT)\n")
      for ((cat, items) in groups) {
        val catLabel =
            when (cat) {
              "functionalities" -> "Functionalities"
              "element_placeholders" -> "Element Placeholders"
              "standard_configurations" -> "Standard Configurations"
              else -> cat
            }
        sb.append("\n## ").append(catLabel).append("\n")
        for (r in items.sortedBy { it.promptKey }) {
          val name =
              r.displayName?.takeIf { it.isNotBlank() } ?: r.promptKey.substringAfterLast('.')
          sb.append("\n### ").append(name).append("\n")
          if (!r.promptText.isNullOrBlank()) sb.append(r.promptText).append("\n")
        }
      }
      return sb.toString().trimEnd()
    } catch (e: Exception) {
      logger.warn("[CodbiCapabilities] Failed to build full section from DB: {}", e.message)
      return null
    } finally {
      em.close()
    }
  }

  /** Returns the condensed formcycle widgets section (names + purpose, no JSON structure). */
  fun buildWidgetsSection(): String {
    // Prefer the database so deactivated widgets are excluded from the AI's pass-1 reference.
    val fromDb = buildWidgetsFromDb()
    if (fromDb != null) return fromDb
    // Fallback: bundled resource — scrub out any widget that is not allowed for the current request
    // (the "Nicht installierte Elemente erstellen" feature).
    return FormcycleElementFilter.scrubWidgetSections(
        load(FORMCYCLE_WIDGETS_ONLY_RESOURCE, "FORMCYCLE WIDGETS (COMPACT)"))
  }

  /**
   * Rebuilds the condensed CodBi elements section from the compact DB table (active prompts only),
   * grouped by Functionalities / Element Placeholders / Standard Configurations, so deactivating an
   * element removes it from the AI's pass-1 reference. Returns `null` to fall back to the bundled
   * resource when the DB is unavailable or the category has no active entries.
   */
  private fun buildElementsFromDb(): String? {
    val emf = CodbiEntities.entityManagerFactory ?: return null
    val em = emf.createEntityManager()
    try {
      // The local API-Doc manager is the source of truth for its elements — exclude any prompt rows
      // (e.g. leftovers from an earlier sync) that carry the same key as a local AI-capable
      // element.
      val localKeys = LocalApiDocPrompts.compactPromptKeys(em)
      val allRecords = CompactPromptLoader.loadCategoryRecords(em, "compact.elements")
      val records =
          allRecords.filter {
            it.promptKey !in localKeys && !CodBiElementAccess.isHidden(it.promptKey, it.displayName)
          }
      if (records.isEmpty()) return null
      val sb = StringBuilder("\n\nCODBI CORE ELEMENTS (COMPACT)\n")
      val header = records.firstOrNull { it.promptKey == "compact.elements" }?.promptText
      if (!header.isNullOrBlank()) sb.append(header).append("\n")
      val groups = LinkedHashMap<String, MutableList<CompactPromptLoader.CompactRecord>>()
      for (r in records) {
        if (r.promptKey == "compact.elements") continue
        val parts = r.promptKey.split(".")
        val group = if (parts.size >= 4) parts[2] else ""
        groups.getOrPut(group) { mutableListOf() }.add(r)
      }
      for ((group, items) in groups) {
        val groupLabel =
            when (group) {
              "functionalities" -> "Functionalities"
              "element_placeholders" -> "Element Placeholders"
              "standard_configurations" -> "Standard Configurations"
              else -> group.replace('_', ' ').replaceFirstChar { it.uppercase() }
            }
        sb.append("\n## ").append(groupLabel).append("\n")
        for (r in items.sortedBy { it.promptKey }) {
          val name =
              r.displayName?.takeIf { it.isNotBlank() } ?: r.promptKey.substringAfterLast('.')
          sb.append("\n### ").append(name).append("\n")
          if (!r.promptText.isNullOrBlank()) sb.append(r.promptText).append("\n")
        }
      }
      return sb.toString().trimEnd()
    } catch (e: Exception) {
      logger.warn("[CodbiCapabilities] Failed to build elements section from DB: {}", e.message)
      return null
    } finally {
      em.close()
    }
  }

  /**
   * Rebuilds the condensed formcycle widgets section from the compact DB table (active prompts
   * only), so deactivating a widget removes it from the AI's pass-1 reference. Returns `null` to
   * fall back to the bundled resource when the DB is unavailable or the category is empty.
   */
  private fun buildWidgetsFromDb(): String? {
    val emf = CodbiEntities.entityManagerFactory ?: return null
    val em = emf.createEntityManager()
    try {
      val records = CompactPromptLoader.loadCategoryRecords(em, "compact.formcycle_widgets")
      if (records.isEmpty()) return null
      val sb = StringBuilder("\n\nFORMCYCLE WIDGETS (COMPACT)\n")
      val header = records.firstOrNull { it.promptKey == "compact.formcycle_widgets" }?.promptText
      if (!header.isNullOrBlank()) sb.append(header).append("\n")
      for (r in records) {
        if (r.promptKey == "compact.formcycle_widgets") continue
        val name = r.displayName?.takeIf { it.isNotBlank() } ?: r.promptKey.substringAfterLast('.')
        // "Nicht installierte Elemente erstellen": skip widgets that are not in the allowed set.
        if (!FormcycleElementFilter.isWidgetAllowed(r.promptKey.substringAfterLast('.')) &&
            !FormcycleElementFilter.isWidgetAllowed(name))
            continue
        sb.append("\n### ").append(name).append("\n")
        if (!r.promptText.isNullOrBlank()) sb.append(r.promptText).append("\n")
      }
      return sb.toString().trimEnd()
    } catch (e: Exception) {
      logger.warn("[CodbiCapabilities] Failed to build widgets section from DB: {}", e.message)
      return null
    } finally {
      em.close()
    }
  }

  /** Returns full details for only the requested IDs (functionality/EP/standard/class alias). */
  fun buildFullSectionFor(requestedIds: List<String>): String {
    if (requestedIds.isEmpty()) {
      return buildFullSection()
    }
    // Prefer the DB: pass-2 details come from the detailed prompts in codbi_ai_prompt
    // (codbi.functionalities.* / codbi.element_placeholders.* / codbi.standard_configurations.*),
    // so Prompt-Manager edits and deactivations take effect on the pass-2 rerun.
    val fromDb = buildRequestedDetailsFromDb(requestedIds)
    // Fallback: bundled details index (classpath).
    val base = fromDb ?: buildRequestedDetailsFromIndex(requestedIds)
    // Always append the requested local API-Doc elements' details.
    return base + localRequestedDetails(requestedIds)
  }

  /**
   * Loads the requested element details from the detailed DB prompts (codbi.functionalities.* /
   * codbi.element_placeholders.* / codbi.standard_configurations.*) — active only. Returns `null`
   * to fall back to the bundled details index when the DB is unavailable or none of the requested
   * IDs matched.
   */
  private fun buildRequestedDetailsFromDb(requestedIds: List<String>): String? {
    val emf = CodbiEntities.entityManagerFactory ?: return null
    val em = emf.createEntityManager()
    try {
      val sections = PromptLoader.loadSectionMap(em, "codbi.")
      if (sections.isEmpty()) return null
      // The local API-Doc manager is the source of truth for its elements — exclude any prompt rows
      // (e.g. leftovers from an earlier sync) that carry the same key as a local AI-capable
      // element.
      val localKeys = LocalApiDocPrompts.detailedPromptKeys(em)
      val wanted = linkedSetOf<String>()
      for (raw in requestedIds) {
        val norm = normalizeId(raw.trim())
        if (norm.isNotEmpty()) wanted.add(norm)
      }
      if (wanted.isEmpty()) return null
      val bySuffix = HashMap<String, String>()
      for ((key, text) in sections) {
        if (!key.startsWith("codbi.") || key in localKeys) continue
        if (CodBiElementAccess.isHidden(key, null)) continue
        val norm = normalizeId(key.substringAfterLast('.'))
        if (norm.isNotEmpty() && text.isNotBlank()) bySuffix.getOrPut(norm) { text }
      }
      val sb = StringBuilder("\n\nCODBI REQUESTED DETAILS\n")
      var added = false
      for (norm in wanted) {
        val text = bySuffix[norm] ?: continue
        sb.append("\n## ").append(norm).append("\n")
        sb.append(text).append("\n")
        added = true
      }
      return if (added) sb.toString().trimEnd() else null
    } catch (e: Exception) {
      logger.warn("[CodbiCapabilities] Failed to build requested details from DB: {}", e.message)
      return null
    } finally {
      em.close()
    }
  }

  /**
   * Normalizes an element id/name (e.g. "AI.LLAMA.CHAT", "Ai Llama Chat", "ai_llama_chat") to a
   * stable key segment so it can be matched against the detailed prompt keys.
   */
  private fun normalizeId(raw: String): String =
      raw.trim().lowercase().replace(Regex("[^a-z0-9_]"), "_").replace(Regex("_+"), "_").trim('_')

  /** Resolves and renders the requested details from the bundled classpath details index. */
  private fun buildRequestedDetailsFromIndex(requestedIds: List<String>): String {
    val index = loadDetailsIndex()
    if (index == null) {
      logger.warn("[CodbiCapabilities] Details index unavailable, falling back to full section")
      return buildFullSection()
    }

    @Suppress("UNCHECKED_CAST")
    val entries = index["entries"] as? Map<String, Any> ?: return buildFullSection()
    @Suppress("UNCHECKED_CAST") val aliases = index["aliases"] as? Map<String, Any> ?: emptyMap()

    val resolved = linkedSetOf<String>()
    for (raw in requestedIds) {
      val q = raw.trim()
      if (q.isEmpty()) continue
      val match =
          when {
            entries.containsKey(q) -> q
            aliases[q] is String -> aliases[q] as String
            aliases[q.lowercase()] is String -> aliases[q.lowercase()] as String
            else -> null
          }
      if (match != null && !CodBiElementAccess.isHidden(match, null)) resolved.add(match)
    }

    if (resolved.isEmpty()) {
      return ""
    }

    val sb = StringBuilder("\n\nCODBI REQUESTED DETAILS (TSDOC)\n")
    for (id in resolved) {
      @Suppress("UNCHECKED_CAST") val entry = entries[id] as? Map<String, Any> ?: continue
      val type = entry["type"] as? String ?: "unknown"
      val summary = entry["summary"] as? String ?: ""
      val tsdoc = entry["tsdoc"] as? String ?: ""

      sb.append("\n## ").append(id).append("\n")
      sb.append("Type: ").append(type).append("\n")
      if (summary.isNotBlank()) {
        sb.append("Summary: ").append(summary).append("\n")
      }
      if (tsdoc.isNotBlank()) {
        sb.append("TSDoc:\n").append(tsdoc).append("\n")
      }

      @Suppress("UNCHECKED_CAST") val params = entry["parameters"] as? Map<String, Any>
      if (params != null && params.isNotEmpty()) {
        sb.append("Parameters:\n")
        for ((k, v) in params.toSortedMap()) {
          val d = v as? String ?: continue
          sb.append("- ").append(k).append(": ").append(d).append("\n")
        }
      }

      @Suppress("UNCHECKED_CAST") val classes = entry["classDescriptions"] as? Map<String, Any>
      if (classes != null && classes.isNotEmpty()) {
        sb.append("Classes:\n")
        for ((k, v) in classes.toSortedMap()) {
          val d = v as? String ?: continue
          sb.append("- .").append(k).append(": ").append(d).append("\n")
        }
      }
    }

    return sb.toString().trimEnd()
  }

  private fun load(resourcePath: String, heading: String): String {
    return try {
      val raw =
          CodbiCapabilities::class
              .java
              .classLoader
              .getResourceAsStream(resourcePath)
              ?.bufferedReader(Charsets.UTF_8)
              ?.use { it.readText() }
              ?.trim()
              .orEmpty()
      if (raw.isEmpty()) "" else "\n\n$heading\n$raw"
    } catch (e: Exception) {
      logger.warn("[CodbiCapabilities] Failed to load resource '{}': {}", resourcePath, e.message)
      ""
    }
  }

  private fun buildElementsFresh(): String =
      load(ELEMENTS_ONLY_RESOURCE, "CODBI CORE ELEMENTS (COMPACT)")

  private fun buildFullFresh(): String =
      load(FULL_API_RESOURCE, "CODBI CORE COMPONENTS API (COMPACT)")

  private fun loadDetailsIndex(): Map<String, Any>? {
    val now = System.currentTimeMillis()
    cachedDetailsIndex
        ?.takeIf { now - detailsIndexBuiltAt < CACHE_TTL_MS }
        ?.let {
          return it
        }

    return synchronized(CodbiCapabilities) {
      val now2 = System.currentTimeMillis()
      cachedDetailsIndex?.takeIf { now2 - detailsIndexBuiltAt < CACHE_TTL_MS }
          ?: run {
            val loaded =
                try {
                  val raw =
                      CodbiCapabilities::class
                          .java
                          .classLoader
                          .getResourceAsStream(DETAILS_INDEX_RESOURCE)
                          ?.bufferedReader(Charsets.UTF_8)
                          ?.use { it.readText() }
                          .orEmpty()
                  if (raw.isBlank()) null
                  else {
                    @Suppress("UNCHECKED_CAST")
                    gson.fromJson(raw, Map::class.java) as? Map<String, Any>
                  }
                } catch (e: Exception) {
                  logger.warn(
                      "[CodbiCapabilities] Failed to load details index '{}': {}",
                      DETAILS_INDEX_RESOURCE,
                      e.message)
                  null
                }
            cachedDetailsIndex = loaded
            detailsIndexBuiltAt = now2
            loaded
          }
    }
  }

  /**
   * Builds a functionality → parameter-name index from the bundled details index. Each value is the
   * set of the functionality's parameter names lowercased (as they appear in the `data-cb-<param>`
   * attributes, without the `data-cb-` prefix). Used by the change log to list each `data-cb-*`
   * parameter only under the functionality(-ies) it belongs to.
   */
  fun functionalityParamsIndex(): Map<String, Set<String>> {
    val index = loadDetailsIndex() ?: return emptyMap()
    @Suppress("UNCHECKED_CAST")
    val entries = index["entries"] as? Map<String, Any> ?: return emptyMap()
    val result = HashMap<String, Set<String>>()
    for ((id, raw) in entries) {
      val entry = raw as? Map<String, Any> ?: continue
      if (entry["type"] != "functionality") continue
      @Suppress("UNCHECKED_CAST") val params = entry["parameters"] as? Map<String, Any> ?: continue
      if (params.isEmpty()) continue
      result[id] = params.keys.map { it.lowercase() }.toSet()
    }
    return result
  }

  /**
   * Returns the lowercase-alias → canonical functionality-ID map from the bundled details index.
   */
  fun functionalityAliases(): Map<String, String> {
    val index = loadDetailsIndex() ?: return emptyMap()
    @Suppress("UNCHECKED_CAST")
    val aliases = index["aliases"] as? Map<String, Any> ?: return emptyMap()
    return aliases.mapNotNull { (k, v) -> (v as? String)?.let { k.lowercase() to it } }.toMap()
  }
}
