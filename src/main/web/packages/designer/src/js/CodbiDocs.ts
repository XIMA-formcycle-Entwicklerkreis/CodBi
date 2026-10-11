// #region Imports
import { getLanguage } from "@de-xima/fc-form-designer";
import { Constants } from "codbi-common";
// #endregion Imports

/**
 * CodBi documentation URL for the designer's help icons.
 *
 * The plugin exposes a per-language documentation root through the `Docs_Frontend_<lang>` plugin
 * properties, published as `window.CodbiPluginData.docsAPI` (see `CodbiFormDesignerResourcePlugin`).
 * Administrators use those properties to REDIRECT the documentation of a specific language to
 * another URL. The help icons honour that redirect first — exactly like the Local API-doc viewer
 * (`docsApi[currentLanguage] ?? docsApi.en`). When no per-language URL is available they fall back
 * to the configured `docs.base_url` plus the matching language section (English is the root).
 */

/** Languages for which the published docs ship a translated section. */
const DOCS_LANGUAGES = new Set(["de", "it"]);

/** @returns the two-letter language the designer currently uses (defaulting to `en`). */
function currentLanguage(): string {
  try {
    const language = String(getLanguage() ?? "")
      .toLowerCase()
      .slice(0, 2);
    return language || "en";
  } catch {
    return "en";
  }
}

/** @returns the plugin-published, per-language documentation roots (`docsAPI`), if any. */
function docsApiUrls(): Record<string, string> {
  try {
    const data = (window as unknown as { CodbiPluginData?: { docsAPI?: Record<string, string> } }).CodbiPluginData;
    return data?.docsAPI ?? {};
  } catch {
    return {};
  }
}

/**
 * @returns the documentation URL for the designer help icons: the administrator-redirected,
 * language-specific `docsAPI` URL when present, otherwise the configured `docs.base_url`'s matching
 * language section.
 */
export function codbiDocsUrl(): string {
  const language = currentLanguage();

  // 1) Administrator redirects (plugin properties `Docs_Frontend_<lang>` -> `docsAPI`).
  const docsApi = docsApiUrls();
  const redirected = docsApi[language] || docsApi.en;
  if (redirected) {
    return redirected;
  }

  // 2) Fallback: the configured base URL's language section of the `form` module (English = root).
  const base = String(Constants["docs.base_url"] ?? "");
  const normalized = base.endsWith("/") ? base : `${base}/`;
  const segment = DOCS_LANGUAGES.has(language) ? `${language}/` : "";
  return `${normalized}form/${segment}`;
}
