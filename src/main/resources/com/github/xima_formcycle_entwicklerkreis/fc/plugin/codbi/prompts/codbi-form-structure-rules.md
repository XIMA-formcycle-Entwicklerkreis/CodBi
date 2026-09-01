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
