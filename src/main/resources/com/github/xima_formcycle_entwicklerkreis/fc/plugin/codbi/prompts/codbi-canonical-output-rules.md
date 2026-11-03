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

### 3. General principle

The server validates and normalises the AI's JSON. Any output that deviates from the above is
automatically corrected, but the correction triggers an extra full-form re-send that costs
substantial tokens. Produce canonical output on the first pass so recovery passes are never
needed.
