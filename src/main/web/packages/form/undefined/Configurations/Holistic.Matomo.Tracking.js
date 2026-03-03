function o() {
  window.codbi.loadConfig({
    targets: "body",
    FUNC: "Matomo.Tracking",
    SiteID: "{ V > Matomo_SiteID }",
    URL: "{ V > Matomo_URL }",
  });
}
o();
export { o as loadConfig };
