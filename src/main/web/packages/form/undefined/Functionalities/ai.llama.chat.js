import { convertToWav, preferredMimeType } from "./chunk-OJ4YXXK4.js";
import { OR } from "./chunk-YYG42PYR.js";
import { require_pdf } from "./chunk-SK52DCW2.js";
import { formatWaitTime } from "./chunk-IEBHCVNB.js";
import { CodBiError, generateUUID } from "./chunk-NKLWL4ZS.js";
import { DEFINED } from "./chunk-JP4GUAZX.js";
import { EQ } from "./chunk-RI3LWO6O.js";
import { IF } from "./chunk-2VQP2CFN.js";
import { REGEX } from "./chunk-F3IDEOQS.js";
import { TYPE } from "./chunk-O5T7YW22.js";
import { INSTANCE } from "./chunk-53TEMTGA.js";
import { DBC } from "./chunk-LFRFVRJV.js";
import { require_dist } from "./chunk-ZTMSSRTV.js";
import { __decorateClass, __decorateParam, __toESM } from "./chunk-AOJQKO6T.js";

// src/js/Functionalities/ai.llama.chat.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var pdfjsLib = __toESM(require_pdf(), 1);
var _AI_LLAMA_CHAT = class _AI_LLAMA_CHAT {
  static functionality(toLoad, toProcess) {
    const $ = (0, import_fc_form_renderer.getJQuery)();
    const chatDisplay = toProcess;
    const aiHintText = toLoad.aihint != null ? String(toLoad.aihint) : "\u2728 AI-Generated";
    const responseLang = toLoad.responselanguage != null ? String(toLoad.responselanguage).trim() : "";
    const specialist = toLoad.specialist != null ? String(toLoad.specialist).trim() : "";
    const filterResults = toLoad.filterresults != null ? String(toLoad.filterresults).toLowerCase() === "true" : null;
    chatDisplay.readOnly = true;
    chatDisplay.style.display = "none";
    _AI_LLAMA_CHAT.ensureChatBubbleStyles();
    const chatContainer = document.createElement("div");
    chatContainer.className = "LLAMA_Chat_Container";
    if (toLoad.llamabubble != null) {
      chatContainer.style.setProperty("--llama-bubble-bg", String(toLoad.llamabubble));
    }
    if (toLoad.userbubble != null) {
      chatContainer.style.setProperty("--user-bubble-bg", String(toLoad.userbubble));
    }
    if (toLoad.maxchatwindowheight != null) {
      chatContainer.style.maxHeight = `${String(toLoad.maxchatwindowheight)}px`;
    }
    chatDisplay.parentElement?.insertBefore(chatContainer, chatDisplay.nextSibling);
    let container = toProcess.parentElement;
    while (container && container !== document.body) {
      if (container.querySelector(".AI_LLAMA_CHAT_Input") && container.querySelector(".AI_LLAMA_CHAT_Send")) {
        break;
      }
      container = container.parentElement;
    }
    if (!container || container === document.body) {
      window.codbi.log(
        "ERROR",
        "Could not find a container with .AI_LLAMA_CHAT_Input and .AI_LLAMA_CHAT_Send elements. Ensure these elements exist within a common ancestor of the chat display textarea.",
        "AI / LLAMA / CHAT",
      );
      return;
    }
    const chatInput = OR.tsCheck(
      DEFINED.tsCheck(container.querySelector(".AI_LLAMA_CHAT_Input")),
      [new INSTANCE(HTMLInputElement), new INSTANCE(HTMLTextAreaElement)],
      'Is there a chat input element tagged with CSS-Class "AI_LLAMA_CHAT_Input" in the same container as the conversation window?',
    );
    const sendButton = INSTANCE.tsCheck(
      DEFINED.tsCheck(container.querySelector(".AI_LLAMA_CHAT_Send")),
      HTMLButtonElement,
      'Is there a send button element tagged with CSS-Class "AI_LLAMA_CHAT_Send" in the same container as the conversation window?',
    );
    const stopButton = INSTANCE.tsCheck(
      container.querySelector(".AI_LLAMA_CHAT_Stop"),
      HTMLButtonElement,
      `Isn't the element tagged with ".AI_LLAMA_CHAT_Stop" a <button>?`,
    );
    const fileUpload = INSTANCE.tsCheck(
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
    const thinkingCheckbox = INSTANCE.tsCheck(
      container.querySelector(".AI_LLAMA_CHAT_Thinking"),
      HTMLInputElement,
      `Isn't the element tagged with ".AI_LLAMA_CHAT_Thinking" an <input> (checkbox)?`,
    );
    if (thinkingCheckbox) {
      EQ.tsCheck(
        thinkingCheckbox.type,
        "checkbox",
        `Isn't the element tagged with ".AI_LLAMA_CHAT_Thinking" an <input> of type "checkbox"?`,
      );
    }
    const searchCheckbox = INSTANCE.tsCheck(container.querySelector(".AI_LLAMA_CHAT_Internet"), HTMLInputElement);
    if (searchCheckbox) {
      EQ.tsCheck(
        searchCheckbox.type,
        "checkbox",
        `Isn't the element tagged with ".AI_LLAMA_CHAT_Internet" an <input> of type "checkbox"?`,
      );
    }
    const locationCheckbox = INSTANCE.tsCheck(container.querySelector(".AI_LLAMA_CHAT_Location"), HTMLInputElement);
    if (locationCheckbox) {
      EQ.tsCheck(
        locationCheckbox.type,
        "checkbox",
        `Isn't the element tagged with ".AI_LLAMA_CHAT_Location" an <input> of type "checkbox"?`,
      );
    }
    const mailForwardCheckbox = INSTANCE.tsCheck(
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
    const mailAddressInput = OR.tsCheck(
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
    const alertOnFinishCheckbox = INSTANCE.tsCheck(
      container.querySelector(".AI_LLAMA_CHAT_AlertOnFinish"),
      HTMLInputElement,
    );
    const alertOnFinishText =
      typeof toLoad.alertonfinishtext === "string" && toLoad.alertonfinishtext.trim()
        ? toLoad.alertonfinishtext.trim()
        : "Inference has finished.";
    if (alertOnFinishCheckbox) {
      alertOnFinishCheckbox.addEventListener("change", () => {
        if (alertOnFinishCheckbox.checked && "Notification" in window) {
          if (Notification.permission === "default") {
            Notification.requestPermission();
          }
        }
      });
    }
    let micButton = null;
    let isRecording = false;
    let isTranscribing = false;
    let whisperMediaRecorder = null;
    let whisperAudioChunks = [];
    let whisperConvertSupported = true;
    let stopRecordingFn = null;
    let whisperUrl = null;
    try {
      whisperUrl = `${window.codbi.baseURL}plugin?name=CodBi_AI_Whisper`;
    } catch (_e) {}
    const setupWhisperMic = (pluginUrl) => {
      const inputWrapper = document.createElement("div");
      inputWrapper.className = "LLAMA_Chat_InputWrapper";
      DEFINED.tsCheck(chatInput.parentElement).insertBefore(inputWrapper, chatInput);
      inputWrapper.appendChild(chatInput);
      micButton = document.createElement("button");
      micButton.type = "button";
      micButton.className = "LLAMA_Chat_MicButton";
      micButton.title = "Voice input (Whisper)";
      micButton.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm-1-9a1 1 0 1 1 2 0v6a1 1 0 1 1-2 0V5zm6 6a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2z"/></svg>`;
      inputWrapper.appendChild(micButton);
      const mic = micButton;
      if (chatInput.disabled) {
        mic.disabled = true;
      }
      const lang = toLoad.language != null ? String(toLoad.language).trim() : "";
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
          if (!whisperConvertSupported) {
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
            reader.onerror = () => reject(new CodBiError("[AI / LLAMA / CHAT ] Failed to read audio blob"));
            reader.readAsDataURL(blob);
          });
          const formData = new FormData();
          formData.append("codbi-base64:audio", dataUrl);
          const ajaxHeaders = {};
          if (lang) {
            ajaxHeaders["X-Language"] = lang;
          }
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
                chatInput.value =
                  preRecordingText +
                  (preRecordingText && !preRecordingText.endsWith(" ") ? " " : "") +
                  result.text.trim();
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
      const sendForTranscription = async (audioBlob) => {
        isTranscribing = true;
        mic.classList.add("LLAMA_Chat_MicButton--transcribing");
        mic.disabled = true;
        const disableMic = () => {
          isTranscribing = false;
          mic.classList.remove("LLAMA_Chat_MicButton--transcribing");
          mic.disabled = false;
        };
        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Failed to read audio blob."));
            reader.readAsDataURL(audioBlob);
          });
          const formData = new FormData();
          formData.append("codbi-base64:audio", dataUrl);
          const ajaxHeaders = {};
          if (lang) {
            ajaxHeaders["X-Language"] = lang;
          }
          $.ajax({
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
                window.codbi.log("ERROR", `Whisper: ${result.error}`, "AI / LLAMA / CHAT");
                return;
              }
              if (result.text) {
                const separator = preRecordingText && !preRecordingText.endsWith(" ") ? " " : "";
                chatInput.value = preRecordingText + separator + result.text.trim();
              }
            },
            error: (_xhr, _status, error) => {
              window.codbi.log("ERROR", `Whisper transcription failed: ${String(error)}`, "AI / LLAMA / CHAT");
            },
            complete: () => {
              disableMic();
            },
          });
        } catch (X) {
          window.codbi.log(
            "ERROR",
            `Whisper transcription failed: ${X instanceof Error ? X.message : String(X)}`,
            "AI / LLAMA / CHAT",
          );
          disableMic();
        }
      };
      const startRecording = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          whisperAudioChunks = [];
          whisperMediaRecorder = new MediaRecorder(stream, { mimeType: preferredMimeType() });
          whisperMediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              whisperAudioChunks.push(e.data);
            }
          };
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
          const rec = whisperMediaRecorder;
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
      const hotkeyDef = (typeof toLoad.voicehotkey === "string" && toLoad.voicehotkey.trim()) || "Alt+A";
      const hotkeyParts = hotkeyDef.split("+").map((p) => p.trim());
      const hotkeyKey = hotkeyParts[hotkeyParts.length - 1].toUpperCase();
      const needAlt = hotkeyParts.some((p) => /^alt$/i.test(p));
      const needCtrl = hotkeyParts.some((p) => /^ctrl$/i.test(p));
      const needShift = hotkeyParts.some((p) => /^shift$/i.test(p));
      const needMeta = hotkeyParts.some((p) => /^meta$/i.test(p));
      mic.title = `Voice input \u2014 Whisper (${hotkeyDef})`;
      document.addEventListener("keydown", (e) => {
        if (
          e.key.toUpperCase() === hotkeyKey &&
          e.altKey === needAlt &&
          e.ctrlKey === needCtrl &&
          e.shiftKey === needShift &&
          e.metaKey === needMeta
        ) {
          e.preventDefault();
          if (
            document.activeElement?.closest(".MEDIA_Speech_InputWrapper") ||
            document.activeElement?.closest(".MEDIA_Whisper_InputWrapper")
          ) {
            return;
          }
          toggleRecording();
        }
      });
      const sendHotkeyDef = (typeof toLoad.voicesendhotkey === "string" && toLoad.voicesendhotkey.trim()) || "Alt+Q";
      const sHParts = sendHotkeyDef.split("+").map((p) => p.trim());
      const sHKey = sHParts[sHParts.length - 1].toUpperCase();
      const sHAlt = sHParts.some((p) => /^alt$/i.test(p));
      const sHCtrl = sHParts.some((p) => /^ctrl$/i.test(p));
      const sHShift = sHParts.some((p) => /^shift$/i.test(p));
      const sHMeta = sHParts.some((p) => /^meta$/i.test(p));
      document.addEventListener("keydown", (e) => {
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
      chatInput.placeholder =
        (typeof toLoad.voiceplaceholder === "string" && toLoad.voiceplaceholder.trim()) ||
        `${hotkeyDef} = \u{1F399}\uFE0F on/off | ${sendHotkeyDef} = \u{1F399}\uFE0F off + send`;
    };
    if (whisperUrl) {
      const wUrl = whisperUrl;
      $.ajax({
        url: wUrl,
        type: "GET",
        cache: false,
        headers: { "X-Health-Check": "true" },
        success: (response) => {
          const result = typeof response === "string" ? JSON.parse(response) : response;
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
    let isBusy = false;
    let attachedFiles = [];
    let thinkingBubble = null;
    let lastUserQuestion = "";
    let activeStreamId = null;
    const pageSessionId = generateUUID();
    const conversationHistory = [];
    const lowConfidenceEntries = /* @__PURE__ */ new Set();
    const stripLinksForHistory = (text) => {
      let cleaned = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      cleaned = cleaned.replace(/https?:\/\/[^\s)]+/g, "");
      cleaned = cleaned.replace(/ {2,}/g, " ").trim();
      if (cleaned.length > 150) {
        cleaned = `${cleaned.substring(0, 147)}...`;
      }
      return cleaned;
    };
    const MAX_VERBATIM_ENTRIES = 6;
    const compactHistory = () => {
      const effective = conversationHistory.filter((e) => !lowConfidenceEntries.has(e));
      if (effective.length <= MAX_VERBATIM_ENTRIES) {
        return effective;
      }
      const cutoff = effective.length - MAX_VERBATIM_ENTRIES;
      const oldTurns = effective.slice(0, cutoff);
      const recentTurns = effective.slice(cutoff);
      const lines = [];
      for (let i = 0; i < oldTurns.length; i += 2) {
        const userMsg = oldTurns[i]?.content ?? "";
        const asstMsg = oldTurns[i + 1]?.content ?? "";
        const uShort = userMsg.length > 120 ? `${userMsg.substring(0, 117)}...` : userMsg;
        const aShort = asstMsg.length > 120 ? `${asstMsg.substring(0, 117)}...` : asstMsg;
        lines.push(`- User: ${uShort}  Assistant: ${aShort}`);
      }
      const summaryEntry = {
        role: "system",
        content: `Summary of earlier conversation:
${lines.join("\n")}`,
      };
      return [summaryEntry, ...recentTurns];
    };
    let overlayHideTimer = null;
    let resourceOverlay = null;
    const getOverlay = () => {
      if (resourceOverlay) {
        return resourceOverlay;
      }
      const el = document.createElement("div");
      el.style.cssText = `
        position: absolute ; top: 6px ; right: 6px ; display: none ; align-items: center ; justify-content: center ;
        background: rgba( 0, 0, 0, 0.72 ); color: #fff ;font-size: 12px ; font-weight: 600 ; padding: 6px 14px ;
        text-align: center ; pointer-events: none ; z-index: 1000 ; border-radius: 6px ; backdrop-filter: blur( 2px );
        transition: opacity 0.3s ease ; max-width: 60% ; white-space: nowrap; overflow: hidden ; text-overflow: ellipsis ;`;
      const anchor = chatContainer.parentElement;
      if (anchor) {
        const cs = window.getComputedStyle(anchor);
        if (cs.position === "static") {
          anchor.style.position = "relative";
        }
        anchor.appendChild(el);
      }
      resourceOverlay = el;
      return el;
    };
    const showResourceOverlay = (message) => {
      if (overlayHideTimer) {
        clearTimeout(overlayHideTimer);
        overlayHideTimer = null;
      }
      const overlay = getOverlay();
      overlay.textContent = message;
      overlay.style.display = "flex";
      overlay.style.opacity = "1";
    };
    const hideResourceOverlay = () => {
      if (!resourceOverlay) {
        return;
      }
      resourceOverlay.style.opacity = "0";
      overlayHideTimer = setTimeout(() => {
        if (resourceOverlay) {
          resourceOverlay.style.display = "none";
        }
        overlayHideTimer = null;
      }, 400);
    };
    const handleResourceStatus = (status) => {
      if (!status) {
        return;
      }
      showResourceOverlay(status);
      if (status.includes("\u25B6") || status.includes("\u26A0")) {
        overlayHideTimer = setTimeout(hideResourceOverlay, 2500);
      }
    };
    const linkifyUrls = (text) => {
      const links = [];
      const placeholder = (idx) => `\0LINK${idx}\0`;
      const codeBlocks = [];
      const codePlaceholder = (idx) => `\0CODE${idx}\0`;
      const withCodeExtracted = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
        const idx = codeBlocks.length;
        codeBlocks.push(
          `<div class="LLAMA_Chat_CodeBlock"><div class="LLAMA_Chat_CodeHeader"><span class="LLAMA_Chat_CodeLang">${lang || "code"}</span><button type="button" class="LLAMA_Chat_CodeCopyBtn" title="Copy code"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg></button></div><pre class="LLAMA_Chat_CodePre"><code>${code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre></div>`,
        );
        return codePlaceholder(idx);
      });
      const withInlineCodeExtracted = withCodeExtracted.replace(/`([^`\n]+)`/g, (_m, code) => {
        const idx = codeBlocks.length;
        codeBlocks.push(
          `<code class="LLAMA_Chat_InlineCode">${code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code>`,
        );
        return codePlaceholder(idx);
      });
      const escaped = withInlineCodeExtracted
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
      const withMdPlaceholders = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, (_match, label, url) => {
        const idx = links.length;
        links.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
        return placeholder(idx);
      });
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
            `<span class="LLAMA_Chat_PhoneBadge"><span class="LLAMA_Chat_BadgeIcon">\u{1F4DE}</span><a href="${telHref}">${match}</a></span>`,
          );
          return placeholder(idx);
        },
      );
      const withEmailPlaceholders = withPhonePlaceholders.replace(
        /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
        (match) => {
          const idx = links.length;
          links.push(
            `<span class="LLAMA_Chat_EmailBadge"><span class="LLAMA_Chat_BadgeIcon">\u2709</span><a href="mailto:${match}">${match}</a></span>`,
          );
          return placeholder(idx);
        },
      );
      const restored = withEmailPlaceholders.replace(
        // biome-ignore lint/suspicious/noControlCharactersInRegex: placeholder pattern uses \x00
        /\x00LINK(\d+)\x00/g,
        (_m, idx) => {
          const html = links[Number(idx)];
          if (html.startsWith('<span class="LLAMA_Chat_Phone') || html.startsWith('<span class="LLAMA_Chat_Email')) {
            return html;
          }
          return `<span class="LLAMA_Chat_SourceBadge">${html}</span>`;
        },
      );
      const withCode = restored.replace(/\x00CODE(\d+)\x00/g, (_m, idx) => codeBlocks[Number(idx)]);
      return withCode;
    };
    const appendBubble = (text, role) => {
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
          navigator.clipboard.writeText(question);
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
          setTimeout(() => chatInput.classList.remove("LLAMA_input_flare"), 2e3);
        });
        toolbar.appendChild(reuseBtn);
        bubble.appendChild(toolbar);
      }
      chatContainer.appendChild(row);
      chatContainer.scrollTop = chatContainer.scrollHeight;
      return bubble;
    };
    const appendToChat = (text) => {
      if (text.startsWith("You: ")) {
        appendBubble(text.substring(5), "user");
      } else if (text.startsWith("Qwen3: ")) {
        appendBubble(text.substring(7), "llama");
      } else {
        appendBubble(text, "system");
      }
    };
    const replaceThinking = (text) => {
      if (thinkingBubble) {
        thinkingBubble.parentElement?.remove();
        thinkingBubble = null;
      }
      appendToChat(text);
    };
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
    chatContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".LLAMA_Chat_CodeCopyBtn");
      if (!btn) {
        return;
      }
      const codeEl = btn.closest(".LLAMA_Chat_CodeBlock")?.querySelector("code");
      if (codeEl) {
        navigator.clipboard.writeText(codeEl.textContent || "");
        const block = btn.closest(".LLAMA_Chat_CodeBlock");
        if (block) {
          block.classList.remove("LLAMA_flash");
          void block.offsetWidth;
          block.classList.add("LLAMA_flash");
        }
      }
    });
    const sendMessage = async () => {
      const message = chatInput.value.trim();
      if (!message || isBusy) {
        return;
      }
      const modelLabel = thinkingCheckbox ? (thinkingCheckbox.checked ? "\u{1F4A1} Thinking" : "\u26A1 Fast") : "AI";
      appendBubble(message, "user");
      chatInput.value = "";
      conversationHistory.push({ role: "user", content: message });
      isBusy = true;
      sendButton.disabled = true;
      if (micButton) {
        if (isRecording && stopRecordingFn) {
          stopRecordingFn();
        }
        micButton.disabled = true;
      }
      if ("disabled" in chatInput) {
        chatInput.disabled = true;
      }
      thinkingBubble = appendBubble("", "llama");
      thinkingBubble.innerHTML = `<div class="CodBiLoader_Spinner LLAMA_ThinkingSpinner"></div><span class="LLAMA_ThinkingLabel">Thinking...</span>`;
      thinkingBubble.classList.add("LLAMA_Chat_Bubble--thinking");
      try {
        _AI_LLAMA_CHAT.ensurePdfJsWorkerConfigured();
        const formData = new FormData();
        const maxPages = toLoad.maxpages ? Number(toLoad.maxpages) : 5;
        const maxPixelSize =
          toLoad.maxpixelsize != null ? Number(toLoad.maxpixelsize) : _AI_LLAMA_CHAT.DEFAULT_MAX_PIXELS;
        for (const file of attachedFiles) {
          if (file.type === "application/pdf") {
            const processedImages = await _AI_LLAMA_CHAT.processPdfFile(file, maxPages);
            for (let i = 0; i < processedImages.length; i++) {
              const imageName = `${file.name.replace(".pdf", "")}_page_${i + 1}.png`;
              let imageFile = new File([processedImages[i]], imageName, { type: "image/png" });
              if (maxPixelSize > 0) {
                const downscaled = await _AI_LLAMA_CHAT.downscaleImageIfNeeded(imageFile, maxPixelSize);
                imageFile =
                  downscaled instanceof File
                    ? downscaled
                    : new File([downscaled], imageName, { type: downscaled.type || "image/png" });
              }
              const dataUrl = await _AI_LLAMA_CHAT.blobToDataUrl(imageFile);
              formData.append(`codbi-base64:${imageName}`, dataUrl);
            }
          } else if (maxPixelSize > 0) {
            const downscaled = await _AI_LLAMA_CHAT.downscaleImageIfNeeded(file, maxPixelSize);
            const dataUrl = await _AI_LLAMA_CHAT.blobToDataUrl(downscaled);
            window.codbi.log(
              "INFO",
              `Appending '${file.name}' as base64 param: ${dataUrl.length < 1024 ? `${dataUrl.length} B` : dataUrl.length < 1048576 ? `${Math.round(dataUrl.length / 1024)} KB` : `${(dataUrl.length / 1048576).toFixed(1)} MB`}`,
              "AI / LLAMA / CHAT",
            );
            formData.append(`codbi-base64:${file.name}`, dataUrl);
          } else {
            const dataUrl = await _AI_LLAMA_CHAT.blobToDataUrl(file);
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
        const headers = {};
        if (toLoad.rotation && toLoad.rotation !== "0" && toLoad.rotation !== 0) {
          headers["X-Rotate"] = toLoad.rotation.toString();
        }
        const utf8ToBase64 = (str) => btoa(String.fromCharCode(...new TextEncoder().encode(str)));
        headers["X-Question-chat"] = utf8ToBase64(message.replace(/[\r\n]+/g, " ").trim());
        headers["X-Stream"] = "true";
        headers["X-Session-Id"] = pageSessionId;
        headers["X-Chat-History"] = utf8ToBase64(JSON.stringify(compactHistory()));
        if (responseLang) {
          headers["X-Forced-Language"] = responseLang;
        }
        if (specialist) {
          headers["X-Specialist"] = specialist;
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
          if (navigator.geolocation) {
            try {
              const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: false,
                  timeout: 5e3,
                  maximumAge: 3e5,
                  // 5 min cache
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
        const finishStreaming = () => {
          activeStreamId = null;
          isBusy = false;
          sendButton.disabled = false;
          if (micButton) {
            micButton.disabled = false;
          }
          if (stopButton) {
            stopButton.disabled = true;
          }
          if ("disabled" in chatInput) {
            chatInput.disabled = false;
          }
          hideResourceOverlay();
          chatInput.focus();
          if (alertOnFinishCheckbox?.checked) {
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
                    "AlertOnFinish: Permission is default \u2014 requesting now.",
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
                    `AlertOnFinish: Permission is "${Notification.permission}" \u2014 notification blocked by user.`,
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
            try {
              const actx = new AudioContext();
              const osc = actx.createOscillator();
              osc.type = "sine";
              osc.frequency.setValueAtTime(880, actx.currentTime);
              osc.connect(actx.destination);
              osc.start();
              osc.stop(actx.currentTime + 0.3);
            } catch {}
            const origTitle = document.title;
            let flashes = 0;
            const titleFlash = setInterval(() => {
              document.title = flashes % 2 === 0 ? `\u2705 ${alertOnFinishText}` : origTitle;
              if (++flashes >= 6) {
                clearInterval(titleFlash);
                document.title = origTitle;
              }
            }, 1e3);
            const toast = document.createElement("div");
            toast.textContent = `\u2705 ${alertOnFinishText}`;
            toast.style.cssText =
              "position:fixed;top:16px;right:16px;z-index:999999;padding:12px 20px;background:#1a7f37;color:#fff;border-radius:8px;font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,.25);opacity:0;transition:opacity .3s;cursor:pointer";
            document.body.appendChild(toast);
            requestAnimationFrame(() => {
              toast.style.opacity = "1";
            });
            toast.addEventListener("click", () => toast.remove());
            setTimeout(() => {
              toast.style.opacity = "0";
              setTimeout(() => toast.remove(), 400);
            }, 6e3);
          }
        };
        const pollStream = (streamId) => {
          let lastText = "";
          let streamBubble = null;
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
                if (pollResponse.queueBadge != null && queueBadgeOverride == null) {
                  queueBadgeEnabled = !!pollResponse.queueBadge;
                }
                const showBadge = queueBadgeOverride != null ? queueBadgeOverride : queueBadgeEnabled;
                if (showBadge && pollResponse.queuePosition > 0 && thinkingBubble) {
                  let badge = thinkingBubble.querySelector(".LLAMA_QueueBadge");
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
                }
                if (pollResponse.error && pollResponse.done === void 0) {
                  clearInterval(interval);
                  replaceThinking(`${modelLabel}: \u26A0 ${pollResponse.error}`);
                  finishStreaming();
                  return;
                }
                const text = pollResponse.text ?? "";
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
                    const fetchUrl = pollResponse.fetchUrl ?? "";
                    const indicator = document.createElement("div");
                    indicator.className = "LLAMA_Chat_Row LLAMA_Chat_Row--llama";
                    indicator.innerHTML = `<div class="LLAMA_Chat_Bubble LLAMA_Chat_Bubble--llama LLAMA_SearchIndicator"><div class="CodBiLoader_Spinner LLAMA_SearchSpinner"></div><span class="LLAMA_SearchLabel">${fetchUrl ? i18nReadingLabel.replace("%s", fetchUrl) : i18nReadingLabelNoUrl}</span></div>`;
                    chatContainer.appendChild(indicator);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                  }
                  lastText = "";
                  return;
                }
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
                    const mailRecipient = pollResponse.mailRecipient ?? "";
                    const indicator = document.createElement("div");
                    indicator.className = "LLAMA_Chat_Row LLAMA_Chat_Row--llama";
                    indicator.innerHTML = `<div class="LLAMA_Chat_Bubble LLAMA_Chat_Bubble--llama LLAMA_SearchIndicator"><div class="CodBiLoader_Spinner LLAMA_SearchSpinner"></div><span class="LLAMA_SearchLabel">${mailRecipient ? i18nSendingMailLabel.replace("%s", mailRecipient) : i18nSendingMailLabelNoRecipient}</span></div>`;
                    chatContainer.appendChild(indicator);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                  }
                  lastText = "";
                  return;
                }
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
                    const searchQuery = pollResponse.searchQuery ?? "";
                    const indicator = document.createElement("div");
                    indicator.className = "LLAMA_Chat_Row LLAMA_Chat_Row--llama";
                    indicator.innerHTML = `<div class="LLAMA_Chat_Bubble LLAMA_Chat_Bubble--llama LLAMA_SearchIndicator"><div class="CodBiLoader_Spinner LLAMA_SearchSpinner"></div><span class="LLAMA_SearchLabel">${searchQuery ? i18nSearchingLabel.replace("%s", searchQuery) : i18nSearchingLabelNoQuery}</span></div>`;
                    chatContainer.appendChild(indicator);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                  }
                  lastText = "";
                  return;
                }
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
                const liveThinking = pollResponse.thinking;
                if (liveThinking && text.length === 0 && !pollResponse.done && thinkingBubble) {
                  let reasoningEl = thinkingBubble.querySelector(".LLAMA_LiveReasoningContent");
                  if (!reasoningEl) {
                    thinkingBubble.classList.remove("LLAMA_Chat_Bubble--thinking");
                    thinkingBubble.innerHTML = `<details class="LLAMA_Chat_Thinking" open><summary style="display:flex;align-items:center;gap:6px"><div class="CodBiLoader_Spinner LLAMA_ThinkingSpinner"></div><span>${i18nReasoningLabel}</span></summary><div class="LLAMA_Chat_ThinkingContent LLAMA_LiveReasoningContent"></div></details>`;
                    reasoningEl = thinkingBubble.querySelector(".LLAMA_LiveReasoningContent");
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
                    const confidence = pollResponse.confidence;
                    const isLowConfidence = confidence?.mean != null && confidence.mean < LOW_CONFIDENCE_THRESHOLD;
                    if (isLowConfidence) {
                      lowConfidenceEntries.add(assistantEntry);
                    }
                    if (showUncertainTokens && confidence?.uncertainTokens?.length && streamBubble) {
                      let markedText = lastText;
                      const sorted = [...confidence.uncertainTokens].sort((a, b) => b.o - a.o);
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
                    const thinkingText = pollResponse.thinking;
                    if (thinkingText && streamBubble) {
                      const details = document.createElement("details");
                      details.className = "LLAMA_Chat_Thinking";
                      const summary = document.createElement("summary");
                      const hasSearchSources = /\uD83D\uDD0D Searching the web/.test(thinkingText);
                      const hasRealReasoning = thinkingText.includes("---\n\n\u{1F50D}") || !hasSearchSources;
                      summary.textContent = hasRealReasoning ? i18nShowReasoningLabel : i18nShowSourcesLabel;
                      details.appendChild(summary);
                      const pre = document.createElement("div");
                      pre.className = "LLAMA_Chat_ThinkingContent";
                      pre.innerHTML = linkifyUrls(thinkingText);
                      details.appendChild(pre);
                      streamBubble.appendChild(details);
                    }
                    if (aiHintText && streamBubble) {
                      _AI_LLAMA_CHAT.attachAiHintToBubble(streamBubble, aiHintText);
                    }
                    const modelType = pollResponse.modelType;
                    if (thinkingCheckbox && modelType && streamBubble) {
                      const badge = document.createElement("span");
                      badge.className = "LLAMA_ModelBadge";
                      badge.textContent = modelType === "thinking" ? "\u{1F4A1}" : "\u26A1";
                      badge.title = modelType === "thinking" ? "Thinking model" : "Fast model";
                      streamBubble.insertBefore(badge, streamBubble.firstChild);
                    }
                    if (streamBubble) {
                      const responseText = lastText;
                      const reasoningText = thinkingText || "";
                      const toolbar = document.createElement("div");
                      toolbar.className = "LLAMA_Chat_BubbleToolbar LLAMA_Chat_BubbleToolbar--right";
                      const copyBtn = document.createElement("button");
                      copyBtn.type = "button";
                      copyBtn.className = "LLAMA_Chat_ToolbarBtn";
                      copyBtn.title = "Copy response";
                      copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>`;
                      copyBtn.addEventListener("click", () => {
                        let md = `## ${i18nCopyResponseLabel}

${responseText}`;
                        if (reasoningText) {
                          md += `

---

## ${i18nCopyReasoningLabel}

${reasoningText}`;
                        }
                        navigator.clipboard.writeText(md);
                        streamBubble.classList.remove("LLAMA_flash");
                        void streamBubble.offsetWidth;
                        streamBubble.classList.add("LLAMA_flash");
                      });
                      toolbar.appendChild(copyBtn);
                      streamBubble.appendChild(toolbar);
                    }
                    const currentModelType = pollResponse.modelType;
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
                        rethinkBtn.textContent = `\u{1F4A1} ${rethinkButtonText}`;
                        rethinkBtn.addEventListener("click", () => {
                          rethinkBtn.disabled = true;
                          rethinkBtn.textContent = "\u23F3";
                          const rethinkRow = document.createElement("div");
                          rethinkRow.className = "LLAMA_Chat_Row LLAMA_Chat_Row--llama";
                          const rethinkBubble = document.createElement("div");
                          rethinkBubble.className =
                            "LLAMA_Chat_Bubble LLAMA_Chat_Bubble--llama LLAMA_Chat_Bubble--thinking";
                          rethinkBubble.innerHTML =
                            '<div class="CodBiLoader_Spinner LLAMA_ThinkingSpinner"></div><span class="LLAMA_ThinkingLabel">Rethinking\u2026</span>';
                          rethinkRow.appendChild(rethinkBubble);
                          targetRow.insertAdjacentElement("afterend", rethinkRow);
                          chatContainer.scrollTop = chatContainer.scrollHeight;
                          const rethinkHeaders = {
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
                                        badge.textContent = "\u{1F4A1}";
                                        badge.title = "Thinking model (rethink)";
                                        rethinkBubble.insertBefore(badge, rethinkBubble.firstChild);
                                        if (aiHintText) {
                                          _AI_LLAMA_CHAT.attachAiHintToBubble(rethinkBubble, aiHintText);
                                        }
                                        const rethinkThinking = poll.thinking;
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
                            },
                            error: () => {
                              rethinkBubble.textContent = "\u26A0 Rethink request failed.";
                              rethinkBubble.classList.add("LLAMA_Chat_Bubble--error");
                              rethinkBubble.classList.remove("LLAMA_Chat_Bubble--thinking");
                            },
                          });
                        });
                        warning.appendChild(rethinkBtn);
                      }
                      streamBubble.appendChild(warning);
                    }
                  } else {
                    replaceThinking("\u26A0 No response was generated. Please try again.");
                    conversationHistory.pop();
                  }
                  if (mailForwardCheckbox?.checked && mailAddressInput?.value.trim() && lastText) {
                    const mailTo = mailAddressInput.value.trim();
                    const mailSubject = message
                      .replace(/[\r\n]+/g, " ")
                      .trim()
                      .substring(0, 120);
                    const thinkingContent = pollResponse.thinking;
                    let mailBody = lastText;
                    if (thinkingContent) {
                      mailBody += `

---
Reasoning:
${thinkingContent}`;
                    }
                    const mailHeaders = {
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
            const fileKeys = Object.keys(response);
            if (fileKeys.length === 0) {
              replaceThinking(`${modelLabel}: (no response received)`);
              finishStreaming();
              return;
            }
            let answerText;
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
              const parts = [];
              for (const fileKey of fileKeys) {
                const fileAnswers = response[fileKey];
                const answerKeys = Object.keys(fileAnswers || {});
                const answer =
                  fileAnswers?.chat ?? (answerKeys.length > 0 ? String(fileAnswers[answerKeys[0]]) : "(no answer)");
                parts.push(`\u{1F4C4} ${fileKey}:
${answer}`);
              }
              answerText = parts.join("\n\n");
              const searchOn2 = searchCheckbox ? searchCheckbox.checked : true;
              conversationHistory.push({
                role: "assistant",
                content: searchOn2 ? stripLinksForHistory(answerText) : answerText,
              });
            }
            if (thinkingBubble) {
              thinkingBubble.parentElement?.remove();
              thinkingBubble = null;
            }
            const answerBubble = appendBubble(answerText, "llama");
            if (aiHintText) {
              _AI_LLAMA_CHAT.attachAiHintToBubble(answerBubble, aiHintText);
            }
            finishStreaming();
          },
          error: (xhr, status, error) => {
            replaceThinking(`${modelLabel}: \u26A0 Request failed (${status}): ${error}`);
            window.codbi.log("ERROR", `Chat request failed: ${status} \u2014 ${error}`, "AI / LLAMA / CHAT");
            conversationHistory.pop();
            finishStreaming();
          },
        });
      } catch (X) {
        replaceThinking(`${modelLabel}: \u26A0 Error: ${X}`);
        conversationHistory.pop();
        isBusy = false;
        sendButton.disabled = false;
        if (micButton) {
          micButton.disabled = false;
        }
        if ("disabled" in chatInput) {
          chatInput.disabled = false;
        }
      }
    };
    sendButton.addEventListener("click", () => {
      sendMessage();
    });
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
    chatInput.addEventListener("keydown", (event) => {
      const isTextarea = chatInput instanceof HTMLTextAreaElement;
      if (event.key === "Enter" && (isTextarea ? event.ctrlKey : !event.shiftKey)) {
        event.preventDefault();
        sendMessage();
      }
    });
    chatInput.disabled = true;
    sendButton.disabled = true;
    sendButton.disabled = true;
    if (micButton) {
      micButton.disabled = true;
    }
    const statusBubble = appendBubble("", "system");
    statusBubble.innerHTML = `<div class="CodBiLoader_Spinner LLAMA_ThinkingSpinner"></div><span class="LLAMA_HealthLabel">Loading AI model\u2026</span>`;
    statusBubble.classList.add("LLAMA_Chat_Bubble--thinking");
    const setHealthLabel = (text) => {
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
    let queueBadgeEnabled = false;
    const queueBadgeOverride = toLoad.queuebadge != null ? String(toLoad.queuebadge) !== "false" : null;
    const queueText = toLoad.queuetext != null ? String(toLoad.queuetext) : "";
    const LOW_CONFIDENCE_THRESHOLD = -2.5;
    const showReady = (modelName, thinkingModelName) => {
      statusBubble.classList.remove("LLAMA_Chat_Bubble--thinking");
      const name = modelName || "AI";
      const thinkingInfo = thinkingModelName ? ` + \u{1F4A1} ${thinkingModelName}` : "";
      statusBubble.innerHTML = `\u{1F4AC} ${name}${thinkingInfo} ${welcomeText}`;
      chatInput.disabled = false;
      sendButton.disabled = false;
      if (micButton) {
        micButton.disabled = false;
      }
      if (!thinkingModelName && thinkingCheckbox && thinkingCheckbox.checked) {
        thinkingCheckbox.disabled = true;
        thinkingCheckbox.title = "Thinking model not available on this server";
      }
      chatInput.focus();
    };
    const showError = (msg) => {
      statusBubble.classList.remove("LLAMA_Chat_Bubble--thinking");
      statusBubble.innerHTML = `\u26A0 ${msg}`;
      statusBubble.classList.add("LLAMA_Chat_Bubble--error");
    };
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
          if (response.queueBadge != null && queueBadgeOverride == null) {
            queueBadgeEnabled = !!response.queueBadge;
          }
        },
        error: () => {
          setHealthLabel(waitingText);
        },
      });
    }, 3e3);
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
        },
        success: (response) => {
          if (!response.error) {
            clearInterval(healthCheck);
            showReady(response.model, response.thinkingModel);
          }
        },
      });
    }, 100);
    window.codbi.log("INFO", "Llama Chat functionality initialized", "AI / LLAMA / CHAT");
  }
  static {
    // #region PDF.js
    this.pdfJsWorkerConfigured = false;
  }
  /** Ensures that the PDF.js worker is configured. This is necessary for PDF.js to function correctly in a web environment. */
  static ensurePdfJsWorkerConfigured() {
    if (_AI_LLAMA_CHAT.pdfJsWorkerConfigured) {
      return;
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.codbi.baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.worker.min.js`;
    _AI_LLAMA_CHAT.pdfJsWorkerConfigured = true;
    window.codbi.log(
      "INFO",
      `PDF.js worker configured: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`,
      "AI / LLAMA / CHAT",
    );
  }
  // #endregion PDF.js
  // #region Chat-Bubble CSS
  /** Injects global CSS for the speech-bubble chat UI (once). */
  static ensureChatBubbleStyles() {
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
  static attachAiHintToBubble(bubble, hintText) {
    const existing = bubble.querySelector(".LLAMA_Chat_AiHint");
    if (existing) {
      existing.remove();
    }
    const hint = document.createElement("span");
    hint.className = "LLAMA_Chat_AiHint";
    hint.textContent = hintText;
    bubble.appendChild(hint);
  }
  static {
    // #endregion AI-Generated hint for bubbles.
    // #region Image-Downscaling
    /** Default total-pixel budget (width × height). Matches the backend's default maxPixels (≈ 1792 × 1792). */
    this.DEFAULT_MAX_PIXELS = 3211264;
  }
  /**
   * Converts a canvas to a {@link File} built from raw bytes.
   * Formcycle's multipart parser returns 0 bytes for canvas {@link Blob} objects,
   * so we go through {@link HTMLCanvasElement.toDataURL toDataURL} → base64 decode → {@link ArrayBuffer} → {@link File}.
   *
   * @param canvas    The canvas containing the image to convert.
   * @param fileName  The name to assign to the resulting File.
   *
   * @return A {@link File } containing the image data from the canvas, with the specified file name and "image/png" MIME type.*/
  static canvasToFile(canvas, fileName) {
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
  static blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
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
  static async downscaleImageIfNeeded(file, maxPixels) {
    return new Promise((resolve, reject) => {
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
          `Downscaling ${file.name}: ${img.width}\xD7${img.height} \u2192 ${newW}\xD7${newH}`,
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
        resolve(_AI_LLAMA_CHAT.canvasToFile(canvas, file.name));
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
  static async processPdfFile(file, maxPages = 0) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images = [];
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
        const blob = await _AI_LLAMA_CHAT.renderPdfPageToImage(page);
        images.push(blob);
      } else {
        window.codbi.log(
          "INFO",
          `PDF page ${pageNum} has minimal text (${textLength} chars) \u2014 attempting image extraction`,
          "AI / LLAMA / CHAT",
        );
        const extractedImages = await _AI_LLAMA_CHAT.extractImagesFromPdfPage(page);
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
          const blob = await _AI_LLAMA_CHAT.renderPdfPageToImage(page);
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
  static async renderPdfPageToImage(page) {
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new CodBiError("Failed to get canvas 2D context");
    }
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    return _AI_LLAMA_CHAT.canvasToFile(canvas, "page.png");
  }
  /**
   * Attempts to extract images from a PDF page by analyzing its operator list for image painting operations.
   * For each detected image operation, it retrieves the image data from the page's resources,
   * draws it onto a canvas, and converts the canvas to a PNG file.
   *
   * @param page The PDF page from which to extract images.
   *
   * @return A Promise that resolves to an array of {@link Blob }s, each containing an extracted image from the PDF page. */
  static async extractImagesFromPdfPage(page) {
    const images = [];
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
                  images.push(_AI_LLAMA_CHAT.canvasToFile(canvas, `${imageName}.png`));
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
};
__decorateClass(
  [
    DBC.ParamvalueProvider,
    __decorateParam(
      0,
      TYPE.PRE(
        "string",
        "llamabubble, userbubble, welcometext, waitingtext, lowconfidencetext, rethinkbuttontext, uncertaintext, showuncertaintokens, voicehotkey, voiceplaceholder, voicesendhotkey, language, responselanguage, specialist, queuebadge, queuetext",
      ),
    ),
    __decorateParam(0, TYPE.PRE("string | number", "maxpages, rotation, maxpixelsize")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "maxpages, maxpixelsize")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^(90|180|270)$/), "rotation")),
    __decorateParam(0, IF.PRE(new TYPE("number"), new OR([new EQ(90), new EQ(180), new EQ(270)]), "rotation")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^[a-z]{3}$/i), "language")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^[a-z]{2}$/i), "responselanguage")),
    __decorateParam(0, OR.PRE([new TYPE("string"), new TYPE("boolean")], "filterresults")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "filterresults")),
    __decorateParam(0, REGEX.PRE(REGEX.stdExp.colorCodeHEX, "llamabubble, userbubble")),
    __decorateParam(0, REGEX.PRE(REGEX.stdExp.simpleHotkey, "voicehotkey, voicesendhotkey")),
    __decorateParam(
      1,
      INSTANCE.PRE(
        HTMLTextAreaElement,
        void 0,
        "Isn't it a <textarea> (the conversation window) that is tagged by this functionality?",
      ),
    ),
  ],
  _AI_LLAMA_CHAT,
  "functionality",
  1,
);
var AI_LLAMA_CHAT = _AI_LLAMA_CHAT;
window.codbi.registerFunctionality("AI.LLAMA.CHAT", AI_LLAMA_CHAT.functionality.bind(AI_LLAMA_CHAT));
export { AI_LLAMA_CHAT };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9haS5sbGFtYS5jaGF0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvL3JlZ2lvbiBJbXBvcnRzXG4vL3JlZ2lvbiBYSU1BXG5pbXBvcnQgeyBnZXRKUXVlcnkgfSBmcm9tIFwiQGRlLXhpbWEvZmMtZm9ybS1yZW5kZXJlclwiO1xuLy9lbmRyZWdpb24gWElNQVxuLy9yZWdpb24gWERCQ1xuaW1wb3J0IHsgREJDIH0gZnJvbSBcInhkYmMvc3JjL0RCQ1wiO1xuaW1wb3J0IHsgUkVHRVggfSBmcm9tIFwieGRiYy9zcmMvREJDL1JFR0VYXCI7XG5pbXBvcnQgeyBUWVBFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9UWVBFXCI7XG5pbXBvcnQgeyBJRiB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvSUZcIjtcbmltcG9ydCB7IElOU1RBTkNFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JTlNUQU5DRVwiO1xuaW1wb3J0IHsgRVEgfSBmcm9tIFwieGRiYy9zcmMvREJDL0VRXCI7XG5pbXBvcnQgeyBPUiB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvT1JcIjtcbmltcG9ydCB7IERFRklORUQgfSBmcm9tIFwieGRiYy9zcmMvREJDL0RFRklORURcIjtcbi8vZW5kcmVnaW9uIFhEQkNcbi8vcmVnaW9uIFBERi5qc1xuaW1wb3J0ICogYXMgcGRmanNMaWIgZnJvbSBcInBkZmpzLWRpc3RcIjtcbmltcG9ydCB0eXBlIHsgUERGRG9jdW1lbnRQcm94eSwgUERGUGFnZVByb3h5IH0gZnJvbSBcInBkZmpzLWRpc3RcIjtcbmltcG9ydCB7IENvZEJpRXJyb3IsIGdlbmVyYXRlVVVJRCB9IGZyb20gXCIuLi9nbG9iYWwtc2NvcGVcIjtcbi8vZW5kcmVnaW9uIFBERi5qc1xuLy9yZWdpb24gQ29tbW9uc1xuaW1wb3J0IHsgY29udmVydFRvV2F2LCBwcmVmZXJyZWRNaW1lVHlwZSB9IGZyb20gXCIuLi9jb21tb25zL3doaXNwZXItdXRpbHNcIjtcbmltcG9ydCB7IGZvcm1hdFdhaXRUaW1lIH0gZnJvbSBcIi4uL2NvbW1vbnMvZm9ybWF0LXdhaXQtdGltZVwiO1xuLy9lbmRyZWdpb24gQ29tbW9uc1xuLy9lbmRyZWdpb24gSW1wb3J0c1xuLyoqXG4gKiBQcm92aWRlcyB0aGUge0BsaW5rIEFJX0xMQU1BX0NIQVQuZnVuY3Rpb25hbGl0eSB9LlxuICpcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoU2FsdmF0b3JlLkNhbGxhcmlAQW5zYmFjaC5kZSkgKi9cbi8vIGJpb21lLWlnbm9yZSBsaW50L2NvbXBsZXhpdHkvbm9TdGF0aWNPbmx5Q2xhc3M6IFByb2FjdGl2ZSBEZXNpZ24uXG5leHBvcnQgY2xhc3MgQUlfTExBTUFfQ0hBVCB7XG4gIC8qKlxuICAgKiBUaGlzIGZ1bmN0aW9uYWxpdHkgdHVybnMgYSBzZXQgb2YgSFRNTCBlbGVtZW50cyBpbnRvIGEgY2hhdCBpbnRlcmZhY2UgZm9yIHRoZSBMTEFNQSBNb2RlbCBzZXJ2ZWQgYnkgdGhlIENvZEJpLlxuICAgKiBJdCBlbmFibGVzIGludGVyYWN0aXZlLCBtdWx0aS10dXJuIGNvbnZlcnNhdGlvbnMgYWJvdXQgdXBsb2FkZWQgaW1hZ2VzIGFuZCBQREYgZG9jdW1lbnRzLCBwcm92aWRlcyBpbnRlcm5ldCBxdWVyeSBhY2Nlc3NcbiAgICogdG8gdGhlIG1vZGVsIHZpYSB0aGUgKipCcmF2ZSBTZWFyY2ggQVBJKiogYW5kIHRoZSBjbGllbnQncyBsb2NhdGlvbiB2aWEgdGhlIEdlb2xvY2F0aW9uIEFQSS5cbiAgICogVm9pY2UgaW5wdXQgaXMgc3VwcG9ydGVkIHZpYSB0aGUgKipNZWRpYS5JbnB1dC5TcGVlY2guV2hpc3BlcioqLUZ1bmN0aW9uYWxpdHkuXG4gICAqXG4gICAqIElmIHRoZSBtb2RlbCBpcyBub3Qgc3BlY2lmaWVkIFFXRU4zLVZMIDJCIGlzIGRvd25sb2FkZWQgYW5kIHV0aWxpemVkLlxuICAgKlxuICAgKiAqKlJlcXVpcmVkIEVsZW1lbnRzIChmb3VuZCBieSBDU1MgY2xhc3Mgd2l0aGluIHRoZSBuZWFyZXN0IGNvbW1vbiBhbmNlc3Rvcik6KipcbiAgICpcbiAgICogfCBDU1MgQ2xhc3MgICAgICAgICAgICAgICAgICAgICAgfCBFbGVtZW50ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IFB1cnBvc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gICAqIHwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS18XG4gICAqIHwgKlRoZSBjbGFzcyB0YWdnZWQgd2l0aCB0aGlzIGZ1bmN0aW9uYWxpdHkqICAgICAgICB8IGA8dGV4dGFyZWE+YCAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgQ2hhdCBkaXNwbGF5IChyZWFkLW9ubHkgY29udmVyc2F0aW9uIGhpc3RvcnkpICAgIHxcbiAgICogfCBgQUlfTExBTUFfQ0hBVF9JbnB1dGAgICAgfCBgPGlucHV0IHR5cGU9XCJ0ZXh0XCI+YCBvciBgPHRleHRhcmVhPmAgfCBUZXh0IGlucHV0IHdoZXJlIHRoZSB1c2VyIHR5cGVzIG1lc3NhZ2VzICAgICAgICAgfFxuICAgKiB8IGBBSV9MTEFNQV9DSEFUX1NlbmRgICAgICB8IGA8YnV0dG9uPmAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgU2VuZCBidXR0b24gKHRyaWdnZXJzIGluZmVyZW5jZSkgICAgICAgICAgICAgICAgIHxcbiAgICogfCBgQUlfTExBTUFfQ0hBVF9TdG9wYCAgICAgfCBgPGJ1dHRvbj5gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IFN0b3AgYnV0dG9uIChhYm9ydHMgcnVubmluZyBpbmZlcmVuY2UpICAgICAgICAgICB8XG4gICAqIHwgYEFJX0xMQU1BX0NIQVRfVXBsb2FkYCAoT3B0aW9uYWwpICAgfCBgPGlucHV0IHR5cGU9XCJmaWxlXCI+YCAgICAgICAgICAgICAgICAgIHwgRmlsZSB1cGxvYWQgZm9yIGltYWdlcy9QREZzIHRvIGNoYXQgYWJvdXQgICAgICAgIHxcbiAgICogfCBgQUlfTExBTUFfQ0hBVF9UaGlua2luZ2AgKE9wdGlvbmFsKSAgfCBgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiPmAgICAgICAgICAgICAgIHwgVG9nZ2xlcyB0aGlua2luZyBtb2RlIChjaGFpbi1vZi10aG91Z2h0KSBvbi9vZmYgIHxcbiAgICogfCBgQUlfTExBTUFfQ0hBVF9JbnRlcm5ldGAgKE9wdGlvbmFsKSAgICB8IGA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCI+YCAgICAgICAgICAgICAgfCBUb2dnbGVzIGludGVybmV0IHNlYXJjaCBhdmFpbGFiaWxpdHkgb24vb2ZmICAgICAgfFxuICAgKiB8IGBBSV9MTEFNQV9DSEFUX0xvY2F0aW9uYCAoT3B0aW9uYWwpICAgIHwgYDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIj5gICAgICAgICAgICAgICB8IFRvZ2dsZXMgZ2VvbG9jYXRpb24gKGdldF9jdXJyZW50X2xvY2F0aW9uKSBvbi9vZmYgfFxuICAgKiB8IGBBSV9MTEFNQV9DSEFUX01haWxGb3J3YXJkYCAoT3B0aW9uYWwpIHwgYDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIj5gICAgICAgICAgICAgICB8IFRvZ2dsZXMgYXV0by1mb3J3YXJkIG9mIGV2ZXJ5IEFJIHJlc3BvbnNlIHZpYSBlbWFpbCB8XG4gICAqIHwgYEFJX0xMQU1BX0NIQVRfTWFpbEFkZHJlc3NgIChPcHRpb25hbCkgfCBgPGlucHV0IHR5cGU9XCJ0ZXh0XCI+YCBvciBgPGlucHV0IHR5cGU9XCJlbWFpbFwiPmAgfCBFbWFpbCBhZGRyZXNzIGZvciBhdXRvLWZvcndhcmRpbmcgKHNob3duIHdoZW4gY2hlY2tib3ggaXMgY2hlY2tlZCkgfFxuICAgKiB8IGBBSV9MTEFNQV9DSEFUX0FsZXJ0T25GaW5pc2hgIChPcHRpb25hbCkgfCBgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiPmAgICAgICAgICAgICAgIHwgVG9nZ2xlcyBhbGVydCBvbiBmaW5pc2ggb2YgaW5mZXJlbmNlICAgICAgICAgICAgICB8XG4gICAqXG4gICAqICoqR2VuZXJhdGVkIENTUyBDbGFzc2VzIChpbmplY3RlZCBhdCBydW50aW1lKToqKlxuICAgKlxuICAgKiB8IENTUyBDbGFzcyAgICAgICAgICAgICAgICAgICAgICAgfCBFbGVtZW50ICAgICB8IFB1cnBvc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAgICogfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXxcbiAgICogfCBgTExBTUFfQ2hhdF9Db250YWluZXJgICAgICAgICAgfCBgPGRpdj5gICAgICB8IFNjcm9sbGFibGUgY2hhdCB3cmFwcGVyIHJlcGxhY2luZyB0aGUgaGlkZGVuIGA8dGV4dGFyZWE+YCAgICAgIHxcbiAgICogfCBgTExBTUFfQ2hhdF9Sb3dgICAgICAgICAgICAgICAgfCBgPGRpdj5gICAgICB8IEZsZXggcm93IGhvbGRpbmcgYSBzaW5nbGUgYnViYmxlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAgICogfCBgTExBTUFfQ2hhdF9Sb3ctLXVzZXJgICAgICAgICAgfCBgPGRpdj5gICAgICB8IFJvdyBtb2RpZmllcjogcmlnaHQtYWxpZ25lZCAodXNlciBtZXNzYWdlKSAgICAgICAgICAgICAgICAgICAgIHxcbiAgICogfCBgTExBTUFfQ2hhdF9Sb3ctLWxsYW1hYCAgICAgICAgfCBgPGRpdj5gICAgICB8IFJvdyBtb2RpZmllcjogbGVmdC1hbGlnbmVkIChMbGFtYSByZXNwb25zZSkgICAgICAgICAgICAgICAgICAgIHxcbiAgICogfCBgTExBTUFfQ2hhdF9Sb3ctLXN5c3RlbWAgICAgICAgfCBgPGRpdj5gICAgICB8IFJvdyBtb2RpZmllcjogY2VudGVyZWQgKHN5c3RlbS9pbmZvIG1lc3NhZ2VzKSAgICAgICAgICAgICAgICAgIHxcbiAgICogfCBgTExBTUFfQ2hhdF9CdWJibGVgICAgICAgICAgICAgfCBgPGRpdj5gICAgICB8IEJhc2Ugc3BlZWNoLWJ1YmJsZSBzdHlsaW5nIChwYWRkaW5nLCBib3JkZXItcmFkaXVzLCBzaGFkb3cpICAgIHxcbiAgICogfCBgTExBTUFfQ2hhdF9CdWJibGUtLXVzZXJgICAgICAgfCBgPGRpdj5gICAgICB8IFVzZXIgYnViYmxlIGNvbG9ycyAoYmFja2dyb3VuZCB2aWEgYC0tdXNlci1idWJibGUtYmdgKSAgICAgICAgIHxcbiAgICogfCBgTExBTUFfQ2hhdF9CdWJibGUtLWxsYW1hYCAgICAgfCBgPGRpdj5gICAgICB8IExsYW1hIGJ1YmJsZSBjb2xvcnMgKGJhY2tncm91bmQgdmlhIGAtLWxsYW1hLWJ1YmJsZS1iZ2ApICAgICAgIHxcbiAgICogfCBgTExBTUFfQ2hhdF9CdWJibGUtLXN5c3RlbWAgICAgfCBgPGRpdj5gICAgICB8IFN5c3RlbSBidWJibGU6IHRyYW5zcGFyZW50LCBpdGFsaWMsIG11dGVkICAgICAgICAgICAgICAgICAgICAgIHxcbiAgICogfCBgTExBTUFfQ2hhdF9CdWJibGUtLXRoaW5raW5nYCAgfCBgPGRpdj5gICAgICB8IFRlbXBvcmFyeSBcInRoaW5raW5nXCIgaW5kaWNhdG9yIChkaW1tZWQsIGl0YWxpYykgICAgICAgICAgICAgICAgfFxuICAgKiB8IGBMTEFNQV9DaGF0X0J1YmJsZS0tZXJyb3JgICAgICB8IGA8ZGl2PmAgICAgIHwgRXJyb3IgYnViYmxlOiByZWQtdGludGVkIGJhY2tncm91bmQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgKiB8IGBMTEFNQV9DaGF0X0FpSGludGAgICAgICAgICAgIHwgYDxzcGFuPmAgICAgfCBTbWFsbCBcIkFJLUdlbmVyYXRlZFwiIGxhYmVsIGluc2lkZSBhbiBBSSBidWJibGUgICAgICAgICAgICAgICAgIHxcbiAgICpcbiAgICogKipCZWhhdmlvcjoqKlxuICAgKiAtIFRoZSBkaXNwbGF5IHRleHRhcmVhIGlzIG1hZGUgcmVhZC1vbmx5IGFuZCBzaG93cyB0aGUgZnVsbCBjb252ZXJzYXRpb24gaGlzdG9yeS5cbiAgICogLSBXaGVuIGZpbGVzIGFyZSBzZWxlY3RlZCB2aWEgdGhlIHVwbG9hZCBpbnB1dCwgdGhleSBhcmUgYXR0YWNoZWQgZm9yIHN1YnNlcXVlbnQgbWVzc2FnZXMuXG4gICAqIC0gV2hlbiB0aGUgdXNlciBjbGlja3MgU2VuZCAob3IgcHJlc3NlcyBDVFJMK0VudGVyIGluIHRoZSBpbnB1dCksIHRoZSBtZXNzYWdlIGFuZCBhbnkgYXR0YWNoZWQgZmlsZXMgYXJlIHNlbnQgdG8gdGhlXG4gICAqICAgc3RhbmRhcmQgYmFja2VuZCBmb3IgcHJvY2Vzc2luZyBieSB0aGUgQUkgbW9kZWwuIFRoZSByZXNwb25zZSBpcyBkaXNwbGF5ZWQgaW4gdGhlIGNoYXQuXG4gICAqIC0gUERGIGZpbGVzIGFyZSBhdXRvbWF0aWNhbGx5IGRldGVjdGVkIGFuZCBwcm9jZXNzZWQgKHJlbmRlcmVkIHRvIGltYWdlcyBvciBleHRyYWN0ZWQpLlxuICAgKiAtIE11bHRpcGxlIGZpbGVzIGNhbiBiZSBhdHRhY2hlZDsgZWFjaCBpcyBwcm9jZXNzZWQgaW5kZXBlbmRlbnRseSBieSB0aGUgbW9kZWwuXG4gICAqIC0gVGhlIHNlbmQgYnV0dG9uIGFuZCBpbnB1dCBhcmUgZGlzYWJsZWQgZHVyaW5nIGluZmVyZW5jZSB0byBwcmV2ZW50IGR1cGxpY2F0ZSByZXF1ZXN0cy5cbiAgICpcbiAgICogIyMjIENvbmZpZyBQYXJhbWV0ZXJzOlxuICAgKiAtICoqTWF4UGFnZXMqKjogICAgICAgICAgTWF4aW11bSBQREYgcGFnZXMgdG8gcHJvY2VzcyAoKipkZWZhdWx0Kio6IDUpLlxuICAgKiAtICoqUm90YXRpb24qKjogICAgICAgICAgSW1hZ2Ugcm90YXRpb24gaW4gZGVncmVlcyAoOTAsIDE4MCwgb3IgMjcwKS4gSWYgaXQgaXMga25vd24gdGhhdCB0aGUgaW1hZ2UgdG8gcHJvY2VzcyBpcyByb3RhdGVkLFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcyBjYW4gYmUgc2V0IHRvIGF2b2lkIFRlc3NlcmFjdCBPU0QgKGlmIGF2YWlsYWJsZSkgb3IgdGhlIEFJIGhhdmluZyB0byBkZWFsIHdpdGggaXQsIHNwZWVkaW5nIHVwXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgaW5mZXJlbmNlLiBOb3Qgc2V0dGluZyBvciBzZXR0aW5nIHRvIDAgbWVhbnMgdGhhdCByb3RhdGlvbiBpcyB1bmtub3duLlxuICAgKiAtICoqTWF4UGl4ZWxTaXplKio6ICAgICAgTWF4aW11bSB0b3RhbCBwaXhlbCBidWRnZXQgKHdpZHRoXHUwMEQ3aGVpZ2h0KS4gSW1hZ2VzIGV4Y2VlZGluZyB0aGlzIGFyZSBkb3duc2NhbGVkIGNsaWVudC1zaWRlIHdoaWxlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVzZXJ2aW5nIHRoZSBhc3BlY3QgcmF0aW8uXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAqKkRlZmF1bHQqKjogMzIxMTI2NCAoXHUyMjQ4IDE3OTJcdTAwRDcxNzkyKS4gU2V0IHRvIDAgdG8gZGlzYWJsZSBjbGllbnQtc2lkZSBkb3duc2NhbGluZy5cbiAgICogLSAqKkxMQU1BQnViYmxlKio6ICAgICAgIEJhY2tncm91bmQgY29sb3IgZm9yIExsYW1hIChBSSkgYnViYmxlcyAoKipkZWZhdWx0Kio6IGAjZTVlNWVhYCkuXG4gICAqIC0gKipVc2VyQnViYmxlKio6ICAgICAgICBCYWNrZ3JvdW5kIGNvbG9yIGZvciB1c2VyIGJ1YmJsZXMgKCoqZGVmYXVsdCoqOiBgIzBiOTNmNmApLlxuICAgKiAtICoqV2VsY29tZVRleHQqKjogICAgICAgVGV4dCBzaG93biBhZnRlciB0aGUgbW9kZWwgbmFtZShzKSBpbiB0aGUgcmVhZHkgbWVzc2FnZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgKCoqZGVmYXVsdCoqOiBgXCJDaGF0IHJlYWR5LiBBdHRhY2ggZmlsZShzKSBhbmQgdHlwZSB5b3VyIHF1ZXN0aW9uLlwiYCkuXG4gICAqIC0gKipWb2ljZUhvdGtleSoqOiAgICAgICBLZXlib2FyZCBzaG9ydGN1dCB0byB0b2dnbGUgdm9pY2UgaW5wdXQsIGUuZy4gYFwiQWx0K0FcImAgKCoqZGVmYXVsdCoqOiBgXCJBbHQrQVwiYCkuXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICBGb3JtYXQ6IG1vZGlmaWVyKHMpICsga2V5IHNlcGFyYXRlZCBieSBgK2AuIFJlY29nbml6ZWQgbW9kaWZpZXJzOlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgYEFsdGAsIGBDdHJsYCwgYFNoaWZ0YCwgYE1ldGFgLiBUaGUga2V5IHBhcnQgaXMgY2FzZS1pbnNlbnNpdGl2ZS5cbiAgICogLSAqKlZvaWNlUGxhY2Vob2xkZXIqKjogIFBsYWNlaG9sZGVyIHRleHQgc2hvd24gaW4gdGhlIGNoYXQgaW5wdXQgd2hlbiB2b2ljZSBpbnB1dCBpcyBhdmFpbGFibGUuXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAqKkRlZmF1bHQqKjogYFwiQWx0K0EgPSBcdUQ4M0NcdURGOTkgb24vb2ZmIHwgQWx0K1EgPSBcdUQ4M0NcdURGOTkgb2ZmICsgc2VuZFwiYCAocmVmbGVjdHMgdGhlIGNvbmZpZ3VyZWQgaG90a2V5cykuXG4gICAqIC0gKipWb2ljZVNlbmRIb3RrZXkqKjogICBLZXlib2FyZCBzaG9ydGN1dCB0byBzdG9wIHJlY29yZGluZyBhbmQgc2VuZCwgZS5nLiBgXCJBbHQrUVwiYCAoKipkZWZhdWx0Kio6IGBcIkFsdCtRXCJgKS5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgIFNhbWUgbW9kaWZpZXIgZm9ybWF0IGFzIGBWb2ljZUhvdGtleWAuXG4gICAqIC0gKipMYW5ndWFnZSoqOiAgICAgICAgICAgTGFuZ3VhZ2UgY29kZSBmb3IgV2hpc3BlciBzcGVlY2gtdG8tdGV4dCAoZS5nLiBgXCJkZVwiYCwgYFwiZW5cImApLlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgRW1wdHkgb3IgdW5zZXQgbWVhbnMgYXV0by1kZXRlY3QuXG4gICAqIC0gKipXYWl0aW5nVGV4dCoqOiAgICAgICAgVGV4dCBzaG93biB3aGlsZSB3YWl0aW5nIGZvciB0aGUgQUkgc2VydmVyIHRvIGJlY29tZSBhdmFpbGFibGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICgqKmRlZmF1bHQqKjogYFwiV2FpdGluZyBmb3IgQUkgc2VydmVyXFx1MjAyNlwiYCkuXG4gICAqIC0gKipMb3dDb25maWRlbmNlVGV4dCoqOiAgV2FybmluZyB0ZXh0IHNob3duIHdoZW4gdGhlIEFJIHJlc3BvbnNlIGhhcyBsb3cgY29uZmlkZW5jZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgKCoqZGVmYXVsdCoqOiBgXCJMb3cgQ29uZmlkZW5jZVwiYCkuXG4gICAqIC0gKipSZXRoaW5rQnV0dG9uVGV4dCoqOiAgQnV0dG9uIGxhYmVsIG9mZmVyaW5nIHRvIHJlLWFuc3dlciB3aXRoIHRoZSB0aGlua2luZyBtb2RlbFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgKCoqZGVmYXVsdCoqOiBgXCJSZXRoaW5rXCJgKS5cbiAgICogLSAqKlVuY2VydGFpblRleHQqKjogICAgICBUb29sdGlwIHRleHQgc2hvd24gd2hlbiBob3ZlcmluZyBvdmVyIHVuY2VydGFpbiAobG93LWNvbmZpZGVuY2UpIHRva2Vuc1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgKCoqZGVmYXVsdCoqOiBgXCJMb3cgY29uZmlkZW5jZVwiYCkuXG4gICAqIC0gKipTaG93VW5jZXJ0YWluVG9rZW5zKio6IFdoZXRoZXIgdG8gdmlzdWFsbHkgaGlnaGxpZ2h0IHVuY2VydGFpbiB0b2tlbnMgaW4gQUkgcmVzcG9uc2VzLlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgU2V0IHRvIGBcImZhbHNlXCJgIHRvIGRpc2FibGUgaGlnaGxpZ2h0aW5nICgqKmRlZmF1bHQqKjogYFwidHJ1ZVwiYCkuXG4gICAqIC0gKipSZXNwb25zZUxhbmd1YWdlKio6ICBUd28tbGV0dGVyIElTTyA2MzktMSBjb2RlIChlLmcuIGBcImRlXCJgLCBgXCJmclwiYCkuIFdoZW4gc2V0LCB0aGUgQUkgaXNcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlZCB0byByZXNwb25kIGluIHRoaXMgbGFuZ3VhZ2UgXHUyMDE0IG5vIGF1dG8tZGV0ZWN0aW9uIGlzIHBlcmZvcm1lZC5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgIE92ZXJyaWRlcyB0aGUgYEFJX0xMQU1BX1NURF9MYW5ndWFnZWAgcGx1Z2luIHByb3BlcnR5IGZvciB0aGlzIGluc3RhbmNlLlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgVGhlIGNoYXQgaW50ZXJmYWNlIHJlZmxlY3RzIHRoaXMgbGFuZ3VhZ2UgZm9yIGxhYmVscyB3aGVyZSBhdmFpbGFibGUuXG4gICAqIC0gKipTcGVjaWFsaXN0Kio6ICAgICAgICBOYW1lIG9mIGEgc3BlY2lhbGlzdCBtb2RlbCByZWdpc3RlcmVkIHZpYSBgQUlfTExBTUFfU1REX1NQRUNJQUxJU1RfWFhYYFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luIHByb3BlcnR5LiBXaGVuIHNldCwgcmVxdWVzdHMgYXJlIHJvdXRlZCB0byB0aGF0IHNwZWNpYWxpc3Qnc1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgZGVkaWNhdGVkIHNlcnZlciBpbnN0YW5jZSAoY2FzZS1pbnNlbnNpdGl2ZSBtYXRjaCkuXG4gICAqIC0gKipRdWV1ZUJhZGdlKio6ICAgICAgICBJZiBzZXQgdG8gYFwidHJ1ZVwiYCwgc2hvd3MgYSBiYWRnZSB3aXRoIHRoZSBjdXJyZW50IHF1ZXVlIHBvc2l0aW9uIHdoaWxlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICB3YWl0aW5nIGZvciBpbmZlcmVuY2UuIE92ZXJyaWRlcyB0aGUgYEFJX1F1ZXVlQmFkZ2VgIHBsdWdpbiBwcm9wZXJ0eVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIHRoaXMgaW5zdGFuY2UuIERlZmF1bHQ6IGRldGVybWluZWQgYnkgcGx1Z2luIHByb3BlcnR5LlxuICAgKiAtICoqUXVldWVUZXh0Kio6ICAgICAgICAgVGV4dCBhcHBlbmRlZCBhZnRlciB0aGUgcXVldWUgcG9zaXRpb24gbnVtYmVyIGluIHRoZSBiYWRnZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgKGUuZy4gYFwiaW4gcXVldWVcImAgXHUyMTkyIGJhZGdlIHNob3dzIGBcIjMgaW4gcXVldWVcImApLiBEZWZhdWx0OiBlbXB0eS5cbiAgICogLSAqKkZpbHRlclJlc3VsdHMqKjogICAgIElmIHNldCB0byBgXCJ0cnVlXCJgLCBlbmFibGVzIFBJSSBmaWx0ZXJpbmcgb24gQnJhdmUgU2VhcmNoIHF1ZXJpZXNcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgIGZvciB0aGlzIGluc3RhbmNlLCBvdmVycmlkaW5nIHRoZSBnbG9iYWwgYEFJX0JyYXZlU2VhcmNoX0ZpbHRlclJlc3VsdHNgXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICBwbHVnaW4gcHJvcGVydHkuIERlZmF1bHQ6IGRldGVybWluZWQgYnkgcGx1Z2luIHByb3BlcnR5LlxuICAgKlxuICAgKiBAcGFyYW0gdG9Mb2FkICAgIFByb3ZpZGVkIGJ5IHRoZSBDb2RCaS5cbiAgICogQHBhcmFtIHRvUHJvY2VzcyBQcm92aWRlZCBieSB0aGUgQ29kQmkuICovXG4gIEBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyXG4gIHB1YmxpYyBzdGF0aWMgZnVuY3Rpb25hbGl0eShcbiAgICBAVFlQRS5QUkUoXG4gICAgICBcInN0cmluZ1wiLFxuICAgICAgXCJsbGFtYWJ1YmJsZSwgdXNlcmJ1YmJsZSwgd2VsY29tZXRleHQsIHdhaXRpbmd0ZXh0LCBsb3djb25maWRlbmNldGV4dCwgcmV0aGlua2J1dHRvbnRleHQsIHVuY2VydGFpbnRleHQsIHNob3d1bmNlcnRhaW50b2tlbnMsIHZvaWNlaG90a2V5LCB2b2ljZXBsYWNlaG9sZGVyLCB2b2ljZXNlbmRob3RrZXksIGxhbmd1YWdlLCByZXNwb25zZWxhbmd1YWdlLCBzcGVjaWFsaXN0LCBxdWV1ZWJhZGdlLCBxdWV1ZXRleHRcIixcbiAgICApXG4gICAgQFRZUEUuUFJFKFwic3RyaW5nIHwgbnVtYmVyXCIsIFwibWF4cGFnZXMsIHJvdGF0aW9uLCBtYXhwaXhlbHNpemVcIilcbiAgICBASUYuUFJFKG5ldyBUWVBFKFwic3RyaW5nXCIpLCBuZXcgUkVHRVgoL15cXGQrJC8pLCBcIm1heHBhZ2VzLCBtYXhwaXhlbHNpemVcIilcbiAgICAvLyAjcmVnaW9uIFJvdGF0aW9uIGNvbnN0cmFpbnQuXG4gICAgQElGLlBSRShuZXcgVFlQRShcInN0cmluZ1wiKSwgbmV3IFJFR0VYKC9eKDkwfDE4MHwyNzApJC8pLCBcInJvdGF0aW9uXCIpXG4gICAgQElGLlBSRShuZXcgVFlQRShcIm51bWJlclwiKSwgbmV3IE9SKFtuZXcgRVEoOTApLCBuZXcgRVEoMTgwKSwgbmV3IEVRKDI3MCldKSwgXCJyb3RhdGlvblwiKVxuICAgIEBJRi5QUkUobmV3IFRZUEUoXCJzdHJpbmdcIiksIG5ldyBSRUdFWCgvXlthLXpdezN9JC9pKSwgXCJsYW5ndWFnZVwiKVxuICAgIEBJRi5QUkUobmV3IFRZUEUoXCJzdHJpbmdcIiksIG5ldyBSRUdFWCgvXlthLXpdezJ9JC9pKSwgXCJyZXNwb25zZWxhbmd1YWdlXCIpXG4gICAgLy8gI2VuZHJlZ2lvbiBSb3RhdGlvbiBjb25zdHJhaW50LlxuICAgIEBPUi5QUkUoW25ldyBUWVBFKFwic3RyaW5nXCIpLCBuZXcgVFlQRShcImJvb2xlYW5cIildLCBcImZpbHRlcnJlc3VsdHNcIilcbiAgICBASUYuUFJFKG5ldyBUWVBFKFwic3RyaW5nXCIpLCBuZXcgUkVHRVgoL14odHJ1ZXxmYWxzZSkkL2kpLCBcImZpbHRlcnJlc3VsdHNcIilcbiAgICBAUkVHRVguUFJFKFJFR0VYLnN0ZEV4cC5jb2xvckNvZGVIRVgsIFwibGxhbWFidWJibGUsIHVzZXJidWJibGVcIilcbiAgICBAUkVHRVguUFJFKFJFR0VYLnN0ZEV4cC5zaW1wbGVIb3RrZXksIFwidm9pY2Vob3RrZXksIHZvaWNlc2VuZGhvdGtleVwiKVxuICAgIHRvTG9hZDogeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH0sXG5cbiAgICBASU5TVEFOQ0UuUFJFKFxuICAgICAgSFRNTFRleHRBcmVhRWxlbWVudCxcbiAgICAgIHVuZGVmaW5lZCxcbiAgICAgIFwiSXNuJ3QgaXQgYSA8dGV4dGFyZWE+ICh0aGUgY29udmVyc2F0aW9uIHdpbmRvdykgdGhhdCBpcyB0YWdnZWQgYnkgdGhpcyBmdW5jdGlvbmFsaXR5P1wiLFxuICAgIClcbiAgICB0b1Byb2Nlc3M6IEVsZW1lbnQsXG4gICk6IHZvaWQge1xuICAgIC8vICNyZWdpb24gQ29uZmlnIGluaXRpYWxpemF0aW9uXG4gICAgY29uc3QgJCA9IGdldEpRdWVyeSgpO1xuICAgIGNvbnN0IGNoYXREaXNwbGF5ID0gdG9Qcm9jZXNzIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG4gICAgY29uc3QgYWlIaW50VGV4dCA9IHRvTG9hZC5haWhpbnQgIT0gbnVsbCA/IFN0cmluZyh0b0xvYWQuYWloaW50KSA6IFwiXFx1MjcyOCBBSS1HZW5lcmF0ZWRcIjtcbiAgICBjb25zdCByZXNwb25zZUxhbmcgPSB0b0xvYWQucmVzcG9uc2VsYW5ndWFnZSAhPSBudWxsID8gU3RyaW5nKHRvTG9hZC5yZXNwb25zZWxhbmd1YWdlKS50cmltKCkgOiBcIlwiO1xuICAgIGNvbnN0IHNwZWNpYWxpc3QgPSB0b0xvYWQuc3BlY2lhbGlzdCAhPSBudWxsID8gU3RyaW5nKHRvTG9hZC5zcGVjaWFsaXN0KS50cmltKCkgOiBcIlwiO1xuICAgIGNvbnN0IGZpbHRlclJlc3VsdHMgPSB0b0xvYWQuZmlsdGVycmVzdWx0cyAhPSBudWxsID8gU3RyaW5nKHRvTG9hZC5maWx0ZXJyZXN1bHRzKS50b0xvd2VyQ2FzZSgpID09PSBcInRydWVcIiA6IG51bGw7XG5cbiAgICBjaGF0RGlzcGxheS5yZWFkT25seSA9IHRydWU7XG4gICAgY2hhdERpc3BsYXkuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgIC8vICNlbmRyZWdpb24gQ29uZmlnIGluaXRpYWxpemF0aW9uXG4gICAgLy8gI3JlZ2lvbiBDcmVhdGUgc3BlZWNoLWJ1YmJsZSBjaGF0IGNvbnRhaW5lclxuICAgIEFJX0xMQU1BX0NIQVQuZW5zdXJlQ2hhdEJ1YmJsZVN0eWxlcygpO1xuXG4gICAgY29uc3QgY2hhdENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICBjaGF0Q29udGFpbmVyLmNsYXNzTmFtZSA9IFwiTExBTUFfQ2hhdF9Db250YWluZXJcIjtcbiAgICAvLyAjcmVnaW9uIEFwcGx5IGN1c3RvbSBidWJibGUgY29sb3JzIGZyb20gdG9Mb2FkLlxuICAgIGlmICh0b0xvYWQubGxhbWFidWJibGUgIT0gbnVsbCkge1xuICAgICAgY2hhdENvbnRhaW5lci5zdHlsZS5zZXRQcm9wZXJ0eShcIi0tbGxhbWEtYnViYmxlLWJnXCIsIFN0cmluZyh0b0xvYWQubGxhbWFidWJibGUpKTtcbiAgICB9XG4gICAgaWYgKHRvTG9hZC51c2VyYnViYmxlICE9IG51bGwpIHtcbiAgICAgIGNoYXRDb250YWluZXIuc3R5bGUuc2V0UHJvcGVydHkoXCItLXVzZXItYnViYmxlLWJnXCIsIFN0cmluZyh0b0xvYWQudXNlcmJ1YmJsZSkpO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIEFwcGx5IGN1c3RvbSBidWJibGUgY29sb3JzIGZyb20gdG9Mb2FkLlxuICAgIGlmICh0b0xvYWQubWF4Y2hhdHdpbmRvd2hlaWdodCAhPSBudWxsKSB7XG4gICAgICBjaGF0Q29udGFpbmVyLnN0eWxlLm1heEhlaWdodCA9IGAke1N0cmluZyh0b0xvYWQubWF4Y2hhdHdpbmRvd2hlaWdodCl9cHhgO1xuICAgIH1cblxuICAgIGNoYXREaXNwbGF5LnBhcmVudEVsZW1lbnQ/Lmluc2VydEJlZm9yZShjaGF0Q29udGFpbmVyLCBjaGF0RGlzcGxheS5uZXh0U2libGluZyk7XG4gICAgLy8gI2VuZHJlZ2lvbiBDcmVhdGUgc3BlZWNoLWJ1YmJsZSBjaGF0IGNvbnRhaW5lclxuICAgIC8vICNyZWdpb24gRGlzY292ZXIgc2libGluZyBlbGVtZW50cyBieSB3YWxraW5nIHVwIHRvIHRoZSBuZWFyZXN0IGNvbW1vbiBhbmNlc3RvclxuICAgIGxldCBjb250YWluZXI6IEVsZW1lbnQgfCBudWxsID0gdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQ7XG5cbiAgICB3aGlsZSAoY29udGFpbmVyICYmIGNvbnRhaW5lciAhPT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgaWYgKGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKFwiLkFJX0xMQU1BX0NIQVRfSW5wdXRcIikgJiYgY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoXCIuQUlfTExBTUFfQ0hBVF9TZW5kXCIpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjb250YWluZXIgPSBjb250YWluZXIucGFyZW50RWxlbWVudDtcbiAgICB9XG5cbiAgICBpZiAoIWNvbnRhaW5lciB8fCBjb250YWluZXIgPT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgIHdpbmRvdy5jb2RiaS5sb2coXG4gICAgICAgIFwiRVJST1JcIixcbiAgICAgICAgXCJDb3VsZCBub3QgZmluZCBhIGNvbnRhaW5lciB3aXRoIC5BSV9MTEFNQV9DSEFUX0lucHV0IGFuZCAuQUlfTExBTUFfQ0hBVF9TZW5kIGVsZW1lbnRzLiBcIiArXG4gICAgICAgIFwiRW5zdXJlIHRoZXNlIGVsZW1lbnRzIGV4aXN0IHdpdGhpbiBhIGNvbW1vbiBhbmNlc3RvciBvZiB0aGUgY2hhdCBkaXNwbGF5IHRleHRhcmVhLlwiLFxuICAgICAgICBcIkFJIC8gTExBTUEgLyBDSEFUXCIsXG4gICAgICApO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY2hhdElucHV0ID0gT1IudHNDaGVjazxIVE1MSW5wdXRFbGVtZW50IHwgSFRNTFRleHRBcmVhRWxlbWVudD4oXG4gICAgICBERUZJTkVELnRzQ2hlY2soY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoXCIuQUlfTExBTUFfQ0hBVF9JbnB1dFwiKSksXG4gICAgICBbbmV3IElOU1RBTkNFKEhUTUxJbnB1dEVsZW1lbnQpLCBuZXcgSU5TVEFOQ0UoSFRNTFRleHRBcmVhRWxlbWVudCldLFxuICAgICAgJ0lzIHRoZXJlIGEgY2hhdCBpbnB1dCBlbGVtZW50IHRhZ2dlZCB3aXRoIENTUy1DbGFzcyBcIkFJX0xMQU1BX0NIQVRfSW5wdXRcIiBpbiB0aGUgc2FtZSBjb250YWluZXIgYXMgdGhlIGNvbnZlcnNhdGlvbiB3aW5kb3c/JyxcbiAgICApO1xuXG4gICAgY29uc3Qgc2VuZEJ1dHRvbiA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTEJ1dHRvbkVsZW1lbnQ+KFxuICAgICAgREVGSU5FRC50c0NoZWNrKGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKFwiLkFJX0xMQU1BX0NIQVRfU2VuZFwiKSksXG4gICAgICBIVE1MQnV0dG9uRWxlbWVudCxcbiAgICAgICdJcyB0aGVyZSBhIHNlbmQgYnV0dG9uIGVsZW1lbnQgdGFnZ2VkIHdpdGggQ1NTLUNsYXNzIFwiQUlfTExBTUFfQ0hBVF9TZW5kXCIgaW4gdGhlIHNhbWUgY29udGFpbmVyIGFzIHRoZSBjb252ZXJzYXRpb24gd2luZG93PycsXG4gICAgKTtcblxuICAgIGNvbnN0IHN0b3BCdXR0b24gPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxCdXR0b25FbGVtZW50PihcbiAgICAgIGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKFwiLkFJX0xMQU1BX0NIQVRfU3RvcFwiKSxcbiAgICAgIEhUTUxCdXR0b25FbGVtZW50LFxuICAgICAgYElzbid0IHRoZSBlbGVtZW50IHRhZ2dlZCB3aXRoIFwiLkFJX0xMQU1BX0NIQVRfU3RvcFwiIGEgPGJ1dHRvbj4/YCxcbiAgICApO1xuICAgIC8vICNyZWdpb24gQ2hlY2sgdGhlIHVwbG9hZCBlbGVtZW50IGlmIGl0IGV4aXN0cywgYnV0IGl0J3Mgb3B0aW9uYWwgc28gaXQgbWF5IGJlIG51bGwuXG4gICAgY29uc3QgZmlsZVVwbG9hZCA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTElucHV0RWxlbWVudD4oXG4gICAgICBjb250YWluZXIucXVlcnlTZWxlY3RvcihcIi5BSV9MTEFNQV9DSEFUX1VwbG9hZFwiKSxcbiAgICAgIEhUTUxJbnB1dEVsZW1lbnQsXG4gICAgICBgSXNuJ3QgdGhlIGVsZW1lbnQgdGFnZ2VkIHdpdGggXCIuQUlfTExBTUFfQ0hBVF9VcGxvYWRcIiBhbiA8aW5wdXQ+P2AsXG4gICAgKTtcblxuICAgIGlmIChmaWxlVXBsb2FkKSB7XG4gICAgICBFUS50c0NoZWNrKFxuICAgICAgICBmaWxlVXBsb2FkLnR5cGUsXG4gICAgICAgIFwiZmlsZVwiLFxuICAgICAgICBgSXNuJ3QgdGhlIGVsZW1lbnQgdGFnZ2VkIHdpdGggXCIuQUlfTExBTUFfQ0hBVF9VcGxvYWRcIiBhbiA8aW5wdXQ+IG9mIHR5cGUgXCJmaWxlXCI/YCxcbiAgICAgICk7XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgdGhlIHVwbG9hZCBlbGVtZW50IGlmIGl0IGV4aXN0cywgYnV0IGl0J3Mgb3B0aW9uYWwgc28gaXQgbWF5IGJlIG51bGwuXG4gICAgLy8gI3JlZ2lvbiBDaGVjayB0aGUgdGhpbmtpbmcgbW9kZSBjaGVja2JveCBpZiBpdCBleGlzdHMsIGJ1dCBpdCdzIG9wdGlvbmFsIHNvIGl0IG1heSBiZSBudWxsLlxuICAgIGNvbnN0IHRoaW5raW5nQ2hlY2tib3ggPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxJbnB1dEVsZW1lbnQ+KFxuICAgICAgY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoXCIuQUlfTExBTUFfQ0hBVF9UaGlua2luZ1wiKSxcbiAgICAgIEhUTUxJbnB1dEVsZW1lbnQsXG4gICAgICAnSXNuXFwndCB0aGUgZWxlbWVudCB0YWdnZWQgd2l0aCBcIi5BSV9MTEFNQV9DSEFUX1RoaW5raW5nXCIgYW4gPGlucHV0PiAoY2hlY2tib3gpPycsXG4gICAgKTtcblxuICAgIGlmICh0aGlua2luZ0NoZWNrYm94KSB7XG4gICAgICBFUS50c0NoZWNrKFxuICAgICAgICB0aGlua2luZ0NoZWNrYm94LnR5cGUsXG4gICAgICAgIFwiY2hlY2tib3hcIixcbiAgICAgICAgYElzbid0IHRoZSBlbGVtZW50IHRhZ2dlZCB3aXRoIFwiLkFJX0xMQU1BX0NIQVRfVGhpbmtpbmdcIiBhbiA8aW5wdXQ+IG9mIHR5cGUgXCJjaGVja2JveFwiP2AsXG4gICAgICApO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIHRoZSB0aGlua2luZyBtb2RlIGNoZWNrYm94IGlmIGl0IGV4aXN0cywgYnV0IGl0J3Mgb3B0aW9uYWwgc28gaXQgbWF5IGJlIG51bGwuXG4gICAgLy8gI3JlZ2lvbiBDaGVjayB0aGUgaW50ZXJuZXQgYWNjZXNzIGNoZWNrYm94IGlmIGl0IGV4aXN0cywgYnV0IGl0J3Mgb3B0aW9uYWwgc28gaXQgbWF5IGJlIG51bGwuXG4gICAgY29uc3Qgc2VhcmNoQ2hlY2tib3ggPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxJbnB1dEVsZW1lbnQ+KFxuICAgICAgY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoXCIuQUlfTExBTUFfQ0hBVF9JbnRlcm5ldFwiKSxcbiAgICAgIEhUTUxJbnB1dEVsZW1lbnQsXG4gICAgKTtcblxuICAgIGlmIChzZWFyY2hDaGVja2JveCkge1xuICAgICAgRVEudHNDaGVjayhcbiAgICAgICAgc2VhcmNoQ2hlY2tib3gudHlwZSxcbiAgICAgICAgXCJjaGVja2JveFwiLFxuICAgICAgICBgSXNuJ3QgdGhlIGVsZW1lbnQgdGFnZ2VkIHdpdGggXCIuQUlfTExBTUFfQ0hBVF9JbnRlcm5ldFwiIGFuIDxpbnB1dD4gb2YgdHlwZSBcImNoZWNrYm94XCI/YCxcbiAgICAgICk7XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgdGhlIGludGVybmV0IGFjY2VzcyBjaGVja2JveCBpZiBpdCBleGlzdHMsIGJ1dCBpdCdzIG9wdGlvbmFsIHNvIGl0IG1heSBiZSBudWxsLlxuICAgIC8vICNyZWdpb24gQ2hlY2sgdGhlIGxvY2F0aW9uIGFjY2VzcyBjaGVja2JveCBpZiBpdCBleGlzdHMsIGJ1dCBpdCdzIG9wdGlvbmFsIHNvIGl0IG1heSBiZSBudWxsLlxuICAgIGNvbnN0IGxvY2F0aW9uQ2hlY2tib3ggPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxJbnB1dEVsZW1lbnQ+KFxuICAgICAgY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoXCIuQUlfTExBTUFfQ0hBVF9Mb2NhdGlvblwiKSxcbiAgICAgIEhUTUxJbnB1dEVsZW1lbnQsXG4gICAgKTtcblxuICAgIGlmIChsb2NhdGlvbkNoZWNrYm94KSB7XG4gICAgICBFUS50c0NoZWNrKFxuICAgICAgICBsb2NhdGlvbkNoZWNrYm94LnR5cGUsXG4gICAgICAgIFwiY2hlY2tib3hcIixcbiAgICAgICAgYElzbid0IHRoZSBlbGVtZW50IHRhZ2dlZCB3aXRoIFwiLkFJX0xMQU1BX0NIQVRfTG9jYXRpb25cIiBhbiA8aW5wdXQ+IG9mIHR5cGUgXCJjaGVja2JveFwiP2AsXG4gICAgICApO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIHRoZSBsb2NhdGlvbiBhY2Nlc3MgY2hlY2tib3ggaWYgaXQgZXhpc3RzLCBidXQgaXQncyBvcHRpb25hbCBzbyBpdCBtYXkgYmUgbnVsbC5cbiAgICAvLyAjcmVnaW9uIENoZWNrIHRoZSBtYWlsLWZvcndhcmQgY2hlY2tib3ggaWYgaXQgZXhpc3RzLCBidXQgaXQncyBvcHRpb25hbCBzbyBpdCBtYXkgYmUgbnVsbC5cbiAgICBjb25zdCBtYWlsRm9yd2FyZENoZWNrYm94ID0gSU5TVEFOQ0UudHNDaGVjazxIVE1MSW5wdXRFbGVtZW50PihcbiAgICAgIGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKFwiLkFJX0xMQU1BX0NIQVRfTWFpbEZvcndhcmRcIiksXG4gICAgICBIVE1MSW5wdXRFbGVtZW50LFxuICAgICk7XG5cbiAgICBpZiAobWFpbEZvcndhcmRDaGVja2JveCkge1xuICAgICAgRVEudHNDaGVjayhcbiAgICAgICAgbWFpbEZvcndhcmRDaGVja2JveC50eXBlLFxuICAgICAgICBcImNoZWNrYm94XCIsXG4gICAgICAgIGBJc24ndCB0aGUgZWxlbWVudCB0YWdnZWQgd2l0aCBcIi5BSV9MTEFNQV9DSEFUX01haWxGb3J3YXJkXCIgYW4gPGlucHV0PiBvZiB0eXBlIFwiY2hlY2tib3hcIj9gLFxuICAgICAgKTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDaGVjayB0aGUgbWFpbC1mb3J3YXJkIGNoZWNrYm94IGlmIGl0IGV4aXN0cywgYnV0IGl0J3Mgb3B0aW9uYWwgc28gaXQgbWF5IGJlIG51bGwuXG4gICAgLy8gI3JlZ2lvbiBDaGVjayB0aGUgbWFpbC1hZGRyZXNzIGlucHV0IGlmIGl0IGV4aXN0cywgYnV0IGl0J3Mgb3B0aW9uYWwgc28gaXQgbWF5IGJlIG51bGwuXG4gICAgY29uc3QgbWFpbEFkZHJlc3NJbnB1dCA9IE9SLnRzQ2hlY2s8SFRNTElucHV0RWxlbWVudD4oXG4gICAgICBjb250YWluZXIucXVlcnlTZWxlY3RvcihcIi5BSV9MTEFNQV9DSEFUX01haWxBZGRyZXNzXCIpLFxuICAgICAgW25ldyBJTlNUQU5DRShIVE1MSW5wdXRFbGVtZW50KV0sXG4gICAgICAnSXMgdGhlcmUgYSBtYWlsIGFkZHJlc3MgaW5wdXQgZWxlbWVudCB0YWdnZWQgd2l0aCBDU1MtQ2xhc3MgXCJBSV9MTEFNQV9DSEFUX01haWxBZGRyZXNzXCIgaW4gdGhlIHNhbWUgY29udGFpbmVyPycsXG4gICAgKTtcblxuICAgIGlmIChtYWlsQWRkcmVzc0lucHV0KSB7XG4gICAgICBtYWlsQWRkcmVzc0lucHV0LnN0eWxlLmRpc3BsYXkgPSBtYWlsRm9yd2FyZENoZWNrYm94Py5jaGVja2VkID8gXCJcIiA6IFwibm9uZVwiO1xuICAgIH1cblxuICAgIGlmIChtYWlsRm9yd2FyZENoZWNrYm94ICYmIG1haWxBZGRyZXNzSW5wdXQpIHtcbiAgICAgIG1haWxGb3J3YXJkQ2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICAgIG1haWxBZGRyZXNzSW5wdXQuc3R5bGUuZGlzcGxheSA9IG1haWxGb3J3YXJkQ2hlY2tib3guY2hlY2tlZCA/IFwiXCIgOiBcIm5vbmVcIjtcbiAgICAgIH0pO1xuICAgIH1cbiAgICAvLyAjcmVnaW9uIENoZWNrIHRoZSBhbGVydC1vbi1maW5pc2ggY2hlY2tib3ggaWYgaXQgZXhpc3RzLCBidXQgaXQncyBvcHRpb25hbCBzbyBpdCBtYXkgYmUgbnVsbC5cbiAgICBjb25zdCBhbGVydE9uRmluaXNoQ2hlY2tib3ggPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxJbnB1dEVsZW1lbnQ+KFxuICAgICAgY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoXCIuQUlfTExBTUFfQ0hBVF9BbGVydE9uRmluaXNoXCIpLFxuICAgICAgSFRNTElucHV0RWxlbWVudCxcbiAgICApO1xuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgdGhlIGFsZXJ0LW9uLWZpbmlzaCBjaGVja2JveCBpZiBpdCBleGlzdHMsIGJ1dCBpdCdzIG9wdGlvbmFsIHNvIGl0IG1heSBiZSBudWxsLlxuXG4gICAgLy8gI3JlZ2lvbiBBbGVydC1vbi1maW5pc2ggY3VzdG9taXphYmxlIHRleHRcbiAgICBjb25zdCBhbGVydE9uRmluaXNoVGV4dCA9XG4gICAgICB0eXBlb2YgdG9Mb2FkLmFsZXJ0b25maW5pc2h0ZXh0ID09PSBcInN0cmluZ1wiICYmIHRvTG9hZC5hbGVydG9uZmluaXNodGV4dC50cmltKClcbiAgICAgICAgPyB0b0xvYWQuYWxlcnRvbmZpbmlzaHRleHQudHJpbSgpXG4gICAgICAgIDogXCJJbmZlcmVuY2UgaGFzIGZpbmlzaGVkLlwiO1xuICAgIC8vICNlbmRyZWdpb24gQWxlcnQtb24tZmluaXNoIGN1c3RvbWl6YWJsZSB0ZXh0XG5cbiAgICAvLyAjcmVnaW9uIEFsZXJ0LW9uLWZpbmlzaDogcmVxdWVzdCBub3RpZmljYXRpb24gcGVybWlzc2lvbiB3aGVuIGNoZWNrYm94IGlzIGNsaWNrZWRcbiAgICBpZiAoYWxlcnRPbkZpbmlzaENoZWNrYm94KSB7XG4gICAgICBhbGVydE9uRmluaXNoQ2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICAgIGlmIChhbGVydE9uRmluaXNoQ2hlY2tib3guY2hlY2tlZCAmJiBcIk5vdGlmaWNhdGlvblwiIGluIHdpbmRvdykge1xuICAgICAgICAgIGlmIChOb3RpZmljYXRpb24ucGVybWlzc2lvbiA9PT0gXCJkZWZhdWx0XCIpIHtcbiAgICAgICAgICAgIE5vdGlmaWNhdGlvbi5yZXF1ZXN0UGVybWlzc2lvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gQWxlcnQtb24tZmluaXNoOiByZXF1ZXN0IG5vdGlmaWNhdGlvbiBwZXJtaXNzaW9uIHdoZW4gY2hlY2tib3ggaXMgY2xpY2tlZFxuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgdGhlIG1haWwtYWRkcmVzcyBpbnB1dCBpZiBpdCBleGlzdHMsIGJ1dCBpdCdzIG9wdGlvbmFsIHNvIGl0IG1heSBiZSBudWxsLlxuICAgIC8vICNlbmRyZWdpb24gRGlzY292ZXIgc2libGluZyBlbGVtZW50c1xuICAgIGxldCBtaWNCdXR0b246IEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbCA9IG51bGw7IC8vIE1pY3JvcGhvbmUgYnV0dG9uIChzcGVlY2gtdG8tdGV4dCB2aWEgV2hpc3BlciBvbiBDb2RCaSBzZXJ2ZXIpLlxuICAgIGxldCBpc1JlY29yZGluZyA9IGZhbHNlO1xuICAgIGxldCBpc1RyYW5zY3JpYmluZyA9IGZhbHNlO1xuICAgIGxldCB3aGlzcGVyTWVkaWFSZWNvcmRlcjogTWVkaWFSZWNvcmRlciB8IG51bGwgPSBudWxsO1xuICAgIGxldCB3aGlzcGVyQXVkaW9DaHVua3M6IEJsb2JbXSA9IFtdO1xuICAgIGxldCB3aGlzcGVyQ29udmVydFN1cHBvcnRlZCA9IHRydWU7XG4gICAgbGV0IHN0b3BSZWNvcmRpbmdGbjogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7IC8vIFN0b3BzIHRoZSBjdXJyZW50IHJlY29yZGluZyAobm8tb3Agd2hlbiBubyBtaWMgaXMgc2V0IHVwKS5cbiAgICBsZXQgd2hpc3BlclVybDogc3RyaW5nIHwgbnVsbCA9IG51bGw7IC8vIFJlc29sdmUgdGhlIFdoaXNwZXIgcGx1Z2luIHNlcnZsZXQgVVJMXG5cbiAgICB0cnkge1xuICAgICAgd2hpc3BlclVybCA9IGAke3dpbmRvdy5jb2RiaS5iYXNlVVJMfXBsdWdpbj9uYW1lPUNvZEJpX0FJX1doaXNwZXJgO1xuICAgIH0gY2F0Y2ggKF9lKSB7IH1cbiAgICAvKipcbiAgICAgKiBTZXRzIHVwIHRoZSBXaGlzcGVyIG1pYyBidXR0b24uIENhbGxlZCBhc3luY2hyb25vdXNseSBhZnRlciB0aGUgaGVhbHRoLWNoZWNrIGNvbmZpcm1zIHRoZSBXaGlzcGVyIHNlcnZlciBpcyByZWFkeS5cbiAgICAgKiBJZiB0aGUgaGVhbHRoLWNoZWNrIGZhaWxzIHRoZSBtaWMgaXMgbmV2ZXIgY3JlYXRlZCBhbmQgc3BlZWNoIGlucHV0IGlzIHNpbXBseSB1bmF2YWlsYWJsZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwbHVnaW5VcmwgVGhlIFVSTCB0byBzZW5kIGF1ZGlvIGRhdGEgdG8gZm9yIHRyYW5zY3JpcHRpb24uICovXG4gICAgY29uc3Qgc2V0dXBXaGlzcGVyTWljID0gKHBsdWdpblVybDogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgICBjb25zdCBpbnB1dFdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gICAgICBpbnB1dFdyYXBwZXIuY2xhc3NOYW1lID0gXCJMTEFNQV9DaGF0X0lucHV0V3JhcHBlclwiO1xuXG4gICAgICBERUZJTkVELnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KGNoYXRJbnB1dC5wYXJlbnRFbGVtZW50KS5pbnNlcnRCZWZvcmUoaW5wdXRXcmFwcGVyLCBjaGF0SW5wdXQpO1xuXG4gICAgICBpbnB1dFdyYXBwZXIuYXBwZW5kQ2hpbGQoY2hhdElucHV0KTtcblxuICAgICAgbWljQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgIG1pY0J1dHRvbi50eXBlID0gXCJidXR0b25cIjtcbiAgICAgIG1pY0J1dHRvbi5jbGFzc05hbWUgPSBcIkxMQU1BX0NoYXRfTWljQnV0dG9uXCI7XG4gICAgICBtaWNCdXR0b24udGl0bGUgPSBcIlZvaWNlIGlucHV0IChXaGlzcGVyKVwiO1xuICAgICAgbWljQnV0dG9uLmlubmVySFRNTCA9IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiB3aWR0aD1cIjE4XCIgaGVpZ2h0PVwiMThcIiBmaWxsPVwiY3VycmVudENvbG9yXCI+PHBhdGggZD1cIk0xMiAxNGEzIDMgMCAwIDAgMy0zVjVhMyAzIDAgMCAwLTYgMHY2YTMgMyAwIDAgMCAzIDN6bS0xLTlhMSAxIDAgMSAxIDIgMHY2YTEgMSAwIDEgMS0yIDBWNXptNiA2YTUgNSAwIDAgMS0xMCAwSDVhNyA3IDAgMCAwIDYgNi45M1YyMWgydi0zLjA3QTcgNyAwIDAgMCAxOSAxMWgtMnpcIi8+PC9zdmc+YDtcblxuICAgICAgaW5wdXRXcmFwcGVyLmFwcGVuZENoaWxkKG1pY0J1dHRvbik7XG5cbiAgICAgIGNvbnN0IG1pYyA9IG1pY0J1dHRvbjtcbiAgICAgIC8vIERpc2FibGUgbWljIGlmIHRoZSBMTEFNQSBtb2RlbCBoYXNuJ3QgbG9hZGVkIHlldFxuICAgICAgaWYgKGNoYXRJbnB1dC5kaXNhYmxlZCkge1xuICAgICAgICBtaWMuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBsYW5nID0gdG9Mb2FkLmxhbmd1YWdlICE9IG51bGwgPyBTdHJpbmcodG9Mb2FkLmxhbmd1YWdlKS50cmltKCkgOiBcIlwiOyAvLyBMYW5ndWFnZSBmb3IgV2hpc3BlciAoYXV0by1kZXRlY3Qgd2hlbiBlbXB0eSlcbiAgICAgIC8vICNyZWdpb24gU2VuZCBhdWRpbyB0byBXaGlzcGVyIGZvciB0cmFuc2NyaXB0aW9uLlxuICAgICAgbGV0IGludGVyaW1JbnRlcnZhbDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gICAgICBsZXQgaW50ZXJpbUluRmxpZ2h0ID0gZmFsc2U7XG4gICAgICBsZXQgcHJlUmVjb3JkaW5nVGV4dCA9IFwiXCI7IC8vIFRleHQgYmVmb3JlIHJlY29yZGluZyBzdGFydGVkIFx1MjAxNCBpbnRlcmltIHJlc3VsdHMgcmVwbGFjZSBldmVyeXRoaW5nIGFmdGVyIHRoaXMuXG4gICAgICAvKipcbiAgICAgICAqIFNlbmRzIGFjY3VtdWxhdGVkIGF1ZGlvIGZvciBhbiBpbnRlcmltIChtaWQtcmVjb3JkaW5nKSB0cmFuc2NyaXB0aW9uLlxuICAgICAgICogVGhlIHJlc3VsdCByZXBsYWNlcyB0aGUgdGV4dCBhZnRlciBwcmVSZWNvcmRpbmdUZXh0LlxuICAgICAgICogT25seSBvbmUgaW50ZXJpbSByZXF1ZXN0IHJ1bnMgYXQgYSB0aW1lLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbXMgYXVkaW9CbG9iIFRoZSBhdWRpbyBkYXRhIHRvIHNlbmQgZm9yIHRyYW5zY3JpcHRpb24uICovXG4gICAgICBjb25zdCBzZW5kSW50ZXJpbVRyYW5zY3JpcHRpb24gPSBhc3luYyAoYXVkaW9CbG9iOiBCbG9iKSA9PiB7XG4gICAgICAgIGlmIChpbnRlcmltSW5GbGlnaHQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpbnRlcmltSW5GbGlnaHQgPSB0cnVlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbGV0IGJsb2IgPSBhdWRpb0Jsb2I7XG5cbiAgICAgICAgICBpZiAoIXdoaXNwZXJDb252ZXJ0U3VwcG9ydGVkKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBibG9iID0gYXdhaXQgY29udmVydFRvV2F2KGJsb2IpO1xuICAgICAgICAgICAgfSBjYXRjaCAoWCkge1xuICAgICAgICAgICAgICBpbnRlcmltSW5GbGlnaHQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vICNyZWdpb24gQ29udmVydCBhdWRpbyBCbG9iIHRvIGRhdGEgVVJMIGZvciB0cmFuc21pc3Npb24uXG4gICAgICAgICAgY29uc3QgZGF0YVVybCA9IGF3YWl0IG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZGVuZCA9ICgpID0+IHJlc29sdmUocmVhZGVyLnJlc3VsdCBhcyBzdHJpbmcpO1xuICAgICAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSAoKSA9PiByZWplY3QobmV3IENvZEJpRXJyb3IoXCJbQUkgLyBMTEFNQSAvIENIQVQgXSBGYWlsZWQgdG8gcmVhZCBhdWRpbyBibG9iXCIpKTtcblxuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoYmxvYik7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgLy8gI2VuZHJlZ2lvbiBDb252ZXJ0IGF1ZGlvIEJsb2IgdG8gZGF0YSBVUkwgZm9yIHRyYW5zbWlzc2lvbi5cbiAgICAgICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuXG4gICAgICAgICAgZm9ybURhdGEuYXBwZW5kKFwiY29kYmktYmFzZTY0OmF1ZGlvXCIsIGRhdGFVcmwpO1xuXG4gICAgICAgICAgY29uc3QgYWpheEhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcblxuICAgICAgICAgIGlmIChsYW5nKSB7XG4gICAgICAgICAgICBhamF4SGVhZGVyc1tcIlgtTGFuZ3VhZ2VcIl0gPSBsYW5nO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyAjcmVnaW9uIFNlbmQgQUpBWCByZXF1ZXN0IHRvIFdoaXNwZXIgcGx1Z2luIGZvciB0cmFuc2NyaXB0aW9uLlxuICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHBsdWdpblVybCxcbiAgICAgICAgICAgIHR5cGU6IFwiUE9TVFwiLFxuICAgICAgICAgICAgZGF0YTogZm9ybURhdGEsXG4gICAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICBoZWFkZXJzOiBhamF4SGVhZGVycyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IChyZXNwb25zZTogdW5rbm93bikgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWlzUmVjb3JkaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9IC8vIElnbm9yZSByZXN1bHRzIGFycml2aW5nIGFmdGVyIHJlY29yZGluZyBzdG9wcGVkIChlLmcuIGZyb20gaW50ZXJpbSByZXF1ZXN0cyB0cmlnZ2VyZWQgcmlnaHQgYmVmb3JlIHN0b3BwaW5nKVxuICAgICAgICAgICAgICAvLyAjcmVnaW9uIFBhcnNlIHJlc3BvbnNlLlxuICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSAodHlwZW9mIHJlc3BvbnNlID09PSBcInN0cmluZ1wiID8gSlNPTi5wYXJzZShyZXNwb25zZSkgOiByZXNwb25zZSkgYXMge1xuICAgICAgICAgICAgICAgIHRleHQ/OiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgZXJyb3I/OiBzdHJpbmc7XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gUGFyc2UgcmVzcG9uc2UuXG4gICAgICAgICAgICAgIC8vICNyZWdpb24gU2hvdyByZXN1bHQuXG4gICAgICAgICAgICAgIGlmIChyZXN1bHQudGV4dCkge1xuICAgICAgICAgICAgICAgIGNoYXRJbnB1dC52YWx1ZSA9XG4gICAgICAgICAgICAgICAgICBwcmVSZWNvcmRpbmdUZXh0ICtcbiAgICAgICAgICAgICAgICAgIChwcmVSZWNvcmRpbmdUZXh0ICYmICFwcmVSZWNvcmRpbmdUZXh0LmVuZHNXaXRoKFwiIFwiKSA/IFwiIFwiIDogXCJcIikgK1xuICAgICAgICAgICAgICAgICAgcmVzdWx0LnRleHQudHJpbSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gU2hvdyByZXN1bHQuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgaW50ZXJpbUluRmxpZ2h0ID0gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIC8vICNlbmRyZWdpb24gU2VuZCBBSkFYIHJlcXVlc3QgdG8gV2hpc3BlciBwbHVnaW4gZm9yIHRyYW5zY3JpcHRpb24uXG4gICAgICAgIH0gY2F0Y2ggKFgpIHtcbiAgICAgICAgICBpbnRlcmltSW5GbGlnaHQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIC8qKlxuICAgICAgICogU2VuZHMgdGhlIGdpdmVuIHtAbGluayBCbG9iIH0gdG8gdGhlIENvZEJpJ3MgV2hpc3Blci1Nb2RlbCBmcm8gdHJhbnNyaXB0aW9uLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSBhdWRpQmxvYiBUaGUge0BsaW5rIEJsb2IgfSB0byBzZW5kLiAqL1xuICAgICAgY29uc3Qgc2VuZEZvclRyYW5zY3JpcHRpb24gPSBhc3luYyAoYXVkaW9CbG9iOiBCbG9iKSA9PiB7XG4gICAgICAgIGlzVHJhbnNjcmliaW5nID0gdHJ1ZTtcblxuICAgICAgICBtaWMuY2xhc3NMaXN0LmFkZChcIkxMQU1BX0NoYXRfTWljQnV0dG9uLS10cmFuc2NyaWJpbmdcIik7XG5cbiAgICAgICAgbWljLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGVzIHRoZSBtaWMgYnV0dG9uIGFuZCByZXNldHMgdGhlIHRyYW5zY3JpYmluZyBzdGF0ZS4gVXNlZCBpbiBtdWx0aXBsZSBwbGFjZXMgdG8gZW5zdXJlIGNvbnNpc3RlbnQgY2xlYW51cCBhZnRlclxuICAgICAgICAgKiB0cmFuc2NyaXB0aW9uIGVuZHMsIHdoZXRoZXIgc3VjY2Vzc2Z1bCBvciBkdWUgdG8gYW4gZXJyb3IuICovXG4gICAgICAgIGNvbnN0IGRpc2FibGVNaWMgPSAoKSA9PiB7XG4gICAgICAgICAgaXNUcmFuc2NyaWJpbmcgPSBmYWxzZTtcblxuICAgICAgICAgIG1pYy5jbGFzc0xpc3QucmVtb3ZlKFwiTExBTUFfQ2hhdF9NaWNCdXR0b24tLXRyYW5zY3JpYmluZ1wiKTtcblxuICAgICAgICAgIG1pYy5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICB9O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGRhdGFVcmwgPSBhd2FpdCBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWRlbmQgPSAoKSA9PiByZXNvbHZlKHJlYWRlci5yZXN1bHQgYXMgc3RyaW5nKTtcbiAgICAgICAgICAgIHJlYWRlci5vbmVycm9yID0gKCkgPT4gcmVqZWN0KG5ldyBFcnJvcihcIkZhaWxlZCB0byByZWFkIGF1ZGlvIGJsb2IuXCIpKTtcblxuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoYXVkaW9CbG9iKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG5cbiAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoXCJjb2RiaS1iYXNlNjQ6YXVkaW9cIiwgZGF0YVVybCk7XG5cbiAgICAgICAgICBjb25zdCBhamF4SGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gICAgICAgICAgaWYgKGxhbmcpIHtcbiAgICAgICAgICAgIGFqYXhIZWFkZXJzW1wiWC1MYW5ndWFnZVwiXSA9IGxhbmc7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vICNyZWdpb24gU2VuZCB0aGUgW2F1ZGlvQmxvYl0uXG4gICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogcGx1Z2luVXJsLFxuICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXG4gICAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZSxcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgIGhlYWRlcnM6IGFqYXhIZWFkZXJzLFxuICAgICAgICAgICAgc3VjY2VzczogKHJlc3BvbnNlOiB1bmtub3duKSA9PiB7XG4gICAgICAgICAgICAgIC8vICNyZWdpb24gUGFyc2UgcmVzcG9uc2UuXG4gICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9ICh0eXBlb2YgcmVzcG9uc2UgPT09IFwic3RyaW5nXCIgPyBKU09OLnBhcnNlKHJlc3BvbnNlKSA6IHJlc3BvbnNlKSBhcyB7XG4gICAgICAgICAgICAgICAgdGV4dD86IHN0cmluZztcbiAgICAgICAgICAgICAgICBlcnJvcj86IHN0cmluZztcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBQYXJzZSByZXNwb25zZS5cbiAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBMb2cgZmFpbHVyZS5cbiAgICAgICAgICAgICAgaWYgKHJlc3VsdC5lcnJvcikge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5jb2RiaS5sb2coXCJFUlJPUlwiLCBgV2hpc3BlcjogJHtyZXN1bHQuZXJyb3J9YCwgXCJBSSAvIExMQU1BIC8gQ0hBVFwiKTtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIExvZyBmYWlsdXJlLlxuICAgICAgICAgICAgICAvLyAjcmVnaW9uIFNob3cgcmVzdWx0LlxuICAgICAgICAgICAgICBpZiAocmVzdWx0LnRleHQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzZXBhcmF0b3IgPSBwcmVSZWNvcmRpbmdUZXh0ICYmICFwcmVSZWNvcmRpbmdUZXh0LmVuZHNXaXRoKFwiIFwiKSA/IFwiIFwiIDogXCJcIjtcblxuICAgICAgICAgICAgICAgIGNoYXRJbnB1dC52YWx1ZSA9IHByZVJlY29yZGluZ1RleHQgKyBzZXBhcmF0b3IgKyByZXN1bHQudGV4dC50cmltKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBTaG93IHJlc3VsdC5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogKF94aHI6IHVua25vd24sIF9zdGF0dXM6IHVua25vd24sIGVycm9yOiB1bmtub3duKSA9PiB7XG4gICAgICAgICAgICAgIHdpbmRvdy5jb2RiaS5sb2coXCJFUlJPUlwiLCBgV2hpc3BlciB0cmFuc2NyaXB0aW9uIGZhaWxlZDogJHtTdHJpbmcoZXJyb3IpfWAsIFwiQUkgLyBMTEFNQSAvIENIQVRcIik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgZGlzYWJsZU1pYygpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uIFNlbmQgdGhlIFthdWRpb0Jsb2JdLlxuICAgICAgICB9IGNhdGNoIChYKSB7XG4gICAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcbiAgICAgICAgICAgIFwiRVJST1JcIixcbiAgICAgICAgICAgIGBXaGlzcGVyIHRyYW5zY3JpcHRpb24gZmFpbGVkOiAke1ggaW5zdGFuY2VvZiBFcnJvciA/IFgubWVzc2FnZSA6IFN0cmluZyhYKX1gLFxuICAgICAgICAgICAgXCJBSSAvIExMQU1BIC8gQ0hBVFwiLFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBkaXNhYmxlTWljKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICAvLyAjZW5kcmVnaW9uIFNlbmQgYXVkaW8gdG8gV2hpc3BlciBmb3IgdHJhbnNjcmlwdGlvblxuICAgICAgLyoqXG4gICAgICAgKiBTdGFydHMgcmVjb3JkaW5nIGF1ZGlvIGZyb20gdGhlIHVzZXIncyBtaWNyb3Bob25lIGFuZCBzZXRzIHVwIGhhbmRsZXJzIHRvIHByb2Nlc3MgdGhlIHJlY29yZGVkIGRhdGEuIFRoZSBhY2N1bXVsYXRlZFxuICAgICAgICogYXVkaW8gaXMgc2VudCBmb3IgdHJhbnNjcmlwdGlvbi4gKi9cbiAgICAgIGNvbnN0IHN0YXJ0UmVjb3JkaW5nID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHsgYXVkaW86IHRydWUgfSk7XG5cbiAgICAgICAgICB3aGlzcGVyQXVkaW9DaHVua3MgPSBbXTtcbiAgICAgICAgICB3aGlzcGVyTWVkaWFSZWNvcmRlciA9IG5ldyBNZWRpYVJlY29yZGVyKHN0cmVhbSwgeyBtaW1lVHlwZTogcHJlZmVycmVkTWltZVR5cGUoKSB9KTtcbiAgICAgICAgICAvLyAjcmVnaW9uIEFjY3VtdWxhdGUgZGF0YS5cbiAgICAgICAgICB3aGlzcGVyTWVkaWFSZWNvcmRlci5vbmRhdGFhdmFpbGFibGUgPSAoZTogQmxvYkV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoZS5kYXRhLnNpemUgPiAwKSB7XG4gICAgICAgICAgICAgIHdoaXNwZXJBdWRpb0NodW5rcy5wdXNoKGUuZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uIEFjY3VtdWxhdGUgZGF0YS5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBTdG9wcyB0aGUgcmVjb3JkaW5nLCByZWxlYXNlcyB0aGUgbWljcm9waG9uZSwgYW5kIHNlbmRzIHRoZSBhY2N1bXVsYXRlZCBhdWRpbyBmb3IgdHJhbnNjcmlwdGlvbi4gVGhpcyBpcyBjYWxsZWRcbiAgICAgICAgICAgKiB3aGVuIHRoZSB1c2VyIHN0b3BzIHRoZSByZWNvcmRpbmcuXG4gICAgICAgICAgICpcbiAgICAgICAgICAgKiBAcmV0dXJucyBBIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBzdG9wIHByb2Nlc3MgaXMgY29tcGxldGUuICovXG4gICAgICAgICAgd2hpc3Blck1lZGlhUmVjb3JkZXIub25zdG9wID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCB0cmFjayBvZiBzdHJlYW0uZ2V0VHJhY2tzKCkpIHtcbiAgICAgICAgICAgICAgdHJhY2suc3RvcCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaW50ZXJpbUludGVydmFsKSB7XG4gICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJpbUludGVydmFsKTtcblxuICAgICAgICAgICAgICBpbnRlcmltSW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAod2hpc3BlckF1ZGlvQ2h1bmtzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBhdWRpb0Jsb2IgPSBuZXcgQmxvYih3aGlzcGVyQXVkaW9DaHVua3MsIHsgdHlwZTogd2hpc3Blck1lZGlhUmVjb3JkZXI/Lm1pbWVUeXBlID8/IFwiYXVkaW8vd2VibVwiIH0pO1xuXG4gICAgICAgICAgICBpZiAoIXdoaXNwZXJDb252ZXJ0U3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXVkaW9CbG9iID0gYXdhaXQgY29udmVydFRvV2F2KGF1ZGlvQmxvYik7XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKFgpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuY29kYmkubG9nKFxuICAgICAgICAgICAgICAgICAgXCJFUlJPUlwiLFxuICAgICAgICAgICAgICAgICAgYFdBViBjb252ZXJzaW9uIGZhaWxlZDogJHtYIGluc3RhbmNlb2YgRXJyb3IgPyBYLm1lc3NhZ2UgOiBTdHJpbmcoWCl9YCxcbiAgICAgICAgICAgICAgICAgIFwiQUkgLyBMTEFNQSAvIENIQVRcIixcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbmRGb3JUcmFuc2NyaXB0aW9uKGF1ZGlvQmxvYik7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHByZVJlY29yZGluZ1RleHQgPSBjaGF0SW5wdXQudmFsdWU7XG5cbiAgICAgICAgICB3aGlzcGVyTWVkaWFSZWNvcmRlci5zdGFydCgpO1xuXG4gICAgICAgICAgaXNSZWNvcmRpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgbWljLmNsYXNzTGlzdC5hZGQoXCJMTEFNQV9DaGF0X01pY0J1dHRvbi0tcmVjb3JkaW5nXCIpO1xuXG4gICAgICAgICAgY29uc3QgcmVjID0gd2hpc3Blck1lZGlhUmVjb3JkZXI7IC8vIFBlcmlvZGljIGludGVyaW0gdHJhbnNjcmlwdGlvbiBcdTIwMTQgZmx1c2ggYW5kIHNlbmQgYWNjdW11bGF0ZWQgYXVkaW8gZXZlcnkgfjIuNXNcblxuICAgICAgICAgIGludGVyaW1JbnRlcnZhbCA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoaW50ZXJpbUluRmxpZ2h0IHx8IHJlYy5zdGF0ZSAhPT0gXCJyZWNvcmRpbmdcIikge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlYy5yZXF1ZXN0RGF0YSgpO1xuXG4gICAgICAgICAgICBpZiAod2hpc3BlckF1ZGlvQ2h1bmtzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGJsb2IgPSBuZXcgQmxvYih3aGlzcGVyQXVkaW9DaHVua3MsIHsgdHlwZTogcmVjLm1pbWVUeXBlIH0pO1xuXG4gICAgICAgICAgICBzZW5kSW50ZXJpbVRyYW5zY3JpcHRpb24oYmxvYik7XG4gICAgICAgICAgfSwgMjUwMCk7XG4gICAgICAgIH0gY2F0Y2ggKFgpIHtcbiAgICAgICAgICBtaWMuY2xhc3NMaXN0LmFkZChcIkxMQU1BX0NoYXRfTWljQnV0dG9uLS11bmF2YWlsYWJsZVwiKTtcblxuICAgICAgICAgIG1pYy50aXRsZSA9IFwiTWljcm9waG9uZSBhY2Nlc3MgZGVuaWVkXCI7XG4gICAgICAgICAgbWljLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIC8qKlxuICAgICAgICogU3RvcHMgdGhlIGN1cnJlbnQgcmVjb3JkaW5nIChpZiBhbnkpLCByZXNldHMgdGhlIG1pYyBidXR0b24gc3RhdGUsIGFuZCByZWxlYXNlcyB0aGUgbWljcm9waG9uZS4gVGhpcyBpcyBjYWxsZWQgd2hlbiB0aGVcbiAgICAgICAqIHVzZXIgc3RvcHMgdGhlIHJlY29yZGluZy4gKi9cbiAgICAgIGNvbnN0IHN0b3BSZWNvcmRpbmcgPSAoKSA9PiB7XG4gICAgICAgIGlmIChpbnRlcmltSW50ZXJ2YWwpIHtcbiAgICAgICAgICBjbGVhckludGVydmFsKGludGVyaW1JbnRlcnZhbCk7XG5cbiAgICAgICAgICBpbnRlcmltSW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHdoaXNwZXJNZWRpYVJlY29yZGVyICYmIHdoaXNwZXJNZWRpYVJlY29yZGVyLnN0YXRlICE9PSBcImluYWN0aXZlXCIpIHtcbiAgICAgICAgICB3aGlzcGVyTWVkaWFSZWNvcmRlci5zdG9wKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpc1JlY29yZGluZyA9IGZhbHNlO1xuXG4gICAgICAgIG1pYy5jbGFzc0xpc3QucmVtb3ZlKFwiTExBTUFfQ2hhdF9NaWNCdXR0b24tLXJlY29yZGluZ1wiKTtcbiAgICAgIH07XG5cbiAgICAgIHN0b3BSZWNvcmRpbmdGbiA9IHN0b3BSZWNvcmRpbmc7XG4gICAgICAvKiogVG9nZ2xlcyB0aGUgcmVjb3JkaW5nIHN0YXRlLiBJZiByZWNvcmRpbmcgaXMgaW4gcHJvZ3Jlc3MsIGl0IHN0b3BzIHRoZSByZWNvcmRpbmc7IG90aGVyd2lzZSwgaXQgc3RhcnRzIGEgbmV3IHJlY29yZGluZy4gKi9cbiAgICAgIGNvbnN0IHRvZ2dsZVJlY29yZGluZyA9ICgpID0+IHtcbiAgICAgICAgaWYgKG1pYy5kaXNhYmxlZCB8fCBpc1RyYW5zY3JpYmluZykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNSZWNvcmRpbmcpIHtcbiAgICAgICAgICBzdG9wUmVjb3JkaW5nKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RhcnRSZWNvcmRpbmcoKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgbWljLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0b2dnbGVSZWNvcmRpbmcpO1xuICAgICAgLy8gI3JlZ2lvbiBIYW5kbGUgaG90a2V5cy5cbiAgICAgIGNvbnN0IGhvdGtleURlZiA9ICh0eXBlb2YgdG9Mb2FkLnZvaWNlaG90a2V5ID09PSBcInN0cmluZ1wiICYmIHRvTG9hZC52b2ljZWhvdGtleS50cmltKCkpIHx8IFwiQWx0K0FcIjtcbiAgICAgIGNvbnN0IGhvdGtleVBhcnRzID0gaG90a2V5RGVmLnNwbGl0KFwiK1wiKS5tYXAoKHA6IHN0cmluZykgPT4gcC50cmltKCkpO1xuICAgICAgY29uc3QgaG90a2V5S2V5ID0gaG90a2V5UGFydHNbaG90a2V5UGFydHMubGVuZ3RoIC0gMV0udG9VcHBlckNhc2UoKTtcbiAgICAgIGNvbnN0IG5lZWRBbHQgPSBob3RrZXlQYXJ0cy5zb21lKChwOiBzdHJpbmcpID0+IC9eYWx0JC9pLnRlc3QocCkpO1xuICAgICAgY29uc3QgbmVlZEN0cmwgPSBob3RrZXlQYXJ0cy5zb21lKChwOiBzdHJpbmcpID0+IC9eY3RybCQvaS50ZXN0KHApKTtcbiAgICAgIGNvbnN0IG5lZWRTaGlmdCA9IGhvdGtleVBhcnRzLnNvbWUoKHA6IHN0cmluZykgPT4gL15zaGlmdCQvaS50ZXN0KHApKTtcbiAgICAgIGNvbnN0IG5lZWRNZXRhID0gaG90a2V5UGFydHMuc29tZSgocDogc3RyaW5nKSA9PiAvXm1ldGEkL2kudGVzdChwKSk7XG5cbiAgICAgIG1pYy50aXRsZSA9IGBWb2ljZSBpbnB1dCBcdTIwMTQgV2hpc3BlciAoJHtob3RrZXlEZWZ9KWA7XG5cbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBlLmtleS50b1VwcGVyQ2FzZSgpID09PSBob3RrZXlLZXkgJiZcbiAgICAgICAgICBlLmFsdEtleSA9PT0gbmVlZEFsdCAmJlxuICAgICAgICAgIGUuY3RybEtleSA9PT0gbmVlZEN0cmwgJiZcbiAgICAgICAgICBlLnNoaWZ0S2V5ID09PSBuZWVkU2hpZnQgJiZcbiAgICAgICAgICBlLm1ldGFLZXkgPT09IG5lZWRNZXRhXG4gICAgICAgICkge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAvLyAjcmVnaW9uIFNraXAgaWYgYSBNRURJQV9JTlBVVF9TUEVFQ0ggb3IgTUVESUFfV0hJU1BFUi5cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50Py5jbG9zZXN0KFwiLk1FRElBX1NwZWVjaF9JbnB1dFdyYXBwZXJcIikgfHxcbiAgICAgICAgICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ/LmNsb3Nlc3QoXCIuTUVESUFfV2hpc3Blcl9JbnB1dFdyYXBwZXJcIilcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gI2VuZHJlZ2lvbiBTa2lwIGlmIGEgTUVESUFfSU5QVVRfU1BFRUNIIG9yIE1FRElBX1dISVNQRVIuXG4gICAgICAgICAgdG9nZ2xlUmVjb3JkaW5nKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLy8gI3JlZ2lvbiBIb3RrZXktU2VuZGluZy5cbiAgICAgIGNvbnN0IHNlbmRIb3RrZXlEZWYgPSAodHlwZW9mIHRvTG9hZC52b2ljZXNlbmRob3RrZXkgPT09IFwic3RyaW5nXCIgJiYgdG9Mb2FkLnZvaWNlc2VuZGhvdGtleS50cmltKCkpIHx8IFwiQWx0K1FcIjtcbiAgICAgIGNvbnN0IHNIUGFydHMgPSBzZW5kSG90a2V5RGVmLnNwbGl0KFwiK1wiKS5tYXAoKHA6IHN0cmluZykgPT4gcC50cmltKCkpO1xuICAgICAgY29uc3Qgc0hLZXkgPSBzSFBhcnRzW3NIUGFydHMubGVuZ3RoIC0gMV0udG9VcHBlckNhc2UoKTtcbiAgICAgIGNvbnN0IHNIQWx0ID0gc0hQYXJ0cy5zb21lKChwOiBzdHJpbmcpID0+IC9eYWx0JC9pLnRlc3QocCkpO1xuICAgICAgY29uc3Qgc0hDdHJsID0gc0hQYXJ0cy5zb21lKChwOiBzdHJpbmcpID0+IC9eY3RybCQvaS50ZXN0KHApKTtcbiAgICAgIGNvbnN0IHNIU2hpZnQgPSBzSFBhcnRzLnNvbWUoKHA6IHN0cmluZykgPT4gL15zaGlmdCQvaS50ZXN0KHApKTtcbiAgICAgIGNvbnN0IHNITWV0YSA9IHNIUGFydHMuc29tZSgocDogc3RyaW5nKSA9PiAvXm1ldGEkL2kudGVzdChwKSk7XG5cbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBlLmtleS50b1VwcGVyQ2FzZSgpID09PSBzSEtleSAmJlxuICAgICAgICAgIGUuYWx0S2V5ID09PSBzSEFsdCAmJlxuICAgICAgICAgIGUuY3RybEtleSA9PT0gc0hDdHJsICYmXG4gICAgICAgICAgZS5zaGlmdEtleSA9PT0gc0hTaGlmdCAmJlxuICAgICAgICAgIGUubWV0YUtleSA9PT0gc0hNZXRhXG4gICAgICAgICkge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgIGlmIChpc1JlY29yZGluZykge1xuICAgICAgICAgICAgc3RvcFJlY29yZGluZygpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHNlbmRNZXNzYWdlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLy8gI2VuZHJlZ2lvbiBIb3RrZXktU2VuZGluZy5cbiAgICAgIC8vICNlbmRyZWdpb24gSGFuZGxlIGhvdGtleXMuXG4gICAgICBjaGF0SW5wdXQucGxhY2Vob2xkZXIgPVxuICAgICAgICAodHlwZW9mIHRvTG9hZC52b2ljZXBsYWNlaG9sZGVyID09PSBcInN0cmluZ1wiICYmIHRvTG9hZC52b2ljZXBsYWNlaG9sZGVyLnRyaW0oKSkgfHxcbiAgICAgICAgYCR7aG90a2V5RGVmfSA9IFxcdUQ4M0NcXHVERjk5XFx1RkUwRiBvbi9vZmYgfCAke3NlbmRIb3RrZXlEZWZ9ID0gXFx1RDgzQ1xcdURGOTlcXHVGRTBGIG9mZiArIHNlbmRgO1xuICAgIH07XG4gICAgLy8gI3JlZ2lvbiBXaGlzcGVyIGhlYWx0aC1jaGVjayBhbmQgbWljIHNldHVwLlxuICAgIGlmICh3aGlzcGVyVXJsKSB7XG4gICAgICBjb25zdCB3VXJsID0gd2hpc3BlclVybDtcbiAgICAgICQuYWpheCh7XG4gICAgICAgIHVybDogd1VybCxcbiAgICAgICAgdHlwZTogXCJHRVRcIixcbiAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICBoZWFkZXJzOiB7IFwiWC1IZWFsdGgtQ2hlY2tcIjogXCJ0cnVlXCIgfSxcbiAgICAgICAgc3VjY2VzczogKHJlc3BvbnNlOiB1bmtub3duKSA9PiB7XG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0gKHR5cGVvZiByZXNwb25zZSA9PT0gXCJzdHJpbmdcIiA/IEpTT04ucGFyc2UocmVzcG9uc2UpIDogcmVzcG9uc2UpIGFzIHtcbiAgICAgICAgICAgIHN0YXR1cz86IHN0cmluZztcbiAgICAgICAgICAgIGNvbnZlcnRTdXBwb3J0ZWQ/OiBib29sZWFuO1xuICAgICAgICAgICAgZXJyb3I/OiBzdHJpbmc7XG4gICAgICAgICAgfTtcbiAgICAgICAgICBpZiAocmVzdWx0LmVycm9yIHx8IHJlc3VsdC5zdGF0dXMgIT09IFwicmVhZHlcIikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdC5jb252ZXJ0U3VwcG9ydGVkID09PSBcImJvb2xlYW5cIikge1xuICAgICAgICAgICAgd2hpc3BlckNvbnZlcnRTdXBwb3J0ZWQgPSByZXN1bHQuY29udmVydFN1cHBvcnRlZDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZXR1cFdoaXNwZXJNaWMod1VybCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVycm9yOiAoKSA9PiB7IH0sXG4gICAgICB9KTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBXaGlzcGVyIGhlYWx0aC1jaGVjayBhbmQgbWljIHNldHVwXG4gICAgLy8gI3JlZ2lvbiBTdGF0ZSB2YXJpYWJsZXMgYW5kIGNvbnZlcnNhdGlvbiBtYW5hZ2VtZW50XG4gICAgbGV0IGlzQnVzeSA9IGZhbHNlO1xuICAgIGxldCBhdHRhY2hlZEZpbGVzOiBGaWxlW10gPSBbXTtcbiAgICBsZXQgdGhpbmtpbmdCdWJibGU6IEhUTUxEaXZFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gICAgbGV0IGxhc3RVc2VyUXVlc3Rpb24gPSBcIlwiO1xuICAgIGxldCBhY3RpdmVTdHJlYW1JZDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgICBjb25zdCBwYWdlU2Vzc2lvbklkOiBzdHJpbmcgPSBnZW5lcmF0ZVVVSUQoKTtcbiAgICBjb25zdCBjb252ZXJzYXRpb25IaXN0b3J5OiB7IHJvbGU6IHN0cmluZzsgY29udGVudDogc3RyaW5nIH1bXSA9IFtdO1xuICAgIC8qKiBUcmFja3MgYXNzaXN0YW50IGVudHJpZXMgd2hvc2UgbWVhbiBsb2dwcm9iIGZlbGwgYmVsb3cge0BsaW5rIExPV19DT05GSURFTkNFX1RIUkVTSE9MRH0uICovXG4gICAgY29uc3QgbG93Q29uZmlkZW5jZUVudHJpZXMgPSBuZXcgU2V0PG9iamVjdD4oKTtcbiAgICAvKipcbiAgICAgKiBTdHJpcHMgbWFya2Rvd24gbGlua3MsIGJhcmUgVVJMcywgYW5kIHRydW5jYXRlcyBhc3Npc3RhbnQgdGV4dCBiZWZvcmUgc3RvcmluZyBpdCBpbiBjb252ZXJzYXRpb24gaGlzdG9yeS4gVGhpcyBwcmV2ZW50c1xuICAgICAqIHRoZSBzbWFsbCBtb2RlbHMgZnJvbSBwYXJyb3QtY29weWluZyBjb250ZW50IGZyb20gcHJldmlvdXMgdHVybnMgaW50byB1bnJlbGF0ZWQgYW5zd2Vycy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSBvcmlnaW5hbCBtZXNzYWdlIHRleHQgdG8gY2xlYW4gZm9yIGhpc3Rvcnkgc3RvcmFnZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFRoZSBjbGVhbmVkIHRleHQgd2l0aCBsaW5rcyByZW1vdmVkIGFuZCB0cnVuY2F0ZWQgaWYgbmVjZXNzYXJ5LiAqL1xuICAgIGNvbnN0IHN0cmlwTGlua3NGb3JIaXN0b3J5ID0gKHRleHQ6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgICBsZXQgY2xlYW5lZCA9IHRleHQucmVwbGFjZSgvXFxbKFteXFxdXSspXFxdXFwoW14pXStcXCkvZywgXCIkMVwiKTsgLy8gW2xhYmVsXSh1cmwpIFx1MjE5MiBsYWJlbFxuXG4gICAgICBjbGVhbmVkID0gY2xlYW5lZC5yZXBsYWNlKC9odHRwcz86XFwvXFwvW15cXHMpXSsvZywgXCJcIik7IC8vIEJhcmUgVVJMcy5cbiAgICAgIGNsZWFuZWQgPSBjbGVhbmVkLnJlcGxhY2UoLyB7Mix9L2csIFwiIFwiKS50cmltKCk7IC8vIENvbGxhcHNlIG11bHRpcGxlIHNwYWNlcyAvIHRyaW0uXG4gICAgICAvLyBUcnVuY2F0ZSB0byBwcmV2ZW50IHRoZSBtb2RlbCBmcm9tIHBhcnJvdGluZyBsb25nIHByZXZpb3VzIGFuc3dlcnNcbiAgICAgIGlmIChjbGVhbmVkLmxlbmd0aCA+IDE1MCkge1xuICAgICAgICBjbGVhbmVkID0gYCR7Y2xlYW5lZC5zdWJzdHJpbmcoMCwgMTQ3KX0uLi5gO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2xlYW5lZDtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIE1heGltdW0gbnVtYmVyIG9mIHJlY2VudCBoaXN0b3J5IGVudHJpZXMgdG8ga2VlcCB2ZXJiYXRpbSAodGhlIHJlc3QgYXJlIGNvbmRlbnNlZCBpbnRvIGEgc2luZ2xlIHN1bW1hcnkgZW50cnkgc28gdGhlXG4gICAgICogY29udGV4dCB3aW5kb3cgaXMgbm90IGV4aGF1c3RlZCkuIE11c3QgYmUgZXZlbiB0byBrZWVwIHVzZXIvYXNzaXN0YW50IHBhaXJzIGludGFjdC4gKi9cbiAgICBjb25zdCBNQVhfVkVSQkFUSU1fRU5UUklFUyA9IDY7XG4gICAgLy8gI2VuZHJlZ2lvbiBTdGF0ZSB2YXJpYWJsZXMgYW5kIGNvbnZlcnNhdGlvbiBtYW5hZ2VtZW50XG4gICAgLy8gI3JlZ2lvbiBDb21wYWN0IGNvbnZlcnNhdGlvbiBoaXN0b3J5XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIGEgY29tcGFjdGVkIGNvcHkgb2YgYGNvbnZlcnNhdGlvbkhpc3RvcnlgLlxuICAgICAqIC0gSWYgdGhlIGhpc3RvcnkgaGFzIGF0IG1vc3Qge0BsaW5rIE1BWF9WRVJCQVRJTV9FTlRSSUVTfSBlbnRyaWVzIGl0IGlzIHJldHVybmVkIGFzLWlzLlxuICAgICAqIC0gT3RoZXJ3aXNlIHRoZSBvbGRlc3QgdHVybnMgYXJlIGNvbmRlbnNlZCBpbnRvIGEgc2luZ2xlIFwic3lzdGVtXCIgZW50cnlcbiAgICAgKiAgIChlYWNoIHR1cm4gdHJ1bmNhdGVkIHRvIH4xMjAgY2hhcnMpIGFuZCB0aGUgbW9zdCByZWNlbnQgdHVybnMgYXJlIGtlcHQgdmVyYmF0aW0uICovXG4gICAgY29uc3QgY29tcGFjdEhpc3RvcnkgPSAoKTogeyByb2xlOiBzdHJpbmc7IGNvbnRlbnQ6IHN0cmluZyB9W10gPT4ge1xuICAgICAgY29uc3QgZWZmZWN0aXZlID0gY29udmVyc2F0aW9uSGlzdG9yeS5maWx0ZXIoKGUpID0+ICFsb3dDb25maWRlbmNlRW50cmllcy5oYXMoZSkpO1xuXG4gICAgICBpZiAoZWZmZWN0aXZlLmxlbmd0aCA8PSBNQVhfVkVSQkFUSU1fRU5UUklFUykge1xuICAgICAgICByZXR1cm4gZWZmZWN0aXZlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjdXRvZmYgPSBlZmZlY3RpdmUubGVuZ3RoIC0gTUFYX1ZFUkJBVElNX0VOVFJJRVM7XG4gICAgICBjb25zdCBvbGRUdXJucyA9IGVmZmVjdGl2ZS5zbGljZSgwLCBjdXRvZmYpO1xuICAgICAgY29uc3QgcmVjZW50VHVybnMgPSBlZmZlY3RpdmUuc2xpY2UoY3V0b2ZmKTtcbiAgICAgIC8vICNyZWdpb24gQnVpbGQgYSBjb25kZW5zZWQgc3VtbWFyeSBvZiB0aGUgb2xkZXIgdHVybnNcbiAgICAgIGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9sZFR1cm5zLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIGNvbnN0IHVzZXJNc2cgPSBvbGRUdXJuc1tpXT8uY29udGVudCA/PyBcIlwiO1xuICAgICAgICBjb25zdCBhc3N0TXNnID0gb2xkVHVybnNbaSArIDFdPy5jb250ZW50ID8/IFwiXCI7XG4gICAgICAgIGNvbnN0IHVTaG9ydCA9IHVzZXJNc2cubGVuZ3RoID4gMTIwID8gYCR7dXNlck1zZy5zdWJzdHJpbmcoMCwgMTE3KX0uLi5gIDogdXNlck1zZztcbiAgICAgICAgY29uc3QgYVNob3J0ID0gYXNzdE1zZy5sZW5ndGggPiAxMjAgPyBgJHthc3N0TXNnLnN1YnN0cmluZygwLCAxMTcpfS4uLmAgOiBhc3N0TXNnO1xuXG4gICAgICAgIGxpbmVzLnB1c2goYC0gVXNlcjogJHt1U2hvcnR9ICBBc3Npc3RhbnQ6ICR7YVNob3J0fWApO1xuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBCdWlsZCBhIGNvbmRlbnNlZCBzdW1tYXJ5IG9mIHRoZSBvbGRlciB0dXJuc1xuICAgICAgY29uc3Qgc3VtbWFyeUVudHJ5OiB7IHJvbGU6IHN0cmluZzsgY29udGVudDogc3RyaW5nIH0gPSB7XG4gICAgICAgIHJvbGU6IFwic3lzdGVtXCIsXG4gICAgICAgIGNvbnRlbnQ6IGBTdW1tYXJ5IG9mIGVhcmxpZXIgY29udmVyc2F0aW9uOlxcbiR7bGluZXMuam9pbihcIlxcblwiKX1gLFxuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFtzdW1tYXJ5RW50cnksIC4uLnJlY2VudFR1cm5zXTtcbiAgICB9O1xuICAgIC8vICNlbmRyZWdpb24gQ29tcGFjdCBjb252ZXJzYXRpb24gaGlzdG9yeVxuICAgIC8vICNyZWdpb24gUmVzb3VyY2Ugc3RhdHVzIG92ZXJsYXlcbiAgICBsZXQgb3ZlcmxheUhpZGVUaW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCBudWxsID0gbnVsbDtcbiAgICBsZXQgcmVzb3VyY2VPdmVybGF5OiBIVE1MRGl2RWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gICAgY29uc3QgZ2V0T3ZlcmxheSA9ICgpOiBIVE1MRGl2RWxlbWVudCA9PiB7XG4gICAgICBpZiAocmVzb3VyY2VPdmVybGF5KSB7XG4gICAgICAgIHJldHVybiByZXNvdXJjZU92ZXJsYXk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgZWwuc3R5bGUuY3NzVGV4dCA9IGBcbiAgICAgICAgcG9zaXRpb246IGFic29sdXRlIDsgdG9wOiA2cHggOyByaWdodDogNnB4IDsgZGlzcGxheTogbm9uZSA7IGFsaWduLWl0ZW1zOiBjZW50ZXIgOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlciA7XG4gICAgICAgIGJhY2tncm91bmQ6IHJnYmEoIDAsIDAsIDAsIDAuNzIgKTsgY29sb3I6ICNmZmYgO2ZvbnQtc2l6ZTogMTJweCA7IGZvbnQtd2VpZ2h0OiA2MDAgOyBwYWRkaW5nOiA2cHggMTRweCA7XG4gICAgICAgIHRleHQtYWxpZ246IGNlbnRlciA7IHBvaW50ZXItZXZlbnRzOiBub25lIDsgei1pbmRleDogMTAwMCA7IGJvcmRlci1yYWRpdXM6IDZweCA7IGJhY2tkcm9wLWZpbHRlcjogYmx1ciggMnB4ICk7XG4gICAgICAgIHRyYW5zaXRpb246IG9wYWNpdHkgMC4zcyBlYXNlIDsgbWF4LXdpZHRoOiA2MCUgOyB3aGl0ZS1zcGFjZTogbm93cmFwOyBvdmVyZmxvdzogaGlkZGVuIDsgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXMgO2A7XG4gICAgICAvLyBBbmNob3IgcmVsYXRpdmUgdG8gdGhlIGNoYXQgY29udGFpbmVyXG4gICAgICBjb25zdCBhbmNob3IgPSBjaGF0Q29udGFpbmVyLnBhcmVudEVsZW1lbnQ7XG5cbiAgICAgIGlmIChhbmNob3IpIHtcbiAgICAgICAgY29uc3QgY3MgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShhbmNob3IpO1xuXG4gICAgICAgIGlmIChjcy5wb3NpdGlvbiA9PT0gXCJzdGF0aWNcIikge1xuICAgICAgICAgIChhbmNob3IgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLnBvc2l0aW9uID0gXCJyZWxhdGl2ZVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgYW5jaG9yLmFwcGVuZENoaWxkKGVsKTtcbiAgICAgIH1cblxuICAgICAgcmVzb3VyY2VPdmVybGF5ID0gZWw7XG5cbiAgICAgIHJldHVybiBlbDtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFNob3dzIGEgbWVzc2FnZSBpbiB0aGUgcmVzb3VyY2Ugc3RhdHVzIG92ZXJsYXkuIElmIGFub3RoZXIgbWVzc2FnZSBpcyBhbHJlYWR5IHNob3dpbmcsIGl0IGlzIHJlcGxhY2VkIGFuZCB0aGUgaGlkZSB0aW1lclxuICAgICAqIGlzIHJlc2V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gZGlzcGxheSBpbiB0aGUgb3ZlcmxheS4gKi9cbiAgICBjb25zdCBzaG93UmVzb3VyY2VPdmVybGF5ID0gKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgICAgaWYgKG92ZXJsYXlIaWRlVGltZXIpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KG92ZXJsYXlIaWRlVGltZXIpO1xuXG4gICAgICAgIG92ZXJsYXlIaWRlVGltZXIgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBvdmVybGF5ID0gZ2V0T3ZlcmxheSgpO1xuXG4gICAgICBvdmVybGF5LnRleHRDb250ZW50ID0gbWVzc2FnZTtcbiAgICAgIG92ZXJsYXkuc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xuICAgICAgb3ZlcmxheS5zdHlsZS5vcGFjaXR5ID0gXCIxXCI7XG4gICAgfTtcbiAgICAvKiogSGlkZXMgdGhlIHJlc291cmNlIHN0YXR1cyBvdmVybGF5LiBJZiBhIGhpZGUgdGltZXIgaXMgYWN0aXZlLCBpdCBpcyBjbGVhcmVkLiAqL1xuICAgIGNvbnN0IGhpZGVSZXNvdXJjZU92ZXJsYXkgPSAoKTogdm9pZCA9PiB7XG4gICAgICBpZiAoIXJlc291cmNlT3ZlcmxheSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc291cmNlT3ZlcmxheS5zdHlsZS5vcGFjaXR5ID0gXCIwXCI7XG4gICAgICAvKipcbiAgICAgICAqIERlbGF5IGhpZGluZyB0aGUgb3ZlcmxheSB1bnRpbCBhZnRlciB0aGUgZmFkZS1vdXQgdHJhbnNpdGlvbiBjb21wbGV0ZXMsIHRvIGF2b2lkIGEgamFycmluZyBhYnJ1cHQgZGlzYXBwZWFyYW5jZS4gSWYgYW5vdGhlclxuICAgICAgICogbWVzc2FnZSBpcyBzaG93biBiZWZvcmUgdGhlIHRpbWVyIGZpcmVzLCB0aGUgaGlkZSBpcyBjYW5jZWxlZCBhbmQgdGhlIG5ldyBtZXNzYWdlIGlzIHNob3duIGltbWVkaWF0ZWx5LiAqL1xuICAgICAgb3ZlcmxheUhpZGVUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBpZiAocmVzb3VyY2VPdmVybGF5KSB7XG4gICAgICAgICAgcmVzb3VyY2VPdmVybGF5LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIG92ZXJsYXlIaWRlVGltZXIgPSBudWxsO1xuICAgICAgfSwgNDAwKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgYHJlc291cmNlU3RhdHVzYCBmcm9tIHRoZSBwb2xsIHJlc3BvbnNlLlxuICAgICAqIFwiUmVzdW1lZFwiIGFuZCB0aW1lb3V0IG1lc3NhZ2VzIGF1dG8taGlkZSBhZnRlciAyLjUgc2Vjb25kcztcbiAgICAgKiBwYXVzZSBtZXNzYWdlcyBzdGF5IHZpc2libGUgdW50aWwgc3VwZXJzZWRlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzdGF0dXMgVGhlIHJlc291cmNlIHN0YXR1cyBtZXNzYWdlIHRvIHNob3csIG9yIHVuZGVmaW5lZCB0byBpZ25vcmUuICovXG4gICAgY29uc3QgaGFuZGxlUmVzb3VyY2VTdGF0dXMgPSAoc3RhdHVzOiBzdHJpbmcgfCB1bmRlZmluZWQpOiB2b2lkID0+IHtcbiAgICAgIGlmICghc3RhdHVzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgc2hvd1Jlc291cmNlT3ZlcmxheShzdGF0dXMpO1xuXG4gICAgICBpZiAoc3RhdHVzLmluY2x1ZGVzKFwiXFx1MjVCNlwiKSB8fCBzdGF0dXMuaW5jbHVkZXMoXCJcXHUyNkEwXCIpKSB7XG4gICAgICAgIG92ZXJsYXlIaWRlVGltZXIgPSBzZXRUaW1lb3V0KGhpZGVSZXNvdXJjZU92ZXJsYXksIDI1MDApO1xuICAgICAgfVxuICAgIH07XG4gICAgLy8gI2VuZHJlZ2lvbiBSZXNvdXJjZSBzdGF0dXMgb3ZlcmxheVxuICAgIC8vICNyZWdpb24gVHVybiBVUkxzLCBNYWlsLUFkZHJlc3NlcyBhbmQgUGhvbmUtTnVtYmVycyBpbiBwbGFpbiB0ZXh0IGludG8gbGlua2VkIGJhZGdlcy5cbiAgICAvKipcbiAgICAgKiBIVE1MLWVzY2FwZXMgdGhlIGdpdmVuIHBsYWluIHRleHQsIHRoZW4gY29udmVydHM6XG4gICAgICogICAxLiBNYXJrZG93biBsaW5rcyBgW2xhYmVsXSh1cmwpYCBcdTIxOTIgY2xpY2thYmxlIGA8YT5gIHdpdGggdGhlIGxhYmVsIHRleHRcbiAgICAgKiAgIDIuIEJhcmUgVVJMcyAoYGh0dHBzOi8vXHUyMDI2YCAvIGBodHRwOi8vXHUyMDI2YCkgXHUyMTkyIGNsaWNrYWJsZSBgPGE+YCBzaG93aW5nIHRoZSBob3N0bmFtZVxuICAgICAqICAgMy4gUGhvbmUgbnVtYmVycyBcdTIxOTIgY2xpY2thYmxlIGB0ZWw6YCBsaW5rIGluIGEgYmFkZ2VcbiAgICAgKiAgIDQuIEVtYWlsIGFkZHJlc3NlcyBcdTIxOTIgY2xpY2thYmxlIGBtYWlsdG86YCBsaW5rIGluIGEgYmFkZ2VcbiAgICAgKlxuICAgICAqIFVzZXMgYSBwbGFjZWhvbGRlciBzdHJhdGVneSBzbyB0aGF0IFVSTHMgaW5zaWRlIGFscmVhZHktY3JlYXRlZCBgPGE+YCB0YWdzIGFyZSBuZXZlciBtYXRjaGVkIGFnYWluIGJ5IHRoZSBiYXJlLVVSTCBwYXNzLlxuICAgICAqIEFsbCBsaW5rcyBvcGVuIGluIGEgbmV3IHRhYiB3aXRoIGByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCJgLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgIFJhdyBwbGFpbiB0ZXh0IChtYXkgY29udGFpbiBVUkxzIG9yIE1hcmtkb3duIGxpbmtzKS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zICAgICBTYWZlIEhUTUwgc3RyaW5nIHdpdGggY2xpY2thYmxlIGxpbmtzLiAqL1xuICAgIGNvbnN0IGxpbmtpZnlVcmxzID0gKHRleHQ6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgICBjb25zdCBsaW5rczogc3RyaW5nW10gPSBbXTtcbiAgICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gKGlkeDogbnVtYmVyKTogc3RyaW5nID0+IGBcXHgwMExJTkske2lkeH1cXHgwMGA7XG4gICAgICAvLyAjcmVnaW9uIEV4dHJhY3QgY29kZSBibG9ja3MgYW5kIGVzY2FwZSBIVE1MLlxuICAgICAgLy8gI3JlZ2lvbiBFeHRyYWN0IGZlbmNlZCBjb2RlIGJsb2NrcyAoYGBgLi4uYGBgKSBiZWZvcmUgSFRNTC1Fc2NhcGluZy5cbiAgICAgIGNvbnN0IGNvZGVCbG9ja3M6IHN0cmluZ1tdID0gW107XG4gICAgICBjb25zdCBjb2RlUGxhY2Vob2xkZXIgPSAoaWR4OiBudW1iZXIpOiBzdHJpbmcgPT4gYFxceDAwQ09ERSR7aWR4fVxceDAwYDtcbiAgICAgIGNvbnN0IHdpdGhDb2RlRXh0cmFjdGVkID0gdGV4dC5yZXBsYWNlKC9gYGAoXFx3KilcXG4oW1xcc1xcU10qPylgYGAvZywgKF9tLCBsYW5nOiBzdHJpbmcsIGNvZGU6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBpZHggPSBjb2RlQmxvY2tzLmxlbmd0aDtcblxuICAgICAgICBjb2RlQmxvY2tzLnB1c2goXG4gICAgICAgICAgYDxkaXYgY2xhc3M9XCJMTEFNQV9DaGF0X0NvZGVCbG9ja1wiPjxkaXYgY2xhc3M9XCJMTEFNQV9DaGF0X0NvZGVIZWFkZXJcIj48c3BhbiBjbGFzcz1cIkxMQU1BX0NoYXRfQ29kZUxhbmdcIj4ke2xhbmcgfHwgXCJjb2RlXCJ9PC9zcGFuPjxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiTExBTUFfQ2hhdF9Db2RlQ29weUJ0blwiIHRpdGxlPVwiQ29weSBjb2RlXCI+PHN2ZyB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgd2lkdGg9XCIxNFwiIGhlaWdodD1cIjE0XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiPjxwYXRoIGQ9XCJNMTYgMUg0YTIgMiAwIDAgMC0yIDJ2MTRoMlYzaDEyVjF6bTMgNEg4YTIgMiAwIDAgMC0yIDJ2MTRhMiAyIDAgMCAwIDIgMmgxMWEyIDIgMCAwIDAgMi0yVjdhMiAyIDAgMCAwLTItMnptMCAxNkg4VjdoMTF2MTR6XCIvPjwvc3ZnPjwvYnV0dG9uPjwvZGl2PjxwcmUgY2xhc3M9XCJMTEFNQV9DaGF0X0NvZGVQcmVcIj48Y29kZT4ke2NvZGUucmVwbGFjZSgvJi9nLCBcIiZhbXA7XCIpLnJlcGxhY2UoLzwvZywgXCImbHQ7XCIpLnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpfTwvY29kZT48L3ByZT48L2Rpdj5gLFxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiBjb2RlUGxhY2Vob2xkZXIoaWR4KTtcbiAgICAgIH0pO1xuICAgICAgLy8gI2VuZHJlZ2lvbiBFeHRyYWN0IGZlbmNlZCBjb2RlIGJsb2NrcyAoYGBgLi4uYGBgKSBiZWZvcmUgSFRNTC1Fc2NhcGluZy5cbiAgICAgIC8vICNyZWdpb24gRXh0cmFjdCBpbmxpbmUgY29kZSAoYC4uLmApIGJlZm9yZSBIVE1MLUVzY2FwaW5nLlxuICAgICAgY29uc3Qgd2l0aElubGluZUNvZGVFeHRyYWN0ZWQgPSB3aXRoQ29kZUV4dHJhY3RlZC5yZXBsYWNlKC9gKFteYFxcbl0rKWAvZywgKF9tLCBjb2RlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgY29uc3QgaWR4ID0gY29kZUJsb2Nrcy5sZW5ndGg7XG5cbiAgICAgICAgY29kZUJsb2Nrcy5wdXNoKFxuICAgICAgICAgIGA8Y29kZSBjbGFzcz1cIkxMQU1BX0NoYXRfSW5saW5lQ29kZVwiPiR7Y29kZS5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIikucmVwbGFjZSgvPC9nLCBcIiZsdDtcIikucmVwbGFjZSgvPi9nLCBcIiZndDtcIil9PC9jb2RlPmAsXG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIGNvZGVQbGFjZWhvbGRlcihpZHgpO1xuICAgICAgfSk7XG4gICAgICAvLyAjZW5kcmVnaW9uIEV4dHJhY3QgaW5saW5lIGNvZGUgKGAuLi5gKSBiZWZvcmUgSFRNTC1Fc2NhcGluZy5cbiAgICAgIC8vICNyZWdpb24gSFRNTC1Fc2NhcGUgdG8gcHJldmVudCBYU1MuXG4gICAgICBjb25zdCBlc2NhcGVkID0gd2l0aElubGluZUNvZGVFeHRyYWN0ZWRcbiAgICAgICAgLnJlcGxhY2UoLyYvZywgXCImYW1wO1wiKVxuICAgICAgICAucmVwbGFjZSgvPC9nLCBcIiZsdDtcIilcbiAgICAgICAgLnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpXG4gICAgICAgIC5yZXBsYWNlKC9cIi9nLCBcIiZxdW90O1wiKTtcbiAgICAgIC8vICNlbmRyZWdpb24gSFRNTC1Fc2NhcGUgdG8gcHJldmVudCBYU1MuXG4gICAgICAvLyAjZW5kcmVnaW9uIEV4dHJhY3QgY29kZSBibG9ja3MgYW5kIGVzY2FwZSBIVE1MLlxuICAgICAgLy8gI3JlZ2lvbiBDb252ZXJ0IGxpbmtzIHRvIHBsYWNlaG9sZGVycy5cbiAgICAgIGNvbnN0IHdpdGhNZFBsYWNlaG9sZGVycyA9IGVzY2FwZWQucmVwbGFjZShcbiAgICAgICAgL1xcWyhbXlxcXV0rKVxcXVxcKChodHRwcz86XFwvXFwvW15cXHMpXSspXFwpL2dpLFxuICAgICAgICAoX21hdGNoLCBsYWJlbDogc3RyaW5nLCB1cmw6IHN0cmluZykgPT4ge1xuICAgICAgICAgIGNvbnN0IGlkeCA9IGxpbmtzLmxlbmd0aDtcblxuICAgICAgICAgIGxpbmtzLnB1c2goYDxhIGhyZWY9XCIke3VybH1cIiB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+JHtsYWJlbH08L2E+YCk7XG5cbiAgICAgICAgICByZXR1cm4gcGxhY2Vob2xkZXIoaWR4KTtcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vQ29udHJvbENoYXJhY3RlcnNJblJlZ2V4OiA8ZXhwbGFuYXRpb24+XG4gICAgICBjb25zdCB3aXRoQWxsUGxhY2Vob2xkZXJzID0gd2l0aE1kUGxhY2Vob2xkZXJzLnJlcGxhY2UoL2h0dHBzPzpcXC9cXC9bXlxcczw+JlwiJ1xceDAwKVxcXV0rL2dpLCAodXJsKSA9PiB7XG4gICAgICAgIGxldCBsYWJlbCA9IHVybDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHUgPSBuZXcgVVJMKHVybCk7XG5cbiAgICAgICAgICBsYWJlbCA9IHUuaG9zdG5hbWUucmVwbGFjZSgvXnd3d1xcLi8sIFwiXCIpO1xuICAgICAgICB9IGNhdGNoIHsgfVxuXG4gICAgICAgIGNvbnN0IGlkeCA9IGxpbmtzLmxlbmd0aDtcblxuICAgICAgICBsaW5rcy5wdXNoKGA8YSBocmVmPVwiJHt1cmx9XCIgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPiR7bGFiZWx9PC9hPmApO1xuXG4gICAgICAgIHJldHVybiBwbGFjZWhvbGRlcihpZHgpO1xuICAgICAgfSk7XG4gICAgICAvLyAjZW5kcmVnaW9uIENvbnZlcnQgbGlua3MgdG8gcGxhY2Vob2xkZXJzLlxuICAgICAgLy8gI3JlZ2lvbiBDb252ZXJ0IFBob25lLU51bWJlcnMgYW5kIGVNYWlsLUFkZHJlc3Nlcy5cbiAgICAgIGNvbnN0IHdpdGhQaG9uZVBsYWNlaG9sZGVycyA9IHdpdGhBbGxQbGFjZWhvbGRlcnMucmVwbGFjZShcbiAgICAgICAgLyg/OlxcK1xcZHsxLDN9W1xccy4tXT8pPyg/OlxcKD9cXGR7Miw1fVxcKT9bXFxzLlxcLy1dPyl7MSwzfVxcZHsxLDh9L2csXG4gICAgICAgIChtYXRjaCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGRpZ2l0c09ubHkgPSBtYXRjaC5yZXBsYWNlKC9cXEQvZywgXCJcIik7XG4gICAgICAgICAgaWYgKGRpZ2l0c09ubHkubGVuZ3RoIDwgNyB8fCBkaWdpdHNPbmx5Lmxlbmd0aCA+IDE1KSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKC9eXFxkezR9XFxzKlstXHUyMDEzXHUyMDE0XVxccypcXGR7NH0kLy50ZXN0KG1hdGNoLnRyaW0oKSkpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoL15cXGR7NH1bLS8uXVxcZHsyfVstLy5dXFxkezJ9KFstLy5UXFxzXVxcZHsyLDZ9KFstLzpdXFxkezJ9KXswLDJ9KT8kLy50ZXN0KG1hdGNoLnRyaW0oKSkpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoL15cXGR7MSwyfVstLy5dXFxkezEsMn1bLS8uXVxcZHsyLDR9JC8udGVzdChtYXRjaC50cmltKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKC9eXFxkK1xcLlxcZCskLy50ZXN0KG1hdGNoLnRyaW0oKSkpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBpZHggPSBsaW5rcy5sZW5ndGg7XG4gICAgICAgICAgY29uc3QgdGVsSHJlZiA9IGB0ZWw6JHttYXRjaC5yZXBsYWNlKC9bXlxcZCtdL2csIFwiXCIpfWA7XG5cbiAgICAgICAgICBsaW5rcy5wdXNoKFxuICAgICAgICAgICAgYDxzcGFuIGNsYXNzPVwiTExBTUFfQ2hhdF9QaG9uZUJhZGdlXCI+PHNwYW4gY2xhc3M9XCJMTEFNQV9DaGF0X0JhZGdlSWNvblwiPlx1RDgzRFx1RENERTwvc3Bhbj48YSBocmVmPVwiJHt0ZWxIcmVmfVwiPiR7bWF0Y2h9PC9hPjwvc3Bhbj5gLFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICByZXR1cm4gcGxhY2Vob2xkZXIoaWR4KTtcbiAgICAgICAgfSxcbiAgICAgICk7XG5cbiAgICAgIC8vICNyZWdpb24gQ29udmVydCBlTWFpbC5BZGRyZXNzZXMuXG4gICAgICBjb25zdCB3aXRoRW1haWxQbGFjZWhvbGRlcnMgPSB3aXRoUGhvbmVQbGFjZWhvbGRlcnMucmVwbGFjZShcbiAgICAgICAgL1thLXpBLVowLTkuXyUrXFwtXStAW2EtekEtWjAtOS5cXC1dK1xcLlthLXpBLVpdezIsfS9nLFxuICAgICAgICAobWF0Y2gpID0+IHtcbiAgICAgICAgICBjb25zdCBpZHggPSBsaW5rcy5sZW5ndGg7XG4gICAgICAgICAgbGlua3MucHVzaChcbiAgICAgICAgICAgIGA8c3BhbiBjbGFzcz1cIkxMQU1BX0NoYXRfRW1haWxCYWRnZVwiPjxzcGFuIGNsYXNzPVwiTExBTUFfQ2hhdF9CYWRnZUljb25cIj5cdTI3MDk8L3NwYW4+PGEgaHJlZj1cIm1haWx0bzoke21hdGNofVwiPiR7bWF0Y2h9PC9hPjwvc3Bhbj5gLFxuICAgICAgICAgICk7XG4gICAgICAgICAgcmV0dXJuIHBsYWNlaG9sZGVyKGlkeCk7XG4gICAgICAgIH0sXG4gICAgICApO1xuICAgICAgLy8gI2VuZHJlZ2lvbiBDb252ZXJ0IGVNYWlsLkFkZHJlc3Nlcy5cbiAgICAgIC8vICNyZWdpb24gQ29udmVydCBQaG9uZS1OdW1iZXJzIGFuZCBlTWFpbC1BZGRyZXNzZXMuXG4gICAgICAvLyAjcmVnaW9uIFJlc3RvcmUgcGxhY2Vob2xkZXJzLlxuICAgICAgLy8gNi4gUmVzdG9yZSBwbGFjZWhvbGRlcnMgd2l0aCBhY3R1YWwgPGE+IHRhZ3MsIHdyYXBwaW5nIFVSTCBiYWRnZXNcbiAgICAgIGNvbnN0IHJlc3RvcmVkID0gd2l0aEVtYWlsUGxhY2Vob2xkZXJzLnJlcGxhY2UoXG4gICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9Db250cm9sQ2hhcmFjdGVyc0luUmVnZXg6IHBsYWNlaG9sZGVyIHBhdHRlcm4gdXNlcyBcXHgwMFxuICAgICAgICAvXFx4MDBMSU5LKFxcZCspXFx4MDAvZyxcbiAgICAgICAgKF9tLCBpZHg6IHN0cmluZykgPT4ge1xuICAgICAgICAgIGNvbnN0IGh0bWwgPSBsaW5rc1tOdW1iZXIoaWR4KV07XG4gICAgICAgICAgaWYgKGh0bWwuc3RhcnRzV2l0aCgnPHNwYW4gY2xhc3M9XCJMTEFNQV9DaGF0X1Bob25lJykgfHwgaHRtbC5zdGFydHNXaXRoKCc8c3BhbiBjbGFzcz1cIkxMQU1BX0NoYXRfRW1haWwnKSkge1xuICAgICAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGA8c3BhbiBjbGFzcz1cIkxMQU1BX0NoYXRfU291cmNlQmFkZ2VcIj4ke2h0bWx9PC9zcGFuPmA7XG4gICAgICAgIH0sXG4gICAgICApO1xuICAgICAgLy8gI2VuZHJlZ2lvbiBSZXN0b3JlIHBsYWNlaG9sZGVycy5cbiAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9Db250cm9sQ2hhcmFjdGVyc0luUmVnZXg6IHBsYWNlaG9sZGVyIHBhdHRlcm4gdXNlcyBcXHgwMFxuICAgICAgY29uc3Qgd2l0aENvZGUgPSByZXN0b3JlZC5yZXBsYWNlKC9cXHgwMENPREUoXFxkKylcXHgwMC9nLCAoX20sIGlkeDogc3RyaW5nKSA9PiBjb2RlQmxvY2tzW051bWJlcihpZHgpXSk7XG5cbiAgICAgIHJldHVybiB3aXRoQ29kZTtcbiAgICB9O1xuICAgIC8vICNyZWdpb24gVHVybiBVUkxzLCBNYWlsLUFkZHJlc3NlcyBhbmQgUGhvbmUtTnVtYmVycyBpbiBwbGFpbiB0ZXh0IGludG8gbGlua2VkIGJhZGdlcy5cbiAgICAvLyAjcmVnaW9uIENyZWF0ZSBDaGF0LUJ1YmJsZSBFbGVtZW50c1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBzcGVlY2gtYnViYmxlIGVsZW1lbnQgYW5kIGFwcGVuZHMgaXQgdG8gdGhlIGNoYXQgY29udGFpbmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgICAgTWVzc2FnZSB0ZXh0LlxuICAgICAqIEBwYXJhbSByb2xlICAgIGBcInVzZXJcImAgKHJpZ2h0LWFsaWduZWQpLCBgXCJsbGFtYVwiYCAobGVmdC1hbGlnbmVkKSwgb3IgYFwic3lzdGVtXCJgIChjZW50ZXJlZCwgbXV0ZWQpLlxuICAgICAqXG4gICAgICogQHJldHVybnMgVGhlIGNyZWF0ZWQgYnViYmxlIGA8ZGl2PmAgc28gY2FsbGVycyBjYW4gdXBkYXRlIGl0IGxhdGVyIChlLmcuIHN0cmVhbWluZykuICovXG4gICAgY29uc3QgYXBwZW5kQnViYmxlID0gKHRleHQ6IHN0cmluZywgcm9sZTogXCJ1c2VyXCIgfCBcImxsYW1hXCIgfCBcInN5c3RlbVwiKTogSFRNTERpdkVsZW1lbnQgPT4ge1xuICAgICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgcm93LmNsYXNzTmFtZSA9IGBMTEFNQV9DaGF0X1JvdyBMTEFNQV9DaGF0X1Jvdy0tJHtyb2xlfWA7XG5cbiAgICAgIGNvbnN0IGJ1YmJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICAgIGJ1YmJsZS5jbGFzc05hbWUgPSBgTExBTUFfQ2hhdF9CdWJibGUgTExBTUFfQ2hhdF9CdWJibGUtLSR7cm9sZX1gO1xuICAgICAgYnViYmxlLmlubmVySFRNTCA9IGxpbmtpZnlVcmxzKHRleHQpO1xuXG4gICAgICByb3cuYXBwZW5kQ2hpbGQoYnViYmxlKTtcblxuICAgICAgaWYgKHJvbGUgPT09IFwidXNlclwiKSB7XG4gICAgICAgIGxhc3RVc2VyUXVlc3Rpb24gPSB0ZXh0O1xuXG4gICAgICAgIGNvbnN0IHF1ZXN0aW9uID0gdGV4dDtcbiAgICAgICAgY29uc3QgdG9vbGJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICAgICAgdG9vbGJhci5jbGFzc05hbWUgPSBcIkxMQU1BX0NoYXRfQnViYmxlVG9vbGJhclwiO1xuXG4gICAgICAgIGNvbnN0IGNvcHlCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuXG4gICAgICAgIGNvcHlCdG4udHlwZSA9IFwiYnV0dG9uXCI7XG4gICAgICAgIGNvcHlCdG4uY2xhc3NOYW1lID0gXCJMTEFNQV9DaGF0X1Rvb2xiYXJCdG5cIjtcbiAgICAgICAgY29weUJ0bi50aXRsZSA9IFwiQ29weSBxdWVzdGlvblwiO1xuICAgICAgICBjb3B5QnRuLmlubmVySFRNTCA9IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiB3aWR0aD1cIjE0XCIgaGVpZ2h0PVwiMTRcIiBmaWxsPVwiY3VycmVudENvbG9yXCI+PHBhdGggZD1cIk0xNiAxSDRhMiAyIDAgMCAwLTIgMnYxNGgyVjNoMTJWMXptMyA0SDhhMiAyIDAgMCAwLTIgMnYxNGEyIDIgMCAwIDAgMiAyaDExYTIgMiAwIDAgMCAyLTJWN2EyIDIgMCAwIDAtMi0yem0wIDE2SDhWN2gxMXYxNHpcIi8+PC9zdmc+YDtcblxuICAgICAgICBjb3B5QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQocXVlc3Rpb24pO1xuICAgICAgICAgIGJ1YmJsZS5jbGFzc0xpc3QucmVtb3ZlKFwiTExBTUFfZmxhc2hcIik7XG4gICAgICAgICAgdm9pZCBidWJibGUub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgYnViYmxlLmNsYXNzTGlzdC5hZGQoXCJMTEFNQV9mbGFzaFwiKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdG9vbGJhci5hcHBlbmRDaGlsZChjb3B5QnRuKTtcblxuICAgICAgICBjb25zdCByZXVzZUJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG5cbiAgICAgICAgcmV1c2VCdG4udHlwZSA9IFwiYnV0dG9uXCI7XG4gICAgICAgIHJldXNlQnRuLmNsYXNzTmFtZSA9IFwiTExBTUFfQ2hhdF9Ub29sYmFyQnRuIExMQU1BX0NoYXRfVG9vbGJhckJ0bi0tcmV1c2VcIjtcbiAgICAgICAgcmV1c2VCdG4udGl0bGUgPSBcIlJldXNlIHRoaXMgcXVlc3Rpb25cIjtcbiAgICAgICAgcmV1c2VCdG4uaW5uZXJIVE1MID0gYDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiIHdpZHRoPVwiMTRcIiBoZWlnaHQ9XCIxNFwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIj48cGF0aCBkPVwiTTE5IDEzaC02djZoLTJ2LTZINXYtMmg2VjVoMnY2aDZ2MnpcIi8+PC9zdmc+YDtcblxuICAgICAgICByZXVzZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIGNoYXRJbnB1dC52YWx1ZSA9IHF1ZXN0aW9uO1xuICAgICAgICAgIGNoYXRJbnB1dC5mb2N1cygpO1xuICAgICAgICAgIGNoYXRJbnB1dC5jbGFzc0xpc3QucmVtb3ZlKFwiTExBTUFfaW5wdXRfZmxhcmVcIik7XG4gICAgICAgICAgdm9pZCBjaGF0SW5wdXQub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgY2hhdElucHV0LmNsYXNzTGlzdC5hZGQoXCJMTEFNQV9pbnB1dF9mbGFyZVwiKTtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGNoYXRJbnB1dC5jbGFzc0xpc3QucmVtb3ZlKFwiTExBTUFfaW5wdXRfZmxhcmVcIiksIDIwMDApO1xuICAgICAgICB9KTtcblxuICAgICAgICB0b29sYmFyLmFwcGVuZENoaWxkKHJldXNlQnRuKTtcbiAgICAgICAgYnViYmxlLmFwcGVuZENoaWxkKHRvb2xiYXIpO1xuICAgICAgfVxuXG4gICAgICBjaGF0Q29udGFpbmVyLmFwcGVuZENoaWxkKHJvdyk7XG5cbiAgICAgIGNoYXRDb250YWluZXIuc2Nyb2xsVG9wID0gY2hhdENvbnRhaW5lci5zY3JvbGxIZWlnaHQ7XG5cbiAgICAgIHJldHVybiBidWJibGU7XG4gICAgfTtcbiAgICAvLyAjZW5kcmVnaW9uIENyZWF0ZSBDaGF0LUJ1YmJsZSBFbGVtZW50c1xuICAgIC8vICNyZWdpb24gQXBwZW5kIG1lc3NhZ2UgYmxvY2sgdG8gY2hhdCBkaXNwbGF5LlxuICAgIGNvbnN0IGFwcGVuZFRvQ2hhdCA9ICh0ZXh0OiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICAgIGlmICh0ZXh0LnN0YXJ0c1dpdGgoXCJZb3U6IFwiKSkge1xuICAgICAgICBhcHBlbmRCdWJibGUodGV4dC5zdWJzdHJpbmcoNSksIFwidXNlclwiKTtcbiAgICAgIH0gZWxzZSBpZiAodGV4dC5zdGFydHNXaXRoKFwiUXdlbjM6IFwiKSkge1xuICAgICAgICBhcHBlbmRCdWJibGUodGV4dC5zdWJzdHJpbmcoNyksIFwibGxhbWFcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcHBlbmRCdWJibGUodGV4dCwgXCJzeXN0ZW1cIik7XG4gICAgICB9XG4gICAgfTtcbiAgICAvLyAjZW5kcmVnaW9uIEFwcGVuZCBtZXNzYWdlIGJsb2NrIHRvIGNoYXQgZGlzcGxheS5cbiAgICAvLyAjcmVnaW9uIFJlcGxhY2UgdGhpbmtpbmcgaW5kaWNhdG9yIHdpdGggcmVhbCByZXNwb25zZS5cbiAgICBjb25zdCByZXBsYWNlVGhpbmtpbmcgPSAodGV4dDogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgICBpZiAodGhpbmtpbmdCdWJibGUpIHtcbiAgICAgICAgdGhpbmtpbmdCdWJibGUucGFyZW50RWxlbWVudD8ucmVtb3ZlKCk7XG5cbiAgICAgICAgdGhpbmtpbmdCdWJibGUgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBhcHBlbmRUb0NoYXQodGV4dCk7XG4gICAgfTtcbiAgICAvLyAjZW5kcmVnaW9uIFJlcGxhY2UgdGhpbmtpbmcgaW5kaWNhdG9yIHdpdGggcmVhbCByZXNwb25zZS5cbiAgICAvLyAjcmVnaW9uIFNlbGVjdGVkIGZpbGVzIGNoYW5nZWQgaGFuZGxlci5cbiAgICBpZiAoZmlsZVVwbG9hZCkge1xuICAgICAgZmlsZVVwbG9hZC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZXMgPSBmaWxlVXBsb2FkLmZpbGVzO1xuXG4gICAgICAgIGlmIChmaWxlcyAmJiBmaWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgYXR0YWNoZWRGaWxlcyA9IEFycmF5LmZyb20oZmlsZXMpO1xuICAgICAgICAgIGNvbnZlcnNhdGlvbkhpc3RvcnkubGVuZ3RoID0gMDtcblxuICAgICAgICAgIGNvbnN0IG5hbWVzID0gYXR0YWNoZWRGaWxlcy5tYXAoKGYpID0+IGYubmFtZSkuam9pbihcIiwgXCIpO1xuXG4gICAgICAgICAgYXBwZW5kVG9DaGF0KGBcXHV7MUY0Q0V9ICR7YXR0YWNoZWRGaWxlcy5sZW5ndGh9IGZpbGUocykgYXR0YWNoZWQ6ICR7bmFtZXN9YCk7XG5cbiAgICAgICAgICB3aW5kb3cuY29kYmkubG9nKFwiSU5GT1wiLCBgQ2hhdCBmaWxlcyBhdHRhY2hlZDogJHtuYW1lc31gLCBcIkFJIC8gTExBTUEgLyBDSEFUXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGF0dGFjaGVkRmlsZXMgPSBbXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gU2VsZWN0ZWQgZmlsZXMgY2hhbmdlZCBoYW5kbGVyLlxuICAgIC8vICNyZWdpb24gQ29kZSBibG9jayAvIENvcHkgYnV0dG9uXG4gICAgY2hhdENvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGU6IEV2ZW50KSA9PiB7XG4gICAgICBjb25zdCBidG4gPSAoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmNsb3Nlc3QoXCIuTExBTUFfQ2hhdF9Db2RlQ29weUJ0blwiKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG5cbiAgICAgIGlmICghYnRuKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY29kZUVsID0gYnRuLmNsb3Nlc3QoXCIuTExBTUFfQ2hhdF9Db2RlQmxvY2tcIik/LnF1ZXJ5U2VsZWN0b3IoXCJjb2RlXCIpO1xuXG4gICAgICBpZiAoY29kZUVsKSB7XG4gICAgICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGNvZGVFbC50ZXh0Q29udGVudCB8fCBcIlwiKTtcblxuICAgICAgICBjb25zdCBibG9jayA9IGJ0bi5jbG9zZXN0KFwiLkxMQU1BX0NoYXRfQ29kZUJsb2NrXCIpIGFzIEhUTUxFbGVtZW50O1xuXG4gICAgICAgIGlmIChibG9jaykge1xuICAgICAgICAgIGJsb2NrLmNsYXNzTGlzdC5yZW1vdmUoXCJMTEFNQV9mbGFzaFwiKTtcblxuICAgICAgICAgIHZvaWQgYmxvY2sub2Zmc2V0V2lkdGg7XG5cbiAgICAgICAgICBibG9jay5jbGFzc0xpc3QuYWRkKFwiTExBTUFfZmxhc2hcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyAjZW5kcmVnaW9uIENvZGUgYmxvY2sgLyBDb3B5IGJ1dHRvblxuICAgIC8vICNyZWdpb24gRUggLyBTZW5kIG1lc3NhZ2UuXG4gICAgY29uc3Qgc2VuZE1lc3NhZ2UgPSBhc3luYyAoKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gY2hhdElucHV0LnZhbHVlLnRyaW0oKTtcblxuICAgICAgaWYgKCFtZXNzYWdlIHx8IGlzQnVzeSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1vZGVsTGFiZWwgPSB0aGlua2luZ0NoZWNrYm94ID8gKHRoaW5raW5nQ2hlY2tib3guY2hlY2tlZCA/IFwiXFx1RDgzRFxcdURDQTEgVGhpbmtpbmdcIiA6IFwiXFx1MjZBMSBGYXN0XCIpIDogXCJBSVwiO1xuXG4gICAgICBhcHBlbmRCdWJibGUobWVzc2FnZSwgXCJ1c2VyXCIpO1xuXG4gICAgICBjaGF0SW5wdXQudmFsdWUgPSBcIlwiO1xuICAgICAgY29udmVyc2F0aW9uSGlzdG9yeS5wdXNoKHsgcm9sZTogXCJ1c2VyXCIsIGNvbnRlbnQ6IG1lc3NhZ2UgfSk7XG5cbiAgICAgIGlzQnVzeSA9IHRydWU7XG4gICAgICBzZW5kQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcblxuICAgICAgaWYgKG1pY0J1dHRvbikge1xuICAgICAgICBpZiAoaXNSZWNvcmRpbmcgJiYgc3RvcFJlY29yZGluZ0ZuKSB7XG4gICAgICAgICAgc3RvcFJlY29yZGluZ0ZuKCk7XG4gICAgICAgIH1cblxuICAgICAgICBtaWNCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoXCJkaXNhYmxlZFwiIGluIGNoYXRJbnB1dCkge1xuICAgICAgICBjaGF0SW5wdXQuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyAjcmVnaW9uIFNob3cgdGhpbmtpbmcgaW5kaWNhdG9yIGJ1YmJsZS5cbiAgICAgIHRoaW5raW5nQnViYmxlID0gYXBwZW5kQnViYmxlKFwiXCIsIFwibGxhbWFcIik7XG4gICAgICB0aGlua2luZ0J1YmJsZS5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cIkNvZEJpTG9hZGVyX1NwaW5uZXIgTExBTUFfVGhpbmtpbmdTcGlubmVyXCI+PC9kaXY+PHNwYW4gY2xhc3M9XCJMTEFNQV9UaGlua2luZ0xhYmVsXCI+VGhpbmtpbmcuLi48L3NwYW4+YDtcblxuICAgICAgdGhpbmtpbmdCdWJibGUuY2xhc3NMaXN0LmFkZChcIkxMQU1BX0NoYXRfQnViYmxlLS10aGlua2luZ1wiKTtcbiAgICAgIC8vICNlbmRyZWdpb24gU2hvdyB0aGlua2luZyBpbmRpY2F0b3IgYnViYmxlLlxuICAgICAgdHJ5IHtcbiAgICAgICAgQUlfTExBTUFfQ0hBVC5lbnN1cmVQZGZKc1dvcmtlckNvbmZpZ3VyZWQoKTtcblxuICAgICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICBjb25zdCBtYXhQYWdlcyA9IHRvTG9hZC5tYXhwYWdlcyA/IE51bWJlcih0b0xvYWQubWF4cGFnZXMpIDogNTtcbiAgICAgICAgY29uc3QgbWF4UGl4ZWxTaXplID1cbiAgICAgICAgICB0b0xvYWQubWF4cGl4ZWxzaXplICE9IG51bGwgPyBOdW1iZXIodG9Mb2FkLm1heHBpeGVsc2l6ZSkgOiBBSV9MTEFNQV9DSEFULkRFRkFVTFRfTUFYX1BJWEVMUztcbiAgICAgICAgLy8gI3JlZ2lvbiBQcm9jZXNzIGF0dGFjaGVkIGZpbGVzIChQREYgLyBJbWFnZSlcbiAgICAgICAgZm9yIChjb25zdCBmaWxlIG9mIGF0dGFjaGVkRmlsZXMpIHtcbiAgICAgICAgICBpZiAoZmlsZS50eXBlID09PSBcImFwcGxpY2F0aW9uL3BkZlwiKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9jZXNzZWRJbWFnZXMgPSBhd2FpdCBBSV9MTEFNQV9DSEFULnByb2Nlc3NQZGZGaWxlKGZpbGUsIG1heFBhZ2VzKTtcblxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9jZXNzZWRJbWFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgY29uc3QgaW1hZ2VOYW1lID0gYCR7ZmlsZS5uYW1lLnJlcGxhY2UoXCIucGRmXCIsIFwiXCIpfV9wYWdlXyR7aSArIDF9LnBuZ2A7XG4gICAgICAgICAgICAgIGxldCBpbWFnZUZpbGUgPSBuZXcgRmlsZShbcHJvY2Vzc2VkSW1hZ2VzW2ldXSwgaW1hZ2VOYW1lLCB7IHR5cGU6IFwiaW1hZ2UvcG5nXCIgfSk7XG4gICAgICAgICAgICAgIC8vICNyZWdpb24gRG93bnNjYWxlIFBERiBwYWdlIGlmIGl0IGV4Y2VlZHMgdGhlIHBpeGVsIGJ1ZGdldC5cbiAgICAgICAgICAgICAgaWYgKG1heFBpeGVsU2l6ZSA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkb3duc2NhbGVkID0gYXdhaXQgQUlfTExBTUFfQ0hBVC5kb3duc2NhbGVJbWFnZUlmTmVlZGVkKGltYWdlRmlsZSwgbWF4UGl4ZWxTaXplKTtcblxuICAgICAgICAgICAgICAgIGltYWdlRmlsZSA9XG4gICAgICAgICAgICAgICAgICBkb3duc2NhbGVkIGluc3RhbmNlb2YgRmlsZVxuICAgICAgICAgICAgICAgICAgICA/IGRvd25zY2FsZWRcbiAgICAgICAgICAgICAgICAgICAgOiBuZXcgRmlsZShbZG93bnNjYWxlZF0sIGltYWdlTmFtZSwgeyB0eXBlOiBkb3duc2NhbGVkLnR5cGUgfHwgXCJpbWFnZS9wbmdcIiB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIERvd25zY2FsZSBQREYgcGFnZSBpZiBpdCBleGNlZWRzIHRoZSBwaXhlbCBidWRnZXQuXG4gICAgICAgICAgICAgIGNvbnN0IGRhdGFVcmwgPSBhd2FpdCBBSV9MTEFNQV9DSEFULmJsb2JUb0RhdGFVcmwoaW1hZ2VGaWxlKTsgLy8gU2VuZCBhcyBiYXNlNjQgdGV4dCBwYXJhbSBcdTIwMTQgZm9ybWN5Y2xlJ3MgbXVsdGlwYXJ0IHBhcnNlciByZXR1cm5zIDAtYnl0ZSBGaWxlRGF0YS5cblxuICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoYGNvZGJpLWJhc2U2NDoke2ltYWdlTmFtZX1gLCBkYXRhVXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKG1heFBpeGVsU2l6ZSA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGRvd25zY2FsZWQgPSBhd2FpdCBBSV9MTEFNQV9DSEFULmRvd25zY2FsZUltYWdlSWZOZWVkZWQoZmlsZSwgbWF4UGl4ZWxTaXplKTsgLy8gRG93bnNjYWxlIGlmIHRoZSBpbWFnZSBleGNlZWRzIHRoZSBwaXhlbCBidWRnZXQuXG4gICAgICAgICAgICBjb25zdCBkYXRhVXJsID0gYXdhaXQgQUlfTExBTUFfQ0hBVC5ibG9iVG9EYXRhVXJsKGRvd25zY2FsZWQpO1xuXG4gICAgICAgICAgICB3aW5kb3cuY29kYmkubG9nKFxuICAgICAgICAgICAgICBcIklORk9cIixcbiAgICAgICAgICAgICAgYEFwcGVuZGluZyAnJHtmaWxlLm5hbWV9JyBhcyBiYXNlNjQgcGFyYW06ICR7ZGF0YVVybC5sZW5ndGggPCAxMDI0ID8gYCR7ZGF0YVVybC5sZW5ndGh9IEJgIDogZGF0YVVybC5sZW5ndGggPCAxMDQ4NTc2ID8gYCR7TWF0aC5yb3VuZChkYXRhVXJsLmxlbmd0aCAvIDEwMjQpfSBLQmAgOiBgJHsoZGF0YVVybC5sZW5ndGggLyAxMDQ4NTc2KS50b0ZpeGVkKDEpfSBNQmB9YCxcbiAgICAgICAgICAgICAgXCJBSSAvIExMQU1BIC8gQ0hBVFwiLFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKGBjb2RiaS1iYXNlNjQ6JHtmaWxlLm5hbWV9YCwgZGF0YVVybCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGFVcmwgPSBhd2FpdCBBSV9MTEFNQV9DSEFULmJsb2JUb0RhdGFVcmwoZmlsZSk7IC8vIEJhY2tlbmQgZW5mb3JjZXMgdGhlIGxpbWl0IGRlZmluZWQgdGhlcmUuXG5cbiAgICAgICAgICAgIHdpbmRvdy5jb2RiaS5sb2coXG4gICAgICAgICAgICAgIFwiSU5GT1wiLFxuICAgICAgICAgICAgICBgQXBwZW5kaW5nICcke2ZpbGUubmFtZX0nIGFzIGJhc2U2NCBwYXJhbSAobm8gY2xpZW50IGRvd25zY2FsZSk6ICR7ZGF0YVVybC5sZW5ndGggPCAxMDI0ID8gYCR7ZGF0YVVybC5sZW5ndGh9IEJgIDogZGF0YVVybC5sZW5ndGggPCAxMDQ4NTc2ID8gYCR7TWF0aC5yb3VuZChkYXRhVXJsLmxlbmd0aCAvIDEwMjQpfSBLQmAgOiBgJHsoZGF0YVVybC5sZW5ndGggLyAxMDQ4NTc2KS50b0ZpeGVkKDEpfSBNQmB9YCxcbiAgICAgICAgICAgICAgXCJBSSAvIExMQU1BIC8gQ0hBVFwiLFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKGBjb2RiaS1iYXNlNjQ6JHtmaWxlLm5hbWV9YCwgZGF0YVVybCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGF0dGFjaGVkRmlsZXMgPSBbXTtcblxuICAgICAgICBpZiAoZmlsZVVwbG9hZCkge1xuICAgICAgICAgIGZpbGVVcGxvYWQudmFsdWUgPSBcIlwiO1xuICAgICAgICB9XG4gICAgICAgIC8vICNlbmRyZWdpb24gUHJvY2VzcyBhdHRhY2hlZCBmaWxlcyAoUERGIC8gSW1hZ2UpXG4gICAgICAgIC8vICNyZWdpb24gQnVpbGQgcmVxdWVzdCBoZWFkZXJzXG4gICAgICAgIGNvbnN0IGhlYWRlcnM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcblxuICAgICAgICBpZiAodG9Mb2FkLnJvdGF0aW9uICYmIHRvTG9hZC5yb3RhdGlvbiAhPT0gXCIwXCIgJiYgdG9Mb2FkLnJvdGF0aW9uICE9PSAwKSB7XG4gICAgICAgICAgaGVhZGVyc1tcIlgtUm90YXRlXCJdID0gdG9Mb2FkLnJvdGF0aW9uLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyAjcmVnaW9uIEhUVFAgaGVhZGVycyBhcmUgQVNDSUktb25seSBcdTIwMTQgQmFzZTY0LWVuY29kZSB0byBwcmVzZXJ2ZSBVbmljb2RlIChlLmcuIFx1MDBGQywgXHUwMEY2LCBcdTAwRTQpXG4gICAgICAgIGNvbnN0IHV0ZjhUb0Jhc2U2NCA9IChzdHI6IHN0cmluZyk6IHN0cmluZyA9PiBidG9hKFN0cmluZy5mcm9tQ2hhckNvZGUoLi4ubmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHN0cikpKTtcblxuICAgICAgICBoZWFkZXJzW1wiWC1RdWVzdGlvbi1jaGF0XCJdID0gdXRmOFRvQmFzZTY0KG1lc3NhZ2UucmVwbGFjZSgvW1xcclxcbl0rL2csIFwiIFwiKS50cmltKCkpO1xuICAgICAgICBoZWFkZXJzW1wiWC1TdHJlYW1cIl0gPSBcInRydWVcIjtcbiAgICAgICAgaGVhZGVyc1tcIlgtU2Vzc2lvbi1JZFwiXSA9IHBhZ2VTZXNzaW9uSWQ7XG4gICAgICAgIGhlYWRlcnNbXCJYLUNoYXQtSGlzdG9yeVwiXSA9IHV0ZjhUb0Jhc2U2NChKU09OLnN0cmluZ2lmeShjb21wYWN0SGlzdG9yeSgpKSk7XG4gICAgICAgIC8vICNlbmRyZWdpb24gSFRUUCBoZWFkZXJzIGFyZSBBU0NJSS1vbmx5IFx1MjAxNCBCYXNlNjQtZW5jb2RlIHRvIHByZXNlcnZlIFVuaWNvZGUgKGUuZy4gXHUwMEZDLCBcdTAwRjYsIFx1MDBFNClcbiAgICAgICAgaWYgKHJlc3BvbnNlTGFuZykge1xuICAgICAgICAgIGhlYWRlcnNbXCJYLUZvcmNlZC1MYW5ndWFnZVwiXSA9IHJlc3BvbnNlTGFuZztcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3BlY2lhbGlzdCkge1xuICAgICAgICAgIGhlYWRlcnNbXCJYLVNwZWNpYWxpc3RcIl0gPSBzcGVjaWFsaXN0O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlua2luZ0NoZWNrYm94KSB7XG4gICAgICAgICAgaGVhZGVyc1tcIlgtVGhpbmtpbmdcIl0gPSB0aGlua2luZ0NoZWNrYm94LmNoZWNrZWQgPyBcInRydWVcIiA6IFwiZmFsc2VcIjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2VhcmNoQ2hlY2tib3gpIHtcbiAgICAgICAgICBoZWFkZXJzW1wiWC1TZWFyY2hcIl0gPSBzZWFyY2hDaGVja2JveC5jaGVja2VkID8gXCJ0cnVlXCIgOiBcImZhbHNlXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpbHRlclJlc3VsdHMgIT0gbnVsbCkge1xuICAgICAgICAgIGhlYWRlcnNbXCJYLUZpbHRlci1SZXN1bHRzXCJdID0gZmlsdGVyUmVzdWx0cyA/IFwidHJ1ZVwiIDogXCJmYWxzZVwiO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsb2NhdGlvbkNoZWNrYm94Py5jaGVja2VkKSB7XG4gICAgICAgICAgaGVhZGVyc1tcIlgtTG9jYXRpb25cIl0gPSBcInRydWVcIjtcbiAgICAgICAgICAvLyAjcmVnaW9uIFByZS1mZXRjaCBicm93c2VyIGdlb2xvY2F0aW9uXG4gICAgICAgICAgaWYgKG5hdmlnYXRvci5nZW9sb2NhdGlvbikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3QgcG9zID0gYXdhaXQgbmV3IFByb21pc2U8R2VvbG9jYXRpb25Qb3NpdGlvbj4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24ocmVzb2x2ZSwgcmVqZWN0LCB7XG4gICAgICAgICAgICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3k6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgdGltZW91dDogNTAwMCxcbiAgICAgICAgICAgICAgICAgIG1heGltdW1BZ2U6IDMwMDAwMCwgLy8gNSBtaW4gY2FjaGVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgaGVhZGVyc1tcIlgtTGF0aXR1ZGVcIl0gPSBwb3MuY29vcmRzLmxhdGl0dWRlLnRvRml4ZWQoNCk7XG4gICAgICAgICAgICAgIGhlYWRlcnNbXCJYLUxvbmdpdHVkZVwiXSA9IHBvcy5jb29yZHMubG9uZ2l0dWRlLnRvRml4ZWQoNCk7XG5cbiAgICAgICAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcbiAgICAgICAgICAgICAgICBcIklORk9cIixcbiAgICAgICAgICAgICAgICBgR2VvbG9jYXRpb246ICR7aGVhZGVyc1tcIlgtTGF0aXR1ZGVcIl19LCAke2hlYWRlcnNbXCJYLUxvbmdpdHVkZVwiXX1gLFxuICAgICAgICAgICAgICAgIFwiQUkgLyBMTEFNQSAvIENIQVRcIixcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGdlb0Vycikge1xuICAgICAgICAgICAgICBjb25zdCBtc2cgPVxuICAgICAgICAgICAgICAgIGdlb0VyciBpbnN0YW5jZW9mIEdlb2xvY2F0aW9uUG9zaXRpb25FcnJvciA/IGAke2dlb0Vyci5tZXNzYWdlfSAoY29kZSAke2dlb0Vyci5jb2RlfSlgIDogU3RyaW5nKGdlb0Vycik7XG4gICAgICAgICAgICAgIHdpbmRvdy5jb2RiaS5sb2coXCJXQVJOSU5HXCIsIGBHZW9sb2NhdGlvbiB1bmF2YWlsYWJsZTogJHttc2d9YCwgXCJBSSAvIExMQU1BIC8gQ0hBVFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBQcmUtZmV0Y2ggYnJvd3NlciBnZW9sb2NhdGlvblxuICAgICAgICAvLyAjZW5kcmVnaW9uIEJ1aWxkIHJlcXVlc3QgaGVhZGVyc1xuICAgICAgICAvLyAjcmVnaW9uIEZpbmlzaCBzdHJlYW1pbmcgYW5kIHJlLWVuYWJsZSBVSS5cbiAgICAgICAgY29uc3QgZmluaXNoU3RyZWFtaW5nID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICAgIGFjdGl2ZVN0cmVhbUlkID0gbnVsbDtcbiAgICAgICAgICBpc0J1c3kgPSBmYWxzZTtcbiAgICAgICAgICBzZW5kQnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XG5cbiAgICAgICAgICBpZiAobWljQnV0dG9uKSB7XG4gICAgICAgICAgICBtaWNCdXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHN0b3BCdXR0b24pIHtcbiAgICAgICAgICAgIHN0b3BCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoXCJkaXNhYmxlZFwiIGluIGNoYXRJbnB1dCkge1xuICAgICAgICAgICAgKGNoYXRJbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGhpZGVSZXNvdXJjZU92ZXJsYXkoKTtcbiAgICAgICAgICBjaGF0SW5wdXQuZm9jdXMoKTtcblxuICAgICAgICAgIC8vIEFsZXJ0LW9uLWZpbmlzaDogbXVsdGktcHJvbmdlZCBub3RpZmljYXRpb24gKGJyb3dzZXIgQVBJICsgYXVkaW8gYmVlcCArIHRpdGxlIGZsYXNoICsgaW4tcGFnZSB0b2FzdCkuXG4gICAgICAgICAgaWYgKGFsZXJ0T25GaW5pc2hDaGVja2JveD8uY2hlY2tlZCkge1xuICAgICAgICAgICAgLy8gMS4gVHJ5IGJyb3dzZXIgTm90aWZpY2F0aW9uIEFQSSAobWF5IHNpbGVudGx5IGZhaWwgaW4gaWZyYW1lcyAvIGNyb3NzLW9yaWdpbiBjb250ZXh0cykuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBpZiAoXCJOb3RpZmljYXRpb25cIiBpbiB3aW5kb3cpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuY29kYmkubG9nKFwiSU5GT1wiLCBgQWxlcnRPbkZpbmlzaDogTm90aWZpY2F0aW9uIEFQSSBhdmFpbGFibGUuIHBlcm1pc3Npb249XCIke05vdGlmaWNhdGlvbi5wZXJtaXNzaW9ufVwiYCwgXCJBSSAvIExMQU1BIC8gQ0hBVFwiKTtcbiAgICAgICAgICAgICAgICBpZiAoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKSB7XG4gICAgICAgICAgICAgICAgICBuZXcgTm90aWZpY2F0aW9uKGFsZXJ0T25GaW5pc2hUZXh0LCB7XG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IFwiWW91IHNob3VsZCBjaGVjayBiYWNrIG9uIHRoZSBzaXRlLlwiLFxuICAgICAgICAgICAgICAgICAgICBpY29uOiBcIi9mYXZpY29uLmljb1wiLFxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICB3aW5kb3cuY29kYmkubG9nKFwiSU5GT1wiLCBcIkFsZXJ0T25GaW5pc2g6IE5vdGlmaWNhdGlvbiBjcmVhdGVkIChncmFudGVkKS5cIiwgXCJBSSAvIExMQU1BIC8gQ0hBVFwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uID09PSBcImRlZmF1bHRcIikge1xuICAgICAgICAgICAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcIklORk9cIiwgXCJBbGVydE9uRmluaXNoOiBQZXJtaXNzaW9uIGlzIGRlZmF1bHQgXHUyMDE0IHJlcXVlc3Rpbmcgbm93LlwiLCBcIkFJIC8gTExBTUEgLyBDSEFUXCIpO1xuICAgICAgICAgICAgICAgICAgTm90aWZpY2F0aW9uLnJlcXVlc3RQZXJtaXNzaW9uKCkudGhlbigocGVybSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY29kYmkubG9nKFwiSU5GT1wiLCBgQWxlcnRPbkZpbmlzaDogcmVxdWVzdFBlcm1pc3Npb24gcmVzb2x2ZWQ6IFwiJHtwZXJtfVwiYCwgXCJBSSAvIExMQU1BIC8gQ0hBVFwiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBlcm0gPT09IFwiZ3JhbnRlZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgbmV3IE5vdGlmaWNhdGlvbihhbGVydE9uRmluaXNoVGV4dCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9keTogXCJZb3Ugc2hvdWxkIGNoZWNrIGJhY2sgb24gdGhlIHNpdGUuXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBpY29uOiBcIi9mYXZpY29uLmljb1wiLFxuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcIldBUk5cIiwgYEFsZXJ0T25GaW5pc2g6IFBlcm1pc3Npb24gaXMgXCIke05vdGlmaWNhdGlvbi5wZXJtaXNzaW9ufVwiIFx1MjAxNCBub3RpZmljYXRpb24gYmxvY2tlZCBieSB1c2VyLmAsIFwiQUkgLyBMTEFNQSAvIENIQVRcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5jb2RiaS5sb2coXCJXQVJOXCIsIFwiQWxlcnRPbkZpbmlzaDogTm90aWZpY2F0aW9uIEFQSSBub3QgYXZhaWxhYmxlIGluIHRoaXMgd2luZG93LlwiLCBcIkFJIC8gTExBTUEgLyBDSEFUXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChub3RpZkVycikge1xuICAgICAgICAgICAgICB3aW5kb3cuY29kYmkubG9nKFwiRVJST1JcIiwgYEFsZXJ0T25GaW5pc2g6IE5vdGlmaWNhdGlvbiBBUEkgdGhyZXc6ICR7U3RyaW5nKG5vdGlmRXJyKX1gLCBcIkFJIC8gTExBTUEgLyBDSEFUXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gMi4gQXVkaW8gYmVlcCAod29ya3Mgd2l0aG91dCBwZXJtaXNzaW9ucyBvbmNlIHVzZXIgaGFzIGludGVyYWN0ZWQgd2l0aCBwYWdlKS5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IGFjdHggPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4gICAgICAgICAgICAgIGNvbnN0IG9zYyA9IGFjdHguY3JlYXRlT3NjaWxsYXRvcigpO1xuXG4gICAgICAgICAgICAgIG9zYy50eXBlID0gXCJzaW5lXCI7XG4gICAgICAgICAgICAgIG9zYy5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUoODgwLCBhY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgICAgb3NjLmNvbm5lY3QoYWN0eC5kZXN0aW5hdGlvbik7XG4gICAgICAgICAgICAgIG9zYy5zdGFydCgpO1xuICAgICAgICAgICAgICBvc2Muc3RvcChhY3R4LmN1cnJlbnRUaW1lICsgMC4zKTtcbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAvLyBBdWRpb0NvbnRleHQgdW5hdmFpbGFibGUgXHUyMDE0IGlnbm9yZS5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIDMuIEZsYXNoIHBhZ2UgdGl0bGUgc28gdGhlIHVzZXIgbm90aWNlcyBldmVuIGlmIGJyb3dzZXIgbm90aWZpY2F0aW9uIGlzIGJsb2NrZWQuXG4gICAgICAgICAgICBjb25zdCBvcmlnVGl0bGUgPSBkb2N1bWVudC50aXRsZTtcbiAgICAgICAgICAgIGxldCBmbGFzaGVzID0gMDtcbiAgICAgICAgICAgIGNvbnN0IHRpdGxlRmxhc2ggPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICAgIGRvY3VtZW50LnRpdGxlID0gZmxhc2hlcyAlIDIgPT09IDAgPyBgXFx1MjcwNSAke2FsZXJ0T25GaW5pc2hUZXh0fWAgOiBvcmlnVGl0bGU7XG5cbiAgICAgICAgICAgICAgaWYgKCsrZmxhc2hlcyA+PSA2KSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aXRsZUZsYXNoKTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC50aXRsZSA9IG9yaWdUaXRsZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgICAgICAvLyA0LiBJbi1wYWdlIHRvYXN0IGJhbm5lciAoYWx3YXlzIHdvcmtzLCByZWdhcmRsZXNzIG9mIGlmcmFtZSBvciBwZXJtaXNzaW9uIHN0YXRlKS5cbiAgICAgICAgICAgIGNvbnN0IHRvYXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgICAgICAgdG9hc3QudGV4dENvbnRlbnQgPSBgXFx1MjcwNSAke2FsZXJ0T25GaW5pc2hUZXh0fWA7XG4gICAgICAgICAgICB0b2FzdC5zdHlsZS5jc3NUZXh0ID1cbiAgICAgICAgICAgICAgXCJwb3NpdGlvbjpmaXhlZDt0b3A6MTZweDtyaWdodDoxNnB4O3otaW5kZXg6OTk5OTk5O3BhZGRpbmc6MTJweCAyMHB4O1wiICtcbiAgICAgICAgICAgICAgXCJiYWNrZ3JvdW5kOiMxYTdmMzc7Y29sb3I6I2ZmZjtib3JkZXItcmFkaXVzOjhweDtmb250LXNpemU6MTRweDtmb250LXdlaWdodDo2MDA7XCIgK1xuICAgICAgICAgICAgICBcImJveC1zaGFkb3c6MCA0cHggMTJweCByZ2JhKDAsMCwwLC4yNSk7b3BhY2l0eTowO3RyYW5zaXRpb246b3BhY2l0eSAuM3M7Y3Vyc29yOnBvaW50ZXJcIjtcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodG9hc3QpO1xuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgICAgdG9hc3Quc3R5bGUub3BhY2l0eSA9IFwiMVwiO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0b2FzdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdG9hc3QucmVtb3ZlKCkpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgIHRvYXN0LnN0eWxlLm9wYWNpdHkgPSBcIjBcIjtcbiAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0b2FzdC5yZW1vdmUoKSwgNDAwKTtcbiAgICAgICAgICAgIH0sIDYwMDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBGaW5pc2ggc3RyZWFtaW5nIGFuZCByZS1lbmFibGUgVUkuXG4gICAgICAgIC8vICNyZWdpb24gUG9sbCBhIHN0cmVhbWluZyBzZXNzaW9uIHVudGlsIGRvbmUuXG4gICAgICAgIGNvbnN0IHBvbGxTdHJlYW0gPSAoc3RyZWFtSWQ6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgICAgICAgIGxldCBsYXN0VGV4dCA9IFwiXCI7XG4gICAgICAgICAgbGV0IHN0cmVhbUJ1YmJsZTogSFRNTERpdkVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICAvLyAjcmVnaW9uIGkxOG4gbGFiZWxzICh1cGRhdGVkIHdpdGggcG9sbCByZXNwb25zZSlcbiAgICAgICAgICBsZXQgaTE4blJlYXNvbmluZ0xhYmVsID0gXCJSZWFzb25pbmdcXHUyMDI2XCI7XG4gICAgICAgICAgbGV0IGkxOG5TaG93UmVhc29uaW5nTGFiZWwgPSBcIlNob3cgcmVhc29uaW5nXCI7XG4gICAgICAgICAgbGV0IGkxOG5TaG93U291cmNlc0xhYmVsID0gXCJTaG93IHNvdXJjZXNcIjtcbiAgICAgICAgICBsZXQgaTE4blNlYXJjaGluZ0xhYmVsID0gXCJTZWFyY2hpbmcgdGhlIGludGVybmV0IGZvciBcXHUyMDFDJXNcXHUyMDFEXFx1MjAyNlwiO1xuICAgICAgICAgIGxldCBpMThuU2VhcmNoaW5nTGFiZWxOb1F1ZXJ5ID0gXCJTZWFyY2hpbmcgdGhlIGludGVybmV0XFx1MjAyNlwiO1xuICAgICAgICAgIGxldCBpMThuUmVhZGluZ0xhYmVsID0gXCJSZWFkaW5nIHBhZ2U6IFxcdTIwMUMlc1xcdTIwMURcXHUyMDI2XCI7XG4gICAgICAgICAgbGV0IGkxOG5SZWFkaW5nTGFiZWxOb1VybCA9IFwiUmVhZGluZyBwYWdlIGNvbnRlbnRcXHUyMDI2XCI7XG4gICAgICAgICAgbGV0IGkxOG5UaGlua2luZ0xhYmVsID0gXCJUaGlua2luZ1xcdTIwMjZcIjtcbiAgICAgICAgICBsZXQgaTE4bkNvcHlSZXNwb25zZUxhYmVsID0gXCJSZXNwb25zZVwiO1xuICAgICAgICAgIGxldCBpMThuQ29weVJlYXNvbmluZ0xhYmVsID0gXCJSZWFzb25pbmdcIjtcbiAgICAgICAgICBsZXQgaTE4blNlbmRpbmdNYWlsTGFiZWwgPSBcIlNlbmRpbmcgZW1haWwgdG8gXFx1MjAxQyVzXFx1MjAxRFxcdTIwMjZcIjtcbiAgICAgICAgICBsZXQgaTE4blNlbmRpbmdNYWlsTGFiZWxOb1JlY2lwaWVudCA9IFwiU2VuZGluZyBlbWFpbFxcdTIwMjZcIjtcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uIGkxOG4gbGFiZWxzICh1cGRhdGVkIHdpdGggcG9sbCByZXNwb25zZSlcbiAgICAgICAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgIHVybDogYCR7d2luZG93LmNvZGJpLmJhc2VVUkx9cGx1Z2luP25hbWU9Q29kQmlfQUlfTExBTUFfU1REYCxcbiAgICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXG4gICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcbiAgICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgICAgYmVmb3JlU2VuZDogKHhocikgPT4ge1xuICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiWC1TdHJlYW0tUG9sbFwiLCBzdHJlYW1JZCk7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHN1Y2Nlc3M6IChwb2xsUmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICBoYW5kbGVSZXNvdXJjZVN0YXR1cyhwb2xsUmVzcG9uc2UucmVzb3VyY2VTdGF0dXMpO1xuICAgICAgICAgICAgICAgIC8vICNyZWdpb24gUXVldWUtcG9zaXRpb24gYmFkZ2UuXG4gICAgICAgICAgICAgICAgaWYgKHBvbGxSZXNwb25zZS5xdWV1ZUJhZGdlICE9IG51bGwgJiYgcXVldWVCYWRnZU92ZXJyaWRlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgIHF1ZXVlQmFkZ2VFbmFibGVkID0gISFwb2xsUmVzcG9uc2UucXVldWVCYWRnZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3Qgc2hvd0JhZGdlID0gcXVldWVCYWRnZU92ZXJyaWRlICE9IG51bGwgPyBxdWV1ZUJhZGdlT3ZlcnJpZGUgOiBxdWV1ZUJhZGdlRW5hYmxlZDtcbiAgICAgICAgICAgICAgICBpZiAoc2hvd0JhZGdlICYmIHBvbGxSZXNwb25zZS5xdWV1ZVBvc2l0aW9uID4gMCAmJiB0aGlua2luZ0J1YmJsZSkge1xuICAgICAgICAgICAgICAgICAgbGV0IGJhZGdlID0gdGhpbmtpbmdCdWJibGUucXVlcnlTZWxlY3RvcihcIi5MTEFNQV9RdWV1ZUJhZGdlXCIpIGFzIEhUTUxTcGFuRWxlbWVudCB8IG51bGw7XG4gICAgICAgICAgICAgICAgICBpZiAoIWJhZGdlKSB7XG4gICAgICAgICAgICAgICAgICAgIGJhZGdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgICAgICAgICAgICAgIGJhZGdlLmNsYXNzTmFtZSA9IFwiTExBTUFfUXVldWVCYWRnZVwiO1xuICAgICAgICAgICAgICAgICAgICB0aGlua2luZ0J1YmJsZS5hcHBlbmRDaGlsZChiYWRnZSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBjb25zdCB3YWl0TGFiZWwgPSBmb3JtYXRXYWl0VGltZShwb2xsUmVzcG9uc2UuZXN0aW1hdGVkV2FpdE1zKTtcbiAgICAgICAgICAgICAgICAgIGJhZGdlLnRleHRDb250ZW50ID0gYCR7cG9sbFJlc3BvbnNlLnF1ZXVlUG9zaXRpb259JHt3YWl0TGFiZWwgPyBgICR7d2FpdExhYmVsfWAgOiBcIlwifSR7cXVldWVUZXh0ID8gYCAke3F1ZXVlVGV4dH1gIDogXCJcIn1gO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpbmtpbmdCdWJibGUpIHtcbiAgICAgICAgICAgICAgICAgIHRoaW5raW5nQnViYmxlLnF1ZXJ5U2VsZWN0b3IoXCIuTExBTUFfUXVldWVCYWRnZVwiKT8ucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gUXVldWUtcG9zaXRpb24gYmFkZ2UuXG4gICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBHZXQgdHJhbnNsYXRlZCBsYWJlbHMuXG4gICAgICAgICAgICAgICAgaWYgKHBvbGxSZXNwb25zZS5pMThuKSB7XG4gICAgICAgICAgICAgICAgICBpZiAocG9sbFJlc3BvbnNlLmkxOG4ucmVhc29uaW5nTGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgaTE4blJlYXNvbmluZ0xhYmVsID0gcG9sbFJlc3BvbnNlLmkxOG4ucmVhc29uaW5nTGFiZWw7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIGlmIChwb2xsUmVzcG9uc2UuaTE4bi5zaG93UmVhc29uaW5nTGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgaTE4blNob3dSZWFzb25pbmdMYWJlbCA9IHBvbGxSZXNwb25zZS5pMThuLnNob3dSZWFzb25pbmdMYWJlbDtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgaWYgKHBvbGxSZXNwb25zZS5pMThuLnNob3dTb3VyY2VzTGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgaTE4blNob3dTb3VyY2VzTGFiZWwgPSBwb2xsUmVzcG9uc2UuaTE4bi5zaG93U291cmNlc0xhYmVsO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBpZiAocG9sbFJlc3BvbnNlLmkxOG4uc2VhcmNoaW5nTGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgaTE4blNlYXJjaGluZ0xhYmVsID0gcG9sbFJlc3BvbnNlLmkxOG4uc2VhcmNoaW5nTGFiZWw7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIGlmIChwb2xsUmVzcG9uc2UuaTE4bi5zZWFyY2hpbmdMYWJlbE5vUXVlcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgaTE4blNlYXJjaGluZ0xhYmVsTm9RdWVyeSA9IHBvbGxSZXNwb25zZS5pMThuLnNlYXJjaGluZ0xhYmVsTm9RdWVyeTtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgaWYgKHBvbGxSZXNwb25zZS5pMThuLnJlYWRpbmdMYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICBpMThuUmVhZGluZ0xhYmVsID0gcG9sbFJlc3BvbnNlLmkxOG4ucmVhZGluZ0xhYmVsO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBpZiAocG9sbFJlc3BvbnNlLmkxOG4ucmVhZGluZ0xhYmVsTm9VcmwpIHtcbiAgICAgICAgICAgICAgICAgICAgaTE4blJlYWRpbmdMYWJlbE5vVXJsID0gcG9sbFJlc3BvbnNlLmkxOG4ucmVhZGluZ0xhYmVsTm9Vcmw7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIGlmIChwb2xsUmVzcG9uc2UuaTE4bi50aGlua2luZ0xhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGkxOG5UaGlua2luZ0xhYmVsID0gcG9sbFJlc3BvbnNlLmkxOG4udGhpbmtpbmdMYWJlbDtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0aGlua2luZ0xhYmVsRWwgPSB0aGlua2luZ0J1YmJsZT8ucXVlcnlTZWxlY3RvcihcIi5MTEFNQV9UaGlua2luZ0xhYmVsXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlua2luZ0xhYmVsRWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlua2luZ0xhYmVsRWwudGV4dENvbnRlbnQgPSBpMThuVGhpbmtpbmdMYWJlbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBpZiAocG9sbFJlc3BvbnNlLmkxOG4uY29weVJlc3BvbnNlTGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgaTE4bkNvcHlSZXNwb25zZUxhYmVsID0gcG9sbFJlc3BvbnNlLmkxOG4uY29weVJlc3BvbnNlTGFiZWw7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpZiAocG9sbFJlc3BvbnNlLmkxOG4uY29weVJlYXNvbmluZ0xhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGkxOG5Db3B5UmVhc29uaW5nTGFiZWwgPSBwb2xsUmVzcG9uc2UuaTE4bi5jb3B5UmVhc29uaW5nTGFiZWw7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIGlmIChwb2xsUmVzcG9uc2UuaTE4bi5zZW5kaW5nTWFpbExhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGkxOG5TZW5kaW5nTWFpbExhYmVsID0gcG9sbFJlc3BvbnNlLmkxOG4uc2VuZGluZ01haWxMYWJlbDtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgaWYgKHBvbGxSZXNwb25zZS5pMThuLnNlbmRpbmdNYWlsTGFiZWxOb1JlY2lwaWVudCkge1xuICAgICAgICAgICAgICAgICAgICBpMThuU2VuZGluZ01haWxMYWJlbE5vUmVjaXBpZW50ID0gcG9sbFJlc3BvbnNlLmkxOG4uc2VuZGluZ01haWxMYWJlbE5vUmVjaXBpZW50O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBHZXQgdHJhbnNsYXRlZCBsYWJlbHMuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHBvbGxSZXNwb25zZS5lcnJvciAmJiBwb2xsUmVzcG9uc2UuZG9uZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgICAgICAgICAgIHJlcGxhY2VUaGlua2luZyhgJHttb2RlbExhYmVsfTogXFx1MjZBMCAke3BvbGxSZXNwb25zZS5lcnJvcn1gKTtcbiAgICAgICAgICAgICAgICAgIGZpbmlzaFN0cmVhbWluZygpO1xuXG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgdGV4dDogc3RyaW5nID0gcG9sbFJlc3BvbnNlLnRleHQgPz8gXCJcIjtcbiAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIFN1cHByZXNzIHRoZSBcIkNBTEw6c2VhcmNoXCIgaWYgbm90IG91dHB1dHRpbmcgZmluYWwgYW5zd2VyLlxuICAgICAgICAgICAgICAgIGlmICgvQ0FMTDovLnRlc3QodGV4dCkgJiYgIXBvbGxSZXNwb25zZS5kb25lKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBjYWxsTWF0Y2ggPSB0ZXh0Lm1hdGNoKC9DQUxMOnNlYXJjaFxcKCg/OlxccyopcXVlcnkoPzpcXHMqKT0oPzpcXHMqKVsnXCJdKFteJ1wiXSopWydcIl1cXHMqXFwpLyk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBmZXRjaE1hdGNoID0gdGV4dC5tYXRjaCgvQ0FMTDpmZXRjaFxcKCg/OlxccyopdXJsKD86XFxzKik9KD86XFxzKilbJ1wiXShbXidcIl0qKVsnXCJdXFxzKlxcKS8pO1xuICAgICAgICAgICAgICAgICAgY29uc3QgbWFpbE1hdGNoID0gdGV4dC5tYXRjaCgvQ0FMTDptYWlsXFwoKD86XFxzKil0byg/OlxccyopPSg/OlxccyopWydcIl0oW14nXCJdKilbJ1wiXS8pO1xuICAgICAgICAgICAgICAgICAgaWYgKHN0cmVhbUJ1YmJsZSkge1xuICAgICAgICAgICAgICAgICAgICBzdHJlYW1CdWJibGUucGFyZW50RWxlbWVudD8ucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtQnViYmxlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgaWYgKHRoaW5raW5nQnViYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaW5raW5nQnViYmxlLnBhcmVudEVsZW1lbnQ/LnJlbW92ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaW5raW5nQnViYmxlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgaWYgKGNhbGxNYXRjaCAmJiAhY2hhdENvbnRhaW5lci5xdWVyeVNlbGVjdG9yKFwiLkxMQU1BX1NlYXJjaEluZGljYXRvclwiKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWFyY2hRdWVyeSA9IGNhbGxNYXRjaFsxXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kaWNhdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgICAgICAgICAgICAgICBpbmRpY2F0b3IuY2xhc3NOYW1lID0gXCJMTEFNQV9DaGF0X1JvdyBMTEFNQV9DaGF0X1Jvdy0tbGxhbWFcIjtcbiAgICAgICAgICAgICAgICAgICAgaW5kaWNhdG9yLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwiTExBTUFfQ2hhdF9CdWJibGUgTExBTUFfQ2hhdF9CdWJibGUtLWxsYW1hIExMQU1BX1NlYXJjaEluZGljYXRvclwiPjxkaXYgY2xhc3M9XCJDb2RCaUxvYWRlcl9TcGlubmVyIExMQU1BX1NlYXJjaFNwaW5uZXJcIj48L2Rpdj48c3BhbiBjbGFzcz1cIkxMQU1BX1NlYXJjaExhYmVsXCI+JHtpMThuU2VhcmNoaW5nTGFiZWwucmVwbGFjZShcIiVzXCIsIHNlYXJjaFF1ZXJ5KX08L3NwYW4+PC9kaXY+YDtcblxuICAgICAgICAgICAgICAgICAgICBjaGF0Q29udGFpbmVyLmFwcGVuZENoaWxkKGluZGljYXRvcik7XG4gICAgICAgICAgICAgICAgICAgIGNoYXRDb250YWluZXIuc2Nyb2xsVG9wID0gY2hhdENvbnRhaW5lci5zY3JvbGxIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZldGNoTWF0Y2ggJiYgIWNoYXRDb250YWluZXIucXVlcnlTZWxlY3RvcihcIi5MTEFNQV9TZWFyY2hJbmRpY2F0b3JcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmV0Y2hVcmwgPSBmZXRjaE1hdGNoWzFdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmRpY2F0b3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGluZGljYXRvci5jbGFzc05hbWUgPSBcIkxMQU1BX0NoYXRfUm93IExMQU1BX0NoYXRfUm93LS1sbGFtYVwiO1xuICAgICAgICAgICAgICAgICAgICBpbmRpY2F0b3IuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJMTEFNQV9DaGF0X0J1YmJsZSBMTEFNQV9DaGF0X0J1YmJsZS0tbGxhbWEgTExBTUFfU2VhcmNoSW5kaWNhdG9yXCI+PGRpdiBjbGFzcz1cIkNvZEJpTG9hZGVyX1NwaW5uZXIgTExBTUFfU2VhcmNoU3Bpbm5lclwiPjwvZGl2PjxzcGFuIGNsYXNzPVwiTExBTUFfU2VhcmNoTGFiZWxcIj4ke2kxOG5SZWFkaW5nTGFiZWwucmVwbGFjZShcIiVzXCIsIGZldGNoVXJsKX08L3NwYW4+PC9kaXY+YDtcblxuICAgICAgICAgICAgICAgICAgICBjaGF0Q29udGFpbmVyLmFwcGVuZENoaWxkKGluZGljYXRvcik7XG4gICAgICAgICAgICAgICAgICAgIGNoYXRDb250YWluZXIuc2Nyb2xsVG9wID0gY2hhdENvbnRhaW5lci5zY3JvbGxIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1haWxNYXRjaCAmJiAhY2hhdENvbnRhaW5lci5xdWVyeVNlbGVjdG9yKFwiLkxMQU1BX1NlYXJjaEluZGljYXRvclwiKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYWlsVG8gPSBtYWlsTWF0Y2hbMV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZGljYXRvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgaW5kaWNhdG9yLmNsYXNzTmFtZSA9IFwiTExBTUFfQ2hhdF9Sb3cgTExBTUFfQ2hhdF9Sb3ctLWxsYW1hXCI7XG4gICAgICAgICAgICAgICAgICAgIGluZGljYXRvci5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cIkxMQU1BX0NoYXRfQnViYmxlIExMQU1BX0NoYXRfQnViYmxlLS1sbGFtYSBMTEFNQV9TZWFyY2hJbmRpY2F0b3JcIj48ZGl2IGNsYXNzPVwiQ29kQmlMb2FkZXJfU3Bpbm5lciBMTEFNQV9TZWFyY2hTcGlubmVyXCI+PC9kaXY+PHNwYW4gY2xhc3M9XCJMTEFNQV9TZWFyY2hMYWJlbFwiPiR7bWFpbFRvID8gaTE4blNlbmRpbmdNYWlsTGFiZWwucmVwbGFjZShcIiVzXCIsIG1haWxUbykgOiBpMThuU2VuZGluZ01haWxMYWJlbE5vUmVjaXBpZW50fTwvc3Bhbj48L2Rpdj5gO1xuXG4gICAgICAgICAgICAgICAgICAgIGNoYXRDb250YWluZXIuYXBwZW5kQ2hpbGQoaW5kaWNhdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgY2hhdENvbnRhaW5lci5zY3JvbGxUb3AgPSBjaGF0Q29udGFpbmVyLnNjcm9sbEhlaWdodDtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgbGFzdFRleHQgPSBcIlwiO1xuXG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gU3VwcHJlc3MgdGhlIFwiQ0FMTDpzZWFyY2hcIiBpZiBub3Qgb3V0cHV0dGluZyBmaW5hbCBhbnN3ZXIuXG4gICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBUaGUgXCJGZXRjaGluZy4uLlwiLUJ1YmJsZS5cbiAgICAgICAgICAgICAgICBpZiAocG9sbFJlc3BvbnNlLmZldGNoaW5nICYmIHRleHQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoIWNoYXRDb250YWluZXIucXVlcnlTZWxlY3RvcihcIi5MTEFNQV9TZWFyY2hJbmRpY2F0b3JcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmVhbUJ1YmJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbUJ1YmJsZS5wYXJlbnRFbGVtZW50Py5yZW1vdmUoKTtcblxuICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbUJ1YmJsZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpbmtpbmdCdWJibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlua2luZ0J1YmJsZS5wYXJlbnRFbGVtZW50Py5yZW1vdmUoKTtcblxuICAgICAgICAgICAgICAgICAgICAgIHRoaW5raW5nQnViYmxlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZldGNoVXJsOiBzdHJpbmcgPSBwb2xsUmVzcG9uc2UuZmV0Y2hVcmwgPz8gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kaWNhdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgICAgICAgICAgICAgICBpbmRpY2F0b3IuY2xhc3NOYW1lID0gXCJMTEFNQV9DaGF0X1JvdyBMTEFNQV9DaGF0X1Jvdy0tbGxhbWFcIjtcbiAgICAgICAgICAgICAgICAgICAgaW5kaWNhdG9yLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwiTExBTUFfQ2hhdF9CdWJibGUgTExBTUFfQ2hhdF9CdWJibGUtLWxsYW1hIExMQU1BX1NlYXJjaEluZGljYXRvclwiPjxkaXYgY2xhc3M9XCJDb2RCaUxvYWRlcl9TcGlubmVyIExMQU1BX1NlYXJjaFNwaW5uZXJcIj48L2Rpdj48c3BhbiBjbGFzcz1cIkxMQU1BX1NlYXJjaExhYmVsXCI+JHtmZXRjaFVybCA/IGkxOG5SZWFkaW5nTGFiZWwucmVwbGFjZShcIiVzXCIsIGZldGNoVXJsKSA6IGkxOG5SZWFkaW5nTGFiZWxOb1VybH08L3NwYW4+PC9kaXY+YDtcblxuICAgICAgICAgICAgICAgICAgICBjaGF0Q29udGFpbmVyLmFwcGVuZENoaWxkKGluZGljYXRvcik7XG4gICAgICAgICAgICAgICAgICAgIGNoYXRDb250YWluZXIuc2Nyb2xsVG9wID0gY2hhdENvbnRhaW5lci5zY3JvbGxIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIGxhc3RUZXh0ID0gXCJcIjtcblxuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIFRoZSBcIkZldGNoaW5nLi4uXCItQnViYmxlLlxuICAgICAgICAgICAgICAgIC8vICNyZWdpb24gVGhlIFwiU2VuZGluZyBlbWFpbC4uLlwiLUJ1YmJsZS5cbiAgICAgICAgICAgICAgICBpZiAocG9sbFJlc3BvbnNlLnNlbmRpbmdNYWlsICYmIHRleHQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoIWNoYXRDb250YWluZXIucXVlcnlTZWxlY3RvcihcIi5MTEFNQV9TZWFyY2hJbmRpY2F0b3JcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmVhbUJ1YmJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbUJ1YmJsZS5wYXJlbnRFbGVtZW50Py5yZW1vdmUoKTtcblxuICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbUJ1YmJsZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpbmtpbmdCdWJibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlua2luZ0J1YmJsZS5wYXJlbnRFbGVtZW50Py5yZW1vdmUoKTtcblxuICAgICAgICAgICAgICAgICAgICAgIHRoaW5raW5nQnViYmxlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1haWxSZWNpcGllbnQ6IHN0cmluZyA9IHBvbGxSZXNwb25zZS5tYWlsUmVjaXBpZW50ID8/IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZGljYXRvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgaW5kaWNhdG9yLmNsYXNzTmFtZSA9IFwiTExBTUFfQ2hhdF9Sb3cgTExBTUFfQ2hhdF9Sb3ctLWxsYW1hXCI7XG4gICAgICAgICAgICAgICAgICAgIGluZGljYXRvci5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cIkxMQU1BX0NoYXRfQnViYmxlIExMQU1BX0NoYXRfQnViYmxlLS1sbGFtYSBMTEFNQV9TZWFyY2hJbmRpY2F0b3JcIj48ZGl2IGNsYXNzPVwiQ29kQmlMb2FkZXJfU3Bpbm5lciBMTEFNQV9TZWFyY2hTcGlubmVyXCI+PC9kaXY+PHNwYW4gY2xhc3M9XCJMTEFNQV9TZWFyY2hMYWJlbFwiPiR7bWFpbFJlY2lwaWVudCA/IGkxOG5TZW5kaW5nTWFpbExhYmVsLnJlcGxhY2UoXCIlc1wiLCBtYWlsUmVjaXBpZW50KSA6IGkxOG5TZW5kaW5nTWFpbExhYmVsTm9SZWNpcGllbnR9PC9zcGFuPjwvZGl2PmA7XG5cbiAgICAgICAgICAgICAgICAgICAgY2hhdENvbnRhaW5lci5hcHBlbmRDaGlsZChpbmRpY2F0b3IpO1xuICAgICAgICAgICAgICAgICAgICBjaGF0Q29udGFpbmVyLnNjcm9sbFRvcCA9IGNoYXRDb250YWluZXIuc2Nyb2xsSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBsYXN0VGV4dCA9IFwiXCI7XG5cbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBUaGUgXCJTZW5kaW5nIGVtYWlsLi4uXCItQnViYmxlLlxuICAgICAgICAgICAgICAgIC8vICNyZWdpb24gVGhlIFwiVGhpbmtpbmcuLi5cIi1CdWJibGUuXG4gICAgICAgICAgICAgICAgaWYgKHBvbGxSZXNwb25zZS5zZWFyY2hpbmcgJiYgdGV4dC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgIGlmICghY2hhdENvbnRhaW5lci5xdWVyeVNlbGVjdG9yKFwiLkxMQU1BX1NlYXJjaEluZGljYXRvclwiKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RyZWFtQnViYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgc3RyZWFtQnViYmxlLnBhcmVudEVsZW1lbnQ/LnJlbW92ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgc3RyZWFtQnViYmxlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlua2luZ0J1YmJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgIHRoaW5raW5nQnViYmxlLnBhcmVudEVsZW1lbnQ/LnJlbW92ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgdGhpbmtpbmdCdWJibGUgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VhcmNoUXVlcnk6IHN0cmluZyA9IHBvbGxSZXNwb25zZS5zZWFyY2hRdWVyeSA/PyBcIlwiO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmRpY2F0b3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGluZGljYXRvci5jbGFzc05hbWUgPSBcIkxMQU1BX0NoYXRfUm93IExMQU1BX0NoYXRfUm93LS1sbGFtYVwiO1xuICAgICAgICAgICAgICAgICAgICBpbmRpY2F0b3IuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJMTEFNQV9DaGF0X0J1YmJsZSBMTEFNQV9DaGF0X0J1YmJsZS0tbGxhbWEgTExBTUFfU2VhcmNoSW5kaWNhdG9yXCI+PGRpdiBjbGFzcz1cIkNvZEJpTG9hZGVyX1NwaW5uZXIgTExBTUFfU2VhcmNoU3Bpbm5lclwiPjwvZGl2PjxzcGFuIGNsYXNzPVwiTExBTUFfU2VhcmNoTGFiZWxcIj4ke3NlYXJjaFF1ZXJ5ID8gaTE4blNlYXJjaGluZ0xhYmVsLnJlcGxhY2UoXCIlc1wiLCBzZWFyY2hRdWVyeSkgOiBpMThuU2VhcmNoaW5nTGFiZWxOb1F1ZXJ5fTwvc3Bhbj48L2Rpdj5gO1xuXG4gICAgICAgICAgICAgICAgICAgIGNoYXRDb250YWluZXIuYXBwZW5kQ2hpbGQoaW5kaWNhdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgY2hhdENvbnRhaW5lci5zY3JvbGxUb3AgPSBjaGF0Q29udGFpbmVyLnNjcm9sbEhlaWdodDtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgbGFzdFRleHQgPSBcIlwiO1xuXG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gVGhlIFwiVGhpbmtpbmcuLi5cIi1CdWJibGUuXG4gICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBSZW1vdmUgcHJlLXNob3J0ZWQgZHVwbGljYXRlIHRleHQuXG4gICAgICAgICAgICAgICAgaWYgKHRleHQubGVuZ3RoID4gMCAmJiB0ZXh0Lmxlbmd0aCA8IGxhc3RUZXh0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgaW5kaWNhdG9yID0gY2hhdENvbnRhaW5lci5xdWVyeVNlbGVjdG9yKFwiLkxMQU1BX1NlYXJjaEluZGljYXRvclwiKTtcblxuICAgICAgICAgICAgICAgICAgaWYgKGluZGljYXRvcj8ucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBpbmRpY2F0b3IucGFyZW50RWxlbWVudC5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgbGFzdFRleHQgPSBcIlwiO1xuXG4gICAgICAgICAgICAgICAgICBpZiAoc3RyZWFtQnViYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbUJ1YmJsZS5pbm5lckhUTUwgPSBsaW5raWZ5VXJscyh0ZXh0KTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbUJ1YmJsZSA9IGFwcGVuZEJ1YmJsZSh0ZXh0LCBcImxsYW1hXCIpO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gUmVtb3ZlIHByZS1zaG9ydGVkIGR1cGxpY2F0ZSB0ZXh0LlxuICAgICAgICAgICAgICAgIC8vICNyZWdpb24gTGl2ZS1SZWFzb25pbmcuXG4gICAgICAgICAgICAgICAgY29uc3QgbGl2ZVRoaW5raW5nOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBwb2xsUmVzcG9uc2UudGhpbmtpbmc7XG5cbiAgICAgICAgICAgICAgICBpZiAobGl2ZVRoaW5raW5nICYmIHRleHQubGVuZ3RoID09PSAwICYmICFwb2xsUmVzcG9uc2UuZG9uZSAmJiB0aGlua2luZ0J1YmJsZSkge1xuICAgICAgICAgICAgICAgICAgbGV0IHJlYXNvbmluZ0VsID0gdGhpbmtpbmdCdWJibGUucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgICAgICAgICAgXCIuTExBTUFfTGl2ZVJlYXNvbmluZ0NvbnRlbnRcIixcbiAgICAgICAgICAgICAgICAgICkgYXMgSFRNTERpdkVsZW1lbnQgfCBudWxsO1xuXG4gICAgICAgICAgICAgICAgICBpZiAoIXJlYXNvbmluZ0VsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaW5raW5nQnViYmxlLmNsYXNzTGlzdC5yZW1vdmUoXCJMTEFNQV9DaGF0X0J1YmJsZS0tdGhpbmtpbmdcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpbmtpbmdCdWJibGUuaW5uZXJIVE1MID0gYDxkZXRhaWxzIGNsYXNzPVwiTExBTUFfQ2hhdF9UaGlua2luZ1wiIG9wZW4+PHN1bW1hcnkgc3R5bGU9XCJkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo2cHhcIj48ZGl2IGNsYXNzPVwiQ29kQmlMb2FkZXJfU3Bpbm5lciBMTEFNQV9UaGlua2luZ1NwaW5uZXJcIj48L2Rpdj48c3Bhbj4ke2kxOG5SZWFzb25pbmdMYWJlbH08L3NwYW4+PC9zdW1tYXJ5PjxkaXYgY2xhc3M9XCJMTEFNQV9DaGF0X1RoaW5raW5nQ29udGVudCBMTEFNQV9MaXZlUmVhc29uaW5nQ29udGVudFwiPjwvZGl2PjwvZGV0YWlscz5gO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlYXNvbmluZ0VsID0gdGhpbmtpbmdCdWJibGUucXVlcnlTZWxlY3RvcihcIi5MTEFNQV9MaXZlUmVhc29uaW5nQ29udGVudFwiKSBhcyBIVE1MRGl2RWxlbWVudDtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgaWYgKHJlYXNvbmluZ0VsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzTmVhckJvdHRvbSA9XG4gICAgICAgICAgICAgICAgICAgICAgcmVhc29uaW5nRWwuc2Nyb2xsSGVpZ2h0IC0gcmVhc29uaW5nRWwuc2Nyb2xsVG9wIC0gcmVhc29uaW5nRWwuY2xpZW50SGVpZ2h0IDwgNDA7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVhc29uaW5nRWwuaW5uZXJIVE1MID0gbGlua2lmeVVybHMobGl2ZVRoaW5raW5nKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNOZWFyQm90dG9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmVhc29uaW5nRWwuc2Nyb2xsVG9wID0gcmVhc29uaW5nRWwuc2Nyb2xsSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgIGNoYXRDb250YWluZXIuc2Nyb2xsVG9wID0gY2hhdENvbnRhaW5lci5zY3JvbGxIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIExpdmUtUmVhc29uaW5nLlxuICAgICAgICAgICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA+IGxhc3RUZXh0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgbGFzdFRleHQgPSB0ZXh0O1xuXG4gICAgICAgICAgICAgICAgICBpZiAodGhpbmtpbmdCdWJibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpbmtpbmdCdWJibGUucGFyZW50RWxlbWVudD8ucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpbmtpbmdCdWJibGUgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBzdHJlYW1CdWJibGUgPSBhcHBlbmRCdWJibGUodGV4dCwgXCJsbGFtYVwiKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RyZWFtQnViYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbUJ1YmJsZS5pbm5lckhUTUwgPSBsaW5raWZ5VXJscyh0ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgY2hhdENvbnRhaW5lci5zY3JvbGxUb3AgPSBjaGF0Q29udGFpbmVyLnNjcm9sbEhlaWdodDtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlYXJjaEluZCA9IGNoYXRDb250YWluZXIucXVlcnlTZWxlY3RvcihcIi5MTEFNQV9TZWFyY2hJbmRpY2F0b3JcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlYXJjaEluZD8ucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaEluZC5wYXJlbnRFbGVtZW50LnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtQnViYmxlID0gYXBwZW5kQnViYmxlKHRleHQsIFwibGxhbWFcIik7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHBvbGxSZXNwb25zZS5kb25lKSB7XG4gICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgbW9kZWwncyBvdXRwdXQgaXMgYSBDQUxMOiB0b29sIGludm9jYXRpb24sIHRoZSBiYWNrZW5kIHdpbGwgaGFuZGxlXG4gICAgICAgICAgICAgICAgICAvLyB0aGUgdG9vbCBjYWxsIGFuZCBzdGFydCBhIG5ldyBpbmZlcmVuY2Ugcm91bmQuIERvbid0IGZpbmlzaCBzdHJlYW1pbmcgXHUyMDE0XG4gICAgICAgICAgICAgICAgICAvLyBrZWVwIHBvbGxpbmcgZm9yIHRoZSByZWFsIGZpbmFsIGFuc3dlci5cbiAgICAgICAgICAgICAgICAgIC8vIFVzZSBeQ0FMTDogKHN0YXJ0cy13aXRoKSBzbyBhIGZpbmFsIGFuc3dlciB0aGF0IG1lcmVseSBtZW50aW9ucyBcIkNBTEw6XCIgaW5cbiAgICAgICAgICAgICAgICAgIC8vIGl0cyBib2R5IGRvZXNuJ3Qgc3VwcHJlc3MgZmluaXNoU3RyZWFtaW5nIGZvcmV2ZXIuXG4gICAgICAgICAgICAgICAgICBpZiAoL15DQUxMOi8udGVzdCh0ZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICBsYXN0VGV4dCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgICAgY29uc3Qgc2VhcmNoSW5kID0gY2hhdENvbnRhaW5lci5xdWVyeVNlbGVjdG9yKFwiLkxMQU1BX1NlYXJjaEluZGljYXRvclwiKTtcblxuICAgICAgICAgICAgICAgICAgaWYgKHNlYXJjaEluZD8ucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBzZWFyY2hJbmQucGFyZW50RWxlbWVudC5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgaWYgKHBvbGxSZXNwb25zZS5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RyZWFtQnViYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgc3RyZWFtQnViYmxlLnRleHRDb250ZW50ID0gYFxcdTI2QTAgJHtwb2xsUmVzcG9uc2UuZXJyb3J9YDtcblxuICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbUJ1YmJsZS5jbGFzc0xpc3QuYWRkKFwiTExBTUFfQ2hhdF9CdWJibGUtLWVycm9yXCIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIHJlcGxhY2VUaGlua2luZyhgJHttb2RlbExhYmVsfTogXFx1MjZBMCAke3BvbGxSZXNwb25zZS5lcnJvcn1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkhpc3RvcnkucG9wKCk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlYXJjaE9uID0gc2VhcmNoQ2hlY2tib3ggPyBzZWFyY2hDaGVja2JveC5jaGVja2VkIDogdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXNzaXN0YW50RW50cnkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgcm9sZTogXCJhc3Npc3RhbnRcIixcbiAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBzZWFyY2hPbiA/IHN0cmlwTGlua3NGb3JIaXN0b3J5KGxhc3RUZXh0KSA6IGxhc3RUZXh0LFxuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkhpc3RvcnkucHVzaChhc3Npc3RhbnRFbnRyeSk7XG4gICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gQ29uZmlkZW5jZTogc2VsZWN0aXZlIGNhY2hpbmcgKyB1bmNlcnRhaW4gdG9rZW4gaGlnaGxpZ2h0aW5nXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbmZpZGVuY2U6XG4gICAgICAgICAgICAgICAgICAgICAgfCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZWFuPzogbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgdW5jZXJ0YWluVG9rZW5zPzogeyB0OiBzdHJpbmc7IGxwOiBudW1iZXI7IG86IG51bWJlciB9W107XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dwcm9iUmVwZXRpdGlvbj86IGJvb2xlYW47XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHwgdW5kZWZpbmVkID0gcG9sbFJlc3BvbnNlLmNvbmZpZGVuY2U7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzTG93Q29uZmlkZW5jZSA9IGNvbmZpZGVuY2U/Lm1lYW4gIT0gbnVsbCAmJiBjb25maWRlbmNlLm1lYW4gPCBMT1dfQ09ORklERU5DRV9USFJFU0hPTEQ7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzTG93Q29uZmlkZW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgIGxvd0NvbmZpZGVuY2VFbnRyaWVzLmFkZChhc3Npc3RhbnRFbnRyeSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoc2hvd1VuY2VydGFpblRva2VucyAmJiBjb25maWRlbmNlPy51bmNlcnRhaW5Ub2tlbnM/Lmxlbmd0aCAmJiBzdHJlYW1CdWJibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBsZXQgbWFya2VkVGV4dCA9IGxhc3RUZXh0O1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvcnRlZCA9IFsuLi5jb25maWRlbmNlLnVuY2VydGFpblRva2Vuc10uc29ydChcbiAgICAgICAgICAgICAgICAgICAgICAgIChhOiB7IG86IG51bWJlciB9LCBiOiB7IG86IG51bWJlciB9KSA9PiBiLm8gLSBhLm8sXG4gICAgICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdG9rIG9mIHNvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZW5kID0gdG9rLm8gKyB0b2sudC5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbmQgPD0gbWFya2VkVGV4dC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VkVGV4dCA9IGAke21hcmtlZFRleHQuc3Vic3RyaW5nKDAsIHRvay5vKX1cXHVGRkY5XFx1RkZGQiR7dG9rLmxwLnRvRml4ZWQoMil9XFx1RkZGQyR7bWFya2VkVGV4dC5zdWJzdHJpbmcodG9rLm8sIGVuZCl9XFx1RkZGQSR7bWFya2VkVGV4dC5zdWJzdHJpbmcoZW5kKX1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgIGxldCBodG1sID0gbGlua2lmeVVybHMobWFya2VkVGV4dCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICBodG1sID0gaHRtbC5yZXBsYWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgL1xcdUZGRjlcXHVGRkZCKFteXFx1RkZGQ10qKVxcdUZGRkMvZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIChfLCBscCkgPT4gYDxzcGFuIGNsYXNzPVwiTExBTUFfVW5jZXJ0YWluU3BhblwiIHRpdGxlPVwiJHt1bmNlcnRhaW5UZXh0fSAoJHtscH0pXCI+YCxcbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xcdUZGRkEvZywgXCI8L3NwYW4+XCIpO1xuICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbUJ1YmJsZS5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gQ29uZmlkZW5jZTogc2VsZWN0aXZlIGNhY2hpbmcgKyB1bmNlcnRhaW4gdG9rZW4gaGlnaGxpZ2h0aW5nXG4gICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gQ29sbGFwc2UgcmVhc29uaW5nLCBpZiBhdmFpbGFibGUuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRoaW5raW5nVGV4dDogc3RyaW5nIHwgdW5kZWZpbmVkID0gcG9sbFJlc3BvbnNlLnRoaW5raW5nO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlua2luZ1RleHQgJiYgc3RyZWFtQnViYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGV0YWlscyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkZXRhaWxzXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgZGV0YWlscy5jbGFzc05hbWUgPSBcIkxMQU1BX0NoYXRfVGhpbmtpbmdcIjtcblxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1bW1hcnkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3VtbWFyeVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBoYXNTZWFyY2hTb3VyY2VzID0gL1xcdUQ4M0RcXHVERDBEIFNlYXJjaGluZyB0aGUgd2ViLy50ZXN0KHRoaW5raW5nVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgaGFzUmVhbFJlYXNvbmluZyA9IHRoaW5raW5nVGV4dC5pbmNsdWRlcyhcIi0tLVxcblxcblxcdUQ4M0RcXHVERDBEXCIpIHx8ICFoYXNTZWFyY2hTb3VyY2VzO1xuXG4gICAgICAgICAgICAgICAgICAgICAgc3VtbWFyeS50ZXh0Q29udGVudCA9IGhhc1JlYWxSZWFzb25pbmcgPyBpMThuU2hvd1JlYXNvbmluZ0xhYmVsIDogaTE4blNob3dTb3VyY2VzTGFiZWw7XG4gICAgICAgICAgICAgICAgICAgICAgZGV0YWlscy5hcHBlbmRDaGlsZChzdW1tYXJ5KTtcblxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICBwcmUuY2xhc3NOYW1lID0gXCJMTEFNQV9DaGF0X1RoaW5raW5nQ29udGVudFwiO1xuICAgICAgICAgICAgICAgICAgICAgIHByZS5pbm5lckhUTUwgPSBsaW5raWZ5VXJscyh0aGlua2luZ1RleHQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgZGV0YWlscy5hcHBlbmRDaGlsZChwcmUpO1xuICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbUJ1YmJsZS5hcHBlbmRDaGlsZChkZXRhaWxzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIENvbGxhcHNlIHJlYXNvbmluZywgaWYgYXZhaWxhYmxlLlxuICAgICAgICAgICAgICAgICAgICBpZiAoYWlIaW50VGV4dCAmJiBzdHJlYW1CdWJibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBBSV9MTEFNQV9DSEFULmF0dGFjaEFpSGludFRvQnViYmxlKHN0cmVhbUJ1YmJsZSwgYWlIaW50VGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBDcmVhdGUgTW9kZWwtVHlwZSBpbmRpY2F0b3IgYmFkZ2UuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vZGVsVHlwZTogc3RyaW5nIHwgdW5kZWZpbmVkID0gcG9sbFJlc3BvbnNlLm1vZGVsVHlwZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpbmtpbmdDaGVja2JveCAmJiBtb2RlbFR5cGUgJiYgc3RyZWFtQnViYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgYmFkZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgIGJhZGdlLmNsYXNzTmFtZSA9IFwiTExBTUFfTW9kZWxCYWRnZVwiO1xuICAgICAgICAgICAgICAgICAgICAgIGJhZGdlLnRleHRDb250ZW50ID0gbW9kZWxUeXBlID09PSBcInRoaW5raW5nXCIgPyBcIlxcdUQ4M0RcXHVEQ0ExXCIgOiBcIlxcdTI2QTFcIjtcbiAgICAgICAgICAgICAgICAgICAgICBiYWRnZS50aXRsZSA9IG1vZGVsVHlwZSA9PT0gXCJ0aGlua2luZ1wiID8gXCJUaGlua2luZyBtb2RlbFwiIDogXCJGYXN0IG1vZGVsXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgICBzdHJlYW1CdWJibGUuaW5zZXJ0QmVmb3JlKGJhZGdlLCBzdHJlYW1CdWJibGUuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBDcmVhdGUgTW9kZWwtVHlwZSBpbmRpY2F0b3IgYmFkZ2UuXG4gICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gQWRkIGNvcHkgYnV0dG9uIHRvIHJlc3BvbnNlIGJ1YmJsZS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmVhbUJ1YmJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlVGV4dCA9IGxhc3RUZXh0O1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlYXNvbmluZ1RleHQ6IHN0cmluZyA9IHRoaW5raW5nVGV4dCB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvb2xiYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgdG9vbGJhci5jbGFzc05hbWUgPSBcIkxMQU1BX0NoYXRfQnViYmxlVG9vbGJhciBMTEFNQV9DaGF0X0J1YmJsZVRvb2xiYXItLXJpZ2h0XCI7XG5cbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3B5QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgIGNvcHlCdG4udHlwZSA9IFwiYnV0dG9uXCI7XG4gICAgICAgICAgICAgICAgICAgICAgY29weUJ0bi5jbGFzc05hbWUgPSBcIkxMQU1BX0NoYXRfVG9vbGJhckJ0blwiO1xuICAgICAgICAgICAgICAgICAgICAgIGNvcHlCdG4udGl0bGUgPSBcIkNvcHkgcmVzcG9uc2VcIjtcbiAgICAgICAgICAgICAgICAgICAgICBjb3B5QnRuLmlubmVySFRNTCA9IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiB3aWR0aD1cIjE0XCIgaGVpZ2h0PVwiMTRcIiBmaWxsPVwiY3VycmVudENvbG9yXCI+PHBhdGggZD1cIk0xNiAxSDRhMiAyIDAgMCAwLTIgMnYxNGgyVjNoMTJWMXptMyA0SDhhMiAyIDAgMCAwLTIgMnYxNGEyIDIgMCAwIDAgMiAyaDExYTIgMiAwIDAgMCAyLTJWN2EyIDIgMCAwIDAtMi0yem0wIDE2SDhWN2gxMXYxNHpcIi8+PC9zdmc+YDtcbiAgICAgICAgICAgICAgICAgICAgICBjb3B5QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbWQgPSBgIyMgJHtpMThuQ29weVJlc3BvbnNlTGFiZWx9XFxuXFxuJHtyZXNwb25zZVRleHR9YDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlYXNvbmluZ1RleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbWQgKz0gYFxcblxcbi0tLVxcblxcbiMjICR7aTE4bkNvcHlSZWFzb25pbmdMYWJlbH1cXG5cXG4ke3JlYXNvbmluZ1RleHR9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQobWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtQnViYmxlLmNsYXNzTGlzdC5yZW1vdmUoXCJMTEFNQV9mbGFzaFwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdm9pZCBzdHJlYW1CdWJibGUub2Zmc2V0V2lkdGg7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbUJ1YmJsZS5jbGFzc0xpc3QuYWRkKFwiTExBTUFfZmxhc2hcIik7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICB0b29sYmFyLmFwcGVuZENoaWxkKGNvcHlCdG4pO1xuICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbUJ1YmJsZS5hcHBlbmRDaGlsZCh0b29sYmFyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIEFkZCBjb3B5IGJ1dHRvbiB0byByZXNwb25zZSBidWJibGUuXG4gICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gTG93LWNvbmZpZGVuY2Ugd2FybmluZyArIFJldGhpbmsgYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRNb2RlbFR5cGU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHBvbGxSZXNwb25zZS5tb2RlbFR5cGU7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzTG93Q29uZmlkZW5jZSAmJiBzdHJlYW1CdWJibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCB3YXJuaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgIHdhcm5pbmcuY2xhc3NOYW1lID0gXCJMTEFNQV9DaGF0X0NvbmZpZGVuY2VXYXJuaW5nXCI7XG4gICAgICAgICAgICAgICAgICAgICAgd2FybmluZy50ZXh0Q29udGVudCA9IGBcXHUyNkEwICR7bG93Q29uZmlkZW5jZVRleHR9YDtcblxuICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlua2luZ0NoZWNrYm94ICYmICF0aGlua2luZ0NoZWNrYm94LmRpc2FibGVkICYmIGN1cnJlbnRNb2RlbFR5cGUgIT09IFwidGhpbmtpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmV0aGlua1F1ZXN0aW9uID0gbWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFJvdyA9IHN0cmVhbUJ1YmJsZS5wYXJlbnRFbGVtZW50O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRhcmdldFJvdykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXRoaW5rQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0aGlua0J0bi50eXBlID0gXCJidXR0b25cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldGhpbmtCdG4uY2xhc3NOYW1lID0gXCJMTEFNQV9DaGF0X1JldGhpbmtCdG5cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldGhpbmtCdG4udGV4dENvbnRlbnQgPSBgXFx1RDgzRFxcdURDQTEgJHtyZXRoaW5rQnV0dG9uVGV4dH1gO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXRoaW5rQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldGhpbmtCdG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXRoaW5rQnRuLnRleHRDb250ZW50ID0gXCJcXHUyM0YzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gQ3JlYXRlIHJldGhpbmsgdGhpbmtpbmcgYnViYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJldGhpbmtSb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldGhpbmtSb3cuY2xhc3NOYW1lID0gXCJMTEFNQV9DaGF0X1JvdyBMTEFNQV9DaGF0X1Jvdy0tbGxhbWFcIjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXRoaW5rQnViYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXRoaW5rQnViYmxlLmNsYXNzTmFtZSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJMTEFNQV9DaGF0X0J1YmJsZSBMTEFNQV9DaGF0X0J1YmJsZS0tbGxhbWEgTExBTUFfQ2hhdF9CdWJibGUtLXRoaW5raW5nXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldGhpbmtCdWJibGUuaW5uZXJIVE1MID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cIkNvZEJpTG9hZGVyX1NwaW5uZXIgTExBTUFfVGhpbmtpbmdTcGlubmVyXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiTExBTUFfVGhpbmtpbmdMYWJlbFwiPlJldGhpbmtpbmdcXHUyMDI2PC9zcGFuPic7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0aGlua1Jvdy5hcHBlbmRDaGlsZChyZXRoaW5rQnViYmxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Um93Lmluc2VydEFkamFjZW50RWxlbWVudChcImFmdGVyZW5kXCIsIHJldGhpbmtSb3cpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjaGF0Q29udGFpbmVyLnNjcm9sbFRvcCA9IGNoYXRDb250YWluZXIuc2Nyb2xsSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIENyZWF0ZSByZXRoaW5rIHRoaW5raW5nIGJ1YmJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIFNlbmQgcmV0aGluayByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJldGhpbmtIZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiWC1RdWVzdGlvbi1jaGF0XCI6IHV0ZjhUb0Jhc2U2NChyZXRoaW5rUXVlc3Rpb24ucmVwbGFjZSgvW1xcclxcbl0rL2csIFwiIFwiKS50cmltKCkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiWC1TdHJlYW1cIjogXCJ0cnVlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJYLVNlc3Npb24tSWRcIjogcGFnZVNlc3Npb25JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlgtQ2hhdC1IaXN0b3J5XCI6IHV0ZjhUb0Jhc2U2NChKU09OLnN0cmluZ2lmeShjb21wYWN0SGlzdG9yeSgpKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJYLVRoaW5raW5nXCI6IFwidHJ1ZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZUxhbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXRoaW5rSGVhZGVyc1tcIlgtRm9yY2VkLUxhbmd1YWdlXCJdID0gcmVzcG9uc2VMYW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGVjaWFsaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0aGlua0hlYWRlcnNbXCJYLVNwZWNpYWxpc3RcIl0gPSBzcGVjaWFsaXN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlYXJjaENoZWNrYm94KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0aGlua0hlYWRlcnNbXCJYLVNlYXJjaFwiXSA9IHNlYXJjaENoZWNrYm94LmNoZWNrZWQgPyBcInRydWVcIiA6IFwiZmFsc2VcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlsdGVyUmVzdWx0cyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0aGlua0hlYWRlcnNbXCJYLUZpbHRlci1SZXN1bHRzXCJdID0gZmlsdGVyUmVzdWx0cyA/IFwidHJ1ZVwiIDogXCJmYWxzZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGAke3dpbmRvdy5jb2RiaS5iYXNlVVJMfXBsdWdpbj9uYW1lPUNvZEJpX0FJX0xMQU1BX1NURGAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogbmV3IEZvcm1EYXRhKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlZm9yZVNlbmQ6ICh4aHIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaCBvZiBPYmplY3Qua2V5cyhyZXRoaW5rSGVhZGVycykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoaCwgcmV0aGlua0hlYWRlcnNbaF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogKHJldGhpbmtSZXNwKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmV0aGlua1Jlc3AuZXJyb3IgfHwgIXJldGhpbmtSZXNwLnN0cmVhbUlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldGhpbmtCdWJibGUudGV4dENvbnRlbnQgPSBgXFx1MjZBMCAke3JldGhpbmtSZXNwLmVycm9yIHx8IFwiTm8gc3RyZWFtIHJlY2VpdmVkXCJ9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0aGlua0J1YmJsZS5jbGFzc0xpc3QuYWRkKFwiTExBTUFfQ2hhdF9CdWJibGUtLWVycm9yXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXRoaW5rQnViYmxlLmNsYXNzTGlzdC5yZW1vdmUoXCJMTEFNQV9DaGF0X0J1YmJsZS0tdGhpbmtpbmdcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmV0aGlua1RleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBQb2xsIHJldGhpbmsgc3RyZWFtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXRoaW5rSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBgJHt3aW5kb3cuY29kYmkuYmFzZVVSTH1wbHVnaW4/bmFtZT1Db2RCaV9BSV9MTEFNQV9TVERgLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUE9TVFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZWZvcmVTZW5kOiAoeGhyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIlgtU3RyZWFtLVBvbGxcIiwgcmV0aGlua1Jlc3Auc3RyZWFtSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogKHBvbGwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHR4dCA9IHR5cGVvZiBwb2xsLnRleHQgPT09IFwic3RyaW5nXCIgPyBwb2xsLnRleHQgOiBcIlwiO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHh0Lmxlbmd0aCA+IHJldGhpbmtUZXh0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXRoaW5rVGV4dCA9IHR4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0aGlua0J1YmJsZS5jbGFzc0xpc3QucmVtb3ZlKFwiTExBTUFfQ2hhdF9CdWJibGUtLXRoaW5raW5nXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXRoaW5rQnViYmxlLmlubmVySFRNTCA9IGxpbmtpZnlVcmxzKHR4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYXRDb250YWluZXIuc2Nyb2xsVG9wID0gY2hhdENvbnRhaW5lci5zY3JvbGxIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb2xsLmRvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChyZXRoaW5rSW50ZXJ2YWwpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb2xsLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0aGlua0J1YmJsZS50ZXh0Q29udGVudCA9IGBcXHUyNkEwICR7cG9sbC5lcnJvcn1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldGhpbmtCdWJibGUuY2xhc3NMaXN0LmFkZChcIkxMQU1BX0NoYXRfQnViYmxlLS1lcnJvclwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXRoaW5rVGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkhpc3RvcnkucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb2xlOiBcImFzc2lzdGFudFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogcmV0aGlua1RleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFkZ2UuY2xhc3NOYW1lID0gXCJMTEFNQV9Nb2RlbEJhZGdlXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFkZ2UudGV4dENvbnRlbnQgPSBcIlxcdUQ4M0RcXHVEQ0ExXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFkZ2UudGl0bGUgPSBcIlRoaW5raW5nIG1vZGVsIChyZXRoaW5rKVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldGhpbmtCdWJibGUuaW5zZXJ0QmVmb3JlKGJhZGdlLCByZXRoaW5rQnViYmxlLmZpcnN0Q2hpbGQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFpSGludFRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFJX0xMQU1BX0NIQVQuYXR0YWNoQWlIaW50VG9CdWJibGUocmV0aGlua0J1YmJsZSwgYWlIaW50VGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmV0aGlua1RoaW5raW5nOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBwb2xsLnRoaW5raW5nO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJldGhpbmtUaGlua2luZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRldGFpbHNcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldC5jbGFzc05hbWUgPSBcIkxMQU1BX0NoYXRfVGhpbmtpbmdcIjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3VtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN1bW1hcnlcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1bS50ZXh0Q29udGVudCA9IGkxOG5TaG93UmVhc29uaW5nTGFiZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXQuYXBwZW5kQ2hpbGQoc3VtKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlLmNsYXNzTmFtZSA9IFwiTExBTUFfQ2hhdF9UaGlua2luZ0NvbnRlbnRcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZS5pbm5lckhUTUwgPSBsaW5raWZ5VXJscyhyZXRoaW5rVGhpbmtpbmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0LmFwcGVuZENoaWxkKHByZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXRoaW5rQnViYmxlLmFwcGVuZENoaWxkKGRldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChyZXRoaW5rSW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0aGlua0J1YmJsZS50ZXh0Q29udGVudCA9IFwiXFx1MjZBMCBSZXRoaW5rIHBvbGxpbmcgZmFpbGVkLlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0aGlua0J1YmJsZS5jbGFzc0xpc3QuYWRkKFwiTExBTUFfQ2hhdF9CdWJibGUtLWVycm9yXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0aGlua0J1YmJsZS5jbGFzc0xpc3QucmVtb3ZlKFwiTExBTUFfQ2hhdF9CdWJibGUtLXRoaW5raW5nXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMjUwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gUG9sbCByZXRoaW5rIHN0cmVhbVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldGhpbmtCdWJibGUudGV4dENvbnRlbnQgPSBcIlxcdTI2QTAgUmV0aGluayByZXF1ZXN0IGZhaWxlZC5cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldGhpbmtCdWJibGUuY2xhc3NMaXN0LmFkZChcIkxMQU1BX0NoYXRfQnViYmxlLS1lcnJvclwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldGhpbmtCdWJibGUuY2xhc3NMaXN0LnJlbW92ZShcIkxMQU1BX0NoYXRfQnViYmxlLS10aGlua2luZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBTZW5kIHJldGhpbmsgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHdhcm5pbmcuYXBwZW5kQ2hpbGQocmV0aGlua0J0bik7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgc3RyZWFtQnViYmxlLmFwcGVuZENoaWxkKHdhcm5pbmcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gTG93LWNvbmZpZGVuY2Ugd2FybmluZyArIFJldGhpbmsgYnV0dG9uXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXBsYWNlVGhpbmtpbmcoXCJcXHUyNkEwIE5vIHJlc3BvbnNlIHdhcyBnZW5lcmF0ZWQuIFBsZWFzZSB0cnkgYWdhaW4uXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb252ZXJzYXRpb25IaXN0b3J5LnBvcCgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBBdXRvLW1haWwgZm9yd2FyZCAoY2xpZW50LWRyaXZlbilcbiAgICAgICAgICAgICAgICAgIGlmIChtYWlsRm9yd2FyZENoZWNrYm94Py5jaGVja2VkICYmIG1haWxBZGRyZXNzSW5wdXQ/LnZhbHVlLnRyaW0oKSAmJiBsYXN0VGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYWlsVG8gPSBtYWlsQWRkcmVzc0lucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWFpbFN1YmplY3QgPSBtZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1tcXHJcXG5dKy9nLCBcIiBcIilcbiAgICAgICAgICAgICAgICAgICAgICAudHJpbSgpXG4gICAgICAgICAgICAgICAgICAgICAgLnN1YnN0cmluZygwLCAxMjApO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0aGlua2luZ0NvbnRlbnQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHBvbGxSZXNwb25zZS50aGlua2luZztcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1haWxCb2R5ID0gbGFzdFRleHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaW5raW5nQ29udGVudCkge1xuICAgICAgICAgICAgICAgICAgICAgIG1haWxCb2R5ICs9IGBcXG5cXG4tLS1cXG5SZWFzb25pbmc6XFxuJHt0aGlua2luZ0NvbnRlbnR9YDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYWlsSGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgICAgICAgICAgICAgICAgICBcIlgtTWFpbC1Gb3J3YXJkXCI6IHV0ZjhUb0Jhc2U2NChtYWlsVG8pLFxuICAgICAgICAgICAgICAgICAgICAgIFwiWC1NYWlsLVN1YmplY3RcIjogdXRmOFRvQmFzZTY0KG1haWxTdWJqZWN0KSxcbiAgICAgICAgICAgICAgICAgICAgICBcIlgtTWFpbC1Cb2R5XCI6IHV0ZjhUb0Jhc2U2NChtYWlsQm9keSksXG4gICAgICAgICAgICAgICAgICAgICAgXCJYLVNlc3Npb24tSWRcIjogcGFnZVNlc3Npb25JZCxcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICAgIHVybDogYCR7d2luZG93LmNvZGJpLmJhc2VVUkx9cGx1Z2luP25hbWU9Q29kQmlfQUlfTExBTUFfU1REYCxcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcbiAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBuZXcgRm9ybURhdGEoKSxcbiAgICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgYmVmb3JlU2VuZDogKHhocikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBoIG9mIE9iamVjdC5rZXlzKG1haWxIZWFkZXJzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihoLCBtYWlsSGVhZGVyc1toXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiAobWFpbFJlc3ApID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYWlsUmVzcC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFwcGVuZEJ1YmJsZShgXFx1MjcwOVxcdUZFMEYgXFx1MjE5MiAke21haWxUb30gXFx1MjcwNWAsIFwic3lzdGVtXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXBwZW5kQnViYmxlKGBcXHUyNkEwIFxcdTI3MDlcXHVGRTBGIFxcdTIxOTIgJHttYWlsVG99IFxcdTI3NEMgJHttYWlsUmVzcC5lcnJvciA/PyBcIlwifWAsIFwic3lzdGVtXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGVuZEJ1YmJsZShgXFx1MjZBMCBcXHUyNzA5XFx1RkUwRiBcXHUyMTkyICR7bWFpbFRvfSBcXHUyNzRDIFJlcXVlc3QgZmFpbGVkYCwgXCJzeXN0ZW1cIik7XG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIEF1dG8tbWFpbCBmb3J3YXJkIChjbGllbnQtZHJpdmVuKVxuXG4gICAgICAgICAgICAgICAgICBmaW5pc2hTdHJlYW1pbmcoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGVycm9yOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgcmVwbGFjZVRoaW5raW5nKGAke21vZGVsTGFiZWx9OiBcXHUyNkEwIFN0cmVhbSBwb2xsaW5nIGZhaWxlZC5gKTtcbiAgICAgICAgICAgICAgICBmaW5pc2hTdHJlYW1pbmcoKTtcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sIDI1MCk7XG4gICAgICAgIH07XG4gICAgICAgIC8vICNlbmRyZWdpb24gUG9sbCBhIHN0cmVhbWluZyBzZXNzaW9uIHVudGlsIGRvbmUuXG4gICAgICAgIC8vICNyZWdpb24gU2VuZCBBSkFYIHJlcXVlc3QgdG8gYmFja2VuZC5cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICB1cmw6IGAke3dpbmRvdy5jb2RiaS5iYXNlVVJMfXBsdWdpbj9uYW1lPUNvZEJpX0FJX0xMQU1BX1NURGAsXG4gICAgICAgICAgdHlwZTogXCJQT1NUXCIsXG4gICAgICAgICAgZGF0YTogZm9ybURhdGEsXG4gICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgIGJlZm9yZVNlbmQ6ICh4aHIpID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaGVhZGVyTmFtZSBvZiBPYmplY3Qua2V5cyhoZWFkZXJzKSkge1xuICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXJOYW1lLCBoZWFkZXJzW2hlYWRlck5hbWVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHN1Y2Nlc3M6IChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9yKSB7XG4gICAgICAgICAgICAgIHJlcGxhY2VUaGlua2luZyhgJHttb2RlbExhYmVsfTogXFx1MjZBMCAke3Jlc3BvbnNlLmVycm9yfWApO1xuICAgICAgICAgICAgICBjb252ZXJzYXRpb25IaXN0b3J5LnBvcCgpO1xuICAgICAgICAgICAgICBmaW5pc2hTdHJlYW1pbmcoKTtcblxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdHJlYW1JZCkge1xuICAgICAgICAgICAgICBhY3RpdmVTdHJlYW1JZCA9IHJlc3BvbnNlLnN0cmVhbUlkO1xuXG4gICAgICAgICAgICAgIGlmIChzdG9wQnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgc3RvcEJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcIklORk9cIiwgYFN0cmVhbSBzdGFydGVkOiAke3Jlc3BvbnNlLnN0cmVhbUlkfWAsIFwiQUkgLyBMTEFNQSAvIENIQVRcIik7XG5cbiAgICAgICAgICAgICAgcG9sbFN0cmVhbShyZXNwb25zZS5zdHJlYW1JZCk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gI3JlZ2lvbiBFcnJvci1JbmRpY2F0b3JzXG4gICAgICAgICAgICBjb25zdCBmaWxlS2V5cyA9IE9iamVjdC5rZXlzKHJlc3BvbnNlKTtcblxuICAgICAgICAgICAgaWYgKGZpbGVLZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICByZXBsYWNlVGhpbmtpbmcoYCR7bW9kZWxMYWJlbH06IChubyByZXNwb25zZSByZWNlaXZlZClgKTtcbiAgICAgICAgICAgICAgZmluaXNoU3RyZWFtaW5nKCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGFuc3dlclRleHQ6IHN0cmluZztcbiAgICAgICAgICAgIGlmIChmaWxlS2V5cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgY29uc3QgZmlsZUFuc3dlcnMgPSByZXNwb25zZVtmaWxlS2V5c1swXV07XG4gICAgICAgICAgICAgIGNvbnN0IGFuc3dlcktleXMgPSBPYmplY3Qua2V5cyhmaWxlQW5zd2VycyB8fCB7fSk7XG5cbiAgICAgICAgICAgICAgYW5zd2VyVGV4dCA9XG4gICAgICAgICAgICAgICAgZmlsZUFuc3dlcnM/LmNoYXQgPz8gKGFuc3dlcktleXMubGVuZ3RoID4gMCA/IFN0cmluZyhmaWxlQW5zd2Vyc1thbnN3ZXJLZXlzWzBdXSkgOiBcIihubyBhbnN3ZXIpXCIpO1xuXG4gICAgICAgICAgICAgIGNvbnN0IHNlYXJjaE9uMSA9IHNlYXJjaENoZWNrYm94ID8gc2VhcmNoQ2hlY2tib3guY2hlY2tlZCA6IHRydWU7XG5cbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uSGlzdG9yeS5wdXNoKHtcbiAgICAgICAgICAgICAgICByb2xlOiBcImFzc2lzdGFudFwiLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHNlYXJjaE9uMSA/IHN0cmlwTGlua3NGb3JIaXN0b3J5KGFuc3dlclRleHQpIDogYW5zd2VyVGV4dCxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZpbGVLZXkgb2YgZmlsZUtleXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlQW5zd2VycyA9IHJlc3BvbnNlW2ZpbGVLZXldO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFuc3dlcktleXMgPSBPYmplY3Qua2V5cyhmaWxlQW5zd2VycyB8fCB7fSk7XG4gICAgICAgICAgICAgICAgY29uc3QgYW5zd2VyID1cbiAgICAgICAgICAgICAgICAgIGZpbGVBbnN3ZXJzPy5jaGF0ID8/IChhbnN3ZXJLZXlzLmxlbmd0aCA+IDAgPyBTdHJpbmcoZmlsZUFuc3dlcnNbYW5zd2VyS2V5c1swXV0pIDogXCIobm8gYW5zd2VyKVwiKTtcbiAgICAgICAgICAgICAgICBwYXJ0cy5wdXNoKGBcXHV7MUY0QzR9ICR7ZmlsZUtleX06XFxuJHthbnN3ZXJ9YCk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBhbnN3ZXJUZXh0ID0gcGFydHMuam9pbihcIlxcblxcblwiKTtcblxuICAgICAgICAgICAgICBjb25zdCBzZWFyY2hPbjIgPSBzZWFyY2hDaGVja2JveCA/IHNlYXJjaENoZWNrYm94LmNoZWNrZWQgOiB0cnVlO1xuXG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkhpc3RvcnkucHVzaCh7XG4gICAgICAgICAgICAgICAgcm9sZTogXCJhc3Npc3RhbnRcIixcbiAgICAgICAgICAgICAgICBjb250ZW50OiBzZWFyY2hPbjIgPyBzdHJpcExpbmtzRm9ySGlzdG9yeShhbnN3ZXJUZXh0KSA6IGFuc3dlclRleHQsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBFcnJvci1JbmRpY2F0b3JzXG4gICAgICAgICAgICAvLyBSZXBsYWNlIHRoaW5raW5nIGJ1YmJsZSB3aXRoIHRoZSBhbnN3ZXJcbiAgICAgICAgICAgIGlmICh0aGlua2luZ0J1YmJsZSkge1xuICAgICAgICAgICAgICB0aGlua2luZ0J1YmJsZS5wYXJlbnRFbGVtZW50Py5yZW1vdmUoKTtcblxuICAgICAgICAgICAgICB0aGlua2luZ0J1YmJsZSA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGFuc3dlckJ1YmJsZSA9IGFwcGVuZEJ1YmJsZShhbnN3ZXJUZXh0LCBcImxsYW1hXCIpO1xuXG4gICAgICAgICAgICBpZiAoYWlIaW50VGV4dCkge1xuICAgICAgICAgICAgICBBSV9MTEFNQV9DSEFULmF0dGFjaEFpSGludFRvQnViYmxlKGFuc3dlckJ1YmJsZSwgYWlIaW50VGV4dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZpbmlzaFN0cmVhbWluZygpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZXJyb3I6ICh4aHIsIHN0YXR1cywgZXJyb3IpID0+IHtcbiAgICAgICAgICAgIHJlcGxhY2VUaGlua2luZyhgJHttb2RlbExhYmVsfTogXFx1MjZBMCBSZXF1ZXN0IGZhaWxlZCAoJHtzdGF0dXN9KTogJHtlcnJvcn1gKTtcblxuICAgICAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcIkVSUk9SXCIsIGBDaGF0IHJlcXVlc3QgZmFpbGVkOiAke3N0YXR1c30gXHUyMDE0ICR7ZXJyb3J9YCwgXCJBSSAvIExMQU1BIC8gQ0hBVFwiKTtcblxuICAgICAgICAgICAgY29udmVyc2F0aW9uSGlzdG9yeS5wb3AoKTtcblxuICAgICAgICAgICAgZmluaXNoU3RyZWFtaW5nKCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIC8vICNlbmRyZWdpb24gU2VuZCBBSkFYIHJlcXVlc3QgdG8gYmFja2VuZC5cbiAgICAgIH0gY2F0Y2ggKFgpIHtcbiAgICAgICAgcmVwbGFjZVRoaW5raW5nKGAke21vZGVsTGFiZWx9OiBcXHUyNkEwIEVycm9yOiAke1h9YCk7XG5cbiAgICAgICAgY29udmVyc2F0aW9uSGlzdG9yeS5wb3AoKTtcblxuICAgICAgICBpc0J1c3kgPSBmYWxzZTtcbiAgICAgICAgc2VuZEJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChtaWNCdXR0b24pIHtcbiAgICAgICAgICBtaWNCdXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcImRpc2FibGVkXCIgaW4gY2hhdElucHV0KSB7XG4gICAgICAgICAgKGNoYXRJbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICAvLyAjZW5kcmVnaW9uIEVIIC8gU2VuZCBtZXNzYWdlXG4gICAgLy8gI3JlZ2lvbiBDb25uZWN0IGV2ZW50IGxpc3RlbmVycy5cbiAgICBzZW5kQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBzZW5kTWVzc2FnZSgpO1xuICAgIH0pO1xuICAgIC8vICNyZWdpb24gU3RvcCBidXR0b24uXG4gICAgaWYgKHN0b3BCdXR0b24pIHtcbiAgICAgIHN0b3BCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xuXG4gICAgICBzdG9wQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGlmICghYWN0aXZlU3RyZWFtSWQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpZFRvU3RvcCA9IGFjdGl2ZVN0cmVhbUlkO1xuXG4gICAgICAgIHdpbmRvdy5jb2RiaS5sb2coXCJJTkZPXCIsIGBTdG9wIHJlcXVlc3RlZCBmb3Igc3RyZWFtOiAke2lkVG9TdG9wfWAsIFwiQUkgLyBMTEFNQSAvIENIQVRcIik7XG5cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICB1cmw6IGAke3dpbmRvdy5jb2RiaS5iYXNlVVJMfXBsdWdpbj9uYW1lPUNvZEJpX0FJX0xMQU1BX1NURGAsXG4gICAgICAgICAgdHlwZTogXCJQT1NUXCIsXG4gICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgIGJlZm9yZVNlbmQ6ICh4aHIpID0+IHtcbiAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiWC1TdHJlYW0tUG9sbFwiLCBpZFRvU3RvcCk7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIlgtU3RyZWFtLVN0b3BcIiwgXCJ0cnVlXCIpO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gU3RvcCBidXR0b24uXG4gICAgLy8gI3JlZ2lvbiBDaGF0LUlucHV0LlxuICAgIGNoYXRJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoKGV2ZW50OiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgICBjb25zdCBpc1RleHRhcmVhID0gY2hhdElucHV0IGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudDtcblxuICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiICYmIChpc1RleHRhcmVhID8gZXZlbnQuY3RybEtleSA6ICFldmVudC5zaGlmdEtleSkpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgc2VuZE1lc3NhZ2UoKTtcbiAgICAgIH1cbiAgICB9KSBhcyBFdmVudExpc3RlbmVyKTtcbiAgICAvLyAjZW5kcmVnaW9uIENoYXQtSW5wdXQuXG4gICAgLy8gI2VuZHJlZ2lvbiBDb25uZWN0IGV2ZW50IGxpc3RlbmVycy5cbiAgICAvLyAjcmVnaW9uIE1vZGVsIEF2YWlsYWJpbGl0eS1DaGVjay5cbiAgICAvLyBEaXNhYmxlIGlucHV0IGFuZCBzZW5kIGJ1dHRvbiB1bnRpbCB0aGUgbW9kZWwgaXMgY29uZmlybWVkIHJlYWR5XG4gICAgY2hhdElucHV0LmRpc2FibGVkID0gdHJ1ZTtcbiAgICBzZW5kQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcbiAgICBzZW5kQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcblxuICAgIGlmIChtaWNCdXR0b24pIHtcbiAgICAgIG1pY0J1dHRvbi5kaXNhYmxlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgY29uc3Qgc3RhdHVzQnViYmxlID0gYXBwZW5kQnViYmxlKFwiXCIsIFwic3lzdGVtXCIpO1xuXG4gICAgc3RhdHVzQnViYmxlLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwiQ29kQmlMb2FkZXJfU3Bpbm5lciBMTEFNQV9UaGlua2luZ1NwaW5uZXJcIj48L2Rpdj48c3BhbiBjbGFzcz1cIkxMQU1BX0hlYWx0aExhYmVsXCI+TG9hZGluZyBBSSBtb2RlbFxcdTIwMjY8L3NwYW4+YDtcblxuICAgIHN0YXR1c0J1YmJsZS5jbGFzc0xpc3QuYWRkKFwiTExBTUFfQ2hhdF9CdWJibGUtLXRoaW5raW5nXCIpO1xuXG4gICAgY29uc3Qgc2V0SGVhbHRoTGFiZWwgPSAodGV4dDogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCBsYWJlbCA9IHN0YXR1c0J1YmJsZS5xdWVyeVNlbGVjdG9yKFwiLkxMQU1BX0hlYWx0aExhYmVsXCIpO1xuXG4gICAgICBpZiAobGFiZWwpIHtcbiAgICAgICAgbGFiZWwudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCB3ZWxjb21lVGV4dCA9XG4gICAgICB0b0xvYWQud2VsY29tZXRleHQgIT0gbnVsbCA/IFN0cmluZyh0b0xvYWQud2VsY29tZXRleHQpIDogXCJDaGF0IHJlYWR5LiBBdHRhY2ggZmlsZShzKSBhbmQgdHlwZSB5b3VyIHF1ZXN0aW9uLlwiO1xuXG4gICAgY29uc3Qgd2FpdGluZ1RleHQgPSB0b0xvYWQud2FpdGluZ3RleHQgIT0gbnVsbCA/IFN0cmluZyh0b0xvYWQud2FpdGluZ3RleHQpIDogXCJXYWl0aW5nIGZvciBBSSBzZXJ2ZXJcXHUyMDI2XCI7XG5cbiAgICBjb25zdCBsb3dDb25maWRlbmNlVGV4dCA9IHRvTG9hZC5sb3djb25maWRlbmNldGV4dCAhPSBudWxsID8gU3RyaW5nKHRvTG9hZC5sb3djb25maWRlbmNldGV4dCkgOiBcIkxvdyBDb25maWRlbmNlXCI7XG5cbiAgICBjb25zdCByZXRoaW5rQnV0dG9uVGV4dCA9IHRvTG9hZC5yZXRoaW5rYnV0dG9udGV4dCAhPSBudWxsID8gU3RyaW5nKHRvTG9hZC5yZXRoaW5rYnV0dG9udGV4dCkgOiBcIlJldGhpbmtcIjtcblxuICAgIGNvbnN0IHVuY2VydGFpblRleHQgPSB0b0xvYWQudW5jZXJ0YWludGV4dCAhPSBudWxsID8gU3RyaW5nKHRvTG9hZC51bmNlcnRhaW50ZXh0KSA6IFwiTG93IGNvbmZpZGVuY2VcIjtcblxuICAgIGNvbnN0IHNob3dVbmNlcnRhaW5Ub2tlbnMgPSB0b0xvYWQuc2hvd3VuY2VydGFpbnRva2VucyA9PSBudWxsIHx8IFN0cmluZyh0b0xvYWQuc2hvd3VuY2VydGFpbnRva2VucykgIT09IFwiZmFsc2VcIjtcblxuICAgIC8qKiBXaGV0aGVyIHRoZSBxdWV1ZS1wb3NpdGlvbiBiYWRnZSBpcyBlbmFibGVkLiBTdGFydHMgZnJvbSBwbHVnaW4gcHJvcGVydHk7IHRvTG9hZCBvdmVycmlkZXMuICovXG4gICAgbGV0IHF1ZXVlQmFkZ2VFbmFibGVkID0gZmFsc2U7XG4gICAgY29uc3QgcXVldWVCYWRnZU92ZXJyaWRlOiBib29sZWFuIHwgbnVsbCA9IHRvTG9hZC5xdWV1ZWJhZGdlICE9IG51bGwgPyBTdHJpbmcodG9Mb2FkLnF1ZXVlYmFkZ2UpICE9PSBcImZhbHNlXCIgOiBudWxsO1xuICAgIGNvbnN0IHF1ZXVlVGV4dDogc3RyaW5nID0gdG9Mb2FkLnF1ZXVldGV4dCAhPSBudWxsID8gU3RyaW5nKHRvTG9hZC5xdWV1ZXRleHQpIDogXCJcIjtcblxuICAgIC8qKiBNZWFuIGxvZ3Byb2IgdGhyZXNob2xkIGJlbG93IHdoaWNoIGEgcmVzcG9uc2UgaXMgY29uc2lkZXJlZCBsb3ctY29uZmlkZW5jZS4gKi9cbiAgICBjb25zdCBMT1dfQ09ORklERU5DRV9USFJFU0hPTEQgPSAtMi41O1xuXG4gICAgY29uc3Qgc2hvd1JlYWR5ID0gKG1vZGVsTmFtZT86IHN0cmluZywgdGhpbmtpbmdNb2RlbE5hbWU/OiBzdHJpbmcpID0+IHtcbiAgICAgIHN0YXR1c0J1YmJsZS5jbGFzc0xpc3QucmVtb3ZlKFwiTExBTUFfQ2hhdF9CdWJibGUtLXRoaW5raW5nXCIpO1xuXG4gICAgICBjb25zdCBuYW1lID0gbW9kZWxOYW1lIHx8IFwiQUlcIjtcbiAgICAgIGNvbnN0IHRoaW5raW5nSW5mbyA9IHRoaW5raW5nTW9kZWxOYW1lID8gYCArIFxcdXsxRjRBMX0gJHt0aGlua2luZ01vZGVsTmFtZX1gIDogXCJcIjtcblxuICAgICAgc3RhdHVzQnViYmxlLmlubmVySFRNTCA9IGBcXHV7MUY0QUN9ICR7bmFtZX0ke3RoaW5raW5nSW5mb30gJHt3ZWxjb21lVGV4dH1gO1xuICAgICAgY2hhdElucHV0LmRpc2FibGVkID0gZmFsc2U7XG4gICAgICBzZW5kQnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XG5cbiAgICAgIGlmIChtaWNCdXR0b24pIHtcbiAgICAgICAgbWljQnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICB9XG4gICAgICAvLyAjcmVnaW9uIERpc2FibGUgVGhpbmtpbmctQ2hlY2tib3ggaWYgdGhpbmtpbmcgdW5hdmFpbGFibGUuXG4gICAgICBpZiAoIXRoaW5raW5nTW9kZWxOYW1lICYmIHRoaW5raW5nQ2hlY2tib3ggJiYgdGhpbmtpbmdDaGVja2JveC5jaGVja2VkKSB7XG4gICAgICAgIHRoaW5raW5nQ2hlY2tib3guZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICB0aGlua2luZ0NoZWNrYm94LnRpdGxlID0gXCJUaGlua2luZyBtb2RlbCBub3QgYXZhaWxhYmxlIG9uIHRoaXMgc2VydmVyXCI7XG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIERpc2FibGUgVGhpbmtpbmctQ2hlY2tib3ggaWYgdGhpbmtpbmcgdW5hdmFpbGFibGUuXG4gICAgICBjaGF0SW5wdXQuZm9jdXMoKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIERpc3BsYXkgYW4gZXJyb3IgbWVzc2FnZSBpbiB0aGUgc3RhdHVzIGJ1YmJsZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtc2cgVGhlIGVycm9yIG1lc3NhZ2UgdG8gZGlzcGxheS4gKi9cbiAgICBjb25zdCBzaG93RXJyb3IgPSAobXNnOiBzdHJpbmcpID0+IHtcbiAgICAgIHN0YXR1c0J1YmJsZS5jbGFzc0xpc3QucmVtb3ZlKFwiTExBTUFfQ2hhdF9CdWJibGUtLXRoaW5raW5nXCIpO1xuXG4gICAgICBzdGF0dXNCdWJibGUuaW5uZXJIVE1MID0gYFxcdTI2QTAgJHttc2d9YDtcblxuICAgICAgc3RhdHVzQnViYmxlLmNsYXNzTGlzdC5hZGQoXCJMTEFNQV9DaGF0X0J1YmJsZS0tZXJyb3JcIik7XG4gICAgfTtcbiAgICAvLyAjcmVnaW9uIFBlcmlvZGljYWxseSBwb2xsIHRoZSBiYWNrZW5kIHRvIGNoZWNrIGlmIHRoZSBtb2RlbCBpcyByZWFkeSwgYW5kIHVwZGF0ZSB0aGUgc3RhdHVzIGJ1YmJsZSBhY2NvcmRpbmdseS5cbiAgICBjb25zdCBoZWFsdGhDaGVjayA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICQuYWpheCh7XG4gICAgICAgIHVybDogYCR7d2luZG93LmNvZGJpLmJhc2VVUkx9cGx1Z2luP25hbWU9Q29kQmlfQUlfTExBTUFfU1REYCxcbiAgICAgICAgdHlwZTogXCJQT1NUXCIsXG4gICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcbiAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgYmVmb3JlU2VuZDogKHhocikgPT4ge1xuICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiWC1IZWFsdGgtQ2hlY2tcIiwgXCJ0cnVlXCIpO1xuICAgICAgICB9LFxuICAgICAgICBzdWNjZXNzOiAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICBpZiAocmVzcG9uc2UuZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnN0IG1zZyA9IFN0cmluZyhyZXNwb25zZS5lcnJvcik7XG5cbiAgICAgICAgICAgIGlmICgvbm90IHJlYWR5fGRvd25sb2FkaW5nfGxvYWRpbmcvaS50ZXN0KG1zZykpIHtcbiAgICAgICAgICAgICAgc2V0SGVhbHRoTGFiZWwobXNnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaGVhbHRoQ2hlY2spO1xuICAgICAgICAgICAgICBzaG93RXJyb3IobXNnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLnBlbmRpbmdUaGlua2luZ01vZGVsKSB7XG4gICAgICAgICAgICBzaG93UmVhZHkocmVzcG9uc2UubW9kZWwpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKGhlYWx0aENoZWNrKTtcbiAgICAgICAgICAgIHNob3dSZWFkeShyZXNwb25zZS5tb2RlbCwgcmVzcG9uc2UudGhpbmtpbmdNb2RlbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFBpY2sgdXAgcXVldWUtYmFkZ2Ugc2V0dGluZyBmcm9tIHBsdWdpbiBwcm9wZXJ0eSAodG9Mb2FkIG92ZXJyaWRlIHRha2VzIHByZWNlZGVuY2UpLlxuICAgICAgICAgIGlmIChyZXNwb25zZS5xdWV1ZUJhZGdlICE9IG51bGwgJiYgcXVldWVCYWRnZU92ZXJyaWRlID09IG51bGwpIHtcbiAgICAgICAgICAgIHF1ZXVlQmFkZ2VFbmFibGVkID0gISFyZXNwb25zZS5xdWV1ZUJhZGdlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZXJyb3I6ICgpID0+IHtcbiAgICAgICAgICBzZXRIZWFsdGhMYWJlbCh3YWl0aW5nVGV4dCk7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9LCAzMDAwKTtcbiAgICAvLyAjZW5kcmVnaW9uIFBlcmlvZGljYWxseSBwb2xsIHRoZSBiYWNrZW5kIHRvIGNoZWNrIGlmIHRoZSBtb2RlbCBpcyByZWFkeSwgYW5kIHVwZGF0ZSB0aGUgc3RhdHVzIGJ1YmJsZSBhY2NvcmRpbmdseS5cbiAgICAvLyAjcmVnaW9uIEltbWVkaWF0ZWx5IHBvbGwgdGhlIGJhY2tlbmQgdG8gY2hlY2sgaWYgdGhlIG1vZGVsIGlzIHJlYWR5LCBhbmQgdXBkYXRlIHRoZSBzdGF0dXMgYnViYmxlIGFjY29yZGluZ2x5LlxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgJC5hamF4KHtcbiAgICAgICAgdXJsOiBgJHt3aW5kb3cuY29kYmkuYmFzZVVSTH1wbHVnaW4/bmFtZT1Db2RCaV9BSV9MTEFNQV9TVERgLFxuICAgICAgICB0eXBlOiBcIlBPU1RcIixcbiAgICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZSxcbiAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICBiZWZvcmVTZW5kOiAoeGhyKSA9PiB7XG4gICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoXCJYLUhlYWx0aC1DaGVja1wiLCBcInRydWVcIik7XG4gICAgICAgIH0sXG4gICAgICAgIHN1Y2Nlc3M6IChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgIGlmICghcmVzcG9uc2UuZXJyb3IpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaGVhbHRoQ2hlY2spO1xuICAgICAgICAgICAgc2hvd1JlYWR5KHJlc3BvbnNlLm1vZGVsLCByZXNwb25zZS50aGlua2luZ01vZGVsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9LCAxMDApO1xuICAgIC8vICNlbmRyZWdpb24gSW1tZWRpYXRlbHkgcG9sbCB0aGUgYmFja2VuZCB0byBjaGVjayBpZiB0aGUgbW9kZWwgaXMgcmVhZHksIGFuZCB1cGRhdGUgdGhlIHN0YXR1cyBidWJibGUgYWNjb3JkaW5nbHkuXG4gICAgd2luZG93LmNvZGJpLmxvZyhcIklORk9cIiwgXCJMbGFtYSBDaGF0IGZ1bmN0aW9uYWxpdHkgaW5pdGlhbGl6ZWRcIiwgXCJBSSAvIExMQU1BIC8gQ0hBVFwiKTtcbiAgfVxuICAvLyAjcmVnaW9uIFBERi5qc1xuICBwcml2YXRlIHN0YXRpYyBwZGZKc1dvcmtlckNvbmZpZ3VyZWQgPSBmYWxzZTtcbiAgLyoqIEVuc3VyZXMgdGhhdCB0aGUgUERGLmpzIHdvcmtlciBpcyBjb25maWd1cmVkLiBUaGlzIGlzIG5lY2Vzc2FyeSBmb3IgUERGLmpzIHRvIGZ1bmN0aW9uIGNvcnJlY3RseSBpbiBhIHdlYiBlbnZpcm9ubWVudC4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgZW5zdXJlUGRmSnNXb3JrZXJDb25maWd1cmVkKCk6IHZvaWQge1xuICAgIGlmIChBSV9MTEFNQV9DSEFULnBkZkpzV29ya2VyQ29uZmlndXJlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHBkZmpzTGliLkdsb2JhbFdvcmtlck9wdGlvbnMud29ya2VyU3JjID0gYCR7d2luZG93LmNvZGJpLmJhc2VVUkx9cGx1Z2luP25hbWU9UmVzb3VyY2UmUGF0aD0vY29tL2dpdGh1Yi94aW1hX2Zvcm1jeWNsZV9lbnR3aWNrbGVya3JlaXMvZmMvcGx1Z2luL2NvZGJpL3BkZi53b3JrZXIubWluLmpzYDtcblxuICAgIEFJX0xMQU1BX0NIQVQucGRmSnNXb3JrZXJDb25maWd1cmVkID0gdHJ1ZTtcblxuICAgIHdpbmRvdy5jb2RiaS5sb2coXG4gICAgICBcIklORk9cIixcbiAgICAgIGBQREYuanMgd29ya2VyIGNvbmZpZ3VyZWQ6ICR7cGRmanNMaWIuR2xvYmFsV29ya2VyT3B0aW9ucy53b3JrZXJTcmN9YCxcbiAgICAgIFwiQUkgLyBMTEFNQSAvIENIQVRcIixcbiAgICApO1xuICB9XG4gIC8vICNlbmRyZWdpb24gUERGLmpzXG4gIC8vICNyZWdpb24gQ2hhdC1CdWJibGUgQ1NTXG4gIC8qKiBJbmplY3RzIGdsb2JhbCBDU1MgZm9yIHRoZSBzcGVlY2gtYnViYmxlIGNoYXQgVUkgKG9uY2UpLiAqL1xuICBwcml2YXRlIHN0YXRpYyBlbnN1cmVDaGF0QnViYmxlU3R5bGVzKCk6IHZvaWQge1xuICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI0xMQU1BX0NoYXRfQnViYmxlX1N0eWxlc1wiKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuXG4gICAgc3R5bGUuaWQgPSBcIkxMQU1BX0NoYXRfQnViYmxlX1N0eWxlc1wiO1xuICAgIHN0eWxlLnRleHRDb250ZW50ID0gYFxuICAgICAgLkxMQU1BX0NoYXRfQ29udGFpbmVyIHsgLS11c2VyLWJ1YmJsZS1iZzogIzBiOTNmNiA7IC0tbGxhbWEtYnViYmxlLWJnOiAjZTVlNWVhIDsgZGlzcGxheTogZmxleCA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uIDsgZ2FwOiAxMHB4IDsgcGFkZGluZzogMTJweCA7IG92ZXJmbG93LXk6IGF1dG8gOyBtaW4taGVpZ2h0OiAxMjBweCA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXgtaGVpZ2h0OiA1MDBweCA7IGJvcmRlcjogMXB4IHNvbGlkICNkMGQwZDAgOyBib3JkZXItcmFkaXVzOiA4cHggOyBiYWNrZ3JvdW5kOiAjZjVmNWY1IDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQtZmFtaWx5OiAtYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsICdTZWdvZSBVSScsIFJvYm90bywgc2Fucy1zZXJpZiA7IGZvbnQtc2l6ZTogMTRweCA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lLWhlaWdodDogMS40NSA7fVxuICAgICAgXG4gICAgICAuTExBTUFfQ2hhdF9Sb3cgICAgICAgICB7IGRpc3BsYXk6IGZsZXggOyBvdmVyZmxvdzogdmlzaWJsZSA7fVxuICAgICAgLkxMQU1BX0NoYXRfUm93LS11c2VyICAgeyBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kIDt9XG4gICAgICAuTExBTUFfQ2hhdF9Sb3ctLWxsYW1hICB7IGp1c3RpZnktY29udGVudDogZmxleC1zdGFydCA7fVxuICAgICAgLkxMQU1BX0NoYXRfUm93LS1zeXN0ZW0geyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlciA7fVxuXG4gICAgICAuTExBTUFfQ2hhdF9CdWJibGUgICAgICAgIHsgbWF4LXdpZHRoOiA3NSUgOyBwYWRkaW5nOiAxMHB4IDE0cHggOyBib3JkZXItcmFkaXVzOiAxNnB4IDsgd29yZC13cmFwOiBicmVhay13b3JkIDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGl0ZS1zcGFjZTogcHJlLXdyYXAgOyBwb3NpdGlvbjogcmVsYXRpdmUgOyBib3gtc2hhZG93OiAwIDAgLjI1ZW0gYmxhY2sgO31cbiAgICAgIC5MTEFNQV9DaGF0X0J1YmJsZS0tdXNlciAgeyBiYWNrZ3JvdW5kOiB2YXIoLS11c2VyLWJ1YmJsZS1iZykgOyBjb2xvcjogI2ZmZiA7IGJvcmRlci1ib3R0b20tcmlnaHQtcmFkaXVzOiA0cHggO31cbiAgICAgIC5MTEFNQV9DaGF0X0J1YmJsZS0tbGxhbWEgeyBiYWNrZ3JvdW5kOiB2YXIoLS1sbGFtYS1idWJibGUtYmcpIDsgY29sb3I6ICMxYzFjMWUgOyBib3JkZXItYm90dG9tLWxlZnQtcmFkaXVzOiA0cHggO31cblxuICAgICAgLkxMQU1BX0NoYXRfQnViYmxlVG9vbGJhciAgICAgICAgIHsgcG9zaXRpb246IGFic29sdXRlIDsgdG9wOiAtMTBweCA7IGxlZnQ6IC04cHggOyBkaXNwbGF5OiBmbGV4IDsgZ2FwOiA0cHggOyBvcGFjaXR5OiAwIDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50ZXItZXZlbnRzOiBub25lIDsgdHJhbnNpdGlvbjogb3BhY2l0eSAwLjJzIDt9XG4gICAgICAuTExBTUFfQ2hhdF9CdWJibGVUb29sYmFyLS1yaWdodCAgeyBsZWZ0OiBhdXRvIDsgcmlnaHQ6IC04cHggO31cblxuICAgICAgLkxMQU1BX0NoYXRfQnViYmxlOmhvdmVyIC5MTEFNQV9DaGF0X0J1YmJsZVRvb2xiYXIgeyBvcGFjaXR5OiAxIDsgcG9pbnRlci1ldmVudHM6IGF1dG8gO31cblxuICAgICAgLkxMQU1BX0NoYXRfVG9vbGJhckJ0biAgICAgICAgeyB3aWR0aDogMjJweCA7IGhlaWdodDogMjJweCA7IGJvcmRlcjogMXB4IHNvbGlkICNjY2MgOyBib3JkZXItcmFkaXVzOiA1MCUgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAjZmZmIDsgY29sb3I6ICM4ODggOyBjdXJzb3I6IHBvaW50ZXIgOyBkaXNwbGF5OiBmbGV4IDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlciA7IGp1c3RpZnktY29udGVudDogY2VudGVyIDsgcGFkZGluZzogMCA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJveC1zaGFkb3c6IDAgMXB4IDNweCByZ2JhKCAwLCAwLCAwLCAuMiApIDsgdHJhbnNpdGlvbjogY29sb3IgMC4xNXMsIGJhY2tncm91bmQgMC4xNXMgO31cbiAgICAgIC5MTEFNQV9DaGF0X1Rvb2xiYXJCdG46aG92ZXIgIHsgY29sb3I6ICMwYjZhYmYgOyBiYWNrZ3JvdW5kOiAjZThmMGZlIDt9XG5cbiAgICAgIC5MTEFNQV9DaGF0X1Rvb2xiYXJCdG4tLXJldXNlIHsgbWFyZ2luLWJvdHRvbTogMnB4IDt9XG5cbiAgICAgIC5MTEFNQV9Nb2RlbEJhZGdlIHsgcG9zaXRpb246IGFic29sdXRlIDsgdG9wOiAtMTBweCA7IGxlZnQ6IC02cHggOyBmb250LXNpemU6IDEycHggOyBsaW5lLWhlaWdodDogMSA7IHdpZHRoOiAyMnB4IDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAyMnB4IDsgZGlzcGxheTogZmxleCA7IGFsaWduLWl0ZW1zOiBjZW50ZXIgOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlciA7IGJhY2tncm91bmQ6ICNmZmYgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjY2NjIDsgYm9yZGVyLXJhZGl1czogNTAlIDsgYm94LXNoYWRvdzogMCAxcHggM3B4IHJnYmEoIDAsIDAsIDAsIC4yICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogZGVmYXVsdCA7IHVzZXItc2VsZWN0OiBub25lIDt9XG5cbiAgICAgIC5MTEFNQV9DaGF0X0J1YmJsZS0tc3lzdGVtIHsgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50IDsgY29sb3I6ICM4ZThlOTMgOyBmb250LXNpemU6IDEycHggOyBmb250LXN0eWxlOiBpdGFsaWMgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyIDt9XG5cbiAgICAgIC5MTEFNQV9DaGF0X0J1YmJsZS0tdGhpbmtpbmcgeyBvcGFjaXR5OiAwLjcgOyBmb250LXN0eWxlOiBpdGFsaWMgOyBkaXNwbGF5OiBmbGV4IDsgYWxpZ24taXRlbXM6IGNlbnRlciA7IGdhcDogOHB4IDt9XG5cbiAgICAgIC5MTEFNQV9UaGlua2luZ1NwaW5uZXIgICAgICAgICAgeyB3aWR0aDogMjBweCA7IGhlaWdodDogMjBweCA7IGZsZXgtc2hyaW5rOiAwIDt9XG4gICAgICAuTExBTUFfVGhpbmtpbmdTcGlubmVyOjpiZWZvcmUgIHsgZGlzcGxheTogbm9uZSA7fVxuXG4gICAgICAuTExBTUFfVGhpbmtpbmdMYWJlbCB7IGxpbmUtaGVpZ2h0OiAyMHB4IDt9XG5cbiAgICAgIC5MTEFNQV9RdWV1ZUJhZGdlIHsgZGlzcGxheTogaW5saW5lLWZsZXggOyBhbGlnbi1pdGVtczogY2VudGVyIDsgZ2FwOiA0cHggOyBtYXJnaW4tbGVmdDogNnB4IDsgcGFkZGluZzogMnB4IDhweCA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDEwcHggOyBiYWNrZ3JvdW5kOiAjZDBlMGZmIDsgY29sb3I6ICMxYTVhYWIgOyBmb250LXNpemU6IDEycHggOyBmb250LXdlaWdodDogNjAwIDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udC1zdHlsZTogbm9ybWFsIDsgd2hpdGUtc3BhY2U6IG5vd3JhcCA7IGxpbmUtaGVpZ2h0OiAxOHB4IDt9XG5cbiAgICAgIC5MTEFNQV9DaGF0X0J1YmJsZS0tZXJyb3IgeyBiYWNrZ3JvdW5kOiAjZmZlMGUwIDsgY29sb3I6ICNjMDAgO31cblxuICAgICAgLkxMQU1BX1NlYXJjaEluZGljYXRvciB7ICBkaXNwbGF5OiBmbGV4IDsgYWxpZ24taXRlbXM6IGNlbnRlciA7IGdhcDogOHB4IDsgb3BhY2l0eTogMC44NSA7IGZvbnQtc3R5bGU6IGl0YWxpYyA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTNweCA7IGJhY2tncm91bmQ6ICNmMGY0ZmYgOyBib3JkZXI6IDFweCBkYXNoZWQgI2IwYzRkZSA7fVxuXG4gICAgICAuTExBTUFfU2VhcmNoTGFiZWwgeyBjb2xvcjogIzNhNmVhNSA7IH1cblxuICAgICAgLkxMQU1BX1NlYXJjaFNwaW5uZXIgeyB3aWR0aDogMjBweCA7IGhlaWdodDogMjBweCA7IGZsZXgtc2hyaW5rOiAwIDt9XG4gICAgICBcbiAgICAgIC5MTEFNQV9TZWFyY2hTcGlubmVyOjpiZWZvcmUgeyBkaXNwbGF5OiBub25lIDt9XG5cbiAgICAgIC5MTEFNQV9DaGF0X1RoaW5raW5nIHsgbWFyZ2luLXRvcDogMTBweCA7IGJvcmRlci10b3A6IDFweCBzb2xpZCByZ2JhKCAwLCAwLCAwLCAwLjEgKTsgcGFkZGluZy10b3A6IDZweCA7IGZvbnQtc2l6ZTogMTJweCA7fVxuXG4gICAgICAuTExBTUFfQ2hhdF9UaGlua2luZyBzdW1tYXJ5ICAgICAgICB7IGN1cnNvcjogcG9pbnRlciA7IGNvbG9yOiAjNjY2IDsgZm9udC1zdHlsZTogaXRhbGljIDsgdXNlci1zZWxlY3Q6IG5vbmUgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDExcHggO31cbiAgICAgIC5MTEFNQV9DaGF0X1RoaW5raW5nIHN1bW1hcnk6aG92ZXIgIHsgY29sb3I6ICMzMzMgOyB9XG5cbiAgICAgIC5MTEFNQV9DaGF0X1RoaW5raW5nQ29udGVudCB7IG1hcmdpbi10b3A6IDZweCA7IHBhZGRpbmc6IDhweCA7IGJhY2tncm91bmQ6IHJnYmEoIDAsIDAsIDAsIDAuMDQgKTsgYm9yZGVyLXJhZGl1czogNnB4IDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaXRlLXNwYWNlOiBwcmUtd3JhcCA7IHdvcmQtYnJlYWs6IGJyZWFrLXdvcmQgOyBjb2xvcjogIzU1NSA7IGZvbnQtc2l6ZTogMTJweCA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lLWhlaWdodDogMS41IDsgbWF4LWhlaWdodDogMzAwcHggOyBvdmVyZmxvdy15OiBhdXRvIDt9XG5cbiAgICAgIC5MTEFNQV9DaGF0X0FpSGludCB7ICBkaXNwbGF5OiBibG9jayA7IG1hcmdpbi10b3A6IDRweCA7IGZvbnQtc2l6ZTogMTBweCA7IGNvbG9yOiByZ2JhKCAwLCAwLCAwLCAwLjM1ICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogcmlnaHQgOyB1c2VyLXNlbGVjdDogbm9uZSA7fVxuXG4gICAgICAuTExBTUFfQ2hhdF9Db2RlQmxvY2sgeyBtYXJnaW46IDhweCAwIDsgYm9yZGVyLXJhZGl1czogOHB4IDsgb3ZlcmZsb3c6IGhpZGRlbiA7IGJhY2tncm91bmQ6ICMxZTFlMWUgOyBjb2xvcjogI2Q0ZDRkNCA7fVxuXG4gICAgICAuTExBTUFfQ2hhdF9Db2RlSGVhZGVyIHsgIGRpc3BsYXk6IGZsZXggOyBhbGlnbi1pdGVtczogY2VudGVyIDsganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuIDsgcGFkZGluZzogNHB4IDEycHggO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAjMmQyZDJkIDsgZm9udC1zaXplOiAxMXB4IDsgY29sb3I6ICM5OTkgO31cblxuICAgICAgLkxMQU1BX0NoYXRfQ29kZUxhbmcgeyB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlIDsgbGV0dGVyLXNwYWNpbmc6IDAuNXB4IDt9XG5cbiAgICAgIC5MTEFNQV9DaGF0X0NvZGVDb3B5QnRuIHsgYm9yZGVyOiBub25lIDsgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQgOyBjb2xvcjogIzk5OSA7IGN1cnNvcjogcG9pbnRlciA7IHBhZGRpbmc6IDJweCA0cHggO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA0cHggOyBkaXNwbGF5OiBmbGV4IDsgYWxpZ24taXRlbXM6IGNlbnRlciA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246IGNvbG9yIDAuMTVzLCBiYWNrZ3JvdW5kIDAuMTVzIDt9XG5cbiAgICAgIC5MTEFNQV9DaGF0X0NvZGVDb3B5QnRuOmhvdmVyIHsgY29sb3I6ICNmZmYgOyBiYWNrZ3JvdW5kOiByZ2JhKDI1NSwyNTUsMjU1LDAuMSkgO31cblxuICAgICAgLkxMQU1BX0NoYXRfQ29kZVByZSB7IG1hcmdpbjogMCA7IHBhZGRpbmc6IDEycHggOyBvdmVyZmxvdy14OiBhdXRvIDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250LWZhbWlseTogJ0Nhc2NhZGlhIENvZGUnLCAnRmlyYSBDb2RlJywgJ0NvbnNvbGFzJywgJ01vbmFjbycsIG1vbm9zcGFjZSA7IGZvbnQtc2l6ZTogMTNweCA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZS1oZWlnaHQ6IDEuNSA7IHdoaXRlLXNwYWNlOiBwcmUgO31cblxuICAgICAgLkxMQU1BX0NoYXRfQ29kZVByZSBjb2RlIHsgZm9udC1mYW1pbHk6IGluaGVyaXQgOyBiYWNrZ3JvdW5kOiBub25lIDsgcGFkZGluZzogMCA7fVxuXG4gICAgICAuTExBTUFfQ2hhdF9JbmxpbmVDb2RlIHsgIGJhY2tncm91bmQ6IHJnYmEoIDAsIDAsIDAsIDAuMDcgKTsgcGFkZGluZzogMXB4IDVweCA7IGJvcmRlci1yYWRpdXM6IDRweCA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQtZmFtaWx5OiAnQ2FzY2FkaWEgQ29kZScsICdGaXJhIENvZGUnLCAnQ29uc29sYXMnLCAnTW9uYWNvJywgbW9ub3NwYWNlIDsgZm9udC1zaXplOiAwLjllbSA7fVxuXG4gICAgICAuTExBTUFfQ2hhdF9CdWJibGUgYSB7IGNvbG9yOiBpbmhlcml0IDsgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmUgOyB3b3JkLWJyZWFrOiBicmVhay1hbGwgO31cblxuICAgICAgLkxMQU1BX0NoYXRfQnViYmxlLS11c2VyIGEgIHsgY29sb3I6ICNmZmYgO31cbiAgICAgIC5MTEFNQV9DaGF0X0J1YmJsZS0tbGxhbWEgYSB7IGNvbG9yOiAjMGI2YWJmIDt9XG4gICAgICAuTExBTUFfQ2hhdF9CdWJibGUgYTpob3ZlciAgeyB0ZXh0LWRlY29yYXRpb24tdGhpY2tuZXNzOiAycHggO31cblxuICAgICAgLkxMQU1BX0NoYXRfU291cmNlQmFkZ2UgICAgICAgeyBkaXNwbGF5OiBpbmxpbmUtZmxleCA7IGFsaWduLWl0ZW1zOiBjZW50ZXIgOyBwYWRkaW5nOiAycHggMTBweCA7IGJvcmRlci1yYWRpdXM6IDEycHggO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKCAxMSwgMTA2LCAxOTEsIDAuMSkgOyBmb250LXNpemU6IDEycHggOyB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzIDt9XG4gICAgICAuTExBTUFfQ2hhdF9Tb3VyY2VCYWRnZTpob3ZlciB7IGJhY2tncm91bmQ6IHJnYmEoIDExLCAxMDYsIDE5MSwgMC4yICk7fVxuXG4gICAgICAuTExBTUFfQ2hhdF9Tb3VyY2VCYWRnZSBhICAgICAgIHsgY29sb3I6ICMwYjZhYmYgOyB0ZXh0LWRlY29yYXRpb246IG5vbmUgOyB3b3JkLWJyZWFrOiBub3JtYWwgO31cbiAgICAgIC5MTEFNQV9DaGF0X1NvdXJjZUJhZGdlIGE6aG92ZXIgeyB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZSA7fVxuXG4gICAgICAuTExBTUFfQ2hhdF9QaG9uZUJhZGdlLFxuICAgICAgLkxMQU1BX0NoYXRfRW1haWxCYWRnZSB7ICBkaXNwbGF5OiBpbmxpbmUtZmxleCA7IGFsaWduLWl0ZW1zOiBjZW50ZXIgOyBnYXA6IDRweCA7IHBhZGRpbmc6IDJweCAxMHB4IDsgYm9yZGVyLXJhZGl1czogMTJweCA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweCA7IHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4xNXMgO31cblxuICAgICAgLkxMQU1BX0NoYXRfUGhvbmVCYWRnZSAgICAgICAgeyBiYWNrZ3JvdW5kOiByZ2JhKCA0MCwgMTY3LCA2OSwgMC4xMiApO31cbiAgICAgIC5MTEFNQV9DaGF0X1Bob25lQmFkZ2U6aG92ZXIgIHsgYmFja2dyb3VuZDogcmdiYSggNDAsIDE2NywgNjksIDAuMjIgKTt9XG5cbiAgICAgIC5MTEFNQV9DaGF0X0VtYWlsQmFkZ2UgICAgICAgIHsgYmFja2dyb3VuZDogcmdiYSggMjIwLCAxMzAsIDAsIDAuMTIgKTt9XG4gICAgICAuTExBTUFfQ2hhdF9FbWFpbEJhZGdlOmhvdmVyICB7IGJhY2tncm91bmQ6IHJnYmEoIDIyMCwgMTMwLCAwLCAwLjIyICk7fVxuXG4gICAgICAuTExBTUFfQ2hhdF9QaG9uZUJhZGdlIGEgeyBjb2xvcjogIzI4YTc0NSA7IHRleHQtZGVjb3JhdGlvbjogbm9uZSA7IHdvcmQtYnJlYWs6IG5vcm1hbCA7fVxuICAgICAgLkxMQU1BX0NoYXRfRW1haWxCYWRnZSBhIHsgY29sb3I6ICNjMjc4MDAgOyB0ZXh0LWRlY29yYXRpb246IG5vbmUgOyB3b3JkLWJyZWFrOiBub3JtYWwgO31cblxuICAgICAgLkxMQU1BX0NoYXRfUGhvbmVCYWRnZSBhOmhvdmVyLFxuICAgICAgLkxMQU1BX0NoYXRfRW1haWxCYWRnZSBhOmhvdmVyIHsgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmUgO31cblxuICAgICAgLkxMQU1BX0NoYXRfQmFkZ2VJY29uIHsgZm9udC1zaXplOiAxM3B4IDsgbGluZS1oZWlnaHQ6IDEgO31cblxuICAgICAgLkxMQU1BX0NoYXRfSW5wdXRXcmFwcGVyIHsgcG9zaXRpb246IHJlbGF0aXZlIDsgZGlzcGxheTogaW5saW5lLWJsb2NrIDsgd2lkdGg6IDEwMCUgOyBvdmVyZmxvdzogdmlzaWJsZSA7fVxuXG4gICAgICAuTExBTUFfaW5wdXRfZmxhcmUgeyAgYW5pbWF0aW9uOiBMTEFNQV9yZWN0X2ZsYXJlIDJzIGVhc2Utb3V0IGluZmluaXRlIDsgYW5pbWF0aW9uLWR1cmF0aW9uOiAxcyA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uLWl0ZXJhdGlvbi1jb3VudDogMSA7fVxuICAgICAgQGtleWZyYW1lcyBMTEFNQV9yZWN0X2ZsYXJlIHtcbiAgICAgICAgMCUgICB7IGJveC1zaGFkb3c6IDAgMCAwIDAgcmdiYSggMjUsIDExOCwgMjEwLCAwLjggKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIDAgMCAwIDAgcmdiYSggMjUsIDExOCwgMjEwLCAwLjYgKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIDAgMCAwIDAgcmdiYSggMjUsIDExOCwgMjEwLCAwLjQgKTt9XG4gICAgICAgIDEwMCUgeyBib3gtc2hhZG93OiAwIDAgMCAxMnB4IHJnYmEoIDI1LCAxMTgsIDIxMCwgMCApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgMCAwIDAgMjRweCByZ2JhKCAyNSwgMTE4LCAyMTAsIDAgKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIDAgMCAwIDM2cHggcmdiYSggMjUsIDExOCwgMjEwLCAwICk7fX1cblxuICAgICAgLkxMQU1BX0NoYXRfSW5wdXRXcmFwcGVyID4gaW5wdXQsXG4gICAgICAuTExBTUFfQ2hhdF9JbnB1dFdyYXBwZXIgPiB0ZXh0YXJlYSB7IHdpZHRoOiAxMDAlIDsgYm94LXNpemluZzogYm9yZGVyLWJveCA7IHBhZGRpbmctcmlnaHQ6IDM2cHggIWltcG9ydGFudCA7fVxuXG4gICAgICAuTExBTUFfQ2hhdF9NaWNCdXR0b24gICAgICAgeyBwb3NpdGlvbjogYWJzb2x1dGUgOyByaWdodDogNHB4IDsgYm90dG9tOiA0cHggOyB3aWR0aDogMjhweCA7IGhlaWdodDogMjhweCA7IGJvcmRlcjogbm9uZSA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1MCUgOyBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudCA7IGNvbG9yOiAjODg4IDsgY3Vyc29yOiBwb2ludGVyIDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGZsZXggOyBhbGlnbi1pdGVtczogY2VudGVyIDsganVzdGlmeS1jb250ZW50OiBjZW50ZXIgOyBwYWRkaW5nOiAwIDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246IGNvbG9yIDAuMnMsIGJhY2tncm91bmQgMC4ycyA7fVxuICAgICAgLkxMQU1BX0NoYXRfTWljQnV0dG9uOmhvdmVyIHsgY29sb3I6ICMzMzMgOyBiYWNrZ3JvdW5kOiByZ2JhKCAwLCAwLCAwLCAwLjA2ICk7fVxuXG4gICAgICAuTExBTUFfQ2hhdF9NaWNCdXR0b24tLXJlY29yZGluZyB7IGNvbG9yOiAjZmZmIDsgYmFja2dyb3VuZDogI2U1MzkzNSA7IG92ZXJmbG93OiB2aXNpYmxlIDt9XG5cbiAgICAgIC5MTEFNQV9DaGF0X01pY0J1dHRvbi0tcmVjb3JkaW5nOjpiZWZvcmUsXG4gICAgICAuTExBTUFfQ2hhdF9NaWNCdXR0b24tLXJlY29yZGluZzo6YWZ0ZXIgeyBjb250ZW50OiAnJyA7IHBvc2l0aW9uOiBhYnNvbHV0ZSA7IHRvcDogNTAlIDsgbGVmdDogNTAlIDsgd2lkdGg6IDEwMCUgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAxMDAlIDsgYm9yZGVyLXJhZGl1czogNTAlIDsgYm9yZGVyOiAycHggc29saWQgI2U1MzkzNSA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSggLTUwJSwgLTUwJSApIHNjYWxlKCAxICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb246IExMQU1BX21pY19mbGFyZSAxLjhzIGVhc2Utb3V0IGluZmluaXRlIDt9XG4gICAgICAuTExBTUFfQ2hhdF9NaWNCdXR0b24tLXJlY29yZGluZzo6YWZ0ZXIgeyBhbmltYXRpb24tZGVsYXk6IDAuNnMgO31cbiAgICAgIC5MTEFNQV9DaGF0X01pY0J1dHRvbi0tcmVjb3JkaW5nOmhvdmVyICB7IGJhY2tncm91bmQ6ICNjNjI4MjggOyBjb2xvcjogI2ZmZiA7fVxuXG4gICAgICAuTExBTUFfQ2hhdF9NaWNCdXR0b24tLXVuYXZhaWxhYmxlIHsgY29sb3I6ICNjY2MgOyBjdXJzb3I6IG5vdC1hbGxvd2VkIDt9XG4gICAgICAuTExBTUFfQ2hhdF9NaWNCdXR0b24tLXRyYW5zY3JpYmluZyB7IGNvbG9yOiAjZmZmIDsgYmFja2dyb3VuZDogIzE1NjVjMCA7IHBvaW50ZXItZXZlbnRzOiBub25lIDsgb3ZlcmZsb3c6IHZpc2libGUgO31cblxuICAgICAgLkxMQU1BX0NoYXRfTWljQnV0dG9uLS10cmFuc2NyaWJpbmc6OmJlZm9yZSxcbiAgICAgIC5MTEFNQV9DaGF0X01pY0J1dHRvbi0tdHJhbnNjcmliaW5nOjphZnRlciB7ICBjb250ZW50OiAnJyA7IHBvc2l0aW9uOiBhYnNvbHV0ZSA7IHRvcDogNTAlIDsgbGVmdDogNTAlIDsgd2lkdGg6IDEwMCUgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogMTAwJSA7IGJvcmRlci1yYWRpdXM6IDUwJSA7IGJvcmRlcjogMnB4IHNvbGlkICMxNTY1YzAgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCAtNTAlLCAtNTAlICkgc2NhbGUoIDEgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb246IExMQU1BX21pY19mbGFyZSAxLjhzIGVhc2Utb3V0IGluZmluaXRlIDt9XG4gICAgICAuTExBTUFfQ2hhdF9NaWNCdXR0b24tLXRyYW5zY3JpYmluZzo6YWZ0ZXIgeyBhbmltYXRpb24tZGVsYXk6IDAuNnMgO31cblxuICAgICAgQGtleWZyYW1lcyBMTEFNQV9taWNfZmxhcmUge1xuICAgICAgICAwJSAgIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSkgc2NhbGUoMSkgOyBvcGFjaXR5OiAwLjcgOyB9XG4gICAgICAgIDEwMCUgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtNTAlLCAtNTAlKSBzY2FsZSgyLjgpIDsgb3BhY2l0eTogMCA7IH19XG5cbiAgICAgIC8qICNyZWdpb24gQ29uZmlkZW5jZSAvIGxvZ3Byb2Igc3R5bGVzICovXG4gICAgICAuTExBTUFfQ2hhdF9Db25maWRlbmNlV2FybmluZyB7IGRpc3BsYXk6IGlubGluZS1mbGV4IDsgYWxpZ24taXRlbXM6IGNlbnRlciA7IGdhcDogNnB4IDsgbWFyZ2luLXRvcDogOHB4IDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogNHB4IDEwcHggOyBib3JkZXItcmFkaXVzOiAxMnB4IDsgYmFja2dyb3VuZDogcmdiYSggMjU1LCAxNTIsIDAsIDAuMTUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICNiMzZiMDAgOyBmb250LXNpemU6IDEycHggOyBsaW5lLWhlaWdodDogMSA7IHVzZXItc2VsZWN0OiBub25lIDt9XG5cbiAgICAgIC5MTEFNQV9DaGF0X1JldGhpbmtCdG4gICAgICAgIHsgYm9yZGVyOiAxcHggc29saWQgI2IzNmIwMCA7IGJvcmRlci1yYWRpdXM6IDEwcHggOyBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudCA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAjYjM2YjAwIDsgZm9udC1zaXplOiAxMXB4IDsgcGFkZGluZzogMnB4IDhweCA7IGN1cnNvcjogcG9pbnRlciA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4xNXMsIGNvbG9yIDAuMTVzIDt9XG4gICAgICAuTExBTUFfQ2hhdF9SZXRoaW5rQnRuOmhvdmVyICB7IGJhY2tncm91bmQ6ICNiMzZiMDAgOyBjb2xvcjogI2ZmZiA7fVxuXG4gICAgICAuTExBTUFfVW5jZXJ0YWluU3BhbiB7IGJhY2tncm91bmQ6IHJnYmEoIDI1NSwgMTUyLCAwLCAwLjE4ICkgOyBib3JkZXItYm90dG9tOiAxLjVweCBkb3R0ZWQgI2U2YTIwMCA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDJweCA7IHBhZGRpbmc6IDAgMXB4IDt9XG4gICAgICAvKiAjZW5kcmVnaW9uIENvbmZpZGVuY2UgLyBsb2dwcm9iIHN0eWxlcyAqL1xuXG4gICAgICBAa2V5ZnJhbWVzIExMQU1BX2ZsYXNoIHtcbiAgICAgICAgMCUgICB7IGZpbHRlcjogYnJpZ2h0bmVzcyggMSApIDsgfVxuICAgICAgICAzMCUgIHsgZmlsdGVyOiBicmlnaHRuZXNzKCAxLjM1ICkgOyB9XG4gICAgICAgIDEwMCUgeyBmaWx0ZXI6IGJyaWdodG5lc3MoIDEgKSA7IH19XG4gICAgICAuTExBTUFfZmxhc2ggeyBhbmltYXRpb246IExMQU1BX2ZsYXNoIDAuMzVzIGVhc2Utb3V0IDt9YDtcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uIENoYXQgYnViYmxlIHN0eWxlc1xuICAvLyAjcmVnaW9uIEFJLUdlbmVyYXRlZCBoaW50IGZvciBidWJibGVzLlxuICAvKipcbiAgICogQXBwZW5kcyBhIHNtYWxsIEFJLUdlbmVyYXRlZCBoaW50IGxhYmVsIGluc2lkZSBhIGNoYXQgYnViYmxlLlxuICAgKlxuICAgKiBAcGFyYW0gYnViYmxlICAgVGhlIGJ1YmJsZSBgPGRpdj5gIHRvIGFubm90YXRlLlxuICAgKiBAcGFyYW0gaGludFRleHQgVGhlIGxhYmVsIHRvIGRpc3BsYXksIGUuZy4gXCJcdTI3MjggQUktR2VuZXJhdGVkXCIuICovXG4gIHByaXZhdGUgc3RhdGljIGF0dGFjaEFpSGludFRvQnViYmxlKGJ1YmJsZTogSFRNTERpdkVsZW1lbnQsIGhpbnRUZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAvLyBSZW1vdmUgYW55IGV4aXN0aW5nIGhpbnQgaW5zaWRlIHRoaXMgYnViYmxlXG4gICAgY29uc3QgZXhpc3RpbmcgPSBidWJibGUucXVlcnlTZWxlY3RvcihcIi5MTEFNQV9DaGF0X0FpSGludFwiKTtcbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIGV4aXN0aW5nLnJlbW92ZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IGhpbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcblxuICAgIGhpbnQuY2xhc3NOYW1lID0gXCJMTEFNQV9DaGF0X0FpSGludFwiO1xuICAgIGhpbnQudGV4dENvbnRlbnQgPSBoaW50VGV4dDtcblxuICAgIGJ1YmJsZS5hcHBlbmRDaGlsZChoaW50KTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uIEFJLUdlbmVyYXRlZCBoaW50IGZvciBidWJibGVzLlxuICAvLyAjcmVnaW9uIEltYWdlLURvd25zY2FsaW5nXG4gIC8qKiBEZWZhdWx0IHRvdGFsLXBpeGVsIGJ1ZGdldCAod2lkdGggXHUwMEQ3IGhlaWdodCkuIE1hdGNoZXMgdGhlIGJhY2tlbmQncyBkZWZhdWx0IG1heFBpeGVscyAoXHUyMjQ4IDE3OTIgXHUwMEQ3IDE3OTIpLiAqL1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBERUZBVUxUX01BWF9QSVhFTFMgPSAzMjExMjY0O1xuICAvKipcbiAgICogQ29udmVydHMgYSBjYW52YXMgdG8gYSB7QGxpbmsgRmlsZX0gYnVpbHQgZnJvbSByYXcgYnl0ZXMuXG4gICAqIEZvcm1jeWNsZSdzIG11bHRpcGFydCBwYXJzZXIgcmV0dXJucyAwIGJ5dGVzIGZvciBjYW52YXMge0BsaW5rIEJsb2J9IG9iamVjdHMsXG4gICAqIHNvIHdlIGdvIHRocm91Z2gge0BsaW5rIEhUTUxDYW52YXNFbGVtZW50LnRvRGF0YVVSTCB0b0RhdGFVUkx9IFx1MjE5MiBiYXNlNjQgZGVjb2RlIFx1MjE5MiB7QGxpbmsgQXJyYXlCdWZmZXJ9IFx1MjE5MiB7QGxpbmsgRmlsZX0uXG4gICAqXG4gICAqIEBwYXJhbSBjYW52YXMgICAgVGhlIGNhbnZhcyBjb250YWluaW5nIHRoZSBpbWFnZSB0byBjb252ZXJ0LlxuICAgKiBAcGFyYW0gZmlsZU5hbWUgIFRoZSBuYW1lIHRvIGFzc2lnbiB0byB0aGUgcmVzdWx0aW5nIEZpbGUuXG4gICAqXG4gICAqIEByZXR1cm4gQSB7QGxpbmsgRmlsZSB9IGNvbnRhaW5pbmcgdGhlIGltYWdlIGRhdGEgZnJvbSB0aGUgY2FudmFzLCB3aXRoIHRoZSBzcGVjaWZpZWQgZmlsZSBuYW1lIGFuZCBcImltYWdlL3BuZ1wiIE1JTUUgdHlwZS4qL1xuICBwcml2YXRlIHN0YXRpYyBjYW52YXNUb0ZpbGUoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCwgZmlsZU5hbWU6IHN0cmluZyk6IEZpbGUge1xuICAgIGNvbnN0IGRhdGFVcmwgPSBjYW52YXMudG9EYXRhVVJMKFwiaW1hZ2UvcG5nXCIpO1xuICAgIGNvbnN0IGJhc2U2NCA9IGRhdGFVcmwuc3BsaXQoXCIsXCIpWzFdO1xuICAgIGNvbnN0IGJpbmFyeSA9IGF0b2IoYmFzZTY0KTtcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJpbmFyeS5sZW5ndGgpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW5hcnkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGJ5dGVzW2ldID0gYmluYXJ5LmNoYXJDb2RlQXQoaSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBGaWxlKFtieXRlcy5idWZmZXJdLCBmaWxlTmFtZSwgeyB0eXBlOiBcImltYWdlL3BuZ1wiIH0pO1xuICB9XG4gIC8qKlxuICAgKiBSZWFkcyBhIHtAbGluayBCbG9ifSAob3Ige0BsaW5rIEZpbGV9KSBhcyBhXG4gICAqIHtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL0Jhc2ljc19vZl9IVFRQL0RhdGFfVVJMcyBkYXRhIFVSTH1cbiAgICogc3RyaW5nICh7QGNvZGUgZGF0YTo8bWltZT47YmFzZTY0LC4uLn0pLlxuICAgKlxuICAgKiBVc2VkIHRvIHNlbmQgaW1hZ2UgZGF0YSBhcyBhIHJlZ3VsYXIgdGV4dCBwYXJhbWV0ZXIgaW4gRm9ybURhdGEsXG4gICAqIGJ5cGFzc2luZyBmb3JtY3ljbGUncyBtdWx0aXBhcnQgZmlsZSBwYXJzZXIgd2hpY2ggcmV0dXJucyAwLWJ5dGUge0Bjb2RlIEZpbGVEYXRhfS5cbiAgICpcbiAgICogQHBhcmFtIGJsb2IgVGhlIEJsb2Igb3IgRmlsZSB0byByZWFkIGFzIGEgZGF0YSBVUkwuXG4gICAqXG4gICAqIEByZXR1cm4gQSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYSBkYXRhIFVSTCBzdHJpbmcgY29udGFpbmluZyB0aGUgYmxvYidzIGRhdGEuICovXG4gIHByaXZhdGUgc3RhdGljIGJsb2JUb0RhdGFVcmwoYmxvYjogQmxvYik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblxuICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpID0+IHJlc29sdmUocmVhZGVyLnJlc3VsdCBhcyBzdHJpbmcpO1xuICAgICAgcmVhZGVyLm9uZXJyb3IgPSByZWplY3Q7XG4gICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChibG9iKTtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogRG93bnNjYWxlcyBhbiBpbWFnZSBmaWxlIGlmIGl0cyB0b3RhbCBwaXhlbCBjb3VudCAod2lkdGggXHUwMEQ3IGhlaWdodCkgZXhjZWVkc1xuICAgKiB7QGxpbmsgbWF4UGl4ZWxzfSwgcHJlc2VydmluZyB0aGUgYXNwZWN0IHJhdGlvLiBSZXR1cm5zIHRoZSBvcmlnaW5hbCBmaWxlXG4gICAqIHVuY2hhbmdlZCB3aGVuIGl0IGlzIGFscmVhZHkgd2l0aGluIHRoZSBidWRnZXQuXG4gICAqXG4gICAqIEBwYXJhbSBmaWxlICAgICAgVGhlIGltYWdlIGZpbGUgdG8gY2hlY2suXG4gICAqIEBwYXJhbSBtYXhQaXhlbHMgVG90YWwtcGl4ZWwgYnVkZ2V0ICh3aWR0aCBcdTAwRDcgaGVpZ2h0KS4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgZG93bnNjYWxlSW1hZ2VJZk5lZWRlZChmaWxlOiBGaWxlLCBtYXhQaXhlbHM6IG51bWJlcik6IFByb21pc2U8QmxvYj4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxCbG9iPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcblxuICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgdG90YWxQaXhlbHMgPSBpbWcud2lkdGggKiBpbWcuaGVpZ2h0O1xuXG4gICAgICAgIGlmICh0b3RhbFBpeGVscyA8PSBtYXhQaXhlbHMpIHtcbiAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKGltZy5zcmMpO1xuICAgICAgICAgIHJlc29sdmUoZmlsZSk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzY2FsZSA9IE1hdGguc3FydChtYXhQaXhlbHMgLyB0b3RhbFBpeGVscyk7XG4gICAgICAgIGNvbnN0IG5ld1cgPSBNYXRoLm1heCgyOCwgTWF0aC5yb3VuZChpbWcud2lkdGggKiBzY2FsZSkpO1xuICAgICAgICBjb25zdCBuZXdIID0gTWF0aC5tYXgoMjgsIE1hdGgucm91bmQoaW1nLmhlaWdodCAqIHNjYWxlKSk7XG5cbiAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcbiAgICAgICAgICBcIklORk9cIixcbiAgICAgICAgICBgRG93bnNjYWxpbmcgJHtmaWxlLm5hbWV9OiAke2ltZy53aWR0aH1cXHUwMGQ3JHtpbWcuaGVpZ2h0fSBcXHUyMTkyICR7bmV3V31cXHUwMGQ3JHtuZXdIfWAsXG4gICAgICAgICAgXCJBSSAvIExMQU1BIC8gQ0hBVFwiLFxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XG5cbiAgICAgICAgY2FudmFzLndpZHRoID0gbmV3VztcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IG5ld0g7XG5cbiAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcblxuICAgICAgICBpZiAoIWN0eCkge1xuICAgICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwoaW1nLnNyYyk7XG4gICAgICAgICAgcmVzb2x2ZShmaWxlKTtcblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwLCBuZXdXLCBuZXdIKTtcbiAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChpbWcuc3JjKTtcblxuICAgICAgICByZXNvbHZlKEFJX0xMQU1BX0NIQVQuY2FudmFzVG9GaWxlKGNhbnZhcywgZmlsZS5uYW1lKSk7XG4gICAgICB9O1xuXG4gICAgICBpbWcub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChpbWcuc3JjKTtcbiAgICAgICAgcmVzb2x2ZShmaWxlKTtcbiAgICAgIH07XG5cbiAgICAgIGltZy5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGZpbGUpO1xuICAgIH0pO1xuICB9XG4gIC8vICNlbmRyZWdpb24gSW1hZ2UtRG93bnNjYWxpbmdcbiAgLy8gI3JlZ2lvbiBQREYtUHJvY2Vzc2luZ1xuICBwcml2YXRlIHN0YXRpYyBhc3luYyBwcm9jZXNzUGRmRmlsZShmaWxlOiBGaWxlLCBtYXhQYWdlcyA9IDApOiBQcm9taXNlPEJsb2JbXT4ge1xuICAgIGNvbnN0IGFycmF5QnVmZmVyID0gYXdhaXQgZmlsZS5hcnJheUJ1ZmZlcigpO1xuICAgIGNvbnN0IHBkZjogUERGRG9jdW1lbnRQcm94eSA9IGF3YWl0IHBkZmpzTGliLmdldERvY3VtZW50KHsgZGF0YTogYXJyYXlCdWZmZXIgfSkucHJvbWlzZTtcbiAgICBjb25zdCBpbWFnZXM6IEJsb2JbXSA9IFtdO1xuICAgIGNvbnN0IHBhZ2VzVG9Qcm9jZXNzID0gbWF4UGFnZXMgPiAwID8gTWF0aC5taW4obWF4UGFnZXMsIHBkZi5udW1QYWdlcykgOiBwZGYubnVtUGFnZXM7XG5cbiAgICB3aW5kb3cuY29kYmkubG9nKFxuICAgICAgXCJJTkZPXCIsXG4gICAgICBgUHJvY2Vzc2luZyBQREYgd2l0aCAke3BkZi5udW1QYWdlc30gcGFnZShzKSwgbGltaXRpbmcgdG8gJHtwYWdlc1RvUHJvY2Vzc30gcGFnZShzKTogJHtmaWxlLm5hbWV9YCxcbiAgICAgIFwiQUkgLyBMTEFNQSAvIENIQVRcIixcbiAgICApO1xuXG4gICAgZm9yIChsZXQgcGFnZU51bSA9IDE7IHBhZ2VOdW0gPD0gcGFnZXNUb1Byb2Nlc3M7IHBhZ2VOdW0rKykge1xuICAgICAgY29uc3QgcGFnZSA9IGF3YWl0IHBkZi5nZXRQYWdlKHBhZ2VOdW0pO1xuICAgICAgY29uc3QgdGV4dENvbnRlbnQgPSBhd2FpdCBwYWdlLmdldFRleHRDb250ZW50KCk7XG4gICAgICBjb25zdCB0ZXh0TGVuZ3RoID0gdGV4dENvbnRlbnQuaXRlbXNcbiAgICAgICAgLm1hcCgoaXRlbSkgPT4gKFwic3RyXCIgaW4gaXRlbSA/IGl0ZW0uc3RyIDogXCJcIikpXG4gICAgICAgIC5qb2luKFwiXCIpXG4gICAgICAgIC50cmltKCkubGVuZ3RoO1xuXG4gICAgICBpZiAodGV4dExlbmd0aCA+IDEwMCkge1xuICAgICAgICB3aW5kb3cuY29kYmkubG9nKFxuICAgICAgICAgIFwiSU5GT1wiLFxuICAgICAgICAgIGBQREYgcGFnZSAke3BhZ2VOdW19IGNvbnRhaW5zICR7dGV4dExlbmd0aH0gY2hhcmFjdGVycyBvZiB0ZXh0IFxcdTIwMTQgcmVuZGVyaW5nIHRvIGltYWdlYCxcbiAgICAgICAgICBcIkFJIC8gTExBTUEgLyBDSEFUXCIsXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IEFJX0xMQU1BX0NIQVQucmVuZGVyUGRmUGFnZVRvSW1hZ2UocGFnZSk7XG5cbiAgICAgICAgaW1hZ2VzLnB1c2goYmxvYik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3aW5kb3cuY29kYmkubG9nKFxuICAgICAgICAgIFwiSU5GT1wiLFxuICAgICAgICAgIGBQREYgcGFnZSAke3BhZ2VOdW19IGhhcyBtaW5pbWFsIHRleHQgKCR7dGV4dExlbmd0aH0gY2hhcnMpIFxcdTIwMTQgYXR0ZW1wdGluZyBpbWFnZSBleHRyYWN0aW9uYCxcbiAgICAgICAgICBcIkFJIC8gTExBTUEgLyBDSEFUXCIsXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgZXh0cmFjdGVkSW1hZ2VzID0gYXdhaXQgQUlfTExBTUFfQ0hBVC5leHRyYWN0SW1hZ2VzRnJvbVBkZlBhZ2UocGFnZSk7XG5cbiAgICAgICAgaWYgKGV4dHJhY3RlZEltYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgaW1hZ2VzLnB1c2goLi4uZXh0cmFjdGVkSW1hZ2VzKTtcbiAgICAgICAgICB3aW5kb3cuY29kYmkubG9nKFxuICAgICAgICAgICAgXCJJTkZPXCIsXG4gICAgICAgICAgICBgRXh0cmFjdGVkICR7ZXh0cmFjdGVkSW1hZ2VzLmxlbmd0aH0gaW1hZ2UocykgZnJvbSBQREYgcGFnZSAke3BhZ2VOdW19YCxcbiAgICAgICAgICAgIFwiQUkgLyBMTEFNQSAvIENIQVRcIixcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHdpbmRvdy5jb2RiaS5sb2coXG4gICAgICAgICAgICBcIklORk9cIixcbiAgICAgICAgICAgIGBObyBleHRyYWN0YWJsZSBpbWFnZXMgZm91bmQgb24gcGFnZSAke3BhZ2VOdW19IFxcdTIwMTQgcmVuZGVyaW5nIHBhZ2UgdG8gaW1hZ2VgLFxuICAgICAgICAgICAgXCJBSSAvIExMQU1BIC8gQ0hBVFwiLFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBjb25zdCBibG9iID0gYXdhaXQgQUlfTExBTUFfQ0hBVC5yZW5kZXJQZGZQYWdlVG9JbWFnZShwYWdlKTtcblxuICAgICAgICAgIGltYWdlcy5wdXNoKGJsb2IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGltYWdlcztcbiAgfVxuICAvKipcbiAgICogUmVuZGVycyBhIFBERiBwYWdlIHRvIGFuIGltYWdlIGJ5IGRyYXdpbmcgaXQgb24gYSBjYW52YXMgYW5kIGNvbnZlcnRpbmcgdGhlIGNhbnZhcyB0byBhIFBORyBmaWxlLlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBUaGUgUERGIHBhZ2UgdG8gcmVuZGVyLlxuICAgKlxuICAgKiBAcmV0dXJuIEEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGEgRmlsZSBjb250YWluaW5nIHRoZSByZW5kZXJlZCBpbWFnZSBvZiB0aGUgUERGIHBhZ2UuICovXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIHJlbmRlclBkZlBhZ2VUb0ltYWdlKHBhZ2U6IFBERlBhZ2VQcm94eSk6IFByb21pc2U8RmlsZT4ge1xuICAgIGNvbnN0IHZpZXdwb3J0ID0gcGFnZS5nZXRWaWV3cG9ydCh7IHNjYWxlOiAyLjAgfSk7XG4gICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcblxuICAgIGlmICghY29udGV4dCkge1xuICAgICAgdGhyb3cgbmV3IENvZEJpRXJyb3IoXCJGYWlsZWQgdG8gZ2V0IGNhbnZhcyAyRCBjb250ZXh0XCIpO1xuICAgIH1cblxuICAgIGNhbnZhcy53aWR0aCA9IHZpZXdwb3J0LndpZHRoO1xuICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG5cbiAgICBhd2FpdCBwYWdlLnJlbmRlcih7IGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsIHZpZXdwb3J0OiB2aWV3cG9ydCB9KS5wcm9taXNlO1xuXG4gICAgcmV0dXJuIEFJX0xMQU1BX0NIQVQuY2FudmFzVG9GaWxlKGNhbnZhcywgXCJwYWdlLnBuZ1wiKTtcbiAgfVxuICAvKipcbiAgICogQXR0ZW1wdHMgdG8gZXh0cmFjdCBpbWFnZXMgZnJvbSBhIFBERiBwYWdlIGJ5IGFuYWx5emluZyBpdHMgb3BlcmF0b3IgbGlzdCBmb3IgaW1hZ2UgcGFpbnRpbmcgb3BlcmF0aW9ucy5cbiAgICogRm9yIGVhY2ggZGV0ZWN0ZWQgaW1hZ2Ugb3BlcmF0aW9uLCBpdCByZXRyaWV2ZXMgdGhlIGltYWdlIGRhdGEgZnJvbSB0aGUgcGFnZSdzIHJlc291cmNlcyxcbiAgICogZHJhd3MgaXQgb250byBhIGNhbnZhcywgYW5kIGNvbnZlcnRzIHRoZSBjYW52YXMgdG8gYSBQTkcgZmlsZS5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgVGhlIFBERiBwYWdlIGZyb20gd2hpY2ggdG8gZXh0cmFjdCBpbWFnZXMuXG4gICAqXG4gICAqIEByZXR1cm4gQSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYW4gYXJyYXkgb2Yge0BsaW5rIEJsb2IgfXMsIGVhY2ggY29udGFpbmluZyBhbiBleHRyYWN0ZWQgaW1hZ2UgZnJvbSB0aGUgUERGIHBhZ2UuICovXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIGV4dHJhY3RJbWFnZXNGcm9tUGRmUGFnZShwYWdlOiBQREZQYWdlUHJveHkpOiBQcm9taXNlPEJsb2JbXT4ge1xuICAgIGNvbnN0IGltYWdlczogQmxvYltdID0gW107XG5cbiAgICB0cnkge1xuICAgICAgY29uc3Qgb3BlcmF0b3JMaXN0ID0gYXdhaXQgcGFnZS5nZXRPcGVyYXRvckxpc3QoKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcGVyYXRvckxpc3QuZm5BcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBmbiA9IG9wZXJhdG9yTGlzdC5mbkFycmF5W2ldO1xuXG4gICAgICAgIGlmIChmbiA9PT0gcGRmanNMaWIuT1BTLnBhaW50SW1hZ2VYT2JqZWN0IHx8IGZuID09PSBwZGZqc0xpYi5PUFMucGFpbnRJbmxpbmVJbWFnZVhPYmplY3QpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgaW1hZ2VOYW1lID0gb3BlcmF0b3JMaXN0LmFyZ3NBcnJheVtpXVswXTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBpbWFnZU5hbWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgY29uc3QgcmVzb3VyY2VzID0gYXdhaXQgcGFnZS5vYmpzLmdldChpbWFnZU5hbWUpO1xuXG4gICAgICAgICAgICAgIGlmIChyZXNvdXJjZXM/LmRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG5cbiAgICAgICAgICAgICAgICBpZiAoY3R4ICYmIHJlc291cmNlcy53aWR0aCAmJiByZXNvdXJjZXMuaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICBjYW52YXMud2lkdGggPSByZXNvdXJjZXMud2lkdGg7XG4gICAgICAgICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gcmVzb3VyY2VzLmhlaWdodDtcblxuICAgICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VEYXRhID0gbmV3IEltYWdlRGF0YShcbiAgICAgICAgICAgICAgICAgICAgbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KHJlc291cmNlcy5kYXRhKSxcblxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXMud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlcy5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKGltYWdlRGF0YSwgMCwgMCk7XG5cbiAgICAgICAgICAgICAgICAgIGltYWdlcy5wdXNoKEFJX0xMQU1BX0NIQVQuY2FudmFzVG9GaWxlKGNhbnZhcywgYCR7aW1hZ2VOYW1lfS5wbmdgKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoaW1nRXJyb3IpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jb2RiaS5sb2coXCJXQVJOSU5HXCIsIGBGYWlsZWQgdG8gZXh0cmFjdCBpbmRpdmlkdWFsIGltYWdlOiAke2ltZ0Vycm9yfWAsIFwiQUkgLyBMTEFNQSAvIENIQVRcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHdpbmRvdy5jb2RiaS5sb2coXCJXQVJOSU5HXCIsIGBJbWFnZSBleHRyYWN0aW9uIGZhaWxlZDogJHtlcnJvcn1gLCBcIkFJIC8gTExBTUEgLyBDSEFUXCIpO1xuICAgIH1cblxuICAgIHJldHVybiBpbWFnZXM7XG4gIH1cbiAgLy8gI2VuZHJlZ2lvbiBQREYtUHJvY2Vzc2luZ1xufVxuLy8gI3JlZ2lvbiBSZWdpc3RlciB3aXRoIENvZEJpXG53aW5kb3cuY29kYmkucmVnaXN0ZXJGdW5jdGlvbmFsaXR5KFwiQUkuTExBTUEuQ0hBVFwiLCBBSV9MTEFNQV9DSEFULmZ1bmN0aW9uYWxpdHkuYmluZChBSV9MTEFNQV9DSEFUKSk7XG4vLyAjZW5kcmVnaW9uIFJlZ2lzdGVyIHdpdGggQ29kQmlcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLDhCQUEwQjtBQWExQixlQUEwQjtBQWNuQixJQUFNLGlCQUFOLE1BQU0sZUFBYztBQUFBLEVBcUd6QixPQUFjLGNBaUJaLFFBT0EsV0FDTTtBQUVOLFVBQU0sUUFBSSxtQ0FBVTtBQUNwQixVQUFNLGNBQWM7QUFDcEIsVUFBTSxhQUFhLE9BQU8sVUFBVSxPQUFPLE9BQU8sT0FBTyxNQUFNLElBQUk7QUFDbkUsVUFBTSxlQUFlLE9BQU8sb0JBQW9CLE9BQU8sT0FBTyxPQUFPLGdCQUFnQixFQUFFLEtB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
