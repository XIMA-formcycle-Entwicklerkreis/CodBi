# CodBi Element Placeholders (EPs)

EP syntax and chaining rules, individual EP descriptions.

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

## V (Variable)

Resolves a global variable by name. Example: "{ V > BayVIS_WeitereAnsprechpartner }"

## I (Index)

Takes a 0-based index and a DOM EP result, returns the element at that index.

## F (Find)

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

BayVIS Detail EPs expect NUMERIC IDs, not names:
- BayVIS.Behoerden.Details, BayVIS.Behoerden.Details.Gebaeude, BayVIS.Behoerden.Gebaeude.ID, BayVIS.Ansprechpartner.Details all take numeric IDs.
- The ID-resolver EPs take plain STRING names: BayVIS.Behoerden.ID (authority name), BayVIS.Ansprechpartner.ID (contact name).
- The directory EPs REQUIRE a property name parameter: BayVIS.Behoerden > bezeichnung (not bare { BayVIS.Behoerden }), BayVIS.Ansprechpartner > nachname.

BayVIS.Behoerden valid property values: behoerdenart, behoerdengruppe, bezeichnung, email, id, sortierreihenfolge.
BayVIS.Ansprechpartner valid property values: anrede, vorname, nachname, funktion, stellenbezeichnung, email, website, zimmer, sortierreihenfolge, behoerdeId, behoerdeBezeichnung, gebaeudeId, gebaeudeBezeichnung, ansprechpartnerId.

BayVIS.Behoerden.Details.Gebaeude takes TWO numeric parameters: param 1 = authority ID, param 2 = building ID. To look up building details by authority name, chain BOTH IDs.

BayVIS.Behoerden.Details returns authority METADATA (name, email, type), NOT building addresses. For BUILDING details use BayVIS.Behoerden.Details.Gebaeude.

BayVIS.Behoerden.Details also accepts an OPTIONAL second parameter: a property name to extract just that specific field.
