// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #endregion Imports

/**
 * Provides the {@link Media_Input_Speech_Whisper.functionality }.
 *
 * ### DSGVO / GDPR — On-Premise Speech Recognition
 * Unlike the Web Speech API variant ({@link MEDIA.INPUT.SPEECH}), this functionality processes
 * all audio data **locally on the Formcycle server** using a self-hosted
 * [Whisper](https://github.com/openai/whisper) model via
 * [whisper.cpp](https://github.com/ggerganov/whisper.cpp).
 *
 * **No audio data leaves the server.** There is no dependency on Google, Microsoft, OpenAI, or
 * any other cloud provider. This makes it fully DSGVO/GDPR-compliant without requiring additional
 * consent for cloud-based speech processing.
 *
 * ### How it works:
 * 1. The user clicks the microphone button (or presses the hotkey) to start recording.
 * 2. Audio is captured via the browser's `MediaRecorder` API.
 * 3. When the user stops recording, the audio is sent to the CodBi Whisper servlet.
 * 4. The servlet forwards the audio to a local `whisper-server` process for transcription.
 * 5. The transcribed text is inserted into the field.
 *
 * ### Difference from `MEDIA.INPUT.SPEECH`:
 * | Feature               | `MEDIA.INPUT.SPEECH`         | `MEDIA.INPUT.SPEECH.WHISPER`    |
 * |-----------------------|------------------------------|---------------------------------|
 * | Processing            | Browser cloud API (real-time) | Local server (batch)            |
 * | Data leaves device?   | Yes (cloud)                  | No (localhost only)             |
 * | DSGVO consent needed? | Yes (Art. 13)                | No                              |
 * | Real-time interim?    | Yes                          | No (transcription after stop)   |
 * | Browser support       | Chrome, Edge (limited)       | All modern browsers             |
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Media_Input_Speech_Whisper {
  /** Registry of all Whisper-enabled fields and their toggle functions. */
  private static readonly instances: { field: HTMLElement; toggle: () => void }[] = [];
  /** Whether the global hotkey listener has been registered. */
  private static hotkeyRegistered = false;
  /** Whether the server supports arbitrary audio formats (ffmpeg available). Defaults to true (optimistic). */
  private static convertSupported = true;
  /** Whether the health-check has been performed. */
  private static healthChecked = false;

  /**
   * Adds a microphone button to an `<input type="text">` or `<textarea>` for
   * speech-to-text input via a self-hosted Whisper model on the Formcycle server.
   *
   * ### Config Parameters:
   * - **voicehotkey**: Keyboard shortcut to toggle recording. Default: `Alt+A`.
   * - **language**:    Two-letter language code for Whisper (e.g. `de`, `en`, `fr`).
   *                    If omitted, Whisper auto-detects the language.
   * - **placeholder**: Custom placeholder text for the field.
   *                    Only shown when `showhint` is `true`.
   * - **showhint**:    If set to `true`, shows the hotkey hint as placeholder text.
   *                    Default: `false`.
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
        `media.input.speech.whisper requires an <input type="text"> or <textarea>, got <${tagName.toLowerCase()}${inputType ? ` type="${inputType}"` : ""}>`,
        "MEDIA / INPUT / SPEECH / WHISPER",
      );
      return;
    }

    const field = toProcess as HTMLInputElement | HTMLTextAreaElement;

    // #region Inject styles (once)
    Media_Input_Speech_Whisper.ensureStyles();
    // #endregion Inject styles (once)

    // #region Wrap field and create mic button
    const inputWrapper = document.createElement("div");
    inputWrapper.className = "MEDIA_Whisper_InputWrapper";
    field.parentElement?.insertBefore(inputWrapper, field);
    inputWrapper.appendChild(field);

    const micButton = document.createElement("button");
    micButton.type = "button";
    micButton.className = "MEDIA_Whisper_MicButton";
    micButton.title = "Voice input (Whisper)";
    micButton.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm-1-9a1 1 0 1 1 2 0v6a1 1 0 1 1-2 0V5zm6 6a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2z"/></svg>`;
    inputWrapper.appendChild(micButton);
    // #endregion Wrap field and create mic button

    // #region Resolve the plugin servlet URL
    const pluginUrl = Media_Input_Speech_Whisper.resolvePluginUrl();
    if (!pluginUrl) {
      window.codbi.log(
        "ERROR",
        "Could not resolve CodBi plugin servlet URL for Whisper",
        "MEDIA / INPUT / SPEECH / WHISPER",
      );
      micButton.classList.add("MEDIA_Whisper_MicButton--unavailable");
      micButton.title = "Whisper endpoint not available";
      micButton.disabled = true;
      return;
    }
    // #endregion Resolve the plugin servlet URL

    // #region Health-check (query convertSupported once)
    if (!Media_Input_Speech_Whisper.healthChecked) {
      Media_Input_Speech_Whisper.healthChecked = true;
      Media_Input_Speech_Whisper.queryHealthCheck(pluginUrl);
    }
    // #endregion Health-check

    // #region Language
    const lang = toLoad.language != null ? String(toLoad.language).trim() : "";
    // #endregion Language

    // #region MediaRecorder setup
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let isRecording = false;
    let isTranscribing = false;
    let interimInterval: number | null = null;
    let interimInFlight = false;
    /** Text before recording started — interim results replace everything after this. */
    let preRecordingText = "";

    /** Sends accumulated audio for an interim (mid-recording) transcription.
     *  The result replaces the text after preRecordingText.
     *  Only one interim request runs at a time. */
    const sendInterimTranscription = async (audioBlob: Blob) => {
      if (interimInFlight) {
        return;
      }
      interimInFlight = true;

      try {
        let blob = audioBlob;
        if (!Media_Input_Speech_Whisper.convertSupported) {
          try {
            blob = await Media_Input_Speech_Whisper.convertToWav(blob);
          } catch (_e) {
            interimInFlight = false;
            return;
          }
        }

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read audio blob"));
          reader.readAsDataURL(blob);
        });

        const formData = new FormData();
        formData.append("codbi-base64:audio", dataUrl);

        const ajaxHeaders: Record<string, string> = {};
        if (lang) {
          ajaxHeaders["X-Language"] = lang;
        }

        const $ = getJQuery();
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
              return; // Recording ended before response arrived
            }
            const result = (typeof response === "string" ? JSON.parse(response) : response) as {
              text?: string;
              error?: string;
            };
            if (result.text) {
              const separator = preRecordingText && !preRecordingText.endsWith(" ") ? " " : "";
              field.value = preRecordingText + separator + result.text.trim();
              field.dispatchEvent(new Event("input", { bubbles: true }));
              if (field.tagName.toUpperCase() === "TEXTAREA") {
                field.style.height = "auto";
                field.style.height = `${field.scrollHeight}px`;
              }
            }
          },
          complete: () => {
            interimInFlight = false;
          },
        });
      } catch (_e) {
        interimInFlight = false;
      }
    };

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream, { mimeType: Media_Input_Speech_Whisper.preferredMimeType() });

        mediaRecorder.ondataavailable = (e: BlobEvent) => {
          if (e.data.size > 0) {
            audioChunks.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Stop all tracks to release the microphone
          for (const track of stream.getTracks()) {
            track.stop();
          }
          if (interimInterval) {
            clearInterval(interimInterval);
            interimInterval = null;
          }

          if (audioChunks.length === 0) {
            return;
          }
          let audioBlob = new Blob(audioChunks, { type: mediaRecorder?.mimeType ?? "audio/webm" });

          // If the server doesn't have ffmpeg (--convert), we must send WAV
          if (!Media_Input_Speech_Whisper.convertSupported) {
            try {
              audioBlob = await Media_Input_Speech_Whisper.convertToWav(audioBlob);
            } catch (e) {
              window.codbi.log(
                "ERROR",
                `WAV conversion failed: ${e instanceof Error ? e.message : String(e)}`,
                "MEDIA / INPUT / SPEECH / WHISPER",
              );
              return;
            }
          }

          sendForTranscription(audioBlob);
        };

        preRecordingText = field.value;
        mediaRecorder.start();
        isRecording = true;
        micButton.classList.add("MEDIA_Whisper_MicButton--recording");

        // Periodic interim transcription — flush and send accumulated audio every ~2.5s
        const rec = mediaRecorder;
        interimInterval = window.setInterval(() => {
          if (interimInFlight || rec.state !== "recording") {
            return;
          }
          rec.requestData(); // Flush buffered data into ondataavailable
          if (audioChunks.length === 0) {
            return;
          }
          const blob = new Blob(audioChunks, { type: rec.mimeType });
          sendInterimTranscription(blob);
        }, 2500);
      } catch (_e) {
        micButton.classList.add("MEDIA_Whisper_MicButton--unavailable");
        micButton.title = "Microphone access denied";
        micButton.disabled = true;
      }
    };

    const stopRecording = () => {
      if (interimInterval) {
        clearInterval(interimInterval);
        interimInterval = null;
      }
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
      isRecording = false;
      micButton.classList.remove("MEDIA_Whisper_MicButton--recording");
    };

    const sendForTranscription = async (audioBlob: Blob) => {
      isTranscribing = true;
      micButton.classList.add("MEDIA_Whisper_MicButton--transcribing");
      micButton.disabled = true;

      try {
        // Convert audio blob to base64 data-URL (same pattern as LLAMA Standard images)
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read audio blob"));
          reader.readAsDataURL(audioBlob);
        });

        const formData = new FormData();
        formData.append("codbi-base64:audio", dataUrl);

        const ajaxHeaders: Record<string, string> = {};
        if (lang) {
          ajaxHeaders["X-Language"] = lang;
        }

        const $ = getJQuery();
        $.ajax({
          url: pluginUrl,
          type: "POST",
          data: formData,
          processData: false,
          contentType: false,
          cache: false,
          headers: ajaxHeaders,
          success: (response: unknown) => {
            const result = (typeof response === "string" ? JSON.parse(response) : response) as {
              text?: string;
              error?: string;
            };

            if (result.error) {
              window.codbi.log("ERROR", `Whisper: ${result.error}`, "MEDIA / INPUT / SPEECH / WHISPER");
              return;
            }

            if (result.text) {
              const separator = preRecordingText && !preRecordingText.endsWith(" ") ? " " : "";
              field.value = preRecordingText + separator + result.text.trim();
              field.dispatchEvent(new Event("change", { bubbles: true }));
              field.dispatchEvent(new Event("input", { bubbles: true }));

              if (field.tagName.toUpperCase() === "TEXTAREA") {
                field.style.height = "auto";
                field.style.height = `${field.scrollHeight}px`;
              }
            }
          },
          error: (_xhr: unknown, _status: unknown, error: unknown) => {
            window.codbi.log(
              "ERROR",
              `Whisper transcription failed: ${String(error)}`,
              "MEDIA / INPUT / SPEECH / WHISPER",
            );
          },
          complete: () => {
            isTranscribing = false;
            micButton.classList.remove("MEDIA_Whisper_MicButton--transcribing");
            micButton.disabled = false;
          },
        });
      } catch (e) {
        window.codbi.log(
          "ERROR",
          `Whisper transcription failed: ${e instanceof Error ? e.message : String(e)}`,
          "MEDIA / INPUT / SPEECH / WHISPER",
        );
        isTranscribing = false;
        micButton.classList.remove("MEDIA_Whisper_MicButton--transcribing");
        micButton.disabled = false;
      }
    };
    // #endregion MediaRecorder setup

    // #region Toggle recording
    const toggleRecording = () => {
      if (micButton.disabled || isTranscribing) return;
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    };

    micButton.addEventListener("click", toggleRecording);
    // #endregion Toggle recording

    // #region Voice hotkey
    const hotkeyDef = (typeof toLoad.voicehotkey === "string" && toLoad.voicehotkey.trim()) || "Alt+A";
    const hotkeyParts = hotkeyDef.split("+").map((p: string) => p.trim());
    const hotkeyKey = hotkeyParts[hotkeyParts.length - 1].toUpperCase();
    const needAlt = hotkeyParts.some((p: string) => /^alt$/i.test(p));
    const needCtrl = hotkeyParts.some((p: string) => /^ctrl$/i.test(p));
    const needShift = hotkeyParts.some((p: string) => /^shift$/i.test(p));
    const needMeta = hotkeyParts.some((p: string) => /^meta$/i.test(p));
    micButton.title = `Voice input — Whisper (${hotkeyDef})`;

    Media_Input_Speech_Whisper.instances.push({ field, toggle: toggleRecording });

    if (!Media_Input_Speech_Whisper.hotkeyRegistered) {
      Media_Input_Speech_Whisper.hotkeyRegistered = true;
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
          // Skip if focused element belongs to the chat or the Web Speech wrapper
          if (active?.closest(".LLAMA_Chat_InputWrapper") || active?.closest(".MEDIA_Speech_InputWrapper")) {
            return;
          }
          const focused = Media_Input_Speech_Whisper.instances.find((inst) => inst.field === active);
          if (focused) {
            focused.toggle();
            return;
          }
          const first = Media_Input_Speech_Whisper.instances[0];
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
        (typeof toLoad.placeholder === "string" && toLoad.placeholder.trim()) ||
        `\uD83C\uDF99\uFE0F ${hotkeyDef} (Whisper)`;
    }

    // Remove CodBi loading animation (same fix as media.input.speech.ts)
    const loaderAnim = inputWrapper.parentElement?.querySelector(
      `.cCodBiLoader[cbFOR="${field.getAttribute("data-name")}"]`,
    );
    if (loaderAnim) {
      loaderAnim.remove();
    }
    // #endregion Voice hotkey
  }

  // #region Plugin URL resolution
  /**
   * Resolves the CodBi plugin servlet URL for the Whisper endpoint.
   * Uses the same URL pattern as other CodBi AI servlets: `/plugin?name=CodBi_AI_Whisper`
   */
  private static resolvePluginUrl(): string | null {
    try {
      return `${window.codbi.baseURL}plugin?name=CodBi_AI_Whisper`;
    } catch (_e) {
      return null;
    }
  }
  // #endregion Plugin URL resolution

  // #region MIME type detection
  /** Returns the best supported audio MIME type for MediaRecorder. */
  private static preferredMimeType(): string {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return ""; // Let the browser pick its default
  }
  // #endregion MIME type detection

  // #region Health-check
  /** Queries the Whisper servlet health-check to determine server capabilities. */
  private static queryHealthCheck(pluginUrl: string): void {
    try {
      const $ = getJQuery();
      $.ajax({
        url: pluginUrl,
        type: "GET",
        cache: false,
        headers: { "X-Health-Check": "true" },
        success: (response: unknown) => {
          const result = (typeof response === "string" ? JSON.parse(response) : response) as {
            convertSupported?: boolean;
          };
          if (typeof result.convertSupported === "boolean") {
            Media_Input_Speech_Whisper.convertSupported = result.convertSupported;
          }
        },
        error: () => {
          // Keep optimistic default
        },
      });
    } catch (_e) {
      // Keep optimistic default
    }
  }
  // #endregion Health-check

  // #region WAV conversion
  /**
   * Converts an audio blob (WebM/Opus, etc.) to 16-bit PCM WAV using the Web Audio API.
   * This is used when the server doesn't have ffmpeg and can only accept WAV.
   */
  private static async convertToWav(audioBlob: Blob): Promise<Blob> {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Downmix to mono
    const numFrames = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const mono = new Float32Array(numFrames);
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
      const channelData = audioBuffer.getChannelData(ch);
      for (let i = 0; i < numFrames; i++) {
        mono[i] += channelData[i];
      }
    }
    if (audioBuffer.numberOfChannels > 1) {
      const scale = 1 / audioBuffer.numberOfChannels;
      for (let i = 0; i < numFrames; i++) {
        mono[i] *= scale;
      }
    }

    // Encode 16-bit PCM WAV
    const bytesPerSample = 2;
    const dataLength = numFrames * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // RIFF header
    Media_Input_Speech_Whisper.writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataLength, true);
    Media_Input_Speech_Whisper.writeString(view, 8, "WAVE");

    // fmt chunk
    Media_Input_Speech_Whisper.writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample, true);
    view.setUint16(32, bytesPerSample, true);
    view.setUint16(34, 16, true); // bits per sample

    // data chunk
    Media_Input_Speech_Whisper.writeString(view, 36, "data");
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < numFrames; i++) {
      const sample = Math.max(-1, Math.min(1, mono[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }

    await audioContext.close();
    return new Blob([buffer], { type: "audio/wav" });
  }

  private static writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
  // #endregion WAV conversion

  // #region Styles
  private static ensureStyles(): void {
    if (document.querySelector("#MEDIA_Whisper_Styles")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "MEDIA_Whisper_Styles";
    style.textContent = `
      .MEDIA_Whisper_InputWrapper {
        position: relative ; display: inline-block ; width: 100% ;
      }
      .MEDIA_Whisper_InputWrapper > input,
      .MEDIA_Whisper_InputWrapper > textarea {
        width: 100% ; box-sizing: border-box ; padding-right: 36px ;
      }
      .MEDIA_Whisper_MicButton {
        position: absolute ; right: 4px ; top: 50% ; transform: translateY(-50%) ;
        width: 28px ; height: 28px ; border: none ; border-radius: 50% ;
        background: transparent ; color: #888 ; cursor: pointer ;
        display: flex ; align-items: center ; justify-content: center ;
        padding: 0 ; transition: color 0.2s, background 0.2s ;
      }
      .MEDIA_Whisper_MicButton:hover {
        color: #333 ; background: rgba(0,0,0,0.06) ;
      }
      .MEDIA_Whisper_MicButton--recording {
        color: #fff ; background: #1565c0 ;
        overflow: visible ;
      }
      .MEDIA_Whisper_MicButton--recording::before,
      .MEDIA_Whisper_MicButton--recording::after {
        content: '' ; position: absolute ;
        top: 50% ; left: 50% ;
        width: 100% ; height: 100% ;
        border-radius: 50% ; border: 2px solid #1565c0 ;
        transform: translate(-50%, -50%) scale(1) ;
        animation: MEDIA_Whisper_mic_flare 1.8s ease-out infinite ;
      }
      .MEDIA_Whisper_MicButton--recording::after {
        animation-delay: 0.6s ;
      }
      .MEDIA_Whisper_MicButton--recording:hover {
        background: #0d47a1 ; color: #fff ;
      }
      .MEDIA_Whisper_MicButton--transcribing {
        color: #fff ; background: #e53935 ;
        pointer-events: none ; overflow: visible ;
      }
      .MEDIA_Whisper_MicButton--transcribing::before,
      .MEDIA_Whisper_MicButton--transcribing::after {
        content: '' ; position: absolute ;
        top: 50% ; left: 50% ;
        width: 100% ; height: 100% ;
        border-radius: 50% ; border: 2px solid #e53935 ;
        transform: translate(-50%, -50%) scale(1) ;
        animation: MEDIA_Whisper_mic_flare 1.8s ease-out infinite ;
      }
      .MEDIA_Whisper_MicButton--transcribing::after {
        animation-delay: 0.6s ;
      }
      .MEDIA_Whisper_MicButton--unavailable {
        color: #ccc ; cursor: not-allowed ;
      }
      @keyframes MEDIA_Whisper_mic_flare {
        0%   { transform: translate(-50%, -50%) scale(1) ; opacity: 0.7 ; }
        100% { transform: translate(-50%, -50%) scale(2.8) ; opacity: 0 ; }
      }`;
    document.head.appendChild(style);
  }
  // #endregion Styles
}

// #region Register functionality with CodBi
window.codbi.registerFunctionality(
  "Media.Input.Speech.Whisper",
  Media_Input_Speech_Whisper.functionality.bind(Media_Input_Speech_Whisper),
);
// #endregion Register functionality with CodBi
