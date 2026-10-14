// Common JavaScript logic that can be used by both the form and the designer package.
//
// Declares the `@SupportedFormelementtype` decorator plus the canonical model and matcher used to
// decide whether a **CodBi Functionality** may be applied to a given FORMCYCLE form element:
// one or more form-element widget classes, each optionally constrained by element-property values
// (e.g. only an `XTextField` whose `datatype` is `dateDE`).

/**
 * A value a form-element property may be required to have: a single value, an OR-list of values, `"*"`
 * (the property must be present and non-empty), or a glob containing `*` (e.g. `date*` matches every
 * date-like datatype). Comparisons are case-insensitive.
 */
export type TPropertyRequirement = string | number | boolean | ReadonlyArray<string | number | boolean>;

/** Required property values for one form-element widget class (AND across properties). */
export type TTypeRequirements = { readonly [propertyName: string]: TPropertyRequirement };

/**
 * The spec accepted by {@link SupportedFormelementtype }: a single widget class name, a list of
 * widget class names (no constraints), or a map of widget class name → (optional) requirements.
 */
export type TSupportedFormelementtypeSpec =
  | string
  | ReadonlyArray<string>
  | { readonly [widgetClassName: string]: TTypeRequirements | undefined };

/** One resolved requirement: a widget class plus optional property constraints. */
export interface IFormElementRequirement {
  /** The FORMCYCLE widget class name (e.g. `XTextField`). */
  type: string;
  /** Required property values (property name → allowed value(s)). Absent/empty = type only. */
  properties?: Record<string, string[]>;
}

/** The metadata contributed by {@link SupportedFormelementtype }. */
export interface ISupportedFormelementtypeMeta {
  /** The plain widget class names (derived) — back-compat with `FunctionalityMeta.formElements`. */
  formElements: string[];
  /** The rich requirements (types + property constraints). */
  requirements: IFormElementRequirement[];
}

/**
 * Global symbol under which {@link SupportedFormelementtype } stores the spec ON the decorated
 * function. A `Symbol.for` key (rather than a module-local `WeakMap`) so the metadata stays visible
 * across separately bundled modules: a functionality loaded on its own still declares its metadata
 * to the runtime resolver, which reads the very same symbol.
 */
const SPEC_KEY = Symbol.for("codbi.functionality.supportedFormelementtype");

/**
 * Method decorator for a functionality's `functionality()` method. Declares the FORMCYCLE
 * form-element types the functionality supports, each optionally constrained by property values:
 *
 * ```ts
 * @SupportedFormelementtype({ XTextField: { datatype: "dateDE" }, XTextArea: undefined })
 * public static functionality(toLoad, toProcess) { … }
 * ```
 *
 * A functionality without the decorator (or with an empty spec) applies to **any** element
 * (fail-open), consistent with the existing `@funcElement` / manager tiers. To target any widget class
 * EXPLICITLY — optionally narrowed by property constraints, e.g. `{ "*": { datatype: "dateDE" } }` for
 * "any element whose datatype is dateDE" — use `"*"` as the type.
 *
 * A property constraint VALUE may be an exact value, an OR-list of values, `"*"` (the property must be
 * present and non-empty), or a glob containing `*` (e.g. `datatype: "date*"` matches every date-like
 * datatype such as `dateDE`). All comparisons are case-insensitive.
 *
 * @param spec The supported widget classes and their optional property constraints. */
export function SupportedFormelementtype(spec: TSupportedFormelementtypeSpec): MethodDecorator {
  return (_target, _propertyKey, descriptor) => {
    if (typeof descriptor.value === "function") {
      (descriptor.value as unknown as Record<symbol, TSupportedFormelementtypeSpec>)[SPEC_KEY] = spec;
    }
  };
}

/** @returns the spec declared via {@link SupportedFormelementtype } for the given function, or undefined. */
export function supportedFormelementtypeOf(target: unknown): TSupportedFormelementtypeSpec | undefined {
  return typeof target === "function"
    ? (target as unknown as Record<symbol, TSupportedFormelementtypeSpec | undefined>)[SPEC_KEY]
    : undefined;
}

/** Normalizes a spec into the canonical `{ formElements, requirements }` shape. */
export function normalizeSupportedFormelementtype(
  spec: TSupportedFormelementtypeSpec | undefined,
): ISupportedFormelementtypeMeta {
  const requirements: IFormElementRequirement[] = [];

  if (typeof spec === "string") {
    requirements.push({ type: spec.trim() });
  } else if (Array.isArray(spec)) {
    for (const type of spec) {
      requirements.push({ type: String(type).trim() });
    }
  } else if (spec != null && typeof spec === "object") {
    for (const [type, props] of Object.entries(spec)) {
      const properties = normalizeTypeRequirements(props);
      const entry: IFormElementRequirement = { type: String(type).trim() };

      if (properties) {
        entry.properties = properties;
      }
      requirements.push(entry);
    }
  }

  const seen = new Set<string>();
  const filtered = requirements.filter((entry) => {
    if (entry.type.length === 0 || seen.has(entry.type)) {
      return false;
    }
    seen.add(entry.type);

    return true;
  });
  const formElements = Array.from(seen);

  return { formElements, requirements: filtered };
}

/** Normalizes one type's property requirements to `property → string[]` (trimmed, lower-cased, deduped). */
function normalizeTypeRequirements(props: TTypeRequirements | undefined): Record<string, string[]> | undefined {
  if (props == null || typeof props !== "object") {
    return undefined;
  }

  const out: Record<string, string[]> = {};

  for (const [name, value] of Object.entries(props)) {
    const key = String(name).trim();

    if (key === "") {
      continue;
    }

    const values = Array.from(
      new Set(
        (Array.isArray(value) ? value : [value])
          .map((entry) => String(entry).trim().toLowerCase())
          .filter((entry) => entry.length > 0),
      ),
    );

    if (values.length > 0) {
      out[key] = values;
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * @returns whether a form element matches the requirements. An empty/absent list means the
 * functionality applies to **any** element (fail-open).
 *
 * Matching: the widget class name equals a requirement's `type` (case-insensitive), OR the requirement's
 * type is `"*"` (any widget class), AND every property constraint of that requirement is satisfied.
 * Property values are compared as trimmed, lower-cased strings; an array of allowed values is an OR;
 * multiple properties are an AND. A requirement VALUE of `"*"` means "the property must be present and
 * non-empty"; any other value containing `*` is a case-insensitive glob (e.g. `date*` matches `dateDE`).
 * A missing element property never matches.
 *
 * @param requirements The resolved requirements (e.g. `FunctionalityMeta.requirements`).
 * @param className    The element's widget class name (e.g. `item.className`).
 * @param properties   The element's property bag (e.g. the designer item's persisted properties). */
export function formElementMatchesRequirements(
  requirements: ReadonlyArray<IFormElementRequirement> | undefined,
  className: string | undefined,
  properties: Record<string, unknown> | undefined,
): boolean {
  if (requirements == null || requirements.length === 0) {
    return true;
  }

  const cls = String(className ?? "")
    .trim()
    .toLowerCase();

  for (const requirement of requirements) {
    const type = String(requirement.type ?? "")
      .trim()
      .toLowerCase();
    // A `"*"` type matches ANY widget class; a specific type must equal the element's class name (an
    // unknown class name `""` never matches a specific type).
    if (type !== "*" && (cls === "" || type !== cls)) {
      continue;
    }
    if (matchesPropertyRequirements(requirement.properties, properties)) {
      return true;
    }
  }

  return false;
}

/** @returns whether every required property of a requirement matches (AND across properties). */
function matchesPropertyRequirements(
  required: Record<string, string[]> | undefined,
  properties: Record<string, unknown> | undefined,
): boolean {
  if (required == null) {
    return true;
  }

  for (const [name, allowed] of Object.entries(required)) {
    const actual = String(findProperty(properties, name) ?? "")
      .trim()
      .toLowerCase();

    if (allowed.includes("*")) {
      if (actual === "") {
        return false;
      }
      continue;
    }

    if (!allowed.some((value) => valueMatchesRequirement(value, actual))) {
      return false;
    }
  }

  return true;
}

/**
 * @returns whether an element's (already lower-cased) property value satisfies one required value. An
 * exact match wins; a value containing `*` is treated as a case-insensitive glob (e.g. `date*` matches
 * `dateDE`). The lone `"*"` (must-be-present) case is handled by the caller.
 *
 * @param pattern One allowed value (exact, or a glob containing `*`).
 * @param actual  The element's lower-cased property value. */
function valueMatchesRequirement(pattern: string, actual: string): boolean {
  const pat = String(pattern).trim().toLowerCase();

  if (!pat.includes("*")) {
    return pat === actual;
  }

  const escaped = pat.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");

  return new RegExp(`^${escaped}$`).test(actual);
}

/** Case-insensitive property lookup within an element's property bag. */
function findProperty(properties: Record<string, unknown> | undefined, name: string): unknown {
  if (properties == null) {
    return undefined;
  }

  if (name in properties) {
    return properties[name];
  }

  const wanted = name.toLowerCase();

  for (const key of Object.keys(properties)) {
    if (key.toLowerCase() === wanted) {
      return properties[key];
    }
  }

  return undefined;
}
