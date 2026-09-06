# Whole-form translation into several languages → ONE LANGUAGE PER AI PASS

Status: IMPLEMENTED (2026-09-06) in `AICodBiAssistant.kt`; pending live validation. Fixes the
observed live failure where "Übersetze das Formular ins Englische und Französische." on a large form
returned a single AI response of ~15 587 chars that was truncated mid-JSON ("Form AI returned
unparseable response"), aborting the whole run BEFORE the mail / ending-page multilingualization.

## Goal

When a user prompt asks to translate the WHOLE form into TWO OR MORE NEW languages at once, do NOT
let one AI response carry every translation. Execute the languages ONE AFTER ANOTHER: one
`runFormModification` pass per language, each outputting only the base form + that single language,
then merge the per-language i18n into one final form. After the merge, run the ONE combined workflow
multilingualization (mails + ending pages) for the full base-first language list — which already
handles many languages and the extend-existing-`[%lang%]`-switch case.

## Why base-only input for every pass

Feeding each later pass the *cumulative* form (base + already-added i18n) does NOT shrink the pass
output — the model echoes the previously added languages too, so pass N is as big as the combined
run and truncates again. Therefore every pass gets the **ORIGINAL persist** and a strong instruction
to translate ONLY its own language; the per-language i18n is merged server-side afterwards.

## Implementation (all in `AICodBiAssistant.kt`)

1. `promptHintsTranslation(prompt)` — cheap **fallback-safe gate**: only decides whether it is worth
   asking the AI whether a multi-language whole-form translation was requested. The AI decides the
   actual languages and whether it is a translation — never keyword parsing. Gate false → normal
   single pass runs unchanged (no extra AI call).
2. `planWholeFormTranslation(prompt, persistJson, modelId, instance)` → `(isMultiTranslation,
   newLanguageCodesInOrder, usage)`: a small AI call (only reached when the gate passes) that reads the
   form's base `lang` + existing i18n languages and returns the NEW languages, in request order, as
   Formcycle codes. Any parse/error → `(false, [])` → normal flow.
3. `runSequentialWholeFormTranslation(...)` → same triple as `runFormModification`: for each planned
   language calls `runFormModification` with the ORIGINAL persist and a per-language prompt
   ("translate the whole form ONLY into '<lang>' … executed ONE AFTER ANOTHER …"). The first successful
   output becomes the carrier; each later pass is merged in with `overlayLanguageI18n`. Sums the token
   usage across passes; propagates an error/prose response like the single-pass path.
4. Merge helpers: `copyLangI18n` (properties-level `i18n[lang]`), `overlayNestedI18n` (per-option /
   per-button / nested object `i18n`, positional within the identical base-derived arrays),
   `overlayElementI18n`, `overlayLanguageI18n` (matches items by `properties.id`/`name`, copies ONLY
   the pass's language). No structural field of the carrier is ever replaced.
5. `handleRun` form block: computes `formBaseLang`, `existingFormLangs`, the plan, `plannedNewLangs`;
   engages sequential mode only when `plannedNewLangs.size >= 2` (otherwise the existing single
   `runFormModification` call is unchanged). After the normal marker extraction + structural i18n
   fallback it overrides `workflowMailLanguages` with the full base-first list (the merged carrier
   only carries the FIRST pass's marker) so the workflow multilingualization runs once for all
   languages.

## Re-validation (live)

- Rebuild/deploy the plugin.
- On a large multilingual-form request ("Übersetze das Formular ins Englische und Französische.")
  expect the log `Whole-form translation executes as per-language passes (base first): de, en, fr`,
  then one `… pass 1/2 for language 'en' completed` + `… pass 2/2 for language 'fr' completed` and
  `Sequential whole-form translation merged 2 language(s)`, and NO truncation / "unparseable
  response".
- Then expect the normal `Derived … / Whole-form translation signaled … for languages: de, en, fr`
  line and the mail pass (wrap/extend `FC_SWITCH`) and — when Abschlussseiten with `_CB_EN`/`_CB_FR`
  exist — the reuse-only ending-page wrap log.
- Verify in the designer that en AND fr i18n (labels, page headers, button/option values) are stored
  and that a single-language prompt ("… nur ins Englische.") still takes the normal one-pass path.
