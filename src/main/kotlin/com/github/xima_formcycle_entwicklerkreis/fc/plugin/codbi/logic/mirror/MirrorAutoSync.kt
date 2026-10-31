package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodbiEntities
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import org.slf4j.LoggerFactory

/**
 * Automatic, background Mirror synchronisation.
 *
 * FORMCYCLE offers plugins **no** server-side "workflow saved" event and no workflow-designer
 * resource hook, so a source path saved in the workflow designer cannot notify the reflecting forms
 * directly. Instead of requiring a manual click, this watcher polls the persisted workflow model at
 * a fixed interval and lets [MirrorPushService.syncOutdatedReflectors] re-materialize **only** the
 * lanes that are out of date:
 * - the source path's content revision changed since the last materialization, or
 * - the reflecting lane no longer contains the source's action nodes (structural drift, e.g. the
 *   reflecting workflow designer saved its stale in-memory model over freshly created nodes).
 *
 * When nothing changed the tick is a cheap read-only pass (one query for the `Mirror` nodes plus
 * one source-lane read per distinct source path), so an idle installation costs almost nothing.
 *
 * Started once per JVM from [`CodbiFormResourcesPlugin.initialize`]; the daemon thread never blocks
 * shutdown. Rebuild claims are guarded by the timestamped pending marker in
 * [MirrorMaterializedStore], so overlapping ticks (or cluster nodes) cannot recreate the same lane
 * twice.
 *
 * @since 1.1.0
 */
object MirrorAutoSync {

  private val logger = LoggerFactory.getLogger(MirrorAutoSync::class.java)

  /** Default interval between two watcher passes (overridable via the plugin property). */
  const val DEFAULT_INTERVAL_SECONDS = 30L

  /** Plugin property (FORMCYCLE plugin configuration) that overrides the watcher interval. */
  const val INTERVAL_PROPERTY = "wgtMirror_WatcherIntervalSeconds"

  /**
   * Delay before the first pass: the plugin is initialized while FORMCYCLE is still starting up, so
   * the database/API may not be usable yet.
   */
  private const val INITIAL_DELAY_SECONDS = 30L

  private val starter = Any()

  @Volatile private var started = false

  /** The watcher's executor; kept so [stop] can end it on plugin shutdown / hot deploy. */
  @Volatile private var executor: ScheduledExecutorService? = null

  /** Guards against overlapping passes (a slow pass must not stack up). */
  private val running = AtomicBoolean(false)

  /**
   * Starts the watcher once; later calls are no-ops.
   *
   * @param intervalSeconds seconds between two passes (see [INTERVAL_PROPERTY]); clamped to 5 s … 1
   *   h, defaults to [DEFAULT_INTERVAL_SECONDS].
   */
  fun start(intervalSeconds: Long = DEFAULT_INTERVAL_SECONDS) {
    if (started) return
    synchronized(starter) {
      if (started) return
      started = true
      val interval = intervalSeconds.coerceIn(5L, 3600L)
      try {
        val scheduler =
            Executors.newSingleThreadScheduledExecutor { runnable ->
              Thread(runnable, "codbi-mirror-autosync").apply { isDaemon = true }
            }
        executor = scheduler
        val initialDelay = minOf(INITIAL_DELAY_SECONDS, interval)
        scheduler.scheduleWithFixedDelay({ runOnce() }, initialDelay, interval, TimeUnit.SECONDS)
        logger.info(
            "[CodBi][Mirror] auto-sync watcher started (initial delay {} s, interval {} s)",
            initialDelay,
            interval)
      } catch (x: Throwable) {
        started = false
        logger.warn("[CodBi][Mirror] auto-sync watcher could not be started: {}", x.message)
      }
    }
  }

  /** Stops the watcher (plugin shutdown / hot deploy). Safe to call when it was never started. */
  fun stop() {
    synchronized(starter) {
      started = false
      runCatching { executor?.shutdownNow() }
      executor = null
      logger.info("[CodBi][Mirror] auto-sync watcher stopped")
    }
  }

  /** One watcher pass: never throws, never blocks the caller. */
  private fun runOnce() {
    if (!running.compareAndSet(false, true)) return
    try {
      if (CodbiEntities.entityManagerFactory == null) {
        logger.debug("[CodBi][Mirror] auto-sync: database not ready — skipping this pass")
        return
      }
      val userContext = MirrorFormAccess.systemContext()
      if (userContext == null) {
        logger.debug("[CodBi][Mirror] auto-sync: no system user context — skipping this pass")
        return
      }
      // Self-healing pass: repair NULL `@OrderColumn` indexes (e.g. left behind by an interrupted
      // path creation). A single damaged row makes FORMCYCLE's indexed collections unloadable and
      // breaks the whole designer for that form, so this runs before anything else.
      val repaired = MirrorDataRepair.repairAll(userContext)
      if (repaired > 0) {
        logger.warn("[CodBi][Mirror] auto-sync: repaired {} order-index collection(s)", repaired)
      }
      val note = MirrorPushService.syncOutdatedReflectors(userContext)
      if (note.startsWith("SYNCED")) {
        logger.info("[CodBi][Mirror] auto-sync: {}", note)
      } else {
        logger.debug("[CodBi][Mirror] auto-sync: {}", note)
      }
    } catch (x: Throwable) {
      logger.warn("[CodBi][Mirror] auto-sync pass failed: {}", x.message)
    } finally {
      running.set(false)
    }
  }
}
