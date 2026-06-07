# CodBi Core Elements (Compact)

Element-only reference: what each functionality, element placeholder, and standard class does.

### CRITICAL — PANEL CSS CLASSES vs XCONTAINERS
Panel CSS classes (CodBi_HTML_Panel_*) ONLY work on XFieldSet (fieldset), NOT on XContainer or XContainerInvisible. A fieldset has a 'legend' property that becomes the panel header. A container has NO legend — applying a panel CSS class to a container produces a panel WITHOUT a visible title. Therefore, for containers (XContainer, XContainerInvisible) that need to be a panel, ALWAYS use data-cb-func=html.panel via the attributes array with data-cb-generateheader="true" and a data-cb-autoheadertitle. If the user's prompt specifies a title, use that as the data-cb-autoheadertitle value; otherwise generate a descriptive title from the container's content (e.g. "Geburtsdatum" for a date-of-birth section, "Anschrift" for an address section).

### CRITICAL — COLLAPSIBLE XCONTAINERS (UI.Panels)
When the user asks for a collapsible/expandable/foldable container and it is an XContainer (div), use data-cb-func=html.panel via the attributes array. ALSO set data-cb-generateheader="true" and data-cb-autoheadertitle for the title (from the prompt or auto-generated). For XFieldSet (fieldset), use the CSS class CodBi_HTML_Panel_Standard instead — the legend provides the title. Only add data-cb-folded=true if the user explicitly wants the panel to start collapsed.

## Functionalities

- AI.LLAMA.CHAT: Applicable on a container element to embed an AI chat widget (requires a locally running LLAMA server via CodBi settings).
- AI.OCR: Applicable on an XUpload field to extract and return text from uploaded images or PDFs via OCR.
- Date.Frame: Applicable ONLY on the BEGIN (minimum) XTextField of type 'date' when there is a second related end date field. The end field is referenced via the 'MaxField' parameter. Do NOT put this functionality on the end date element.
- Date.Min: Applicable on a XTextField of type 'date' to enforce a minimum allowed date (e.g. prevent past dates).
- Date.NoWeekends: Applicable on a XTextField of type 'date' to disallow weekend dates.
- Form.Navigator: Applicable on forms with 2 or more pages (multi-step forms); adds a navigation progress bar or breadcrumb tabs. Do NOT apply to single-page forms.
- HTML.CSS: Applicable on any element to inject custom CSS text into the page (with optional placeholder replacements).
- HTML.Input.Blacklist: Applicable on a XTextField to blacklist specific values (e.g. dates). Prevents direct input AND jQuery calendar selection of blacklisted items. Use on date fields with datatype="dateDE". The List parameter accepts a CSV of forbidden values (dates must use 2-digit format: DD.MM.YYYY).
- HTML.Select.Favorites: Applicable on a XSelect element to rearrange options so that specified favorites appear at the top, separated by an optional divider. ALWAYS set data-cb-initialElement to the value of the FIRST option to ensure a real option (not the divider) is selected by default. The runtime falls back to this attribute when no config-level initialelement is provided.
- HTML.Select.Injection: Applicable on a XSelect element to dynamically populate it with options from an array. Use this when the user wants a select filled with data from an external source (e.g. all offices from the BayVIS directory). Set data-cb-Values to an Element Placeholder (EP) like "{BayVIS.Behoerden>bezeichnung}" to populate the select at render time. ALWAYS also set data-cb-Titles to the same value as data-cb-Values unless the user specifies different titles.
- HTML.Input.Cleave: Applicable on a XTextField to apply input masking/formatting (credit card, phone, IBAN, date, etc.) via Cleave.js.
- HTML.Input.REGEX: Applicable on a XTextField to validate or reformat the typed value against a regular expression pattern.
- HTML.Panel: Applicable on any element to wrap it in a collapsible accordion/panel widget.
- HTML.SETAttribute: Applicable on any element to set an HTML attribute (e.g. style, class, data-*, aria-*) to a specified value. Parameters: data-cb-Name (attribute name) and data-cb-ToSet (value). Example: to set style="box-shadow: 0 0 1em darkorange" on a text field, add data-cb-func=html.setattribute with data-cb-Name="style" and data-cb-ToSet="box-shadow: 0 0 1em darkorange".
- HTML.Text.Injector: Applicable on any element to replace placeholder text with a dynamic replacement value at runtime. The element's static content (e.g. "rtevalue" for XSpan, "textContent") must keep its placeholder text (default "[[INJECTOR_REPLACEMENT]]") — do NOT replace it with the EP expression. Instead, set data-cb-func="html.text.injector" on the element and configure these parameters via the attributes array: data-cb-property (DOM element property to modify — use "innerHTML" for XSpan content, "textContent" for text nodes, "value" for input fields. CRITICAL: This is a DOM property name, NOT a FORMCYCLE IPersistJson property. Do NOT use "rtevalue" — rtevalue is the FORMCYCLE data model field, not a DOM property. The runtime accesses element[property], so it must be a real HTMLElement property like "innerHTML".), data-cb-placeholder (string to find and replace, defaults to "[[INJECTOR_REPLACEMENT]]"; must be set to the EXACT text found in the element's content, e.g. "[[PH]]" or "##VALUE##"; do NOT use FORMCYCLE's [%fieldname%] syntax), data-cb-replacement (the replacement value, can contain EPs). Example: An XSpan with rtevalue="Aktuelle Daten: [[INJECTOR_REPLACEMENT]]" needs data-cb-func="html.text.injector", data-cb-replacement="{ Data.CSV > { Net.URL > https://example.com/data.csv }}", data-cb-property="innerHTML". The EP expression goes into data-cb-replacement, NOT into rtevalue.
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

Element Placeholders resolve dynamic values at runtime. To use an EP in a CodBi parameter value, wrap it in curly braces with the EP name and optional parameters separated by '>': {EP_Name>param1;param2}. Example: {Date.Holidays>this_year;this_year+1} returns all holidays for the current and next year. EPs can be used in data-cb-* attribute values (e.g. data-cb-List={Date.Holidays>this_year}) where they are resolved to their actual values automatically. EPs can be mixed with regular values in comma-separated attributes — each array element is resolved individually. Example: data-cb-List=01.01.2024,{Date.Holidays>this_year},25.12.2024.

⚠ CRITICAL — CRITICAL — EPs ONLY WORK IN data-cb-* ATTRIBUTE VALUES: Element Placeholders (EPs) like "{ Data.CSV > { Net.URL > ... }}" are ONLY resolved at runtime when placed as values of data-cb-* attributes (e.g. data-cb-replacement="{ Data.CSV > ... }"). They are NOT resolved in form element properties like "rtevalue", "textContent", "label", "legend", or any other IPersistJson element property. If you write "{ Data.CSV > ... }" directly into an element's rtevalue, the user will see the literal text "{ Data.CSV > ... }" in the browser — the EP will NOT be processed. To use EPs for dynamic content, you MUST apply a CodBi functionality via data-cb-func and set the EP as the corresponding data-cb-* parameter value. Example: data-cb-func="html.text.injector" with data-cb-replacement="{ Data.CSV > ... }" — NOT by putting the EP into rtevalue.

EP CHAINING (NESTED EPs): EPs can be nested by placing one EP inside another's parameter section. The inner EP is resolved first, and its result becomes the parameter for the outer EP. This enables powerful data processing pipelines. Example: { Data.CSV > { Net.URL > https://example.com/data.csv }} first calls Net.URL to fetch the CSV content from the URL, then passes the result to Data.CSV which splits the CSV string into an array. The final result (an array of values) can be used directly in data-cb-* attributes like data-cb-replacement or data-cb-Values.

- AI.LLAMA.STD.QA: This Element-Placeholder acquires the AI response to a question.
- BayVIS.Ansprechpartner: This Element-Placeholder retrieves either the whole BayVIS Authority Directory or a specified detail of it from.
- BayVIS.Behoerden.Details: This Element-Placeholder retrieves the details of an authority specified by the provided ID from the corresponding.
- BayVIS.Behoerden.ID: This Element-Placeholder retrieves the IDs of authorities by their "bezeichnung" (case insensitive).
- BayVIS.Behoerden: This Element-Placeholder retrieves the whole BayVIS Authority Directory or a specified property of each entry. Use the syntax {BayVIS.Behoerden>property} to extract a specific property. Valid properties: behoerdenart (authority type), behoerdengruppe (authority group), bezeichnung (name), email (email address), id (unique ID), sortierreihenfolge (sort order). Example: {BayVIS.Behoerden>bezeichnung} returns all authority names. CRITICAL: When using this EP with HTML.Select.Injection, ALWAYS specify a property — {BayVIS.Behoerden} alone returns directory objects and will NOT produce valid option text.
- Data.CSV: This Element Placeholder turns a CSV-String into an Array < string >.
- Data.Join: Joins the properties of multiple object s into one.
- Date.Arithmetic: This Element-Placeholder turns a String into a Date .
- Date.FromString: This Element-Placeholder turns a String into a Date .
- Date.Holidays: Retrieves German holidays for the given year(s). EP syntax: {Date.Holidays>year1;year2;...}. Use "this_year" for current year, "this_year + 1" for next year. Returns an array of holiday Date objects.
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
