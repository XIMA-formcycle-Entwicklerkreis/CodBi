# Whole-form translation → multilingual Abschlussseiten (ending pages), reuse-only

Status: IMPLEMENTED (2026-09-06) in `AICodBiAssistant.kt`; pending live validation. Replaces the
earlier PARKED "server-side page creation" plan (creation of TEMPLATE_CLIENT rows is impossible from
the plugin: no JPA entity maps the table, `TEXTVALUE` is encrypted at rest, no creation
API/DAO/service is shipped, only `AppointmentTemplateAPI` exists on `APIProvider`). The
implementation **never creates or edits a page** — it only wraps consumer-ending-page workflow nodes
into an `[%lang%]` switch and points each language case at an **already existing** localized page,
falling back to the ORIGINAL page when no localization exists.

Feasibility of the reuse-only approach (verified against the codebase):
- The page content is never needed. The wrap only swaps the `htmlTemplate` `UuidEntityRef` target —
  [`applyEndPageTranslationParams()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:7853)
  is a content-free uuid rewrite (preserves `entityClass`/`type`/all other params).
- Page NAME + UUID are plain-text readable from `TEMPLATE_CLIENT` via native SQL — the exact pattern
  already used by
  [`fetchHtmlTemplates()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:5626)
  and
  [`resolveHtmlTemplateUuid()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:13671)
  (strategy 3). Only NAME/UUID are selected; encrypted `TEXTVALUE` is never read.

## Localization naming convention (confirmed by the user)

- A localized Abschlussseite is the base page's NAME plus a `_CB_<LANG>` marker, e.g.
  base `Formular versendet` → `Formular versendet _CB_EN` / `Formular versendet _CB_DE`.
- Language code is UPPERCASED; compound/region tags keep the hyphen, e.g. `de-CH` → `_CB_DE-CH`.
- The base page = the page the `FC_SHOW_TEMPLATE` node currently references (no marker).

Matching rule for language `lang` against a base page `baseName`:
1. `marker = "_CB_" + lang.trim().uppercase()` (region hyphen kept).
2. A candidate localized page must: start with the base page's name (case-insensitive, trimmed) AND
   contain `marker` as a substring.
3. Prefer the exact form `<baseName> <marker>`; else any other start-with-base + marker row.
4. None found ⇒ **no localization** ⇒ that language case falls back to the ORIGINAL page (per the
   user: "just put the original abschlussseite if there is no localization").

## Scope / trigger

Same trigger as the mail multilingualization (already implemented & live): a whole-form translation
that adds languages emits `_workflowMailLanguages` (base first), or the structural fallback
`deriveWorkflowMailLanguagesFromForm` derives the list from the returned form's `i18n`. When that
list is present, `!removeAllRequested` and a `workflowVersionId` exists, `handleRun` runs:

1. the existing `runWorkflowMailMultilingualization` (mails — unchanged), then
2. the NEW end-page pass `runEndPageMultilingualization` with the SAME language list, each pass
   appending its own `workflowMessage`. The end-page pass re-builds the workflow context internally,
   so it sees the mail switch created by pass 1 (never a problem: pass 2 only handles
   `FC_SHOW_TEMPLATE` nodes).

No new marker, no new front-end field, no prompt-DB reseed needed for the end-page pass (its system
prompt is built inline, as the parked code already does).

## Consumer-reachability decision (AI verdict, mirrors the mail pass)

The user mandated earlier (mails) that a deterministic server-side filter is unacceptable — the model
must decide consumer-facing per node. The same applies here: a "success page" node on a consumer lane
is an Abschlussseite to multilingualize; an internal processing/error template shown to staff is not.
The end-page pass therefore:
- sends ONLY a condensed candidate list of `FC_SHOW_TEMPLATE` nodes (never the whole tree — the mail
  pass proved full-tree feeds make the model echo the workflow back), plus the form-language list;
- the model returns `{"pages":[{"targetNodeId":"<id>","toConsumer":true|false}, …]}` — verdict only,
  NO translations and NO page content (pages are reused, never generated);
- validates every candidate has a verdict and retries ONCE with a strict schema instruction listing
  missed ids (same pattern + messages as
  [`runWorkflowMailMultilingualization()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:6690));
- never fails the already-successful form translation when the pass yields nothing usable.

The `_CB_<LANG>` page mapping is done DETERMINISTICALLY by the backend (never by the model), so the
model can never invent a page or a uuid.

## Backend changes (all in `AICodBiAssistant.kt`)

1. **Re-enable the call site in `handleRun`** next to the mail block
   ([lines ~1142–1168](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:1142)):
   after the mail pass, inside the same `mailLanguages != null && !removeAllRequested` guard and its
   own try/catch, call the reworked `runEndPageMultilingualization(...)` and append its message to
   `workflowMessage` when non-blank.

2. **New server-side page enumeration** `listClientTemplates(userContext, workflowVersionId): List<Pair<String /*name*/, String /*uuid*/>>?`:
   - resolve the owning client/mandant id of the workflow: `workflowVersion.project` then try
     `project.getClient().getId()` / `project.getMandant().getId()`; fall back to the user context's
     client; else log + return null (skip the pass — never guess).
   - native SQL over `TEMPLATE_CLIENT`: `SELECT UUID, NAME FROM TEMPLATE_CLIENT WHERE CLIENT_ID = :cid`
     (filter `FLAG_DEPRECATED`/`FLAG_SYSTEM` when present, via the information_schema column check
     pattern already in
     [`fetchHtmlTemplates()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:5790)).
   - log the count + a sample so the real names can be confirmed on the first live run.

3. **New matcher** `findLocalizedTemplate(baseName, langCode, templates): Pair<String,String>?`
   implementing the naming rule above (start-with-base + `_CB_<LANG>`; case-insensitive).

4. **Rework the parked `runEndPageMultilingualization`**
   ([8053](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:8053)):
   - collector reads each `FC_SHOW_TEMPLATE` node's `htmlTemplate.uuid` (already done) and resolves the
     page NAME from the enumeration (NOT via the encrypted `readTemplatePage`).
   - additionally emit `"kind":"SWITCH"` candidates for an existing `[%lang%]` FC_SWITCH whose subtree
     contains an `FC_SHOW_TEMPLATE` clone (a previously multilingualized ending page) with its
     `existingCaseLanguages`, `defaultBranchId` and the first clone's params — and do NOT descend into
     that subtree (mirrors the mail collector so repeat runs never double-wrap; see
     [`collectMailCandidates()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:6807)
     / [`analyzeLangSwitch()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:6748)).
   - system prompt: verdict-only payload (no page content); guidance on what a consumer Abschlussseite
     is vs an internal template.
   - apply dispatch per kind, mirroring the mail apply loop
     ([~7037–7101](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:7037)):
     - `MAIL`-like plain `FC_SHOW_TEMPLATE` → `multilingualizeEndPageNode(...)` with a
       `langPages: Map<lang, Pair<uuid,name>>` built by `findLocalizedTemplate` for every non-base
       language that has a localization (missing ⇒ fall back to the ORIGINAL page automatically, the
       node function already falls back to `origParams` when the entry is absent);
     - `SWITCH`-kind → new `extendEndPageSwitchNode(...)` (below).
   - keep `langs.size < 2 → return ""` guard, per-pass touchWorkflowVersion + summary message.

5. **Adapt `multilingualizeEndPageNode`**
   ([7873](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:7873)):
   already wraps in place (FC_SHOW_TEMPLATE → FC_SWITCH on `[%lang%]`, one `FC_SWITCH_CASE` per
   language: base + trailing `FC_SWITCH_DEFAULT` = original params verbatim, non-base case =
   `applyEndPageTranslationParams(origParams, localizedUuid)`). Update its clone NAMING to
   `<localizedPageName>` when a localization is used so the workflow editor shows which page each case
   shows.

6. **New `extendEndPageSwitchNode(workflowVersionId, targetNodeId, addLanguages, langPages, sourceParams, defaultBranchId, userContext)`**:
   line-for-line mirror of the just-shipped
   [`extendMailSwitchNode()`](../src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/cb/AICodBiAssistant.kt:7302)
   but the per-branch clone is an `FC_SHOW_TEMPLATE` whose params = `applyEndPageTranslationParams(sourceParams,
   localizedUuid)` (or `sourceParams` when no localization). Reuses the same
   `fixParentOrderIndex`/`forceChildIndex`/default-last handling and the same
   `Extended existing FC_SWITCH … with new language case(s): …` log message.

7. **Dead creation-era helpers**: after this ships, the page-CREATION machinery
   (`ensureEndPageForLanguage`, `setTemplateText`, `setNewUuid`, …) is definitively obsolete; move the
   PARKED banner text to "SUPERSEDED by the reuse-only design" (keep or delete per review — they are
   never called).

## Workflow shape after the wrap (unchanged from the mail design)

```
… SEQUENCE …
  FC_SWITCH                 switchValue = "[%lang%]"
    ├─ case "de"  (SEQUENCE) → FC_SHOW_TEMPLATE (original page, unchanged)
    ├─ case "en"  (SEQUENCE) → FC_SHOW_TEMPLATE (htmlTemplate.uuid → "… _CB_EN" page)
    ├─ case "fr"  (SEQUENCE) → FC_SHOW_TEMPLATE (htmlTemplate.uuid → "… _CB_FR" page, IF found
    │                                              else the ORIGINAL page — no localization yet)
    └─ default    (SEQUENCE) → FC_SHOW_TEMPLATE (original page)   [last = executor fallback]
  … original continuation nodes (unchanged) …
```

## Risks / notes

- **Enumeration scope**: the one thing to confirm live is that the workflow's owning client id
  resolves and that the project's Abschlussseiten live in `TEMPLATE_CLIENT` scoped by that
  `CLIENT_ID`. The first live run logs the resolved client id, the row count and a name sample. If a
  project has several ending pages they are independent base pages, each localized with its own
  `_CB_xx` siblings (matched per base name).
- **Safety net**: when no localization is found the language case shows the ORIGINAL page — never a
  broken/invented reference, never a created page. If the naming differs from the convention above,
  every language silently falls back to the original (no harm) until the match rule is tuned.
- **Idempotency**: a re-run with no new languages changes nothing; a re-run that ADDS a language
  EXTENDS the existing `[%lang%]` ending-page switch (never double-wraps).
- **Prompt file**: no new/edited prompt resource (inline system prompt) ⇒ no DB reseed for the
  end-page pass. The form prompts that already teach `_workflowMailLanguages` need NO change (the
  same marker drives both passes).

## Docs

- `CHANGELOG.md` + this plan: describe the reuse-only ending-page multilingualization.
- Re-validation scenario: rebuild/deploy; on a de/it form run "Übersetze das Formular ins Englische
  und Französische." while server Abschlussseiten exist as
  `Formular versendet` / `Formular versendet _CB_EN` / `Formular versendet _CB_FR`. Expect the log
  `Wrapped ending-page node … into FC_SWITCH on [%lang%]` (or `Extended existing FC_SWITCH …` on a
  later run) and the en/fr `FC_SHOW_TEMPLATE` cases referencing the `_CB_EN`/`_CB_FR` pages; remove
  `_CB_FR` and re-run to see the fr case fall back to the ORIGINAL page.
