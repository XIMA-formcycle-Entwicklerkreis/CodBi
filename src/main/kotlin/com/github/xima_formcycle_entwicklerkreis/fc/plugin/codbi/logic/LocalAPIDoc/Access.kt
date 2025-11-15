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
import java.nio.file.Path
import java.util.concurrent.locks.ReentrantReadWriteLock
import kotlin.concurrent.read
import kotlin.concurrent.write
import kotlin.io.path.moveTo
import org.slf4j.LoggerFactory

/**
 * A servlet action plugin that provides an endpoint for storing and retrieving structured JSON
 * data. Data is persisted to a file on the server using Formcycle's IPluginFileHelper.
 */
class StructuredDataStoreAction : IPluginServletAction {
  /** Stores a CSV of all usernames that're allowed to sync the API-Documentation. */
  protected var syncUsers: List<String>? = emptyList()
  /** Stores the local API documentation. */
  private var documentation: String = ""
  /** Stores the retrieved functionality code. */
  private var code: String = ""
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
    syncUsers = configData.properties.getProperty("APIDoc_UsersAllowedToSYNC")?.split(",")
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
    syncUsers = configData.properties.getProperty("APIDoc_UsersAllowedToSYNC")?.split(",")

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

    when (mode?.uppercase()) {
      "SYNC ALLOWED" ->
          if (syncUsers?.contains(params.user.userName?.trim()) != true) {
            servletResponse.value = "{\"status\": \"success\", \"message\": \"FALSE\"}"
            servletResponse.httpStatusCode = HttpURLConnection.HTTP_OK

            return PluginServletActionRetVal(servletResponse)
          } else {
            servletResponse.value = "{\"status\": \"success\", \"message\": \"TRUE\"}"
            servletResponse.httpStatusCode = HttpURLConnection.HTTP_OK

            return PluginServletActionRetVal(servletResponse)
          }

      "RENAME CODE" -> {
        if (syncUsers?.contains(params.user.userName?.trim()) != true) {
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
        if (syncUsers?.contains(params.user.userName?.trim()) != true) {
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
                  "{\"status\": \"success\", \"message\": \"Failed storing Code.\"}"
            }

            LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
                .info(
                    "StructuredDataStoreAction: UPDATE request handled. New code stored successfully.")
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

        lock.read {
          servletResponse.value =
              if (documentation.isEmpty())
                  "{\"fslFunctionalities\":\"\",\"detFunctionalities\":{},\"fslElementplaceholder\":\"\",\"detElementplaceholder\":{},\"fileListing\":\"\",\"detStandards\":{}}"
              else documentation
        }
      }
      "UPDATE" -> {
        if (syncUsers?.contains(params.user.userName?.trim()) != true) {
          servletResponse.value = "{\"status\": \"error\", \"message\": \"NOT ALLOWED TO SYNC.\"}"
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

            saveDataToFile()
            servletResponse.value =
                "{\"status\": \"success\", \"message\": \"Data stored successfully.\"}"

            LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
                .info(
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
   * Determine API-Doc-File's path by creating it, if necessary.
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

  /**
   * Determine lokal Code-File's path by creating it, if necessary.
   *
   * @param functionality The path an name of the local functionality to retrieved the code for.
   * @return The [java.io.File] pointing to the specified functionality's code.
   */
  private fun getPluginCodeFile(element: String?, detail: String?): File? {
    val pluginDir: File? = fileHelper?.pluginFolder

    if (pluginDir == null) {
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error("The plugin's directory for storage is not available.")

      return null
    }

    if (!pluginDir.exists()) {
      pluginDir.mkdirs()
    }

    return File(pluginDir, "${detail}_${element}.js")
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

  /**
   * Renames the specified CodBi-Element-Code at file level.
   *
   * @param element The name of the CodBi-Element (e.g. demo.apidoc.ep).
   * @param detail The type of CodBi-Element (e.g. Functionality, Elementplaceholder, Standard.
   */
  private fun renameCodeFile(element: String?, detail: String?, newElementname: String?) {
    try {
      val oldPath: Path? = getPluginCodeFile(detail, element)?.toPath()
      val newPath: Path? = oldPath?.resolveSibling(element + "_" + newElementname + ".js")

      if (newPath !== null) oldPath.moveTo(newPath)
      else {
        LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
            .error(
                "[[ CodBi ] Trying to rename Code-File but new path \"" +
                    oldPath?.resolveSibling(element + "_" + newElementname + ".js") +
                    "\" could not be create from old path \"" +
                    oldPath +
                    "\".]")
      }
    } catch (X: Exception) {
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error(
              "[[ CodBi ] Trying to rename Code-File but following exception occurred: \"${ X.toString() }\".]")
    }
  }

  /** Attempts to load the local API-Documentation into [documentation]. */
  private fun loadCodeFromFile(element: String, detail: String): String {
    val dataFile: File? = getPluginCodeFile(element, detail)

    if (dataFile == null) {
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error("Code file for ${ element } could not be found.")

      code = "NONE"

      return "NONE"
    }

    lock.write {
      if (dataFile.exists() && dataFile.length() > 0) {
        try {
          return dataFile.readText(StandardCharsets.UTF_8)
        } catch (X: IOException) {
          LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
              .error(
                  "Following error loading data from file '${ dataFile.absolutePath }': ${ X.message }")

          code = "NONE"

          return "NONE"
        } catch (X: Exception) {
          LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
              .error(
                  "Following unexpected error loading data from file '${dataFile.absolutePath}': ${ X.message}")

          code = "NONE"

          return "NONE"
        }
      } else {
        LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
            .error(
                "Either there is no existing data file at '${ dataFile.absolutePath } (lenght is ${ dataFile.length()})' or the file is empty.")

        code = "NONE"

        return "NONE"
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

  /**
   * Saves the given [code] for the specified CodBi-[element].
   *
   * @param element The CodBi-[element] which's code shall be saved.
   * @param detail The type of CodBi-[element].
   * @param code The [code] to be saved.
   */
  private fun saveCodeToFile(element: String, detail: String, code: String): Boolean {
    val dataFile: File? = getPluginCodeFile(element, detail)

    if (dataFile == null) {
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error("Data file could not be determined for saving.")

      return false
    }

    try {
      dataFile.writeText(code, StandardCharsets.UTF_8)
    } catch (X: Exception) {
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error(
              "Following error occured saving local API-Documentation to file '${ dataFile.absolutePath }': ${ X.message }")
    }

    return true
  }

  /**
   * Deletes the file containing the code for the specified [element].
   *
   * @param element The path and name of the CodBi-Element which's code shall be removed.
   * @param detail The type of CodBi-Element.
   */
  private fun deleteCodeFile(element: String, detail: String) {
    // Determine the file path based on the functionality string.
    val dataFile: File? = getPluginCodeFile(element, detail)

    // Check if the file object was successfully determined.
    if (dataFile == null) {
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error("Data file could not be determined for deletion.")
      return
    }

    try {
      // Attempt to delete the file.
      val isDeleted = dataFile.delete()

      if (isDeleted) {
        // Log a success message if the deletion was successful.
        LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
            .info("Successfully deleted file: '${dataFile.absolutePath}'")
      } else {
        // Log an error if the file could not be deleted,
        // which can happen if it doesn't exist or permissions are an issue.
        LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
            .warn("File could not be deleted: '${dataFile.absolutePath}'. It may not exist.")
      }
    } catch (X: Exception) {
      // Catch and log any exceptions that occur during the deletion process.
      LoggerFactory.getLogger(CodbiFormResourcesPlugin::class.java)
          .error("Following error occurred deleting file '${dataFile.absolutePath}': ${X.message}")
    }
  }
}
