package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror

import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonPrimitive
import java.util.UUID
import org.slf4j.LoggerFactory

/**
 * Phase-1 component: materializes a mirrored workflow path's ACTION LANE into the **reflecting**
 * form's own active `WorkflowVersion` by **rewriting the existing lane nodes IN PLACE**.
 *
 * ## Why in-place (carried from the Phase-0 Go/No-Go)
 *
 * Phase-0 Run 2 proved that mutating an **already-existing** downstream node's `customParameters`
 * is honored by the executor **in the same trigger** (the record transitioned to the newly-set
 * state). Phase-0 Run 1 proved the opposite for *inserting* a NEW node: it is NOT re-walked
 * same-trigger. The Materializer therefore never creates or deletes nodes — it walks the source
 * path and the reflecting lane **in lockstep** (sibling index within parent) and rewrites each
 * matching reflecting node's params (and name/type if the source changed) on the **same node
 * reference**, then persists via `WORKFLOW_NODE_API.update`.
 *
 * ## Component boundary (Phase 1)
 *
 * This object does NOT decide *when* to re-materialize (that is Phase 2's revision check in
 * `MirrorNodePlugin.execute`) and does NOT locate the reflecting lane (Phase 2 passes the target
 * `WorkflowNode` refs in as [RewriteRequest.targetChildren]). Phase 1 responsibilities:
 * 1. Read the source path's node TREE (with `customParameters` and sibling order) via
 *    [WorkflowMirrorAccess.sourceLane].
 * 2. Remap each source node's `customParameters` from source-project-scoped references to
 *    target-project-scoped ones (workflow-state UUIDs by NAME; other scoped references pass through
 *    with a warning).
 * 3. Rewrite the matching target node in place (`setCustomParameters`/`setName`/`setType` +
 *    `WORKFLOW_NODE_API.update`), without reordering or re-parenting.
 * 4. Mark the reflecting `WorkflowVersion` `workflowInvalid` so the workflow model reloads.
 *
 * All FORMCYCLE API/entity access uses reflection (fc-common is provided-scope) exactly like
 * [WorkflowMirrorAccess] and the Phase-0 probe in `MirrorNodePlugin`.
 *
 * @since 1.1.0
 */
object WorkflowLaneMaterializer {

  private val logger = LoggerFactory.getLogger(WorkflowLaneMaterializer::class.java)

  /** One node of the SOURCE path, with its `customParameters` and its ordered children. */
  data class SourceNode(
      val id: Long,
      /** The node's `WorkflowNode.uuid` (used to remap intra-workflow NODE UUID references). */
      val uuid: String?,
      val type: String,
      val name: String,
      val description: String,
      val paramsJson: String,
      val children: List<SourceNode>,
  )

  /**
   * The source path's node TREE (parents before children, exact `@OrderColumn` sibling order).
   *
   * @param sourceStatesByUuid the source workflow version's states as `uuid -> name`, used to
   *   resolve the NAME of a state reference carried in `customParameters` so it can be remapped
   *   into the reflecting project by name.
   */
  data class SourceLane(
      val pathId: Long,
      val pathName: String,
      val triggerType: String,
      val roots: List<SourceNode>,
      /** Cheap content hash (set by [WorkflowMirrorAccess.sourceLane]). */
      val revision: Int = 0,
      /** Source workflow version's states as `uuid -> name` (for param remap). */
      val sourceStatesByUuid: Map<String, String> = emptyMap(),
  )

  /**
   * What to rewrite; also used to pass the target lane's node refs down so nested structural
   * branches are matched without the component having to locate the lane (Phase 2 decides the lane,
   * Phase 1 only rewrites the refs it is given).
   */
  data class RewriteRequest(
      val source: SourceLane,
      /** The reflecting lane's top-level `WorkflowNode` refs, in execution order. */
      val targetChildren: List<Any>,
      /** The reflecting form's active `WorkflowVersion` entity. */
      val targetWorkflowVersion: Any?,
      /**
       * When `false`, the reflecting lane's own ENDPOINT node (the last terminal node, e.g.
       * `FC_CHANGE_STATE`) is kept as-is and the source's terminal node is not applied to it.
       */
      val syncEndpoint: Boolean = true,
  )

  /** Result of a rewrite pass. */
  data class RewriteReport(
      val rewrittenNodes: Int,
      val warnings: List<String> = emptyList(),
      val targetWorkflowVersionId: Long? = null,
  )

  /**
   * What to fully reject and RECREATE (structural-drift fallback). Unlike [RewriteRequest] (which
   * overwrites existing aligned nodes in place), this describes a **whole-lane replacement**: the
   * lane container whose children hold the action lane, and the exact children to remove/rebuild.
   *
   * @param laneParent the `WorkflowNode` whose `children` collection forms the lane (a sibling
   *   `SEQUENCE` of the Mirror node, or the Mirror node's own parent when the Mirror is the lane's
   *   first child). New nodes are re-parented to this container.
   * @param childrenToReplace the reflecting action nodes to delete and recreate from [source].
   */
  data class RebuildRequest(
      val source: SourceLane,
      val laneParent: Any,
      val childrenToReplace: List<Any>,
      val targetWorkflowVersion: Any?,
      /**
       * When `false`, the reflecting lane's existing ENDPOINT node is preserved (not deleted, not
       * recreated from the source) and moved back to the end of the lane after the rebuild.
       */
      val syncEndpoint: Boolean = true,
  )

  /** Result of a structural lane rebuild. */
  data class RebuildReport(
      val createdNodes: Int,
      val deletedNodes: Int,
      val warnings: List<String> = emptyList(),
      val targetWorkflowVersionId: Long? = null,
  )

  private val gson = Gson()

  // region Public API

  /**
   * Reads the source path's node tree (with `customParameters` and sibling order). Returns `null`
   * when the form / version / path cannot be resolved.
   */
  fun loadSource(
      userContext: Any?,
      formKey: String?,
      pathId: Long?,
      formName: String? = null,
  ): SourceLane? =
      WorkflowMirrorAccess.sourceLane(userContext, formKey, pathId, formName).also { lane ->
        if (lane == null) {
          logger.warn(
              "[WorkflowLaneMaterializer] loadSource: unresolved for '{}'/{}", formKey, pathId)
        }
      }

  /**
   * Content-based revision of [source]'s node tree (depth-first: type, name, params of every node).
   *
   * Unlike [SourceLane.revision] (which only signs the version/path identity), this reflects actual
   * node content — so a param-only edit within the SAME source version still changes the revision
   * and triggers a re-materialization. Phase 2 stores this value as the "materialized revision".
   */
  fun contentRevision(source: SourceLane): Int =
      buildString {
            fun walk(nodes: List<SourceNode>) {
              for (n in nodes) {
                append(n.type).append('\u0001')
                append(n.name).append('\u0001')
                append(n.paramsJson).append('\u0002')
                walk(n.children)
              }
            }
            walk(laneRoots(source))
            // Status RENAMES are invisible in the node params: an endpoint only carries the state
            // UUID,
            // so renaming the referenced status changes neither the node name nor its params.
            // Without the
            // name map a rename alone would never trigger a re-materialization — the reflected
            // endpoint
            // would keep the old status. Fold the (sorted) uuid -> name map into the signature so
            // ANY
            // status rename (or a newly created status) re-materializes the lane.
            source.sourceStatesByUuid.toSortedMap().forEach { (uuid, name) ->
              append(uuid).append('\u0003').append(name).append('\u0004')
            }
          }
          .hashCode()

  /**
   * The **action lane** roots of [source]. FORMCYCLE typically wraps a path's action nodes in a
   * single top-level `SEQUENCE`; the reflecting lane (a `SEQUENCE` holding the Mirror node + its
   * sibling actions) exposes the actions as *members*. To keep both sides index-aligned, when
   * [source] has exactly one `SEQUENCE` root we treat that root's **children** as the lane roots.
   * Otherwise (roots already are the individual actions) we use them as-is.
   */
  private fun laneRoots(source: SourceLane): List<SourceNode> {
    val roots =
        if (source.roots.size == 1 && source.roots[0].type == "SEQUENCE") {
          source.roots[0].children
        } else {
          source.roots
        }
    return stripMirrorNodes(roots)
  }

  /**
   * Drops `Mirror` nodes from a source lane.
   *
   * They are infrastructure — a Mirror node materializes *its own* source path — and must never be
   * copied into another path. Without this, a chained reflection (A → B → C) would copy B's mirror
   * plumbing (and its foreign `sourceForm`/`pathId`) into C, and each hop would stack another
   * Mirror node into the next path.
   */
  private fun stripMirrorNodes(nodes: List<SourceNode>): List<SourceNode> =
      nodes
          .filterNot { it.type.trim() == "Mirror" }
          .map { node ->
            if (node.children.isEmpty()) node
            else node.copy(children = stripMirrorNodes(node.children))
          }

  /**
   * Rewrites [rewrite.source]'s nodes into [rewrite.targetChildren] in place.
   *
   * Both trees are walked in lockstep by sibling index. For each source node the matching target
   * node's `customParameters` (and `name`/`type` when they differ) are updated and persisted via
   * `WORKFLOW_NODE_API.update` on the SAME node reference. Structural insert/delete is deliberately
   * avoided (Phase-0: only in-place mutation lands same-trigger).
   *
   * @return a [RewriteReport] and, for callers that recurse, the rewritten target node refs in the
   *   same order as [SourceLane.roots].
   */
  fun rewriteInPlace(
      userContext: Any?,
      rewrite: RewriteRequest,
  ): Pair<RewriteReport, List<Any>> {
    val targetChildren = rewrite.targetChildren
    if (userContext == null || rewrite.targetWorkflowVersion == null) {
      return RewriteReport(
          0, listOf("Materializer skipped: userContext or targetWorkflowVersion is null")) to
          targetChildren
    }
    val warnings = ArrayList<String>()
    var rewritten = 0
    val sourceRoots = laneRoots(rewrite.source)

    // Build the source-node-UUID -> target-node-UUID map for the lane (aligned by sibling index,
    // recursing into children). `FC_RETURN_FILE` and friends reference preceding file-producing
    // nodes BY UUID in their params; translating those from the source project to the reflecting
    // workflow is what keeps the reflected lane executable (Vorgang#907).
    val nodeUuidMap = HashMap<String, String>()
    collectNodeUuidMap(sourceRoots, targetChildren, nodeUuidMap)

    // With `syncEndpoint = false` the reflecting lane keeps its OWN endpoint: the source's terminal
    // node is not rewritten into it (the index alignment of the remaining nodes is unaffected).
    // When
    // the reflecting lane has NO endpoint yet, the source's one IS applied — otherwise the lane
    // would
    // stay one node short against the source forever.
    val keepTargetEndpoint =
        !rewrite.syncEndpoint &&
            terminalEndpointOf(targetChildren) != null &&
            isTerminalEndpointType(sourceRoots.lastOrNull()?.type)
    val sourceSyncRoots = if (keepTargetEndpoint) sourceRoots.dropLast(1) else sourceRoots

    var idx = 0
    while (idx < sourceSyncRoots.size) {
      val srcRoot = sourceSyncRoots[idx]
      val target = targetChildren.getOrNull(idx)
      if (target == null) {
        warnings.add(
            "No reflecting sibling at index $idx for source node '${srcRoot.name}' " +
                "(${srcRoot.type}); skipped (structural change — must be handled by " +
                "recreation, not in-place rewrite)")
        idx++
        continue
      }
      rewritten +=
          rewriteNodeTree(
              userContext,
              rewrite.targetWorkflowVersion,
              rewrite.source,
              srcRoot,
              target,
              nodeUuidMap,
              warnings)
      idx++
    }
    val expectedTargetSize =
        sourceSyncRoots.size + if (sourceSyncRoots.size < sourceRoots.size) 1 else 0
    if (targetChildren.size > expectedTargetSize) {
      warnings.add(
          "Reflecting lane has ${targetChildren.size} nodes but source has ${sourceRoots.size}; " +
              "trailing reflecting nodes left as-is (would require removal, not in-place rewrite)")
    }
    val versionId = reflectId(rewrite.targetWorkflowVersion)
    if (versionId != null && rewritten > 0) {
      // Tickle + restore: the version must not end up invalid, otherwise the form is served OFFLINE
      // until someone saves the workflow in the designer.
      refreshWorkflowModel(userContext, versionId)
    }
    logger.info(
        "[WorkflowLaneMaterializer] rewriteInPlace: rewrittenNodes={} warnings={}",
        rewritten,
        warnings.size)
    return RewriteReport(rewritten, warnings, versionId) to targetChildren
  }

  /**
   * Cache-invalidation tickle for workflow changes this plugin performs **without a designer**.
   *
   * `workflow_version.flag_wf_invalid` tells FORMCYCLE that its workflow analysis is stale — but a
   * version that STAYS invalid is served to the frontend as **offline**; only a designer save (or a
   * form publish) clears the flag again. That is exactly the "form goes offline until I open the
   * designer and save the workflow" symptom.
   *
   * Because the lane written here is complete (trigger + root + nodes + endpoint), the flag is
   * restored to its **previous** value right after the tickle:
   * - a workflow that was already invalid (for a real reason) stays invalid — the user must fix it,
   * - a healthy workflow stays online, and FORMCYCLE still drops any cached analysis it kept.
   */
  fun refreshWorkflowModel(userContext: Any?, workflowVersionId: Long) {
    if (userContext == null) return
    val wasInvalid = readWorkflowInvalid(userContext, workflowVersionId)
    setWorkflowInvalid(userContext, workflowVersionId, true)
    setWorkflowInvalid(userContext, workflowVersionId, wasInvalid ?: false)
    logger.info(
        "[WorkflowLaneMaterializer] Refreshed the workflow model of WorkflowVersion {} " +
            "(flag_wf_invalid restored to {})",
        workflowVersionId,
        wasInvalid ?: false)
  }

  /**
   * Sets `workflow_version.flag_wf_invalid` via a native update so FORMCYCLE re-analyzes the
   * workflow model after an in-place rewrite / rebuild. Runs in its own entity context/transaction
   * so it cannot be rolled back by the caller (the same pattern used by
   * `AICodBiAssistant.forceWorkflowVersionInvalid`).
   *
   * Note: leaving the flag set makes the frontend serve the form as **offline** — use
   * [refreshWorkflowModel] unless the caller really wants the flag to stay (e.g. to force an open
   * designer to reload).
   */
  fun markWorkflowInvalid(userContext: Any?, workflowVersionId: Long) {
    setWorkflowInvalid(userContext, workflowVersionId, true)
  }

  /** Reads `workflow_version.flag_wf_invalid`; `null` when it cannot be determined. */
  private fun readWorkflowInvalid(userContext: Any?, workflowVersionId: Long): Boolean? {
    if (userContext == null) return null
    return try {
      val entityContextFactoryClass = Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val entityContext =
          entityContextFactoryClass.getMethod("newEntityContext", ucClass).invoke(null, userContext)
      try {
        val em = entityContext.javaClass.getMethod("getEm").invoke(entityContext)
        val sql = "SELECT flag_wf_invalid FROM workflow_version WHERE id = $workflowVersionId"
        val query = em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, sql)
        when (val raw = query.javaClass.getMethod("getSingleResult").invoke(query)) {
          null -> false
          is Boolean -> raw
          is Number -> raw.toInt() != 0
          is Char -> raw == '1' || raw == 't' || raw == 'T' || raw == 'y' || raw == 'Y'
          is String ->
              raw.equals("true", true) ||
                  raw == "1" ||
                  raw.equals("t", true) ||
                  raw.equals("y", true)
          else -> null
        }
      } finally {
        runCatching { entityContext.javaClass.getMethod("close").invoke(entityContext) }
      }
    } catch (e: Exception) {
      logger.warn(
          "[WorkflowLaneMaterializer] Could not read flag_wf_invalid of WorkflowVersion {}: {}",
          workflowVersionId,
          e.message)
      null
    }
  }

  /** Writes `workflow_version.flag_wf_invalid` in its own entity context/transaction. */
  private fun setWorkflowInvalid(userContext: Any?, workflowVersionId: Long, invalid: Boolean) {
    if (userContext == null) return
    try {
      val entityContextFactoryClass = Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val entityContext =
          entityContextFactoryClass.getMethod("newEntityContext", ucClass).invoke(null, userContext)
      val em = entityContext.javaClass.getMethod("getEm").invoke(entityContext)
      val tx = em.javaClass.getMethod("getTransaction").invoke(em)
      tx.javaClass.getMethod("begin").invoke(tx)
      try {
        val sql = "UPDATE workflow_version SET flag_wf_invalid = ?1 WHERE id = ?2"
        val query = em.javaClass.getMethod("createNativeQuery", String::class.java).invoke(em, sql)
        val setParameter =
            query.javaClass.getMethod("setParameter", Int::class.javaPrimitiveType, Any::class.java)
        setParameter.invoke(query, 1, invalid)
        setParameter.invoke(query, 2, workflowVersionId)
        query.javaClass.getMethod("executeUpdate").invoke(query)
        tx.javaClass.getMethod("commit").invoke(tx)
        logger.debug(
            "[WorkflowLaneMaterializer] Set flag_wf_invalid={} on WorkflowVersion {}",
            invalid,
            workflowVersionId)
      } catch (e: Exception) {
        runCatching { tx.javaClass.getMethod("rollback").invoke(tx) }
        throw e
      } finally {
        runCatching { entityContext.javaClass.getMethod("close").invoke(entityContext) }
      }
    } catch (e: Exception) {
      logger.warn(
          "[WorkflowLaneMaterializer] Could not write flag_wf_invalid={} on WorkflowVersion {}: {}",
          invalid,
          workflowVersionId,
          e.message)
    }
  }

  /**
   * Detects **structural drift** between the source action lane and the reflecting lane's children.
   *
   * The in-place rewrite is index-lockstep: it can only re-param/re-type an *already-existing,
   * position-aligned* sibling. Adding or removing a source node (e.g. the surplus `FC_RETURN_FILE`
   * in Vorgang#910) therefore cannot be mirrored in place. When the counts do not match (or the
   * lane is empty), a whole-lane recreation is required.
   *
   * @return a human-readable drift reason, or `null` when the lane is structurally aligned and the
   *   in-place rewrite is safe.
   */
  fun shouldRebuild(source: SourceLane, targetChildren: List<Any>): String? {
    val srcRoots = laneRoots(source)
    if (targetChildren.isEmpty()) {
      return "reflecting lane is empty (source has ${srcRoots.size} action nodes)"
    }
    if (srcRoots.size != targetChildren.size) {
      return "source has ${srcRoots.size} action nodes but reflecting lane has ${targetChildren.size} " +
          "(nodes like FC_RETURN_FILE are missing — recreation required)"
    }
    return null
  }

  /** The number of top-level ACTION nodes the source lane exposes (after SEQUENCE unwrapping). */
  fun laneRootCount(source: SourceLane): Int = laneRoots(source).size

  /**
   * FORMCYCLE node types that the workflow designer renders as a lane **endpoint** (terminal node).
   * FORMCYCLE allows exactly one per lane and it must be the last node.
   */
  private val TERMINAL_ENDPOINT_TYPES =
      setOf("FC_CHANGE_STATE", "FC_RETURN", "FC_DELETE_FORM_RECORD", "FC_QUEUE_TASK")

  /** Whether [type] is a terminal lane endpoint node type. */
  fun isTerminalEndpointType(type: String?): Boolean = type?.trim() in TERMINAL_ENDPOINT_TYPES

  /** The lane's endpoint — its last child when that is a terminal node, else `null`. */
  fun terminalEndpointOf(children: List<Any>): Any? =
      children.lastOrNull()?.takeIf { isTerminalEndpointType(reflect(it, "getType") as? String) }

  /**
   * Structural-drift fallback: **deletes and recreates the whole reflecting action lane** from the
   * source, so every source node (including `FC_RETURN_FILE`) always exists in the reflecting
   * workflow.
   *
   * This is all-or-nothing (Phase-0: only in-place mutation lands same-trigger; inserted nodes land
   * on the next trigger), so [MirrorNodePlugin] persists a "rebuild pending" marker and returns
   * `REBUILT:pending`. Steps:
   * 1. Recursively delete each of [RebuildRequest.childrenToReplace].
   * 2. Pre-assign a fresh target UUID to EVERY source node (so intra-workflow NODE UUID references
   *    such as `FC_RETURN_FILE.actionUUIDs` resolve before any node is created).
   * 3. Recreate the source tree as new `WorkflowNode`s under [RebuildRequest.laneParent] with the
   *    remapped `customParameters`, wired `parentOrderIndex`, and `WORKFLOW_NODE_API.create`.
   * 4. Mark the reflecting version `workflowInvalid` so the model reloads.
   */
  fun rebuildLane(userContext: Any?, rewrite: RebuildRequest): RebuildReport {
    val warnings = ArrayList<String>()
    if (userContext == null) {
      return RebuildReport(0, 0, listOf("Rebuild skipped: userContext is null"))
    }
    val srcRoots = laneRoots(rewrite.source)
    val targetVersionId = reflectId(rewrite.targetWorkflowVersion)
    val task =
        reflect(rewrite.childrenToReplace.firstOrNull() ?: rewrite.laneParent, "getTask")
            ?: reflect(rewrite.laneParent, "getTask")

    // With `syncEndpoint = false` the reflecting lane keeps its OWN endpoint: it is not deleted and
    // not recreated from the source, only moved back to the end of the lane afterwards.
    val keptEndpoint =
        if (rewrite.syncEndpoint) null else terminalEndpointOf(rewrite.childrenToReplace)
    // Only skip the source's terminal node when a reflecting endpoint is actually kept; otherwise
    // the
    // lane would end without an endpoint (and stay one node short forever).
    val sourceTerminalDropped =
        keptEndpoint != null && isTerminalEndpointType(srcRoots.lastOrNull()?.type)
    val sourceRootsToCreate = if (sourceTerminalDropped) srcRoots.dropLast(1) else srcRoots

    // 1. Delete the existing reflecting action nodes (deepest-first).
    var deleted = 0
    for (child in rewrite.childrenToReplace) {
      if (keptEndpoint != null && child === keptEndpoint) continue
      try {
        deleteNodeTree(userContext, child, warnings)
        deleted++
      } catch (x: Exception) {
        warnings.add(
            "Failed to delete reflecting node '${reflect(child, "getName")}': ${x.message}")
      }
    }

    // 2. Pre-assign target UUIDs for the whole source tree so node references remap correctly.
    val sourceUuidToTargetUuid = HashMap<String, String>()
    assignTargetUuids(sourceRootsToCreate, sourceUuidToTargetUuid)

    // 3. Recreate the lane.
    var created = 0
    for (src in sourceRootsToCreate) {
      try {
        createNodeTree(
            userContext,
            rewrite.targetWorkflowVersion,
            rewrite.source,
            rewrite.laneParent,
            task,
            src,
            sourceUuidToTargetUuid,
            warnings)
        created++
      } catch (x: Exception) {
        warnings.add("Failed to recreate node '${src.name}' (${src.type}): ${x.message}")
      }
    }

    // 4. Move the kept (reflecting) endpoint back to the END of the lane.
    if (keptEndpoint != null) {
      runCatching { fixParentOrderIndex(keptEndpoint, rewrite.laneParent, userContext) }
      logger.info(
          "[WorkflowLaneMaterializer] rebuildLane: kept the reflecting endpoint '{}' ({}) as the " +
              "lane's last node",
          reflect(keptEndpoint, "getName"),
          reflect(keptEndpoint, "getType"))
    }

    if (created > 0 && targetVersionId != null) {
      refreshWorkflowModel(userContext, targetVersionId)
    }
    logger.info(
        "[WorkflowLaneMaterializer] rebuildLane: created={} deleted={} warnings={} targetVersion={}",
        created,
        deleted,
        warnings.size,
        targetVersionId)
    return RebuildReport(created, deleted, warnings, targetVersionId)
  }

  /**
   * ID-based remote rebuild (Option A1). Runs entirely from persisted ids (no executing workflow is
   * required), so the **source-side** Mirror node can push the latest source lane into a registered
   * reflecting lane while no reflecting workflow is mid-execution — defeating the Phase-0
   * walk-freeze.
   *
   * The reflecting `WorkflowVersion`, lane-parent `WorkflowNode` and each child action node are
   * loaded by id via `APIProvider.WORKFLOW_VERSION_API` / `WORKFLOW_NODE_API.getById(UserContext,
   * Long)` and delegated to [rebuildLane].
   *
   * @return a [RebuildReport]; `warnings` carry any load/rebuild failure.
   */
  fun rebuildLaneFromIds(
      userContext: Any?,
      source: SourceLane?,
      descriptor: MirrorMaterializedStore.ReflectorDescriptor
  ): RebuildReport {
    if (userContext == null || source == null) {
      return RebuildReport(0, 0, listOf("Rebuild skipped: userContext or source is null"))
    }
    return runCatching {
          val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
          val ucClass = Class.forName("de.xima.fc.user.UserContext")
          val nodeApi = apiProviderClass.getField("WORKFLOW_NODE_API").get(null)
          val versionApi = apiProviderClass.getField("WORKFLOW_VERSION_API").get(null)
          val getNodeById =
              nodeApi.javaClass.getMethod("getById", ucClass, Long::class.javaObjectType)
          val getVersionById =
              versionApi.javaClass.getMethod("getById", ucClass, Long::class.javaObjectType)

          val targetWorkflowVersion =
              getVersionById.invoke(versionApi, userContext, descriptor.targetWorkflowVersionId)
          val laneParent = getNodeById.invoke(nodeApi, userContext, descriptor.laneParentNodeId)
          if (targetWorkflowVersion == null) {
            return RebuildReport(
                0,
                0,
                listOf(
                    "Reflecting WorkflowVersion ${descriptor.targetWorkflowVersionId} not found"))
          }
          if (laneParent == null) {
            return RebuildReport(
                0,
                0,
                listOf(
                    "Reflecting lane-parent WorkflowNode ${descriptor.laneParentNodeId} not found"))
          }

          val childrenToReplace =
              descriptor.childNodeIds.mapNotNull { id ->
                getNodeById.invoke(nodeApi, userContext, id)
              }

          rebuildLane(
              userContext,
              RebuildRequest(
                  source = source,
                  laneParent = laneParent,
                  childrenToReplace = childrenToReplace,
                  targetWorkflowVersion = targetWorkflowVersion,
                  syncEndpoint = descriptor.syncEndpoint != false))
        }
        .getOrElse { x: Throwable ->
          logger.warn(
              "[WorkflowLaneMaterializer] rebuildLaneFromIds failed for target version {}: {}",
              descriptor.targetWorkflowVersionId,
              x.message)
          RebuildReport(
              0,
              0,
              listOf("rebuildLaneFromIds failed: ${x.message}"),
              descriptor.targetWorkflowVersionId)
        }
  }

  // endregion Public API

  // region In-place rewrite walk

  /** Rewrites one source node (and its subtree) into the matching target node in place. */
  private fun rewriteNodeTree(
      userContext: Any?,
      targetWorkflowVersion: Any?,
      source: SourceLane,
      src: SourceNode,
      target: Any,
      nodeUuidMap: Map<String, String>,
      warnings: MutableList<String>,
  ): Int {
    var rewritten = 0
    try {
      val nodeClass = Class.forName("de.xima.fc.entities.WorkflowNode")
      val (newParams, paramWarnings) =
          remapParams(
              userContext,
              targetWorkflowVersion,
              source.sourceStatesByUuid,
              nodeUuidMap,
              src.paramsJson)
      warnings.addAll(paramWarnings.prefixed())
      val setType = nodeClass.getMethod("setType", String::class.java)
      val setName = nodeClass.getMethod("setName", String::class.java)
      val targetType = reflect(target, "getType") as? String
      val targetName = reflect(target, "getName") as? String
      if (targetType != src.type) {
        setType.invoke(target, src.type)
        warnings.add(
            "Reflecting node type changed: '$targetType' -> '${src.type}' (id='${reflect(target, "getId")}')")
      }
      if (targetName != src.name) {
        setName.invoke(target, src.name)
      }
      nodeClass.getMethod("setCustomParameters", String::class.java).invoke(target, newParams)
      val userContextClass = Class.forName("de.xima.fc.user.UserContext")
      val transferableClass = Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity")
      val api = Class.forName("de.xima.fc.api.APIProvider").getField("WORKFLOW_NODE_API").get(null)
      val update = api.javaClass.getMethod("update", userContextClass, transferableClass)
      update.invoke(api, userContext, target)
      rewritten++
      logger.debug(
          "[WorkflowLaneMaterializer] rewrote node id={} type='{}' name='{}'",
          reflect(target, "getId"),
          src.type,
          src.name)
    } catch (x: Exception) {
      warnings.add("Failed to rewrite node '${src.name}' (${src.type}): ${x.message}")
    }
    // Recurse into children, matching target.children in order.
    val targetChildren =
        (reflect(target, "getChildren") as? List<*>)?.filterIsInstance<Any>() ?: emptyList()
    var childIdx = 0
    for (child in src.children) {
      val tChild = targetChildren.getOrNull(childIdx)
      if (tChild != null) {
        rewritten +=
            rewriteNodeTree(
                userContext, targetWorkflowVersion, source, child, tChild, nodeUuidMap, warnings)
      } else {
        warnings.add(
            "No reflecting child at index $childIdx for source child '${child.name}' (${child.type})")
      }
      childIdx++
    }
    return rewritten
  }

  /**
   * Collects the source-node-UUID -> target-node-UUID mapping for an index-aligned lane (source
   * [srcNodes] mapped onto reflecting [targetNodes], recursing into children). Used to remap
   * intra-workflow NODE UUID references (e.g. `FC_RETURN_FILE.actionUUIDs`) so a rewritten node
   * keeps pointing at the CORRESPONDING reflecting node instead of a source node that does not
   * exist in the target workflow.
   */
  private fun collectNodeUuidMap(
      srcNodes: List<SourceNode>,
      targetNodes: List<Any>,
      out: MutableMap<String, String>,
  ) {
    var idx = 0
    while (idx < srcNodes.size) {
      val src = srcNodes[idx]
      val target = targetNodes.getOrNull(idx)
      val srcUuid = src.uuid
      val targetUuid = target?.let { reflect(it, "getUuid")?.toString() }
      if (srcUuid != null && targetUuid != null && srcUuid != targetUuid) {
        out[srcUuid] = targetUuid
      }
      if (target != null) {
        val tChildren =
            (reflect(target, "getChildren") as? List<*>)?.filterIsInstance<Any>() ?: emptyList()
        collectNodeUuidMap(src.children, tChildren, out)
      }
      idx++
    }
  }

  // endregion

  // region Param remap

  /**
   * Remaps [paramsJson]'s references from the source project's scoped entities to the target
   * project's, in two tiers:
   * 1. **WorkflowState UUID references** are resolved by NAME: source `uuid` -> source NAME ->
   *    target uuid (same NAME), via [sourceStatesByUuid] / [targetStatesByName].
   * 2. **Intra-workflow NODE UUID references** ([nodeUuidMap], e.g. `FC_RETURN_FILE`'s
   *    `actionUUIDs` pointing at a preceding file-producing node) are translated source node uuid
   *    -> the CORRESPONDING reflecting node's uuid, so the rewritten lane keeps running in the
   *    reflecting workflow (Vorgang#907).
   *
   * References that cannot be resolved on either side pass through unchanged with a warning (the
   * plan's explicit no-op fallback). All other JSON is carried through unchanged.
   *
   * @return `(newJson, warnings)`.
   */
  fun remapParams(
      userContext: Any?,
      targetWorkflowVersion: Any?,
      sourceStatesByUuid: Map<String, String>,
      nodeUuidMap: Map<String, String>,
      paramsJson: String,
  ): Pair<String, List<String>> {
    if (paramsJson.isBlank()) return paramsJson to emptyList()
    val root =
        runCatching { gson.fromJson(paramsJson, JsonObject::class.java) }.getOrNull()
            ?: return paramsJson to listOf("params are not a JSON object; passed through unchanged")
    val warnings = ArrayList<String>()
    val targetStatesByName = targetStatesByName(userContext, targetWorkflowVersion).toMutableMap()
    // A copied endpoint (FC_CHANGE_STATE / FC_RETURN / …) must reference a REAL state of the
    // reflecting project, otherwise FORMCYCLE reports "Der referenzierte Status existiert nicht
    // mehr…" when the workflow is opened/executed. States are matched by NAME (case-insensitive)
    // and
    // created in the reflecting version when the source references a status the target lacks.
    ensureReferencedStatesExist(
        userContext, targetWorkflowVersion, sourceStatesByUuid, targetStatesByName, root, warnings)
    remapJson(root, sourceStatesByUuid, targetStatesByName, nodeUuidMap, warnings)
    return gson.toJson(root) to warnings
  }

  /**
   * Maps every workflow-state NAME of the target version to its UUID (keys are lower-cased and
   * trimmed so the lookup is case-insensitive), via the state API.
   */
  private fun targetStatesByName(
      userContext: Any?,
      targetWorkflowVersion: Any?,
  ): Map<String, String> {
    val out = LinkedHashMap<String, String>()
    for (state in loadTargetStates(userContext, targetWorkflowVersion)) {
      val name = reflect(state, "getName") as? String ?: continue
      val uuid = reflect(state, "getUUIDObject")?.toString() ?: continue
      out[name.trim().lowercase()] = uuid
    }
    return out
  }

  /** All `WorkflowState` entities of the reflecting version (empty list when unavailable). */
  private fun loadTargetStates(userContext: Any?, targetWorkflowVersion: Any?): List<Any> {
    if (userContext == null || targetWorkflowVersion == null) return emptyList()
    return try {
      val api = Class.forName("de.xima.fc.api.APIProvider").getField("WORKFLOW_STATE_API").get(null)
      val userContextClass = Class.forName("de.xima.fc.user.UserContext")
      val versionClass = Class.forName("de.xima.fc.entities.WorkflowVersion")
      @Suppress("UNCHECKED_CAST")
      (api.javaClass
              .getMethod("getAllByWorkflowVersion", userContextClass, versionClass)
              .invoke(api, userContext, targetWorkflowVersion) as? List<*>)
          ?.filterIsInstance<Any>() ?: emptyList()
    } catch (x: Exception) {
      logger.warn("[WorkflowLaneMaterializer] loadTargetStates failed: {}", x.message)
      emptyList()
    }
  }

  /**
   * Creates every workflow state referenced by [root] that does not exist in the reflecting version
   * yet, so the copied nodes point at real statuses.
   */
  private fun ensureReferencedStatesExist(
      userContext: Any?,
      targetWorkflowVersion: Any?,
      sourceStatesByUuid: Map<String, String>,
      targetStatesByName: MutableMap<String, String>,
      root: JsonObject,
      warnings: MutableList<String>,
  ) {
    if (userContext == null || targetWorkflowVersion == null) return
    val referenced = LinkedHashSet<String>()
    collectStateRefs(root, referenced)
    for (sourceUuid in referenced) {
      val sourceName = sourceStatesByUuid[sourceUuid]
      if (sourceName.isNullOrBlank()) {
        warnings.add(
            "WorkflowState uuid=$sourceUuid is not a state of the SOURCE workflow; cannot map it")
        continue
      }
      val key = sourceName.trim().lowercase()
      if (targetStatesByName.containsKey(key)) continue
      val created = createWorkflowState(userContext, targetWorkflowVersion, sourceName)
      if (created != null) {
        targetStatesByName[key] = created
        warnings.add("WorkflowState '$sourceName' was missing in the reflecting project — created")
        logger.info(
            "[WorkflowLaneMaterializer] created missing workflow state '{}' (uuid={}) in the reflecting workflow",
            sourceName,
            created)
      } else {
        warnings.add(
            "WorkflowState '$sourceName' is missing in the reflecting project and could not be created")
      }
    }
  }

  /** Creates a `WorkflowState` named [stateName] in [targetWorkflowVersion]; returns its UUID. */
  private fun createWorkflowState(
      userContext: Any?,
      targetWorkflowVersion: Any?,
      stateName: String,
  ): String? {
    if (userContext == null || targetWorkflowVersion == null) return null
    return try {
      val apiProviderClass = Class.forName("de.xima.fc.api.APIProvider")
      val stateApi = apiProviderClass.getField("WORKFLOW_STATE_API").get(null)
      val userContextClass = Class.forName("de.xima.fc.user.UserContext")
      val transferableClass = Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity")
      val stateClass = Class.forName("de.xima.fc.entities.WorkflowState")
      val state = stateClass.getDeclaredConstructor().newInstance()
      val uuid = UUID.randomUUID()
      stateClass.getMethod("setName", String::class.java).invoke(state, stateName)
      stateClass.getMethod("setUUIDObject", UUID::class.java).invoke(state, uuid)
      stateClass
          .getMethod("setVersion", Class.forName("de.xima.fc.entities.WorkflowVersion"))
          .invoke(state, targetWorkflowVersion)
      // Append after the last existing state so the status list order stays stable.
      var maxOrder = -1
      for (existing in loadTargetStates(userContext, targetWorkflowVersion)) {
        val idx = runCatching { reflect(existing, "getOrderIndex") as? Int }.getOrNull()
        if (idx != null && idx > maxOrder) maxOrder = idx
      }
      runCatching {
        stateClass.getMethod("setOrderIndex", Int::class.java).invoke(state, maxOrder + 1)
      }
      stateApi.javaClass
          .getMethod("create", userContextClass, transferableClass)
          .invoke(stateApi, userContext, state)
      uuid.toString()
    } catch (x: Exception) {
      logger.warn(
          "[WorkflowLaneMaterializer] could not create workflow state '{}': {}",
          stateName,
          x.message)
      null
    }
  }

  /**
   * Collects every source workflow-state UUID referenced in [el] — a `{uuid, entityClass:
   * WorkflowState}` object, or a `targetState`-like key whose value is such an object.
   */
  private fun collectStateRefs(el: JsonElement, out: MutableSet<String>) {
    when (el) {
      is JsonObject -> {
        val directUuid = el.get("uuid")?.asString
        val directEntity = el.get("entityClass")?.asString
        if (directUuid != null && directEntity == "de.xima.fc.entities.WorkflowState") {
          out.add(directUuid)
        }
        for (k in el.keySet().toList()) {
          val v = el.get(k) ?: continue
          if (v is JsonObject) {
            val nestedUuid = v.get("uuid")?.asString
            val nestedEntity = v.get("entityClass")?.asString
            if (nestedUuid != null &&
                (nestedEntity == "de.xima.fc.entities.WorkflowState" ||
                    k.equals("targetState", ignoreCase = true))) {
              out.add(nestedUuid)
            } else {
              collectStateRefs(v, out)
            }
          } else if (v is JsonArray) {
            collectStateRefs(v, out)
          }
        }
      }
      is JsonArray -> el.forEach { collectStateRefs(it, out) }
      else -> {}
    }
  }

  /** Descends a JSON tree and rewrites workflow-state UUID references in place. */
  private fun remapJson(
      el: JsonElement,
      sourceStatesByUuid: Map<String, String>,
      targetStatesByName: Map<String, String>,
      nodeUuidMap: Map<String, String>,
      warnings: MutableList<String>,
  ) {
    when (el) {
      is JsonObject -> {
        // A workflow-state reference object: { "uuid": ..., "entityClass":
        // "de.xima.fc.entities.WorkflowState" },
        // or a key whose value is such an object (e.g. targetState).
        val directUuid = el.get("uuid")?.asString
        val directEntity = el.get("entityClass")?.asString
        if (directUuid != null && directEntity == "de.xima.fc.entities.WorkflowState") {
          remapOneStateRef(el, directUuid, sourceStatesByUuid, targetStatesByName, warnings)
        } else if (directUuid != null && directEntity == "de.xima.fc.entities.WorkflowNode") {
          // A `{uuid, entityClass: WorkflowNode}` reference (node selector).
          remapOneNodeRef(el, directUuid, nodeUuidMap, warnings)
        }
        for (k in el.keySet().toList()) {
          val v = el.get(k)
          val nestedUuid = (v as? JsonObject)?.get("uuid")?.asString
          val nestedEntity = (v as? JsonObject)?.get("entityClass")?.asString
          when {
            v is JsonObject &&
                nestedUuid != null &&
                (nestedEntity == "de.xima.fc.entities.WorkflowState" ||
                    k.equals("targetState", ignoreCase = true)) ->
                remapOneStateRef(v, nestedUuid, sourceStatesByUuid, targetStatesByName, warnings)
            v is JsonObject &&
                nestedUuid != null &&
                nestedEntity == "de.xima.fc.entities.WorkflowNode" ->
                remapOneNodeRef(v, nestedUuid, nodeUuidMap, warnings)
            v is JsonObject || v is JsonArray ->
                remapJson(v, sourceStatesByUuid, targetStatesByName, nodeUuidMap, warnings)
            v is JsonPrimitive && v.isString && nodeUuidMap.containsKey(v.asString) ->
                el.add(k, JsonPrimitive(nodeUuidMap[v.asString]))
            else -> {}
          }
        }
      }
      is JsonArray -> {
        var i = 0
        for (item in el) {
          if (item.isJsonPrimitive &&
              item.asJsonPrimitive.isString &&
              nodeUuidMap.containsKey(item.asString)) {
            el.set(i, JsonPrimitive(nodeUuidMap[item.asString]))
          } else {
            remapJson(item, sourceStatesByUuid, targetStatesByName, nodeUuidMap, warnings)
          }
          i++
        }
      }
      else -> {}
    }
  }

  /**
   * Rewrites a single `{uuid, entityClass: WorkflowNode}` reference's uuid to the corresponding
   * reflecting node's uuid (source node uuid -> target node uuid), when it is known for this lane.
   */
  private fun remapOneNodeRef(
      ref: JsonObject,
      srcUuid: String,
      nodeUuidMap: Map<String, String>,
      warnings: MutableList<String>,
  ) {
    val targetUuid = nodeUuidMap[srcUuid]
    if (targetUuid == null) {
      warnings.add(
          "WorkflowNode uuid=$srcUuid has no reflecting counterpart in the lane; uuid left unchanged")
      return
    }
    if (targetUuid != srcUuid) {
      ref.addProperty("uuid", targetUuid)
      logger.debug("[WorkflowLaneMaterializer] node remap: {} -> {}", srcUuid, targetUuid)
    }
  }

  /**
   * Rewrites a single `{uuid, entityClass: WorkflowState}` reference's uuid: source uuid -> source
   * NAME -> target uuid (by same NAME).
   */
  private fun remapOneStateRef(
      ref: JsonObject,
      srcUuid: String,
      sourceStatesByUuid: Map<String, String>,
      targetStatesByName: Map<String, String>,
      warnings: MutableList<String>,
  ) {
    val srcName = sourceStatesByUuid[srcUuid]
    if (srcName == null) {
      warnings.add(
          "WorkflowState uuid=$srcUuid has no source NAME to remap by; passed through unchanged")
      return
    }
    val targetUuid = targetStatesByName[srcName.trim().lowercase()]
    if (targetUuid == null) {
      warnings.add(
          "WorkflowState '$srcName' (uuid=$srcUuid) not found in the target project and could not " +
              "be created; uuid passed through unchanged (FORMCYCLE will report a missing status)")
      return
    }
    if (targetUuid != srcUuid) {
      ref.addProperty("uuid", targetUuid)
      logger.debug(
          "[WorkflowLaneMaterializer] state remap: '{}' {} -> {}", srcName, srcUuid, targetUuid)
    }
  }

  // endregion Param remap

  // region Structural rebuild helpers

  /** Assigns a fresh target UUID to every source node (parents and children) in the tree. */
  private fun assignTargetUuids(
      nodes: List<SourceNode>,
      out: MutableMap<String, String>,
  ) {
    for (n in nodes) {
      if (!n.uuid.isNullOrBlank()) {
        out[n.uuid] = UUID.randomUUID().toString()
      }
      assignTargetUuids(n.children, out)
    }
  }

  /** Recursively deletes a reflecting node (children first, then itself) via the node API. */
  private fun deleteNodeTree(userContext: Any?, node: Any, warnings: MutableList<String>) {
    val children = reflectChildren(node)
    for (c in children) {
      deleteNodeTree(userContext, c, warnings)
    }
    val api = Class.forName("de.xima.fc.api.APIProvider").getField("WORKFLOW_NODE_API").get(null)
    val ucClass = Class.forName("de.xima.fc.user.UserContext")
    val transferableClass = Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity")
    api.javaClass.getMethod("delete", ucClass, transferableClass).invoke(api, userContext, node)
  }

  /**
   * Creates one reflecting node from [src] under [parent] and recurses into its children. The node
   * is given the **pre-assigned** target UUID (from [sourceUuidToTargetUuid]) so that
   * intra-workflow NODE UUID references resolve deterministically, and its `customParameters` are
   * remapped through [remapParams].
   */
  private fun createNodeTree(
      userContext: Any?,
      targetWorkflowVersion: Any?,
      source: SourceLane,
      parent: Any,
      task: Any?,
      src: SourceNode,
      sourceUuidToTargetUuid: Map<String, String>,
      warnings: MutableList<String>,
  ) {
    val targetUuid = sourceUuidToTargetUuid[src.uuid] ?: UUID.randomUUID().toString()
    val (newParams, paramWarnings) =
        remapParams(
            userContext,
            targetWorkflowVersion,
            source.sourceStatesByUuid,
            sourceUuidToTargetUuid,
            src.paramsJson)
    warnings.addAll(paramWarnings.prefixed())

    val workflowNodeClass = Class.forName("de.xima.fc.entities.WorkflowNode")
    val node = workflowNodeClass.getDeclaredConstructor().newInstance()
    workflowNodeClass.getMethod("setName", String::class.java).invoke(node, src.name)
    workflowNodeClass.getMethod("setType", String::class.java).invoke(node, src.type)
    runCatching { workflowNodeClass.getMethod("setActive", Boolean::class.java).invoke(node, true) }
    runCatching {
      workflowNodeClass
          .getMethod("setUUIDObject", UUID::class.java)
          .invoke(node, UUID.fromString(targetUuid))
    }
    runCatching {
      workflowNodeClass.getMethod("setCustomParameters", String::class.java).invoke(node, newParams)
    }
    if (task != null) {
      runCatching {
        workflowNodeClass
            .getMethod("setTask", Class.forName("de.xima.fc.entities.WorkflowTask"))
            .invoke(node, task)
      }
    }
    workflowNodeClass.getMethod("setParent", workflowNodeClass).invoke(node, parent)

    val api = Class.forName("de.xima.fc.api.APIProvider").getField("WORKFLOW_NODE_API").get(null)
    val ucClass = Class.forName("de.xima.fc.user.UserContext")
    val transferableClass = Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity")
    val saved =
        api.javaClass.getMethod("create", ucClass, transferableClass).invoke(api, userContext, node)
    logger.debug(
        "[WorkflowLaneMaterializer] created node id={} type='{}' name='{}'",
        reflect(saved, "getId"),
        src.type,
        src.name)

    // Position the new child in its parent's Hibernate @OrderColumn.
    fixParentOrderIndex(saved, parent, userContext)

    for (child in src.children) {
      createNodeTree(
          userContext,
          targetWorkflowVersion,
          source,
          saved,
          task,
          child,
          sourceUuidToTargetUuid,
          warnings)
    }
  }

  /**
   * Appends [node] at the end of [parent]'s `@OrderColumn` (`parent_order_idx`).
   *
   * Public entry point for the other Mirror components that create nodes outside this object: a row
   * with a `NULL` `parent_order_idx` makes FORMCYCLE's `WorkflowNode.children` list unloadable
   * ("null index column for collection"), which breaks the whole designer for that form.
   */
  fun ensureParentOrderIndex(userContext: Any?, node: Any?, parent: Any?) {
    fixParentOrderIndex(node, parent, userContext)
  }

  /** Appends a created node at the end of the parent's `@OrderColumn` (parent_order_idx). */
  private fun fixParentOrderIndex(actionNode: Any?, parentNode: Any?, userContext: Any?) {
    if (actionNode == null || parentNode == null || userContext == null) return
    val nodeId = reflectId(actionNode) ?: return
    val parentId = reflectId(parentNode) ?: return
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
      } catch (e: Exception) {
        runCatching { tx.javaClass.getMethod("rollback").invoke(tx) }
        logger.warn("[WorkflowLaneMaterializer] fixParentOrderIndex failed for node {}", nodeId, e)
      } finally {
        runCatching { entityContext.javaClass.getMethod("close").invoke(entityContext) }
      }
    } catch (e: Exception) {
      logger.warn("[WorkflowLaneMaterializer] fixParentOrderIndex (outer) failed: {}", e.message)
    }
  }

  /** The ordered `WorkflowNode` children of [node], safely reflected. */
  private fun reflectChildren(node: Any?): List<Any> =
      (reflect(node, "getChildren") as? List<*>)?.filterIsInstance<Any>() ?: emptyList()

  // endregion Structural rebuild helpers

  // region Reflection helpers

  private fun reflect(target: Any?, method: String): Any? =
      if (target == null) null
      else runCatching { target.javaClass.getMethod(method).invoke(target) }.getOrNull()

  private fun reflectId(entity: Any?): Long? = (reflect(entity, "getId") as? Number)?.toLong()

  private fun List<String>.prefixed(): List<String> = map { "param: $it" }

  // endregion
}
