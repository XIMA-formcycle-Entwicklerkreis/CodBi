# Workflow — Slicing the `existingWorkflowStructure` block (token lever 1)

Status: **STAGE 2 IMPLEMENTED** — Stage 0 + Stage 1 (pure measurement / zero-behaviour-change) landed
earlier; Stage 2 (the two-tier lever: preview pass-1, filtered-full + `instanceIds` demand pass-2) is
now implemented and unit-tested. Stage 3 (corpus validation on a live server) remains OPEN. Reverting
the lever is cheap by construction: the two-tier split engages only above the property threshold, and
setting `AI_Workflow_ExistingStructureCap` back to a huge value restores HEAD behaviour with zero code
change.

Authoritative context: [`plans/formassistant-token-reduction-remaining.md`](formassistant-token-reduction-remaining.md),
item 1 of the workflow-side open levers. The token-reduction programme closed 2026-10-03 with the
explicit caveat that the only **honest** way forward is *remove a transmission, never a rule*, and
that every prompt-byte / wholesale-trim on the workflow path so far **backfired** (Follow-up A, B —
both reverted after measuring *more* tokens). This document designs the one workflow trim that can
be made **lossless**, and stages it so a reversal is cheap and the §5 backfire metric is actually
measurable.

---

## 1. What the block is

[`buildWorkflowSystemPrompt`](`../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:15201`)
appends the `structureBlock` from `existingWorkflowStructure` (= `buildWorkflowStructureContext(wid, uc)`
with `condensed=false`) at [`AICodBiAssistant.kt:15314`](`../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:15314`)
with the preamble *"EXISTING WORKFLOW STRUCTURE (full current content of the nodes listed above —
READ-ONLY reference for modify/replace)"*.

- It ships the **full `customParameters`** of **every** workflow node **and** trigger in a
  parent/child tree, plus `id`/`type`/`name`/`description`.
- It is sent on **every** workflow pass: pass-1, pass-2, and pass-2-retry
  ([`AICodBiAssistant.kt:12270`](`../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:12270)`,
  `:12312`, `:12403`).
- On a wide workflow (many nodes that each carry a big body — `FC_EMAIL` HTML, `FC_WRITE_FORM_RECORD_ATTRIBUTES`
  accumulators, `FC_POST_REQUEST` configs, `FC_SWITCH_CASE` `caseValues` …) this is the **single
  largest** dynamic block in the workflow build, and it is paid repeatedly.

The sibling [`fetchExistingWorkflowNodes`](`../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:15342`)
already produces the **lean** structural list (`id`, `type`, `name`, `parentId` — no bodies), injected
via the `EXISTING_WORKFLOW_NODES` template section. The full-body block is a strict **superset** of it.

---

## 2. Why it cannot simply be trimmed

The model **replaces/modifies** existing nodes by **numeric `id`** and must see the **exact** current
`customParameters` (incl. `triggerParams`) of any node it rewrites, or it will emit a partial
replacement and clobber configuration it could not see (an accumulated server attribute line, a DB
connection, an endpoint `targetState`, a chained-node break/continue target). The preamble explicitly
teaches the FC_WRITE_FORM_RECORD_ATTRIBUTES → `[%$RECORD_ATTR.%]` → FC_EMAIL pattern, which requires
specific bodies in view.

The existing demand-load `need_workflow_node_details`
([`extractWorkflowDetailsRequest`](`../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:5189`))
fetches the **reference schemas** (`node_types.*` / `trigger_types.*`) from the static catalogue
([`PromptLoader.buildWorkflowNodeDetails`](`../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/PromptLoader.kt:1395`))
— **not** the **instance bodies**. So defaulting the block away and relying on the existing request
path would be a data loss (violates invariant §4.3: *anything withheld must be requestable in the
same run*).

---

## 3. The lossless design: two-tier pass split + instance-body demand path

The goal is *remove a transmission, never a rule* (mechanism C/G). Three rules keep it lossless:

1. **Fail-open for small/typical workflows (zero behaviour change).** When the serialized structure
   is under `AI_Workflow_ExistingStructureCap` (new property, default e.g. 4096 chars), pass-1 sends
   the **full** block exactly as today. This is the critical safety valve against the historical
   backfire: the common case is byte-identical to HEAD.
2. **Large workflows → two-tier.** Only when the block exceeds the cap does the split engage:
   - **pass-1** sends the **lean structural list** (`existingWorkflowNodes`) + a **bounded preview**
     (`name`, `type`, `id`, `parentId`, and `customParameters` truncated to a per-node preview cap,
     e.g. 128 chars) + an explicit note that the **full current bodies are sent on the apply pass
     for the nodes the run touches, and are demand-loadable by node id**.
   - **pass-2** re-renders the structure block **filtered to the nodes the model referenced by
     `id`** in its task JSON (the `operation`/`targetNodeId`/replace-by-id fields that
     `looksLikeTask` already recognises), **plus always the chained accumulation nodes needed for
     the preamble's pattern**. The rest stays out.
   - **demand path:** extend the existing `need_workflow_node_details` envelope so a *node-id* list
     (`instanceIds`) requests the matching **instance bodies**; the server re-runs pass-2 with the
     full bodies for exactly those ids. This satisfies §4.3 — nothing is withheld that is not
     requestable in the same run.
3. **The apply pass always sees what it touches.** Filtering on pass-2 is by *referenced id*, i.e.
   in the lossless direction: a node that is rewritten is always present in full.

**Why pass-1 may omit bodies (the one provenance change).** Pass-1's documented job is to *decide and
commit to a plan by id* ([`AICodBiAssistant.kt:12245`](`../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:12245)`));
with the lean list + preview it can still reference any node by id and request its full body on-demand.
The known subtle risk (the plan's form-1b caveat): pass-1 *might* decide to **duplicate** a node it
cannot fully see instead of **extending** it. That is a **quality / definitional** regression, not a
silent data-loss, and it is **bounded to large workflows only** (fail-open keeps the common case
byte-identical). It is the accepted, measured trade-off of the two-tier mode — gated by the corpus
below, not assumed away.

---

## 4. Staging (the plan's "measure first, revert on backfire" discipline)

| Stage | Change | Risk | Acceptance |
|---|---|---|---|
| **0 (pre-requisite, no behaviour change)** | Make the workflow trips **measurable**: add the same `promptChars` / `completionChars` / `cachedIn` to the workflow `reportTrip` rows the form trips already have (currently only the system-prompt `chars` line exists). The §5 backfire metric is `Σ(tokensIn+tokensOut) + trip count`, **never** prompt size | none | `workflow-pass-1/2` rows expose `promptChars`; no payload change |
| **1 (safe state)** | Add the `existingStructure=` **bounded / full** instrumentation + the `AI_Workflow_ExistingStructureCap` property with a huge default so nothing changes | none | system-prompt line reports `existingStructure=full|bounded` and chars |
| **2 (the lever)** | Implement the two-tier split + `instanceIds` demand path only when the cap is exceeded (small = byte-identical) — **DONE** (unit-tested) | medium | corpus below; revert = flip property to huge default (no code revert needed) |
| **3 (validation)** | Run the corpus (below) on the same model before/after; accept only if `Σ(tokens+trips)` drops with **no** definitional defect. Any "duplicated instead of extended", empty `FC_EMAIL` body, or `statusdependent`/clobber defect rejects the lever | — | §4 of the parent plan |

> **Implemented status:** Stage 0 and Stage 1 are **DONE** (landed). Stage 2 is **DONE** (landed,
> unit-tested). Stage 3 (corpus validation on a live server) remains **OPEN**.
> Note on Stage 0: the pre-existing `workflow-pass-1/2/2-retry` `reportTrip` calls already used the
> convenience overload that populates `promptChars`/`completionChars`; the only gap was the strict-JSON
> **retry** passage (`workflow-pass-1-retry`), which counted `tokensIn/tokensOut` via `estimateTokens`
> without a trip — that gap is now closed (it reports through the same convenience overload).
>
> **Stage 2 as built** (`AICodBiAssistant.kt`):
> - `buildWorkflowStructureContext(...)` gained `preview: Boolean = false` and
>   `includeIds: Set<String>? = null`; `addCustomParameters` / `addCustomParametersPreview` helpers emit
>   the full vs truncated `customParameters`. Fail-open (both unset) is byte-identical to HEAD. When
>   `includeIds` is set, exactly those node ids get their FULL body, every other node a bounded preview,
>   and a task's trigger is full iff one of that task's subtree nodes is included.
> - `runWorkflowCreation` computes `structureBounded` once from the FULL block versus
>   `AI_Workflow_ExistingStructureCap` (stable across passes): pass-1 ships the lean preview when
>   bounded; pass-2 (and retry-pass-2) ships filtered-full for exactly the model-demanded
>   `instanceIds`, else keeps the preview.
> - `WorkflowDetailsSignal` + `extractWorkflowDetailsRequest` accept `instanceIds` (numeric ids, all
>   three envelope shapes, deduped, non-numeric dropped).
> - `buildWorkflowSystemPrompt` gained `existingStructureBounded` / `existingStructureDemandedIds`; when
>   bounded the structure-block preamble switches to the two-tier text (full bodies for this run's
>   nodes / demand-loadable by id), and the Stage-1 log line now reports `existingStructure=<full|preview>`.
> - Tests: `WorkflowExistingStructureSliceTest` (demand-path `instanceIds` parsing across shapes,
>   dedupe/drop-non-numeric, and the bounded-mode `buildWorkflowSystemPrompt` fail-open contract).
> - Per the timing constraint (referenced `targetNodeId`s are only parsed from the final task JSON AFTER
>   pass-2), the "filtered by referenced id" of §3/§6 is realised through the `instanceIds` **demand
>   path** — the model asks for the exact existing-node bodies it needs, and pass-2 serves exactly them.

**Revert path (cheap by construction):** the two-tier mode engages only above the property threshold;
setting it back to a huge value restores HEAD behaviour with zero code change. This directly addresses
the reason Follow-up A/B were reverted (they changed the common case unconditionally and had no cheap
off-switch).

---

## 5. Corpus (mandatory before/after)

Reuse the workflow-side prompts already used in the parent plan:
1. **Plain create** ("send a welcome email after the form submission") — small workflow → **must** be
   byte-identical (fail-open asserts the cap is not hit).
2. **Extend an existing multi-node workflow that uses the accumulator pattern** (a repeatable
   container with an FC_WRITE_FORM_RECORD_ATTRIBUTES → `[%$RECORD_ATTR.%]` → FC_EMAIL) — the exact
   preamble pattern; assert the model still updates both the accumulator and the email body
   (the `WfEmailParams`/`runWorkflowCreation` correctness guard).
3. **Replace-by-id** on a large workflow (the one that would exceed the cap) — assert the full body of
   the replaced node (and its chained accumulator) is present on pass-2 and correctly preserved.
4. **Trigger config** — a trigger with `triggerParams` that must survive a modify; assert it reaches
   pass-2 in full for the referenced trigger.

---

## 6. Concrete edits (for the code implementation, in order)

- `AI.kt` / plugin-properties doc-block: add `AI_Workflow_ExistingStructureCap` (Long, default e.g.
  `4096`, chars) + `AI_Workflow_ExistingStructurePreview` (Long, e.g. `128`, per-node preview chars).
- `AICodBiAssistant.kt` (implemented):
  - `buildWorkflowStructureContext(wid, uc, condensed=false, preview=false, includeIds=null)` — the
    `preview` variant keeps the lean id/type/name skeleton + truncated `customParameters` (drops
    `description`); `includeIds` emits exactly those ids FULL + the rest as a bounded preview, and a
    task's trigger is full iff a subtree node is included. Fail-open (`preview=false, includeIds=null`)
    is byte-identical.
  - `runWorkflowCreation`: `structureBounded` is computed **once** from the FULL block versus the cap;
    pass-1 picks the bounded preview when set; pass-2 (and retry-pass-2) re-render with
    `includeIds = requestedInstanceIds` when the model demanded ids, else keep the preview.
    `existingStructureBounded` / `existingStructureDemandedIds` are threaded into
    `buildWorkflowSystemPrompt`.
  - `extractWorkflowDetailsRequest` + `WorkflowDetailsSignal`: accept an optional `instanceIds` list
    alongside `nodes`/`triggers`; when present, `buildWorkflowStructureContext` is re-run with a filter
    to exactly those ids and appended for pass-2.
  - Structure-block preamble: when bounded, the READ-ONLY pledge is replaced by the two-tier text
    (full bodies for this run's / demanded nodes present, the rest demand-loadable by numeric id) — a
    prompt addition, not a rule deletion. The Stage-1 log line reports `existingStructure=<full|preview>`.
  - **Timing note (as built):** the referenced `targetNodeId`s of replace/remove are only parsed from
    the final task JSON AFTER pass-2, so pass-2 cannot self-select "the referenced ids". The
    filtered-full pass-2 therefore is driven by the `instanceIds` the model explicitly demands via
    `need_workflow_node_details`, which is the lossless direction (nothing is withheld that is not
    requestable in the same run).
- Tests (new `WorkflowExistingStructureSliceTest`, landed):
  - `instanceIds` demand parsing across the strict / nested / tolerant envelope shapes.
  - `instanceIds` dedupe + drop-non-numeric; an all-unusable demand is not a request.
  - `buildWorkflowSystemPrompt` accepts the bounded-mode params; fail-open: no-DB fallback result is
    identical with and without the bounded flag.
  - Server-side byte-identical / filtered-full checks (pass-1 preview, pass-2 referenced-id full body,
    no duplicate-extend) need the corpus / live server — part of §5 (Stage 3).
- Instrumentation first (Stage 0–1) so every change is measured against the §4 backfire metric.

---

## 7. Honest risk note

This is the workflow analogue of the form-side **1b** that the parent plan explicitly rated
"medium-high" and deferred. The two-tier mode changes pass-1's view **only on large workflows**, and
the provenance risk (duplicate-vs-extend) is real. It is staged so that: (a) Stage 0/1 land first and
are pure measurement, (b) the common case stays byte-identical by a property threshold with a cheap
off-switch, and (c) the acceptance gate is the backfire metric + the corpus, not an assumption. If the
corpus shows a definitional regression, the correct action is to keep Stage 0/1 (the instruments) and
leave the lever off at the property default — same enforcement the parent plan used for form-1b.
