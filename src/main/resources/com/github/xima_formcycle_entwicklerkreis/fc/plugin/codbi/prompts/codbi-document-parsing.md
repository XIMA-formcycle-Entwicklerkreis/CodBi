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

### YES/NO CHOICE
A JA/NEIN or Ja/Nein checkbox pair, radio group, or tick-box group → XSelect with options [{"text":"JA","value":"JA"},{"text":"NEIN","value":"NEIN"}].

### SIGNATURE OVERRIDE
Whenever a signature area, signature line, or closing salutation appears anywhere in the document, generate an XSignature element.

### DOCUMENT HEADER
When the attached document has a header with an organization name, update the form's existing XHeader item.

### GROUPED SUB-FIELDS
When a field label specifies more than one individual data point, create an XFieldSet with one XTextField per sub-item.

## Multiple Pages (from attached images)

When multiple images are attached, each image is EXACTLY one document page. Create one XPage per image/page. Page 1 uses the existing 'p1' XPage; for each additional page create a new XPage (names 'p2', 'p3', ...). Every page MUST be non-empty.

Every page except the last carries ONE XButtonList whose single button moves FORWARD, and every page except the first carries ONE XButtonList whose single button moves BACK. Their LABELS are the words THIS document's language uses for continuing and for going back — never a fixed wording and never a translation of it. Set `action.page` to the LOGICAL keyword `"next"` (forward) or `"previous"` (back) — the server resolves the concrete target page, so never write a page NAME there and never leave it empty. Use `check=true` for forward when the page has input fields and `check=false` for back. The LAST page carries the submit button instead, with exactly `{"page":"submit","check":true,"customAction":"","customClassNames":"","displayName":"","optionId":"submit + check","value":""}`.
