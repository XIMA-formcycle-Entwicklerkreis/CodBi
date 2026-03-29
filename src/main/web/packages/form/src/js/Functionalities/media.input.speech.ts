// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { IF } from "xdbc/src/DBC/IF";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { TYPE } from "xdbc/src/DBC/TYPE";
// #endregion XDBC
// #endregion Imports
// #region Interfaces
/**
 * A single recognition hypothesis returned by the speech engine.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionAlternative | MDN — SpeechRecognitionAlternative} */
interface SpeechRecognitionAlternative {
  /** The raw transcribed text for this hypothesis. */
  readonly transcript: string;
  /** Confidence score between 0 and 1 indicating how likely the transcript is correct. */
  readonly confidence: number;
}
/**
 * A single recognition result that may contain one or more alternative hypotheses.
 * Implements an array-like interface so alternatives can be accessed by index.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionResult | MDN — SpeechRecognitionResult} */
interface SpeechRecognitionResult {
  /** Whether the engine considers this result final (will not change) or interim (may be refined). */
  readonly isFinal: boolean;
  /** Number of alternative hypotheses available. */
  readonly length: number;
  /** Returns the alternative at the given index. */
  item(index: number): SpeechRecognitionAlternative;
  /** Array-style index access to alternatives. */
  [index: number]: SpeechRecognitionAlternative;
}
/**
 * An ordered list of {@link SpeechRecognitionResult} objects representing all results accumulated during
 * a recognition session.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionResultList | MDN — SpeechRecognitionResultList} */
interface SpeechRecognitionResultList {
  /** Total number of results in the list. */
  readonly length: number;
  /** Returns the result at the given index. */
  item(index: number): SpeechRecognitionResult;
  /** Array-style index access to results. */
  [index: number]: SpeechRecognitionResult;
}
/**
 * Event fired when the speech engine produces recognition results.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionEvent | MDN — SpeechRecognitionEvent} */
interface SpeechRecognitionEvent extends Event {
  /** Index of the first result in {@link results} that changed since the last event. */
  readonly resultIndex: number;
  /** All recognition results accumulated so far in this session. */
  readonly results: SpeechRecognitionResultList;
}
/**
 * Event fired when a speech recognition error occurs (e.g. microphone denied, network failure).
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionErrorEvent | MDN — SpeechRecognitionErrorEvent} */
interface SpeechRecognitionErrorEvent extends Event {
  /** Machine-readable error code (e.g. `"not-allowed"`, `"service-not-available"`, `"no-speech"`). */
  readonly error: string;
  /** Human-readable description of the error. */
  readonly message: string;
}
/**
 * A live speech recognition session created via {@link SpeechRecognitionConstructor}.
 * Mirrors the Web Speech API `SpeechRecognition` instance interface.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition | MDN — SpeechRecognition} */
interface SpeechRecognitionInstance {
  /** When `true`, recognition continues until explicitly stopped (does not auto-stop after a pause). */
  continuous: boolean;
  /** When `true`, interim (non-final) results are delivered via {@link onresult}. */
  interimResults: boolean;
  /** BCP-47 language tag for recognition (e.g. `"en-US"`, `"de-DE"`). Empty string = browser default. */
  lang: string;
  /**
   * Callback invoked when recognition results are available.
   *
   * @param event Contains the recognition results in `event.results`, which is an array of {@link SpeechRecognitionResult} objects. */
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  /** Callback invoked when the recognition service has disconnected. */
  onend: (() => void) | null;
  /**
   * Callback invoked when an error occurs.
   *
   * @param event Contains the error details in `event.error` and `event.message`. */
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  /** Starts the speech recognition service, beginning to listen for audio. */
  start(): void;
  /** Stops the recognition service, returning any final results. */
  stop(): void;
  /** Immediately stops the recognition service, discarding any pending results. */
  abort(): void;
}
/**
 * Constructor type for creating {@link SpeechRecognitionInstance} objects.
 * Resolved at runtime from `window.SpeechRecognition` or `window.webkitSpeechRecognition`. */
interface SpeechRecognitionConstructor {
  /** Creates a new speech recognition session. */
  new (): SpeechRecognitionInstance;
}
// #endregion Interfaces
// #region Augmentations
/** Augment global variables */
declare global {
  /** Augment the {@link window }. */
  interface Window {
    /** The SpeechRecognition constructor, if supported by the browser. */
    SpeechRecognition?: SpeechRecognitionConstructor;
    /** The webkitSpeechRecognition constructor, if supported by the browser. */
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}
// #endregion Augmentations
/**
 * Provides the {@link MEDIA_INPUT_SPEECH.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
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
   * ### Config Parameters:
   * - **VoiceHotkey**: Keyboard shortcut to toggle recording. Default: `Alt+A`.
   * - **Language**:    BCP-47 language tag for recognition (e.g. `de-DE`, `en-US`).
   *                    If omitted, the browser's default language is used.
   * - **Placeholder**: Custom placeholder text for the field. Default: the hotkey
   *                    combo prefixed with a microphone emoji (e.g. `🎙 Alt+A`).
   *                    Only shown when `ShowHint` is `true`.
   * - **ShowHint**:    If set to `true`, shows the hotkey hint as placeholder text.
   *                    Default: `false`.
   *
   * ### Privacy Notice (DSGVO / GDPR):
   * The Web Speech API transmits recorded audio to an external cloud service for
   * speech-to-text processing. The specific service depends on the browser
   * (e.g. Google Cloud for Chrome, Microsoft Azure for Edge). **The audio data
   * leaves the user's device and is processed on third-party servers.**
   *
   * When deploying this functionality, the data controller **must** inform users
   * about this data transfer in a privacy policy (**Datenschutzerklärung**) in
   * accordance with Art. 13 DSGVO. This includes identifying the recipient of the
   * audio data, the purpose of processing, and the legal basis. Failure to do so
   * constitutes a DSGVO violation.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "voicehotkey, language, placeholder")
    @TYPE.PRE("string | boolean", "showhint")
    @REGEX.PRE(REGEX.stdExp.simpleHotkey, "voicehotkey")
    @REGEX.PRE(REGEX.stdExp.bcp47, "language")
    @IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "showhint")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(
      [HTMLInputElement, HTMLTextAreaElement],
      undefined,
      'Is it not an <input type="text"/> or <textarea> that is tagged with this functionality?',
    )
    toProcess: Element,
  ): void {
    const field = toProcess as HTMLInputElement | HTMLTextAreaElement;

    MEDIA_INPUT_SPEECH.ensureStyles();
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
      // #region Auto-resize textarea
      if (field.tagName.toUpperCase() === "TEXTAREA") {
        field.style.height = "auto";
        field.style.height = `${field.scrollHeight}px`;
      }
      // #endregion Auto-resize textarea
    };

    recognition.onend = () => {
      if (isRecording) {
        preRecordingText = field.value;

        try {
          recognition.start();
        } catch (X) {}
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
        } catch (X) {
          isRecording = false;
        }
      }
    };

    micButton.addEventListener("click", toggleRecording);
    // #endregion Speech recognition setup
    // #region Voice Hotkeys-Definition
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

          if (active?.closest(".LLAMA_Chat_InputWrapper") || active?.closest(".MEDIA_Whisper_InputWrapper")) {
            return;
          }

          const focused = MEDIA_INPUT_SPEECH.instances.find((inst) => inst.field === active);

          if (focused) {
            focused.toggle();

            return;
          }

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

    const loaderAnim = inputWrapper.parentElement?.querySelector(
      `.cCodBiLoader[cbFOR="${field.getAttribute("data-name")}"]`,
    );

    if (loaderAnim) {
      loaderAnim.remove();
    }
    // #region Voice Hotkeys-Definition
  }
  // #region Styles
  private static ensureStyles(): void {
    if (document.querySelector("#MEDIA_Speech_Styles")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "MEDIA_Speech_Styles";
    style.textContent = `
      .MEDIA_Speech_InputWrapper { position: relative ; display: inline-block ; width: 100% ;}

      .MEDIA_Speech_InputWrapper > input,
      .MEDIA_Speech_InputWrapper > textarea { width: 100% ; box-sizing: border-box ; padding-right: 36px !important ;}

      .MEDIA_Speech_MicButton       { position: absolute ; right: 4px ; bottom: 4px ; width: 28px ; height: 28px ; border: none ;
                                      border-radius: 50% ; background: transparent ; color: #888 ; cursor: pointer ;
                                      display: flex ; align-items: center ; justify-content: center ; padding: 0 ;
                                      transition: color 0.2s, background 0.2s ;}
      .MEDIA_Speech_MicButton:hover { color: #333 ; background: rgba( 0, 0, 0, 0.06 );}

      .MEDIA_Speech_MicButton--recording { color: #fff ; background: #e53935 ;
        animation: MEDIA_Speech_mic_pulse 1.2s ease-in-out infinite ;}

      .MEDIA_Speech_MicButton--recording:hover { background: #c62828 ; color: #fff ;}

      .MEDIA_Speech_MicButton--unavailable { color: #ccc ; cursor: not-allowed ;}
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
