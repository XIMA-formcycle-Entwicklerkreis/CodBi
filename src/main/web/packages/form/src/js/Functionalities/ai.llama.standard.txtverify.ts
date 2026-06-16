// #region Imports
// #region XIMA
import { getJQuery, getXUtil } from "@de-xima/fc-form-renderer";
import { generateUUID } from "../global-scope";
// #endregion XIMA
// #region Commons
import { acquireWakeLock, releaseWakeLock } from "../commons/wake-lock";
// #endregion Commons
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { IF } from "xdbc/src/DBC/IF";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { OR } from "xdbc/src/DBC/OR";
// #endregion XDBC
import { formatWaitTime } from "../commons/format-wait-time";
// #endregion Imports

/**
 * Provides the {@link AI_LLAMA_STANDARD_TXTVERIFY.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_LLAMA_STANDARD_TXTVERIFY {
  /**
   * The Unique session ID generated on page load — ensures each session gets its own llama-server slot and thus
   * no info from one conversation leaks into another one. */
  private static readonly PAGE_SESSION_ID: string = generateUUID();

  /**
   * This functionality verifies text entered in an {@link HTMLInputElement} of type `"text"` or a
   * {@link HTMLTextAreaElement} by sending the entered value to a local llama-server together with a configurable
   * verification question. The AI is automatically instructed to reply with the {@link PositiveResponse} word when
   * the text is valid, or with a **concise human-readable explanation** of why it is invalid when it is not.
   *
   * **Trigger:** The AI check starts when the user **leaves the field** (blur). The field itself is **never disabled**
   * during inference — the user can always edit the text. Form submission is **blocked** while inference is running.
   *
   * **Abort & Restart:** When the user leaves the field (blur), the current value is compared to the value that was
   * used to start the most recent inference. If the value has **changed**, the running inference is aborted and a fresh
   * one starts with the updated value. If the value is **unchanged**, the running inference is left to complete — the
   * user merely clicked away without editing.
   *
   * **Question:** The verification question is taken from the **data-cb-Question** attribute on the element (preferred)
   * or from the **Question** config parameter. The question may use:
   *  - `<[this]>` — resolves to the current value of the field being verified.
   *  - `<[CSSClass]>` — resolves to the value of the nearest element with that CSS class (scoped to the
   *    ancestor **XContainer**, with document-level fallback).
   *
   *  The functionality automatically appends a reply-format instruction — do **not** add "reply with yes or no"
   *  or similar instructions manually. When `<[this]>` is **not** used, the field value is prepended as
   *  `Text: "…"` so that thinking models can resolve references like *"this text"* before reading the question.
   *
   *  Example: `data-cb-Question="Prüfe ob '<[this]>' eine deutsche Stadt ist."`
   *
   * **Result:**
   *  - If the AI answers with the {@link PositiveResponse} (default: `"yes"`) → the field error is cleared.
   *  - Otherwise → the **AI's own answer** is shown as the field error, so the user sees a specific explanation
   *    (e.g. *"The text does not describe an activity."*). {@link VerifyErrorText} is used as a fallback only when
   *    the AI returns an empty response. A manual-override checkbox ({@link VerifyCheckboxLabel}) is also shown.
   *
   * ### Config Parameters:
   * - **Question**:            Verification question. Supports `<[this]>` and `<[CSSClass]>` placeholders.
   *                            Overridden by the **data-cb-Question** attribute on the element if present.
   *                            Do not include reply-format instructions — they are appended automatically.
   * - **PositiveResponse**:    The single word the AI must reply with to signal validity.
   *                            Comparison is case-insensitive by default. Default: `"yes"`.
   * - **CaseInsensitive**:     If `true` (default), the AI answer is lowercased before comparison.
   *                            Set to `"false"` for exact (case-sensitive) matching.
   * - **VerifyErrorText**:     Fallback error message used only when the AI returns an empty answer.
   *                            Default: `"The entered text does not meet the verification criteria."`
   * - **VerifyCheckboxLabel**: Label for the manual override checkbox shown on failure.
   *                            Default: `"The content is not as expected. You may manually confirm it is correct by clicking the checkbox."`
   * - **InternetAccess**:      If `"true"`, enables Brave Search internet access. Default: `false`.
   * - **Thinking**:            If `"true"`, enables thinking mode. Default: `false`.
   * - **MaxThinkingTokens**:   Token budget for thinking. Defaults to `512` when Thinking is enabled.
   * - **ResponseLanguage**:    Two-letter ISO 639-1 code (e.g. `"de"`) to force the AI response language.
   * - **Specialist**:          Name of a specialist model (`AI_LLAMA_STD_SPECIALIST_XXX` plugin property).
   * - **QueueBadge**:          `"true"` to show a queue-position badge on the label while waiting.
   * - **QueueText**:           Text appended after the queue position in the badge.
   * - **Language**:            Full language name (e.g. `"German"`, `"Deutsch"`) appended as `"Answer in {Language}."` to
   *                            the reply instruction sent to the AI. Affects both the positive-response check and the
   *                            error explanation returned to the user. Works alongside **ResponseLanguage**.
   * - **FilterResults**:       `"true"` to enable PII filtering on Brave Search queries.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE(
      "string",
      "question, positiveresponse, verifyerrortext, verifycheckboxlabel, language, responselanguage, specialist, queuebadge, queuetext",
    )
    @IF.PRE(new TYPE("string"), new REGEX(/^[a-z]{2}$/i), "responselanguage")
    @OR.PRE([new TYPE("string"), new TYPE("boolean")], "internetaccess, thinking, caseinsensitive, filterresults")
    @IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "filterresults")
    @IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "thinking")
    @IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "internetaccess")
    @OR.PRE([new TYPE("number"), new TYPE("string")], "maxthinkingtokens")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(
      [HTMLInputElement, HTMLTextAreaElement],
      undefined,
      'Is it not an <input type="text"/> or <textarea> that is tagged with this functionality?',
    )
    toProcess: Element,
  ): void {
    // #region Validate element type
    const tagName = (toProcess as HTMLElement).tagName.toUpperCase();
    const inputType = (toProcess as HTMLInputElement).type?.toLowerCase();

    if (tagName !== "TEXTAREA" && !(tagName === "INPUT" && inputType === "text")) {
      window.codbi.log(
        "ERROR",
        `ai.llama.standard.txtverify requires an <input type="text"> or <textarea>, got <${tagName.toLowerCase()}${inputType ? ` type="${inputType}"` : ""}>`,
        "AI / LLAMA / TXTVERIFY",
      );

      return;
    }
    // #endregion Validate element type
    // #region Read config
    const caseInsensitive = toLoad.caseinsensitive == null || String(toLoad.caseinsensitive).toLowerCase() !== "false";
    const positiveResponse =
      toLoad.positiveresponse != null
        ? caseInsensitive
          ? String(toLoad.positiveresponse).trim().toLowerCase()
          : String(toLoad.positiveresponse).trim()
        : "yes";
    const verifyErrorText =
      toLoad.verifyerrortext != null
        ? String(toLoad.verifyerrortext)
        : "The entered text does not meet the verification criteria.";
    const verifyCheckboxLabel =
      toLoad.verifycheckboxlabel != null
        ? String(toLoad.verifycheckboxlabel)
        : "The content is not as expected. You may manually confirm it is correct by clicking the checkbox.";
    const responseLang = toLoad.responselanguage != null ? String(toLoad.responselanguage).trim() : "";
    const language = toLoad.language != null ? String(toLoad.language).trim() : "";
    const specialist = toLoad.specialist != null ? String(toLoad.specialist).trim() : "";
    const internetAccess = toLoad.internetaccess != null && String(toLoad.internetaccess).toLowerCase() === "true";
    const $ = getJQuery();
    // #endregion Read config
    // #region Per-field inference state
    let inferenceRunning = false;
    let activeXhr: { abort: () => void } | null = null;
    let queueTicket: string | null = null;
    let fieldLabel: HTMLElement | null = null;
    let labelFormerHtml = "";
    let queueBadgeEl: HTMLSpanElement | null = null;
    /** Value that was sent to the AI for the currently running (or last completed) inference. */
    let lastInferredValue: string | null = null;
    // #endregion Per-field inference state
    // #region Block form submission while this field's inference is running
    getXUtil().on("submit", () => {
      if (inferenceRunning) {
        (toProcess as HTMLElement).focus();
        (toProcess as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });

        return { preventSubmission: true };
      }

      return { preventSubmission: false };
    });
    // #endregion Block form submission while this field's inference is running
    // #region Resolve the verification question
    const resolveQuestion = (): string | null => {
      const container = (toProcess as HTMLElement).closest(".XContainer, .XFieldSet");
      // Prefer data-cb-Question on the element; fall back to the Question config parameter.
      const rawQuestion =
        toProcess.getAttribute("data-cb-Question") ?? (toLoad.question != null ? String(toLoad.question) : null);

      if (!rawQuestion) {
        window.codbi.log(
          "WARNING",
          `ai.llama.standard.txtverify: no question found for element #${toProcess.getAttribute("id")}. Set data-cb-Question on the element or provide Question in config.`,
          "AI / LLAMA / TXTVERIFY",
        );

        return null;
      }

      const currentValue = (toProcess as HTMLInputElement | HTMLTextAreaElement).value;

      const resolved = rawQuestion.replace(/<\[([^\]]+)\]>/g, (match, identifier) => {
        const trimmed = identifier.trim();

        // <[this]> resolves to the field's own current value.
        if (trimmed === "this") {
          return currentValue;
        }

        let el: HTMLElement | null =
          (container?.querySelector(`.${trimmed}`) as HTMLElement | null) ??
          (document.querySelector(`.${trimmed}`) as HTMLElement | null);

        if (el && !("value" in el)) {
          el = el.querySelector("input, textarea, select");
        }

        if (el && "value" in el) {
          return (el as HTMLInputElement).value;
        }

        return match;
      });

      // Append reply-format instruction so the AI knows what to return.
      // If a Language is configured it is appended here so the AI uses it for both
      // the positive-response word check and the error explanation.
      // If the question does not embed the field value via <[this]>, prepend it so the model
      // can resolve "this text" references before reading the question — placing the text
      // after the question confuses thinking models that parse the question first and find
      // no referent for "this text".
      const embedsValue = rawQuestion.includes("<[this]>");
      const questionWithValue = embedsValue ? resolved : `Text: "${currentValue}"\n\n${resolved}`;

      return `${questionWithValue}\n\nIf the text is valid, reply with "${positiveResponse}" only. If it is invalid, reply with at most 3 concise sentences explaining why — do not include any other text.${language ? ` Answer in ${language}.` : ""}`;
    };
    // #endregion Resolve the verification question
    // #region Remove loading indicator from label
    const unanimate = () => {
      if (fieldLabel) {
        fieldLabel.innerHTML = labelFormerHtml;
        fieldLabel = null;
        labelFormerHtml = "";
      }

      queueBadgeEl?.remove();
      queueBadgeEl = null;
      releaseWakeLock();
    };
    // #endregion Remove loading indicator from label
    // #region Abort running inference
    const abortInference = () => {
      if (activeXhr) {
        activeXhr.abort();
        activeXhr = null;
      }

      queueTicket = null;

      if (inferenceRunning) {
        inferenceRunning = false;
        unanimate();
      }
    };
    // #endregion Abort running inference
    // #region Manual verification checkbox helpers
    const clearManualVerify = () => {
      const existing = (toProcess as HTMLElement).parentElement?.parentElement?.querySelectorAll(
        ".LLAMA_AI_ManualVerify",
      );

      if (existing) {
        for (const el of existing) {
          el.remove();
        }
      }
    };

    const addManualVerify = (fieldId: string) => {
      if (!document.querySelector("#LLAMA_AI_ManualVerify_Styles")) {
        const style = document.createElement("style");

        style.id = "LLAMA_AI_ManualVerify_Styles";
        style.textContent = `
          .LLAMA_AI_ManualVerify { display: flex ; align-items: center ; margin-top: 8px ; gap: 8px ;
            flex-wrap: nowrap ;}
          .LLAMA_AI_ManualVerify_Checkbox { cursor: pointer ; opacity: 1 !important ; position: relative !important ;
            flex-shrink: 0 ;}
          .LLAMA_AI_ManualVerify label { margin-bottom: 0 ; position: relative !important ;}`;

        document.head.appendChild(style);
      }

      clearManualVerify();

      const checkboxContainer = document.createElement("div");
      const checkbox = document.createElement("input");
      const label = document.createElement("label");

      checkboxContainer.className = "LLAMA_AI_ManualVerify";
      checkbox.type = "checkbox";
      checkbox.id = `manual-verify-${fieldId}`;
      checkbox.className = "LLAMA_AI_ManualVerify_Checkbox";
      label.htmlFor = checkbox.id;
      label.textContent = verifyCheckboxLabel;

      checkboxContainer.appendChild(checkbox);
      checkboxContainer.appendChild(label);

      (toProcess as HTMLElement).parentElement?.insertAdjacentElement("afterend", checkboxContainer);

      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          $(toProcess).error("");
        } else {
          $(toProcess).error(verifyErrorText);
        }
      });
    };
    // #endregion Manual verification checkbox helpers
    // #region Start a new inference for the current field value
    const startInference = () => {
      const fieldId = toProcess.getAttribute("id");

      if (!fieldId) {
        window.codbi.log(
          "ERROR",
          "ai.llama.standard.txtverify: the element must have an id attribute.",
          "AI / LLAMA / TXTVERIFY",
        );

        return;
      }

      const value = (toProcess as HTMLInputElement | HTMLTextAreaElement).value.trim();

      if (!value) {
        return;
      }

      const question = resolveQuestion();

      if (!question) {
        return;
      }

      lastInferredValue = value;
      inferenceRunning = true;
      acquireWakeLock();
      // #region Build request headers
      const headers: { [key: string]: string } = {};

      headers["X-Session-Id"] = AI_LLAMA_STANDARD_TXTVERIFY.PAGE_SESSION_ID;
      headers["X-Search"] = internetAccess ? "true" : "false";

      if (toLoad.filterresults != null) {
        headers["X-Filter-Results"] = String(toLoad.filterresults).toLowerCase() === "true" ? "true" : "false";
      }

      const thinking = toLoad.thinking != null && String(toLoad.thinking).toLowerCase() === "true";

      headers["X-Thinking"] = thinking ? "true" : "false";

      if (thinking) {
        const customBudget = toLoad.maxthinkingtokens != null ? Number(toLoad.maxthinkingtokens) : 0;

        headers["X-Max-Thinking-Tokens"] = customBudget > 0 ? String(customBudget) : "512";
      }

      if (responseLang) {
        headers["X-Forced-Language"] = responseLang;
      }

      if (specialist) {
        headers["X-Specialist"] = specialist;
      }

      headers[`X-Question-${fieldId}`] = btoa(String.fromCharCode(...new TextEncoder().encode(question)));
      // #endregion Build request headers
      // #region Show "Checking…" indicator on the label (not on the field itself)
      let labelParent = (toProcess as HTMLElement).parentElement;

      while (
        labelParent?.classList.contains("LLAMA_AI_Hint_Wrapper") ||
        labelParent?.classList.contains("MEDIA_Whisper_InputWrapper")
      ) {
        labelParent = labelParent.parentElement;
      }

      fieldLabel = labelParent?.querySelector("label") as HTMLElement | null;

      if (fieldLabel) {
        labelFormerHtml = fieldLabel.innerHTML;

        if (!document.querySelector("#LLAMA_TXTVERIFY_Processing_Styles")) {
          const style = document.createElement("style");

          style.id = "LLAMA_TXTVERIFY_Processing_Styles";
          style.textContent = `
            @keyframes LLAMA_TXTVERIFY_Blink {
              0%   { opacity: 1; }
              50%  { opacity: 0; }
              100% { opacity: 1; }}
            .LLAMA_TXTVERIFY_Processing {
              font-weight: bold ; color: darkorange ;
              animation: LLAMA_TXTVERIFY_Blink 2s ease-in-out infinite ;}`;

          document.head.appendChild(style);
        }

        fieldLabel.innerHTML = `${labelFormerHtml}<span class="LLAMA_TXTVERIFY_Processing"> Checking…</span>`;
      }
      // #endregion Show "Checking…" indicator on the label (not on the field itself)
      // #region Queue badge helpers
      const queueOverride: boolean | null = toLoad.queuebadge != null ? String(toLoad.queuebadge) !== "false" : null;
      const queueText: string = toLoad.queuetext != null ? String(toLoad.queuetext) : "";

      const showQueueBadge = (position: number, estimatedWaitMs?: number | null) => {
        if (!queueBadgeEl) {
          queueBadgeEl = document.createElement("span");
          queueBadgeEl.className = "LLAMA_QueueBadge";
          queueBadgeEl.style.cssText =
            "display:inline-flex;align-items:center;gap:4px;margin-left:6px;padding:2px 8px;border-radius:10px;background:#d0e0ff;color:#1a5aab;font-size:12px;font-weight:600;white-space:nowrap;";
          fieldLabel?.appendChild(queueBadgeEl);
        }

        const waitLabel = formatWaitTime(estimatedWaitMs);

        queueBadgeEl.textContent = `${position}${waitLabel ? ` ${waitLabel}` : ""}${queueText ? ` ${queueText}` : ""}`;
      };

      const hideQueueBadge = () => {
        queueBadgeEl?.remove();
        queueBadgeEl = null;
      };
      // #endregion Queue badge helpers
      // #region AJAX request with queue polling loop
      const sendRequest = () => {
        // Guard: if inference was aborted while this was queued via setTimeout, bail out.
        if (!inferenceRunning) {
          return;
        }

        activeXhr = $.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
          type: "POST",
          data: new FormData(),
          dataType: "json",
          processData: false,
          contentType: false,
          cache: false,
          beforeSend: (xhr) => {
            for (const headerName of Object.keys(headers)) {
              xhr.setRequestHeader(headerName, headers[headerName]);
            }

            if (queueTicket) {
              xhr.setRequestHeader("X-Queue-Ticket", queueTicket);
            }
          },
          success: (response) => {
            // #region Handle queue polling
            if (response.queued) {
              queueTicket = response.queueTicket ?? queueTicket;

              const badgeEnabled = queueOverride != null ? queueOverride : !!response.queueBadge;

              if (badgeEnabled) {
                showQueueBadge(response.position ?? 0, response.estimatedWaitMs);
              }

              setTimeout(sendRequest, 1000);

              return;
            }
            // #endregion Handle queue polling
            hideQueueBadge();
            queueTicket = null;
            activeXhr = null;
            inferenceRunning = false;
            unanimate();

            if (response.error) {
              window.codbi.log("ERROR", `REST failed with: ${response.error}`, "AI / LLAMA / TXTVERIFY");

              return;
            }

            const answer = response[fieldId]?.answer;

            if (answer == null) {
              window.codbi.log("WARNING", `No answer received for field #${fieldId}`, "AI / LLAMA / TXTVERIFY");

              return;
            }

            // #region Evaluate AI answer and show result
            const trimmedAnswer = String(answer).trim();
            const normalised = caseInsensitive ? trimmedAnswer.toLowerCase() : trimmedAnswer;

            if (normalised === positiveResponse) {
              $(toProcess).error("");
              clearManualVerify();
            } else {
              // Use the AI's own answer as the error message so the user gets a specific
              // explanation. Fall back to the static VerifyErrorText only when empty.
              $(toProcess).error(trimmedAnswer || verifyErrorText);
              addManualVerify(fieldId);
            }
            // #endregion Evaluate AI answer and show result
          },
          error: (_xhr, status, error) => {
            // Intentional abort — abortInference() already cleaned up state.
            if (status === "abort") {
              return;
            }

            hideQueueBadge();
            queueTicket = null;
            activeXhr = null;
            inferenceRunning = false;
            unanimate();

            window.codbi.log(
              "ERROR",
              `REST failed with status "${status}" cause: "${error}"`,
              "AI / LLAMA / TXTVERIFY",
            );
          },
        });
      };

      sendRequest();
      // #endregion AJAX request with queue polling loop
    };
    // #endregion Start a new inference for the current field value
    // #region Register blur event listener
    // On blur: if the current value differs from the value used for the running inference,
    // abort and restart with the updated value. If unchanged, let the running inference finish.
    (toProcess as HTMLElement).addEventListener("blur", () => {
      const currentValue = (toProcess as HTMLInputElement | HTMLTextAreaElement).value.trim();

      if (inferenceRunning && currentValue === lastInferredValue) {
        // Value unchanged — the user only clicked away; keep the running inference.
        return;
      }

      // Value changed (or no inference running yet) — abort any stale inference and start fresh.
      abortInference();
      startInference();
    });
    // #endregion Register blur event listener
  }
}
// #region Register functionality with CodBi
window.codbi.registerFunctionality(
  "AI.LLAMA.STANDARD.TXTVERIFY",
  AI_LLAMA_STANDARD_TXTVERIFY.functionality.bind(AI_LLAMA_STANDARD_TXTVERIFY),
);
// #endregion Register functionality with CodBi
