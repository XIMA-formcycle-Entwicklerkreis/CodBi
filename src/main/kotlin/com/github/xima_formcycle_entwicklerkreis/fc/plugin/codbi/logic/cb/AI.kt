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
     * Tracks every request that is waiting for or currently holding the inference semaphore.
     * Streaming threads register before [acquire]; retry-based clients (sync LLAMA, Tesseract)
     * register on the first failed [tryAcquire]. Tickets are removed when inference completes (in
     * the finally block after [release]). The map value is the creation timestamp for waiting
     * tickets, or [Long.MAX_VALUE] for running inferences (immune to stale cleanup).
     */
    @JvmStatic val queueTickets = java.util.concurrent.ConcurrentHashMap<String, Long>()

    /**
     * Maps ticket UUID → model-type key (e.g. `"llama-thinking"`, `"llama-fast"`, `"tesseract"`).
     * Registered alongside [queueTickets] so [estimateWaitMs] can look up which model types are
     * ahead in the queue and calculate an approximate wait time.
     */
    @JvmStatic val ticketModelTypes = java.util.concurrent.ConcurrentHashMap<String, String>()

    /** Maximum number of past durations kept per model type for averaging. */
    private const val MAX_HISTORY_SIZE = 20

    /**
     * Stores the last [MAX_HISTORY_SIZE] inference durations (in ms) per model-type key. Used by
     * [estimateWaitMs] to compute average inference time per model type.
     */
    @JvmStatic
    val inferenceHistory = java.util.concurrent.ConcurrentHashMap<String, MutableList<Long>>()

    /**
     * Records the duration of a completed inference for a given model type.
     *
     * @param modelType The model-type key (e.g. `"llama-thinking"`, `"tesseract"`).
     * @param durationMs The wall-clock duration in milliseconds.
     */
    @JvmStatic
    fun recordInferenceDuration(modelType: String, durationMs: Long) {
      inferenceHistory.compute(modelType) { _, list ->
        val l = list ?: java.util.Collections.synchronizedList(mutableListOf())
        l.add(durationMs)
        while (l.size > MAX_HISTORY_SIZE) l.removeAt(0)
        l
      }
    }

    /**
     * Estimates the total wait time (in ms) for a ticket by summing the average inference duration
     * of every ticket ahead of it in the queue. Only tickets whose model type has recorded history
     * contribute to the estimate. Returns `null` if no estimate is possible (no history for any of
     * the queued model types).
     *
     * @param excludeTicket The ticket UUID to exclude (the requester's own ticket).
     */
    @JvmStatic
    fun estimateWaitMs(excludeTicket: String?): Long? {
      val permits = inferenceSemaphore.availablePermits()
      val otherTickets = queueTickets.keys.filter { it != excludeTicket }
      if (otherTickets.isEmpty()) return null
      // Only tickets that are waiting (not currently running) contribute to wait.
      // Running tickets (MAX_VALUE) will finish soon — include their avg as well since
      // they are occupying a permit that we need.
      var totalMs = 0L
      var hasEstimate = false
      // Count how many are running vs waiting ahead
      val running = otherTickets.filter { queueTickets[it] == Long.MAX_VALUE }
      val waiting =
          otherTickets.filter { queueTickets[it] != Long.MAX_VALUE && queueTickets[it] != null }
      // For each running inference, add its avg duration (it's occupying a slot we might need)
      for (ticket in running) {
        val mt = ticketModelTypes[ticket] ?: continue
        val hist = inferenceHistory[mt] ?: continue
        if (hist.isEmpty()) continue
        totalMs += hist.average().toLong()
        hasEstimate = true
      }
      // For each waiting inference ahead, add its avg duration
      for (ticket in waiting) {
        val mt = ticketModelTypes[ticket] ?: continue
        val hist = inferenceHistory[mt] ?: continue
        if (hist.isEmpty()) continue
        totalMs += hist.average().toLong()
        hasEstimate = true
      }
      // Divide by concurrency (multiple slots can run in parallel)
      val effectivePermits = (permits + running.size).coerceAtLeast(1)
      return if (hasEstimate) (totalMs / effectivePermits) else null
    }

    /**
     * Removes waiting tickets older than 30 s (abandoned clients). Active tickets
     * ([Long.MAX_VALUE]) are not affected.
     */
    @JvmStatic
    fun cleanupStaleTickets() {
      val cutoff = System.currentTimeMillis() - 30_000
      queueTickets.entries.removeIf { entry ->
        if (entry.value < cutoff) {
          ticketModelTypes.remove(entry.key)
          true
        } else false
      }
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
