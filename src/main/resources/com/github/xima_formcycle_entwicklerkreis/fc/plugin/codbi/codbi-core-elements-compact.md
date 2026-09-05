# CodBi Core Elements (Compact)

Element-only reference: what each functionality, element placeholder, and standard class does.

## Functionalities

### AI.LLAMA.CHAT
Applicable on a container element to embed an AI chat widget (requires a locally running LLAMA server via CodBi settings).

### AI.LLAMA.STANDARD.QA
The Unique session ID generated on page load â€” ensures each session gets its own llama-server slot and thus.

### AI.LLAMA.STANDARD.TXTQA
Unique session ID generated on page load â€” ensures each session gets its own llama-server slot.

### AI.LLAMA.STANDARD.TXTVERIFY
The Unique session ID generated on page load â€” ensures each session gets its own llama-server slot and thus.

### AI.OCR
Applicable on an XUpload field to extract and return text from uploaded images or PDFs via OCR.

### Date.Frame
For a date range (start/minimum + end/maximum date, e.g. 'Kursbeginn'/'Kursende', 'Start'/'End', 'Von'/'Bis'). A two-field date RANGE is ALWAYS Date.Frame — do NOT model a range as a mere Date.Min. PREFER the standard CSS classes: apply CodBi_DateFrame_N_Begin to the START date field AND CodBi_DateFrame_N_End to the END date field (SAME N — BOTH fields get their own class; there is NO combined CodBi_DateFrame_N_Begin_End class; these classes go ONLY on the two date XTextField fields, never on a container/fieldset). FALLBACK when the classes cannot be used: data-cb-func=date.frame on the BEGIN field only with data-cb-maxfield = dot-prefixed END field name (e.g. .tfKursende) — do NOT put the functionality on the end date element. A Date.Min may be ADDED to the start field, but the range itself still requires the Begin/End frame classes on BOTH fields.

### Date.Min
Applicable on a XTextField of type 'date' to enforce a minimum allowed date (e.g. prevent past dates). BIRTH-DATE FIELDS (Geburtsdatum, Geburtstag, birth date, birthday): NEVER apply data-cb-reverse=true / a FUTURE Date.Min / 'Mindestdatum heute oder morgen' to a birth-date field — a birth date lies in the PAST. A constraint like 'keine Vergangenheitsdaten'/'no past dates'/'no future dates' on a birth date means NO FUTURE DATES → the ONLY valid CodBi behavior is the CodBi_NoFutureDate class (max = today). Do NOT add Date.Min and do NOT add any weekend restriction. A PAST minimum (e.g. 'mindestens 18 Jahre' → minimum=18, unit=y, NO reverse) is valid only when an age limit is requested.

### Date.NoWeekends
Applicable on a XTextField of type 'date' to disallow weekend dates. NEVER apply to a BIRTH-DATE field (Geburtsdatum, Geburtstag, birth date, birthday) — people can be born on any weekday, so a 'keine Wochenenden'/'no weekends' constraint on a birth date must be IGNORED (apply nothing, ask nothing). Only meaningful for future-dated/booking-type dates (course date, appointment, delivery).

### Date.Time.Join.Span
Connects four HTMLInputElement s (a begin date-, a begin time-, an end date- and an end time-field) to.

### Date.Time.Join
Joins the Date of a date-HTMLInputElement with the time of a time-HTMLInputElement.

### DQ.Table.View
The string displayed as the column's header (in the table as well as in the Excel-file).

### Form.Navigator
Applicable on forms with 2 or more pages (multi-step forms); adds a navigation progress bar or breadcrumb tabs. Do NOT apply to single-page forms. PLACEMENT — the navigator must be reachable on EVERY page: create a SEPARATE XContainer (div) and place it inside the form's XHeader or XFooter when one exists; only when there is NO header/footer add it to EVERY page's elements array. NEVER place it on only one page.

### Google.Website.Translator
The Google Website-Translator element-id.

### HTML.CSS
Applicable on any element to inject custom CSS text into the page (with optional placeholder replacements).

### HTML.Input.Blacklist
The Functionality defines a blacklist of values that may not be the value of an HTMLInputElement.

### HTML.Input.Cleave
Applicable on a XTextField to apply input masking/formatting (credit card, phone, IBAN, date, etc.) via Cleave.js.

### HTML.Input.NoAutocomplete
This functionality deactivates the autocomplete for the provided HTMLInputElement .

### HTML.Input.REGEX
Applicable on a XTextField to validate or reformat the typed value against a regular expression pattern.

### HTML.Input.TinyMCE
MANDATORY — it is INVALID to apply HTML.Input.TinyMCE with only data-cb-func and WITHOUT both data-cb-plugins and data-cb-toolbar. Whenever you apply data-cb-func=HTML.Input.TinyMCE to a XTextArea, ALWAYS also emit data-cb-plugins and data-cb-toolbar. For a message/story: data-cb-plugins="advlist, autolink, lists, link, image, media, charmap" and data-cb-toolbar="undo redo | blocks | bold italic underline | bullist numlist | link image media" (do NOT include the raw-HTML 'code' option unless the field is explicitly for HTML source).

### HTML.Input.Trans.Capital
Gets the transformer that converts the input to capitalized words.

### HTML.Input.Trans.NTW
Turns a number into its word representation, separating each digit with a dash.

### HTML.Input.Trans.RegEx
Get the actual transformer that does a String.replace with the toLoad.extractor and.

### HTML.Panel.Accordion
Applicable on a container (XContainer/XFieldSet) that wraps multiple collapsible panels. Joins all child panels with the .CodBi.--HTML_Panel class into an accordion group where only one panel can be open at a time. Set the data-cb-Accordion parameter to a unique group name.

### HTML.Panel
Applicable on any element to wrap it in a collapsible accordion/panel widget. CRITICAL: 'Standard-Panel' and 'aufklappbares/collapsible panel' on a fieldset = XFieldSet + CodBi_HTML_Panel_Standard CSS class + legend property (preferred). Use data-cb-func=html.panel only on a container (not a fieldset).

### HTML.Select.Favorites
Rearranges the HTMLOptionElement within the HTMLSelectElement "toProcess" in order to place the.

### HTML.Select.Injection
This functionality populates a HTMLSelectElement by generating HTMLOptionElement for each.

### HTML.SETAttribute
Applicable on any element to dynamically set one or more HTML attributes on it.

### HTML.Text.Injector
Applicable on XTextField/XTextArea or XSpan to inject a dynamic text value into the element's value. CRITICAL WIRING — data-cb-replacement only reaches the field value when BOTH are set: (1) data-cb-property MUST be set to 'value' on XTextField/XTextArea and 'innerHTML' on XSpan, AND (2) the data-cb-placeholder (default '[[INJECTOR_REPLACEMENT]]') MUST be placed inside the OWN value property of the field (XTextField/XTextArea) or its rtevalue property (XSpan) — e.g. 'value':'[[INJECTOR_REPLACEMENT]]' — otherwise data-cb-replacement never reaches the value. data-cb-func stays 'HTML.Text.Injector' (the FUNCTIONALITY name, never an EP name). To show SEVERAL related BayVIS values together in one place (e.g. a header with an employee's name + phone + e-mail), NEVER create one Injector element per value - use ONE HTML.Text.Mapper whose data-cb-replacements fetches the needed detail object once and whose single template holds all [(property)] placeholders (ONE resolution instead of N).

### HTML.Text.Mapper
Applicable on any element to map object properties to named placeholders in a text template. Placeholder syntax is a PROPERTY name wrapped in "[(...)]" (e.g. [(name)], [(vorname)], [(nachname)], [(mail)]). data-cb-replacements is the object (or array of objects) whose property values fill the [(property)] placeholders and may be an EP placeholder resolving to an object (e.g. "{ BayVIS.Ansprechpartner.Details > ... ; ... }"). CRITICAL — when data-cb-replacements is fed by an EP that returns an OBJECT, use [(property)] placeholders naming the ACTUAL properties of that EP's result object — NEVER the injector placeholder "[[INJECTOR_REPLACEMENT]]" and NEVER a bare raw EP string. The text template with the [(property)] placeholders lives in the field's OWN content property (value/rtevalue via data-cb-property); there is NO data-cb-Template attribute. SEVERAL BAYVIS VALUES SHOWN TOGETHER - to display a person's contact block in ONE place (e.g. a header with employee Salvatore Callari's name + e-mail + phone) do NOT create one element per value; fetch his ONE detail object with data-cb-replacements = { BayVIS.Ansprechpartner.Details > { I > 0 ; { BayVIS.Ansprechpartner.ID > Salvatore Callari } } } (NO Data.Join) and map every requested value to a [(property)] placeholder naming the person object's REAL properties (vorname, nachname, email, zimmer, apEmail, apTelefonLandvorwahl, apTelefonOrtsvorwahl, apTelefonAnlage, apTelefonDurchwahl). A person's phone is NOT a single property - it is split into the apTelefon* parts (there is no phone/telefon property), so compose the phone from them. NEVER read a person's phone from BayVIS.Behoerden.Details - the authority object has NO phone and NO postal address (only bezeichnungBehoerde, behoerdenart, behoerdengruppe, bezeichnung, email, id, sortierreihenfolge, logo, ...); postal addresses live on BayVIS.Behoerden.Details.Gebaeude. Data.Join is needed only when the values genuinely come from DIFFERENT detail objects (e.g. a building address + a person). A single Mapper element resolves ONCE; N Injector elements each resolve their own EP (N requests). data-cb-property is REQUIRED and names the RUNTIME property receiving the mapped text: 'innerHTML' on an XSpan (template stored in the XSpan's Formcycle rtevalue) and 'value' on an XTextArea/XTextField (template stored in the field's Formcycle value) - never 'rtevalue' (Formcycle JSON storage key only, not a runtime DOM property). BayVIS.Behoerden.* may ONLY be used when the request NAMES a Behörde/authority - NEVER invent an authority name: 'BayVIS' is the system/data source, not an authority, so { BayVIS.Behoerden.ID > Bayvis } cannot resolve. A person-only request (an employee's name, no Behörde named) uses BayVIS.Ansprechpartner.Details alone. NEVER fill a BayVIS-derived contact field with invented literal text (e.g. 'Bayvis Straße 1', 'kontakt@bayvis.de', '+49 30 12345678') - the person's real e-mail/phone/name are mapped from { BayVIS.Ansprechpartner.Details > { I > 0 ; { BayVIS.Ansprechpartner.ID > <name> } } } via [(email)]/[(apEmail)], the apTelefon* parts and [(vorname)] [(nachname)] placeholders; hard-coding made-up contact values is a FAIL. A person's FULL record - name AND all contact data (email/apEmail, phone parts apTelefon*) - is BayVIS.Ansprechpartner.Details; BayVIS.Behoerden.Details carries NONE of a person's data and is only for an authority the request names.

### JSON.SET
Applicable on a hidden field to store a JSON-serialized value derived from another element.

### LDAP.Autocomplete.Set
Applicable on form fields that should be auto-filled from a selected LDAP directory match.

### LDAP.Autocomplete
Applicable on a text input that should autocomplete entries from an LDAP directory search.

### Matomo.Tracking
Applicable on any form to add Matomo/Piwik analytics event tracking.

### Media.Image.Cropper
Applicable on an XUpload field for images; adds an interactive crop dialog before upload.

### MEDIA.INPUT.SPEECH
Applicable on a text input field to enable speech-to-text dictation via the Web Speech API.

### Media.Input.Speech.Whisper
Applicable on a text input field or textarea to enable speech-to-text dictation via a self-hosted Whisper model on the Formcycle server. DSGVO/GDPR-compliant as no audio data leaves the server.

### Media.MultipleUpload
Provides the HTML_Select_Injection.functionality .

### OnChange.Conditional
This functionality applies a certain functionality onto the object toProcess depending on whether.

### OpenPLZ.Autocomplete
Applicable on every XTextField (input type=text) within a group of related address fields (postal code, locality/city, street, building number). Tag EACH address field with this functionality and set its own parameters individually. For every tagged field: set TargetData to match its type (Localities, PostalCodes, or Streets), set Country. On the STREET field only: set DependentPLZ to reference the postal code field and DependentLocality to reference the locality/city field. On the POSTAL CODE and LOCALITY fields: set Dependent as the CSS class selector of the corresponding field that gets filled automatically (e.g., on a postal code field set Dependent to the locality field, on a locality field set Dependent to the postal code field). On POSTAL CODE and LOCALITY fields: set FocusOnAutocomplete to the street field. On the STREET field: set FocusOnAutocomplete to the building number field, if one exists.

### Print.Remove
Applicable on any element that should be invisible when the form is printed.

### Security.Captcha.Google
This functionality needs a site key that can be obtained at https://developers.google.com/recaptcha and.

### Sys.Log.Console
Applicable for debugging; logs CodBi runtime data to the browser developer console.

### Time.Frame
Applicable ONLY on the BEGIN (minimum) XTextField of type 'time' when there is a second related end time field. The end field is referenced via the 'MaxField' parameter. Do NOT put this functionality on the end time element.

## Element Placeholders

### AI.LLAMA.STD.QA
This Element-Placeholder acquires the AI response to a question.

### BayVIS.Ansprechpartner.Details
This Element-Placeholder retrieves details of a specific contact from the corresponding CodBi-Plugin servlet.

### BayVIS.Ansprechpartner.ID
This Element-Placeholder retrieves the ID of a contact by first- & last-name (order insensitive).

### BayVIS.Ansprechpartner
This Element-Placeholder retrieves either the whole BayVIS Authority Directory or a specified detail of it from.

### BayVIS.Behoerden.Details.Gebaeude
This Element-Placeholder retrieves the details of an authority's building specified by the provided ID from the.

### BayVIS.Behoerden.Details
This Element-Placeholder retrieves the details of an authority specified by the provided ID from the corresponding.

### BayVIS.Behoerden.Gebaeude.ID
This Element-Placeholder retrieves the IDs of authoritie's buildings by the.

### BayVIS.Behoerden.ID
This Element-Placeholder retrieves the IDs of authorities by their "bezeichnung" (case insensitive).

### BayVIS.Behoerden
This Element-Placeholder retrieves the either the wholeBayVIS Authority Directory or a specified detail of it from.

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
Finds the objects within an Array that have a specific property with a specific value.

### I
This Element-Placeholder acquires a specific element.

### JSON.Path
This Element-Placeholder retrieves an Object at a specific path out of the one given in the.

### LDAP.Find
This Elementplaceholder connects via a default (LDAP_URL in CodBi Settings) or an optionally specified.

### Net.URL
This Element-Placeholder retrieves the content of a URL.

### OpenPLZ.Localities
An OpenPLZ -Request specialized into searching for localities.

### OpenPLZ.OrganizationalUnits
An OpenPLZ -Request specialized into retrieving organizational units.

### OpenPLZ.Streets
An OpenPLZ -Request specialized into searching for streets.

### OpenPLZ.TextSearch
An OpenPLZ -Request performing a full text-search.

### OpenPLZ
Retrieves data from the CodBi_OpenPLZ_Verwaltungseinheiten-Servlet according to the parameter specified.

### Sorted
An Elementplaceholder sorts the Array passed as the 1st parameter in.

### Unique
An Elementplaceholder filters the Array passed as the 1st parameter from duplicates.

### V
This Element-Placeholder acquires a global variable's value.

### VP
This Element-Placeholder acquires a value from window.codbiSettings.gv.

## Standard Configurations

### AI
Registers standard configurations providing targets that're used with.

### Appointments
Registers standard configurations specific to appointment arrangements.

### BayVIS
Registers standard configurations specific to buildings registered in BayVIS.

### Financial
Registers standard configurations specific to finances.

### Holistic.CSS.Standard
Registers a standard configuration that applies a standard CSS onto the form.

### Holistic.Matomo.Tracking
Registers a standard configurations using the functionality.

### Holistic.Media.Input.Speech
Registers a standard configuration that applies Speech-to-Text onto every.

### Holistic.Media.Input.Speech.Whisper
Registers a standard configuration that applies Whisper Speech-to-Text onto every.

### LDAP.Autofill
Registers standard configurations specific to LDAP-Autocompletion in HTMLInputElement s.

### OpenPLZ.AC.SET
Registers standard configurations that binds HTMLInputElements tagged with the.

### People
Registers standard configurations specific to people characteristics.

### Print.Removal
Registers standard configurations that remove HTMLElement s from the DOM.

### UI.Panels
Registers standard configurations providing CodBi-"HTML.Panel"s.
