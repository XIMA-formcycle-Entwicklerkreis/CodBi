package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror

import com.google.gson.JsonParser
import org.slf4j.LoggerFactory

/**
 * Read-only access to the **workflow paths** (FORMCYCLE `WorkflowTask`s) of another form.
 *
 * This is the workflow counterpart of [MirrorFormAccess]: the form Mirror references a form element
 * from another form, the workflow Mirror node references a workflow path (trigger + node tree) from
 * another form and exposes its current structure as a workflow result.
 *
 * The path is always resolved **live at execution time** from the source project's *active*
 * `WorkflowVersion`, so edits in the source workflow are reflected by the next execution. There is
 * no pinned/versioned mode.
 *
 * FORMCYCLE's plugin API (`de.xima.fc.api.APIProvider`) and JPA entities are used through
 * reflection, keeping the plugin compatible across patch releases. The entity manager is obtained
 * through `de.xima.fc.jpa.context.EntityContextFactory`, exactly like
 * `AICodBiAssistant.buildWorkflowStructureContext`.
 *
 * @since 1.1.0
 */
object WorkflowMirrorAccess {

  private val logger = LoggerFactory.getLogger(WorkflowMirrorAccess::class.java)

  /**
   * Persisted `WorkflowNode.type` of the CodBi workflow Mirror node (=
   * `MirrorNodePlugin.NODE_TYPE`).
   */
  private const val MIRROR_NODE_TYPE = "Mirror"

  /** One workflow path (= FORMCYCLE `WorkflowTask`) of the source form. */
  data class MirrorPath(
      val id: Long,
      val name: String,
      val triggerType: String,
      val triggerName: String,
      val nodeCount: Int,
  )

  /** One node of a mirrored workflow path, depth-first (parents before children). */
  data class MirrorPathNode(
      val id: Long,
      val type: String,
      val name: String,
      val description: String,
      val depth: Int,
  ) {
    /** Compact one-line representation, e.g. `FC_EMAIL: Confirmation mail`. */
    val summary: String
      get() = if (type.isBlank()) name else if (name.isBlank()) type else "$type: $name"
  }

  /** A resolved workflow path snapshot (trigger + flattened node tree + content revision). */
  data class MirrorPathSnapshot(
      val formName: String,
      val pathId: Long,
      val pathName: String,
      val triggerType: String,
      val triggerName: String,
      val nodes: List<MirrorPathNode>,
      /** Cheap content hash used to detect that the source path changed. */
      val revision: Int,
  ) {
    /** The node summaries, one per node (depth-first). */
    fun nodeSummaries(): List<String> = nodes.map { it.summary }
  }

  // region Public API

  /**
   * Lists the workflow paths (tasks) of the form referenced by [formKey].
   *
   * @param formName cached display title of the form, used to re-bind a stale form key.
   * @return the paths, or an empty list when the form / workflow cannot be resolved.
   */
  fun listPaths(
      userContext: Any?,
      formKey: String?,
      formName: String? = null,
  ): List<MirrorPath> {
    val projectId =
        MirrorFormAccess.resolveProjectId(userContext, formKey, formName) ?: return emptyList()
    val em = entityManager(userContext) ?: return emptyList()
    return try {
      val versionId = activeWorkflowVersionId(em, projectId) ?: return emptyList()
      val rows =
          query(
              em,
              "SELECT t.id, t.name, tr.type, tr.name FROM de.xima.fc.entities.WorkflowTask t " +
                  "LEFT JOIN t.trigger tr JOIN t.process wp JOIN wp.version wv " +
                  "WHERE wv.id = :vid ORDER BY t.id",
              mapOf("vid" to versionId))
      val result = ArrayList<MirrorPath>(rows.size)
      for (row in rows) {
        val cols = row as? Array<*> ?: continue
        if (cols.size < 4) continue
        val id = (cols[0] as? Number)?.toLong() ?: continue
        result.add(
            MirrorPath(
                id = id,
                name = cols[1]?.toString().orEmpty(),
                triggerType = cols[2]?.toString().orEmpty(),
                triggerName = cols[3]?.toString().orEmpty(),
                nodeCount = nodeCount(em, id)))
      }
      result
    } catch (x: Exception) {
      logger.warn("[WorkflowMirrorAccess] listPaths failed for '{}': {}", formKey, x.message)
      emptyList()
    } finally {
      closeQuietly(em)
    }
  }

  /**
   * Resolves one path (task) of the source form to a snapshot of its trigger and node tree.
   *
   * @param pathId the `WorkflowTask` id stored on the node.
   * @return the snapshot, or `null` when the form / version / path cannot be resolved.
   */
  fun snapshot(
      userContext: Any?,
      formKey: String?,
      pathId: Long?,
      formName: String? = null,
  ): MirrorPathSnapshot? {
    if (pathId == null || pathId <= 0L) return null
    logger.debug(
        "[WorkflowMirrorAccess] snapshot: form='{}' pathId={} userContextPresent={}",
        formKey,
        pathId,
        userContext != null)
    val projectId =
        MirrorFormAccess.resolveProjectId(userContext, formKey, formName)
            ?: run {
              logger.debug(
                  "[WorkflowMirrorAccess] snapshot: project id could NOT be resolved for '{}' - " +
                      "returning null",
                  formKey)
              return null
            }
    val em =
        entityManager(userContext)
            ?: run {
              logger.debug(
                  "[WorkflowMirrorAccess] snapshot: no entity manager available - returning null")
              return null
            }
    return try {
      val versionId =
          activeWorkflowVersionId(em, projectId)
              ?: run {
                logger.debug(
                    "[WorkflowMirrorAccess] snapshot: no ACTIVE workflow version found for " +
                        "project {} - returning null",
                    projectId)
                return null
              }
      logger.debug(
          "[WorkflowMirrorAccess] snapshot: project={} activeWorkflowVersionId={}",
          projectId,
          versionId)
      val pathRows =
          query(
              em,
              "SELECT t.id, t.name, tr.type, tr.name FROM de.xima.fc.entities.WorkflowTask t " +
                  "LEFT JOIN t.trigger tr JOIN t.process wp JOIN wp.version wv " +
                  "WHERE wv.id = :vid AND t.id = :tid",
              mapOf("vid" to versionId, "tid" to pathId))
      val pathRow =
          pathRows.firstOrNull() as? Array<*>
              ?: run {
                logger.debug(
                    "[WorkflowMirrorAccess] snapshot: path {} not found in version {} of project {} - " +
                        "returning null",
                    pathId,
                    versionId,
                    projectId)
                return null
              }
      if (pathRow.size < 4) {
        logger.debug(
            "[WorkflowMirrorAccess] snapshot: path {} row has unexpected shape - returning null",
            pathId)
        return null
      }
      val nodeRows =
          query(
              em,
              "SELECT n.id, n.type, n.name, n.description, n.parent.id " +
                  "FROM de.xima.fc.entities.WorkflowNode n WHERE n.task.id = :tid ORDER BY n.id",
              mapOf("tid" to pathId))
      logger.debug(
          "[WorkflowMirrorAccess] snapshot: path={} ('{}') found, trigger='{}', raw node rows={}",
          pathId,
          pathRow[1]?.toString(),
          "${pathRow[2]}: ${pathRow[3]}",
          nodeRows.size)
      val nodes = flattenNodes(nodeRows)
      logger.debug(
          "[WorkflowMirrorAccess] snapshot: flattened {} nodes (READ-ONLY, actions are NOT " +
              "executed)",
          nodes.size)
      val displayForm = formName?.trim().takeUnless { it.isNullOrEmpty() } ?: "Form $projectId"
      MirrorPathSnapshot(
          formName = displayForm,
          pathId = (pathRow[0] as? Number)?.toLong() ?: pathId,
          pathName = pathRow[1]?.toString().orEmpty(),
          triggerType = pathRow[2]?.toString().orEmpty(),
          triggerName = pathRow[3]?.toString().orEmpty(),
          nodes = nodes,
          revision = (rowsSignature(pathRows) + "\u0003" + rowsSignature(nodeRows)).hashCode())
    } catch (x: Exception) {
      logger.warn(
          "[WorkflowMirrorAccess] snapshot failed for '{}'/{}: {}", formKey, pathId, x.message)
      null
    } finally {
      closeQuietly(em)
    }
  }

  /** The content revision of the resolved path, or `0` when the path cannot be resolved. */
  fun revision(
      userContext: Any?,
      formKey: String?,
      pathId: Long?,
      formName: String? = null,
  ): Int = snapshot(userContext, formKey, pathId, formName)?.revision ?: 0

  /**
   * Reads the SOURCE path's node TREE (with `customParameters` and exact `@OrderColumn` sibling
   * order) for the Materializer's in-place rewrite. Unlike [snapshot] (which flattens to
   * [MirrorPathNode] WITHOUT `customParameters` and WITHOUT sibling order), this wires the managed
   * `WorkflowNode` entities and walks their `getChildren()` collections, so the returned tree
   * respects FORMCYCLE's real sibling order and carries the JSON params each copied node needs.
   *
   * Also captures the source workflow version's states as `uuid -> name` so the Materializer can
   * remap state UUID references by name into the reflecting project.
   *
   * @return the source lane (with params and ordered children), or `null` when unresolvable.
   */
  internal fun sourceLane(
      userContext: Any?,
      formKey: String?,
      pathId: Long?,
      formName: String? = null,
  ): WorkflowLaneMaterializer.SourceLane? {
    if (pathId == null || pathId <= 0L) return null
    val projectId = MirrorFormAccess.resolveProjectId(userContext, formKey, formName) ?: return null
    val em = entityManager(userContext) ?: return null
    return try {
      val versionId = activeWorkflowVersionId(em, projectId) ?: return null
      val pathRows =
          query(
              em,
              "SELECT t.id, t.name, tr.type FROM de.xima.fc.entities.WorkflowTask t " +
                  "LEFT JOIN t.trigger tr JOIN t.process wp JOIN wp.version wv " +
                  "WHERE wv.id = :vid AND t.id = :tid",
              mapOf("vid" to versionId, "tid" to pathId))
      val pathRow = pathRows.firstOrNull() as? Array<*> ?: return null
      val pathName = pathRow.getOrNull(1)?.toString().orEmpty()
      val triggerType = pathRow.getOrNull(2)?.toString().orEmpty()
      val nodeEntitiesRows =
          query(
              em,
              "SELECT n FROM de.xima.fc.entities.WorkflowNode n WHERE n.task.id = :tid",
              mapOf("tid" to pathId))
      val nodes = nodeEntitiesRows.filterIsInstance<Any>()
      val byId = HashMap<Long, Any>()
      val getId = nodes.firstOrNull()?.javaClass?.getMethod("getId")
      for (n in nodes) {
        val id = getId?.invoke(n) as? Number ?: continue
        byId[id.toLong()] = n
      }
      val getParent = nodes.firstOrNull()?.javaClass?.getMethod("getParent")
      val roots = ArrayList<Any>()
      for (n in nodes) {
        val parent = getParent?.invoke(n)
        val parentId = parent?.javaClass?.getMethod("getId")?.invoke(parent) as? Number
        if (parentId == null || !byId.containsKey(parentId.toLong())) roots.add(n)
      }
      fun build(node: Any): WorkflowLaneMaterializer.SourceNode? {
        val id = getId?.invoke(node) as? Number ?: return null
        val cls = node.javaClass
        val type =
            runCatching { cls.getMethod("getType").invoke(node) as? String }.getOrNull() ?: ""
        val name =
            runCatching { cls.getMethod("getName").invoke(node) as? String }.getOrNull() ?: ""
        val description =
            runCatching { cls.getMethod("getDescription").invoke(node) as? String }.getOrNull()
                ?: ""
        val params =
            runCatching { cls.getMethod("getCustomParameters").invoke(node) as? String }.getOrNull()
                ?: ""
        // The node's own UUID: intra-workflow references (e.g. FC_RETURN_FILE.actionUUIDs) point
        // at preceding nodes BY UUID, so the Materializer can translate them to the reflecting
        // node while rewriting (Vorgang#907).
        val uuid = runCatching { cls.getMethod("getUuid").invoke(node)?.toString() }.getOrNull()
        val children =
            runCatching {
                  @Suppress("UNCHECKED_CAST")
                  (cls.getMethod("getChildren").invoke(node) as? List<*>)
                      ?.filterIsInstance<Any>()
                      ?.mapNotNull { build(it) } ?: emptyList()
                }
                .getOrElse { emptyList() }
        return WorkflowLaneMaterializer.SourceNode(
            id.toLong(), uuid, type, name, description, params, children)
      }
      val rootsBuilt = roots.mapNotNull { build(it) }
      logger.info(
          "[WorkflowMirrorAccess] sourceLane: project={} version={} path={} ('{}') roots={} nodes={}",
          projectId,
          versionId,
          pathId,
          pathName,
          rootsBuilt.size,
          byId.size)
      val signature = "$versionId\u0001$pathId\u0001$pathName".hashCode()
      WorkflowLaneMaterializer.SourceLane(
          pathId = pathId,
          pathName = pathName,
          triggerType = triggerType,
          roots = rootsBuilt,
          revision = signature,
          sourceStatesByUuid = statesOfVersionByUuid(em, versionId))
    } catch (x: Exception) {
      logger.warn(
          "[WorkflowMirrorAccess] sourceLane failed for '{}'/{}: {}", formKey, pathId, x.message)
      null
    } finally {
      closeQuietly(em)
    }
  }

  /** The `uuid -> name` map of every workflow state of [versionId] (read-only, for param remap). */
  private fun statesOfVersionByUuid(em: Any?, versionId: Long): Map<String, String> {
    if (em == null) return emptyMap()
    val rows =
        query(
            em,
            "SELECT s FROM de.xima.fc.entities.WorkflowState s WHERE s.version.id = :vid",
            mapOf("vid" to versionId))
    val out = LinkedHashMap<String, String>()
    val getUuid = rows.firstOrNull()?.javaClass?.getMethod("getUUIDObject")
    val getName = rows.firstOrNull()?.javaClass?.getMethod("getName")
    if (getUuid == null || getName == null) return out
    for (s in rows) {
      val uuid = runCatching { getUuid.invoke(s)?.toString() }.getOrNull()
      val name = runCatching { getName.invoke(s) as? String }.getOrNull()
      if (uuid != null && name != null) out[uuid] = name
    }
    return out
  }

  /**
   * Discovers the **reflecting lanes** of [sourceProjectId] directly from the persisted workflow
   * model: every `WorkflowNode` of type `Mirror` whose stored `sourceForm` resolves to
   * [sourceProjectId].
   *
   * This is the source-save counterpart of the runtime registry
   * ([MirrorMaterializedStore.registerReflector], which is only filled once the *reflecting* Mirror
   * node has EXECUTED). Discovery needs no prior submit, so the push from a source save also works
   * the very first time — and for reflecting paths whose Mirror node never ran (e.g. a freshly
   * configured form whose path only contains the Mirror node).
   *
   * The returned descriptors carry the lane parent and the CURRENT downstream siblings, exactly
   * like the executing Mirror node captures them, so [MirrorPushService] can rebuild that lane
   * without an executing reflecting workflow.
   */
  fun discoverReflectors(
      userContext: Any?,
      sourceProjectId: Long,
  ): List<MirrorMaterializedStore.RegisteredReflector> =
      discoverForSourceProject(userContext, sourceProjectId).reflectors

  /**
   * Like [discoverReflectors], but for **every** configured Mirror node of the installation. Used
   * by the automatic background watcher ([MirrorAutoSync]), which has no "saved project" to filter
   * by.
   */
  fun discoverAllReflectors(userContext: Any?): List<MirrorMaterializedStore.RegisteredReflector> =
      discoverAll(userContext).reflectors

  /**
   * One discovery pass: the reflectors plus the source paths whose sync is paused on the source.
   */
  data class Discovery(
      val reflectors: List<MirrorMaterializedStore.RegisteredReflector>,
      /** Source paths `(formKey, pathId)` for which a pause marker exists on the SOURCE path. */
      val pausedSources: Set<Pair<String, Long>> = emptySet(),
  )

  /** Discovers every Mirror node of the installation (used by [MirrorAutoSync]). */
  fun discoverAll(userContext: Any?): Discovery = discover(userContext, null)

  /** Discovers the Mirror nodes that mirror [sourceProjectId] (used by the source-save push). */
  fun discoverForSourceProject(userContext: Any?, sourceProjectId: Long): Discovery =
      if (sourceProjectId <= 0L) Discovery(emptyList()) else discover(userContext, sourceProjectId)

  /**
   * Id of the form's ACTIVE `WorkflowVersion`, or `null` when the form/version cannot be resolved.
   * Used by [MirrorTriggerPaths] to read the source paths and to create the reflecting ones.
   */
  fun activeVersionId(userContext: Any?, formKey: String?, formName: String? = null): Long? {
    val projectId = MirrorFormAccess.resolveProjectId(userContext, formKey, formName) ?: return null
    val em = entityManager(userContext) ?: return null
    return try {
      activeWorkflowVersionId(em, projectId)
    } catch (x: Exception) {
      logger.warn("[WorkflowMirrorAccess] activeVersionId failed for '{}': {}", formKey, x.message)
      null
    } finally {
      closeQuietly(em)
    }
  }

  /**
   * Whether the SOURCE path `(formKey, pathId)` currently has a sync pause marker, i.e. a Mirror
   * node on that very path with `pauseSync` ticked. Consulted by the reflecting-side lazy re-sync
   * so a single switch on the source stops **every** reflecting form at once.
   */
  fun isSourceSyncPaused(userContext: Any?, formKey: String?, pathId: Long?): Boolean {
    if (formKey.isNullOrBlank() || pathId == null || pathId <= 0L) return false
    return (formKey.trim() to pathId) in discoverAll(userContext).pausedSources
  }

  /**
   * Shared discovery; [onlySourceProjectId] `null` means "every Mirror node".
   *
   * A Mirror node that references its OWN path (`sourceForm` = own form, `pathId` = own task) and
   * has `pauseSync` ticked is the **source-side sync brake**: it is not a reflector itself, and
   * every reflector of that `(formKey, pathId)` is filtered out — one switch for all reflecting
   * forms.
   */
  private fun discover(userContext: Any?, onlySourceProjectId: Long?): Discovery {
    val em = entityManager(userContext) ?: return Discovery(emptyList())
    return try {
      val mirrorNodes =
          query(
                  em,
                  "SELECT n FROM de.xima.fc.entities.WorkflowNode n WHERE n.type = :type",
                  mapOf("type" to MIRROR_NODE_TYPE))
              .filterIsInstance<Any>()
      val out = ArrayList<MirrorMaterializedStore.RegisteredReflector>()
      val paused = LinkedHashSet<Pair<String, Long>>()
      for (node in mirrorNodes) {
        val target = mirrorNodeTarget(node) ?: continue
        if (target.pauseSync) {
          if (isSelfReference(node, target)) {
            // Source-side brake: place the Mirror node on its own path -> no reflecting form of
            // this
            // source path is updated anymore.
            paused.add(target.formKey to target.pathId)
            logger.info(
                "[WorkflowMirrorAccess] discover: sync is PAUSED for the source path {}/{} " +
                    "(pause node '{}')",
                target.formKey,
                target.pathId,
                invoke(node, "getName"))
          } else {
            // Local brake: a pause ticked on a reflecting node just stops THAT lane from syncing.
            logger.debug(
                "[WorkflowMirrorAccess] discover: Mirror node '{}' is paused — its reflecting path " +
                    "is not updated",
                invoke(node, "getName"))
          }
          continue
        }
        if (!target.autoSync) {
          logger.debug(
              "[WorkflowMirrorAccess] discover: Mirror node '{}' has autoSync disabled — skipped",
              invoke(node, "getName"))
          continue
        }
        if (onlySourceProjectId != null) {
          // Project filter (source-save push): resolve the stored source form and compare. The
          // unfiltered watcher pass SKIPS this lookup — it costs an API round-trip per Mirror node
          // and runs every few seconds; `loadSource` validates the stored key anyway.
          val resolvedSourceProject =
              MirrorFormAccess.resolveProjectId(userContext, target.formKey, target.formName)
                  ?: continue
          if (resolvedSourceProject != onlySourceProjectId) continue
        }
        val descriptor = reflectorDescriptor(node, target)
        if (descriptor == null) {
          logger.warn(
              "[WorkflowMirrorAccess] discover: Mirror node '{}' of the reflecting path has no " +
                  "parent (it is the path's root node) — cannot materialize into it",
              invoke(node, "getName"))
          continue
        }
        out.add(
            MirrorMaterializedStore.RegisteredReflector(target.formKey, target.pathId, descriptor))
      }
      val reflectors =
          out.distinctBy {
                it.sourceFormKey to it.sourcePathId to it.descriptor.targetWorkflowVersionId
              }
              // Paused path as the SOURCE: nothing is pushed from it into its reflecting forms.
              .filterNot { (it.sourceFormKey to it.sourcePathId) in paused }
              // Paused path as the TARGET: nothing is pushed into it from its own sources either,
              // so
              // a pause marker freezes the path in BOTH directions.
              .filterNot { isTargetPaused(it, paused) }
      logger.info(
          "[WorkflowMirrorAccess] discover: sourceProject={} mirrorNodes={} reflectors={} pausedPaths={}",
          onlySourceProjectId?.toString() ?: "ALL",
          mirrorNodes.size,
          reflectors.size,
          paused.size)
      Discovery(reflectors, paused)
    } catch (x: Exception) {
      logger.warn(
          "[WorkflowMirrorAccess] discover failed (sourceProject={}): {}",
          onlySourceProjectId?.toString() ?: "ALL",
          x.message)
      Discovery(emptyList())
    } finally {
      closeQuietly(em)
    }
  }

  /** Whether the reflector writes INTO one of the paused paths (it is paused as a target). */
  private fun isTargetPaused(
      row: MirrorMaterializedStore.RegisteredReflector,
      paused: Set<Pair<String, Long>>,
  ): Boolean {
    if (paused.isEmpty()) return false
    val projectId = row.descriptor.reflectingProjectId ?: return false
    return ("project-$projectId" to row.descriptor.taskId) in paused
  }

  /**
   * Whether the Mirror [node] lives on the very path it references — the precondition for using it
   * as a sync-pause marker.
   */
  private fun isSelfReference(node: Any, target: MirrorTarget): Boolean {
    val task = invoke(node, "getTask") ?: return false
    val ownTaskId = entityId(task) ?: return false
    if (ownTaskId != target.pathId) return false
    val ownProjectId =
        entityId(invoke(invoke(invoke(task, "getProcess"), "getVersion"), "getProject"))
            ?: return false
    return target.formKey.equals("project-$ownProjectId", ignoreCase = true)
  }

  /** Configuration of a persisted Mirror node: where it mirrors from and whether it may write. */
  private data class MirrorTarget(
      val formKey: String,
      val pathId: Long,
      val formName: String?,
      /** `autoSync` prop; defaults to `true` (the node's default) when absent. */
      val autoSync: Boolean,
      /** `syncEndpoint` prop; defaults to `true` (materialize the source's endpoint). */
      val syncEndpoint: Boolean,
      /** `pauseSync` prop; defaults to `false`. */
      val pauseSync: Boolean,
  )

  /**
   * The Mirror node's stored configuration, read from its `customParameters` JSON; `null` when the
   * node is not (correctly) configured.
   */
  private fun mirrorNodeTarget(node: Any): MirrorTarget? {
    val raw = invoke(node, "getCustomParameters") as? String ?: return null
    if (raw.isBlank()) return null
    return try {
      val json = JsonParser.parseString(raw)
      if (!json.isJsonObject) return null
      val obj = json.asJsonObject
      val formKey = obj.get("sourceForm")?.asString?.trim().orEmpty()
      if (formKey.isEmpty()) return null
      val pathId = obj.get("pathId")?.asString?.trim()?.toLongOrNull() ?: return null
      if (pathId <= 0L) return null
      val formName = obj.get("sourceFormName")?.asString?.trim()?.takeIf { it.isNotEmpty() }
      val autoSync = obj.get("autoSync")?.asBoolean ?: true
      val syncEndpoint = obj.get("syncEndpoint")?.asBoolean ?: true
      val pauseSync = obj.get("pauseSync")?.asBoolean ?: false
      MirrorTarget(formKey, pathId, formName, autoSync, syncEndpoint, pauseSync)
    } catch (x: Exception) {
      logger.debug("[WorkflowMirrorAccess] mirrorNodeTarget: unparsable params: {}", x.message)
      null
    }
  }

  /**
   * Builds the reflecting lane descriptor hosted by the Mirror [node]: its workflow version/task
   * plus the parent container and the ordered downstream siblings (the nodes the rebuild replaces).
   */
  private fun reflectorDescriptor(
      node: Any,
      target: MirrorTarget,
  ): MirrorMaterializedStore.ReflectorDescriptor? {
    val nodeId = entityId(node) ?: return null
    val parent = invoke(node, "getParent") ?: return null
    val parentId = entityId(parent) ?: return null
    val task = invoke(node, "getTask") ?: return null
    val taskId = entityId(task) ?: return null
    val version = invoke(invoke(task, "getProcess"), "getVersion") ?: return null
    val versionId = entityId(version) ?: return null
    val projectId = entityId(invoke(version, "getProject"))
    val siblings =
        (invoke(parent, "getChildren") as? List<*>)?.filterIsInstance<Any>() ?: emptyList()
    val selfIndex = siblings.indexOfFirst { entityId(it) == nodeId }
    val downstream = if (selfIndex >= 0) siblings.drop(selfIndex + 1) else emptyList()
    return MirrorMaterializedStore.ReflectorDescriptor(
        reflectingProjectId = projectId,
        targetWorkflowVersionId = versionId,
        taskId = taskId,
        laneParentNodeId = parentId,
        childNodeIds = downstream.mapNotNull { entityId(it) },
        syncEndpoint = target.syncEndpoint)
  }

  /** Reflectively invokes a no-arg getter, or `null` when it does not exist / throws. */
  private fun invoke(target: Any?, method: String): Any? =
      if (target == null) null
      else runCatching { target.javaClass.getMethod(method).invoke(target) }.getOrNull()

  /** Reflectively reads the entity's `getId()` as `Long`. */
  private fun entityId(target: Any?): Long? = (invoke(target, "getId") as? Number)?.toLong()

  // endregion Public API

  // region Reading the graph

  /**
   * Resolves the ACTIVE `WorkflowVersion` id of [projectId], falling back to the newest version.
   */
  private fun activeWorkflowVersionId(em: Any?, projectId: Long): Long? {
    val activeRows =
        query(
            em,
            "SELECT p.activeWorkflowVersion.id FROM de.xima.fc.entities.Projekt p " +
                "WHERE p.id = :pid",
            mapOf("pid" to projectId))
    (activeRows.firstOrNull() as? Number)
        ?.toLong()
        ?.takeIf { it > 0L }
        ?.let {
          return it
        }
    val versionRows =
        query(
            em,
            "SELECT wv.id FROM de.xima.fc.entities.WorkflowVersion wv " +
                "WHERE wv.project.id = :pid ORDER BY wv.versionNumber DESC",
            mapOf("pid" to projectId))
    return (versionRows.firstOrNull() as? Number)?.toLong()?.takeIf { it > 0L }
  }

  /**
   * Stable content signature of raw JPQL rows.
   *
   * Do NOT use `List<Array<*>>.toString()`: the rows are `Object[]`, whose `toString()` is the
   * identity hash code and therefore changes on every query. That would make the revision useless.
   */
  private fun rowsSignature(rows: List<*>): String =
      rows.joinToString("\u0001") { row ->
        when (row) {
          is Array<*> -> row.joinToString("\u0002") { it?.toString().orEmpty() }
          else -> row?.toString().orEmpty()
        }
      }

  /** Number of nodes of a task (best effort; `0` when the query fails). */
  private fun nodeCount(em: Any?, taskId: Long): Int {
    val rows =
        query(
            em,
            "SELECT COUNT(n) FROM de.xima.fc.entities.WorkflowNode n WHERE n.task.id = :tid",
            mapOf("tid" to taskId))
    return (rows.firstOrNull() as? Number)?.toInt() ?: 0
  }

  /** Raw node row of the node query (before the tree is flattened). */
  private data class RawNode(
      val id: Long,
      val type: String,
      val name: String,
      val description: String,
      val parentId: Long?,
  )

  /**
   * Flattens the node rows of one task into depth-first order (parents before children), computing
   * each node's depth from its `parent.id`.
   */
  private fun flattenNodes(rows: List<*>): List<MirrorPathNode> {
    val byId = LinkedHashMap<Long, RawNode>()
    for (row in rows) {
      val cols = row as? Array<*> ?: continue
      if (cols.size < 5) continue
      val id = (cols[0] as? Number)?.toLong() ?: continue
      byId[id] =
          RawNode(
              id = id,
              type = cols[1]?.toString().orEmpty(),
              name = cols[2]?.toString().orEmpty(),
              description = cols[3]?.toString().orEmpty(),
              parentId = (cols[4] as? Number)?.toLong())
    }
    val children = HashMap<Long, MutableList<Long>>()
    val roots = ArrayList<Long>()
    for ((id, node) in byId) {
      val parent = node.parentId
      if (parent != null && byId.containsKey(parent)) {
        children.getOrPut(parent) { mutableListOf() }.add(id)
      } else {
        roots.add(id)
      }
    }
    val result = ArrayList<MirrorPathNode>(byId.size)
    val visited = HashSet<Long>()
    fun visit(id: Long, depth: Int) {
      if (!visited.add(id)) return
      val node = byId[id] ?: return
      result.add(
          MirrorPathNode(
              id = node.id,
              type = node.type,
              name = node.name,
              description = node.description,
              depth = depth))
      for (child in children[id].orEmpty()) visit(child, depth + 1)
    }
    for (root in roots) visit(root, 0)
    // Defensive: include nodes that were not reachable from a root (e.g. broken parent links).
    for (id in byId.keys) visit(id, 0)
    return result
  }

  // endregion Reading the graph

  // region Reflection helpers

  /** Opens a FORMCYCLE-managed EntityManager for an already-built `UserContext`. */
  internal fun entityManager(userContext: Any?): Any? {
    if (userContext == null) return null
    return try {
      val factoryClass = Class.forName("de.xima.fc.jpa.context.EntityContextFactory")
      val ucClass = Class.forName("de.xima.fc.user.UserContext")
      val entityContext =
          factoryClass.getMethod("newEntityContext", ucClass).invoke(null, userContext)
      entityContext.javaClass.getMethod("getEm").invoke(entityContext)
    } catch (x: Exception) {
      logger.warn("[WorkflowMirrorAccess] entityManager failed: {}", x.message)
      null
    }
  }

  /** Runs a JPQL query with named parameters and returns the raw result list. */
  internal fun query(em: Any?, jpql: String, params: Map<String, Any?>): List<*> {
    if (em == null) return emptyList<Any>()
    return try {
      val query = em.javaClass.getMethod("createQuery", String::class.java).invoke(em, jpql)
      for ((name, value) in params) {
        query.javaClass
            .getMethod("setParameter", String::class.java, Any::class.java)
            .invoke(query, name, value)
      }
      @Suppress("UNCHECKED_CAST")
      (query.javaClass.getMethod("getResultList").invoke(query) as? List<*>) ?: emptyList<Any>()
    } catch (x: Exception) {
      logger.warn("[WorkflowMirrorAccess] query failed: {}", x.message)
      emptyList<Any>()
    }
  }

  internal fun closeQuietly(em: Any?) {
    runCatching { (em as? AutoCloseable)?.close() }
  }

  // endregion Reflection helpers
}
