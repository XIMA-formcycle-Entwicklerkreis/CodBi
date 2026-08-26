# CodBi General

Cross-cutting CodBi rules that apply to multiple categories.

## CSS Classes vs data-cb-func (TWO-OPTION RULE)

For EVERY field you create or modify, apply CodBi behavior with EXACTLY ONE of two options:

- OPTION A — a CSS class for the field's purpose is listed in the CodBi Core Elements list (the "Standard Configurations" CSS classes, e.g. CodBi_People_Name, CodBi_OpenPLZ_AC_SET_PLZ) → use it. Add the class name to the element's properties as `"cssclasses":["CodBi_..."]` (e.g. `"cssclasses":["CodBi_OpenPLZ_AC_SET_PLZ"]`).
- OPTION B — no matching CSS class exists → use data-cb-func (e.g. Form.Navigator has NO CSS class → data-cb-func=form.navigator).

CRITICAL:
- NEVER invent CSS class names. If a class is not in the reference list, it does NOT exist — use data-cb-func instead.
- MULTIPLE CSS classes MAY be applied to one field when each matches a distinct purpose (e.g. CodBi_People_PLZ for input formatting AND CodBi_OpenPLZ_AC_SET_PLZ for autocomplete on the same PLZ field, or CodBi_People_Name together with a user-requested class like "hallo"). Classes are ADDITIVE — never remove an existing class to add another; add to the "cssclasses" array.
- Only apply a CSS class when it EXACTLY matches the field's purpose. If no class matches, use data-cb-func.
- ADDRESS GROUPS (postal code, locality/city, street, building number) MUST be tagged with the OpenPLZ classes: CodBi_OpenPLZ_AC_SET_PLZ on the postal code field, CodBi_OpenPLZ_AC_SET_Locality on the locality/city field, CodBi_OpenPLZ_AC_SET_Street on the street field, CodBi_OpenPLZ_AC_SET_BuildingNumber on the building number field — the server then configures OpenPLZ.Autocomplete automatically.
- If the request wants German autocomplete for street / house number ("PLZ/Ort/Straße/Hausnummer sollen sich ... befüllen" / "ZIP/city/street/house number ... autofill") but the requested field list does not contain street / house-number fields, CREATE them in the address group's fieldset and tag them with the OpenPLZ classes: `tfStrasse` (label "Straße") + `CodBi_OpenPLZ_AC_SET_Street` and `tfHausnummer` (label "Hausnummer") + `CodBi_OpenPLZ_AC_SET_BuildingNumber`. Never skip the street / house-number parts just because the master-data field list omitted them — missing any address part is a FAIL.

## MANDATORY PEOPLE STANDARD CLASSES (person fields)

The People standard is active by default in the shared form. Apply the CodBi_People_* classes to
EVERY person field you create or modify — a missing class is a FAIL:
- First-name/last-name/name field (Vorname, Nachname, Name, "First name", "Last name", ...) →
  cssclasses=["CodBi_People_Name"]; a first name AND a last name EACH get their own CodBi_People_Name.
- E-Mail/email field → cssclasses=["CodBi_People_Mail"].
- German PLZ/postal-code field → cssclasses=["CodBi_People_PLZ"].
- Telefon/phone field → cssclasses=["CodBi_People_Phone"].
Classes are additive: a user-requested class (e.g. "hallo") and a CodBi_People_* class coexist in the
same "cssclasses" array; a field may also carry several CodBi classes for different purposes (e.g.
CodBi_People_PLZ + CodBi_OpenPLZ_AC_SET_PLZ).

## HTML.Text.Mapper EXACT WIRING

To map object properties into a text template: data-cb-func="HTML.Text.Mapper" with
data-cb-replacements (the object whose property values fill the placeholders) + data-cb-property (the
element property holding the TEMPLATE, e.g. "value"/"rtevalue"). The TEMPLATE with the [(property)]
placeholders (e.g. "Hello [(vorname)] [(nachname)]") goes INTO the field's OWN content property —
NEVER into a separate attribute. There is NO data-cb-Template attribute; emitting one is a FAIL.

## NAVBAR / LANGUAGE SWITCH PLACEMENT

Create the Formcycle navbar (XNavigationBar) and the language switcher (XLanguageSwich) EXACTLY ONCE
each and list them ONLY in the HEADER's (XHeader) "elements" array — they must NOT appear in ANY
page's "elements" array. Listing the SAME element in the header AND a page makes the server resolve it
to the PAGE (last parent wins), so the navbar is misplaced on the page instead of the header. Never
create two XNavigationBar/XLanguageSwich items.

## EXACT WIDGET className CASING

Use "XDatalistAdvanced" (lowercase "l") for the filterable datalist select and "XtextfieldAdvanced"
(lowercase "f") for the filterable/autocomplete text field — "XDataListAdvanced", "XTextFieldAdvanced"
and other casing variants do NOT exist and are dropped by the server.

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

## CRITICAL — STRICT VALID JSON OUTPUT

Return the form as ONE valid JSON document. Property values are plain JSON strings — the surrounding quotes of a string value are plain `"` characters and MUST NOT be escaped: `"xformula_unit": "€"` is correct, `"xformula_unit": \"€\"` is INVALID JSON and makes the whole response unparseable. Inside a string, only the characters `"` and `\` need escaping. Never emit trailing commas (`"a":1,}`), unquoted keys, comments, or markdown code fences, and never wrap the JSON in backticks. A single malformed token means the entire form is lost.

## CodBi / Widget DETAILS REQUEST

You initially receive a CONDENSED reference: the CodBi Core Elements list (names + purposes) and the FORMCYCLE Widgets list (names + purposes), NOT the full JSON structures. When you need the exact JSON template / properties of any CodBi element or formcycle widget before you can implement the request, STOP and return ONLY this JSON (nothing else, no prose):

```json
{"status":"need_codbi_details","elements":["CodBi.ID", ...],"widgets":["XWidget", ...]}
```

- "elements" — list EVERY CodBi functionality ID whose full parameter/TSDoc details you need (from the condensed Core Elements list).
- "widgets" — list EVERY FORMCYCLE widget className (e.g. "XTextField", "XContainer", "XPage") whose detailed JSON structure you need. Include every widget you plan to create, including containers and pages.
- Do not guess or invent property names/structure. The server provides the exact details for exactly the requested items, then you continue with the full form JSON.
- Omit a field when you need nothing from it; if you need neither, return the normal form JSON instead of a details request.
- MANDATORY — ALWAYS include these functionality IDs in "elements" when the request matches, EVEN IF the condensed entry already looks complete (you still need their exact TSDoc to build them; omitting any of them is a FAIL):
  - "AI.LLAMA.CHAT" — the request asks for an "AI chat"/"KI-Chat"/"KI-Assistent"/chatbot container. You must then build the FULL chat widget (never an empty container / placeholder span).
  - "JSON.SET" — the request asks to store/combine other fields' values as JSON in a hidden field (e.g. "JSON aus tfVorname/tfNachname"). JSON.SET cannot interpolate field values (no placeholders in data-cb-property/data-cb-toset), so for a hidden field holding the JSON of OTHER FIELDS create a Formcycle CALCULATION field (XFormula, read-only, xformula_value builds the JSON) with ishidden="1" (the Formcycle hide property — NOT invisible); the xformula_value writes the JSON literally with [%field%] placeholders (e.g. {"vorname":"[%tfVorname%]","nachname":"[%tfNachname%]"}) — no JSON.stringify, no bare field names. Use JSON.SET only for hard-coded values (data-cb-property + data-cb-path as a single JS dot path + data-cb-toset, "^"-prefixed for a JSON object literal).
  - "HTML.Input.TinyMCE" — the request asks for a rich-text editor ("Rich-Text-Editor") on a textarea. You must then apply it with data-cb-plugins and data-cb-toolbar.
  - "CodBi_Fotocropper" — the request asks for a "Fotocropper-Board" / "Bild-Cropper" / photo-cropper setup. You must then build the COMPLETE group (wrapper `CodBi_Fotocropper` + `CodBi_Fotocropper_Board` + `CodBi_Fotocropper_Uploader` + `CodBi_Fotocropper_Update` + `CodBi_Fotocropper_ImageURL` + `CodBi_Fotocropper_Foto`) before the referenced upload — never an empty board.

## CRITICAL — Use the user's clarification answers VERBATIM

When the user answered a clarification question, those answers are the FINAL VALUES — use them EXACTLY in the form. Do NOT substitute your own defaults or earlier placeholder values:
- An XSelect options list the user provided (e.g. "Ansbach und Nürnberg") → put those EXACT options into the select's options array.
- An appointmentPlan / Terminplan the user named (e.g. "Gonzo") → appointmentPlan gets exactly that value, NOT the widget's label or a generic name.
- A minimum date the user chose (e.g. "morgen") → encode exactly that (data-cb-minimum=1, data-cb-unit=d, data-cb-reverse=true).
- A completion page / email sender / subject the user named → use exactly those values.
Only when the user answered "du entscheidest" / "you decide" may you choose a sensible default; whenever the user gave a concrete answer, honor it verbatim.

## CRITICAL — Birth-date fields (Geburtsdatum / birth date)

A birth-date field (labels "Geburtsdatum", "Geburtstag", "birth date", "date of birth", "birthday") ALWAYS lies in the PAST — a birth date can never be in the future. **MANDATORY — apply the `CodBi_NoFutureDate` class to EVERY birth-date field** (max = today; **the current date itself is a VALID value** — a person born today is a valid birth date), EVEN when the prompt does NOT explicitly say "no future dates" (e.g. a plain "Geburtsdatum (deutsche Validierung)" still gets `CodBi_NoFutureDate`). NEVER apply to it:
- a FUTURE `Date.Min` (`data-cb-reverse=true`, "heute"/"morgen") — never ask "Mindestdatum heute oder morgen?" for a birth-date field;
- `Date.NoWeekends` or any weekend-restriction class (there is NO `CodBi_NoWeekends` class — never invent it).

A constraint like "keine Vergangenheitsdaten"/"no past dates"/"no future dates" on a birth date also means **NO FUTURE DATES** → the `CodBi_NoFutureDate` class (already applied). Do NOT add `Date.Min` and do NOT add any weekend restriction. A `Date.Min` on a birth date is valid ONLY as a PAST minimum (e.g. "mindestens 18 Jahre" → `data-cb-minimum=18, unit=y`, no `reverse`) and only when an age limit is requested.

## CRITICAL — Print removal / hiding data when printing (Print.Remove)

Distinguish the two cases:

1. INTERACTIVE / CONTROL ELEMENTS (navigation/submit buttons, e.g. XButtonList "Weiter"/"Senden"/"Zurück", and any button that only works on screen): hiding them from the printed output is the sensible DEFAULT — they are useless on paper. Apply `CodBi_Print_Remove_PrintOnly` (or `data-cb-func="Print.Remove"` / `CodBi_Print_Remove_Tagged`) to such buttons/controls. This is NOT "hiding sensitive data".

2. USER DATA / SENSITIVE FIELDS (birth place, address, personal data): NEVER hide them from prints proactively and NEVER offer to hide them — a field being personal/sensitive is NOT a reason to remove it from the print output. Only hide a data field when the user EXPLICITLY asks for it (e.g. "das Feld X soll beim Drucken ausgeblendet werden" / "field X should be hidden when printing").

The CSS class is the STANDARD for print removal — use the CodBi_Print_Remove_* classes for the normal cases:
- `CodBi_Print_Remove_Tagged` — removes exactly the tagged element (the default for "beim Drucken ausblenden" on a single field).
- `CodBi_Print_Remove_Parent` — removes the ENTIRE parent container/section from the print.
- `CodBi_Print_Remove_PrintOnly` — for print-only elements (e.g. buttons/controls that only work on screen).

Use `data-cb-func="Print.Remove"` ONLY for the special case where the prompt specifies a parameter for the functionality — e.g. `DocumentSelector` (a dot-prefixed CSS-class selector of the section/container to remove, such as `.divPrintSection`) or `ParentalLevel` (how many ancestors to climb up to). Print.Remove is NOT normalized server-side — the AI's choice (class vs. functionality) reaches the designer unchanged. A verification check that finds the class (or the functionality with its parameter) on the requested field counts as applied.

NEVER ask the user how to hide an element on print — NEVER offer `print:hidden` / `CodBi_NoPrint` (neither is a CodBi class; do not invent them). Decide it yourself:
- When the CodBi switch is ON, ALWAYS apply the CodBi_Print_Remove_* CSS class (`CodBi_Print_Remove_Tagged` for a single field, `CodBi_Print_Remove_Parent` for a whole container/section, `CodBi_Print_Remove_PrintOnly` for print-only controls).
- When the CodBi switch is OFF, use Formcycle's per-element print property instead of a CodBi class.
This is never a clarification question.

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

## CRITICAL — Hiding an element: the Formcycle property is `ishidden`, NOT `invisible`

To hide an element in the rendered form, set `"ishidden": "1"` in its `properties` — `ishidden` is the Formcycle hide property (`XPropertyEnum.ishidden`; `XItemRenderData.isHidden()` reads it and the renderer hides the element with the `xm-hidden` CSS class while keeping it in the DOM). `invisible` is NOT a Formcycle property — an element with only `invisible="1"` is still rendered VISIBLE. Use `ishidden="1"` for EVERY hidden field/span/calculation field: the hidden JSON fields, the invisible Sys.Log.Console XSpan, the `CodBi_Fotocropper_ImageURL` receiver, ... An element that must stay in the DOM so a functionality can read/write it (e.g. the cropper's ImageURL input) but still be hidden → `ishidden="1"` (it remains in the DOM, hidden via `xm-hidden`).

## CRITICAL — Fotocropper board / Bild-Cropper must be a COMPLETE group

A "Fotocropper-Board" / "Bild-Cropper" request (e.g. 'Füge ein Fotocropper-Board und einen Bild-Cropper vor dem Upload `fdDatei` hinzu') is NOT a widget and NOT a bare `data-cb-func` on the upload — the People standard registers `Media.Image.Cropper` on the `.CodBi_Fotocropper` target with Container/File/Updater/ImageURL/Target selectors (`CodBi_Fotocropper_Board`/`_Uploader`/`_Update`/`_ImageURL`/`_Foto`). Build the COMPLETE group BEFORE the referenced upload and leave that upload without cropper functionality. EVERY element of the group MUST carry its exact `CodBi_Fotocropper_*` class — a single missing class (especially `CodBi_Fotocropper_Uploader` on the XUpload or `CodBi_Fotocropper_Update` on the update button) means the standard's File/Updater selectors find nothing and the cropper does NOT work, and an untagged XButtonList inside the container renders as a stray button:
- wrapper container `CodBi_Fotocropper` (the standard's targets selector),
- board container `CodBi_Fotocropper_Board` (cropper preview board / UI container),
- upload `CodBi_Fotocropper_Uploader` (XUpload — file input to pick the image),
- update control `CodBi_Fotocropper_Update` (XButtonList with ONE non-navigation button `action=""` — applies the crop),
- hidden receiver `CodBi_Fotocropper_ImageURL` (XTextField, MUST be `ishidden="1"` — `ishidden` is the FORMCYCLE hide property (XPropertyEnum.ishidden; `XItemRenderData.isHidden()` reads it and the renderer hides the element with the `xm-hidden` CSS class while keeping it in the DOM so the cropper can still write the cropped image data URL into it); a VISIBLE picture-URL field is a FAIL — `invisible` is NOT a Formcycle property and does NOT hide),
- photo display `CodBi_Fotocropper_Foto` (XImage — shows the cropped photo).
Exact JSON skeleton (copy it, adapt the names to the form's prefix):
```json
{ "className": "XContainer", "properties": { "name": "coFotocropper", "id": "xi-co-fotocropper", "cssclasses": ["CodBi_Fotocropper"], "elements": ["coFotocropperBoard","fdFotocropperUpload","btFotocropperUpdate","tfFotocropperImageURL","imgFotocropperFoto"] } },
{ "className": "XContainer", "properties": { "name": "coFotocropperBoard", "id": "xi-co-fotocropper-board", "cssclasses": ["CodBi_Fotocropper_Board"], "elements": [] } },
{ "className": "XUpload", "properties": { "name": "fdFotocropperUpload", "id": "xi-fd-fotocropper-upload", "label": "Bild auswählen", "cssclasses": ["CodBi_Fotocropper_Uploader"] } },
{ "className": "XButtonList", "properties": { "name": "btFotocropperUpdate", "id": "xi-bt-fotocropper-update", "cssclasses": ["CodBi_Fotocropper_Update"] }, "buttons": [ { "name": "update", "title": "Update", "value": "update", "action": "" } ] },
{ "className": "XTextField", "properties": { "name": "tfFotocropperImageURL", "id": "xi-tf-fotocropper-imageurl", "ishidden": "1", "cssclasses": ["CodBi_Fotocropper_ImageURL"] } },
{ "className": "XImage", "properties": { "name": "imgFotocropperFoto", "id": "xi-img-fotocropper-foto", "src": "", "cssclasses": ["CodBi_Fotocropper_Foto"] } }
```
FAIL: an EMPTY container with only `CodBi_Fotocropper_Board`, a missing `CodBi_Fotocropper_*` class on ANY of the six elements (e.g. the XUpload without `CodBi_Fotocropper_Uploader`, or the update XButtonList without `CodBi_Fotocropper_Update`), a `CodBi_Fotocropper_ImageURL` field that is NOT `ishidden="1"` (a VISIBLE picture-URL field), or `data-cb-func="Media.Image.Cropper"` on the target upload without the Container/File/Updater/ImageURL/Target parameters — none renders a working cropper. NEVER invent a widget type (`XImageCropper`/`XCanvasCropper` do not exist) and NEVER ask the user for one. ALWAYS include `"CodBi_Fotocropper"` in the details request's "elements" array when a Fotocropper board / "Bild-Cropper" is requested — the full spec lists the exact tagged elements; without it the AI builds an empty board (FAIL). (The DIFFERENT case 'Upload-Feld für den Personalausweis mit Bild-Cropper' — a crop dialog ON the upload — DOES use `data-cb-func="Media.Image.Cropper"` on that XUpload.)

## CRITICAL — Group person / address / contact fields into containers

Do NOT place person, address or contact fields flat on the page — group them into ONE dedicated XContainer (or XFieldSet when a legend/title fits) per group:
- NAME / person-data fields (first/given name, last/family name, middle name) → one container (this is also the LDAP/autofill person-data group when one is requested).
- ADDRESS fields (street, house/building number, postal code/PLZ, locality/city) → one address container.
- CONTACT fields (e-mail, phone/telephone) → one contact container.
Inside each container the ROW PAIRING RULES still apply: first+last name share one row (same rowid), street+house number one row, PLZ+city one row. Do NOT wrap a single row pair in its own extra container. Add each group container to the page's 'elements' array and each field to its group container's 'elements' array (parentid set accordingly) — a field not referenced by any container's 'elements' array is orphaned and does NOT render.

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

## CRITICAL — Referenced fields are in the provided form — never ask whether they exist

The form data in the prompt contains ALL existing elements. When the request references a field/container/DataQuery by name (e.g. `tfVorname`, `tfNachname`, `fdDatei`, `HolaQuery`), look it up there: it exists → reuse/modify it; it does not exist → CREATE it (e.g. as a hidden field) without asking. NEVER ask "Existieren die Felder … bereits?" / "bereits vorhanden oder neu anlegen?" — existence is always derivable from the provided form. Ask only when the request is ambiguous about WHICH element is meant.

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

## CRITICAL — Datatype regex vs. HTML.Input.REGEX (input value restrictions)

A field that RESTRICTS what can be entered ("nur 3 Ziffern" / "only 3 digits", "nur die Zeichen a–z" / "only allows a–z", "darf e$% nicht enthalten" / "must not contain e$%", a fixed format/pattern) MUST NOT remain a plain text field (`datatype=""`) with no validation. Choose the mechanism by the field's datatype:

- TEXT field (no other datatype is required — e.g. a "Sicherheitscode"/CVV that allows only 3 digits): the datatype regex is the right tool. Set `datatype="regexp"` on the XTextField AND put the regex pattern into the **`vrule`** property (the validation rule Formcycle's regexp datatype actually reads — NOT `datatypeHint`), e.g. `datatype="regexp"` + `"vrule": "^[0-9]{3}$"`. ALWAYS set the `"vrulemismatch"` property as well, with a proper, user-readable error message shown when the value does not match `vrule` (e.g. `"vrulemismatch": "Bitte genau 3 Ziffern eingeben"`) — a regexp field WITHOUT an error message is incomplete. The regexp datatype validates the submitted VALUE via `vrule`. ADDITIONALLY apply the HTML.Input.REGEX functionality so the field ALSO restricts the characters that can be TYPED — but ONLY with `data-cb-keyexpression`: `data-cb-func="HTML.Input.REGEX"` + `data-cb-keyexpression="[0-9]"` (per-keystroke allowed characters). Do NOT set `data-cb-expression` on a regexp field — the datatype already validates the whole value, so `data-cb-expression` would be redundant.
- NON-TEXT datatype field (the field's datatype must be something else than text — `money`/`posmoney` for an amount like "Kaufpreis", `number`/`integer`, `dateDE`, `phone`, `email`, `plzDE`, ...): KEEP that datatype (do NOT overwrite it with `regexp`) and apply the HTML.Input.REGEX functionality for the input restriction with a proper regex for values and keys: `data-cb-keyexpression` (per-keystroke allowed characters) + `data-cb-expression` (whole-value pattern).

DERIVE the regexes from the described rule yourself — never ask the user for a pattern when the allowed/blocked characters or the value format are stated in the request.

## CRITICAL — Element Placeholders (EPs) are VALUES, never JSON

An Element Placeholder (EP) — built-in (from the Element Placeholders reference list) OR custom (defined in the local API doc manager) — is invoked by writing the PLACEHOLDER ITSELF as the value of a `data-cb-*` attribute (e.g. `data-cb-Data`), in the form:

`{ EPName > Param1 ; Param2 ; ... }`

CRITICAL:
- The EP placeholder IS the value. It is NOT a description of what to build, and you must NEVER expand it into a hand-written JSON object/array.
- WRONG: `data-cb-Data="{"planet":"Pluto","saturation":0.5}"` — this builds a JSON object manually and bypasses the EP entirely.
- CORRECT: `data-cb-Data="{ data.join > Param1 ; Param2 }"` — the first token inside the braces is the EP's NAME. `data.join` is ONLY an example — ANY EP id works (built-in like AI.LLAMA.STD.QA, OpenPLZ.Localities, or any custom EP defined in the local API doc manager). The pattern is always `{ <any EP id> > Param1 ; Param2 ; ... }`, then >, then the parameters. The placeholder tells CodBi to invoke that EP, which produces the data at runtime.
- NEVER invent or rename an EP id. Use EXACTLY the id under which the EP is defined (e.g. a custom EP named `gustav` must be invoked as `{ gustav > ... }` — do NOT rename it to something descriptive like `{ LogPlanet > ... }`). NEVER translate an EP id to another language: German holidays = the EP `Date.Holidays` (there is NO `Feiertage` EP) — 'Feiertage dieses Jahr' → `{ Date.Holidays > THIS_YEAR }`; 'Feiertage Bayern dieses Jahr' → `{ Date.Holidays > by ; THIS_YEAR }`; 'Feiertage nächstes Jahr' → `{ Date.Holidays > THIS_YEAR + 1 }`.
- Match each parameter to the EP's declared parameters in order. Only the parameters the EP declares may be used (name-to-parameter mapping, not your own invented JSON keys).
- When a prompt asks you to log/show/output data that a known EP provides (built-in or custom), ALWAYS use the EP placeholder as the value — never construct the equivalent JSON yourself.

## CRITICAL — data-cb-func is the FUNCTIONALITY name, NEVER an Element Placeholder (EP) name

`data-cb-func` holds the FUNCTIONALITY id (e.g. `HTML.Text.Injector`, `html.select.injection`, `JSON.SET`, `Sys.Log.Console`, `DQ.Table.View`, `HTML.Input.REGEX`, `HTML.SETAttribute`, ...) — it NEVER holds an element-placeholder (EP) name. Element placeholders (e.g. `OpenPLZ.Streets`, `OpenPLZ.Localities`, `AI.LLAMA.STD.QA`, `Data.CSV`, `Date.FromString`, `LDAP.Find`, `V`, `F`, `I`, `JSON.Path`, ...) are VALUES that go into a data-cb-* VALUE parameter, NEVER into data-cb-func:
- `data-cb-Data` (Sys.Log.Console), `data-cb-replacement` (HTML.Text.Injector), `data-cb-Values` (HTML.Select.Injection), `data-cb-toset` (JSON.SET).
- WRONG: `data-cb-func="OpenPLZ.Streets"` + `data-cb-Data="{ OpenPLZ.Streets > ; .* ; 91522 }"` — OpenPLZ.Streets is an EP, not a functionality.
- CORRECT: `data-cb-func="html.select.injection"` + `data-cb-Values="{ OpenPLZ.Streets > ; .* ; 91522 }"` for a select fed by the EP, or `data-cb-func="HTML.Text.Injector"` + `data-cb-replacement="{ OpenPLZ.Streets > ; .* ; 91522 }"` for injecting the EP result.
CRITICAL — every functionality has PARAMETERS (the data-cb-* attributes it requires, e.g. data-cb-replacement/data-cb-property/data-cb-placeholder for HTML.Text.Injector, data-cb-Values/data-cb-ValueProperty/data-cb-TextProperty for HTML.Select.Injection, data-cb-Data for Sys.Log.Console). Never emit a bare data-cb-func without its required parameters, and never put an EP or its parameters into data-cb-func.

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
    "ishidden": "1"
  },
  "attributes": [
    { "text": "data-cb-func", "value": "Sys.Log.Console" },
    { "text": "data-cb-Data", "value": "SYS.Log.Console > <what shall be logged>" }
  ]
}
```

Also add the element's name to the first page's "elements" array. Set data-cb-func="Sys.Log.Console" on it and set data-cb-Data to a string that starts with the literal prefix **"SYS.Log.Console > "** followed by the text describing what shall be logged — e.g. "SYS.Log.Console > Log the details of the planet Pluto with a saturation of .5". Do NOT use an element-placeholder expression as the whole data-cb-Data value.

CRITICAL — When the thing to log is an AI-generated answer/text (e.g. "logge den KI-Text zu 'Wie wird das Wetter morgen?'" / "log the AI text for ..."), use the AI.LLAMA.STD.QA element placeholder as the logged content: `data-cb-Data = "SYS.Log.Console > AI.LLAMA.STD.QA > <Frage>; true;;;;;;"` — e.g. `"SYS.Log.Console > AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;;"`. The prefix is EXACTLY `SYS.Log.Console > ` (dots, NO spaces inside "SYS.Log.Console" — never "SYS Log.Console") and the EP keeps its trailing semicolon flags `; true;;;;;;`.
