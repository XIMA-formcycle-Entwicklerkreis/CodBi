package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

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

  /** Returns the full compact API section (elements + parameters + classes). */
  fun buildFullSection(): String {
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

  /** Returns the condensed formcycle widgets section (names + purpose, no JSON structure). */
  fun buildWidgetsSection(): String =
      load(FORMCYCLE_WIDGETS_ONLY_RESOURCE, "FORMCYCLE WIDGETS (COMPACT)")

  /** Returns full details for only the requested IDs (functionality/EP/standard/class alias). */
  fun buildFullSectionFor(requestedIds: List<String>): String {
    if (requestedIds.isEmpty()) {
      return buildFullSection()
    }

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
      when {
        entries.containsKey(q) -> resolved.add(q)
        aliases[q] is String -> resolved.add(aliases[q] as String)
        aliases[q.lowercase()] is String -> resolved.add(aliases[q.lowercase()] as String)
      }
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
}
