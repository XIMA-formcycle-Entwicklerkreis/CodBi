package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.GsonBuilder
import javax.persistence.EntityManager
import javax.persistence.EntityManagerFactory
import org.slf4j.LoggerFactory

/**
 * Service that seeds/loads **compact** AI system prompts from the `codbi-core-elements-compact.md`
 * and `codbi-core-api-compact.md` classpath resources into the [codbi_compact_prompt] database
 * table. Mirrors the structure of [PromptLoader] but uses a separate table.
 *
 * ## Seed sources
 * 1. `codbi-core-elements-compact.md` → base key `compact.elements` (3 `##` sections)
 * 2. `codbi-core-api-compact.md` → base key `compact.api` (5 `##` sections)
 *
 * Each `##` section becomes an individual prompt record with a key like
 * `compact.elements.functionalities` or `compact.api.workflow_nodes`.
 */
internal object CompactPromptLoader {

  private val logger = LoggerFactory.getLogger(CompactPromptLoader::class.java)
  private val gson = GsonBuilder().create()
  private var needsBulkSeedCheck = true

  /** Base classpath resource directory. */
  private const val RESOURCE_BASE = "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/"

  /** The two compact prompt source files (path → base key). */
  private val SEED_FILES =
      mapOf(
          "${RESOURCE_BASE}codbi-core-elements-compact.md" to "compact.elements",
          "${RESOURCE_BASE}codbi-core-api-compact.md" to "compact.api")

  /** DB table name. */
  private const val TABLE = "codbi_compact_prompt"

  /** Seed version marker key. */
  private const val SEED_VERSION_KEY = "_seed_version"

  // region Seed

  /** Seeds / updates all compact prompts from classpath resources. */
  fun seedIfNeeded(emf: EntityManagerFactory, pluginVersion: String) {
    val em = emf.createEntityManager()
    try {
      em.transaction.begin()
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
      val isActive: Boolean
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
      displayName: String?
  ) {
    savePromptInternal(em, key, promptText, prePrompt, postPrompt, isActive, displayName)
  }

  fun restoreOriginal(em: EntityManager, key: String) {
    restoreOriginalInternal(em, key)
  }

  fun toggleActive(em: EntityManager, key: String): Boolean {
    return toggleActiveInternal(em, key)
  }

  fun importPrompt(
      em: EntityManager,
      key: String,
      displayName: String?,
      promptText: String,
      prePrompt: String?,
      postPrompt: String?
  ) {
    savePrompt(em, key, promptText, prePrompt, postPrompt, true, displayName)
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

  private fun upsertPrompt(em: EntityManager, key: String, text: String, version: String) {
    em.createNativeQuery("DELETE FROM $TABLE WHERE prompt_key = :key")
        .setParameter("key", key)
        .executeUpdate()
    val cat = key.substringBefore(".", key)
    val dname = deriveDisplayName(key)
    em.createNativeQuery(
            "INSERT INTO $TABLE (prompt_key, category, prompt_text, prompt_version, original_text, is_active, display_name) VALUES (:key, :cat, :text, :ver, :orig, :active, :dname)")
        .apply {
          setParameter("key", key)
          setParameter("cat", cat)
          setParameter("text", text)
          setParameter("ver", version)
          setParameter("orig", text)
          setParameter("active", true)
          setParameter("dname", dname)
        }
        .executeUpdate()
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
      upsertPrompt(em, itemKey, body, version)
      logger.info("[CompactPromptLoader] Upserted '{}' from '{}'", itemKey, fileName)
    }
  }

  private fun queryAll(em: EntityManager): List<CompactRecord> {
    return try {
      val q =
          em.createNativeQuery(
              "SELECT prompt_key, display_name, category, prompt_text, original_text, pre_prompt, post_prompt, is_active FROM $TABLE WHERE prompt_key != :skip ORDER BY category, prompt_key")
      q.setParameter("skip", SEED_VERSION_KEY)
      @Suppress("UNCHECKED_CAST")
      (q.resultList as? List<Array<Any>>)?.mapNotNull { row ->
        if (row.size < 8) return@mapNotNull null
        CompactRecord(
            promptKey = row[0]?.toString() ?: return@mapNotNull null,
            displayName = row[1]?.toString(),
            category = row[2]?.toString(),
            promptText = resolveClob(row[3]),
            originalText = resolveClob(row[4]),
            prePrompt = resolveClob(row[5]),
            postPrompt = resolveClob(row[6]),
            isActive = row[7]?.toString() == "true" || row[7]?.toString() == "1")
      } ?: emptyList()
    } catch (e: Exception) {
      logger.warn("[CompactPromptLoader] Failed to list: {}", e.message)
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
      displayName: String?
  ) {
    val ver = System.currentTimeMillis().toString()
    try {
      em.transaction.begin()
      val sql =
          if (promptText != null)
              "UPDATE $TABLE SET prompt_text = :text, pre_prompt = :pre, post_prompt = :post, is_active = :active, display_name = :dname, prompt_version = :ver, updated_at = CURRENT_TIMESTAMP WHERE prompt_key = :key"
          else
              "UPDATE $TABLE SET pre_prompt = :pre, post_prompt = :post, is_active = :active, display_name = :dname, prompt_version = :ver, updated_at = CURRENT_TIMESTAMP WHERE prompt_key = :key"
      val u = em.createNativeQuery(sql)
      if (promptText != null) u.setParameter("text", promptText)
      u.setParameter("pre", prePrompt)
          .setParameter("post", postPrompt)
          .setParameter("active", isActive)
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
      em.createNativeQuery(
              "UPDATE $TABLE SET prompt_text = original_text, prompt_version = :ver, updated_at = CURRENT_TIMESTAMP WHERE prompt_key = :key AND original_text IS NOT NULL")
          .setParameter("ver", System.currentTimeMillis().toString())
          .setParameter("key", key)
          .executeUpdate()
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

  // endregion
}
