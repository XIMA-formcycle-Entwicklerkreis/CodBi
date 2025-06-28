package com.github.your_organization.fc.plugin.LocalAPIDoc

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.CodbiFormResourcesPlugin
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonSyntaxException
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeValidationResult
import de.xima.fc.interfaces.plugin.lifecycle.IPluginValidationData
import de.xima.fc.interfaces.plugin.lifecycle.helper.IPluginFileHelper
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.nio.charset.StandardCharsets
import java.util.concurrent.locks.ReentrantReadWriteLock
import kotlin.concurrent.read
import kotlin.concurrent.write
import org.slf4j.LoggerFactory

/**
 * A servlet action plugin that provides an endpoint for storing and retrieving structured JSON
 * data. Data is persisted to a file on the server using Formcycle's IPluginFileHelper.
 */
class StructuredDataStoreAction : IPluginServletAction {
  /** Stores the local API documentation. */
  private var documentation: String = ""
  /** Accessor to the plugin's file storage. */
  private var fileHelper: IPluginFileHelper? = null
  /** States the documentation storage's file name. */
  private val dataFileName = "LocalAPIDocumentation.json"
  /** Serializer / Deserializer. */
  private val gson: Gson = GsonBuilder().setPrettyPrinting().create()
  /** Read / Write locker. */
  private val lock = ReentrantReadWriteLock()

  /**
   * Initializes the plugin by retrieving the [fileHelper].
   *
   * @param configData The initialization data provided by Formcycle.
   */
  override fun initialize(configData: IPluginInitializeData) {
    this.fileHelper = configData.fileHelper
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
    loadDataFromFile()

    val mode = params.headerMap["X-Action"]
    val servletResponse = ServletResponse(EResponseType.JSON)
    servletResponse.encoding = StandardCharsets.UTF_8.name()

    when (mode?.uppercase()) {
      "RETRIEVE" -> {
        lock.read { servletResponse.value = documentation }
      }
      "UPDATE" -> {
        try {
          val toWrite = params.headerMap["X-ToWrite"]

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

            saveDataToFile()
            servletResponse.value =
                "{\"status\": \"success\", \"message\": \"Data stored successfully.\"}"

            LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
                .error(
                    "StructuredDataStoreAction: UPDATE request handled. New documentation stored successfully.")
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

  /**
   * Determine API-Doc-File's path by creating it, if neccessary.
   *
   * @return The [java.io.File] pointing to the API-Doc-Storage.
   */
  private fun getPluginDataFile(): File? {
    val pluginDir: File? = fileHelper?.pluginFolder

    if (pluginDir == null) {
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error("The plugin's directory for storage is not available.")

      return null
    }

    if (!pluginDir.exists()) {
      pluginDir.mkdirs()
    }

    return File(pluginDir, dataFileName)
  }

  /** Attempts to load the local API-Documentation into [documentation]. */
  private fun loadDataFromFile() {
    val dataFile: File? = getPluginDataFile()

    if (dataFile == null) {
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error("The local API-Documentation storage file could not be found.")

      return
    }

    lock.write {
      if (dataFile.exists() && dataFile.length() > 0) {
        try {
          documentation = dataFile.readText(StandardCharsets.UTF_8)
        } catch (X: JsonSyntaxException) {
          LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
              .error(
                  "Corrupted JSON data in file '${dataFile.absolutePath}'. Deleting and starting fresh. Exception: ${ X.message }")
          dataFile.delete()

          documentation = ""
        } catch (X: IOException) {
          LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
              .error(
                  "Following error loading data from file '${ dataFile.absolutePath }': ${ X.message }")

          documentation = ""
        } catch (X: Exception) {
          LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
              .error(
                  "Following unexpected error loading data from file '${dataFile.absolutePath}': ${ X.message}")

          documentation = ""
        }
      } else {
        LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
            .error(
                "Either there is no existing data file at '${ dataFile.absolutePath }' or the file is empty. Starting with empty data.")

        documentation = ""
      }
    }
  }

  /** Saves the [documentation] to the plugin's dedicated file. */
  private fun saveDataToFile() {
    val dataFile: File? = getPluginDataFile()

    if (dataFile == null) {
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error("Data file could not be determined for saving.")

      return
    }

    try {
      dataFile.writeText(documentation, StandardCharsets.UTF_8)
    } catch (X: Exception) {
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error(
              "Following error occured saving local API-Documentation to file '${ dataFile.absolutePath }': ${ X.message }")
    }
  }
}
