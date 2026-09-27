# Apply a change-log entry to the form/workflow WITHOUT an inference

Status: **implemented for form elements (2026-09-27).** The change-log button **never** runs an
inference: it always calls the backend `ApplyLogEntry` action. Entries that carry the elements use
the stored `items` payload; entries recorded before that column existed are RECONSTRUCTED from the
entry's change description (`reconstructItems`). Per-element/per-node buttons and the workflow-node
payload are the remaining steps (§6).

## 0. What is implemented

| Piece | Where |
| --- | --- |
| `items` CLOB (full resolved items + parent/index, `created`/`changed`/`removed`) and `applied_from` on the change-log row | [`CodbiAiAssistantLog`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/CodbiAiAssistantLog.kt:24), changeset `codbi-ai-assistant-log-11` in [`codbi-ai-assistant-log-changelog.xml`](../src/main/resources/db/changelog/codbi-ai-assistant-log-changelog.xml:186) |
| Payload built for every run (`created`/`changed`/`removed` with parent + index) and stored | [`AiAssistantLog.computeAppliedItems()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AiAssistantLog.kt:674), recorded at [`AICodBiAssistant.kt:2031`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:2031) |
| Log response exposes `hasItems` + `itemNames` per entry (the payload itself stays server-side) | [`AiAssistantLog.loadLogs`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AiAssistantLog.kt:347) |
| New `ApplyLogEntry` action (no AI): merges the entry's items into the form sent by the frontend and returns it | [`AICodBiAssistant.handleApplyLogEntry()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:726) |
| The `_cb_ressurected_<N>` rule (separate counters for id and name) | [`applyLoggedItems()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:802) |
| Zero-cost traceability row (`intent="apply"`, `applied_from=<entry id>`) | [`AICodBiAssistant.kt:775`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:775) |
| Frontend: `onApplyAgain()` ALWAYS calls `applyLogEntryToCurrentForm()` (POST + `loadPersistJson` + `publish`, no model, no `ensureElementsLoaded`, no AI fallback) with the new confirm/success texts | [`AiAssistant.onApplyAgain()`](../src/main/web/packages/designer/Angular/Components/codbi-apidoc/projects/manager/src/app/ai-assistant/ai-assistant.ts:762) |
| Reconstruction (old entries, no `items`): `widgetsCreated` + `attributesSet` + `classesSet` → restorable elements, including the NESTED `data-cb-*` parameters of a functionality | [`AiAssistantLog.reconstructItems()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AiAssistantLog.kt:875) |
| A reconstructed element carries no id (the description never stores one) → one is minted with the same `_cb_ressurected_<N>` scheme, so a duplicate id can never be introduced | [`applyLoggedItems()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:848) |
| **Persist-shape fix (why a restored element was invisible in the designer):** Formcycle stores a FLAT `items` array in tree order in which a container references its children by NAME in `properties.elements`. The old code spliced the item OBJECT into such a name list, so the element never entered `items` (and `parent` came out `null`). Both shapes are handled now: the OBJECT goes into `items`, its NAME into `container.properties.elements` | [`insertLoggedItem()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:977), [`isFlatForm()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:1064), [`collectItemLocations()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AiAssistantLog.kt:824) |
| **CREATED vs CHANGED.** A CHANGED element is applied to the element that is already in the form ([`mergeLoggedState()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:1108)) and is NEVER inserted — inserting it is what resurrected a duplicate page/header/footer. A CREATED page the form already has is skipped as well (its elements attach through the parent lookup) | [`applyLoggedItems()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:818) |
| **A HEADER / FOOTER is never created by a restore** (`NEVER_RESURRECTED = {XHeader, XFooter}`) — a second one can only break the layout. A recorded change to it is merged into the existing one, and the elements recorded below it are inserted into the header/footer the form already has (via the logged parent's `className`); only when the form has none do they fall back to the last page | [`NEVER_RESURRECTED`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:1082), [`insertLoggedItem()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:1023) |
| Bug fixes found while wiring this up: change-log-shaped attributes inside `properties.attributes` are canonicalised ([`restoreStrippedFields`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:6876)) and the renderer is null-safe ([`FormRenderCallback`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/FormRenderCallback.kt:100)) | |
| Tests: id/name collision → `_cb_ressurected_1`, `_2`; free id untouched; per-element selection; unknown selection; the FLAT shape (object into `items` + name into the page's `elements`, sibling order kept); structural rules (a changed page is merged, a header/footer is never created, its elements go into the existing header, a changed footer is merged); a logged element that no longer exists (restored as the entry left it) and one whose container is gone (appended to the last page); reconstruction (created/changed, booleans, `cssclasses`, nested func params, null cases, minted ids) | [`ApplyLogEntryTest`](../src/test/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/ApplyLogEntryTest.kt:1) (22 tests, green) |

`AiAssistantLog.computeFormChanges` (the summaries) is unchanged — it still drives the change-log
TREE; the `items` payload is the extra data the re-apply needs.

## 1. What the button does today

[`AiAssistant.onApplyAgain()`](../src/main/web/packages/designer/Angular/Components/codbi-apidoc/projects/manager/src/app/ai-assistant/ai-assistant.ts:767)
re-runs the whole assistant with the entry's `prompt`
([`runPhase2()`](../src/main/web/packages/designer/Angular/Components/codbi-apidoc/projects/manager/src/app/ai-assistant/ai-assistant.ts:3698))
— pass-1 + pass-2 against the CURRENT form, billed like any run. The backend then records a second
log entry. The confirmation text says so explicitly:

> "Hierdurch wird der Assistent mit der Anfrage dieses Log-Eintrags erneut auf das AKTUELLE Formular
> angewendet. Die Inferenz wird abgerechnet."

## 2. Is everything in the log? — No, and that is the blocker

Verified in the code:

* `AiAssistantLog.computeFormChanges()` ([`AiAssistantLog.kt:571`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AiAssistantLog.kt:571))
  stores only **summaries**: `widgetsCreated` / `widgetsRemoved` are `widgetSummary(item)` entries,
  `classesSet` / `attributesSet` contain **only the changed** attributes/classes
  (`{ name, value, kind, codbi }`), plus `variablesSet`.
* The entity ([`CodbiAiAssistantLog.kt:24`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/CodbiAiAssistantLog.kt:24))
  has `form_changes`, `workflow_changes`, `clarification`, `chat_reply`, `trips` — **no column that
  holds the built elements/nodes**.
* `workflowChanges` is the `nodeLog` array `{ name, trigger, elements, status }` (labels, not specs).

So the full element/node JSON is **not** recoverable from an existing entry → a deterministic
re-apply is impossible for old entries, and the log must be **enriched from now on** (the user's
second question — yes, that is exactly the fix).

## 3. Design

### 3.1 Enrich the log (once, going forward)

New nullable `@Lob` column `items` on `codbi_ai_assistant_log` (plus one Liquibase changeset in
[`codbi-ai-assistant-log-changelog.xml`](../src/main/resources/db/changelog/codbi-ai-assistant-log-changelog.xml)),
holding the **resolved** post-processed objects:

```json
{
  "form": {
    "items":   [ { "item": { …full form item… }, "parent": "<container name | null>", "index": 3 } ],
    "removed": [ { "name": "tfOld", "className": "XTextField" } ]
  },
  "workflow": {
    "nodes": [ { "spec": { …full node spec (name, type, params, trigger)… }, "trigger": "<trigger name>" } ]
  }
}
```

Filled from the *resolved* form/workflow (after `restoreStrippedFields` / the deterministic
post-processing), not from the raw AI response, so what is re-applied is exactly what was built.
`parent` + `index` are taken from where the item actually ended up → re-insertion is
position-faithful. A second nullable column `applied_from` (long) marks rows created by a
no-inference apply (so the log can show "applied from entry #N, no inference").

### 3.2 New servlet action `applyLogEntry` (no AI call)

In [`AICodBiAssistant.execute()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:372)
next to `run` / `logs` / `sensitiveCheck` / `models` / `availableElements`:

| param | meaning |
| --- | --- |
| `entryId` | the log row to re-apply |
| `item` (optional) | only this element **name** (per-node button) — omitted = every item of the entry |
| `node` (optional) | only this workflow node name (per-node button) |
| `formKey` | the form the log panel is showing (guard that the entry belongs to it) |

Algorithm (form part):

1. load the entry, parse `items.form.items` (absent → return a clear "recorded before the log
   carried element data" error, so the UI can offer the old AI re-run instead);
2. parse the CURRENT `persistJson`;
3. for every selected item — **collision rule (per the user's instruction)**:
   * if `properties.id` already exists in the current form → the incoming item gets
     `properties.id = "_cb_ressurected_" + N` where **N is the smallest integer ≥ 1 that is free**,
     computed over the current form's ids **and the ids already assigned in this batch** (so several
     resurrected elements in one apply get 1, 2, 3 …);
   * the same suffix is applied to `properties.name` **when that name already exists** — a duplicate
     technical name is invalid in Formcycle, so the rule is extended to the name (documented
     deviation, same counter);
4. insert the item at the recorded `parent`/`index` (parent gone → append to the recorded page, else
   to the last `XPage`, else to root `items`);
5. run the existing deterministic post-processing (`normalizeFinalFormStructure`,
   `applyRemovedItems`, …) — **no AI, no `splicePass2IntoPass1`**;
6. persist + publish exactly like a normal run, then record a log row with the same `items` and
   `appliedFrom = entryId`, `tokens = 0`, `cost = 0`.

Workflow nodes: the same rule on the node's name/id, inserted under the recorded trigger/parent
through the existing `applyWorkflowOperation` / `createWorkflowTask` path, with the stored spec.

### 3.3 Frontend

* [`LogTreeNode`](../src/main/web/packages/designer/Angular/Components/codbi-apidoc/projects/manager/src/app/ai-assistant-log/log-tree-node.ts:203)
  already renders the button per entry and recurses; extend `canApplyAgain()` to also offer it for
  workflow-node entries and per **element/node** child entries (the item payload is the node's own
  JSON), and pass the node's `name` as the `item`/`node` param.
* `AiAssistant.onApplyAgain()` posts to `applyLogEntry` (no model needed, no spinner text about an
  inference, no `ensureElementsLoaded`, no clarification replay) and reports "applied without an
  inference" on success.
* The confirm text becomes: *"Die in diesem Log-Eintrag erzeugten Elemente werden DIREKT (ohne
  erneute KI-Anfrage und ohne Abrechnung) in das AKTUELLE Formular übernommen; bereits vorhandene
  IDs erhalten ein `_cb_ressurected_N`."*
* Entries without `items` (recorded before this change) are **reconstructed** from their change
  description on the backend, so the button never falls back to an inference and the tooltip no
  longer mentions one.

## 4. Tests

* id collision → `_cb_ressurected_1`, next collision → `_cb_ressurected_2`; a name collision gets the
  same counter; no collision → untouched;
* inserting into a recorded container vs. falling back to the last page;
* reconstruction: a created/changed element is rebuilt from `widgetsCreated`/`attributesSet`/
  `classesSet` (`true`/`false` stay booleans, `cssclasses` survive, a functionality's nested
  `data-cb-*` parameters are re-emitted), a description without element data yields nothing, and a
  reconstructed element is inserted with a minted unique id — a second apply cannot duplicate ids.

## 5. Open points

* Old entries ARE re-appliable without an inference: `reconstructItems` rebuilds what the AI set
  (label/`rtevalue`/helptext/…, CSS classes, functionalities incl. their parameters) from the change
  description. The description does not know the container (nor the Formcycle `id`), so such elements
  are appended to the LAST page (name reference in `properties.elements` + the object in `items`) and
  get a fresh `_cb_ressurected_<N>` id. Formcycle defaults the AI did not set are not restored.
* The same container fallback applies to entries whose stored `items` was written by the earlier code
  (before the container was recorded): their `parent` is `null`, so they also land on the LAST page.
  Newly recorded entries carry the container (and the position inside it) and are therefore restored
  exactly where they were built. A recorded position is only honoured inside the container it was
  recorded in — with a substituted container the element is appended instead.
* An element the log carries but the form does not have (deleted since, or never present) is **restored
  as the entry left it**: a CREATED one is re-inserted (with `_cb_ressurected_<N>` only when its id or
  name is taken again), a CHANGED one has nothing to merge onto and is therefore inserted as well —
  keeping its recorded identity when that is still free. A container that no longer exists is replaced
  by the header/footer (if that was its type) or by the last page.
* Structural elements: a CHANGED page/header/footer is merged onto the existing element (never added a
  second time), a `XHeader`/`XFooter` is never created at all, and an element whose recorded container
  is a header/footer goes into the header/footer the form already has. A created page whose name the
  form already has is skipped (its elements attach to that page). A `XHeader`/`XFooter` that the form
  genuinely lacks its elements fall back to the last page, because a header/footer must never be
  created by a restore.
* The log response's `hasItems` reflects only the STORED payload; an entry with `hasItems == false`
  can still be applied (reconstruction), so the UI must not hide or disable the button for it. The
  `forceExecute` request flag (skip the chat classification) is intentionally kept on the backend as
  an API capability, but the UI no longer has a path that needs it — re-apply never runs phase 2.
* The `properties.name` suffix is an extension of the requested rule (duplicate names are invalid in
  Formcycle). It uses its OWN counter, so a batch of resurrected elements still gets
  `_cb_ressurected_1`, `_2`, … for the ids.
* The merge inserts at the recorded parent/index; when the recorded container is gone it falls back
  to the recorded page, then the LAST `XPage`, then the form root. The elements the entry REMOVED are
  stored but not re-applied.
* The backend records a zero-cost "apply" row, so the change log shows the re-application and the
  source entry (`applied_from`).

## 6. Remaining steps

* **Per-element / per-node buttons.** The backend already accepts `item` (element name or id) and
  `ApplyLogEntryTest` covers it; the log TREE must offer the button on element/workflow-node child
  nodes (and emit `{...entry, itemName: <name>}`, which `onApplyAgain` already forwards).
* **Workflow nodes.** `items` currently carries the form part only; the workflow part needs the full
  node specs (the `nodeLog` array holds labels), inserted through `applyWorkflowOperation` with the
  same `_cb_ressurected_<N>` rule.
