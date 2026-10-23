# Formcycle Workflow Nodes (Compact)

Condensed reference: the FORMCYCLE workflow triggers and node types and what each is for. You receive ONLY this list initially. Before you emit the final workflow task JSON you MUST request the exact triggerParams/nodeParams details for every trigger and node type you intend to use by returning a details request with a "nodes" array (and optionally "triggers") listing ALL the names you need — the server then provides the exact JSON schemas for exactly those. List every trigger and node you plan to use (including condition/loop/container nodes) so none is missing.

Output format: Output EITHER a single JSON object (for ONE workflow lane) OR an array of JSON objects (for MULTIPLE independent lanes). Each object has exactly these keys: taskName, taskDescription, triggerType, triggerParams, nodeType, nodeParams, endpointState, endpointType.

DESCRIPTIONS — "taskDescription" is MANDATORY and MUST be a meaningful, human-readable sentence describing WHAT the node does (it becomes the node's description in the workflow designer). It is NOT the node name ("taskName" is the name). Emit one for EVERY task object (each lane) AND for EVERY entry in "chainedNodes", in the SAME language as the user's request — NEVER leave it empty ("" is invalid).

LANGUAGE — write taskName, ALL node names/labels, and the endpointState label in the SAME language as the user's request (a German prompt → German labels, e.g. "Zeilen als JSON in Hulu schreiben", and the endpoint "Empfangen" instead of "Received"; an English prompt → English). Never fall back to a default language.

CRITICAL — output rules for form element identifiers (technicalId vs displayText):
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
    [%\$FORM_PROCESS_LINK%] — link to the process view (the current state of the record) — use DIRECTLY for "link to the form / current state" in a mail body
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
    (same with LATEST_ or LAST_ prefix, e.g. [%\$LATEST_ERROR_MESSAGE%]). For an error-notification mail use the LATEST_ variants, NEVER CURRENT_.
    Optional: append (index) for a specific exception, e.g. [%\$CURRENT_ERROR(0)%]
  APPOINTMENTS:
    [%\$APPOINTMENT%] — appointment data
    [%\$APPOINTMENT_LIST%] — appointments list (HTML)
    [%\$APPOINTMENT_LINK%] — appointment booking link

## Trigger Types

### FC_FORM_SUBMIT_BUTTON
FC_FORM_SUBMIT_BUTTON — Fires when a submit button is clicked.
### FC_QUALIFIED_FORM_SUBMIT_BUTTON
FC_QUALIFIED_FORM_SUBMIT_BUTTON — Fires when a qualified (electronic signature) submit button is clicked.
### FC_MANUAL
FC_MANUAL — Manual invocation (user triggered).
### FC_STATE_TIMER
FC_STATE_TIMER — Fires AFTER A TIME DELAY once a record enters a specific state (time-based trigger).
### FC_TIME_POINT
FC_TIME_POINT — Fires at a specific date/time (fixed date or computed from a form field value). TRIGGER ONLY — never a nodeType/chainedNodes entry. For "X days after the date in field Y" create a SECOND lane with triggerType FC_TIME_POINT + triggerParams {"timePointType":"EXPRESSION_WITH_FORMAT","dateTimeTemplate":"[%fieldTechId%]","dateTimeFormat":"dd.MM.yyyy","operation":"PLUS","offsetDuration":"3","durationUnit":"DAYS","fireWhenInPast":false}, and COPY the existing action (e.g. the mail node incl. its attachments) as that lane's node.
### FC_FORM_RECORD_MESSAGE_POSTED
FC_FORM_RECORD_MESSAGE_POSTED — Fires when an internal message is posted to the record.
### FC_FORM_RECORD_MESSAGE_UPLOAD_REQUEST_FULFILLED
FC_FORM_RECORD_MESSAGE_UPLOAD_REQUEST_FULFILLED — Fires when a file upload request submitted via internal message is fulfilled.
### FC_CATCH_ERROR
FC_CATCH_ERROR — Fires when an error occurs in another workflow lane (configurable filters).
### FC_DOI_VERIFIED
FC_DOI_VERIFIED — Fires after a DOI email confirmation (e.g. status change, welcome email).
### FC_INVITATION_SENT
FC_INVITATION_SENT — Fires when an invitation (DOI) email is sent.
### FC_INVITATION_ERROR
FC_INVITATION_ERROR — Fires when an invitation (DOI) email delivery fails.
### FC_USER_INVOCATION
FC_USER_INVOCATION — Fires when a logged-in user manually triggers it from the record detail view.

## Node Types

### FC_EMAIL
FC_EMAIL — Sends an email.
REQUIRED: sender address, subject, recipient (message service or direct address), message text. Ask for the sender and subject when the user only gives the recipient.
ATTACHMENTS: to attach files from an upload field, add `"attachments":["<upload field technical ID>"]` to FC_EMAIL nodeParams — an array of STRINGS (e.g. `"attachments":["fdImageUpload"]`), NEVER objects like `{"field":"..."}`. Omit "attachments"/"files" entirely when no files were requested.
RECIPIENT: NEVER invent a recipient address (e.g. NEVER "recipient@example.com"). "to" must be a real address the user provided/clarified (write it LITERALLY, do NOT create a form field for it) or a [%…%] placeholder of an EXISTING email field on the form (e.g. the payer's email in a payment form). If no recipient is known, ask via clarification BEFORE emitting the FC_EMAIL.
SENDER: if the user provided or clarified a sender address, put that EXACT literal address in "from". NEVER replace a user-provided sender with [%\$DEFAULT_MAIL_SENDER%] / [%\$CLIENT_MAIL_SENDER%] — those defaults are only for when no sender was ever named.
VALUES & ONE-TO-ONE RULE (applies to EVERY node parameter, not just email): a clarified value (subject, sender, recipient, address, URL, amount, status, ...) is written LITERALLY into the corresponding node parameter. NEVER create a form field to hold a clarified/literal value and NEVER reference such a literal via a [%…%] placeholder — a [%…%] placeholder is valid ONLY for a REAL form field the end user fills in at runtime. A "create a field" answer (e.g. "Erstelle ein E-Mail-Feld", "lege ein Feld für die Adresse an") applies ONLY to the ONE value it names; the OTHER literal values in the same answer are STILL written directly into the node — do NOT also turn them into fields. NEVER emit a field whose placeholder is a literal value you already know.
REPEATABLE CONTAINERS IN TEXT / EMAIL — a plain [%fieldName%] placeholder in an email body (or any text) returns only the FIRST row of a repeatable (dynamic) container. When the content must include ALL rows — which a general description like "die Zeiten" / "die Öffnungszeiten" / "the times" implies, covering regular AND special entries — iterate the container: FC_FOR_EACH_LOOP (sourceType FORM_FIELD_REPETITIONS) with per-row FC_WRITE_FORM_RECORD_ATTRIBUTES appending each row's text to a server attribute inside the loop's _childNodes, then reference that server attribute ([%\$RECORD_ATTR.key%]) in the FC_EMAIL body after the loop. REQUEST those node details too. ACCUMULATE THE ROWS AS READABLE TEXT — one line per row (e.g. "Mo: 09:00 - 17:00") or a bulleted list — NOT a JSON array: the email receiver reads this text. Only build a JSON array when the user explicitly asked to store the rows as JSON (e.g. into a database field).
DYNAMIC-ELEMENT NAMES & VALUES (Formcycle "Repeated elements in the workflow"): in the FORM each duplicated element is named `Elementname_index` (tf1_0, tf1_1, tf1_2, zero-based) — reference a specific instance directly (e.g. [%tf1_0%]); in the INBOX/WORKFLOW a plain [%fieldName%] of a dynamic element returns ALL its values comma-separated. For per-row work always use FC_FOR_EACH_LOOP (FORM_FIELD_REPETITIONS) instead of relying on that comma-string.
### FC_DOI_INIT
FC_DOI_INIT — Sends a double opt-in invitation email with DOI confirmation link (CORRECT for DOI, not FC_EMAIL).
REQUIRED: completion page (Abschlussseite) for success AND for failure, sender address, subject, recipient.
### FC_CHANGE_STATE
FC_CHANGE_STATE — Changes the form record state.
REQUIRED: the target state (status) the record should be set to.
### FC_POST_REQUEST
FC_POST_REQUEST — Sends an HTTP request (webhook, REST API call). Optional flags: headers[], allowInvalidCertificates, useBasicAuth, treat4xxAsNormal, treat5xxAsNormal.
REQUIRED: URL and HTTP method (GET/POST/PUT/DELETE/...). Ask for them when not provided.
CRITICAL — BODY vs. PARAMETERS are mutually exclusive: the node sends EITHER a "body" OR named
"requestParameters", NEVER both. When the user asks for a POST body AND named parameters, clarify
that the parameters shall be sent as HTTP headers instead (with a prefix like "X-"). Offer ONLY
feasible options (all-in-one body, or parameters as headers + body, or form-data parameters only) —
NEVER offer the impossible "requestParameters + separate body" combination, not even as a default
choice or with a "(nicht möglich)" remark.
MANDATORY — a clarified success and/or failure Abschlussseite MUST be rendered as FC_SHOW_TEMPLATE
nodes (success before the endpoint, failure in the "_handlerChildNodes" of an FC_EXPERIMENT wrapping
the request). When BOTH pages are named, nodeType MUST be "FC_EXPERIMENT" — a bare FC_POST_REQUEST
without FC_SHOW_TEMPLATE nodes is a HARD ERROR.
### FC_CHANGE_FORM_VALUE
FC_CHANGE_FORM_VALUE — Sets the value of one or more form fields.
REQUIRED: which field(s) (technicalId) and the value(s) to set.
nodeParams: {"formValues":[{"name":"<techId>","value":"<value>"},...], "repetitionSizes":[{"name":"<containerTechId>","value":"<count>"},...]}
REPETITION ("Number of repetitions" = repetitionSizes): grows a REPEATABLE (dynamic) container to a fixed row count WITHOUT a loop. name = the repeatable CONTAINER technicalId (not the single field), value = target count as string. FAVOR this when the prompt only says a field/block must be set/happen N times ("repeat 100 times", "100 Mal", "N-fach", "N rows/copies") and nothing else — NEVER use FC_FOR_EACH_LOOP/FC_WHILE_LOOP for a fixed "set N times". If the block is not yet in a repeatable container, FIRST wrap the repeated fields in a NEW dynamic container so repetitionSizes can grow it.
### FC_LOG_ENTRY
FC_LOG_ENTRY — Writes a log message to the process log.
### FC_REDIRECT
FC_REDIRECT — Redirects the user's browser to a URL (manual URL or URL template).
REQUIRED: the target URL or the URL template to use.
### FC_RETURN
FC_RETURN — Simply ends/terminates the workflow process without changing the form record state.
### FC_RENEW_PROCESS_ID
FC_RENEW_PROCESS_ID — Gives the CURRENT form record a BRAND-NEW process ID (Vorgangs-ID): formcycle generates a fresh UUID, writes it onto the record and rewrites the record's process subjects. USE THIS — never FC_CHANGE_FORM_VALUE / FC_WRITE_FORM_RECORD_ATTRIBUTES / FC_SQL_STATEMENT / a form field — when the RECORD itself shall get a new ID, judged by MEANING in any language ("neue Prozess-ID (vergeben)", "neue Vorgangs-ID", "neue Vorgangsnummer", "Prozess-ID erneuern", "new process id", "renew the process id", "new case number/reference", "nouvel ID de processus", "nouveau numéro de dossier", "nuovo ID di processo", "nieuw proces-ID", "nuevo ID de proceso"). A new RECORD is a DIFFERENT intent (new submission), not this node.
nodeParams: {} — NO configuration at all (only name/description): the ID is ALWAYS a generated full UUID, never a chosen value, so never ask for a prefix/mask/format/field and never invent a parameter. Run it once per click, not in a loop. Result record: previousProcessID + processID.
### FC_SET_SAVED_FLAG
FC_SET_SAVED_FLAG — Marks the form record as saved.
### FC_DELETE_FORM_RECORD
FC_DELETE_FORM_RECORD — Permanently deletes the current form record.
### FC_QUEUE_TASK
FC_QUEUE_TASK — Queues an event/task for execution (terminal node).
### FC_SEND_FORM_RECORD_MESSAGE
FC_SEND_FORM_RECORD_MESSAGE — Sends an internal message to the record's inbox.
REQUIRED: the message text (and the recipient message service when recipientType=INBOX_ID).
### FC_CHANGE_FORM_RECORD_CHAT_ACTIVENESS
FC_CHANGE_FORM_RECORD_CHAT_ACTIVENESS — Opens or closes a form record chat.
REQUIRED: the chat reference and whether it should be opened or closed.
### FC_CREATE_TEXT_FILE
FC_CREATE_TEXT_FILE — Creates a text/JSON/XML/HTML file from LITERAL content (writes exactly what is put into fileContent). NOT for exporting the form record as XML — use FC_EXPORT_TO_XML for that.
REQUIRED: file name and the content to write.
### FC_EXPORT_TO_XML
FC_EXPORT_TO_XML — Exports the FORM RECORD's data as an XML file (optional XSLT transformation) and can attach it to the record. USE THIS — never FC_CREATE_TEXT_FILE — when the form/record data itself is to be exported as XML, judged by MEANING in any language ("als XML exportieren", "das Formular als XML", "XML-Datei des Vorgangs", "XML-Export", "transformiert von <Vorlage>", "export as XML", "transformed by an XSLT template", "exporter en XML", "esportare in XML", "exporteren als XML", "exportar como XML"). MENTIONING A TRANSFORMATION MEANS AN XSLT TEMPLATE IS INTENDED: the name attached to "transformiert von/durch/mit", "transformed by/with", "XSLT-Vorlage", "XSLT template" IS the template — MATCH it against the AVAILABLE XSLT TEMPLATES list (case/separators/umlauts irrelevant, one clear partial match is enough) and set "xslTemplate" to the MATCHED template's exact stored name; never omit it.
nodeParams: {"exportName":"<file name>.xml","xslTemplate":"<exact XSLT template name — omit for raw XML>","xmlFileProvision":{"attachToFormRecord":<true|false>,"attachmentAccessibleToEndUser":<true|false>}} — optionally "enableConfig":true plus only the requested export flags (exportId, exportProcessId, exportSubject, exportStatus, exportInbox, exportCreationDate, exportModificationDate, exportVariables, exportTechnicalFields, exportExportMetaData).
EXTRA FIELDS → FLAGS (by MEANING in any language): Prozess ID/record id → exportId; Prozessnummer/workflow process id → exportProcessId; Betreff/subject → exportSubject; Status/state → exportStatus; Posteingang/inbox/postbox → exportInbox; Erstellungsdatum/creation date → exportCreationDate; Änderungsdatum/modification date → exportModificationDate; Variablen/variables → exportVariables; Kontrollfelder/technische Felder/control/technical/system fields → exportTechnicalFields; Metadaten/metadata → exportExportMetaData. When the user names ANY extra item, "enableConfig":true is mandatory and every matching flag must be true — never all false.
XSLT: "xslTemplate" must be an EXISTING XSLT template (category XSL) from the AVAILABLE XSLT TEMPLATES list — never invent one; omit it when no transformation is requested; ask when a transformation is requested but no valid template is named.
DOWNLOAD: the node only creates/stores the file; for a browser download chain ONE FC_RETURN_FILE after it: {"nodeType":"FC_RETURN_FILE","nodeParams":{"fileName":"<same name>","sourceNode":"%prev%","forceDownload":true}} — FC_RETURN_FILE is THE download node, never FC_PROVIDE_RESOURCE.
### FC_EXPORT_TO_PERSISTENCE
FC_EXPORT_TO_PERSISTENCE — Exports the FORM RECORD's PERSISTED STATE (the data exactly as formcycle stores it in the database, persistence XML) as an .xml file. USE THIS — never FC_EXPORT_TO_XML/FC_CREATE_TEXT_FILE — when the user wants the STATE of the form/record saved, exported, backed up, archived or downloaded, judged by MEANING in any language ("Zustand des Formulars", "Formularzustand", "Stand des Formulars", "Zustand herunterladen/sichern", "Persistenz-Datei", "Vorgang sichern", "form state", "state of the form", "save/download the form state", "record state", "persistence file", "back up the record", "état du formulaire", "stato del formulario", "staat van het formulier", "estado del formulario").
nodeParams: {"exportName":"<file name>.xml — omit to use the record subject>","persistenceFileProvision":{"attachToFormRecord":<true|false>,"attachmentAccessibleToEndUser":<true|false>}} — ONLY these two parameters exist (NO xslTemplate, NO enableConfig, NO exportId/exportInbox/... flags).
DIFFERENCE: FC_EXPORT_TO_XML = readable export of the FIELD VALUES (optional XSLT); FC_EXPORT_TO_PERSISTENCE = complete stored record state for backup/snapshot/migration or later form-value import.
DOWNLOAD: the node only creates/stores the file; chain ONE FC_RETURN_FILE after it ({"fileName":"<same name>","sourceNode":"%prev%","forceDownload":true}) — FC_RETURN_FILE is THE download node, never FC_PROVIDE_RESOURCE.
### FC_IMPORT_FORM_VALUE_FROM_XML
FC_IMPORT_FORM_VALUE_FROM_XML — Reads an XML file and writes its values INTO form fields via XPath mappings, then persists the record (IMPORT direction). USE THIS — never the FC_EXPORT_* nodes or FC_CREATE_TEXT_FILE — when values/a saved state shall be imported FROM an XML file into the form, judged by MEANING in any language ("XML importieren", "aus XML importieren", "Werte aus der XML-Datei übernehmen", "die Datei als Zustand des Formulars importieren", "Zustand aus Datei laden/wiederherstellen", "Formular aus XML befüllen", "import form values from XML", "load/restore the form state from the uploaded file", "fill the form fields from the XML", "importer depuis XML", "importare da XML", "importeren uit XML", "importar desde XML"). A stated TRANSFORMATION ("zuvor mit XXX transformiert", "transformed by XXX", "XSLT-Vorlage XXX") ALWAYS means XSLT: MATCH that name against the AVAILABLE XSLT TEMPLATES list (case/separators/umlauts irrelevant) and set "xslTemplate" to the MATCHED template's exact stored name — never ask which kind of transformation and never omit it.
nodeParams: {"xmlSource":{"resource":{"type":"UPLOAD","identifier":"<technicalId of the upload field>"}},"xslTemplate":"<exact XSLT template — optional, only when transformation is needed>","xpathMapping":[{"name":"<target field technicalId>","value":"<XPath expression>"},…]} — xmlSource is REQUIRED (upload field / form resource by "fileName" / previous node via "sourceNode":"%prev%"). xpathMapping: name = TARGET form field, value = XPath whose string result is written into it; for formcycle XML exports use //field[@name='<technicalId>']/plainValue. For "the whole state" create one mapping per form field; if the XML structure is unknown and no XSLT is given, ask for the mapping.
NO file output/attachment flags: it writes into the form and persists the record.
### FC_WRITE_FORM_RECORD_ATTRIBUTES
FC_WRITE_FORM_RECORD_ATTRIBUTES — Writes custom key-value SERVER attributes to the record (server-side only, read back via [%\$RECORD_ATTR.key%]). It does NOT write to a database table — when the user asks to write into a database/table/column, use FC_SQL_STATEMENT instead.
REQUIRED: the attribute key(s) and value(s) to write.
EXACT nodeParams: {"customAttributes":[{"name":"<key>","value":"<value>"},...],"writeAttributesToForm":<true|false>} — "customAttributes" IS the designer's "Modifications" table and the ONLY list the node reads. NEVER emit "attributes", "modifications", a bare {"attributeKey":...} or a bare name/value pair, and never leave the list empty when the user named an attribute ("das Serverattribut zzz auf xxx setzen" → {"customAttributes":[{"name":"zzz","value":"xxx"}]}); an empty list writes NOTHING.
READABLE/EMAIL ACCUMULATION (putting ALL rows of a repeatable container into an email body as readable lines): the per-row FC_WRITE_FORM_RECORD_ATTRIBUTES goes INSIDE the FC_FOR_EACH_LOOP's nodeParams._childNodes and its "value" MUST CONCATENATE the previous attribute so rows accumulate — value = "[%\$RECORD_ATTR.<key>%]" + this row's line, e.g. {"customAttributes":[{"name":"openingHours","value":"[%\$RECORD_ATTR.openingHours%][%selWeekday%]: [%tfFrom%] - [%tfTo%]\n"}]}. WITHOUT that [%\$RECORD_ATTR.<key>%] prefix every row OVERWRITES the attribute and only the LAST row remains; reference the completed [%\$RECORD_ATTR.<key>%] ONCE in the FC_EMAIL body after the loop.
LIST FC_WRITE_FORM_RECORD_ATTRIBUTES AND FC_FOR_EACH_LOOP IN need_workflow_node_details so you receive their exact schemas.
### FC_SQL_STATEMENT
FC_SQL_STATEMENT — Runs a SQL statement (INSERT/UPDATE/DELETE/SELECT) against a database connection; the ONLY node that writes to or reads from an external database table. USE whenever the user asks to write/save/persist form data into a database/table/column or to EXECUTE a database query.
CUSTOM (user gave explicit SQL) — when the user writes a CONCRETE SQL statement (e.g. "SELECT * FROM JOJO"), put it VERBATIM into "sql" and run it as a custom query (useClientDatabaseQuery=false → "Use configured database query" UNCHECKED, SQL in the "SQL-Query" field) EVEN IF configured queries exist. The user's explicit SQL always wins; never refuse it.
CONFIGURED (user named a query, no SQL text) — only when the user refers to a NAMED/pre-existing "DB query" by MEANING WITHOUT giving any SQL, set "query" to the EXACT name of one of the AVAILABLE CONFIGURED QUERIES (chosen by MEANING); the node runs it with useClientDatabaseQuery=true. Never invent the SQL text nor a query name not in the list.
CONNECTION — set "connection" to the available connection; when EXACTLY ONE connection is available use it WITHOUT asking (only ask which one when several fit).
QUOTING: NEVER wrap [%...%] placeholders in quotes in the SQL — VALUES ('[%tfTest%]') causes an error; always emit them unquoted: VALUES ([%tfTest%], ...). Only literal string constants that are NOT placeholders may be quoted.
For a REPEATABLE container, never hardcode a JSON literal with placeholders — you ALSO need FC_WRITE_FORM_RECORD_ATTRIBUTES (accumulate the JSON in a server attribute) and FC_FOR_EACH_LOOP (iterate the rows) BEFORE the single FC_SQL_STATEMENT. REQUEST those node details too (list them in need_workflow_node_details) so you get their exact parameters.
NESTING: the per-row append FC_WRITE_FORM_RECORD_ATTRIBUTES goes INSIDE the FC_FOR_EACH_LOOP's nodeParams._childNodes (runs once per row). The seed "[" (before the loop), the close "]" and this FC_SQL_STATEMENT (both after the loop) are chain nodes — NEVER put them inside _childNodes, and NEVER put the per-row append after the loop.
### FC_LDAP_QUERY
FC_LDAP_QUERY — Runs an LDAP query against a configured LDAP connection. USE whenever the user asks to EXECUTE an LDAP query/Abfrage.
CUSTOM (user gave explicit LDAP filter/query text) — when the user writes a CONCRETE LDAP filter/query (e.g. "soll die LDAP-Abfrage (uid=...) ausgeführt werden"), put it VERBATIM into "filter" (plus "baseDN" when given) and run it as a custom query (useClientLdapQuery=false → "Use configured LDAP query" UNCHECKED, text in the "query" field) EVEN IF configured LDAP queries exist. The user's explicit LDAP text always wins; never refuse it.
CONFIGURED (user named a query, no filter text) — only when the user refers to a NAMED/pre-existing "LDAP-Abfrage" by MEANING WITHOUT giving any filter text, set "query" to the EXACT name of one of the AVAILABLE CONFIGURED LDAP QUERIES (chosen by MEANING); the node runs it with useClientLdapQuery=true. Never invent the filter text nor a query name not in the list.
CONNECTION — set "connection" to the available connection; when EXACTLY ONE connection is available use it WITHOUT asking (only ask which one when several fit).
nodeParams (CUSTOM): {"connection":"<exact connection name>","filter":"<the exact LDAP filter text the user typed>","baseDN":"<base DN if given>"} — runs via useClientLdapQuery=false (text in the "query" field). Use this even when configured LDAP queries exist.
nodeParams (CONFIGURED): {"connection":"<exact connection name>","query":"<exact configured LDAP query name from the AVAILABLE CONFIGURED LDAP QUERIES list, chosen by meaning>"} — runs the configured query via useClientLdapQuery=true. Use the single available connection without asking; ask which connection only when several fit.
### FC_RETURN_FILE
FC_RETURN_FILE — Returns a file to the user's browser for download.
REQUIRED: the file source to return. Pick ONE File selection mode via a distinct key:
  - WORKFLOW-PRODUCED FILE (created by the PRECEDING node — XML/persistence export, decoded Base64, generated PDF …): chain FC_RETURN_FILE AFTER that node and set "sourceNode":"%prev%" (+ "fileName":"<same name>","forceDownload":true). This is the ONLY correct mode for runtime-generated files — never a form resource/upload field.
  - "fileName" = form RESOURCE by its stored filename (e.g. "xoxo.txt") → selects that form file.
  - "uploadField" = form UPLOAD FIELD by its technical ID (e.g. "upl1"; copy it character-for-character, as with FC_EMAIL "attachments"/FC_COMPRESS_AS_ZIP "files") → selects the upload field directly, NOT a filename search.
  - "searchFilename" = SEARCH attachments that already exist (record, inbox, chat …) by file name.
OPTIONAL "Type Filter" = the attachment's SOURCE, in any language; set "filter" when stated, else omit:
  - Inbox/postbox/Eingangspostfach → "filter":"INBOX"
  - Form upload / upload field → "filter":"FORM_UPLOAD"
  - Previous workflow node output → "filter":"WORKFLOW"
  - Chat message/conversation → "filter":"CHAT_MESSAGE"
  - Archived upload → "filter":"ARCHIVED_FORM_UPLOAD"
  - Preserved/original upload → "filter":"FORM_UPLOAD_PRESERVED_ORIGINAL"
  - REST API → "filter":"REST_API"
  E.g. "aus den Anhängen des Eingangspostfachs" → "searchFilename":"Jojo.jpg","filter":"INBOX".
Include only the one matching "File selection" key; leave the others out.
### FC_ENCODE_BASE64
FC_ENCODE_BASE64 — Encodes a file or form upload to Base64.
REQUIRED: the source file / upload field to encode.
### FC_DECODE_BASE64
FC_DECODE_BASE64 — Decodes a Base64-encoded file back to its original format.
REQUIRED: the source field containing the Base64 data.
### FC_PROCESS_LOG_PDF
FC_PROCESS_LOG_PDF — Generates a PDF from the current process log messages.
### FC_EXPORT_FORM_RECORD_CHATS
FC_EXPORT_FORM_RECORD_CHATS — Exports the form record chat/conversation as a PDF file.
### RemotePrintService
RemotePrintService — Renders the filled form itself as a PDF (form-to-PDF / print service). Use when the user wants the submitted/current form as a PDF (e.g. "die Anmeldung als PDF zusenden"). This is the CORRECT node for "form as PDF" — NOT FC_FILL_PDF. No PDF template needed; chain an FC_EMAIL after it to send the PDF.
### FC_FILL_PDF
FC_FILL_PDF — Fills an EXISTING PDF template from this form's file resources with form data. Required: the template file's EXACT name (see the PDF templates list); optional font via usedFont; attaching the result to the record ("dem Vorgang anhängen"/"attach it to the record") is the node param pdfFileProvision {"attachToFormRecord":true}.
NO field mapping is needed (the PDF's form fields are filled from same-named form fields). A named font goes verbatim into usedFont ("*embedWholeFonts*" embeds all) — never ask about it. Use ONLY for filling an existing PDF template, NOT for rendering the form itself as PDF (use RemotePrintService for that).
Attaching the result to the record is a PARAMETER of this node — never a second node and never a reason to replace an existing workflow lane.
### FC_FILL_WORD
FC_FILL_WORD — Fills an EXISTING Word (.docx) template from this form's file resources with form data. Required: the template file's EXACT name; no field mapping is needed.
NO field mapping is needed (the document's fields are filled from same-named form fields). Attaching the result to the record ("dem Vorgang anhängen"/"attach it to the record") is the node param wordFileProvision {"attachToFormRecord":true} — a PARAMETER of this node, never a second node and never a reason to replace an existing workflow lane.
### FC_COMPRESS_AS_ZIP
FC_COMPRESS_AS_ZIP — Compresses one or more files into a ZIP archive.
REQUIRED: the files to compress and the output archive name.
### FC_SAVE_TO_FILE_SYSTEM
FC_SAVE_TO_FILE_SYSTEM — Saves a file to the server's file system.
REQUIRED: the target directory/path on the server.
### FC_SAVE_TO_WEBDAV
FC_SAVE_TO_WEBDAV — Saves a file to a WebDAV server.
REQUIRED: the WebDAV connection and the target path.
### FC_COUNTER
FC_COUNTER — Increments, decrements, or resets a counter.
### FC_CHANGE_FORM_AVAILABILITY
FC_CHANGE_FORM_AVAILABILITY — Sets the form online or offline.
REQUIRED: online or offline (and which page/field scope when applicable).
### CodbiExtendedAccessor (com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.CodbiExtendedAccessorNodePlugin)
CodbiExtendedAccessor (com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin.CodbiExtendedAccessorNodePlugin) — Reads ONE form element and exposes its RAW value as a node RESULT (NO HTML escaping). USE when a rich-text/TinyMCE value must arrive RENDERED (a plain [%field%] in a mail body is HTML-escaped), or when one repetition (INDEX) or all repetitions (ALL) of a repeatable element must be read. nodeType IS "CodbiExtendedAccessor" (the registered name — NEVER the class name). Result placeholder: [%$<node name>.RESULT.value%].
REQUIRED: fieldName (the technicalId of the ONE element to read).
nodeParams: {"fieldName","repetitionMode":"CURRENT"|"INDEX"|"ALL","repetitionIndex","joinSeparator","includeMeta","sanitizeHtml","htmlToText","allowImages","allowLinks","allowTables","allowStyles"}. REQUEST the details for this node type.
### CreateRecordNodePlugin (de.xima.fc.plugin.fc_plugin_create_record.plugin.CreateRecordNodePlugin)
CreateRecordNodePlugin (de.xima.fc.plugin.fc_plugin_create_record.plugin.CreateRecordNodePlugin) — Creates a new form record (Vorgang) in another form.
REQUIRED: the target form and the field mapping.
### FC_SHOW_TEMPLATE
FC_SHOW_TEMPLATE — Renders an HTML template to the user.
REQUIRED: the HTML template to render.
USED FOR ABSCHLUSSSEITEN — the SUCCESS page of a submission goes here as the LAST node before the
endpoint (top-level "chainedNodes", or inside "_childNodes" after the main action); the FAILURE page
goes into the "_handlerChildNodes" of an FC_EXPERIMENT wrapping the main action.
When the user asks for "eine bestimmte"/"a certain"/"a specific" Abschlussseite or an ending page
WITHOUT naming one (any language), the clarification round MUST ask which one (offering the AVAILABLE
ABSCHLUSSSEITEN) — never pick one silently, never build without a page.
nodeParams: {"htmlTemplate":"<EXACT template/Abschlussseite name from the AVAILABLE list>"}.
### FC_DELETE_ATTACHMENT
FC_DELETE_ATTACHMENT — Deletes attachments of the CURRENT record; ONE property "attachmentsToDelete" selects them by FILE NAME (SEARCH), by UPLOAD FIELD, or by the producing node.
A NAME means SEARCH — judge by MEANING in any language ("den Anhang KOALA.JPG löschen", "Anhang/Datei mit dem Namen … entfernen", "delete/remove the attachment named …", "supprimer la pièce jointe …", "eliminare l'allegato …", "de bijlage … verwijderen", "eliminar el adjunto …"): nodeParams {"attachmentsToDelete":{"attachments":[{"type":"SEARCH"}],"searchFilenamePattern":"KOALA.JPG"}} — never pick an upload field and never create a field from the name.
A FIELD means UPLOAD ("die Datei im Feld Anhang", "das Uploadfeld X leeren", "delete what was uploaded in field X"): {"attachmentsToDelete":{"attachments":[{"type":"UPLOAD","identifier":"<upload field technicalId>"}]}}.
PATTERN: matched against the WHOLE stored file name incl. extension, case-SENSITIVE; "*" is the only wildcard and means one or more chars ("*.JPG", "KOALA*", "Anlage *.pdf"), everything else is literal (literal "*" = "\*"). Use the name exactly as the user wrote it — add no wildcards yourself.
"searchSourceTypes" is OPTIONAL and OMITTED for all sources; set it only when the user restricts the origin (["WORKFLOW"], ["FORM_UPLOAD"], ["INBOX"], …). "attachments" is required and needs at least one item. There is NO "attachments":["<field id>"], NO "fileName" and NO "attachmentName" key. The result exposes deletedAttachments/notDeletedAttachments; no match is NOT an error.
### FC_MOVE_FORM_RECORD_TO_INBOX
FC_MOVE_FORM_RECORD_TO_INBOX — Moves the form record to a specified inbox.
REQUIRED: the inbox name (or the instruction to search by name).
### FC_THROW_EXCEPTION
FC_THROW_EXCEPTION — Throws/causes a workflow error/exception (caught by FC_CATCH_ERROR in another lane).
### FC_EMPTY
FC_EMPTY — No-op placeholder node (NEVER use to represent an action).
### FC_BREAK
FC_BREAK — Breaks out of a loop (FC_WHILE_LOOP, FC_DO_UNTIL_LOOP, or FC_FOR_EACH_LOOP).
### FC_CONTINUE
FC_CONTINUE — Skips the rest of the current iteration and continues with the NEXT iteration of a loop.
### FC_SET_FORM_RECORD_PASSWORD
FC_SET_FORM_RECORD_PASSWORD — Sets (or CLEARS) the password of the CURRENT record (a HASH is stored on the record). The password only GATES access where a status has "allowFormPassword" (or "allowFormProcessPassword") enabled — enabling that flag on the status is part of the same task when the user wants the form protected.
USE THIS when the record shall be password-protected at runtime, judged by MEANING in any language ("das Formular mit einem Passwort sichern/schützen", "beim Klick ein Passwort setzen", "Passwort generieren", "Zugriff nur mit Passwort", "protect with a password", "generate a password", "protéger par mot de passe", "proteggere con password", "beveiligen met een wachtwoord", "proteger con contraseña").
MODE GENERATED (DEFAULT; the only correct mode for "secure it WITH a password"): {"targetType":"GENERATED_PASSWORD","generatedLength":12,"policyRuleAlphabetical":false,"policyRuleLowercase":true,"policyRuleUppercase":true,"policyRuleDigit":true,"policyRuleSymbol":true} — map the user's words to the rules (Sonderzeichen/special characters/symbols → policyRuleSymbol; Großbuchstaben/uppercase → policyRuleUppercase; Kleinbuchstaben/lowercase → policyRuleLowercase; Ziffern/Zahlen/digits → policyRuleDigit; Buchstaben/letters → policyRuleAlphabetical) and set ALL five flags explicitly, the unasked ones false. generatedLength 1…255 and ≥ the number of enabled rules (else PASSWORD_LENGTH_TOO_SHORT); default 12. The password is returned as the result values "password" and "passwordHtml".
MODE MANUAL ({"targetType":"MANUALLY_ENTERED_PASSWORD","inputPassword":"…"}) is ONLY for CLEARING (no "inputPassword") — a typed password value is never processed (PASSWORD SECURITY). NEVER invent or ask for a password value, and never model it as a form field / FC_CHANGE_FORM_VALUE / attribute / DB column.
### CheckTrustLevelPlugin (de.xima.fc.plugin.bs.auth.plugin.node.CheckTrustLevelPlugin)
CheckTrustLevelPlugin (de.xima.fc.plugin.bs.auth.plugin.node.CheckTrustLevelPlugin) — Checks the user's authentication trust level (CONDITIONAL branching node).
### AKDB E-Payment: Zahlung initialisieren (de.xima.akdb.epay.logic.plugin.node.PaymentInitPlugin)
AKDB E-Payment (de.xima.akdb.epay.logic.plugin.node.PaymentInitPlugin) — Initializes an AKDB ePayBL payment and redirects to the PayPage (use for "bezahlen", "Zahlung", "Gebühr bezahlen", "ePayment").
nodeType MUST be the EXACT class name "de.xima.akdb.epay.logic.plugin.node.PaymentInitPlugin" — NEVER the display label "AKDB E-Payment" (that creates an invalid node).
REQUIRED: the payment amount/item(s) and the payer data; paymentClient only when the prompt provides it.
nodeParams: {"paymentClient":{...},"customerData":{"firstname","lastname","email",...},"address":{"useAddress","zipCode","location","street","houseNumber","country"},"bankAccount":{"useBankAccount","bic","iban","owner"},"orderConfig":{"orderItemDefs":[{...}]},"dueDate","payPageBookingText","baseUrl","preventPayPageRedirect"}. REQUEST the details for this node type to get the exact sub-object schemas.
PAYMENT NOTIFICATION MATRIX: notifications are per RECIPIENT (client vs admin) × OUTCOME (success vs failure) × TRANSPORT (email/CMIS/DB/log/inbox). Client gets the RECEIPT on SUCCESS (FC_EMAIL in "_childNodes"); each other confirmed cell gets its own node — success nodes in "_childNodes", failure nodes in "_handlerChildNodes" (client failure, admin alert, and/or DB/record/log recording), possibly with different transports. Build ONLY confirmed cells; when NO failure notification was chosen, emit payment + confirmed success nodes WITHOUT a failure handler. Never two lanes for success/failure, never invent a recipient/transport, never create form fields for the addresses.
### AKDB BayernID Postkorb senden (de.xima.akdb.postbox.plugin.node.PostboxPlugin)
AKDB BayernID Postkorb (de.xima.akdb.postbox.plugin.node.PostboxPlugin) — Sends a message (with optional attachments) to the citizen's BayernID Postbox (use for "Postkorb", "Postfach", "BayernID Postkorb", "Bürgerpostfach"). NOT for regular e-mail (that is FC_EMAIL).
REQUIRED: the message subject/body and the recipient Postbox id (usually a [%…%] placeholder of the authenticated user's data).
nodeParams: {"message":{"subject","body"},"akdbClient":{"service","client"},"id","idFromFormRecordAttr","link","suffixBkData","trustLevelAccess","attachments"}. REQUEST the details for this node type to get the exact sub-object schemas.
### CMIS: Objekt anlegen/hochladen (de.xima.fc.fc_plugin_cmis.plugin.CmisActionPlugin)
CMIS: Objekt anlegen/hochladen (de.xima.fc.fc_plugin_cmis.plugin.CmisActionPlugin) — Creates/updates an object (document/folder) in a CMIS repository (use for "CMIS", "Alfresco", "DMS", "im CMIS ablegen").
REQUIRED: the CMIS connection and the file(s)/object to create.
nodeParams: {"connection","multiFile","objectName","objectType","objectTypeId","properties","folderPath","useExistingFolder","createUnfilingObject","addVersionNumber","activateVersioning","updateProperties","findObjectsById","useNoFileExtension","dateTimeFormat"}. REQUEST the details for this node type.
### CMIS: Query ausführen (de.xima.fc.fc_plugin_cmis.plugin.CmisQueryActionPlugin)
CMIS: Query ausführen (de.xima.fc.fc_plugin_cmis.plugin.CmisQueryActionPlugin) — Runs a CMISQL query against a CMIS repository (use to read/search documents in a CMIS/DMS).
REQUIRED: the CMIS connection and the CMISQL query.
nodeParams: {"connection","query","maxHits","includeAllVersions"}. REQUEST the details for this node type.
### RegiSafe: Dokument hochladen (de.xima.regisafe.plugin.node.UploadDocumentPlugin)
RegiSafe: Dokument hochladen (de.xima.regisafe.plugin.node.UploadDocumentPlugin) — Uploads files as a document into the RegiSafe DMS (use for "RegiSafe", "in RegiSafe archivieren").
REQUIRED: the file(s) to upload and (if named) the RegiSafe metadata; NEVER invent service credentials.
nodeParams: {"files","metadata","serviceConfig","documentId"}. REQUEST the details for this node type.
NOTE — Upload malware scanning (fc-plugin-malware-scanner-ms-def) runs AUTOMATICALLY on uploads when configured; it has NO workflow node to emit.
### FC_MULTIPLE_CONDITION
FC_MULTIPLE_CONDITION — Checks whether a form field value meets a condition (CONDITIONAL branching node).
REQUIRED: the field to check, the comparison and the value to compare against.
### FC_SWITCH
FC_SWITCH — Switches execution based on the value of a form field (switch/case, MULTI-BRANCH).
REQUIRED: the field to switch on and the case values/branches.
### FC_EXPERIMENT
FC_EXPERIMENT — Wraps an action with error handling (try-catch-finally pattern).
USED FOR ABSCHLUSSSEITEN — when a failure Abschlussseite is clarified, nodeType MUST be
FC_EXPERIMENT: "_childNodes" = [main action, then the SUCCESS page as FC_SHOW_TEMPLATE];
"_handlerChildNodes" = [the FAILURE page as FC_SHOW_TEMPLATE]. endpointState/endpointType stay at
the top level.
### FC_FOR_EACH_LOOP
FC_FOR_EACH_LOOP — Iterates over items and executes child nodes for each item.
REQUIRED: the item source to iterate over.
Build a JSON array ONLY when the user explicitly wants the rows stored/persisted as JSON (e.g. into a database field, CMIS, file, or form field). For HUMAN-READABLE content (e.g. an email body, a chat/message, a text display) accumulate READABLE LINES instead of JSON — one line per row (e.g. "Mo: 09:00 - 17:00") or a bulleted list. When the data comes from a REPEATABLE (dynamic) container and must be persisted as ONE combined value (e.g. a JSON array), use sourceType FORM_FIELD_REPETITIONS. The loop has no variable, so build the JSON by string-concatenation on a server attribute: FC_WRITE_FORM_RECORD_ATTRIBUTES seeds the key with "[" before the loop; INSIDE each iteration FC_WRITE_FORM_RECORD_ATTRIBUTES sets the value to the current [%\$RECORD_ATTR.<key>%] plus this row's object (e.g. [%\$RECORD_ATTR.<key>%],{...} — do NOT merely echo the current value back, each write appends one row); after the loop FC_WRITE_FORM_RECORD_ATTRIBUTES appends "]". Then store the accumulated [%\$RECORD_ATTR.<key>%] ONCE with the node matching the target the prompt names: a database/table/column → FC_SQL_STATEMENT; a CMIS node/document → the CMIS write node; a file → FC_CREATE_TEXT_FILE; a specific form field → FC_CHANGE_FORM_VALUE; no specific target named → the server attribute itself is the result.
CRITICAL NESTING: the per-iteration node (the per-row append) MUST be placed INSIDE the loop's nodeParams._childNodes as {"nodeType":"FC_WRITE_FORM_RECORD_ATTRIBUTES","nodeParams":{...}} — that is what makes it run ONCE PER ROW. NEVER place it in "chainedNodes" or as a node listed after the loop (such nodes run exactly ONCE, so the JSON would never grow). Only the post-loop nodes (close "]" and the single final write) go after the loop.
### FC_WHILE_LOOP
FC_WHILE_LOOP — Repeatedly executes child actions WHILE a form field value meets a condition (PRE-CHECK loop).
REQUIRED: the field to check, the comparison and the value.
### FC_DO_UNTIL_LOOP
FC_DO_UNTIL_LOOP — Executes child actions FIRST, then checks the condition (POST-CHECK loop).
REQUIRED: the field to check, the comparison and the value.
### FC_WITH_FORM_ELEMENT_CONTEXT
FC_WITH_FORM_ELEMENT_CONTEXT — Scoping node that wraps child actions and provides form element context.
