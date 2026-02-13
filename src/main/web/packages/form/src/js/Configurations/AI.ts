/**
 * Registers standard configurations providing targets that're used with
 * CodBi's **DJL PyTorch** implementations.
 *
 * #### CSS-Classes
 *  - **AI_PT_DONUT_QA_Question**
 *    Used to tag {@link HTMLInputElement }s that shall receive the responses to
 *    questions asked.
 *    Those elements are will get the response to the question that is specified in the
 *    **data-cb-Question** attribute.
 *    Those responses will get transformed by the
 *    **HTML.Input.Trans.RegEx** functionality.
 *    The default values for the Extractor is ".*" and the Replacements is set to "$&".
 *  - **AI_TESSERACT_Name**
 *    Used to tag {@link HTMLInputElement }s that shall receive the text that the
 *    **Tesseract** AI extracted from an image. Those elements are identified by their
 *    **data-cb-Name** attribute which has to match the one specified in the
 *    **data-cb-Pattern_...**-Attribute of the element the **AI.OCR** functionality is
 *    being applied on.
 *    Those texts will get transformed by the **HTML.Input.Trans.RegEx** functionality.
 *    The default values for the Extractor is ".*" and the Replacements is set to "$&". */
export function loadConfig(): void {
  window.codbi.loadConfigs([
    {
      targets: ".AI_PT_DONUT_QA_Question",
      FUNC: "HTML.Input.Trans.RegEx",
      Extractor: ".*",
      Replacements: "$&",
    },
    {
      targets: ".CodBi_AI_OCR_Receiver",
      FUNC: "HTML.Input.Trans.RegEx",
      Extractor: ".*",
      Replacements: "$&",
    },
  ]);
}

loadConfig();
