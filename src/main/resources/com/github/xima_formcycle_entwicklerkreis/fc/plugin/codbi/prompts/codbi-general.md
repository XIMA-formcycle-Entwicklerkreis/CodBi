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
- If the request wants German autocomplete for street / house number ("PLZ/Ort/Straße/Hausnummer sollen sich ... befüllen" / "ZIP/city/street/house number ... autofill") but the requested field list does not contain street / house-number fields, CREATE them in the address group's fieldset and tag them with the OpenPLZ classes: `tfStrasse` (label "Straße") + `CodBi_OpenPLZ_AC_SET_Street` and `tfHausnummer` (label "Hausnummer") + `CodBi_OpenPLZ_AC_SET_BuildingNumber`. Never skip the street / house-number parts just because the master-data field list omitted them — missing any address part is a FAIL.

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

## CRITICAL — Use the user's clarification answers VERBATIM

When the user answered a clarification question, those answers are the FINAL VALUES — use them EXACTLY in the form. Do NOT substitute your own defaults or earlier placeholder values:
- An XSelect options list the user provided (e.g. "Ansbach und Nürnberg") → put those EXACT options into the select's options array.
- An appointmentPlan / Terminplan the user named (e.g. "Gonzo") → appointmentPlan gets exactly that value, NOT the widget's label or a generic name.
- A minimum date the user chose (e.g. "morgen") → encode exactly that (data-cb-minimum=1, data-cb-unit=d, data-cb-reverse=true).
- A completion page / email sender / subject the user named → use exactly those values.
Only when the user answered "du entscheidest" / "you decide" may you choose a sensible default; whenever the user gave a concrete answer, honor it verbatim.

## CRITICAL — Birth-date fields (Geburtsdatum / birth date)

A birth-date field (labels "Geburtsdatum", "Geburtstag", "birth date", "date of birth", "birthday") ALWAYS lies in the PAST. NEVER apply to it:
- a FUTURE `Date.Min` (`data-cb-reverse=true`, "heute"/"morgen") — never ask "Mindestdatum heute oder morgen?" for a birth-date field;
- `Date.NoWeekends` or any weekend-restriction class (there is NO `CodBi_NoWeekends` class — never invent it).

A constraint like "keine Vergangenheitsdaten"/"no past dates"/"no future dates" on a birth date means **NO FUTURE DATES** → apply ONLY the `CodBi_NoFutureDate` class (max = today; **the current date itself is a VALID value** — a person born today is a valid birth date). Do NOT add `Date.Min` and do NOT add any weekend restriction. A `Date.Min` on a birth date is valid ONLY as a PAST minimum (e.g. "mindestens 18 Jahre" → `data-cb-minimum=18, unit=y`, no `reverse`) and only when an age limit is requested.

## CRITICAL — Print removal / hiding data when printing (Print.Remove)

Distinguish the two cases:

1. INTERACTIVE / CONTROL ELEMENTS (navigation/submit buttons, e.g. XButtonList "Weiter"/"Senden"/"Zurück", and any button that only works on screen): hiding them from the printed output is the sensible DEFAULT — they are useless on paper. Apply `CodBi_Print_Remove_PrintOnly` (or `data-cb-func="Print.Remove"` / `CodBi_Print_Remove_Tagged`) to such buttons/controls. This is NOT "hiding sensitive data".

2. USER DATA / SENSITIVE FIELDS (birth place, address, personal data): NEVER hide them from prints proactively and NEVER offer to hide them — a field being personal/sensitive is NOT a reason to remove it from the print output. Only hide a data field when the user EXPLICITLY asks for it (e.g. "das Feld X soll beim Drucken ausgeblendet werden" / "field X should be hidden when printing").

The CSS class is the STANDARD for print removal — use the CodBi_Print_Remove_* classes for the normal cases:
- `CodBi_Print_Remove_Tagged` — removes exactly the tagged element (the default for "beim Drucken ausblenden" on a single field).
- `CodBi_Print_Remove_Parent` — removes the ENTIRE parent container/section from the print.
- `CodBi_Print_Remove_PrintOnly` — for print-only elements (e.g. buttons/controls that only work on screen).

Use `data-cb-func="Print.Remove"` ONLY for the special case where the prompt specifies a parameter for the functionality — e.g. `DocumentSelector` (a dot-prefixed CSS-class selector of the section/container to remove, such as `.divPrintSection`) or `ParentalLevel` (how many ancestors to climb up to). Print.Remove is NOT normalized server-side — the AI's choice (class vs. functionality) reaches the designer unchanged. A verification check that finds the class (or the functionality with its parameter) on the requested field counts as applied.

## Critial — Form Chatbot Plugin vs CodBi AI Chat

When the prompt says "XIMA Chatbot", "XIMA Chat-Assistent", or similar, use the Form Chatbot Plugin — NOT ai.llama.chat. This plugin adds form-level properties ("ChatbotEnabled":"true" at the FORM root), NOT individual elements.

The CodBi "ai.llama.chat" widget (which creates explicit XContainer, XTextArea, XButtonList, XCheckbox elements) is a DIFFERENT feature — use it only when "CodBi KI-Chat" or "CodBi Chat" is explicitly mentioned.

## CRITICAL — XAppointment appointmentPlan

When the prompt says "Terminfinder für X" (e.g., "Terminfinder für ddd"), you MUST add the property "appointmentPlan":"X" to the XAppointment element's properties. The backend auto-resolves the plan name to the UUID. NEVER omit appointmentPlan when the prompt names a specific schedule.

## CRITICAL — Bürger-Services/BundID fields

All tfAntragsteller* fields are autofilled by the authentication system. Do NOT add data-cb-func (no OpenPLZ.Autocomplete, no ldap.autocomplete) to these fields — the Bürger-Services plugin itself maps the authentication response data. HOWEVER, CSS classes for client-side formatting/validation (CodBi_People_Name, CodBi_People_Mail, CodBi_People_Phone, CodBi_People_PLZ, CodBi_People_BuildingNumber) SHOULD still be applied — they are purely formatting and do NOT interfere with authentication autofill.

## CRITICAL — BundID/Bürgerkonto login + ID upload + captcha bundle

When the request asks for a BundID/Bürgerkonto login button together with an upload field for an ID/image and captcha protection (e.g. "BundID-Login-Button, ... Upload-Feld für den Personalausweis mit Bild-Cropper und Captcha-Schutz"), you MUST create ALL of these — missing any one is a FAIL:
- XBsLogin (className="XBsLogin") with the `bs_auth_ref` property for the BundID/Bürgerkonto login button.
- The XUpload field for the ID card/image WITH `data-cb-func="Media.Image.Cropper"` (or a `CodBi_Fotocropper_*` class) — an upload without the cropper is WRONG.
- An XCaptcha element (className="XCaptcha") for the captcha protection.
- The XSignature element when a signature field is requested.

**PLACE every created element**: add each widget to the target page's/container's `elements` array AND set its `properties.parentid` to that page/container's name (e.g. a widget on page `p1` gets `parentid="p1"` and `p1` lists it in its `elements`). A widget that exists in the root `items` array but is NOT referenced by any page/container (no `parentid`, not in any `elements` array) is ORPHANED — it does NOT render in the form and counts as missing. This applies to every widget, especially XBsLogin, XCaptcha, XUpload, XSignature and hidden XSpan elements.

## CRITICAL — BundID / Bürgerkonto login button

For a "BundID-Login-Button", "Bürgerkonto-Login", "BundID-Login" or any citizen-authentication button, ALWAYS create an **XBsLogin** element (with the `bs_auth_ref` property, e.g. "BUND_ID::https://idp.bundid.de"). NEVER use an XButtonList/BUTTON for a login button — a login button is NOT a navigation/submit button.

## CRITICAL — Common Validation Rules

Common Validation Rules (fc-plugin-common-validation-rules) are NOT CodBi functionalities. Do NOT add them as data-cb-func. These are validation-only plugins applied via data-vdt attribute — they validate input, they do NOT provide CodBi EP/functionality features. If an element already has a data-vdt attribute, leave it. Never add data-cb-func for a validation rule plugin class name.

## CRITICAL — Mandatory / required fields (Constraints > Required)

A field is made MANDATORY in Formcycle with the element property `"required":"1"` in its `properties` (the designer's "Constraints > Required" checkbox). `"required":"0"` = optional. It is a plain element property — NOT a CodBi functionality and NOT an HTML attribute.

- NEVER implement "Pflichtfeld" / "required" / "mandatory" with `HTML.SETAttribute` + `data-cb-name="title"` / `data-cb-toset="Pflichtfeld"` — a title tooltip does NOT make a field mandatory (it only shows a hover hint) and is the WRONG way to mark a required field. Use the `required` property instead.
- When the user asks to make a field "Pflichtfeld" / "required" / "mandatory" (e.g. 'dem Feld „E-Mail" einen Tooltip „Pflichtfeld" setzen' — the intent is "E-Mail ist ein Pflichtfeld"), set `"required":"1"` on that field. Do NOT create a `HTML.SETAttribute`/title tooltip for it.
- PROACTIVELY DETERMINE REQUIRED FIELDS: whenever you generate or edit a form, decide which fields must be mandatory and set `"required":"1"` on them — never leave a clearly-mandatory field as `"required":"0"`. Rules of thumb:
  - Fields the user explicitly calls Pflichtfeld / required / mandatory / obligatory.
  - Identification / contact fields the form needs: first name, last name, e-mail, date of birth, street + house number + postal code + city (an address group is complete only when all parts are filled).
  - Bürger-Services forms: the catalog fields marked "Pflichtfeld" (Vorname, Name, Geburtsdatum, Geburtsort, Adresse, PLZ, Ort, ELSTER org fields, BPK2, TrustLevel, …) are autofilled after login and should be `required`.
  - A captcha element, a signature field and an ID-upload field in a BundID/login bundle are mandatory.
  - Do NOT mark fields the user explicitly calls optional / freiwillig / "not required" as required.

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

Examples: a begin/end time pair → Time.Frame; a begin/end date pair → Date.Frame; text field needing format validation → HTML.Input.REGEX; an input field that must NOT allow certain characters (character blacklist, e.g. "nicht erlaubt: e$%") → HTML.Input.REGEX; a multi-line text field that should be a rich text / WYSIWYG editor (e.g. "write a story with a rich text editor") → HTML.Input.TinyMCE; German address flow → OpenPLZ.Autocomplete; container/navigation bar → Form.Navigator; input auto-capitalize words → HTML.Input.Trans.Capital; set an attribute / visual style of an element (e.g. title, opacity) → HTML.SETAttribute; console output → Sys.Log.Console; display/show/view the columns of a Formcycle DataQuery as a table (e.g. "add a table that views the columns Alter, Name of HolaQuery", "zeige die Spalten Alter, Name der Abfrage HolaQuery als Tabelle") → DQ.Table.View. When one request combines several of these on the same element, apply ALL matching functionalities in one comma-separated data-cb-func.

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

CRITICAL — When the thing to log is an AI-generated answer/text (e.g. "logge den KI-Text zu 'Wie wird das Wetter morgen?'" / "log the AI text for ..."), use the AI.LLAMA.STD.QA element placeholder as the logged content: `data-cb-Data = "SYS.Log.Console > AI.LLAMA.STD.QA > <Frage>; true;;;;;;"` — e.g. `"SYS.Log.Console > AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;;"`. The prefix is EXACTLY `SYS.Log.Console > ` (dots, NO spaces inside "SYS.Log.Console" — never "SYS Log.Console") and the EP keeps its trailing semicolon flags `; true;;;;;;`.
