# Formcycle Widgets (Compact)

Condensed reference: the FORMCYCLE widget types and what each is for. You receive ONLY this list initially. Before you create a widget you MUST request its detailed JSON structure by returning a details request with a "widgets" array listing ALL widget classNames you need — the server then provides the exact JSON templates and properties for exactly those widgets. List every widget you plan to use (including containers/pages) so none is missing.

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
Button or button group. 'buttons' array; action.page uses FORMCYCLE keywords ("submit", "previous", page name).
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
