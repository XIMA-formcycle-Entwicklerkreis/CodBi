# Formcycle General — FORM BUILD REFERENCE (pass-2)

Cross-cutting Formcycle rules for the FORM BUILD step. This combines the Formcycle decision core with the exact build annex (EConditionType numeric codes and the server-variable catalog) that the decision core defers to pass-2. The model actually emits the form JSON in THIS pass, so every rule below must be present here — the full Formcycle ColdFusion details (widget sections, CSS lists) are NOT duplicated because they are covered by the CodBi details/widget sections appended alongside.

CRITICAL — EP PARAMETERS & V: EP parameters are RAW, UNQUOTED text (write { BayVIS.Ansprechpartner.Details > Salvatore Callari }, NEVER { ... > "Salvatore Callari" }). A literal person/authority NAME is NOT a variable — variable names never contain spaces. The V EP takes ONLY a GLOBAL VARIABLE NAME; NEVER a name with a space / a quoted person name / a { V > Name } construction for the details. Use V only for an explicitly requested global variable that exists in the top-level "variables" array.

FORM STRUCTURE — FLAT ITEMS WITH PROPERTY-LEVEL REFERENCES: a form is a flat root "items" array whose items are elements. Every element stores its own metadata in "properties" (NOT a top-level "name"): "name" and "id" live inside "properties". Containers (XPage, XHeader, XFooter, XContainer, XFieldSet) reference their children by name in their own "properties.elements" array — never by id. Each element gets a UNIQUE "id" (e.g. prefixed "xi-") and the type-specific className (XTextField, XSelect, XPage, ...). Give each element a MEANINGFUL label in the request's language. A container that "contains" child fields MUST list them in its "properties.elements" and every child must exist as its own item in the root "items". When modifying a container, KEEP its "elements" array (re-emit it) — never empty it.

ELEMENT NAMES use a type prefix: tf for a text field, fd for a fieldset/container, sel for a select, cb for a checkbox, btn for a button, sig for a signature, div for a container. The "id" must be unique and prefixed "xi-". NEVER invent a className — only the ones in the reference are valid, all start with 'X'.

RELATIVE PLACEMENT OF A NEW ELEMENT ("unter dem Container", "über", "below/above X", "neben X"): a POSITION named relative to an EXISTING element is NEVER that element's parent. "unter dem Container X"/"below"/"darunter" means BELOW it, on the SAME LEVEL: add the new element's 'name' directly AFTER the reference's name in the 'elements' array of the REFERENCE's PARENT (page/container) and set its properties.parentid to that PARENT's 'id' — NEVER to the referenced container's 'id', NEVER into the referenced container's OWN 'elements'. "über/oberhalb/darüber/above/before the first element/ganz am Anfang" → insert directly BEFORE the reference (position 0 when first). "neben X/next to X" → a SIBLING directly BEFORE/AFTER X in the PARENT's 'elements'. ONLY an explicit "in den Container"/"im Container"/"inside" makes it a CHILD. When ambiguous between BELOW and INSIDE, choose BELOW. NEVER ask the user to clarify a relative position. When asked to create an INTRO/DESCRIPTION text "at the beginning"/"vor dem ersten Element"/"ganz am Anfang", insert that ONE new element at POSITION 0 of that container's 'elements' array while keeping every other element in its current relative order.

INTRO AT POSITION 0 is a structural rule: append the new intro element's name at index 0 of the target container's/page's 'elements' array; keep all others in relative order.

REMOVALS — REMOVE A FIELD CORRECTLY: when the user asks to REMOVE/DELETE a field/element, drop it from the root "items" array AND remove its 'name' from its parent container's "elements" array. REMOVE-ALL ("remove all fields", "delete all", "alles entfernen", in ANY language): KEEP the first page (XPage), the header (XHeader) and the footer (XFooter) as EMPTY structural shells (their "elements" cleared to []), remove ALL other content elements, list every removed element in the top-level "_removedItems" array, and emit the top-level marker "_removeAll": true (the backend strips this and deletes the orphaned workflow paths). NEVER drop the page/header/footer.

FORBIDDEN FIELDS — do NOT emit these into the form JSON: "css", "script", "image", "imagePPreview", "rendered", "formI18n", "metadata" (server-populated or derived). The output is ONLY valid JSON — a single well-formed form document, never prose, never escaped quotes, never a partial form.

CUSTOM JAVASCRIPT — WHERE AND HOW: custom JS belongs to the ELEMENT itself, as its HTML property (an XSpan's rtevalue / an element's custom HTML), NOT as a form-level "script" field. Write it as a `<button type='button'>` (never a bare `<button>` that submits the form), wrapped in an IIFE, and attach event listeners with a DELAYED, DELEGATED binding (e.g. on 'input'/'click' through the document) — NEVER rely on 'DOMContentLoaded' (the body may load after the script runs) and NEVER call 'event.preventDefault()' unless you truly need it. For LIVE DATA (weather etc.) never ask for a URL / API endpoint / "Datenquelle" / API key / day count: write the self-contained JavaScript against the VERIFIED CORS-ENABLED https endpoints; for a 404 embed/URL, replace ONLY that attribute's VALUE inside the SAME element's HTML with the working URL and keep every other part byte-for-byte.

PARTIAL HTML EDITS — WHEN A REQUEST TARGETS ONLY ONE PART OF AN ELEMENT'S HTML, CHANGE ONLY THAT PART: a single element's HTML may hold SEVERAL independent pieces (a designed text + a JS calculator + a weather forecast). A follow-up targeting ONE widget matches it by the heading/text it renders, re-emits the SAME element (same name/id), and keeps EVERY OTHER PART byte-for-byte UNCHANGED. NEVER blank/shorten/reorder/drop other content, never create a second element for a part that already exists.

NEVER ASK WHETHER AN ELEMENT EXISTS: the form (FORM ELEMENTS / CURRENT FORM STRUCTURE) already tells you what exists. Reuse/modify an existing element with the same purpose (REUSE INSTEAD OF DUPLICATING — duplicates are a FAIL); only create a new element when nothing equivalent exists. Same intent must always resolve to the SAME existing element — a re-run must never grow the form.

BUTTON ACTIONS (XButtonList): each button's "action" is an object. For navigation use action.page with a FORMCYCLE keyword: "" / "next" / "previous" / a page name / or the submit commands "submit", "submitNoCheck", "submitSave", "submitSaveNoCheck", "submitPreview", "submitPreviewWindowed". Set action.check=true to make the button VALIDATE the current page before acting — a "next"/'Weiter' button MUST use check=true when the page has any invalidatable (required/validated) field; a SUBMIT button ALWAYS uses check=true.

CONDITIONAL VISIBILITY/LOCKING/REQUIRED — DECISION: DIRECTION AND THE COMPLETE TRIPLE: the DECISION is WHICH conditional property and on WHICH element — the mechanism is always the complete triple. "SHOW IF / visible if / einblenden wenn" → `hiddenif` with the controlling field's EXACT properties.id. "HIDE if / ausblenden wenn / verstecken wenn" → the same `hiddenif` triple (hidden when the condition is true). "LOCK/disable/grayed out when (deaktiviert, disabled, ausgegraut)" → `readonlyif` (visible but locked) because THERE IS NO `disabledif`/`availableif` PROPERTY — map "disabled" either to readonlyif or to hiddenif + `hiddenifclear`. "MANDATORY/required when" → `requiredif`. ALWAYS emit the complete triple `hiddenif`/`hiddenifcomp`/`hiddenifvalue` (likewise `readonlyif*` and `requiredif*`): the `...if` is the controlling field's EXACT `properties.id`, `...ifcomp` is the EConditionType code (below), `...ifvalue` is the trigger value. OPTION-GATED FIELDS (a field only shown/required for a chosen select option): put the condition DIRECTLY on the dependent field with `hiddenifcomp` = NOT_EQUAL (the code "2") and `hiddenifvalue` = the chosen option's value — this covers BOTH the empty and the "other option" states; NEVER use EQUAL to the OPPOSITE option, NEVER MANDATORY alone, NEVER EMPTY alone.

ECONDITIONTYPE CODES (enum de.xima.fc.form.common.statics.EConditionType — the `*ifcomp` value; identical for hiddenif/readonlyif/requiredif):
- 0 = MANDATORY — true/active when the controlling field HAS a value (e.g. a checkbox is CHECKED).
- 1 = EQUAL — when the controlling field's value EQUALS the `*ifvalue`.
- 2 = NOT_EQUAL — when the controlling field's value is NOT EQUAL to the `*ifvalue`.
- 3 = REGEX — when the controlling field's value MATCHES the `*ifvalue` regex.
- 4 = LESS_THAN — when the controlling field's value is LESS THAN `*ifvalue` (number).
- 5 = GREATER_THAN — when the controlling field's value is GREATER THAN `*ifvalue` (number).
- 6 = BETWEEN — when the controlling field's value is WITHIN the `*ifvalue` range (<min>-<max>).
- 7 = LESS_OR_EQUAL — when the controlling field's value is <= `*ifvalue`.
- 8 = GREATER_OR_EQUAL — when the controlling field's value is >= `*ifvalue`.
- 9 = EMPTY — when the controlling field has NO value (is empty). For a checkbox: hidden while UNCHECKED, shown once CHECKED.
`hiddenifclear` / `readonlyifclear` control the value while the condition is met: "false" or 0 = preserve the value, "1" = clear it, "2" = disable but keep it. `readonlyifmode` exists only on some element types — keep the designer default unless the request needs a specific locking mode. For a field that is ALWAYS locked set the plain flag "isreadonly":"1"; for an always-disabled field "isdisabled":"1". NEVER emit disabledif / disabledifcomp / disabledifvalue / availableif — those keys do not exist and are silently ignored.

STATE-BASED AVAILABILITY — "verfügbar / sichtbar / erscheint / angezeigt (nur) im Status X" → the element is AVAILABLE (RENDERED) only in those states → `statusdependent` + `viewstatus`. "AKTIV / aktiviert / nutzbar / bedienbar / bearbeitbar / freigegeben / enabled / schreibgeschützt im Status X" → the element STAYS VISIBLE but is READ-ONLY there → `readonly_statusdependent` + `readonly_viewstatus`. NEVER use statusdependent+viewstatus for an "aktiv/nutzbar/enabled/schreibgeschützt" request — that would HIDE the element instead of only disabling it. The `*dependent` flags are the STRING "1" (NOT a JSON boolean). The workflow state is encoded by NAME (the NAME the user wrote, never translated, never a UUID you ask for). An "ONLY USABLE IN STATE X" request → `readonly_statusdependent` + `readonly_viewstatus` with the `[!]` marker on the state name (e.g. ["[!]Genehmigt"]) — every array entry is ONE finished string ("[!]GOGO"), the closing bracket comes before the state name, never a split/concatenation expression. A state-dependent element's `viewstatus` array holds the finished STRING state-name values; never ask for workflow state UUIDs; never split the "finished"/state-name string. Typical approval flow: submit button ends in a NEW state; the DECISION buttons (genehmigen/ablehnen) get `statusdependent` + `viewstatus` (only shown there); the editable DATA fields get the `readonly_*` pair (visible but locked once the record moves past the fill-in stage). The user group analogue ('usergroup...dependent') works the same way.

CONTAINER FOR CONDITIONALLY SHOWN FIELDS: a condition can go DIRECTLY on the field itself. Use a container for grouped conditionally-shown fields ONLY IF the container ALREADY exists — NEVER invent a container just to host a condition. The user-group state names / approval flow that hides a whole BLOCK of fields uses the existing container. EXCEPTION — fsBKAllDaten: put the `hiddenif` directly on the fsBKAllDaten XFieldSet.

REPEATABLE CONTAINERS (dynamic rows — a '+' to add another entry, in ANY language): a repeatable group is a DYNAMIC CONTAINER — XContainer/XContainerInvisible with the direct property `dynamic:"1"` (this is what makes it repeatable) plus `dynamicMinSize`, `dynamicMaxSize`, `dynamicAddText` (the '+' button label) and `dynamicDeleteText`. Do NOT add ANY extra element for the add/delete action — the container renders its own buttons. NEVER NEST REPEATABLE CONTAINERS (a dynamic container must NOT contain another dynamic container — Formcycle rejects it; use a SINGLE dynamic container or one repeatable row per entry). When wrapping an EXISTING repeatable (already dynamic) inside a NEW wrapper: create EXACTLY ONE wrapper — a plain NON-dynamic XContainer with data-cb-func=html.panel on the WRAPPER ONLY (put folding on the new outer wrapper, NOT on the original repeatable) — and re-emit the original repeatable with an explicit empty `"attributes": []`. Do not add a second wrapper.

MAKE EXISTING AREAS/SECTIONS COLLAPSIBLE IN PLACE (zugeklappt/eingeklappt) — CONVERT, NEVER REPLACE: keep the SAME element (same name, same id, keep its "elements"/children EXACTLY) and only ADD the folding/panel capability — NEVER delete/recreate an empty panel and NEVER empty the area (omitting children renders an empty form). Folding is decided per element type (see pass-2 for the exact class/func and parameters).

FORMCYCLE OUTPUT RULES FOR IDENTIFIERS — "technicalId" vs "displayText": Formcycle uses BOTH a technical identifier ("technicalId" — an arbitrary DB key) and a human "displayText". The PROMPT/reference names an element by its DISPLAY TEXT; to actually set a matching property (e.g. a BUTTON's triggerParams.buttonName) you emit the technicalId of the matching element. Look it up, never invent it.

WHOLE-FORM TRANSLATION — DECISION SUMMARY: a request like "übersetze das gesamte Formular ins Englische" is a TRANSLATE-THE-FORM request. It is fulfilled by ADDING per-language translation fields ("properties.i18n": { "<languageCode>": { "<property>": "<translation>" } }) — NOT by overwriting the base/default-language texts. Never translate technical identifiers: every element's 'name'/'id'/'className'/'cssclasses'/'rowid' and the entire data-cb-* attribute NAMES and their TECHNICAL values (EP placeholders, [%fieldName%], condition values) stay byte-for-byte. When "translate" appears WITHOUT a target language, ASK which language. The output JSON must be COMPACT (no indentation) and never contain empty i18n. A translation changes no CodBi element → end with "_codbiApplicability": { "codbiVerdict": "none", "considered": [], "applied": [] }. When the translation adds a DIFFERENT language than the form's base, ALSO emit the "_workflowMailLanguages": ["<baseLang>", "<addedLang>", ...] server marker so consumer mails switch language. Translate EVERY consumer-visible text: labels, legends, placeholders, helptexts, page header/subheader, navbar options, select options, button titles, XSpan rtevalue content, dynamicAddText/dynamicDeleteText. An untranslated visible text is a FAIL.

## Server Variables (Placeholders)

AVAILABLE SERVER VARIABLES (system placeholders — use [%\$NAME%] syntax):

FORM RECORD:
- [%\$PROCESS_ID%] — form record process ID (string)
- [%\$RECORD_ID%] — form record database ID (numeric)
- [%\$RECORD_SUBJECT%] — form record subject/title
- [%\$RECORD_READ%] — true/false whether record has been read
- [%\$RECORD_UNREAD%] — true/false whether record is unread
- [%\$RECORD_ATTR%] or [%\$RECORD_ATTR.customKey%] — custom record attributes
- [%\$SOURCE_SERVER%] — source server name
- [%\$SOURCE_SERVER_URL%] — source server URL

WORKFLOW STATUS:
- [%\$STATUS_ID%] — current workflow status ID
- [%\$STATUS_TYPE%] — current workflow status type
- [%\$STATUS_NAME%] — current workflow status name

PROJECT:
- [%\$PROJECT_ID%] — project ID
- [%\$PROJECT_ALIAS%] — project alias
- [%\$PROJECT_NAME%] — project name
- [%\$PROJECT_TITLE%] — project title
- [%\$PROJECT_DESCRIPTION%] — project description

CLIENT:
- [%\$CLIENT_ID%] — client/mandant ID
- [%\$COUNTER_CLIENT%] or [%\$COUNTER_CLIENT.someKey%] — client counter
- [%\$DEFAULT_MAIL_SENDER%] — system default mail sender address
- [%\$CLIENT_MAIL_SENDER%] — client mail sender address
- [%\$DEFAULT_MAIL_SENDERNAME%] — system default mail sender name
- [%\$CLIENT_MAIL_SENDERNAME%] — client mail sender name

USER DATA (supports JSONPath, e.g. [%\$USER.firstName%]):
- [%\$USER%] — current user data (JSON)
- [%\$INITIAL_USER%] — initial submitter data (JSON)
- [%\$LAST_USER%] — last editor data (JSON)

LINKS:
- [%\$FORM_LINK%] — link to the form
- [%\$FORM_REVIEW_LINK%] — link to review the form record
- [%\$FORM_PROCESS_LINK%] — link to the process view (the current state of the record)
- [%\$FORM_INVITE_LINK%] — invitation link
- [%\$FORM_VERIFY_LINK%] — DOI email verification link
- [%\$FORM_VERIFY_PAGE_LINK%] — DOI verification page link
- [%\$FORM_INBOX_LINK%] — link to the form inbox
- [%\$FORM_INBOX_NAME%] — form inbox name
- [%\$FORM_PROCESS_HTML%] — process protocol as HTML
- [%\$PORTAL_LINK%] — user portal link
- [%\$PORTAL_FORM_RECORDS_LINK%] — portal form records link

A LINK TO THE FORM / TO THE CURRENT STATE OF THE FORM (e.g. an approval/review mail "mit einem Link zum aktuellen Stand des Formulars") is [%\$FORM_PROCESS_LINK%] (the process view) — use it DIRECTLY in the mail body/parameter; it is what is meant most of the time when a link to the form is requested. [%\$FORM_REVIEW_LINK%] reviews the form record; [%\$FORM_LINK%] is the plain link to the (blank) form and is only requested rarely; [%\$FORM_INVITE_LINK%] is an invitation link. NEVER ask for a URL template for such a link and NEVER invent a URL.

WORKFLOW ERRORS (prefix: CURRENT_, LATEST_, or LAST_):
- [%\$CURRENT_ERROR%] — the thrown error object
- [%\$CURRENT_ERROR_CODE%] — the error code/type
- [%\$CURRENT_ERROR_MESSAGE%] — the error message
- [%\$CURRENT_ERROR_NODE_NAME%] — name of the node that threw the error
- [%\$CURRENT_ERROR_NODE_TYPE%] — type of the node that threw the error
- (same with LATEST_ or LAST_ prefix)

APPOINTMENTS:
- [%\$APPOINTMENT%] — appointment data
- [%\$APPOINTMENT_LIST%] — appointments list (HTML)
- [%\$APPOINTMENT_LINK%] — appointment booking link
