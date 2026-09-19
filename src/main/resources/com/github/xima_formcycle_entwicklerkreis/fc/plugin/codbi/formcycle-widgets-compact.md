# Formcycle Widgets (Compact)

Condensed reference: the FORMCYCLE widget types and what each is for. You receive ONLY this list initially. Before you create a widget you MUST request its detailed JSON structure by returning a details request with a "widgets" array listing ALL widget classNames you need — the server then provides the exact JSON templates and properties for exactly those widgets. List every widget you plan to use (including containers/pages) so none is missing.

LABELS — Every interactive element you create MUST carry a meaningful 'label' that describes its purpose, written in the same language as the user's request (e.g. "Straße", "Postleitzahl", "Ort", "Land" for an address form). NEVER use generic placeholders such as "Label", "Example", "Text" or "Field".

REQUIRED OPTIONS — Several widgets have mandatory options (e.g. XSelect needs its 'options' list, XButtonList needs its 'buttons' with the action, XUpload needs its source, a datatype-validated XTextField needs the matching datatype). Whenever a genuinely required widget option cannot be derived from the user's request, ASK the user for it instead of inventing it (e.g. if the user says "a dropdown for the city" but does not list the choices, ask which options to show). EXCEPTION — a select whose entries come from a FORMCYCLE DATASOURCE ("Quelle") or from an element placeholder (EP) has NO manual options: leave `options` EMPTY ([]) and do NOT ask the user for an option list (see the XSelect section).

EXISTING FORM ELEMENTS — the current form's existing items (their `name`s) are always provided with the request. NEVER ask whether a referenced field/container already exists (e.g. "Existieren die Felder … bereits?" / "bereits vorhanden oder neu anlegen?") — reuse it if present, create it if absent, without asking.

## XTextField
Single-line text input. Validation via the 'datatype' property (plain, date/dateDE, email, phone, url, time, number, money, plzDE, ipv4, regexp, ...).
ADDRESS IS NEVER ONE FIELD — "Adresse"/"Anschrift"/"address" MUST become the FOUR parts in ONE address container: `tfStrasse` (label "Straße", CodBi_OpenPLZ_AC_SET_Street), `tfHausnummer` (label "Hausnummer", CodBi_OpenPLZ_AC_SET_BuildingNumber), `tfPLZ` (label "Postleitzahl", datatype "plzDE", CodBi_OpenPLZ_AC_SET_PLZ) and `tfOrt` (label "Ort", CodBi_OpenPLZ_AC_SET_Locality). NEVER a lone free-text XTextField named/labelled "Adresse". Street+house number share one `rowid`, PLZ+city the next.
## XTextArea
Multi-line text input. Always set fullwidth="1".
## XUpload
File upload / file download field. CRITICAL — when the upload itself must crop the selected image/ID card ("Bild-Cropper", "with crop", "Personalausweis ... mit Bild-Cropper"), the XUpload MUST carry data-cb-func="Media.Image.Cropper" (or a CodBi_Fotocropper_* class) — an upload without the cropper is WRONG. DIFFERENT case — a "Fotocropper-Board" / "Bild-Cropper vor dem Upload X" (a full photo-cropper setup placed BEFORE an upload) is a SEPARATE complete CodBi_Fotocropper group (wrapper CodBi_Fotocropper + Board/Uploader/Update/ImageURL/Foto); the referenced upload itself then gets NO data-cb-func="Media.Image.Cropper".
## XSelect
Dropdown / select list. Static items go in the 'options' array. For a select with STATIC items you MUST provide a NON-EMPTY 'options' array (each option {"text":"<display>","value":"<value>"}) — never create a STATIC select with empty options; if the request names the select (e.g. "Stadt") but gives no options and they cannot be derived, ASK the user for the option list.
SELECT FED BY A FORMCYCLE DATASOURCE ("Quelle" / "Datenquelle" / "source", usually together with "Spalte N") — a "Quelle" is a FORMCYCLE DATASOURCE configured server-side in the Formcycle backend. It is NOT an element placeholder (EP): NEVER wire it with data-cb-func="html.select.injection" / data-cb-Values and NEVER invent an EP for it (e.g. `{ Staatsangehoerigkeit > column1 }` — a datasource name is not an EP id, so nothing resolves). Set the XSelect's OWN properties instead — `datasource` (the datasource name from the request, used AS-IS; datasources are server-side config, so NEVER ask whether it exists), `dstextidx` (the 1-BASED column whose values become the option TEXT), `dsvalueidx` (the 1-BASED column whose values become the option VALUE — use the SAME column when only ONE is named), optional `dstitleidx` (option title/tooltip), `dstype` (DB, CSV, JSON, XML, LDAP, USER or PLUGIN) and `ds_rendercolattr` — with `options` EMPTY ([]) and NO data-cb-func. Column numbers are 1-BASED ("Spalte 1" = the FIRST column; designer defaults: dstextidx 1, dsvalueidx 2). Example — "die Spalte 1 in der Quelle Staatsangehörigkeiten als Option": {"className":"XSelect","properties":{"name":"selStaatsangehoerigkeit","label":"Staatsangehörigkeit","datasource":"Staatsangehörigkeiten","dstextidx":"1","dsvalueidx":"1","options":[]}}
TITLE COLUMN / WORD→PROPERTY MAPPING (a datasource select has THREE columns): the WORD the user uses for a column decides which property it fills — Text-Spalte / "Spalte N als Text" / Anzeigetext / Optionstext / display → `dstextidx`; Wert-Spalte / "Spalte N als Wert" / Wert / value → `dsvalueidx`; Titel-Spalte / Titel / Tooltip-Spalte / title / tooltip → `dstitleidx`. A named TITLE column ALWAYS goes into `dstitleidx` — NEVER into `dstextidx` (the option text) and never into `dsvalueidx`. The "use the SAME column for TEXT and VALUE when only ONE is named" default applies ONLY to a column that carries NO role word ("Spalte 1", "column 1"); a column named WITH a role word is assigned ONLY to that role's property, and several role columns may be combined ("Spalte 2 als Text, Spalte 4 als Wert, Titel-Spalte ist Spalte 5" → dstextidx 2, dsvalueidx 4, dstitleidx 5).
SELECT OPTION SWITCHES (XSelect element properties, values `"1"`/`"0"`): "Show default option" → `showpleaseselect="1"` adds a leading default option so NOTHING is preselected (the user's "wenn nichts ausgewählt ist, soll … da stehen" / "Bitte wählen"); the default option's text is Formcycle-localized — there is NO text property, so NEVER use `placeholder` for it. "Remove duplicate text-pairs" → `removeduplicatetextvaluepairs="1"` ("doppelte Werte sollen entfernt werden") — for a DATASOURCE select this is the element property, NOT the `Unique` EP / html.select.injection. "Render all attributes" → `ds_rendercolattr="1"` renders every datasource column as an attribute on each option.
## XCheckbox
Checkbox (lowercase 'b').
## XButtonList
Button or button group. 'buttons' array; action.page uses FORMCYCLE keywords: "" (none/custom), "next" (next page), "previous" (previous page), a page name (navigate to it), or a submit command ("submit", "submitNoCheck", "submitSave", "submitSaveNoCheck", "submitPreview", "submitPreviewWindowed"). action.check=true validates the CURRENT page's fields before the action — use it for "next"/"Weiter" and submit buttons whenever the page has required, datatype-validated or CodBi-tagged (CodBi_* class) fields; check=false skips validation. EVERY navigation/submit button MUST set action.page — a 'Zurück'/'Back' button gets page="previous" and a 'Senden'/'Absenden'/'Submit' button gets page="submit" (check=true); never leave action.page empty. Create Back/Submit/Next buttons INSIDE ONE XButtonList via its 'buttons' array (each button {name, value, action:{page:...}}) — there is NO 'BUTTON'/'XButton' widget class, never invent one and never create standalone button elements.
## XSpan
Static text / label. Text goes in 'rtevalue', not 'label'.
## XImage
Image element.
## XFieldSet
Fieldset / group container. Title in 'legend'.
## XContainer
Generic layout container. No 'label'.
## XContainerInvisible
Invisible layout container. No 'label'.
## XSignature
Signature pad. Stroke color / baseline options.
## XAppointment
Appointment / calendar picker (Terminfinder). NOT for plain date input. MUST have an 'appointmentPlan' (the schedule / Terminplan) — if the user names one, use it; if not, ASK which Terminplan; never emit an XAppointment without appointmentPlan.
## XLine
Horizontal divider. No 'label'.
## XSpacer
Empty spacer. No 'label'.
## XPage
Form page (top-level).
## XHeader
Form header.
## XFooter
Form footer.
## XDatalistAdvanced
Filterable select / datalist (DS Widget Plugin).
## XTextfieldAdvanced
Filterable text field (DS Widget Plugin).
## XFormula
Read-only calculation / formula field (XFormula Widget Plugin). Properties use the 'xformula_' prefix; the formula goes into xformula_value (NOT 'value'); formatting via xformula_unit/xformula_decimal/xformula_thousands/xformula_align (xformula_unit is where a unit like "€" goes, xformula_align="s" = after the value). **xformula_value is FULL JavaScript** (statements, if/else, const, ternary, return — the result is the last statement or the return value), e.g. `if ([%tf1%] < 10) return 0; [%tf1%] * [%tf2%]`. Field values via placeholders `[%tfBeginn%]` OR jQuery selectors `$("[data-name='tf1']").val()` (`data-name` is Formcycle's canonical attribute selector for an element's technical `name`, stable inside repeatable containers — see the JS/CSS selectors note; `[name=...]` gets mangled with row-suffixes). **CRITICAL — REPEATED/DYNAMIC containers:** a placeholder `[%field%]` returns only the FIRST row; to sum or COUNT all rows you MUST use a jQuery `data-name` selector on a field that lives inside the repeated container — sum: `$("[data-name='tfBetrag']").sum()`; COUNT the number of repetitions: `$("[data-name='tfBeginn']").length` (never invent a "..._count" variable). Pricing pattern ("base € + X € per ADDITIONAL repetition", e.g. FS04: 11.50 € base, 11.25 € each extra row): `11.5 + 11.25 * ($("[data-name='<fieldInsideContainer>']").length - 1)` — set the unit via xformula_unit. To build a JSON string from other fields' values (e.g. a hidden field storing the JSON of tfVorname/tfNachname), write the JSON literally in xformula_value with [%fieldName%] placeholders — e.g. xformula_value = {"vorname":"[%tfVorname%]","nachname":"[%tfNachname%]"} — do NOT use JSON.stringify and do NOT reference bare field names; mark the field ishidden="1" (the Formcycle hide property — NOT invisible).
## XRating
Rating widget with configurable icons (XRating Widget Plugin). The NUMBER of icons/stars is determined by the `options` array — each entry generates one clickable icon. A "5-star" / "5-Sterne" / "5 stars" rating MUST produce an `options` array of EXACTLY 5 entries (e.g. 5 star icons). NEVER create an XRating without an `options` array when the star/level count is requested.
## XCaptcha
Captcha widget (CAPTCHA Plugin). CRITICAL — "Captcha-Schutz" / "with CAPTCHA" / "captcha protection" / "mit Captcha" → ALWAYS create an XCaptcha element (className="XCaptcha").
## XReCaptcha
Google reCAPTCHA widget (reCAPTCHA Plugin).
## XHtmlWidget
Custom HTML element (XHtml Widget Plugin).
## XMap
Interactive Leaflet map widget (XMap Plugin). Properties use 'xmap_' prefix (xmap_latitude, xmap_longitude, xmap_zoom, xmap_geometry_point/line/area — set the geometry type(s) to allow drawing —, xmap_color_*, ...). The form assistant outputs FORM JSON only and neither generates nor describes custom JavaScript; map→field sync (e.g. a drawn area into a number field) is a manual form-level script. In the form JSON you only enable the geometry type(s) and create the target field.
## XNavigationBar
Navigation / progress bar widget (XNavigationBar Plugin) — for FORMCYCLE navbars (NOT CodBi Form.Navigator). Create it EXACTLY ONCE per form and place it in the form's HEADER (XHeader) — never on a page and never as two XNavigationBar items.
## XLanguageSwich
Language selector widget (XLanguageSwich Plugin). Create it EXACTLY ONCE per form and place it in the form's HEADER (XHeader) alongside the navbar — never on a page and never duplicated.
## XBsLogin
Bürger-Services login button (BundID / Bürgerkonto authentication). CRITICAL — ALWAYS create XBsLogin (with bs_auth_ref) for a "BundID-Login-Button" / "Bürgerkonto-Login" / authentication button — NEVER an XButtonList/BUTTON.
