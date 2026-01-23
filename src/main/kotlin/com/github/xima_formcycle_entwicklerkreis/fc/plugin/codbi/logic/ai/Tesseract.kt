package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai
//region Imports
//region CodBi
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI
//endregion CodBi
//region Google
import com.google.gson.Gson
import com.google.gson.JsonSyntaxException
import com.google.gson.reflect.TypeToken
//endregion Google
//region XIMA
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
//endregion XIMA
import java.io.File
import java.net.URL
import java.net.URI
import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import java.util.concurrent.*
import java.util.jar.JarFile
import javax.servlet.ServletException
//region Tesseract
import net.sourceforge.tess4j.ITessAPI
import net.sourceforge.tess4j.TessAPI1
//endregion Tesseract
//endregion Imports
/**
 * # Performs OCR on one or multiple images using the [Tesseract](https://github.com/tesseract-ocr/tesseract).
 *
 * Returns either the whole text of the document(s) parsed or, if a **X-OCR-Regex** is found in the
 * header, the text matching a specified regular expression, the text matching multiple named
 * regular expressions or whether the text matches a specified regular expression.
 *
 * Formcycle upload-fields that take advantage of CodBi's **Media.MultipleDownload** thus uploaded
 * more than one image are supported. The JSON returned will hold the properties named according to
 * the transmitted file's names holding the found text.
 *
 * ## Plugin-Properties
 * - **AI_Tesseract_Languages** Optional three-letter language-code specification of language the Tesseract shall be
 *   able to recognize (defaults to **deu**). Multiple languages may be separated by a **+** (e.g. deu + eng).
 * -- **AI_Tesseract_PoolSize ** Number of Tesseract-Instance that're concurrently available (see [sizePool]).
 *
 * ## URLs needed for proper initialization:
 * - **[https://repo1.maven.org/maven2](https://repo1.maven.org/maven2)**
 * - **[https://github.com/tesseract-ocr/tessdata_best/raw/main/](https://github.com/tesseract-ocr/tessdata_best)**
 * **The Maven repository's URL may be changed using the AI_Tesseract_MavenRepository plugin property.** */
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
    private var sizePool = 2
    /** The directory where the temporary native libraries are stored. */
    private var dirTempNativeLibs: File? = null
    /** The directory where the Tesseract language models are stored. */
    private var tessDataDir: File? = null
    /** Tracks whether the Tesseract pool has been initialized. */
    private var isPoolInitialized = false
    /**
     * Specifies the name of this [IPluginServletAction].
     *
     * @return The requested [String]. */
    override fun getName() = "CodBi_AI_Tesseract"
    /**
     * The method performing all tasks that are common to the [initialize] and the [validateConfigurationData] methods.
     *
     * @param properties The [java.util.Properties] to acquire the plugin's properties from.
     * @param root          The directory where the native libraries are stored. * */
    private fun commonInit( properties: java.util.Properties, root: File? ): Boolean {
        val aiRemove = properties.getProperty("AI_Remove")?.lowercase() ?: ""
        val activeAI = properties.getProperty("Active_AI")?.lowercase() ?: ""

        if( aiRemove.contains("ocr") || !activeAI.contains("ocr") ) {
            wipeLocalData()

            active = false
            ready  = false

            return false }

        active = true

        if( root != null ) {
            try {
                //region Resolve platform & ensure runtime libs
                val os                = System.getProperty("os.name").lowercase()
                val arch              = System.getProperty("os.arch").lowercase()
                val platformDirName   =
                    when {
                        os.contains("win")      -> "win32-x86-64"
                        os.contains("linux")    -> "linux-x86-64"
                        os.contains("mac")      -> "darwin-aarch64"
                        else                          -> "unknown" }
                val dirNativeLibs     =
                    root.resolve("Resources/AI/Tesseract/Runtime/${ platformDirName }").apply { mkdirs()}

                if( os.contains("win")) ensureWindowsNativeLibs( dirNativeLibs, arch )
                else {
                    log( LogLevel.INFO,"This is currently only available on Windows")

                    return false }
                //endregion Resolve platform & ensure runtime libs
                //region Clone libs into a fresh run dir (avoid locked DLLs)
                if( dirTempNativeLibs == null || !dirTempNativeLibs!!.exists() ) {
                    val tmpDir = root.resolve("Resources/AI/Tesseract/TmpNatives").apply { mkdirs() }
                    // Remove former library-clones
                    tmpDir.listFiles { file -> file.isDirectory && file.name.startsWith("tesseract_run_")}
                        ?.forEach { oldFolder -> oldFolder.deleteRecursively()}

                    dirTempNativeLibs = File( tmpDir, "tesseract_run_${ System.currentTimeMillis()}")

                    dirTempNativeLibs!!.mkdirs()

                    dirNativeLibs.listFiles()?.forEach { file -> file.copyTo( File( dirTempNativeLibs, file.name ), overwrite = true )}
                }
                //endregion Clone libs into a fresh run dir (avoid locked DLLs)
                System.setProperty( "jna.library.path", dirTempNativeLibs!!.absolutePath )
                System.setProperty( "net.sourceforge.tess4j.extract.path", dirTempNativeLibs!!.absolutePath )
                System.setProperty( "net.sourceforge.tess4j.skip.extract", "true" )
                //region Ensure that the model files are available
                tessDataDir = root.resolve("Resources/AI/Tesseract/Models").apply { mkdirs()}

                val languages   = properties.getProperty("AI_Tesseract_Languages")
                val langs       =
                    if( languages.isNullOrBlank())  listOf("de")
                    else                            languages.split("+").map { it.trim() }.filter { it.isNotBlank() }
                langs.forEach { lang -> ensureTessData( tessDataDir, lang ) }
                //endregion Ensure that the model files are available
                //region Initialize / Manage pool
                val poolSizeProp    = properties.getProperty("AI_Tesseract_PoolSize")?.toIntOrNull()
                val targetSize      = if( poolSizeProp != null && poolSizeProp > 0 ) poolSizeProp else 2
                val langArg         =
                    if( languages.isNullOrBlank() ) "de"
                    else                            languages.replace(" ", "")

                if(!isPoolInitialized ) {
                    sizePool = targetSize

                    repeat( sizePool ) { addHandleToPool( langArg )}

                    isPoolInitialized = true
                } else {
                    if( targetSize != sizePool ) {
                        val delta = targetSize - sizePool

                        if( delta > 0 ) { repeat( delta ) { addHandleToPool( langArg )}}
                        else {
                            repeat( -delta ) {
                                val handle = pool.poll()

                                if( handle != null ) TessAPI1.TessBaseAPIDelete( handle )
                            }
                        }

                        sizePool = targetSize

                        log( LogLevel.INFO,"Size of Pool changed to $sizePool")}
                }
                //endregion Initialize / Manage pool
                ready = true
            } catch( X: Throwable ) {
                ready = false

                log( LogLevel.ERROR, "Initialization Failure: ${ X.message }", "", X )

                return false }
        }

        return true }
    /**
     * Generates a new Tesseract-Handle and adds it to the [pool].
     *
     * @param lang The language this handle shall recognize. */
    private fun addHandleToPool( lang: String ) {
        try {
            val tesseract = TessAPI1.TessBaseAPICreate()

            if( TessAPI1.TessBaseAPIInit3( tesseract, tessDataDir!!.absolutePath, lang ) != 0 )
                throw ServletException("[[ CodBi / AI /Tesseract ] Unknown initialization failure while creating a new handle ($lang) ]")

            pool.put( tesseract )
        } catch( X: Throwable ) {
            log( LogLevel.WARNING, "Non fatal exception during Tesseract init of a new handle ($lang): ${ X.message }", "", X )}
    }

    /** Empties the [pool]. */
    private fun emptyPool() {
        while( pool.isNotEmpty() ) {
            val handle = pool.poll()

            if( handle != null ) TessAPI1.TessBaseAPIDelete( handle )
        }

        isPoolInitialized = false }
    /**
     * Initializes this plugin if the CodBi-Plugin-Property **Active_AI** contains **OCR** (case insensitive). By
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
        super.initialize(configData)

        pluginRoot = configData.fileHelper.pluginFolder

        if(!commonInit( configData.properties, pluginRoot )) return
        //region Begin the observation of the [cacheIDedImages].
        janitorIDedImages = Executors.newSingleThreadScheduledExecutor()

        startJanitor()
        //endregion Begin the observation of the [cacheIDedImages].

        log( LogLevel.INFO, "Tesseract initialized.")}
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
        if(!commonInit( configData.properties, pluginRoot ) ) return null

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
        if(!ready ) return PluginServletActionRetVal( ServletResponse( EResponseType.JSON, "{\"error\":\"Tesseract is not active. In order to activate it the keyword OCR has to be placed into the CodBi-Plugin-Property Active_AI.\"}" ) )
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
                "{\"error\":\"No X-Mode specified. Specify a modus operandi (print, verify, extract, or extract fields).\"}"))
            else              -> return PluginServletActionRetVal( ServletResponse( EResponseType.JSON,
                "{\"error\":\"Unsupported X-Mode in request-header (valid modes are print, verify, extract, or extract fields):${ modeHeader }\"}"))}
    }
    /**
     * Mode print: Plain text extraction - extracts all text from the image(s).
     *
     * @param params As provided by the formcycle environment.
     *
     * @return A proper [IPluginServletActionRetVal]. */
    private fun executeModePrint( params: IPluginServletActionParams ): IPluginServletActionRetVal {
        val errorMessage = "No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with."

        if( params.uploadFiles.isNullOrEmpty() && params.headerMap["X-OCR-Image-ID"].isNullOrEmpty() ) {
            log(
                LogLevel.ERROR, errorMessage)

            return PluginServletActionRetVal(
                ServletResponse(
                    EResponseType.JSON, errorMessage ))}

        val ocrResults      = mutableMapOf< String, String >()
        val filesToDelete   = mutableListOf< File >()

        try {
            if(!params.uploadFiles.isNullOrEmpty()) {
                params.uploadFiles?.forEach {( inputName, fileItem ) ->
                    val distinctImageID                 = "${ params.headerMap["X-OCR-Image-ID"]}::${ inputName }"
                    var tempFile                : File? = null
                    var shouldDeleteThisFile            = true
                    //region Check if the image is already cached.
                    if( distinctImageID.isNotBlank() && cacheIDedImages.containsKey( distinctImageID )) {
                        tempFile                = cacheIDedImages[distinctImageID]?.file
                        shouldDeleteThisFile    = false }
                    //endregion Check if the image is already cached.
                    //region Create file if not in cache and cache it X-OCR-Image-ID is set in header.
                    if( tempFile == null || !tempFile.exists() ) {
                        tempFile = kotlin.io.path.createTempFile("ocr_${inputName}_", ".png").toFile()

                        fileItem.stream().use { input ->
                            val bytes = input.map { it.data }.reduce { acc, b -> acc + b }.orElse( byteArrayOf())

                            tempFile!!.writeBytes( bytes )}

                        if( distinctImageID.isNotBlank() ) {
                            cacheIDedImages[ distinctImageID ]  = CachedImage( tempFile!!)
                            shouldDeleteThisFile                = false }
                    }
                    //endregion Create file if not in cache and cache it X-OCR-Image-ID is set in header.
                    if( shouldDeleteThisFile ) filesToDelete.add( tempFile!!)
                    //region OCR Processing
                    val handle =
                        pool.poll( 10, TimeUnit.SECONDS ) ?: throw IllegalStateException("[[ CodBi / AI / Tesseract ] Pool exhausted ]")
                    try {
                        TessAPI1.TessBaseAPIProcessPages( handle, tempFile!!.absolutePath, null, 0, null )

                        val ptr = TessAPI1.TessBaseAPIGetUTF8Text( handle )

                        if( ptr != null ) {
                            if( params.headerMap["X-Pattern"].isNullOrEmpty() )
                                ocrResults[inputName] = ptr.getString( 0, "UTF-8").trim()
                            else ocrResults[inputName] = ptr.getString( 0, "UTF-8") ?: ""

                            TessAPI1.TessDeleteText( ptr )
                        }

                        TessAPI1.TessBaseAPIClear( handle )
                    } catch( X: Throwable ) {
                        throw ServletException(
                            "[[ CodBi / AI / Tesseract ] Processing ${ inputName } failed with: ${ X }.]")
                    } finally { pool.offer( handle )}
                    //endregion OCR Processing
                }
            } else {
                cacheIDedImages.entries
                    .filter { it.key.startsWith("${ params.headerMap["X-OCR-Image-ID"] }::")}.map { it.value }
                    .forEach {( image, key ) ->
                        //region OCR Processing
                        val handle =
                            pool.poll( 10, TimeUnit.SECONDS ) ?: throw IllegalStateException("Pool exhausted")
                        try {
                            TessAPI1.TessBaseAPIProcessPages( handle, image.absolutePath, null, 0, null )

                            val ptr = TessAPI1.TessBaseAPIGetUTF8Text( handle )

                            if( ptr != null ) {
                                ocrResults[image.name] = ptr.getString( 0, "UTF-8").trim()

                                TessAPI1.TessDeleteText( ptr )}

                            TessAPI1.TessBaseAPIClear( handle )
                        } catch( X: Throwable ) {
                            throw ServletException(
                                "[[ CodBi / AI / Tesseract ] Processing ${ image.name } failed with: ${ X }.]")
                        } finally { pool.offer( handle )}
                        //endregion OCR Processing
                    }
            }
        } catch( X : Exception ) { logger.error("[[ CodBi ]] Execution Error", X )}
        //region Generate response
        val jsonResponse =
            ocrResults.entries.joinToString( separator = ",", prefix = "{", postfix = "}") {( key, value ) ->
                val escapedValue = value.replace("\"", "\\\"").replace("\n", "\\n")
                "\"$key\":\"$escapedValue\""}

        val servletResponse = ServletResponse( EResponseType.JSON ).apply { value = jsonResponse }
        //endregion Generate response
        return PluginServletActionRetVal( servletResponse )}
    /**
     * Mode extract: Extracts text from image(s) and returns only the parts that match the regex
     * pattern specified in the **X-Pattern** header.
     *
     * @param params As provided by the formcycle environment.
     *
     * @return A proper [IPluginServletActionRetVal]. */
    private fun executeModeExtract( params: IPluginServletActionParams ): IPluginServletActionRetVal {
        if( params.uploadFiles.isNullOrEmpty() && params.headerMap["X-OCR-Image-ID"].isNullOrEmpty() ) {
            log(
                LogLevel.ERROR,
                "No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with.")

            return PluginServletActionRetVal(
                ServletResponse(
                    EResponseType.JSON,
                    "{\"error\":\"No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with.\"}"))
        }

        val patternHeaderEncoded = params.headerMap["X-Pattern"]?.trim()

        if( patternHeaderEncoded.isNullOrEmpty() ) {
            log( LogLevel.ERROR, "Mode extract requires X-Pattern header to be specified.")

            return PluginServletActionRetVal(
                ServletResponse(
                    EResponseType.JSON,
                    "{\"error\":\"Mode extract requires X-Pattern header to be specified.\"}"))
        }

        val patternHeader   =
            try { URLDecoder.decode( patternHeaderEncoded, StandardCharsets.UTF_8.toString())}
            catch( X: Exception ) {
                log( LogLevel.ERROR, "Failed to decode X-Pattern header: ${ X.message }")

                return PluginServletActionRetVal(
                    ServletResponse(
                        EResponseType.JSON,
                        "{\"error\":\"Failed to decode X-Pattern header: ${ X.message }\"}"))}
        val ocrResults      = mutableMapOf<String, List<String>>()
        val filesToDelete   = mutableListOf<File>()

        try {
            if(!params.uploadFiles.isNullOrEmpty()) {
                params.uploadFiles?.forEach {( inputName, fileItem ) ->
                    val distinctImageID         = "${params.headerMap["X-OCR-Image-ID"]}::${inputName}"
                    var tempFile                : File? = null
                    var shouldDeleteThisFile    = true
                    //region Check if the image is already cached.
                    if( distinctImageID.isNotBlank() && cacheIDedImages.containsKey( distinctImageID ) ) {
                        tempFile                = cacheIDedImages[distinctImageID]?.file
                        shouldDeleteThisFile    = false }
                    //endregion Check if the image is already cached.
                    //region Create file if not in cache and cache it X-OCR-Image-ID is set in header.
                    if( tempFile == null || !tempFile.exists() ) {
                        tempFile = kotlin.io.path.createTempFile("ocr_${inputName}_", ".png").toFile()

                        fileItem.stream().use { input ->
                            val bytes = input.map { it.data }.reduce { acc, b -> acc + b }.orElse( byteArrayOf())

                            tempFile!!.writeBytes( bytes )}

                        if( distinctImageID.isNotBlank() ) {
                            cacheIDedImages[distinctImageID]    = CachedImage( tempFile!!)
                            shouldDeleteThisFile                = false }
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
                                try                     { patternHeader.toRegex().findAll( rawText ).map { it.value }.toList()}
                                catch( X: Exception )   { listOf("Regex Error: ${ X.message }")}

                            TessAPI1.TessDeleteText( ptr )}
                        else { ocrResults[inputName] = emptyList()}

                        TessAPI1.TessBaseAPIClear( handle )
                    } catch( X: Throwable ) {
                        throw ServletException(
                            "[[ CodBi / AI / Tesseract ] Processing ${ inputName } failed with: ${ X }.]")
                    } finally { pool.offer( handle )}
                    //endregion OCR Processing
                }
            } else {
                cacheIDedImages.entries
                    .filter { it.key.startsWith("${ params.headerMap["X-OCR-Image-ID"] }::") }
                    .map { it.value }
                    .forEach { ( image, key ) ->
                        //region OCR Processing
                        val handle =
                            pool.poll( 10, TimeUnit.SECONDS ) ?: throw IllegalStateException("[[ CodBi / AI / Tesseract ] Pool exhausted ]")
                        try {
                            TessAPI1.TessBaseAPIProcessPages( handle, image.absolutePath, null, 0, null )

                            val ptr = TessAPI1.TessBaseAPIGetUTF8Text( handle )

                            if( ptr != null ) {
                                val rawText = ptr.getString( 0, "UTF-8") ?: ""

                                ocrResults[image.name] =
                                    try { patternHeader.toRegex().findAll( rawText ).map { it.value }.toList()}
                                    catch( X: Exception ) { listOf("Regex Error: ${ X.message }")}

                                TessAPI1.TessDeleteText( ptr )}
                            else { ocrResults[image.name] = emptyList()}

                            TessAPI1.TessBaseAPIClear( handle )}
                        catch( X: Throwable ) {
                            throw ServletException(
                                "[[ CodBi / AI / Tesseract ] Processing ${ image.name } failed with: $X ]")}
                        finally { pool.offer( handle )}
                        //endregion OCR Processing
                    }
            }
        } catch( X: Exception ) { logger.error("[[ CodBi / AI / Tesseract ] Execution Error: $X ]", X )}
        //region Generate response
        val jsonResponse =
            ocrResults.entries.joinToString( separator = ",", prefix = "{", postfix = "}") { ( key, value ) ->
                val arrayValues =
                    value.joinToString( separator = ",") { match ->
                        val escaped = match.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n")
                        "\"$escaped\""}
                "\"$key\":[$arrayValues]"
            }

        val servletResponse = ServletResponse( EResponseType.JSON ).apply { value = jsonResponse }
        //endregion Generate response
        return PluginServletActionRetVal( servletResponse )}
    /**
     * Mode verify: Extracts text from image(s) and checks if the text matches the regex pattern
     * specified in the **X-Pattern** header.
     *
     * @param params As provided by the formcycle environment.
     *
     * @return  A proper [IPluginServletActionRetVal] with boolean results indicating if each image's
     *          text matches the pattern. */
    private fun executeModeVerify( params: IPluginServletActionParams ): IPluginServletActionRetVal {
        if( params.uploadFiles.isNullOrEmpty() && params.headerMap["X-OCR-Image-ID"].isNullOrEmpty() ) {
            log(
                LogLevel.ERROR,
                "No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with.")

            return PluginServletActionRetVal(
                ServletResponse(
                    EResponseType.JSON,
                    "{\"error\":\"No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with.\"}"))
        }

        val patternHeaderEncoded = params.headerMap["X-Pattern"]?.trim()

        if( patternHeaderEncoded.isNullOrEmpty() ) {
            log( LogLevel.ERROR, "Mode verify requires **X-Pattern** header to be specified.")

            return PluginServletActionRetVal(
                ServletResponse(
                    EResponseType.JSON,
                    "{\"error\":\"Mode verify requires X-Pattern header to be specified.\"}"))}

        val patternHeader =
            try { URLDecoder.decode( patternHeaderEncoded, StandardCharsets.UTF_8.toString())}
            catch( e: Exception ) {
                log( LogLevel.ERROR, "Failed to decode X-Pattern header: ${ e.message }")

                return PluginServletActionRetVal(
                    ServletResponse(
                        EResponseType.JSON,
                        "{\"error\":\"Failed to decode X-Pattern header: ${ e.message }\"}"))
            }
        val verifyResults = mutableMapOf < String, Boolean >()
        val filesToDelete = mutableListOf < File > ()

        try {
            if(!params.uploadFiles.isNullOrEmpty() ) {
                params.uploadFiles?.forEach { ( inputName, fileItem ) ->
                    val distinctImageID         = "${ params.headerMap["X-OCR-Image-ID"]}::${ inputName }"
                    var tempFile                : File? = null
                    var shouldDeleteThisFile    = true
                    //region Check if the image is already cached.
                    if( distinctImageID.isNotBlank() && cacheIDedImages.containsKey( distinctImageID ) ) {
                        tempFile                = cacheIDedImages[distinctImageID]?.file
                        shouldDeleteThisFile    = false }
                    //endregion Check if the image is already cached.
                    //region Create file if not in cache and cache it X-OCR-Image-ID is set in header.
                    if( tempFile == null || !tempFile.exists() ) {
                        tempFile = kotlin.io.path.createTempFile("ocr_${inputName}_", ".png").toFile()

                        fileItem.stream().use { input ->
                            val bytes = input.map { it.data }.reduce { acc, b -> acc + b }.orElse( byteArrayOf())

                            tempFile!!.writeBytes( bytes )}

                        if( distinctImageID.isNotBlank()) {
                            cacheIDedImages[ distinctImageID ]  = CachedImage( tempFile!!)
                            shouldDeleteThisFile                = false }
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

                            verifyResults[ inputName ] =
                                try                     { patternHeader.toRegex().containsMatchIn( rawText )}
                                catch( X: Exception )   {
                                    log( LogLevel.ERROR, "Regex Error in verify mode: ${ X.message }")

                                    false }

                            TessAPI1.TessDeleteText( ptr )}
                        else verifyResults[inputName] = false

                        TessAPI1.TessBaseAPIClear( handle )
                    } catch( X: Throwable ) {
                        throw ServletException(
                            "[[ CodBi / AI / Tesseract ] Processing ${ inputName } failed with: ${ X }.]")
                    } finally { pool.offer( handle )}
                    //endregion OCR Processing
                }
            }
            else {
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
                                    try                     { patternHeader.toRegex().containsMatchIn( rawText )}
                                    catch( X: Exception )   {
                                        log( LogLevel.ERROR, "Following regex Error occured while verifying: ${ X.message }")

                                        false }

                                TessAPI1.TessDeleteText( ptr )
                            } else { verifyResults[image.name] = false }

                            TessAPI1.TessBaseAPIClear( handle )
                        } catch( X: Throwable ) {
                            throw ServletException(
                                "[[ CodBi / AI / Tesseract ] Processing ${ image.name } failed with: ${ X }.]")
                        } finally { pool.offer( handle )}
                        //endregion OCR Processing
                    }
            }
        }
        catch( X: Exception ) { logger.error("[[ CodBi ]] Execution Error", X )}
        //region Generate response
        val jsonResponse =
            verifyResults.entries.joinToString( separator = ",", prefix = "{", postfix = "}") {( key, value ) ->
                "\"$key\":$value"}

        val servletResponse = ServletResponse( EResponseType.JSON ).apply { value = jsonResponse }
        //endregion Generate response
        return PluginServletActionRetVal( servletResponse )
    }
    /**
     * Extracts text from image(s) and applies multiple regex patterns from the
     * **X-FieldPatterns** header (JSON array) to extract field values.
     *
     * @param params As provided by the formcycle environment.
     *
     * @return A proper [IPluginServletActionRetVal] with field extraction results for each image. */
    private fun executeModeExtractFields( params: IPluginServletActionParams ): IPluginServletActionRetVal {
        if( params.uploadFiles.isNullOrEmpty() && params.headerMap["X-OCR-Image-ID"].isNullOrEmpty()) {
            log(
                LogLevel.ERROR,
                "No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with.")

            return PluginServletActionRetVal(
                ServletResponse(
                    EResponseType.JSON,
                    "{\"error\":\"No files and no **X-OCR-Image-ID** was transmitted thus having nothing to work with.\"}"))}
        //region Get X-FieldPatterns header (case-insensitive)
        val fieldPatternsHeaderEncoded = params.headerMap.entries
            .find { it.key.equals("X-FieldPatterns", ignoreCase = true ) }
            ?.value
            ?.trim()
        //endregion Get X-FieldPatterns header (case-insensitive)
        if( fieldPatternsHeaderEncoded.isNullOrEmpty() ) {
            log(
                LogLevel.ERROR, "Mode extract fields requires **X-FieldPatterns** header to be specified.")

            return PluginServletActionRetVal(
                ServletResponse(
                    EResponseType.JSON,
                    "{\"error\":\"Mode extract fields requires X-FieldPatterns header to be specified.\"}"))}

        val fieldPatternsHeader =
            try { URLDecoder.decode( fieldPatternsHeaderEncoded, StandardCharsets.UTF_8.toString())}
            catch( e: Exception ) {
                log( LogLevel.ERROR, "Failed to decode X-FieldPatterns header: ${ e.message }")

                return PluginServletActionRetVal(
                    ServletResponse(
                        EResponseType.JSON,
                        "{\"error\":\"Failed to decode X-FieldPatterns header: ${ e.message }\"}"))}
        val fieldPatterns       =
            try {
                val gson        = Gson()
                val type        = object : TypeToken< List < Map < String, String >>> () {}.type
                val jsonArray   = gson.fromJson< List < Map< String, String >>>( fieldPatternsHeader, type )
                jsonArray.map { entry ->
                    entry.mapValues {(_, encodedPattern ) ->
                        try { URLDecoder.decode( encodedPattern, StandardCharsets.UTF_8.toString())}
                        catch( X: Exception ) {
                            log( LogLevel.ERROR, "Failed to decode pattern for field: ${ X.message }")
                            ""}
                    }
                }
            } catch( X: JsonSyntaxException ) {
                log( LogLevel.ERROR, "Failed to parse X-FieldPatterns JSON: ${ X.message }")
                return PluginServletActionRetVal(
                    ServletResponse(
                        EResponseType.JSON,
                        "{\"error\":\"Failed to parse X-FieldPatterns JSON: ${ X.message }\"}"))
            } catch( X: Exception ) {
                log( LogLevel.ERROR, "Error processing X-FieldPatterns: ${ X.message }")

                return PluginServletActionRetVal(
                    ServletResponse(
                        EResponseType.JSON,
                        "{\"error\":\"Error processing X-FieldPatterns: ${ X.message }\"}"))
            }
        val fieldResults        = mutableMapOf < String, Map < String, List < String >>> ()
        val filesToDelete       = mutableListOf < File > ()

        try {
            if(!params.uploadFiles.isNullOrEmpty()) {
                params.uploadFiles?.forEach {( inputName, fileItem ) ->
                    val distinctImageID         = "${params.headerMap["X-OCR-Image-ID"]}::${ inputName }"
                    var tempFile                : File? = null
                    var shouldDeleteThisFile    = true
                    //region Check if the image is already cached.
                    if( distinctImageID.isNotBlank() && cacheIDedImages.containsKey( distinctImageID )) {
                        tempFile                = cacheIDedImages[distinctImageID]?.file
                        shouldDeleteThisFile    = false }
                    //endregion Check if the image is already cached.
                    //region Create file if not in cache and cache it X-OCR-Image-ID is set in header.
                    if( tempFile == null || !tempFile.exists() ) {
                        tempFile = kotlin.io.path.createTempFile("ocr_${inputName}_", ".png").toFile()

                        fileItem.stream().use { input ->
                            val bytes = input.map { it.data }.reduce { acc, b -> acc + b }.orElse( byteArrayOf())

                            tempFile!!.writeBytes( bytes )}

                        if( distinctImageID.isNotBlank()) {
                            cacheIDedImages[ distinctImageID ]  = CachedImage( tempFile!!)
                            shouldDeleteThisFile                = false }
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
                            val allFieldNames   = fieldPatterns.flatMap { it.keys }.distinct()
                            val imageFields     = allFieldNames.associateWith { emptyList < String > ()}.toMutableMap()
                            //endregion Initialize all field names with empty lists to ensure they're always
                            fieldPatterns.forEach { fieldPatternMap ->
                                fieldPatternMap.forEach {( fieldName, pattern ) ->
                                    if( pattern.isNotBlank() ) {
                                        try {
                                            val matches = pattern.toRegex().findAll( rawText ).map { it.value }.toList()

                                            imageFields[ fieldName ] = matches
                                        } catch( X: Exception ) {
                                            log( LogLevel.ERROR, "Regex Error for field '$fieldName': ${ X.message }")

                                            imageFields[fieldName] = emptyList()}
                                    } else { imageFields[fieldName] = emptyList()}
                                }
                            }

                            fieldResults[inputName] = imageFields

                            TessAPI1.TessDeleteText( ptr )
                        }
                        else
                            fieldResults[inputName] =
                                fieldPatterns.flatMap { it.keys }.associateWith { emptyList < String > () }

                        TessAPI1.TessBaseAPIClear( handle )
                    } catch( X: Throwable ) {
                        throw ServletException(
                            "[[ CodBi / AI / Tesseract ] Processing ${ inputName } failed with: ${ X }.]")
                    } finally { pool.offer( handle )}
                    //endregion OCR Processing
                }
            } else {
                cacheIDedImages.entries
                    .filter { it.key.startsWith("${ params.headerMap["X-OCR-Image-ID"] }::") }
                    .map { it.value }
                    .forEach {( image, key ) ->
                        //region OCR Processing
                        val handle =
                            pool.poll( 10, TimeUnit.SECONDS ) ?: throw IllegalStateException("[[ CodBi / AI / Tesseract ] Pool exhausted ]")
                        try {
                            TessAPI1.TessBaseAPIProcessPages( handle, image.absolutePath, null, 0, null )

                            val ptr = TessAPI1.TessBaseAPIGetUTF8Text( handle )

                            if( ptr != null ) {
                                val rawText = ptr.getString( 0, "UTF-8") ?: ""
                                //region Initialize all field names with empty lists to ensure they're always
                                val allFieldNames   = fieldPatterns.flatMap { it.keys }.distinct()
                                val imageFields     =
                                    allFieldNames.associateWith { emptyList < String > () }.toMutableMap()
                                //endregion Initialize all field names with empty lists to ensure they're always
                                fieldPatterns.forEach { fieldPatternMap ->
                                    fieldPatternMap.forEach {( fieldName, pattern ) ->
                                        if( pattern.isNotBlank() ) {
                                            try {
                                                val matches = pattern.toRegex().findAll( rawText ).map { it.value }.toList()

                                                imageFields[fieldName] = matches
                                            } catch( X: Exception ) {
                                                log( LogLevel.ERROR, "Regex Error for field '$fieldName': ${ X.message }")

                                                imageFields[fieldName] = emptyList()}
                                        } else { imageFields[fieldName] = emptyList()}
                                    }
                                }

                                fieldResults[image.name] = imageFields

                                TessAPI1.TessDeleteText( ptr )}
                            else fieldResults[image.name] =
                                fieldPatterns.flatMap { it.keys }.associateWith { emptyList<String>() }

                            TessAPI1.TessBaseAPIClear( handle )
                        } catch( X: Throwable ) {
                            throw ServletException(
                                "[[ CodBi / AI / Tesseract ] Processing ${ image.name } failed with: ${ X }.]")
                        } finally { pool.offer( handle )}
                        //endregion OCR Processing
                    }
            }
        } catch( X: Exception ) { logger.error("[[ CodBi / AI / Tesseract ]] Execution Error", X )}
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
                                "\"$escaped\""}
                        "\"$fieldName\":[$arrayValues]"}
                "\"$imageName\":{$fieldsJson}"}

        val servletResponse = ServletResponse( EResponseType.JSON ).apply { value = jsonResponse }
        //endregion Generate response
        return PluginServletActionRetVal( servletResponse )}
    //region Native library management (Tess4J / Lept4J)
    /**
     * Acquires the Maven repository URL from **AI_Tesseract_MavenRepository**. If this plugin property is not set
     * the standard repository ([https://repo1.maven.org/maven2](https://repo1.maven.org/maven2)) will be returned.
     *
     * @return The proper URL. */
    private fun resolveMavenRepo(): String {
        val repo = System.getProperty("codbi.maven.repo.url")?.trim()?.trimEnd('/')

        return if( repo.isNullOrEmpty()) "https://repo1.maven.org/maven2" else repo
    }
    /**
     * Downloads from the specified **url** into the **target**.
     *
     * @param url       The source file.
     * @param target    The target file. */
    private fun downloadTo( url: String, target: File ) {
        target.parentFile?.mkdirs()

        URI(url).toURL().openConnection().apply {
            connectTimeout = 15_000
            readTimeout    = 600_000

            setRequestProperty("User-Agent", "CodBi-Tesseract/1.0")}.getInputStream().use { input ->
            target.outputStream().use { output -> input.copyTo( output )}}
    }
    /**
     * Extracts the element **toExtract** from the given **source** to the given **destination**.
     *
     * @param source        The [File] to extract from.
     * @param toExtract     The name of the element to extract.
     * @param destination   The [File] to extract to.
     * */
    private fun extractJarEntry( source: File, toExtract: String, destination: File ) {
        if( destination.exists()) return

        try {
            JarFile( source ).use { jf ->
                val entry = jf.getJarEntry( toExtract )
                        ?: throw IllegalStateException("[[ CodBi / AI / Tesseract ] Missing native entry in jar: ${ source.name }::$toExtract ]")

                jf.getInputStream( entry ).use { input ->
                    destination.parentFile?.mkdirs()

                    destination.outputStream().use { output -> input.copyTo( output ) }}

                log( LogLevel.INFO, "Provisioned native lib: ${ destination.name }" )}
        } catch( X: Throwable ) {
            log( LogLevel.ERROR, "Failed to extract $toExtract from ${source.name}: ${X.message}" )}
    }
    /**
     * Make sure that the native Windows-Libraries are available.
     *
     * @param dirNativeLibs The directory where the native libraries reside.
     * @param arch          The archtype. */
    private fun ensureWindowsNativeLibs( dirNativeLibs: File?, arch: String ) {
        if( dirNativeLibs == null ) return

        val platformDir  = if( arch.contains("64") ) "win32-x86-64" else "win32-x86"

        val tesseractDll = File( dirNativeLibs, "libtesseract551.dll" )
        val leptDll      = File( dirNativeLibs, "libleptonica1850.dll" )

        if( tesseractDll.exists() && leptDll.exists() ) return

        val repo        = resolveMavenRepo()
        val cache       = dirNativeLibs.parentFile?.resolve("maven-cache")?.apply { mkdirs() } ?: return
        val vTess4j     = System.getProperty("codbi.tess4j.version")?.trim()?.ifBlank { null } ?: "5.16.0"
        val vLept4j     = System.getProperty("codbi.lept4j.version")?.trim()?.ifBlank { null } ?: "1.21.1"
        val tess4jJar   = File( cache, "tess4j-$vTess4j.jar" )
        val lept4jJar   = File( cache, "lept4j-$vLept4j.jar" )

        if(!tess4jJar.exists() ) {
            val url = "$repo/net/sourceforge/tess4j/tess4j/$vTess4j/tess4j-$vTess4j.jar"

            log( LogLevel.INFO, "Downloading Tess4J natives from: $url" )

            downloadTo( url, tess4jJar )}

        if( !lept4jJar.exists() ) {
            val url = "$repo/net/sourceforge/lept4j/lept4j/$vLept4j/lept4j-$vLept4j.jar"

            log( LogLevel.INFO, "Downloading Lept4J natives from: $url" )

            downloadTo( url, lept4jJar )}

        extractJarEntry( tess4jJar, "$platformDir/libtesseract551.dll", tesseractDll )
        extractJarEntry( lept4jJar, "$platformDir/libleptonica1850.dll", leptDll )}
    //endregion Native library management (Tess4J / Lept4J)
    /** Removes the native libraries and the models from the local repository. */
    private fun wipeLocalData() {
        pluginRoot?.resolve("Resources/AI/Tesseract")?.deleteRecursively()
        cacheIDedImages.values.forEach { it.file.delete() }
        cacheIDedImages.clear()
        emptyPool()}
    /**
     * Checks if all models of the specified **language** exist within the **tessDataDir** and
     * downloads them if necessary.
     *
     * @param tessDataDir   The directory where the language models reside.
     * @param language      The languages to ensure the availability of. */
    private fun ensureTessData( tessDataDir: File?, language: String ) {
        if(!tessDataDir?.exists()!! ) tessDataDir.mkdirs()

        val languagesToDownload = listOf("$language.traineddata", "osd.traineddata")
        val baseUrl             = "https://github.com/tesseract-ocr/tessdata_best/raw/main/"

        languagesToDownload.forEach { fileName ->
            val localFile = File( tessDataDir, fileName )

            if(!localFile.exists() || localFile.length() == 0L ) {
                log( LogLevel.INFO, "Downloading $fileName from GitHub...")

                try {
                    downloadTo( "$baseUrl$fileName", localFile )

                    log( LogLevel.INFO, "Successfully downloaded $fileName.")}
                catch( X: Exception ) { log( LogLevel.WARNING, "Failed to download $fileName: ${ X.message }.")}
            }
        }
    }
    /**
     * Shuts down the [pool] and releases all Tesseract handles.
     *
     * @param shutdownData As provided by the formcycle environment. */
    override fun shutdown( shutdownData: IPluginShutdownData?) {
        super.shutdown( shutdownData )

        emptyPool()

        ready = false }
    /**
     * Sets the [idLogMessages] prior to [AI.log]ging.
     *
     * @param importance    See [AI.log].
     * @param toLog         See [AI.log]. */
    override fun log( importance: LogLevel, toLog: String, adjenct: String, exception: Throwable?) {
        super.idLogMessages = "Tesseract"

        super.log( importance, toLog, adjenct, exception )}
}