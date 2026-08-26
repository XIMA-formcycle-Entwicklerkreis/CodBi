# Formcycle Widgets

Valid FORMCYCLE element className values (use ONLY these exact strings — do NOT invent class names like 'XButton', 'XInput', 'XText'):

CRITICAL — 'XButton' does NOT exist. Use XButtonList with a 'buttons' array for any button.
CRITICAL — XTextField uses 'datatype' (not 'type') for input validation. The 'type' property does NOT exist on XTextField.
CRITICAL — EVERY element needs a 'label' property (except containers/fieldsets which use 'legend'). Without a label, the element won't render in the designer.
MANDATORY — Every 'label' must be a MEANINGFUL, descriptive, human-readable text that names the field's purpose, written in the SAME language as the user's request. Derive it from what the field captures (e.g. for an address form use "Straße", "Hausnummer", "Postleitzahl", "Ort", "Land"). NEVER use generic placeholders such as "Label", "Example", "Text", "Field" or "Eingabefeld". The 'Example' in the templates below is only a structural placeholder — always replace it with a real, descriptive label.

## XTextField

Single-line text input. Set 'datatype' property to validate input:
- "" plain text (default)
- "dateDE" German date DD.MM.YYYY (preferred; shown as 'Datum (TT.MM.YYYY)' in designer)
- "date" HTML5 native date picker
- "email" e-mail
- "phone" phone number
- "url" URL
- "time" time HH:MM
- "number" decimal number
- "integer" integer
- "posinteger" non-negative integer
- "money" money amount
- "posmoney" non-negative money
- "posmoneyOptionalComma" non-negative money (decimal optional)
- "formattedNumber" number with custom format config
- "plzDE" German ZIP code
- "ipv4" IPv4 address
- "onlyLetterNumber" alphanumeric
- "onlyLetterSp" letters and spaces
- "regexp" custom regex — the datatype for a TEXT field whose input is limited (e.g. a "Sicherheitscode" that allows only 3 digits). Put the regex pattern into the `vrule` property (Formcycle's regexp datatype reads `vrule`, NOT `datatypeHint`), e.g. "vrule":"^[0-9]{3}$", and ALWAYS set `vrulemismatch` with a proper error message (e.g. "vrulemismatch":"Bitte genau 3 Ziffern eingeben") — shown when the value does not match `vrule`; a regexp field without an error message is incomplete. The datatype validates the value, so if HTML.Input.REGEX is also applied, use only `data-cb-keyexpression` (no `data-cb-expression`). When the field's datatype must be NON-text (money, number, date, phone, email, plzDE, ...), keep that datatype and restrict the input with the HTML.Input.REGEX functionality instead (data-cb-keyexpression + data-cb-expression).

Common Validation Rules (fc-plugin-common-validation-rules) custom datatypes — set directly as datatype value using FULL getKey() path:
- "de.xima.fc.plugin.fc-plugin-common-validation-rules.KfzDE" for German license plate
- "...IbanValidationPlugin" for IBAN
- "...Bic11InlandValidationPlugin" for BIC (domestic)
- "...Bic8To11AuslandValidationPlugin" for BIC (foreign)
- "...MoneyValidationPlugin" for money amount
- "...AhvNumberValidationPlugin" for Swiss AHV
- "...DateTimeValidationPlugin" for date+time
- "...DateFormatUSValidationPlugin" for US date
- "...DateFormatUKValidationPlugin" for UK date
- "...FloatFormatValidationPlugin" for decimal with period

Template:
```json
{"className":"XTextField","properties":{"name":"tfExample","id":"xi-tf-example","label":"Example","required":"0","readonly":"0","placeholder":"","datatype":"","fullwidth":"0"}}
```

DATE FIELDS — MANDATORY: Every field whose label refers to a date MUST have its datatype set. Use datatype="dateDE" for all German-language forms. Use datatype="date" only when an HTML5 native browser date picker is explicitly required. Applies to fields whose label contains: 'Datum', 'Geburtsdatum', 'Geburtstag', 'Eintrittstermin', 'Termin', 'Abgabedatum', 'Anfangsdatum', 'Enddatum', 'date', 'birthday', 'birth date', 'start date', 'end date', 'due date'.

Date field template:
```json
{"className":"XTextField","properties":{"name":"tfGeburtsdatum","id":"xi-tf-geburtsdatum","label":"Geburtsdatum","required":"0","readonly":"0","placeholder":"","datatype":"dateDE","fullwidth":"0"}}
```

## XTextArea

Multi-line text input. CRITICAL: ALWAYS set fullwidth="1" on every XTextArea, regardless of other XTextAreas in the form.

Template:
```json
{"className":"XTextArea","properties":{"name":"tfExample","id":"xi-tf-example","label":"Example","required":"0","readonly":"0","placeholder":"","fullwidth":"1","autosize":"0"}}
```

## XUpload

File upload / file download field.

CRITICAL — TWO DISTINCT USES: (a) when the upload itself must crop the selected image/ID card ("Bild-Cropper", "with crop", "Personalausweis ... mit Bild-Cropper"), the XUpload MUST carry data-cb-func="Media.Image.Cropper" (or a CodBi_Fotocropper_* class) — an upload without the cropper is WRONG. (b) A "Fotocropper-Board" / "Bild-Cropper vor dem Upload X" (a full photo-cropper setup placed BEFORE an upload) is a SEPARATE complete CodBi_Fotocropper group (wrapper CodBi_Fotocropper + CodBi_Fotocropper_Board + CodBi_Fotocropper_Uploader + CodBi_Fotocropper_Update + CodBi_Fotocropper_ImageURL + CodBi_Fotocropper_Foto); the referenced upload itself then gets NO data-cb-func="Media.Image.Cropper".

Template:
```json
{"className":"XUpload","properties":{"name":"fdExample","id":"xi-fd-example","label":"Example","required":"0","fileextension":"","fullwidth":"0"}}
```

## XSelect

Dropdown / select list. Use 'options' array for static items. CRITICAL — each option MUST be an object with BOTH a 'text' (the visible display text, shown in the dropdown / "Auswahl") AND a 'value' (the submitted value): {"text":"<display text>","value":"<value>"}. An option with only "value" (and no "text") will render an EMPTY dropdown entry. Do NOT use a "label" key — the display key is "text".

CRITICAL — An XSelect/dropdown/select MUST always have a NON-EMPTY "options" array. NEVER create an XSelect without options. If the request names the select (e.g. "Stadt") but does NOT specify its options and they cannot be derived from the request, ASK the user for the list of options (clarification) before generating the select — an empty dropdown is unusable.

PRESENTATION ("selectlayout" property) — by default an XSelect renders as a dropdown. Set the "selectlayout" property to change the presentation:
- Omit it (or "select") — dropdown (default).
- "radio" (or "radio1") — render the options as RADIO BUTTONS (single choice, all options visible). Use this when the user asked for radio buttons / "Radio-Button" / "Radiobuttons".
- "checkbox" (or "checkbox1") — render the options as a checkbox group (multi choice). For a single yes/no as a checkbox, use XCheckbox instead.
- "list" — list box.
- "table" / "table1" — question table layout.
CONTROL TYPES — honor the USER CLARIFICATION when it says which control type the user wants: "Radio-Button"/"radio" → XSelect with selectlayout "radio"; "Checkbox" → XCheckbox (a single yes/no checkbox) or XSelect selectlayout "checkbox"; "Dropdown" / not specified → XSelect default (dropdown). Never generate a dropdown when the user explicitly chose radio buttons.

Template (dropdown):
```json
{"className":"XSelect","properties":{"name":"selExample","id":"xi-sel-example","label":"Example","required":"0","fullwidth":"0","options":[{"text":"Option 1","value":"option1"},{"text":"Option 2","value":"option2"}]}}
```

Example for a Ja/Nein dropdown:
```json
{"className":"XSelect","properties":{"name":"selJaNein","id":"xi-sel-janein","label":"Ja/Nein","required":"0","fullwidth":"0","options":[{"text":"Ja","value":"Ja"},{"text":"Nein","value":"Nein"}]}}
```

Example for Ja/Nein as RADIO BUTTONS (honor the clarified control type):
```json
{"className":"XSelect","properties":{"name":"selJaNein","id":"xi-sel-janein","label":"Ja/Nein","required":"0","fullwidth":"0","selectlayout":"radio","options":[{"text":"Ja","value":"Ja"},{"text":"Nein","value":"Nein"}]}}
```

## XCheckbox

Checkbox (note: lowercase 'b').

Template:
```json
{"className":"XCheckbox","properties":{"name":"cbExample","id":"xi-cb-example","label":"Example","required":"0","checkboxvalue":"1","checkedvalue":"1"}}
```

## XButtonList

Button or button group. No label property. 'buttons' array contains button objects each with: 'name' (technical ID), 'value' (display text, may be HTML), 'action' object.

AVAILABLE BUTTON ACTIONS (action.page — verified against Formcycle 8.5, ESubmitButtonAction):
- "" (empty) = no action, or a custom action when action.customAction contains JS
- "next" = go to the NEXT page
- "previous" = go back to the PREVIOUS page
- any page name (e.g. "p2") = navigate to that page
- "submit" = submit the form to the server (NOT a page name — do NOT replace with 'p1' or any other page)
- "submitNoCheck" = submit the form WITHOUT validation
- "submitSave" = submit and save the data as a draft
- "submitSaveNoCheck" = submit and save as a draft WITHOUT validation
- "submitPreview" = open the form preview
- "submitPreviewWindowed" = open the form preview in a new window

action.check (boolean) controls VALIDATION of the CURRENT page's fields before the action runs:
- check=true = validate the current page first; the action is blocked while a field on that page is invalid (a required field is empty, a datatype-validated field has the wrong format, a CodBi-validated field is invalid, etc.)
- check=false = skip validation and run the action directly

RULES for choosing check:
- Submit buttons (page="submit"): ALWAYS check=true — see the mandatory rule below.
- "Next page" buttons (page="next", e.g. a 'Weiter'/'Continue' button on a non-final page): use "next page + check" (check=true) whenever the current page contains a field that can be invalid — a REQUIRED field, a field with a 'datatype' (dateDE, email, etc.), or a field tagged with a CodBi functionality/class that validates input (CSS class starting with "CodBi_", e.g. CodBi_People_Name, or a data-cb-func attribute). Use plain "next page" (check=false) ONLY when the current page has no field that can invalidate (e.g. it contains only informational/layout elements).
- "Previous page" buttons (page="previous"): check=false is fine.

MANDATORY RULE — XButtonList submit button: For any button that submits or sends the form (e.g. 'Absenden', 'Senden', 'Einreichen', 'Prüfen und Senden'), use EXACTLY this action: {"page":"submit","check":true,"customAction":"","customClassNames":"","displayName":"","optionId":"submit + check","value":""}. The string 'submit' is a FORMCYCLE server-side command — it is NOT a page name and must NEVER be replaced with any page name.

CRITICAL — A 'Zurück'/'Back' and 'Senden'/'Submit'/'Weiter' button set belongs in ONE XButtonList via its 'buttons' array (each button with a name, value and action including action.page). There is NO 'BUTTON' or 'XButton' widget class — never invent one and never create standalone button items; every back/submit button must be a member of an XButtonList's buttons array.

Template (submit button):
```json
{"className":"XButtonList","properties":{"name":"btlExample","id":"xi-btl-example","buttons":[{"name":"btnExample","value":"Button Text","action":{"page":"submit","check":true,"customAction":"","customClassNames":"","displayName":"","optionId":"submit + check","value":""}}]}}
```

Template ('Weiter' / next-page button WITH validation — the usual case on a page that has input fields):
```json
{"className":"XButtonList","properties":{"name":"btlNext","id":"xi-btl-next","buttons":[{"name":"btnNext","value":"Weiter","action":{"page":"next","check":true,"customAction":"","customClassNames":"","displayName":"","optionId":"next + check","value":""}}]}}
```

## XSpan

Static text / label. Text content goes in 'rtevalue', NOT 'label'.

Template:
```json
{"className":"XSpan","properties":{"name":"spExample","id":"xi-sp-example","rtevalue":"Example text"}}
```

## XImage

Image element.

## XFieldSet

Fieldset / group container. Title goes in 'legend', NOT 'label'.

Template:
```json
{"className":"XFieldSet","properties":{"name":"fsExample","id":"xi-fs-example","legend":"Group","elements":[],"fullwidth":"0"}}
```

## XContainer

Generic layout container. Has no 'label' property. To make a group of fields repeatable (the user can add/duplicate rows via a '+' button — see REPEATABLE CONTAINERS in the general rules), use this container with dynamic properties:

Repeatable container template:
```json
{"className":"XContainer","properties":{"name":"coTopics","id":"xi-co-topics","dynamic":"1","dynamicMinSize":"1","dynamicMaxSize":"10","dynamicAddText":"+ Thema hinzufügen","dynamicDeleteText":"Thema entfernen","elements":["tfTopicTitle","taTopicDesc"],"fullwidth":"0"}}
```

Plain (non-repeatable) container template:
```json
{"className":"XContainer","properties":{"name":"coExample","id":"xi-co-example","elements":[],"fullwidth":"0"}}
```

## XContainerInvisible

Invisible/hidden layout container. Same as XContainer but not rendered. Has no 'label' property. For a repeatable group, use the same dynamic properties as XContainer.

Plain (non-repeatable) container template:
```json
{"className":"XContainerInvisible","properties":{"name":"divExample","id":"xi-div-example","elements":[],"fullwidth":"0"}}
```

## XSignature

Signature pad (XSignature Widget Plugin). Supports pen stroke color via "xsignature_stroke_color" (hex e.g. #0000ff for blue), baseline via "xsignature_base_line_show", baseline color via "xsignature_base_line_color", hide baseline in print via "xsignature_base_line_hide_print".

Template:
```json
{"className":"XSignature","properties":{"name":"sigExample","id":"xi-sig-example","label":"Example","required":"0"}}
```

## XAppointment

Appointment/calendar picker / Terminfinder. Do NOT use for date input fields — use XTextField with datatype="dateDE" instead.

When the prompt says "Terminfinder" or "Terminkalender" or "appointment picker", create XAppointment. Properties: name (e.g. "app1"), id (e.g. "xi-app-1"), label, dateFormat="dd.mm.yy", required="0", closeable="0", showUntil="0", showCapacity="0".

Display options: AlsTextfeld (set "1" to show as text field initially, "0" to always show calendar), FreiePlaetze/showCapacity ("1" to show available slots), Terminende ("1" to show end time). Gesperrt ("1" locked). Versteckt ("1" hidden).

CRITICAL — An XAppointment MUST have an 'appointmentPlan' (the schedule / Terminplan) — never emit an XAppointment without one. When the prompt names a specific Terminplan (e.g., "Terminfinder für ddd"), use that name as the value ("appointmentPlan":"ddd"). When the user does NOT name a plan, ASK which Terminplan to use (clarification) before generating the XAppointment. The backend automatically resolves the name to the correct UUID for 'appointmentTemplate'. You do NOT need to set 'appointmentTemplate' yourself.

Template:
```json
{"className":"XAppointment","properties":{"name":"apExample","id":"xi-ap-example","label":"Example","required":"0","dateFormat":"dd.mm.yy","closeable":"0","showUntil":"0","showCapacity":"0"}}
```

## XLine

Horizontal divider. Has no 'label' property.

Template:
```json
{"className":"XLine","properties":{"name":"liExample","id":"xi-li-example"}}
```

## XSpacer

Empty spacer. Has no 'label' property.

Template:
```json
{"className":"XSpacer","properties":{"name":"spExample","id":"xi-sp-example"}}
```

## XPage

Form page (top-level).

Template for additional page:
```json
{"className":"XPage","properties":{"name":"p2","id":"xi-p-2","header":"","subheader":"","elements":[]}}
```

## XHeader

Form header.

Template:
```json
{"className":"XHeader","properties":{"name":"header","id":"xi-header","elements":[]}}
```

## XFooter

Form footer.

## XDatalistAdvanced

Filterable select/datalist (DS Widget Plugin). Properties: xda_ds_param (datasource parameter to filter by), xda_use_colvalue ("true" to use 'col'-attribute for filter), xda_colnumber ('col'-attribute column number), xda_filter_colnumber (datasource column to filter on), xda_show_please_select ("true" to show default option).

## XTextfieldAdvanced

Filterable text field (DS Widget Plugin). Properties: xtf_ds_param (datasource parameter to filter by), xtf_use_colvalue ("true" to use 'col'-attribute for filter), xtf_colnumber ('col'-attribute column number), xtf_filter_colnumber (datasource column to filter on).

## XFormula

Calculation/formula field (XFormula Widget Plugin). Read-only input whose value is auto-computed from a JavaScript formula.

CRITICAL: The formula goes into 'xformula_value' (NOT 'value' — using 'value' is wrong and won't work). All properties use the 'xformula_' prefix: xformula_value (the formula), xformula_type ("auto" or "text"), xformula_empty_as_zero ("0"=treat empty as text, "1"=treat as zero), xformula_index (order index). Formatting properties: xformula_unit, xformula_align ("p"=before number, "s"=after number), xformula_external ("true" for unit outside field), xformula_external_width, xformula_mdec, xformula_decimal, xformula_thousands, xformula_color_value, xformula_color_pos, xformula_color_neg. Do NOT set datatype, readonlyif, readonlyifmode, readonlyifcomp, or readonlyifvalue on XFormula.

**SYNTAX — `xformula_value` is FULL JavaScript, not just a single expression.** It is executed verbatim with JavaScript syntax. Plain expressions are fine ("[%tf1%] + [%tf2%]"), but since plugin 3.6.0 it ALSO supports statements, `if/else`, `const`, ternary, and an explicit `return`. The result is the value of the last statement (or the `return` value), exactly like evaluating code in a REPL/browser console. Examples from the official documentation:
```js
const threshold = 10;
if ([%tf1%] > threshold) [%tf2%];
else [%tf3%];
```
```js
if ([%tf1%] < 10) return 0;
const sum = [%tf1%] + [%tf2%];
sum * [%tf3%]; // result = last statement
```
So conditional pricing ("if the value is under 10, the price is 0, otherwise …") IS expressible — do NOT fall back to inventing hidden fields for it.

**REFERENCING FIELD VALUES — FORMCYCLE placeholder vs jQuery selector:**
1. FORMCYCLE placeholder: `[%tf1%]` (equivalent to the field's value; works for text, numbers, concatenation "[%tf1%] + ' ' + [%tf2%]", and `.length` → "[%tf1%].length" counts the typed characters).
2. jQuery selector: `$('[name=tf1]').val()`.

**CANONICAL form-element selector — `data-name` (from the Formcycle Selectors article):**
To select a form element by its technical `name` (the name from the designer's base settings) you use the special attribute selectors `$("[data-name='tfMail']")` (jQuery/JavaScript) and `[data-name="tfMail"]` (CSS). `data-name` carries the element's NAME exactly as you configured it, so it is the most robust selector — inside repeatable/dynamic containers the plain HTML `name`/id get mangled with row-suffixes (`tf1_0`, `tf1_1`, …), while `data-name` stays stable. The XFormula widget also accepts such selectors for summing/counting repeated values.

**CRITICAL — REPEATED (DYNAMIC) CONTAINERS: placeholders return ONLY THE FIRST ROW.**
When a field lives inside a repeatable/dynamic container (an XContainer with `dynamic:"1"`), a plain placeholder like `[%tfBeginn%]` gives only the FIRST row's value — the extra added rows are NOT included. To sum or COUNT across ALL rows you MUST use a **jQuery selector** over the field's stable name, NOT a placeholder and NEVER an invented variable:
- Sum of a repeated numeric field: `$('[data-name=tfBetrag]').sum()`
- COUNT the number of repetitions/rows of the container: `$('[data-name=tfBeginn]').length` — where `tfBeginn` is a field that lives INSIDE the repeated container (its element is repeated once per row, so `.length` equals the row count).
- Prefer the `data-name` selector (stable original name). `data-org-name` also carries the original un-mangled name and is accepted in W3C-conform mode; the plain `[name=tf1]` does NOT work reliably inside repeatable containers because the HTML `name` gets a row-suffix. Use `data-name=<fieldName>` (choose `<fieldName>` = the element's `properties.name`, e.g. `tfBeginn`).

Example — the official pricing pattern for "every repetition of the panel costs X € on top of a base price":
```js
// Whenever you need "the number of times a container was repeated/added", DERIVE it from a field
// that sits inside that container via a jQuery data-name selector — never invent a "..._count" var.
// FS04: base 11.50 €, +11.25 € per ADDITIONAL repetition of the time-range container:
11.5 + 11.25 * ($("[data-name='tfBeginn']").length - 1)
```
Whether a field value is a number, text, or repeated: XFormula computes from OTHER FORM FIELDS' / the DOM's values only. It cannot read live map-widget geometry; any map→field data must already be in an ordinary field. The result is READ-ONLY and is formatted by the widget's own xformula_* properties (xformula_unit, xformula_decimal, xformula_thousands, xformula_align) — NOT by a target field's AutoNumeric. The unit (e.g. "€") is set via `xformula_unit` (`xformula_align="s"` = after the value).

## XRating

Rating widget (XRating Widget Plugin). Visual rating with configurable icons (stars, thumbs, emoticons). The NUMBER of icons is determined by the 'options' array — each entry generates one clickable icon. A "5-star" / "5-Sterne" / "5 stars" / "Bewertung mit 5 Sternen" rating MUST produce an `options` array of EXACTLY 5 entries (5 star icons), e.g. `[{"icon":"ico-rating-star"},{"icon":"ico-rating-star"},{"icon":"ico-rating-star"},{"icon":"ico-rating-star"},{"icon":"ico-rating-star"}]`. NEVER emit an XRating without an `options` array when the star/level count is requested.

Properties: xrating_icon_inactive (icon for unselected state — common values: "ico-rating-star", "ico-rating-star-outline", "ico-rating-thumb-up", "ico-rating-thumb-down", "ico-rating-emoticon-happy", "ico-rating-emoticon-sad", "ico-rating-emoticon-neutral"), xrating_icon_active (icon for selected state — same icon options), xrating_color_gradient ("true" to enable color gradient), xrating_color_start (start color in rgb() format, e.g. "rgb(181,45,58)" — CRITICAL: use rgb(R,G,B) format, NOT hex like "#b52d3a"), xrating_color_end (end color in rgb() format).

## XCaptcha

Captcha widget (CAPTCHA Plugin). Displays a hard-to-read challenge text that the user must enter to prove they are human. Standard properties: name, id, label. Has built-in refresh and audio play buttons. No custom properties needed.

CRITICAL — "Captcha-Schutz" / "with CAPTCHA" / "captcha protection" / "mit Captcha" → ALWAYS create an XCaptcha element (className="XCaptcha").

## XReCaptcha

Google reCAPTCHA widget (reCAPTCHA Plugin). Integrates Google reCAPTCHA. Properties: recaptcha_site_key (site key), recaptcha_secret_key (secret key).

## XHtmlWidget

Custom HTML element (XHtml Widget Plugin). Renders custom HTML code. Properties: html_code (the HTML content, e.g. "<h1>Title</h1>").

## XMap

Leaflet map widget (XMap Plugin). Displays an interactive map. Properties use 'xmap_' prefix: xmap_latitude, xmap_longitude, xmap_zoom, xmap_min_zoom, xmap_max_zoom, xmap_min_markers, xmap_max_markers, xmap_geometry_point, xmap_geometry_line, xmap_geometry_area, xmap_localize, xmap_locate_button, xmap_color_marker_point, xmap_color_marker_user, xmap_color_line, xmap_color_area_border, xmap_color_area_fill. Advanced: xmap_use_custom_map_source, xmap_custom_map_source, xmap_custom_map_source_type ("tms"/"wms"/"wmts"), xmap_wms_layers, xmap_wms_format, xmap_wms_version, xmap_wms_crs, xmap_use_http_settings.

**XMap — the form assistant only configures the widget in the FORM JSON; it does NOT generate or describe custom JavaScript.** The form JSON has no 'script' field, so syncing the drawn map geometry to a field (e.g. a drawn area → a number field) is a MANUALLY added form-level script that the AI neither generates nor explains. In the form JSON the AI only: enables the drawing type via the xmap_ properties — `xmap_geometry_point` / `xmap_geometry_line` / `xmap_geometry_area` ("true" to allow that geometry) — and, when requested, creates the target field the geometry should go into (e.g. a number field `tfVeraeuss_Flaeche`).

## XNavigationBar

Navigation bar / progress bar widget (XNavigationBar Plugin). Renders a visual step indicator bar showing all form pages.

Use when the prompt mentions "XIMA Navigationsleiste", "XIMA navbar", "FORMCYCLE navbar", "Navigationsleiste", "Progress Bar", "FC-Navbar", "formcycle navigation bar", or "FC-Navigationsleiste". Standard properties: name, id, label. Steps are defined via the "options" array — each entry creates one step with "text" (display name) and "value" (page identifier). For custom step count, provide that many options entries. Uses custom action button types: xnavbar_next (next page), xnavbar_next_check (next page + validation), xnavbar_prev (previous page), xnavbar_prev_check (previous page + validation).

CRITICAL — Distinguish from CodBi Form.Navigator: Use XNavigationBar when the prompt mentions FORMCYCLE navbar/navigationsleiste. Use CodBi Form.Navigator (data-cb-func=form.navigator) when the prompt mentions "CodBi Navbar" or "CodBi Navigation".

## XLanguageSwich

Language selector widget (XLanguageSwich Plugin). Renders one or more language links for switching the form language.

Languages are defined via the "options" array — each entry creates one language link with "text" (display name, e.g. "Deutsch") and "value" (language code, e.g. "de"). Standard properties: name, id, label. Custom property: xlangswitch_page_redirect ("0"=off, "1"=remember current page after language switch).

## XBsLogin (Bürger-Services)

Bürger-Services login button. CRITICAL — Whenever the prompt asks for a "BundID Login-Button", "Bürgerkonto Login", "BundID-Login", or "Authentifizierungsbutton", ALWAYS create an element with className="XBsLogin" and set the `bs_auth_ref` property (e.g. "BUND_ID::https://idp.bundid.de"). NEVER use an XButtonList/BUTTON for a BundID/Bürgerkonto login button — a login button is NOT a navigation/submit button.

Properties: name, id, bs_btn_text (button label), bs_auth_ref (authenticator reference, e.g. "BUND_ID::https://idp.bundid.de"), bs_show_in_popup ("true" for popup login), bs_page_name (page after login), bs_cancel_page_name (page on cancel), bs_check_page ("true" to validate), bs_postbox_mandatory ("true" if postbox required), bs_trust_level (trust level: "m|0"=no restriction, "e|3"=certificate, "m|3"=certificate or ID, "e|4"=ID card), bs_login_method (restrict login method), bs_requested_attributes (requested SAML attributes), bs_suffix (auth data suffix), bs_hide_if_userprofile_exists ("true" to hide if already logged in), bs_ui_info_display_name (display name for the authenticator).

## XOrderItem / XOrderButton (AKDB ePayBL)

Order widgets of the AKDB E-Payment plugin (plugin-bundle-epaybl). Use them when the prompt asks for an order/payment form ("Bestellung", "Ware bestellen", "Bezahlformular", "Bestellartikel", "in den Warenkorb").
- XOrderItem — one orderable item. Properties (xorderitem_* prefix): xorderitem_number (item number), xorderitem_description, xorderitem_price (single price), xorderitem_tax (tax rate %), xorderitem_count / xorderitem_start_count / xorderitem_max_count (quantity), xorderitem_required ("true" forces the item), xorderitem_beleg_number (document/receipt number), xorderitem_hst (Haushaltsstelle), xorderitem_object_number, xorderitem_to_order ("true" to include in the order), xorderitem_booking_text, xorderitem_href.
- XOrderButton — submits the order to ePayBL. Properties (xorderbutton_* prefix): xorderbutton_text (button label), xorderbutton_validate_page ("true" to validate the page before ordering).
- CRITICAL — These widgets require the AKDB E-Payment plugin to be installed AND configured; the PaymentInitPlugin workflow node turns the order into the actual payment. REQUEST the exact property keys via the widget-details mechanism before emitting them.

## Bürger-Services / BundID form fields

When the prompt asks for "Bürger-Services", "Bürgerkonto", "BundID", or citizen eID form fields, use these pre-configured element names:

Grouped inside XFieldSet named "fsBKAllDaten" with legend "Ihre Anmeldedaten":
- XSelect name="selPersTyp" for login type (radio, options: NatPers/NNatPers)
- XSelect name="selAntragstellerGeschlecht" for gender
- XSelect name="tfAntragstellerAnrede" for salutation
- XTextField name="tfAntragstellerTitel" for academic title
- XTextField name="tfAntragstellerVorname" for first name
- XTextField name="tfAntragstellerName" for last name
- XTextField name="tfAntragstellerZusatzname" for last name suffix
- XTextField name="tfAntragstellerEmail" (datatype="email") for email
- XTextField name="tfAntragstellerGeburtsdatum" (datatype="dateDE") for birth date
- XTextField name="tfAntragstellerGeburtsname" for birth name
- XTextField name="tfAntragstellerGeburtsort" for place of birth
- XTextField name="tfAntragstellerTelefon" for phone

OptiGOV extra fields: tfAntragstellerMittelname, tfAntragstellerKuenstlername, tfAntragstellerDoktorgrad, tfAntragstellerPseudonym, tfAntragstellerDeMail (datatype="email"), tfAntragstellerLand, tfAntragstellerNationalitaet, tfAntragstellerAusstellenderStaat

Address fields: tfAntragstellerAdresse, tfAntragstellerAuslandsAdresse, tfAntragstellerPLZ (datatype="plzDE"), tfAntragstellerOrt, tfAntragstellerAGS (isreadonly="2")

Technical fields (readonly): tfAuthentifizierungsLevel, tfAuthentifizierungsName, tfDokumentTyp, TrustLevel, etc.

CRITICAL — Bürger-Services/BundID fields (all tfAntragsteller* and technical fields) are autofilled by the authentication system AFTER login. Do NOT add data-cb-func (no OpenPLZ.Autocomplete, no ldap.autocomplete) to these fields — the Bürger-Services plugin itself maps the authentication response data. However, CSS classes for client-side formatting/validation (CodBi_People_Name, CodBi_People_Mail, CodBi_People_Phone, CodBi_People_PLZ, CodBi_People_BuildingNumber) SHOULD still be applied — they are purely formatting and do NOT interfere with authentication autofill.
