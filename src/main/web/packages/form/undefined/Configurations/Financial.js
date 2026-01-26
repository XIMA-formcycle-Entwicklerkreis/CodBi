function e() {
  window.codbi.loadConfig({
    targets: ".CodBi_Currency",
    FUNC: "HTML.Input.Cleave",
    config: `^${JSON.stringify({ numeral: !0, numeralThousandsGroupStyle: "thousand", numeralDecimalMark: ",", delimiter: "" }).replace("{", "<").replace("}", ">")}`,
  });
}
e();
export { e as loadConfig };
