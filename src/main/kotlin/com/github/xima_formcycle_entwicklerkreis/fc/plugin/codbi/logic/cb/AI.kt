package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

// region Imports
// #region XIMA
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi
import de.xima.fc.interfaces.plugin.lifecycle.IPluginInitializeData
import de.xima.fc.interfaces.plugin.lifecycle.IPluginShutdownData
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

// #endregion XIMA
// endregion Imports
/**
 * # Base for all classes related to [CodBi] / AI.
 *
 * In order to enable the re-usage of images that were already uploaded, this class sets up a cache
 * ([cacheIDedImages]) that is managed by a janitor ([janitorIDedImages]) with a specific expiration
 * time for the images defined ([msExpirationIDedImages]). **DSGVO Notice**: IDed images are
 * temporarily stored as files on the server.
 *
 * A dedicated [log]ger posts messages in following manner to the console **[[ CodBi / AI /
 * [idLogMessages] ] **...message...** ]**.
 *
 * ## AI on Formcylce server benefits
 * - **Lean Compliance**: Simpler DSGVO and EU AI Act handling. Most easy approval from your Data
 *   Protection Officer (DSGVO), No Data Transit Mapping, No extra TOMs, no extra VVTs.
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
 *
 * ## Plugin Properties
 * |Property                  |Type|Default |Description                                                          |
 * |--------------------------|----|--------|---------------------------------------------------------------------|
 * |`AI_CachedImageExpiration`|Long|`600000`|Time in ms before a cached image expires and is purged by the janitor|
 */
abstract class AI : CodBi(), IPluginServletAction {
  // region Shared Concurrency Control
  companion object {
    /**
     * Shared semaphore that limits concurrent **local** AI inferences across all modules (LLAMA,
     * Tesseract, Whisper). Configured via `AI_LLAMA_ENGINE_MaxConcurrent` (default 2).
     */
    @Volatile
    @JvmStatic
    var inferenceSemaphore = java.util.concurrent.Semaphore(2, true)
      private set

    /** Whether the queue-position badge is enabled globally. Configured via `AI_QueueBadge`. */
    @Volatile @JvmStatic var queueBadgeEnabled: Boolean = false

    /**
     * Tracks every request that wants the inference semaphore but does not yet hold it. Streaming
     * threads register while blocked on [acquire]; retry-based clients (sync LLAMA, Tesseract)
     * register on the first failed [tryAcquire] and are removed when they eventually acquire or
     * abandon. The map value is the creation timestamp (for stale-ticket cleanup).
     */
    @JvmStatic val queueTickets = java.util.concurrent.ConcurrentHashMap<String, Long>()

    /** Removes queue tickets older than 30 s (abandoned clients). */
    @JvmStatic
    fun cleanupStaleTickets() {
      val cutoff = System.currentTimeMillis() - 30_000
      queueTickets.entries.removeIf { it.value < cutoff }
    }

    /** Replaces the shared inference semaphore with a new limit. */
    @JvmStatic
    fun updateMaxConcurrent(maxConcurrent: Int) {
      inferenceSemaphore = java.util.concurrent.Semaphore(maxConcurrent.coerceAtLeast(1), true)
    }
  }

  // endregion Shared Concurrency Control
  /**
   * Stores [File] and timestamp so we can clean up old ones that passed the
   * [msExpirationIDedImages].
   */
  data class CachedImage(val file: File, val timestamp: Long = System.currentTimeMillis())

  /** The cache that hold the images for which an **X-OCR-Image-ID** was transmitted. */
  protected val cacheIDedImages: ConcurrentHashMap<String, CachedImage> = ConcurrentHashMap()
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
    idLogMessages = "AI"

    val expirationValue = configData.properties.getProperty("AI_CachedImageExpiration")

    configData.properties.getProperty("AI_QueueBadge")?.trim()?.lowercase()?.let {
      queueBadgeEnabled = it == "true" || it == "1" || it == "yes"
    }

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
