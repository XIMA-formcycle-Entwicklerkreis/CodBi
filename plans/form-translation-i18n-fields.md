# Whole-form translation → per-language element fields (`properties.i18n`)

Goal: when the user tells the CodBi form AI assistant *"translate the whole form into English"* (or
any language), the form must **not** have its base/default-language texts overwritten. Instead the AI
fills the per-language translation fields, exactly as if a human had switched the designer's **Form
language** selector to English and typed the translations into the editors that appear there.

## How Formcycle stores per-widget translations (verified against fc-form-common 8.5.3)

- The **base/default language** text stays in the element's plain properties
  (`label`, `placeholder`, `legend`, `rtevalue`, …).
- Per-language translations live in an element-local map on the item's `properties`:

  ```json
  "className": "XTextField",
  "properties": {
    "name": "tfVorname",
    "label": "Vorname",                       // base (default) language
    "placeholder": "Vorname eingeben",
    "i18n": {
      "en": { "label": "First name", "placeholder": "Enter first name" }
    }
  }
  ```

- The renderer resolves each translatable scalar property via
  `de.xima.fc.form.common.XItemPropertyI18NUtils.getI18NValue(config, properties, <default>, <prop>)`:
  it reads `properties.i18n[<lang>][<prop>]` for the current language and falls back to the plain
  property otherwise.
- **XSelect options** are translated per option object (XSelect calls
  `getI18NValue(config, <option>, <option.text>, "value", …)`):

  ```json
  "options": [
    { "text": "Ja", "value": "Ja", "i18n": { "en": { "value": "Yes" } } }
  ]
  ```

- **XButtonList buttons** are translated per button object
  (`XButtonDescriptor.getI18nValue/getI18nTitle` → `getI18NValue(config, <button>, <default>, "value"/"title", …)`):

  ```json
  "buttons": [
    { "name": "btnWeiter", "value": "Weiter", "action": { ... },
      "i18n": { "en": { "value": "Next", "title": "Next" } } }
  ]
  ```

- Form-level per-language data (I18N variables, translatable form properties such as the CodBi
  standards/enable props) lives in the top-level `formI18n[<lang>]` map — unchanged by this feature.

## Changes

### Prompts (DB-seeded, classpath sources in `src/main/resources/.../prompts/`)

- `codbi-form-structure-rules.md` (`codbi.form_structure_rules`) — the **WHOLE-FORM TRANSLATION**
  section now teaches the `properties.i18n[<lang>]` mechanism instead of in-place overwriting:
  keep base text, add per-language entries, per-option / per-button `i18n`, never-touch list.
- `formcycle-general.md` (`formcycle.general`) — the **WHOLE-FORM TRANSLATION** bullet mirrors the
  same mechanism (used by both assistants).

### Backend (both form assistants keep the AI's `i18n` and merge it with the original)

- `AICodBiAssistant.kt` (`CodBi_AICodBiAssistant`, the unified designer assistant):
  - Removed `"i18n"` from `STRIPPED_ITEM_PROPS` (so the restore path no longer wipes it).
  - `slimPersistJson` still strips `properties.i18n` from the payload sent to the AI (keeps tokens
    low, prevents copy-paste), but the AI is taught the format via the prompts.
  - New `mergeItemI18n(resultProps, origProps)` in `restoreStrippedFields` merges the AI's emitted
    `properties.i18n` into the ORIGINAL item translations per language/property, so translations of
    other languages and untouched properties are preserved. New AI-created items keep their `i18n`.
- `AIFormAssistant.kt` (`CodBi_AIFormAssistant`) — identical mirror of the same three changes.

### Test/docs

- `plans/form-assistant-whole-form-test-prompts.md` — new whole-form scenario **FS11** (translate to
  English, verify `properties.i18n.en`, per-option/per-button `i18n`, base language unchanged, and
  the second-language merge check).
- This file documents the mechanism and validation steps.

## Notes / scope

- The CodBi evaluation machinery (details request / applied / considered / "blind pass") must NOT run for a
  whole-form translation — a translation changes no CodBi element, and the blind pass re-sends the whole
  large form with the CodBi API (discards the finished translation and exceeds the output limit → invalid
  JSON). This is handled **AI-driven**: like every form output, the translation response MUST carry the
  top-level `"_codbiApplicability"` and set `codbiVerdict:"none"` (with empty `considered`/`applied`), which
  the existing server logic (`jsonDeclaresNothingApplies`) already uses to skip the blind pass. **No
  server-side keyword/intent parsing of the user prompt** is used — the AI (which understands the language)
  decides and signals through its own structured verdict.
- If a given model still omits `_codbiApplicability` on some run, the log shows
  `AI omitted _codbiApplicability entirely — triggering blind CodBi evaluation pass`; that is a model /
  prompt-compliance issue (the rule must be stated even more prominently for that model), not something to
  solve by parsing the user's phrasing server-side.

## Validation steps

1. **Reseed the prompts** so the DB rows pick up the edited `.md` files
   (`AI_FormAssistant_Prompt_Reseed=true` on the plugin config, or clear the prompt table rows for
   `codbi.form_structure_rules` / `formcycle.general`). The classpath `.md` only acts as fallback
   when the DB row is absent.
2. Run FS11 on a German form. Confirm:
   - German `label`s unchanged in `properties`, `properties.i18n.en.label` added.
   - Options/buttons get per-object `i18n` (English) while their `text`/`value`/`name`/`action` are
     untouched.
   - Publishing and switching the Form language selector to English shows the translations; back to
     the default language shows German again.
3. Run a second translation (e.g. into French) on the same form and confirm `i18n.en` survives.
4. If the designer shows a different per-option/per-button key than `value`/`title`, adjust the two
   prompt files accordingly (single source of truth).

## Notes / scope

- The scalar property entries (`label`, `placeholder`, `legend`, `helptext`, `rtevalue`,
  `dynamicAddText`/`dynamicDeleteText`, `title`/`alt`, …) are the proven core; the per-option /
  per-button `i18n` keys (`value`, `title`) come from the renderer bytecode (`XSelect`,
  `XButtonDescriptor`) and were validated there.
- Option/button translation should be re-validated against a real manually-translated persist when
  one is available; the key names are defined in exactly two prompt locations.
