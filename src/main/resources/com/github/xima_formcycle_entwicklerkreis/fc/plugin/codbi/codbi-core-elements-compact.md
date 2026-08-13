# CodBi Core Elements (Compact)

Element-only reference: what each functionality, element placeholder, and standard class does.

REQUIRED VALUES: Some elements need parameter values or global variables to be configured. Whenever a value is genuinely required and cannot be derived from the user's request, ASK the user for it instead of guessing or inventing one (e.g. the CSS text for HTML.CSS, the regex for HTML.Input.REGEX, the attribute + value for HTML.SETAttribute, the text for HTML.Text.Injector, the tracking ID for Matomo.Tracking, or the global variable value behind a standard configuration).

## Functionalities

### AI.LLAMA.CHAT
Applicable on a container element to embed an AI chat widget (requires a locally running LLAMA server via CodBi settings).

### AI.OCR
Applicable on an XUpload field to extract and return text from uploaded images or PDFs via OCR.

### Date.Frame
Applicable ONLY on the BEGIN (minimum) XTextField of type 'date' when there is a second related end date field. The end field is referenced via the 'MaxField' parameter. Do NOT put this functionality on the end date element.

### Date.Min
Applicable on a XTextField of type 'date' to enforce a minimum allowed date (e.g. prevent past dates).

### Date.NoWeekends
Applicable on a XTextField of type 'date' to disallow weekend dates.

### Form.Navigator
Applicable on forms with 2 or more pages (multi-step forms); adds a navigation progress bar or breadcrumb tabs. Do NOT apply to single-page forms.

### HTML.CSS
Applicable on any element to inject custom CSS text into the page (with optional placeholder replacements).
REQUIRES: the CSS text to inject (ask the user if not provided).

### HTML.Input.Cleave
Applicable on a XTextField to apply input masking/formatting (credit card, phone, IBAN, date, etc.) via Cleave.js.

### HTML.Input.REGEX
Applicable on a XTextField to validate, reformat, or RESTRICT input against a regular expression pattern. USE when the user asks to disallow/block certain characters (e.g. "darf die Zeichen e$% nicht enthalten") — apply data-cb-func="HTML.Input.REGEX" with the forbidden set as a negated character class (data-cb-keyexpression="[^e$%]" blocks the keystrokes, data-cb-expression="^[^e$%]*$" validates the whole value).
REQUIRES: the regex pattern and the mode (validate / restrict / reformat) — ask the user when the pattern cannot be derived.

### HTML.Input.TinyMCE
Applicable on a XTextArea to turn it into a TinyMCE rich-text (WYSIWYG) editor. USE whenever the user asks for a "rich text editor", "WYSIWYG", or rich/formatted text entry for a multi-line text field — apply data-cb-func="HTML.Input.TinyMCE" on the XTextArea (optionally with data-cb-plugins and data-cb-toolbar).

### HTML.Panel
Applicable on any element to wrap it in a collapsible accordion/panel widget. CRITICAL: "Standard-Panel" = XFieldSet + CodBi_HTML_Panel_Standard CSS class + legend property.

### HTML.SETAttribute
Applicable on any element to dynamically set one or more HTML attributes on it, including CSS styling (opacity etc.) via the "style" attribute. USE when the user asks to set an attribute or visual/CSS style of an element (e.g. title, opacity) — set data-cb-name and data-cb-toset.
REQUIRES: the target attribute name (data-cb-name) and the value to set (data-cb-toset) — ask the user when missing.

### HTML.Text.Injector
Applicable on any element to inject a dynamic text value into a specific property of that element.
REQUIRES: the text to inject and the target property — ask the user when missing.

### HTML.Text.Mapper
Applicable on any element to map object properties to named placeholders in a text template.
REQUIRES: the object source and the text template with placeholders — ask the user when missing.

### JSON.SET
Applicable on a hidden field to store a JSON-serialized value derived from another element.
REQUIRES: the JSON expression / derivation rule — ask the user when it cannot be derived.

### LDAP.Autocomplete.Set
Applicable on form fields that should be auto-filled from a selected LDAP directory match.

### LDAP.Autocomplete
Applicable on a text input that should autocomplete entries from an LDAP directory search.

### Matomo.Tracking
Applicable on any form to add Matomo/Piwik analytics event tracking.
REQUIRES: the Matomo site/tracking ID — ask the user when it is not derivable.

### Media.Image.Cropper
Applicable on an XUpload field for images; adds an interactive crop dialog before upload.

### MEDIA.INPUT.SPEECH
Applicable on a text input field to enable speech-to-text dictation via the Web Speech API.

### OpenPLZ.Autocomplete
Applicable on every XTextField (input type=text) within a group of related address fields (postal code, locality/city, street, building number). APPLY the OpenPLZ standard-configuration CSS classes instead of data-cb-func: CodBi_OpenPLZ_AC_SET_PLZ on the postal code field, CodBi_OpenPLZ_AC_SET_Locality on the locality/city field, CodBi_OpenPLZ_AC_SET_Street on the street field, CodBi_OpenPLZ_AC_SET_BuildingNumber on the building number field. The server then configures the OpenPLZ.Autocomplete autocomplete (with TargetData, Country, Dependent, DependentPLZ, DependentLocality, FocusOnAutocomplete) automatically. FALLBACK only when the CSS classes cannot be used: set data-cb-func=openplz.autocomplete on each address field and set the parameters individually — TargetData to match the field's type (Localities, PostalCodes, or Streets), Country, Dependent/DependentPLZ/DependentLocality and FocusOnAutocomplete exactly as described in the detailed reference.

### Print.Remove
Applicable on any element that should be invisible when the form is printed.

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

### DQ.Table.View
Applicable on a container element (e.g. XContainer/XContainerInvisible) to display the result of a Formcycle DataQuery in an injected HTML table and enable exporting it to Excel (.xlsx). USE whenever the user asks to show/view/display the data or the columns of a DataQuery/query/datasource as a table (e.g. "add a table that views the columns Alter, Name of HolaQuery", "zeige die Spalten Alter, Name der Abfrage HolaQuery als Tabelle") and/or export it to Excel — apply data-cb-func="DQ.Table.View" on the container. Use the DataQuery name given by the user AS-IS (do NOT ask whether it exists). If the user does not specify placement, create a NEW container on the first page — do NOT ask; show the columns as-is (no sorting/filtering unless requested). Columns are `label;datacolumn;jsonFlag[;width]` — setting the 3rd flag to `true`/`1` marks a column as containing JSON so its cells show a maximizable JSON viewer. The Excel export uses the SheetJS library bundled with the plugin and served from the plugin's Resource servlet.
REQUIRES: the columns CSV (data-cb-columns) and the DataQuery name (data-cb-dataquery) — ask the user when missing.

### Time.Frame
Applicable ONLY on the BEGIN (minimum) XTextField of type 'time' when there is a second related end time field. The end field is referenced via the 'MaxField' parameter. Do NOT put this functionality on the end time element.

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
The requested years.

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
For streets by name/PLZ regex. USE for street queries. Returns Array<object> — use JSON.Path to extract properties.

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
For a person's name (Vorname, Nachname). Do NOT apply to street names or localities.

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
For date fields that should not allow future dates.

### CodBi_DateFrame_N_Begin_End
For date ranges (N=1-5). Do NOT also add data-cb-func=date.frame.

### CodBi_TimeFrame_N_Begin_End
For time ranges (N=1-5). Do NOT also add data-cb-func=time.frame.

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
Default standalone panel. ONLY works on XFieldSet (fieldset), NOT on XContainer or XContainerInvisible.

### CodBi_HTML_Panel_Flat
"Flaches Panel" / "Flat Panel" standalone panel. ONLY works on XFieldSet.

### CodBi_HTML_Panel_Index
"Index-Panel" / "Index Panel" standalone panel. ONLY works on XFieldSet.

### CodBi_HTML_Panel_Minimal
"Minimales Panel" / "Minimal Panel" standalone panel. ONLY works on XFieldSet.

### CodBi_Accordion_A_B_C_D
Accordion classes (CodBi_Accordion_A/B/C/D) for accordions.

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
