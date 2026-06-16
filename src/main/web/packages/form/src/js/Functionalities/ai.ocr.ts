// IMPORTANT: When adding code to this file, wrap every block of code you add with a proper //#region & //#endregion comment.
//region Imports
//region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
//endregion XIMA
//region XDBC
import { DBC } from "xdbc/src/DBC";
import { EQ } from "xdbc/src/DBC/EQ";
import { IF } from "xdbc/src/DBC/IF";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
//endregion XDBC
//region PDF
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
//endregion PDF
import { CodBiError } from "../global-scope";
import { formatWaitTime } from "../commons/format-wait-time";
//endregion Imports
/**
 * Provides the {@link AI.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net)
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_OCR {
  /**
   * This functionality scans the selected files of a {@link HTMLInputElement } either prints the scanned text, extracts
   * substrings from the scanned text or verifies that the scanned text matches the pattern using the Tesseract AI-OCR engine.
   *
   * **PDF Support**: PDF files are automatically detected. PDFs with text (>100 characters) are processed client-side without
   * using the AI backend. PDFs with minimal text (scanned documents) are rendered to images and sent to Tesseract for OCR.
   *
   * **Automatic Orientation Detection:**
   * The Tesseract OCR engine will automatically detect and correct image orientation using its OSD (Orientation
   * and Script Detection).
   *
   * #### Config Parameter:
   *  - **Mode**:                 Either **Print**, **Verify** or **Extract Fields**.
   *  - **Pattern**:              The {@link RegEx } to use to either extract the substrings from the scanned text or to verify that
   *                              the scanned text matches the pattern.
   *                              When the mode is **Extract Fields** all fields within the parent container of the one containing
   *                              the {@link HTMLInputElement } toProcess that have the CodBi-CSS-Class **CodBi_AI_OCR_Receiver** are
   *                              used to receive the extracted fields. For each such field, a corresponding parameter
   *                              **Pattern_...** must be defined to specify the {@link RegEx } to use to extract the substrings
   *                              from the scanned text for that field. The name of the field is specified after the dash and are
   *                              matched to the **data-cb-Field** of the field to extract the substrings from the scanned text.
   *  - **Separator**:            If **Mode** is set to **Extract Fields**, this parameter defines the separator for the results of
   *                              multiple files. Default is a comma.
   *  - **MaxPages**:             Maximum number of PDF pages to process (default: 5). Set to 0 for no limit. Only applies to PDFs.
   *  - **RegExFlags**:           Optional regex flags to apply to all patterns (e.g., "i" for case-insensitive, "m" for multiline,
   *                              "s" for dotall). Multiple flags can be combined (e.g., "im"). These flags are transmitted to the
   *                              Tesseract servlet and applied to pattern matching.
   *  - **Preprocess**:           Optional boolean flag to enable image preprocessing before OCR. When set to **true**, applies
   *                              grayscale conversion, adaptive binarization (Otsu's method), and noise reduction to improve
   *                              text recognition accuracy. Default is **false**.
   *  - **InvalidImageText**:     The text to display if one or more of the images do not comply to the specified **Pattern** in
   *                              mode **Verify**.
   *  - **WrongFileMessage**:     The text to display for the manual verification checkbox label in mode **Verify**.
   *  - **ProcessingImageText**:  The text to append to the label of the {@link HTMLInputElement } toProcess while the images
   *                              are processed.
   *  - **Maximum**               The number of files that may be uploaded. If the number of selected files exceeds this number,
   *                              the processing is aborted and a warning is logged in the console.
   *  - **QueueBadge**:           If set to `"true"`, shows a badge with the current queue position while
   *                              waiting for inference. Overrides the `AI_QueueBadge` plugin property
   *                              for this instance. Default: determined by plugin property.
   *  - **QueueText**:            Text appended after the queue position number in the badge
   *                              (e.g. `"in queue"` → badge shows `"3 in queue"`). Default: empty.
   *
   * ### CSS Classes:
   * - **CodBi_AI_OCR_Receiver**: Elements with this class within the parent container of the one holding the
   *                              {@link HTMLInputElement } **toProcess** are used to receive the extracted fields when **Mode** is
   *                              set to **Extract Fields**. Each such element should have **data-cb-Field** set to the name of the
   *                              field to receive the extracted text for (see **Pattern_...** config parameter).
   *                              In **Print** mode, a single textarea with this class is expected to receive the full OCR text
   *                              output.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE(
      "string",
      "mode :: pattern :: invalidimagetext :: wrongfilemessage :: processingimagetext :: separator :: regexflags :: queuebadge :: queuetext",
    )
    @REGEX.PRE(/^(Print|Verify|Extract Fields)$/i, "mode")
    @REGEX.PRE(/^\S+$/, "separator")
    @REGEX.PRE(/^\d+$/, "maxpages")
    @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "maxpages")
    @IF.PRE(new TYPE("string"), new REGEX(REGEX.stdExp.boolean), "preprocess")
    @IF.PRE(new TYPE("string"), new TYPE("boolean"), "preprocess", true)
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
      const container =
        (toProcess as HTMLElement).closest(".XContainer, .XFieldSet") ??
        document.querySelector(`div .CXUpload:has( #${toProcess.getAttribute("id")})`).parentElement;

      // #region Symbol resolution for pattern/question
      // If the pattern contains symbols like <[FieldName]>, replace them with the value of the field with that CSS class in the same container
      if (typeof toLoad.pattern === "string") {
        toLoad.pattern = toLoad.pattern.replace(/<\[([^\]]+)\]>/g, (match, identifier) => {
          const trimmed = identifier.trim();
          const field = container.querySelector(`.${trimmed}`) as HTMLInputElement | null;
          if (field && "value" in field) {
            return field.value;
          }
          return match;
        });
      }
      // Also resolve symbols in Pattern_* fields (for Extract Fields mode)
      // biome-ignore lint/complexity/noForEach: <explanation>
      Object.keys(toLoad).forEach((key) => {
        if (key.startsWith("pattern_") && typeof toLoad[key] === "string") {
          toLoad[key] = (toLoad[key] as string).replace(/<\[([^\]]+)\]>/g, (match, identifier) => {
            const trimmed = identifier.trim();
            const field = container.querySelector(`.${trimmed}`) as HTMLInputElement | null;
            if (field && "value" in field) {
              return field.value;
            }
            return match;
          });
        }
      });
      // #endregion Symbol resolution for pattern/question
      const $ = getJQuery();
      const files = (toProcess as HTMLInputElement).files;
      // Configure PDF.js worker if needed
      AI_OCR.ensurePdfJsWorkerConfigured();

      //#region Check Maximum parameter
      const maximum = toLoad.maximum ? Number(toLoad.maximum) : 2;
      if (maximum && files.length > maximum) {
        window.codbi.log(
          "WARNING",
          `Maximum file limit exceeded. Number of selected files(${files.length}) exceeds > ${maximum}, thus processing will occur.`,
          "AI / OCR",
        );
        return;
      }
      //#endregion Check Maximum parameter

      const formData = new FormData();
      const maxPages = toLoad.maxpages ? Number(toLoad.maxpages) : 5;
      toLoad.processingimagetext = toLoad.processingimagetext ? toLoad.processingimagetext : "Processing...";
      toLoad.invalidimagetext = toLoad.invalidimagetext
        ? toLoad.invalidimagetext
        : "At least one of the images you selected did not contain the expected content.";
      // #region Process files (PDF or Image)
      const pdfTextResults: { [filename: string]: string } = {};

      for (const file of Array.from(files)) {
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        if (isPdf) {
          try {
            const pdfResult = await AI_OCR.processPdfFile(file, maxPages);

            if (pdfResult.hasText) {
              pdfTextResults[file.name] = pdfResult.text;
            } else {
              for (let i = 0; i < pdfResult.images.length; i++) {
                const imageName = `${file.name.replace(".pdf", "")}_page_${i + 1}.png`;

                formData.append(imageName, pdfResult.images[i], imageName);
              }
            }
          } catch (err) {
            window.codbi.log("ERROR", `Failed to process PDF '${file.name}': ${err}`, "AI / OCR");
            // Fall back: render as image for OCR server-side.
            const downscaledImage = await AI_OCR.downscaleImageForOCR(file);
            formData.append(file.name, downscaledImage, file.name);
          }
        } else {
          const downscaledImage = await AI_OCR.downscaleImageForOCR(file);

          formData.append(file.name, downscaledImage, file.name);
        }
      }
      // #endregion Process files (PDF or Image)
      // #region Build X-FieldPatterns from Pattern_* fields, if in Extract Fields mode
      const fieldPatterns: Array<{ [key: string]: string }> = [];

      if ((toLoad.mode as string).toLowerCase() === "extract fields") {
        const patternKeys = Object.keys(toLoad).filter((key) => key.startsWith("pattern_"));

        for (const patternKey of patternKeys) {
          const fieldName = patternKey.substring(8);
          const pattern = TYPE.tsCheck<string>(
            toLoad[patternKey],
            "string",
            `Does the attribute "${patternKey}" contain a regular expression pattern?`,
          );

          if (fieldName && pattern) {
            const fieldObj: { [key: string]: string } = {};

            fieldObj[fieldName] = encodeURIComponent(
              pattern.replace(/°\{/g, "{").replace(/°\}/g, "}").replace(/°/g, "^"),
            );

            fieldPatterns.push(fieldObj);
          }
        }
      }

      const fieldPatternsJson = fieldPatterns.length > 0 ? JSON.stringify(fieldPatterns) : "";
      // endregion Build X-FieldPatterns from Pattern_* fields, if in Extract Fields mode
      // #region Disable input and show loading animation
      (toProcess as HTMLElement).style.pointerEvents = "none";
      (toProcess as HTMLElement).style.opacity = "0.5";

      window.codbi.injectLoadingAnim(toProcess);

      const label = INSTANCE.tsCheck<HTMLLabelElement>(
        (toProcess as HTMLElement).parentElement.querySelector("label"),
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
      // endregion Disable input and show loading animation
      // #region Define how to remove the loading animation and restore the label
      const unanimate = () => {
        window.codbi.removeLoaderAnim(toProcess);

        (toProcess as HTMLElement).style.pointerEvents = "all";
        (toProcess as HTMLElement).style.opacity = "1";
        label.innerHTML = formerText;
      };
      // endregion Define how to remove the loading animation and restore the label
      // #region Process PDF text results client-side if any
      let clientSideResponse: { [key: string]: unknown } = {};

      if (Object.keys(pdfTextResults).length > 0) {
        clientSideResponse = AI_OCR.processTextClientSide(
          pdfTextResults,
          toLoad.mode as string,
          toLoad.pattern as string | undefined,
          fieldPatterns,
          toLoad.regexflags as string | undefined,
        );
      }
      // #endregion Process PDF text results client-side
      // #region Determine if server call is needed
      const needsServerCall = formData.has(formData.keys().next().value);

      if (!needsServerCall) {
        AI_OCR.handleResponse(clientSideResponse, toLoad, toProcess, toLoad.invalidimagetext as string, $);
        unanimate();

        return;
      }
      // #endregion Determine if server call is needed
      // #region Send the request to the Tesseract AI OCR API
      const ajaxHeaders: { [key: string]: string } = { "X-Mode": toLoad.mode as string };

      if ((toLoad.mode as string).toLowerCase() !== "print") {
        ajaxHeaders["X-Pattern"] = encodeURIComponent(
          toLoad.pattern ? (toLoad.pattern as string).replace(/°\{/g, "{").replace(/°\}/g, "}").replace(/°/g, "^") : "",
        );
      }

      if ((toLoad.mode as string).toLowerCase() === "extract fields" && fieldPatternsJson.length > 0) {
        ajaxHeaders["X-FieldPatterns"] = encodeURIComponent(fieldPatternsJson);
      }

      if (toLoad.regexflags) {
        ajaxHeaders["X-RegexFlags"] = toLoad.regexflags as string;
      }
      // #region Set Preprocessing-Header, if defined in passed parameter.
      if (toLoad.preprocess && (toLoad.preprocess as string).toLowerCase() === "true") {
        if (typeof toLoad.preprocess === "string") {
          const preprocessValue = (toLoad.preprocess as string).toLowerCase();

          ajaxHeaders["X-Preprocess"] = preprocessValue === "true" || preprocessValue === "t" ? "true" : "false";
        } else {
          ajaxHeaders["X-Preprocess"] = (toLoad.preprocess as boolean) ? "true" : "false";
        }
      }
      // #endregion Set Preprocessing-Header, if defined in passed parameter.
      // #region Queue badge configuration.
      const ocrQueueOverride: boolean | null = toLoad.queuebadge != null ? String(toLoad.queuebadge) !== "false" : null;
      const ocrQueueText: string = toLoad.queuetext != null ? String(toLoad.queuetext) : "";
      let ocrQueueBadgeEl: HTMLSpanElement | null = null;

      const showOcrQueueBadge = (position: number, estimatedWaitMs?: number | null) => {
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
      // #endregion Queue badge configuration.
      let ocrQueueTicket: string | null = null;

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
              setTimeout(sendOcrRequest, 1000);
              return;
            }
            hideOcrQueueBadge();
            ocrQueueTicket = null;
            const mergedResponse = { ...clientSideResponse, ...parsedResponse };

            AI_OCR.handleResponse(mergedResponse, toLoad, toProcess, toLoad.invalidimagetext as string, $);
            unanimate();
          },
          error: (xhr, status, error) => {
            hideOcrQueueBadge();
            unanimate();

            throw new CodBiError(`❌ Tesseract AI OCR request failed with status (${status}) due to: ${error}`);
          },
        });
      };
      sendOcrRequest();
      // #endregion Send the request to the Tesseract AI OCR API
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
  private static async downscaleImageForOCR(file: File): Promise<Blob> {
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
  /** States whether the PDF.js worker is configured with the correct URL or not. */
  private static pdfJsWorkerConfigured = false;
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
  private static ensurePdfJsWorkerConfigured(): void {
    if (AI_OCR.pdfJsWorkerConfigured) {
      return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.codbi.baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.worker.min.js`;

    AI_OCR.pdfJsWorkerConfigured = true;

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
  private static async processPdfFile(
    file: File,
    maxPages: number,
  ): Promise<{ hasText: boolean; text?: string; images?: Blob[] }> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf: PDFDocumentProxy = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = Math.min(pdf.numPages, maxPages);
    let fullText = "";
    const images: Blob[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page: PDFPageProxy = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => ("str" in item ? item.str : "")).join(" ");

      fullText += `${pageText}\n`;
    }

    const hasText = fullText.trim().length > 0;

    if (!hasText) {
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page: PDFPageProxy = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        const blob = await new Promise<Blob>((resolve) => {
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
  private static processTextClientSide(
    pdfTextResults: { [filename: string]: string },
    mode: string,
    pattern?: string,
    fieldPatterns?: Array<{ [key: string]: string }>,
    regexFlags?: string,
  ): { [key: string]: unknown } {
    const results: { [key: string]: unknown } = {};

    for (const [filename, text] of Object.entries(pdfTextResults)) {
      switch (mode.toLowerCase()) {
        case "print":
          results[filename] = text;
          break;
        case "verify":
          if (pattern) {
            const decoded = pattern.replace(/°\{/g, "{").replace(/°\}/g, "}").replace(/°/g, "^");
            const regex = new RegExp(decoded, regexFlags || "");
            results[filename] = regex.test(text);
          }
          break;
        case "extract fields":
          if (fieldPatterns) {
            const fieldResults: { [key: string]: string[] } = {};

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
  private static handleResponse(
    response: unknown,
    toLoad: { [key: string]: unknown },
    toProcess: Element,
    tsInvalidimagetext: string,
    $: JQueryStatic,
  ): void {
    if ((toLoad.mode as string).toLowerCase() === "print") {
      const parent2 = toProcess.parentElement?.parentElement?.parentElement || null;

      if (parent2) {
        const receiverElem = INSTANCE.tsCheck<HTMLTextAreaElement | null>(
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
          // Resize the textarea to fit its content.
          const initialHeight = receiverElem.offsetHeight;
          receiverElem.style.height = "auto";
          const scrollH = receiverElem.scrollHeight;
          const pad = receiverElem.offsetHeight - receiverElem.clientHeight;
          const finalHeight = scrollH + pad;

          receiverElem.style.height = `${Math.max(finalHeight, initialHeight)}px`;
        } else {
          window.codbi.log(
            "INFO",
            `Receiver element with class 'CodBi_AI_OCR_Receiver' not found in #${toProcess.parentElement.parentElement.getAttribute("id")}.`,
            "AI / OCR",
          );
        }
      }
    }
    // #endregion Print mode: Place result(s) in <textarea>
    // #region Extract fields mode: Set values on of CSS-Class "CodBi_AI_OCR_Receiver"
    if (
      (toLoad.mode as string).toLowerCase() === "extract fields" &&
      typeof response === "object" &&
      response !== null
    ) {
      const parent3 = toProcess.parentElement?.parentElement?.parentElement || null;

      if (parent3) {
        const receivers = parent3.querySelectorAll(".CodBi_AI_OCR_Receiver");

        for (const elem of receivers) {
          const field = (elem as HTMLElement).getAttribute("data-cb-Field").toLowerCase();

          if (field) {
            const separator = toLoad.separator ? (toLoad.separator as string) : ",";
            const collectedValues: string[] = [];

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
                INSTANCE.tsCheckMulti<HTMLInputElement | HTMLTextAreaElement>(
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
    // #endregion Extract fields mode: Set values on of CSS-Class "CodBi_AI_OCR_Receiver"
    // #region Validate verify mode results
    if ((toLoad.mode as string).toLowerCase() === "verify") {
      if (Object.values(response as { [key: string]: boolean }).some((result) => result === false)) {
        $(toProcess).error(tsInvalidimagetext);
        // #region Add styles for manual verification checkbox
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
        // #endregion Add styles for manual verification checkbox
        // #region Remove existing manual verify checkbox
        const existingManualVerify =
          toProcess.parentElement.parentElement.querySelectorAll(".CodBi_AI_OCR_ManualVerify");
        for (let i = 0; i < existingManualVerify.length; i++) {
          existingManualVerify[i].remove();
        }
        // #endregion Remove existing manual verify checkbox
        // #region Create checkbox for manual verification
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
          ? (toLoad.wrongfilemessage as string)
          : "The content is not as expected. Please check if you selected the correct file(s). You may manually verify that it is the correct one by clicking the checkbox.";
        label.style.marginBottom = "0";
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        toProcess.parentElement.insertAdjacentElement("afterend", checkboxContainer);
        // #endregion Create checkbox for manual verification
        // #region Handle checkbox change
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            $(toProcess).error("");
          } else {
            $(toProcess).error(tsInvalidimagetext);
          }
        });
        // #endregion Handle checkbox change
      } else {
        $(toProcess).error("");
        // #region Remove manual verify checkbox and text if present
        const existingManualVerify =
          toProcess.parentElement.parentElement.querySelectorAll(".CodBi_AI_OCR_ManualVerify");
        for (let i = 0; i < existingManualVerify.length; i++) {
          existingManualVerify[i].remove();
        }
        // #endregion Remove manual verify checkbox and text if present
      }
    }
    // #endregion Validate verify mode results
  }
}

window.codbi.registerFunctionality("AI.OCR", AI_OCR.functionality.bind(AI_OCR)); // Initialization
