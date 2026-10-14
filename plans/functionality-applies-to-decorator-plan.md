# `@SupportedFormelementtype` decorator — element-type + property-constraint applicability

> Goal: let a functionality declare, next to its `functionality()` method, **which form-element types
> it applies to** and **optional per-type property constraints** — e.g. "only an `XTextField` whose
> `datatype` is `dateDE`". Replaces the fragile `@funcElement` comment scan with real runtime metadata.
>
> The decorator is named **`@SupportedFormelementtype`** and is applied **only to the
> `functionality()` method** of a functionality class.

---

## 1. Where the information is needed (grounding)

- Runtime registry: [`FunctionalityMeta`](../src/main/web/packages/form/src/js/global-scope.ts:57) carries `formElements: string[]` (type-only), resolved by [`resolveFunctionalityMeta()`](../src/main/web/packages/form/src/js/global-scope.ts:566) from several tiers.
- Designer matcher: [`allowedFormElements()`](../src/main/web/packages/designer/src/js/FunctionalityConfigEditor.ts:182) → [`functionalityAppliesTo(id, elementType)`](../src/main/web/packages/designer/src/js/FunctionalityConfigEditor.ts:217).
- The element's config is on the designer item: `item.className` + `item.getPersist()?.properties` / `item.properties` (see [`propertiesOf()`](../src/main/web/packages/designer/src/js/CodbiElementMarkers.ts:342)). The relevant property is **`datatype`** (e.g. values `dateDE`, `time`, `datetime`, `phone`, `plzDE`, `money`, `formattedNumber`, `text`, … — see [`Appointments.json:4`](../src/main/web/packages/form/src/js/Configurations/Appointments.json:4), [`Financial.json:4`](../src/main/web/packages/form/src/js/Configurations/Financial.json:4), [`log-tree-node.ts:418`](../src/main/web/packages/designer/Angular/Components/codbi-apidoc/projects/manager/src/app/ai-assistant-log/log-tree-node.ts:418)).

---

## 2. Decorator API

A **method decorator** on `functionality()` (method decorators are already used here, e.g.
[`@DBC.ParamvalueProvider`](../src/main/web/packages/form/src/js/Functionalities/date.frame.ts:38)).

```ts
// 1) no constraints — one or more types
@SupportedFormelementtype("XTextField")
@SupportedFormelementtype(["XTextField", "XTextArea"])

// 2) per-type property constraints (the new capability)
@SupportedFormelementtype({
  XTextField: { datatype: "dateDE" },      // only German date input fields
  XTextArea: undefined,                    // textareas, unconstrained
})
public static functionality(toLoad, toProcess) { … }
```

### Spec type

```ts
type PropertyRequirement = string | number | boolean | Array<string | number | boolean>;
type TypeRequirements = { [propertyName: string]: PropertyRequirement };
type SupportedFormelementtypeSpec =
  | string
  | string[]
  | { [widgetClassName: string]: TypeRequirements | undefined };
```

### Matching semantics (deterministic)

For an element `E` the functionality applies iff the spec is empty/absent (**fail-open = any**) OR
there is a key `K` such that:
- `K` equals `E.className` (case-insensitive), **and**
- for every `prop → required` in `K`'s requirements the element's property `prop` matches:
  - values compared as trimmed, lower-cased strings;
  - array `required` = OR over its entries;
  - multiple properties = AND;
  - a missing element property = **no match** (unless the requirement lists `"*"` = "must be present");
  - string `"*"` wildcard = any non-empty value.

Multiple spec keys = **OR**. An empty requirement object = no constraint.

---

## 3. Runtime model (form package)

Extend the metadata to carry the rich form while keeping `formElements: string[]` for back-compat:

```ts
export interface FormElementRequirement {
  type: string;                                  // widget class name
  properties?: Record<string, string[]>;         // property → allowed values (normalized)
}
export interface FunctionalityMeta {
  formElements: Array<string>;                   // DERIVED (types) — unchanged consumers
  requirements?: FormElementRequirement[];       // rich (types + constraints)
  source: "tsdoc" | "manager" | "runtime" | "heuristic" | "decorator";
}
export interface FunctionalityMetaInput {
  formElements?: string | string[];              // back-compat
  supportedFormelementtypes?: SupportedFormelementtypeSpec; // NEW
  source?: FunctionalityMeta["source"];
}
```

- New module [`FunctionalityMeta.ts`](../src/main/web/packages/form/src/js/FunctionalityMeta.ts): the `SupportedFormelementtype` decorator (stores the spec in a `WeakMap<Function, SupportedFormelementtypeSpec>` keyed by the decorated `functionality()` method), `supportedFormelementtypeOf(fn)`, and `normalizeSupportedFormelementtype(spec): FunctionalityMetaInput`.
- [`resolveFunctionalityMeta()`](../src/main/web/packages/form/src/js/global-scope.ts:566) tier order becomes:
  **explicit runtime meta → decorator → `@funcElement` comment scan → published `funcMeta` → `detFunctionalities[].formElements` (type-only).**
- [`normalizeFunctionalityMeta()`](../src/main/web/packages/form/src/js/global-scope.ts:613) also derives `formElements` from `requirements` and normalizes constraint values.

---

## 4. Designer matcher

- [`allowedFormElements(id)`](../src/main/web/packages/designer/src/js/FunctionalityConfigEditor.ts:182) → return `requirements` when present, else the `formElements` list.
- Change the matcher to evaluate the **element**, not just its class name:
  `functionalityAppliesTo(id, element)` where `element` is the designer item-like (`className` + property bag). Keep a `(id, className)`-only overload that ignores constraints (used where only a type is known, e.g. the widget target-type selector).
- Callers:
  - [`ElementFunctionalityConfigEditor.renderFunctionalityList()`](../src/main/web/packages/designer/src/js/ElementFunctionalityConfigEditor.ts:237): pass `this.targetElement()` instead of `targetElement()?.className`.
  - [`allowedFormElementsFor(ids)`](../src/main/web/packages/designer/src/js/FunctionalityConfigEditor.ts:237): unchanged (type-union) — the widget creates a brand-new element of a type, so property constraints don't apply there.

---

## 5. Manager / JSON tier (decision)

The manager stores `formElements` as a **CSV multi-select** ([`selectedFormElementTypes`](../src/main/web/packages/designer/Angular/Components/codbi-apidoc/projects/manager/src/app/manager/manager.ts:3261)) which cannot express constraints.

- **Proposed for iteration 1:** constraints come from the **decorator / explicit meta** only; the manager/JSON tier stays type-only. Add a follow-up to store a structured `supportedFormelementtypes` object in the functionality `.json` + manager node data + DB.
- (Alternative: extend now with `supportedFormelementtypes` in `.json` and the manager — larger, touches DB changelog.)

---

## 6. Migration

- Add `@SupportedFormelementtype(...)` to the `functionality()` method of every functionality in `Functionalities/*.ts`, mirroring today's `@funcElement` tags and adding `datatype` constraints where meaningful, e.g.:
  - `date.frame` / `date.min` / `date.noweekends` → `{ XTextField: { datatype: "dateDE" } }` (confirm exact date value).
  - `time.frame` → `{ XTextField: { datatype: "time" } }`.
  - `html.input.tinymce` → `{ XTextArea: undefined }`.
  - `media.multipleupload` → `{ XUpload: undefined }`.
  - panels → `{ XContainer: undefined, XContainerInvisible: undefined, XFieldSet: undefined }`.
  - inputs restricted to text (e.g. `html.input.cleave` for money → `{ XTextField: { datatype: ["money", "formattedNumber"] } }`).
- Keep the `@funcElement` comment for now (harmless fallback); remove later once the decorator is proven.

---

## 7. Decisions to confirm

1. **Semantics**: map form (per-type property requirements), AND across properties / OR across array values, case-insensitive — OK?
2. **`datatype` values**: exact value set to use for the date/time migrations (`dateDE`? `date`? `datetime`?) — the configs suggest `dateDE`/`time`.
3. **Manager/JSON**: constraints from the decorator/meta only for now (§5), or extend the manager/DB now?
4. **Fail behaviour**: when a designer item's properties are unavailable (still loading), treat as **fail-open** (show the functionality) — confirm.

---

## 8. Phasing

1. Runtime model + `SupportedFormelementtype` decorator + `supportedFormelementtypeOf` + normalization ([`FunctionalityMeta.ts`](../src/main/web/packages/form/src/js/FunctionalityMeta.ts), [`global-scope.ts`](../src/main/web/packages/form/src/js/global-scope.ts)).
2. Designer matcher over the element's property bag + caller updates.
3. Migrate functionalities (types first, then constraints).
4. Tests ([`functionality-meta.spec.ts`](../src/main/web/packages/form/__tests__/functionality-meta.spec.ts)): decorator resolution, normalization, matching (type + property, OR/AND/array/case/missing/wildcard).
5. (Follow-up) Manager/JSON structured `supportedFormelementtypes`.
