# Formcycle Workflow Nodes

Output format: Output EITHER a single JSON object (for ONE workflow lane) OR an array of JSON objects (for MULTIPLE lanes).

Single lane: {"taskName":"...","taskDescription":"...","triggerType":"...","triggerParams":{},"nodeType":"...","nodeParams":{},"endpointState":"...","endpointType":"..."}
Multiple lanes: [{"taskName":"...",...},{"taskName":"...",...}]

Each object has exactly these keys: taskName, taskDescription, triggerType, triggerParams, nodeType, nodeParams, endpointState, endpointType.

CRITICAL — taskName is MANDATORY for EVERY node type. Always set a short, meaningful AND SPECIFIC description. Include key details like the target URL (without http://), template name, parameter names/values, email subject, file name, or HTTP endpoint. taskName CHARACTER RESTRICTIONS — only letters (a-z, A-Z), numbers (0-9), spaces, hyphens (-), underscores (_), and parentheses () are allowed.

CRITICAL — Use an array ONLY when the user's request describes MULTIPLE INDEPENDENT workflows triggered by DIFFERENT events. Do NOT use an array for setting a form record status — the status transition (endpointState) is automatically added as the bottommost node of EVERY lane.

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
- CRITICAL — You MUST set 'applicableStateNames' to the state(s) to watch.
- triggerParams: {"applicableStateNames":["StateName1"],"durationDays":<N>,"durationHours":<N>,"durationMinutes":<N>}

### FC_TIME_POINT
Fires at a specific date/time. Has TWO modes:
- Mode 1 — FIXED: fires at a fixed calendar date/time. fixedDateTime MUST include both the date AND time in ISO-8601 format WITH timezone offset. triggerParams: {"timePointType":"FIXED","fixedDateTime":"<ISO-8601 with offset>","fireWhenInPast":<true|false>}
- Mode 2 — EXPRESSION_WITH_FORMAT: fires at a date/time computed from a form field value, optionally with an offset. Use when the user says "X days after field Y". triggerParams: {"timePointType":"EXPRESSION_WITH_FORMAT","dateTimeTemplate":"[%technicalId%]","dateTimeFormat":"<pattern>","operation":"PLUS|MINUS","offsetDuration":"<number>","durationUnit":"DAYS|HOURS|MINUTES|SECONDS|WEEKS|MONTHS|YEARS","fireWhenInPast":<true|false>}

### FC_FORM_RECORD_MESSAGE_POSTED
Fires when an internal message is posted to the record.
- triggerParams: {"senderContext":["INTERNAL","EXTERNAL"]} (optional filter)

### FC_FORM_RECORD_MESSAGE_UPLOAD_REQUEST_FULFILLED
Fires when a file upload request submitted via internal message is fulfilled.
- triggerParams: {}

### FC_CATCH_ERROR
Fires when an error occurs in another workflow lane. Configurable filters: nodeName, nodeNameMatchType, nodeType, nodeTypeMatchType, errorCode, errorCodeMatchType.

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
- triggerParams: {}

## Node Types

### FC_EMAIL
Sends an email.
- nodeParams: {"to":"<address or [%fieldname%]>","subject":"<subject>","body":"<body text or HTML>","from":"<sender address>","senderName":"<sender display name>","attachments":["<technicalId1>",...] (optional)}

### FC_DOI_INIT
Sends a double opt-in invitation email with DOI confirmation link. This is the CORRECT node type for double opt-in invitations, NOT FC_EMAIL.
- CRITICAL — The email BODY MUST include the verification link as HTML: <a href="[%\$FORM_VERIFY_LINK%]">E-Mail-Adresse bestätigen</a>
- nodeParams: {"to":"<recipient>","subject":"<subject>","body":"<HTML body>","from":"<sender>","senderName":"<sender name>","failurePage":"<Abschlussseite name>"}

### FC_CHANGE_STATE
Changes the form record state.
- nodeParams: {"stateName":"<FORMCYCLE status name>"}

### FC_POST_REQUEST
Sends an HTTP request (webhook, REST API call).
- Required: "url":"<target URL>"
- Optional: method (POST|GET|PUT|DELETE|PATCH), body, contentType (JSON|PLAIN_TEXT|XML|FORM_DATA), headers, sendAllFormValues, allowInvalidCertificates, asResponsePage, treat4xxAsNormal, treat5xxAsNormal, useBasicAuth, connectTimeoutSeconds, readTimeoutMinutes

### FC_CHANGE_FORM_VALUE
Sets the value of one or more form fields.
- nodeParams: {"formValues":[{"name":"<technicalId>","value":"<new value>"},...]}

### FC_LOG_ENTRY
Writes a log message to the process log.
- nodeParams: {"message":"<log text>","level":"INFO|WARNING|ERROR"}

### FC_REDIRECT
Redirects the user's browser to a URL. Has TWO mutually exclusive modes:
- Mode 1 — Manual URL: {"url":"<target URL>"}
- Mode 2 — URL template: {"urlTemplate":"<name of URL template>"}
- Optional: "queryParams":[{"name":"F2","value":"YOLO"},...]

### FC_RETURN
Simply ends/terminates the workflow process without changing the form record state.
- nodeParams: {}
- Sets endpointType to "FC_RETURN" and endpointState to "" (empty string).

### FC_SET_SAVED_FLAG
Marks the form record as saved.
- nodeParams: {}

### FC_DELETE_FORM_RECORD
Permanently deletes the current form record.
- nodeParams: {}

### FC_QUEUE_TASK
Queues an event/task for execution. Terminal node — no endpoint state needed.
- nodeParams: {"eventName":"<event/trigger name>"}

### FC_SEND_FORM_RECORD_MESSAGE
Sends an internal message to the record's inbox.
- nodeParams: {"message":"<text>","senderName":"<sender>","subject":"<subject>","recipientType":"INITIAL_SUBMITTER|LATEST_SUBMITTER|EMAIL|INBOX_ID","recipientEmail":"<email>","recipientInboxId":"<inbox ID>","recipientMessageService":"<portal name>","attachments":["<technicalId1>",...]}

### FC_CHANGE_FORM_RECORD_CHAT_ACTIVENESS
Opens or closes a form record chat.
- nodeParams: {"changeType":"OPEN|CLOSE","recipientType":"...","recipientEmail":"...","recipientInboxId":"...","recipientMessageService":"..."}

### FC_CREATE_TEXT_FILE
Creates a text/JSON/XML/HTML file as an attachment.
- nodeParams: {"fileName":"<filename>","fileContent":"<content>","contentType":"PLAIN_TEXT|JSON|XML|HTML"}

### FC_WRITE_FORM_RECORD_ATTRIBUTES
Writes custom key-value attributes to the record.
- CRITICAL — If attribute names match form field technical IDs, set "writeAttributesToForm":true.
- nodeParams: {"attributes":[{"name":"<key>","value":"<value>"},...],"writeAttributesToForm":<true|false>}

### FC_RETURN_FILE
Returns a file to the user's browser for download.
- nodeParams: {"fileName":"<filename>","forceDownload":<true|false>,"deleteFileAfterDownload":<true|false>}

### FC_ENCODE_BASE64
Encodes a file or form upload to Base64.
- nodeParams: {"file":"<filename from form resources>"}

### FC_DECODE_BASE64
Decodes a Base64-encoded file back to its original format.
- nodeParams: {"base64":"<base64 content>","exportName":"<output filename>"}

### FC_PROCESS_LOG_PDF
Generates a PDF from the current process log messages.
- nodeParams: {"fileName":"<output PDF filename>"}

### FC_EXPORT_FORM_RECORD_CHATS
Exports the form record chat/conversation as a PDF file.
- nodeParams: {"fileName":"<output PDF filename>","attachToFormRecord":<true|false>}

### FC_FILL_PDF
Fills a PDF template with form data.
- nodeParams: {"file":"<template filename>","exportName":"<output filename>","flatten":<true|false>}

### FC_FILL_WORD
Fills a Word template with form data.
- nodeParams: {"file":"<template filename>","exportName":"<output filename>"}

### FC_COMPRESS_AS_ZIP
Compresses one or more files into a ZIP archive.
- nodeParams: {"compressedFileName":"<output ZIP filename>","files":["<upload field technical ID>"]}

### FC_SAVE_TO_FILE_SYSTEM
Saves a file to the server's file system.
- nodeParams: {"exportDirectory":"<target path>","files":["<upload field technical ID>"]}

### FC_SAVE_TO_WEBDAV
Saves a file to a WebDAV server.
- nodeParams: {"path":"<target path>","files":["<upload field technical ID>"]}

### FC_COUNTER
Increments or decrements a counter.
- nodeParams: {"counterName":"<name>","action":"COUNT_UP|COUNT_DOWN|COUNT_RESET","step":"<step size>"}

### FC_CHANGE_FORM_AVAILABILITY
Sets the form online or offline.
- nodeParams: {"changeType":"SET_ONLINE|SET_OFFLINE"}

### CreateRecordNodePlugin (de.xima.fc.plugin.fc_plugin_create_record.plugin.CreateRecordNodePlugin)
Creates a new form record in another form.
- nodeParams: {"projectName":"<target form>","stateName":"<target state>","elementsToCopy":[...],"copyAll":<true|false>,"files":[...]}

### FC_SHOW_TEMPLATE
Renders an HTML template to the user.
- nodeParams: {"htmlTemplate":"<name of HTML template>"}

### FC_DELETE_ATTACHMENT
Deletes attachments from specified upload fields.
- nodeParams: {"attachments":["<upload field technical ID>"]}

### FC_MOVE_FORM_RECORD_TO_INBOX
Moves the form record to a specified inbox.
- nodeParams: {"inboxName":"<inbox name>","targetType":"STATIC_INBOX|COMPUTED_INBOX_NAME"}

### FC_THROW_EXCEPTION
Throws/causes a workflow error/exception.
- nodeParams: {"errorMessage":"<message>","errorType":"<code>","errorData":"<optional JSON>"}

### FC_EMPTY
No-op placeholder node.
- nodeParams: {}

### FC_BREAK
Breaks out of a loop (FC_WHILE_LOOP, FC_DO_UNTIL_LOOP, or FC_FOR_EACH_LOOP).
- nodeParams: {} (breaks nearest enclosing parent loop)
- Optional: {"breakTarget":"<uuid of the target loop node>"} or {"breakTarget":"\$ROOT"} (outermost/parent loop)

### FC_CONTINUE
Skips the rest of the current iteration and continues with the NEXT iteration of a loop.
- nodeParams: {} (continues nearest enclosing parent loop)
- Optional: {"continueTarget":"<uuid>"} or {"continueTarget":"\$ROOT"}

### FC_SET_FORM_RECORD_PASSWORD
Sets a password on the form record.
- Mode 1 — Fixed: {"targetType":"MANUALLY_ENTERED_PASSWORD","inputPassword":"<the password>"}
- Mode 2 — Generated: {"targetType":"GENERATED_PASSWORD","generatedLength":10,"policyRuleLowercase":true,"policyRuleUppercase":true,"policyRuleDigit":true,"policyRuleSymbol":true,"policyRuleAlphabetical":false}

### CheckTrustLevelPlugin (de.xima.fc.plugin.bs.authn.plugin.node.CheckTrustLevelPlugin)
Checks the user's authentication trust level. This is a CONDITIONAL branching node.
- nodeParams: {"trustLevel":"USER_LOGIN|LOW|CERTIFICATE|EPA|UNKNOWN"}
- May include "_childNodes" array with child action nodes on the YES branch.

### FC_MULTIPLE_CONDITION
Checks whether a form field value meets a specified condition. CONDITIONAL branching node.
- Single condition: {"fieldTechnicalId":"<id>","comparator":"EQUAL|NOT_EQUAL|EMPTY|...","compareValue":"<value>","labelYes":"...","labelNo":"...","_childNodes":[...]}
- Multiple conditions: {"combinationType":"AND|OR|CUSTOM","conditions":[...],"customExpression":"(C1 OR C2) AND C3","_childNodes":[...]}

### FC_SWITCH
Switches execution based on the value of a form field, similar to a switch/case statement. MULTI-BRANCH conditional node.
- nodeParams: {"switchValue":"[%technicalId%]","_cases":[{"caseValues":["A"],"_childNodes":[...]}],"_defaultChildNodes":[...]}

### FC_EXPERIMENT
Wraps an action with error handling (try-catch-finally pattern).
- nodeParams: {"_childNodes":[...try...],"_handlerChildNodes":[...catch...],"_finalizerChildNodes":[...finally...]}

### FC_FOR_EACH_LOOP
Iterates over items and executes child nodes for each item.
- nodeParams: {"fieldTechnicalId":"<id>","_childNodes":[...]}
- Source types: FORM_FIELD_REPETITIONS, FIELD_VALUES, FILES, ATTACHMENTS, JSON_VALUE, CHARACTER_SEPARATED_VALUES

### FC_WHILE_LOOP
Repeatedly executes child actions WHILE a form field value meets a specified condition. PRE-CHECK loop.
- nodeParams: {"fieldTechnicalId":"<id>","comparator":"EQUAL|...","compareValue":"<value>","_childNodes":[...]}

### FC_DO_UNTIL_LOOP
Executes child actions FIRST, then checks whether a form field value continues to meet a specified condition. POST-CHECK loop.
- Same nodeParams schema as FC_WHILE_LOOP. The only difference is WHEN the condition is evaluated.

### FC_WITH_FORM_ELEMENT_CONTEXT
Scoping node that wraps child actions and provides context about which form elements are in scope.
- nodeParams: {"fieldValues":[{"name":"<techId>","value":"<val>"},...],"repetitions":[{"name":"<techId>","value":"<index>"},...],"_childNodes":[...]}

## Endpoint State

Every workflow lane automatically ends with an endpoint (Endpunkt). The 'endpointState' field specifies the FORMCYCLE status name. DEFAULT: "Received". EXCEPTION: When nodeType is FC_DELETE_FORM_RECORD, FC_QUEUE_TASK, or FC_RETURN, set endpointState to "".

ENDPOINT TYPE: DEFAULT: "FC_CHANGE_STATE". ALTERNATIVE: "FC_RETURN" (ends workflow without state change).

STATE PROPERTIES (optional): externalAccessPermitted, allowAccessToApplicant, allowAccessAllParticipants, allowAccessToAnonymousApplicant, allowAuthenticatedUser, formRecordDeletable, useSystemAuthentication.
