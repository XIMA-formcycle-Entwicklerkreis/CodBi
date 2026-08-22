# CodBi Core Elements (Compact)

Element-only reference: what each functionality, element placeholder, and standard class does.

REQUIRED VALUES: Some elements need parameter values or global variables to be configured. Whenever a value is genuinely required and cannot be derived from the user's request, ASK the user for it instead of guessing or inventing one (e.g. the CSS text for HTML.CSS, the regex for HTML.Input.REGEX only when the allowed/blocked characters are NOT described in the request, the attribute + value for HTML.SETAttribute, the text for HTML.Text.Injector, the tracking ID for Matomo.Tracking, or the global variable value behind a standard configuration).

EXISTING FORM ELEMENTS: the current form's existing elements (all items with their `name`s) are ALWAYS provided with the request. NEVER ask the user whether a referenced field/container already exists (e.g. "Existieren die Felder … bereits?" / "bereits vorhanden oder neu anlegen?") — determine it from the provided form data: name present → reuse/modify it (no duplicate, no question); name absent → create it as requested (e.g. a hidden field), without asking.

## Functionalities

### AI.LLAMA.CHAT
Applicable on a container element to embed an AI chat widget (requires a locally running LLAMA server via CodBi settings). USE whenever the user asks for an "AI chat" / "KI-Chat" / chatbot / "KI-Assistent" - NEVER just create an empty container and NEVER emit a placeholder span / "Chat-Platzhalter" element. Build the FULL widget as a set of elements inside one XContainer wrapper whose `fullwidth` property MUST be `"1"` (never `"0"`). The data-cb-func="ai.llama.chat" attribute goes ONLY on the chat display XTextArea (first bullet) — NEVER on the container, the Upload or any other sub-element; every other chat sub-element (Input/Send/Stop/Upload/checkboxes/Mail) is wired ONLY via its AI_LLAMA_CHAT_* CSS class (standard configuration), never via a data-cb-func:
- Chat display: XTextArea (data-cb-func="ai.llama.chat", readonly, autosize, no label) with data-cb-MaxPixelSize="360000" and data-cb-maxchatwindowheight="1200".
- User input: XTextArea (cssclasses=["AI_LLAMA_CHAT_Input"], fullwidth, autosize).
- Send button: XButtonList with SINGLE button (cssclasses=["AI_LLAMA_CHAT_Send"]).
- Stop button: SEPARATE XButtonList with SINGLE button (cssclasses=["AI_LLAMA_CHAT_Stop"]).
- Upload: XUpload (cssclasses=["AI_LLAMA_CHAT_Upload"], fileextension="image/*,.pdf").
- Checkboxes: XCheckbox for Thinking, Internet, Location, AlertOnFinish (cssclasses=["AI_LLAMA_CHAT_Thinking"/"AI_LLAMA_CHAT_Internet"/"AI_LLAMA_CHAT_Location"/"AI_LLAMA_CHAT_AlertOnFinish"]).
- Mail group: a child XContainer with XCheckbox (cssclasses=["AI_LLAMA_CHAT_MailForward"]) + XTextField (cssclasses=["AI_LLAMA_CHAT_MailAddress","CodBi_People_Mail"], datatype="email"). The MailAddress is ONLY visible while the MailForward checkbox is CHECKED (hidden when unchecked / has no value): set hiddenif="<MailForward_ID>", hiddenifcomp="9" (EConditionType EMPTY — hidden when the checkbox is empty/unchecked), hiddenifclear="false" as direct properties. CodBi_People_Mail (People standard class) restricts input to valid e-mail characters.
When the request says to embed an "AI chat"/"KI-Chat"/chatbot, ALWAYS create ALL of these sub-elements inside the container — including the Upload `fileextension="image/*,.pdf"` attribute and the Mail group (the child XContainer with the MailForward XCheckbox + MailAddress XTextField). NONE of them are optional; omitting the upload's fileextension, the Mail group, or any checkbox is a FAIL. A bare XContainer or a placeholder span is NOT a chat. Do not defer the chat to a later step; build it now. YOU MUST request the full details for this element (add "AI.LLAMA.CHAT" to the "elements" array of your {"status":"need_codbi_details",...} request) before building the chat — never build it from this condensed text alone.

### AI.OCR
Applicable on an XUpload field to extract and return text from uploaded images or PDFs via OCR. USE whenever the request asks to extract/text-recognize the content of an uploaded image/PDF into a text field (e.g. "per OCR den Text extrahieren und in ein Feld schreiben"). Set data-cb-func="AI.OCR" on the XUpload AND link the receiver field: data-cb-field = dot-prefixed class selector of the target field's `name` (e.g. data-cb-field=".tfExtractedText"). Also set the Mode parameter (data-cb-mode="print" or "verify") — never emit AI.OCR without Mode and without the receiver field link.
REQUIRES: the receiver field (data-cb-field) and Mode. The receiver field (e.g. the XTextArea `tfExtractedText`) MUST be created with AutoResize enabled (autosize="1") so the extracted text is shown comfortably.

### Date.Frame
For a date range (start/minimum + end/maximum date, e.g. 'Kursbeginn'/'Kursende', 'Start'/'End', 'Von'/'Bis'). A two-field date RANGE is ALWAYS Date.Frame — do NOT model a range as a mere Date.Min. PREFER the standard CSS classes: apply CodBi_DateFrame_N_Begin to the START date field AND CodBi_DateFrame_N_End to the END date field (SAME N — BOTH fields get their own class; there is NO combined CodBi_DateFrame_N_Begin_End class; these classes go ONLY on the two date XTextField fields, never on a container/fieldset). FALLBACK when the classes cannot be used: data-cb-func=date.frame on the BEGIN field only with data-cb-maxfield = dot-prefixed END field name (e.g. .tfKursende) — do NOT put the functionality on the end date element. A Date.Min may be ADDED to the start field, but the range itself still requires the Begin/End frame classes on BOTH fields. EQUALITY: the begin date may EQUAL the end date (start == end is allowed) — the end date must simply not be BEFORE the start. For a repeatable container, the BEGIN field and the END (MaxField) must be in the SAME row.

### Date.Min
Applicable on a XTextField of type 'date' to enforce a minimum allowed date (e.g. prevent past dates).
REQUIRES: data-cb-minimum (digit string) + data-cb-unit (d/w/m/y, default y). For a FUTURE minimum ("at least tomorrow", "no past dates") also set data-cb-reverse=true (e.g. minimum=1, unit=d, reverse=true = tomorrow or later).
BIRTH-DATE FIELDS (Geburtsdatum, Geburtstag, birth date, birthday): NEVER apply data-cb-reverse=true / a FUTURE Date.Min / "Mindestdatum heute oder morgen" to a birth-date field — a birth date lies in the PAST. A constraint like "keine Vergangenheitsdaten"/"no past dates"/"no future dates" on a birth date means NO FUTURE DATES → the ONLY valid CodBi behavior is the CodBi_NoFutureDate class (max = today; today itself is a valid birth date). Do NOT add Date.Min and do NOT add any weekend restriction. A PAST minimum (e.g. "mindestens 18 Jahre" → minimum=18, unit=y, NO reverse) is valid only when an age limit is requested.

### Date.NoWeekends
Applicable on a XTextField of type 'date' to disallow weekend dates. NEVER apply to a BIRTH-DATE field (Geburtsdatum, Geburtstag, birth date, birthday) — people can be born on any weekday, so a "keine Wochenenden"/"no weekends" constraint on a birth date must be IGNORED (apply nothing, ask nothing). There is NO "CodBi_NoWeekends" class — never invent it. Only meaningful for future-dated/booking-type dates (course date, appointment, delivery).

### Form.Navigator
Applicable on forms with 2 or more pages (multi-step forms); adds a navigation progress bar or breadcrumb tabs. Do NOT apply to single-page forms. PLACEMENT — the navigator must be reachable on EVERY page: create a SEPARATE XContainer (div) and place it inside the form's XHeader or XFooter when one exists; only when there is NO header/footer add it to EVERY page's elements array. NEVER place it on only one page.

### HTML.CSS
Applicable on ANY element to inject custom CSS text into the page (with optional placeholder replacements). USE whenever the request asks to style/color/skin the form (e.g. "eigenes CSS", "rote Überschriften", "red headings", "roter Hintergrund") — emit an element with data-cb-func="HTML.CSS" and data-cb-css set to the derived CSS snippet (e.g. "rote Überschriften" → data-cb-css="h1 {color:red;}"). NEVER merely invent/apply a CSS class name (e.g. "customRedHeading") instead of emitting the HTML.CSS functionality with the actual CSS text.
REQUIRES: data-cb-css = the CSS text to inject. Derive it whenever the styling rule is described; ask the user only when the CSS cannot be derived.

### HTML.Input.Cleave
Applicable on a XTextField to apply input masking/formatting (credit card, phone, IBAN, date, etc.) via Cleave.js.

### HTML.Input.REGEX
Applicable on a XTextField to validate, reformat, or RESTRICT input against a regular expression pattern. USE when the user asks to disallow/block certain characters (e.g. "darf die Zeichen e$% nicht enthalten") — apply data-cb-func="HTML.Input.REGEX" with the forbidden set as a negated character class (data-cb-keyexpression="[^e$%]" blocks the keystrokes, data-cb-expression="^[^e$%]*$" validates the whole value). For an ALLOW-LIST rule ("nur die Zeichen a–z erlaubt" / "only allows a–z") use the allowed class WITHOUT negation: data-cb-keyexpression="[a-z]", data-cb-expression="^[a-z]*$".
REQUIRES: the regex pattern and the mode (validate / restrict / reformat). DERIVE the pattern automatically whenever the user describes the allowed/blocked characters in words; ask the user only when the pattern cannot be derived.

### HTML.Input.TinyMCE
MANDATORY — it is INVALID to apply HTML.Input.TinyMCE with only data-cb-func and WITHOUT both data-cb-plugins and data-cb-toolbar; the editor would be unusable. Whenever you apply data-cb-func="HTML.Input.TinyMCE" to a XTextArea, ALWAYS also emit data-cb-plugins and data-cb-toolbar. USE for a "rich text editor", "WYSIWYG", or rich/formatted text entry on a multi-line text field. For a message/story: data-cb-plugins="advlist, autolink, lists, link, image, media, charmap" and data-cb-toolbar="undo redo | blocks | bold italic underline | bullist numlist | link image media" (do NOT include the raw-HTML 'code' option unless the field is explicitly for HTML source). Full example:
"attributes": [{"text":"data-cb-func","value":"HTML.Input.TinyMCE"},{"text":"data-cb-plugins","value":"advlist, autolink, lists, link, image, media, charmap"},{"text":"data-cb-toolbar","value":"undo redo | blocks | bold italic underline | bullist numlist | link image media"}]

### HTML.Panel
Applicable on any element to wrap it in a collapsible accordion/panel widget. CRITICAL: "Standard-Panel" and "aufklappbares/collapsible panel" on a fieldset = XFieldSet + CodBi_HTML_Panel_Standard CSS class + legend property (preferred). Use data-cb-func=html.panel only on a container (not a fieldset).

### HTML.Select.Injection
Applicable on an XSelect (a select/dropdown) to populate its <option> entries dynamically from the data of an element placeholder (EP). USE for a select whose options come from a lookup EP — e.g. an "Ortsvorschläge" field that lists all localities → data-cb-func="html.select.injection" on the XSelect with data-cb-Values="{ OpenPLZ.Localities > de ; ^An }" (the EP returning the entries). The EP belongs in data-cb-Values — NEVER in data-cb-Data (data-cb-Data is for Sys.Log.Console / HTML.Text.Injector). CRITICAL — when the EP returns OBJECTS (OpenPLZ.Localities returns {postalCode, name, district, federalState, municipality, ...} with postalCode as the FIRST string), you MUST also set data-cb-ValueProperty="name" AND data-cb-TextProperty="name" so each <option> shows the locality NAME — without them the functionality uses the first string property (the postalCode) as the option, not the city name. Optional: data-cb-Titles / data-cb-TitleProperty for option titles and data-cb-ReClean. APPLIES to XSelect only. CRITICAL — leave the XSelect's manually-set Formcycle `options` array EMPTY ([]) by default: manually entered options are rendered by the browser at the BEGINNING of the select, before the EP-injected options (html.select.injection appends after them), so they would appear as unwanted leading entries; only add specific `options` when the user EXPLICITLY asked for leading options.

### HTML.SETAttribute
Applicable on any element to dynamically set one or more HTML attributes on it, including CSS styling (opacity etc.) via the "style" attribute. USE when the user asks to set an attribute or visual/CSS style of an element (e.g. title, opacity) — set data-cb-name and data-cb-toset.
REQUIRES: the target attribute name (data-cb-name) and the value to set (data-cb-toset) — ask the user when missing.

### HTML.Text.Injector
Applicable on XTextField/XTextArea or XSpan to inject a dynamic text value into the element's value. CRITICAL WIRING — data-cb-replacement only reaches the field value when BOTH are set:
- data-cb-property: on XTextField/XTextArea use "value"; on XSpan use "innerHTML".
- the data-cb-placeholder (default "[[INJECTOR_REPLACEMENT]]") MUST also be placed inside the field's OWN content property: on XTextField/XTextArea put it in the field's "value" property (e.g. "value":"[[INJECTOR_REPLACEMENT]]"), on XSpan put it in the "rtevalue" property. If the placeholder is not inside the field's own value/rtevalue, data-cb-replacement never reaches the value.
- data-cb-replacement: the dynamic text to insert at the placeholder.
data-cb-func stays "HTML.Text.Injector" (the FUNCTIONALITY name, NEVER an EP name).
REQUIRES: the text to inject (data-cb-replacement) and the target property — ask the user when missing.
YOU MUST request the full details for this element (add "HTML.Text.Injector" to the "elements" array of your {"status":"need_codbi_details",...} request) before building it — never build it from this condensed text alone.

### HTML.Text.Mapper
Applicable on any element to map object properties to named placeholders in a text template.
REQUIRES: the object source and the text template with placeholders — ask the user when missing.

### JSON.SET
Applicable on a hidden field to store a JSON-serialized value derived from another element — ONLY with hard-coded values, NEVER with live field values. Apply data-cb-func="JSON.SET" to a hidden XTextField/XTextArea with `invisible="1"` and set the three parameters:
- data-cb-property: the name of the property to set.
- data-cb-path: a regular JavaScript path in dot notation (plain `x`, dotted `x.y.z`, empty method call `x()`, index access `x[0]`) leading from the property in data-cb-property onward. This is a SINGLE path — NEVER a CSV list of field names (`data-cb-path="tfVorname,tfNachname"` is WRONG).
- data-cb-toset: the plain value to assign. To assign a JSON object literal, prefix it with `^` so its commas are NOT treated as CSV separators by CodBi (e.g. data-cb-toset="^{firstname:..., lastname:...}").
CRITICAL — data-cb-property/data-cb-toset do NOT support field placeholders, so JSON.SET can NEVER build JSON from the RUNTIME values of other form fields. For a hidden field that stores the JSON of OTHER FIELDS' values (e.g. "verstecktes Feld, das das JSON aus tfVorname/tfNachname speichert") DO NOT use JSON.SET — create a Formcycle CALCULATION field (XFormula, read-only, formula in xformula_value) that builds the JSON, and mark it invisible="1". The xformula_value builds the JSON string EXACTLY as written using [%fieldName%] placeholders — e.g. xformula_value = {"vorname":"[%tfVorname%]","nachname":"[%tfNachname%]"} — do NOT use JSON.stringify and do NOT reference bare field names ([%name%] is replaced by the field's runtime value).
REQUIRES: data-cb-property, data-cb-path and data-cb-toset plus the hidden (`invisible`=1) flag. YOU MUST request the full details for this element (add "JSON.SET" to the "elements" array of your {"status":"need_codbi_details",...} request) before building it — never build it from this condensed text alone.

### LDAP.Autocomplete.Set
Applicable on form fields that should be auto-filled from a selected LDAP directory match.

### LDAP.Autocomplete
Applicable on a text input that should autocomplete entries from an LDAP directory search. Apply directly (data-cb-func="LDAP.Autocomplete" or the matching CodBi_LDAP_AC_* standard-configuration class) — NEVER ask the user for an LDAP server URL/endpoint (the directory is configured server-side). Do NOT apply LDAP to the person/address fields of a Bürger-Services form (fsBKDaten/fsBKOrgDaten): the address data comes from the login response or from the German OpenPLZ.Autocomplete (CodBi_OpenPLZ_AC_SET_*).

### Matomo.Tracking
Applicable on any form to add Matomo/Piwik analytics event tracking.
REQUIRES: the Matomo site/tracking ID — ask the user when it is not derivable.
Matomo server URL: NEVER ask the user for it. If the user's request specifies a URL, use that URL. Otherwise the URL is taken automatically from the server-side plugin configuration (Matomo_URL property) and must NOT be requested.

### Media.Image.Cropper
Applicable on an XUpload field for images; adds an interactive crop dialog before upload. CRITICAL — apply to the XUpload whenever the request asks for an upload with a cropper ("Bild-Cropper", "with crop", "Upload-Feld für den Personalausweis mit Bild-Cropper"): set data-cb-func="Media.Image.Cropper" (or a CodBi_Fotocropper_* class) on that XUpload. NEVER omit it.

### MEDIA.INPUT.SPEECH
Applicable on a text input field to enable speech-to-text dictation via the Web Speech API.

### OpenPLZ.Autocomplete
Applicable on every XTextField (input type=text) within a group of related address fields (postal code, locality/city, street, building number). APPLY the OpenPLZ standard-configuration CSS classes instead of data-cb-func: CodBi_OpenPLZ_AC_SET_PLZ on the postal code field, CodBi_OpenPLZ_AC_SET_Locality on the locality/city field, CodBi_OpenPLZ_AC_SET_Street on the street field, CodBi_OpenPLZ_AC_SET_BuildingNumber on the building number field. The server then configures the OpenPLZ.Autocomplete autocomplete (with TargetData, Country, Dependent, DependentPLZ, DependentLocality, FocusOnAutocomplete) automatically. FALLBACK only when the CSS classes cannot be used: set data-cb-func=openplz.autocomplete on each address field and set the parameters individually — TargetData to match the field's type (Localities, PostalCodes, or Streets), Country, Dependent/DependentPLZ/DependentLocality and FocusOnAutocomplete exactly as described in the detailed reference.

### Print.Remove
Applicable on any element that should be invisible when the form is printed. The CSS classes are the STANDARD: `CodBi_Print_Remove_Tagged` (removes exactly the element), `CodBi_Print_Remove_Parent` (removes the whole parent container/section), `CodBi_Print_Remove_PrintOnly` (print-only elements/buttons). INTERACTIVE/CONTROL elements (navigation/submit buttons, e.g. XButtonList "Weiter"/"Senden"/"Zurück") SHOULD be hidden from the print output by default — they are useless on paper (apply `CodBi_Print_Remove_PrintOnly`). USER DATA / SENSITIVE fields (birth place, address, personal data) must NEVER be hidden proactively — only when the user explicitly asks ("beim Drucken ausblenden" / "hidden when printing"). Use `data-cb-func="Print.Remove"` ONLY when the prompt specifies a parameter for it — e.g. `DocumentSelector` (a dot-prefixed CSS-class selector of the section to remove) or `ParentalLevel`. The functionality is NOT normalized server-side — the AI's choice reaches the designer unchanged.

### Sys.Log.Console
Applicable for debugging; logs CodBi runtime data to the browser developer console. STANDALONE — does NOT need an existing form element. When the prompt asks to log something to the console, create a NEW **invisible XSpan** (the plain-text/HTML element of Formcycle — NEVER invent class names like "XText" or "XButton"; XTextField is an INPUT element, not plain text; the log output "XItem missing 'XText' using XDefault" proves invented names do NOT render) at the top of the first page. List it as a separate item in the root "items" array with EXACTLY this shape:

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

Set data-cb-func="Sys.Log.Console" and data-cb-Data = "SYS.Log.Console > " followed by the text describing what shall be logged (e.g. "SYS.Log.Console > Log the details of the planet Pluto with a saturation of .5").

CRITICAL — When the thing to log is an AI answer (e.g. "logge den KI-Text zu 'Wie wird das Wetter morgen?'"), use the AI.LLAMA.STD.QA EP as the content: data-cb-Data = "SYS.Log.Console > AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;;". The prefix is EXACTLY "SYS.Log.Console > " (dots — NEVER "SYS Log.Console"); keep the EP's trailing "; true;;;;;;".

### DQ.Table.View
Applicable on a container element (e.g. XContainer/XContainerInvisible) to display the result of a Formcycle DataQuery in an injected HTML table and enable exporting it to Excel (.xlsx). USE whenever the user asks to show/view/display the data or the columns of a DataQuery/query/datasource as a table (e.g. "add a table that views the columns Alter, Name of HolaQuery", "zeige die Spalten Alter, Name der Abfrage HolaQuery als Tabelle") and/or export it to Excel — apply data-cb-func="DQ.Table.View" on the container. Use the DataQuery name given by the user AS-IS (do NOT ask whether it exists). If the user does not specify placement, create a NEW container on the first page — do NOT ask; show the columns as-is (no sorting/filtering unless requested). Columns are `label;datacolumn;jsonFlag[;width]` (columns separated by `,`, each entry's parts by `;`) — set the 3rd flag to `true`/`1` to mark a JSON column so its cells show a maximizable JSON viewer, `false`/`0` for plain columns. The Excel export uses the SheetJS library bundled with the plugin and served from the plugin's Resource servlet.
REQUIRES: the columns CSV (data-cb-columns) and the DataQuery name (data-cb-dataquery) — ask the user when missing. A JSON column in data-cb-columns is expressed as `label;datacolumn;true` (e.g. `Details;Details;true`). data-cb-excludecolumns (optional CSV of column names) omits those columns from the Excel-export only. When the user asks for an Excel EXport ("Excel-Export", "export to Excel"), make sure the export is actually available: the export button is only rendered when data-cb-exportbutton matches an existing element, so when no button element is referenced, set data-cb-exportbutton to a selector of a submit-like button on the form (or document that the table is exported via the auto-rendered control); do NOT emit an export request and then omit the parameter that makes the export reachable. Cell content is centered by default; set data-cb-centered="false" to keep cells left-aligned.
CRITICAL — DQ.Table.View is configured with SEPARATE data-cb-* attributes on the container (data-cb-dataquery, data-cb-columns, data-cb-exportbutton, data-cb-excludecolumns, data-cb-centered, data-cb-filename, data-cb-sheetname, data-cb-css). NEVER invent a combined single value like data-cb-Data="HolaQuery;columns=...;export=excel;detailsAsJson=true;excludeExportDetails=true" — that combined form is the Sys.Log.Console pattern and does NOT configure the table. Apply the functionality to an XContainer/XContainerInvisible, never to an XSpan/XText.

### Time.Frame
Applicable ONLY on the BEGIN (minimum) XTextField of type 'time' when there is a second related end time field. The end field is referenced via the 'MaxField' parameter. Do NOT put this functionality on the end time element. EQUALITY: by default the begin time may EQUAL the end time (zero-length slot allowed); only when the end must be STRICTLY after the start (start != end) does this matter — see the TimeFrame classes below (frames 4/5 forbid equality). Both fields accept HH:MM only.

### AI.LLAMA.STANDARD.QA
Answers questions about uploaded images/PDFs via a local llama-server (the answer is placed into the element tagged with the AI_LLAMA_STANDARD_QA_Question class). Triggered when the upload selection changes.
### AI.LLAMA.STANDARD.TXTQA
Answers questions based on the text content of source field(s) (tagged AI_LLAMA_TXTQA_Source) — the answer goes into the element tagged with AI_LLAMA_STANDARD_TXTQA_Question (which carries a data-cb-Question attribute). Triggered when a source field changes.
### AI.LLAMA.STANDARD.TXTVERIFY
Verifies text entered in a field by sending it to a local llama-server together with a verification question (the AI replies with the positive response or a concise explanation of why it is invalid). Triggered on blur; submission is blocked during inference.
### HTML.Input.NoAutocomplete
Deactivates the browser autocomplete for the tagged text input (or all nested inputs).
### HTML.Input.Blacklist
Defines a blacklist of forbidden values (data-cb-List CSV, dates as 2-digit 10.03.2025) that the field may not contain; shows an error listing them (data-cb-Prefix / Postfix / Separator / ShowBlacklist).
### HTML.Input.Trans.Capital
Transforms input to capitalized words (lowercases and uppercases the first letter after a word boundary: start, whitespace or hyphen).
### HTML.Input.Trans.NTW
Transforms a numeric input into its word representation (each digit as a word, dash-separated; data-cb-NumberWords, data-cb-PreFix, data-cb-PostFix).
### HTML.Input.Trans.RegEx
Transforms input via String.replace with data-cb-Extractor (the regular expression) and data-cb-Replacements (the replacement value).
### HTML.Panel.Accordion
Joins the .CodBi.--HTML_Panel descendants INSIDE the tagged container into one accordion set (only one open at a time). Applied by the CodBi_Accordion_A..D standard-config classes on the wrapping CONTAINER (the container itself is not a panel).
### HTML.Select.Favorites
Rearranges an XSelect so the favorite options (data-cb-Favorites) move to the top, with an optional divider (data-cb-Divider / DividerTarget) and an initial selection (data-cb-InitialElement).
### Media.Input.Speech.Whisper
Enables speech-to-text dictation on a text field via a self-hosted Whisper model on the Formcycle server (DSGVO/GDPR compliant — no audio leaves the server).
### Media.MultipleUpload
Enables an <input type=file> to select MULTIPLE files for upload (data-cb-Maximum with the too-many-files messages data-cb-prefixTooMany / data-cb-postfixTooMany).
### OnChange.Conditional
Applies another functionality conditionally when the tagged field's value compares to a reference (data-cb-Reference, Mode GTE/GT/LTE/LT/EQ/NEQ, Target, Candidate, optional DateFormat). The applied attributes are cb_T_* (condition true) / cb_F_* (condition false).
### Security.Captcha.Google
Injects Google reCAPTCHA into a div with the CSS class "g-recaptcha" (data-cb-SiteKey and data-cb-Script are REQUIRED; optional data-cb-DataCallback).
## Element Placeholders

### AI.LLAMA.STD.QA
Acquires the AI response to a question. USE for weather/AI queries. CRITICAL: trailing semicolons for unused params. Example: "{ AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;; }".

### BayVIS.Ansprechpartner.Details
Retrieves details of a BAVARIAN government contact from BayVIS. CRITICAL: BayVIS queries **Bavarian government authorities/offices/contacts** (Behörden) — NOT geographic subdivisions (cantons, districts, Bundesländer). For geographic/political subdivisions across de/at/ch/li/en use OpenPLZ.

### BayVIS.Ansprechpartner.ID
Retrieves the BayVIS contact ID by first & last name. CRITICAL: BayVIS is for **Bavarian government contacts** — NOT for geographic subdivisions.

### BayVIS.Ansprechpartner
Retrieves the whole BayVIS authority directory. CRITICAL: BayVIS is for **Bavarian government contacts** — NOT for geographic/political subdivisions.

### BayVIS.Behoerden.Details.Gebaeude
Retrieves details of a Bavarian authority's building. CRITICAL: BayVIS is for **Bavarian government authorities/offices** — NOT for geographic subdivisions.

### BayVIS.Behoerden.Details
Retrieves details of a Bavarian authority by ID (e.g., "Amt für Digitales"). CRITICAL: BayVIS is for **Bavarian government authorities/offices** — NOT for geographic subdivisions. For Swiss cantons/districts use OpenPLZ; for German Bundesländer use OpenPLZ with FederalStates.

### BayVIS.Behoerden.Gebaeude.ID
Retrieves building IDs of a Bavarian authority. CRITICAL: BayVIS is for **Bavarian government authorities/offices** — NOT for geographic subdivisions.

### BayVIS.Behoerden.ID
Retrieves Bavarian authority IDs by name. CRITICAL: BayVIS is for **Bavarian government authorities/offices** — NOT for geographic subdivisions.

### BayVIS.Behoerden
Retrieves the whole BayVIS authority directory. CRITICAL: BayVIS is for **Bavarian government authorities/offices** — NOT for geographic/political subdivisions.

### Data.CSV
This Element Placeholder turns a CSV-String into an Array < string >.

### Data.Join
Joins the properties of multiple object s into one.

### Date.Arithmetic
This Element-Placeholder turns a String into a Date .

### Date.FromString
This Element-Placeholder turns a String into a Date .

### Date.Holidays
Retrieves GERMAN holidays ("Feiertage") for the requested years/states from API-Feiertage.de. The EP id is ALWAYS `Date.Holidays` — NEVER invent or translate it (there is NO `Feiertage` EP). THE YEAR CANNOT BE GIVEN AS AN EXPLICIT NUMBER (e.g. `2026` — it is NOT a year token) — the code only recognizes `THIS_YEAR` (current year) and `THIS_YEAR +/- N` (relative to the current year, e.g. `THIS_YEAR + 1` = next year); any other token is treated as a German state abbreviation. Parameters (order/case-insensitive): `THIS_YEAR` (with optional +/- arithmetic), a German state abbreviation (bw, by, be, bb, hb, hh, he, mv, ni, nw, rp, sl, sn, st, sh, th), `Friedensfest` (Augsburg), `KATHOLISCH`. Examples: 'Feiertage dieses Jahr' → `{ Date.Holidays > THIS_YEAR }`; 'Feiertage nächstes Jahr' → `{ Date.Holidays > THIS_YEAR + 1 }`; 'Feiertage Bayern dieses Jahr' → `{ Date.Holidays > by ; THIS_YEAR }`. MULTIPLE year tokens are allowed in ONE invocation (parameters separated by `;`): 'Feiertage dieses und nächstes Jahr' → `{ Date.Holidays > THIS_YEAR ; THIS_YEAR + 1 }`.

### Date.Today
Uses processArithmeticParams to modify the Date of today according to the arithmetic operations.

### Date.Weekends
This Element-Placeholder Registers the "Date.Weekend"-EP along with a necessary CSS-Injection in the Document.head .

### DOM.Query
This Element-Placeholder queries an Element .

### F
Finds objects in an Array by exact property value (===). Use for exact value filtering (e.g., postalCode="91522"). Example: "{ F > postalCode ; 91522 ; { sorted > { unique > { openplz.localities > de ; ^a.* }; name }; name } }".

### I
This Element-Placeholder acquires a specific element.

### JSON.Path
This Element-Placeholder retrieves an Object at a specific path out of the one given in the. EXCEPTION: When F is used for exact filtering, F must be outermost — do NOT wrap F in JSON.Path.

### LDAP.Find
Connects to an LDAP directory and returns an Array<object> of matching user entries. Properties: givenName, sn, mail, title, department, telephoneNumber, sAMAccountName, cn, displayName. CRITICAL: returns an ARRAY — use I (indexer) to get a single element, then JSON.Path to extract a property. Do NOT try to pass a property name (like "mail") as the mode parameter — use JSON.Path for property extraction. Parameter 1 must be "AND" or "OR" (the filter mode), nothing else.

### Net.URL
This Element-Placeholder retrieves the content of a URL.

### OpenPLZ.Localities
For cities/towns/localities by name POSIX regex pattern. CRITICAL: Param[2] is a REGEX — use ^An for "starts with An". USE for city queries (not TextSearch). Returns Array<object> — use JSON.Path to extract properties.

### OpenPLZ.OrganizationalUnits
For administrative units (FederalStates, Cantons, etc.). Returns Array<object> — use JSON.Path to extract properties.

### OpenPLZ.Streets
For streets by name/PLZ regex. USE for street queries. ALWAYS THREE parameters: country (empty → "de"), street-name regex (use `.*` for "any street"), postal-code/city regex — e.g. `{ OpenPLZ.Streets > ; .* ; 91522 }`. Returns Array<object> — use JSON.Path to extract properties.

### OpenPLZ.TextSearch
Generic full-text search across ALL data types. USE ONLY when the data type is unclear. For specific city queries, use OpenPLZ.Localities instead. Returns Array<object> — use JSON.Path to extract properties.

### OpenPLZ
Base EP for querying administrative divisions (FederalStates, Cantons, Districts, Municipalities) via OpenPLZ REST API. Returns Array<object> with properties like "name", "officialKey", "type". PARAMETER ORDER: country → unit to retrieve → parent officialKey → sub-detail. Example: "{ OpenPLZ > ch ; Cantons }" for all Swiss cantons; "{ OpenPLZ > ch ; Cantons ; 19 ; Districts }" for districts of canton Zurich. Use JSON.Path to extract a property: "{ json.path > { OpenPLZ > ch ; Cantons ; 19 ; Districts }; name }". CRITICAL: Param[2]=what you want in the result, Param[4]=child units of the parent in Param[3].

### Sorted
Sorts an Array. Returns sorted objects, NOT extracted values. For sorted property values, extract with JSON.Path first: "{ Sorted > { JSON.Path > { OpenPLZ.Localities > de ; ^An } ; name } }".

### Unique
Filters an Array, removing duplicates. Returns filtered objects, NOT extracted values. For unique property values, extract with JSON.Path first: "{ Unique > { JSON.Path > { OpenPLZ > ch ; Cantons } ; name } }".

### V
This Element-Placeholder acquires a global variable's value.

### VP
This Element-Placeholder acquires a value from window.codbiSettings.gv.

## Standard Configurations

### Holistic.CSS.Standard
Registers a standard configuration that applies a standard CSS onto the form.

### Holistic.Matomo.Tracking
Registers a standard configurations using the functionality.
REQUIRES: the Matomo tracking ID (global variable value) — ask the user when missing.

### Holistic.Media.Input.Speech
Registers a standard configuration that applies Speech-to-Text onto every.

### Holistic.Media.Input.Speech.Whisper
Registers a standard configuration that applies Whisper Speech-to-Text onto every.

## People

### CodBi_People_Name
MUST be applied to EVERY first-name/last-name/name field (Vorname, Nachname, Name, ...) — a Vorname AND a Nachname each get their own CodBi_People_Name class. Do NOT apply to street names or localities.

### CodBi_People_Alphanumeric
ONLY for alphanumeric codes/IDs. Do NOT apply to names, streets, localities, or postal codes.

### CodBi_People_Mail
For email addresses.

### CodBi_People_Phone
For phone numbers.

### CodBi_People_PLZ
For German postal codes. Use ALONE — do not combine with other People classes.

### CodBi_People_18plus
For date-of-birth fields (min age 18).

### CodBi_People_16plus
For date fields (min age 16).

### CodBi_People_BuildingNumber
For building/house numbers.

## Fotocropper

### CodBi_Fotocropper_Board
CSS class for the Fotocropper image board.

### CodBi_Fotocropper_Uploader
CSS class for the Fotocropper uploader.

### CodBi_Fotocropper_Update
CSS class for the Fotocropper update control.

### CodBi_Fotocropper_ImageURL
CSS class for the Fotocropper image URL input.

### CodBi_Fotocropper_Foto
CSS class for the Fotocropper photo display.

## OpenPLZ Select

### CodBi_OpenPLZ_Select_*
For OpenPLZ address select dropdowns.

## Financial

### CodBi_Currency
For money/currency fields.
REQUIRES: which currency (e.g. EUR) / the currency global variable value — ask the user when not provided.

## Appointments

### CodBi_NoFutureDate
For date fields that must not allow future dates (maximum = today — the current date itself is a valid value) — e.g. a birth-date field under a "keine zukünftigen Daten" / "no future dates" requirement.

### CodBi_DateFrame_N_Begin / CodBi_DateFrame_N_End
For date ranges (N=1-5): CodBi_DateFrame_N_Begin on the START date field AND CodBi_DateFrame_N_End on the END date field (SAME N — BOTH fields get their own class; NO combined ..._Begin_End class; only on the two date fields, never on a container). Do NOT also add data-cb-func=date.frame.

### CodBi_TimeFrame_N_Begin / CodBi_TimeFrame_N_End
For time ranges (N=1-5): CodBi_TimeFrame_N_Begin on the START time field AND CodBi_TimeFrame_N_End on the END time field (SAME N — BOTH fields get their own class; NO combined ..._Begin_End class; only on the two time fields, never on a container). Do NOT also add data-cb-func=time.frame. EQUALITY: frames 1-3 let start == end (zero-length slot allowed); frames 4 & 5 FORBID equal start/end (end strictly after start). Use frames 4/5 when the user requires the end time to differ from the start, otherwise the lowest unused N.

## LDAP.Autofill

### CodBi_LDAP_AC_*
For LDAP autocomplete fields.

## AI

### AI_LLAMA_CHAT_Input
Textarea for the AI chat widget.

### AI_LLAMA_CHAT_Send
Send button for the AI chat widget.

### AI_LLAMA_CHAT_Stop
Stop button for the AI chat widget.

### AI_LLAMA_CHAT_Upload
Upload field for the AI chat widget.

### AI_LLAMA_CHAT_Thinking
Thinking checkbox for the AI chat widget.

### AI_LLAMA_CHAT_Internet
Internet checkbox for the AI chat widget.

### AI_LLAMA_CHAT_Location
Location checkbox for the AI chat widget.

### AI_LLAMA_CHAT_MailForward
Mail forward checkbox for the AI chat widget.

### AI_LLAMA_CHAT_MailAddress
Email address text field for the AI chat widget.

### AI_LLAMA_CHAT_AlertOnFinish
Alert-on-finish checkbox for the AI chat widget.

### AI_LLAMA_STANDARD_QA_Question
Question field for AI standard QA (FULL name — do NOT shorten).

### AI_LLAMA_STANDARD_TXTQA_Question
Question field for AI standard TXTQA (FULL name — do NOT shorten to AI_LLAMA_TXTQA_Question).

### AI_LLAMA_TXTQA_Source
Source field for AI TXTQA.

### AI_LLAMA_QA_Exclude
Exclusion marker for AI QA.

### AI_OCR_Receiver
Receiver field for AI OCR output.

## UI.Panels

### CodBi_HTML_Panel_Standard
Default standalone collapsible panel. ONLY works on XFieldSet (fieldset), NOT on XContainer or XContainerInvisible. Apply cssclasses=["CodBi_HTML_Panel_Standard"] to EVERY XFieldSet that shall be a collapsible panel — a STANDALONE panel (e.g. the event-registration fieldset) AND every ACCORDION member (see CodBi_Accordion below). NEVER apply it to the accordion's wrapping container (that container only gets CodBi_Accordion_A/B/C/D).

### CodBi_HTML_Panel_Flat
"Flaches Panel" / "Flat Panel" standalone panel. ONLY works on XFieldSet.

### CodBi_HTML_Panel_Index
"Index-Panel" / "Index Panel" standalone panel. ONLY works on XFieldSet.

### CodBi_HTML_Panel_Minimal
"Minimales Panel" / "Minimal Panel" standalone panel. ONLY works on XFieldSet.

### CodBi_Accordion (A to D)
The real accordion group classes are ONLY CodBi_Accordion_A, CodBi_Accordion_B, CodBi_Accordion_C and CodBi_Accordion_D — there is NO class "CodBi_Accordion_A_B_C_D"; NEVER apply it. Put the accordion class (ONE letter) ONLY on the CONTAINER wrapping the collapsible sections (an XContainer — it is NOT a panel and must NOT get any CodBi_HTML_Panel_* class). EVERY member XFieldSet INSIDE that container must carry a panel type class (CodBi_HTML_Panel_Standard/Flat/Index/Minimal) to be collapsible. Example: a wrapper XContainer cssclasses=["CodBi_Accordion_A"] containing three XFieldSet members each cssclasses=["CodBi_HTML_Panel_Standard"].

### CodBi_HTML_Panel_NoCordion
Marker class for panels inside an accordion that should NOT participate in the accordion behavior.

## Print.Removal

### CodBi_Print_Remove_Tagged
CSS class for tagged print removal.

### CodBi_Print_Remove_Parent
CSS class for parent print removal.

### CodBi_Print_Remove_PrintOnly
CSS class for print-only elements.

## BayVIS

### CodBi_BayVIS_Behoerde
CSS class for BayVIS authority fields.

### CodBi_BayVIS_BehoerdeUndAnsprechpartner
CSS class for BayVIS authority + contact fields.

### CodBi_BayVIS_Ansprechpartner
CSS class for BayVIS contact fields.

### CodBi_BayVIS_Auswahl_Behoerden
CSS class for BayVIS authority selection.

## OpenPLZ.AC.SET

### CodBi_OpenPLZ_AC_SET_PLZ
Apply to the POSTAL CODE field of an address group to enable OpenPLZ autocomplete (the server configures OpenPLZ.Autocomplete automatically).

### CodBi_OpenPLZ_AC_SET_Locality
Apply to the LOCALITY/CITY field of an address group to enable OpenPLZ autocomplete.

### CodBi_OpenPLZ_AC_SET_Street
Apply to the STREET field of an address group to enable OpenPLZ autocomplete.

### CodBi_OpenPLZ_AC_SET_BuildingNumber
Apply to the BUILDING NUMBER field of an address group to enable OpenPLZ autocomplete.

## Holistic CSS Classes

### CodBi_XCL_Speech
CSS class for speech-to-text.

### CodBi_XCL_Speech_Whisper
CSS class for Whisper speech-to-text.
