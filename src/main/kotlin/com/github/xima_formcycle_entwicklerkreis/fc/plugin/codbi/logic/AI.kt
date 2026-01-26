package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

// region Imports
// region XIMA
// endregion XIMA
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.TesseractAction
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit
import org.slf4j.LoggerFactory

// endregion Imports
/**
 * # Serves as a common base for all classes related to CodBi / AI.
 *
 * In order to enable the re-usage of images that were already uploaded, this class sets up a cache
 * ([cacheIDedImages]) that is managed by a janitor ([janitorIDedImages]) with a specific expiration
 * time for the images defined ([msExpirationIDedImages]).
 *
 * A dedicated [log]ger posts messages in following manner to the console **[[ CodBi / AI /
 * [idLogMessages] ] **...message...** ]**.
 *
 * ## AI on Formcylce server benefits
 * - **Lean Compliance**: Simpler DSGVO and EU AI Act handling. Most easy approval from your Data
 *   Protection Officer (DSGVO), No Data Transit Mapping, No extra TOMs, no extra VVTs, remain User
 *   instead of becoming an infrastructure operator or even a provider regarding the EU-AI Act.
 * - **Infrastructure Efficiency**: No second OS to patch, monitor, or license. Dramatically lowers
 *   TCO (Total Cost of Ownership) and prevents "server sprawl."
 * - **Maximum Performance**: Zero network latency. Localhost communication bypasses the physical
 *   network, ensuring the fastest possible data exchange between Formcycle and the AI.
 * - **Simplified Security**: No internal API ports to open or protect. Data never leaves the
 *   machine, eliminating the need for complex mTLS or inter-server encryption.
 * - **Unified Maintenance**: Single-point backups ensure the application and AI model are always in
 *   sync. Debugging is faster with all logs centralized on one filesystem.
 *
 * **Bottom Line**: Hosting on the same server is the most pragmatic, cost-effective, and
 * low-maintenance approach for high-speed, internalized workflows.
 */
abstract class AI : IPluginServletAction {
  /**
   * The predicate used to [log] messages related to CodBi / AI to the console (defaults to **CodBi
   * / AI**).
   */
  protected var idLogMessages = ""

  /** Defines the various importance-states that can be passed to the [log]ger. */
  enum class LogLevel {
    INFO,
    WARNING,
    ERROR
  }

  /** The [org.slf4j.Logger] for this [TesseractAction]. */
  protected val logger = LoggerFactory.getLogger(TesseractAction::class.java)

  /**
   * Stores [File] and timestamp so we can clean up old ones that passed the
   * [msExpirationIDedImages].
   */
  data class CachedImage(val file: File, val timestamp: Long = System.currentTimeMillis())

  /** The cache that hold the images for which an **X-OCR-Image-ID** was transmitted. */
  protected val cacheIDedImages = ConcurrentHashMap<String, CachedImage>()
  /**
   * Specifies the time in milliseconds that an image in the [cacheIDedImages] may persist (defaults
   * to 600000). This value can be overridden by the plugin property **AI_CachedImageExpiration**.
   */
  protected var msExpirationIDedImages: Long = 10 * 60 * 1000L
  /** The service that is responsible for keeping the [cacheIDedImages] clean. */
  protected var janitorIDedImages: ScheduledExecutorService? = null

  /**
   * Initializes the AI components by reading configuration properties. Specifically, it acquires
   * the `msExpirationIDedImages` from the plugin property "AI_CachedImageExpiration". Subclasses
   * should call this method at the beginning of their own `initialize` implementation.
   *
   * @param configData Provided by the Formcycle environment.
   */
  override fun initialize(configData: IPluginInitializeData) {
    idLogMessages = "Tesseract"

    val expirationValue = configData.properties.getProperty("AI_CachedImageExpiration")

    if (!expirationValue.isNullOrBlank()) {
      expirationValue.toLongOrNull()?.let {
        if (it > 0) {
          msExpirationIDedImages = it
        } else {
          log(
              LogLevel.WARNING,
              "AI_CachedImageExpiration must be a positive number, but was '$expirationValue'. Using default.")
        }
      }
    }
  }

  /**
   * Posts log message to the console signed with **[[ CodBi / AI / [idLogMessages] ]
   * **...message...** ]** of a specified importance (info or error).
   *
   * @param importance The [LogLevel] for this message.
   * @param toLog The message itself.
   * @param adjenct A message to append to the message.
   * @param exception The [Throwable] [Object] this message is about.
   */
  protected open fun log(
      importance: LogLevel,
      toLog: String,
      adjenct: String = "",
      exception: Throwable? = null
  ) {
    val message =
        "[[ CodBi / AI${ if( idLogMessages.isEmpty()) "" else " / $idLogMessages$adjenct"} ] $toLog ]"

    when (importance) {
      LogLevel.INFO -> logger.info(message)
      LogLevel.WARNING -> logger.warn(message)
      LogLevel.ERROR -> {
        if (exception != null) {
          logger.error(message, exception)
        } else {
          logger.error(message)
        }
      }
    }
  }

  /**
   * Initiates a task that removes unused images that're expired ([msExpirationIDedImages]) from the
   * cache ([cacheIDedImages]).
   */
  fun startJanitor() {
    janitorIDedImages?.scheduleAtFixedRate(
        {
          val now = System.currentTimeMillis()
          val iterator = cacheIDedImages.entries.iterator()

          while (iterator.hasNext()) {
            val entry = iterator.next()
            val age = now - entry.value.timestamp

            if (age > msExpirationIDedImages) {
              entry.value.file.delete()
              iterator.remove()

              log(LogLevel.INFO, "Janitor: Purged image ${entry.key} (Age: ${age/1000}s).")
            }
          }
        },
        1,
        1,
        TimeUnit.MINUTES)
  }

  /** Shuts down the janitor ([startJanitor]) and removes all cached images ([cacheIDedImages]). */
  override fun shutdown(shutdownData: IPluginShutdownData?) {
    try {
      janitorIDedImages?.shutdown()

      if (janitorIDedImages?.awaitTermination(5, TimeUnit.SECONDS) == false) {
        janitorIDedImages?.shutdownNow()
      }
    } catch (X: InterruptedException) {
      janitorIDedImages?.shutdownNow()
    }

    cacheIDedImages.values.forEach { it.file.delete() }
    cacheIDedImages.clear()

    janitorIDedImages = null
  }
}
