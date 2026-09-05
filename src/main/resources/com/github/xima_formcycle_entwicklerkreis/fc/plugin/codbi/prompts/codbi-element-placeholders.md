# CodBi Element Placeholders (EPs)

EP syntax and chaining rules, individual EP descriptions.

## EP INVOCATION SYNTAX (CRITICAL)

Every Element Placeholder (EP) — built-in or custom — is invoked by writing the EP placeholder itself as the value, in this exact form:

{ EPName > Param1 ; Param2 ; Param3 ; ... }

- EPName is the exact element placeholder name (dots, case-sensitive).
- Parameters are separated by semicolons; use trailing semicolons for unused optional parameters.
- Parameter values are RAW strings — never add quotes around them.
- An EP placeholder IS the value. NEVER represent an EP's data as a JSON object or array literal. The first token inside the braces is the EP's NAME. `data.join` is ONLY an example — ANY EP id works (built-in like AI.LLAMA.STD.QA, OpenPLZ.Localities, or any custom EP defined in the local API doc manager). The pattern is always `{ <any EP id> > Param1 ; Param2 ; ... }`. For example `{"planet":"Pluto","saturation":0.5}` is WRONG; `{ data.join > Param1 ; Param2 }` is CORRECT.

When you need the data an EP provides (e.g. in a Sys.Log.Console data-cb-Data parameter), write the EP placeholder with its parameters as the value. Do not invent JSON objects or arrays for EP results — the placeholder itself is the result.

## EP Chaining

Element Placeholders (EPs) can be chained with > syntax to pass one EP's result as input to another EP. This works in ANY data-cb-* parameter that accepts EPs (e.g. data-cb-Data, data-cb-replacement, data-cb-Values, data-cb-replacements).

Example: "{ BayVIS.Ansprechpartner.Details > { V > VariableName } }" first resolves V to get an ID, then fetches the contact details. The inner EP is always resolved first and its result becomes the parameter for the outer EP.

CRITICAL — EP parameter values are raw strings without quotes. Write { BayVIS.Ansprechpartner.ID > Salvatore Callari } NOT { BayVIS.Ansprechpartner.ID > "Salvatore Callari" }. Quotes are part of the EP syntax itself (the { } braces), do NOT add extra quotes around parameter values.

## AI.LLAMA.STD.QA

This EP queries an AI to answer a question. USE for weather/AI/knowledge queries. Param[1]=question, Param[2]=UseInternet ("true"). CRITICAL: trailing semicolons for unused params.
Example: "{ AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;; }"

## Date.Today

Supports arithmetic directly — do NOT wrap it in Date.Arithmetic. Use "{ Date.Today > +1d }" for tomorrow, "{ Date.Today > -1d }" for yesterday. Arithmetic: +N d/m/y (add days/months/years), -N d/m/y (subtract).

## Date.FromString

Turns a date string into a Date object. Use for any prompt about converting/parsing a date string. Example: "{ Date.FromString > 01.12.1978 }" returns a Date object for December 1st, 1978. Optional second param sets the format (e.g. "DD/MM/YYYY").

## Date.Holidays

Retrieves GERMAN holidays ("Feiertage") for the requested years/states from API-Feiertage.de. The EP id is ALWAYS `Date.Holidays` — NEVER invent or translate it (there is NO `Feiertage` EP). THE YEAR CANNOT BE GIVEN AS AN EXPLICIT NUMBER (e.g. `2026`) — the code only recognizes `THIS_YEAR` (current year) and `THIS_YEAR +/- N` (relative to the current year, e.g. `THIS_YEAR + 1` = next year); any other token is treated as a state abbreviation. Other parameters (order/case-insensitive): a German state abbreviation (bw, by, be, bb, hb, hh, he, mv, ni, nw, rp, sl, sn, st, sh, th), `Friedensfest` (Augsburg), `KATHOLISCH`. Examples: 'Feiertage dieses Jahr' → `{ Date.Holidays > THIS_YEAR }`; 'Feiertage nächstes Jahr' → `{ Date.Holidays > THIS_YEAR + 1 }`; 'Feiertage Bayern dieses Jahr' → `{ Date.Holidays > by ; THIS_YEAR }`. MULTIPLE year tokens may be passed in ONE invocation (parameters separated by `;`), e.g. 'Feiertage dieses und nächstes Jahr' → `{ Date.Holidays > THIS_YEAR ; THIS_YEAR + 1 }`. When the user requests a SPECIFIC calendar year (e.g. 'Feiertage 2026'), do NOT drop the field and do NOT use that specific year — explain that only RELATIVE years are supported and ASK which to use, offering exactly THREE options that may be selected MULTIPLE at once: THIS_YEAR (current year), THIS_YEAR + 1 (next year), THIS_YEAR - 1 (last year). Multiple selected years are combined in one invocation separated by `;` (e.g. `{ Date.Holidays > THIS_YEAR ; THIS_YEAR + 1 }`). The Feiertage field shows the EP result via HTML.Text.Injector: set data-cb-func="HTML.Text.Injector", data-cb-property="value", data-cb-replacement="{ Date.Holidays > <chosen year> }" AND the field's `value` to the placeholder `[[INJECTOR_REPLACEMENT]]` — without the placeholder nothing is injected.

## JSON.Path

Extracts a property from an object using a dotted path. It can also call methods on an object by using the method name with parentheses as the path, e.g. "toString()" calls the toString method.

Example: "{ JSON.Path > { Date.FromString > 01.12.1978 } ; toString() }" creates a Date and calls toString() on it.

Use JSON.Path for any prompt asking to retrieve a property or call a method on a CodBi EP result.

CRITICAL — ALL OpenPLZ EPs (OpenPLZ, OpenPLZ.Streets, OpenPLZ.Localities, OpenPLZ.OrganizationalUnits, OpenPLZ.TextSearch) return Array<object>. To extract a specific property (e.g. street names), wrap the EP in JSON.Path: "{ JSON.Path > { OpenPLZ.Streets > de ; Karolinen ; 91522 } ; name }".

## Data.Join

Merges the properties of multiple EP results into one object. Use Data.Join when the prompt asks to combine/join/merge/zusammen data from multiple EPs.

## Data.CSV

Wraps another EP result as CSV output. Use only when the prompt explicitly mentions CSV.

## Net.URL

Fetches content from a URL. Use for any prompt asking to retrieve web content.

## DOM.Query

Queries the DOM for a CSS selector. The CSS selector from the prompt (dot-prefixed class name) is the parameter.

## V (global variables)

Resolves a global variable's value by name. IMPORTANT: V returns the variable's RAW string value exactly as stored — it does NOT re-resolve EP expressions. So a variable whose "value" is itself an EP (e.g. "{ BayVIS.Ansprechpartner.Details > ... }") comes back as that literal text and FAILS when used as BayVIS input. Example: "{ V > BayVIS_WeitereAnsprechpartner }".

WHEN THE USER ASKS TO STORE A VALUE AS A GLOBAL VARIABLE ("als globale Variable hinterlegen", "in einer globalen Variable speichern", "store in a global variable", "globale Variable anlegen"), HOW the V EP is used depends on the intent:
1. CREATE the global variable in the form's top-level "variables" array. Its "value" holds either:
   - a PLAIN TEXT/data value to be displayed directly (e.g. a header text that should be changeable via the variable), or
   - when the intent is to RETRIEVE data from an EP such as BayVIS — the PLAIN IDENTIFIER that locates the data: the NAME string, e.g. {"name":"SALVATORE_CALLARI_CONTACT","aliasname":"SALVATORE_CALLARI_CONTACT","serveronly":false,"value":"Salvatore Callari"} (or a numeric ID). The "value" must contain NO "{" / "}" — never an EP expression (rule 4), never the whole Details chain.
2. REFERENCE it with V, matching the intent:
   - PLAIN TEXT/data to show directly: the STANDALONE "{ V > <NAME> }" is correct — it injects the variable's value (e.g. a changeable header text).
   - RETRIEVE data from an EP (BayVIS): NEST the V EP INSIDE the data EP, e.g. "{ BayVIS.Ansprechpartner.Details > { V > SALVATORE_CALLARI_CONTACT } ; <property> }". Here V is the INPUT to the outer BayVIS EP — a standalone "{ V > <NAME> }" would only inject the raw identifier string, not the fetched BayVIS data. Use the standalone form only when the variable already holds the text to display.
3. NEVER reference CodBi EP data with Formcycle's "[%$NAME%]" placeholder — that is resolved server-side at submit time and cannot run a client-side EP. Use "{ V > <NAME> }".
4. NEVER store the full BayVIS data EP (e.g. "{ BayVIS.Ansprechpartner.Details > ... }") as the variable's "value" and NEVER reference it with a standalone "{ V > <NAME> }" — the variable holds the IDENTIFIER only; the data fetch lives in the element's replacement, reading the identifier via V inside the BayVIS EP.
5. NEVER put a bare name into a BayVIS Directory/Details EP's parameter directly — use the correct ID → Details chain (see BayVIS EPs below).

## I

Takes a 0-based index and an inner EP that returns an ARRAY, returns the element at that index of the array (e.g. { I > 0 ; { BayVIS.Ansprechpartner.ID > Salvatore Callari } }). ONLY use I when the INNER EP result is an ARRAY. When the inner EP already returns a SINGLE value/object (e.g. a Details EP fed by a global-variable ID via V), do NOT use I.

## F

Must be the OUTERMOST EP when filtering an array by exact property value. Do NOT wrap F in JSON.Path — F must be outermost.
Correct: "{ F > postalCode ; 91522 ; { sorted > { unique > { openplz.localities > de ; ^a.* }; name }; name } }"
WRONG: "{ Sorted > { F > ... } }" or "{ JSON.Path > { F > ... } }"

## Sorted

Sorts an array by a property name.

## Unique

Deduplicates an array by a property name.

## OpenPLZ EPs

ALL OpenPLZ EPs (OpenPLZ, OpenPLZ.Streets, OpenPLZ.Localities, OpenPLZ.OrganizationalUnits, OpenPLZ.TextSearch) return Array<object>. Each object has properties like "name", "officialKey", "type", "postalCode", "locality". To extract a specific property, wrap the EP in JSON.Path. If duplicates may occur, deduplicate with Unique.

EP names use dots and are case-sensitive: OpenPLZ.Localities (NOT "openplz.localities"), OpenPLZ.Streets, LDAP.Find (NOT "Ldap.Find").

## BayVIS EPs

SYNTAX: `>` introduces the FIRST parameter of an EP; every further parameter is separated by `;` (NEVER by `>`). A nested `{ ... }` EP is resolved first and its result becomes that parameter.

BayVIS has THREE kinds of EPs — never confuse them:
1. **Directory EPs** (`BayVIS.Behoerden`, `BayVIS.Ansprechpartner`) — REQUIRE a property-name parameter and return that column for the whole directory.
2. **ID-resolver EPs** (`BayVIS.Behoerden.ID`, `BayVIS.Ansprechpartner.ID`) — take a plain STRING name and return the matching numeric ID(s) as an ARRAY.
3. **Details EPs** (`BayVIS.Behoerden.Details`, `BayVIS.Ansprechpartner.Details`, `BayVIS.Behoerden.Details.Gebaeude`, `BayVIS.Behoerden.Gebaeude.ID`) — take NUMERIC IDs ONLY, never names.

CRITICAL — TO GET DETAILS FOR A NAMED PERSON OR AUTHORITY, ALWAYS CHAIN NAME → ID → DETAILS (nest the EPs; the inner EP is resolved first):
- NEVER pass a person's name to `BayVIS.Ansprechpartner` — its only parameter is a PROPERTY name (e.g. `nachname`, `email`). `{ BayVIS.Ansprechpartner > Salvatore Callari }` is INVALID and rejected.
- NEVER pass an authority/office name (e.g. "Amt 44") to `BayVIS.Behoerden.Details`, `BayVIS.Behoerden.Details.Gebaeude` or `BayVIS.Behoerden.Gebaeude.ID` — they take NUMERIC IDs only. `{ BayVIS.Behoerden.Details > Amt 44 }` is INVALID.
- Resolve the name to an ID with the matching `.ID` EP. The `.ID` EPs return an ARRAY, so pick one element with the I (index) EP: { I > 0 ; <array EP> }.
- WHEN TO USE I vs NOT — the I (index) EP is ONLY used when the INNER EP returns an ARRAY. The `.ID` EPs return an ARRAY → chain I. But a `Details` EP fed by a SINGLE id (e.g. a global variable via V) ALREADY returns a SINGLE object — do NOT wrap it in I. So for a single Ansprechpartner whose id is in a global variable use { BayVIS.Ansprechpartner.Details > { V > <NAME> } } directly — NEVER { I > 0 ; { BayVIS.Ansprechpartner.Details > { V > <NAME> } } }.
- The `.Details` EPs return a JSON OBJECT whose properties (e.g. vorname, nachname, email, zimmer, apTelefonDurchwahl, ...) fill HTML.Text.Mapper [(property)] placeholders. To display "the details"/specific properties of a resolved object you MUST use HTML.Text.Mapper with data-cb-replacements — HTML.Text.Injector injects only ONE plain STRING and is useless for a JSON object.
- SEVERAL BAYVIS VALUES DISPLAYED TOGETHER → ONE HTML.Text.Mapper (NOT one HTML.Text.Injector per value): first decide WHERE each requested value actually lives (use the EXACT per-EP property lists below) and fetch each DETAIL OBJECT only ONCE. When ALL requested values belong to ONE detail object — typical case: an EMPLOYEE's contact block, e.g. "die BayVIS-Kontaktdaten und den Namen des Mitarbeiters Salvatore Callari" (his name + e-mail + phone) — data-cb-replacements is JUST that object's Details EP, e.g. data-cb-replacements="{ BayVIS.Ansprechpartner.Details > { I > 0 ; { BayVIS.Ansprechpartner.ID > Salvatore Callari } } }" (NO Data.Join), and the single template holds the person's REAL [(property)] placeholders, e.g. "[(vorname)] [(nachname)] — [(email)], Tel. 0[(apTelefonOrtsvorwahl)] [(apTelefonDurchwahl)]". A person's phone is NOT a single property: BayVIS.Ansprechpartner.Details only exposes apTelefonLandvorwahl / apTelefonOrtsvorwahl / apTelefonAnlage / apTelefonDurchwahl (there is NO "phone"/"telefon"/"telephone" property), so assemble the phone text from those placeholders. NEVER read a person's phone/e-mail from BayVIS.Behoerden.Details — that authority object has NO phone and NO postal address (only bezeichnungBehoerde, behoerdenart, behoerdengruppe, bezeichnung, email, id, sortierreihenfolge, logo, behoerdeZuordnungen, behoerdenGebaeudeZuordnungen); postal/building ADDRESSES live on BayVIS.Behoerden.Details.Gebaeude (hausanschriftStrasse/hausanschriftOrt/hausanschriftPLZ and postanschrift*). Use Data.Join ONLY when the needed values genuinely live in DIFFERENT detail objects (e.g. a building's postal address AND a person's data) — then data-cb-replacements="{ Data.Join > { <first detail-object EP> } ; { <second detail-object EP> } }" and reference each value by the ACTUAL property name of its own object (mind that Data.Join later objects override same-named properties). Never emit one HTML.Text.Injector element per value (each re-resolves its own EP); ONE Mapper element resolves its data-cb-replacements ONCE.
- data-cb-property is REQUIRED on HTML.Text.Mapper and names the RUNTIME property of the target element into which the mapped text is written: an XSpan → "innerHTML" (the XSpan's template text is stored in its Formcycle rtevalue property); an XTextField / XTextArea → "value" (template stored in the field's Formcycle value property). NEVER use "rtevalue" as the data-cb-property value — rtevalue is only the Formcycle JSON storage key of an XSpan's content, NOT a runtime DOM property of the rendered element.
- WHICH BAYVIS EP TO USE — match the EP to the SUBJECT the user actually names: BayVIS.Behoerden.* (BayVIS.Behoerden.ID / BayVIS.Behoerden.Details / BayVIS.Behoerden.Details.Gebaeude / BayVIS.Behoerden.Gebaeude.ID) may ONLY be used when the request NAMES a Behörde/authority (e.g. "Amt für Digitales") that the Behoerden.ID resolver can look up. NEVER invent an authority name to make it work — "BayVIS" is the SYSTEM (the data source), NOT an authority, so { BayVIS.Behoerden.ID > Bayvis } is meaningless and cannot resolve. When the request names only a PERSON/employee and NO Behörde (e.g. "die BayVIS-Kontaktdaten und den Namen des Mitarbeiters Salvatore Callari" — the resolvable contact values are the person's), use ONLY { BayVIS.Ansprechpartner.Details > { I > 0 ; { BayVIS.Ansprechpartner.ID > <person name> } } } — do NOT add any BayVIS.Behoerden.* EP and do NOT put an invented authority into data-cb-replacements.
- NEVER fill a BayVIS-derived contact field with invented/literal text — do NOT write "Bayvis Straße 1, 12345 Musterstadt", "kontakt@bayvis.de", "+49 30 12345678" or similar into rtevalue/value. Any contact data that must come from BayVIS (the employee's e-mail → [(email)] / [(apEmail)], phone → the apTelefon* parts, name → [(vorname)] [(nachname)]) is obtained ONLY from the actual EP { BayVIS.Ansprechpartner.Details > { I > 0 ; { BayVIS.Ansprechpartner.ID > <person name> } } } and rendered through HTML.Text.Mapper [(property)] placeholders with data-cb-property set. A contact field that hard-codes made-up data instead of wiring the EP is a FAIL — it shows wrong/stale data instead of resolving the person's real contact data at runtime.
- PERSON'S FULL RECORD = ONE EP — BayVIS.Ansprechpartner.Details is the SINGLE source for EVERYTHING about a person/employee: their name (anrede, vorname, nachname, funktion, stellenbezeichnung, zimmer) AND ALL contact data of that person (email / apEmail and the phone parts apTelefonLandvorwahl / apTelefonOrtsvorwahl / apTelefonAnlage / apTelefonDurchwahl), plus their references (behoerdeId, behoerdeBezeichnung, gebaeudeId, gebaeudeBezeichnung, ansprechpartnerId). Whenever the request concerns a PERSON — whether it asks for the name, the e-mail, the phone or any other contact data of that person — use ONLY { BayVIS.Ansprechpartner.Details > { I > 0 ; { BayVIS.Ansprechpartner.ID > <name> } } }. BayVIS.Behoerden.Details contains NONE of a person's data (it is only the authority's own metadata) and may be used ONLY when the prompt actually names a Behörde.

Authoritative examples:
- Contact details from a global variable holding the contact ID: { BayVIS.Ansprechpartner.Details > { V > BayVIS_WeitereAnsprechpartner } }
- First contact matching a name: { I > 0 ; { BayVIS.Ansprechpartner.ID > Salvatore Callari } }
- Contact property by name: { BayVIS.Ansprechpartner.Details > { I > 0 ; { BayVIS.Ansprechpartner.ID > Salvatore Callari } } ; nachname }
- Authority property by name: { BayVIS.Behoerden.Details > { I > 0 ; { BayVIS.Behoerden.ID > Amt für Digitales } } ; bezeichnung }
- Building IDs of an authority by name (returns an ARRAY): { BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde } } } }
- Building details of an authority (authority ID and building ID are separate `;` parameters, BOTH resolved via I): { BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde } } } ; { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde } } } } } }
- First building's street of an authority by name: { BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; { BayVIS.Behoerden.ID > Amt 44 } } ; { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > Amt 44 } } } } ; hausanschriftStrasse }
- Combine two EP results into one text with Data.Join: { Data.Join > { BayVIS.Ansprechpartner.Details > { I > 0 ; { BayVIS.Ansprechpartner.ID > { V > BayVIS_Hauptansprechpartner } } } } ; { BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde } } } ; { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde } } } } } } }
- Contact data stored as a GLOBAL VARIABLE and displayed ("Kontaktdaten von ... als globale Variable hinterlegen"): add {"name":"SALVATORE_CALLARI_CONTACT","aliasname":"SALVATORE_CALLARI_CONTACT","serveronly":false,"value":"Salvatore Callari"} to the top-level "variables" array (the value is the PLAIN NAME — never an EP expression, never the whole Details chain). BayVIS.Ansprechpartner.Details returns a JSON OBJECT, so display it with HTML.Text.Mapper — NOT HTML.Text.Injector: wire the element with data-cb-func="HTML.Text.Mapper" + data-cb-replacements="{ BayVIS.Ansprechpartner.Details > { V > SALVATORE_CALLARI_CONTACT } }" + data-cb-property (e.g. "value" on an XTextField/XTextArea or "innerHTML" on an XSpan). The [(property)]-style placeholders in the element's template then name the ACTUAL object properties, e.g. "[(vorname)] [(nachname)] — [(email)], Tel. 0[(apTelefonOrtsvorwahl)] [(apTelefonDurchwahl)]" (a single Details object, so NO { I > 0 ; ... } wrapper). The V EP is NESTED inside BayVIS.Ansprechpartner.Details — never a standalone "{ V > SALVATORE_CALLARI_CONTACT }", and never store "{ BayVIS.Ansprechpartner.Details > ... }" in the variable.
- Building details stored as a GLOBAL VARIABLE and displayed ("Details zum Gebäude ... als globale Variable hinterlegen"): add {"name":"BUILDING_AMT44","aliasname":"BUILDING_AMT44","serveronly":false,"value":"Amt 44"} to the "variables" array (the PLAIN authority name — no "{" / "}"), then display with HTML.Text.Mapper (the building Details EP also returns an OBJECT). Wire the element with data-cb-func="HTML.Text.Mapper" + data-cb-replacements="{ BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; { BayVIS.Behoerden.ID > { V > BUILDING_AMT44 } } } ; { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > { V > BUILDING_AMT44 } } } } } }" + data-cb-property, and use [(property)] placeholders (e.g. [(hausanschriftStrasse)]) in its template. BayVIS.Behoerden.Details.Gebaeude REQUIRES BOTH the authority ID AND the building ID (here both must be resolved via I because the inner .ID EPs return ARRAYS) — never emit it with only one parameter.
- CORRECT vs WRONG (global variable for BayVIS data): CORRECT — variable {"name":"SALVATORE_CALLARI_CONTACT","aliasname":"SALVATORE_CALLARI_CONTACT","serveronly":false,"value":"Salvatore Callari"} + replacement "{ BayVIS.Ansprechpartner.Details > { V > SALVATORE_CALLARI_CONTACT } }". WRONG — variable {"name":"SALVATORE_CALLARI_CONTACT","aliasname":"SALVATORE_CALLARI_CONTACT","serveronly":false,"value":"{ BayVIS.Ansprechpartner.Details > { I > 0 ; { BayVIS.Ansprechpartner.ID > Salvatore Callari } } }"} + replacement "{ V > SALVATORE_CALLARI_CONTACT }" — the full data EP sits in the variable and the standalone V only prints that raw EP text (V does NOT re-resolve), so NO BayVIS data is fetched.

### BayVIS.Behoerden

Directory EP — REQUIRES a property name parameter: { BayVIS.Behoerden > bezeichnung } (not bare { BayVIS.Behoerden }).

Valid property values: behoerdenart, behoerdengruppe, bezeichnung, email, id, sortierreihenfolge.

### BayVIS.Behoerden.ID

ID-resolver EP — takes a plain STRING authority name and returns an ARRAY of matching numeric IDs. To get a single ID: { I > 0 ; { BayVIS.Behoerden.ID > <authority name> } }. ONLY usable when the prompt NAMES a real Behörde/authority — never invent one ("BayVIS" is the system, not an authority).

### BayVIS.Behoerden.Details

Takes a NUMERIC authority ID (NOT a name). Returns the authority METADATA object with EXACTLY these properties: bezeichnungBehoerde, behoerdenart, behoerdengruppe, bezeichnung, email, id, sortierreihenfolge, logo, behoerdeZuordnungen, behoerdenGebaeudeZuordnungen. It has NO phone and NO postal address — a person's phone/e-mail lives in BayVIS.Ansprechpartner.Details, a building/postal address lives in BayVIS.Behoerden.Details.Gebaeude.

Also accepts an OPTIONAL second parameter (separated by `;`) — a property name to extract just that specific field: { BayVIS.Behoerden.Details > <authority ID> ; bezeichnung }.

### BayVIS.Behoerden.Details.Gebaeude

Takes TWO NUMERIC parameters separated by `;`: param 1 = authority ID, param 2 = building ID. An optional third `;` parameter is a property to extract (e.g. hausanschriftStrasse). Returns the building OBJECT with these properties: bezeichnung, hausanschriftPLZ, hausanschriftOrt, hausanschriftStrasse, postanschriftPLZ, postanschriftOrt, postanschriftStrasse, logo (no phone here either). Obtain a building ID from the Gebaeude.ID EP (optionally via { I > 0 ; ... } to pick the first).

CRITICAL — THE BUILDING OBJECT HAS NO HOUSE-NUMBER PROPERTY: there is NO `hausanschriftHausnummer` (and NO `hausnummer` / `postanschriftHausnummer`) — a placeholder like [(hausanschriftHausnummer)] CANNOT be resolved. The BayVIS street field `hausanschriftStrasse` ALREADY contains street AND house number combined (e.g. "Maximilianstraße 1"), exactly like `postanschriftStrasse`. Render a building's Hausanschrift address as "[(hausanschriftStrasse)], [(hausanschriftPLZ)] [(hausanschriftOrt)]" — NEVER append a separate [(hausanschriftHausnummer)] / [(hausnummer)] after the street.

### BayVIS.Behoerden.Gebaeude.ID

Takes a NUMERIC authority ID and returns an ARRAY of its building IDs. By authority name: { BayVIS.Behoerden.Gebaeude.ID > { BayVIS.Behoerden.ID > <authority name> } }. To pick one building: { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > <authority ID> } }.

### BayVIS.Ansprechpartner

Directory EP — REQUIRES a property name parameter: { BayVIS.Ansprechpartner > nachname } (not bare { BayVIS.Ansprechpartner }, and NEVER a person's name).

Valid property values: anrede, vorname, nachname, funktion, stellenbezeichnung, email, website, zimmer, sortierreihenfolge, behoerdeId, behoerdeBezeichnung, gebaeudeId, gebaeudeBezeichnung, ansprechpartnerId.

### BayVIS.Ansprechpartner.ID

ID-resolver EP — takes a plain STRING contact name and returns an ARRAY of matching numeric IDs. First hit: { I > 0 ; { BayVIS.Ansprechpartner.ID > Salvatore Callari } }.

### BayVIS.Ansprechpartner.Details

Takes a NUMERIC contact ID (NOT a name); an optional second `;` parameter is a property. Resolve the name first, then fetch: { BayVIS.Ansprechpartner.Details > { I > 0 ; { BayVIS.Ansprechpartner.ID > <contact name> } } ; <property> }.

Returns a SINGLE JSON OBJECT of that contact with EXACTLY these properties: anrede, vorname, nachname, funktion, stellenbezeichnung, email, website, zimmer, behoerdeId, behoerdeBezeichnung, gebaeudeId, gebaeudeBezeichnung, ansprechpartnerId, apTelefonLandvorwahl, apTelefonOrtsvorwahl, apTelefonAnlage, apTelefonDurchwahl, apEmail. There is NO "phone"/"telefon"/"telephone" property — a person's phone is split across the four apTelefon* parts (Landvorwahl / Ortsvorwahl / Anlage / Durchwahl), so map those parts to render the phone; the person's plain e-mail is "email" (an alias copy "apEmail" also exists). Because it returns ONE object, do NOT wrap it in the I EP unless it is fed by an array-returning inner EP. When the contact ID comes from a SINGLE value (e.g. a global variable), use it directly — { BayVIS.Ansprechpartner.Details > { V > <NAME> } } — NO { I > 0 ; ... }. To display the object's properties in a template use HTML.Text.Mapper with data-cb-replacements and [(property)] placeholders (e.g. [(vorname)] [(nachname)]) — HTML.Text.Injector is only for injecting ONE plain string.
