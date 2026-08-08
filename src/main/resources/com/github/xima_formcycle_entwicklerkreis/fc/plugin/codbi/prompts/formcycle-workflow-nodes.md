# Formcycle Workflow Nodes

Output format: Output EITHER a single JSON object (for ONE workflow lane) OR an array of JSON objects (for MULTIPLE lanes).

Single lane: {"taskName":"...","taskDescription":"...","triggerType":"...","triggerParams":{},"nodeType":"...","nodeParams":{},"endpointState":"...","endpointType":"..."}
Multiple lanes: [{"taskName":"...",...},{"taskName":"...",...}]

Each object has exactly these keys: taskName, taskDescription, triggerType, triggerParams, nodeType, nodeParams, endpointState, endpointType.

CRITICAL — taskName is MANDATORY for EVERY node type. Always set a short, meaningful AND SPECIFIC description. Include key details like the target URL (without http://), template name, parameter names/values, email subject, file name, or HTTP endpoint. taskName CHARACTER RESTRICTIONS — only letters (a-z, A-Z), numbers (0-9), spaces, hyphens (-), underscores (_), and parentheses () are allowed. Characters like dots (.), equals signs (=), slashes (/), colons (:), question marks (?), ampersands (&), and all other special characters are FORBIDDEN in taskName. If the user's prompt contains such characters, replace them with allowed alternatives (e.g. "msn.de" → "msn de", "F2=YOLO" → "F2 equals YOLO", "http://..." → omit the protocol).

REQUIRED PARAMS — Most node types need mandatory nodeParams. Whenever a required value is missing from the user's request and cannot be derived, ASK the user for it (clarification) instead of inventing one. Common required values: FC_EMAIL → senderAddress, subject, recipient (recipientMessageService/address), message; FC_DOI_INIT → success + failure completion pages, sender, subject, recipient; FC_POST_REQUEST → URL + HTTP method; FC_REDIRECT → URL or urlTemplate; FC_SHOW_TEMPLATE → htmlTemplate; FC_MOVE_FORM_RECORD_TO_INBOX → inboxName; FC_SAVE_TO_FILE_SYSTEM → path; FC_SAVE_TO_WEBDAV → connection + path; FC_FILL_PDF / FC_FILL_WORD → template + field mapping; FC_CREATE_TEXT_FILE → file name + content; FC_CHANGE_FORM_VALUE / FC_WRITE_FORM_RECORD_ATTRIBUTES → field/attribute + value; FC_SET_FORM_RECORD_PASSWORD → password; FC_CHANGE_STATE → the target state.

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

PLACEHOLDERS: To include a form field value in email body/subject/recipient use [%technicalId%] where 'technicalId' is taken from the FORM ELEMENTS list. Example: [%tfEmail%] for a field whose 'technicalId' is 'tfEmail'.

AVAILABLE SERVER VARIABLES (system placeholders — use [%\$NAME%] syntax, no curly braces):
  FORM RECORD:
    [%\$PROCESS_ID%] or [%\$PROZESS_ID%] — form record process ID (string)
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
    [%\$PROJECT_ID%] or [%\$PROJEKT_ID%] — project ID
    [%\$PROJECT_ALIAS%] — project alias
    [%\$PROJECT_NAME%] — project name
    [%\$PROJECT_TITLE%] — project title
    [%\$PROJECT_DESCRIPTION%] — project description
  CLIENT:
    [%\$MANDANT_ID%] or [%\$CLIENT_ID%] — client/mandant ID
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
    [%\$FORM_PROCESS_LINK%] or [%\$FORM_PROZESS_LINK%] — link to the process view
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
  Output: {"taskName":"E-Mail bei Absenden","taskDescription":"","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{"buttonName":"btnZwolf"},"nodeType":"FC_EMAIL","nodeParams":{"to":"[%tfHurra%]","subject":"Eingang","body":"<p>Ihr Formular wurde empfangen.</p>"},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}
  User input: "Beim Klick auf submit soll der Prozess beendet werden."
  Output: {"taskName":"Prozess beenden bei Absenden","taskDescription":"","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"FC_RETURN","nodeParams":{},"endpointState":"","endpointType":"FC_RETURN"}

## Trigger Types

### FC_FORM_SUBMIT_BUTTON
Fires when a submit button is clicked.
- triggerParams: {"buttonName":"<technical name>"} or {} for any button

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
- CRITICAL — Map German time units EXACTLY to durationUnit: "Sekunde"/"Sekunden" → SECONDS; "Minute"/"Minuten" → MINUTES; "Stunde"/"Stunden" → HOURS; "Tag"/"Tage" → DAYS; "Woche"/"Wochen" → WEEKS; "Monat"/"Monate" → MONTHS; "Jahr"/"Jahre" → YEARS.
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
- nodeParams: {"to":"<recipient address, [%fieldname%] placeholder, or empty string \"\" if no recipient is known — NEVER substitute FC_EMPTY for a missing address>","subject":"<subject text>","body":"<email body in HTML format — ALWAYS use HTML markup: use <br> for line breaks (NOT \n), <p>…</p> for paragraphs, <b>…</b> for bold, <ul>/<li> for lists; use [%fieldname%] placeholders to include form field values>","from":"<sender address, empty if not specified>","senderName":"<sender display name, empty if not specified>"}
- Do NOT include bodyFormatType — it is always set to HTML automatically.
- CRITICAL — Do NOT include "files", "attachments", or any file-related fields in FC_EMAIL nodeParams unless the user explicitly specified files to attach. Empty arrays cause validation errors.

### FC_DOI_INIT
Sends a double opt-in invitation email with DOI confirmation link. This is the CORRECT node type for double opt-in invitations, NOT FC_EMAIL.
- CRITICAL — The email BODY MUST include the verification link as HTML: <a href="[%\$FORM_VERIFY_LINK%]">E-Mail-Adresse bestätigen</a> (or equivalent in the user's language). The placeholder [%\$FORM_VERIFY_LINK%] is automatically resolved by FORMCYCLE at runtime — use it exactly as shown.
- Use together with trigger FC_DOI_VERIFIED.
- nodeParams: {"to":"<recipient address>","subject":"<subject>","body":"<HTML body>","from":"<sender address>","senderName":"<sender name>","failurePage":"<name of the Abschlussseite to display if the DOI verification fails — MUST be one of the AVAILABLE ABSCHLUSSSEITEN listed in the prompt>"}
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
- CRITICAL — If the attribute names match form field technical IDs, set "writeAttributesToForm":true to also update those form fields. Do NOT create a separate FC_CHANGE_FORM_VALUE node for the same values; use writeAttributesToForm instead.
- nodeParams: {"attributes":[{"name":"<key>","value":"<value>"},...], "writeAttributesToForm":<true|false>}

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

### FC_FILL_PDF
Fills a PDF template with form data and produces a filled PDF.
- nodeParams: {"file":"<template filename from form resources, e.g. 'vorlage.pdf'>","exportName":"<output filename, e.g. 'ausgefuellt.pdf'>","flatten":<true|false> (optional, default true)}.
- When used as a chained node, the template file is taken from the preceding node's output.

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

### CheckTrustLevelPlugin (de.xima.fc.plugin.bs.authn.plugin.node.CheckTrustLevelPlugin)
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
- CRITICAL — When the prompt contains BOTH an authentication requirement (ELSTER, trust level) AND an action (send email, etc.), set nodeType to "de.xima.fc.plugin.bs.authn.plugin.node.CheckTrustLevelPlugin". Include the child action nodes as a "_childNodes" array inside nodeParams. Each child has "nodeType" and "nodeParams". The server creates them on the YES branch.
- Example output:
  {"taskName":"ELSTER Auth Check and Send Email","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"de.xima.fc.plugin.bs.authn.plugin.node.CheckTrustLevelPlugin","nodeParams":{"trustLevel":"CERTIFICATE","_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"A@B.C.DE","subject":"XXX","body":"<p>ZZZ</p>","from":"G@g.a"}}]},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}

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
  {"taskName":"Send email with error handling","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"FC_EXPERIMENT","nodeParams":{"_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"X@X.X","subject":"Hallo","body":"<p>Holla</p>","from":"A@B.C"}}],"_handlerChildNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"O@O.O","subject":"Fehler","body":"<p>Fehler</p>","from":"J@J.J"}}]},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}

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
- Example output for repeatable field:
  {"taskName":"Send email per Klausel","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{"buttonName":"btnSubmit"},"nodeType":"FC_FOR_EACH_LOOP","nodeParams":{"fieldTechnicalId":"tfKlausel","_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"A@B.C.DE","subject":"XXX","body":"<p>ZZZ</p>","from":"X@X.XX"}}]},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}
- Example output for character-separated values:
  {"taskName":"Send email per hyphen-separated Klausel text","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{"buttonName":"btnSubmit"},"nodeType":"FC_FOR_EACH_LOOP","nodeParams":{"fieldTechnicalId":"tf1","sourceType":"CHARACTER_SEPARATED_VALUES","delimiter":"-","_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"A@B.C.DE","subject":"XXX","body":"<p>ZZZ</p>","from":"X@X.XX"}}]},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}

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
  {"taskName":"Send mail while Klausel equals 1 with break when Klausel contains X","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"FC_WHILE_LOOP","nodeParams":{"fieldTechnicalId":"tf1","comparator":"EQUAL","compareValue":"1","_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"A@B.C.DE","subject":"XXX","body":"<p>ZZZ</p>","from":"X@X.XX"}},{"nodeType":"FC_MULTIPLE_CONDITION","nodeParams":{"fieldTechnicalId":"tf1","comparator":"CONTAINS","compareValue":"X","labelYes":"Klausel contains X break","labelNo":"Klausel does not contain X continue","_childNodes":[{"nodeType":"FC_BREAK","nodeParams":{}}]}}]},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}
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
  {"taskName":"Send mail while Klausel equals 1 with break when Klausel contains X","triggerType":"FC_FORM_SUBMIT_BUTTON","triggerParams":{},"nodeType":"FC_DO_UNTIL_LOOP","nodeParams":{"fieldTechnicalId":"tf1","comparator":"EQUAL","compareValue":"1","_childNodes":[{"nodeType":"FC_EMAIL","nodeParams":{"to":"A@B.C.DE","subject":"XXX","body":"<p>ZZZ</p>","from":"X@X.XX"}},{"nodeType":"FC_MULTIPLE_CONDITION","nodeParams":{"fieldTechnicalId":"tf1","comparator":"CONTAINS","compareValue":"X","labelYes":"Klausel contains X break","labelNo":"Klausel does not contain X continue","_childNodes":[{"nodeType":"FC_BREAK","nodeParams":{}}]}}]},"endpointState":"Received","endpointType":"FC_CHANGE_STATE"}
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

DEFAULT: "Received" — use this unless the user specifies a different end status.
EXCEPTION — When nodeType is "FC_DELETE_FORM_RECORD", "FC_QUEUE_TASK", or "FC_RETURN", set endpointState to "" (empty string) because these are terminal nodes and there is no status to transition to.

ENDPOINT TYPE ("endpointType" field) — specifies the type of endpoint node to create:
DEFAULT: "FC_CHANGE_STATE" — creates a status transition endpoint. Use this for most cases.
ALTERNATIVE: "FC_RETURN" — creates a return endpoint that simply ends the workflow process without changing the form record state. Use this when the user says the process should be ended/terminated (e.g. "der Prozess soll beendet werden", "Prozess beenden", "workflow beenden", "Vorgang abschließen"). When endpointType is "FC_RETURN", the endpointState field is ignored (no state transition needed).

CRITICAL — If the user says "set status to <XYZ>" or "das Formular auf den Status <XYZ> setzen", use EXACTLY the status name the user specified in their prompt. Do NOT pick a different status from the available list below. The user's requested status name may be new or different from existing ones. This is NOT a separate action or lane. Simply set endpointState to the user's specified status name. The status transition is automatically created as the bottommost node of the lane.
Exception: if nodeType is "FC_CHANGE_STATE", the state change IS the endpoint; set endpointState to the same value as nodeParams.stateName.

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
