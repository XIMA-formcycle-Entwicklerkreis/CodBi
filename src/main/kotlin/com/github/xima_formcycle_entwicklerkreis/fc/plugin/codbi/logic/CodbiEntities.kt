package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.CompactPromptLoader
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.PromptLoader
import de.xima.fc.interfaces.plugin.param.entities.IPluginEntitiesParams
import de.xima.fc.plugin.entities.IPluginEntities
import de.xima.fc.plugin.exception.FCPluginException
import javax.persistence.EntityManagerFactory
import org.slf4j.LoggerFactory

/**
 * # CodBi — Unified Database Plugin
 *
 * Single [IPluginEntities] implementation for all CodBi database tables. Manages the Liquibase
 * changelogs for the AI proxy audit log (`codbi_ai_proxy`), the Local API Doc storage
 * (`codbi_local_apidoc`), and the AI system prompts (`codbi_ai_prompt`).
 *
 * Formcycle auto-discovers this class because it implements [IPluginEntities].
 *
 * @see com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.AiProxy
 * @see
 *   com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.LocalAPIDoc.StructuredDataStoreAction
 * @see PromptLoader
 */
class CodbiEntities : IPluginEntities {
  companion object {
    private val logger = LoggerFactory.getLogger(CodbiEntities::class.java)

    /**
     * The JPA [EntityManagerFactory] provided by Formcycle after schema migration completes. `null`
     * until [onDatabaseReady] is called.
     */
    @Volatile
    @JvmStatic
    var entityManagerFactory: EntityManagerFactory? = null
      private set
  }

  override fun getName(): String = "CodBi_Entities"

  override fun getLiquibaseScripts(): List<String> =
      listOf(
          "db/changelog/codbi-ai-proxy-changelog.xml",
          "db/changelog/codbi-local-apidoc-changelog.xml",
          "db/changelog/codbi-ai-prompt-changelog.xml",
          "db/changelog/codbi-compact-prompt-changelog.xml")

  @Throws(FCPluginException::class)
  override fun onDatabaseReady(params: IPluginEntitiesParams) {
    entityManagerFactory = params.entityManagerFactory

    logger.info(
        "[[ CodBi / DB ] onDatabaseReady called — seeding AI prompts from classpath resources ]")

    val version = System.currentTimeMillis().toString()

    // Seed detailed AI system prompts from classpath resources
    try {
      logger.info("[[ CodBi / DB ] Calling PromptLoader.seedIfNeeded with version={} ]", version)
      PromptLoader.seedIfNeeded(params.entityManagerFactory, version)
      logger.info("[[ CodBi / DB ] PromptLoader.seedIfNeeded completed successfully ]")
    } catch (e: Exception) {
      logger.warn(
          "[[ CodBi / DB ] Failed to seed AI prompts: ${e.message} — continuing with fallbacks ]")
    }

    // Seed compact AI system prompts (codbi-core-elements/api-compact.md)
    try {
      logger.info(
          "[[ CodBi / DB ] Calling CompactPromptLoader.seedIfNeeded with version={} ]", version)
      CompactPromptLoader.seedIfNeeded(params.entityManagerFactory, version)
      logger.info("[[ CodBi / DB ] CompactPromptLoader.seedIfNeeded completed successfully ]")
    } catch (e: Exception) {
      logger.warn(
          "[[ CodBi / DB ] Failed to seed compact prompts: ${e.message} — continuing with fallbacks ]")
    }

    logger.info("[[ CodBi / DB ] Database ready — EntityManagerFactory available ]")
  }
}
