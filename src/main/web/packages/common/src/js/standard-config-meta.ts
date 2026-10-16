// Common matching logic for **CodBi standard configurations**, mirroring the functionality meta
// channel (`functionality-meta.ts`). A standard configuration's `supportedFormelementtypes` property
// (published by `scripts/generate-supported-formelementtypes-for-configurations.mjs`) lists the
// FORMCYCLE widget class names the configuration can be applied to. This module resolves that spec
// into the same requirements model used by functionalities and decides whether a given form element
// is a valid target.

import {
  formElementMatchesRequirements,
  normalizeSupportedFormelementtype,
  type IFormElementRequirement,
  type TSupportedFormelementtypeSpec,
} from "./functionality-meta.js";

/** The minimal view of a form element used for applicability matching (see `IApplicabilityElement`). */
export interface IStandardElementView {
  className?: string | null;
  properties?: Record<string, unknown>;
}

/** The literal keyword that marks a standard configuration as holistic (see `standardConfigIsHolistic`). */
export const HOLISTIC_STANDARD_KEYWORD = "Holistic";

/**
 * The `supportedFormelementtypes` carried by a standard-configuration descriptor (`detStandards`).
 *
 * Only the **holistic** marker remains on regular files: a holistic config publishes the literal
 * `["Holistic"]` (case-insensitive) so the designer can hide it from the per-element listings. A
 * regular (non-holistic) config publishes **no** top-level value — each CSS-Class's FORMCYCLE
 * widget list lives inside that class's entry of the config's own `classes` map (see
 * `TStandardConfigClassSpec`).
 *
 * A bare `string` / `string[]` (no array of `"Holistic"`) is the legacy/synthetic file-level form
 * (e.g. the local API-doc / manager channel publishing a comma-joined string or a single array).
 */
export type TStandardConfigSupportedSpec =
  | readonly string[]
  | string
  | Readonly<Record<string, readonly string[] | string | undefined>>
  | undefined;

/**
 * The per-class entry of a standard-configuration's `classes` map. Under the optimised shape the
 * class's human-readable description and its FORMCYCLE widget list are stored together, so the
 * class name appears as a key exactly once (no separate per-class `supportedFormelementtypes`
 * map). `formelementtypes` absent/empty ⇒ that class applies to **any** element (fail-open).
 *
 * The plain-`string` form is the legacy/manager shape (a description only) — treated as fail-open.
 */
export type TStandardConfigClassSpec =
  | string
  | Readonly<{
      description?: string;
      formelementtypes?: readonly string[];
    }>;

/**
 * Whether a standard configuration is a **holistic** one. A holistic configuration resolves its
 * targets by a runtime selector (`targets` + a single `func`) rather than by a CSS-standard class,
 * so it is published with `supportedFormelementtypes: ["Holistic"]` (case-insensitive) and must NOT
 * be offered in the per-element standard-configuration listings of the CodBi panel.
 *
 * A **per-class MAP** is never holistic — only an ARRAY (or bare string) containing the `"Holistic"`
 * keyword is.
 *
 * @param spec The configuration's `supportedFormelementtypes` spec (`undefined` ⇒ not holistic).
 */
export function standardConfigIsHolistic(spec: TStandardConfigSupportedSpec): boolean {
  if (spec == null || (typeof spec === "object" && !Array.isArray(spec))) {
    // `undefined`, or a per-class MAP ⇒ never holistic.
    return false;
  }
  const list = Array.isArray(spec) ? spec : [spec];
  return list.some(
    (entry) =>
      String(entry ?? "")
        .trim()
        .toLowerCase() === HOLISTIC_STANDARD_KEYWORD.toLowerCase(),
  );
}

/**
 * Extracts the FORMCYCLE widget-class list that a single CSS-Class of a standard configuration
 * applies to, by reading the class's OWN entry of the config's `classes` map (the optimised shape
 * where description + widget list are stored together — regular non-holistic config `.json` files).
 * A legacy/manager entry that is a plain description `string` (or an entry without
 * `formelementtypes`) contributes no types → that class is fail-open (applies to any element).
 *
 * @param classes  The configuration's `classes` map (`classes[cssClass]` is a `TStandardConfigClassSpec`).
 * @param cssClass The CSS-Class (a `classes`/`funcs` key) to look up.
 */
export function standardConfigClassTypes(
  classes: Readonly<Record<string, TStandardConfigClassSpec>> | undefined,
  cssClass: string,
): readonly string[] | undefined {
  const entry = classes?.[cssClass];
  if (entry == null || typeof entry === "string") {
    return undefined;
  }
  const types = entry.formelementtypes;
  if (types == null || types.length === 0) {
    return undefined;
  }
  return types;
}

/** @returns the rich requirements (widget classes + optional property constraints) of a standard config. */
export function standardConfigRequirements(spec: TSupportedFormelementtypeSpec | undefined): IFormElementRequirement[] {
  return normalizeSupportedFormelementtype(spec).requirements;
}

/**
 * Whether a standard configuration may be applied to the given form element. A configuration that
 * declares no `supportedFormelementtypes` applies to **any** element (fail-open), consistent with a
 * functionality without the `@SupportedFormelementtype` decorator.
 *
 * @param spec     The configuration's `supportedFormelementtypes` spec (or `undefined` for "any").
 * @param element  The element (`className` + property bag); a bare widget class name is accepted too.
 *
 * @returns **true** when the configuration may be applied to the element. */
export function standardConfigAppliesTo(
  spec: TSupportedFormelementtypeSpec | undefined,
  element: IStandardElementView | string | undefined,
): boolean {
  const requirements = standardConfigRequirements(spec);

  if (requirements.length === 0) {
    return true;
  }

  const className = typeof element === "string" ? element : (element?.className ?? undefined);
  const properties = typeof element === "string" ? undefined : element?.properties;

  return formElementMatchesRequirements(requirements, className ?? undefined, properties);
}
