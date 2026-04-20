//region Imports
//region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
//endregion XIMA
//region Commons
import { acquireWakeLock, releaseWakeLock } from "../commons/wake-lock";
//endregion Commons
//region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { IF } from "xdbc/src/DBC/IF";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { EQ } from "xdbc/src/DBC/EQ";
import { OR } from "xdbc/src/DBC/OR";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
//endregion XDBC
//region PDF.js
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { CodBiError, generateUUID } from "../global-scope";
//endregion PDF.js
//region Commons
import { convertToWav, preferredMimeType } from "../commons/whisper-utils";
import { formatWaitTime } from "../commons/format-wait-time";
//endregion Commons
//endregion Imports
/**
 * Provides the {@link AI_LLAMA_CHAT.functionality }.
 *
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_LLAMA_CHAT {
  /**
   * This functionality turns a set of HTML elements into a chat interface for the LLAMA Model served by the CodBi.
   * It enables interactive, multi-turn conversations about uploaded images and PDF documents, provides internet query access
   * to the model via the **Brave Search API** and the client's location via the Geolocation API.
   * Voice input is supported via the **Media.Input.Speech.Whisper**-Functionality.
   *
   * If the model is not specified QWEN3-VL 2B is downloaded and utilized.
   *
   * **Required Elements (found by CSS class within the nearest common ancestor):**
   *
   * | CSS Class                      | Element                                | Purpose                                          |
   * |-------------------------------|----------------------------------------|--------------------------------------------------|
   * | *The class tagged with this functionality*        | `textarea`                           | Chat display (read-only conversation history)    |
   * | `AI_LLAMA_CHAT_Input`    | `input type="text"` or `textarea` | Text input where the user types messages         |
   * | `AI_LLAMA_CHAT_Send`     | `button`                             | Send button (triggers inference)                 |
   * | `AI_LLAMA_CHAT_Stop`     | `button`                             | Stop button (aborts running inference)           |
   * | `AI_LLAMA_CHAT_Upload` (Optional)   | `input type="file"`                  | File upload for images/PDFs to chat about        |
   * | `AI_LLAMA_CHAT_Thinking` (Optional)  | `input type="checkbox"`              | Toggles thinking mode (chain-of-thought) on/off  |
   * | `AI_LLAMA_CHAT_Internet` (Optional)    | `input type="checkbox"`              | Toggles internet search availability on/off      |
   * | `AI_LLAMA_CHAT_Location` (Optional)    | `input type="checkbox"`              | Toggles geolocation (get_current_location) on/off |
   * | `AI_LLAMA_CHAT_MailForward` (Optional) | `input type="checkbox"`              | Toggles auto-forward of every AI response via email |
   * | `AI_LLAMA_CHAT_MailAddress` (Optional) | `input type="text"` or `input type="email"` | Email address for auto-forwarding (shown when checkbox is checked) |
   * | `AI_LLAMA_CHAT_AlertOnFinish` (Optional) | `input type="checkbox"`              | Toggles alert on finish of inference              |
   *
   * **Generated CSS Classes (injected at runtime):**
   *
   * | CSS Class                       | Element     | Purpose                                                        |
   * |--------------------------------|-------------|----------------------------------------------------------------|
   * | `LLAMA_Chat_Container`         | `div`     | Scrollable chat wrapper replacing the hidden `textarea`      |
   * | `LLAMA_Chat_Row`               | `div`     | Flex row holding a single bubble                               |
   * | `LLAMA_Chat_Row--user`         | `div`     | Row modifier: right-aligned (user message)                     |
   * | `LLAMA_Chat_Row--llama`        | `div`     | Row modifier: left-aligned (Llama response)                    |
   * | `LLAMA_Chat_Row--system`       | `div`     | Row modifier: centered (system/info messages)                  |
   * | `LLAMA_Chat_Bubble`            | `div`     | Base speech-bubble styling (padding, border-radius, shadow)    |
   * | `LLAMA_Chat_Bubble--user`      | `div`     | User bubble colors (background via `--user-bubble-bg`)         |
   * | `LLAMA_Chat_Bubble--llama`     | `div`     | Llama bubble colors (background via `--llama-bubble-bg`)       |
   * | `LLAMA_Chat_Bubble--system`    | `div`     | System bubble: transparent, italic, muted                      |
   * | `LLAMA_Chat_Bubble--thinking`  | `div`     | Temporary "thinking" indicator (dimmed, italic)                |
   * | `LLAMA_Chat_Bubble--error`     | `div`     | Error bubble: red-tinted background                            |
   * | `LLAMA_Chat_AiHint`           | `span`    | Small "AI-Generated" label inside an AI bubble                 |
   *
   * **Behavior:**
   * - The display textarea is made read-only and shows the full conversation history.
   * - When files are selected via the upload input, they are attached for subsequent messages.
   * - When the user clicks Send (or presses CTRL+Enter in the input), the message and any attached files are sent to the
   *   standard backend for processing by the AI model. The response is displayed in the chat.
   * - PDF files are automatically detected and processed (rendered to images or extracted).
   * - Multiple files can be attached; each is processed independently by the model.
   * - The send button and input are disabled during inference to prevent duplicate requests.
   *
   * ### Config Parameters:
   * - **MaxPages**:          Maximum PDF pages to process (**default**: 5).
   * - **Rotation**:          Image rotation in degrees (90, 180, or 270). If it is known that the image to process is rotated,
   *                          this can be set to avoid Tesseract OSD (if available) or the AI having to deal with it, speeding up
   *                          the inference. Not setting or setting to 0 means that rotation is unknown.
   * - **MaxPixelSize**:      Maximum total pixel budget (width×height). Images exceeding this are downscaled client-side while
   *                          preserving the aspect ratio.
   *                          **Default**: 3211264 (≈ 1792×1792). Set to 0 to disable client-side downscaling.
   * - **LLAMABubble**:       Background color for Llama (AI) bubbles (**default**: `#e5e5ea`).
   * - **UserBubble**:        Background color for user bubbles (**default**: `#0b93f6`).
   * - **WelcomeText**:       Text shown after the model name(s) in the ready message
   *                          (**default**: `"Chat ready. Attach file(s) and type your question."`).
   * - **VoiceHotkey**:       Keyboard shortcut to toggle voice input, e.g. `"Alt+A"` (**default**: `"Alt+A"`).
   *                          Format: modifier(s) + key separated by `+`. Recognized modifiers:
   *                          `Alt`, `Ctrl`, `Shift`, `Meta`. The key part is case-insensitive.
   * - **VoicePlaceholder**:  Placeholder text shown in the chat input when voice input is available.
   *                          **Default**: `"Alt+A = 🎙 on/off | Alt+Q = 🎙 off + send"` (reflects the configured hotkeys).
   * - **VoiceSendHotkey**:   Keyboard shortcut to stop recording and send, e.g. `"Alt+Q"` (**default**: `"Alt+Q"`).
   *                          Same modifier format as `VoiceHotkey`.
   * - **Language**:           Language code for Whisper speech-to-text (e.g. `"de"`, `"en"`).
   *                          Empty or unset means auto-detect.
   * - **WaitingText**:        Text shown while waiting for the AI server to become available
   *                          (**default**: `"Waiting for AI server\u2026"`).
   * - **LowConfidenceText**:  Warning text shown when the AI response has low confidence
   *                          (**default**: `"Low Confidence"`).
   * - **RethinkButtonText**:  Button label offering to re-answer with the thinking model
   *                          (**default**: `"Rethink"`).
   * - **UncertainText**:      Tooltip text shown when hovering over uncertain (low-confidence) tokens
   *                          (**default**: `"Low confidence"`).
   * - **ShowUncertainTokens**: Whether to visually highlight uncertain tokens in AI responses.
   *                          Set to `"false"` to disable highlighting (**default**: `"true"`).
   * - **ResponseLanguage**:  Two-letter ISO 639-1 code (e.g. `"de"`, `"fr"`). When set, the AI is
   *                          forced to respond in this language — no auto-detection is performed.
   *                          Overrides the `AI_LLAMA_STD_Language` plugin property for this instance.
   *                          The chat interface reflects this language for labels where available.
   * - **Specialist**:        Name of a specialist model registered via `AI_LLAMA_STD_SPECIALIST_XXX`
   *                          plugin property. When set, requests are routed to that specialist's
   *                          dedicated server instance (case-insensitive match).
   * - **QueueBadge**:        If set to `"true"`, shows a badge with the current queue position while
   *                          waiting for inference. Overrides the `AI_QueueBadge` plugin property
   *                          for this instance. Default: determined by plugin property.
   * - **QueueText**:         Text appended after the queue position number in the badge
   *                          (e.g. `"in queue"` → badge shows `"3 in queue"`). Default: empty.
   * - **FilterResults**:     If set to `"true"`, enables PII filtering on Brave Search queries
   *                          for this instance, overriding the global `AI_BraveSearch_FilterResults`
   *                          plugin property. Default: determined by plugin property.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE(
      "string",
      "llamabubble, userbubble, welcometext, waitingtext, lowconfidencetext, rethinkbuttontext, uncertaintext, showuncertaintokens, voicehotkey, voiceplaceholder, voicesendhotkey, language, responselanguage, specialist, queuebadge, queuetext, disablefrequencypenalty",
    )
    @TYPE.PRE("string | number", "maxpages, rotation, maxpixelsize")
    @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "maxpages, maxpixelsize")
    // #region Rotation constraint.
    @IF.PRE(new TYPE("string"), new REGEX(/^(90|180|270)$/), "rotation")
    @IF.PRE(new TYPE("string"), new REGEX(/^[a-z]{3}$/i), "language")
    @IF.PRE(new TYPE("string"), new REGEX(/^[a-z]{2}$/i), "responselanguage")
    // #endregion Rotation constraint.
    @OR.PRE([new TYPE("string"), new TYPE("boolean")], "filterresults")
    @IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "filterresults")
    @REGEX.PRE(REGEX.stdExp.colorCodeHEX, "llamabubble, userbubble")
    @REGEX.PRE(REGEX.stdExp.simpleHotkey, "voicehotkey, voicesendhotkey")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(
      HTMLTextAreaElement,
      undefined,
      "Isn't it a <textarea> (the conversation window) that is tagged by this functionality?",
    )
    toProcess: Element,
  ): void {
    // #region Config initialization
    const $ = getJQuery();
    const chatDisplay = toProcess as HTMLTextAreaElement;
    const aiHintText = toLoad.aihint != null ? String(toLoad.aihint) : "\u2728 AI-Generated";
    const responseLang = toLoad.responselanguage != null ? String(toLoad.responselanguage).trim() : "";
    const specialist = toLoad.specialist != null ? String(toLoad.specialist).trim() : "";
    const filterResults = toLoad.filterresults != null ? String(toLoad.filterresults).toLowerCase() === "true" : null;

    chatDisplay.readOnly = true;
    chatDisplay.style.display = "none";
    // #endregion Config initialization
    // #region Create speech-bubble chat container
    AI_LLAMA_CHAT.ensureChatBubbleStyles();

    const chatContainer = document.createElement("div");

    chatContainer.className = "LLAMA_Chat_Container";
    // #region Apply custom bubble colors from toLoad.
    if (toLoad.llamabubble != null) {
      chatContainer.style.setProperty("--llama-bubble-bg", String(toLoad.llamabubble));
    }
    if (toLoad.userbubble != null) {
      chatContainer.style.setProperty("--user-bubble-bg", String(toLoad.userbubble));
    }
    // #endregion Apply custom bubble colors from toLoad.
    if (toLoad.maxchatwindowheight != null) {
      chatContainer.style.maxHeight = `${String(toLoad.maxchatwindowheight)}px`;
    }

    chatDisplay.parentElement?.insertBefore(chatContainer, chatDisplay.nextSibling);
    // #endregion Create speech-bubble chat container
    // #region Discover sibling elements by walking up to the nearest common ancestor
    let container: Element | null = toProcess.parentElement;

    while (container && container !== document.body) {
      if (container.querySelector(".AI_LLAMA_CHAT_Input") && container.querySelector(".AI_LLAMA_CHAT_Send")) {
        break;
      }

      container = container.parentElement;
    }

    if (!container || container === document.body) {
      window.codbi.log(
        "ERROR",
        "Could not find a container with .AI_LLAMA_CHAT_Input and .AI_LLAMA_CHAT_Send elements. " +
          "Ensure these elements exist within a common ancestor of the chat display textarea.",
        "AI / LLAMA / CHAT",
      );

      return;
    }

    const chatInput = OR.tsCheck<HTMLInputElement | HTMLTextAreaElement>(
      DEFINED.tsCheck(container.querySelector(".AI_LLAMA_CHAT_Input")),
      [new INSTANCE(HTMLInputElement), new INSTANCE(HTMLTextAreaElement)],
      'Is there a chat input element tagged with CSS-Class "AI_LLAMA_CHAT_Input" in the same container as the conversation window?',
    );

    const sendButton = INSTANCE.tsCheck<HTMLButtonElement>(
      DEFINED.tsCheck(container.querySelector(".AI_LLAMA_CHAT_Send")),
      HTMLButtonElement,
      'Is there a send button element tagged with CSS-Class "AI_LLAMA_CHAT_Send" in the same container as the conversation window?',
    );

    const stopButton = INSTANCE.tsCheck<HTMLButtonElement>(
      container.querySelector(".AI_LLAMA_CHAT_Stop"),
      HTMLButtonElement,
      `Isn't the element tagged with ".AI_LLAMA_CHAT_Stop" a <button>?`,
    );
    // #region Check the upload element if it exists, but it's optional so it may be null.
    const fileUpload = INSTANCE.tsCheck<HTMLInputElement>(
      container.querySelector(".AI_LLAMA_CHAT_Upload"),
      HTMLInputElement,
      `Isn't the element tagged with ".AI_LLAMA_CHAT_Upload" an <input>?`,
    );

    if (fileUpload) {
      EQ.tsCheck(
        fileUpload.type,
        "file",
        `Isn't the element tagged with ".AI_LLAMA_CHAT_Upload" an <input> of type "file"?`,
      );
    }
    // #endregion Check the upload element if it exists, but it's optional so it may be null.
    // #region Check the thinking mode checkbox if it exists, but it's optional so it may be null.
    const thinkingCheckbox = INSTANCE.tsCheck<HTMLInputElement>(
      container.querySelector(".AI_LLAMA_CHAT_Thinking"),
      HTMLInputElement,
      'Isn\'t the element tagged with ".AI_LLAMA_CHAT_Thinking" an <input> (checkbox)?',
    );

    if (thinkingCheckbox) {
      EQ.tsCheck(
        thinkingCheckbox.type,
        "checkbox",
        `Isn't the element tagged with ".AI_LLAMA_CHAT_Thinking" an <input> of type "checkbox"?`,
      );
    }
    // #endregion Check the thinking mode checkbox if it exists, but it's optional so it may be null.
    // #region Check the internet access checkbox if it exists, but it's optional so it may be null.
    const searchCheckbox = INSTANCE.tsCheck<HTMLInputElement>(
      container.querySelector(".AI_LLAMA_CHAT_Internet"),
      HTMLInputElement,
    );

    if (searchCheckbox) {
      EQ.tsCheck(
        searchCheckbox.type,
        "checkbox",
        `Isn't the element tagged with ".AI_LLAMA_CHAT_Internet" an <input> of type "checkbox"?`,
      );
    }
    // #endregion Check the internet access checkbox if it exists, but it's optional so it may be null.
    // #region Check the location access checkbox if it exists, but it's optional so it may be null.
    const locationCheckbox = INSTANCE.tsCheck<HTMLInputElement>(
      container.querySelector(".AI_LLAMA_CHAT_Location"),
      HTMLInputElement,
    );

    if (locationCheckbox) {
      EQ.tsCheck(
        locationCheckbox.type,
        "checkbox",
        `Isn't the element tagged with ".AI_LLAMA_CHAT_Location" an <input> of type "checkbox"?`,
      );
    }
    // #endregion Check the location access checkbox if it exists, but it's optional so it may be null.
    // #region Check the mail-forward checkbox if it exists, but it's optional so it may be null.
    const mailForwardCheckbox = INSTANCE.tsCheck<HTMLInputElement>(
      container.querySelector(".AI_LLAMA_CHAT_MailForward"),
      HTMLInputElement,
    );

    if (mailForwardCheckbox) {
      EQ.tsCheck(
        mailForwardCheckbox.type,
        "checkbox",
        `Isn't the element tagged with ".AI_LLAMA_CHAT_MailForward" an <input> of type "checkbox"?`,
      );
    }
    // #endregion Check the mail-forward checkbox if it exists, but it's optional so it may be null.
    // #region Check the mail-address input if it exists, but it's optional so it may be null.
    const mailAddressInput = OR.tsCheck<HTMLInputElement>(
      container.querySelector(".AI_LLAMA_CHAT_MailAddress"),
      [new INSTANCE(HTMLInputElement)],
      'Is there a mail address input element tagged with CSS-Class "AI_LLAMA_CHAT_MailAddress" in the same container?',
    );

    if (mailAddressInput) {
      mailAddressInput.style.display = mailForwardCheckbox?.checked ? "" : "none";
    }

    if (mailForwardCheckbox && mailAddressInput) {
      mailForwardCheckbox.addEventListener("change", () => {
        mailAddressInput.style.display = mailForwardCheckbox.checked ? "" : "none";
      });
    }
    // #region Check the alert-on-finish checkbox if it exists, but it's optional so it may be null.
    const alertOnFinishCheckbox = INSTANCE.tsCheck<HTMLInputElement>(
      container.querySelector(".AI_LLAMA_CHAT_AlertOnFinish"),
      HTMLInputElement,
    );
    // #endregion Check the alert-on-finish checkbox if it exists, but it's optional so it may be null.

    // #region Alert-on-finish customizable text
    const alertOnFinishText =
      typeof toLoad.alertonfinishtext === "string" && toLoad.alertonfinishtext.trim()
        ? toLoad.alertonfinishtext.trim()
        : "Inference has finished.";
    // #endregion Alert-on-finish customizable text

    // #region Alert-on-finish: request notification permission when checkbox is clicked
    if (alertOnFinishCheckbox) {
      alertOnFinishCheckbox.addEventListener("change", () => {
        if (alertOnFinishCheckbox.checked && "Notification" in window) {
          if (Notification.permission === "default") {
            Notification.requestPermission();
          }
        }
      });
    }
    // #endregion Alert-on-finish: request notification permission when checkbox is clicked
    // #endregion Check the mail-address input if it exists, but it's optional so it may be null.
    // #endregion Discover sibling elements
    let micButton: HTMLButtonElement | null = null; // Microphone button (speech-to-text via Whisper on CodBi server).
    let isRecording = false;
    let isTranscribing = false;
    let whisperMediaRecorder: MediaRecorder | null = null;
    let whisperAudioChunks: Blob[] = [];
    let whisperConvertSupported = true;
    let stopRecordingFn: (() => void) | null = null; // Stops the current recording (no-op when no mic is set up).
    let whisperUrl: string | null = null; // Resolve the Whisper plugin servlet URL

    try {
      whisperUrl = `${window.codbi.baseURL}plugin?name=CodBi_AI_Whisper`;
    } catch (_e) {}
    /**
     * Sets up the Whisper mic button. Called asynchronously after the health-check confirms the Whisper server is ready.
     * If the health-check fails the mic is never created and speech input is simply unavailable.
     *
     * @param pluginUrl The URL to send audio data to for transcription. */
    const setupWhisperMic = (pluginUrl: string): void => {
      const inputWrapper = document.createElement("div");

      inputWrapper.className = "LLAMA_Chat_InputWrapper";

      DEFINED.tsCheck<HTMLElement>(chatInput.parentElement).insertBefore(inputWrapper, chatInput);

      inputWrapper.appendChild(chatInput);

      micButton = document.createElement("button");
      micButton.type = "button";
      micButton.className = "LLAMA_Chat_MicButton";
      micButton.title = "Voice input (Whisper)";
      micButton.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm-1-9a1 1 0 1 1 2 0v6a1 1 0 1 1-2 0V5zm6 6a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2z"/></svg>`;

      inputWrapper.appendChild(micButton);

      const mic = micButton;
      // Disable mic if the LLAMA model hasn't loaded yet
      if (chatInput.disabled) {
        mic.disabled = true;
      }

      const lang = toLoad.language != null ? String(toLoad.language).trim() : ""; // Language for Whisper (auto-detect when empty)
      // #region Send audio to Whisper for transcription.
      let interimInterval: number | null = null;
      let interimInFlight = false;
      let preRecordingText = ""; // Text before recording started — interim results replace everything after this.
      /**
       * Sends accumulated audio for an interim (mid-recording) transcription.
       * The result replaces the text after preRecordingText.
       * Only one interim request runs at a time.
       *
       * @params audioBlob The audio data to send for transcription. */
      const sendInterimTranscription = async (audioBlob: Blob) => {
        if (interimInFlight) {
          return;
        }

        interimInFlight = true;

        try {
          let blob = audioBlob;

          if (!whisperConvertSupported) {
            try {
              blob = await convertToWav(blob);
            } catch (X) {
              interimInFlight = false;

              return;
            }
          }
          // #region Convert audio Blob to data URL for transmission.
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject(new CodBiError("[AI / LLAMA / CHAT ] Failed to read audio blob"));

            reader.readAsDataURL(blob);
          });
          // #endregion Convert audio Blob to data URL for transmission.
          const formData = new FormData();

          formData.append("codbi-base64:audio", dataUrl);

          const ajaxHeaders: Record<string, string> = {};

          if (lang) {
            ajaxHeaders["X-Language"] = lang;
          }
          // #region Send AJAX request to Whisper plugin for transcription.
          $.ajax({
            url: pluginUrl,
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            cache: false,
            headers: ajaxHeaders,
            success: (response: unknown) => {
              if (!isRecording) {
                return;
              } // Ignore results arriving after recording stopped (e.g. from interim requests triggered right before stopping)
              // #region Parse response.
              const result = (typeof response === "string" ? JSON.parse(response) : response) as {
                text?: string;
                error?: string;
              };
              // #endregion Parse response.
              // #region Show result.
              if (result.text) {
                chatInput.value =
                  preRecordingText +
                  (preRecordingText && !preRecordingText.endsWith(" ") ? " " : "") +
                  result.text.trim();
              }
              // #endregion Show result.
            },
            complete: () => {
              interimInFlight = false;
            },
          });
          // #endregion Send AJAX request to Whisper plugin for transcription.
        } catch (X) {
          interimInFlight = false;
        }
      };
      /**
       * Sends the given {@link Blob } to the CodBi's Whisper-Model fro transription.
       *
       * @param audiBlob The {@link Blob } to send. */
      const sendForTranscription = async (audioBlob: Blob) => {
        isTranscribing = true;

        mic.classList.add("LLAMA_Chat_MicButton--transcribing");

        mic.disabled = true;
        /**
         * Disables the mic button and resets the transcribing state. Used in multiple places to ensure consistent cleanup after
         * transcription ends, whether successful or due to an error. */
        const disableMic = () => {
          isTranscribing = false;

          mic.classList.remove("LLAMA_Chat_MicButton--transcribing");

          mic.disabled = false;
        };
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Failed to read audio blob."));

            reader.readAsDataURL(audioBlob);
          });

          const formData = new FormData();

          formData.append("codbi-base64:audio", dataUrl);

          const ajaxHeaders: Record<string, string> = {};

          if (lang) {
            ajaxHeaders["X-Language"] = lang;
          }
          // #region Send the [audioBlob].
          $.ajax({
            url: pluginUrl,
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            cache: false,
            headers: ajaxHeaders,
            success: (response: unknown) => {
              // #region Parse response.
              const result = (typeof response === "string" ? JSON.parse(response) : response) as {
                text?: string;
                error?: string;
              };
              // #endregion Parse response.
              // #region Log failure.
              if (result.error) {
                window.codbi.log("ERROR", `Whisper: ${result.error}`, "AI / LLAMA / CHAT");

                return;
              }
              // #endregion Log failure.
              // #region Show result.
              if (result.text) {
                const separator = preRecordingText && !preRecordingText.endsWith(" ") ? " " : "";

                chatInput.value = preRecordingText + separator + result.text.trim();
              }
              // #endregion Show result.
            },
            error: (_xhr: unknown, _status: unknown, error: unknown) => {
              window.codbi.log("ERROR", `Whisper transcription failed: ${String(error)}`, "AI / LLAMA / CHAT");
            },
            complete: () => {
              disableMic();
            },
          });
          // #endregion Send the [audioBlob].
        } catch (X) {
          window.codbi.log(
            "ERROR",
            `Whisper transcription failed: ${X instanceof Error ? X.message : String(X)}`,
            "AI / LLAMA / CHAT",
          );

          disableMic();
        }
      };
      // #endregion Send audio to Whisper for transcription
      /**
       * Starts recording audio from the user's microphone and sets up handlers to process the recorded data. The accumulated
       * audio is sent for transcription. */
      const startRecording = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

          whisperAudioChunks = [];
          whisperMediaRecorder = new MediaRecorder(stream, { mimeType: preferredMimeType() });
          // #region Accumulate data.
          whisperMediaRecorder.ondataavailable = (e: BlobEvent) => {
            if (e.data.size > 0) {
              whisperAudioChunks.push(e.data);
            }
          };
          // #endregion Accumulate data.
          /**
           * Stops the recording, releases the microphone, and sends the accumulated audio for transcription. This is called
           * when the user stops the recording.
           *
           * @returns A Promise that resolves when the stop process is complete. */
          whisperMediaRecorder.onstop = async () => {
            for (const track of stream.getTracks()) {
              track.stop();
            }

            if (interimInterval) {
              clearInterval(interimInterval);

              interimInterval = null;
            }

            if (whisperAudioChunks.length === 0) {
              return;
            }

            let audioBlob = new Blob(whisperAudioChunks, { type: whisperMediaRecorder?.mimeType ?? "audio/webm" });

            if (!whisperConvertSupported) {
              try {
                audioBlob = await convertToWav(audioBlob);
              } catch (X) {
                window.codbi.log(
                  "ERROR",
                  `WAV conversion failed: ${X instanceof Error ? X.message : String(X)}`,
                  "AI / LLAMA / CHAT",
                );

                return;
              }
            }

            sendForTranscription(audioBlob);
          };

          preRecordingText = chatInput.value;

          whisperMediaRecorder.start();

          isRecording = true;

          mic.classList.add("LLAMA_Chat_MicButton--recording");

          const rec = whisperMediaRecorder; // Periodic interim transcription — flush and send accumulated audio every ~2.5s

          interimInterval = window.setInterval(() => {
            if (interimInFlight || rec.state !== "recording") {
              return;
            }

            rec.requestData();

            if (whisperAudioChunks.length === 0) {
              return;
            }

            const blob = new Blob(whisperAudioChunks, { type: rec.mimeType });

            sendInterimTranscription(blob);
          }, 2500);
        } catch (X) {
          mic.classList.add("LLAMA_Chat_MicButton--unavailable");

          mic.title = "Microphone access denied";
          mic.disabled = true;
        }
      };
      /**
       * Stops the current recording (if any), resets the mic button state, and releases the microphone. This is called when the
       * user stops the recording. */
      const stopRecording = () => {
        if (interimInterval) {
          clearInterval(interimInterval);

          interimInterval = null;
        }

        if (whisperMediaRecorder && whisperMediaRecorder.state !== "inactive") {
          whisperMediaRecorder.stop();
        }

        isRecording = false;

        mic.classList.remove("LLAMA_Chat_MicButton--recording");
      };

      stopRecordingFn = stopRecording;
      /** Toggles the recording state. If recording is in progress, it stops the recording; otherwise, it starts a new recording. */
      const toggleRecording = () => {
        if (mic.disabled || isTranscribing) {
          return;
        }
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      };

      mic.addEventListener("click", toggleRecording);
      // #region Handle hotkeys.
      const hotkeyDef = (typeof toLoad.voicehotkey === "string" && toLoad.voicehotkey.trim()) || "Alt+A";
      const hotkeyParts = hotkeyDef.split("+").map((p: string) => p.trim());
      const hotkeyKey = hotkeyParts[hotkeyParts.length - 1].toUpperCase();
      const needAlt = hotkeyParts.some((p: string) => /^alt$/i.test(p));
      const needCtrl = hotkeyParts.some((p: string) => /^ctrl$/i.test(p));
      const needShift = hotkeyParts.some((p: string) => /^shift$/i.test(p));
      const needMeta = hotkeyParts.some((p: string) => /^meta$/i.test(p));

      mic.title = `Voice input — Whisper (${hotkeyDef})`;

      document.addEventListener("keydown", (e: KeyboardEvent) => {
        if (
          e.key.toUpperCase() === hotkeyKey &&
          e.altKey === needAlt &&
          e.ctrlKey === needCtrl &&
          e.shiftKey === needShift &&
          e.metaKey === needMeta
        ) {
          e.preventDefault();
          // #region Skip if a MEDIA_INPUT_SPEECH or MEDIA_WHISPER.
          if (
            document.activeElement?.closest(".MEDIA_Speech_InputWrapper") ||
            document.activeElement?.closest(".MEDIA_Whisper_InputWrapper")
          ) {
            return;
          }
          // #endregion Skip if a MEDIA_INPUT_SPEECH or MEDIA_WHISPER.
          toggleRecording();
        }
      });
      // #region Hotkey-Sending.
      const sendHotkeyDef = (typeof toLoad.voicesendhotkey === "string" && toLoad.voicesendhotkey.trim()) || "Alt+Q";
      const sHParts = sendHotkeyDef.split("+").map((p: string) => p.trim());
      const sHKey = sHParts[sHParts.length - 1].toUpperCase();
      const sHAlt = sHParts.some((p: string) => /^alt$/i.test(p));
      const sHCtrl = sHParts.some((p: string) => /^ctrl$/i.test(p));
      const sHShift = sHParts.some((p: string) => /^shift$/i.test(p));
      const sHMeta = sHParts.some((p: string) => /^meta$/i.test(p));

      document.addEventListener("keydown", (e: KeyboardEvent) => {
        if (
          e.key.toUpperCase() === sHKey &&
          e.altKey === sHAlt &&
          e.ctrlKey === sHCtrl &&
          e.shiftKey === sHShift &&
          e.metaKey === sHMeta
        ) {
          e.preventDefault();

          if (isRecording) {
            stopRecording();
          }

          sendMessage();
        }
      });
      // #endregion Hotkey-Sending.
      // #endregion Handle hotkeys.
      chatInput.placeholder =
        (typeof toLoad.voiceplaceholder === "string" && toLoad.voiceplaceholder.trim()) ||
        `${hotkeyDef} = \uD83C\uDF99\uFE0F on/off | ${sendHotkeyDef} = \uD83C\uDF99\uFE0F off + send`;
    };
    // #region Whisper health-check and mic setup.
    if (whisperUrl) {
      const wUrl = whisperUrl;
      $.ajax({
        url: wUrl,
        type: "GET",
        cache: false,
        headers: { "X-Health-Check": "true" },
        success: (response: unknown) => {
          const result = (typeof response === "string" ? JSON.parse(response) : response) as {
            status?: string;
            convertSupported?: boolean;
            error?: string;
          };
          if (result.error || result.status !== "ready") {
            return;
          }
          if (typeof result.convertSupported === "boolean") {
            whisperConvertSupported = result.convertSupported;
          }

          setupWhisperMic(wUrl);
        },
        error: () => {},
      });
    }
    // #endregion Whisper health-check and mic setup
    // #region State variables and conversation management
    let isBusy = false;
    let attachedFiles: File[] = [];
    let thinkingBubble: HTMLDivElement | null = null;
    let lastUserQuestion = "";
    let activeStreamId: string | null = null;

    const pageSessionId: string = generateUUID();
    const conversationHistory: { role: string; content: string }[] = [];
    /** Tracks assistant entries whose mean logprob fell below {@link LOW_CONFIDENCE_THRESHOLD}. */
    const lowConfidenceEntries = new Set<object>();
    /**
     * Strips markdown links, bare URLs, and truncates assistant text before storing it in conversation history. This prevents
     * the small models from parrot-copying content from previous turns into unrelated answers.
     *
     * @param text The original message text to clean for history storage.
     *
     * @returns The cleaned text with links removed and truncated if necessary. */
    const stripLinksForHistory = (text: string): string => {
      let cleaned = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // [label](url) → label

      cleaned = cleaned.replace(/https?:\/\/[^\s)]+/g, ""); // Bare URLs.
      cleaned = cleaned.replace(/ {2,}/g, " ").trim(); // Collapse multiple spaces / trim.
      // Truncate to prevent the model from parroting long previous answers
      if (cleaned.length > 150) {
        cleaned = `${cleaned.substring(0, 147)}...`;
      }

      return cleaned;
    };
    /**
     * Maximum number of recent history entries to keep verbatim (the rest are condensed into a single summary entry so the
     * context window is not exhausted). Must be even to keep user/assistant pairs intact. */
    const MAX_VERBATIM_ENTRIES = 6;
    // #endregion State variables and conversation management
    // #region Compact conversation history
    /**
     * Generates a compacted copy of `conversationHistory`.
     * - If the history has at most {@link MAX_VERBATIM_ENTRIES} entries it is returned as-is.
     * - Otherwise the oldest turns are condensed into a single "system" entry
     *   (each turn truncated to ~120 chars) and the most recent turns are kept verbatim. */
    const compactHistory = (): { role: string; content: string }[] => {
      const effective = conversationHistory.filter((e) => !lowConfidenceEntries.has(e));

      if (effective.length <= MAX_VERBATIM_ENTRIES) {
        return effective;
      }

      const cutoff = effective.length - MAX_VERBATIM_ENTRIES;
      const oldTurns = effective.slice(0, cutoff);
      const recentTurns = effective.slice(cutoff);
      // #region Build a condensed summary of the older turns
      const lines: string[] = [];

      for (let i = 0; i < oldTurns.length; i += 2) {
        const userMsg = oldTurns[i]?.content ?? "";
        const asstMsg = oldTurns[i + 1]?.content ?? "";
        const uShort = userMsg.length > 120 ? `${userMsg.substring(0, 117)}...` : userMsg;
        const aShort = asstMsg.length > 120 ? `${asstMsg.substring(0, 117)}...` : asstMsg;

        lines.push(`- User: ${uShort}  Assistant: ${aShort}`);
      }
      // #endregion Build a condensed summary of the older turns
      const summaryEntry: { role: string; content: string } = {
        role: "system",
        content: `Summary of earlier conversation:\n${lines.join("\n")}`,
      };

      return [summaryEntry, ...recentTurns];
    };
    // #endregion Compact conversation history
    // #region Resource status overlay
    let overlayHideTimer: ReturnType<typeof setTimeout> | null = null;
    let resourceOverlay: HTMLDivElement | null = null;

    const getOverlay = (): HTMLDivElement => {
      if (resourceOverlay) {
        return resourceOverlay;
      }

      const el = document.createElement("div");

      el.style.cssText = `
        position: absolute ; top: 6px ; right: 6px ; display: none ; align-items: center ; justify-content: center ;
        background: rgba( 0, 0, 0, 0.72 ); color: #fff ;font-size: 12px ; font-weight: 600 ; padding: 6px 14px ;
        text-align: center ; pointer-events: none ; z-index: 1000 ; border-radius: 6px ; backdrop-filter: blur( 2px );
        transition: opacity 0.3s ease ; max-width: 60% ; white-space: nowrap; overflow: hidden ; text-overflow: ellipsis ;`;
      // Anchor relative to the chat container
      const anchor = chatContainer.parentElement;

      if (anchor) {
        const cs = window.getComputedStyle(anchor);

        if (cs.position === "static") {
          (anchor as HTMLElement).style.position = "relative";
        }

        anchor.appendChild(el);
      }

      resourceOverlay = el;

      return el;
    };
    /**
     * Shows a message in the resource status overlay. If another message is already showing, it is replaced and the hide timer
     * is reset.
     *
     * @param message The message to display in the overlay. */
    const showResourceOverlay = (message: string): void => {
      if (overlayHideTimer) {
        clearTimeout(overlayHideTimer);

        overlayHideTimer = null;
      }

      const overlay = getOverlay();

      overlay.textContent = message;
      overlay.style.display = "flex";
      overlay.style.opacity = "1";
    };
    /** Hides the resource status overlay. If a hide timer is active, it is cleared. */
    const hideResourceOverlay = (): void => {
      if (!resourceOverlay) {
        return;
      }

      resourceOverlay.style.opacity = "0";
      /**
       * Delay hiding the overlay until after the fade-out transition completes, to avoid a jarring abrupt disappearance. If another
       * message is shown before the timer fires, the hide is canceled and the new message is shown immediately. */
      overlayHideTimer = setTimeout(() => {
        if (resourceOverlay) {
          resourceOverlay.style.display = "none";
        }

        overlayHideTimer = null;
      }, 400);
    };
    /**
     * Handles `resourceStatus` from the poll response.
     * "Resumed" and timeout messages auto-hide after 2.5 seconds;
     * pause messages stay visible until superseded.
     *
     * @param status The resource status message to show, or undefined to ignore. */
    const handleResourceStatus = (status: string | undefined): void => {
      if (!status) {
        return;
      }

      showResourceOverlay(status);

      if (status.includes("\u25B6") || status.includes("\u26A0")) {
        overlayHideTimer = setTimeout(hideResourceOverlay, 2500);
      }
    };
    // #endregion Resource status overlay
    // #region Turn URLs, Mail-Addresses and Phone-Numbers in plain text into linked badges.
    /**
     * HTML-escapes the given plain text, then converts:
     *   1. Markdown links `[label](url)` → clickable `<a>` with the label text
     *   2. Bare URLs (`https://…` / `http://…`) → clickable `<a>` showing the hostname
     *   3. Phone numbers → clickable `tel:` link in a badge
     *   4. Email addresses → clickable `mailto:` link in a badge
     *
     * Uses a placeholder strategy so that URLs inside already-created `<a>` tags are never matched again by the bare-URL pass.
     * All links open in a new tab with `rel="noopener noreferrer"`.
     *
     * @param text  Raw plain text (may contain URLs or Markdown links).
     *
     * @returns     Safe HTML string with clickable links. */
    const linkifyUrls = (text: string): string => {
      const links: string[] = [];
      const placeholder = (idx: number): string => `\x00LINK${idx}\x00`;
      // #region Extract code blocks and escape HTML.
      // #region Extract fenced code blocks (```...```) before HTML-Escaping.
      const codeBlocks: string[] = [];
      const codePlaceholder = (idx: number): string => `\x00CODE${idx}\x00`;
      const withCodeExtracted = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang: string, code: string) => {
        const idx = codeBlocks.length;

        codeBlocks.push(
          `<div class="LLAMA_Chat_CodeBlock"><div class="LLAMA_Chat_CodeHeader"><span class="LLAMA_Chat_CodeLang">${lang || "code"}</span><button type="button" class="LLAMA_Chat_CodeCopyBtn" title="Copy code"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg></button></div><pre class="LLAMA_Chat_CodePre"><code>${code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre></div>`,
        );

        return codePlaceholder(idx);
      });
      // #endregion Extract fenced code blocks (```...```) before HTML-Escaping.
      // #region Extract inline code (`...`) before HTML-Escaping.
      const withInlineCodeExtracted = withCodeExtracted.replace(/`([^`\n]+)`/g, (_m, code: string) => {
        const idx = codeBlocks.length;

        codeBlocks.push(
          `<code class="LLAMA_Chat_InlineCode">${code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code>`,
        );

        return codePlaceholder(idx);
      });
      // #endregion Extract inline code (`...`) before HTML-Escaping.
      // #region HTML-Escape to prevent XSS.
      const escaped = withInlineCodeExtracted
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
      // #endregion HTML-Escape to prevent XSS.
      // #endregion Extract code blocks and escape HTML.
      // #region Convert links to placeholders.
      const withMdPlaceholders = escaped.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi,
        (_match, label: string, url: string) => {
          const idx = links.length;

          links.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);

          return placeholder(idx);
        },
      );
      // biome-ignore lint/suspicious/noControlCharactersInRegex: <explanation>
      const withAllPlaceholders = withMdPlaceholders.replace(/https?:\/\/[^\s<>&"'\x00)\]]+/gi, (url) => {
        let label = url;

        try {
          const u = new URL(url);

          label = u.hostname.replace(/^www\./, "");
        } catch {}

        const idx = links.length;

        links.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);

        return placeholder(idx);
      });
      // #endregion Convert links to placeholders.
      // #region Convert Phone-Numbers and eMail-Addresses.
      const withPhonePlaceholders = withAllPlaceholders.replace(
        /(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.\/-]?){1,3}\d{1,8}/g,
        (match) => {
          const digitsOnly = match.replace(/\D/g, "");
          if (digitsOnly.length < 7 || digitsOnly.length > 15) {
            return match;
          }

          if (/^\d{4}\s*[-–—]\s*\d{4}$/.test(match.trim())) {
            return match;
          }

          if (/^\d{4}[-/.]\d{2}[-/.]\d{2}([-/.T\s]\d{2,6}([-/:]\d{2}){0,2})?$/.test(match.trim())) {
            return match;
          }

          if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(match.trim())) {
            return match;
          }

          if (/^\d+\.\d+$/.test(match.trim())) {
            return match;
          }

          const idx = links.length;
          const telHref = `tel:${match.replace(/[^\d+]/g, "")}`;

          links.push(
            `<span class="LLAMA_Chat_PhoneBadge"><span class="LLAMA_Chat_BadgeIcon">📞</span><a href="${telHref}">${match}</a></span>`,
          );

          return placeholder(idx);
        },
      );

      // #region Convert eMail.Addresses.
      const withEmailPlaceholders = withPhonePlaceholders.replace(
        /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
        (match) => {
          const idx = links.length;
          links.push(
            `<span class="LLAMA_Chat_EmailBadge"><span class="LLAMA_Chat_BadgeIcon">✉</span><a href="mailto:${match}">${match}</a></span>`,
          );
          return placeholder(idx);
        },
      );
      // #endregion Convert eMail.Addresses.
      // #region Convert Phone-Numbers and eMail-Addresses.
      // #region Restore placeholders.
      // 6. Restore placeholders with actual <a> tags, wrapping URL badges
      const restored = withEmailPlaceholders.replace(
        // biome-ignore lint/suspicious/noControlCharactersInRegex: placeholder pattern uses \x00
        /\x00LINK(\d+)\x00/g,
        (_m, idx: string) => {
          const html = links[Number(idx)];
          if (html.startsWith('<span class="LLAMA_Chat_Phone') || html.startsWith('<span class="LLAMA_Chat_Email')) {
            return html;
          }

          return `<span class="LLAMA_Chat_SourceBadge">${html}</span>`;
        },
      );
      // #endregion Restore placeholders.
      // biome-ignore lint/suspicious/noControlCharactersInRegex: placeholder pattern uses \x00
      const withCode = restored.replace(/\x00CODE(\d+)\x00/g, (_m, idx: string) => codeBlocks[Number(idx)]);

      return withCode;
    };
    // #region Clipboard helper (works on HTTP too)
    const copyToClipboard = (text: string): void => {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
      } else {
        fallbackCopy(text);
      }
    };
    const fallbackCopy = (text: string): void => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-9999px;top:-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    };
    // #endregion Clipboard helper
    // #region Turn URLs, Mail-Addresses and Phone-Numbers in plain text into linked badges.
    // #region Create Chat-Bubble Elements
    /**
     * Creates a speech-bubble element and appends it to the chat container.
     *
     * @param text    Message text.
     * @param role    `"user"` (right-aligned), `"llama"` (left-aligned), or `"system"` (centered, muted).
     *
     * @returns The created bubble `<div>` so callers can update it later (e.g. streaming). */
    const appendBubble = (text: string, role: "user" | "llama" | "system"): HTMLDivElement => {
      const row = document.createElement("div");

      row.className = `LLAMA_Chat_Row LLAMA_Chat_Row--${role}`;

      const bubble = document.createElement("div");

      bubble.className = `LLAMA_Chat_Bubble LLAMA_Chat_Bubble--${role}`;
      bubble.innerHTML = linkifyUrls(text);

      row.appendChild(bubble);

      if (role === "user") {
        lastUserQuestion = text;

        const question = text;
        const toolbar = document.createElement("div");

        toolbar.className = "LLAMA_Chat_BubbleToolbar";

        const copyBtn = document.createElement("button");

        copyBtn.type = "button";
        copyBtn.className = "LLAMA_Chat_ToolbarBtn";
        copyBtn.title = "Copy question";
        copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>`;

        copyBtn.addEventListener("click", () => {
          copyToClipboard(question);
          bubble.classList.remove("LLAMA_flash");
          void bubble.offsetWidth;
          bubble.classList.add("LLAMA_flash");
        });

        toolbar.appendChild(copyBtn);

        const reuseBtn = document.createElement("button");

        reuseBtn.type = "button";
        reuseBtn.className = "LLAMA_Chat_ToolbarBtn LLAMA_Chat_ToolbarBtn--reuse";
        reuseBtn.title = "Reuse this question";
        reuseBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`;

        reuseBtn.addEventListener("click", () => {
          chatInput.value = question;
          chatInput.focus();
          chatInput.classList.remove("LLAMA_input_flare");
          void chatInput.offsetWidth;
          chatInput.classList.add("LLAMA_input_flare");
          setTimeout(() => chatInput.classList.remove("LLAMA_input_flare"), 2000);
        });

        toolbar.appendChild(reuseBtn);
        bubble.appendChild(toolbar);
      }

      chatContainer.appendChild(row);

      chatContainer.scrollTop = chatContainer.scrollHeight;

      return bubble;
    };
    // #endregion Create Chat-Bubble Elements
    // #region Append message block to chat display.
    const appendToChat = (text: string): void => {
      if (text.startsWith("You: ")) {
        appendBubble(text.substring(5), "user");
      } else if (text.startsWith("Qwen3: ")) {
        appendBubble(text.substring(7), "llama");
      } else {
        appendBubble(text, "system");
      }
    };
    // #endregion Append message block to chat display.
    // #region Replace thinking indicator with real response.
    const replaceThinking = (text: string): void => {
      if (thinkingBubble) {
        thinkingBubble.parentElement?.remove();

        thinkingBubble = null;
      }

      appendToChat(text);
    };
    // #endregion Replace thinking indicator with real response.
    // #region Selected files changed handler.
    if (fileUpload) {
      fileUpload.addEventListener("change", () => {
        const files = fileUpload.files;

        if (files && files.length > 0) {
          attachedFiles = Array.from(files);
          conversationHistory.length = 0;

          const names = attachedFiles.map((f) => f.name).join(", ");

          appendToChat(`\u{1F4CE} ${attachedFiles.length} file(s) attached: ${names}`);

          window.codbi.log("INFO", `Chat files attached: ${names}`, "AI / LLAMA / CHAT");
        } else {
          attachedFiles = [];
        }
      });
    }
    // #endregion Selected files changed handler.
    // #region Code block / Copy button
    chatContainer.addEventListener("click", (e: Event) => {
      const btn = (e.target as HTMLElement).closest(".LLAMA_Chat_CodeCopyBtn") as HTMLElement | null;

      if (!btn) {
        return;
      }

      const codeEl = btn.closest(".LLAMA_Chat_CodeBlock")?.querySelector("code");

      if (codeEl) {
        copyToClipboard(codeEl.textContent || "");

        const block = btn.closest(".LLAMA_Chat_CodeBlock") as HTMLElement;

        if (block) {
          block.classList.remove("LLAMA_flash");

          void block.offsetWidth;

          block.classList.add("LLAMA_flash");
        }
      }
    });
    // #endregion Code block / Copy button
    // #region EH / Send message.
    const sendMessage = async (): Promise<void> => {
      const message = chatInput.value.trim();

      if (!message || isBusy) {
        return;
      }

      const modelLabel = thinkingCheckbox ? (thinkingCheckbox.checked ? "\uD83D\uDCA1 Thinking" : "\u26A1 Fast") : "AI";

      appendBubble(message, "user");

      chatInput.value = "";
      conversationHistory.push({ role: "user", content: message });

      isBusy = true;
      sendButton.disabled = true;
      acquireWakeLock();

      if (micButton) {
        if (isRecording && stopRecordingFn) {
          stopRecordingFn();
        }

        micButton.disabled = true;
      }

      if ("disabled" in chatInput) {
        chatInput.disabled = true;
      }

      // #region Show thinking indicator bubble.
      thinkingBubble = appendBubble("", "llama");
      thinkingBubble.innerHTML = `<div class="CodBiLoader_Spinner LLAMA_ThinkingSpinner"></div><span class="LLAMA_ThinkingLabel">Thinking...</span>`;

      thinkingBubble.classList.add("LLAMA_Chat_Bubble--thinking");
      // #endregion Show thinking indicator bubble.
      try {
        AI_LLAMA_CHAT.ensurePdfJsWorkerConfigured();

        const formData = new FormData();
        const maxPages = toLoad.maxpages ? Number(toLoad.maxpages) : 5;
        const maxPixelSize =
          toLoad.maxpixelsize != null ? Number(toLoad.maxpixelsize) : AI_LLAMA_CHAT.DEFAULT_MAX_PIXELS;
        // #region Process attached files (PDF / Image)
        for (const file of attachedFiles) {
          if (file.type === "application/pdf") {
            const processedImages = await AI_LLAMA_CHAT.processPdfFile(file, maxPages);

            for (let i = 0; i < processedImages.length; i++) {
              const imageName = `${file.name.replace(".pdf", "")}_page_${i + 1}.png`;
              let imageFile = new File([processedImages[i]], imageName, { type: "image/png" });
              // #region Downscale PDF page if it exceeds the pixel budget.
              if (maxPixelSize > 0) {
                const downscaled = await AI_LLAMA_CHAT.downscaleImageIfNeeded(imageFile, maxPixelSize);

                imageFile =
                  downscaled instanceof File
                    ? downscaled
                    : new File([downscaled], imageName, { type: downscaled.type || "image/png" });
              }
              // #endregion Downscale PDF page if it exceeds the pixel budget.
              const dataUrl = await AI_LLAMA_CHAT.blobToDataUrl(imageFile); // Send as base64 text param — formcycle's multipart parser returns 0-byte FileData.

              formData.append(`codbi-base64:${imageName}`, dataUrl);
            }
          } else if (maxPixelSize > 0) {
            const downscaled = await AI_LLAMA_CHAT.downscaleImageIfNeeded(file, maxPixelSize); // Downscale if the image exceeds the pixel budget.
            const dataUrl = await AI_LLAMA_CHAT.blobToDataUrl(downscaled);

            window.codbi.log(
              "INFO",
              `Appending '${file.name}' as base64 param: ${dataUrl.length < 1024 ? `${dataUrl.length} B` : dataUrl.length < 1048576 ? `${Math.round(dataUrl.length / 1024)} KB` : `${(dataUrl.length / 1048576).toFixed(1)} MB`}`,
              "AI / LLAMA / CHAT",
            );

            formData.append(`codbi-base64:${file.name}`, dataUrl);
          } else {
            const dataUrl = await AI_LLAMA_CHAT.blobToDataUrl(file); // Backend enforces the limit defined there.

            window.codbi.log(
              "INFO",
              `Appending '${file.name}' as base64 param (no client downscale): ${dataUrl.length < 1024 ? `${dataUrl.length} B` : dataUrl.length < 1048576 ? `${Math.round(dataUrl.length / 1024)} KB` : `${(dataUrl.length / 1048576).toFixed(1)} MB`}`,
              "AI / LLAMA / CHAT",
            );

            formData.append(`codbi-base64:${file.name}`, dataUrl);
          }
        }
        attachedFiles = [];

        if (fileUpload) {
          fileUpload.value = "";
        }
        // #endregion Process attached files (PDF / Image)
        // #region Build request headers
        const headers: { [key: string]: string } = {};

        if (toLoad.rotation && toLoad.rotation !== "0" && toLoad.rotation !== 0) {
          headers["X-Rotate"] = toLoad.rotation.toString();
        }

        // #region HTTP headers are ASCII-only — Base64-encode to preserve Unicode (e.g. ü, ö, ä)
        const utf8ToBase64 = (str: string): string => btoa(String.fromCharCode(...new TextEncoder().encode(str)));

        headers["X-Question-chat"] = utf8ToBase64(message.replace(/[\r\n]+/g, " ").trim());
        headers["X-Stream"] = "true";
        headers["X-Session-Id"] = pageSessionId;
        headers["X-Chat-History"] = utf8ToBase64(JSON.stringify(compactHistory()));
        // #endregion HTTP headers are ASCII-only — Base64-encode to preserve Unicode (e.g. ü, ö, ä)
        if (responseLang) {
          headers["X-Forced-Language"] = responseLang;
        }
        if (specialist) {
          headers["X-Specialist"] = specialist;
        }
        if (toLoad.disablefrequencypenalty != null && String(toLoad.disablefrequencypenalty).toLowerCase() === "true") {
          headers["X-Disable-Frequency-Penalty"] = "true";
        }
        if (thinkingCheckbox) {
          headers["X-Thinking"] = thinkingCheckbox.checked ? "true" : "false";
        }
        if (searchCheckbox) {
          headers["X-Search"] = searchCheckbox.checked ? "true" : "false";
        }
        if (filterResults != null) {
          headers["X-Filter-Results"] = filterResults ? "true" : "false";
        }
        if (locationCheckbox?.checked) {
          headers["X-Location"] = "true";
          // #region Pre-fetch browser geolocation
          if (navigator.geolocation) {
            try {
              const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: false,
                  timeout: 5000,
                  maximumAge: 300000, // 5 min cache
                });
              });

              headers["X-Latitude"] = pos.coords.latitude.toFixed(4);
              headers["X-Longitude"] = pos.coords.longitude.toFixed(4);

              window.codbi.log(
                "INFO",
                `Geolocation: ${headers["X-Latitude"]}, ${headers["X-Longitude"]}`,
                "AI / LLAMA / CHAT",
              );
            } catch (geoErr) {
              const msg =
                geoErr instanceof GeolocationPositionError ? `${geoErr.message} (code ${geoErr.code})` : String(geoErr);
              window.codbi.log("WARNING", `Geolocation unavailable: ${msg}`, "AI / LLAMA / CHAT");
            }
          }
        }
        // #endregion Pre-fetch browser geolocation
        // #endregion Build request headers
        // #region Finish streaming and re-enable UI.
        const finishStreaming = (): void => {
          activeStreamId = null;
          isBusy = false;
          sendButton.disabled = false;
          releaseWakeLock();

          if (micButton) {
            micButton.disabled = false;
          }
          if (stopButton) {
            stopButton.disabled = true;
          }
          if ("disabled" in chatInput) {
            (chatInput as HTMLInputElement).disabled = false;
          }

          hideResourceOverlay();
          chatInput.focus();

          // Alert-on-finish: multi-pronged notification (browser API + audio beep + title flash + in-page toast).
          if (alertOnFinishCheckbox?.checked) {
            // 1. Try browser Notification API (may silently fail in iframes / cross-origin contexts).
            try {
              if ("Notification" in window) {
                window.codbi.log(
                  "INFO",
                  `AlertOnFinish: Notification API available. permission="${Notification.permission}"`,
                  "AI / LLAMA / CHAT",
                );
                if (Notification.permission === "granted") {
                  new Notification(alertOnFinishText, {
                    body: "You should check back on the site.",
                    icon: "/favicon.ico",
                  });
                  window.codbi.log("INFO", "AlertOnFinish: Notification created (granted).", "AI / LLAMA / CHAT");
                } else if (Notification.permission === "default") {
                  window.codbi.log(
                    "INFO",
                    "AlertOnFinish: Permission is default — requesting now.",
                    "AI / LLAMA / CHAT",
                  );
                  Notification.requestPermission().then((perm) => {
                    window.codbi.log(
                      "INFO",
                      `AlertOnFinish: requestPermission resolved: "${perm}"`,
                      "AI / LLAMA / CHAT",
                    );
                    if (perm === "granted") {
                      new Notification(alertOnFinishText, {
                        body: "You should check back on the site.",
                        icon: "/favicon.ico",
                      });
                    }
                  });
                } else {
                  window.codbi.log(
                    "WARN",
                    `AlertOnFinish: Permission is "${Notification.permission}" — notification blocked by user.`,
                    "AI / LLAMA / CHAT",
                  );
                }
              } else {
                window.codbi.log(
                  "WARN",
                  "AlertOnFinish: Notification API not available in this window.",
                  "AI / LLAMA / CHAT",
                );
              }
            } catch (notifErr) {
              window.codbi.log(
                "ERROR",
                `AlertOnFinish: Notification API threw: ${String(notifErr)}`,
                "AI / LLAMA / CHAT",
              );
            }
            // 2. Audio beep (works without permissions once user has interacted with page).
            try {
              const actx = new AudioContext();
              const osc = actx.createOscillator();

              osc.type = "sine";
              osc.frequency.setValueAtTime(880, actx.currentTime);
              osc.connect(actx.destination);
              osc.start();
              osc.stop(actx.currentTime + 0.3);
            } catch {
              // AudioContext unavailable — ignore.
            }
            // 3. Flash page title so the user notices even if browser notification is blocked.
            const origTitle = document.title;
            let flashes = 0;
            const titleFlash = setInterval(() => {
              document.title = flashes % 2 === 0 ? `\u2705 ${alertOnFinishText}` : origTitle;

              if (++flashes >= 6) {
                clearInterval(titleFlash);
                document.title = origTitle;
              }
            }, 1000);
            // 4. In-page toast banner (always works, regardless of iframe or permission state).
            const toast = document.createElement("div");

            toast.textContent = `\u2705 ${alertOnFinishText}`;
            toast.style.cssText =
              "position:fixed;top:16px;right:16px;z-index:999999;padding:12px 20px;" +
              "background:#1a7f37;color:#fff;border-radius:8px;font-size:14px;font-weight:600;" +
              "box-shadow:0 4px 12px rgba(0,0,0,.25);opacity:0;transition:opacity .3s;cursor:pointer";
            document.body.appendChild(toast);
            requestAnimationFrame(() => {
              toast.style.opacity = "1";
            });
            toast.addEventListener("click", () => toast.remove());
            setTimeout(() => {
              toast.style.opacity = "0";
              setTimeout(() => toast.remove(), 400);
            }, 6000);
          }
        };
        // #endregion Finish streaming and re-enable UI.
        // #region Poll a streaming session until done.
        const pollStream = (streamId: string): void => {
          let lastText = "";
          let streamBubble: HTMLDivElement | null = null;
          // #region i18n labels (updated with poll response)
          let i18nReasoningLabel = "Reasoning\u2026";
          let i18nShowReasoningLabel = "Show reasoning";
          let i18nShowSourcesLabel = "Show sources";
          let i18nSearchingLabel = "Searching the internet for \u201C%s\u201D\u2026";
          let i18nSearchingLabelNoQuery = "Searching the internet\u2026";
          let i18nReadingLabel = "Reading page: \u201C%s\u201D\u2026";
          let i18nReadingLabelNoUrl = "Reading page content\u2026";
          let i18nThinkingLabel = "Thinking\u2026";
          let i18nCopyResponseLabel = "Response";
          let i18nCopyReasoningLabel = "Reasoning";
          let i18nSendingMailLabel = "Sending email to \u201C%s\u201D\u2026";
          let i18nSendingMailLabelNoRecipient = "Sending email\u2026";
          // #endregion i18n labels (updated with poll response)
          const interval = setInterval(() => {
            $.ajax({
              url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
              type: "POST",
              dataType: "json",
              processData: false,
              contentType: false,
              cache: false,
              beforeSend: (xhr) => {
                xhr.setRequestHeader("X-Stream-Poll", streamId);
              },
              success: (pollResponse) => {
                handleResourceStatus(pollResponse.resourceStatus);
                // #region Queue-position badge.
                if (pollResponse.queueBadge != null && queueBadgeOverride == null) {
                  queueBadgeEnabled = !!pollResponse.queueBadge;
                }
                const showBadge = queueBadgeOverride != null ? queueBadgeOverride : queueBadgeEnabled;
                if (showBadge && pollResponse.queuePosition > 0 && thinkingBubble) {
                  let badge = thinkingBubble.querySelector(".LLAMA_QueueBadge") as HTMLSpanElement | null;
                  if (!badge) {
                    badge = document.createElement("span");
                    badge.className = "LLAMA_QueueBadge";
                    thinkingBubble.appendChild(badge);
                  }
                  const waitLabel = formatWaitTime(pollResponse.estimatedWaitMs);
                  badge.textContent = `${pollResponse.queuePosition}${waitLabel ? ` ${waitLabel}` : ""}${queueText ? ` ${queueText}` : ""}`;
                } else if (thinkingBubble) {
                  thinkingBubble.querySelector(".LLAMA_QueueBadge")?.remove();
                }
                // #endregion Queue-position badge.
                // #region Get translated labels.
                if (pollResponse.i18n) {
                  if (pollResponse.i18n.reasoningLabel) {
                    i18nReasoningLabel = pollResponse.i18n.reasoningLabel;
                  }

                  if (pollResponse.i18n.showReasoningLabel) {
                    i18nShowReasoningLabel = pollResponse.i18n.showReasoningLabel;
                  }

                  if (pollResponse.i18n.showSourcesLabel) {
                    i18nShowSourcesLabel = pollResponse.i18n.showSourcesLabel;
                  }

                  if (pollResponse.i18n.searchingLabel) {
                    i18nSearchingLabel = pollResponse.i18n.searchingLabel;
                  }

                  if (pollResponse.i18n.searchingLabelNoQuery) {
                    i18nSearchingLabelNoQuery = pollResponse.i18n.searchingLabelNoQuery;
                  }

                  if (pollResponse.i18n.readingLabel) {
                    i18nReadingLabel = pollResponse.i18n.readingLabel;
                  }

                  if (pollResponse.i18n.readingLabelNoUrl) {
                    i18nReadingLabelNoUrl = pollResponse.i18n.readingLabelNoUrl;
                  }

                  if (pollResponse.i18n.thinkingLabel) {
                    i18nThinkingLabel = pollResponse.i18n.thinkingLabel;

                    const thinkingLabelEl = thinkingBubble?.querySelector(".LLAMA_ThinkingLabel");

                    if (thinkingLabelEl) {
                      thinkingLabelEl.textContent = i18nThinkingLabel;
                    }
                  }

                  if (pollResponse.i18n.copyResponseLabel) {
                    i18nCopyResponseLabel = pollResponse.i18n.copyResponseLabel;
                  }
                  if (pollResponse.i18n.copyReasoningLabel) {
                    i18nCopyReasoningLabel = pollResponse.i18n.copyReasoningLabel;
                  }

                  if (pollResponse.i18n.sendingMailLabel) {
                    i18nSendingMailLabel = pollResponse.i18n.sendingMailLabel;
                  }

                  if (pollResponse.i18n.sendingMailLabelNoRecipient) {
                    i18nSendingMailLabelNoRecipient = pollResponse.i18n.sendingMailLabelNoRecipient;
                  }
                  // #endregion Get translated labels.
                }

                if (pollResponse.error && pollResponse.done === undefined) {
                  clearInterval(interval);
                  replaceThinking(`${modelLabel}: \u26A0 ${pollResponse.error}`);
                  finishStreaming();

                  return;
                }

                const text: string = pollResponse.text ?? "";
                // #region Suppress the "CALL:search" if not outputting final answer.
                if (/CALL:/.test(text) && !pollResponse.done) {
                  const callMatch = text.match(/CALL:search\((?:\s*)query(?:\s*)=(?:\s*)['"]([^'"]*)['"]\s*\)/);
                  const fetchMatch = text.match(/CALL:fetch\((?:\s*)url(?:\s*)=(?:\s*)['"]([^'"]*)['"]\s*\)/);
                  const mailMatch = text.match(/CALL:mail\((?:\s*)to(?:\s*)=(?:\s*)['"]([^'"]*)['"]/);
                  if (streamBubble) {
                    streamBubble.parentElement?.remove();

                    streamBubble = null;
                  }

                  if (thinkingBubble) {
                    thinkingBubble.parentElement?.remove();

                    thinkingBubble = null;
                  }

                  if (callMatch && !chatContainer.querySelector(".LLAMA_SearchIndicator")) {
                    const searchQuery = callMatch[1];
                    const indicator = document.createElement("div");

                    indicator.className = "LLAMA_Chat_Row LLAMA_Chat_Row--llama";
                    indicator.innerHTML = `<div class="LLAMA_Chat_Bubble LLAMA_Chat_Bubble--llama LLAMA_SearchIndicator"><div class="CodBiLoader_Spinner LLAMA_SearchSpinner"></div><span class="LLAMA_SearchLabel">${i18nSearchingLabel.replace("%s", searchQuery)}</span></div>`;

                    chatContainer.appendChild(indicator);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                  } else if (fetchMatch && !chatContainer.querySelector(".LLAMA_SearchIndicator")) {
                    const fetchUrl = fetchMatch[1];
                    const indicator = document.createElement("div");

                    indicator.className = "LLAMA_Chat_Row LLAMA_Chat_Row--llama";
                    indicator.innerHTML = `<div class="LLAMA_Chat_Bubble LLAMA_Chat_Bubble--llama LLAMA_SearchIndicator"><div class="CodBiLoader_Spinner LLAMA_SearchSpinner"></div><span class="LLAMA_SearchLabel">${i18nReadingLabel.replace("%s", fetchUrl)}</span></div>`;

                    chatContainer.appendChild(indicator);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                  } else if (mailMatch && !chatContainer.querySelector(".LLAMA_SearchIndicator")) {
                    const mailTo = mailMatch[1];
                    const indicator = document.createElement("div");

                    indicator.className = "LLAMA_Chat_Row LLAMA_Chat_Row--llama";
                    indicator.innerHTML = `<div class="LLAMA_Chat_Bubble LLAMA_Chat_Bubble--llama LLAMA_SearchIndicator"><div class="CodBiLoader_Spinner LLAMA_SearchSpinner"></div><span class="LLAMA_SearchLabel">${mailTo ? i18nSendingMailLabel.replace("%s", mailTo) : i18nSendingMailLabelNoRecipient}</span></div>`;

                    chatContainer.appendChild(indicator);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                  }

                  lastText = "";

                  return;
                }
                // #endregion Suppress the "CALL:search" if not outputting final answer.
                // #region The "Fetching..."-Bubble.
                if (pollResponse.fetching && text.length === 0) {
                  if (!chatContainer.querySelector(".LLAMA_SearchIndicator")) {
                    if (streamBubble) {
                      streamBubble.parentElement?.remove();

                      streamBubble = null;
                    }

                    if (thinkingBubble) {
                      thinkingBubble.parentElement?.remove();

                      thinkingBubble = null;
                    }

                    const fetchUrl: string = pollResponse.fetchUrl ?? "";
                    const indicator = document.createElement("div");

                    indicator.className = "LLAMA_Chat_Row LLAMA_Chat_Row--llama";
                    indicator.innerHTML = `<div class="LLAMA_Chat_Bubble LLAMA_Chat_Bubble--llama LLAMA_SearchIndicator"><div class="CodBiLoader_Spinner LLAMA_SearchSpinner"></div><span class="LLAMA_SearchLabel">${fetchUrl ? i18nReadingLabel.replace("%s", fetchUrl) : i18nReadingLabelNoUrl}</span></div>`;

                    chatContainer.appendChild(indicator);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                  }

                  lastText = "";

                  return;
                }
                // #endregion The "Fetching..."-Bubble.
                // #region The "Sending email..."-Bubble.
                if (pollResponse.sendingMail && text.length === 0) {
                  if (!chatContainer.querySelector(".LLAMA_SearchIndicator")) {
                    if (streamBubble) {
                      streamBubble.parentElement?.remove();

                      streamBubble = null;
                    }

                    if (thinkingBubble) {
                      thinkingBubble.parentElement?.remove();

                      thinkingBubble = null;
                    }

                    const mailRecipient: string = pollResponse.mailRecipient ?? "";
                    const indicator = document.createElement("div");

                    indicator.className = "LLAMA_Chat_Row LLAMA_Chat_Row--llama";
                    indicator.innerHTML = `<div class="LLAMA_Chat_Bubble LLAMA_Chat_Bubble--llama LLAMA_SearchIndicator"><div class="CodBiLoader_Spinner LLAMA_SearchSpinner"></div><span class="LLAMA_SearchLabel">${mailRecipient ? i18nSendingMailLabel.replace("%s", mailRecipient) : i18nSendingMailLabelNoRecipient}</span></div>`;

                    chatContainer.appendChild(indicator);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                  }

                  lastText = "";

                  return;
                }
                // #endregion The "Sending email..."-Bubble.
                // #region The "Thinking..."-Bubble.
                if (pollResponse.searching && text.length === 0) {
                  if (!chatContainer.querySelector(".LLAMA_SearchIndicator")) {
                    if (streamBubble) {
                      streamBubble.parentElement?.remove();

                      streamBubble = null;
                    }

                    if (thinkingBubble) {
                      thinkingBubble.parentElement?.remove();

                      thinkingBubble = null;
                    }

                    const searchQuery: string = pollResponse.searchQuery ?? "";
                    const indicator = document.createElement("div");

                    indicator.className = "LLAMA_Chat_Row LLAMA_Chat_Row--llama";
                    indicator.innerHTML = `<div class="LLAMA_Chat_Bubble LLAMA_Chat_Bubble--llama LLAMA_SearchIndicator"><div class="CodBiLoader_Spinner LLAMA_SearchSpinner"></div><span class="LLAMA_SearchLabel">${searchQuery ? i18nSearchingLabel.replace("%s", searchQuery) : i18nSearchingLabelNoQuery}</span></div>`;

                    chatContainer.appendChild(indicator);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                  }

                  lastText = "";

                  return;
                }
                // #endregion The "Thinking..."-Bubble.
                // #region Remove pre-shorted duplicate text.
                if (text.length > 0 && text.length < lastText.length) {
                  const indicator = chatContainer.querySelector(".LLAMA_SearchIndicator");

                  if (indicator?.parentElement) {
                    indicator.parentElement.remove();
                  }

                  lastText = "";

                  if (streamBubble) {
                    streamBubble.innerHTML = linkifyUrls(text);
                  } else {
                    streamBubble = appendBubble(text, "llama");
                  }

                  return;
                }
                // #endregion Remove pre-shorted duplicate text.
                // #region Live-Reasoning.
                const liveThinking: string | undefined = pollResponse.thinking;

                if (liveThinking && text.length === 0 && !pollResponse.done && thinkingBubble) {
                  let reasoningEl = thinkingBubble.querySelector(
                    ".LLAMA_LiveReasoningContent",
                  ) as HTMLDivElement | null;

                  if (!reasoningEl) {
                    thinkingBubble.classList.remove("LLAMA_Chat_Bubble--thinking");

                    thinkingBubble.innerHTML = `<details class="LLAMA_Chat_Thinking" open><summary style="display:flex;align-items:center;gap:6px"><div class="CodBiLoader_Spinner LLAMA_ThinkingSpinner"></div><span>${i18nReasoningLabel}</span></summary><div class="LLAMA_Chat_ThinkingContent LLAMA_LiveReasoningContent"></div></details>`;

                    reasoningEl = thinkingBubble.querySelector(".LLAMA_LiveReasoningContent") as HTMLDivElement;
                  }

                  if (reasoningEl) {
                    const isNearBottom =
                      reasoningEl.scrollHeight - reasoningEl.scrollTop - reasoningEl.clientHeight < 40;

                    reasoningEl.innerHTML = linkifyUrls(liveThinking);

                    if (isNearBottom) {
                      reasoningEl.scrollTop = reasoningEl.scrollHeight;
                      chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                  }

                  return;
                }
                // #endregion Live-Reasoning.
                if (text.length > lastText.length) {
                  lastText = text;

                  if (thinkingBubble) {
                    thinkingBubble.parentElement?.remove();

                    thinkingBubble = null;
                    streamBubble = appendBubble(text, "llama");
                  } else if (streamBubble) {
                    streamBubble.innerHTML = linkifyUrls(text);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                  } else {
                    const searchInd = chatContainer.querySelector(".LLAMA_SearchIndicator");

                    if (searchInd?.parentElement) {
                      searchInd.parentElement.remove();
                    }

                    streamBubble = appendBubble(text, "llama");
                  }
                }

                if (pollResponse.done) {
                  // If the model's output is a CALL: tool invocation, the backend will handle
                  // the tool call and start a new inference round. Don't finish streaming —
                  // keep polling for the real final answer.
                  // Use ^CALL: (starts-with) so a final answer that merely mentions "CALL:" in
                  // its body doesn't suppress finishStreaming forever.
                  if (/^CALL:/.test(text)) {
                    lastText = "";
                    return;
                  }
                  clearInterval(interval);
                  const searchInd = chatContainer.querySelector(".LLAMA_SearchIndicator");

                  if (searchInd?.parentElement) {
                    searchInd.parentElement.remove();
                  }

                  if (pollResponse.error) {
                    if (streamBubble) {
                      streamBubble.textContent = `\u26A0 ${pollResponse.error}`;

                      streamBubble.classList.add("LLAMA_Chat_Bubble--error");
                    } else {
                      replaceThinking(`${modelLabel}: \u26A0 ${pollResponse.error}`);
                    }

                    conversationHistory.pop();
                  } else if (lastText) {
                    const searchOn = searchCheckbox ? searchCheckbox.checked : true;
                    const assistantEntry = {
                      role: "assistant",
                      content: searchOn ? stripLinksForHistory(lastText) : lastText,
                    };

                    conversationHistory.push(assistantEntry);
                    // #region Confidence: selective caching + uncertain token highlighting
                    const confidence:
                      | {
                          mean?: number;
                          uncertainTokens?: { t: string; lp: number; o: number }[];
                          logprobRepetition?: boolean;
                        }
                      | undefined = pollResponse.confidence;
                    const isLowConfidence = confidence?.mean != null && confidence.mean < LOW_CONFIDENCE_THRESHOLD;

                    if (isLowConfidence) {
                      lowConfidenceEntries.add(assistantEntry);
                    }

                    if (showUncertainTokens && confidence?.uncertainTokens?.length && streamBubble) {
                      let markedText = lastText;
                      const sorted = [...confidence.uncertainTokens].sort(
                        (a: { o: number }, b: { o: number }) => b.o - a.o,
                      );

                      for (const tok of sorted) {
                        const end = tok.o + tok.t.length;

                        if (end <= markedText.length) {
                          markedText = `${markedText.substring(0, tok.o)}\uFFF9\uFFFB${tok.lp.toFixed(2)}\uFFFC${markedText.substring(tok.o, end)}\uFFFA${markedText.substring(end)}`;
                        }
                      }

                      let html = linkifyUrls(markedText);

                      html = html.replace(
                        /\uFFF9\uFFFB([^\uFFFC]*)\uFFFC/g,
                        (_, lp) => `<span class="LLAMA_UncertainSpan" title="${uncertainText} (${lp})">`,
                      );
                      html = html.replace(/\uFFFA/g, "</span>");
                      streamBubble.innerHTML = html;
                    }
                    // #endregion Confidence: selective caching + uncertain token highlighting
                    // #region Collapse reasoning, if available.
                    const thinkingText: string | undefined = pollResponse.thinking;

                    if (thinkingText && streamBubble) {
                      const details = document.createElement("details");

                      details.className = "LLAMA_Chat_Thinking";

                      const summary = document.createElement("summary");
                      const hasSearchSources = /\uD83D\uDD0D Searching the web/.test(thinkingText);
                      const hasRealReasoning = thinkingText.includes("---\n\n\uD83D\uDD0D") || !hasSearchSources;

                      summary.textContent = hasRealReasoning ? i18nShowReasoningLabel : i18nShowSourcesLabel;
                      details.appendChild(summary);

                      const pre = document.createElement("div");

                      pre.className = "LLAMA_Chat_ThinkingContent";
                      pre.innerHTML = linkifyUrls(thinkingText);

                      details.appendChild(pre);
                      streamBubble.appendChild(details);
                    }
                    // #endregion Collapse reasoning, if available.
                    if (aiHintText && streamBubble) {
                      AI_LLAMA_CHAT.attachAiHintToBubble(streamBubble, aiHintText);
                    }
                    // #region Create Model-Type indicator badge.
                    const modelType: string | undefined = pollResponse.modelType;

                    if (thinkingCheckbox && modelType && streamBubble) {
                      const badge = document.createElement("span");

                      badge.className = "LLAMA_ModelBadge";
                      badge.textContent = modelType === "thinking" ? "\uD83D\uDCA1" : "\u26A1";
                      badge.title = modelType === "thinking" ? "Thinking model" : "Fast model";

                      streamBubble.insertBefore(badge, streamBubble.firstChild);
                    }
                    // #endregion Create Model-Type indicator badge.
                    // #region Add copy button to response bubble.
                    if (streamBubble) {
                      const responseText = lastText;
                      const reasoningText: string = thinkingText || "";
                      const toolbar = document.createElement("div");

                      toolbar.className = "LLAMA_Chat_BubbleToolbar LLAMA_Chat_BubbleToolbar--right";

                      const copyBtn = document.createElement("button");

                      copyBtn.type = "button";
                      copyBtn.className = "LLAMA_Chat_ToolbarBtn";
                      copyBtn.title = "Copy response";
                      copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>`;
                      copyBtn.addEventListener("click", () => {
                        let md = `## ${i18nCopyResponseLabel}\n\n${responseText}`;

                        if (reasoningText) {
                          md += `\n\n---\n\n## ${i18nCopyReasoningLabel}\n\n${reasoningText}`;
                        }

                        copyToClipboard(md);
                        streamBubble.classList.remove("LLAMA_flash");

                        void streamBubble.offsetWidth;

                        streamBubble.classList.add("LLAMA_flash");
                      });

                      toolbar.appendChild(copyBtn);
                      streamBubble.appendChild(toolbar);
                    }
                    // #endregion Add copy button to response bubble.
                    // #region Low-confidence warning + Rethink button
                    const currentModelType: string | undefined = pollResponse.modelType;

                    if (isLowConfidence && streamBubble) {
                      const warning = document.createElement("div");

                      warning.className = "LLAMA_Chat_ConfidenceWarning";
                      warning.textContent = `\u26A0 ${lowConfidenceText}`;

                      if (thinkingCheckbox && !thinkingCheckbox.disabled && currentModelType !== "thinking") {
                        const rethinkQuestion = message;
                        const targetRow = streamBubble.parentElement;

                        if (!targetRow) {
                          return;
                        }
                        const rethinkBtn = document.createElement("button");

                        rethinkBtn.type = "button";
                        rethinkBtn.className = "LLAMA_Chat_RethinkBtn";
                        rethinkBtn.textContent = `\uD83D\uDCA1 ${rethinkButtonText}`;

                        rethinkBtn.addEventListener("click", () => {
                          rethinkBtn.disabled = true;
                          rethinkBtn.textContent = "\u23F3";
                          // #region Create rethink thinking bubble
                          const rethinkRow = document.createElement("div");

                          rethinkRow.className = "LLAMA_Chat_Row LLAMA_Chat_Row--llama";

                          const rethinkBubble = document.createElement("div");

                          rethinkBubble.className =
                            "LLAMA_Chat_Bubble LLAMA_Chat_Bubble--llama LLAMA_Chat_Bubble--thinking";
                          rethinkBubble.innerHTML =
                            '<div class="CodBiLoader_Spinner LLAMA_ThinkingSpinner"></div>' +
                            '<span class="LLAMA_ThinkingLabel">Rethinking\u2026</span>';

                          rethinkRow.appendChild(rethinkBubble);
                          targetRow.insertAdjacentElement("afterend", rethinkRow);
                          chatContainer.scrollTop = chatContainer.scrollHeight;
                          // #endregion Create rethink thinking bubble
                          // #region Send rethink request
                          const rethinkHeaders: Record<string, string> = {
                            "X-Question-chat": utf8ToBase64(rethinkQuestion.replace(/[\r\n]+/g, " ").trim()),
                            "X-Stream": "true",
                            "X-Session-Id": pageSessionId,
                            "X-Chat-History": utf8ToBase64(JSON.stringify(compactHistory())),
                            "X-Thinking": "true",
                          };

                          if (responseLang) {
                            rethinkHeaders["X-Forced-Language"] = responseLang;
                          }
                          if (specialist) {
                            rethinkHeaders["X-Specialist"] = specialist;
                          }

                          if (searchCheckbox) {
                            rethinkHeaders["X-Search"] = searchCheckbox.checked ? "true" : "false";
                          }
                          if (filterResults != null) {
                            rethinkHeaders["X-Filter-Results"] = filterResults ? "true" : "false";
                          }

                          $.ajax({
                            url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
                            type: "POST",
                            data: new FormData(),
                            dataType: "json",
                            processData: false,
                            contentType: false,
                            cache: false,
                            beforeSend: (xhr) => {
                              for (const h of Object.keys(rethinkHeaders)) {
                                xhr.setRequestHeader(h, rethinkHeaders[h]);
                              }
                            },
                            success: (rethinkResp) => {
                              if (rethinkResp.error || !rethinkResp.streamId) {
                                rethinkBubble.textContent = `\u26A0 ${rethinkResp.error || "No stream received"}`;
                                rethinkBubble.classList.add("LLAMA_Chat_Bubble--error");
                                rethinkBubble.classList.remove("LLAMA_Chat_Bubble--thinking");

                                return;
                              }

                              let rethinkText = "";
                              // #region Poll rethink stream
                              const rethinkInterval = setInterval(() => {
                                $.ajax({
                                  url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
                                  type: "POST",
                                  dataType: "json",
                                  processData: false,
                                  contentType: false,
                                  cache: false,
                                  beforeSend: (xhr) => {
                                    xhr.setRequestHeader("X-Stream-Poll", rethinkResp.streamId);
                                  },
                                  success: (poll) => {
                                    const txt = typeof poll.text === "string" ? poll.text : "";

                                    if (txt.length > rethinkText.length) {
                                      rethinkText = txt;
                                      rethinkBubble.classList.remove("LLAMA_Chat_Bubble--thinking");
                                      rethinkBubble.innerHTML = linkifyUrls(txt);
                                      chatContainer.scrollTop = chatContainer.scrollHeight;
                                    }

                                    if (poll.done) {
                                      clearInterval(rethinkInterval);

                                      if (poll.error) {
                                        rethinkBubble.textContent = `\u26A0 ${poll.error}`;
                                        rethinkBubble.classList.add("LLAMA_Chat_Bubble--error");
                                      } else if (rethinkText) {
                                        conversationHistory.push({
                                          role: "assistant",
                                          content: rethinkText,
                                        });

                                        const badge = document.createElement("span");

                                        badge.className = "LLAMA_ModelBadge";
                                        badge.textContent = "\uD83D\uDCA1";
                                        badge.title = "Thinking model (rethink)";
                                        rethinkBubble.insertBefore(badge, rethinkBubble.firstChild);

                                        if (aiHintText) {
                                          AI_LLAMA_CHAT.attachAiHintToBubble(rethinkBubble, aiHintText);
                                        }

                                        const rethinkThinking: string | undefined = poll.thinking;

                                        if (rethinkThinking) {
                                          const det = document.createElement("details");

                                          det.className = "LLAMA_Chat_Thinking";

                                          const sum = document.createElement("summary");

                                          sum.textContent = i18nShowReasoningLabel;
                                          det.appendChild(sum);

                                          const pre = document.createElement("div");

                                          pre.className = "LLAMA_Chat_ThinkingContent";
                                          pre.innerHTML = linkifyUrls(rethinkThinking);
                                          det.appendChild(pre);
                                          rethinkBubble.appendChild(det);
                                        }
                                      }
                                    }
                                  },
                                  error: () => {
                                    clearInterval(rethinkInterval);
                                    rethinkBubble.textContent = "\u26A0 Rethink polling failed.";
                                    rethinkBubble.classList.add("LLAMA_Chat_Bubble--error");
                                    rethinkBubble.classList.remove("LLAMA_Chat_Bubble--thinking");
                                  },
                                });
                              }, 250);
                              // #endregion Poll rethink stream
                            },
                            error: () => {
                              rethinkBubble.textContent = "\u26A0 Rethink request failed.";
                              rethinkBubble.classList.add("LLAMA_Chat_Bubble--error");
                              rethinkBubble.classList.remove("LLAMA_Chat_Bubble--thinking");
                            },
                          });
                          // #endregion Send rethink request
                        });

                        warning.appendChild(rethinkBtn);
                      }

                      streamBubble.appendChild(warning);
                    }
                    // #endregion Low-confidence warning + Rethink button
                  } else {
                    replaceThinking("\u26A0 No response was generated. Please try again.");
                    conversationHistory.pop();
                  }
                  // #region Auto-mail forward (client-driven)
                  if (mailForwardCheckbox?.checked && mailAddressInput?.value.trim() && lastText) {
                    const mailTo = mailAddressInput.value.trim();
                    const mailSubject = message
                      .replace(/[\r\n]+/g, " ")
                      .trim()
                      .substring(0, 120);
                    const thinkingContent: string | undefined = pollResponse.thinking;
                    let mailBody = lastText;

                    if (thinkingContent) {
                      mailBody += `\n\n---\nReasoning:\n${thinkingContent}`;
                    }
                    const mailHeaders: Record<string, string> = {
                      "X-Mail-Forward": utf8ToBase64(mailTo),
                      "X-Mail-Subject": utf8ToBase64(mailSubject),
                      "X-Mail-Body": utf8ToBase64(mailBody),
                      "X-Session-Id": pageSessionId,
                    };

                    $.ajax({
                      url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
                      type: "POST",
                      data: new FormData(),
                      dataType: "json",
                      processData: false,
                      contentType: false,
                      cache: false,
                      beforeSend: (xhr) => {
                        for (const h of Object.keys(mailHeaders)) {
                          xhr.setRequestHeader(h, mailHeaders[h]);
                        }
                      },
                      success: (mailResp) => {
                        if (mailResp.success) {
                          appendBubble(`\u2709\uFE0F \u2192 ${mailTo} \u2705`, "system");
                        } else {
                          appendBubble(`\u26A0 \u2709\uFE0F \u2192 ${mailTo} \u274C ${mailResp.error ?? ""}`, "system");
                        }
                      },
                      error: () => {
                        appendBubble(`\u26A0 \u2709\uFE0F \u2192 ${mailTo} \u274C Request failed`, "system");
                      },
                    });
                  }
                  // #endregion Auto-mail forward (client-driven)

                  finishStreaming();
                }
              },
              error: () => {
                clearInterval(interval);
                replaceThinking(`${modelLabel}: \u26A0 Stream polling failed.`);
                finishStreaming();
              },
            });
          }, 250);
        };
        // #endregion Poll a streaming session until done.
        // #region Send AJAX request to backend.
        $.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
          type: "POST",
          data: formData,
          dataType: "json",
          processData: false,
          contentType: false,
          cache: false,
          beforeSend: (xhr) => {
            for (const headerName of Object.keys(headers)) {
              xhr.setRequestHeader(headerName, headers[headerName]);
            }
          },
          success: (response) => {
            if (response.error) {
              replaceThinking(`${modelLabel}: \u26A0 ${response.error}`);
              conversationHistory.pop();
              finishStreaming();

              return;
            }

            if (response.streamId) {
              activeStreamId = response.streamId;

              if (stopButton) {
                stopButton.disabled = false;
              }

              window.codbi.log("INFO", `Stream started: ${response.streamId}`, "AI / LLAMA / CHAT");

              pollStream(response.streamId);

              return;
            }
            // #region Error-Indicators
            const fileKeys = Object.keys(response);

            if (fileKeys.length === 0) {
              replaceThinking(`${modelLabel}: (no response received)`);
              finishStreaming();
              return;
            }

            let answerText: string;
            if (fileKeys.length === 1) {
              const fileAnswers = response[fileKeys[0]];
              const answerKeys = Object.keys(fileAnswers || {});

              answerText =
                fileAnswers?.chat ?? (answerKeys.length > 0 ? String(fileAnswers[answerKeys[0]]) : "(no answer)");

              const searchOn1 = searchCheckbox ? searchCheckbox.checked : true;

              conversationHistory.push({
                role: "assistant",
                content: searchOn1 ? stripLinksForHistory(answerText) : answerText,
              });
            } else {
              const parts: string[] = [];

              for (const fileKey of fileKeys) {
                const fileAnswers = response[fileKey];
                const answerKeys = Object.keys(fileAnswers || {});
                const answer =
                  fileAnswers?.chat ?? (answerKeys.length > 0 ? String(fileAnswers[answerKeys[0]]) : "(no answer)");
                parts.push(`\u{1F4C4} ${fileKey}:\n${answer}`);
              }

              answerText = parts.join("\n\n");

              const searchOn2 = searchCheckbox ? searchCheckbox.checked : true;

              conversationHistory.push({
                role: "assistant",
                content: searchOn2 ? stripLinksForHistory(answerText) : answerText,
              });
            }
            // #endregion Error-Indicators
            // Replace thinking bubble with the answer
            if (thinkingBubble) {
              thinkingBubble.parentElement?.remove();

              thinkingBubble = null;
            }

            const answerBubble = appendBubble(answerText, "llama");

            if (aiHintText) {
              AI_LLAMA_CHAT.attachAiHintToBubble(answerBubble, aiHintText);
            }

            finishStreaming();
          },
          error: (xhr, status, error) => {
            replaceThinking(`${modelLabel}: \u26A0 Request failed (${status}): ${error}`);

            window.codbi.log("ERROR", `Chat request failed: ${status} — ${error}`, "AI / LLAMA / CHAT");

            conversationHistory.pop();

            finishStreaming();
          },
        });
        // #endregion Send AJAX request to backend.
      } catch (X) {
        replaceThinking(`${modelLabel}: \u26A0 Error: ${X}`);

        conversationHistory.pop();

        isBusy = false;
        sendButton.disabled = false;

        if (micButton) {
          micButton.disabled = false;
        }

        if ("disabled" in chatInput) {
          (chatInput as HTMLInputElement).disabled = false;
        }
      }
    };
    // #endregion EH / Send message
    // #region Connect event listeners.
    sendButton.addEventListener("click", () => {
      sendMessage();
    });
    // #region Stop button.
    if (stopButton) {
      stopButton.disabled = true;

      stopButton.addEventListener("click", () => {
        if (!activeStreamId) {
          return;
        }

        const idToStop = activeStreamId;

        window.codbi.log("INFO", `Stop requested for stream: ${idToStop}`, "AI / LLAMA / CHAT");

        $.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
          type: "POST",
          dataType: "json",
          processData: false,
          contentType: false,
          cache: false,
          beforeSend: (xhr) => {
            xhr.setRequestHeader("X-Stream-Poll", idToStop);
            xhr.setRequestHeader("X-Stream-Stop", "true");
          },
        });
      });
    }
    // #endregion Stop button.
    // #region Chat-Input.
    chatInput.addEventListener("keydown", ((event: KeyboardEvent) => {
      const isTextarea = chatInput instanceof HTMLTextAreaElement;

      if (event.key === "Enter" && (isTextarea ? event.ctrlKey : !event.shiftKey)) {
        event.preventDefault();
        sendMessage();
      }
    }) as EventListener);
    // #endregion Chat-Input.
    // #endregion Connect event listeners.
    // #region Model Availability-Check.
    // Disable input and send button until the model is confirmed ready
    chatInput.disabled = true;
    sendButton.disabled = true;
    sendButton.disabled = true;

    if (micButton) {
      micButton.disabled = true;
    }

    const statusBubble = appendBubble("", "system");

    statusBubble.innerHTML = `<div class="CodBiLoader_Spinner LLAMA_ThinkingSpinner"></div><span class="LLAMA_HealthLabel">Loading AI model\u2026</span>`;

    statusBubble.classList.add("LLAMA_Chat_Bubble--thinking");

    const setHealthLabel = (text: string) => {
      const label = statusBubble.querySelector(".LLAMA_HealthLabel");

      if (label) {
        label.textContent = text;
      }
    };

    const welcomeText =
      toLoad.welcometext != null ? String(toLoad.welcometext) : "Chat ready. Attach file(s) and type your question.";

    const waitingText = toLoad.waitingtext != null ? String(toLoad.waitingtext) : "Waiting for AI server\u2026";

    const lowConfidenceText = toLoad.lowconfidencetext != null ? String(toLoad.lowconfidencetext) : "Low Confidence";

    const rethinkButtonText = toLoad.rethinkbuttontext != null ? String(toLoad.rethinkbuttontext) : "Rethink";

    const uncertainText = toLoad.uncertaintext != null ? String(toLoad.uncertaintext) : "Low confidence";

    const showUncertainTokens = toLoad.showuncertaintokens == null || String(toLoad.showuncertaintokens) !== "false";

    /** Whether the queue-position badge is enabled. Starts from plugin property; toLoad overrides. */
    let queueBadgeEnabled = false;
    const queueBadgeOverride: boolean | null = toLoad.queuebadge != null ? String(toLoad.queuebadge) !== "false" : null;
    const queueText: string = toLoad.queuetext != null ? String(toLoad.queuetext) : "";

    /** Mean logprob threshold below which a response is considered low-confidence. */
    const LOW_CONFIDENCE_THRESHOLD = -2.5;

    const showReady = (modelName?: string, thinkingModelName?: string) => {
      statusBubble.classList.remove("LLAMA_Chat_Bubble--thinking");

      const name = modelName || "AI";
      const thinkingInfo = thinkingModelName ? ` + \u{1F4A1} ${thinkingModelName}` : "";

      statusBubble.innerHTML = `\u{1F4AC} ${name}${thinkingInfo} ${welcomeText}`;
      chatInput.disabled = false;
      sendButton.disabled = false;

      if (micButton) {
        micButton.disabled = false;
      }
      // #region Disable Thinking-Checkbox if thinking unavailable.
      if (!thinkingModelName && thinkingCheckbox && thinkingCheckbox.checked) {
        thinkingCheckbox.disabled = true;
        thinkingCheckbox.title = "Thinking model not available on this server";
      }
      // #endregion Disable Thinking-Checkbox if thinking unavailable.
      chatInput.focus();
    };
    /**
     * Display an error message in the status bubble.
     *
     * @param msg The error message to display. */
    const showError = (msg: string) => {
      statusBubble.classList.remove("LLAMA_Chat_Bubble--thinking");

      statusBubble.innerHTML = `\u26A0 ${msg}`;

      statusBubble.classList.add("LLAMA_Chat_Bubble--error");
    };
    // #region Periodically poll the backend to check if the model is ready, and update the status bubble accordingly.
    const healthCheck = setInterval(() => {
      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
        type: "POST",
        dataType: "json",
        processData: false,
        contentType: false,
        cache: false,
        beforeSend: (xhr) => {
          xhr.setRequestHeader("X-Health-Check", "true");
          if (specialist) {
            xhr.setRequestHeader("X-Specialist", specialist);
          }
        },
        success: (response) => {
          if (response.error) {
            const msg = String(response.error);

            if (/not ready|downloading|loading/i.test(msg)) {
              setHealthLabel(msg);
            } else {
              clearInterval(healthCheck);
              showError(msg);
            }
          } else if (response.pendingThinkingModel) {
            showReady(response.model);
          } else {
            clearInterval(healthCheck);
            showReady(response.model, response.thinkingModel);
          }
          // Pick up queue-badge setting from plugin property (toLoad override takes precedence).
          if (response.queueBadge != null && queueBadgeOverride == null) {
            queueBadgeEnabled = !!response.queueBadge;
          }
        },
        error: () => {
          setHealthLabel(waitingText);
        },
      });
    }, 3000);
    // #endregion Periodically poll the backend to check if the model is ready, and update the status bubble accordingly.
    // #region Immediately poll the backend to check if the model is ready, and update the status bubble accordingly.
    setTimeout(() => {
      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
        type: "POST",
        dataType: "json",
        processData: false,
        contentType: false,
        cache: false,
        beforeSend: (xhr) => {
          xhr.setRequestHeader("X-Health-Check", "true");
          if (specialist) {
            xhr.setRequestHeader("X-Specialist", specialist);
          }
        },
        success: (response) => {
          if (!response.error) {
            clearInterval(healthCheck);
            showReady(response.model, response.thinkingModel);
          }
        },
      });
    }, 100);
    // #endregion Immediately poll the backend to check if the model is ready, and update the status bubble accordingly.
    window.codbi.log("INFO", "Llama Chat functionality initialized", "AI / LLAMA / CHAT");
  }
  // #region PDF.js
  private static pdfJsWorkerConfigured = false;
  /** Ensures that the PDF.js worker is configured. This is necessary for PDF.js to function correctly in a web environment. */
  private static ensurePdfJsWorkerConfigured(): void {
    if (AI_LLAMA_CHAT.pdfJsWorkerConfigured) {
      return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.codbi.baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.worker.min.js`;

    AI_LLAMA_CHAT.pdfJsWorkerConfigured = true;

    window.codbi.log(
      "INFO",
      `PDF.js worker configured: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`,
      "AI / LLAMA / CHAT",
    );
  }
  // #endregion PDF.js
  // #region Chat-Bubble CSS
  /** Injects global CSS for the speech-bubble chat UI (once). */
  private static ensureChatBubbleStyles(): void {
    if (document.querySelector("#LLAMA_Chat_Bubble_Styles")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "LLAMA_Chat_Bubble_Styles";
    style.textContent = `
      .LLAMA_Chat_Container { --user-bubble-bg: #0b93f6 ; --llama-bubble-bg: #e5e5ea ; display: flex ;
                              flex-direction: column ; gap: 10px ; padding: 12px ; overflow-y: auto ; min-height: 120px ;
                              max-height: 500px ; border: 1px solid #d0d0d0 ; border-radius: 8px ; background: #f5f5f5 ;
                              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif ; font-size: 14px ;
                              line-height: 1.45 ;}
      
      .LLAMA_Chat_Row         { display: flex ; overflow: visible ;}
      .LLAMA_Chat_Row--user   { justify-content: flex-end ;}
      .LLAMA_Chat_Row--llama  { justify-content: flex-start ;}
      .LLAMA_Chat_Row--system { justify-content: center ;}

      .LLAMA_Chat_Bubble        { max-width: 75% ; padding: 10px 14px ; border-radius: 16px ; word-wrap: break-word ;
                                  white-space: pre-wrap ; position: relative ; box-shadow: 0 0 .25em black ;}
      .LLAMA_Chat_Bubble--user  { background: var(--user-bubble-bg) ; color: #fff ; border-bottom-right-radius: 4px ;}
      .LLAMA_Chat_Bubble--llama { background: var(--llama-bubble-bg) ; color: #1c1c1e ; border-bottom-left-radius: 4px ;}

      .LLAMA_Chat_BubbleToolbar         { position: absolute ; top: -10px ; left: -8px ; display: flex ; gap: 4px ; opacity: 0 ;
                                          pointer-events: none ; transition: opacity 0.2s ;}
      .LLAMA_Chat_BubbleToolbar--right  { left: auto ; right: -8px ;}

      .LLAMA_Chat_Bubble:hover .LLAMA_Chat_BubbleToolbar { opacity: 1 ; pointer-events: auto ;}

      .LLAMA_Chat_ToolbarBtn        { width: 22px ; height: 22px ; border: 1px solid #ccc ; border-radius: 50% ;
                                      background: #fff ; color: #888 ; cursor: pointer ; display: flex ;
                                      align-items: center ; justify-content: center ; padding: 0 ;
                                      box-shadow: 0 1px 3px rgba( 0, 0, 0, .2 ) ; transition: color 0.15s, background 0.15s ;}
      .LLAMA_Chat_ToolbarBtn:hover  { color: #0b6abf ; background: #e8f0fe ;}

      .LLAMA_Chat_ToolbarBtn--reuse { margin-bottom: 2px ;}

      .LLAMA_ModelBadge { position: absolute ; top: -10px ; left: -6px ; font-size: 12px ; line-height: 1 ; width: 22px ;
                          height: 22px ; display: flex ; align-items: center ; justify-content: center ; background: #fff ;
                          border: 1px solid #ccc ; border-radius: 50% ; box-shadow: 0 1px 3px rgba( 0, 0, 0, .2 );
                          cursor: default ; user-select: none ;}

      .LLAMA_Chat_Bubble--system {  background: transparent ; color: #8e8e93 ; font-size: 12px ; font-style: italic ;
                                    text-align: center ;}

      .LLAMA_Chat_Bubble--thinking { opacity: 0.7 ; font-style: italic ; display: flex ; align-items: center ; gap: 8px ;}

      .LLAMA_ThinkingSpinner          { width: 20px ; height: 20px ; flex-shrink: 0 ;}
      .LLAMA_ThinkingSpinner::before  { display: none ;}

      .LLAMA_ThinkingLabel { line-height: 20px ;}

      .LLAMA_QueueBadge { display: inline-flex ; align-items: center ; gap: 4px ; margin-left: 6px ; padding: 2px 8px ;
                          border-radius: 10px ; background: #d0e0ff ; color: #1a5aab ; font-size: 12px ; font-weight: 600 ;
                          font-style: normal ; white-space: nowrap ; line-height: 18px ;}

      .LLAMA_Chat_Bubble--error { background: #ffe0e0 ; color: #c00 ;}

      .LLAMA_SearchIndicator {  display: flex ; align-items: center ; gap: 8px ; opacity: 0.85 ; font-style: italic ;
                                font-size: 13px ; background: #f0f4ff ; border: 1px dashed #b0c4de ;}

      .LLAMA_SearchLabel { color: #3a6ea5 ; }

      .LLAMA_SearchSpinner { width: 20px ; height: 20px ; flex-shrink: 0 ;}
      
      .LLAMA_SearchSpinner::before { display: none ;}

      .LLAMA_Chat_Thinking { margin-top: 10px ; border-top: 1px solid rgba( 0, 0, 0, 0.1 ); padding-top: 6px ; font-size: 12px ;}

      .LLAMA_Chat_Thinking summary        { cursor: pointer ; color: #666 ; font-style: italic ; user-select: none ;
                                            font-size: 11px ;}
      .LLAMA_Chat_Thinking summary:hover  { color: #333 ; }

      .LLAMA_Chat_ThinkingContent { margin-top: 6px ; padding: 8px ; background: rgba( 0, 0, 0, 0.04 ); border-radius: 6px ;
                                    white-space: pre-wrap ; word-break: break-word ; color: #555 ; font-size: 12px ;
                                    line-height: 1.5 ; max-height: 300px ; overflow-y: auto ;}

      .LLAMA_Chat_AiHint {  display: block ; margin-top: 4px ; font-size: 10px ; color: rgba( 0, 0, 0, 0.35 );
                            text-align: right ; user-select: none ;}

      .LLAMA_Chat_CodeBlock { margin: 8px 0 ; border-radius: 8px ; overflow: hidden ; background: #1e1e1e ; color: #d4d4d4 ;}

      .LLAMA_Chat_CodeHeader {  display: flex ; align-items: center ; justify-content: space-between ; padding: 4px 12px ;
                                background: #2d2d2d ; font-size: 11px ; color: #999 ;}

      .LLAMA_Chat_CodeLang { text-transform: uppercase ; letter-spacing: 0.5px ;}

      .LLAMA_Chat_CodeCopyBtn { border: none ; background: transparent ; color: #999 ; cursor: pointer ; padding: 2px 4px ;
                                border-radius: 4px ; display: flex ; align-items: center ;
                                transition: color 0.15s, background 0.15s ;}

      .LLAMA_Chat_CodeCopyBtn:hover { color: #fff ; background: rgba(255,255,255,0.1) ;}

      .LLAMA_Chat_CodePre { margin: 0 ; padding: 12px ; overflow-x: auto ;
                            font-family: 'Cascadia Code', 'Fira Code', 'Consolas', 'Monaco', monospace ; font-size: 13px ;
                            line-height: 1.5 ; white-space: pre ;}

      .LLAMA_Chat_CodePre code { font-family: inherit ; background: none ; padding: 0 ;}

      .LLAMA_Chat_InlineCode {  background: rgba( 0, 0, 0, 0.07 ); padding: 1px 5px ; border-radius: 4px ;
                                font-family: 'Cascadia Code', 'Fira Code', 'Consolas', 'Monaco', monospace ; font-size: 0.9em ;}

      .LLAMA_Chat_Bubble a { color: inherit ; text-decoration: underline ; word-break: break-all ;}

      .LLAMA_Chat_Bubble--user a  { color: #fff ;}
      .LLAMA_Chat_Bubble--llama a { color: #0b6abf ;}
      .LLAMA_Chat_Bubble a:hover  { text-decoration-thickness: 2px ;}

      .LLAMA_Chat_SourceBadge       { display: inline-flex ; align-items: center ; padding: 2px 10px ; border-radius: 12px ;
                                      background: rgba( 11, 106, 191, 0.1) ; font-size: 12px ; transition: background 0.15s ;}
      .LLAMA_Chat_SourceBadge:hover { background: rgba( 11, 106, 191, 0.2 );}

      .LLAMA_Chat_SourceBadge a       { color: #0b6abf ; text-decoration: none ; word-break: normal ;}
      .LLAMA_Chat_SourceBadge a:hover { text-decoration: underline ;}

      .LLAMA_Chat_PhoneBadge,
      .LLAMA_Chat_EmailBadge {  display: inline-flex ; align-items: center ; gap: 4px ; padding: 2px 10px ; border-radius: 12px ;
                                font-size: 12px ; transition: background 0.15s ;}

      .LLAMA_Chat_PhoneBadge        { background: rgba( 40, 167, 69, 0.12 );}
      .LLAMA_Chat_PhoneBadge:hover  { background: rgba( 40, 167, 69, 0.22 );}

      .LLAMA_Chat_EmailBadge        { background: rgba( 220, 130, 0, 0.12 );}
      .LLAMA_Chat_EmailBadge:hover  { background: rgba( 220, 130, 0, 0.22 );}

      .LLAMA_Chat_PhoneBadge a { color: #28a745 ; text-decoration: none ; word-break: normal ;}
      .LLAMA_Chat_EmailBadge a { color: #c27800 ; text-decoration: none ; word-break: normal ;}

      .LLAMA_Chat_PhoneBadge a:hover,
      .LLAMA_Chat_EmailBadge a:hover { text-decoration: underline ;}

      .LLAMA_Chat_BadgeIcon { font-size: 13px ; line-height: 1 ;}

      .LLAMA_Chat_InputWrapper { position: relative ; display: inline-block ; width: 100% ; overflow: visible ;}

      .LLAMA_input_flare {  animation: LLAMA_rect_flare 2s ease-out infinite ; animation-duration: 1s ;
                            animation-iteration-count: 1 ;}
      @keyframes LLAMA_rect_flare {
        0%   { box-shadow: 0 0 0 0 rgba( 25, 118, 210, 0.8 ),
                           0 0 0 0 rgba( 25, 118, 210, 0.6 ),
                           0 0 0 0 rgba( 25, 118, 210, 0.4 );}
        100% { box-shadow: 0 0 0 12px rgba( 25, 118, 210, 0 ),
                           0 0 0 24px rgba( 25, 118, 210, 0 ),
                           0 0 0 36px rgba( 25, 118, 210, 0 );}}

      .LLAMA_Chat_InputWrapper > input,
      .LLAMA_Chat_InputWrapper > textarea { width: 100% ; box-sizing: border-box ; padding-right: 36px !important ;}

      .LLAMA_Chat_MicButton       { position: absolute ; right: 4px ; bottom: 4px ; width: 28px ; height: 28px ; border: none ;
                                    border-radius: 50% ; background: transparent ; color: #888 ; cursor: pointer ;
                                    display: flex ; align-items: center ; justify-content: center ; padding: 0 ;
                                    transition: color 0.2s, background 0.2s ;}
      .LLAMA_Chat_MicButton:hover { color: #333 ; background: rgba( 0, 0, 0, 0.06 );}

      .LLAMA_Chat_MicButton--recording { color: #fff ; background: #e53935 ; overflow: visible ;}

      .LLAMA_Chat_MicButton--recording::before,
      .LLAMA_Chat_MicButton--recording::after { content: '' ; position: absolute ; top: 50% ; left: 50% ; width: 100% ;
                                                height: 100% ; border-radius: 50% ; border: 2px solid #e53935 ;
                                                transform: translate( -50%, -50% ) scale( 1 );
                                                animation: LLAMA_mic_flare 1.8s ease-out infinite ;}
      .LLAMA_Chat_MicButton--recording::after { animation-delay: 0.6s ;}
      .LLAMA_Chat_MicButton--recording:hover  { background: #c62828 ; color: #fff ;}

      .LLAMA_Chat_MicButton--unavailable { color: #ccc ; cursor: not-allowed ;}
      .LLAMA_Chat_MicButton--transcribing { color: #fff ; background: #1565c0 ; pointer-events: none ; overflow: visible ;}

      .LLAMA_Chat_MicButton--transcribing::before,
      .LLAMA_Chat_MicButton--transcribing::after {  content: '' ; position: absolute ; top: 50% ; left: 50% ; width: 100% ;
                                                    height: 100% ; border-radius: 50% ; border: 2px solid #1565c0 ;
                                                    transform: translate( -50%, -50% ) scale( 1 );
                                                    animation: LLAMA_mic_flare 1.8s ease-out infinite ;}
      .LLAMA_Chat_MicButton--transcribing::after { animation-delay: 0.6s ;}

      @keyframes LLAMA_mic_flare {
        0%   { transform: translate(-50%, -50%) scale(1) ; opacity: 0.7 ; }
        100% { transform: translate(-50%, -50%) scale(2.8) ; opacity: 0 ; }}

      /* #region Confidence / logprob styles */
      .LLAMA_Chat_ConfidenceWarning { display: inline-flex ; align-items: center ; gap: 6px ; margin-top: 8px ;
                                      padding: 4px 10px ; border-radius: 12px ; background: rgba( 255, 152, 0, 0.15 );
                                      color: #b36b00 ; font-size: 12px ; line-height: 1 ; user-select: none ;}

      .LLAMA_Chat_RethinkBtn        { border: 1px solid #b36b00 ; border-radius: 10px ; background: transparent ;
                                      color: #b36b00 ; font-size: 11px ; padding: 2px 8px ; cursor: pointer ;
                                      transition: background 0.15s, color 0.15s ;}
      .LLAMA_Chat_RethinkBtn:hover  { background: #b36b00 ; color: #fff ;}

      .LLAMA_UncertainSpan { background: rgba( 255, 152, 0, 0.18 ) ; border-bottom: 1.5px dotted #e6a200 ;
                             border-radius: 2px ; padding: 0 1px ;}
      /* #endregion Confidence / logprob styles */

      @keyframes LLAMA_flash {
        0%   { filter: brightness( 1 ) ; }
        30%  { filter: brightness( 1.35 ) ; }
        100% { filter: brightness( 1 ) ; }}
      .LLAMA_flash { animation: LLAMA_flash 0.35s ease-out ;}`;
    document.head.appendChild(style);
  }
  // #endregion Chat bubble styles
  // #region AI-Generated hint for bubbles.
  /**
   * Appends a small AI-Generated hint label inside a chat bubble.
   *
   * @param bubble   The bubble `<div>` to annotate.
   * @param hintText The label to display, e.g. "✨ AI-Generated". */
  private static attachAiHintToBubble(bubble: HTMLDivElement, hintText: string): void {
    // Remove any existing hint inside this bubble
    const existing = bubble.querySelector(".LLAMA_Chat_AiHint");
    if (existing) {
      existing.remove();
    }

    const hint = document.createElement("span");

    hint.className = "LLAMA_Chat_AiHint";
    hint.textContent = hintText;

    bubble.appendChild(hint);
  }
  // #endregion AI-Generated hint for bubbles.
  // #region Image-Downscaling
  /** Default total-pixel budget (width × height). Matches the backend's default maxPixels (≈ 1792 × 1792). */
  private static readonly DEFAULT_MAX_PIXELS = 3211264;
  /**
   * Converts a canvas to a {@link File} built from raw bytes.
   * Formcycle's multipart parser returns 0 bytes for canvas {@link Blob} objects,
   * so we go through {@link HTMLCanvasElement.toDataURL toDataURL} → base64 decode → {@link ArrayBuffer} → {@link File}.
   *
   * @param canvas    The canvas containing the image to convert.
   * @param fileName  The name to assign to the resulting File.
   *
   * @return A {@link File } containing the image data from the canvas, with the specified file name and "image/png" MIME type.*/
  private static canvasToFile(canvas: HTMLCanvasElement, fileName: string): File {
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new File([bytes.buffer], fileName, { type: "image/png" });
  }
  /**
   * Reads a {@link Blob} (or {@link File}) as a
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs data URL}
   * string ({@code data:<mime>;base64,...}).
   *
   * Used to send image data as a regular text parameter in FormData,
   * bypassing formcycle's multipart file parser which returns 0-byte {@code FileData}.
   *
   * @param blob The Blob or File to read as a data URL.
   *
   * @return A Promise that resolves to a data URL string containing the blob's data. */
  private static blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  /**
   * Downscales an image file if its total pixel count (width × height) exceeds
   * {@link maxPixels}, preserving the aspect ratio. Returns the original file
   * unchanged when it is already within the budget.
   *
   * @param file      The image file to check.
   * @param maxPixels Total-pixel budget (width × height). */
  private static async downscaleImageIfNeeded(file: File, maxPixels: number): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const totalPixels = img.width * img.height;

        if (totalPixels <= maxPixels) {
          URL.revokeObjectURL(img.src);
          resolve(file);

          return;
        }

        const scale = Math.sqrt(maxPixels / totalPixels);
        const newW = Math.max(28, Math.round(img.width * scale));
        const newH = Math.max(28, Math.round(img.height * scale));

        window.codbi.log(
          "INFO",
          `Downscaling ${file.name}: ${img.width}\u00d7${img.height} \u2192 ${newW}\u00d7${newH}`,
          "AI / LLAMA / CHAT",
        );

        const canvas = document.createElement("canvas");

        canvas.width = newW;
        canvas.height = newH;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          URL.revokeObjectURL(img.src);
          resolve(file);

          return;
        }

        ctx.drawImage(img, 0, 0, newW, newH);
        URL.revokeObjectURL(img.src);

        resolve(AI_LLAMA_CHAT.canvasToFile(canvas, file.name));
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(file);
      };

      img.src = URL.createObjectURL(file);
    });
  }
  // #endregion Image-Downscaling
  // #region PDF-Processing
  private static async processPdfFile(file: File, maxPages = 0): Promise<Blob[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf: PDFDocumentProxy = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: Blob[] = [];
    const pagesToProcess = maxPages > 0 ? Math.min(maxPages, pdf.numPages) : pdf.numPages;

    window.codbi.log(
      "INFO",
      `Processing PDF with ${pdf.numPages} page(s), limiting to ${pagesToProcess} page(s): ${file.name}`,
      "AI / LLAMA / CHAT",
    );

    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const textLength = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join("")
        .trim().length;

      if (textLength > 100) {
        window.codbi.log(
          "INFO",
          `PDF page ${pageNum} contains ${textLength} characters of text \u2014 rendering to image`,
          "AI / LLAMA / CHAT",
        );

        const blob = await AI_LLAMA_CHAT.renderPdfPageToImage(page);

        images.push(blob);
      } else {
        window.codbi.log(
          "INFO",
          `PDF page ${pageNum} has minimal text (${textLength} chars) \u2014 attempting image extraction`,
          "AI / LLAMA / CHAT",
        );

        const extractedImages = await AI_LLAMA_CHAT.extractImagesFromPdfPage(page);

        if (extractedImages.length > 0) {
          images.push(...extractedImages);
          window.codbi.log(
            "INFO",
            `Extracted ${extractedImages.length} image(s) from PDF page ${pageNum}`,
            "AI / LLAMA / CHAT",
          );
        } else {
          window.codbi.log(
            "INFO",
            `No extractable images found on page ${pageNum} \u2014 rendering page to image`,
            "AI / LLAMA / CHAT",
          );

          const blob = await AI_LLAMA_CHAT.renderPdfPageToImage(page);

          images.push(blob);
        }
      }
    }

    return images;
  }
  /**
   * Renders a PDF page to an image by drawing it on a canvas and converting the canvas to a PNG file.
   *
   * @param page The PDF page to render.
   *
   * @return A Promise that resolves to a File containing the rendered image of the PDF page. */
  private static async renderPdfPageToImage(page: PDFPageProxy): Promise<File> {
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new CodBiError("Failed to get canvas 2D context");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport: viewport }).promise;

    return AI_LLAMA_CHAT.canvasToFile(canvas, "page.png");
  }
  /**
   * Attempts to extract images from a PDF page by analyzing its operator list for image painting operations.
   * For each detected image operation, it retrieves the image data from the page's resources,
   * draws it onto a canvas, and converts the canvas to a PNG file.
   *
   * @param page The PDF page from which to extract images.
   *
   * @return A Promise that resolves to an array of {@link Blob }s, each containing an extracted image from the PDF page. */
  private static async extractImagesFromPdfPage(page: PDFPageProxy): Promise<Blob[]> {
    const images: Blob[] = [];

    try {
      const operatorList = await page.getOperatorList();

      for (let i = 0; i < operatorList.fnArray.length; i++) {
        const fn = operatorList.fnArray[i];

        if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject) {
          try {
            const imageName = operatorList.argsArray[i][0];

            if (typeof imageName === "string") {
              const resources = await page.objs.get(imageName);

              if (resources?.data) {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                if (ctx && resources.width && resources.height) {
                  canvas.width = resources.width;
                  canvas.height = resources.height;

                  const imageData = new ImageData(
                    new Uint8ClampedArray(resources.data),

                    resources.width,
                    resources.height,
                  );

                  ctx.putImageData(imageData, 0, 0);

                  images.push(AI_LLAMA_CHAT.canvasToFile(canvas, `${imageName}.png`));
                }
              }
            }
          } catch (imgError) {
            window.codbi.log("WARNING", `Failed to extract individual image: ${imgError}`, "AI / LLAMA / CHAT");
          }
        }
      }
    } catch (error) {
      window.codbi.log("WARNING", `Image extraction failed: ${error}`, "AI / LLAMA / CHAT");
    }

    return images;
  }
  // #endregion PDF-Processing
}
// #region Register with CodBi
window.codbi.registerFunctionality("AI.LLAMA.CHAT", AI_LLAMA_CHAT.functionality.bind(AI_LLAMA_CHAT));
// #endregion Register with CodBi
