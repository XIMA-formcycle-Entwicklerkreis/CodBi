# Formcycle General — WORKFLOW BUILD REFERENCE

Cross-cutting Formcycle rules for the WORKFLOW build step. This combines the Formcycle decision core with the exact build annex (EConditionType numeric codes and the server-variable catalog) needed to emit correct workflow task JSON and to reference form elements/buttons/states/placeholders.

CRITICAL — EP PARAMETERS & V: EP parameters are RAW, UNQUOTED text (write { BayVIS.Ansprechpartner.Details > Salvatore Callari }, NEVER { ... > "Salvatore Callari" }). A literal person/authority NAME is NOT a variable — variable names NEVER contain spaces. The V EP takes ONLY a GLOBAL VARIABLE NAME (e.g. SALVATORE_CALLARI_CONTACT, BayVIS_Behoerde); NEVER a name with a space / a quoted person name / a { V > Name } construction for the details. Use V only for an explicitly requested global variable that exists in the top-level "variables" array.

FORM STRUCTURE — FLAT ITEMS WITH PROPERTY-LEVEL REFERENCES: a form is a flat root "items" array whose items are elements. Every element stores its own metadata in "properties" (NOT a top-level "name"): "name" and "id" live inside "properties". Containers (XPage, XHeader, XFooter, XContainer, XFieldSet) reference their children by name in their own "properties.elements" array — never by id. Each element gets a UNIQUE "id" (prefixed "xi-") and the type-specific className (XTextField, XSelect, XPage, ...). Give each element a MEANINGFUL label in the request's language. A container that "contains" child fields MUST list them in its "properties.elements" and every child must exist as its own item in the root "items". When modifying a container, KEEP its "elements" array (re-emit it) — never empty it.

ELEMENT NAMES use a type prefix: tf for a text field, fd for a fieldset/container, sel for a select, cb for a checkbox, btn for a button, sig for a signature, div for a container. The "id" must be unique and prefixed "xi-". NEVER invent a className — only the ones in the reference are valid, all start with 'X'.

RELATIVE PLACEMENT OF A NEW ELEMENT ("unter dem Container", "über", "below/above X", "neben X"): a POSITION named relative to an EXISTING element is NEVER that element's parent. "unter dem Container X"/"below"/"darunter" means BELOW it, on the SAME LEVEL: add the new element's 'name' directly AFTER the reference's name in the 'elements' array of the REFERENCE's PARENT (page/container) and set its properties.parentid to that PARENT's 'id' — NEVER to the referenced container's 'id', NEVER into the referenced container's OWN 'elements'. "über/oberhalb/darüber/above/before the first element/ganz am Anfang" → insert directly BEFORE the reference (position 0 when first). "neben X/next to X" → a SIBLING directly BEFORE/AFTER X in the PARENT's 'elements'. ONLY an explicit "in den Container"/"im Container"/"inside" makes it a CHILD. When ambiguous between BELOW and INSIDE, choose BELOW. NEVER ask the user to clarify a relative position. An INTRO/DESCRIPTION text "at the beginning"/"vor dem ersten Element"/"ganz am Anfang" is inserted at POSITION 0 of that container's 'elements' array, keeping every other element in relative order.

REMOVALS — REMOVE A FIELD CORRECTLY: when the user asks to REMOVE/DELETE a field/element, drop it from the root "items" array AND remove its 'name' from its parent container's "elements" array, AND list its 'properties.name' in a top-level '_removedItems' array. REMOVE-ALL ("remove all fields", "delete all", "alles entfernen", in ANY language): KEEP the first page (XPage), header (XHeader) and footer (XFooter) as EMPTY structural shells (their "elements" cleared to []), remove ALL other content, list every removed element in '_removedItems', and emit the top-level marker "_removeAll": true (the backend strips this and deletes the orphaned workflow paths). NEVER drop the page/header/footer.

FORBIDDEN FIELDS — do NOT emit these into the form JSON: "css", "script", "image", "pagePreview", "rendered", "formI18n", "metadata" (server-populated or derived). Output is ONLY valid JSON.

BUTTON ACTIONS (XButtonList): each button's "action" is an object. For navigation use action.page with a FORMCYCLE keyword: "" (none/custom) / "next" / "previous" / a page name / or the submit commands "submit", "submitNoCheck", "submitSave", "submitSaveNoCheck", "submitPreview", "submitPreviewWindowed". Set action.check=true to make the button VALIDATE the current page before acting — a "next"/'Weiter' button MUST use check=true when the page has any invalidatable (required/validated) field; a SUBMIT button ALWAYS uses check=true. This is also what the workflow's FC_FORM_SUBMIT_BUTTON triggerParams.buttonName targets (a button's technicalId).

CONDITIONAL VISIBILITY/LOCKING/REQUIRED — the complete triple: the DECISION is WHICH conditional property and on WHICH element. "SHOW IF / visible if / einblenden wenn" and "HIDE if / ausblenden wenn / verstecken wenn wenn" → `hiddenif` with the controlling field's EXACT properties.id. "LOCK/disable/grayed out when (deaktiviert, disabled, ausgegraut)" → `readonlyif` (visible but locked) because THERE IS NO `disabledif`/`availableif` PROPERTY. "MANDATORY/required when" → `requiredif`. ALWAYS emit the complete triple `...if` (the controlling field's EXACT `properties.id`) / `...ifcomp` (the EConditionType code below) / `...ifvalue` (the trigger value), plus `...ifclear` when the value handling matters. OPTION-GATED FIELDS (a field only shown/required for a chosen select option): put the condition DIRECTLY on the dependent field with `hiddenifcomp` = NOT_EQUAL (code "2") and `hiddenifvalue` = the chosen option's value — this covers BOTH the empty and the "other option" states; NEVER use EQUAL to the OPPOSITE option, NEVER MANDATORY alone, NEVER EMPTY alone.

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

STATE-BASED AVAILABILITY — "verfügbar / sichtbar / erscheint / angezeigt (nur) im Status X" → element is AVAILABLE (RENDERED) only in those states → `statusdependent` + `viewstatus`. "AKTIV / aktiviert / nutzbar / bedienbar / bearbeitbar / freigegeben / enabled / schreibgeschützt im Status X" → element STAYS VISIBLE but is READ-ONLY there → `readonly_statusdependent` + `readonly_viewstatus`. NEVER use statusdependent+viewstatus for an "aktiv/nutzbar/enabled/schreibgeschützt" request — that would HIDE the element instead of only disabling it. The `*dependent` flags are the STRING "1" (NOT a JSON boolean). The workflow state is encoded by NAME (the NAME the user wrote, never translated, never a UUID you ask for). "ONLY USABLE IN STATE X" → `readonly_statusdependent` + `readonly_viewstatus` with the `[!]` marker on the state name (e.g. ["[!]Genehmigt"]) — every array entry is ONE finished string ("[!]GOGO"), the closing bracket comes before the state name, never a split/concatenation expression. User-group analogues: `usergrouppendent` + `viewusergroup`, `readonly_usergrouppendant` + `readonly_viewusergroup`. In the WORKFLOW output you gate decision buttons via the TOP-LEVEL "buttonStatus" field (the pending state name); the backend writes statusdependent="1" + viewstatus=[<state UUID>] on a dedicated state-gated XButtonList. For an approve/reject flow the submit lane ends in a NEW state (endpointState) and the two decision buttons appear only once the record is in that state.

CONTAINER FOR CONDITIONALLY SHOWN FIELDS: a condition can go DIRECTLY on the field itself. Use a container for grouped conditionally-shown fields ONLY IF the container ALREADY exists — NEVER invent a container just to host a condition. EXCEPTION — fsBKAllDaten: put the `hiddenif` directly on the fsBKAllDaten XFieldSet.

REPEATABLE (DYNAMIC) CONTAINERS — the FORM side: a repeatable group is XContainer/XContainerInvisible with the direct property `dynamic:"1"` plus `dynamicMinSize`, `dynamicMaxSize`, `dynamicAddText` (the '+' button label) and `dynamicDeleteText`. Do NOT add ANY extra element for the add/delete action — the container renders its own buttons. NEVER NEST REPEATABLE CONTAINERS (a dynamic container must NOT contain another dynamic container — Formcycle rejects it). The WORKFLOW side iterates a repeatable container with FC_FOR_EACH_LOOP (sourceType FORM_FIELD_REPETITIONS, fieldTechnicalId = ONE field inside the container, NOT the container name), accumulates each row via FC_WRITE_FORM_RECORD_ATTRIBUTES (inside the loop's _childNodes) into a server attribute, and references [%$RECORD_ATTR.<key>%] in the final content — see the REPEATABLE_CONTAINERS section of the workflow task instruction for the worked example.

FORMCYCLE OUTPUT RULES FOR IDENTIFIERS — "technicalId" vs "displayText": Formcycle uses BOTH a technical identifier ("technicalId" — an arbitrary DB key) and a human "displayText". The PROMPT/reference names an element by its DISPLAY TEXT; to actually set a matching property (e.g. a BUTTON's triggerParams.buttonName) you emit the technicalId of the matching element. Look it up, NEVER invent it. FORM ELEMENTS entries have: 'technicalId' (always), 'displayText' (visible label/text), 'type' (e.g. XTextField, BUTTON), and optionally 'required', 'placeholder', 'options' (for XSelect), 'actionPage' (for BUTTON). Elements with type 'BUTTON' are individual clickable buttons — for triggerParams.buttonName ALWAYS use the 'technicalId' of the individual BUTTON whose 'displayText' matches, never a container's id.

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
- [%\$PROJECT_ID%] / [%\$PROJECT_ALIAS%] / [%\$PROJECT_NAME%] / [%\$PROJECT_TITLE%] / [%\$PROJECT_DESCRIPTION%]

CLIENT:
- [%\$CLIENT_ID%] — client/mandant ID
- [%\$COUNTER_CLIENT%] or [%\$COUNTER_CLIENT.someKey%] — client counter
- [%\$DEFAULT_MAIL_SENDER%] / [%\$CLIENT_MAIL_SENDER%] — system / client mail sender address
- [%\$DEFAULT_MAIL_SENDERNAME%] / [%\$CLIENT_MAIL_SENDERNAME%] — system / client mail sender name

USER DATA (supports JSONPath, e.g. [%\$USER.firstName%]):
- [%\$USER%] — current user data (JSON)
- [%\$INITIAL_USER%] — initial submitter data (JSON)
- [%\$LAST_USER%] — last editor data (JSON)

LINKS:
- [%\$FORM_LINK%] — link to the (blank) form
- [%\$FORM_REVIEW_LINK%] — link to review the form record
- [%\$FORM_PROCESS_LINK%] — link to the process view (the current state of the record) — use DIRECTLY for "link to the form / current state" in a mail body
- [%\$FORM_INVITE_LINK%] — invitation link
- [%\$FORM_VERIFY_LINK%] — DOI email verification link
- [%\$FORM_VERIFY_PAGE_LINK%] — DOI verification page link
- [%\$FORM_INBOX_LINK%] / [%\$FORM_INBOX_NAME%] — form inbox link / name
- [%\$FORM_PROCESS_HTML%] — process protocol as HTML
- [%\$PORTAL_LINK%] / [%\$PORTAL_FORM_RECORDS_LINK%] — user portal links

WORKFLOW ERRORS (prefix: CURRENT_, LATEST_, or LAST_):
- [%\$CURRENT_ERROR%] / [%\$CURRENT_ERROR_CODE%] / [%\$CURRENT_ERROR_MESSAGE%] / [%\$CURRENT_ERROR_NODE_NAME%] / [%\$CURRENT_ERROR_NODE_TYPE%]
- (same with LATEST_ or LAST_ prefix, e.g. [%\$LATEST_ERROR_MESSAGE%]). For an error-notification mail use the LATEST_ variants, NEVER CURRENT_ (see the ERROR-NOTIFICATION EMAIL BODY rule).

APPOINTMENTS:
- [%\$APPOINTMENT%] — appointment data
- [%\$APPOINTMENT_LIST%] — appointments list (HTML)
- [%\$APPOINTMENT_LINK%] — appointment booking link
