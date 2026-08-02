# CodBi Core Elements (Compact)

Element-only reference: what each functionality, element placeholder, and standard class does.

## Functionalities

- AI.LLAMA.CHAT: Applicable on a container element to embed an AI chat widget (requires a locally running LLAMA server via CodBi settings).
- AI.OCR: Applicable on an XUpload field to extract and return text from uploaded images or PDFs via OCR.
- Date.Frame: Applicable ONLY on the BEGIN (minimum) XTextField of type 'date' when there is a second related end date field. The end field is referenced via the 'MaxField' parameter. Do NOT put this functionality on the end date element.
- Date.Min: Applicable on a XTextField of type 'date' to enforce a minimum allowed date (e.g. prevent past dates).
- Date.NoWeekends: Applicable on a XTextField of type 'date' to disallow weekend dates.
- Form.Navigator: Applicable on forms with 2 or more pages (multi-step forms); adds a navigation progress bar or breadcrumb tabs. Do NOT apply to single-page forms.
- HTML.CSS: Applicable on any element to inject custom CSS text into the page (with optional placeholder replacements).
- HTML.Input.Cleave: Applicable on a XTextField to apply input masking/formatting (credit card, phone, IBAN, date, etc.) via Cleave.js.
- HTML.Input.REGEX: Applicable on a XTextField to validate or reformat the typed value against a regular expression pattern.
- HTML.Panel: Applicable on any element to wrap it in a collapsible accordion/panel widget. CRITICAL: "Standard-Panel" = XFieldSet + CodBi_HTML_Panel_Standard CSS class + legend property.
- HTML.SETAttribute: Applicable on any element to dynamically set one or more HTML attributes on it.
- HTML.Text.Injector: Applicable on any element to inject a dynamic text value into a specific property of that element.
- HTML.Text.Mapper: Applicable on any element to map object properties to named placeholders in a text template.
- JSON.SET: Applicable on a hidden field to store a JSON-serialized value derived from another element.
- LDAP.Autocomplete.Set: Applicable on form fields that should be auto-filled from a selected LDAP directory match.
- LDAP.Autocomplete: Applicable on a text input that should autocomplete entries from an LDAP directory search.
- Matomo.Tracking: Applicable on any form to add Matomo/Piwik analytics event tracking.
- Media.Image.Cropper: Applicable on an XUpload field for images; adds an interactive crop dialog before upload.
- MEDIA.INPUT.SPEECH: Applicable on a text input field to enable speech-to-text dictation via the Web Speech API.
- OpenPLZ.Autocomplete: Applicable on every XTextField (input type=text) within a group of related address fields (postal code, locality/city, street, building number). Tag EACH address field with this functionality and set its own parameters individually. For every tagged field: set TargetData to match its type (Localities, PostalCodes, or Streets), set Country. On the STREET field only: set DependentPLZ to reference the postal code field and DependentLocality to reference the locality/city field. On the POSTAL CODE and LOCALITY fields: set Dependent as the CSS class selector of the corresponding field that gets filled automatically (e.g., on a postal code field set Dependent to the locality field, on a locality field set Dependent to the postal code field). On POSTAL CODE and LOCALITY fields: set FocusOnAutocomplete to the street field. On the STREET field: set FocusOnAutocomplete to the building number field, if one exists.
- Print.Remove: Applicable on any element that should be invisible when the form is printed.
- Sys.Log.Console: Applicable for debugging; logs CodBi runtime data to the browser developer console.
- Time.Frame: Applicable ONLY on the BEGIN (minimum) XTextField of type 'time' when there is a second related end time field. The end field is referenced via the 'MaxField' parameter. Do NOT put this functionality on the end time element.
## Element Placeholders (EPs)

- AI.LLAMA.STD.QA: Acquires the AI response to a question. USE for weather/AI queries. CRITICAL: trailing semicolons for unused params. Example: "{ AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;; }".
- BayVIS.Ansprechpartner.Details: Retrieves details of a BAVARIAN government contact from BayVIS. CRITICAL: BayVIS queries **Bavarian government authorities/offices/contacts** (Behörden) — NOT geographic subdivisions (cantons, districts, Bundesländer). For geographic/political subdivisions across de/at/ch/li/en use OpenPLZ.
- BayVIS.Ansprechpartner.ID: Retrieves the BayVIS contact ID by first & last name. CRITICAL: BayVIS is for **Bavarian government contacts** — NOT for geographic subdivisions.
- BayVIS.Ansprechpartner: Retrieves the whole BayVIS authority directory. CRITICAL: BayVIS is for **Bavarian government contacts** — NOT for geographic/political subdivisions.
- BayVIS.Behoerden.Details.Gebaeude: Retrieves details of a Bavarian authority's building. CRITICAL: BayVIS is for **Bavarian government authorities/offices** — NOT for geographic subdivisions.
- BayVIS.Behoerden.Details: Retrieves details of a Bavarian authority by ID (e.g., "Amt für Digitales"). CRITICAL: BayVIS is for **Bavarian government authorities/offices** — NOT for geographic subdivisions. For Swiss cantons/districts use OpenPLZ; for German Bundesländer use OpenPLZ with FederalStates.
- BayVIS.Behoerden.Gebaeude.ID: Retrieves building IDs of a Bavarian authority. CRITICAL: BayVIS is for **Bavarian government authorities/offices** — NOT for geographic subdivisions.
- BayVIS.Behoerden.ID: Retrieves Bavarian authority IDs by name. CRITICAL: BayVIS is for **Bavarian government authorities/offices** — NOT for geographic subdivisions.
- BayVIS.Behoerden: Retrieves the whole BayVIS authority directory. CRITICAL: BayVIS is for **Bavarian government authorities/offices** — NOT for geographic/political subdivisions.
- Data.CSV: This Element Placeholder turns a CSV-String into an Array < string >.
- Data.Join: Joins the properties of multiple object s into one.
- Date.Arithmetic: This Element-Placeholder turns a String into a Date .
- Date.FromString: This Element-Placeholder turns a String into a Date .
- Date.Holidays: The requested years.
- Date.Today: Uses processArithmeticParams to modify the Date of today according to the arithmetic operations.
- Date.Weekends: This Element-Placeholder Registers the "Date.Weekend"-EP along with a necessary CSS-Injection in the Document.head .
- DOM.Query: This Element-Placeholder queries an Element .
- F: Finds objects in an Array by exact property value (===). Use for exact value filtering (e.g., postalCode="91522"). Example: "{ F > postalCode ; 91522 ; { sorted > { unique > { openplz.localities > de ; ^a.* }; name }; name } }".
- I: This Element-Placeholder acquires a specific element.
- JSON.Path: This Element-Placeholder retrieves an Object at a specific path out of the one given in the. EXCEPTION: When F is used for exact filtering, F must be outermost — do NOT wrap F in JSON.Path.
- LDAP.Find: Connects to an LDAP directory and returns an Array<object> of matching user entries. Properties: givenName, sn, mail, title, department, telephoneNumber, sAMAccountName, cn, displayName. CRITICAL: returns an ARRAY — use I (indexer) to get a single element, then JSON.Path to extract a property. Do NOT try to pass a property name (like "mail") as the mode parameter — use JSON.Path for property extraction. Parameter 1 must be "AND" or "OR" (the filter mode), nothing else.
- Net.URL: This Element-Placeholder retrieves the content of a URL.
- OpenPLZ.Localities: For cities/towns/localities by name POSIX regex pattern. CRITICAL: Param[2] is a REGEX — use ^An for "starts with An". USE for city queries (not TextSearch). Returns Array<object> — use JSON.Path to extract properties.
- OpenPLZ.OrganizationalUnits: For administrative units (FederalStates, Cantons, etc.). Returns Array<object> — use JSON.Path to extract properties.
- OpenPLZ.Streets: For streets by name/PLZ regex. USE for street queries. Returns Array<object> — use JSON.Path to extract properties.
- OpenPLZ.TextSearch: Generic full-text search across ALL data types. USE ONLY when the data type is unclear. For specific city queries, use OpenPLZ.Localities instead. Returns Array<object> — use JSON.Path to extract properties.
- OpenPLZ: Base EP for querying administrative divisions (FederalStates, Cantons, Districts, Municipalities) via OpenPLZ REST API. Returns Array<object> with properties like "name", "officialKey", "type". PARAMETER ORDER: country → unit to retrieve → parent officialKey → sub-detail. Example: "{ OpenPLZ > ch ; Cantons }" for all Swiss cantons; "{ OpenPLZ > ch ; Cantons ; 19 ; Districts }" for districts of canton Zurich. Use JSON.Path to extract a property: "{ json.path > { OpenPLZ > ch ; Cantons ; 19 ; Districts }; name }". CRITICAL: Param[2]=what you want in the result, Param[4]=child units of the parent in Param[3].
- Sorted: Sorts an Array. Returns sorted objects, NOT extracted values. For sorted property values, extract with JSON.Path first: "{ Sorted > { JSON.Path > { OpenPLZ.Localities > de ; ^An } ; name } }".
- Unique: Filters an Array, removing duplicates. Returns filtered objects, NOT extracted values. For unique property values, extract with JSON.Path first: "{ Unique > { JSON.Path > { OpenPLZ > ch ; Cantons } ; name } }".
- V: This Element-Placeholder acquires a global variable's value.
- VP: This Element-Placeholder acquires a value from window.codbiSettings.gv.
## Standard Configuration Classes

- Holistic.CSS.Standard: Registers a standard configuration that applies a standard CSS onto the form.
- Holistic.Matomo.Tracking: Registers a standard configurations using the functionality.
- Holistic.Media.Input.Speech: Registers a standard configuration that applies Speech-to-Text onto every.
- Holistic.Media.Input.Speech.Whisper: Registers a standard configuration that applies Whisper Speech-to-Text onto every.
