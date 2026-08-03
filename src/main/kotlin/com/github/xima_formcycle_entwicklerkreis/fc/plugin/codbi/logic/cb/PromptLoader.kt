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

  /** Set externally from plugin properties (e.g., `AI_Prompt_Reseed=true`) to force a re-seed. */
  @Volatile internal var forceReseed = false

  /** Keys successfully seeded/upserted during the current [seedIfNeeded] run. */
  private val seededKeys = mutableSetOf<String>()

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

  /**
   * System property name for forcing a re-seed. Set `-Dcodbi.prompt.reseed=true` in the JVM args to
   * delete the stored seed version and trigger a full re-seed on the next startup.
   */
  /** Plugin property name for forcing a prompt re-seed via Formcycle plugin config. */
  internal const val RESEED_PROPERTY = "AI_FormAssistant_Prompt_Reseed"

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

  /** DB key for the full CodBi API reference (parameter-complete), shown in the Detailed view. */
  const val KEY_CODBI_API_REFERENCE = "codbi.api_reference"

  /** Classpath resource for the full CodBi API reference (parameter-complete compact API). */
  private const val API_REFERENCE_RESOURCE =
      "com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-api-compact.md"

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
   * Placeholder in resource files that gets replaced with the output of
   * [CodbiCapabilities.buildWidgetsSection] (condensed formcycle widgets reference).
   */
  private const val PLACEHOLDER_FORMCYCLE_WIDGETS_SECTION = "{{FORMCYCLE_WIDGETS_SECTION}}"

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
      seededKeys.clear()

      // Check for force reseed flag (set from plugin property AI_Prompt_Reseed)
      if (forceReseed) {
        logger.info(
            "[PromptLoader] Force reseed requested via plugin property '{}' — clearing stored version",
            RESEED_PROPERTY)
        em.createNativeQuery("DELETE FROM codbi_ai_prompt WHERE prompt_key = :key")
            .setParameter("key", SEED_VERSION_KEY)
            .executeUpdate()
        forceReseed = false
      }

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

      // Seed the full CodBi API reference into the detailed table (Detailed view). This is the
      // parameter-complete reference the AI receives in the pass-2 prompts
      // ({{CODBI_FULL_SECTION}} / CodbiCapabilities.buildFullSection()).
      val apiContent = loadClasspathResource(API_REFERENCE_RESOURCE)
      if (apiContent != null) {
        if (apiContent.contains("\n## ")) {
          seedSplitFile(
              em, KEY_CODBI_API_REFERENCE, apiContent, pluginVersion, "codbi-core-api-compact.md")
        } else {
          upsertPrompt(em, KEY_CODBI_API_REFERENCE, apiContent, pluginVersion)
        }
      }

      // Clean up stale system prompts (e.g., keys that changed due to seed logic updates).
      // Only removes system prompts (is_system = true); user-created prompts are preserved.
      val allSystemKeys =
          em.createNativeQuery("SELECT prompt_key FROM codbi_ai_prompt WHERE is_system = true")
              .resultList
              .mapNotNull { it?.toString() }
      var staleDeleted = 0
      for (key in allSystemKeys) {
        if (key == SEED_VERSION_KEY || key in seededKeys) continue
        em.createNativeQuery("DELETE FROM codbi_ai_prompt WHERE prompt_key = :key")
            .setParameter("key", key)
            .executeUpdate()
        staleDeleted++
      }
      if (staleDeleted > 0) {
        logger.info("[PromptLoader] Deleted {} stale system prompt(s)", staleDeleted)
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

    // First try: load from DB (only active prompts — conditionally includes pre/post based on their
    // active flag)
    val dbResult =
        try {
          val query =
              em.createNativeQuery(
                  // language=H2
                  """SELECT
                        CASE WHEN COALESCE(pre_prompt_active, TRUE) THEN COALESCE(pre_prompt, '') ELSE '' END
                        || prompt_text ||
                        CASE WHEN COALESCE(post_prompt_active, TRUE) THEN COALESCE(post_prompt, '') ELSE '' END
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
   * Loads the document-parsing rules (`codbi.document_parsing`), including all `##`/`###` sub-item
   * content folded into the parent key. Returns `null` if unavailable. These rules are only
   * transmitted to the AI when the user request references an attached document to parse.
   */
  fun loadDocumentParsingRules(em: EntityManager): String? {
    val category = loadCategory(em, "codbi.document_parsing")
    val text = category["codbi.document_parsing"]
    return text?.takeIf { it.isNotBlank() }
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
   *
   * **Important:** Because `##`-sectioned prompt files are split into sub-keys (e.g.
   * `codbi.general._codbiapplicability_report`), this method also folds every sub-item's content
   * back into its parent key. This ensures that code looking up `cb["codbi.general"]` receives BOTH
   * the parent header AND all its section contents, matching the pre-DB-migration behavior where
   * each file was a single hardcoded string.
   */
  private fun queryCategory(em: EntityManager, prefix: String): Map<String, String> {
    return try {
      val query =
          em.createNativeQuery(
              // language=H2
              """SELECT prompt_key,
                        CASE WHEN COALESCE(pre_prompt_active, TRUE) THEN COALESCE(pre_prompt, '') ELSE '' END
                        || prompt_text ||
                        CASE WHEN COALESCE(post_prompt_active, TRUE) THEN COALESCE(post_prompt, '') ELSE '' END
                 FROM codbi_ai_prompt
                 WHERE prompt_key LIKE :prefix AND is_active = TRUE
                 ORDER BY prompt_key""")
      query.setParameter("prefix", "$prefix%")
      @Suppress("UNCHECKED_CAST")
      val rows = query.resultList as? List<Array<Any>> ?: return emptyMap()
      val flat =
          rows.mapNotNull { row ->
            if (row.size >= 2) {
              val key = row[0]?.toString() ?: return@mapNotNull null
              val text = resolveClob(row[1]) ?: return@mapNotNull null
              key to text
            } else null
          }
      // Fold sub-items into their parent keys so lookups like cb["codbi.functionalities"]
      // return the full content (parent + all sections), not just the header before the first ##.
      val allKeys = flat.map { it.first }.toSet()
      val folded = mutableMapOf<String, String>()
      for ((key, text) in flat) {
        // Determine the parent key: a key that is a prefix of this key (followed by a dot)
        val parentKey =
            allKeys.filter { it != key && key.startsWith("$it.") }.maxByOrNull { it.length }
        if (parentKey != null) {
          folded[parentKey] = (folded[parentKey] ?: "") + "\n" + text
        } else {
          folded[key] = (folded[key] ?: "") + "\n" + text
        }
      }
      folded
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
    result =
        result.replace(
            PLACEHOLDER_FORMCYCLE_WIDGETS_SECTION, CodbiCapabilities.buildWidgetsSection())
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

  /**
   * Seeds a prompt row preserving user edits.
   * - If the prompt does NOT exist in the DB: insert it with the new [text].
   * - If the prompt EXISTS and the user has NOT modified it (prompt_text == original_text): update
   *   it with the new [text] from the .md file.
   * - If the prompt EXISTS and the user HAS modified it (prompt_text != original_text): skip it —
   *   preserve the user's edits.
   *
   * @param displayName Optional human-readable name. When provided it is used as the prompt's
   *   display name (preserving the original section header, e.g. "Date.Today" or "EP Chaining").
   *   When null, a name is derived from the key.
   */
  private fun upsertPrompt(
      em: EntityManager,
      key: String,
      text: String,
      version: String,
      displayName: String? = null
  ) {
    seededKeys.add(key)
    val resolvedDisplayName = displayName ?: deriveDisplayName(key)
    // Check if prompt already exists and whether the user has modified it
    val existing =
        try {
          val q =
              em.createNativeQuery(
                  "SELECT prompt_text, original_text FROM codbi_ai_prompt WHERE prompt_key = :key")
          q.setParameter("key", key)
          val result = q.resultList
          if (result.isEmpty()) null
          else
              (result[0] as? Array<*>)?.let { row ->
                if (row.size >= 2) Pair(resolveClob(row[0]), resolveClob(row[1])) else null
              }
        } catch (_: Exception) {
          null
        }

    if (existing != null) {
      val (dbText, dbOriginal) = existing
      // User has modified this prompt — skip it to preserve edits
      if (dbText != null && dbOriginal != null && dbText != dbOriginal) {
        // A newer version is available when the bundled .md content differs from the stored
        // original snapshot. Surface this via the update_available flag so the Prompt Manager
        // can offer to load the new version ("Restore Original").
        val newerAvailable = dbOriginal != text
        em.createNativeQuery(
                """UPDATE codbi_ai_prompt
                   SET update_available = :flag, updated_at = CURRENT_TIMESTAMP
                   WHERE prompt_key = :key""")
            .setParameter("flag", newerAvailable)
            .setParameter("key", key)
            .executeUpdate()
        logger.info(
            "[PromptLoader] Prompt '{}' was modified by user — preserving edits (updateAvailable={})",
            key,
            newerAvailable)
        return
      }
      // Not modified — update with new content from .md file
      val update =
          em.createNativeQuery(
              """UPDATE codbi_ai_prompt
             SET prompt_text = :text, original_text = :orig, prompt_version = :ver,
                 display_name = :dname, is_system = true, update_available = false,
                 updated_at = CURRENT_TIMESTAMP
             WHERE prompt_key = :key""")
      update.setParameter("text", text)
      update.setParameter("orig", text)
      update.setParameter("ver", version)
      update.setParameter("dname", resolvedDisplayName)
      update.setParameter("key", key)
      update.executeUpdate()
      logger.info("[PromptLoader] Updated prompt '{}' from seed file", key)
      return
    }

    // New prompt — insert
    val category = key.substringBefore(".", key)
    val insert =
        em.createNativeQuery(
            // language=H2
            """INSERT INTO codbi_ai_prompt
               (prompt_key, category, prompt_text, prompt_version, original_text, is_active, display_name,
                pre_prompt_active, post_prompt_active, is_system, update_available)
               VALUES (:key, :cat, :text, :ver, :orig, :active, :dname, :preAct, :postAct, true, false)""")
    insert.setParameter("key", key)
    insert.setParameter("cat", category)
    insert.setParameter("text", text)
    insert.setParameter("ver", version)
    insert.setParameter("orig", text)
    insert.setParameter("active", true)
    insert.setParameter("preAct", true)
    insert.setParameter("postAct", true)
    insert.setParameter("dname", resolvedDisplayName)
    insert.executeUpdate()
    logger.info("[PromptLoader] Inserted new prompt '{}'", key)
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

      logger.info(
          "[PromptLoader] Processing section '{}' -> itemKey '{}' (body length={})",
          sectionName,
          itemKey,
          sectionBody.length)

      // Check if this section body contains ### sub-headers for further splitting
      val subLines = sectionBody.lines()
      val subSections = mutableListOf<Pair<String, String>>()
      var currentSub: String? = null
      val subBody = StringBuilder()

      for (line in subLines) {
        val t = line.trimStart()
        if (t.startsWith("### ")) {
          logger.info("[PromptLoader]   Found ### sub-header: '{}'", t.removePrefix("### ").trim())
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

      logger.info("[PromptLoader]   Found {} ### sub-sections in '{}'", subSections.size, itemKey)

      if (subSections.isNotEmpty()) {
        // The section body WITHOUT the ### sub-items becomes the parent section prompt;
        // each ### sub-item becomes a separate prompt with a deeper key.
        val sectionMainBody =
            subLines.takeWhile { !it.trimStart().startsWith("### ") }.joinToString("\n").trim()
        if (sectionMainBody.isNotBlank()) {
          upsertPrompt(em, itemKey, sectionMainBody, version, sectionName)
          logger.info(
              "[PromptLoader] Upserted section '{}' from '{}' (with {} sub-items)",
              itemKey,
              fileName,
              subSections.size)
        }
        for ((subName, subContent) in subSections) {
          if (subContent.isBlank()) continue
          val subKey = deriveItemKey(itemKey, subName)
          upsertPrompt(em, subKey, subContent, version, subName)
          logger.info(
              "[PromptLoader] Upserted sub-item '{}' from '{}' ({} chars)",
              subKey,
              fileName,
              subContent.length)
        }
      } else {
        upsertPrompt(em, itemKey, sectionBody, version, sectionName)
        logger.info("[PromptLoader] Upserted item prompt '{}' from '{}'", itemKey, fileName)
      }
    }
  }

  /**
   * Derives a DB key for a section item from its parent key and section header. E.g.:
   * - baseKey="codbi.functionalities", section="AI.OCR" → "codbi.functionalities.ai_ocr"
   * - baseKey="formcycle.widgets", section="XTextField" → "formcycle.widgets.xtextfield"
   */
  /**
   * Derives a DB key for a section item from its parent key and section header. Dots in the section
   * name are converted to underscores so the item name becomes a single key segment. E.g.:
   * - baseKey="codbi.functionalities", section="AI.OCR" → "codbi.functionalities.ai_ocr"
   * - baseKey="codbi.element_placeholders.bayvis_eps", section="BayVIS.Ansprechpartner" →
   *   "codbi.element_placeholders.bayvis_eps.bayvis_ansprechpartner"
   */
  private fun deriveItemKey(baseKey: String, sectionName: String): String {
    val normalized =
        sectionName
            .lowercase()
            .replace(Regex("[^a-z0-9_]"), "_")
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
      val isActive: Boolean,
      val prePromptActive: Boolean = true,
      val postPromptActive: Boolean = true,
      val isSystem: Boolean = false,
      val updateAvailable: Boolean = false
  )

  /** Returns all prompt records for the Prompt Manager UI. Never returns `null`. */
  fun listAllPrompts(em: EntityManager): List<PromptRecord> {
    return try {
      val query =
          em.createNativeQuery(
              // language=H2
              """SELECT prompt_key, display_name, category, prompt_text, original_text,
                        pre_prompt, post_prompt, is_active,
                        pre_prompt_active, post_prompt_active, is_system, update_available
                 FROM codbi_ai_prompt
                 WHERE prompt_key != :skipKey
                 ORDER BY category, prompt_key""")
      query.setParameter("skipKey", SEED_VERSION_KEY)
      @Suppress("UNCHECKED_CAST")
      val rows = query.resultList as? List<Array<Any>> ?: return emptyList()
      rows.mapNotNull { row ->
        if (row.size < 12) return@mapNotNull null
        PromptRecord(
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
      displayName: String?,
      prePromptActive: Boolean = true,
      postPromptActive: Boolean = true
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
                       pre_prompt_active = :preAct, post_prompt_active = :postAct,
                       update_available = false, updated_at = CURRENT_TIMESTAMP
                   WHERE prompt_key = :key""")
        update.setParameter("text", promptText)
        update.setParameter("pre", prePrompt)
        update.setParameter("post", postPrompt)
        update.setParameter("active", isActive)
        update.setParameter("preAct", prePromptActive)
        update.setParameter("postAct", postPromptActive)
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
                       pre_prompt_active = :preAct, post_prompt_active = :postAct,
                       update_available = false, updated_at = CURRENT_TIMESTAMP
                   WHERE prompt_key = :key""")
        update.setParameter("pre", prePrompt)
        update.setParameter("post", postPrompt)
        update.setParameter("active", isActive)
        update.setParameter("preAct", prePromptActive)
        update.setParameter("postAct", postPromptActive)
        update.setParameter("dname", displayName)
        update.setParameter("ver", version)
        update.setParameter("key", key)
        update.executeUpdate()
      }

      em.transaction.commit()
      logger.info(
          "[PromptLoader] Saved prompt '{}' (active={}, preActive={}, postActive={})",
          key,
          isActive,
          prePromptActive,
          postPromptActive)
    } catch (e: Exception) {
      try {
        em.transaction.rollback()
      } catch (_: Exception) {}
      logger.warn("[PromptLoader] Failed to save prompt '{}': {}", key, e.message)
      throw e
    }
  }

  /**
   * Restores the prompt for the given [key]. If a bundled .md resource provides a newer version
   * (e.g. after a plugin update), that newest version is loaded; otherwise it falls back to the
   * stored [originalText] snapshot. The [updateAvailable] flag is cleared in both cases. Leaves
   * [prePrompt], [postPrompt], and [isActive] unchanged. Only restores the main prompt body.
   */
  fun restoreOriginal(em: EntityManager, key: String) {
    try {
      em.transaction.begin()
      val version = System.currentTimeMillis().toString()
      val newest = resolveNewestSeedContent(key)
      if (newest != null) {
        em.createNativeQuery(
                // language=H2
                """UPDATE codbi_ai_prompt
                   SET prompt_text = :text, original_text = :text,
                       prompt_version = :ver, update_available = false,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE prompt_key = :key""")
            .setParameter("text", newest)
            .setParameter("ver", version)
            .setParameter("key", key)
            .executeUpdate()
        logger.info(
            "[PromptLoader] Restored '{}' to newest bundled version ({} chars)", key, newest.length)
      } else {
        em.createNativeQuery(
                // language=H2
                """UPDATE codbi_ai_prompt
                   SET prompt_text = original_text,
                       prompt_version = :ver, update_available = false,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE prompt_key = :key AND original_text IS NOT NULL""")
            .setParameter("ver", version)
            .setParameter("key", key)
            .executeUpdate()
        logger.info("[PromptLoader] Restored '{}' to stored original snapshot", key)
      }
      em.transaction.commit()
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

  /**
   * Creates a brand-new prompt record (INSERT). Used when the user adds a new category or item from
   * the Prompt Manager UI. The [category] argument is optional — if omitted it is derived from the
   * first dotted segment of [key].
   */
  fun createPrompt(
      em: EntityManager,
      key: String,
      displayName: String?,
      promptText: String,
      category: String?
  ) {
    val version = System.currentTimeMillis().toString()
    val cat = category ?: key.split(".").firstOrNull() ?: key
    try {
      em.transaction.begin()
      em.createNativeQuery(
              // language=H2
              """INSERT INTO codbi_ai_prompt
               (prompt_key, category, prompt_text, original_text,
                display_name, is_active, pre_prompt_active, post_prompt_active,
                prompt_version, updated_at)
             VALUES (:key, :cat, :txt, :txt, :dn, true, true, true, :ver, CURRENT_TIMESTAMP)""")
          .setParameter("key", key)
          .setParameter("cat", cat)
          .setParameter("txt", promptText)
          .setParameter("dn", displayName)
          .setParameter("ver", version)
          .executeUpdate()
      em.transaction.commit()
      logger.info("[PromptLoader] Created prompt '{}'", key)
    } catch (e: Exception) {
      try {
        em.transaction.rollback()
      } catch (_: Exception) {}
      logger.warn("[PromptLoader] Failed to create prompt '{}': {}", key, e.message)
      throw e
    }
  }

  /** Deletes a prompt record by its key. */
  fun deletePrompt(em: EntityManager, key: String) {
    try {
      em.transaction.begin()
      em.createNativeQuery("DELETE FROM codbi_ai_prompt WHERE prompt_key = :key")
          .setParameter("key", key)
          .executeUpdate()
      em.transaction.commit()
      logger.info("[PromptLoader] Deleted prompt '{}'", key)
    } catch (e: Exception) {
      try {
        em.transaction.rollback()
      } catch (_: Exception) {}
      logger.warn("[PromptLoader] Failed to delete prompt '{}': {}", key, e.message)
      throw e
    }
  }

  /** Renames a prompt record by changing its [prompt_key] from [oldKey] to [newKey]. */
  fun renamePrompt(em: EntityManager, oldKey: String, newKey: String, displayName: String? = null) {
    try {
      em.transaction.begin()
      val cat = newKey.split(".").firstOrNull() ?: newKey
      if (displayName != null) {
        em.createNativeQuery(
                """UPDATE codbi_ai_prompt
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
                """UPDATE codbi_ai_prompt
               SET prompt_key = :newKey, category = :cat, updated_at = CURRENT_TIMESTAMP
               WHERE prompt_key = :oldKey""")
            .setParameter("newKey", newKey)
            .setParameter("cat", cat)
            .setParameter("oldKey", oldKey)
            .executeUpdate()
      }
      em.transaction.commit()
      logger.info("[PromptLoader] Renamed prompt '{}' -> '{}'", oldKey, newKey)
    } catch (e: Exception) {
      try {
        em.transaction.rollback()
      } catch (_: Exception) {}
      logger.warn(
          "[PromptLoader] Failed to rename prompt '{}' -> '{}': {}", oldKey, newKey, e.message)
      throw e
    }
  }

  /** Imports a single prompt record (upserts it). */
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
    logger.info("[PromptLoader] Imported prompt '{}'", key)
  }

  // region System standard configurations (server-side flags for Prompt Manager deactivation)

  /**
   * Prompt keys of the server-side system standard configurations (seeded from
   * `codbi-standard-configurations.md`).
   */
  private val SYSTEM_CONFIG_PROMPT_KEYS: Map<String, String> =
      mapOf(
          "codbi.standard_configurations.system_standard_configurations.holistic_matomo_tracking" to
              "Holistic.Matomo.Tracking",
          "codbi.standard_configurations.system_standard_configurations.holistic_cleave_date" to
              "Holistic.Cleave.Date",
          "codbi.standard_configurations.system_standard_configurations.holistic_cleave_phone" to
              "Holistic.Cleave.Phone",
          "codbi.standard_configurations.system_standard_configurations.holistic_cleave_plz" to
              "Holistic.Cleave.PLZ",
          "codbi.standard_configurations.system_standard_configurations.holistic_cleave_time" to
              "Holistic.Cleave.Time")

  /** All known server-side system standard configuration names. */
  val SYSTEM_CONFIG_NAMES: Set<String> = SYSTEM_CONFIG_PROMPT_KEYS.values.toSet()

  /**
   * Returns the set of server-side system standard configuration names (e.g.
   * "Holistic.Cleave.Date") whose corresponding prompt record in `codbi_ai_prompt` is currently
   * active. Deactivating such a prompt in the Prompt Manager disables the automatic application of
   * the associated standard configuration. Configs whose prompt record is not present (e.g. before
   * the seed has run) are treated as enabled. A `null` [em] (DB unavailable) also returns all
   * configs as enabled.
   */
  fun activeSystemStandardConfigs(em: EntityManager?): Set<String> {
    if (em == null) return SYSTEM_CONFIG_NAMES
    val inactiveKeys = mutableSetOf<String>()
    try {
      val query =
          em.createNativeQuery(
              // language=H2
              """SELECT prompt_key, is_active FROM codbi_ai_prompt
                 WHERE prompt_key LIKE :prefix""")
      query.setParameter("prefix", "codbi.standard_configurations.system_standard_configurations.%")
      @Suppress("UNCHECKED_CAST")
      val rows = query.resultList as? List<Array<Any>> ?: return SYSTEM_CONFIG_NAMES
      for (row in rows) {
        if (row.size < 2) continue
        val key = row[0]?.toString() ?: continue
        val isActive = row[1]?.toString() == "true" || row[1]?.toString() == "1"
        if (!isActive) inactiveKeys.add(key)
      }
    } catch (e: Exception) {
      logger.warn("[PromptLoader] Failed to read system config prompt active flags: {}", e.message)
      return SYSTEM_CONFIG_NAMES
    }
    return SYSTEM_CONFIG_PROMPT_KEYS.filterKeys { it !in inactiveKeys }.values.toSet()
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

  /** Loads the content of a classpath resource by its full path (outside the prompts directory). */
  private fun loadClasspathResource(path: String): String? {
    return try {
      val stream = PromptLoader::class.java.classLoader.getResourceAsStream(path) ?: return null
      stream.bufferedReader(Charsets.UTF_8).use { it.readText() }.trim()
    } catch (e: Exception) {
      logger.warn("[PromptLoader] Failed to load classpath resource '{}': {}", path, e.message)
      null
    }
  }

  /**
   * Loads individual prompt sections (key → text) whose key starts with [prefix], WITHOUT folding
   * sub-items into parents. Used to fetch single component/widget sections on demand (e.g. the
   * `formcycle.widgets.<name>` sections in the pass-2 detail rerun).
   */
  fun loadSectionMap(em: EntityManager, prefix: String): Map<String, String> {
    return try {
      val q =
          em.createNativeQuery(
              // language=H2
              """SELECT prompt_key, prompt_text FROM codbi_ai_prompt
                 WHERE prompt_key LIKE :prefix AND is_active = TRUE""")
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
      logger.warn("[PromptLoader] Failed to load section map '{}': {}", prefix, e.message)
      emptyMap()
    }
  }

  /**
   * Loads all active detailed prompt records whose key starts with [prefix], including their
   * display names. Used to rebuild the full CodBi reference from the DB so user edits and
   * deactivations are reflected (instead of reading a stale bundled classpath resource).
   */
  fun loadCategoryRecords(em: EntityManager, prefix: String): List<PromptRecord> {
    return try {
      val query =
          em.createNativeQuery(
              // language=H2
              """SELECT prompt_key, display_name, category, prompt_text, original_text,
                        pre_prompt, post_prompt, is_active,
                        pre_prompt_active, post_prompt_active, is_system, update_available
                 FROM codbi_ai_prompt
                 WHERE prompt_key LIKE :prefix AND is_active = TRUE
                 ORDER BY prompt_key""")
      query.setParameter("prefix", "$prefix%")
      @Suppress("UNCHECKED_CAST")
      val rows = query.resultList as? List<Array<Any>> ?: return emptyList()
      rows.mapNotNull { row ->
        if (row.size < 12) return@mapNotNull null
        PromptRecord(
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
      }
    } catch (e: Exception) {
      logger.warn("[PromptLoader] Failed to load category records '{}': {}", prefix, e.message)
      emptyList()
    }
  }

  /**
   * Builds the condensed workflow-nodes reference (trigger/node name + purpose) for the pass-1
   * workflow prompt, loaded from the **compact** DB table (`compact.formcycle_workflow_nodes`).
   * This keeps the AI's initial workflow reference fully DB-driven.
   */
  fun buildWorkflowNodesCondensed(em: EntityManager): String {
    val map = CompactPromptLoader.loadCategory(em, "compact.formcycle_workflow_nodes")
    if (map.isEmpty()) return ""
    val sb = StringBuilder("FORMCYCLE WORKFLOW NODES (COMPACT)\n")
    val header = map["compact.formcycle_workflow_nodes"] ?: ""
    if (header.isNotBlank()) sb.append(header).append("\n")
    val triggers =
        map.entries
            .filter { it.key.startsWith("compact.formcycle_workflow_nodes.trigger_types.") }
            .sortedBy { it.key }
    if (triggers.isNotEmpty()) {
      sb.append("\n## Trigger Types\n")
      for ((_, v) in triggers) sb.append(v).append("\n")
    }
    val nodes =
        map.entries
            .filter { it.key.startsWith("compact.formcycle_workflow_nodes.node_types.") }
            .sortedBy { it.key }
    if (nodes.isNotEmpty()) {
      sb.append("\n## Node Types\n")
      for ((_, v) in nodes) sb.append(v).append("\n")
    }
    return sb.toString().trimEnd()
  }

  /**
   * Builds the workflow-node details section for the pass-2 rerun. When [nodeNames] (and optionally
   * [triggerNames]) is non-empty, only the requested nodes'/triggers' sections from the detailed DB
   * (`formcycle.workflow_nodes.node_types.<name>` / `...trigger_types.<name>`) are appended;
   * otherwise the full `formcycle.workflow_nodes` category is included as a fallback.
   */
  fun buildWorkflowNodeDetails(
      em: EntityManager,
      nodeNames: List<String>,
      triggerNames: List<String> = emptyList()
  ): String {
    val norm: (String) -> String = { s ->
      s.trim().lowercase().replace(Regex("[^a-z0-9]"), "_").replace(Regex("_+"), "_").trim('_')
    }
    // Prepend the general workflow rules (output format, taskName, placeholders, server variables,
    // output rules) so the pass-2 prompt retains the context the AI needs.
    val header = loadCategory(em, "formcycle.workflow_nodes")["formcycle.workflow_nodes"] ?: ""
    val section = StringBuilder()
    if (header.isNotBlank()) section.append(header).append("\n")
    section.append("\nFORMCYCLE WORKFLOW NODE DETAILS (requested)\n")
    var appended = 0

    if (nodeNames.isNotEmpty()) {
      val all = loadSectionMap(em, "formcycle.workflow_nodes.node_types.")
      for (id in nodeNames) {
        val n = norm(id)
        if (n.isEmpty()) continue
        val content =
            all["formcycle.workflow_nodes.node_types.$n"]
                ?: all.entries
                    .firstOrNull { (k, _) ->
                      k.removePrefix("formcycle.workflow_nodes.node_types.").startsWith(n)
                    }
                    ?.value
                ?: continue
        section.append("\n## ").append(id.trim()).append("\n").append(content).append("\n")
        appended++
      }
    }
    if (triggerNames.isNotEmpty()) {
      val all = loadSectionMap(em, "formcycle.workflow_nodes.trigger_types.")
      for (id in triggerNames) {
        val n = norm(id)
        if (n.isEmpty()) continue
        val content =
            all["formcycle.workflow_nodes.trigger_types.$n"]
                ?: all.entries
                    .firstOrNull { (k, _) ->
                      k.removePrefix("formcycle.workflow_nodes.trigger_types.").startsWith(n)
                    }
                    ?.value
                ?: continue
        section.append("\n## ").append(id.trim()).append("\n").append(content).append("\n")
        appended++
      }
    }

    if (appended == 0) {
      // Fallback: no requested section resolved — return the general header at minimum.
      return if (header.isNotBlank()) header else ""
    }
    return section.toString().trimEnd()
  }

  /**
   * Finds the bundled seed file (from `index.json`) that would produce the given [key]. Returns the
   * index base key and the resource file name. Handles sub-item keys by matching the longest index
   * key prefix. Returns `null` when no index entry covers [key].
   */
  private fun findIndexEntryForKey(key: String): Pair<String, String>? {
    val index = loadIndex() ?: return null
    var best: Pair<String, String>? = null
    var bestLen = -1
    for (entry in index) {
      val base = entry["key"] as? String ?: continue
      val file = entry["file"] as? String ?: continue
      if (key == base || key.startsWith("$base.")) {
        if (base.length > bestLen) {
          bestLen = base.length
          best = base to file
        }
      }
    }
    return best
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
        val headerText = trimmed.removePrefix("## ").trim()
        if (headerText.uppercase().startsWith("GENERIC")) {
          // Generic rules belong to the parent prompt
          if (currentSection == null) headerBuilder.append("\n").append(line).append("\n")
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
    if (currentSection != null) {
      sections.add(currentSection!! to currentBody.toString().trim())
    }

    val parentContent = headerBuilder.toString().trim()
    if (parentContent.isNotBlank()) result[baseKey] = parentContent

    for ((sectionName, sectionBody) in sections) {
      if (sectionBody.isBlank()) continue
      val itemKey = deriveItemKey(baseKey, sectionName)

      // ### sub-header splitting
      val subLines = sectionBody.lines()
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
          result[deriveItemKey(itemKey, subName)] = subContent
        }
      } else {
        result[itemKey] = sectionBody
      }
    }
    return result
  }

  /** Loads the newest bundled seed content for a given [key] from the classpath .md resources. */
  private fun resolveNewestSeedContent(key: String): String? {
    val (baseKey, file) = findIndexEntryForKey(key) ?: return null
    val content = loadResourceFile(file) ?: return null
    return seedContentMap(baseKey, content)[key]
  }

  // endregion
}
