# Formcycle Widgets

Valid FORMCYCLE element className values (use ONLY these exact strings — do NOT invent class names like 'XButton', 'XInput', 'XText'):

CRITICAL — 'XButton' does NOT exist. Use XButtonList with a 'buttons' array for any button.
CRITICAL — XTextField uses 'datatype' (not 'type') for input validation. The 'type' property does NOT exist on XTextField.
CRITICAL — EVERY element needs a 'label' property (except containers/fieldsets which use 'legend'). Without a label, the element won't render in the designer.

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
- "regexp" custom regex (also add datatypeHint property with the regex pattern and error message)

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

Template:
```json
{"className":"XUpload","properties":{"name":"fdExample","id":"xi-fd-example","label":"Example","required":"0","fileextension":"","fullwidth":"0"}}
```

## XSelect

Dropdown / select list. Use 'options' array for static items.

Template:
```json
{"className":"XSelect","properties":{"name":"selExample","id":"xi-sel-example","label":"Example","required":"0","fullwidth":"0","options":[]}}
```

## XCheckbox

Checkbox (note: lowercase 'b').

Template:
```json
{"className":"XCheckbox","properties":{"name":"cbExample","id":"xi-cb-example","label":"Example","required":"0","checkboxvalue":"1","checkedvalue":"1"}}
```

## XButtonList

Button or button group. No label property. 'buttons' array contains button objects each with: 'name' (technical ID), 'value' (display text, may be HTML), 'action' object.

WARNING: action.page uses special FORMCYCLE keywords, NOT form page names:
- "submit" = submit the form to the server (NOT a page name — do NOT replace with 'p1' or any other page)
- "previous" = go back
- any page name (e.g. "p1") = navigate to that page

For a button that sends/submits the form: action.page="submit", action.check=true.
For a no-action button: omit action or set action.page="".

MANDATORY RULE — XButtonList submit button: For any button that submits or sends the form (e.g. 'Absenden', 'Senden', 'Einreichen', 'Prüfen und Senden'), use EXACTLY this action: {"page":"submit","check":true,"customAction":"","customClassNames":"","displayName":"","optionId":"submit + check","value":""}. The string 'submit' is a FORMCYCLE server-side command — it is NOT a page name and must NEVER be replaced with any page name.

Template:
```json
{"className":"XButtonList","properties":{"name":"btlExample","id":"xi-btl-example","buttons":[{"name":"btnExample","value":"Button Text","action":{"page":"submit","check":true,"customAction":"","customClassNames":"","displayName":"","optionId":"submit + check","value":""}}]}}
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

Generic layout container. Has no 'label' property.

Template:
```json
{"className":"XContainer","properties":{"name":"coExample","id":"xi-co-example","elements":[],"fullwidth":"0"}}
```

## XContainerInvisible

Invisible/hidden layout container. Same as XContainer but not rendered. Has no 'label' property.

Template:
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

CRITICAL — When the prompt names a specific Terminplan (e.g., "Terminfinder für ddd"), add 'appointmentPlan' with the schedule name as value (e.g., "appointmentPlan":"ddd"). The backend automatically resolves the name to the correct UUID for 'appointmentTemplate'. You do NOT need to set 'appointmentTemplate' yourself.

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

CRITICAL: The formula expression goes into 'xformula_value' (NOT 'value' — using 'value' is wrong and won't work). All properties use the 'xformula_' prefix: xformula_value (the formula), xformula_type ("auto" or "text"), xformula_empty_as_zero ("0"=treat empty as text, "1"=treat as zero), xformula_index (order index). Formatting properties: xformula_unit, xformula_align ("p"=before number, "s"=after number), xformula_external ("true" for unit outside field), xformula_external_width, xformula_mdec, xformula_decimal, xformula_thousands, xformula_color_value, xformula_color_pos, xformula_color_neg. Do NOT set datatype, readonlyif, readonlyifmode, readonlyifcomp, or readonlyifvalue on XFormula.

## XRating

Rating widget (XRating Widget Plugin). Visual rating with configurable icons (stars, thumbs, emoticons). The NUMBER of icons is determined by the 'options' array — each entry generates one clickable icon.

Properties: xrating_icon_inactive (icon for unselected state — common values: "ico-rating-star", "ico-rating-star-outline", "ico-rating-thumb-up", "ico-rating-thumb-down", "ico-rating-emoticon-happy", "ico-rating-emoticon-sad", "ico-rating-emoticon-neutral"), xrating_icon_active (icon for selected state — same icon options), xrating_color_gradient ("true" to enable color gradient), xrating_color_start (start color in rgb() format, e.g. "rgb(181,45,58)" — CRITICAL: use rgb(R,G,B) format, NOT hex like "#b52d3a"), xrating_color_end (end color in rgb() format).

## XCaptcha

Captcha widget (CAPTCHA Plugin). Displays a hard-to-read challenge text that the user must enter to prove they are human. Standard properties: name, id, label. Has built-in refresh and audio play buttons. No custom properties needed.

## XReCaptcha

Google reCAPTCHA widget (reCAPTCHA Plugin). Integrates Google reCAPTCHA. Properties: recaptcha_site_key (site key), recaptcha_secret_key (secret key).

## XHtmlWidget

Custom HTML element (XHtml Widget Plugin). Renders custom HTML code. Properties: html_code (the HTML content, e.g. "<h1>Title</h1>").

## XMap

Leaflet map widget (XMap Plugin). Displays an interactive map. Properties use 'xmap_' prefix: xmap_latitude, xmap_longitude, xmap_zoom, xmap_min_zoom, xmap_max_zoom, xmap_min_markers, xmap_max_markers, xmap_geometry_point, xmap_geometry_line, xmap_geometry_area, xmap_localize, xmap_locate_button, xmap_color_marker_point, xmap_color_marker_user, xmap_color_line, xmap_color_area_border, xmap_color_area_fill. Advanced: xmap_use_custom_map_source, xmap_custom_map_source, xmap_custom_map_source_type ("tms"/"wms"/"wmts"), xmap_wms_layers, xmap_wms_format, xmap_wms_version, xmap_wms_crs, xmap_use_http_settings.

## XNavigationBar

Navigation bar / progress bar widget (XNavigationBar Plugin). Renders a visual step indicator bar showing all form pages.

Use when the prompt mentions "XIMA Navigationsleiste", "XIMA navbar", "FORMCYCLE navbar", "Navigationsleiste", "Progress Bar", "FC-Navbar", "formcycle navigation bar", or "FC-Navigationsleiste". Standard properties: name, id, label. Steps are defined via the "options" array — each entry creates one step with "text" (display name) and "value" (page identifier). For custom step count, provide that many options entries. Uses custom action button types: xnavbar_next (next page), xnavbar_next_check (next page + validation), xnavbar_prev (previous page), xnavbar_prev_check (previous page + validation).

CRITICAL — Distinguish from CodBi Form.Navigator: Use XNavigationBar when the prompt mentions FORMCYCLE navbar/navigationsleiste. Use CodBi Form.Navigator (data-cb-func=form.navigator) when the prompt mentions "CodBi Navbar" or "CodBi Navigation".

## XLanguageSwich

Language selector widget (XLanguageSwich Plugin). Renders one or more language links for switching the form language.

Languages are defined via the "options" array — each entry creates one language link with "text" (display name, e.g. "Deutsch") and "value" (language code, e.g. "de"). Standard properties: name, id, label. Custom property: xlangswitch_page_redirect ("0"=off, "1"=remember current page after language switch).

## XBsLogin (Bürger-Services)

Bürger-Services login button. When the prompt asks for a "BundID Login-Button", "Bürgerkonto Login", or "Authentifizierungsbutton", create an element with className="XBsLogin".

Properties: name, id, bs_btn_text (button label), bs_auth_ref (authenticator reference, e.g. "BUND_ID::https://idp.bundid.de"), bs_show_in_popup ("true" for popup login), bs_page_name (page after login), bs_cancel_page_name (page on cancel), bs_check_page ("true" to validate), bs_postbox_mandatory ("true" if postbox required), bs_trust_level (trust level: "m|0"=no restriction, "e|3"=certificate, "m|3"=certificate or ID, "e|4"=ID card), bs_login_method (restrict login method), bs_requested_attributes (requested SAML attributes), bs_suffix (auth data suffix), bs_hide_if_userprofile_exists ("true" to hide if already logged in), bs_ui_info_display_name (display name for the authenticator).

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
