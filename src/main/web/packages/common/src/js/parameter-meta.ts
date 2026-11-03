// Common JavaScript logic that can be used by both the form and the designer package.
//
// Declares the `@ParameterTypes` method decorator plus the canonical model used to describe the TYPE
// of each parameter a **CodBi Functionality** accepts — `string`, `integer`, `number`, `boolean` or a
// fixed set of `enum` values. The spec is stored ON the decorated `functionality()` function (via a
// `Symbol.for` key, exactly like `@SupportedFormelementtype`), is published by the build-time
// generator into the functionality's sibling `.json` as `parameters`, and is consumed by the
// designer's parameter table to render a type-appropriate editor (checkbox, number box, dropdown).

/**
 * The editor/type of a **CodBi Functionality** parameter. `string` is the free-text default used
 * whenever no type is declared; `number` and `integer` differ only in the editor's step.
 */
export type TParameterType = "string" | "integer" | "number" | "boolean" | "enum" | "csv";

/**
 * The type of ONE **subpart** (grid column) of a `csv` parameter. Mirrors {@link TParameterType }
 * minus `csv` itself (subparts cannot be nested tables).
 */
export type TCsvSubpartType = "string" | "integer" | "number" | "boolean" | "enum";

/**
 * The description of ONE **subpart** (i.e. one grid column) of a `type: "csv"` parameter. Each
 * column of the grid corresponds to one positional field of every CSV element (row). Optional
 * subparts (those without a `required` flag, or with `required: false`) may be left empty.
 */
export interface ICsvSubpartSpec {
  /** The subpart's **name** - used as the fallback column header and to reference the field. */
  name?: string;
  /** The subpart's editor TYPE (one of the simple {@link TCsvSubpartType }s). */
  type?: TCsvSubpartType;
  /** For `type: "enum"`: the allowed, fixed set of values (in display order). */
  options?: ReadonlyArray<string>;
  /** The human-readable **column name** (grid header). Falls back to {@link ICsvSubpartSpec.name }. */
  label?: string;
  /** The default value for this subpart (expressed as a string). */
  default?: string;
  /** Whether the subpart is mandatory. `false`/absent marks it as **optional**. */
  required?: boolean;
}

/** The canonical description of ONE functionality parameter. */
export interface IParameterSpec {
  /** The parameter's type. Absent/unknown means `"string"` (the free-text default). */
  type?: TParameterType;
  /** For `type: "enum"`: the allowed, fixed set of values (in display order). */
  options?: ReadonlyArray<string>;
  /**
   * For `type: "csv"`: the ordered definition of the grid **columns / subparts**. Every element
   * (row) of the CSV is serialized as the subpart values joined with {@link IParameterSpec.fieldSeparator },
   * and the elements are joined with {@link IParameterSpec.itemSeparator }.
   */
  columns?: ReadonlyArray<ICsvSubpartSpec>;
  /** For `type: "csv"`: the singular display name of ONE element/row (e.g. `"column"`). */
  itemName?: string;
  /** For `type: "csv"`: the separator between the elements (rows). Defaults to `,`. */
  itemSeparator?: string;
  /** For `type: "csv"`: the separator between the subparts (fields) of one element. Defaults to `;`. */
  fieldSeparator?: string;
  /** The default value (always expressed as a string, exactly as the runtime receives it). */
  default?: string;
  /** A short, human-readable description of the parameter. */
  description?: string;
}

/**
 * The spec accepted by {@link ParameterTypes }: a map of parameter name → either the full
 * {@link IParameterSpec} object or just the {@link TParameterType} shorthand (e.g. `"boolean"`).
 */
export type TParameterTypesSpec = { readonly [name: string]: IParameterSpec | TParameterType };

/** The normalized metadata contributed by {@link ParameterTypes }. */
export interface IParameterMeta {
  /** The per-parameter specs, keyed by the parameter's bare name (no `data-cb-` prefix). */
  parameters: { [name: string]: IParameterSpec };
  /** The tier that produced this metadata (`decorator`/`generator`/`manager`/`runtime`). */
  source?: string;
}

/**
 * Global symbol under which {@link ParameterTypes } stores the spec ON the decorated function. A
 * `Symbol.for` key (rather than a module-local `WeakMap`) so the metadata stays visible across
 * separately bundled modules: a functionality loaded on its own still declares its parameter types
 * to the runtime resolver, which reads the very same symbol.
 */
const PARAM_SPEC_KEY = Symbol.for("codbi.functionality.parameterTypes");

/** Every valid {@link TParameterType }, used to validate/normalize incoming specs. */
const VALID_PARAMETER_TYPES: ReadonlyArray<TParameterType> = ["string", "integer", "number", "boolean", "enum", "csv"];

/** Every valid {@link TCsvSubpartType }, used to validate/normalize csv subpart specs. */
const VALID_CSV_SUBPART_TYPES: ReadonlyArray<TCsvSubpartType> = ["string", "integer", "number", "boolean", "enum"];

/** Normalizes a single `csv` subpart spec into its canonical {@link ICsvSubpartSpec }. */
function normalizeCsvSubpart(input: ICsvSubpartSpec | undefined): ICsvSubpartSpec {
  if (input == null || typeof input !== "object") {
    return {};
  }
  const sub: ICsvSubpartSpec = {};

  if (input.name !== undefined) {
    sub.name = String(input.name);
  }
  const type =
    input.type != null && VALID_CSV_SUBPART_TYPES.includes(input.type as TCsvSubpartType)
      ? (input.type as TCsvSubpartType)
      : undefined;

  if (type !== undefined) {
    sub.type = type;
    if (type === "enum") {
      const options = Array.from(
        new Set((input.options ?? []).map((option) => String(option).trim()).filter((option) => option.length > 0)),
      );
      sub.options = options;
    }
  }
  if (input.label !== undefined) {
    sub.label = String(input.label);
  }
  if (input.default !== undefined) {
    sub.default = String(input.default);
  }
  if (input.required !== undefined) {
    sub.required = Boolean(input.required);
  }

  return sub;
}

/**
 * Method decorator for a functionality's `functionality()` method. Declares the TYPE of each
 * parameter the functionality accepts so the designer can render a type-appropriate editor:
 *
 * ```ts
 * @ParameterTypes({
 *   Reverse: "boolean",
 *   Minimum: "integer",
 *   Unit: { type: "enum", options: ["d", "w", "m", "y"], default: "y" },
 *   MsgHigher: "string",
 * })
 * public static functionality(toLoad, toProcess) { … }
 * ```
 *
 * A parameter that is absent from the spec (or whose type is unknown) is treated as `"string"`
 * (fail-open), so existing functionalities keep working unchanged.
 *
 * @param spec The per-parameter type spec. */
export function ParameterTypes(spec: TParameterTypesSpec): MethodDecorator {
  return (_target, _propertyKey, descriptor) => {
    if (typeof descriptor.value === "function") {
      (descriptor.value as unknown as Record<symbol, TParameterTypesSpec>)[PARAM_SPEC_KEY] = spec;
    }
  };
}

/** @returns the spec declared via {@link ParameterTypes } for the given function, or undefined. */
export function parameterTypesOf(target: unknown): TParameterTypesSpec | undefined {
  return typeof target === "function"
    ? (target as unknown as Record<symbol, TParameterTypesSpec | undefined>)[PARAM_SPEC_KEY]
    : undefined;
}

/** Normalizes a single spec (object or type shorthand) into the canonical {@link IParameterSpec }. */
export function normalizeParameterSpec(input: IParameterSpec | TParameterType | undefined): IParameterSpec {
  if (input == null) {
    return { type: "string" };
  }
  if (typeof input === "string") {
    return normalizeParameterSpec({ type: input });
  }

  const type =
    input.type != null && VALID_PARAMETER_TYPES.includes(input.type as TParameterType)
      ? (input.type as TParameterType)
      : "string";
  const spec: IParameterSpec = { type };

  if (type === "enum") {
    const options = Array.from(
      new Set((input.options ?? []).map((option) => String(option).trim()).filter((option) => option.length > 0)),
    );
    spec.options = options;
  }
  if (type === "csv") {
    const columns = Array.isArray(input.columns)
      ? input.columns.map((column) => normalizeCsvSubpart(column)).filter((column) => Object.keys(column).length > 0)
      : undefined;
    if (columns && columns.length > 0) {
      spec.columns = columns;
    }
    if (input.itemName !== undefined) {
      spec.itemName = String(input.itemName);
    }
    if (input.itemSeparator !== undefined) {
      spec.itemSeparator = String(input.itemSeparator);
    }
    if (input.fieldSeparator !== undefined) {
      spec.fieldSeparator = String(input.fieldSeparator);
    }
  }
  if (input.default !== undefined) {
    spec.default = String(input.default);
  }
  if (input.description) {
    spec.description = String(input.description);
  }

  return spec;
}

/** Normalizes a whole {@link TParameterTypesSpec } into the canonical {@link IParameterMeta }. */
export function normalizeParameterTypes(spec: TParameterTypesSpec | undefined): IParameterMeta {
  const parameters: { [name: string]: IParameterSpec } = {};

  if (spec != null && typeof spec === "object") {
    for (const [name, value] of Object.entries(spec)) {
      const key = String(name).trim();

      if (key.length === 0) {
        continue;
      }
      parameters[key] = normalizeParameterSpec(value);
    }
  }

  return { parameters };
}
