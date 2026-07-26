# CodBi General

Cross-cutting CodBi rules that apply to multiple categories.

## _codbiApplicability Report

When designing the form output, scan the CodBi Core Elements list at the end of this prompt.

Return the form JSON normally. Include a top-level "_codbiApplicability" field with these exact keys:
- formElementsProcessed: number of form elements processed
- codbiElementsEvaluated: number of CodBi elements evaluated
- considered: [{"id":"CodBi.ID","targets":["formElementId",...]}] — functionality IDs with form element ids they could apply to
- applied: [{"id":"CodBi.ID","targets":["formElementId",...]}] — standard configuration names ONLY (e.g., Holistic.Matomo.Tracking)
- skipped: [{"id":"CodBi.ID","targets":["formElementId",...],"reason":"..."}]

The server will handle functionality application in a second pass if candidates are found. This metadata field is removed server-side before the form is applied.
For each listed element, use your judgment to decide if a functionality is useful for a field or if it applies standalone (no field needed). Consider BOTH whether it could benefit AND whether it would be inappropriate.

## Critial — Form Chatbot Plugin vs CodBi AI Chat

When the prompt says "XIMA Chatbot", "XIMA Chat-Assistent", or similar, use the Form Chatbot Plugin — NOT ai.llama.chat. This plugin adds form-level properties ("ChatbotEnabled":"true" at the FORM root), NOT individual elements.

The CodBi "ai.llama.chat" widget (which creates explicit XContainer, XTextArea, XButtonList, XCheckbox elements) is a DIFFERENT feature — use it only when "CodBi KI-Chat" or "CodBi Chat" is explicitly mentioned.

## CRITICAL — XAppointment appointmentPlan

When the prompt says "Terminfinder für X" (e.g., "Terminfinder für ddd"), you MUST add the property "appointmentPlan":"X" to the XAppointment element's properties. The backend auto-resolves the plan name to the UUID. NEVER omit appointmentPlan when the prompt names a specific schedule.

## CRITICAL — Bürger-Services/BundID fields

All tfAntragsteller* fields are autofilled by the authentication system. Do NOT add data-cb-func (no OpenPLZ.Autocomplete, no ldap.autocomplete) to these fields — the Bürger-Services plugin itself maps the authentication response data. HOWEVER, CSS classes for client-side formatting/validation (CodBi_People_Name, CodBi_People_Mail, CodBi_People_Phone, CodBi_People_PLZ, CodBi_People_BuildingNumber) SHOULD still be applied — they are purely formatting and do NOT interfere with authentication autofill.

## CRITICAL — Common Validation Rules

Common Validation Rules (fc-plugin-common-validation-rules) are NOT CodBi functionalities. Do NOT add them as data-cb-func. These are validation-only plugins applied via data-vdt attribute — they validate input, they do NOT provide CodBi EP/functionality features. If an element already has a data-vdt attribute, leave it. Never add data-cb-func for a validation rule plugin class name.

## DOCUMENT PATTERNS (for attached images)

These rules override the default mapping for SPECIFIC matching elements only:

### a) FILE UPLOAD OVERRIDE
When a checkbox label explicitly states that a specific named file or document IS being physically attached or WILL be uploaded as a file attachment, do NOT generate an XCheckbox. Instead generate an XUpload field.

### b) YES/NO CHOICE
A JA/NEIN or Ja/Nein checkbox pair, radio group, or tick-box group → XSelect with options [{"text":"JA","value":"JA"},{"text":"NEIN","value":"NEIN"}].

### c) SIGNATURE OVERRIDE
Whenever a signature area, signature line, or closing salutation appears anywhere in the document, generate an XSignature element.

### d) DOCUMENT HEADER
When the attached document has a header with an organization name, update the form's existing XHeader item.

### e) GROUPED SUB-FIELDS
When a field label specifies more than one individual data point, create an XFieldSet with one XTextField per sub-item.

## Multiple Pages (from attached images)

When multiple images are attached, each image is EXACTLY one document page. Create one XPage per image/page. Page 1 uses the existing 'p1' XPage; for each additional page create a new XPage (names 'p2', 'p3', ...). Every page MUST be non-empty.

On all non-final pages add a 'Weiter' XButtonList. On all non-first pages add a 'Zurück' XButtonList. Put the final 'Absenden' submit button on the last page.

## CodBi CANDIDATE REVIEW

Examples: a begin/end time pair → Time.Frame; a begin/end date pair → Date.Frame; text field needing format validation → HTML.Input.REGEX; German address flow → OpenPLZ.Autocomplete; container/navigation bar → Form.Navigator; input auto-capitalize words → HTML.Input.Trans.Capital; set CSS property on element → HTML.SETAttribute; console output → Sys.Log.Console.

CRITICAL — Sys.Log.Console is a STANDALONE functionality that does NOT need any existing form element. When the prompt asks to output/print/log/show anything to the browser console, ALWAYS include Sys.Log.Console in the considered/applied arrays.

## AI on Formcycle Server — Benefits

- Lean Compliance: Simpler DSGVO and EU AI Act handling.
- Infrastructure Efficiency: No second OS to patch, monitor, or license.
- Maximum Performance: Zero network latency.
- Simplified Security: No internal API ports to open or protect.
- Unified Maintenance: Single-point backups, all logs centralized.
