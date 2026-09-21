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

AUTOMATIC UPLOAD — ALWAYS CHECKED BY DEFAULT: an XUpload ALWAYS gets the "Automatischer Upload" (Automatic Upload) property CHECKED unless the user explicitly asks otherwise — set the DIRECT property `"uploadMode":"ajax"` on EVERY XUpload you create (verified in the Formcycle jar: the renderer activates the AJAX/automatic upload only when `uploadMode` equals `"ajax"`, which uploads the selected file immediately on selection via `data-upload-mode` + `XUploadAjaxUUID`; the default/empty value would upload only on form submit). OMITTING `uploadMode="ajax"` is a FAIL. Only when the user EXPLICITLY wants the file NOT to be uploaded right away (e.g. "soll erst beim Absenden hochgeladen werden") do you leave `uploadMode` empty ("") instead.

VORSCHAU / PREVIEW — USE THE FORMCYCLE PREVIEW PROPERTY, NEVER THE CROPPER: when the user asks to SEE the selected file/image before/after choosing it ("Vorschau", "preview", "Bildvorschau", "sich das Bild ansehen", "anzeigen"), that is the FORMCYCLE preview configuration, NOT a CodBi cropper — set the DIRECT boolean property `"filepreview":"1"` (verified in the Formcycle jar: the renderer's `getFilePreview` reads the `filepreview` property and then renders `data-file-preview="true"` plus the `XImagePreview` class). Mentioning "Vorschau/preview" is NOT a cropper request — do NOT tag the upload with data-cb-func="Media.Image.Cropper" (or a CodBi_Fotocropper_* class) for a plain preview.

MULTIPLE FILES / "mehrere Dateien" — APPLY THE CODBI Media.MultipleUpload FUNCTIONALITY: when the request wants SEVERAL files uploadable into the ONE field ("auch mehrere Dateien hochladen", "mehrere Dateien/Bilder/Anhänge", "multiple files", "Upload mehrerer Dateien"), that is the CodBi MULTIPLE-UPLOAD functionality, NOT the cropper and NOT the preview. Apply it ON that XUpload: (1) `"attributes"` gets `{"text":"data-cb-func","value":"Media.MultipleUpload"}` plus `{"text":"data-cb-Maximum","value":"<N>"}` when the request names a file COUNT (omit it → the functionality's default of `2`), optionally `{"text":"data-cb-PrefixTooMany","value":"..."}` / `{"text":"data-cb-PostfixTooMany","value":"..."}`; (2) the DIRECT property `"uploadMultiple":"1"` (the Formcycle native multiple-file flag) on the same XUpload. NEVER omit the multiple-upload functionality on a "mehrere Dateien" upload (a single-file-only upload is a FAIL), and NEVER confuse it with the cropper/preview. CRITICAL — "mehrere Dateien" means several FILES IN THE ONE FIELD, NOT several upload FIELDS: a request to add/replace "ein Feld … mehrere Dateien hochgeladen werden" creates EXACTLY ONE XUpload (the one field, carrying Media.MultipleUpload + uploadMultiple). NEVER create a second/"weiteres"/"another" upload element or a duplicate field for the same request — a single upload request yields a single XUpload.

ALLOWED EXTENSIONS & MAX FILE SIZE — ALWAYS DERIVE FROM THE REQUESTED FILE TYPE: an XUpload has two DIRECT properties for restricting what may be selected — `"fileextension"` (comma-separated allowed extensions / globs, e.g. `".jpg,.jpeg,.png,.pdf"` or `".pdf,.doc,.docx"` or `"image/*"`; verified in the Formcycle jar: `renderItem` reads `fileextension` and builds the `<input accept="...">` from it) and `"maxfilesize"` (the maximum size of EACH file in **KB**). Set them from the kind of files the request implies — NEVER leave a type-specific upload default/empty:
- an upload for IMAGES/photos/pictures ("Bild", "Foto", "Perso/Personalausweis", "image", "photo") → `"fileextension":".jpg,.jpeg,.png,.pdf"` (or `"image/*"`; .PDF is INCLUDED because people often embed images in PDF files) and `"maxfilesize":"4096"` (≈ 4 MB);
- an upload for DOCUMENTS/files ("Dokument", "Lebenslauf", "PDF", "document", "Datei") → `"fileextension":".pdf,.doc,.docx"` (Word `.doc/.docx` are the document standard and are INCLUDED by default) and `"maxfilesize":"1024"` (≈ 1 MB);
- when the user names specific extensions or an explicit size, use THOSE values (extensions as written, size as written in KB) instead of the defaults; a size the user gives in MB is converted to KB (value × 1024).
A request that names ONLY the file type (image vs document) is never a clarification question — DERIVE the extension + KB size yourself as above.

CRITICAL — TWO DISTINCT USES of the CROPPER (only for actual cropping of the image): (a) when the upload itself must crop the selected image/ID card ("Bild-Cropper", "with crop", "Personalausweis ... mit Bild-Cropper"), the XUpload MUST carry data-cb-func="Media.Image.Cropper" (or a CodBi_Fotocropper_* class) — an upload without the cropper is WRONG. (b) A "Fotocropper-Board" / "Bild-Cropper vor dem Upload X" (a full photo-cropper setup placed BEFORE an upload) is a SEPARATE complete CodBi_Fotocropper group (wrapper CodBi_Fotocropper + CodBi_Fotocropper_Board + CodBi_Fotocropper_Uploader + CodBi_Fotocropper_Update + CodBi_Fotocropper_ImageURL + CodBi_Fotocropper_Foto); the referenced upload itself then gets NO data-cb-func="Media.Image.Cropper". A plain "Vorschau/preview" request is NEITHER — it maps ONLY to `"filepreview":"1"`.

Template (image upload with multi-file + auto upload + preview):
```json
{"className":"XUpload","properties":{"name":"fdExample","id":"xi-fd-example","label":"Example","required":"0","fileextension":".jpg,.jpeg,.png,.pdf","maxfilesize":"4096","fullwidth":"0","uploadMode":"ajax","uploadMultiple":"1","filepreview":"1"},"attributes":[{"text":"data-cb-func","value":"Media.MultipleUpload"}]}
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

XSELECT FED BY A FORMCYCLE DATASOURCE ("Quelle" / "Datenquelle" / "source") — this is the element's OWN "Data source" property, NOT a functionality and NOT an EP:
A "Quelle" / "Datenquelle" / "source" — typically named together with a column ("Spalte 1 in der Quelle Staatsangehörigkeiten", "column 1 of the source X") — means a FORMCYCLE DATASOURCE that is configured server-side in the Formcycle backend. It is NOT an element placeholder (EP): NEVER wire it with data-cb-func="html.select.injection" and NEVER invent an EP like `{ Staatsangehoerigkeit > column1 }` (a datasource name is not an EP id — such a placeholder cannot resolve). Bind the datasource with the XSelect's own properties:
- `datasource`: the datasource configured in the Formcycle backend — use the name the request gives AS-IS. Datasources are server-side data (like DataQueries): NEVER ask whether the datasource exists, and never ask for its internal ID.
- `dstextidx`: the 1-BASED number of the column whose values become the option TEXT (what the user SEES in the list).
- `dsvalueidx`: the 1-BASED number of the column whose values become the option VALUE (the submitted value).
- `dstitleidx` (optional): the 1-BASED number of the column whose values become the option title/tooltip. A "Titel-Spalte" / "title column" ALWAYS belongs here.
- `dstype` (optional): the datasource kind — one of `DB`, `CSV`, `JSON`, `XML`, `LDAP`, `USER`, `PLUGIN`. Set it only when the request names the kind.
- `ds_rendercolattr` (optional): "Render all attributes" — `"1"` renders EVERY datasource column as an attribute on each option. Set it when the user asks for all columns/attributes to be rendered on the options.
- `showpleaseselect`: "Show default option" — `"1"` adds a leading DEFAULT option so NOTHING is preselected ("wenn nichts ausgewählt ist, soll … da stehen" / "Bitte wählen" / "show a default option"). The default option's TEXT is Formcycle-localized: there is NO text property, so NEVER use `placeholder` for it (an XSelect renders no placeholder) and never invent a property.
- `removeduplicatetextvaluepairs`: "Remove duplicate text-pairs" — `"1"` removes options that share the same text+value pair ("doppelte Werte sollen entfernt werden" / "remove duplicate values"). For a DATASOURCE select this is the XSelect's OWN property — NEVER use the `Unique` element placeholder / `html.select.injection` for it.
- `showpleaseselectreq` (optional): the default option counts as a REQUIRED selection (the user must actively choose). Keep the template default unless the default option itself shall be mandatory.
- `options` MUST stay an EMPTY array (`[]`): the entries are resolved FROM the datasource at render time, exactly like an EP-fed select. Never put static option objects here for a datasource select.
COLUMN NUMBERS ARE 1-BASED — "Spalte 1" is the FIRST column. (The designer's defaults are dstextidx "1" and dsvalueidx "2".)
MAP THE USER'S WORD TO THE PROPERTY — the WORD the user uses for a column decides which of the THREE properties it fills; a TITLE column is NEVER the text column:
- TEXT → `dstextidx` ("Text-Spalte", "Spalte N als Text", "Anzeigetext", "Anzeige-Spalte", "Optionstext", "Optionen", "Beschriftung", "display column", "text column", "label column").
- VALUE → `dsvalueidx` ("Wert-Spalte", "Spalte N als Wert", "Wert", "übermittelter Wert", "value column", "submitted value").
- TITLE → `dstitleidx` ("Titel-Spalte", "Spalte N als Titel", "Titel", "Tooltip-Spalte", "Tooltip", "title column", "tooltip"). A named TITLE column goes into `dstitleidx` ONLY — NEVER into `dstextidx`/`dsvalueidx`.
The default "ONE named column → set BOTH `dstextidx` AND `dsvalueidx` to it" applies ONLY to a column WITHOUT a role word ("Spalte 1", "column 1"); a column that carries a role word is assigned ONLY to that role's property. Several role columns may be named together — map each to its own property ("Spalte 1 als Text, Spalte 2 als Wert", plus "Titel-Spalte = Spalte 5" → `dstextidx` 1, `dsvalueidx` 2, `dstitleidx` 5).
Example — "Füge eine Auswahl hinzu, die die Spalte 1 in der Quelle Staatsangehörigkeiten als Option anbietet.":
```json
{"className":"XSelect","properties":{"name":"selStaatsangehoerigkeit","id":"xi-sel-staatsangehoerigkeit","label":"Staatsangehörigkeit","required":"0","fullwidth":"0","datasource":"Staatsangehörigkeiten","dstextidx":"1","dsvalueidx":"1","options":[]}}
```
Example with a SEPARATE title column — "Auswahl aus der Quelle FOR0308-Flurfoerderzeuge, Spalte 2 als Option, Spalte 4 als Wert, Titel-Spalte ist Spalte 5.":
```json
{"className":"XSelect","properties":{"name":"selFlurfoerderzeuge","id":"xi-sel-flurfoerderzeuge","label":"Auswahl","required":"0","fullwidth":"0","datasource":"FOR0308-Flurfoerderzeuge","dstextidx":"2","dsvalueidx":"4","dstitleidx":"5","options":[]}}
```

## XCheckbox

Checkbox (note: lowercase 'b').

CRITICAL — UNCHECKED BY DEFAULT: A checkbox must NEVER be initially checked unless the user
explicitly asks for a pre-checked box ("vorausgewählt", "standardmäßig aktiviert", "initially
checked", "pre-checked", "standardmäßig angehakt", …). The INITIAL checked state is controlled by the
"checkedvalue" property — NOT by "value" (a "value" key on a checkbox is ignored by formcycle).
Formcycle renders the box CHECKED when "checkedvalue" is "1", and UNCHECKED when "checkedvalue" is ""
(empty string) — so for an initially-unchecked box ALWAYS set `"checkedvalue":""` (empty string).
Only set `"checkedvalue":"1"` AND `"value":"1"` together when the user EXPLICITLY requested a
pre-checked box. "checkboxvalue" is the value submitted when the user ticks the box at runtime (the
input's value attribute; default "on", "1" is also valid) and does NOT affect the initial state.

Template (initially UNCHECKED):
```json
{"className":"XCheckbox","properties":{"name":"cbExample","id":"xi-cb-example","label":"Example","required":"0","checkboxvalue":"1","checkedvalue":""}}
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

HELP / HINWEIS — the Formcycle "Hilfe"/"Help" property is the DIRECT element property `"helptext"` (verified: an `XPropertyEnum`, rendered as the question-mark help of the element). A HELP/HINT on an element is a LANGUAGE-AGNOSTIC CONCEPT — never a literal keyword; ANY language, e.g. "Hinweis"/"als Hinweis soll beschrieben werden …" (de), "help text"/"hint" (en), "nota"/"aiuto" (it), "hint"/"hulplijn" (nl), "note"/"aide" (fr) — ALWAYS goes into `"helptext":"<text>"` in that element's properties. NEVER implement a help/hint via HTML.SETAttribute + `data-cb-name="title"` (that is an HTML title tooltip of a tag, not the Formcycle Help field the designer shows) — using HTML.SETAttribute for a requested help/hint is a FAIL. The hint is written into that element's `helptext` and NOWHERE ELSE: it is NEVER repeated as visible text and NEVER gets its own (second) XSpan/text element — when the request says the hint belongs to a designed text, it belongs to THAT SAME XSpan's `helptext`, so do NOT create an extra text element for it.

RICH / DESIGNED / INTERACTIVE TEXT — when the request asks for a text in a NICE / DESIGNED / INTERACTIVE style (a LANGUAGE-AGNOSTIC CONCEPT — never a literal keyword; ANY language, e.g. "in schönem Design"/"interaktiv" (de), "nice design"/"interactive" (en), "bel design"/"interattivo" (it), "mooi ontwerp"/"interactief" (nl), "beau design"/"interactif" (fr), or simply a standout/informational block), the XSpan's `rtevalue` is FULL styled HTML carrying a REAL interactive AND ANIMATED effect: headings + one styled card/box per point (each with a static inline `style="…"` look) PLUS a genuine CSS animation/interaction — e.g. a load/entrance animation (`@keyframes` fade/slide-in applied via `animation: …`), a hover effect (`:hover` lift / scale / colour change via `transition: …` + `transform: …`), or an animated `<details open>` + `<summary>` fold-out. NEVER answer a requested designed/interactive text with one plain paragraph, and never with STATIC styling alone: a designed/interactive text that is only text, or only styled but with NO interactive/animated effect at all, is a FAIL. YOU COMPOSE THE CONTENT — when the request names only a TOPIC/subject (e.g. "die Vorteile einer KI zur Formulargenerierung"), write the full text yourself (every point the topic implies, each with a short explanation); NEVER ask the user for the text content and never leave the text empty, and a requested "Hinweis"/help is composed by you as well into this SAME XSpan's `helptext`. EXACTLY ONE XSpan — the designed content is written into ONE single text element: NEVER create a SECOND XSpan for the same text (not even re-styled, re-coloured, renamed or with a different class/keyframes prefix — such a copy is a DUPLICATE and a FAIL), and when the form ALREADY contains that designed text, MODIFY that existing XSpan (keep its EXACT `properties.name`) instead of adding another one. NEVER BLANK AN EXISTING TEXT ELEMENT: rebuilding the designed text means writing the new `rtevalue` (and `helptext`) INTO that existing element — never empty an existing XSpan (`"rtevalue":""` renders as a stray "Text" node and is a FAIL) and never leave old, now-contentless text elements behind when you put the content into a new one. A rebuild/rerun pass must therefore leave the element count unchanged.

NO SEPARATE TEXT INPUT NEXT TO A DESIGNED TEXT — a request for "ein Textfeld"/"a text field" that ALSO asks for design/illustration/animation/hover ("Vorteile … stichpunktartig … Design … interaktiv … hover" / "Illustration … animiert") is a designed text BLOCK, NOT an input field: NEVER create BOTH the designed-text XSpan AND a separate text input (an XTextArea or a tf…/ta… field) carrying THE SAME content — that is a DUPLICATE and a FAIL. A designed/interactive text (with illustration/animation/hover) is ALWAYS rendered as the ONE XSpan's `rtevalue` and NEVER ALSO as an XTextArea/XTextField: the XSpan is the whole answer, so do NOT also add an input field for that same text. When the request literally names an input ("Textfeld zum Ausfüllen", "textarea", "Multiline-Input") WITHOUT asking for design/illustration/animation, use XTextArea; but the moment design/illustration/animation/hover is requested for that same text, emit ONLY the single designed XSpan and NO input.

HOW TO GET REAL CSS ANIMATIONS INTO THE FORM — the animation CSS (`@keyframes` body + the class rules) is written as a `<style>` block INSIDE the SAME XSpan's `rtevalue`, i.e. directly in the HTML text body of the element (the rtevalue is inserted into the rendered page, so a `<style>` element inside it defines the animation for that text). This is the ONLY working mechanism for a designed/interactive text:
- compose the `rtevalue` as: a leading `<style> … </style>` block (the `@keyframes` + the class rules) FOLLOWED by the styled HTML content (headings + one card/box per point), and give those HTML elements the SAME class names (`<style>@keyframes cbAiFadeIn{…} .cbAiBenefitsCard{animation:…;transition:…;} .cbAiBenefitsCard:hover{…} @media (prefers-reduced-motion: reduce){…}</style><div class='cbAiBenefitsCard' style='…'>…</div>`);
- an inline `style="…"` attribute ALONE can NEVER express `@keyframes` or `:hover` (a style attribute has no selector/pseudo-class), so the in-`rtevalue` `<style>` block is REQUIRED for the animation; keep the static inline `style="…"` on each element as a designed fallback;
- use a UNIQUE class prefix (e.g. `cbAiBenefits…`) so the CSS can never affect other form elements, and honour reduced motion via `@media (prefers-reduced-motion: reduce)`;
- do NOT use the `HTML.CSS` functionality for this animation and do NOT emit a separate helper element: an `HTML.CSS` element/attribute setting `@keyframes` does NOT work — the `<style>` block belongs INSIDE the animated XSpan's own `rtevalue`;
- STILL NEVER emit `<script>`, `<head>`, external CSS/remote images, and never an `<style>` block on a DIFFERENT element than the animated text.
- a requested ILLUSTRATION / drawing (e.g. "eine animierte SVG Illustration … die ein Formular zeigt", "SVG", an illustration above the first line of the text) is written as an INLINE `<svg viewBox='…'>…</svg>` INSIDE the SAME `rtevalue` (NEVER an `<img src="https://…">`, never a remote image/animated GIF), placed at the requested position (e.g. as the FIRST element of the `rtevalue`, above the heading). It must be ANIMATED — SVG SMIL (`<animate attributeName='opacity' …/>`, `<animateTransform …/>`) AND/OR a CSS animation whose `@keyframes` you define in the in-`rtevalue` `<style>` block with the matching class on the SVG shape; a requested "animierte" illustration that renders static is a FAIL.
  - IT MUST BE A DESIGNED, PROFESSIONAL ILLUSTRATION — a placeholder drawing (one plain grey `<rect>`, a bare circle/line/arrow) is a FAIL, and so is writing WORDS into the SVG as a substitute for the artwork (a box labelled "Formular", a circle labelled "AI", a centred `<text>` doing the work of the drawing). Build a real SCENE instead: a canvas whose `viewBox` and ASPECT RATIO you DERIVE FROM THE CONTEXT — the illustration spans the SAME WIDTH as the text it belongs to, so take the proportions from where it sits (a WIDE banner, e.g. 16:9, for a full-width intro text; a squarer/compact canvas for a narrow column or a small inline illustration) and set `width='100%'` + `preserveAspectRatio='xMidYMid meet'` instead of fixed pixel sizes so it scales responsively — with SEVERAL layered `<g>` groups, a deliberate colour palette matching the text's design (the same card background/border/accent colours), `<defs>` with `<linearGradient>`/`<radialGradient>` fills plus an optional `<filter>`/`<feDropShadow>` for depth, rounded rectangles / paths / polygons for the objects (a browser window or form card with a title bar and three window dots, form rows as rounded rects, field labels as small light bars, an accent "AI" block or chip, sparkle/star shapes), and a soft background shape (blurred/rounded panel or ellipse) so it reads as an illustration rather than a wireframe. Compose the whole scene — ONE `<rect>` plus ONE `<text>` is NOT an illustration.
  - ANIMATE 2-4 MEANINGFUL DETAILS that support the topic (e.g. the sparkles pulsing — `<animate attributeName='opacity' values='0.3;1;0.3' dur='2s' repeatCount='indefinite'/>` — the form rows fading/sliding in one after another — `<animate attributeName='opacity' from='0' to='1' begin='0.2s' dur='0.6s' fill='freeze'/>` — an `<animateTransform>` scaling/rotating an accent shape, or a highlight moving across the form). NEVER animate every element at once and never leave it static.
  - CONNECT THE CSS, DO NOT JUST DECLARE IT — unlike CSS PROPERTY names (which are case-INSENSITIVE, so `Stroke-Width` is fine), every IDENTIFIER inside the CSS is CASE-SENSITIVE and must match its counterpart EXACTLY: (a) each `@keyframes NAME` must be referenced by an `animation`/`animation-name` whose name is spelled IDENTICALLY (an undefined name silently disables the animation; a defined-but-never-used `@keyframes` is dead code — observed: `@keyframes rotateGlobe` defined while no rule ever used it), (b) every class in a selector must be spelled identically to the `class='…'` in the markup, (c) every `url(#id)`/`href='#id'` must match the `id='…'` of the referenced gradient/clipPath/filter EXACTLY, and (d) `var(--Name)` must match the custom property's own spelling. Do not invent identifiers that appear nowhere.
  - SINGLE QUOTES for EVERY SVG/HTML attribute value inside the `rtevalue` (`width='100%'`, `viewBox='0 0 W H'`, `fill='#4caf50'`) — an escaped double quote (`width=\"200\"`) produces a broken attribute, so the SVG can render at the wrong size or not at all. Keep it self-contained: no `<script>`, no external CSS/images/fonts, no `<foreignObject>`.
  - EXACT camelCase FOR EVERY SVG NAME — SVG is CASE-SENSITIVE and an unknown spelling is silently IGNORED: `viewBox`, `preserveAspectRatio`, `xmlns`, `attributeName`, `repeatCount`, `begin`, `dur`, `linearGradient`, `radialGradient`, `stop-color`, `stop-opacity`, `animateTransform`, `stroke-dasharray`, `stroke-dashoffset`, `clipPath`, `filter`/`feDropShadow`. A lowercased `viewbox`, `animatetransform`, `attributename` or `repeatcount` gives you NO canvas (the drawing is cut off / misplaced, because the default viewBox is used) and NO animation at all — that is a FAIL. Naming/quotation example (the numbers are placeholders — YOUR `viewBox` W/H comes from the context): `<svg viewBox='0 0 W H' width='100%' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg'><defs><linearGradient id='g1' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#eef2ff'/><stop offset='1' stop-color='#c7d2fe'/></linearGradient></defs>…<animateTransform attributeName='transform' type='rotate' from='0 CX CY' to='360 CX CY' dur='20s' repeatCount='indefinite'/></svg>`.
  - A RECOGNISABLE COMPOSITION, NOT A DIAGRAM — draw the objects the request talks about: a form/browser CARD (rounded rect + title bar + three window dots + 3-4 field rows as rounded rects, each with a small light label bar), an accent "AI" element (chip/badge/star or a small sparkle cluster) and a soft BACKDROP (rounded panel or blurred ellipse) behind them, with gradient fills on the main shapes and a subtle shadow for depth. A composition of ONE rectangle plus ONE circle/line, dashed "connector" curves used as the main visual, or emoji-like faces is NOT an illustration (FAIL).
  - ANIMATE ONLY CHANGES THAT ARE VISIBLE — rotating a plain `<circle>` shows NOTHING (a circle is rotationally symmetric) and `scaleY` on a circle only squashes it: a rotation only reads on a shape with an ASYMMETRIC detail (a face with eyes and a mouth, a dial hand, a star, a logo, a flag) — draw that detail FIRST and then rotate the GROUP around it. Rotate/scale a multi-shape GROUP (the sparkle cluster, the badge/logo), let a path draw itself via `stroke-dashoffset`, fade/pulse rows via `opacity`, or scale an accent shape via `animateTransform`. If the change cannot be seen, animate a different property — an invisible animation counts as "not animated". An illustration whose ONLY visible motion is one dashed line "drawing itself" while its other two animations are invisible (a spinning circle, a squashed circle) is a FAIL. When you animate a shape's own `transform`, ALWAYS set `transform-box:fill-box` TOGETHER WITH `transform-origin:center` (or `bottom center`): without `transform-box` the origin resolves against the whole SVG VIEWPORT, so the shape visibly DRIFTS across the canvas instead of rotating in place.
  - PALETTE — pick 4-6 deliberate colours (the text's own card/accent colours plus one or two neutrals) and reuse them for fills/strokes; do not leave everything default grey/black.
  - NEVER ANIMATE `transform` ON THE SAME ELEMENT THAT CARRIES A `transform` ATTRIBUTE: a CSS `transform` animation REPLACES the presentation attribute, so the shape jumps to the origin. Put the positioning on an OUTER `<g transform='translate(x,y)'>` and the animated class on an INNER `<g>`.
  - WORKED EXAMPLE — this is the LEVEL OF DETAIL expected for "eine animierte SVG Illustration, die ein Formular zeigt, das durch eine KI aufgewertet wird" (adapt the coordinates to YOUR canvas, the text's colours and the form's language; the ids/classes are prefixed so they cannot collide):
```html
<svg viewBox='0 0 480 300' width='100%' preserveAspectRatio='xMidYMid meet' role='img' aria-label='Formular wird durch KI aufgewertet' xmlns='http://www.w3.org/2000/svg'>
  <defs>
    <linearGradient id='cbBg' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#eef2ff'/><stop offset='1' stop-color='#e0e7ff'/></linearGradient>
    <linearGradient id='cbCard' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffffff'/><stop offset='1' stop-color='#f8fafc'/></linearGradient>
    <linearGradient id='cbChip' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#6366f1'/><stop offset='1' stop-color='#8b5cf6'/></linearGradient>
    <filter id='cbShadow' x='-20%' y='-20%' width='140%' height='140%'><feDropShadow dx='0' dy='6' stdDeviation='10' flood-color='#1e293b' flood-opacity='0.18'/></filter>
    <style>
      @keyframes cbRowIn{from{opacity:0;transform:translateX(-8px);}to{opacity:1;transform:none;}}
      @keyframes cbPulse{0%,100%{opacity:.35;}50%{opacity:1;}}
      @keyframes cbFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}
      .cbRow{animation:cbRowIn .6s ease-out both;}
      .cbRow2{animation-delay:.15s;}.cbRow3{animation-delay:.3s;}.cbRow4{animation-delay:.45s;}
      .cbSpark{animation:cbPulse 2.2s ease-in-out infinite;}
      .cbSpark2{animation-delay:.5s;}.cbSpark3{animation-delay:1s;}
      .cbChip{animation:cbFloat 3s ease-in-out infinite;}
      @media (prefers-reduced-motion: reduce){.cbRow,.cbSpark,.cbChip{animation:none;}}
    </style>
  </defs>
  <rect width='480' height='300' rx='18' fill='url(#cbBg)'/>
  <ellipse cx='240' cy='276' rx='168' ry='14' fill='#94a3b8' opacity='.22'/>
  <g transform='translate(96,70)'><g class='cbChip'><circle r='26' fill='url(#cbChip)'/><path d='M0 -13 L3.5 -3.5 L13 0 L3.5 3.5 L0 13 L-3.5 3.5 L-13 0 L-3.5 -3.5 Z' fill='#ffffff'/></g></g>
  <g class='cbSpark'><path d='M150 44 L153 51 L160 54 L153 57 L150 64 L147 57 L140 54 L147 51 Z' fill='#a5b4fc'/></g>
  <g class='cbSpark cbSpark2'><path d='M414 118 L417 125 L424 128 L417 131 L414 138 L411 131 L404 128 L411 125 Z' fill='#c4b5fd'/></g>
  <g class='cbSpark cbSpark3'><path d='M120 196 L122 201 L127 203 L122 205 L120 210 L118 205 L113 203 L118 201 Z' fill='#93c5fd'/></g>
  <g filter='url(#cbShadow)'>
    <rect x='150' y='46' width='252' height='208' rx='14' fill='url(#cbCard)' stroke='#cbd5e1'/>
    <rect x='150' y='46' width='252' height='28' rx='14' fill='#e2e8f0'/>
    <circle cx='168' cy='60' r='4' fill='#f87171'/><circle cx='182' cy='60' r='4' fill='#fbbf24'/><circle cx='196' cy='60' r='4' fill='#34d399'/>
  </g>
  <g class='cbRow'><rect x='168' y='86' width='64' height='7' rx='3.5' fill='#cbd5e1'/><rect x='168' y='98' width='216' height='18' rx='6' fill='#f1f5f9' stroke='#e2e8f0'/></g>
  <g class='cbRow cbRow2'><rect x='168' y='124' width='52' height='7' rx='3.5' fill='#cbd5e1'/><rect x='168' y='136' width='216' height='18' rx='6' fill='#f1f5f9' stroke='#e2e8f0'/></g>
  <g class='cbRow cbRow3'><rect x='168' y='162' width='72' height='7' rx='3.5' fill='#cbd5e1'/><rect x='168' y='174' width='216' height='18' rx='6' fill='#f1f5f9' stroke='#e2e8f0'/></g>
  <g class='cbRow cbRow4'><rect x='168' y='200' width='58' height='7' rx='3.5' fill='#cbd5e1'/><rect x='168' y='212' width='216' height='18' rx='6' fill='#f1f5f9' stroke='#e2e8f0'/></g>
  <path d='M62 120 C 104 120, 118 96, 150 104' fill='none' stroke='#818cf8' stroke-width='2.5' stroke-dasharray='6 6'><animate attributeName='stroke-dashoffset' from='0' to='-24' dur='1.6s' repeatCount='indefinite'/></path>
  <path d='M62 150 C 104 150, 118 176, 150 168' fill='none' stroke='#818cf8' stroke-width='2.5' stroke-dasharray='6 6'><animate attributeName='stroke-dashoffset' from='0' to='-24' dur='1.6s' repeatCount='indefinite'/></path>
</svg>
```
    ADAPT IT, DO NOT COPY IT — the example is a STRUCTURE template for the case "a form/dialog that a system upgrades", NOT a fixed scene. Keep its ANATOMY (gradient backdrop + soft ground shadow → layered `<g>` groups → the topic's main OBJECT built from primitives → an accent element in the system's colour → a sparkle/reference cluster → self-drawing connectors → staggered entrances → reduced-motion fallback) and REPLACE the subject with what the request actually describes: a map/town → a map panel with roads, districts and pins; an authority/office → a building with a portico, columns and windows; documents → stacked pages with a seal and a signature line; a person → a figure with head/shoulders plus an ID card; a data flow → nodes connected by arrows. Take the PALETTE from the text's own card/accent colours (the example's `#6366f1`/`#8b5cf6`/`#eef2ff` are placeholders), the language of any `<text>` from the prompt, and the `viewBox` from the layout context. Copy the example's keyframe/class NAMING STYLE, but NEVER its literal ids or classes.
    SHOW THE RELATIONSHIP, NOT UNRELATED SYMBOLS — the drawing must depict WHAT THE REQUEST NAMES, not three abstract shapes in a row. For "ein Formular, das durch eine KI aufgewertet wird" that means: the FORM as recognisable UI (a card with fields that carry LABEL BARS, a submit button, validation ticks) AND the AI contribution visible AS AN ACTION ON that form — a highlighted suggestion chip attached to ONE specific field, a sparkle on the field it improves, a before/after split, or a badge — joined by a visible connection (an arrow pointing INTO the form, a highlighted row). A blank rectangle next to a circle and a globe with dashed arcs does NOT show a form being upgraded: if the picture needs a caption to be understood, it is not the requested illustration.
    THE USER'S LAYOUT WINS — THEN MAKE IT GOOD. When the request NAMES the parts and their arrangement (e.g. "über die ganze Breite des Textes soll ein Formularblatt, daneben ein KI-Chatbot-Kopf und daneben ein Globus zu sehen sein, die mit Pfeilen miteinander verbunden sind, die zusammen ein Unendlichkeitszeichen bilden"), draw EXACTLY that: the named objects, in the named order, connected in the named way. The composition defaults described above are for UNDERSPECIFIED requests only — NEVER "correct" an explicit layout into a different one, and never substitute an abstract symbol for a named object. What must still hold for EVERY named object is that it is RECOGNISABLE and that every requested motion is VISIBLE: a "Formularblatt" is a sheet with a title bar and 3-4 FIELD LINES (a plain grey rectangle is not a sheet); a "Chatbot-Kopf" has EYES and a MOUTH — the face is exactly what makes "lächeln" expressible — plus an ARM/hand when it has to "winken" (a uniform circle can neither smile nor wave, and rotating it by a few degrees is invisible); a "Globus" needs MERIDIAN arcs and/or continent shapes, because a plain filled circle shows NO rotation; and arrows that must form an UNENDLICHKEITSZEICHEN are TWO CLOSED LOOPS CROSSING AT ONE POINT in the middle (one path with two lobes, or two mirrored closed loops) — two separate open wavy lines with gaps between them are NOT an infinity symbol.
    FORBIDDEN COMPOSITIONS — CHECK THE FINISHED SVG AGAINST THIS LIST BEFORE YOU ANSWER. Every one of these has actually been produced and every one is a FAIL: (1) a FACE made of a circle WITHOUT EYES — a "smile" drawn as a ring or as an arc inside a coloured ball is not a face (either draw EYES and a MOUTH, or draw no face at all); (2) an EMPTY ROUNDED RECTANGLE standing for "the form" — a form shows a title bar, 3-4 LABEL BARS each above an input pill, and a SUBMIT BUTTON; (3) declaring `@keyframes` that NO rule references — that is dead CSS (the drawing then animates only if SMIL happens to work); every `@keyframes` name must be referenced by a rule, and a CSS animation is PREFERRED over SMIL because SMIL cannot be switched off by `prefers-reduced-motion`; (4) morphing a path's shape with `<animate attributeName='d'>` instead of animating `stroke-dashoffset`, `opacity` or `transform`; (5) gradients on the shapes being the ONLY "design" — a gradient-filled rectangle is still an empty rectangle; the STRUCTURE (card, rows, labels, button) is what makes it a form; (6) repeating a shape the topic does not contain merely to fill the canvas; (7) declaring a GLOBAL class of one word (`class='globe'`, `class='arrow'`, `class='chatbot'`) — every class must carry the element's unique prefix (`class='spKIVorteileDesign_globe'`), because ALL `rtevalue`s are rendered into the same document and a bare class leaks into other elements; never copy the `cbAi…`/`cb…` names of the examples either.
    EVERY `id` AND CLASS MUST BE UNIQUE PER TEXT ELEMENT — all `rtevalue`s are rendered into the SAME document, and `url(#g)`, `filter='url(#f)'` and class rules resolve document-wide: a duplicated `id` makes the reference bind to the FIRST match, so the second illustration silently borrows the first one's gradients/filters and the first one's CSS can style it. Prefix every id and class with the element's own name (e.g. `spAdvantages_bg`, `spAdvantages_card`, `spAdvantages_chip`, `.spAdvantages_row`).
    A drawing that returns to a bare grey rectangle plus a circle/line is a REGRESSION, not a simplification: reproduce at least this richness — a backdrop (gradient + soft ground shadow), a window card with chrome (title bar + three dots), 4 labelled field rows with a staggered fade-in, an accent AI chip with a sparkle cluster, dashed connectors drawing themselves, and reduced-motion handling.
    WHEN THE USER REPORTS AN ELEMENT OF THE ILLUSTRATION AS NOT VISIBLE / MISSING / NOT DISPLAYED ("der Chatbot ist nicht sichtbar", "die Denkblase fehlt", "the chatbot is not visible in the illustration", "X wird nicht angezeigt", "der Pfeil/Globus ist nicht zu sehen") — THAT IS A REPAIR INSTRUCTION, NEVER A DELETION ORDER. KEEP every named object and REPAIR how it is drawn so it becomes visible, and re-emit ALL the other objects exactly as they were. Deleting the reported element (or the whole scene back to a lone grey rectangle) answers the complaint with the wrong opposite and is a hard FAIL. The most common reasons an already-drawn object "is not visible", and what to fix for EACH:
    - THE ELEMENT SITS OUTSIDE / TOO CLOSE TO THE EDGE OF THE `viewBox` and is CLIPPED. Give every drawn object a comfortable MARGIN from the canvas edge: no shape may touch or cross the `viewBox` border (an object whose bounding box reaches the edge is cut off and reads as "not there"). If the `viewBox` is too small for the whole scene, ENLARGE it (e.g. `0 0 200 120` → `0 0 240 160`) or shrink the shapes so everything fits inside with at least a few units of padding on all sides. ACTUALLY re-check the final coordinates against the `viewBox` before answering.
    - THE ELEMENT IS HIDDEN BY ITS OWN ANIMATION/STYLE. A shape whose base style is `opacity:0` (revealed only at some keyframe) is INVISIBLE whenever the animation is off, paused or reduced-motion — and a `fade`-to-`opacity:0` makes it blink out. Make every object VISIBLE IN ITS REST STATE: base `opacity` of `1` (or a non-zero value), a real `fill` (not transparent), and only PULSE/FLASH/SCALE on top of an already-visible shape. Never hide a shape that the request explicitly wants to be seen.
    - MISSING/TRANSPARENT FILL OR STROKE — give the object a solid, contrasting `fill` and/or `stroke` so it reads against the background; a `fill='none'` with no `stroke`, or a shape painted in the same colour as the backdrop, is invisible.
    - WRONG SVG NAME CASING CARRIES OVER INTO THE FINAL MARKUP — keep `viewBox`, `preserveAspectRatio`, `markerHeight`, `markerWidth`, `refX`, `refY`, `repeatCount`, `attributeName`, `linearGradient`, `stop-color` etc. in EXACT camelCase (a lowercased `viewbox` / `preserveaspectratio` / `markerheight` / `markerwidth` / `refx` / `refy` is silently ignored and nukes the canvas / clobbers the arrow marker). Recheck the whole `<svg>` for lowercased SVG names before answering.
    SECOND WORKED EXAMPLE — THE CONNECTED-OBJECTS LAYOUT (form sheet | chatbot head | globe, joined by arrows that form an infinity symbol, all three animated as asked). Use it when the request names that arrangement; keep the structure and let the palette/labels follow the text:
```html
<svg viewBox='0 0 720 220' width='100%' preserveAspectRatio='xMidYMid meet' role='img' aria-label='Formular wird durch KI aufgewertet' xmlns='http://www.w3.org/2000/svg'>
  <defs>
    <linearGradient id='spX_bg' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#eef2ff'/><stop offset='1' stop-color='#e0e7ff'/></linearGradient>
    <linearGradient id='spX_face' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fde68a'/><stop offset='1' stop-color='#fbbf24'/></linearGradient>
    <linearGradient id='spX_globe' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#a7f3d0'/><stop offset='1' stop-color='#34d399'/></linearGradient>
    <style>
      @keyframes spX_flow{to{stroke-dashoffset:-88;}}
      @keyframes spX_spin{to{transform:rotate(360deg);}}
      @keyframes spX_smile{0%,100%{transform:scaleY(1);}50%{transform:scaleY(.55);}}
      @keyframes spX_wave{0%,100%{transform:rotate(-6deg);}50%{transform:rotate(20deg);}}
      .spX_arrow{stroke-dasharray:12 10;animation:spX_flow 2.4s linear infinite;}
      .spX_spin{animation:spX_spin 12s linear infinite;transform-box:fill-box;transform-origin:center;}
      .spX_mouth{animation:spX_smile 2.6s ease-in-out infinite;transform-box:fill-box;transform-origin:center;}
      .spX_arm{animation:spX_wave 1.8s ease-in-out infinite;transform-box:fill-box;transform-origin:bottom left;}
      @media (prefers-reduced-motion: reduce){.spX_arrow,.spX_spin,.spX_mouth,.spX_arm{animation:none;}}
    </style>
  </defs>
  <rect width='720' height='220' rx='16' fill='url(#spX_bg)'/>
  <ellipse cx='360' cy='200' rx='300' ry='12' fill='#94a3b8' opacity='.18'/>
  <g>
    <rect x='48' y='45' width='212' height='150' rx='10' fill='#ffffff' stroke='#cbd5e1'/>
    <rect x='48' y='45' width='212' height='26' rx='10' fill='#e2e8f0'/>
    <circle cx='64' cy='58' r='3.5' fill='#f87171'/><circle cx='76' cy='58' r='3.5' fill='#fbbf24'/><circle cx='88' cy='58' r='3.5' fill='#34d399'/>
    <rect x='64' y='86' width='52' height='6' rx='3' fill='#cbd5e1'/><rect x='64' y='97' width='180' height='16' rx='6' fill='#f1f5f9' stroke='#e2e8f0'/>
    <rect x='64' y='122' width='44' height='6' rx='3' fill='#cbd5e1'/><rect x='64' y='133' width='180' height='16' rx='6' fill='#f1f5f9' stroke='#e2e8f0'/>
    <rect x='64' y='158' width='58' height='6' rx='3' fill='#cbd5e1'/><rect x='64' y='169' width='180' height='16' rx='6' fill='#f1f5f9' stroke='#e2e8f0'/>
    <rect x='162' y='45' width='98' height='0' fill='none'/>
  </g>
  <g transform='translate(360,118)'>
    <circle cx='0' cy='0' r='44' fill='url(#spX_face)' stroke='#f59e0b'/>
    <circle cx='-14' cy='-8' r='4' fill='#1f2937'/><circle cx='14' cy='-8' r='4' fill='#1f2937'/>
    <g class='spX_mouth'><path d='M-14,10 Q0,24 14,10' fill='none' stroke='#1f2937' stroke-width='3' stroke-linecap='round'/></g>
    <g class='spX_arm'><path d='M40,-6 Q58,-2 62,10' fill='none' stroke='#f59e0b' stroke-width='5' stroke-linecap='round'/><circle cx='62' cy='10' r='6' fill='#fbbf24'/></g>
  </g>
  <g transform='translate(612,118)'>
    <circle cx='0' cy='0' r='46' fill='url(#spX_globe)' stroke='#059669'/>
    <g class='spX_spin'>
      <ellipse cx='0' cy='0' rx='20' ry='46' fill='none' stroke='#047857' stroke-width='2'/>
      <path d='M-46,0 H46' stroke='#047857' stroke-width='2'/>
      <path d='M-30,-18 Q-12,-2 -30,14 Q-40,4 -30,-18 Z' fill='#065f46' opacity='.75'/>
      <path d='M22,6 Q36,14 30,28 Q16,24 22,6 Z' fill='#065f46' opacity='.75'/>
    </g>
  </g>
  <path class='spX_arrow' d='M360,118 C322,72 250,72 218,118 C250,164 322,164 360,118 Z' fill='none' stroke='#6366f1' stroke-width='3'/>
  <path class='spX_arrow' d='M360,118 C398,72 470,72 502,118 C470,164 398,164 360,118 Z' fill='none' stroke='#8b5cf6' stroke-width='3'/>
  <path d='M330,118 L344,111 L344,125 Z' fill='#6366f1'/>
  <path d='M390,118 L376,111 L376,125 Z' fill='#8b5cf6'/>
</svg>
```
      The two closed loops cross at (360,118) — that crossing IS the infinity symbol: keep them touching at one single point, put the two arrow heads on the loops' centre lines, and let the flowing dash (`stroke-dashoffset` animation) carry the movement. The globe spins because the meridians/continents live inside the animated `.spX_spin` group; the head smiles because the mouth is its own `scaleY`-animated group; the head waves because the arm is its own rotated group. All three use `transform-box:fill-box` so each one moves about ITS OWN box.

Template (designed/interactive text — the `<style>` block and the class names live in the XSpan's own `rtevalue`):
```json
{"className":"XSpan","properties":{"name":"spExample","id":"xi-sp-example","rtevalue":"<style>@keyframes cbAiFadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}} .cbAiBenefitsCard{animation:cbAiFadeIn .6s ease-out both;transition:transform .2s ease,box-shadow .2s ease;} .cbAiBenefitsCard:hover{transform:translateY(-4px);box-shadow:0 8px 20px rgba(0,0,0,.15);} @media (prefers-reduced-motion: reduce){.cbAiBenefitsCard{animation:none;transition:none;}}</style><h3 style='color:#1e293b;'>…</h3><div class='cbAiBenefitsCard' style='border:1px solid #cbd5e1;border-radius:8px;padding:12px;'>…</div>","helptext":"…"}}
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

**XMap — the form assistant configures the widget in the FORM JSON AND may provide the form-level custom JavaScript to sync the drawn map geometry to a field.** Configure the widget via the xmap_ properties — `xmap_geometry_point` / `xmap_geometry_line` / `xmap_geometry_area` ("true" to allow that geometry) — create the target field the geometry should go into (e.g. a number field `tfVeraeuss_Flaeche`), and when the request needs the drawn area/line/point synced into that field, emit the working script as the top-level "_customScript" marker (the server injects it as an inline `<script>`). Use the Formcycle/Leaflet API (`CRM.Helpers.getFieldValue`/`setFieldValue`, the XMap instance's geometry callbacks) to read the drawn geometry and write it into the target field.

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
