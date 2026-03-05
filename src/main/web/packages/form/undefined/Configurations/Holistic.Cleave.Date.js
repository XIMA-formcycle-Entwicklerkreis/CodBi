function o() {
  window.codbi.loadConfig({
    targets: '[data-datepicker="1"]:not(.CodBi_XCL):not(.CodBi_XCL_Cleave_Date)',
    FUNC: "HTML.Input.Cleave",
  });
}
o();
export { o as loadConfig };
