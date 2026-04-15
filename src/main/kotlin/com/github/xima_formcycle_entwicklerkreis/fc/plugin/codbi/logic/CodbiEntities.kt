package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import de.xima.fc.interfaces.plugin.param.entities.IPluginEntitiesParams
import de.xima.fc.plugin.entities.IPluginEntities
import de.xima.fc.plugin.exception.FCPluginException
import javax.persistence.EntityManagerFactory
import org.slf4j.LoggerFactory

/**
 * # CodBi — Unified Database Plugin
 *
 * Single [IPluginEntities] implementation for all CodBi database tables. Manages the Liquibase
 * changelogs for both the AI proxy audit log (`codbi_ai_proxy`) and the Local API Doc storage
 * (`codbi_local_apidoc`).
 *
 * Formcycle auto-discovers this class because it implements [IPluginEntities].
 *
 * @see com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.AiProxy
 * @see
 *   com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.LocalAPIDoc.StructuredDataStoreAction
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
          "db/changelog/codbi-local-apidoc-changelog.xml")

  @Throws(FCPluginException::class)
  override fun onDatabaseReady(params: IPluginEntitiesParams) {
    entityManagerFactory = params.entityManagerFactory

    logger.info("[[ CodBi / DB ] Database ready — EntityManagerFactory available ]")
  }
}
