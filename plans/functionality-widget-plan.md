# Functionality Widget — Feasibility & Architecture Plan

> **Question answered:** *"Is all of this possible?"* — **Yes.** Every requested capability maps
> onto infrastructure that already exists in this repo (the `XMirror` custom widget, the EP
> signature registry, the EP builder, the attribute/parameter marker table, and the local API-doc
> manager). One piece is genuinely new but small and self-contained: a per-functionality
> **"allowed form-element types"** metadata channel. Details below.

---

## 1. What the user asked for (decomposed)

| # | Requirement | Verdict |
| :- | :--- | :--- |
| 1 | New widget **`Functionality`** with its own icon (CodBi logo, `CB` → `F`, same ornaments) | ✅ Feasible — clone of the `XMirror` widget registration pattern |
| 2 | Holds **exactly one** FORMCYCLE element; the element is changed/rendered inside the widget | ✅ Feasible — `XMirror` already does this (`IXItemAppendable` + `registerParent`) |
| 3 | Config: **functionality selector** (like the EP selector, with filtering) + **"+"** to add more | ✅ Feasible — reuse `EPManager`/`EPExpression` filtering + the `MultiSelect` editor pattern |
| 4 | Config: **single target element selector**; changing it swaps the contained object | ✅ Feasible — exactly the `MirrorElementSelect` + `MirrorChildItems.syncMirrorChildren` pattern |
| 5 | Config: **parameter list** of the selected functionalities — checkboxes for booleans, text inputs otherwise | ✅ Feasible — `detFunctionalities[key].Parameter` map + `CodbiElementMarkers.buildFuncParamTable` |
| 6 | Each parameter has a **button** to open the flat EP listing **and** the EP builder (like the attribute parameter value); checkbox⇄text flip | ✅ Feasible — `openEPBuilder` + `EPManager` already exist; the flip is a small logic addition |
| 7 | All parameter edits reflected in the element's **attribute table** | ✅ Feasible — `setFuncAttribute` / `removeFuncAttribute` write straight into the property bag |
| 8 | A functionality declares **which form-element types it is for** (multiple allowed, e.g. `XFieldSet`) | ⚠️ **New metadata channel** — small, follows the existing EP-signature tier pattern |
| 9 | Via **TS decorator**, **`registerFunctionality`**, and **local API-doc manager field** | ✅ Feasible — mirrors the existing `@epParam` / `describeEP` / manager "Type" plan |
| 10 | The contained element is **rendered in the designer like the frontend** | ✅ Feasible — `XMirror.renderItemPreview` + `MirrorFormAccess.renderElementNode` |

---

## 2. Grounding — what already exists

### 2.1 Custom widget registration (Kotlin)
- Widget plugin: [`CodbiFormElementWidgetPlugin.kt`](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/plugin/CodbiFormElementWidgetPlugin.kt:37)
  (`getWidgets()` returns the widget classes).
- Catalogue (drag-and-drop template): [`CodbiFormElementCataloguePlugin.kt`](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/plugin/CodbiFormElementCataloguePlugin.kt:60).
- The reference widget: [`XMirror.kt`](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/XMirror.kt:41)
  — implements `IXItemWidget` + `IXItemAppendable`, exposes `getAvailableProperties()`
  ([line 230](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/XMirror.kt:230)),
  `getIcon()`/`getCssData()` ([line 257](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/XMirror.kt:257)),
  and both render paths:
  - live/published: `renderItem` → [`MirrorFormAccess.renderElementNode`](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/MirrorFormAccess.kt:1) (line 71),
  - designer canvas: `renderItemPreview` ([line 102](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/XMirror.kt:102)).

> The "rendered in the designer exactly like the frontend" requirement (#10) is *already solved*
> by `renderItemPreview` for the Mirror. The only nuance is that today the Mirror preview renders the
> container and lets persisted children nest; for the new widget we can render the live node in the
> preview too (the code path exists).

### 2.2 Designer-side element selection + child materialization
- [`MirrorElementSelect.ts`](src/main/web/packages/designer/src/js/MirrorElementSelect.ts:49) — a custom
  `Editors.BaseEditor` "source element" dropdown that re-renders on change and calls
  `syncMirrorChildren(...)` ([line 59](src/main/web/packages/designer/src/js/MirrorElementSelect.ts:59)).
- [`MirrorChildItems.ts`](src/main/web/packages/designer/src/js/MirrorChildItems.ts:16) — materializes the
  source element's subtree as real child items via the designer's internal
  `_createItemFromCatalogue` ([line 62](src/main/web/packages/designer/src/js/MirrorChildItems.ts:62)).

> Requirement #4 ("changing the element swaps the contained object") is exactly
> `syncMirrorChildren` — reuse it verbatim with the target being the widget's single child.

### 2.3 The EP selector + filtering + EP builder
- [`EPManager.ts`](src/main/web/packages/designer/src/js/EPManager.ts:14) — the flat EP listing
  (`mode: "SV" | "EP"`, filtering/insertion).
- [`EPBuilder.ts`](src/main/web/packages/designer/src/js/EPBuilder.ts:1) — the modal builder opened on
  **ALT+E**, with `openEPBuilder({ value, listEPs, onApply })`
  ([line 1067](src/main/web/packages/designer/src/js/CodbiElementMarkers.ts:1067)) and
  `resolveEPSignatureForId` ([line 799](src/main/web/packages/designer/src/js/EPBuilder.ts:799)).
- [`EPExpression.ts`](src/main/web/packages/designer/src/js/EPExpression.ts) — shared parse/serialize.

> Requirement #3's "selector like the EP selector in the EP builder (filtering included)" and
> requirement #6's "open flat EP listing / EP builder" both reuse these modules directly.

### 2.4 The parameter table with checkboxes / text + EP launcher
- [`CodbiElementMarkers.ts`](src/main/web/packages/designer/src/js/CodbiElementMarkers.ts:1016)
  `buildFuncParamTable()` — one row per `data-cb-*` parameter; value input + trash button; **ALT+E**
  opens `openEPBuilder` ([line 1060](src/main/web/packages/designer/src/js/CodbiElementMarkers.ts:1060)).
- [`setFuncAttribute`](src/main/web/packages/designer/src/js/CodbiElementMarkers.ts:412) /
  [`removeFuncAttribute`](src/main/web/packages/designer/src/js/CodbiElementMarkers.ts:472) — write into
  `props.attributes`, i.e. **the element's config attribute table** (requirement #7 already works).

> Requirement #5 + #6 + #7 = this table, plus a boolean⇄text toggle (new, ~small).

### 2.5 Functionality + parameter metadata
- Registration: [`CodBi.registerFunctionality`](src/main/web/packages/form/src/js/global-scope.ts:1257)
  (and `extendFunctionality`), mirrored in `window.codbi`.
- Metadata: [`CodbiPluginData.d.ts`](src/main/web/packages/designer/src/js/CodbiPluginData.d.ts:48)
  `detFunctionalities[key].Parameter: { [key: string]: string }`.
- The local API-doc manager edits these `Parameter` rows ([`LocalDocInterface.ts`](src/main/web/packages/designer/src/js/LocalDocInterface.ts:1818) builds the parameter listing;
  [`manager.ts`](src/main/web/packages/designer/Angular/Components/codbi-apidoc/projects/manager/src/app/manager/manager.ts:100) `ApiParameter`).
- EP signatures already demonstrate the exact three-tier metadata pattern the user wants for
  **allowed form-element types** — see [`plans/ep-builder-plan.md`](plans/ep-builder-plan.md:129)
  (Tier A TSDoc/`@epParam`, Tier B manager, Tier C runtime `describeEP`).

### 2.6 The logo
- Runtime inline SVG: [`Logo.ts`](src/main/web/packages/form/src/js/Logo.ts:2) (`CodBiLogo()`).
- Servable resource: `Symbol_CodBi.svg` (referenced e.g.
  [`MirrorSelect.ts`](src/main/web/packages/designer/src/js/MirrorSelect.ts:74), Angular dialogs).

---

## 3. New work (the only non-trivial parts)

### 3.1 `Functionality` widget class (Kotlin)
A new `XFunctionality : IXItemWidget, IXItemAppendable`, modelled 1:1 on `XMirror`:
- `getAvailableProperties()` exposes:
  - `codbi_func_funcs` — CSV of chosen functionality ids,
  - `codbi_func_element` (+ `_name`) — the single target element id,
  - the standard `XPropertyEnum.cssclasses` etc.
- `renderItem` / `renderItemPreview`: render the wrapped single element via `MirrorFormAccess`,
  and (requirement #10) render the **live node in the preview too** so the designer shows the
  frontend look.
- No own submitted value (`isSubmitsValues() = false`), its own prefix and element-type list entry.
- Register in [`CodbiFormElementWidgetPlugin.getWidgets()`](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/plugin/CodbiFormElementWidgetPlugin.kt:37)
  and add a catalogue entry in [`CodbiFormElementCataloguePlugin.getCatalogueData()`](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/plugin/CodbiFormElementCataloguePlugin.kt:60).

### 3.2 Icon (requirement #1)
Derive `Symbol_CodBi_Functionality.svg` (and the inline `FUNCTIONALITY_ICON_SVG` const) from the
existing CB logo: keep the `C` ornaments/brackets, replace the `CB` glyph with an `F`. Two options:
- **A (recommended):** a hand-authored, static SVG (the animated `CodBiLogo()` gradient/animate
  stops are irrelevant for a palette icon) — paint it via `getCssData()` as `XMirror` does
  ([`XMirror.kt:271`](src/main/kotlin/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/logic/mirror/XMirror.kt:271)).
- **B:** reuse `CodBiLogo()`'s SVG body and swap only the glyph path in the centre.

### 3.3 Allowed form-element types per functionality (requirement #8/#9) — the new channel
Extend the functionality metadata with a list of allowed widget class names, and surface it through
the three existing tiers:

- **Tier A — TS decorator:** a new tag (e.g. `@funcElement XFieldSet`, repeatable; or a
  `{elements: [...]}` descriptor) parsed by the same generator that already reads `@epParam`
  ([`generate-codbi-compact-api.ps1`](scripts/generate-codbi-compact-api.ps1:176) / the runtime
  scanner at [`global-scope.ts:528`](src/main/web/packages/form/src/js/global-scope.ts:528)).
- **Tier B — `registerFunctionality`:** add an optional descriptor argument (backwards compatible —
  existing 2-arg calls keep working), e.g.:
  ```ts
  window.codbi.registerFunctionality("HTML.Panel", init, {
    formElements: ["XContainer", "XContainerInvisible", "XFieldSet", "XAccordion"]
  });
  ```
  plus a standalone `describeFunctionality(id, meta)` (mirroring `describeEP`).
- **Tier C — manager field:** add a **"Form element types"** column/list to the functionality
  parameter editor in [`manager.ts`](src/main/web/packages/designer/Angular/Components/codbi-apidoc/projects/manager/src/app/manager/manager.ts:100),
  persisted via the existing local API-doc DB path
  ([`codbi-local-apidoc-changelog.xml`](src/main/resources/db/changelog/codbi-local-apidoc-changelog.xml:1)).

Runtime cache: `detFunctionalities[key].formElements?: string[]` (and/or a `funcMeta` registry
keyed like `epSignatures`).

### 3.4 Config editor wiring (requirements #3–#6)
A `FunctionalityConfigEditor` (custom `Editors.BaseEditor`, like [`MirrorElementSelect`](src/main/web/packages/designer/src/js/MirrorElementSelect.ts:49))
that renders, top-to-bottom:
1. **Functionality multi-select** with filtering — reuse the `EPManager` option/filter logic and/or
   the existing [`MultiSelect`](src/main/web/packages/designer/src/js/MultiSelect.ts:1) editor; a "+"
   button to append.
2. **Target element selector** — reuse `MirrorElementSelect` (filtered to elements whose widget
   class is in the union of the selected functionalities' allowed `formElements`).
3. **Parameter rows** — reuse `buildFuncParamTable`'s row/`setFuncAttribute` logic; boolean params
   render a checkbox, others a text input; each value cell gets the **EP button** (flat listing +
   builder) with the checkbox⇄text flip: focusing/EP-triggering a checkbox converts it to a text
   input, clearing the text restores the checkbox.

---

## 4. Phased, shippable plan

1. **Widget skeleton** — `XFunctionality` + registration + catalogue entry + icon; renders the
   wrapped element (reuse `MirrorFormAccess`); designer preview shows the frontend look.
2. **Metadata channel** — `formElements` on functionality descriptors: `registerFunctionality`
   overload + `describeFunctionality` + runtime cache + `CodbiPluginData.d.ts` type surface.
3. **Config editor** — functionality multi-select (filtered) + "+", target-element selector
   (filtered by allowed types), swapping the wrapped element via `syncMirrorChildren`.
4. **Parameter table** — boolean checkboxes / string inputs, EP button (flat listing + builder), the
   checkbox⇄text flip, writes through `setFuncAttribute`/`removeFuncAttribute`.
5. **Tiers A/C** — `@funcElement` TS tag + generator parsing + backfill; manager "Form element types"
   field + DB column + import/export/merge.
6. **Tests** — widget registration, metadata resolution per tier, element-type filtering, parameter
   round-trip (Jest/jsdom + Kotlin unit test, matching existing `__tests__` patterns).

---

## 5. Risks / open points

- **Widget config storage shape**: choose how selected functionalities + their parameter values are
  persisted on the item (CSV property + `data-cb-*` attributes, mirroring how functionalities already
  work) so the runtime and workflows see them unchanged.
- **Element-type filtering source of truth**: the set of widget class names must match FORMCYCLE's
  real classes (`XFieldSet`, `XContainer`, …) — derive from the designer catalogue, not a hardcoded
  string list.
- **Allowed-type backfill**: built-in functionalities need their `formElements` filled in; until
  then, treat "no metadata" as "any element" (fail-open), exactly as the EP signature resolver does.
- **Preview fidelity**: rendering the live node in the designer canvas (not just the container) is
  the one behavioural difference from `XMirror`; keep the `XWidgetIcon` fallback for unconfigured
  widgets.
