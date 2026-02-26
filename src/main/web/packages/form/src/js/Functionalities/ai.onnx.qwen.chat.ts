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
import { DEFINED } from "xdbc/src/DBC/DEFINED";
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
   * | *The class tagged with this functionality*        | `<textarea>`                           | Chat display (read-only conversation history)    |
   * | `AI_ONNX_QWEN_Chat_Input`     | `<input type="text">` or `<textarea>` | Text input where the user types messages         |
   * | `AI_ONNX_QWEN_Chat_Send`      | `<button>`                             | Send button (triggers inference)                 |
   * | `AI_ONNX_QWEN_Chat_Stop`      | `<button>`                             | Stop button (aborts running inference)           |
   * | `AI_ONNX_QWEN_Chat_UploadOptional)    | `<input type="file">`                  | File upload for images/PDFs to chat about        |
   *
   * **Generated CSS Classes (injected at runtime):**
   *
   * | CSS Class                       | Element     | Purpose                                                        |
   * |--------------------------------|-------------|----------------------------------------------------------------|
   * | `QWEN_Chat_Container`          | `<div>`     | Scrollable chat wrapper replacing the hidden `<textarea>`      |
   * | `QWEN_Chat_Row`                | `<div>`     | Flex row holding a single bubble                               |
   * | `QWEN_Chat_Row--user`          | `<div>`     | Row modifier: right-aligned (user message)                     |
   * | `QWEN_Chat_Row--qwen`          | `<div>`     | Row modifier: left-aligned (Qwen response)                     |
   * | `QWEN_Chat_Row--system`        | `<div>`     | Row modifier: centered (system/info messages)                  |
   * | `QWEN_Chat_Bubble`             | `<div>`     | Base speech-bubble styling (padding, border-radius, shadow)    |
   * | `QWEN_Chat_Bubble--user`       | `<div>`     | User bubble colors (background via `--user-bubble-bg`)         |
   * | `QWEN_Chat_Bubble--qwen`       | `<div>`     | Qwen bubble colors (background via `--qwen-bubble-bg`)        |
   * | `QWEN_Chat_Bubble--system`     | `<div>`     | System bubble: transparent, italic, muted                      |
   * | `QWEN_Chat_Bubble--thinking`   | `<div>`     | Temporary "thinking" indicator (dimmed, italic)                |
   * | `QWEN_Chat_Bubble--error`      | `<div>`     | Error bubble: red-tinted background                            |
   * | `QWEN_Chat_AiHint`            | `<span>`    | Small "AI-Generated" label inside a Qwen bubble               |
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
   * - **maxPages**:      Maximum PDF pages to process (default: 5).
   * - **Rotate**:        Image rotation in degrees (90, 180, or 270).
   * - **MaxPixelSize**:  Maximum total pixel budget (width×height). Images exceeding this
   *                      are downscaled client-side while preserving the aspect ratio.
   *                      Default: 3211264 (≈ 1792×1792). Set to 0 to disable client-side downscaling.
   * - **qwenbubble**:    Background color for Qwen (AI) bubbles (default: `#e5e5ea`).
   * - **userbubble**:    Background color for user bubbles (default: `#0b93f6`).
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. Must be a `<textarea>` element (the chat display). */
  @DBC.ParamvalueProvider
  public static functionality(
    @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "maxpages")
    @IF.PRE(new TYPE("string"), new REGEX(/^(90|180|270)$/), "rotate")
    @IF.PRE(new TYPE("number"), new OR([new EQ(90), new EQ(180), new EQ(270)]), "rotate")
    @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "maxPixelSize")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(HTMLTextAreaElement, undefined, "Must be a <textarea> element tagged with this functionality.")
    toProcess: Element,
  ): void {
    const $ = getJQuery();
    const chatDisplay = toProcess as HTMLTextAreaElement;
    chatDisplay.readOnly = true;
    chatDisplay.style.display = "none";
    const aiHintText = toLoad.aihint != null ? String(toLoad.aihint) : "\u2728 AI-Generated";

    // #region Create speech-bubble chat container
    AI_ONNX_QWEN_CHAT.ensureChatBubbleStyles();
    const chatContainer = document.createElement("div");
    chatContainer.className = "QWEN_Chat_Container";
    // Apply custom bubble colors from toLoad
    if (toLoad.qwenbubble != null) {
      chatContainer.style.setProperty("--qwen-bubble-bg", String(toLoad.qwenbubble));
    }
    if (toLoad.userbubble != null) {
      chatContainer.style.setProperty("--user-bubble-bg", String(toLoad.userbubble));
    }
    chatDisplay.parentElement?.insertBefore(chatContainer, chatDisplay.nextSibling);
    // #endregion Create speech-bubble chat container

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

    const chatInput = OR.tsCheck<HTMLInputElement | HTMLTextAreaElement>(
      DEFINED.tsCheck(container.querySelector(".AI_ONNX_QWEN_Chat_Input")),
      [new INSTANCE(HTMLInputElement), new INSTANCE(HTMLTextAreaElement)],
      'Did you forget to tag the chat input element with CSS-Class "AI_ONNX_QWEN_Chat_Input"?',
    );

    const sendButton = INSTANCE.tsCheck<HTMLButtonElement>(
      DEFINED.tsCheck(container.querySelector(".AI_ONNX_QWEN_Chat_Send")),
      HTMLButtonElement,
    );
    const stopButton = INSTANCE.tsCheck<HTMLButtonElement>(
      container.querySelector(".AI_ONNX_QWEN_Chat_Stop"),
      HTMLButtonElement,
    );
    const fileUpload = INSTANCE.tsCheck<HTMLInputElement>(
      container.querySelector(".AI_ONNX_QWEN_Chat_Upload"),
      HTMLInputElement,
    );

    // #endregion Discover sibling elements

    let isBusy = false;
    let attachedFiles: File[] = [];
    /** The "thinking" bubble element, replaced when the real response arrives. */
    let thinkingBubble: HTMLDivElement | null = null;
    /** The active stream session ID, used by the stop button to abort inference. */
    let activeStreamId: string | null = null;
    /** Multi-turn conversation history. Sent to the backend so Qwen can remember prior turns. */
    const conversationHistory: { role: string; content: string }[] = [];
    /**
     * Maximum number of recent history entries to keep verbatim (the rest are
     * condensed into a single summary entry so the context window is not exhausted).
     * Must be even to keep user/assistant pairs intact.
     */
    const MAX_VERBATIM_ENTRIES = 6;

    // #region Helper: compact conversation history
    /**
     * Returns a compacted copy of `conversationHistory`.
     * - If the history has at most {@link MAX_VERBATIM_ENTRIES} entries it is returned as-is.
     * - Otherwise the oldest turns are condensed into a single "system" entry
     *   (each turn truncated to ~120 chars) and the most recent turns are kept verbatim.
     */
    const compactHistory = (): { role: string; content: string }[] => {
      if (conversationHistory.length <= MAX_VERBATIM_ENTRIES) {
        return conversationHistory;
      }
      const cutoff = conversationHistory.length - MAX_VERBATIM_ENTRIES;
      const oldTurns = conversationHistory.slice(0, cutoff);
      const recentTurns = conversationHistory.slice(cutoff);

      // Build a condensed summary of the older turns
      const lines: string[] = [];
      for (let i = 0; i < oldTurns.length; i += 2) {
        const userMsg = oldTurns[i]?.content ?? "";
        const asstMsg = oldTurns[i + 1]?.content ?? "";
        const uShort = userMsg.length > 120 ? `${userMsg.substring(0, 117)}...` : userMsg;
        const aShort = asstMsg.length > 120 ? `${asstMsg.substring(0, 117)}...` : asstMsg;
        lines.push(`- User: ${uShort}  Assistant: ${aShort}`);
      }
      const summaryEntry: { role: string; content: string } = {
        role: "system",
        content: `Summary of earlier conversation:\n${lines.join("\n")}`,
      };
      return [summaryEntry, ...recentTurns];
    };
    // #endregion Helper: compact conversation history

    // #region Resource status overlay
    /** Timer ID for auto-hiding the resource overlay after transient messages (e.g. "Resumed"). */
    let overlayHideTimer: ReturnType<typeof setTimeout> | null = null;

    /** Lazily-created overlay badge anchored to the top-right corner of the chat textarea. */
    let resourceOverlay: HTMLDivElement | null = null;
    const getOverlay = (): HTMLDivElement => {
      if (resourceOverlay) {
        return resourceOverlay;
      }
      const el = document.createElement("div");
      el.style.cssText =
        "position:absolute;top:6px;right:6px;" +
        "display:none;align-items:center;justify-content:center;" +
        "background:rgba(0,0,0,0.72);color:#fff;font-size:12px;font-weight:600;" +
        "padding:6px 14px;text-align:center;pointer-events:none;z-index:1000;" +
        "border-radius:6px;backdrop-filter:blur(2px);transition:opacity 0.3s ease;" +
        "max-width:60%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
      // Anchor relative to the chat container
      const anchor = chatContainer.parentElement;
      if (anchor) {
        const cs = window.getComputedStyle(anchor);
        if (cs.position === "static") {
          (anchor as HTMLElement).style.position = "relative";
        }
        anchor.appendChild(el);
      }
      resourceOverlay = el;
      return el;
    };

    const showResourceOverlay = (message: string): void => {
      if (overlayHideTimer) {
        clearTimeout(overlayHideTimer);
        overlayHideTimer = null;
      }
      const overlay = getOverlay();
      overlay.textContent = message;
      overlay.style.display = "flex";
      overlay.style.opacity = "1";
    };

    const hideResourceOverlay = (): void => {
      if (!resourceOverlay) {
        return;
      }
      resourceOverlay.style.opacity = "0";
      overlayHideTimer = setTimeout(() => {
        if (resourceOverlay) {
          resourceOverlay.style.display = "none";
        }
        overlayHideTimer = null;
      }, 400);
    };

    /**
     * Handles `resourceStatus` from the poll response.
     * "Resumed" and timeout messages auto-hide after 2.5 seconds;
     * pause messages stay visible until superseded.
     */
    const handleResourceStatus = (status: string | undefined): void => {
      if (!status) {
        return;
      }
      showResourceOverlay(status);
      // Transient statuses auto-hide after a short delay
      if (status.includes("\u25B6") || status.includes("\u26A0")) {
        overlayHideTimer = setTimeout(hideResourceOverlay, 2500);
      }
    };
    // #endregion Resource status overlay

    // #region Helper: create a chat bubble
    /**
     * Creates a speech-bubble element and appends it to the chat container.
     * @param text    Message text.
     * @param role    `"user"` (right-aligned), `"qwen"` (left-aligned), or `"system"` (centered, muted).
     * @returns The created bubble `<div>` so callers can update it later (e.g. streaming).
     */
    const appendBubble = (text: string, role: "user" | "qwen" | "system"): HTMLDivElement => {
      const row = document.createElement("div");
      row.className = `QWEN_Chat_Row QWEN_Chat_Row--${role}`;

      const bubble = document.createElement("div");
      bubble.className = `QWEN_Chat_Bubble QWEN_Chat_Bubble--${role}`;
      bubble.textContent = text;
      row.appendChild(bubble);

      chatContainer.appendChild(row);
      chatContainer.scrollTop = chatContainer.scrollHeight;
      return bubble;
    };
    // #endregion Helper: create a chat bubble

    // #region Helper: append a message block to the chat display
    const appendToChat = (text: string): void => {
      // Detect role from prefix
      if (text.startsWith("You: ")) {
        appendBubble(text.substring(5), "user");
      } else if (text.startsWith("Qwen: ")) {
        appendBubble(text.substring(6), "qwen");
      } else {
        appendBubble(text, "system");
      }
    };
    // #endregion Helper: append a message block to the chat display

    // #region Helper: replace the "thinking" indicator with the real response
    const replaceThinking = (text: string): void => {
      if (thinkingBubble) {
        thinkingBubble.parentElement?.remove();
        thinkingBubble = null;
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
          // New files = new topic — clear old history so previous image
          // Q&A does not confuse the model about the current image.
          conversationHistory.length = 0;
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

      appendBubble(message, "user");
      chatInput.value = "";
      conversationHistory.push({ role: "user", content: message });

      isBusy = true;
      sendButton.disabled = true;
      if ("disabled" in chatInput) {
        (chatInput as HTMLInputElement).disabled = true;
      }

      // Show thinking indicator bubble (will be replaced with real response)
      thinkingBubble = appendBubble("⏳ Thinking...", "qwen");
      thinkingBubble.innerHTML = `<span class="QWEN_Hourglass">⏳</span> Thinking...`;
      thinkingBubble.classList.add("QWEN_Chat_Bubble--thinking");

      try {
        AI_ONNX_QWEN_CHAT.ensurePdfJsWorkerConfigured();

        const formData = new FormData();
        const maxPages = toLoad.maxpages ? Number(toLoad.maxpages) : 5;
        const maxPixelSize =
          toLoad.maxpixelsize != null ? Number(toLoad.maxpixelsize) : AI_ONNX_QWEN_CHAT.DEFAULT_MAX_PIXELS;

        // #region Process attached files (PDF or Image)
        for (const file of attachedFiles) {
          if (file.type === "application/pdf") {
            const processedImages = await AI_ONNX_QWEN_CHAT.processPdfFile(file, maxPages);
            for (let i = 0; i < processedImages.length; i++) {
              const imageName = `${file.name.replace(".pdf", "")}_page_${i + 1}.png`;
              let imageFile = new File([processedImages[i]], imageName, { type: "image/png" });
              // Downscale PDF page if it exceeds the pixel budget
              if (maxPixelSize > 0) {
                const downscaled = await AI_ONNX_QWEN_CHAT.downscaleImageIfNeeded(imageFile, maxPixelSize);
                imageFile =
                  downscaled instanceof File
                    ? downscaled
                    : new File([downscaled], imageName, { type: downscaled.type || "image/png" });
              }
              // Send as base64 text param — formcycle's multipart parser returns 0-byte FileData.
              const dataUrl = await AI_ONNX_QWEN_CHAT.blobToDataUrl(imageFile);
              formData.append(`codbi-base64:${imageName}`, dataUrl);
            }
          } else if (maxPixelSize > 0) {
            // Downscale if the image exceeds the pixel budget.
            const downscaled = await AI_ONNX_QWEN_CHAT.downscaleImageIfNeeded(file, maxPixelSize);
            const dataUrl = await AI_ONNX_QWEN_CHAT.blobToDataUrl(downscaled);
            window.codbi.log(
              "INFO",
              `Appending '${file.name}' as base64 param: ${Math.round(dataUrl.length / 1024)} KB`,
              "AI / ONNX / QWEN / CHAT",
            );
            formData.append(`codbi-base64:${file.name}`, dataUrl);
          } else {
            // maxPixelSize=0 → skip client-side downscaling; backend enforces the limit.
            const dataUrl = await AI_ONNX_QWEN_CHAT.blobToDataUrl(file);
            window.codbi.log(
              "INFO",
              `Appending '${file.name}' as base64 param (no client downscale): ${Math.round(dataUrl.length / 1024)} KB`,
              "AI / ONNX / QWEN / CHAT",
            );
            formData.append(`codbi-base64:${file.name}`, dataUrl);
          }
        }
        // Clear after processing — files are only sent once, not on every message
        attachedFiles = [];
        if (fileUpload) {
          fileUpload.value = "";
        }
        // #endregion Process attached files (PDF or Image)

        // #region Build request headers
        const headers: { [key: string]: string } = {};

        if (toLoad.rotate && toLoad.rotate !== "0" && toLoad.rotate !== 0) {
          headers["X-Rotate"] = toLoad.rotate.toString();
        }

        headers["X-Question-chat"] = message;
        headers["X-Stream"] = "true";
        headers["X-Chat-History"] = btoa(unescape(encodeURIComponent(JSON.stringify(compactHistory()))));
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
          hideResourceOverlay();
          chatInput.focus();
        };
        // #endregion Helper: finish streaming and re-enable UI

        // #region Helper: poll a streaming session until done
        const pollStream = (streamId: string): void => {
          let lastText = "";
          /** The bubble element used for streaming output; created on first text chunk. */
          let streamBubble: HTMLDivElement | null = null;
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
                // Handle resource status overlay (pause/resume/timeout notifications)
                handleResourceStatus(pollResponse.resourceStatus);
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
                  // First chunk: replace thinking bubble with a real one
                  if (thinkingBubble) {
                    thinkingBubble.parentElement?.remove();
                    thinkingBubble = null;
                    streamBubble = appendBubble(text, "qwen");
                  } else if (streamBubble) {
                    // Update existing stream bubble in-place
                    streamBubble.textContent = text;
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                  }
                }
                if (pollResponse.done) {
                  clearInterval(interval);
                  if (pollResponse.error) {
                    if (streamBubble) {
                      streamBubble.textContent = `! ${pollResponse.error}`;
                      streamBubble.classList.add("QWEN_Chat_Bubble--error");
                    } else {
                      replaceThinking(`Qwen: ! ${pollResponse.error}`);
                    }
                    conversationHistory.pop(); // remove failed user turn
                  } else if (lastText) {
                    conversationHistory.push({ role: "assistant", content: lastText });
                    if (aiHintText && streamBubble) {
                      AI_ONNX_QWEN_CHAT.attachAiHintToBubble(streamBubble, aiHintText);
                    }
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

            let answerText: string;
            if (fileKeys.length === 1) {
              const fileAnswers = response[fileKeys[0]];
              const answerKeys = Object.keys(fileAnswers || {});
              answerText =
                fileAnswers?.chat ?? (answerKeys.length > 0 ? String(fileAnswers[answerKeys[0]]) : "(no answer)");
              conversationHistory.push({ role: "assistant", content: answerText });
            } else {
              const parts: string[] = [];
              for (const fileKey of fileKeys) {
                const fileAnswers = response[fileKey];
                const answerKeys = Object.keys(fileAnswers || {});
                const answer =
                  fileAnswers?.chat ?? (answerKeys.length > 0 ? String(fileAnswers[answerKeys[0]]) : "(no answer)");
                parts.push(`📄 ${fileKey}:\n${answer}`);
              }
              answerText = parts.join("\n\n");
              conversationHistory.push({ role: "assistant", content: answerText });
            }
            // Replace thinking bubble with the answer
            if (thinkingBubble) {
              thinkingBubble.parentElement?.remove();
              thinkingBubble = null;
            }
            const answerBubble = appendBubble(answerText, "qwen");
            if (aiHintText) {
              AI_ONNX_QWEN_CHAT.attachAiHintToBubble(answerBubble, aiHintText);
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

    appendBubble("💬 Qwen Chat ready. Attach file(s) and type your question.", "system");

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

  // #region Chat bubble styles
  /** Injects global CSS for the speech-bubble chat UI (once). */
  private static ensureChatBubbleStyles(): void {
    if (document.querySelector("#QWEN_Chat_Bubble_Styles")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "QWEN_Chat_Bubble_Styles";
    style.textContent = `
      .QWEN_Chat_Container {
        --user-bubble-bg: #0b93f6 ;
        --qwen-bubble-bg: #e5e5ea ;
        display: flex ; flex-direction: column ; gap: 10px ; padding: 12px ;
        overflow-y: auto ; min-height: 120px ; max-height: 500px ;
        border: 1px solid #d0d0d0 ; border-radius: 8px ; background: #f5f5f5 ;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif ;
        font-size: 14px ; line-height: 1.45 ;
      }
      .QWEN_Chat_Row { display: flex ; }
      .QWEN_Chat_Row--user  { justify-content: flex-end ; }
      .QWEN_Chat_Row--qwen  { justify-content: flex-start ; }
      .QWEN_Chat_Row--system { justify-content: center ; }
      .QWEN_Chat_Bubble {
        max-width: 75% ; padding: 10px 14px ; border-radius: 16px ;
        word-wrap: break-word ; white-space: pre-wrap ; position: relative ;
        box-shadow: 0 0 .25em black ;
      }
      .QWEN_Chat_Bubble--user {
        background: var(--user-bubble-bg) ; color: #fff ;
        border-bottom-right-radius: 4px ;
      }
      .QWEN_Chat_Bubble--qwen {
        background: var(--qwen-bubble-bg) ; color: #1c1c1e ;
        border-bottom-left-radius: 4px ;
      }
      .QWEN_Chat_Bubble--system {
        background: transparent ; color: #8e8e93 ;
        font-size: 12px ; font-style: italic ; text-align: center ;
      }
      @keyframes QWEN_hourglass_spin {
        0%   { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .QWEN_Chat_Bubble--thinking {
        opacity: 0.7 ; font-style: italic ;
      }
      .QWEN_Chat_Bubble--thinking .QWEN_Hourglass {
        display: inline-block ;
        animation: QWEN_hourglass_spin 1.2s linear infinite ;
      }
      .QWEN_Chat_Bubble--error {
        background: #ffe0e0 ; color: #c00 ;
      }
      .QWEN_Chat_AiHint {
        display: block ; margin-top: 4px ; font-size: 10px ;
        color: rgba(0,0,0,0.35) ; text-align: right ; user-select: none ;
      }`;
    document.head.appendChild(style);
  }
  // #endregion Chat bubble styles

  // #region AI-Generated hint (bubble variant)
  /**
   * Appends a small AI-Generated hint label inside a chat bubble.
   *
   * @param bubble   The bubble `<div>` to annotate.
   * @param hintText The label to display, e.g. "✨ AI-Generated".
   */
  private static attachAiHintToBubble(bubble: HTMLDivElement, hintText: string): void {
    // Remove any existing hint inside this bubble
    const existing = bubble.querySelector(".QWEN_Chat_AiHint");
    if (existing) {
      existing.remove();
    }
    const hint = document.createElement("span");
    hint.className = "QWEN_Chat_AiHint";
    hint.textContent = hintText;
    bubble.appendChild(hint);
  }
  // #endregion AI-Generated hint (bubble variant)

  // #region Image downscaling helper
  /**
   * Default total-pixel budget (width × height). Matches the backend's default maxPixels.
   * ≈ 1792 × 1792.
   */
  private static readonly DEFAULT_MAX_PIXELS = 3211264;

  /**
   * Converts a canvas to a {@link File} built from raw bytes.
   * Formcycle's multipart parser returns 0 bytes for canvas {@link Blob} objects,
   * so we go through {@link HTMLCanvasElement.toDataURL toDataURL} → base64 decode → {@link ArrayBuffer} → {@link File}.
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
   * Reads a {@link Blob} (or {@link File}) as a
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs data URL}
   * string ({@code data:<mime>;base64,...}).
   *
   * Used to send image data as a regular text parameter in FormData,
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
        resolve(AI_ONNX_QWEN_CHAT.canvasToFile(canvas, file.name));
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

  private static async renderPdfPageToImage(page: PDFPageProxy): Promise<File> {
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

    return AI_ONNX_QWEN_CHAT.canvasToFile(canvas, "page.png");
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

                  images.push(AI_ONNX_QWEN_CHAT.canvasToFile(canvas, `${imageName}.png`));
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
