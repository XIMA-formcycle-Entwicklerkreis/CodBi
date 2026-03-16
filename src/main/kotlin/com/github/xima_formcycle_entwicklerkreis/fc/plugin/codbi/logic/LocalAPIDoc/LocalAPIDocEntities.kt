package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.LocalAPIDoc

import de.xima.fc.interfaces.plugin.param.entities.IPluginEntitiesParams
import de.xima.fc.plugin.entities.IPluginEntities
import de.xima.fc.plugin.exception.FCPluginException
import javax.persistence.EntityManagerFactory
import org.slf4j.LoggerFactory

/**
 * # CodBi Local API Doc — Database Plugin
 *
 * Manages the database lifecycle for the Local API Documentation storage table
 * (`codbi_local_apidoc`). Uses Formcycle's system database.
 *
 * Formcycle auto-discovers this class because it implements [IPluginEntities].
 *
 * @see StructuredDataStoreAction
 */
class LocalAPIDocEntities : IPluginEntities {
  companion object {
    private val logger = LoggerFactory.getLogger(LocalAPIDocEntities::class.java)

    @Volatile
    @JvmStatic
    var entityManagerFactory: EntityManagerFactory? = null
      private set
  }

  override fun getName(): String = "CodBi_LocalAPIDoc_Entities"

  override fun getLiquibaseScripts(): List<String> =
      listOf("db/changelog/codbi-local-apidoc-changelog.xml")

  @Throws(FCPluginException::class)
  override fun onDatabaseReady(params: IPluginEntitiesParams) {
    entityManagerFactory = params.entityManagerFactory

    logger.info("[[ CodBi / LocalAPIDoc / DB ] Database ready — EntityManagerFactory available ]")
  }
}
