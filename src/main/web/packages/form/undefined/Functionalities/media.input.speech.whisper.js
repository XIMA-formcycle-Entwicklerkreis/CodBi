import { convertToWav, preferredMimeType } from "./chunk-OJ4YXXK4.js";
import { IF } from "./chunk-2VQP2CFN.js";
import { REGEX } from "./chunk-F3IDEOQS.js";
import { TYPE } from "./chunk-O5T7YW22.js";
import { INSTANCE } from "./chunk-53TEMTGA.js";
import { DBC } from "./chunk-LFRFVRJV.js";
import { require_dist } from "./chunk-ZTMSSRTV.js";
import { __decorateClass, __decorateParam, __toESM } from "./chunk-AOJQKO6T.js";

// src/js/Functionalities/media.input.speech.whisper.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var _Media_Input_Speech_Whisper = class _Media_Input_Speech_Whisper {
  static {
    /** Registry of all Whisper-enabled fields and their toggle functions. */
    this.instances = [];
  }
  static {
    /** Whether the global hotkey listener has been registered. */
    this.hotkeyRegistered = false;
  }
  static {
    /** Whether the server supports arbitrary audio formats (ffmpeg available). Defaults to true (optimistic). */
    this.convertSupported = true;
  }
  static {
    /** Whether the health-check has been performed. */
    this.healthChecked = false;
  }
  static {
    /** Server readiness: null = pending, true = online, false = offline. */
    this.serverReady = null;
  }
  static {
    /** Mic buttons waiting for the health-check result. */
    this.pendingMicButtons = [];
  }
  static {
    /** All mic buttons ever created, so they can be shown when the server recovers. */
    this.allMicButtons = [];
  }
  static {
    /** Cached plugin URL for retry health-checks. */
    this.retryPluginUrl = null;
  }
  static {
    /** Handle for the periodic retry timer (0 = none). */
    this.retryTimer = 0;
  }
  static functionality(toLoad, toProcess) {
    const field = toProcess;
    _Media_Input_Speech_Whisper.ensureStyles();
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
    _Media_Input_Speech_Whisper.allMicButtons.push(micButton);
    if (_Media_Input_Speech_Whisper.serverReady === false) {
      micButton.style.display = "none";
    } else if (_Media_Input_Speech_Whisper.serverReady === null) {
      _Media_Input_Speech_Whisper.pendingMicButtons.push(micButton);
    }
    const pluginUrl = _Media_Input_Speech_Whisper.resolvePluginUrl();
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
    if (!_Media_Input_Speech_Whisper.healthChecked) {
      _Media_Input_Speech_Whisper.healthChecked = true;
      _Media_Input_Speech_Whisper.queryHealthCheck(pluginUrl);
    }
    const lang = toLoad.language != null ? String(toLoad.language).trim() : "";
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;
    let isTranscribing = false;
    let interimInterval = null;
    let interimInFlight = false;
    let preRecordingText = "";
    const sendInterimTranscription = async (audioBlob) => {
      if (interimInFlight) {
        return;
      }
      interimInFlight = true;
      try {
        let blob = audioBlob;
        if (!_Media_Input_Speech_Whisper.convertSupported) {
          try {
            blob = await convertToWav(blob);
          } catch (X) {
            interimInFlight = false;
            return;
          }
        }
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Failed to read audio blob"));
          reader.readAsDataURL(blob);
        });
        const formData = new FormData();
        formData.append("codbi-base64:audio", dataUrl);
        const ajaxHeaders = {};
        if (lang) {
          ajaxHeaders["X-Language"] = lang;
        }
        const $ = (0, import_fc_form_renderer.getJQuery)();
        $.ajax({
          url: pluginUrl,
          type: "POST",
          data: formData,
          processData: false,
          contentType: false,
          cache: false,
          headers: ajaxHeaders,
          success: (response) => {
            if (!isRecording) {
              return;
            }
            const result = typeof response === "string" ? JSON.parse(response) : response;
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
      } catch (X) {
        interimInFlight = false;
      }
    };
    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream, { mimeType: preferredMimeType() });
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };
        mediaRecorder.onstop = async () => {
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
          if (!_Media_Input_Speech_Whisper.convertSupported) {
            try {
              audioBlob = await convertToWav(audioBlob);
            } catch (X) {
              window.codbi.log(
                "ERROR",
                `WAV conversion failed: ${X instanceof Error ? X.message : String(X)}`,
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
        const rec = mediaRecorder;
        interimInterval = window.setInterval(() => {
          if (interimInFlight || rec.state !== "recording") {
            return;
          }
          rec.requestData();
          if (audioChunks.length === 0) {
            return;
          }
          const blob = new Blob(audioChunks, { type: rec.mimeType });
          sendInterimTranscription(blob);
        }, 2500);
      } catch (X) {
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
    const sendForTranscription = async (audioBlob) => {
      isTranscribing = true;
      micButton.classList.add("MEDIA_Whisper_MicButton--transcribing");
      micButton.disabled = true;
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Failed to read audio blob"));
          reader.readAsDataURL(audioBlob);
        });
        const formData = new FormData();
        formData.append("codbi-base64:audio", dataUrl);
        const ajaxHeaders = {};
        if (lang) {
          ajaxHeaders["X-Language"] = lang;
        }
        (0, import_fc_form_renderer.getJQuery)().ajax({
          url: pluginUrl,
          type: "POST",
          data: formData,
          processData: false,
          contentType: false,
          cache: false,
          headers: ajaxHeaders,
          success: (response) => {
            const result = typeof response === "string" ? JSON.parse(response) : response;
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
          error: (_xhr, _status, error) => {
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
      } catch (X) {
        window.codbi.log(
          "ERROR",
          `Whisper transcription failed: ${X instanceof Error ? X.message : String(X)}`,
          "MEDIA / INPUT / SPEECH / WHISPER",
        );
        isTranscribing = false;
        micButton.classList.remove("MEDIA_Whisper_MicButton--transcribing");
        micButton.disabled = false;
      }
    };
    const toggleRecording = () => {
      if (micButton.disabled || isTranscribing) {
        return;
      }
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    };
    micButton.addEventListener("click", toggleRecording);
    const hotkeyDef = (typeof toLoad.voicehotkey === "string" && toLoad.voicehotkey.trim()) || "Alt+A";
    const hotkeyParts = hotkeyDef.split("+").map((p) => p.trim());
    const hotkeyKey = hotkeyParts[hotkeyParts.length - 1].toUpperCase();
    const needAlt = hotkeyParts.some((p) => /^alt$/i.test(p));
    const needCtrl = hotkeyParts.some((p) => /^ctrl$/i.test(p));
    const needShift = hotkeyParts.some((p) => /^shift$/i.test(p));
    const needMeta = hotkeyParts.some((p) => /^meta$/i.test(p));
    micButton.title = `Voice input \u2014 Whisper (${hotkeyDef})`;
    _Media_Input_Speech_Whisper.instances.push({ field, toggle: toggleRecording });
    if (!_Media_Input_Speech_Whisper.hotkeyRegistered) {
      _Media_Input_Speech_Whisper.hotkeyRegistered = true;
      document.addEventListener("keydown", (e) => {
        if (
          e.key.toUpperCase() === hotkeyKey &&
          e.altKey === needAlt &&
          e.ctrlKey === needCtrl &&
          e.shiftKey === needShift &&
          e.metaKey === needMeta
        ) {
          e.preventDefault();
          const active = document.activeElement;
          if (active?.closest(".LLAMA_Chat_InputWrapper") || active?.closest(".MEDIA_Speech_InputWrapper")) {
            return;
          }
          const focused = _Media_Input_Speech_Whisper.instances.find((inst) => inst.field === active);
          if (focused) {
            focused.toggle();
            return;
          }
          const first = _Media_Input_Speech_Whisper.instances[0];
          if (first) {
            first.field.focus();
            first.toggle();
          }
        }
      });
    }
    const showHint = toLoad.showhint != null && String(toLoad.showhint).toLowerCase() === "true";
    if (showHint) {
      field.placeholder =
        (typeof toLoad.placeholder === "string" && toLoad.placeholder.trim()) ||
        `\u{1F399}\uFE0F ${hotkeyDef} (Whisper)`;
    }
    const loaderAnim = inputWrapper.parentElement?.querySelector(
      `.cCodBiLoader[cbFOR="${field.getAttribute("data-name")}"]`,
    );
    if (loaderAnim) {
      loaderAnim.remove();
    }
  }
  // #region Plugin URL-Resolution.
  /**
   * Resolves the CodBi plugin servlet URL for the Whisper endpoint.
   * Uses the same URL pattern as other CodBi AI servlets: `/plugin?name=CodBi_AI_Whisper` */
  static resolvePluginUrl() {
    try {
      return `${window.codbi.baseURL}plugin?name=CodBi_AI_Whisper`;
    } catch (X) {
      return null;
    }
  }
  // #endregion Plugin URL-Resolution.
  // #region MIME-Type-Detection — see ../commons/whisper-utils.ts
  // #region Health-Check.
  static queryHealthCheck(pluginUrl) {
    _Media_Input_Speech_Whisper.retryPluginUrl = pluginUrl;
    try {
      const $ = (0, import_fc_form_renderer.getJQuery)();
      $.ajax({
        url: pluginUrl,
        type: "GET",
        cache: false,
        headers: { "X-Health-Check": "true" },
        success: (response) => {
          const result = typeof response === "string" ? JSON.parse(response) : response;
          if (result.error || result.status !== "ready") {
            _Media_Input_Speech_Whisper.handleOffline();
            return;
          }
          _Media_Input_Speech_Whisper.handleOnline();
          if (typeof result.convertSupported === "boolean") {
            _Media_Input_Speech_Whisper.convertSupported = result.convertSupported;
          }
        },
        error: () => {
          _Media_Input_Speech_Whisper.handleOffline();
        },
      });
    } catch (X) {
      _Media_Input_Speech_Whisper.handleOffline();
    }
  }
  /** Marks the server as offline, hides all mic buttons, and schedules a periodic retry every 30 seconds. */
  static handleOffline() {
    _Media_Input_Speech_Whisper.serverReady = false;
    for (const btn of _Media_Input_Speech_Whisper.pendingMicButtons) {
      btn.style.display = "none";
    }
    _Media_Input_Speech_Whisper.pendingMicButtons.length = 0;
    for (const btn of _Media_Input_Speech_Whisper.allMicButtons) {
      btn.style.display = "none";
    }
    if (!_Media_Input_Speech_Whisper.retryTimer) {
      _Media_Input_Speech_Whisper.retryTimer = window.setInterval(() => {
        if (_Media_Input_Speech_Whisper.retryPluginUrl) {
          _Media_Input_Speech_Whisper.queryHealthCheck(_Media_Input_Speech_Whisper.retryPluginUrl);
        }
      }, 3e4);
    }
  }
  /** Marks the server as online, shows all mic buttons, and stops the retry timer. */
  static handleOnline() {
    _Media_Input_Speech_Whisper.serverReady = true;
    _Media_Input_Speech_Whisper.pendingMicButtons.length = 0;
    for (const btn of _Media_Input_Speech_Whisper.allMicButtons) {
      btn.style.display = "";
    }
    if (_Media_Input_Speech_Whisper.retryTimer) {
      clearInterval(_Media_Input_Speech_Whisper.retryTimer);
      _Media_Input_Speech_Whisper.retryTimer = 0;
    }
  }
  // #endregion Health-Check.
  // #region WAV conversion — see ../commons/whisper-utils.ts
  // #region Styles
  static ensureStyles() {
    if (document.querySelector("#MEDIA_Whisper_Styles")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "MEDIA_Whisper_Styles";
    style.textContent = `
      .MEDIA_Whisper_InputWrapper { position: relative ; display: inline-block ; width: 100% ;}

      .MEDIA_Whisper_InputWrapper > input,
      .MEDIA_Whisper_InputWrapper > textarea { width: 100% ; box-sizing: border-box ; padding-right: 36px !important ;}

      .MEDIA_Whisper_MicButton        { position: absolute ; right: 4px ; top: 50% ; transform: translateY(-50%) ;
                                        width: 28px ; height: 28px ; border: none ; border-radius: 50% ; background: transparent ;
                                        color: #888 ; cursor: pointer ; display: flex ; align-items: center ;
                                        justify-content: center ; padding: 0 ; transition: color 0.2s, background 0.2s ;}
      .MEDIA_Whisper_MicButton:hover  { color: #333 ; background: rgba( 0, 0, 0, 0.06 ) ;}

      .MEDIA_Whisper_MicButton--recording         { color: #fff ; background: #e53935 ; overflow: visible ;}
      .MEDIA_Whisper_MicButton--recording::before,
      .MEDIA_Whisper_MicButton--recording::after  { content: '' ; position: absolute ; top: 50% ; left: 50% ; width: 100% ;
                                                    height: 100% ; border-radius: 50% ; border: 2px solid #e53935 ;
                                                    transform: translate(-50%, -50%) scale( 1 ) ;
                                                    animation: MEDIA_Whisper_mic_flare 1.8s ease-out infinite ;}
      .MEDIA_Whisper_MicButton--recording::after  { animation-delay: 0.6s ;}
      .MEDIA_Whisper_MicButton--recording:hover   { background: #c62828 ; color: #fff ;}

      .MEDIA_Whisper_MicButton--transcribing          { color: #fff ; background: #1565c0 ; pointer-events: none ;
                                                        overflow: visible ; }
      .MEDIA_Whisper_MicButton--transcribing::before,
      .MEDIA_Whisper_MicButton--transcribing::after   { content: '' ; position: absolute ; top: 50% ; left: 50% ; width: 100% ;
                                                        height: 100% ; border-radius: 50% ; border: 2px solid #1565c0 ;
                                                        transform: translate(-50%, -50%) scale( 1 );
                                                        animation: MEDIA_Whisper_mic_flare 1.8s ease-out infinite ;}
      .MEDIA_Whisper_MicButton--transcribing::after   { animation-delay: 0.6s ;}

      .MEDIA_Whisper_MicButton--unavailable { color: #ccc ; cursor: not-allowed ;}

      .MEDIA_Whisper_InputWrapper:has(.MEDIA_Whisper_MicButton:not([style*="display: none"])) .LLAMA_AI_Hint { right: 40px !important ; }
      @keyframes MEDIA_Whisper_mic_flare {
        0%   { transform: translate(-50%, -50%) scale(1) ; opacity: 0.7 ; }
        100% { transform: translate(-50%, -50%) scale(2.8) ; opacity: 0 ; }}`;
    document.head.appendChild(style);
  }
  // #endregion Styles
};
__decorateClass(
  [
    DBC.ParamvalueProvider,
    __decorateParam(0, TYPE.PRE("string", "voicehotkey, language, placeholder")),
    __decorateParam(0, TYPE.PRE("string | boolean", "showhint")),
    __decorateParam(0, REGEX.PRE(REGEX.stdExp.simpleHotkey, "voicehotkey")),
    __decorateParam(0, REGEX.PRE(REGEX.stdExp.bcp47, "language")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "showhint")),
    __decorateParam(
      1,
      INSTANCE.PRE(
        [HTMLInputElement, HTMLTextAreaElement],
        void 0,
        'Is it not an <input type="text"/> or <textarea> that is tagged with this functionality?',
      ),
    ),
  ],
  _Media_Input_Speech_Whisper,
  "functionality",
  1,
);
var Media_Input_Speech_Whisper = _Media_Input_Speech_Whisper;
window.codbi.registerFunctionality(
  "Media.Input.Speech.Whisper",
  Media_Input_Speech_Whisper.functionality.bind(Media_Input_Speech_Whisper),
);
export { Media_Input_Speech_Whisper };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9tZWRpYS5pbnB1dC5zcGVlY2gud2hpc3Blci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIFhEQkNcbmltcG9ydCB7IERCQyB9IGZyb20gXCJ4ZGJjL3NyYy9EQkNcIjtcbmltcG9ydCB7IElOU1RBTkNFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JTlNUQU5DRVwiO1xuaW1wb3J0IHsgSUYgfSBmcm9tIFwieGRiYy9zcmMvREJDL0lGXCI7XG5pbXBvcnQgeyBSRUdFWCB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvUkVHRVhcIjtcbmltcG9ydCB7IFRZUEUgfSBmcm9tIFwieGRiYy9zcmMvREJDL1RZUEVcIjtcbi8vICNlbmRyZWdpb24gWERCQ1xuLy8gI3JlZ2lvbiBYSU1BXG5pbXBvcnQgeyBnZXRKUXVlcnkgfSBmcm9tIFwiQGRlLXhpbWEvZmMtZm9ybS1yZW5kZXJlclwiO1xuLy8gI2VuZHJlZ2lvbiBYSU1BXG4vLyAjcmVnaW9uIENvbW1vbnNcbmltcG9ydCB7IGNvbnZlcnRUb1dhdiwgcHJlZmVycmVkTWltZVR5cGUgfSBmcm9tIFwiLi4vY29tbW9ucy93aGlzcGVyLXV0aWxzXCI7XG4vLyAjZW5kcmVnaW9uIENvbW1vbnNcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLyoqXG4gKiBQcm92aWRlcyB0aGUge0BsaW5rIE1lZGlhX0lucHV0X1NwZWVjaF9XaGlzcGVyLmZ1bmN0aW9uYWxpdHkgfS5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChTYWx2YXRvcmUuQ2FsbGFyaUBBbnNiYWNoLmRlKSAqL1xuLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1N0YXRpY09ubHlDbGFzczogUHJvYWN0aXZlIERlc2lnbi5cbmV4cG9ydCBjbGFzcyBNZWRpYV9JbnB1dF9TcGVlY2hfV2hpc3BlciB7XG4gIC8qKiBSZWdpc3RyeSBvZiBhbGwgV2hpc3Blci1lbmFibGVkIGZpZWxkcyBhbmQgdGhlaXIgdG9nZ2xlIGZ1bmN0aW9ucy4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgaW5zdGFuY2VzOiB7IGZpZWxkOiBIVE1MRWxlbWVudDsgdG9nZ2xlOiAoKSA9PiB2b2lkIH1bXSA9IFtdO1xuICAvKiogV2hldGhlciB0aGUgZ2xvYmFsIGhvdGtleSBsaXN0ZW5lciBoYXMgYmVlbiByZWdpc3RlcmVkLiAqL1xuICBwcml2YXRlIHN0YXRpYyBob3RrZXlSZWdpc3RlcmVkID0gZmFsc2U7XG4gIC8qKiBXaGV0aGVyIHRoZSBzZXJ2ZXIgc3VwcG9ydHMgYXJiaXRyYXJ5IGF1ZGlvIGZvcm1hdHMgKGZmbXBlZyBhdmFpbGFibGUpLiBEZWZhdWx0cyB0byB0cnVlIChvcHRpbWlzdGljKS4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgY29udmVydFN1cHBvcnRlZCA9IHRydWU7XG4gIC8qKiBXaGV0aGVyIHRoZSBoZWFsdGgtY2hlY2sgaGFzIGJlZW4gcGVyZm9ybWVkLiAqL1xuICBwcml2YXRlIHN0YXRpYyBoZWFsdGhDaGVja2VkID0gZmFsc2U7XG4gIC8qKiBTZXJ2ZXIgcmVhZGluZXNzOiBudWxsID0gcGVuZGluZywgdHJ1ZSA9IG9ubGluZSwgZmFsc2UgPSBvZmZsaW5lLiAqL1xuICBwcml2YXRlIHN0YXRpYyBzZXJ2ZXJSZWFkeTogYm9vbGVhbiB8IG51bGwgPSBudWxsO1xuICAvKiogTWljIGJ1dHRvbnMgd2FpdGluZyBmb3IgdGhlIGhlYWx0aC1jaGVjayByZXN1bHQuICovXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IHBlbmRpbmdNaWNCdXR0b25zOiBIVE1MQnV0dG9uRWxlbWVudFtdID0gW107XG4gIC8qKiBBbGwgbWljIGJ1dHRvbnMgZXZlciBjcmVhdGVkLCBzbyB0aGV5IGNhbiBiZSBzaG93biB3aGVuIHRoZSBzZXJ2ZXIgcmVjb3ZlcnMuICovXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IGFsbE1pY0J1dHRvbnM6IEhUTUxCdXR0b25FbGVtZW50W10gPSBbXTtcbiAgLyoqIENhY2hlZCBwbHVnaW4gVVJMIGZvciByZXRyeSBoZWFsdGgtY2hlY2tzLiAqL1xuICBwcml2YXRlIHN0YXRpYyByZXRyeVBsdWdpblVybDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIC8qKiBIYW5kbGUgZm9yIHRoZSBwZXJpb2RpYyByZXRyeSB0aW1lciAoMCA9IG5vbmUpLiAqL1xuICBwcml2YXRlIHN0YXRpYyByZXRyeVRpbWVyID0gMDtcblxuICAvKipcbiAgICogQWRkcyBhIG1pY3JvcGhvbmUgYnV0dG9uIHRvIGFuIHtAbGluayBIVE1MSW5wdXRFbGVtZW50IH0gb2YgdHlwZSAndGV4dCcgb3IgYSB7QGxpbmsgSFRNTFRleHRhcmVhRWxlbWVudCB9IGZvclxuICAgKiBzcGVlY2gtdG8tdGV4dCBpbnB1dCB2aWEgYSBzZWxmLWhvc3RlZCBXaGlzcGVyLU1vZGVsIG9uIHRoZSBGb3JtY3ljbGUgc2VydmVyLlxuICAgKlxuICAgKiAjIyMgQ29uZmlnIFBhcmFtZXRlcnM6XG4gICAqIC0gKipWb2ljZUhvdGtleSoqOiBLZXlib2FyZCBzaG9ydGN1dCB0byB0b2dnbGUgcmVjb3JkaW5nLiBEZWZhdWx0OiBgQWx0K0FgLlxuICAgKiAtICoqTGFuZ3VhZ2UqKjogICAgVHdvLWxldHRlciBsYW5ndWFnZSBjb2RlIGZvciBXaGlzcGVyIChlLmcuIGBkZWAsIGBlbmAsIGBmcmApLiBJZiBvbWl0dGVkLCBXaGlzcGVyIGF1dG8tZGV0ZWN0cyB0aGUgbGFuZ3VhZ2UuXG4gICAqIC0gKipQbGFjZWhvbGRlcioqOiBDdXN0b20gcGxhY2Vob2xkZXIgdGV4dCBmb3IgdGhlIGZpZWxkLiBPbmx5IHNob3duIHdoZW4gYFNob3dIaW50YCBpcyBgdHJ1ZWAuXG4gICAqIC0gKipTaG93SGludCoqOiAgICBJZiBzZXQgdG8gYHRydWVgLCBzaG93cyB0aGUgaG90a2V5IGhpbnQgYXMgcGxhY2Vob2xkZXIgdGV4dC4gRGVmYXVsdDogYGZhbHNlYC5cbiAgICpcbiAgICogIyMjIERTR1ZPIC8gR0RQUiBcdTIwMTQgT24tUHJlbWlzZSBTcGVlY2ggUmVjb2duaXRpb25cbiAgICogVW5saWtlIHRoZSBXZWIgU3BlZWNoIEFQSSB2YXJpYW50ICh7QGxpbmsgTUVESUEuSU5QVVQuU1BFRUNIfSksIHRoaXMgZnVuY3Rpb25hbGl0eSBwcm9jZXNzZXMgYWxsIGF1ZGlvIGRhdGFcbiAgICogKipsb2NhbGx5IG9uIHRoZSBGb3JtY3ljbGUgc2VydmVyKiogKG9yIGFueSBsb2NhbCBzZXJ2ZXIgdmlhIHRoZSAqKk9wZW5BSSAvdjEvYXVkaW8vdHJhbnNjcmlwdGlvbnMgQVBJKiogKCpjaGVjayB0aGVcbiAgICogV2hpc3Blci5rdCBDbGFzcy1Eb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8pKSB1c2luZyBhIHNlbGYtaG9zdGVkIFtXaGlzcGVyXShodHRwczovL2dpdGh1Yi5jb20vb3BlbmFpL3doaXNwZXIpIG1vZGVsXG4gICAqIHZpYSBbd2hpc3Blci5jcHBdKGh0dHBzOi8vZ2l0aHViLmNvbS9nZ2VyZ2Fub3Yvd2hpc3Blci5jcHApLlxuICAgKlxuICAgKiAqKk5vIGF1ZGlvIGRhdGEgbGVhdmVzIHRoZSBzZXJ2ZXIuKiogVGhlcmUgaXMgbm8gZGVwZW5kZW5jeSBvbiBHb29nbGUsIE1pY3Jvc29mdCwgT3BlbkFJLCBvciBhbnkgb3RoZXIgY2xvdWQgcHJvdmlkZXIuXG4gICAqIFRoaXMgbWFrZXMgaXQgZnVsbHkgRFNHVk8vR0RQUi1jb21wbGlhbnQgd2l0aG91dCByZXF1aXJpbmcgYWRkaXRpb25hbCBjb25zZW50IGZvciBjbG91ZC1iYXNlZCBzcGVlY2ggcHJvY2Vzc2luZy5cbiAgICpcbiAgICogIyMjIERpZmZlcmVuY2UgZnJvbSBgTUVESUEuSU5QVVQuU1BFRUNIYDpcbiAgICogfCBGZWF0dXJlICAgICAgICAgICAgICAgfCBgTUVESUEuSU5QVVQuU1BFRUNIYCAgICAgICAgIHwgYE1FRElBLklOUFVULlNQRUVDSC5XSElTUEVSYCAgICB8XG4gICAqIHwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tfFxuICAgKiB8IFByb2Nlc3NpbmcgICAgICAgICAgICB8IEJyb3dzZXIgY2xvdWQgQVBJIChyZWFsLXRpbWUpIHwgTG9jYWwgc2VydmVyIChiYXRjaCkgICAgICAgICAgICB8XG4gICAqIHwgRGF0YSBsZWF2ZXMgZGV2aWNlPyAgIHwgWWVzIChjbG91ZCkgICAgICAgICAgICAgICAgICB8IE5vIChsb2NhbGhvc3Qgb25seSkgICAgICAgICAgICAgfFxuICAgKiB8IERTR1ZPIGNvbnNlbnQgbmVlZGVkPyB8IFllcyAoQXJ0LiAxMykgICAgICAgICAgICAgICAgfCBObyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAgICogfCBSZWFsLXRpbWUgaW50ZXJpbT8gICAgfCBZZXMgICAgICAgICAgICAgICAgICAgICAgICAgIHwgWWVzICAgfFxuICAgKiB8IEJyb3dzZXIgc3VwcG9ydCAgICAgICB8IENocm9tZSwgRWRnZSAobGltaXRlZCkgICAgICAgfCBBbGwgbW9kZXJuIGJyb3dzZXJzICAgICAgICAgICAgIHxcbiAgICpcbiAgICogQHBhcmFtIHRvTG9hZCAgICBQcm92aWRlZCBieSB0aGUgQ29kQmkuXG4gICAqIEBwYXJhbSB0b1Byb2Nlc3MgUHJvdmlkZWQgYnkgdGhlIENvZEJpLiBNdXN0IGJlIGFuIGA8aW5wdXQgdHlwZT1cInRleHRcIj5gIG9yIGA8dGV4dGFyZWE+YC4gKi9cbiAgQERCQy5QYXJhbXZhbHVlUHJvdmlkZXJcbiAgcHVibGljIHN0YXRpYyBmdW5jdGlvbmFsaXR5KFxuICAgIEBUWVBFLlBSRShcInN0cmluZ1wiLCBcInZvaWNlaG90a2V5LCBsYW5ndWFnZSwgcGxhY2Vob2xkZXJcIilcbiAgICBAVFlQRS5QUkUoXCJzdHJpbmcgfCBib29sZWFuXCIsIFwic2hvd2hpbnRcIilcbiAgICBAUkVHRVguUFJFKFJFR0VYLnN0ZEV4cC5zaW1wbGVIb3RrZXksIFwidm9pY2Vob3RrZXlcIilcbiAgICBAUkVHRVguUFJFKFJFR0VYLnN0ZEV4cC5iY3A0NywgXCJsYW5ndWFnZVwiKVxuICAgIEBJRi5QUkUobmV3IFRZUEUoXCJzdHJpbmdcIiksIG5ldyBSRUdFWCgvXih0cnVlfGZhbHNlKSQvaSksIFwic2hvd2hpbnRcIilcbiAgICB0b0xvYWQ6IHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9LFxuXG4gICAgQElOU1RBTkNFLlBSRShcbiAgICAgIFtIVE1MSW5wdXRFbGVtZW50LCBIVE1MVGV4dEFyZWFFbGVtZW50XSxcbiAgICAgIHVuZGVmaW5lZCxcbiAgICAgICdJcyBpdCBub3QgYW4gPGlucHV0IHR5cGU9XCJ0ZXh0XCIvPiBvciA8dGV4dGFyZWE+IHRoYXQgaXMgdGFnZ2VkIHdpdGggdGhpcyBmdW5jdGlvbmFsaXR5PycsXG4gICAgKVxuICAgIHRvUHJvY2VzczogRWxlbWVudCxcbiAgKTogdm9pZCB7XG4gICAgY29uc3QgZmllbGQgPSB0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG5cbiAgICBNZWRpYV9JbnB1dF9TcGVlY2hfV2hpc3Blci5lbnN1cmVTdHlsZXMoKTtcbiAgICAvLyAjcmVnaW9uIFdyYXAgZmllbGQgYW5kIGNyZWF0ZSBtaWMgYnV0dG9uLlxuICAgIGNvbnN0IGlucHV0V3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICBpbnB1dFdyYXBwZXIuY2xhc3NOYW1lID0gXCJNRURJQV9XaGlzcGVyX0lucHV0V3JhcHBlclwiO1xuXG4gICAgZmllbGQucGFyZW50RWxlbWVudD8uaW5zZXJ0QmVmb3JlKGlucHV0V3JhcHBlciwgZmllbGQpO1xuICAgIGlucHV0V3JhcHBlci5hcHBlbmRDaGlsZChmaWVsZCk7XG5cbiAgICBjb25zdCBtaWNCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuXG4gICAgbWljQnV0dG9uLnR5cGUgPSBcImJ1dHRvblwiO1xuICAgIG1pY0J1dHRvbi5jbGFzc05hbWUgPSBcIk1FRElBX1doaXNwZXJfTWljQnV0dG9uXCI7XG4gICAgbWljQnV0dG9uLnRpdGxlID0gXCJWb2ljZSBpbnB1dCAoV2hpc3BlcilcIjtcbiAgICBtaWNCdXR0b24uaW5uZXJIVE1MID0gYDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiIHdpZHRoPVwiMThcIiBoZWlnaHQ9XCIxOFwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIj48cGF0aCBkPVwiTTEyIDE0YTMgMyAwIDAgMCAzLTNWNWEzIDMgMCAwIDAtNiAwdjZhMyAzIDAgMCAwIDMgM3ptLTEtOWExIDEgMCAxIDEgMiAwdjZhMSAxIDAgMSAxLTIgMFY1em02IDZhNSA1IDAgMCAxLTEwIDBINWE3IDcgMCAwIDAgNiA2LjkzVjIxaDJ2LTMuMDdBNyA3IDAgMCAwIDE5IDExaC0yelwiLz48L3N2Zz5gO1xuXG4gICAgaW5wdXRXcmFwcGVyLmFwcGVuZENoaWxkKG1pY0J1dHRvbik7XG4gICAgLy8gI2VuZHJlZ2lvbiBXcmFwIGZpZWxkIGFuZCBjcmVhdGUgbWljIGJ1dHRvbi5cbiAgICAvLyAjcmVnaW9uIEhpZGUgbWljIGlmIHNlcnZlciBpcyBrbm93biBvZmZsaW5lLCBvciBxdWV1ZSBmb3IgaGVhbHRoLWNoZWNrIHJlc3VsdC5cbiAgICBNZWRpYV9JbnB1dF9TcGVlY2hfV2hpc3Blci5hbGxNaWNCdXR0b25zLnB1c2gobWljQnV0dG9uKTtcblxuICAgIGlmIChNZWRpYV9JbnB1dF9TcGVlY2hfV2hpc3Blci5zZXJ2ZXJSZWFkeSA9PT0gZmFsc2UpIHtcbiAgICAgIG1pY0J1dHRvbi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgfSBlbHNlIGlmIChNZWRpYV9JbnB1dF9TcGVlY2hfV2hpc3Blci5zZXJ2ZXJSZWFkeSA9PT0gbnVsbCkge1xuICAgICAgTWVkaWFfSW5wdXRfU3BlZWNoX1doaXNwZXIucGVuZGluZ01pY0J1dHRvbnMucHVzaChtaWNCdXR0b24pO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIEhpZGUgbWljIGlmIHNlcnZlciBpcyBrbm93biBvZmZsaW5lLCBvciBxdWV1ZSBmb3IgaGVhbHRoLWNoZWNrIHJlc3VsdC5cbiAgICAvLyAjcmVnaW9uIFJlc29sdmUgdGhlIHBsdWdpbiBzZXJ2bGV0IFVSTFxuICAgIGNvbnN0IHBsdWdpblVybCA9IE1lZGlhX0lucHV0X1NwZWVjaF9XaGlzcGVyLnJlc29sdmVQbHVnaW5VcmwoKTtcblxuICAgIGlmICghcGx1Z2luVXJsKSB7XG4gICAgICB3aW5kb3cuY29kYmkubG9nKFxuICAgICAgICBcIkVSUk9SXCIsXG4gICAgICAgIFwiQ291bGQgbm90IHJlc29sdmUgQ29kQmkgcGx1Z2luIHNlcnZsZXQgVVJMIGZvciBXaGlzcGVyXCIsXG4gICAgICAgIFwiTUVESUEgLyBJTlBVVCAvIFNQRUVDSCAvIFdISVNQRVJcIixcbiAgICAgICk7XG5cbiAgICAgIG1pY0J1dHRvbi5jbGFzc0xpc3QuYWRkKFwiTUVESUFfV2hpc3Blcl9NaWNCdXR0b24tLXVuYXZhaWxhYmxlXCIpO1xuICAgICAgbWljQnV0dG9uLnRpdGxlID0gXCJXaGlzcGVyIGVuZHBvaW50IG5vdCBhdmFpbGFibGVcIjtcbiAgICAgIG1pY0J1dHRvbi5kaXNhYmxlZCA9IHRydWU7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBSZXNvbHZlIHRoZSBwbHVnaW4gc2VydmxldCBVUkxcbiAgICAvLyAjcmVnaW9uIEhlYWx0aC1jaGVjayAocXVlcnkgY29udmVydFN1cHBvcnRlZCBvbmNlKVxuICAgIGlmICghTWVkaWFfSW5wdXRfU3BlZWNoX1doaXNwZXIuaGVhbHRoQ2hlY2tlZCkge1xuICAgICAgTWVkaWFfSW5wdXRfU3BlZWNoX1doaXNwZXIuaGVhbHRoQ2hlY2tlZCA9IHRydWU7XG5cbiAgICAgIE1lZGlhX0lucHV0X1NwZWVjaF9XaGlzcGVyLnF1ZXJ5SGVhbHRoQ2hlY2socGx1Z2luVXJsKTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBIZWFsdGgtY2hlY2tcblxuICAgIGNvbnN0IGxhbmcgPSB0b0xvYWQubGFuZ3VhZ2UgIT0gbnVsbCA/IFN0cmluZyh0b0xvYWQubGFuZ3VhZ2UpLnRyaW0oKSA6IFwiXCI7XG4gICAgLy8gI3JlZ2lvbiBNZWRpYVJlY29yZGVyLVNldHVwLlxuICAgIGxldCBtZWRpYVJlY29yZGVyOiBNZWRpYVJlY29yZGVyIHwgbnVsbCA9IG51bGw7XG4gICAgbGV0IGF1ZGlvQ2h1bmtzOiBCbG9iW10gPSBbXTtcbiAgICBsZXQgaXNSZWNvcmRpbmcgPSBmYWxzZTtcbiAgICBsZXQgaXNUcmFuc2NyaWJpbmcgPSBmYWxzZTtcbiAgICBsZXQgaW50ZXJpbUludGVydmFsOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICBsZXQgaW50ZXJpbUluRmxpZ2h0ID0gZmFsc2U7XG4gICAgbGV0IHByZVJlY29yZGluZ1RleHQgPSBcIlwiO1xuICAgIC8qKiBTZW5kcyBhY2N1bXVsYXRlZCBhdWRpbyBmb3IgYW4gaW50ZXJpbSAobWlkLXJlY29yZGluZykgdHJhbnNjcmlwdGlvbi5cbiAgICAgKiAgVGhlIHJlc3VsdCByZXBsYWNlcyB0aGUgdGV4dCBhZnRlciBwcmVSZWNvcmRpbmdUZXh0LlxuICAgICAqICBPbmx5IG9uZSBpbnRlcmltIHJlcXVlc3QgcnVucyBhdCBhIHRpbWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYXVkaW9CbG9iIFRoZSBhdWRpbyBkYXRhIHRvIGJlIHNlbnQgZm9yIGludGVyaW0gdHJhbnNjcmlwdGlvbi4gKi9cbiAgICBjb25zdCBzZW5kSW50ZXJpbVRyYW5zY3JpcHRpb24gPSBhc3luYyAoYXVkaW9CbG9iOiBCbG9iKSA9PiB7XG4gICAgICBpZiAoaW50ZXJpbUluRmxpZ2h0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaW50ZXJpbUluRmxpZ2h0ID0gdHJ1ZTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgbGV0IGJsb2IgPSBhdWRpb0Jsb2I7XG5cbiAgICAgICAgaWYgKCFNZWRpYV9JbnB1dF9TcGVlY2hfV2hpc3Blci5jb252ZXJ0U3VwcG9ydGVkKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGJsb2IgPSBhd2FpdCBjb252ZXJ0VG9XYXYoYmxvYik7XG4gICAgICAgICAgfSBjYXRjaCAoWCkge1xuICAgICAgICAgICAgaW50ZXJpbUluRmxpZ2h0ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkYXRhVXJsID0gYXdhaXQgbmV3IFByb21pc2U8c3RyaW5nPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblxuICAgICAgICAgIHJlYWRlci5vbmxvYWRlbmQgPSAoKSA9PiByZXNvbHZlKHJlYWRlci5yZXN1bHQgYXMgc3RyaW5nKTtcbiAgICAgICAgICByZWFkZXIub25lcnJvciA9ICgpID0+IHJlamVjdChuZXcgRXJyb3IoXCJGYWlsZWQgdG8gcmVhZCBhdWRpbyBibG9iXCIpKTtcbiAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChibG9iKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcblxuICAgICAgICBmb3JtRGF0YS5hcHBlbmQoXCJjb2RiaS1iYXNlNjQ6YXVkaW9cIiwgZGF0YVVybCk7XG5cbiAgICAgICAgY29uc3QgYWpheEhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcblxuICAgICAgICBpZiAobGFuZykge1xuICAgICAgICAgIGFqYXhIZWFkZXJzW1wiWC1MYW5ndWFnZVwiXSA9IGxhbmc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCAkID0gZ2V0SlF1ZXJ5KCk7XG5cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICB1cmw6IHBsdWdpblVybCxcbiAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcbiAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICBoZWFkZXJzOiBhamF4SGVhZGVycyxcbiAgICAgICAgICBzdWNjZXNzOiAocmVzcG9uc2U6IHVua25vd24pID0+IHtcbiAgICAgICAgICAgIGlmICghaXNSZWNvcmRpbmcpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSAodHlwZW9mIHJlc3BvbnNlID09PSBcInN0cmluZ1wiID8gSlNPTi5wYXJzZShyZXNwb25zZSkgOiByZXNwb25zZSkgYXMge1xuICAgICAgICAgICAgICB0ZXh0Pzogc3RyaW5nO1xuICAgICAgICAgICAgICBlcnJvcj86IHN0cmluZztcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHQudGV4dCkge1xuICAgICAgICAgICAgICBjb25zdCBzZXBhcmF0b3IgPSBwcmVSZWNvcmRpbmdUZXh0ICYmICFwcmVSZWNvcmRpbmdUZXh0LmVuZHNXaXRoKFwiIFwiKSA/IFwiIFwiIDogXCJcIjtcblxuICAgICAgICAgICAgICBmaWVsZC52YWx1ZSA9IHByZVJlY29yZGluZ1RleHQgKyBzZXBhcmF0b3IgKyByZXN1bHQudGV4dC50cmltKCk7XG4gICAgICAgICAgICAgIGZpZWxkLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwiaW5wdXRcIiwgeyBidWJibGVzOiB0cnVlIH0pKTtcblxuICAgICAgICAgICAgICBpZiAoZmllbGQudGFnTmFtZS50b1VwcGVyQ2FzZSgpID09PSBcIlRFWFRBUkVBXCIpIHtcbiAgICAgICAgICAgICAgICBmaWVsZC5zdHlsZS5oZWlnaHQgPSBcImF1dG9cIjtcbiAgICAgICAgICAgICAgICBmaWVsZC5zdHlsZS5oZWlnaHQgPSBgJHtmaWVsZC5zY3JvbGxIZWlnaHR9cHhgO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBjb21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgaW50ZXJpbUluRmxpZ2h0ID0gZmFsc2U7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChYKSB7XG4gICAgICAgIGludGVyaW1JbkZsaWdodCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBzdGFydFJlY29yZGluZyA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHsgYXVkaW86IHRydWUgfSk7XG5cbiAgICAgICAgYXVkaW9DaHVua3MgPSBbXTtcbiAgICAgICAgbWVkaWFSZWNvcmRlciA9IG5ldyBNZWRpYVJlY29yZGVyKHN0cmVhbSwgeyBtaW1lVHlwZTogcHJlZmVycmVkTWltZVR5cGUoKSB9KTtcblxuICAgICAgICBtZWRpYVJlY29yZGVyLm9uZGF0YWF2YWlsYWJsZSA9IChldmVudDogQmxvYkV2ZW50KSA9PiB7XG4gICAgICAgICAgaWYgKGV2ZW50LmRhdGEuc2l6ZSA+IDApIHtcbiAgICAgICAgICAgIGF1ZGlvQ2h1bmtzLnB1c2goZXZlbnQuZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIG1lZGlhUmVjb3JkZXIub25zdG9wID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGZvciAoY29uc3QgdHJhY2sgb2Ygc3RyZWFtLmdldFRyYWNrcygpKSB7XG4gICAgICAgICAgICB0cmFjay5zdG9wKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGludGVyaW1JbnRlcnZhbCkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcmltSW50ZXJ2YWwpO1xuXG4gICAgICAgICAgICBpbnRlcmltSW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhdWRpb0NodW5rcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgYXVkaW9CbG9iID0gbmV3IEJsb2IoYXVkaW9DaHVua3MsIHsgdHlwZTogbWVkaWFSZWNvcmRlcj8ubWltZVR5cGUgPz8gXCJhdWRpby93ZWJtXCIgfSk7XG4gICAgICAgICAgLy8gI3JlZ2lvbiBTZW5kIFdBViBpZiBubyBGRk1QRUcgc3VwcG9ydC5cbiAgICAgICAgICBpZiAoIU1lZGlhX0lucHV0X1NwZWVjaF9XaGlzcGVyLmNvbnZlcnRTdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGF1ZGlvQmxvYiA9IGF3YWl0IGNvbnZlcnRUb1dhdihhdWRpb0Jsb2IpO1xuICAgICAgICAgICAgfSBjYXRjaCAoWCkge1xuICAgICAgICAgICAgICB3aW5kb3cuY29kYmkubG9nKFxuICAgICAgICAgICAgICAgIFwiRVJST1JcIixcbiAgICAgICAgICAgICAgICBgV0FWIGNvbnZlcnNpb24gZmFpbGVkOiAke1ggaW5zdGFuY2VvZiBFcnJvciA/IFgubWVzc2FnZSA6IFN0cmluZyhYKX1gLFxuICAgICAgICAgICAgICAgIFwiTUVESUEgLyBJTlBVVCAvIFNQRUVDSCAvIFdISVNQRVJcIixcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyAjZW5kcmVnaW9uIFNlbmQgV0FWIGlmIG5vIEZGTVBFRyBzdXBwb3J0LlxuICAgICAgICAgIH1cblxuICAgICAgICAgIHNlbmRGb3JUcmFuc2NyaXB0aW9uKGF1ZGlvQmxvYik7XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJlUmVjb3JkaW5nVGV4dCA9IGZpZWxkLnZhbHVlO1xuXG4gICAgICAgIG1lZGlhUmVjb3JkZXIuc3RhcnQoKTtcblxuICAgICAgICBpc1JlY29yZGluZyA9IHRydWU7XG5cbiAgICAgICAgbWljQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJNRURJQV9XaGlzcGVyX01pY0J1dHRvbi0tcmVjb3JkaW5nXCIpO1xuXG4gICAgICAgIC8vICNyZWdpb24gUGVyaW9kaWMgaW50ZXJpbSB0cmFuc2NyaXB0aW9uLlxuICAgICAgICBjb25zdCByZWMgPSBtZWRpYVJlY29yZGVyO1xuXG4gICAgICAgIGludGVyaW1JbnRlcnZhbCA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgaWYgKGludGVyaW1JbkZsaWdodCB8fCByZWMuc3RhdGUgIT09IFwicmVjb3JkaW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZWMucmVxdWVzdERhdGEoKTtcblxuICAgICAgICAgIGlmIChhdWRpb0NodW5rcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoYXVkaW9DaHVua3MsIHsgdHlwZTogcmVjLm1pbWVUeXBlIH0pO1xuXG4gICAgICAgICAgc2VuZEludGVyaW1UcmFuc2NyaXB0aW9uKGJsb2IpO1xuICAgICAgICB9LCAyNTAwKTtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBQZXJpb2RpYyBpbnRlcmltIHRyYW5zY3JpcHRpb24uXG4gICAgICB9IGNhdGNoIChYKSB7XG4gICAgICAgIG1pY0J1dHRvbi5jbGFzc0xpc3QuYWRkKFwiTUVESUFfV2hpc3Blcl9NaWNCdXR0b24tLXVuYXZhaWxhYmxlXCIpO1xuXG4gICAgICAgIG1pY0J1dHRvbi50aXRsZSA9IFwiTWljcm9waG9uZSBhY2Nlc3MgZGVuaWVkXCI7XG4gICAgICAgIG1pY0J1dHRvbi5kaXNhYmxlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfTtcbiAgICAvKiogU3RvcHMgdGhlIHJlY29yZGluZywgc2VuZHMgdGhlIGZpbmFsIGF1ZGlvIGZvciB0cmFuc2NyaXB0aW9uLCBhbmQgcmVzZXRzIHRoZSBVSSBzdGF0ZS4gKi9cbiAgICBjb25zdCBzdG9wUmVjb3JkaW5nID0gKCkgPT4ge1xuICAgICAgaWYgKGludGVyaW1JbnRlcnZhbCkge1xuICAgICAgICBjbGVhckludGVydmFsKGludGVyaW1JbnRlcnZhbCk7XG5cbiAgICAgICAgaW50ZXJpbUludGVydmFsID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKG1lZGlhUmVjb3JkZXIgJiYgbWVkaWFSZWNvcmRlci5zdGF0ZSAhPT0gXCJpbmFjdGl2ZVwiKSB7XG4gICAgICAgIG1lZGlhUmVjb3JkZXIuc3RvcCgpO1xuICAgICAgfVxuXG4gICAgICBpc1JlY29yZGluZyA9IGZhbHNlO1xuXG4gICAgICBtaWNCdXR0b24uY2xhc3NMaXN0LnJlbW92ZShcIk1FRElBX1doaXNwZXJfTWljQnV0dG9uLS1yZWNvcmRpbmdcIik7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBTZW5kcyB0aGUgZmluYWwgYXVkaW8gZm9yIHRyYW5zY3JpcHRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYXVkaW9CbG9iIFRoZSBhdWRpbyBibG9iIHRvIGJlIHRyYW5zY3JpYmVkLiAqL1xuICAgIGNvbnN0IHNlbmRGb3JUcmFuc2NyaXB0aW9uID0gYXN5bmMgKGF1ZGlvQmxvYjogQmxvYikgPT4ge1xuICAgICAgaXNUcmFuc2NyaWJpbmcgPSB0cnVlO1xuXG4gICAgICBtaWNCdXR0b24uY2xhc3NMaXN0LmFkZChcIk1FRElBX1doaXNwZXJfTWljQnV0dG9uLS10cmFuc2NyaWJpbmdcIik7XG5cbiAgICAgIG1pY0J1dHRvbi5kaXNhYmxlZCA9IHRydWU7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIC8vICNyZWdpb24gQ29udmVydCBhdWRpbyBibG9iIHRvIGJhc2U2NCBkYXRhLVVSTC5cbiAgICAgICAgY29uc3QgZGF0YVVybCA9IGF3YWl0IG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cbiAgICAgICAgICByZWFkZXIub25sb2FkZW5kID0gKCkgPT4gcmVzb2x2ZShyZWFkZXIucmVzdWx0IGFzIHN0cmluZyk7XG4gICAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSAoKSA9PiByZWplY3QobmV3IEVycm9yKFwiRmFpbGVkIHRvIHJlYWQgYXVkaW8gYmxvYlwiKSk7XG5cbiAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChhdWRpb0Jsb2IpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBDb252ZXJ0IGF1ZGlvIGJsb2IgdG8gYmFzZTY0IGRhdGEtVVJMLlxuICAgICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuXG4gICAgICAgIGZvcm1EYXRhLmFwcGVuZChcImNvZGJpLWJhc2U2NDphdWRpb1wiLCBkYXRhVXJsKTtcblxuICAgICAgICBjb25zdCBhamF4SGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gICAgICAgIGlmIChsYW5nKSB7XG4gICAgICAgICAgYWpheEhlYWRlcnNbXCJYLUxhbmd1YWdlXCJdID0gbGFuZztcbiAgICAgICAgfVxuICAgICAgICAvLyAjcmVnaW9uIEFKQVggcmVxdWVzdCB0byB0cmFuc2NyaWJlIGF1ZGlvLlxuICAgICAgICBnZXRKUXVlcnkoKS5hamF4KHtcbiAgICAgICAgICB1cmw6IHBsdWdpblVybCxcbiAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcbiAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICBoZWFkZXJzOiBhamF4SGVhZGVycyxcbiAgICAgICAgICBzdWNjZXNzOiAocmVzcG9uc2U6IHVua25vd24pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9ICh0eXBlb2YgcmVzcG9uc2UgPT09IFwic3RyaW5nXCIgPyBKU09OLnBhcnNlKHJlc3BvbnNlKSA6IHJlc3BvbnNlKSBhcyB7XG4gICAgICAgICAgICAgIHRleHQ/OiBzdHJpbmc7XG4gICAgICAgICAgICAgIGVycm9yPzogc3RyaW5nO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5lcnJvcikge1xuICAgICAgICAgICAgICB3aW5kb3cuY29kYmkubG9nKFwiRVJST1JcIiwgYFdoaXNwZXI6ICR7cmVzdWx0LmVycm9yfWAsIFwiTUVESUEgLyBJTlBVVCAvIFNQRUVDSCAvIFdISVNQRVJcIik7XG5cbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmVzdWx0LnRleHQpIHtcbiAgICAgICAgICAgICAgY29uc3Qgc2VwYXJhdG9yID0gcHJlUmVjb3JkaW5nVGV4dCAmJiAhcHJlUmVjb3JkaW5nVGV4dC5lbmRzV2l0aChcIiBcIikgPyBcIiBcIiA6IFwiXCI7XG5cbiAgICAgICAgICAgICAgZmllbGQudmFsdWUgPSBwcmVSZWNvcmRpbmdUZXh0ICsgc2VwYXJhdG9yICsgcmVzdWx0LnRleHQudHJpbSgpO1xuXG4gICAgICAgICAgICAgIGZpZWxkLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwiY2hhbmdlXCIsIHsgYnViYmxlczogdHJ1ZSB9KSk7XG4gICAgICAgICAgICAgIGZpZWxkLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwiaW5wdXRcIiwgeyBidWJibGVzOiB0cnVlIH0pKTtcblxuICAgICAgICAgICAgICBpZiAoZmllbGQudGFnTmFtZS50b1VwcGVyQ2FzZSgpID09PSBcIlRFWFRBUkVBXCIpIHtcbiAgICAgICAgICAgICAgICBmaWVsZC5zdHlsZS5oZWlnaHQgPSBcImF1dG9cIjtcbiAgICAgICAgICAgICAgICBmaWVsZC5zdHlsZS5oZWlnaHQgPSBgJHtmaWVsZC5zY3JvbGxIZWlnaHR9cHhgO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBlcnJvcjogKF94aHI6IHVua25vd24sIF9zdGF0dXM6IHVua25vd24sIGVycm9yOiB1bmtub3duKSA9PiB7XG4gICAgICAgICAgICB3aW5kb3cuY29kYmkubG9nKFxuICAgICAgICAgICAgICBcIkVSUk9SXCIsXG4gICAgICAgICAgICAgIGBXaGlzcGVyIHRyYW5zY3JpcHRpb24gZmFpbGVkOiAke1N0cmluZyhlcnJvcil9YCxcbiAgICAgICAgICAgICAgXCJNRURJQSAvIElOUFVUIC8gU1BFRUNIIC8gV0hJU1BFUlwiLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICBpc1RyYW5zY3JpYmluZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICBtaWNCdXR0b24uY2xhc3NMaXN0LnJlbW92ZShcIk1FRElBX1doaXNwZXJfTWljQnV0dG9uLS10cmFuc2NyaWJpbmdcIik7XG4gICAgICAgICAgICBtaWNCdXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBBSkFYIHJlcXVlc3QgdG8gdHJhbnNjcmliZSBhdWRpby5cbiAgICAgIH0gY2F0Y2ggKFgpIHtcbiAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcbiAgICAgICAgICBcIkVSUk9SXCIsXG4gICAgICAgICAgYFdoaXNwZXIgdHJhbnNjcmlwdGlvbiBmYWlsZWQ6ICR7WCBpbnN0YW5jZW9mIEVycm9yID8gWC5tZXNzYWdlIDogU3RyaW5nKFgpfWAsXG4gICAgICAgICAgXCJNRURJQSAvIElOUFVUIC8gU1BFRUNIIC8gV0hJU1BFUlwiLFxuICAgICAgICApO1xuXG4gICAgICAgIGlzVHJhbnNjcmliaW5nID0gZmFsc2U7XG5cbiAgICAgICAgbWljQnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoXCJNRURJQV9XaGlzcGVyX01pY0J1dHRvbi0tdHJhbnNjcmliaW5nXCIpO1xuXG4gICAgICAgIG1pY0J1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH07XG4gICAgLy8gI2VuZHJlZ2lvbiBNZWRpYVJlY29yZGVyLVNldHVwLlxuICAgIC8vICNyZWdpb24gVG9nZ2xlIHJlY29yZGluZy5cbiAgICBjb25zdCB0b2dnbGVSZWNvcmRpbmcgPSAoKSA9PiB7XG4gICAgICBpZiAobWljQnV0dG9uLmRpc2FibGVkIHx8IGlzVHJhbnNjcmliaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzUmVjb3JkaW5nKSB7XG4gICAgICAgIHN0b3BSZWNvcmRpbmcoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXJ0UmVjb3JkaW5nKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIG1pY0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdG9nZ2xlUmVjb3JkaW5nKTtcbiAgICAvLyAjZW5kcmVnaW9uIFRvZ2dsZSByZWNvcmRpbmcuXG4gICAgLy8gI3JlZ2lvbiBIb3RrZXlzLURlZmluaXRpb24uXG4gICAgY29uc3QgaG90a2V5RGVmID0gKHR5cGVvZiB0b0xvYWQudm9pY2Vob3RrZXkgPT09IFwic3RyaW5nXCIgJiYgdG9Mb2FkLnZvaWNlaG90a2V5LnRyaW0oKSkgfHwgXCJBbHQrQVwiO1xuICAgIGNvbnN0IGhvdGtleVBhcnRzID0gaG90a2V5RGVmLnNwbGl0KFwiK1wiKS5tYXAoKHA6IHN0cmluZykgPT4gcC50cmltKCkpO1xuICAgIGNvbnN0IGhvdGtleUtleSA9IGhvdGtleVBhcnRzW2hvdGtleVBhcnRzLmxlbmd0aCAtIDFdLnRvVXBwZXJDYXNlKCk7XG4gICAgY29uc3QgbmVlZEFsdCA9IGhvdGtleVBhcnRzLnNvbWUoKHA6IHN0cmluZykgPT4gL15hbHQkL2kudGVzdChwKSk7XG4gICAgY29uc3QgbmVlZEN0cmwgPSBob3RrZXlQYXJ0cy5zb21lKChwOiBzdHJpbmcpID0+IC9eY3RybCQvaS50ZXN0KHApKTtcbiAgICBjb25zdCBuZWVkU2hpZnQgPSBob3RrZXlQYXJ0cy5zb21lKChwOiBzdHJpbmcpID0+IC9ec2hpZnQkL2kudGVzdChwKSk7XG4gICAgY29uc3QgbmVlZE1ldGEgPSBob3RrZXlQYXJ0cy5zb21lKChwOiBzdHJpbmcpID0+IC9ebWV0YSQvaS50ZXN0KHApKTtcblxuICAgIG1pY0J1dHRvbi50aXRsZSA9IGBWb2ljZSBpbnB1dCBcdTIwMTQgV2hpc3BlciAoJHtob3RrZXlEZWZ9KWA7XG5cbiAgICBNZWRpYV9JbnB1dF9TcGVlY2hfV2hpc3Blci5pbnN0YW5jZXMucHVzaCh7IGZpZWxkLCB0b2dnbGU6IHRvZ2dsZVJlY29yZGluZyB9KTtcblxuICAgIGlmICghTWVkaWFfSW5wdXRfU3BlZWNoX1doaXNwZXIuaG90a2V5UmVnaXN0ZXJlZCkge1xuICAgICAgTWVkaWFfSW5wdXRfU3BlZWNoX1doaXNwZXIuaG90a2V5UmVnaXN0ZXJlZCA9IHRydWU7XG5cbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBlLmtleS50b1VwcGVyQ2FzZSgpID09PSBob3RrZXlLZXkgJiZcbiAgICAgICAgICBlLmFsdEtleSA9PT0gbmVlZEFsdCAmJlxuICAgICAgICAgIGUuY3RybEtleSA9PT0gbmVlZEN0cmwgJiZcbiAgICAgICAgICBlLnNoaWZ0S2V5ID09PSBuZWVkU2hpZnQgJiZcbiAgICAgICAgICBlLm1ldGFLZXkgPT09IG5lZWRNZXRhXG4gICAgICAgICkge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgIGNvbnN0IGFjdGl2ZSA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG5cbiAgICAgICAgICBpZiAoYWN0aXZlPy5jbG9zZXN0KFwiLkxMQU1BX0NoYXRfSW5wdXRXcmFwcGVyXCIpIHx8IGFjdGl2ZT8uY2xvc2VzdChcIi5NRURJQV9TcGVlY2hfSW5wdXRXcmFwcGVyXCIpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgZm9jdXNlZCA9IE1lZGlhX0lucHV0X1NwZWVjaF9XaGlzcGVyLmluc3RhbmNlcy5maW5kKChpbnN0KSA9PiBpbnN0LmZpZWxkID09PSBhY3RpdmUpO1xuXG4gICAgICAgICAgaWYgKGZvY3VzZWQpIHtcbiAgICAgICAgICAgIGZvY3VzZWQudG9nZ2xlKCk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBmaXJzdCA9IE1lZGlhX0lucHV0X1NwZWVjaF9XaGlzcGVyLmluc3RhbmNlc1swXTtcblxuICAgICAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICAgICAgZmlyc3QuZmllbGQuZm9jdXMoKTtcbiAgICAgICAgICAgIGZpcnN0LnRvZ2dsZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IHNob3dIaW50ID0gdG9Mb2FkLnNob3doaW50ICE9IG51bGwgJiYgU3RyaW5nKHRvTG9hZC5zaG93aGludCkudG9Mb3dlckNhc2UoKSA9PT0gXCJ0cnVlXCI7XG5cbiAgICBpZiAoc2hvd0hpbnQpIHtcbiAgICAgIGZpZWxkLnBsYWNlaG9sZGVyID1cbiAgICAgICAgKHR5cGVvZiB0b0xvYWQucGxhY2Vob2xkZXIgPT09IFwic3RyaW5nXCIgJiYgdG9Mb2FkLnBsYWNlaG9sZGVyLnRyaW0oKSkgfHxcbiAgICAgICAgYFxcdUQ4M0NcXHVERjk5XFx1RkUwRiAke2hvdGtleURlZn0gKFdoaXNwZXIpYDtcbiAgICB9XG5cbiAgICBjb25zdCBsb2FkZXJBbmltID0gaW5wdXRXcmFwcGVyLnBhcmVudEVsZW1lbnQ/LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICBgLmNDb2RCaUxvYWRlcltjYkZPUj1cIiR7ZmllbGQuZ2V0QXR0cmlidXRlKFwiZGF0YS1uYW1lXCIpfVwiXWAsXG4gICAgKTtcblxuICAgIGlmIChsb2FkZXJBbmltKSB7XG4gICAgICBsb2FkZXJBbmltLnJlbW92ZSgpO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIEhvdGtleXMtRGVmaW5pdGlvbi5cbiAgfVxuICAvLyAjcmVnaW9uIFBsdWdpbiBVUkwtUmVzb2x1dGlvbi5cbiAgLyoqXG4gICAqIFJlc29sdmVzIHRoZSBDb2RCaSBwbHVnaW4gc2VydmxldCBVUkwgZm9yIHRoZSBXaGlzcGVyIGVuZHBvaW50LlxuICAgKiBVc2VzIHRoZSBzYW1lIFVSTCBwYXR0ZXJuIGFzIG90aGVyIENvZEJpIEFJIHNlcnZsZXRzOiBgL3BsdWdpbj9uYW1lPUNvZEJpX0FJX1doaXNwZXJgICovXG4gIHByaXZhdGUgc3RhdGljIHJlc29sdmVQbHVnaW5VcmwoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBgJHt3aW5kb3cuY29kYmkuYmFzZVVSTH1wbHVnaW4/bmFtZT1Db2RCaV9BSV9XaGlzcGVyYDtcbiAgICB9IGNhdGNoIChYKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbiAgLy8gI2VuZHJlZ2lvbiBQbHVnaW4gVVJMLVJlc29sdXRpb24uXG4gIC8vICNyZWdpb24gTUlNRS1UeXBlLURldGVjdGlvbiBcdTIwMTQgc2VlIC4uL2NvbW1vbnMvd2hpc3Blci11dGlscy50c1xuICAvLyAjcmVnaW9uIEhlYWx0aC1DaGVjay5cbiAgcHJpdmF0ZSBzdGF0aWMgcXVlcnlIZWFsdGhDaGVjayhwbHVnaW5Vcmw6IHN0cmluZyk6IHZvaWQge1xuICAgIE1lZGlhX0lucHV0X1NwZWVjaF9XaGlzcGVyLnJldHJ5UGx1Z2luVXJsID0gcGx1Z2luVXJsO1xuICAgIC8vICNyZWdpb24gQUpBWCByZXF1ZXN0IHRvIGNoZWNrIHNlcnZlciBoZWFsdGggYW5kIGZmbXBlZyBzdXBwb3J0LlxuICAgIHRyeSB7XG4gICAgICBjb25zdCAkID0gZ2V0SlF1ZXJ5KCk7XG4gICAgICAkLmFqYXgoe1xuICAgICAgICB1cmw6IHBsdWdpblVybCxcbiAgICAgICAgdHlwZTogXCJHRVRcIixcbiAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICBoZWFkZXJzOiB7IFwiWC1IZWFsdGgtQ2hlY2tcIjogXCJ0cnVlXCIgfSxcbiAgICAgICAgc3VjY2VzczogKHJlc3BvbnNlOiB1bmtub3duKSA9PiB7XG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0gKHR5cGVvZiByZXNwb25zZSA9PT0gXCJzdHJpbmdcIiA/IEpTT04ucGFyc2UocmVzcG9uc2UpIDogcmVzcG9uc2UpIGFzIHtcbiAgICAgICAgICAgIGNvbnZlcnRTdXBwb3J0ZWQ/OiBib29sZWFuO1xuICAgICAgICAgICAgc3RhdHVzPzogc3RyaW5nO1xuICAgICAgICAgICAgZXJyb3I/OiBzdHJpbmc7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGlmIChyZXN1bHQuZXJyb3IgfHwgcmVzdWx0LnN0YXR1cyAhPT0gXCJyZWFkeVwiKSB7XG4gICAgICAgICAgICBNZWRpYV9JbnB1dF9TcGVlY2hfV2hpc3Blci5oYW5kbGVPZmZsaW5lKCk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBNZWRpYV9JbnB1dF9TcGVlY2hfV2hpc3Blci5oYW5kbGVPbmxpbmUoKTtcblxuICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0LmNvbnZlcnRTdXBwb3J0ZWQgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgICAgICBNZWRpYV9JbnB1dF9TcGVlY2hfV2hpc3Blci5jb252ZXJ0U3VwcG9ydGVkID0gcmVzdWx0LmNvbnZlcnRTdXBwb3J0ZWQ7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlcnJvcjogKCkgPT4ge1xuICAgICAgICAgIE1lZGlhX0lucHV0X1NwZWVjaF9XaGlzcGVyLmhhbmRsZU9mZmxpbmUoKTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgLy8gI2VuZHJlZ2lvbiBBSkFYIHJlcXVlc3QgdG8gY2hlY2sgc2VydmVyIGhlYWx0aCBhbmQgZmZtcGVnIHN1cHBvcnQuXG4gICAgfSBjYXRjaCAoWCkge1xuICAgICAgTWVkaWFfSW5wdXRfU3BlZWNoX1doaXNwZXIuaGFuZGxlT2ZmbGluZSgpO1xuICAgIH1cbiAgfVxuICAvKiogTWFya3MgdGhlIHNlcnZlciBhcyBvZmZsaW5lLCBoaWRlcyBhbGwgbWljIGJ1dHRvbnMsIGFuZCBzY2hlZHVsZXMgYSBwZXJpb2RpYyByZXRyeSBldmVyeSAzMCBzZWNvbmRzLiAqL1xuICBwcml2YXRlIHN0YXRpYyBoYW5kbGVPZmZsaW5lKCk6IHZvaWQge1xuICAgIE1lZGlhX0lucHV0X1NwZWVjaF9XaGlzcGVyLnNlcnZlclJlYWR5ID0gZmFsc2U7XG5cbiAgICBmb3IgKGNvbnN0IGJ0biBvZiBNZWRpYV9JbnB1dF9TcGVlY2hfV2hpc3Blci5wZW5kaW5nTWljQnV0dG9ucykge1xuICAgICAgYnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICB9XG5cbiAgICBNZWRpYV9JbnB1dF9TcGVlY2hfV2hpc3Blci5wZW5kaW5nTWljQnV0dG9ucy5sZW5ndGggPSAwO1xuXG4gICAgZm9yIChjb25zdCBidG4gb2YgTWVkaWFfSW5wdXRfU3BlZWNoX1doaXNwZXIuYWxsTWljQnV0dG9ucykge1xuICAgICAgYnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICB9XG5cbiAgICBpZiAoIU1lZGlhX0lucHV0X1NwZWVjaF9XaGlzcGVyLnJldHJ5VGltZXIpIHtcbiAgICAgIE1lZGlhX0lucHV0X1NwZWVjaF9XaGlzcGVyLnJldHJ5VGltZXIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICBpZiAoTWVkaWFfSW5wdXRfU3BlZWNoX1doaXNwZXIucmV0cnlQbHVnaW5VcmwpIHtcbiAgICAgICAgICBNZWRpYV9JbnB1dF9TcGVlY2hfV2hpc3Blci5xdWVyeUhlYWx0aENoZWNrKE1lZGlhX0lucHV0X1NwZWVjaF9XaGlzcGVyLnJldHJ5UGx1Z2luVXJsKTtcbiAgICAgICAgfVxuICAgICAgfSwgMzBfMDAwKTtcbiAgICB9XG4gIH1cbiAgLyoqIE1hcmtzIHRoZSBzZXJ2ZXIgYXMgb25saW5lLCBzaG93cyBhbGwgbWljIGJ1dHRvbnMsIGFuZCBzdG9wcyB0aGUgcmV0cnkgdGltZXIuICovXG4gIHByaXZhdGUgc3RhdGljIGhhbmRsZU9ubGluZSgpOiB2b2lkIHtcbiAgICBNZWRpYV9JbnB1dF9TcGVlY2hfV2hpc3Blci5zZXJ2ZXJSZWFkeSA9IHRydWU7XG4gICAgTWVkaWFfSW5wdXRfU3BlZWNoX1doaXNwZXIucGVuZGluZ01pY0J1dHRvbnMubGVuZ3RoID0gMDtcblxuICAgIGZvciAoY29uc3QgYnRuIG9mIE1lZGlhX0lucHV0X1NwZWVjaF9XaGlzcGVyLmFsbE1pY0J1dHRvbnMpIHtcbiAgICAgIGJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICB9XG5cbiAgICBpZiAoTWVkaWFfSW5wdXRfU3BlZWNoX1doaXNwZXIucmV0cnlUaW1lcikge1xuICAgICAgY2xlYXJJbnRlcnZhbChNZWRpYV9JbnB1dF9TcGVlY2hfV2hpc3Blci5yZXRyeVRpbWVyKTtcblxuICAgICAgTWVkaWFfSW5wdXRfU3BlZWNoX1doaXNwZXIucmV0cnlUaW1lciA9IDA7XG4gICAgfVxuICB9XG4gIC8vICNlbmRyZWdpb24gSGVhbHRoLUNoZWNrLlxuICAvLyAjcmVnaW9uIFdBViBjb252ZXJzaW9uIFx1MjAxNCBzZWUgLi4vY29tbW9ucy93aGlzcGVyLXV0aWxzLnRzXG4gIC8vICNyZWdpb24gU3R5bGVzXG4gIHByaXZhdGUgc3RhdGljIGVuc3VyZVN0eWxlcygpOiB2b2lkIHtcbiAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNNRURJQV9XaGlzcGVyX1N0eWxlc1wiKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuXG4gICAgc3R5bGUuaWQgPSBcIk1FRElBX1doaXNwZXJfU3R5bGVzXCI7XG4gICAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4gICAgICAuTUVESUFfV2hpc3Blcl9JbnB1dFdyYXBwZXIgeyBwb3NpdGlvbjogcmVsYXRpdmUgOyBkaXNwbGF5OiBpbmxpbmUtYmxvY2sgOyB3aWR0aDogMTAwJSA7fVxuXG4gICAgICAuTUVESUFfV2hpc3Blcl9JbnB1dFdyYXBwZXIgPiBpbnB1dCxcbiAgICAgIC5NRURJQV9XaGlzcGVyX0lucHV0V3JhcHBlciA+IHRleHRhcmVhIHsgd2lkdGg6IDEwMCUgOyBib3gtc2l6aW5nOiBib3JkZXItYm94IDsgcGFkZGluZy1yaWdodDogMzZweCAhaW1wb3J0YW50IDt9XG5cbiAgICAgIC5NRURJQV9XaGlzcGVyX01pY0J1dHRvbiAgICAgICAgeyBwb3NpdGlvbjogYWJzb2x1dGUgOyByaWdodDogNHB4IDsgdG9wOiA1MCUgOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSkgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAyOHB4IDsgaGVpZ2h0OiAyOHB4IDsgYm9yZGVyOiBub25lIDsgYm9yZGVyLXJhZGl1czogNTAlIDsgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjODg4IDsgY3Vyc29yOiBwb2ludGVyIDsgZGlzcGxheTogZmxleCA7IGFsaWduLWl0ZW1zOiBjZW50ZXIgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyIDsgcGFkZGluZzogMCA7IHRyYW5zaXRpb246IGNvbG9yIDAuMnMsIGJhY2tncm91bmQgMC4ycyA7fVxuICAgICAgLk1FRElBX1doaXNwZXJfTWljQnV0dG9uOmhvdmVyICB7IGNvbG9yOiAjMzMzIDsgYmFja2dyb3VuZDogcmdiYSggMCwgMCwgMCwgMC4wNiApIDt9XG5cbiAgICAgIC5NRURJQV9XaGlzcGVyX01pY0J1dHRvbi0tcmVjb3JkaW5nICAgICAgICAgeyBjb2xvcjogI2ZmZiA7IGJhY2tncm91bmQ6ICNlNTM5MzUgOyBvdmVyZmxvdzogdmlzaWJsZSA7fVxuICAgICAgLk1FRElBX1doaXNwZXJfTWljQnV0dG9uLS1yZWNvcmRpbmc6OmJlZm9yZSxcbiAgICAgIC5NRURJQV9XaGlzcGVyX01pY0J1dHRvbi0tcmVjb3JkaW5nOjphZnRlciAgeyBjb250ZW50OiAnJyA7IHBvc2l0aW9uOiBhYnNvbHV0ZSA7IHRvcDogNTAlIDsgbGVmdDogNTAlIDsgd2lkdGg6IDEwMCUgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogMTAwJSA7IGJvcmRlci1yYWRpdXM6IDUwJSA7IGJvcmRlcjogMnB4IHNvbGlkICNlNTM5MzUgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC01MCUpIHNjYWxlKCAxICkgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogTUVESUFfV2hpc3Blcl9taWNfZmxhcmUgMS44cyBlYXNlLW91dCBpbmZpbml0ZSA7fVxuICAgICAgLk1FRElBX1doaXNwZXJfTWljQnV0dG9uLS1yZWNvcmRpbmc6OmFmdGVyICB7IGFuaW1hdGlvbi1kZWxheTogMC42cyA7fVxuICAgICAgLk1FRElBX1doaXNwZXJfTWljQnV0dG9uLS1yZWNvcmRpbmc6aG92ZXIgICB7IGJhY2tncm91bmQ6ICNjNjI4MjggOyBjb2xvcjogI2ZmZiA7fVxuXG4gICAgICAuTUVESUFfV2hpc3Blcl9NaWNCdXR0b24tLXRyYW5zY3JpYmluZyAgICAgICAgICB7IGNvbG9yOiAjZmZmIDsgYmFja2dyb3VuZDogIzE1NjVjMCA7IHBvaW50ZXItZXZlbnRzOiBub25lIDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3c6IHZpc2libGUgOyB9XG4gICAgICAuTUVESUFfV2hpc3Blcl9NaWNCdXR0b24tLXRyYW5zY3JpYmluZzo6YmVmb3JlLFxuICAgICAgLk1FRElBX1doaXNwZXJfTWljQnV0dG9uLS10cmFuc2NyaWJpbmc6OmFmdGVyICAgeyBjb250ZW50OiAnJyA7IHBvc2l0aW9uOiBhYnNvbHV0ZSA7IHRvcDogNTAlIDsgbGVmdDogNTAlIDsgd2lkdGg6IDEwMCUgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDEwMCUgOyBib3JkZXItcmFkaXVzOiA1MCUgOyBib3JkZXI6IDJweCBzb2xpZCAjMTU2NWMwIDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSkgc2NhbGUoIDEgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBNRURJQV9XaGlzcGVyX21pY19mbGFyZSAxLjhzIGVhc2Utb3V0IGluZmluaXRlIDt9XG4gICAgICAuTUVESUFfV2hpc3Blcl9NaWNCdXR0b24tLXRyYW5zY3JpYmluZzo6YWZ0ZXIgICB7IGFuaW1hdGlvbi1kZWxheTogMC42cyA7fVxuXG4gICAgICAuTUVESUFfV2hpc3Blcl9NaWNCdXR0b24tLXVuYXZhaWxhYmxlIHsgY29sb3I6ICNjY2MgOyBjdXJzb3I6IG5vdC1hbGxvd2VkIDt9XG5cbiAgICAgIC5NRURJQV9XaGlzcGVyX0lucHV0V3JhcHBlcjpoYXMoLk1FRElBX1doaXNwZXJfTWljQnV0dG9uOm5vdChbc3R5bGUqPVwiZGlzcGxheTogbm9uZVwiXSkpIC5MTEFNQV9BSV9IaW50IHsgcmlnaHQ6IDQwcHggIWltcG9ydGFudCA7IH1cbiAgICAgIEBrZXlmcmFtZXMgTUVESUFfV2hpc3Blcl9taWNfZmxhcmUge1xuICAgICAgICAwJSAgIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSkgc2NhbGUoMSkgOyBvcGFjaXR5OiAwLjcgOyB9XG4gICAgICAgIDEwMCUgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtNTAlLCAtNTAlKSBzY2FsZSgyLjgpIDsgb3BhY2l0eTogMCA7IH19YDtcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uIFN0eWxlc1xufVxuLy8gI3JlZ2lvbiBSZWdpc3RlciBmdW5jdGlvbmFsaXR5IHdpdGggQ29kQmlcbndpbmRvdy5jb2RiaS5yZWdpc3RlckZ1bmN0aW9uYWxpdHkoXG4gIFwiTWVkaWEuSW5wdXQuU3BlZWNoLldoaXNwZXJcIixcbiAgTWVkaWFfSW5wdXRfU3BlZWNoX1doaXNwZXIuZnVuY3Rpb25hbGl0eS5iaW5kKE1lZGlhX0lucHV0X1NwZWVjaF9XaGlzcGVyKSxcbik7XG4vLyAjZW5kcmVnaW9uIFJlZ2lzdGVyIGZ1bmN0aW9uYWxpdHkgd2l0aCBDb2RCaVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFTQSw4QkFBMEI7QUFZbkIsSUFBTSw4QkFBTixNQUFNLDRCQUEyQjtBQUFBLEVBRXRDO0FBQUE7QUFBQSxTQUF3QixZQUEwRCxDQUFDO0FBQUE7QUFBQSxFQUVuRjtBQUFBO0FBQUEsU0FBZSxtQkFBbUI7QUFBQTtBQUFBLEVBRWxDO0FBQUE7QUFBQSxTQUFlLG1CQUFtQjtBQUFBO0FBQUEsRUFFbEM7QUFBQTtBQUFBLFNBQWUsZ0JB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
