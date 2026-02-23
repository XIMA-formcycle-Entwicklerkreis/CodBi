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
 * Provides the {@link AI_ONNX_QWEN_CHAT.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_ONNX_QWEN_CHAT {
  /**
   * This functionality turns a set of HTML elements into a chat interface for the Qwen2-VL vision-language model.
   * It enables interactive, multi-turn conversations about uploaded images and PDF documents.
   *
   * **Required Elements (found by CSS class within the nearest common ancestor):**
   *
   * | CSS Class                      | Element                                | Purpose                                          |
   * |-------------------------------|----------------------------------------|--------------------------------------------------|
   * | *(functionality class)*        | `<textarea>`                           | Chat display (read-only conversation history)    |
   * | `AI_ONNX_QWEN_Chat_Input`     | `<input type="text">` or `<textarea>` | Text input where the user types messages         |
   * | `AI_ONNX_QWEN_Chat_Send`      | `<button>`                             | Send button (triggers inference)                 |
   * | `AI_ONNX_QWEN_Chat_Stop`      | `<button>`                             | Stop button (aborts running inference)           |
   * | `AI_ONNX_QWEN_Chat_Upload`    | `<input type="file">`                  | File upload for images/PDFs to chat about        |
   *
   * **Behavior:**
   * - The display textarea is made read-only and shows the full conversation history.
   * - When files are selected via the upload input, they are attached for subsequent messages.
   * - When the user clicks Send (or presses Enter in the input), the message and any attached files
   *   are sent to the Qwen2-VL backend. The response is displayed in the chat.
   * - PDF files are automatically detected and processed (rendered to images or extracted).
   * - Multiple files can be attached; each is processed independently by the model.
   * - The send button and input are disabled during inference to prevent duplicate requests.
   *
   * **Image Orientation:** Same as {@link AI_ONNX_DONUT_QA.functionality} — supports `data-cb-Rotate`
   * attribute and automatic OSD detection.
   *
   * ### Config Parameters:
   * - **maxPages**: Maximum PDF pages to process (default: 5).
   * - **Rotate**:   Image rotation in degrees (90, 180, or 270).
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. Must be a `<textarea>` element (the chat display). */
  @DBC.ParamvalueProvider
  public static functionality(
    @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "maxpages")
    @IF.PRE(new TYPE("string"), new REGEX(/^(90|180|270)$/), "rotate")
    @IF.PRE(new TYPE("number"), new OR([new EQ(90), new EQ(180), new EQ(270)]), "rotate")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(HTMLTextAreaElement, undefined, "Must be a <textarea> element tagged with this functionality.")
    toProcess: Element,
  ): void {
    const $ = getJQuery();
    const chatDisplay = toProcess as HTMLTextAreaElement;
    chatDisplay.readOnly = true;
    chatDisplay.style.resize = "vertical";

    // #region Discover sibling elements by walking up to the nearest common ancestor
    let container: Element | null = toProcess.parentElement;
    while (container && container !== document.body) {
      if (container.querySelector(".AI_ONNX_QWEN_Chat_Input") && container.querySelector(".AI_ONNX_QWEN_Chat_Send")) {
        break;
      }
      container = container.parentElement;
    }

    if (!container || container === document.body) {
      window.codbi.log(
        "ERROR",
        "Could not find a container with .AI_ONNX_QWEN_Chat_Input and .AI_ONNX_QWEN_Chat_Send elements. " +
          "Ensure these elements exist within a common ancestor of the chat display textarea.",
        "AI / ONNX / QWEN / CHAT",
      );
      return;
    }

    const chatInput = container.querySelector(".AI_ONNX_QWEN_Chat_Input") as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;
    const sendButton = container.querySelector(".AI_ONNX_QWEN_Chat_Send") as HTMLButtonElement | null;
    const stopButton = container.querySelector(".AI_ONNX_QWEN_Chat_Stop") as HTMLButtonElement | null;
    const fileUpload = container.querySelector(".AI_ONNX_QWEN_Chat_Upload") as HTMLInputElement | null;

    if (!chatInput) {
      window.codbi.log(
        "ERROR",
        "No element with class .AI_ONNX_QWEN_Chat_Input found in container.",
        "AI / ONNX / QWEN / CHAT",
      );
      return;
    }
    if (!sendButton) {
      window.codbi.log(
        "ERROR",
        "No element with class .AI_ONNX_QWEN_Chat_Send found in container.",
        "AI / ONNX / QWEN / CHAT",
      );
      return;
    }
    // #endregion Discover sibling elements

    let isBusy = false;
    let attachedFiles: File[] = [];
    /** Character position in chatDisplay.value before the "thinking" indicator was appended. */
    let thinkingCursorPos = -1;
    /** The active stream session ID, used by the stop button to abort inference. */
    let activeStreamId: string | null = null;
    /** Multi-turn conversation history. Sent to the backend so Qwen can remember prior turns. */
    const conversationHistory: { role: string; content: string }[] = [];

    // #region Helper: append a message block to the chat display
    const appendToChat = (text: string): void => {
      if (chatDisplay.value.length > 0) {
        chatDisplay.value += "\n\n";
      }
      chatDisplay.value += text;
      chatDisplay.scrollTop = chatDisplay.scrollHeight;
    };
    // #endregion Helper: append a message block to the chat display

    // #region Helper: replace the "thinking" indicator with the real response
    const replaceThinking = (text: string): void => {
      if (thinkingCursorPos >= 0) {
        chatDisplay.value = chatDisplay.value.substring(0, thinkingCursorPos);
        thinkingCursorPos = -1;
      }
      appendToChat(text);
    };
    // #endregion Helper: replace the "thinking" indicator with the real response

    // #region File upload change handler
    if (fileUpload) {
      fileUpload.addEventListener("change", () => {
        const files = fileUpload.files;
        if (files && files.length > 0) {
          attachedFiles = Array.from(files);
          const names = attachedFiles.map((f) => f.name).join(", ");
          appendToChat(`📎 ${attachedFiles.length} file(s) attached: ${names}`);
          window.codbi.log("INFO", `Chat files attached: ${names}`, "AI / ONNX / QWEN / CHAT");
        } else {
          attachedFiles = [];
        }
      });
    }
    // #endregion File upload change handler

    // #region Send message handler
    const sendMessage = async (): Promise<void> => {
      const message = chatInput.value.trim();
      if (!message || isBusy) {
        return;
      }

      appendToChat(`You: ${message}`);
      chatInput.value = "";
      conversationHistory.push({ role: "user", content: message });

      isBusy = true;
      sendButton.disabled = true;
      if ("disabled" in chatInput) {
        (chatInput as HTMLInputElement).disabled = true;
      }

      // Show thinking indicator and remember position for replacement
      thinkingCursorPos = chatDisplay.value.length;
      appendToChat("Qwen: ⏳ Thinking...");

      try {
        AI_ONNX_QWEN_CHAT.ensurePdfJsWorkerConfigured();

        const formData = new FormData();
        const maxPages = toLoad.maxpages ? Number(toLoad.maxpages) : 5;

        // #region Process attached files (PDF or Image)
        for (const file of attachedFiles) {
          if (file.type === "application/pdf") {
            const processedImages = await AI_ONNX_QWEN_CHAT.processPdfFile(file, maxPages);
            for (let i = 0; i < processedImages.length; i++) {
              const imageName = `${file.name.replace(".pdf", "")}_page_${i + 1}.png`;
              formData.append(imageName, processedImages[i], imageName);
            }
          } else {
            // Downscale large images client-side to reduce upload size and inference time
            const downscaled = await AI_ONNX_QWEN_CHAT.downscaleImageIfNeeded(file);
            window.codbi.log(
              "INFO",
              `Appending '${file.name}' to FormData: blob.size=${downscaled.size}, blob.type=${downscaled.type}`,
              "AI / ONNX / QWEN / CHAT",
            );
            formData.append(file.name, downscaled, file.name);
          }
        }
        // Clear after processing — files are only sent once, not on every message
        attachedFiles = [];
        if (fileUpload) fileUpload.value = "";
        // #endregion Process attached files (PDF or Image)

        // #region Build request headers
        const headers: { [key: string]: string } = {};

        if (toLoad.rotate && toLoad.rotate !== "0" && toLoad.rotate !== 0) {
          headers["X-Rotate"] = toLoad.rotate.toString();
        }

        headers["X-Question-chat"] = message;
        headers["X-Stream"] = "true";
        headers["X-Chat-History"] = btoa(unescape(encodeURIComponent(JSON.stringify(conversationHistory))));
        // #endregion Build request headers

        // #region Helper: finish streaming and re-enable UI
        const finishStreaming = (): void => {
          activeStreamId = null;
          isBusy = false;
          sendButton.disabled = false;
          if (stopButton) {
            stopButton.disabled = true;
          }
          if ("disabled" in chatInput) {
            (chatInput as HTMLInputElement).disabled = false;
          }
          chatInput.focus();
        };
        // #endregion Helper: finish streaming and re-enable UI

        // #region Helper: poll a streaming session until done
        const pollStream = (streamId: string): void => {
          let lastText = "";
          /** Position in chatDisplay.value where the stream output starts (after "Qwen: "). */
          let streamStartPos = -1;
          const interval = setInterval(() => {
            $.ajax({
              url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Qwen_vQA`,
              type: "POST",
              dataType: "json",
              processData: false,
              contentType: false,
              cache: false,
              beforeSend: (xhr) => {
                xhr.setRequestHeader("X-Stream-Poll", streamId);
              },
              success: (pollResponse) => {
                if (pollResponse.error && pollResponse.done === undefined) {
                  // Session not found or expired
                  clearInterval(interval);
                  replaceThinking(`Qwen: ! ${pollResponse.error}`);
                  finishStreaming();
                  return;
                }
                const text: string = pollResponse.text ?? "";
                if (text.length > lastText.length) {
                  lastText = text;
                  // First update: remove "⏳ Thinking..." and mark start position
                  if (thinkingCursorPos >= 0) {
                    chatDisplay.value = chatDisplay.value.substring(0, thinkingCursorPos);
                    thinkingCursorPos = -1;
                    streamStartPos = chatDisplay.value.length;
                  }
                  // Overwrite previous partial output, then re-append
                  if (streamStartPos >= 0) {
                    chatDisplay.value = chatDisplay.value.substring(0, streamStartPos);
                  }
                  appendToChat(`Qwen: ${text}`);
                }
                if (pollResponse.done) {
                  clearInterval(interval);
                  if (pollResponse.error) {
                    if (streamStartPos >= 0) {
                      chatDisplay.value = chatDisplay.value.substring(0, streamStartPos);
                    }
                    appendToChat(`Qwen: ! ${pollResponse.error}`);
                    conversationHistory.pop(); // remove failed user turn
                  } else if (lastText) {
                    conversationHistory.push({ role: "assistant", content: lastText });
                  }
                  finishStreaming();
                }
              },
              error: () => {
                clearInterval(interval);
                replaceThinking("Qwen: ! Stream polling failed.");
                finishStreaming();
              },
            });
          }, 250);
        };
        // #endregion Helper: poll a streaming session until done

        // #region Send AJAX request to Qwen backend
        $.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Qwen_vQA`,
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
            if (response.error) {
              replaceThinking(`Qwen: ! ${response.error}`);
              conversationHistory.pop(); // remove failed user turn
              finishStreaming();
              return;
            }

            // Streaming: backend returns { streamId: "..." }
            if (response.streamId) {
              activeStreamId = response.streamId;
              if (stopButton) {
                stopButton.disabled = false;
              }
              window.codbi.log("INFO", `Stream started: ${response.streamId}`, "AI / ONNX / QWEN / CHAT");
              pollStream(response.streamId);
              return;
            }

            // Non-streaming fallback: { "filename": { "chat": "answer" }, ... }
            const fileKeys = Object.keys(response);

            if (fileKeys.length === 0) {
              replaceThinking("Qwen: (no response received)");
              finishStreaming();
              return;
            }

            if (fileKeys.length === 1) {
              const fileAnswers = response[fileKeys[0]];
              const answerKeys = Object.keys(fileAnswers || {});
              const answer =
                fileAnswers?.chat ?? (answerKeys.length > 0 ? String(fileAnswers[answerKeys[0]]) : "(no answer)");
              replaceThinking(`Qwen: ${answer}`);
              conversationHistory.push({ role: "assistant", content: answer });
            } else {
              let combined = "Qwen:";
              for (const fileKey of fileKeys) {
                const fileAnswers = response[fileKey];
                const answerKeys = Object.keys(fileAnswers || {});
                const answer =
                  fileAnswers?.chat ?? (answerKeys.length > 0 ? String(fileAnswers[answerKeys[0]]) : "(no answer)");
                combined += `\n\n📄 ${fileKey}:\n${answer}`;
              }
              replaceThinking(combined);
              conversationHistory.push({
                role: "assistant",
                content: combined.substring(combined.indexOf(":") + 1).trim(),
              });
            }
            finishStreaming();
          },
          error: (xhr, status, error) => {
            replaceThinking(`Qwen: ! Request failed (${status}): ${error}`);
            window.codbi.log("ERROR", `Chat request failed: ${status} — ${error}`, "AI / ONNX / QWEN / CHAT");
            conversationHistory.pop(); // remove failed user turn
            finishStreaming();
          },
        });
        // #endregion Send AJAX request to Qwen backend
      } catch (ex) {
        replaceThinking(`Qwen: ! Error: ${ex}`);
        conversationHistory.pop(); // remove failed user turn
        isBusy = false;
        sendButton.disabled = false;
        if ("disabled" in chatInput) {
          (chatInput as HTMLInputElement).disabled = false;
        }
      }
    };
    // #endregion Send message handler

    // #region Wire up event listeners
    sendButton.addEventListener("click", () => {
      sendMessage();
    });

    // #region Stop button: sends X-Stream-Stop header to abort running inference
    if (stopButton) {
      stopButton.disabled = true;
      stopButton.addEventListener("click", () => {
        if (!activeStreamId) {
          return;
        }
        const idToStop = activeStreamId;
        window.codbi.log("INFO", `Stop requested for stream: ${idToStop}`, "AI / ONNX / QWEN / CHAT");
        $.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Qwen_vQA`,
          type: "POST",
          dataType: "json",
          processData: false,
          contentType: false,
          cache: false,
          beforeSend: (xhr) => {
            xhr.setRequestHeader("X-Stream-Poll", idToStop);
            xhr.setRequestHeader("X-Stream-Stop", "true");
          },
        });
      });
    }
    // #endregion Stop button

    chatInput.addEventListener("keydown", ((e: KeyboardEvent) => {
      const isTextarea = chatInput instanceof HTMLTextAreaElement;
      // <input>: Enter sends; <textarea>: Ctrl+Enter sends (Enter = newline)
      if (e.key === "Enter" && (isTextarea ? e.ctrlKey : !e.shiftKey)) {
        e.preventDefault();
        sendMessage();
      }
    }) as EventListener);
    // #endregion Wire up event listeners

    appendToChat("💬 Qwen Chat ready. Attach file(s) and type your question.");

    window.codbi.log("INFO", "Qwen Chat functionality initialized", "AI / ONNX / QWEN / CHAT");
  }

  // #region PDF.js helpers (shared logic with ai.onnx.donut.qa.ts)

  private static pdfJsWorkerConfigured = false;

  private static ensurePdfJsWorkerConfigured(): void {
    if (AI_ONNX_QWEN_CHAT.pdfJsWorkerConfigured) {
      return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.codbi.baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.worker.min.js`;

    AI_ONNX_QWEN_CHAT.pdfJsWorkerConfigured = true;

    window.codbi.log(
      "INFO",
      `PDF.js worker configured: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`,
      "AI / ONNX / QWEN / CHAT",
    );
  }

  // #region Image downscaling helper
  /**
   * Maximum pixel dimension (width or height) for images sent to the backend.
   * Images exceeding this on either axis are downscaled proportionally using a canvas.
   * 1792px aligns with the backend's default maxPixels budget (3211264 ≈ 1792×1792).
   */
  private static readonly MAX_IMAGE_DIMENSION = 1792;

  /**
   * Downscales an image file if either dimension exceeds {@link MAX_IMAGE_DIMENSION}.
   * Returns the original file (as-is) if it's already within limits, otherwise a
   * downscaled PNG Blob.
   */
  private static async downscaleImageIfNeeded(file: File): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = AI_ONNX_QWEN_CHAT.MAX_IMAGE_DIMENSION;
        if (img.width <= maxDim && img.height <= maxDim) {
          URL.revokeObjectURL(img.src);
          resolve(file);
          return;
        }
        const scale = Math.min(maxDim / img.width, maxDim / img.height);
        const newW = Math.round(img.width * scale);
        const newH = Math.round(img.height * scale);

        window.codbi.log(
          "INFO",
          `Downscaling ${file.name}: ${img.width}×${img.height} → ${newW}×${newH}`,
          "AI / ONNX / QWEN / CHAT",
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
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file); // fallback
          }
        }, "image/png");
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(file); // cannot decode → send original
      };
      img.src = URL.createObjectURL(file);
    });
  }
  // #endregion Image downscaling helper

  private static async processPdfFile(file: File, maxPages = 0): Promise<Blob[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf: PDFDocumentProxy = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: Blob[] = [];
    const pagesToProcess = maxPages > 0 ? Math.min(maxPages, pdf.numPages) : pdf.numPages;

    window.codbi.log(
      "INFO",
      `Processing PDF with ${pdf.numPages} page(s), limiting to ${pagesToProcess} page(s): ${file.name}`,
      "AI / ONNX / QWEN / CHAT",
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
          `PDF page ${pageNum} contains ${textLength} characters of text — rendering to image`,
          "AI / ONNX / QWEN / CHAT",
        );

        const blob = await AI_ONNX_QWEN_CHAT.renderPdfPageToImage(page);
        images.push(blob);
      } else {
        window.codbi.log(
          "INFO",
          `PDF page ${pageNum} has minimal text (${textLength} chars) — attempting image extraction`,
          "AI / ONNX / QWEN / CHAT",
        );

        const extractedImages = await AI_ONNX_QWEN_CHAT.extractImagesFromPdfPage(page);

        if (extractedImages.length > 0) {
          images.push(...extractedImages);
          window.codbi.log(
            "INFO",
            `Extracted ${extractedImages.length} image(s) from PDF page ${pageNum}`,
            "AI / ONNX / QWEN / CHAT",
          );
        } else {
          window.codbi.log(
            "INFO",
            `No extractable images found on page ${pageNum} — rendering page to image`,
            "AI / ONNX / QWEN / CHAT",
          );
          const blob = await AI_ONNX_QWEN_CHAT.renderPdfPageToImage(page);
          images.push(blob);
        }
      }
    }

    return images;
  }

  private static async renderPdfPageToImage(page: PDFPageProxy): Promise<Blob> {
    const viewport = page.getViewport({ scale: 2.0 });
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
            window.codbi.log("WARNING", `Failed to extract individual image: ${imgError}`, "AI / ONNX / QWEN / CHAT");
          }
        }
      }
    } catch (error) {
      window.codbi.log("WARNING", `Image extraction failed: ${error}`, "AI / ONNX / QWEN / CHAT");
    }

    return images;
  }

  // #endregion PDF.js helpers
}

window.codbi.registerFunctionality("AI.ONNX.QWEN.CHAT", AI_ONNX_QWEN_CHAT.functionality.bind(AI_ONNX_QWEN_CHAT));
