package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai

//region Imports
//region CodBi
//endregion CodBi
//region XIMA
//endregion XIMA
//region Tesseract
//endregion Tesseract
//region JSON
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI
import com.google.gson.Gson
import com.google.gson.JsonSyntaxException
import com.google.gson.reflect.TypeToken
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeValidationResult
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginValidationData
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import java.io.File
import java.net.URI
import java.net.URL
import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import java.util.concurrent.*
import java.util.jar.JarFile
import javax.servlet.ServletException
import net.sourceforge.tess4j.ITessAPI
import net.sourceforge.tess4j.TessAPI1

//endregion JSON
//endregion Imports
/**
 * Performs OCR on one or multiple images using the
 * [Tesseract](https://github.com/tesseract-ocr/tesseract).
 *
 * Returns either the whole text of the document(s) parsed or, if a **X-OCR-Regex** is found in the
 * header, the text matching a specified regular expression, the text matching multiple named
 * regular expressions or whether the text matches a specified regular expression.
 *
 * Reusing images that were already uploaded is possible in order to optimize traffic. Passing an
 * **X-OCR-Image-ID** within the header when requesting the **CodBi_Tesseract**-Action will make the
 * image persist for a specific amount of milliseconds ([msExpirationIDedImages]). The expiration
 * may be changed using the **AI_Tesseract_IDedImageExpiration**-Plugin-Property.
 *
 * Formcycle upload-fields that take advantage of CodBi's **Media.MultipleDownload** thus uploaded
 * more than one image are supported. The JSON returned will hold the properties named according to
 * the transmitted file's names holding the found text. */
class TesseractAction : AI() {
  /**
   * States whether this [TesseractAction] is currently active or not (**Active_AI** contains
   * **OCR** or not). */
  protected var active = false
  /** The CodBi-Plugin's root directory. */
  private var pluginRoot: File? = null
  /** The tesseract-handle pool. */
  private val pool = LinkedBlockingQueue<ITessAPI.TessBaseAPI>()

  /** Tracks whether initialization finished successfully. */
  @Volatile private var ready = false

  /**
   * Specifies the size of the [pool]. Defaults to 2 to not exhaust the server. One should consider
   * the number of available CPU-Cores & RAM when determining the proper value for this property. A
   * good practice is Number of CPU-Cores / 2 = sizePool but RAM has also to be considered.
   * Calculate about 100MB per loaded language model. That is the approximate size of RAM needed for
   * one pool. So setting the [sizePool] to 2, will most probably consume 200MB. */
  private val sizePool = 2

  /**
   * The name of this [IPluginServletAction].
   *
   * @return The requested [String]. */
  override fun getName() = "CodBi_AI_Tesseract"

  /**
   * Initializes this plugin if the CodBi-Plugin-Property **Active_AI** contains **OCR**. By
   * determining the [pluginRoot] it tells the [execute]-method where to store the temporary images.
   * Furthermore, the appropriate native libraries for the server's os will be extracted from the
   * JAR and copied onto the server's drive prior to being cloned to be provided as versions that
   * won't be locked due to possible previous initializations of the plugin. This servlet will check
   * if the appropriate models for the languages specified via the CodBi-Plugin-Property
   * **AI_Tesseract_Languages** (e.g. deu+ita+eng or just deu) are already present within the
   * Plugin's local resources and download the model for each language automatically, if not. If the
   * property is not set **deu** will be assumed.
   *
   * @param configData The [IPluginInitializeData] as provided by the formcycle environment. */
  override fun initialize( configData: IPluginInitializeData ) {
    val aiRemove = configData.properties.getProperty("AI_Remove")?.lowercase() ?: ""
    if( aiRemove.contains("ocr")) {
      wipeLocalData()
      ready = false
      active = false
      return
    }
    
    //region Remove local native libs and models, if no OCR configured.
    if(!( configData.properties.getProperty("Active_AI")?.lowercase() ?: "").contains("ocr")) {
      wipeLocalData()
      ready = false

      return
    }

    active = true
    ready = false
    //endregion Remove local native libs and models, if no OCR configured.
    //region Begin the observation of the [cacheIDedImages].
    janitorIDedImages = Executors.newSingleThreadScheduledExecutor()

    startJanitor()
    //endregion Begin the observation of the [AI.cacheIDedImages].
    pluginRoot = configData.fileHelper.pluginFolder

    try {
      val root = pluginRoot ?: return

      //region Remove former library-clones.
      val tmpDir = root.resolve("Resources/AI/Tesseract/TmpNatives").apply { mkdirs() }
      tmpDir
          .listFiles { file -> file.isDirectory && file.name.startsWith("tesseract_run_") }
          ?.forEach { oldFolder -> oldFolder.deleteRecursively() }
      //endregion Remove former library-clones.

      //region Resolve platform & ensure runtime libs
      val os   = System.getProperty("os.name").lowercase()
      val arch = System.getProperty("os.arch").lowercase()
      val platformDirName =
          when {
            os.contains("win")   -> "win32-x86-64"
            os.contains("linux") -> "linux-x86-64"
            os.contains("mac")   -> "darwin-aarch64"
            else                 -> "unknown" }
      val dirNativeLibs =
          root.resolve("Resources/AI/Tesseract/Runtime/${ platformDirName }").apply { mkdirs() }

      if( os.contains("win")) ensureWindowsNativeLibs( dirNativeLibs, arch )
      else ensurePosixNativeLibs( dirNativeLibs, os, arch )
      //endregion Resolve platform & ensure runtime libs

      //region Clone libs into a fresh run dir (avoid locked DLLs)
      val dirTempNativeLibs = File( tmpDir, "tesseract_run_${ System.currentTimeMillis()}" )
      dirTempNativeLibs.mkdirs()
      dirNativeLibs.listFiles()?.forEach { file -> file.copyTo( File( dirTempNativeLibs, file.name ), overwrite = true ) }
      //endregion Clone libs into a fresh run dir (avoid locked DLLs)

      //region Ensure traineddata
      val tessDataDir = root.resolve("Resources/AI/Tesseract/Models").apply { mkdirs() }
      val languages = configData.properties.getProperty("AI_Tesseract_Languages")
      val langs =
          if( languages.isNullOrBlank() ) listOf("de")
          else languages.split("+").map { it.trim() }.filter { it.isNotBlank() }
      langs.forEach { lang -> ensureTessData( tessDataDir, lang ) }
      //endregion Ensure traineddata

      //region Initialize pool
      val langArg =
          if( languages.isNullOrBlank() ) "de"
          else languages.replace(" ", "")
      repeat( sizePool ) {
        try {
          System.setProperty( "jna.library.path", dirTempNativeLibs.absolutePath )
          System.setProperty( "net.sourceforge.tess4j.extract.path", dirTempNativeLibs.absolutePath )
          System.setProperty( "net.sourceforge.tess4j.skip.extract", "true" )
          val tesseract = TessAPI1.TessBaseAPICreate()
          if( TessAPI1.TessBaseAPIInit3( tesseract, tessDataDir.absolutePath, langArg ) != 0 )
              throw ServletException("[[ CodBi / AI /Tesseract ] Unknown initialization failure.]")
          pool.put( tesseract )
        } catch( X: Throwable ) {
          log( LogLevel.WARNING, "Non fatal exception during Tesseract init: ${ X.message }", "", X )
        }
      }
      //endregion Initialize pool

      ready = true
      log( LogLevel.INFO, "Tesseract initialized." )
    } catch( X: Throwable ) {
      ready = false
      log( LogLevel.ERROR, "Critical initialization Failure: ${ X.message }", "", X )
    }
  }
  /**
   * Wipes the local data needed to run the Tesseract, if **Active_AI** does not contain **OCR**.
   * Furthermore, **AI_Tesseract_Languages** is checked for compliance to
   * **^[a-z]{3}(\s*\+\s*[a-z]{3})*$**, if it is set.
   *
   * @param configData The [IPluginValidationData] as provided by the formcycle environment.
   *
   * @return Always **NULL**.
   *
   * @throws IllegalArgumentException If **AI_Tesseract_Languages** does not comply to **^[a-z]{3}(\s*\+\s*[a-z]{3})*$**. */
  @Throws( IllegalArgumentException::class )
  override fun validateConfigurationData( configData: IPluginValidationData ): IPluginInitializeValidationResult? {
    if( configData.properties.getProperty("Active_AI").isNullOrEmpty()) return null
    // Remove local native libs and models, if no OCR configured.
    if(!( configData.properties.getProperty("Active_AI")?.lowercase() ?: "").contains("OCR")) wipeLocalData()

    if(!Regex("""^[a-z]{3}(\s*\+\s*[a-z]{3})*$""")
        .matches( configData.properties.getProperty("AI_Tesseract_Languages")))
        throw IllegalArgumentException(
            "[[ CodBi / AI / Tesseract ] Config property AI_Tesseract_Languages, if set, has to match to following regular expression: ^[a-z]{3}(\\s*\\+\\s*[a-z]{3})*\$.")

    return null }
  /**
   * Does, if activated by the CodBi-Plugin-Property **Active_AI** containing **OCR**, use [AI]'s
   * janitor to store images that have an ID (if transmitted in the header **X-OCR-Image-ID**) and
   * extracts all the text from the transmitted, or via **X-OCR-Image-ID** specified, images.
   *
   * #### **X-Mode** Options (case-insensitive):
   * - **print (default)**: Plain text extraction - extracts all text from the image(s).
   * - **extract**:         Extracts text from image(s) and returns only the parts that match the regex
   *                        pattern specified in the **X-Pattern** header.
   * - **verify**:          Extracts text from image(s) and checks if the text matches the regex pattern
   *                        specified in the **X-Pattern** header.
   * - **extract fields**:  Extracts text from image(s) and applies multiple regex patterns from the
   *                        **X-FieldPatterns** header (JSON array) to extract field values.
   *
   * @param params As provided by the formcycle environment.
   *
   * @return A proper [IPluginServletActionRetVal]. */
  override fun execute( params: IPluginServletActionParams ): IPluginServletActionRetVal {
    //region Check if the Tesseract is active.
    if(!active ) {
      log(
          LogLevel.ERROR,
          "The Tesseract was invoked but is currently not active. In order to activate it the keyword \"OCR\" has to be placed into the CodBi-Plugin-Property \"Active_AI\".")

      return PluginServletActionRetVal(
          ServletResponse( EResponseType.JSON,
              "{\"error\":\"The Tesseract is currently not active. In order to activate it the keyword OCR has to be placed into the CodBi-Plugin-Property Active_AI.\"}"))}
    //endregion Check if the Tesseract is active.
    if( !ready ) return PluginServletActionRetVal( ServletResponse( EResponseType.JSON, "{\"error\":\"Tesseract is not initialized\"}" ) )
    //region Get mode from X-Mode header (case-insensitive)
    val modeHeader  = params.headerMap.entries.find { it.key.equals("X-Mode", ignoreCase = true ) }?.value?.trim()
    val mode        = modeHeader?.lowercase()
    //endregion Get mode from X-Mode header (case-insensitive)
    when( mode ) {
      "print"           -> return executeModePrint( params )
      "extract"         -> return executeModeExtract( params )
      "verify"          -> return executeModeVerify( params )
      "extract fields"  -> return executeModeExtractFields( params )
      null              -> return PluginServletActionRetVal( ServletResponse( EResponseType.JSON,
          "{\"error\":\"No X-Mode specified. Specify a modus operandi (print,verify, extract, or extract fields).\"}"))
      else              -> return PluginServletActionRetVal( ServletResponse( EResponseType.JSON,
          "{\"error\":\"Unsupported X-Mode in request-header:${ modeHeader }\"}"))}
  }
  /**
   * Mode print: Plain text extraction - extracts all text from the image(s).
   *
   * @param params As provided by the formcycle environment.
   *
   * @return A proper [IPluginServletActionRetVal]. */
  private fun executeModePrint( params: IPluginServletActionParams ): IPluginServletActionRetVal {
    if( params.uploadFiles.isNullOrEmpty() && params.headerMap["X-OCR-Image-ID"].isNullOrEmpty()) {
      log(
          LogLevel.ERROR,
          "No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with.")

      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with.\"}"))
    }
    val ocrResults = mutableMapOf<String, String>()
    val filesToDelete = mutableListOf<File>()

    try {
      if(!params.uploadFiles.isNullOrEmpty()) {
        params.uploadFiles?.forEach { ( inputName, fileItem ) ->
          val distinctImageID = "${params.headerMap["X-OCR-Image-ID"]}::${inputName}"
          var tempFile: File? = null
          var shouldDeleteThisFile = true
          //region Check if the image is already cached.
          if( distinctImageID.isNotBlank() && cacheIDedImages.containsKey( distinctImageID )) {
            tempFile = cacheIDedImages[distinctImageID]?.file
            shouldDeleteThisFile = false
          }
          //endregion Check if the image is already cached.
          //region Create file if not in cache and cache it X-OCR-Image-ID is set in header.
          if( tempFile == null || !tempFile.exists()) {
            tempFile = kotlin.io.path.createTempFile("ocr_${inputName}_", ".png").toFile()

            fileItem.stream().use { input ->
              val bytes = input.map { it.data }.reduce { acc, b -> acc + b }.orElse( byteArrayOf())

              tempFile!!.writeBytes( bytes )
            }

            if( distinctImageID.isNotBlank()) {
              cacheIDedImages[distinctImageID] = CachedImage( tempFile!!)
              shouldDeleteThisFile = false
            }
          }
          //endregion Create file if not in cache and cache it X-OCR-Image-ID is set in header.
          if( shouldDeleteThisFile ) filesToDelete.add( tempFile!!)
          //region OCR Processing
          val handle =
              pool.poll( 10, TimeUnit.SECONDS ) ?: throw IllegalStateException("Pool exhausted")
          try {
            TessAPI1.TessBaseAPIProcessPages( handle, tempFile!!.absolutePath, null, 0, null )

            val ptr = TessAPI1.TessBaseAPIGetUTF8Text( handle )

            if( ptr != null ) {
              if( params.headerMap["X-Pattern"].isNullOrEmpty())
                  ocrResults[inputName] = ptr.getString( 0, "UTF-8").trim()
              else {
                ocrResults[inputName] = ptr.getString( 0, "UTF-8") ?: ""
              }

              TessAPI1.TessDeleteText( ptr )
            }

            TessAPI1.TessBaseAPIClear( handle )
          } catch( X: Throwable ) {
            throw ServletException(
                "[[ CodBi / AI / Tesseract ] Processing ${ inputName } failed with: ${ X }.]")
          } finally {
            pool.offer( handle )
          }
          //endregion OCR Processing
        }
      } else {
        cacheIDedImages.entries
            .filter { it.key.startsWith("${ params.headerMap["X-OCR-Image-ID"] }::")}.map { it.value }
            .forEach { ( image, key ) ->
              //region OCR Processing
              val handle =
                  pool.poll( 10, TimeUnit.SECONDS ) ?: throw IllegalStateException("Pool exhausted")
              try {
                TessAPI1.TessBaseAPIProcessPages( handle, image.absolutePath, null, 0, null )

                val ptr = TessAPI1.TessBaseAPIGetUTF8Text( handle )

                if( ptr != null ) {
                  ocrResults[image.name] = ptr.getString( 0, "UTF-8").trim()

                  TessAPI1.TessDeleteText( ptr )
                }

                TessAPI1.TessBaseAPIClear( handle )
              } catch( X: Throwable ) {
                throw ServletException(
                    "[[ CodBi / AI / Tesseract ] Processing ${ image.name } failed with: ${ X }.]")
              } finally {
                pool.offer( handle )
              }
              //endregion OCR Processing
            }
      }
    } catch( e: Exception ) {
      logger.error("[[ CodBi ]] Execution Error", e )
    }
    //region Generate response
    val jsonResponse =
        ocrResults.entries.joinToString( separator = ",", prefix = "{", postfix = "}") { ( key, value )
          ->
          val escapedValue = value.replace("\"", "\\\"").replace("\n", "\\n")
          "\"$key\":\"$escapedValue\""
        }

    val servletResponse = ServletResponse( EResponseType.JSON ).apply { value = jsonResponse }
    //endregion Generate response
    return PluginServletActionRetVal( servletResponse )
  }

  /**
   * Mode extract: Extracts text from image(s) and returns only the parts that match the regex
   * pattern specified in the **X-Pattern** header.
   *
   * @param params As provided by the formcycle environment.
   *
   * @return A proper [IPluginServletActionRetVal]. */
  private fun executeModeExtract( params: IPluginServletActionParams ): IPluginServletActionRetVal {
    if( params.uploadFiles.isNullOrEmpty() && params.headerMap["X-OCR-Image-ID"].isNullOrEmpty()) {
      log(
          LogLevel.ERROR,
          "No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with.")

      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with.\"}"))
    }

    val patternHeaderEncoded = params.headerMap["X-Pattern"]?.trim()

    if( patternHeaderEncoded.isNullOrEmpty()) {
      log( LogLevel.ERROR, "Mode extract requires **X-Pattern** header to be specified.")

      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"Mode extract requires X-Pattern header to be specified.\"}"))
    }

    val patternHeader =
        try {
          URLDecoder.decode( patternHeaderEncoded, StandardCharsets.UTF_8.toString())
        } catch( e: Exception ) {
          log( LogLevel.ERROR, "Failed to decode X-Pattern header: ${ e.message }")
          return PluginServletActionRetVal(
              ServletResponse(
                  EResponseType.JSON,
                  "{\"error\":\"Failed to decode X-Pattern header: ${ e.message }\"}"))
        }
    val ocrResults = mutableMapOf<String, List<String>>()
    val filesToDelete = mutableListOf<File>()

    try {
      if(!params.uploadFiles.isNullOrEmpty()) {
        params.uploadFiles?.forEach { ( inputName, fileItem ) ->
          val distinctImageID = "${params.headerMap["X-OCR-Image-ID"]}::${inputName}"
          var tempFile: File? = null
          var shouldDeleteThisFile = true
          //region Check if the image is already cached.
          if( distinctImageID.isNotBlank() && cacheIDedImages.containsKey( distinctImageID )) {
            tempFile = cacheIDedImages[distinctImageID]?.file
            shouldDeleteThisFile = false
          }
          //endregion Check if the image is already cached.
          //region Create file if not in cache and cache it X-OCR-Image-ID is set in header.
          if( tempFile == null || !tempFile.exists()) {
            tempFile = kotlin.io.path.createTempFile("ocr_${inputName}_", ".png").toFile()

            fileItem.stream().use { input ->
              val bytes = input.map { it.data }.reduce { acc, b -> acc + b }.orElse( byteArrayOf())

              tempFile!!.writeBytes( bytes )
            }

            if( distinctImageID.isNotBlank()) {
              cacheIDedImages[distinctImageID] = CachedImage( tempFile!!)
              shouldDeleteThisFile = false
            }
          }
          //endregion Create file if not in cache and cache it X-OCR-Image-ID is set in header.
          if( shouldDeleteThisFile ) filesToDelete.add( tempFile!!)
          //region OCR Processing
          val handle =
              pool.poll( 10, TimeUnit.SECONDS ) ?: throw IllegalStateException("Pool exhausted")
          try {
            TessAPI1.TessBaseAPIProcessPages( handle, tempFile!!.absolutePath, null, 0, null )

            val ptr = TessAPI1.TessBaseAPIGetUTF8Text( handle )

            if( ptr != null ) {
              val rawText = ptr.getString( 0, "UTF-8") ?: ""

              ocrResults[inputName] =
                  try {
                    patternHeader.toRegex().findAll( rawText ).map { it.value }.toList()
                  } catch( X: Exception ) {
                    listOf("Regex Error: ${ X.message }")
                  }

              TessAPI1.TessDeleteText( ptr )
            } else {
              ocrResults[inputName] = emptyList()
            }

            TessAPI1.TessBaseAPIClear( handle )
          } catch( X: Throwable ) {
            throw ServletException(
                "[[ CodBi / AI / Tesseract ] Processing ${ inputName } failed with: ${ X }.]")
          } finally {
            pool.offer( handle )
          }
          //endregion OCR Processing
        }
      } else {
        cacheIDedImages.entries
            .filter { it.key.startsWith("${ params.headerMap["X-OCR-Image-ID"] }::") }
            .map { it.value }
            .forEach { ( image, key ) ->
              //region OCR Processing
              val handle =
                  pool.poll( 10, TimeUnit.SECONDS ) ?: throw IllegalStateException("Pool exhausted")
              try {
                TessAPI1.TessBaseAPIProcessPages( handle, image.absolutePath, null, 0, null )

                val ptr = TessAPI1.TessBaseAPIGetUTF8Text( handle )

                if( ptr != null ) {
                  val rawText = ptr.getString( 0, "UTF-8") ?: ""

                  ocrResults[image.name] =
                      try {
                        patternHeader.toRegex().findAll( rawText ).map { it.value }.toList()
                      } catch( X: Exception ) {
                        listOf("Regex Error: ${ X.message }")
                      }

                  TessAPI1.TessDeleteText( ptr )
                } else {
                  ocrResults[image.name] = emptyList()
                }

                TessAPI1.TessBaseAPIClear( handle )
              } catch( X: Throwable ) {
                throw ServletException(
                    "[[ CodBi / AI / Tesseract ] Processing ${ image.name } failed with: ${ X }.]")
              } finally {
                pool.offer( handle )
              }
              //endregion OCR Processing
            }
      }
    } catch( e: Exception ) {
      logger.error("[[ CodBi ]] Execution Error", e )
    }
    //region Generate response
    val jsonResponse =
        ocrResults.entries.joinToString( separator = ",", prefix = "{", postfix = "}") { ( key, value )
          ->
          val arrayValues =
              value.joinToString( separator = ",") { match ->
                val escaped = match.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n")
                "\"$escaped\""
              }
          "\"$key\":[$arrayValues]"
        }

    val servletResponse = ServletResponse( EResponseType.JSON ).apply { value = jsonResponse }
    //endregion Generate response
    return PluginServletActionRetVal( servletResponse )
  }

  /**
   * Mode verify: Extracts text from image(s) and checks if the text matches the regex pattern
   * specified in the **X-Pattern** header.
   *
   * @param params As provided by the formcycle environment.
   * @return A proper [IPluginServletActionRetVal] with boolean results indicating if each image's
   *   text matches the pattern. */
  private fun executeModeVerify( params: IPluginServletActionParams ): IPluginServletActionRetVal {
    if( params.uploadFiles.isNullOrEmpty() && params.headerMap["X-OCR-Image-ID"].isNullOrEmpty()) {
      log(
          LogLevel.ERROR,
          "No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with.")

      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with.\"}"))
    }
    val patternHeaderEncoded = params.headerMap["X-Pattern"]?.trim()
    if( patternHeaderEncoded.isNullOrEmpty()) {
      log( LogLevel.ERROR, "Mode verify requires **X-Pattern** header to be specified.")

      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"Mode verify requires X-Pattern header to be specified.\"}"))
    }
    val patternHeader =
        try {
          URLDecoder.decode( patternHeaderEncoded, StandardCharsets.UTF_8.toString())
        } catch( e: Exception ) {
          log( LogLevel.ERROR, "Failed to decode X-Pattern header: ${ e.message }")
          return PluginServletActionRetVal(
              ServletResponse(
                  EResponseType.JSON,
                  "{\"error\":\"Failed to decode X-Pattern header: ${ e.message }\"}"))
        }
    val verifyResults = mutableMapOf<String, Boolean>()
    val filesToDelete = mutableListOf<File>()

    try {
      if(!params.uploadFiles.isNullOrEmpty()) {
        params.uploadFiles?.forEach { ( inputName, fileItem ) ->
          val distinctImageID = "${params.headerMap["X-OCR-Image-ID"]}::${inputName}"
          var tempFile: File? = null
          var shouldDeleteThisFile = true
          //region Check if the image is already cached.
          if( distinctImageID.isNotBlank() && cacheIDedImages.containsKey( distinctImageID )) {
            tempFile = cacheIDedImages[distinctImageID]?.file
            shouldDeleteThisFile = false
          }
          //endregion Check if the image is already cached.
          //region Create file if not in cache and cache it X-OCR-Image-ID is set in header.
          if( tempFile == null || !tempFile.exists()) {
            tempFile = kotlin.io.path.createTempFile("ocr_${inputName}_", ".png").toFile()

            fileItem.stream().use { input ->
              val bytes = input.map { it.data }.reduce { acc, b -> acc + b }.orElse( byteArrayOf())

              tempFile!!.writeBytes( bytes )
            }

            if( distinctImageID.isNotBlank()) {
              cacheIDedImages[distinctImageID] = CachedImage( tempFile!!)
              shouldDeleteThisFile = false
            }
          }
          //endregion Create file if not in cache and cache it X-OCR-Image-ID is set in header.
          if( shouldDeleteThisFile ) filesToDelete.add( tempFile!!)
          //region OCR Processing
          val handle =
              pool.poll( 10, TimeUnit.SECONDS ) ?: throw IllegalStateException("Pool exhausted")
          try {
            TessAPI1.TessBaseAPIProcessPages( handle, tempFile!!.absolutePath, null, 0, null )

            val ptr = TessAPI1.TessBaseAPIGetUTF8Text( handle )

            if( ptr != null ) {
              val rawText = ptr.getString( 0, "UTF-8") ?: ""

              verifyResults[inputName] =
                  try {
                    println(
                        ">>>" +
                            patternHeader.toRegex() +
                            " - " +
                            patternHeader.toRegex().containsMatchIn( rawText ) +
                            " - " +
                            rawText )
                    patternHeader.toRegex().containsMatchIn( rawText )
                  } catch( X: Exception ) {
                    log( LogLevel.ERROR, "Regex Error in verify mode: ${ X.message }")
                    false
                  }

              TessAPI1.TessDeleteText( ptr )
            } else {
              verifyResults[inputName] = false
            }

            TessAPI1.TessBaseAPIClear( handle )
          } catch( X: Throwable ) {
            throw ServletException(
                "[[ CodBi / AI / Tesseract ] Processing ${ inputName } failed with: ${ X }.]")
          } finally {
            pool.offer( handle )
          }
          //endregion OCR Processing
        }
      } else {
        cacheIDedImages.entries
            .filter { it.key.startsWith("${ params.headerMap["X-OCR-Image-ID"] }::") }
            .map { it.value }
            .forEach { ( image, key ) ->
              //region OCR Processing
              val handle =
                  pool.poll( 10, TimeUnit.SECONDS ) ?: throw IllegalStateException("Pool exhausted")
              try {
                TessAPI1.TessBaseAPIProcessPages( handle, image.absolutePath, null, 0, null )

                val ptr = TessAPI1.TessBaseAPIGetUTF8Text( handle )

                if( ptr != null ) {
                  val rawText = ptr.getString( 0, "UTF-8") ?: ""

                  verifyResults[image.name] =
                      try {
                        patternHeader.toRegex().containsMatchIn( rawText )
                      } catch( X: Exception ) {
                        log( LogLevel.ERROR, "Regex Error in verify mode: ${ X.message }")
                        false
                      }

                  TessAPI1.TessDeleteText( ptr )
                } else {
                  verifyResults[image.name] = false
                }

                TessAPI1.TessBaseAPIClear( handle )
              } catch( X: Throwable ) {
                throw ServletException(
                    "[[ CodBi / AI / Tesseract ] Processing ${ image.name } failed with: ${ X }.]")
              } finally {
                pool.offer( handle )
              }
              //endregion OCR Processing
            }
      }
    } catch( e: Exception ) {
      logger.error("[[ CodBi ]] Execution Error", e )
    }
    //region Generate response
    val jsonResponse =
        verifyResults.entries.joinToString( separator = ",", prefix = "{", postfix = "}") {
            ( key, value ) ->
          "\"$key\":$value"
        }

    val servletResponse = ServletResponse( EResponseType.JSON ).apply { value = jsonResponse }
    //endregion Generate response
    return PluginServletActionRetVal( servletResponse )
  }

  /**
   * Mode extract fields: Extracts text from image(s) and applies multiple regex patterns from the
   * **X-FieldPatterns** header (JSON array) to extract field values.
   *
   * @param params As provided by the formcycle environment.
   * @return A proper [IPluginServletActionRetVal] with field extraction results for each image. */
  private fun executeModeExtractFields(
      params: IPluginServletActionParams
  ): IPluginServletActionRetVal {
    if( params.uploadFiles.isNullOrEmpty() && params.headerMap["X-OCR-Image-ID"].isNullOrEmpty()) {
      log(
          LogLevel.ERROR,
          "No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with.")

      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with.\"}"))
    }
    //region Get X-FieldPatterns header (case-insensitive)
    val fieldPatternsHeaderEncoded = params.headerMap.entries
            .find { it.key.equals("X-FieldPatterns", ignoreCase = true ) }
            ?.value
            ?.trim()
    //endregion Get X-FieldPatterns header (case-insensitive)
    if( fieldPatternsHeaderEncoded.isNullOrEmpty()) {
      log(
          LogLevel.ERROR,
          "Mode extract fields requires **X-FieldPatterns** header to be specified.")

      return PluginServletActionRetVal(
          ServletResponse(
              EResponseType.JSON,
              "{\"error\":\"Mode extract fields requires X-FieldPatterns header to be specified.\"}"))
    }
    val fieldPatternsHeader =
        try {
          URLDecoder.decode( fieldPatternsHeaderEncoded, StandardCharsets.UTF_8.toString())
        } catch( e: Exception ) {
          log( LogLevel.ERROR, "Failed to decode X-FieldPatterns header: ${ e.message }")
          return PluginServletActionRetVal(
              ServletResponse(
                  EResponseType.JSON,
                  "{\"error\":\"Failed to decode X-FieldPatterns header: ${ e.message }\"}"))
        }
    val fieldPatterns =
        try {
          val gson = Gson()
          val type = object : TypeToken<List<Map<String, String>>>() {}.type
          val jsonArray = gson.fromJson<List<Map<String, String>>>( fieldPatternsHeader, type )
          jsonArray.map { entry ->
            entry.mapValues { (_, encodedPattern ) ->
              try {
                URLDecoder.decode( encodedPattern, StandardCharsets.UTF_8.toString())
              } catch( e: Exception ) {
                log( LogLevel.ERROR, "Failed to decode pattern for field: ${ e.message }")
                ""
              }
            }
          }
        } catch( e: JsonSyntaxException ) {
          log( LogLevel.ERROR, "Failed to parse X-FieldPatterns JSON: ${ e.message }")
          return PluginServletActionRetVal(
              ServletResponse(
                  EResponseType.JSON,
                  "{\"error\":\"Failed to parse X-FieldPatterns JSON: ${ e.message }\"}"))
        } catch( e: Exception ) {
          log( LogLevel.ERROR, "Error processing X-FieldPatterns: ${ e.message }")
          return PluginServletActionRetVal(
              ServletResponse(
                  EResponseType.JSON,
                  "{\"error\":\"Error processing X-FieldPatterns: ${ e.message }\"}"))
        }
    val fieldResults = mutableMapOf<String, Map<String, List<String>>>()
    val filesToDelete = mutableListOf<File>()

    try {
      if(!params.uploadFiles.isNullOrEmpty()) {
        params.uploadFiles?.forEach { ( inputName, fileItem ) ->
          val distinctImageID = "${params.headerMap["X-OCR-Image-ID"]}::${inputName}"
          var tempFile: File? = null
          var shouldDeleteThisFile = true
          //region Check if the image is already cached.
          if( distinctImageID.isNotBlank() && cacheIDedImages.containsKey( distinctImageID )) {
            tempFile = cacheIDedImages[distinctImageID]?.file
            shouldDeleteThisFile = false
          }
          //endregion Check if the image is already cached.
          //region Create file if not in cache and cache it X-OCR-Image-ID is set in header.
          if( tempFile == null || !tempFile.exists()) {
            tempFile = kotlin.io.path.createTempFile("ocr_${inputName}_", ".png").toFile()

            fileItem.stream().use { input ->
              val bytes = input.map { it.data }.reduce { acc, b -> acc + b }.orElse( byteArrayOf())

              tempFile!!.writeBytes( bytes )
            }

            if( distinctImageID.isNotBlank()) {
              cacheIDedImages[distinctImageID] = CachedImage( tempFile!!)
              shouldDeleteThisFile = false
            }
          }
          //endregion Create file if not in cache and cache it X-OCR-Image-ID is set in header.
          if( shouldDeleteThisFile ) filesToDelete.add( tempFile!!)
          //region OCR Processing
          val handle =
              pool.poll( 10, TimeUnit.SECONDS ) ?: throw IllegalStateException("Pool exhausted")
          try {
            TessAPI1.TessBaseAPIProcessPages( handle, tempFile!!.absolutePath, null, 0, null )

            val ptr = TessAPI1.TessBaseAPIGetUTF8Text( handle )

            if( ptr != null ) {
              val rawText = ptr.getString( 0, "UTF-8") ?: ""
              //region Initialize all field names with empty lists to ensure they're always present
              val allFieldNames = fieldPatterns.flatMap { it.keys }.distinct()
              val imageFields = allFieldNames.associateWith { emptyList<String>() }.toMutableMap()
              //endregion Initialize all field names with empty lists to ensure they're always
              // present

              fieldPatterns.forEach { fieldPatternMap ->
                fieldPatternMap.forEach { ( fieldName, pattern ) ->
                  if( pattern.isNotBlank()) {
                    try {
                      val matches = pattern.toRegex().findAll( rawText ).map { it.value }.toList()
                      imageFields[fieldName] = matches
                    } catch( X: Exception ) {
                      log( LogLevel.ERROR, "Regex Error for field '$fieldName': ${ X.message }")
                      imageFields[fieldName] = emptyList()
                    }
                  } else {
                    imageFields[fieldName] = emptyList()
                  }
                }
              }

              fieldResults[inputName] = imageFields

              TessAPI1.TessDeleteText( ptr )
            } else {
              fieldResults[inputName] =
                  fieldPatterns.flatMap { it.keys }.associateWith { emptyList<String>() }
            }

            TessAPI1.TessBaseAPIClear( handle )
          } catch( X: Throwable ) {
            throw ServletException(
                "[[ CodBi / AI / Tesseract ] Processing ${ inputName } failed with: ${ X }.]")
          } finally {
            pool.offer( handle )
          }
          //endregion OCR Processing
        }
      } else {
        cacheIDedImages.entries
            .filter { it.key.startsWith("${ params.headerMap["X-OCR-Image-ID"] }::") }
            .map { it.value }
            .forEach { ( image, key ) ->
              //region OCR Processing
              val handle =
                  pool.poll( 10, TimeUnit.SECONDS ) ?: throw IllegalStateException("Pool exhausted")
              try {
                TessAPI1.TessBaseAPIProcessPages( handle, image.absolutePath, null, 0, null )

                val ptr = TessAPI1.TessBaseAPIGetUTF8Text( handle )

                if( ptr != null ) {
                  val rawText = ptr.getString( 0, "UTF-8") ?: ""
                  //region Initialize all field names with empty lists to ensure they're always
                  // present
                  val allFieldNames = fieldPatterns.flatMap { it.keys }.distinct()
                  val imageFields =
                      allFieldNames.associateWith { emptyList<String>() }.toMutableMap()
                  //endregion Initialize all field names with empty lists to ensure they're always
                  // present

                  fieldPatterns.forEach { fieldPatternMap ->
                    fieldPatternMap.forEach { ( fieldName, pattern ) ->
                      if( pattern.isNotBlank()) {
                        try {
                          val matches = pattern.toRegex().findAll( rawText ).map { it.value }.toList()
                          imageFields[fieldName] = matches
                        } catch( X: Exception ) {
                          log( LogLevel.ERROR, "Regex Error for field '$fieldName': ${ X.message }")
                          imageFields[fieldName] = emptyList()
                        }
                      } else {
                        imageFields[fieldName] = emptyList()
                      }
                    }
                  }

                  fieldResults[image.name] = imageFields

                  TessAPI1.TessDeleteText( ptr )
                } else {
                  fieldResults[image.name] =
                      fieldPatterns.flatMap { it.keys }.associateWith { emptyList<String>() }
                }

                TessAPI1.TessBaseAPIClear( handle )
              } catch( X: Throwable ) {
                throw ServletException(
                    "[[ CodBi / AI / Tesseract ] Processing ${ image.name } failed with: ${ X }.]")
              } finally {
                pool.offer( handle )
              }
              //endregion OCR Processing
            }
      }
    } catch( e: Exception ) {
      logger.error("[[ CodBi ]] Execution Error", e )
    }
    //region Generate response
    val jsonResponse =
        fieldResults.entries.joinToString( separator = ",", prefix = "{", postfix = "}") {
            ( imageName, fields ) ->
          val fieldsJson =
              fields.entries.joinToString( separator = ",") { ( fieldName, matches ) ->
                val arrayValues =
                    matches.joinToString( separator = ",") { match ->
                      val escaped =
                          match.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n")
                      "\"$escaped\""
                    }
                "\"$fieldName\":[$arrayValues]"
              }
          "\"$imageName\":{$fieldsJson}"
        }

    val servletResponse = ServletResponse( EResponseType.JSON ).apply { value = jsonResponse }
    //endregion Generate response
    return PluginServletActionRetVal( servletResponse )
  }

  //region Native library management (Tess4J / Lept4J)
  private fun resolveMavenRepo(): String {
    val repo = System.getProperty("codbi.maven.repo.url")?.trim()?.trimEnd('/')
    return if( repo.isNullOrEmpty()) "https://repo1.maven.org/maven2" else repo
  }

  private fun resolveTesseractRuntimeBaseUrl(): String? {
    val base = System.getProperty("codbi.tesseract.runtime.baseUrl")?.trim()?.trimEnd('/')
    if( base.isNullOrEmpty()) return null
    return base
  }

  private fun downloadTo( url: String, targetFile: File ) {
    targetFile.parentFile?.mkdirs()
    URL(url).openConnection().apply {
      connectTimeout = 15_000
      readTimeout    = 600_000
      setRequestProperty("User-Agent", "CodBi-Tesseract/1.0")
    }.getInputStream().use { input ->
      targetFile.outputStream().use { output -> input.copyTo( output ) }
    }
  }

  private fun extractJarEntry( jarFile: File, entryName: String, outFile: File ) {
    if( outFile.exists()) return

    try {
      JarFile( jarFile ).use { jf ->
        val entry =
            jf.getJarEntry( entryName )
                ?: throw IllegalStateException("Missing native entry in jar: ${jarFile.name}::$entryName")
        jf.getInputStream( entry ).use { input ->
          outFile.parentFile?.mkdirs()
          outFile.outputStream().use { output -> input.copyTo( output ) }
        }
        log( LogLevel.INFO, "Provisioned native lib: ${outFile.name}" )
      }
    } catch( X: Throwable ) {
      log( LogLevel.ERROR, "Failed to extract $entryName from ${jarFile.name}: ${X.message}" )
    }
  }

  private fun ensureWindowsNativeLibs( dirNativeLibs: File?, arch: String ) {
    if( dirNativeLibs == null ) return

    val platformDir  = if( arch.contains("64")) "win32-x86-64" else "win32-x86"
    val tesseractDll = File( dirNativeLibs, "libtesseract551.dll" )
    val leptDll      = File( dirNativeLibs, "libleptonica1850.dll" )

    if( tesseractDll.exists() && leptDll.exists()) return

    val repo    = resolveMavenRepo()
    val cache   = dirNativeLibs.parentFile?.resolve("maven-cache")?.apply { mkdirs() } ?: return
    val vTess4j = System.getProperty("codbi.tess4j.version")?.trim()?.ifBlank { null } ?: "5.16.0"
    val vLept4j = System.getProperty("codbi.lept4j.version")?.trim()?.ifBlank { null } ?: "1.21.1"

    val tess4jJar = File( cache, "tess4j-$vTess4j.jar" )
    val lept4jJar = File( cache, "lept4j-$vLept4j.jar" )

    if( !tess4jJar.exists()) {
      val url = "$repo/net/sourceforge/tess4j/tess4j/$vTess4j/tess4j-$vTess4j.jar"
      log( LogLevel.INFO, "Downloading Tess4J natives from: $url" )
      downloadTo( url, tess4jJar )
    }

    if( !lept4jJar.exists()) {
      val url = "$repo/net/sourceforge/lept4j/lept4j/$vLept4j/lept4j-$vLept4j.jar"
      log( LogLevel.INFO, "Downloading Lept4J natives from: $url" )
      downloadTo( url, lept4jJar )
    }

    extractJarEntry( tess4jJar, "$platformDir/libtesseract551.dll", tesseractDll )
    extractJarEntry( lept4jJar, "$platformDir/libleptonica1850.dll", leptDll )
  }

  private fun ensurePosixNativeLibs( dirNativeLibs: File?, os: String, arch: String ) {
    if( dirNativeLibs == null ) return
    val required =
        when {
          os.contains("mac") -> listOf("libtesseract.dylib", "liblept.5.dylib")
          else               -> listOf("libtesseract.so.5.0.5.so", "liblept.so.5.0.4.so")
        }

    if( required.all { File( dirNativeLibs, it ).exists() } ) return

    val platformDir =
        when {
          os.contains("mac")                               -> "darwin-aarch64"
          arch.contains("aarch64") || arch.contains("arm") -> "linux-aarch64"
          else                                             -> "linux-x86-64"
        }

    val baseUrl = resolveTesseractRuntimeBaseUrl()
    if( baseUrl == null ) {
      log( LogLevel.ERROR,
          "Missing native libs for $platformDir in \"${dirNativeLibs.absolutePath}\". " +
          "Set -Dcodbi.tesseract.runtime.baseUrl=<https base url> to download: $required" )
      return
    }

    required.forEach { name ->
      val target = File( dirNativeLibs, name )
      if( target.exists()) return@forEach

      val url = "$baseUrl/$platformDir/$name"
      try {
        log( LogLevel.INFO, "Downloading Tesseract runtime lib from: $url" )
        downloadTo( url, target )
      } catch( X: Throwable ) {
        log( LogLevel.ERROR, "Failed to download $name: ${X.message}" )
      }
    }
  }

  //endregion Native library management (Tess4J / Lept4J)

  /** Removes the native libraries and the models from the local repository. */
  private fun wipeLocalData() {
    // Remove the entire Tesseract directory to ensure all files are cleaned up
    pluginRoot?.resolve("Resources/AI/Tesseract")?.deleteRecursively()
    
    // Clean up cached OCR images
    cacheIDedImages.values.forEach { it.file.delete() }
    cacheIDedImages.clear()
  }

  /**
   * Checks if all models of the specified **language** exist within the **tessDataDir** and
   * downloads them if necessary.
   *
   * @param tessDataDir The directory where the language models reside.
   * @param language The languages to ensure the availability of. */
  private fun ensureTessData( tessDataDir: File?, language: String ) {
    if(!tessDataDir?.exists()!!) tessDataDir.mkdirs()

    val languagesToDownload = listOf("$language.traineddata", "osd.traineddata")
    val baseUrl = "https://github.com/tesseract-ocr/tessdata_best/raw/main/"

    languagesToDownload.forEach { fileName ->
      val localFile = File( tessDataDir, fileName )

      if(!localFile.exists() || localFile.length() == 0L ) {
        log( LogLevel.INFO, "Downloading $fileName from GitHub...")

        try {
          downloadTo( "$baseUrl$fileName", localFile )

          log( LogLevel.INFO, "Successfully downloaded $fileName.")
        } catch( X: Exception ) {
          log( LogLevel.WARNING, "Failed to download $fileName: ${ X.message }.")
        }
      }
    }
  }

  /**
   * Shuts down the [pool] and releases all Tesseract handles.
   *
   * @param shutdownData As provided by the formcycle environment. */
  override fun shutdown( shutdownData: IPluginShutdownData?) {
    super.shutdown( shutdownData )

    while( pool.isNotEmpty()) {
      val handle = pool.poll()

      if( handle != null ) {
        TessAPI1.TessBaseAPIDelete( handle )

        log( LogLevel.INFO, "Native Tesseract handle (${ handle.hashCode()}) released.")
      }
    }
    ready = false
  }

  /**
   * Sets the [idLogMessages] prior to [AI.log]ging.
   *
   * @param importance See [AI.log].
   * @param toLog See [AI.log]. */
  override fun log( importance: LogLevel, toLog: String, adjenct: String, exception: Throwable?) {
    super.idLogMessages = "CodBi / AI / Tesseract"

    super.log( importance, toLog, adjenct, exception )
  }
}