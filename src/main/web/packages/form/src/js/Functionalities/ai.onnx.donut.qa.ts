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
 * Provides the {@link AI_ONNX_DONUT_QA.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_ONNX_DONUT_QA {
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
   * **Config Parameters:**
   * - **maxPages**:  Optional number limiting how many pages from a PDF are processed and sent to the AI.
   *                  Useful for large PDFs to avoid overwhelming the AI or hitting processing limits.
   *                  If not specified or set to 0, all pages are processed. Example: `maxPages: 5` will
   *                  only process the first 5 pages of any PDF. Defaults to **5**.
   * - **Rotate**:    Optional attribute on the input element to specify image rotation (see above), either "90", "180", or "270".
   *                  In a multi-file upload or with a PDF that contains multiple images, this rotation is applied to all files.
   *
   * Questions are acquired from DOM elements within the parent.parent container of the
   * {@link HTMLInputElement } **toProcess** that're tagged with the class **AI_ONNX_DONUT_QA_Question**.
   * Each such element should have:
   *  - An **id** attribute (used as the question key)
   *  - A **data-cb-Question** attribute (contains the question text)
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "maxpages")
    @IF.PRE(new TYPE("string"), new REGEX(/^(90|180|270)$/), "rotate")
    @IF.PRE(new TYPE("number"), new OR([new EQ(90), new EQ(180), new EQ(270)]), "rotate")
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
      const $ = getJQuery();
      const files = (toProcess as HTMLInputElement).files;

      if (!files || files.length === 0) {
        return;
      }

      AI_ONNX_DONUT_QA.ensurePdfJsWorkerConfigured();

      const formData = new FormData();
      const maxPages = toLoad.maxpages ? Number(toLoad.maxpages) : 5;
      // #region Process files (PDF or Image)
      for (const file of Array.from(files)) {
        if (file.type === "application/pdf") {
          const processedImages = await AI_ONNX_DONUT_QA.processPdfFile(file, maxPages);

          for (let i = 0; i < processedImages.length; i++) {
            const imageName = `${file.name.replace(".pdf", "")}_page_${i + 1}.png`;
            formData.append(imageName, processedImages[i], imageName);
          }
        } else {
          formData.append(file.name, file);
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
      // #region Determine the container of the upload input
      const uploadContainer = document.querySelector(`div .CXUpload:has(#${toProcess.getAttribute("id")})`);

      if (!uploadContainer || !uploadContainer.parentElement) {
        window.codbi.log(
          "ERROR",
          `Could not find upload container for element #${toProcess.getAttribute("id")}. Make sure the input is inside a CXUpload container.`,
          "AI / ONNX / DONUT",
        );
        return;
      }

      const container = uploadContainer.parentElement;
      // #endregion Determine the container of the upload input
      // #region Acquire Questions
      const questionElements = container.querySelectorAll(".AI_ONNX_DONUT_QA_Question");

      for (const element of questionElements) {
        const id = element.id;
        const question = element.getAttribute("data-cb-Question");

        if (id && question) {
          headers[`X-Question-${id}`] = question;
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

      if (Object.keys(headers).length === 0) {
        window.codbi.log(
          "ERROR",
          `No question elements found with class AI_ONNX_DONUT_QA_Question in container "${container.getAttribute("id") || "unknown"}". Cannot proceed without questions. Add elements with class "AI_ONNX_DONUT_QA_Question" and attribute "data-cb-Question" to ask questions.`,
          "AI / ONNX / DONUT",
        );

        return;
      }
      // #endregion Acquire Questions
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

      for (const element of questionElements) {
        const questionLabel = element.parentElement?.querySelector("label") as HTMLElement | null;

        if (questionLabel) {
          const originalText = questionLabel.innerHTML;
          questionLabelData.set(questionLabel, originalText);
          questionLabel.innerHTML = `${originalText}
            <span class = "DONUT_Processing">Processing...</span>`;
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
        url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Donut_vQA`,
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
          unanimate();
          // #region AI error handling
          if (response.error) {
            window.codbi.log("ERROR", `REST failed with: ${response.error}`, "AI / ONNX / DONUT");
            return;
          }
          // #endregion AI error handling
          for (const key in response) {
            for (const key2 in response[key]) {
              (document.querySelector(`#${key2}`) as HTMLInputElement).value = response[key][key2];
            }
          }
        },
        error: (xhr, status, error) => {
          unanimate();

          window.codbi.log("ERROR", `REST failed with status "${status}" cause: "${error}"`, "AI / ONNX / DONUT");
        },
      });
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
   * and guards against repeated initialization via {@link AI_ONNX_DONUT_QA.pdfJsWorkerConfigured}.
   */
  private static ensurePdfJsWorkerConfigured(): void {
    if (AI_ONNX_DONUT_QA.pdfJsWorkerConfigured) {
      return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.codbi.baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.worker.min.js`;

    AI_ONNX_DONUT_QA.pdfJsWorkerConfigured = true;

    window.codbi.log(
      "INFO",
      `PDF.js worker configured: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`,
      "AI / ONNX / DONUT",
    );
  }

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

        const blob = await AI_ONNX_DONUT_QA.renderPdfPageToImage(page);

        images.push(blob);
      } else {
        window.codbi.log(
          "INFO",
          `PDF page ${pageNum} has minimal text (${textLength} chars) - attempting image extraction`,
          "AI / ONNX / DONUT",
        );

        const extractedImages = await AI_ONNX_DONUT_QA.extractImagesFromPdfPage(page);

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
          const blob = await AI_ONNX_DONUT_QA.renderPdfPageToImage(page);

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
  //region Initialization
  /**
   * States whether this {@link AI } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("AI.ONNX.DONUT.QA", AI_ONNX_DONUT_QA.functionality);
  })();
  //endregion Initialization
}
