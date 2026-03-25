import { GREATER } from "./chunk-S6DBGVOR.js";
import { OR } from "./chunk-YYG42PYR.js";
import { formatWaitTime } from "./chunk-IEBHCVNB.js";
import { generateUUID } from "./chunk-NKLWL4ZS.js";
import "./chunk-JP4GUAZX.js";
import { IF } from "./chunk-2VQP2CFN.js";
import { REGEX } from "./chunk-F3IDEOQS.js";
import { TYPE } from "./chunk-O5T7YW22.js";
import { INSTANCE } from "./chunk-53TEMTGA.js";
import { DBC } from "./chunk-LFRFVRJV.js";
import { require_dist } from "./chunk-ZTMSSRTV.js";
import { __decorateClass, __decorateParam, __toESM } from "./chunk-AOJQKO6T.js";

// src/js/Functionalities/ai.llama.standard.txtqa.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var _AI_LLAMA_STANDARD_TXTQA = class _AI_LLAMA_STANDARD_TXTQA {
  static {
    /** Unique session ID generated on page load — ensures each session gets its own llama-server slot. */
    this.PAGE_SESSION_ID = generateUUID();
  }
  static functionality(toLoad, toProcess) {
    const tagName = toProcess.tagName.toUpperCase();
    const inputType = toProcess.type?.toLowerCase();
    if (tagName !== "TEXTAREA" && !(tagName === "INPUT" && inputType === "text")) {
      window.codbi.log(
        "ERROR",
        `ai.llama.standard.txtqa requires an <input type="text"> or <textarea>, got <${tagName.toLowerCase()}${inputType ? ` type="${inputType}"` : ""}>`,
        "AI / LLAMA / TXTQA",
      );
      return;
    }
    const debounceMs = toLoad.debounce ? Number(toLoad.debounce) : 500;
    const inferenceDelayMs = (toLoad.inferencedelay ? Number(toLoad.inferencedelay) : 5) * 1e3;
    let debounceTimer = null;
    let inferenceDelayTimer = null;
    let inferenceStarted = false;
    const aiHintText = toLoad.aihint != null ? `\u2728 ${String(toLoad.aihint)}` : "\u2728 AI-Generated";
    const internetAccess = toLoad.useinternet != null && String(toLoad.useinternet).toLowerCase() === "true";
    const locationAccess = toLoad.location != null && String(toLoad.location).toLowerCase() === "true";
    const responseLanguage = toLoad.language != null ? String(toLoad.language).trim() : "";
    const responseLang = toLoad.responselanguage != null ? String(toLoad.responselanguage).trim() : "";
    const specialist = toLoad.specialist != null ? String(toLoad.specialist).trim() : "";
    const $ = (0, import_fc_form_renderer.getJQuery)();
    const handleChange = async (force = false) => {
      const immediateCX2 = toProcess.closest(".CXContainer");
      let container;
      if (immediateCX2?.classList.contains("AI_LLAMA_QA_Exclude")) {
        container = immediateCX2;
      } else {
        container = immediateCX2?.parentElement?.closest(".CXContainer") ?? immediateCX2;
      }
      if (!container) {
        window.codbi.log(
          "ERROR",
          `Could not find ancestor .CXContainer for element #${toProcess.getAttribute("id")}`,
          "AI / LLAMA / TXTQA",
        );
        return;
      }
      if (!force) {
        const sourceElements = container.querySelectorAll(".AI_LLAMA_TXTQA_Source");
        for (const srcEl of sourceElements) {
          const val = srcEl.value?.trim();
          if (!val) {
            return;
          }
        }
      }
      if (inferenceDelayTimer) {
        clearTimeout(inferenceDelayTimer);
        inferenceDelayTimer = null;
      }
      if (inferenceStarted) {
        return;
      }
      inferenceStarted = true;
      const allQuestionElements = container.querySelectorAll(".AI_LLAMA_STANDARD_TXTQA_Question");
      const questionElements = [];
      for (const qEl of allQuestionElements) {
        const innerContainer = qEl.closest(".CXContainer");
        if (
          innerContainer &&
          innerContainer !== container &&
          innerContainer.classList.contains("AI_LLAMA_QA_Exclude")
        ) {
          continue;
        }
        questionElements.push(qEl);
      }
      const headers = {};
      headers["X-Session-Id"] = _AI_LLAMA_STANDARD_TXTQA.PAGE_SESSION_ID;
      headers["X-Search"] = internetAccess ? "true" : "false";
      if (toLoad.filterresults != null) {
        headers["X-Filter-Results"] = String(toLoad.filterresults).toLowerCase() === "true" ? "true" : "false";
      }
      if (responseLang) {
        headers["X-Forced-Language"] = responseLang;
      }
      if (specialist) {
        headers["X-Specialist"] = specialist;
      }
      if (locationAccess) {
        headers["X-Location"] = "true";
        if (navigator.geolocation) {
          try {
            const pos = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 5e3,
                maximumAge: 3e5,
              });
            });
            headers["X-Latitude"] = pos.coords.latitude.toFixed(4);
            headers["X-Longitude"] = pos.coords.longitude.toFixed(4);
          } catch (geoErr) {
            window.codbi.log("WARNING", `Geolocation unavailable: ${geoErr}`, "AI / LLAMA / TXTQA");
          }
        }
      }
      for (const element of questionElements) {
        const id = element.id;
        let question = element.getAttribute("data-cb-Question");
        if (id && question) {
          question = question.replace(/<\[([^\]]+)\]>/g, (match, identifier) => {
            const trimmed = identifier.trim();
            const field = document.querySelector(`.${trimmed}`);
            if (field && "value" in field) {
              return field.value;
            }
            return match;
          });
          if (responseLanguage) {
            question = `${question} Answer in ${responseLanguage}.`;
          }
          headers[`X-Question-${id}`] = btoa(unescape(encodeURIComponent(question)));
        } else {
          if (!id) {
            window.codbi.log(
              "WARNING",
              `Question element missing id attribute in: ${element.outerHTML}`,
              "AI / LLAMA / TXTQA",
            );
          }
          if (!question) {
            window.codbi.log(
              "WARNING",
              `Question element with id "${id}" missing data-cb-Question attribute`,
              "AI / LLAMA / TXTQA",
            );
          }
        }
      }
      if (!Object.keys(headers).some((k) => k.startsWith("X-Question-"))) {
        window.codbi.log("WARNING", "No questions found \u2014 nothing to send", "AI / LLAMA / TXTQA");
        return;
      }
      if (!document.querySelector("#LLAMA_TXTQA_Processing_Styles")) {
        const style = document.createElement("style");
        style.id = "LLAMA_TXTQA_Processing_Styles";
        style.textContent = `
                  @keyframes LLAMA_ResponseReady {
                    0%   { background-color: rgba(76,175,80,0.35); }
                    100% { background-color: transparent; }}
                  .LLAMA_ResponseReady { animation: LLAMA_ResponseReady 1.5s ease-out ;}
                  .LLAMA_TXTQA_RichAnswer {
                    padding: 6px 8px ; border: 1px solid #ccc ; border-radius: 4px ;
                    background: #fafafa ; white-space: pre-wrap ; word-break: break-word ;
                    font-size: inherit ; line-height: 1.5 ; cursor: text ; min-height: 2em ;}
                  .LLAMA_TXTQA_RichAnswer:hover { border-color: #999 ;}
                  .LLAMA_Chat_SourceBadge {
                    display: inline-flex ; align-items: center ;
                    padding: 2px 10px ; border-radius: 12px ;
                    background: rgba(11,106,191,0.1) ; font-size: 12px ;
                    transition: background 0.15s ;}
                  .LLAMA_Chat_SourceBadge:hover { background: rgba(11,106,191,0.2) ;}
                  .LLAMA_Chat_SourceBadge a { color: #0b6abf ; text-decoration: none ; word-break: normal ;}
                  .LLAMA_Chat_SourceBadge a:hover { text-decoration: underline ;}
                  .LLAMA_Chat_PhoneBadge,
                  .LLAMA_Chat_EmailBadge {
                    display: inline-flex ; align-items: center ; gap: 4px ;
                    padding: 2px 10px ; border-radius: 12px ;
                    font-size: 12px ; transition: background 0.15s ;}
                  .LLAMA_Chat_PhoneBadge { background: rgba(40,167,69,0.12) ;}
                  .LLAMA_Chat_PhoneBadge:hover { background: rgba(40,167,69,0.22) ;}
                  .LLAMA_Chat_EmailBadge { background: rgba(220,130,0,0.12) ;}
                  .LLAMA_Chat_EmailBadge:hover { background: rgba(220,130,0,0.22) ;}
                  .LLAMA_Chat_PhoneBadge a { color: #28a745 ; text-decoration: none ; word-break: normal ;}
                  .LLAMA_Chat_EmailBadge a { color: #c27800 ; text-decoration: none ; word-break: normal ;}
                  .LLAMA_Chat_PhoneBadge a:hover,
                  .LLAMA_Chat_EmailBadge a:hover { text-decoration: underline ;}
                  .LLAMA_Chat_BadgeIcon { font-size: 13px ; line-height: 1 ;}`;
        document.head.appendChild(style);
      }
      const tsToProcess = toProcess;
      tsToProcess.style.pointerEvents = "none";
      tsToProcess.style.opacity = "0.5";
      for (const element of questionElements) {
        const field = document.querySelector(`#${element.id}`);
        if (field) {
          field.disabled = true;
          field.style.opacity = "0.5";
          window.codbi.injectLoadingAnim(field);
        }
      }
      const disabledSources = [];
      if (container) {
        for (const srcEl of container.querySelectorAll(".AI_LLAMA_TXTQA_Source")) {
          const el = srcEl;
          el.disabled = true;
          el.style.opacity = "0.5";
          disabledSources.push(el);
        }
      }
      let completedCount = 0;
      const totalQuestions = questionElements.length;
      const finalizeAll = () => {
        tsToProcess.style.pointerEvents = "all";
        tsToProcess.style.opacity = "1";
        for (const el of disabledSources) {
          el.disabled = false;
          el.style.opacity = "1";
        }
        inferenceStarted = false;
      };
      const sharedHeaders = {};
      for (const key of Object.keys(headers)) {
        if (!key.startsWith("X-Question-")) {
          sharedHeaders[key] = headers[key];
        }
      }
      const txtQaQueueOverride = toLoad.queuebadge != null ? String(toLoad.queuebadge) !== "false" : null;
      const txtQaQueueText = toLoad.queuetext != null ? String(toLoad.queuetext) : "";
      for (const element of questionElements) {
        const id = element.id;
        const questionHeader = headers[`X-Question-${id}`];
        if (!questionHeader) {
          completedCount++;
          if (completedCount >= totalQuestions) {
            finalizeAll();
          }
          continue;
        }
        const perQuestionHeaders = {
          ...sharedHeaders,
          [`X-Question-${id}`]: questionHeader,
        };
        let fieldQueueBadge = null;
        const showFieldQueueBadge = (position, estimatedWaitMs) => {
          const field = document.querySelector(`#${id}`);
          if (!fieldQueueBadge && field) {
            fieldQueueBadge = document.createElement("span");
            fieldQueueBadge.className = "LLAMA_QueueBadge";
            fieldQueueBadge.style.cssText =
              "display:inline-flex;align-items:center;gap:4px;margin-left:6px;padding:2px 8px;border-radius:10px;background:#d0e0ff;color:#1a5aab;font-size:12px;font-weight:600;white-space:nowrap;";
            field.parentElement?.appendChild(fieldQueueBadge);
          }
          if (fieldQueueBadge) {
            const waitLabel = formatWaitTime(estimatedWaitMs);
            fieldQueueBadge.textContent = `${position}${waitLabel ? ` ${waitLabel}` : ""}${txtQaQueueText ? ` ${txtQaQueueText}` : ""}`;
          }
        };
        const hideFieldQueueBadge = () => {
          fieldQueueBadge?.remove();
          fieldQueueBadge = null;
        };
        let txtQaQueueTicket = null;
        const sendTxtQaRequest = () => {
          $.ajax({
            url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
            type: "POST",
            data: new FormData(),
            dataType: "json",
            processData: false,
            contentType: false,
            cache: false,
            beforeSend: (xhr) => {
              for (const headerName of Object.keys(perQuestionHeaders)) {
                xhr.setRequestHeader(headerName, perQuestionHeaders[headerName]);
              }
              if (txtQaQueueTicket) {
                xhr.setRequestHeader("X-Queue-Ticket", txtQaQueueTicket);
              }
            },
            // #region Success callback — populate answer field
            success: (response) => {
              if (response.queued) {
                txtQaQueueTicket = response.queueTicket ?? txtQaQueueTicket;
                const badgeEnabled = txtQaQueueOverride != null ? txtQaQueueOverride : !!response.queueBadge;
                if (badgeEnabled) {
                  showFieldQueueBadge(response.position ?? 0, response.estimatedWaitMs);
                }
                setTimeout(sendTxtQaRequest, 1e3);
                return;
              }
              hideFieldQueueBadge();
              txtQaQueueTicket = null;
              const field = document.querySelector(`#${id}`);
              if (field) {
                field.disabled = false;
                field.style.opacity = "1";
                window.codbi.removeLoaderAnim(field);
                const answerText = response[id]?.answer;
                if (answerText != null) {
                  field.value = answerText;
                  if (field.tagName.toUpperCase() === "TEXTAREA") {
                    field.style.height = "auto";
                    field.style.height = `${field.scrollHeight}px`;
                  }
                  if (aiHintText) {
                    _AI_LLAMA_STANDARD_TXTQA.attachAiHint(field, aiHintText);
                  }
                  _AI_LLAMA_STANDARD_TXTQA.showRichAnswer(field, answerText);
                  const richDiv = INSTANCE.tsCheck(
                    field.nextElementSibling?.classList.contains("LLAMA_TXTQA_RichAnswer")
                      ? field.nextElementSibling
                      : field,
                    HTMLElement,
                  );
                  richDiv.classList.remove("LLAMA_ResponseReady");
                  void richDiv.offsetWidth;
                  richDiv.classList.add("LLAMA_ResponseReady");
                  richDiv.addEventListener("animationend", () => richDiv.classList.remove("LLAMA_ResponseReady"), {
                    once: true,
                  });
                  field.dispatchEvent(new Event("change", { bubbles: true }));
                }
              }
              if (field) {
                field.disabled = false;
                field.style.opacity = "1";
                window.codbi.removeLoaderAnim(field);
              }
              if (response.error) {
                window.codbi.log("ERROR", `REST failed for "${id}": ${response.error}`, "AI / LLAMA / TXTQA");
              }
              completedCount++;
              if (completedCount >= totalQuestions) {
                finalizeAll();
              }
            },
            // #endregion Success callback — populate answer field
            // #region Error callback
            error: (_xhr, status, error) => {
              hideFieldQueueBadge();
              const field = document.querySelector(`#${id}`);
              if (field) {
                field.disabled = false;
                field.style.opacity = "1";
                window.codbi.removeLoaderAnim(field);
              }
              window.codbi.log(
                "ERROR",
                `REST failed for "${id}" with status "${status}" cause: "${error}"`,
                "AI / LLAMA / TXTQA",
              );
              completedCount++;
              if (completedCount >= totalQuestions) {
                finalizeAll();
              }
            },
            // #endregion Error callback
          });
        };
        sendTxtQaRequest();
      }
    };
    const debouncedHandle = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        handleChange();
      }, debounceMs);
      if (!inferenceDelayTimer && !inferenceStarted) {
        inferenceDelayTimer = setTimeout(() => {
          inferenceDelayTimer = null;
          handleChange(true);
        }, inferenceDelayMs);
      }
    };
    toProcess.addEventListener("change", debouncedHandle);
    const immediateCX = toProcess.closest(".CXContainer");
    const sourceContainer = immediateCX?.parentElement?.closest(".CXContainer") ?? immediateCX;
    if (sourceContainer) {
      for (const srcEl of sourceContainer.querySelectorAll(".AI_LLAMA_TXTQA_Source")) {
        srcEl.addEventListener("focusout", debouncedHandle);
        srcEl.addEventListener("focus", () => {
          if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
          }
        });
      }
    }
  }
  // #region Rich-text answer overlay (clickable links, phones, emails)
  /**
   * Hides the answer field and shows a rich-text div with clickable links,
   * phone numbers and email addresses. Clicking the div reveals the field for editing.
   *
   * @param field The input or textarea field containing the AI answer.
   * @param text The AI answer text to display in the rich overlay (may contain Markdown links). */
  static showRichAnswer(field, text) {
    const wrapper = field.closest(".LLAMA_AI_Hint_Wrapper") ?? field.parentElement;
    const existing = wrapper?.querySelector(".LLAMA_TXTQA_RichAnswer");
    if (existing) {
      existing.remove();
    }
    const richDiv = document.createElement("div");
    richDiv.className = "LLAMA_TXTQA_RichAnswer";
    richDiv.innerHTML = _AI_LLAMA_STANDARD_TXTQA.linkifyUrls(text);
    field.style.display = "none";
    if (field.nextSibling) {
      field.parentElement?.insertBefore(richDiv, field.nextSibling);
    } else {
      field.parentElement?.appendChild(richDiv);
    }
    richDiv.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        return;
      }
      richDiv.style.display = "none";
      field.style.display = "";
      field.focus();
    });
    field.addEventListener(
      "blur",
      () => {
        richDiv.innerHTML = _AI_LLAMA_STANDARD_TXTQA.linkifyUrls(field.value);
        richDiv.style.display = "";
        field.style.display = "none";
      },
      { once: true },
    );
  }
  /**
   * HTML-escapes the given plain text, then converts:
   *   1. Markdown links `[label](url)` → clickable `<a>` with the label text
   *   2. Bare URLs (`https://…` / `http://…`) → clickable `<a>` showing the hostname
   *   3. Phone numbers → clickable `tel:` link in a badge
   *   4. Email addresses → clickable `mailto:` link in a badge
   *
   * @param text The AI answer text to convert into rich HTML.
   *
   * @returns The resulting HTML string with links and badges. */
  static linkifyUrls(text) {
    const links = [];
    const placeholder = (idx) => `\0LINK${idx}\0`;
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const withMd = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, (_match, label, url) => {
      const idx = links.length;
      links.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
      return placeholder(idx);
    });
    const withUrls = withMd.replace(/https?:\/\/[^\s<>&"'\x00)\]]+/gi, (url) => {
      let label = url;
      try {
        const u = new URL(url);
        label = u.hostname.replace(/^www\./, "");
      } catch {}
      const idx = links.length;
      links.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
      return placeholder(idx);
    });
    const withPhones = withUrls.replace(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.\/-]?){1,3}\d{1,8}/g, (match) => {
      const digitsOnly = match.replace(/\D/g, "");
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        return match;
      }
      if (/^\d{4}\s*[-\u2013\u2014]\s*\d{4}$/.test(match.trim())) {
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
    });
    const withEmails = withPhones.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, (match) => {
      const idx = links.length;
      links.push(
        `<span class="LLAMA_Chat_EmailBadge"><span class="LLAMA_Chat_BadgeIcon">\u2709</span><a href="mailto:${match}">${match}</a></span>`,
      );
      return placeholder(idx);
    });
    return withEmails.replace(/\x00LINK(\d+)\x00/g, (_m, idx) => {
      const html = links[Number(idx)];
      if (html.startsWith('<span class="LLAMA_Chat_Phone') || html.startsWith('<span class="LLAMA_Chat_Email')) {
        return html;
      }
      return `<span class="LLAMA_Chat_SourceBadge">${html}</span>`;
    });
  }
  // #endregion Rich-text answer overlay
  // #region AI-Generated hint
  static ensureAiHintStyles() {
    if (document.querySelector("#LLAMA_AI_Hint_Styles")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "LLAMA_AI_Hint_Styles";
    style.textContent = `
      .LLAMA_AI_Hint_Wrapper { position: relative ; display: block ; width: 100% ;}
      .LLAMA_AI_Hint { position: absolute ; pointer-events: none ; color: rgba(0,0,0,0.38) ;
        font-size: 11px ; line-height: 1 ; white-space: nowrap ; user-select: none ;
        right: 8px ; bottom: 6px ; z-index: 1 ;}`;
    document.head.appendChild(style);
  }
  /**
   * Attaches an AI-generated hint to the specified input or textarea field.
   *
   * @param field     The input or textarea element to attach the hint to.
   * @param hintText  The text of the AI-generated hint. */
  static attachAiHint(field, hintText) {
    _AI_LLAMA_STANDARD_TXTQA.ensureAiHintStyles();
    const existingHint = field.parentElement?.querySelector(".LLAMA_AI_Hint");
    if (existingHint) {
      existingHint.remove();
    }
    let wrapper = field.parentElement;
    if (!wrapper?.classList.contains("LLAMA_AI_Hint_Wrapper")) {
      wrapper = document.createElement("span");
      wrapper.className = "LLAMA_AI_Hint_Wrapper";
      field.parentElement?.insertBefore(wrapper, field);
      wrapper.appendChild(field);
    }
    const badge = document.createElement("span");
    badge.className = "LLAMA_AI_Hint";
    badge.textContent = hintText;
    wrapper.appendChild(badge);
    const removeHint = () => {
      badge.remove();
      field.removeEventListener("input", removeHint);
    };
    field.addEventListener("input", removeHint);
  }
  // #endregion AI-Generated hint
};
__decorateClass(
  [
    DBC.ParamvalueProvider,
    __decorateParam(0, TYPE.PRE("string", "aihint, language, responselanguage, specialist, queuebadge, queuetext")),
    __decorateParam(0, TYPE.PRE("string | boolean", "useinternet, location")),
    __decorateParam(
      0,
      GREATER.PRE(
        3,
        true,
        false,
        "aihint.length",
        "According to the EU AI Act, AI-generated content must be clearly labeled. Changing or disabling the AIHint may lead to non-compliance in certain jurisdictions.",
      ),
    ),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "useinternet")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "location")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "debounce")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "inferencedelay")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^[a-z]{2}$/i), "responselanguage")),
    __decorateParam(0, OR.PRE([new TYPE("string"), new TYPE("boolean")], "filterresults")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "filterresults")),
    __decorateParam(
      1,
      INSTANCE.PRE(
        HTMLInputElement,
        void 0,
        'Is it not an <input type="text"/> or <textarea> that is tagged with this functionality?',
      ),
    ),
  ],
  _AI_LLAMA_STANDARD_TXTQA,
  "functionality",
  1,
);
var AI_LLAMA_STANDARD_TXTQA = _AI_LLAMA_STANDARD_TXTQA;
window.codbi.registerFunctionality(
  "AI.LLAMA.STANDARD.TXTQA",
  AI_LLAMA_STANDARD_TXTQA.functionality.bind(AI_LLAMA_STANDARD_TXTQA),
);
export { AI_LLAMA_STANDARD_TXTQA };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9haS5sbGFtYS5zdGFuZGFyZC50eHRxYS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIFhJTUFcbmltcG9ydCB7IGdldEpRdWVyeSB9IGZyb20gXCJAZGUteGltYS9mYy1mb3JtLXJlbmRlcmVyXCI7XG5pbXBvcnQgeyBnZW5lcmF0ZVVVSUQgfSBmcm9tIFwiLi4vZ2xvYmFsLXNjb3BlXCI7XG4vLyAjZW5kcmVnaW9uIFhJTUFcbi8vICNyZWdpb24gWERCQ1xuaW1wb3J0IHsgREJDIH0gZnJvbSBcInhkYmMvc3JjL0RCQ1wiO1xuaW1wb3J0IHsgVFlQRSB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvVFlQRVwiO1xuaW1wb3J0IHsgSUYgfSBmcm9tIFwieGRiYy9zcmMvREJDL0lGXCI7XG5pbXBvcnQgeyBJTlNUQU5DRSB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvSU5TVEFOQ0VcIjtcbmltcG9ydCB7IFJFR0VYIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9SRUdFWFwiO1xuaW1wb3J0IHsgR1JFQVRFUiB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvQ09NUEFSSVNPTi9HUkVBVEVSXCI7XG5pbXBvcnQgeyBPUiB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvT1JcIjtcbi8vICNlbmRyZWdpb24gWERCQ1xuaW1wb3J0IHsgZm9ybWF0V2FpdFRpbWUgfSBmcm9tIFwiLi4vY29tbW9ucy9mb3JtYXQtd2FpdC10aW1lXCI7XG4vLyAjZW5kcmVnaW9uIEltcG9ydHNcblxuLyoqXG4gKiBQcm92aWRlcyB0aGUge0BsaW5rIEFJX0xMQU1BX1NUQU5EQVJEX1RYVFFBLmZ1bmN0aW9uYWxpdHkgfS5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChTYWx2YXRvcmUuQ2FsbGFyaUBBbnNiYWNoLmRlKSAqL1xuLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1N0YXRpY09ubHlDbGFzczogUHJvYWN0aXZlIERlc2lnbi5cbmV4cG9ydCBjbGFzcyBBSV9MTEFNQV9TVEFOREFSRF9UWFRRQSB7XG4gIC8qKiBVbmlxdWUgc2Vzc2lvbiBJRCBnZW5lcmF0ZWQgb24gcGFnZSBsb2FkIFx1MjAxNCBlbnN1cmVzIGVhY2ggc2Vzc2lvbiBnZXRzIGl0cyBvd24gbGxhbWEtc2VydmVyIHNsb3QuICovXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IFBBR0VfU0VTU0lPTl9JRDogc3RyaW5nID0gZ2VuZXJhdGVVVUlEKCk7XG4gIC8qKlxuICAgKiBUaGlzIGZ1bmN0aW9uYWxpdHkgYW5zd2VycyBxdWVzdGlvbnMgYmFzZWQgb24gdGhlIHRleHQgY29udGVudCBvZiBvbmUgb3IgbW9yZSAqIHtAbGluayBIVE1MSW5wdXRFbGVtZW50IH0gb2YgdHlwZSBcInRleHRcIiBvclxuICAgKiB7QGxpbmsgSFRNTFRleHRBcmVhRWxlbWVudCB9IGVsZW1lbnRzLiBJdCBpcyB0cmlnZ2VyZWQgd2hlbmV2ZXIgYW55IG9mIHRoZSBzb3VyY2UgdGV4dCBmaWVsZHMgY2hhbmdlLlxuICAgKlxuICAgKiBNdWx0aXBsZSB0cmlnZ2VyIGVsZW1lbnRzIHRhZ2dlZCB3aXRoICoqQUlfTExBTUFfVFhUUUFfU291cmNlKiogbWF5IGV4aXN0IGluIHRoZSB3aXRoaW4gdGhlIHNhbWUgKipYQ29udGFpbmVyKiouXG4gICAqIFF1ZXN0aW9uIGVsZW1lbnRzIGFyZSB0YWdnZWQgd2l0aCB0aGUgQ1NTIGNsYXNzICoqQUlfTExBTUFfU1RBTkRBUkRfVFhUUUFfUXVlc3Rpb24qKi4gRWFjaCBxdWVzdGlvbiBlbGVtZW50IG11c3QgaGF2ZTpcbiAgICogICAgLSBBbiAqKmlkKiogYXR0cmlidXRlICh1c2VkIGFzIHRoZSBxdWVzdGlvbiBrZXkgXHUyMDE0IHRoZSBBSSByZXNwb25zZSBpcyBwbGFjZWQgaW50byB0aGUgZWxlbWVudCB3aXRoIHRoaXMgaWQpXG4gICAqICAgIC0gQSAqKmRhdGEtY2ItUXVlc3Rpb24qKiBhdHRyaWJ1dGUgY29udGFpbmluZyB0aGUgcXVlc3Rpb24gdGV4dCwgd2hpY2ggbWF5IGluY2x1ZGUgcGxhY2Vob2xkZXIgc3ltYm9scyBsaWtlXG4gICAqICAgICAgYDxbRmllbGROYW1lXT5gIHRoYXQgcmVzb2x2ZSB0byB0aGUgdmFsdWUgb2YgdGhlIGZpZWxkIHdpdGggQ1NTIGNsYXNzICoqXCJGaWVsZE5hbWVcIioqIGluIHRoZSBzYW1lIGNvbnRhaW5lci5cbiAgICogICAgICBVc2UgdGhlc2UgcGxhY2Vob2xkZXJzIHRvIGluY29ycG9yYXRlIHRoZSB0cmlnZ2VyIGVsZW1lbnQncyB2YWx1ZSBhbmQgYW55IG90aGVyIGZpZWxkIHZhbHVlcyBpbnRvIHRoZSBxdWVzdGlvbi5cbiAgICogICAgLSBOZXN0ZWQgYC5DWENvbnRhaW5lcmAgZWxlbWVudHMgdGFnZ2VkIHdpdGggKipBSV9MTEFNQV9RQV9FeGNsdWRlKiogYXJlIGV4Y2x1ZGVkIGZyb20gcXVlc3Rpb24gc2VhcmNoZXMuXG4gICAqXG4gICAqICMjIyBDb25maWcgUGFyYW1ldGVyczpcbiAgICogLSAqKkFJSGludCoqOiAgICAgICAgICBUZXh0IHNob3duIGluc2lkZSBBSS1wb3B1bGF0ZWQgZmllbGRzIHVudGlsIHRoZSB1c2VyIGVkaXRzIHRoZSB2YWx1ZS4gRGVmYXVsdDogXCJcdTI3MjggQUktR2VuZXJhdGVkXCIuXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgU2V0IGVtcHR5IHRvIGRpc2FibGUuXG4gICAqXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgTm90ZTogKipBY2NvcmRpbmcgdG8gdGhlIEVVIEFJIEFjdCwgQUktZ2VuZXJhdGVkIGNvbnRlbnQgbXVzdCBiZSBjbGVhcmx5IGxhYmVsZWQuIENoYW5naW5nIG9yXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsaW5nIHRoZSBBSUhpbnQgbWF5IGxlYWQgdG8gbm9uLWNvbXBsaWFuY2UgaW4gY2VydGFpbiBqdXJpc2RpY3Rpb25zLioqXG4gICAqIC0gKip1c2VpbnRlcm5ldCoqOiAgICAgSWYgc2V0IHRvIGB0cnVlYCwgZW5hYmxlcyBCcmF2ZSBTZWFyY2ggaW50ZXJuZXQgYWNjZXNzLiBEZWZhdWx0OiBgZmFsc2VgLlxuICAgKiAtICoqZGVib3VuY2UqKjogICAgICAgIERlYm91bmNlIGRlbGF5IGluIG1pbGxpc2Vjb25kcyBiZWZvcmUgc2VuZGluZyB0aGUgcmVxdWVzdCBhZnRlciB0aGUgbGFzdCBjaGFuZ2UgZXZlbnQuIERlZmF1bHQ6IGA1MDBgLlxuICAgKiAtICoqaW5mZXJlbmNlZGVsYXkqKjogIE1heGltdW0gc2Vjb25kcyB0byB3YWl0IGZvciBhbGwgc291cmNlIGZpZWxkcyB0byBiZSBmaWxsZWQgYmVmb3JlIHN0YXJ0aW5nIGluZmVyZW5jZSBhbnl3YXkuXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgRGVmYXVsdDogYDVgLlxuICAgKiAtICoqbG9jYXRpb24qKjogICAgICAgIElmIHNldCB0byBgdHJ1ZWAsIGVuYWJsZXMgZ2VvbG9jYXRpb24gYWNjZXNzLiBUaGUgdXNlcidzIGNvb3JkaW5hdGVzIGFyZSBzZW50IHRvIHRoZSBBSSBmb3JcbiAgICogICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbi1hd2FyZSBhbnN3ZXJzLiBEZWZhdWx0OiBgZmFsc2VgLlxuICAgKiAtICoqbGFuZ3VhZ2UqKjogICAgICAgIExhbmd1YWdlIGZvciB0aGUgQUkgcmVzcG9uc2UgKGUuZy4gXCJHZXJtYW5cIiwgXCJFbmdsaXNoXCIpLiBJZiBzZXQsIGFwcGVuZHMgXCJBbnN3ZXIgaW4ge2xhbmd1YWdlfS5cIlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgIHRvIGVhY2ggcXVlc3Rpb24uXG4gICAqIC0gKipSZXNwb25zZUxhbmd1YWdlKio6IFR3by1sZXR0ZXIgSVNPIDYzOS0xIGNvZGUgKGUuZy4gYFwiZGVcImAsIGBcImZyXCJgKS4gRm9yY2VzIHRoZSBBSSB0b1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbmQgaW4gdGhpcyBsYW5ndWFnZSwgc2tpcHBpbmcgYXV0by1kZXRlY3Rpb24uIE92ZXJyaWRlcyB0aGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICBgQUlfTExBTUFfU1REX0xhbmd1YWdlYCBwbHVnaW4gcHJvcGVydHkgZm9yIHRoaXMgaW5zdGFuY2UuXG4gICAqIC0gKipTcGVjaWFsaXN0Kio6ICAgICAgTmFtZSBvZiBhIHNwZWNpYWxpc3QgbW9kZWwgcmVnaXN0ZXJlZCB2aWEgYEFJX0xMQU1BX1NURF9TUEVDSUFMSVNUX1hYWGBcbiAgICogICAgICAgICAgICAgICAgICAgICAgICBwbHVnaW4gcHJvcGVydHkuIFJvdXRlcyByZXF1ZXN0cyB0byB0aGF0IHNwZWNpYWxpc3QncyBkZWRpY2F0ZWQgc2VydmVyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2UgKGNhc2UtaW5zZW5zaXRpdmUgbWF0Y2gpLlxuICAgKiAtICoqUXVldWVCYWRnZSoqOiAgICAgIElmIHNldCB0byBgXCJ0cnVlXCJgLCBzaG93cyBhIGJhZGdlIHdpdGggdGhlIGN1cnJlbnQgcXVldWUgcG9zaXRpb24gd2hpbGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICB3YWl0aW5nIGZvciBpbmZlcmVuY2UuIE92ZXJyaWRlcyB0aGUgYEFJX1F1ZXVlQmFkZ2VgIHBsdWdpbiBwcm9wZXJ0eVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgIGZvciB0aGlzIGluc3RhbmNlLiBEZWZhdWx0OiBkZXRlcm1pbmVkIGJ5IHBsdWdpbiBwcm9wZXJ0eS5cbiAgICogLSAqKlF1ZXVlVGV4dCoqOiAgICAgICBUZXh0IGFwcGVuZGVkIGFmdGVyIHRoZSBxdWV1ZSBwb3NpdGlvbiBudW1iZXIgaW4gdGhlIGJhZGdlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgKGUuZy4gYFwiaW4gcXVldWVcImAgXHUyMTkyIGJhZGdlIHNob3dzIGBcIjMgaW4gcXVldWVcImApLiBEZWZhdWx0OiBlbXB0eS5cbiAgICogLSAqKkZpbHRlclJlc3VsdHMqKjogICBJZiBzZXQgdG8gYFwidHJ1ZVwiYCwgZW5hYmxlcyBQSUkgZmlsdGVyaW5nIG9uIEJyYXZlIFNlYXJjaCBxdWVyaWVzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgZm9yIHRoaXMgaW5zdGFuY2UsIG92ZXJyaWRpbmcgdGhlIGdsb2JhbCBgQUlfQnJhdmVTZWFyY2hfRmlsdGVyUmVzdWx0c2BcbiAgICogICAgICAgICAgICAgICAgICAgICAgICBwbHVnaW4gcHJvcGVydHkuIERlZmF1bHQ6IGRldGVybWluZWQgYnkgcGx1Z2luIHByb3BlcnR5LlxuICAgKlxuICAgKiBAcGFyYW0gdG9Mb2FkICAgIFByb3ZpZGVkIGJ5IHRoZSBDb2RCaS5cbiAgICogQHBhcmFtIHRvUHJvY2VzcyBQcm92aWRlZCBieSB0aGUgQ29kQmkuICovXG4gIEBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyXG4gIHB1YmxpYyBzdGF0aWMgZnVuY3Rpb25hbGl0eShcbiAgICBAVFlQRS5QUkUoXCJzdHJpbmdcIiwgXCJhaWhpbnQsIGxhbmd1YWdlLCByZXNwb25zZWxhbmd1YWdlLCBzcGVjaWFsaXN0LCBxdWV1ZWJhZGdlLCBxdWV1ZXRleHRcIilcbiAgICBAVFlQRS5QUkUoXCJzdHJpbmcgfCBib29sZWFuXCIsIFwidXNlaW50ZXJuZXQsIGxvY2F0aW9uXCIpXG4gICAgQEdSRUFURVIuUFJFKFxuICAgICAgMyxcbiAgICAgIHRydWUsXG4gICAgICBmYWxzZSxcbiAgICAgIFwiYWloaW50Lmxlbmd0aFwiLFxuICAgICAgXCJBY2NvcmRpbmcgdG8gdGhlIEVVIEFJIEFjdCwgQUktZ2VuZXJhdGVkIGNvbnRlbnQgbXVzdCBiZSBjbGVhcmx5IGxhYmVsZWQuIENoYW5naW5nIG9yIGRpc2FibGluZyB0aGUgQUlIaW50IG1heSBsZWFkIHRvIG5vbi1jb21wbGlhbmNlIGluIGNlcnRhaW4ganVyaXNkaWN0aW9ucy5cIixcbiAgICApXG4gICAgQElGLlBSRShuZXcgVFlQRShcInN0cmluZ1wiKSwgbmV3IFJFR0VYKC9eKHRydWV8ZmFsc2UpJC9pKSwgXCJ1c2VpbnRlcm5ldFwiKVxuICAgIEBJRi5QUkUobmV3IFRZUEUoXCJzdHJpbmdcIiksIG5ldyBSRUdFWCgvXih0cnVlfGZhbHNlKSQvaSksIFwibG9jYXRpb25cIilcbiAgICBASUYuUFJFKG5ldyBUWVBFKFwic3RyaW5nXCIpLCBuZXcgUkVHRVgoL15cXGQrJC8pLCBcImRlYm91bmNlXCIpXG4gICAgQElGLlBSRShuZXcgVFlQRShcInN0cmluZ1wiKSwgbmV3IFJFR0VYKC9eXFxkKyQvKSwgXCJpbmZlcmVuY2VkZWxheVwiKVxuICAgIEBJRi5QUkUobmV3IFRZUEUoXCJzdHJpbmdcIiksIG5ldyBSRUdFWCgvXlthLXpdezJ9JC9pKSwgXCJyZXNwb25zZWxhbmd1YWdlXCIpXG4gICAgQE9SLlBSRShbbmV3IFRZUEUoXCJzdHJpbmdcIiksIG5ldyBUWVBFKFwiYm9vbGVhblwiKV0sIFwiZmlsdGVycmVzdWx0c1wiKVxuICAgIEBJRi5QUkUobmV3IFRZUEUoXCJzdHJpbmdcIiksIG5ldyBSRUdFWCgvXih0cnVlfGZhbHNlKSQvaSksIFwiZmlsdGVycmVzdWx0c1wiKVxuICAgIHRvTG9hZDogeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH0sXG5cbiAgICBASU5TVEFOQ0UuUFJFKFxuICAgICAgSFRNTElucHV0RWxlbWVudCxcbiAgICAgIHVuZGVmaW5lZCxcbiAgICAgICdJcyBpdCBub3QgYW4gPGlucHV0IHR5cGU9XCJ0ZXh0XCIvPiBvciA8dGV4dGFyZWE+IHRoYXQgaXMgdGFnZ2VkIHdpdGggdGhpcyBmdW5jdGlvbmFsaXR5PycsXG4gICAgKVxuICAgIHRvUHJvY2VzczogRWxlbWVudCxcbiAgKTogdm9pZCB7XG4gICAgLy8gI3JlZ2lvbiBEZXRlcm1pbmUgaWYgZWFybHkgZXhpdCBpcyBhcHByb3ByaWF0ZS5cbiAgICBjb25zdCB0YWdOYW1lID0gKHRvUHJvY2VzcyBhcyBIVE1MRWxlbWVudCkudGFnTmFtZS50b1VwcGVyQ2FzZSgpO1xuICAgIGNvbnN0IGlucHV0VHlwZSA9ICh0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCkudHlwZT8udG9Mb3dlckNhc2UoKTtcblxuICAgIGlmICh0YWdOYW1lICE9PSBcIlRFWFRBUkVBXCIgJiYgISh0YWdOYW1lID09PSBcIklOUFVUXCIgJiYgaW5wdXRUeXBlID09PSBcInRleHRcIikpIHtcbiAgICAgIHdpbmRvdy5jb2RiaS5sb2coXG4gICAgICAgIFwiRVJST1JcIixcbiAgICAgICAgYGFpLmxsYW1hLnN0YW5kYXJkLnR4dHFhIHJlcXVpcmVzIGFuIDxpbnB1dCB0eXBlPVwidGV4dFwiPiBvciA8dGV4dGFyZWE+LCBnb3QgPCR7dGFnTmFtZS50b0xvd2VyQ2FzZSgpfSR7aW5wdXRUeXBlID8gYCB0eXBlPVwiJHtpbnB1dFR5cGV9XCJgIDogXCJcIn0+YCxcbiAgICAgICAgXCJBSSAvIExMQU1BIC8gVFhUUUFcIixcbiAgICAgICk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBEZXRlcm1pbmUgaWYgZWFybHkgZXhpdCBpcyBhcHByb3ByaWF0ZS5cbiAgICAvLyAjcmVnaW9uIEluaXRpYWxpemUgY29uZmlnIGZyb20gdG9Mb2FkXG4gICAgY29uc3QgZGVib3VuY2VNcyA9IHRvTG9hZC5kZWJvdW5jZSA/IE51bWJlcih0b0xvYWQuZGVib3VuY2UpIDogNTAwO1xuICAgIGNvbnN0IGluZmVyZW5jZURlbGF5TXMgPSAodG9Mb2FkLmluZmVyZW5jZWRlbGF5ID8gTnVtYmVyKHRvTG9hZC5pbmZlcmVuY2VkZWxheSkgOiA1KSAqIDEwMDA7XG5cbiAgICBsZXQgZGVib3VuY2VUaW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCBudWxsID0gbnVsbDtcbiAgICBsZXQgaW5mZXJlbmNlRGVsYXlUaW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCBudWxsID0gbnVsbDtcbiAgICBsZXQgaW5mZXJlbmNlU3RhcnRlZCA9IGZhbHNlO1xuXG4gICAgY29uc3QgYWlIaW50VGV4dCA9IHRvTG9hZC5haWhpbnQgIT0gbnVsbCA/IGBcXHUyNzI4ICR7U3RyaW5nKHRvTG9hZC5haWhpbnQpfWAgOiBcIlxcdTI3MjggQUktR2VuZXJhdGVkXCI7XG4gICAgY29uc3QgaW50ZXJuZXRBY2Nlc3MgPSB0b0xvYWQudXNlaW50ZXJuZXQgIT0gbnVsbCAmJiBTdHJpbmcodG9Mb2FkLnVzZWludGVybmV0KS50b0xvd2VyQ2FzZSgpID09PSBcInRydWVcIjtcbiAgICBjb25zdCBsb2NhdGlvbkFjY2VzcyA9IHRvTG9hZC5sb2NhdGlvbiAhPSBudWxsICYmIFN0cmluZyh0b0xvYWQubG9jYXRpb24pLnRvTG93ZXJDYXNlKCkgPT09IFwidHJ1ZVwiO1xuICAgIGNvbnN0IHJlc3BvbnNlTGFuZ3VhZ2UgPSB0b0xvYWQubGFuZ3VhZ2UgIT0gbnVsbCA/IFN0cmluZyh0b0xvYWQubGFuZ3VhZ2UpLnRyaW0oKSA6IFwiXCI7XG4gICAgY29uc3QgcmVzcG9uc2VMYW5nID0gdG9Mb2FkLnJlc3BvbnNlbGFuZ3VhZ2UgIT0gbnVsbCA/IFN0cmluZyh0b0xvYWQucmVzcG9uc2VsYW5ndWFnZSkudHJpbSgpIDogXCJcIjtcbiAgICBjb25zdCBzcGVjaWFsaXN0ID0gdG9Mb2FkLnNwZWNpYWxpc3QgIT0gbnVsbCA/IFN0cmluZyh0b0xvYWQuc3BlY2lhbGlzdCkudHJpbSgpIDogXCJcIjtcbiAgICBjb25zdCAkID0gZ2V0SlF1ZXJ5KCk7XG4gICAgLy8gI2VuZHJlZ2lvbiBJbml0aWFsaXplIGNvbmZpZyBmcm9tIHRvTG9hZFxuICAgIGNvbnN0IGhhbmRsZUNoYW5nZSA9IGFzeW5jIChmb3JjZSA9IGZhbHNlKSA9PiB7XG4gICAgICAvLyAjcmVnaW9uIERldGVybWluZSB0aGUgc2VhcmNoIGNvbnRhaW5lclxuICAgICAgY29uc3QgaW1tZWRpYXRlQ1ggPSAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5jbG9zZXN0KFwiLkNYQ29udGFpbmVyXCIpO1xuXG4gICAgICBsZXQgY29udGFpbmVyOiBFbGVtZW50IHwgbnVsbDtcblxuICAgICAgaWYgKGltbWVkaWF0ZUNYPy5jbGFzc0xpc3QuY29udGFpbnMoXCJBSV9MTEFNQV9RQV9FeGNsdWRlXCIpKSB7XG4gICAgICAgIGNvbnRhaW5lciA9IGltbWVkaWF0ZUNYO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGFpbmVyID0gaW1tZWRpYXRlQ1g/LnBhcmVudEVsZW1lbnQ/LmNsb3Nlc3QoXCIuQ1hDb250YWluZXJcIikgPz8gaW1tZWRpYXRlQ1g7XG4gICAgICB9XG5cbiAgICAgIGlmICghY29udGFpbmVyKSB7XG4gICAgICAgIHdpbmRvdy5jb2RiaS5sb2coXG4gICAgICAgICAgXCJFUlJPUlwiLFxuICAgICAgICAgIGBDb3VsZCBub3QgZmluZCBhbmNlc3RvciAuQ1hDb250YWluZXIgZm9yIGVsZW1lbnQgIyR7dG9Qcm9jZXNzLmdldEF0dHJpYnV0ZShcImlkXCIpfWAsXG4gICAgICAgICAgXCJBSSAvIExMQU1BIC8gVFhUUUFcIixcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIERldGVybWluZSB0aGUgc2VhcmNoIGNvbnRhaW5lclxuICAgICAgLy8gI3JlZ2lvbiBXYWl0IHVudGlsIGFsbCBzb3VyY2UgZmllbGRzIGFyZSBmaWxsZWQgKHVubGVzcyBmb3JjZWQpXG4gICAgICBpZiAoIWZvcmNlKSB7XG4gICAgICAgIGNvbnN0IHNvdXJjZUVsZW1lbnRzID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuQUlfTExBTUFfVFhUUUFfU291cmNlXCIpO1xuXG4gICAgICAgIGZvciAoY29uc3Qgc3JjRWwgb2Ygc291cmNlRWxlbWVudHMpIHtcbiAgICAgICAgICBjb25zdCB2YWwgPSAoc3JjRWwgYXMgSFRNTElucHV0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnQpLnZhbHVlPy50cmltKCk7XG5cbiAgICAgICAgICBpZiAoIXZhbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaW5mZXJlbmNlRGVsYXlUaW1lcikge1xuICAgICAgICBjbGVhclRpbWVvdXQoaW5mZXJlbmNlRGVsYXlUaW1lcik7XG5cbiAgICAgICAgaW5mZXJlbmNlRGVsYXlUaW1lciA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGlmIChpbmZlcmVuY2VTdGFydGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaW5mZXJlbmNlU3RhcnRlZCA9IHRydWU7XG4gICAgICAvLyAjZW5kcmVnaW9uIFdhaXQgdW50aWwgYWxsIHNvdXJjZSBmaWVsZHMgYXJlIGZpbGxlZCAodW5sZXNzIGZvcmNlZClcbiAgICAgIC8vICNyZWdpb24gQWNxdWlyZSBxdWVzdGlvbnNcbiAgICAgIC8vICNyZWdpb24gQ29sbGVjdCBxdWVzdGlvbiBlbGVtZW50cyAoZXhjbHVkaW5nIEFJX0xMQU1BX1FBX0V4Y2x1ZGUgc3ViLWNvbnRhaW5lcnMpXG4gICAgICBjb25zdCBhbGxRdWVzdGlvbkVsZW1lbnRzID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuQUlfTExBTUFfU1RBTkRBUkRfVFhUUUFfUXVlc3Rpb25cIik7XG4gICAgICBjb25zdCBxdWVzdGlvbkVsZW1lbnRzOiBFbGVtZW50W10gPSBbXTtcblxuICAgICAgZm9yIChjb25zdCBxRWwgb2YgYWxsUXVlc3Rpb25FbGVtZW50cykge1xuICAgICAgICBjb25zdCBpbm5lckNvbnRhaW5lciA9IHFFbC5jbG9zZXN0KFwiLkNYQ29udGFpbmVyXCIpO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBpbm5lckNvbnRhaW5lciAmJlxuICAgICAgICAgIGlubmVyQ29udGFpbmVyICE9PSBjb250YWluZXIgJiZcbiAgICAgICAgICBpbm5lckNvbnRhaW5lci5jbGFzc0xpc3QuY29udGFpbnMoXCJBSV9MTEFNQV9RQV9FeGNsdWRlXCIpXG4gICAgICAgICkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcXVlc3Rpb25FbGVtZW50cy5wdXNoKHFFbCk7XG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIENvbGxlY3QgcXVlc3Rpb24gZWxlbWVudHMgKGV4Y2x1ZGluZyBBSV9MTEFNQV9RQV9FeGNsdWRlIHN1Yi1jb250YWluZXJzKVxuICAgICAgLy8gI3JlZ2lvbiBCdWlsZCByZXF1ZXN0IGhlYWRlcnNcbiAgICAgIGNvbnN0IGhlYWRlcnM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcblxuICAgICAgaGVhZGVyc1tcIlgtU2Vzc2lvbi1JZFwiXSA9IEFJX0xMQU1BX1NUQU5EQVJEX1RYVFFBLlBBR0VfU0VTU0lPTl9JRDtcbiAgICAgIGhlYWRlcnNbXCJYLVNlYXJjaFwiXSA9IGludGVybmV0QWNjZXNzID8gXCJ0cnVlXCIgOiBcImZhbHNlXCI7XG4gICAgICBpZiAodG9Mb2FkLmZpbHRlcnJlc3VsdHMgIT0gbnVsbCkge1xuICAgICAgICBoZWFkZXJzW1wiWC1GaWx0ZXItUmVzdWx0c1wiXSA9IFN0cmluZyh0b0xvYWQuZmlsdGVycmVzdWx0cykudG9Mb3dlckNhc2UoKSA9PT0gXCJ0cnVlXCIgPyBcInRydWVcIiA6IFwiZmFsc2VcIjtcbiAgICAgIH1cbiAgICAgIGlmIChyZXNwb25zZUxhbmcpIHtcbiAgICAgICAgaGVhZGVyc1tcIlgtRm9yY2VkLUxhbmd1YWdlXCJdID0gcmVzcG9uc2VMYW5nO1xuICAgICAgfVxuICAgICAgaWYgKHNwZWNpYWxpc3QpIHtcbiAgICAgICAgaGVhZGVyc1tcIlgtU3BlY2lhbGlzdFwiXSA9IHNwZWNpYWxpc3Q7XG4gICAgICB9XG4gICAgICAvLyAjcmVnaW9uIEdlb2xvY2F0aW9uXG4gICAgICBpZiAobG9jYXRpb25BY2Nlc3MpIHtcbiAgICAgICAgaGVhZGVyc1tcIlgtTG9jYXRpb25cIl0gPSBcInRydWVcIjtcblxuICAgICAgICBpZiAobmF2aWdhdG9yLmdlb2xvY2F0aW9uKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHBvcyA9IGF3YWl0IG5ldyBQcm9taXNlPEdlb2xvY2F0aW9uUG9zaXRpb24+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihyZXNvbHZlLCByZWplY3QsIHtcbiAgICAgICAgICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3k6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHRpbWVvdXQ6IDUwMDAsXG4gICAgICAgICAgICAgICAgbWF4aW11bUFnZTogMzAwXzAwMCxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaGVhZGVyc1tcIlgtTGF0aXR1ZGVcIl0gPSBwb3MuY29vcmRzLmxhdGl0dWRlLnRvRml4ZWQoNCk7XG4gICAgICAgICAgICBoZWFkZXJzW1wiWC1Mb25naXR1ZGVcIl0gPSBwb3MuY29vcmRzLmxvbmdpdHVkZS50b0ZpeGVkKDQpO1xuICAgICAgICAgIH0gY2F0Y2ggKGdlb0Vycikge1xuICAgICAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcIldBUk5JTkdcIiwgYEdlb2xvY2F0aW9uIHVuYXZhaWxhYmxlOiAke2dlb0Vycn1gLCBcIkFJIC8gTExBTUEgLyBUWFRRQVwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vICNlbmRyZWdpb24gR2VvbG9jYXRpb25cbiAgICAgIC8vICNyZWdpb24gUmVzb2x2ZSBzeW1ib2xzIGFuZCBlbmNvZGUgcXVlc3Rpb25zIGludG8gaGVhZGVyc1xuICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIHF1ZXN0aW9uRWxlbWVudHMpIHtcbiAgICAgICAgY29uc3QgaWQgPSBlbGVtZW50LmlkO1xuXG4gICAgICAgIGxldCBxdWVzdGlvbiA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiZGF0YS1jYi1RdWVzdGlvblwiKTtcblxuICAgICAgICBpZiAoaWQgJiYgcXVlc3Rpb24pIHtcbiAgICAgICAgICBxdWVzdGlvbiA9IHF1ZXN0aW9uLnJlcGxhY2UoLzxcXFsoW15cXF1dKylcXF0+L2csIChtYXRjaCwgaWRlbnRpZmllcikgPT4ge1xuICAgICAgICAgICAgY29uc3QgdHJpbW1lZCA9IGlkZW50aWZpZXIudHJpbSgpO1xuICAgICAgICAgICAgY29uc3QgZmllbGQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuJHt0cmltbWVkfWApIGFzIEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsO1xuXG4gICAgICAgICAgICBpZiAoZmllbGQgJiYgXCJ2YWx1ZVwiIGluIGZpZWxkKSB7XG4gICAgICAgICAgICAgIHJldHVybiBmaWVsZC52YWx1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIC8vIEFwcGVuZCBsYW5ndWFnZSBpbnN0cnVjdGlvbiBpZiBjb25maWd1cmVkXG4gICAgICAgICAgaWYgKHJlc3BvbnNlTGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgIHF1ZXN0aW9uID0gYCR7cXVlc3Rpb259IEFuc3dlciBpbiAke3Jlc3BvbnNlTGFuZ3VhZ2V9LmA7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaGVhZGVyc1tgWC1RdWVzdGlvbi0ke2lkfWBdID0gYnRvYSh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQocXVlc3Rpb24pKSk7IC8vIEJhc2U2NC1lbmNvZGUgdG8gYXZvaWQgaW52YWxpZCBIVFRQIGhlYWRlciBjaGFyYWN0ZXJzIChuZXdsaW5lcywgVW5pY29kZSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoIWlkKSB7XG4gICAgICAgICAgICB3aW5kb3cuY29kYmkubG9nKFxuICAgICAgICAgICAgICBcIldBUk5JTkdcIixcbiAgICAgICAgICAgICAgYFF1ZXN0aW9uIGVsZW1lbnQgbWlzc2luZyBpZCBhdHRyaWJ1dGUgaW46ICR7ZWxlbWVudC5vdXRlckhUTUx9YCxcbiAgICAgICAgICAgICAgXCJBSSAvIExMQU1BIC8gVFhUUUFcIixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFxdWVzdGlvbikge1xuICAgICAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcbiAgICAgICAgICAgICAgXCJXQVJOSU5HXCIsXG4gICAgICAgICAgICAgIGBRdWVzdGlvbiBlbGVtZW50IHdpdGggaWQgXCIke2lkfVwiIG1pc3NpbmcgZGF0YS1jYi1RdWVzdGlvbiBhdHRyaWJ1dGVgLFxuICAgICAgICAgICAgICBcIkFJIC8gTExBTUEgLyBUWFRRQVwiLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vICNlbmRyZWdpb24gUmVzb2x2ZSBzeW1ib2xzIGFuZCBlbmNvZGUgcXVlc3Rpb25zIGludG8gaGVhZGVyc1xuICAgICAgaWYgKCFPYmplY3Qua2V5cyhoZWFkZXJzKS5zb21lKChrKSA9PiBrLnN0YXJ0c1dpdGgoXCJYLVF1ZXN0aW9uLVwiKSkpIHtcbiAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcIldBUk5JTkdcIiwgXCJObyBxdWVzdGlvbnMgZm91bmQgXHUyMDE0IG5vdGhpbmcgdG8gc2VuZFwiLCBcIkFJIC8gTExBTUEgLyBUWFRRQVwiKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIEJ1aWxkIHJlcXVlc3QgaGVhZGVyc1xuICAgICAgLy8gI2VuZHJlZ2lvbiBBY3F1aXJlIHF1ZXN0aW9uc1xuICAgICAgLy8gI3JlZ2lvbiBFbnN1cmUgUHJvY2Vzc2luZyBhbmltYXRpb24gc3R5bGVzIGV4aXN0XG4gICAgICBpZiAoIWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjTExBTUFfVFhUUUFfUHJvY2Vzc2luZ19TdHlsZXNcIikpIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG5cbiAgICAgICAgc3R5bGUuaWQgPSBcIkxMQU1BX1RYVFFBX1Byb2Nlc3NpbmdfU3R5bGVzXCI7XG4gICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gYFxuICAgICAgICAgICAgICAgICAgQGtleWZyYW1lcyBMTEFNQV9SZXNwb25zZVJlYWR5IHtcbiAgICAgICAgICAgICAgICAgICAgMCUgICB7IGJhY2tncm91bmQtY29sb3I6IHJnYmEoNzYsMTc1LDgwLDAuMzUpOyB9XG4gICAgICAgICAgICAgICAgICAgIDEwMCUgeyBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDsgfX1cbiAgICAgICAgICAgICAgICAgIC5MTEFNQV9SZXNwb25zZVJlYWR5IHsgYW5pbWF0aW9uOiBMTEFNQV9SZXNwb25zZVJlYWR5IDEuNXMgZWFzZS1vdXQgO31cbiAgICAgICAgICAgICAgICAgIC5MTEFNQV9UWFRRQV9SaWNoQW5zd2VyIHtcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogNnB4IDhweCA7IGJvcmRlcjogMXB4IHNvbGlkICNjY2MgOyBib3JkZXItcmFkaXVzOiA0cHggO1xuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAjZmFmYWZhIDsgd2hpdGUtc3BhY2U6IHByZS13cmFwIDsgd29yZC1icmVhazogYnJlYWstd29yZCA7XG4gICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogaW5oZXJpdCA7IGxpbmUtaGVpZ2h0OiAxLjUgOyBjdXJzb3I6IHRleHQgOyBtaW4taGVpZ2h0OiAyZW0gO31cbiAgICAgICAgICAgICAgICAgIC5MTEFNQV9UWFRRQV9SaWNoQW5zd2VyOmhvdmVyIHsgYm9yZGVyLWNvbG9yOiAjOTk5IDt9XG4gICAgICAgICAgICAgICAgICAuTExBTUFfQ2hhdF9Tb3VyY2VCYWRnZSB7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4IDsgYWxpZ24taXRlbXM6IGNlbnRlciA7XG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IDJweCAxMHB4IDsgYm9yZGVyLXJhZGl1czogMTJweCA7XG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMTEsMTA2LDE5MSwwLjEpIDsgZm9udC1zaXplOiAxMnB4IDtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogYmFja2dyb3VuZCAwLjE1cyA7fVxuICAgICAgICAgICAgICAgICAgLkxMQU1BX0NoYXRfU291cmNlQmFkZ2U6aG92ZXIgeyBiYWNrZ3JvdW5kOiByZ2JhKDExLDEwNiwxOTEsMC4yKSA7fVxuICAgICAgICAgICAgICAgICAgLkxMQU1BX0NoYXRfU291cmNlQmFkZ2UgYSB7IGNvbG9yOiAjMGI2YWJmIDsgdGV4dC1kZWNvcmF0aW9uOiBub25lIDsgd29yZC1icmVhazogbm9ybWFsIDt9XG4gICAgICAgICAgICAgICAgICAuTExBTUFfQ2hhdF9Tb3VyY2VCYWRnZSBhOmhvdmVyIHsgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmUgO31cbiAgICAgICAgICAgICAgICAgIC5MTEFNQV9DaGF0X1Bob25lQmFkZ2UsXG4gICAgICAgICAgICAgICAgICAuTExBTUFfQ2hhdF9FbWFpbEJhZGdlIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogaW5saW5lLWZsZXggOyBhbGlnbi1pdGVtczogY2VudGVyIDsgZ2FwOiA0cHggO1xuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAycHggMTBweCA7IGJvcmRlci1yYWRpdXM6IDEycHggO1xuICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6IDEycHggOyB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzIDt9XG4gICAgICAgICAgICAgICAgICAuTExBTUFfQ2hhdF9QaG9uZUJhZGdlIHsgYmFja2dyb3VuZDogcmdiYSg0MCwxNjcsNjksMC4xMikgO31cbiAgICAgICAgICAgICAgICAgIC5MTEFNQV9DaGF0X1Bob25lQmFkZ2U6aG92ZXIgeyBiYWNrZ3JvdW5kOiByZ2JhKDQwLDE2Nyw2OSwwLjIyKSA7fVxuICAgICAgICAgICAgICAgICAgLkxMQU1BX0NoYXRfRW1haWxCYWRnZSB7IGJhY2tncm91bmQ6IHJnYmEoMjIwLDEzMCwwLDAuMTIpIDt9XG4gICAgICAgICAgICAgICAgICAuTExBTUFfQ2hhdF9FbWFpbEJhZGdlOmhvdmVyIHsgYmFja2dyb3VuZDogcmdiYSgyMjAsMTMwLDAsMC4yMikgO31cbiAgICAgICAgICAgICAgICAgIC5MTEFNQV9DaGF0X1Bob25lQmFkZ2UgYSB7IGNvbG9yOiAjMjhhNzQ1IDsgdGV4dC1kZWNvcmF0aW9uOiBub25lIDsgd29yZC1icmVhazogbm9ybWFsIDt9XG4gICAgICAgICAgICAgICAgICAuTExBTUFfQ2hhdF9FbWFpbEJhZGdlIGEgeyBjb2xvcjogI2MyNzgwMCA7IHRleHQtZGVjb3JhdGlvbjogbm9uZSA7IHdvcmQtYnJlYWs6IG5vcm1hbCA7fVxuICAgICAgICAgICAgICAgICAgLkxMQU1BX0NoYXRfUGhvbmVCYWRnZSBhOmhvdmVyLFxuICAgICAgICAgICAgICAgICAgLkxMQU1BX0NoYXRfRW1haWxCYWRnZSBhOmhvdmVyIHsgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmUgO31cbiAgICAgICAgICAgICAgICAgIC5MTEFNQV9DaGF0X0JhZGdlSWNvbiB7IGZvbnQtc2l6ZTogMTNweCA7IGxpbmUtaGVpZ2h0OiAxIDt9YDtcblxuICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICAgIH1cbiAgICAgIC8vICNlbmRyZWdpb24gRW5zdXJlIFByb2Nlc3NpbmcgYW5pbWF0aW9uIHN0eWxlcyBleGlzdFxuICAgICAgLy8gI3JlZ2lvbiBEaXNhYmxlIGlucHV0IGFuZCBzaG93IGxvYWRpbmcgYW5pbWF0aW9uXG4gICAgICBjb25zdCB0c1RvUHJvY2VzcyA9IHRvUHJvY2VzcyBhcyBIVE1MRWxlbWVudDtcblxuICAgICAgdHNUb1Byb2Nlc3Muc3R5bGUucG9pbnRlckV2ZW50cyA9IFwibm9uZVwiO1xuICAgICAgdHNUb1Byb2Nlc3Muc3R5bGUub3BhY2l0eSA9IFwiMC41XCI7XG4gICAgICAvLyAjcmVnaW9uIERpc2FibGUgYW5zd2VyIGZpZWxkcyBkdXJpbmcgaW5mZXJlbmNlXG4gICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgcXVlc3Rpb25FbGVtZW50cykge1xuICAgICAgICBjb25zdCBmaWVsZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCMke2VsZW1lbnQuaWR9YCkgYXMgSFRNTElucHV0RWxlbWVudCB8IG51bGw7XG5cbiAgICAgICAgaWYgKGZpZWxkKSB7XG4gICAgICAgICAgZmllbGQuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgIGZpZWxkLnN0eWxlLm9wYWNpdHkgPSBcIjAuNVwiO1xuICAgICAgICAgIHdpbmRvdy5jb2RiaS5pbmplY3RMb2FkaW5nQW5pbShmaWVsZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vICNlbmRyZWdpb24gRGlzYWJsZSBhbnN3ZXIgZmllbGRzIGR1cmluZyBpbmZlcmVuY2VcbiAgICAgIC8vICNyZWdpb24gRGlzYWJsZSBzb3VyY2UgZmllbGRzIGR1cmluZyBpbmZlcmVuY2VcbiAgICAgIGNvbnN0IGRpc2FibGVkU291cmNlczogSFRNTEVsZW1lbnRbXSA9IFtdO1xuXG4gICAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgIGZvciAoY29uc3Qgc3JjRWwgb2YgY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuQUlfTExBTUFfVFhUUUFfU291cmNlXCIpKSB7XG4gICAgICAgICAgY29uc3QgZWwgPSBzcmNFbCBhcyBIVE1MSW5wdXRFbGVtZW50O1xuXG4gICAgICAgICAgZWwuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgIGVsLnN0eWxlLm9wYWNpdHkgPSBcIjAuNVwiO1xuXG4gICAgICAgICAgZGlzYWJsZWRTb3VyY2VzLnB1c2goZWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIERpc2FibGUgc291cmNlIGZpZWxkcyBkdXJpbmcgaW5mZXJlbmNlXG4gICAgICAvLyAjZW5kcmVnaW9uIERpc2FibGUgaW5wdXQgYW5kIHNob3cgbG9hZGluZyBhbmltYXRpb25cbiAgICAgIC8vICNyZWdpb24gRmluYWxpemUgVUkgd2hlbiBhbGwgcmVxdWVzdHMgY29tcGxldGVcbiAgICAgIGxldCBjb21wbGV0ZWRDb3VudCA9IDA7XG5cbiAgICAgIGNvbnN0IHRvdGFsUXVlc3Rpb25zID0gcXVlc3Rpb25FbGVtZW50cy5sZW5ndGg7XG4gICAgICBjb25zdCBmaW5hbGl6ZUFsbCA9ICgpID0+IHtcbiAgICAgICAgdHNUb1Byb2Nlc3Muc3R5bGUucG9pbnRlckV2ZW50cyA9IFwiYWxsXCI7XG4gICAgICAgIHRzVG9Qcm9jZXNzLnN0eWxlLm9wYWNpdHkgPSBcIjFcIjtcbiAgICAgICAgLy8gUmUtZW5hYmxlIHNvdXJjZSBlbGVtZW50c1xuICAgICAgICBmb3IgKGNvbnN0IGVsIG9mIGRpc2FibGVkU291cmNlcykge1xuICAgICAgICAgIChlbCBhcyBIVE1MSW5wdXRFbGVtZW50KS5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICAgIGVsLnN0eWxlLm9wYWNpdHkgPSBcIjFcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGluZmVyZW5jZVN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgIH07XG4gICAgICAvLyAjZW5kcmVnaW9uIEZpbmFsaXplIFVJIHdoZW4gYWxsIHJlcXVlc3RzIGNvbXBsZXRlXG4gICAgICAvLyAjcmVnaW9uIFNlbmQgb25lIHJlcXVlc3QgcGVyIHF1ZXN0aW9uIChwcm9ncmVzc2l2ZSBkaXNwbGF5KVxuICAgICAgLy8gI3JlZ2lvbiBCdWlsZCBzaGFyZWQgaGVhZGVycyAoZXZlcnl0aGluZyBleGNlcHQgWC1RdWVzdGlvbi0qIGVudHJpZXMpXG4gICAgICBjb25zdCBzaGFyZWRIZWFkZXJzOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge307XG5cbiAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGhlYWRlcnMpKSB7XG4gICAgICAgIGlmICgha2V5LnN0YXJ0c1dpdGgoXCJYLVF1ZXN0aW9uLVwiKSkge1xuICAgICAgICAgIHNoYXJlZEhlYWRlcnNba2V5XSA9IGhlYWRlcnNba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBCdWlsZCBzaGFyZWQgaGVhZGVycyAoZXZlcnl0aGluZyBleGNlcHQgWC1RdWVzdGlvbi0qIGVudHJpZXMpXG4gICAgICAvLyAjcmVnaW9uIFBlci1xdWVzdGlvbiBBSkFYIHJlcXVlc3RzXG4gICAgICAvLyAjcmVnaW9uIFF1ZXVlIGJhZGdlIGNvbmZpZ3VyYXRpb24uXG4gICAgICBjb25zdCB0eHRRYVF1ZXVlT3ZlcnJpZGU6IGJvb2xlYW4gfCBudWxsID1cbiAgICAgICAgdG9Mb2FkLnF1ZXVlYmFkZ2UgIT0gbnVsbCA/IFN0cmluZyh0b0xvYWQucXVldWViYWRnZSkgIT09IFwiZmFsc2VcIiA6IG51bGw7XG4gICAgICBjb25zdCB0eHRRYVF1ZXVlVGV4dDogc3RyaW5nID0gdG9Mb2FkLnF1ZXVldGV4dCAhPSBudWxsID8gU3RyaW5nKHRvTG9hZC5xdWV1ZXRleHQpIDogXCJcIjtcbiAgICAgIC8vICNlbmRyZWdpb24gUXVldWUgYmFkZ2UgY29uZmlndXJhdGlvbi5cbiAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBxdWVzdGlvbkVsZW1lbnRzKSB7XG4gICAgICAgIGNvbnN0IGlkID0gZWxlbWVudC5pZDtcbiAgICAgICAgY29uc3QgcXVlc3Rpb25IZWFkZXIgPSBoZWFkZXJzW2BYLVF1ZXN0aW9uLSR7aWR9YF07XG5cbiAgICAgICAgaWYgKCFxdWVzdGlvbkhlYWRlcikge1xuICAgICAgICAgIGNvbXBsZXRlZENvdW50Kys7XG5cbiAgICAgICAgICBpZiAoY29tcGxldGVkQ291bnQgPj0gdG90YWxRdWVzdGlvbnMpIHtcbiAgICAgICAgICAgIGZpbmFsaXplQWxsKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwZXJRdWVzdGlvbkhlYWRlcnM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7XG4gICAgICAgICAgLi4uc2hhcmVkSGVhZGVycyxcbiAgICAgICAgICBbYFgtUXVlc3Rpb24tJHtpZH1gXTogcXVlc3Rpb25IZWFkZXIsXG4gICAgICAgIH07XG5cbiAgICAgICAgbGV0IGZpZWxkUXVldWVCYWRnZTogSFRNTFNwYW5FbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgY29uc3Qgc2hvd0ZpZWxkUXVldWVCYWRnZSA9IChwb3NpdGlvbjogbnVtYmVyLCBlc3RpbWF0ZWRXYWl0TXM/OiBudW1iZXIgfCBudWxsKSA9PiB7XG4gICAgICAgICAgY29uc3QgZmllbGQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjJHtpZH1gKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgICAgICAgaWYgKCFmaWVsZFF1ZXVlQmFkZ2UgJiYgZmllbGQpIHtcbiAgICAgICAgICAgIGZpZWxkUXVldWVCYWRnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgZmllbGRRdWV1ZUJhZGdlLmNsYXNzTmFtZSA9IFwiTExBTUFfUXVldWVCYWRnZVwiO1xuICAgICAgICAgICAgZmllbGRRdWV1ZUJhZGdlLnN0eWxlLmNzc1RleHQgPVxuICAgICAgICAgICAgICBcImRpc3BsYXk6aW5saW5lLWZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo0cHg7bWFyZ2luLWxlZnQ6NnB4O3BhZGRpbmc6MnB4IDhweDtib3JkZXItcmFkaXVzOjEwcHg7YmFja2dyb3VuZDojZDBlMGZmO2NvbG9yOiMxYTVhYWI7Zm9udC1zaXplOjEycHg7Zm9udC13ZWlnaHQ6NjAwO3doaXRlLXNwYWNlOm5vd3JhcDtcIjtcbiAgICAgICAgICAgIGZpZWxkLnBhcmVudEVsZW1lbnQ/LmFwcGVuZENoaWxkKGZpZWxkUXVldWVCYWRnZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChmaWVsZFF1ZXVlQmFkZ2UpIHtcbiAgICAgICAgICAgIGNvbnN0IHdhaXRMYWJlbCA9IGZvcm1hdFdhaXRUaW1lKGVzdGltYXRlZFdhaXRNcyk7XG4gICAgICAgICAgICBmaWVsZFF1ZXVlQmFkZ2UudGV4dENvbnRlbnQgPSBgJHtwb3NpdGlvbn0ke3dhaXRMYWJlbCA/IGAgJHt3YWl0TGFiZWx9YCA6IFwiXCJ9JHt0eHRRYVF1ZXVlVGV4dCA/IGAgJHt0eHRRYVF1ZXVlVGV4dH1gIDogXCJcIn1gO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBoaWRlRmllbGRRdWV1ZUJhZGdlID0gKCkgPT4ge1xuICAgICAgICAgIGZpZWxkUXVldWVCYWRnZT8ucmVtb3ZlKCk7XG4gICAgICAgICAgZmllbGRRdWV1ZUJhZGdlID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgdHh0UWFRdWV1ZVRpY2tldDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgY29uc3Qgc2VuZFR4dFFhUmVxdWVzdCA9ICgpID0+IHtcbiAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiBgJHt3aW5kb3cuY29kYmkuYmFzZVVSTH1wbHVnaW4/bmFtZT1Db2RCaV9BSV9MTEFNQV9TVERgLFxuICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXG4gICAgICAgICAgICBkYXRhOiBuZXcgRm9ybURhdGEoKSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcbiAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZSxcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgIGJlZm9yZVNlbmQ6ICh4aHIpID0+IHtcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBoZWFkZXJOYW1lIG9mIE9iamVjdC5rZXlzKHBlclF1ZXN0aW9uSGVhZGVycykpIHtcbiAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXJOYW1lLCBwZXJRdWVzdGlvbkhlYWRlcnNbaGVhZGVyTmFtZV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmICh0eHRRYVF1ZXVlVGlja2V0KSB7XG4gICAgICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoXCJYLVF1ZXVlLVRpY2tldFwiLCB0eHRRYVF1ZXVlVGlja2V0KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vICNyZWdpb24gU3VjY2VzcyBjYWxsYmFjayBcdTIwMTQgcG9wdWxhdGUgYW5zd2VyIGZpZWxkXG4gICAgICAgICAgICBzdWNjZXNzOiAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnF1ZXVlZCkge1xuICAgICAgICAgICAgICAgIHR4dFFhUXVldWVUaWNrZXQgPSByZXNwb25zZS5xdWV1ZVRpY2tldCA/PyB0eHRRYVF1ZXVlVGlja2V0O1xuICAgICAgICAgICAgICAgIGNvbnN0IGJhZGdlRW5hYmxlZCA9IHR4dFFhUXVldWVPdmVycmlkZSAhPSBudWxsID8gdHh0UWFRdWV1ZU92ZXJyaWRlIDogISFyZXNwb25zZS5xdWV1ZUJhZGdlO1xuICAgICAgICAgICAgICAgIGlmIChiYWRnZUVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgIHNob3dGaWVsZFF1ZXVlQmFkZ2UocmVzcG9uc2UucG9zaXRpb24gPz8gMCwgcmVzcG9uc2UuZXN0aW1hdGVkV2FpdE1zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChzZW5kVHh0UWFSZXF1ZXN0LCAxMDAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaGlkZUZpZWxkUXVldWVCYWRnZSgpO1xuICAgICAgICAgICAgICB0eHRRYVF1ZXVlVGlja2V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgY29uc3QgZmllbGQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjJHtpZH1gKSBhcyBIVE1MSW5wdXRFbGVtZW50IHwgSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGw7XG5cbiAgICAgICAgICAgICAgaWYgKGZpZWxkKSB7XG4gICAgICAgICAgICAgICAgZmllbGQuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBmaWVsZC5zdHlsZS5vcGFjaXR5ID0gXCIxXCI7XG5cbiAgICAgICAgICAgICAgICB3aW5kb3cuY29kYmkucmVtb3ZlTG9hZGVyQW5pbShmaWVsZCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBhbnN3ZXJUZXh0ID0gcmVzcG9uc2VbaWRdPy5hbnN3ZXI7XG5cbiAgICAgICAgICAgICAgICBpZiAoYW5zd2VyVGV4dCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICBmaWVsZC52YWx1ZSA9IGFuc3dlclRleHQ7XG5cbiAgICAgICAgICAgICAgICAgIGlmIChmaWVsZC50YWdOYW1lLnRvVXBwZXJDYXNlKCkgPT09IFwiVEVYVEFSRUFcIikge1xuICAgICAgICAgICAgICAgICAgICBmaWVsZC5zdHlsZS5oZWlnaHQgPSBcImF1dG9cIjtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQuc3R5bGUuaGVpZ2h0ID0gYCR7ZmllbGQuc2Nyb2xsSGVpZ2h0fXB4YDtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgaWYgKGFpSGludFRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgQUlfTExBTUFfU1RBTkRBUkRfVFhUUUEuYXR0YWNoQWlIaW50KGZpZWxkLCBhaUhpbnRUZXh0KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC8vIFNob3cgcmljaC10ZXh0IG92ZXJsYXkgd2l0aCBjbGlja2FibGUgbGlua3MvcGhvbmVzL2VtYWlsc1xuICAgICAgICAgICAgICAgICAgQUlfTExBTUFfU1RBTkRBUkRfVFhUUUEuc2hvd1JpY2hBbnN3ZXIoZmllbGQsIGFuc3dlclRleHQpO1xuICAgICAgICAgICAgICAgICAgLy8gRmxhc2ggZ3JlZW4gdG8gc2lnbmFsIHJlc3BvbnNlIGlzIHJlYWR5XG4gICAgICAgICAgICAgICAgICBjb25zdCByaWNoRGl2ID0gSU5TVEFOQ0UudHNDaGVjazxIVE1MRWxlbWVudD4oXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkLm5leHRFbGVtZW50U2libGluZz8uY2xhc3NMaXN0LmNvbnRhaW5zKFwiTExBTUFfVFhUUUFfUmljaEFuc3dlclwiKVxuICAgICAgICAgICAgICAgICAgICAgID8gZmllbGQubmV4dEVsZW1lbnRTaWJsaW5nXG4gICAgICAgICAgICAgICAgICAgICAgOiBmaWVsZCxcbiAgICAgICAgICAgICAgICAgICAgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICByaWNoRGl2LmNsYXNzTGlzdC5yZW1vdmUoXCJMTEFNQV9SZXNwb25zZVJlYWR5XCIpO1xuXG4gICAgICAgICAgICAgICAgICB2b2lkIHJpY2hEaXYub2Zmc2V0V2lkdGg7XG5cbiAgICAgICAgICAgICAgICAgIHJpY2hEaXYuY2xhc3NMaXN0LmFkZChcIkxMQU1BX1Jlc3BvbnNlUmVhZHlcIik7XG4gICAgICAgICAgICAgICAgICByaWNoRGl2LmFkZEV2ZW50TGlzdGVuZXIoXCJhbmltYXRpb25lbmRcIiwgKCkgPT4gcmljaERpdi5jbGFzc0xpc3QucmVtb3ZlKFwiTExBTUFfUmVzcG9uc2VSZWFkeVwiKSwge1xuICAgICAgICAgICAgICAgICAgICBvbmNlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICBmaWVsZC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcImNoYW5nZVwiLCB7IGJ1YmJsZXM6IHRydWUgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyBSZS1lbmFibGUgdGhpcyBxdWVzdGlvbidzIGZpZWxkXG4gICAgICAgICAgICAgIGlmIChmaWVsZCkge1xuICAgICAgICAgICAgICAgIGZpZWxkLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZmllbGQuc3R5bGUub3BhY2l0eSA9IFwiMVwiO1xuXG4gICAgICAgICAgICAgICAgd2luZG93LmNvZGJpLnJlbW92ZUxvYWRlckFuaW0oZmllbGQpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcIkVSUk9SXCIsIGBSRVNUIGZhaWxlZCBmb3IgXCIke2lkfVwiOiAke3Jlc3BvbnNlLmVycm9yfWAsIFwiQUkgLyBMTEFNQSAvIFRYVFFBXCIpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29tcGxldGVkQ291bnQrKztcblxuICAgICAgICAgICAgICBpZiAoY29tcGxldGVkQ291bnQgPj0gdG90YWxRdWVzdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBmaW5hbGl6ZUFsbCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBTdWNjZXNzIGNhbGxiYWNrIFx1MjAxNCBwb3B1bGF0ZSBhbnN3ZXIgZmllbGRcbiAgICAgICAgICAgIC8vICNyZWdpb24gRXJyb3IgY2FsbGJhY2tcbiAgICAgICAgICAgIGVycm9yOiAoX3hociwgc3RhdHVzLCBlcnJvcikgPT4ge1xuICAgICAgICAgICAgICBoaWRlRmllbGRRdWV1ZUJhZGdlKCk7XG4gICAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgIyR7aWR9YCkgYXMgSFRNTElucHV0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnQgfCBudWxsO1xuXG4gICAgICAgICAgICAgIGlmIChmaWVsZCkge1xuICAgICAgICAgICAgICAgIGZpZWxkLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZmllbGQuc3R5bGUub3BhY2l0eSA9IFwiMVwiO1xuXG4gICAgICAgICAgICAgICAgd2luZG93LmNvZGJpLnJlbW92ZUxvYWRlckFuaW0oZmllbGQpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcbiAgICAgICAgICAgICAgICBcIkVSUk9SXCIsXG4gICAgICAgICAgICAgICAgYFJFU1QgZmFpbGVkIGZvciBcIiR7aWR9XCIgd2l0aCBzdGF0dXMgXCIke3N0YXR1c31cIiBjYXVzZTogXCIke2Vycm9yfVwiYCxcbiAgICAgICAgICAgICAgICBcIkFJIC8gTExBTUEgLyBUWFRRQVwiLFxuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIGNvbXBsZXRlZENvdW50Kys7XG5cbiAgICAgICAgICAgICAgaWYgKGNvbXBsZXRlZENvdW50ID49IHRvdGFsUXVlc3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgZmluYWxpemVBbGwoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vICNlbmRyZWdpb24gRXJyb3IgY2FsbGJhY2tcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgc2VuZFR4dFFhUmVxdWVzdCgpO1xuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBQZXItcXVlc3Rpb24gQUpBWCByZXF1ZXN0c1xuICAgICAgLy8gI2VuZHJlZ2lvbiBTZW5kIG9uZSByZXF1ZXN0IHBlciBxdWVzdGlvbiAocHJvZ3Jlc3NpdmUgZGlzcGxheSlcbiAgICB9O1xuICAgIC8vICNyZWdpb24gRGVib3VuY2VkIGNoYW5nZSBoYW5kbGVyXG4gICAgY29uc3QgZGVib3VuY2VkSGFuZGxlID0gKCkgPT4ge1xuICAgICAgaWYgKGRlYm91bmNlVGltZXIpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlVGltZXIpO1xuICAgICAgfVxuXG4gICAgICBkZWJvdW5jZVRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGhhbmRsZUNoYW5nZSgpO1xuICAgICAgfSwgZGVib3VuY2VNcyk7XG4gICAgICAvLyAjcmVnaW9uIFN0YXJ0IHRoZSBpbmZlcmVuY2UgZGVsYXkgdGltZXIgb24gdGhlIGZpcnN0IHNvdXJjZSBpbnRlcmFjdGlvbi4gSWYgbm90IGFsbCBmaWVsZHMgYXJlIGZpbGxlZCB3aXRoaW4gaW5mZXJlbmNlRGVsYXlNcywgZm9yY2UgaW5mZXJlbmNlLlxuICAgICAgaWYgKCFpbmZlcmVuY2VEZWxheVRpbWVyICYmICFpbmZlcmVuY2VTdGFydGVkKSB7XG4gICAgICAgIGluZmVyZW5jZURlbGF5VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBpbmZlcmVuY2VEZWxheVRpbWVyID0gbnVsbDtcblxuICAgICAgICAgIGhhbmRsZUNoYW5nZSh0cnVlKTtcbiAgICAgICAgfSwgaW5mZXJlbmNlRGVsYXlNcyk7XG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIFN0YXJ0IHRoZSBpbmZlcmVuY2UgZGVsYXkgdGltZXIgb24gdGhlIGZpcnN0IHNvdXJjZSBpbnRlcmFjdGlvbi4gSWYgbm90IGFsbCBmaWVsZHMgYXJlIGZpbGxlZCB3aXRoaW4gaW5mZXJlbmNlRGVsYXlNcywgZm9yY2UgaW5mZXJlbmNlLlxuICAgIH07XG4gICAgLy8gI2VuZHJlZ2lvbiBEZWJvdW5jZWQgY2hhbmdlIGhhbmRsZXJcbiAgICAvLyAjcmVnaW9uIFJlZ2lzdGVyIGV2ZW50IGxpc3RlbmVycyBvbiB0cmlnZ2VyIGFuZCBzb3VyY2UgZWxlbWVudHNcbiAgICAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGRlYm91bmNlZEhhbmRsZSk7XG4gICAgLy8gI3JlZ2lvbiBMaXN0ZW4gZm9yIGZvY3Vzb3V0IG9uIEFJX0xMQU1BX1RYVFFBX1NvdXJjZSBlbGVtZW50cyBcdTIwMTQgZm9jdXNvdXQgKG5vdCBpbnB1dC9jaGFuZ2UpXG4gICAgLy8gc28gaW5mZXJlbmNlIHdhaXRzIHVudGlsIHRoZSB1c2VyIGxlYXZlcyB0aGUgZmllbGQsIGFuZCB0aGUgZGVib3VuY2UgdGltZXJcbiAgICAvLyByZXNldHMgaWYgdGhleSB0YWIgYmV0d2VlbiBzb3VyY2UgZmllbGRzIHF1aWNrbHkuXG4gICAgY29uc3QgaW1tZWRpYXRlQ1ggPSAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5jbG9zZXN0KFwiLkNYQ29udGFpbmVyXCIpO1xuICAgIGNvbnN0IHNvdXJjZUNvbnRhaW5lciA9IGltbWVkaWF0ZUNYPy5wYXJlbnRFbGVtZW50Py5jbG9zZXN0KFwiLkNYQ29udGFpbmVyXCIpID8/IGltbWVkaWF0ZUNYO1xuXG4gICAgaWYgKHNvdXJjZUNvbnRhaW5lcikge1xuICAgICAgZm9yIChjb25zdCBzcmNFbCBvZiBzb3VyY2VDb250YWluZXIucXVlcnlTZWxlY3RvckFsbChcIi5BSV9MTEFNQV9UWFRRQV9Tb3VyY2VcIikpIHtcbiAgICAgICAgc3JjRWwuYWRkRXZlbnRMaXN0ZW5lcihcImZvY3Vzb3V0XCIsIGRlYm91bmNlZEhhbmRsZSk7XG4gICAgICAgIC8vIENhbmNlbCBwZW5kaW5nIGRlYm91bmNlIHdoZW4gYSBzb3VyY2UgZmllbGQgZ2FpbnMgZm9jdXMgXHUyMDE0XG4gICAgICAgIC8vIHRoZSB1c2VyIGlzIHN0aWxsIGZpbGxpbmcgZmllbGRzLCBkb24ndCBzdGFydCBpbmZlcmVuY2UgeWV0LlxuICAgICAgICBzcmNFbC5hZGRFdmVudExpc3RlbmVyKFwiZm9jdXNcIiwgKCkgPT4ge1xuICAgICAgICAgIGlmIChkZWJvdW5jZVRpbWVyKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2VUaW1lcik7XG4gICAgICAgICAgICBkZWJvdW5jZVRpbWVyID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIExpc3RlbiBmb3IgZm9jdXNvdXQgb24gQUlfTExBTUFfVFhUUUFfU291cmNlIGVsZW1lbnRzIFx1MjAxNCBmb2N1c291dCAobm90IGlucHV0L2NoYW5nZSlcbiAgICAvLyAjZW5kcmVnaW9uIFJlZ2lzdGVyIGV2ZW50IGxpc3RlbmVycyBvbiB0cmlnZ2VyIGFuZCBzb3VyY2UgZWxlbWVudHNcbiAgfVxuICAvLyAjcmVnaW9uIFJpY2gtdGV4dCBhbnN3ZXIgb3ZlcmxheSAoY2xpY2thYmxlIGxpbmtzLCBwaG9uZXMsIGVtYWlscylcbiAgLyoqXG4gICAqIEhpZGVzIHRoZSBhbnN3ZXIgZmllbGQgYW5kIHNob3dzIGEgcmljaC10ZXh0IGRpdiB3aXRoIGNsaWNrYWJsZSBsaW5rcyxcbiAgICogcGhvbmUgbnVtYmVycyBhbmQgZW1haWwgYWRkcmVzc2VzLiBDbGlja2luZyB0aGUgZGl2IHJldmVhbHMgdGhlIGZpZWxkIGZvciBlZGl0aW5nLlxuICAgKlxuICAgKiBAcGFyYW0gZmllbGQgVGhlIGlucHV0IG9yIHRleHRhcmVhIGZpZWxkIGNvbnRhaW5pbmcgdGhlIEFJIGFuc3dlci5cbiAgICogQHBhcmFtIHRleHQgVGhlIEFJIGFuc3dlciB0ZXh0IHRvIGRpc3BsYXkgaW4gdGhlIHJpY2ggb3ZlcmxheSAobWF5IGNvbnRhaW4gTWFya2Rvd24gbGlua3MpLiAqL1xuICBwcml2YXRlIHN0YXRpYyBzaG93UmljaEFuc3dlcihmaWVsZDogSFRNTElucHV0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnQsIHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIC8vIFJlbW92ZSBhbnkgcHJldmlvdXMgcmljaCBhbnN3ZXIgZGl2XG4gICAgY29uc3Qgd3JhcHBlciA9IGZpZWxkLmNsb3Nlc3QoXCIuTExBTUFfQUlfSGludF9XcmFwcGVyXCIpID8/IGZpZWxkLnBhcmVudEVsZW1lbnQ7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB3cmFwcGVyPy5xdWVyeVNlbGVjdG9yKFwiLkxMQU1BX1RYVFFBX1JpY2hBbnN3ZXJcIik7XG5cbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIGV4aXN0aW5nLnJlbW92ZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IHJpY2hEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gICAgcmljaERpdi5jbGFzc05hbWUgPSBcIkxMQU1BX1RYVFFBX1JpY2hBbnN3ZXJcIjtcbiAgICByaWNoRGl2LmlubmVySFRNTCA9IEFJX0xMQU1BX1NUQU5EQVJEX1RYVFFBLmxpbmtpZnlVcmxzKHRleHQpO1xuXG4gICAgZmllbGQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgIGlmIChmaWVsZC5uZXh0U2libGluZykge1xuICAgICAgZmllbGQucGFyZW50RWxlbWVudD8uaW5zZXJ0QmVmb3JlKHJpY2hEaXYsIGZpZWxkLm5leHRTaWJsaW5nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmllbGQucGFyZW50RWxlbWVudD8uYXBwZW5kQ2hpbGQocmljaERpdik7XG4gICAgfVxuXG4gICAgcmljaERpdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgIGlmICgoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmNsb3Nlc3QoXCJhXCIpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmljaERpdi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICBmaWVsZC5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcblxuICAgICAgZmllbGQuZm9jdXMoKTtcbiAgICB9KTtcbiAgICAvLyBXaGVuIHRoZSBmaWVsZCBsb3NlcyBmb2N1cywgcmUtc2hvdyB0aGUgcmljaCBkaXYgd2l0aCB1cGRhdGVkIGNvbnRlbnRcbiAgICBmaWVsZC5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgXCJibHVyXCIsXG4gICAgICAoKSA9PiB7XG4gICAgICAgIHJpY2hEaXYuaW5uZXJIVE1MID0gQUlfTExBTUFfU1RBTkRBUkRfVFhUUUEubGlua2lmeVVybHMoZmllbGQudmFsdWUpO1xuICAgICAgICByaWNoRGl2LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICBmaWVsZC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICB9LFxuICAgICAgeyBvbmNlOiB0cnVlIH0sXG4gICAgKTtcbiAgfVxuICAvKipcbiAgICogSFRNTC1lc2NhcGVzIHRoZSBnaXZlbiBwbGFpbiB0ZXh0LCB0aGVuIGNvbnZlcnRzOlxuICAgKiAgIDEuIE1hcmtkb3duIGxpbmtzIGBbbGFiZWxdKHVybClgIFx1MjE5MiBjbGlja2FibGUgYDxhPmAgd2l0aCB0aGUgbGFiZWwgdGV4dFxuICAgKiAgIDIuIEJhcmUgVVJMcyAoYGh0dHBzOi8vXHUyMDI2YCAvIGBodHRwOi8vXHUyMDI2YCkgXHUyMTkyIGNsaWNrYWJsZSBgPGE+YCBzaG93aW5nIHRoZSBob3N0bmFtZVxuICAgKiAgIDMuIFBob25lIG51bWJlcnMgXHUyMTkyIGNsaWNrYWJsZSBgdGVsOmAgbGluayBpbiBhIGJhZGdlXG4gICAqICAgNC4gRW1haWwgYWRkcmVzc2VzIFx1MjE5MiBjbGlja2FibGUgYG1haWx0bzpgIGxpbmsgaW4gYSBiYWRnZVxuICAgKlxuICAgKiBAcGFyYW0gdGV4dCBUaGUgQUkgYW5zd2VyIHRleHQgdG8gY29udmVydCBpbnRvIHJpY2ggSFRNTC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHJlc3VsdGluZyBIVE1MIHN0cmluZyB3aXRoIGxpbmtzIGFuZCBiYWRnZXMuICovXG4gIHByaXZhdGUgc3RhdGljIGxpbmtpZnlVcmxzKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgbGlua3M6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgcGxhY2Vob2xkZXIgPSAoaWR4OiBudW1iZXIpOiBzdHJpbmcgPT4gYFxceDAwTElOSyR7aWR4fVxceDAwYDtcbiAgICBjb25zdCBlc2NhcGVkID0gdGV4dC5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIikucmVwbGFjZSgvPC9nLCBcIiZsdDtcIikucmVwbGFjZSgvPi9nLCBcIiZndDtcIikucmVwbGFjZSgvXCIvZywgXCImcXVvdDtcIik7XG4gICAgLy8gI3JlZ2lvbiBQcm9jZXNzIE1hcmtkb3duIFVSTHMgZmlyc3QgdG8gYXZvaWQgZG91YmxlLWxpbmtpbmcgVVJMcyB0aGF0IGFyZSBhbHJlYWR5IGxpbmtlZCB2aWEgTWFya2Rvd25cbiAgICBjb25zdCB3aXRoTWQgPSBlc2NhcGVkLnJlcGxhY2UoL1xcWyhbXlxcXV0rKVxcXVxcKChodHRwcz86XFwvXFwvW15cXHMpXSspXFwpL2dpLCAoX21hdGNoLCBsYWJlbDogc3RyaW5nLCB1cmw6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3QgaWR4ID0gbGlua3MubGVuZ3RoO1xuXG4gICAgICBsaW5rcy5wdXNoKGA8YSBocmVmPVwiJHt1cmx9XCIgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPiR7bGFiZWx9PC9hPmApO1xuXG4gICAgICByZXR1cm4gcGxhY2Vob2xkZXIoaWR4KTtcbiAgICB9KTtcbiAgICAvLyAjZW5kcmVnaW9uIFByb2Nlc3MgTWFya2Rvd24gVVJMcyBmaXJzdCB0byBhdm9pZCBkb3VibGUtbGlua2luZyBVUkxzIHRoYXQgYXJlIGFscmVhZHkgbGlua2VkIHZpYSBNYXJrZG93blxuICAgIC8vICNyZWdpb24gUHJvY2VzcyBVUkxzXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0NvbnRyb2xDaGFyYWN0ZXJzSW5SZWdleDogcGxhY2Vob2xkZXIgcGF0dGVybiB1c2VzIFxceDAwIChzYWZlIGRlbGltaXRlcikuXG4gICAgY29uc3Qgd2l0aFVybHMgPSB3aXRoTWQucmVwbGFjZSgvaHR0cHM/OlxcL1xcL1teXFxzPD4mXCInXFx4MDApXFxdXSsvZ2ksICh1cmwpID0+IHtcbiAgICAgIGxldCBsYWJlbCA9IHVybDtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdSA9IG5ldyBVUkwodXJsKTtcblxuICAgICAgICBsYWJlbCA9IHUuaG9zdG5hbWUucmVwbGFjZSgvXnd3d1xcLi8sIFwiXCIpO1xuICAgICAgfSBjYXRjaCB7IH1cblxuICAgICAgY29uc3QgaWR4ID0gbGlua3MubGVuZ3RoO1xuXG4gICAgICBsaW5rcy5wdXNoKGA8YSBocmVmPVwiJHt1cmx9XCIgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPiR7bGFiZWx9PC9hPmApO1xuXG4gICAgICByZXR1cm4gcGxhY2Vob2xkZXIoaWR4KTtcbiAgICB9KTtcbiAgICAvLyAjZW5kcmVnaW9uIFByb2Nlc3MgVVJMc1xuICAgIC8vICNyZWdpb24gUHJvY2VzcyBwaG9uZSBudW1iZXJzXG4gICAgY29uc3Qgd2l0aFBob25lcyA9IHdpdGhVcmxzLnJlcGxhY2UoLyg/OlxcK1xcZHsxLDN9W1xccy4tXT8pPyg/OlxcKD9cXGR7Miw1fVxcKT9bXFxzLlxcLy1dPyl7MSwzfVxcZHsxLDh9L2csIChtYXRjaCkgPT4ge1xuICAgICAgY29uc3QgZGlnaXRzT25seSA9IG1hdGNoLnJlcGxhY2UoL1xcRC9nLCBcIlwiKTtcblxuICAgICAgaWYgKGRpZ2l0c09ubHkubGVuZ3RoIDwgNyB8fCBkaWdpdHNPbmx5Lmxlbmd0aCA+IDE1KSB7XG4gICAgICAgIHJldHVybiBtYXRjaDtcbiAgICAgIH1cblxuICAgICAgaWYgKC9eXFxkezR9XFxzKlstXFx1MjAxM1xcdTIwMTRdXFxzKlxcZHs0fSQvLnRlc3QobWF0Y2gudHJpbSgpKSkge1xuICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICB9XG5cbiAgICAgIGlmICgvXlxcZHs0fVstLy5dXFxkezJ9Wy0vLl1cXGR7Mn0oWy0vLlRcXHNdXFxkezIsNn0oWy0vOl1cXGR7Mn0pezAsMn0pPyQvLnRlc3QobWF0Y2gudHJpbSgpKSkge1xuICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICB9XG5cbiAgICAgIGlmICgvXlxcZHsxLDJ9Wy0vLl1cXGR7MSwyfVstLy5dXFxkezIsNH0kLy50ZXN0KG1hdGNoLnRyaW0oKSkpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgICAgfSAvLyBTa2lwIEV1cm9wZWFuIGRhdGVzIGxpa2UgXCIzMC4wOS4yMDIwXCIsIFwiMDEvMTIvMjAyNVwiLCBcIjE1LTAzLTIwMjRcIlxuXG4gICAgICBpZiAoL15cXGQrXFwuXFxkKyQvLnRlc3QobWF0Y2gudHJpbSgpKSkge1xuICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICB9IC8vIGRlY2ltYWwgLyBHUFNcblxuICAgICAgY29uc3QgaWR4ID0gbGlua3MubGVuZ3RoO1xuICAgICAgY29uc3QgdGVsSHJlZiA9IGB0ZWw6JHttYXRjaC5yZXBsYWNlKC9bXlxcZCtdL2csIFwiXCIpfWA7XG5cbiAgICAgIGxpbmtzLnB1c2goXG4gICAgICAgIGA8c3BhbiBjbGFzcz1cIkxMQU1BX0NoYXRfUGhvbmVCYWRnZVwiPjxzcGFuIGNsYXNzPVwiTExBTUFfQ2hhdF9CYWRnZUljb25cIj5cXHVEODNEXFx1RENERTwvc3Bhbj48YSBocmVmPVwiJHt0ZWxIcmVmfVwiPiR7bWF0Y2h9PC9hPjwvc3Bhbj5gLFxuICAgICAgKTtcblxuICAgICAgcmV0dXJuIHBsYWNlaG9sZGVyKGlkeCk7XG4gICAgfSk7XG4gICAgLy8gI2VuZHJlZ2lvbiBQcm9jZXNzIHBob25lIG51bWJlcnNcbiAgICAvLyAjcmVnaW9uIFByb2Nlc3MgZW1haWwgYWRkcmVzc2VzXG4gICAgY29uc3Qgd2l0aEVtYWlscyA9IHdpdGhQaG9uZXMucmVwbGFjZSgvW2EtekEtWjAtOS5fJStcXC1dK0BbYS16QS1aMC05LlxcLV0rXFwuW2EtekEtWl17Mix9L2csIChtYXRjaCkgPT4ge1xuICAgICAgY29uc3QgaWR4ID0gbGlua3MubGVuZ3RoO1xuXG4gICAgICBsaW5rcy5wdXNoKFxuICAgICAgICBgPHNwYW4gY2xhc3M9XCJMTEFNQV9DaGF0X0VtYWlsQmFkZ2VcIj48c3BhbiBjbGFzcz1cIkxMQU1BX0NoYXRfQmFkZ2VJY29uXCI+XFx1MjcwOTwvc3Bhbj48YSBocmVmPVwibWFpbHRvOiR7bWF0Y2h9XCI+JHttYXRjaH08L2E+PC9zcGFuPmAsXG4gICAgICApO1xuXG4gICAgICByZXR1cm4gcGxhY2Vob2xkZXIoaWR4KTtcbiAgICB9KTtcbiAgICAvLyAjZW5kcmVnaW9uIFByb2Nlc3MgZW1haWwgYWRkcmVzc2VzXG4gICAgLy8gI3JlZ2lvbiBSZXN0b3JlIHBsYWNlaG9sZGVycy5cbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vQ29udHJvbENoYXJhY3RlcnNJblJlZ2V4OiBwbGFjZWhvbGRlciBwYXR0ZXJuIHVzZXMgXFx4MDBcbiAgICByZXR1cm4gd2l0aEVtYWlscy5yZXBsYWNlKC9cXHgwMExJTksoXFxkKylcXHgwMC9nLCAoX20sIGlkeDogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCBodG1sID0gbGlua3NbTnVtYmVyKGlkeCldO1xuXG4gICAgICBpZiAoaHRtbC5zdGFydHNXaXRoKCc8c3BhbiBjbGFzcz1cIkxMQU1BX0NoYXRfUGhvbmUnKSB8fCBodG1sLnN0YXJ0c1dpdGgoJzxzcGFuIGNsYXNzPVwiTExBTUFfQ2hhdF9FbWFpbCcpKSB7XG4gICAgICAgIHJldHVybiBodG1sO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYDxzcGFuIGNsYXNzPVwiTExBTUFfQ2hhdF9Tb3VyY2VCYWRnZVwiPiR7aHRtbH08L3NwYW4+YDtcbiAgICB9KTtcbiAgICAvLyAjZW5kcmVnaW9uIFJlc3RvcmUgcGxhY2Vob2xkZXJzLlxuICB9XG4gIC8vICNlbmRyZWdpb24gUmljaC10ZXh0IGFuc3dlciBvdmVybGF5XG4gIC8vICNyZWdpb24gQUktR2VuZXJhdGVkIGhpbnRcbiAgcHJpdmF0ZSBzdGF0aWMgZW5zdXJlQWlIaW50U3R5bGVzKCk6IHZvaWQge1xuICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI0xMQU1BX0FJX0hpbnRfU3R5bGVzXCIpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG5cbiAgICBzdHlsZS5pZCA9IFwiTExBTUFfQUlfSGludF9TdHlsZXNcIjtcbiAgICBzdHlsZS50ZXh0Q29udGVudCA9IGBcbiAgICAgIC5MTEFNQV9BSV9IaW50X1dyYXBwZXIgeyBwb3NpdGlvbjogcmVsYXRpdmUgOyBkaXNwbGF5OiBibG9jayA7IHdpZHRoOiAxMDAlIDt9XG4gICAgICAuTExBTUFfQUlfSGludCB7IHBvc2l0aW9uOiBhYnNvbHV0ZSA7IHBvaW50ZXItZXZlbnRzOiBub25lIDsgY29sb3I6IHJnYmEoMCwwLDAsMC4zOCkgO1xuICAgICAgICBmb250LXNpemU6IDExcHggOyBsaW5lLWhlaWdodDogMSA7IHdoaXRlLXNwYWNlOiBub3dyYXAgOyB1c2VyLXNlbGVjdDogbm9uZSA7XG4gICAgICAgIHJpZ2h0OiA4cHggOyBib3R0b206IDZweCA7IHotaW5kZXg6IDEgO31gO1xuXG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG4gIH1cbiAgLyoqXG4gICAqIEF0dGFjaGVzIGFuIEFJLWdlbmVyYXRlZCBoaW50IHRvIHRoZSBzcGVjaWZpZWQgaW5wdXQgb3IgdGV4dGFyZWEgZmllbGQuXG4gICAqXG4gICAqIEBwYXJhbSBmaWVsZCAgICAgVGhlIGlucHV0IG9yIHRleHRhcmVhIGVsZW1lbnQgdG8gYXR0YWNoIHRoZSBoaW50IHRvLlxuICAgKiBAcGFyYW0gaGludFRleHQgIFRoZSB0ZXh0IG9mIHRoZSBBSS1nZW5lcmF0ZWQgaGludC4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgYXR0YWNoQWlIaW50KGZpZWxkOiBIVE1MSW5wdXRFbGVtZW50IHwgSFRNTFRleHRBcmVhRWxlbWVudCwgaGludFRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIEFJX0xMQU1BX1NUQU5EQVJEX1RYVFFBLmVuc3VyZUFpSGludFN0eWxlcygpO1xuXG4gICAgY29uc3QgZXhpc3RpbmdIaW50ID0gZmllbGQucGFyZW50RWxlbWVudD8ucXVlcnlTZWxlY3RvcihcIi5MTEFNQV9BSV9IaW50XCIpO1xuXG4gICAgaWYgKGV4aXN0aW5nSGludCkge1xuICAgICAgZXhpc3RpbmdIaW50LnJlbW92ZSgpO1xuICAgIH1cblxuICAgIGxldCB3cmFwcGVyID0gZmllbGQucGFyZW50RWxlbWVudDtcblxuICAgIGlmICghd3JhcHBlcj8uY2xhc3NMaXN0LmNvbnRhaW5zKFwiTExBTUFfQUlfSGludF9XcmFwcGVyXCIpKSB7XG4gICAgICB3cmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICB3cmFwcGVyLmNsYXNzTmFtZSA9IFwiTExBTUFfQUlfSGludF9XcmFwcGVyXCI7XG5cbiAgICAgIGZpZWxkLnBhcmVudEVsZW1lbnQ/Lmluc2VydEJlZm9yZSh3cmFwcGVyLCBmaWVsZCk7XG4gICAgICB3cmFwcGVyLmFwcGVuZENoaWxkKGZpZWxkKTtcbiAgICB9XG5cbiAgICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuXG4gICAgYmFkZ2UuY2xhc3NOYW1lID0gXCJMTEFNQV9BSV9IaW50XCI7XG4gICAgYmFkZ2UudGV4dENvbnRlbnQgPSBoaW50VGV4dDtcblxuICAgIHdyYXBwZXIuYXBwZW5kQ2hpbGQoYmFkZ2UpO1xuXG4gICAgY29uc3QgcmVtb3ZlSGludCA9ICgpID0+IHtcbiAgICAgIGJhZGdlLnJlbW92ZSgpO1xuICAgICAgZmllbGQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIHJlbW92ZUhpbnQpO1xuICAgIH07XG5cbiAgICBmaWVsZC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgcmVtb3ZlSGludCk7XG4gIH1cbiAgLy8gI2VuZHJlZ2lvbiBBSS1HZW5lcmF0ZWQgaGludFxufVxuLy8gI3JlZ2lvbiBSZWdpc3RlciBmdW5jdGlvbmFsaXR5IHdpdGggQ29kQmlcbndpbmRvdy5jb2RiaS5yZWdpc3RlckZ1bmN0aW9uYWxpdHkoXG4gIFwiQUkuTExBTUEuU1RBTkRBUkQuVFhUUUFcIixcbiAgQUlfTExBTUFfU1RBTkRBUkRfVFhUUUEuZnVuY3Rpb25hbGl0eS5iaW5kKEFJX0xMQU1BX1NUQU5EQVJEX1RYVFFBKSxcbik7XG4vLyAjZW5kcmVnaW9uIFJlZ2lzdGVyIGZ1bmN0aW9uYWxpdHkgd2l0aCBDb2RCaVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSw4QkFBMEI7QUFxQm5CLElBQU0sMkJBQU4sTUFBTSx5QkFBd0I7QUFBQSxFQUVuQztBQUFBO0FBQUEsU0FBd0Isa0JBQTBCLGFBQWE7QUFBQTtBQUFBLEVBNkMvRCxPQUFjLGNBaUJaLFFBT0EsV0FDTTtBQUVOLFVBQU0sVUFBVyxVQUEwQixRQUFRLFlBQVk7QUFDL0QsVUFBTSxZQUFhLFVBQStCLE1BQU0sWUFBWTtBQUVwRSxRQUFJLFlBQVksY0FBYyxFQUFFLFlBQVksV0FBVyxjQUFjLFNBQVM7QUFDNUUsYUFBTyxNQUFNO0FBQUEsUUFDWDtBQUFBLFFBQ0EsK0VBQStFLFFBQVEsWUFBWSxDQUFDLEdBQUcsWUFBWSxVQUFVLFNBQVMsTUFBTSxFQUFFO0FBQUEsUUFDOUk7QUFBQSxNQUNGO0FBRUE7QUFBQSxJQUNGO0FBR0EsVUFBTSxhQUFhLE9BQU8sV0FBVyxPQUFPLE9BQU8sUUFBUSxJQUFJO0FBQy9ELFVBQU0sb0JBQW9CLE9BQU8saUJBQWlCLE9BQU8sT0FBTyxjQUFjLElBQUksS0FBSztBQUV2RixRQUFJLGdCQUFzRDtBQUMxRCxRQUFJLHNCQUE0RDtBQUNoRSxRQUFJLG1CQUFtQjtBQUV2QixVQUFNLGFBQWEsT0FBTyxVQUFVLE9BQU8sVUFBVSxPQUFPLE9BQU8sTUFBTSxDQUFDLEtBQUs7QUFDL0UsVUFBTSxpQkFBaUIsT0FBTyxlQUFlLFFBQVEsT0FBTyxPQUFPLFdBQVcsRUFBRSxZQUFZLE1BQU07QUFD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
