//region Imports
//region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
//endregion XIMA
//region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { IF } from "xdbc/src/DBC/IF";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { EQ } from "xdbc/src/DBC/EQ";
import { OR } from "xdbc/src/DBC/OR";
//endregion XDBC
//region PDF.js
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
//endregion PDF.js
//endregion Imports
/**
 * Provides the {@link AI_ONNX_QWEN_QA.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_ONNX_QWEN_QA {
  /**
   * This functionality processes uploaded images using a Donut AI-Model running on the DJL ONNX-Engine to
   * answer questions about documents. As soon as the file(s) selected changes the AI
   * is contacted via AJAX and the questions are answered. Nothing happens if no file is
   * selected.
   *
   * **PDF Support:** The functionality automatically detects PDF files and processes them accordingly:
   * - If PDF contains mainly text, the text is rendered to an image before sending to AI
   * - If PDF contains images (scanned documents), those images are extracted and sent to AI
   * - Multiple files can be selected, mixing PDFs and images
   *
   * **Image Orientation:** The Donut model is sensitive to image rotation. There are two ways
   * to provide orientation of the image to process:
   *
   * 1. **Manual Rotation (Priority):** Add a **data-cb-Rotate** attribute to the input element:
   *    - `data-cb-Rotate="90"` - Rotate image 90° clockwise
   *    - `data-cb-Rotate="180"` - Rotate image 180°
   *    - `data-cb-Rotate="270"` - Rotate image 270° clockwise (90° counter-clockwise)
   *
   * 2. **Automatic Detection (Fallback):** If no data-cb-Rotate attribute is provided AND the
   *    Tesseract OCR engine is active (**OCR** is set in **Active_AI** plugin property), the system will
   *    automatically detect and correct image orientation using Tesseract's OSD (Orientation
   *    and Script Detection).
   *
   * 3. **No Rotation:** If data-cb-Rotate is not provided and **OCR** is not set in **Active_AI** plugin property, images are
   *    processed as-is leading to potential wrong results with images that are rotated.
   *
   * ### Config Parameters:
   * - **maxPages**:  Optional number limiting how many pages from a PDF are processed and sent to the AI.
   *                  Useful for large PDFs to avoid overwhelming the AI or hitting processing limits.
   *                  If not specified or set to 0, all pages are processed. Example: `maxPages: 5` will
   *                  only process the first 5 pages of any PDF. Defaults to **5**.
   * - **Rotate**:    Optional attribute on the input element to specify image rotation (see above), either "90", "180", or "270".
   *                  In a multi-file upload or with a PDF that contains multiple images, this rotation is applied to all files.
   * - **MaxPixelSize**:  Maximum total pixel budget (width×height). Images exceeding this
   *                      are downscaled client-side while preserving the aspect ratio.
   *                      Default: 3211264 (≈ 1792×1792). Set to 0 to disable client-side downscaling.
   * - **AIHint**:    Text shown inside AI-populated fields (right-aligned for inputs, bottom-right
   *                  for textareas) until the user edits the value. Default: "✨ AI-Generated".
   *                  Set to an empty string to disable.
   * - **Mode**:      If set to "verify", the upload field may have a **data-cb-Question** attribute.
   *                  In this case, the question is sent to the AI and the answer must be "yes" (case-insensitive) for the file
   *                  to be accepted. If not, an error and a manual verification checkbox are shown,
   *                  just like in ai.ocr.ts. The question can reference symbols as usual.
   *
   * Questions are acquired from DOM elements within the nearest ancestor **XContainer** of the
   * {@link HTMLInputElement } **toProcess** that're tagged with the class **AI_ONNX_QWEN_QA_Question**.
   * Each such element should have:
   *  - An **id** attribute (used as the question key)
   *  - A **data-cb-Question**  attribute (contains the question text which may include symbols like <[FieldName]>
   *                            that get resolved to the value of the field with class "FieldName" in the same container).
   *
   * **Sub-container exclusion:** Nested **XContainer** elements within the search scope can be
   * tagged with the CSS class **AI_ONNX_QA_Exclude** to exclude their contents from the question
   * search. This allows partitioning a form so that each upload field only picks up its own
   * questions. An upload field that resides *inside* an excluded sub-container naturally searches
   * that sub-container (its own nearest XContainer) and is not affected by the exclusion.
   *
   * In verify mode, the upload field itself may have a **data-cb-Question** attribute. This question is sent to the AI and the answer must be "yes" (case-insensitive) for the file to be accepted. Otherwise, an error and a manual verification checkbox are shown.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "maxpages")
    @IF.PRE(new TYPE("string"), new REGEX(/^(90|180|270)$/), "rotate")
    @IF.PRE(new TYPE("number"), new OR([new EQ(90), new EQ(180), new EQ(270)]), "rotate")
    @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "maxPixelSize")
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
      const mode = (toLoad.mode || "").toString().toLowerCase();
      const $ = getJQuery();
      const files = (toProcess as HTMLInputElement).files;

      if (!files || files.length === 0) {
        return;
      }

      AI_ONNX_QWEN_QA.ensurePdfJsWorkerConfigured();

      const formData = new FormData();
      const maxPages = toLoad.maxpages ? Number(toLoad.maxpages) : 5;
      const maxPixelSize =
        toLoad.maxpixelsize != null ? Number(toLoad.maxpixelsize) : AI_ONNX_QWEN_QA.DEFAULT_MAX_PIXELS;
      const aiHintText = toLoad.aihint != null ? String(toLoad.aihint) : "\u2728 AI-Generated";
      // #region Process files (PDF or Image)
      // Send as base64 text params — formcycle's multipart parser returns 0-byte FileData.
      for (const file of Array.from(files)) {
        if (file.type === "application/pdf") {
          const processedImages = await AI_ONNX_QWEN_QA.processPdfFile(file, maxPages);

          for (let i = 0; i < processedImages.length; i++) {
            const imageName = `${file.name.replace(".pdf", "")}_page_${i + 1}.png`;
            let imageFile = new File([processedImages[i]], imageName, { type: "image/png" });
            // Downscale PDF page if it exceeds the pixel budget
            if (maxPixelSize > 0) {
              const downscaled = await AI_ONNX_QWEN_QA.downscaleImageIfNeeded(imageFile, maxPixelSize);
              imageFile =
                downscaled instanceof File
                  ? downscaled
                  : new File([downscaled], imageName, { type: downscaled.type || "image/png" });
            }
            const dataUrl = await AI_ONNX_QWEN_QA.blobToDataUrl(imageFile);
            formData.append(`codbi-base64:${imageName}`, dataUrl);
          }
        } else if (maxPixelSize > 0) {
          const downscaled = await AI_ONNX_QWEN_QA.downscaleImageIfNeeded(file, maxPixelSize);
          const dataUrl = await AI_ONNX_QWEN_QA.blobToDataUrl(downscaled);
          window.codbi.log(
            "INFO",
            `Appending '${file.name}' as base64 param: ${Math.round(dataUrl.length / 1024)} KB`,
            "AI / ONNX / DONUT",
          );
          formData.append(`codbi-base64:${file.name}`, dataUrl);
        } else {
          const dataUrl = await AI_ONNX_QWEN_QA.blobToDataUrl(file);
          window.codbi.log(
            "INFO",
            `Appending '${file.name}' as base64 param (no client downscale): ${Math.round(dataUrl.length / 1024)} KB`,
            "AI / ONNX / DONUT",
          );
          formData.append(`codbi-base64:${file.name}`, dataUrl);
        }
      }
      // #endregion Process files (PDF or Image)
      const headers: { [key: string]: string } = {};
      // #region Determine user-set rotation
      if (toLoad.rotate && toLoad.rotate !== "0" && toLoad.rotate !== 0) {
        headers["X-Rotate"] = toLoad.rotate.toString();
        window.codbi.log(
          "INFO",
          `Setting image rotation to ${toLoad.rotate}° via X-Rotate header`,
          "AI / ONNX / DONUT",
        );
      }
      // #endregion Determine user-set rotation
      // #region Determine the search container
      // Walk up from the upload input to find the right .CXContainer scope.
      // Strategy: find the nearest .CXContainer, then go one level up to the parent
      // .CXContainer that groups the upload with its question fields.
      // Exception: if the immediate .CXContainer is tagged AI_ONNX_QA_Exclude, it IS
      // the intended scope (the upload lives inside an excluded sub-container).
      const immediateCX = (toProcess as HTMLElement).closest(".CXContainer");
      let container: Element | null;
      if (immediateCX?.classList.contains("AI_ONNX_QA_Exclude")) {
        // Upload is inside an excluded sub-container — search within it
        container = immediateCX;
      } else {
        // Go one level up: the immediate .CXContainer is just the upload wrapper
        container = immediateCX?.parentElement?.closest(".CXContainer") ?? immediateCX;
      }
      if (!container) {
        window.codbi.log(
          "ERROR",
          `Could not find ancestor .CXContainer for element #${toProcess.getAttribute("id")}. Make sure the input is inside a CXContainer.`,
          "AI / ONNX / DONUT",
        );
        return;
      }
      // #endregion Determine the search container
      // #region Acquire Questions
      // Find all question elements, then filter out those inside an excluded sub-container.
      // A nested .CXContainer.AI_ONNX_QA_Exclude signals "don't search here".
      const allQuestionElements = container.querySelectorAll(".AI_ONNX_QWEN_QA_Question");
      const questionElements: Element[] = [];
      for (const qEl of allQuestionElements) {
        // Walk up from the question element — if we hit an excluded sub-container
        // before reaching our search container, skip this question.
        const innerContainer = qEl.closest(".CXContainer");
        if (innerContainer && innerContainer !== container && innerContainer.classList.contains("AI_ONNX_QA_Exclude")) {
          continue; // question is inside an excluded sub-container
        }
        questionElements.push(qEl);
      }
      const cordQuestions: { id: string; element: Element }[] = [];
      const vqaHeaders: { [key: string]: string } = {};
      // If mode is verify and the upload field has a data-cb-Question, use only that question
      let verifyFieldId: string | null = null;
      let verifyFieldQuestion: string | null = null;
      if (mode === "verify") {
        verifyFieldId = toProcess.getAttribute("id");
        verifyFieldQuestion = toProcess.getAttribute("data-cb-Question");
        if (verifyFieldId && verifyFieldQuestion) {
          // Symbol resolution for verify question
          verifyFieldQuestion = verifyFieldQuestion.replace(/<\[([^\]]+)\]>/g, (match, identifier) => {
            const trimmed = identifier.trim();
            const field = document.querySelector(`.${trimmed}`) as HTMLInputElement | null;
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
              const field = document.querySelector(`.${trimmed}`) as HTMLInputElement | null;
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
                `Question element missing id attribute in: ${element.outerHTML}`,
                "AI / ONNX / DONUT",
              );
            }
            if (!question) {
              window.codbi.log(
                "WARNING",
                `Question element with id "${id}" missing data-cb-Question attribute in: ${element.outerHTML}`,
                "AI / ONNX / DONUT",
              );
            }
          }
        }
      }
      // #endregion Acquire Questions

      // #region If any CORD questions, call CORD action for each
      if (cordQuestions.length > 0) {
        for (const { id, element } of cordQuestions) {
          // Only send the file(s), no question headers
          $.ajax({
            url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Qwen_vQA`,
            type: "POST",
            data: formData,
            dataType: "json",
            processData: false,
            contentType: false,
            cache: false,
            success: (response) => {
              // Place the returned JSON into the field tagged with this question
              const field = document.querySelector(`#${id}`) as HTMLInputElement;
              if (field) {
                field.value = typeof response === "string" ? response : JSON.stringify(response);
                // Dispatch change event after setting value
                const event = new Event("change", { bubbles: true });
                field.dispatchEvent(event);
              }
            },
            error: (xhr, status, error) => {
              window.codbi.log(
                "ERROR",
                `CORD REST failed with status "${status}" cause: "${error}"`,
                "AI / ONNX / DONUT",
              );
            },
          });
        }
      }
      // #endregion If any CORD questions, call CORD action for each

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
                    
              .DONUT_Processing { font-weight: bold ; color: darkorange ; animation: highlight 2s ease-in-out infinite ;}</style>

            <span class = "DONUT_Processing">Processing...</span>`;
        }

        const questionLabelData: Map<HTMLElement, string> = new Map();

        // In verify mode, only the upload field's own question is sent — don't animate
        // the labels of unrelated question fields that happen to share the same container.
        if (!(mode === "verify" && verifyFieldId && verifyFieldQuestion)) {
          for (const element of questionElements) {
            const questionLabel = element.parentElement?.querySelector("label") as HTMLElement | null;

            if (questionLabel) {
              const originalText = questionLabel.innerHTML;
              questionLabelData.set(questionLabel, originalText);
              questionLabel.innerHTML = `${originalText}
                <span class = "DONUT_Processing">Processing...</span>`;
            }
          }
        }
        // #endregion Disable input and show loading animation
        // #region Define how to remove the loading animation and restore labels
        const unanimate = () => {
          window.codbi.removeLoaderAnim(toProcess);

          tsToProcess.style.pointerEvents = "all";
          tsToProcess.style.opacity = "1";

          if (uploadLabel) {
            uploadLabel.innerHTML = uploadFormerText;
          }

          // Restore all question labels
          for (const [label, originalText] of questionLabelData.entries()) {
            label.innerHTML = originalText;
          }
        };
        // #endregion Define how to remove the loading animation and restore labels
        // #region Contact ONNX Donut vQA Plugin via AJAX
        $.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Qwen_vQA`,
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
          },
          success: (response) => {
            unanimate();
            if (response.error) {
              window.codbi.log("ERROR", `REST failed with: ${response.error}`, "AI / ONNX / DONUT");
              return;
            }
            if (mode === "verify" && verifyFieldId && verifyFieldQuestion) {
              // Iterate over all file-keyed results and check the verify answer
              let answer: string | undefined;
              for (const fileKey of Object.keys(response)) {
                const candidate = response[fileKey]?.[verifyFieldId];
                if (typeof candidate === "string") {
                  answer = candidate;
                  break;
                }
              }
              const field = document.querySelector(`#${verifyFieldId}`) as HTMLInputElement;
              if (typeof answer === "string" && answer.trim().toLowerCase() === "yes") {
                if (field) {
                  field.value = answer;
                  if (aiHintText) {
                    AI_ONNX_QWEN_QA.attachAiHint(field, aiHintText);
                  }
                  const event = new Event("change", { bubbles: true });
                  field.dispatchEvent(event);
                }
                // Remove any error/checkbox if present
                $(toProcess).error("");
                const existingManualVerify =
                  toProcess.parentElement?.parentElement?.querySelectorAll(".DONUT_AI_ManualVerify");
                if (existingManualVerify) {
                  for (let i = 0; i < existingManualVerify.length; i++) {
                    existingManualVerify[i].remove();
                  }
                }
              } else {
                // Show error and manual verify checkbox
                $(toProcess).error("The file does not meet the verification criteria.");
                // #region Add styles for manual verification checkbox
                if (!document.querySelector("#DONUT_AI_ManualVerify_Styles")) {
                  const style = document.createElement("style");
                  style.id = "DONUT_AI_ManualVerify_Styles";
                  style.textContent = `
                    .DONUT_AI_ManualVerify { display: flex ; align-items: center ; margin-top: 8px ; gap: 8px ;
                      flex-wrap: nowrap ;}
                    .DONUT_AI_ManualVerify_Checkbox { cursor: pointer ; opacity: 1 !important ; position: relative !important ;
                      flex-shrink: 0 ;}
                    .DONUT_AI_ManualVerify label { margin-bottom: 0 ; position: relative !important ;}`;
                  document.head.appendChild(style);
                }
                // #endregion Add styles for manual verification checkbox
                // Remove existing
                const existingManualVerify =
                  toProcess.parentElement?.parentElement?.querySelectorAll(".DONUT_AI_ManualVerify");
                if (existingManualVerify) {
                  for (let i = 0; i < existingManualVerify.length; i++) {
                    existingManualVerify[i].remove();
                  }
                }
                // Add checkbox
                const checkboxContainer = document.createElement("div");
                checkboxContainer.className = "DONUT_AI_ManualVerify";
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.id = `manual-verify-${toProcess.id}`;
                checkbox.className = "DONUT_AI_ManualVerify_Checkbox";
                const label = document.createElement("label");
                label.htmlFor = checkbox.id;
                label.textContent =
                  "The content is not as expected. Please check if you selected the correct file(s). You may manually verify that it is the correct one by clicking the checkbox.";
                checkboxContainer.appendChild(checkbox);
                checkboxContainer.appendChild(label);
                toProcess.parentElement?.insertAdjacentElement("afterend", checkboxContainer);
                checkbox.addEventListener("change", () => {
                  if (checkbox.checked) {
                    $(toProcess).error("");
                  } else {
                    $(toProcess).error("The file does not meet the verification criteria.");
                  }
                });
              }
            } else {
              for (const key in response) {
                for (const key2 in response[key]) {
                  const field = document.querySelector(`#${key2}`) as HTMLInputElement;
                  if (field) {
                    field.value = response[key][key2];
                    if (aiHintText) {
                      AI_ONNX_QWEN_QA.attachAiHint(field, aiHintText);
                    }
                    // Dispatch change event after setting value
                    const event = new Event("change", { bubbles: true });
                    field.dispatchEvent(event);
                  }
                }
              }
            }
          },
          error: (xhr, status, error) => {
            unanimate();
            window.codbi.log("ERROR", `REST failed with status "${status}" cause: "${error}"`, "AI / ONNX / DONUT");
          },
        });
      }
      // #endregion If any VQA questions, call VQA action as before
      // #endregion Contact ONNX Donut vQA Plugin via AJAX
    });
  }

  /** Ensures PDF.js worker is configured with the correct URL. */
  private static pdfJsWorkerConfigured = false;

  /**
   * Ensures the PDF.js worker URL is configured once before any PDF operations.
   *
   * @remarks
   * Sets {@link pdfjsLib.GlobalWorkerOptions.workerSrc} to the Resource plugin URL
   * and guards against repeated initialization via {@link AI_ONNX_QWEN_QA.pdfJsWorkerConfigured}.
   */
  private static ensurePdfJsWorkerConfigured(): void {
    if (AI_ONNX_QWEN_QA.pdfJsWorkerConfigured) {
      return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.codbi.baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.worker.min.js`;

    AI_ONNX_QWEN_QA.pdfJsWorkerConfigured = true;

    window.codbi.log(
      "INFO",
      `PDF.js worker configured: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`,
      "AI / ONNX / DONUT",
    );
  }

  // #region AI-Generated hint
  /**
   * Injects global styles for the AI-Generated badge (once).
   */
  private static ensureAiHintStyles(): void {
    if (document.querySelector("#DONUT_AI_Hint_Styles")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "DONUT_AI_Hint_Styles";
    style.textContent = `
      .DONUT_AI_Hint_Wrapper { position: relative ; display: inline-block ; width: 100% ;}
      .DONUT_AI_Hint { position: absolute ; pointer-events: none ; color: rgba(0,0,0,0.38) ;
        font-size: 11px ; line-height: 1 ; white-space: nowrap ; user-select: none ;}
      input  + .DONUT_AI_Hint { right: 8px ; top: 50% ; transform: translateY(-50%) ;}
      textarea + .DONUT_AI_Hint { right: 8px ; bottom: 6px ;}`;
    document.head.appendChild(style);
  }

  /**
   * Attaches an AI-Generated badge to a field. The badge is removed as soon as the
   * user changes the field value (keyboard input). Repeat calls on the same field
   * replace the previous badge.
   *
   * @param field    The input or textarea element.
   * @param hintText The label to display, e.g. "✨ AI-Generated".
   */
  private static attachAiHint(field: HTMLInputElement | HTMLTextAreaElement, hintText: string): void {
    AI_ONNX_QWEN_QA.ensureAiHintStyles();

    // Remove any existing hint on this field
    const existingHint = field.parentElement?.querySelector(".DONUT_AI_Hint");
    if (existingHint) {
      existingHint.remove();
    }

    // Wrap the field in a relative container if not already wrapped
    let wrapper = field.parentElement;
    if (!wrapper?.classList.contains("DONUT_AI_Hint_Wrapper")) {
      wrapper = document.createElement("span");
      wrapper.className = "DONUT_AI_Hint_Wrapper";
      field.parentElement?.insertBefore(wrapper, field);
      wrapper.appendChild(field);
    }

    const badge = document.createElement("span");
    badge.className = "DONUT_AI_Hint";
    badge.textContent = hintText;
    wrapper.appendChild(badge);

    // Remove hint on first user input
    const removeHint = () => {
      badge.remove();
      field.removeEventListener("input", removeHint);
    };
    field.addEventListener("input", removeHint);
  }
  // #endregion AI-Generated hint

  // #region Image downscaling helper
  /**
   * Default total-pixel budget (width × height). Matches the backend's default maxPixels.
   * ≈ 1792 × 1792.
   */
  private static readonly DEFAULT_MAX_PIXELS = 3211264;

  /**
   * Converts a {@link Blob} (or {@link File}) to a base64 data-URL string,
   * bypassing formcycle's multipart file parser which returns 0-byte {@code FileData}.
   */
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
   */
  private static canvasToFile(canvas: HTMLCanvasElement, fileName: string): File {
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
   * Downscales an image file if its total pixel count (width × height) exceeds
   * {@link maxPixels}, preserving the aspect ratio. Returns the original file
   * unchanged when it is already within the budget.
   *
   * @param file      The image file to check.
   * @param maxPixels Total-pixel budget (width × height).
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
          "AI / ONNX / DONUT",
        );

        const canvas = document.createElement("canvas");
        canvas.width = newW;
        canvas.height = newH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(img.src);
          resolve(file); // fallback: send original
          return;
        }
        ctx.drawImage(img, 0, 0, newW, newH);
        URL.revokeObjectURL(img.src);
        resolve(AI_ONNX_QWEN_QA.canvasToFile(canvas, file.name));
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(file); // cannot decode → send original
      };
      img.src = URL.createObjectURL(file);
    });
  }
  // #endregion Image downscaling helper

  /**
   * Processes a PDF file and returns image blobs for each page or extracted image.
   * Detects whether the PDF contains mainly text or images and processes accordingly.
   *
   * @param file The PDF file to process
   * @param maxPages Maximum number of pages to process (0 = no limit)
   * @returns Array of Blob objects representing images
   */
  private static async processPdfFile(file: File, maxPages = 0): Promise<Blob[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf: PDFDocumentProxy = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: Blob[] = [];
    const pagesToProcess = maxPages > 0 ? Math.min(maxPages, pdf.numPages) : pdf.numPages;

    window.codbi.log(
      "INFO",
      `Processing PDF with ${pdf.numPages} page(s), limiting to ${pagesToProcess} page(s): ${file.name}`,
      "AI / ONNX / DONUT",
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
          "AI / ONNX / DONUT",
        );

        const blob = await AI_ONNX_QWEN_QA.renderPdfPageToImage(page);

        images.push(blob);
      } else {
        window.codbi.log(
          "INFO",
          `PDF page ${pageNum} has minimal text (${textLength} chars) - attempting image extraction`,
          "AI / ONNX / DONUT",
        );

        const extractedImages = await AI_ONNX_QWEN_QA.extractImagesFromPdfPage(page);

        if (extractedImages.length > 0) {
          images.push(...extractedImages);

          window.codbi.log(
            "INFO",
            `Extracted ${extractedImages.length} image(s) from PDF page ${pageNum}`,
            "AI / ONNX / DONUT",
          );
        } else {
          window.codbi.log(
            "INFO",
            `No extractable images found on page ${pageNum} - rendering page to image`,
            "AI / ONNX / DONUT",
          );
          const blob = await AI_ONNX_QWEN_QA.renderPdfPageToImage(page);

          images.push(blob);
        }
      }
    }

    return images;
  }

  /**
   * Renders a PDF page (including text) to a canvas and returns it as an image blob.
   *
   * @param page The PDF page to render
   *
   * @returns Blob containing the rendered page as PNG
   */
  private static async renderPdfPageToImage(page: PDFPageProxy): Promise<Blob> {
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Failed to get canvas 2D context");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

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

  /**
   * Extracts embedded images from a PDF page.
   *
   * @param page The PDF page to extract images from
   *
   * @returns Array of Blob objects representing extracted images
   */
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
            window.codbi.log("WARNING", `Failed to extract individual image: ${imgError}`, "AI / ONNX / DONUT");
          }
        }
      }
    } catch (error) {
      window.codbi.log("WARNING", `Image extraction failed: ${error}`, "AI / ONNX / DONUT");
    }

    return images;
  }
}

window.codbi.registerFunctionality("AI.ONNX.QWEN.QA", AI_ONNX_QWEN_QA.functionality.bind(AI_ONNX_QWEN_QA)); // Initialization
