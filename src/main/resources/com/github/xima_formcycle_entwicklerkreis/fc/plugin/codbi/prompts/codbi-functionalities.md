# CodBi Functionalities

Rules for each CodBi functionality (data-cb-func), their parameters, and application conditions.

## GENERIC RULE for all CSS-Selector parameters

When a parameter requires a CSS-Selector referencing another form element, ALWAYS use the target element's properties.name value prefixed with a dot '.' (e.g., '.tfInterviewBis' or '.taAddress'). NEVER use an ID selector (# prefix, e.g., '#xi-tf-interviewbis'), because element IDs are mangled in repeatable containers; only properties.name-based selectors work reliably when CodBi searches within the shared parent container.

## GENERIC REQUIRED-PARAM RULE

Parameters explicitly marked **REQUIRED** below MUST be present on the element (as data-cb-* attributes); parameters marked (optional) may be omitted. Whenever a REQUIRED value is missing from the user's request and cannot be derived, ASK the user for it (clarification) instead of inventing one.

## AI.LLAMA.CHAT

Applicable on a container element to embed an AI chat widget (requires a locally running LLAMA server via CodBi settings).

When the user asks for an AI chat / KI-Chat / chatbot, create all of the following elements:
- XContainer wrapper (fullwidth="1"). Do NOT add data-cb-func="ai.llama.chat" to the container — it goes ONLY on the chat display.
- Chat display: XTextArea (data-cb-func="ai.llama.chat", readonly, fullwidth, autosize, no label). ADD attributes: data-cb-MaxPixelSize="360000", data-cb-maxchatwindowheight="1200".
- User input: XTextArea (cssclasses=["AI_LLAMA_CHAT_Input"], fullwidth, autosize).
- Send button: XButtonList with SINGLE button (cssclasses=["AI_LLAMA_CHAT_Send"], action.page="").
- Stop button: SEPARATE XButtonList with SINGLE button (cssclasses=["AI_LLAMA_CHAT_Stop"], action.page="").
- Upload: XUpload (cssclasses=["AI_LLAMA_CHAT_Upload"], fileextension="image/*,.pdf").
- Thinking checkbox: XCheckbox (cssclasses=["AI_LLAMA_CHAT_Thinking"]).
- Internet checkbox: XCheckbox (cssclasses=["AI_LLAMA_CHAT_Internet"]).
- Location checkbox: XCheckbox (cssclasses=["AI_LLAMA_CHAT_Location"]).
- Alert checkbox: XCheckbox (cssclasses=["AI_LLAMA_CHAT_AlertOnFinish"]).
- Mail container: XContainer containing mail checkbox + mail address field.
- Mail checkbox: XCheckbox (cssclasses=["AI_LLAMA_CHAT_MailForward"]) inside the mail container.
- Mail address: XTextField (cssclasses=["AI_LLAMA_CHAT_MailAddress"], datatype="email") inside the mail container. Set hiddenif="<MailForwardCheckbox_ID>", hiddenifcomp=0 and hiddenifclear="false" as DIRECT properties.

CRITICAL — Distinguish from Form Chatbot Plugin (XIMA Chatbot): Use XNavigationBar for XIMA mentioned navigation. Use CodBi ai.llama.chat ONLY when "CodBi KI-Chat" is explicitly mentioned.

## AI.OCR

Applicable on an XUpload field to extract and return text from uploaded images or PDFs via OCR.
- **REQUIRED**: Mode ("print" or "verify").
- Mode="print": do NOT set data-cb-Field on the upload. The receiver text field is identified by its CodBi_AI_OCR_Receiver CSS class.
- Mode="verify": **REQUIRED** to set Pattern, RegExFlags, WrongFileMessage, InvalidImageText (ALL five for verify).

## Date.Frame

Applicable ONLY on the BEGIN (minimum) XTextField of type 'date' when there is a second related end date field. The end field is referenced via the 'MaxField' parameter. Do NOT put this functionality on the end date element.
**REQUIRED**: data-cb-maxfield = the END (maximum) date field's name. The begin field is the tagged element.

CSS-CLASS VARIANT — when the standard-configuration CSS classes are used instead of data-cb-func, apply `CodBi_DateFrame_N_Begin` to the BEGIN date field AND `CodBi_DateFrame_N_End` to the END date field (BOTH fields get their own class, with the SAME frame number N). There is NO combined `CodBi_DateFrame_N_Begin_End` class — never invent it. Never apply these classes to a container/fieldset — only to the two date fields. A two-field date RANGE (Start/End, Von/Bis, Kursbeginn/Kursende) is ALWAYS Date.Frame — do NOT model a range as a mere Date.Min; a Date.Min may be added to the BEGIN field, but the range itself still requires Begin on the START field AND End on the END field.

## Date.Min

Applicable on a XTextField of type 'date' to enforce a minimum allowed date (e.g. prevent past dates).
**REQUIRED — data-cb-minimum (MANDATORY, never emit Date.Min without it):** the minimum value as a digit string, plus data-cb-unit (d/w/m/y, default y).
- PAST minimum (e.g. "at least 18 years old", "mindestens 18 Jahre"): data-cb-minimum="<N>" + data-cb-unit="y" (or d/w/m). Do NOT set data-cb-reverse (defaults to past).
- FUTURE minimum (e.g. "at least tomorrow", "ab morgen", "from tomorrow on", "no past dates"): data-cb-minimum="<N>" + data-cb-unit="d" (or w/m/y) + data-cb-reverse="true".
  - "at least tomorrow" / "ab morgen" → data-cb-minimum="1", data-cb-unit="d", data-cb-reverse="true".
  - "today or later" / "no past dates" / "not in the past" → data-cb-minimum="0", data-cb-unit="d", data-cb-reverse="true".
- BIRTH-DATE FIELDS (labels "Geburtsdatum", "Geburtstag", "birth date", "date of birth", "birthday"): a birth date ALWAYS lies in the PAST and must NEVER be treated as a future-dated field. Under NO circumstances apply a FUTURE minimum (data-cb-reverse=true, "heute"/"morgen", "no past dates") to a birth-date field — the constraint "keine Vergangenheitsdaten"/"no past dates"/"no past dates allowed" is CONTRADICTORY for it and means the OPPOSITE: only PAST dates are valid, i.e. NO FUTURE dates (maximum = today; the current date itself is a VALID birth date). Do NOT ask "Mindestdatum heute oder morgen?" for a birth-date field; only a PAST minimum (e.g. "mindestens 18 Jahre" → data-cb-minimum="18", data-cb-unit="y", no data-cb-reverse) is legitimate, and only when an age limit is requested. WHEN a birth-date field is grouped with genuinely future-dated fields under one "keine Vergangenheitsdaten" constraint (e.g. "Geburtsdatum, Kursbeginn"): EXCLUDE the birth-date field from the "heute oder morgen" question entirely — apply the future minimum (data-cb-reverse=true) ONLY to the future-dated field(s) (e.g. "Kursbeginn" = morgen) and apply maximum=heute to the birth-date field WITHOUT asking. Ask the future-minimum question ONLY for genuinely future-dated fields and NEVER when a birth-date field is among the affected fields. When the only requirement for a birth-date field is "no future dates" (or the contradictory "keine Vergangenheitsdaten"), apply the CodBi_NoFutureDate CSS class (max = today, today included) to the field — NEVER leave a birth-date field without any date restriction.

Ask the user for the minimum when not specified, then encode it EXACTLY as above (example: {"text":"data-cb-func","value":"Date.Min"}, {"text":"data-cb-minimum","value":"1"}, {"text":"data-cb-unit","value":"d"}, {"text":"data-cb-reverse","value":"true"}).

## Date.NoWeekends

Applicable on a XTextField of type 'date' to disallow weekend dates.

CRITICAL — NEVER apply Date.NoWeekends to a BIRTH-DATE field (labels "Geburtsdatum", "Geburtstag", "birth date", "date of birth", "birthday"): people can be born on any day of the week, so a weekend restriction is senseless there. A constraint like "keine Wochenenden" / "no weekends" on a birth date must be IGNORED for that field (do NOT apply the functionality and do NOT ask about it). Date.NoWeekends is only meaningful for future-dated/booking-type date fields (e.g. a course date, appointment date, delivery date).

## Date.Today

Supports arithmetic directly — do NOT wrap it in Date.Arithmetic. Use "{ Date.Today > +1d }" for tomorrow, "{ Date.Today > -1d }" for yesterday. Arithmetic: +N d/m/y (add), -N d/m/y (subtract).

## Date.FromString

Turns a date string into a Date object. Use for any prompt about converting/parsing a date string. Example: "{ Date.FromString > 01.12.1978 }". Optional second param sets the format.

## Form.Navigator

Applicable on forms with 2 or more pages (multi-step forms); adds a navigation progress bar or breadcrumb tabs. Do NOT apply to single-page forms.

CRITICAL — Form.Navigator AUTO-GENERATES navigation buttons. Create a SEPARATE XContainer (div) for the nav bar — do NOT put data-cb-func=form.navigator on XPage elements. XPage is not a div and the functionality requires HTMLDivElement. PLACEMENT — the navigation must be reachable on EVERY page: when the form HAS an XHeader or XFooter, ALWAYS place the navigator container inside the XHeader (or XFooter) so it is visible on all pages — never inside a specific page's content. Only when the form has NO header and NO footer, add the container to EVERY page's elements array. NEVER place it on only one page — a navigator that is only visible on a single page is useless.

CRITICAL — Distinguish from XNavigationBar plugin: Use data-cb-func=form.navigator ONLY when the prompt mentions "CodBi Navbar" or "CodBi Navigation". When the prompt mentions "XIMA Navigationsleiste", "XIMA navbar", "FORMCYCLE navbar", "Navigationsleiste", "Progress Bar", "FC-Navbar", or "formcycle navigation bar", use className="XNavigationBar" instead.

## HTML.CSS

Applicable on any element to inject custom CSS text into the page (with optional placeholder replacements).
**REQUIRES**: the CSS text to inject (data-cb-css) — ask the user when not provided.

## HTML.Input.Cleave

Applicable on a XTextField to apply input masking/formatting (credit card, phone, IBAN, date, etc.) via Cleave.js.
**REQUIRES**: the mask/format to apply (credit card, phone, IBAN, date, …) — ask the user when not specified.

## HTML.Input.REGEX

Applicable on a XTextField to validate, reformat, or RESTRICT the typed value against a regular expression pattern.

CRITICAL — USE THIS FUNCTIONALITY whenever the user asks to disallow/block/prevent certain characters from being typed into an input field (input restriction / character blacklist). Examples: "darf die Zeichen e$% nicht enthalten", "soll die Eingabe von e, $ und % verhindern", "does not allow the input of the characters e$%", "block the characters ...". This is the ONLY CodBi functionality for blocking characters — do NOT use HTML.Input.Cleave or any CSS class for this.

To BLOCK characters, express the forbidden set as a NEGATED character class `[^…]` (matches any character EXCEPT the listed ones) and set the parameters on the XTextField via the attributes array:
- data-cb-func = "HTML.Input.REGEX"
- data-cb-keyexpression = **REQUIRED** — the per-keystroke pattern every typed character must comply with → negated class, e.g. "[^e$%]" (prevents typing e, $ and %)
- data-cb-expression = **REQUIRED** — the whole-value pattern the final value must comply with → "^[^e$%]*$" (the complete value may contain any characters except e, $ and %)
- data-cb-flags = (optional) regex flags, e.g. "g"

Example — an input field that must not allow the characters e, $ and %:
"attributes": [{"text":"data-cb-func","value":"HTML.Input.REGEX"},{"text":"data-cb-keyexpression","value":"[^e$%]"},{"text":"data-cb-expression","value":"^[^e$%]*$"}]

CRITICAL — Inside a character class `$` is a LITERAL dollar sign (NOT the end-of-string anchor) and `.` is a literal dot, so `[^e$%]` really blocks e, $ and %. Regex metacharacters that must be blocked literally (e.g. `]`, `\`, `^` inside a class) still need to be escaped.

## HTML.Input.TinyMCE

Applicable on a XTextArea to turn it into a TinyMCE rich-text (WYSIWYG) editor.

MANDATORY — it is INVALID to emit data-cb-func="HTML.Input.TinyMCE" WITHOUT also setting data-cb-plugins and data-cb-toolbar; the editor would render without any formatting tools. BOTH params MUST accompany the func, always.

CRITICAL — USE THIS FUNCTIONALITY whenever the user asks for a "rich text editor", "WYSIWYG editor", or rich/formatted text entry for a multi-line text field (e.g. "a field to write a story / message with a rich text editor"). Turn the XTextArea into a TinyMCE editor and ALWAYS set BOTH attributes (never omit them):
- data-cb-func = "HTML.Input.TinyMCE"
- data-cb-plugins = CSV of the TinyMCE plugins the editor needs — decide YOURSELF which plugins are useful for the field's content.
- data-cb-toolbar = the TinyMCE toolbar string — decide YOURSELF which tools are useful for the field's content.

DECIDE THE TOOLBAR/PLUGINS YOURSELF — pick the tools that are USEFUL for what the field is for:
- A message / story / free-text editor → text editing + media insertion: plugins "advlist, autolink, lists, link, image, media, charmap" and toolbar "undo redo | blocks | bold italic underline | bullist numlist | link image media".
- Do NOT include raw HTML / source-code editing (the "code" plugin and the "code" toolbar button) for an ordinary message/story field — HTML editing is not useful for an end user writing a message.
- Only add "code" / HTML source options when the field is explicitly meant to hold custom HTML (e.g. a "HTML-Quelltext" / "HTML source" field).

Example — a "message" textarea that becomes a rich text editor for writing a message:
"attributes": [{"text":"data-cb-func","value":"HTML.Input.TinyMCE"},{"text":"data-cb-plugins","value":"advlist, autolink, lists, link, image, media, charmap"},{"text":"data-cb-toolbar","value":"undo redo | blocks | bold italic underline | bullist numlist | link image media"}]

## HTML.Panel

Applicable on any element to wrap it in a collapsible accordion/panel widget.

PREFER THE STANDARD CSS CLASSES (see UI.Panels) — they need NO data-cb-* parameters and cover the common panel/accordion cases. Choose the class by what the prompt says about the panel:
- A single standalone collapsible panel → CSS class CodBi_HTML_Panel_Standard on the XFieldSet; the fieldset's 'legend' becomes the panel title.
- Multiple collapsible sections where ONLY ONE may be open at a time (accordion / mutually exclusive) → give EACH collapsible fieldset BOTH classes: the accordion membership class CodBi_Accordion_A (or B/C/D — use the SAME letter on every member) AND a panel type class (CodBi_HTML_Panel_Standard for top-level panels, Flat/Minimal for nested levels). The accordion class alone only says which group a panel belongs to — it does NOT make the fieldset collapsible, so the panel type class is REQUIRED on every member. The accordion keeps exactly one member open. Panels default to UNFOLDED (open), so the member that must be open at the start (e.g. "am Anfang ... aufgeklappt") needs NO data-cb-folded; set data-cb-folded="true" on every OTHER member that shall start folded/closed. NEVER use data-cb-open — that parameter does not exist.
- A panel that must NOT join the accordion behavior → CSS class CodBi_HTML_Panel_NoCordion on that panel.
- Panels by NESTING DEPTH → CodBi_HTML_Panel_Standard at the top (1st level), CodBi_HTML_Panel_Flat for a panel nested inside a panel (2nd level), CodBi_HTML_Panel_Minimal for a panel two levels deep (3rd level); deeper levels repeat Standard → Flat → Minimal.
- An index-like panel (like a book index / table of contents, numbered unfoldable sections e.g. "1. Your Info, 2. Describe Your Issue, 3. Upload Files") → CodBi_HTML_Panel_Index.

MUTUALLY EXCLUSIVE — NEVER put BOTH a UI.Panels standard class (CodBi_HTML_Panel_Standard/Flat/Index/Minimal, CodBi_Accordion_A/B/C/D, CodBi_HTML_Panel_NoCordion) AND data-cb-func=html.panel on the SAME element. The standard classes already apply HTML.Panel internally, so an element uses exactly ONE of the two: the standard class (preferred) OR data-cb-func=html.panel (only for container panels / non-standard panels).

CRITICAL — Panel CSS classes ONLY work on XFieldSet (fieldset), NOT on XContainer or XContainerInvisible. A fieldset has a 'legend' property that becomes the panel header. A container has NO legend — applying a panel CSS class to a container produces a panel WITHOUT a visible title.

Use data-cb-func=html.panel ONLY when no standard class matches the requirement (e.g. a collapsible panel on an XContainer/XContainerInvisible, or a non-standard header/custom CSS/animation). Then these parameters are MANDATORY — never emit data-cb-func=html.panel without them:
- data-cb-generateheader="true" — the clickable panel header must be generated.
- data-cb-autoheadertitle="<title>" — the header text (use the panel/group title from the prompt).
- For an accordion built manually: data-cb-accordion="true" on every member plus data-cb-folded (false = open initially, true = folded). Exactly one member may be open initially.

## HTML.SETAttribute

Applicable on any element to dynamically set one or more HTML attributes on it, including CSS styling via the "style" attribute.

USE THIS FUNCTIONALITY whenever the user asks to set an attribute or a visual/CSS style of an element — e.g. "set the title attribute of that input field to 'Holla die Waldfee'", "set the opacity of that input field to .5", "set the element's background color", "make the field readonly/disabled". Parameters:
- data-cb-name = **REQUIRED** — the attribute to set (e.g. "title", "placeholder", "readonly", "disabled", or "style" for CSS styling)
- data-cb-toset = **REQUIRED** — the value to set the attribute to (e.g. "Holla die Waldfee", "opacity: 0.5")

Example — an input field whose title attribute is set to "Holla die Waldfee":
"attributes": [{"text":"data-cb-func","value":"HTML.SETAttribute"},{"text":"data-cb-name","value":"title"},{"text":"data-cb-toset","value":"Holla die Waldfee"}]

CRITICAL — When MORE THAN ONE functionality applies to the SAME element (e.g. character blocking AND setting an attribute), combine them in ONE comma-separated data-cb-func value and set every parameter as its own data-cb-* attribute — do NOT create several data-cb-func entries or duplicate elements. Example: data-cb-func="HTML.Input.REGEX,HTML.SETAttribute" with data-cb-keyexpression, data-cb-expression, data-cb-name and data-cb-toset all set.

## HTML.Text.Injector

Applicable on any element to inject a dynamic text value into a specific property of that element. **REQUIRED**: data-cb-replacement (the EP expression AS-IS — do NOT resolve it), data-cb-placeholder (the placeholder string verbatim), and data-cb-property (default "innerHTML"). Keep the element's rtevalue unchanged.

## HTML.Text.Mapper

Applicable on any element to map object properties to named placeholders in a text template.
**REQUIRES**: the object source and the text template with placeholders — ask the user when missing.

## HTML.Select.Favorites

CRITICAL — When applying this functionality you MUST also add a data-cb-initialElement attribute to the XSelect's attributes array. Set its value to the value property (NOT the display text) of the FIRST option.

## JSON.SET

Applicable on a hidden field to store a JSON-serialized value derived from another element. JSON.SET fallback only on explicit user request.
**REQUIRES**: the JSON expression / derivation rule — ask the user when it cannot be derived.

## LDAP.Autocomplete.Set

Applicable on form fields that should be auto-filled from a selected LDAP directory match.

## LDAP.Autocomplete

Applicable on a text input that should autocomplete entries from an LDAP directory search.

## Matomo.Tracking

Applicable on any form to add Matomo/Piwik analytics event tracking. **REQUIRES**: the Matomo site/tracking ID (SiteID) — ask the user when not provided. When the prompt says "Matomo-Tracking aktivieren" or "activate Matomo tracking" without specifying a SiteID, do NOT add Matomo.Tracking functionality via data-cb-func on any element. Instead, include {"id":"Holistic.Matomo.Tracking","targets":[]} in _codbiApplicability.applied — the server reads this and activates the standard configuration.

## Media.Image.Cropper

Applicable on an XUpload field for images; adds an interactive crop dialog before upload. CRITICAL — apply to the XUpload whenever the request asks for an upload with a cropper ("Bild-Cropper", "with crop", "Upload-Feld für den Personalausweis mit Bild-Cropper"): set data-cb-func="Media.Image.Cropper" (or a CodBi_Fotocropper_* class) on that XUpload. NEVER omit it.

## MEDIA.INPUT.SPEECH

Applicable on a text input field to enable speech-to-text dictation via the Web Speech API.

## OpenPLZ.Autocomplete

Applicable on every XTextField (input type=text) within a group of related address fields (postal code, locality/city, street, building number).

PREFERRED — apply the OpenPLZ standard-configuration CSS classes instead of data-cb-func:
- CodBi_OpenPLZ_AC_SET_PLZ on the postal code field.
- CodBi_OpenPLZ_AC_SET_Locality on the locality/city field.
- CodBi_OpenPLZ_AC_SET_Street on the street field.
- CodBi_OpenPLZ_AC_SET_BuildingNumber on the building number field.
The server configures OpenPLZ.Autocomplete (TargetData, Country, Dependent, DependentPLZ, DependentLocality, FocusOnAutocomplete) automatically for each class.

FALLBACK (only when the CSS classes cannot be used): tag EACH address field with data-cb-func=openplz.autocomplete and set the parameters individually. **REQUIRED for every tagged field**: TargetData (Localities, PostalCodes, or Streets — matching the field's type) and Country. On the STREET field only: set DependentPLZ and DependentLocality. On the POSTAL CODE and LOCALITY fields: set Dependent as the CSS class selector of the corresponding field, set FocusOnAutocomplete to the street field. On the STREET field: set FocusOnAutocomplete to the building number field, if one exists.

CRITICAL — OpenPLZ.Autocomplete must be applied to ALL address fields in EVERY address group, regardless of which plugin/system they come from. Either via the CodBi_OpenPLZ_AC_SET_* CSS classes (preferred) or via data-cb-func with ALL required parameters (Country, TargetData, Dependent, FocusOnAutocomplete) set on each address field.

## Print.Remove

Applicable on any element that should be invisible when the form is printed. The CSS classes are the STANDARD: `CodBi_Print_Remove_Tagged` (removes exactly the element — the default for "beim Drucken ausblenden" on a single field), `CodBi_Print_Remove_Parent` (removes the whole parent container/section), `CodBi_Print_Remove_PrintOnly` (print-only elements/buttons). INTERACTIVE/CONTROL elements (navigation/submit buttons, e.g. XButtonList "Weiter"/"Senden"/"Zurück") SHOULD be hidden from the printed output by default — they are useless on paper (use `CodBi_Print_Remove_PrintOnly`). USER DATA / SENSITIVE fields (birth place, address, personal data) must NEVER be hidden proactively — only when the user explicitly requests it (e.g. "beim Drucken ausblenden" / "hidden when printing"). Use `data-cb-func="Print.Remove"` ONLY when the prompt specifies a parameter for it — e.g. `DocumentSelector` (a dot-prefixed CSS-class selector of the section to remove, such as `.divPrintSection`) or `ParentalLevel` (how many ancestors to climb up). The functionality is NOT normalized server-side — the AI's choice reaches the designer unchanged.

## Sys.Log.Console

Applicable for debugging; logs CodBi runtime data to the browser developer console.

Sys.Log.Console does NOT need an existing form element — it is a standalone functionality. When the user asks to output/print/log/show anything to the browser console (URL content, BayVIS data, CSV, global variables, DOM elements, etc.), you MUST create a NEW **invisible XSpan** (the plain-text/HTML element of Formcycle — NEVER invent class names like "XText" or "XButton"; XTextField is an INPUT element, not plain text) and list it as a separate item in the root "items" array with EXACTLY this shape:

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

Also add the element's name to the first page's "elements" array. The `data-cb-Data` value MUST start with the literal prefix **"SYS.Log.Console > "** followed by the text describing what shall be logged — e.g. `"SYS.Log.Console > Log the details of the planet Pluto with a saturation of .5"`. Do NOT use an element-placeholder expression as the whole value; write the descriptive log text.

## Time.Frame

Applicable ONLY on the BEGIN (minimum) XTextField of type 'time' when there is a second related end time field. The end field is referenced via the 'MaxField' parameter. Do NOT put this functionality on the end time element.
**REQUIRED**: data-cb-maxfield = the END (maximum) time field's name. The begin field is the tagged element.

## DQ.Table.View

Applicable on a container element (e.g. an XContainer/XContainerInvisible) to display the result of a Formcycle DataQuery in an injected HTML table and to enable exporting that table to an Excel file (.xlsx). USE whenever the user asks to show/display/view the data or the columns of a DataQuery/datasource/query as a table and/or to export it to Excel.

CRITICAL — TRIGGER PHRASES that MUST be mapped to DQ.Table.View (do NOT ask clarifying questions):
- "add a table that views/shows/displays the columns <X>, <Y> of <Query>" (e.g. "add a table that views the columns Alter, Name of HolaQuery")
- "zeige die Spalten <X>, <Y> der Abfrage <Query> als Tabelle"
- "show/table the data of the query <Query>", "Tabelle mit den Spalten ... der Abfrage ..."
Use the DataQuery name given by the user AS-IS for data-cb-dataquery — do NOT ask whether the query exists or for its technical ID; the DataQuery is a server-side datasource configured in the Formcycle backend.
- Placement: if the user does NOT specify where to put the table, create a NEW XContainer/XContainerInvisible and append it to the first page — do NOT ask where to place it.
- Sorting/filtering: NOT applied by default — display the columns as-is. Only add sorting or filtering when the user explicitly requests it.

Create an XContainer/XContainerInvisible and set on it (via the attributes array):
- data-cb-func = "DQ.Table.View"
- data-cb-columns = **REQUIRED** — a CSV defining the columns to show, each column is `label;datacolumn;jsonFlag` with an optional fourth entry `;width`: e.g. `Anrede;Anrede;false,Unternehmen;Unternehmen;true,Nachricht;Nachricht;false;30`. `label` is the displayed header, `datacolumn` is the exact column name in the DataQuery result, `jsonFlag` (`true`/`1`/`yes`) marks a column as containing JSON so its cells show a maximizable JSON viewer (use `false`/`0`/`no` for plain columns; a plain number in this position is treated as the legacy width), `width` (optional) sets the column width (characters in Excel, pixels on screen).
- data-cb-dataquery = **REQUIRED** — the name of the Formcycle DataQuery on the server whose result shall be shown (e.g. `HolaQuery` or `INHALT.Eigentuemerdialog_Dezember_2025`).
- data-cb-css = (optional) one or more (space separated) CSS classes to apply to BOTH the tagged container and the injected table.
- data-cb-filename = (optional) the name of the exported Excel file WITHOUT extension (the extension is always `.xlsx`). Defaults to `Export`.
- data-cb-sheetname = (optional) the worksheet name in the exported Excel file. Defaults to `sheet1`.
- data-cb-exportbutton = (optional) a CSS selector of an existing button that shall trigger the export. If omitted (or no matching element is found) the table is rendered WITHOUT any export button — the Excel export is then simply not available.
- data-cb-centered = (optional) whether the content of the table cells is centered. Defaults to `true`; set to `false`/`0`/`no` to keep the cells left-aligned.
- data-cb-excludecolumns = (optional) a CSV of column names (matched against the column's `label` or `datacolumn`) to EXCLUDE from the Excel-export — those columns stay visible in the table but are omitted from the exported `.xlsx`. E.g. `Nachricht,Wichtige_Hinweise`.

Example — a table that views the columns "Alter" and "Name" of the DataQuery "HolaQuery":
"attributes": [
  {"text":"data-cb-func","value":"DQ.Table.View"},
  {"text":"data-cb-dataquery","value":"HolaQuery"},
  {"text":"data-cb-columns","value":"Alter;Alter,Name;Name"}
]

Example with a JSON column — "Details" holds JSON and its cells show a maximizable JSON viewer (no width):
"attributes": [
  {"text":"data-cb-func","value":"DQ.Table.View"},
  {"text":"data-cb-dataquery","value":"HolaQuery"},
  {"text":"data-cb-columns","value":"Alter;Alter,Name;Name,Details;Details;true"}
]

The Excel export uses the SheetJS library (npm package "xlsx") which is bundled into the form script at build time (esbuild) — no runtime loading is needed.

## AI DOCUMENT QA

When the user asks to upload a document and answer specific questions about its content, create an XUpload with data-cb-func="ai.llama.standard.qa" and data-cb-MaxPixelSize="180000" in its attributes. Then create one XTextField (or XTextArea for long answers) per question, each with cssclasses=["AI_LLAMA_STANDARD_QA_Question"] and a data-cb-Question attribute.

The data-cb-Question value supports <[.FieldName]> placeholders (with leading dot) that resolve to the runtime value of another field in the same container.

The upload field and all question fields should be inside an XContainer or XFieldSet wrapper. CRITICAL: data-cb-func="ai.llama.standard.qa" goes on the XUpload, NOT on the container or on the question fields.

## AI TEXT QA (ai.llama.standard.txtqa)

When the user asks to show information about a person or entity based on text values entered in input fields, apply data-cb-func="ai.llama.standard.txtqa" on the FIRST source input field. Add data-cb-useinternet="true" if internet search is needed. All other source fields get cssclasses=["AI_LLAMA_TXTQA_Source"]. The response display field gets cssclasses=["AI_LLAMA_STANDARD_TXTQA_Question"] and a data-cb-Question attribute.

The data-cb-Question value MUST include <[.FieldName]> placeholders (with leading dot) for ALL source fields.

CRITICAL — The field with data-cb-func="ai.llama.standard.txtqa" must NOT have the AI_LLAMA_STANDARD_TXTQA_Question CSS class.

ALL form elements created for this functionality MUST be inside an XContainer or XFieldSet wrapper.

## SPECIALIST RULE

When the prompt mentions a specific specialist model (e.g. "Verwende den Spezialisten XYZ" or "use the XYZ specialist") AND an AI functionality (ai.llama.chat, ai.llama.standard.qa, ai.llama.standard.txtqa) is applied, add a data-cb-Specialist attribute to that functionality's element's attributes array with the specialist name as its value.

The complete list of available functionalities with all their parameters is available at:
{{CODBI_FULL_SECTION}}
