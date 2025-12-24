package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai

import ai.djl.engine.Engine
import ai.djl.engine.EngineProvider
import ai.djl.inference.Predictor
import ai.djl.repository.zoo.Criteria
import ai.djl.repository.zoo.ModelZoo
import ai.djl.repository.zoo.ZooModel
import ai.djl.repository.zoo.ZooProvider
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.AI
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.BlockingQueue
import javax.servlet.ServletException
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory

abstract class Pytorch<I, O> : AI(), IPluginServletAction {
  private val logger = LoggerFactory.getLogger(this::class.java)

  protected val models = mutableMapOf<String, ZooModel<*, *>>()
  private val predictorPools = mutableMapOf<String, BlockingQueue<Predictor<*, *>>>()

  companion object {
    private const val POOL_SIZE = 3 // Reduced slightly for multi-model memory safety
    const val DEFAULT_MODEL = "primary"
  }

  private fun checkDjlConnectivity() {
    val urlsToCheck =
        listOf(
            "https://mlrepo.djl.ai/model/cv/object_detection/ai/djl/pytorch/craft/metadata.json",
            "https://mlrepo.djl.ai/model/cv/word_recognition/ai/djl/pytorch/crnn/metadata.json")

    logger.info("[[ CodBi / AI ] Checking Network Connectivity to DJL Repo...")

    urlsToCheck.forEach { urlString ->
      try {
        val url = java.net.URL(urlString)
        val connection = url.openConnection() as java.net.HttpURLConnection
        connection.requestMethod = "HEAD"
        connection.connectTimeout = 5000 // 5 seconds
        connection.readTimeout = 5000

        val responseCode = connection.responseCode
        if (responseCode in 200..399) {
          logger.info("  [ SUCCESS ] Reachable: $urlString (Status: $responseCode)")
        } else {
          logger.warn("  [ FAILED ] Server replied with $responseCode for: $urlString")
        }
        connection.disconnect()
      } catch (e: java.net.UnknownHostException) {
        logger.error(
            "  [ FAILED ] DNS Error: Cannot resolve mlrepo.djl.ai. Check your server's DNS/Firewall.")
      } catch (e: java.net.ConnectException) {
        logger.error(
            "  [ FAILED ] Connection Refused: Your firewall is likely blocking outbound HTTPS to DJL.")
      } catch (e: java.net.SocketTimeoutException) {
        logger.error("  [ FAILED ] Timeout: Connection took too long. Possible Proxy issue.")
      } catch (e: Exception) {
        logger.error("  [ ERROR ] Unexpected issue: ${e.message}")
      }
    }
  }

  @Throws(ServletException::class)
  override fun initialize(configData: IPluginInitializeData) {
    return
    checkDjlConnectivity()

    val originalClassLoader = Thread.currentThread().contextClassLoader
    try {
      Thread.currentThread().contextClassLoader = this.javaClass.classLoader

      // Setup Cache
      configData.fileHelper?.pluginFolder?.absolutePath?.let { path ->
        System.setProperty("DJL_CACHE_DIR", path)
        System.setProperty("ENGINE_CACHE_DIR", path)
      }

      // Register Infrastructure
      registerEngine("ai.djl.pytorch.engine.PtEngineProvider")
      registerZoo("ai.djl.pytorch.zoo.PtZooProvider")

      val wordRecRepo = "https://mlrepo.djl.ai/model/cv/word_recognition/ai/djl/pytorch/crnn/"
      val currentPaths = System.getProperty("ai.djl.repository.zoo.location", "")
      ai.djl.repository.zoo.ModelZoo.listModelZoo().forEach { zoo ->
        // This empty loop forces the initialization of each provider
      }
      if (!currentPaths.contains(wordRecRepo)) {
        val newPath = if (currentPaths.isEmpty()) wordRecRepo else "$currentPaths,$wordRecRepo"
        System.setProperty("ai.djl.repository.zoo.location", newPath)
      }
      // --- NEW DIAGNOSTIC LOGGING ---
      try {
        val allModels = ModelZoo.listModels()
        logger.info("[[ CodBi / AI ] --- GLOBAL MODEL DIRECTORY ---")
        allModels.forEach { (app, mrlList) ->
          logger.info("  Application: ${app.path}")
          mrlList.forEach { mrl -> logger.info("    -> ${mrl.toString()}") }
        }
      } catch (e: Exception) {
        logger.warn("[[ CodBi / AI ] Could not list models: ${e.message}")
      }
      // ------------------------------
      // Multi-Model Loading
      val criteriaMap = getCriteriaMap()
      criteriaMap.forEach { (key, criteria) ->
        logger.info("[[ CodBi / AI ] Loading model component: $key")
        val loadedModel = criteria.loadModel()
        models[key] = loadedModel

        // Initialize Pool for this specific component
        val pool = ArrayBlockingQueue<Predictor<*, *>>(POOL_SIZE)
        repeat(POOL_SIZE) { pool.put(loadedModel.newPredictor()) }
        predictorPools[key] = pool
      }
    } catch (e: Exception) {
      logger.error("[[ CodBi / AI ] Initialization failed: ${e.message}", e)
      throw ServletException("Failed to initialize AI Engine", e)
    } finally {
      Thread.currentThread().contextClassLoader = originalClassLoader
    }
  }

  /** Helper to get a typed predictor from the pool */
  @Suppress("UNCHECKED_CAST")
  protected fun <PI, PO> getPredictor(key: String = DEFAULT_MODEL): Predictor<PI, PO> {
    return predictorPools[key]?.take() as? Predictor<PI, PO>
        ?: throw IllegalStateException("No predictor pool for $key")
  }

  private fun registerEngine(className: String) {
    try {
      val clazz = Class.forName(className)
      val provider = clazz.getDeclaredConstructor().newInstance() as EngineProvider
      Engine.registerEngine(provider)
      logger.info("[[ CodBi / AI ] Engine registered: $className")
    } catch (e: Exception) {
      logger.warn("[[ CodBi / AI ] Engine $className not found in classpath. Skipping.")
    }
  }

  private fun registerZoo(className: String) {
    try {
      val clazz = Class.forName(className)
      val provider = clazz.getDeclaredConstructor().newInstance() as ZooProvider
      ModelZoo.registerModelZoo(provider)
      logger.info("[[ CodBi / AI ] ModelZoo registered: $className ]")
    } catch (e: Exception) {
      logger.warn("[[ CodBi / AI ] ModelZoo $className not found in classpath. Skipping. ]")
    }
  }

  protected fun releasePredictor(key: String, predictor: Predictor<*, *>?) {
    predictor?.let { predictorPools[key]?.offer(it) }
  }

  // --- Implementation Contract ---

  /**
   * For a single model, return mapOf(DEFAULT_MODEL to criteria) For multi-model (EasyOCR), return
   * mapOf("detector" to craft, "recognizer" to crnn)
   */
  protected abstract fun getCriteriaMap(): Map<String, Criteria<*, *>>

  protected abstract fun parseInput(req: HttpServletRequest): I?

  protected abstract fun writeResponse(resp: HttpServletResponse, output: O)

  fun destroy() {
    predictorPools.values.forEach { pool -> pool.forEach { it.close() } }
    models.values.forEach { it.close() }
  }
}
