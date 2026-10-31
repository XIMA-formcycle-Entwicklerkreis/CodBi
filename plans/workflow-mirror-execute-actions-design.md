# Executing reflected workflow actions on the reflecting form — design options

Status: **design / investigation** (no code). Requested behavior: a "reflecting" form must run
the SAME set of side-effect actions as a "template" (source) workflow, and the reflected actions
must AUTO-SYNC from the source so a client submitting the frontend form always executes the
latest version of the template — without ever opening the reflecting form's workflow designer.

## Background / constraints (verified)

- The current Mirror workflow node ([`MirrorNodePlugin`](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/plugin/MirrorNodePlugin.kt))
  is **read-only**: it resolves the source path via
  [`WorkflowMirrorAccess.snapshot()`](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/WorkflowMirrorAccess.kt)
  and exposes the STRUCTURE (trigger + node summaries) as a result. It never invokes FORMCYCLE's
  workflow engine, so no action handler runs.
- FORMCYCLE executes a workflow path only as real `WorkflowTask`/`WorkflowNode`/`WorkflowTrigger`
  entities in the form's OWN `WorkflowVersion` and its own runtime `WorkflowState`. Its engine
  walks persisted nodes, calling each node's registered action handler with the current form data.
- There is **no public "run task/path by id" API**. The only public workflow-start mechanisms are
  `WorkflowAPI.initWorkflow(...)` / `triggerEvent(...)` (event/trigger-driven) — see the existing
  feasibility study [`workflow-path-mirror-node-feasibility.md`](plans/workflow-path-mirror-node-feasibility.md)
  which explicitly marked "execute another form's path/task" as ❌ and "executing or embedding
  another form's workflow path" as a non-goal.
- **`customParameters` are project-scoped**: node/trigger config JSON references state UUIDs,
  form-element names/UUIDs, DB/LDAP connection ids, template UUIDs, etc. that are only valid in
  the source project. Any copy must REMAP these into the target project (pattern already used by
  [`WorkflowSpecNormalizer`](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/WorkflowSpecNormalizer.kt)
  and [`ForeignElementCopy`](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/ForeignElementCopy.kt)).

## The only way FORMCYCLE executes actions on the reflecting form

Because node execution is tied to persisted entities in the current version, the mirrored actions
can only actually RUN on the reflecting form if they are **materialized as real
`WorkflowTask`/`WorkflowNode` entities inside the reflecting form's own `WorkflowVersion`**
(delivery the user already accepted: "copying/mirroring the node definitions and running them
there is fine"). `AICodBiAssistant.createWorkflowTask` / `AIWorkflowAssistant.createWorkflowTask`
already create such tasks via reflection, and `WorkflowSpecNormalizer` already canonicalizes node
types — both are reusable.

## The hard problem: AUTO-SYNC without opening the designer

The reflecting workflow is itself a versioned `WorkflowVersion`. FORMCYCLE re-analyzes a version
when it is marked `workflowInvalid` (its own designer-save flow). To keep the reflected lane in
sync at runtime we must decide WHEN to re-materialize the copied task. Three realistic
architectures (A/B/C) follow.

---

## Option A — Two-task setup with designer-time sync hooks (least fragile)

**Setup:** in the reflecting form's designer, place the Mirror node + a real "mirror lane" task
(a copy of the source path) in the same reflecting workflow version. A small plugin servlet
action ("sync mirror lane") is wired to the Mirror node's properties panel.

**Sync:** whenever the source path's REVISION changes, someone invokes the sync action, which
re-materializes the mirror lane's node tree from the source (remapping project-scoped params) and
marks the reflecting version `workflowInvalid` so FORMCYCLE re-renders the flowchart. This can be
done:
- manually from the reflecting form's Mirror node properties panel, and/or
- automatically from the source form's workflow designer — the source workflow doesn't need the
  reflecting designer to be opened; a hook in the source's save flow can push to all registered
  reflecting forms. But this requires configuring registered reflectors.

**Execution:** at runtime the reflecting form's own trigger fires the real mirror lane; FORMCYCLE
executes the (already synced) real nodes with the reflecting form's data.

- ✅ Real FORMCYCLE execution, own data, clean.
- ⚠️ Sync does not happen lazily on the reflecting side — it happens at source-save or on
  designer-open of the reflecting form. "Client submits and always gets the latest" is only
  guaranteed if sync fires reliably whenever the source changes and before the reflecting
  workflow runs.

## Option B — Lazy runtime re-sync inside the executing workflow (matches the requirement most literally)

**Setup:** the reflecting form's workflow has a real trigger → Mirror node → the action lane
(copy of the source). The Mirror node's `execute()` additionally performs a live revision check.

**Behavior on each submit:**
1. The Mirror node computes the source path REVISION (already cheap via `WorkflowMirrorAccess.revision`).
2. If the source revision differs from the revision materially materialized in the reflecting
   version, it **rewrites the action lane's node tree in place** from the source (remapping params)
   and marks the version `workflowInvalid`.
3. It then lets FORMCYCLE continue executing the (freshly updated) lane for THIS execution.

**Risk:** FORMCYCLE resolves/analyses the flow graph and its node handlers when a workflow is
triggered — likely BEFORE the Mirror node (mid-chain) rebuilds the lane. Mutating the tree
mid-run therefore may not affect the nodes already queued for the current execution (the 
refreshed lane would take effect on the NEXT execution). This is the fundamental fragility:
"always runs the latest on the same submit" may require the sync to happen at the very START of
the workflow before the Mirror node, which FORMCYCLE may not permit for a foreign-path re-read.

## Option C — FORMCYCLE-native trigger of the source path (no mirroring, no remap)

**Setup:** the Mirror node (or a variant) calls `WorkflowAPI.initWorkflow`/`triggerEvent` on the
SOURCE project to run the source path — with the reflecting form's data passed in.

- ✅ Uses FORMCYCLE's public execution path; source `customParameters` stay valid (no remap).
- ⚠️ It triggers/advances the SOURCE path, not a copy on the reflecting form. Whether the source
  path can be started with a foreign form-record's data (a different form type!) is doubtful —
  FORMCYCLE workflows are attached to their own form. Side-effects would run in the source
  project's context. This is not really "execute the same actions on the reflecting form"; it is
  "trigger the source workflow". It also requires the source to have a trigger/event that can be
  invoked.

## Recommendation

For the stated requirement ("run the same side-effects on the reflecting form, own data,
auto-synced from source, without opening the reflecting designer"), **Option A is the most
robust and lowest-risk** if the sync trigger can be guaranteed; **Option B is the closest to the
wording but has the mid-run-mutation risk** and needs a prototype to prove FORMCYCLE re-executes
the refreshed nodes within the same trigger.

A pragmatic "A+" hybrid:
- Materialize the mirror lane as real nodes (Option A delivery).
- Sync trigger = **source-workflow save hook** (a CodBi listener/servlet invoked when the source
  workflow the Mirror points at is saved), which propagates updates to all registered reflecting
  forms and marks them `workflowInvalid`. This satisfies "without visiting the reflecting form's
  designer" because the sync is driven from the SOURCE side.
- The Mirror node's live revision check at execution is kept as a safety net that emits a warning
  (or, where safe, re-materializes) if the source changed but the push did not happen.

## Open decisions needed from the user

1. Is the source-side-push sync acceptable (sync when the SOURCE workflow is saved), or must the
   reflecting form detect changes lazily at submit with no source-side hook?
2. Which side-effect node types must be supported (mail / HTTP / write-record / state change /
   templates)? This determines how much `customParameters` remapping is required.
3. Must the reflecting lane be a full copy of the source path, or just the action nodes
   (excluding the source's own trigger, which the reflecting form triggers itself)?

## Debug logging already added

Independent of the chosen design, debug logging was added to
[`MirrorNodePlugin.execute()`](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/plugin/MirrorNodePlugin.kt)
(resolution + READ-ONLY note) and to
[`WorkflowMirrorAccess.snapshot()`](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/WorkflowMirrorAccess.kt)
(per-step resolution). Build verified with `mvnw -q compile`.
