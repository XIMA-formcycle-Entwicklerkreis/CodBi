import { GREATER } from "./chunk-S6DBGVOR.js";
import { OR } from "./chunk-YYG42PYR.js";
import { require_pdf } from "./chunk-SK52DCW2.js";
import { formatWaitTime } from "./chunk-IEBHCVNB.js";
import { generateUUID } from "./chunk-NKLWL4ZS.js";
import { DEFINED } from "./chunk-JP4GUAZX.js";
import { EQ } from "./chunk-RI3LWO6O.js";
import { IF } from "./chunk-2VQP2CFN.js";
import { REGEX } from "./chunk-F3IDEOQS.js";
import { TYPE } from "./chunk-O5T7YW22.js";
import { INSTANCE } from "./chunk-53TEMTGA.js";
import { DBC } from "./chunk-LFRFVRJV.js";
import { require_dist } from "./chunk-ZTMSSRTV.js";
import { __decorateClass, __decorateParam, __toESM } from "./chunk-AOJQKO6T.js";

// src/js/Functionalities/ai.llama.standard.qa.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var pdfjsLib = __toESM(require_pdf(), 1);
var _AI_LLAMA_STANDARD_QA = class _AI_LLAMA_STANDARD_QA {
  static {
    /**
     * The Unique session ID generated on page load — ensures each session gets its own llama-server slot and thus
     * no info from one conversation leaks into another one. */
    this.PAGE_SESSION_ID = generateUUID();
  }
  static functionality(toLoad, toProcess) {
    toProcess.addEventListener("change", async (event) => {
      const files = toProcess.files;
      if (!files || files.length === 0) {
        return;
      }
      const mode = (toLoad.mode || "").toString().toLowerCase();
      const $ = (0, import_fc_form_renderer.getJQuery)();
      const formData = new FormData();
      const maxPages = toLoad.maxpages ? Number(toLoad.maxpages) : 5;
      const maxPixelSize =
        toLoad.maxpixelsize != null ? Number(toLoad.maxpixelsize) : _AI_LLAMA_STANDARD_QA.DEFAULT_MAX_PIXELS;
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
      _AI_LLAMA_STANDARD_QA.ensurePdfJsWorkerConfigured();
      for (const file of Array.from(files)) {
        if (file.type === "application/pdf") {
          const processedImages = await _AI_LLAMA_STANDARD_QA.processPdfFile(file, maxPages);
          for (let i = 0; i < processedImages.length; i++) {
            const imageName = `${file.name.replace(".pdf", "")}_page_${i + 1}.png`;
            let imageFile = new File([processedImages[i]], imageName, { type: "image/png" });
            if (maxPixelSize > 0) {
              const downscaled = await _AI_LLAMA_STANDARD_QA.downscaleImageIfNeeded(imageFile, maxPixelSize);
              imageFile =
                downscaled instanceof File
                  ? downscaled
                  : new File([downscaled], imageName, { type: downscaled.type || "image/png" });
            }
            const dataUrl = await _AI_LLAMA_STANDARD_QA.blobToDataUrl(imageFile);
            formData.append(`codbi-base64:${imageName}`, dataUrl);
          }
        } else if (maxPixelSize > 0) {
          const downscaled = await _AI_LLAMA_STANDARD_QA.downscaleImageIfNeeded(file, maxPixelSize);
          const dataUrl = await _AI_LLAMA_STANDARD_QA.blobToDataUrl(downscaled);
          window.codbi.log(
            "INFO",
            `Appending downscaled '${file.name}' as base64 param: ${Math.round(dataUrl.length / 1024)} KB`,
            "AI / LLAMA / STD / QA",
          );
          formData.append(`codbi-base64:${file.name}`, dataUrl);
        } else {
          const dataUrl = await _AI_LLAMA_STANDARD_QA.blobToDataUrl(file);
          window.codbi.log(
            "INFO",
            `Appending original '${file.name}' as base64 param: ${Math.round(dataUrl.length / 1024)} KB`,
            "AI / LLAMA / STD / QA",
          );
          formData.append(`codbi-base64:${file.name}`, dataUrl);
        }
      }
      const headers = {};
      headers["X-Session-Id"] = _AI_LLAMA_STANDARD_QA.PAGE_SESSION_ID;
      if (toLoad.rotation && toLoad.rotation !== "0" && toLoad.rotation !== 0) {
        headers["X-Rotate"] = toLoad.rotation.toString();
        window.codbi.log(
          "INFO",
          `Setting user provided image rotation to ${toLoad.rotation}\xB0 via X-Rotate header`,
          "AI / LLAMA / STD / QA",
        );
      }
      const immediateCX = toProcess.closest(".CXContainer");
      let container;
      if (immediateCX?.classList.contains("AI_LLAMA_QA_Exclude")) {
        container = immediateCX;
      } else {
        container = immediateCX?.parentElement?.closest(".CXContainer") ?? immediateCX;
      }
      const allQuestionElements = container.querySelectorAll(".AI_LLAMA_STANDARD_QA_Question");
      const questionElements = [];
      for (const candidate of allQuestionElements) {
        const innerContainer = candidate.closest(".CXContainer");
        if (
          innerContainer &&
          innerContainer !== container &&
          innerContainer.classList.contains("AI_LLAMA_QA_Exclude")
        ) {
          continue;
        }
        questionElements.push(candidate);
      }
      const vqaHeaders = {};
      vqaHeaders["X-Session-Id"] = _AI_LLAMA_STANDARD_QA.PAGE_SESSION_ID;
      const responseLang = toLoad.responselanguage != null ? String(toLoad.responselanguage).trim() : "";
      const specialist = toLoad.specialist != null ? String(toLoad.specialist).trim() : "";
      if (responseLang) {
        vqaHeaders["X-Forced-Language"] = responseLang;
      }
      if (specialist) {
        vqaHeaders["X-Specialist"] = specialist;
      }
      const internetAccess = toLoad.InternetAccess != null && String(toLoad.InternetAccess).toLowerCase() === "true";
      vqaHeaders["X-Search"] = internetAccess ? "true" : "false";
      if (toLoad.filterresults != null) {
        vqaHeaders["X-Filter-Results"] = String(toLoad.filterresults).toLowerCase() === "true" ? "true" : "false";
      }
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
      if (toLoad.location != null && String(toLoad.location).toLowerCase() === "true") {
        vqaHeaders["X-Location"] = "true";
        if (navigator.geolocation) {
          try {
            const pos = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 5e3,
                maximumAge: 3e5,
              });
            });
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
      let verifyFieldId = null;
      let verifyFieldQuestion = null;
      if (mode === "verify") {
        verifyFieldId = toProcess.getAttribute("id");
        verifyFieldQuestion = toProcess.getAttribute("data-cb-Question");
        if (verifyFieldId && verifyFieldQuestion) {
          verifyFieldQuestion = verifyFieldQuestion.replace(/<\[([^\]]+)\]>/g, (match, identifier) => {
            const trimmed = identifier.trim();
            const field = document.querySelector(`.${trimmed}`);
            if (field && "value" in field) {
              return field.value;
            }
            return match;
          });
          vqaHeaders[`X-Question-${verifyFieldId}`] = verifyFieldQuestion;
        }
      }
      if (!(mode === "verify" && verifyFieldId && verifyFieldQuestion)) {
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
            vqaHeaders[`X-Question-${id}`] = question;
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
      if (Object.keys(vqaHeaders).length > 0) {
        const tsToProcess = toProcess;
        tsToProcess.style.pointerEvents = "none";
        tsToProcess.style.opacity = "0.5";
        window.codbi.injectLoadingAnim(toProcess);
        const uploadLabel = tsToProcess.parentElement?.querySelector("label");
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
        const questionLabelData = /* @__PURE__ */ new Map();
        if (!(mode === "verify" && verifyFieldId && verifyFieldQuestion)) {
          for (const element of questionElements) {
            let labelParent = element.parentElement;
            while (
              labelParent?.classList.contains("LLAMA_AI_Hint_Wrapper") ||
              labelParent?.classList.contains("MEDIA_Whisper_InputWrapper")
            ) {
              labelParent = labelParent.parentElement;
            }
            const questionLabel = labelParent?.querySelector("label");
            if (questionLabel) {
              const originalText = questionLabel.innerHTML;
              questionLabelData.set(questionLabel, originalText);
              questionLabel.innerHTML = `${originalText}
                <span class = "LLAMA_Processing">Processing...</span>`;
            }
          }
        }
        const disabledFields = [];
        if (!(mode === "verify" && verifyFieldId && verifyFieldQuestion)) {
          for (const element of questionElements) {
            const field = document.querySelector(`#${element.id}`);
            if (field) {
              field.disabled = true;
              field.style.opacity = "0.5";
              disabledFields.push(field);
            }
          }
        }
        const unanimate = () => {
          window.codbi.removeLoaderAnim(toProcess);
          tsToProcess.style.pointerEvents = "all";
          tsToProcess.style.opacity = "1";
          if (uploadLabel) {
            uploadLabel.innerHTML = uploadFormerText;
          }
          for (const [label, originalText] of questionLabelData.entries()) {
            label.innerHTML = originalText;
          }
          for (const field of disabledFields) {
            field.disabled = false;
            field.style.opacity = "1";
          }
        };
        const qaQueueOverride = toLoad.queuebadge != null ? String(toLoad.queuebadge) !== "false" : null;
        const qaQueueText = toLoad.queuetext != null ? String(toLoad.queuetext) : "";
        let qaQueueBadgeEl = null;
        const showQaQueueBadge = (position, estimatedWaitMs) => {
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
        let qaQueueTicket = null;
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
                setTimeout(sendQaRequest, 1e3);
                return;
              }
              hideQaQueueBadge();
              unanimate();
              if (response.error) {
                window.codbi.log("ERROR", `REST failed with: ${response.error}`, "AI / LLAMA / QA");
                return;
              }
              if (mode === "verify" && verifyFieldId && verifyFieldQuestion) {
                const answer = TYPE.tsCheck(response[verifyFieldId].answer, "string");
                const field = INSTANCE.tsCheck(
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
                if ((caseInsensitive ? answer.trim().toLowerCase() : answer.trim()) === positiveResponse) {
                  $(toProcess).error("");
                  const existingManualVerify =
                    toProcess.parentElement?.parentElement?.querySelectorAll(".LLAMA_AI_ManualVerify");
                  if (existingManualVerify) {
                    for (let i = 0; i < existingManualVerify.length; i++) {
                      existingManualVerify[i].remove();
                    }
                  }
                } else {
                  $(toProcess).error(verifyErrorText);
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
                  const existingManualVerify =
                    toProcess.parentElement?.parentElement?.querySelectorAll(".LLAMA_AI_ManualVerify");
                  if (existingManualVerify) {
                    for (let i = 0; i < existingManualVerify.length; i++) {
                      existingManualVerify[i].remove();
                    }
                  }
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
              } else {
                for (const questionId in response) {
                  const answerText = response[questionId]?.answer;
                  if (answerText == null) {
                    continue;
                  }
                  const field = INSTANCE.tsCheck(document.querySelector(`#${questionId}`), HTMLInputElement);
                  field.value = answerText;
                  if (aiHintText) {
                    _AI_LLAMA_STANDARD_QA.attachAiHint(field, aiHintText);
                  }
                  const event2 = new Event("change", { bubbles: true });
                  field.dispatchEvent(event2);
                }
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
      }
    });
  }
  static {
    // #region PDF.js worker configuration
    /** Ensures PDF.js worker is configured with the correct URL. */
    this.pdfJsWorkerConfigured = false;
  }
  /**
   * Ensures the PDF.js worker URL is configured once before any PDF operations.
   *
   * @remarks
   * Sets {@link pdfjsLib.GlobalWorkerOptions.workerSrc} to the Resource plugin URL
   * and guards against repeated initialization via {@link AI_LLAMA_STANDARD_QA.pdfJsWorkerConfigured}. */
  static ensurePdfJsWorkerConfigured() {
    if (_AI_LLAMA_STANDARD_QA.pdfJsWorkerConfigured) {
      return;
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.codbi.baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.worker.min.js`;
    _AI_LLAMA_STANDARD_QA.pdfJsWorkerConfigured = true;
    window.codbi.log(
      "INFO",
      `PDF.js worker configured: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`,
      "AI / LLAMA / STD / QA",
    );
  }
  // #endregion PDF.js worker configuration
  // #region AI-Generated hint
  /** Injects global styles for the AI-Generated badge (once). */
  static ensureAiHintStyles() {
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
  static attachAiHint(field, hintText) {
    _AI_LLAMA_STANDARD_QA.ensureAiHintStyles();
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
  static {
    // #endregion AI-Generated hint
    // #region Image downscaling helper
    /** Default total-pixel budget (width × height). Matches the backend's default maxPixels (≈ 1792 × 1792). */
    this.DEFAULT_MAX_PIXELS = 3211264;
  }
  /**
   * Converts a {@link Blob} (or {@link File}) to a base64 data-URL string,
   * bypassing formcycle's multipart file parser which returns 0-byte {@code FileData}.
   *
   * @param blob The Blob or File to convert.
   *
   * @returns A promise that resolves to a base64 data-URL string. */
  static blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
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
  static canvasToFile(toConvert, fileName) {
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
          "AI / LLAMA / QA",
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
        resolve(_AI_LLAMA_STANDARD_QA.canvasToFile(canvas, file.name));
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(file);
      };
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
  static async processPdfFile(file, maxPages = 0) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images = [];
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
        const blob = await _AI_LLAMA_STANDARD_QA.renderPdfPageToImage(page);
        images.push(blob);
      } else {
        window.codbi.log(
          "INFO",
          `PDF page ${pageNum} has minimal text (${textLength} chars) - attempting image extraction`,
          "AI / LLAMA / STD / QA",
        );
        const extractedImages = await _AI_LLAMA_STANDARD_QA.extractImagesFromPdfPage(page);
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
          const blob = await _AI_LLAMA_STANDARD_QA.renderPdfPageToImage(page);
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
  static async renderPdfPageToImage(page) {
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get canvas 2D context");
    }
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    return new Promise((resolve, reject) => {
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
                  const blob = await new Promise((resolve, reject) => {
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
};
__decorateClass(
  [
    DBC.ParamvalueProvider,
    __decorateParam(
      0,
      TYPE.PRE(
        "string",
        "aihint, positiveresponse, verifyerrortext, verifycheckboxlabel, mode, responselanguage, specialist, queuebadge, queuetext",
      ),
    ),
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
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "maxpages")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^(90|180|270)$/), "rotation")),
    __decorateParam(0, IF.PRE(new TYPE("number"), new OR([new EQ(90), new EQ(180), new EQ(270)]), "rotation")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "maxPixelSize")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^[a-z]{2}$/i), "responselanguage")),
    __decorateParam(0, OR.PRE([new TYPE("string"), new TYPE("boolean")], "internetaccess, thinking, caseinsensitive")),
    __decorateParam(0, OR.PRE([new TYPE("number"), new TYPE("string")], "maxthinkingtokens")),
    __decorateParam(0, OR.PRE([new TYPE("string"), new TYPE("boolean")], "filterresults")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "filterresults")),
    __decorateParam(
      1,
      INSTANCE.PRE(
        HTMLInputElement,
        void 0,
        'Is it not an <input type = "file"/> that is tagged with this functionality?',
      ),
    ),
    __decorateParam(1, EQ.PRE("file", false, "type")),
  ],
  _AI_LLAMA_STANDARD_QA,
  "functionality",
  1,
);
var AI_LLAMA_STANDARD_QA = _AI_LLAMA_STANDARD_QA;
window.codbi.registerFunctionality(
  "AI.LLAMA.STANDARD.QA",
  AI_LLAMA_STANDARD_QA.functionality.bind(AI_LLAMA_STANDARD_QA),
);
export { AI_LLAMA_STANDARD_QA };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9haS5sbGFtYS5zdGFuZGFyZC5xYS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIFhJTUFcbmltcG9ydCB7IGdldEpRdWVyeSB9IGZyb20gXCJAZGUteGltYS9mYy1mb3JtLXJlbmRlcmVyXCI7XG5pbXBvcnQgeyBnZW5lcmF0ZVVVSUQgfSBmcm9tIFwiLi4vZ2xvYmFsLXNjb3BlXCI7XG4vLyAjZW5kcmVnaW9uIFhJTUFcbi8vICNyZWdpb24gWERCQ1xuaW1wb3J0IHsgREJDIH0gZnJvbSBcInhkYmMvc3JjL0RCQ1wiO1xuaW1wb3J0IHsgUkVHRVggfSBmcm9tIFwieGRiYy9zcmMvREJDL1JFR0VYXCI7XG5pbXBvcnQgeyBUWVBFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9UWVBFXCI7XG5pbXBvcnQgeyBJRiB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvSUZcIjtcbmltcG9ydCB7IElOU1RBTkNFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JTlNUQU5DRVwiO1xuaW1wb3J0IHsgRVEgfSBmcm9tIFwieGRiYy9zcmMvREJDL0VRXCI7XG5pbXBvcnQgeyBPUiB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvT1JcIjtcbmltcG9ydCB7IEdSRUFURVIgfSBmcm9tIFwieGRiYy9zcmMvREJDL0NPTVBBUklTT04vR1JFQVRFUlwiO1xuaW1wb3J0IHsgREVGSU5FRCB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvREVGSU5FRFwiO1xuLy8gI2VuZHJlZ2lvbiBYREJDXG4vLyAjcmVnaW9uIFBERi5qc1xuaW1wb3J0ICogYXMgcGRmanNMaWIgZnJvbSBcInBkZmpzLWRpc3RcIjtcbmltcG9ydCB0eXBlIHsgUERGRG9jdW1lbnRQcm94eSwgUERGUGFnZVByb3h5IH0gZnJvbSBcInBkZmpzLWRpc3RcIjtcbi8vICNlbmRyZWdpb24gUERGLmpzXG5pbXBvcnQgeyBmb3JtYXRXYWl0VGltZSB9IGZyb20gXCIuLi9jb21tb25zL2Zvcm1hdC13YWl0LXRpbWVcIjtcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLyoqXG4gKiBQcm92aWRlcyB0aGUge0BsaW5rIEFJX0xMQU1BX1NUQU5EQVJEX1FBLmZ1bmN0aW9uYWxpdHkgfS5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChTYWx2YXRvcmUuQ2FsbGFyaUBBbnNiYWNoLmRlKSAqL1xuLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1N0YXRpY09ubHlDbGFzczogUHJvYWN0aXZlIERlc2lnbi5cbmV4cG9ydCBjbGFzcyBBSV9MTEFNQV9TVEFOREFSRF9RQSB7XG4gIC8qKlxuICAgKiBUaGUgVW5pcXVlIHNlc3Npb24gSUQgZ2VuZXJhdGVkIG9uIHBhZ2UgbG9hZCBcdTIwMTQgZW5zdXJlcyBlYWNoIHNlc3Npb24gZ2V0cyBpdHMgb3duIGxsYW1hLXNlcnZlciBzbG90IGFuZCB0aHVzXG4gICAqIG5vIGluZm8gZnJvbSBvbmUgY29udmVyc2F0aW9uIGxlYWtzIGludG8gYW5vdGhlciBvbmUuICovXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IFBBR0VfU0VTU0lPTl9JRDogc3RyaW5nID0gZ2VuZXJhdGVVVUlEKCk7XG4gIC8qKlxuICAgKiBUaGlzIGZ1bmN0aW9uYWxpdHkgcHJvY2Vzc2VzIHVwbG9hZGVkIGltYWdlcyB1c2luZyBhIGxvY2FsIGxsYW1hLXNlcnZlciBwcm9jZXNzIHRvXG4gICAqIGFuc3dlciBxdWVzdGlvbnMgYWJvdXQgZG9jdW1lbnRzLiBBcyBzb29uIGFzIHRoZSBmaWxlKHMpIHNlbGVjdGVkIGNoYW5nZXMgdGhlIEFJXG4gICAqIGlzIGNvbnRhY3RlZCB2aWEgQUpBWCBhbmQgdGhlIHF1ZXN0aW9ucyBhcmUgYW5zd2VyZWQuIE5vdGhpbmcgaGFwcGVucyBpZiBubyBmaWxlIGlzXG4gICAqIHNlbGVjdGVkLlxuICAgKlxuICAgKiAqKlBERiBTdXBwb3J0OioqIFRoZSBmdW5jdGlvbmFsaXR5IGF1dG9tYXRpY2FsbHkgZGV0ZWN0cyBQREYgZmlsZXMgYW5kIHByb2Nlc3NlcyB0aGVtIGFjY29yZGluZ2x5OlxuICAgKiAtIElmIFBERiBjb250YWlucyBtYWlubHkgdGV4dCwgdGhlIHRleHQgaXMgcmVuZGVyZWQgdG8gYW4gaW1hZ2UgYmVmb3JlIHNlbmRpbmcgdG8gQUkuXG4gICAqIC0gSWYgUERGIGNvbnRhaW5zIGltYWdlcyAoc2Nhbm5lZCBkb2N1bWVudHMpLCB0aG9zZSBpbWFnZXMgYXJlIGV4dHJhY3RlZCBhbmQgc2VudCB0byBBSS5cbiAgICogLSBNdWx0aXBsZSBmaWxlcyBjYW4gYmUgc2VsZWN0ZWQsIG1peGluZyBQREZzIGFuZCBpbWFnZXNcbiAgICpcbiAgICogKipJbWFnZSBPcmllbnRhdGlvbjoqKiBUaGUgbW9kZWwgaXMgc2Vuc2l0aXZlIHRvIGltYWdlIHJvdGF0aW9uLiBUaGVyZSBhcmUgdHdvIHdheXNcbiAgICogdG8gcHJvdmlkZSBvcmllbnRhdGlvbiBvZiB0aGUgaW1hZ2UgdG8gcHJvY2VzczpcbiAgICpcbiAgICogMS4gKipNYW51YWwgUm90YXRpb24gKFByaW9yaXR5KToqKiBBZGQgYSAqKmRhdGEtY2ItUm90YXRlKiogYXR0cmlidXRlIHRvIHRoZSBpbnB1dCBlbGVtZW50OlxuICAgKiAgICAtIGBkYXRhLWNiLVJvdGF0ZT1cIjkwXCJgICAgLSBSb3RhdGUgaW1hZ2UgOTBcdTAwQjAgY2xvY2t3aXNlXG4gICAqICAgIC0gYGRhdGEtY2ItUm90YXRlPVwiMTgwXCJgICAtIFJvdGF0ZSBpbWFnZSAxODBcdTAwQjBcbiAgICogICAgLSBgZGF0YS1jYi1Sb3RhdGU9XCIyNzBcImAgIC0gUm90YXRlIGltYWdlIDI3MFx1MDBCMCBjbG9ja3dpc2UgKDkwXHUwMEIwIGNvdW50ZXItY2xvY2t3aXNlKVxuICAgKlxuICAgKiAyLiAqKkF1dG9tYXRpYyBEZXRlY3Rpb24gKEZhbGxiYWNrKToqKiBJZiBubyBkYXRhLWNiLVJvdGF0ZSBhdHRyaWJ1dGUgaXMgcHJvdmlkZWQgQU5EIHRoZVxuICAgKiAgICBUZXNzZXJhY3QgT0NSIGVuZ2luZSBpcyBhY3RpdmUgKCoqT0NSKiogaXMgc2V0IGluICoqQWN0aXZlX0FJKiogcGx1Z2luIHByb3BlcnR5KSwgdGhlIHN5c3RlbSB3aWxsXG4gICAqICAgIGF1dG9tYXRpY2FsbHkgZGV0ZWN0IGFuZCBjb3JyZWN0IGltYWdlIG9yaWVudGF0aW9uIHVzaW5nIFRlc3NlcmFjdCdzIE9TRCAoT3JpZW50YXRpb25cbiAgICogICAgYW5kIFNjcmlwdCBEZXRlY3Rpb24pLlxuICAgKlxuICAgKiAzLiAqKk5vIFJvdGF0aW9uOioqIElmIGRhdGEtY2ItUm90YXRlIGlzIG5vdCBwcm92aWRlZCBhbmQgKipPQ1IqKiBpcyBub3Qgc2V0IGluICoqQWN0aXZlX0FJKiogcGx1Z2luIHByb3BlcnR5LCBpbWFnZXMgYXJlXG4gICAqICAgIHByb2Nlc3NlZCBhcy1pcyBsZWFkaW5nIHRvIHBvdGVudGlhbCB3cm9uZyByZXN1bHRzIHdpdGggaW1hZ2VzIHRoYXQgYXJlIHJvdGF0ZWQgdW5sZXNzIGEgc29waGlzdGljYXRlZCBBSSBtb2RlbCBsaWtlIExMTXNcbiAgICogICAgaXMgdXNlZC5cbiAgICpcbiAgICogIyMjIENvbmZpZyBQYXJhbWV0ZXJzOlxuICAgKiAtICoqbWF4UGFnZXMqKjogICAgICAgICAgICBPcHRpb25hbCBudW1iZXIgbGltaXRpbmcgaG93IG1hbnkgcGFnZXMgZnJvbSBhIFBERiBhcmUgcHJvY2Vzc2VkIGFuZCBzZW50IHRvIHRoZSBBSS5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgVXNlZnVsIGZvciBsYXJnZSBQREZzIHRvIGF2b2lkIG92ZXJ3aGVsbWluZyB0aGUgQUkgb3IgaGl0dGluZyBwcm9jZXNzaW5nIGxpbWl0cy5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgSWYgc2V0IHRvIDAsIGFsbCBwYWdlcyBhcmUgcHJvY2Vzc2VkLiBFeGFtcGxlOiBgbWF4UGFnZXM6IDVgIHdpbGxcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgb25seSBwcm9jZXNzIHRoZSBmaXJzdCA1IHBhZ2VzIG9mIGFueSBQREYuIERlZmF1bHRzIHRvICoqNSoqLlxuICAgKiAtICoqUm90YXRpb24qKjogICAgICAgICAgICBPcHRpb25hbCBhdHRyaWJ1dGUgb24gdGhlIGlucHV0IGVsZW1lbnQgdG8gc3BlY2lmeSBpbWFnZSByb3RhdGlvbiAoc2VlIGFib3ZlKSwgZWl0aGVyIFwiOTBcIiwgXCIxODBcIiwgb3IgXCIyNzBcIi5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgSW4gYSBtdWx0aS1maWxlIHVwbG9hZCBvciB3aXRoIGEgUERGIHRoYXQgY29udGFpbnMgbXVsdGlwbGUgaW1hZ2VzLCB0aGlzIHJvdGF0aW9uIGlzIGFwcGxpZWQgdG8gYWxsIGZpbGVzLlxuICAgKiAtICoqTWF4UGl4ZWxTaXplKio6ICAgICAgICBNYXhpbXVtIHRvdGFsIHBpeGVsIGJ1ZGdldCAod2lkdGhcdTAwRDdoZWlnaHQpLiBJbWFnZXMgZXhjZWVkaW5nIHRoaXNcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJlIGRvd25zY2FsZWQgY2xpZW50LXNpZGUgd2hpbGUgcHJlc2VydmluZyB0aGUgYXNwZWN0IHJhdGlvLlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBEZWZhdWx0OiAzMjExMjY0IChcdTIyNDggMTc5Mlx1MDBENzE3OTIpLiBTZXQgdG8gMCB0byBkaXNhYmxlIGNsaWVudC1zaWRlIGRvd25zY2FsaW5nLlxuICAgKiAtICoqQUlIaW50Kio6ICAgICAgICAgICAgICBUZXh0IHNob3duIGluc2lkZSBBSS1wb3B1bGF0ZWQgZmllbGRzIChyaWdodC1hbGlnbmVkIGZvciBpbnB1dHMsIGJvdHRvbS1yaWdodFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgdGV4dGFyZWEpIHVudGlsIHRoZSB1c2VyIGVkaXRzIHRoZSB2YWx1ZS4gRGVmYXVsdDogXCJcdTI3MjggQUktR2VuZXJhdGVkXCIuXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNldCB0byBhbiBlbXB0eSBzdHJpbmcgdG8gZGlzYWJsZS5cbiAgICpcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgTm90ZTogKipBY2NvcmRpbmcgdG8gdGhlIEVVIEFJIEFjdCwgQUktZ2VuZXJhdGVkIGNvbnRlbnQgbXVzdCBiZSBjbGVhcmx5IGxhYmVsZWQuIENoYW5naW5nIG9yXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGluZyB0aGUgQUlIaW50IG1heSBsZWFkIHRvIG5vbi1jb21wbGlhbmNlIGluIGNlcnRhaW4ganVyaXNkaWN0aW9ucy4qKlxuICAgKiAtICoqSW50ZXJuZXRBY2Nlc3MqKjogICAgICBJZiBzZXQgdG8gYHRydWVgLCBlbmFibGVzIEJyYXZlIFNlYXJjaCBpbnRlcm5ldCBhY2Nlc3MgZm9yIHRoaXNcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25hbGl0eSBpbnN0YW5jZS4gVGhlIG1vZGVsIG1heSB1c2Ugd2ViIHNlYXJjaCByZXN1bHRzIHRvIGltcHJvdmVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRzIGFuc3dlcnMuIERlZmF1bHQ6IGBmYWxzZWAgKG5vIGludGVybmV0IHNlYXJjaCkuXG4gICAqIC0gKipUaGlua2luZyoqOiAgICAgICAgICAgIElmIHNldCB0byBgdHJ1ZWAsIGVuYWJsZXMgdGhpbmtpbmcgbW9kZS4gVGhlIEFJIHdpbGwgdXNlIGEgZGVkaWNhdGVkXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaW5raW5nIG1vZGVsIChpZiBjb25maWd1cmVkKSBmb3IgZGVlcGVyIHJlYXNvbmluZy4gRGVmYXVsdDogYGZhbHNlYC5cbiAgICogLSAqKk1heFRoaW5raW5nVG9rZW5zKio6ICAgTWF4aW11bSB0b2tlbiBidWRnZXQgZm9yIHRoaW5raW5nIGluZmVyZW5jZS4gSW4gdmVyaWZ5IG1vZGUgdGhpc1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0cyB0byBgNTEyYCAoZW5vdWdoIGZvciB5ZXMvbm8gcmVhc29uaW5nKS4gU2V0IGhpZ2hlciBpZiB0aGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwgbmVlZHMgbW9yZSByb29tIHRvIHJlYXNvbi4gSGFzIG5vIGVmZmVjdCB3aGVuIFRoaW5raW5nIGlzIGBmYWxzZWAuXG4gICAqIC0gKipQb3NpdGl2ZVJlc3BvbnNlKio6ICAgIFRoZSBleHBlY3RlZCBwb3NpdGl2ZSBhbnN3ZXIgZnJvbSB0aGUgQUkgaW4gdmVyaWZ5IG1vZGUuXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBjb21wYXJpc29uIGlzIGNhc2UtaW5zZW5zaXRpdmUgYnkgZGVmYXVsdC4gRGVmYXVsdDogYFwieWVzXCJgLlxuICAgKiAtICoqQ2FzZUluc2Vuc2l0aXZlKio6ICAgICBJZiBgdHJ1ZWAgKGRlZmF1bHQpLCB0aGUgQUkgYW5zd2VyIGlzIGxvd2VyY2FzZWQgYmVmb3JlIGNvbXBhcmluZ1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRoIFBvc2l0aXZlUmVzcG9uc2UuIFNldCB0byBgZmFsc2VgIGZvciBhbiBleGFjdCAoY2FzZS1zZW5zaXRpdmUpIG1hdGNoLlxuICAgKiAtICoqVmVyaWZ5RXJyb3JUZXh0Kio6ICAgICBFcnJvciBtZXNzYWdlIHNob3duIHdoZW4gdGhlIGZpbGUgZG9lcyBub3QgcGFzcyB2ZXJpZmljYXRpb24uXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIERlZmF1bHQ6IGBcIlRoZSBmaWxlIGRvZXMgbm90IG1lZXQgdGhlIHZlcmlmaWNhdGlvbiBjcml0ZXJpYS5cImBcbiAgICogLSAqKlZlcmlmeUNoZWNrYm94TGFiZWwqKjogTGFiZWwgZm9yIHRoZSBtYW51YWwgdmVyaWZpY2F0aW9uIGNoZWNrYm94LlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBEZWZhdWx0OiBgXCJUaGUgY29udGVudCBpcyBub3QgYXMgZXhwZWN0ZWQuIFBsZWFzZSBjaGVjayBpZiB5b3Ugc2VsZWN0ZWQgdGhlIGNvcnJlY3QgZmlsZShzKS5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgWW91IG1heSBtYW51YWxseSB2ZXJpZnkgdGhhdCBpdCBpcyB0aGUgY29ycmVjdCBvbmUgYnkgY2xpY2tpbmcgdGhlIGNoZWNrYm94LlwiYFxuICAgKiAtICoqTW9kZSoqOiAgICAgICAgICAgICAgICBJZiBzZXQgdG8gXCJ2ZXJpZnlcIiwgdGhlIHVwbG9hZCBmaWVsZCBtYXkgaGF2ZSBhICoqZGF0YS1jYi1RdWVzdGlvbioqIGF0dHJpYnV0ZS5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgSW4gdGhpcyBjYXNlLCB0aGUgcXVlc3Rpb24gaXMgc2VudCB0byB0aGUgQUkgYW5kIHRoZSBhbnN3ZXIgbXVzdCBiZSBcInllc1wiIChjYXNlLWluc2Vuc2l0aXZlKSBmb3IgdGhlIGZpbGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgdG8gYmUgYWNjZXB0ZWQuIElmIG5vdCwgYW4gZXJyb3IgYW5kIGEgbWFudWFsIHZlcmlmaWNhdGlvbiBjaGVja2JveCBhcmUgc2hvd24sXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIGp1c3QgbGlrZSBpbiBhaS5vY3IudHMuIFRoZSBxdWVzdGlvbiBjYW4gcmVmZXJlbmNlIHN5bWJvbHMgYXMgdXN1YWwuXG4gICAqIC0gKipSZXNwb25zZUxhbmd1YWdlKio6ICAgIFR3by1sZXR0ZXIgSVNPIDYzOS0xIGNvZGUgKGUuZy4gYFwiZGVcImAsIGBcImZyXCJgKS4gRm9yY2VzIHRoZSBBSSB0b1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25kIGluIHRoaXMgbGFuZ3VhZ2UsIHNraXBwaW5nIGF1dG8tZGV0ZWN0aW9uLiBPdmVycmlkZXMgdGhlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBBSV9MTEFNQV9TVERfTGFuZ3VhZ2VgIHBsdWdpbiBwcm9wZXJ0eSBmb3IgdGhpcyBpbnN0YW5jZS5cbiAgICogLSAqKlNwZWNpYWxpc3QqKjogICAgICAgICAgTmFtZSBvZiBhIHNwZWNpYWxpc3QgbW9kZWwgcmVnaXN0ZXJlZCB2aWEgYEFJX0xMQU1BX1NURF9TUEVDSUFMSVNUX1hYWGBcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luIHByb3BlcnR5LiBSb3V0ZXMgcmVxdWVzdHMgdG8gdGhhdCBzcGVjaWFsaXN0J3MgZGVkaWNhdGVkIHNlcnZlclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZSAoY2FzZS1pbnNlbnNpdGl2ZSBtYXRjaCkuXG4gICAqIC0gKipRdWV1ZUJhZGdlKio6ICAgICAgICAgIElmIHNldCB0byBgXCJ0cnVlXCJgLCBzaG93cyBhIGJhZGdlIHdpdGggdGhlIGN1cnJlbnQgcXVldWUgcG9zaXRpb24gd2hpbGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgd2FpdGluZyBmb3IgaW5mZXJlbmNlLiBPdmVycmlkZXMgdGhlIGBBSV9RdWV1ZUJhZGdlYCBwbHVnaW4gcHJvcGVydHlcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIHRoaXMgaW5zdGFuY2UuIERlZmF1bHQ6IGRldGVybWluZWQgYnkgcGx1Z2luIHByb3BlcnR5LlxuICAgKiAtICoqUXVldWVUZXh0Kio6ICAgICAgICAgICBUZXh0IGFwcGVuZGVkIGFmdGVyIHRoZSBxdWV1ZSBwb3NpdGlvbiBudW1iZXIgaW4gdGhlIGJhZGdlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlLmcuIGBcImluIHF1ZXVlXCJgIFx1MjE5MiBiYWRnZSBzaG93cyBgXCIzIGluIHF1ZXVlXCJgKS4gRGVmYXVsdDogZW1wdHkuXG4gICAqIC0gKipGaWx0ZXJSZXN1bHRzKio6ICAgICAgIElmIHNldCB0byBgXCJ0cnVlXCJgLCBlbmFibGVzIFBJSSBmaWx0ZXJpbmcgb24gQnJhdmUgU2VhcmNoIHF1ZXJpZXNcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIHRoaXMgaW5zdGFuY2UsIG92ZXJyaWRpbmcgdGhlIGdsb2JhbCBgQUlfQnJhdmVTZWFyY2hfRmlsdGVyUmVzdWx0c2BcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luIHByb3BlcnR5LiBEZWZhdWx0OiBkZXRlcm1pbmVkIGJ5IHBsdWdpbiBwcm9wZXJ0eS5cbiAgICpcbiAgICogUXVlc3Rpb25zIGFyZSBhY3F1aXJlZCBmcm9tIERPTSBlbGVtZW50cyB3aXRoaW4gdGhlIG5lYXJlc3QgYW5jZXN0b3IgKipYQ29udGFpbmVyKiogb2YgdGhlXG4gICAqIHtAbGluayBIVE1MSW5wdXRFbGVtZW50IH0gKip0b1Byb2Nlc3MqKiB0aGF0J3JlIHRhZ2dlZCB3aXRoIHRoZSBjbGFzcyAqKkFJX0xMQU1BX1NUQU5EQVJEX1FBX1F1ZXN0aW9uKiouXG4gICAqIEVhY2ggc3VjaCBlbGVtZW50IHNob3VsZCBoYXZlOlxuICAgKiAgLSBBbiAqKmlkKiogYXR0cmlidXRlICh1c2VkIGFzIHRoZSBxdWVzdGlvbiBrZXkpXG4gICAqICAtIEEgKipkYXRhLWNiLVF1ZXN0aW9uKiogIGF0dHJpYnV0ZSAoY29udGFpbnMgdGhlIHF1ZXN0aW9uIHRleHQgd2hpY2ggbWF5IGluY2x1ZGUgc3ltYm9scyBsaWtlIDxbRmllbGROYW1lXT5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdCBnZXQgcmVzb2x2ZWQgdG8gdGhlIHZhbHVlIG9mIHRoZSBmaWVsZCB3aXRoIENTUy1DbGFzcyBcIkZpZWxkTmFtZVwiIGluIHRoZSBzYW1lIGNvbnRhaW5lcikuXG4gICAqXG4gICAqICoqU3ViLWNvbnRhaW5lciBleGNsdXNpb246KiogTmVzdGVkICoqWENvbnRhaW5lcioqIGVsZW1lbnRzIHdpdGhpbiB0aGUgc2VhcmNoIHNjb3BlIGNhbiBiZSB0YWdnZWQgd2l0aCB0aGUgQ1NTLUNsYXNzXG4gICAqICoqQUlfTExBTUFfUUFfRXhjbHVkZSoqIHRvIGV4Y2x1ZGUgdGhlaXIgY29udGVudHMgZnJvbSB0aGUgcXVlc3Rpb24gc2VhcmNoLiBUaGlzIGFsbG93cyBwYXJ0aXRpb25pbmcgYSBmb3JtIHNvIHRoYXQgZWFjaFxuICAgKiB1cGxvYWQgZmllbGQgb25seSBwaWNrcyB1cCBpdHMgb3duIHF1ZXN0aW9ucy4gQW4gdXBsb2FkIGZpZWxkIHRoYXQgcmVzaWRlcyAqaW5zaWRlKiBhbiBleGNsdWRlZCBzdWItY29udGFpbmVyIG5hdHVyYWxseVxuICAgKiBzZWFyY2hlcyB0aGF0IHN1Yi1jb250YWluZXIgKGl0cyBvd24gbmVhcmVzdCBYQ29udGFpbmVyKSBhbmQgaXMgbm90IGFmZmVjdGVkIGJ5IHRoZSBleGNsdXNpb24uXG4gICAqXG4gICAqIEluIHZlcmlmeSBtb2RlLCB0aGUgdXBsb2FkIGZpZWxkIGl0c2VsZiBtYXkgaGF2ZSBhICoqZGF0YS1jYi1RdWVzdGlvbioqIGF0dHJpYnV0ZS4gVGhpcyBxdWVzdGlvbiBpcyBzZW50IHRvIHRoZSBBSSBhbmQgdGhlIGFuc3dlciBtdXN0IGJlIFwieWVzXCIgKGNhc2UtaW5zZW5zaXRpdmUpIGZvciB0aGUgZmlsZSB0byBiZSBhY2NlcHRlZC4gT3RoZXJ3aXNlLCBhbiBlcnJvciBhbmQgYSBtYW51YWwgdmVyaWZpY2F0aW9uIGNoZWNrYm94IGFyZSBzaG93bi5cbiAgICpcbiAgICogQHBhcmFtIHRvTG9hZCAgICBQcm92aWRlZCBieSB0aGUgQ29kQmkuXG4gICAqIEBwYXJhbSB0b1Byb2Nlc3MgUHJvdmlkZWQgYnkgdGhlIENvZEJpLiAqL1xuICBAREJDLlBhcmFtdmFsdWVQcm92aWRlclxuICBwdWJsaWMgc3RhdGljIGZ1bmN0aW9uYWxpdHkoXG4gICAgQFRZUEUuUFJFKFxuICAgICAgXCJzdHJpbmdcIixcbiAgICAgIFwiYWloaW50LCBwb3NpdGl2ZXJlc3BvbnNlLCB2ZXJpZnllcnJvcnRleHQsIHZlcmlmeWNoZWNrYm94bGFiZWwsIG1vZGUsIHJlc3BvbnNlbGFuZ3VhZ2UsIHNwZWNpYWxpc3QsIHF1ZXVlYmFkZ2UsIHF1ZXVldGV4dFwiLFxuICAgIClcbiAgICBAR1JFQVRFUi5QUkUoXG4gICAgICAzLFxuICAgICAgdHJ1ZSxcbiAgICAgIGZhbHNlLFxuICAgICAgXCJhaWhpbnQubGVuZ3RoXCIsXG4gICAgICBcIkFjY29yZGluZyB0byB0aGUgRVUgQUkgQWN0LCBBSS1nZW5lcmF0ZWQgY29udGVudCBtdXN0IGJlIGNsZWFybHkgbGFiZWxlZC4gQ2hhbmdpbmcgb3IgZGlzYWJsaW5nIHRoZSBBSUhpbnQgbWF5IGxlYWQgdG8gbm9uLWNvbXBsaWFuY2UgaW4gY2VydGFpbiBqdXJpc2RpY3Rpb25zLlwiLFxuICAgIClcbiAgICBASUYuUFJFKG5ldyBUWVBFKFwic3RyaW5nXCIpLCBuZXcgUkVHRVgoL15cXGQrJC8pLCBcIm1heHBhZ2VzXCIpXG4gICAgQElGLlBSRShuZXcgVFlQRShcInN0cmluZ1wiKSwgbmV3IFJFR0VYKC9eKDkwfDE4MHwyNzApJC8pLCBcInJvdGF0aW9uXCIpXG4gICAgQElGLlBSRShuZXcgVFlQRShcIm51bWJlclwiKSwgbmV3IE9SKFtuZXcgRVEoOTApLCBuZXcgRVEoMTgwKSwgbmV3IEVRKDI3MCldKSwgXCJyb3RhdGlvblwiKVxuICAgIEBJRi5QUkUobmV3IFRZUEUoXCJzdHJpbmdcIiksIG5ldyBSRUdFWCgvXlxcZCskLyksIFwibWF4UGl4ZWxTaXplXCIpXG4gICAgQElGLlBSRShuZXcgVFlQRShcInN0cmluZ1wiKSwgbmV3IFJFR0VYKC9eW2Etel17Mn0kL2kpLCBcInJlc3BvbnNlbGFuZ3VhZ2VcIilcbiAgICBAT1IuUFJFKFtuZXcgVFlQRShcInN0cmluZ1wiKSwgbmV3IFRZUEUoXCJib29sZWFuXCIpXSwgXCJpbnRlcm5ldGFjY2VzcywgdGhpbmtpbmcsIGNhc2VpbnNlbnNpdGl2ZVwiKVxuICAgIEBPUi5QUkUoW25ldyBUWVBFKFwibnVtYmVyXCIpLCBuZXcgVFlQRShcInN0cmluZ1wiKV0sIFwibWF4dGhpbmtpbmd0b2tlbnNcIilcbiAgICBAT1IuUFJFKFtuZXcgVFlQRShcInN0cmluZ1wiKSwgbmV3IFRZUEUoXCJib29sZWFuXCIpXSwgXCJmaWx0ZXJyZXN1bHRzXCIpXG4gICAgQElGLlBSRShuZXcgVFlQRShcInN0cmluZ1wiKSwgbmV3IFJFR0VYKC9eKHRydWV8ZmFsc2UpJC9pKSwgXCJmaWx0ZXJyZXN1bHRzXCIpXG4gICAgdG9Mb2FkOiB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSxcblxuICAgIEBJTlNUQU5DRS5QUkUoXG4gICAgICBIVE1MSW5wdXRFbGVtZW50LFxuICAgICAgdW5kZWZpbmVkLFxuICAgICAgJ0lzIGl0IG5vdCBhbiA8aW5wdXQgdHlwZSA9IFwiZmlsZVwiLz4gdGhhdCBpcyB0YWdnZWQgd2l0aCB0aGlzIGZ1bmN0aW9uYWxpdHk/JyxcbiAgICApXG4gICAgQEVRLlBSRShcImZpbGVcIiwgZmFsc2UsIFwidHlwZVwiKVxuICAgIHRvUHJvY2VzczogRWxlbWVudCxcbiAgKTogdm9pZCB7XG4gICAgKHRvUHJvY2VzcyBhcyBIVE1MSW5wdXRFbGVtZW50KS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgLy8gI3JlZ2lvbiBDaGVjayBpZiBlYXJseSBleGl0IGlzIGFwcHJvcHJpYXRlIChubyBmaWxlcyBzZWxlY3RlZClcbiAgICAgIGNvbnN0IGZpbGVzID0gKHRvUHJvY2VzcyBhcyBIVE1MSW5wdXRFbGVtZW50KS5maWxlcztcblxuICAgICAgaWYgKCFmaWxlcyB8fCBmaWxlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBpZiBlYXJseSBleGl0IGlzIGFwcHJvcHJpYXRlIChubyBmaWxlcyBzZWxlY3RlZClcbiAgICAgIC8vICNyZWdpb24gSW5pdGlhbGl6ZSBtb2RlLCBmaWxlcywgYW5kIGNvbmZpZyBmcm9tIHRvTG9hZFxuICAgICAgY29uc3QgbW9kZSA9ICh0b0xvYWQubW9kZSB8fCBcIlwiKS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCk7XG4gICAgICBjb25zdCAkID0gZ2V0SlF1ZXJ5KCk7XG4gICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgY29uc3QgbWF4UGFnZXMgPSB0b0xvYWQubWF4cGFnZXMgPyBOdW1iZXIodG9Mb2FkLm1heHBhZ2VzKSA6IDU7XG4gICAgICBjb25zdCBtYXhQaXhlbFNpemUgPVxuICAgICAgICB0b0xvYWQubWF4cGl4ZWxzaXplICE9IG51bGwgPyBOdW1iZXIodG9Mb2FkLm1heHBpeGVsc2l6ZSkgOiBBSV9MTEFNQV9TVEFOREFSRF9RQS5ERUZBVUxUX01BWF9QSVhFTFM7XG4gICAgICBjb25zdCBhaUhpbnRUZXh0ID0gdG9Mb2FkLmFpaGludCAhPSBudWxsID8gYFxcdTI3MjggJHtTdHJpbmcodG9Mb2FkLmFpaGludCl9YCA6IFwiXFx1MjcyOCBBSS1HZW5lcmF0ZWRcIjtcbiAgICAgIGNvbnN0IGNhc2VJbnNlbnNpdGl2ZSA9XG4gICAgICAgIHRvTG9hZC5jYXNlaW5zZW5zaXRpdmUgPT0gbnVsbCB8fCBTdHJpbmcodG9Mb2FkLmNhc2VpbnNlbnNpdGl2ZSkudG9Mb3dlckNhc2UoKSAhPT0gXCJmYWxzZVwiO1xuICAgICAgY29uc3QgcG9zaXRpdmVSZXNwb25zZSA9XG4gICAgICAgIHRvTG9hZC5wb3NpdGl2ZXJlc3BvbnNlICE9IG51bGxcbiAgICAgICAgICA/IGNhc2VJbnNlbnNpdGl2ZVxuICAgICAgICAgICAgPyBTdHJpbmcodG9Mb2FkLnBvc2l0aXZlcmVzcG9uc2UpLnRyaW0oKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICA6IFN0cmluZyh0b0xvYWQucG9zaXRpdmVyZXNwb25zZSkudHJpbSgpXG4gICAgICAgICAgOiBcInllc1wiO1xuICAgICAgY29uc3QgdmVyaWZ5RXJyb3JUZXh0ID1cbiAgICAgICAgdG9Mb2FkLnZlcmlmeWVycm9ydGV4dCAhPSBudWxsXG4gICAgICAgICAgPyBTdHJpbmcodG9Mb2FkLnZlcmlmeWVycm9ydGV4dClcbiAgICAgICAgICA6IFwiVGhlIGZpbGUgZG9lcyBub3QgbWVldCB0aGUgdmVyaWZpY2F0aW9uIGNyaXRlcmlhLlwiO1xuICAgICAgY29uc3QgdmVyaWZ5Q2hlY2tib3hMYWJlbCA9XG4gICAgICAgIHRvTG9hZC52ZXJpZnljaGVja2JveGxhYmVsICE9IG51bGxcbiAgICAgICAgICA/IFN0cmluZyh0b0xvYWQudmVyaWZ5Y2hlY2tib3hsYWJlbClcbiAgICAgICAgICA6IFwiVGhlIGNvbnRlbnQgaXMgbm90IGFzIGV4cGVjdGVkLiBQbGVhc2UgY2hlY2sgaWYgeW91IHNlbGVjdGVkIHRoZSBjb3JyZWN0IGZpbGUocykuIFlvdSBtYXkgbWFudWFsbHkgdmVyaWZ5IHRoYXQgaXQgaXMgdGhlIGNvcnJlY3Qgb25lIGJ5IGNsaWNraW5nIHRoZSBjaGVja2JveC5cIjtcblxuICAgICAgQUlfTExBTUFfU1RBTkRBUkRfUUEuZW5zdXJlUGRmSnNXb3JrZXJDb25maWd1cmVkKCk7XG4gICAgICAvLyAjZW5kcmVnaW9uIEluaXRpYWxpemUgbW9kZSwgZmlsZXMsIGFuZCBjb25maWcgZnJvbSB0b0xvYWRcbiAgICAgIC8vICNyZWdpb24gUHJvY2VzcyBmaWxlcyAoUERGIG9yIEltYWdlKVxuICAgICAgZm9yIChjb25zdCBmaWxlIG9mIEFycmF5LmZyb20oZmlsZXMpKSB7XG4gICAgICAgIGlmIChmaWxlLnR5cGUgPT09IFwiYXBwbGljYXRpb24vcGRmXCIpIHtcbiAgICAgICAgICBjb25zdCBwcm9jZXNzZWRJbWFnZXMgPSBhd2FpdCBBSV9MTEFNQV9TVEFOREFSRF9RQS5wcm9jZXNzUGRmRmlsZShmaWxlLCBtYXhQYWdlcyk7XG5cbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb2Nlc3NlZEltYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgaW1hZ2VOYW1lID0gYCR7ZmlsZS5uYW1lLnJlcGxhY2UoXCIucGRmXCIsIFwiXCIpfV9wYWdlXyR7aSArIDF9LnBuZ2A7XG4gICAgICAgICAgICBsZXQgaW1hZ2VGaWxlID0gbmV3IEZpbGUoW3Byb2Nlc3NlZEltYWdlc1tpXV0sIGltYWdlTmFtZSwgeyB0eXBlOiBcImltYWdlL3BuZ1wiIH0pO1xuICAgICAgICAgICAgLy8gI3JlZ2lvbiBEb3duc2NhbGUgUERGIHBhZ2UgaWYgaXQgZXhjZWVkcyB0aGUgcGl4ZWwgYnVkZ2V0XG4gICAgICAgICAgICBpZiAobWF4UGl4ZWxTaXplID4gMCkge1xuICAgICAgICAgICAgICBjb25zdCBkb3duc2NhbGVkID0gYXdhaXQgQUlfTExBTUFfU1RBTkRBUkRfUUEuZG93bnNjYWxlSW1hZ2VJZk5lZWRlZChpbWFnZUZpbGUsIG1heFBpeGVsU2l6ZSk7XG5cbiAgICAgICAgICAgICAgaW1hZ2VGaWxlID1cbiAgICAgICAgICAgICAgICBkb3duc2NhbGVkIGluc3RhbmNlb2YgRmlsZVxuICAgICAgICAgICAgICAgICAgPyBkb3duc2NhbGVkXG4gICAgICAgICAgICAgICAgICA6IG5ldyBGaWxlKFtkb3duc2NhbGVkXSwgaW1hZ2VOYW1lLCB7IHR5cGU6IGRvd25zY2FsZWQudHlwZSB8fCBcImltYWdlL3BuZ1wiIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBEb3duc2NhbGUgUERGIHBhZ2UgaWYgaXQgZXhjZWVkcyB0aGUgcGl4ZWwgYnVkZ2V0XG4gICAgICAgICAgICBjb25zdCBkYXRhVXJsID0gYXdhaXQgQUlfTExBTUFfU1RBTkRBUkRfUUEuYmxvYlRvRGF0YVVybChpbWFnZUZpbGUpO1xuXG4gICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoYGNvZGJpLWJhc2U2NDoke2ltYWdlTmFtZX1gLCBkYXRhVXJsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAobWF4UGl4ZWxTaXplID4gMCkge1xuICAgICAgICAgIGNvbnN0IGRvd25zY2FsZWQgPSBhd2FpdCBBSV9MTEFNQV9TVEFOREFSRF9RQS5kb3duc2NhbGVJbWFnZUlmTmVlZGVkKGZpbGUsIG1heFBpeGVsU2l6ZSk7XG4gICAgICAgICAgY29uc3QgZGF0YVVybCA9IGF3YWl0IEFJX0xMQU1BX1NUQU5EQVJEX1FBLmJsb2JUb0RhdGFVcmwoZG93bnNjYWxlZCk7XG5cbiAgICAgICAgICB3aW5kb3cuY29kYmkubG9nKFxuICAgICAgICAgICAgXCJJTkZPXCIsXG4gICAgICAgICAgICBgQXBwZW5kaW5nIGRvd25zY2FsZWQgJyR7ZmlsZS5uYW1lfScgYXMgYmFzZTY0IHBhcmFtOiAke01hdGgucm91bmQoZGF0YVVybC5sZW5ndGggLyAxMDI0KX0gS0JgLFxuICAgICAgICAgICAgXCJBSSAvIExMQU1BIC8gU1REIC8gUUFcIixcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgZm9ybURhdGEuYXBwZW5kKGBjb2RiaS1iYXNlNjQ6JHtmaWxlLm5hbWV9YCwgZGF0YVVybCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgZGF0YVVybCA9IGF3YWl0IEFJX0xMQU1BX1NUQU5EQVJEX1FBLmJsb2JUb0RhdGFVcmwoZmlsZSk7XG5cbiAgICAgICAgICB3aW5kb3cuY29kYmkubG9nKFxuICAgICAgICAgICAgXCJJTkZPXCIsXG4gICAgICAgICAgICBgQXBwZW5kaW5nIG9yaWdpbmFsICcke2ZpbGUubmFtZX0nIGFzIGJhc2U2NCBwYXJhbTogJHtNYXRoLnJvdW5kKGRhdGFVcmwubGVuZ3RoIC8gMTAyNCl9IEtCYCxcbiAgICAgICAgICAgIFwiQUkgLyBMTEFNQSAvIFNURCAvIFFBXCIsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoYGNvZGJpLWJhc2U2NDoke2ZpbGUubmFtZX1gLCBkYXRhVXJsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBQcm9jZXNzIGZpbGVzIChQREYgb3IgSW1hZ2UpXG4gICAgICAvLyAjcmVnaW9uIEJ1aWxkIHJlcXVlc3QgaGVhZGVyc1xuICAgICAgY29uc3QgaGVhZGVyczogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHt9O1xuXG4gICAgICBoZWFkZXJzW1wiWC1TZXNzaW9uLUlkXCJdID0gQUlfTExBTUFfU1RBTkRBUkRfUUEuUEFHRV9TRVNTSU9OX0lEO1xuICAgICAgLy8gI2VuZHJlZ2lvbiBCdWlsZCByZXF1ZXN0IGhlYWRlcnNcbiAgICAgIC8vICNyZWdpb24gRGV0ZXJtaW5lIHVzZXItc2V0IHJvdGF0aW9uXG4gICAgICBpZiAodG9Mb2FkLnJvdGF0aW9uICYmIHRvTG9hZC5yb3RhdGlvbiAhPT0gXCIwXCIgJiYgdG9Mb2FkLnJvdGF0aW9uICE9PSAwKSB7XG4gICAgICAgIGhlYWRlcnNbXCJYLVJvdGF0ZVwiXSA9IHRvTG9hZC5yb3RhdGlvbi50b1N0cmluZygpO1xuXG4gICAgICAgIHdpbmRvdy5jb2RiaS5sb2coXG4gICAgICAgICAgXCJJTkZPXCIsXG4gICAgICAgICAgYFNldHRpbmcgdXNlciBwcm92aWRlZCBpbWFnZSByb3RhdGlvbiB0byAke3RvTG9hZC5yb3RhdGlvbn1cdTAwQjAgdmlhIFgtUm90YXRlIGhlYWRlcmAsXG4gICAgICAgICAgXCJBSSAvIExMQU1BIC8gU1REIC8gUUFcIixcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIC8vICNlbmRyZWdpb24gRGV0ZXJtaW5lIHVzZXItc2V0IHJvdGF0aW9uXG4gICAgICAvLyAjcmVnaW9uIERldGVybWluZSB0aGUgc2VhcmNoIGNvbnRhaW5lclxuICAgICAgY29uc3QgaW1tZWRpYXRlQ1ggPSAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5jbG9zZXN0KFwiLkNYQ29udGFpbmVyXCIpO1xuICAgICAgbGV0IGNvbnRhaW5lcjogRWxlbWVudCB8IG51bGw7XG5cbiAgICAgIGlmIChpbW1lZGlhdGVDWD8uY2xhc3NMaXN0LmNvbnRhaW5zKFwiQUlfTExBTUFfUUFfRXhjbHVkZVwiKSkge1xuICAgICAgICBjb250YWluZXIgPSBpbW1lZGlhdGVDWDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRhaW5lciA9IGltbWVkaWF0ZUNYPy5wYXJlbnRFbGVtZW50Py5jbG9zZXN0KFwiLkNYQ29udGFpbmVyXCIpID8/IGltbWVkaWF0ZUNYO1xuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBEZXRlcm1pbmUgdGhlIHNlYXJjaCBjb250YWluZXJcbiAgICAgIC8vICNyZWdpb24gQWNxdWlyZSBRdWVzdGlvbnNcbiAgICAgIGNvbnN0IGFsbFF1ZXN0aW9uRWxlbWVudHMgPSBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbChcIi5BSV9MTEFNQV9TVEFOREFSRF9RQV9RdWVzdGlvblwiKTtcbiAgICAgIGNvbnN0IHF1ZXN0aW9uRWxlbWVudHM6IEVsZW1lbnRbXSA9IFtdO1xuXG4gICAgICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBhbGxRdWVzdGlvbkVsZW1lbnRzKSB7XG4gICAgICAgIGNvbnN0IGlubmVyQ29udGFpbmVyID0gY2FuZGlkYXRlLmNsb3Nlc3QoXCIuQ1hDb250YWluZXJcIik7XG4gICAgICAgIC8vICNyZWdpb24gT21pdCBxdWVzdGlvbnMgdGhhdCdyZSBpbiBhbiBleGNsdWRlZCBzdWItY29udGFpbmVyLlxuICAgICAgICBpZiAoXG4gICAgICAgICAgaW5uZXJDb250YWluZXIgJiZcbiAgICAgICAgICBpbm5lckNvbnRhaW5lciAhPT0gY29udGFpbmVyICYmXG4gICAgICAgICAgaW5uZXJDb250YWluZXIuY2xhc3NMaXN0LmNvbnRhaW5zKFwiQUlfTExBTUFfUUFfRXhjbHVkZVwiKVxuICAgICAgICApIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyAjZW5kcmVnaW9uIE9taXQgcXVlc3Rpb25zIHRoYXQncmUgaW4gYW4gZXhjbHVkZWQgc3ViLWNvbnRhaW5lci5cbiAgICAgICAgcXVlc3Rpb25FbGVtZW50cy5wdXNoKGNhbmRpZGF0ZSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHZxYUhlYWRlcnM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcblxuICAgICAgdnFhSGVhZGVyc1tcIlgtU2Vzc2lvbi1JZFwiXSA9IEFJX0xMQU1BX1NUQU5EQVJEX1FBLlBBR0VfU0VTU0lPTl9JRDtcbiAgICAgIC8vICNyZWdpb24gRm9yY2VkIHJlc3BvbnNlIGxhbmd1YWdlXG4gICAgICBjb25zdCByZXNwb25zZUxhbmcgPSB0b0xvYWQucmVzcG9uc2VsYW5ndWFnZSAhPSBudWxsID8gU3RyaW5nKHRvTG9hZC5yZXNwb25zZWxhbmd1YWdlKS50cmltKCkgOiBcIlwiO1xuICAgICAgY29uc3Qgc3BlY2lhbGlzdCA9IHRvTG9hZC5zcGVjaWFsaXN0ICE9IG51bGwgPyBTdHJpbmcodG9Mb2FkLnNwZWNpYWxpc3QpLnRyaW0oKSA6IFwiXCI7XG5cbiAgICAgIGlmIChyZXNwb25zZUxhbmcpIHtcbiAgICAgICAgdnFhSGVhZGVyc1tcIlgtRm9yY2VkLUxhbmd1YWdlXCJdID0gcmVzcG9uc2VMYW5nO1xuICAgICAgfVxuICAgICAgaWYgKHNwZWNpYWxpc3QpIHtcbiAgICAgICAgdnFhSGVhZGVyc1tcIlgtU3BlY2lhbGlzdFwiXSA9IHNwZWNpYWxpc3Q7XG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIEZvcmNlZCByZXNwb25zZSBsYW5ndWFnZVxuICAgICAgLy8gI3JlZ2lvbiBCcmF2ZSBTZWFyY2ggYW5kIGdlb2xvY2F0aW9uIHRvZ2dsZXNcbiAgICAgIGNvbnN0IGludGVybmV0QWNjZXNzID0gdG9Mb2FkLkludGVybmV0QWNjZXNzICE9IG51bGwgJiYgU3RyaW5nKHRvTG9hZC5JbnRlcm5ldEFjY2VzcykudG9Mb3dlckNhc2UoKSA9PT0gXCJ0cnVlXCI7XG5cbiAgICAgIHZxYUhlYWRlcnNbXCJYLVNlYXJjaFwiXSA9IGludGVybmV0QWNjZXNzID8gXCJ0cnVlXCIgOiBcImZhbHNlXCI7XG5cbiAgICAgIGlmICh0b0xvYWQuZmlsdGVycmVzdWx0cyAhPSBudWxsKSB7XG4gICAgICAgIHZxYUhlYWRlcnNbXCJYLUZpbHRlci1SZXN1bHRzXCJdID0gU3RyaW5nKHRvTG9hZC5maWx0ZXJyZXN1bHRzKS50b0xvd2VyQ2FzZSgpID09PSBcInRydWVcIiA/IFwidHJ1ZVwiIDogXCJmYWxzZVwiO1xuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBCcmF2ZSBTZWFyY2ggYW5kIGdlb2xvY2F0aW9uIHRvZ2dsZXNcbiAgICAgIC8vICNyZWdpb24gVGhpbmtpbmcgbW9kZSB0b2dnbGVcbiAgICAgIGNvbnN0IHRoaW5raW5nID0gdG9Mb2FkLnRoaW5raW5nICE9IG51bGwgJiYgU3RyaW5nKHRvTG9hZC50aGlua2luZykudG9Mb3dlckNhc2UoKSA9PT0gXCJ0cnVlXCI7XG5cbiAgICAgIHZxYUhlYWRlcnNbXCJYLVRoaW5raW5nXCJdID0gdGhpbmtpbmcgPyBcInRydWVcIiA6IFwiZmFsc2VcIjtcblxuICAgICAgaWYgKHRoaW5raW5nKSB7XG4gICAgICAgIGNvbnN0IGN1c3RvbUJ1ZGdldCA9IHRvTG9hZC5tYXh0aGlua2luZ3Rva2VucyAhPSBudWxsID8gTnVtYmVyKHRvTG9hZC5tYXh0aGlua2luZ3Rva2VucykgOiAwO1xuXG4gICAgICAgIGlmIChjdXN0b21CdWRnZXQgPiAwKSB7XG4gICAgICAgICAgdnFhSGVhZGVyc1tcIlgtTWF4LVRoaW5raW5nLVRva2Vuc1wiXSA9IFN0cmluZyhjdXN0b21CdWRnZXQpO1xuICAgICAgICB9IGVsc2UgaWYgKG1vZGUgPT09IFwidmVyaWZ5XCIpIHtcbiAgICAgICAgICB2cWFIZWFkZXJzW1wiWC1NYXgtVGhpbmtpbmctVG9rZW5zXCJdID0gXCI1MTJcIjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBUaGlua2luZyBtb2RlIHRvZ2dsZVxuICAgICAgLy8gI3JlZ2lvbiBEZXRlcm1pbmUgbG9jYXRpb24sIGlmIHJlcXVlc3RlZCwgYW5kIGFkZCB0byBoZWFkZXJzXG4gICAgICBpZiAodG9Mb2FkLmxvY2F0aW9uICE9IG51bGwgJiYgU3RyaW5nKHRvTG9hZC5sb2NhdGlvbikudG9Mb3dlckNhc2UoKSA9PT0gXCJ0cnVlXCIpIHtcbiAgICAgICAgdnFhSGVhZGVyc1tcIlgtTG9jYXRpb25cIl0gPSBcInRydWVcIjtcblxuICAgICAgICBpZiAobmF2aWdhdG9yLmdlb2xvY2F0aW9uKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vICNyZWdpb24gQWNxdWlyZSBwb3NpdGlvblxuICAgICAgICAgICAgY29uc3QgcG9zID0gYXdhaXQgbmV3IFByb21pc2U8R2VvbG9jYXRpb25Qb3NpdGlvbj4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKHJlc29sdmUsIHJlamVjdCwge1xuICAgICAgICAgICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeTogZmFsc2UsXG4gICAgICAgICAgICAgICAgdGltZW91dDogNTAwMCxcbiAgICAgICAgICAgICAgICBtYXhpbXVtQWdlOiAzMDBfMDAwLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBBY3F1aXJlIHBvc2l0aW9uXG4gICAgICAgICAgICB2cWFIZWFkZXJzW1wiWC1MYXRpdHVkZVwiXSA9IHBvcy5jb29yZHMubGF0aXR1ZGUudG9GaXhlZCg0KTtcbiAgICAgICAgICAgIHZxYUhlYWRlcnNbXCJYLUxvbmdpdHVkZVwiXSA9IHBvcy5jb29yZHMubG9uZ2l0dWRlLnRvRml4ZWQoNCk7XG5cbiAgICAgICAgICAgIHdpbmRvdy5jb2RiaS5sb2coXG4gICAgICAgICAgICAgIFwiSU5GT1wiLFxuICAgICAgICAgICAgICBgR2VvbG9jYXRpb246ICR7dnFhSGVhZGVyc1tcIlgtTGF0aXR1ZGVcIl19LCAke3ZxYUhlYWRlcnNbXCJYLUxvbmdpdHVkZVwiXX1gLFxuICAgICAgICAgICAgICBcIkFJIC8gTExBTUEgLyBTVEQgLyBRQVwiLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGNhdGNoIChnZW9FcnIpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jb2RiaS5sb2coXCJXQVJOSU5HXCIsIGBHZW9sb2NhdGlvbiB1bmF2YWlsYWJsZTogJHtnZW9FcnJ9YCwgXCJBSSAvIExMQU1BIC8gU1REIC8gUUFcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIERldGVybWluZSBsb2NhdGlvbiwgaWYgcmVxdWVzdGVkLCBhbmQgYWRkIHRvIGhlYWRlcnNcbiAgICAgIC8vICNlbmRyZWdpb24gQnJhdmUgU2VhcmNoIGFuZCBnZW9sb2NhdGlvbiB0b2dnbGVzXG4gICAgICAvLyAjcmVnaW9uIFJlc29sdmUgdmVyaWZ5LW1vZGUgcXVlc3Rpb24gb3IgY29sbGVjdCBxdWVzdGlvbiBoZWFkZXJzXG4gICAgICBsZXQgdmVyaWZ5RmllbGRJZDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgICBsZXQgdmVyaWZ5RmllbGRRdWVzdGlvbjogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgICAvLyAjcmVnaW9uIFZlcmlmaWNhdGlvbi1Nb2RlLiBJZiBtb2RlIGlzIHZlcmlmeSBhbmQgdGhlIHVwbG9hZCBmaWVsZCBoYXMgYSBkYXRhLWNiLVF1ZXN0aW9uLCB1c2Ugb25seSB0aGF0IHF1ZXN0aW9uLlxuICAgICAgaWYgKG1vZGUgPT09IFwidmVyaWZ5XCIpIHtcbiAgICAgICAgdmVyaWZ5RmllbGRJZCA9IHRvUHJvY2Vzcy5nZXRBdHRyaWJ1dGUoXCJpZFwiKTtcbiAgICAgICAgdmVyaWZ5RmllbGRRdWVzdGlvbiA9IHRvUHJvY2Vzcy5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNiLVF1ZXN0aW9uXCIpO1xuXG4gICAgICAgIGlmICh2ZXJpZnlGaWVsZElkICYmIHZlcmlmeUZpZWxkUXVlc3Rpb24pIHtcbiAgICAgICAgICAvLyAjcmVnaW9uIFJlc29sdmUgc3ltYm9scyBpbiB0aGUgdmVyaWZ5IHF1ZXN0aW9uXG4gICAgICAgICAgdmVyaWZ5RmllbGRRdWVzdGlvbiA9IHZlcmlmeUZpZWxkUXVlc3Rpb24ucmVwbGFjZSgvPFxcWyhbXlxcXV0rKVxcXT4vZywgKG1hdGNoLCBpZGVudGlmaWVyKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0cmltbWVkID0gaWRlbnRpZmllci50cmltKCk7XG4gICAgICAgICAgICBjb25zdCBmaWVsZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke3RyaW1tZWR9YCkgYXMgSFRNTElucHV0RWxlbWVudCB8IG51bGw7XG4gICAgICAgICAgICBpZiAoZmllbGQgJiYgXCJ2YWx1ZVwiIGluIGZpZWxkKSB7XG4gICAgICAgICAgICAgIHJldHVybiBmaWVsZC52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtYXRjaDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uIFJlc29sdmUgc3ltYm9scyBpbiB0aGUgdmVyaWZ5IHF1ZXN0aW9uXG4gICAgICAgICAgdnFhSGVhZGVyc1tgWC1RdWVzdGlvbi0ke3ZlcmlmeUZpZWxkSWR9YF0gPSB2ZXJpZnlGaWVsZFF1ZXN0aW9uO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIFZlcmlmaWNhdGlvbi1Nb2RlLiBJZiBtb2RlIGlzIHZlcmlmeSBhbmQgdGhlIHVwbG9hZCBmaWVsZCBoYXMgYSBkYXRhLWNiLVF1ZXN0aW9uLCB1c2Ugb25seSB0aGF0IHF1ZXN0aW9uLlxuICAgICAgLy8gI3JlZ2lvbiBDb2xsZWN0IHF1ZXN0aW9uIGhlYWRlcnMgc2luY2Ugbm90IGluIHZlcmlmeS1tb2RlIG9yIHZlcmlmeSBxdWVzdGlvbiBpcyBpbmNvbXBsZXRlLlxuICAgICAgaWYgKCEobW9kZSA9PT0gXCJ2ZXJpZnlcIiAmJiB2ZXJpZnlGaWVsZElkICYmIHZlcmlmeUZpZWxkUXVlc3Rpb24pKSB7XG4gICAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBxdWVzdGlvbkVsZW1lbnRzKSB7XG4gICAgICAgICAgY29uc3QgaWQgPSBlbGVtZW50LmlkO1xuICAgICAgICAgIGxldCBxdWVzdGlvbiA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiZGF0YS1jYi1RdWVzdGlvblwiKTtcblxuICAgICAgICAgIGlmIChpZCAmJiBxdWVzdGlvbikge1xuICAgICAgICAgICAgLy8gI3JlZ2lvbiBSZXNvbHZlIHN5bWJvbHMgaW4gdGhlIHZlcmlmeSBxdWVzdGlvblxuICAgICAgICAgICAgcXVlc3Rpb24gPSBxdWVzdGlvbi5yZXBsYWNlKC88XFxbKFteXFxdXSspXFxdPi9nLCAobWF0Y2gsIGlkZW50aWZpZXIpID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgdHJpbW1lZCA9IGlkZW50aWZpZXIudHJpbSgpO1xuICAgICAgICAgICAgICBjb25zdCBmaWVsZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke3RyaW1tZWR9YCkgYXMgSFRNTElucHV0RWxlbWVudCB8IG51bGw7XG5cbiAgICAgICAgICAgICAgaWYgKGZpZWxkICYmIFwidmFsdWVcIiBpbiBmaWVsZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZC52YWx1ZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHJldHVybiBtYXRjaDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBSZXNvbHZlIHN5bWJvbHMgaW4gdGhlIHZlcmlmeSBxdWVzdGlvblxuICAgICAgICAgICAgdnFhSGVhZGVyc1tgWC1RdWVzdGlvbi0ke2lkfWBdID0gcXVlc3Rpb247XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghaWQpIHtcbiAgICAgICAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcbiAgICAgICAgICAgICAgICBcIldBUk5JTkdcIixcbiAgICAgICAgICAgICAgICBgUXVlc3Rpb24gZWxlbWVudCBvbWl0dGVkIGNhdXNlIG9mIG1pc3NpbmcgaWQgYXR0cmlidXRlIGluOiAke2VsZW1lbnQub3V0ZXJIVE1MfWAsXG4gICAgICAgICAgICAgICAgXCJBSSAvIExMQU1BIC8gU1REIC8gUUFcIixcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghcXVlc3Rpb24pIHtcbiAgICAgICAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcbiAgICAgICAgICAgICAgICBcIldBUk5JTkdcIixcbiAgICAgICAgICAgICAgICBgUXVlc3Rpb24gZWxlbWVudCBvbWl0dGVkIGNhdXNlIG9mIG1pc3NpbmcgZGF0YS1jYi1RdWVzdGlvbiBhdHRyaWJ1dGUgaW46ICR7ZWxlbWVudC5vdXRlckhUTUx9YCxcbiAgICAgICAgICAgICAgICBcIkFJIC8gTExBTUEgLyBTVEQgLyBRQVwiLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBDb2xsZWN0IHF1ZXN0aW9uIGhlYWRlcnMgc2luY2Ugbm90IGluIHZlcmlmeS1tb2RlIG9yIHZlcmlmeSBxdWVzdGlvbiBpcyBpbmNvbXBsZXRlLlxuICAgICAgLy8gI2VuZHJlZ2lvbiBSZXNvbHZlIHZlcmlmeS1tb2RlIHF1ZXN0aW9uIG9yIGNvbGxlY3QgcXVlc3Rpb24gaGVhZGVyc1xuICAgICAgLy8gI2VuZHJlZ2lvbiBBY3F1aXJlIFF1ZXN0aW9uc1xuICAgICAgLy8gI3JlZ2lvbiBJZiBhbnkgVlFBIHF1ZXN0aW9ucywgY2FsbCBWUUEgYWN0aW9uIGFzIGJlZm9yZVxuICAgICAgaWYgKE9iamVjdC5rZXlzKHZxYUhlYWRlcnMpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gI3JlZ2lvbiBEaXNhYmxlIGlucHV0IGFuZCBzaG93IGxvYWRpbmcgYW5pbWF0aW9uXG4gICAgICAgIGNvbnN0IHRzVG9Qcm9jZXNzID0gdG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50O1xuXG4gICAgICAgIHRzVG9Qcm9jZXNzLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcIm5vbmVcIjtcbiAgICAgICAgdHNUb1Byb2Nlc3Muc3R5bGUub3BhY2l0eSA9IFwiMC41XCI7XG5cbiAgICAgICAgd2luZG93LmNvZGJpLmluamVjdExvYWRpbmdBbmltKHRvUHJvY2Vzcyk7XG5cbiAgICAgICAgY29uc3QgdXBsb2FkTGFiZWwgPSB0c1RvUHJvY2Vzcy5wYXJlbnRFbGVtZW50Py5xdWVyeVNlbGVjdG9yKFwibGFiZWxcIikgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgICAgICBjb25zdCB1cGxvYWRGb3JtZXJUZXh0ID0gdXBsb2FkTGFiZWwgPyB1cGxvYWRMYWJlbC5pbm5lckhUTUwgOiBcIlwiO1xuXG4gICAgICAgIGlmICh1cGxvYWRMYWJlbCkge1xuICAgICAgICAgIHVwbG9hZExhYmVsLmlubmVySFRNTCA9IGAke3VwbG9hZEZvcm1lclRleHR9XG4gICAgICAgICAgICA8c3R5bGU+XG4gICAgICAgICAgICAgIEBrZXlmcmFtZXMgaGlnaGxpZ2h0IHtcbiAgICAgICAgICAgICAgICAwJSAgICB7IG9wYWNpdHk6MTsgfVxuICAgICAgICAgICAgICAgIDUwJSAgIHsgb3BhY2l0eTowOyB9XG4gICAgICAgICAgICAgICAgMTAwJSAgeyBvcGFjaXR5OjE7IH19XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAuTExBTUFfUHJvY2Vzc2luZyB7IGZvbnQtd2VpZ2h0OiBib2xkIDsgY29sb3I6IGRhcmtvcmFuZ2UgOyBhbmltYXRpb246IGhpZ2hsaWdodCAycyBlYXNlLWluLW91dCBpbmZpbml0ZSA7fTwvc3R5bGU+XG5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzID0gXCJMTEFNQV9Qcm9jZXNzaW5nXCI+UHJvY2Vzc2luZy4uLjwvc3Bhbj5gO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcXVlc3Rpb25MYWJlbERhdGE6IE1hcDxIVE1MRWxlbWVudCwgc3RyaW5nPiA9IG5ldyBNYXAoKTtcbiAgICAgICAgLy8gI3JlZ2lvbiBJbiB2ZXJpZnkgbW9kZSwgb25seSB0aGUgdXBsb2FkIGZpZWxkJ3Mgb3duIHF1ZXN0aW9uIGlzIHNlbnQgc28gbm8gYW5pbWF0aW9uLlxuICAgICAgICBpZiAoIShtb2RlID09PSBcInZlcmlmeVwiICYmIHZlcmlmeUZpZWxkSWQgJiYgdmVyaWZ5RmllbGRRdWVzdGlvbikpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgcXVlc3Rpb25FbGVtZW50cykge1xuICAgICAgICAgICAgbGV0IGxhYmVsUGFyZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50O1xuXG4gICAgICAgICAgICAvLyBhdHRhY2hBaUhpbnQgLyBXaGlzcGVyIHdyYXAgdGhlIGZpZWxkIFx1MjAxNCBza2lwIHdyYXBwZXIocykgdG8gcmVhY2ggdGhlIHJlYWwgY29udGFpbmVyIHdpdGggdGhlIGxhYmVsLlxuICAgICAgICAgICAgd2hpbGUgKFxuICAgICAgICAgICAgICBsYWJlbFBhcmVudD8uY2xhc3NMaXN0LmNvbnRhaW5zKFwiTExBTUFfQUlfSGludF9XcmFwcGVyXCIpIHx8XG4gICAgICAgICAgICAgIGxhYmVsUGFyZW50Py5jbGFzc0xpc3QuY29udGFpbnMoXCJNRURJQV9XaGlzcGVyX0lucHV0V3JhcHBlclwiKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGxhYmVsUGFyZW50ID0gbGFiZWxQYXJlbnQucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcXVlc3Rpb25MYWJlbCA9IGxhYmVsUGFyZW50Py5xdWVyeVNlbGVjdG9yKFwibGFiZWxcIikgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuXG4gICAgICAgICAgICBpZiAocXVlc3Rpb25MYWJlbCkge1xuICAgICAgICAgICAgICBjb25zdCBvcmlnaW5hbFRleHQgPSBxdWVzdGlvbkxhYmVsLmlubmVySFRNTDtcbiAgICAgICAgICAgICAgcXVlc3Rpb25MYWJlbERhdGEuc2V0KHF1ZXN0aW9uTGFiZWwsIG9yaWdpbmFsVGV4dCk7XG4gICAgICAgICAgICAgIHF1ZXN0aW9uTGFiZWwuaW5uZXJIVE1MID0gYCR7b3JpZ2luYWxUZXh0fVxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzID0gXCJMTEFNQV9Qcm9jZXNzaW5nXCI+UHJvY2Vzc2luZy4uLjwvc3Bhbj5gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyAjZW5kcmVnaW9uIEluIHZlcmlmeSBtb2RlLCBvbmx5IHRoZSB1cGxvYWQgZmllbGQncyBvd24gcXVlc3Rpb24gaXMgc2VudCBzbyBubyBhbmltYXRpb24uXG4gICAgICAgIC8vICNyZWdpb24gRGlzYWJsZSBhbnN3ZXIgZmllbGRzIGR1cmluZyBpbmZlcmVuY2UuXG4gICAgICAgIGNvbnN0IGRpc2FibGVkRmllbGRzOiBIVE1MSW5wdXRFbGVtZW50W10gPSBbXTtcblxuICAgICAgICBpZiAoIShtb2RlID09PSBcInZlcmlmeVwiICYmIHZlcmlmeUZpZWxkSWQgJiYgdmVyaWZ5RmllbGRRdWVzdGlvbikpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgcXVlc3Rpb25FbGVtZW50cykge1xuICAgICAgICAgICAgY29uc3QgZmllbGQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjJHtlbGVtZW50LmlkfWApIGFzIEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsO1xuXG4gICAgICAgICAgICBpZiAoZmllbGQpIHtcbiAgICAgICAgICAgICAgZmllbGQuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICBmaWVsZC5zdHlsZS5vcGFjaXR5ID0gXCIwLjVcIjtcblxuICAgICAgICAgICAgICBkaXNhYmxlZEZpZWxkcy5wdXNoKGZpZWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBEaXNhYmxlIGFuc3dlciBmaWVsZHMgZHVyaW5nIGluZmVyZW5jZS5cbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBEaXNhYmxlIGlucHV0IGFuZCBzaG93IGxvYWRpbmcgYW5pbWF0aW9uXG4gICAgICAgIC8vICNyZWdpb24gRGVmaW5lIGhvdyB0byByZW1vdmUgdGhlIGxvYWRpbmcgYW5pbWF0aW9uIGFuZCByZXN0b3JlIGxhYmVsc1xuICAgICAgICBjb25zdCB1bmFuaW1hdGUgPSAoKSA9PiB7XG4gICAgICAgICAgd2luZG93LmNvZGJpLnJlbW92ZUxvYWRlckFuaW0odG9Qcm9jZXNzKTtcblxuICAgICAgICAgIHRzVG9Qcm9jZXNzLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcImFsbFwiO1xuICAgICAgICAgIHRzVG9Qcm9jZXNzLnN0eWxlLm9wYWNpdHkgPSBcIjFcIjtcblxuICAgICAgICAgIGlmICh1cGxvYWRMYWJlbCkge1xuICAgICAgICAgICAgdXBsb2FkTGFiZWwuaW5uZXJIVE1MID0gdXBsb2FkRm9ybWVyVGV4dDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gUmVzdG9yZSBhbGwgcXVlc3Rpb24gbGFiZWxzXG4gICAgICAgICAgZm9yIChjb25zdCBbbGFiZWwsIG9yaWdpbmFsVGV4dF0gb2YgcXVlc3Rpb25MYWJlbERhdGEuZW50cmllcygpKSB7XG4gICAgICAgICAgICBsYWJlbC5pbm5lckhUTUwgPSBvcmlnaW5hbFRleHQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFJlLWVuYWJsZSBhbnN3ZXIgZmllbGRzXG4gICAgICAgICAgZm9yIChjb25zdCBmaWVsZCBvZiBkaXNhYmxlZEZpZWxkcykge1xuICAgICAgICAgICAgZmllbGQuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGZpZWxkLnN0eWxlLm9wYWNpdHkgPSBcIjFcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vICNlbmRyZWdpb24gRGVmaW5lIGhvdyB0byByZW1vdmUgdGhlIGxvYWRpbmcgYW5pbWF0aW9uIGFuZCByZXN0b3JlIGxhYmVsc1xuICAgICAgICAvLyAjcmVnaW9uIENvbnRhY3QgTExBTUEtU2VydmVyIHZpYSBBSkFYXG4gICAgICAgIC8vICNyZWdpb24gUXVldWUgYmFkZ2UgY29uZmlndXJhdGlvbi5cbiAgICAgICAgY29uc3QgcWFRdWV1ZU92ZXJyaWRlOiBib29sZWFuIHwgbnVsbCA9XG4gICAgICAgICAgdG9Mb2FkLnF1ZXVlYmFkZ2UgIT0gbnVsbCA/IFN0cmluZyh0b0xvYWQucXVldWViYWRnZSkgIT09IFwiZmFsc2VcIiA6IG51bGw7XG4gICAgICAgIGNvbnN0IHFhUXVldWVUZXh0OiBzdHJpbmcgPSB0b0xvYWQucXVldWV0ZXh0ICE9IG51bGwgPyBTdHJpbmcodG9Mb2FkLnF1ZXVldGV4dCkgOiBcIlwiO1xuICAgICAgICBsZXQgcWFRdWV1ZUJhZGdlRWw6IEhUTUxTcGFuRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGNvbnN0IHNob3dRYVF1ZXVlQmFkZ2UgPSAocG9zaXRpb246IG51bWJlciwgZXN0aW1hdGVkV2FpdE1zPzogbnVtYmVyIHwgbnVsbCkgPT4ge1xuICAgICAgICAgIGlmICghcWFRdWV1ZUJhZGdlRWwpIHtcbiAgICAgICAgICAgIHFhUXVldWVCYWRnZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgICAgICBxYVF1ZXVlQmFkZ2VFbC5jbGFzc05hbWUgPSBcIkxMQU1BX1F1ZXVlQmFkZ2VcIjtcbiAgICAgICAgICAgIHFhUXVldWVCYWRnZUVsLnN0eWxlLmNzc1RleHQgPVxuICAgICAgICAgICAgICBcImRpc3BsYXk6aW5saW5lLWZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo0cHg7bWFyZ2luLWxlZnQ6NnB4O3BhZGRpbmc6MnB4IDhweDtib3JkZXItcmFkaXVzOjEwcHg7YmFja2dyb3VuZDojZDBlMGZmO2NvbG9yOiMxYTVhYWI7Zm9udC1zaXplOjEycHg7Zm9udC13ZWlnaHQ6NjAwO3doaXRlLXNwYWNlOm5vd3JhcDtcIjtcbiAgICAgICAgICAgIHVwbG9hZExhYmVsPy5hcHBlbmRDaGlsZChxYVF1ZXVlQmFkZ2VFbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHdhaXRMYWJlbCA9IGZvcm1hdFdhaXRUaW1lKGVzdGltYXRlZFdhaXRNcyk7XG4gICAgICAgICAgcWFRdWV1ZUJhZGdlRWwudGV4dENvbnRlbnQgPSBgJHtwb3NpdGlvbn0ke3dhaXRMYWJlbCA/IGAgJHt3YWl0TGFiZWx9YCA6IFwiXCJ9JHtxYVF1ZXVlVGV4dCA/IGAgJHtxYVF1ZXVlVGV4dH1gIDogXCJcIn1gO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGhpZGVRYVF1ZXVlQmFkZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgcWFRdWV1ZUJhZGdlRWw/LnJlbW92ZSgpO1xuICAgICAgICAgIHFhUXVldWVCYWRnZUVsID0gbnVsbDtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBRdWV1ZSBiYWRnZSBjb25maWd1cmF0aW9uLlxuICAgICAgICBsZXQgcWFRdWV1ZVRpY2tldDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgY29uc3Qgc2VuZFFhUmVxdWVzdCA9ICgpID0+IHtcbiAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiBgJHt3aW5kb3cuY29kYmkuYmFzZVVSTH1wbHVnaW4/bmFtZT1Db2RCaV9BSV9MTEFNQV9TVERgLFxuICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXG4gICAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcbiAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZSxcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgIGJlZm9yZVNlbmQ6ICh4aHIpID0+IHtcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBoZWFkZXJOYW1lIG9mIE9iamVjdC5rZXlzKHZxYUhlYWRlcnMpKSB7XG4gICAgICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoaGVhZGVyTmFtZSwgdnFhSGVhZGVyc1toZWFkZXJOYW1lXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHFhUXVldWVUaWNrZXQpIHtcbiAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIlgtUXVldWUtVGlja2V0XCIsIHFhUXVldWVUaWNrZXQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3VjY2VzczogKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChyZXNwb25zZS5xdWV1ZWQpIHtcbiAgICAgICAgICAgICAgICBxYVF1ZXVlVGlja2V0ID0gcmVzcG9uc2UucXVldWVUaWNrZXQgPz8gcWFRdWV1ZVRpY2tldDtcbiAgICAgICAgICAgICAgICBjb25zdCBiYWRnZUVuYWJsZWQgPSBxYVF1ZXVlT3ZlcnJpZGUgIT0gbnVsbCA/IHFhUXVldWVPdmVycmlkZSA6ICEhcmVzcG9uc2UucXVldWVCYWRnZTtcbiAgICAgICAgICAgICAgICBpZiAoYmFkZ2VFbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICBzaG93UWFRdWV1ZUJhZGdlKHJlc3BvbnNlLnBvc2l0aW9uID8/IDAsIHJlc3BvbnNlLmVzdGltYXRlZFdhaXRNcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoc2VuZFFhUmVxdWVzdCwgMTAwMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGhpZGVRYVF1ZXVlQmFkZ2UoKTtcbiAgICAgICAgICAgICAgdW5hbmltYXRlKCk7XG4gICAgICAgICAgICAgIC8vICNyZWdpb24gRGlzcGxheSBlcnJvciBpZiByZXF1ZXN0IGZhaWxlZC5cbiAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcIkVSUk9SXCIsIGBSRVNUIGZhaWxlZCB3aXRoOiAke3Jlc3BvbnNlLmVycm9yfWAsIFwiQUkgLyBMTEFNQSAvIFFBXCIpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gRGlzcGxheSBlcnJvciBpZiByZXF1ZXN0IGZhaWxlZC5cbiAgICAgICAgICAgICAgaWYgKG1vZGUgPT09IFwidmVyaWZ5XCIgJiYgdmVyaWZ5RmllbGRJZCAmJiB2ZXJpZnlGaWVsZFF1ZXN0aW9uKSB7XG4gICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBWZXJpZnkgbW9kZSBcdTIwMTQgY2hlY2sgQUkgYW5zd2VyIGFuZCBzaG93IGVycm9yIG9yIGFjY2VwdFxuICAgICAgICAgICAgICAgIC8vICNyZWdpb24gQ29udHJhY3QgY2hlY2tpbmcuXG4gICAgICAgICAgICAgICAgY29uc3QgYW5zd2VyID0gVFlQRS50c0NoZWNrPHN0cmluZz4ocmVzcG9uc2VbdmVyaWZ5RmllbGRJZF0uYW5zd2VyLCBcInN0cmluZ1wiKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZCA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTElucHV0RWxlbWVudD4oXG4gICAgICAgICAgICAgICAgICBERUZJTkVELnRzQ2hlY2soZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgIyR7dmVyaWZ5RmllbGRJZH1gKSksXG4gICAgICAgICAgICAgICAgICBIVE1MSW5wdXRFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgXCJJcyBpdCBub3QgYW4gPGlucHV0PiB0aGF0IGlzIHRhZ2dlZCB3aXRoIHRoaXMgZnVuY3Rpb25hbGl0eT9cIixcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLmdldEF0dHJpYnV0ZShcInR5cGVcIikgIT09IFwiZmlsZVwiKSB7XG4gICAgICAgICAgICAgICAgICB3aW5kb3cuY29kYmkubG9nKFxuICAgICAgICAgICAgICAgICAgICBcIkVSUk9SXCIsXG4gICAgICAgICAgICAgICAgICAgIGBWZXJpZmljYXRpb24gZmllbGQgIyR7dmVyaWZ5RmllbGRJZH0gaXMgbm90IGFuIDxpbnB1dCB0eXBlPVwiZmlsZVwiPmAsXG4gICAgICAgICAgICAgICAgICAgIFwiQUkgLyBMTEFNQSAvIFNURCAvIFFBXCIsXG4gICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gQ29udHJhY3QgY2hlY2tpbmcuXG4gICAgICAgICAgICAgICAgaWYgKChjYXNlSW5zZW5zaXRpdmUgPyBhbnN3ZXIudHJpbSgpLnRvTG93ZXJDYXNlKCkgOiBhbnN3ZXIudHJpbSgpKSA9PT0gcG9zaXRpdmVSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBSZW1vdmUgYW55IGVycm9yL2NoZWNrYm94IGlmIHByZXNlbnQuXG4gICAgICAgICAgICAgICAgICAkKHRvUHJvY2VzcykuZXJyb3IoXCJcIik7XG5cbiAgICAgICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nTWFudWFsVmVyaWZ5ID1cbiAgICAgICAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQ/LnBhcmVudEVsZW1lbnQ/LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuTExBTUFfQUlfTWFudWFsVmVyaWZ5XCIpO1xuXG4gICAgICAgICAgICAgICAgICBpZiAoZXhpc3RpbmdNYW51YWxWZXJpZnkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBleGlzdGluZ01hbnVhbFZlcmlmeS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nTWFudWFsVmVyaWZ5W2ldLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIFJlbW92ZSBhbnkgZXJyb3IvY2hlY2tib3ggaWYgcHJlc2VudC5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgJCh0b1Byb2Nlc3MpLmVycm9yKHZlcmlmeUVycm9yVGV4dCk7XG4gICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIEFkZCBzdHlsZXMgZm9yIG1hbnVhbCB2ZXJpZmljYXRpb24gY2hlY2tib3hcbiAgICAgICAgICAgICAgICAgIGlmICghZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNMTEFNQV9BSV9NYW51YWxWZXJpZnlfU3R5bGVzXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlLmlkID0gXCJMTEFNQV9BSV9NYW51YWxWZXJpZnlfU3R5bGVzXCI7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gYFxuICAgICAgICAgICAgICAgICAgICAuTExBTUFfQUlfTWFudWFsVmVyaWZ5IHsgZGlzcGxheTogZmxleCA7IGFsaWduLWl0ZW1zOiBjZW50ZXIgOyBtYXJnaW4tdG9wOiA4cHggOyBnYXA6IDhweCA7XG4gICAgICAgICAgICAgICAgICAgICAgZmxleC13cmFwOiBub3dyYXAgO31cbiAgICAgICAgICAgICAgICAgICAgLkxMQU1BX0FJX01hbnVhbFZlcmlmeV9DaGVja2JveCB7IGN1cnNvcjogcG9pbnRlciA7IG9wYWNpdHk6IDEgIWltcG9ydGFudCA7IHBvc2l0aW9uOiByZWxhdGl2ZSAhaW1wb3J0YW50IDtcbiAgICAgICAgICAgICAgICAgICAgICBmbGV4LXNocmluazogMCA7fVxuICAgICAgICAgICAgICAgICAgICAuTExBTUFfQUlfTWFudWFsVmVyaWZ5IGxhYmVsIHsgbWFyZ2luLWJvdHRvbTogMCA7IHBvc2l0aW9uOiByZWxhdGl2ZSAhaW1wb3J0YW50IDt9YDtcblxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gQWRkIHN0eWxlcyBmb3IgbWFudWFsIHZlcmlmaWNhdGlvbiBjaGVja2JveFxuICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGV4aXN0aW5nXG4gICAgICAgICAgICAgICAgICBjb25zdCBleGlzdGluZ01hbnVhbFZlcmlmeSA9XG4gICAgICAgICAgICAgICAgICAgIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50Py5wYXJlbnRFbGVtZW50Py5xdWVyeVNlbGVjdG9yQWxsKFwiLkxMQU1BX0FJX01hbnVhbFZlcmlmeVwiKTtcblxuICAgICAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nTWFudWFsVmVyaWZ5KSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXhpc3RpbmdNYW51YWxWZXJpZnkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICBleGlzdGluZ01hbnVhbFZlcmlmeVtpXS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLy8gQWRkIGNoZWNrYm94XG4gICAgICAgICAgICAgICAgICBjb25zdCBjaGVja2JveENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICAgICAgICBjb25zdCBjaGVja2JveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxhYmVsXCIpO1xuXG4gICAgICAgICAgICAgICAgICBjaGVja2JveENvbnRhaW5lci5jbGFzc05hbWUgPSBcIkxMQU1BX0FJX01hbnVhbFZlcmlmeVwiO1xuICAgICAgICAgICAgICAgICAgY2hlY2tib3gudHlwZSA9IFwiY2hlY2tib3hcIjtcbiAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmlkID0gYG1hbnVhbC12ZXJpZnktJHt0b1Byb2Nlc3MuaWR9YDtcbiAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmNsYXNzTmFtZSA9IFwiTExBTUFfQUlfTWFudWFsVmVyaWZ5X0NoZWNrYm94XCI7XG4gICAgICAgICAgICAgICAgICBsYWJlbC5odG1sRm9yID0gY2hlY2tib3guaWQ7XG4gICAgICAgICAgICAgICAgICBsYWJlbC50ZXh0Q29udGVudCA9IHZlcmlmeUNoZWNrYm94TGFiZWw7XG5cbiAgICAgICAgICAgICAgICAgIGNoZWNrYm94Q29udGFpbmVyLmFwcGVuZENoaWxkKGNoZWNrYm94KTtcbiAgICAgICAgICAgICAgICAgIGNoZWNrYm94Q29udGFpbmVyLmFwcGVuZENoaWxkKGxhYmVsKTtcbiAgICAgICAgICAgICAgICAgIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50Py5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJhZnRlcmVuZFwiLCBjaGVja2JveENvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoZWNrYm94LmNoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAkKHRvUHJvY2VzcykuZXJyb3IoXCJcIik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgJCh0b1Byb2Nlc3MpLmVycm9yKHZlcmlmeUVycm9yVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIFZlcmlmeSBtb2RlIFx1MjAxNCBjaGVjayBBSSBhbnN3ZXIgYW5kIHNob3cgZXJyb3Igb3IgYWNjZXB0XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBOb3JtYWwgbW9kZSBcdTIwMTQgcG9wdWxhdGUgYW5zd2VyIGZpZWxkc1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcXVlc3Rpb25JZCBpbiByZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgYW5zd2VyVGV4dCA9IHJlc3BvbnNlW3F1ZXN0aW9uSWRdPy5hbnN3ZXI7XG5cbiAgICAgICAgICAgICAgICAgIGlmIChhbnN3ZXJUZXh0ID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gSU5TVEFOQ0UudHNDaGVjazxIVE1MSW5wdXRFbGVtZW50PihcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgIyR7cXVlc3Rpb25JZH1gKSxcbiAgICAgICAgICAgICAgICAgICAgSFRNTElucHV0RWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgIGZpZWxkLnZhbHVlID0gYW5zd2VyVGV4dDtcblxuICAgICAgICAgICAgICAgICAgaWYgKGFpSGludFRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgQUlfTExBTUFfU1RBTkRBUkRfUUEuYXR0YWNoQWlIaW50KGZpZWxkLCBhaUhpbnRUZXh0KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC8vIERpc3BhdGNoIGNoYW5nZSBldmVudCBhZnRlciBzZXR0aW5nIHZhbHVlXG4gICAgICAgICAgICAgICAgICBjb25zdCBldmVudCA9IG5ldyBFdmVudChcImNoYW5nZVwiLCB7IGJ1YmJsZXM6IHRydWUgfSk7XG5cbiAgICAgICAgICAgICAgICAgIGZpZWxkLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIE5vcm1hbCBtb2RlIFx1MjAxNCBwb3B1bGF0ZSBhbnN3ZXIgZmllbGRzXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogKHhociwgc3RhdHVzLCBlcnJvcikgPT4ge1xuICAgICAgICAgICAgICBoaWRlUWFRdWV1ZUJhZGdlKCk7XG4gICAgICAgICAgICAgIHVuYW5pbWF0ZSgpO1xuICAgICAgICAgICAgICB3aW5kb3cuY29kYmkubG9nKFxuICAgICAgICAgICAgICAgIFwiRVJST1JcIixcbiAgICAgICAgICAgICAgICBgUkVTVCBmYWlsZWQgd2l0aCBzdGF0dXMgXCIke3N0YXR1c31cIiBjYXVzZTogXCIke2Vycm9yfVwiYCxcbiAgICAgICAgICAgICAgICBcIkFJIC8gTExBTUEgLyBTVEQgLyBRQVwiLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgc2VuZFFhUmVxdWVzdCgpO1xuICAgICAgICAvLyAjZW5kcmVnaW9uIENvbnRhY3QgTExBTUEtU2VydmVyIHZpYSBBSkFYXG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIElmIGFueSBWUUEgcXVlc3Rpb25zLCBjYWxsIFZRQSBhY3Rpb24gYXMgYmVmb3JlXG4gICAgfSk7XG4gIH1cbiAgLy8gI3JlZ2lvbiBQREYuanMgd29ya2VyIGNvbmZpZ3VyYXRpb25cbiAgLyoqIEVuc3VyZXMgUERGLmpzIHdvcmtlciBpcyBjb25maWd1cmVkIHdpdGggdGhlIGNvcnJlY3QgVVJMLiAqL1xuICBwcml2YXRlIHN0YXRpYyBwZGZKc1dvcmtlckNvbmZpZ3VyZWQgPSBmYWxzZTtcbiAgLyoqXG4gICAqIEVuc3VyZXMgdGhlIFBERi5qcyB3b3JrZXIgVVJMIGlzIGNvbmZpZ3VyZWQgb25jZSBiZWZvcmUgYW55IFBERiBvcGVyYXRpb25zLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBTZXRzIHtAbGluayBwZGZqc0xpYi5HbG9iYWxXb3JrZXJPcHRpb25zLndvcmtlclNyY30gdG8gdGhlIFJlc291cmNlIHBsdWdpbiBVUkxcbiAgICogYW5kIGd1YXJkcyBhZ2FpbnN0IHJlcGVhdGVkIGluaXRpYWxpemF0aW9uIHZpYSB7QGxpbmsgQUlfTExBTUFfU1RBTkRBUkRfUUEucGRmSnNXb3JrZXJDb25maWd1cmVkfS4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgZW5zdXJlUGRmSnNXb3JrZXJDb25maWd1cmVkKCk6IHZvaWQge1xuICAgIGlmIChBSV9MTEFNQV9TVEFOREFSRF9RQS5wZGZKc1dvcmtlckNvbmZpZ3VyZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBwZGZqc0xpYi5HbG9iYWxXb3JrZXJPcHRpb25zLndvcmtlclNyYyA9IGAke3dpbmRvdy5jb2RiaS5iYXNlVVJMfXBsdWdpbj9uYW1lPVJlc291cmNlJlBhdGg9L2NvbS9naXRodWIveGltYV9mb3JtY3ljbGVfZW50d2lja2xlcmtyZWlzL2ZjL3BsdWdpbi9jb2RiaS9wZGYud29ya2VyLm1pbi5qc2A7XG5cbiAgICBBSV9MTEFNQV9TVEFOREFSRF9RQS5wZGZKc1dvcmtlckNvbmZpZ3VyZWQgPSB0cnVlO1xuXG4gICAgd2luZG93LmNvZGJpLmxvZyhcbiAgICAgIFwiSU5GT1wiLFxuICAgICAgYFBERi5qcyB3b3JrZXIgY29uZmlndXJlZDogJHtwZGZqc0xpYi5HbG9iYWxXb3JrZXJPcHRpb25zLndvcmtlclNyY31gLFxuICAgICAgXCJBSSAvIExMQU1BIC8gU1REIC8gUUFcIixcbiAgICApO1xuICB9XG4gIC8vICNlbmRyZWdpb24gUERGLmpzIHdvcmtlciBjb25maWd1cmF0aW9uXG4gIC8vICNyZWdpb24gQUktR2VuZXJhdGVkIGhpbnRcbiAgLyoqIEluamVjdHMgZ2xvYmFsIHN0eWxlcyBmb3IgdGhlIEFJLUdlbmVyYXRlZCBiYWRnZSAob25jZSkuICovXG4gIHByaXZhdGUgc3RhdGljIGVuc3VyZUFpSGludFN0eWxlcygpOiB2b2lkIHtcbiAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNMTEFNQV9BSV9IaW50X1N0eWxlc1wiKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuXG4gICAgc3R5bGUuaWQgPSBcIkxMQU1BX0FJX0hpbnRfU3R5bGVzXCI7XG4gICAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4gICAgICAuTExBTUFfQUlfSGludF9XcmFwcGVyIHsgcG9zaXRpb246IHJlbGF0aXZlIDsgZGlzcGxheTogaW5saW5lLWJsb2NrIDsgd2lkdGg6IDEwMCUgO31cbiAgICAgIC5MTEFNQV9BSV9IaW50IHsgcG9zaXRpb246IGFic29sdXRlIDsgcG9pbnRlci1ldmVudHM6IG5vbmUgOyBjb2xvcjogcmdiYSgwLDAsMCwwLjM4KSA7XG4gICAgICAgIGZvbnQtc2l6ZTogMTFweCA7IGxpbmUtaGVpZ2h0OiAxIDsgd2hpdGUtc3BhY2U6IG5vd3JhcCA7IHVzZXItc2VsZWN0OiBub25lIDt9XG4gICAgICBpbnB1dCAgKyAuTExBTUFfQUlfSGludCB7IHJpZ2h0OiA4cHggOyB0b3A6IDUwJSA7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNTAlKSA7fVxuICAgICAgdGV4dGFyZWEgKyAuTExBTUFfQUlfSGludCB7IHJpZ2h0OiA4cHggOyBib3R0b206IDZweCA7fWA7XG5cbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgfVxuICAvKipcbiAgICogQXR0YWNoZXMgYW4gQUktR2VuZXJhdGVkIGJhZGdlIHRvIGEgZmllbGQuIFRoZSBiYWRnZSBpcyByZW1vdmVkIGFzIHNvb24gYXMgdGhlXG4gICAqIHVzZXIgY2hhbmdlcyB0aGUgZmllbGQgdmFsdWUgKGtleWJvYXJkIGlucHV0KS4gUmVwZWF0IGNhbGxzIG9uIHRoZSBzYW1lIGZpZWxkXG4gICAqIHJlcGxhY2UgdGhlIHByZXZpb3VzIGJhZGdlLlxuICAgKlxuICAgKiBAcGFyYW0gZmllbGQgICAgVGhlIGlucHV0IG9yIHRleHRhcmVhIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBoaW50VGV4dCBUaGUgbGFiZWwgdG8gZGlzcGxheSwgZS5nLiBcIlx1MjcyOCBBSS1HZW5lcmF0ZWRcIi4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgYXR0YWNoQWlIaW50KGZpZWxkOiBIVE1MSW5wdXRFbGVtZW50IHwgSFRNTFRleHRBcmVhRWxlbWVudCwgaGludFRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIEFJX0xMQU1BX1NUQU5EQVJEX1FBLmVuc3VyZUFpSGludFN0eWxlcygpO1xuICAgIC8vICNyZWdpb24gUmVtb3ZlIGFueSBleGlzdGluZyBoaW50IG9uIHRoaXMgZmllbGRcbiAgICBjb25zdCBleGlzdGluZ0hpbnQgPSBmaWVsZC5wYXJlbnRFbGVtZW50Py5xdWVyeVNlbGVjdG9yKFwiLkxMQU1BX0FJX0hpbnRcIik7XG5cbiAgICBpZiAoZXhpc3RpbmdIaW50KSB7XG4gICAgICBleGlzdGluZ0hpbnQucmVtb3ZlKCk7XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gUmVtb3ZlIGFueSBleGlzdGluZyBoaW50IG9uIHRoaXMgZmllbGRcbiAgICAvLyAjcmVnaW9uIFdyYXAgdGhlIGZpZWxkIGluIGEgcmVsYXRpdmUgY29udGFpbmVyIGlmIG5vdCBhbHJlYWR5IHdyYXBwZWRcbiAgICBsZXQgd3JhcHBlciA9IGZpZWxkLnBhcmVudEVsZW1lbnQ7XG5cbiAgICBpZiAoIXdyYXBwZXI/LmNsYXNzTGlzdC5jb250YWlucyhcIkxMQU1BX0FJX0hpbnRfV3JhcHBlclwiKSkge1xuICAgICAgd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgd3JhcHBlci5jbGFzc05hbWUgPSBcIkxMQU1BX0FJX0hpbnRfV3JhcHBlclwiO1xuXG4gICAgICBmaWVsZC5wYXJlbnRFbGVtZW50Py5pbnNlcnRCZWZvcmUod3JhcHBlciwgZmllbGQpO1xuICAgICAgd3JhcHBlci5hcHBlbmRDaGlsZChmaWVsZCk7XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gV3JhcCB0aGUgZmllbGQgaW4gYSByZWxhdGl2ZSBjb250YWluZXIgaWYgbm90IGFscmVhZHkgd3JhcHBlZFxuICAgIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG5cbiAgICBiYWRnZS5jbGFzc05hbWUgPSBcIkxMQU1BX0FJX0hpbnRcIjtcbiAgICBiYWRnZS50ZXh0Q29udGVudCA9IGhpbnRUZXh0O1xuXG4gICAgd3JhcHBlci5hcHBlbmRDaGlsZChiYWRnZSk7XG5cbiAgICAvLyAjcmVnaW9uIFJlbW92ZSBoaW50IG9uIGZpcnN0IHVzZXIgaW5wdXRcbiAgICBjb25zdCByZW1vdmVIaW50ID0gKCkgPT4ge1xuICAgICAgYmFkZ2UucmVtb3ZlKCk7XG4gICAgICBmaWVsZC5yZW1vdmVFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgcmVtb3ZlSGludCk7XG4gICAgfTtcblxuICAgIGZpZWxkLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCByZW1vdmVIaW50KTtcbiAgICAvLyAjZW5kcmVnaW9uIFJlbW92ZSBoaW50IG9uIGZpcnN0IHVzZXIgaW5wdXRcbiAgfVxuICAvLyAjZW5kcmVnaW9uIEFJLUdlbmVyYXRlZCBoaW50XG4gIC8vICNyZWdpb24gSW1hZ2UgZG93bnNjYWxpbmcgaGVscGVyXG4gIC8qKiBEZWZhdWx0IHRvdGFsLXBpeGVsIGJ1ZGdldCAod2lkdGggXHUwMEQ3IGhlaWdodCkuIE1hdGNoZXMgdGhlIGJhY2tlbmQncyBkZWZhdWx0IG1heFBpeGVscyAoXHUyMjQ4IDE3OTIgXHUwMEQ3IDE3OTIpLiAqL1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBERUZBVUxUX01BWF9QSVhFTFMgPSAzMjExMjY0O1xuICAvKipcbiAgICogQ29udmVydHMgYSB7QGxpbmsgQmxvYn0gKG9yIHtAbGluayBGaWxlfSkgdG8gYSBiYXNlNjQgZGF0YS1VUkwgc3RyaW5nLFxuICAgKiBieXBhc3NpbmcgZm9ybWN5Y2xlJ3MgbXVsdGlwYXJ0IGZpbGUgcGFyc2VyIHdoaWNoIHJldHVybnMgMC1ieXRlIHtAY29kZSBGaWxlRGF0YX0uXG4gICAqXG4gICAqIEBwYXJhbSBibG9iIFRoZSBCbG9iIG9yIEZpbGUgdG8gY29udmVydC5cbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYSBiYXNlNjQgZGF0YS1VUkwgc3RyaW5nLiAqL1xuICBwcml2YXRlIHN0YXRpYyBibG9iVG9EYXRhVXJsKGJsb2I6IEJsb2IpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICByZWFkZXIub25sb2FkID0gKCkgPT4gcmVzb2x2ZShyZWFkZXIucmVzdWx0IGFzIHN0cmluZyk7XG4gICAgICByZWFkZXIub25lcnJvciA9IHJlamVjdDtcblxuICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoYmxvYik7XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgY2FudmFzIHRvIGEge0BsaW5rIEZpbGV9IGJ1aWx0IGZyb20gcmF3IGJ5dGVzLlxuICAgKlxuICAgKiBAcGFyYW0gdG9Db252ZXJ0IFRoZSBjYW52YXMgZWxlbWVudCB0byBjb252ZXJ0LlxuICAgKiBAcGFyYW0gZmlsZU5hbWUgIFRoZSBuYW1lIG9mIHRoZSByZXN1bHRpbmcgZmlsZS5cbiAgICpcbiAgICogQHJldHVybnMgQSBGaWxlIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGNhbnZhcyBpbWFnZS4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgY2FudmFzVG9GaWxlKHRvQ29udmVydDogSFRNTENhbnZhc0VsZW1lbnQsIGZpbGVOYW1lOiBzdHJpbmcpOiBGaWxlIHtcbiAgICBjb25zdCBkYXRhVXJsID0gdG9Db252ZXJ0LnRvRGF0YVVSTChcImltYWdlL3BuZ1wiKTtcbiAgICBjb25zdCBiYXNlNjQgPSBkYXRhVXJsLnNwbGl0KFwiLFwiKVsxXTtcbiAgICBjb25zdCBiaW5hcnkgPSBhdG9iKGJhc2U2NCk7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShiaW5hcnkubGVuZ3RoKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmluYXJ5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBieXRlc1tpXSA9IGJpbmFyeS5jaGFyQ29kZUF0KGkpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgRmlsZShbYnl0ZXMuYnVmZmVyXSwgZmlsZU5hbWUsIHsgdHlwZTogXCJpbWFnZS9wbmdcIiB9KTtcbiAgfVxuICAvKipcbiAgICogRG93bnNjYWxlcyBhbiBpbWFnZSBmaWxlIGlmIGl0cyB0b3RhbCBwaXhlbCBjb3VudCAod2lkdGggXHUwMEQ3IGhlaWdodCkgZXhjZWVkc1xuICAgKiB7QGxpbmsgbWF4UGl4ZWxzfSwgcHJlc2VydmluZyB0aGUgYXNwZWN0IHJhdGlvLiBSZXR1cm5zIHRoZSBvcmlnaW5hbCBmaWxlXG4gICAqIHVuY2hhbmdlZCB3aGVuIGl0IGlzIGFscmVhZHkgd2l0aGluIHRoZSBidWRnZXQuXG4gICAqXG4gICAqIEBwYXJhbSBmaWxlICAgICAgVGhlIGltYWdlIGZpbGUgdG8gY2hlY2suXG4gICAqIEBwYXJhbSBtYXhQaXhlbHMgVG90YWwtcGl4ZWwgYnVkZ2V0ICh3aWR0aCBcdTAwRDcgaGVpZ2h0KS5cbiAgICpcbiAgICogQHJldHVybiAgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYSBCbG9iLiBUaGlzIHdpbGwgYmUgdGhlIG9yaWdpbmFsIGZpbGUgaWYgbm8gZG93bnNjYWxpbmcgd2FzIG5lZWRlZCBvciBpZiBhbiBlcnJvclxuICAgKiAgICAgICAgICBvY2N1cnJlZCBkdXJpbmcgcHJvY2Vzc2luZy4gT3RoZXJ3aXNlLCBpdCB3aWxsIGJlIGEgbmV3IEJsb2IgcmVwcmVzZW50aW5nIHRoZSBkb3duc2NhbGVkIGltYWdlLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgZG93bnNjYWxlSW1hZ2VJZk5lZWRlZChmaWxlOiBGaWxlLCBtYXhQaXhlbHM6IG51bWJlcik6IFByb21pc2U8QmxvYj4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxCbG9iPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcblxuICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgdG90YWxQaXhlbHMgPSBpbWcud2lkdGggKiBpbWcuaGVpZ2h0O1xuXG4gICAgICAgIGlmICh0b3RhbFBpeGVscyA8PSBtYXhQaXhlbHMpIHtcbiAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKGltZy5zcmMpO1xuICAgICAgICAgIHJlc29sdmUoZmlsZSk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzY2FsZSA9IE1hdGguc3FydChtYXhQaXhlbHMgLyB0b3RhbFBpeGVscyk7XG4gICAgICAgIGNvbnN0IG5ld1cgPSBNYXRoLm1heCgyOCwgTWF0aC5yb3VuZChpbWcud2lkdGggKiBzY2FsZSkpO1xuICAgICAgICBjb25zdCBuZXdIID0gTWF0aC5tYXgoMjgsIE1hdGgucm91bmQoaW1nLmhlaWdodCAqIHNjYWxlKSk7XG5cbiAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcbiAgICAgICAgICBcIklORk9cIixcbiAgICAgICAgICBgRG93bnNjYWxpbmcgJHtmaWxlLm5hbWV9OiAke2ltZy53aWR0aH1cdTAwRDcke2ltZy5oZWlnaHR9IFx1MjE5MiAke25ld1d9XHUwMEQ3JHtuZXdIfWAsXG4gICAgICAgICAgXCJBSSAvIExMQU1BIC8gUUFcIixcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IG5ld1c7XG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBuZXdIO1xuXG4gICAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgIC8vICNyZWdpb24gRmFsbGJhY2sgdG8gc2VuZCBvcmlnaW5hbCBpZiBjYW52YXMgY29udGV4dCBjYW5ub3QgYmUgY3JlYXRlZCBmb3Igc29tZSByZWFzb24uXG4gICAgICAgIGlmICghY3R4KSB7XG4gICAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChpbWcuc3JjKTtcbiAgICAgICAgICByZXNvbHZlKGZpbGUpO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vICNlbmRyZWdpb24gRmFsbGJhY2sgdG8gc2VuZCBvcmlnaW5hbCBpZiBjYW52YXMgY29udGV4dCBjYW5ub3QgYmUgY3JlYXRlZCBmb3Igc29tZSByZWFzb24uXG4gICAgICAgIGN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwLCBuZXdXLCBuZXdIKTtcbiAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChpbWcuc3JjKTtcbiAgICAgICAgcmVzb2x2ZShBSV9MTEFNQV9TVEFOREFSRF9RQS5jYW52YXNUb0ZpbGUoY2FudmFzLCBmaWxlLm5hbWUpKTtcbiAgICAgIH07XG4gICAgICAvLyAjcmVnaW9uIEZhbGxiYWNrIHRvIHNlbmQgb3JpZ2luYWwgaWYgaW1hZ2UgY2Fubm90IGJlIGRlY29kZWQgZm9yIHNvbWUgcmVhc29uLlxuICAgICAgaW1nLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwoaW1nLnNyYyk7XG4gICAgICAgIHJlc29sdmUoZmlsZSk7IC8vIGNhbm5vdCBkZWNvZGUgXHUyMTkyIHNlbmQgb3JpZ2luYWxcbiAgICAgIH07XG4gICAgICAvLyAjZW5kcmVnaW9uIEZhbGxiYWNrIHRvIHNlbmQgb3JpZ2luYWwgaWYgaW1hZ2UgY2Fubm90IGJlIGRlY29kZWQgZm9yIHNvbWUgcmVhc29uLlxuICAgICAgaW1nLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoZmlsZSk7XG4gICAgfSk7XG4gIH1cbiAgLy8gI2VuZHJlZ2lvbiBJbWFnZSBkb3duc2NhbGluZyBoZWxwZXJcbiAgLy8gI3JlZ2lvbiBQREYgcHJvY2Vzc2luZyBcdTIwMTQgc3BsaXQgcGFnZXMgaW50byBpbWFnZXMgb3IgcmVuZGVyIHRleHQgcGFnZXNcbiAgLyoqXG4gICAqIFByb2Nlc3NlcyBhIFBERiBmaWxlIGFuZCByZXR1cm5zIGltYWdlIGJsb2JzIGZvciBlYWNoIHBhZ2Ugb3IgZXh0cmFjdGVkIGltYWdlLlxuICAgKiBEZXRlY3RzIHdoZXRoZXIgdGhlIFBERiBjb250YWlucyBtYWlubHkgdGV4dCBvciBpbWFnZXMgYW5kIHByb2Nlc3NlcyBhY2NvcmRpbmdseS5cbiAgICpcbiAgICogQHBhcmFtIGZpbGUgVGhlIFBERiBmaWxlIHRvIHByb2Nlc3MuXG4gICAqIEBwYXJhbSBtYXhQYWdlcyBNYXhpbXVtIG51bWJlciBvZiBwYWdlcyB0byBwcm9jZXNzICgwID0gbm8gbGltaXQpLlxuICAgKlxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBCbG9iIG9iamVjdHMgcmVwcmVzZW50aW5nIGltYWdlcy4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgcHJvY2Vzc1BkZkZpbGUoZmlsZTogRmlsZSwgbWF4UGFnZXMgPSAwKTogUHJvbWlzZTxCbG9iW10+IHtcbiAgICBjb25zdCBhcnJheUJ1ZmZlciA9IGF3YWl0IGZpbGUuYXJyYXlCdWZmZXIoKTtcbiAgICBjb25zdCBwZGY6IFBERkRvY3VtZW50UHJveHkgPSBhd2FpdCBwZGZqc0xpYi5nZXREb2N1bWVudCh7IGRhdGE6IGFycmF5QnVmZmVyIH0pLnByb21pc2U7XG4gICAgY29uc3QgaW1hZ2VzOiBCbG9iW10gPSBbXTtcbiAgICBjb25zdCBwYWdlc1RvUHJvY2VzcyA9IG1heFBhZ2VzID4gMCA/IE1hdGgubWluKG1heFBhZ2VzLCBwZGYubnVtUGFnZXMpIDogcGRmLm51bVBhZ2VzO1xuXG4gICAgd2luZG93LmNvZGJpLmxvZyhcbiAgICAgIFwiSU5GT1wiLFxuICAgICAgYFByb2Nlc3NpbmcgUERGIHdpdGggJHtwZGYubnVtUGFnZXN9IHBhZ2UocyksIGxpbWl0aW5nIHRvICR7cGFnZXNUb1Byb2Nlc3N9IHBhZ2Uocyk6ICR7ZmlsZS5uYW1lfWAsXG4gICAgICBcIkFJIC8gTExBTUEgLyBRQVwiLFxuICAgICk7XG5cbiAgICBmb3IgKGxldCBwYWdlTnVtID0gMTsgcGFnZU51bSA8PSBwYWdlc1RvUHJvY2VzczsgcGFnZU51bSsrKSB7XG4gICAgICBjb25zdCBwYWdlID0gYXdhaXQgcGRmLmdldFBhZ2UocGFnZU51bSk7XG4gICAgICBjb25zdCB0ZXh0Q29udGVudCA9IGF3YWl0IHBhZ2UuZ2V0VGV4dENvbnRlbnQoKTtcbiAgICAgIGNvbnN0IHRleHRMZW5ndGggPSB0ZXh0Q29udGVudC5pdGVtc1xuICAgICAgICAubWFwKChpdGVtKSA9PiAoXCJzdHJcIiBpbiBpdGVtID8gaXRlbS5zdHIgOiBcIlwiKSlcbiAgICAgICAgLmpvaW4oXCJcIilcbiAgICAgICAgLnRyaW0oKS5sZW5ndGg7XG5cbiAgICAgIGlmICh0ZXh0TGVuZ3RoID4gMTAwKSB7XG4gICAgICAgIHdpbmRvdy5jb2RiaS5sb2coXG4gICAgICAgICAgXCJJTkZPXCIsXG4gICAgICAgICAgYFBERiBwYWdlICR7cGFnZU51bX0gY29udGFpbnMgJHt0ZXh0TGVuZ3RofSBjaGFyYWN0ZXJzIG9mIHRleHQgLSByZW5kZXJpbmcgdG8gaW1hZ2VgLFxuICAgICAgICAgIFwiQUkgLyBMTEFNQSAvIFNURCAvIFFBXCIsXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IEFJX0xMQU1BX1NUQU5EQVJEX1FBLnJlbmRlclBkZlBhZ2VUb0ltYWdlKHBhZ2UpO1xuXG4gICAgICAgIGltYWdlcy5wdXNoKGJsb2IpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcbiAgICAgICAgICBcIklORk9cIixcbiAgICAgICAgICBgUERGIHBhZ2UgJHtwYWdlTnVtfSBoYXMgbWluaW1hbCB0ZXh0ICgke3RleHRMZW5ndGh9IGNoYXJzKSAtIGF0dGVtcHRpbmcgaW1hZ2UgZXh0cmFjdGlvbmAsXG4gICAgICAgICAgXCJBSSAvIExMQU1BIC8gU1REIC8gUUFcIixcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBleHRyYWN0ZWRJbWFnZXMgPSBhd2FpdCBBSV9MTEFNQV9TVEFOREFSRF9RQS5leHRyYWN0SW1hZ2VzRnJvbVBkZlBhZ2UocGFnZSk7XG5cbiAgICAgICAgaWYgKGV4dHJhY3RlZEltYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgaW1hZ2VzLnB1c2goLi4uZXh0cmFjdGVkSW1hZ2VzKTtcblxuICAgICAgICAgIHdpbmRvdy5jb2RiaS5sb2coXG4gICAgICAgICAgICBcIklORk9cIixcbiAgICAgICAgICAgIGBFeHRyYWN0ZWQgJHtleHRyYWN0ZWRJbWFnZXMubGVuZ3RofSBpbWFnZShzKSBmcm9tIFBERiBwYWdlICR7cGFnZU51bX1gLFxuICAgICAgICAgICAgXCJBSSAvIExMQU1BIC8gU1REIC8gUUFcIixcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHdpbmRvdy5jb2RiaS5sb2coXG4gICAgICAgICAgICBcIklORk9cIixcbiAgICAgICAgICAgIGBObyBleHRyYWN0YWJsZSBpbWFnZXMgZm91bmQgb24gcGFnZSAke3BhZ2VOdW19IC0gcmVuZGVyaW5nIHBhZ2UgdG8gaW1hZ2VgLFxuICAgICAgICAgICAgXCJBSSAvIExMQU1BIC8gU1REIC8gUUFcIixcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IEFJX0xMQU1BX1NUQU5EQVJEX1FBLnJlbmRlclBkZlBhZ2VUb0ltYWdlKHBhZ2UpO1xuXG4gICAgICAgICAgaW1hZ2VzLnB1c2goYmxvYik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaW1hZ2VzO1xuICB9XG4gIC8vICNlbmRyZWdpb24gUERGIHByb2Nlc3NpbmcgXHUyMDE0IHNwbGl0IHBhZ2VzIGludG8gaW1hZ2VzIG9yIHJlbmRlciB0ZXh0IHBhZ2VzXG4gIC8vICNyZWdpb24gUmVuZGVyIGEgc2luZ2xlIFBERiBwYWdlIHRvIGEgUE5HIGltYWdlXG4gIC8qKlxuICAgKiBSZW5kZXJzIGEgUERGIHBhZ2UgKGluY2x1ZGluZyB0ZXh0KSB0byBhIGNhbnZhcyBhbmQgcmV0dXJucyBpdCBhcyBhbiBpbWFnZSBibG9iLlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBUaGUgUERGIHBhZ2UgdG8gcmVuZGVyLlxuICAgKlxuICAgKiBAcmV0dXJucyBCbG9iIGNvbnRhaW5pbmcgdGhlIHJlbmRlcmVkIHBhZ2UgYXMgUE5HLiAqL1xuICBwcml2YXRlIHN0YXRpYyBhc3luYyByZW5kZXJQZGZQYWdlVG9JbWFnZShwYWdlOiBQREZQYWdlUHJveHkpOiBQcm9taXNlPEJsb2I+IHtcbiAgICBjb25zdCB2aWV3cG9ydCA9IHBhZ2UuZ2V0Vmlld3BvcnQoeyBzY2FsZTogMi4wIH0pOyAvLyBIaWdoZXIgc2NhbGUgZm9yIGJldHRlciBxdWFsaXR5LlxuICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XG4gICAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG5cbiAgICBpZiAoIWNvbnRleHQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBnZXQgY2FudmFzIDJEIGNvbnRleHRcIik7XG4gICAgfVxuXG4gICAgY2FudmFzLndpZHRoID0gdmlld3BvcnQud2lkdGg7XG4gICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcblxuICAgIGF3YWl0IHBhZ2UucmVuZGVyKHsgY2FudmFzQ29udGV4dDogY29udGV4dCwgdmlld3BvcnQ6IHZpZXdwb3J0IH0pLnByb21pc2U7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8QmxvYj4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY2FudmFzLnRvQmxvYigoYmxvYikgPT4ge1xuICAgICAgICBpZiAoYmxvYikge1xuICAgICAgICAgIHJlc29sdmUoYmxvYik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkZhaWxlZCB0byBjb252ZXJ0IGNhbnZhcyB0byBibG9iXCIpKTtcbiAgICAgICAgfVxuICAgICAgfSwgXCJpbWFnZS9wbmdcIik7XG4gICAgfSk7XG4gIH1cbiAgLy8gI2VuZHJlZ2lvbiBSZW5kZXIgYSBzaW5nbGUgUERGIHBhZ2UgdG8gYSBQTkcgaW1hZ2VcbiAgLy8gI3JlZ2lvbiBFeHRyYWN0IGVtYmVkZGVkIGltYWdlcyBmcm9tIGEgUERGIHBhZ2VcbiAgLyoqXG4gICAqIEV4dHJhY3RzIGVtYmVkZGVkIGltYWdlcyBmcm9tIGEgUERGIHBhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIFRoZSBQREYgcGFnZSB0byBleHRyYWN0IGltYWdlcyBmcm9tLlxuICAgKlxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBCbG9iIG9iamVjdHMgcmVwcmVzZW50aW5nIGV4dHJhY3RlZCBpbWFnZXMuICovXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIGV4dHJhY3RJbWFnZXNGcm9tUGRmUGFnZShwYWdlOiBQREZQYWdlUHJveHkpOiBQcm9taXNlPEJsb2JbXT4ge1xuICAgIGNvbnN0IGltYWdlczogQmxvYltdID0gW107XG5cbiAgICB0cnkge1xuICAgICAgY29uc3Qgb3BlcmF0b3JMaXN0ID0gYXdhaXQgcGFnZS5nZXRPcGVyYXRvckxpc3QoKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcGVyYXRvckxpc3QuZm5BcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBmbiA9IG9wZXJhdG9yTGlzdC5mbkFycmF5W2ldO1xuXG4gICAgICAgIGlmIChmbiA9PT0gcGRmanNMaWIuT1BTLnBhaW50SW1hZ2VYT2JqZWN0IHx8IGZuID09PSBwZGZqc0xpYi5PUFMucGFpbnRJbmxpbmVJbWFnZVhPYmplY3QpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgaW1hZ2VOYW1lID0gb3BlcmF0b3JMaXN0LmFyZ3NBcnJheVtpXVswXTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBpbWFnZU5hbWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgY29uc3QgcmVzb3VyY2VzID0gYXdhaXQgcGFnZS5vYmpzLmdldChpbWFnZU5hbWUpO1xuXG4gICAgICAgICAgICAgIGlmIChyZXNvdXJjZXM/LmRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG5cbiAgICAgICAgICAgICAgICBpZiAoY3R4ICYmIHJlc291cmNlcy53aWR0aCAmJiByZXNvdXJjZXMuaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICBjYW52YXMud2lkdGggPSByZXNvdXJjZXMud2lkdGg7XG4gICAgICAgICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gcmVzb3VyY2VzLmhlaWdodDtcblxuICAgICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VEYXRhID0gbmV3IEltYWdlRGF0YShcbiAgICAgICAgICAgICAgICAgICAgbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KHJlc291cmNlcy5kYXRhKSxcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXMuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIGN0eC5wdXRJbWFnZURhdGEoaW1hZ2VEYXRhLCAwLCAwKTtcblxuICAgICAgICAgICAgICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IG5ldyBQcm9taXNlPEJsb2I+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLnRvQmxvYigoYikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGIpO1xuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiRmFpbGVkIHRvIGNyZWF0ZSBibG9iIGZyb20gaW1hZ2VcIikpO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgXCJpbWFnZS9wbmdcIik7XG4gICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgaW1hZ2VzLnB1c2goYmxvYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoaW1nRXJyb3IpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jb2RiaS5sb2coXCJXQVJOSU5HXCIsIGBGYWlsZWQgdG8gZXh0cmFjdCBpbmRpdmlkdWFsIGltYWdlOiAke2ltZ0Vycm9yfWAsIFwiQUkgLyBMTEFNQSAvIFNURCAvIFFBXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB3aW5kb3cuY29kYmkubG9nKFwiV0FSTklOR1wiLCBgSW1hZ2UgZXh0cmFjdGlvbiBmYWlsZWQ6ICR7ZXJyb3J9YCwgXCJBSSAvIExMQU1BIC8gU1REIC8gUUFcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGltYWdlcztcbiAgfVxuICAvLyAjZW5kcmVnaW9uIEV4dHJhY3QgZW1iZWRkZWQgaW1hZ2VzIGZyb20gYSBQREYgcGFnZVxufVxuLy8gI3JlZ2lvbiBSZWdpc3RlciBmdW5jdGlvbmFsaXR5IHdpdGggQ29kQmlcbndpbmRvdy5jb2RiaS5yZWdpc3RlckZ1bmN0aW9uYWxpdHkoXG4gIFwiQUkuTExBTUEuU1RBTkRBUkQuUUFcIixcbiAgQUlfTExBTUFfU1RBTkRBUkRfUUEuZnVuY3Rpb25hbGl0eS5iaW5kKEFJX0xMQU1BX1NUQU5EQVJEX1FBKSxcbik7IC8vIEluaXRpYWxpemF0aW9uXG4vLyAjZW5kcmVnaW9uIFJlZ2lzdGVyIGZ1bmN0aW9uYWxpdHkgd2l0aCBDb2RCaVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLDhCQUEwQjtBQWUxQixlQUEwQjtBQVduQixJQUFNLHdCQUFOLE1BQU0sc0JBQXFCO0FBQUEsRUFJaEM7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUF3QixrQkFBMEIsYUFBYTtBQUFBO0FBQUEsRUFrRy9ELE9BQWMsY0FxQlosUUFRQSxXQUNNO0FBQ04sSUFBQyxVQUErQixpQkFBaUIsVUFBVSxPQUFPLFVBQVU7QUFFMUUsWUFBTSxRQUFTLFVBQStCO0FBRTlDLFVBQUksQ0FBQyxTQUFTLE1BQU0sV0FBVyxHQUFHO0FBQ2hDO0FBQUEsTUFDRjtBQUdBLFlBQU0sUUFBUSxPQUFPLFFBQVEsSUFBSSxTQUFTLEVBQUUsWUFBWTtBQUN4RCxZQUFNLFFBQUksbUNBQVU7QUFDcEIsWUFBTSxXQUFXLElBQUksU0FBUztBQUM5QixZQUFNLFdBQVcsT0FBTyxXQUFXLE9BQU8sT0FBTyxRQUFRLElBQUk7QUFDN0QsWUFBTSxlQUNKLE9BQU8sZ0JBQWdCLE9BQU8sT0FBTyxPQUFPLFlBQVksSUFBSSxzQkFBcUI7QUFDbkYsWUFBTSxh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
