# Formcycle Widgets (Compact)

Condensed reference: the FORMCYCLE widget types and what each is for. You receive ONLY this list initially. Before you create a widget you MUST request its detailed JSON structure by returning a details request with a "widgets" array listing ALL widget classNames you need — the server then provides the exact JSON templates and properties for exactly those widgets. List every widget you plan to use (including containers/pages) so none is missing.

LABELS — Every interactive element you create MUST carry a meaningful 'label' that describes its purpose, written in the same language as the user's request (e.g. "Straße", "Postleitzahl", "Ort", "Land" for an address form). NEVER use generic placeholders such as "Label", "Example", "Text" or "Field".

REQUIRED OPTIONS — Several widgets have mandatory options (e.g. XSelect needs its 'options' list, XButtonList needs its 'buttons' with the action, XUpload needs its source, a datatype-validated XTextField needs the matching datatype). Whenever a genuinely required widget option cannot be derived from the user's request, ASK the user for it instead of inventing it (e.g. if the user says "a dropdown for the city" but does not list the choices, ask which options to show).

## XTextField
Single-line text input. Validation via the 'datatype' property (plain, date/dateDE, email, phone, url, time, number, money, plzDE, ipv4, regexp, ...).
## XTextArea
Multi-line text input. Always set fullwidth="1".
## XUpload
File upload / file download field.
## XSelect
Dropdown / select list. Static items go in the 'options' array.
## XCheckbox
Checkbox (lowercase 'b').
## XButtonList
Button or button group. 'buttons' array; action.page uses FORMCYCLE keywords: "" (none/custom), "next" (next page), "previous" (previous page), a page name (navigate to it), or a submit command ("submit", "submitNoCheck", "submitSave", "submitSaveNoCheck", "submitPreview", "submitPreviewWindowed"). action.check=true validates the CURRENT page's fields before the action — use it for "next"/"Weiter" and submit buttons whenever the page has required, datatype-validated or CodBi-tagged (CodBi_* class) fields; check=false skips validation.
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
Appointment / calendar picker (Terminfinder). NOT for plain date input.
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
Read-only calculation / formula field (XFormula Widget Plugin).
## XRating
Rating widget with configurable icons (XRating Widget Plugin).
## XCaptcha
Captcha widget (CAPTCHA Plugin).
## XReCaptcha
Google reCAPTCHA widget (reCAPTCHA Plugin).
## XHtmlWidget
Custom HTML element (XHtml Widget Plugin).
## XMap
Interactive Leaflet map widget (XMap Plugin).
## XNavigationBar
Navigation / progress bar widget (XNavigationBar Plugin) — for FORMCYCLE navbars (NOT CodBi Form.Navigator).
## XLanguageSwich
Language selector widget (XLanguageSwich Plugin).
## XBsLogin
Bürger-Services login button (BundID / Bürgerkonto authentication).
