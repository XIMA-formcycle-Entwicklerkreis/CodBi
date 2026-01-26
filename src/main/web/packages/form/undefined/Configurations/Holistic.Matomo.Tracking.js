function o() {
  window.codbi.loadConfig({
    targets: "body",
    FUNC: "Matomo.Tracking",
    SiteID: window.codbiSettings.Matomo.SiteID || "{ V > Matomo_SiteID }",
    URL: window.codbiSettings.Matomo.URL || "{ V > Matomo_URL }",
  });
}
o();
export { o as loadConfig };
