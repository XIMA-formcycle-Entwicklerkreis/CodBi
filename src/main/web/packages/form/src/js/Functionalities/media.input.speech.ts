// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
// #endregion Imports

// ── Web Speech API type declarations (not in TS dom lib for ES5 target) ──
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

/**
 * Provides the {@link MEDIA_INPUT_SPEECH.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class MEDIA_INPUT_SPEECH {
  /** Registry of all speech-enabled fields and their toggle functions. */
  private static readonly instances: { field: HTMLElement; toggle: () => void }[] = [];
  /** Whether the global hotkey listener has been registered. */
  private static hotkeyRegistered = false;

  /**
   * Adds a microphone button to an `<input type="text">` or `<textarea>` for
   * speech-to-text input via the Web Speech API.
   *
   * ### How it works:
   * 1. Tag the field with the functionality **media.input.speech** in the CodBi designer.
   * 2. A microphone icon appears in the lower-right corner of the field.
   * 3. Clicking the icon (or pressing the hotkey) starts/stops voice recognition.
   * 4. Recognized text is appended to the field value in real time.
   *
   * ### Config Parameters:
   * - **voicehotkey**: Keyboard shortcut to toggle recording. Default: `Alt+A`.
   * - **language**:    BCP-47 language tag for recognition (e.g. `de-DE`, `en-US`).
   *                    If omitted, the browser's default language is used.
   * - **placeholder**: Custom placeholder text for the field. Default: the hotkey
   *                    combo prefixed with a microphone emoji (e.g. `🎙 Alt+A`).
   *                    Only shown when `showhint` is `true`.
   * - **showhint**:    If set to `true`, shows the hotkey hint as placeholder text.
   *                    Default: `false`.
   *
   * ### Privacy Notice (DSGVO / GDPR):
   * The Web Speech API transmits recorded audio to an external cloud service for
   * speech-to-text processing. The specific service depends on the browser
   * (e.g. Google Cloud for Chrome, Microsoft Azure for Edge). **The audio data
   * leaves the user's device and is processed on third-party servers.**
   *
   * When deploying this functionality, the data controller **must** inform users
   * about this data transfer in a privacy policy (Datenschutzerklärung) in
   * accordance with Art. 13 DSGVO. This includes identifying the recipient of the
   * audio data, the purpose of processing, and the legal basis. Failure to do so
   * constitutes a DSGVO violation.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. Must be an `<input type="text">` or `<textarea>`. */
  @DBC.ParamvalueProvider
  public static functionality(
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(
      HTMLElement,
      undefined,
      'Is it not an <input type="text"/> or <textarea> that is tagged with this functionality?',
    )
    toProcess: Element,
  ): void {
    const tagName = (toProcess as HTMLElement).tagName.toUpperCase();
    const inputType = (toProcess as HTMLInputElement).type?.toLowerCase();
    if (tagName !== "TEXTAREA" && !(tagName === "INPUT" && inputType === "text")) {
      window.codbi.log(
        "ERROR",
        `media.input.speech requires an <input type="text"> or <textarea>, got <${tagName.toLowerCase()}${inputType ? ` type="${inputType}"` : ""}>`,
        "MEDIA / INPUT / SPEECH",
      );
      return;
    }

    const field = toProcess as HTMLInputElement | HTMLTextAreaElement;

    // #region Inject styles (once)
    MEDIA_INPUT_SPEECH.ensureStyles();
    // #endregion Inject styles (once)

    // #region Check Speech API availability
    const SpeechRecognitionCtor: SpeechRecognitionConstructor | undefined =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      window.codbi.log(
        "WARNING",
        "Web Speech API not available in this browser — microphone button not added",
        "MEDIA / INPUT / SPEECH",
      );
      return;
    }
    // #endregion Check Speech API availability

    // #region Wrap field and create mic button
    const inputWrapper = document.createElement("div");
    inputWrapper.className = "MEDIA_Speech_InputWrapper";
    field.parentElement?.insertBefore(inputWrapper, field);
    inputWrapper.appendChild(field);

    const micButton = document.createElement("button");
    micButton.type = "button";
    micButton.className = "MEDIA_Speech_MicButton";
    micButton.title = "Voice input";
    micButton.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm-1-9a1 1 0 1 1 2 0v6a1 1 0 1 1-2 0V5zm6 6a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2z"/></svg>`;
    inputWrapper.appendChild(micButton);
    // #endregion Wrap field and create mic button

    // #region Speech recognition setup
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;

    const lang = toLoad.language != null ? String(toLoad.language).trim() : "";
    if (lang) {
      recognition.lang = lang;
    }

    let isRecording = false;
    let preRecordingText = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let sessionFinal = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          sessionFinal += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      field.value = preRecordingText + sessionFinal + interim;
      // Auto-resize textarea
      if (field.tagName.toUpperCase() === "TEXTAREA") {
        field.style.height = "auto";
        field.style.height = `${field.scrollHeight}px`;
      }
    };

    recognition.onend = () => {
      if (isRecording) {
        // Silence-timeout restart: save current value as the new baseline
        preRecordingText = field.value;
        try {
          recognition.start();
        } catch (_e) {
          /* ignore */
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed" || event.error === "service-not-available") {
        micButton.classList.add("MEDIA_Speech_MicButton--unavailable");
        micButton.title = "Microphone access denied";
        micButton.disabled = true;
      }
      isRecording = false;
      micButton.classList.remove("MEDIA_Speech_MicButton--recording");
    };

    const toggleRecording = () => {
      if (micButton.disabled) {
        return;
      }
      if (isRecording) {
        isRecording = false;
        recognition.stop();
        micButton.classList.remove("MEDIA_Speech_MicButton--recording");
        field.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        isRecording = true;
        preRecordingText = field.value;
        if (!lang) {
          recognition.lang = "";
        }
        try {
          recognition.start();
          micButton.classList.add("MEDIA_Speech_MicButton--recording");
        } catch (_e) {
          isRecording = false;
        }
      }
    };

    micButton.addEventListener("click", toggleRecording);
    // #endregion Speech recognition setup

    // #region Voice hotkey
    const hotkeyDef = (typeof toLoad.voicehotkey === "string" && toLoad.voicehotkey.trim()) || "Alt+A";
    const hotkeyParts = hotkeyDef.split("+").map((p: string) => p.trim());
    const hotkeyKey = hotkeyParts[hotkeyParts.length - 1].toUpperCase();
    const needAlt = hotkeyParts.some((p: string) => /^alt$/i.test(p));
    const needCtrl = hotkeyParts.some((p: string) => /^ctrl$/i.test(p));
    const needShift = hotkeyParts.some((p: string) => /^shift$/i.test(p));
    const needMeta = hotkeyParts.some((p: string) => /^meta$/i.test(p));
    micButton.title = `Voice input (${hotkeyDef})`;

    // Register this instance for the global hotkey handler
    MEDIA_INPUT_SPEECH.instances.push({ field, toggle: toggleRecording });

    if (!MEDIA_INPUT_SPEECH.hotkeyRegistered) {
      MEDIA_INPUT_SPEECH.hotkeyRegistered = true;
      document.addEventListener("keydown", (e: KeyboardEvent) => {
        if (
          e.key.toUpperCase() === hotkeyKey &&
          e.altKey === needAlt &&
          e.ctrlKey === needCtrl &&
          e.shiftKey === needShift &&
          e.metaKey === needMeta
        ) {
          e.preventDefault();
          const active = document.activeElement;
          // Skip if the focused element belongs to the chat or Whisper wrapper
          if (active?.closest(".LLAMA_Chat_InputWrapper") || active?.closest(".MEDIA_Whisper_InputWrapper")) {
            return;
          }
          // If a speech-enabled field is focused, toggle only that one
          const focused = MEDIA_INPUT_SPEECH.instances.find((inst) => inst.field === active);
          if (focused) {
            focused.toggle();
            return;
          }
          // Otherwise toggle the first registered instance and focus it
          const first = MEDIA_INPUT_SPEECH.instances[0];
          if (first) {
            first.field.focus();
            first.toggle();
          }
        }
      });
    }

    // Set field placeholder (only if showhint is enabled)
    const showHint = toLoad.showhint != null && String(toLoad.showhint).toLowerCase() === "true";
    if (showHint) {
      field.placeholder =
        (typeof toLoad.placeholder === "string" && toLoad.placeholder.trim()) || `\uD83C\uDF99\uFE0F ${hotkeyDef}`;
    }

    // Remove CodBi loading animation — the framework injects it before calling
    // this method, but wrapping the field in MEDIA_Speech_InputWrapper reparents it,
    // so the framework's own removeLoaderAnim can no longer find the loader.
    // The loader sits in the wrapper's parent (=original parent) with cbFOR matching
    // the field's data-name, so we query and remove it directly.
    const loaderAnim = inputWrapper.parentElement?.querySelector(
      `.cCodBiLoader[cbFOR="${field.getAttribute("data-name")}"]`,
    );
    if (loaderAnim) {
      loaderAnim.remove();
    }
    // #endregion Voice hotkey
  }

  // #region Styles
  private static ensureStyles(): void {
    if (document.querySelector("#MEDIA_Speech_Styles")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "MEDIA_Speech_Styles";
    style.textContent = `
      .MEDIA_Speech_InputWrapper {
        position: relative ; display: inline-block ; width: 100% ;
      }
      .MEDIA_Speech_InputWrapper > input,
      .MEDIA_Speech_InputWrapper > textarea {
        width: 100% ; box-sizing: border-box ; padding-right: 36px ;
      }
      .MEDIA_Speech_MicButton {
        position: absolute ; right: 4px ; bottom: 4px ;
        width: 28px ; height: 28px ; border: none ; border-radius: 50% ;
        background: transparent ; color: #888 ; cursor: pointer ;
        display: flex ; align-items: center ; justify-content: center ;
        padding: 0 ; transition: color 0.2s, background 0.2s ;
      }
      .MEDIA_Speech_MicButton:hover {
        color: #333 ; background: rgba(0,0,0,0.06) ;
      }
      .MEDIA_Speech_MicButton--recording {
        color: #fff ; background: #e53935 ;
        animation: MEDIA_Speech_mic_pulse 1.2s ease-in-out infinite ;
      }
      .MEDIA_Speech_MicButton--recording:hover {
        background: #c62828 ; color: #fff ;
      }
      .MEDIA_Speech_MicButton--unavailable {
        color: #ccc ; cursor: not-allowed ;
      }
      @keyframes MEDIA_Speech_mic_pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(229,57,53,0.5) ; }
        50% { box-shadow: 0 0 0 8px rgba(229,57,53,0) ; }
      }`;
    document.head.appendChild(style);
  }
  // #endregion Styles
}

// #region Register functionality with CodBi
window.codbi.registerFunctionality("MEDIA.INPUT.SPEECH", MEDIA_INPUT_SPEECH.functionality.bind(MEDIA_INPUT_SPEECH));
// #endregion Register functionality with CodBi
