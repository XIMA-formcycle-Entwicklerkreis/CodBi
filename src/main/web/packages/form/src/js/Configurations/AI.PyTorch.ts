/**
 * Registers standard configurations providing targets that're used with
 * CodBi's **DJL PyTorch** implementations.
 *
 * #### CSS-Classes
 *  - **AI_PT_DONUT_QA_Question**
 *    Used to tag {@link HTMLInputElement }s that shall receive the responses to
 *    questions asked. Those responses will get transformed by the
 *    **HTML.Input.Trans.RegEx** functionality.
 *    The default values for the Extractor is ".*" and the Replacements is set to "$&". */
export function loadConfig(): void {
  window.codbi.loadConfig({
    targets: ".AI_PT_DONUT_QA_Question",
    FUNC: "HTML.Input.Trans.RegEx",
    Extractor: ".*",
    Replacements: "$&",
  });
}

loadConfig();
