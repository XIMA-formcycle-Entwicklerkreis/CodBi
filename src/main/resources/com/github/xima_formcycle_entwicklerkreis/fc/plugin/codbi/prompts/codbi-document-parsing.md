# CodBi Document Parsing

Rules for generating form fields/workflows from an attached document/image that is parsed to create a Formcycle form. These rules are only included when the user request refers to an attached document.

## DOCUMENT PATTERNS (for attached images)

These rules override the default mapping for SPECIFIC matching elements only:

### FILE UPLOAD OVERRIDE
When a checkbox label explicitly states that a specific named file or document IS being physically attached or WILL be uploaded as a file attachment, do NOT generate an XCheckbox. Instead generate an XUpload field.

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

On all non-final pages add a 'Weiter' XButtonList. On all non-first pages add a 'Zurück' XButtonList. Put the final 'Absenden' submit button on the last page.
