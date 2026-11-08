# CodBi Core Elements (Compact)

Element-only reference: what each functionality, element placeholder, and standard class does, and WHEN to use it. FUNCTIONALITY = something you APPLY to an element (it becomes the element function). ELEMENT PLACEHOLDER (EP) = a VALUE you place INSIDE a parameter of another element - the EP expression { EPName > Param1 ; Param2 } is written into the parameter the consuming element documents for it (HTML.Select.Injection: Values; HTML.Text.Mapper: Replacements; Sys.Log.Console: Data; otherwise the field value) - a parameter name of a DIFFERENT functionality is silently ignored. An EP is NEVER the element you build and NEVER the function. STANDARD CLASS = a styling/configuration class you add to cssclasses.

PASS-1 CONTRACT — every entry below is exactly two things: (1) one sentence saying WHAT it does, (2) a `USE WHEN …` sentence saying which request it maps to. That is all pass-1 needs to CHOOSE an element; the exact parameters, attributes and JSON skeletons are NOT part of this catalog — request them with `{"status":"need_codbi_details","elements":[...],"widgets":[...]}` and they are delivered in the next pass. Read EVERY entry before deciding; when a request matches an entry's `USE WHEN`, name that id in the details request instead of building a workaround (e.g. a regex or a hand-written script).

## Functionalities

### AI.LLAMA.CHAT
Embeds a multi-turn AI chat widget (needs a local LLAMA server from the CodBi settings).
USE WHEN a real chat/KI-Chat window is requested (message history, input, send/stop, file upload) — NOT for a single answered question (that is AI.LLAMA.STANDARD.TXTQA).

### AI.LLAMA.STANDARD.QA
Answers questions about an UPLOADED document/image/PDF (XUpload) with a local AI.
USE WHEN the analysis source is an UPLOADED FILE ("prüfe, was für eine Rechnung hochgeladen wurde", "answer questions about the uploaded document") — never for text the user typed (that is AI.LLAMA.STANDARD.TXTQA).

### AI.LLAMA.STANDARD.TXTQA
Has a local AI answer a question from the TEXT the user typed into other fields and writes the answer into a dedicated display field.
USE WHEN the expected result is OPEN generated content ("beantworten lassen", "let the AI answer", "was für eine Rechnung ist das") — not a pass/fail check (that is AI.LLAMA.STANDARD.TXTVERIFY).

### AI.LLAMA.STANDARD.TXTVERIFY
Verifies ONE field's value with a local AI when the user leaves the field (blur) and shows the verdict as that field's error.
USE WHEN input must be checked against a KNOWN criterion with a pass/fail verdict ("prüfe/validiere ob …", "check whether …", "ob die Summe 9 ergibt") — NOT for a fixed list of forbidden values or dates (that is HTML.Input.Blacklist) and NOT for generating text (TXTQA).

### AI.OCR
Extracts text from uploaded images or PDFs (OCR) and returns it as a value.
USE WHEN the content of an upload must be read as text ("Text aus dem Scan auslesen", "extract the text from the uploaded PDF").

### Date.Frame
Keeps two date fields in a begin/end (min/max) range.
USE WHEN a date RANGE is requested ("Von/Bis", "Kursbeginn/Kursende", "start and end date") — a single bounded date is Date.Min, not a range.

### Date.Min
Enforces a minimum/maximum allowed date on a date field, relative to today (age limit, "not in the past", "from tomorrow on").
USE WHEN dates before a bound must be rejected ("nicht in der Vergangenheit", "mindestens 18 Jahre", "at least X years ago"). NOT for a Cleave-masked date field (HTML.Input.Cleave) — that one bounds its dates with its OWN `DateMin`/`DateMax` parameters. There is no `Date.Max` functionality.

### Date.NoWeekends
Blocks weekend dates in the datepicker.
USE WHEN a booking/appointment/course/delivery date must fall on a weekday ("keine Wochenenden", "no weekends") — NEVER on a birth date.

### Date.Time.Join.Span
Links a begin date+time pair and an end date+time pair so the end datetime must lie after the begin datetime.
USE WHEN TWO date/time PAIRS form one span ("Anfangs- und Endzeitpunkt", "start and end date-time").

### Date.Time.Join
Joins one date field with one time field into a single datetime value.
USE WHEN one date plus one time must be combined ("Datum und Uhrzeit zusammenführen").

### DQ.Table.View
Displays the result of a Formcycle DataQuery as an HTML table and can export it to Excel.
USE WHEN a dataquery result must be shown and/or exported ("Tabelle aus der Abfrage anzeigen", "Excel-Export der Abfrage").

### Form.Navigator
Adds a navigation/progress bar across the form's pages.
USE WHEN the form has 2+ pages and needs page navigation ("Navigationsleiste", "navbar"), optionally with preview of all pages.

### Google.Website.Translator
Embeds the Google website translator into the page.
USE WHEN the whole form/page must be machine-translated by Google ("Google-Übersetzer einbinden").

### HTML.CSS
Injects CSS rules into the page or into a region of it.
USE WHEN CSS rules/properties are requested ("CSS-Regeln", opacity/Durchsichtigkeit, scale/Skalierung, colours, header styling).

### HTML.Input.Blacklist
Rejects a FIXED list of values on an input; with a datepicker those dates are additionally blocked in the picker.
USE WHEN specific VALUES or DATES must not be enterable ("die Werte/Daten 01.12.2026 und 10.12.2026 dürfen nicht eingegeben werden", "must not accept the values X, Y") — the deterministic counterpart of TXTVERIFY for known values.
MESSAGE WIRING — there is NO message parameter: the error is Prefix + List + Postfix (List only with ShowBlacklist=true); with NO dictated message set NONE of these — the built-in message is shown.
MESSAGE MAPPING — ONLY when the user dictates a message, map it: "vor XXX nach" becomes Prefix="vor ", Postfix=" nach", ShowBlacklist=true (XXX = the list position, never literal text).

### HTML.Input.Cleave
Applies input masking/formatting (credit card, phone, IBAN, date) via Cleave.js.
USE WHEN typed input must be MASKED or auto-formatted ("Eingabemaske", "format as phone/IBAN/date"). On a DATE field it ALSO owns the allowed date RANGE: its own `DateMin` / `DateMax` parameters (each in the American dashed form "YYYY-MM-DD") restrict which dates can be entered — use THEM when the request limits the enterable dates ("nur Daten von … bis …", "dates from X to Y") and NEVER Date.Min for such a field.

### HTML.Input.NoAutocomplete
Turns off the browser's autocomplete for an input.
USE WHEN autofill suggestions must be suppressed ("keine Autovervollständigung", "no autocomplete").

### HTML.Input.REGEX
Restricts, validates or reformats the typed characters of a field against a regular expression.
USE WHEN CHARACTERS must be blocked or only certain characters allowed ("darf die Zeichen e$% nicht enthalten", "nur Ziffern") — NOT for a fixed list of whole values or dates (that is HTML.Input.Blacklist).

### HTML.Input.TinyMCE
Turns a textarea into a TinyMCE rich-text (WYSIWYG) editor.
USE WHEN rich-text editing is requested ("Rich-Text-Editor", "WYSIWYG", a formatted story/message).

### HTML.Input.Trans.Capital
Transforms typed input into capitalised words while typing.
USE WHEN entered text must be auto-capitalised ("jedes Wort groß schreiben", "capitalize each word").

### HTML.Input.Trans.NTW
Turns a typed number into words, one word per digit, dash-separated ("123" → "Eins-Zwei-Drei"). Its `NumberWords` parameter holds the ten words (0-9, index = digit) of the TARGET LANGUAGE — write them out in the request's language (Spanish "Cero,Uno,Dos,Tres,Cuatro,Cinco,Seis,Siete,Ocho,Nueve"); optional `PreFix`/`PostFix`.
USE WHEN entered digits must become their WORDS in ANY language ("Ziffern in Wörter", "number to words", "en palabras"). This is NOT HTML.Input.Cleave — Cleave has no NumberWords and must never be used for it. The `CodBi_TRANS_NTW` standard CLASS only knows GERMAN words, so for another language apply this functionality instead.

### HTML.Input.Trans.RegEx
Transforms typed input with a regex replace (extractor → replacement).
USE WHEN typed text must be REFORMATTED by pattern ("Format umwandeln", "Punkte/Leerzeichen entfernen").

### HTML.Panel.Accordion
Makes the panels inside the tagged WRAPPER container mutually exclusive: unfolding one folds the others of the same group. Parameter `Accordion` = the group NAME (required — and every member panel repeats it); the wrapper itself is NOT a panel, and WITHOUT this on the wrapper the members stay independent panels and nothing folds together.
USE WHEN only ONE of several collapsible sections may be open at a time ("Akkordeon") - request it TOGETHER WITH UI.Panels in the same details request. PREFER the class (CodBi_Accordion_A … _D on the wrapper, one group per letter) over this functionality.

### HTML.Panel
Turns a container (XContainer/XContainerInvisible/XFieldSet) into a collapsible panel with a clickable header — generated from `AutoHeaderTitle`, or an existing `CodBi_HTML_Panel_Header` child.
USE WHEN a section must be collapsible ("aufklappbares Panel"). PREFER the classes CodBi_HTML_Panel_Standard/_Flat/_Minimal/_Index — on an XFieldSet (its `legend` is the title) as well as on a container that also carries a non-empty `AutoHeaderTitle`; use this functionality only for a custom look.

### HTML.Select.Favorites
Keeps every option of a select and only MOVES the favourite ones (plus a divider option it INSERTs itself) above the rest; it never adds, removes or filters options.
USE WHEN some existing options shall be prioritised ("Favoriten", "Bayern und Hessen zuerst"), optionally under a divider ("Trenner"), or when the divider shall select a fixed option ("beim Trenner soll X ausgewählt sein") or one option shall be preselected ("X soll anfangs ausgewählt sein") - request Divider/DividerTarget/Favorites/InitialElement and keep ALL options of the select.

### HTML.Select.Injection
Populates a select with one option per entry of an ELEMENT PLACEHOLDER (EP); the EP is a VALUE (in `Values`), NEVER the functionality.
USE WHEN the option list must come from data / a lookup ("Optionen injizieren", "alle Aemter/Behoerden anzeigen", "alle im BayVIS registrierten Aemter", "Behoerdenauswahl", "a select listing all localities", "Kantone der Schweiz") - and also when the matching standard-configuration class is NOT active in this form (an inactive class is inert), then use the raw wiring.

### HTML.SETAttribute
Sets ONE HTML attribute (incl. style) on the element itself at runtime - e.g. title, placeholder, readonly, disabled.
USE WHEN ONE attribute of ONE element must be set in place ("set the title attribute of that field to X", "title-Attribut auf X setzen", "set attribute/style of that field") - also on a field you create in the SAME request. NOT for the Formcycle Help/hint (that is the field property helptext) and NOT for marking a field required (that is required=1).

### HTML.Text.Injector
Puts ONE plain value into an element at a placeholder (default [[INJECTOR_REPLACEMENT]]).
USE WHEN exactly ONE value must be written into a field or span ("Wert einsetzen", a single value) - a text that must CONTAIN data (one or several record properties) is HTML.Text.Mapper, NOT this.

### HTML.Text.Mapper
Fills a text template with the properties of ONE object via [(property)] placeholders.
USE WHEN a text must CONTAIN data ("Text mit den Kontaktdaten von X", "Kontaktblock", name + phone + e-mail) - and request it TOGETHER WITH the element placeholder that supplies the object.

### JSON.SET
Sets a named PROPERTY of the element it is applied to - or of a nested object reached by a dotted Path from it - e.g. style.scale, style.display, style.color, innerHTML; it also stores a hard-coded JSON value in a hidden field.
USE WHEN the request names a PROPERTY of an element as a dotted path ("setze dessen style.scale Eigenschaft auf 2", "style.display auf none", "set innerHTML to ..."): the path splits into Path (all parts but the last, e.g. "style") and Property (the last part, e.g. "scale") - or a hard-coded JSON value must be stored ("JSON speichern"); live field values are combined by a Formcycle calculation field (XFormula), not by this.

### LDAP.Autocomplete.Set
Fills SEVERAL fields of one group from a SINGLE selected LDAP/Active-Directory match (e-mail, first/last name, title, department, phone, account, ...).
USE WHEN one selected person must populate a whole group of fields ("Mitarbeiter auswählen, dann Name/Mail/Telefon übernehmen", "LDAP-Daten übernehmen") - apply it to the CONTAINER and tag the member fields with the CodBi_LDAP_AC_* classes. There is NO LDAP source to select (Formcycle cannot bind an LDAP connection/query to a form element). The LDAP url is decided by the INSTALLATION - see the "LDAP CONFIGURATION" block: omit it when one is configured, ask for it when none is.

### LDAP.Autocomplete
Completes ONE text input from the LDAP/Active Directory and accepts only values that exist there - this is how EVERY input field for an LDAP attribute (employee e-mail, phone, account, name) is built, also when the request never says "autocomplete".
USE WHEN a field must hold an LDAP/Active-Directory value ("Eingabefeld für die E-Mail-Adresse von Mitarbeitern aus dem LDAP") - the attribute named in the request (e-mail → mail) is the property. There is NO LDAP source to select. The LDAP URL is decided by the INSTALLATION (see the "LDAP CONFIGURATION" block): omit it when a url is configured and never ask for one; when NO url is configured it is REQUIRED and belongs to the user, so ask for it.

### Matomo.Tracking
Adds Matomo/Piwik analytics event tracking to the form.
USE WHEN usage tracking with Matomo is requested ("Matomo-Tracking", "Statistik").

### Media.Image.Cropper
Adds an interactive crop dialog before an image is uploaded.
USE WHEN uploaded images must be cropped ("Bild zuschneiden") — a plain preview is the Formcycle `filepreview` property, not this.

### MEDIA.INPUT.SPEECH
Enables speech-to-text dictation into a text field via the browser Web Speech API.
USE WHEN dictation must work without a server-side model ("Spracheingabe", "browser speech").

### Media.Input.Speech.Whisper
Enables speech-to-text dictation via a self-hosted Whisper model (no audio leaves the server).
USE WHEN dictation must run server-side/GDPR-safe ("Whisper", "DSGVO-konforme Spracheingabe").

### Media.MultipleUpload
Lets one upload accept several files.
USE WHEN several files must be uploadable ("mehrere Dateien", "multiple files").

### OnChange.Conditional
Applies another functionality to an element only while a condition on other fields holds.
USE WHEN a check or effect must depend on another field's value ("nur wenn … dann prüfen", "validate only if …").

### OpenPLZ.Autocomplete
German address autocomplete (postal code, locality, street) against OpenPLZ.
USE WHEN a German address group must be autocompleted ("Adresse mit PLZ-Autovervollständigung").

### Print.Remove
Hides the element when the form is printed.
USE WHEN content must not appear on the printout ("beim Drucken ausblenden").

### Security.Captcha.Google
Embeds a Google reCAPTCHA check in the form.
USE WHEN the form needs a Google captcha ("reCAPTCHA", "Spam-Schutz").

### Sys.Log.Console
Logs CodBi runtime data to the browser developer console.
USE WHEN debugging output is requested ("Log-Ausgabe in die Konsole").

### Time.Frame
Keeps two time fields in a begin/end (min/max) order.
USE WHEN a time RANGE is requested ("von/bis Uhrzeit", "start and end time").

## Element Placeholders

An ELEMENT PLACEHOLDER is NEVER the element you build and NEVER the functionality: the EP expression is a VALUE written INSIDE the parameter the consuming element documents for it (HTML.Select.Injection: Values; HTML.Text.Mapper: Replacements; Sys.Log.Console: Data; otherwise the field value) - a parameter name of a DIFFERENT functionality is silently ignored. Request these entries only to learn the exact EP id and its parameters, then wire them into the element that consumes them.

### AI.LLAMA.STD.QA
Returns the AI answer to a question about an uploaded document.
USE WHEN a value must hold the answer of a document question.

### BayVIS.Ansprechpartner.Details
Returns ONE person's complete record OBJECT (vorname, nachname, email and the apTelefon* parts).
USE WHEN a person's contact details must be shown - request it TOGETHER WITH HTML.Text.Mapper, whose [(property)] placeholders are filled from this object. BayVIS data is NEVER a Formcycle datasource: "the contact details from the BayVIS of <name>" needs NO datasource - only this EP chain.

### BayVIS.Ansprechpartner.ID
Resolves a contact's IDs from first and last name (order insensitive) and returns them as an ARRAY.
USE WHEN a NAMED person's record must be fetched - request it TOGETHER WITH BayVIS.Ansprechpartner.Details, which consumes its first ID via { I > 0 ; ... }.

### BayVIS.Ansprechpartner
Reads the BayVIS contact directory, or one property of it, per parameter.
USE WHEN a list of contacts or a single property of the directory is needed.

### BayVIS.Behoerden.Details.Gebaeude
Retrieves the details of an authority's building (the only EP with postal addresses).
USE WHEN an authority's address is needed.

### BayVIS.Behoerden.Details
Retrieves the details of an authority by ID.
USE WHEN authority metadata (designation, type, e-mail) is needed — it has NO phone and NO address.

### BayVIS.Behoerden.Gebaeude.ID
Resolves the building IDs of authorities.
USE WHEN a house-number/building ID chain is needed.

### BayVIS.Behoerden.ID
Resolves authority IDs from a designation (case insensitive).
USE WHEN an authority name must be turned into an ID.

### BayVIS.Behoerden
Reads the BayVIS authority directory (or one property of it, e.g. bezeichnung = the office name) and returns it as a list/value.
USE WHEN a list of authorities or one property of the directory is needed as a VALUE - e.g. as the `Values` entry of HTML.Select.Injection ("{ BayVIS.Behoerden > bezeichnung }", with ReClean on); it is an ELEMENT PLACEHOLDER and belongs in a value parameter, NEVER in the functionality (func) parameter. BayVIS data is NEVER a Formcycle datasource: never set a `datasource` for it and never ask for one.

### Data.CSV
Turns a CSV string into an array.
USE WHEN CSV text must become an array.

### Data.Join
Joins the properties of several objects into one.
USE WHEN values genuinely come from DIFFERENT detail objects — not for a single object.

### Date.Arithmetic
Adds or subtracts a period to/from a date.
USE WHEN a date must be shifted ("in 3 Tagen", "3 days after the date in field X").

### Date.FromString
Parses a string into a date.
USE WHEN a text value must be treated as a date.

### Date.Holidays
Returns the public holidays of the requested year(s).
USE WHEN holiday dates must be considered ("Feiertage").

### Date.Today
Returns today's date, optionally with arithmetic applied.
USE WHEN the current date is needed ("heute", "today").

### Date.Weekends
Registers the weekend EP (plus the CSS injection it needs).
USE WHEN weekend dates must be computed ("Wochenenden").

### DOM.Query
Queries an element from the DOM.
USE WHEN a value must be read from the page/DOM.

### F
Finds the objects within an array that carry a given property value.
USE WHEN a list must be narrowed to the matching entry ("den Eintrag mit … finden").

### I
Acquires one element of an array by index.
USE WHEN a single entry of a list is needed.

### JSON.Path
Retrieves the value at a JSON path of the given object.
USE WHEN a nested JSON value must be read.

### LDAP.Find
Searches an LDAP directory using the default or a given connection.
USE WHEN LDAP data must be fetched for further use.

### Net.URL
Retrieves the content of a URL.
USE WHEN a remote resource must be read.

### OpenPLZ.Localities
OpenPLZ request specialised in searching localities.
USE WHEN localities/cities must be searched.

### OpenPLZ.OrganizationalUnits
OpenPLZ request specialised in retrieving organisational units.
USE WHEN organisational units must be retrieved.

### OpenPLZ.Streets
OpenPLZ request specialised in searching streets.
USE WHEN streets must be searched.

### OpenPLZ.TextSearch
OpenPLZ request performing a full-text search.
USE WHEN a free-text OpenPLZ search is needed.

### OpenPLZ
Retrieves data from the OpenPLZ administrative-units servlet per parameter.
USE WHEN administrative-unit data must be read directly.

### Sorted
Sorts the array passed as the first parameter.
USE WHEN a list must be ordered.

### Unique
Filters duplicates out of the array passed as the first parameter.
USE WHEN a list must be de-duplicated.

### V
Reads the value of a global variable.
USE WHEN a global variable's value is referenced.

### VP
Reads a value from `window.codbiSettings.gv`.
USE WHEN a plugin-setting value must be read.

## Standard Configurations

### AI
Registers the standard configurations/CSS targets used by the AI functionalities.
USE WHEN an AI functionality is applied (targets/classes come from here).

### Appointments
Registers the standard configurations specific to appointment arrangements.
USE WHEN appointment date/time handling and its classes are needed.

### BayVIS
Registers the standard configurations specific to buildings/authorities in BayVIS.
USE WHEN a BayVIS building/authority block is built.

### Financial
Registers the standard configurations specific to financial fields (CodBi_Currency; CodBi_TRANS_NTW = digits to GERMAN words only — any other language uses HTML.Input.Trans.NTW with its own NumberWords).
USE WHEN money/amount fields are built.

### Holistic.CSS.Standard
Applies a standard CSS to the whole form.
USE WHEN the form should get the standard CodBi look.

### Holistic.Matomo.Tracking
Applies Matomo tracking to the whole form via the functionality.
USE WHEN tracking should cover the complete form.

### Holistic.Media.Input.Speech
Applies speech-to-text to every text field of the form.
USE WHEN dictation should be available form-wide (browser speech).

### Holistic.Media.Input.Speech.Whisper
Applies Whisper speech-to-text to every text field of the form.
USE WHEN dictation should be available form-wide (server/Whisper).

### LDAP.Autofill
Registers the standard configurations for LDAP autocompletion on inputs.
USE WHEN LDAP autocompletion is applied.

### OpenPLZ.AC.SET
The four address-part classes of a German address group: CodBi_OpenPLZ_AC_SET_PLZ (postal code), CodBi_OpenPLZ_AC_SET_Locality (locality/city), CodBi_OpenPLZ_AC_SET_Street (street), CodBi_OpenPLZ_AC_SET_BuildingNumber (building number).
USE WHEN the request builds an ADDRESS group — decide by MEANING (any language), then put the matching class on the field that IS that address part. NEVER on a field whose name/label merely contains an address word (a "Wort in Großbuchstaben" capitalisation field, a "Report", an e-mail "...-Adresse"). If the group lacks a street / house-number field, CREATE it. No server-side net does this for you.

### People
Registers the standard classes for people data (first/last name, e-mail, phone, postal code, building number).
USE WHEN person fields are created — each of them MUST carry its People class.

### Print.Removal
Registers the standard configurations that remove elements from the DOM when printing.
USE WHEN elements are hidden for print via the standard classes.

### UI.Panels
Standard classes for collapsible panels and accordions: CodBi_HTML_Panel_Standard/_Flat/_Minimal/_Index (each applies HTML.Panel with a finished look) and CodBi_Accordion_A … _D (each applies HTML.Panel.Accordion to the tagged wrapper container, one group per letter — use the first letter not yet used, only four exist). A panel class fits an XFieldSet (legend = title) AND a container that carries its own non-empty `AutoHeaderTitle`.
USE WHEN panels or accordions are built: PREFER these classes over the HTML.Panel / HTML.Panel.Accordion functionalities; use those directly only when no class is left (A-D used up) or a custom look is requested.
