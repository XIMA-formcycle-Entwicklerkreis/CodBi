function e() {
  window.codbi.loadConfigs([
    { targets: ".AI_PT_DONUT_QA_Question", FUNC: "HTML.Input.Trans.RegEx", Extractor: ".*", Replacements: "$&" },
    { targets: ".CodBi_AI_OCR_Receiver", FUNC: "HTML.Input.Trans.RegEx", Extractor: ".*", Replacements: "$&" },
  ]);
}
e();
export { e as loadConfig };
