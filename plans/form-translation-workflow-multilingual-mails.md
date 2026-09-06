# Whole-form translation → multilingual workflow mails (FC_SWITCH on `[%lang%]`)

Status: implemented in `AICodBiAssistant` + dialog (`ai-assistant.ts`) + prompts + index.json;
pending live validation (needs rebuilt plugin + prompt reseed, then the FS12 scenario).
Follow-up (2026-09-06): a re-run that adds MORE languages now EXTENDS an existing `[%lang%]` mail
`FC_SWITCH` with the missing language cases (see the "Extend, don't duplicate" bullet below) —
the mail pass is live, the ending-page wrap stays parked.

## Goal

When the AI translates a whole form into additional language(s), it should also make the
existing consumer-facing workflow mails language-aware: at every point a lane sends a mail /
DOI invitation to the consumer, insert (or extend) an `FC_SWITCH` whose value is the language
the form was filled out in, with **one branch per form language** — the ORIGINAL mail stays on
the branch of the form's base language, and the other branches get newly generated translated
mail/DOI nodes. Internal / admin / error mails are out of scope by default.

## Verified mechanism — the workflow knows the form language natively

There is **no hidden form field needed**. Formcycle provides a special workflow placeholder:

> **[`[%lang%]`](https://help8.formcycle.eu/de/support/solutions/articles/103000047241-internationalisierung-im-workflow)** —
> "Dieser enthält immer die momentane Sprache, die im Formular verwendet wurde, z.B. `de`, `de-CH` oder `en`.
> Platzhalter können bei den meisten Aktionen und auch in Steuerungselementen wie Bedingung (Wert prüfen)
> verwendet werden." (official Formcycle howto "Internationalisierung im Workflow", help8.formcycle.eu article 103000047241)

Jar ground-truth (8.5.3):
- The language selector is the client-side `XLanguageSwich` plugin widget (options
  `[{text, value}]`, `value` = Formcycle language code). Clicking reloads the form in that
  language, keeping entered values. It is a **render-time property only**; no server-side
  `XLanguageSwitch` item exists in `fc-form-common`.
- The renderer resolves every translatable string per language from the stored i18n
  (`properties.i18n[lang]`, per-option/per-button `i18n`, `formI18n`) via
  `IFD2LanguageProvider` / `XI18nUtils.findBestLanguage` (`fc-form-renderer`
  `FD2FormLanguageProvider`, `FD2SystemLanguageProvider`). Client mirrors it as
  `XFC_METADATA.currentLanguage` / `currentLanguageTag`.
- Workflow conditions/switch branch on **formula placeholders** resolved against the record.
  `FcSwitchExecutor.isMatchesCase(...)` (fc-logic 8.5.3) resolves the switch's
  `FcSwitchProps.switchValue` through a `WorkflowConditionOperandMapper` +
  `SingleConditionEvaluator` / `CompoundConditionEvaluator` (with `env().getLocale()`).
  ⇒ `switchValue: "[%lang%]"` is resolved to the language used for the record, exactly like a
  condition checking `[%lang%]`.
- The engine tracks a per-record locale used for rendering templates/emails/PDFs
  (`LanguageFd2Config(Projekt, Locale)` implements `IXFormRenderConfig`).

## Target workflow shape

Existing linear lane … `SEQUENCE` … `FC_EMAIL(de)` … `FC_CHANGE_STATE` becomes:

```
… SEQUENCE …
  FC_SWITCH            (nodeParams.switchValue = "[%lang%]")
    ├─ case "de"  (SEQUENCE, FcSwitchCaseProps) → FC_EMAIL (original, unchanged)
    ├─ case "en"  (SEQUENCE, FcSwitchCaseProps) → FC_EMAIL (subject/body translated to en)
    └─ default    (SEQUENCE, FcSwitchDefaultProps) → FC_EMAIL (original)   [fallback]
  … original continuation nodes (unchanged) …
  FC_CHANGE_STATE
```

Semantics verified from `FcSwitchExecutor`: a matching case's SEQUENCE children run, the
switch returns a normal result, and the lane **continues with the siblings after the switch** —
so the continuation / endpoint stay where they are and do NOT have to be duplicated per
branch. This is what keeps the transformation a localized "wrap this one node" edit.

Cases = the language codes present on the form after the translation (base/default language +
the newly added language(s), i.e. every key that now appears in `formI18n` / `properties.i18n`).
- Base-language case keeps the mail node byte-for-byte (same subject/body/to/from/attachments).
- Each additional language gets a clone of the mail node with `subject`/`body` (and
  `senderName`) translated into that language; `to`, `from`, attachments, `successPage` /
  `failurePage` (DOI) and all `[%…%]` placeholders stay identical.
- A default branch holding the original mail guarantees delivery when the language matches no
  case (defensive; also matches "original mail stays reachable").
- Extend, don't duplicate: if the mail is already directly behind/inside an `FC_SWITCH` on
  `[%lang%]`, only add/merge the new language case instead of creating a second switch.

Scope per lane: only `FC_EMAIL` / `FC_DOI_INIT` nodes that notify the **consumer** (recipient =
a `[%…%]` email field of the form or the consumer address). Admin/internal/error mails stay
untouched.

## Routing in the assistant — how a translation also reaches the workflow

Current dispatch facts (AICodBiAssistant.kt):
- A "translate the form" request is classified as intent `"form"`; `handleRun` then only runs
  `runFormModification` (form JSON) — the workflow path (`runWorkflowCreation`) runs only for
  `"workflow"` / `"both"` (lines ~1095-1132).
- `runWorkflowCreation` already fetches `existingWorkflowNodes`, triggers, states, inboxes,
  completion pages, etc. and applies create/replace/remove operations on existing nodes.
- Translation must therefore reach the workflow layer explicitly. Server-side *prompt-text*
  intent sniffing is rejected (user: too many phrasings). Instead we reuse the accepted
  **model-declared structured signal** pattern (like `_codbiApplicability`):
  - The whole-form-translation prompt teaches the form AI to also emit a top-level
    `"_workflowMailLanguages": ["<baseLanguageCode>", "<addedLanguageCode>", ...]` marker (base
    language first) whenever the translation ADDS another language. The form AI needs no
    workflow context to emit it — the backend only acts when a workflow version is available.
  - In `handleRun`, after a successful form pass: extract + strip the marker; if it is present
    **and** a `workflowVersionId` was provided, run one dedicated multilingualize pass;
    otherwise the run behaves exactly as today.
- Dialog wiring: `ai-assistant.ts` `runPhase2` now also sends `workflowVersionId` on **form-only**
  runs when a workflow exists (previously workflow/both only) — without the workflow/both hard
  error — so a whole-form translation run reaches the multilingualize pass. When the pass
  succeeds, `handleRun` returns `workflowMessage` alongside `formJson`; the existing
  "formJson + workflowMessage" front-end handling then publishes the translated form and reloads
  the designer so the new switch is visible in the workflow editor.

Dedicated multilingualize pass (implemented: `runWorkflowMailMultilingualization` +
`multilingualizeMailNode` + `applyMailTranslationParams` in `AICodBiAssistant.kt`):
- Feeds the AI `buildWorkflowStructureContext(workflowVersionId, …)` (the full node tree with
  customParameters) + the language list, with the new system prompt
  `codbi.workflow_translate_instruction` (`codbi-workflow-translate-instruction.md`, registered
  in `index.json`), which describes the `[%lang%]` switch pattern and constrains the AI to
  consumer-facing `FC_EMAIL`/`FC_DOI_INIT` only (never internal/admin/error mails, never new
  triggers/lanes/endpoints).
- The AI answers a narrow payload: `{"mails":[{"targetNodeId":"<id>","translations":{"<lang>":{"subject":…,"body":…,"senderName":…}}}]}` —
  per node only the non-base languages, translating subject/body while `to`/`from`/attachments/
  DOI pages and every placeholder are preserved (the base language keeps the ORIGINAL mail text).
- The backend does the deterministic DB surgery (no brittle op parsing): converts the chosen mail
  node in place into an `FC_SWITCH` (`switchValue:"[%lang%]"`), creates one `FC_SWITCH_CASE` per
  form language (base = original params verbatim, others = translated clones) plus a trailing
  `FC_SWITCH_DEFAULT` (original mail) — each branch containing a `FcSequenceHandler` SEQUENCE with
  the mail, mirroring `createWorkflowTask`'s FC_SWITCH shape. Formcycle requires the
  `FC_SWITCH_DEFAULT` as the FIRST child (parent_order_idx 0) or the switch is invalid, so the default
  branch is created first and the language cases follow it. The lane's following nodes stay after the
  switch, so no endpoint is duplicated.

## Prompt changes

- `codbi-form-structure-rules.md` (WHOLE-FORM TRANSLATION section) — add a paragraph: when the
  form's workflows contain consumer mails, the run also multilingualizes them (see the
  workflow-translation instruction); emit the `_workflowMailLanguages` marker listing the
  language codes this translation adds, and keep the form output otherwise translation-only.
- `formcycle-general.md` — one bullet mirroring the above (same classpath source, DB-seeded).
- New `codbi-workflow-translate-instruction.md` (key `codbi.workflow_translate_instruction`,
  registered in `index.json`) documents the `[%lang%]` placeholder and the wrapping rules: which
  nodes count as consumer-facing, translate only subject/body/senderName, clone
  `to/from/attachments/DOI pages/placeholders`, base language = original mail, never new
  triggers/endpoints. (`formcycle.workflow_nodes` is unchanged.)
- `codbi-classify-intent*` — unchanged (translation stays "form"; the workflow pass is driven by
  the form AI's structured marker + presence of a workflow version).

## Backend changes (implemented)

- `AICodBiAssistant.kt`:
  - `handleRun` extracts the top-level `_workflowMailLanguages` marker from the form-AI result,
    strips it from the emitted `formJson`, and — when the marker is present, `_removeAll` is not
    requested and a `workflowVersionId` was provided — calls
    `runWorkflowMailMultilingualization(...)`; its message is appended as `workflowMessage`.
    The multilingualize block sits OUTSIDE the workflow/both path, so no submit-button
    auto-ensure / trigger binding ever runs for a translation.
  - New `runWorkflowMailMultilingualization`, `multilingualizeMailNode` and
    `applyMailTranslationParams` (reflection over the Formcycle node API; FC_SWITCH branch shape
    mirrors `createWorkflowTask`: `FC_SWITCH_DEFAULT` at index 0 = FIRST child, then the language
    cases). Extension re-runs the order via `ensureSwitchDefaultFirst` (heals default-last switches).
  - The multilingualize runner feeds the model ONLY a **condensed candidate list of the existing
    FC_EMAIL / FC_DOI_INIT nodes** (id, name, type, description, params) plus an explicit "output
    ONLY the mails JSON" rule — not the whole workflow tree (feeding the full tree made the model
    echo the workflow back instead of answering, so no switch was created). It never fails the
    already-successful form translation when the optional pass yields nothing.
  - The candidate collector descends through both `children` AND the task-level `rootNode` of the
    workflow-structure JSON (the node tree is nested under `rootNode`; without descending into it the
    collector found zero mail nodes and skipped the wrap — observed "no FC_EMAIL/FC_DOI_INIT node
    found - nothing to wrap").
  - **The AI decides which mails are consumer-facing** (no server-side filter — a deterministic
    filter can never cover every way a mail is destined to the consumer or an internal office). The
    model must return an explicit `toConsumer` boolean for **EVERY** candidate node in a single pass
    (verdict + translations together). The runner validates that no candidate lacks a verdict and
    **retries once with a strict schema instruction listing the missed ids** when any candidate is
    missing a verdict or the reply is unusable; only the nodes the model itself marks
    `toConsumer=true` are wrapped, internal/back-office/error mails stay untouched. The workflow-
    translate prompt gives intent-based guidance (who reads the mail and what it is for) instead of
    keyword lists or recipient-string heuristics. Motivation (live): the AI alone over-wrapped
    "Benachrichtigung für die Sachbearbeitung", "E-Mail an Kasse" and almost every other FC_EMAIL.
  - **Re-running a translation on an already-multilingual workflow EXTENDS the existing `[%lang%]`
    switch instead of wrapping again** (implemented): the candidate collector now emits two kinds —
    `"MAIL"` (a plain `FC_EMAIL`/`FC_DOI_INIT` to wrap) and `"SWITCH"` (an existing `[%lang%]`
    `FC_SWITCH` that already carries translated mail clones, reported with its `existingCaseLanguages`,
    `defaultBranchId` and the first clone's `sourceType`/`sourceParams`) — and it does NOT descend into
    a handled `[%lang%]` mail switch's subtree (its clones are extended, never re-wrapped). The model
    is told to translate a SWITCH only into the FORM LANGUAGES missing from its `existingCaseLanguages`
    (translating from `sourceParams`). The apply loop dispatches per kind: a SWITCH candidate goes to
    the new `extendMailSwitchNode`, which appends one `FC_SWITCH_CASE` (+ `SEQUENCE` + translated mail
    clone named "<base> (<lang>)") per added language under the SAME switch and then re-orders the
    `FC_SWITCH_DEFAULT` to the very end (native `MAX(parent_order_idx)` + `forceChildIndex`) so the
    executor's last-child fallback still lands on the default branch. Example: a form already carrying
    a de/it switch, then "Übersetze das Formular ins Englische und Französische." → log
    `Extended existing FC_SWITCH … with new language case(s): en, fr`, en/fr mail branches before the
    default, widgets translated to en/fr.
- `AIFormAssistant.kt`: form-only assistant (no workflow access) — a
  `stripWorkflowMailLanguagesMarker` helper removes the marker from both of its form-output paths,
  so the marker can never be persisted as a form property if that flow's AI emits it.
- **Blind-pass guard (both assistants)**: when the form-AI response declares the
  `_workflowMailLanguages` marker, the CodBi "blind" re-evaluation pass is SKIPPED — even if the
  model omitted `_codbiApplicability` entirely. A whole-form translation only adds per-language
  text fields and never a CodBi element, so that second pass (which re-sends the whole large form
  and can exceed the model's output limit → "AI returned invalid JSON") must never run for it.
  The form-AI user-content reminder also now asks for `_workflowMailLanguages` + verdict "none".
- `ai-assistant.ts` (`runPhase2`): sends `workflowVersionId` on form-only runs when a workflow
  exists (never a hard error), so a whole-form translation run reaches the multilingualize pass.

## Tests / docs

- Extend `plans/form-assistant-whole-form-test-prompts.md` with an FS12 scenario: multilingual
  form + an existing submit lane that sends a confirmation mail to the consumer's email field →
  expect one FC_SWITCH with `switchValue [%lang%]`, cases per language, base branch = original
  mail, extra branches = translated clones, continuation unchanged; the back-office/admin mail
  nodes (marked `toConsumer: false` by the AI) stay untouched.
- `CHANGELOG.md` entry.
- DB reseed note: `AI_FormAssistant_Prompt_Reseed=true` or clear
  `codbi.form_structure_rules` / `formcycle.general` (+ the new workflow-translate row) so the
  new prompts take effect.

## Open items to confirm with live Formcycle during testing

1. Designer rendering of an `FC_SWITCH` placed as a mid-lane node (with following siblings in
   the same lane) — implemented as a wrap-in-place; verify visually after the first run.
2. RESOLVED in code: `SingleCaseValue` params are written as
   `{"caseValue":"<lang>","matchCondition":"EQUAL","variableName":"C1"}` (matching
   `createWorkflowTask` and the bean fields `getCaseValue` / `getMatchCondition` /
   `getVariableName`).
3. Region tags: the marker carries the form's EXACT language codes and the case values use them
   verbatim. If a form stores a full tag (e.g. `de-CH`) the case matches it exactly — confirm at
   runtime whether a short-code fallback (CONTAINS) is also needed for robustness.
