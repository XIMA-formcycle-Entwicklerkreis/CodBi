package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.MirrorFormAccess
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.MirrorMaterializedStore
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.WorkflowLaneMaterializer
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.WorkflowMirrorAccess
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.workflow.EMirrorOutputMode
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants
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
    logger.debug(
        "[CodBi][Mirror] execute node='{}' sourceForm='{}' pathId='{}' mode='{}'",
        props.name,
        props.sourceForm,
        props.pathId,
        props.outputMode)

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
        logger.debug("[CodBi][Mirror] node='{}' reflector-registered: {}", props.name, regNote)
      }
      val syncNote = resyncIfChanged(params, props, userContext)
      if (syncNote != null) {
        logger.debug("[CodBi][Mirror] node='{}' phase2-resync: {}", props.name, syncNote)
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

    logger.debug(
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
      logger.debug(
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
      logger.debug(
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
      logger.debug(
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
        logger.debug(
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
      logger.debug(
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
      logger.debug(
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
    logger.debug(
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

  // region Reflection helpers

  /** Invokes a zero-argument getter by name; null when it is absent or throws. */
  private fun rInvoke(target: Any?, method: String): Any? =
      if (target == null) null
      else
          runCatching { target.javaClass.getMethod(method).invoke(target) }
              .onFailure { e ->
                logger.debug(
                    "[CodBi][Mirror] reflect {}.{}(): {}",
                    target.javaClass.simpleName,
                    method,
                    e.message)
              }
              .getOrNull()

  private fun rStr(target: Any?, method: String): String? = rInvoke(target, method) as? String

  private fun rLong(target: Any?, method: String): Long? = rInvoke(target, method) as? Long

  // endregion Reflection helpers

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
