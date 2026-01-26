function o() {
  window.codbi.loadConfig({
    targets: '[data-vdt="phone"]:not(.CodBi_XCL):not(.CodBi_XCL_Cleave_Phone)',
    FUNC: "HTML.Input.Cleave",
    config: `^${JSON.stringify({ phone: !0, phoneRegionCode: "DE" }).replace("{", "<").replace("}", ">")}`,
  });
}
o();
export { o as loadConfig };
