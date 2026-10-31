package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror

import com.alibaba.fastjson.JSON
import com.alibaba.fastjson.JSONArray
import com.alibaba.fastjson.JSONObject
import com.google.gson.JsonObject
import java.util.UUID
import org.slf4j.LoggerFactory

/**
 * Opt-in Mirror-widget feature: **create the workflow paths that are triggered by a mirrored
 * element** in the reflecting form, each with a `Mirror` node that keeps it in sync with the source
 * path — and remove those paths again when their trigger disappears.
 *
 * Enabled per Mirror widget via the `codbi_mirror_create_triggered_paths` property (default off).
 *
 * The paths created here are marked in their `WorkflowTask.description` ([MARKER] +
 * `source=<formKey>#<taskId>`), which is what makes the lifecycle safe: only tasks carrying that
 * marker are ever updated or deleted, so user-authored paths are never touched.
 *
 * All FORMCYCLE entity/API access uses reflection (fc-common is provided-scope), exactly like
 * [WorkflowMirrorAccess] / [WorkflowLaneMaterializer].
 *
 * @since 1.1.0
 */
internal object MirrorTriggerPaths {

  private val logger = LoggerFactory.getLogger(MirrorTriggerPaths::class.java)

  /** Marker prefix stored in the description of every task this feature creates. */
  const val MARKER = "[CodBi Mirror]"

  /**
   * Build marker of the trigger-reflection logic.
   *
   * Printed in the diagnostic log lines so a pasted log can be attributed to the running build (the
   * "namespaced trigger never fires" investigation needed several rounds of exactly that).
   */
  internal const val TRIGGER_SYNC_VERSION = "trigger-sync#4"

  /** Node type of the CodBi workflow Mirror node. */
  private const val MIRROR_NODE_TYPE = "Mirror"

  /** Display name of the CodBi workflow Mirror node. */
  internal const val MIRROR_NODE_NAME = "Mirror"

  /**
   * Node type of the TEMPORARY endpoint that keeps a freshly created path valid.
   *
   * FORMCYCLE requires every path to end in a terminal endpoint node, and a path that only contains
   * the `Mirror` node has none — the designer reports it as invalid. `FC_RETURN` is the harmless
   * choice: it ends the process without a state transition and needs no target status. The endpoint
   * is replaced by the reflected source nodes on the first sync (see [createPlaceholderEndpoint]).
   */
  internal const val PLACEHOLDER_ENDPOINT_TYPE = "FC_RETURN"

  /**
   * Display name of the temporary endpoint (its label is rendered from `customParameters.name`).
   */
  private const val PLACEHOLDER_ENDPOINT_NAME = "End process"

  /** One workflow path of the SOURCE form whose trigger references the mirrored element subtree. */
  data class SourcePath(
      val taskId: Long,
      val taskName: String,
      val triggerType: String,
      val triggerName: String,
      val triggerParams: String,
  )

  /**
   * Lists the source form's workflow paths whose trigger references the mirrored element itself or
   * one of its children.
   *
   * A trigger binds to a concrete form element through its `customParameters` JSON, so the element
   * references are matched by their technical name/id tokens inside that JSON.
   */
  fun findTriggeredPaths(
      userContext: Any?,
      sourceFormKey: String?,
      elementRef: String?,
      elementKey: String?,
  ): List<SourcePath> {
    if (userContext == null || sourceFormKey.isNullOrBlank()) return emptyList()
    val versionId =
        WorkflowMirrorAccess.activeVersionId(userContext, sourceFormKey) ?: return emptyList()
    val tokens = elementTokens(userContext, sourceFormKey, elementRef, elementKey)
    if (tokens.isEmpty()) {
      logger.warn(
          "[CodBi][Mirror] triggered paths: no element tokens for '{}'/'{}' — nothing to match",
          sourceFormKey,
          elementRef)
      return emptyList()
    }
    val em = WorkflowMirrorAccess.entityManager(userContext) ?: return emptyList()
    return try {
      val rows =
          WorkflowMirrorAccess.query(
              em,
              "SELECT t.id, t.name, tr.type, tr.name, tr.customParameters " +
                  "FROM de.xima.fc.entities.WorkflowTask t JOIN t.trigger tr " +
                  "JOIN t.process p JOIN p.version v WHERE v.id = :vid",
              mapOf("vid" to versionId))
      val out = ArrayList<SourcePath>()
      for (row in rows) {
        val cols = row as? Array<*> ?: continue
        if (cols.size < 5) continue
        val params = cols[4]?.toString().orEmpty()
        if (!referencesAnyToken(params, tokens)) continue
        out.add(
            SourcePath(
                taskId = (cols[0] as? Number)?.toLong() ?: continue,
                taskName = cols[1]?.toString().orEmpty(),
                triggerType = cols[2]?.toString().orEmpty(),
                triggerName = cols[3]?.toString().orEmpty(),
                triggerParams = params))
      }
      logger.info(
          "[CodBi][Mirror] triggered paths: source='{}' element='{}' tokens={} tasks={} matches={}",
          sourceFormKey,
          elementRef,
          tokens.size,
          rows.size,
          out.size)
      if (out.isEmpty() && rows.isNotEmpty()) {
        // Diagnosis aid: show what the triggers actually reference, so a non-matching element
        // binding
        // (e.g. an id instead of a name) is visible in the log.
        for (row in rows) {
          val cols = row as? Array<*> ?: continue
          logger.info(
              "[CodBi][Mirror] triggered paths: no match — trigger {}:{} params={}",
              cols[2]?.toString().orEmpty(),
              cols[3]?.toString().orEmpty(),
              cols[4]?.toString().orEmpty().take(300))
        }
        logger.info("[CodBi][Mirror] triggered paths: looked for tokens {}", tokens)
      }
      out
    } catch (x: Exception) {
      logger.warn("[CodBi][Mirror] findTriggeredPaths failed: {}", describe(x))
      logger.warn("[CodBi][Mirror] findTriggeredPaths failure details", x)
      emptyList()
    } finally {
      WorkflowMirrorAccess.closeQuietly(em)
    }
  }

  /**
   * Creates/updates the reflecting paths for every triggered source path and removes marked paths
   * whose trigger is gone.
   *
   * @param targetFormKey the reflecting form (`project-<id>`) whose active workflow version
   *   receives the paths.
   * @param namePrefix the namespace prefix of the mirrored child items (`<mirrorName>_`), used to
   *   re-point the copied trigger at the mirrored element instead of the source element.
   */
  fun syncTriggeredPaths(
      userContext: Any?,
      sourceFormKey: String?,
      elementRef: String?,
      elementKey: String?,
      targetFormKey: String?,
      namePrefix: String?,
  ): String {
    if (userContext == null) return "SKIPPED:no-userContext"
    if (sourceFormKey.isNullOrBlank() || targetFormKey.isNullOrBlank()) {
      return "SKIPPED:invalid-form"
    }
    val tokens = elementTokens(userContext, sourceFormKey, elementRef, elementKey)
    // Names that actually exist in the REFLECTING form (item names/ids and XButtonList button
    // entries). The trigger remap only re-points a reference when the namespaced form really exists
    // there — a button name, for instance, is NOT namespaced by the Mirror copy, so prefixing it
    // would make the reflected trigger never match the click.
    val targetNames = reflectingFormNames(userContext, targetFormKey, namePrefix)
    val triggered = findTriggeredPaths(userContext, sourceFormKey, elementRef, elementKey)
    val prefix = namePrefix?.trim().orEmpty()
    // Diagnostic: a trigger reference only fires when the name it names EXISTS in the reflecting
    // form. This shows, for every mirrored element name, whether it is present plain or namespaced.
    logger.info(
        "[CodBi][Mirror] trigger matching: tokens={} presentPlain={} presentNamespaced={} " +
            "({} names in the reflecting form)",
        tokens,
        tokens.filter { it in targetNames },
        tokens.filter { "$prefix$it" in targetNames },
        targetNames.size)
    val targetVersionId =
        WorkflowMirrorAccess.activeVersionId(userContext, targetFormKey)
            ?: return "SKIPPED:no-target-version"
    val em = WorkflowMirrorAccess.entityManager(userContext) ?: return "SKIPPED:no-entity-manager"
    val existing =
        try {
          loadMarkedTasks(em, targetVersionId)
        } finally {
          WorkflowMirrorAccess.closeQuietly(em)
        }
    val wanted = triggered.associateBy { "${sourceFormKey}#${it.taskId}" }
    var created = 0
    var updated = 0
    var removed = 0
    // 1. Create/update the paths that are triggered right now.
    for ((key, path) in wanted) {
      val marker = markerOf(key)
      val current = existing.entries.firstOrNull { it.value.description.contains(marker) }
      if (current != null) {
        val repaired =
            ensureMirrorNode(
                userContext,
                current.value.taskId,
                sourceFormKey,
                path,
                tokens,
                namePrefix,
                targetNames)
        if (repaired) updated++
        continue
      }
      if (createPath(
          userContext,
          targetVersionId,
          marker,
          sourceFormKey,
          path,
          namePrefix,
          tokens,
          targetNames)) {
        created++
      }
    }
    // 2. Remove marked paths whose trigger disappeared.
    for ((_, task) in existing) {
      val isWanted = wanted.keys.any { key -> task.description.contains(markerOf(key)) }
      if (isWanted) continue
      if (removePath(userContext, task.taskId)) removed++
    }
    if (created + updated + removed > 0) {
      // Tickle + restore (never leave the version invalid): a version that stays `workflowInvalid`
      // is served to the frontend as OFFLINE until someone saves the workflow in the designer.
      WorkflowLaneMaterializer.refreshWorkflowModel(userContext, targetVersionId)
    }
    val note = "created=$created updated=$updated removed=$removed"
    logger.info(
        "[CodBi][Mirror] [{}] triggered paths for '{}' -> '{}': {}",
        TRIGGER_SYNC_VERSION,
        sourceFormKey,
        targetFormKey,
        note)
    return note
  }

  // region Detection helpers

  /** Technical names/ids of the mirrored element and ALL its descendants (trigger match tokens). */
  private fun elementTokens(
      userContext: Any?,
      sourceFormKey: String,
      elementRef: String?,
      elementKey: String?,
  ): Set<String> {
    val tokens = LinkedHashSet<String>()
    elementRef?.trim()?.takeIf { it.isNotEmpty() }?.let { tokens.add(it) }
    elementKey?.trim()?.takeIf { it.isNotEmpty() }?.let { tokens.add(it) }
    val subtree =
        runCatching {
              MirrorFormAccess.mirrorSubtree(
                  userContext, sourceFormKey, elementRef, null, elementKey)
            }
            .getOrNull()
    subtree?.nodes?.forEach { node ->
      node.name.trim().takeIf { it.isNotEmpty() }?.let { tokens.add(it) }
      node.ref.trim().takeIf { it.isNotEmpty() }?.let { tokens.add(it) }
    }
    // A submit trigger identifies its button by `button.name` (+ `button.qualifier` = the
    // XButtonList item). Those BUTTON ENTRIES are not form items, so they are not part of the
    // subtree nodes — but they are re-pointed by the Mirror's render-time name namespace as well.
    tokens.addAll(buttonNamesOf(userContext, sourceFormKey, tokens))
    return tokens
  }

  /** `XButtonList` button-entry names of the items whose name/id is in [refs]. */
  private fun buttonNamesOf(
      userContext: Any?,
      sourceFormKey: String?,
      refs: Set<String>,
  ): Set<String> {
    if (userContext == null || sourceFormKey.isNullOrBlank() || refs.isEmpty()) return emptySet()
    val root =
        runCatching { MirrorFormAccess.loadFormJson(userContext, sourceFormKey) }.getOrNull()
            ?: return emptySet()
    val out = LinkedHashSet<String>()

    fun walk(items: JSONArray?) {
      if (items == null) return
      for (index in 0 until items.size) {
        val item = items.getJSONObject(index) ?: continue
        val props = item.getJSONObject("properties") ?: continue
        val name = props.getString("name").orEmpty()
        val id = props.getString("id").orEmpty()
        if (name in refs || id in refs) {
          for (key in listOf("buttons", "buttonEntries")) {
            val buttons = props.getJSONArray(key) ?: continue
            for (buttonIndex in 0 until buttons.size) {
              val buttonName = buttons.getJSONObject(buttonIndex)?.getString("name")
              (buttonName as? String)?.trim()?.takeIf { it.isNotEmpty() }?.let { out.add(it) }
            }
          }
        }
        walk(item.getJSONArray("items"))
      }
    }

    walk(root.getJSONArray("items"))
    return out
  }

  /** Whether [paramsJson] mentions one of [tokens] as a quoted JSON string value. */
  private fun referencesAnyToken(paramsJson: String, tokens: Set<String>): Boolean {
    if (paramsJson.isBlank()) return false
    return tokens.any { token ->
      token.length >= 2 &&
          (paramsJson.contains("\"$token\"") ||
              paramsJson.contains(":$token,") ||
              paramsJson.contains(":$token}"))
    }
  }

  // endregion Detection helpers

  // region Target-side task handling

  /** A workflow path of the reflecting form that was created by this feature. */
  private data class MarkedTask(
      val taskId: Long,
      val name: String,
      val description: String,
  )

  private fun markerOf(sourceKey: String): String = "$MARKER source=$sourceKey"

  /** All tasks of [versionId] whose description carries [MARKER]. */
  private fun loadMarkedTasks(em: Any?, versionId: Long): Map<Long, MarkedTask> {
    val rows =
        WorkflowMirrorAccess.query(
            em,
            "SELECT t.id, t.name, t.description FROM de.xima.fc.entities.WorkflowTask t " +
                "JOIN t.process p JOIN p.version v WHERE v.id = :vid AND t.description LIKE :marker",
            mapOf("vid" to versionId, "marker" to "$MARKER%"))
    val out = LinkedHashMap<Long, MarkedTask>()
    for (row in rows) {
      val cols = row as? Array<*> ?: continue
      val id = (cols[0] as? Number)?.toLong() ?: continue
      out[id] = MarkedTask(id, cols[1]?.toString().orEmpty(), cols[2]?.toString().orEmpty())
    }
    return out
  }

  /**
   * Creates a new workflow path (task + root SEQUENCE + `Mirror` node + trigger) in the reflecting
   * version. Returns `true` when the whole path was created.
   *
   * The order is the same one FORMCYCLE's own designer uses when it saves a path, and it matters:
   * 1. the task — its `trigger`/`rootNode` FKs are non-nullable, so the task must exist first,
   * 2. the `SEQUENCE` root node,
   * 3. the `Mirror` node — created **before** the trigger, so a path can never show up in the
   *    designer without the node that reflects the source path,
   * 4. the trigger, re-pointed at the mirrored element names,
   * 5. re-linking `trigger` + `rootNode` on the task.
   *
   * The `@OrderColumn` repair ([MirrorDataRepair.renumberProcessTasks]) runs **last**: it opens its
   * own `EntityContext` and transaction, and doing that in the middle of the API calls above
   * detaches the entities the following calls still need — which surfaces as a reflective
   * `InvocationTargetException` whose message is `null`.
   */
  private fun createPath(
      userContext: Any,
      targetVersionId: Long,
      marker: String,
      sourceFormKey: String,
      source: SourcePath,
      namePrefix: String?,
      tokens: Set<String>,
      targetNames: Set<String>,
  ): Boolean =
      try {
        val api = Class.forName("de.xima.fc.api.APIProvider")
        val userContextClass = Class.forName("de.xima.fc.user.UserContext")
        val taskApi = api.getField("WORKFLOW_TASK_API").get(null)
        val triggerApi = api.getField("WORKFLOW_TRIGGER_API").get(null)
        val nodeApi = api.getField("WORKFLOW_NODE_API").get(null)
        val versionApi = api.getField("WORKFLOW_VERSION_API").get(null)
        val taskClass = Class.forName("de.xima.fc.entities.WorkflowTask")
        val triggerClass = Class.forName("de.xima.fc.entities.WorkflowTrigger")
        val nodeClass = Class.forName("de.xima.fc.entities.WorkflowNode")

        val version =
            versionApi.javaClass
                .getMethod("getById", userContextClass, java.lang.Long::class.javaObjectType)
                .invoke(versionApi, userContext, targetVersionId)
                ?: throw IllegalStateException("workflow version $targetVersionId not found")
        val mainProcess =
            version.javaClass.getMethod("getMainProcess").invoke(version)
                ?: throw IllegalStateException(
                    "workflow version $targetVersionId has no main process")
        val mainProcessId = reflectId(mainProcess)

        // 1. Task — trigger/rootNode are wired below, once they are persisted.
        val task = taskClass.getDeclaredConstructor().newInstance()
        taskClass.getMethod("setName", String::class.java).invoke(task, source.taskName)
        taskClass.getMethod("setDescription", String::class.java).invoke(task, marker)
        taskClass.getMethod("setUUIDObject", UUID::class.java).invoke(task, UUID.randomUUID())
        taskClass
            .getMethod("setProcess", Class.forName("de.xima.fc.entities.WorkflowProcess"))
            .invoke(task, mainProcess)
        val savedTask = createEntity(taskApi, userContext, task)
        val taskId = reflectId(savedTask)
        logger.info(
            "[CodBi][Mirror] create-path 1/5: task id={} '{}' (source path {})",
            taskId,
            source.taskName,
            source.taskId)

        // 2. Root SEQUENCE — FORMCYCLE requires the root of a path to be a SEQUENCE container.
        val savedRoot =
            createNode(
                userContext = userContext,
                nodeApi = nodeApi,
                nodeClass = nodeClass,
                taskClass = taskClass,
                task = savedTask,
                name = "SEQUENCE",
                type = "SEQUENCE",
                params = null,
                parent = null,
                description = null)
        logger.info("[CodBi][Mirror] create-path 2/5: root node id={}", reflectId(savedRoot))

        // 3. Mirror node (its lane is filled in by MirrorAutoSync / the source-save push).
        val mirrorNode =
            createMirrorNode(
                userContext,
                nodeApi,
                nodeClass,
                taskClass,
                savedTask,
                savedRoot,
                sourceFormKey,
                source)
        logger.info("[CodBi][Mirror] create-path 3/5: Mirror node id={}", reflectId(mirrorNode))

        // 3b. TEMPORARY endpoint AFTER the Mirror node: without a terminal node FORMCYCLE reports
        //     the new path as invalid. It is replaced by the reflected lane on the first sync — as
        // an
        //     extra lane child it already forces the structural rebuild, which deletes it.
        val placeholder =
            createPlaceholderEndpoint(
                userContext, nodeApi, nodeClass, taskClass, savedTask, savedRoot)
        logger.info(
            "[CodBi][Mirror] create-path 3b/5: temporary endpoint id={} ({})",
            reflectId(placeholder),
            PLACEHOLDER_ENDPOINT_TYPE)

        // 4. Trigger, re-pointed at the MIRRORED element names.
        val trigger = triggerClass.getDeclaredConstructor().newInstance()
        triggerClass.getMethod("setType", String::class.java).invoke(trigger, source.triggerType)
        triggerClass.getMethod("setName", String::class.java).invoke(trigger, source.triggerName)
        triggerClass.getMethod("setActive", Boolean::class.java).invoke(trigger, true)
        triggerClass.getMethod("setUUIDObject", UUID::class.java).invoke(trigger, UUID.randomUUID())
        triggerClass.getMethod("setTask", taskClass).invoke(trigger, savedTask)
        triggerClass
            .getMethod("setCustomParameters", String::class.java)
            .invoke(trigger, triggerParamsOf(source, tokens, namePrefix, targetNames))
        val savedTrigger = createEntity(triggerApi, userContext, trigger)
        logger.info(
            "[CodBi][Mirror] create-path 4/5: trigger id={} '{}:{}'",
            reflectId(savedTrigger),
            source.triggerType,
            source.triggerName)

        // 5. Link the now-persisted trigger + root node back on the task.
        taskClass.getMethod("setTrigger", triggerClass).invoke(savedTask, savedTrigger)
        taskClass.getMethod("setRootNode", nodeClass).invoke(savedTask, savedRoot)
        updateEntity(taskApi, userContext, savedTask)
        logger.info("[CodBi][Mirror] create-path 5/5: task {} linked to trigger + root", taskId)

        // CRITICAL: a task row with a NULL `proc_order_idx` makes `WorkflowProcess.tasks`
        // unloadable
        // ("null index column for collection"). Repaired LAST, in its own EntityContext.
        MirrorDataRepair.renumberProcessTasks(userContext, mainProcessId)

        logger.info(
            "[CodBi][Mirror] created reflecting path '{}' (task={}, root={}, trigger={}, mirror={}) " +
                "for source path {} of '{}'",
            source.taskName,
            taskId,
            reflectId(savedRoot),
            reflectId(savedTrigger),
            reflectId(mirrorNode),
            source.taskId,
            sourceFormKey)
        true
      } catch (x: Exception) {
        logger.warn(
            "[CodBi][Mirror] could not create the reflecting path for source path {} of '{}': {}",
            source.taskId,
            sourceFormKey,
            describe(x))
        logger.warn("[CodBi][Mirror] create-path failure details", x)
        false
      }

  /**
   * Ensures the marked task of an existing reflecting path is complete: it has a root node, a
   * trigger and its `Mirror` node. Returns `true` when the path had to be repaired.
   *
   * This is the self-healing counterpart of [createPath]: a path that a previous, aborted run left
   * half-created (only the task row exists) is completed here instead of being left unusable — a
   * path without a trigger never starts, and a path without a `Mirror` node never reflects the
   * source path.
   */
  private fun ensureMirrorNode(
      userContext: Any,
      taskId: Long,
      sourceFormKey: String,
      source: SourcePath,
      tokens: Set<String>,
      namePrefix: String?,
      targetNames: Set<String>,
  ): Boolean {
    return try {
      val api = Class.forName("de.xima.fc.api.APIProvider")
      val userContextClass = Class.forName("de.xima.fc.user.UserContext")
      val taskApi = api.getField("WORKFLOW_TASK_API").get(null)
      val nodeApi = api.getField("WORKFLOW_NODE_API").get(null)
      val triggerApi = api.getField("WORKFLOW_TRIGGER_API").get(null)
      val taskClass = Class.forName("de.xima.fc.entities.WorkflowTask")
      val nodeClass = Class.forName("de.xima.fc.entities.WorkflowNode")
      val triggerClass = Class.forName("de.xima.fc.entities.WorkflowTrigger")
      val task =
          taskApi.javaClass
              .getMethod("getById", userContextClass, java.lang.Long::class.javaObjectType)
              .invoke(taskApi, userContext, taskId)
      if (task == null) {
        logger.warn("[CodBi][Mirror] ensureMirrorNode: task {} no longer exists", taskId)
        return false
      }
      var repaired = false
      // An aborted run may have persisted the task without ever linking its root node — relink it,
      // otherwise the Mirror node would have nothing to hang on.
      var root: Any? =
          runCatching { task.javaClass.getMethod("getRootNode").invoke(task) }.getOrNull()
      if (root == null) {
        // Reuse a root node the aborted run already persisted instead of adding a second, empty
        // lane.
        val orphanId = findRootNodeId(userContext, taskId)
        if (orphanId != null) {
          root =
              nodeApi.javaClass
                  .getMethod("getById", userContextClass, java.lang.Long::class.javaObjectType)
                  .invoke(nodeApi, userContext, orphanId)
        }
        if (root == null) {
          root =
              createNode(
                  userContext = userContext,
                  nodeApi = nodeApi,
                  nodeClass = nodeClass,
                  taskClass = taskClass,
                  task = task,
                  name = "SEQUENCE",
                  type = "SEQUENCE",
                  params = null,
                  parent = null,
                  description = null)
        }
        taskClass.getMethod("setRootNode", nodeClass).invoke(task, root)
        updateEntity(taskApi, userContext, task)
        repaired = true
        logger.info(
            "[CodBi][Mirror] ensureMirrorNode: relinked root node id={} on task {}",
            reflectId(root),
            taskId)
      }
      val parent = root ?: throw IllegalStateException("no root node for task $taskId")
      // 2. Trigger — recreated when missing, RE-POINTED when its params still name SOURCE elements.
      //    A trigger that references a name the reflecting form does not have never fires: the
      // click
      //    then falls through to the default "submitted successfully" page.
      val expectedTriggerParams = triggerParamsOf(source, tokens, namePrefix, targetNames)
      val existingTrigger =
          runCatching { task.javaClass.getMethod("getTrigger").invoke(task) }.getOrNull()
      if (existingTrigger == null) {
        val trigger = triggerClass.getDeclaredConstructor().newInstance()
        triggerClass.getMethod("setType", String::class.java).invoke(trigger, source.triggerType)
        triggerClass.getMethod("setName", String::class.java).invoke(trigger, source.triggerName)
        triggerClass.getMethod("setActive", Boolean::class.java).invoke(trigger, true)
        triggerClass.getMethod("setUUIDObject", UUID::class.java).invoke(trigger, UUID.randomUUID())
        triggerClass.getMethod("setTask", taskClass).invoke(trigger, task)
        triggerClass
            .getMethod("setCustomParameters", String::class.java)
            .invoke(trigger, expectedTriggerParams)
        val savedTrigger = createEntity(triggerApi, userContext, trigger)
        taskClass.getMethod("setTrigger", triggerClass).invoke(task, savedTrigger)
        updateEntity(taskApi, userContext, task)
        repaired = true
        logger.info(
            "[CodBi][Mirror] ensureMirrorNode: recreated the missing trigger id={} on task {}",
            reflectId(savedTrigger),
            taskId)
      } else if (syncTriggerParams(
          userContext, triggerApi, existingTrigger, expectedTriggerParams)) {
        repaired = true
      }

      // 3. Mirror node — created when missing, otherwise only its source configuration is
      // refreshed.
      val existingNodeId = findMirrorNodeId(userContext, taskId)
      if (existingNodeId != null) {
        updateMirrorNodeParams(userContext, existingNodeId, sourceFormKey, source)
      } else {
        val created =
            createMirrorNode(
                userContext, nodeApi, nodeClass, taskClass, task, parent, sourceFormKey, source)
        repaired = true
        logger.info(
            "[CodBi][Mirror] ensureMirrorNode: recreated the Mirror node id={} on task {} " +
                "(source path {})",
            reflectId(created),
            taskId,
            source.taskId)
        // A path that only holds Mirror nodes has no terminal endpoint and is reported as invalid
        // in the designer — add the temporary endpoint if the lane does not already end in one.
        val laneChildren =
            runCatching {
                  (parent.javaClass.getMethod("getChildren").invoke(parent) as? List<*>)
                      ?.filterIsInstance<Any>()
                }
                .getOrNull()
                .orEmpty()
        if (!hasTerminalEndpoint(laneChildren)) {
          val placeholder =
              createPlaceholderEndpoint(userContext, nodeApi, nodeClass, taskClass, task, parent)
          logger.info(
              "[CodBi][Mirror] ensureMirrorNode: created the temporary endpoint id={} on task {}",
              reflectId(placeholder),
              taskId)
        }
      }
      repaired
    } catch (x: Exception) {
      logger.warn("[CodBi][Mirror] ensureMirrorNode failed for task {}: {}", taskId, describe(x))
      logger.warn("[CodBi][Mirror] ensureMirrorNode failure details", x)
      false
    }
  }

  /**
   * Creates the `Mirror` node of a reflecting path under [parent] and returns the persisted node.
   *
   * Created through [createNode], which also appends it to its parent's `@OrderColumn`
   * (`parent_order_idx`).
   */
  private fun createMirrorNode(
      userContext: Any,
      nodeApi: Any,
      nodeClass: Class<*>,
      taskClass: Class<*>,
      task: Any,
      parent: Any,
      sourceFormKey: String,
      source: SourcePath,
  ): Any =
      createNode(
          userContext = userContext,
          nodeApi = nodeApi,
          nodeClass = nodeClass,
          taskClass = taskClass,
          task = task,
          name = "Mirror",
          type = MIRROR_NODE_TYPE,
          params = mirrorNodeParams(sourceFormKey, source),
          parent = parent,
          description = markerOf("$sourceFormKey#${source.taskId}"))

  /**
   * Creates the temporary `FC_RETURN` endpoint that keeps a freshly created path VALID.
   *
   * It is created AFTER the `Mirror` node, so it is the lane's last node. On the next sync it
   * either gets re-typed in place (when the source lane has exactly one action node) or — because
   * it is an extra lane child — triggers the structural rebuild, which deletes it and recreates the
   * reflected source nodes.
   */
  private fun createPlaceholderEndpoint(
      userContext: Any,
      nodeApi: Any,
      nodeClass: Class<*>,
      taskClass: Class<*>,
      task: Any,
      parent: Any,
  ): Any {
    val params = JsonObject()
    params.addProperty("name", PLACEHOLDER_ENDPOINT_NAME)
    return createNode(
        userContext = userContext,
        nodeApi = nodeApi,
        nodeClass = nodeClass,
        taskClass = taskClass,
        task = task,
        name = PLACEHOLDER_ENDPOINT_NAME,
        type = PLACEHOLDER_ENDPOINT_TYPE,
        params = params.toString(),
        parent = parent,
        description = "$MARKER temporary endpoint (replaced by the reflected lane)")
  }

  /** Whether [children] already end in a terminal lane endpoint (Mirror nodes ignored). */
  private fun hasTerminalEndpoint(children: List<Any>): Boolean =
      WorkflowLaneMaterializer.terminalEndpointOf(
          children.filter { reflectType(it) != MIRROR_NODE_TYPE }) != null

  /** `getType()` of a persisted entity, or `null`. */
  private fun reflectType(target: Any?): String? =
      runCatching { target?.javaClass?.getMethod("getType")?.invoke(target) as? String }.getOrNull()

  /**
   * Re-points an existing trigger when its `customParameters` no longer match the mirrored names.
   *
   * Returns `true` when the params were rewritten.
   */
  private fun syncTriggerParams(
      userContext: Any,
      triggerApi: Any,
      trigger: Any,
      expected: String,
  ): Boolean {
    val current =
        runCatching {
              trigger.javaClass.getMethod("getCustomParameters").invoke(trigger) as? String
            }
            .getOrNull()
            .orEmpty()
    if (current == expected) return false
    trigger.javaClass.getMethod("setCustomParameters", String::class.java).invoke(trigger, expected)
    updateEntity(triggerApi, userContext, trigger)
    logger.info(
        "[CodBi][Mirror] trigger '{}' params re-pointed: {} -> {}",
        runCatching { trigger.javaClass.getMethod("getName").invoke(trigger) as? String }
            .getOrNull(),
        current.take(300),
        expected.take(300))
    return true
  }

  /** Id of the root-level (`parent IS NULL`) node of [taskId], or null when there is none. */
  private fun findRootNodeId(userContext: Any, taskId: Long): Long? {
    val em = WorkflowMirrorAccess.entityManager(userContext) ?: return null
    return try {
      val rows =
          WorkflowMirrorAccess.query(
              em,
              "SELECT n.id FROM de.xima.fc.entities.WorkflowNode n " +
                  "WHERE n.task.id = :tid AND n.parent IS NULL ORDER BY n.id",
              mapOf("tid" to taskId))
      (rows.firstOrNull() as? Number)?.toLong()
    } catch (x: Exception) {
      logger.warn("[CodBi][Mirror] findRootNodeId failed for task {}: {}", taskId, describe(x))
      null
    } finally {
      WorkflowMirrorAccess.closeQuietly(em)
    }
  }

  /** Id of the `Mirror` node of [taskId], or null when it is missing. */
  private fun findMirrorNodeId(userContext: Any, taskId: Long): Long? {
    val em = WorkflowMirrorAccess.entityManager(userContext) ?: return null
    return try {
      val rows =
          WorkflowMirrorAccess.query(
              em,
              "SELECT n.id FROM de.xima.fc.entities.WorkflowNode n " +
                  "WHERE n.task.id = :tid AND n.type = :type",
              mapOf("tid" to taskId, "type" to MIRROR_NODE_TYPE))
      (rows.firstOrNull() as? Number)?.toLong()
    } catch (x: Exception) {
      logger.warn("[CodBi][Mirror] findMirrorNodeId failed for task {}: {}", taskId, describe(x))
      null
    } finally {
      WorkflowMirrorAccess.closeQuietly(em)
    }
  }

  /** Updates an existing Mirror node's source configuration. */
  private fun updateMirrorNodeParams(
      userContext: Any,
      nodeId: Long?,
      sourceFormKey: String,
      source: SourcePath,
  ) {
    if (nodeId == null) return
    val api = Class.forName("de.xima.fc.api.APIProvider")
    val userContextClass = Class.forName("de.xima.fc.user.UserContext")
    val nodeApi = api.getField("WORKFLOW_NODE_API").get(null)
    val node =
        nodeApi.javaClass
            .getMethod("getById", userContextClass, java.lang.Long::class.javaObjectType)
            .invoke(nodeApi, userContext, nodeId) ?: return
    node.javaClass
        .getMethod("setCustomParameters", String::class.java)
        .invoke(node, mirrorNodeParams(sourceFormKey, source))
    updateEntity(nodeApi, userContext, node)
    logger.info("[CodBi][Mirror] updated Mirror node {} for source path {}", nodeId, source.taskId)
  }

  /**
   * `customParameters` JSON of the Mirror node that points at the source path.
   *
   * **Must** be a strictly valid JSON object: `AWorkflowElement.customParameters` is annotated with
   * `@NotNull` + `@JsonObject`, and the latter is validated with FORMCYCLE's own strict RFC reader
   * (`de.xima.cmn.reader.JsonReader.isValidJsonObject`). A hand-concatenated string therefore
   * aborts the insert with a `ConstraintViolationException` ("muss ein gueltiges JSON-Objekt
   * sein"), so the object is built with a real serializer — which also escapes quotes/backslashes
   * in the path name correctly.
   */
  internal fun mirrorNodeParams(sourceFormKey: String, source: SourcePath): String {
    val full = mirrorNodeJson(sourceFormKey, source, withFlags = true)
    if (isValidJsonObject(full)) return full
    // A server whose `JsonReader` is stricter than the serializer (e.g. an older build) would abort
    // the insert, so fall back to the flag-less form: all three flags default to the same values in
    // `MirrorNodeProps` (autoSync/syncEndpoint = true, pauseSync = false).
    logger.warn(
        "[CodBi][Mirror] Mirror node params are not a valid JSON object for FORMCYCLE's reader — " +
            "falling back to the flag-less form: {}",
        full)
    val minimal = mirrorNodeJson(sourceFormKey, source, withFlags = false)
    if (!isValidJsonObject(minimal)) {
      logger.warn("[CodBi][Mirror] minimal Mirror node params rejected as well: {}", minimal)
    }
    return minimal
  }

  /** The Mirror node `customParameters` object, optionally with the behaviour flags. */
  private fun mirrorNodeJson(
      sourceFormKey: String,
      source: SourcePath,
      withFlags: Boolean,
  ): String {
    val params = JsonObject()
    params.addProperty("name", MIRROR_NODE_NAME)
    params.addProperty("description", "Mirror of ${source.taskName}")
    params.addProperty("sourceForm", sourceFormKey)
    params.addProperty("sourceFormName", "")
    params.addProperty("pathId", source.taskId.toString())
    params.addProperty("pathName", source.taskName)
    params.addProperty("outputMode", "SUMMARY")
    if (withFlags) {
      params.addProperty("autoSync", true)
      params.addProperty("syncEndpoint", true)
      params.addProperty("pauseSync", false)
    }
    return params.toString()
  }

  /**
   * Whether FORMCYCLE's strict reader accepts [json] as a JSON object — the exact check Hibernate
   * runs through `@JsonObject` on `AWorkflowElement.customParameters`. Returns `true` when the
   * reader class is unavailable, so a missing optional dependency never blocks the feature.
   */
  private fun isValidJsonObject(json: String): Boolean =
      runCatching { de.xima.cmn.reader.JsonReader.isValidJsonObject(json) }.getOrDefault(true)

  /**
   * `customParameters` of the copied trigger.
   *
   * `WorkflowTrigger.customParameters` is also `@NotNull`/`@JsonObject`, so an empty source payload
   * becomes `{}` — otherwise the (otherwise valid) insert would be rejected.
   */
  /**
   * Read-only diagnostic snapshot of the trigger reflection for one mirrored element.
   *
   * Returns a JSON document with the match tokens, the names that exist in the reflecting form, the
   * source paths that reference the element (with their raw AND re-pointed params) and every path
   * of the reflecting workflow version (with its trigger params). It answers "which trigger would
   * fire on this button click" without needing to click anything.
   */
  fun diagnose(
      userContext: Any?,
      sourceFormKey: String?,
      elementRef: String?,
      elementKey: String?,
      targetFormKey: String?,
      namePrefix: String?,
  ): String {
    val body = JSONObject()
    body["marker"] = TRIGGER_SYNC_VERSION
    body["sourceForm"] = sourceFormKey.orEmpty()
    body["targetForm"] = targetFormKey.orEmpty()
    body["prefix"] = namePrefix.orEmpty()
    if (userContext == null) {
      body["error"] = "no userContext"
      return body.toJSONString()
    }
    val tokens = elementTokens(userContext, sourceFormKey.orEmpty(), elementRef, elementKey)
    val targetNames = reflectingFormNames(userContext, targetFormKey, namePrefix)
    val prefix = namePrefix?.trim().orEmpty()
    body["tokens"] = JSONArray().also { arr -> tokens.forEach { arr.add(it) } }
    body["reflectingNames"] =
        JSONArray().also { arr -> targetNames.sorted().forEach { arr.add(it) } }
    body["presentPlain"] =
        JSONArray().also { arr -> tokens.filter { it in targetNames }.forEach { arr.add(it) } }
    body["presentNamespaced"] =
        JSONArray().also { arr ->
          tokens.filter { "$prefix$it" in targetNames }.forEach { arr.add(it) }
        }
    val sourceArray = JSONArray()
    for (path in findTriggeredPaths(userContext, sourceFormKey, elementRef, elementKey)) {
      val obj = JSONObject()
      obj["taskId"] = path.taskId
      obj["taskName"] = path.taskName
      obj["triggerType"] = path.triggerType
      obj["triggerName"] = path.triggerName
      obj["params"] = path.triggerParams
      obj["expectedParams"] = triggerParamsOf(path, tokens, namePrefix, targetNames)
      obj["remapped"] = remapTriggerParams(path, tokens, namePrefix, targetNames)
      sourceArray.add(obj)
    }
    body["sourcePaths"] = sourceArray
    val targetArray = JSONArray()
    val targetVersionId = WorkflowMirrorAccess.activeVersionId(userContext, targetFormKey)
    body["targetVersion"] = targetVersionId
    if (targetVersionId != null) {
      for (path in pathsOfVersion(userContext, targetVersionId)) {
        val obj = JSONObject()
        obj["taskId"] = path.taskId
        obj["taskName"] = path.taskName
        obj["triggerType"] = path.triggerType
        obj["triggerName"] = path.triggerName
        obj["params"] = path.triggerParams
        targetArray.add(obj)
      }
    }
    body["targetPaths"] = targetArray
    val json = body.toJSONString()
    logger.info("[CodBi][Mirror] [{}] diagnose: {}", TRIGGER_SYNC_VERSION, json)
    return json
  }

  /** All workflow paths of [versionId] with their trigger, unfiltered. */
  private fun pathsOfVersion(userContext: Any?, versionId: Long): List<SourcePath> {
    val em = WorkflowMirrorAccess.entityManager(userContext) ?: return emptyList()
    return try {
      val rows =
          WorkflowMirrorAccess.query(
              em,
              "SELECT t.id, t.name, tr.type, tr.name, tr.customParameters " +
                  "FROM de.xima.fc.entities.WorkflowTask t JOIN t.trigger tr " +
                  "JOIN t.process p JOIN p.version v WHERE v.id = :vid",
              mapOf("vid" to versionId))
      val out = ArrayList<SourcePath>()
      for (row in rows) {
        val cols = row as? Array<*> ?: continue
        if (cols.size < 5) continue
        out.add(
            SourcePath(
                taskId = (cols[0] as? Number)?.toLong() ?: continue,
                taskName = cols[1]?.toString().orEmpty(),
                triggerType = cols[2]?.toString().orEmpty(),
                triggerName = cols[3]?.toString().orEmpty(),
                triggerParams = cols[4]?.toString().orEmpty()))
      }
      out
    } catch (x: Exception) {
      logger.warn("[CodBi][Mirror] pathsOfVersion failed: {}", describe(x))
      emptyList()
    } finally {
      WorkflowMirrorAccess.closeQuietly(em)
    }
  }

  private fun triggerParamsOf(
      source: SourcePath,
      tokens: Set<String>,
      namePrefix: String?,
      targetNames: Set<String>,
  ): String {
    val remapped = remapTriggerParams(source, tokens, namePrefix, targetNames).ifBlank { "{}" }
    logger.info(
        "[CodBi][Mirror] [{}] trigger '{}' ({}): source params={} -> reflected params={}",
        TRIGGER_SYNC_VERSION,
        source.triggerName,
        source.triggerType,
        source.triggerParams,
        remapped)
    return remapped
  }

  /**
   * Re-points the copied trigger at the MIRRORED element: every quoted string that names one of the
   * mirrored elements becomes `<mirrorName>_<sourceName>` (the namespace of the Mirror widget's
   * generated child items). Only exact token matches are rewritten, so trigger types, state UUIDs
   * and other string values stay untouched.
   */
  internal fun remapTriggerParams(
      source: SourcePath,
      tokens: Set<String>,
      namePrefix: String?,
      targetNames: Set<String> = emptySet(),
  ): String {
    val params = source.triggerParams
    if (params.isBlank()) return params
    val prefix = namePrefix?.trim().orEmpty()
    if (prefix.isEmpty() || tokens.isEmpty()) return params
    val root = runCatching { JSON.parseObject(params) }.getOrNull() ?: return params
    var changed = false

    fun walk(value: Any?): Any? =
        when (value) {
          is MutableMap<*, *> -> {
            @Suppress("UNCHECKED_CAST") val map = value as MutableMap<String, Any?>
            for (entryKey in map.keys.toList()) {
              val child = map[entryKey]
              val mapped = walk(child)
              if (mapped !== child) map[entryKey] = mapped
            }
            map
          }
          is MutableList<*> -> {
            @Suppress("UNCHECKED_CAST") val list = value as MutableList<Any?>
            for (index in list.indices) {
              val child = list[index]
              val mapped = walk(child)
              if (mapped !== child) list[index] = mapped
            }
            list
          }
          is String -> {
            // BUTTON keys (`name`, `button.name`, `button.qualifier`) are re-pointed like any other
            // element reference: FORMCYCLE validates the submitted key against the form MODEL, and
            // the Mirror's copy of an XButtonList prefixes its `buttons[].name` entries as well —
            // so
            // model, markup and trigger all agree. `mirroredNameOf()` keeps the plain name when the
            // reflecting form only has that one (older copies), which makes this self-healing.
            val mapped = mirroredNameOf(value, tokens, prefix, targetNames)
            if (mapped == null) {
              value
            } else {
              changed = true
              mapped
            }
          }
          else -> value
        }

    walk(root)
    val out = if (changed) root.toJSONString() else params
    if (changed) {
      logger.info(
          "[CodBi][Mirror] trigger '{}' element references re-pointed at the mirrored prefix '{}': " +
              "{} -> {}",
          source.triggerName,
          prefix,
          params.take(400),
          out.take(400))
    }
    return out
  }

  /**
   * `<prefix>`-ed form of [name], prefixing only the segments that are mirrored (subtree) tokens.
   *
   * A segment (or the whole name) is only prefixed when the reflecting form really contains the
   * namespaced name; if it only contains the plain name, the plain name is kept — that is what the
   * rendered form submits (e.g. `XButtonList` button entries keep their source name).
   */
  private fun mirroredNameOf(
      name: String,
      tokens: Set<String>,
      prefix: String,
      targetNames: Set<String>,
  ): String? {
    if (name.startsWith(prefix)) return null

    fun mapped(segment: String): String? {
      if (segment !in tokens) return null
      val namespaced = "$prefix$segment"
      return when {
        targetNames.isEmpty() -> namespaced
        namespaced in targetNames -> namespaced
        segment in targetNames -> null
        else -> namespaced
      }
    }

    mapped(name)?.let {
      return it
    }
    if (!name.contains('.')) return null
    var any = false
    val segments =
        name.split('.').map { segment ->
          val prefixed = mapped(segment)
          if (prefixed != null) {
            any = true
            prefixed
          } else {
            segment
          }
        }
    return if (any) segments.joinToString(".") else null
  }

  /**
   * Every technical name a trigger may reference inside the REFLECTING form: item names/ids plus
   * the entries of `XButtonList` `buttons` arrays (name/value).
   *
   * Empty when the form cannot be read — the caller then falls back to plain prefixing.
   */
  private fun reflectingFormNames(
      userContext: Any?,
      targetFormKey: String?,
      namePrefix: String? = null,
  ): Set<String> {
    if (userContext == null || targetFormKey.isNullOrBlank()) return emptySet()
    val root =
        runCatching { MirrorFormAccess.loadFormJson(userContext, targetFormKey) }.getOrNull()
            ?: return emptySet()
    val out = LinkedHashSet<String>()
    val prefix = namePrefix?.trim().orEmpty()

    fun add(value: Any?) {
      (value as? String)?.trim()?.takeIf { it.isNotEmpty() }?.let { out.add(it) }
    }

    fun collectItem(item: JSONObject?) {
      val props = item?.getJSONObject("properties") ?: return
      val itemName = props.getString("name").orEmpty()
      add(itemName)
      add(props.getString("id"))
      // BUTTON entries keep their SOURCE names everywhere (persisted copy AND rendered markup): a
      // submit is validated against the published form model, so namespacing them breaks the click.
      for (key in listOf("buttons", "buttonEntries")) {
        val buttons = props.getJSONArray(key) ?: continue
        for (index in 0 until buttons.size) {
          val button = buttons.getJSONObject(index) ?: continue
          add(button.getString("name"))
          add(button.getString("value"))
        }
      }
    }

    fun walk(items: JSONArray?) {
      if (items == null) return
      for (index in 0 until items.size) {
        val item = items.getJSONObject(index) ?: continue
        collectItem(item)
        walk(item.getJSONArray("items"))
      }
    }

    walk(root.getJSONArray("items"))
    logger.debug("[CodBi][Mirror] reflecting form '{}' names: {}", targetFormKey, out)
    return out
  }

  /** Deletes a marked reflecting path (its nodes, its trigger and the task itself). */
  private fun removePath(userContext: Any, taskId: Long): Boolean =
      try {
        val api = Class.forName("de.xima.fc.api.APIProvider")
        val userContextClass = Class.forName("de.xima.fc.user.UserContext")
        val transferable = Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity")
        val taskApi = api.getField("WORKFLOW_TASK_API").get(null)
        val nodeApi = api.getField("WORKFLOW_NODE_API").get(null)
        val triggerApi = api.getField("WORKFLOW_TRIGGER_API").get(null)
        val task =
            taskApi.javaClass
                .getMethod("getById", userContextClass, java.lang.Long::class.javaObjectType)
                .invoke(taskApi, userContext, taskId) ?: return false
        // Remember the owning process: removing a task leaves a gap in its @OrderColumn, so the
        // remaining tasks must be renumbered afterwards.
        val processId =
            runCatching {
                  val process = task.javaClass.getMethod("getProcess").invoke(task)
                  (process.javaClass.getMethod("getId").invoke(process) as? Number)?.toLong()
                }
                .getOrNull()
        val root = runCatching { task.javaClass.getMethod("getRootNode").invoke(task) }.getOrNull()
        if (root != null) {
          runCatching {
            nodeApi.javaClass
                .getMethod("delete", userContextClass, transferable)
                .invoke(nodeApi, userContext, root)
          }
        }
        val trigger =
            runCatching { task.javaClass.getMethod("getTrigger").invoke(task) }.getOrNull()
        if (trigger != null) {
          runCatching {
            triggerApi.javaClass
                .getMethod("delete", userContextClass, transferable)
                .invoke(triggerApi, userContext, trigger)
          }
        }
        taskApi.javaClass
            .getMethod("delete", userContextClass, transferable)
            .invoke(taskApi, userContext, task)
        MirrorDataRepair.renumberProcessTasks(userContext, processId)
        logger.info(
            "[CodBi][Mirror] removed reflecting path task={} (its trigger disappeared)", taskId)
        true
      } catch (x: Exception) {
        logger.warn(
            "[CodBi][Mirror] could not remove reflecting path task={}: {}", taskId, describe(x))
        logger.warn("[CodBi][Mirror] remove-path failure details", x)
        false
      }

  // endregion Target-side task handling

  // region Reflection helpers

  /** `getId()` of a persisted entity, or `null`. */
  private fun reflectId(target: Any?): Long? =
      (runCatching { target?.javaClass?.getMethod("getId")?.invoke(target) }.getOrNull() as? Number)
          ?.toLong()

  /**
   * `AEntityAPI.create(userContext, entity)` — the generic parameter erases to
   * `ITransferableEntity`.
   */
  private fun createEntity(api: Any, userContext: Any, entity: Any): Any =
      api.javaClass
          .getMethod(
              "create",
              Class.forName("de.xima.fc.user.UserContext"),
              Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity"))
          .invoke(api, userContext, entity)
          ?: throw IllegalStateException("create returned null for ${entity.javaClass.simpleName}")

  /** `AEntityAPI.update(userContext, entity)`. */
  private fun updateEntity(api: Any, userContext: Any, entity: Any) {
    api.javaClass
        .getMethod(
            "update",
            Class.forName("de.xima.fc.user.UserContext"),
            Class.forName("de.xima.fc.entities.interfaces.ITransferableEntity"))
        .invoke(api, userContext, entity)
  }

  /**
   * Creates one `WorkflowNode` through the node API and appends it to its parent's `@OrderColumn`.
   *
   * `setActive`/`setDescription` are optional (not every FORMCYCLE build exposes them); `name`,
   * `type`, `uuid` and `task` are required — the node API rejects a node without them.
   */
  private fun createNode(
      userContext: Any,
      nodeApi: Any,
      nodeClass: Class<*>,
      taskClass: Class<*>,
      task: Any,
      name: String,
      type: String,
      params: String?,
      parent: Any?,
      description: String?,
  ): Any {
    val node = nodeClass.getDeclaredConstructor().newInstance()
    nodeClass.getMethod("setName", String::class.java).invoke(node, name)
    nodeClass.getMethod("setType", String::class.java).invoke(node, type)
    runCatching { nodeClass.getMethod("setActive", Boolean::class.java).invoke(node, true) }
    nodeClass.getMethod("setUUIDObject", UUID::class.java).invoke(node, UUID.randomUUID())
    nodeClass.getMethod("setTask", taskClass).invoke(node, task)
    if (description != null) {
      runCatching {
        nodeClass.getMethod("setDescription", String::class.java).invoke(node, description)
      }
    }
    if (params != null) {
      nodeClass.getMethod("setCustomParameters", String::class.java).invoke(node, params)
    }
    if (parent != null) {
      nodeClass.getMethod("setParent", nodeClass).invoke(node, parent)
    }
    val saved =
        try {
          createEntity(nodeApi, userContext, node)
        } catch (x: Exception) {
          // The node API validates `customParameters` as a JSON object — log the payload so a
          // rejected insert is diagnosable instead of only reporting "null".
          logger.warn(
              "[CodBi][Mirror] creating node type='{}' name='{}' failed (params={})",
              type,
              name,
              params?.take(600))
          throw x
        }
    if (parent != null) {
      // CRITICAL: a node row with a NULL `parent_order_idx` makes `WorkflowNode.children`
      // unloadable ("null index column for collection") and breaks the designer for the whole form.
      WorkflowLaneMaterializer.ensureParentOrderIndex(userContext, saved, parent)
    }
    return saved
  }

  /**
   * Renders an exception together with its cause chain.
   *
   * A failed reflective call throws `InvocationTargetException`, whose own `message` is **null** —
   * the real cause (and its message) is only reachable through `cause`. Logging only `x.message`
   * therefore hides every detail of a failed API call.
   */
  private fun describe(x: Throwable): String =
      generateSequence(x) { it.cause }
          .take(5)
          .joinToString(" <- ") { "${it::class.java.name}: ${it.message}" }

  // endregion Reflection helpers
}
