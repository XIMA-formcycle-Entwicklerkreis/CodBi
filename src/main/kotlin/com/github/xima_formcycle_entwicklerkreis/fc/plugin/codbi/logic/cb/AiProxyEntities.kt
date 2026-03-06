package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

// region Imports
import de.xima.fc.interfaces.plugin.param.entities.IPluginEntitiesParams
import de.xima.fc.plugin.entities.IPluginEntities
import de.xima.fc.plugin.exception.FCPluginException
import javax.persistence.EntityManagerFactory
import org.slf4j.LoggerFactory

// endregion Imports

// ═══════════════════════════════════════════════════════════════════════════════
//  AiProxyEntities — Formcycle-managed database access for the AI Proxy
// ═══════════════════════════════════════════════════════════════════════════════
//
// Implements [IPluginEntities] so that Formcycle handles:
//   1. Database connection lifecycle (using the system database)
//   2. Schema migration via Liquibase (creates the `codbi_ai_proxy` table)
//   3. Providing a JPA [EntityManagerFactory] for audit logging
//
// The [AiProxy] servlet reads from [entityManagerFactory] to insert audit rows.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * # CodBi AI Proxy — Database Plugin
 *
 * Manages the database lifecycle for the AI proxy's audit log table (`codbi_ai_proxy`). Uses
 * Formcycle's system database (no separate data source needed).
 *
 * Formcycle auto-discovers this class because it implements [IPluginEntities].
 *
 * @see AiProxy
 */
class AiProxyEntities : IPluginEntities {

  companion object {
    private val logger = LoggerFactory.getLogger(AiProxyEntities::class.java)

    /**
     * The JPA [EntityManagerFactory] provided by Formcycle after schema migration completes. Used
     * by [AiProxy] to create per-request entity managers for audit logging. `null` until
     * [onDatabaseReady] is called.
     */
    @Volatile
    @JvmStatic
    var entityManagerFactory: EntityManagerFactory? = null
      private set
  }

  override fun getName(): String = "CodBi_AI_Proxy_Entities"

  /**
   * Returns the Liquibase changelog that creates the `codbi_ai_proxy` audit table. Formcycle runs
   * this automatically during plugin initialisation.
   */
  override fun getLiquibaseScripts(): List<String> =
      listOf("db/changelog/codbi-ai-proxy-changelog.xml")

  /**
   * Called by Formcycle after the Liquibase migration has completed successfully. Stores the
   * [EntityManagerFactory] so that [AiProxy] can use it for audit logging.
   *
   * @param params Provides the JPA entity manager factory and plugin entity manager.
   */
  @Throws(FCPluginException::class)
  override fun onDatabaseReady(params: IPluginEntitiesParams) {
    entityManagerFactory = params.entityManagerFactory
    log("INFO", "Database ready — EntityManagerFactory available for audit logging")
  }

  /** Simple console logger following the CodBi convention. */
  private fun log(level: String, message: String) {
    val formatted = "[[ CodBi / AI / Proxy / DB ] $message ]"
    when (level) {
      "INFO" -> logger.info(formatted)
      "WARNING" -> logger.warn(formatted)
      "ERROR" -> logger.error(formatted)
    }
  }
}
