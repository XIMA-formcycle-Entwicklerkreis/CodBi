# Formcycle Workflow Nodes (Compact)

Condensed reference: the FORMCYCLE workflow triggers and node types and what each is for. You receive ONLY this list initially. Before you emit the final workflow task JSON you MUST request the exact triggerParams/nodeParams details for every trigger and node type you intend to use by returning a details request with a "nodes" array (and optionally "triggers") listing ALL the names you need — the server then provides the exact JSON schemas for exactly those. List every trigger and node you plan to use (including condition/loop/container nodes) so none is missing.

Output format: Output EITHER a single JSON object (for ONE workflow lane) OR an array of JSON objects (for MULTIPLE independent lanes). Each object has exactly these keys: taskName, taskDescription, triggerType, triggerParams, nodeType, nodeParams, endpointState, endpointType.

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
FC_TIME_POINT — Fires at a specific date/time (fixed date or computed from a form field value).
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
### FC_DOI_INIT
FC_DOI_INIT — Sends a double opt-in invitation email with DOI confirmation link (CORRECT for DOI, not FC_EMAIL).
REQUIRED: completion page (Abschlussseite) for success AND for failure, sender address, subject, recipient.
### FC_CHANGE_STATE
FC_CHANGE_STATE — Changes the form record state.
REQUIRED: the target state (status) the record should be set to.
### FC_POST_REQUEST
FC_POST_REQUEST — Sends an HTTP request (webhook, REST API call).
REQUIRED: URL and HTTP method (GET/POST/PUT/DELETE/...). Ask for them when not provided.
### FC_CHANGE_FORM_VALUE
FC_CHANGE_FORM_VALUE — Sets the value of one or more form fields.
REQUIRED: which field(s) (technicalId) and the value(s) to set.
### FC_LOG_ENTRY
FC_LOG_ENTRY — Writes a log message to the process log.
### FC_REDIRECT
FC_REDIRECT — Redirects the user's browser to a URL (manual URL or URL template).
REQUIRED: the target URL or the URL template to use.
### FC_RETURN
FC_RETURN — Simply ends/terminates the workflow process without changing the form record state.
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
FC_CREATE_TEXT_FILE — Creates a text/JSON/XML/HTML file as an attachment.
REQUIRED: file name and the content to write.
### FC_WRITE_FORM_RECORD_ATTRIBUTES
FC_WRITE_FORM_RECORD_ATTRIBUTES — Writes custom key-value SERVER attributes to the record (server-side only, read back via [%\$RECORD_ATTR.key%]). It does NOT write to a database table — when the user asks to write into a database/table/column, use FC_SQL_STATEMENT instead.
REQUIRED: the attribute key(s) and value(s) to write.
### FC_SQL_STATEMENT
FC_SQL_STATEMENT — Runs a SQL statement (INSERT/UPDATE/DELETE/SELECT) against a database connection; the ONLY node that writes to or reads from an external database table. USE whenever the user asks to write/save/persist form data into a database/table/column.
REQUIRED: the database connection/datasource and the SQL text (with [%fieldName%] placeholders).
For a REPEATABLE container, never hardcode a JSON literal with placeholders — you ALSO need FC_WRITE_FORM_RECORD_ATTRIBUTES (accumulate the JSON in a server attribute) and FC_FOR_EACH_LOOP (iterate the rows) BEFORE the single FC_SQL_STATEMENT. REQUEST those node details too (list them in need_workflow_node_details) so you get their exact parameters.
NESTING: the per-row append FC_WRITE_FORM_RECORD_ATTRIBUTES goes INSIDE the FC_FOR_EACH_LOOP's nodeParams._childNodes (runs once per row). The seed "[" (before the loop), the close "]" and this FC_SQL_STATEMENT (both after the loop) are chain nodes — NEVER put them inside _childNodes, and NEVER put the per-row append after the loop.
### FC_RETURN_FILE
FC_RETURN_FILE — Returns a file to the user's browser for download.
REQUIRED: the file source to return.
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
FC_FILL_PDF — Fills a PDF template with form data at runtime.
REQUIRED: the PDF template to fill ("Details für die PDF-Befüllung > Datei" — the template file must be set) and the field/value mapping. Use ONLY for filling an existing PDF template, NOT for rendering the form itself as PDF (use RemotePrintService for that).
### FC_FILL_WORD
FC_FILL_WORD — Fills a Word template with form data.
REQUIRED: the Word template to fill and the field/value mapping.
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
### CreateRecordNodePlugin (de.xima.fc.plugin.fc_plugin_create_record.plugin.CreateRecordNodePlugin)
CreateRecordNodePlugin (de.xima.fc.plugin.fc_plugin_create_record.plugin.CreateRecordNodePlugin) — Creates a new form record (Vorgang) in another form.
REQUIRED: the target form and the field mapping.
### FC_SHOW_TEMPLATE
FC_SHOW_TEMPLATE — Renders an HTML template to the user.
REQUIRED: the HTML template to render.
### FC_DELETE_ATTACHMENT
FC_DELETE_ATTACHMENT — Deletes attachments from the specified upload fields.
REQUIRED: the upload field(s) whose attachments should be deleted.
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
FC_SET_FORM_RECORD_PASSWORD — Sets a password on the form record (fixed or generated).
REQUIRED: the password value or the generation rule.
### CheckTrustLevelPlugin (de.xima.fc.plugin.bs.authn.plugin.node.CheckTrustLevelPlugin)
CheckTrustLevelPlugin (de.xima.fc.plugin.bs.authn.plugin.node.CheckTrustLevelPlugin) — Checks the user's authentication trust level (CONDITIONAL branching node).
### FC_MULTIPLE_CONDITION
FC_MULTIPLE_CONDITION — Checks whether a form field value meets a condition (CONDITIONAL branching node).
REQUIRED: the field to check, the comparison and the value to compare against.
### FC_SWITCH
FC_SWITCH — Switches execution based on the value of a form field (switch/case, MULTI-BRANCH).
REQUIRED: the field to switch on and the case values/branches.
### FC_EXPERIMENT
FC_EXPERIMENT — Wraps an action with error handling (try-catch-finally pattern).
### FC_FOR_EACH_LOOP
FC_FOR_EACH_LOOP — Iterates over items and executes child nodes for each item.
REQUIRED: the item source to iterate over.
When the data comes from a REPEATABLE (dynamic) container and must be persisted as ONE combined value (e.g. a JSON array), use sourceType FORM_FIELD_REPETITIONS. The loop has no variable, so build the JSON by string-concatenation on a server attribute: FC_WRITE_FORM_RECORD_ATTRIBUTES seeds the key with "[" before the loop; INSIDE each iteration FC_WRITE_FORM_RECORD_ATTRIBUTES sets the value to the current [%\$RECORD_ATTR.<key>%] plus this row's object (e.g. [%\$RECORD_ATTR.<key>%],{...} — do NOT merely echo the current value back, each write appends one row); after the loop FC_WRITE_FORM_RECORD_ATTRIBUTES appends "]". Then store the accumulated [%\$RECORD_ATTR.<key>%] ONCE with the node matching the target the prompt names: a database/table/column → FC_SQL_STATEMENT; a CMIS node/document → the CMIS write node; a file → FC_CREATE_TEXT_FILE; a specific form field → FC_CHANGE_FORM_VALUE; no specific target named → the server attribute itself is the result.
CRITICAL NESTING: the per-iteration node (the per-row append) MUST be placed INSIDE the loop's nodeParams._childNodes as {"nodeType":"FC_WRITE_FORM_RECORD_ATTRIBUTES","nodeParams":{...}} — that is what makes it run ONCE PER ROW. NEVER place it in "chainedNodes" or as a node listed after the loop (such nodes run exactly ONCE, so the JSON would never grow). Only the post-loop nodes (close "]" and the single final write) go after the loop.
### FC_WHILE_LOOP
FC_WHILE_LOOP — Repeatedly executes child actions WHILE a form field value meets a condition (PRE-CHECK loop).
REQUIRED: the field to check, the comparison and the value.
### FC_DO_UNTIL_LOOP
FC_DO_UNTIL_LOOP — Executes child actions FIRST, then checks the condition (POST-CHECK loop).
REQUIRED: the field to check, the comparison and the value.
### FC_WITH_FORM_ELEMENT_CONTEXT
FC_WITH_FORM_ELEMENT_CONTEXT — Scoping node that wraps child actions and provides form element context.
