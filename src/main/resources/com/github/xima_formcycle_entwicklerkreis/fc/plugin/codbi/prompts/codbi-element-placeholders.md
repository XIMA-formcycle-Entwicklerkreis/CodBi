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

## V

Resolves a global variable by name. Example: "{ V > BayVIS_WeitereAnsprechpartner }"

## I

Takes a 0-based index and a DOM EP result, returns the element at that index.

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

BayVIS Detail EPs expect NUMERIC IDs, not names. The ID-resolver EPs take plain STRING names. The directory EPs REQUIRE a property name parameter.

### BayVIS.Behoerden

Directory EP — REQUIRES a property name parameter: { BayVIS.Behoerden > bezeichnung } (not bare { BayVIS.Behoerden }).

Valid property values: behoerdenart, behoerdengruppe, bezeichnung, email, id, sortierreihenfolge.

### BayVIS.Behoerden.ID

ID-resolver EP — takes a plain STRING authority name and returns the numeric ID. Example: { BayVIS.Behoerden.ID > <authority name> }.

### BayVIS.Behoerden.Details

Takes a NUMERIC authority ID. Returns authority METADATA (name, email, type), NOT building addresses. For BUILDING details use BayVIS.Behoerden.Details.Gebaeude.

Also accepts an OPTIONAL second parameter: a property name to extract just that specific field.

### BayVIS.Behoerden.Details.Gebaeude

Takes TWO numeric parameters: param 1 = authority ID, param 2 = building ID. To look up building details by authority name, chain BOTH IDs.

### BayVIS.Behoerden.Gebaeude.ID

Takes NUMERIC IDs.

### BayVIS.Ansprechpartner

Directory EP — REQUIRES a property name parameter: { BayVIS.Ansprechpartner > nachname } (not bare { BayVIS.Ansprechpartner }).

Valid property values: anrede, vorname, nachname, funktion, stellenbezeichnung, email, website, zimmer, sortierreihenfolge, behoerdeId, behoerdeBezeichnung, gebaeudeId, gebaeudeBezeichnung, ansprechpartnerId.

### BayVIS.Ansprechpartner.ID

ID-resolver EP — takes a plain STRING contact name and returns the numeric ID. Example: { BayVIS.Ansprechpartner.ID > <contact name> }.

### BayVIS.Ansprechpartner.Details

Takes a NUMERIC contact ID.
