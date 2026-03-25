import { require_pdf } from "./chunk-SK52DCW2.js";
import { formatWaitTime } from "./chunk-IEBHCVNB.js";
import { CodBiError } from "./chunk-NKLWL4ZS.js";
import "./chunk-JP4GUAZX.js";
import { EQ } from "./chunk-RI3LWO6O.js";
import { IF } from "./chunk-2VQP2CFN.js";
import { REGEX } from "./chunk-F3IDEOQS.js";
import { TYPE } from "./chunk-O5T7YW22.js";
import { INSTANCE } from "./chunk-53TEMTGA.js";
import { DBC } from "./chunk-LFRFVRJV.js";
import { require_dist } from "./chunk-ZTMSSRTV.js";
import { __decorateClass, __decorateParam, __toESM } from "./chunk-AOJQKO6T.js";

// src/js/Functionalities/ai.ocr.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var pdfjsLib = __toESM(require_pdf(), 1);
var _AI_OCR = class _AI_OCR {
  static functionality(toLoad, toProcess) {
    toProcess.addEventListener("change", async (event) => {
      const container = document.querySelector(`div .CXUpload:has( #${toProcess.getAttribute("id")})`).parentElement;
      if (typeof toLoad.pattern === "string") {
        toLoad.pattern = toLoad.pattern.replace(/<\[([^\]]+)\]>/g, (match, identifier) => {
          const trimmed = identifier.trim();
          const field = container.querySelector(`.${trimmed}`);
          if (field && "value" in field) {
            return field.value;
          }
          return match;
        });
      }
      Object.keys(toLoad).forEach((key) => {
        if (key.startsWith("pattern_") && typeof toLoad[key] === "string") {
          toLoad[key] = toLoad[key].replace(/<\[([^\]]+)\]>/g, (match, identifier) => {
            const trimmed = identifier.trim();
            const field = container.querySelector(`.${trimmed}`);
            if (field && "value" in field) {
              return field.value;
            }
            return match;
          });
        }
      });
      const $ = (0, import_fc_form_renderer.getJQuery)();
      const files = toProcess.files;
      _AI_OCR.ensurePdfJsWorkerConfigured();
      const maximum = toLoad.maximum ? Number(toLoad.maximum) : 2;
      if (maximum && files.length > maximum) {
        window.codbi.log(
          "WARNING",
          `Maximum file limit exceeded. Number of selected files(${files.length}) exceeds > ${maximum}, thus processing will occur.`,
          "AI / OCR",
        );
        return;
      }
      const formData = new FormData();
      const maxPages = toLoad.maxpages ? Number(toLoad.maxpages) : 5;
      toLoad.processingimagetext = toLoad.processingimagetext ? toLoad.processingimagetext : "Processing...";
      toLoad.invalidimagetext = toLoad.invalidimagetext
        ? toLoad.invalidimagetext
        : "At least one of the images you selected did not contain the expected content.";
      const pdfTextResults = {};
      for (const file of Array.from(files)) {
        if (file.type === "application/pdf") {
          const pdfResult = await _AI_OCR.processPdfFile(file, maxPages);
          if (pdfResult.hasText) {
            pdfTextResults[file.name] = pdfResult.text;
          } else {
            for (let i = 0; i < pdfResult.images.length; i++) {
              const imageName = `${file.name.replace(".pdf", "")}_page_${i + 1}.png`;
              formData.append(imageName, pdfResult.images[i], imageName);
            }
          }
        } else {
          const downscaledImage = await _AI_OCR.downscaleImageForOCR(file);
          formData.append(file.name, downscaledImage, file.name);
        }
      }
      const fieldPatterns = [];
      if (toLoad.mode.toLowerCase() === "extract fields") {
        const patternKeys = Object.keys(toLoad).filter((key) => key.startsWith("pattern_"));
        for (const patternKey of patternKeys) {
          const fieldName = patternKey.substring(8);
          const pattern = TYPE.tsCheck(
            toLoad[patternKey],
            "string",
            `Does the attribute "${patternKey}" contain a regular expression pattern?`,
          );
          if (fieldName && pattern) {
            const fieldObj = {};
            fieldObj[fieldName] = encodeURIComponent(pattern.replace(/°/, "^"));
            fieldPatterns.push(fieldObj);
          }
        }
      }
      const fieldPatternsJson = fieldPatterns.length > 0 ? JSON.stringify(fieldPatterns) : "";
      toProcess.style.pointerEvents = "none";
      toProcess.style.opacity = "0.5";
      window.codbi.injectLoadingAnim(toProcess);
      const label = INSTANCE.tsCheck(
        toProcess.parentElement.querySelector("label"),
        HTMLLabelElement,
        "Does the tagged <input> not have a label?.",
      );
      const formerText = label ? label.innerHTML : "";
      if (toLoad.processingimagetext) {
        label.innerHTML = `${formerText}
        <style>
          @keyframes highlight {
            0%    { opacity:1; }
            50%   { opacity:0; }
            100%  { opacity:1; }}
                  
          .OCR_Verification { font-weight: bold ; color: darkorange ; animation: highlight 2s ease-in-out infinite ;}</style>

        <span class = "OCR_Verification">${toLoad.processingimagetext}</span>`;
      }
      const unanimate = () => {
        window.codbi.removeLoaderAnim(toProcess);
        toProcess.style.pointerEvents = "all";
        toProcess.style.opacity = "1";
        label.innerHTML = formerText;
      };
      let clientSideResponse = {};
      if (Object.keys(pdfTextResults).length > 0) {
        clientSideResponse = _AI_OCR.processTextClientSide(
          pdfTextResults,
          toLoad.mode,
          toLoad.pattern,
          fieldPatterns,
          toLoad.regexflags,
        );
      }
      const needsServerCall = formData.has(formData.keys().next().value);
      if (!needsServerCall) {
        _AI_OCR.handleResponse(clientSideResponse, toLoad, toProcess, toLoad.invalidimagetext, $);
        unanimate();
        return;
      }
      const ajaxHeaders = { "X-Mode": toLoad.mode };
      if (toLoad.mode.toLowerCase() !== "print") {
        ajaxHeaders["X-Pattern"] = encodeURIComponent(toLoad.pattern ? toLoad.pattern.replace(/°/, "^") : "");
      }
      if (toLoad.mode.toLowerCase() === "extract fields" && fieldPatternsJson.length > 0) {
        ajaxHeaders["X-FieldPatterns"] = encodeURIComponent(fieldPatternsJson);
      }
      if (toLoad.regexflags) {
        ajaxHeaders["X-RegexFlags"] = toLoad.regexflags;
      }
      if (toLoad.preprocess && toLoad.preprocess.toLowerCase() === "true") {
        if (typeof toLoad.preprocess === "string") {
          const preprocessValue = toLoad.preprocess.toLowerCase();
          ajaxHeaders["X-Preprocess"] = preprocessValue === "true" || preprocessValue === "t" ? "true" : "false";
        } else {
          ajaxHeaders["X-Preprocess"] = toLoad.preprocess ? "true" : "false";
        }
      }
      const ocrQueueOverride = toLoad.queuebadge != null ? String(toLoad.queuebadge) !== "false" : null;
      const ocrQueueText = toLoad.queuetext != null ? String(toLoad.queuetext) : "";
      let ocrQueueBadgeEl = null;
      const showOcrQueueBadge = (position, estimatedWaitMs) => {
        if (!ocrQueueBadgeEl) {
          ocrQueueBadgeEl = document.createElement("span");
          ocrQueueBadgeEl.className = "OCR_QueueBadge";
          ocrQueueBadgeEl.style.cssText =
            "display:inline-flex;align-items:center;gap:4px;margin-left:6px;padding:2px 8px;border-radius:10px;background:#d0e0ff;color:#1a5aab;font-size:12px;font-weight:600;white-space:nowrap;";
          label?.appendChild(ocrQueueBadgeEl);
        }
        const waitLabel = formatWaitTime(estimatedWaitMs);
        ocrQueueBadgeEl.textContent = `${position}${waitLabel ? ` ${waitLabel}` : ""}${ocrQueueText ? ` ${ocrQueueText}` : ""}`;
      };
      const hideOcrQueueBadge = () => {
        ocrQueueBadgeEl?.remove();
        ocrQueueBadgeEl = null;
      };
      let ocrQueueTicket = null;
      const sendOcrRequest = () => {
        $.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Tesseract`,
          type: "POST",
          data: formData,
          processData: false,
          contentType: false,
          cache: false,
          headers: ajaxHeaders,
          beforeSend: (xhr) => {
            if (ocrQueueTicket) {
              xhr.setRequestHeader("X-Queue-Ticket", ocrQueueTicket);
            }
          },
          success: (response) => {
            const parsedResponse = typeof response === "string" ? JSON.parse(response) : response;
            if (parsedResponse.queued) {
              ocrQueueTicket = parsedResponse.queueTicket ?? ocrQueueTicket;
              const badgeEnabled = ocrQueueOverride != null ? ocrQueueOverride : !!parsedResponse.queueBadge;
              if (badgeEnabled) {
                showOcrQueueBadge(parsedResponse.position ?? 0, parsedResponse.estimatedWaitMs);
              }
              setTimeout(sendOcrRequest, 1e3);
              return;
            }
            hideOcrQueueBadge();
            ocrQueueTicket = null;
            const mergedResponse = { ...clientSideResponse, ...parsedResponse };
            _AI_OCR.handleResponse(mergedResponse, toLoad, toProcess, toLoad.invalidimagetext, $);
            unanimate();
          },
          error: (xhr, status, error) => {
            hideOcrQueueBadge();
            unanimate();
            throw new CodBiError(`\u274C Tesseract AI OCR request failed with status (${status}) due to: ${error}`);
          },
        });
      };
      sendOcrRequest();
    });
  }
  /**
   * Downscales an image to optimal resolution for OCR processing.
   * Target: max 2048px on longest edge for good OCR accuracy with faster processing.
   *
   * @param file - The image file to downscale
   *
   * @returns Promise resolving to downscaled Blob or original file if already optimal
   */
  static async downscaleImageForOCR(file) {
    const MAX_DIMENSION = 2048;
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const { width, height } = img;
        const maxDim = Math.max(width, height);
        if (maxDim <= MAX_DIMENSION) {
          resolve(file);
          return;
        }
        const scale = MAX_DIMENSION / maxDim;
        const newWidth = Math.round(width * scale);
        const newHeight = Math.round(height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          file.type.startsWith("image/png") ? "image/png" : "image/jpeg",
          0.92,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  }
  static {
    /** States whether the PDF.js worker is configured with the correct URL or not. */
    this.pdfJsWorkerConfigured = false;
  }
  /**
   * Ensures the PDF.js worker is configured with the correct URL.
   * This method is called before processing PDF files to set up the web worker
   * that handles PDF parsing in a separate thread. The worker file is loaded
   * from FormCycle plugin resources and only configured once per session.
   *
   * @remarks
   * The worker configuration is cached using the static flag {@link AI_OCR.pdfJsWorkerConfigured } to avoid redundant
   * configuration calls.
   */
  static ensurePdfJsWorkerConfigured() {
    if (_AI_OCR.pdfJsWorkerConfigured) {
      return;
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.codbi.baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.worker.min.js`;
    _AI_OCR.pdfJsWorkerConfigured = true;
    window.codbi.log("INFO", `PDF.js worker configured: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`, "AI / OCR");
  }
  /**
   * Processes a PDF file to extract text or images.
   *
   * @param file - The PDF file to process
   * @param maxPages - Maximum number of pages to process
   *
   * @returns Object containing either extracted text or rendered images
   */
  static async processPdfFile(file, maxPages) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = Math.min(pdf.numPages, maxPages);
    let fullText = "";
    const images = [];
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => ("str" in item ? item.str : "")).join(" ");
      fullText += `${pageText}
`;
    }
    const hasText = fullText.trim().length > 0;
    if (!hasText) {
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport }).promise;
        const blob = await new Promise((resolve) => {
          canvas.toBlob((b) => resolve(b), "image/png");
        });
        images.push(blob);
      }
    }
    return { hasText, text: fullText, images };
  }
  /**
   * Processes extracted PDF text client-side using patterns.
   *
   * @param pdfTextResults  Object mapping filenames to extracted text
   * @param mode            The mode (print, verify, extract fields)
   * @param pattern         The pattern to match (for verify mode)
   * @param fieldPatterns   Field patterns for extract fields mode
   * @param regexFlags      Optional regex flags
   *
   * @returns Processed results object
   */
  static processTextClientSide(pdfTextResults, mode, pattern, fieldPatterns, regexFlags) {
    const results = {};
    for (const [filename, text] of Object.entries(pdfTextResults)) {
      switch (mode.toLowerCase()) {
        case "print":
          results[filename] = text;
          break;
        case "verify":
          if (pattern) {
            const regex = new RegExp(pattern, regexFlags || "");
            results[filename] = regex.test(text);
          }
          break;
        case "extract fields":
          if (fieldPatterns) {
            const fieldResults = {};
            for (const fieldPattern of fieldPatterns) {
              for (const [fieldName, fieldPatternStr] of Object.entries(fieldPattern)) {
                const decodedPattern = decodeURIComponent(fieldPatternStr);
                const regex = new RegExp(decodedPattern, regexFlags || "");
                const matches = text.match(regex);
                if (matches) {
                  if (!fieldResults[fieldName]) {
                    fieldResults[fieldName] = [];
                  }
                  fieldResults[fieldName].push(...matches.slice(1).filter(Boolean));
                }
              }
            }
            results[filename] = fieldResults;
          }
          break;
      }
    }
    return results;
  }
  /**
   * Handles the OCR response and updates the UI accordingly.
   *
   * @param response           The OCR response data
   * @param toLoad             Configuration object
   * @param toProcess          The HTML element being processed
   * @param tsInvalidimagetext Error message for invalid images
   * @param $                  jQuery instance
   */
  static handleResponse(response, toLoad, toProcess, tsInvalidimagetext, $) {
    if (toLoad.mode.toLowerCase() === "print") {
      const parent2 = toProcess.parentElement?.parentElement?.parentElement || null;
      if (parent2) {
        const receiverElem = INSTANCE.tsCheck(
          parent2.querySelector(".CodBi_AI_OCR_Receiver"),
          HTMLTextAreaElement,
          "The receiver element for the OCR results in Print-Mode has to be a <textarea>.",
        );
        if (receiverElem) {
          let responseText = "";
          let responseKeys = [];
          let textValues = [];
          switch (typeof response) {
            case "string":
              responseText = response;
              break;
            case "object":
              if (response !== null) {
                responseKeys = Object.keys(response);
                textValues = Object.values(response).map((val) =>
                  typeof val === "string" ? val : JSON.stringify(val),
                );
                responseText = textValues.join("\n\n");
              } else {
                responseText = JSON.stringify(response);
              }
              break;
            default:
              responseText = JSON.stringify(response);
              break;
          }
          receiverElem.value = responseText;
        } else {
          window.codbi.log(
            "INFO",
            `Receiver element with class 'CodBi_AI_Tesseract_Receiver' not found in #${toProcess.parentElement.parentElement.getAttribute("id")}.`,
            "AI / OCR",
          );
        }
      }
    }
    if (toLoad.mode.toLowerCase() === "extract fields" && typeof response === "object" && response !== null) {
      const parent3 = toProcess.parentElement?.parentElement?.parentElement || null;
      if (parent3) {
        const receivers = parent3.querySelectorAll(".CodBi_AI_OCR_Receiver");
        for (const elem of receivers) {
          const field = elem.getAttribute("data-cb-Field").toLowerCase();
          if (field) {
            const separator = toLoad.separator ? toLoad.separator : ",";
            const collectedValues = [];
            for (const fileKey in response) {
              if (Object.prototype.hasOwnProperty.call(response, fileKey)) {
                const fileData = response[fileKey];
                if (fileData && typeof fileData === "object" && Object.prototype.hasOwnProperty.call(fileData, field)) {
                  const fieldValue = fileData[field];
                  if (Array.isArray(fieldValue)) {
                    collectedValues.push(...fieldValue);
                  } else if (typeof fieldValue === "string") {
                    collectedValues.push(fieldValue);
                  }
                }
              }
            }
            if (collectedValues.length > 0) {
              const joinedValue = collectedValues.join(separator);
              if ("value" in elem) {
                INSTANCE.tsCheckMulti(
                  elem,
                  [HTMLInputElement, HTMLTextAreaElement],
                  "The OCR receiver element has to be an <input> or <textarea> when in Extract Fields mode.",
                ).value = joinedValue;
              } else {
                elem.textContent = joinedValue;
              }
            }
          }
        }
      }
    }
    if (toLoad.mode.toLowerCase() === "verify") {
      if (Object.values(response).some((result) => result === false)) {
        $(toProcess).error(tsInvalidimagetext);
        if (!toProcess.querySelector("#CodBi_AI_OCR_ManualVerify_Styles")) {
          const style = document.createElement("style");
          style.textContent = `
            .CodBi_AI_OCR_ManualVerify { display: flex ; align-items: center ; margin-top: 8px ; gap: 8px ;
              flex-wrap: nowrap ;}
            .CodBi_AI_OCR_ManualVerify_Checkbox { cursor: pointer ; opacity: 1 !important ; position: relative !important ;
              flex-shrink: 0 ;}
            .CodBi_AI_OCR_ManualVerify label { margin-bottom: 0 ; position: relative !important ;}
            @keyframes highlight {
              0%    { opacity:1; }
              50%   { opacity:0; }
              100%  { opacity:1; }}
            .CodBi_AI_OCR_ManualVerify label span { font-weight: bold ; color: darkorange ;
              animation: highlight 2s ease-in-out infinite ;}`;
          toProcess.appendChild(style);
        }
        const existingManualVerify =
          toProcess.parentElement.parentElement.querySelectorAll(".CodBi_AI_OCR_ManualVerify");
        for (let i = 0; i < existingManualVerify.length; i++) {
          existingManualVerify[i].remove();
        }
        const checkboxContainer = document.createElement("div");
        checkboxContainer.className = "CodBi_AI_OCR_ManualVerify";
        checkboxContainer.style.display = "flex";
        checkboxContainer.style.alignItems = "center";
        checkboxContainer.style.marginTop = "8px";
        checkboxContainer.style.gap = "8px";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `manual-verify-${toProcess.id}`;
        checkbox.className = "CodBi_AI_OCR_ManualVerify_Checkbox";
        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.textContent = toLoad.wrongfilemessage
          ? toLoad.wrongfilemessage
          : "The content is not as expected. Please check if you selected the correct file(s). You may manually verify that it is the correct one by clicking the checkbox.";
        label.style.marginBottom = "0";
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        toProcess.parentElement.insertAdjacentElement("afterend", checkboxContainer);
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            $(toProcess).error("");
          } else {
            $(toProcess).error(tsInvalidimagetext);
          }
        });
      } else {
        $(toProcess).error("");
        const existingManualVerify =
          toProcess.parentElement.parentElement.querySelectorAll(".CodBi_AI_OCR_ManualVerify");
        for (let i = 0; i < existingManualVerify.length; i++) {
          existingManualVerify[i].remove();
        }
      }
    }
  }
};
__decorateClass(
  [
    DBC.ParamvalueProvider,
    __decorateParam(
      0,
      TYPE.PRE(
        "string",
        "mode :: pattern :: invalidimagetext :: wrongfilemessage :: processingimagetext :: separator :: regexflags :: queuebadge :: queuetext",
      ),
    ),
    __decorateParam(0, REGEX.PRE(/^(Print|Verify|Extract Fields)$/i, "mode")),
    __decorateParam(0, REGEX.PRE(/^\S+$/, "separator")),
    __decorateParam(0, REGEX.PRE(/^\d+$/, "maxpages")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "maxpages")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(REGEX.stdExp.boolean), "preprocess")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new TYPE("boolean"), "preprocess", true)),
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
  _AI_OCR,
  "functionality",
  1,
);
var AI_OCR = _AI_OCR;
window.codbi.registerFunctionality("AI.OCR", AI_OCR.functionality.bind(AI_OCR));
export { AI_OCR };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9haS5vY3IudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIElNUE9SVEFOVDogV2hlbiBhZGRpbmcgY29kZSB0byB0aGlzIGZpbGUsIHdyYXAgZXZlcnkgYmxvY2sgb2YgY29kZSB5b3UgYWRkIHdpdGggYSBwcm9wZXIgLy8jcmVnaW9uICYgLy8jZW5kcmVnaW9uIGNvbW1lbnQuXG4vL3JlZ2lvbiBJbXBvcnRzXG4vL3JlZ2lvbiBYSU1BXG5pbXBvcnQgeyBnZXRKUXVlcnkgfSBmcm9tIFwiQGRlLXhpbWEvZmMtZm9ybS1yZW5kZXJlclwiO1xuLy9lbmRyZWdpb24gWElNQVxuLy9yZWdpb24gWERCQ1xuaW1wb3J0IHsgREJDIH0gZnJvbSBcInhkYmMvc3JjL0RCQ1wiO1xuaW1wb3J0IHsgRVEgfSBmcm9tIFwieGRiYy9zcmMvREJDL0VRXCI7XG5pbXBvcnQgeyBJRiB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvSUZcIjtcbmltcG9ydCB7IFRZUEUgfSBmcm9tIFwieGRiYy9zcmMvREJDL1RZUEVcIjtcbmltcG9ydCB7IFJFR0VYIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9SRUdFWFwiO1xuaW1wb3J0IHsgSU5TVEFOQ0UgfSBmcm9tIFwieGRiYy9zcmMvREJDL0lOU1RBTkNFXCI7XG4vL2VuZHJlZ2lvbiBYREJDXG4vL3JlZ2lvbiBQREZcbmltcG9ydCAqIGFzIHBkZmpzTGliIGZyb20gXCJwZGZqcy1kaXN0XCI7XG5pbXBvcnQgdHlwZSB7IFBERkRvY3VtZW50UHJveHksIFBERlBhZ2VQcm94eSB9IGZyb20gXCJwZGZqcy1kaXN0XCI7XG4vL2VuZHJlZ2lvbiBQREZcbmltcG9ydCB7IENvZEJpRXJyb3IgfSBmcm9tIFwiLi4vZ2xvYmFsLXNjb3BlXCI7XG5pbXBvcnQgeyBmb3JtYXRXYWl0VGltZSB9IGZyb20gXCIuLi9jb21tb25zL2Zvcm1hdC13YWl0LXRpbWVcIjtcbi8vZW5kcmVnaW9uIEltcG9ydHNcbi8qKlxuICogUHJvdmlkZXMgdGhlIHtAbGluayBBSS5mdW5jdGlvbmFsaXR5IH0uXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoU2FsdmF0b3JlLkNhbGxhcmlAQW5zYmFjaC5kZSlcbiAqL1xuLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1N0YXRpY09ubHlDbGFzczogUHJvYWN0aXZlIERlc2lnbi5cbmV4cG9ydCBjbGFzcyBBSV9PQ1Ige1xuICAvKipcbiAgICogVGhpcyBmdW5jdGlvbmFsaXR5IHNjYW5zIHRoZSBzZWxlY3RlZCBmaWxlcyBvZiBhIHtAbGluayBIVE1MSW5wdXRFbGVtZW50IH0gZWl0aGVyIHByaW50cyB0aGUgc2Nhbm5lZCB0ZXh0LCBleHRyYWN0c1xuICAgKiBzdWJzdHJpbmdzIGZyb20gdGhlIHNjYW5uZWQgdGV4dCBvciB2ZXJpZmllcyB0aGF0IHRoZSBzY2FubmVkIHRleHQgbWF0Y2hlcyB0aGUgcGF0dGVybiB1c2luZyB0aGUgVGVzc2VyYWN0IEFJLU9DUiBlbmdpbmUuXG4gICAqXG4gICAqICoqUERGIFN1cHBvcnQqKjogUERGIGZpbGVzIGFyZSBhdXRvbWF0aWNhbGx5IGRldGVjdGVkLiBQREZzIHdpdGggdGV4dCAoPjEwMCBjaGFyYWN0ZXJzKSBhcmUgcHJvY2Vzc2VkIGNsaWVudC1zaWRlIHdpdGhvdXRcbiAgICogdXNpbmcgdGhlIEFJIGJhY2tlbmQuIFBERnMgd2l0aCBtaW5pbWFsIHRleHQgKHNjYW5uZWQgZG9jdW1lbnRzKSBhcmUgcmVuZGVyZWQgdG8gaW1hZ2VzIGFuZCBzZW50IHRvIFRlc3NlcmFjdCBmb3IgT0NSLlxuICAgKlxuICAgKiAqKkF1dG9tYXRpYyBPcmllbnRhdGlvbiBEZXRlY3Rpb246KipcbiAgICogVGhlIFRlc3NlcmFjdCBPQ1IgZW5naW5lIHdpbGwgYXV0b21hdGljYWxseSBkZXRlY3QgYW5kIGNvcnJlY3QgaW1hZ2Ugb3JpZW50YXRpb24gdXNpbmcgaXRzIE9TRCAoT3JpZW50YXRpb25cbiAgICogYW5kIFNjcmlwdCBEZXRlY3Rpb24pLlxuICAgKlxuICAgKiAjIyMjIENvbmZpZyBQYXJhbWV0ZXI6XG4gICAqICAtICoqTW9kZSoqOiAgICAgICAgICAgICAgICAgRWl0aGVyICoqUHJpbnQqKiwgKipWZXJpZnkqKiBvciAqKkV4dHJhY3QgRmllbGRzKiouXG4gICAqICAtICoqUGF0dGVybioqOiAgICAgICAgICAgICAgVGhlIHtAbGluayBSZWdFeCB9IHRvIHVzZSB0byBlaXRoZXIgZXh0cmFjdCB0aGUgc3Vic3RyaW5ncyBmcm9tIHRoZSBzY2FubmVkIHRleHQgb3IgdG8gdmVyaWZ5IHRoYXRcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgc2Nhbm5lZCB0ZXh0IG1hdGNoZXMgdGhlIHBhdHRlcm4uXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgV2hlbiB0aGUgbW9kZSBpcyAqKkV4dHJhY3QgRmllbGRzKiogYWxsIGZpZWxkcyB3aXRoaW4gdGhlIHBhcmVudCBjb250YWluZXIgb2YgdGhlIG9uZSBjb250YWluaW5nXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIHtAbGluayBIVE1MSW5wdXRFbGVtZW50IH0gdG9Qcm9jZXNzIHRoYXQgaGF2ZSB0aGUgQ29kQmktQ1NTLUNsYXNzICoqQ29kQmlfQUlfT0NSX1JlY2VpdmVyKiogYXJlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlZCB0byByZWNlaXZlIHRoZSBleHRyYWN0ZWQgZmllbGRzLiBGb3IgZWFjaCBzdWNoIGZpZWxkLCBhIGNvcnJlc3BvbmRpbmcgcGFyYW1ldGVyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKipQYXR0ZXJuXy4uLioqIG11c3QgYmUgZGVmaW5lZCB0byBzcGVjaWZ5IHRoZSB7QGxpbmsgUmVnRXggfSB0byB1c2UgdG8gZXh0cmFjdCB0aGUgc3Vic3RyaW5nc1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb20gdGhlIHNjYW5uZWQgdGV4dCBmb3IgdGhhdCBmaWVsZC4gVGhlIG5hbWUgb2YgdGhlIGZpZWxkIGlzIHNwZWNpZmllZCBhZnRlciB0aGUgZGFzaCBhbmQgYXJlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZCB0byB0aGUgKipkYXRhLWNiLUZpZWxkKiogb2YgdGhlIGZpZWxkIHRvIGV4dHJhY3QgdGhlIHN1YnN0cmluZ3MgZnJvbSB0aGUgc2Nhbm5lZCB0ZXh0LlxuICAgKiAgLSAqKlNlcGFyYXRvcioqOiAgICAgICAgICAgIElmICoqTW9kZSoqIGlzIHNldCB0byAqKkV4dHJhY3QgRmllbGRzKiosIHRoaXMgcGFyYW1ldGVyIGRlZmluZXMgdGhlIHNlcGFyYXRvciBmb3IgdGhlIHJlc3VsdHMgb2ZcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsZSBmaWxlcy4gRGVmYXVsdCBpcyBhIGNvbW1hLlxuICAgKiAgLSAqKk1heFBhZ2VzKio6ICAgICAgICAgICAgIE1heGltdW0gbnVtYmVyIG9mIFBERiBwYWdlcyB0byBwcm9jZXNzIChkZWZhdWx0OiA1KS4gU2V0IHRvIDAgZm9yIG5vIGxpbWl0LiBPbmx5IGFwcGxpZXMgdG8gUERGcy5cbiAgICogIC0gKipSZWdFeEZsYWdzKio6ICAgICAgICAgICBPcHRpb25hbCByZWdleCBmbGFncyB0byBhcHBseSB0byBhbGwgcGF0dGVybnMgKGUuZy4sIFwiaVwiIGZvciBjYXNlLWluc2Vuc2l0aXZlLCBcIm1cIiBmb3IgbXVsdGlsaW5lLFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic1wiIGZvciBkb3RhbGwpLiBNdWx0aXBsZSBmbGFncyBjYW4gYmUgY29tYmluZWQgKGUuZy4sIFwiaW1cIikuIFRoZXNlIGZsYWdzIGFyZSB0cmFuc21pdHRlZCB0byB0aGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUZXNzZXJhY3Qgc2VydmxldCBhbmQgYXBwbGllZCB0byBwYXR0ZXJuIG1hdGNoaW5nLlxuICAgKiAgLSAqKlByZXByb2Nlc3MqKjogICAgICAgICAgIE9wdGlvbmFsIGJvb2xlYW4gZmxhZyB0byBlbmFibGUgaW1hZ2UgcHJlcHJvY2Vzc2luZyBiZWZvcmUgT0NSLiBXaGVuIHNldCB0byAqKnRydWUqKiwgYXBwbGllc1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYXlzY2FsZSBjb252ZXJzaW9uLCBhZGFwdGl2ZSBiaW5hcml6YXRpb24gKE90c3UncyBtZXRob2QpLCBhbmQgbm9pc2UgcmVkdWN0aW9uIHRvIGltcHJvdmVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0IHJlY29nbml0aW9uIGFjY3VyYWN5LiBEZWZhdWx0IGlzICoqZmFsc2UqKi5cbiAgICogIC0gKipJbnZhbGlkSW1hZ2VUZXh0Kio6ICAgICBUaGUgdGV4dCB0byBkaXNwbGF5IGlmIG9uZSBvciBtb3JlIG9mIHRoZSBpbWFnZXMgZG8gbm90IGNvbXBseSB0byB0aGUgc3BlY2lmaWVkICoqUGF0dGVybioqIGluXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZSAqKlZlcmlmeSoqLlxuICAgKiAgLSAqKldyb25nRmlsZU1lc3NhZ2UqKjogICAgIFRoZSB0ZXh0IHRvIGRpc3BsYXkgZm9yIHRoZSBtYW51YWwgdmVyaWZpY2F0aW9uIGNoZWNrYm94IGxhYmVsIGluIG1vZGUgKipWZXJpZnkqKi5cbiAgICogIC0gKipQcm9jZXNzaW5nSW1hZ2VUZXh0Kio6ICBUaGUgdGV4dCB0byBhcHBlbmQgdG8gdGhlIGxhYmVsIG9mIHRoZSB7QGxpbmsgSFRNTElucHV0RWxlbWVudCB9IHRvUHJvY2VzcyB3aGlsZSB0aGUgaW1hZ2VzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJlIHByb2Nlc3NlZC5cbiAgICogIC0gKipNYXhpbXVtKiogICAgICAgICAgICAgICBUaGUgbnVtYmVyIG9mIGZpbGVzIHRoYXQgbWF5IGJlIHVwbG9hZGVkLiBJZiB0aGUgbnVtYmVyIG9mIHNlbGVjdGVkIGZpbGVzIGV4Y2VlZHMgdGhpcyBudW1iZXIsXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIHByb2Nlc3NpbmcgaXMgYWJvcnRlZCBhbmQgYSB3YXJuaW5nIGlzIGxvZ2dlZCBpbiB0aGUgY29uc29sZS5cbiAgICogIC0gKipRdWV1ZUJhZGdlKio6ICAgICAgICAgICBJZiBzZXQgdG8gYFwidHJ1ZVwiYCwgc2hvd3MgYSBiYWRnZSB3aXRoIHRoZSBjdXJyZW50IHF1ZXVlIHBvc2l0aW9uIHdoaWxlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2FpdGluZyBmb3IgaW5mZXJlbmNlLiBPdmVycmlkZXMgdGhlIGBBSV9RdWV1ZUJhZGdlYCBwbHVnaW4gcHJvcGVydHlcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgdGhpcyBpbnN0YW5jZS4gRGVmYXVsdDogZGV0ZXJtaW5lZCBieSBwbHVnaW4gcHJvcGVydHkuXG4gICAqICAtICoqUXVldWVUZXh0Kio6ICAgICAgICAgICAgVGV4dCBhcHBlbmRlZCBhZnRlciB0aGUgcXVldWUgcG9zaXRpb24gbnVtYmVyIGluIHRoZSBiYWRnZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlLmcuIGBcImluIHF1ZXVlXCJgIFx1MjE5MiBiYWRnZSBzaG93cyBgXCIzIGluIHF1ZXVlXCJgKS4gRGVmYXVsdDogZW1wdHkuXG4gICAqXG4gICAqICMjIyBDU1MgQ2xhc3NlczpcbiAgICogLSAqKkNvZEJpX0FJX09DUl9SZWNlaXZlcioqOiBFbGVtZW50cyB3aXRoIHRoaXMgY2xhc3Mgd2l0aGluIHRoZSBwYXJlbnQgY29udGFpbmVyIG9mIHRoZSBvbmUgaG9sZGluZyB0aGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7QGxpbmsgSFRNTElucHV0RWxlbWVudCB9ICoqdG9Qcm9jZXNzKiogYXJlIHVzZWQgdG8gcmVjZWl2ZSB0aGUgZXh0cmFjdGVkIGZpZWxkcyB3aGVuICoqTW9kZSoqIGlzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0IHRvICoqRXh0cmFjdCBGaWVsZHMqKi4gRWFjaCBzdWNoIGVsZW1lbnQgc2hvdWxkIGhhdmUgKipkYXRhLWNiLUZpZWxkKiogc2V0IHRvIHRoZSBuYW1lIG9mIHRoZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkIHRvIHJlY2VpdmUgdGhlIGV4dHJhY3RlZCB0ZXh0IGZvciAoc2VlICoqUGF0dGVybl8uLi4qKiBjb25maWcgcGFyYW1ldGVyKS5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJbiAqKlByaW50KiogbW9kZSwgYSBzaW5nbGUgPHRleHRhcmVhPiB3aXRoIHRoaXMgY2xhc3MgaXMgZXhwZWN0ZWQgdG8gcmVjZWl2ZSB0aGUgZnVsbCBPQ1IgdGV4dFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5cbiAgICpcbiAgICogQHBhcmFtIHRvTG9hZCAgICBQcm92aWRlZCBieSB0aGUgQ29kQmkuXG4gICAqIEBwYXJhbSB0b1Byb2Nlc3MgUHJvdmlkZWQgYnkgdGhlIENvZEJpLiAqL1xuICBAREJDLlBhcmFtdmFsdWVQcm92aWRlclxuICBwdWJsaWMgc3RhdGljIGZ1bmN0aW9uYWxpdHkoXG4gICAgQFRZUEUuUFJFKFxuICAgICAgXCJzdHJpbmdcIixcbiAgICAgIFwibW9kZSA6OiBwYXR0ZXJuIDo6IGludmFsaWRpbWFnZXRleHQgOjogd3JvbmdmaWxlbWVzc2FnZSA6OiBwcm9jZXNzaW5naW1hZ2V0ZXh0IDo6IHNlcGFyYXRvciA6OiByZWdleGZsYWdzIDo6IHF1ZXVlYmFkZ2UgOjogcXVldWV0ZXh0XCIsXG4gICAgKVxuICAgIEBSRUdFWC5QUkUoL14oUHJpbnR8VmVyaWZ5fEV4dHJhY3QgRmllbGRzKSQvaSwgXCJtb2RlXCIpXG4gICAgQFJFR0VYLlBSRSgvXlxcUyskLywgXCJzZXBhcmF0b3JcIilcbiAgICBAUkVHRVguUFJFKC9eXFxkKyQvLCBcIm1heHBhZ2VzXCIpXG4gICAgQElGLlBSRShuZXcgVFlQRShcInN0cmluZ1wiKSwgbmV3IFJFR0VYKC9eXFxkKyQvKSwgXCJtYXhwYWdlc1wiKVxuICAgIEBJRi5QUkUobmV3IFRZUEUoXCJzdHJpbmdcIiksIG5ldyBSRUdFWChSRUdFWC5zdGRFeHAuYm9vbGVhbiksIFwicHJlcHJvY2Vzc1wiKVxuICAgIEBJRi5QUkUobmV3IFRZUEUoXCJzdHJpbmdcIiksIG5ldyBUWVBFKFwiYm9vbGVhblwiKSwgXCJwcmVwcm9jZXNzXCIsIHRydWUpXG4gICAgdG9Mb2FkOiB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSxcblxuICAgIEBJTlNUQU5DRS5QUkUoXG4gICAgICBIVE1MSW5wdXRFbGVtZW50LFxuICAgICAgdW5kZWZpbmVkLFxuICAgICAgJ0lzIGl0IG5vdCBhbiA8aW5wdXQgdHlwZSA9IFwiZmlsZVwiLz4gdGhhdCBpcyB0YWdnZWQgd2l0aCB0aGlzIGZ1bmN0aW9uYWxpdHk/JyxcbiAgICApXG4gICAgQEVRLlBSRShcImZpbGVcIiwgZmFsc2UsIFwidHlwZVwiKVxuICAgIHRvUHJvY2VzczogRWxlbWVudCxcbiAgKTogdm9pZCB7XG4gICAgKHRvUHJvY2VzcyBhcyBIVE1MSW5wdXRFbGVtZW50KS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgZGl2IC5DWFVwbG9hZDpoYXMoICMke3RvUHJvY2Vzcy5nZXRBdHRyaWJ1dGUoXCJpZFwiKX0pYCkucGFyZW50RWxlbWVudDtcblxuICAgICAgLy8gI3JlZ2lvbiBTeW1ib2wgcmVzb2x1dGlvbiBmb3IgcGF0dGVybi9xdWVzdGlvblxuICAgICAgLy8gSWYgdGhlIHBhdHRlcm4gY29udGFpbnMgc3ltYm9scyBsaWtlIDxbRmllbGROYW1lXT4sIHJlcGxhY2UgdGhlbSB3aXRoIHRoZSB2YWx1ZSBvZiB0aGUgZmllbGQgd2l0aCB0aGF0IENTUyBjbGFzcyBpbiB0aGUgc2FtZSBjb250YWluZXJcbiAgICAgIGlmICh0eXBlb2YgdG9Mb2FkLnBhdHRlcm4gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdG9Mb2FkLnBhdHRlcm4gPSB0b0xvYWQucGF0dGVybi5yZXBsYWNlKC88XFxbKFteXFxdXSspXFxdPi9nLCAobWF0Y2gsIGlkZW50aWZpZXIpID0+IHtcbiAgICAgICAgICBjb25zdCB0cmltbWVkID0gaWRlbnRpZmllci50cmltKCk7XG4gICAgICAgICAgY29uc3QgZmllbGQgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcihgLiR7dHJpbW1lZH1gKSBhcyBIVE1MSW5wdXRFbGVtZW50IHwgbnVsbDtcbiAgICAgICAgICBpZiAoZmllbGQgJiYgXCJ2YWx1ZVwiIGluIGZpZWxkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmllbGQudmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBtYXRjaDtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAvLyBBbHNvIHJlc29sdmUgc3ltYm9scyBpbiBQYXR0ZXJuXyogZmllbGRzIChmb3IgRXh0cmFjdCBGaWVsZHMgbW9kZSlcbiAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L2NvbXBsZXhpdHkvbm9Gb3JFYWNoOiA8ZXhwbGFuYXRpb24+XG4gICAgICBPYmplY3Qua2V5cyh0b0xvYWQpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICBpZiAoa2V5LnN0YXJ0c1dpdGgoXCJwYXR0ZXJuX1wiKSAmJiB0eXBlb2YgdG9Mb2FkW2tleV0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICB0b0xvYWRba2V5XSA9ICh0b0xvYWRba2V5XSBhcyBzdHJpbmcpLnJlcGxhY2UoLzxcXFsoW15cXF1dKylcXF0+L2csIChtYXRjaCwgaWRlbnRpZmllcikgPT4ge1xuICAgICAgICAgICAgY29uc3QgdHJpbW1lZCA9IGlkZW50aWZpZXIudHJpbSgpO1xuICAgICAgICAgICAgY29uc3QgZmllbGQgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcihgLiR7dHJpbW1lZH1gKSBhcyBIVE1MSW5wdXRFbGVtZW50IHwgbnVsbDtcbiAgICAgICAgICAgIGlmIChmaWVsZCAmJiBcInZhbHVlXCIgaW4gZmllbGQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIC8vICNlbmRyZWdpb24gU3ltYm9sIHJlc29sdXRpb24gZm9yIHBhdHRlcm4vcXVlc3Rpb25cbiAgICAgIGNvbnN0ICQgPSBnZXRKUXVlcnkoKTtcbiAgICAgIGNvbnN0IGZpbGVzID0gKHRvUHJvY2VzcyBhcyBIVE1MSW5wdXRFbGVtZW50KS5maWxlcztcbiAgICAgIC8vIENvbmZpZ3VyZSBQREYuanMgd29ya2VyIGlmIG5lZWRlZFxuICAgICAgQUlfT0NSLmVuc3VyZVBkZkpzV29ya2VyQ29uZmlndXJlZCgpO1xuXG4gICAgICAvLyNyZWdpb24gQ2hlY2sgTWF4aW11bSBwYXJhbWV0ZXJcbiAgICAgIGNvbnN0IG1heGltdW0gPSB0b0xvYWQubWF4aW11bSA/IE51bWJlcih0b0xvYWQubWF4aW11bSkgOiAyO1xuICAgICAgaWYgKG1heGltdW0gJiYgZmlsZXMubGVuZ3RoID4gbWF4aW11bSkge1xuICAgICAgICB3aW5kb3cuY29kYmkubG9nKFxuICAgICAgICAgIFwiV0FSTklOR1wiLFxuICAgICAgICAgIGBNYXhpbXVtIGZpbGUgbGltaXQgZXhjZWVkZWQuIE51bWJlciBvZiBzZWxlY3RlZCBmaWxlcygke2ZpbGVzLmxlbmd0aH0pIGV4Y2VlZHMgPiAke21heGltdW19LCB0aHVzIHByb2Nlc3Npbmcgd2lsbCBvY2N1ci5gLFxuICAgICAgICAgIFwiQUkgLyBPQ1JcIixcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgLy8jZW5kcmVnaW9uIENoZWNrIE1heGltdW0gcGFyYW1ldGVyXG5cbiAgICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICBjb25zdCBtYXhQYWdlcyA9IHRvTG9hZC5tYXhwYWdlcyA/IE51bWJlcih0b0xvYWQubWF4cGFnZXMpIDogNTtcbiAgICAgIHRvTG9hZC5wcm9jZXNzaW5naW1hZ2V0ZXh0ID0gdG9Mb2FkLnByb2Nlc3NpbmdpbWFnZXRleHQgPyB0b0xvYWQucHJvY2Vzc2luZ2ltYWdldGV4dCA6IFwiUHJvY2Vzc2luZy4uLlwiO1xuICAgICAgdG9Mb2FkLmludmFsaWRpbWFnZXRleHQgPSB0b0xvYWQuaW52YWxpZGltYWdldGV4dFxuICAgICAgICA/IHRvTG9hZC5pbnZhbGlkaW1hZ2V0ZXh0XG4gICAgICAgIDogXCJBdCBsZWFzdCBvbmUgb2YgdGhlIGltYWdlcyB5b3Ugc2VsZWN0ZWQgZGlkIG5vdCBjb250YWluIHRoZSBleHBlY3RlZCBjb250ZW50LlwiO1xuICAgICAgLy8gI3JlZ2lvbiBQcm9jZXNzIGZpbGVzIChQREYgb3IgSW1hZ2UpXG4gICAgICBjb25zdCBwZGZUZXh0UmVzdWx0czogeyBbZmlsZW5hbWU6IHN0cmluZ106IHN0cmluZyB9ID0ge307XG5cbiAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBBcnJheS5mcm9tKGZpbGVzKSkge1xuICAgICAgICBpZiAoZmlsZS50eXBlID09PSBcImFwcGxpY2F0aW9uL3BkZlwiKSB7XG4gICAgICAgICAgY29uc3QgcGRmUmVzdWx0ID0gYXdhaXQgQUlfT0NSLnByb2Nlc3NQZGZGaWxlKGZpbGUsIG1heFBhZ2VzKTtcblxuICAgICAgICAgIGlmIChwZGZSZXN1bHQuaGFzVGV4dCkge1xuICAgICAgICAgICAgcGRmVGV4dFJlc3VsdHNbZmlsZS5uYW1lXSA9IHBkZlJlc3VsdC50ZXh0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBkZlJlc3VsdC5pbWFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgY29uc3QgaW1hZ2VOYW1lID0gYCR7ZmlsZS5uYW1lLnJlcGxhY2UoXCIucGRmXCIsIFwiXCIpfV9wYWdlXyR7aSArIDF9LnBuZ2A7XG5cbiAgICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKGltYWdlTmFtZSwgcGRmUmVzdWx0LmltYWdlc1tpXSwgaW1hZ2VOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgZG93bnNjYWxlZEltYWdlID0gYXdhaXQgQUlfT0NSLmRvd25zY2FsZUltYWdlRm9yT0NSKGZpbGUpO1xuXG4gICAgICAgICAgZm9ybURhdGEuYXBwZW5kKGZpbGUubmFtZSwgZG93bnNjYWxlZEltYWdlLCBmaWxlLm5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIFByb2Nlc3MgZmlsZXMgKFBERiBvciBJbWFnZSlcbiAgICAgIC8vICNyZWdpb24gQnVpbGQgWC1GaWVsZFBhdHRlcm5zIGZyb20gUGF0dGVybl8qIGZpZWxkcywgaWYgaW4gRXh0cmFjdCBGaWVsZHMgbW9kZVxuICAgICAgY29uc3QgZmllbGRQYXR0ZXJuczogQXJyYXk8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT4gPSBbXTtcblxuICAgICAgaWYgKCh0b0xvYWQubW9kZSBhcyBzdHJpbmcpLnRvTG93ZXJDYXNlKCkgPT09IFwiZXh0cmFjdCBmaWVsZHNcIikge1xuICAgICAgICBjb25zdCBwYXR0ZXJuS2V5cyA9IE9iamVjdC5rZXlzKHRvTG9hZCkuZmlsdGVyKChrZXkpID0+IGtleS5zdGFydHNXaXRoKFwicGF0dGVybl9cIikpO1xuXG4gICAgICAgIGZvciAoY29uc3QgcGF0dGVybktleSBvZiBwYXR0ZXJuS2V5cykge1xuICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IHBhdHRlcm5LZXkuc3Vic3RyaW5nKDgpO1xuICAgICAgICAgIGNvbnN0IHBhdHRlcm4gPSBUWVBFLnRzQ2hlY2s8c3RyaW5nPihcbiAgICAgICAgICAgIHRvTG9hZFtwYXR0ZXJuS2V5XSxcbiAgICAgICAgICAgIFwic3RyaW5nXCIsXG4gICAgICAgICAgICBgRG9lcyB0aGUgYXR0cmlidXRlIFwiJHtwYXR0ZXJuS2V5fVwiIGNvbnRhaW4gYSByZWd1bGFyIGV4cHJlc3Npb24gcGF0dGVybj9gLFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBpZiAoZmllbGROYW1lICYmIHBhdHRlcm4pIHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkT2JqOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge307XG5cbiAgICAgICAgICAgIGZpZWxkT2JqW2ZpZWxkTmFtZV0gPSBlbmNvZGVVUklDb21wb25lbnQocGF0dGVybi5yZXBsYWNlKC9cdTAwQjAvLCBcIl5cIikpO1xuXG4gICAgICAgICAgICBmaWVsZFBhdHRlcm5zLnB1c2goZmllbGRPYmopO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWVsZFBhdHRlcm5zSnNvbiA9IGZpZWxkUGF0dGVybnMubGVuZ3RoID4gMCA/IEpTT04uc3RyaW5naWZ5KGZpZWxkUGF0dGVybnMpIDogXCJcIjtcbiAgICAgIC8vIGVuZHJlZ2lvbiBCdWlsZCBYLUZpZWxkUGF0dGVybnMgZnJvbSBQYXR0ZXJuXyogZmllbGRzLCBpZiBpbiBFeHRyYWN0IEZpZWxkcyBtb2RlXG4gICAgICAvLyAjcmVnaW9uIERpc2FibGUgaW5wdXQgYW5kIHNob3cgbG9hZGluZyBhbmltYXRpb25cbiAgICAgICh0b1Byb2Nlc3MgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcIm5vbmVcIjtcbiAgICAgICh0b1Byb2Nlc3MgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLm9wYWNpdHkgPSBcIjAuNVwiO1xuXG4gICAgICB3aW5kb3cuY29kYmkuaW5qZWN0TG9hZGluZ0FuaW0odG9Qcm9jZXNzKTtcblxuICAgICAgY29uc3QgbGFiZWwgPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxMYWJlbEVsZW1lbnQ+KFxuICAgICAgICAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCJsYWJlbFwiKSxcbiAgICAgICAgSFRNTExhYmVsRWxlbWVudCxcbiAgICAgICAgXCJEb2VzIHRoZSB0YWdnZWQgPGlucHV0PiBub3QgaGF2ZSBhIGxhYmVsPy5cIixcbiAgICAgICk7XG4gICAgICBjb25zdCBmb3JtZXJUZXh0ID0gbGFiZWwgPyBsYWJlbC5pbm5lckhUTUwgOiBcIlwiO1xuXG4gICAgICBpZiAodG9Mb2FkLnByb2Nlc3NpbmdpbWFnZXRleHQpIHtcbiAgICAgICAgbGFiZWwuaW5uZXJIVE1MID0gYCR7Zm9ybWVyVGV4dH1cbiAgICAgICAgPHN0eWxlPlxuICAgICAgICAgIEBrZXlmcmFtZXMgaGlnaGxpZ2h0IHtcbiAgICAgICAgICAgIDAlICAgIHsgb3BhY2l0eToxOyB9XG4gICAgICAgICAgICA1MCUgICB7IG9wYWNpdHk6MDsgfVxuICAgICAgICAgICAgMTAwJSAgeyBvcGFjaXR5OjE7IH19XG4gICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAuT0NSX1ZlcmlmaWNhdGlvbiB7IGZvbnQtd2VpZ2h0OiBib2xkIDsgY29sb3I6IGRhcmtvcmFuZ2UgOyBhbmltYXRpb246IGhpZ2hsaWdodCAycyBlYXNlLWluLW91dCBpbmZpbml0ZSA7fTwvc3R5bGU+XG5cbiAgICAgICAgPHNwYW4gY2xhc3MgPSBcIk9DUl9WZXJpZmljYXRpb25cIj4ke3RvTG9hZC5wcm9jZXNzaW5naW1hZ2V0ZXh0fTwvc3Bhbj5gO1xuICAgICAgfVxuICAgICAgLy8gZW5kcmVnaW9uIERpc2FibGUgaW5wdXQgYW5kIHNob3cgbG9hZGluZyBhbmltYXRpb25cbiAgICAgIC8vICNyZWdpb24gRGVmaW5lIGhvdyB0byByZW1vdmUgdGhlIGxvYWRpbmcgYW5pbWF0aW9uIGFuZCByZXN0b3JlIHRoZSBsYWJlbFxuICAgICAgY29uc3QgdW5hbmltYXRlID0gKCkgPT4ge1xuICAgICAgICB3aW5kb3cuY29kYmkucmVtb3ZlTG9hZGVyQW5pbSh0b1Byb2Nlc3MpO1xuXG4gICAgICAgICh0b1Byb2Nlc3MgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcImFsbFwiO1xuICAgICAgICAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5zdHlsZS5vcGFjaXR5ID0gXCIxXCI7XG4gICAgICAgIGxhYmVsLmlubmVySFRNTCA9IGZvcm1lclRleHQ7XG4gICAgICB9O1xuICAgICAgLy8gZW5kcmVnaW9uIERlZmluZSBob3cgdG8gcmVtb3ZlIHRoZSBsb2FkaW5nIGFuaW1hdGlvbiBhbmQgcmVzdG9yZSB0aGUgbGFiZWxcbiAgICAgIC8vICNyZWdpb24gUHJvY2VzcyBQREYgdGV4dCByZXN1bHRzIGNsaWVudC1zaWRlIGlmIGFueVxuICAgICAgbGV0IGNsaWVudFNpZGVSZXNwb25zZTogeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH0gPSB7fTtcblxuICAgICAgaWYgKE9iamVjdC5rZXlzKHBkZlRleHRSZXN1bHRzKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNsaWVudFNpZGVSZXNwb25zZSA9IEFJX09DUi5wcm9jZXNzVGV4dENsaWVudFNpZGUoXG4gICAgICAgICAgcGRmVGV4dFJlc3VsdHMsXG4gICAgICAgICAgdG9Mb2FkLm1vZGUgYXMgc3RyaW5nLFxuICAgICAgICAgIHRvTG9hZC5wYXR0ZXJuIGFzIHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgICAgICAgICBmaWVsZFBhdHRlcm5zLFxuICAgICAgICAgIHRvTG9hZC5yZWdleGZsYWdzIGFzIHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIC8vICNlbmRyZWdpb24gUHJvY2VzcyBQREYgdGV4dCByZXN1bHRzIGNsaWVudC1zaWRlXG4gICAgICAvLyAjcmVnaW9uIERldGVybWluZSBpZiBzZXJ2ZXIgY2FsbCBpcyBuZWVkZWRcbiAgICAgIGNvbnN0IG5lZWRzU2VydmVyQ2FsbCA9IGZvcm1EYXRhLmhhcyhmb3JtRGF0YS5rZXlzKCkubmV4dCgpLnZhbHVlKTtcblxuICAgICAgaWYgKCFuZWVkc1NlcnZlckNhbGwpIHtcbiAgICAgICAgQUlfT0NSLmhhbmRsZVJlc3BvbnNlKGNsaWVudFNpZGVSZXNwb25zZSwgdG9Mb2FkLCB0b1Byb2Nlc3MsIHRvTG9hZC5pbnZhbGlkaW1hZ2V0ZXh0IGFzIHN0cmluZywgJCk7XG4gICAgICAgIHVuYW5pbWF0ZSgpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vICNlbmRyZWdpb24gRGV0ZXJtaW5lIGlmIHNlcnZlciBjYWxsIGlzIG5lZWRlZFxuICAgICAgLy8gI3JlZ2lvbiBTZW5kIHRoZSByZXF1ZXN0IHRvIHRoZSBUZXNzZXJhY3QgQUkgT0NSIEFQSVxuICAgICAgY29uc3QgYWpheEhlYWRlcnM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7IFwiWC1Nb2RlXCI6IHRvTG9hZC5tb2RlIGFzIHN0cmluZyB9O1xuXG4gICAgICBpZiAoKHRvTG9hZC5tb2RlIGFzIHN0cmluZykudG9Mb3dlckNhc2UoKSAhPT0gXCJwcmludFwiKSB7XG4gICAgICAgIGFqYXhIZWFkZXJzW1wiWC1QYXR0ZXJuXCJdID0gZW5jb2RlVVJJQ29tcG9uZW50KFxuICAgICAgICAgIHRvTG9hZC5wYXR0ZXJuID8gKHRvTG9hZC5wYXR0ZXJuIGFzIHN0cmluZykucmVwbGFjZSgvXHUwMEIwLywgXCJeXCIpIDogXCJcIixcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCh0b0xvYWQubW9kZSBhcyBzdHJpbmcpLnRvTG93ZXJDYXNlKCkgPT09IFwiZXh0cmFjdCBmaWVsZHNcIiAmJiBmaWVsZFBhdHRlcm5zSnNvbi5sZW5ndGggPiAwKSB7XG4gICAgICAgIGFqYXhIZWFkZXJzW1wiWC1GaWVsZFBhdHRlcm5zXCJdID0gZW5jb2RlVVJJQ29tcG9uZW50KGZpZWxkUGF0dGVybnNKc29uKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRvTG9hZC5yZWdleGZsYWdzKSB7XG4gICAgICAgIGFqYXhIZWFkZXJzW1wiWC1SZWdleEZsYWdzXCJdID0gdG9Mb2FkLnJlZ2V4ZmxhZ3MgYXMgc3RyaW5nO1xuICAgICAgfVxuICAgICAgLy8gI3JlZ2lvbiBTZXQgUHJlcHJvY2Vzc2luZy1IZWFkZXIsIGlmIGRlZmluZWQgaW4gcGFzc2VkIHBhcmFtZXRlci5cbiAgICAgIGlmICh0b0xvYWQucHJlcHJvY2VzcyAmJiAodG9Mb2FkLnByZXByb2Nlc3MgYXMgc3RyaW5nKS50b0xvd2VyQ2FzZSgpID09PSBcInRydWVcIikge1xuICAgICAgICBpZiAodHlwZW9mIHRvTG9hZC5wcmVwcm9jZXNzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgY29uc3QgcHJlcHJvY2Vzc1ZhbHVlID0gKHRvTG9hZC5wcmVwcm9jZXNzIGFzIHN0cmluZykudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgIGFqYXhIZWFkZXJzW1wiWC1QcmVwcm9jZXNzXCJdID0gcHJlcHJvY2Vzc1ZhbHVlID09PSBcInRydWVcIiB8fCBwcmVwcm9jZXNzVmFsdWUgPT09IFwidFwiID8gXCJ0cnVlXCIgOiBcImZhbHNlXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWpheEhlYWRlcnNbXCJYLVByZXByb2Nlc3NcIl0gPSAodG9Mb2FkLnByZXByb2Nlc3MgYXMgYm9vbGVhbikgPyBcInRydWVcIiA6IFwiZmFsc2VcIjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBTZXQgUHJlcHJvY2Vzc2luZy1IZWFkZXIsIGlmIGRlZmluZWQgaW4gcGFzc2VkIHBhcmFtZXRlci5cbiAgICAgIC8vICNyZWdpb24gUXVldWUgYmFkZ2UgY29uZmlndXJhdGlvbi5cbiAgICAgIGNvbnN0IG9jclF1ZXVlT3ZlcnJpZGU6IGJvb2xlYW4gfCBudWxsID0gdG9Mb2FkLnF1ZXVlYmFkZ2UgIT0gbnVsbCA/IFN0cmluZyh0b0xvYWQucXVldWViYWRnZSkgIT09IFwiZmFsc2VcIiA6IG51bGw7XG4gICAgICBjb25zdCBvY3JRdWV1ZVRleHQ6IHN0cmluZyA9IHRvTG9hZC5xdWV1ZXRleHQgIT0gbnVsbCA/IFN0cmluZyh0b0xvYWQucXVldWV0ZXh0KSA6IFwiXCI7XG4gICAgICBsZXQgb2NyUXVldWVCYWRnZUVsOiBIVE1MU3BhbkVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICAgICAgY29uc3Qgc2hvd09jclF1ZXVlQmFkZ2UgPSAocG9zaXRpb246IG51bWJlciwgZXN0aW1hdGVkV2FpdE1zPzogbnVtYmVyIHwgbnVsbCkgPT4ge1xuICAgICAgICBpZiAoIW9jclF1ZXVlQmFkZ2VFbCkge1xuICAgICAgICAgIG9jclF1ZXVlQmFkZ2VFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgIG9jclF1ZXVlQmFkZ2VFbC5jbGFzc05hbWUgPSBcIk9DUl9RdWV1ZUJhZGdlXCI7XG4gICAgICAgICAgb2NyUXVldWVCYWRnZUVsLnN0eWxlLmNzc1RleHQgPVxuICAgICAgICAgICAgXCJkaXNwbGF5OmlubGluZS1mbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6NHB4O21hcmdpbi1sZWZ0OjZweDtwYWRkaW5nOjJweCA4cHg7Ym9yZGVyLXJhZGl1czoxMHB4O2JhY2tncm91bmQ6I2QwZTBmZjtjb2xvcjojMWE1YWFiO2ZvbnQtc2l6ZToxMnB4O2ZvbnQtd2VpZ2h0OjYwMDt3aGl0ZS1zcGFjZTpub3dyYXA7XCI7XG4gICAgICAgICAgbGFiZWw/LmFwcGVuZENoaWxkKG9jclF1ZXVlQmFkZ2VFbCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgd2FpdExhYmVsID0gZm9ybWF0V2FpdFRpbWUoZXN0aW1hdGVkV2FpdE1zKTtcbiAgICAgICAgb2NyUXVldWVCYWRnZUVsLnRleHRDb250ZW50ID0gYCR7cG9zaXRpb259JHt3YWl0TGFiZWwgPyBgICR7d2FpdExhYmVsfWAgOiBcIlwifSR7b2NyUXVldWVUZXh0ID8gYCAke29jclF1ZXVlVGV4dH1gIDogXCJcIn1gO1xuICAgICAgfTtcblxuICAgICAgY29uc3QgaGlkZU9jclF1ZXVlQmFkZ2UgPSAoKSA9PiB7XG4gICAgICAgIG9jclF1ZXVlQmFkZ2VFbD8ucmVtb3ZlKCk7XG4gICAgICAgIG9jclF1ZXVlQmFkZ2VFbCA9IG51bGw7XG4gICAgICB9O1xuICAgICAgLy8gI2VuZHJlZ2lvbiBRdWV1ZSBiYWRnZSBjb25maWd1cmF0aW9uLlxuICAgICAgbGV0IG9jclF1ZXVlVGlja2V0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICAgICAgY29uc3Qgc2VuZE9jclJlcXVlc3QgPSAoKSA9PiB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgdXJsOiBgJHt3aW5kb3cuY29kYmkuYmFzZVVSTH1wbHVnaW4/bmFtZT1Db2RCaV9BSV9UZXNzZXJhY3RgLFxuICAgICAgICAgIHR5cGU6IFwiUE9TVFwiLFxuICAgICAgICAgIGRhdGE6IGZvcm1EYXRhLFxuICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgIGhlYWRlcnM6IGFqYXhIZWFkZXJzLFxuICAgICAgICAgIGJlZm9yZVNlbmQ6ICh4aHIpID0+IHtcbiAgICAgICAgICAgIGlmIChvY3JRdWV1ZVRpY2tldCkge1xuICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIlgtUXVldWUtVGlja2V0XCIsIG9jclF1ZXVlVGlja2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHN1Y2Nlc3M6IChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VkUmVzcG9uc2UgPSB0eXBlb2YgcmVzcG9uc2UgPT09IFwic3RyaW5nXCIgPyBKU09OLnBhcnNlKHJlc3BvbnNlKSA6IHJlc3BvbnNlO1xuXG4gICAgICAgICAgICBpZiAocGFyc2VkUmVzcG9uc2UucXVldWVkKSB7XG4gICAgICAgICAgICAgIG9jclF1ZXVlVGlja2V0ID0gcGFyc2VkUmVzcG9uc2UucXVldWVUaWNrZXQgPz8gb2NyUXVldWVUaWNrZXQ7XG4gICAgICAgICAgICAgIGNvbnN0IGJhZGdlRW5hYmxlZCA9IG9jclF1ZXVlT3ZlcnJpZGUgIT0gbnVsbCA/IG9jclF1ZXVlT3ZlcnJpZGUgOiAhIXBhcnNlZFJlc3BvbnNlLnF1ZXVlQmFkZ2U7XG4gICAgICAgICAgICAgIGlmIChiYWRnZUVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICBzaG93T2NyUXVldWVCYWRnZShwYXJzZWRSZXNwb25zZS5wb3NpdGlvbiA/PyAwLCBwYXJzZWRSZXNwb25zZS5lc3RpbWF0ZWRXYWl0TXMpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoc2VuZE9jclJlcXVlc3QsIDEwMDApO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBoaWRlT2NyUXVldWVCYWRnZSgpO1xuICAgICAgICAgICAgb2NyUXVldWVUaWNrZXQgPSBudWxsO1xuICAgICAgICAgICAgY29uc3QgbWVyZ2VkUmVzcG9uc2UgPSB7IC4uLmNsaWVudFNpZGVSZXNwb25zZSwgLi4ucGFyc2VkUmVzcG9uc2UgfTtcblxuICAgICAgICAgICAgQUlfT0NSLmhhbmRsZVJlc3BvbnNlKG1lcmdlZFJlc3BvbnNlLCB0b0xvYWQsIHRvUHJvY2VzcywgdG9Mb2FkLmludmFsaWRpbWFnZXRleHQgYXMgc3RyaW5nLCAkKTtcbiAgICAgICAgICAgIHVuYW5pbWF0ZSgpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZXJyb3I6ICh4aHIsIHN0YXR1cywgZXJyb3IpID0+IHtcbiAgICAgICAgICAgIGhpZGVPY3JRdWV1ZUJhZGdlKCk7XG4gICAgICAgICAgICB1bmFuaW1hdGUoKTtcblxuICAgICAgICAgICAgdGhyb3cgbmV3IENvZEJpRXJyb3IoYFx1Mjc0QyBUZXNzZXJhY3QgQUkgT0NSIHJlcXVlc3QgZmFpbGVkIHdpdGggc3RhdHVzICgke3N0YXR1c30pIGR1ZSB0bzogJHtlcnJvcn1gKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgICBzZW5kT2NyUmVxdWVzdCgpO1xuICAgICAgLy8gI2VuZHJlZ2lvbiBTZW5kIHRoZSByZXF1ZXN0IHRvIHRoZSBUZXNzZXJhY3QgQUkgT0NSIEFQSVxuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBEb3duc2NhbGVzIGFuIGltYWdlIHRvIG9wdGltYWwgcmVzb2x1dGlvbiBmb3IgT0NSIHByb2Nlc3NpbmcuXG4gICAqIFRhcmdldDogbWF4IDIwNDhweCBvbiBsb25nZXN0IGVkZ2UgZm9yIGdvb2QgT0NSIGFjY3VyYWN5IHdpdGggZmFzdGVyIHByb2Nlc3NpbmcuXG4gICAqXG4gICAqIEBwYXJhbSBmaWxlIC0gVGhlIGltYWdlIGZpbGUgdG8gZG93bnNjYWxlXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgcmVzb2x2aW5nIHRvIGRvd25zY2FsZWQgQmxvYiBvciBvcmlnaW5hbCBmaWxlIGlmIGFscmVhZHkgb3B0aW1hbFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgZG93bnNjYWxlSW1hZ2VGb3JPQ1IoZmlsZTogRmlsZSk6IFByb21pc2U8QmxvYj4ge1xuICAgIGNvbnN0IE1BWF9ESU1FTlNJT04gPSAyMDQ4O1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIGNvbnN0IHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoZmlsZSk7XG5cbiAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcblxuICAgICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IGltZztcbiAgICAgICAgY29uc3QgbWF4RGltID0gTWF0aC5tYXgod2lkdGgsIGhlaWdodCk7XG5cbiAgICAgICAgaWYgKG1heERpbSA8PSBNQVhfRElNRU5TSU9OKSB7XG4gICAgICAgICAgcmVzb2x2ZShmaWxlKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzY2FsZSA9IE1BWF9ESU1FTlNJT04gLyBtYXhEaW07XG4gICAgICAgIGNvbnN0IG5ld1dpZHRoID0gTWF0aC5yb3VuZCh3aWR0aCAqIHNjYWxlKTtcbiAgICAgICAgY29uc3QgbmV3SGVpZ2h0ID0gTWF0aC5yb3VuZChoZWlnaHQgKiBzY2FsZSk7XG5cbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgICAgICAgY2FudmFzLndpZHRoID0gbmV3V2lkdGg7XG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBuZXdIZWlnaHQ7XG5cbiAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICAgICAgY3R4LmRyYXdJbWFnZShpbWcsIDAsIDAsIG5ld1dpZHRoLCBuZXdIZWlnaHQpO1xuXG4gICAgICAgIGNhbnZhcy50b0Jsb2IoXG4gICAgICAgICAgKGJsb2IpID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUoYmxvYiB8fCBmaWxlKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGZpbGUudHlwZS5zdGFydHNXaXRoKFwiaW1hZ2UvcG5nXCIpID8gXCJpbWFnZS9wbmdcIiA6IFwiaW1hZ2UvanBlZ1wiLFxuICAgICAgICAgIDAuOTIsXG4gICAgICAgICk7XG4gICAgICB9O1xuXG4gICAgICBpbWcub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xuICAgICAgICByZXNvbHZlKGZpbGUpO1xuICAgICAgfTtcblxuICAgICAgaW1nLnNyYyA9IHVybDtcbiAgICB9KTtcbiAgfVxuICAvKiogU3RhdGVzIHdoZXRoZXIgdGhlIFBERi5qcyB3b3JrZXIgaXMgY29uZmlndXJlZCB3aXRoIHRoZSBjb3JyZWN0IFVSTCBvciBub3QuICovXG4gIHByaXZhdGUgc3RhdGljIHBkZkpzV29ya2VyQ29uZmlndXJlZCA9IGZhbHNlO1xuICAvKipcbiAgICogRW5zdXJlcyB0aGUgUERGLmpzIHdvcmtlciBpcyBjb25maWd1cmVkIHdpdGggdGhlIGNvcnJlY3QgVVJMLlxuICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgYmVmb3JlIHByb2Nlc3NpbmcgUERGIGZpbGVzIHRvIHNldCB1cCB0aGUgd2ViIHdvcmtlclxuICAgKiB0aGF0IGhhbmRsZXMgUERGIHBhcnNpbmcgaW4gYSBzZXBhcmF0ZSB0aHJlYWQuIFRoZSB3b3JrZXIgZmlsZSBpcyBsb2FkZWRcbiAgICogZnJvbSBGb3JtQ3ljbGUgcGx1Z2luIHJlc291cmNlcyBhbmQgb25seSBjb25maWd1cmVkIG9uY2UgcGVyIHNlc3Npb24uXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoZSB3b3JrZXIgY29uZmlndXJhdGlvbiBpcyBjYWNoZWQgdXNpbmcgdGhlIHN0YXRpYyBmbGFnIHtAbGluayBBSV9PQ1IucGRmSnNXb3JrZXJDb25maWd1cmVkIH0gdG8gYXZvaWQgcmVkdW5kYW50XG4gICAqIGNvbmZpZ3VyYXRpb24gY2FsbHMuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBlbnN1cmVQZGZKc1dvcmtlckNvbmZpZ3VyZWQoKTogdm9pZCB7XG4gICAgaWYgKEFJX09DUi5wZGZKc1dvcmtlckNvbmZpZ3VyZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBwZGZqc0xpYi5HbG9iYWxXb3JrZXJPcHRpb25zLndvcmtlclNyYyA9IGAke3dpbmRvdy5jb2RiaS5iYXNlVVJMfXBsdWdpbj9uYW1lPVJlc291cmNlJlBhdGg9L2NvbS9naXRodWIveGltYV9mb3JtY3ljbGVfZW50d2lja2xlcmtyZWlzL2ZjL3BsdWdpbi9jb2RiaS9wZGYud29ya2VyLm1pbi5qc2A7XG5cbiAgICBBSV9PQ1IucGRmSnNXb3JrZXJDb25maWd1cmVkID0gdHJ1ZTtcblxuICAgIHdpbmRvdy5jb2RiaS5sb2coXCJJTkZPXCIsIGBQREYuanMgd29ya2VyIGNvbmZpZ3VyZWQ6ICR7cGRmanNMaWIuR2xvYmFsV29ya2VyT3B0aW9ucy53b3JrZXJTcmN9YCwgXCJBSSAvIE9DUlwiKTtcbiAgfVxuICAvKipcbiAgICogUHJvY2Vzc2VzIGEgUERGIGZpbGUgdG8gZXh0cmFjdCB0ZXh0IG9yIGltYWdlcy5cbiAgICpcbiAgICogQHBhcmFtIGZpbGUgLSBUaGUgUERGIGZpbGUgdG8gcHJvY2Vzc1xuICAgKiBAcGFyYW0gbWF4UGFnZXMgLSBNYXhpbXVtIG51bWJlciBvZiBwYWdlcyB0byBwcm9jZXNzXG4gICAqXG4gICAqIEByZXR1cm5zIE9iamVjdCBjb250YWluaW5nIGVpdGhlciBleHRyYWN0ZWQgdGV4dCBvciByZW5kZXJlZCBpbWFnZXNcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIHByb2Nlc3NQZGZGaWxlKFxuICAgIGZpbGU6IEZpbGUsXG4gICAgbWF4UGFnZXM6IG51bWJlcixcbiAgKTogUHJvbWlzZTx7IGhhc1RleHQ6IGJvb2xlYW47IHRleHQ/OiBzdHJpbmc7IGltYWdlcz86IEJsb2JbXSB9PiB7XG4gICAgY29uc3QgYXJyYXlCdWZmZXIgPSBhd2FpdCBmaWxlLmFycmF5QnVmZmVyKCk7XG4gICAgY29uc3QgcGRmOiBQREZEb2N1bWVudFByb3h5ID0gYXdhaXQgcGRmanNMaWIuZ2V0RG9jdW1lbnQoeyBkYXRhOiBhcnJheUJ1ZmZlciB9KS5wcm9taXNlO1xuICAgIGNvbnN0IG51bVBhZ2VzID0gTWF0aC5taW4ocGRmLm51bVBhZ2VzLCBtYXhQYWdlcyk7XG4gICAgbGV0IGZ1bGxUZXh0ID0gXCJcIjtcbiAgICBjb25zdCBpbWFnZXM6IEJsb2JbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgcGFnZU51bSA9IDE7IHBhZ2VOdW0gPD0gbnVtUGFnZXM7IHBhZ2VOdW0rKykge1xuICAgICAgY29uc3QgcGFnZTogUERGUGFnZVByb3h5ID0gYXdhaXQgcGRmLmdldFBhZ2UocGFnZU51bSk7XG4gICAgICBjb25zdCB0ZXh0Q29udGVudCA9IGF3YWl0IHBhZ2UuZ2V0VGV4dENvbnRlbnQoKTtcbiAgICAgIGNvbnN0IHBhZ2VUZXh0ID0gdGV4dENvbnRlbnQuaXRlbXMubWFwKChpdGVtKSA9PiAoXCJzdHJcIiBpbiBpdGVtID8gaXRlbS5zdHIgOiBcIlwiKSkuam9pbihcIiBcIik7XG5cbiAgICAgIGZ1bGxUZXh0ICs9IGAke3BhZ2VUZXh0fVxcbmA7XG4gICAgfVxuXG4gICAgY29uc3QgaGFzVGV4dCA9IGZ1bGxUZXh0LnRyaW0oKS5sZW5ndGggPiAwO1xuXG4gICAgaWYgKCFoYXNUZXh0KSB7XG4gICAgICBmb3IgKGxldCBwYWdlTnVtID0gMTsgcGFnZU51bSA8PSBudW1QYWdlczsgcGFnZU51bSsrKSB7XG4gICAgICAgIGNvbnN0IHBhZ2U6IFBERlBhZ2VQcm94eSA9IGF3YWl0IHBkZi5nZXRQYWdlKHBhZ2VOdW0pO1xuICAgICAgICBjb25zdCB2aWV3cG9ydCA9IHBhZ2UuZ2V0Vmlld3BvcnQoeyBzY2FsZTogMi4wIH0pO1xuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcblxuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gdmlld3BvcnQuaGVpZ2h0O1xuICAgICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgICBhd2FpdCBwYWdlLnJlbmRlcih7IGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsIHZpZXdwb3J0IH0pLnByb21pc2U7XG5cbiAgICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IG5ldyBQcm9taXNlPEJsb2I+KChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgY2FudmFzLnRvQmxvYigoYikgPT4gcmVzb2x2ZShiKSwgXCJpbWFnZS9wbmdcIik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGltYWdlcy5wdXNoKGJsb2IpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7IGhhc1RleHQsIHRleHQ6IGZ1bGxUZXh0LCBpbWFnZXMgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzZXMgZXh0cmFjdGVkIFBERiB0ZXh0IGNsaWVudC1zaWRlIHVzaW5nIHBhdHRlcm5zLlxuICAgKlxuICAgKiBAcGFyYW0gcGRmVGV4dFJlc3VsdHMgIE9iamVjdCBtYXBwaW5nIGZpbGVuYW1lcyB0byBleHRyYWN0ZWQgdGV4dFxuICAgKiBAcGFyYW0gbW9kZSAgICAgICAgICAgIFRoZSBtb2RlIChwcmludCwgdmVyaWZ5LCBleHRyYWN0IGZpZWxkcylcbiAgICogQHBhcmFtIHBhdHRlcm4gICAgICAgICBUaGUgcGF0dGVybiB0byBtYXRjaCAoZm9yIHZlcmlmeSBtb2RlKVxuICAgKiBAcGFyYW0gZmllbGRQYXR0ZXJucyAgIEZpZWxkIHBhdHRlcm5zIGZvciBleHRyYWN0IGZpZWxkcyBtb2RlXG4gICAqIEBwYXJhbSByZWdleEZsYWdzICAgICAgT3B0aW9uYWwgcmVnZXggZmxhZ3NcbiAgICpcbiAgICogQHJldHVybnMgUHJvY2Vzc2VkIHJlc3VsdHMgb2JqZWN0XG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBwcm9jZXNzVGV4dENsaWVudFNpZGUoXG4gICAgcGRmVGV4dFJlc3VsdHM6IHsgW2ZpbGVuYW1lOiBzdHJpbmddOiBzdHJpbmcgfSxcbiAgICBtb2RlOiBzdHJpbmcsXG4gICAgcGF0dGVybj86IHN0cmluZyxcbiAgICBmaWVsZFBhdHRlcm5zPzogQXJyYXk8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT4sXG4gICAgcmVnZXhGbGFncz86IHN0cmluZyxcbiAgKTogeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH0ge1xuICAgIGNvbnN0IHJlc3VsdHM6IHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9ID0ge307XG5cbiAgICBmb3IgKGNvbnN0IFtmaWxlbmFtZSwgdGV4dF0gb2YgT2JqZWN0LmVudHJpZXMocGRmVGV4dFJlc3VsdHMpKSB7XG4gICAgICBzd2l0Y2ggKG1vZGUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICBjYXNlIFwicHJpbnRcIjpcbiAgICAgICAgICByZXN1bHRzW2ZpbGVuYW1lXSA9IHRleHQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJ2ZXJpZnlcIjpcbiAgICAgICAgICBpZiAocGF0dGVybikge1xuICAgICAgICAgICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKHBhdHRlcm4sIHJlZ2V4RmxhZ3MgfHwgXCJcIik7XG4gICAgICAgICAgICByZXN1bHRzW2ZpbGVuYW1lXSA9IHJlZ2V4LnRlc3QodGV4dCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZXh0cmFjdCBmaWVsZHNcIjpcbiAgICAgICAgICBpZiAoZmllbGRQYXR0ZXJucykge1xuICAgICAgICAgICAgY29uc3QgZmllbGRSZXN1bHRzOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZ1tdIH0gPSB7fTtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBmaWVsZFBhdHRlcm4gb2YgZmllbGRQYXR0ZXJucykge1xuICAgICAgICAgICAgICBmb3IgKGNvbnN0IFtmaWVsZE5hbWUsIGZpZWxkUGF0dGVyblN0cl0gb2YgT2JqZWN0LmVudHJpZXMoZmllbGRQYXR0ZXJuKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlY29kZWRQYXR0ZXJuID0gZGVjb2RlVVJJQ29tcG9uZW50KGZpZWxkUGF0dGVyblN0cik7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKGRlY29kZWRQYXR0ZXJuLCByZWdleEZsYWdzIHx8IFwiXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHJlZ2V4KTtcblxuICAgICAgICAgICAgICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoIWZpZWxkUmVzdWx0c1tmaWVsZE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkUmVzdWx0c1tmaWVsZE5hbWVdID0gW107XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBmaWVsZFJlc3VsdHNbZmllbGROYW1lXS5wdXNoKC4uLm1hdGNoZXMuc2xpY2UoMSkuZmlsdGVyKEJvb2xlYW4pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzdWx0c1tmaWxlbmFtZV0gPSBmaWVsZFJlc3VsdHM7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgdGhlIE9DUiByZXNwb25zZSBhbmQgdXBkYXRlcyB0aGUgVUkgYWNjb3JkaW5nbHkuXG4gICAqXG4gICAqIEBwYXJhbSByZXNwb25zZSAgICAgICAgICAgVGhlIE9DUiByZXNwb25zZSBkYXRhXG4gICAqIEBwYXJhbSB0b0xvYWQgICAgICAgICAgICAgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAgICogQHBhcmFtIHRvUHJvY2VzcyAgICAgICAgICBUaGUgSFRNTCBlbGVtZW50IGJlaW5nIHByb2Nlc3NlZFxuICAgKiBAcGFyYW0gdHNJbnZhbGlkaW1hZ2V0ZXh0IEVycm9yIG1lc3NhZ2UgZm9yIGludmFsaWQgaW1hZ2VzXG4gICAqIEBwYXJhbSAkICAgICAgICAgICAgICAgICAgalF1ZXJ5IGluc3RhbmNlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBoYW5kbGVSZXNwb25zZShcbiAgICByZXNwb25zZTogdW5rbm93bixcbiAgICB0b0xvYWQ6IHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9LFxuICAgIHRvUHJvY2VzczogRWxlbWVudCxcbiAgICB0c0ludmFsaWRpbWFnZXRleHQ6IHN0cmluZyxcbiAgICAkOiBKUXVlcnlTdGF0aWMsXG4gICk6IHZvaWQge1xuICAgIGlmICgodG9Mb2FkLm1vZGUgYXMgc3RyaW5nKS50b0xvd2VyQ2FzZSgpID09PSBcInByaW50XCIpIHtcbiAgICAgIGNvbnN0IHBhcmVudDIgPSB0b1Byb2Nlc3MucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudCB8fCBudWxsO1xuXG4gICAgICBpZiAocGFyZW50Mikge1xuICAgICAgICBjb25zdCByZWNlaXZlckVsZW0gPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxUZXh0QXJlYUVsZW1lbnQgfCBudWxsPihcbiAgICAgICAgICBwYXJlbnQyLnF1ZXJ5U2VsZWN0b3IoXCIuQ29kQmlfQUlfT0NSX1JlY2VpdmVyXCIpLFxuICAgICAgICAgIEhUTUxUZXh0QXJlYUVsZW1lbnQsXG4gICAgICAgICAgXCJUaGUgcmVjZWl2ZXIgZWxlbWVudCBmb3IgdGhlIE9DUiByZXN1bHRzIGluIFByaW50LU1vZGUgaGFzIHRvIGJlIGEgPHRleHRhcmVhPi5cIixcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAocmVjZWl2ZXJFbGVtKSB7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlVGV4dCA9IFwiXCI7XG4gICAgICAgICAgbGV0IHJlc3BvbnNlS2V5cyA9IFtdO1xuICAgICAgICAgIGxldCB0ZXh0VmFsdWVzID0gW107XG4gICAgICAgICAgc3dpdGNoICh0eXBlb2YgcmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgICAgICAgICAgcmVzcG9uc2VUZXh0ID0gcmVzcG9uc2U7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgICAgICAgICBpZiAocmVzcG9uc2UgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXNwb25zZUtleXMgPSBPYmplY3Qua2V5cyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgdGV4dFZhbHVlcyA9IE9iamVjdC52YWx1ZXMocmVzcG9uc2UpLm1hcCgodmFsKSA9PlxuICAgICAgICAgICAgICAgICAgdHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIiA/IHZhbCA6IEpTT04uc3RyaW5naWZ5KHZhbCksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXNwb25zZVRleHQgPSB0ZXh0VmFsdWVzLmpvaW4oXCJcXG5cXG5cIik7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2VUZXh0ID0gSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgcmVzcG9uc2VUZXh0ID0gSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZWNlaXZlckVsZW0udmFsdWUgPSByZXNwb25zZVRleHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgd2luZG93LmNvZGJpLmxvZyhcbiAgICAgICAgICAgIFwiSU5GT1wiLFxuICAgICAgICAgICAgYFJlY2VpdmVyIGVsZW1lbnQgd2l0aCBjbGFzcyAnQ29kQmlfQUlfVGVzc2VyYWN0X1JlY2VpdmVyJyBub3QgZm91bmQgaW4gIyR7dG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJpZFwiKX0uYCxcbiAgICAgICAgICAgIFwiQUkgLyBPQ1JcIixcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gUHJpbnQgbW9kZTogUGxhY2UgcmVzdWx0KHMpIGluIDx0ZXh0YXJlYT5cbiAgICAvLyAjcmVnaW9uIEV4dHJhY3QgZmllbGRzIG1vZGU6IFNldCB2YWx1ZXMgb24gb2YgQ1NTLUNsYXNzIFwiQ29kQmlfQUlfT0NSX1JlY2VpdmVyXCJcbiAgICBpZiAoXG4gICAgICAodG9Mb2FkLm1vZGUgYXMgc3RyaW5nKS50b0xvd2VyQ2FzZSgpID09PSBcImV4dHJhY3QgZmllbGRzXCIgJiZcbiAgICAgIHR5cGVvZiByZXNwb25zZSA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgcmVzcG9uc2UgIT09IG51bGxcbiAgICApIHtcbiAgICAgIGNvbnN0IHBhcmVudDMgPSB0b1Byb2Nlc3MucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudCB8fCBudWxsO1xuXG4gICAgICBpZiAocGFyZW50Mykge1xuICAgICAgICBjb25zdCByZWNlaXZlcnMgPSBwYXJlbnQzLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuQ29kQmlfQUlfT0NSX1JlY2VpdmVyXCIpO1xuXG4gICAgICAgIGZvciAoY29uc3QgZWxlbSBvZiByZWNlaXZlcnMpIHtcbiAgICAgICAgICBjb25zdCBmaWVsZCA9IChlbGVtIGFzIEhUTUxFbGVtZW50KS5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNiLUZpZWxkXCIpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICBpZiAoZmllbGQpIHtcbiAgICAgICAgICAgIGNvbnN0IHNlcGFyYXRvciA9IHRvTG9hZC5zZXBhcmF0b3IgPyAodG9Mb2FkLnNlcGFyYXRvciBhcyBzdHJpbmcpIDogXCIsXCI7XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0ZWRWYWx1ZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgZmlsZUtleSBpbiByZXNwb25zZSkge1xuICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHJlc3BvbnNlLCBmaWxlS2V5KSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVEYXRhID0gcmVzcG9uc2VbZmlsZUtleV07XG5cbiAgICAgICAgICAgICAgICBpZiAoZmlsZURhdGEgJiYgdHlwZW9mIGZpbGVEYXRhID09PSBcIm9iamVjdFwiICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChmaWxlRGF0YSwgZmllbGQpKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZFZhbHVlID0gZmlsZURhdGFbZmllbGRdO1xuXG4gICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShmaWVsZFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0ZWRWYWx1ZXMucHVzaCguLi5maWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGZpZWxkVmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdGVkVmFsdWVzLnB1c2goZmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjb2xsZWN0ZWRWYWx1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICBjb25zdCBqb2luZWRWYWx1ZSA9IGNvbGxlY3RlZFZhbHVlcy5qb2luKHNlcGFyYXRvcik7XG5cbiAgICAgICAgICAgICAgaWYgKFwidmFsdWVcIiBpbiBlbGVtKSB7XG4gICAgICAgICAgICAgICAgSU5TVEFOQ0UudHNDaGVja011bHRpPEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MVGV4dEFyZWFFbGVtZW50PihcbiAgICAgICAgICAgICAgICAgIGVsZW0sXG4gICAgICAgICAgICAgICAgICBbSFRNTElucHV0RWxlbWVudCwgSFRNTFRleHRBcmVhRWxlbWVudF0sXG4gICAgICAgICAgICAgICAgICBcIlRoZSBPQ1IgcmVjZWl2ZXIgZWxlbWVudCBoYXMgdG8gYmUgYW4gPGlucHV0PiBvciA8dGV4dGFyZWE+IHdoZW4gaW4gRXh0cmFjdCBGaWVsZHMgbW9kZS5cIixcbiAgICAgICAgICAgICAgICApLnZhbHVlID0gam9pbmVkVmFsdWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxlbS50ZXh0Q29udGVudCA9IGpvaW5lZFZhbHVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gRXh0cmFjdCBmaWVsZHMgbW9kZTogU2V0IHZhbHVlcyBvbiBvZiBDU1MtQ2xhc3MgXCJDb2RCaV9BSV9PQ1JfUmVjZWl2ZXJcIlxuICAgIC8vICNyZWdpb24gVmFsaWRhdGUgdmVyaWZ5IG1vZGUgcmVzdWx0c1xuICAgIGlmICgodG9Mb2FkLm1vZGUgYXMgc3RyaW5nKS50b0xvd2VyQ2FzZSgpID09PSBcInZlcmlmeVwiKSB7XG4gICAgICBpZiAoT2JqZWN0LnZhbHVlcyhyZXNwb25zZSBhcyB7IFtrZXk6IHN0cmluZ106IGJvb2xlYW4gfSkuc29tZSgocmVzdWx0KSA9PiByZXN1bHQgPT09IGZhbHNlKSkge1xuICAgICAgICAkKHRvUHJvY2VzcykuZXJyb3IodHNJbnZhbGlkaW1hZ2V0ZXh0KTtcbiAgICAgICAgLy8gI3JlZ2lvbiBBZGQgc3R5bGVzIGZvciBtYW51YWwgdmVyaWZpY2F0aW9uIGNoZWNrYm94XG4gICAgICAgIGlmICghdG9Qcm9jZXNzLnF1ZXJ5U2VsZWN0b3IoXCIjQ29kQmlfQUlfT0NSX01hbnVhbFZlcmlmeV9TdHlsZXNcIikpIHtcbiAgICAgICAgICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICAgICAgICBzdHlsZS50ZXh0Q29udGVudCA9IGBcbiAgICAgICAgICAgIC5Db2RCaV9BSV9PQ1JfTWFudWFsVmVyaWZ5IHsgZGlzcGxheTogZmxleCA7IGFsaWduLWl0ZW1zOiBjZW50ZXIgOyBtYXJnaW4tdG9wOiA4cHggOyBnYXA6IDhweCA7XG4gICAgICAgICAgICAgIGZsZXgtd3JhcDogbm93cmFwIDt9XG4gICAgICAgICAgICAuQ29kQmlfQUlfT0NSX01hbnVhbFZlcmlmeV9DaGVja2JveCB7IGN1cnNvcjogcG9pbnRlciA7IG9wYWNpdHk6IDEgIWltcG9ydGFudCA7IHBvc2l0aW9uOiByZWxhdGl2ZSAhaW1wb3J0YW50IDtcbiAgICAgICAgICAgICAgZmxleC1zaHJpbms6IDAgO31cbiAgICAgICAgICAgIC5Db2RCaV9BSV9PQ1JfTWFudWFsVmVyaWZ5IGxhYmVsIHsgbWFyZ2luLWJvdHRvbTogMCA7IHBvc2l0aW9uOiByZWxhdGl2ZSAhaW1wb3J0YW50IDt9XG4gICAgICAgICAgICBAa2V5ZnJhbWVzIGhpZ2hsaWdodCB7XG4gICAgICAgICAgICAgIDAlICAgIHsgb3BhY2l0eToxOyB9XG4gICAgICAgICAgICAgIDUwJSAgIHsgb3BhY2l0eTowOyB9XG4gICAgICAgICAgICAgIDEwMCUgIHsgb3BhY2l0eToxOyB9fVxuICAgICAgICAgICAgLkNvZEJpX0FJX09DUl9NYW51YWxWZXJpZnkgbGFiZWwgc3BhbiB7IGZvbnQtd2VpZ2h0OiBib2xkIDsgY29sb3I6IGRhcmtvcmFuZ2UgO1xuICAgICAgICAgICAgICBhbmltYXRpb246IGhpZ2hsaWdodCAycyBlYXNlLWluLW91dCBpbmZpbml0ZSA7fWA7XG4gICAgICAgICAgdG9Qcm9jZXNzLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICAgICAgfVxuICAgICAgICAvLyAjZW5kcmVnaW9uIEFkZCBzdHlsZXMgZm9yIG1hbnVhbCB2ZXJpZmljYXRpb24gY2hlY2tib3hcbiAgICAgICAgLy8gI3JlZ2lvbiBSZW1vdmUgZXhpc3RpbmcgbWFudWFsIHZlcmlmeSBjaGVja2JveFxuICAgICAgICBjb25zdCBleGlzdGluZ01hbnVhbFZlcmlmeSA9XG4gICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLkNvZEJpX0FJX09DUl9NYW51YWxWZXJpZnlcIik7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXhpc3RpbmdNYW51YWxWZXJpZnkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBleGlzdGluZ01hbnVhbFZlcmlmeVtpXS5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyAjZW5kcmVnaW9uIFJlbW92ZSBleGlzdGluZyBtYW51YWwgdmVyaWZ5IGNoZWNrYm94XG4gICAgICAgIC8vICNyZWdpb24gQ3JlYXRlIGNoZWNrYm94IGZvciBtYW51YWwgdmVyaWZpY2F0aW9uXG4gICAgICAgIGNvbnN0IGNoZWNrYm94Q29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgY2hlY2tib3hDb250YWluZXIuY2xhc3NOYW1lID0gXCJDb2RCaV9BSV9PQ1JfTWFudWFsVmVyaWZ5XCI7XG4gICAgICAgIGNoZWNrYm94Q29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIjtcbiAgICAgICAgY2hlY2tib3hDb250YWluZXIuc3R5bGUuYWxpZ25JdGVtcyA9IFwiY2VudGVyXCI7XG4gICAgICAgIGNoZWNrYm94Q29udGFpbmVyLnN0eWxlLm1hcmdpblRvcCA9IFwiOHB4XCI7XG4gICAgICAgIGNoZWNrYm94Q29udGFpbmVyLnN0eWxlLmdhcCA9IFwiOHB4XCI7XG4gICAgICAgIGNvbnN0IGNoZWNrYm94ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuICAgICAgICBjaGVja2JveC50eXBlID0gXCJjaGVja2JveFwiO1xuICAgICAgICBjaGVja2JveC5pZCA9IGBtYW51YWwtdmVyaWZ5LSR7dG9Qcm9jZXNzLmlkfWA7XG4gICAgICAgIGNoZWNrYm94LmNsYXNzTmFtZSA9IFwiQ29kQmlfQUlfT0NSX01hbnVhbFZlcmlmeV9DaGVja2JveFwiO1xuICAgICAgICBjb25zdCBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsYWJlbFwiKTtcbiAgICAgICAgbGFiZWwuaHRtbEZvciA9IGNoZWNrYm94LmlkO1xuICAgICAgICBsYWJlbC50ZXh0Q29udGVudCA9IHRvTG9hZC53cm9uZ2ZpbGVtZXNzYWdlXG4gICAgICAgICAgPyAodG9Mb2FkLndyb25nZmlsZW1lc3NhZ2UgYXMgc3RyaW5nKVxuICAgICAgICAgIDogXCJUaGUgY29udGVudCBpcyBub3QgYXMgZXhwZWN0ZWQuIFBsZWFzZSBjaGVjayBpZiB5b3Ugc2VsZWN0ZWQgdGhlIGNvcnJlY3QgZmlsZShzKS4gWW91IG1heSBtYW51YWxseSB2ZXJpZnkgdGhhdCBpdCBpcyB0aGUgY29ycmVjdCBvbmUgYnkgY2xpY2tpbmcgdGhlIGNoZWNrYm94LlwiO1xuICAgICAgICBsYWJlbC5zdHlsZS5tYXJnaW5Cb3R0b20gPSBcIjBcIjtcbiAgICAgICAgY2hlY2tib3hDb250YWluZXIuYXBwZW5kQ2hpbGQoY2hlY2tib3gpO1xuICAgICAgICBjaGVja2JveENvbnRhaW5lci5hcHBlbmRDaGlsZChsYWJlbCk7XG4gICAgICAgIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50Lmluc2VydEFkamFjZW50RWxlbWVudChcImFmdGVyZW5kXCIsIGNoZWNrYm94Q29udGFpbmVyKTtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBDcmVhdGUgY2hlY2tib3ggZm9yIG1hbnVhbCB2ZXJpZmljYXRpb25cbiAgICAgICAgLy8gI3JlZ2lvbiBIYW5kbGUgY2hlY2tib3ggY2hhbmdlXG4gICAgICAgIGNoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgICAgIGlmIChjaGVja2JveC5jaGVja2VkKSB7XG4gICAgICAgICAgICAkKHRvUHJvY2VzcykuZXJyb3IoXCJcIik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQodG9Qcm9jZXNzKS5lcnJvcih0c0ludmFsaWRpbWFnZXRleHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vICNlbmRyZWdpb24gSGFuZGxlIGNoZWNrYm94IGNoYW5nZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJCh0b1Byb2Nlc3MpLmVycm9yKFwiXCIpO1xuICAgICAgICAvLyAjcmVnaW9uIFJlbW92ZSBtYW51YWwgdmVyaWZ5IGNoZWNrYm94IGFuZCB0ZXh0IGlmIHByZXNlbnRcbiAgICAgICAgY29uc3QgZXhpc3RpbmdNYW51YWxWZXJpZnkgPVxuICAgICAgICAgIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5Db2RCaV9BSV9PQ1JfTWFudWFsVmVyaWZ5XCIpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV4aXN0aW5nTWFudWFsVmVyaWZ5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZXhpc3RpbmdNYW51YWxWZXJpZnlbaV0ucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBSZW1vdmUgbWFudWFsIHZlcmlmeSBjaGVja2JveCBhbmQgdGV4dCBpZiBwcmVzZW50XG4gICAgICB9XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gVmFsaWRhdGUgdmVyaWZ5IG1vZGUgcmVzdWx0c1xuICB9XG59XG5cbndpbmRvdy5jb2RiaS5yZWdpc3RlckZ1bmN0aW9uYWxpdHkoXCJBSS5PQ1JcIiwgQUlfT0NSLmZ1bmN0aW9uYWxpdHkuYmluZChBSV9PQ1IpKTsgLy8gSW5pdGlhbGl6YXRpb25cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0EsOEJBQTBCO0FBVzFCLGVBQTBCO0FBYW5CLElBQU0sVUFBTixNQUFNLFFBQU87QUFBQSxFQXVEbEIsT0FBYyxjQVdaLFFBUUEsV0FDTTtBQUNOLElBQUMsVUFBK0IsaUJBQWlCLFVBQVUsT0FBTyxVQUFVO0FBQzFFLFlBQU0sWUFBWSxTQUFTLGNBQWMsdUJBQXVCLFVBQVUsYUFBYSxJQUFJLENBQUMsR0FBRyxFQUFFO0FBSWpHLFVBQUksT0FBTyxPQUFPLFlBQVksVUFBVTtBQUN0QyxlQUFPLFVBQVUsT0FBTyxRQUFRLFFBQVEsbUJBQW1CLENBQUMsT0FBTyxlQUFlO0FBQ2hGLGdCQUFNLFVBQVUsV0FBVyxLQUFLO0FBQ2hDLGdCQUFNLFFBQVEsVUFBVSxjQUFjLElBQUksT0FBTyxFQUFFO0FBQ25ELGNBQUksU0FBUyxXQUFXLE9BQU87QUFDN0IsbUJBQU8sTUFBTTtBQUFBLFVBQ2Y7QUFDQSxpQkFBTztBQUFBLFFBQ1QsQ0FBQztBQUFBLE1BQ0g7QUFHQSxhQUFPLEtBQUssTUFBTSxFQUFFLFFBQVEsQ0FBQyxRQUFRO0FBQ25DLFlBQUksSUFBSSxXQUFXLFVBQVUsS0FBSyxPQUFPLE9BQU8sR0FBRyxNQUFNLFVBQVU7QUFDakUsaUJBQU8sR0FBRyxJQUFLLE9BQU8sR0FBRyxFQUFhLFFBQVEsbUJBQW1CLENBQUMsT0FBTyxlQUFlO0FBQ3RGLGtCQUFNLFVBQVUsV0FBVyxLQUFLO0FBQ2hDLGtCQUFNLFFBQVEsVUFBVSxjQUFjLElBQUksT0FBTyxFQUFFO0FBQ25ELGdCQUFJLFNBQVMsV0FBVyxPQUFPO0FBQzdCLHFCQUFPLE1BQU07QUFBQSxZQUNmO0FBQ0EsbUJBQU87QUFBQSxVQUNULENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRixDQUFDO0FBRUQsWUFBTSxRQUFJLG1DQUFVO0FBQ3BCLFlBQU0sUUFBUyxVQUErQjtBQUU5QyxjQUFPLDRCQUE0QjtBQUduQyxZQUFNLFVBQVUsT0FBTyxVQUFVLE9BQU8sT0FBTyxPQUFPLElBQUk7QUFDMUQsVUFBSSxXQUFXLE1BQU0sU0FBUyxTQUFTO0FBQ3JDLGVBQU8sTUFBTTtBQUFBLFVBQ1g7QUFBQSxVQUNBLHlEQUF5RCxNQUFNLE1BQU0sZUFBZSxPQUFPO0FBQUEsVUFDM0Y7QUFBQSxRQUNGO0FBQ0E7QUFBQSxNQUNGO0FBR0EsWUFBTSxXQUFXLElBQUksU0FBUztBQUM5QixZQUFNLFdBQVcsT0FBTyxXQUFXLE9BQU8sT0FBTyxRQUFRLElBQUk7QUFDN0QsYUFBTyxzQkFBc0IsT0FBTyxzQkFBc0IsT0FBTyxzQkFBc0I7QUFDdkYsYUFBTyxtQkFBbUIsT0FBTyxtQkFDN0IsT0FBTyxtQkFDUDtBQUVKLFlBQU0saUJBQWlELENBQUM7QUFFeEQsaUJBQVcsUUFBUSxNQUFNLEtBQUssS0FBSyxHQUFHO0FBQ3BDLFlBQUksS0FBSyxTQUFTLG1CQUFtQjtBQUNuQyxnQkFBTSxZQUFZLE1BQU0sUUFBTyxlQUFlLE1BQU0sUUFBUTtBQUU1RCxjQUFJLFVBQVUsU0FBUztBQUNyQiwyQkFBZSxLQUFLLElBQUksSUFBSSxVQUFVO0FBQUEsVUFDeEMsT0FBTztBQUNMLHFCQUFTLElBQUksR0FBRyxJQUFJLFVBQVUsT0FBTyxRQUFRLEtBQUs7QUFDaEQsb0JBQU0sWUFBWSxHQUFHLEtBQUssS0FBSyxRQUFRLFFBQVEsRUFBRSxDQUFDLFNBQVMsSUFBSSxDQUFDO0FBRWhFLHVCQUFTLE9BQU8sV0FBVyxVQUFVLE9BQU8sQ0FBQyxHQUFHLFNBQVM7QUFBQSxZQUMzRDtBQUFBLFVBQ0Y7QUFBQSxRQUNGLE9BQU87QUFDTCxnQkFBTSxrQkFBa0IsTUFBTSxRQUFPLHFCQUFxQixJQUFJO0FBRTlELG1CQUFTLE9BQU8sS0FBSyxNQUFNLGlCQUFpQixLQUFLLElBQUk7QUFBQSxRQUN2RDtBQUFBLE1BQ0Y7QUFHQSxZQUFNLGdCQUFrRCxDQUFDO0FBRXpELFVBQUssT0FBTyxLQUFnQixZQUFZLE1BQU0sa0JBQWtCO0FBQzlELGNBQU0sY0FBYyxPQUFPLEtBQUssTUFBTSxFQUFFLE9BQU8sQ0FBQyxRQUFRLElBQUksV0FBVyxVQUFVLENBQUM7QUFFbEYsbUJBQVcsY0FBYyxhQUFhO0FBQ3BDLGdCQUFNLFlBQVksV0FBVyxVQUFVLENBQUM7QUFDeEMsZ0JBQU0sVUFBVSxLQUFLO0FBQUEsWUFDbkIsT0FBTyxVQUFVO0FBQUEsWUFDakI7QUFBQSxZQUNBLHVCQUF1QixVQUFVO0FBQUEsVUFDbkM7QUFFQSxjQUFJLGFBQWEsU0FBUztBQUN4QixrQkFBTSxXQUFzQyxDQUFDO0FBRTdDLHFCQUFTLFNBQVMsSUFBSSxtQkFBbUIsUUFBUSxRQUFRLEtBQUssR0FBRyxDQUFDO0FBRWxFLDBCQUFjLEtBQUssUUFBUTtBQUFBLFVBQzdCO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFFQSxZQUFNLG9CQUFvQixjQUFjLFNBQVMsSUFBSSxLQUFLLFVBQVUsYUFBYSxJQUFJO0FBR3JGLE1BQUMsVUFBMEIsTUFBTSxnQkFBZ0I7QUFDakQsTUFBQyxVQUEwQixNQUFNLFVBQVU7QUFFM0MsYUFBTyxNQUFNLGtCQUFrQixTQUFTO0FBRXhDLFlBQU0sUUFBUSxTQUFTO0FBQUEsUUFDcEIsVUFBMEIsY0FBYyxjQUFjLE9BQU87QUFBQSxRQUM5RDtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQ0EsWUFBTSxhQUFhLFFBQVEsTUFBTSxZQUFZO0FBRTdDLFVBQUksT0FBTyxxQkFBcUI7QUFDOUIsY0FBTSxZQUFZLEdBQUcsVUFBVTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSwyQ0FTSSxPQUFPLG1CQUFtQjtBQUFBLE1BQy9EO0FBR0EsWUFBTSxZQUFZLE1BQU07QUFDdEIsZUFBTyxNQUFNLGlCQUFpQixTQUFTO0FBRXZDLFFBQUMsVUFBMEIsTUFBTSxnQkFBZ0I7QUFDakQsUUFBQyxVQUEwQixNQUFNLFVBQVU7QUFDM0MsY0FBTSxZQUFZO0FBQUEsTUFDcEI7QUFHQSxVQUFJLHFCQUFpRCxDQUFDO0FBRXRELFVBQUksT0FBTyxLQUFLLGNBQWMsRUFBRSxTQUFTLEdBQUc7QUFDMUMsNkJBQXFCLFFBQU87QUFBQSxVQUMxQjtBQUFBLFVBQ0EsT0FBTztBQUFBLFVBQ1AsT0FBTztBQUFBLFVBQ1A7QUFBQSxVQUNBLE9BQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUdBLFlBQU0sa0JBQWtCLFNBQVMsSUFBSSxTQUFTLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSztBQUVqRSxVQUFJLENBQUMsaUJBQWlCO0FBQ3BCLGdCQUFPLGVBQWUsb0JBQW9CLFFBQVEsV0FBVyxPQUFPLGtCQUE0QixDQUFDO0FBQ2pHLGtCQUFVO0FBRVY7QUFBQSxNQUNGO0FBR0EsWUFBTSxjQUF5QyxFQUFFLFVBQVUsT0FBTyxLQUFlO0FBRWpGLFVBQUssT0FBTyxLQUFnQixZQUFZLE1BQU0sU0FBUztBQUNyRCxvQkFBWSxXQUFXLElBQUk7QUFBQSxVQUN6QixPQUFPLFVBQVcsT0FBTyxRQUFtQixRQUFRLEtBQUssR0FBRyxJQUFJO0FBQUEsUUFDbEU7QUFBQSxNQUNGO0FBRUEsVUFBSyxPQUFPLEtBQWdCLFlBQVksTUFBTSxvQkFBb0Isa0JBQWtCLFNBQVMsR0FBRztBQUM5RixvQkFBWSxpQkFBaUIsSUFBSSxtQkFBbUIsaUJBQWlCO0FBQUEsTUFDdkU7QUFFQSxVQUFJLE9BQU8sWUFBWTtBQUNyQixvQkFBWSxjQUFjLElBQUksT0FBTztBQUFBLE1BQ3ZDO0FBRUEsVUFBSSxPQUFPLGNBQWUsT0FBTyxXQUFzQixZQUFZLE1BQU0sUUFBUTtBQUMvRSxZQUFJLE9BQU8sT0FBTyxlQUFlLFVBQVU7QUFDekMsZ0JBQU0sa0JBQW1CLE9BQU8sV0FBc0IsWUFBWTtBQUVsRSxzQkFBWSxjQUFjLElBQUksb0JBQW9CLFVBQVUsb0JBQW9CLE1BQU0sU0FBUztBQUFBLFFBQ2pHLE9BQU87QUFDTCxzQkFBWSxjQUFjLElBQUssT0FBTyxhQUF5QixTQUFTO0FBQUEsUUFDMUU7QUFBQSxNQUNGO0FBR0EsWUFBTSxtQkFBbUMsT0FBTyxjQUFjLE9BQU8sT0FBTyxPQUFPLFVBQVUsTUFBTSxVQUFVO0FBQzdHLFlBQU0sZUFBdUIsT0FBTyxhQUFhLE9BQU8sT0FBTyxPQUFPLFNBQVMsSUFBSTtBQUNuRixVQUFJLGtCQUEwQztBQUU5QyxZQUFNLG9CQUFvQixDQUFDLFVBQWtCLG9CQUFvQztBQUMvRSxZQUFJLENBQUMsaUJBQWlCO0FBQ3BCLDRCQUFrQixTQUFTLGNBQWMsTUFBTTtBQUMvQywwQkFBZ0IsWUFBWTtBQUM1QiwwQkFBZ0IsTUFBTSxVQUNwQjtBQUNGLGlCQUFPLFlBQVksZUFBZTtBQUFBLFFBQ3BDO0FBQ0EsY0FBTSxZQUFZLGVBQWUsZUFBZTtBQUNoRCx3QkFBZ0IsY0FBYyxHQUFHLFFBQVEsR0FBRyxZQUFZLElBQUksU0FBUyxLQUFLLEVBQUUsR0FBRyxlQUFlLElBQUksWUFBWSxLQUFLLEVBQUU7QUFBQSxNQUN2SDtBQUVBLFlBQU0sb0JBQW9CLE1BQU07QUFDOUIseUJBQWlCLE9BQU87QUFDeEIsMEJBQWtCO0FBQUEsTUFDcEI7QUFFQSxVQUFJLGlCQUFnQztBQUVwQyxZQUFNLGlCQUFpQixNQUFNO0FBQzNCLFVBQUUsS0FBSztBQUFBLFVBQ0wsS0FBSyxHQUFHLE9BQU8sTUFBTSxPQUFPO0FBQUEsVUFDNUIsTUFBTTtBQUFBLFVBQ04sTUFBTTtBQUFBLFVBQ04sYUFBYTtBQUFBLFVBQ2IsYUFBYTtBQUFBLFVBQ2IsT0FBTztBQUFBLFVBQ1AsU0FBUztBQUFBLFVBQ1QsWUFBWSxDQUFDLFFBQVE7QUFDbkIsZ0JBQUksZ0JBQWdCO0FBQ2xCLGtCQUFJLGlCQUFpQixrQkFBa0IsY0FBYztBQUFBLFlBQ3ZEO0FBQUEsVUFDRjtBQUFBLFVBQ0EsU0FBUyxDQUFDLGFBQWE7QUFDckIsa0JBQU0saUJBQWlCLE9BQU8sYUFBYSxXQUFXLEtBQUssTUFBTSxRQUFRLElBQUk7QUFFN0UsZ0JBQUksZUFBZSxRQUFRO0FBQ3pCLCtCQUFpQixlQUFlLGVBQWU7QUFDL0Msb0JBQU0sZUFBZSxvQkFBb0IsT0FBTyxtQkFBbUIsQ0FBQyxDQUFDLGVBQWU7QUFDcEYsa0JBQUksY0FBYztBQUNoQixrQ0FBa0IsZUFBZSxZQUFZLEdBQUcsZUFBZSxlQUFlO0FBQUEsY0FDaEY7QUFDQSx5QkFBVyxnQkFBZ0IsR0FBSTtBQUMvQjtBQUFBLFlBQ0Y7QUFDQSw4QkFBa0I7QUFDbEIsNkJBQWlCO0FBQ2pCLGtCQUFNLGlCQUFpQixFQUFFLEdBQUcsb0JBQW9CLEdBQUcsZUFBZTtBQUVsRSxvQkFBTyxlQUFlLGdCQUFnQixRQUFRLFdBQVcsT0FBTyxrQkFBNEIsQ0FBQztBQUM3RixzQkFBVTtBQUFBLFVBQ1o7QUFBQSxVQUNBLE9BQU8sQ0FBQyxLQUFLLFFBQVEsVUFBVTtBQUM3Qiw4QkFBa0I7QUFDbEIsc0JBQVU7QUFFVixrQkFBTSxJQUFJLFdBQVcsdURBQWtELE1BQU0sYUFBYSxLQUFLLEVBQUU7QUFBQSxVQUNuRztBQUFBLFFBQ0YsQ0FBQztBQUFBLE1BQ0g7QUFDQSxxQkFBZTtBQUFBLElBRWpCLENBQUM7QUFBQSxFQUNIO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsYUFBcUIscUJBQXFCLE1BQTJCO0FBQ25FLFVBQU0sZ0JBQWdCO0FBRXRCLFdBQU8sSUFBSSxRQUFRLENBQUMsWUFBWTtBQUM5QixZQUFNLE1BQU0sSUFBSSxNQUFNO0FBQ3RCLFlBQU0sTUFBTSxJQUFJLGdCQUFnQixJQUFJO0FBRXBDLFVBQUksU0FBUyxNQUFNO0FBQ2pCLFlBQUksZ0JBQWdCLEdBQUc7QUFFdkIsY0FBTSxFQUFFLE9BQU8sT0FBTyxJQUFJO0FBQzFCLGNBQU0sU0FBUyxLQUFLLElBQUksT0FBTyxNQUFNO0FBRXJDLFlBQUksVUFBVSxlQUFlO0FBQzNCLGtCQUFRLElBQUk7QUFDWjtBQUFBLFFBQ0Y7QUFFQSxjQUFNLFFBQVEsZ0JBQWdCO0FBQzlCLGNBQU0sV0FBVyxLQUFLLE1BQU0sUUFBUSxLQUFLO0FBQ3pDLGNBQU0sWUFBWSxLQUFLLE1BQU0sU0FBUyxLQUFLO0FBRTNDLGNBQU0sU0FBUyxTQUFTLGNBQWMsUUFBUTtBQUM5QyxlQUFPLFFBQVE7QUFDZixlQUFPLFNBQVM7QUFFaEIsY0FBTSxNQUFNLE9BQU8sV0FBVyxJQUFJO0FBQ2xDLFlBQUksVUFBVSxLQUFLLEdBQUcsR0FBRyxVQUFVLFNBQVM7QUFFNUMsZUFBTztBQUFBLFVBQ0wsQ0FBQyxTQUFTO0FBQ1Isb0JBQVEsUUFBUSxJQUFJO0FBQUEsVUFDdEI7QUFBQSxVQUNBLEtBQUssS0FBSyxXQUFXLFdBQVcsSUFBSSxjQUFjO0FBQUEsVUFDbEQ7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUVBLFVBQUksVUFBVSxNQUFNO0FBQ2xCLFlBQUksZ0JBQWdCLEdBQUc7QUFDdkIsZ0JBQVEsSUFBSTtBQUFBLE1BQ2Q7QUFFQSxVQUFJLE1BQU07QUFBQSxJQUNaLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQTtBQUFBO0FBQUEsU0FBZSx3QkFBd0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFXdkMsT0FBZSw4QkFBb0M7QUFDakQsUUFBSSxRQUFPLHVCQUF1QjtBQUNoQztBQUFBLElBQ0Y7QUFFQSxJQUFTLDZCQUFvQixZQUFZLEdBQUcsT0FBTyxNQUFNLE9BQU87QUFFaEUsWUFBTyx3QkFBd0I7QUFFL0IsV0FBTyxNQUFNLElBQUksUUFBUSw2QkFBc0MsNkJBQW9CLFNBQVMsSUFBSSxVQUFVO0FBQUEsRUFDNUc7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxhQUFxQixlQUNuQixNQUNBLFVBQytEO0FBQy9ELFVBQU0sY0FBYyxNQUFNLEtBQUssWUFBWTtBQUMzQyxVQUFNLE1BQXdCLE1BQWUscUJBQVksRUFBRSxNQUFNLFlBQVksQ0FBQyxFQUFFO0FBQ2hGLFVBQU0sV0FBVyxLQUFLLElBQUksSUFBSSxVQUFVLFFBQVE7QUFDaEQsUUFBSSxXQUFXO0FBQ2YsVUFBTSxTQUFpQixDQUFDO0FBRXhCLGFBQVMsVUFBVSxHQUFHLFdBQVcsVUFBVSxXQUFXO0FBQ3BELFlBQU0sT0FBcUIsTUFBTSxJQUFJLFFBQVEsT0FBTztBQUNwRCxZQUFNLGNBQWMsTUFBTSxLQUFLLGVBQWU7QUFDOUMsWUFBTSxXQUFXLFlBQVksTUFBTSxJQUFJLENBQUMsU0FBVSxTQUFTLE9BQU8sS0FBSyxNQUFNLEVBQUcsRUFBRSxLQUFLLEdBQUc7QUFFMUYsa0JBQVksR0FBRyxRQUFRO0FBQUE7QUFBQSxJQUN6QjtBQUVBLFVBQU0sVUFBVSxTQUFTLEtBQUssRUFBRSxTQUFTO0FBRXpDLFFBQUksQ0FBQyxTQUFTO0FBQ1osZUFBUyxVQUFVLEdBQUcsV0FBVyxVQUFVLFdBQVc7QUFDcEQsY0FBTSxPQUFxQixNQUFNLElBQUksUUFBUSxPQUFPO0FBQ3BELGNBQU0sV0FBVyxLQUFLLFlBQVksRUFBRSxPQUFPLEVBQUksQ0FBQztBQUNoRCxjQUFNLFNBQVMsU0FBUyxjQUFjLFFBQVE7QUFDOUMsY0FBTSxVQUFVLE9BQU8sV0FBVyxJQUFJO0FBRXRDLGVBQU8sU0FBUyxTQUFTO0FBQ3pCLGVBQU8sUUFBUSxTQUFTO0FBRXhCLGNBQU0sS0FBSyxPQUFPLEVBQUUsZUFBZSxTQUFTLFNBQVMsQ0FBQyxFQUFFO0FBRXhELGNBQU0sT0FBTyxNQUFNLElBQUksUUFBYyxDQUFDLFlBQVk7QUFDaEQsaUJBQU8sT0FBTyxDQUFDLE1BQU0sUUFBUSxDQUFDLEdBQUcsV0FBVztBQUFBLFFBQzlDLENBQUM7QUFFRCxlQUFPLEtBQUssSUFBSTtBQUFBLE1BQ2xCO0FBQUEsSUFDRjtBQUVBLFdBQU8sRUFBRSxTQUFTLE1BQU0sVUFBVSxPQUFPO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFhQSxPQUFlLHNCQUNiLGdCQUNBLE1BQ0EsU0FDQSxlQUNBLFlBQzRCO0FBQzVCLFVBQU0sVUFBc0MsQ0FBQztBQUU3QyxlQUFXLENBQUMsVUFBVSxJQUFJLEtBQUssT0FBTyxRQUFRLGNBQWMsR0FBRztBQUM3RCxjQUFRLEtBQUssWUFBWSxHQUFHO0FBQUEsUUFDMUIsS0FBSztBQUNILGtCQUFRLFFBQVEsSUFBSTtBQUNwQjtBQUFBLFFBQ0YsS0FBSztBQUNILGNBQUksU0FBUztBQUNYLGtCQUFNLFFBQVEsSUFBSSxPQUFPLFNBQVMsY0FBYyxFQUFFO0FBQ2xELG9CQUFRLFFBQVEsSUFBSSxNQUFNLEtBQUssSUFBSTtBQUFBLFVBQ3JDO0FBQ0E7QUFBQSxRQUNGLEtBQUs7QUFDSCxjQUFJLGVBQWU7QUFDakIsa0JBQU0sZUFBNEMsQ0FBQztBQUVuRCx1QkFBVyxnQkFBZ0IsZUFBZTtBQUN4Qyx5QkFBVyxDQUFDLFdBQVcsZUFBZSxLQUFLLE9BQU8sUUFBUSxZQUFZLEdBQUc7QUFDdkUsc0JBQU0saUJBQWlCLG1CQUFtQixlQUFlO0FBQ3pELHNCQUFNLFFBQVEsSUFBSSxPQUFPLGdCQUFnQixjQUFjLEVBQUU7QUFDekQsc0JBQU0sVUFBVSxLQUFLLE1BQU0sS0FBSztBQUVoQyxvQkFBSSxTQUFTO0FBQ1gsc0JBQUksQ0FBQyxhQUFhLFNBQVMsR0FBRztBQUM1QixpQ0FBYSxTQUFTLElBQUksQ0FBQztBQUFBLGtCQUM3QjtBQUNBLCtCQUFhLFNBQVMsRUFBRSxLQUFLLEdBQUcsUUFBUSxNQUFNLENBQUMsRUFBRSxPQUFPLE9BQU8sQ0FBQztBQUFBLGdCQUNsRTtBQUFBLGNBQ0Y7QUFBQSxZQUNGO0FBRUEsb0JBQVEsUUFBUSxJQUFJO0FBQUEsVUFDdEI7QUFDQTtBQUFBLE1BQ0o7QUFBQSxJQUNGO0FBRUEsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVdBLE9BQWUsZUFDYixVQUNBLFFBQ0EsV0FDQSxvQkFDQSxHQUNNO0FBQ04sUUFBSyxPQUFPLEtBQWdCLFlBQVksTUFBTSxTQUFTO0FBQ3JELFlBQU0sVUFBVSxVQUFVLGVBQWUsZUFBZSxpQkFBaUI7QUFFekUsVUFBSSxTQUFTO0FBQ1gsY0FBTSxlQUFlLFNBQVM7QUFBQSxVQUM1QixRQUFRLGNBQWMsd0JBQXdCO0FBQUEsVUFDOUM7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUVBLFlBQUksY0FBYztBQUNoQixjQUFJLGVBQWU7QUFDbkIsY0FBSSxlQUFlLENBQUM7QUFDcEIsY0FBSSxhQUFhLENBQUM7QUFDbEIsa0JBQVEsT0FBTyxVQUFVO0FBQUEsWUFDdkIsS0FBSztBQUNILDZCQUFlO0FBQ2Y7QUFBQSxZQUNGLEtBQUs7QUFDSCxrQkFBSSxhQUFhLE1BQU07QUFDckIsK0JBQWUsT0FBTyxLQUFLLFFBQVE7QUFDbkMsNkJBQWEsT0FBTyxPQUFPLFFBQVEsRUFBRTtBQUFBLGtCQUFJLENBQUMsUUFDeEMsT0FBTyxRQUFRLFdBQVcsTUFBTSxLQUFLLFVBQVUsR0FBRztBQUFBLGdCQUNwRDtBQUNBLCtCQUFlLFdBQVcsS0FBSyxNQUFNO0FBQUEsY0FDdkMsT0FBTztBQUNMLCtCQUFlLEtBQUssVUFBVSxRQUFRO0FBQUEsY0FDeEM7QUFDQTtBQUFBLFlBQ0Y7QUFDRSw2QkFBZSxLQUFLLFVBQVUsUUFBUTtBQUN0QztBQUFBLFVBQ0o7QUFFQSx1QkFBYSxRQUFRO0FBQUEsUUFDdkIsT0FBTztBQUNMLGlCQUFPLE1BQU07QUFBQSxZQUNYO0FBQUEsWUFDQSwyRUFBMkUsVUFBVSxjQUFjLGNBQWMsYUFBYSxJQUFJLENBQUM7QUFBQSxZQUNuSTtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFHQSxRQUNHLE9BQU8sS0FBZ0IsWUFBWSxNQUFNLG9CQUMxQyxPQUFPLGFBQWEsWUFDcEIsYUFBYSxNQUNiO0FBQ0EsWUFBTSxVQUFVLFVBQVUsZUFBZSxlQUFlLGlCQUFpQjtBQUV6RSxVQUFJLFNBQVM7QUFDWCxjQUFNLFlBQVksUUFBUSxpQkFBaUIsd0JBQXdCO0FBRW5FLG1CQUFXLFFBQVEsV0FBVztBQUM1QixnQkFBTSxRQUFTLEtBQXFCLGFBQWEsZUFBZSxFQUFFLFlBQVk7QUFFOUUsY0FBSSxPQUFPO0FBQ1Qsa0JBQU0sWUFBWSxPQUFPLFlBQWEsT0FBTyxZQUF1QjtBQUNwRSxrQkFBTSxrQkFBNEIsQ0FBQztBQUVuQyx1QkFBVyxXQUFXLFVBQVU7QUFDOUIsa0JBQUksT0FBTyxVQUFVLGVBQWUsS0FBSyxVQUFVLE9BQU8sR0FBRztBQUMzRCxzQkFBTSxXQUFXLFNBQVMsT0FBTztBQUVqQyxvQkFBSSxZQUFZLE9BQU8sYUFBYSxZQUFZLE9BQU8sVUFBVSxlQUFlLEtBQUssVUFBVSxLQUFLLEdBQUc7QUFDckcsd0JBQU0sYUFBYSxTQUFTLEtBQUs7QUFFakMsc0JBQUksTUFBTSxRQUFRLFVBQVUsR0FBRztBQUM3QixvQ0FBZ0IsS0FBSyxHQUFHLFVBQVU7QUFBQSxrQkFDcEMsV0FBVyxPQUFPLGVBQWUsVUFBVTtBQUN6QyxvQ0FBZ0IsS0FBSyxVQUFVO0FBQUEsa0JBQ2pDO0FBQUEsZ0JBQ0Y7QUFBQSxjQUNGO0FBQUEsWUFDRjtBQUVBLGdCQUFJLGdCQUFnQixTQUFTLEdBQUc7QUFDOUIsb0JBQU0sY0FBYyxnQkFBZ0IsS0FBSyxTQUFTO0FBRWxELGtCQUFJLFdBQVcsTUFBTTtBQUNuQix5QkFBUztBQUFBLGtCQUNQO0FBQUEsa0JBQ0EsQ0FBQyxrQkFBa0IsbUJBQW1CO0FBQUEsa0JBQ3RDO0FBQUEsZ0JBQ0YsRUFBRSxRQUFRO0FBQUEsY0FDWixPQUFPO0FBQ0wscUJBQUssY0FBYztBQUFBLGNBQ3JCO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFHQSxRQUFLLE9BQU8sS0FBZ0IsWUFBWSxNQUFNLFVBQVU7QUFDdEQsVUFBSSxPQUFPLE9BQU8sUUFBc0MsRUFBRSxLQUFLLENBQUMsV0FBVyxXQUFXLEtBQUssR0FBRztBQUM1RixVQUFFLFNBQVMsRUFBRSxNQUFNLGtCQUFrQjtBQUVyQyxZQUFJLENBQUMsVUFBVSxjQUFjLG1DQUFtQyxHQUFHO0FBQ2pFLGdCQUFNLFFBQVEsU0FBUyxjQUFjLE9BQU87QUFDNUMsZ0JBQU0sY0FBYztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFZcEIsb0JBQVUsWUFBWSxLQUFLO0FBQUEsUUFDN0I7QUFHQSxjQUFNLHVCQUNKLFVBQVUsY0FBYyxjQUFjLGlCQUFpQiw0QkFBNEI7QUFDckYsaUJBQVMsSUFBSSxHQUFHLElBQUkscUJBQXFCLFFBQVEsS0FBSztBQUNwRCwrQkFBcUIsQ0FBQyxFQUFFLE9BQU87QUFBQSxRQUNqQztBQUdBLGNBQU0sb0JBQW9CLFNBQVMsY0FBYyxLQUFLO0FBQ3RELDBCQUFrQixZQUFZO0FBQzlCLDBCQUFrQixNQUFNLFVBQVU7QUFDbEMsMEJBQWtCLE1BQU0sYUFBYTtBQUNyQywwQkFBa0IsTUFBTSxZQUFZO0FBQ3BDLDBCQUFrQixNQUFNLE1BQU07QUFDOUIsY0FBTSxXQUFXLFNBQVMsY0FBYyxPQUFPO0FBQy9DLGlCQUFTLE9BQU87QUFDaEIsaUJBQVMsS0FBSyxpQkFBaUIsVUFBVSxFQUFFO0FBQzNDLGlCQUFTLFlBQVk7QUFDckIsY0FBTSxRQUFRLFNBQVMsY0FBYyxPQUFPO0FBQzVDLGNBQU0sVUFBVSxTQUFTO0FBQ3pCLGNBQU0sY0FBYyxPQUFPLG1CQUN0QixPQUFPLG1CQUNSO0FBQ0osY0FBTSxNQUFNLGVBQWU7QUFDM0IsMEJBQWtCLFlBQVksUUFBUTtBQUN0QywwQkFBa0IsWUFBWSxLQUFLO0FBQ25DLGtCQUFVLGNBQWMsc0JBQXNCLFlBQVksaUJBQWlCO0FBRzNFLGlCQUFTLGlCQUFpQixVQUFVLE1BQU07QUFDeEMsY0FBSSxTQUFTLFNBQVM7QUFDcEIsY0FBRSxTQUFTLEVBQUUsTUFBTSxFQUFFO0FBQUEsVUFDdkIsT0FBTztBQUNMLGNBQUUsU0FBUyxFQUFFLE1BQU0sa0JBQWtCO0FBQUEsVUFDdkM7QUFBQSxRQUNGLENBQUM7QUFBQSxNQUVILE9BQU87QUFDTCxVQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUU7QUFFckIsY0FBTSx1QkFDSixVQUFVLGNBQWMsY0FBYyxpQkFBaUIsNEJBQTRCO0FBQ3JGLGlCQUFTLElBQUksR0FBRyxJQUFJLHFCQUFxQixRQUFRLEtBQUs7QUFDcEQsK0JBQXFCLENBQUMsRUFBRSxPQUFPO0FBQUEsUUFDakM7QUFBQSxNQUVGO0FBQUEsSUFDRjtBQUFBLEVBRUY7QUFDRjtBQXpvQmdCO0FBQUEsRUFEYixJQUFJO0FBQUEsRUFFRix3QkFBSztBQUFBLElBQ0o7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUFBLEVBQ0MseUJBQU0sSUFBSSxvQ0FBb0MsTUFBTTtBQUFBLEVBQ3BELHlCQUFNLElBQUksU0FBUyxXQUFXO0FBQUEsRUFDOUIseUJBQU0sSUFBSSxTQUFTLFVBQVU7QUFBQSxFQUM3QixzQkFBRyxJQUFJLElBQUksS0FBSyxRQUFRLEdBQUcsSUFBSSxNQUFNLE9BQU8sR0FBRyxVQUFVO0FBQUEsRUFDekQsc0JBQUcsSUFBSSxJQUFJLEtBQUssUUFBUSxHQUFHLElBQUksTUFBTSxNQUFNLE9BQU8sT0FBTyxHQUFHLFlBQVk7QUFBQSxFQUN4RSxzQkFBRyxJQUFJLElBQUksS0FBSyxRQUFRLEdBQUcsSUFBSSxLQUFLLFNBQVMsR0FBRyxjQUFjLElBQUk7QUFBQSxFQUdsRSw0QkFBUztBQUFBLElBQ1I7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFBQSxFQUNDLHNCQUFHLElBQUksUUFBUSxPQUFPLE1BQU07QUFBQSxHQXpFcEIsU0F1REc7QUF2RFQsSUFBTSxTQUFOO0FBa3NCUCxPQUFPLE1BQU0sc0JBQXNCLFVBQVUsT0FBTyxjQUFjLEtBQUssTUFBTSxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
