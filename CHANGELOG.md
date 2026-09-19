# Changelog

All notable changes to CodBi are documented in this file.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Fixed
- **The designer now shows the workflow state as SELECTED in an element's "Available only if" property after a workflow run**: with "… der Zustand des Formulars auf GOGO gesetzt werden. Füge auch ein RichText Editor unter den Senden button hinzu der nur im Zustand GOGO verfügbar ist." the state was created and the element received `"statusdependent":"1"` + `"viewstatus":["<GOGO-UUID>"]` (the run log confirmed `Resolved workflow state name 'GOGO' to UUID d195feee-… on element 'taRichEditor' (viewstatus)`), yet the property panel showed no state selected. The stored value was CORRECT — verified against the Formcycle 8.5.3 jars: `DefaultFD2ConditionsFactory` evaluates `viewstatus` against the record's `WorkflowState.getUUIDObject()`, and `DefaultFD2StatusProvider.createStatusJSON` builds the designer's option entries as `{"id": <the same UUID>, "name": <state name>}` (plus the pseudo entries `-1` / `[!]-1` and one `"[!]<uuid>"` exclusion entry per state), i.e. the `ViewStatusEditor` of "Available only if" matches exactly the plain UUID the backend writes. The real cause was a STALE client-side state list: the designer fetches its config (including `config.statusList`) ONCE when the page loads, and Formcycle only refreshes it when the server pushes `fd2ReloadConfig` (`CmnConst.FormDesigner.PushEvent.RELOAD_CONFIG`) — which happens when a state is added in the WORKFLOW designer, but NOT when a plugin creates the state through the entity/API layer during a run. The assistant now `await`s `designer.reloadConfig(false)` (the designer's own public API; it refreshes states / user groups / templates / datasources and does not touch the form model) whenever the run was not form-only, BEFORE the AI form JSON is loaded and published, so a state created by the same run is offered and resolves to a selected chip. The phase-2 `$.ajax` `success` callback is now `async` for that await.
- **The assistant no longer asks for a workflow-state UUID it cannot know**: with e.g. "Füge einen Senden button hinzu … der Zustand des Formulars auf GOGO gesetzt werden. Füge auch ein RichText Editor unter den Senden button hinzu der nur im Zustand GOGO verfügbar ist." the form pass returned `need_clarification` asking for "the workflow state UUID that corresponds to the state named GOGO" — which nobody can know. The state-based availability documentation said `viewstatus` must carry the state's UUID, and the availability sanitizer kept only plain strings, so the model had no way to satisfy it. Now: (1) the prompts (`formcycle.general`, `codbi.general`, `codbi.clarification`) state that the AI must write the state **NAME** exactly as the user gave it (`"statusdependent":"1"` + `"viewstatus":["GOGO"]`, or the `readonly_*` pair for the state-based disable) and must NEVER ask for a state UUID / internal id, and (2) the backend resolves those names to the WorkflowState UUIDs of the current workflow version in `resolveElementStateNames` (called at the end of `Run`, i.e. AFTER the workflow step, so the state the lane of the same run ends in exists by then); entries that are already UUIDs, and names that cannot be resolved, are kept unchanged (the designer accepts a plain name), and the matching `*dependent` flag is set to `"1"` when a name was resolved.
- **State/user-group availability flags are now normalized to the design-time STRING form**: `sanitizeVisibilityProp` required a JSON BOOLEAN for `statusdependent` / `readonly_statusdependent` / `usergrouppendent` / `readonly_usergrouppendant`, but the designer's own default form template stores them as STRINGS (e.g. `"statusdependent":""`, `"usergrouppendent":""`, `"isdisabled":""`, `"viewstatus":[]`) and Formcycle compares the value against `"1"` — so the string form the prompts mandate only reached the form because the sanitizer left unrecognized shapes untouched, while a model-emitted boolean stayed a boolean. A new `normalizeDependentFlag` accepts BOTH shapes (`true`/`false`, `"1"`/`"0"`, `"true"`/`"false"`, the default `""`) and always writes the STRING `"1"`/`"0"`; an object, number or array is still dropped. Applied in `AICodBiAssistant` and `AIFormAssistant`, covered by the new `VisibilityPropSanitizeTest`.
- **The state-based "Disabled if" is now documented (and ruled out as a key)**: "Available only if" (workflow status / user group) was already covered, but the advanced options' second state-based switch was not. Verified against `de.xima.fc.form.common.XPropertyEnum` (Formcycle 8.5.3 jar) there is NO `disabledif`/`availableif` key — the state-based DISABLE is the read-only pair `readonly_statusdependent` (STRING `"1"`) + `readonly_viewstatus` (the element stays visible but cannot be edited in those states), while "not available in specific states" is expressed with `[!]<stateUuid>` EXCLUSION entries in `viewstatus`. `formcycle.general` (State-Based Availability section) and `codbi.form-structure-rules` now state the rule, the `"1"`/`"0"` string convention for all `*dependent` flags and the `[!]` exclusion form.
- **A requested "designed" mail body is now written in full (with inline SVG illustrations) instead of a single paragraph**: with e.g. "Füge einen Senden button hinzu. Wenn der geklickt wird soll eine Mail an X@X.X gesendet werden mit folgendem Inhalt: Alle Vorteile einer KI bei der Formulargenerierung in schönem Design und mit SVG-Illustrationen." the workflow AI produced an email whose body was one short `<p>`. The workflow prompts (`codbi.workflow_task_instruction`, `formcycle.workflow_nodes`) only said "derive a SHORT confirmation body" and never described a designed layout, so the model did exactly that. They now state that (1) when the user gives the mail content as a TOPIC/headline the AI must COMPOSE the full content itself (e.g. 5-8 points, each with a short explanation — a single `<p>` restating the topic is a FAIL), (2) a requested "schönes Design" must become a real HTML layout (heading + intro + one block/card per point with `<h2>`/`<h3>`, `<ul>`/`<li>` or `<table>`) using INLINE CSS only (`style='…'`; NEVER a `<style>` block, `<head>`, external CSS, remote images, `<script>` or `<form>` — mail clients strip or block them), (3) requested illustrations become INLINE `<svg width='…' height='…' viewBox='…'>…</svg>` drawings (never `<img src="https://…">`), with the explanatory text kept in the body as well, and (4) HTML attribute values use SINGLE quotes so the body remains a valid JSON string. The word "short" was removed from the FC_EMAIL body rule. Background: the mail body is always HTML (the backend forces `bodyFormatType:"HTML"` and copies it into `plainBody`) and it is not sanitized — which is exactly why `FC_EMAIL` can be marked sensitive for change-log verification.
- **The Form Assistant dialog now always closes after a form-only inference (e.g. an inference that only creates widgets)**: that flow is the only one WITHOUT a page reload, so it relies purely on hiding the kept-mounted dialog with `display:none` — but PrimeNG v20 re-applies its OWN inline `display:flex` whenever it re-renders the dialog, which could undo that inline style and leave the dialog on screen although the form had already been saved (most visibly while the dialog was MAXIMIZED). `close()` and the native close now apply a dedicated `cb-ai-assistant-dialog--hidden` class whose stylesheet rule hides the dialog (and its mask) with `!important`, and re-assert the hidden state briefly afterwards so a re-render during the close/save transition cannot bring the dialog back; reopening clears the class.
- **No more redundant standalone CSS element (stray "Text" node) for a container panel's header**: the
  prompts MANDATED emitting an extra element with `data-cb-func="HTML.CSS"` carrying a
  `.CodBi_HTML_Panel_Header { … }` rule — and listed `HTML.CSS` in the panel's `need_codbi_details`
  request. That node renders as a stray text label ("Text") and is UNNECESSARY: the panel header is
  styled by the panel's OWN `data-cb-cssheaderfolded` / `data-cb-cssheaderunfolded` parameters in both
  states (the header renders correctly without the extra element). The obsolete mandate was REMOVED
  OUTRIGHT from every prompt that carried it — `codbi.general`, `codbi.form-structure-rules`,
  `codbi.form_task_instruction`, `codbi.form_short_task_instruction`, `codbi.control_types_rules`,
  `codbi.retry_form`, `codbi.rethink_instruction`, the `codbi.fallback_*` prompts, the generated
  `codbi-core-api-compact.md` / `codbi-core-elements-compact.md` text and the `UI.Panels.json` notes the
  compact docs are generated from — so the AI is no longer told to emit (or to request) an `HTML.CSS`
  element for a panel header, and the `_codbiApplicability` requirement now names `HTML.Panel` only.
  Rationale: the separate state-independent rule was only ever needed before `html.panel` gained
  `data-cb-cssheaderfolded`, which now styles the header of a closed (folded) panel directly.
- **No duplicate element names — a container can no longer get doubled children**: a "rebuild" pass
  (the forced CodBi re-evaluation / widget-template pass) regularly re-emits the elements of the
  container it just created as a SECOND set of items — observed: `coPersonData` came back with a
  truncated child list plus a spurious empty `coPersonData2`, and the rowid normalizer reported
  `rowid 'row-N' spanned 2 containers` for all five rows because every field existed twice.
  Formcycle addresses elements by `properties.name` and requires it to be UNIQUE, so
  `sanitizeAiFormItems` now keeps the FIRST occurrence of each name and drops later duplicates; the
  existing dangling-reference cleanup re-points every container at the surviving item, so no container
  is left with a missing child.
- **`UnsupportedOperationException: JsonNull` aborted a whole form build**: gson maps a JSON `null`
  to `JsonNull`, whose `getAsString()` / `getAsJsonArray()` family THROWS instead of returning null,
  so a single model-emitted `null` (e.g. `"parentid": null`) crashed `restoreStrippedFields` — and the
  outer catch mislabelled such failures as an "unparseable response" while logging only the JSON, never
  the exception. `AICodBiAssistant` now removes every JSON `null` from the model's tree
  (`stripJsonNulls`) before any normalization reads it, reads scalar properties through a new
  null-safe `JsonObject.stringProp` helper (next to `arrayProp`), the "unparseable response" catch
  logs the real exception (type, message, stack trace), and the field-restore/normalization step is
  best-effort so a post-parse failure can no longer discard an otherwise valid form.
- **A requested select was silently dropped for a missing id**: when the model omitted the technical
  `id` on a NEW element, `sanitizeAiFormItems` dropped the item — deleting a widget the user
  explicitly asked for (observed: "Dropping item 'selDataSourceColumn' with missing id", although the
  raw response carried `"id":"xi-sel-datasourcecolumn"`) and leaving a dangling reference in the
  page's `elements` array. A missing id is now REPAIRED with the designer's own convention (`xi-` +
  the lowercased element name, as `createAddressField` does); only a nameless or duplicate-named item
  is still dropped.

### Added
- **The conditional element properties are now documented completely (and `disabledif` is ruled out)**: the prompts documented only `hiddenif` and `readonlyif` (plus the status/user-group availability), so a "deaktiviert / disabled, wenn …" or "Pflichtfeld, wenn …" request had no documented target. Verified against `de.xima.fc.form.common.XPropertyEnum` in the Formcycle 8.5.3 jar, the real property set is `hiddenif`/`hiddenifcomp`/`hiddenifvalue`/`hiddenifclear`, `readonlyif`/`readonlyifcomp`/`readonlyifvalue`/`readonlyifclear`/`readonlyifmode`, `requiredif`/`requiredifcomp`/`requiredifvalue`, the plain flags `isreadonly`/`isdisabled`, and the availability pairings (`statusdependent`+`viewstatus`, `usergrouppendent`+`viewusergroup`, `readonly_*`). `formcycle.general` now documents all three conditional families with the shared `EConditionType` codes, the value-handling modes, the rule that the COMPLETE triple (`xif` + `xifcomp` + `xifvalue`, plus `xifclear` when relevant) must always be emitted, an explicit mapping for the user's wording ("deaktiviert / ausgegraut wenn …" → `readonlyif*`, or `hiddenif*` + `hiddenifclear="2"`; always locked → `"isreadonly":"1"`, always disabled → `"isdisabled":"1"`), and the fact that **Formcycle has NO `disabledif` and NO `availableif` key** — an invented key is silently ignored. `codbi.general` (required section) and `codbi.form-structure-rules` carry the same rules, including "Pflichtfeld, wenn …" → `requiredif*` instead of an unconditional `"required":"1"`. "Available only if" (workflow status / user group) remains the separate `statusdependent`/`usergrouppendent` mechanism already documented.
- **Sensitive & forbidden element lists now also cover FORMCYCLE widgets and workflow nodes**: the AI can write arbitrary HTML/code into a FORMCYCLE field (e.g. an `XTextField`), so the change-log verification is extended to FORMCYCLE elements. `AI_Log_SensitiveElements` now accepts FORMCYCLE widget class names (`XTextField`, `XTextArea`, …) and workflow node / trigger types (`FC_EMAIL`, `FC_SQL_STATEMENT`, …) besides CodBi elements: `AiAssistantLog.usedSensitiveElements` additionally matches the `widget`/`className` of attribute and class changes (so writing into an EXISTING `XTextField` is detected, not only creating one), a new `AiAssistantLog.usedSensitiveWorkflowElements` scans the whole workflow change description (node type, node name, trigger and every nested parameter name/value), and both are combined in the `Run` response and in the per-entry `sensitiveUsed` of every log load. The change log therefore marks the matching widget / workflow nodes with the same always-on red border + verification checkbox and auto-opens after such an inference. The `AI_FormAssistant_ForbiddenElements_NonSyncUsers` / `AI_FormAssistant_ForbiddenElements_<username>` properties also honour FORMCYCLE elements: `FormcycleElementFilter` treats those names as widget / node / trigger exclusions, so e.g. `XTextField` or `FC_EMAIL` is hidden from the AI exactly like the element picker's "Nicht installierte Elemente erstellen" filter (`isWidgetAllowed` / `isNodeAllowed` / `isTriggerAllowed` and the section scrubbers). Covered by the new `SensitiveElementMatchingTest`.
- **A new element without a stated location now goes on the FIRST PAGE (never the header/footer)**: with e.g. "Füge einen Text ein, der … die Vorteile einer KI beim Formulardesign enthält." the model placed the text in the form's XHeader although the prompt named no location. The form prompts (`codbi.general`, `codbi.form_task_instruction`, `codbi.form_short_task_instruction`, `codbi.form-structure-rules`, `codbi.clarification`, `codbi.fallback.form_system`) now state the default placement explicitly: add the item to the root `items` array, append its `name` to the FIRST XPage's `elements` array and set `properties.parentid` to that page's `name` — the XHeader/XFooter are reserved for the navbar, the language switcher and document-header updates and are NOT "the top / bottom of the form" for new content. An explicit location ("im Header", "auf Seite 2", "in den Container X", "unter dem Feld Y") overrides it, and the assistant never asks where to place it.
- **Datasource-driven selects map the user's column WORD to the right property**: the prompt rules
  (`codbi.general`, `formcycle.widgets` and its compact variant `formcycle-widgets-compact.md`,
  `codbi.form_task_instruction`, `codbi.functionalities`, `codbi.clarification`) now state explicitly
  that a datasource XSelect has **three** columns and that the word the user uses decides which
  property it fills — Text-Spalte / Anzeigetext / display → `dstextidx`, Wert-Spalte / value →
  `dsvalueidx`, **Titel-Spalte / Titel / Tooltip / title → `dstitleidx`**. Previously only a
  count-based rule existed ("one named column → set BOTH `dstextidx` AND `dsvalueidx`"), so a request
  that named only a *Titel-Spalte* (e.g. "Für die Titel-Spalte soll die Spalte 5 verwendet werden")
  wrongly wrote that column into `dstextidx` (the option text). The "use the same column for text and
  value" default now applies ONLY to a column that carries no role word, a named TITLE column is
  never assigned to `dstextidx`/`dsvalueidx`, and several role columns may be combined (Spalte 2 als
  Text, Spalte 4 als Wert, Titel-Spalte 5 → `dstextidx` 2 / `dsvalueidx` 4 / `dstitleidx` 5).
- **Datasource-select OPTION SWITCHES taught to the AI**: the datasource-select prompt rules now map
  the user's wording to the XSelect element properties — **"Show default option" →
  `showpleaseselect="1"`** (adds a leading default option so nothing is preselected; the option text is
  Formcycle-localized, so `placeholder` must NOT be used and there is no text property), **"Remove
  duplicate text-pairs" → `removeduplicatetextvaluepairs="1"`** (the ELEMENT property — not the
  `Unique` placeholder / `html.select.injection`), **"Render all attributes" →
  `ds_rendercolattr="1"`**, plus the companion `showpleaseselectreq`. The property names were verified
  against `de/xima/fc/form/common/items/XSelect.class` (`fc-form-common` 8.5.3 — its property list and
  the `requiredSelectDefault` class it renders on the default option) and the designer typings
  (`@de-xima/fc-form-designer` → `XItemProps.d.ts`). Documented in `codbi.general`,
  `formcycle.widgets` and its compact variant `formcycle-widgets-compact.md`,
  `codbi.form_task_instruction`, `codbi.functionalities` and `codbi.clarification`.
- **An address is built as FOUR fields, never one**: the prompts now state that a field the request (or a
  clarification option) calls "Adresse" / "Anschrift" / "address" MUST be expanded into the address
  group — `tfStrasse` (label "Straße"), `tfHausnummer` (label "Hausnummer"), `tfPLZ` (label
  "Postleitzahl", `datatype` "plzDE") and `tfOrt` (label "Ort"), each tagged with its
  `CodBi_OpenPLZ_AC_SET_*` class, with street+house number on one `rowid` and PLZ+city on the next; a
  lone free-text "Adresse" XTextField is a FAIL. Previously the address rules only CREATED the
  street/house-number parts for an explicit German-autocomplete request, so a plain "Adresse" item
  (which the clarification itself offered) was implemented as a single text field. Added to
  `codbi.general`, `codbi-form-structure-rules`, `formcycle-widgets-compact.md` and
  `codbi.clarification` (which must no longer OFFER a single "Adresse" option in a field list).
- **Chat turns in the change log**: every chat message and its corresponding AI reply are now
  registered in the change log (`codbi_ai_assistant_log`) just like the other entries, with the same
  input/output token counts, estimated cost and currency, and the user who ran the turn. A pure chat
  turn is recorded as its own entry (its own row) even though it changes neither the form nor the
  workflow — previously answer-only chat messages were never logged. The AI's reply is stored in the
  new `chat_reply` column (JSON `{"text": "...", "matomoStats": {...}}`). A chat entry shows only the
  question and the reply; the reply is rendered as Markdown (with copy buttons, and charts when the
  AI attached statistics) and can be opened in a draggable, resizable viewer, exactly like the chat
  reply buttons in the assistant popup. The topmost icon of a chat entry is the CodBi logo. Mixed
  "instruction + question" runs keep their normal form/workflow entry and additionally expose the
  reply as a Markdown child node. The reply is also included in the change history sent to the AI.
- **AI pricing**: new plugin properties let administrators configure the cost per 1,000,000 input
  and output tokens **per model**, each with its own ISO 4217 currency (e.g. `EUR`/`USD`) so models
  priced by different providers can use different currencies — `AI_LLAMA_STD_PriceCurrency` /
  `AI_LLAMA_STD_PricePerMInput` / `AI_LLAMA_STD_PricePerMOutput` (standard model),
  `AI_LLAMA_STD_ThinkingPriceCurrency` / `AI_LLAMA_STD_ThinkingPricePerMInput` /
  `AI_LLAMA_STD_ThinkingPricePerMOutput` (thinking model), and per-specialist
  `AI_LLAMA_STD_SPECIALIST_PriceCurrency_XXX` / `AI_LLAMA_STD_SPECIALIST_PricePerMInput_XXX` /
  `AI_LLAMA_STD_SPECIALIST_PricePerMOutput_XXX` (local) and `AI_LLAMA_STD_EXT_SPECIALIST_PriceCurrency_XXX` /
  `AI_LLAMA_STD_EXT_SPECIALIST_PricePerMInput_XXX` / `AI_LLAMA_STD_EXT_SPECIALIST_PricePerMOutput_XXX`
  (external). The estimated cost (input + output tokens × price per 1M) is now shown with its
  currency in the AI assistant dialog (this run + session total, grouped per currency) and persisted
  in the change log (`cost`/`currency` columns), where it is displayed per inference; the per-form
  total is derived server-side from the summed input/output tokens per model × the configured price,
  grouped by currency.
- The AI assistant dialog now has a **Change log** button that opens a per-form treeview of all AI
  inferences recorded in the database (`codbi_ai_assistant_log`). Each inference is scoped to the
  form's technical name/key (`form_key`) so the dialog opened in the designer shows only the
  entries of the form that is currently being edited. Top-level nodes are the date/time of each
  inference; below them the applied **Form** and **Workflow** changes are listed — widgets
  created/removed, CSS classes set, attributes set (with distinct icons), special unfoldable
  `data-cb-func` / `data-cb-*` elements showing the CodBi parameters used by a functionality, and
  workflow nodes that unfold to reveal their defined parameters.
- **Sensitive elements (`AI_Log_SensitiveElements`)**: the AI change log now marks every node whose
  label/value matches a configured sensitive element with an **always-on red border**, on every log
  load — independent of the temporary lightning-icon highlight that auto-opens the dialog after an
  inference used one of the sensitive elements. The backend returns the current list with every log
  request, so configuration changes take effect the next time the change log is opened.
- **Dismiss checkboxes on sensitive nodes**: every sensitive-marked node in the change log now shows a
  checkbox. Ticking it removes that node's marking (red border / bolt) and keeps it unmarked for the
  rest of the page session; unticking re-marks it.
- **Who ran the inference**: the change log top-level (inference) entries now show the login name of
  the user who ran the inference as a distinct user badge (`username` column on
  `codbi_ai_assistant_log`), so the timestamp stays readable and the author is clearly visible.
- **Persistent, attributable sensitive checks**: ticking a sensitive node's dismiss checkbox is now
  stored in the new `codbi_ai_log_sensitive_check` table as `(log entry id, element name, user login,
  checked_at)`. The check is applied per user — the same user's checked entries stay unmarked on
  every load / designer session; other users still see them marked. Unticking removes the stored row.
- **"Checked by" badge**: every dismissed sensitive node shows a green badge on the right side of the
  row (before the export/expand buttons) stating `checked by <user> on <date/time>`. The badge
  appears immediately when the checkbox is ticked and is restored from the stored `checked_at`
  timestamp on later loads.
- **Dialogs remember their position**: the AI assistant, prompt manager, change-log and the prompt
  manager's sub-dialogs (add category, add item, rename) restore their last on-screen position
  (left/top) from `localStorage` when opened, and save it again whenever the user drags or resizes
  them. Only the local API-Doc manager (the main window) is intentionally excluded.
- **Per-user hidden CodBi elements**: new plugin properties let administrators suppress the prompts of
  selected CodBi elements from what is transmitted to the AI, exactly as if the element had been
  deactivated in the Prompt Manager. `AI_FormAssistant_ForbiddenElements_NonSyncUsers` (CSV of CodBi
  elements) hides the listed elements for every user NOT listed in `APIDoc_UsersAllowedToSYNC`, while
  any property named `AI_FormAssistant_ForbiddenElements_<username>` (CSV of CodBi elements) hides
  them only for that exact user when that user runs an inference.
- **Whole-form translation fills the per-language element fields instead of overwriting the base
  language**: the form AI assistant now teaches "translate the whole form into <language>"
  requests to add the translations as Formcycle's per-language element map
  (`properties.i18n[<lang>][<prop>]`, plus the per-option / per-button `i18n` for XSelect options and
  XButtonList buttons) while leaving every base/default-language text unchanged — mirroring what the
  designer does when the Form language selector is set to that language. The prompts
  (`codbi.form_structure_rules` / `codbi-form-structure-rules.md` and `formcycle.general` /
  `formcycle-general.md`) now document the storage format, and both form assistants
  (`AICodBiAssistant.kt`, `AIFormAssistant.kt`) no longer discard the AI-emitted `i18n`: a new
  `mergeItemI18n` restore step merges it with the original item translations so already-translated
  languages are preserved when a second language is added.
- **Compact single-line AI JSON in the logs**: every server-side log of the raw AI form/workflow
  response (including the "AI returned invalid JSON / unparseable response" warning, which printed the
  whole pretty-printed payload over dozens of lines) is now emitted as one compact line via a shared
  `compactJsonForLog` helper (shared `AiJsonLogging.kt`, replacing per-class copies) so the logging
  window shows the complete payload without line-wrapping scroll noise — plus the character count so a
  truncated (over-length) response is immediately recognizable. The whole-form-translation prompts also
  instruct the AI to emit compact JSON and never empty `"i18n": {}` maps, keeping large-form outputs
  within the model's length limit.
- **Multilingual workflow mails on whole-form translation (`FC_SWITCH` on `[%lang%]`)**: when the form
  AI translates a whole form into ADDITIONAL languages, it now also emits a structured, language-
  agnostic marker (`"_workflowMailLanguages": ["<baseCode>", "<addedCode>", ...]`, base language
  first — same model-declared-signal pattern as `_codbiApplicability`, never a server-side keyword
  guess). When the marker is present and a workflow version is available, `AICodBiAssistant` runs a
  dedicated multilingualize pass (`runWorkflowMailMultilingualization`, prompt
  `codbi.workflow_translate_instruction` / `codbi-workflow-translate-instruction.md`): the AI names the
  existing **consumer-facing** `FC_EMAIL`/`FC_DOI_INIT` nodes (recipient = a `[%…%]` consumer email
  field or a DOI invitation; internal/admin/error mails are skipped) and provides the subject/body
  translation per added language. The backend then wraps each chosen node **in place** into an
  `FC_SWITCH` with `switchValue="[%lang%]"` (Formcycle's native placeholder for the language the form
  was filled out in — verified in the official howto
  `help8.formcycle.eu/…/103000047241-internationalisierung-im-workflow` and against
  `FcSwitchExecutor`, which resolves the switch value through the condition operand mapper). The
  original mail stays byte-for-byte on the base-language `FC_SWITCH_CASE` and the
  `FC_SWITCH_DEFAULT`; every other language gets a clone with translated subject/body/senderName while
  `to`/`from`/attachments/DOI pages and all placeholders are preserved. The switch keeps the mail's
  position, so the lane's continuation after it is untouched — no new lane/trigger/endpoint is created,
  and no submit button or field is added. The marker is stripped from the form before it is saved.
  Prompt rules were added to both form prompts (`codbi.form_structure_rules`,
  `formcycle.general`) and registered in `index.json`; covered by the FS12 scenario in the whole-form
  test-prompts plan.
  The assistant dialog (`ai-assistant.ts`) now also sends `workflowVersionId` on **form-only** runs
  when a workflow exists (previously workflow/both only), so the translation run reaches the
  multilingualize pass; the existing "formJson + workflowMessage" response handling then publishes the
  translated form and reloads the designer to show the new switch.
  The multilingualize pass feeds the model only a **condensed candidate list of the FC_EMAIL /
  FC_DOI_INIT nodes** (id, name, type, params) plus an explicit output rule instead of the whole
  workflow tree (feeding the full tree made the model echo the workflow back instead of answering the
  small mails payload, so no switch was created), and **retries once with a strict schema instruction**
  when the reply contains no usable `targetNodeId`+`translations` entry — the form translation itself
  is never failed when this optional pass yields nothing. The candidate collector descends through
  both `children` and the task-level `rootNode` of the workflow-structure JSON (the node tree lives
  under `rootNode`; without that descent it found zero mail nodes and skipped the wrap — observed
  "no FC_EMAIL/FC_DOI_INIT node found - nothing to wrap").
  **Which mails are consumer-facing is the AI's own decision** — no server-side filter is applied (a
  deterministic filter can never cover every way a mail is destined to the consumer or an internal
  office). The model must therefore return an explicit `toConsumer` boolean for **EVERY** candidate
  node in a single pass (verdict + translations together): the runner validates that no candidate is
  missing a verdict and **retries once with a strict schema instruction** (listing the missed ids)
  when any candidate lacks a verdict or the reply is unusable; it then wraps ONLY the nodes the model
  itself marked `toConsumer: true` and leaves internal/back-office/error mails untouched. Live
  validation had shown the model wrapping almost every mail node (including "Benachrichtigung für die
  Sachbearbeitung" and "E-Mail an Kasse"); the workflow-translate prompt now gives intent-based
  guidance (who reads the mail and what it is for) instead of relying on recipient strings or keyword
  lists.
- **Whole-form translations never trigger the CodBi "blind" re-evaluation pass**: both form
  assistants (`AICodBiAssistant`, `AIFormAssistant`) now skip that second pass (which re-sends the
  whole large form and can exceed the model's output limit → "AI returned invalid JSON") whenever the
  form-AI response declares the structured `_workflowMailLanguages` translation marker — even when the
  model omitted `_codbiApplicability` entirely. A whole-form translation only ADDS per-language text
  fields and never a CodBi element, so the blind CodBi re-evaluation is pointless and harmful for it.
  The form-AI prompt reminder also now asks the model to emit `_workflowMailLanguages` (base language
  first) plus `_codbiApplicability.codbiVerdict = "none"` on every whole-form translation.
- **Later language additions EXTEND an already-multilingual mail `FC_SWITCH` instead of wrapping it
  again**: when the whole form is translated into languages that a previously created `[%lang%]` mail
  switch does not cover yet (e.g. "Übersetze das Formular ins Englische und Französische." on a form
  whose de/it `FC_SWITCH` was built by an earlier run), the mail pass no longer leaves English/French
  consumers on the German default mail. The candidate collector now feeds the AI two kinds of
  candidates — `"MAIL"` (a plain `FC_EMAIL`/`FC_DOI_INIT` to wrap) and `"SWITCH"` (an existing
  `[%lang%]` `FC_SWITCH` already carrying translated mail clones, reported with its
  `existingCaseLanguages`, `defaultBranchId` and the first clone's type/name/params) — and it does not
  descend into a handled `[%lang%]` mail switch's subtree, so clones are extended, never re-wrapped.
  The model is told to translate a SWITCH only into the form languages missing from its
  `existingCaseLanguages`. The apply loop dispatches per kind: a SWITCH candidate goes to the new
  `extendMailSwitchNode`, which appends one `FC_SWITCH_CASE` (+ `SEQUENCE` + translated mail clone
  named "<switch name> (<lang>)") per added language under the SAME switch; the `FC_SWITCH_DEFAULT`
  stays at index 0 (the FIRST child — Formcycle requires the default as the first branch or the
  switch is INVALID) via `ensureSwitchDefaultFirst`, which also heals switches that were generated
  with the default placed last. Verified against the de/it form: a follow-up
  de→en+fr run now yields `Extended existing FC_SWITCH … with new language case(s): en, fr` with the
  en/fr branches inserted before the default.
- **Multilingual Abschlussseiten (ending pages) by REUSE — never created**: the ending-page pass that
  was parked (server-side creation of TEMPLATE_CLIENT rows is impossible from the plugin: no JPA
  entity, encrypted `TEXTVALUE`, no creation API) is now active in a reuse-only form. When a whole-form
  translation adds languages, `AICodBiAssistant` additionally wraps every consumer `FC_SHOW_TEMPLATE`
  (Abschlussseite) node into an `[%lang%]` `FC_SWITCH` (same trigger/marker and same verdict-only
  single-pass + strict-retry pattern as the mail pass: the model returns a `toConsumer` verdict per
  condensed candidate, never the whole tree). Each non-base case points at the **already existing**
  localized page whose NAME is `<base> _CB_<LANG>` (e.g. `Formular versendet _CB_EN`; `de-CH` →
  `_CB_DE-CH`) — resolved deterministically by the backend from the client's `TEMPLATE_CLIENT` rows
  (NAME + UUID are plain text; the encrypted content is never read) via the new
  `listClientTemplates` / `findLocalizedTemplate`. When no localization exists the case falls back to
  the **original** page — a page is never created, invented or edited. An already-`[%lang%]`-wrapped
  ending-page switch is EXTENDED with the missing languages (new `extendEndPageSwitchNode`, mirror of
  `extendMailSwitchNode`), never double-wrapped. `handleRun` runs the ending-page pass right after the
  mail pass (both under the same `_workflowMailLanguages` gate + `workflowVersionId`) and emits one
  combined `workflowMessage`. The obsolete page-creation helpers
  (`ensureEndPageForLanguage`, `setTemplateText`, `setNewUuid`, `readTemplatePage`, …) are marked
  SUPERSEDED/inert.
- **Multi-language whole-form translations run ONE LANGUAGE PER AI PASS (sequential)**: when a request
  asks to translate the whole form into two or more NEW languages at once ("translate to English and
  French"), the backend no longer lets a single AI response carry every translation — that oversized
  output truncated mid-JSON on large forms (observed live at 15587 chars) and aborted the run before
  the workflow passes. The new `planWholeFormTranslation` (model-declared languages, reached via a
  cheap fallback-safe hint — the AI decides, never keyword parsing) detects the multi-language case;
  `runSequentialWholeFormTranslation` then reuses the proven single-language form pipeline
  (`runFormModification`) once per language on the ORIGINAL persist, each pass restricted to its one
  language, and merges the per-language i18n (labels/headers/legends/rtevalues plus nested
  per-option/per-button i18n) into a single final form via `overlayLanguageI18n`. `handleRun` engages
  this only when ≥2 new languages are planned (otherwise the normal single pass is unchanged), and it
  overrides the `_workflowMailLanguages` list to the full base-first set so the ONE combined mail +
  ending-page multilingualization runs afterwards for all languages.
- **`FC_SWITCH` children obey Formcycle's required layout — default branch at index 0**: a switch node
  is INVALID in Formcycle unless its `FC_SWITCH_DEFAULT` branch is the FIRST child
  (parent_order_idx 0); the language `FC_SWITCH_CASE`s follow it. All multilingualize builders now
  create the default branch first (mails + ending pages), the extenders no longer move the default to
  the end, and the new `ensureSwitchDefaultFirst` reorders any switch whose default is not the first
  child — so a re-run of the same translation request also heals switches that earlier runs generated
  with the default last (observed live: ending-page switch had case(0), case(1), case(2), default(3)
  and the extended mail switch had its default forced to index 5). The workflow-AI switch builder
  already followed this convention.
- **Repeat whole-form translations are form no-ops (no more invalid-JSON aborts)**: when the request is
  a whole-form translation but EVERY named language is already present on the already-multilingual form
  (e.g. re-running "Übersetze das Formular ins Englische und Französische." after en+fr were added), the
  backend no longer re-runs the generic full form-rebuild pass — that pass re-emitted the whole
  multilingual form, exceeded the output budget and returned truncated, single-quoted invalid JSON
  (observed live at 17366 chars), aborting the run before the workflow passes. The translation-plan AI
  now reports `translationRequest=true` even for such repeat requests (with `addLanguages=[]`), and
  `handleRun` then leaves the form unchanged and still runs the workflow multilingualize (mails +
  ending pages), which verifies coverage and heals `FC_SWITCH` ordering.

### Fixed
- **Sensitive-element detection missed functionality names**: `AiAssistantLog.usedSensitiveElements`
  only scanned the **value** of each attribute, so a functionality used via `data-cb-func` (e.g.
  `Sys.Log.Console`, whose name lives in the attribute `name` with an empty value) never matched a
  configured sensitive element. Detection now also scans the attribute `name`/`kind` and the nested
  `data-cb-*` parameters, so funcs, EPs and their payloads are all detected.
- **Form widgets silently dropped when the AI requests details twice**: if the AI answered the
  initial pass with `need_codbi_details` and the detail-rerun again answered `need_codbi_details`
  (e.g. a small model first asking for CodBi details, then for specific widget types), the second
  details request was spliced into the form as-is — no `items` — so every requested widget was lost.
  `rerunWithCodbiDetails` now detects a second `need_codbi_details` and reruns (bounded by
  `MAX_FORM_RERUNS`) with the newly requested elements/widgets, so the widgets the user asked for are
  not silently dropped.
- **Sensitive-element auto-open after workflow creation**: when the AI assistant also creates a
  workflow, the designer reloads the page to store it. The change-log component was only mounted on
  demand, so after the reload its `ngOnInit` never ran and the pending sensitive-element highlight
  persisted in sessionStorage was never consumed — no popup appeared. The fix: `cb-ai-assistant-log`
  is now mounted on every designer page load, the sensitive elements are written to sessionStorage
  inside `doReload()`/the workflow-only reload path (immediately before `window.location.reload()`,
  the same pattern as the standards write, so no intermediate async rendering can consume them), and
  the always-mounted assistant element reopens the change log after the reload as a fallback — briefly
  waiting for the designer to report the current form key so the log is scoped to the just-reloaded
  form.
- **Change-log author resolution**: the inference author was resolved via `params.benutzer?.loginName`,
  which is empty in the plugin servlet-action context, so no user was recorded/displayed (the top-level
  author badge was empty and the sensitive-check badge read "checked by ?"). `currentUsername` now uses
  `params.user.userName` — the same accessor as the Local API Doc store, which reliably resolves the
  logged-in user (e.g. `sadmin`).
- **Change-log auto-open after reload made robust**: besides the sessionStorage/localStorage handoff,
  the change log now also queries the database on every designer page load: the newest entry of the
  current form is examined and, if it used sensitive elements within the last few minutes and not all
  of them are acknowledged, the dialog auto-opens with those elements highlighted. `loadLogs` returns a
  per-entry `sensitiveUsed` list (recomputed from the stored form changes against the current
  `AI_Log_SensitiveElements`) so the check is driven by DB state rather than by fragile frontend
  timing. A plain-JS poller in `enableAICodBiAssistantDialog` (runs on every designer page load)
  additionally keeps dispatching the `codbi:ai-assistant-log:open` event while a pending sensitive
  list exists and independently queries the newest log entry — covering any case where the Angular
  component's `ngOnInit` timing is missed after the reload.
- **Sensitive-check persistence failed**: ticking a sensitive node's dismiss checkbox logged
  `org.hibernate.InstantiationException: No default constructor for entity ...
  CodbiAiLogSensitiveCheck`, so the check was never stored. The entity's constructor parameters now
  all have defaults, which makes Kotlin emit the public no-arg constructor JPA requires.

### Changed
- **Sys.Log.Console prompt behavior**: when the prompt asks to log something to the browser console,
  the AI now creates a NEW **invisible XSpan** — the plain-text/HTML element of Formcycle (text goes
  in `rtevalue`) — at the top of the first page with `data-cb-func="Sys.Log.Console"` and a
  `data-cb-Data` value that starts with the literal prefix `"SYS.Log.Console > "` followed by the
  descriptive log text (instead of an XContainerInvisible and an element-placeholder expression; and
  instead of XTextField, which is an INPUT element, not plain text). The instruction includes an exact
  JSON template and an explicit **"NEVER invent class names like 'XText' or 'XButton'"** warning —
  those are not valid Formcycle widgets (the designer logs `XItem missing 'XText' using XDefault` and
  drops them), so the AI emits `"className": "XSpan"` and the created element actually renders.
  Updated in `codbi-general.md`, `codbi-functionalities.md`, `codbi-core-elements-compact.md` and
  `codbi-core-api-compact.md` (requires re-seeding the AI prompt database).
- **Inference author shown in the timestamp line**: the change-log top-level rows now render the
  author as part of the timestamp label (`"<timestamp> · <username>"`) instead of a separate user
  badge, so the two can never overlap. The username is highlighted in **darkorange** (bold text on a
  light-orange background with a darkorange frame) so it is clearly distinguishable from the
  timestamp.

### Changed
- Minimum supported FormCycle version raised from **8.3.3** to **8.5.3**. FormCycle 8.5.x extracted plugin-type interfaces (servlet actions, form resources, form render callbacks, entities, etc.) from `fc-plugin-common` into a new `fc-plugin-types` artifact. The compile dependency has been updated accordingly.
- Kotlin upgraded from **1.9.22 → 2.2.0**; language and API version set to **2.1**. Obsolete `kotlin-stdlib-common`, `kotlin-stdlib-jdk7`, and `kotlin-stdlib-jdk8` dependency-management entries removed (merged into `kotlin-stdlib` in Kotlin 1.8+). `kotlinx-coroutines-core` pinned to **1.11.0** for Kotlin 2.x compatibility. `kotlin-reflect` scope left as compile (bundled); `jackson-module-kotlin` scope set to `provided` because FC 8.5.x already supplies it via `fc-security`.
- `fc-server-maven-plugin` updated from **8.3.0 → 8.5.3** to match the target FormCycle version; development server now provides a valid licence for FormCycle 8.5.x.
- `enforce` profile: added exclusions for `de.xima:json-schema-inferrer-gson` and `de.xima:json-schema-model` from `fc-ms-metro-gui:classes` provisions; these new transitive dependencies of FC 8.5.x are gated behind XIMA Artifactory authentication not available in CI.

---

## [1.0.1] — 2026-04-22

### Added
- `AI_LLAMA_STD_ExtraParams` plugin property: optional JSON object of additional parameters appended to every completion request body (e.g. `{"top_p":0.9,"seed":42}`). Keys `messages`, `stream`, `model`, `id_slot`, `logprobs` are silently ignored. Applies to both local and external AI requests.
- `CALL:search(...)` now accepts positional arguments without the `query=` keyword
- Location is now only appended to search queries where geography is relevant (weather, local services, events); general knowledge queries are no longer location-tagged
- `CALL:search`/`CALL:fetch` calls are stripped from assistant history before re-sending to the model to avoid prompt leakage

### Fixed
- External AI providers (Google Gemini, Groq) returned HTTP 400 due to unsupported `logprobs` parameter — now only sent to local llama-server
- `DisableFrequencyPenalty` plugin property removed — frequency, presence, and repetition penalties are now hardcoded per model type and no longer configurable
- Plain unformatted digit sequences (e.g. Kassenzeichen, reference numbers) no longer detected as phone numbers in chat output
- Well-known public figures (politicians, celebrities, scientists) are no longer stripped from web search queries as PII

### Changed
- `AI_LLAMA_STD_MmprojUrl` is now optional — omit it when using a text-only model (no vision encoder)
- When no custom model URL is set, the default VL model still auto-provides its matching mmproj
- Warning logged when running without mmproj: vision/image features unavailable
- Search capability confirmation message now explicitly instructs the model to always use `CALL:search` for factual queries rather than answering from memory

---

## [1.0.0] — 2026-04-18

### Phase 7 — Build Hardening & CI/CD

#### Fixed
- Race condition in parallel workspace builds; centralized Java version management
- Cross-platform Angular build: resolved `ng` binary path resolution
- JDK 11 compatibility: replaced JDK 17+ `OperatingSystemMXBean` API with JDK 11 equivalents
- All `useBlockStatements` Biome lint violations

#### Changed
- Replaced runtime classloader directory listing with build-time generated `index.json`
- Excluded transitive `jna`/`commons-io` from `tess4j`; marked `commons-compress` as `provided` scope
- Updated test assertions for LDAP properties; anchored `.gitignore` rules to repo root

#### Added
- GitHub Actions CI/CD workflow for automated TypeDoc, Dokka, and translated docs deployment to `gh-pages`

---

### Phase 6 — Whisper UX & Repeatable Containers

#### Added
- Real-time visual volume gauge for Whisper microphone input
- Full repeatable container support for `AI.Llama.Chat`, `AI.Llama.Standard.QA`, `AI.Llama.Standard.TxtQA`, `AI.OCR`

#### Fixed
- `HTML.Input.Trans.RegEx`: accented characters (e.g., `é`) blocked in regex-tagged inputs
- `checkAttributes()` performance regression during element initialization
- High-latency DOM detachment in repeatable containers causing lost element bindings

---

### Phase 5 — AI Ecosystem Maturation

#### Added
- Brave Search integration with foldable search-query section in chat/QA responses
- Deep thinking mode: hybrid single-model or dedicated reasoning model, with UI status icons
- Specialist models: unlimited configurable models selectable per-functionality via `specialist` parameter
- Concurrent inference throttling: semaphore-based limiter (default: 2) with queue position and ETA display
- `AI.Llama.Std.QA` Element Placeholder: returns AI answers as `Promise` with search/geolocation/JSON support
- Sources panel for `AI.Llama.Standard.TxtQA` with Brave Search citations
- External AI Proxy (`AIproxy`): authenticated HTTP gateway with ChatML, IP whitelist, and Basic Auth
- Fixed language responses via `language` parameter/plugin property
- Browser notifications when AI answers are ready
- AI URL fetch/analysis and email sending via chat interface
- Multi-page PDF/image inference for vision functionalities
- RAM & CPU resource guards via plugin properties
- Periodic health monitoring with UI status indication and auto-retry on recovery

#### Changed
- Upgraded default LLM from QWEN2 2B to QWEN3-VL 2B (improved intelligence + vision)
- Migrated from in-process ONNX to llama.cpp for inference performance boost
- `AI.Llama.Standard.QA`/`TxtQA` display `✨ AI-Generated` label (EU AI Act transparency)

---

### Phase 4 — API-Documentation Manager & Elements Template

#### Added
- Local API-Documentation Manager: Angular component for CRUD operations on CodBi elements, with point-and-click selection, parameter definitions, import/export, duplicate renaming, and backend sync
- CodBi Elements Template ([`CodBi-Elements-Template`](https://github.com/XIMA-formcycle-Entwicklerkreis/CodBi-Elements-Template)): TypeScript project template with esbuild and auto-generated `.json` doc files

---

### Phase 3 — AI Foundation

#### Added
- Whisper Speech-to-Text via whisper.cpp (GGML): live recognition, partial results, auto-language, `Alt+A` hotkey
- Real-time LLaMA Chat: multi-turn, document upload with security validation, chat history, response stopping
- `AI.Llama.Standard.QA`: image/PDF Q&A with auto-trigger, verification mode
- `AI.Llama.Standard.TxtQA`: text-based Q&A with debounced auto-trigger
- Tesseract OCR: Print, Extract Fields, Verify modes with regex extraction, OSD, image preprocessing
- QWEN 2B vision-language model with multimodal projection
- Crash isolation architecture: AI engines run as separate OS processes (LLaMA, Whisper) or JNI (Tesseract)
- Zero-config deployment: automatic binary/model downloading with resume support
- Vulkan (Windows default) and CUDA 12 hardware acceleration with CPU fallback
- PDF-aware uploads: scanned PDFs rendered to images, text PDFs extracted client-side

---

### Phase 2 — Designer Interface & Frontend Ecosystem

#### Added
- Functionality Attribute Interface with autocompletion for all CodBi elements
- EP Interface: browsing and selection UI with parameter documentation
- CSS Class & Global Variable management interfaces
- Standard Configuration selection with form property persistence
- 30+ frontend functionalities: `HTML.Panel`, `HTML.Select.*`, `HTML.Input.*`, `Date.*`, `LDAP.*`, `Media.*`, `JSON.*`, `Print.*`, `Form.Navigator`, `Matomo.Tracking`, and more
- 20+ Element Placeholders: `F`, `I`, `V`, `Data.CSV`, `JSON.Path`, `DOM.Query`, `Date.*`, `OpenPLZ.*`, `LDAP.Find`, `BayVIS.*`, and more
- XDBC (Design by Contract) decorators for runtime parameter contract enforcement

---

### Phase 1 — Platform Foundation

#### Added
- Maven-based Kotlin/TypeScript plugin skeleton for formcycle 8.3.x
- Yarn Berry monorepo with `common`, `designer`, `form` workspace packages
- Form render pipeline: `FormRenderCallback` → `FormRenderProcessor` → `loadConfigs()` → `checkAttributes()`
- Git hooks: automatic code formatting via spotless (ktfmt + Biome)
- Maven Wrapper for reproducible builds
- IDE configurations for VS Code, IntelliJ, and Eclipse
- Build profiles: `dev` (fast, no minification) and default (full with tests)
- `fc-deploy:deploy` hot deployment and `fc-server:run-ms-war` local server launch
