# Formcycle General

Cross-cutting Formcycle rules that apply across widgets and workflow nodes.

## Form Structure Rules

- The 'items' array is FLAT at the top level — all form elements live here, including containers, fieldsets, and their children. Each item's unique identifier is stored in 'properties.name' (NOT as a top-level 'name' field — items have no top-level 'name'). Containers and fieldsets reference their children via 'properties.elements', a sub-array of child name strings (NOT the items themselves).
- When ADDING new items: append them to the top-level 'items' array AND add their name to the 'properties.elements' array of the target container/fieldset. EXCEPTION — a newly created INTRO/DESCRIPTION element that the user asks to place "at the beginning" / "before the first element" / "ganz am Anfang" / "vor dem ersten Element" MUST be INSERTED at POSITION 0 of the target container's/page's 'elements' array (so it renders first), not appended at the end; every OTHER existing element keeps its relative order — only the new intro element is inserted at the front.
- MANDATORY for containers/fieldsets: When creating a section/group that CONTAINS specific input fields, you MUST create ALL child input items in the same response. Do NOT output a container with an empty 'elements':[] when asked for content inside it. Each child item must appear both in the top-level 'items' array AND by name in the container's 'elements'.
- Assign unique, descriptive values to new items' 'properties.name'. Use type-appropriate prefixes: 'tf' for XTextField/XTextArea, 'fd' for XUpload, 'sel' for XSelect, 'cb' for XCheckbox, 'btn' for XButtonList buttons, 'sig' for XSignature, 'div' for XContainerInvisible.
- MANDATORY — EVERY generated element MUST have a unique 'id' property. The 'id' is the HTML/DOM element identifier and must be unique within the form. Convention: use the prefix 'xi-' followed by the element name (e.g., name="tfVorname" → id="xi-tf-Vorname"). Do NOT reuse 'id' values.
- MANDATORY — Every generated element's 'label' (and every XFieldSet's 'legend') MUST be a MEANINGFUL, descriptive, human-readable text that names the field's purpose, written in the SAME language as the user's request (e.g. "Straße", "Postleitzahl", "Ort", "Land" for an address form). NEVER use generic placeholders such as "Label", "Example", "Text", "Field" or "Eingabefeld" — the label is what the end user reads, so it must describe the field.
- CRITICAL — The 'elements' array of containers/fieldsets/pages uses 'name' values, NOT 'id' values. Example: element with name="tfVorname" and id="xi-tf-vorname" → add "tfVorname" (the name) to the container's elements array, NOT "xi-tf-vorname" (the id).
- PRESERVE every existing item exactly as-is unless the instruction explicitly targets it. Do NOT remove, rename, or reorder existing items.
- CRITICAL — When you MODIFY an existing container/fieldset/page (e.g. add a CSS class or a functionality to a fieldset), you MUST keep its 'properties.elements' array (the child name strings) EXACTLY as it was — never remove, empty, or reorder it, and never drop the child items from the 'items' array. Only the targeted properties (e.g. cssclasses, attributes) change; the children stay put. SOLE EXCEPTION — when the user asks you to ADD a new INTRO/DESCRIPTION element "at the beginning / before the first element / ganz am Anfang / vor dem ersten Element" of a specific container/page/fieldset, INSERT that ONE new element's name at POSITION 0 of that container's/page's 'elements' array (and keep every other child in its existing relative order). Do NOT reorder anything else; this is the only case where a new element is placed before existing ones.
- REMOVAL — When the user's request EXPLICITLY asks to REMOVE/DELETE existing elements (fields, buttons, containers, ...), do BOTH so the server honors the removal and does not restore the element: (1) remove the element from the top-level 'items' array AND from every container's 'properties.elements' array, and (2) list its 'properties.name' in a top-level '_removedItems' array of your output JSON (e.g. "_removedItems": ["tfOrt"]). An element removed WITHOUT being listed in '_removedItems' is treated as an accidental drop and the server may restore it.
- REMOVE-ALL — When the user asks to remove/delete ALL content — "remove all widgets/fields/buttons", "delete all fields", "empty the form", "delete all elements", "delete everything", "Lösche alle Elemente", "Lösche alle Widgets", "Entferne alle Felder", "alles entfernen", "rimuovi tutto" (in ANY language) — KEEP the first page (XPage), the header (XHeader) and the footer (XFooter) as EMPTY structural shells (their 'elements' cleared to []), remove ALL other content (fields, buttons, containers, fieldsets), list every removed element in '_removedItems', AND emit the top-level marker "_removeAll": true in your output JSON. The server strips "_removeAll" and uses it to delete the orphaned workflow paths. NEVER drop the page/header/footer.
- Do NOT include 'css', 'script', 'image', 'images', 'pagePreview', 'rendered', 'formI18n', or 'metadata' fields — they are handled separately and will be merged back. Also do NOT include any XFooter item in the items array.
- Output ONLY valid JSON. No trailing commas. No comments.
- The output is FORM JSON ONLY — NEVER generate JavaScript/code blocks. The form JSON has no 'script' field and you cannot inject custom JS. When a request needs custom JavaScript (e.g. syncing a map widget's drawn geometry to a field, or any client-side logic), do NOT fabricate a script and do NOT explain how to write one — configure what the form JSON can express (widgets, properties, classes) and simply state that the required script must be added manually.
- The current form's existing elements are ALWAYS provided to you (the form data — all pages/containers/items with their `name`s). NEVER ask the user whether a referenced field/container already exists (e.g. "Existieren die Felder tfVorname/tfNachname bereits?" / "bereits vorhanden oder neu anlegen?") — determine it from the provided form: if the `name` is in the items, it EXISTS (reuse/modify it); if it is NOT, CREATE it as requested (e.g. as a hidden field), without asking. This applies to every field, container and DataQuery referenced by name (tfVorname, tfNachname, fdDatei, HolaQuery, …). Only ask when the request is ambiguous about WHICH element is meant (e.g. two fields with similar names) — never about existence.

## Button Actions (XButtonList)

action.page is a FORMCYCLE keyword, NOT a page name: "" (none/custom), "next" (next page), "previous" (previous page), a page name (navigate to it), or a submit command ("submit", "submitNoCheck", "submitSave", "submitSaveNoCheck", "submitPreview", "submitPreviewWindowed").

action.check=true validates the CURRENT page's fields before the action runs; action.check=false skips validation. A "next" / 'Weiter' button MUST use check=true ("next page + check") whenever the current page contains a field that can be invalid — a required field, a datatype-validated field, or a field tagged with a CodBi functionality/class (CSS class starting with "CodBi_", e.g. CodBi_People_Name, or a data-cb-func attribute). Only use check=false when the page has no such field. Submit buttons (page="submit") ALWAYS use check=true.

## Conditional Visibility (hiddenif) and Locking (readonlyif)

These control when a field is hidden or locked based on another field's value. Set these as DIRECT properties on the element (NOT inside the attributes array). Formcycle uses the component's ID to reference the controlling field.

- hiddenif = the EXACT properties.id of the controlling component (e.g. the checkbox's id).
- hiddenifcomp = the Formcycle condition code (enum de.xima.fc.form.common.statics.EConditionType). The field is hidden when the condition is met:
  - 0 = MANDATORY — hidden when the controlling field HAS a value (e.g. a checkbox is CHECKED).
  - 1 = EQUAL — hidden when the controlling field's value EQUALS hiddenifvalue.
  - 2 = NOT_EQUAL — hidden when the controlling field's value is NOT EQUAL to hiddenifvalue.
  - 3 = REGEX — hidden when the controlling field's value MATCHES the hiddenifvalue regex.
  - 4 = LESS_THAN — hidden when the controlling field's value is LESS THAN hiddenifvalue (number).
  - 5 = GREATER_THAN — hidden when the controlling field's value is GREATER THAN hiddenifvalue (number).
  - 6 = BETWEEN — hidden when the controlling field's value is WITHIN the hiddenifvalue range (<min>-<max>).
  - 7 = LESS_OR_EQUAL — hidden when the controlling field's value is <= hiddenifvalue.
  - 8 = GREATER_OR_EQUAL — hidden when the controlling field's value is >= hiddenifvalue.
  - 9 = EMPTY — hidden when the controlling field has NO value (is empty). For a checkbox: hidden while the checkbox is UNCHECKED, shown once it is CHECKED.
- hiddenifvalue = the comparison value used by EQUAL/NOT_EQUAL/REGEX and the numeric codes.
- hiddenifclear controls what happens to the field's value when hidden: "false" or 0 = preserve value, "1" = clear value, "2" = disable but keep value.
- The SAME codes apply to readonlyif (gesperrt wenn): readonlyifcomp works identically to hiddenifcomp.
- CRITICAL: The hiddenif (and readonlyif) value must be the EXACT properties.id of the controlling component.
- CRITICAL — OPTION-GATED FIELDS ("nur erscheint, wenn '<Option>' gewählt ist" / "only appears when '<option>' is selected", e.g. an upload next to "An Mitarbeiter ohne Intranetzugang senden?" that only shows when "Ja" is chosen): apply the condition DIRECTLY ON THE FIELD ITSELF (hiddenifcomp="2" NOT_EQUAL with hiddenifvalue=<the option's exact value>, e.g. hiddenifcomp="2", hiddenifvalue="yes", hiddenif=<the controlling XSelect's properties.id>) — you do NOT need to create a wrapping container for this. Only when a wrapping container already exists (or is required/requested for other reasons, see CONTAINER FOR CONDITIONALLY SHOWN FIELDS below) does the condition go on that CONTAINER instead; do NOT invent a new container just to hold the condition. This is the ONLY single hiddenif constraint that covers BOTH possible non-visible states at once, because `hiddenif` carries exactly ONE comparison value and an XSelect can be in THREE states: the chosen option ("yes"), the opposite option ("no"), or EMPTY (nothing selected — an XSelect CAN have an initial `value` preset in the form data, but need not; when none is set it starts empty). "value != yes" is TRUE for both empty and "no", so NOT_EQUAL to the CHOSEN option hides the element in every state except the chosen one. NEVER hide via hiddenifcomp="1" (EQUAL) with hiddenifvalue=<the OPPOSITE option> (e.g. "no") — that hides only the "no" state and leaves the field VISIBLE while nothing is selected (empty is a separate state, NOT the value "no"), violating "only appears when 'yes' is selected". NEVER use hiddenifcomp="0" (MANDATORY, hidden when the field HAS any value) — it hides the field even when "Ja"/"yes" IS chosen. NEVER use hiddenifcomp="9" (EMPTY) alone — it hides only the empty state, not the opposite option. The chosen option's value comes from the FORM ELEMENTS list (the option's `value`, e.g. {text:"Ja", value:"Ja"} or {text:"Ja", value:"yes"}); check whether the controlling XSelect itself has an initial `value` in the form data — but regardless, the NOT_EQUAL-to-chosen constraint is correct.

## CONTAINER FOR CONDITIONALLY SHOWN FIELDS

When the prompt describes a field that should be shown or hidden based on a condition (wenn...dann..., if...then...), you MAY apply the show/hide condition directly on the field itself (hiddenif / hiddenifcomp / hiddenifvalue as direct properties) — a wrapping container is NOT required for the condition to work. Only when a container ALREADY exists around the field (pre-existing in the form, or explicitly created/requested for other layout reasons) does the container become the target of the conditional functionality — in that case put the hiddenif properties ON THE CONTAINER, not on the inner field, because the empty container would otherwise remain visible and the hidden field would still leave a visible gap. Do NOT invent a new container purely to hold a show/hide condition when the prompt did not ask for one.

EXCEPTION — BundID fsBKAllDaten: When the prompt asks to show/hide BundID/Bürger-Services fields based on any condition, do NOT create a new container. The existing XFieldSet named 'fsBKAllDaten' is already the container for all BundID fields. Instead, add the show/hide properties ('hiddenif', 'hiddenifcomp', 'hiddenifvalue') directly to the fsBKAllDaten element.

## REPEATABLE CONTAINERS

To make a field group repeatable (the user can add/duplicate rows via a '+' button - in ANY language), wrap the fields in an XContainer or XContainerInvisible with "dynamic":"1" (REQUIRED — this is what makes the container repeatable; without it the container is NOT repeatable) plus "dynamicMinSize" (min rows, default 1), "dynamicMaxSize" (max rows, default 10), "dynamicAddText" (the '+' button label, e.g. '+ Thema hinzufügen'), "dynamicDeleteText" (delete button label). The container is itself an item in the root 'items' array; its 'elements' array lists the inner field names; the page's 'elements' array references ONLY the container's name (do NOT list the inner fields directly on the page). CRITICAL - Do NOT add ANY extra element (button, text, span or label such as 'Thema hinzufügen') inside the container to represent the add action: the dynamic container renders its own add/delete buttons via dynamicAddText/dynamicDeleteText. A missing dynamic:"1" or a manual add-button without a dynamic container is WRONG.

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
- [%\$FORM_PROCESS_LINK%] — link to the process view
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
