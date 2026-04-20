// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
import { generateUUID } from "../global-scope";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { IF } from "xdbc/src/DBC/IF";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { OR } from "xdbc/src/DBC/OR";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
// #endregion XDBC
import { formatWaitTime } from "../commons/format-wait-time";
import { acquireWakeLock, releaseWakeLock } from "../commons/wake-lock";
// #endregion Imports

/**
 * Provides the {@link AI_LLAMA_STANDARD_TXTQA.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_LLAMA_STANDARD_TXTQA {
  /** Unique session ID generated on page load — ensures each session gets its own llama-server slot. */
  private static readonly PAGE_SESSION_ID: string = generateUUID();
  /**
   * This functionality answers questions based on the text content of one or more * {@link HTMLInputElement } of type "text" or
   * {@link HTMLTextAreaElement } elements. It is triggered whenever any of the source text fields change.
   *
   * Multiple trigger elements tagged with **AI_LLAMA_TXTQA_Source** may exist in the within the same **XContainer**.
   * Question elements are tagged with the CSS class **AI_LLAMA_STANDARD_TXTQA_Question**. Each question element must have:
   *    - An **id** attribute (used as the question key — the AI response is placed into the element with this id)
   *    - A **data-cb-Question** attribute containing the question text, which may include placeholder symbols like
   *      `<[FieldName]>` that resolve to the value of the field with CSS class **"FieldName"** in the same container.
   *      Use these placeholders to incorporate the trigger element's value and any other field values into the question.
   *    - Nested `.XContainer` elements tagged with **AI_LLAMA_QA_Exclude** are excluded from question searches.
   *
   * ### Config Parameters:
   * - **AIHint**:          Text shown inside AI-populated fields until the user edits the value. Default: "✨ AI-Generated".
   *                        Set empty to disable.
   *
   *                        Note: **According to the EU AI Act, AI-generated content must be clearly labeled. Changing or
   *                        disabling the AIHint may lead to non-compliance in certain jurisdictions.**
   * - **useinternet**:     If set to `true`, enables Brave Search internet access. Default: `false`.
   * - **debounce**:        Debounce delay in milliseconds before sending the request after the last change event. Default: `500`.
   * - **inferencedelay**:  Maximum seconds to wait for all source fields to be filled before starting inference anyway.
   *                        Default: `5`.
   * - **location**:        If set to `true`, enables geolocation access. The user's coordinates are sent to the AI for
   *                        location-aware answers. Default: `false`.
   * - **language**:        Language for the AI response (e.g. "German", "English"). If set, appends "Answer in {language}."
   *                        to each question.
   * - **ResponseLanguage**: Two-letter ISO 639-1 code (e.g. `"de"`, `"fr"`). Forces the AI to
   *                        respond in this language, skipping auto-detection. Overrides the
   *                        `AI_LLAMA_STD_Language` plugin property for this instance.
   * - **Specialist**:      Name of a specialist model registered via `AI_LLAMA_STD_SPECIALIST_XXX`
   *                        plugin property. Routes requests to that specialist's dedicated server
   *                        instance (case-insensitive match).
   * - **QueueBadge**:      If set to `"true"`, shows a badge with the current queue position while
   *                        waiting for inference. Overrides the `AI_QueueBadge` plugin property
   *                        for this instance. Default: determined by plugin property.
   * - **QueueText**:       Text appended after the queue position number in the badge
   *                        (e.g. `"in queue"` → badge shows `"3 in queue"`). Default: empty.
   * - **FilterResults**:   If set to `"true"`, enables PII filtering on Brave Search queries
   *                        for this instance, overriding the global `AI_BraveSearch_FilterResults`
   *                        plugin property. Default: determined by plugin property.
   * - **Thinking**:        If set to `true`, enables thinking mode. The AI will use a dedicated
   *                        thinking model (if configured) for deeper reasoning. Default: `false`.
   * - **MaxThinkingTokens**: Maximum token budget for thinking inference. Set higher if the
   *                        model needs more room to reason. Has no effect when Thinking is `false`.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE(
      "string",
      "aihint, language, responselanguage, specialist, queuebadge, queuetext, disablefrequencypenalty",
    )
    @TYPE.PRE("string | boolean", "useinternet, location")
    @GREATER.PRE(
      3,
      true,
      false,
      "aihint.length",
      "According to the EU AI Act, AI-generated content must be clearly labeled. Changing or disabling the AIHint may lead to non-compliance in certain jurisdictions.",
    )
    @IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "useinternet")
    @IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "location")
    @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "debounce")
    @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "inferencedelay")
    @IF.PRE(new TYPE("string"), new REGEX(/^[a-z]{2}$/i), "responselanguage")
    @OR.PRE([new TYPE("string"), new TYPE("boolean")], "filterresults, thinking")
    @IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "filterresults")
    @IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "thinking")
    @OR.PRE([new TYPE("number"), new TYPE("string")], "maxthinkingtokens")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(
      HTMLInputElement,
      undefined,
      'Is it not an <input type="text"/> or <textarea> that is tagged with this functionality?',
    )
    toProcess: Element,
  ): void {
    // #region Determine if early exit is appropriate.
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
    // #endregion Determine if early exit is appropriate.
    // #region Initialize config from toLoad
    const debounceMs = toLoad.debounce ? Number(toLoad.debounce) : 500;
    const inferenceDelayMs = (toLoad.inferencedelay ? Number(toLoad.inferencedelay) : 5) * 1000;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let inferenceDelayTimer: ReturnType<typeof setTimeout> | null = null;
    let inferenceStarted = false;

    const aiHintText = toLoad.aihint != null ? `\u2728 ${String(toLoad.aihint)}` : "\u2728 AI-Generated";
    const internetAccess = toLoad.useinternet != null && String(toLoad.useinternet).toLowerCase() === "true";
    const locationAccess = toLoad.location != null && String(toLoad.location).toLowerCase() === "true";
    const responseLanguage = toLoad.language != null ? String(toLoad.language).trim() : "";
    const responseLang = toLoad.responselanguage != null ? String(toLoad.responselanguage).trim() : "";
    const specialist = toLoad.specialist != null ? String(toLoad.specialist).trim() : "";
    const $ = getJQuery();
    // #endregion Initialize config from toLoad
    const handleChange = async (force = false) => {
      // #region Determine the search container
      const container = (toProcess as HTMLElement).closest(".XContainer");

      if (!container) {
        window.codbi.log(
          "ERROR",
          `Could not find ancestor .XContainer for element #${toProcess.getAttribute("id")}`,
          "AI / LLAMA / TXTQA",
        );

        return;
      }
      // #endregion Determine the search container
      // #region Wait until all source fields are filled (unless forced)
      const sourceElements = container.querySelectorAll(".AI_LLAMA_TXTQA_Source");

      if (!force) {
        for (const srcEl of sourceElements) {
          const val = (srcEl as HTMLInputElement | HTMLTextAreaElement).value?.trim();

          if (!val) {
            return;
          }
        }
      } else {
        // Even when forced, abort if ALL source fields AND the trigger field are empty.
        let hasAnyContent = !!(toProcess as HTMLInputElement | HTMLTextAreaElement).value?.trim();

        if (!hasAnyContent) {
          for (const srcEl of sourceElements) {
            if ((srcEl as HTMLInputElement | HTMLTextAreaElement).value?.trim()) {
              hasAnyContent = true;
              break;
            }
          }
        }

        if (!hasAnyContent) {
          return;
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
      acquireWakeLock();
      // #endregion Wait until all source fields are filled (unless forced)
      // #region Acquire questions
      // #region Collect question elements (excluding AI_LLAMA_QA_Exclude sub-containers)
      const allQuestionElements = container.querySelectorAll(".AI_LLAMA_STANDARD_TXTQA_Question");
      const questionElements: Element[] = [];

      for (const qEl of allQuestionElements) {
        const innerContainer = qEl.closest(".XContainer");

        if (
          innerContainer &&
          innerContainer !== container &&
          innerContainer.classList.contains("AI_LLAMA_QA_Exclude")
        ) {
          continue;
        }

        questionElements.push(qEl);
      }
      // #endregion Collect question elements (excluding AI_LLAMA_QA_Exclude sub-containers)
      // #region Build request headers
      const headers: { [key: string]: string } = {};

      headers["X-Session-Id"] = AI_LLAMA_STANDARD_TXTQA.PAGE_SESSION_ID;
      headers["X-Search"] = internetAccess ? "true" : "false";
      if (toLoad.filterresults != null) {
        headers["X-Filter-Results"] = String(toLoad.filterresults).toLowerCase() === "true" ? "true" : "false";
      }
      // #region Thinking mode toggle
      const thinking = toLoad.thinking != null && String(toLoad.thinking).toLowerCase() === "true";

      headers["X-Thinking"] = thinking ? "true" : "false";

      if (thinking) {
        const customBudget = toLoad.maxthinkingtokens != null ? Number(toLoad.maxthinkingtokens) : 0;

        if (customBudget > 0) {
          headers["X-Max-Thinking-Tokens"] = String(customBudget);
        }
      }
      // #endregion Thinking mode toggle
      if (responseLang) {
        headers["X-Forced-Language"] = responseLang;
      }
      if (specialist) {
        headers["X-Specialist"] = specialist;
      }
      if (toLoad.disablefrequencypenalty != null && String(toLoad.disablefrequencypenalty).toLowerCase() === "true") {
        headers["X-Disable-Frequency-Penalty"] = "true";
      }
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
      // #endregion Geolocation
      // #region Resolve symbols and encode questions into headers
      for (const element of questionElements) {
        const id = element.id;

        let question = element.getAttribute("data-cb-Question");

        if (id && question) {
          question = question.replace(/<\[([^\]]+)\]>/g, (match, identifier) => {
            const trimmed = identifier.trim();
            // Scope to container first (handles repeatable rows), fall back to document.
            let el: HTMLElement | null =
              container.querySelector(`${trimmed}`) ??
              DEFINED.tsCheck<HTMLElement>(document.querySelector(`${trimmed}`));

            if (el && !("value" in el)) {
              el = el.querySelector("input, textarea, select");
            }

            if (el && "value" in el) {
              return (el as HTMLInputElement).value;
            }

            return match;
          });
          // Append language instruction if configured
          if (responseLanguage) {
            question = `${question} Answer in ${responseLanguage}.`;
          }

          headers[`X-Question-${id}`] = btoa(unescape(encodeURIComponent(question))); // Base64-encode to avoid invalid HTTP header characters (newlines, Unicode)
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
      // #endregion Resolve symbols and encode questions into headers
      if (!Object.keys(headers).some((k) => k.startsWith("X-Question-"))) {
        window.codbi.log("WARNING", "No questions found — nothing to send", "AI / LLAMA / TXTQA");

        return;
      }
      // #endregion Build request headers
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
      // #region Disable input and show loading animation
      const tsToProcess = toProcess as HTMLElement;

      tsToProcess.style.pointerEvents = "none";
      tsToProcess.style.opacity = "0.5";
      // #region Disable answer fields during inference
      for (const element of questionElements) {
        const field = document.querySelector(`#${element.id}`) as HTMLInputElement | null;

        if (field) {
          field.disabled = true;
          field.style.opacity = "0.5";
          window.codbi.injectLoadingAnim(field);
        }
      }
      // #endregion Disable answer fields during inference
      // #region Disable source fields during inference
      const disabledSources: HTMLElement[] = [];

      if (container) {
        for (const srcEl of container.querySelectorAll(".AI_LLAMA_TXTQA_Source")) {
          const el = srcEl as HTMLInputElement;

          el.disabled = true;
          el.style.opacity = "0.5";

          disabledSources.push(el);
        }
      }
      // #endregion Disable source fields during inference
      // #endregion Disable input and show loading animation
      // #region Finalize UI when all requests complete
      let completedCount = 0;

      const totalQuestions = questionElements.length;
      const finalizeAll = () => {
        tsToProcess.style.pointerEvents = "all";
        tsToProcess.style.opacity = "1";
        releaseWakeLock();
        // Re-enable source elements
        for (const el of disabledSources) {
          (el as HTMLInputElement).disabled = false;
          el.style.opacity = "1";
        }

        inferenceStarted = false;
      };
      // #endregion Finalize UI when all requests complete
      // #region Send one request per question (progressive display)
      // #region Build shared headers (everything except X-Question-* entries)
      const sharedHeaders: { [key: string]: string } = {};

      for (const key of Object.keys(headers)) {
        if (!key.startsWith("X-Question-")) {
          sharedHeaders[key] = headers[key];
        }
      }
      // #endregion Build shared headers (everything except X-Question-* entries)
      // #region Per-question AJAX requests
      // #region Queue badge configuration.
      const txtQaQueueOverride: boolean | null =
        toLoad.queuebadge != null ? String(toLoad.queuebadge) !== "false" : null;
      const txtQaQueueText: string = toLoad.queuetext != null ? String(toLoad.queuetext) : "";
      // #endregion Queue badge configuration.
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

        let fieldQueueBadge: HTMLSpanElement | null = null;

        const showFieldQueueBadge = (position: number, estimatedWaitMs?: number | null) => {
          const field = document.querySelector(`#${id}`) as HTMLElement | null;
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

        let txtQaQueueTicket: string | null = null;

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
                setTimeout(sendTxtQaRequest, 1000);
                return;
              }
              hideFieldQueueBadge();
              txtQaQueueTicket = null;
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
                  // #region Folded sources section (when internet is enabled)
                  if (internetAccess) {
                    const sources: { title: string; url: string; description: string }[] = response[id]?.sources ?? [];

                    AI_LLAMA_STANDARD_TXTQA.appendSourcesSection(field, sources);
                  }
                  // #endregion Folded sources section (when internet is enabled)
                  // Flash green to signal response is ready
                  const richDiv = INSTANCE.tsCheck<HTMLElement>(
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
            // #endregion Success callback — populate answer field
            // #region Error callback
            error: (_xhr, status, error) => {
              hideFieldQueueBadge();
              const field = document.querySelector(`#${id}`) as HTMLInputElement | HTMLTextAreaElement | null;

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
      // #endregion Per-question AJAX requests
      // #endregion Send one request per question (progressive display)
    };
    // #region Debounced change handler
    const debouncedHandle = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        handleChange();
      }, debounceMs);
      // #region Start the inference delay timer on the first source interaction. If not all fields are filled within inferenceDelayMs, force inference.
      if (!inferenceDelayTimer && !inferenceStarted) {
        inferenceDelayTimer = setTimeout(() => {
          inferenceDelayTimer = null;

          handleChange(true);
        }, inferenceDelayMs);
      }
      // #endregion Start the inference delay timer on the first source interaction. If not all fields are filled within inferenceDelayMs, force inference.
    };
    // #endregion Debounced change handler
    // #region Register event listeners on trigger and source elements
    (toProcess as HTMLElement).addEventListener("change", debouncedHandle);
    // #region Listen for focusout on AI_LLAMA_TXTQA_Source elements — focusout (not input/change)
    // so inference waits until the user leaves the field, and the debounce timer
    // resets if they tab between source fields quickly.
    const immediateCX = (toProcess as HTMLElement).closest(".XContainer");
    const sourceContainer = immediateCX;

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
          if (inferenceDelayTimer) {
            clearTimeout(inferenceDelayTimer);
            inferenceDelayTimer = null;
          }
        });
      }
    }
    // #endregion Listen for focusout on AI_LLAMA_TXTQA_Source elements — focusout (not input/change)
    // #endregion Register event listeners on trigger and source elements
  }
  // #region Rich-text answer overlay (clickable links, phones, emails)
  /**
   * Hides the answer field and shows a rich-text div with clickable links,
   * phone numbers and email addresses. Clicking the div reveals the field for editing.
   *
   * @param field The input or textarea field containing the AI answer.
   * @param text The AI answer text to display in the rich overlay (may contain Markdown links). */
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

    field.style.display = "none";
    if (field.nextSibling) {
      field.parentElement?.insertBefore(richDiv, field.nextSibling);
    } else {
      field.parentElement?.appendChild(richDiv);
    }

    richDiv.addEventListener("click", (e) => {
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
   *
   * @param text The AI answer text to convert into rich HTML.
   *
   * @returns The resulting HTML string with links and badges. */
  private static linkifyUrls(text: string): string {
    const links: string[] = [];
    const placeholder = (idx: number): string => `\x00LINK${idx}\x00`;
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    // #region Process Markdown URLs first to avoid double-linking URLs that are already linked via Markdown
    const withMd = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, (_match, label: string, url: string) => {
      const idx = links.length;

      links.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);

      return placeholder(idx);
    });
    // #endregion Process Markdown URLs first to avoid double-linking URLs that are already linked via Markdown
    // #region Process URLs
    // biome-ignore lint/suspicious/noControlCharactersInRegex: placeholder pattern uses \x00 (safe delimiter).
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
    // #endregion Process URLs
    // #region Process phone numbers
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
      } // Skip European dates like "30.09.2020", "01/12/2025", "15-03-2024"

      if (/^\d+\.\d+$/.test(match.trim())) {
        return match;
      } // decimal / GPS

      const idx = links.length;
      const telHref = `tel:${match.replace(/[^\d+]/g, "")}`;

      links.push(
        `<span class="LLAMA_Chat_PhoneBadge"><span class="LLAMA_Chat_BadgeIcon">\uD83D\uDCDE</span><a href="${telHref}">${match}</a></span>`,
      );

      return placeholder(idx);
    });
    // #endregion Process phone numbers
    // #region Process email addresses
    const withEmails = withPhones.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, (match) => {
      const idx = links.length;

      links.push(
        `<span class="LLAMA_Chat_EmailBadge"><span class="LLAMA_Chat_BadgeIcon">\u2709</span><a href="mailto:${match}">${match}</a></span>`,
      );

      return placeholder(idx);
    });
    // #endregion Process email addresses
    // #region Restore placeholders.
    // biome-ignore lint/suspicious/noControlCharactersInRegex: placeholder pattern uses \x00
    return withEmails.replace(/\x00LINK(\d+)\x00/g, (_m, idx: string) => {
      const html = links[Number(idx)];

      if (html.startsWith('<span class="LLAMA_Chat_Phone') || html.startsWith('<span class="LLAMA_Chat_Email')) {
        return html;
      }

      return `<span class="LLAMA_Chat_SourceBadge">${html}</span>`;
    });
    // #endregion Restore placeholders.
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
  // #region Folded sources section
  /**
   * Appends a collapsible `<details>` section listing the search result sources
   * below the rich-answer overlay. The numbered badges correspond to the `[N]`
   * references in the AI answer.
   *
   * @param field   The answer field (the rich-answer div is its next sibling).
   * @param sources Search results returned by the server alongside the answer. */
  private static appendSourcesSection(
    field: HTMLInputElement | HTMLTextAreaElement,
    sources: { title: string; url: string; description: string }[],
  ): void {
    if (sources.length === 0) {
      return;
    }

    AI_LLAMA_STANDARD_TXTQA.ensureSourcesStyles();

    const richDiv = field.nextElementSibling?.classList.contains("LLAMA_TXTQA_RichAnswer")
      ? field.nextElementSibling
      : null;
    const anchor = richDiv ?? field;

    // Remove a previous sources section for this field, if any
    anchor.parentElement?.querySelector(`.LLAMA_TXTQA_Sources[data-for="${field.id}"]`)?.remove();

    const details = document.createElement("details");

    details.className = "LLAMA_TXTQA_Sources";
    details.setAttribute("data-for", field.id);

    const summary = document.createElement("summary");

    summary.textContent = `Show sources (${sources.length})`;
    details.appendChild(summary);

    const list = document.createElement("div");

    list.className = "LLAMA_TXTQA_SourcesList";

    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      const badge = document.createElement("span");

      badge.className = "LLAMA_Chat_SourceBadge";
      badge.title = src.description;
      badge.innerHTML = `[${i + 1}] <a href="${src.url}" target="_blank" rel="noopener noreferrer">${src.title}</a>`;
      list.appendChild(badge);
    }

    details.appendChild(list);

    if (anchor.nextSibling) {
      anchor.parentElement?.insertBefore(details, anchor.nextSibling);
    } else {
      anchor.parentElement?.appendChild(details);
    }
  }

  private static ensureSourcesStyles(): void {
    if (document.querySelector("#LLAMA_TXTQA_Sources_Styles")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "LLAMA_TXTQA_Sources_Styles";
    style.textContent = `
      .LLAMA_TXTQA_Sources {
        margin-top: 6px ; border: 1px solid #e0e0e0 ; border-radius: 4px ;
        background: #f8f9fa ; font-size: 13px ;}
      .LLAMA_TXTQA_Sources summary {
        cursor: pointer ; padding: 6px 10px ; font-weight: 600 ;
        color: #555 ; user-select: none ;}
      .LLAMA_TXTQA_Sources summary:hover { color: #333 ;}
      .LLAMA_TXTQA_SourcesList {
        display: flex ; flex-wrap: wrap ; gap: 6px ;
        padding: 6px 10px 10px ;}`;

    document.head.appendChild(style);
  }
  // #endregion Folded sources section
}
// #region Register functionality with CodBi
window.codbi.registerFunctionality(
  "AI.LLAMA.STANDARD.TXTQA",
  AI_LLAMA_STANDARD_TXTQA.functionality.bind(AI_LLAMA_STANDARD_TXTQA),
);
// #endregion Register functionality with CodBi
