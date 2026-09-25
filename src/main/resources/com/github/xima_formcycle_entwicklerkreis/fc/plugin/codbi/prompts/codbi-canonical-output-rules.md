## CANONICAL OUTPUT RULES — emit Formcycle/CodBi attributes in the EXACT format the server expects

These rules are MANDATORY. Emitting them in a different format forces a slow, token-heavy
recovery pass that re-sends the whole form. Get them right the FIRST time so no extra pass is
needed.

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

### 2. CodBi functionality on an element — an attribute, NOT a CSS class

A CodBi functionality (e.g. `CodBi_NoFutureDate`, `CodBi_TimeFrame_*`, `CodBi_Holidays_*`,
`CodBi_Accordion_*`, OpenPLZ) attaches to an element as a **functional attribute(s)** entry,
NOT by putting the CodBi name into the element's CSS class list.

- A CodBi functionality that governs an element must be expressed as an attribute in the
  element's `properties.attributes` array using the CodBi wiring (`data-cb-func` /
  `data-cb-*` parameter pairs). The attributes are flagged `"kind":"func"` / `"kind":"param"`
  with `"codbi":true`.
- NEVER append a CodBi functionality name (e.g. `CodBi_NoFutureDate`) to `properties.cssclasses`
  or to the element's CSS class list — that is a CSS class, not a CodBi functionality, and it
  does not activate the behaviour.

WRONG (a CSS class that does nothing): element `attributes.cssclasses` contains `CodBi_NoFutureDate`
RIGHT (an activated functionality):     the element carries the CodBi functional attribute(s) for
                                        that functionality as specified in the CodBi reference.

### 3. General principle

The server validates and normalises the AI's JSON. Any output that deviates from the above is
automatically corrected, but the correction triggers an extra full-form re-send that costs
substantial tokens. Produce canonical output on the first pass so recovery passes are never
needed.
