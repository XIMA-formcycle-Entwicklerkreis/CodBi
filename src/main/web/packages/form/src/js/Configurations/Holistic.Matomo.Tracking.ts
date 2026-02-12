/**
 * Registers a standard configurations using the functionality
 * **Matomo.Tracking** that automatically initiates tracking according to either
 * the Plugin-Matomo-Config or the one provided via global variables whereas
 * the global one takes precedence.
 *
 * Global Variables:
 * - **Matomo_SiteID** The functionalitie's **SiteID**-Parameter.
 * - **URL** The functionalitie's **URL**-Parameter. */
export function loadConfig(): void {
  window.codbi.loadConfig({
    targets: "body",
    FUNC: "Matomo.Tracking",
    SiteID: "{ V > Matomo_SiteID }",
    URL: "{ V > Matomo_URL }",
  });
}

loadConfig();
