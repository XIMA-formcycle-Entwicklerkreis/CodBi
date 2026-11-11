# CodBi Element Placeholders (EPs)

EP syntax and chaining rules, individual EP descriptions.

## EP INVOCATION SYNTAX (CRITICAL)

Every Element Placeholder (EP) — built-in or custom — is invoked by writing the EP placeholder itself as the value, in this exact form:

{ EPName > Param1 ; Param2 ; Param3 ; ... }

- EPName is the exact element placeholder name (dots, case-sensitive).
- Parameters are separated by semicolons; use trailing semicolons for unused optional parameters.
- PARAMETER ORDER IS FIXED BY THE EP — NEVER BY THE WORD ORDER OF THE REQUEST (language-agnostic, ANY language): the EP's DECLARED parameter order decides which value goes into which `;` slot. NEVER fill the slots in the order in which the request happens to mention them. In every Details EP the IDENTIFIER slot is FIRST and the PROPERTY (or format/flag) slot follows — even when the sentence names the property first: "die Mail-Adresse des Amts X" / "the e-mail address of authority X" → id first, then `email`; "die Bezeichnung der Behörde X" → id first, then `bezeichnung`. Reported failure — WRONG: { BayVIS.Behoerden.Details > email ; { BayVIS.Behoerden.ID > Amt für Digitales } } (the property sits in the id slot, which the EP validates as a numeric id → no data); CORRECT: { BayVIS.Behoerden.Details > { I > 0 ; { BayVIS.Behoerden.ID > Amt für Digitales } } ; email }. The same fixed-order rule holds for EVERY multi-parameter EP, e.g. { Date.FromString > <string> ; <format> }, { AI.LLAMA.STD.QA > <question> ; <UseInternet> ; … }, { BayVIS.Behoerden.Details.Gebaeude > <authority id> ; <building id> ; <property> }: a swapped slot never "still works" — it silently returns nothing or the wrong value.
- Parameter values are RAW strings — never add quotes around them.
- An EP placeholder IS the value. NEVER represent an EP's data as a JSON object or array literal. The first token inside the braces is the EP's NAME. `data.join` is ONLY an example — ANY EP id works (built-in like AI.LLAMA.STD.QA, OpenPLZ.Localities, or any custom EP defined in the local API doc manager). The pattern is always `{ <any EP id> > Param1 ; Param2 ; ... }`. For example `{"planet":"Pluto","saturation":0.5}` is WRONG; `{ data.join > Param1 ; Param2 }` is CORRECT.

When you need the data an EP provides (e.g. in a Sys.Log.Console data-cb-Data parameter), write the EP placeholder with its parameters as the value. Do not invent JSON objects or arrays for EP results — the placeholder itself is the result.

## EP Chaining

Element Placeholders (EPs) can be chained with > syntax to pass one EP's result as input to another EP. This works in ANY data-cb-* parameter that accepts EPs (e.g. data-cb-Data, data-cb-replacement, data-cb-Values, data-cb-replacements).

Example: "{ BayVIS.Ansprechpartner.Details > { V > VariableName } }" first resolves V to get an ID, then fetches the contact details. The inner EP is always resolved first and its result becomes the parameter for the outer EP.

CRITICAL — EP parameter values are raw strings without quotes. Write { BayVIS.Ansprechpartner.ID > Salvatore Callari } NOT { BayVIS.Ansprechpartner.ID > "Salvatore Callari" }. Quotes are part of the EP syntax itself (the { } braces), do NOT add extra quotes around parameter values.
CRITICAL — A LITERAL NAME IS NOT A VARIABLE: a person's/authority's NAME is NEVER a global variable — variable names NEVER contain spaces. The V EP takes ONLY a GLOBAL VARIABLE NAME (e.g. SALVATORE_CALLARI_CONTACT, BayVIS_Behoerde). NEVER write { BayVIS.Ansprechpartner.Details > { V > "Salvatore Callari" } } or { ... > { V > Salvatore Callari } } — the correct form is { BayVIS.Ansprechpartner.Details > Salvatore Callari } (the Details EP resolves the name itself). V is used ONLY when the user explicitly asked for a global variable AND it exists in the top-level "variables" array.

## AI.LLAMA.STD.QA

This EP queries an AI to answer a question. USE for weather/AI/knowledge queries AND for logging an AI answer to the browser console (Sys.Log.Console data-cb-Data). It needs NO uploaded document — analyzing an uploaded file is the AI.LLAMA.STANDARD.QA functionality. Parameter order (exact): Param[1]=question, Param[2]=UseInternet ("true"), Param[3]=Location, Param[4]=Language, Param[5]=ResponseLanguage, Param[6]=Specialist, Param[7]=FilterResults, Param[8]=JsonParse. CRITICAL: keep every unused slot as a trailing semicolon — an omitted slot SHIFTS all later parameters. This EP is a RUNTIME AI answer; it is only usable when the environment has a suitable AI engine. Do NOT make a live-data widget depend on it — prefer self-contained JavaScript that fetches a CORS-ENABLED endpoint (see the custom-JavaScript rules).
Example: "{ AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;; }"
SPECIALIST (Param[6]): when the request names an AI specialist ("mit Cerebras", "des Spezialisten Cerebras", "von Cerebras beantworten lassen", "let Cerebras answer"), put that exact name into Param[6] — ONLY a name listed in the "CONFIGURED AI SPECIALISTS" block of the system prompt. The specialist for THIS EP is an EP PARAMETER; data-cb-Specialist is the attribute of an AI functionality (ai.llama.standard.qa/txtqa/txtverify/chat) and is NEVER used for an EP. Example: "{ AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true ; ; ; ; Cerebras }" (question; UseInternet; Location; Language; ResponseLanguage; Specialist). When no specialist is named (or the configured list is missing), leave the slot empty as in the first example — NEVER ask the user for a specialist name and NEVER invent one.

## Date.Today

Delivers TODAY as a DATE OBJECT — an OBJECT, never a formatted string. It is therefore the RIGHT input for every EP that needs an object (`JSON.Path`, `Date.Arithmetic`) and the WRONG input for every EP that needs a plain `dd.MM.yyyy` STRING (`Date.Weekends`, `Date.Holidays`).

Supports arithmetic directly — do NOT wrap it in Date.Arithmetic. Parameters (optional, case-insensitive): `NOW` = today's date, or arithmetic tokens `<+|-><number><d|m|y>` applied to today (`+1d` = tomorrow, `-1m` = one month earlier, `+2y` = in two years); ONE token per `;` slot, several may be combined (`{ Date.Today > -1d ; +2m }`). NO parameter at all = today (`{ Date.Today }`); never write an empty arithmetic slot (`{ Date.Today > }`).

READING A MEMBER OF TODAY'S DATE ("`getMonth()` von dem heutigen Tag", "das Jahr von heute", "den Wochentag von heute"): today's date is the OBJECT, so the member is taken with `JSON.Path` — `{ JSON.Path > { Date.Today > NOW } ; getMonth() }`. There is no "date method" EP and `getMonth()` on its own is neither a value nor an EP.

RETURN TYPE: a Date OBJECT (not a string). To DISPLAY something derived from it, read the member with `JSON.Path` (e.g. `getFullYear()`, `toString()`) or format it with `HTML.Text.Mapper`.

## Date.Arithmetic

Parses a date STRING and then SHIFTS it by days/months/years in ONE step — use it when a date must be moved ("in 3 Tagen", "3 days after …", "das Datum … plus/minus …", "a week before …", "a month later"). Parameters: Param[1] = the date STRING (in the format the EP can parse); Param[2] = EITHER the input FORMAT (e.g. `DD/MM/YYYY`) OR the FIRST arithmetic operation — the EP decides by itself: a 2nd parameter containing `+` or `-` is treated as arithmetic, so the format is then skipped and the format defaults; Param[3]+ = further arithmetic operations, ONE per `;` slot. Arithmetic tokens are `<+|-><number><d|m|y>`: `+1d` (one day later), `-2m` (two months earlier), `+10y`. Examples: 'in 3 Tagen ab 01.12.2026' / '3 days after 01.12.2026' → `{ Date.Arithmetic > 01.12.2026 ; +3d }`; with a non-German format '01/12/2026 plus one month' → `{ Date.Arithmetic > 01/12/2026 ; DD/MM/YYYY ; +1m }`; several shifts → `{ Date.Arithmetic > 01.01.1978 ; -1d ; +2m ; -10y }`.

RETURN TYPE: a DATE OBJECT (not a string) — so it must not be fed into a string-parameter EP (e.g. `Date.Weekends`, `Date.Holidays`); to DISPLAY the shifted date use `HTML.Text.Mapper`/`JSON.Path` on the object. For pure parsing WITHOUT a shift prefer `Date.FromString`. Today's date does not need this EP — `{ Date.Today > +3d }` is enough.

## Date.FromString

Turns a date STRING into a date so it can be compared, shifted or formatted — use it for any prompt about converting/parsing a date ("01.12.2026 als Datum", "parse this date", "das Datum aus dem Text", "turn … into a date"). Parameters: Param[1] = the date STRING (raw, unquoted); Param[2] OPTIONAL = the input FORMAT (e.g. `DD/MM/YYYY`, `YYYY-MM-DD`) — when omitted, `DD.MM.YYYY` is assumed. Example: "{ Date.FromString > 01.12.1978 }" → the date 1 December 1978; "{ Date.FromString > 12/01/2026 ; DD/MM/YYYY }" → 12 January 2026.

RETURN TYPE: an ARRAY holding ONE DATE OBJECT (`Array<Date|null>`), not a displayable string. Take the date with `{ I > 0 ; { Date.FromString > … } }` when a single Date is required, and never pass the result into a string-parameter EP (`Date.Weekends`, `Date.Holidays`, `BayVIS.Behoerden.ID`, …).

## Date.Holidays

Retrieves GERMAN holidays ("Feiertage") for the requested years/states from API-Feiertage.de. The EP id is ALWAYS `Date.Holidays` — NEVER invent or translate it (there is NO `Feiertage` EP). THE YEAR CANNOT BE GIVEN AS AN EXPLICIT NUMBER (e.g. `2026`) — the code only recognizes `THIS_YEAR` (current year) and `THIS_YEAR +/- N` (relative to the current year, e.g. `THIS_YEAR + 1` = next year); any other token is treated as a state abbreviation. Other parameters (order/case-insensitive): a German state abbreviation (bw, by, be, bb, hb, hh, he, mv, ni, nw, rp, sl, sn, st, sh, th), `Friedensfest` (Augsburg), `KATHOLISCH`. Examples: 'Feiertage dieses Jahr' → `{ Date.Holidays > THIS_YEAR }`; 'Feiertage nächstes Jahr' → `{ Date.Holidays > THIS_YEAR + 1 }`; 'Feiertage Bayern dieses Jahr' → `{ Date.Holidays > by ; THIS_YEAR }`. MULTIPLE year tokens may be passed in ONE invocation (parameters separated by `;`), e.g. 'Feiertage dieses und nächstes Jahr' → `{ Date.Holidays > THIS_YEAR ; THIS_YEAR + 1 }`. When the user requests a SPECIFIC calendar year (e.g. 'Feiertage 2026'), do NOT drop the field and do NOT use that specific year — explain that only RELATIVE years are supported and ASK which to use, offering exactly THREE options that may be selected MULTIPLE at once: THIS_YEAR (current year), THIS_YEAR + 1 (next year), THIS_YEAR - 1 (last year). Multiple selected years are combined in one invocation separated by `;` (e.g. `{ Date.Holidays > THIS_YEAR ; THIS_YEAR + 1 }`). The Feiertage field shows the EP result via HTML.Text.Injector: set data-cb-func="HTML.Text.Injector", data-cb-property="value", data-cb-replacement="{ Date.Holidays > <chosen year> }" AND the field's `value` to the placeholder `[[INJECTOR_REPLACEMENT]]` — without the placeholder nothing is injected.

### Date.Holidays — THE YEAR TOKENS ARE EXACT AND UPPERCASE

The year token is ALWAYS `THIS_YEAR` (optionally `THIS_YEAR + N` / `THIS_YEAR - N`), written EXACTLY in UPPERCASE with the underscore. Spellings such as `thisYear`, `THISYEAR`, `This_Year`, `currentYear`, `nextYear`, `naechstesJahr` or a concrete year (`2026`) are INVALID: the EP cannot read them as a year and SILENTLY treats the token as a German STATE abbreviation, so the request returns wrong data with NO error. The "order/case-insensitive" note above applies ONLY to the state/flag parameters (bw, by, Friedensfest, KATHOLISCH) — NEVER to the year tokens.

Count the YEARS the request names and pass ONE parameter per year, separated by `;`: 'Feiertage dieses und nächstes Jahr' / 'holidays this and next year' → `{ Date.Holidays > THIS_YEAR ; THIS_YEAR + 1 }` — TWO parameters, because a single year token covers only ONE year. When a state is named it goes FIRST, then the years: `{ Date.Holidays > by ; THIS_YEAR ; THIS_YEAR + 1 }`.

### Date.Holidays — SEVERAL STATES, AND THE IDS THAT DO NOT EXIST

The STATES/REGIONS named in a request are PARAMETERS of `Date.Holidays` — one `;` slot per state, never part of the EP's NAME and never a property: 'die diesjährigen Feiertage von Bayern und Hessen' / 'this year's public holidays in Bavaria and Hesse' / 'les jours fériés de cette année en Bavière et en Hesse' (ANY language) → `{ Date.Holidays > by ; he ; THIS_YEAR }` (two states = two parameters, then the year; order is irrelevant, case-insensitive). Reported failure — WRONG: `{ Holiday.BavariaAndHesse > list }` — the id `Holiday.BavariaAndHesse` does NOT exist (the EP catalogue is FIXED; `Date.Holidays` is the ONLY holiday EP) and `list` is not a parameter of it. CORRECT: `{ Date.Holidays > by ; he ; THIS_YEAR }`. NEVER translate the id ("Feiertage" is NOT an EP) and NEVER encode a state, region, country or topic into an id — if you are unsure whether an EP accepts a value, REQUEST its details instead of inventing an id or a property. The EP returns an ARRAY of holiday names and has NO property parameter; render it with HTML.Select.Injection (Values), HTML.Text.Injector combined with Sorted/Unique, or JSON.Path.

## Date.Weekends

Returns the WEEKEND dates (Saturday and Sunday) of a date range as an ARRAY of `dd.MM.yyyy` STRINGS. Its arguments are PLAIN STRINGS in `dd.MM.yyyy` — the EP validates them against a date regex, so a **DATE OBJECT is rejected**: NEVER nest `{ Date.Today > … }`, `{ Date.FromString > … }` or `{ Date.Arithmetic > … }` into it. ONE parameter = the END of the range (the range then starts TODAY); TWO parameters = begin `;` end (param 1 = START, param 2 = END — the START must be the EARLIER date; a reversed pair yields an EMPTY list). Examples: 'Wochenenden bis 01.12.2026' / 'weekends until 01.12.2026' → `{ Date.Weekends > 01.12.2026 }`; 'Wochenenden im Dezember 2026' / 'weekends in December 2026' → `{ Date.Weekends > 01.12.2026 ; 31.12.2026 }`.

Reported failure — WRONG: `{ Date.Weekends > { Date.Today >  } ; { Date.FromString > 01.12.2026 ; dd.MM.yyyy } }` (two Date OBJECTS in string parameters, and a `Date.Today` with an EMPTY arithmetic parameter). CORRECT: `{ Date.Weekends > 01.12.2026 }`.

Also: a `{ Date.Today > }` with an empty arithmetic parameter is invalid on its own — `{ Date.Today }` is enough (add arithmetic only when a shift is wanted, e.g. `{ Date.Today > +1d }`). When a RELATIVE range is requested ("die nächsten 3 Monate", "next 3 months"), do NOT chain EPs into the string slot — pass the concrete `dd.MM.yyyy` strings or leave the end out entirely (one parameter = until that date).

## JSON.Path

Takes a MEMBER out of an OBJECT: `{ JSON.Path > <object> ; <dotted path> }`. The parameter order is FIXED — the OBJECT first, the PATH second (never the reverse).

- A path segment written as a plain name READS A PROPERTY (`name`, `email`, `id`, `value`).
- A path segment written as `name()` — ROUND BRACKETS, NO SPACE — CALLS A PARAMETERLESS METHOD (`getMonth()`, `getFullYear()`, `toISOString()`, `toString()`). Without the brackets the method object itself would be returned instead of its result.
- Segments are separated by DOTS (`address.city`); every step must exist — a path interrupted by `undefined`/`null` throws a CodBiError, so never guess a member name.
- The result is whatever the property/method yields: a Date method returns a NUMBER or STRING (e.g. `getMonth()` is 0-based — 0 = January), not a date object.

This is THE EP for "call a method / read a property of an object", in ANY language ("getMonth() von heute", "the year of today", "die Eigenschaft … von …", "extract <property>"). The object may itself be produced by another EP — that is normal EP chaining, the INNER EP resolves first.

Examples: `{ JSON.Path > { Date.FromString > 01.12.1978 } ; toString() }` (a Date → its string form); `{ JSON.Path > { Date.Today > NOW } ; getMonth() }` (the number of the current month); `{ JSON.Path > { OpenPLZ.Streets > de ; Karolinen ; 91522 } ; name }` (the `name` property of that result).

Reported failure — WRONG: `data-cb-Data = getMonth()` for "Gib in der Konsole getMonth() von dem heutigen Tag aus." — `getMonth()` alone is neither a value nor an EP: there is NO object to call the method on. CORRECT: `{ JSON.Path > { Date.Today > NOW } ; getMonth() }` — `Date.Today` with `NOW` supplies TODAY as a date OBJECT, and `getMonth()` (with brackets) is the parameterless method called on it.

CRITICAL — ALL OpenPLZ EPs (OpenPLZ, OpenPLZ.Streets, OpenPLZ.Localities, OpenPLZ.OrganizationalUnits, OpenPLZ.TextSearch) return Array<object>. To extract a specific property (e.g. street names), wrap the EP in JSON.Path: "{ JSON.Path > { OpenPLZ.Streets > de ; Karolinen ; 91522 } ; name }".

## LDAP.Find

Searches the LDAP / Active Directory and returns the matching entries as an ARRAY. Parameters (FIXED order):

- Param[1] = the LOGICAL COMBINING MODE: the literal token `AND` or `OR` (case-insensitive). It is NOT a word describing the query — `filter`, `query`, `where`, `suche`, `conditions`, `mode` or an `attribute = value` pair are INVALID in this slot (the EP validates it against `AND|OR`; anything else falls back to AND and silently returns the wrong matches). An EMPTY slot means AND.
- Param[2] = the CONDITIONS: one `attribute = value` pair per condition, ALL of them in this ONE parameter, separated by `|` (e.g. `givenName = Salvatore | sn = Callari`). Spaces around `=` are irrelevant.
- Param[3] OPTIONAL = the LDAP request url — OMIT it when the installation has one configured (see the "LDAP CONFIGURATION" block); a url the request names explicitly is always wired here.

DECIDING THE MODE BY MEANING (ANY language): ALL conditions must hold — "and", "und", "sowohl … als auch", "beide Bedingungen", "match both/all", "beides" — use `AND`; ANY one is enough — "or", "oder", "entweder … oder", "mindestens eine", "either", "any of them" — use `OR`. When the request just lists several `attribute = value` pairs without naming a connector, use `AND`.

Examples: 'die Mail-Adresse von Salvatore Callari aus dem LDAP' → `{ JSON.Path > { I > 0 ; { LDAP.Find > AND ; sn = Callari } } ; mail }` (each entry carries givenName, sn, mail, title, department, telephoneNumber, sAMAccountName, cn, displayName); both name parts named → `{ LDAP.Find > AND ; givenName = Salvatore | sn = Callari }`.

Reported failure — WRONG: `{ LDAP.Find > filter ; givenName = Salvatore | sn = Callari }` — "filter" is not a mode. CORRECT: `{ LDAP.Find > AND ; givenName = Salvatore | sn = Callari }`.

NEVER put a condition into Param[1] and NEVER spread the conditions over several parameters — EVERY pair belongs in Param[2], joined by `|`.

## Data.Join

Merges the properties of multiple EP results into one object. Use Data.Join when the prompt asks to combine/join/merge/zusammen data from multiple EPs.

## Data.CSV

Wraps another EP result as CSV output. Use only when the prompt explicitly mentions CSV.

## Net.URL

Fetches content from a URL client-side, inside the BROWSER of the form visitor (a jQuery `$.get`). CONSEQUENCE: it only works for a URL that is PUBLICLY reachable AND returns CORS headers (Access-Control-Allow-Origin) — the browser SILENTLY BLOCKS a cross-origin response without them, so NOTHING is injected. A DWD/opendata URL such as https://opendata.dwd.de/weather/forecast/7day can therefore NEVER work (that endpoint does not exist either, and it sends no CORS headers). NEVER use Net.URL with a guessed or invented URL — only with a URL the USER explicitly provided or that the web-access tool verified. For live data (weather, prices, news, …) prefer self-contained JavaScript in the element that fetches a CORS-ENABLED endpoint (verified endpoints and examples are in the custom-JavaScript rules). NEVER wire `Net.URL` for weather/forecast/live data and NEVER ask the user for an API URL or an endpoint — that question is ALWAYS a FAIL. Those requests are solved with self-contained JavaScript in the element's own HTML-taking property against the VERIFIED CORS-enabled endpoints: `https://api.open-meteo.com/v1/forecast?latitude=LAT&longitude=LON&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FBerlin&forecast_days=7` (7-day forecast), `https://geocoding-api.open-meteo.com/v1/search?name=CITY&count=1&language=de` (city → latitude/longitude) and `https://api.brightsky.dev/weather?lat=LAT&lon=LON&date=YYYY-MM-DD` (DWD open data via Bright Sky). A `Net.URL` value like `https://example.com/...` is an invented URL and is INVALID. Net.URL also returns the RAW response body, so it is only useful when that body is display-ready text or when it is refined with JSON.Path.

## DOM.Query

Queries the RENDERED page for ONE element and returns it (an `Element`, or `null` when nothing matches). Its ONLY parameter is a CSS SELECTOR string: an element ID as `#xi-header-1` (the element's `id` property), an element NAME as `.header1` (the `name` is rendered as a CSS class) or any selector (`header`, `body`, `.xi-cb-…`). This is THE EP for acquiring DOM ELEMENTS ("das Header-Element", "den Container X", "das Element ganz oben", "the header element") — e.g. `{ DOM.Query > #xi-header-1 }`, `{ DOM.Query > .header1 }`, `{ DOM.Query > header }`.

Reported failure — WRONG: `{ XHeader > header1 }`. `XHeader` — like `XPage`, `XSpan`, `XContainer`, `XTextField`, `XTextArea`, `XSelect`, `XUpload`, … — is a FORMCYCLE WIDGET TYPE (a `className` in the form JSON); a widget type is NEVER an EP id, and a bare element name is never a CSS selector. CORRECT: `{ DOM.Query > #xi-header-1 }` (or `{ DOM.Query > .header1 }`). The value the EP returns IS the element, so it is used directly (e.g. logged via `Sys.Log.Console`'s data-cb-Data) — never wrap the element in another EP id.

A CSS selector is REQUIRED — a call without a selector is rejected: `{ DOM.Query }` is invalid.

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
6. CRITICAL — V resolves ONLY a form GLOBAL VARIABLE (a name from the top-level "variables" array, or a variable you CREATE only on an explicit "globale Variable"/"global variable" request). NEVER pass a PERSON'S/EMPLOYEE'S literal NAME (or an authority's name) to V — e.g. "{ BayVIS.Ansprechpartner.Details > { V > Salvatore Callari } }" is WRONG: "Salvatore Callari" is the person's NAME, not a variable, so V stays unresolved. A person/authority NAMED DIRECTLY in the request ("Salvatore Callari", "der Mitarbeiter Salvatore Callari", a contact name) is resolved via the name → ID → Details chain WITHOUT V: "{ BayVIS.Ansprechpartner.Details > { I > 0 ; { BayVIS.Ansprechpartner.ID > Salvatore Callari } } }" (the .ID EP returns an ARRAY, so { I > 0 ; ... } picks the FIRST match and Details loads that person's object). Use V only as the ID-lookup input when the user EXPLICITLY asked to store the person in a global variable — then V carries the VARIABLE name (whose value holds the person name / numeric ID), e.g. "{ BayVIS.Ansprechpartner.Details > { I > 0 ; { BayVIS.Ansprechpartner.ID > { V > SALVATORE_CALLARI_CONTACT } } } }".

## VP (plugin / server configuration) — NOT the same as V!

VP resolves a value set in the CodBi PLUGIN CONFIGURATION on the SERVER — the value behind a plugin property whose NAME starts with `GV_` (stored at runtime in `window.codbiSettings.gv`, keyed by the part after the `GV_` prefix). Example: plugin property `GV_JOJO` → `{ VP > JOJO }`.

DECISION (LANGUAGE-AGNOSTIC, BY MEANING IN ANY LANGUAGE — NEVER BY A KEYWORD ALONE):
- USE **VP** — NEVER **V** — whenever the requested value is a "Plugin-Variable", "Plugin-Einstellung", "Plugin-Property", "plugin setting", "Konfigurationswert der Installation", "GV_...-Wert", or ANY phrase containing "Plugin" (in ANY language). A phrase containing "Plugin" ALWAYS means VP.
- USE **V** only for an ordinary form GLOBAL VARIABLE — a "Variable" / "globale Variable" / "Formularvariable" / "form variable" / workflow variable DECLARED ON THE FORM (in its top-level "variables" array).
- CRITICAL AMBIGUITY (the reported "Plugin-Variable JOJO" failure): even when a form global variable with the SAME name exists (e.g. "JOJO" is present in the form's "variables" array), a request that calls the value a "Plugin-Variable" / "Plugin-Property" / anything containing "Plugin" means VP — emit `{ VP > JOJO }` — NEVER `{ V > JOJO }`. Only a request that names it an ordinary "globale Variable"/"Variable" of the form (with NO "Plugin") means V.
- 1st parameter: the key (the part after `GV_`); optional 2nd: "REPORT" to throw when the key is not in `window.codbiSettings.gv`, otherwise an EMPTY string is returned.

## I

Takes ONE entry out of an ARRAY by its position — the "pick one of the list" EP. TWO parameters in this exact order: Param[1] = the INDEX as an integer STRING (0-based: `0` = first entry, `1` = second; a number also works), Param[2] = the ARRAY-returning EP/nested expression.

WHEN TO USE IT (language-agnostic): only when the inner EP yields an ARRAY and exactly ONE entry is needed — "den ersten Treffer", "the first match", "den ersten Eintrag", "einen der …", "pick one of …". The canonical idiom after an array-returning EP (`BayVIS.Behoerden.ID`, `BayVIS.Ansprechpartner.ID`, `BayVIS.Behoerden.Gebaeude.ID`, `Date.FromString`, `F`, `OpenPLZ.*`, `Sorted`, `Unique`) is `{ I > 0 ; <array EP> }`. Example: `{ I > 0 ; { BayVIS.Behoerden.ID > Amt für Digitales } }` = the first matching authority ID; `{ I > 1 ; { OpenPLZ.Localities > de ; ^A } }` = the SECOND match.

DO NOT use `I` on an EP that already returns a SINGLE value/object — a Details EP fed by one id (`{ BayVIS.Ansprechpartner.Details > { V > <NAME> } }`), a `V`, `JSON.Path`, `Date.Today`, `Date.Holidays > …` and similar need no `I`; wrapping them adds a slot for nothing. The EP tolerates exactly one case: index `0` applied to a NON-array returns that value unchanged (so `{ I > 0 ; <single value> }` is harmless), while any OTHER index on a non-array THROWS a CodBiError ("The second parameter of I must be an array …") — never rely on that, use `I` only for arrays.

OUT OF RANGE: an index beyond the last entry yields NO value (the inner call raises "hasn't … been specified?" downstream) — prefer index `0` for "the first/best match", or narrow the list with `F` before picking.

## F

Narrows an ARRAY to the entries whose property has ONE EXACT value — the filter EP for list/lookup requests ("den Eintrag mit … finden", "das Objekt, dessen … gleich … ist", "filter by …", "only the one where …", "welcher Eintrag hat …"). THREE parameters, in this exact order: Param[1] = the property NAME (a string), Param[2] = the value to match, Param[3] = the ARRAY to scan (an EP that returns an array, e.g. `{ OpenPLZ.Localities > de ; ^A }`).

RETURN TYPE + SHAPE: `F` ALWAYS returns an ARRAY (one element when one matches, EMPTY when nothing matches) — a single result must be picked with the index EP: `{ I > 0 ; { F > … } }`. `F` must be the OUTERMOST EP of the value it fills: NEVER wrap it in `JSON.Path`, `Sorted` or `Unique` — do the sorting/deduplicating INSIDE its 3rd parameter. Correct: "{ F > postalCode ; 91522 ; { Sorted > { Unique > { OpenPLZ.Localities > de ; ^A } ; name } ; name } }". WRONG: "{ Sorted > { F > … } }" or "{ JSON.Path > { F > … } }".

EXACT MATCH — the comparison is strict (`===`): case-sensitive AND type-sensitive. Pass the value exactly as the data holds it (a NUMBER stays a number, no quotes, no reformatting) — `91522` matches a numeric property, `"91522"` does not, and `Annaberg` does not match `annaberg`. When no entry matches, the result is EMPTY (never an error) — so a request for a single entry should be chained with `I`.

## Sorted

Sorts an array by a property name.

## Unique

Deduplicates an array by a property name.

## URLParameter

Reads the value of ONE URL query-string parameter of the page the form is running in: `{ URLParameter > <parameter name> }`. The parameter name is the RAW name used in the address bar (`?FRID=123` → `FRID`) — not its value, not a URL. The result is a STRING (the value), or an EMPTY STRING when the URL does not contain that parameter (it never throws).

- ONE parameter only, unquoted: `{ URLParameter > FRID }`. URL parameter names are case-sensitive — pass the name exactly as the caller writes it.
- Use it whenever a value must be taken FROM THE URL the visitor used — tracking/lead ids, campaign codes, preselected values, tokens ("den Parameter FRID in der URL ausgeben", "den Wert von ?frid=…", "URL-Parameter", "query parameter", "the value from the address bar", ANY language). Combine it with Sys.Log.Console (data-cb-Data) to print it, JSON.SET (data-cb-toset) to store it in a field's value, or HTML.Text.Injector (data-cb-replacement) to display it.
- NOT `Net.URL` (that FETCHES a remote URL's content) and NOT the `SV` functionality (that COPIES a URL parameter into a global variable and is a form property, not an EP). To READ the value itself, use this EP.

INVALID: writing the value literally, inventing an id (`{ FRID > }`, `{ URLParameter.FRID }`) or using `{ V > FRID }` for a URL parameter that was never stored in a global variable. CORRECT: `{ URLParameter > FRID }`.

## OpenPLZ EPs

ALL OpenPLZ EPs (OpenPLZ, OpenPLZ.Streets, OpenPLZ.Localities, OpenPLZ.OrganizationalUnits, OpenPLZ.TextSearch) return Array<object>. Each object has properties like "name", "officialKey", "type", "postalCode", "locality". To extract a specific property, wrap the EP in JSON.Path. If duplicates may occur, deduplicate with Unique.

PICK THE EP BY WHAT IS BEING LOOKED FOR (language-agnostic, ANY language):
- LOCALITIES / cities / towns / places ("Ortsvorschläge", "Städte", "cities", "localities") → `OpenPLZ.Localities > <country> ; <name regex> ; <postal-code regex>`.
- STREETS ("Straßen in <PLZ>", "streets in <postal code>") → `OpenPLZ.Streets > <country> ; <street regex> ; <postal-code regex> ; <locality regex>`.
- FREE TEXT ("Volltextsuche …", "search for …") → `OpenPLZ.TextSearch > <country> ; <term>`.
- ORGANISATIONAL UNITS — cantons, federal states, provinces and their municipalities/districts ("alle Kantone der Schweiz", "die Bundesländer", "the cantons of Switzerland", "les cantons de la Suisse", "Provinzen", "districts") → `OpenPLZ.OrganizationalUnits > <country> ; <orgaUnit>`. This EP "does not search for units but rather returns all available ones", i.e. THE LIST of a country's units of that kind.
- The GENERIC `OpenPLZ` EP is the raw servlet call — country ; orgaUnit ; officialKey ; detail ; up to four explicit search parameters (postalCode / name / locality / searchTerm). Use it ONLY when the request itself names such query values; for "all units of a kind" the specialised `OpenPLZ.OrganizationalUnits` is the correct id.

THE COUNTRY IS ALWAYS ITS 2-LETTER CODE — `de` (Germany), `at` (Austria), `ch` (Switzerland), `li` (Liechtenstein), `en` (England). A COUNTRY NAME is NOT accepted: "Schweiz" / "Switzerland" / "Suisse" / "Svizzera" → `ch`, "Deutschland" / "Germany" → `de`, "Österreich" / "Austria" → `at`, "Liechtenstein" → `li`. An EMPTY first slot falls back to the installation's `OpenPLZ_Country`.

THE ORGA-UNIT TOKEN IS CAPITALIZED ENGLISH — `Cantons` (Kantone), `FederalStates` (Bundesländer/Bundesstaaten), `FederalProvinces` (Provinzen); a unit identified in slot 3 takes `Municipalities` (Gemeinden) or `Districts` (Bezirke) in slot 4. NEVER pass the localised word into that slot and NEVER pass the country there.

Reported failure — WRONG: `{ OpenPLZ > Schweiz }` for "alle Kantone der Schweiz, die in OpenPLZ registriert sind" — a country NAME in slot 1 and no unit at all. CORRECT: `{ OpenPLZ.OrganizationalUnits > ch ; Cantons }`.

EP names use dots and are case-sensitive: OpenPLZ.Localities (NOT "openplz.localities"), OpenPLZ.OrganizationalUnits (NOT "OpenPLZ.Organizationalunit" / "OpenPLZ.Units"), OpenPLZ.Streets, LDAP.Find (NOT "Ldap.Find").

## BayVIS EPs

TERMINOLOGY — “Bayernportal” IS BayVIS: the Bavarian authority/office portal (the “Bayernportal”) is the BayVIS authority directory. “Ämter/Behörden im Bayernportal” (“authorities/offices of the Bayernportal”, “alle Ämter der Stadt”) are the entries of `BayVIS.Behoerden` — to list them ALL in a select use `{ BayVIS.Behoerden > bezeichnung }` (or the standard configuration `CodBi_BayVIS_Auswahl_Behoerden`); never ask the user for the office list.

CRITICAL — BAYVIS DATA IS NEVER A FORMCYCLE DATASOURCE: BayVIS (Bayernportal) data — authorities, contacts/Ansprechpartner, contact details, e-mail, phone, postal/building addresses — is produced AT RUNTIME by the EPs on this page. A request such as “die Kontaktdaten aus dem BayVIS von <Person>”, “alle im BayVIS registrierten Ämter”, “die Adresse der Behörde X” (ANY language) therefore needs NO `datasource`, NO `data-cb-dataquery` and NO clarification about a data source: never ask which Formcycle datasource to use, never treat “BayVIS” as a datasource name, and never pick one of the AVAILABLE FORMCYCLE DATASOURCES for it (that list explicitly excludes BayVIS). Wire the EP instead: a text block → XSpan + HTML.Text.Mapper with the details EP; a list of authorities → XSelect + HTML.Select.Injection with `{ BayVIS.Behoerden > bezeichnung }`.

SYNTAX: `>` introduces the FIRST parameter of an EP; every further parameter is separated by `;` (NEVER by `>`). A nested `{ ... }` EP is resolved first and its result becomes that parameter.

BayVIS has THREE kinds of EPs — never confuse them:
1. **Directory EPs** (`BayVIS.Behoerden`, `BayVIS.Ansprechpartner`) — REQUIRE a property-name parameter and return that column for the WHOLE directory (every authority / every contact), i.e. an ARRAY. They answer "which authorities/contacts exist" — NEVER "what is the value of ONE named authority".
2. **ID-resolver EPs** (`BayVIS.Behoerden.ID`, `BayVIS.Ansprechpartner.ID`, `BayVIS.Behoerden.Gebaeude.ID`) — take ONE identifier (a plain STRING designation for the first two, a NUMERIC AUTHORITY id for `Gebaeude.ID`) and return the matching numeric ID(s) as an ARRAY.
3. **Details EPs** (`BayVIS.Behoerden.Details`, `BayVIS.Ansprechpartner.Details`, `BayVIS.Behoerden.Details.Gebaeude`) — take NUMERIC IDs ONLY, never names.

CRITICAL — ONE NAMED AUTHORITY'S FIELD COMES FROM THE DETAILS EP, NEVER FROM THE DIRECTORY EP (language-agnostic, ANY language): a request for a SPECIFIC, NAMED authority's data — e-mail, phone, designation, type, group, id, logo, address ("die Mail-Adresse des Amt für Digitales", "die E-Mail der Behörde X", "the e-mail of <authority>", "l'adresse e-mail de <autorité>") — is resolved with the name → id → Details chain and the wanted field as the Details EP's property parameter: { BayVIS.Behoerden.Details > { I > 0 ; { BayVIS.Behoerden.ID > Amt für Digitales } } ; email }. `{ BayVIS.Behoerden > email }` is WRONG in that case: the directory EP ignores the authority entirely and returns the e-mail column of EVERY authority (a list) — it cannot select one. The directory EP is ONLY for a LIST/selection of all authorities (e.g. the Values of HTML.Select.Injection: "{ BayVIS.Behoerden > bezeichnung }"). Naming the SYSTEM ("aus dem Bayernportal", "aus der BayVIS", "from BayVIS / the Bayernportal") does NOT mean the directory EP — the SUBJECT of the request decides ("one named authority" → Details, "the list of authorities" → Directory).

CRITICAL — TO GET DETAILS FOR A NAMED PERSON OR AUTHORITY, ALWAYS CHAIN NAME → ID → DETAILS (nest the EPs; the inner EP is resolved first):
- NEVER pass a person's name to `BayVIS.Ansprechpartner` — its only parameter is a PROPERTY name (e.g. `nachname`, `email`). `{ BayVIS.Ansprechpartner > Salvatore Callari }` is INVALID and rejected.
- NEVER pass an authority/office name (e.g. "Amt 44") to `BayVIS.Behoerden.Details`, `BayVIS.Behoerden.Details.Gebaeude` or `BayVIS.Behoerden.Gebaeude.ID` — they take NUMERIC IDs only. `{ BayVIS.Behoerden.Details > Amt 44 }` is INVALID.
- Resolve the name to an ID with the matching `.ID` EP. The `.ID` EPs return an ARRAY, so pick one element with the I (index) EP: { I > 0 ; <array EP> }.
- CRITICAL — A DESIGNATION WITH DIGITS IS STILL A NAME, NEVER AN ID (language-agnostic, ANY language): an authority is named by its DESIGNATION ("bezeichnung") — "Amt 44", "Amt für Digitales", "Behörde 12", "Bürgeramt Mitte", "office 7", "ufficio 44", "bureau 12". Digits inside a designation are PART OF THE NAME ("Amt 44" is the office called "Amt 44"), they are NOT an authority ID, NOT a building ID and NOT a house number. NEVER extract a number out of a designation and use it as an ID; NEVER "shorten" `{ BayVIS.Behoerden.ID > Amt 44 }` to the literal `44`. An authority ID exists ONLY when (a) the user says so explicitly ("Behörden-ID 44", "authority ID 44", "Amt mit der ID 44") or (b) it came out of `{ BayVIS.Behoerden.ID > <designation> }`. The designation ALWAYS goes — complete, with its digits — into `BayVIS.Behoerden.ID`.
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
- Contact by name (CANONICAL — the name goes DIRECTLY into Details, no .ID/I): { BayVIS.Ansprechpartner.Details > Salvatore Callari }
- Contact property by name: { BayVIS.Ansprechpartner.Details > Salvatore Callari ; nachname }
- Authority property by name: { BayVIS.Behoerden.Details > { I > 0 ; { BayVIS.Behoerden.ID > Amt für Digitales } } ; bezeichnung }
- Building IDs of an authority by name (returns an ARRAY): { BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde } } } }
- Building details of an authority (authority ID and building ID are separate `;` parameters, BOTH resolved via I): { BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde } } } ; { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde } } } } } }
- First building's street of an authority by name: { BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; { BayVIS.Behoerden.ID > Amt 44 } } ; { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > Amt 44 } } } } ; hausanschriftStrasse }
- Combine two EP results into one text with Data.Join: { Data.Join > { BayVIS.Ansprechpartner.Details > { I > 0 ; { BayVIS.Ansprechpartner.ID > { V > BayVIS_Hauptansprechpartner } } } } ; { BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde } } } ; { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde } } } } } } }
- Contact data stored as a GLOBAL VARIABLE and displayed ("Kontaktdaten von ... als globale Variable hinterlegen"): add {"name":"SALVATORE_CALLARI_CONTACT","aliasname":"SALVATORE_CALLARI_CONTACT","serveronly":false,"value":"Salvatore Callari"} to the top-level "variables" array (the value is the PLAIN NAME — never an EP expression, never the whole Details chain). BayVIS.Ansprechpartner.Details returns a JSON OBJECT, so display it with HTML.Text.Mapper — NOT HTML.Text.Injector: wire the element with data-cb-func="HTML.Text.Mapper" + data-cb-replacements="{ BayVIS.Ansprechpartner.Details > { V > SALVATORE_CALLARI_CONTACT } }" + data-cb-property (e.g. "value" on an XTextField/XTextArea or "innerHTML" on an XSpan). The [(property)]-style placeholders in the element's template then name the ACTUAL object properties, e.g. "[(vorname)] [(nachname)] — [(email)], Tel. 0[(apTelefonOrtsvorwahl)] [(apTelefonDurchwahl)]" (a single Details object, so NO { I > 0 ; ... } wrapper). The V EP is NESTED inside BayVIS.Ansprechpartner.Details — never a standalone "{ V > SALVATORE_CALLARI_CONTACT }", and never store "{ BayVIS.Ansprechpartner.Details > ... }" in the variable.
- Building details stored as a GLOBAL VARIABLE and displayed ("Details zum Gebäude ... als globale Variable hinterlegen"): add {"name":"BUILDING_AMT44","aliasname":"BUILDING_AMT44","serveronly":false,"value":"Amt 44"} to the "variables" array (the PLAIN authority name — no "{" / "}"), then display with HTML.Text.Mapper (the building Details EP also returns an OBJECT). Wire the element with data-cb-func="HTML.Text.Mapper" + data-cb-replacements="{ BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; { BayVIS.Behoerden.ID > { V > BUILDING_AMT44 } } } ; { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > { V > BUILDING_AMT44 } } } } } }" + data-cb-property, and use [(property)] placeholders (e.g. [(hausanschriftStrasse)]) in its template. BayVIS.Behoerden.Details.Gebaeude REQUIRES BOTH the authority ID AND the building ID (here both must be resolved via I because the inner .ID EPs return ARRAYS) — never emit it with only one parameter.
- CORRECT vs WRONG (global variable for BayVIS data): CORRECT — variable {"name":"SALVATORE_CALLARI_CONTACT","aliasname":"SALVATORE_CALLARI_CONTACT","serveronly":false,"value":"Salvatore Callari"} + replacement "{ BayVIS.Ansprechpartner.Details > { V > SALVATORE_CALLARI_CONTACT } }". WRONG — variable {"name":"SALVATORE_CALLARI_CONTACT","aliasname":"SALVATORE_CALLARI_CONTACT","serveronly":false,"value":"{ BayVIS.Ansprechpartner.Details > { I > 0 ; { BayVIS.Ansprechpartner.ID > Salvatore Callari } } }"} + replacement "{ V > SALVATORE_CALLARI_CONTACT }" — the full data EP sits in the variable and the standalone V only prints that raw EP text (V does NOT re-resolve), so NO BayVIS data is fetched.

### BayVIS.Behoerden

Directory EP — REQUIRES a property name parameter: { BayVIS.Behoerden > bezeichnung } (not bare { BayVIS.Behoerden }). It returns that COLUMN for ALL authorities as an ARRAY — it lists the directory and cannot pick ONE authority.

Valid property values: behoerdenart, behoerdengruppe, bezeichnung, email, id, sortierreihenfolge.

Reported failure — WRONG: { BayVIS.Behoerden > email } for "die Mail-Adresse des Amt für Digitales" / "the e-mail address of <authority>" (this returns the e-mail of EVERY authority; the named authority is not even read).
CORRECT: { BayVIS.Behoerden.Details > { I > 0 ; { BayVIS.Behoerden.ID > Amt für Digitales } } ; email } — the designation selects the authority, `email` is the property of its Details object.
RIGHT (a LIST of authorities is wanted): { BayVIS.Behoerden > bezeichnung } — e.g. as the Values entry of HTML.Select.Injection.

### BayVIS.Behoerden.ID

ID-resolver EP — takes the authority DESIGNATION as a plain STRING (exactly as written in the request, digits included: `Amt 44`) and returns an ARRAY of matching numeric IDs. To get a single ID: { I > 0 ; { BayVIS.Behoerden.ID > Amt 44 } }. ONLY usable when the prompt NAMES a real Behörde/authority — never invent one ("BayVIS" is the system, not an authority). The result of THIS EP is the only value that may fill an `authority ID` slot of a Details EP — a bare number from the request is NOT an authority ID.

### BayVIS.Behoerden.Details

Takes a NUMERIC authority ID (NOT a name). Returns the authority METADATA object with EXACTLY these properties: bezeichnungBehoerde, behoerdenart, behoerdengruppe, bezeichnung, email, id, sortierreihenfolge, logo, behoerdeZuordnungen, behoerdenGebaeudeZuordnungen. It has NO phone and NO postal address — a person's phone/e-mail lives in BayVIS.Ansprechpartner.Details, a building/postal address lives in BayVIS.Behoerden.Details.Gebaeude.

Also accepts an OPTIONAL second parameter (separated by `;`) — a property name to extract just that specific field: { BayVIS.Behoerden.Details > { I > 0 ; { BayVIS.Behoerden.ID > <designation> } } ; <property> }. THIS is the EP for ONE named authority's single field (reported case: { BayVIS.Behoerden.Details > { I > 0 ; { BayVIS.Behoerden.ID > Amt für Digitales } } ; email }) — NEVER { BayVIS.Behoerden > email }, which is the whole-directory column.

ORDER IS FIXED — the authority ID is ALWAYS slot 1 and the property ALWAYS slot 2, no matter that the request mentions the property first ("die Mail-Adresse des Amts X").
WRONG (reported failure): { BayVIS.Behoerden.Details > email ; { BayVIS.Behoerden.ID > Amt für Digitales } } — swapped: the property sits in the numeric-id slot, so the call returns nothing.
CORRECT: { BayVIS.Behoerden.Details > { BayVIS.Behoerden.ID > Amt für Digitales } ; email } — and with the I wrapper for the array-returning ID EP: { BayVIS.Behoerden.Details > { I > 0 ; { BayVIS.Behoerden.ID > Amt für Digitales } } ; email }.

### BayVIS.Behoerden.Details.Gebaeude

Takes TWO NUMERIC parameters separated by `;`: param 1 = AUTHORITY ID, param 2 = BUILDING ID. An optional third `;` parameter is a property to extract (e.g. hausanschriftStrasse). Returns the building OBJECT with these properties: bezeichnung, hausanschriftPLZ, hausanschriftOrt, hausanschriftStrasse, postanschriftPLZ, postanschriftOrt, postanschriftStrasse, logo (no phone here either).

THE TWO SLOTS ARE BOTH MANDATORY AND NOT INTERCHANGEABLE — slot 1 must come from `BayVIS.Behoerden.ID` (designation → authority id) and slot 2 must come from `BayVIS.Behoerden.Gebaeude.ID` (authority id → building id). Both `.ID` EPs return ARRAYS, so EACH slot gets its OWN `{ I > 0 ; ... }` wrapper — the wrapper belongs INSIDE a slot, never around the whole Details.Gebaeude call and never as a replacement for the second slot. A designation ("Amt 44", "Amt für Digitales", ANY language) is never an ID, and the digits of a designation are never an ID either. "The address of the building in which authority X sits" therefore ALWAYS repeats X's designation in BOTH slots: { BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; { BayVIS.Behoerden.ID > <designation> } } ; { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > <designation> } } } } } (add `; hausanschriftStrasse` as the 3rd parameter when one field is requested, or omit it to receive the whole building object for HTML.Text.Mapper).

CRITICAL — THE BUILDING OBJECT HAS NO HOUSE-NUMBER PROPERTY: there is NO `hausanschriftHausnummer` (and NO `hausnummer` / `postanschriftHausnummer`) — a placeholder like [(hausanschriftHausnummer)] CANNOT be resolved. The BayVIS street field `hausanschriftStrasse` ALREADY contains street AND house number combined (e.g. "Maximilianstraße 1"), exactly like `postanschriftStrasse`. Render a building's Hausanschrift address as "[(hausanschriftStrasse)], [(hausanschriftPLZ)] [(hausanschriftOrt)]" — NEVER append a separate [(hausanschriftHausnummer)] / [(hausnummer)] after the street.

### BayVIS.Behoerden.Gebaeude.ID

Takes the NUMERIC AUTHORITY ID as its ONLY parameter and returns an ARRAY of that authority's building IDs — it does NOT accept a designation/name, and its result is NOT an authority ID. Chain it from the designation: { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > <designation> } } } } (the inner .ID turns the designation into the authority id, the outer I picks the first building id).

CRITICAL — THIS EP CAN ONLY EVER FILL THE **SECOND** PARAMETER OF BayVIS.Behoerden.Details.Gebaeude. It produces a BUILDING id; the FIRST parameter of that Details EP is the AUTHORITY id. Putting this EP's result into the authority-id slot, or calling Details.Gebaeude with only one parameter, is INVALID.

Reported failure — WRONG: { BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > 44 } } } — three defects at once: (a) ONE parameter instead of the mandatory two, (b) the BUILDING-id EP fills the AUTHORITY-id slot, (c) the digits "44" were cut out of the designation "Amt 44" and used as an ID.
CORRECT: { BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; { BayVIS.Behoerden.ID > Amt 44 } } ; { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > Amt 44 } } } } } — slot 1 = authority ID, slot 2 = building ID, each one resolved from the SAME designation and each one with its OWN { I > 0 ; ... } wrapper.

CRITICAL — EVERY ADDRESS PLACEHOLDER MUST BE FED BY THE BUILDING EP: any [(hausanschriftStrasse)] / [(hausanschriftPLZ)] / [(hausanschriftOrt)] / [(postanschriftStrasse)] / [(postanschriftPLZ)] / [(postanschriftOrt)] template MUST be resolved by `BayVIS.Behoerden.Details.Gebaeude` (authority ID `;` building ID). NEVER feed an address template with `BayVIS.Behoerden.Details` — that object has NO address properties (only bezeichnungBehoerde, behoerdenart, behoerdengruppe, bezeichnung, email, id, sortierreihenfolge, logo, behoerdeZuordnungen, behoerdenGebaeudeZuordnungen), so [(hausanschriftStrasse)] etc. stay EMPTY. Correct building-address replacement for a NAMED authority ("Amt für Digitales") — use the building EP with BOTH ids and NO direct name into the Details EP:
{ Data.Join > { BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; { BayVIS.Behoerden.ID > Amt für Digitales } } ; { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > Amt für Digitales } } } } } }
With a GLOBAL VARIABLE (e.g. BayVIS_Behoerde holding the authority name):
{ Data.Join > { BayVIS.Behoerden.Details.Gebaeude > { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde } } ; { BayVIS.Behoerden.Gebaeude.ID > { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde } } } } }
The Mapper template then uses [(hausanschriftStrasse)], [(hausanschriftPLZ)] [(hausanschriftOrt)] — NEVER [(hausanschriftHausnummer)]. This Data.Join form combines the building object (address) with its resolved building id; it is the standard way to show a Behörde's address.

TWO PARAMETERS ARE MANDATORY for BayVIS.Behoerden.Details.Gebaeude: param 1 = authority ID `;` param 2 = BUILDING ID. A call with ONLY the authority ID is INVALID and returns no building object — the building ID is the SECOND `;` parameter and MUST be resolved with BayVIS.Behoerden.Gebaeude.ID. Also: do NOT join BayVIS.Behoerden.Details (authority metadata — it has NO address) into a building-address Data.Join; join the Gebäude details object with its building-id resolver.
WRONG (no building ID in the 2nd object AND the 1st object is the wrong EP): { Data.Join > { BayVIS.Behoerden.Details > { I > 0 ; { BayVIS.Behoerden.ID > Amt für Digitales } } } ; { BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; { BayVIS.Behoerden.ID > Amt für Digitales } } } }
CORRECT (authority named directly): { Data.Join > { BayVIS.Behoerden.Details.Gebaeude > { I > 0 ; { BayVIS.Behoerden.ID > Amt für Digitales } } ; { I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > { I > 0 ; { BayVIS.Behoerden.ID > Amt für Digitales } } } } } }
The Mapper template then uses [(hausanschriftStrasse)], [(hausanschriftPLZ)] [(hausanschriftOrt)] — NEVER [(hausanschriftHausnummer)].

### BayVIS.Ansprechpartner

Directory EP — REQUIRES a property name parameter: { BayVIS.Ansprechpartner > nachname } (not bare { BayVIS.Ansprechpartner }, and NEVER a person's name).

Valid property values: anrede, vorname, nachname, funktion, stellenbezeichnung, email, website, zimmer, sortierreihenfolge, behoerdeId, behoerdeBezeichnung, gebaeudeId, gebaeudeBezeichnung, ansprechpartnerId.

### BayVIS.Ansprechpartner.ID

ID-resolver EP — takes a plain STRING contact name and returns an ARRAY of matching numeric IDs. First hit: { I > 0 ; { BayVIS.Ansprechpartner.ID > Salvatore Callari } }.

### BayVIS.Ansprechpartner.Details

Takes a contact NAME DIRECTLY (unquoted) — the EP resolves the name to the internal ID itself, so a NAMED person needs NO .ID/I chain: { BayVIS.Ansprechpartner.Details > Salvatore Callari } (a numeric contact ID also works; several names/ids may be separated by "/"). An optional second `;` parameter extracts a single property: { BayVIS.Ansprechpartner.Details > Salvatore Callari ; nachname }. Use V ONLY when a form GLOBAL VARIABLE holds the name/id: { BayVIS.Ansprechpartner.Details > { V > <VARIABLE_NAME> } }. NEVER write { BayVIS.Ansprechpartner.Details > { V > Salvatore Callari } } — a literal person name is passed DIRECTLY to Details (not via V, and no { I > 0 ; { ... .ID ... } } wrapper).

Returns a SINGLE JSON OBJECT of that contact with EXACTLY these properties: anrede, vorname, nachname, funktion, stellenbezeichnung, email, website, zimmer, behoerdeId, behoerdeBezeichnung, gebaeudeId, gebaeudeBezeichnung, ansprechpartnerId, apTelefonLandvorwahl, apTelefonOrtsvorwahl, apTelefonAnlage, apTelefonDurchwahl, apEmail. There is NO "phone"/"telefon"/"telephone" property — a person's phone is split across the ALL FOUR apTelefon* parts and MUST be rendered from ALL FOUR TOGETHER (NEVER omit one): [(apTelefonLandvorwahl)] [(apTelefonOrtsvorwahl)] [(apTelefonAnlage)] [(apTelefonDurchwahl)] (Landvorwahl = country prefix, Ortsvorwahl = area code, Anlage = main number, Durchwahl = direct dial); omitting [(apTelefonAnlage)] or any part yields an incomplete phone number — a FAIL. The person's plain e-mail is "email" (an alias copy "apEmail" also exists). Because it returns ONE object, do NOT wrap it in the I EP unless it is fed by an array-returning inner EP. When the contact ID comes from a SINGLE value (e.g. a global variable), use it directly — { BayVIS.Ansprechpartner.Details > { V > <NAME> } } — NO { I > 0 ; ... }. To display the object's properties in a template use HTML.Text.Mapper with data-cb-replacements and [(property)] placeholders (e.g. [(vorname)] [(nachname)]) — HTML.Text.Injector is only for injecting ONE plain string.
