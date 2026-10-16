/**
 * Cache-busting helper for the **Angular manager bundle** (`cb-manager.js` / `cb-manager.css`).
 *
 * The designer's OWN resources are served with a build token appended by the plugin framework
 * (`designer.js?v=<build>` — see `CodbiFormDesignerResourcePlugin`, which uses a per-build timestamp
 * for development builds and the release version for stable ones), so a rebuild is always picked up
 * by the browser. The manager bundle, however, is injected BY HAND (see
 * {@link enableAICodBiAssistantDialog} and the local API-Doc interface) via its plain
 * `plugin?name=Resource&Path=…/cb-manager.js` URL, which therefore carries no version — the browser
 * keeps serving its CACHED copy, so a rebuilt manager bundle (and with it every manager fix) never
 * reaches the running designer until the user hard-reloads / clears the cache.
 *
 * This helper returns the `&v=…` suffix to append to those URLs, using the SAME token the framework
 * uses for the designer resources. The token is injected by the designer resource plugin as
 * `window.CodbiPluginData.buildVersion`; when it is absent (an older plugin) the suffix is empty and
 * the URLs stay as they are.
 *
 * Because the token is stable for the lifetime of one page, it can also be used verbatim in the
 * "already injected?" guards of both call sites (they must produce the identical URL string for the
 * guard to match and the bundle to be loaded only ONCE — loading it twice would re-run `main.ts` and
 * throw "the name cb-manager has already been used").
 */

/** @returns the `&v=<plugin build>` suffix for the manager bundle URLs (empty when unknown). */
export function codbiManagerCacheSuffix(): string {
  const version = String(
    (window as unknown as { CodbiPluginData?: { buildVersion?: string } }).CodbiPluginData?.buildVersion ?? "",
  ).trim();

  return version === "" ? "" : `&v=${encodeURIComponent(version)}`;
}
