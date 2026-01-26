function e() {
  window.codbi.loadConfig({
    targets: '[data-vdt="time"]:not(.CodBi_XCL):not(.CodBi_XCL_Cleave_Time)',
    FUNC: "HTML.Input.Cleave",
    config: `^${JSON.stringify({ time: !0, timePattern: ["h", "m"] })
      .replace("{", "<")
      .replace("}", ">")}`,
  });
}
e();
export { e as loadConfig };
