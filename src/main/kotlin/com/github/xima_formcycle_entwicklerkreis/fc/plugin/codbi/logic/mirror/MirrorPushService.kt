package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror

import org.slf4j.LoggerFactory

/**
 * Phase-2d shared service that pushes the latest SOURCE lane into the registered REFLECTING lanes.
 *
 * Extracted from `MirrorNodePlugin.pushToReflectors` so the same push core can be invoked both from
 * the reflecting-side Mirror node (Option A1) and — the sink of this redesign — from the backend
 * `MirrorPush` servlet action that is triggered by the frontend designer save hook immediately
 * after a SOURCE form/workflow is published.
 *
 * The loop is params-free: it only needs a user context, a source `(formKey, pathId/name)` and the
 * reflectors to fill. After each successful rebuild it mirrors the stored materialized revision for
 * the reflecting target so the reflecting lazy path becomes a no-op (convergence guard), and clears
 * any pending structural-rebuild marker so a subsequent reflecting trigger does not double-rebuild.
 *
 * @since 1.1.0
 */
object MirrorPushService {

  private val logger = LoggerFactory.getLogger(MirrorPushService::class.java)

  /**
   * Entry point of the source-save hook (`X-Action: MirrorPush`): pushes the latest lane of **every
   * Mirror node that mirrors [sourceProjectId]** into its reflecting path.
   *
   * The reflectors are resolved **live from the persisted workflow model**
   * ([WorkflowMirrorAccess.discoverReflectors]) and merged with the runtime registry rows of the
   * same project ([MirrorMaterializedStore.reflectorsOfSourceProject]). The live discovery is what
   * makes the push work the FIRST time — the registry alone is only filled once a reflecting Mirror
   * node has EXECUTED, which never happens for a freshly configured reflective path that still
   * consists of nothing but the Mirror node.
   *
   * @return a human-readable status summary for logging / the servlet response.
   */
  fun pushForSourceProject(userContext: Any?, sourceProjectId: Long): String {
    if (sourceProjectId <= 0L) return "SKIPPED:no-project"
    val reflectors = collectReflectors(userContext, sourceProjectId)
    if (reflectors.isEmpty()) {
      logger.info("[CodBi][Mirror] source-push: no Mirror node mirrors project {}", sourceProjectId)
      return "SKIPPED:no-reflectors"
    }
    val bySource =
        LinkedHashMap<
            Pair<String, Long>, MutableList<MirrorMaterializedStore.ReflectorDescriptor>>()
    for (reflector in reflectors) {
      bySource
          .getOrPut(reflector.sourceFormKey to reflector.sourcePathId) { ArrayList() }
          .add(reflector.descriptor)
    }
    val notes = ArrayList<String>()
    for ((source, descriptors) in bySource) {
      val note = pushToReflectors(userContext, source.first, source.second, null, descriptors)
      notes.add("${source.first}/${source.second} -> $note")
    }
    val summary = notes.joinToString(" | ")
    logger.info("[CodBi][Mirror] source-push for project {}: {}", sourceProjectId, summary)
    return summary
  }

  /**
   * Manual sync entry point used by the Mirror node's properties panel (`CodBi_Mirror&action=sync`)
   * and therefore reachable from the **workflow designer**, where FORMCYCLE offers no save hook:
   * materializes the current lane of `(sourceFormKey, sourcePathId)` into every reflecting lane
   * that mirrors it.
   *
   * @return a human-readable status summary for the servlet response.
   */
  fun syncSourcePath(userContext: Any?, sourceFormKey: String, sourcePathId: Long): String {
    if (sourceFormKey.isBlank() || sourcePathId <= 0L) return "SKIPPED:invalid-source"
    val sourceProjectId =
        MirrorFormAccess.resolveProjectId(userContext, sourceFormKey)
            ?: return "SKIPPED:source-unresolved"
    val descriptors =
        collectReflectors(userContext, sourceProjectId)
            .filter { it.sourceFormKey == sourceFormKey && it.sourcePathId == sourcePathId }
            .map { it.descriptor }
    if (descriptors.isEmpty()) return "SKIPPED:no-reflectors"
    return pushToReflectors(userContext, sourceFormKey, sourcePathId, null, descriptors)
  }

  /**
   * Automatic background sync (used by [MirrorAutoSync]): pushes only the reflecting lanes that are
   * **out of date** — either the source revision changed since the last materialization, or the
   * lane is structurally drifted (it does not contain the source's action nodes anymore, e.g.
   * because the reflecting workflow designer saved its stale model over them).
   *
   * This is what makes the Mirror fully automatic: no designer save hook, no user interaction.
   *
   * @return a human-readable summary of what was pushed (empty work returns `IN_SYNC:…`).
   */
  fun syncOutdatedReflectors(userContext: Any?): String {
    if (userContext == null) return "SKIPPED:no-userContext"
    val discovered = WorkflowMirrorAccess.discoverAll(userContext).reflectors
    if (discovered.isEmpty()) return "SKIPPED:no-reflectors"
    val bySource =
        LinkedHashMap<
            Pair<String, Long>, MutableList<MirrorMaterializedStore.RegisteredReflector>>()
    for (row in discovered) {
      bySource.getOrPut(row.sourceFormKey to row.sourcePathId) { ArrayList() }.add(row)
    }
    var checked = 0
    var pushed = 0
    val notes = ArrayList<String>()
    for ((source, rows) in bySource) {
      val lane = WorkflowLaneMaterializer.loadSource(userContext, source.first, source.second, null)
      if (lane == null) {
        notes.add("${source.first}/${source.second}: SKIPPED:source-unresolved")
        continue
      }
      val expected = WorkflowLaneMaterializer.laneRootCount(lane)
      if (expected == 0) {
        logger.debug(
            "[CodBi][Mirror] auto-sync: source {}/{} has no action nodes — nothing to mirror",
            source.first,
            source.second)
        continue
      }
      val revision = WorkflowLaneMaterializer.contentRevision(lane)
      for (row in rows) {
        checked++
        val stored =
            MirrorMaterializedStore.lastMaterializedRevision(
                row.descriptor.targetWorkflowVersionId, source.first, source.second)
        val structurallyAligned = row.descriptor.childNodeIds.size == expected
        if (stored == revision && structurallyAligned) continue

        // Claim the rebuild for this target so parallel ticks / cluster nodes cannot both recreate
        // the same lane (the marker ages out, so a crashed push stays retryable).
        val pending =
            MirrorMaterializedStore.pendingRebuildEntry(
                row.descriptor.targetWorkflowVersionId, source.first, source.second)
        if (pending != null &&
            pending.revision == revision &&
            pending.ageMillis() < AUTO_SYNC_CLAIM_MS) {
          logger.debug(
              "[CodBi][Mirror] auto-sync: target version {} already rebuilding ({} ms ago) — skip",
              row.descriptor.targetWorkflowVersionId,
              pending.ageMillis())
          continue
        }
        MirrorMaterializedStore.storeRebuildPending(
            row.descriptor.targetWorkflowVersionId, source.first, source.second, revision)
        logger.info(
            "[CodBi][Mirror] auto-sync: source {}/{} -> target version {} needs a rebuild " +
                "(storedRevision={} sourceRevision={} laneNodes={} expected={})",
            source.first,
            source.second,
            row.descriptor.targetWorkflowVersionId,
            stored,
            revision,
            row.descriptor.childNodeIds.size,
            expected)
        val note =
            pushToReflectors(userContext, source.first, source.second, null, listOf(row.descriptor))
        notes.add("${source.first}/${source.second} -> $note")
        if (note.startsWith("PUSHED")) pushed++
      }
    }
    if (notes.isEmpty()) {
      logger.debug("[CodBi][Mirror] auto-sync: nothing to do ({} lane(s) checked)", checked)
      return "IN_SYNC:checked=$checked"
    }
    return "SYNCED:pushed=$pushed/$checked | " + notes.joinToString(" | ")
  }

  /**
   * Re-materializes the latest source lane of `(sourceFormKey, sourcePathId)` into every reflector
   * given. Returns a human-readable status summary for logging / the servlet response.
   */
  fun pushToReflectors(
      userContext: Any?,
      sourceFormKey: String,
      sourcePathId: Long,
      sourceFormName: String? = null,
      reflectors: List<MirrorMaterializedStore.ReflectorDescriptor>,
  ): String {
    if (sourceFormKey.isBlank() || reflectors.isEmpty()) return "SKIPPED:no-reflectors"
    val source =
        WorkflowLaneMaterializer.loadSource(
            userContext, sourceFormKey, sourcePathId, sourceFormName)
    if (source == null) return "SKIPPED:source-unresolved"
    if (WorkflowLaneMaterializer.laneRootCount(source) == 0) {
      return "SKIPPED:empty-source (the source path has no mirrorable action nodes)"
    }
    val revision = WorkflowLaneMaterializer.contentRevision(source)
    var pushed = 0
    for (descriptor in reflectors) {
      val report = WorkflowLaneMaterializer.rebuildLaneFromIds(userContext, source, descriptor)
      if (report.createdNodes > 0) {
        pushed++
        MirrorMaterializedStore.storeMaterializedRevision(
            descriptor.targetWorkflowVersionId, sourceFormKey, sourcePathId, revision)
        MirrorMaterializedStore.clearRebuildPending(
            descriptor.targetWorkflowVersionId, sourceFormKey, sourcePathId)
      }
      report.warnings.take(10).forEach { w ->
        logger.warn(
            "[CodBi][Mirror] source-push warning (target version {}): {}",
            descriptor.targetWorkflowVersionId,
            w)
      }
    }
    return "PUSHED:$pushed/${reflectors.size} reflectors (revision $revision)"
  }

  /**
   * Merges the live discovery with the persisted registry, de-duplicating by `(source form, source
   * path, reflecting workflow version)`. The **discovered** descriptor wins, because it carries the
   * CURRENT lane parent/children — a registry row may be stale after the reflecting path was edited
   * in its designer.
   */
  private fun collectReflectors(
      userContext: Any?,
      sourceProjectId: Long,
  ): List<MirrorMaterializedStore.RegisteredReflector> {
    val discovery = WorkflowMirrorAccess.discoverForSourceProject(userContext, sourceProjectId)
    val merged = LinkedHashMap<String, MirrorMaterializedStore.RegisteredReflector>()
    for (row in MirrorMaterializedStore.reflectorsOfSourceProject(sourceProjectId)) {
      merged[reflectorKey(row)] = row
    }
    for (row in discovery.reflectors) {
      merged[reflectorKey(row)] = row
    }
    // A pause marker on the SOURCE path must also silence stale registry rows.
    val active =
        merged.values.filterNot { (it.sourceFormKey to it.sourcePathId) in discovery.pausedSources }
    logger.info(
        "[CodBi][Mirror] source-push project {}: registry={} discovered={} active={} paused={}",
        sourceProjectId,
        merged.size - discovery.reflectors.size,
        discovery.reflectors.size,
        active.size,
        discovery.pausedSources.size)
    return active
  }

  /** De-duplication key of a reflector: one reflecting lane per (source, target version). */
  private fun reflectorKey(row: MirrorMaterializedStore.RegisteredReflector): String =
      "${row.sourceFormKey}/${row.sourcePathId}/v${row.descriptor.targetWorkflowVersionId}"

  /** How long an automatic-sync rebuild claim is honored before another attempt is allowed. */
  private const val AUTO_SYNC_CLAIM_MS = 120_000L
}
