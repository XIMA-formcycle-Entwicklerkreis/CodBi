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
- HTML.Input.Blacklist: Applicable on a XTextField to blacklist specific values (e.g. dates). Prevents direct input AND jQuery calendar selection of blacklisted items. Use on date fields with datatype="dateDE". The List parameter accepts a CSV of forbidden values (dates must use 2-digit format: DD.MM.YYYY).
- HTML.Input.Cleave: Applicable on a XTextField to apply input masking/formatting (credit card, phone, IBAN, date, etc.) via Cleave.js.
- HTML.Input.REGEX: Applicable on a XTextField to validate or reformat the typed value against a regular expression pattern.
- HTML.Panel: Applicable on any element to wrap it in a collapsible accordion/panel widget.
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

- AI.LLAMA.STD.QA: This Element-Placeholder acquires the AI response to a question.
- BayVIS.Ansprechpartner: This Element-Placeholder retrieves either the whole BayVIS Authority Directory or a specified detail of it from.
- BayVIS.Behoerden.Details: This Element-Placeholder retrieves the details of an authority specified by the provided ID from the corresponding.
- BayVIS.Behoerden.ID: This Element-Placeholder retrieves the IDs of authorities by their "bezeichnung" (case insensitive).
- BayVIS.Behoerden: This Element-Placeholder retrieves the either the wholeBayVIS Authority Directory or a specified detail of it from.
- Data.CSV: This Element Placeholder turns a CSV-String into an Array < string >.
- Data.Join: Joins the properties of multiple object s into one.
- Date.Arithmetic: This Element-Placeholder turns a String into a Date .
- Date.FromString: This Element-Placeholder turns a String into a Date .
- Date.Holidays: The requested years.
- Date.Today: Uses processArithmeticParams to modify the Date of today according to the arithmetic operations.
- Date.Weekends: This Element-Placeholder Registers the "Date.Weekend"-EP along with a necessary CSS-Injection in the Document.head .
- DOM.Query: This Element-Placeholder queries an Element .
- F: Finds the objects within an Array that have a specific property with a specific value.
- I: This Element-Placeholder acquires a specific element.
- JSON.Path: This Element-Placeholder retrieves an Object at a specific path out of the one given in the.
- LDAP.Find: This Elementplaceholder connects via a default (LDAP_URL in CodBi Settings) or an optionally specified.
- Net.URL: This Element-Placeholder retrieves the content of a URL.
- OpenPLZ.Localities: An OpenPLZ -Request specialized into searching for localities.
- OpenPLZ.Streets: An OpenPLZ -Request specialized into searching for streets.
- OpenPLZ.TextSearch: An OpenPLZ -Request performing a full text-search.
- OpenPLZ: Retrieves data from the CodBi_OpenPLZ_Verwaltungseinheiten-Servlet according to the parameter specified.
- Sorted: An Elementplaceholder sorts the Array passed as the 1st parameter in.
- Unique: An Elementplaceholder filters the Array passed as the 1st parameter from duplicates.
- V: This Element-Placeholder acquires a global variable's value.
- VP: This Element-Placeholder acquires a value from window.codbiSettings.gv.
## Standard Configuration Classes

- AI: Registers standard configurations providing targets that're used with.
- Appointments: Registers standard configurations specific to appointment arrangements.
- BayVIS: Registers standard configurations specific to buildings registered in BayVIS.
- Financial: Registers standard configurations specific to finances.
- Holistic.CSS.Standard: Registers a standard configuration that applies a standard CSS onto the form.
- Holistic.Matomo.Tracking: Registers a standard configurations using the functionality.
- Holistic.Media.Input.Speech: Registers a standard configuration that applies Speech-to-Text onto every.
- Holistic.Media.Input.Speech.Whisper: Registers a standard configuration that applies Whisper Speech-to-Text onto every.
- LDAP.Autofill: Registers standard configurations specific to LDAP-Autocompletion in HTMLInputElement s.
- OpenPLZ.AC.SET: Registers standard configurations that binds HTMLInputElements tagged with the.
- People: Registers standard configurations specific to people characteristics.
- Print.Removal: Registers standard configurations that remove HTMLElement s from the DOM.
- UI.Panels: Registers standard configurations providing CodBi-"HTML.Panel"s.
