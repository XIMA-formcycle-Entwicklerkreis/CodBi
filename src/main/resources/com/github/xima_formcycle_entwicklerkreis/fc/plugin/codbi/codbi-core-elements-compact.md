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
When a NEW element is needed only to carry the CSS, use an `XSpan` with `"ishidden":"1"` in its properties (Formcycle Hidden/Ausblenden checkbox CHECKED), `data-cb-func="HTML.CSS"` + `data-cb-css` = the ACTUAL rules, and a descriptive `rtevalue` naming what the CSS does/labels the target (never only a `<style>` block, never empty or generic "HTML.CSS").

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
Applies a functionality / attribute change to a target element while a comparison between a watched field's value and a date reference holds (Mode GT/GTEQ/LT/LTEQ/EQ/NEQ, Reference as a Date EP).
USE WHEN an element must appear/disappear or change a property because a DATE/TIME/NUMBER value is greater/less/equal to a threshold, updating immediately while the user edits ("after/before <date>", "older/younger than", "more/less than <number>", "sobald … nach dem … liegt", "updates immediately while typing"). Use it INSTEAD OF hiddenif* for ordering comparisons; hiddenif* stays for discrete option/checkbox/empty state.

### OnLoad.Conditional
Applies a functionality / attribute change to a target element ONCE AT LOAD while a NUMERIC comparison between an ELEMENT-PLACEHOLDER value and a number reference holds (Mode GT/GTEQ/LT/LTEQ/EQ/NEQ). Registers NO event listener: it reads the value the element placeholders resolved at render time and applies the _T_/_F_ branch immediately.
USE WHEN an element must appear/disappear or change a property at LOAD because a NUMBER computed from an EP result is greater/less/equal to a threshold — e.g. show a panel only when `bayvis.leistungsansprechpartner` returns MORE THAN ONE element: `data-cb-Candidate="{ JSON.Path > { bayvis.leistungsansprechpartner > 25439 } ; length }"`, `data-cb-Reference="1"`, `data-cb-Mode="GT"`. Unlike OnChange.Conditional it does NOT react to a later `change` event and compares NUMBERS (not Dates), so it is the right tool for a load-time "more/less than <number>" on an EP value instead of a field value.

### OpenPLZ.Autocomplete
German address autocomplete (postal code, locality, street) against OpenPLZ.
USE WHEN a German address group must be autocompleted ("Adresse mit PLZ-Autovervollständigung").

### Print.Remove
Hides the tagged element (or the DocumentSelector/ParentalLevel target) when the form is printed; with Invert it hides the element in the interactive form and shows it in print. It only sets style.display="none" - the element is not removed from the DOM.
USE WHEN content must not appear on the printout ("beim Drucken ausblenden") or must appear only on the printout (Invert / "nur im Druck anzeigen").

### Security.Captcha.Google
Embeds a Google reCAPTCHA check in the form.
USE WHEN the form needs a Google captcha ("reCAPTCHA", "Spam-Schutz").

### Sys.Log.Console
Logs CodBi runtime data to the browser developer console.
USE WHEN debugging output is requested ("Log-Ausgabe in die Konsole").
ALWAYS create a NEW hidden XSpan (`"className":"XSpan"`, `"ishidden":"1"` — the Formcycle Hidden/Ausblenden checkbox CHECKED) with a descriptive `rtevalue` in the form's language stating something is output to the console AND what is output (e.g. "Gibt alle im BayVIS registrierten Ämter in der Konsole aus.") and `data-cb-func="Sys.Log.Console"` + `data-cb-Data`. NEVER use a container (XContainer/XContainerInvisible) and NEVER an invented class for this.
When the logged content is an EP result, `data-cb-Data` is the EP placeholder ITSELF with NO "SYS.Log.Console > " prefix — e.g. `data-cb-Data="{ BayVIS.Behoerden > bezeichnung }"` (never `"SYS.Log.Console > { BayVIS.Behoerden > bezeichnung }"`); the "SYS.Log.Console > " prefix is ONLY for free descriptive text.

### SV
Copies URL query parameters into CodBi global variables at form load (Destinations ← Sources, paired by index). The destination must be declared in the top-level "variables" array; apply it on an XContainer/XContainerInvisible/XFieldSet.
USE WHEN a URL parameter must be linked into a global variable for the form/workflow ("URL-Parameter X als globale Variable", "link URL parameter X as a global variable", "read the query parameter into a global variable", "Formularvariable aus URL-Parameter"). NOT the V EP (which only reads a variable).
ALWAYS add a plain documentation XSpan child inside the SV container stating the mapping in the form's language. SINGULAR: "Dieses Element übernimmt den URL-Parameter X in die globale Variable Y." / "This element copies URL parameter X into global variable Y." SEVERAL pairs: write ONE combined, natural sentence — "Dieses Element übernimmt die URL-Parameter A und B in die globalen Variablen X und Y." / "This element copies the URL parameters A and B into the global variables X and Y." (three or more: comma-separated with "und"/"and" before the last) — NOT one separate sentence per pair. The XSpan's `properties` MUST contain `"ishidden":"1"` (the Formcycle Hidden/Ausblenden checkbox CHECKED); do not rely on the surrounding invisible container, and never use `invisible` or a CSS class for this.

### Time.Frame
Keeps two time fields in a begin/end (min/max) order.
USE WHEN a time RANGE is requested ("von/bis Uhrzeit", "start and end time").

## Element Placeholders

An ELEMENT PLACEHOLDER is NEVER the element you build and NEVER the functionality: the EP expression is a VALUE written INSIDE the parameter the consuming element documents for it (HTML.Select.Injection: Values; HTML.Text.Mapper: Replacements; Sys.Log.Console: Data; otherwise the field value) - a parameter name of a DIFFERENT functionality is silently ignored. Request these entries only to learn the exact EP id and its parameters, then wire them into the element that consumes them.

### AI.LLAMA.STD.QA
Returns the AI answer to a FREE question (a knowledge/web question such as "Wie wird das Wetter morgen?") — the generic AI-answer EP. It needs NO uploaded document; analyzing an uploaded file is the AI.LLAMA.STANDARD.QA functionality, never this EP.
USE WHEN a value or another element's parameter must hold the AI's answer to a question ("KI-Antwort", "let the AI answer", "logge die KI-Antwort zu ... in die Konsole aus", "answer this question for me"). It supports internet search AND a NAMED AI SPECIALIST ("mit Cerebras", "von Cerebras beantworten lassen", "let Cerebras answer") — a specialist is a valid setting of this EP, so a request that names one is NOT unclear: request the full EP entry in the detail step and wire it. Do NOT confuse it with the uploaded-document functionality and NEVER ask the user for the answer, for a document or for a specialist that is already named — the EP produces the answer at runtime.

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
Retrieves a building of an authority (the only EP with postal addresses); it requires TWO parameters — authority ID ; building ID — so a call with ONE parameter, or with a building id in the authority slot, is invalid.
USE WHEN an authority's address is needed ("in welchem Gebäude sitzt Amt X"): slot 1 = { I > 0 ; { BayVIS.Behoerden.ID > <designation> } }, slot 2 = { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > <designation> } } } }.

### BayVIS.Behoerden.Details
Retrieves the metadata of ONE authority (resolved from its designation via BayVIS.Behoerden.ID) with an optional property parameter; the ORDER IS FIXED — authority ID first, property second, never swapped.
USE WHEN a SINGLE NAMED authority's field is needed (e-mail, designation, type, group, id, logo) — that is THIS EP, never the directory column; it has NO phone and NO address.

### BayVIS.Behoerden.Gebaeude.ID
Turns the NUMERIC AUTHORITY ID into that authority's building IDs (an ARRAY); it never accepts a designation and yields no authority ID.
USE WHEN the building-ID slot of BayVIS.Behoerden.Details.Gebaeude is needed — a designation such as "Amt 44" is a NAME and its digits are never an ID.

### BayVIS.Behoerden.ID
Resolves authority IDs from an authority's designation (case insensitive), digits included ("Amt 44" is a designation, not an ID).
USE WHEN an authority name must be turned into an ID.

### BayVIS.Behoerden
Reads the WHOLE BayVIS authority directory, or ONE COLUMN of it (e.g. bezeichnung = the office name), as a list; it returns that column for EVERY authority and can never select ONE named authority (whose field comes from BayVIS.Behoerden.Details).
USE WHEN a list of authorities or one column of the directory is needed as a VALUE - e.g. as the `Values` entry of HTML.Select.Injection ("{ BayVIS.Behoerden > bezeichnung }", with ReClean on); it is an ELEMENT PLACEHOLDER and belongs in a value parameter, NEVER in the functionality (func) parameter. BayVIS data is NEVER a Formcycle datasource: never set a `datasource` for it and never ask for one.

### BayVIS.Ansprechpartner.Leistungen
Returns the services (Leistungen) that are assigned to ONE contact as an ARRAY; the contact is addressed by its NUMERIC id, never by a name.
USE WHEN the services of a person are needed ("welche Leistungen bearbeitet <Person>") - chain the id ({ I > 0 ; { BayVIS.Ansprechpartner.ID > <Firstname Lastname> } }) into it and request it together with no other BayVIS EP.

### BayVIS.Behoerden.AbgegebeneLeistungen
Returns the services (Leistungen) that ONE authority has handed over to another authority as an ARRAY; the authority is addressed by its NUMERIC id.
USE WHEN handed-over / abgegebene Leistungen of an authority are wanted ("welche Leistungen hat Amt X abgegeben") - the authority id comes from { I > 0 ; { BayVIS.Behoerden.ID > <designation> } }.

### BayVIS.Behoerden.Ansprechpartner
Returns the contacts (Ansprechpartner) that are assigned to ONE authority as an ARRAY - the per-authority list, NOT the whole contact directory (that is BayVIS.Ansprechpartner).
USE WHEN the contacts of a named authority are needed ("welche Ansprechpartner hat Amt X") - pass the NUMERIC authority id ({ I > 0 ; { BayVIS.Behoerden.ID > <designation> } }) and an optional property (e.g. "nachname", "email").

### BayVIS.Behoerden.Gebaeude.Ansprechpartner
Returns ONE contact that is assigned to a specific BUILDING of an authority; it needs THREE numeric ids that are NOT interchangeable: authority id, building id, contact id.
USE WHEN the contact of one building of one authority is needed - slots: { I > 0 ; { BayVIS.Behoerden.ID > <designation> } } ; { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > <authority id> } } ; { I > 0 ; { BayVIS.Ansprechpartner.ID > <Firstname Lastname> } }, plus an optional property.

### BayVIS.Behoerden.Leistungen
Returns the services (Leistungen) that are assigned to ONE authority as an ARRAY; the authority is addressed by its NUMERIC id.
USE WHEN the services of a named authority are needed ("welche Leistungen sind Amt X zugeordnet") - { I > 0 ; { BayVIS.Behoerden.ID > <designation> } } fills the id, an optional property (e.g. "bezeichnung") the second parameter.

### BayVIS.Dienststellen
Returns the offices (Dienststellen, incl. the Außenstellen) of the OWN authority as an ARRAY, with an optional property and an optional full=true.
USE WHEN the own offices/branch offices must be listed ("alle Dienststellen", "unsere Außenstellen") - e.g. as the Values entry of HTML.Select.Injection with "{ BayVIS.Dienststellen > bezeichnung }".

### BayVIS.Dienststellen.Details
Returns the office(s) of ONE 7-digit office key (dienststellenschluessel) - the main office AND its branch offices that share the key.
USE WHEN one known office key must be resolved ("Dienststelle 0308106") - pass the 7-digit key, then an optional property.

### BayVIS.Dienststellen.Formulare
Returns the forms (Formulare) of ONE office as an ARRAY; the office is addressed by its 7-digit office key.
USE WHEN the forms of an office are needed ("welche Formulare bietet die Dienststelle") - optional second parameter = a property of every form.

### BayVIS.Dienststellen.Lebenslagen
Returns the life situations (Lebenslagen) that are assigned to ONE office as an ARRAY; the office is addressed by its 7-digit office key.
USE WHEN the life situations of an office are needed - optional second parameter = a property, optional third = an 8-digit gemeindekennziffer.

### BayVIS.Dienststellen.Leistungen
Returns the services (Leistungen) of ONE office as an ARRAY; the office is addressed by its 7-digit office key.
USE WHEN the services of an office are needed ("Leistungen der Dienststelle X") - optional second parameter = a property, optional third = an 8-digit gemeindekennziffer.

### BayVIS.Dienststellen.Leistungsbeschreibungen
Returns the service descriptions (Leistungsbeschreibungen) of ONE office as an ARRAY; the office is addressed by its 7-digit office key.
USE WHEN the service descriptions of an office are needed - optional second parameter = a property, optional third = an 8-digit gemeindekennziffer.

### BayVIS.Dienststellen.Onlineverfahren
Returns the online procedures (Onlineverfahren) of ONE office as an ARRAY; the office is addressed by its 7-digit office key.
USE WHEN the online procedures of an office are needed ("welche Verfahren can man online erledigen") - optional second parameter = a property.

### BayVIS.Lebenslagen
Returns every life situation (Lebenslage) published in the BayernPortal as an ARRAY, or ONE property of it.
USE WHEN a list of life situations is needed ("alle Lebenslagen") - e.g. "{ BayVIS.Lebenslagen > bezeichnung }" as the Values entry of HTML.Select.Injection; optional second parameter = an 8-digit gemeindekennziffer.

### BayVIS.Lebenslagen.Details
Returns ONE life situation by its NUMERIC id, with an optional property.
USE WHEN a single, known life situation must be resolved - do NOT use the directory EP for it; optional third parameter = an 8-digit gemeindekennziffer.

### BayVIS.Leistungen
Returns every service (Leistung) published in the BayernPortal as an ARRAY, or ONE property/DOTTED PATH of it. The editorial fields are WRAPPED: the name is `bezeichnung.value` (not `bezeichnung`, which is an object {leittext, position, sichtbar, value}), the life situations are `lebenslagen.lebenslage`, the synonyms `synonyme.synonym.value`.
USE WHEN a list of services is needed ("alle Leistungen", "Leistungen im BayernPortal") - e.g. `{ BayVIS.Leistungen > bezeichnung.value }` for the names (HTML.Select.Injection Values) ; optional second parameter = an 8-digit gemeindekennziffer (e.g. "09162000"). NEVER `> bezeichnung` when TEXT is wanted.

### BayVIS.Leistungen.Details
Returns ONE service by its NUMERIC id (with regional/localized data when a gemeindekennziffer is given), with an optional property.
USE WHEN a single, known service must be resolved - parameters: service id ; optional property ; optional 8-digit gemeindekennziffer.

### BayVIS.Leistungsbeschreibungen
Returns the DETAILS of EVERY service - every Leistungsbeschreibung (full text, weiterführende Links, erforderliche Unterlagen, Formulare, Rechtsgrundlagen, Online-Verfahren) - published in the BayernPortal as an ARRAY, or ONE property of it. This resource is NOT paged, so ONE call returns them all; the "Zuständigkeiten" block (competent authorities and their contacts) is deliberately NOT included.
USE WHEN the details of ALL services are needed ("alle Leistungen mit Details", "alle Leistungsbeschreibungen") - parameters: optional property ; optional 8-digit gemeindekennziffer ; optional "true" for the regional supplements (portal default here is FALSE) ; optional "true" for the internal ids of the sub-objects. For contacts of ONE service use BayVIS.Leistungsbeschreibungen.Ansprechpartner.

### BayVIS.Leistungsbeschreibungen.Details
Returns ONE service description - with the regional supplements and the competent authorities - by the NUMERIC service id, with an optional property.
USE WHEN the full description of one known service is needed - parameters: service id ; optional property ; optional 8-digit gemeindekennziffer.

### BayVIS.Leistungsbeschreibungen.Ansprechpartner
Returns the contacts (Ansprechpartner) that are defined for ONE service (Leistung) as an ARRAY - the API has NO per-service contact resource, the contacts are delivered INSIDE the Leistungsbeschreibung ("Zuständigkeiten" block) and this EP flattens every contact record found there.
USE WHEN the contacts of a Leistung are needed ("welche Ansprechpartner sind für die Leistung X zuständig", "zuständige Stellen der Leistung") - parameters: NUMERIC service id ; selection mode (default DIREKT = only the contacts DIRECTLY assigned to the service, also DIREKTBEVORZUGT / ALLE / NEIN) ; 8-digit gemeindekennziffer (STRONGLY RECOMMENDED - without it the portal delivers no competent authorities at all) ; optional contact property.

### Array.Wrap
Wraps a SINGLE value into an array holding exactly ONE element; an array is passed through unchanged.
USE WHEN a single value/object must be treated as a one-entry list ("in ein Array verpacken", "wrap into an array", "as a list with one entry", ANY language) - e.g. before an EP/functionality that requires an array.

### Array.Slice
Returns a PART of an array from a BEGINNING index (inclusive) to an OPTIONAL END index (exclusive); with only the beginning given the part runs to the end of the array.
USE WHEN a range of a list is wanted ("nur die ersten 5", "the first five", "ab dem 2. Eintrag", "from entry 3 to 7", ANY language).

### Data.CSV
Turns a CSV string into an array.
USE WHEN CSV text must become an array.

### Data.Join
Joins the properties of several objects into one.
USE WHEN values genuinely come from DIFFERENT detail objects — not for a single object.

### Date.Arithmetic
Moves a date by days/months/years in one step (parses a date string, then applies the shift).
USE WHEN a date must be shifted ("in 3 Tagen", "3 days after …", "3 Tage nach dem …", "das Datum … plus/minus …", "a week before …").

### Date.FromString
Turns a date STRING into a date (usable for date arithmetic/comparison/formatting).
USE WHEN a typed/text date must be treated as a date ("01.12.2026 als Datum", "parse this date", "das Datum aus dem Text", "turn … into a date").

### Date.Holidays
Returns the GERMAN public holidays of one or more BUNDESLÄNDER and/or years as a list — the ONLY holiday EP (no state-specific variant, no id composed from a request's words).
USE WHEN public holidays are needed ("Feiertage", "holidays"): one parameter per STATE (bw, by, be, bb, hb, hh, he, mv, ni, nw, rp, sl, sn, st, sh, th) plus the year as THIS_YEAR — e.g. { Date.Holidays > by ; he ; THIS_YEAR }.

### Date.Today
Returns TODAY as a date OBJECT (optionally shifted by days/months/years) — an object that properties or parameterless methods can be read off, NOT a formatted string.
USE WHEN today's date is needed ("heute", "today", "current date") — also when a property or method OF today's date is wanted ("getMonth() von heute", "das Jahr von heute").

### Date.Weekends
Returns the WEEKEND dates (Saturday/Sunday) of a date range as a list of dd.MM.yyyy STRINGS — parameters are plain dd.MM.yyyy strings, NEVER date objects; a bounded range is { Date.Weekends > 01.12.2026 ; 31.12.2026 } (start `;` end).
USE WHEN weekend dates of a range are needed ("Wochenenden", "Samstage und Sonntage", "weekends"): ONE parameter = from TODAY up to that date — { Date.Weekends > 01.12.2026 }; TWO parameters = START `;` END.

### DOM.Query
Queries a RENDERED page element by CSS SELECTOR and returns that element — the EP for acquiring DOM elements; the parameter is a CSS selector (`#<element id>`, `.<element name>`, `header`), NEVER a widget type.
USE WHEN a DOM element must be read/logged ("das Header-Element", "the header element", "den Container", "das Element mit dem Text …").

### F
Narrows a LIST to the entries whose property has one exact value (returns a list).
USE WHEN a list must be reduced to the matching entry/entries ("den Eintrag mit … finden", "das Objekt, dessen … gleich … ist", "filter by …", "only the one where …").

### I
Takes ONE entry out of a list by its 0-based position (index).
USE WHEN the value-producing EP returns an ARRAY and only one entry is wanted ("den ersten Treffer", "the first match", "den ersten Eintrag", "einen der …", "pick one of …").

### JSON.Path
Reads a property — or CALLS a PARAMETERLESS METHOD — of an object that another EP produced, along a dotted path; a segment written `name()` calls the method, `name` reads the property.
USE WHEN a property or a parameterless METHOD of an object must be read out of it ("getMonth()", "toString()", "die Eigenschaft … von …", "extract <property>") — not the object itself.

### LDAP.Find
Searches the LDAP / Active Directory and returns the matching entries; its FIRST parameter is the COMBINING MODE — exactly `AND` or `OR` — and the second holds all `attribute = value` conditions.
USE WHEN values must be fetched FROM the directory ("aus dem LDAP", "from the AD", "Mitarbeiter Salvatore Callari", an LDAP filter): every condition goes into ONE parameter separated by `|`, the combining mode into its own.

### Net.URL
Retrieves the content of a URL.
USE WHEN a remote resource must be read.

### OpenPLZ.Localities
Searches LOCALITIES / cities / towns / places of a country in OpenPLZ.
USE WHEN localities must be searched or suggested ("Ortsvorschläge", "Städte", "cities", "localities") — the country as its 2-letter CODE (de, at, ch, li, en) plus name/postal-code patterns.

### OpenPLZ.OrganizationalUnits
Returns ALL organisational units of ONE KIND for a country — cantons, federal states, provinces, municipalities, districts — as a list, without searching for a name.
USE WHEN such a unit list is wanted ("alle Kantone der Schweiz", "die Bundesländer", "the cantons of Switzerland", "Provinzen", "Gemeinden", ANY language): the country as its 2-letter CODE plus the unit token Cantons / FederalStates / FederalProvinces.

### OpenPLZ.Streets
Searches STREETS of a country in OpenPLZ.
USE WHEN streets must be searched ("Straßen in <PLZ>", "streets in <postal code>").

### OpenPLZ.TextSearch
Performs an OpenPLZ full-text search.
USE WHEN a free-text OpenPLZ search is needed ("Volltextsuche …", "search for …").

### OpenPLZ
The GENERIC OpenPLZ servlet call for a request that itself names explicit query values (country code, orga unit, official key, detail, search parameters) — NOT the EP for "all cantons/states of a country" (that is OpenPLZ.OrganizationalUnits).
USE WHEN such an explicit OpenPLZ lookup is wanted.

### Sort.Numeric
Sorts an array of OBJECTS ASCENDING by a NUMERIC property (unlike the plain `Sorted`, which sorts by the TEXT value) and returns the WHOLE sorted array.
USE WHEN a list must be ordered by a NUMBER field ("nach sortierreihenfolge sortieren", "sort by <numeric field>", "in Zahlenreihenfolge", ANY language). It STILL returns an array - take the first entry with `{ I > 0 ; ... }`.

### Sorted
Sorts the array passed as the first parameter.
USE WHEN a list must be ordered.

### Unique
Filters duplicates out of the array passed as the first parameter.
USE WHEN a list must be de-duplicated.

### URLParameter
Reads the VALUE of ONE URL query-string parameter of the page the form is running in ("?name=value" from the address bar) as a string — empty when the URL does not contain it.
USE WHEN a value must be taken FROM the URL the visitor opened ("den Parameter FRID in der URL", "URL-Parameter", "query parameter", "aus der Adresse", "from the address bar", ANY language) — the parameter NAME goes into the EP; storing such a parameter in a global variable is the SV functionality, not this EP.

### V
Reads the value of a GLOBAL VARIABLE of the form (a field/variable DECLARED on the form, e.g. in the form's variables list or a value produced by the SV functionality / another EP).
USE WHEN the value to output is a FORM GLOBAL VARIABLE, in ANY language the user names it a "globale Variable", "Formularvariable", "form variable", "globale Variablen" (i.e. something declared/stored ON the form itself).

### VP
Reads a value set in the CodBi PLUGIN CONFIGURATION on the server, the value behind a plugin property whose key starts with `GV_` (stored in `window.codbiSettings.gv`).
USE WHEN the value comes from the form/server CONFIGURATION and is NOT a global variable declared on the form - in ANY language a "Plugin-Variable", "Plugin-Einstellung", "Plugin-Property", "plugin setting", "Konfigurationswert der Installation", "GV_...-Wert". CRITICAL: a phrase containing "Plugin" ALWAYS means VP and NEVER the V global-variable EP; only a plain "Variable" / "globale Variable" / form/workflow variable means V.

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
Applies Whisper speech-to-text to every text field of the form (a form-wide standard configuration, activated via {"id":"Holistic.Media.Input.Speech.Whisper","targets":[]} in _codbiApplicability.applied).
USE WHEN dictation should be available form-wide (server/Whisper). For WHISPER ON A SINGLE FIELD use the functionality id data-cb-func="Media.Input.Speech.Whisper" instead — the "Holistic."-prefixed id is NOT a registered functionality and produces no mic button when placed as data-cb-func.

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
