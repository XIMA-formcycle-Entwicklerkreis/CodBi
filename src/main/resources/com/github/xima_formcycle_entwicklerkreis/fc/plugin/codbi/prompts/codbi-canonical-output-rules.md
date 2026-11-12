## CANONICAL OUTPUT RULES — emit Formcycle/CodBi attributes in the EXACT format the server expects

These rules are MANDATORY. Emitting them in a different format forces a slow, token-heavy
recovery pass that re-sends the whole form. Get them right the FIRST time so no extra pass is
needed.

### 0. `_codbiApplicability` is MANDATORY on EVERY form output — omitting it costs a whole extra pass

Every form output MUST carry the top-level `"_codbiApplicability"` object, emitted as the LAST key,
even when NO CodBi element applies. A response that omits it forces the server into a blind CodBi
re-evaluation pass that re-sends the entire CodBi/widget reference — many times the size of your
whole answer. When nothing applies, emit exactly:
`"_codbiApplicability": {"codbiVerdict": "none", "considered": [], "applied": [], "skipped": []}`
When something DOES apply, list the footprint-bearing function/standard candidates in `considered` AND request its exact details with
`{"status":"need_codbi_details", "elements": [...], "widgets": [...]}` in the SAME response. Keep `applied` EMPTY unless a FOOTPRINT-LESS holistic standard is activated (see the `_codbiApplicability Report` section): only `Holistic.CSS.Standard` / `Holistic.Matomo.Tracking` / `Holistic.Media.Input.Speech` / `Holistic.Media.Input.Speech.Whisper` / `Holistic.Media.MultipleUpload` ever appear there (each with an EMPTY `targets` array), because the server derives every footprint-bearing applied function from the before/after form diff.

### 0b. `name` / `id` belong in EVERY item — they are not "unchanged properties"

A property-level patch is `{"properties":{"name":"<exact name>","id":"<id>","<changed key>":…}}`.
Without `properties.name` the server cannot find the element and the change is IGNORED.

### 1. Conditional visibility / hidden conditions — `hiddenif` / `hiddenifcomp` / `hiddenifclear`

Formcycle stores every visibility condition on a container or field as EXACTLY THREE properties.
Do NOT swap their roles, and do NOT use a field's NAME where the technical ID is required.

- `hiddenif`     = the **technical element ID** of the controlling element (the `id` property,
                   e.g. `xi-cb-showpersondata`). This is NOT a mode number and NOT a field name.
- `hiddenifcomp` = the **condition code** as a number: 0=MANDATORY, 1=EQUAL, 2=NOT_EQUAL,
                   3=REGEX, 4=LESS_THAN, 5=GREATER_THAN, 6=BETWEEN, 7=LESS_OR_EQUAL,
                   8=GREATER_OR_EQUAL, 9=EMPTY.
- `hiddenifclear`= `"false"` unless a clear-on-hide is required.
- `hiddenifvalue`= the value to compare against (only when the code needs one, e.g. EQUAL).

WRONG (causes a repair pass): `"hiddenif":"cbShowPersonData", "hiddenifcomp":"9"`
RIGHT (canonical):            `"hiddenif":"xi-cb-showpersondata", "hiddenifcomp":"1", "hiddenifvalue":"1"`

CARVE-OUT — ORDERING COMPARISONS ARE NOT `hiddenif`: the codes 4/5/7/8 (LESS_THAN, GREATER_THAN,
LESS_OR_EQUAL, GREATER_OR_EQUAL) on a DATE / TIME / NUMBER field belong to the CodBi functionality
`OnChange.Conditional`, never to a `hiddenif*` property. When the request says "after/before <date>",
"older/younger than", "more/less than <number>", "from … on", "up to …", or "appears/disappears
immediately while typing", wire the watched field with `data-cb-func="OnChange.Conditional"` +
`data-cb-Mode` GT/GTEQ/LT/LTEQ/EQ/NEQ + `data-cb-Reference="{ Date.FromString > <date> ; <format> }"`
(a DATE, never a literal string) + `data-cb-Candidate=".<field>"` + `data-cb-Target=".<target>"`, and
put the branch attributes `data-cb-_T_*` / `data-cb-_F_*` on that same field. Keep `hiddenif*` for
DISCRETE selection state (a chosen option, a checked checkbox, an empty field) only.

PRINT-ONLY / SCREEN-ONLY IS NEITHER `hiddenif` NOR `HTML.CSS`: an element that must be visible
ONLY in the print output uses the STANDARD class `CodBi_Print_Remove_PrintOnly` in its
`properties.cssclasses` (print-only); an element that must be hidden in print uses
`CodBi_Print_Remove_Tagged` (the element) or `CodBi_Print_Remove_Parent` (its container/section).
The functionality form is `data-cb-func="Print.Remove"` with `data-cb-invert="true"` for PRINT-ONLY
and WITHOUT Invert for HIDDEN-IN-PRINT. NEVER emit `@media print` rules, a `display:none` helper class
or an `HTML.CSS` element for this.

### 2. CodBi functionality vs standard-configuration CSS class — know WHICH mechanism

CodBi has TWO distinct application mechanisms. Decide per element which one applies; never
confuse them.

**A. GENUINE CodBi FUNCTIONALITY (e.g. `Date.Min`, `Date.Frame`, `Time.Frame`, `Form.Navigator`,
`HTML.Text.Injector`, `HTML.Text.Mapper`, `JSON.SET`, `Date.Time.Join`, `Sys.Log.Console`, …)** —
attaches as **functional attribute(s)** in the element's `properties.attributes` array using the
CodBi wiring (`data-cb-func` / `data-cb-*` parameter pairs, flagged `"kind":"func"` /
`"kind":"param"` with `"codbi":true`). NEVER append a genuine functionality name to
`properties.cssclasses` — a CSS class is not a functionality and does not activate its behaviour.

**B. STANDARD-CONFIGURATION CSS CLASS (e.g. `CodBi_NoFutureDate`, `CodBi_TimeFrame_<N>_Begin/_End`,
`CodBi_DateFrame_<N>_Begin/_End`, `CodBi_Holidays_*`, `CodBi_Accordion_A..D`, `CodBi_HTML_Panel_*`,
`CodBi_People_*`, `CodBi_OpenPLZ_*`, `CodBi_Fotocropper_*`, `CodBi_Print_Remove_*`) — a standard
configuration** — is applied by putting its CSS class into `properties.cssclasses` (the class list
is applied by the configuration's own script; a standard-config class is NOT a `data-cb-func`
value and is NOT put into `attributes`). `CodBi_NoFutureDate` (birth-date / no-future-date fields)
and the `CodBi_*Frame_*`/`CodBi_Accordion_*`/`CodBi_HTML_Panel_*`/`CodBi_People_*`/`CodBi_OpenPLZ_*`
classes are ALL standard-configuration CSS classes → they belong in `properties.cssclasses`.

WRONG (a standard-config class in `data-cb-func`): element has `data-cb-func="CodBi_NoFutureDate"`
RIGHT (applied as a standard configuration):      element `properties.cssclasses` contains
                                                 `CodBi_NoFutureDate`
WRONG (a genuine functionality as a CSS class):   element `properties.cssclasses` contains
                                                 `Date.Min`
RIGHT (a genuine functionality as attribute):     the element carries the CodBi functional
                                                 attribute(s) for that functionality.

### 3. Element placeholders (EPs) — the id catalogue is FIXED, the request's words are PARAMETERS

An EP is a VALUE written as `{ EPName > Param1 ; Param2 ; … }`. The set of EP ids is FIXED and every
id you may use is listed in the CODBI NAME INDEX you receive. A name that is NOT in that list DOES
NOT EXIST — never compose an id from the words of the request (state, region, country, year, topic,
product), never translate an id and never add a made-up property. The request's words go into
PARAMETERS of an existing EP.

Reported failures (both are id/property inventions):
- `{ Holiday.Bavaria > list ; Holiday.Hessen > list }` / `{ Holiday.BavariaAndHesse > list }` for
  "die diesjährigen Feiertage von Bayern und Hessen" — there is NO state-specific holiday EP and no
  `list` property. CORRECT: `{ Date.Holidays > by ; he ; THIS_YEAR }`
  (`Date.Holidays` is the ONLY holiday EP: ONE `;` slot per state — bw, by, be, bb, hb, hh, he, mv,
  ni, nw, rp, sl, sn, st, sh, th — the year as the `THIS_YEAR` token (optionally `THIS_YEAR +/- N`,
  a concrete year is NOT accepted), plus `Friedensfest` / `KATHOLISCH`; it returns an ARRAY and has
  NO property parameter).
- `{ BayVIS.Behoerden > email }` for "die Mail-Adresse des Amt für Digitales" — the DIRECTORY EP
  returns that column for EVERY authority. CORRECT (one named authority, ORDER IS FIXED — id FIRST,
  property SECOND): `{ BayVIS.Behoerden.Details > { I > 0 ; { BayVIS.Behoerden.ID > Amt für
  Digitales } } ; email }`. Digits inside a designation ("Amt 44") are part of the NAME, never an
  id. An ADDRESS comes from `BayVIS.Behoerden.Details.Gebaeude` with TWO id slots (authority id ;
  building id) — a one-slot call is invalid.

When you are not certain whether an EP accepts a value or has a property, REQUEST its details
(`{"status":"need_codbi_details", …}`) — never invent an id or a parameter.

ARGUMENT TYPES AND SLOT SEMANTICS ARE PART OF THE EP CONTRACT (language-agnostic): many EPs take PLAIN STRINGS in a fixed format — `Date.Weekends` → `dd.MM.yyyy`, `Date.FromString` → a date string, `Date.Holidays` → state + `THIS_YEAR` tokens, `BayVIS.Behoerden.ID` → a designation. A DATE OBJECT is never such a string: never nest `{ Date.Today }` / `{ Date.FromString > … }` / `{ Date.Arithmetic > … }` into a string parameter. `Date.Weekends` takes a RANGE of `dd.MM.yyyy` strings: with ONE parameter it lists the weekends from TODAY up to that date (`{ Date.Weekends > 01.12.2026 }` = today … 01.12.2026), with TWO parameters it lists the weekends between them — param 1 = START, param 2 = END (`{ Date.Weekends > 01.12.2026 ; 31.12.2026 }` = December 2026 only). Reported failure: `{ Date.Weekends > { Date.Today >  } ; { Date.FromString > 01.12.2026 ; dd.MM.yyyy } }` — two DATE OBJECTS instead of the strings; CORRECT for "weekends until 01.12.2026" is `{ Date.Weekends > 01.12.2026 }`, and for a bounded range "weekends in December 2026" it is `{ Date.Weekends > 01.12.2026 ; 31.12.2026 }`. A `{ Date.Today > }` with an EMPTY arithmetic parameter is invalid on its own too: `{ Date.Today }` is enough.

FORMCYCLE WIDGET TYPES ARE NOT EPs (language-agnostic): XHeader, XFooter, XPage, XSpan, XContainer, XContainerInvisible, XFieldSet, XTextField, XTextArea, XSelect, XUpload, XButton, XTable are the className values of the form JSON - they say WHICH element is built and are NEVER EP ids. To ACQUIRE a rendered page element (the header, a page, a span, a field, a container - "gib das Header-Element aus", "log the header element", "den Container X ausgeben", "das Element ganz oben") use { DOM.Query > <CSS selector> }, where the selector is the element id as #xi-header-1 or its name as .header1 (names are rendered as CSS classes); the EP returns the element itself, so never wrap it in another EP id. Reported failure: { XHeader > header1 } - CORRECT: { DOM.Query > #xi-header-1 }.

DATE AND FILTER EPs - RETURN TYPES AND SHAPE (language-agnostic): Date.FromString (parse; default format DD.MM.YYYY) and Date.Arithmetic (parse + shift with +1d / -2m / +10y) return DATE OBJECTS - Date.FromString as an ARRAY holding one Date ({ I > 0 ; ... } to take it) - never a displayable string, so they must not be fed into a string-parameter EP (Date.Weekends, Date.Holidays, BayVIS.Behoerden.ID). F (exact property match) takes property NAME `;` exact VALUE `;` ARRAY to scan, ALWAYS returns an ARRAY (one element or empty; chain { I > 0 ; ... } for a single one), compares STRICTLY (=== - case- and type-sensitive, so pass the value exactly as the data holds it) and must be the OUTERMOST EP of the value it fills - sort/deduplicate INSIDE its 3rd parameter, never wrap F in JSON.Path/Sorted/Unique.

INDEX EP I (language-agnostic): { I > <index> ; <array EP> } takes ONE entry (0-based, 0 = first) and is used ONLY when the inner EP returns an ARRAY (BayVIS.*.ID, Date.FromString, F, OpenPLZ.*, Sorted, Sort.Numeric, Array.Slice, Unique) - { I > 0 ; ... } means "the first match". A single-value EP (a Details EP, V, JSON.Path, Date.Today, Date.Holidays) needs NO I. Index 0 on a NON-array returns the value unchanged, any other index on a non-array throws a CodBiError.

ARRAY-TRANSFORM EPs (language-agnostic; all return an ARRAY): Array.Wrap turns ONE value into a one-element array (an already-array is passed through) - use when a single value/object must enter an array-parameter EP; Array.Slice takes a PART OF an array (Param[2] = beginning index inclusive, Param[3] optional = end index exclusive; only a beginning = from there to the end; negative = from the end); Sort.Numeric sorts the array ASCENDING by a numeric property (Param[2] optional = the property NAME, e.g. sortierreihenfolge) and returns the WHOLE sorted array - take the first (e.g. lowest sort order) with { I > 0 ; { Sort.Numeric > <array> ; <numeric property> } }. None of these MUTATES the input array.

OBJECT-PRODUCING EPs AND MEMBER ACCESS (language-agnostic): `Date.Today` delivers TODAY as a date
OBJECT, `Date.FromString`/`Date.Arithmetic` too — an OBJECT is not a string and must never be put
into a `dd.MM.yyyy`/state/id parameter. To READ A PROPERTY or CALL A PARAMETERLESS METHOD of such an
object (ANY wording, ANY language: "`getMonth()` von dem heutigen Tag", "the year of today", "die
Eigenschaft … von …", "extract <property>") use `JSON.Path` in FIXED order — OBJECT first, PATH
second: `{ JSON.Path > { Date.Today > NOW } ; getMonth() }`. Inside the path a plain segment reads a
property (`name`, `email`) and a segment written `name()` — round brackets, no space — CALLS a
parameterless method (`getMonth()`, `getFullYear()`, `toString()`). A bare member name in a
`data-cb-*` value is NOT an expression: `data-cb-Data = getMonth()` is invalid (there is no object
and it is not an EP) — CORRECT: `{ JSON.Path > { Date.Today > NOW } ; getMonth() }`. An EMPTY
arithmetic slot (`{ Date.Today > }`) is invalid as well; `{ Date.Today }` or `{ Date.Today > NOW }`
is today.

LDAP.Find - THE FIRST SLOT IS A COMBINING MODE, NOT A WORD FOR THE QUERY (language-agnostic, ANY
language): `{ LDAP.Find > <MODE> ; <attribute = value> | <attribute = value> }`. Slot 1 is the
LOGICAL COMBINING MODE and must be EXACTLY `AND` or `OR` (case-insensitive; an EMPTY slot means
AND) — NEVER a word describing the query (`filter`, `query`, `where`, `suche`, `conditions`,
`mode`, `suchfilter`) and NEVER a condition. Slot 2 holds ALL CONDITIONS, one `attribute = value`
pair each, in that ONE parameter joined by `|` (e.g. `givenName = Salvatore | sn = Callari`); the
optional slot 3 is the LDAP request url (omit it when the installation has one configured). Decide
the mode by MEANING: all conditions must hold → `AND`; any one is enough → `OR`; unnamed → `AND`.
Reported failure: `{ LDAP.Find > filter ; givenName = Salvatore | sn = Callari }` — CORRECT:
`{ LDAP.Find > AND ; givenName = Salvatore | sn = Callari }`.

OPENPLZ - A COUNTRY IS A CODE AND CANTONS ARE ORGANISATIONAL UNITS (language-agnostic, ANY
language): `OpenPLZ.Localities` / `OpenPLZ.Streets` / `OpenPLZ.TextSearch` SEARCH for a name;
`OpenPLZ.OrganizationalUnits` returns the LIST of a country's units of one kind — cantons, federal
states, provinces, municipalities, districts ("alle Kantone der Schweiz", "die Bundesländer", "the
cantons of Switzerland", "Provinzen", "Gemeinden", ANY language) → `{ OpenPLZ.OrganizationalUnits >
ch ; Cantons }`. The country is ALWAYS its 2-letter CODE (`de`, `at`, `ch`, `li`, `en`) — never a
country name ("Schweiz"/"Switzerland" → `ch`, "Deutschland"/"Germany" → `de`, "Österreich" →
`at`); the unit token is CAPITALIZED ENGLISH (`Cantons`, `FederalStates`, `FederalProvinces`). The
GENERIC `OpenPLZ` EP is the raw servlet call for explicit query values — it is NOT the "all units
of a country" EP. Reported failure: `{ OpenPLZ > Schweiz }` — CORRECT:
`{ OpenPLZ.OrganizationalUnits > ch ; Cantons }`.

URL PARAMETERS - READ THEM WITH THE `URLParameter` EP (language-agnostic, ANY language): a value
that comes FROM the URL the visitor opened ("den Parameter FRID in der URL", "den Wert von
?frid=…", "URL-Parameter", "query parameter", "the value from the address bar") is read with
`{ URLParameter > <parameter name> }` - ONE raw, unquoted parameter NAME, and the result is a
STRING (an EMPTY string when the URL does not contain that parameter). It is NOT `Net.URL` (that
fetches a remote page's content), NOT `V` (a global variable) and NOT the `SV` functionality (that
copies a URL parameter into a global variable). Never turn the parameter name into an EP id:
`{ FRID > }` and `{ URLParameter.FRID }` are INVALID — CORRECT: `{ URLParameter > FRID }`.

### 4. General principle

The server validates and normalises the AI's JSON. Any output that deviates from the above is
automatically corrected, but the correction triggers an extra full-form re-send that costs
substantial tokens. Produce canonical output on the first pass so recovery passes are never
needed.
