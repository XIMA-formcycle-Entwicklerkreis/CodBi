package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.google.gson.GsonBuilder
import com.google.gson.reflect.TypeToken
import javax.persistence.EntityManager
import javax.persistence.EntityManagerFactory
import org.slf4j.LoggerFactory

/**
 * Service that seeds AI system prompts from classpath resource files into the [codbi_ai_prompt]
 * database table on plugin install/update, and loads them at runtime for the AI assistants.
 *
 * ## Seed flow
 * 1. [seedIfNeeded] is called from [CodbiEntities.onDatabaseReady] on every plugin startup.
 * 2. It reads a `_seed_version` marker row from the DB.
 * 3. If the stored version differs from the current plugin version (or no rows exist yet), all
 *    `.md` resource files listed in `index.json` are read from the classpath and upserted into the
 *    `codbi_ai_prompt` table.
 * 4. The `_seed_version` marker is updated to the current plugin version.
 *
 * ## Runtime loading
 * - [loadPrompt] loads a single prompt by its key.
 * - [loadCategory] loads all prompts whose key starts with a given prefix (e.g. `"formcycle"`).
 * - [resolvePlaceholders] replaces `{{CODBI_ELEMENTS_SECTION}}` and `{{CODBI_FULL_SECTION}}` with
 *   live content from [CodbiCapabilities].
 */
internal object PromptLoader {

  private val logger = LoggerFactory.getLogger(PromptLoader::class.java)
  private val gson = GsonBuilder().create()

  /**
   * Per-classloader flag. On cold start, [CodbiEntities.onDatabaseReady] runs [seedIfNeeded] before
   * any request. On hot deploy, the new classloader resets this to `true`, so the first
   * [loadPrompt] or [loadCategory] call will attempt a bulk seed using the already-available
   * [EntityManager] to obtain the [EntityManagerFactory].
   */
  private var needsBulkSeedCheck = true

  /** Classpath resource directory for prompt .md files. */
  private const val PROMPT_RESOURCE_BASE =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/"

  /** Manifest file that maps .md files to DB keys. */
  private const val INDEX_RESOURCE = "${PROMPT_RESOURCE_BASE}index.json"

  /** Special DB key used to track which plugin version seeded the prompts. */
  internal const val SEED_VERSION_KEY = "_seed_version"

  /** DB key for the formcycle general category. */
  const val KEY_FORMCYCLE_GENERAL = "formcycle.general"
  /** DB key for the formcycle widgets category. */
  const val KEY_FORMCYCLE_WIDGETS = "formcycle.widgets"
  /** DB key for the formcycle workflow nodes category. */
  const val KEY_FORMCYCLE_WORKFLOW_NODES = "formcycle.workflow_nodes"
  /** DB key for the codbi functionalities category. */
  const val KEY_CODBI_FUNCTIONALITIES = "codbi.functionalities"
  /** DB key for the codbi element placeholders category. */
  const val KEY_CODBI_ELEMENT_PLACEHOLDERS = "codbi.element_placeholders"
  /** DB key for the codbi standard configurations category. */
  const val KEY_CODBI_STANDARD_CONFIGURATIONS = "codbi.standard_configurations"
  /** DB key for the codbi general category. */
  const val KEY_CODBI_GENERAL = "codbi.general"

  /**
   * Placeholder in resource files that gets replaced with the output of
   * [CodbiCapabilities.buildSection] (elements-only reference).
   */
  private const val PLACEHOLDER_ELEMENTS_SECTION = "{{CODBI_ELEMENTS_SECTION}}"

  /**
   * Placeholder in resource files that gets replaced with the output of
   * [CodbiCapabilities.buildFullSection] (full compact API reference).
   */
  private const val PLACEHOLDER_FULL_SECTION = "{{CODBI_FULL_SECTION}}"

  /**
   * Seeds / updates all prompts from classpath resources into the database. Called from
   * [CodbiEntities.onDatabaseReady] on every plugin startup.
   *
   * @param emf The JPA [EntityManagerFactory] (must be ready).
   * @param pluginVersion The current plugin version (e.g. `"1.2.3"`).
   */
  fun seedIfNeeded(emf: EntityManagerFactory, pluginVersion: String) {
    val em = emf.createEntityManager()
    try {
      em.transaction.begin()

      val storedVersion = readSeedVersion(em)
      if (storedVersion == pluginVersion) {
        logger.info(
            "[PromptLoader] Prompts already seeded at version '{}' — skipping", storedVersion)
        em.transaction.commit()
        return
      }

      logger.info(
          "[PromptLoader] Seeding/updating prompts (stored='{}', current='{}')",
          storedVersion ?: "<none>",
          pluginVersion)

      val index = loadIndex()
      if (index == null) {
        logger.warn("[PromptLoader] index.json not found — skipping seed")
        em.transaction.commit()
        return
      }

      for (entry in index) {
        val file = entry["file"] as? String ?: continue
        val key = entry["key"] as? String ?: continue
        val content = loadResourceFile(file)
        if (content == null) {
          logger.warn("[PromptLoader] Resource file '{}' not found — skipping key '{}'", file, key)
          continue
        }
        // Files with ## section headers are split into individual items;
        // files without ## are upserted as a single prompt.
        if (content.contains("\n## ")) {
          seedSplitFile(em, key, content, pluginVersion, file)
        } else {
          upsertPrompt(em, key, content, pluginVersion)
          logger.info("[PromptLoader] Upserted prompt '{}' from '{}'", key, file)
        }
      }

      upsertSeedVersion(em, pluginVersion)
      em.transaction.commit()
      logger.info("[PromptLoader] Seed complete for version '{}'", pluginVersion)
    } catch (e: Exception) {
      try {
        em.transaction.rollback()
      } catch (_: Exception) {}
      logger.error("[PromptLoader] Seed failed", e)
    } finally {
      em.close()
    }
  }

  /**
   * Loads a single prompt by its [key] from the database. If the key is not found in the DB,
   * attempts to auto-seed it from the classpath resource files (via [index.json]). This ensures
   * prompts are available even when the full [seedIfNeeded] hasn't run yet (e.g. during hot deploy
   * before EMF is available). Returns `null` if the key is not found and cannot be auto-seeded.
   */
  fun loadPrompt(em: EntityManager, key: String): String? {
    // On hot deploy: attempt bulk seed so ALL prompts are seeded, not just this one key
    attemptBulkSeed(em)

    // First try: load from DB (only active prompts — pre_prompt + prompt_text + post_prompt)
    val dbResult =
        try {
          val query =
              em.createNativeQuery(
                  // language=H2
                  """SELECT COALESCE(pre_prompt, '') || prompt_text || COALESCE(post_prompt, '')
                     FROM codbi_ai_prompt
                     WHERE prompt_key = :key AND is_active = TRUE""")
          query.setParameter("key", key)
          val result = query.resultList
          if (result.isEmpty()) null else resolveClob(result[0])
        } catch (e: Exception) {
          logger.warn("[PromptLoader] Failed to load prompt '{}': {}", key, e.message)
          null
        }
    if (dbResult != null) return dbResult

    // Not found in DB — try to auto-seed this specific key from classpath resources
    val entry = findIndexEntryByKey(key) ?: return null
    val content = loadResourceFile(entry) ?: return null
    return try {
      val version = System.currentTimeMillis().toString()
      em.transaction.begin()
      upsertPrompt(em, key, content, version)
      em.transaction.commit()
      logger.info("[PromptLoader] Auto-seeded missing prompt '{}' from '{}'", key, entry)
      content
    } catch (e: Exception) {
      logger.warn("[PromptLoader] Failed to auto-seed prompt '{}': {}", key, e.message)
      null
    }
  }

  /**
   * Loads all prompts whose key starts with the given [prefix].
   *
   * If no prompts are found in the database for this prefix (e.g. during a hot deploy before the
   * full [seedIfNeeded] has run), iterates [index.json] for all entries whose key starts with the
   * prefix, loads them from the classpath `.md` files, and upserts each into the database before
   * returning. This makes category loading self-healing on hot deploy.
   *
   * Returns a map of prompt_key → prompt_text.
   */
  fun loadCategory(em: EntityManager, prefix: String): Map<String, String> {
    // On hot deploy: attempt bulk seed so ALL prompts are seeded, not just this category
    attemptBulkSeed(em)

    // First try: load from DB
    val fromDb = queryCategory(em, prefix)
    if (fromDb.isNotEmpty()) return fromDb

    // Not found in DB — try to auto-seed all entries matching this prefix from index.json
    logger.info("[PromptLoader] Category '{}' not found in DB — attempting auto-seed", prefix)
    val index = loadIndex() ?: return emptyMap()
    val toUpsert = index.filter { entry -> (entry["key"] as? String)?.startsWith(prefix) == true }

    if (toUpsert.isEmpty()) {
      logger.warn("[PromptLoader] No index.json entries match prefix '{}'", prefix)
      return emptyMap()
    }

    val version = System.currentTimeMillis().toString()
    var seeded = 0
    try {
      em.transaction.begin()
      for (entry in toUpsert) {
        val key = entry["key"] as? String ?: continue
        val file = entry["file"] as? String ?: continue
        val content = loadResourceFile(file)
        if (content == null) {
          logger.warn(
              "[PromptLoader] Resource file '{}' not found — skipping auto-seed for '{}'",
              file,
              key)
          continue
        }
        upsertPrompt(em, key, content, version)
        seeded++
        logger.info("[PromptLoader] Auto-seeded missing prompt '{}' from '{}'", key, file)
      }
      em.transaction.commit()
    } catch (e: Exception) {
      logger.warn("[PromptLoader] Failed to auto-seed category '{}': {}", prefix, e.message)
      return emptyMap()
    }

    if (seeded == 0) return emptyMap()

    // Re-query and return
    return queryCategory(em, prefix)
  }

  /**
   * Queries the database for all **active** prompts whose key starts with the given [prefix].
   * Returns a map of prompt_key → pre_prompt + prompt_text + post_prompt (may be empty).
   */
  private fun queryCategory(em: EntityManager, prefix: String): Map<String, String> {
    return try {
      val query =
          em.createNativeQuery(
              // language=H2
              """SELECT prompt_key,
                        COALESCE(pre_prompt, '') || prompt_text || COALESCE(post_prompt, '')
                 FROM codbi_ai_prompt
                 WHERE prompt_key LIKE :prefix AND is_active = TRUE
                 ORDER BY prompt_key""")
      query.setParameter("prefix", "$prefix%")
      @Suppress("UNCHECKED_CAST")
      val rows = query.resultList as? List<Array<Any>> ?: return emptyMap()
      rows
          .mapNotNull { row ->
            if (row.size >= 2) {
              val key = row[0]?.toString() ?: return@mapNotNull null
              val text = resolveClob(row[1]) ?: return@mapNotNull null
              key to text
            } else null
          }
          .toMap()
    } catch (e: Exception) {
      logger.warn("[PromptLoader] Failed to query category '{}': {}", prefix, e.message)
      emptyMap()
    }
  }

  /**
   * On hot deploy, the new classloader resets [needsBulkSeedCheck] to `true`. The first
   * [loadPrompt] or [loadCategory] call triggers a bulk seed attempt here, using the
   * already-available [EntityManager] to obtain the [EntityManagerFactory]. This ensures ALL
   * prompts listed in `index.json` are seeded, not just the one being accessed. On cold start,
   * [CodbiEntities.onDatabaseReady] already ran [seedIfNeeded], so this is typically a no-op
   * (checks version and skips).
   */
  private fun attemptBulkSeed(em: EntityManager) {
    if (!needsBulkSeedCheck) return
    needsBulkSeedCheck = false

    try {
      val emf = em.entityManagerFactory
      if (emf != null) {
        val version = System.currentTimeMillis().toString()
        logger.info(
            "[PromptLoader] Bulk seed check triggered — calling seedIfNeeded (version={})", version)
        seedIfNeeded(emf, version)
      } else {
        logger.warn(
            "[PromptLoader] Cannot run bulk seed — EntityManagerFactory not available from EntityManager")
      }
    } catch (e: Exception) {
      logger.warn("[PromptLoader] Bulk seed attempt failed: {}", e.message)
    }
  }

  /**
   * Replaces dynamic placeholders in [text] with live content from [CodbiCapabilities].
   * - `{{CODBI_ELEMENTS_SECTION}}` → [CodbiCapabilities.buildSection]
   * - `{{CODBI_FULL_SECTION}}` → [CodbiCapabilities.buildFullSection]
   *
   * Additional placeholders can be passed via [extraReplacements].
   */
  fun resolvePlaceholders(
      text: String,
      extraReplacements: Map<String, String> = emptyMap()
  ): String {
    var result = text
    result = result.replace(PLACEHOLDER_ELEMENTS_SECTION, CodbiCapabilities.buildSection())
    result = result.replace(PLACEHOLDER_FULL_SECTION, CodbiCapabilities.buildFullSection())
    for ((key, value) in extraReplacements) {
      result = result.replace("{{${key}}}", value)
    }
    return result
  }

  // region Internal helpers

  /**
   * Safely resolves a value from a native-query result row to a trimmed [String]. Handles both
   * plain [String] and [java.sql.Clob] values — Hibernate returns Clob objects for CLOB columns via
   * native queries. Returns `null` for null/empty input.
   */
  private fun resolveClob(value: Any?): String? {
    if (value == null) return null
    return when (value) {
      is String -> value.trim().ifBlank { null }
      is java.sql.Clob -> {
        try {
          val reader = value.characterStream ?: return null
          java.io.BufferedReader(reader).readText().trim().ifBlank { null }
        } catch (_: Exception) {
          null
        }
      }
      else -> value.toString().trim().ifBlank { null }
    }
  }

  /** Reads the `_seed_version` marker row, or `null` if the table is empty / not yet seeded. */
  private fun readSeedVersion(em: EntityManager): String? {
    return try {
      val query =
          em.createNativeQuery("SELECT prompt_text FROM codbi_ai_prompt WHERE prompt_key = :key")
      query.setParameter("key", SEED_VERSION_KEY)
      val result = query.resultList
      if (result.isEmpty()) null else resolveClob(result[0])
    } catch (_: Exception) {
      null
    }
  }

  /** Upserts or inserts the seed-version marker. */
  private fun upsertSeedVersion(em: EntityManager, version: String) {
    val existing = readSeedVersion(em)
    if (existing != null) {
      val update =
          em.createNativeQuery(
              "UPDATE codbi_ai_prompt SET prompt_text = :version, updated_at = CURRENT_TIMESTAMP WHERE prompt_key = :key")
      update.setParameter("version", version)
      update.setParameter("key", SEED_VERSION_KEY)
      update.executeUpdate()
    } else {
      val insert =
          em.createNativeQuery(
              "INSERT INTO codbi_ai_prompt (prompt_key, category, prompt_text, prompt_version) VALUES (:key, :cat, :text, :ver)")
      insert.setParameter("key", SEED_VERSION_KEY)
      insert.setParameter("cat", "_system")
      insert.setParameter("text", version)
      insert.setParameter("ver", version)
      insert.executeUpdate()
    }
  }

  /** Upserts a prompt row. Uses vendor-neutral merge strategy (DELETE + INSERT). */
  private fun upsertPrompt(em: EntityManager, key: String, text: String, version: String) {
    val delete = em.createNativeQuery("DELETE FROM codbi_ai_prompt WHERE prompt_key = :key")
    delete.setParameter("key", key)
    delete.executeUpdate()

    val category = key.substringBefore(".", key)
    val displayName = deriveDisplayName(key)
    val insert =
        em.createNativeQuery(
            // language=H2
            """INSERT INTO codbi_ai_prompt
               (prompt_key, category, prompt_text, prompt_version, original_text, is_active, display_name)
               VALUES (:key, :cat, :text, :ver, :orig, :active, :dname)""")
    insert.setParameter("key", key)
    insert.setParameter("cat", category)
    insert.setParameter("text", text)
    insert.setParameter("ver", version)
    insert.setParameter("orig", text)
    insert.setParameter("active", true)
    insert.setParameter("dname", displayName)
    insert.executeUpdate()
  }

  /**
   * Derives a human-readable display name from a prompt key. E.g. "formcycle.workflow_nodes" →
   * "Formcycle Workflow Nodes".
   */
  private fun deriveDisplayName(key: String): String {
    return key.split(".").joinToString(" ") { part ->
      part.replace("_", " ").split(" ").joinToString(" ") { word ->
        word.replaceFirstChar { it.uppercase() }
      }
    }
  }

  /**
   * Splits a resource file containing `##` section headers into individual prompt records.
   *
   * Content before the first `##` is stored under [baseKey] as the category-level prompt. Each `##`
   * section block is stored under a sub-key like `baseKey.section_name`. `## GENERIC` / `## GENERIC
   * RULE` sections are treated as part of the parent prompt (appended to the base content).
   *
   * The section name is derived from the `##` header line — lowercased, spaces/slashes replaced
   * with underscores, special chars removed.
   */
  private fun seedSplitFile(
      em: EntityManager,
      baseKey: String,
      content: String,
      version: String,
      fileName: String
  ) {
    val lines = content.lines()
    val sections = mutableListOf<Pair<String, String>>()
    val headerBuilder = StringBuilder()

    var currentSection: String? = null
    val currentBody = StringBuilder()

    for (line in lines) {
      val trimmed = line.trimStart()
      if (trimmed.startsWith("## ")) {
        // Flush previous section
        if (currentSection != null) {
          sections.add(currentSection!! to currentBody.toString().trim())
          currentBody.clear()
        }

        val headerText = trimmed.removePrefix("## ").trim()
        val isGeneric = headerText.uppercase().startsWith("GENERIC")
        if (isGeneric) {
          // Generic rules belong to the parent prompt
          if (currentSection == null) {
            headerBuilder.append("\n").append(line).append("\n")
          }
          currentSection = null
        } else {
          currentSection = headerText
        }
      } else if (currentSection != null) {
        currentBody.append(line).append("\n")
      } else {
        headerBuilder.append(line).append("\n")
      }
    }
    // Flush last section
    if (currentSection != null) {
      sections.add(currentSection!! to currentBody.toString().trim())
    }

    val parentContent = headerBuilder.toString().trim()
    if (parentContent.isNotBlank()) {
      upsertPrompt(em, baseKey, parentContent, version)
      logger.info(
          "[PromptLoader] Upserted parent prompt '{}' from '{}' ({} items)",
          baseKey,
          fileName,
          sections.size)
    }

    for ((sectionName, sectionBody) in sections) {
      if (sectionBody.isBlank()) continue
      val itemKey = deriveItemKey(baseKey, sectionName)
      upsertPrompt(em, itemKey, sectionBody, version)
      logger.info("[PromptLoader] Upserted item prompt '{}' from '{}'", itemKey, fileName)
    }
  }

  /**
   * Derives a DB key for a section item from its parent key and section header. E.g.:
   * - baseKey="codbi.functionalities", section="AI.OCR" → "codbi.functionalities.ai_ocr"
   * - baseKey="formcycle.widgets", section="XTextField" → "formcycle.widgets.xtextfield"
   */
  private fun deriveItemKey(baseKey: String, sectionName: String): String {
    val normalized =
        sectionName
            .lowercase()
            .replace(Regex("[^a-z0-9_.]"), "_")
            .replace(Regex("_+"), "_")
            .trim('_')
    return "$baseKey.$normalized"
  }

  // region Prompt Manager API

  /**
   * Data class representing the full prompt record as exposed by the Prompt Manager REST API.
   * Includes all editable/metadata fields.
   */
  data class PromptRecord(
      val promptKey: String,
      val displayName: String?,
      val category: String?,
      val promptText: String?,
      val originalText: String?,
      val prePrompt: String?,
      val postPrompt: String?,
      val isActive: Boolean
  )

  /** Returns all prompt records for the Prompt Manager UI. Never returns `null`. */
  fun listAllPrompts(em: EntityManager): List<PromptRecord> {
    return try {
      val query =
          em.createNativeQuery(
              // language=H2
              """SELECT prompt_key, display_name, category, prompt_text, original_text,
                        pre_prompt, post_prompt, is_active
                 FROM codbi_ai_prompt
                 WHERE prompt_key != :skipKey
                 ORDER BY category, prompt_key""")
      query.setParameter("skipKey", SEED_VERSION_KEY)
      @Suppress("UNCHECKED_CAST")
      val rows = query.resultList as? List<Array<Any>> ?: return emptyList()
      rows.mapNotNull { row ->
        if (row.size < 8) return@mapNotNull null
        PromptRecord(
            promptKey = row[0]?.toString() ?: return@mapNotNull null,
            displayName = row[1]?.toString(),
            category = row[2]?.toString(),
            promptText = resolveClob(row[3]),
            originalText = resolveClob(row[4]),
            prePrompt = resolveClob(row[5]),
            postPrompt = resolveClob(row[6]),
            isActive = row[7]?.toString() == "true" || row[7]?.toString() == "1")
      }
    } catch (e: Exception) {
      logger.warn("[PromptLoader] Failed to list all prompts: {}", e.message)
      emptyList()
    }
  }

  /**
   * Saves (upserts) a single prompt record from the Prompt Manager. If [promptText] is null, the
   * existing prompt_text is left unchanged. [prePrompt] and [postPrompt] are always overwritten.
   */
  fun savePrompt(
      em: EntityManager,
      key: String,
      promptText: String?,
      prePrompt: String?,
      postPrompt: String?,
      isActive: Boolean,
      displayName: String?
  ) {
    val version = System.currentTimeMillis().toString()
    try {
      em.transaction.begin()

      if (promptText != null) {
        val update =
            em.createNativeQuery(
                // language=H2
                """UPDATE codbi_ai_prompt
                   SET prompt_text = :text, pre_prompt = :pre, post_prompt = :post,
                       is_active = :active, display_name = :dname, prompt_version = :ver,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE prompt_key = :key""")
        update.setParameter("text", promptText)
        update.setParameter("pre", prePrompt)
        update.setParameter("post", postPrompt)
        update.setParameter("active", isActive)
        update.setParameter("dname", displayName)
        update.setParameter("ver", version)
        update.setParameter("key", key)
        update.executeUpdate()
      } else {
        val update =
            em.createNativeQuery(
                // language=H2
                """UPDATE codbi_ai_prompt
                   SET pre_prompt = :pre, post_prompt = :post,
                       is_active = :active, display_name = :dname, prompt_version = :ver,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE prompt_key = :key""")
        update.setParameter("pre", prePrompt)
        update.setParameter("post", postPrompt)
        update.setParameter("active", isActive)
        update.setParameter("dname", displayName)
        update.setParameter("ver", version)
        update.setParameter("key", key)
        update.executeUpdate()
      }

      em.transaction.commit()
      logger.info("[PromptLoader] Saved prompt '{}' (active={})", key, isActive)
    } catch (e: Exception) {
      try {
        em.transaction.rollback()
      } catch (_: Exception) {}
      logger.warn("[PromptLoader] Failed to save prompt '{}': {}", key, e.message)
      throw e
    }
  }

  /**
   * Restores the original prompt text for the given [key] by copying [originalText] → [promptText].
   * Leaves [prePrompt], [postPrompt], and [isActive] unchanged. Only restores the main prompt body.
   */
  fun restoreOriginal(em: EntityManager, key: String) {
    try {
      em.transaction.begin()
      val version = System.currentTimeMillis().toString()
      val update =
          em.createNativeQuery(
              // language=H2
              """UPDATE codbi_ai_prompt
                 SET prompt_text = original_text,
                     prompt_version = :ver, updated_at = CURRENT_TIMESTAMP
                 WHERE prompt_key = :key AND original_text IS NOT NULL""")
      update.setParameter("ver", version)
      update.setParameter("key", key)
      val affected = update.executeUpdate()
      em.transaction.commit()
      logger.info("[PromptLoader] Restored original text for '{}' (rows={})", key, affected)
    } catch (e: Exception) {
      try {
        em.transaction.rollback()
      } catch (_: Exception) {}
      logger.warn("[PromptLoader] Failed to restore original for '{}': {}", key, e.message)
      throw e
    }
  }

  /** Toggles the [isActive] flag for the given prompt [key]. Returns the new value. */
  fun toggleActive(em: EntityManager, key: String): Boolean {
    val current =
        try {
          val q =
              em.createNativeQuery("SELECT is_active FROM codbi_ai_prompt WHERE prompt_key = :key")
          q.setParameter("key", key)
          val result = q.resultList
          if (result.isEmpty()) return false
          result[0]?.toString() == "true" || result[0]?.toString() == "1"
        } catch (_: Exception) {
          false
        }
    val newValue = !current
    try {
      em.transaction.begin()
      val update =
          em.createNativeQuery(
              """UPDATE codbi_ai_prompt SET is_active = :active, updated_at = CURRENT_TIMESTAMP
                 WHERE prompt_key = :key""")
      update.setParameter("active", newValue)
      update.setParameter("key", key)
      update.executeUpdate()
      em.transaction.commit()
      logger.info("[PromptLoader] Toggled '{}' active={}", key, newValue)
    } catch (e: Exception) {
      try {
        em.transaction.rollback()
      } catch (_: Exception) {}
      logger.warn("[PromptLoader] Failed to toggle '{}': {}", key, e.message)
    }
    return newValue
  }

  /** Imports a single prompt record (upserts it). */
  fun importPrompt(
      em: EntityManager,
      key: String,
      displayName: String?,
      promptText: String,
      prePrompt: String?,
      postPrompt: String?
  ) {
    savePrompt(em, key, promptText, prePrompt, postPrompt, true, displayName)
    logger.info("[PromptLoader] Imported prompt '{}'", key)
  }

  // endregion

  /** Loads the `index.json` manifest from the classpath. */
  private fun loadIndex(): List<Map<String, Any>>? {
    return try {
      val stream =
          PromptLoader::class.java.classLoader.getResourceAsStream(INDEX_RESOURCE) ?: return null
      val raw = stream.bufferedReader(Charsets.UTF_8).use { it.readText() }
      val type = object : TypeToken<List<Map<String, Any>>>() {}.type
      gson.fromJson(raw, type)
    } catch (e: Exception) {
      logger.warn("[PromptLoader] Failed to load index.json: {}", e.message)
      null
    }
  }

  /**
   * Finds the filename associated with a [key] in the `index.json` manifest. Returns `null` if the
   * key is not found.
   */
  private fun findIndexEntryByKey(key: String): String? {
    val index = loadIndex() ?: return null
    for (entry in index) {
      if (entry["key"] == key) return entry["file"] as? String
    }
    return null
  }

  /** Loads the content of a resource file from the prompts directory. */
  private fun loadResourceFile(fileName: String): String? {
    return try {
      val resourcePath = "${PROMPT_RESOURCE_BASE}$fileName"
      val stream =
          PromptLoader::class.java.classLoader.getResourceAsStream(resourcePath) ?: return null
      stream.bufferedReader(Charsets.UTF_8).use { it.readText() }.trim()
    } catch (e: Exception) {
      logger.warn("[PromptLoader] Failed to load resource '{}': {}", fileName, e.message)
      null
    }
  }

  // endregion
}
