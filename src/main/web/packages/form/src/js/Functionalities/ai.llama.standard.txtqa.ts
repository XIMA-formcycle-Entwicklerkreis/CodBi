// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { IF } from "xdbc/src/DBC/IF";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { OR } from "xdbc/src/DBC/OR";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
// #endregion XDBC
// #endregion Imports

/**
 * Provides the {@link AI_LLAMA_STANDARD_TXTQA.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_LLAMA_STANDARD_TXTQA {
  /** Unique session ID generated on page load — ensures each session gets its own llama-server slot. */
  private static readonly PAGE_SESSION_ID: string = crypto.randomUUID();

  /**
   * This functionality answers questions based on the text content of one or more
   * `<input type="text">` or `<textarea>` elements. It is triggered whenever any of
   * the source text fields change. No file upload is required.
   *
   * ### How it works:
   * 1. Tag the `<input type="text">` or `<textarea>` element with the functionality
   *    **ai.llama.standard.txtqa** in the CodBi designer. This is the **trigger element**.
   *    Multiple trigger elements may exist in the same container.
   * 2. Additional elements tagged with the CSS class **AI_LLAMA_TXTQA_Source** within the
   *    same XContainer also trigger inference when their value changes.
   * 3. Question elements are tagged with the CSS class **AI_LLAMA_STANDARD_TXTQA_Question**.
   *    Each question element must have:
   *    - An **id** attribute (used as the question key — the AI response is placed into the
   *      element with this id)
   *    - A **data-cb-Question** attribute containing the question text, which may include
   *      placeholder symbols like `<[FieldName]>` that resolve to the value of the
   *      field with CSS class "FieldName" in the same container. Use these placeholders
   *      to incorporate the trigger element's value and any other field values into the
   *      question.
   *
   * ### Config Parameters:
   * - **AIHint**:          Text shown inside AI-populated fields until the user edits
   *                        the value. Default: "✨ AI-Generated". Set empty to disable.
   *
   *                        Note: **According to the EU AI Act, AI-generated content must
   *                        be clearly labeled. Changing or disabling the AIHint may lead to
   *                        non-compliance in certain jurisdictions.**
   * - **useinternet**:     If set to `true`, enables Brave Search internet access.
   *                        Default: `false`.
   * - **debounce**:        Debounce delay in milliseconds before sending the request after
   *                        the last change event. Default: `500`.
   * - **inferencedelay**:  Maximum seconds to wait for all source fields to be filled
   *                        before starting inference anyway. Default: `5`.
   * - **language**:        Language for the AI response (e.g. "German", "English").
   *                        If set, appends "Answer in {language}." to each question.
   *
   * **Sub-container exclusion:** Like ai.llama.standard.qa, nested `.CXContainer` elements
   * tagged with **AI_LLAMA_QA_Exclude** are excluded from question searches.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. Must be an `<input type="text">` or `<textarea>`. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "aihint")
    @GREATER.PRE(
      3,
      true,
      false,
      "aihint.length",
      "According to the EU AI Act, AI-generated content must be clearly labeled. Changing or disabling the AIHint may lead to non-compliance in certain jurisdictions.",
    )
    @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "debounce")
    @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "inferencedelay")
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
        `ai.llama.standard.txtqa requires an <input type="text"> or <textarea>, got <${tagName.toLowerCase()}${inputType ? ` type="${inputType}"` : ""}>`,
        "AI / LLAMA / TXTQA",
      );
      return;
    }

    const debounceMs = toLoad.debounce ? Number(toLoad.debounce) : 500;
    const inferenceDelayMs = (toLoad.inferencedelay ? Number(toLoad.inferencedelay) : 5) * 1000;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let inferenceDelayTimer: ReturnType<typeof setTimeout> | null = null;
    let inferenceStarted = false;

    const aiHintText = toLoad.aihint != null ? `\u2728 ${String(toLoad.aihint)}` : "\u2728 AI-Generated";

    const internetAccess = toLoad.useinternet != null && String(toLoad.useinternet).toLowerCase() === "true";
    const locationAccess = toLoad.location != null && String(toLoad.location).toLowerCase() === "true";
    const responseLanguage = toLoad.language != null ? String(toLoad.language).trim() : "";

    const $ = getJQuery();

    const handleChange = async (force = false) => {
      // #region Determine the search container
      const immediateCX = (toProcess as HTMLElement).closest(".CXContainer");
      let container: Element | null;
      if (immediateCX?.classList.contains("AI_LLAMA_QA_Exclude")) {
        container = immediateCX;
      } else {
        container = immediateCX?.parentElement?.closest(".CXContainer") ?? immediateCX;
      }
      if (!container) {
        window.codbi.log(
          "ERROR",
          `Could not find ancestor .CXContainer for element #${toProcess.getAttribute("id")}`,
          "AI / LLAMA / TXTQA",
        );
        return;
      }
      // #endregion Determine the search container

      // #region Wait until all source fields are filled (unless forced)
      if (!force) {
        const sourceElements = container.querySelectorAll(".AI_LLAMA_TXTQA_Source");
        for (const srcEl of sourceElements) {
          const val = (srcEl as HTMLInputElement | HTMLTextAreaElement).value?.trim();
          if (!val) {
            return; // Not all source fields are filled yet
          }
        }
      }
      // Cancel the inference delay timer since we're proceeding now
      if (inferenceDelayTimer) {
        clearTimeout(inferenceDelayTimer);
        inferenceDelayTimer = null;
      }
      if (inferenceStarted) {
        return; // Already running
      }
      inferenceStarted = true;
      // #endregion Wait until all source fields are filled (unless forced)

      // #region Acquire questions
      const allQuestionElements = container.querySelectorAll(".AI_LLAMA_STANDARD_TXTQA_Question");
      const questionElements: Element[] = [];
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

      const headers: { [key: string]: string } = {};
      headers["X-Session-Id"] = AI_LLAMA_STANDARD_TXTQA.PAGE_SESSION_ID;
      headers["X-Search"] = internetAccess ? "true" : "false";

      if (locationAccess) {
        headers["X-Location"] = "true";
        if (navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 300_000,
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
            const field = document.querySelector(`.${trimmed}`) as HTMLInputElement | null;
            if (field && "value" in field) {
              return field.value;
            }
            return match;
          });
          // Append language instruction if configured
          if (responseLanguage) {
            question = `${question} Answer in ${responseLanguage}.`;
          }
          // Base64-encode to avoid invalid HTTP header characters (newlines, Unicode)
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
        window.codbi.log("WARNING", "No questions found — nothing to send", "AI / LLAMA / TXTQA");
        return;
      }
      // #endregion Acquire questions

      // #region Ensure Processing animation styles exist
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
      // #endregion Ensure Processing animation styles exist

      // #region Show loading animation on question fields
      const tsToProcess = toProcess as HTMLElement;
      tsToProcess.style.pointerEvents = "none";
      tsToProcess.style.opacity = "0.5";

      // Disable answer fields during inference and show loading animation
      for (const element of questionElements) {
        const field = document.querySelector(`#${element.id}`) as HTMLInputElement | null;
        if (field) {
          field.disabled = true;
          field.style.opacity = "0.5";
          window.codbi.injectLoadingAnim(field);
        }
      }

      // Disable AI_LLAMA_TXTQA_Source elements during inference
      const disabledSources: HTMLElement[] = [];
      if (container) {
        for (const srcEl of container.querySelectorAll(".AI_LLAMA_TXTQA_Source")) {
          const el = srcEl as HTMLInputElement;
          el.disabled = true;
          el.style.opacity = "0.5";
          disabledSources.push(el);
        }
      }
      // #endregion Show loading animation on question fields

      // #region Finalize UI when all requests complete
      let completedCount = 0;
      const totalQuestions = questionElements.length;

      const finalizeAll = () => {
        tsToProcess.style.pointerEvents = "all";
        tsToProcess.style.opacity = "1";
        // Re-enable source elements
        for (const el of disabledSources) {
          (el as HTMLInputElement).disabled = false;
          el.style.opacity = "1";
        }
        inferenceStarted = false;
      };
      // #endregion Finalize UI when all requests complete

      // #region Send one request per question (progressive display)
      // Build shared headers (everything except X-Question-* entries)
      const sharedHeaders: { [key: string]: string } = {};
      for (const key of Object.keys(headers)) {
        if (!key.startsWith("X-Question-")) {
          sharedHeaders[key] = headers[key];
        }
      }

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

        const perQuestionHeaders: { [key: string]: string } = {
          ...sharedHeaders,
          [`X-Question-${id}`]: questionHeader,
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
            for (const headerName of Object.keys(perQuestionHeaders)) {
              xhr.setRequestHeader(headerName, perQuestionHeaders[headerName]);
            }
          },
          success: (response) => {
            const field = document.querySelector(`#${id}`) as HTMLInputElement | HTMLTextAreaElement | null;
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
                  AI_LLAMA_STANDARD_TXTQA.attachAiHint(field, aiHintText);
                }
                // Show rich-text overlay with clickable links/phones/emails
                AI_LLAMA_STANDARD_TXTQA.showRichAnswer(field, answerText);
                // Flash green to signal response is ready
                const richDiv = (
                  field.nextElementSibling?.classList.contains("LLAMA_TXTQA_RichAnswer")
                    ? field.nextElementSibling
                    : field
                ) as HTMLElement;
                richDiv.classList.remove("LLAMA_ResponseReady");
                void richDiv.offsetWidth; // force reflow to restart animation
                richDiv.classList.add("LLAMA_ResponseReady");
                richDiv.addEventListener("animationend", () => richDiv.classList.remove("LLAMA_ResponseReady"), {
                  once: true,
                });
                field.dispatchEvent(new Event("change", { bubbles: true }));
              }
            }
            // Re-enable this question's field
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
          error: (_xhr, status, error) => {
            const field = document.querySelector(`#${id}`) as HTMLInputElement | null;
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
        });
      }
      // #endregion Send one request per question (progressive display)
    };

    // Debounced change handler
    const debouncedHandle = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        handleChange();
      }, debounceMs);

      // Start the inference delay timer on the first source interaction.
      // If not all fields are filled within inferenceDelayMs, force inference.
      if (!inferenceDelayTimer && !inferenceStarted) {
        inferenceDelayTimer = setTimeout(() => {
          inferenceDelayTimer = null;
          handleChange(true);
        }, inferenceDelayMs);
      }
    };

    // Listen for changes on the trigger element (change fires on focus loss)
    (toProcess as HTMLElement).addEventListener("change", debouncedHandle);

    // Listen for focusout on AI_LLAMA_TXTQA_Source elements — focusout (not input/change)
    // so inference waits until the user leaves the field, and the debounce timer
    // resets if they tab between source fields quickly.
    const immediateCX = (toProcess as HTMLElement).closest(".CXContainer");
    const sourceContainer = immediateCX?.parentElement?.closest(".CXContainer") ?? immediateCX;
    if (sourceContainer) {
      for (const srcEl of sourceContainer.querySelectorAll(".AI_LLAMA_TXTQA_Source")) {
        srcEl.addEventListener("focusout", debouncedHandle);
        // Cancel pending debounce when a source field gains focus —
        // the user is still filling fields, don't start inference yet.
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
   */
  private static showRichAnswer(field: HTMLInputElement | HTMLTextAreaElement, text: string): void {
    // Remove any previous rich answer div
    const wrapper = field.closest(".LLAMA_AI_Hint_Wrapper") ?? field.parentElement;
    const existing = wrapper?.querySelector(".LLAMA_TXTQA_RichAnswer");
    if (existing) {
      existing.remove();
    }

    const richDiv = document.createElement("div");
    richDiv.className = "LLAMA_TXTQA_RichAnswer";
    richDiv.innerHTML = AI_LLAMA_STANDARD_TXTQA.linkifyUrls(text);

    // Hide the field, show the rich div
    field.style.display = "none";
    if (field.nextSibling) {
      field.parentElement?.insertBefore(richDiv, field.nextSibling);
    } else {
      field.parentElement?.appendChild(richDiv);
    }

    // Click the rich div → hide it, show & focus the field for editing
    richDiv.addEventListener("click", (e) => {
      // Don't intercept clicks on actual links
      if ((e.target as HTMLElement).closest("a")) {
        return;
      }
      richDiv.style.display = "none";
      field.style.display = "";
      field.focus();
    });

    // When the field loses focus, re-show the rich div with updated content
    field.addEventListener(
      "blur",
      () => {
        richDiv.innerHTML = AI_LLAMA_STANDARD_TXTQA.linkifyUrls(field.value);
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
   */
  private static linkifyUrls(text: string): string {
    const links: string[] = [];
    const placeholder = (idx: number): string => `\x00LINK${idx}\x00`;

    // 1. HTML-escape
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    // 2. Markdown links [label](url) → placeholder
    const withMd = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, (_match, label: string, url: string) => {
      const idx = links.length;
      links.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
      return placeholder(idx);
    });

    // 3. Bare URLs → placeholder
    // biome-ignore lint/suspicious/noControlCharactersInRegex: placeholder pattern uses \x00
    const withUrls = withMd.replace(/https?:\/\/[^\s<>&"'\x00)\]]+/gi, (url) => {
      let label = url;
      try {
        const u = new URL(url);
        label = u.hostname.replace(/^www\./, "");
      } catch {
        /* keep full URL as label */
      }
      const idx = links.length;
      links.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
      return placeholder(idx);
    });

    // 4. Phone numbers → tel: placeholder
    const withPhones = withUrls.replace(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.\/-]?){1,3}\d{1,8}/g, (match) => {
      const digitsOnly = match.replace(/\D/g, "");
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        return match;
      }
      if (/^\d{4}\s*[-\u2013\u2014]\s*\d{4}$/.test(match.trim())) {
        return match; // year range
      }
      // Skip date / datetime stamps like "2026-02-24", "2026-02-24-12-46-27"
      if (/^\d{4}[-/.]\d{2}[-/.]\d{2}([-/.T]\d{2}([-/:]\d{2}){0,2})?$/.test(match.trim())) {
        return match;
      }
      // Skip European dates like "30.09.2020", "01/12/2025", "15-03-2024"
      if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(match.trim())) {
        return match;
      }
      if (/^\d+\.\d+$/.test(match.trim())) {
        return match; // decimal / GPS
      }
      const idx = links.length;
      const telHref = `tel:${match.replace(/[^\d+]/g, "")}`;
      links.push(
        `<span class="LLAMA_Chat_PhoneBadge"><span class="LLAMA_Chat_BadgeIcon">\uD83D\uDCDE</span><a href="${telHref}">${match}</a></span>`,
      );
      return placeholder(idx);
    });

    // 5. Email addresses → mailto: placeholder
    const withEmails = withPhones.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, (match) => {
      const idx = links.length;
      links.push(
        `<span class="LLAMA_Chat_EmailBadge"><span class="LLAMA_Chat_BadgeIcon">\u2709</span><a href="mailto:${match}">${match}</a></span>`,
      );
      return placeholder(idx);
    });

    // 6. Restore placeholders
    // biome-ignore lint/suspicious/noControlCharactersInRegex: placeholder pattern uses \x00
    return withEmails.replace(/\x00LINK(\d+)\x00/g, (_m, idx: string) => {
      const html = links[Number(idx)];
      if (html.startsWith('<span class="LLAMA_Chat_Phone') || html.startsWith('<span class="LLAMA_Chat_Email')) {
        return html;
      }
      return `<span class="LLAMA_Chat_SourceBadge">${html}</span>`;
    });
  }
  // #endregion Rich-text answer overlay

  // #region AI-Generated hint
  private static ensureAiHintStyles(): void {
    if (document.querySelector("#LLAMA_AI_Hint_Styles")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "LLAMA_AI_Hint_Styles";
    style.textContent = `
      .LLAMA_AI_Hint_Wrapper { position: relative ; display: inline-block ; width: 100% ;}
      .LLAMA_AI_Hint { position: absolute ; pointer-events: none ; color: rgba(0,0,0,0.38) ;
        font-size: 11px ; line-height: 1 ; white-space: nowrap ; user-select: none ;
        right: 8px ; bottom: 6px ;}`;
    document.head.appendChild(style);
  }

  private static attachAiHint(field: HTMLInputElement | HTMLTextAreaElement, hintText: string): void {
    AI_LLAMA_STANDARD_TXTQA.ensureAiHintStyles();

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
}

// #region Register functionality with CodBi
window.codbi.registerFunctionality(
  "AI.LLAMA.STANDARD.TXTQA",
  AI_LLAMA_STANDARD_TXTQA.functionality.bind(AI_LLAMA_STANDARD_TXTQA),
);
// #endregion Register functionality with CodBi
