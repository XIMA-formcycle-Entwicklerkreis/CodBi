/**
 * Registers a standard configuration that applies Speech-to-Text onto every
 * {@link HTMLInputElement } with `type="text"` and every `<textarea>`.
 *
 * General excluding CSS-Class available (**CodBi_XCL**).
 * Exclusive excluding CSS-Class available (**CodBi_XCL_Speech**) */
export function loadConfig(): void {
  window.codbi.loadConfig({
    targets:
      'input[type="text"]:not(.CodBi_XCL):not(.CodBi_XCL_Speech):not(.AI_LLAMA_CHAT_Input):not([data-cb-func]), textarea:not(.CodBi_XCL):not(.CodBi_XCL_Speech):not(.AI_LLAMA_CHAT_Input):not([data-cb-func])',
    FUNC: "MEDIA.INPUT.SPEECH",
    config: "",
  });
}

loadConfig();
