function e() {
  window.codbi.loadConfig({
    targets: '[data-vdt="plzDE"]:not(.CodBi_XCL):not(.CodBi_XCL_Cleave_PLZ)',
    FUNC: "HTML.Input.Cleave",
    config: `^${JSON.stringify({ numeral: !0, numeralIntegerScale: 5, delimiter: "" }).replace("{", "<").replace("}", ">")}`,
  });
}
e();
export { e as loadConfig };
