/**
 * Registers standard configurations providing targets that're used with
 * CodBi's **LLAMA**,**Tesseract** & **Whisper** implementations.
 *
 * #### CSS-Classes
 *
 * | Functionality | CSS Class | Description |
 * | :--- | :--- | :--- |
 * | [AI.LLAMA.CHAT](../classes/Functionalities_ai.llama.chat.AI_LLAMA_CHAT.html) | **AI_LLAMA_CHAT_Input** | Identifies the `<input type="text">` or `<textarea>` where the user types their messages. |
 * | [AI.LLAMA.CHAT](../classes/Functionalities_ai.llama.chat.AI_LLAMA_CHAT.html) | **AI_LLAMA_CHAT_Send** | Identifies the `<button>` used to send the typed message. |
 * | [AI.LLAMA.CHAT](../classes/Functionalities_ai.llama.chat.AI_LLAMA_CHAT.html) | **AI_LLAMA_CHAT_Stop** | Identifies the `<button>` used to abort a running inference. |
 * | [AI.LLAMA.CHAT](../classes/Functionalities_ai.llama.chat.AI_LLAMA_CHAT.html) | **AI_LLAMA_CHAT_Upload** | Identifies the `<input type="file">` for uploading documents/images to the chat. |
 * | [AI.LLAMA.CHAT](../classes/Functionalities_ai.llama.chat.AI_LLAMA_CHAT.html) | **AI_LLAMA_CHAT_Thinking** | Identifies the `<input type="checkbox">` to toggle thinking mode (chain-of-thought) on/off. |
 * | [AI.LLAMA.CHAT](../classes/Functionalities_ai.llama.chat.AI_LLAMA_CHAT.html) | **AI_LLAMA_CHAT_Internet** | Identifies the `<input type="checkbox">` to toggle internet search availability. |
 * | [AI.LLAMA.CHAT](../classes/Functionalities_ai.llama.chat.AI_LLAMA_CHAT.html) | **AI_LLAMA_CHAT_Location** | Identifies the `<input type="checkbox">` to toggle geolocation. |
 * | [AI.LLAMA.CHAT](../classes/Functionalities_ai.llama.chat.AI_LLAMA_CHAT.html) | **AI_LLAMA_CHAT_MailForward** | Identifies the `<input type="checkbox">` to toggle auto-forwarding of AI responses via email. |
 * | [AI.LLAMA.CHAT](../classes/Functionalities_ai.llama.chat.AI_LLAMA_CHAT.html) | **AI_LLAMA_CHAT_MailAddress** | Identifies the input where the target email address is specified. |
 * | [AI.LLAMA.CHAT](../classes/Functionalities_ai.llama.chat.AI_LLAMA_CHAT.html) | **AI_LLAMA_CHAT_AlertOnFinish** | Identifies the `<input type="checkbox">` to toggle browser alerts when inference finishes. |
 * | [AI.LLAMA.STANDARD.QA](../classes/Functionalities_ai.llama.standard.qa.AI_LLAMA_STANDARD_QA.html) & [TXTQA](../classes/Functionalities_ai.llama.standard.txtqa.AI_LLAMA_STANDARD_TXTQA.html) | **AI_LLAMA_QA_Exclude** | Tags nested XContainer elements to exclude their contents from question search. |
 * | [AI.LLAMA.STANDARD.QA](../classes/Functionalities_ai.llama.standard.qa.AI_LLAMA_STANDARD_QA.html) | **AI_LLAMA_STANDARD_QA_Question** | Tags {@link HTMLInputElement}s that receive responses to questions specified in the **data-cb-Question** attribute. Responses transformed by **HTML.Input.Trans.RegEx**. |
 * | [AI.LLAMA.STANDARD.TXTQA](../classes/Functionalities_ai.llama.standard.txtqa.AI_LLAMA_STANDARD_TXTQA.html) | **AI_LLAMA_STANDARD_TXTQA_Question** | Identifies elements designed to receive the AI's response to questions based on source fields. |
 * | [AI.LLAMA.STANDARD.TXTQA](../classes/Functionalities_ai.llama.standard.txtqa.AI_LLAMA_STANDARD_TXTQA.html) | **AI_LLAMA_TXTQA_Source** | Identifies elements whose values are to be supplied as source context to the AI. |
 * | [AI.OCR](../classes/Functionalities_ai.ocr.AI_OCR.html) | **AI_OCR_Receiver** | Tags {@link HTMLInputElement}s that receive text extracted from an image by Tesseract. Matched via **data-cb-Name**. Transformed by **HTML.Input.Trans.RegEx**. |
 */
export function loadConfig(): void {
  window.codbi.loadConfigs([
    {
      targets: ".AI_LLAMA_STANDARD_QA_Question",
      FUNC: "HTML.Input.Trans.RegEx",
      Extractor: ".*",
      Replacements: "$&",
    },
    {
      targets: ".AI_OCR_Receiver",
      FUNC: "HTML.Input.Trans.RegEx",
      Extractor: ".*",
      Replacements: "$&",
    },
  ]);
}

loadConfig();
