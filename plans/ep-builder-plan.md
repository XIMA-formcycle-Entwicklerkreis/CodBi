# EP Builder — Architecture Plan

> Goal: pressing **ALT+E** on a *codbi marker* parameter-value input (and, secondarily, on a
> `data-cb-*` value cell of the element config attribute table) must open a **popup "EP builder"**
> — not the current flat listing — that lets the user **add and nest Element Placeholders** in a
> convenient, guided interface.

This document answers: *"The only info about which parameter an EP takes is in the EP's TSDoc…
how could we create an EP builder that can handle all of this?"* and lays out the concrete,
incremental implementation.

---

## 1. What exists today (grounding)

### 1.1 The two ALT+E sites

| Site | File | Behaviour |
| :--- | :--- | :--- |
| Element **config attribute table** (`.r2` value cell) | [`LocalDocInterface.ts`](../src/main/web/packages/designer/src/js/LocalDocInterface.ts:1884) | ALT+E switches `epManager.mode` to `EP`, rebuilds the flat file list and shows the `xc-epmanager` listing + API-doc details. |
| Marker **parameter/value table** input | [`CodbiElementMarkers.ts`](../src/main/web/packages/designer/src/js/CodbiElementMarkers.ts:961) | **No ALT+E today** — only `change` (persist) and `Enter` (blur). This is the primary target. |

The flat listing is the `xc-epmanager` custom element ([`EPManager.ts`](../src/main/web/packages/designer/src/js/EPManager.ts:14)); on selection it inserts the literal text `{ <Id> >  }`
(see [`insertSelectedOption()`](../src/main/web/packages/designer/src/js/EPManager.ts:192)) and lets the user type the parameters by hand. **It knows nothing about parameters or types** — that is exactly the gap to close.

### 1.2 EP runtime grammar and API

Defined in [`global-scope.ts`](../src/main/web/packages/form/src/js/global-scope.ts:275):

```ts
protected nestingBraces = { opening: "{", closing: "}", epSeparator: ">", paramSeparator: ";" };
```

So an EP in an attribute value is `{ EP.Id > param1; param2; … }`; **nesting is already textual** — a
parameter slot may itself contain `{ Other.EP > … }`; `{`/`}` can be escaped with a leading `°`.

Registration carries **no signature** ([`registerEP()`](../src/main/web/packages/form/src/js/global-scope.ts:292) / [`extendEP()`](../src/main/web/packages/form/src/js/global-scope.ts:320)):

```ts
public registerEP(id: string, generator: (params: Array<string>) => …): boolean
```

The parser/resolver that splits an EP string into key + params already exists (`getOutermostEP()`,
`resolveEP()`, `resolveEPParams()`, `retrieveEPValue()`), so the builder can round-trip hand-typed
EPs instead of inventing a second parser.

### 1.3 Where parameter information lives today

1. **TSDoc** on each built-in EP has a `Config Parameter:` / `Placeholder Parameter:` list using
   ordinals, e.g. `Sorted` ([`sorted.ts`](../src/main/web/packages/form/src/js/EPs/sorted.ts:12)):

   ```
   ### Config Parameter:
   - 1st: The {@link Array } to sort.
   - 2nd: The optional name of a property to use to sort elements of the given {@link Array }.
   ```

2. The build script [`generate-codbi-compact-api.ps1`](../scripts/generate-codbi-compact-api.ps1:176)
   parses those ordinals with `Get-EpParamHints()` into `parameters: { "1": "…", "2": "…" }` inside
   [`codbi-core-details-index.json`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-details-index.json:807).

3. The designer runtime reads them as `window.CodbiPluginData.detElementplaceholder[key].Parameter`
   ([`CodbiPluginData.d.ts`](../src/main/web/packages/designer/src/js/CodbiPluginData.d.ts:33)),
   indexed by the numeric ordinal (see `toDescriptiveArray()` in
   [`manager.ts`](../src/main/web/packages/designer/Angular/Components/codbi-apidoc/projects/manager/src/app/manager/manager.ts:3218)).

4. The local API-doc manager edits that list with **Name + Description only** — **no Type**
   ([`onClick_…_AddParameter`](../src/main/web/packages/designer/Angular/Components/codbi-apidoc/projects/manager/src/app/manager/manager.ts:3086),
   [`ApiParameter`](../src/main/web/packages/designer/Angular/Components/codbi-apidoc/projects/manager/src/app/manager/manager.ts:100)).

### 1.4 Known weaknesses of the current signature data

- **No datatype** anywhere → the builder cannot pick a fitting leaf editor.
- **Parser is fragile**: the ordinal regex `-\s*(\d+)(?:st|nd|rd|th)\s*:` misses entries written as
  `1.`/`1)` (observed: `Net.URL` ends up with `"parameters": {}` — see
  [`codbi-core-details-index.json`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-details-index.json:728)).
- Descriptions are truncated mid-sentence (`To-OneSentence`) — fine for prompts, too lossy for a form label.
- **No coverage** for EPs a user authors in **FormCycle's own JavaScript editor**: that code calls
  `registerEP`/`extendEP` at runtime and never passes through CodBi's LocalAPIDoc manager or the
  TSDoc pipeline.

---

## 2. Design principle: parameters are *soft-typed value slots*

Because a parameter value **may itself be produced by another EP** (nested EPs), a parameter's
runtime type is genuinely open. Therefore the builder treats every slot as a **union**, and the
signature type is a *hint for rendering + advisory validation*, never a hard gate:

```
ParamNode = literal(value, type?)          // typed leaf (string/number/boolean/array/object/date/any)
          | elementPlaceholder(ref)         // [%Field%] form-element placeholder
          | ep(EPNode)                       // nested  { Id > … }
```

The builder **must work with zero signature knowledge** (everything `any`, one free-text slot per
`;`-separated segment) and enrich progressively as the layered resolver (below) supplies data.

---

## 3. The signature model

Introduce one canonical descriptor, produced by every tier and merged into a single registry:

```ts
type EPValueType = "string" | "number" | "boolean" | "array" | "object" | "date" | "any";

interface EPParamSpec {
  index: number;            // 1-based position in the params array
  name?: string;            // optional human label ("array", "path", …)
  type: EPValueType;        // default "any"
  optional?: boolean;
  variadic?: boolean;       // e.g. OpenPLZ "up to four more params"
  description?: string;
}

interface EPSignature {
  params: EPParamSpec[];
  returnType?: EPValueType;
  source: "tsdoc" | "manager" | "runtime" | "heuristic";
}
```

Exposed (read-only) at runtime as `window.codbi.resolveEPSignature(id): EPSignature | undefined`
and cached in `window.CodbiPluginData.epSignatures: { [id: string]: EPSignature }`.

---

## 4. The layered signature resolver (the answer to "how do we know the parameters?")

Three tiers, resolved in order, merged into `epSignatures`. Every tier is optional; missing data
degrades to `type: "any"`.

### Tier A — TSDoc (built-ins, build-time) — *the tag you asked for*

Add a machine-readable tag **and** keep it readable for humans by allowing an inline `{Type}`
prefix on the existing ordinal bullet. Two accepted forms:

```ts
/**
 * ### Config Parameter:
 * - 1st: {array}  The {@link Array } to sort.
 * - 2nd: {string} The optional name of a property to use to sort elements.
 *
 * @epParam 3 {boolean} optional Whether to sort descending.
 * @epReturn {array}
 */
```

- Extend [`Get-EpParamHints()`](../scripts/generate-codbi-compact-api.ps1:176) to capture the
  optional leading `{Type}` (and `optional`/`variadic` markers) and to accept alternate ordinals
  (`1.`, `1)`, `1st:`), fixing the `Net.URL`-style misses.
- Add a parallel `Get-EpSignature()` emitting `"signature": { "params": [...], "returnType": … }`
  next to the existing `"parameters"` in
  [`codbi-core-details-index.json`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-details-index.json).
- This mirrors the existing DBC-style custom-tag approach the codebase already uses.
- **Run the generator deliberately** — the script header warns artifacts are hand-enriched and a
  plain run overwrites prose; hand-merge the diff.
- Backfill all built-in EPs in `src/main/web/packages/form/src/js/EPs/*.ts`.

### Tier B — local API-doc manager (DB) — *the missing Type field*

The manager already lets users create/rename EPs and edit their parameter list; it simply lacks a
type. Add a **Type** column (and optional `optional`/`variadic` flags) to the parameter editor:

- Extend `ApiParameter` (Type, Optional?, Variadic?) and the row editor in
  [`manager.ts`](../src/main/web/packages/designer/Angular/Components/codbi-apidoc/projects/manager/src/app/manager/manager.ts:100).
- Persist via the existing local API-doc DB path
  ([`codbi-local-apidoc-changelog.xml`](../src/main/resources/db/changelog/codbi-local-apidoc-changelog.xml))
  — either new columns or a `Signature` JSON blob per element.
- Include the type in the manager's import/export/merge path
  (`convertSingleNode`, `mergeDataIntoStructuredTree`, `enrichData`).
- On load, fold these into `epSignatures` (source `"manager"`).

### Tier C — runtime / JS-authored EPs — *the FormCycle JavaScript editor case*

EPs a user writes in FormCycle's own JavaScript editor are registered by calling
`window.codbi.registerEP(...)` / `extendEP(...)` when the form runs. **That code does not pass
through CodBi's LocalAPIDoc manager**, so there is no build-time or save-time hook and no TSDoc
pipeline. The signature must therefore be captured **at runtime**, by the same `window.codbi`
instance the code registers against. Three complementary mechanisms, from best to fallback:

1. **Signature-carrying registration (preferred, works anywhere).** Extend the public API with an
   optional descriptor argument — the form's JS states the schema right at the call site:
   ```ts
   window.codbi.registerEP("My.EP", (params) => …, {
     params: [
       { index: 1, name: "input",  type: "array"  },
       { index: 2, name: "by",     type: "string", optional: true }
     ],
     returnType: "any"
   });
   ```
   The runtime stores it in the signature registry at registration time, regardless of where the code
   lives. Plus a standalone `window.codbi.describeEP(id, signature)` for EPs registered by other
   means (remote modules, extensions) and for manual description from the builder.
2. **Runtime source inspection (no registration change).** When no descriptor is supplied, the
   builder reads the live generator from `window.codbi.availableEPs[id]` and parses
   `generator.toString()` for `@epParam`/`@epReturn` tags. This works for arbitrary user-authored JS
   in the FormCycle editor because that code is *not* transpiled/minified, so its comments survive.
   (Built-in package EPs are esbuild-bundled and normally have their comments stripped — that is what
   Tier A covers instead.)
3. **Heuristic fallback.** If nothing else is known, derive the arity from `generator.length`
   (declared parameters) → that many `any` slots (marked optional), and give the builder a
   **"Describe this EP…"** affordance that calls `describeEP` (and, for a managed local EP,
   optionally writes through Tier B). The builder is fully usable in this mode.

---

## 5. The builder: data model, parsing, serialization

### 5.1 AST (Abstract Syntax Tree)

```ts
interface EPNode  { kind: "ep"; id: string; params: ParamNode[]; raw?: string; }
type ParamNode =
  | { kind: "literal"; value: string; type?: EPValueType }
  | { kind: "elementPlaceholder"; ref: string }   // [%Field%]
  | EPNode;                                        // nested
```

Root of an attribute value = a list of `TextNode | EPNode | elementPlaceholder`, so literal prefixes
/ suffixes around an EP (`prefix {EP > …} suffix`) survive round-trips.

### 5.2 Parse / serialize (shared utility)

- **Parse**: reuse the existing grammar logic from
  [`getOutermostEP()`](../src/main/web/packages/form/src/js/global-scope.ts:388) and the
  parameter splitting used by `resolveEPParams()` — port it into a small, dependency-free
  `parseEPValue()`/`serializeEP()` module used by the designer (so the builder and the runtime can
  never disagree on the grammar, including `°` escaping).
- **Serialize**: emit `{ <Id> > <p1>; <p2>; … }`; empty optional trailing params are omitted only
  when they are the last segment (matching the runtime's tolerance); nested nodes recurse.
- **Round-trip** is a unit-test requirement (parse → serialize → parse is stable).

### 5.3 UI (popup / modal)

Triggered by **ALT+E** on the marker param input and (optionally) on the config-attribute `.r2`
cell. Layout:

- **Header**: current attribute name + the raw value, with an *Advanced (raw text)* toggle.
- **Tree editor**:
  - The root is the attribute value.
  - **“+ EP”** opens the EP picker — reuse the `epOptions` list
    (`window.CodbiPluginData.fslElementplaceholder`). Picking an EP renders **one row per declared
    param** from its `EPSignature`; unknown/`any` → an “auto” row per typed `;` segment.
  - Each param row has a mode switch: **Literal** (leaf editor chosen from `type`), **Element
    placeholder** (`[%…%]`, with a field picker), or **Nested EP** (recurses into “+ EP”).
  - `optional`/`variadic` params render an extra “+ Add optional parameter” affordance.
- **Validation (advisory)**: unknown EP id, arity mismatch, unclosed `{`, type mismatch — shown as
  warnings, never blocking (nested EPs may legitimately yield any type).
- **Preview (best effort)**: if the EP is resolvable in the designer context, call
  `window.codbi.retrieveEPValue(...)` / `resolveEP()` for a live value; otherwise mark as
  unavailable rather than fail.
- **Command**: **Apply** → serialize and write back.
  - Marker table: via the existing `setFuncAttribute(resolve(), param.name, value)` then re-render
    the badge ([`buildFuncParamTable()`](../src/main/web/packages/designer/src/js/CodbiElementMarkers.ts:961)).
  - Attribute table: write into the bound `<input>` and dispatch `change`.

### 5.4 What this replaces / keeps

- The flat `xc-epmanager` remains the **quick keyboard path** (type-and-commit). The builder is the
  **structured path** and supersedes hand-typing params.
- `EPManager.insertSelectedOption()` still emits `{ Id >  }`; when the builder is present the
  inserted stub is parsed immediately into an AST and expanded with editable slots.

---

## 6. Plumbing — files to touch

| Concern | File | Change |
| :--- | :--- | :--- |
| Runtime signature registry | [`global-scope.ts`](../src/main/web/packages/form/src/js/global-scope.ts:292) | `registerEP`/`extendEP` overloads + `describeEP` + `resolveEPSignature` + `epSignatures` cache. |
| Designer type surface | [`CodbiPluginData.d.ts`](../src/main/web/packages/designer/src/js/CodbiPluginData.d.ts:33) (+ Angular copy) | Add `epSignatures` / extend `detElementplaceholder[key]` with `Signature`. |
| Attribute-table ALT+E | [`LocalDocInterface.ts`](../src/main/web/packages/designer/src/js/LocalDocInterface.ts:1884) | Open the builder instead of / in addition to the flat listing. |
| Marker param ALT+E | [`CodbiElementMarkers.ts`](../src/main/web/packages/designer/src/js/CodbiElementMarkers.ts:961) | Add `keydown` ALT+E handler bound to the input; wire Apply → `setFuncAttribute`. |
| EP picker / listing reuse | [`EPManager.ts`](../src/main/web/packages/designer/src/js/EPManager.ts:14) | Expose options list / insertion helper for the builder. |
| Manager Type field | [`manager.ts`](../src/main/web/packages/designer/Angular/Components/codbi-apidoc/projects/manager/src/app/manager/manager.ts:100) | `ApiParameter.Type` + row editor + import/export/merge. |
| DB | [`codbi-local-apidoc-changelog.xml`](../src/main/resources/db/changelog/codbi-local-apidoc-changelog.xml) | Columns for type / optional / variadic (or a `Signature` blob). |
| Build script | [`generate-codbi-compact-api.ps1`](../scripts/generate-codbi-compact-api.ps1:176) | Parse `{Type}` + `@epParam`/`@epReturn`; emit `signature`; accept `1.`/`1)` ordinals. |
| Generated artifact | [`codbi-core-details-index.json`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-details-index.json) | New `signature` per EP (hand-merged). |
| i18n | `i18n/*`, package i18n | New `designer.epBuilder.*` keys. |

---

## 7. Phasing (each phase is shippable)

1. **Runtime signature registry + JS-authored path**: `registerEP`/`extendEP` overload,
   `describeEP`, `fn.length` heuristic, `resolveEPSignature`, `CodbiPluginData.epSignatures`.
2. **Shared parse/serialize module** + tests (round-trip incl. `°` escaping).
3. **Builder popup (literal + nested EP) on the marker table** (the primary ask), reading only
   whatever signatures exist (works with `any`).
4. **TSDoc `{Type}` / `@epParam` tag + generator + backfill** built-ins; emit `signature`.
5. **Manager Type field + DB + persistence** (Tier B).
6. **Attribute-table ALT+E** switched to the builder; optional live preview + advisory validation.
7. **Tests**: signature resolution per tier, grammar round-trip, builder DOM (Jest + jsdom, matching
   existing `__tests__` patterns).

---

## 8. Direct answers to the open worries

- **“Only info is in the TSDoc.”** → Tag it: inline `{Type}` on the existing ordinal bullets plus
  `@epParam`/`@epReturn` custom tags, parsed by the *already-existing* generator pipeline into a new
  `signature` block. Also fix the ordinal-syntax misses.
- **“The manager has fields but no type.”** → Add a **Type** column (Tier B); it is one of the three
  signature sources, persisted in the local API-doc DB.
- **“Users define EPs in the FormCycle JS editor.”** → That code does **not** pass through the
  LocalAPIDoc manager, so Tier C captures the signature **at runtime**: an explicit descriptor on
  `registerEP`/`extendEP`, else `@epParam` parsed from `generator.toString()`, else the `fn.length`
  heuristic — always degrading to `any`, with a “Describe this EP…” action in the builder.
- **“A parameter type might be anything / nested EPs.”** → Types are **soft hints**; every slot is a
  union of literal | `[%element%]` | nested EP; unknown ⇒ `any`; validation is advisory. The builder
  is fully functional with no signature at all.

---

## 9. Glossary

- **AST (Abstract Syntax Tree)** — a tree-shaped data structure representing the *structure* of a
  piece of text/code instead of its flat characters. Here the "code" is an EP expression:
  `{ Sorted > { Net.URL > https://x } ; name }` is stored in memory as an `EPNode(id: "Sorted")`
  whose params are `[ EPNode(id: "Net.URL"), literal("name") ]`. Editing that tree and rendering it
  back to text is what lets the builder add/nest EPs safely — brackets, `;` and `°`-escaping are
  produced by the serializer, never typed by the user. It is *abstract* because formatting/whitespace
  is discarded and only meaningful nodes remain, and a *syntax* tree because it mirrors the grammar
  (not the runtime values).
- **Element Placeholder (EP)** — CodBi's `{ Id > param; … }` expression, evaluated at form runtime.
- **Leaf editor** — the concrete widget for a parameter's literal value (text box, number spinner,
  checkbox, array rows, …), chosen from the parameter's type hint.
- **TSDoc/JSDoc** — the `/** … */` comment blocks the build/generator reads to produce EP
  descriptions and (after this plan) their parameter signatures.

---

## 10. Backward compatibility (old 2-arg registrations)

**Yes — existing FormCycle JS written against the old signature keeps working unchanged.** A
signature is *tooling metadata*: it never touches parsing, resolution or evaluation, so every form
resolves byte-for-byte as before. The registration change is **purely additive**:

- **The descriptor is always a trailing optional argument.** `generator` stays the 2nd argument:
  `registerEP(id, generator, signature?)` / `extendEP(id, generator, signature?)`. Old calls
  `registerEP(id, gen)` / `extendEP(id, gen)` simply omit it — in JS a missing trailing argument is
  `undefined`, so behaviour is identical. **Do not** overload the 2nd parameter (no
  `registerEP(id, descriptor)` form) — that would be ambiguous with a callable.
- **Shape-detect, never throw.** Treat the trailing argument as a descriptor only when it is an
  object with `Array.isArray(descriptor.params)`; anything else ⇒ “no signature” ⇒ fall back to the
  heuristic. An accidental extra argument is therefore ignored, not misread.
- **Follow the existing accept/reject path.** Register the signature only when the EP body is
  actually registered. On a duplicate (current `registerEP` logs and returns `false`), keep the
  **existing** signature so a discarded replacement cannot blank out a good schema. For `extendEP`,
  use the extension’s descriptor if given, otherwise keep the original’s.
- **Capture `generator.length` at registration time.** `extendEP` replaces
  `availableEPs[id]` with a 1-arg wrapper (`(params) => generator(params, formerEP)`), so lazily
  reading `availableEPs[id].length` would report the wrong arity for extended EPs. Store the
  original arity in the registry when the EP is first registered.
- **`describeEP` may run before the EP exists.** Buffer pending signatures and merge them on
  registration (the same pattern the codebase already uses for `pendingStandards`).
- **New shapes are optional.** `Signature?` on `detElementplaceholder[key]` and the new
  `window.CodbiPluginData.epSignatures` are optional fields, so existing readers of `Parameter`
  are unaffected; likewise the new TSDoc tags are comments (no runtime impact) and the generator is
  build-time with a hand-merged artifact.

---

## 11. When the builder meets a signature-less (old 2-arg) EP

An EP registered with the old 2-arg call has **no descriptor**, so `epSignatures[id]` may be empty.
The builder resolves a signature lazily and **always succeeds** — it just degrades. Resolution order
for an `id` the builder needs:

1. **Static registry first** (`window.CodbiPluginData.epSignatures[id]`) — Tier A (built-ins from the
   details index) and Tier B (managed local EPs). This is always available in the designer, even when
   the EP's runtime module is not loaded.
2. **Runtime source inspection** — if not found and the EP is loaded, scan
   `window.codbi.availableEPs[id]?.toString()` for `@epParam`/`@epReturn`; a hit is cached
   (source `"runtime"`).
3. **Arity heuristic** — else use the arity captured at registration (`generator.length`); if the EP
   predates this feature, fall back to `availableEPs[id]?.length` (which for an *extended* EP is the
   1-arg wrapper's `1`). Result: that many params, `type: "any"`, all `optional`.
4. **Unknown mode** — if the id is not loaded, has no static entry and no source: the builder still
   works with an **opaque, untyped slot**.

Note the common case: most "old 2-arg" EPs are the **built-in** ones, which still get a Tier A
signature from the details index regardless of how they were registered — so the fallback only affects
genuinely third-party / user EPs.

### Unknown-mode behaviour (never blocks the user)

- **Existing values stay editable.** The current attribute text is parsed with the real grammar
  (`{ id > p1; p2 }`), and the number of `;`-separated segments found becomes the number of rows — so
  an existing hand-typed EP shows its actual params as editable `any` rows, add/remove/nest intact.
- **Picking an unknown EP** inserts `{ id >  }` with one editable slot; extra `;` adds more; nesting
  is always allowed.
- **A banner** states *"No signature known for `<id>` — parameters shown as untyped."* with a
  **"Describe this EP…"** button that records `{ index, name, type, optional, variadic }` via
  `window.codbi.describeEP(id, signature)` (session-scoped) and, when the EP is a managed local EP,
  points the user to the LocalAPIDoc manager (Tier B). This never edits EP code and never affects
  execution.
- **Unknown / misspelled id** (not in `availableEPs` and not in the `epOptions` file list) is still
  insertable as literal text with a soft warning, because registration may occur at form runtime that
  the designer has not loaded.

Because steps 3–4 only produce *hints*, the builder is fully functional for any old EP: worst case the
user sees untyped slots and can describe the EP once to upgrade it to a rich editor.
