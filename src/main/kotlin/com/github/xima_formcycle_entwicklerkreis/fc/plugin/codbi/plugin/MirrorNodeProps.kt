package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.workflow.EMirrorOutputMode
import de.xima.fc.workflow.taglib.model.BaseActionProps

/**
 * Configuration of the CodBi workflow **Mirror** node.
 *
 * The node references a workflow path (`WorkflowTask`) of another form and exposes the path's
 * CURRENT structure (trigger + node chain) as a workflow result. The source is always resolved live
 * at execution time from the source form's active `WorkflowVersion`.
 *
 * @since 1.1.0
 */
class MirrorNodeProps : BaseActionProps() {

  /** Technical form key of the source form (`project-<id>`). */
  var sourceForm: String? = ""
    get() = field ?: ""
    set(value) {
      field = value
    }

  /**
   * Cached display title of the source form. Used to re-bind a stale [sourceForm] key after an
   * export/import cycle (see `MirrorFormAccess.resolveProjectId`).
   */
  var sourceFormName: String? = ""
    get() = field ?: ""
    set(value) {
      field = value
    }

  /** Id of the referenced workflow path (`WorkflowTask`). */
  var pathId: String? = ""
    get() = field ?: ""
    set(value) {
      field = value
    }

  /** Cached display name of the referenced path (designer display only). */
  var pathName: String? = ""
    get() = field ?: ""
    set(value) {
      field = value
    }

  /**
   * One of the [EMirrorOutputMode] names. Nullable because JSF submits `null` for an unrendered
   * select value; the resolver treats it as `SUMMARY`.
   */
  var outputMode: String? = EMirrorOutputMode.SUMMARY.name
    get() = field ?: EMirrorOutputMode.SUMMARY.name
    set(value) {
      field = value
    }

  /**
   * TEMPORARY Phase-0 spike flag. When `true`, [MirrorNodePlugin] injects a temporary
   * [SpikeProbeNodePlugin] child into a downstream SEQUENCE lane of the current task and logs
   * `[SPIKE]` markers. If a `[SPIKE][SpikeProbe] EXECUTED` marker appears later in the SAME
   * submit's log, FORMCYCLE re-walks live children and same-trigger refresh is proven.
   *
   * This is a debug/dev-only flag for the spike; it is removed (along with the probe node) once the
   * Go/No-Go decision is made.
   */
  var spikeProbe: Boolean = false
    get() = field
    set(value) {
      field = value
    }

  /**
   * TEMPORARY Phase-0 spike flag (RUN 2). When `true`, [MirrorNodePlugin] mutates the params of the
   * existing downstream node IN PLACE (no new node, no reorder) and logs `[SPIKE]2` markers — the
   * realistic Option B rewrite path. Removed once the Go/No-Go decision is made.
   */
  var spikeProbe2: Boolean = false
    get() = field
    set(value) {
      field = value
    }

  /**
   * Master switch for **writing** the mirrored source path into this reflecting path.
   * - `true` (default): the source path's nodes are created/updated in this path — on submit
   *   (in-place rewrite), on a source save (`MirrorPush`) and by the background watcher
   *   (`MirrorAutoSync`). This is the mode a Mirror node is normally used in.
   * - `false`: the node is a **read-only structure inspector** — it still resolves the source path
   *   live and offers the `RESULT.form/path/trigger/summary/nodes/nodeCount/revision` placeholders,
   *   but it never creates, rewrites or deletes a single node and is skipped by every write path
   *   (including `MirrorAutoSync`, which filters it out during discovery).
   *
   * The `false` mode is meant for workflows that merely *read* a foreign path's structure (branch
   * on the node count, log the source structure, put it into a mail, …), or for a reflecting path
   * whose nodes are maintained by hand and must not be overwritten by the source.
   *
   * @since 1.1.0
   */
  var autoSync: Boolean = true
    get() = field
    set(value) {
      field = value
    }

  /**
   * Whether the source path's **endpoint** node (the terminal node, e.g. `FC_CHANGE_STATE`) is
   * materialized into this path as well. Defaults to `true`.
   *
   * Set to `false` when this path should keep its OWN endpoint (own status / own return target) and
   * only mirror the actions before it: the existing endpoint is preserved, moved back to the end of
   * the lane after every sync, and the source's terminal node is not applied.
   *
   * @since 1.1.0
   */
  var syncEndpoint: Boolean = true
    get() = field
    set(value) {
      field = value
    }

  /**
   * **Source-side sync brake.** Only meaningful on a Mirror node placed on the SOURCE path that
   * points at its own path (`sourceForm` = own form, `pathId` = own path). While ticked, no
   * reflecting form of that path is updated at all (no push, no lazy re-sync, no background sync) —
   * one switch for every mirror of the path instead of one per reflecting form.
   *
   * Untick it (or delete the node) to resume synchronisation.
   *
   * @since 1.1.0
   */
  var pauseSync: Boolean = false
    get() = field
    set(value) {
      field = value
    }
}
