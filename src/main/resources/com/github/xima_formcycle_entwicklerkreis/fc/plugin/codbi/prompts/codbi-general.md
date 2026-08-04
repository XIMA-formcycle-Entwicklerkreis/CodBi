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
- codbiVerdict: ALWAYS include exactly one of these values:
  - "none" — you evaluated the CodBi elements and NONE is applicable to this form.
  - "candidates" — at least one CodBi element could apply (listed in considered).
  - "applied" — you applied one or more CodBi elements.

The server will handle functionality application in a second pass if candidates are found. This metadata field is removed server-side before the form is applied.
For each listed element, use your judgment to decide if a functionality is useful for a field or if it applies standalone (no field needed). Consider BOTH whether it could benefit AND whether it would be inappropriate.

## CodBi / Widget DETAILS REQUEST

You initially receive a CONDENSED reference: the CodBi Core Elements list (names + purposes) and the FORMCYCLE Widgets list (names + purposes), NOT the full JSON structures. When you need the exact JSON template / properties of any CodBi element or formcycle widget before you can implement the request, STOP and return ONLY this JSON (nothing else, no prose):

```json
{"status":"need_codbi_details","elements":["CodBi.ID", ...],"widgets":["XWidget", ...]}
```

- "elements" — list EVERY CodBi functionality ID whose full parameter/TSDoc details you need (from the condensed Core Elements list).
- "widgets" — list EVERY FORMCYCLE widget className (e.g. "XTextField", "XContainer", "XPage") whose detailed JSON structure you need. Include every widget you plan to create, including containers and pages.
- Do not guess or invent property names/structure. The server provides the exact details for exactly the requested items, then you continue with the full form JSON.
- Omit a field when you need nothing from it; if you need neither, return the normal form JSON instead of a details request.

## Critial — Form Chatbot Plugin vs CodBi AI Chat

When the prompt says "XIMA Chatbot", "XIMA Chat-Assistent", or similar, use the Form Chatbot Plugin — NOT ai.llama.chat. This plugin adds form-level properties ("ChatbotEnabled":"true" at the FORM root), NOT individual elements.

The CodBi "ai.llama.chat" widget (which creates explicit XContainer, XTextArea, XButtonList, XCheckbox elements) is a DIFFERENT feature — use it only when "CodBi KI-Chat" or "CodBi Chat" is explicitly mentioned.

## CRITICAL — XAppointment appointmentPlan

When the prompt says "Terminfinder für X" (e.g., "Terminfinder für ddd"), you MUST add the property "appointmentPlan":"X" to the XAppointment element's properties. The backend auto-resolves the plan name to the UUID. NEVER omit appointmentPlan when the prompt names a specific schedule.

## CRITICAL — Bürger-Services/BundID fields

All tfAntragsteller* fields are autofilled by the authentication system. Do NOT add data-cb-func (no OpenPLZ.Autocomplete, no ldap.autocomplete) to these fields — the Bürger-Services plugin itself maps the authentication response data. HOWEVER, CSS classes for client-side formatting/validation (CodBi_People_Name, CodBi_People_Mail, CodBi_People_Phone, CodBi_People_PLZ, CodBi_People_BuildingNumber) SHOULD still be applied — they are purely formatting and do NOT interfere with authentication autofill.

## CRITICAL — Common Validation Rules

Common Validation Rules (fc-plugin-common-validation-rules) are NOT CodBi functionalities. Do NOT add them as data-cb-func. These are validation-only plugins applied via data-vdt attribute — they validate input, they do NOT provide CodBi EP/functionality features. If an element already has a data-vdt attribute, leave it. Never add data-cb-func for a validation rule plugin class name.

## CRITICAL — Combining multiple CodBi functionalities on one element

When MORE THAN ONE CodBi functionality applies to the SAME element, put ALL of them in ONE `data-cb-func` value, comma-separated (e.g. `data-cb-func="HTML.Input.REGEX,HTML.SETAttribute"`), and set each functionality's parameters as separate `data-cb-*` attributes. Do NOT create several data-cb-func entries and do NOT create a duplicate element per functionality.

Example — one input field that blocks the characters e, $ and % AND gets its title attribute set:
"attributes": [
  {"text":"data-cb-func","value":"HTML.Input.REGEX,HTML.SETAttribute"},
  {"text":"data-cb-keyexpression","value":"[^e$%]"},
  {"text":"data-cb-expression","value":"^[^e$%]*$"},
  {"text":"data-cb-name","value":"title"},
  {"text":"data-cb-toset","value":"Holla die Waldfee"}
]

## CodBi CANDIDATE REVIEW

Examples: a begin/end time pair → Time.Frame; a begin/end date pair → Date.Frame; text field needing format validation → HTML.Input.REGEX; an input field that must NOT allow certain characters (character blacklist, e.g. "nicht erlaubt: e$%") → HTML.Input.REGEX; German address flow → OpenPLZ.Autocomplete; container/navigation bar → Form.Navigator; input auto-capitalize words → HTML.Input.Trans.Capital; set an attribute / visual style of an element (e.g. title, opacity) → HTML.SETAttribute; console output → Sys.Log.Console. When one request combines several of these on the same element, apply ALL matching functionalities in one comma-separated data-cb-func.

CRITICAL — Sys.Log.Console is a STANDALONE functionality that does NOT need any existing form element. When the prompt asks to output/print/log/show anything to the browser console, ALWAYS include Sys.Log.Console in the considered/applied arrays.
