function t() {
  window.codbi.loadConfigs([
    { targets: ".AI_PT_DONUT_QA_Question", FUNC: "HTML.Input.Trans.RegEx", Extractor: ".*", Replacements: "$&" },
    { targets: ".AI_TESSERACT_Name", FUNC: "HTML.Input.Trans.RegEx", Extractor: ".*", Replacements: "$&" },
  ]);
}
t();
export { t as loadConfig };
