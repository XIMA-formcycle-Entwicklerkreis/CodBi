package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.MirrorFormAccess
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.MirrorMaterializedStore
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.WorkflowLaneMaterializer
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.WorkflowMirrorAccess
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.workflow.EMirrorOutputMode
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants
import com.google.gson.Gson
import de.xima.fc.beans.interfaces.IGuiIcon
import de.xima.fc.interfaces.workflow.execution.INormalCompletionResult
import de.xima.fc.interfaces.workflow.mixin.IElementCategory
import de.xima.fc.interfaces.workflow.params.IGetElementPrototypesParams
import de.xima.fc.interfaces.workflow.params.INodeExecutionParams
import de.xima.fc.interfaces.workflow.value.IValueDescriptor
import de.xima.fc.interfaces.workflow.value.IValueDescriptorFactory
import de.xima.fc.mdl.ui.CustomGuiIcon
import de.xima.fc.workflow.mixin.APluginActionNodeHandler
import de.xima.fc.workflow.taglib.model.ClientOpaqueColor
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.UUID
import org.slf4j.LoggerFactory

/**
 * Workflow node that **mirrors a workflow path of another form**.
 *
 * The node stores the source form (`project-<id>`) and the source path id (`WorkflowTask`). At
 * execution time it resolves the source project's *active* `WorkflowVersion`, reads the path's
 * trigger and node tree and exposes it as a workflow result:
 * ```
 * [%$<node name>.RESULT.value%]      // same as summary (primary value)
 * [%$<node name>.RESULT.summary%]    // human-readable overview
 * [%$<node name>.RESULT.nodes%]      // list of "<type>: <name>" lines
 * [%$<node name>.RESULT.nodeCount%]  // number of reflected nodes
 * [%$<node name>.RESULT.trigger%]    // trigger type/name
 * [%$<node name>.RESULT.form%]       // source form title
 * [%$<node name>.RESULT.path%]       // source path name
 * [%$<node name>.RESULT.revision%]   // content hash of the reflected path
 * ```
 *
 * Because resolution is live, edits in the source workflow are reflected by the next execution —
 * there is no pinned/versioned mode.
 *
 * @since 1.1.0
 */
class MirrorNodePlugin : APluginActionNodeHandler<MirrorNodeProps>() {

  override fun getName(): String = NODE_TYPE

  override fun getPropertiesViewXhtmlName(): String = "MirrorNode.xhtml"

  override fun getMainCategory(params: IGetElementPrototypesParams): IElementCategory =
      ECodbiWorkflowElementCategory.MAIN_CODBI

  override fun getSubCategory(params: IGetElementPrototypesParams): IElementCategory =
      ECodbiWorkflowElementCategory.SUB_CODBI_MIRROR

  /** Palette/canvas icon: the same icon the form Mirror widget uses. */
  override fun getPrototypeIcon(params: IGetElementPrototypesParams): IGuiIcon =
      buildPrototypeIcon(currentContextPath())

  /** Dark-orange node accent in the workflow designer, matching the CodBi brand colour. */
  override fun getThemeColor(): ClientOpaqueColor = ClientOpaqueColor.ofRgb(255, 140, 0)

  override fun getResourceBundlePath(): String = Constants.RESOURCE_PATH_BUNDLE.removePrefix("/")

  override fun getSuccessValueDescriptor(factory: IValueDescriptorFactory): IValueDescriptor<*, *> =
      factory
          .recordBuilder()
          .optionalProperty("form", factory.string())
          .optionalProperty("path", factory.string())
          .optionalProperty("trigger", factory.string())
          .optionalProperty("summary", factory.string())
          .optionalProperty("value", factory.string())
          .optionalProperty("nodes", factory.listOfStrings())
          .optionalProperty("nodeCount", factory.string())
          .optionalProperty("revision", factory.string())
          .build()

  override fun execute(params: INodeExecutionParams<MirrorNodeProps>): INormalCompletionResult {
    val props = params.data
    logger.info(
        "[CodBi][Mirror] execute node='{}' sourceForm='{}' pathId='{}' mode='{}' spikeProbe='{}' " +
            "spikeProbe2='{}'",
        props.name,
        props.sourceForm,
        props.pathId,
        props.outputMode,
        props.spikeProbe,
        props.spikeProbe2)

    // TEMPORARY Phase-0 spike gate (RUN 1): when enabled, inject a SpikeProbe node into the current
    // task's downstream lane and watch whether it is executed IN THE SAME submit. Delete after
    // spike.
    if (props.spikeProbe) {
      runCatching { runSpikeProbe(params) }
          .onFailure { e -> logger.warn("[SPIKE] runSpikeProbe failed: {}", e.message, e) }
    }

    // TEMPORARY Phase-0 spike gate (RUN 2): when enabled, mutate the existing downstream node's
    // params IN PLACE (the realistic Option B rewrite path) and observe whether the change lands
    // same-trigger. Delete after the spike.
    if (props.spikeProbe2) {
      runCatching { runSpikeProbe2(params) }
          .onFailure { e -> logger.warn("[SPIKE]2 runSpikeProbe2 failed: {}", e.message, e) }
    }

    if (props.sourceForm.isNullOrBlank()) {
      logger.warn("[CodBi][Mirror] node='{}' has no configured source form", props.name)
      params.softError("FORM_REQUIRED", "Please configure a source form.", emptyMap<String, Any>())
      return params.normalResult().build()
    }
    val pathId = props.pathId?.trim()?.toLongOrNull()
    if (pathId == null || pathId <= 0L) {
      logger.warn("[CodBi][Mirror] node='{}' has no configured source path", props.name)
      params.softError(
          "PATH_REQUIRED", "Please configure a workflow path.", emptyMap<String, Any>())
      return params.normalResult().build()
    }

    val env = params.workflowContext.env()
    val userContext =
        runCatching { MirrorFormAccess.userContextFor(env.user) }.getOrNull()
            ?: MirrorFormAccess.systemContext()
    logger.debug(
        "[CodBi][Mirror] node='{}' resolving snapshot for sourceForm='{}' pathId='{}' " +
            "userContextPresent={}",
        props.name,
        props.sourceForm,
        pathId,
        userContext != null)

    // Phase-2 lazy re-sync (Option B) + Phase-2d reflecting registration. The Mirror node always
    // runs on a REFLECTING form: it keeps its descriptor (now including sourceProjectId) in the
    // source registry so the backend MirrorPush handler — triggered by the frontend source-save
    // hook on the source form's designer — can reverse-look-up and re-materialize this lane, and it
    // lazily re-syncs in place as a fallback when no push reached it before a submit. No Mirror
    // node
    // is placed on the SOURCE path anymore.
    // `pauseSync` is the source-side brake: such a node is a pure control marker and must neither
    // register a reflector nor write anything.
    if (props.autoSync && !props.pauseSync) {
      val regNote = registerAsReflector(params, props, userContext)
      if (regNote != null) {
        logger.info("[CodBi][Mirror] node='{}' reflector-registered: {}", props.name, regNote)
      }
      val syncNote = resyncIfChanged(params, props, userContext)
      if (syncNote != null) {
        logger.info("[CodBi][Mirror] node='{}' phase2-resync: {}", props.name, syncNote)
      }
    }

    val snapshot =
        WorkflowMirrorAccess.snapshot(userContext, props.sourceForm, pathId, props.sourceFormName)
    logger.debug(
        "[CodBi][Mirror] node='{}' snapshot resolved={} (form='{}' path='{}' trigger='{}' " +
            "nodeCount={} revision={})",
        props.name,
        snapshot != null,
        snapshot?.formName,
        snapshot?.pathName,
        snapshot?.let { "${it.triggerType}: ${it.triggerName}" },
        snapshot?.nodes?.size,
        snapshot?.revision)
    logger.debug(
        "[CodBi][Mirror] node='{}' NOTE: Mirror is READ-ONLY - it only reflects the structure of " +
            "the source workflow path and does NOT execute any of its node actions. " +
            "Delete/action deliveries therefore do not run.",
        props.name)

    if (snapshot == null) {
      logger.warn(
          "[CodBi][Mirror] node='{}' could not resolve path {} of form '{}'",
          props.name,
          pathId,
          props.sourceForm)
      params.softError(
          "PATH_NOT_FOUND",
          "The configured workflow path could not be resolved.",
          emptyMap<String, Any>())
      return params.normalResult().build()
    }

    val mode =
        runCatching { EMirrorOutputMode.valueOf(props.outputMode.orEmpty()) }
            .getOrDefault(EMirrorOutputMode.SUMMARY)
    val trigger =
        if (snapshot.triggerName.isBlank()) snapshot.triggerType
        else if (snapshot.triggerType.isBlank()) snapshot.triggerName
        else "${snapshot.triggerType}: ${snapshot.triggerName}"
    val nodes =
        when (mode) {
          EMirrorOutputMode.SUMMARY -> snapshot.nodeSummaries()
          EMirrorOutputMode.NODES ->
              snapshot.nodes.map { node ->
                if (node.description.isBlank()) node.summary
                else "${node.summary} — ${node.description}"
              }
        }
    val summary = buildString {
      append(snapshot.formName)
      append(" / ")
      append(snapshot.pathName)
      append(" (")
      append(snapshot.nodes.size)
      append(" nodes)")
    }

    logger.info(
        "[CodBi][Mirror] node='{}' resolved form='{}' path='{}' nodes={} trigger='{}' mode='{}'",
        props.name,
        snapshot.formName,
        snapshot.pathName,
        snapshot.nodes.size,
        trigger,
        mode)

    return params
        .normalResult()
        .success { builder ->
          builder
              .asRecord()
              .property("form", snapshot.formName)
              .property("path", snapshot.pathName)
              .property("trigger", trigger)
              .property("summary", summary)
              .property("value", summary)
              .property("nodes", nodes)
              .property("nodeCount", snapshot.nodes.size.toString())
              .property("revision", snapshot.revision.toString())
              .build()
        }
        .build()
  }

  // region Phase-2 lazy re-sync (Option B)

  /**
   * Compares the mirrored source path's content against the last stored materialized revision of
   * the reflecting lane and, when the source changed (or was never materialized), rewrites the
   * reflecting action lane IN PLACE via [WorkflowLaneMaterializer.rewriteInPlace] and records the
   * applied revision. Executes BEFORE the lane runs, so the rewritten params land same-trigger.
   *
   * @return a short human-readable outcome for the [CodBi][Mirror] log, or `null` when nothing
   *   needed to change (already in sync at the latest revision).
   */
  @Suppress("UNCHECKED_CAST")
  private fun resyncIfChanged(
      params: INodeExecutionParams<MirrorNodeProps>,
      props: MirrorNodeProps,
      userContext: Any?,
  ): String? {
    val pathId = props.pathId?.trim()?.toLongOrNull() ?: return null
    // Source-side brake: a pause marker on the SOURCE path stops every reflecting form at once.
    if (WorkflowMirrorAccess.isSourceSyncPaused(userContext, props.sourceForm, pathId)) {
      logger.info(
          "[CodBi][Mirror] phase2-resync: sync is PAUSED on the source path {}/{} — no rewrite",
          props.sourceForm,
          pathId)
      return "SKIPPED:source-paused"
    }
    val task = params.workflowContext.task() ?: return null
    val targetWorkflowVersion = workflowVersionOf(task)
    val targetVersionId = reflectId(targetWorkflowVersion)
    if (userContext == null) {
      logger.warn(
          "[CodBi][Mirror] phase2-resync: no userContext; cannot read source or rewrite lane")
      return "SKIPPED:no-userContext"
    }
    if (targetVersionId == null) {
      logger.warn(
          "[CodBi][Mirror] phase2-resync: cannot resolve reflecting workflow version from task")
      return "SKIPPED:no-target-version"
    }
    // Target-side brake: a pause marker on THIS (reflecting) path freezes it in both directions.
    val ownProjectKey = reflectProjectId(targetWorkflowVersion)?.let { "project-$it" }
    val ownTaskId = reflectId(task)
    if (ownProjectKey != null &&
        ownTaskId != null &&
        WorkflowMirrorAccess.isSourceSyncPaused(userContext, ownProjectKey, ownTaskId)) {
      logger.info(
          "[CodBi][Mirror] phase2-resync: sync of THIS path ({}/{}) is PAUSED — no rewrite",
          ownProjectKey,
          ownTaskId)
      return "SKIPPED:target-paused"
    }

    // Read the source path's full lane (this also yields the content revision we gate on).
    val source =
        WorkflowLaneMaterializer.loadSource(
            userContext, props.sourceForm, pathId, props.sourceFormName)
    if (source == null) {
      logger.warn(
          "[CodBi][Mirror] phase2-resync: source path {} of '{}' could not be resolved — no rewrite",
          pathId,
          props.sourceForm)
      return "SKIPPED:source-unresolved"
    }
    if (WorkflowLaneMaterializer.laneRootCount(source) == 0) {
      logger.info(
          "[CodBi][Mirror] phase2-resync: source path {} of '{}' has no mirrorable action nodes " +
              "(only Mirror nodes / empty) — nothing to do",
          pathId,
          props.sourceForm)
      return "SKIPPED:empty-source"
    }
    val sourceRevision = WorkflowLaneMaterializer.contentRevision(source)
    val stored =
        MirrorMaterializedStore.lastMaterializedRevision(
            targetVersionId, props.sourceForm.orEmpty(), pathId)

    val lane = locateReflectingLane(params)
    if (lane == null) {
      logger.warn(
          "[CodBi][Mirror] phase2-resync: could not locate the reflecting lane for node '{}'",
          props.name)
      return "SKIPPED:no-lane"
    }
    val laneLabel = lane.label
    val targetChildren = lane.children

    // Structural drift: the source action lane has more/fewer action nodes than the reflecting lane
    // (e.g. FC_RETURN_FILE is missing). In-place rewrite is index-lockstep and cannot add/remove
    // nodes, so recreate the whole reflected lane instead. Fresh nodes land on the NEXT trigger
    // (Phase-0 insertion No-Go), so a pending-rebuild marker is recorded to make that observable.
    //
    // This drift check runs on EVERY autoSync submit — deliberately BEFORE the source-revision gate
    // below. The stored revision reflects the LAST time the lane was successfully rewritten, not
    // whether the reflecting lane is structurally COMPLETE. If the source was edited (adding e.g.
    // FC_RETURN_FILE) and that earlier rewrite could only patch the aligned nodes in place, the
    // missing node persists even though stored == sourceRevision; we must still rebuild. Only the
    // in-place rewrite path (same-trigger) is gated by an actual source change.
    val driftReason =
        if (targetChildren.isEmpty()) {
          "reflecting lane is empty (source has ${WorkflowLaneMaterializer.laneRootCount(source)} action nodes)"
        } else {
          WorkflowLaneMaterializer.shouldRebuild(source, targetChildren)
        }
    if (driftReason != null) {
      // Convergence guard: a rebuild replaces the whole lane, so it must not run on every single
      // submit of the same source revision. The marker is TIMESTAMPED though: if the recreated lane
      // never became visible — e.g. the reflecting workflow designer saved its stale in-memory
      // model
      // over the freshly created nodes — the marker ages out and the next submit rebuilds again
      // instead of being stuck in "already rebuilding" forever.
      val pending =
          MirrorMaterializedStore.pendingRebuildEntry(
              targetVersionId, props.sourceForm.orEmpty(), pathId)
      if (pending != null &&
          pending.revision == sourceRevision &&
          pending.ageMillis() < REBUILD_PENDING_GRACE_MS) {
        logger.info(
            "[CodBi][Mirror] phase2-resync: rebuild already pending for revision {} ({} ms ago) — " +
                "waiting for the recreated lane to become visible; not rebuilding again (lane={}, " +
                "present children=[{}])",
            sourceRevision,
            pending.ageMillis(),
            laneLabel,
            laneChildrenLabel(targetChildren))
        return "REBUILT_PENDING:skip-again (revision $sourceRevision already rebuilding)"
      }
      val rebuild =
          WorkflowLaneMaterializer.RebuildRequest(
              source = source,
              laneParent = lane.laneParent,
              childrenToReplace = targetChildren,
              targetWorkflowVersion = targetWorkflowVersion,
              syncEndpoint = props.syncEndpoint)
      logger.info(
          "[CodBi][Mirror] phase2-resync: REBUILDING lane={} drift='{}' replacing children=[{}] " +
              "with {} source node(s)",
          laneLabel,
          driftReason,
          laneChildrenLabel(targetChildren),
          WorkflowLaneMaterializer.laneRootCount(source))
      val rebuildReport = WorkflowLaneMaterializer.rebuildLane(userContext, rebuild)
      // Do NOT storeMaterializedRevision here: the recreated nodes are not confirmed visible until
      // a
      // later submit confirms the lane is aligned. The pending marker is the convergence guard —
      // and
      // it is only stored when the rebuild actually created nodes, so a FAILED rebuild stays
      // retryable on the next submit.
      if (rebuildReport.createdNodes > 0) {
        MirrorMaterializedStore.storeRebuildPending(
            targetVersionId, props.sourceForm.orEmpty(), pathId, sourceRevision)
      } else {
        MirrorMaterializedStore.clearRebuildPending(
            targetVersionId, props.sourceForm.orEmpty(), pathId)
      }
      logger.info(
          "[CodBi][Mirror] phase2-resync: REBUILD lane={} drift='{}' created={} deleted={} " +
              "warnings={} targetVersion={}",
          laneLabel,
          driftReason,
          rebuildReport.createdNodes,
          rebuildReport.deletedNodes,
          rebuildReport.warnings.size,
          rebuildReport.targetWorkflowVersionId)
      rebuildReport.warnings.take(20).forEach { w ->
        logger.warn("[CodBi][Mirror] phase2-resync rebuild warning: {}", w)
      }
      if (rebuildReport.createdNodes == 0) {
        logger.warn(
            "[CodBi][Mirror] phase2-resync: rebuild created NO nodes (deleted={}, warnings={}) — " +
                "the next submit will retry",
            rebuildReport.deletedNodes,
            rebuildReport.warnings.size)
        return "REBUILD_FAILED:${rebuildReport.warnings.size} warnings (drift: $driftReason)"
      }
      return "REBUILT:${rebuildReport.createdNodes} nodes (drift: $driftReason)"
    }

    // Structurally aligned — the rebuild (if any) has converged. Clear any stale pending marker.
    MirrorMaterializedStore.clearRebuildPending(targetVersionId, props.sourceForm.orEmpty(), pathId)

    // Only rewrite in place when the SOURCE actually changed since the last materialization. This
    // is
    // the same-trigger GO path (in-place mutation lands same-trigger).
    if (stored != null && stored == sourceRevision) {
      logger.debug(
          "[CodBi][Mirror] phase2-resync: source unchanged (revision {}) for lane {} — no rewrite",
          sourceRevision,
          targetVersionId)
      return null
    }

    val rewrite =
        WorkflowLaneMaterializer.RewriteRequest(
            source = source,
            targetChildren = targetChildren,
            targetWorkflowVersion = targetWorkflowVersion,
            syncEndpoint = props.syncEndpoint)
    val (report, _) = WorkflowLaneMaterializer.rewriteInPlace(userContext, rewrite)
    if (report.rewrittenNodes > 0) {
      MirrorMaterializedStore.storeMaterializedRevision(
          targetVersionId, props.sourceForm.orEmpty(), pathId, sourceRevision)
    }
    logger.info(
        "[CodBi][Mirror] phase2-resync: lane={} sourceRevision={} rewrittenNodes={} " +
            "warnings={} targetVersion={}",
        laneLabel,
        sourceRevision,
        report.rewrittenNodes,
        report.warnings.size,
        report.targetWorkflowVersionId)
    report.warnings.take(20).forEach { w ->
      logger.warn("[CodBi][Mirror] phase2-resync warning: {}", w)
    }
    if (report.rewrittenNodes == 0) return "NOT_REWRITTEN:${report.warnings.size} warnings"
    return "REWRITTEN:${report.rewrittenNodes} nodes (revision $sourceRevision)"
  }

  /**
   * Result of [locateReflectingLane]: the **container** whose ordered `children` form the action
   * lane and that container's action-child list. [laneParent] is needed by the structural rebuild
   * so recreated nodes are re-parented to the correct container.
   */
  internal data class ReflectingLane(
      val label: String,
      val laneParent: Any,
      val children: List<Any>,
  )

  /**
   * Locates the **reflecting action lane** of [params.node]: the ordered top-level `WorkflowNode`
   * refs that mirror the source path's action nodes.
   *
   * Preference order:
   * 1. A sibling `SEQUENCE` of this node (its ordered children ARE the lane).
   * 2. The node's downstream siblings inside the same parent container.
   *
   * An **empty** lane is a valid result: when the Mirror node is the last (or only) node of its
   * container, the mirrored source nodes have to be CREATED there. Returning `null` for that case
   * (the previous behaviour) silently skipped both the lazy re-sync and the reflector registration,
   * which is why a freshly configured form — its path containing only the Mirror node — never
   * received any nodes from the source path.
   *
   * @return a [ReflectingLane] or `null` when the node has no parent (i.e. it IS the path's root
   *   node, so there is no container to create the mirrored nodes in).
   */
  internal fun locateReflectingLane(
      params: INodeExecutionParams<MirrorNodeProps>
  ): ReflectingLane? = locateLane(params.node)

  /**
   * Lane lookup for [node] — split out from [locateReflectingLane] so it can be unit-tested without
   * a workflow execution context (the node is only accessed by reflection).
   */
  internal fun locateLane(node: Any): ReflectingLane? {
    val nodeId = rLong(node, "getId")
    val parent = rInvoke(node, "getParent")
    if (parent == null) {
      logger.warn(
          "[CodBi][Mirror] lane detection: node '{}' (id={}) has NO parent — it is the path's ROOT " +
              "node, so the mirrored nodes cannot be created next to it. Place the Mirror node " +
              "INSIDE the path (as a child of its SEQUENCE) and re-save.",
          rStr(node, "getName"),
          nodeId)
      return null
    }
    val parentChildren =
        (rInvoke(parent, "getChildren") as? List<*>)?.filterIsInstance<Any>() ?: emptyList()

    // Preference 1: a sibling SEQUENCE (its children form the lane).
    val sequence =
        parentChildren.firstOrNull { child ->
          val id = rLong(child, "getId")
          id != nodeId && rStr(child, "getType") == "SEQUENCE"
        }
    if (sequence != null) {
      val seqChildren =
          (rInvoke(sequence, "getChildren") as? List<*>)?.filterIsInstance<Any>() ?: emptyList()
      val seqName = rStr(sequence, "getName") ?: "SEQUENCE"
      return ReflectingLane("SEQUENCE:$seqName (${seqChildren.size} nodes)", sequence, seqChildren)
    }

    // Preference 2: downstream siblings of this node inside the same parent. May be EMPTY — that is
    // the "nothing materialized yet" state which the rebuild fills with the source nodes.
    val selfIndex = parentChildren.indexOfFirst { rLong(it, "getId") == nodeId }
    val downstream = if (selfIndex >= 0) parentChildren.drop(selfIndex + 1) else emptyList()
    val parentName = rStr(parent, "getName") ?: "parent"
    return ReflectingLane("$parentName:${downstream.size} downstream siblings", parent, downstream)
  }

  /** Resolves the reflecting form's `WorkflowVersion` from the task: task -> process -> version. */
  private fun workflowVersionOf(task: Any?): Any? {
    if (task == null) return null
    return try {
      val process = task.javaClass.getMethod("getProcess").invoke(task) ?: return null
      process.javaClass.getMethod("getVersion").invoke(process)
    } catch (e: Exception) {
      logger.warn("[CodBi][Mirror] workflowVersionOf failed: {}", e.message)
      null
    }
  }

  /** Returns the project id of the workflow version [v] belongs to, or `null`. */
  private fun reflectProjectId(v: Any?): Long? =
      runCatching {
            val project = v?.javaClass?.getMethod("getProject")?.invoke(v)
            (project?.javaClass?.getMethod("getId")?.invoke(project) as? Number)?.toLong()
          }
          .getOrNull()

  /**
   * Option A1 — reflecting side. Persists this node's lane descriptor into the source registry
   * (`registerReflector`) so the source-side Mirror node knows which reflecting lane to push into.
   * No-op when the lane / task / version cannot be resolved.
   */
  private fun registerAsReflector(
      params: INodeExecutionParams<MirrorNodeProps>,
      props: MirrorNodeProps,
      userContext: Any?,
  ): String? {
    val pathId = props.pathId?.trim()?.toLongOrNull() ?: return null
    val task = params.workflowContext.task() ?: return null
    val ownVersion = workflowVersionOf(task)
    val targetVersionId = reflectId(ownVersion) ?: return "SKIPPED:no-target-version"
    val lane = locateReflectingLane(params) ?: return "SKIPPED:no-lane"
    val descriptor =
        MirrorMaterializedStore.ReflectorDescriptor(
            reflectingProjectId = reflectProjectId(ownVersion),
            sourceProjectId =
                MirrorFormAccess.resolveProjectId(
                    userContext, props.sourceForm, props.sourceFormName),
            targetWorkflowVersionId = targetVersionId,
            taskId = reflectId(task) ?: 0L,
            laneParentNodeId = reflectId(lane.laneParent) ?: 0L,
            childNodeIds = lane.children.mapNotNull { reflectId(it) },
            syncEndpoint = props.syncEndpoint)
    MirrorMaterializedStore.registerReflector(props.sourceForm.orEmpty(), pathId, descriptor)
    return "REGISTERED:version=$targetVersionId lane=${lane.label}"
  }

  private fun reflectId(entity: Any?): Long? =
      (runCatching { entity?.javaClass?.getMethod("getId")?.invoke(entity) }.getOrNull() as? Number)
          ?.toLong()

  /** `TYPE:name` list of the reflecting lane children — diagnostics for the re-sync logs. */
  private fun laneChildrenLabel(children: List<Any>): String =
      children.joinToString(", ") { child ->
        "${rStr(child, "getType") ?: "?"}:${rStr(child, "getName") ?: "?"}"
      }

  // endregion Phase-2 lazy re-sync

  // region TEMPORARY Phase-0 spike probe — DELETE after Go/No-Go

  /**
   * TEMPORARY Phase-0 spike. Injects a [SpikeProbeNodePlugin] child into the current task's
   * downstream lane (a sibling SEQUENCE of this Mirror node, or — as a fallback — directly under
   * this node's parent container) and logs `[SPIKE]` markers.
   *
   * If a `[SPIKE][SpikeProbe] EXECUTED` marker appears in the SAME submit's log *after* `[SPIKE]
   * AFTER`, then FORMCYCLE re-walks the live `children` collection and executes freshly-persisted
   * nodes in the current trigger — the decisive "Go" signal.
   *
   * The node is persisted through the same reflection pattern used by `AIWorkflowAssistant`
   * (`APIProvider.WORKFLOW_NODE_API.create` + a `fixParentOrderIndex` native SQL fix for the
   * Hibernate `@OrderColumn`), i.e. through an EntityContext that is separate from the workflow
   * executor's session, so the result also probes the cross-EntityContext visibility question.
   */
  @Suppress("UNCHECKED_CAST")
  private fun runSpikeProbe(params: INodeExecutionParams<MirrorNodeProps>) {
    val node: Any = params.node
    val task = params.workflowContext.task()
    val nodeId = rLong(node, "getId")
    val nodeName = rStr(node, "getName")
    val nodeType = rStr(node, "getType")
    val taskId = rLong(task, "getId")
    val taskName = rStr(task, "getName")
    logger.info(
        "[SPIKE] BEFORE nodeId={} nodeName='{}' nodeType='{}' taskId={} taskName='{}' — will " +
            "inject a SpikeProbe child into a downstream lane; watch for [SPIKE] AFTER below and " +
            "any [SPIKE][SpikeProbe] EXECUTED in THIS submit",
        nodeId,
        nodeName,
        nodeType,
        taskId,
        taskName)

    // Resolve the container that holds the downstream lane.
    val parent =
        rInvoke(node, "getParent")
            ?: run {
              logger.warn(
                  "[SPIKE] NO_PARENT node is a root-level node; cannot locate a downstream lane")
              return
            }
    val parentId = rLong(parent, "getId")
    val parentType = rStr(parent, "getType")
    val children: List<*> =
        rInvoke(parent, "getChildren") as? List<*>
            ?: run {
              logger.warn("[SPIKE] NO_CHILDREN parent id={} type='{}' ", parentId, parentType)
              return
            }
    logger.info(
        "[SPIKE] PARENT id={} type='{}' childCount={} (current mirror is childIndex={})",
        parentId,
        parentType,
        children.size,
        children.indexOfFirst { rLong(it, "getId") == nodeId })

    // Prefer a sibling SEQUENCE (the materialized action lane); fall back to the parent container.
    val lane: Any? =
        children
            .asSequence()
            .mapNotNull { it as? Any }
            .firstOrNull {
              val id = rLong(it, "getId")
              val type = rStr(it, "getType")
              id != nodeId && type == "SEQUENCE"
            }
            ?: run {
              logger.info(
                  "[SPIKE] No sibling SEQUENCE lane found; falling back to the parent container")
              parent
            }

    val laneId = rLong(lane, "getId")
    val laneType = rStr(lane, "getType")
    logger.info(
        "[SPIKE] TARGET_LANE id={} type='{}' — injecting SpikeProbe child", laneId, laneType)

    val probeName = "SPIKE-${UUID.randomUUID().toString().substring(0, 8)}"
    val userContext = MirrorFormAccess.systemContext()

    val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
    val workflowNodeApi = apiProviderClass.getField("WORKFLOW_NODE_API").get(null)
    val ucClass = Class.forName("de.xima.fc.user.UserContext")
    val transferableClass = Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity")
    val createNode = workflowNodeApi.javaClass.getMethod("create", ucClass, transferableClass)

    val workflowNodeClass = Class.forName("de.xima.fc.entities.WorkflowNode")
    val probe = workflowNodeClass.getDeclaredConstructor().newInstance()
    workflowNodeClass.getMethod("setName", String::class.java).invoke(probe, probeName)
    workflowNodeClass.getMethod("setType", String::class.java).invoke(probe, SPIKE_NODE_TYPE)
    workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(probe, true)
    workflowNodeClass.getMethod("setUUIDObject", UUID::class.java).invoke(probe, UUID.randomUUID())
    workflowNodeClass
        .getMethod("setTask", Class.forName("de.xima.fc.entities.WorkflowTask"))
        .invoke(probe, task)
    workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(probe, lane)

    val savedProbe = createNode.invoke(workflowNodeApi, userContext, probe)
    val savedProbeId = rLong(savedProbe, "getId")
    logger.info(
        "[SPIKE] AFTER injected SpikeProbe id={} name='{}' into lane id={} — if " +
            "'[SPIKE][SpikeProbe] EXECUTED name=SPIKE-$probeName' is logged in THIS submit then " +
            "FORMCYCLE re-executed a freshly-persisted node in the same trigger",
        savedProbeId,
        probeName,
        laneId)

    // Fix the Hibernate @OrderColumn (parent_order_idx) so the new child is appended at the end of
    // the lane (a NULL index column throws on the next load).
    fixSpikeParentOrderIndex(savedProbe, lane, userContext)
    logger.info("[SPIKE] DONE injected probe id={} parent={}", savedProbeId, laneId)
  }

  /**
   * TEMPORARY Phase-0 spike RUN 2. Instead of inserting a NEW child (which Run 1 proved is NOT
   * re-walked same-trigger), this mutates the EXISTING downstream node's params IN PLACE — the
   * realistic Option B rewrite path (same node reference, same child count, no reorder).
   *
   * It locates the immediate next sibling of this Mirror node inside the same parent container (the
   * `FC_CHANGE_STATE` child), reads its persisted `customParameters` JSON, injects a sentinel key,
   * and persists the change through `APIProvider.WORKFLOW_NODE_API.update` (an EntityContext
   * separate from the executor's session — probing cross-EntityContext visibility too).
   *
   * Decisive signal: if the node that executes immediately after this Mirror node honors the NEW
   * sentinel param value in THIS submit, then mutating an existing node's params lands same-trigger
   * → "Go" for Option B. If it keeps using the ON-START value, the executor cached the params at
   * walk time → conditional No-Go for the in-place rewrite path too.
   */
  @Suppress("UNCHECKED_CAST")
  private fun runSpikeProbe2(params: INodeExecutionParams<MirrorNodeProps>) {
    val node: Any = params.node
    val nodeId = rLong(node, "getId")
    val nodeName = rStr(node, "getName")
    val nodeType = rStr(node, "getType")

    val parent =
        rInvoke(node, "getParent")
            ?: run {
              logger.warn("[SPIKE]2 NO_PARENT node is a root-level node; cannot locate a sibling")
              return
            }
    val parentId = rLong(parent, "getId")
    val parentType = rStr(parent, "getType")
    val children: List<*> =
        rInvoke(parent, "getChildren") as? List<*>
            ?: run {
              logger.warn("[SPIKE]2 NO_CHILDREN parent id={} type='{}'", parentId, parentType)
              return
            }
    val selfIndex = children.indexOfFirst { rLong(it, "getId") == nodeId }
    logger.info(
        "[SPIKE]2 BEFORE nodeId={} nodeName='{}' nodeType='{}' parent id={} type='{}' childCount={} " +
            "selfIndex={} — locating next downstream sibling to mutate IN PLACE",
        nodeId,
        nodeName,
        nodeType,
        parentId,
        parentType,
        children.size,
        selfIndex)

    // Find the immediately-following sibling (the node that unfolds right after this Mirror node).
    val downstream =
        children
            .asSequence()
            .drop(selfIndex.coerceAtLeast(0) + 1)
            .mapNotNull { it as? Any }
            .firstOrNull()
            ?: run {
              logger.warn(
                  "[SPIKE]2 NO_DOWNSTREAM no sibling after index {}; nothing to mutate", selfIndex)
              return
            }
    val downstreamId = rLong(downstream, "getId")
    val downstreamName = rStr(downstream, "getName")
    val downstreamType = rStr(downstream, "getType")

    val beforeRaw = rStr(downstream, "getCustomParameters") ?: "{}"
    logger.info(
        "[SPIKE]2 TARGET downstream id={} name='{}' type='{}' current customParameters={}",
        downstreamId,
        downstreamName,
        downstreamType,
        beforeRaw.take(500))

    // Build the updated params JSON by carrying the existing map.
    @Suppress("UNCHECKED_CAST")
    val sentinelValue = "SPIKE2-${UUID.randomUUID().toString().substring(0, 8)}"
    val merged = mutableMapOf<String, Any?>()
    runCatching { Gson().fromJson(beforeRaw, Map::class.java) as? Map<*, *> }
        .getOrNull()
        ?.forEach { (k, v) -> if (k != null) merged[k.toString()] = v }

    // Add a non-functional sentinel (cross-check) AND flip the FUNCTIONAL targetState to a
    // different
    // real state. The state transition is the decisive, observable GO/NO-GO signal:
    //   - record lands in the alternative state   -> mutation consumed same-trigger -> GO
    //   - record still lands in 'Gesendet'         -> executor used on-start params  -> NO-GO
    merged["spike2Sentinel"] = sentinelValue
    val task = params.workflowContext.task()
    val flippedStateName: String? = flipTargetState(merged, task)

    val userContext = MirrorFormAccess.systemContext()

    val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
    val workflowNodeApi = apiProviderClass.getField("WORKFLOW_NODE_API").get(null)
    val ucClass = Class.forName("de.xima.fc.user.UserContext")
    val transferableClass = Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity")

    val workflowNodeClass = Class.forName("de.xima.fc.entities.WorkflowNode")
    workflowNodeClass
        .getMethod("setCustomParameters", String::class.java)
        .invoke(downstream, Gson().toJson(merged))

    val update = workflowNodeApi.javaClass.getMethod("update", ucClass, transferableClass)
    runCatching { update.invoke(workflowNodeApi, userContext, downstream) }
        .onFailure { e ->
          logger.warn("[SPIKE]2 UPDATE_FAILED {}: {}", e.message, e)
          return
        }

    logger.info(
        "[SPIKE]2 DONE mutated downstream id={} -> spike2Sentinel='{}' persisted in-place " +
            "(same node ref, no reorder). targetState flipped to state='{}'. If FC_CHANGE_STATE in " +
            "THIS submit transitions the record to '{}' (NOT 'Gesendet') => in-place param mutation " +
            "lands same-trigger => GO for Option B. If it still goes to 'Gesendet' => executor used " +
            "on-start params => NO-GO for the in-place rewrite path",
        downstreamId,
        sentinelValue,
        flippedStateName,
        flippedStateName)
  }

  /**
   * TEMPORARY RUN-2 helper. Flips the `targetState.uuid` inside [merged] (the node's params map) to
   * a DIFFERENT real `WorkflowState` of the same workflow, so `FC_CHANGE_STATE` produces an
   * observable, distinct transition. Returns the target state's name, or `null` if no alternative
   * state could be resolved (in which case the params are left functionally unchanged).
   */
  private fun flipTargetState(merged: MutableMap<String, Any?>, task: Any): String? {
    val targetState = merged["targetState"] as? Map<*, *> ?: return null
    val currentUuid =
        (targetState["uuid"] as? String)?.let { runCatching { UUID.fromString(it) }.getOrNull() }
            ?: (targetState["uuid"] as? UUID)
    val userContext = MirrorFormAccess.systemContext()
    val states = loadProbeWorkflowStates(task) ?: emptyList()
    if (states.isEmpty()) {
      logger.warn("[SPIKE]2 FLIP_NO_STATES cannot resolve alternative target state")
      return null
    }
    val getUuid = runCatching { states[0].javaClass.getMethod("getUUIDObject") }.getOrNull()
    val getName = runCatching { states[0].javaClass.getMethod("getName") }.getOrNull()
    if (getUuid == null || getName == null) return null
    val alternative =
        states.firstOrNull { s ->
          val u = runCatching { getUuid.invoke(s) as? UUID }.getOrNull()
          u != null && u != currentUuid
        }
            ?: run {
              logger.warn(
                  "[SPIKE]2 FLIP_NO_ALTERNATIVE only one state present; cannot flip targetState")
              return null
            }
    val newUuid = runCatching { getUuid.invoke(alternative) as? UUID }.getOrNull() ?: return null
    val newName = runCatching { getName.invoke(alternative) as? String }.getOrNull()
    val newTarget = LinkedHashMap<String, Any?>()
    targetState.forEach { (k, v) -> newTarget[k.toString()] = v }
    newTarget["uuid"] = newUuid.toString()
    newTarget["entityClass"] = "de.xima.fc.entities.WorkflowState"
    merged["targetState"] = newTarget
    logger.info(
        "[SPIKE]2 FLIP targetState {} -> state='{}' uuid={}",
        currentUuid?.toString()?.take(8),
        newName,
        newUuid)
    return newName
  }

  /**
   * TEMPORARY RUN-2 helper. Loads all `WorkflowState`s of the current workflow version via the API.
   */
  private fun loadProbeWorkflowStates(task: Any): List<Any>? {
    return try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val stateApi = apiProviderClass.getField("WORKFLOW_STATE_API").get(null)
      val userContextClass = Class.forName("de.xima.fc.user.UserContext")
      val workflowVersionClass = Class.forName("de.xima.fc.entities.WorkflowVersion")
      @Suppress("UNCHECKED_CAST")
      stateApi.javaClass
          .getMethod("getAllByWorkflowVersion", userContextClass, workflowVersionClass)
          .invoke(stateApi, MirrorFormAccess.systemContext(), probeWorkflowVersion(task))
          as? List<Any> ?: emptyList()
    } catch (e: Exception) {
      logger.warn("[SPIKE]2 loadProbeWorkflowStates failed: {}", e.message)
      null
    }
  }

  /**
   * TEMPORARY RUN-2 helper. Resolves the current workflow's `WorkflowVersion` from the task.
   *
   * `WorkflowTask` has no direct `getWorkflowVersion()`; it exposes the version through its
   * process: `WorkflowTask.getProcess().getVersion()`. Reflecting that chain reliably returns the
   * entity.
   */
  private fun probeWorkflowVersion(task: Any): Any? {
    return try {
      val process =
          task.javaClass.getMethod("getProcess").invoke(task)
              ?: run {
                logger.warn("[SPIKE]2 probeWorkflowVersion: task.getProcess() is null")
                return null
              }
      val version =
          process.javaClass.getMethod("getVersion").invoke(process)
              ?: run {
                logger.warn("[SPIKE]2 probeWorkflowVersion: process.getVersion() is null")
                return null
              }
      logger.debug("[SPIKE]2 probeWorkflowVersion resolved via task->process->version: {}", version)
      version
    } catch (e: Exception) {
      logger.warn(
          "[SPIKE]2 probeWorkflowVersion failed (task->getProcess->getVersion): {}", e.message)
      null
    }
  }

  /**
   * Native-SQL fix for Hibernate's `@OrderColumn` (`parent_order_idx`), mirroring
   * AIWorkflowAssistant.
   */
  private fun fixSpikeParentOrderIndex(actionNode: Any?, parentNode: Any?, userContext: Any?) {
    if (actionNode == null || parentNode == null || userContext == null) {
      logger.warn("[SPIKE] fixSpikeParentOrderIndex skipped (null arg)")
      return
    }
    val nodeId = rLong(actionNode, "getId") ?: return
    val parentId = rLong(parentNode, "getId") ?: return
    try {
      val entityContextFactoryClass = Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val entityContext =
          entityContextFactoryClass.getMethod("newEntityContext", ucClass).invoke(null, userContext)
      val em = entityContext.javaClass.getMethod("getEm").invoke(entityContext)
      val tx = em.javaClass.getMethod("getTransaction").invoke(em)
      tx.javaClass.getMethod("begin").invoke(tx)
      try {
        val selectSql =
            "SELECT COALESCE(MAX(parent_order_idx), -1) + 1 FROM workflow_node WHERE parent_id = $parentId"
        val selectQ =
            em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, selectSql)
        val nextIdx =
            (selectQ.javaClass.getMethod("getSingleResult").invoke(selectQ) as? Number)?.toInt()
                ?: 0
        val updateSql = "UPDATE workflow_node SET parent_order_idx = $nextIdx WHERE id = $nodeId"
        val updateQ =
            em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, updateSql)
        updateQ.javaClass.getMethod("executeUpdate").invoke(updateQ)
        tx.javaClass.getMethod("commit").invoke(tx)
        logger.info("[SPIKE] Set parent_order_idx = {} for probe node id={}", nextIdx, nodeId)
      } catch (e: Exception) {
        runCatching { tx.javaClass.getMethod("rollback").invoke(tx) }
        logger.warn("[SPIKE] Failed to fix parent_order_idx for probe node {}", nodeId, e)
      } finally {
        runCatching { entityContext.javaClass.getMethod("close").invoke(entityContext) }
      }
    } catch (e: Exception) {
      logger.warn("[SPIKE] fixSpikeParentOrderIndex failed: {}", e.message)
    }
  }

  private fun rInvoke(target: Any?, method: String): Any? =
      if (target == null) null
      else
          runCatching { target.javaClass.getMethod(method).invoke(target) }
              .onFailure { e ->
                logger.warn(
                    "[SPIKE] reflect {}.{}(): {}", target.javaClass.simpleName, method, e.message)
              }
              .getOrNull()

  private fun rStr(target: Any?, method: String): String? = rInvoke(target, method) as? String

  private fun rLong(target: Any?, method: String): Long? = rInvoke(target, method) as? Long

  // endregion TEMPORARY Phase-0 spike probe

  fun buildPrototypeIcon(contextPath: String): IGuiIcon {
    val iconUrl = pluginResourceUrl(ICON_PATH, contextPath)
    return CustomGuiIcon.builder()
        .styleClass(PROTOTYPE_ICON_STYLE_CLASS)
        .style(
            "color:transparent !important;" +
                "background-image:url('$iconUrl') !important;" +
                "background-repeat:no-repeat !important;" +
                "background-position:center !important;" +
                "background-size:1.4em 1.4em !important;" +
                "display:inline-block !important;" +
                "width:1.5em !important;height:1.5em !important;" +
                "vertical-align:middle !important;" +
                "filter:drop-shadow(0 0 .18em rgba(37,99,235,.55)) !important;")
        .build()
  }

  private fun pluginResourceUrl(path: String, contextPath: String): String {
    val encodedPath = URLEncoder.encode(path, StandardCharsets.UTF_8.name()).replace("+", "%20")
    return "$contextPath/plugin?name=Resource&Path=$encodedPath"
  }

  private companion object {
    /** Registered node type (= persisted `WorkflowNode.ITEM_TYPE`). */
    const val NODE_TYPE = "Mirror"

    /** Same icon as the form Mirror widget. */
    const val ICON_PATH =
        "/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/mirror-icon.svg"

    /** CSS class of the node icon (a FontAwesome fallback is shown when the SVG cannot load). */
    const val PROTOTYPE_ICON_STYLE_CLASS = "fa fa-clone"

    /** TEMPORARY: node type of the Phase-0 spike probe (must match [SpikeProbeNodePlugin]). */
    const val SPIKE_NODE_TYPE = "SpikeProbe"

    /**
     * How long a recorded structural rebuild is trusted to still be "converging". After that the
     * recreated lane must be visible; if it is not (e.g. a designer save overwrote it), the next
     * submit rebuilds again instead of skipping forever.
     */
    const val REBUILD_PENDING_GRACE_MS = 60_000L

    val logger = LoggerFactory.getLogger(MirrorNodePlugin::class.java)

    /** Context path of the current Faces request, or `""` when no FacesContext is active. */
    fun currentContextPath(): String =
        runCatching {
              val facesContextClass = Class.forName("javax.faces.context.FacesContext")
              val current =
                  facesContextClass.getMethod("getCurrentInstance").invoke(null)
                      ?: return@runCatching ""
              val externalContextClass = Class.forName("javax.faces.context.ExternalContext")
              val externalContext =
                  facesContextClass.getMethod("getExternalContext").invoke(current)
                      ?: return@runCatching ""
              externalContextClass.getMethod("getRequestContextPath").invoke(externalContext)
                  as? String ?: ""
            }
            .getOrDefault("")
  }
}
