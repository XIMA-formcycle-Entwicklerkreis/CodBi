package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror

import com.alibaba.fastjson.JSON
import com.alibaba.fastjson.JSONArray
import com.alibaba.fastjson.JSONObject
import com.google.gson.JsonObject
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
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
   * Per-target-project locks that serialize [syncTriggeredPaths] for the SAME reflecting project.
   *
   * FORMCYCLE renders several `applytriggerpaths` requests effectively at the same time (the widget
   * fires one per mirrored element on selection/re-sync). Each request opens its own transaction,
   * so without a lock two near-simultaneous calls for the same project can BOTH read an empty
   * `loadMarkedTasks` (neither sees the other's not-yet-committed tasks) and BOTH fall through to
   * "create fresh" — the "6 instead of 3" duplication. Serializing the read+create per project
   * makes the second call run AFTER the first has committed its paths, find them by marker, and
   * reuse them instead of creating duplicates.
   *
   * Concurrent calls for DIFFERENT reflecting projects stay independent (different lock objects).
   */
  private val projectLocks = ConcurrentHashMap<Long, Any>()

  /**
   * Reflecting tasks this JVM created/adopted very recently, keyed by
   * `<targetProjectId>|<sourceKey>`.
   *
   * [projectLocks] serializes the read+create per project, but the two `applytriggerpaths` requests
   * of one selection can still overlap: the second one opens its `EntityContext` (and therefore its
   * database read view) BEFORE the first one commits. Under a `REPEATABLE READ` database the second
   * read then never sees the rows the first just created and would create a second set — the "6
   * instead of 3" duplication. This cache is the in-JVM memory of what was just written, so the
   * second request adopts that task instead of creating another one. Entries are validated against
   * the task API before they are used, so a task deleted in the meantime is never resurrected.
   */
  private val recentlyOwned = ConcurrentHashMap<String, Long>()

  /**
   * Build marker of the trigger-reflection logic.
   *
   * Printed in the diagnostic log lines so a pasted log can be attributed to the running build (the
   * "namespaced trigger never fires" investigation needed several rounds of exactly that).
   */
  internal const val TRIGGER_SYNC_VERSION = "trigger-sync#18"

  /**
   * Fallback for `WorkflowTrigger.customParametersVersion` when the source trigger does not carry
   * one.
   *
   * That value selects the props deserializer (`WorkflowTriggerPropsFactory`). A freshly created
   * entity keeps FORMCYCLE's default `0.0.0`, which cannot read `customParameters` written by 8.5.3
   * — the trigger then looks perfect (active, right params, right search terms) but
   * `ITriggerHandler.isAppliesToEvent` never matches, so the reflected path silently never fires.
   */
  internal const val FORMCYCLE_PROPS_VERSION = "8.5.3"

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
      /**
       * `WorkflowTrigger.customParametersVersion` of the SOURCE trigger (e.g. `8.5.3`).
       *
       * The reflected trigger must carry the SAME value: `WorkflowTriggerPropsFactory` deserializes
       * `customParameters` "as of" that version, and a NULL/foreign version makes the props
       * unreadable, so `ITriggerHandler.isAppliesToEvent` never matches and the path silently never
       * fires — even though the row, the params and the search terms are perfect.
       */
      val paramsVersion: String? = null,
  )

  /**
   * One workflow path of the REFLECTING form that a Mirror widget created (the widget's internal
   * reference to what it created).
   *
   * The widget persists a JSON array of these on itself (`codbi_mirror_triggered_refs`) and sends
   * them back on every sync, so the server can recognize paths it created before — and reuse /
   * reconcile them instead of creating a duplicate — even when the marker scan of the current
   * version alone would miss them (e.g. right after the reflecting form was published into a new
   * workflow version).
   *
   * @param taskId the id of the `WorkflowTask` the widget created in the reflecting form.
   * @param source the SOURCE form key (`project-<id>`) the path reflects.
   * @param sourceTask the id of the SOURCE `WorkflowTask` that path mirrors.
   */
  data class OwnedRef(
      val taskId: Long,
      val source: String,
      val sourceTask: Long,
  )

  private fun ownedRefSourceKey(ref: OwnedRef): String = "${ref.source}#${ref.sourceTask}"

  /** Parses the widget-stored owned-reference JSON array. */
  private fun parseOwnedRefs(json: String?): List<OwnedRef> {
    val raw = json?.trim().orEmpty()
    if (raw.isEmpty() || raw == "[]" || raw == "null") return emptyList()
    return runCatching {
          JSON.parseArray(raw).mapNotNull { element ->
            val obj = element as? JSONObject ?: return@mapNotNull null
            val taskId = obj.getLong("taskId") ?: return@mapNotNull null
            val source = obj.getString("source")?.trim().orEmpty()
            val sourceTask = obj.getLong("sourceTask") ?: return@mapNotNull null
            if (source.isEmpty()) return@mapNotNull null
            OwnedRef(taskId, source, sourceTask)
          }
        }
        .getOrElse {
          logger.warn("[CodBi][Mirror] could not parse owned references: {}", raw.take(300))
          emptyList()
        }
  }

  /** The outcome of a triggered-paths sync: the note AND the authoritative owned references. */
  data class SyncResult(
      val note: String,
      val owned: List<OwnedRef>,
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
              "SELECT t.id, t.name, tr.type, tr.name, tr.customParameters, " +
                  "tr.customParametersVersion " +
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
                triggerParams = params,
                paramsVersion = cols.getOrNull(5)?.toString()?.takeIf { it.isNotBlank() }))
      }
      logger.debug(
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
          logger.debug(
              "[CodBi][Mirror] triggered paths: no match — trigger {}:{} params={}",
              cols[2]?.toString().orEmpty(),
              cols[3]?.toString().orEmpty(),
              cols[4]?.toString().orEmpty().take(300))
        }
        logger.debug("[CodBi][Mirror] triggered paths: looked for tokens {}", tokens)
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
   * The Mirror widget stores an internal reference ([OwnedRef]) to every path it created and passes
   * it back on each sync ([ownedRefsJson]). That reference is the primary existence check: before a
   * path is created, the task this widget already created for the same source path is reused and
   * reconciled (via [ensureMirrorNode]) — so re-selecting the widget, or re-saving/reloading after
   * a `publish()` into a new workflow version, updates the existing path instead of creating a
   * duplicate. Only when neither a recorded task nor a marked task exists is a fresh path created.
   *
   * @param targetFormKey the reflecting form (`project-<id>`) whose active workflow version
   *   receives the paths.
   * @param namePrefix the namespace prefix of the mirrored child items (`<mirrorName>_`), used to
   *   re-point the copied trigger at the mirrored element instead of the source element.
   * @param ownedRefsJson the widget-stored JSON array of the paths it owns (see [OwnedRef]).
   * @return the sync [SyncResult] with the change note and the authoritative owned references,
   *   which the caller persists back on the widget.
   */
  fun syncTriggeredPaths(
      userContext: Any?,
      sourceFormKey: String?,
      elementRef: String?,
      elementKey: String?,
      targetFormKey: String?,
      namePrefix: String?,
      ownedRefsJson: String? = null,
  ): SyncResult {
    if (userContext == null) return SyncResult("SKIPPED:no-userContext", emptyList())
    if (sourceFormKey.isNullOrBlank() || targetFormKey.isNullOrBlank()) {
      return SyncResult("SKIPPED:invalid-form", emptyList())
    }
    val tokens = elementTokens(userContext, sourceFormKey, elementRef, elementKey)
    // Names that actually exist in the REFLECTING form (item names/ids and XButtonList button
    // entries). The trigger remap only re-points a reference when the namespaced form really exists
    // there — this is what keeps the reflected trigger in sync with the names the mirror copy AND
    // the live render register (both use `<mirrorName>_`).
    val targetNames = reflectingFormNames(userContext, targetFormKey, namePrefix)
    // References a copied trigger may carry, resolved through the mirror COPIES themselves: an
    // element NAME maps to the copy's namespaced name and an element ID to the copy's ID. Plus the
    // source form's id -> name map, so an ID reference whose copy does not exist yet (a widget
    // added
    // to the source a moment ago) still becomes `<prefix><name>` instead of the useless
    // `<prefix><id>`.
    val mirroredRefs =
        MirrorFormAccess.mirroredElementReferenceMap(userContext, sourceFormKey, targetFormKey)
    val sourceNamesById = MirrorFormAccess.elementNamesById(userContext, sourceFormKey)
    val triggered = findTriggeredPaths(userContext, sourceFormKey, elementRef, elementKey)
    val prefix = namePrefix?.trim().orEmpty()
    // Diagnostic: a trigger reference only fires when the name it names EXISTS in the reflecting
    // form. This shows, for every mirrored element name, whether it is present plain or namespaced.
    logger.debug(
        "[CodBi][Mirror] trigger matching: tokens={} presentPlain={} presentNamespaced={} " +
            "({} names in the reflecting form)",
        tokens,
        tokens.filter { it in targetNames },
        tokens.filter { "$prefix$it" in targetNames },
        targetNames.size)
    val targetVersionId =
        WorkflowMirrorAccess.activeVersionId(userContext, targetFormKey)
            ?: return SyncResult("SKIPPED:no-target-version", emptyList())
    val targetProjectId = MirrorFormAccess.resolveProjectId(userContext, targetFormKey)
    // Serialize this read+create+commit with any OTHER sync of the same reflecting project. See
    // [projectLocks]: without it two concurrent `applytriggerpaths` would both read no existing
    // path
    // (neither sees the other's uncommitted tasks) and both create fresh ones.
    val lock = projectLocks.computeIfAbsent(targetProjectId ?: 0L) { Any() }
    return synchronized(lock) {
      val em =
          WorkflowMirrorAccess.entityManager(userContext)
              ?: return SyncResult("SKIPPED:no-entity-manager", emptyList())
      val existing =
          try {
            // Version-agnostic lookup: the reflecting form's workflow may have been published into
            // a
            // NEW version since the paths were created (the client saves the form after every
            // sync),
            // which leaves the tasks in an OLDER version. Querying by the ACTIVE version alone
            // would
            // then find nothing and this sync would recreate them as duplicates. Searching the
            // whole
            // PROJECT (every version) finds the paths this feature created no matter which version
            // is
            // active, so they are reused instead of recreated.
            loadExistingPaths(em, targetProjectId)
          } finally {
            WorkflowMirrorAccess.closeQuietly(em)
          }
      val wanted = triggered.associateBy { sourceKeyOf(sourceFormKey, it.taskId) }
      // The widget's own recorded tasks, keyed by their source (source form + source task).
      val ownedBySourceKey =
          parseOwnedRefs(ownedRefsJson)
              .filter { it.source == sourceFormKey }
              .associateBy { ownedRefSourceKey(it) }
      var created = 0
      var updated = 0
      var removed = 0
      // The authoritative owned references to hand back to the widget after the sync.
      val resultOwned = LinkedHashMap<String, OwnedRef>()
      // 1. Create/update the paths that are triggered right now.
      for ((key, path) in wanted) {
        val marker = markerOf(key)
        val candidates = existing.taskIdsOf(key)
        // 1a. Reuse the path this widget ALREADY created for this source path — in this preference
        //     order:
        //     (1) the task the widget itself reports (its own reference is authoritative),
        //     (2) any path that structurally mirrors this source path (a `Mirror` node whose
        //         `sourceForm`/`pathId` params point at it) — this is the description-independent
        //         ownership proof, and it is what makes the sync idempotent on a FORMCYCLE build
        // whose
        //         `WorkflowTask.description` does not survive the create,
        //     (3) a path created by a concurrent request of the SAME selection (see
        //         [recentlyOwned]).
        val reuse =
            candidates.firstOrNull { it == ownedBySourceKey[key]?.taskId }
                ?: candidates.firstOrNull { taskId ->
                  existing.tasks[taskId]?.let {
                    belongsToElement(it, tokens, prefix) || belongsToNamespace(it, prefix)
                  } == true
                }
                ?: candidates.firstOrNull()
                ?: cachedOwnedTaskId(userContext, targetProjectId, key)
        if (reuse != null) {
          val repaired =
              ensureMirrorNode(
                  userContext,
                  reuse,
                  sourceFormKey,
                  path,
                  tokens,
                  namePrefix,
                  targetNames,
                  mirroredRefs,
                  sourceNamesById)
          if (repaired) updated++
          resultOwned[key] = OwnedRef(reuse, sourceFormKey, path.taskId)
          rememberOwned(targetProjectId, key, reuse)
          logger.debug(
              "[CodBi][Mirror] reusing reflecting path task={} for source path {} of '{}'",
              reuse,
              path.taskId,
              sourceFormKey)
          // Self-healing: earlier builds created one path per sync, so a form can hold SEVERAL
          // reflecting paths for the same source path (3 → 6 → 9 …). Keep exactly one of them and
          // delete the duplicates, so re-selecting the widget heals the form instead of growing it.
          // Only paths that reference THIS element are collapsed: a path that another Mirror widget
          // created for the same source path (a different mirrored element, or a different mirror
          // name)
          // must stay untouched.
          for (duplicate in
              candidates.filter { candidate ->
                candidate != reuse &&
                    (candidate == ownedBySourceKey[key]?.taskId ||
                        existing.tasks[candidate]?.let {
                          belongsToElement(it, tokens, prefix) || belongsToNamespace(it, prefix)
                        } == true)
              }) {
            if (removePath(userContext, duplicate)) {
              removed++
              logger.debug(
                  "[CodBi][Mirror] removed duplicate reflecting path task={} (source path {} of '{}')",
                  duplicate,
                  path.taskId,
                  sourceFormKey)
            }
          }
          continue
        }
        // 1b. Not present → create a fresh reflecting path and record the new task.
        val newTaskId =
            createPath(
                userContext,
                targetVersionId,
                marker,
                sourceFormKey,
                path,
                namePrefix,
                tokens,
                targetNames,
                mirroredRefs,
                sourceNamesById)
        if (newTaskId != null) {
          created++
          resultOwned[key] = OwnedRef(newTaskId, sourceFormKey, path.taskId)
          rememberOwned(targetProjectId, key, newTaskId)
        }
      }
      // 2. Remove the paths this feature owns whose trigger disappeared.
      //
      // The ownership scope matters: [existing] covers EVERY reflecting path of the target PROJECT,
      // so
      // a path that belongs to another Mirror widget (another source form, or another mirrored
      // element
      // of the same source form) must never be touched here. Only paths of THIS source form are
      // considered, and of those only the ones that either reference THIS element's mirrored names
      // (their trigger was re-pointed at `<prefix><elementToken>`) or whose source path no longer
      // exists at all.
      val liveSourceTasks: Set<Long> by lazy { sourceTaskIds(userContext, sourceFormKey) }
      for ((key, taskIds) in existing.bySourceKey) {
        if (key in wanted) continue
        if (!key.startsWith("$sourceFormKey#")) continue
        val sourceTaskId = key.substringAfterLast('#').toLongOrNull()
        val sourceGone = sourceTaskId != null && sourceTaskId !in liveSourceTasks
        for (taskId in taskIds) {
          val task = existing.tasks[taskId]
          // Attribution, in order of reliability:
          // 1. the path's trigger references THIS widget's namespace (`<mirrorName>_…`) — the
          // strongest
          //    signal, because the reflected trigger re-points EVERY element reference at that
          //    namespace, so it survives the element (e.g. the button) being DELETED in the source
          // —
          //    which is exactly the case the token match below cannot see, leaving a stale path
          // behind
          //    forever;
          // 2. the path's trigger references one of the element's current mirrored names (legacy
          //    copies whose trigger was never re-pointed).
          val belongsHere =
              task != null &&
                  (belongsToNamespace(task, prefix) || belongsToElement(task, tokens, prefix))
          if (!belongsHere && !sourceGone) {
            logger.debug(
                "[CodBi][Mirror] keeping reflecting path task={} ('{}'): its source path still exists " +
                    "and it does not reference this element",
                taskId,
                key)
            continue
          }
          if (removePath(userContext, taskId)) {
            removed++
            forgetOwned(targetProjectId, key)
          }
        }
      }
      // Save the version ONLY when this sync actually changed something. FORMCYCLE caches the
      // workflow
      // model per version (locked by the version's lock version), and a stale cache silently
      // ignores a
      // trigger this plugin created — so when a path was created/updated/removed the version is
      // saved
      // through the entity API to bump the lock version and drop the cache. When nothing changed
      // there
      // is nothing to teach FORMCYCLE, so the (expensive, lock-version-bumping) save is skipped.
      val note = "created=$created updated=$updated removed=$removed"
      if (created > 0 || updated > 0 || removed > 0) {
        WorkflowLaneMaterializer.refreshWorkflowModel(userContext, targetVersionId)
      }
      logger.debug(
          "[CodBi][Mirror] [{}] triggered paths for '{}' -> '{}': {} owned={}",
          TRIGGER_SYNC_VERSION,
          sourceFormKey,
          targetFormKey,
          note,
          resultOwned.values.map { it.taskId })
      SyncResult(note, resultOwned.values.toList())
    }
  }

  /**
   * Ensures the opt-in triggered workflow paths exist in EVERY reflecting form that mirrors
   * [sourceProjectId] — the server-side counterpart of the designer's `applytriggerpaths`.
   *
   * Without this, a workflow path that a user attaches to a button they just ADDED to the mirrored
   * source container only reaches the reflecting form when that form is opened in the designer
   * again, because that is the only place the sync used to run. The reflecting form does NOT have
   * to be edited for the button itself — the live Mirror renders the source container and registers
   * the namespaced button key — so creating the path is all that is missing, and the button a user
   * clicks in the published reflecting form then runs the workflow.
   *
   * Reflecting forms are found through the `Mirror` nodes they already contain
   * ([WorkflowMirrorAccess.discoverForSourceProject]; a reflecting form that has never created a
   * path has no such node and is left to the designer). Their widget properties (mirrored element,
   * name prefix, opt-in flag, owned references) are read from the SAVED form JSON via
   * [MirrorFormAccess.mirrorWidgets].
   *
   * @return a human-readable summary for the caller's log.
   */
  fun ensureTriggeredPathsForSourceProject(userContext: Any?, sourceProjectId: Long): String {
    if (userContext == null || sourceProjectId <= 0L) return "SKIPPED:invalid-source"
    val sourceFormKey = MirrorFormAccess.formKey(sourceProjectId)
    val targetProjectIds =
        WorkflowMirrorAccess.discoverForSourceProject(userContext, sourceProjectId)
            .reflectors
            .mapNotNull { it.descriptor.reflectingProjectId }
            .distinct()
    if (targetProjectIds.isEmpty()) {
      logger.debug(
          "[CodBi][Mirror] triggered paths: no reflecting form mirrors '{}' yet — nothing to create",
          sourceFormKey)
      return "SKIPPED:no-reflecting-form"
    }
    val notes = ArrayList<String>()
    for (targetProjectId in targetProjectIds) {
      val targetFormKey = MirrorFormAccess.formKey(targetProjectId)
      for (widget in MirrorFormAccess.mirrorWidgets(userContext, targetFormKey, sourceFormKey)) {
        if (!widget.createTriggeredPaths) continue
        val result =
            try {
              syncTriggeredPaths(
                  userContext,
                  sourceFormKey,
                  widget.elementRef,
                  widget.elementKey,
                  targetFormKey,
                  widget.namePrefix,
                  widget.ownedRefsJson)
            } catch (x: Exception) {
              logger.warn(
                  "[CodBi][Mirror] triggered paths '{}' -> '{}' (widget '{}') failed: {}",
                  sourceFormKey,
                  targetFormKey,
                  widget.name,
                  describe(x))
              continue
            }
        notes.add("$targetFormKey/${widget.name}: ${result.note}")
      }
    }
    if (notes.isEmpty()) {
      logger.debug(
          "[CodBi][Mirror] triggered paths: no Mirror widget of '{}' has the opt-in enabled",
          sourceFormKey)
      return "SKIPPED:no-opt-in"
    }
    val summary = notes.joinToString(" | ")
    logger.debug(
        "[CodBi][Mirror] triggered paths after the source save of '{}': {}", sourceFormKey, summary)
    return summary
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
      /**
       * `customParameters` of the path's trigger (may be blank). Used to attribute a path to the
       * mirrored ELEMENT it was created for: the trigger was re-pointed at
       * `<prefix><elementToken>`, so the namespaced names in its params identify the Mirror widget
       * that owns the path.
       */
      val triggerParams: String = "",
  )

  /**
   * The reflecting paths that already exist for a project, recognized WITHOUT relying on
   * `WorkflowTask.description`.
   *
   * The description marker ([MARKER]) was the only ownership proof in earlier builds, and it is not
   * reliable across FORMCYCLE versions: when the description does not survive the entity create (or
   * its column/encoding is not comparable), the marker scan finds nothing on every sync and the
   * feature re-creates the very paths that already exist — "3 paths become 6, then 9, …", once per
   * re-selection, on 8.5.5 while 8.5.3 looked fine.
   *
   * The authoritative, version-independent proof is the `Mirror` NODE the feature creates inside
   * each path: its `customParameters` carry `sourceForm` + `pathId` (the source path it mirrors)
   * and its task id is the reflecting path. Those params are exactly what the auto-sync relies on
   * ([WorkflowMirrorAccess.discover]), so they demonstrably persist on every supported build. The
   * description marker is still read as an ADDITIONAL signal (and is re-written when it is missing,
   * see [ensureMirrorNode]), but it is no longer required.
   */
  private data class ExistingPaths(
      /** `"<sourceFormKey>#<sourceTaskId>"` -> ascending task ids of the reflecting paths. */
      val bySourceKey: Map<String, List<Long>>,
      /** Every reflecting task recognized as owned, by task id. */
      val tasks: Map<Long, MarkedTask>,
  ) {
    /** Task ids that reflect [sourceKey] (never `null`). */
    fun taskIdsOf(sourceKey: String): List<Long> = bySourceKey[sourceKey].orEmpty()
  }

  /** Key that identifies one SOURCE path inside a reflecting project (mirrors [OwnedRef]). */
  internal fun sourceKeyOf(sourceFormKey: String, sourceTaskId: Long): String =
      "$sourceFormKey#$sourceTaskId"

  private fun markerOf(sourceKey: String): String = "$MARKER source=$sourceKey"

  /** The `source=<formKey>#<taskId>` key stored in a task description, or `null`. */
  internal fun sourceKeyOfMarker(description: String): String? {
    val at = description.indexOf(MARKER)
    if (at < 0) return null
    val match =
        Regex("source=(\\S+)").find(description.substring(at + MARKER.length)) ?: return null
    return match.groupValues[1].takeIf { it.contains('#') }
  }

  /**
   * The source key a persisted `Mirror` node mirrors, read from its `customParameters`, or `null`.
   */
  internal fun mirrorSourceKeyOf(paramsJson: String): String? {
    if (paramsJson.isBlank()) return null
    val obj = runCatching { JSON.parseObject(paramsJson) }.getOrNull() ?: return null
    val source = obj.getString("sourceForm")?.trim().orEmpty()
    val pathId = obj.getString("pathId")?.trim()?.toLongOrNull() ?: return null
    if (source.isEmpty() || pathId <= 0L) return null
    return sourceKeyOf(source, pathId)
  }

  /**
   * All reflecting paths this feature owns in [projectId], across EVERY workflow version of the
   * reflecting project.
   *
   * Searching by project (not by one specific active version) is what makes the reuse idempotent
   * under version churn: the client publishes the reflecting form after almost every sync, and
   * publishing can make a NEW workflow version active while the paths this widget created live in
   * an older version. A per-active-version query would then return nothing and immediately recreate
   * the very paths that still exist.
   *
   * The description marker is filtered in Kotlin (not with `LIKE`): `[` is a character-class
   * introducer in some SQL dialects and a plain literal in others, so a marker `LIKE` pattern means
   * different things on different servers — a silent source of exactly this "already exists but is
   * not found" behavior.
   */
  private fun loadExistingPaths(em: Any?, projectId: Long?): ExistingPaths {
    if (projectId == null) return ExistingPaths(emptyMap(), emptyMap())
    // Every workflow version of the reflecting project.
    //
    // NOTE: the entity model differs between FORMCYCLE servers — `WorkflowVersion.project` /
    // `WorkflowVersion.active` do NOT exist on 8.5.3 (Hibernate: "could not resolve property:
    // project
    // of: de.xima.fc.entities.WorkflowVersion"). The navigation that IS stable across versions is
    // `Projekt.workflowVersions` (from the Projekt entity to its version collection), the same path
    // AIWorkflowAssistant uses to reach form elements of a project. So the versions are enumerated
    // FROM the Projekt row, never by filtering WorkflowVersion on a project/active attribute.
    val versionIds =
        WorkflowMirrorAccess.query(
                em,
                "SELECT wv.id FROM de.xima.fc.entities.Projekt p " +
                    "JOIN p.workflowVersions wv WHERE p.id = :pid",
                mapOf("pid" to projectId))
            .mapNotNull { (it as? Number)?.toLong() }
            .distinct()
    // Fallback: if the whole-project enumeration returned nothing (e.g. the `workflowVersions`
    // collection is not present in this FORMCYCLE build), at least scope to the ACTIVE version —
    // read
    // via `Projekt.activeWorkflowVersion`, the query the active-version resolver already uses
    // successfully — so previously created paths are still found and reused instead of recreated.
    val scoped =
        if (versionIds.isEmpty()) {
          WorkflowMirrorAccess.query(
                  em,
                  "SELECT p.activeWorkflowVersion.id FROM de.xima.fc.entities.Projekt p " +
                      "WHERE p.id = :pid",
                  mapOf("pid" to projectId))
              .mapNotNull { (it as? Number)?.toLong() }
              .distinct()
              .ifEmpty { versionIds }
        } else {
          versionIds
        }
    val tasks = LinkedHashMap<Long, MarkedTask>()
    val bySourceKey = LinkedHashMap<String, MutableList<Long>>()
    fun attribute(key: String, taskId: Long) {
      val ids = bySourceKey.getOrPut(key) { ArrayList() }
      if (taskId !in ids) ids.add(taskId)
    }
    for (vid in scoped) {
      // 1. Every task of the version (+ its trigger params, used to attribute a path to an
      // element).
      val taskRows =
          WorkflowMirrorAccess.query(
              em,
              "SELECT t.id, t.name, t.description, tr.customParameters " +
                  "FROM de.xima.fc.entities.WorkflowTask t LEFT JOIN t.trigger tr " +
                  "JOIN t.process p JOIN p.version v WHERE v.id = :vid",
              mapOf("vid" to vid))
      for (row in taskRows) {
        val cols = row as? Array<*> ?: continue
        val id = (cols[0] as? Number)?.toLong() ?: continue
        val description = cols[2]?.toString().orEmpty()
        tasks.putIfAbsent(
            id,
            MarkedTask(
                taskId = id,
                name = cols[1]?.toString().orEmpty(),
                description = description,
                triggerParams = cols.getOrNull(3)?.toString().orEmpty()))
        // Legacy signal: the marker in the description names the source path.
        sourceKeyOfMarker(description)?.let { attribute(it, id) }
      }
      // 2. Every `Mirror` node of the version: the path it lives in mirrors the source path named
      // by
      //    its params. This is the structural ownership proof (independent of any description).
      val nodeRows =
          WorkflowMirrorAccess.query(
              em,
              "SELECT n.type, n.customParameters, t.id FROM de.xima.fc.entities.WorkflowNode n " +
                  "JOIN n.task t JOIN t.process p JOIN p.version v " +
                  "WHERE v.id = :vid AND n.type = :type",
              mapOf("vid" to vid, "type" to MIRROR_NODE_TYPE))
      for (row in nodeRows) {
        val cols = row as? Array<*> ?: continue
        if (cols.size < 3) continue
        if (cols[0]?.toString() != MIRROR_NODE_TYPE) continue
        val taskId = (cols[2] as? Number)?.toLong() ?: continue
        val key = mirrorSourceKeyOf(cols[1]?.toString().orEmpty()) ?: continue
        attribute(key, taskId)
      }
    }
    // Only the tasks that could be attributed to a source path are OURS — every other task of those
    // versions belongs to the user and must stay invisible to this feature.
    val owned = LinkedHashMap<Long, MarkedTask>()
    val stable = LinkedHashMap<String, List<Long>>()
    for ((key, ids) in bySourceKey) {
      val sorted = ids.sorted()
      stable[key] = sorted
      for (id in sorted) tasks[id]?.let { owned[id] = it }
    }
    logger.debug(
        "[CodBi][Mirror] existing reflecting paths of project {}: {} path(s) for {} source path(s) " +
            "across {} version(s) ({})",
        projectId,
        owned.size,
        stable.size,
        scoped.size,
        stable.keys.joinToString(", "))
    return ExistingPaths(stable, owned)
  }

  /**
   * Whether [task] is a reflecting path of the mirrored element identified by [tokens]/[prefix]:
   * its trigger names the mirrored copies (`<prefix><sourceName>`), which is what
   * [remapTriggerParams] wrote when the path was created.
   */
  private fun belongsToElement(task: MarkedTask, tokens: Set<String>, prefix: String): Boolean {
    if (tokens.isEmpty()) return false
    val params = task.triggerParams
    if (params.isBlank()) return false
    // The namespaced form is what [remapTriggerParams] writes; the PLAIN form is checked as well,
    // because the remap keeps a reference plain when the reflecting form only has the plain name
    // (and
    // a path created before the child items were materialized carries plain references only).
    val wanted = if (prefix.isEmpty()) tokens else tokens.flatMap { listOf("$prefix$it", it) }
    return referencesAnyToken(params, wanted.toSet())
  }

  /**
   * Whether the reflecting path was created by the Mirror widget whose namespace is [prefix].
   *
   * [remapTriggerParams] re-points EVERY mirrored element reference of the copied trigger at
   * `<prefix><name>` — a button key, an item id, a nested `button.name`/`button.qualifier`. So the
   * mere PRESENCE of a quoted value starting with the prefix proves the path belongs to that
   * widget, and it keeps proving it after the referenced element (e.g. a button) was DELETED in the
   * source form. That is what [belongsToElement] cannot do: it matches the element's CURRENT names,
   * so a path whose button disappeared would look like "someone else's" and was never removed.
   *
   * Two Mirror widgets of the same form cannot share a name (technical names are unique per form),
   * so the prefix also separates two widgets that mirror different elements of the same source
   * form.
   */
  private fun belongsToNamespace(task: MarkedTask, prefix: String): Boolean {
    if (prefix.isEmpty()) return false
    val params = task.triggerParams
    if (params.isBlank()) return false
    return params.contains("\"$prefix")
  }

  /** Ids of the SOURCE form's workflow paths in its ACTIVE version (empty when unreadable). */
  private fun sourceTaskIds(userContext: Any?, sourceFormKey: String): Set<Long> {
    val versionId =
        WorkflowMirrorAccess.activeVersionId(userContext, sourceFormKey) ?: return emptySet()
    val em = WorkflowMirrorAccess.entityManager(userContext) ?: return emptySet()
    return try {
      WorkflowMirrorAccess.query(
              em,
              "SELECT t.id FROM de.xima.fc.entities.WorkflowTask t " +
                  "JOIN t.process p JOIN p.version v WHERE v.id = :vid",
              mapOf("vid" to versionId))
          .mapNotNull { (it as? Number)?.toLong() }
          .toSet()
    } catch (x: Exception) {
      logger.warn(
          "[CodBi][Mirror] could not list the source paths of '{}': {}", sourceFormKey, x.message)
      emptySet()
    } finally {
      WorkflowMirrorAccess.closeQuietly(em)
    }
  }

  // region Recently created tasks (cross-request duplicate guard)

  private fun ownedCacheKey(targetProjectId: Long?, sourceKey: String): String =
      "${targetProjectId ?: 0}#$sourceKey"

  /** Remembers that [taskId] reflects [sourceKey] in [targetProjectId]. */
  private fun rememberOwned(targetProjectId: Long?, sourceKey: String, taskId: Long) {
    if (targetProjectId == null || taskId <= 0L) return
    // Bounded: the cache only has to survive the sibling request of the same selection.
    if (recentlyOwned.size > 512) recentlyOwned.clear()
    recentlyOwned[ownedCacheKey(targetProjectId, sourceKey)] = taskId
  }

  private fun forgetOwned(targetProjectId: Long?, sourceKey: String) {
    if (targetProjectId == null) return
    recentlyOwned.remove(ownedCacheKey(targetProjectId, sourceKey))
  }

  /**
   * The task a sibling request of the SAME selection created for [sourceKey], when it is still
   * there.
   *
   * This closes the last duplication window: two `applytriggerpaths` requests can overlap, and the
   * second one may have opened its database read view before the first committed. The cache reports
   * that task; [taskExists] validates it, so a deleted task is never reused.
   */
  private fun cachedOwnedTaskId(
      userContext: Any,
      targetProjectId: Long?,
      sourceKey: String
  ): Long? {
    if (targetProjectId == null) return null
    val cached = recentlyOwned[ownedCacheKey(targetProjectId, sourceKey)] ?: return null
    if (taskExists(userContext, cached)) return cached
    forgetOwned(targetProjectId, sourceKey)
    return null
  }

  /** Whether the `WorkflowTask` [taskId] still exists (via the task API). */
  private fun taskExists(userContext: Any, taskId: Long): Boolean =
      runCatching {
            val api = Class.forName("de.xima.fc.api.APIProvider")
            val taskApi = api.getField("WORKFLOW_TASK_API").get(null)
            taskApi.javaClass
                .getMethod(
                    "getById",
                    Class.forName("de.xima.fc.user.UserContext"),
                    java.lang.Long::class.javaObjectType)
                .invoke(taskApi, userContext, taskId) != null
          }
          .getOrDefault(false)

  // endregion Recently created tasks (cross-request duplicate guard)

  /**
   * Creates a new workflow path (task + root SEQUENCE + `Mirror` node + trigger) in the reflecting
   * version. Returns the id of the created task, or `null` when the path could not be created.
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
      mirroredRefs: Map<String, String> = emptyMap(),
      sourceNamesById: Map<String, String> = emptyMap(),
  ): Long? =
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
        logger.debug(
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
        logger.debug("[CodBi][Mirror] create-path 2/5: root node id={}", reflectId(savedRoot))

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
        logger.debug("[CodBi][Mirror] create-path 3/5: Mirror node id={}", reflectId(mirrorNode))

        // 3b. TEMPORARY endpoint AFTER the Mirror node: without a terminal node FORMCYCLE reports
        //     the new path as invalid. It is replaced by the reflected lane on the first sync — as
        // an
        //     extra lane child it already forces the structural rebuild, which deletes it.
        val placeholder =
            createPlaceholderEndpoint(
                userContext, nodeApi, nodeClass, taskClass, savedTask, savedRoot)
        logger.debug(
            "[CodBi][Mirror] create-path 3b/5: temporary endpoint id={} ({})",
            reflectId(placeholder),
            PLACEHOLDER_ENDPOINT_TYPE)

        // 4. Trigger, re-pointed at the MIRRORED element names — INCLUDING the search terms the
        //    event engine filters candidate triggers by, otherwise the path can never fire.
        val trigger = triggerClass.getDeclaredConstructor().newInstance()
        triggerClass.getMethod("setType", String::class.java).invoke(trigger, source.triggerType)
        triggerClass.getMethod("setName", String::class.java).invoke(trigger, source.triggerName)
        triggerClass.getMethod("setActive", Boolean::class.java).invoke(trigger, true)
        triggerClass.getMethod("setUUIDObject", UUID::class.java).invoke(trigger, UUID.randomUUID())
        triggerClass.getMethod("setTask", taskClass).invoke(trigger, savedTask)
        // The SOURCE trigger's params version must be carried over — see SourcePath.paramsVersion.
        // Without it the entity keeps its `0.0.0` default and the props cannot be deserialized.
        triggerClass
            .getMethod("setCustomParametersVersion", String::class.java)
            .invoke(trigger, source.paramsVersion ?: FORMCYCLE_PROPS_VERSION)
        val reflectedParams =
            triggerParamsOf(source, tokens, namePrefix, targetNames, mirroredRefs, sourceNamesById)
        triggerClass
            .getMethod("setCustomParameters", String::class.java)
            .invoke(trigger, reflectedParams)
        val savedTrigger = createEntity(triggerApi, userContext, trigger)
        // FORMCYCLE's own save path also derives the trigger's name/description and its SEARCH
        // TERMS
        // from the params — without that transfer the trigger is invisible to the event engine.
        ensureTriggerDataModel(userContext, reflectId(savedTrigger) ?: 0L)
        logger.debug(
            "[CodBi][Mirror] create-path 4/5: trigger id={} '{}:{}'",
            reflectId(savedTrigger),
            source.triggerType,
            source.triggerName)

        // 5. Link the now-persisted trigger + root node back on the task.
        taskClass.getMethod("setTrigger", triggerClass).invoke(savedTask, savedTrigger)
        taskClass.getMethod("setRootNode", nodeClass).invoke(savedTask, savedRoot)
        updateEntity(taskApi, userContext, savedTask)
        logger.debug("[CodBi][Mirror] create-path 5/5: task {} linked to trigger + root", taskId)

        // CRITICAL: a task row with a NULL `proc_order_idx` makes `WorkflowProcess.tasks`
        // unloadable
        // ("null index column for collection"). Repaired LAST, in its own EntityContext.
        MirrorDataRepair.renumberProcessTasks(userContext, mainProcessId)

        logger.debug(
            "[CodBi][Mirror] created reflecting path '{}' (task={}, root={}, trigger={}, mirror={}) " +
                "for source path {} of '{}'",
            source.taskName,
            taskId,
            reflectId(savedRoot),
            reflectId(savedTrigger),
            reflectId(mirrorNode),
            source.taskId,
            sourceFormKey)
        taskId
      } catch (x: Exception) {
        logger.warn(
            "[CodBi][Mirror] could not create the reflecting path for source path {} of '{}': {}",
            source.taskId,
            sourceFormKey,
            describe(x))
        logger.warn("[CodBi][Mirror] create-path failure details", x)
        null
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
      mirroredRefs: Map<String, String> = emptyMap(),
      sourceNamesById: Map<String, String> = emptyMap(),
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
      // Heal the ownership marker. The path is recognized STRUCTURALLY (the `Mirror` node inside it
      // names the source path), so a task whose description lost the marker — or never carried it
      // because the FORMCYCLE build does not persist it — is adopted here and stamped again. This
      // is
      // not counted as a "repair": the path itself is fine, so no designer reload is needed.
      val expectedMarker = markerOf(sourceKeyOf(sourceFormKey, source.taskId))
      val currentDescription =
          runCatching { task.javaClass.getMethod("getDescription").invoke(task) as? String }
              .getOrNull()
              .orEmpty()
      if (!currentDescription.contains(expectedMarker)) {
        runCatching {
              task.javaClass
                  .getMethod("setDescription", String::class.java)
                  .invoke(task, expectedMarker)
              updateEntity(taskApi, userContext, task)
              logger.debug(
                  "[CodBi][Mirror] ensureMirrorNode: re-stamped the ownership marker on task {} " +
                      "(was '{}')",
                  taskId,
                  currentDescription.take(120))
            }
            .onFailure {
              logger.debug(
                  "[CodBi][Mirror] ensureMirrorNode: could not re-stamp task {}: {}",
                  taskId,
                  it.message)
            }
      }
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
        logger.debug(
            "[CodBi][Mirror] ensureMirrorNode: relinked root node id={} on task {}",
            reflectId(root),
            taskId)
      }
      val parent = root ?: throw IllegalStateException("no root node for task $taskId")
      // 2. Trigger — recreated when missing, RE-POINTED when its params still name SOURCE elements.
      //    A trigger that references a name the reflecting form does not have never fires: the
      // click
      //    then falls through to the default "submitted successfully" page.
      val expectedTriggerParams =
          triggerParamsOf(source, tokens, namePrefix, targetNames, mirroredRefs, sourceNamesById)
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
        ensureTriggerDataModel(userContext, reflectId(savedTrigger) ?: 0L)
        taskClass.getMethod("setTrigger", triggerClass).invoke(task, savedTrigger)
        updateEntity(taskApi, userContext, task)
        repaired = true
        logger.debug(
            "[CodBi][Mirror] ensureMirrorNode: recreated the missing trigger id={} on task {}",
            reflectId(savedTrigger),
            taskId)
      } else if (syncTriggerParams(
          userContext,
          triggerApi,
          existingTrigger,
          expectedTriggerParams,
          source.triggerType,
          source.paramsVersion)) {
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
        logger.debug(
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
          logger.debug(
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
   * The `WorkflowTriggerSearchTerm` keys FORMCYCLE's submit-button trigger handlers filter by.
   *
   * The event engine does **not** scan every trigger of a workflow version: `EventTaskLocator
   * .findCandidates` runs `IWorkflowTriggerDao.getForActiveVersionBy(ctx, project, criterion)`
   * whose criterion the trigger HANDLER builds from the event (`IWorkflowTriggerHandler
   * .getFilterCriteriaForEvent`). For a submit button that criterion matches the trigger's SEARCH
   * TERMS (`buttonName` / `buttonQualifier`, see `FcQualifiedFormSubmitButtonProps`).
   *
   * A trigger written straight into the entity tables — like the reflected one — therefore has NO
   * search terms and is never a CANDIDATE: the click is accepted, the form record is saved, and no
   * workflow path runs at all (the designer save is what normally creates these rows).
   */
  private val TRIGGER_SEARCH_TERM_KEYS =
      mapOf(
          "FC_FORM_SUBMIT_BUTTON" to listOf("buttonName"),
          "FC_QUALIFIED_FORM_SUBMIT_BUTTON" to listOf("buttonName", "buttonQualifier"))

  /**
   * The search terms a trigger of [triggerType] needs to be FOUND by the event engine, derived from
   * its (already re-pointed) `customParameters`.
   */
  internal fun triggerSearchTerms(triggerType: String, params: String): List<Pair<String, String>> {
    val keys = TRIGGER_SEARCH_TERM_KEYS[triggerType].orEmpty()
    if (keys.isEmpty() || params.isBlank()) return emptyList()
    val root = runCatching { JSON.parseObject(params) }.getOrNull() ?: return emptyList()
    val button = runCatching { root.getJSONObject("button") }.getOrNull()
    val name =
        sequenceOf(button?.getString("name"), root.getString("buttonName"), root.getString("name"))
            .mapNotNull { it?.trim() }
            .firstOrNull { it.isNotEmpty() }
    val qualifier =
        sequenceOf(button?.getString("qualifier"), root.getString("buttonQualifier"))
            .mapNotNull { it?.trim() }
            .firstOrNull { it.isNotEmpty() }
    val out = ArrayList<Pair<String, String>>()
    for (key in keys) {
      val value = if (key == "buttonQualifier") qualifier else name
      if (!value.isNullOrBlank()) out.add(key to value)
    }
    return out
  }

  /**
   * Runs FORMCYCLE's OWN "custom parameters → data model" transfer on the trigger.
   *
   * This is the step every designer save performs (`WorkflowVersionStager.updateTrigger` →
   * `WorkflowCustomParametersHelper.transferToDataModel`), and it is what a hand-written trigger is
   * missing. Decompiled, the helper
   * 1. deserializes the props from `custom_params`,
   * 2. recomputes the trigger `name`/`description` from those props (`findName`/`findDescription`),
   * 3. **clears and rebuilds the SEARCH TERMS** (`findSearchTerms(handler, trigger, props)`).
   *
   * The search terms are the index the event engine looks triggers up by
   * (`EventTaskLocator.findCandidates` → `IWorkflowTriggerDao.getForActiveVersionBy(...)`), so a
   * trigger without them is never a candidate: the click is accepted, the form record reaches
   * `Received`, and no workflow path runs at all. Re-selecting the same button in the designer's
   * trigger dialog "repairs" such a path because that dialog save re-runs exactly this transfer.
   *
   * @return `true` when the transfer ran and its transaction was committed.
   */
  private fun ensureTriggerDataModel(
      userContext: Any,
      triggerId: Long,
      errors: MutableList<String>? = null,
  ): Boolean {
    if (triggerId <= 0L) return false
    val em = WorkflowMirrorAccess.entityManager(userContext) ?: return false
    var applied = false
    try {
      // Same pattern as `MirrorDataRepair`: own transaction. The trigger's `searchTerms` list is a
      // LAZY collection, so the transfer has to run on an ENTITY THA IS ATTACHED — doing it on the
      // entity loaded through the API outside a session silently persists nothing.
      val tx = em.javaClass.getMethod("getTransaction").invoke(em)
      tx.javaClass.getMethod("begin").invoke(tx)
      try {
        val triggerClass = Class.forName("de.xima.fc.entities.WorkflowTrigger")
        val mandantClass = Class.forName("de.xima.fc.entities.Mandant")
        val trigger =
            em.javaClass
                .getMethod("find", Class::class.java, Any::class.java)
                .invoke(em, triggerClass, triggerId)
                ?: throw IllegalStateException("trigger $triggerId not found")
        val mandant =
            mandantOfTrigger(trigger)
                ?: throw IllegalStateException("no mandant for trigger $triggerId")
        // 1. Drop the trigger's OWN search terms. `transferToDataModel` rebuilds the collection
        // from
        //    the parameters but never deletes the rows already in the table, so a second run would
        //    collide on `UC_WF_TSTERM_ELEMENT_KEY_IDX_INDEX_6 (element_id, term_key, term_index)`.
        //    Only THIS trigger's rows are touched — clearing them for a whole version made every
        //    other trigger undiscoverable.
        val staleTerms =
            runCatching {
                  (triggerClass.getMethod("getSearchTerms").invoke(trigger) as? Collection<*>)
                      .orEmpty()
                      .filterIsInstance<Any>()
                      .toList()
                }
                .getOrDefault(emptyList())
        for (term in staleTerms) {
          runCatching { em.javaClass.getMethod("remove", Any::class.java).invoke(em, term) }
        }
        if (staleTerms.isNotEmpty()) {
          runCatching { em.javaClass.getMethod("flush").invoke(em) }
        }
        val helper = Class.forName("de.xima.fc.plugin.workflow.WorkflowCustomParametersHelper")
        helper
            .getMethod("transferToDataModel", triggerClass, mandantClass)
            .invoke(null, trigger, mandant)
        // 2. Persist the terms the helper just rebuilt. It only fills the in-memory collection —
        // the
        //    rows are written by the workflow designer's stager, which this plugin does not run (it
        //    requires a freshly STAGED copy of the version). Without this the trigger has no entry
        // in
        //    the index the engine looks triggers up by (`EventTaskLocator.findCandidates` →
        //    `IWorkflowTriggerDao.getForActiveVersionBy`), so the click is accepted, the form
        // record
        //    reaches `Received`, and no path runs.
        var inserted = 0
        val terms =
            runCatching {
                  (triggerClass.getMethod("getSearchTerms").invoke(trigger) as? Collection<*>)
                      .orEmpty()
                      .filterIsInstance<Any>()
                      .toList()
                }
                .getOrDefault(emptyList())
        for (term in terms) {
          val persisted =
              runCatching {
                    em.javaClass.getMethod("persist", Any::class.java).invoke(em, term)
                    true
                  }
                  .getOrElse { false }
          if (persisted) inserted++
        }
        em.javaClass.getMethod("flush").invoke(em)
        tx.javaClass.getMethod("commit").invoke(tx)
        applied = true
        logger.debug(
            "[CodBi][Mirror] trigger {} data model transferred: name='{}' terms={} persisted={}",
            triggerId,
            runCatching { triggerClass.getMethod("getName").invoke(trigger) as? String }
                .getOrNull(),
            terms.map { term ->
              val key = runCatching { term.javaClass.getMethod("getKey").invoke(term) }.getOrNull()
              val value =
                  runCatching { term.javaClass.getMethod("getValue").invoke(term) }.getOrNull()
              "$key=$value"
            },
            inserted)
      } catch (x: Exception) {
        runCatching { tx.javaClass.getMethod("rollback").invoke(tx) }
        throw x
      }
    } catch (x: Exception) {
      errors?.add("trigger $triggerId: ${describe(x)}")
      logger.warn(
          "[CodBi][Mirror] ensureTriggerDataModel failed for trigger {}: {}",
          triggerId,
          describe(x))
    } finally {
      WorkflowMirrorAccess.closeQuietly(em)
    }
    return applied
  }

  /** The client (`Mandant`) of the project the trigger belongs to. */
  private fun mandantOfTrigger(trigger: Any): Any? =
      runCatching {
            val task = trigger.javaClass.getMethod("getTask").invoke(trigger)
            val process = task.javaClass.getMethod("getProcess").invoke(task)
            val version = process.javaClass.getMethod("getVersion").invoke(process)
            val project = version.javaClass.getMethod("getProject").invoke(version)
            project.javaClass.getMethod("getMandant").invoke(project)
          }
          .getOrNull()

  /** The `key`/`value` pairs of a trigger's (lazy) search terms, read inside its own session. */
  private fun readSearchTerms(trigger: Any): List<Pair<String, String>> =
      runCatching {
            (trigger.javaClass.getMethod("getSearchTerms").invoke(trigger) as? List<*>)
                .orEmpty()
                .mapNotNull { term ->
                  val entity = term ?: return@mapNotNull null
                  val key = entity.javaClass.getMethod("getKey").invoke(entity) as? String
                  val value = entity.javaClass.getMethod("getValue").invoke(entity) as? String
                  if (key == null || value == null) null else key.trim() to value.trim()
                }
          }
          .getOrDefault(emptyList())

  /**
   * Re-points an existing trigger when its `customParameters` (or its params version) no longer
   * match the mirrored names, and always re-runs FORMCYCLE's data-model transfer so the trigger's
   * name/description/search terms exist.
   *
   * Returns `true` only when the PERSISTED trigger row really changed — the idempotent term repair
   * is not reported (see below), otherwise every sync would look like a change.
   */
  private fun syncTriggerParams(
      userContext: Any,
      triggerApi: Any,
      trigger: Any,
      expected: String,
      triggerType: String,
      paramsVersion: String? = null,
  ): Boolean {
    val current =
        runCatching {
              trigger.javaClass.getMethod("getCustomParameters").invoke(trigger) as? String
            }
            .getOrNull()
            .orEmpty()
    var changed = false
    if (current != expected) {
      trigger.javaClass
          .getMethod("setCustomParameters", String::class.java)
          .invoke(trigger, expected)
      changed = true
    }
    // The params VERSION selects the props deserializer. A freshly created entity defaults to
    // `0.0.0`, which cannot read `customParameters` written by FORMCYCLE 8.5.3 — the trigger then
    // exists (correct params, correct search terms, active) yet `ITriggerHandler.isAppliesToEvent`
    // never matches, so the path silently never fires. Adopt the source trigger's version.
    if (!paramsVersion.isNullOrBlank()) {
      val currentVersion =
          runCatching {
                trigger.javaClass.getMethod("getCustomParametersVersion").invoke(trigger) as? String
              }
              .getOrNull()
      if (currentVersion != paramsVersion) {
        runCatching {
              trigger.javaClass
                  .getMethod("setCustomParametersVersion", String::class.java)
                  .invoke(trigger, paramsVersion)
            }
            .onSuccess { changed = true }
      }
    }
    // A trigger without search terms is invisible to the event engine — this is what made a
    // correctly configured reflected path never run. The transfer is IDEMPOTENT repair (it rebuilds
    // the search terms every time), so it deliberately does NOT count as a change: reporting it as
    // one made every sync answer `updated=1`, and the client answers that with publish + reload.
    val triggerId = reflectId(trigger) ?: 0L
    if (triggerId > 0) {
      ensureTriggerDataModel(userContext, triggerId)
    }
    if (changed) updateEntity(triggerApi, userContext, trigger)
    if (current != expected) {
      logger.debug(
          "[CodBi][Mirror] trigger '{}' params re-pointed: {} -> {}",
          runCatching { trigger.javaClass.getMethod("getName").invoke(trigger) as? String }
              .getOrNull(),
          current.take(300),
          expected.take(300))
    }
    return changed
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
    logger.debug("[CodBi][Mirror] updated Mirror node {} for source path {}", nodeId, source.taskId)
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

  /** `customParameters` of the copied trigger, with the mirrored names re-pointed. */
  private fun triggerParamsOf(
      source: SourcePath,
      tokens: Set<String>,
      namePrefix: String?,
      targetNames: Set<String>,
      mirroredRefs: Map<String, String> = emptyMap(),
      sourceNamesById: Map<String, String> = emptyMap(),
  ): String {
    val remapped =
        remapTriggerParams(source, tokens, namePrefix, targetNames, mirroredRefs, sourceNamesById)
            .ifBlank { "{}" }
    logger.debug(
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
   *
   * @param mirroredRefs source NAME -> the copy's namespaced name and source ID -> the copy's ID
   *   (see [MirrorFormAccess.mirroredElementReferenceMap]). Used FIRST, so a reference resolves to
   *   exactly what the reflecting form really holds.
   * @param sourceNamesById source element ID -> technical name (see
   *   [MirrorFormAccess.elementNamesById]). A trigger that names a button LIST by its internal ID —
   *   which is what a multi-button `XButton` trigger carries — must become `<prefix><listName>`,
   *   not `<prefix><listId>`: the copy is always named after the element's NAME, so prefixing the
   *   ID produced a reference that exists nowhere (the trigger then showed no button selected and
   *   never fired).
   */
  internal fun remapTriggerParams(
      source: SourcePath,
      tokens: Set<String>,
      namePrefix: String?,
      targetNames: Set<String> = emptySet(),
      mirroredRefs: Map<String, String> = emptyMap(),
      sourceNamesById: Map<String, String> = emptyMap(),
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
            val mapped =
                mirroredNameOf(value, tokens, prefix, targetNames, mirroredRefs, sourceNamesById)
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
      logger.debug(
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
      mirroredRefs: Map<String, String> = emptyMap(),
      sourceNamesById: Map<String, String> = emptyMap(),
  ): String? {
    if (name.startsWith(prefix)) return null

    fun mapped(segment: String): String? {
      if (segment !in tokens) return null
      // 1. The reflecting form already HOLDS a copy for this reference: use it verbatim (its
      //    namespaced name, or its id when the reference was an id). This is the exact value the
      //    copy has, so nothing can drift.
      mirroredRefs[segment]?.let {
        return it.takeIf { value -> value != segment }
      }
      // 2. An ID reference must be translated through the element's NAME: the copies are named
      //    `<prefix><sourceName>`, never `<prefix><sourceId>`.
      val base =
          sourceNamesById[segment]
              ?: run {
                if (segment.startsWith("xi-")) {
                  logger.warn(
                      "[CodBi][Mirror] trigger reference '{}' is a form-element id without a " +
                          "technical name in the source form — it cannot be re-pointed at the " +
                          "mirrored copy (is that element inside the mirrored element?)",
                      segment)
                  return null
                }
                segment
              }
      val namespaced = "$prefix$base"
      return when {
        targetNames.isEmpty() -> namespaced
        namespaced in targetNames -> namespaced
        base in targetNames -> null
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
      // BUTTON entries are namespaced too: `.MirrorChildItems.propertiesForNode` prefixes the
      // copy's
      // `buttons[].name`, and the live render registers its buttons with the SAME namespaced names
      // (`MirrorFormAccess.namespaceElementNames`), which is what FORMCYCLE's submit validation
      // looks up in the form request session.
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
        logger.debug(
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
