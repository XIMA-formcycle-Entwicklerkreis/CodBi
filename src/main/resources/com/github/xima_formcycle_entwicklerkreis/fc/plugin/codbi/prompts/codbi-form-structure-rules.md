MANDATORY STANDARD CLASSES ON PERSON FIELDS (the People standard is active in the shared form — ALWAYS apply):
- Vorname/Nachname/first-name/last-name/name field → cssclasses=["CodBi_People_Name"]; a first name AND a last name EACH get their own class. A user-requested class (e.g. "hallo") may coexist — the "one class" rule never blocks adding CodBi_People_Name.
- E-Mail/email field → cssclasses=["CodBi_People_Mail"].
- German PLZ/postal-code field → cssclasses=["CodBi_People_PLZ"].
- Telefon/phone field → cssclasses=["CodBi_People_Phone"].
A person field WITHOUT its CodBi_People_* class is a FAIL.

WIDGET STRUCTURE RULES:
- Only the widget classNames listed in the Formcycle widget reference below are valid (they all start with 'X', e.g. XButtonList, XTextField, XSelect, XPage). NEVER invent a className — there is NO standalone 'BUTTON' widget class.
- Buttons (submit, back, next) are NOT standalone widgets: define each button as an entry inside an XButtonList item's 'buttons' array (name, title, value, action). A workflow submit trigger (FC_FORM_SUBMIT_BUTTON) references that button by its 'name'.
- Every created widget MUST have a unique 'id' (e.g. 'xi-...') and a className from the reference list.
- There is NO 'row' className — never use 'xm-form-row' (or any similar name) as a className. To place fields side by side in one row, give them the same 'rowid' property (see ROW PAIRING RULES).

ROW PAIRING RULES (fields that belong on the SAME row):
Some fields describe one logical value together and must appear SIDE BY SIDE in the SAME row of the form (not stacked one per line, not wrapped in a nested container). Identify these pairs by what they mean, in ANY language:
- A person's GIVEN/FIRST name + FAMILY/LAST name (e.g. Max + Mustermann).
- A STREET/ROAD name + HOUSE/BUILDING number (e.g. Main Street + 12).
- A POSTAL CODE + LOCALITY/CITY (e.g. 12345 + Berlin).
HOW Formcycle renders a row (there is NO 'row' widget/className — 'xm-form-row' is only the CSS class the renderer adds automatically, never a className you should write):
- Keep the two fields as DIRECT SIBLINGS inside the same parent container (e.g. in the XPage/container's 'elements' array) — do NOT wrap them in an extra XContainer/XFieldSet.
- Give BOTH fields the SAME string value for the 'rowid' property in their 'properties' object (e.g. "rowid": "row-1"). Formcycle renders all sibling fields with an identical 'rowid' next to each other in one row.
- Use a DIFFERENT 'rowid' value for each separate row ("row-1", "row-2", ...) so every pair stays on its own line; omit 'rowid' (or leave it empty) for fields that should span the full width on their own line.
- Size the two fields sensibly so they share the line (e.g. roughly half the row width each).

GROUP RELATED FIELDS INTO CONTAINERS (person / address / contact data):
Group logically-related fields into ONE dedicated XContainer (or XFieldSet when a legend/title fits) per group — do NOT place them flat on the page:
- NAME / person-data fields (first/given name, last/family name, middle name) → one container (this is also the LDAP/autofill person-data group when one is requested).
- ADDRESS fields (street, house/building number, postal code/PLZ, locality/city) → one address container (the OpenPLZ autocomplete set lives here).
- CONTACT fields (e-mail, phone/telephone) → one contact container.
Inside each container the fields are DIRECT SIBLINGS and the ROW PAIRING RULES still apply (first+last name one row; street+house number one row; PLZ+city one row — same rowid per pair). Do NOT wrap a single row pair in its own extra container — the grouping container is the parent of all fields of that group. Add each group container to its page's/container's 'elements' array and every field inside to the group container's 'elements' array (with the matching parentid); a field that is not referenced by any container's 'elements' array is orphaned and does NOT render.

COMPLETE FORM RULES (build the ENTIRE requested form):
A request (email, list, description, mail thread, ...) can contain MANY fields. Create EVERY field the user asked for in ONE output — never create only the most recent / most emphasized / clarified subset and never drop fields mentioned earlier.
- "Make this group repeatable" (e.g. "+ to add more", "the answer fields can be duplicated") applies ONLY to that one group — all OTHER requested fields must still be created.
- Map each requested input to the matching widget: single-line text → XTextField, multi-line text → XTextArea, yes/no or a choice → XCheckbox / XSelect (see CONTROL TYPES), etc.
- A given/family name pair ("Name, Vorname") → two XTextFields on the SAME row (same 'rowid', see ROW PAIRING RULES).
- Add every created field to its page's/container's 'elements' array so it actually appears on the form.
- When in doubt, CREATE the field — a missing requested field is a failed request.

PANEL FOLDING RULES (start folded/collapsed — "zugeklappt", "eingeklappt", "anfangs zugeklappt", "collapsed by default"):
- CodBi panels (UI.Panels classes / accordion members) default to UNFOLDED. To make panels START FOLDED, set the form-level GLOBAL VARIABLE HTML_PANEL_FOLDED to true (top-level 'variables' array: {"name":"HTML_PANEL_FOLDED","aliasname":"HTML_PANEL_FOLDED","serveronly":false,"value":"true"}) — ALL panels then start folded.
- Set data-cb-folded="false" on EVERY panel that must stay OPEN at the start (e.g. the FIRST panel) — the per-element attribute overrides the global default. The other panels get NO data-cb-folded and start folded via the global.
- NEVER set the XFieldSet "collapsed" property — it is not a real Formcycle property, it is ignored, and it never folds a CodBi panel. The correct mechanism is data-cb-folded + the HTML_PANEL_FOLDED global.
- Example — "Alle Panels, bis auf das Erste, sollen anfang zugeklappt sein.": the top-level 'variables' array gets HTML_PANEL_FOLDED=true; the FIRST panel (e.g. fsInhalt) gets "attributes":[{"text":"data-cb-folded","value":"false"}]; the remaining panels start folded via the global.

PRESERVE EXISTING ELEMENTS & FUNCTIONALITIES — ABSOLUTE RULE (never remove what the user did NOT ask to remove):
- **You MUST output the COMPLETE form: EVERY existing element from the input form must appear in your output** (same `name`, `id`, `className`, `properties`, `attributes`) and stay in its original container — even when the request does not mention it. Only elements the user EXPLICITLY asked to remove may be omitted.
- Omitting ANY existing element/container/functionality from your output is interpreted as a REMOVAL — the element is then LOST from the published form. That is data loss and an absolute FAIL. Before finalizing, mentally diff your output against the input form and confirm no existing element is missing.
- KEEP every existing element and every property AND every `attributes` entry it has, UNLESS the user EXPLICITLY asks to remove or change it. Never drop an existing data-cb-func / data-cb-* functionality (e.g. HTML.Input.TinyMCE rich-text editor, HTML.Input.Cleave masking, HTML.Input.REGEX, OpenPLZ.Autocomplete) from a field you are not asked to change — a missing functionality is a FAIL.
- When the request targets ONLY some elements/properties (e.g. numbering the panel titles → the panels' 'legend' property), modify ONLY those; every other element keeps its properties AND its 'attributes' exactly as in the input form.
- NEVER interpret a change request for one thing (e.g. a title/label/number) as permission to strip other functionality (e.g. a rich-text editor or a formatter) from that or any other element.

MOVING ELEMENTS (e.g. "den Senden-Button und die Checkbox nach unten ans Formularende verschieben, nicht in einen Container" / "move X to the bottom of the form, out of the container"):
- Moving an element ONLY re-parents THAT element: remove JUST its name from the OLD parent's 'elements' array, add it to the NEW parent's (e.g. the page's) 'elements' array, and set its properties.parentid to the new parent's name.
- NEVER remove, drop, or empty any OTHER container/fieldset/panel while moving something — an untouched container (e.g. the "Veröffentlichung" panel) stays exactly as it is, with all its children and its place in its parent's 'elements' array. Omitting an existing element/container from your output is interpreted as a REMOVAL, so every untouched element must remain in the output.
- Keep the moved element's own properties and attributes (e.g. the button's action, the checkbox's label) unchanged.

WHOLE-FORM TRANSLATION — ADD translations as per-language fields ('properties.i18n'):
A request like "übersetze das gesamte Formular ins Englische" / "translate the whole form into Italian" /
"traduire le formulaire en français" is a TRANSLATE-THE-FORM request. It means the form is a MULTILINGUAL
form: Formcycle stores per-language element translations in an element-local map, and the request is
fulfilled by ADDING the translations for the requested language as those per-language fields — NOT by
overwriting the form's base/default-language texts. Formcycle shows the translated text when the form is
displayed or edited in that language and falls back to the base property otherwise.
- HOW THE STORAGE WORKS: every element's 'properties' may carry an '"i18n"' object
  '"i18n": { "<languageCode>": { "<property>": "<translated text>", ... } }'. The plain properties
  ('label', 'placeholder', 'legend', ...) keep the BASE/default-language text byte-for-byte. 'languageCode'
  is the Formcycle language code of the requested language ('de', 'en', 'fr', 'it', 'es', 'nl', ...).
  Example — translate into English:
  "properties": { "name": "tfVorname", "label": "Vorname", "placeholder": "Vorname eingeben",
                  "i18n": { "en": { "label": "First name", "placeholder": "Enter first name" } } }
- PROCEDURE — determine the target language code from the request; when "translate" appears WITHOUT a
  target language, ASK which language (clarification) instead of guessing. Then, for EVERY element that
  carries user-visible text, KEEP every existing base-language property value unchanged and ADD (or merge
  into an existing '"i18n"') the translations for that ONE language under the SAME property names:
  - 'label' of every input widget (XTextField, XTextArea, XSelect, XCheckbox, XUpload, XSignature,
    XCaptcha, XRating, XAppointment, filterable text fields, ...),
  - 'legend' of every XFieldSet and 'legend'/'header' of pages/sections,
  - 'placeholder' of input fields,
  - 'helptext', 'title'/'alt' where user-visible (e.g. XImage), and any other human-readable text property,
  - static XSpan / XText content ('rtevalue': headings, intro/explanatory paragraphs), an XBsLogin
    'bs_btn_text', a repeatable container's 'dynamicAddText' / 'dynamicDeleteText',
  - XSelect OPTIONS: keep the 'options' array (text + value) EXACTLY as it is and add the per-language
    display text into each option object's OWN '"i18n"': {"text":"Ja","value":"Ja","i18n":{"en":{"value":"Yes"}}}
    (the option's per-language translation lives under the key 'value'; never change the option's top-level
    'text'/'value'),
  - XButtonList BUTTONS: keep each button's 'name'/'title'/'value'/'action' untouched and add the
    per-language text into each button object's OWN '"i18n"': {"name":"btnWeiter","value":"Weiter",
    "i18n":{"en":{"value":"Next","title":"Next"}}}.
NEVER translate, rename or touch (keep byte-for-byte identical):
- every element's 'name' and 'id' — a translated/renamed 'name' breaks the whole structure (elements
  arrays, parentid, references, workflows); 'parentid' and every 'elements' array keep referencing the SAME 'name's,
- every XSelect option's top-level 'value' and its 'text', every XButtonList button's 'name' and its 'action'
  — submit/next/previous triggers and conditions reference them,
- 'className', every 'cssclasses' entry (incl. all CodBi_* / AI_LLAMA_CHAT_* classes), 'rowid' and every
  structural/technical property,
- the entire CodBi wiring: the data-cb-func id, every data-cb-* attribute NAME, and every TECHNICAL attribute
  VALUE — EP placeholders ({ ... }), [%fieldName%] / [%$...%] placeholders, field-referencing
  selectors/parameters (e.g. data-cb-field=".tfExtractedText", data-cb-replacements, hiddenif/hiddenifvalue),
  DataQuery names (data-cb-dataquery="HolaQuery"), the datacolumn parts in data-cb-columns, and any option
  'value' a condition depends on.
So a field named tfVorname stays tfVorname and a select option value "Ja" stays "Ja" — only the per-language
translation fields ('properties.i18n[<lang>]', plus the per-option / per-button 'i18n') are added. The
request changes ONLY translations: do NOT add, remove or reorder fields, do NOT alter layout/structure,
conditions (hiddenif/readonlyif), options lists, functionality or any data-cb-* wiring, and do NOT edit any
plain display property of the base language. Same elements, same names, same values, same structure — the
translations appear only as '"i18n"' fields for the requested language. Do not invent an 'i18n' entry for a
property that has no base value, and never add an '"i18n"' field for languages other than the requested one.
When the requested target language IS the form's base language (the plain properties), no 'i18n' entry is
needed — the text is already in that language.
- OUTPUT-SIZE / VALIDITY — a whole-form translation re-emits the complete form AND its translations, so for
  a form with many elements the output becomes large. Emit the JSON COMPACTLY (no pretty-printing / no
  indentation between properties) to stay well within the model's output limit, and NEVER emit an empty
  '"i18n": {}' object — add '"i18n"' only to an element that actually receives at least one translation,
  translate every element's text in the SAME single output, and always finish the complete, valid JSON
  (never stop mid-form).
- NO CODBI ELEMENT CHANGES — a translation never adds/changes/removes a CodBi element. So in your top-level
  output ALSO include `"_codbiApplicability": { "codbiVerdict": "none" }` — this marker tells the server
  that no CodBi functionality applies, so it does NOT run a second CodBi evaluation pass (which would
  otherwise re-send the whole large form a second time and can exceed the model's output limit).
- COVER EVERY CONSUMER-VISIBLE TEXT — a whole-form translation must translate EVERYTHING the end user
  reads in the rendered form, not only the plain 'label'. Besides 'label'/'legend'/'placeholder',
  translate into the same 'properties.i18n[<lang>]' map (and the per-object 'i18n' maps) every other
  visible text:
  - XPage: 'header' (the page caption/title) and 'subheader' (the subtitle under it) — both are scalar
    properties resolved from 'properties.i18n' like a label:
    "properties": { "name": "Daten_Foerderung", "header": "Daten zur Förderung", "subheader": "...",
                    "i18n": { "en": { "header": "Funding data", "subheader": "..." } } }
  - XNavigationBar: its nav 'options' are the visible step labels — translate each option's visible text
    exactly like an XSelect option (per-option 'i18n', never the option 'value'):
    "options": [ { "text": "Angaben zur Förderung", "value": "Daten_Foerderung",
                   "i18n": { "en": { "value": "Funding data" } } } ]
  - XSelect options and every XSelect-like options list (radio groups, filterable selects, datalists,
    XNavigationBar): each entry keeps its 'text'/'value' and gets '"i18n": { "<lang>": { "value": "<translated visible text>" } }'.
  - XButtonList buttons: each button keeps 'name'/'value'/'action' and gets
    '"i18n": { "<lang>": { "value": "<translated label>", "title": "<translated title>" } }'.
  - XCheckbox / XUpload / XAppointment / XSignature 'label' and 'title', XTextArea/XTextField
    'placeholder', XFieldSet 'legend', XSpan static content ('rtevalue'), XImage 'alt'/'title',
    repeatable containers' 'dynamicAddText' / 'dynamicDeleteText', and 'helptext'.
  RULE: if the end user can see it in the rendered form, it MUST receive a translation for the requested
  language — leaving a visible navbar step, page caption/subcaption, button label, select option, legend
  or static text untranslated is a FAIL.
- REQUIRED `_codbiApplicability` ON EVERY TRANSLATION OUTPUT — like every form output, a whole-form
  translation response MUST contain the top-level `"_codbiApplicability"` field. For a translation set it
  to `"_codbiApplicability": { "codbiVerdict": "none", "considered": [], "applied": [] }` (a translation
  adds/changes/removes no CodBi element). The server reads this verdict to SKIP its second CodBi
  evaluation pass — if it is missing, the server re-runs the whole large form with the CodBi API, which
  exceeds the output limit on big forms and returns invalid JSON. Include it at the very end of your JSON,
  exactly like the other `_codbiApplicability` outputs.
- MULTILINGUAL WORKFLOW MAILS — a whole-form translation makes the form MULTILINGUAL, and the mails the
  form's workflows send to the consumer must follow the consumer's language. So when the request translates
  the form INTO A DIFFERENT language than the form's base/default language (the language of the plain
  'label'/'legend'/... properties), your JSON output MUST ALSO end with the server marker
  `"_workflowMailLanguages": ["<baseLanguageCode>", "<addedLanguageCode>", ...]` — a top-level JSON array
  that lists the form's BASE language code first, followed by every language code THIS translation adds to
  the form (exactly the 'languageCode' values you wrote into the '"i18n"' maps, e.g.
  `"_workflowMailLanguages": ["de", "en"]`). The marker tells the server to wrap each existing
  CONSUMER-facing FC_EMAIL / FC_DOI_INIT workflow node into an FC_SWITCH that branches on the workflow
  placeholder `[%lang%]` (the language the form was filled out in) — the original mail stays on the base
  language branch, and a translated mail is generated for every other language. Emit the marker ONLY on a
  whole-form translation that actually ADDS another language; a request that only edits the base language
  (or a non-translation change) NEVER emits it. The marker is a server instruction like
  `_codbiApplicability` — it is stripped before the form is saved and never becomes part of the form.
