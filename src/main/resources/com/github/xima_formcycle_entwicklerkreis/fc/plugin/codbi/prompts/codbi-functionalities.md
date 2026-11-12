# CodBi Functionalities

Rules for each CodBi functionality (data-cb-func), their parameters, and application conditions.

CRITICAL — MAKING EXISTING AREAS/SECTIONS COLLAPSIBLE = CONVERT THEM IN PLACE: a request such as "Alle Bereiche im Formular sollen klappbar sein und, bis auf den ersten Bereich, anfangs zugeklappt sein" (or any "make the sections/areas/panels collapsible / aufklappbar / klappbar / accordion" request) targets containers/fieldsets that ALREADY EXIST. Do NOT delete them and do NOT create new, empty panels. For EVERY existing container/fieldset you make collapsible: keep the SAME item with the SAME "name" and the SAME "id", KEEP its "elements" array EXACTLY as it is (every child field name stays in it), and KEEP every child item in your output — only ADD the panel functionality chosen by element type: on an XFieldSet add the CSS class CodBi_HTML_Panel_Standard to its "cssclasses" (its 'legend' is the title); on an XContainer/XContainerInvisible (div, NO legend) add the SAME CSS class CodBi_HTML_Panel_Standard PLUS a NON-EMPTY data-cb-autoheadertitle (a div has no legend, so its own title is the only header source); use the custom data-cb-func=html.panel + its parameters (data-cb-generateheader="true", data-cb-autoheadertitle, data-cb-folded, data-cb-css*) only when a custom look is requested or no UI.Panels class is left. NEVER put BOTH a panel class AND data-cb-func=html.panel on the SAME element. A converted panel MUST still list and contain ALL of its original child fields in "elements". Omitting the children, or emitting a panel/fieldset with "elements":[], renders an EMPTY form and is a FAIL.

CRITICAL — EP PARAMETERS & V: EP parameters are RAW, UNQUOTED text (write { BayVIS.Ansprechpartner.Details > Salvatore Callari }, NEVER { ... > "Salvatore Callari" }). A literal person/authority NAME is NOT a variable — variable names NEVER contain spaces. The V EP takes ONLY a GLOBAL VARIABLE NAME (e.g. SALVATORE_CALLARI_CONTACT, BayVIS_Behoerde); NEVER a name with a space / a quoted person name. { BayVIS.Ansprechpartner.Details > { V > Salvatore Callari } } is WRONG — use { BayVIS.Ansprechpartner.Details > Salvatore Callari } directly. Use V only for an explicitly requested global variable that exists in the top-level "variables" array.

## GENERIC RULE for all CSS-Selector parameters

When a parameter requires a CSS-Selector referencing another form element, ALWAYS use the target element's properties.name value prefixed with a dot '.' (e.g., '.tfInterviewBis' or '.taAddress'). NEVER use an ID selector (# prefix, e.g., '#xi-tf-interviewbis'), because element IDs are mangled in repeatable containers; only properties.name-based selectors work reliably when CodBi searches within the shared parent container.

## GENERIC RULE for field references `<[...]>`

EVERY `data-cb-*` parameter of EVERY functionality (and every EP parameter) may embed the CURRENT value of another form field with `<[...]>`; CodBi resolves it before the functionality runs. Use:
- `<[this]>` — the value of the element the parameter belongs to.
- `<[.FieldName]>` (preferred) or any CSS selector such as `<[#id]>` / `<[input[name=x]]>` — the value of the first matching field; the search starts in the nearest `.XContainer`/`.XFieldSet` of the referencing element and falls back to the document. Apply the CSS-Selector rule above (dot + properties.name, never an id selector in repeatable containers).
- `<[FieldName]>` — a BARE name is treated as a CSS CLASS first, then as `data-name`, then as a selector (this is the variant the txtverify rule below uses; txtqa/QA use the dot variant).
- `<[Base::path]>` / `<[FieldName.path]>` — read a PROPERTY instead of the whole value: a DOM property (`innerHTML`, `textContent`, `value`, `checked`, `dataset.x`) or a JSON path of the field's value (`<[tfJson.total]>`, `<[tfJson::items[0].name]>`, `<[this::innerHTML]>`). A value that parses as JSON is traversed FIRST, then whitelisted DOM properties; objects/arrays are emitted as JSON. The dot shorthand only applies to a BARE name — for selector-like references use `::`.

Rules: resolution runs ONCE at functionality initialization (when formcycle fires `form.xm-form` `ready`, AFTER the current state's values were rendered into the form) — never use `<[...]>` for a parameter that must follow the field's LATER changes (AI.OCR and the other AI functionalities resolve their own question/pattern placeholders at runtime instead). An unresolvable reference/path — and `<[this]>` while the field is still empty — stays literal. Write `°<[` for literal text that must not be resolved. Commas inside `<[...]>` are NOT CSV separators. `[%fieldName%]` (Formcycle) still works and is resolved in the same pass.

## GENERIC REQUIRED-PARAM RULE

Parameters explicitly marked **REQUIRED** below MUST be present on the element (as data-cb-* attributes); parameters marked (optional) may be omitted. Whenever a REQUIRED value is missing from the user's request and cannot be derived, ASK the user for it (clarification) instead of inventing one.

## AI.LLAMA.CHAT

Applicable on a container element to embed an AI chat widget (requires a locally running LLAMA server via CodBi settings).

CRITICAL — SIMPLE Q&A ≠ FULL CHAT WIDGET: the AI.LLAMA.CHAT chat widget (container + display/input textareas + Send/Stop + Upload + checkboxes + Mail) is ONLY for a real interactive CHAT interface — a request to chat with the AI, a "KI-Chat"/"Chatbot"/"chat with the AI" where the user types messages, sends them, uploads files and reads multi-turn replies. Do NOT use AI.LLAMA.CHAT for a simple single-answer question field. When the user asks to CREATE AN INPUT/FORM FIELD whose (single, fixed) question gets answered by the AI inside that field — e.g. "Erstelle ein Eingabefeld welches die Frage wie das Wetter heute wird von Cerebras beantworten lässt", "Add a field that lets Cerebras answer the user's question", "ein Feld, in dem eine KI die Frage 'Wie wird das Wetter?' beantwortet" — build ONE simple field with the simple Q&A functionality (see "AI TEXT QA (ai.llama.standard.txtqa)" below: apply data-cb-func="ai.llama.standard.txtqa" on the input field, put the fixed question in data-cb-Question, add data-cb-Specialist="<specialist>" when a specialist like Cerebras is named, and add a display XTextArea with cssclasses=["AI_LLAMA_STANDARD_TXTQA_Question"]). Do NOT spawn the whole chat container of sub-elements for this — a single question that is answered once is NOT a chat. Only a genuine multi-turn chat with a chat window qualifies for AI.LLAMA.CHAT. A prompt that mentions "beantworten lassen"/"answer the question"/"lässt die Frage beantworten" in a single INPUT FIELD is simple Q&A, NOT AI.LLAMA.CHAT.

When the user asks for an AI chat / KI-Chat / chatbot, create ALL of the following elements — never an empty container and never a placeholder span / "Chat-Platzhalter" element. Building the chat is part of the current change; do NOT defer it. EVERY sub-element below is REQUIRED — including the Upload's `fileextension="image/*,.pdf"` attribute and the Mail container (MailForward checkbox + MailAddress field); omitting any of them is a FAIL:
- XContainer wrapper with `fullwidth` property set to `"1"` (MUST be `"1"`, never `"0"`). Do NOT add data-cb-func="ai.llama.chat" to the container, the Upload or any other sub-element — it goes ONLY on the chat display XTextArea; every other chat sub-element (Input/Send/Stop/Upload/checkboxes/Mail) is wired ONLY via its AI_LLAMA_CHAT_* CSS class (standard configuration), never via a data-cb-func.
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
- Mail address: XTextField (cssclasses=["AI_LLAMA_CHAT_MailAddress","CodBi_People_Mail"], datatype="email") inside the mail container. The MailForward checkbox toggles its visibility — set hiddenif="<MailForwardCheckbox_ID>", hiddenifcomp="9" (EConditionType EMPTY: hidden while the checkbox is empty/unchecked) and hiddenifclear="false" as DIRECT properties so the address is hidden while MailForward is UNCHECKED (has no value) and only shown once it is CHECKED. CodBi_People_Mail (People standard class) restricts input to valid e-mail characters.

CRITICAL — Distinguish from Form Chatbot Plugin (XIMA Chatbot): Use XNavigationBar for XIMA mentioned navigation. Use CodBi ai.llama.chat ONLY when "CodBi KI-Chat" is explicitly mentioned.

## AI.OCR

Applicable on an XUpload field to extract and return text from uploaded images or PDFs via OCR. USE whenever the request asks to extract/text-recognize the content of an uploaded image/PDF into a text field (e.g. "per OCR den Text extrahieren und in ein Feld schreiben").

**Mode** ("print" | "verify" | "extract fields"):
- **print** (DEFAULT for writing text into a single receiver field) — write the OCR text into ONE receiver (a textarea).
- **verify** — check the uploaded document matches a pattern (yes/no).
- **extract fields** — write several separately-extracted substrings into DIFFERENT fields.

### Receiver field (all modes besides the table-driven configuration)
- **REQUIRED**: give the receiver field (the XTextArea that receives the OCR result) the CSS class `CodBi_AI_OCR_Receiver`. The functionality finds the receiver ONLY by that CSS class (there is NO `data-cb-Receiver` and NO `data-cb-field` attribute for print-mode lookup — never invent one). Create the receiver (an XTextArea, e.g. `taOcrResult`) when the request names a target that does not exist yet, and add `CodBi_AI_OCR_Receiver` to its `class` property.
- Enable AutoResize (autosize="1") on the receiver so the extracted text is displayed comfortably.

### Language-agnostic pattern rule (KEY)
When the user wants ONLY specific substrings of the scanned text (e.g. "alle Wörter, die mit 'Aus' beginnen", "only the date from the text", "extrahiere nur die Kundennummer und den Betrag"), you MUST derive a regular expression that matches exactly those substrings and encode it into the **data-cb-pattern** attribute (or a `data-cb-pattern_<field>` in extract-fields mode). Do NOT wait for the user to name a regex — derive it yourself from the natural-language description:
- Describe the selection in the user's own words first, then convert it to a regex, e.g. "alle Wörter, die mit 'Aus' beginnen" → pattern `\bAus\w*\b` (word boundary, then `Aus`, then any letters, then word boundary). Greedy/alternative examples: "nur das Datum" → `\b\d{1,2}\.\d{1,2}\.\d{4}\b`; "das Wort nach 'Betrag:'" → `Betrag:\s*([^\s]+)` (with a capture group, see below).
- If the user wants to KEEP the whole text (no filter), do not put an overly narrow pattern on `data-cb-pattern`; an empty/unset pattern means "whole text".
- Print mode with a filter: set data-cb-pattern to extract only the matching substrings into the receiver. Use a capturing group in the regex so ONLY the captured part is written (the whole match is written when there is no group).
- REGEX ESCAPING: inside data-cb-pattern write a literal caret `^` as `°`, and literal braces `{`/`}` as `°{`/`°}` (they are unescaped at run time). Backslashes for `\b`, `\d`, `\s`, classes etc. remain as-is.
- For case-insensitive matching (e.g. "Aus"/"aus"), additionally set data-cb-regexflags="i" (see RegExFlags below).

### ALL parameters (data-cb-* attributes on the XUpload)
| Parameter (attr) | Meaning / when to set |
|---|---|
| `data-cb-mode` | `print` (default), `verify`, or `extract fields`. |
| `data-cb-pattern` | Regex that extracts substrings from the scanned text (print/verify) — set it whenever only specific parts are wanted. |
| `data-cb-pattern_<field>` | Extract-fields mode: one regex per target field `field` (a `Pattern_<field>` parameter). |
| `data-cb-separator` | Extract-fields mode only: separator between the results of multiple files (default comma). |
| `data-cb-regexflags` | Optional regex flags applied to all patterns, e.g. `i` (case-insensitive), `m` (multiline), `s` (dotall); combine e.g. `im`. |
| `data-cb-maxpages` | Max PDF pages to process (default 5); `0` = unlimited. PDFs only. |
| `data-cb-preprocess` | `true` to enable image preprocessing (grayscale, binarization, noise reduction) before OCR. |
| `data-cb-processingimagetext` | Text appended to the field label while images are processed. |
| `data-cb-invalidimagetext` | Text shown when one or more images do not match the pattern in verify mode. |
| `data-cb-wrongfilemessage` | Label of the manual verification checkbox in verify mode. |
| `data-cb-maximum` | Max number of uploadable files; processing aborts if exceeded. |
| `data-cb-field` | Extract-fields mode only: the `data-cb-Field` attribute carried by EACH receiver element (the named capture group it maps to). For print mode the receiver is found ONLY via the `CodBi_AI_OCR_Receiver` CSS class — do NOT use `data-cb-field` to locate the print receiver. |
| `data-cb-queuebadge` | `true` to show a badge with the current queue position while waiting. |
| `data-cb-queuetext` | Text appended after the queue position in the badge (e.g. `in queue` → "3 in queue"). |

### Mode specifics
- **print (default when writing into a receiver)**: put the functionality on the XUpload and the class `CodBi_AI_OCR_Receiver` on the target XTextArea; set `data-cb-mode="print"` + (when filtering) `data-cb-pattern` + optionally `data-cb-regexflags`. The filtered matches are written into the receiver.
- **verify**: **REQUIRED** to set ALL of Pattern, RegExFlags, WrongFileMessage, InvalidImageText (the match-check pattern plus its flags and the two texts); also put class `CodBi_AI_OCR_Receiver` on the verification receiver field.
- **extract fields**: requires the receiver fields (each with class `CodBi_AI_OCR_Receiver` and a `data-cb-Field` name), one `data-cb-pattern_<field>` per target field, and cross-file output is joined with `data-cb-separator`.

CRITICAL — always convert a natural-language substring selection from the user's prompt into a concrete `data-cb-pattern` regex expressed in whatever language the request was made; never leave it unset when the user explicitly asks to extract only certain parts.

## Date.Frame

Applicable ONLY on the BEGIN (minimum) XTextField of type 'date' when there is a second related end date field. The end field is referenced via the 'MaxField' parameter. Do NOT put this functionality on the end date element.
**REQUIRED**: data-cb-maxfield = the END (maximum) date field's name. The begin field is the tagged element. Connect the two jQuery-datepicker date fields so the BEGIN date may not be AFTER the END date (Begin ≤ End when equality is permitted).

**OPTIONAL PARAMS (from the Date.Frame tsdoc):**
- `EqualityPermitted`: a boolean indicating whether equality between the minimum (begin) and maximum (end) date is allowed. Default (unset) = equality permitted, so the begin and end may be the SAME date. Set it explicitly only when the user requires strictly different dates (end strictly after begin) — e.g. for a booking range where start and end must differ.
- `MsgMinInvalid` / `MsgMaxInvalid`: optional custom error-message strings shown when the begin is after the end, or the end is before the begin.
- REPEATABLE CONTAINERS: for the frame to work inside a repeatable/dynamic container, the tagged BEGIN input AND the corresponding END (MaxField) must be within the SAME container row.

CSS-CLASS VARIANT — when the standard-configuration CSS classes are used instead of data-cb-func, apply `CodBi_DateFrame_N_Begin` to the BEGIN date field AND `CodBi_DateFrame_N_End` to the END date field (BOTH fields get their own class, with the SAME frame number N). There is NO combined `CodBi_DateFrame_N_Begin_End` class — never invent it. Never apply these classes to a container/fieldset — only to the two date fields. A two-field date RANGE (Start/End, Von/Bis, Kursbeginn/Kursende) is ALWAYS Date.Frame — do NOT model a range as a mere Date.Min; a Date.Min may be added to the BEGIN field, but the range itself still requires Begin on the START field AND End on the END field.

## Date.Min

Applicable on a XTextField of type 'date' to enforce a minimum allowed date (e.g. prevent past dates).
**REQUIRED — data-cb-minimum (MANDATORY, never emit Date.Min without it):** the minimum value as a digit string, plus data-cb-unit (d/w/m/y, default y).
- PAST minimum (e.g. "at least 18 years old", "mindestens 18 Jahre"): data-cb-minimum="<N>" + data-cb-unit="y" (or d/w/m). Do NOT set data-cb-reverse (defaults to past).
- FUTURE minimum (e.g. "at least tomorrow", "ab morgen", "from tomorrow on", "no past dates"): data-cb-minimum="<N>" + data-cb-unit="d" (or w/m/y) + data-cb-reverse="true".
  - "at least tomorrow" / "ab morgen" → data-cb-minimum="1", data-cb-unit="d", data-cb-reverse="true".
  - "today or later" / "no past dates" / "not in the past" → data-cb-minimum="0", data-cb-unit="d", data-cb-reverse="true".
- BIRTH-DATE FIELDS (labels "Geburtsdatum", "Geburtstag", "birth date", "date of birth", "birthday"): a birth date ALWAYS lies in the PAST and must NEVER be treated as a future-dated field. Under NO circumstances apply a FUTURE minimum (data-cb-reverse=true, "heute"/"morgen", "no past dates") to a birth-date field — the constraint "keine Vergangenheitsdaten"/"no past dates"/"no past dates allowed" is CONTRADICTORY for it and means the OPPOSITE: only PAST dates are valid, i.e. NO FUTURE dates (maximum = today; the current date itself is a VALID birth date). Do NOT ask "Mindestdatum heute oder morgen?" for a birth-date field; only a PAST minimum (e.g. "mindestens 18 Jahre" → data-cb-minimum="18", data-cb-unit="y", no data-cb-reverse) is legitimate, and only when an age limit is requested. WHEN a birth-date field is grouped with genuinely future-dated fields under one "keine Vergangenheitsdaten" constraint (e.g. "Geburtsdatum, Kursbeginn"): EXCLUDE the birth-date field from the "heute oder morgen" question entirely — apply the future minimum (data-cb-reverse=true) ONLY to the future-dated field(s) (e.g. "Kursbeginn" = morgen) and apply maximum=heute to the birth-date field WITHOUT asking. Ask the future-minimum question ONLY for genuinely future-dated fields and NEVER when a birth-date field is among the affected fields. **ALWAYS apply the CodBi_NoFutureDate CSS class (max = today, today included) to EVERY birth-date field — even when no "no future dates" requirement is stated, since a birth date cannot lie in the future.** NEVER leave a birth-date field without any date restriction.

Ask the user for the minimum when not specified, then encode it EXACTLY as above (example: {"text":"data-cb-func","value":"Date.Min"}, {"text":"data-cb-minimum","value":"1"}, {"text":"data-cb-unit","value":"d"}, {"text":"data-cb-reverse","value":"true"}).

## Date.NoWeekends

Applicable on a XTextField of type 'date' to disallow weekend dates.

CRITICAL — NEVER apply Date.NoWeekends to a BIRTH-DATE field (labels "Geburtsdatum", "Geburtstag", "birth date", "date of birth", "birthday"): people can be born on any day of the week, so a weekend restriction is senseless there. A constraint like "keine Wochenenden" / "no weekends" on a birth date must be IGNORED for that field (do NOT apply the functionality and do NOT ask about it). Date.NoWeekends is only meaningful for future-dated/booking-type date fields (e.g. a course date, appointment date, delivery date).

## Date.Today

Supports arithmetic directly — do NOT wrap it in Date.Arithmetic. Use "{ Date.Today > +1d }" for tomorrow, "{ Date.Today > -1d }" for yesterday. Arithmetic: +N d/m/y (add), -N d/m/y (subtract).

## Date.FromString

Turns a date string into a Date object. Use for any prompt about converting/parsing a date string. Example: "{ Date.FromString > 01.12.1978 }". Optional second param sets the format.

## Date.Time.Join

Applicable on an XTextField that shall RECEIVE the COMBINED value of a date field and a time field (e.g. "ein verstecktes Feld mit der Kombination aus Datums- und Zeitfeld", "combine date and time into one field", "Datum und Uhrzeit zusammenführen", an appointment/event start date-time). The receiver may be a normal visible XTextField or a hidden one — mark it `ishidden="1"` ONLY when the user explicitly asks for a hidden field. The receiver updates whenever the date or the time field changes.

CRITICAL — USE Date.Time.Join, NOT a calculation field: when the request asks to combine/join a DATE field and a TIME field into ONE value, do NOT create a Formcycle CALCULATION field (XFormula) for it — Date.Time.Join is the dedicated functionality for exactly this. A calculation field is for arithmetics/JSON (see JSON.SET); joining a date and a time is NOT a formula. So a generic "hidden field that combines other fields' values" is a calculation field ONLY when it is about JSON/arithmetic — a date+time combination MUST use Date.Time.Join.

WIRING (all fields must lie in the SAME container):
- DATE source field A → cssclasses=["CodBi_Date_Time_Join_Date"]
- TIME source field B → cssclasses=["CodBi_Date_Time_Join_Time"]
- RECEIVER field C (an XTextField; set ishidden="1" ONLY when the user asked for a hidden field, otherwise leave it visible) → data-cb-func="Date.Time.Join" (use a SEPARATE field as receiver so it does not become its own source)

OPTIONAL params on the receiver (lowercase data-cb-* attributes):
- data-cb-datefield / data-cb-timefield: dot-prefixed `name` CSS-selectors of the source fields; take precedence over the CSS classes. REQUIRED when there are MULTIPLE date/time pairs in the same container (otherwise the first pair's fields are resolved for every receiver).
- data-cb-tomillis="true": write the epoch milliseconds instead of the string representation.
- data-cb-divisor="<number>": divide the epoch milliseconds by this number and floor them (takes precedence over ToMillis).

Default output format: DD.MM.YYYY HH:mm.

TRIGGER — MILLISECONDS ("Millisekunden" / "milliseconds" / "epoch ms" / "die kombinierten Zeitfelder sollen die Millisekunden enthalten"): set `data-cb-tomillis="true"` on the Date.Time.Join receiver field(s). This applies BOTH when creating the field AND when a follow-up request asks to change EXISTING combined fields to milliseconds — add/update `data-cb-tomillis="true"` on each existing Date.Time.Join receiver (keep data-cb-func, data-cb-datefield, data-cb-timefield). Use `data-cb-divisor` only when a scaled/floored value is requested.

TRIGGER — DIVISOR ("geteilt durch X" / "divided by X" / "durch 1000" / "Millisekunden geteilt durch tausend"): set `data-cb-divisor="X"` on the Date.Time.Join receiver field(s) (e.g. "geteilt durch tausend" → `data-cb-divisor="1000"`). This is a FORM MODIFICATION (hasInstructions=true) — do NOT answer with a how-to and do NOT suggest a formula field (XFormula) or a script. Add/update `data-cb-divisor="X"` on each existing Date.Time.Join receiver (keep data-cb-func, data-cb-datefield, data-cb-timefield, and data-cb-tomillis if present). `data-cb-divisor` divides the epoch milliseconds by X and floors them — it takes precedence over `data-cb-tomillis`.

## Date.Time.Join.Span

Applicable on the CONTAINER that holds the four fields (an XContainer/XFieldSet) to validate a BEGIN date+time pair against an END date+time pair (e.g. "Beginn darf nicht nach dem Ende liegen, Datum und Uhrzeit zusammen", "end must be after begin considering date AND time", "the span must not be empty/negative", a non-empty appointment/event span). USE it instead of Date.Frame/Time.Frame whenever BOTH dates AND times matter together — Date.Frame/Time.Frame compare the dates or the times SEPARATELY and cannot catch a begin time after the end time on the same day. USE it instead of Date.Time.Join (which only merges one pair into a value). The tagged element is the scope in which the fields are searched: the CSS-Classes are looked up within it, and the CSS-Selector-Parameters first within it, then across the whole document. The Parameters take precedence over the Classes and are REQUIRED when more than one span exists in the form or when fields lie outside the tagged element. If any of the four fields cannot be resolved, the functionality silently does nothing (no exception is thrown).

WIRING:
- Tag the CONTAINER holding the four fields (an XContainer/XFieldSet div) → `data-cb-func="Date.Time.Join.Span"`
- BEGIN DATE field A → tag with `CodBi_Date_Time_Join_Span_Begin` OR reference via `data-cb-Begin` (dot-prefixed `name` CSS-selector; takes precedence)
- BEGIN TIME field B → tag with `CodBi_Date_Time_Join_Span_Begin_Time` OR reference via `data-cb-BeginTime`
- END DATE field C → tag with `CodBi_Date_Time_Join_Span_End` OR reference via `data-cb-End`
- END TIME field D → tag with `CodBi_Date_Time_Join_Span_End_Time` OR reference via `data-cb-EndTime`
- For fields in DIFFERENT containers (outside the tagged element) or for MULTIPLE spans, provide the four `data-cb-*` selectors on the tagged container.

NESTING — you MAY tag more than one container with `data-cb-func="Date.Time.Join.Span"`; each tagged container is processed independently with its own scope. When a tagged container is NESTED inside another tagged container, the OUTER container's CSS-Class lookup automatically SKIPS fields that lie within an element whose `data-cb-func` contains `Date.Time.Join.Span` (case-insensitive) — so the outer span never resolves the inner span's fields by class. You only need the `data-cb-*` selectors when fields lie OUTSIDE the tagged container (different containers / multiple sibling spans) or to disambiguate.

The begin datetime = A + B, the end datetime = C + D. Whenever one of the four fields changes, both datetimes are compared. If the joined end datetime is lower or equal to the joined begin datetime (or, equivalently, the joined begin datetime is higher or equal to the joined end datetime — equality is NOT permitted), the field that just changed is invalidated with the `data-cb-msginvalid` message. Exactly one field (either the date- or the time-field) is invalidated at a time. Once the span is valid again, all four error messages are removed.

## Form.Navigator

Applicable on forms with 2 or more pages (multi-step forms); adds a navigation progress bar or breadcrumb tabs. Do NOT apply to single-page forms.

Config Parameter — **Preview** (`Preview=true`): whether the nav bar lets the user jump to EVERY page (even ones never visited before) or only to pages already reached. Defaults to FALSE (unvisited pages are blocked). This is the ONLY "preview" capability among the navbars of this project.

CRITICAL — PREVIEW NAVBAR IS ALWAYS CodBi (NOT ambiguous): a navbar request that asks for a "preview"/"Vorschau" — i.e. for all pages to be reachable/clickable/jumpable EVEN IF not visited yet, for the pages to NOT be blocked, for "direkt zu jeder Seite springen"/"jump to any page" (ANY language, judged by MEANING) — is a capability that ONLY CodBi Form.Navigator has (the `Preview` parameter, `Preview=true`). The Formcycle XNavigationBar cannot do this. So such a request is NOT ambiguous: build CodBi Form.Navigator with `Preview=true`, and ask NO clarification.

CRITICAL — EXACT WIRING of Form.Navigator's PREVIEW parameter (a preview navbar is a FAIL without it): the `Preview` parameter is a CodBi functional parameter on the SEPARATE XContainer that carries the navigator. The preview navbar's element MUST contain BOTH attributes in its `attributes` array — `{"text":"data-cb-func","value":"Form.Navigator"}` AND `{"text":"data-cb-preview","value":"true"}` (EXACT lowercase attribute name `data-cb-preview`, EXACT boolean value `true`). Emitting `data-cb-func="Form.Navigator"` WITHOUT `data-cb-preview="true"` renders the nav bar with unvisited pages BLOCKED — that is NOT what "Vorschau" asks for and is a FAIL. Complete example:
```json
{"className":"XContainer","properties":{"name":"navNavigator","id":"xi-nav-navigator","label":"Navigation"},"attributes":[{"text":"data-cb-func","value":"Form.Navigator"},{"text":"data-cb-preview","value":"true"}]}
```
Only when the request does NOT need preview (a plain CodBi navbar / "CodBi Navbar", no "Vorschau") may `data-cb-preview` be omitted (defaults to FALSE/blocked).

CRITICAL — Form.Navigator AUTO-GENERATES navigation buttons. Create a SEPARATE XContainer (div) for the nav bar — do NOT put data-cb-func=form.navigator on XPage elements. XPage is not a div and the functionality requires HTMLDivElement. PLACEMENT — the navigation must be reachable on EVERY page: when the form HAS an XHeader or XFooter, ALWAYS place the navigator container inside the XHeader (or XFooter) so it is visible on all pages — never inside a specific page's content. Only when the form has NO header and NO footer, add the container to EVERY page's elements array. NEVER place it on only one page — a navigator that is only visible on a single page is useless.

CRITICAL — Distinguish from XNavigationBar plugin: Use data-cb-func=form.navigator when the prompt mentions "CodBi Navbar" / "CodBi Navigation" OR when the request needs preview (the capability-based rule above). When the prompt mentions "XIMA Navigationsleiste", "XIMA navbar", "FORMCYCLE navbar", "Navigationsleiste", "Progress Bar", "FC-Navbar", or "formcycle navigation bar", use className="XNavigationBar" instead.

CRITICAL — AMBIGUOUS NAVBAR = ASK: when the request only says "navbar" / "Navigationsleiste" / "navigation bar" / "Fortschrittsleiste" (ANY language) and names NEITHER "CodBi Navbar"/"CodBi Navigation" NOR "XIMA/FORMCYCLE Navbar"/"Progress Bar", it is AMBIGUOUS — ask the user (clarification) whether the CodBi Form.Navigator or the Formcycle XNavigationBar is meant, and create NEITHER before the answer. EXCEPTION — a request that asks for preview is NEVER ambiguous (it can only be CodBi Form.Navigator, see the capability-based rule above).

## HTML.CSS

Applicable on any element to inject custom CSS text into the page (with optional placeholder replacements). USE whenever the request asks to style/color/skin the form (e.g. "eigenes CSS", "rote Überschriften", "red headings", "roter Hintergrund", custom colors) — emit an element with `data-cb-func="HTML.CSS"` and `data-cb-css` set to the derived CSS snippet (e.g. "rote Überschriften" → `data-cb-css="h1 {color:red;}"`). NEVER merely invent/apply a CSS class name (e.g. `customRedHeading`) instead of emitting the HTML.CSS functionality with the actual CSS text.
**REQUIRES**: the CSS text to inject (data-cb-css). Derive it whenever the styling rule is described in the request; ask the user only when the CSS cannot be derived.

### CRITICAL — the request may ask to maintain CSS RULES / CSS properties, not only colours (LANGUAGE-AGNOSTIC, judged by MEANING)
Use `HTML.CSS` (NOT color-styling alone) for ANY request that wants CSS **rules** entered/injected into the form — German "pflege/nimm folgendes als CSS-Regeln in das Formular ein", "als CSS-Regeln einpflegen", "CSS-Regeln einfügen/injizieren/einbauen", "füge CSS hinzu", "CSS rules"/"add CSS"/"inject CSS" (English) — and for requests that name concrete CSS **property rules** to apply form-wide or to a region, e.g. **opacity / transparency** ("Durchsichtigkeit"/"Transparenz"/"opacity"/"transparent") or **scaling** ("Skalierung"/"vergrößern"/"auf das Doppelte skaliert"/"scale"/"zoom"/"transform:scale(...)"). Such a request is exactly HTML.CSS, and you MUST emit it.

CRITICAL — ALWAYS DERIVE THE ACTUAL CSS TEXT into `data-cb-css`: never answer with a how-to and never emit a description instead of the rules. For the prompt "Pflege folgendes als css regeln in das Formular ein: Durchsichtigkeit soll .1 sein und Skalierung auf das doppelte" emit an element with `data-cb-func="HTML.CSS"` and a `data-cb-css` holding the real rules (e.g. `.cbTransparent { opacity: .1; transform: scale(2); }`). Encode "Durchsichtigkeit .1" as `opacity: .1` and "Skalierung auf das doppelte" as `transform: scale(2)` (or `zoom: 2`).
**DESTINATION — when the request scopes the rule to a REGION of the form** (e.g. "im Header"/"in der Kopfzeile"/"in the header", a specific container/area): set `data-cb-destination` to a DOT-prefixed class selector of that element derived from its `properties.name` (e.g. `data-cb-destination=".hdrMainHeader"` / `".cpHeader"`), following the CSS-Selector rule (name-based, NEVER an id selector). Omit `data-cb-destination` to inject the rules into the document `<head>` (whole form).
**DISTINGUISH FROM HTML.SETAttribute**: HTML.SETAttribute sets ONE attribute/CSS `style` on ONE element in place (`data-cb-name="style"` + `data-cb-toset`), e.g. "set the opacity of THAT input field to .5". HTML.CSS injects CSS RULES (a stylesheet) that can target any/many elements via a selector — use it whenever the request speaks of CSS rules / styling a region or the whole form, or of property values as a rule.
**NOT for** a designed/interactive TEXT or `@keyframes` — that animation belongs as a `<style>` block INSIDE the animated XSpan's own `rtevalue` (the HTML.CSS functionality does not apply `@keyframes` animation).
**CARRIER XSPAN — when a NEW element is generated only to hold the rules:** ALWAYS use an `XSpan` that is a TECHNICAL helper the frontend user must NEVER see: set `"ishidden":"1"` in its `properties` — the Formcycle **Hidden/Ausblenden checkbox CHECKED** (never rely on a parent, never use `invisible`, never a CSS class). Put the actual CSS rules into `data-cb-css` (e.g. `data-cb-css="h1 {color:red;}"`), NOT into the text. The XSpan's `rtevalue` carries a short MEANINGFUL PURPOSE description of what the CSS does and where, in the CURRENT DESIGNER DISPLAY LANGUAGE (de/en/it/…), e.g. `<p>Wendet CSS an: Überschriften rot (h1 { color: red; }).</p>` / `<p>Applies CSS: red headings (h1 { color: red; }).</p>` — NEVER generic text like "HTML.CSS", NEVER only a `<style>` block and NEVER empty. This is the same author-facing documentation pattern as the SV note. Also add the XSpan's name to the first page's/region's `elements` array with a proper parentid (never orphaned).

## HTML.Input.Cleave

Applicable on a XTextField to apply input masking/formatting (credit card, phone, IBAN, date, etc.) via Cleave.js.
**REQUIRES**: the mask/format to apply (credit card, phone, IBAN, date, …) — ask the user when not specified.

DATE FIELD — THE CLEAVE MASK ALSO OWNS THE ALLOWED DATE RANGE (no Date.Min needed): a Cleave-formatted date input restricts WHICH dates may be entered through its OWN parameters, so "nur Daten von 01.12.2025 bis 01.2026 dürfen eingegeben werden" on such a field is wired ENTIRELY with this functionality — do NOT add `Date.Min`, and do NOT invent a `Date.Max` (it does not exist):

"attributes": [
  {"text":"data-cb-func","value":"HTML.Input.Cleave"},
  {"text":"data-cb-date","value":"true"},
  {"text":"data-cb-datemin","value":"2025-12-01"},
  {"text":"data-cb-datemax","value":"2026-01-31"},
  {"text":"data-cb-delimiter","value":"."},
  {"text":"data-cb-datepattern","value":"d-m-Y"}
]

- `data-cb-date` = "true" enables Cleave's date mask — a date field without it is not a Cleave date field.
- `data-cb-datemin` / `data-cb-datemax` are the allowed bounds and MUST be written in the AMERICAN form with dashes (**YYYY-MM-DD**, Cleave's `dateMin`/`dateMax`): the German "01.12.2025" becomes "2025-12-01". A MONTH-only bound uses the FIRST day of that month as a start bound and the LAST day as an end bound ("von 01.2026" → "2026-01-01", "bis 01.2026" → "2026-01-31"). Putting a German date ("01.12.2025") into these two parameters is a FAIL — Cleave ignores it and NO date is restricted.
- `data-cb-delimiter` / `data-cb-datepattern` keep the DISPLAY format the user typed (German: "." and "d-m-Y") while the bounds stay American.
- Only one bound requested → set only that parameter (e.g. only `data-cb-datemin`).
- Several functionalities on ONE element go into ONE comma-separated `data-cb-func` value (e.g. "HTML.Input.Cleave,HTML.Input.NoAutocomplete") — NEVER two `data-cb-func` attributes.

## HTML.Input.REGEX

Applicable on a XTextField to validate, reformat, or RESTRICT the typed value against a regular expression pattern.

DISTINGUISH IT FROM THE "regexp" DATATYPE: on a TEXT field whose input is limited (e.g. a "Sicherheitscode" that allows only 3 digits), set datatype="regexp" and put the regex pattern into the **`vrule`** property (Formcycle's regexp datatype reads `vrule`, NOT `datatypeHint`) and ALWAYS set **`vrulemismatch`** with a proper, user-readable error message (e.g. "vrulemismatch":"Bitte genau 3 Ziffern eingeben") — a regexp field without an error message is incomplete — the datatype validates the VALUE, so apply this functionality with ONLY `data-cb-keyexpression` (per-keystroke allowed characters) and DO NOT set `data-cb-expression` on a regexp field. On a field whose datatype must be NON-text (money/posmoney, number/integer, dateDE, phone, email, plzDE, ...), KEEP that datatype (do NOT overwrite it with regexp) and apply this functionality with BOTH `data-cb-keyexpression` (per-keystroke allowed characters) AND `data-cb-expression` (whole-value pattern).

CRITICAL — USE THIS FUNCTIONALITY whenever the user asks to disallow/block/prevent certain characters from being typed into an input field (input restriction / character blacklist). Examples: "darf die Zeichen e$% nicht enthalten", "soll die Eingabe von e, $ und % verhindern", "does not allow the input of the characters e$%", "block the characters ...". This is the ONLY CodBi functionality for blocking characters — do NOT use HTML.Input.Cleave or any CSS class for this.

To BLOCK characters, express the forbidden set as a NEGATED character class `[^…]` (matches any character EXCEPT the listed ones) and set the parameters on the XTextField via the attributes array:
- data-cb-func = "HTML.Input.REGEX"
- data-cb-keyexpression = **REQUIRED** — the per-keystroke pattern every typed character must comply with → negated class, e.g. "[^e$%]" (prevents typing e, $ and %)
- data-cb-expression = **REQUIRED UNLESS the field uses datatype="regexp"** — the whole-value pattern the final value must comply with → "^[^e$%]*$" (the complete value may contain any characters except e, $ and %). On a field with datatype="regexp" OMIT data-cb-expression entirely — the regexp datatype validates the value via its "vrule" property, so only data-cb-keyexpression is set on that field.
- data-cb-flags = (optional) regex flags, e.g. "g"

Example — an input field that must not allow the characters e, $ and %:
"attributes": [{"text":"data-cb-func","value":"HTML.Input.REGEX"},{"text":"data-cb-keyexpression","value":"[^e$%]"},{"text":"data-cb-expression","value":"^[^e$%]*$"}]

CRITICAL — Inside a character class `$` is a LITERAL dollar sign (NOT the end-of-string anchor) and `.` is a literal dot, so `[^e$%]` really blocks e, $ and %. Regex metacharacters that must be blocked literally (e.g. `]`, `\`, `^` inside a class) still need to be escaped.

DERIVE the regex from the described rule — do NOT ask the user for a regex pattern when the allowed/blocked characters are stated in the request:
- ALLOW-LIST ("nur die Zeichen X erlaubt" / "only allows X" / "nur X zulassen"): every typed character must be one of X → data-cb-keyexpression is the ALLOWED class (no negation), e.g. "nur die Zeichen a–z erlaubt" → data-cb-keyexpression="[a-z]" (+ data-cb-expression="^[a-z]*$" ONLY when the field does NOT use datatype="regexp").
- BLOCK-LIST ("darf X nicht enthalten" / "must not contain X" / "block X"): use the NEGATED class as above, e.g. "nicht erlaubt: e$%" → data-cb-keyexpression="[^e$%]" (+ data-cb-expression="^[^e$%]*$" ONLY when the field does NOT use datatype="regexp").
- Ask for the pattern ONLY when the request does not describe the allowed/blocked characters at all.

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

## HTML.Input.Trans.NTW

Applicable on an XTextField (or XTextArea) to write typed DIGITS out as WORDS: each digit becomes its word, separated by a dash. `data-cb-NumberWords` decides the LANGUAGE; `data-cb-PreFix` / `data-cb-PostFix` wrap the result (both optional).

- data-cb-func = "HTML.Input.Trans.NTW"
- data-cb-NumberWords = the ten words for the digits 0..9 IN ORDER, comma-separated (the framework turns a comma value into the array the functionality expects — index 0 is the word for "0").
- optional data-cb-PreFix / data-cb-PostFix (e.g. "in Worten: " / " Euro").

THE WORD LIST IS LANGUAGE-SPECIFIC — take the words of the language the request asks for, never the German ones for another language:
- German: "Null,Eins,Zwei,Drei,Vier,Fünf,Sechs,Sieben,Acht,Neun"
- Spanish: "Cero,Uno,Dos,Tres,Cuatro,Cinco,Seis,Siete,Ocho,Nueve"
- English: "Zero,One,Two,Three,Four,Five,Six,Seven,Eight,Nine"
- French: "Zéro,Un,Deux,Trois,Quatre,Cinq,Six,Sept,Huit,Neuf"
- Italian: "Zero,Uno,Due,Tre,Quattro,Cinque,Sei,Sette,Otto,Nove"
Any other language: use that language's own ten words in the correct order.

CRITICAL — do NOT use HTML.Input.Cleave for this: Cleave is an input MASK and has no NumberWords parameter (a Cleave without a Config/Date even falls back to a DATE mask). And do NOT use the `CodBi_TRANS_NTW` standard CSS class when the request is not German: that class hard-codes the GERMAN words, so a Spanish request would produce German output. Use the class ONLY for German digit-to-word fields.

Example — "Füge ein Eingabfeld ein, das eingegebene Ziffern automatisch in ihre entsprechenden spanischen Wörter umwandelt":
"attributes": [{"text":"data-cb-func","value":"HTML.Input.Trans.NTW"},{"text":"data-cb-NumberWords","value":"Cero,Uno,Dos,Tres,Cuatro,Cinco,Seis,Siete,Ocho,Nueve"}]

## HTML.Panel

Turns a container (XContainer / XContainerInvisible / XFieldSet) into a collapsible panel: a clickable header folds and unfolds its body. The header is either an existing child element carrying the CSS class `CodBi_HTML_Panel_Header`, or one that this functionality GENERATES from `AutoHeaderTitle` (`GenerateHeader="true"`; if a title is set but the flag is missing, the header is generated anyway instead of failing).

PREFER the standard classes (see UI.Panels): `CodBi_HTML_Panel_Standard` / `_Flat` / `_Minimal` / `_Index` already apply this functionality with a finished look — on an **XFieldSet** (its `legend` is the panel title) AND on a **container** (XContainer/XContainerInvisible) whose owner sets a NON-EMPTY `data-cb-AutoHeaderTitle`: the class only fills in the attributes the element does not already have, so the container keeps its own title and the class still works. Use `data-cb-func="HTML.Panel"` only for a custom look.

Parameters (all optional, written as `data-cb-<Name>`; default in parentheses). EVERY CSS value is a RAW declaration list — no surrounding braces, no selector:
- `Folded` (true) — folded when loaded; `false` = open at the start.
- `GenerateHeader` (false) — generate the header element. REQUIRED (with a non-empty `AutoHeaderTitle`) when the tagged element holds no `CodBi_HTML_Panel_Header` child — otherwise the functionality throws.
- `AutoHeaderTitle` — the generated header text (MANDATORY on a container: a div has no `legend`); on a fieldset the `legend` is the title.
- `AutoHeaderLevel` — heading level of the generated header (1–6, e.g. 2 → `<h2>`).
- `AutoHeaderTitleSupplementsSpacer` (" / ") — separator between the title and the VALUES of fields tagged `CodBi_HTML_Panel_AutoHeaderTitle_Supplement` (surrounding spaces must be encoded as `%20`, e.g. `%20-%20`).
- `Accordion` — the accordion GROUP NAME: all panels that share this name fold each other (see HTML.Panel.Accordion below).
- `Scroll` (false) — scroll the view when the panel unfolds; `ScrollBlock` (nearest) — target position start | center | end | nearest; `ScrollToTop` (auto) — round scroll-to-top button: true | auto | false.
- `CSSHeaderUnfolded` — header CSS while unfolded (the main look); `CSSHeaderFolded` — header CSS while folded (set it to the SAME value so a folded panel keeps that look); `DCSSHeaderUnfolded` — dark-mode variant.
- `CSSHeaderHover` / `CSSHeaderFoldedHover` / `CSSHeaderActive` — hover / folded-hover / pressed header CSS.
- `CSSBeforeHeader` / `CSSAfterHeader` — header `::before` / `::after` CSS (folded); `CSSBeforeHeaderContent` / `CSSAfterHeaderContent` — their CONTENT string (e.g. a fold arrow " ▾"); `CSSBeforeHeaderContentUnfolded` / `CSSAfterHeaderContentUnfolded` — the same for the unfolded state.
- `CSSRequiredFields` / `CSSRequiredFieldsContent` — `::before` marker shown when the panel contains an invalidatable (required/validated) field.
- `CSSAnimFadeINPanel` / `CSSAnimFadeINPanelDuration` (0s) / `CSSAnimFadeInPanelEasing` (ease-in-out) — unfold animation.

## HTML.Panel.Accordion

Applicable on the WRAPPER container that holds several panels; it makes them mutually exclusive (unfolding one folds the others of the same set). The wrapper itself is NOT a panel.
- `Accordion` — REQUIRED: the SET NAME, e.g. `data-cb-Accordion="mySet"`. Without a name NOTHING happens (there is no `data-cb-accordion="true"`).
- EVERY member inside must be a panel itself — a `CodBi_HTML_Panel_*` class (XFieldSet, or a container with its own `AutoHeaderTitle`) or `data-cb-func="HTML.Panel"` + header — and must carry the SAME `data-cb-Accordion="<set name>"`; that shared name is what makes them mutually exclusive. Exactly ONE member may start open (`data-cb-Folded="false"`), the others `data-cb-Folded="true"`.
- PREFERRED: the class `CodBi_Accordion_A` … `_D` on the wrapper. One letter = ONE accordion group per form — use the FIRST letter not yet used; only when all four are taken use this functionality.

## HTML.Select.Injection

Applicable on an XSelect (select/dropdown) to dynamically populate its <option> entries from an element placeholder (EP) — use whenever a select's options come from a lookup EP (e.g. an "Ortsvorschläge" field listing all localities, "Straßen in <PLZ>", "Kantone der Schweiz"). Parameters:
- data-cb-Values (REQUIRED): the entries — an EP placeholder that returns the list, e.g. data-cb-Values="{ OpenPLZ.Localities > de ; ^An }" (all DE localities starting with "An"), or "{ Unique > { OpenPLZ.Localities > de ; ^An ; 1 }; name }" when a distinct name list is needed.
- data-cb-Values for the BayVIS authority directory: "{ BayVIS.Behoerden > bezeichnung }" + data-cb-ReClean="true" with an EMPTY `options` array - "alle im BayVIS registrierten Aemter", "Auswahl aller Aemter/Behoerden", "Behoerdenauswahl". `bezeichnung` is the office NAME; a bare "{ BayVIS.Behoerden }" would inject the whole objects.
- data-cb-ValueProperty (REQUIRED for object-returning EPs — e.g. OpenPLZ.Localities): the property to use as the <option> value — set "name" so the value is the city name.
- data-cb-TextProperty (REQUIRED for object-returning EPs): the property to use as the visible <option> text — set "name" (falls back to ValueProperty).
CRITICAL — OpenPLZ.Localities returns objects {postalCode, name, district, federalState, municipality, ...} with postalCode as the FIRST string. WITHOUT data-cb-ValueProperty="name" / data-cb-TextProperty="name" the functionality uses the first string property (the postalCode) as the option, so the "Ortsvorschläge" select would show PLZ numbers instead of the city names. Always set both to "name" for locality/street/canton lists.
- data-cb-Titles / data-cb-TitleProperty: optional <option> title-attributes.
- data-cb-ReClean: "true" to clear existing options before populating.
CRITICAL — NEVER put the EP into data-cb-Data for this functionality (data-cb-Data belongs to Sys.Log.Console / HTML.Text.Injector). The EP goes into data-cb-Values. data-cb-replacements / data-cb-property belong to HTML.Text.Mapper and are IGNORED here (an EP there yields an EMPTY select). APPLIES to XSelect only.
CRITICAL - every EP id (BayVIS.Behoerden, OpenPLZ.Localities, ...) is an ELEMENT PLACEHOLDER and is NEVER a functionality: it belongs in data-cb-Values (or another value parameter) and data-cb-func MUST stay "HTML.Select.Injection". data-cb-func="BayVIS.Behoerden" plus data-cb-replacements="{ BayVIS.Behoerden > bezeichnung }" and data-cb-property="innerHTML" on a select is WRONG - that is the HTML.Text.Mapper wiring and it cannot fill the options of a select.
CRITICAL - a class of an INACTIVE standard configuration is INERT: `CodBi_BayVIS_Auswahl_Behoerden` only works when the BayVIS configuration is among the active standard configurations of the form (`codbi-prop-standards`); otherwise emit the equivalent raw wiring (HTML.Select.Injection + data-cb-Values + data-cb-ReClean) directly.
CRITICAL — EMPTY the XSelect's manual `options`: an XSelect carrying data-cb-func="html.select.injection" MUST have an EMPTY Formcycle `options` array ([]) by default. Manually entered options are rendered by the browser at the BEGINNING of the select, ahead of the EP-injected options (the functionality appends after them), so they would appear as unwanted leading entries. Only add specific `options` when the user EXPLICITLY asked for leading options (they are then shown first, before the injected list); otherwise leave it empty.
CRITICAL — A "QUELLE" / "DATENQUELLE" (a Formcycle DATASOURCE) IS **NOT** AN EP — do NOT use HTML.Select.Injection for it: when the request names a data source configured in the Formcycle backend ("Quelle X" / "Datenquelle X" / "the source X" / "aus der Quelle ...", typically with a column: "Spalte 1 in der Quelle X"), that IS a Formcycle DATASOURCE, not an element placeholder. Bind it with the XSelect's OWN properties — `datasource` (when an "AVAILABLE FORMCYCLE DATASOURCES" list is provided this MUST be a listed name chosen BY MEANING and copied VERBATIM, keeping any leading number/prefix; if none clearly fits or several could, ASK the user which one to use — offer ONLY the fitting candidates and say how many fit; without a list, use the name AS-IS), the 1-based `dstextidx` (option text) / `dsvalueidx` (option value) / `dstitleidx` (option title), optionally `dstype` (DB, CSV, JSON, XML, LDAP, USER, PLUGIN) and `ds_rendercolattr` — and leave `options` EMPTY ([]). NEVER invent an EP for it (e.g. `{ Staatsangehoerigkeit > column1 }` — a datasource name is NOT an EP id and cannot resolve) and NEVER put it into data-cb-Values. Add NO data-cb-func at all for a datasource select. See the XSelect "Data source" section in the widget reference for the exact JSON.

CRITICAL — THREE datasource columns: map the user's WORD to the property — TEXT (Text-Spalte / "Spalte N als Text" / Anzeigetext / display) → `dstextidx`; VALUE (Wert-Spalte / "Spalte N als Wert" / Wert / value) → `dsvalueidx`; TITLE (Titel-Spalte / Titel / Tooltip / title) → `dstitleidx`. A named TITLE column ALWAYS goes into `dstitleidx` — NEVER into `dstextidx`; the "one named column → BOTH `dstextidx` AND `dsvalueidx`" default applies ONLY when the column carries no role word.
CRITICAL — DATASOURCE-SELECT OPTION SWITCHES (XSelect's OWN properties, set to `"1"`): `showpleaseselect` = "Show default option" (a leading default option so nothing is preselected — e.g. "wenn nichts ausgewählt ist, soll 'Bitte wählen' da stehen"; its TEXT is Formcycle-localized, so NEVER `placeholder` and never an invented text property); `removeduplicatetextvaluepairs` = "Remove duplicate text-pairs" (e.g. "doppelte Werte sollen entfernt werden") — the ELEMENT property, NOT the `Unique` element placeholder / html.select.injection; `ds_rendercolattr` = "Render all attributes" (renders every datasource column as an attribute on each option).

## HTML.SETAttribute

Applicable on any element to dynamically set one or more HTML attributes on it, including CSS styling via the "style" attribute.

USE THIS FUNCTIONALITY whenever the user asks to set an attribute or a visual/CSS style of an element — e.g. "set the title attribute of that input field to 'Holla die Waldfee'", "set the opacity of that input field to .5", "set the element's background color", "make the field readonly/disabled". Parameters:
- data-cb-name = **REQUIRED** — the attribute to set (e.g. "title", "placeholder", "readonly", "disabled", or "style" for CSS styling)
- data-cb-toset = **REQUIRED** — the value to set the attribute to (e.g. "Holla die Waldfee", "opacity: 0.5")

Example — an input field whose title attribute is set to "Holla die Waldfee":
"attributes": [{"text":"data-cb-func","value":"HTML.SETAttribute"},{"text":"data-cb-name","value":"title"},{"text":"data-cb-toset","value":"Holla die Waldfee"}]

CRITICAL — When MORE THAN ONE functionality applies to the SAME element (e.g. character blocking AND setting an attribute), combine them in ONE comma-separated data-cb-func value and set every parameter as its own data-cb-* attribute — do NOT create several data-cb-func entries or duplicate elements. Example: data-cb-func="HTML.Input.REGEX,HTML.SETAttribute" with data-cb-keyexpression, data-cb-expression, data-cb-name and data-cb-toset all set.

## HTML.Text.Injector

Applicable on an **XSpan** (the plain-text/HTML element — NEVER XText, which does not render) OR on an **XTextField / XTextArea** (input field / textarea) to inject a dynamic text value into a specific property of that element. **HTML.Text.Injector only REPLACES a placeholder inside the element's target property — it does NOT set or append the value on its own** (the placeholder defaults to `[[INJECTOR_REPLACEMENT]]`; if the target property does not contain it, nothing is injected). **REQUIRED**: data-cb-replacement (the EP expression AS-IS, e.g. `{ AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;; }` — it is resolved at runtime), data-cb-placeholder (the marker that is replaced; default `[[INJECTOR_REPLACEMENT]]`), and data-cb-property (the element property that holds the placeholder and receives the replacement). **XSpan**: data-cb-property="innerHTML" AND the placeholder MUST be written into the XSpan's text content — its Formcycle value property `rtevalue` (`rtevalue="[[INJECTOR_REPLACEMENT]]"`) — the placeholder in the rendered content is then replaced by the resolved EP result. **XTextField / XTextArea (input field / textarea)**: data-cb-property="value" AND the placeholder MUST be written into the Formcycle field's `value` property (e.g. `"value":"[[INJECTOR_REPLACEMENT]]"`) — WITHOUT the placeholder in the field's value properties the data-cb-replacement will NEVER reach the value. **CRITICAL — data-cb-func is the FUNCTIONALITY name `HTML.Text.Injector` — NEVER set data-cb-func to an element-placeholder (EP) name (e.g. NEVER `data-cb-func="OpenPLZ.Streets"`)**; the EP always goes into the `data-cb-replacement` value attribute, never into data-cb-func. (Setting an input's value from an EP may also be done with JSON.SET: data-cb-property="value" + data-cb-toset="{ <EP> }".)
CORRECT full example — a read-only XTextArea that displays the EP result (the `value` property MUST hold the placeholder AND `data-cb-property` MUST be "value"):
```json
{"className":"XTextArea","properties":{"name":"taWetterKI","id":"xi-ta-wetter-ki","label":"Wetter-KI","required":"0","readonly":"1","value":"[[INJECTOR_REPLACEMENT]]","fullwidth":"1","autosize":"1"},"attributes":[{"text":"data-cb-func","value":"HTML.Text.Injector"},{"text":"data-cb-property","value":"value"},{"text":"data-cb-replacement","value":"{ AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;; }"}]}
```
CORRECT full example — an XSpan that displays the EP result (the `rtevalue` MUST hold the placeholder AND `data-cb-property` MUST be "innerHTML"):
```json
{"className":"XSpan","properties":{"name":"spWetterKI","id":"xi-sp-wetter-ki","rtevalue":"[[INJECTOR_REPLACEMENT]]"},"attributes":[{"text":"data-cb-func","value":"HTML.Text.Injector"},{"text":"data-cb-property","value":"innerHTML"},{"text":"data-cb-replacement","value":"{ AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;; }"}]}
```

NOTE — HTML.Text.Injector carries a SINGLE plain-string replacement only. To show SEVERAL related BayVIS values together in one place (e.g. a header with an employee's name + phone + e-mail), NEVER create one Injector element per value — use ONE HTML.Text.Mapper whose data-cb-replacements fetches the needed detail object once and whose single template holds all [(property)] placeholders (ONE resolution instead of N).

## HTML.Text.Mapper

Applicable on any element to map object properties to named placeholders in a text template.
The placeholder syntax is a PROPERTY name wrapped in "[(...)]" (from the TSDoc) — e.g. `[(name)]`,
`[(vorname)]`, `[(nachname)]`, `[(mail)]`. Set `data-cb-func="HTML.Text.Mapper"` with:
- `data-cb-replacements`: the object (or array of objects) whose property VALUES fill the placeholders.
  This may be a literal object OR an EP placeholder that resolves to an object (e.g.
  `{ BayVIS.Ansprechpartner.Details > ... ; ... }`).
- `data-cb-property` (**REQUIRED**): the RUNTIME property of the target element that receives the mapped text and where the `[(property)]` template is read from — `innerHTML` on an **XSpan** (its template text is stored in the XSpan's Formcycle `rtevalue` property) and `value` on an **XTextField / XTextArea** (template text stored in the field's Formcycle `value` property). WITHOUT `data-cb-property` the mapper does not know which property to set on the target element, so it can never be omitted. NEVER set `data-cb-property` to `rtevalue` — `rtevalue` is only the Formcycle JSON storage key of an XSpan's content, NOT a runtime DOM property of the rendered element (the mapper reads/writes the element's real DOM property `innerHTML` / `value`).
- `data-cb-css`: optional CSS applied after the replacement.
The TEMPLATE with the `[(property)]` placeholders goes INTO the field's OWN content property
(value/rtevalue) — NEVER into a separate attribute; there is NO `data-cb-Template` attribute and
emitting one is a FAIL.
CRITICAL — when `data-cb-replacements` is fed by an EP that returns an OBJECT (e.g. BayVIS
person/authority details), the placeholders MUST be `[(property)]` naming the ACTUAL properties of that
EP's result object (e.g. `[(vorname)]`, `[(nachname)]`, `[(email)]`, `[(zimmer)]`, `[(apTelefonDurchwahl)]`, `[(apEmail)]`, ...) — NEVER
the HTML.Text.Injector placeholder `[[INJECTOR_REPLACEMENT]]` and NEVER a bare raw EP string. Each
`[(property)]` is replaced at runtime by the corresponding property of the object the EP produced. When
the user asks to display "the details" of a resolved object (a person, an authority, ...), render the
requested properties as `[(property)]` placeholders in the template text — do not put a
generic/standard placeholder into the field's content.

**USE MAPPER (not Injector) for OBJECT data** — in particular for BayVIS Details results: `BayVIS.Ansprechpartner.Details` / `BayVIS.Behoerden.Details` return a JSON OBJECT (e.g. BayVIS.Ansprechpartner.Details returns `{vorname, nachname, email, zimmer, apTelefonDurchwahl, ...}`, BayVIS.Behoerden.Details returns authority metadata — see the EP reference for exact properties), which HTML.Text.Injector cannot display (it injects only ONE plain STRING). A single Ansprechpartner whose ID is in a GLOBAL VARIABLE is fetched as `{ BayVIS.Ansprechpartner.Details > { V > <NAME> } }` with NO `{ I > 0 ; ... }` — the I/index EP is ONLY for ARRAYS (e.g. the array returned by `BayVIS.Ansprechpartner.ID`); a Details EP fed by a single id already returns ONE object.

SEVERAL BAYVIS VALUES SHOWN TOGETHER → ONE HTML.Text.Mapper, NEVER one HTML.Text.Injector per value: first decide WHERE each requested value actually lives (see the EXACT per-EP property lists in the EP reference) and fetch each DETAIL OBJECT only ONCE. Typical request — "links oben im Header die BayVIS-Kontaktdaten und den Namen des Mitarbeiters Salvatore Callari" — asks for the EMPLOYEE's contact block (his name + e-mail + phone); ALL of those values live on ONE object, so data-cb-replacements is just { BayVIS.Ansprechpartner.Details > { I > 0 ; { BayVIS.Ansprechpartner.ID > Salvatore Callari } } } (NO Data.Join) and the single template holds the person's REAL [(property)] placeholders, e.g. "[(vorname)] [(nachname)] — [(email)], Tel. 0[(apTelefonOrtsvorwahl)] [(apTelefonDurchwahl)]". A person's phone is NOT one property — BayVIS.Ansprechpartner.Details exposes only apTelefonLandvorwahl / apTelefonOrtsvorwahl / apTelefonAnlage / apTelefonDurchwahl (there is NO "phone"/"telefon" property), so compose the phone from those parts. NEVER take a person's phone/e-mail from BayVIS.Behoerden.Details — the authority object has NO phone and NO postal address (only bezeichnungBehoerde, behoerdenart, behoerdengruppe, bezeichnung, email, id, sortierreihenfolge, logo, behoerdeZuordnungen, behoerdenGebaeudeZuordnungen); postal addresses live on BayVIS.Behoerden.Details.Gebaeude (hausanschriftPLZ/hausanschriftOrt/hausanschriftStrasse and postanschrift*). Use Data.Join only when the values genuinely come from DIFFERENT detail objects (e.g. a building address + the contact person): data-cb-replacements="{ Data.Join > { <object1 EP> } ; { <object2 EP> } }" and reference each value by its own object's ACTUAL property name (a later Data.Join object overrides same-named properties). ONE Mapper element resolves its replacements ONCE; N Injector elements each resolve their own EP (N requests) — always prefer the single Mapper. Only a request that NAMES a Behörde/authority may use BayVIS.Behoerden.* — NEVER invent an authority name to make one work: "BayVIS" is the SYSTEM (the data source), not an authority, so { BayVIS.Behoerden.ID > Bayvis } cannot resolve. When the prompt names only a person/employee and no Behörde (e.g. the Salvatore-Callari header request), use ONLY { BayVIS.Ansprechpartner.Details > ... } and NEVER a BayVIS.Behoerden.* EP. NEVER fill a BayVIS-derived contact field with invented literal text (e.g. "Bayvis Straße 1, 12345 Musterstadt", "kontakt@bayvis.de", "+49 30 12345678") — the person's real contact data (e-mail → [(email)], phone → the apTelefon* parts, name → [(vorname)] [(nachname)]) is obtained ONLY from { BayVIS.Ansprechpartner.Details > { I > 0 ; { BayVIS.Ansprechpartner.ID > <name> } } } and rendered with [(property)] placeholders; hard-coding made-up values is a FAIL.

**REQUIRES**: `data-cb-property` (the RUNTIME target property — "innerHTML" on an XSpan, "value" on an XTextField/XTextArea), the object source (data-cb-replacements) and the text template with the [(property)] placeholders.

## HTML.Select.Favorites

RULE - HTML.Select.Favorites only REORDERS an otherwise COMPLETE option list: emit EVERY option the request describes (e.g. all Bundesländer) in its natural order; the functionality then moves the favourite options above a divider option it INSERTS itself, so NEVER add a "Trenner"/"---" option to `options` and NEVER reduce `options` to the favourites.
- data-cb-favorites: the TEXTS of the EXISTING options that shall move to the top, comma-separated, in the wanted order (e.g. "Bayern,Hessen").
- data-cb-divider: the divider's text-content (the functionality creates it; value "Divider").
- data-cb-dividertarget: the VALUE of the option selected when the divider is picked ("wenn der Trenner ausgewählt wird, soll X ausgewählt sein" => X). Without it, picking the divider restores the previous selection.
- data-cb-initialelement: the VALUE of the option selected when the form loads ("X soll anfangs ausgewählt sein" => X). Omit it unless the prompt asks for a preselected option - NEVER force the first option.
data-cb-dividertarget and data-cb-initialelement carry the option VALUE, data-cb-favorites carries the option TEXT (they only differ when the value differs from the label).

## JSON.SET

Applicable on ANY element — including the element the request just creates — to set ONE named PROPERTY of that element, or of a nested object reached by a dotted path from it; the same functionality also stores a JSON-serialized value in a hidden field. Apply data-cb-func="JSON.SET" with exactly these three parameters:
- data-cb-path: the OPTIONAL dotted path FROM the tagged element TO the object whose property is set — the LEADING parts of the requested property path (e.g. `style` for `style.scale` / `style.display`, `dataset` for `dataset.foo`); leave it EMPTY to set a property on the element itself (e.g. `innerHTML`, `value`). A regular JavaScript path in dot notation (plain `x`, dotted `x.y.z`, empty method call `x()`, index access `x[0]`) — a SINGLE path, NEVER a CSV list of field names (`data-cb-path="tfVorname,tfNachname"` is WRONG), and NEVER the property name itself.
- data-cb-property: the NAME of the property to set — the LAST segment of the requested dotted path, WITHOUT a dot (`scale` for `style.scale`, `display` for `style.display`).
- data-cb-toset: the plain value to assign, as a string (`2`, `none`). To assign a JSON object literal, prefix it with `^` so its commas are NOT treated as CSV separators by CodBi (e.g. data-cb-toset="^{firstname:..., lastname:...}").
CRITICAL — A NAMED/DOTTED PROPERTY IS ALWAYS JSON.SET (LANGUAGE-AGNOSTIC, decided by MEANING): when the request names a property of an element as a dotted path — "setze dessen style.scale Eigenschaft auf 2", "set its style.scale property to 2", "style.display auf none", "set innerHTML to ..." — solve it with JSON.SET on THAT element, splitting the path at the LAST dot (Path = all leading parts, Property = the last part, ToSet = the value). NEVER express such a property with a CSS class, an `attributes` entry, a `data-cb-*` attribute, or a Formcycle widget property, and NEVER ask the user how to set it. For a HIDDEN JSON field the same functionality takes an empty Path and Property="value" (mark the field `ishidden="1"` — the Formcycle hide property, NOT `invisible`).
CRITICAL — data-cb-property/data-cb-toset do NOT support field placeholders, so JSON.SET can NEVER build JSON from the RUNTIME values of other form fields. For a hidden field that stores the JSON of OTHER FIELDS' values (e.g. "verstecktes Feld, das das JSON aus tfVorname/tfNachname speichert") DO NOT use JSON.SET — create a Formcycle CALCULATION field (XFormula, read-only, formula in xformula_value) that builds the JSON, and mark it ishidden="1" when the prompt intends a hidden field (as in this example) — a calculation field is NOT required to be hidden and may also be left visible. The xformula_value builds the JSON string EXACTLY as written using [%fieldName%] placeholders — e.g. xformula_value = {"vorname":"[%tfVorname%]","nachname":"[%tfNachname%]"} — do NOT use JSON.stringify and do NOT reference bare field names ([%name%] is replaced by the field's runtime value).
NEVER emit data-cb-func="JSON.SET" without data-cb-property and data-cb-toset (plus data-cb-path when the target is a nested object) — derive all three from the request; ask the user only when they truly cannot be derived.
**REQUIRES**: data-cb-property and data-cb-toset, plus data-cb-path only when the property sits on a nested object (empty Path = the element itself).

## LDAP.Autocomplete.Set

Fills SEVERAL fields of ONE group from a single selected LDAP match - apply data-cb-func="LDAP.Autocomplete.Set" to the CONTAINER (XContainer / XContainerInvisible / XFieldSet) and tag the member inputs with the CodBi_LDAP_AC_* classes (Mail, FirstName, LastName, Title, Department, Telephone, Account, CommonName, DisplayName) or give them data-cb-ldapProperty="<ldap attribute>". The `Property` parameter is the LDAP attribute the TYPED value is matched against (e.g. mail / cn). NEVER offer or ask for an "LDAP source"/"LDAP connection"/"LDAP query" (Formcycle does not allow binding an LDAP source to a form element). THE LDAP URL IS DECIDED BY THE INSTALLATION - see the injected "LDAP CONFIGURATION" block: a url the request NAMES explicitly is ALWAYS written into data-cb-URL (the request wins); when it states that a url IS configured AND the request names no url, leave data-cb-URL EMPTY (the configured url is used) and never ask for it; when it states that NO url is configured, data-cb-URL is REQUIRED and its value belongs to the user - build with the url the user supplied, never an invented one.

## LDAP.Autocomplete

Applicable on an XTextField (input type="text") whose value comes from the LDAP/Active Directory: data-cb-func="LDAP.Autocomplete" + data-cb-property="<LDAP ATTRIBUTE>" ("mail" for an e-mail address, telephoneNumber, sAMAccountName, cn, sn, givenName) - no `datasource`, no EP, no select. CRITICAL - this is the wiring for ANY input field that must hold an LDAP attribute, ALSO when the request never says "autocomplete"/"Vervollstaendigung" (e.g. "Fuege ein Eingabefeld fuer die E-Mail-Adresse von Mitarbeitern aus dem LDAP ein"): an LDAP-backed input is always this functionality - it completes while typing and rejects values that do not exist in the directory. NEVER offer or ask for an "LDAP source"/"LDAP connection"/"LDAP query": Formcycle does not allow binding an LDAP source to a form element. THE LDAP URL IS DECIDED BY THE INSTALLATION - see the injected "LDAP CONFIGURATION" block: a url the request NAMES explicitly is ALWAYS written into data-cb-URL (the request wins); when a url IS configured AND the request names no url, leave data-cb-URL EMPTY (the configured url is used) and never ask for it; when NO url is configured and the request names none, data-cb-URL is REQUIRED and its value belongs to the user - the clarify round asks for it and it must never be invented. Optional: data-cb-CSSProposals (proposals-select style) and data-cb-MsgNotInLDAP (message when the value is not found). When ONE selected person must fill SEVERAL fields, use LDAP.Autocomplete.Set on the container instead.

## Matomo.Tracking

Applicable on any form to add Matomo/Piwik analytics event tracking. **REQUIRES**: the Matomo site/tracking ID (SiteID) — ask the user when not provided. Matomo server URL: NEVER ask the user for it — if the request specifies a URL, use that URL; otherwise the URL is taken automatically from the server-side plugin configuration (Matomo_URL property) and must NOT be requested. When the prompt says "Matomo-Tracking aktivieren" or "activate Matomo tracking" without specifying a SiteID, do NOT add Matomo.Tracking functionality via data-cb-func on any element. Instead, include {"id":"Holistic.Matomo.Tracking","targets":[]} in _codbiApplicability.applied — the server reads this and activates the standard configuration.

## Media.Image.Cropper

A plain "Vorschau"/"preview"/"Bildvorschau" request (see the chosen file/image before/after selecting it) is NOT a cropper — it is the FORMCYCLE preview configuration, the DIRECT XUpload property `"filepreview":"1"`. NEVER tag the upload with data-cb-func="Media.Image.Cropper" (or a CodBi_Fotocropper_* class) for a preview.

TWO DISTINCT USES — pick by the request, NEVER apply both:
- (a) CROP DIALOG ON THE UPLOAD: an upload for an image/ID card with a cropper ("Bild-Cropper", "with crop", "Upload-Feld für den Personalausweis mit Bild-Cropper") → set data-cb-func="Media.Image.Cropper" (or a CodBi_Fotocropper_* class) on that XUpload. NEVER omit it.
- (b) FOTOCROPPER BOARD / "Fotocropper-Board" / "Bild-Cropper vor dem Upload X" (a full photo-cropper setup placed BEFORE an upload) → build the COMPLETE `CodBi_Fotocropper` group (see codbi-standard-configurations / codbi.general Fotocropper) BEFORE the referenced upload — wrapper container `CodBi_Fotocropper` + `CodBi_Fotocropper_Board` + `CodBi_Fotocropper_Uploader` (XUpload) + `CodBi_Fotocropper_Update` (button) + `CodBi_Fotocropper_ImageURL` (hidden field) + `CodBi_Fotocropper_Foto` (XImage). The referenced upload itself gets NO cropper functionality. An EMPTY board or a bare data-cb-func="Media.Image.Cropper" on the target upload is a FAIL (Media.Image.Cropper requires the Container/File/Updater/ImageURL/Target selectors, which only the full Fotocropper group provides).

## Media.MultipleUpload

USE whenever the request wants the user to upload SEVERAL files into ONE upload field: "mehrere Dateien hochladen", "multiple files", "mehrere Bilder/Anhänge", "mehrere Dateien können hochgeladen werden", "auch mehrere Dateien", "Upload mehrerer Dateien". This is the CODBI MULTIPLE-UPLOAD functionality (verified in the source: it sets the `multiple` attribute on the file input, limits the number of files, renders a drag & drop area with a styled upload button and shows an overlapping-card preview of the selected files that can be maximized and from which single files may be removed). Apply it ON that XUpload:
- set `data-cb-func="Media.MultipleUpload"`,
- `data-cb-Maximum` = the number of files the user may upload (e.g. `"5"`). Always set it to a count: the count comes from the user's request when it names one, or from the answered clarification question ("how many files may be uploaded" — the clarify round MUST ask it when no count is stated). Only when no count is given and no clarification was possible (or the user delegated/declined the count), keep the functionality's default of `2` (i.e. `data-cb-Maximum="2"`) — never silently default to 2 while a count was left unspecified without asking,
- optionally `data-cb-PrefixTooMany` / `data-cb-PostfixTooMany` (the messages shown before/after the number when too many files are selected) when the request states them.
ALSO set the Formcycle native multiple-file flag on the SAME XUpload: the DIRECT property `"uploadMultiple":"1"` (so the upload pipeline accepts/keeps all selected files, complementing the CodBi UI functionality). MISSING: an upload that should accept multiple files WITHOUT `data-cb-func="Media.MultipleUpload"` (+ `uploadMultiple:"1"`) is a FAIL. Do NOT confuse the multiple-upload functionality with the CROPPER or the PREVIEW — a "mehrere Dateien" request applies ONLY Media.MultipleUpload. CRITICAL — SINGLE FIELD ONLY: "mehrere Dateien"/"multiple files" means several FILES IN THE ONE upload field, NOT several upload FIELDS — apply Media.MultipleUpload on the ONE requested XUpload and NEVER create a second / "Weiteres ... hochladen" / "another" upload element.

## MEDIA.INPUT.SPEECH

Applicable on a text input field to enable speech-to-text dictation via the Web Speech API.

## OnChange.Conditional

USE THIS — never Formcycle `hiddenif*` — when an element must appear/disappear (or change a property) because a DATE/TIME/NUMBER field value is greater/less/equal to a threshold, and the change must happen immediately while the user edits, without submitting. Language-agnostic triggers: "after/before <date>", "older/younger than", "more/less than <number>", "from ... on", "up to ...", "as soon as ... is entered", "sobald ... nach dem ... liegt", "soll sofort reagieren, ohne Absenden", "updates immediately while typing". `hiddenif*` stays for DISCRETE selection state only (chosen option, checked checkbox, empty field).

The tagged element IS the watched field (the trigger). Apply:
- `data-cb-func="OnChange.Conditional"`
- `data-cb-Mode` = `GT` (after/later/greater), `GTEQ` (on/after/at least), `LT` (before/earlier/less), `LTEQ` (on/before/at most), `EQ`, `NEQ`. The enum is GTEQ/LTEQ — `GTE`/`LTE` are INVALID.
- `data-cb-Reference` = a DATE, never a plain string: `{ Date.FromString > 01.06.2026 ; DD.MM.YYYY }` or `{ Date.Today }`.
- `data-cb-Candidate` = dot-prefixed CLASS selector of the watched field (its own name when tagged).
- `data-cb-Target` = dot-prefixed CLASS selector of the element to change; candidate and target MUST share the same container/fieldset. No `#id` selectors.
- `data-cb-DateFormat` = the candidate value's format (`DD.MM.YYYY` for `dateDE`, `YYYY-MM-DD` for native date); omit for non-date values.
- TRUE/FALSE branches are attributes on the SAME field: `data-cb-_T_<param>` / `data-cb-_F_<param>` (marker stripped; the rest becomes `data-cb-<param>` on the target). For visibility: `data-cb-_T_func="HTML.SETAttribute"`, `data-cb-_T_name="style"`, `data-cb-_T_toset="display:block"`; `data-cb-_F_func="HTML.SETAttribute"`, `data-cb-_F_name="style"`, `data-cb-_F_toset="display:none"`.
- INITIAL STATE: runs only on `change`; hide the target at load with its own `data-cb-func="HTML.SETAttribute"` + `data-cb-name="style"` + `data-cb-toset="display:none"`. Never `ishidden`.

WORKED EXAMPLE — required date field `tfKursbeginn` (datatype dateDE) + hint container `coSpaetbucherHinweis` ("Spätbucher-Zuschlag: 20 €"), hidden at start, shown when the date is AFTER 01.06.2026, hidden again for an earlier or empty value:
```json
{"className":"XTextField","properties":{"name":"tfKursbeginn","id":"xi-tf-kursbeginn","label":"Kursbeginn","required":"1","datatype":"dateDE"},"attributes":[{"text":"data-cb-func","value":"OnChange.Conditional"},{"text":"data-cb-Mode","value":"GT"},{"text":"data-cb-Reference","value":"{ Date.FromString > 01.06.2026 ; DD.MM.YYYY }"},{"text":"data-cb-Candidate","value":".tfKursbeginn"},{"text":"data-cb-Target","value":".coSpaetbucherHinweis"},{"text":"data-cb-DateFormat","value":"DD.MM.YYYY"},{"text":"data-cb-_T_func","value":"HTML.SETAttribute"},{"text":"data-cb-_T_name","value":"style"},{"text":"data-cb-_T_toset","value":"display:block"},{"text":"data-cb-_F_func","value":"HTML.SETAttribute"},{"text":"data-cb-_F_name","value":"style"},{"text":"data-cb-_F_toset","value":"display:none"}]}
{"className":"XContainer","properties":{"name":"coSpaetbucherHinweis","id":"xi-co-spaetbucher-hinweis","label":"Spätbucher-Hinweis","cssclasses":["coSpaetbucherHinweis"],"elements":["spHinweis"]},"attributes":[{"text":"data-cb-func","value":"HTML.SETAttribute"},{"text":"data-cb-name","value":"style"},{"text":"data-cb-toset","value":"display:none"}]}
```
Both elements are children of the SAME XFieldSet/container. List `OnChange.Conditional` (and the target's `HTML.SETAttribute`) in `_codbiApplicability.considered` and in the details-request `elements` — never `codbiVerdict:"none"`.

## OnLoad.Conditional

USE THIS when an element must appear/disappear (or change a property) AT LOAD because a NUMBER computed from an ELEMENT-PLACEHOLDER (EP) result is greater/less/equal to a threshold — e.g. show a panel only when a BayVIS list returns MORE THAN ONE element. Unlike `OnChange.Conditional` it registers NO `change` event listener (it does not react to user edits) and compares NUMBERS (not Dates). This is the correct mechanism for a load-time "more/less than <number>" driven by an EP value (like an array `.length`) that is already known when the page renders.

The tagged element owns the comparison parameters (candidate/reference/mode); the `_T_`/`_F_` branches are attributes on the SAME tagged element and are applied to the target. Apply:
- `data-cb-func="OnLoad.Conditional"`
- `data-cb-Candidate` = the value to compare, supplied as an element placeholder that resolves to a NUMBER or numeric string, e.g. `{ JSON.Path > { bayvis.leistungsansprechpartner > 25439 } ; length }` (the EP is resolved into this parameter by the renderer at load), or a numeric literal.
- `data-cb-Reference` = the numeric threshold, e.g. `1`; may itself be an element placeholder; a literal is parsed with `Number()`.
- `data-cb-Mode` = `GT` (greater than), `GTEQ` (at least), `LT` (less than), `LTEQ` (at most), `EQ`, `NEQ`. The enum values are `GTEQ`/`LTEQ` — `GTE`/`LTE` are INVALID.
- `data-cb-Target` = dot-prefixed CLASS selector of the element whose attributes are changed, resolved inside the tagged element's container; never an `#id`.
- TRUE/FALSE branches on the SAME tagged element: `data-cb-_T_<param>` / `data-cb-_F_<param>` (marker stripped; the rest becomes `data-cb-<param>` on the target). For visibility: `data-cb-_T_func="HTML.SETAttribute"`, `data-cb-_T_name="style"`, `data-cb-_T_toset="display:block"`; `data-cb-_F_func="HTML.SETAttribute"`, `data-cb-_F_name="style"`, `data-cb-_F_toset="display:none"`. No separate load-time hide is needed — the branch applies immediately at load (omit the false branch to leave the target as authored).

WORKED EXAMPLE — show container `coMehrfachZuordnungHinweis` ("Mehrfachzuordnung: mehrere Ansprechpartner vorhanden") at load only when `bayvis.leistungsansprechpartner` returns MORE THAN ONE element, hide it otherwise:
```json
{"className":"XContainer","properties":{"name":"coMehrfachZuordnungHinweis","id":"xi-co-mehrfach-zuordnung-hinweis","label":"Mehrfachzuordnung-Hinweis","cssclasses":["coMehrfachZuordnungHinweis"],"elements":["zuordnungHinweis"]},"attributes":[{"text":"data-cb-func","value":"OnLoad.Conditional"},{"text":"data-cb-Candidate","value":"{ JSON.Path > { bayvis.leistungsansprechpartner > 25439 } ; length }"},{"text":"data-cb-Reference","value":"1"},{"text":"data-cb-Mode","value":"GT"},{"text":"data-cb-Target","value":".coMehrfachZuordnungHinweis"},{"text":"data-cb-_T_func","value":"HTML.SETAttribute"},{"text":"data-cb-_T_name","value":"style"},{"text":"data-cb-_T_toset","value":"display:block"},{"text":"data-cb-_F_func","value":"HTML.SETAttribute"},{"text":"data-cb-_F_name","value":"style"},{"text":"data-cb-_F_toset","value":"display:none"}]}
```
List `OnLoad.Conditional` (and the target's `HTML.SETAttribute`) in `_codbiApplicability.considered` and in the details-request `elements` — never `codbiVerdict:"none"`.

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

Controls an element's visibility per output channel. Decide by MEANING in ANY language — NOT with `HTML.CSS`/`@media print`:
- PRINT-ONLY / VISIBLE ONLY IN PRINT ("nur im Druck sichtbar", "nur auf dem Ausdruck", "print-only", "only visible when printed"): apply the STANDARD class `CodBi_Print_Remove_PrintOnly` to the element's `cssclasses` — the element is hidden in the interactive form and shown when printed.
- SCREEN-ONLY / HIDDEN IN PRINT ("beim Drucken ausblenden", "nicht im Druck sichtbar", "hidden when printing"): apply `CodBi_Print_Remove_Tagged` (the element itself) or `CodBi_Print_Remove_Parent` (its whole container/section). Interactive/control elements (nav/submit buttons) belong here by default.
- FUNCTIONALITY FORM (only when a parameter is required): `data-cb-func="Print.Remove"` + `data-cb-invert="true"` = PRINT-ONLY (hidden in the form, shown when printed); WITHOUT Invert = HIDDEN-IN-PRINT. Optional `data-cb-documentselector` (dot-prefixed class selector) or `data-cb-parentallevel` (ancestor steps; when Invert is set and ParentalLevel is omitted it defaults to "1", so the element's wrapper is hidden in the form).
- The implementation only sets `style.display="none"` — it does NOT remove the element from the DOM, so values remain available and repeatable containers keep their structure.
USER DATA / SENSITIVE fields (birth place, address, personal data) must NEVER be hidden proactively — only when explicitly requested. NEVER emit `@media print` rules or a helper `display:none` class instead of Print.Remove; HTML.CSS is for styling rules only.

## SV

Copies URL QUERY parameters into CodBi global variables at form load. USE WHEN a URL parameter must be linked into a global variable for the form/workflow — LANGUAGE-AGNOSTIC, by MEANING in ANY language: "URL-Parameter X als globale Variable", "verlinke den URL-Parameter X", "Query-Parameter in Formularvariable", "link/bind/map URL parameter X as a global variable", "read the query parameter into a global variable", "pass a URL parameter to the workflow". NOT for reading an existing variable (that is the `V` EP), NOT a hidden field / `JSON.SET`, NOT a literal variable value.

- WIRING: `data-cb-func="SV"` on an `XContainer` / `XContainerInvisible` / `XFieldSet` (create ONE invisible container `coUrlParams` when none exists and place it on the first page) + `data-cb-Destinations="<GLOBAL_VARIABLE>"` + `data-cb-Sources="<URL_PARAMETER>"`.
- `Destinations` and `Sources` are CSV lists of EQUAL length, paired by index: the i-th source fills the i-th destination. URL-parameter names are case-sensitive. A missing URL parameter yields an empty string.
- DECLARE every destination in the form's TOP-LEVEL `"variables"` array as `{"name":"<NAME>","aliasname":"<NAME>","serveronly":false,"value":""}`. Formcycle only forwards declared variables; an undeclared destination is logged as an error by SV and never reaches the workflow.
- DOCUMENT IT: add ONE plain `XSpan` child inside the SV container whose `rtevalue` states the mapping in the form's language. SINGULAR: `<p>Dieses Element übernimmt den URL-Parameter <strong>Hoho</strong> in die globale Variable <strong>Alpha</strong>.</p>` (English: `<p>This element copies URL parameter <strong>Hoho</strong> into global variable <strong>Alpha</strong>.</p>`). SEVERAL pairs: ONE combined, natural sentence — `<p>Dieses Element übernimmt die URL-Parameter <strong>Hoho</strong> und <strong>Jojo</strong> in die globalen Variablen <strong>Alpha</strong> und <strong>Beta</strong>.</p>` (English: `<p>This element copies the URL parameters <strong>Hoho</strong> and <strong>Jojo</strong> into the global variables <strong>Alpha</strong> and <strong>Beta</strong>.</p>`); for three or more use a comma list with "und"/"and" before the last — NOT one separate sentence per pair. The XSpan's `properties` MUST contain `"ishidden":"1"` — the Formcycle **Hidden/Ausblenden checkbox CHECKED**; do NOT rely on the surrounding invisible container and NEVER use `invisible` (not a property) or a CSS class. The note is author-facing documentation and is never shown to the user; do not omit it.
- WORKED EXAMPLE — "Verlinke den URL-Parameter Hoho als globale Variable.":
  - top-level `"variables"`: `[{"name":"Hoho","aliasname":"Hoho","serveronly":false,"value":""}]`
  - one `XContainerInvisible` `coUrlParams` with attributes `[{"text":"data-cb-func","value":"SV"},{"text":"data-cb-Destinations","value":"Hoho"},{"text":"data-cb-Sources","value":"Hoho"}]`, added to the first page's `elements`; its `"elements"` contains ONE `XSpan` `spUrlParamNote` (`"ishidden":"1"`, `"rtevalue":"<p>Dieses Element übernimmt den URL-Parameter <strong>Hoho</strong> in die globale Variable <strong>Hoho</strong>.</p>"`) with `parentid="coUrlParams"`.
- If the request gives two names ("URL-Parameter X in die globale Variable Y"), Destinations=Y and Sources=X; if it gives ONE name, it is both.

## Sys.Log.Console

Applicable for debugging; logs CodBi runtime data to the browser developer console.

Sys.Log.Console does NOT need an existing form element — it is a standalone functionality. When the user asks to output/print/log/show anything to the browser console (URL content, BayVIS data, CSV, global variables, DOM elements, etc.), you MUST create a NEW **invisible XSpan** — `"className"` MUST be `"XSpan"` (the plain-text/HTML element of Formcycle); NEVER an `XContainer`/`XContainerInvisible`, NEVER the functionality id as className, and NEVER invented class names like "XText" or "XButton" (XTextField is an INPUT element, not plain text). The XSpan has the Formcycle Hidden property CHECKED (`"ishidden": "1"`) and its `rtevalue` is a DESCRIPTIVE sentence in the form's language that states something is output to the browser console AND what is output (author-facing documentation, exactly like the SV note / the HTML.CSS carrier element) — e.g. `"Gibt alle im BayVIS registrierten Ämter in der Konsole aus."`. List it as a separate item in the root "items" array with EXACTLY this shape:

```
{
  "className": "XSpan",
  "properties": {
    "name": "spLog<Name>",
    "id": "xi-log-<name>",
    "rtevalue": "<descriptive sentence: what is output to the console>",
    "ishidden": "1"
  },
  "attributes": [
    { "text": "data-cb-func", "value": "Sys.Log.Console" },
    { "text": "data-cb-Data", "value": "<EP placeholder { ... } when logging an EP result, otherwise SYS.Log.Console > <what shall be logged>>" }
  ]
}
```

Also add the element's name to the first page's "elements" array. **`data-cb-Data` rule — WHEN THE LOGGED CONTENT IS AN ELEMENT-PLACEHOLDER RESULT, write the EP placeholder ITSELF as the value, with NO `SYS.Log.Console > ` prefix and NO surrounding descriptive text** — e.g. for "gib alle im BayVIS registrierten Ämter in der Konsole aus" use EXACTLY `"{ BayVIS.Behoerden > bezeichnung }"` (NOT `"SYS.Log.Console > { BayVIS.Behoerden > bezeichnung }"`). The `SYS.Log.Console > ` prefix is used ONLY for free descriptive text that is NOT an EP, e.g. `"SYS.Log.Console > Log the details of the planet Pluto with a saturation of .5"`. For AI-generated text use the AI.LLAMA.STD.QA EP placeholder directly, e.g. `"{ AI.LLAMA.STD.QA > <Frage>; true;;;;;; }"`.

## Time.Frame

Applicable ONLY on the BEGIN (minimum) XTextField of **type 'time'** when there is a second related end time field. The end field is referenced via the 'MaxField' parameter. Do NOT put this functionality on the end time element.

**CLASS PAIR FIRST — THE TWO WIRINGS ARE MUTUALLY EXCLUSIVE (CRITICAL):** the standard CSS-class pair `CodBi_TimeFrame_<N>_Begin` + `CodBi_TimeFrame_<N>_End` (the class reference lists which N exist) ALREADY applies this very functionality (`HTML.Input.Cleave` + `Time.Frame` with `MaxField: ".CodBi_TimeFrame_<N>_End"`). So for a time range:
- use a FREE class pair and then add NOTHING else — putting `data-cb-func="Time.Frame"` (or `data-cb-maxfield`) on top of the pair is a REDUNDANT double configuration and a FAIL;
- this functionality + `data-cb-maxfield` is the FALLBACK ONLY, used exclusively when EVERY frame pair is already taken by the form (no free N left). Never both, in any case.
**REQUIRED (fallback only)**: data-cb-maxfield = the END (maximum) time field's name. The begin field is the tagged element. Both fields are time inputs restricted to HH:MM (pattern `^(0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$`) so the BEGIN time may not be AFTER the END time.
- `EqualityPermitted`: whether the SAME start and end time is permitted. It applies to the FALLBACK wiring only (the class pairs set it themselves); set it to `false` when the user requires the end time to be STRICTLY after the start.

## DQ.Table.View

Applicable on a container element (e.g. an XContainer/XContainerInvisible) to display the result of a Formcycle DataQuery in an injected HTML table and to enable exporting that table to an Excel file (.xlsx). USE whenever the user asks to show/display/view the data or the columns of a DataQuery/datasource/query as a table and/or to export it to Excel.

CRITICAL — TRIGGER PHRASES that MUST be mapped to DQ.Table.View (do NOT ask clarifying questions):
- "add a table that views/shows/displays the columns <X>, <Y> of <Query>" (e.g. "add a table that views the columns Alter, Name of HolaQuery")
- "zeige die Spalten <X>, <Y> der Abfrage <Query> als Tabelle"
- "show/table the data of the query <Query>", "Tabelle mit den Spalten ... der Abfrage ..."
QUERY NAME for data-cb-dataquery — bind a name from the AVAILABLE FORMCYCLE DATASOURCES list (provided with the form context), chosen BY MEANING: the user's wording ("die Altstadtfest-Abfrage") need NOT equal the technical name ("INHALT.Antrag auf Zulassung … Altstadtfest 2027") — copy the listed name VERBATIM (character-for-character, including any "56_" prefix). NEVER keep the user's wording when it is not a listed name and NEVER invent one: when NO listed name clearly fits (or SEVERAL fit) the CLARIFICATION round asks for the query — use its answer. Only when NO list is available at all may the user's wording be used as-is. Do NOT ask whether the query exists or for its technical ID; the DataQuery is a server-side datasource configured in the Formcycle backend.
- Placement: if the user does NOT specify where to put the table, create a NEW XContainer/XContainerInvisible and append it to the first page — do NOT ask where to place it.
- Sorting/filtering: NOT applied by default — display the columns as-is. Only add sorting or filtering when the user explicitly requests it.

Create an XContainer/XContainerInvisible and set on it (via the attributes array):
- data-cb-func = "DQ.Table.View"
- data-cb-columns = **REQUIRED** — a CSV defining the columns to show, each column is `label;datacolumn;jsonFlag` with an optional fourth entry `;width`: e.g. `Anrede;Anrede;false,Unternehmen;Unternehmen;true,Nachricht;Nachricht;false;30`. `label` is the displayed header, `datacolumn` is the exact column name in the DataQuery result, `jsonFlag` (`true`/`1`/`yes`) marks a column as containing JSON so its cells show a maximizable JSON viewer (use `false`/`0`/`no` for plain columns; a plain number in this position is treated as the legacy width), `width` (optional) sets the column width (characters in Excel, pixels on screen). A JSON column is expressed as `label;datacolumn;true` (e.g. `Details;Details;true`). The value is assembled from the per-column facts collected in the CLARIFICATION round — HEADER LABEL first, then the QUERY COLUMN, then the JSON flag, then the optional WIDTH: answers `Alter | Alter | nein | –`, `Name | Nachname | nein | 20`, `Details | Details | ja | –` become `Alter;Alter;false,Nachname;Name;false;20,Details;Details;true`. A column entry WITHOUT its `datacolumn` is invalid and makes the functionality throw and the table render NOTHING (a FAIL) — only emit a column entry when you can resolve BOTH its label AND its datacolumn. **The FULLY EMPTY value `data-cb-columns=""` is the one legal "empty" case** (see the SKIP rule below): when the user skips/leaves blank the column definition in the clarification, emit the container WITH `data-cb-columns=""` — the runtime then renders an EMPTY table (no columns) instead of throwing, and the user can add the CSV definition later, comfortably, in the function's CSV editor.
- data-cb-dataquery = **REQUIRED** — the name of the Formcycle DataQuery on the server whose result shall be shown (e.g. `HolaQuery` or `INHALT.Eigentuemerdialog_Dezember_2025`).
- data-cb-css = (optional) one or more (space separated) CSS classes to apply to BOTH the tagged container and the injected table.
- data-cb-filename = **REQUIRED whenever the table is exportable to Excel** — the name of the exported Excel file WITHOUT extension (the extension is always `.xlsx`). Defaults to `Export`, but when the user asks for an Excel export the AI MUST set a SENSIBLE value derived from the query instead of leaving the default and MUST NOT omit it: strip the datasource prefix and extension from the query name and use its readable core, e.g. the query `INHALT.Altstadtfest_2027` → `data-cb-filename="Altstadtfest_2027"` (NEVER a boolean and NEVER empty, NEVER left at the bare `Export` default). Omitting FileName is a mistake: the user expects a meaningful export file name.
- data-cb-sheetname = **REQUIRED whenever the table is exportable to Excel** — the worksheet name in the exported Excel file. Defaults to `sheet1`, but when the user asks for an Excel export the AI MUST set a SENSIBLE value derived from the query (same readable core as the filename, max ~31 chars), e.g. the query `INHALT.Altstadtfest_2027` → `data-cb-sheetname="Altstadtfest_2027"` — NOT the technical query name and NEVER a boolean (`true`/`1`) or empty. Omitting SheetName is a mistake: the user expects a meaningful worksheet name.
- data-cb-exportbutton = (optional) a CSS selector of a REAL button that triggers the export. It is NEVER a boolean — `data-cb-exportbutton="true"` / `"1"` matches NO element, so the export is silently unavailable (a FAIL). It MUST be a **CLASS selector** (starting with `.`), e.g. `.CodBi_Table_View_ExportButton` — NEVER an ID selector (`#...`): the ID selector resolves to the XButtonList WRAPPER (its container div), not to the `<button>` itself, so the click handler is NOT attached and the export does nothing. Only the class on the button reaches the actual `<button>` element. If omitted (or no matching element is found) the table is rendered WITHOUT any export button — the Excel export is then simply not available.
- data-cb-urlparttoreplace = (optional, paired with data-cb-urlpartreplacement) a URL part within the query's datasource URL that shall be REPLACED before the DataQuery is executed. The pair is combined by POSITION with data-cb-urlpartreplacement: the first entry is the target, the first entry of data-cb-urlpartreplacement is its replacement, and so on. Use when the user asks the table/query to use a DIFFERENT URL/endpoint part (e.g. "use the test dataset", "ersetze die URL", "nimm anstelle von X das Y"). When this placeholder is set, the runtime swaps the matching part of the datasource URL.
- data-cb-urlpartreplacement = (optional, paired with data-cb-urlparttoreplace) the replacement value(s) for the URL part(s) listed in data-cb-urlparttoreplace, matched by position. Both must be present together for the replacement to apply — if only one side is emitted the replacement is ignored. Emit NO boolean here: the value is the literal replacement text for the URL part.
CRITICAL — WHENEVER the export IS requested, the DQ container MUST carry the FULL attribute set together: `data-cb-func`, `data-cb-dataquery`, a NON-EMPTY `data-cb-columns`, AND `data-cb-filename`, `data-cb-sheetname`, `data-cb-exportbutton` — ALL SIX on the SAME container, in one emission. Emitting only func+dataquery+columns (without filename/sheetname/exportbutton) leaves the export unreachable and is a FAIL. Do NOT reuse the submit/Weiter button (it submits the form instead of exporting) and do NOT accept the export request and then omit data-cb-exportbutton/data-cb-filename/data-cb-sheetname. To make the export reachable you MUST: (1) create a DEDICATED export `XButtonList` with a single NON-navigation button with NO action — a SEPARATE top-level item in the root "items" array (never inside the DQ container's `elements`), (2) PUSH the stable class `CodBi_Table_View_ExportButton` into that button's `cssclasses` property — NOTE the property is spelled `cssclasses` (lowercase, all one word); there is NO `classNames` property on an XButtonList button, so NEVER write `buttons:[{ "classNames":[...] }]` (it is ignored, so the selector `.CodBi_Table_View_ExportButton` matches nothing and the button never triggers the export), (3) set `data-cb-exportbutton` on the DQ container to that CLASS selector `.CodBi_Table_View_ExportButton`, and (4) emit the button as a VALID item with `"className":"XButtonList"` in the root "items" array and add its NAME to the page's `elements` array as a SIBLING of the DQ container so it is not dropped.
CRITICAL — the export button's Formcycle "Aktion" (action) property MUST be "keine Aktion" (no action), NOT "absenden + prüfen" (submit + validate). The action dropdown's MACHINE value is `action.optionId` (the designer renders the human label from it), so `action.page` alone is NOT enough — "keine Aktion" is stored as `"optionId":"no action"` and `"page":""`. Set the export button's action to EXACTLY `{"page":"","check":false,"customAction":"","customClassNames":"","displayName":"","optionId":"no action","value":""}`. If `optionId` is missing or wrong, the designer renders "absenden + prüfen" (submit + validate) and clicking the button submits the form instead of exporting — a FAIL.
- data-cb-centered = (optional) whether the content of the table cells is centered. Defaults to `true`; set to `false`/`0`/`no` to keep the cells left-aligned.
- data-cb-excludecolumns = (optional) a CSV of column names (matched against the column's `label` or `datacolumn`) to EXCLUDE from the Excel-export — those columns stay visible in the table but are omitted from the exported `.xlsx`. E.g. `Nachricht,Wichtige_Hinweise`. Use this to honor "Details nicht exportieren" / "do not export Details".
CRITICAL — LANGUAGE-AGNOSTIC EXCLUDE-COLUMNS MAPPING (do NOT ask a clarifying question, map DIRECTLY): whenever the user restricts which columns the EXCEL EXPORT may contain — even while the table still shows ALL of them — set `data-cb-excludecolumns` to a CSV of the EXCLUDED columns. It is triggered by ANY language phrasing meaning "without / except / not these columns / keep them out of the Excel / do not export them", e.g. German "ohne die Spalten <A> und <G>", "ausgenommen von der Auswertung", "die Spalten <A> und <G> nicht exportieren", "nicht in der Excel", "ohne <A> und <G> im Export", English "without the columns <A> and <G>", "excluding <A> and <G> from the export", "do not export <A> and <G>", "keep <A> and <G> out of the Excel". Match the excluded column names to the column's `label` or `datacolumn` (case-insensitive, trimmed) — the exact names may differ slightly from the user's wording (e.g. user "aplha"→column "alpha", user "gamma"→column "gamma"); pick the closest listed column for each excluded name. The excluded names ONLY go into `data-cb-excludecolumns` — they are NEVER removed from `data-cb-columns` (the columns stay visible in the on-screen table; only the EXPORT omits them). Worked example — the user says "Füge eine Tabelle hinzu die den Inhalt der Altstadtfest Abfrage zeigt. Die Tabelle soll als Excel exportiert werden können aber ohne die Spalten aplha und gamma." → the DQ container carries the FULL export attribute set (func, dataquery, columns listing ALL columns incl. alpha and gamma, filename, sheetname, exportbutton) PLUS `{"text":"data-cb-excludecolumns","value":"alpha,gamma"}`. ALWAYS emit `data-cb-excludecolumns` together with the other export attributes on the SAME container — never into the clarification and never alone.
CRITICAL — DQ.Table.View is configured ONLY via the SEPARATE data-cb-* attributes above (data-cb-dataquery, data-cb-columns, data-cb-exportbutton, data-cb-excludecolumns, data-cb-centered, data-cb-filename, data-cb-sheetname, data-cb-css, data-cb-urlparttoreplace, data-cb-urlpartreplacement) on the container element. NEVER invent a combined single value like data-cb-Data="HolaQuery;columns=...;export=excel;detailsAsJson=true;excludeExportDetails=true" — that combined form is the Sys.Log.Console pattern and does NOT configure the table. Apply the functionality to an XContainer/XContainerInvisible (never an XSpan/XText) and request its details before emitting it.
CRITICAL — the element that CARRIES DQ.Table.View is ALWAYS a real Formcycle CONTAINER: `"className":"XContainer"` (or `"XContainerInvisible"`), with its `elements` array (empty is fine — the table is injected at runtime). This functionality is ONLY supported on those two classes. NEVER use a table widget name (`XTable`, `XDataTable`, `XHtmlTable`), the FUNCTIONALITY ID itself (`"className":"DQ.Table.View"`), or any other class such as `XSpan`/`XText` — the item is unrenderable or the functionality silently does nothing, so the requested table never appears. Equally: the DataQuery name ALWAYS goes into the `data-cb-dataquery` ATTRIBUTE (never into a `datasource` property — `datasource` is the XSelect's datasource property and configures nothing for DQ.Table.View). So for "Füge eine Tabelle hinzu die den Inhalt der Abfrage X zeigt." emit ONE new `XContainer` appended to the first page, with `data-cb-func="DQ.Table.View"`, `data-cb-dataquery="X"` and `data-cb-columns="..."`.
CRITICAL — the DQ container MUST always carry `data-cb-func="DQ.Table.View"` AND `data-cb-dataquery` (the runtime renders NOTHING without the query). `data-cb-columns` has TWO legal states: (1) a NON-EMPTY CSV when the per-column facts are known, and (2) the FULLY EMPTY `data-cb-columns=""` when the user skips the column definition (see the SKIP rule below) — the runtime then renders an EMPTY table (no columns) instead of throwing, and the user fills in the CSV later in the function's CSV editor. NEVER emit a column entry without its `datacolumn` (that partial form still throws) and NEVER omit `data-cb-dataquery`. The query name comes from the request (or from the matching "AVAILABLE FORMCYCLE DATASOURCES" entry, chosen by meaning). When the request names no columns, the CLARIFICATION round collects them — BUT it MUST first offer the SKIP path: the clarification explicitly tells the user they need NOT type a CSV syntax now and may simply leave the answer EMPTY — they can define the columns later, comfortably, in the DQ.Table.View CSV editor of the finished form. When the user answers with per-column facts, use those answers for EVERY column: header LABEL → first CSV entry, QUERY COLUMN (`datacolumn`) → second, JSON yes/no → third (`true`/`false`), optional WIDTH → fourth; e.g. answers `Alter | Alter | nein | –`, `Name | Nachname | nein | 20`, `Details | Details | ja | –` → `data-cb-columns="Alter;Alter;false,Nachname;Name;false;20,Details;Details;true"`. Only a fact the user explicitly left blank falls back to its default (label = the query column, JSON = false, width = none). When the user gives an EMPTY/blank answer (just hits "answer"), STILL EMIT the table container with `data-cb-columns=""` — the table shall be generated but empty.

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

Example with an Excel export — the user asks the table to be exportable to Excel ("Die Tabelle soll in Excel exportiert werden können."): create a DEDICATED export XButtonList as a SIBLING of the DQ container, point data-cb-exportbutton at its CLASS selector (NEVER a boolean like `true`/`1` and NEVER an `#id` selector — the id resolves to the wrapper, not the `<button>`), give the button NO action (not a send button), and derive sensible filename/sheetname from the query name. The COMPLETE result is THREE things emitted together: (a) the DQ container carrying ALL SIX attributes (func, dataquery, columns, filename, sheetname, exportbutton); (b) a SEPARATE top-level item `{"className":"XButtonList", ...}` in the root "items" array whose button's class goes into `cssclasses` (NEVER `classNames`) and whose action is the no-action object; (c) BOTH item names listed in the page's `elements` array (`"elements":["coAltstadtTable","btnExport"]`).

PLACEMENT RULE: the export XButtonList is a SEPARATE item in the root "items" array, referenced by NAME from the PAGE's (or a wrapper's) `elements` array as a SIBLING of the DQ container (e.g. `"elements":["coAltstadtTable","btnExport"]`). It must NEVER be added to the DQ container's OWN `elements` array — the DQ.Table.View container keeps `elements":[]` because the table (and any children) is injected at runtime, and a button inside that container would render inside/duplicated in the table:

The DQ container (children array stays EMPTY):
{
 "className":"XContainer","properties":{"name":"coAltstadtTable","id":"xi-co-altstadt-table","elements":[]},
 "attributes":[
   {"text":"data-cb-func","value":"DQ.Table.View"},
   {"text":"data-cb-dataquery","value":"INHALT.Altstadtfest_2027"},
   {"text":"data-cb-columns","value":"Vorname;Vorname,Nachname;Nachname,Email;Email"},
   {"text":"data-cb-filename","value":"Altstadtfest_2027"},
   {"text":"data-cb-sheetname","value":"Altstadtfest_2027"},
   {"text":"data-cb-exportbutton","value":".CodBi_Table_View_ExportButton"}
 ]
}
plus this SEPARATE sibling item in the root "items" array (the export button the class selector above points to), listed in the PAGE's elements next to the DQ container; the button has NO action (NOT a send/submit):
{"className":"XButtonList","properties":{"name":"btnExport","id":"xi-btExportAltstadtfest","cssclasses":["CodBi_Table_View_ExportButton"]},"buttons":[{"name":"export","value":"Export Excel","action":{"page":"","check":false,"customAction":"","customClassNames":"","displayName":"","optionId":"no action","value":""}}]}
CRITICAL — THIS BUTTON'S LABEL AND ACTION ARE FIXED, EMIT THEM EXACTLY AS SHOWN (copy this button object VERBATIM):
- LABEL — IT MUST LIVE IN THE `value` PROPERTY (`"value":"Export Excel"`): Formcycle renders `buttons[].value` as the button's visible text. `title` is a separate optional TOOLTIP and NEVER holds the button label. A button emitted as `{"name":"exportExcel","title":"Export Excel","value":""}` (label in `title`, empty `value`) renders an EMPTY button — a FAIL. So keep `title` OUT of the button (or, if present, let it hold only a short descriptive tooltip) and ALWAYS put the label "Export Excel" in `value`; `value` MUST NEVER be empty. The label is NEVER "Senden"/"Absenden"/"Einreichen"/"Prüfen und Senden" (those are SEND-labels) and NEVER the query name. The export button is NOT a send button.
- ACTION: the `action` MUST be exactly `{"page":"","check":false,"customAction":"","customClassNames":"","displayName":"","optionId":"no action","value":""}` — `optionId` is the machine value; `"no action"` makes the Formcycle designer render "keine Aktion". A button with `page:"submit"` / `optionId:"submit + check"` (or any send) SUBMITS the form instead of exporting — a FAIL. This no-action export button is the ONLY case where the button is NOT a submit; do NOT apply the MANDATORY submit-button rule from formcycle-widgets.md to it (that rule is ONLY for the real Senden/Weiter buttons, NOT for the export button).
CRITICAL — NO WORKFLOW FOR THE EXPORT: DQ.Table.View performs the Excel export COMPLETELY client-side (SheetJS "xlsx" bundled into the form script) the moment the user clicks the export button — it needs NO Formcycle workflow, NO server-side export lane, NO FC_EXPORT_TO_EXCEL/XML/PERSISTENCE node and NO FC_RETURN_FILE download node. NEVER generate a Formcycle workflow/task/delta-operation for this export button: the export button is a pure CLICK-handler, NOT a workflow trigger. (A workflow build pass that sees the export request must respond {"operations":[]}.) Also NEVER re-label or treat the export button as a "Senden"/submit button and NEVER add a separate "Senden" submit button just for the export — the export is the functionality's own job.
REMEMBER — this item must be emitted as a VALID, well-formed JSON item starting exactly with `{ "className": "XButtonList"` (a single `{` — NEVER `{{` / `{"{` or any double-brace prefix, and NEVER a trailing extra brace, which corrupts the JSON and makes the item be DROPPED as an unknown/null className). The root "items" array then contains BOTH this button item AND the DQ container as SEPARATE entries, and the button's NAME appears in the page's `elements` array (never in the DQ container's own `elements`).

Example — EXCLUDE columns from the Excel export while the table shows ALL of them (the user's exact case "aber ohne die Spalten aplha und gamma"): keep `data-cb-columns` listing EVERY column (alpha and gamma stay visible in the on-screen table) and add `data-cb-excludecolumns` with ONLY the excluded names:
{
 "className":"XContainer","properties":{"name":"coAltstadtTable","id":"xi-co-altstadt-table","elements":[]},
 "attributes":[
   {"text":"data-cb-func","value":"DQ.Table.View"},
   {"text":"data-cb-dataquery","value":"INHALT.Altstadtfest_2027"},
   {"text":"data-cb-columns","value":"Alpha;alpha,Beta;beta,Gamma;gamma"},
   {"text":"data-cb-filename","value":"Altstadtfest_2027"},
   {"text":"data-cb-sheetname","value":"Altstadtfest_2027"},
   {"text":"data-cb-exportbutton","value":".CodBi_Table_View_ExportButton"},
   {"text":"data-cb-excludecolumns","value":"alpha,gamma"}
 ]
}

Example — URL-replacement (the user asks the table to use a different URL/endpoint part): add BOTH `data-cb-urlparttoreplace` and `data-cb-urlpartreplacement` together on the DQ container (combined by position):
{"text":"data-cb-urlparttoreplace","value":"production-server"},
{"text":"data-cb-urlpartreplacement","value":"test-server"}

The Excel export uses the SheetJS library (npm package "xlsx") which is bundled into the form script at build time (esbuild) — no runtime loading is needed.

## AI DOCUMENT QA

Use ai.llama.standard.qa (NOT ai.llama.standard.txtqa) WHENEVER the user asks to UPLOAD a document/image/PDF and have the AI ANALYZE ITS CONTENT — e.g. "checke was für eine Rechnung hochgeladen wurde" (determine what kind of invoice was uploaded), "analysiere das hochgeladene Dokument", "beantworte Fragen zum hochgeladenen Bild", "extrahiere Infos aus der hochgeladenen Datei". CRITICAL BOUNDARY: ai.llama.standard.txtqa is ONLY for answering a question from TEXT VALUES the user typed into OTHER input fields — it CANNOT read an uploaded binary file. Whenever the analysis source is an UPLOADED FILE (XUpload), you MUST use ai.llama.standard.qa, NEVER ai.llama.standard.txtqa.

When the user asks to upload a document and answer specific questions about its content, create an XUpload that carries data-cb-func="ai.llama.standard.qa" AND data-cb-Mode="analyse" (or "verify" for a yes/no check) AND data-cb-MaxPixelSize="180000" in its attributes — all three are REQUIRED on the XUpload, never omit any of them. Then create one XTextField (or XTextArea for long answers) per question, each with cssclasses=["AI_LLAMA_STANDARD_QA_Question"] and a data-cb-Question attribute. The answer field's cssclasses MUST be exactly ["AI_LLAMA_STANDARD_QA_Question"] and nothing else — NEVER add any address/OpenPLZ class (CodBi_OpenPLZ_AC_SET_Locality / _PLZ / _Street / _BuildingNumber) or any People class (CodBi_People_*) to it, even when OpenPLZ.AC.SET is enabled in the form; an AI DOCUMENT QA answer field is NOT an address group.

The data-cb-Question value supports <[.FieldName]> placeholders (with leading dot) that resolve to the runtime value of another field in the same container.

The upload field and all question fields should be inside an XContainer or XFieldSet wrapper. CRITICAL: data-cb-func="ai.llama.standard.qa" goes on the XUpload, NOT on the container or on the question fields.

### ANALYSE MODE (default — OPEN questions about the uploaded document answered into a field)

This is the DEFAULT mode: ALWAYS set data-cb-Mode="analyse" explicitly on the XUpload that carries data-cb-func="ai.llama.standard.qa" (never leave it unset/omitted). It answers OPEN, non-yes/no questions about the uploaded document and writes the descriptive answer into the tagged AI_LLAMA_STANDARD_QA_Question field. Use it for "checke/bestimme/beschreibe/analysiere ..." requests that have an OPEN answer (e.g. "was für eine Rechnung" / "what kind of invoice", "welche Summe", "wer ist der Absender") — a YES/NO verdict instead belongs to VERIFY MODE below. When the check must be routed to a NAMED specialist (e.g. "Cerebras soll checken", "mit Cerebras"), add data-cb-Specialist="<the configured specialist name, e.g. Cerebras>" to the SAME XUpload that carries data-cb-func="ai.llama.standard.qa" (see SPECIALIST RULE). data-cb-MaxPixelSize="180000" is also REQUIRED on that same XUpload. The data-cb-Question attribute goes on the AI_LLAMA_STANDARD_QA_Question answer field; when the question is FIXED (the user gave no form field to build it from), put the literal question text there. The answer field carries ONLY cssclasses=["AI_LLAMA_STANDARD_QA_Question"] — no OpenPLZ/address/People classes ever. Example:

```json
{"className":"XUpload","properties":{"name":"uploadRechnung","id":"xi-upload-rechnung","label":"Rechnung hochladen","required":"1"},"attributes":[{"text":"data-cb-func","value":"ai.llama.standard.qa"},{"text":"data-cb-Mode","value":"analyse"},{"text":"data-cb-Specialist","value":"Cerebras"},{"text":"data-cb-MaxPixelSize","value":"180000"}]},
{"className":"XTextArea","properties":{"name":"tfRechnungArt","id":"xi-tf-rechnung-art","label":"Art der Rechnung","required":"0","readonly":"0","fullwidth":"1","cssclasses":["AI_LLAMA_STANDARD_QA_Question"]},"attributes":[{"text":"data-cb-Question","value":"Was für eine Rechnung wurde hier hochgeladen? Beschreibe die Art der Rechnung anhand des Dokuments."}]}
```

### VERIFY MODE (yes/no check of the uploaded document)

When the user asks to CHECK / VERIFY a property of the uploaded document (e.g. "prüfe/checke ob das hochgeladene Bild eine Rechnung ist", "verify whether the upload is an invoice", "kontrolliere ob ..."), put data-cb-Mode="verify" on the SAME XUpload that carries data-cb-func="ai.llama.standard.qa". The uploaded file is then accepted only when the AI answers the verification question with the positive response ("yes"). Add the yes/no check as a data-cb-Question attribute on the XUpload itself. The data-cb-Question MUST end with an explicit instruction that the AI may only answer with "yes" or "no" (e.g. "Ist das hochgeladene Bild eine Rechnung? Antworte nur mit Ja oder Nein." / "Is the uploaded image an invoice? Answer only with yes or no."). No separate AI_LLAMA_STANDARD_QA_Question field is needed for a pure verify check. The attribute is spelled exactly data-cb-Question (capital Q — never data-cb-question, data-cb-QPquestion or any other casing). Verify mode is for a MANDATORY document-type check (invoice, ID card, permit, receipt, passport, certificate, ...). When the check must also be routed to a NAMED specialist (e.g. "mit Cerebras", "von Cerebras prüfen lassen", "checke mit Cerebras"), add data-cb-Specialist="<the configured specialist name, e.g. Cerebras>" to the same XUpload as well (see SPECIALIST RULE). Example:

```json
{"className":"XUpload","properties":{"name":"uploadRechnung","id":"xi-upload-rechnung","label":"Rechnung hochladen","required":"1"},"attributes":[{"text":"data-cb-func","value":"ai.llama.standard.qa"},{"text":"data-cb-Mode","value":"verify"},{"text":"data-cb-Question","value":"Ist das hochgeladene Bild eine Rechnung? Antworte nur mit Ja oder Nein."},{"text":"data-cb-Specialist","value":"Cerebras"},{"text":"data-cb-MaxPixelSize","value":"180000"}]}
```

## AI TEXT QA (ai.llama.standard.txtqa)

CRITICAL BOUNDARY — ai.llama.standard.txtqa is ONLY for questions answered from TEXT VALUES the user typed into INPUT FIELDS, NEVER for analyzing an UPLOADED FILE. If the analysis source is an XUpload (a document/image/PDF is uploaded and inspected), use ai.llama.standard.qa (AI DOCUMENT QA) instead — see that section. Do NOT put data-cb-func="ai.llama.standard.txtqa" on an XUpload.

CRITICAL — THIS IS THE SIMPLE SINGLE-ANSWER Q&A FUNCTIONALITY (NOT the AI.LLAMA.CHAT chat widget). USE ai.llama.standard.txtqa whenever the user asks to create an input/form field whose (single, fixed) question is answered by the AI INSIDE that field — e.g. "Erstelle ein Eingabefeld welches die Frage wie das Wetter heute wird von Cerebras beantworten lässt" (a field that lets the AI answer a question), "Add a field that lets Cerebras answer the user's question", "ein Feld, in dem eine KI eine Frage beantwortet". A request that says a field's question should be "beantworten lassen" / "answered by the AI" / "lässt die Frage beantworten" is ALWAYS simple Q&A via ai.llama.standard.txtqa — NEVER the full chat container. Only a genuine multi-turn chat window qualifies for AI.LLAMA.CHAT.

CRITICAL — "beantworten lassen" does NOT automatically mean txtqa — decide by OUTCOME, not wording (language-agnostic). txtqa only when the expected result is OPEN generated content written into a field (a description/free answer with no definite known value). When the request is actually a CHECK of already-known criteria with a pass/fail verdict — e.g. "mit Cerebras bestimmt werden ob die Summe der beiden Zahlen 9 ergibt" ("...determine whether the sum of the two numbers is 9"), "prüfe ob ...", "verify whether ...", "ob ... zutrifft", "validiere ob ..." — that is a VERIFICATION with a known target and MUST use ai.llama.standard.txtverify (see the "AI TEXT VERIFY (ai.llama.standard.txtverify)" section below), which validates the field value and shows the verdict as a field error rather than writing a free-text answer into a field. Never use txtqa for a yes/no "is it ... / ob ..." check.

When the question answered is a FIXED single question (e.g. "Wie wird das Wetter heute/übermorgen?" / "What's the weather?" / "how is the weather today"), build ONE simple paired structure (inside an XContainer wrapper): one XTextField/XTextArea source input carrying data-cb-func="ai.llama.standard.txtqa" and the fixed question in its data-cb-Question attribute, plus a response display XTextArea with cssclasses=["AI_LLAMA_STANDARD_TXTQA_Question"]. Because the question is fixed (not built from user-typed values), data-cb-Question holds the literal question text with a <[.FieldName]> placeholder only for the source field(s) that feed it. Add data-cb-useinternet="true" if internet search is needed (e.g. a live weather question). When a specialist model is named (e.g. "von Cerebras beantworten lassen" / "let Cerebras answer"), ALSO add data-cb-Specialist="<the configured specialist name, e.g. Cerebras>" to the same element (see SPECIALIST RULE below). Example element for the weather question answered by the specialist:

```json
{"className":"XTextField","properties":{"name":"tfWetterKI","id":"xi-tf-wetter-ki","label":"Wie wird das Wetter heute?","required":"0","fullwidth":"1"},"attributes":[{"text":"data-cb-func","value":"ai.llama.standard.txtqa"},{"text":"data-cb-Question","value":"Wie wird das Wetter heute?"},{"text":"data-cb-useinternet","value":"true"},{"text":"data-cb-Specialist","value":"Cerebras"}]}
```

When the user instead asks to show information about a person or entity based on text values typed into OTHER input fields, apply data-cb-func="ai.llama.standard.txtqa" on the FIRST source input field. Add data-cb-useinternet="true" if internet search is needed. All other source fields get cssclasses=["AI_LLAMA_TXTQA_Source"]. The response display field gets cssclasses=["AI_LLAMA_STANDARD_TXTQA_Question"] and a data-cb-Question attribute.

The data-cb-Question value MUST include <[.FieldName]> placeholders (with leading dot) for ALL source fields.

CRITICAL — The field with data-cb-func="ai.llama.standard.txtqa" must NOT have the AI_LLAMA_STANDARD_TXTQA_Question CSS class.

ALL form elements created for this functionality MUST be inside an XContainer or XFieldSet wrapper.

## AI TEXT VERIFY (ai.llama.standard.txtverify)

**TXTQA vs TXTVERIFY — THE DECISION (language-agnostic, not just German/English):** Choose the functionality by the *kind of outcome the user expects*, not by surface wording:
- **ai.llama.standard.txtqa = GENERATE an answer** (OPEN result, no definite value known in advance). The outcome IS a free-text answer that gets written INTO a field. The user asks to "answer / beantworten / generar una respuesta / répondre / rispondere", "show info about", "how is the weather", "what kind of ...", "was für eine Rechnung", "beschreibe/describe". The expected result is underlying text that does not pre-exist.
- **ai.llama.standard.txtverify = CHECK / VERIFY / VALIDATE a VALUE against a criterion** (binary verdict: valid or invalid; the expected positive outcome is already known). The outcome is a yes/no (pass/fail) verdict shown as a field ERROR — NOT a free text answer written into a field. The user asks to "prüfe ob / check whether / verify whether / validiere ob / validate / ensure that / comprobar que / verificare che / kontrolliere ob", i.e. a test with a KNOWN target. Examples: "ob die Summe der beiden Zahlen 9 ergibt" (whether the sum equals 9), "ob die Eingabe eine gültige E-Mail ist" (whether the input is a valid e-mail), "ob die PLZ zur Stadt passt" (whether the ZIP matches the city).

RULE OF THUMB: if the expected result is a pass/fail verdict on already-typed input ("... ist es? / is it ...? / ob ... zutrifft / does it hold that ..."), it is **txtverify**. If the expected result is generated descriptive content written back into a field ("... was ist ...? / what is ...? / beantworte ..."), it is **txtqa**. A verification NEVER writes free text into the verified field — it only clears or sets that field's error.

**What the functionality does:** ai.llama.standard.txtverify applies on a SINGLE text input/textarea (XTextField / XTextArea) and VERIFIES its value with the AI **when the user leaves the field (blur)**. The field is never disabled; form submission is blocked while the check runs. The field stays invalid (showing the AI's human-readable explanation as its error, e.g. a field that holds restaurant names stays invalid unless the AI confirms the name is a real activity) unless the AI answers with the **PositiveResponse** word.

**Where it goes:** `data-cb-func="ai.llama.standard.txtverify"` is put ON the single field whose value is being verified (that field's own value). Put the verification question in that field's `data-cb-Question` attribute (or leave it there explicitly). This is a SINGLE-field functionality — do NOT create separate "source" fields or separate "answer" fields; unlike txtqa there is no AI_LLAMA_*_Question display field and no AI_LLAMA_*_Source tag. When the check must be routed to a NAMED specialist (e.g. "mit Cerebras", "von Cerebras prüfen lassen", "Cerebras soll bestimmen ob ..."), add `data-cb-Specialist="<configured specialist name, e.g. Cerebras>"` to the SAME field (see SPECIALIST RULE).

**data-cb-Question — the AI MUST invent it itself (language-agnostic, in the request's language):** The AI must formulate the verification question from the user's criterion and write it as the `data-cb-Question` attribute on the verified field. Use placeholders:
- `<[this]>` — resolves to the verified field's own value (use when the check is about the field's own content). Example: `data-cb-Question="Prüfe ob '<[this]>' eine gültige E-Mail-Adresse ist."`
- `<[FieldName]>` — the target field's `properties.name` (e.g. `<[tfZahl1]>`, NEVER an id selector, NEVER a leading dot — txtverify prepends the dot itself) resolving to the runtime value of another field in the same container — use when the check compares/computes from OTHER fields' values. (NOTE the difference from txtqa, whose data-cb-Question placeholders DO need the leading dot `<[.FieldName]>`.)
Example for the "sum is 9" case (two number fields `tfZahl1`, `tfZahl2`; the functionality goes on `tfZahl2` — the last field the user edits): `data-cb-Question="Prüfe ob die Summe von '<[tfZahl1]>' und '<[this]>' genau 9 ergibt."` (or, language-agnostically, in whatever language the user wrote the request). Do NOT append reply-format instructions ("reply only with yes/no") — txtverify appends them automatically.

**data-cb-PositiveResponse — the AI MUST invent it itself when needed (default `"yes"`):** This is the single word (case-insensitive comparison by default) the AI must reply with to signal the value is valid. The AI MUST decide it when configuring txtverify:
- If the user's criterion is phrased as agreeing with a positive marker (e.g. "soll bestätigt werden", generic "prüfe ob", the target is a clear yes), you may rely on the default `"yes"` and do NOT set data-cb-PositiveResponse — OR set it explicitly to `"yes"` for clarity.
- If the request implies a specific positive word in the request's own language (e.g. "ob die Summe ... richtig/korrekt/ok ist", "valid", "true", "ok"), set `data-cb-PositiveResponse` to the natural positive word of that language (e.g. `"korrekt"`, `"ok"`, `"valid"`, `"válido"`, `"vrai"`, `"corretto"`). The reply is matched against this word, so it MUST match the language the AI will actually answer in.
- Do NOT invent a PositiveResponse that clashes with what the AI would naturally return. It is the AI's job (the assistant generating the form) to make up both `data-cb-Question` AND `data-cb-PositiveResponse` coherently for the exact check the user asked for.

**Other useful OPTIONAL attributes (data-cb-* as in the functionality parameters):**
- `data-cb-CaseInsensitive`="false" — only when an exact (case-sensitive) match of the positive response is required; default is case-insensitive (omit normally).
- `data-cb-VerifyErrorText`="<fallback text>" — fallback error message shown only if the AI returns an EMPTY answer (optional).
- `data-cb-VerifyCheckboxLabel`="<label>" — label of the manual-override checkbox shown on failure (optional).
- `data-cb-Language`="<full language name e.g. German/Deutsch>" — appended as "Answer in {Language}." so the AI answers AND picks the positive word in that language.
- `data-cb-ResponseLanguage`="<de/en/fr/it...>" — two-letter ISO 639-1 code to force the AI's response language.
- `data-cb-InternetAccess`="true" — enable Brave Search (only if the check might need up-to-date web data; rarely needed for arithmetic/format checks).
- `data-cb-Thinking`="true" — enable thinking mode for harder checks.

**Example — "two number fields, check with Cerebras whether their sum is 9":** Because txtverify triggers on the tagged field's **blur**, put `data-cb-func="ai.llama.standard.txtverify"` (+ data-cb-Question + data-cb-PositiveResponse + data-cb-Specialist) on the LAST field the user edits — here `tfZahl2`. The question references the sibling via `<[tfZahl1]>` and the tagged field's own value via `<[this]>`. The verdict (valid/invalid + explanation) is attached as an ERROR on `tfZahl2`; txtverify does NOT write a value into a separate display field. ALL elements live inside an XContainer/XFieldSet wrapper.

```json
{"className":"XTextField","properties":{"name":"tfZahl1","id":"xi-tf-zahl1","label":"Zahl 1","required":"1","datatype":"integer"},"attributes":[]},
{"className":"XTextField","properties":{"name":"tfZahl2","id":"xi-tf-zahl2","label":"Zahl 2","required":"1","datatype":"integer"},"attributes":[{"text":"data-cb-func","value":"ai.llama.standard.txtverify"},{"text":"data-cb-Question","value":"Prüfe ob die Summe von '<[tfZahl1]>' und '<[this]>' genau 9 ergibt."},{"text":"data-cb-PositiveResponse","value":"korrekt"},{"text":"data-cb-Specialist","value":"Cerebras"}]}
```
The tagged field carries ONLY data-cb-func + data-cb-Question + data-cb-PositiveResponse (+ data-cb-Specialist when a specialist is named). Do NOT put txtverify on a readonly display field — a readonly field never fires blur, so the check would never run; txtverify validates one editable field and shows the verdict as its error. There is NO separate answer field and NO AI_LLAMA_*_Source / AI_LLAMA_*_Question CSS class.

## SPECIALIST RULE

Add a data-cb-Specialist attribute to an AI functionality's element ONLY when the prompt names or implies a specific specialist model (e.g. "Verwende den Spezialisten XYZ" / "use the XYZ specialist" / "let Cerebras answer") — set its value to the configured specialist name that sensibly matches. It is NOT stamped unconditionally just because this build runs through a specialist; when the prompt does not name a specialist, do not add the attribute.

The only VALID values for data-cb-Specialist are the configured specialist names listed in the "CONFIGURED AI SPECIALISTS" block of this system prompt. NEVER invent or emit a specialist name that is not in that list. If the configured list is missing, do NOT guess — leave data-cb-Specialist unset (the request then routes to the default/main model).

When NO configured specialist sensibly matches the user's request, ask in the separate clarification round which specialist to use, offering ONLY the configured names plus "none" (none = use the default/main model). If there is no default/main model, tell the user that choosing "none" means the AI functionality cannot run.

The complete list of available functionalities with all their parameters is available at:
{{CODBI_FULL_SECTION}}
