# CodBi Document Parsing

Rules for generating form fields/workflows from an attached document/image that is parsed to create a Formcycle form. These rules are only included when the user request refers to an attached document.

## DOCUMENT PATTERNS (for attached images)

These rules override the default mapping for SPECIFIC matching elements only:

### FILE UPLOAD OVERRIDE
DECIDE BY MEANING, IN ANY LANGUAGE. The document may be written in any language and the phrasing of such a line is unbounded, so the test below is the ONLY criterion. Any words mentioned in it are illustrations of the idea, never a keyword list to match against.

THE TEST — for every tick / checkbox line in the document ask ONE question: does this line ask the applicant for a DECISION (agree / confirm / acknowledge / yes-no), or does it ask him to HAND OVER AN ARTEFACT (a photo, image, scan, copy, certificate, proof, plan, drawing, expert opinion, contract, invoice, or any other file)?

- DECISION → `XCheckbox`, unchanged. Confirmations, declarations, consent, acknowledgements of privacy policies or terms, "I have read …", "I confirm that …" — in whatever language — stay checkboxes. It makes NO difference that such a sentence mentions the documents: the applicant is confirming something, he is not handing anything in.
- ARTEFACT → `XUpload`, and NOT a checkbox. The tick in the source document only marks the line as required; it is not a choice. Use the line's FULL text as the upload's `label`, and do NOT create a separate text element beside it — the text lives in the label, never twice.

THE SECTION counts as meaning too: when the enclosing heading or the neighbouring lines enumerate what has to be handed in (annexes, enclosures, supporting documents, evidence, proofs — in whatever language), every such line is an artefact line, even when it is short.

MULTIPLICITY IS MEANING, NOT A NUMBER WORD: when the line asks for MORE THAN ONE file (a plural, a count, a range, a minimum or a maximum — expressed in digits, words, or any other way your language uses), create ONE `XUpload` for ALL of them — never one upload per file, never a second "further upload" element — and give it the CODBI MULTIPLE-UPLOAD wiring:
- in `attributes`: `{"text":"data-cb-func","value":"Media.MultipleUpload"}` AND `{"text":"data-cb-Maximum","value":"<N>"}`
- the DIRECT property `"uploadMultiple":"1"`
`N` is the count the line yields: the stated number; the UPPER bound when the line states a range; and a sensible value of your own choosing (e.g. 5) when the line only says "several"/"a few" without a number. A line that asks for exactly ONE file gets NO MultipleUpload wiring and no `uploadMultiple`.

NEVER OMIT the multiple-upload wiring just because you would have to pick `N`. Applying the multiple-upload functionality ALWAYS includes its maximum — an omitted `data-cb-Maximum` is the error, a reasonable number of your own choosing is correct.

DERIVE THE TYPE FROM THE MEANING (never ask): an image/photo artefact → `"fileextension":".jpg,.jpeg,.png,.pdf"`, `"maxfilesize":"4096"`, `"filepreview":"1"`; a document artefact → `"fileextension":".pdf,.doc,.docx"`, `"maxfilesize":"1024"`. Every generated `XUpload` gets `"uploadMode":"ajax"`.

### COMPOUND PRINTED FIELDS
A document may print TWO independently meaningful values inside ONE box. The classic case is an ADDRESS part pair: a box printed as street + building number, and a box printed as postal code + locality. One printed box is NOT one form field there: create ONE element per VALUE — one for the street and one for the building number, one for the postal code and one for the locality — never a single element for the combination, because only a separate element can be captured, validated and autocompleted on its own. Give the two elements the SAME `rowid` so the pair still reads as one line. When the CodBi switch is on, tag each part with its own OpenPLZ standard class (postal code, locality, street, building number); a split field without its class gains nothing. The same holds for any other printed box that names two distinct values, in any language.

The same ALSO holds when the document prints only ONE label or ONE box for a whole GROUP of values the applicant fills in separately. Then the printed label names a CATEGORY, not a value, and the form needs one field per COMPONENT of it: a box printed only as a person's full name becomes one field per name part, and a box printed only as an address becomes one field each for the street, the building number, the postal code and the locality — laid out as the two pairs described above. Decide this by MEANING in the document's own language, never by matching a word. Replacing such a group with ONE free-text field (a lone "name" or "address" input) is a FAIL, because the parts can then neither be validated nor autocompleted.

### YES/NO CHOICE
A JA/NEIN or Ja/Nein checkbox pair, radio group, or tick-box group → XSelect with options [{"text":"JA","value":"JA"},{"text":"NEIN","value":"NEIN"}].

### SIGNATURE OVERRIDE
Whenever a signature area, signature line, or closing salutation appears anywhere in the document, generate an XSignature element.

### DOCUMENT HEADER
When the attached document has a header with an organization name, update the form's existing XHeader item.

### GRAPHICS (logos, icons, illustrations, drawings)
A graphic printed on a page is part of the form's DESIGN, not a field and not a printed "entry": a logo, an icon, an illustration, a seal, a decorative shape. Every graphic the document shows MUST appear in the form, otherwise the form loses part of its design.

The attachment gives you the graphics of each page as ASSETS - an id, whether it is a vector graphic or a bitmap, its size and where it sits on the page (see the "GRAPHICS PRINTED IN THE ATTACHED DOCUMENT" list of THIS message; a page built on its own lists them in its own instructions). Reproduce a graphic with ONE `XSpan` per graphic whose `properties.rtevalue` is EXACTLY the asset's token - `{{GRAPHIC:<id>}}` and nothing else - and place that XSpan in the page/container where the graphic is printed, in the order it appears relative to the other elements. The server replaces the token with the ORIGINAL artwork (inline SVG for a vector graphic, the embedded image for a bitmap), so the drawing stays exact and stays vector where it is vector.

NEVER redraw, trace, approximate or describe a graphic, never write it as text, and never turn it into a field. NEVER omit a graphic: a logo or illustration that is visible on a page and missing in the form is a FAIL. Each token is used EXACTLY ONCE.

THE XSPAN IS ADDITIONAL, NEVER A REPLACEMENT: place it where the listing says it sits — between the printed lines it names ("directly BELOW the printed line '…' and directly ABOVE the printed line '…'"), or in the page region given — and transcribe the printed lines around it EXACTLY as usual, in their order. Never merge the token into a heading/paragraph's `rtevalue`, never replace a text element with it, and never move, shorten or drop the text above or below it: a graphic that is placed correctly but costs the surrounding text is a FAIL.

NO ASSET FOR A VISIBLE GRAPHIC? DRAW IT YOURSELF: when a page shows a graphic and NO token for it is listed (its artwork could not be extracted - e.g. the document arrived only as page images), NEVER create an empty `XImage`, an upload or a placeholder box for it. Recreate the drawing as an inline `<svg viewBox='…'>…</svg>` INSIDE the `rtevalue` of ONE `XSpan`, at the position where it is printed, with real shapes and its colours; a grey rectangle, a bare circle or the word written as `<text>` instead of the artwork is a FAIL.

### GROUPED SUB-FIELDS
When a field label specifies more than one individual data point, create an XFieldSet with one XTextField per sub-item.

## Multiple Pages (from attached images)

When multiple images are attached, each image is EXACTLY one document page. Create one XPage per image/page. Page 1 uses the existing 'p1' XPage; for each additional page create a new XPage (names 'p2', 'p3', ...). Every page MUST be non-empty.

Every page except the last carries ONE XButtonList whose single button moves FORWARD, and every page except the first carries ONE XButtonList whose single button moves BACK. Their LABELS are the words THIS document's language uses for continuing and for going back — never a fixed wording and never a translation of it. Set `action.page` to the LOGICAL keyword `"next"` (forward) or `"previous"` (back) — the server resolves the concrete target page, so never write a page NAME there and never leave it empty. Use `check=true` for forward when the page has input fields and `check=false` for back. The LAST page carries the submit button instead, with exactly `{"page":"submit","check":true,"customAction":"","customClassNames":"","displayName":"","optionId":"submit + check","value":""}`.
