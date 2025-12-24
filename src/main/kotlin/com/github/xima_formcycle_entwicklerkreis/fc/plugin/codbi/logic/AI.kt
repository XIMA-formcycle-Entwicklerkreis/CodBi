package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.ai.TesseractAction
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit
import org.slf4j.LoggerFactory

/**
 * Serves as a common base for all classes related to CodBi / AI. In order to enable the re-usage of
 * images that were already uploaded, this class sets up a cache ([cacheIDedImages]) that is managed
 * by a janitor ([janitorIDedImages]) with a specific expiration time for the images defined
 * ([msExpirationIDedImages]).
 *
 * A dedicated [log]ger posts messages in following manner to the console **[[ CodBi / AI /
 * [idLogMessages] ] **...message...** ]**.
 */
abstract class AI {
  /**
   * The predicate used to [log] messages related to CodBi / AI to the console (defaults to **CodBi
   * / AI**).
   */
  protected var idLogMessages = ""
  /** The [org.slf4j.Logger] for this [TesseractAction]. */
  private val logger = LoggerFactory.getLogger(TesseractAction::class.java)

  /**
   * Stores [File] and timestamp so we can clean up old ones that passed the
   * [msExpirationIDedImages].
   */
  data class CachedImage(val file: File, val timestamp: Long = System.currentTimeMillis())

  /** The cache that hold the images for which an **X-OCR-Image-ID** was transmitted. */
  protected val cacheIDedImages = ConcurrentHashMap<String, CachedImage>()
  /**
   * Specifies the time in milliseconds that an image in the [cacheIDedImages] may persist (defaults
   * to 600000).
   */
  protected val msExpirationIDedImages = 10 * 60 * 1000
  /** The service that is responsible for keeping the [cacheIDedImages] clean. */
  protected var janitorIDedImages: ScheduledExecutorService? = null

  /**
   * Posts log message to the console signed with **[[ CodBi / AI / [idLogMessages] ]
   * **...message...** ]**
   */
  protected fun log(toLog: String) {}

  fun startJanitor() {
    janitorIDedImages?.scheduleAtFixedRate(
        {
          val now = System.currentTimeMillis()
          val iterator = cacheIDedImages.entries.iterator()

          while (iterator.hasNext()) {
            val entry = iterator.next()

            // HERE is where CACHE_EXPIRATION_MS is used:
            val age = now - entry.value.timestamp

            if (age > msExpirationIDedImages) {
              // The file has expired
              entry.value.file.delete()
              iterator.remove()
              logger.info("[[ CodBi ]] Janitor: Purged image ${entry.key} (Age: ${age/1000}s)")
            }
          }
        },
        1,
        1,
        TimeUnit.MINUTES)
  }
}
