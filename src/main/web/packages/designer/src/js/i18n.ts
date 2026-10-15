import { getLanguage } from "@de-xima/fc-form-designer";

import { type TMessageKey, pluginMessage } from "codbi-common";

/**
 * Finds the localized message for the given key. Uses the current locale of
 * the form designer.
 * @param key The key of the message to find.
 * @returns The localized message, a default such as `?key?` if no localization
 * is found.
 */
export function i18n(key: TMessageKey): string {
  return pluginMessage(getLanguage(), key);
}

/**
 * Returns the language code currently active in the form designer (e.g. `"de"`, `"en"`).
 *
 * @returns The current designer language code. */
export function getDesignerLanguage(): string {
  return String(getLanguage());
}

/**
 * The minimal shape of a functionality parameter's multilingual description (the structured
 * `parameters[*]` channel). Kept structural so no model type needs to be imported here.
 */
export interface ILocalizedParameterSpec {
  /** The base/English description. */
  description?: string;
  /** The description in German (`de`). */
  descriptionDe?: string;
  /** The description in Italian (`it`). */
  descriptionIt?: string;
}

/**
 * Resolves the description of one functionality parameter for the currently active designer language,
 * falling back to the base/English `description` when no localized variant exists. Use this wherever a
 * parameter description is shown to the user (config panel tooltip, functionality badge tooltip).
 *
 * @param spec The parameter's structured spec (may be `undefined`).
 * @returns The localized description, or an empty string when the spec has no description at all. */
export function localizedParameterDescription(spec: ILocalizedParameterSpec | undefined): string {
  const lang = getDesignerLanguage().toLowerCase();
  if (spec) {
    const localized =
      (lang === "de" && spec.descriptionDe) ||
      (lang === "it" && spec.descriptionIt) ||
      // Anything else than German/Italian keeps the base (English) description.
      spec.description;
    return String(localized ?? "").trim();
  }
  return "";
}

/**
 * Resolves the short (one-sentence) description of a functionality for the currently active designer
 * language, falling back to the base/English string when no localized variant exists. Use this wherever
 * a functionality summary is shown to the user (e.g. the config panel's functionality group-header
 * tooltip).
 *
 * The `Summary` is either a plain string or a per-language map (e.g. `{ en, de, it }`), mirroring the
 * Element-Placeholder `Summary` shape.
 *
 * @param summary The functionality's raw `Summary` value (may be `undefined`).
 * @returns The localized summary, or an empty string when none is available. */
export function localizedFunctionalitySummary(summary: string | Record<string, string> | undefined): string {
  if (summary === undefined) {
    return "";
  }
  if (typeof summary === "string") {
    return summary.trim();
  }
  const lang = getDesignerLanguage().toLowerCase();
  // The base (English) fallback is read through a typed view: accessing `.en` directly on the index
  // signature would violate `noPropertyAccessFromIndexSignature`.
  const base = (summary as { en?: string }).en;
  // Computed access with a variable (not a literal) keeps the map lookup while satisfying the linter.
  const localized = summary[lang] ?? summary[lang.slice(0, 2)] ?? base;
  return String(localized ?? "").trim();
}
