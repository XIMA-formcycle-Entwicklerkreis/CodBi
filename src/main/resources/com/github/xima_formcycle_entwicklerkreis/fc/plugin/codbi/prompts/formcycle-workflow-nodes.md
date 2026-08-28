# Formcycle Workflow Nodes

Output format: Output EITHER a single JSON object (for ONE workflow lane) OR an array of JSON objects (for MULTIPLE lanes).

Single lane: {"taskName":"...","taskDescription":"...","triggerType":"...","triggerParams":{},"nodeType":"...","nodeParams":{},"endpointState":"...","endpointType":"..."}
Multiple lanes: [{"taskName":"...",...},{"taskName":"...",...}]

Each object has exactly these keys: taskName, taskDescription, triggerType, triggerParams, nodeType, nodeParams, endpointState, endpointType.

CRITICAL — taskName is MANDATORY for EVERY node type. Always set a short, meaningful AND SPECIFIC description. Include key details like the target URL (without http://), template name, parameter names/values, email subject, file name, or HTTP endpoint. taskName CHARACTER RESTRICTIONS — only letters (a-z, A-Z), numbers (0-9), spaces, hyphens (-), underscores (_), and parentheses () are allowed. Characters like dots (.), equals signs (=), slashes (/), colons (:), question marks (?), ampersands (&), and all other special characters are FORBIDDEN in taskName. If the user's prompt contains such characters, replace them with allowed alternatives (e.g. "msn.de" → "msn de", "F2=YOLO" → "F2 equals YOLO", "http://..." → omit the protocol).
LANGUAGE — write taskName, ALL node names/labels, and the endpointState label in the SAME language as the user's request: a German prompt → German taskName (e.g. "Zeilen als JSON in Hulu schreiben") and a German endpoint label (e.g. "Empfangen" instead of "Received"); an English prompt → English. Never fall back to a default language.

REQUIRED PARAMS — Most node types need mandatory nodeParams. Whenever a required value is missing from the user's request and cannot be derived, ASK the user for it (clarification) instead of inventing one. Common required values: FC_EMAIL → senderAddress, subject, recipient (recipientMessageService/address), message; FC_DOI_INIT → success + failure completion pages, sender, subject, recipient; FC_POST_REQUEST → URL + HTTP method; FC_REDIRECT → URL or urlTemplate; FC_SHOW_TEMPLATE → htmlTemplate; FC_MOVE_FORM_RECORD_TO_INBOX → inboxName; FC_SAVE_TO_FILE_SYSTEM → path; FC_SAVE_TO_WEBDAV → connection + path; FC_FILL_PDF / FC_FILL_WORD → template + field mapping; FC_CREATE_TEXT_FILE → file name + content; FC_CHANGE_FORM_VALUE / FC_WRITE_FORM_RECORD_ATTRIBUTES → field/attribute + value; FC_SET_FORM_RECORD_PASSWORD → password; FC_CHANGE_STATE → the target state.

REPEATABLE-CONTAINER → JSON → STORAGE (prominent, UNIVERSAL rule):
- When form data lives in a REPEATABLE (dynamic) container — an UNKNOWN number of rows — and must be stored as ONE JSON value (in a database column, a CMIS node/document, a file, a form field, a server attribute, ...), the row count is UNKNOWN at design time. NEVER hardcode a JSON literal with field placeholders (e.g. '[{"name":"[%tfName%]","data":"[%tfData%]"}]') — that captures only one row and is not dynamic.
- Instead, build the JSON at RUNTIME by STRING-CONCATENATION on a server attribute, with the SAME universal pattern regardless of the target: (1) FC_WRITE_FORM_RECORD_ATTRIBUTES seeds the server attribute with the OPENING bracket "["; (2) iterate the container with FC_FOR_EACH_LOOP (sourceType FORM_FIELD_REPETITIONS) and, per row, append the row's JSON object onto the value (value = [%\$RECORD_ATTR.<key>%] + row object, comma-separated) via FC_WRITE_FORM_RECORD_ATTRIBUTES — this per-row append MUST be placed INSIDE the loop's nodeParams._childNodes so it runs once per row; (3) after the loop, FC_WRITE_FORM_RECORD_ATTRIBUTES appends the CLOSING bracket "]"; (4) store the accumulated [%\$RECORD_ATTR.<key>%] ONCE via the node matching the target the prompt names: a database/table/column → FC_SQL_STATEMENT; a CMIS node/document → the CMIS write node; a text/JSON/XML file → FC_CREATE_TEXT_FILE; a specific form field → FC_CHANGE_FORM_VALUE; otherwise the server attribute itself is the result.
- This seed-"[" → append-rows-in-loop → close-"]" → write-once pattern is UNIVERSAL and applies to ANY target (database, CMIS, file, form field, server attribute, ...). See the FC_FOR_EACH_LOOP "COLLECT-ROWS-TO-JSON" pattern for the full detail.

EXAMPLES per node type (taskName pattern = action + key details):
  FC_REDIRECT:       "Redirect to msn de with parameter F2 equals YOLO" (NOT generic like "Redirect on submit with parameter")
  FC_SHOW_TEMPLATE:   "Show Allgemeiner Fehler 2 completion page"
  FC_EMAIL:           "Send DOI email with subject Welcome"
  FC_RETURN_FILE:     "Download xoxo txt on submit" (NOT "File download")
  FC_CREATE_TEXT_FILE: "Create YOLO content text file on submit" (NOT "Create file")
  FC_POST_REQUEST:    "Send data to example com api" (NOT "HTTP request")
  FC_CHANGE_STATE:    "Set status to Approved" (NOT "Status change")
  FC_LOG_ENTRY:       "Log submission to process log"
Apply this pattern to ANY nodeType, not just those listed.

CRITICAL — Use an array ONLY when the user's request describes MULTIPLE INDEPENDENT workflows triggered by DIFFERENT events.
Example of when to use an array: "Send a DOI invitation when the form is submitted, then send a welcome email after the email is confirmed." → Lane 1: FC_FORM_SUBMIT_BUTTON → FC_DOI_INIT, Lane 2: FC_DOI_VERIFIED → FC_EMAIL
Do NOT use an array for setting a form record status — the status transition (endpointState) is automatically added as the bottommost node of EVERY lane.

CHAINED NODES ("chainedNodes" field) — For sequential actions where the second action processes the first action's output (e.g. decode Base64 then download the result), add a "chainedNodes" array inside a single task spec. Each entry has "nodeType" and "nodeParams". Use "%prev%" to reference the preceding node's UUID.
CRITICAL — SEQUENTIAL FOLLOW-UP ACTIONS MUST GO IN TOP-LEVEL "chainedNodes" (a sibling of "nodeType"/"nodeParams"), NEVER in "_childNodes" and NEVER inside "nodeParams". "_childNodes" is ONLY the YES-branch of conditional/loop/switch/experiment nodes (FC_MULTIPLE_CONDITION, FC_FOR_EACH_LOOP, FC_WHILE_LOOP, FC_DO_UNTIL_LOOP, FC_WITH_FORM_ELEMENT_CONTEXT, FC_SWITCH, FC_EXPERIMENT, CheckTrustLevelPlugin). Putting a plain follow-up action (e.g. FC_EMAIL after FC_LOG_ENTRY) into "_childNodes" or "nodeParams.chainedNodes" of a NON-branch node DROPS that action — it is never created. Use TOP-LEVEL "chainedNodes" for such sequential actions. FC_EMAIL content goes into "body" (never "message"). Also, endpointType "FC_RETURN" is ONLY valid with endpointState "" (empty); when the process must end WITH a status, use endpointType "FC_CHANGE_STATE" and set endpointState to that status.

LOOP CHILD NODE PLACEMENT (CRITICAL — applies to FC_FOR_EACH_LOOP, FC_WHILE_LOOP, FC_DO_UNTIL_LOOP, and any conditional/scoping node with children):
- The actions that must run ONCE PER ITERATION (per row / per item) MUST be placed INSIDE the loop node's nodeParams."_childNodes" array, each as an object with "nodeType" and "nodeParams".
- They MUST NOT be placed in "chainedNodes" and MUST NOT be emitted as a sibling node listed AFTER the loop. Nodes in "chainedNodes" (and any node placed after the loop in the same sequence) are created as SIBLINGS of the loop that run exactly ONCE, AFTER all loop iterations — so a per-row append placed there would run only ONCE and the accumulated JSON would never grow.
- Nodes that must run ONCE AFTER the loop (the closing bracket "]" write, the single final SQL/CMIS/file/field write) go AFTER the loop in the chain — never inside "_childNodes".
- Example — the per-row build/append write goes INSIDE "_childNodes":
  {"nodeType":"FC_FOR_EACH_LOOP","nodeParams":{"fieldTechnicalId":"tfData","sourceType":"FORM_FIELD_REPETITIONS","_childNodes":[{"nodeType":"FC_WRITE_FORM_RECORD_ATTRIBUTES","nodeParams":{"attributes":[{"name":"narrativeJson","value":"[%\$RECORD_ATTR.narrativeJson%],{\"Name\":\"[%tfName%]\",\"Data\":\"[%tfData%]\"}"}]}}]}}
  The "_childNodes" array is what makes the engine execute the write ONCE PER ROW. If the identical FC_WRITE_FORM_RECORD_ATTRIBUTES object is instead emitted as a "chainedNodes" entry or as a node after the loop, it executes exactly ONCE total — the JSON would hold only one row and the loop would do nothing.

PLACEHOLDERS: To include a form field value in email body/subject/recipient use [%technicalId%] where 'technicalId' is taken from the FORM ELEMENTS list. Example: [%tfEmail%] for a field whose 'technicalId' is 'tfEmail'.

REPEATED / DYNAMIC ELEMENTS IN THE WORKFLOW (from the Formcycle "Repeated elements in the workflow" article):
- In the FORM, every duplicated element of a repeatable/dynamic container gets a generated name following the schema `Elementname_index` — e.g. three instances of `tf1` become `tf1_0`, `tf1_1`, `tf1_2`. These per-instance names (name + `_` + zero-based index) can be referenced directly (e.g. `[%tf1_0%]` in an inbox column or a workflow action).
- In the INBOX and in the WORKFLOW, a plain `[%fieldName%]` placeholder of a dynamic element returns ALL its values joined with commas (one comma-separated string). For per-row processing (or to build a combined value like a JSON array or a multi-line list) do NOT rely on that string — iterate the container with FC_FOR_EACH_LOOP (sourceType FORM_FIELD_REPETITIONS) and place the per-row action in `_childNodes` (see REPEATABLE-CONTAINER → JSON → STORAGE above).

AVAILABLE SERVER VARIABLES (system placeholders — use [%\$NAME%] syntax, no curly braces):
  FORM RECORD:
    [%\$PROCESS_ID%] — form record process ID (string)
    [%\$RECORD_ID%] — form record database ID (numeric)
    [%\$RECORD_SUBJECT%] — form record subject/title
    [%\$RECORD_READ%] — true/false whether record has been read
    [%\$RECORD_UNREAD%] — true/false whether record is unread
    [%\$RECORD_ATTR%] or [%\$RECORD_ATTR.customKey%] — custom record attributes
    [%\$SOURCE_SERVER%] — source server name
    [%\$SOURCE_SERVER_URL%] — source server URL
  WORKFLOW STATUS:
    [%\$STATUS_ID%] — current workflow status ID
    [%\$STATUS_TYPE%] — current workflow status type
    [%\$STATUS_NAME%] — current workflow status name
  PROJECT:
    [%\$PROJECT_ID%] — project ID
    [%\$PROJECT_ALIAS%] — project alias
    [%\$PROJECT_NAME%] — project name
    [%\$PROJECT_TITLE%] — project title
    [%\$PROJECT_DESCRIPTION%] — project description
  CLIENT:
    [%\$CLIENT_ID%] — client/mandant ID
    [%\$COUNTER_CLIENT%] or [%\$COUNTER_CLIENT.someKey%] — client counter
    [%\$DEFAULT_MAIL_SENDER%] — system default mail sender address
    [%\$CLIENT_MAIL_SENDER%] — client mail sender address
    [%\$DEFAULT_MAIL_SENDERNAME%] — system default mail sender name
    [%\$CLIENT_MAIL_SENDERNAME%] — client mail sender name
  USER DATA (supports JSONPath, e.g. [%\$USER.firstName%]):
    [%\$USER%] — current user data (JSON)
    [%\$INITIAL_USER%] — initial submitter data (JSON)
    [%\$LAST_USER%] — last editor data (JSON)
  LINKS:
    [%\$FORM_LINK%] — link to the form
    [%\$FORM_REVIEW_LINK%] — link to review the form record
    [%\$FORM_PROCESS_LINK%] — link to the process view
    [%\$FORM_INVITE_LINK%] — invitation link
    [%\$FORM_VERIFY_LINK%] — DOI email verification link
    [%\$FORM_VERIFY_PAGE_LINK%] — DOI verification page link
    [%\$FORM_INBOX_LINK%] — link to the form inbox
    [%\$FORM_INBOX_NAME%] — form inbox name
    [%\$FORM_PROCESS_HTML%] — process protocol as HTML
    [%\$PORTAL_LINK%] — user portal link
    [%\$PORTAL_FORM_RECORDS_LINK%] — portal form records link
  WORKFLOW ERRORS (prefix: CURRENT_, LATEST_, or LAST_):
    [%\$CURRENT_ERROR%] — the thrown error object
    [%\$CURRENT_ERROR_CODE%] — the error code/type
    [%\$CURRENT_ERROR_MESSAGE%] — the error message
    [%\$CURRENT_ERROR_NODE_NAME%] — name of the node that threw the error
    [%\$CURRENT_ERROR_NODE_TYPE%] — type of the node that threw the error
    (same with LATEST_ or LAST_ prefix, e.g. [%\$LATEST_ERROR_CODE%])
    Optional: append (index) for a specific exception, e.g. [%\$CURRENT_ERROR(0)%]
  APPOINTMENTS:
    [%\$APPOINTMENT%] — appointment data
    [%\$APPOINTMENT_LIST%] — appointments list (HTML)
    [%\$APPOINTMENT_LINK%] — appointment booking link

CRITICAL — output rules for form element identifiers:
  FORM ELEMENTS entries have: 'technicalId' (always), 'displayText' (visible label/text), 'type' (e.g. XTextField, BUTTON),
  and optionally: 'required' (boolean), 'placeholder', 'options' (for XSelect — array of {text,value}), 'actionPage' (for BUTTON — e.g. 'submit', 'submitNoCheck').
  'technicalId' is an ARBITRARY internal database key — it can look like anything (e.g. 'tfHurra', 'x9q', 'abc123').
  'displayText' is what the user sees in the browser.
  The user's prompt refers to 'displayText'. Find the matching element, then copy its 'technicalId' EXACTLY.
  NEVER use a 'displayText' value in the output. NEVER guess or invent a technicalId.
  Even if the 'technicalId' looks wrong or random, copy it character-for-character.
  Elements with type 'BUTTON' are individual clickable buttons. For triggerParams.buttonName always use
  the 'technicalId' of the individual BUTTON whose 'displayText' matches — never use a container's id.
  BUTTON entries may have 'actionPage' (e.g. 'submit', 'submitNoCheck', 'next', 'prev') — use this to
  identify which button submits the form when the user says 'submit button', 'Absende-Button', etc.
  NO-MATCH RULE: If no BUTTON in FORM ELEMENTS matches the description, use triggerParams:{} (matches any
  button) instead of inventing a buttonName. NEVER construct names like 'btnSubmitOnP2' or similar.

EXAMPLE (note: technicalId values are arbitrary — use them verbatim):
  FORM ELEMENTS: [{"technicalId":"tfHurra","displayText":"Mail","type":"XTextField"},{"technicalId":"btnZwolf","displayText":"Senden","type":"BUTTON","actionPage":"submit"}]
  User: "Wenn Senden geklickt wird, E-Mail an das Mail-Feld schicken."
  Step 1 — find button: user says 'Senden' → matches displayText 'Senden' → technicalId is 'btnZwolf' → use "btnZwolf"
  Step 2 — find field:  user says 'Mail-Feld' → matches displayText 'Mail'   → technicalId is 'tfHurra'  → use [%tfHurra%]
  Output: {"taskName":"E-Mail bei Absenden","taskDescription":"","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{"buttonName":"btnZwolf"},"nodeType":"FC_EMAIL","nodeParams":{"to":"[%tfHurra%]","subject":"Eingang","body":"<p>Ihr Formular wurde empfangen.</p>"},"endpointState":"Empfangen","endpointType":"FC_CHANGE_STATE"}
  User input: "Beim Klick auf submit soll der Prozess beendet werden."
  Output: {"taskName":"Prozess beenden bei Absenden","taskDescription":"","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"FC_RETURN","nodeParams":{},"endpointState":"","endpointType":"FC_RETURN"}

## Trigger Types

### FC_FORM_SUBMIT_BUTTON
Fires when a submit button is clicked.
- triggerParams: {"buttonName":"<technical name>"} or {} for any button
- The form must actually have a submit button (an XButtonList button with action.page "submit") for
  this trigger to fire. When the FORM ELEMENTS list shows no submit button (no BUTTON with
  actionPage "submit" / "submitNoCheck") and the user only describes actions "beim Klick auf den
  Senden-Button" without naming an existing button, still build the lane with triggerParams:{} —
  the backend automatically adds a "Senden" submit button to the form so the lane is reachable.

### FC_QUALIFIED_FORM_SUBMIT_BUTTON
Fires when a qualified (electronic signature) submit button is clicked.
- triggerParams: {"buttonName":"<name>","qualifier":"<qualifier>"}

### FC_MANUAL
Manual invocation (user triggered).
- triggerParams: {} (allowed states/groups configured in the FC designer)

### FC_STATE_TIMER
Fires AFTER A TIME DELAY once a record enters a specific state. This is a TIME-BASED trigger. It does NOT fire immediately on state change — it waits for the configured duration.
- CRITICAL — You MUST set 'applicableStateNames' to the state(s) to watch. Without this, the trigger has no states selected and will never fire.
- triggerParams: {"applicableStateNames":["StateName1","StateName2"],"durationDays":<N>,"durationHours":<N>,"durationMinutes":<N>}
- Example: "2 Stunden nach Statusänderung auf 'Abgesendet'" → {"applicableStateNames":["Abgesendet"],"durationDays":0,"durationHours":2,"durationMinutes":0}

### FC_TIME_POINT
Fires at a specific date/time. Has TWO modes:
- Mode 1 — FIXED: fires at a fixed calendar date/time. fixedDateTime MUST include both the date AND time in ISO-8601 format WITH timezone offset (e.g. "2026-07-02T08:48:00+02:00"). If the user specifies only a time (e.g. "um 08:48 Uhr"), use TODAY's date and the Europe/Berlin timezone. CRITICAL — Do NOT omit the date. Do NOT omit the timezone.
- triggerParams: {"timePointType":"FIXED","fixedDateTime":"<ISO-8601 with offset>","fireWhenInPast":<true|false>}
- Mode 2 — EXPRESSION_WITH_FORMAT: fires at a date/time computed from a form field value, optionally with an offset. Use when the user says "X days|hours|weeks|months|years after field Y", "one day after the date in Start", "zwei Wochen nach Start", etc.
- The dateTimeTemplate uses [%technicalId%] to reference a form field. The dateTimeFormat is a Java DateTimeFormatter pattern matching the field's date format (typically "dd.MM.yyyy" for German date fields).
- triggerParams: {"timePointType":"EXPRESSION_WITH_FORMAT","dateTimeTemplate":"[%technicalId%]","dateTimeFormat":"<pattern>","operation":"PLUS|MINUS","offsetDuration":"<number>","durationUnit":"DAYS|HOURS|MINUTES|SECONDS|WEEKS|MONTHS|YEARS","fireWhenInPast":<true|false>}
- CRITICAL — Map the time units EXACTLY to durationUnit in ANY language (German: "Sekunde"/"Sekunden" → SECONDS; "Minute"/"Minuten" → MINUTES; "Stunde"/"Stunden" → HOURS; "Tag"/"Tage" → DAYS; "Woche"/"Wochen" → WEEKS; "Monat"/"Monate" → MONTHS; "Jahr"/"Jahre" → YEARS. English: "second(s)" → SECONDS; "minute(s)" → MINUTES; "hour(s)" → HOURS; "day(s)" → DAYS; "week(s)" → WEEKS; "month(s)" → MONTHS; "year(s)" → YEARS. Apply the same mapping for any other language by meaning, not by word list.)
- Examples:
  "Ein Tag nach Start"        → {"timePointType":"EXPRESSION_WITH_FORMAT","dateTimeTemplate":"[%tfStart%]","dateTimeFormat":"dd.MM.yyyy","operation":"PLUS","offsetDuration":"1","durationUnit":"DAYS","fireWhenInPast":false}
  "Zwei Wochen nach Start"    → {"timePointType":"EXPRESSION_WITH_FORMAT","dateTimeTemplate":"[%tfStart%]","dateTimeFormat":"dd.MM.yyyy","operation":"PLUS","offsetDuration":"2","durationUnit":"WEEKS","fireWhenInPast":false}
  "3 Monate nach Geburtsdatum" → {"timePointType":"EXPRESSION_WITH_FORMAT","dateTimeTemplate":"[%tfGeburtsdatum%]","dateTimeFormat":"dd.MM.yyyy","operation":"PLUS","offsetDuration":"3","durationUnit":"MONTHS","fireWhenInPast":false}
  "2 Stunden nach Start"      → {"timePointType":"EXPRESSION_WITH_FORMAT","dateTimeTemplate":"[%tfStart%]","dateTimeFormat":"dd.MM.yyyy HH:mm","operation":"PLUS","offsetDuration":"2","durationUnit":"HOURS","fireWhenInPast":false}
- IMPORTANT — For date-based triggers from form field values, use FC_TIME_POINT (Mode 2). Do NOT use FC_STATE_TIMER. FC_STATE_TIMER is ONLY for time delays AFTER a record enters a specific workflow state.

### FC_FORM_RECORD_MESSAGE_POSTED
Fires when an internal message is posted to the record.
- triggerParams: {"senderContext":["INTERNAL","EXTERNAL"]} (optional filter)

### FC_FORM_RECORD_MESSAGE_UPLOAD_REQUEST_FULFILLED
Fires when a file upload request submitted via internal message is fulfilled.
- triggerParams: {}

### FC_CATCH_ERROR
Fires when an error occurs in another workflow lane.
- The 'Limit to certain error' property category has these configurable filters (all optional):
  - "Action Name" (nodeName) — filter by the name of the specific action/node instance that raised the error
  - "Action Name match type" (nodeNameMatchType) — "EXACT"|"CONTAINS"|"STARTS_WITH"|"ENDS_WITH"
  - "Action Type" (nodeType) — filter by the type of action; available values: FC_EMAIL, FC_POST_REQUEST, FC_CHANGE_STATE, FC_SQL_STATEMENT, FC_DOI_INIT, FC_COUNTER, FC_EXPORT_TO_XML, FC_SAVE_TO_WEBDAV, FC_CREATE_TEXT_FILE, FC_PROMPT_QUERY, FC_SWITCH, FC_CHANGE_FORM_AVAILABILITY, FC_FOR_EACH_LOOP, FC_WRITE_FORM_RECORD_ATTR, FC_EXPORT_TO_PERSISTENCE, FC_CHANGE_FORM_VALUE, FC_SHOW_TEMPLATE, FC_FILL_PDF, FC_COMPRESS_AS_ZIP, FC_SAVE_TO_FILE_SYSTEM, FC_LDAP_QUERY, FC_ENCODE_BASE64, FC_DECODE_BASE64, FC_RETURN_FILE, FC_MOVE_FORM_RECORD_TO_INBOX, FC_WHILE_LOOP, FC_DO_UNTIL_LOOP, FC_PROCESS_LOG_PDF, FC_SET_SAVED_FLAG, FC_SET_FORM_RECORD_PASSWORD, FC_RENEW_PROCESS_ID, FC_CHANGE_FORM_RECORD_ACTIVENESS, FC_COPY_FORM_RECORD, FC_DELETE_ATTACHMENT, FC_FILL_WORD, FC_WITH_FORM_ELEMENT_CONTEXT, FC_SEND_FORM_RECORD_MESSAGE, FC_QUEUE_TASK, FC_LOG_ENTRY, FC_EXPORT_FORM_RECORD_CHATS, FC_REDIRECT, FC_MULTIPLE_CONDITION, FC_PROVIDE_RESOURCE, FC_THROW_EXCEPTION, FC_IMPORT_FORM_VALUE_FROM_XML, FC_EXPERIMENT, FC_CHANGE_FORM_RECORD_CHAT_ACTIVENESS
  - "Action Type match type" (nodeTypeMatchType) — "EXACT"|"CONTAINS"|"STARTS_WITH"|"ENDS_WITH"
  - "Error Code" (errorCode) — filter by specific error code (e.g. EMAIL_SEND_FAILED, DATABASE_ERROR, NETWORK_FAILURE)
  - "Error Code match type" (errorCodeMatchType) — "EXACT"|"CONTAINS"|"STARTS_WITH"|"ENDS_WITH"
- triggerParams example: {"nodeName":"MeineAktion","nodeNameMatchType":"EXACT","nodeType":"FC_EMAIL","nodeTypeMatchType":"EXACT","errorCode":"EMAIL_SEND_FAILED","errorCodeMatchType":"EXACT"}

### FC_DOI_VERIFIED
CORRECT trigger for actions after DOI email confirmation (e.g. status change, welcome email).
- triggerParams: {}

### FC_INVITATION_SENT
Fires when an invitation email (DOI) is sent.
- triggerParams: {}

### FC_INVITATION_ERROR
Fires when an invitation email (DOI) delivery fails.
- triggerParams: {}

### FC_USER_INVOCATION
Fires when a logged-in user manually triggers it from the record detail view.
- triggerParams: {} (allowed states/groups configured in the FC designer)

IMPORTANT — There is NO "after state change" trigger type in FORMCYCLE. The closest equivalent is FC_STATE_TIMER with applicableStateNames set and a duration of 0 if you need it to fire immediately. However, FC_STATE_TIMER with 0 duration fires on the NEXT server tick after the state change. For DOI flows, use FC_DOI_VERIFIED as the trigger (fires when the DOI confirmation link is clicked).

## Node Types

### FC_EMAIL
Sends an email.
- nodeParams: {"to":"<recipient address, [%fieldname%] placeholder, or empty string \"\" if no recipient is known — NEVER substitute FC_EMPTY for a missing address>","subject":"<subject text>","body":"<email body in HTML format — ALWAYS use HTML markup: use <br> for line breaks (NOT \n), <p>…</p> for paragraphs, <b>…</b> for bold, <ul>/<li> for lists; use [%fieldname%] placeholders to include form field values>","from":"<sender address — REQUIRED: never empty; use the sender the user specified, or [%\$DEFAULT_MAIL_SENDER%] if none was given>","senderName":"<sender display name, optional>"}
- CRITICAL — RECIPIENT: NEVER invent a recipient address (e.g. NEVER "recipient@example.com"). "to" must be a real address the user provided/clarified, or a [%…%] placeholder of an EXISTING email field on the form (e.g. the payer's email in a payment form). An address the user gave in clarification is a LITERAL value — write it directly into "to"; do NOT create a form field for it and do NOT reference a [%…%] placeholder for it. If no recipient is known, ask via clarification BEFORE emitting the FC_EMAIL.
- CRITICAL — VALUES & ONE-TO-ONE RULE (applies to EVERY node parameter, not just email): "to"/"from"/"subject" (and any other parameter) take the clarified values LITERALLY — never create a form field to hold a clarified/literal value and never reference such a literal via [%…%] (a [%…%] placeholder is valid ONLY for a REAL form field the end user fills in at runtime). A "create a field" answer applies ONLY to the ONE value it names (e.g. "Erstelle ein E-Mail-Feld für den Kunden" → the customer's email input field); the OTHER literals in the same answer (sender, subject, an address like "X@d.de") are STILL written directly into the node. NEVER emit a field whose placeholder is a literal value you already know.
- CRITICAL — SENDER: if the user provided (or clarified) a sender address, put that EXACT literal address in "from" (e.g. "from":"office@example.de"). NEVER replace a user-provided sender with [%\$DEFAULT_MAIL_SENDER%] or [%\$CLIENT_MAIL_SENDER%] — those server-default variables are ONLY for when the user truly never named a sender. The USER CLARIFICATION section is authoritative for the sender: an address the user answered in clarification is a provided sender and MUST be used literally.
- CRITICAL — "from" (the sender address) is REQUIRED for every FC_EMAIL node. NEVER output "from":"" — if the user did not specify a sender, use [%\$DEFAULT_MAIL_SENDER%] (or ask via clarification before generating the email node). An FC_EMAIL without a sender is invalid.
- CRITICAL — "body" is REQUIRED and must NEVER be empty/null. Derive a sensible confirmation/notification text from the request (the subject, purpose, and available form fields) in the prompt's language when the user did not state a body — e.g. for a Bestätigungsmail with subject "Eingang" write a short HTML confirmation such as "<p>Ihr Formular wurde erfolgreich übermittelt.</p>" (embed [%fieldname%] placeholders where relevant). If the body genuinely cannot be derived, ask via clarification BEFORE emitting the FC_EMAIL. NEVER emit "body":"".
- Do NOT include bodyFormatType — it is always set to HTML automatically.
- CRITICAL — Do NOT include "files", "attachments", or any file-related fields in FC_EMAIL nodeParams unless the user explicitly specified files to attach. Empty arrays cause validation errors.

### FC_DOI_INIT
Sends a double opt-in invitation email with DOI confirmation link. This is the CORRECT node type for double opt-in invitations, NOT FC_EMAIL.
- CRITICAL — The email BODY MUST include the verification link as HTML: <a href="[%\$FORM_VERIFY_LINK%]">E-Mail-Adresse bestätigen</a> (or equivalent in the user's language). The placeholder [%\$FORM_VERIFY_LINK%] is automatically resolved by FORMCYCLE at runtime — use it exactly as shown.
- Use together with trigger FC_DOI_VERIFIED.
- nodeParams: {"to":"<recipient address (use the key 'to', NEVER 'recipient')>","subject":"<subject>","body":"<HTML body — REQUIRED and never empty; derive a short invitation text in the prompt's language if not stated>","from":"<sender address (use the key 'from', NEVER 'sender')>","senderName":"<sender display name, optional>","successPage":"<name of the Abschlussseite to display after the DOI invitation is sent — MUST be one of the AVAILABLE ABSCHLUSSSEITEN listed in the prompt>","failurePage":"<name of the Abschlussseite to display if the DOI verification fails — MUST be one of the AVAILABLE ABSCHLUSSSEITEN listed in the prompt>"}
- CRITICAL — successPage/failurePage MUST be the NAMES of existing ABSCHLUSSSEITEN from the AVAILABLE ABSCHLUSSSEITEN list — NEVER a UUID and NEVER a URL. If the list has no suitable page, ask via clarification BEFORE emitting the node.
- CRITICAL — DO NOT put failure-handling actions into "_childNodes"/"_handlerChildNodes" of FC_DOI_INIT (they are not created there). "Wenn das Einladungsmail fehlschlägt …" is a SEPARATE lane with trigger FC_INVITATION_ERROR (→ e.g. FC_LOG_ENTRY).
- CRITICAL — This is the CORRECT node type for double opt-in invitations, NOT FC_EMAIL. The DOI system automatically adds the confirmation link to the email.

### FC_CHANGE_FORM_RECORD_CHAT_ACTIVENESS
Opens or closes a form record chat.
- nodeParams: {"changeType":"OPEN|CLOSE" (REQUIRED — OPEN to start a chat, CLOSE to end one),"recipientType":"<INITIAL_SUBMITTER|LATEST_SUBMITTER|EMAIL|INBOX_ID — determines the chat recipient (same semantics as FC_SEND_FORM_RECORD_MESSAGE); default INITIAL_SUBMITTER>","recipientEmail":"<recipient email address — when recipientType=EMAIL>","recipientInboxId":"<inbox/postfach ID — when recipientType=INBOX_ID>","recipientMessageService":"<message service / portal name — when recipientType=INBOX_ID; set this to the EXACT name from the AVAILABLE MESSAGE SERVICES list>"}

### FC_CHANGE_STATE
Changes the form record state.
- nodeParams: {"stateName":"<FORMCYCLE status name>"}

### FC_POST_REQUEST
Sends an HTTP request (webhook, REST API call). ALL nodeParams fields are optional unless marked REQUIRED:
- REQUIRED: "url":"<target URL — must be set to the exact URL from the user's prompt>"
- "method":"POST|GET|PUT|DELETE|PATCH" (default POST)
- "body":"<request body, supports [%placeholder%] to reference form field values>"
- "contentType":"JSON|PLAIN_TEXT|XML|FORM_DATA" (default JSON)
- "headers":[{"name":"<header>","value":"<value>"},...] (optional)
- "sendAllFormValues":<true|false> (optional, default false) — send all form field values as request parameters
- "allowInvalidCertificates":<true|false> (optional, default false) — accept self-signed/invalid SSL certificates
- "asResponsePage":<true|false> (optional, default false). CRITICAL: false = HTTP runs in background, formcycle shows Abschlussseite. true = HTTP response REPLACES formcycle page. Set true ONLY when user explicitly asks to show HTTP response to the user.
- "treat4xxAsNormal":<true|false> (optional, default false) — 4xx status codes do NOT cause workflow error. Use when user says "400er sollen keine Fehler verursachen", "treat 4xx as normal", etc.
- "treat5xxAsNormal":<true|false> (optional, default false) — 5xx status codes do NOT cause workflow error
- "useBasicAuth":<true|false> (optional, default false) — enable HTTP basic authentication
- "inputCharset":"<charset>" (optional, default "UTF-8")
- "outputCharset":"<charset>" (optional, default "UTF-8")
- "outputFileName":"<filename>" (optional) — name of the output file
- "connectTimeoutSeconds":<number> (optional, default 30)
- "readTimeoutMinutes":<number> (optional, default 5)
- The httpRequestType is automatically derived from contentType: "CUSTOM" for JSON|PLAIN_TEXT|XML, "FORM_DATA" for FORM_DATA, "URL" when no body is needed (GET/DELETE/OPTIONS or POST with empty body).

### FC_CHANGE_FORM_VALUE
Sets the value of one or more form fields.
- nodeParams: {"formValues":[{"name":"<technicalId>","value":"<new value>"},...]}

### FC_LOG_ENTRY
Writes a log message to the process log.
- nodeParams: {"message":"<log text, supports [%placeholder%]>", "level":"INFO|WARNING|ERROR" (default INFO)}

### FC_REDIRECT
Redirects the user's browser to a URL. Has TWO mutually exclusive modes:
- Mode 1 — Manual URL: set "url":"<target URL>". Use this when the prompt gives an explicit URL.
- Mode 2 — URL template: set "urlTemplate":"<name of the URL template to use — MUST be one of the AVAILABLE URL TEMPLATES listed in the prompt>". Use this when the prompt says "URL-Template", "URL-Vorlage" or mentions a named template (e.g. "X2", "MeineVorlage").
- CRITICAL: When the prompt says "URL-Template X2" or similar, use Mode 2 (urlTemplate), NOT Mode 1 (url).
- QUERY STRING PARAMETERS (optional): If the prompt mentions URL parameters like "Parameter F2 mit Wert YOLO", "Parameter X mit Wert Y" etc., add a "queryParams" array: "queryParams":[{"name":"F2","value":"YOLO"},{"name":"X","value":"Y"}]. These are appended as query string parameters to the redirect URL.
- nodeParams example: {"urlTemplate":"X2","queryParams":[{"name":"F2","value":"YOLO"}]} or {"url":"https://example.com"}

### FC_RETURN
Simply ends/terminates the workflow process without changing the form record state and without any other action.
- nodeParams: {}.
- Use this when the user says the process should just be ended/terminated (e.g. "der Prozess soll beendet werden", "Prozess beenden", "workflow beenden", "Vorgang abschließen").
- When nodeType is FC_RETURN, there is NO need for a separate endpoint — the FC_RETURN node itself IS the endpoint. Set endpointType to "FC_RETURN" and endpointState to "" (empty string).

### FC_SET_SAVED_FLAG
Marks the form record as saved.
- nodeParams: {}

### FC_QUEUE_TASK
Queues an event/task for execution; this is a TERMINAL node (no endpoint state needed after it).
- nodeParams: {"eventName":"<event/trigger name from the prompt, e.g. 'GoGo'>","triggerUuid":"<UUID of the event to invoke — pick the EXACT uuid from the AVAILABLE TRIGGERS list in the prompt matching the user's requested event name>"}
- Use this when the user says an event should be executed, ausgeführt, triggered, or gestartet after submitting.

### FC_DELETE_FORM_RECORD
Permanently deletes the current form record.
- nodeParams: {}

### FC_SEND_FORM_RECORD_MESSAGE
Sends an internal message to the record's inbox.
- nodeParams: {"message":"<message text, supports [%placeholder%]>","senderName":"<sender display name — ALWAYS set a meaningful name, e.g. the current processor's name or 'System'; leave empty ONLY if truly unknown>","subject":"<subject text — ALWAYS derive a concise subject from the prompt context; leave empty ONLY if no subject can be determined>","recipientType":"<INITIAL_SUBMITTER|LATEST_SUBMITTER|EMAIL|INBOX_ID — determines the recipient: INITIAL_SUBMITTER = the person who originally submitted the form; LATEST_SUBMITTER = the most recent submitter; EMAIL = a specific email address (also set 'recipientEmail' to the address); INBOX_ID = a specific inbox/postfach (also set 'recipientInboxId' and 'recipientMessageService'); default INITIAL_SUBMITTER>","recipientEmail":"<recipient email address — REQUIRED when recipientType=EMAIL; set to the email address from the prompt>","recipientInboxId":"<inbox/postfach ID — REQUIRED when recipientType=INBOX_ID; set to the inbox/postfach name from the prompt>","recipientMessageService":"<message service / portal name — REQUIRED when recipientType=INBOX_ID; set this to the EXACT name from the AVAILABLE MESSAGE SERVICES list in the prompt that best matches what the user's prompt describes; do NOT guess or invent a service name>","email":"<alternative email address — set when the prompt mentions an alternative/further email for the recipient (different from recipientEmail)>","attachments":["<technicalId1>",...] (optional — technicalIds of XUpload fields whose files to attach)}

### FC_CREATE_TEXT_FILE
Creates a text/JSON/XML/HTML file as an attachment.
- nodeParams: {"fileName":"<filename with extension>", "fileContent":"<content, supports [%placeholder%]>", "contentType":"PLAIN_TEXT|JSON|XML|HTML" (default PLAIN_TEXT)}

### FC_WRITE_FORM_RECORD_ATTRIBUTES
Writes custom key-value attributes to the record AND optionally also updates matching form fields.
- CRITICAL — This action stores key-value SERVER ATTRIBUTES on the form record (available only on the server, read back via [%\$RECORD_ATTR.key%]). It does NOT write to any database table. Whenever the user asks to write/save data INTO a database/table/column (e.g. "in die DB 'Pointless' in die Tabelle 'Hulu' in die Spalte 'Narrative'", "write into the database ... table ... column ..."), use FC_SQL_STATEMENT instead of this action.
- CRITICAL — If the attribute names match form field technical IDs, set "writeAttributesToForm":true to also update those form fields. Do NOT create a separate FC_CHANGE_FORM_VALUE node for the same values; use writeAttributesToForm instead.
- nodeParams: {"attributes":[{"name":"<key>","value":"<value>"},...], "writeAttributesToForm":<true|false>}

### FC_SQL_STATEMENT
Runs a SQL statement (INSERT / UPDATE / DELETE / SELECT) against a configured database connection — this is the ONLY node type that writes to or reads from an EXTERNAL database table.
- USE THIS whenever the user asks to write, save, store or persist form data INTO a database / table / column — e.g. "write all rows as JSON into the database 'Pointless', table 'Hulu', column 'Narrative'", "schreibe die Daten in die DB 'Pointless' in die Tabelle 'Hulu' in die Spalte 'Narrative'". Derive the connection/datasource, table, column and SQL text from the user's words; use form field values via [%fieldName%] placeholders in the SQL.
- CRITICAL — Do NOT use FC_WRITE_FORM_RECORD_ATTRIBUTES for a database-table write (see above). Naming a database/table/column is the trigger for FC_SQL_STATEMENT.
- CRITICAL — NEVER wrap Formcycle placeholders ([%...%]) in single quotes in the SQL text. A quoted placeholder like VALUES ('[%tfTest%]') causes an error; always emit placeholders UNQUOTED, e.g. VALUES ([%tfTest%], ...). This applies wherever a [%...%] placeholder appears in the SQL (INSERT ... VALUES (...), UPDATE ... SET col = [%x%], WHERE ..., ...). Only literal string constants that are NOT placeholders may be quoted.
- CRITICAL — For a REPEATABLE container NEVER hardcode a JSON literal with field placeholders. WRONG: {"connection":"Pointless","sql":"INSERT INTO Hulu (Narrative) VALUES ('[{\"name\":\"[%tfName%]\",\"data\":\"[%tfData%]\"}]')"} — the row count is unknown at design time, so this captures only one row (or resolves the placeholders ambiguously).
- REPEATABLE-CONTAINER JSON WRITE (SELF-CONTAINED — when the values to write live in a repeatable/dynamic container, build the JSON by STRING-CONCATENATION on a server attribute and generate these nodes in this order):
  1. BEFORE the loop (OUTSIDE it, one-time setup): FC_WRITE_FORM_RECORD_ATTRIBUTES sets the server attribute (e.g. key "narrativeJson") to the OPENING bracket "[": {"attributes":[{"name":"narrativeJson","value":"["}]}.
  2. FC_FOR_EACH_LOOP — sourceType FORM_FIELD_REPETITIONS, fieldTechnicalId = a field that lives inside the repeatable container. Its child runs INSIDE the loop, once per row, and APPENDS the current row's object to the accumulated string: an FC_WRITE_FORM_RECORD_ATTRIBUTES whose value is the current [%\$RECORD_ATTR.narrativeJson%] CONCATENATED with the row's JSON object (e.g. [%\$RECORD_ATTR.narrativeJson%],{"name":"[%tfName%]","data":"[%tfData%]"} — i.e. value = current value + row object, comma-separated; every iteration appends exactly one row's object). This is the build/append block INSIDE the loop — it must CONCATENATE the new row onto the value, NOT merely echo [%\$RECORD_ATTR.narrativeJson%] back unchanged.
  3. AFTER the loop: FC_WRITE_FORM_RECORD_ATTRIBUTES appends the CLOSING bracket "]" to finish the JSON array: {"attributes":[{"name":"narrativeJson","value":"[%\$RECORD_ATTR.narrativeJson%]]"}]} (value = current value + "]").
  4. Then THIS FC_SQL_STATEMENT writes the completed JSON once: {"connection":"Pointless","sql":"INSERT INTO Hulu (Narrative) VALUES ([%\$RECORD_ATTR.narrativeJson%])"}.
  So the workflow is: FC_WRITE_FORM_RECORD_ATTRIBUTES ("[") → FC_FOR_EACH_LOOP { FC_WRITE_FORM_RECORD_ATTRIBUTES (append this row's object) } → FC_WRITE_FORM_RECORD_ATTRIBUTES ("]") → FC_SQL_STATEMENT (write once). REQUEST FC_FOR_EACH_LOOP and FC_WRITE_FORM_RECORD_ATTRIBUTES node details as well so you get their exact parameters.
- nodeParams: {"connection":"<database connection / datasource name>","sql":"<SQL text with [%fieldName%] placeholders — NEVER wrapped in quotes, e.g. INSERT INTO Hulu (Narrative) VALUES ([%fieldName%])>"} — ask for the connection only when it cannot be derived from the prompt.

### FC_RETURN_FILE
Returns a file to the user's browser for download.
- nodeParams: {"fileName":"<filename, e.g. 'xoxo.txt'>","forceDownload":<true|false> (optional, default true — forces download instead of inline display),"deleteFileAfterDownload":<true|false> (optional, default false)}
- Use this when the user says a file should be downloaded when a button is clicked. The file is typically found in the form's file management section (form resources/files tab). Set 'fileName' to the exact filename as stored in the form's file section (e.g. "xoxo.txt").

### FC_ENCODE_BASE64
Encodes a file or form upload to Base64.
- nodeParams: {"file":"<filename from form resources, e.g. 'xoxo.txt'>"}

### FC_DECODE_BASE64
Decodes a Base64-encoded file back to its original format.
- nodeParams: {"base64":"<base64 content>", "exportName":"<output filename, e.g. 'xoxo.txt'>"}

### FC_PROVIDE_RESOURCE
Provides (downloads) a file from a preceding action node's output.
- nodeParams: {"exportName":"<filename for download, e.g. 'decoded.txt'>", "sourceNode":"%prev%"}.
- CRITICAL — Use as a chained node after FC_DECODE_BASE64 to make the decoded file downloadable. The sourceNode "%prev%" placeholder resolves to the preceding node's UUID at creation time.

### FC_PROCESS_LOG_PDF
Generates a PDF from the current process log messages.
- nodeParams: {"fileName":"<output PDF filename, e.g. 'prozess-meldungen.pdf'>"}.
- Use this when the user wants the process log messages to be compiled into a PDF file. The PDF is attached to the form record. For automatic download, chain an FC_PROVIDE_RESOURCE node after this one with {"exportName":"<same filename>","sourceNode":"%prev%"}.

### FC_EXPORT_FORM_RECORD_CHATS
Exports the form record chat/conversation as a PDF file.
- nodeParams: {"fileName":"<output PDF filename, e.g. 'Konversation.pdf'>","attachToFormRecord":<true|false> (optional, default true — attach the PDF to the form record)}.
- Use this when the user says the chat/conversation should be exported or saved as PDF.

### RemotePrintService
Renders the FILLED FORM ITSELF as a PDF (a "print service" / form-to-PDF export). Use this when the user wants the submitted/current form rendered as a PDF and sent (e.g. "die Anmeldung als PDF zusenden", "das Formular als PDF verschicken", "send the form as a PDF").
- This is the CORRECT node for "form as PDF" intent — NOT FC_FILL_PDF.
- nodeParams: {}. The print service renders the current form; it needs no PDF template.
- To send the resulting PDF by email, chain an FC_EMAIL node after it (via chainedNodes) whose attachments reference the RemotePrintService output.

### FC_FILL_PDF
Fills a PDF template with form data and produces a filled PDF.
- nodeParams: {"file":"<template filename from form resources, e.g. 'vorlage.pdf'>","exportName":"<output filename, e.g. 'ausgefuellt.pdf'>","flatten":<true|false> (optional, default true)}.
- When used as a chained node, the template file is taken from the preceding node's output.
- USE ONLY when the intent is to FILL AN EXISTING PDF TEMPLATE with data collected by the form at runtime (e.g. a vorlage.pdf whose fields get mapped to form values). For rendering the form itself as a PDF, use RemotePrintService instead.
- CRITICAL — the mandatory "Details für die PDF-Befüllung > Datei" field MUST be set: provide the template file via "file" (the template's filename from the form's resources). Never omit it.

### FC_FILL_WORD
Fills a Word template with form data and produces a filled document.
- nodeParams: {"file":"<template filename from form resources, e.g. 'vorlage.docx'>","exportName":"<output filename, e.g. 'ausgefuellt.docx'>"}.
- When used as a chained node, the template is taken from the preceding node's output.

### FC_DELETE_ATTACHMENT
Deletes attachments from the specified upload fields.
- nodeParams: {"attachments":["<upload field technical ID, e.g. 'upl1'>"]}.
- The 'attachments' array must contain the technical IDs of the form upload fields whose files should be deleted.
- CRITICAL — Use this when the user says an attachment/file/upload should be removed, gelöscht, entfernt, or cleared from a specific upload field.

### FC_MOVE_FORM_RECORD_TO_INBOX
Moves the form record to a specified inbox.
- nodeParams: {"inboxName":"<inbox display name>","targetType":"STATIC_INBOX"|"COMPUTED_INBOX_NAME" (optional, default STATIC_INBOX)}.
- Use STATIC_INBOX when a known inbox exists (resolved by UUID).
- Use COMPUTED_INBOX_NAME when the inbox should be searched by name at runtime (e.g. when user says "über den Namen suchen", "find by name", or the inbox name is dynamic).
- CRITICAL — If the user explicitly provides a specific inbox name and says "suche über den Namen" (search by name), "find by name", or provides a name that is NOT in the AVAILABLE INBOXES list, then use targetType:"COMPUTED_INBOX_NAME" with inboxName set to the EXACT name the user provided. Do NOT pick a different inbox from the list. Only use STATIC_INBOX (default) when the user mentions an inbox that EXISTS in the list and does NOT instruct to search by name.

### FC_COMPRESS_AS_ZIP
Compresses one or more files into a ZIP archive.
- nodeParams: {"compressedFileName":"<output ZIP filename, e.g. 'archive.zip'>","files":["<upload field technical ID, e.g. 'upl1'>"]}.
- The 'files' array must contain the technical IDs of the form upload fields whose files should be compressed. When used as a chained node, compresses the file from the preceding node's output.

### FC_SAVE_TO_FILE_SYSTEM
Saves a file to the server's file system.
- nodeParams: {"exportDirectory":"<target directory path, e.g. '/Test/'>","files":["<upload field technical ID, e.g. 'upl1'>"]}.
- When a path is specified, allowPathInPlaceholder is automatically set to true. The 'files' array must contain the technical IDs of the form upload fields whose files should be saved. When used as a chained node, saves the preceding node's output file to the directory.

### FC_SAVE_TO_WEBDAV
Saves a file to a WebDAV server.
- nodeParams: {"path":"<target path on WebDAV>","files":["<upload field technical ID, e.g. 'upl1'>"]}.
- When a path is specified, allowPathInPlaceholder is automatically set to true. The 'files' array must contain the technical IDs of the form upload fields whose files should be saved. When used as a chained node, saves the preceding node's output to the WebDAV path.

### FC_COUNTER
Increments, decrements, or resets a counter.
- nodeParams: {"counterName":"<counter name, e.g. 'XXX'>","action":"COUNT_UP"|"COUNT_DOWN"|"COUNT_RESET" (default COUNT_UP),"step":"<step size, e.g. '1'>" (optional, default "1")}.
- Use COUNT_RESET when the user says a counter should be reset, zurückgesetzt, or "auf den Standardwert zurückgesetzt" (reset to default value).

### FC_CHANGE_FORM_AVAILABILITY
Sets the form online or offline.
- nodeParams: {"changeType":"SET_ONLINE"|"SET_OFFLINE"}.
- Use this when the user says the form should go offline or online, e.g. "Formular offline gehen", "Formular online schalten". Do NOT use this for setting the form record status — that is endpointState.

### CreateRecordNodePlugin (de.xima.fc.plugin.fc_plugin_create_record.plugin.CreateRecordNodePlugin)
Creates a new form record (Vorgang) in another form.
- nodeParams: {"projectName":"<target form name, e.g. 'CMIS Test'>","stateName":"<target state name for new record, e.g. 'Eingegangen'>","elementsToCopy":[{"name":"<target field ID>","value":"<value>"},...],"copyAll":<true|false> (optional, default false — copy fields with matching names),"files":["<upload field technical ID, e.g. 'upl1'>"] (optional — files to transfer)}.
- Use this when the user says a new form record (Vorgang) should be created in another form with specific field values and optionally file attachments.

### FC_SHOW_TEMPLATE
Renders an HTML template to the user.
- nodeParams: {"htmlTemplate":"<name of the HTML template to display — MUST be one of the AVAILABLE HTML TEMPLATES listed in the prompt>"}.
- CRITICAL — The mandatory "Template HTML" property MUST reference an HTML template (stored in the project's template library, e.g. TEMPLATE_CLIENT or FORM_TEMPLATE tables).
- Use this when the user says a specific completion page, Abschlussseite, or error page should be displayed after a button is clicked (e.g. "Bei Klick auf submit, Abschlussseite 'Allgemeiner Fehler 2' anzeigen").

### FC_THROW_EXCEPTION
Throws/causes a workflow error/exception.
- nodeParams: {"errorMessage":"<error message text describing what went wrong; use [%\$CURRENT_ERROR_MESSAGE%] or [%\$LATEST_ERROR_MESSAGE%] to reference the current/latest error message>","errorType":"<error code/type; use [%\$CURRENT_ERROR_CODE%] or [%\$LATEST_ERROR_CODE%] to reference the current/latest error code>","errorData":"<optional additional error data as JSON string>"}.
- Use this when the user says an error should be thrown, raised, geworfen, or a Fehler geworfen werden soll (e.g. "Beim Klick auf submit soll ein Fehler geworfen werden").
- The thrown error can be caught by an FC_CATCH_ERROR trigger in another lane.

### FC_EMPTY
No-op placeholder node.
- nodeParams: {}.
- WARNING: NEVER use FC_EMPTY to represent an email, state change, or any other action. If the user requests sending an email, always use FC_EMAIL even if 'to' is unknown (set 'to' to "").

### FC_BREAK
Breaks out of a loop (FC_WHILE_LOOP, FC_DO_UNTIL_LOOP, or FC_FOR_EACH_LOOP).
- nodeParams: {}.
- Place this node on the YES branch _childNodes of a FC_MULTIPLE_CONDITION inside a loop to conditionally exit the loop (e.g. "prüfe ob [B] und wenn ja, brich aus der Schleife aus").
- By default (nodeParams: {}), FC_BREAK breaks the NEAREST enclosing parent loop (the innermost FC_WHILE_LOOP or FC_DO_UNTIL_LOOP).
- To break a DIFFERENT loop (e.g. a parent FC_FOR_EACH_LOOP instead of the nearest FC_WHILE_LOOP), set nodeParams: {"breakTarget":"\$ROOT"} to break the outermost/parent loop, or {"breakTarget":"<uuid of the target loop node>"} for any specific loop.
- CRITICAL — Do NOT restructure the loop nesting order to make FC_BREAK break a different loop! Keep the loops in the order the user described. Use breakTarget to reference the specific loop to break when it is NOT the nearest parent loop.

### FC_CONTINUE
Skips the rest of the current iteration and continues with the NEXT iteration of a loop (FC_WHILE_LOOP, FC_DO_UNTIL_LOOP, or FC_FOR_EACH_LOOP). This is analogous to the 'continue' statement in programming languages.
- nodeParams: {}.
- Place this node on the YES branch _childNodes of a FC_MULTIPLE_CONDITION inside a loop to conditionally skip the remainder of the current iteration and proceed to the next one (e.g. "prüfe ob [B] und wenn ja, mit der nächsten Iteration fortfahren").
- By default (nodeParams: {}), FC_CONTINUE continues the NEAREST enclosing parent loop (the innermost FC_WHILE_LOOP or FC_DO_UNTIL_LOOP).
- To continue a DIFFERENT loop (e.g. a parent FC_FOR_EACH_LOOP instead of the nearest FC_WHILE_LOOP), set nodeParams: {"continueTarget":"\$ROOT"} to continue the outermost/parent loop, or {"continueTarget":"<uuid of the target loop node>"} for any specific loop.
- CRITICAL — Do NOT restructure the loop nesting order to make FC_CONTINUE continue a different loop! Keep the loops in the order the user described. Use continueTarget to reference the specific loop to continue when it is NOT the nearest parent loop.

### FC_SET_FORM_RECORD_PASSWORD
Sets a password on the form record for access restriction. Supports TWO modes:
- Mode 1 — Fixed (manually entered) password: nodeParams: {"targetType":"MANUALLY_ENTERED_PASSWORD","inputPassword":"<the password>"}
- Mode 2 — Generate password: nodeParams: {"targetType":"GENERATED_PASSWORD","generatedLength":10,"policyRuleLowercase":true,"policyRuleUppercase":true,"policyRuleDigit":true,"policyRuleSymbol":true,"policyRuleAlphabetical":false}
- policyRuleAlphabetical means letters a-z in any case; policyRuleLowercase means a-z lowercase; policyRuleUppercase means A-Z uppercase; policyRuleDigit means 0-9 digits; policyRuleSymbol means special characters like !@#$%.
- CRITICAL: Use this node type when the user says a specific trigger/action should password-protect the record (e.g. "beim Klick auf submit mit Passwort schützen", "beim Absenden zugangsbeschränken", "generiertes Passwort").
- When the user says "generiert", "generate", "Passwort generieren", or specifies character types (lowercase, uppercase, digits, special characters) or a password length, use Mode 2 (GENERATE) with the appropriate parameters enabled.
- Do NOT use this for permanent state-level password configuration — use stateProperties instead.

### CheckTrustLevelPlugin (de.xima.fc.plugin.bs.auth.plugin.node.CheckTrustLevelPlugin)
Checks the user's authentication trust level (e.g. ELSTER certificate, BundID level, etc.). This is a CONDITIONAL branching node — the workflow takes one path if the trust level is met (YES) and another if it is not (NO).
- nodeParams: {"trustLevel":"<the ETrustLevel enum constant name — see table below>"}.
- AVAILABLE ETrustLevel ENUM VALUES (set trustLevel to the CONSTANT NAME):
  "USER_LOGIN" — login with username/password (BundID normal)
  "LOW" — e.g. login with FINK (BundID niedrig)
  "CERTIFICATE" — e.g. login with ELSTER certificate (BundID substanziell / substantial)
  "EPA" — e.g. login with eID (BundID hoch / high)
  "UNKNOWN" — unknown / without login (default)
- MAPPING RULE: When the user mentions "ELSTER", "ELSTER-Zertifikat", or "ELSTER certificate", set trustLevel to "CERTIFICATE". When "eID" or "Ausweis" → "EPA". When "FINK" → "LOW". When "Benutzername" or "Passwort" or "BundID normal" → "USER_LOGIN".
- CRITICAL — When the user's prompt states that an action should only be executed "wenn der Nutzer sich mindestens mit einem ELSTER-Zertifikat authentifiziert hat" (if the user has authenticated with at least an ELSTER certificate) or mentions any similar authentication/trust-level requirement (e.g. "nur bei authentifizierten Nutzern", "nur mit BundID", "nur mit ELSTER"), you MUST use this nodeType as the primary action.
- The CheckTrustLevelPlugin acts as a GUARD in the workflow lane — if the trust level check passes, execution continues to subsequent nodes in the same lane (YES branch). If it fails, the lane ends (NO branch).
- CRITICAL — When the prompt contains BOTH an authentication requirement (ELSTER, trust level) AND an action (send email, etc.), set nodeType to "de.xima.fc.plugin.bs.auth.plugin.node.CheckTrustLevelPlugin". Include the child action nodes as a "_childNodes" array inside nodeParams. Each child has "nodeType" and "nodeParams". The server creates them on the YES branch.
- Example output:
  {"taskName":"ELSTER Auth Check and Send Email","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"de.xima.fc.plugin.bs.auth.plugin.node.CheckTrustLevelPlugin","nodeParams":{"trustLevel":"CERTIFICATE","_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"A@B.C.DE","subject":"XXX","body":"<p>ZZZ</p>","from":"G@g.a"}}]},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}

### AKDB E-Payment: Zahlung initialisieren (de.xima.akdb.epay.logic.plugin.node.PaymentInitPlugin)
Initializes an AKDB ePayBL payment for the current form record and redirects the user to the configured PayPage. Use this node when the user says "bezahlen", "Zahlung", "Gebühr bezahlen", "online bezahlen", "ePayment", "ePay", "PayPage", "AKDB Payment", or mentions a payment for a fee/application (e.g. "Gebühr von 30 € beim Absenden bezahlen lassen").
CRITICAL — nodeType MUST be the EXACT class name "de.xima.akdb.epay.logic.plugin.node.PaymentInitPlugin". NEVER use the display label "AKDB E-Payment" (or "ePayBL") as the nodeType — that creates an invalid node.
- nodeParams use the EXACT EPayBLActionNodeProps property names (Jackson camelCase, ePayBL 5.x); absent sub-objects are left null.
- paymentClient: {"connection":{"uuid":"...","entityClass":"de.xima.fc.entities.DatenbankZugriff"},"clientNumber":"...","bewirtschafterNumber":"...","haushaltsstelle":"...","objectNumber":"...","kennzeichenMahnverfahren":"...","duePeriod":"..."} — the ePayBL client/mandant that processes the payment. Only set what the prompt provides; do NOT invent values.
- customerData: {"salutation":"...","firstname":"...","lastname":"...","email":"...","companyName":"..."} — the payer.
- address: {"useAddress":true,"zipCode":"...","location":"...","street":"...","houseNumber":"...","country":"...","postbox":""} — the payer address.
- bankAccount: {"useBankAccount":true,"bic":"...","iban":"...","owner":"..."} — the payer bank account (only when the payment method requires it).
- orderConfig: {"orderItemDefs":[{"id":"...","itemNumber":"...","description":"...","amount":"...","documentNumber":"...","haushaltsstelle":"...","objectNumber":"...","href":"...","formElementName":"...","isRequired":true,"defaultQuantity":1,"quantity":"...","bookingText":"...","taxRate":19}]} — the chargeable items. amount = single price, quantity = count, taxRate = VAT in percent.
- dueDate: "DD.MM.YYYY" (payment deadline), payPageBookingText: booking text shown on the PayPage, baseUrl: PayPage base URL, preventPayPageRedirect: true only when the automatic redirect must be suppressed.
- The node writes these custom attributes onto the form record: totalAmount, kassenzeichen, paymentProcessId, txNumber, urlToPaypage and per-item order* values. On failure the plugin aborts the workflow and returns an error.
- PAYMENT NOTIFICATION MATRIX — notifications are per RECIPIENT (client vs admin/internal) × OUTCOME (success vs failure) × TRANSPORT (email / CMIS / DB / log / inbox). The CLIENT normally receives the payment RECEIPT on SUCCESS (FC_EMAIL chained after the payment in "_childNodes"). Every other cell the user confirmed gets its OWN node: success notifications in "_childNodes" (client receipt, admin success copy), failure handling in "_handlerChildNodes" (client failure message, admin failure alert, and/or a DB/record/log recording) — each with its own literal/clarified address, subject, content and possibly different transport. Build ONLY the cells the user confirmed; when they chose NO failure notification, emit the payment + confirmed success nodes WITHOUT a failure handler. Never two separate lanes for success/failure, never invent a recipient/transport, never create form fields for the addresses. ONE-TO-ONE RULE: a "create a field" answer (e.g. "Erstelle ein E-Mail-Feld für den Kunden", "lege ein Feld für die Adresse an") applies ONLY to the one value it names — create that field and reference it as [%fieldName%]; the OTHER literal addresses/subjects in the same answer are STILL written LITERALLY into their nodes, NOT turned into fields.
- CRITICAL — Use this node only when the AKDB E-Payment plugin (plugin-bundle-epaybl) is installed. If the prompt names a fee/amount without a payment method, ask the user to confirm the AKDB online payment instead of inventing paymentClient data.
- Example output:
  {"taskName":"Bezahlen via AKDB ePayBL","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"de.xima.akdb.epay.logic.plugin.node.PaymentInitPlugin","nodeParams":{"paymentClient":{"clientNumber":"MANDANT1","bewirtschafterNumber":"1000","haushaltsstelle":"1000"},"customerData":{"firstname":"Max","lastname":"Mustermann","email":"[%tfAntragstellerEmail%]"},"address":{"useAddress":true,"zipCode":"91522","location":"Ansbach","street":"Musterstr.","houseNumber":"1","country":"DE"},"orderConfig":{"orderItemDefs":[{"description":"Gebühr für Anwohnerparkausweis","amount":"30","quantity":"1","taxRate":19}]},"dueDate":"31.12.2026"},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}

### AKDB BayernID Postkorb senden (de.xima.akdb.postbox.plugin.node.PostboxPlugin)
Sends a message (with optional attachments) to the authenticated citizen's BayernID Postbox. Use this node when the user says "Postkorb", "Postfach", "BayernID Postkorb", "Bürgerpostfach", "Nachricht an den Postkorb", or explicitly wants delivery into the BayernID Postbox.
- nodeParams use the EXACT PostboxProps property names (Jackson camelCase); absent sub-objects are left null.
- message: {"subject":"...","body":"..."} — the message subject and body.
- akdbClient: {"service":"...","client":"..."} — the AKDB Postbox service/client, only when a specific one is required.
- id: the recipient Postbox id — usually a [%…%] placeholder of the authenticated user's data (e.g. "[%tfAntragstellerEmail%]") or a literal; idFromFormRecordAttr: true when the id is read from a form-record attribute.
- link: an optional URL embedded in the message, suffixBkData: a suffix appended to the Bürgerkonto data set, trustLevelAccess: true to require the citizen's trust level.
- attachments: optional array of file resources attached to the Postbox message.
- Error codes: CREATE_MESSAGE_ERROR, DETERMINE_POSTBOX_ID_ERROR, SENDING_MESSAGE_ERROR, INTERNAL_ERROR.
- CRITICAL — Use this node ONLY when the AKDB BayernID (Bürgerkonto/Postbox) plugin is installed AND the user explicitly wants delivery via the BayernID Postbox. For normal e-mail use FC_EMAIL, never this node.
- Example output:
  {"taskName":"Bescheid an BayernID Postkorb","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"de.xima.akdb.postbox.plugin.node.PostboxPlugin","nodeParams":{"message":{"subject":"Ihr Bescheid","body":"<p>Sehr geehrte/r Nutzer/in, ...</p>"},"id":"[%tfAntragstellerEmail%]","suffixBkData":"bescheid"},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}

### CMIS: Objekt anlegen/hochladen (de.xima.fc.fc_plugin_cmis.plugin.CmisActionPlugin)
Creates or updates an object (document/folder) in a CMIS repository (e.g. Alfresco). Use this node when the user says "CMIS", "Alfresco", "DMS", "im Dokumentenmanagement", "im CMIS ablegen", or asks to store a file/document in a CMIS repository.
- nodeParams use the EXACT CmisNodeProps property names (Jackson camelCase); absent sub-objects are left null.
- connection: the CMIS connection object (configured in the plugin); multiFile: the files to upload.
- objectName: the name of the created object; objectType: e.g. "Document" (enum ECmisObjectType); objectTypeId: the CMIS object type id; folderPath: target folder path; properties: [{"name":"...","value":"..."}] — CMIS object properties; dateTimeFormat: date format for property values.
- Flags (default false): useExistingFolder, createUnfilingObject, addVersionNumber, activateVersioning, updateProperties, findObjectsById, useNoFileExtension.
- CRITICAL — Use this node only when the CMIS plugin (fc-plugin-cmis) is installed. To store the accumulated rows of a REPEATABLE container as JSON in a CMIS node, chain this node AFTER the FC_FOR_EACH_LOOP and store [%\$RECORD_ATTR.<key>%] as the object content/property (see the COLLECT-ROWS-TO-JSON pattern).
- Example output:
  {"taskName":"Upload nach CMIS","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"de.xima.fc.fc_plugin_cmis.plugin.CmisActionPlugin","nodeParams":{"multiFile":{"resources":[{"type":"FORM_UPLOAD"}]},"objectName":"[%tfBetreff%]","objectType":"Document","folderPath":"/Antraege","activateVersioning":true},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}

### CMIS: Query ausführen (de.xima.fc.fc_plugin_cmis.plugin.CmisQueryActionPlugin)
Runs a CMISQL query against a CMIS repository. Use this node when the user wants to read/search documents in a CMIS/DMS repository.
- nodeParams: {"connection":{...},"query":"<CMISQL, e.g. SELECT * FROM cmis:document WHERE cmis:name LIKE '%x%'>","maxHits":100,"includeAllVersions":false}.
- maxHits: maximum number of results returned; includeAllVersions: true to also return older versions.
- CRITICAL — Use this node only when the CMIS plugin (fc-plugin-cmis) is installed.
- Example output:
  {"taskName":"CMIS-Suche","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"de.xima.fc.fc_plugin_cmis.plugin.CmisQueryActionPlugin","nodeParams":{"query":"SELECT cmis:objectId, cmis:name FROM cmis:document WHERE cmis:name LIKE '[%tfSuche%]'","maxHits":50},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}

### RegiSafe: Dokument hochladen (de.xima.regisafe.plugin.node.UploadDocumentPlugin)
Uploads files as a document into the RegiSafe DMS. Use this node when the user says "RegiSafe", "in RegiSafe archivieren", "Dokument in RegiSafe ablegen".
- nodeParams use the EXACT UploadDocumentProps property names (Jackson camelCase); absent sub-objects are left null.
- files: the files to upload; documentId: the target RegiSafe document id (optional).
- serviceConfig: {"serviceUrl":"...","loginId":"...","pwd":"...","apiId":"..."} — only set what the prompt provides; NEVER invent credentials.
- metadata: [{"name":"...","value":"...","formElementName":"...","dynamic":false}] — RegiSafe metadata fields.
- CRITICAL — Use this node only when the RegiSafe plugin (plugin-bundle-regisafe) is installed. Do NOT invent service credentials — ask the user or use the configured default.
- Example output:
  {"taskName":"Nach RegiSafe archivieren","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"de.xima.regisafe.plugin.node.UploadDocumentPlugin","nodeParams":{"files":{"resources":[{"type":"FORM_UPLOAD"}]},"metadata":[{"name":"Aktenzeichen","value":"[%tfAktenzeichen%]"}]},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}

### FC_MULTIPLE_CONDITION
Checks whether a form field value meets a specified condition. This is a CONDITIONAL branching node — if the condition is met (YES branch), execution continues to the child nodes; if not (NO branch), the lane ends without executing the children.
- Use this when the user says an action should only be executed "wenn" (if) a field has a specific value, "nur wenn" (only if), "falls" (in case), or similar ONE-TIME conditional language involving a form field value.
- CRITICAL — Do NOT use FC_MULTIPLE_CONDITION as the OUTER/primary node for "solange" (while, as long as) which implies a LOOP (repeated execution). The "solange" condition defines the loop's repetition condition. Use FC_WHILE_LOOP for "solange" scenarios with pre-check, or FC_DO_UNTIL_LOOP for post-check. However, FC_MULTIPLE_CONDITION CAN be used INSIDE a loop's _childNodes array to check break conditions (e.g. "prüfe ob ... und wenn ja, brich aus"), with FC_CHANGE_FORM_VALUE on its YES branch to modify the loop field value and cause the loop to exit.
- nodeParams: {"fieldTechnicalId":"<the technicalId of the form field to check>","comparator":"EQUAL" (supported: EMPTY, NOT_EMPTY, EQUAL, NOT_EQUAL, CONTAINS, NOT_CONTAINS, GREATER, GREATER_THAN_OR_EQUAL, LESSER, LESS_THAN_OR_EQUAL, STARTS_WITH, NOT_STARTS_WITH, ENDS_WITH, NOT_ENDS_WITH, REGEX_MATCH, NOT_REGEX_MATCH),"compareValue":"<the value to compare against, e.g. 'A'>","labelYes":"<optional custom label for the YES branch, defaults to 'Yes'>","labelNo":"<optional custom label for the NO branch, defaults to 'No'>"}.
- The server automatically wraps fieldTechnicalId in [%...%] notation (e.g. 'tf1' becomes '[%tf1%]').
- CRITICAL — When the user's prompt states that an action should only be executed conditionally based on a form field value (e.g. "nur ausgeführt werden wenn in Option 'A' steht", "nur wenn das Feld X den Wert Y hat", "falls das Feld ausgefüllt ist"), you MUST use this nodeType as the primary action. The FC_MULTIPLE_CONDITION acts as a GUARD in the workflow lane — if the condition is met, execution continues to subsequent nodes in the same lane (YES branch). If not, the lane ends (NO branch).
- CRITICAL — When the prompt contains BOTH a field-value condition AND an action (send email, change status, etc.), set nodeType to "FC_MULTIPLE_CONDITION". Include the child action nodes as a "_childNodes" array inside nodeParams. Each child has "nodeType" and "nodeParams". The server creates them on the YES branch.
- MULTIPLE CONDITIONS — For multiple conditions (e.g. "if field X equals A AND field Y equals B"), use a "conditions" array instead of the single top-level fields. Each entry has the same "fieldTechnicalId", "comparator", and "compareValue" fields.
- CRITICAL — When the user describes conditions with MIXED boolean operators (e.g. "A ODER X UND Y" meaning A OR (X AND Y), or "X UND Y ODER A UND B" meaning (X AND Y) OR (A AND B)), you MUST use combinationType "CUSTOM" with an appropriate customExpression like "C1 OR (C2 AND C3)". Do NOT use simple "AND" or "OR" for mixed logic — only use "AND" (all conditions must match) or "OR" (any condition must match) when ALL conditions use the SAME operator. For complex expressions like "(C1 OR C2) AND C3", set "combinationType" to "CUSTOM" and provide the expression as "customExpression". Each condition is indexed as C1, C2, C3,... in the order they appear in the array.
- Example with multiple conditions:
  {"taskName":"Complex Condition","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"FC_MULTIPLE_CONDITION","nodeParams":{"combinationType":"AND","conditions":[{"fieldTechnicalId":"tfOption","comparator":"EQUAL","compareValue":"A"},{"fieldTechnicalId":"tfAge","comparator":"GREATER","compareValue":"18"}],"_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{...}}]},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}
- Example with custom expression:
  {"taskName":"Custom Expression",...,"nodeParams":{"combinationType":"CUSTOM","conditions":[{"fieldTechnicalId":"tfOpt1","comparator":"EQUAL","compareValue":"A"},{"fieldTechnicalId":"tfOpt2","comparator":"EQUAL","compareValue":"B"},{"fieldTechnicalId":"tfOpt3","comparator":"EQUAL","compareValue":"C"}],"customExpression":"(C1 OR C2) AND C3","_childNodes":[...]}}
- Example output for single condition (with sensible branch labels):
  {"taskName":"Send Mail Only if Option is A","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"FC_MULTIPLE_CONDITION","nodeParams":{"fieldTechnicalId":"tfOption","comparator":"EQUAL","compareValue":"A","labelYes":"Option equals A","labelNo":"Option is not A","_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"A@B.C.DE","subject":"XXX","body":"<p>ZZZ</p>","from":"G@g.a"}}]},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}
- CRITICAL — The fieldTechnicalId MUST be the EXACT technicalId from the FORM ELEMENTS list, not the display text. NEVER use the display text as the fieldTechnicalId.

### FC_SWITCH
Switches execution based on the value of a form field, similar to a switch/case statement. This is a MULTI-BRANCH conditional node — the workflow takes different paths depending on the field's value.
- Use this when the user describes a switch-case pattern like "if field X has value A do Y, if value B do Z", "steht in Feld X ein A dann..., bei B dann...", "je nach Wert von X".
- nodeParams: {"switchValue":"[%technicalId%]" — the field whose value to switch on, wrapped in [%...%] notation}.
- Use a "_cases" array for the case branches. Each case entry has: "caseValues":["value1","value2",...] (the values to match for this case), "combinationType":"OR" (optional, how to combine multiple values: AND|OR|CUSTOM), "customExpression":"(C1 OR C2) AND C3" (optional, for CUSTOM combination), "description":"<optional case description>", and "_childNodes":[...] (the action nodes to execute for this case). Use "_defaultChildNodes" for the default branch (executed when no case matches).
- CRITICAL — CHOOSING BETWEEN FC_SWITCH AND FC_MULTIPLE_CONDITION: If MULTIPLE VALUES from the SAME field lead to the SAME ACTION (e.g. "A oder X und Y" all result in "from A@B.C", same email), then it is NOT a switch-case pattern — it is a single CONDITIONAL branch with complex boolean logic. In this case, you MUST use FC_MULTIPLE_CONDITION with combinationType "CUSTOM" and customExpression like "C1 OR (C2 AND C3)", NOT FC_SWITCH. FC_SWITCH is ONLY for when DIFFERENT VALUES lead to DIFFERENT ACTIONS (e.g. "bei A mache X, bei B mache Y" where each value has its own action).
- RULE OF THUMB: If all branching values go to the SAME _childNodes, use FC_MULTIPLE_CONDITION. If different values go to DIFFERENT _childNodes, use FC_SWITCH.
- Example output:
  {"taskName":"Send email with different senders","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"FC_SWITCH","nodeParams":{"switchValue":"[%tfKlausel%]","_cases":[{"caseValues":["A"],"_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"A@B.C.DE","subject":"XXX","body":"<p>ZZZ</p>","from":"A@B.C"}}]},{"caseValues":["B"],"_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"A@B.C.DE","subject":"XXX","body":"<p>ZZZ</p>","from":"H@H.H"}}]}],"_defaultChildNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"A@B.C.DE","subject":"XXX","body":"<p>ZZZ</p>","from":""}}]},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}
- CRITICAL — Do NOT confuse FC_SWITCH with FC_MULTIPLE_CONDITION. FC_MULTIPLE_CONDITION is for a single YES/NO condition check ("nur ausgeführt werden wenn"). FC_SWITCH is for multiple exclusive branches based on different values of the same field ("bei A mache X, bei B mache Y").

### FC_EXPERIMENT
Wraps an action with error handling (try-catch-finally pattern).
- Use this when the user says "wenn ein Fehler auftritt" (if an error occurs), "bei Fehler" (on error), "falls etwas schiefgeht" (if something goes wrong), or any similar error-handling language.
- This node has THREE child sections:
    1. "_childNodes" — the MAIN action to execute (the try block); REQUIRED.
    2. "_handlerChildNodes" — executes when the main action throws an exception (the catch block); OPTIONAL.
    3. "_finalizerChildNodes" — ALWAYS executes after the main action, regardless of success or failure (the finally block); OPTIONAL.
- nodeParams: {} (no custom parameters needed — FcExperimentProps is an empty marker).
- CRITICAL — Do NOT generate TWO separate workflow lanes for the normal case and the error case. Instead, generate a SINGLE lane with FC_EXPERIMENT as the top-level node. Put the normal action in "_childNodes" and the error action in "_handlerChildNodes".
- Example output (with error handler):
  User: "Beim Klick auf submit soll eine Mail von A@B.C an X@X.X mit dem Betreff Hallo und dem Inhalt Holla geschickt werden. Wenn dabei ein Fehler auftritt soll eine Mail an O@O.O von J@J.J mit dem Betreff Fehler und dem Inhalt Fehler geschickt werden."
  {"taskName":"Send email with error handling","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"FC_EXPERIMENT","nodeParams":{"_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"X@X.X","subject":"Hallo","body":"<p>Holla</p>","from":"A@B.C"}}],"_handlerChildNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"O@O.O","subject":"Fehler","body":"<p>Fehler</p>","from":"J@J.J"}}]},"endpointState":"Empfangen","endpointType":"FC_CHANGE_STATE"}

### FC_FOR_EACH_LOOP
Iterates over items (repeatable form fields, field values, files, attachments, CSV, JSON) and executes child nodes for each item.
- Use this when the user says "für jede/n", "for each", "jeweils", "per", or needs to send separate emails/actions for each row of a repeatable container or each value of a field.
- The source of items is determined by the item source type in sourceProps:
  FORM_FIELD_REPETITIONS — iterate over each row of a repeatable container field (XContainer with dynamic="1"). The form field must be inside a repeatable container so it has multiple rows of values. nodeParams: {"fieldTechnicalId":"<technicalId of the field inside the repeatable container>","_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{...}}]}
  FIELD_VALUES — iterate over individual values of a multi-value field;
  FILES — iterate over uploaded files;
  ATTACHMENTS — iterate over attached files;
  JSON_VALUE — iterate over items parsed from a JSON array string;
  CHARACTER_SEPARATED_VALUES — iterate over values separated by a delimiter character (e.g. hyphens, commas, semicolons). Set "sourceType":"CHARACTER_SEPARATED_VALUES", "fieldTechnicalId":"<fieldId>", "delimiter":"<delimiter char>" to iterate over values from a form field separated by a specific delimiter. Example: {"fieldTechnicalId":"tf1","sourceType":"CHARACTER_SEPARATED_VALUES","delimiter":"-","_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{...}}]}
- CRITICAL — When the user says "für jede Klausel" (for each clause), "für jeden Eintrag" (for each entry), "pro Zeile" (per row), or uses "für jede/n" (for each) with a field label, the field is inside a repeatable container. Use FC_FOR_EACH_LOOP with source type FORM_FIELD_REPETITIONS. Set "fieldTechnicalId" to the field's technicalId and wrap the action nodes in "_childNodes".
- CRITICAL — When the user says "durch ein X getrennt" (separated by X), "voneinander getrennt durch" (separated by), "getrennt durch Komma/Strich/Punkt" (separated by comma/hyphen/dot), the field contains delimiter-separated values. Use CHARACTER_SEPARATED_VALUES as sourceType. Set "fieldTechnicalId" to the field's technicalId, "delimiter" to the delimiter character, and "sourceType":"CHARACTER_SEPARATED_VALUES".
- CRITICAL — The child action nodes must be placed in a "_childNodes" array inside nodeParams, similar to FC_MULTIPLE_CONDITION. Each child has "nodeType" and "nodeParams".
- LOOP DATA PLACEHOLDER (Formcycle "Loops" article): every named loop exposes its current iteration's data via [%\$<loop_name>.CURRENT%] inside the loop — name the loop (a taskName label) so children can reference the current item; after the loop the loop's own RESULT (accessible like other action results) holds the number of times the loop ran.
- Example output for repeatable field:
  {"taskName":"Send email per Klausel","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{"buttonName":"btnSubmit"},"nodeType":"FC_FOR_EACH_LOOP","nodeParams":{"fieldTechnicalId":"tfKlausel","_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"A@B.C.DE","subject":"XXX","body":"<p>ZZZ</p>","from":"X@X.XX"}}]},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}
- Example output for character-separated values:
  {"taskName":"Send email per hyphen-separated Klausel text","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{"buttonName":"btnSubmit"},"nodeType":"FC_FOR_EACH_LOOP","nodeParams":{"fieldTechnicalId":"tf1","sourceType":"CHARACTER_SEPARATED_VALUES","delimiter":"-","_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"A@B.C.DE","subject":"XXX","body":"<p>ZZZ</p>","from":"X@X.XX"}}]},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}
- COLLECT-ROWS-TO-JSON PATTERN (persist a REPEATABLE container as ONE document, in ANY language):
  When the user wants to write the data of a repeatable/dynamic container — an UNKNOWN number of rows — into a SINGLE target (a database table column, a CMIS node/document, a file, a form field, a server attribute, ...) as ONE combined value (e.g. a JSON array), the loop has no variable to append to, so the JSON is BUILT IN A SERVER ATTRIBUTE that is written over and over. This accumulation is identical for EVERY target — only the final write node differs. Use this pattern:
  1. BEFORE the loop (OUTSIDE it, one-time setup): FC_WRITE_FORM_RECORD_ATTRIBUTES sets the server attribute (e.g. key "narrativeJson") to the OPENING bracket "[". This is the ONLY server-attribute write placed outside the loop.
  2. Iterate the repeatable container with FC_FOR_EACH_LOOP, sourceType FORM_FIELD_REPETITIONS, fieldTechnicalId = a field that lives inside the container; the child nodes run once per row.
  3. INSIDE each iteration (INSIDE the loop — the per-row append write lives here, running on every row): FC_WRITE_FORM_RECORD_ATTRIBUTES sets the attribute to the CURRENT value CONCATENATED with the row's JSON object — e.g. value = [%\$RECORD_ATTR.narrativeJson%],{"Name":"[%tfName%]","Data":"[%tfData%]"} (current value + row object, comma-separated; keys = field labels/names, values = the row's [%fieldName%] placeholders). Every iteration appends exactly one row's object onto the string. PLACE THIS APPEND NODE IN THE LOOP'S nodeParams._childNodes ARRAY (it must run once per row) — NEVER as a "chainedNodes" entry and NEVER as a node listed AFTER the loop (a node after the loop runs exactly once, so the JSON would never grow).
     WRONG in-loop value: merely writing [%\$RECORD_ATTR.narrativeJson%] back unchanged — that never grows the JSON.
     CORRECT: the written value is the previous string PLUS this row's object, so after two rows the attribute (before closing) holds [,{"Name":"A","Data":"1"},{"Name":"B","Data":"2"} — every write appends exactly one row.
     This read-concatenate-write on every pass is exactly how the JSON is built inside the loop.
  4. AFTER the loop: FC_WRITE_FORM_RECORD_ATTRIBUTES appends the CLOSING bracket "]" — value = [%\$RECORD_ATTR.narrativeJson%]] — to finish the JSON array. The server attribute now holds the complete JSON array (all rows).
  5. AFTER the loop, choose ONE final write matching the target the prompt names:
     - a database/table/column → ONE FC_SQL_STATEMENT: INSERT INTO <table> (<column>) VALUES ([%\$RECORD_ATTR.narrativeJson%]).
     - a CMIS node/document → ONE CMIS-write node storing [%\$RECORD_ATTR.narrativeJson%] as the node's content/property.
     - a text/JSON/XML file → ONE FC_CREATE_TEXT_FILE with fileContent = [%\$RECORD_ATTR.narrativeJson%].
     - a SPECIFIC form field → ONE FC_CHANGE_FORM_VALUE that sets that field to [%\$RECORD_ATTR.narrativeJson%].
     - no specific target stated (the prompt only says to store/write the JSON) → the server attribute itself is the result; it is already populated by the accumulation (FC_WRITE_FORM_RECORD_ATTRIBUTES), so no separate final node is needed.
  CRITICAL — FC_WRITE_FORM_RECORD_ATTRIBUTES is used HERE as the per-record ACCUMULATOR (a server attribute, [%\$RECORD_ATTR.key%]) DURING the loop; the accumulation steps are IDENTICAL for every target. Only the single FINAL write node depends on the target the prompt names (database → FC_SQL_STATEMENT, CMIS → the CMIS node, file → FC_CREATE_TEXT_FILE, form field → FC_CHANGE_FORM_VALUE, else the server attribute). Do NOT write the final value inside the loop; accumulate first (via the server attribute) and write ONCE after the loop.
  Example — "on submit, write all rows of the repeatable 'Name' + 'Data' fields as a JSON array into the database 'Pointless', table 'Hulu', column 'Narrative'": FC_WRITE_FORM_RECORD_ATTRIBUTES setting narrativeJson = "[]"; then FC_FOR_EACH_LOOP (FORM_FIELD_REPETITIONS over a field inside the repeatable container) whose child reads [%\$RECORD_ATTR.narrativeJson%], appends {"Name":"[%tfName%]","Data":"[%tfData%]"} and writes it back to narrativeJson; after the loop ONE FC_SQL_STATEMENT writes [%\$RECORD_ATTR.narrativeJson%] into Hulu.Narrative.
  Example — "store the accumulated rows as JSON in the form field 'Narrative' (no database)": initialize narrativeJson = "[]", loop appending each row to narrativeJson, then ONE FC_CHANGE_FORM_VALUE that sets the field 'Narrative' to [%\$RECORD_ATTR.narrativeJson%].
  Example — "store the accumulated rows as JSON in the CMIS node 'dossier'": initialize narrativeJson = "[]", loop appending each row to narrativeJson, then ONE CMIS-write node storing [%\$RECORD_ATTR.narrativeJson%] as the node's content/property.
  FULL WORKFLOW JSON — the per-row append sits INSIDE the loop's "_childNodes"; only the seed "[" (main node), the close "]" and the single final write are chained AFTER the loop. Prompt: "on submit, write all rows of the repeatable 'Name' + 'Data' fields as a JSON array into the database 'Pointless', table 'Hulu', column 'Narrative'":
  {"taskName":"Write repeatable rows as JSON into Hulu Narrative","taskDescription":"","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"FC_WRITE_FORM_RECORD_ATTRIBUTES","nodeParams":{"attributes":[{"name":"narrativeJson","value":"["}]},"chainedNodes":[{"nodeType":"FC_FOR_EACH_LOOP","nodeParams":{"fieldTechnicalId":"tfData","sourceType":"FORM_FIELD_REPETITIONS","_childNodes":[{"nodeType":"FC_WRITE_FORM_RECORD_ATTRIBUTES","nodeParams":{"attributes":[{"name":"narrativeJson","value":"[%\$RECORD_ATTR.narrativeJson%],{\"Name\":\"[%tfName%]\",\"Data\":\"[%tfData%]\"}"}]}}]}},{"nodeType":"FC_WRITE_FORM_RECORD_ATTRIBUTES","nodeParams":{"attributes":[{"name":"narrativeJson","value":"[%\$RECORD_ATTR.narrativeJson%]]"}]}},{"nodeType":"FC_SQL_STATEMENT","nodeParams":{"connection":"Pointless","sql":"INSERT INTO Hulu (Narrative) VALUES ([%\$RECORD_ATTR.narrativeJson%])"}}],"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}

### FC_WHILE_LOOP
Repeatedly executes child actions WHILE a form field value meets a specified condition. This is a PRE-CHECK LOOP node — the condition is checked BEFORE each iteration. If the condition is false from the start, the children are NEVER executed (zero iterations).
- Use this when the user says an action should be repeated "solange" (while, as long as) a field has a specific value, "wiederholt solange", or similar loop language where the condition is checked BEFORE the action.
- CRITICAL — Do NOT map "solange" (while/as long as) to FC_MULTIPLE_CONDITION. "solange" implies a LOOP (keep doing while condition is true), not a one-time conditional check.
- nodeParams: {"fieldTechnicalId":"<the technicalId of the form field to check>","comparator":"EQUAL" (same supported values as FC_MULTIPLE_CONDITION: EMPTY, NOT_EMPTY, EQUAL, NOT_EQUAL, CONTAINS, NOT_CONTAINS, GREATER, GREATER_THAN_OR_EQUAL, LESSER, LESS_THAN_OR_EQUAL, STARTS_WITH, NOT_STARTS_WITH, ENDS_WITH, NOT_ENDS_WITH, REGEX_MATCH, NOT_REGEX_MATCH),"compareValue":"<the value to compare against, e.g. '1'>"}.
- Use a "_childNodes" array for the child action nodes (same pattern as FC_MULTIPLE_CONDITION). Each child has "nodeType" and "nodeParams". The children are executed on each iteration while the condition holds true. You can have MULTIPLE children in the _childNodes array — they are executed in order on each iteration.
- BREAK PATTERN — When the user says "solange [A] ... dann prüfe ob [B] und wenn ja, brich aus" (while [A] ... then check if [B] and if so, break out of the loop), the "solange" condition [A] becomes the LOOP's condition. Inside the loop's _childNodes, add a FC_MULTIPLE_CONDITION that checks the break condition [B]. On its YES branch _childNodes, place a FC_BREAK node (nodeParams: {}) which causes the workflow executor to exit the nearest enclosing loop immediately. FC_BREAK automatically targets the nearest parent loop — no configuration needed.
- Example output (simple — one child):
  {"taskName":"Send mail while Klausel equals 1","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"FC_WHILE_LOOP","nodeParams":{"fieldTechnicalId":"tfKlausel","comparator":"EQUAL","compareValue":"1","_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"A@B.C.DE","subject":"XXX","body":"<p>ZZZ</p>","from":"X@X.XX"}}]},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}
- Example output (with break pattern — multiple children):
  User: "Beim Klick soll solange in Klausel eine 1 steht eine Mail mit dem Betreff XXX und dem Inhalt ZZZ an A@B.C.DE von X@X.XX geschickt werden. Nach dem senden der Mail soll in der Schleife geprüft werden ob Klausel ein X enthält und wenn das so ist aus der Schleife ausgebrochen werden."
  {"taskName":"Send mail while Klausel equals 1 with break when Klausel contains X","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"FC_WHILE_LOOP","nodeParams":{"fieldTechnicalId":"tf1","comparator":"EQUAL","compareValue":"1","_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"A@B.C.DE","subject":"XXX","body":"<p>ZZZ</p>","from":"X@X.XX"}},{"nodeType":"FC_MULTIPLE_CONDITION","nodeParams":{"fieldTechnicalId":"tf1","comparator":"CONTAINS","compareValue":"X","labelYes":"Klausel contains X break","labelNo":"Klausel does not contain X continue","_childNodes":[{"nodeType":"FC_BREAK","nodeParams":{}}]}}]},"endpointState":"Empfangen","endpointType":"FC_CHANGE_STATE"}
- CONTINUE PATTERN — When the user says "solange [A] ... dann prüfe ob [B] und wenn ja, mit der nächsten Iteration fortfahren" (while [A] ... then check if [B] and if so, continue with the next iteration of the OUTER loop), the outer loop becomes a FC_FOR_EACH_LOOP or FC_WHILE_LOOP, and the inner "solange" condition [A] becomes an inner FC_WHILE_LOOP or FC_DO_UNTIL_LOOP. Inside the inner loop's _childNodes, add a FC_MULTIPLE_CONDITION that checks the continue condition [B]. On its YES branch _childNodes, place a FC_CONTINUE node with continueTarget set to the OUTER loop (e.g. {"continueTarget":"\$ROOT"}) which causes the workflow executor to skip the rest of the current iteration and proceed to the next one of the specified loop. This is DIFFERENT from FC_BREAK — FC_CONTINUE does NOT exit the loop, it only skips the remaining actions in the current iteration and moves to the next one.
- Example output (with continue pattern — nested loops):
  User: "Beim Klick auf submit soll für jedes Zeichen in Go, solange in Klausel eine 1 steht eine Mail mit dem Betreff XXX und dem Inhalt ZZZ an A@B.C.DE von X@X.XX geschickt werden. Nach dem senden der Mail soll in der Schleife geprüft werden ob Klausel ein X enthält und wenn das so ist die Schleife für Go mit der nächsten iteration fortfahren. Die schleife die jedes Zeichen abarbeitet soll die äußerste Schleife sein."
  {"taskName":"For each char in Go send mail while Klausel=1, continue on X","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"FC_FOR_EACH_LOOP","nodeParams":{"fieldTechnicalId":"tfGo","sourceType":"CHARACTER_SEPARATED_VALUES","delimiter":"","_childNodes":[{"nodeType":"FC_WHILE_LOOP","nodeParams":{"fieldTechnicalId":"tfKlausel","comparator":"EQUAL","compareValue":"1","_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"A@B.C.DE","subject":"XXX","body":"<p>ZZZ</p>","from":"X@X.XX"}},{"nodeType":"FC_MULTIPLE_CONDITION","nodeParams":{"fieldTechnicalId":"tfKlausel","comparator":"CONTAINS","compareValue":"X","labelYes":"Klausel contains X - continue outer loop","labelNo":"Klausel does not contain X","_childNodes":[{"nodeType":"FC_CONTINUE","nodeParams":{"continueTarget":"\$ROOT"}}]}}]}}]},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}
- CRITICAL — CHOOSING BETWEEN FC_WHILE_LOOP AND FC_DO_UNTIL_LOOP:
  FC_WHILE_LOOP checks the condition BEFORE executing the children (pre-check). If the condition is initially false, children run 0 times. Use for "solange" (while).
  FC_DO_UNTIL_LOOP executes the children FIRST, then checks the condition (post-check). Children ALWAYS run at least once. Use for "zuerst ... dann Bedingung prüfen" (first do, then check condition).

### FC_DO_UNTIL_LOOP
Executes child actions FIRST, then checks whether a form field value continues to meet a specified condition. This is a POST-CHECK LOOP node — the condition is checked AFTER each iteration. The children ALWAYS execute at least once, regardless of the initial condition value.
- Use this when the user says an action should be performed FIRST before checking the condition, "zuerst ... dann die Bedingung prüfen" (first ..., then check the condition), "erst ausführen dann prüfen" (first execute then check), "zuerst die Mail senden dann die Bedingung prüfen" (first send the email then check the condition), or any similar post-check loop language.
- CRITICAL — FC_DO_UNTIL_LOOP uses the SAME nodeParams schema as FC_WHILE_LOOP (fieldTechnicalId, comparator, compareValue, conditions array, _childNodes). The only difference is WHEN the condition is evaluated: before (WHILE) vs after (DO-UNTIL) each iteration. You can have MULTIPLE children in the _childNodes array — they are executed in order on each iteration. The same BREAK PATTERN from FC_WHILE_LOOP applies here: to break out of the loop, add a FC_MULTIPLE_CONDITION child that checks the break condition, and on its YES branch _childNodes place a FC_BREAK node (nodeParams: {}) which exits the nearest enclosing loop.
- Example output (simple — one child):
  {"taskName":"Send mail then check Klausel","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"FC_DO_UNTIL_LOOP","nodeParams":{"fieldTechnicalId":"tfKlausel","comparator":"EQUAL","compareValue":"1","_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"A@B.C.DE","subject":"XXX","body":"<p>ZZZ</p>","from":"X@X.XX"}}]},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}
- Example output (with break pattern — multiple children):
  User: "Beim Klick soll solange in Klausel eine 1 steht eine Mail mit dem Betreff XXX und dem Inhalt ZZZ an A@B.C.DE von X@X.XX geschickt werden. Nach dem senden der Mail soll in der Schleife geprüft werden ob Klausel ein X enthält und wenn das so ist aus der Schleife ausgebrochen werden."
  {"taskName":"Send mail while Klausel equals 1 with break when Klausel contains X","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"FC_DO_UNTIL_LOOP","nodeParams":{"fieldTechnicalId":"tf1","comparator":"EQUAL","compareValue":"1","_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"A@B.C.DE","subject":"XXX","body":"<p>ZZZ</p>","from":"X@X.XX"}},{"nodeType":"FC_MULTIPLE_CONDITION","nodeParams":{"fieldTechnicalId":"tf1","comparator":"CONTAINS","compareValue":"X","labelYes":"Klausel contains X break","labelNo":"Klausel does not contain X continue","_childNodes":[{"nodeType":"FC_BREAK","nodeParams":{}}]}}]},"endpointState":"Empfangen","endpointType":"FC_CHANGE_STATE"}
- The same CONTINUE PATTERN from FC_WHILE_LOOP applies here: to skip the rest of the current iteration and continue with the next iteration of a parent/outer loop, add a FC_MULTIPLE_CONDITION child that checks the continue condition, and on its YES branch _childNodes place a FC_CONTINUE node with the appropriate continueTarget.

### FC_WITH_FORM_ELEMENT_CONTEXT
A scoping node that wraps child actions and provides context about which form elements are in scope.
- CRITICAL — When user says "im Kontext von" (in context of) + field values to set, you MUST set nodeType to FC_WITH_FORM_ELEMENT_CONTEXT (NOT FC_CHANGE_FORM_VALUE). Put ALL three things in nodeParams:
    (a) "fieldValues":[{"name":"<techId>","value":"<val>"},...] — every field+value from prompt goes here as context.
    (b) "repetitions":[{"name":"<techId>","value":"<index>"},...] — repetition indices mentioned in prompt.
    (c) "_childNodes":[{"nodeType":"FC_CHANGE_FORM_VALUE","nodeParams":{"formValues":[{"name":"<techId>","value":"<val>"},...]}}] — SAME fields as actual assignments.
- Example:
  {"taskName":"Set fields in context","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"FC_WITH_FORM_ELEMENT_CONTEXT","nodeParams":{"fieldValues":[{"name":"tfVorname","value":"Max"},{"name":"tfNachname","value":"Mustermann"}],"repetitions":[{"name":"tfKlausel","value":"1"}],"_childNodes":[{"nodeType":"FC_CHANGE_FORM_VALUE","nodeParams":{"formValues":[{"name":"tfVorname","value":"Max"},{"name":"tfNachname","value":"Mustermann"}]}}]},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}

## Endpoint State

Every workflow lane automatically ends with an endpoint (Endpunkt). The 'endpointState' field specifies the FORMCYCLE status name to set the form record to after all actions in the lane complete.

DEFAULT: the "Received" status name in the SAME LANGUAGE as the user's prompt — German → "Empfangen", French → "Reçu", Italian → "Ricevuto", etc.; NEVER use the English "Received" when the prompt is not in English. Use this default unless the user specifies a different end status.
EXCEPTION — When nodeType is "FC_DELETE_FORM_RECORD", "FC_QUEUE_TASK", or "FC_RETURN", set endpointState to "" (empty string) because these are terminal nodes and there is no status to transition to.

ENDPOINT TYPE ("endpointType" field) — specifies the type of endpoint node to create:
DEFAULT: "FC_CHANGE_STATE" — creates a status transition endpoint. Use this for most cases.
ALTERNATIVE: "FC_RETURN" — creates a return endpoint that simply ends the workflow process without changing the form record state. Use this when the user says the process should be ended/terminated (e.g. "der Prozess soll beendet werden", "Prozess beenden", "workflow beenden", "Vorgang abschließen"). When endpointType is "FC_RETURN", the endpointState field is ignored (no state transition needed).

CRITICAL — If the user says "set status to <XYZ>" or "das Formular auf den Status <XYZ> setzen", use EXACTLY the status name the user specified in their prompt. Do NOT pick a different status from the available list below. The user's requested status name may be new or different from existing ones. This is NOT a separate action or lane. Simply set endpointState to the user's specified status name. The status transition is automatically created as the bottommost node of the lane.
Exception: if nodeType is "FC_CHANGE_STATE", the state change IS the endpoint; set endpointState to the same value as nodeParams.stateName.
NOTE — A status is a FORMCYCLE RECORD STATE, NOT a form field: NEVER ask which form field holds the status, NEVER create a status form field, and NEVER use a [%…%] placeholder as the status/state value (it does NOT resolve there). The status value is a literal name. When the user wants the process to END without changing the status ("Prozess beenden", "ohne den Status zu ändern"), use endpointType "FC_RETURN" with endpointState "".
FC_LOG_ENTRY — nodeParams.message is literal log TEXT (e.g. "Vorgang gestartet"), not a status and not a form-field lookup.
CRITICAL — A lane has EXACTLY ONE endpoint and it is the LAST node on the main line. NEVER emit BOTH a state change (FC_CHANGE_STATE) as an ordinary chained/mid node AND a separate endpoint with endpointType "FC_CHANGE_STATE": Formcycle renders the FIRST state change as the endpoint and greys out / disconnects everything after it, so the later actions never run. Put non-terminal actions first and the status transition LAST — either as the final chained FC_CHANGE_STATE node (then set endpointState to the same status and it becomes the endpoint), or purely via endpointState/endpointType WITHOUT any chained FC_CHANGE_STATE. Never use FC_CHANGE_STATE, FC_RETURN, FC_DELETE_FORM_RECORD or FC_QUEUE_TASK as a MID-chain node.

STATE PROPERTIES ("stateProperties" field — optional):
If the user specifies additional requirements for the endpoint state, include a 'stateProperties' object.
Supported boolean properties: externalAccessPermitted, allowAccessToApplicant, allowAccessAllParticipants, allowAccessToAnonymousApplicant, allowAuthenticatedUser, formRecordDeletable, useSystemAuthentication.
Example 1: "von extern aufrufbar" → stateProperties: {"externalAccessPermitted": true}
Example 2: "für alle Beteiligten aufrufbar" → stateProperties: {"allowAccessAllParticipants": true}
Example 3: "für alle authentifizierten Beteiligten aufrufbar" → stateProperties: {"allowAccessAllParticipants": true, "allowAuthenticatedUser": true}
Example 4: "Passwort XXX" — TWO APPROACHES depending on intent:
  APPROACH A — State-level (permanent): Use when the user says the STATE itself should be password-protected for ALL records entering it (e.g. "der Status XYZ soll passwortgeschützt sein", "der Endstatus benötigt ein Passwort"). → Set endpointState.stateProperties: {"useSystemAuthentication": true}. Do NOT generate an FC_SET_FORM_RECORD_PASSWORD node. NOTE: The actual password value must be configured manually in the workflow state editor's authenticator configuration after creation — it is a state-level setting, not a workflow action.
  APPROACH B — Workflow-level (conditional): Use when the user says a SPECIFIC TRIGGER/ACTION should password-protect the record (e.g. "beim Klick auf submit mit Passwort schützen", "beim Absenden zugangsbeschränken", "Passwort XXX beim submit", "Passwort generieren"). → Generate an FC_SET_FORM_RECORD_PASSWORD workflow action node. Use Mode 1 (MANUALLY_ENTERED_PASSWORD) when the user provides a specific password text: nodeParams: {"targetType":"MANUALLY_ENTERED_PASSWORD","inputPassword":"<the password text>"}. Use Mode 2 (GENERATED_PASSWORD) when the user asks for a generated password or specifies character types/length: nodeParams: {"targetType":"GENERATED_PASSWORD","generatedLength":10,"policyRuleLowercase":true,"policyRuleUppercase":true,"policyRuleDigit":true,"policyRuleSymbol":true,"policyRuleAlphabetical":false}. This sets the password directly on the form record. Do NOT set stateProperties in this case — the password is stored in the workflow action node, not the endpoint state.
CRITICAL — Choose ONE approach, never both. APPROACH B (FC_SET_FORM_RECORD_PASSWORD node) is for conditional/circumstantial password protection tied to a specific trigger. APPROACH A (stateProperties) is for permanent state-level password configuration.
