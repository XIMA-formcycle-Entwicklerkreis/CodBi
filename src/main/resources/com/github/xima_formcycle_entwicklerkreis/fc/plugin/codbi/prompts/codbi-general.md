# CodBi General

Cross-cutting CodBi rules that apply to multiple categories.

## CSS Classes vs data-cb-func (TWO-OPTION RULE)

For EVERY field you create or modify, apply CodBi behavior with EXACTLY ONE of two options:

- OPTION A — a CSS class for the field's purpose is listed in the CodBi Core Elements list (the "Standard Configurations" CSS classes, e.g. CodBi_People_Name, CodBi_OpenPLZ_AC_SET_PLZ) → use it. Add the class name to the element's properties as `"cssclasses":["CodBi_..."]` (e.g. `"cssclasses":["CodBi_OpenPLZ_AC_SET_PLZ"]`).
- OPTION B — no matching CSS class exists → use data-cb-func (e.g. Form.Navigator has NO CSS class → data-cb-func=form.navigator).

CRITICAL:
- NEVER invent CSS class names. If a class is not in the reference list, it does NOT exist — use data-cb-func instead.
- Apply AT MOST ONE CSS class per field — do NOT stack multiple classes on the same element.
- Only apply a CSS class when it EXACTLY matches the field's purpose. If no class matches, use data-cb-func.
- ADDRESS GROUPS (postal code, locality/city, street, building number) MUST be tagged with the OpenPLZ classes: CodBi_OpenPLZ_AC_SET_PLZ on the postal code field, CodBi_OpenPLZ_AC_SET_Locality on the locality/city field, CodBi_OpenPLZ_AC_SET_Street on the street field, CodBi_OpenPLZ_AC_SET_BuildingNumber on the building number field — the server then configures OpenPLZ.Autocomplete automatically.

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

## CRITICAL — Element Placeholders (EPs) are VALUES, never JSON

An Element Placeholder (EP) — built-in (from the Element Placeholders reference list) OR custom (defined in the local API doc manager) — is invoked by writing the PLACEHOLDER ITSELF as the value of a `data-cb-*` attribute (e.g. `data-cb-Data`), in the form:

`{ EPName > Param1 ; Param2 ; ... }`

CRITICAL:
- The EP placeholder IS the value. It is NOT a description of what to build, and you must NEVER expand it into a hand-written JSON object/array.
- WRONG: `data-cb-Data="{"planet":"Pluto","saturation":0.5}"` — this builds a JSON object manually and bypasses the EP entirely.
- CORRECT: `data-cb-Data="{ data.join > Param1 ; Param2 }"` — the first token inside the braces is the EP's NAME. `data.join` is ONLY an example — ANY EP id works (built-in like AI.LLAMA.STD.QA, OpenPLZ.Localities, or any custom EP defined in the local API doc manager). The pattern is always `{ <any EP id> > Param1 ; Param2 ; ... }`, then >, then the parameters. The placeholder tells CodBi to invoke that EP, which produces the data at runtime.
- NEVER invent or rename an EP id. Use EXACTLY the id under which the EP is defined (e.g. a custom EP named `gustav` must be invoked as `{ gustav > ... }` — do NOT rename it to something descriptive like `{ LogPlanet > ... }`).
- Match each parameter to the EP's declared parameters in order. Only the parameters the EP declares may be used (name-to-parameter mapping, not your own invented JSON keys).
- When a prompt asks you to log/show/output data that a known EP provides (built-in or custom), ALWAYS use the EP placeholder as the value — never construct the equivalent JSON yourself.

## CRITICAL — Standard Configurations are CSS classes, never data-cb-func

A Standard Configuration (system-defined or custom/defined in the local API doc manager) is applied by adding its CSS class(es) to the target element's `cssclasses` array (e.g. `"cssclasses":["RegularShine"]`). The standard configuration's NAME is NOT a functionality and must NEVER be used as `data-cb-func`.

- WRONG: `data-cb-func="yes.spider"` — the name of a standard configuration is not a functionality.
- CORRECT: add the standard configuration's CSS classes (e.g. `RegularShine`, `UltraShine_X`) to the element's `cssclasses`.
- When a standard configuration defines MULTIPLE CSS classes with different purposes (e.g. `RegularShine` for plain "shiny" and `UltraShine_X` for "ultra shiny"), pick the class whose purpose matches the requested intensity for EACH element — do NOT apply the same class to all elements when the prompt requests different levels. E.g. a "shiny" field gets `RegularShine`, an "ultra shiny" field gets `UltraShine_X`.
- The classes of a standard configuration are listed in its section with a "(Standard Configuration)" marker.

## CRITICAL — Global Variables of Standard Configurations

A Standard Configuration (system or custom, defined in the local API doc manager) may declare **global variables** (its `globals`). These are form-level variables, NOT element attributes.

- When the user prompt sets a value for a global variable declared by a standard configuration (e.g. the `USGrade` global of the `yes.spider` standard), the value must be written into the form's TOP-LEVEL `variables` array, as an object:
  `{ "name": "USGrade", "aliasname": "USGrade", "serveronly": false, "value": "1000" }`
- `name` is the exact global-variable name from the standard configuration. `aliasname` is usually identical to `name`. `serveronly` is `false` for user-facing variables. `value` is the value the user requested.
- NEVER store a global variable as a `data-cb-*` attribute on an element, and NEVER as `data-cb-func`.
- Preserve all pre-existing entries in the `variables` array that the user did not change; only add or update the entry whose `name` matches the requested global variable.

## CodBi CANDIDATE REVIEW

Examples: a begin/end time pair → Time.Frame; a begin/end date pair → Date.Frame; text field needing format validation → HTML.Input.REGEX; an input field that must NOT allow certain characters (character blacklist, e.g. "nicht erlaubt: e$%") → HTML.Input.REGEX; a multi-line text field that should be a rich text / WYSIWYG editor (e.g. "write a story with a rich text editor") → HTML.Input.TinyMCE; German address flow → OpenPLZ.Autocomplete; container/navigation bar → Form.Navigator; input auto-capitalize words → HTML.Input.Trans.Capital; set an attribute / visual style of an element (e.g. title, opacity) → HTML.SETAttribute; console output → Sys.Log.Console. When one request combines several of these on the same element, apply ALL matching functionalities in one comma-separated data-cb-func.

CRITICAL — Sys.Log.Console is a STANDALONE functionality that does NOT need any existing form element. When the prompt asks to output/print/log/show anything to the browser console, ALWAYS include Sys.Log.Console in the considered/applied arrays AND create a NEW **invisible XSpan** (the plain-text/HTML element of Formcycle — NEVER invent class names like "XText" or "XButton"; XTextField is an INPUT element, not plain text; the log output "XItem missing 'XText' using XDefault" proves invented names do NOT render) at the top of the first page. List it as a separate item in the root "items" array with EXACTLY this shape:

```
{
  "className": "XSpan",
  "properties": {
    "name": "spLog<Name>",
    "id": "xi-log-<name>",
    "rtevalue": "<short label>",
    "invisible": "1"
  },
  "attributes": [
    { "text": "data-cb-func", "value": "Sys.Log.Console" },
    { "text": "data-cb-Data", "value": "SYS.Log.Console > <what shall be logged>" }
  ]
}
```

Also add the element's name to the first page's "elements" array. Set data-cb-func="Sys.Log.Console" on it and set data-cb-Data to a string that starts with the literal prefix **"SYS.Log.Console > "** followed by the text describing what shall be logged — e.g. "SYS.Log.Console > Log the details of the planet Pluto with a saturation of .5". Do NOT use an element-placeholder expression as the whole data-cb-Data value.
