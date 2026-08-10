package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.GsonBuilder
import javax.persistence.EntityManager
import javax.persistence.EntityManagerFactory
import org.slf4j.LoggerFactory

/**
 * Service that seeds/loads **compact** AI system prompts from the condensed classpath resources
 * into the [codbi_compact_prompt] database table. Mirrors the structure of [PromptLoader] but uses
 * a separate table.
 *
 * The Condensed view intentionally contains ONLY the condensed references (what the AI receives
 * initially via `{{CODBI_ELEMENTS_SECTION}}` and `{{FORMCYCLE_WIDGETS_SECTION}}`). The
 * parameter-complete API reference (`codbi-core-api-compact.md`) is seeded into the **detailed**
 * table as `codbi.api_reference` (see [PromptLoader]).
 *
 * ## Seed sources
 * 1. `codbi-core-elements-compact.md` → base key `compact.elements`
 * 2. `formcycle-widgets-compact.md` → base key `compact.formcycle_widgets`
 *
 * Each `##` section becomes an individual prompt record with a key like
 * `compact.elements.functionalities`.
 */
internal object CompactPromptLoader {

  private val logger = LoggerFactory.getLogger(CompactPromptLoader::class.java)
  private val gson = GsonBuilder().create()
  private var needsBulkSeedCheck = true

  /** Keys seeded during the current seed run, used to clean up stale system prompts. */
  private val seededKeys = mutableSetOf<String>()

  /** Set externally from plugin properties (e.g., `AI_Prompt_Reseed=true`) to force a re-seed. */
  @Volatile internal var forceReseed = false

  /** Base classpath resource directory. */
  private const val RESOURCE_BASE = "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/"

  /** The compact prompt source files (path → base key). */
  private val SEED_FILES =
      mapOf(
          "${RESOURCE_BASE}codbi-core-elements-compact.md" to "compact.elements",
          "${RESOURCE_BASE}formcycle-widgets-compact.md" to "compact.formcycle_widgets",
          "${RESOURCE_BASE}formcycle-workflow-nodes-compact.md" to
              "compact.formcycle_workflow_nodes")

  /**
   * Seed base keys used by earlier plugin versions that are no longer seeded. Records under these
   * prefixes (e.g. the old `compact.api` seed, which moved to the Detailed view) are stale
   * leftovers and are purged on every seed run so they no longer appear in the condensed Prompt
   * Manager view. Legacy rows were inserted before the `is_system` flag existed and therefore carry
   * `is_system = false`, so they are invisible to the stale-system-prompt cleanup below.
   */
  private val RETIRED_SEED_BASE_KEYS = setOf("compact.api")

  /** DB table name. */
  private const val TABLE = "codbi_compact_prompt"

  /** Seed version marker key. */
  private const val SEED_VERSION_KEY = "_seed_version"

  /** Plugin property name for forcing a prompt re-seed via Formcycle plugin config. */
  internal const val RESEED_PROPERTY = "AI_FormAssistant_Prompt_Reseed"

  // region Seed

  /** Seeds / updates all compact prompts from classpath resources. */
  fun seedIfNeeded(emf: EntityManagerFactory, pluginVersion: String) {
    val em = emf.createEntityManager()
    try {
      em.transaction.begin()
      seededKeys.clear()

      // Check for force reseed flag (set from plugin property AI_Prompt_Reseed)
      if (forceReseed) {
        logger.info(
            "[CompactPromptLoader] Force reseed requested via plugin property '{}' — clearing stored version",
            RESEED_PROPERTY)
        em.createNativeQuery("DELETE FROM $TABLE WHERE prompt_key = :key")
            .setParameter("key", SEED_VERSION_KEY)
            .executeUpdate()
        forceReseed = false
      }

      val storedVersion = readSeedVersion(em)
      if (storedVersion == pluginVersion) {
        em.transaction.commit()
        logger.info(
            "[CompactPromptLoader] Already seeded at version '{}' — skipping", storedVersion)
        return
      }
      logger.info(
          "[CompactPromptLoader] Seeding/updating (stored='{}', current='{}')",
          storedVersion ?: "<none>",
          pluginVersion)

      for ((resourcePath, baseKey) in SEED_FILES) {
        val content = loadResourceFile(resourcePath)
        if (content == null) {
          logger.warn("[CompactPromptLoader] Resource '{}' not found — skipping", resourcePath)
          continue
        }
        if (content.contains("\n## ")) {
          seedSplitFile(em, baseKey, content, pluginVersion, resourcePath)
        } else {
          upsertPrompt(em, baseKey, content, pluginVersion)
          logger.info("[CompactPromptLoader] Upserted '{}' from '{}'", baseKey, resourcePath)
        }
      }

      // Clean up stale system prompts (e.g., compact.api.* that moved to the Detailed view).
      // The is_system=true filter alone is not enough: records seeded before the is_system flag
      // existed (e.g. the old `compact.api` seed) carry is_system=false and would never be removed.
      // Purge those under retired seed base keys explicitly, in addition to stale system prompts.
      val staleKeys = mutableSetOf<String>()

      val allSystemKeys =
          em.createNativeQuery("SELECT prompt_key FROM $TABLE WHERE is_system = 1")
              .resultList
              .mapNotNull { it?.toString() }
      staleKeys += allSystemKeys

      if (RETIRED_SEED_BASE_KEYS.isNotEmpty()) {
        val allKeys =
            em.createNativeQuery("SELECT prompt_key FROM $TABLE").resultList.mapNotNull {
              it?.toString()
            }
        staleKeys +=
            allKeys.filter { key ->
              RETIRED_SEED_BASE_KEYS.any { key == it || key.startsWith("$it.") }
            }
      }

      var staleDeleted = 0
      for (key in staleKeys) {
        if (key == SEED_VERSION_KEY || key in seededKeys) continue
        em.createNativeQuery("DELETE FROM $TABLE WHERE prompt_key = :key")
            .setParameter("key", key)
            .executeUpdate()
        staleDeleted++
      }
      if (staleDeleted > 0) {
        logger.info("[CompactPromptLoader] Deleted {} stale compact prompt(s)", staleDeleted)
      }

      upsertSeedVersion(em, pluginVersion)
      em.transaction.commit()
      logger.info("[CompactPromptLoader] Seed complete for version '{}'", pluginVersion)
    } catch (e: Exception) {
      try {
        em.transaction.rollback()
      } catch (_: Exception) {}
      logger.error("[CompactPromptLoader] Seed failed", e)
    } finally {
      em.close()
    }
  }

  // region Prompt Manager API — same interface as PromptLoader

  data class CompactRecord(
      val promptKey: String,
      val displayName: String?,
      val category: String?,
      val promptText: String?,
      val originalText: String?,
      val prePrompt: String?,
      val postPrompt: String?,
      val isActive: Boolean,
      val prePromptActive: Boolean = true,
      val postPromptActive: Boolean = true,
      val isSystem: Boolean = false,
      val updateAvailable: Boolean = false,
      val readOnly: Boolean = false
  )

  fun listAllPrompts(em: EntityManager): List<CompactRecord> {
    return queryAll(em)
  }

  fun savePrompt(
      em: EntityManager,
      key: String,
      promptText: String?,
      prePrompt: String?,
      postPrompt: String?,
      isActive: Boolean,
      displayName: String?,
      prePromptActive: Boolean = true,
      postPromptActive: Boolean = true
  ) {
    savePromptInternal(
        em,
        key,
        promptText,
        prePrompt,
        postPrompt,
        isActive,
        displayName,
        prePromptActive,
        postPromptActive)
  }

  fun restoreOriginal(em: EntityManager, key: String) {
    restoreOriginalInternal(em, key)
  }

  fun toggleActive(em: EntityManager, key: String): Boolean {
    return toggleActiveInternal(em, key)
  }

  fun createPrompt(
      em: EntityManager,
      key: String,
      displayName: String?,
      promptText: String,
      category: String?
  ) {
    val ver = System.currentTimeMillis().toString()
    val cat = category ?: key.split(".").firstOrNull() ?: key
    try {
      em.transaction.begin()
      em.createNativeQuery(
              """INSERT INTO $TABLE
               (prompt_key, category, prompt_text, original_text,
                display_name, is_active, pre_prompt_active, post_prompt_active,
                prompt_version, updated_at)
             VALUES (:key, :cat, :txt, :txt, :dn, 1, 1, 1, :ver, CURRENT_TIMESTAMP)""")
          .setParameter("key", key)
          .setParameter("cat", cat)
          .setParameter("txt", promptText)
          .setParameter("dn", displayName)
          .setParameter("ver", ver)
          .executeUpdate()
      em.transaction.commit()
      logger.info("[CompactPromptLoader] Created prompt '{}'", key)
    } catch (e: Exception) {
      try {
        em.transaction.rollback()
      } catch (_: Exception) {}
      logger.warn("[CompactPromptLoader] Failed to create prompt '{}': {}", key, e.message)
      throw e
    }
  }

  fun importPrompt(
      em: EntityManager,
      key: String,
      displayName: String?,
      promptText: String,
      prePrompt: String?,
      postPrompt: String?,
      prePromptActive: Boolean = true,
      postPromptActive: Boolean = true
  ) {
    savePrompt(
        em,
        key,
        promptText,
        prePrompt,
        postPrompt,
        true,
        displayName,
        prePromptActive,
        postPromptActive)
  }

  fun deletePrompt(em: EntityManager, key: String) {
    try {
      em.transaction.begin()
      em.createNativeQuery("DELETE FROM $TABLE WHERE prompt_key = :key")
          .setParameter("key", key)
          .executeUpdate()
      em.transaction.commit()
      logger.info("[CompactPromptLoader] Deleted prompt '{}'", key)
    } catch (e: Exception) {
      try {
        em.transaction.rollback()
      } catch (_: Exception) {}
      logger.warn("[CompactPromptLoader] Failed to delete prompt '{}': {}", key, e.message)
      throw e
    }
  }

  fun renamePrompt(em: EntityManager, oldKey: String, newKey: String, displayName: String? = null) {
    try {
      em.transaction.begin()
      val cat = newKey.split(".").firstOrNull() ?: newKey
      if (displayName != null) {
        em.createNativeQuery(
                """UPDATE $TABLE
               SET prompt_key = :newKey, category = :cat, display_name = :dn,
                   updated_at = CURRENT_TIMESTAMP
               WHERE prompt_key = :oldKey""")
            .setParameter("newKey", newKey)
            .setParameter("cat", cat)
            .setParameter("dn", displayName)
            .setParameter("oldKey", oldKey)
            .executeUpdate()
      } else {
        em.createNativeQuery(
                """UPDATE $TABLE
               SET prompt_key = :newKey, category = :cat, updated_at = CURRENT_TIMESTAMP
               WHERE prompt_key = :oldKey""")
            .setParameter("newKey", newKey)
            .setParameter("cat", cat)
            .setParameter("oldKey", oldKey)
            .executeUpdate()
      }
      em.transaction.commit()
      logger.info("[CompactPromptLoader] Renamed prompt '{}' -> '{}'", oldKey, newKey)
    } catch (e: Exception) {
      try {
        em.transaction.rollback()
      } catch (_: Exception) {}
      logger.warn(
          "[CompactPromptLoader] Failed to rename prompt '{}' -> '{}': {}",
          oldKey,
          newKey,
          e.message)
      throw e
    }
  }

  // endregion

  // region Internal — delegates to PromptLoader helpers (same logic, different table)

  /** Used by the servlet — routes to the correct loader based on view mode. */
  internal fun attemptBulkSeed(em: EntityManager) {
    if (!needsBulkSeedCheck) return
    needsBulkSeedCheck = false
    try {
      val emf = em.entityManagerFactory
      if (emf != null) {
        seedIfNeeded(emf, System.currentTimeMillis().toString())
      }
    } catch (_: Exception) {}
  }

  // region SQL helpers (mirror PromptLoader but use TABLE constant)

  private fun readSeedVersion(em: EntityManager): String? {
    return try {
      val q = em.createNativeQuery("SELECT prompt_text FROM $TABLE WHERE prompt_key = :key")
      q.setParameter("key", SEED_VERSION_KEY)
      val r = q.resultList
      if (r.isEmpty()) null else resolveClob(r[0])
    } catch (_: Exception) {
      null
    }
  }

  private fun upsertSeedVersion(em: EntityManager, version: String) {
    val existing = readSeedVersion(em)
    if (existing != null) {
      em.createNativeQuery(
              "UPDATE $TABLE SET prompt_text = :ver, updated_at = CURRENT_TIMESTAMP WHERE prompt_key = :key")
          .apply {
            setParameter("ver", version)
            setParameter("key", SEED_VERSION_KEY)
          }
          .executeUpdate()
    } else {
      em.createNativeQuery(
              "INSERT INTO $TABLE (prompt_key, category, prompt_text, prompt_version) VALUES (:key, :cat, :text, :ver)")
          .apply {
            setParameter("key", SEED_VERSION_KEY)
            setParameter("cat", "_system")
            setParameter("text", version)
            setParameter("ver", version)
          }
          .executeUpdate()
    }
  }

  private fun upsertPrompt(
      em: EntityManager,
      key: String,
      text: String,
      version: String,
      displayName: String? = null
  ) {
    seededKeys.add(key)
    // Check if prompt exists and whether user has modified it
    val existing =
        try {
          val r =
              em.createNativeQuery(
                      "SELECT prompt_text, original_text FROM $TABLE WHERE prompt_key = :key")
                  .setParameter("key", key)
                  .resultList
          if (r.isEmpty()) null
          else
              (r[0] as? Array<*>)?.let { row ->
                if (row.size >= 2) Pair(resolveClob(row[0]), resolveClob(row[1])) else null
              }
        } catch (_: Exception) {
          null
        }

    if (existing != null) {
      val (dbText, dbOriginal) = existing
      if (dbText != null && dbOriginal != null && dbText != dbOriginal) {
        // A newer version is available when the bundled .md content differs from the stored
        // original snapshot. Surface this via the update_available flag.
        val newerAvailable = dbOriginal != text
        em.createNativeQuery(
                "UPDATE $TABLE SET update_available = :flag, updated_at = CURRENT_TIMESTAMP WHERE prompt_key = :key")
            .apply {
              setParameter("flag", newerAvailable)
              setParameter("key", key)
            }
            .executeUpdate()
        logger.info(
            "[CompactPromptLoader] Prompt '{}' was modified by user — preserving edits (updateAvailable={})",
            key,
            newerAvailable)
        return
      }
      em.createNativeQuery(
              "UPDATE $TABLE SET prompt_text = :text, original_text = :orig, prompt_version = :ver, display_name = :dname, is_system = 1, update_available = 0, updated_at = CURRENT_TIMESTAMP WHERE prompt_key = :key")
          .apply {
            setParameter("text", text)
            setParameter("orig", text)
            setParameter("ver", version)
            setParameter("dname", displayName ?: deriveDisplayName(key))
            setParameter("key", key)
          }
          .executeUpdate()
      logger.info("[CompactPromptLoader] Updated prompt '{}' from seed file", key)
      return
    }

    // New prompt — insert
    val cat = key.substringBefore(".", key)
    val dname = displayName ?: deriveDisplayName(key)
    em.createNativeQuery(
            "INSERT INTO $TABLE (prompt_key, category, prompt_text, prompt_version, original_text, is_active, display_name, pre_prompt_active, post_prompt_active, is_system, update_available) VALUES (:key, :cat, :text, :ver, :orig, :active, :dname, :preAct, :postAct, 1, 0)")
        .apply {
          setParameter("key", key)
          setParameter("cat", cat)
          setParameter("text", text)
          setParameter("ver", version)
          setParameter("orig", text)
          setParameter("active", true)
          setParameter("preAct", true)
          setParameter("postAct", true)
          setParameter("dname", dname)
        }
        .executeUpdate()
    logger.info("[CompactPromptLoader] Inserted new prompt '{}'", key)
  }

  private fun deriveDisplayName(key: String): String =
      key.split(".").joinToString(" ") { part ->
        part.replace("_", " ").split(" ").joinToString(" ") {
          it.replaceFirstChar { c -> c.uppercase() }
        }
      }

  private fun seedSplitFile(
      em: EntityManager,
      baseKey: String,
      content: String,
      version: String,
      fileName: String
  ) {
    val lines = content.lines()
    val headerBuilder = StringBuilder()
    var currentSection: String? = null
    val currentBody = StringBuilder()
    val sections = mutableListOf<Pair<String, String>>()

    for (line in lines) {
      val trimmed = line.trimStart()
      if (trimmed.startsWith("## ")) {
        if (currentSection != null) sections.add(currentSection!! to currentBody.toString().trim())
        currentBody.clear()
        val ht = trimmed.removePrefix("## ").trim()
        if (ht.uppercase().startsWith("GENERIC")) {
          currentSection = null
          headerBuilder.append("\n").append(line).append("\n")
        } else currentSection = ht
      } else if (currentSection != null) currentBody.append(line).append("\n")
      else headerBuilder.append(line).append("\n")
    }
    if (currentSection != null) sections.add(currentSection!! to currentBody.toString().trim())

    val parent = headerBuilder.toString().trim()
    if (parent.isNotBlank()) {
      upsertPrompt(em, baseKey, parent, version)
    }
    for ((name, body) in sections) {
      if (body.isBlank()) continue
      val itemKey =
          "$baseKey.${name.lowercase().replace(Regex("[^a-z0-9_]"), "_").replace(Regex("_+"), "_").trim('_')}"

      // Check for ### sub-headers within this section
      val subLines = body.lines()
      val subSections = mutableListOf<Pair<String, String>>()
      var currentSub: String? = null
      val subBody = StringBuilder()

      for (line in subLines) {
        val t = line.trimStart()
        if (t.startsWith("### ")) {
          if (currentSub != null) {
            subSections.add(currentSub!! to subBody.toString().trim())
            subBody.clear()
          }
          currentSub = t.removePrefix("### ").trim()
        } else if (currentSub != null) {
          subBody.append(line).append("\n")
        }
      }
      if (currentSub != null) {
        subSections.add(currentSub!! to subBody.toString().trim())
      }

      if (subSections.isNotEmpty()) {
        val sectionMainBody =
            subLines.takeWhile { !it.trimStart().startsWith("### ") }.joinToString("\n").trim()
        if (sectionMainBody.isNotBlank()) {
          upsertPrompt(em, itemKey, sectionMainBody, version)
          logger.info(
              "[CompactPromptLoader] Upserted section '{}' ({} sub-items)",
              itemKey,
              subSections.size)
        }
        for ((subName, subContent) in subSections) {
          if (subContent.isBlank()) continue
          val subKey =
              "$itemKey.${subName.lowercase().replace(Regex("[^a-z0-9_]"), "_").replace(Regex("_+"), "_").trim('_')}"
          // Preserve the original ### header as the display name so the tree shows the exact
          // condensed element name (e.g. "AI.LLAMA.CHAT", "BayVIS.Behoerden.ID").
          upsertPrompt(em, subKey, subContent, version, displayName = subName.trim())
          logger.info("[CompactPromptLoader] Upserted sub-item '{}'", subKey)
        }
      } else {
        upsertPrompt(em, itemKey, body, version)
        logger.info("[CompactPromptLoader] Upserted '{}' from '{}'", itemKey, fileName)
      }
    }
  }

  private fun queryAll(em: EntityManager): List<CompactRecord> {
    return try {
      val q =
          em.createNativeQuery(
              "SELECT prompt_key, display_name, category, prompt_text, original_text, pre_prompt, post_prompt, is_active, pre_prompt_active, post_prompt_active, is_system, update_available FROM $TABLE WHERE prompt_key != :skip ORDER BY category, prompt_key")
      q.setParameter("skip", SEED_VERSION_KEY)
      @Suppress("UNCHECKED_CAST")
      (q.resultList as? List<Array<Any>>)?.mapNotNull { row ->
        if (row.size < 12) return@mapNotNull null
        CompactRecord(
            promptKey = row[0]?.toString() ?: return@mapNotNull null,
            displayName = row[1]?.toString(),
            category = row[2]?.toString(),
            promptText = resolveClob(row[3]),
            originalText = resolveClob(row[4]),
            prePrompt = resolveClob(row[5]),
            postPrompt = resolveClob(row[6]),
            isActive = row[7]?.toString() == "true" || row[7]?.toString() == "1",
            prePromptActive = row[8]?.toString() == "true" || row[8]?.toString() == "1",
            postPromptActive = row[9]?.toString() == "true" || row[9]?.toString() == "1",
            isSystem = row[10]?.toString() == "true" || row[10]?.toString() == "1",
            updateAvailable = row[11]?.toString() == "true" || row[11]?.toString() == "1")
      } ?: emptyList()
    } catch (e: Exception) {
      logger.warn("[CompactPromptLoader] Failed to list: {}", e.message)
      emptyList()
    }
  }

  /**
   * Loads all active compact prompts whose key starts with [prefix] as a map of key → text. Used to
   * read the condensed workflow-nodes reference (and any other compact category) from the database
   * so the AI's pass-1 prompt is DB-driven.
   */
  internal fun loadCategory(em: EntityManager, prefix: String): Map<String, String> {
    return try {
      val q =
          em.createNativeQuery(
              "SELECT prompt_key, prompt_text FROM $TABLE " +
                  "WHERE prompt_key LIKE :prefix AND is_active = 1 ORDER BY prompt_key")
      q.setParameter("prefix", "$prefix%")
      @Suppress("UNCHECKED_CAST")
      (q.resultList as? List<Array<Any>>)
          ?.mapNotNull { row ->
            if (row.size < 2) return@mapNotNull null
            val key = row[0]?.toString() ?: return@mapNotNull null
            val text = resolveClob(row[1]) ?: return@mapNotNull null
            key to text
          }
          ?.toMap() ?: emptyMap()
    } catch (e: Exception) {
      logger.warn(
          "[CompactPromptLoader] Failed to load compact category '{}': {}", prefix, e.message)
      emptyMap()
    }
  }

  /**
   * Loads all active compact prompts whose key starts with [prefix] as [CompactRecord]s (including
   * display names). Used to rebuild a condensed section (element names + descriptions) from the
   * database so that deactivating a compact prompt removes it from the AI's pass-1 reference.
   */
  internal fun loadCategoryRecords(em: EntityManager, prefix: String): List<CompactRecord> {
    return try {
      val q =
          em.createNativeQuery(
              "SELECT prompt_key, display_name, category, prompt_text, original_text, pre_prompt, post_prompt, is_active, pre_prompt_active, post_prompt_active, is_system, update_available FROM $TABLE WHERE prompt_key LIKE :prefix AND is_active = 1 ORDER BY prompt_key")
      q.setParameter("prefix", "$prefix%")
      @Suppress("UNCHECKED_CAST")
      (q.resultList as? List<Array<Any>>)?.mapNotNull { row ->
        if (row.size < 12) return@mapNotNull null
        CompactRecord(
            promptKey = row[0]?.toString() ?: return@mapNotNull null,
            displayName = row[1]?.toString(),
            category = row[2]?.toString(),
            promptText = resolveClob(row[3]),
            originalText = resolveClob(row[4]),
            prePrompt = resolveClob(row[5]),
            postPrompt = resolveClob(row[6]),
            isActive = row[7]?.toString() == "true" || row[7]?.toString() == "1",
            prePromptActive = row[8]?.toString() == "true" || row[8]?.toString() == "1",
            postPromptActive = row[9]?.toString() == "true" || row[9]?.toString() == "1",
            isSystem = row[10]?.toString() == "true" || row[10]?.toString() == "1",
            updateAvailable = row[11]?.toString() == "true" || row[11]?.toString() == "1")
      } ?: emptyList()
    } catch (e: Exception) {
      logger.warn(
          "[CompactPromptLoader] Failed to load compact category records '{}': {}",
          prefix,
          e.message)
      emptyList()
    }
  }

  private fun savePromptInternal(
      em: EntityManager,
      key: String,
      promptText: String?,
      prePrompt: String?,
      postPrompt: String?,
      isActive: Boolean,
      displayName: String?,
      prePromptActive: Boolean = true,
      postPromptActive: Boolean = true
  ) {
    val ver = System.currentTimeMillis().toString()
    try {
      em.transaction.begin()
      val sql =
          if (promptText != null)
              "UPDATE $TABLE SET prompt_text = :text, pre_prompt = :pre, post_prompt = :post, is_active = :active, display_name = :dname, prompt_version = :ver, pre_prompt_active = :preAct, post_prompt_active = :postAct, update_available = 0, updated_at = CURRENT_TIMESTAMP WHERE prompt_key = :key"
          else
              "UPDATE $TABLE SET pre_prompt = :pre, post_prompt = :post, is_active = :active, display_name = :dname, prompt_version = :ver, pre_prompt_active = :preAct, post_prompt_active = :postAct, update_available = 0, updated_at = CURRENT_TIMESTAMP WHERE prompt_key = :key"
      val u = em.createNativeQuery(sql)
      if (promptText != null) u.setParameter("text", promptText)
      u.setParameter("pre", prePrompt)
          .setParameter("post", postPrompt)
          .setParameter("active", isActive)
          .setParameter("preAct", prePromptActive)
          .setParameter("postAct", postPromptActive)
          .setParameter("dname", displayName)
          .setParameter("ver", ver)
          .setParameter("key", key)
          .executeUpdate()
      em.transaction.commit()
    } catch (e: Exception) {
      try {
        em.transaction.rollback()
      } catch (_: Exception) {}
      logger.warn("[CompactPromptLoader] Save failed: {}", e.message)
      throw e
    }
  }

  private fun restoreOriginalInternal(em: EntityManager, key: String) {
    try {
      em.transaction.begin()
      val newest = resolveNewestSeedContent(key)
      if (newest != null) {
        em.createNativeQuery(
                "UPDATE $TABLE SET prompt_text = :text, original_text = :text, prompt_version = :ver, update_available = 0, updated_at = CURRENT_TIMESTAMP WHERE prompt_key = :key")
            .setParameter("text", newest)
            .setParameter("ver", System.currentTimeMillis().toString())
            .setParameter("key", key)
            .executeUpdate()
        logger.info(
            "[CompactPromptLoader] Restored '{}' to newest bundled version ({} chars)",
            key,
            newest.length)
      } else {
        em.createNativeQuery(
                "UPDATE $TABLE SET prompt_text = original_text, prompt_version = :ver, update_available = 0, updated_at = CURRENT_TIMESTAMP WHERE prompt_key = :key AND original_text IS NOT NULL")
            .setParameter("ver", System.currentTimeMillis().toString())
            .setParameter("key", key)
            .executeUpdate()
        logger.info("[CompactPromptLoader] Restored '{}' to stored original snapshot", key)
      }
      em.transaction.commit()
    } catch (e: Exception) {
      try {
        em.transaction.rollback()
      } catch (_: Exception) {}
      logger.warn("[CompactPromptLoader] Restore failed: {}", e.message)
      throw e
    }
  }

  private fun toggleActiveInternal(em: EntityManager, key: String): Boolean {
    val cur =
        try {
          val r =
              em.createNativeQuery("SELECT is_active FROM $TABLE WHERE prompt_key = :key")
                  .setParameter("key", key)
                  .resultList
          if (r.isEmpty()) return false
          r[0]?.toString() == "true" || r[0]?.toString() == "1"
        } catch (_: Exception) {
          false
        }
    val nv = !cur
    try {
      em.transaction.begin()
      em.createNativeQuery(
              "UPDATE $TABLE SET is_active = :a, updated_at = CURRENT_TIMESTAMP WHERE prompt_key = :key")
          .setParameter("a", nv)
          .setParameter("key", key)
          .executeUpdate()
      em.transaction.commit()
    } catch (e: Exception) {
      try {
        em.transaction.rollback()
      } catch (_: Exception) {}
      logger.warn("[CompactPromptLoader] Toggle failed: {}", e.message)
    }
    return nv
  }

  private fun resolveClob(value: Any?): String? {
    if (value == null) return null
    return when (value) {
      is String -> value.trim().ifBlank { null }
      is java.sql.Clob ->
          try {
            val r = value.characterStream ?: return null
            java.io.BufferedReader(r).readText().trim().ifBlank { null }
          } catch (_: Exception) {
            null
          }
      else -> value.toString().trim().ifBlank { null }
    }
  }

  private fun loadResourceFile(path: String): String? {
    return try {
      val s = CompactPromptLoader::class.java.classLoader.getResourceAsStream(path) ?: return null
      s.bufferedReader(Charsets.UTF_8).use { it.readText() }.trim()
    } catch (e: Exception) {
      logger.warn("[CompactPromptLoader] Failed to load '{}': {}", path, e.message)
      null
    }
  }

  /**
   * Reconstructs the per-key seed content for every prompt that would be seeded from a file,
   * mirroring the `##`/`###` section splitting of [seedSplitFile] without touching the DB.
   */
  private fun seedContentMap(baseKey: String, content: String): Map<String, String> {
    val result = mutableMapOf<String, String>()
    val lines = content.lines()
    val headerBuilder = StringBuilder()
    val sections = mutableListOf<Pair<String, String>>()
    var currentSection: String? = null
    val currentBody = StringBuilder()

    for (line in lines) {
      val trimmed = line.trimStart()
      if (trimmed.startsWith("## ")) {
        if (currentSection != null) {
          sections.add(currentSection!! to currentBody.toString().trim())
          currentBody.clear()
        }
        val ht = trimmed.removePrefix("## ").trim()
        if (ht.uppercase().startsWith("GENERIC")) {
          currentSection = null
          headerBuilder.append("\n").append(line).append("\n")
        } else {
          currentSection = ht
        }
      } else if (currentSection != null) {
        currentBody.append(line).append("\n")
      } else {
        headerBuilder.append(line).append("\n")
      }
    }
    if (currentSection != null) sections.add(currentSection!! to currentBody.toString().trim())

    val parent = headerBuilder.toString().trim()
    if (parent.isNotBlank()) result[baseKey] = parent

    for ((name, body) in sections) {
      if (body.isBlank()) continue
      val itemKey =
          "$baseKey.${name.lowercase().replace(Regex("[^a-z0-9_]"), "_").replace(Regex("_+"), "_").trim('_')}"

      val subLines = body.lines()
      val subSections = mutableListOf<Pair<String, String>>()
      var currentSub: String? = null
      val subBody = StringBuilder()
      for (line in subLines) {
        val t = line.trimStart()
        if (t.startsWith("### ")) {
          if (currentSub != null) {
            subSections.add(currentSub!! to subBody.toString().trim())
            subBody.clear()
          }
          currentSub = t.removePrefix("### ").trim()
        } else if (currentSub != null) {
          subBody.append(line).append("\n")
        }
      }
      if (currentSub != null) subSections.add(currentSub!! to subBody.toString().trim())

      if (subSections.isNotEmpty()) {
        val sectionMainBody =
            subLines.takeWhile { !it.trimStart().startsWith("### ") }.joinToString("\n").trim()
        if (sectionMainBody.isNotBlank()) result[itemKey] = sectionMainBody
        for ((subName, subContent) in subSections) {
          if (subContent.isBlank()) continue
          result[
              "$itemKey.${subName.lowercase().replace(Regex("[^a-z0-9_]"), "_").replace(Regex("_+"), "_").trim('_')}"] =
              subContent
        }
      } else {
        result[itemKey] = body
      }
    }
    return result
  }

  /** Loads the newest bundled seed content for a given [key] from the classpath .md resources. */
  private fun resolveNewestSeedContent(key: String): String? {
    for ((resourcePath, baseKey) in SEED_FILES) {
      if (key != baseKey && !key.startsWith("$baseKey.")) continue
      val content = loadResourceFile(resourcePath) ?: continue
      val newest = seedContentMap(baseKey, content)[key] ?: continue
      return newest
    }
    return null
  }

  // endregion
}
