// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
import { generateUUID } from "../global-scope";
// #endregion XIMA
// #region Commons
import { acquireWakeLock, releaseWakeLock } from "../commons/wake-lock";
// #endregion Commons
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { IF } from "xdbc/src/DBC/IF";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { EQ } from "xdbc/src/DBC/EQ";
import { OR } from "xdbc/src/DBC/OR";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
// #endregion XDBC
// #region PDF.js
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
// #endregion PDF.js
import { formatWaitTime } from "../commons/format-wait-time";
// #endregion Imports
/**
 * Provides the {@link AI_LLAMA_STANDARD_QA.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_LLAMA_STANDARD_QA {
  /**
   * The Unique session ID generated on page load — ensures each session gets its own llama-server slot and thus
   * no info from one conversation leaks into another one. */
  private static readonly PAGE_SESSION_ID: string = generateUUID();
  /**
   * This functionality processes uploaded images using a local llama-server process to
   * answer questions about documents. As soon as the file(s) selected changes the AI
   * is contacted via AJAX and the questions are answered. Nothing happens if no file is
   * selected.
   *
   * **PDF Support:** The functionality automatically detects PDF files and processes them accordingly:
   * - If PDF contains mainly text, the text is rendered to an image before sending to AI.
   * - If PDF contains images (scanned documents), those images are extracted and sent to AI.
   * - Multiple files can be selected, mixing PDFs and images
   *
   * **Image Orientation:** The model is sensitive to image rotation. There are two ways
   * to provide orientation of the image to process:
   *
   * 1. **Manual Rotation (Priority):** Add a **data-cb-Rotate** attribute to the input element:
   *    - `data-cb-Rotate="90"`   - Rotate image 90° clockwise
   *    - `data-cb-Rotate="180"`  - Rotate image 180°
   *    - `data-cb-Rotate="270"`  - Rotate image 270° clockwise (90° counter-clockwise)
   *
   * 2. **Automatic Detection (Fallback):** If no data-cb-Rotate attribute is provided AND the
   *    Tesseract OCR engine is active (**OCR** is set in **Active_AI** plugin property), the system will
   *    automatically detect and correct image orientation using Tesseract's OSD (Orientation
   *    and Script Detection).
   *
   * 3. **No Rotation:** If data-cb-Rotate is not provided and **OCR** is not set in **Active_AI** plugin property, images are
   *    processed as-is leading to potential wrong results with images that are rotated unless a sophisticated AI model like LLMs
   *    is used.
   *
   * ### Config Parameters:
   * - **maxPages**:            Optional number limiting how many pages from a PDF are processed and sent to the AI.
   *                            Useful for large PDFs to avoid overwhelming the AI or hitting processing limits.
   *                            If set to 0, all pages are processed. Example: `maxPages: 5` will
   *                            only process the first 5 pages of any PDF. Defaults to **5**.
   * - **Rotation**:            Optional attribute on the input element to specify image rotation (see above), either "90", "180", or "270".
   *                            In a multi-file upload or with a PDF that contains multiple images, this rotation is applied to all files.
   * - **MaxPixelSize**:        Maximum total pixel budget (width×height). Images exceeding this
   *                            are downscaled client-side while preserving the aspect ratio.
   *                            Default: 3211264 (≈ 1792×1792). Set to 0 to disable client-side downscaling.
   * - **AIHint**:              Text shown inside AI-populated fields (right-aligned for inputs, bottom-right
   *                            for textarea) until the user edits the value. Default: "✨ AI-Generated".
   *                            Set to an empty string to disable.
   *
   *                            Note: **According to the EU AI Act, AI-generated content must be clearly labeled. Changing or
   *                            disabling the AIHint may lead to non-compliance in certain jurisdictions.**
   * - **InternetAccess**:      If set to `true`, enables Brave Search internet access for this
   *                            functionality instance. The model may use web search results to improve
   *                            its answers. Default: `false` (no internet search).
   * - **Thinking**:            If set to `true`, enables thinking mode. The AI will use a dedicated
   *                            thinking model (if configured) for deeper reasoning. Default: `false`.
   * - **MaxThinkingTokens**:   Maximum token budget for thinking inference. In verify mode this
   *                            defaults to `512` (enough for yes/no reasoning). Set higher if the
   *                            model needs more room to reason. Has no effect when Thinking is `false`.
   * - **PositiveResponse**:    The expected positive answer from the AI in verify mode.
   *                            The comparison is case-insensitive by default. Default: `"yes"`.
   * - **CaseInsensitive**:     If `true` (default), the AI answer is lowercased before comparing
   *                            with PositiveResponse. Set to `false` for an exact (case-sensitive) match.
   * - **VerifyErrorText**:     Error message shown when the file does not pass verification.
   *                            Default: `"The file does not meet the verification criteria."`
   * - **VerifyCheckboxLabel**: Label for the manual verification checkbox.
   *                            Default: `"The content is not as expected. Please check if you selected the correct file(s).
   *                            You may manually verify that it is the correct one by clicking the checkbox."`
   * - **Mode**:                If set to "verify", the upload field may have a **data-cb-Question** attribute.
   *                            In this case, the question is sent to the AI and the answer must be "yes" (case-insensitive) for the file
   *                            to be accepted. If not, an error and a manual verification checkbox are shown,
   *                            just like in ai.ocr.ts. The question can reference symbols as usual.
   * - **ResponseLanguage**:    Two-letter ISO 639-1 code (e.g. `"de"`, `"fr"`). Forces the AI to
   *                            respond in this language, skipping auto-detection. Overrides the
   *                            `AI_LLAMA_STD_Language` plugin property for this instance.
   * - **Specialist**:          Name of a specialist model registered via `AI_LLAMA_STD_SPECIALIST_XXX`
   *                            plugin property. Routes requests to that specialist's dedicated server
   *                            instance (case-insensitive match).
   * - **QueueBadge**:          If set to `"true"`, shows a badge with the current queue position while
   *                            waiting for inference. Overrides the `AI_QueueBadge` plugin property
   *                            for this instance. Default: determined by plugin property.
   * - **QueueText**:           Text appended after the queue position number in the badge
   *                            (e.g. `"in queue"` → badge shows `"3 in queue"`). Default: empty.
   * - **FilterResults**:       If set to `"true"`, enables PII filtering on Brave Search queries
   *                            for this instance, overriding the global `AI_BraveSearch_FilterResults`
   *                            plugin property. Default: determined by plugin property.
   *
   * Questions are acquired from DOM elements within the nearest ancestor **XContainer** of the
   * {@link HTMLInputElement } **toProcess** that're tagged with the class **AI_LLAMA_STANDARD_QA_Question**.
   * Each such element should have:
   *  - An **id** attribute (used as the question key)
   *  - A **data-cb-Question**  attribute (contains the question text which may include symbols like <[FieldName]>
   *                            that get resolved to the value of the field with CSS-Class "FieldName" in the same container).
   *
   * **Sub-container exclusion:** Nested **XContainer** elements within the search scope can be tagged with the CSS-Class
   * **AI_LLAMA_QA_Exclude** to exclude their contents from the question search. This allows partitioning a form so that each
   * upload field only picks up its own questions. An upload field that resides *inside* an excluded sub-container naturally
   * searches that sub-container (its own nearest XContainer) and is not affected by the exclusion.
   *
   * In verify mode, the upload field itself may have a **data-cb-Question** attribute. This question is sent to the AI and the answer must be "yes" (case-insensitive) for the file to be accepted. Otherwise, an error and a manual verification checkbox are shown.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE(
      "string",
      "aihint, positiveresponse, verifyerrortext, verifycheckboxlabel, mode, responselanguage, specialist, queuebadge, queuetext, disablefrequencypenalty",
    )
    @GREATER.PRE(
      3,
      true,
      false,
      "aihint.length",
      "According to the EU AI Act, AI-generated content must be clearly labeled. Changing or disabling the AIHint may lead to non-compliance in certain jurisdictions.",
    )
    @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "maxpages")
    @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "maxPixelSize")
    @IF.PRE(new TYPE("string"), new REGEX(/^[a-z]{2}$/i), "responselanguage")
    @OR.PRE([new TYPE("string"), new TYPE("boolean")], "internetaccess, thinking, caseinsensitive")
    @OR.PRE([new TYPE("number"), new TYPE("string")], "maxthinkingtokens")
    @OR.PRE([new TYPE("string"), new TYPE("boolean")], "filterresults")
    @IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "filterresults")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(
      HTMLInputElement,
      undefined,
      'Is it not an <input type = "file"/> that is tagged with this functionality?',
    )
    @EQ.PRE("file", false, "type")
    toProcess: Element,
  ): void {
    (toProcess as HTMLInputElement).addEventListener("change", async (event) => {
      // #region Check if early exit is appropriate (no files selected)
      const files = (toProcess as HTMLInputElement).files;

      if (!files || files.length === 0) {
        return;
      }
      // #endregion Check if early exit is appropriate (no files selected)
      // #region Initialize mode, files, and config from toLoad
      const mode = (toLoad.mode || "").toString().toLowerCase();
      const $ = getJQuery();
      const formData = new FormData();
      const maxPages = toLoad.maxpages ? Number(toLoad.maxpages) : 5;
      const maxPixelSize =
        toLoad.maxpixelsize != null ? Number(toLoad.maxpixelsize) : AI_LLAMA_STANDARD_QA.DEFAULT_MAX_PIXELS;
      const aiHintText = toLoad.aihint != null ? `\u2728 ${String(toLoad.aihint)}` : "\u2728 AI-Generated";
      const caseInsensitive =
        toLoad.caseinsensitive == null || String(toLoad.caseinsensitive).toLowerCase() !== "false";
      const positiveResponse =
        toLoad.positiveresponse != null
          ? caseInsensitive
            ? String(toLoad.positiveresponse).trim().toLowerCase()
            : String(toLoad.positiveresponse).trim()
          : "yes";
      const verifyErrorText =
        toLoad.verifyerrortext != null
          ? String(toLoad.verifyerrortext)
          : "The file does not meet the verification criteria.";
      const verifyCheckboxLabel =
        toLoad.verifycheckboxlabel != null
          ? String(toLoad.verifycheckboxlabel)
          : "The content is not as expected. Please check if you selected the correct file(s). You may manually verify that it is the correct one by clicking the checkbox.";

      AI_LLAMA_STANDARD_QA.ensurePdfJsWorkerConfigured();
      // #endregion Initialize mode, files, and config from toLoad
      // #region Process files (PDF or Image)
      for (const file of Array.from(files)) {
        if (file.type === "application/pdf") {
          const processedImages = await AI_LLAMA_STANDARD_QA.processPdfFile(file, maxPages);

          for (let i = 0; i < processedImages.length; i++) {
            const imageName = `${file.name.replace(".pdf", "")}_page_${i + 1}.png`;
            let imageFile = new File([processedImages[i]], imageName, { type: "image/png" });
            // #region Downscale PDF page if it exceeds the pixel budget
            if (maxPixelSize > 0) {
              const downscaled = await AI_LLAMA_STANDARD_QA.downscaleImageIfNeeded(imageFile, maxPixelSize);

              imageFile =
                downscaled instanceof File
                  ? downscaled
                  : new File([downscaled], imageName, { type: downscaled.type || "image/png" });
            }
            // #endregion Downscale PDF page if it exceeds the pixel budget
            const dataUrl = await AI_LLAMA_STANDARD_QA.blobToDataUrl(imageFile);

            formData.append(`codbi-base64:${imageName}`, dataUrl);
          }
        } else if (maxPixelSize > 0) {
          const downscaled = await AI_LLAMA_STANDARD_QA.downscaleImageIfNeeded(file, maxPixelSize);
          const dataUrl = await AI_LLAMA_STANDARD_QA.blobToDataUrl(downscaled);

          window.codbi.log(
            "INFO",
            `Appending downscaled '${file.name}' as base64 param: ${Math.round(dataUrl.length / 1024)} KB`,
            "AI / LLAMA / STD / QA",
          );

          formData.append(`codbi-base64:${file.name}`, dataUrl);
        } else {
          const dataUrl = await AI_LLAMA_STANDARD_QA.blobToDataUrl(file);

          window.codbi.log(
            "INFO",
            `Appending original '${file.name}' as base64 param: ${Math.round(dataUrl.length / 1024)} KB`,
            "AI / LLAMA / STD / QA",
          );
          formData.append(`codbi-base64:${file.name}`, dataUrl);
        }
      }
      // #endregion Process files (PDF or Image)
      // #region Build request headers
      const headers: { [key: string]: string } = {};

      headers["X-Session-Id"] = AI_LLAMA_STANDARD_QA.PAGE_SESSION_ID;
      // #endregion Build request headers
      // #region Determine user-set rotation
      if (toLoad.rotation && toLoad.rotation !== "0" && toLoad.rotation !== 0) {
        headers["X-Rotate"] = toLoad.rotation.toString();

        window.codbi.log(
          "INFO",
          `Setting user provided image rotation to ${toLoad.rotation}° via X-Rotate header`,
          "AI / LLAMA / STD / QA",
        );
      }
      // #endregion Determine user-set rotation
      // #region Determine the search container
      const container = (toProcess as HTMLElement).closest(".XContainer");

      // #endregion Determine the search container
      // #region Acquire Questions
      const allQuestionElements = container.querySelectorAll(".AI_LLAMA_STANDARD_QA_Question");
      const questionElements: Element[] = [];

      for (const candidate of allQuestionElements) {
        const innerContainer = candidate.closest(".XContainer");
        // #region Omit questions that're in an excluded sub-container.
        if (
          innerContainer &&
          innerContainer !== container &&
          innerContainer.classList.contains("AI_LLAMA_QA_Exclude")
        ) {
          continue;
        }
        // #endregion Omit questions that're in an excluded sub-container.
        questionElements.push(candidate);
      }

      const vqaHeaders: { [key: string]: string } = {};

      vqaHeaders["X-Session-Id"] = AI_LLAMA_STANDARD_QA.PAGE_SESSION_ID;
      // #region Forced response language
      const responseLang = toLoad.responselanguage != null ? String(toLoad.responselanguage).trim() : "";
      const specialist = toLoad.specialist != null ? String(toLoad.specialist).trim() : "";

      if (responseLang) {
        vqaHeaders["X-Forced-Language"] = responseLang;
      }
      if (specialist) {
        vqaHeaders["X-Specialist"] = specialist;
      }
      if (toLoad.disablefrequencypenalty != null && String(toLoad.disablefrequencypenalty).toLowerCase() === "true") {
        vqaHeaders["X-Disable-Frequency-Penalty"] = "true";
      }
      // #region Brave Search and geolocation toggles
      const internetAccess = toLoad.InternetAccess != null && String(toLoad.InternetAccess).toLowerCase() === "true";

      vqaHeaders["X-Search"] = internetAccess ? "true" : "false";

      if (toLoad.filterresults != null) {
        vqaHeaders["X-Filter-Results"] = String(toLoad.filterresults).toLowerCase() === "true" ? "true" : "false";
      }
      // #endregion Brave Search and geolocation toggles
      // #region Thinking mode toggle
      const thinking = toLoad.thinking != null && String(toLoad.thinking).toLowerCase() === "true";

      vqaHeaders["X-Thinking"] = thinking ? "true" : "false";

      if (thinking) {
        const customBudget = toLoad.maxthinkingtokens != null ? Number(toLoad.maxthinkingtokens) : 0;

        if (customBudget > 0) {
          vqaHeaders["X-Max-Thinking-Tokens"] = String(customBudget);
        } else if (mode === "verify") {
          vqaHeaders["X-Max-Thinking-Tokens"] = "512";
        }
      }
      // #endregion Thinking mode toggle
      // #region Determine location, if requested, and add to headers
      if (toLoad.location != null && String(toLoad.location).toLowerCase() === "true") {
        vqaHeaders["X-Location"] = "true";

        if (navigator.geolocation) {
          try {
            // #region Acquire position
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 300_000,
              });
            });
            // #endregion Acquire position
            vqaHeaders["X-Latitude"] = pos.coords.latitude.toFixed(4);
            vqaHeaders["X-Longitude"] = pos.coords.longitude.toFixed(4);

            window.codbi.log(
              "INFO",
              `Geolocation: ${vqaHeaders["X-Latitude"]}, ${vqaHeaders["X-Longitude"]}`,
              "AI / LLAMA / STD / QA",
            );
          } catch (geoErr) {
            window.codbi.log("WARNING", `Geolocation unavailable: ${geoErr}`, "AI / LLAMA / STD / QA");
          }
        }
      }
      // #endregion Determine location, if requested, and add to headers
      // #endregion Brave Search and geolocation toggles
      // #region Resolve verify-mode question or collect question headers
      let verifyFieldId: string | null = null;
      let verifyFieldQuestion: string | null = null;
      // #region Verification-Mode. If mode is verify and the upload field has a data-cb-Question, use only that question.
      if (mode === "verify") {
        verifyFieldId = toProcess.getAttribute("id");
        verifyFieldQuestion = toProcess.getAttribute("data-cb-Question");

        if (verifyFieldId && verifyFieldQuestion) {
          // #region Resolve symbols in the verify question
          verifyFieldQuestion = verifyFieldQuestion.replace(/<\[([^\]]+)\]>/g, (match, identifier) => {
            const trimmed = identifier.trim();
            let el: HTMLElement | null =
              container.querySelector(`.${trimmed}`) ?? document.querySelector(`.${trimmed}`);
            if (el && !("value" in el)) {
              el = el.querySelector("input, textarea, select");
            }
            if (el && "value" in el) {
              return (el as HTMLInputElement).value;
            }
            return match;
          });
          // #endregion Resolve symbols in the verify question
          vqaHeaders[`X-Question-${verifyFieldId}`] = btoa(
            String.fromCharCode(...new TextEncoder().encode(verifyFieldQuestion)),
          );
        }
      }
      // #endregion Verification-Mode. If mode is verify and the upload field has a data-cb-Question, use only that question.
      // #region Collect question headers since not in verify-mode or verify question is incomplete.
      if (!(mode === "verify" && verifyFieldId && verifyFieldQuestion)) {
        for (const element of questionElements) {
          const id = element.id;
          let question = element.getAttribute("data-cb-Question");

          if (id && question) {
            // #region Resolve symbols in the verify question
            question = question.replace(/<\[([^\]]+)\]>/g, (match, identifier) => {
              const trimmed = identifier.trim();
              let el: HTMLElement | null =
                container.querySelector(`.${trimmed}`) ?? document.querySelector(`.${trimmed}`);

              if (el && !("value" in el)) {
                el = el.querySelector("input, textarea, select");
              }

              if (el && "value" in el) {
                return (el as HTMLInputElement).value;
              }

              return match;
            });
            // #endregion Resolve symbols in the verify question
            vqaHeaders[`X-Question-${id}`] = btoa(String.fromCharCode(...new TextEncoder().encode(question)));
          } else {
            if (!id) {
              window.codbi.log(
                "WARNING",
                `Question element omitted cause of missing id attribute in: ${element.outerHTML}`,
                "AI / LLAMA / STD / QA",
              );
            }
            if (!question) {
              window.codbi.log(
                "WARNING",
                `Question element omitted cause of missing data-cb-Question attribute in: ${element.outerHTML}`,
                "AI / LLAMA / STD / QA",
              );
            }
          }
        }
      }
      // #endregion Collect question headers since not in verify-mode or verify question is incomplete.
      // #endregion Resolve verify-mode question or collect question headers
      // #endregion Acquire Questions
      // #region If any VQA questions, call VQA action as before
      if (Object.keys(vqaHeaders).length > 0) {
        // #region Disable input and show loading animation
        const tsToProcess = toProcess as HTMLElement;

        tsToProcess.style.pointerEvents = "none";
        tsToProcess.style.opacity = "0.5";

        window.codbi.injectLoadingAnim(toProcess);

        const uploadLabel = tsToProcess.parentElement?.querySelector("label") as HTMLElement | null;
        const uploadFormerText = uploadLabel ? uploadLabel.innerHTML : "";

        if (uploadLabel) {
          uploadLabel.innerHTML = `${uploadFormerText}
            <style>
              @keyframes highlight {
                0%    { opacity:1; }
                50%   { opacity:0; }
                100%  { opacity:1; }}
                    
              .LLAMA_Processing { font-weight: bold ; color: darkorange ; animation: highlight 2s ease-in-out infinite ;}</style>

            <span class = "LLAMA_Processing">Processing...</span>`;
        }

        const questionLabelData: Map<HTMLElement, string> = new Map();
        // #region In verify mode, only the upload field's own question is sent so no animation.
        if (!(mode === "verify" && verifyFieldId && verifyFieldQuestion)) {
          for (const element of questionElements) {
            let labelParent = element.parentElement;

            // attachAiHint / Whisper wrap the field — skip wrapper(s) to reach the real container with the label.
            while (
              labelParent?.classList.contains("LLAMA_AI_Hint_Wrapper") ||
              labelParent?.classList.contains("MEDIA_Whisper_InputWrapper")
            ) {
              labelParent = labelParent.parentElement;
            }

            const questionLabel = labelParent?.querySelector("label") as HTMLElement | null;

            if (questionLabel) {
              const originalText = questionLabel.innerHTML;
              questionLabelData.set(questionLabel, originalText);
              questionLabel.innerHTML = `${originalText}
                <span class = "LLAMA_Processing">Processing...</span>`;
            }
          }
        }
        // #endregion In verify mode, only the upload field's own question is sent so no animation.
        // #region Disable answer fields during inference.
        const disabledFields: HTMLInputElement[] = [];

        if (!(mode === "verify" && verifyFieldId && verifyFieldQuestion)) {
          for (const element of questionElements) {
            const field = document.querySelector(`#${element.id}`) as HTMLInputElement | null;

            if (field) {
              field.disabled = true;
              field.style.opacity = "0.5";

              disabledFields.push(field);
            }
          }
        }
        // #endregion Disable answer fields during inference.
        // #endregion Disable input and show loading animation
        // #region Define how to remove the loading animation and restore labels
        const unanimate = () => {
          window.codbi.removeLoaderAnim(toProcess);

          tsToProcess.style.pointerEvents = "all";
          tsToProcess.style.opacity = "1";
          releaseWakeLock();

          if (uploadLabel) {
            uploadLabel.innerHTML = uploadFormerText;
          }
          // Restore all question labels
          for (const [label, originalText] of questionLabelData.entries()) {
            label.innerHTML = originalText;
          }
          // Re-enable answer fields
          for (const field of disabledFields) {
            field.disabled = false;
            field.style.opacity = "1";
          }
        };
        // #endregion Define how to remove the loading animation and restore labels
        // #region Contact LLAMA-Server via AJAX
        // #region Queue badge configuration.
        const qaQueueOverride: boolean | null =
          toLoad.queuebadge != null ? String(toLoad.queuebadge) !== "false" : null;
        const qaQueueText: string = toLoad.queuetext != null ? String(toLoad.queuetext) : "";
        let qaQueueBadgeEl: HTMLSpanElement | null = null;

        const showQaQueueBadge = (position: number, estimatedWaitMs?: number | null) => {
          if (!qaQueueBadgeEl) {
            qaQueueBadgeEl = document.createElement("span");
            qaQueueBadgeEl.className = "LLAMA_QueueBadge";
            qaQueueBadgeEl.style.cssText =
              "display:inline-flex;align-items:center;gap:4px;margin-left:6px;padding:2px 8px;border-radius:10px;background:#d0e0ff;color:#1a5aab;font-size:12px;font-weight:600;white-space:nowrap;";
            uploadLabel?.appendChild(qaQueueBadgeEl);
          }
          const waitLabel = formatWaitTime(estimatedWaitMs);
          qaQueueBadgeEl.textContent = `${position}${waitLabel ? ` ${waitLabel}` : ""}${qaQueueText ? ` ${qaQueueText}` : ""}`;
        };

        const hideQaQueueBadge = () => {
          qaQueueBadgeEl?.remove();
          qaQueueBadgeEl = null;
        };
        // #endregion Queue badge configuration.
        let qaQueueTicket: string | null = null;

        const sendQaRequest = () => {
          $.ajax({
            url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
            type: "POST",
            data: formData,
            dataType: "json",
            processData: false,
            contentType: false,
            cache: false,
            beforeSend: (xhr) => {
              for (const headerName of Object.keys(vqaHeaders)) {
                xhr.setRequestHeader(headerName, vqaHeaders[headerName]);
              }
              if (qaQueueTicket) {
                xhr.setRequestHeader("X-Queue-Ticket", qaQueueTicket);
              }
            },
            success: (response) => {
              if (response.queued) {
                qaQueueTicket = response.queueTicket ?? qaQueueTicket;
                const badgeEnabled = qaQueueOverride != null ? qaQueueOverride : !!response.queueBadge;
                if (badgeEnabled) {
                  showQaQueueBadge(response.position ?? 0, response.estimatedWaitMs);
                }
                setTimeout(sendQaRequest, 1000);
                return;
              }
              hideQaQueueBadge();
              unanimate();
              // #region Display error if request failed.
              if (response.error) {
                window.codbi.log("ERROR", `REST failed with: ${response.error}`, "AI / LLAMA / QA");

                return;
              }
              // #endregion Display error if request failed.
              if (mode === "verify" && verifyFieldId && verifyFieldQuestion) {
                // #region Verify mode — check AI answer and show error or accept
                // #region Contract checking.
                const answer = TYPE.tsCheck<string>(response[verifyFieldId].answer, "string");
                const field = INSTANCE.tsCheck<HTMLInputElement>(
                  DEFINED.tsCheck(document.querySelector(`#${verifyFieldId}`)),
                  HTMLInputElement,
                  "Is it not an <input> that is tagged with this functionality?",
                );

                if (field.getAttribute("type") !== "file") {
                  window.codbi.log(
                    "ERROR",
                    `Verification field #${verifyFieldId} is not an <input type="file">`,
                    "AI / LLAMA / STD / QA",
                  );

                  return;
                }
                // #endregion Contract checking.
                if ((caseInsensitive ? answer.trim().toLowerCase() : answer.trim()) === positiveResponse) {
                  // #region Remove any error/checkbox if present.
                  $(toProcess).error("");

                  const existingManualVerify =
                    toProcess.parentElement?.parentElement?.querySelectorAll(".LLAMA_AI_ManualVerify");

                  if (existingManualVerify) {
                    for (let i = 0; i < existingManualVerify.length; i++) {
                      existingManualVerify[i].remove();
                    }
                  }
                  // #endregion Remove any error/checkbox if present.
                } else {
                  $(toProcess).error(verifyErrorText);
                  // #region Add styles for manual verification checkbox
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
                  // #endregion Add styles for manual verification checkbox
                  // Remove existing
                  const existingManualVerify =
                    toProcess.parentElement?.parentElement?.querySelectorAll(".LLAMA_AI_ManualVerify");

                  if (existingManualVerify) {
                    for (let i = 0; i < existingManualVerify.length; i++) {
                      existingManualVerify[i].remove();
                    }
                  }
                  // Add checkbox
                  const checkboxContainer = document.createElement("div");
                  const checkbox = document.createElement("input");
                  const label = document.createElement("label");

                  checkboxContainer.className = "LLAMA_AI_ManualVerify";
                  checkbox.type = "checkbox";
                  checkbox.id = `manual-verify-${toProcess.id}`;
                  checkbox.className = "LLAMA_AI_ManualVerify_Checkbox";
                  label.htmlFor = checkbox.id;
                  label.textContent = verifyCheckboxLabel;

                  checkboxContainer.appendChild(checkbox);
                  checkboxContainer.appendChild(label);
                  toProcess.parentElement?.insertAdjacentElement("afterend", checkboxContainer);
                  checkbox.addEventListener("change", () => {
                    if (checkbox.checked) {
                      $(toProcess).error("");
                    } else {
                      $(toProcess).error(verifyErrorText);
                    }
                  });
                }
                // #endregion Verify mode — check AI answer and show error or accept
              } else {
                // #region Normal mode — populate answer fields
                for (const questionId in response) {
                  const answerText = response[questionId]?.answer;

                  if (answerText == null) {
                    continue;
                  }

                  const field = INSTANCE.tsCheck<HTMLInputElement>(
                    document.querySelector(`#${questionId}`),
                    HTMLInputElement,
                  );

                  field.value = answerText;

                  if (aiHintText) {
                    AI_LLAMA_STANDARD_QA.attachAiHint(field, aiHintText);
                  }
                  // Dispatch change event after setting value
                  const event = new Event("change", { bubbles: true });

                  field.dispatchEvent(event);
                }
                // #endregion Normal mode — populate answer fields
              }
            },
            error: (xhr, status, error) => {
              hideQaQueueBadge();
              unanimate();
              window.codbi.log(
                "ERROR",
                `REST failed with status "${status}" cause: "${error}"`,
                "AI / LLAMA / STD / QA",
              );
            },
          });
        };
        sendQaRequest();
        acquireWakeLock();
        // #endregion Contact LLAMA-Server via AJAX
      }
      // #endregion If any VQA questions, call VQA action as before
    });
  }
  // #region PDF.js worker configuration
  /** Ensures PDF.js worker is configured with the correct URL. */
  private static pdfJsWorkerConfigured = false;
  /**
   * Ensures the PDF.js worker URL is configured once before any PDF operations.
   *
   * @remarks
   * Sets {@link pdfjsLib.GlobalWorkerOptions.workerSrc} to the Resource plugin URL
   * and guards against repeated initialization via {@link AI_LLAMA_STANDARD_QA.pdfJsWorkerConfigured}. */
  private static ensurePdfJsWorkerConfigured(): void {
    if (AI_LLAMA_STANDARD_QA.pdfJsWorkerConfigured) {
      return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.codbi.baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.worker.min.js`;

    AI_LLAMA_STANDARD_QA.pdfJsWorkerConfigured = true;

    window.codbi.log(
      "INFO",
      `PDF.js worker configured: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`,
      "AI / LLAMA / STD / QA",
    );
  }
  // #endregion PDF.js worker configuration
  // #region AI-Generated hint
  /** Injects global styles for the AI-Generated badge (once). */
  private static ensureAiHintStyles(): void {
    if (document.querySelector("#LLAMA_AI_Hint_Styles")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "LLAMA_AI_Hint_Styles";
    style.textContent = `
      .LLAMA_AI_Hint_Wrapper { position: relative ; display: inline-block ; width: 100% ;}
      .LLAMA_AI_Hint { position: absolute ; pointer-events: none ; color: rgba(0,0,0,0.38) ;
        font-size: 11px ; line-height: 1 ; white-space: nowrap ; user-select: none ;}
      input  + .LLAMA_AI_Hint { right: 8px ; top: 50% ; transform: translateY(-50%) ;}
      textarea + .LLAMA_AI_Hint { right: 8px ; bottom: 6px ;}`;

    document.head.appendChild(style);
  }
  /**
   * Attaches an AI-Generated badge to a field. The badge is removed as soon as the
   * user changes the field value (keyboard input). Repeat calls on the same field
   * replace the previous badge.
   *
   * @param field    The input or textarea element.
   * @param hintText The label to display, e.g. "✨ AI-Generated". */
  private static attachAiHint(field: HTMLInputElement | HTMLTextAreaElement, hintText: string): void {
    AI_LLAMA_STANDARD_QA.ensureAiHintStyles();
    // #region Remove any existing hint on this field
    const existingHint = field.parentElement?.querySelector(".LLAMA_AI_Hint");

    if (existingHint) {
      existingHint.remove();
    }
    // #endregion Remove any existing hint on this field
    // #region Wrap the field in a relative container if not already wrapped
    let wrapper = field.parentElement;

    if (!wrapper?.classList.contains("LLAMA_AI_Hint_Wrapper")) {
      wrapper = document.createElement("span");
      wrapper.className = "LLAMA_AI_Hint_Wrapper";

      field.parentElement?.insertBefore(wrapper, field);
      wrapper.appendChild(field);
    }
    // #endregion Wrap the field in a relative container if not already wrapped
    const badge = document.createElement("span");

    badge.className = "LLAMA_AI_Hint";
    badge.textContent = hintText;

    wrapper.appendChild(badge);

    // #region Remove hint on first user input
    const removeHint = () => {
      badge.remove();
      field.removeEventListener("input", removeHint);
    };

    field.addEventListener("input", removeHint);
    // #endregion Remove hint on first user input
  }
  // #endregion AI-Generated hint
  // #region Image downscaling helper
  /** Default total-pixel budget (width × height). Matches the backend's default maxPixels (≈ 1792 × 1792). */
  private static readonly DEFAULT_MAX_PIXELS = 3211264;
  /**
   * Converts a {@link Blob} (or {@link File}) to a base64 data-URL string,
   * bypassing formcycle's multipart file parser which returns 0-byte {@code FileData}.
   *
   * @param blob The Blob or File to convert.
   *
   * @returns A promise that resolves to a base64 data-URL string. */
  private static blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;

      reader.readAsDataURL(blob);
    });
  }
  /**
   * Converts a canvas to a {@link File} built from raw bytes.
   *
   * @param toConvert The canvas element to convert.
   * @param fileName  The name of the resulting file.
   *
   * @returns A File object representing the canvas image. */
  private static canvasToFile(toConvert: HTMLCanvasElement, fileName: string): File {
    const dataUrl = toConvert.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new File([bytes.buffer], fileName, { type: "image/png" });
  }
  /**
   * Downscales an image file if its total pixel count (width × height) exceeds
   * {@link maxPixels}, preserving the aspect ratio. Returns the original file
   * unchanged when it is already within the budget.
   *
   * @param file      The image file to check.
   * @param maxPixels Total-pixel budget (width × height).
   *
   * @return  A promise that resolves to a Blob. This will be the original file if no downscaling was needed or if an error
   *          occurred during processing. Otherwise, it will be a new Blob representing the downscaled image.
   */
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
          `Downscaling ${file.name}: ${img.width}×${img.height} → ${newW}×${newH}`,
          "AI / LLAMA / QA",
        );

        const canvas = document.createElement("canvas");

        canvas.width = newW;
        canvas.height = newH;

        const ctx = canvas.getContext("2d");
        // #region Fallback to send original if canvas context cannot be created for some reason.
        if (!ctx) {
          URL.revokeObjectURL(img.src);
          resolve(file);

          return;
        }
        // #endregion Fallback to send original if canvas context cannot be created for some reason.
        ctx.drawImage(img, 0, 0, newW, newH);
        URL.revokeObjectURL(img.src);
        resolve(AI_LLAMA_STANDARD_QA.canvasToFile(canvas, file.name));
      };
      // #region Fallback to send original if image cannot be decoded for some reason.
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(file); // cannot decode → send original
      };
      // #endregion Fallback to send original if image cannot be decoded for some reason.
      img.src = URL.createObjectURL(file);
    });
  }
  // #endregion Image downscaling helper
  // #region PDF processing — split pages into images or render text pages
  /**
   * Processes a PDF file and returns image blobs for each page or extracted image.
   * Detects whether the PDF contains mainly text or images and processes accordingly.
   *
   * @param file The PDF file to process.
   * @param maxPages Maximum number of pages to process (0 = no limit).
   *
   * @returns Array of Blob objects representing images. */
  private static async processPdfFile(file: File, maxPages = 0): Promise<Blob[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf: PDFDocumentProxy = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: Blob[] = [];
    const pagesToProcess = maxPages > 0 ? Math.min(maxPages, pdf.numPages) : pdf.numPages;

    window.codbi.log(
      "INFO",
      `Processing PDF with ${pdf.numPages} page(s), limiting to ${pagesToProcess} page(s): ${file.name}`,
      "AI / LLAMA / QA",
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
          `PDF page ${pageNum} contains ${textLength} characters of text - rendering to image`,
          "AI / LLAMA / STD / QA",
        );

        const blob = await AI_LLAMA_STANDARD_QA.renderPdfPageToImage(page);

        images.push(blob);
      } else {
        window.codbi.log(
          "INFO",
          `PDF page ${pageNum} has minimal text (${textLength} chars) - attempting image extraction`,
          "AI / LLAMA / STD / QA",
        );

        const extractedImages = await AI_LLAMA_STANDARD_QA.extractImagesFromPdfPage(page);

        if (extractedImages.length > 0) {
          images.push(...extractedImages);

          window.codbi.log(
            "INFO",
            `Extracted ${extractedImages.length} image(s) from PDF page ${pageNum}`,
            "AI / LLAMA / STD / QA",
          );
        } else {
          window.codbi.log(
            "INFO",
            `No extractable images found on page ${pageNum} - rendering page to image`,
            "AI / LLAMA / STD / QA",
          );

          const blob = await AI_LLAMA_STANDARD_QA.renderPdfPageToImage(page);

          images.push(blob);
        }
      }
    }

    return images;
  }
  // #endregion PDF processing — split pages into images or render text pages
  // #region Render a single PDF page to a PNG image
  /**
   * Renders a PDF page (including text) to a canvas and returns it as an image blob.
   *
   * @param page The PDF page to render.
   *
   * @returns Blob containing the rendered page as PNG. */
  private static async renderPdfPageToImage(page: PDFPageProxy): Promise<Blob> {
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality.
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Failed to get canvas 2D context");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport: viewport }).promise;

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      }, "image/png");
    });
  }
  // #endregion Render a single PDF page to a PNG image
  // #region Extract embedded images from a PDF page
  /**
   * Extracts embedded images from a PDF page.
   *
   * @param page The PDF page to extract images from.
   *
   * @returns Array of Blob objects representing extracted images. */
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

                  const blob = await new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob((b) => {
                      if (b) {
                        resolve(b);
                      } else {
                        reject(new Error("Failed to create blob from image"));
                      }
                    }, "image/png");
                  });

                  images.push(blob);
                }
              }
            }
          } catch (imgError) {
            window.codbi.log("WARNING", `Failed to extract individual image: ${imgError}`, "AI / LLAMA / STD / QA");
          }
        }
      }
    } catch (error) {
      window.codbi.log("WARNING", `Image extraction failed: ${error}`, "AI / LLAMA / STD / QA");
    }

    return images;
  }
  // #endregion Extract embedded images from a PDF page
}
// #region Register functionality with CodBi
window.codbi.registerFunctionality(
  "AI.LLAMA.STANDARD.QA",
  AI_LLAMA_STANDARD_QA.functionality.bind(AI_LLAMA_STANDARD_QA),
); // Initialization
// #endregion Register functionality with CodBi
