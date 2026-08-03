# Formcycle General

Cross-cutting Formcycle rules that apply across widgets and workflow nodes.

## Form Structure Rules

- The 'items' array is FLAT at the top level — all form elements live here, including containers, fieldsets, and their children. Each item's unique identifier is stored in 'properties.name' (NOT as a top-level 'name' field — items have no top-level 'name'). Containers and fieldsets reference their children via 'properties.elements', a sub-array of child name strings (NOT the items themselves).
- When ADDING new items: append them to the top-level 'items' array AND add their name to the 'properties.elements' array of the target container/fieldset.
- MANDATORY for containers/fieldsets: When creating a section/group that CONTAINS specific input fields, you MUST create ALL child input items in the same response. Do NOT output a container with an empty 'elements':[] when asked for content inside it. Each child item must appear both in the top-level 'items' array AND by name in the container's 'elements'.
- Assign unique, descriptive values to new items' 'properties.name'. Use type-appropriate prefixes: 'tf' for XTextField/XTextArea, 'fd' for XUpload, 'sel' for XSelect, 'cb' for XCheckbox, 'btn' for XButtonList buttons, 'sig' for XSignature, 'div' for XContainerInvisible.
- MANDATORY — EVERY generated element MUST have a unique 'id' property. The 'id' is the HTML/DOM element identifier and must be unique within the form. Convention: use the prefix 'xi-' followed by the element name (e.g., name="tfVorname" → id="xi-tf-Vorname"). Do NOT reuse 'id' values.
- MANDATORY — Every generated element's 'label' (and every XFieldSet's 'legend') MUST be a MEANINGFUL, descriptive, human-readable text that names the field's purpose, written in the SAME language as the user's request (e.g. "Straße", "Postleitzahl", "Ort", "Land" for an address form). NEVER use generic placeholders such as "Label", "Example", "Text", "Field" or "Eingabefeld" — the label is what the end user reads, so it must describe the field.
- CRITICAL — The 'elements' array of containers/fieldsets/pages uses 'name' values, NOT 'id' values. Example: element with name="tfVorname" and id="xi-tf-vorname" → add "tfVorname" (the name) to the container's elements array, NOT "xi-tf-vorname" (the id).
- PRESERVE every existing item exactly as-is unless the instruction explicitly targets it. Do NOT remove, rename, or reorder existing items.
- Do NOT include 'css', 'script', 'image', 'images', 'pagePreview', 'rendered', 'formI18n', or 'metadata' fields — they are handled separately and will be merged back. Also do NOT include any XFooter item in the items array.
- Output ONLY valid JSON. No trailing commas. No comments.

## Conditional Visibility (hiddenif) and Locking (readonlyif)

These control when a field is hidden or locked based on another field's value. Set these as DIRECT properties on the element (NOT inside the attributes array). Formcycle uses the component's ID to reference the controlling field.

- For a SIMPLE checkbox-controlled condition (hide/lock when checkbox is CHECKED): set hiddenif="<checkboxID>" (the checkbox's properties.id value) with hiddenifcomp=0 and hiddenifclear="false". The same applies to readonlyif: set readonlyif="<checkboxID>" with readonlyifcomp=0 and readonlyifclear="1".
- For VALUE-BASED conditions on other fields, also set hiddenifcomp (comparison mode) and hiddenifvalue (comparison value):
  - hiddenifcomp=1, hiddenifvalue="<placeholder>" — hide when the controlling field is NOT EMPTY (has any value).
  - hiddenifcomp=2, hiddenifvalue="<exactValue>" — hide when controlling field's value EQUALS this string.
  - hiddenifcomp=3, hiddenifvalue="<regex>" — hide when controlling field's value MATCHES the regex pattern.
  - hiddenifcomp=4, hiddenifvalue="<number>" — hide when controlling field's value is LESS THAN this number.
  - hiddenifcomp=5, hiddenifvalue="<number>" — hide when controlling field's value is GREATER THAN this number.
  - hiddenifcomp=6, hiddenifvalue="<min>-<max>" — hide when controlling field's value is WITHIN this range.
  - hiddenifcomp=7, hiddenifvalue="<value>" — hide when controlling field's value is NOT EQUAL to this.
  - hiddenifcomp=8, hiddenifvalue="<regex>" — hide when controlling field's value does NOT MATCH the regex.
- hiddenifclear controls what happens to the field's value when hidden: "false" or 0 = preserve value, "1" = clear value, "2" = disable but keep value.
- The SAME modes apply to readonlyif (gesperrt wenn): readonlyifcomp values 0-8 work identically to hiddenifcomp.
- CRITICAL: The hiddenif (and readonlyif) value must be the EXACT properties.id of the controlling component.

## CONTAINER FOR CONDITIONALLY SHOWN FIELDS

When the prompt describes a field that should be shown or hidden based on a condition (wenn...dann..., if...then...), wrap that field in an XContainer. The container becomes the target of the conditional functionality — do NOT apply show/hide directly on the form field itself. You MUST create BOTH the container AND the child field as separate items in the top-level 'items' array, AND reference the child by name in the container's 'elements' array.

EXCEPTION — BundID fsBKAllDaten: When the prompt asks to show/hide BundID/Bürger-Services fields based on any condition, do NOT create a new container. The existing XFieldSet named 'fsBKAllDaten' is already the container for all BundID fields. Instead, add the show/hide properties ('hiddenif', 'hiddenifcomp', 'hiddenifvalue') directly to the fsBKAllDaten element.

## REPEATABLE CONTAINERS

To make an XContainer or XContainerInvisible repeatable (add dynamic rows), set "dynamic":"1" in its properties. Also set "dynamicMinSize" (min rows, default 1), "dynamicMaxSize" (max rows, default 10), "dynamicAddText" (add button label), "dynamicDeleteText" (delete button label) as needed.

## Server Variables (Placeholders)

AVAILABLE SERVER VARIABLES (system placeholders — use [%\$NAME%] syntax):

FORM RECORD:
- [%\$PROCESS_ID%] or [%\$PROZESS_ID%] — form record process ID (string)
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
- [%\$PROJECT_ID%] or [%\$PROJEKT_ID%] — project ID
- [%\$PROJECT_ALIAS%] — project alias
- [%\$PROJECT_NAME%] — project name
- [%\$PROJECT_TITLE%] — project title
- [%\$PROJECT_DESCRIPTION%] — project description

CLIENT:
- [%\$MANDANT_ID%] or [%\$CLIENT_ID%] — client/mandant ID
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
- [%\$FORM_PROCESS_LINK%] or [%\$FORM_PROZESS_LINK%] — link to the process view
- [%\$FORM_INVITE_LINK%] — invitation link
- [%\$FORM_VERIFY_LINK%] — DOI email verification link
- [%\$FORM_VERIFY_PAGE_LINK%] — DOI verification page link
- [%\$FORM_INBOX_LINK%] — link to the form inbox
- [%\$FORM_INBOX_NAME%] — form inbox name
- [%\$FORM_PROCESS_HTML%] — process protocol as HTML
- [%\$PORTAL_LINK%] — user portal link
- [%\$PORTAL_FORM_RECORDS_LINK%] — portal form records link

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

## FORMCYCLE output rules for form element identifiers

FORM ELEMENTS entries have: 'technicalId' (always), 'displayText' (visible label/text), 'type' (e.g. XTextField, BUTTON), and optionally: 'required' (boolean), 'placeholder', 'options' (for XSelect), 'actionPage' (for BUTTON).

'technicalId' is an ARBITRARY internal database key. 'displayText' is what the user sees. The user's prompt refers to 'displayText'. Find the matching element, then copy its 'technicalId' EXACTLY. NEVER use a 'displayText' value in the output. NEVER guess or invent a technicalId.

Elements with type 'BUTTON' are individual clickable buttons. For triggerParams.buttonName always use the 'technicalId' of the individual BUTTON whose 'displayText' matches — never use a container's id.
