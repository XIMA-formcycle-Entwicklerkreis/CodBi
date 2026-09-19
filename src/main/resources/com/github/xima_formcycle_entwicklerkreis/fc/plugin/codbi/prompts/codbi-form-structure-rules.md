MANDATORY STANDARD CLASSES ON PERSON FIELDS (the People standard is active in the shared form — ALWAYS apply):
- Vorname/Nachname/first-name/last-name/name field → cssclasses=["CodBi_People_Name"]; a first name AND a last name EACH get their own class. A user-requested class (e.g. "hallo") may coexist — the "one class" rule never blocks adding CodBi_People_Name.
- E-Mail/email field → cssclasses=["CodBi_People_Mail"].
- German PLZ/postal-code field → cssclasses=["CodBi_People_PLZ"].
- Telefon/phone field → cssclasses=["CodBi_People_Phone"].
A person field WITHOUT its CodBi_People_* class is a FAIL.

WIDGET STRUCTURE RULES:
- Only the widget classNames listed in the Formcycle widget reference below are valid (they all start with 'X', e.g. XButtonList, XTextField, XSelect, XPage). NEVER invent a className — there is NO standalone 'BUTTON' widget class.
- Buttons (submit, back, next) are NOT standalone widgets: define each button as an entry inside an XButtonList item's 'buttons' array (name, title, value, action). A workflow submit trigger (FC_FORM_SUBMIT_BUTTON) references that button by its 'name'.
- APPROVAL / REJECTION BUTTONS ("Genehmigen"/"Ablehnen", approve/reject): create BOTH buttons as entries of one XButtonList (each with name/title/value; action.page="submit" for the approval button, and action="" for a reject button whose click must do nothing at all) — the workflow binds to each button by its 'name' (FC_FORM_SUBMIT_BUTTON + triggerParams.buttonName), so "Genehmigen" and "Ablehnen" run DIFFERENT workflow lanes. NEVER ask for query parameters, an "approval=approve"-style URL scheme, a callback URL or any link mechanism — the decision is the button click; the user only needs to provide the two labels (and if they already named them, create them without asking).
- STATE-DEPENDENT AVAILABILITY ("Available if" / verfügbar für Status): a form element can be shown / read-only ONLY while the form record is in certain workflow ENDING STATES — a lane's endpoint (ending) state IS the record's current state until another lane changes it. Set these as DIRECT properties (NOT in the attributes array): `statusdependent` (the STRING `"1"`, NOT a JSON boolean) + `viewstatus` (JSON array of the workflow STATE UUIDs - the designer's state-list values, e.g. `["3f2b19c4-..."]` - NOT the state DISPLAY NAME; an entry `"[!]<stateUuid>"` EXCLUDES that state) for availability, and `readonly_statusdependent` + `readonly_viewstatus` for read-only. Group analogues: `usergrouppendent`/`viewusergroup` and `readonly_usergrouppendant`/`readonly_viewusergroup`. Emit the flags as REAL booleans and the arrays as plain state-name strings (any other shape is dropped), and use the EXACT state name the workflow lane ends in.
- CONDITIONAL PROPERTIES (show / hide / lock / require) are DIRECT element properties, never entries in the attributes array: `hiddenif` / `hiddenifcomp` / `hiddenifvalue` / `hiddenifclear`, `readonlyif` / `readonlyifcomp` / `readonlyifvalue` / `readonlyifclear` and `requiredif` / `requiredifcomp` / `requiredifvalue`. The `...if` value is the controlling field's EXACT properties.id, the `...ifcomp` is the EConditionType code (0 MANDATORY, 1 EQUAL, 2 NOT_EQUAL, 3 REGEX, 4 LESS_THAN, 5 GREATER_THAN, 6 BETWEEN, 7 LESS_OR_EQUAL, 8 GREATER_OR_EQUAL, 9 EMPTY) and `...ifvalue` is the comparison value — always emit all three. THERE IS NO `disabledif` / `availableif` PROPERTY in Formcycle: a "deaktiviert / disabled / ausgegraut wenn ..." request maps to `readonlyif*` (visible but locked, value still submitted) or `hiddenif*` + `hiddenifclear="2"` (hidden AND disabled, value preserved); an always-locked field uses the plain flag "isreadonly":"1", an always-disabled one "isdisabled":"1". Availability by workflow STATUS or USER GROUP is a different mechanism (statusdependent / readonly_statusdependent / usergrouppendent + viewstatus / readonly_viewstatus / viewusergroup — see STATE-DEPENDENT AVAILABILITY above), NOT hiddenif: the state-based "DISABLED IF" is the read-only pair `"readonly_statusdependent":"1"` + `readonly_viewstatus` (visible but not editable in those states) and "not available in these states" is the `[!]<stateUuid>` EXCLUSION form of `viewstatus`; the `*dependent` flags are STRINGS ("1"/"0", the designer default is ""), never JSON booleans.
- Every created widget MUST have a unique 'id' (e.g. 'xi-...') and a className from the reference list.
- There is NO 'row' className — never use 'xm-form-row' (or any similar name) as a className. To place fields side by side on one line, give them the same 'rowid' property (see ROW GROUPING RULES).
- DEFAULT PLACEMENT OF A NEW ELEMENT = THE FIRST PAGE: when the request does NOT say where a new element (text, field, container, table, image, ...) shall go, append its 'name' to the FIRST XPage's "elements" array and set its properties.parentid to that page's 'name'. NEVER put it into the XHeader/XFooter (reserved for the navbar/language switcher/document-header items - the header is NOT "the top of the form" for new content) and never make it a top-level item of its own. Only an explicit location ("im Header", "auf Seite 2", "in den Container X", ...) changes this.

ROW GROUPING RULES (RELATED fields that belong on the SAME line):
Some fields describe ONE logical value together and must appear SIDE BY SIDE on the SAME LINE of the form (not stacked one per line, not wrapped in a nested container). Identify these groups by what they MEAN, in ANY language:
- A person's GIVEN/FIRST name + FAMILY/LAST name (+ MIDDLE name) — up to three name fields share one line.
- A STREET/ROAD name + HOUSE/BUILDING number (e.g. Main Street + 12).
- A POSTAL CODE + LOCALITY/CITY (e.g. 12345 + Berlin) — add the COUNTRY/state when the request asks for it (PLZ + Ort + Land = one line).
- An E-MAIL ADDRESS + PHONE/TELEPHONE number (contact details).
- Any other fields the request presents as ONE unit (e.g. a FROM + TO date pair, a BEGIN + END pair, a value + its UNIT, a quantity + a size).
THE GOLDEN RULE — GROUP RELATED FIELDS, AND NEVER MORE THAN FOUR PER LINE:
- HARD CAP OF FOUR: a line carries at least TWO and AT MOST FOUR fields. NEVER put five or more fields on one line — when MORE than four fields belong together, split them over SEVERAL lines ("row-1" for the first up-to-four, "row-2" for the next ones).
- Group ONLY fields that are genuinely related (see the list above). NEVER merge UNRELATED fields into one line just to save space — a line of unrelated fields is WORSE than one field per line.
- A related group of an ODD size keeps its own members together and the remaining related fields go on the NEXT line (e.g. street + house number on one line, PLZ + city on the following line) — NEVER fill the free slot with an unrelated field.
- Fields that stand alone (a single comment/message field, a checkbox, a submit button) get NO 'rowid' and span their own full-width line.
HOW Formcycle renders a row (there is NO 'row' widget/className — 'xm-form-row' is only the CSS class the renderer adds automatically, never a className you should write):
- Keep the fields of one group as DIRECT SIBLINGS inside the same parent container (e.g. in the XPage/container's 'elements' array) — do NOT wrap them in an extra XContainer/XFieldSet, and do NOT add an extra wrapper per line.
- Give ALL fields of one group the SAME string value for the 'rowid' property in their 'properties' object (e.g. "rowid": "row-1"). Formcycle renders all sibling fields with an identical 'rowid' next to each other on one line.
- Use a DIFFERENT 'rowid' value for each separate line ("row-1", "row-2", ...) so every group stays on its own line; omit 'rowid' (or leave it empty) for fields that should span the full width on their own line.
- NEVER COPY A 'rowid' FROM ANOTHER FIELD: a 'rowid' is ONLY valid for the related-field group of the SAME container. Every OTHER field MUST have NO 'rowid' (or an empty one). When you only add a CSS class or a data-cb-* attribute to a field (e.g. CodBi_HTML_Panel_AutoHeaderTitle_Supplement), do NOT add, copy or change its 'rowid' - a rowid shared with a field of ANOTHER container makes Formcycle merge ALL those fields into ONE row and they visually move into the first field's container.
- Size the fields sensibly so they share the line (e.g. two fields roughly half the row width each, three fields roughly a third each, four fields roughly a quarter each).

GROUP RELATED FIELDS INTO CONTAINERS (person / address / contact data):
Group logically-related fields into ONE dedicated XContainer (or XFieldSet when a legend/title fits) per group — do NOT place them flat on the page:
- NAME / person-data fields (first/given name, last/family name, middle name) → one container (this is also the LDAP/autofill person-data group when one is requested).
- ADDRESS fields (street, house/building number, postal code/PLZ, locality/city) → one address container (the OpenPLZ autocomplete set lives here). CRITICAL — an ADDRESS is NEVER a single field: when the request (or a clarification option) names "Adresse"/"Anschrift"/"address", build the FOUR parts `tfStrasse` (label "Straße"), `tfHausnummer` (label "Hausnummer"), `tfPLZ` (label "Postleitzahl", datatype "plzDE") and `tfOrt` (label "Ort") in that container, each with its OpenPLZ class (CodBi_OpenPLZ_AC_SET_Street / _BuildingNumber / _PLZ / _Locality) and with street+house number on one `rowid` and PLZ+city on the next. A lone free-text "Adresse" XTextField is a FAIL.
- CONTACT fields (e-mail, phone/telephone) → one contact container.
Inside each container the fields are DIRECT SIBLINGS and the ROW GROUPING RULES still apply (first+last name one line; street+house number one line; PLZ+city one line; e-mail+phone one line — same rowid within a group, NEVER more than four fields per line). Do NOT wrap a single line in its own extra container — the grouping container is the parent of all fields of that group. Add each group container to its page's/container's 'elements' array and every field inside to the group container's 'elements' array (with the matching parentid); a field that is not referenced by any container's 'elements' array is orphaned and does NOT render.

COMPLETE FORM RULES (build the ENTIRE requested form):
A request (email, list, description, mail thread, ...) can contain MANY fields. Create EVERY field the user asked for in ONE output — never create only the most recent / most emphasized / clarified subset and never drop fields mentioned earlier.
- "Make this group repeatable" (e.g. "+ to add more", "the answer fields can be duplicated") applies ONLY to that one group — all OTHER requested fields must still be created.
- Map each requested input to the matching widget: single-line text → XTextField, multi-line text → XTextArea, yes/no or a choice → XCheckbox / XSelect (see CONTROL TYPES), etc.
- A given/family name pair ("Name, Vorname") → two XTextFields on the SAME line (same 'rowid', see ROW GROUPING RULES).
- Add every created field to its page's/container's 'elements' array so it actually appears on the form.
- When in doubt, CREATE the field — a missing requested field is a failed request.

PANEL FOLDING RULES (start folded/collapsed — "zugeklappt", "eingeklappt", "anfangs zugeklappt", "collapsed by default"):
- CodBi panels (UI.Panels classes / accordion members) default to UNFOLDED. To make panels START FOLDED, set the form-level GLOBAL VARIABLE HTML_PANEL_FOLDED to true (top-level 'variables' array: {"name":"HTML_PANEL_FOLDED","aliasname":"HTML_PANEL_FOLDED","serveronly":false,"value":"true"}) — ALL panels then start folded.
- Set data-cb-folded="false" on EVERY panel that must stay OPEN at the start (e.g. the FIRST panel) — the per-element attribute overrides the global default. The other panels get NO data-cb-folded and start folded via the global.
- NEVER set the XFieldSet "collapsed" property — it is not a real Formcycle property, it is ignored, and it never folds a CodBi panel. The correct mechanism is data-cb-folded + the HTML_PANEL_FOLDED global.
- Example — "Alle Panels, bis auf das Erste, sollen anfang zugeklappt sein.": the top-level 'variables' array gets HTML_PANEL_FOLDED=true; the FIRST panel (e.g. fsInhalt) gets "attributes":[{"text":"data-cb-folded","value":"false"}]; the remaining panels start folded via the global.

PANEL ON AN XCONTAINER (foldable container — a container has NO legend, so it needs a title AND generated header CSS). The rule applies in EVERY pass, also when you rebuild/rerun:
- CONVERT IN PLACE, never replace: to make an EXISTING XContainer/XContainerInvisible collapsible you MUST use data-cb-func=html.panel (a panel CSS class does NOT work on a container). Keep the SAME item with the SAME "name" and "id", keep its "elements" array EXACTLY as it is (all child field names), and keep every child item in your output — only ADD the panel functionality chosen by element type — on an XContainer/XContainerInvisible (div, NO legend) add data-cb-func=html.panel plus its parameters (generateheader/autoheadertitle/folded/css*) and NEVER a UI.Panels CSS class (CodBi_HTML_Panel_Standard / CodBi_Accordion_* are FIELDSET-only and inert on a div); on an XFieldSet add the CSS class CodBi_HTML_Panel_Standard. NEVER put BOTH a panel class AND data-cb-func=html.panel on the SAME element (the server strips the redundant panel functionality, leaving an element that cannot fold). Emitting a panel with "elements":[] or dropping its children is a FAIL (empty fieldsets, no inputs).
- MANDATORY PARAMETERS: data-cb-generateheader="true" AND a NON-EMPTY data-cb-autoheadertitle. A container has NO legend, so data-cb-autoheadertitle is the ONLY source of the panel's header text — an empty/omitted title renders an empty header and is a FAIL. HEADER-TITLE SUPPLEMENTS: to append FIELD VALUES to the panel header title (e.g. "Von und Bis sollen dem Oeffnungszeitentitel, durch ein - getrennt, hinzugefuegt werden."), put cssclasses=["CodBi_HTML_Panel_AutoHeaderTitle_Supplement"] on EACH field whose value must appear (the field must be a DIRECT child of the panel - no intervening XFieldSet/XContainer) and  set data-cb-autoheadertitlesupplementsspacer to the EXACT separator the user named; FORMCYCLE trims raw surrounding whitespace, so to include spaces encode them as %20 (URL) or \s (e.g. "durch ein - getrennt" -> "%20-%20" which renders " - "; a bare "-" renders without spaces); keep data-cb-autoheadertitle as the BASE title ONLY and NEVER put [%fieldName%] placeholders of the supplement fields into it. If the prompt names the panel title use it; if it does NOT (e.g. "Alle Bereiche im Formular sollen klappbar sein"), INVENT a short, meaningful title for EACH container panel yourself in the form's language, derived from the container's purpose/contained fields (e.g. name+e-mail+phone → "Kontaktdaten"; weekday + Von/Bis → "Öffnungszeiten").
- GENERATE PROPER HEADER CSS WHEN THE PROMPT SPECIFIES NONE: a container panel has almost no base header styling and looks spartan. When the prompt asks for foldable containers and gives no instruction on how the header shall look, generate restrained header CSS yourself via the HTML.Panel parameters: data-cb-cssheaderfolded (base look while FOLDED — set it to the SAME value as data-cb-cssheaderunfolded so a folded panel looks identical) and data-cb-cssheaderunfolded (the base look while unfolded — background, border/border-radius, padding, font-weight/color, cursor:pointer, width:100%, text-align:left), data-cb-cssheaderhover (subtle hover feedback), data-cb-cssheaderactive (small pressed effect), and a fold indicator via data-cb-cssafterheadercontent (folded, e.g. " ▾") plus data-cb-cssafterheadercontentunfolded (unfolded, e.g. " ▴"). EVERY such value is a RAW CSS DECLARATION LIST WITHOUT braces and WITHOUT a selector — e.g. "background:#eef2f7; padding:10px 14px; border-radius:6px;" — never a { } object; the ...content parameters hold a PLAIN STRING. Follow the prompt exactly when it DOES describe the look. XFieldSet panels use the CodBi_HTML_Panel_* classes and need none of this.
- MANDATORY — NEVER SKIP A CONTAINER PANEL'S HEADER STYLING (even when the request does not mention styling): creating/converting an XContainer/XContainerInvisible into a collapsible panel (data-cb-func=html.panel) REQUIRES (a) `HTML.Panel` in the need_codbi_details request, (b) data-cb-generateheader="true" + a non-empty data-cb-autoheadertitle, (c) the header CSS ON THE PANEL ITSELF via html.panel's OWN CSS parameters on that container — data-cb-cssheaderfolded (base look while FOLDED — set it to the SAME value as data-cb-cssheaderunfolded) and data-cb-cssheaderunfolded (base look while unfolded, e.g. `background:#eef2f7; border:1px solid #cbd5e1; border-radius:6px; padding:10px 14px; font-weight:600; color:#1e293b; cursor:pointer;`), data-cb-cssheaderhover, data-cb-cssheaderactive, data-cb-cssafterheadercontent (folded arrow) / data-cb-cssafterheadercontentunfolded (unfolded arrow) — every value a RAW CSS declaration list WITHOUT braces; the folded header is styled directly by data-cb-cssheaderfolded, and (d) `HTML.Panel` listed in the `_codbiApplicability` `applied` array. NEVER return `codbiVerdict:"none"` with empty considered/applied for such a request.

- WRAPPING AN EXISTING REPEATABLE CONTAINER IN A NEW PANEL WRAPPER (e.g. "Der Container für die Wochentage soll nicht mehr selbst das klappbare Panel sondern ein Container um den Wochentage Container"): the NEW wrapper container you introduce MUST be a plain, NON-repeatable XContainer (NO `dynamic` property) that lists the EXISTING repeatable container in its `elements`; put data-cb-func=html.panel (and its mandatory parameters) on the WRAPPER and keep the EXISTING repeatable container's name/id/elements/`dynamic:"1"` EXACTLY as they are. NEVER give the new wrapper `dynamic:"1"` and NEVER copy the inner container's dynamic* properties onto it — a repeatable inside a repeatable is rejected by Formcycle ("Ein wiederholtes Element darf keine anderen wiederholten Elemente enthalten") and the server has to flatten it, which risks dropping the inner fields.

- WRAPPING A CONTAINER IN A NEW PANEL WRAPPER — FOLLOW THE PROMPT'S INTENT ABOUT THE ORIGINAL CONTAINER: when the prompt says the ORIGINAL container shall NO LONGER be the panel (e.g. "Der Container für die Wochentage soll nicht mehr selbst das klappbare Panel sein sondern ein Container um den Wochentage Container"), the panel functionality MOVES — put data-cb-func=html.panel (and its parameters: generateheader / autoheadertitle / autoheadertitlesupplementsspacer / the cssheader* CSS / the fold-arrow params) on the NEW wrapper and REMOVE all of them from the ORIGINAL container so it becomes a PLAIN container. CREATE EXACTLY ONE NEW WRAPPER CONTAINER — never two: do NOT add BOTH a new "...Panel" container AND a separate new "...Wrapper" container around the same original container. A single new outer XContainer holds the EXISTING container, which keeps its own name/id/elements. THE NEW WRAPPER MUST BE A PLAIN, NON-REPEATABLE CONTAINER: it must have NO "dynamic" property at all ("dynamic":"0" or, better, the property omitted). ONLY the EXISTING container keeps its repeatable flag ("dynamic":"1") when it was repeatable. NEVER copy the EXISTING container's dynamic / dynamicMinSize / dynamicMaxSize / dynamicAddText / dynamicDeleteText onto the wrapper — a repeatable wrapper around a repeatable container is a forbidden repeatable-inside-repeatable and the server must flatten it, which collapses the intended two-level structure into one. When the prompt does NOT say the original container shall stop being a panel, leave the original container exactly as it is and only add the one wrapper — but NEVER nest a container panel (data-cb-func=html.panel on an XContainer) inside another container panel (that renders a panel inside a panel); nested panels are expressed with CodBi_HTML_Panel_Flat / CodBi_HTML_Panel_Minimal on FIELDSETs, never with two container html.panels. NEVER drop a panel the prompt did not ask to remove, and NEVER leave the SAME panel duplicated on both. TO MAKE THE REMOVAL STICK you MUST re-emit that container's ENTIRE properties.attributes array WITHOUT the html.panel entry — drop the data-cb-func value "html.panel" (keeping any OTHER function in the comma-separated list) AND every data-cb-* panel parameter (generateheader / autoheadertitle / autoheadertitlesupplementsspacer / the cssheader* CSS / the fold-arrow params). Do NOT merely OMIT the attributes key: when an existing element's attributes key is missing from your output the server RESTORES its original attributes from the saved form, so the panel silently comes back. ALSO re-emit that container's cssclasses WITHOUT any UI.Panels panel-type class (CodBi_HTML_Panel_Standard / CodBi_HTML_Panel_Flat / CodBi_HTML_Panel_Index / CodBi_HTML_Panel_Minimal / CodBi_HTML_Panel_NoCordion) — a plain container must not keep a panel class (those classes only work on a FIELDSET, not on an XContainer; keeping one leaves a bogus vestigial panel class). SUMMARY CHECK BEFORE FINISHING: exactly ONE new wrapper container; that wrapper is NON-repeatable (NO "dynamic"); the ORIGINAL container has NO html.panel and NO panel class; NO container panel is nested inside another container panel; NO repeatable container is nested inside another repeatable container.

- WORKED EXAMPLE — prompt "Der Container für die Wochentage soll nicht mehr selbst das klappbare Panel sein sondern ein Container um den Wochentage Container." is the EXACT wrap-the-panel-outward case: the ORIGINAL repeatable container `coOpeningHoursPanel` (dynamic:"1", currently carrying data-cb-func=html.panel + its header/css params, elements=["selWeekday","tfFromTime","tfToTime"]) must NO LONGER be the panel. Correct output: create EXACTLY ONE new wrapper XContainer `coOpeningHoursPanelWrapper` that (a) lists the ORIGINAL `coOpeningHoursPanel` in its `elements`, (b) gets `parentid` = the accordion's id and REPLACES `coOpeningHoursPanel` in the accordion's `elements` array, and (c) carries data-cb-func=html.panel plus ALL of the panel parameters. The ORIGINAL `coOpeningHoursPanel` keeps its name/id/elements and its `dynamic:"1"` (and dynamic* props), gets `parentid` = `coOpeningHoursPanelWrapper`'s id, and MUST be re-emitted with an EXPLICIT EMPTY `"attributes": []` array — the key present but empty, NEVER omitted, because a missing `attributes` key makes the server restore the old html.panel. Do NOT create a second plain wrapper in between and do NOT leave the panel on the inner container. Resulting chain: accordion → `coOpeningHoursPanelWrapper` (html.panel) → `coOpeningHoursPanel` (plain, dynamic, attributes:[]) → selWeekday/tfFromTime/tfToTime.

PRESERVE EXISTING ELEMENTS & FUNCTIONALITIES — ABSOLUTE RULE (never remove what the user did NOT ask to remove):
- **You MUST output the COMPLETE form: EVERY existing element from the input form must appear in your output** (same `name`, `id`, `className`, `properties`, `attributes`) and stay in its original container — even when the request does not mention it. Only elements the user EXPLICITLY asked to remove may be omitted.
- Omitting ANY existing element/container/functionality from your output is interpreted as a REMOVAL — the element is then LOST from the published form. That is data loss and an absolute FAIL. Before finalizing, mentally diff your output against the input form and confirm no existing element is missing.
- KEEP every existing element and every property AND every `attributes` entry it has, UNLESS the user EXPLICITLY asks to remove or change it. Never drop an existing data-cb-func / data-cb-* functionality (e.g. HTML.Input.TinyMCE rich-text editor, HTML.Input.Cleave masking, HTML.Input.REGEX, OpenPLZ.Autocomplete) from a field you are not asked to change — a missing functionality is a FAIL.
- When the request targets ONLY some elements/properties (e.g. numbering the panel titles → the panels' 'legend' property), modify ONLY those; every other element keeps its properties AND its 'attributes' exactly as in the input form.
- NEVER interpret a change request for one thing (e.g. a title/label/number) as permission to strip other functionality (e.g. a rich-text editor or a formatter) from that or any other element.

RELATIVE PLACEMENT OF A NEW ELEMENT ("unter dem Container", "über dem Container", "below/above X", "neben X"):
- A POSITION named relative to an EXISTING element is NEVER that element's parent. "unter dem Container X" / "below the container" / "unterhalb" / "darunter" / "anschließend an" means the new element sits BELOW it, i.e. on the SAME LEVEL: add the new element's 'name' directly AFTER the reference's name in the 'elements' array of the REFERENCE's PARENT (page/container) and set the new element's properties.parentid to that PARENT's 'id'. NEVER set parentid to the referenced container's 'id' and NEVER append the new name to the referenced container's OWN 'elements' array.
- "über dem Container X" / "oberhalb" / "darüber" / "above X" / "before the first element" / "ganz am Anfang" → insert the new element's 'name' directly BEFORE the reference's name in the PARENT's 'elements' array (position 0 when the reference is the first child).
- "neben X" / "next to X" / "rechts/links von X" → a SIBLING directly BEFORE or AFTER X in the PARENT's 'elements' array.
- ONLY when the user says the element shall be INSIDE ("in den Container", "im Container", "innerhalb", "into the container", "inside") do you make it a CHILD: set parentid to that container's 'id' and append its 'name' to that container's own 'elements' array.
- "unter dem Container" is NOT "in den Container": a position phrase says WHERE in the form the element sits, not WHICH element contains it. When a request is ambiguous between BELOW and INSIDE, choose BELOW (a sibling of the referenced container).
- The reference element comes from the request/context (e.g. "dem Container" = the container being discussed, usually the one from the previous request). Use its PARENT — do NOT invent a new wrapper container, and do NOT ask the user to clarify a relative position.
- Example — "Füge eine Auswahl unter dem Container hinzu, der alle Ämter ... anbietet.": the new XSelect is a SIBLING of that container — parentid = the container's PARENT (the page), and the select's 'name' is inserted directly AFTER the container's name in the parent's 'elements' array. Putting it INSIDE the container (parentid = the container's 'id') is WRONG.

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
