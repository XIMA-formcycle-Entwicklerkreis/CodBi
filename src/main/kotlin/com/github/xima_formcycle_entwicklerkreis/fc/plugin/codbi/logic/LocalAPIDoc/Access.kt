package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.LocalAPIDoc

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.CodbiFormResourcesPlugin
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonSyntaxException
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeValidationResult
import de.xima.fc.interfaces.plugin.lifecycle.IPluginValidationData
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.io.IOException
import java.net.HttpURLConnection
import java.nio.charset.StandardCharsets
import java.util.concurrent.locks.ReentrantReadWriteLock
import kotlin.concurrent.read
import kotlin.concurrent.write
import org.slf4j.LoggerFactory

/**
 * A servlet action plugin that provides an endpoint for storing and retrieving structured JSON
 * data. Data is persisted to the database via [LocalAPIDocEntities].
 */
class StructuredDataStoreAction : IPluginServletAction {
  /** Stores a CSV of all usernames that're allowed to sync the API-Documentation. */
  @Volatile private var syncUsers: List<String> = emptyList()
  /** Stores the local API documentation. */
  private var documentation: String = ""
  /** Stores the retrieved functionality code. */
  private var code: String = ""
  /** The database key for the main documentation JSON. */
  private val documentationKey = "documentation"
  /** Serializer / Deserializer. */
  private val gson: Gson = GsonBuilder().setPrettyPrinting().create()
  /** Read / Write locker. */
  private val lock = ReentrantReadWriteLock()

  /**
   * Initializes the plugin by loading configuration.
   *
   * @param configData The initialization data provided by Formcycle.
   */
  override fun initialize(configData: IPluginInitializeData) {
    setSyncUsers(configData.properties.getProperty("APIDoc_UsersAllowedToSYNC"))
  }

  /**
   * Configuration validation
   *
   * @param configData The validation data.
   * @return [null]
   */
  override fun validateConfigurationData(
      configData: IPluginValidationData
  ): IPluginInitializeValidationResult? {
    setSyncUsers(configData.properties.getProperty("APIDoc_UsersAllowedToSYNC"))

    return null
  }

  /**
   * The name of this plugin servlet action.
   *
   * @return The name string "CodBi_LocalAPIDoc".
   */
  override fun getName(): String {
    return "CodBi_LocalAPIDoc"
  }

  /**
   * Retrieves or updates the API-Documentation depending on the provided "X-Action" set within the
   * [params] headerMap (either "Retrieve" or "Update"). An "Update" overwrites existing data.
   * *
   *
   * @param params Parameters provided by Formcycle for the servlet action.
   * @return An IPluginServletActionRetVal containing the response.
   */
  public override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val mode = params.headerMap["X-Action"]
    val servletResponse = ServletResponse(EResponseType.JSON)

    servletResponse.encoding = StandardCharsets.UTF_8.name()
    val currentUser = params.user.userName?.trim()?.lowercase()

    when (mode?.uppercase()) {
      "SYNC ALLOWED" ->
          if (!isSyncAllowed(currentUser)) {
            servletResponse.value = "{\"status\": \"error\", \"message\": \"FALSE\"}"
            servletResponse.httpStatusCode = HttpURLConnection.HTTP_OK

            return PluginServletActionRetVal(servletResponse)
          } else {
            servletResponse.value = "{\"status\": \"success\", \"message\": \"TRUE\"}"
            servletResponse.httpStatusCode = HttpURLConnection.HTTP_OK

            return PluginServletActionRetVal(servletResponse)
          }

      "RENAME CODE" -> {
        if (!isSyncAllowed(currentUser)) {
          servletResponse.value = "{\"status\": \"error\", \"message\": \"NOT ALLOWED TO SYNC.\"}"
          servletResponse.httpStatusCode = HttpURLConnection.HTTP_BAD_REQUEST

          return PluginServletActionRetVal(servletResponse)
        }

        LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java).error("Renaming start.")
        renameCodeFile(
            params.headerMap["X-ActionDetail"],
            params.headerMap["X-Element"]?.lowercase(),
            params.headerMap["X-NewElement"]?.lowercase())
        LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java).error("Renaming end.")
      }

      "UPDATE CODE" -> {
        if (!isSyncAllowed(currentUser)) {
          servletResponse.value = "{\"status\": \"error\", \"message\": \"NOT ALLOWED TO SYNC.\"}"
          servletResponse.httpStatusCode = HttpURLConnection.HTTP_BAD_REQUEST

          return PluginServletActionRetVal(servletResponse)
        }

        val toWrite = params.requestParameters["ToWrite"]?.first()
        val detail = params.headerMap["X-ActionDetail"]

        if (toWrite == null) {
          servletResponse.value =
              "{\"status\": \"error\", \"message\": \"ToWrite header is missing.\"}"
          servletResponse.httpStatusCode = HttpURLConnection.HTTP_BAD_REQUEST

          return PluginServletActionRetVal(servletResponse)
        }

        if (detail == null) {
          servletResponse.value =
              "{\"status\": \"error\", \"message\": \"Type of CodBi-Element not specified.\"}"
          servletResponse.httpStatusCode = HttpURLConnection.HTTP_BAD_REQUEST

          return PluginServletActionRetVal(servletResponse)
        }

        val element = params.headerMap["X-Element"]?.lowercase()

        if (element == null) {
          servletResponse.value =
              "{\"status\": \"error\", \"message\": \"Functionality header is missing.\"}"
          servletResponse.httpStatusCode = HttpURLConnection.HTTP_BAD_REQUEST

          return PluginServletActionRetVal(servletResponse)
        }

        if (toWrite === "") {
          deleteCodeFile(element, detail)
        } else {
          lock.write {
            val result = saveCodeToFile(element, detail, toWrite)

            if (result) {
              servletResponse.value =
                  "{\"status\": \"success\", \"message\": \"Code stored successfully.\"}"
            } else {
              servletResponse.value =
                  "{\"status\": \"error\", \"message\": \"Failed storing Code — database may not be ready.\"}"
              servletResponse.httpStatusCode = HttpURLConnection.HTTP_INTERNAL_ERROR
            }
          }
        }
      }

      "CODE" -> {
        val element = params.headerMap["X-Element"]?.lowercase()
        val detail = params.headerMap["X-ActionDetail"]

        if (element == null) {
          servletResponse.value =
              "{\"status\": \"error\", \"message\": \"The CodBi-Element was not specified.\"}"
          servletResponse.httpStatusCode = HttpURLConnection.HTTP_BAD_REQUEST

          return PluginServletActionRetVal(servletResponse)
        }

        if (detail == null) {
          servletResponse.value =
              "{\"status\": \"error\", \"message\": \"Type of CodBi-Element was not specified.\"}"
          servletResponse.httpStatusCode = HttpURLConnection.HTTP_BAD_REQUEST

          return PluginServletActionRetVal(servletResponse)
        }

        var result = loadCodeFromFile(element, detail)

        lock.read {
          servletResponse.value =
              "{\"result\": \"${ result.replace("\"","<|>").replace("\r","").replace("\n","").replace("\t","")}\"}"
        }
      }

      "RETRIEVE" -> {
        loadDataFromFile()

        LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
            .info(
                "[[ CodBi / LocalAPIDoc ] RETRIEVE — documentation length=${documentation.length}, isEmpty=${documentation.isEmpty()} ]")

        lock.read {
          servletResponse.value =
              if (documentation.isEmpty())
                  "{\"fslFunctionalities\":\"\",\"detFunctionalities\":{},\"fslElementplaceholder\":\"\",\"detElementplaceholder\":{},\"fileListing\":\"\",\"detStandards\":{}}"
              else documentation
        }
      }
      "UPDATE" -> {
        if (!isSyncAllowed(currentUser)) {
          servletResponse.value =
              "{\"status\": \"error for ${params.user.userName}. Not in ${ syncUsers.toString()}\", \"message\": \"NOT ALLOWED TO SYNC.\"}"
          servletResponse.httpStatusCode = HttpURLConnection.HTTP_BAD_REQUEST

          return PluginServletActionRetVal(servletResponse)
        }

        try {
          val toWrite = params.requestParameters["ToWrite"]?.first()

          if (toWrite == null) {
            servletResponse.value =
                "{\"status\": \"error\", \"message\": \"X-ToWrite header is missing.\"}"
            servletResponse.httpStatusCode = HttpURLConnection.HTTP_BAD_REQUEST

            return PluginServletActionRetVal(servletResponse)
          }

          try {
            gson.fromJson(toWrite, Any::class.java)
          } catch (X: JsonSyntaxException) {
            servletResponse.value =
                "{\"status\": \"error\", \"message\": \"Invalid JSON format in X-ToWrite header: ${ X.message }\"}"
            servletResponse.httpStatusCode = HttpURLConnection.HTTP_BAD_REQUEST

            LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
                .error(
                    "StructuredDataStoreAction: Invalid JSON received in X-ToWrite caused: ${ X.message }")

            return PluginServletActionRetVal(servletResponse)
          }

          lock.write {
            documentation = toWrite

            if (saveDataToFile()) {
              servletResponse.value =
                  "{\"status\": \"success\", \"message\": \"Data stored successfully.\"}"

              LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
                  .info(
                      "StructuredDataStoreAction: UPDATE request handled. New documentation stored successfully.")
            } else {
              servletResponse.value =
                  "{\"status\": \"error\", \"message\": \"Database write failed — EntityManagerFactory may not be available yet.\"}"
              servletResponse.httpStatusCode = HttpURLConnection.HTTP_INTERNAL_ERROR
            }
          }
        } catch (X: IOException) {
          servletResponse.value =
              "{\"status\": \"error\", \"message\": \"Following error occured during file operation: ${ X.message }\"}"
          servletResponse.httpStatusCode = HttpURLConnection.HTTP_INTERNAL_ERROR

          LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
              .error("StructuredDataStoreAction: IO error during update: ${ X.message }")
        } catch (X: Exception) {
          servletResponse.value =
              "{\"status\": \"error\", \"message\": \"Following unexpected error occurred during UPDATE: ${ X.message }\"}"
          servletResponse.httpStatusCode = HttpURLConnection.HTTP_INTERNAL_ERROR

          LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
              .error("StructuredDataStoreAction: Unexpected error during UPDATE: ${ X.message }")
        }
      }
      else -> {
        servletResponse.value =
            "{\"status\": \"error\", \"message\": \"Action '${mode}' not supported or X-Action header missing.\"}"
        servletResponse.httpStatusCode = HttpURLConnection.HTTP_BAD_METHOD

        LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
            .error("StructuredDataStoreAction: Unsupported or missing X-Action header: $mode")
      }
    }
    return PluginServletActionRetVal(servletResponse)
  }

  /** Normalizes and stores the allowed sync users list. */
  private fun setSyncUsers(csv: String?) {
    syncUsers =
        csv?.split(",")?.map { it.trim().lowercase() }?.filter { it.isNotEmpty() } ?: emptyList()
  }

  /** Checks whether the current user is allowed to sync. */
  private fun isSyncAllowed(userName: String?): Boolean {
    return userName != null && syncUsers.contains(userName)
  }

  /**
   * Builds the database key for a code entry.
   *
   * @param element The CodBi element name.
   * @param detail The CodBi element type.
   * @return The composite key string.
   */
  private fun codeKey(element: String, detail: String): String = "${detail}_${element}"

  /** Loads the documentation JSON from the database into [documentation]. */
  private fun loadDataFromFile() {
    val content = dbLoad(documentationKey)

    lock.write { documentation = content ?: "" }
  }

  /**
   * Renames a code entry's key in the database.
   *
   * @param element The current element name.
   * @param detail The CodBi element type.
   * @param newElementname The new element name.
   */
  private fun renameCodeFile(element: String?, detail: String?, newElementname: String?) {
    if (element == null || detail == null || newElementname == null) {
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error("[[ CodBi ] Cannot rename code entry — missing element, detail, or new name.]")

      return
    }

    val oldKey = codeKey(detail, element)
    val newKey = codeKey(element, newElementname)

    dbRename(oldKey, newKey)
  }

  /**
   * Loads code content from the database.
   *
   * @param element The CodBi element name.
   * @param detail The CodBi element type.
   * @return The code content, or "NONE" if not found.
   */
  private fun loadCodeFromFile(element: String, detail: String): String {
    val content = dbLoad(codeKey(element, detail))

    if (content == null) {
      code = "NONE"

      return "NONE"
    }

    return content
  }

  /** Saves the [documentation] to the database. */
  private fun saveDataToFile(): Boolean {
    return dbSave(documentationKey, documentation)
  }

  /**
   * Saves code for the specified CodBi element to the database.
   *
   * @param element The CodBi element name.
   * @param detail The CodBi element type.
   * @param code The code content to save.
   * @return true if the save succeeded.
   */
  private fun saveCodeToFile(element: String, detail: String, code: String): Boolean {
    return dbSave(codeKey(element, detail), code)
  }

  /**
   * Deletes the code entry for the specified CodBi element from the database.
   *
   * @param element The CodBi element name.
   * @param detail The CodBi element type.
   */
  private fun deleteCodeFile(element: String, detail: String) {
    dbDelete(codeKey(element, detail))
  }

  // region Database Operations

  /**
   * Loads a value from the `codbi_local_apidoc` table by key.
   *
   * @param key The data_key to look up.
   * @return The content string, or null if not found or DB is unavailable.
   */
  private fun dbLoad(key: String): String? {
    val emf = LocalAPIDocEntities.entityManagerFactory

    if (emf == null) {
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error("[[ CodBi / LocalAPIDoc ] Database not ready — cannot load key '$key' ]")

      return null
    }

    val em = emf.createEntityManager()

    try {
      val results =
          em.createNativeQuery("SELECT content FROM codbi_local_apidoc WHERE data_key = ?1")
              .apply { setParameter(1, key) }
              .resultList

      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .info("[[ CodBi / LocalAPIDoc ] dbLoad('$key') — resultCount=${results.size} ]")

      if (results.isEmpty()) return null

      val raw = results[0]
      val value =
          when (raw) {
            is String -> raw
            is java.sql.Clob -> raw.characterStream.readText()
            else -> raw?.toString()
          }

      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .info("[[ CodBi / LocalAPIDoc ] dbLoad('$key') — valueLength=${value?.length ?: -1} ]")

      return value
    } catch (X: Exception) {
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error("[[ CodBi / LocalAPIDoc ] Error loading key '$key': ${X.message} ]")

      return null
    } finally {
      try {
        em.close()
      } catch (_: Exception) {}
    }
  }

  /**
   * Saves a value to the `codbi_local_apidoc` table (upsert).
   *
   * @param key The data_key to store under.
   * @param content The content to store.
   * @return true if the operation succeeded.
   */
  private fun dbSave(key: String, content: String): Boolean {
    val emf = LocalAPIDocEntities.entityManagerFactory

    if (emf == null) {
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error("[[ CodBi / LocalAPIDoc ] Database not ready — cannot save key '$key' ]")

      return false
    }

    val em = emf.createEntityManager()

    try {
      em.transaction.begin()

      val existing =
          em.createNativeQuery("SELECT id FROM codbi_local_apidoc WHERE data_key = ?1")
              .apply { setParameter(1, key) }
              .resultList

      if (existing.isEmpty()) {
        em.createNativeQuery(
                "INSERT INTO codbi_local_apidoc (data_key, content, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP)")
            .apply {
              setParameter(1, key)
              setParameter(2, content)
              executeUpdate()
            }
      } else {
        em.createNativeQuery(
                "UPDATE codbi_local_apidoc SET content = ?1, updated_at = CURRENT_TIMESTAMP WHERE data_key = ?2")
            .apply {
              setParameter(1, content)
              setParameter(2, key)
              executeUpdate()
            }
      }

      em.transaction.commit()

      return true
    } catch (X: Exception) {
      if (em.transaction.isActive) {
        try {
          em.transaction.rollback()
        } catch (_: Exception) {}
      }

      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error("[[ CodBi / LocalAPIDoc ] Error saving key '$key': ${X.message} ]")

      return false
    } finally {
      try {
        em.close()
      } catch (_: Exception) {}
    }
  }

  /**
   * Deletes a row from the `codbi_local_apidoc` table by key.
   *
   * @param key The data_key to delete.
   */
  private fun dbDelete(key: String) {
    val emf = LocalAPIDocEntities.entityManagerFactory

    if (emf == null) {
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error("[[ CodBi / LocalAPIDoc ] Database not ready — cannot delete key '$key' ]")

      return
    }

    val em = emf.createEntityManager()

    try {
      em.transaction.begin()
      em.createNativeQuery("DELETE FROM codbi_local_apidoc WHERE data_key = ?1").apply {
        setParameter(1, key)
        executeUpdate()
      }
      em.transaction.commit()

      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .info("[[ CodBi / LocalAPIDoc ] Deleted entry with key '$key' ]")
    } catch (X: Exception) {
      if (em.transaction.isActive) {
        try {
          em.transaction.rollback()
        } catch (_: Exception) {}
      }

      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error("[[ CodBi / LocalAPIDoc ] Error deleting key '$key': ${X.message} ]")
    } finally {
      try {
        em.close()
      } catch (_: Exception) {}
    }
  }

  /**
   * Renames a key in the `codbi_local_apidoc` table.
   *
   * @param oldKey The current data_key.
   * @param newKey The new data_key.
   */
  private fun dbRename(oldKey: String, newKey: String) {
    val emf = LocalAPIDocEntities.entityManagerFactory

    if (emf == null) {
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error(
              "[[ CodBi / LocalAPIDoc ] Database not ready — cannot rename key '$oldKey' to '$newKey' ]")

      return
    }

    val em = emf.createEntityManager()

    try {
      em.transaction.begin()
      em.createNativeQuery(
              "UPDATE codbi_local_apidoc SET data_key = ?1, updated_at = CURRENT_TIMESTAMP WHERE data_key = ?2")
          .apply {
            setParameter(1, newKey)
            setParameter(2, oldKey)
            executeUpdate()
          }
      em.transaction.commit()
    } catch (X: Exception) {
      if (em.transaction.isActive) {
        try {
          em.transaction.rollback()
        } catch (_: Exception) {}
      }

      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error(
              "[[ CodBi / LocalAPIDoc ] Error renaming key '$oldKey' to '$newKey': ${X.message} ]")
    } finally {
      try {
        em.close()
      } catch (_: Exception) {}
    }
  }

  // endregion Database Operations
}
