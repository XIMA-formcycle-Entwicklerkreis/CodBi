# Formcycle Widgets (Compact)

Condensed reference: the FORMCYCLE widget types and what each is for. You receive ONLY this list initially. Before you create a widget you MUST request its detailed JSON structure by returning a details request with a "widgets" array listing ALL widget classNames you need — the server then provides the exact JSON templates and properties for exactly those widgets. List every widget you plan to use (including containers/pages) so none is missing.

LABELS — Every interactive element you create MUST carry a meaningful 'label' that describes its purpose, written in the same language as the user's request (e.g. "Straße", "Postleitzahl", "Ort", "Land" for an address form). NEVER use generic placeholders such as "Label", "Example", "Text" or "Field".

REQUIRED OPTIONS — Several widgets have mandatory options (e.g. XSelect needs its 'options' list, XButtonList needs its 'buttons' with the action, XUpload needs its source, a datatype-validated XTextField needs the matching datatype). Whenever a genuinely required widget option cannot be derived from the user's request, ASK the user for it instead of inventing it (e.g. if the user says "a dropdown for the city" but does not list the choices, ask which options to show).

EXISTING FORM ELEMENTS — the current form's existing items (their `name`s) are always provided with the request. NEVER ask whether a referenced field/container already exists (e.g. "Existieren die Felder … bereits?" / "bereits vorhanden oder neu anlegen?") — reuse it if present, create it if absent, without asking.

## XTextField
Single-line text input. Validation via the 'datatype' property (plain, date/dateDE, email, phone, url, time, number, money, plzDE, ipv4, regexp, ...).
## XTextArea
Multi-line text input. Always set fullwidth="1".
## XUpload
File upload / file download field. CRITICAL — when the upload is for an image/ID card WITH a cropper ("Bild-Cropper", "with crop", "Personalausweis ... mit Bild-Cropper"), the XUpload MUST carry data-cb-func="Media.Image.Cropper" (or a CodBi_Fotocropper_* class) — an upload without the cropper is WRONG.
## XSelect
Dropdown / select list. Static items go in the 'options' array. MUST always have a NON-EMPTY 'options' array (each option {"text":"<display>","value":"<value>"}) — NEVER create a select with empty options; if the request names the select (e.g. "Stadt") but gives no options and they cannot be derived, ASK the user for the option list.
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
Read-only calculation / formula field (XFormula Widget Plugin). Properties use the 'xformula_' prefix; the formula goes into xformula_value (NOT 'value'); formatting via xformula_unit/xformula_decimal/xformula_thousands/xformula_align. Computes from other fields' values only — not the page DOM.
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
Navigation / progress bar widget (XNavigationBar Plugin) — for FORMCYCLE navbars (NOT CodBi Form.Navigator).
## XLanguageSwich
Language selector widget (XLanguageSwich Plugin).
## XBsLogin
Bürger-Services login button (BundID / Bürgerkonto authentication). CRITICAL — ALWAYS create XBsLogin (with bs_auth_ref) for a "BundID-Login-Button" / "Bürgerkonto-Login" / authentication button — NEVER an XButtonList/BUTTON.
