# CodBi Workflow Mirror Node — implementation notes

Status: implemented (workflow node `Mirror`). Build verification: `mvnw.cmd -o -q -DskipTests compile`.

## What was added

- `MirrorNodePlugin` (`getName() = "Mirror"`) — `APluginActionNodeHandler<MirrorNodeProps>`.
- `MirrorNodeProps` — `sourceForm`, `sourceFormName`, `pathId`, `pathName`, `outputMode`.
- `WorkflowMirrorAccess` — read-only access to another form's active `WorkflowVersion`:
  - `listPaths(...)` → `WorkflowTask`s (trigger + node count),
  - `snapshot(...)` → trigger + flattened node tree + content revision,
  - `revision(...)`.
- `EMirrorOutputMode` — `SUMMARY` / `NODES`.
- `MirrorServletAction` gains `action=paths` and `action=pathtree` (reuses the existing
  `CodBi_Mirror` endpoint and `UserContext` resolution).
- `MirrorNode.xhtml` + `workflow-mirror-node.js/.css` — form → path dropdowns, live path preview,
  placeholder hint.
- `ECodbiWorkflowElementCategory.SUB_CODBI_MIRROR` — new palette group.
- Icon: the **same `mirror-icon.svg`** as the form Mirror widget.

## Result

The node exposes a record:

| placeholder | value |
|---|---|
| `[%$Name.RESULT.value%]` | primary value, same as `summary` |
| `[%$Name.RESULT.form%]` | source form title |
| `[%$Name.RESULT.path%]` | source path (task) name |
| `[%$Name.RESULT.trigger%]` | `<trigger type>: <trigger name>` |
| `[%$Name.RESULT.summary%]` | `<form> / <path> (<n> nodes)` |
| `[%$Name.RESULT.nodes%]` | list of `<type>: <name>` (plus description in `NODES` mode) |
| `[%$Name.RESULT.nodeCount%]` | number of reflected nodes |
| `[%$Name.RESULT.revision%]` | content hash of the reflected path |

## Change propagation

The path is resolved live at **workflow execution** time from the source project's active
`WorkflowVersion`. A source edit is visible on the next execution; there is no pinned mode. The
`revision` value changes when the path content changes (needed because FORMCYCLE edits the active
version in place).

### Fix (2026-10): source save did not create any nodes

Symptom: saving the source workflow path never created the source nodes in the reflecting path.

Four independent causes were found and fixed:

1. **The reflecting lane was "not found" for a normal path.**
   [`MirrorNodePlugin.locateReflectingLane()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/plugin/MirrorNodePlugin.kt)
   returned `null` when the Mirror node had no *downstream siblings* — i.e. exactly the state of a
   freshly configured path that contains nothing but the Mirror node. Both the lazy re-sync and the
   reflector registration then logged `SKIPPED:no-lane`. An **empty lane is now a valid lane** (the
   rebuild creates the source nodes there); only a Mirror node that is the path's *root* node (no
   parent container) still reports "no lane", with an explicit warning.
2. **The push depended on the runtime registry.** `MirrorMaterializedStore` reflectors were only
   registered when the *reflecting* Mirror node had **executed** at least once, so the very first
   source save always found `reflectors = 0`. `MirrorPushService.pushForSourceProject()` now
   **discovers the reflectors live** from the persisted workflow model
   ([`WorkflowMirrorAccess.discoverReflectors()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/WorkflowMirrorAccess.kt))
   and only merges the registry rows in as a fallback.
3. **`MirrorPush` was resolved from the registry only.** `AICodBiAssistant.handlePushMirror()`
   returned `{"reflectors":0}` before any push attempt; it now delegates to
   `MirrorPushService.pushForSourceProject()` for the saved version's project.
4. **The frontend save hook never installed.** `designer.js` is evaluated before the designer
   instance exists and `instance()` throws until the designer is initialized, so
   `installMirrorPushListener()` returned silently on the first (only) attempt. The hook now polls
   until `designer.publish` is available, wraps it exactly once, and reads `config.workflowVersionId`
   at **save** time.

### Fix (2026-10): the lazy re-sync got stuck at `REBUILT_PENDING:skip-again`

Live log evidence: the reflecting Mirror node resolved, registered
(`REGISTERED:version=1002 lane=FcSequenceHandler:1 downstream siblings`) and then always returned
`REBUILT_PENDING:skip-again (revision … already rebuilding)` — the lane never converged.

- The pending-rebuild marker was stored **before** the rebuild (so a failed rebuild blocked every
  later submit) and had no timestamp, so a rebuild whose recreated lane was later overwritten (e.g.
  by the reflecting **workflow designer** saving its stale in-memory model) blocked the sync
  forever.
- Now the marker is `<revision>:<epochMillis>`, is stored **only when `createdNodes > 0`** (a failed
  rebuild stays retryable), and expires after `REBUILD_PENDING_GRACE_MS` (60 s) so the next submit
  rebuilds again. Legacy plain-`<revision>` markers are treated as stale on purpose.
- The re-sync log now names the lane children (`replacing children=[TYPE:name, …]`) and reports
  `created`/`deleted` counts plus `REBUILD_FAILED` when nothing was created.

### Automatic propagation: `MirrorAutoSync` watcher (no user action)

Because FORMCYCLE fires no server-side event when a **workflow** is saved (`WorkflowValidationBean –
Saving workflow version …`) and exposes no workflow-designer resource hook, the plugin now watches
for changed source paths itself:

- [`MirrorAutoSync`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/MirrorAutoSync.kt)
  — single daemon `ScheduledExecutorService`, started from `CodbiFormResourcesPlugin.initialize()`
  (stopped in `shutdown()`), first pass after 30 s, then every 30 s.
- [`MirrorPushService.syncOutdatedReflectors()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/MirrorPushService.kt)
  — read-only pass over all `Mirror` nodes; a lane is rebuilt only when
  - its stored materialized revision differs from the source's `contentRevision`, **or**
  - it is structurally drifted (lane child count ≠ source action-node count, e.g. a designer save
    replaced the created nodes).
  Idle installations pay one query plus one source-lane read per distinct source path per tick.
- Cross-thread/-cluster safety: a rebuild is claimed via the timestamped pending marker
  (`AUTO_SYNC_CLAIM_MS`), so overlapping ticks cannot recreate the same lane twice.
- `autoSync = false` on the node excludes it from discovery, i.e. read-only mirrors are never
  written to.

Result: saving the source path (anywhere — form designer *or* workflow designer) is picked up within
~30 s and materialized into the reflecting path without any user interaction.

### Endpoint statuses (fix) and the `syncEndpoint` option

A copied endpoint (`FC_CHANGE_STATE`, last node of the lane) referenced a status that only exists in
the source project, so FORMCYCLE reported *"Der referenzierte Status existiert nicht mehr …"*:

- [`WorkflowLaneMaterializer.remapParams()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/WorkflowLaneMaterializer.kt)
  now matches states **case-insensitively by name** and, for every state referenced by the copied
  params that the reflecting version does not have, **creates it** (`WORKFLOW_STATE_API.create`,
  appended after the last state). Previously such a reference was only logged as a warning and passed
  through, leaving a dangling UUID.
- New prop `syncEndpoint` (default `true`): `false` keeps the reflecting path's OWN endpoint — the
  existing terminal node is not deleted and not overwritten, the source's terminal node is not
  created, and the kept endpoint is moved back to the end of the lane (`fixParentOrderIndex`) after
  the rebuild. If the reflecting lane has no endpoint yet, the source's endpoint is applied anyway so
  the lane never ends up one node short. Wired through `ReflectorDescriptor.syncEndpoint`
  (`Boolean?`, `null` = true, so old registry rows keep working) and
  `RewriteRequest`/`RebuildRequest`.

### Source-side sync brake (`pauseSync`)

`autoSync = false` only silences ONE reflecting form. To stop **every** mirror of a source path with a
single switch, place a Mirror node **on the source path** that points at its own path
(`sourceForm` = own form, `pathId` = own path) and tick **`pauseSync`**:

- [`WorkflowMirrorAccess.discover()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/WorkflowMirrorAccess.kt)
  recognises that self-reference, collects the paused `(formKey, pathId)` pairs, excludes the pause
  node from the reflector list and filters out **every** reflector of that source — including stale
  registry rows (`MirrorPushService.collectReflectors`).
- The reflecting-side lazy path consults
  [`WorkflowMirrorAccess.isSourceSyncPaused()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/WorkflowMirrorAccess.kt)
  and returns `SKIPPED:source-paused` instead of rewriting.
- Unticking the checkbox (or deleting the node) resumes everything on the next watcher pass (≤30 s).
- A pause marker freezes its path in **both directions**: reflectors whose *source* is that path are
  skipped, and reflectors whose *target* is that path are skipped too
  ([`isTargetPaused()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/WorkflowMirrorAccess.kt)),
  so a path that is itself reflected stops receiving updates as well. The reflecting-side lazy path
  checks the same marker for its own path (`SKIPPED:target-paused`).
- The same checkbox on a **reflecting** node (pointing at a foreign path) is a *local* brake: only
  that node's lane stops being updated (discovery drops it like `autoSync = false`).

### Endpoint-only changes (status renames)

An endpoint only carries the status **UUID**; renaming the status in the source changes neither the
node name nor its params, so the content revision stayed identical and the reflected endpoint kept the
old status. [`contentRevision()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/WorkflowLaneMaterializer.kt)
now folds the (sorted) `uuid -> name` state map of the source version into the signature, so a status
rename (or a newly created status) re-materializes the lane.

### Mirror widget: opt-in "create triggered workflow paths"

New property `codbi_mirror_create_triggered_paths` on the Mirror widget (checkbox in the *Mirror*
category, default **off**):

- [`MirrorTriggerPaths.findTriggeredPaths()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/MirrorTriggerPaths.kt)
  reads the source form's workflow paths and matches each trigger's `customParameters` against the
  technical names/ids of the mirrored element **and its whole subtree**
  (`MirrorFormAccess.mirrorSubtree`).
- [`MirrorTriggerPaths.syncTriggeredPaths()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/MirrorTriggerPaths.kt)
  creates one path per match in the reflecting form, in exactly this order (it matters, see the
  incident below): `WorkflowTask` → root `SEQUENCE` → **`Mirror` node** (`sourceForm`/`pathId` of the
  source path) → **temporary endpoint** → `WorkflowTrigger` copied from the source (element
  references re-pointed at the mirrored child-item namespace `<mirrorName>_<sourceName>`) → re-link
  `trigger`/`rootNode` on the task. The lane itself is then filled by the normal Mirror sync.
- **Temporary endpoint:** FORMCYCLE requires every path to end in a terminal endpoint node, so a path
  holding only the `Mirror` node is reported as *invalid*. A temporary `FC_RETURN` ("End process" —
  ends the process without a state transition, needs no target status) is appended after the Mirror
  node. On the first sync it is either re-typed in place (source lane with exactly one action node) or
  — as an extra lane child it makes the structural drift check fire — deleted and replaced by the
  reflected source nodes, including the real endpoint (`MirrorTriggerPaths.PLACEHOLDER_ENDPOINT_TYPE`).
- **Lifecycle safety:** every created task carries `[CodBi Mirror] source=<formKey>#<taskId>` in its
  description; only tasks with that marker are ever updated or deleted, so user-authored paths are
  never touched. When the trigger disappears (element/child removed, path deleted) the marked path is
  removed again.
- Servlets: `CodBi_Mirror&action=triggerpaths` (read-only listing) and
  `action=applytriggerpaths&form=&element=&element_key=&target=project-<id>&prefix=<mirrorName>_`.
- Designer: [`MirrorChildItems.ts`](../src/main/web/packages/designer/src/js/MirrorChildItems.ts)
  calls `applytriggerpaths` after materializing the mirrored children (fire-and-forget) when the
  checkbox is on; the trigger's element references are remapped **only** for exact token matches, so
  trigger types, state UUIDs and other string values stay untouched.
- **Widget property registration gotcha:** a Mirror-widget property is only rendered in the designer
  when it is BOTH registered designer-side (`registerCustomProperty` with a custom editor) AND part of
  the widget's server-side property list
  ([`XMirror.getAvailableProperties()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/XMirror.kt:418)).
  The built-in `CheckboxEditor` is not used for plugin item properties — [`MirrorCheckbox`](../src/main/web/packages/designer/src/js/MirrorCheckbox.ts)
  is a custom editor for exactly this reason.
- Watcher interval: plugin property **`wgtMirror_WatcherIntervalSeconds`** (default `30`, `5…3600`,
  read at startup).

### Chained reflections (A → B → C)

Chains work because the watcher re-evaluates every source on each pass; `laneRoots()` additionally
drops `Mirror` nodes from a source lane ([`stripMirrorNodes()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/WorkflowLaneMaterializer.kt)),
because a Mirror node is infrastructure (it materializes its own source path) and must not be copied
into the next path — otherwise B's mirror plumbing (with A's `sourceForm`/`pathId`) would be
materialized into C. A source path that contains **only** Mirror nodes yields
`SKIPPED:empty-source`. Cyclic pairs (A ↔ B) converge thanks to the revision/structural gates, but
cost one extra rebuild per round-trip, so avoid them by design.

### Incident (fixed): broken designer after creating a triggered path

Creating a `WorkflowTask`/`WorkflowNode` outside FORMCYCLE's own ordering code left the Hibernate
`@OrderColumn` empty, which makes the indexed collection unloadable:

```
org.hibernate.HibernateException: null index column for collection: de.xima.fc.entities.WorkflowProcess.tasks
```

…and kills the designer (form **and** workflow tab) for that project.

- [MirrorTriggerPaths](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/MirrorTriggerPaths.kt)
  renumbers the process tasks at the **end** of the creation sequence and after deleting a path, and
  calls
  [`WorkflowLaneMaterializer.ensureParentOrderIndex()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/WorkflowLaneMaterializer.kt)
  for every node it creates. The renumbering opens its own `EntityContext`/transaction, so it must
  **not** run between the reflective `WORKFLOW_TASK_API`/`NODE_API`/`TRIGGER_API` calls — doing so
  detaches the entities the following calls still need.
- [`MirrorDataRepair`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/MirrorDataRepair.kt)
  (new) heals `workflow_task.proc_order_idx` / `workflow_node.parent_order_idx` rows that are `NULL`;
  [`MirrorAutoSync`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/MirrorAutoSync.kt)
  runs it at the start of every watcher pass, so an already damaged installation repairs itself
  within one interval (log: `repaired NULL proc_order_idx rows of WorkflowProcess …`).

### Incident (fixed): created path had a trigger but no Mirror node

Symptom: the reflecting form got the triggered path incl. the correctly re-pointed trigger, but the
path contained **no** `Mirror` node — so it never reflected the source path — and the log only said

```
[CodBi][Mirror] could not create the reflecting path for source path 2403 of 'project-1010': null
[CodBi][Mirror] triggered paths for 'project-1010' -> 'project-1002': created=0 updated=0 removed=0
```

Root cause: `AWorkflowElement.customParameters` is annotated `@NotNull` + `@JsonObject` and is
validated with FORMCYCLE's own strict RFC reader (`de.xima.cmn.reader.JsonReader.isValidJsonObject`).
The Mirror node's params were built by concatenating raw strings, so any character that has to be
escaped in JSON aborted the `WorkflowNode` insert with

```
ConstraintViolationException: Validation failed for classes [de.xima.fc.entities.WorkflowNode]
  ConstraintViolationImpl{propertyPath=customParameters, messageTemplate='{…JsonObject.message}'}
```

Three things had to be fixed:

1. **The params are now serialized, not concatenated.** `mirrorNodeParams()` builds a
   `com.google.gson.JsonObject`, so quotes/backslashes/control characters in the source path name are
   escaped and the payload is always a valid JSON object (tests:
   `mirror node params are a valid JSON object`, `mirror node params escape quotes and backslashes in
   the path name`, both checked with FORMCYCLE's `JsonReader`).
2. **The `null` message was the real blocker for diagnosis.** Every reflective `Method.invoke` throws
   a `java.lang.reflect.InvocationTargetException`, and *that* exception has a `null` message — the
   real cause only lives in `getCause()`. All Mirror components that use reflection now log through
   `describe(x)` (`Class: message <- cause <- …`) plus a second `logger.warn(msg, x)` call that prints
   the stack trace, `createPath` logs each step (`create-path 1/5 … 5/5` with the created IDs) and
   `createNode` logs the rejected payload when a node insert fails.
3. **Order of the API calls (hardening).** The `@OrderColumn` renumbering was executed between
   "create task" and "create root node/trigger/Mirror node"; its own `EntityContext`/transaction can
   detach the entities the remaining calls still need, so it now runs **last**.

Robustness added at the same time:

- The `Mirror` node is created **before** the trigger, so a path can never appear in the designer
  without the node that actually mirrors the source path.
- `createPath` no longer fails silently on `getMainProcess() == null` (throws with a message) and the
  optional setters `setActive`/`setDescription` are best-effort (not every FORMCYCLE build has them),
  while `name`/`type`/`uuid`/`task` stay mandatory.
- [`MirrorTriggerPaths.ensureMirrorNode()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/MirrorTriggerPaths.kt)
  is now fully self-healing for a marked task that an aborted run left half-created: it re-links a
  **root node** (re-using an orphaned root-level node instead of adding a second empty lane),
  re-creates a **trigger** copied from the source path (re-pointed, so the path actually starts) and
  re-creates the **`Mirror` node**. The next `applytriggerpaths` call therefore completes the path
  (log: `ensureMirrorNode: recreated the missing trigger id=…` /
  `ensureMirrorNode: recreated the Mirror node id=…`).
- The payload is validated with FORMCYCLE's own reader at runtime; if a server build rejects it, the
  behaviour flags are dropped and the payload is logged
  (`… not a valid JSON object for FORMCYCLE's reader`) instead of failing the insert, because the
  flag defaults in `MirrorNodeProps` match the dropped values.

### Incident (fixed): the reflected trigger never fired (default success page)

Symptom: the reflected path had the (namespaced) trigger and the workflow was valid, but clicking the
mirrored submit button showed FORMCYCLE's default "submitted successfully" page instead of running the
workflow — the click matched **no** trigger.

What a submit trigger actually contains (verified with `action=triggerdiag` on the dev server):

```json
{"button":{"name":"btnWOW","qualifier":"btn2"}, "name":"btnWOW", "$version":"8.5.3"}
```

i.e. `FC_QUALIFIED_FORM_SUBMIT_BUTTON` identifies the clicked button by **`button.name`** and
**`button.qualifier`** (= the name of the `XButtonList` item that owns the button).

The Mirror copy namespaces the ITEM names (`mir1_btn2`), but the `buttons[].name` entries keep their
**source** name in the persisted copy — so the first remap attempt left `button.name` as `btnWOW`.
At RENDER time, however, `XMirror.namespaceLinkedIds()` prefixes the `name`/`data-name`/`data-xn`/`xn`
attributes of the whole mirrored subtree, so the click actually submits `mir1_btnWOW` — the trigger
never matched and the form fell through to the default "submitted successfully" page (a second path
without a button filter then "won" the submit).

Fix in [`MirrorTriggerPaths`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/MirrorTriggerPaths.kt):

- [`reflectingFormNames()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/MirrorTriggerPaths.kt)
  collects the names that really exist in the reflecting form: item `name`/`id` **and** the
  `XButtonList` `buttons[]` entries (`name`/`value`).
- [`mirroredNameOf()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/MirrorTriggerPaths.kt)
  prefixes a reference only when the namespaced name exists there (per segment for qualified
  `container.button` names); if the form only has the plain name, the plain name is kept.
- [`buttonNamesOf()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/MirrorTriggerPaths.kt)
  adds the `XButtonList` button-entry names of the mirrored subtree to the match tokens (a button is
  not a form item, so it was missing), and `reflectingFormNames()` also knows their **render-time**
  namespaced form (`mir1_<button>`) for items that carry the Mirror's name prefix.
- Existing marked paths are **re-pointed** too ([`syncTriggerParams()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/MirrorTriggerPaths.kt)),
  so a path created by an older build is corrected on the next `applytriggerpaths` run (verified on
  the dev server: `updated=1`, then the trigger carried `{"button":{"name":"mir1_btnWOW","qualifier":"mir1_btn2"},"name":"mir1_btnWOW"}`).
- **`action=triggerdiag&form=…&element=…&target=…&prefix=…`** (read-only) returns a JSON snapshot with
  the tokens, the names present plain/namespaced in the reflecting form, the source paths with raw and
  re-pointed params and every path of the reflecting workflow. Every log line carries a build marker
  (`[trigger-sync#N]`) so a pasted log can be attributed to the running build.

#### The click itself was REJECTED (namespaced button key)

The next round showed the real blocker in the server log:

```
[ERROR] (FormProcessUtil.java:294) - Button key mir1_btnWOW not found in current form request
        session - was the form submit manipulated?
[WARN]  (AFormProcessingServlet.java:175) - Request not accepted. Submit button (xf-action) was
        manipulated!
```

FORMCYCLE validates the submitted `xf-action` (= the button key) against the **published form model**.
`XMirror.namespaceLinkedIds()` prefixes the rendered `name`/`data-xn`/`xn` of the mirrored subtree,
but the *copy* in the form model only namespaced the ITEM name — its `buttons[].name` entries kept the
source name. Model (`btnWOW`) and markup (`mir1_btnWOW`) therefore disagreed and every mirrored click
was rejected before any workflow ran.

The fix keeps the namespacing (it is what prevents DUPLICATE button keys when the same element is
mirrored twice or the target form has a button of the same name) and makes the model agree:

1. [`MirrorChildItems.propertiesForNode()`](../src/main/web/packages/designer/src/js/MirrorChildItems.ts)
   now prefixes the `buttons[].name` (and `buttonEntries[].name`) of a copied `XButtonList`, exactly
   like it already prefixes the item name.
2. [`MirrorTriggerPaths.remapTriggerParams()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/MirrorTriggerPaths.kt)
   walks the params JSON and re-points every element reference — INCLUDING the button keys (top-level
   `name`, `button.name`, `button.qualifier`), per segment for qualified names.
   `mirroredNameOf()` only uses the namespaced form when the reflecting form actually has it, so an
   older copy that is not namespaced yet keeps its plain keys (self-healing, no broken clicks).
3. [`XMirror.namespaceLinkedIds()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/XMirror.kt)
   therefore continues to namespace the whole subtree (model and markup agree).

Existing mirror copies are re-created by the designer's normal child sync; `action=triggerdiag` shows
`presentNamespaced` for the button key so the state is verifiable.

Diagnostics (all `[CodBi][Mirror]` INFO lines):

```
trigger matching: tokens=[…] presentPlain=[…] presentNamespaced=[…] (N names in the reflecting form)
trigger 'btn2.btnWOW' (FC_FORM_SUBMIT_BUTTON): source params={"buttonName":"btnWOW"} -> reflected params={…}
trigger 'btnWOW' params re-pointed: {…old…} -> {…new…}
```

If `presentPlain` contains the button name and `presentNamespaced` does not, the trigger must keep the
plain name — which is exactly what the remap now does.

### Incident (fixed): the form went OFFLINE after a watcher update

Symptom: as soon as the watcher (or a source-save push) rewrote a reflecting lane, the functional form
was served as **offline**; only opening the workflow designer and saving the workflow brought it back
(with the change applied).

Cause: every lane change ends in `UPDATE workflow_version SET flag_wf_invalid = 1`. That flag is the
designer's *cache* marker ("re-analyse the workflow model"), but a version that **stays** invalid is
served to the frontend as offline — the designer save (and a form publish) clears it again.

Fix: [`refreshWorkflowModel()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/WorkflowLaneMaterializer.kt)
replaces `markWorkflowInvalid()` in the plugin/background paths. It

1. reads the current `flag_wf_invalid`,
2. sets it (the tickle, so FORMCYCLE drops a cached analysis),
3. restores the **previous** value.

So a healthy workflow stays online and a workflow that was already invalid (for a real reason) stays
invalid — the plugin never silently "fixes" a broken workflow, and never leaves a healthy one offline.
`markWorkflowInvalid()` is kept for callers that explicitly want the flag to stay set (e.g. to force an
open designer to reload).

### Manual fallback: "Create nodes now"

The Mirror node's properties panel additionally keeps an explicit trigger (useful to force a sync
immediately, and as a diagnostic because it reports created/deleted counts):

- [`MirrorNode.xhtml`](../src/main/resources/WEB-INF/ui/MirrorNode.xhtml) — button
  `data-codbi-mirror-sync` + result line.
- [`workflow-mirror-node.js`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/workflow-mirror-node.js)
  — `runSync()` calls `CodBi_Mirror&action=sync&form=<sourceFormKey>&path=<pathId>` and prints the
  returned status note.
- [`MirrorServletAction`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/MirrorServletAction.kt)
  — `action=sync` → `MirrorPushService.syncSourcePath()` (live discovery + `rebuildLaneFromIds`).
- i18n: `workflow.mirror.sync`, `workflow.mirror.sync.tooltip`, `workflow.mirror.sync.running`,
  `workflow.mirror.sync.result` (en/de).

## Notes / limits

- Workflow nodes have no appendable-container concept, so the node reflects path data; it does not
  embed or execute the foreign path.
- The source project must be readable by the effective user; otherwise the node raises a soft error
  and returns no result.
