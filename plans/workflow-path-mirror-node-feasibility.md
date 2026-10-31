# CodBi Workflow-Path Mirror Node — Feasibility (FORMCYCLE 8.5.3)

Status: **investigation only** (no code yet). Verified against the FORMCYCLE 8.5.3
jars in `C:\Users\callari\.m2\repository\de\xima\fc\*` (project property `<xfc.version>8.5.3</xfc.version>`).

## Question

The Mirror widget references form elements of **another form**. Can we build an analogous
**workflow node** that repects/“mirrors” **workflow paths** (lanes/tasks) of another form?

## Short answer

**Read-only reflection: yes — feasible.** A plugin workflow node can discover the current
project, obtain a `UserContext`, load another project's active `WorkflowVersion`, and read its
tasks/nodes (`WorkflowTask` → `WorkflowNode` tree, `WorkflowTrigger`) and expose that structure as
a node result/placeholder. All required API/entity types are present in the provided-scope jars.

**Structural embedding / direct execution of a foreign path: no, not with a mirror-like
mechanism.** FORMCYCLE has no appendable-container concept for workflow nodes (the workflow
equivalent of `IXItemAppendable`) and no public “call another form's path/task” node type or API.
A workflow node cannot own foreign child nodes; every `WorkflowNode` belongs to exactly one
`WorkflowTask` of one `WorkflowVersion`.

## Evidence (jars)

### 1. Workflow data model (fc-common / fc-api)

- `de.xima.fc.entities.Projekt`:
  `getActiveWorkflowVersion()`, `getWorkflowVersions()`, `getActiveVersion()`, `getId()`, `getTitel()`.
- `de.xima.fc.entities.WorkflowVersion`:
  `getMainProcess()`, `getStates()`, `getVersionNumber()`, `getId()`, `getProjekt()`.
- `de.xima.fc.entities.WorkflowProcess`:
  `getTasks()`, `getVersion()`.
- `de.xima.fc.entities.WorkflowTask`:
  `getTrigger()`, `getRootNode()`, `getNodes()`, `getName()`, `getProcess()`. →
  **A “workflow path” = one `WorkflowTask` (trigger + node tree).** CodBi already uses this
  vocabulary: `AICodBiAssistant.removeAllWorkflowPaths(...)` iterates all tasks of a version.
- `de.xima.fc.entities.WorkflowNode`: `getParent()`, `getChildren()`, `getKey()` (NodeKey), `getType()`
  (inherited `AWorkflowElement.getType()`), `getCustomParameters()`, `getTask()`.
- `de.xima.fc.entities.WorkflowTrigger`: `getType()`, `getCustomParameters()`, `getTask()`.
- `de.xima.fc.entities.WorkflowState`: `getType()`, `getVersion()`, `getName()`.
- Node/trigger type enums: `EWorkflowNodeType`, `EWorkflowTriggerType` (fc-common).

> Note: `de.xima.fc.workflow.PathResourceDescriptor` is a **filesystem** path resolver, and
> `FlowGraphConnectionType`/`IFlowGraphEdgeData` describe graph **edges**; neither is a
> “workflow path” container.

### 2. Cross-project access APIs (fc-api)

`de.xima.fc.api.APIProvider` exposes:

- `WORKFLOW_VERSION_API.getActiveByProject(UserContext, Projekt)` and
  `getByVersionNumber(UserContext, Projekt, long)`.
- `WORKFLOW_STATE_API.getAllByWorkflowVersion(UserContext, WorkflowVersion|Projekt, long)`.
- `WORKFLOW_NODE_API`, `WORKFLOW_TASK_API`, `WORKFLOW_TRIGGER_API`
  (all extend `AEntityAPI<T>` → `getById`, `getAll`, `getAllBy(QueryCriteriaManager)`, `update`, `delete`).
- `WorkflowAPI.initWorkflow(...)` / `triggerEvent(...)` for starting/triggering workflows.
  There is **no** “run task/path by id” entry point.

`de.xima.fc.api.system.FormAPI` only exposes `loadForm*Data` (render/persist/process), i.e. the
form-content mirror path; it does not expose the workflow definition.

CodBi already proves cross-form/cross-workflow access works via reflection:
`AICodBiAssistant.buildWorkflowStructureContext(workflowVersionId, userContext)` reads
tasks + nodes + triggers + `customParameters` through JPQL, and `fetchExistingWorkflowNodes`
does the same. `MirrorFormAccess` already lists all forms and resolves a foreign project.

### 3. Runtime context available to a plugin node (fc-common)

`INodeExecutionParams.getWorkflowContext()` → `IWorkflowExecutionContext`:

- `env()` → `IWorkflowExecutionEnvironmentData`
  - `getProject()`, `getWorkflowVersion()` (from `IBaseWorkflowEnvironmentData`)
  - `getEntityContext()`, `getUser()`, `getUserModel()`, `getClient()`, `getLocale()`
  - `getFormRecord()`, `getXForm()`, `getXFormRenderConfig()`, `getEffectiveUser()`
- `node()` → `IWorkflowNodeLocator` (`current()`, `byId()`, `byUuid()` …), `task()`, `variable()`,
  `placeholder()`, `executor()`, `form()`, `http()`, `file()`, `trigger()`, `processId()`.
- `INodeExecutionParams.getNode()` → current `WorkflowNode`; `getData()` → the node's props bean.

This is sufficient to read foreign workflows at runtime: build a `UserContext` from the effective
user (`MirrorFormAccess.userContextFor(env.user)` or `MirrorFormAccess.systemContext()`), then use
`APIProvider.WORKFLOW_VERSION_API` / the managed `EntityContext` to load the foreign project's
active workflow version and traverse its tasks/nodes.

### 4. Plugin node capabilities (fc-workflow-plugin / fc-workflow-processor)

- `IPluginActionNodeHandler<TData>` / `APluginActionNodeHandler<TData>` provide:
  `getName()`, `getPropertiesViewXhtmlName()`, `execute(INodeExecutionParams<TData>)`,
  `getSuccessValueDescriptor(IValueDescriptorFactory)`, `getPrototypeIcon(...)`, categories, etc.
  This is exactly what `CodbiExtendedAccessorNodePlugin` already implements.
- **No appendable/container hook.** Unlike form items (`IXItemAppendable` +
  `renderCtx.registerParent`), workflow nodes have no mechanism to host or nest foreign nodes.
  `WorkflowNode.parent/children` are plain entity relations within one task/version.
- Design-time foreign data (form/path dropdowns) is obtainable through a plugin servlet action
  using `params.getBenutzer()` → `UserContext`, exactly as `MirrorServletAction` does for forms and
  elements.

## What is feasible vs. not

| Goal | Feasible | Notes |
|---|---|---|
| List forms + their workflow paths in the node properties view | ✅ | Servlet action + `MirrorFormAccess.listForms` pattern |
| Expose a foreign path's structure (trigger, node chain, types, names, customParameters) as node result/placeholder | ✅ | Read foreign `WorkflowVersion` via API/JPQL |
| React to changes in the foreign path | ✅ | Resolve live at execution (like `XMirror` resolves live), hash/version check |
| Deep-link / annotate / validate the foreign path | ✅ | Read-only |
| Materialize copies of foreign nodes as **real child nodes** (Mirror-child equivalent) | ⚠️ partial | Possible by creating `WorkflowTask`+`WorkflowTrigger`+`WorkflowNode` tree via entity API, but nodes would live in the **current** version, not be “reflections” |
| Execute another form's path/task directly | ❌ | No public task-run API; execution is event/trigger-driven (`initWorkflow` / `triggerEvent`) |
| Keep copied foreign nodes in sync automatically | ❌ (hard) | Cross-version UUID/state/form-element refs in `customParameters` are project-scoped and must be remapped |

### The hard part: `customParameters` are project-scoped

Node/trigger configuration is persisted as a JSON string in
`AWorkflowElement.customParameters` and contains references that are valid only inside the
source project/version: state UUIDs (`FcChangeStateProps.targetState`), form element names/UUIDs,
database/LDAP connection ids, `NodeKey`/UUID references, etc. A structural copy therefore needs a
mapping layer (like `WorkflowSpecNormalizer` already does for AI-generated nodes) and cannot be a
naive deep clone. A read-only reflection avoids this entirely.

## Recommended design (read-only reflection node)

Name suggestion: **“Workflow Path Mirror”** (`CodbiWorkflowPathMirror`).

### Props (`BaseActionProps` subclass)

- `sourceFormRef` — technical form key (`project-<id>`) or cached title fallback.
- `sourceFormName` — cached title fallback.
- `sourceFormRef` — technical form key (`project-<id>`) or cached title fallback.
- `sourceFormName` — cached title fallback.
- `sourceWorkflowVersionId` — **optional**; only used when pinning (see below).
- `pathRef` — `WorkflowTask` id (or stable name/uuid) of the foreign path.
- `nodeSelection` — `ALL` / specific node ids.
- `mode` — `SUMMARY` (trigger + node types/names) / `NODES` (+ descriptions) / `FULL` (+ customParameters).
- `includeInactive` — skip nodes with `active == false` when unset.
- `outputName` — name under which the result is exposed.

#### Optional "pinned mode" (not required for live reflection)

By default the node always resolves the source's **active** `WorkflowVersion` at execution time
(`Projekt.getActiveWorkflowVersion()` / `WORKFLOW_VERSION_API.getActiveByProject`), so source edits
propagate to the next execution.

A **pinned mode** would instead store a fixed `sourceWorkflowVersionId` and always read that exact
version (`WORKFLOW_VERSION_API.getById` / `getByVersionNumber`), independent of which version is
active later. It is **not a FORMCYCLE feature** — just an optional design choice — and is only
useful when:

- a specific workflow version (version number) must be frozen for audit/reproducibility, or
- the target process must keep behaving identically even while the source workflow is being edited.

Costs/risks of pinning: the pinned version must still exist (deleted/purged/backup-rotated
versions break the reference), and the reflection deliberately goes stale. Because FORMCYCLE edits
the active version **in place** (`workflowInvalid`), pinning only makes a real difference when the
project actually holds multiple distinct `WorkflowVersion`s (version numbers / backups).

Given the stated requirement (“read the current state when the reflecting workflow executes”), the
node can ship **without** pinned mode; it can be added later as an optional property without
changing the default behaviour.

### Backend access layer (mirror of `MirrorFormAccess`)

`WorkflowMirrorAccess` (object):

- `listForms(userContext)` → reuse `MirrorFormAccess.listForms`.
- `listPaths(userContext, formKey)` → resolve `Projekt`, get active/selected `WorkflowVersion`,
  enumerate `WorkflowTask`s: `{taskId, name, triggerType, triggerName, nodeCount}`.
- `pathTree(userContext, formKey, workflowVersionId, taskId, includeCustomParameters)` →
  trigger + node tree (`nodeId, type, name, description, customParameters, parentId, children[]`).
- `revision(...)` → cheap hash (like `MirrorFormAccess.formRevision`) to detect source changes.
- Implementation: prefer `APIProvider.WORKFLOW_VERSION_API.getActiveByProject` +
  `WORKFLOW_STATE_API`; fall back to JPQL over `de.xima.fc.jpa.context.EntityContextFactory`
  (same pattern as `AICodBiAssistant.buildWorkflowStructureContext`).

### Servlet action

`WorkflowPathMirrorServletAction` (`action=forms|paths|tree|revision`), JSON responses; bounded
graph payload so large workflows cannot blow up the designer. Reuses `params.getBenutzer()` →
`UserContext` (identical to `MirrorServletAction.backendUser`).

### Node handler

`CodbiWorkflowPathMirrorNodePlugin : APluginActionNodeHandler<CodbiWorkflowPathMirrorNodeProps>`:

- `getPropertiesViewXhtmlName()` → `CodbiWorkflowPathMirrorNode.xhtml` (clone of the accessor node
  XHTML structure + dependent dropdown JS).
- `execute(params)`:
  1. read props; resolve source form + workflow version + task;
  2. build result record;
  3. `params.normalResult()` with a value matching `getSuccessValueDescriptor`.
- `getSuccessValueDescriptor` → record `{ form, path, trigger, nodes[] }`; expose a convenience
  `summary` string and `nodes` list.
- Category: reuse `ECodbiWorkflowElementCategory` (add `SUB_CODBI_WORKFLOW_MIRROR`).
- Icon: new `workflow-path-mirror-icon.svg` served by the `Resource` servlet.

### Designer

- `CodbiWorkflowPathMirrorNode.xhtml`:
  - form select populated from `action=forms`;
  - path select from `action=paths&form=...`;
  - mode select; optional node multi-select from `action=tree`;
  - preview panel (like the accessor’s) showing trigger + node chain;
  - "refresh" button re-fetches `action=revision` and warns when the source path changed.
- JS/CSS resources registered the same way as `workflow-extended-accessor.js/.css`.

### i18n

Add `CodbiWorkflowPathMirror.name/desc/mode.*` keys to
`WEB-INF/properties/i18n_de.properties` / `i18n_en.properties` and
`i18n/workflow-client_*.properties` if palette labels are localized there.

## Runtime / change-propagation semantics (important)

### When is the reflection evaluated?

Workflow nodes execute **server-side when the workflow is triggered** (form submit button /
qualified submit / manual / timer / … — see `EWorkflowTriggerType`). There is **no “form load”
trigger** in FORMCYCLE. Therefore:

- Merely **loading the target form in the frontend does not execute the workflow node** and does
  not recompute the reflection.
- The reflection is recomputed **each time the node actually runs** (e.g. on submit). If it is
  resolved live at execution time, it always reflects the source workflow’s state **at execution
  time**.

### Does a change in the source propagate automatically?

With the recommended **live** resolution (`ACTIVE` mode): **yes** — the next execution reads the
source project’s current persisted `WorkflowVersion`, so a saved change in the source workflow is
visible without re-importing anything into the target form. The target form’s rendered HTML and
its **own** `WorkflowVersion` are untouched; only the node’s computed result changes.

With **`PINNED`** mode: **no** — a fixed `sourceWorkflowVersionId` keeps the old structure until
the pin is updated.

### FORMCYCLE edits the active version in place → version id is not a change detector

The designer save flow mutates the active `WorkflowVersion` and sets its `workflowInvalid` flag so
FORMCYCLE revalidates its cached analysis (`WorkflowVersion.isWorkflowInvalid()`,
`INVALID_VERSION_NUMBER`; see also CodBi’s `touchWorkflowVersion`). Consequences:

- The source `workflowVersionId` can stay the **same** while its tasks/nodes/`customParameters`
  change. Do **not** use the version id alone to detect changes.
- Use a **content revision hash** (same idea as [`MirrorFormAccess.formRevision()`](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/MirrorFormAccess.kt:331))
  over tasks/nodes/triggers/`customParameters` for staleness warnings and for optional caching.
- If the mirror reads **entities/JPQL directly** it sees the committed DB state and bypasses
  FORMCYCLE’s cached flow-graph analysis. If it were to use a cached analysis model instead, the
  source’s `workflowInvalid` tickle would have to be respected to avoid stale data.

### Boundary cases

- A source edit that happens **between target render and submit** is visible at submit (execution
  reads then).
- A source edit **during** the target execution is non-deterministic across reads — read the
  foreign graph once per node execution and work on that snapshot.
- **In-flight processes** keep their already-computed snapshot: results are stored per execution in
  the process log; later source edits do not retroactively rewrite them.

### Frontend display is a separate concern

If the goal is to show the reflected path **while the user fills the form** (before any trigger),
a workflow node cannot do that — workflows run on triggers. That would need a form widget / AJAX
call to a servlet action (same live read), i.e. a different delivery mechanism, not a workflow
node result.

## Risks / edge cases

- **Source changed/removed**: resolve live at execution; surface a `revision` mismatch warning
  (like the Mirror widget’s staleness handling).
- **Version pinning**: pinned versions can be archived — fall back to active with a soft error.
- **Permissions**: foreign project must be readable by the effective user; otherwise return a soft
  error, never throw.
- **Large graphs / loops / deep nesting**: enforce depth and node-count caps in the JSON payload.
- **`customParameters` may contain secrets** (DB/LDAP ids, mail bodies): `FULL` mode should be
  opt-in and the result should be sanitized/marked.
- **Anonymized execution** (`isAnonymize`): decide whether `customParameters` may be exposed.
- **Plugin-node type alias**: if this node is generated by an assistant, add its registered name
  to `WorkflowSpecNormalizer` (same issue as `CodbiExtendedAccessor`).

## Tests

- Kotlin unit tests for `WorkflowMirrorAccess` (task enumeration, tree build, missing project,
  pinned version, revision change) with the same reflection-mocking approach used by existing
  workflow tests (`WorkflowExistingStructureSliceTest`, `ExtendedAccessorResolverTest`).
- Servlet JSON shape test.
- Frontend: dropdown chaining form → path → nodes; stale-source warning.

## Non-goals

- Executing or embedding another form's workflow path inside the current workflow.
- Auto-syncing copied workflow nodes across projects.

## References

- FORMCYCLE 8.5.3 jars: `fc-common`, `fc-api`, `fc-workflow-plugin`, `fc-workflow-processor`,
  `fc-workflow-registry`, `fc-workflow-flowchart`.
- Existing CodBi code:
  `MirrorFormAccess.kt`, `MirrorServletAction.kt`, `XMirror.kt`,
  `CodbiExtendedAccessorNodePlugin.kt`, `AICodBiAssistant.kt` (`buildWorkflowStructureContext`,
  `removeAllWorkflowPaths`, `createWorkflowTask`), `WorkflowSpecNormalizer.kt`.
