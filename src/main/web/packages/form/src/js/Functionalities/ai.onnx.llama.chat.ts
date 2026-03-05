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
 * Provides the {@link AI_ONNX_LLAMA_CHAT.functionality }.
 *
 * @remarks
 * Chat interface for the Qwen3-VL-2B model served via llama-server (Swan Architecture).
 * Connects to the {@code CodBi_AI_LLAMA_STD} plugin endpoint.
 *
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_ONNX_LLAMA_CHAT {
  /**
   * This functionality turns a set of HTML elements into a chat interface for the Qwen3-VL
   * vision-language model served by llama-server (Swan Architecture / LLAMA).
   * It enables interactive, multi-turn conversations about uploaded images and PDF documents.
   *
   * **Required Elements (found by CSS class within the nearest common ancestor):**
   *
   * | CSS Class                      | Element                                | Purpose                                          |
   * |-------------------------------|----------------------------------------|--------------------------------------------------|
   * | *The class tagged with this functionality*        | `<textarea>`                           | Chat display (read-only conversation history)    |
   * | `AI_ONNX_LLAMA_Chat_Input`    | `<input type="text">` or `<textarea>` | Text input where the user types messages         |
   * | `AI_ONNX_LLAMA_Chat_Send`     | `<button>`                             | Send button (triggers inference)                 |
   * | `AI_ONNX_LLAMA_Chat_Stop`     | `<button>`                             | Stop button (aborts running inference)           |
   * | `AI_ONNX_LLAMA_Chat_Upload` (Optional)   | `<input type="file">`                  | File upload for images/PDFs to chat about        |
   * | `AI_ONNX_LLAMA_Chat_Thinking` (Optional)  | `<input type="checkbox">`              | Toggles thinking mode (chain-of-thought) on/off  |
   * | `AI_ONNX_LLAMA_Chat_Internet` (Optional)    | `<input type="checkbox">`              | Toggles internet search availability on/off      |
   * | `AI_ONNX_LLAMA_Chat_Location` (Optional)    | `<input type="checkbox">`              | Toggles geolocation (get_current_location) on/off |
   *
   * **Generated CSS Classes (injected at runtime):**
   *
   * | CSS Class                       | Element     | Purpose                                                        |
   * |--------------------------------|-------------|----------------------------------------------------------------|
   * | `LLAMA_Chat_Container`         | `<div>`     | Scrollable chat wrapper replacing the hidden `<textarea>`      |
   * | `LLAMA_Chat_Row`               | `<div>`     | Flex row holding a single bubble                               |
   * | `LLAMA_Chat_Row--user`         | `<div>`     | Row modifier: right-aligned (user message)                     |
   * | `LLAMA_Chat_Row--llama`        | `<div>`     | Row modifier: left-aligned (Llama response)                    |
   * | `LLAMA_Chat_Row--system`       | `<div>`     | Row modifier: centered (system/info messages)                  |
   * | `LLAMA_Chat_Bubble`            | `<div>`     | Base speech-bubble styling (padding, border-radius, shadow)    |
   * | `LLAMA_Chat_Bubble--user`      | `<div>`     | User bubble colors (background via `--user-bubble-bg`)         |
   * | `LLAMA_Chat_Bubble--llama`     | `<div>`     | Llama bubble colors (background via `--llama-bubble-bg`)       |
   * | `LLAMA_Chat_Bubble--system`    | `<div>`     | System bubble: transparent, italic, muted                      |
   * | `LLAMA_Chat_Bubble--thinking`  | `<div>`     | Temporary "thinking" indicator (dimmed, italic)                |
   * | `LLAMA_Chat_Bubble--error`     | `<div>`     | Error bubble: red-tinted background                            |
   * | `LLAMA_Chat_AiHint`           | `<span>`    | Small "AI-Generated" label inside an AI bubble                 |
   *
   * **Behavior:**
   * - The display textarea is made read-only and shows the full conversation history.
   * - When files are selected via the upload input, they are attached for subsequent messages.
   * - When the user clicks Send (or presses Enter in the input), the message and any attached files
   *   are sent to the Qwen3-VL backend (via llama-server). The response is displayed in the chat.
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
   * - **llamabubble**:   Background color for Llama (AI) bubbles (default: `#e5e5ea`).
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
    AI_ONNX_LLAMA_CHAT.ensureChatBubbleStyles();
    const chatContainer = document.createElement("div");
    chatContainer.className = "LLAMA_Chat_Container";
    // Apply custom bubble colors from toLoad
    if (toLoad.llamabubble != null) {
      chatContainer.style.setProperty("--llama-bubble-bg", String(toLoad.llamabubble));
    }
    if (toLoad.userbubble != null) {
      chatContainer.style.setProperty("--user-bubble-bg", String(toLoad.userbubble));
    }
    if (toLoad.maxchatwindowheight != null) {
      chatContainer.style.maxHeight = `${String(toLoad.maxchatwindowheight)}px`;
    }
    chatDisplay.parentElement?.insertBefore(chatContainer, chatDisplay.nextSibling);
    // #endregion Create speech-bubble chat container

    // #region Discover sibling elements by walking up to the nearest common ancestor
    let container: Element | null = toProcess.parentElement;
    while (container && container !== document.body) {
      if (container.querySelector(".AI_ONNX_LLAMA_Chat_Input") && container.querySelector(".AI_ONNX_LLAMA_Chat_Send")) {
        break;
      }
      container = container.parentElement;
    }

    if (!container || container === document.body) {
      window.codbi.log(
        "ERROR",
        "Could not find a container with .AI_ONNX_LLAMA_Chat_Input and .AI_ONNX_LLAMA_Chat_Send elements. " +
          "Ensure these elements exist within a common ancestor of the chat display textarea.",
        "AI / LLAMA / CHAT",
      );
      return;
    }

    const chatInput = OR.tsCheck<HTMLInputElement | HTMLTextAreaElement>(
      DEFINED.tsCheck(container.querySelector(".AI_ONNX_LLAMA_Chat_Input")),
      [new INSTANCE(HTMLInputElement), new INSTANCE(HTMLTextAreaElement)],
      'Did you forget to tag the chat input element with CSS-Class "AI_ONNX_LLAMA_Chat_Input"?',
    );

    const sendButton = INSTANCE.tsCheck<HTMLButtonElement>(
      DEFINED.tsCheck(container.querySelector(".AI_ONNX_LLAMA_Chat_Send")),
      HTMLButtonElement,
    );
    const stopButton = INSTANCE.tsCheck<HTMLButtonElement>(
      container.querySelector(".AI_ONNX_LLAMA_Chat_Stop"),
      HTMLButtonElement,
    );
    const fileUpload = INSTANCE.tsCheck<HTMLInputElement>(
      container.querySelector(".AI_ONNX_LLAMA_Chat_Upload"),
      HTMLInputElement,
    );
    const thinkingCheckbox = INSTANCE.tsCheck<HTMLInputElement>(
      container.querySelector(".AI_ONNX_LLAMA_Chat_Thinking"),
      HTMLInputElement,
    );
    const searchCheckbox = INSTANCE.tsCheck<HTMLInputElement>(
      container.querySelector(".AI_ONNX_LLAMA_Chat_Internet"),
      HTMLInputElement,
    );
    const locationCheckbox = INSTANCE.tsCheck<HTMLInputElement>(
      container.querySelector(".AI_ONNX_LLAMA_Chat_Location"),
      HTMLInputElement,
    );

    // #endregion Discover sibling elements

    let isBusy = false;
    let attachedFiles: File[] = [];
    /** The "thinking" bubble element, replaced when the real response arrives. */
    let thinkingBubble: HTMLDivElement | null = null;
    /** The active stream session ID, used by the stop button to abort inference. */
    let activeStreamId: string | null = null;
    /** Unique session ID generated on page load — ensures each session gets its own llama-server slot. */
    const pageSessionId: string = crypto.randomUUID();
    /** Multi-turn conversation history. Sent to the backend so the model can remember prior turns. */
    const conversationHistory: { role: string; content: string }[] = [];

    /**
     * Strips markdown links, bare URLs, and truncates assistant text before
     * storing it in conversation history. This prevents the 2B model from
     * parrot-copying content from previous turns into unrelated answers.
     */
    const stripLinksForHistory = (text: string): string => {
      // [label](url) → label
      let cleaned = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      // bare URLs
      cleaned = cleaned.replace(/https?:\/\/[^\s)]+/g, "");
      // collapse multiple spaces / trim
      cleaned = cleaned.replace(/ {2,}/g, " ").trim();
      // Truncate to prevent the model from parroting long previous answers
      if (cleaned.length > 150) {
        cleaned = `${cleaned.substring(0, 147)}...`;
      }
      return cleaned;
    };

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

    // #region Helper: linkify URLs in plain text
    /**
     * HTML-escapes the given plain text, then converts:
     *   1. Markdown links `[label](url)` → clickable `<a>` with the label text
     *   2. Bare URLs (`https://…` / `http://…`) → clickable `<a>` showing the hostname
     *   3. Phone numbers → clickable `tel:` link in a badge
     *   4. Email addresses → clickable `mailto:` link in a badge
     *
     * Uses a placeholder strategy so that URLs inside already-created `<a>` tags
     * are never matched again by the bare-URL pass.
     *
     * All links open in a new tab with `rel="noopener noreferrer"`.
     *
     * @param text  Raw plain text (may contain URLs or Markdown links).
     * @returns     Safe HTML string with clickable links.
     */
    const linkifyUrls = (text: string): string => {
      const links: string[] = [];
      const placeholder = (idx: number): string => `\x00LINK${idx}\x00`;

      // 1. HTML-escape to prevent XSS
      const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

      // 2. Convert Markdown-style links [label](url) → placeholder
      const withMdPlaceholders = escaped.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi,
        (_match, label: string, url: string) => {
          const idx = links.length;
          links.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
          return placeholder(idx);
        },
      );

      // 3. Wrap remaining bare URLs → placeholder (can't accidentally match inside step 2)
      // biome-ignore lint/suspicious/noControlCharactersInRegex: <explanation>
      const withAllPlaceholders = withMdPlaceholders.replace(/https?:\/\/[^\s<>&"'\x00)\]]+/gi, (url) => {
        let label = url;
        try {
          const u = new URL(url);
          label = u.hostname.replace(/^www\./, "");
        } catch {
          /* keep full URL as label */
        }
        const idx = links.length;
        links.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
        return placeholder(idx);
      });

      // 4. Convert phone numbers → tel: link placeholder
      //    Matches patterns like +49 911 1234567, (0911) 123-4567, 0911/1234567, etc.
      //    Requires at least 7 digits (ignoring separators) to avoid false positives.
      const withPhonePlaceholders = withAllPlaceholders.replace(
        /(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.\/-]?){1,3}\d{3,8}/g,
        (match) => {
          const digitsOnly = match.replace(/\D/g, "");
          if (digitsOnly.length < 7 || digitsOnly.length > 15) {
            return match;
          }
          const idx = links.length;
          const telHref = `tel:${match.replace(/[^\d+]/g, "")}`;
          links.push(
            `<span class="LLAMA_Chat_PhoneBadge"><span class="LLAMA_Chat_BadgeIcon">📞</span><a href="${telHref}">${match}</a></span>`,
          );
          return placeholder(idx);
        },
      );

      // 5. Convert email addresses → mailto: link placeholder
      const withEmailPlaceholders = withPhonePlaceholders.replace(
        /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
        (match) => {
          const idx = links.length;
          links.push(
            `<span class="LLAMA_Chat_EmailBadge"><span class="LLAMA_Chat_BadgeIcon">✉</span><a href="mailto:${match}">${match}</a></span>`,
          );
          return placeholder(idx);
        },
      );

      // 6. Restore placeholders with actual <a> tags, wrapping URL badges
      const restored = withEmailPlaceholders.replace(
        // biome-ignore lint/suspicious/noControlCharactersInRegex: placeholder pattern uses \x00
        /\x00LINK(\d+)\x00/g,
        (_m, idx: string) => {
          const html = links[Number(idx)];
          // Phone and email badges are already fully wrapped — return as-is
          if (html.startsWith('<span class="LLAMA_Chat_Phone') || html.startsWith('<span class="LLAMA_Chat_Email')) {
            return html;
          }
          return `<span class="LLAMA_Chat_SourceBadge">${html}</span>`;
        },
      );

      return restored;
    };
    // #endregion Helper: linkify URLs in plain text

    // #region Helper: create a chat bubble
    /**
     * Creates a speech-bubble element and appends it to the chat container.
     * @param text    Message text.
     * @param role    `"user"` (right-aligned), `"llama"` (left-aligned), or `"system"` (centered, muted).
     * @returns The created bubble `<div>` so callers can update it later (e.g. streaming).
     */
    const appendBubble = (text: string, role: "user" | "llama" | "system"): HTMLDivElement => {
      const row = document.createElement("div");
      row.className = `LLAMA_Chat_Row LLAMA_Chat_Row--${role}`;

      const bubble = document.createElement("div");
      bubble.className = `LLAMA_Chat_Bubble LLAMA_Chat_Bubble--${role}`;
      bubble.innerHTML = linkifyUrls(text);
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
      } else if (text.startsWith("Qwen3: ")) {
        appendBubble(text.substring(7), "llama");
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
          appendToChat(`\u{1F4CE} ${attachedFiles.length} file(s) attached: ${names}`);
          window.codbi.log("INFO", `Chat files attached: ${names}`, "AI / LLAMA / CHAT");
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
      thinkingBubble = appendBubble("", "llama");
      thinkingBubble.innerHTML = `<div class="CodBiLoader_Spinner LLAMA_ThinkingSpinner"></div><span class="LLAMA_ThinkingLabel">Thinking...</span>`;
      thinkingBubble.classList.add("LLAMA_Chat_Bubble--thinking");

      try {
        AI_ONNX_LLAMA_CHAT.ensurePdfJsWorkerConfigured();

        const formData = new FormData();
        const maxPages = toLoad.maxpages ? Number(toLoad.maxpages) : 5;
        const maxPixelSize =
          toLoad.maxpixelsize != null ? Number(toLoad.maxpixelsize) : AI_ONNX_LLAMA_CHAT.DEFAULT_MAX_PIXELS;

        // #region Process attached files (PDF or Image)
        for (const file of attachedFiles) {
          if (file.type === "application/pdf") {
            const processedImages = await AI_ONNX_LLAMA_CHAT.processPdfFile(file, maxPages);
            for (let i = 0; i < processedImages.length; i++) {
              const imageName = `${file.name.replace(".pdf", "")}_page_${i + 1}.png`;
              let imageFile = new File([processedImages[i]], imageName, { type: "image/png" });
              // Downscale PDF page if it exceeds the pixel budget
              if (maxPixelSize > 0) {
                const downscaled = await AI_ONNX_LLAMA_CHAT.downscaleImageIfNeeded(imageFile, maxPixelSize);
                imageFile =
                  downscaled instanceof File
                    ? downscaled
                    : new File([downscaled], imageName, { type: downscaled.type || "image/png" });
              }
              // Send as base64 text param — formcycle's multipart parser returns 0-byte FileData.
              const dataUrl = await AI_ONNX_LLAMA_CHAT.blobToDataUrl(imageFile);
              formData.append(`codbi-base64:${imageName}`, dataUrl);
            }
          } else if (maxPixelSize > 0) {
            // Downscale if the image exceeds the pixel budget.
            const downscaled = await AI_ONNX_LLAMA_CHAT.downscaleImageIfNeeded(file, maxPixelSize);
            const dataUrl = await AI_ONNX_LLAMA_CHAT.blobToDataUrl(downscaled);
            window.codbi.log(
              "INFO",
              `Appending '${file.name}' as base64 param: ${Math.round(dataUrl.length / 1024)} KB`,
              "AI / LLAMA / CHAT",
            );
            formData.append(`codbi-base64:${file.name}`, dataUrl);
          } else {
            // maxPixelSize=0 → skip client-side downscaling; backend enforces the limit.
            const dataUrl = await AI_ONNX_LLAMA_CHAT.blobToDataUrl(file);
            window.codbi.log(
              "INFO",
              `Appending '${file.name}' as base64 param (no client downscale): ${Math.round(dataUrl.length / 1024)} KB`,
              "AI / LLAMA / CHAT",
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

        // HTTP headers are ASCII-only — Base64-encode to preserve Unicode (e.g. ü, ö, ä)
        headers["X-Question-chat"] = btoa(unescape(encodeURIComponent(message.replace(/[\r\n]+/g, " ").trim())));
        headers["X-Stream"] = "true";
        headers["X-Session-Id"] = pageSessionId;
        headers["X-Chat-History"] = btoa(unescape(encodeURIComponent(JSON.stringify(compactHistory()))));
        if (thinkingCheckbox) {
          headers["X-Thinking"] = thinkingCheckbox.checked ? "true" : "false";
        }
        if (searchCheckbox) {
          headers["X-Search"] = searchCheckbox.checked ? "true" : "false";
        }
        if (locationCheckbox?.checked) {
          headers["X-Location"] = "true";
          // Pre-fetch browser geolocation so the model already knows the user's position
          if (navigator.geolocation) {
            try {
              const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: false,
                  timeout: 5000,
                  maximumAge: 300000, // 5 min cache
                });
              });
              headers["X-Latitude"] = pos.coords.latitude.toFixed(4);
              headers["X-Longitude"] = pos.coords.longitude.toFixed(4);
              window.codbi.log(
                "INFO",
                `Geolocation: ${headers["X-Latitude"]}, ${headers["X-Longitude"]}`,
                "AI / LLAMA / CHAT",
              );
            } catch (geoErr) {
              window.codbi.log("WARNING", `Geolocation unavailable: ${geoErr}`, "AI / LLAMA / CHAT");
            }
          }
        }
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
          // ── i18n labels (updated from first poll response) ──
          let i18nReasoningLabel = "Reasoning\u2026";
          let i18nShowReasoningLabel = "Show reasoning";
          let i18nShowSourcesLabel = "Show sources";
          let i18nSearchingLabel = "Searching the internet for \u201C%s\u201D\u2026";
          let i18nSearchingLabelNoQuery = "Searching the internet\u2026";
          let i18nThinkingLabel = "Thinking\u2026";
          const interval = setInterval(() => {
            $.ajax({
              url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
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
                // Update i18n labels from server response
                if (pollResponse.i18n) {
                  if (pollResponse.i18n.reasoningLabel) {
                    i18nReasoningLabel = pollResponse.i18n.reasoningLabel;
                  }
                  if (pollResponse.i18n.showReasoningLabel) {
                    i18nShowReasoningLabel = pollResponse.i18n.showReasoningLabel;
                  }
                  if (pollResponse.i18n.showSourcesLabel) {
                    i18nShowSourcesLabel = pollResponse.i18n.showSourcesLabel;
                  }
                  if (pollResponse.i18n.searchingLabel) {
                    i18nSearchingLabel = pollResponse.i18n.searchingLabel;
                  }
                  if (pollResponse.i18n.searchingLabelNoQuery) {
                    i18nSearchingLabelNoQuery = pollResponse.i18n.searchingLabelNoQuery;
                  }
                  if (pollResponse.i18n.thinkingLabel) {
                    i18nThinkingLabel = pollResponse.i18n.thinkingLabel;
                    // Update the "Thinking..." bubble if it's still visible
                    const thinkingLabelEl = thinkingBubble?.querySelector(".LLAMA_ThinkingLabel");
                    if (thinkingLabelEl) {
                      thinkingLabelEl.textContent = i18nThinkingLabel;
                    }
                  }
                }
                if (pollResponse.error && pollResponse.done === undefined) {
                  // Session not found or expired
                  clearInterval(interval);
                  replaceThinking(`Qwen3: \u26A0 ${pollResponse.error}`);
                  finishStreaming();
                  return;
                }
                const text: string = pollResponse.text ?? "";

                // ── Client-side CALL:search detection — suppress display immediately ──
                // Detect early: as soon as "CALL:" appears (tokens stream one-by-one)
                // But only suppress if the request is still in progress — if done is true,
                // the server already processed the search and the text is the final answer.
                if (/CALL:/.test(text) && !pollResponse.done) {
                  const callMatch = text.match(/CALL:search\((?:\s*)query(?:\s*)=(?:\s*)['"]([^'"]*)['"]\s*\)/);
                  // Hide bubble immediately — even before full pattern matches
                  if (streamBubble) {
                    streamBubble.parentElement?.remove();
                    streamBubble = null;
                  }
                  if (thinkingBubble) {
                    thinkingBubble.parentElement?.remove();
                    thinkingBubble = null;
                  }
                  if (callMatch && !chatContainer.querySelector(".LLAMA_SearchIndicator")) {
                    // Full command detected — show search indicator with query
                    const searchQuery = callMatch[1];
                    const indicator = document.createElement("div");
                    indicator.className = "LLAMA_Chat_Row LLAMA_Chat_Row--llama";
                    indicator.innerHTML =
                      // biome-ignore lint/style/useTemplate: <explanation>
                      '<div class="LLAMA_Chat_Bubble LLAMA_Chat_Bubble--llama LLAMA_SearchIndicator">' +
                      '<div class="CodBiLoader_Spinner LLAMA_SearchSpinner"></div>' +
                      `<span class="LLAMA_SearchLabel">${i18nSearchingLabel.replace("%s", searchQuery)}</span>` +
                      "</div>";
                    chatContainer.appendChild(indicator);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                  }
                  lastText = "";
                  return;
                }

                // Server-side searching flag — show indicator if not already shown (fallback)
                if (pollResponse.searching && text.length === 0) {
                  if (!chatContainer.querySelector(".LLAMA_SearchIndicator")) {
                    if (streamBubble) {
                      streamBubble.parentElement?.remove();
                      streamBubble = null;
                    }
                    if (thinkingBubble) {
                      thinkingBubble.parentElement?.remove();
                      thinkingBubble = null;
                    }
                    const searchQuery: string = pollResponse.searchQuery ?? "";
                    const indicator = document.createElement("div");
                    indicator.className = "LLAMA_Chat_Row LLAMA_Chat_Row--llama";
                    indicator.innerHTML = `<div class="LLAMA_Chat_Bubble LLAMA_Chat_Bubble--llama LLAMA_SearchIndicator"><div class="CodBiLoader_Spinner LLAMA_SearchSpinner"></div><span class="LLAMA_SearchLabel">${searchQuery ? i18nSearchingLabel.replace("%s", searchQuery) : i18nSearchingLabelNoQuery}</span></div>`;
                    chatContainer.appendChild(indicator);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                  }
                  lastText = "";
                  return;
                }

                // When search completes or repetition trimming shortened the text,
                // the new text is shorter than what was displayed — update in-place
                // or replace the bubble so we don't leave a stale duplicate in the DOM.
                if (text.length > 0 && text.length < lastText.length) {
                  const indicator = chatContainer.querySelector(".LLAMA_SearchIndicator");
                  if (indicator?.parentElement) {
                    indicator.parentElement.remove();
                  }
                  lastText = "";
                  if (streamBubble) {
                    // Update existing bubble in-place (e.g. repetition trimmed)
                    streamBubble.innerHTML = linkifyUrls(text);
                  } else {
                    // No existing bubble (e.g. post-search) — create fresh
                    streamBubble = appendBubble(text, "llama");
                  }
                  return;
                }

                // ── Live reasoning: stream thinking chunks in real-time ──
                // While the model is reasoning (text empty, thinking arriving),
                // show reasoning live instead of the static "Thinking..." spinner.
                const liveThinking: string | undefined = pollResponse.thinking;
                if (liveThinking && text.length === 0 && !pollResponse.done && thinkingBubble) {
                  let reasoningEl = thinkingBubble.querySelector(
                    ".LLAMA_LiveReasoningContent",
                  ) as HTMLDivElement | null;
                  if (!reasoningEl) {
                    // First reasoning chunk — replace spinner with live reasoning view
                    thinkingBubble.classList.remove("LLAMA_Chat_Bubble--thinking");
                    thinkingBubble.innerHTML = `<details class="LLAMA_Chat_Thinking" open><summary style="display:flex;align-items:center;gap:6px"><div class="CodBiLoader_Spinner LLAMA_ThinkingSpinner"></div><span>${i18nReasoningLabel}</span></summary><div class="LLAMA_Chat_ThinkingContent LLAMA_LiveReasoningContent"></div></details>`;
                    reasoningEl = thinkingBubble.querySelector(".LLAMA_LiveReasoningContent") as HTMLDivElement;
                  }
                  if (reasoningEl) {
                    // Only auto-scroll if user is already near the bottom of the reasoning box
                    const isNearBottom =
                      reasoningEl.scrollHeight - reasoningEl.scrollTop - reasoningEl.clientHeight < 40;
                    reasoningEl.innerHTML = linkifyUrls(liveThinking);
                    if (isNearBottom) {
                      reasoningEl.scrollTop = reasoningEl.scrollHeight;
                      chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                  }
                  return;
                }

                if (text.length > lastText.length) {
                  lastText = text;
                  if (thinkingBubble) {
                    thinkingBubble.parentElement?.remove();
                    thinkingBubble = null;
                    streamBubble = appendBubble(text, "llama");
                  } else if (streamBubble) {
                    // Update existing stream bubble in-place
                    streamBubble.innerHTML = linkifyUrls(text);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                  } else {
                    // No existing bubble — post-search streaming: remove indicator, create bubble
                    const searchInd = chatContainer.querySelector(".LLAMA_SearchIndicator");
                    if (searchInd?.parentElement) {
                      searchInd.parentElement.remove();
                    }
                    streamBubble = appendBubble(text, "llama");
                  }
                }
                if (pollResponse.done) {
                  clearInterval(interval);
                  // Clean up search indicator if still present
                  const searchInd = chatContainer.querySelector(".LLAMA_SearchIndicator");
                  if (searchInd?.parentElement) {
                    searchInd.parentElement.remove();
                  }
                  if (pollResponse.error) {
                    if (streamBubble) {
                      streamBubble.textContent = `\u26A0 ${pollResponse.error}`;
                      streamBubble.classList.add("LLAMA_Chat_Bubble--error");
                    } else {
                      replaceThinking(`Qwen3: \u26A0 ${pollResponse.error}`);
                    }
                    conversationHistory.pop(); // remove failed user turn
                  } else if (lastText) {
                    const searchOn = searchCheckbox ? searchCheckbox.checked : true;
                    conversationHistory.push({
                      role: "assistant",
                      content: searchOn ? stripLinksForHistory(lastText) : lastText,
                    });
                    // Show thinking/reasoning in a collapsible section if available
                    const thinkingText: string | undefined = pollResponse.thinking;
                    if (thinkingText && streamBubble) {
                      const details = document.createElement("details");
                      details.className = "LLAMA_Chat_Thinking";
                      const summary = document.createElement("summary");
                      // Use "Show sources" when the content is primarily search results,
                      // "Show reasoning" when it contains actual model reasoning
                      const hasSearchSources = /\uD83D\uDD0D Searching the web/.test(thinkingText);
                      const hasRealReasoning = thinkingText.includes("---\n\n\uD83D\uDD0D") || !hasSearchSources;
                      summary.textContent = hasRealReasoning ? i18nShowReasoningLabel : i18nShowSourcesLabel;
                      details.appendChild(summary);
                      const pre = document.createElement("div");
                      pre.className = "LLAMA_Chat_ThinkingContent";
                      pre.innerHTML = linkifyUrls(thinkingText);
                      details.appendChild(pre);
                      streamBubble.appendChild(details);
                    }
                    if (aiHintText && streamBubble) {
                      AI_ONNX_LLAMA_CHAT.attachAiHintToBubble(streamBubble, aiHintText);
                    }
                    // Tag the bubble with a model type icon — only when the thinking
                    // checkbox is present (i.e. thinking mode is available in the UI)
                    const modelType: string | undefined = pollResponse.modelType;
                    if (thinkingCheckbox && modelType && streamBubble) {
                      const badge = document.createElement("span");
                      badge.className = "LLAMA_ModelBadge";
                      badge.textContent = modelType === "thinking" ? "\uD83D\uDCA1" : "\u26A1";
                      badge.title = modelType === "thinking" ? "Thinking model" : "Fast model";
                      streamBubble.insertBefore(badge, streamBubble.firstChild);
                    }
                  }
                  finishStreaming();
                }
              },
              error: () => {
                clearInterval(interval);
                replaceThinking("Qwen3: \u26A0 Stream polling failed.");
                finishStreaming();
              },
            });
          }, 250);
        };
        // #endregion Helper: poll a streaming session until done

        // #region Send AJAX request to backend (via llama-server)
        $.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
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
              replaceThinking(`Qwen3: \u26A0 ${response.error}`);
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
              window.codbi.log("INFO", `Stream started: ${response.streamId}`, "AI / LLAMA / CHAT");
              pollStream(response.streamId);
              return;
            }

            // Non-streaming fallback: { "filename": { "chat": "answer" }, ... }
            const fileKeys = Object.keys(response);

            if (fileKeys.length === 0) {
              replaceThinking("Qwen3: (no response received)");
              finishStreaming();
              return;
            }

            let answerText: string;
            if (fileKeys.length === 1) {
              const fileAnswers = response[fileKeys[0]];
              const answerKeys = Object.keys(fileAnswers || {});
              answerText =
                fileAnswers?.chat ?? (answerKeys.length > 0 ? String(fileAnswers[answerKeys[0]]) : "(no answer)");
              const searchOn1 = searchCheckbox ? searchCheckbox.checked : true;
              conversationHistory.push({
                role: "assistant",
                content: searchOn1 ? stripLinksForHistory(answerText) : answerText,
              });
            } else {
              const parts: string[] = [];
              for (const fileKey of fileKeys) {
                const fileAnswers = response[fileKey];
                const answerKeys = Object.keys(fileAnswers || {});
                const answer =
                  fileAnswers?.chat ?? (answerKeys.length > 0 ? String(fileAnswers[answerKeys[0]]) : "(no answer)");
                parts.push(`\u{1F4C4} ${fileKey}:\n${answer}`);
              }
              answerText = parts.join("\n\n");
              const searchOn2 = searchCheckbox ? searchCheckbox.checked : true;
              conversationHistory.push({
                role: "assistant",
                content: searchOn2 ? stripLinksForHistory(answerText) : answerText,
              });
            }
            // Replace thinking bubble with the answer
            if (thinkingBubble) {
              thinkingBubble.parentElement?.remove();
              thinkingBubble = null;
            }
            const answerBubble = appendBubble(answerText, "llama");
            if (aiHintText) {
              AI_ONNX_LLAMA_CHAT.attachAiHintToBubble(answerBubble, aiHintText);
            }
            finishStreaming();
          },
          error: (xhr, status, error) => {
            replaceThinking(`Qwen3: \u26A0 Request failed (${status}): ${error}`);
            window.codbi.log("ERROR", `Chat request failed: ${status} — ${error}`, "AI / LLAMA / CHAT");
            conversationHistory.pop(); // remove failed user turn
            finishStreaming();
          },
        });
        // #endregion Send AJAX request to Qwen3 backend (via llama-server)
      } catch (ex) {
        replaceThinking(`Qwen3: \u26A0 Error: ${ex}`);
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
        window.codbi.log("INFO", `Stop requested for stream: ${idToStop}`, "AI / LLAMA / CHAT");
        $.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
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

    // ── Health check: poll the backend until the model is ready ──────────────
    // Disable input and send button until the model is confirmed ready
    chatInput.disabled = true;
    sendButton.disabled = true;
    sendButton.disabled = true;

    const statusBubble = appendBubble("", "system");
    statusBubble.innerHTML = `<div class="CodBiLoader_Spinner LLAMA_ThinkingSpinner"></div><span class="LLAMA_HealthLabel">Loading AI model\u2026</span>`;
    statusBubble.classList.add("LLAMA_Chat_Bubble--thinking");

    const setHealthLabel = (text: string) => {
      const label = statusBubble.querySelector(".LLAMA_HealthLabel");
      if (label) {
        label.textContent = text;
      }
    };

    const showReady = (modelName?: string) => {
      statusBubble.classList.remove("LLAMA_Chat_Bubble--thinking");
      const name = modelName || "AI";
      statusBubble.innerHTML = `\u{1F4AC} ${name} Chat ready. Attach file(s) and type your question.`;
      chatInput.disabled = false;
      sendButton.disabled = false;
      chatInput.focus();
    };

    const showError = (msg: string) => {
      statusBubble.classList.remove("LLAMA_Chat_Bubble--thinking");
      statusBubble.innerHTML = `\u26A0 ${msg}`;
      statusBubble.classList.add("LLAMA_Chat_Bubble--error");
      // Keep input and send button disabled on error
    };

    const healthCheck = setInterval(() => {
      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
        type: "POST",
        dataType: "json",
        processData: false,
        contentType: false,
        cache: false,
        beforeSend: (xhr) => {
          xhr.setRequestHeader("X-Health-Check", "true");
        },
        success: (response) => {
          if (response.error) {
            const msg = String(response.error);
            if (/not ready|downloading|loading/i.test(msg)) {
              setHealthLabel(msg);
            } else {
              clearInterval(healthCheck);
              showError(msg);
            }
          } else {
            clearInterval(healthCheck);
            showReady(response.model);
          }
        },
        error: () => {
          setHealthLabel("Waiting for AI server\u2026");
        },
      });
    }, 3000);
    // Do an immediate check without waiting for the first interval
    setTimeout(() => {
      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
        type: "POST",
        dataType: "json",
        processData: false,
        contentType: false,
        cache: false,
        beforeSend: (xhr) => {
          xhr.setRequestHeader("X-Health-Check", "true");
        },
        success: (response) => {
          if (!response.error) {
            clearInterval(healthCheck);
            showReady(response.model);
          }
        },
      });
    }, 100);

    window.codbi.log("INFO", "Llama Chat functionality initialized", "AI / LLAMA / CHAT");
  }

  // #region PDF.js helpers (shared logic with ai.onnx.donut.qa.ts)

  private static pdfJsWorkerConfigured = false;

  private static ensurePdfJsWorkerConfigured(): void {
    if (AI_ONNX_LLAMA_CHAT.pdfJsWorkerConfigured) {
      return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.codbi.baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.worker.min.js`;

    AI_ONNX_LLAMA_CHAT.pdfJsWorkerConfigured = true;

    window.codbi.log(
      "INFO",
      `PDF.js worker configured: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`,
      "AI / LLAMA / CHAT",
    );
  }

  // #region Chat bubble styles
  /** Injects global CSS for the speech-bubble chat UI (once). */
  private static ensureChatBubbleStyles(): void {
    if (document.querySelector("#LLAMA_Chat_Bubble_Styles")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "LLAMA_Chat_Bubble_Styles";
    style.textContent = `
      .LLAMA_Chat_Container {
        --user-bubble-bg: #0b93f6 ;
        --llama-bubble-bg: #e5e5ea ;
        display: flex ; flex-direction: column ; gap: 10px ; padding: 12px ;
        overflow-y: auto ; min-height: 120px ; max-height: 500px ;
        border: 1px solid #d0d0d0 ; border-radius: 8px ; background: #f5f5f5 ;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif ;
        font-size: 14px ; line-height: 1.45 ;
      }
      .LLAMA_Chat_Row { display: flex ; }
      .LLAMA_Chat_Row--user  { justify-content: flex-end ; }
      .LLAMA_Chat_Row--llama { justify-content: flex-start ; }
      .LLAMA_Chat_Row--system { justify-content: center ; }
      .LLAMA_Chat_Bubble {
        max-width: 75% ; padding: 10px 14px ; border-radius: 16px ;
        word-wrap: break-word ; white-space: pre-wrap ; position: relative ;
        box-shadow: 0 0 .25em black ;
      }
      .LLAMA_Chat_Bubble--user {
        background: var(--user-bubble-bg) ; color: #fff ;
        border-bottom-right-radius: 4px ;
      }
      .LLAMA_Chat_Bubble--llama {
        background: var(--llama-bubble-bg) ; color: #1c1c1e ;
        border-bottom-left-radius: 4px ;
      }
      .LLAMA_ModelBadge {
        position: absolute ; top: -10px ; left: -6px ;
        font-size: 12px ; line-height: 1 ;
        width: 22px ; height: 22px ;
        display: flex ; align-items: center ; justify-content: center ;
        background: #fff ; border: 1px solid #ccc ; border-radius: 50% ;
        box-shadow: 0 1px 3px rgba(0,0,0,.2) ;
        cursor: default ; user-select: none ;
      }
      .LLAMA_Chat_Bubble--system {
        background: transparent ; color: #8e8e93 ;
        font-size: 12px ; font-style: italic ; text-align: center ;
      }
      .LLAMA_Chat_Bubble--thinking {
        opacity: 0.7 ; font-style: italic ;
        display: flex ; align-items: center ; gap: 8px ;
      }
      .LLAMA_ThinkingSpinner {
        width: 20px ; height: 20px ; flex-shrink: 0 ;
      }
      .LLAMA_ThinkingSpinner::before {
        display: none ;
      }
      .LLAMA_ThinkingLabel {
        line-height: 20px ;
      }
      .LLAMA_Chat_Bubble--error {
        background: #ffe0e0 ; color: #c00 ;
      }
      .LLAMA_SearchIndicator {
        display: flex ; align-items: center ; gap: 8px ;
        opacity: 0.85 ; font-style: italic ; font-size: 13px ;
        background: #f0f4ff ; border: 1px dashed #b0c4de ;
      }
      .LLAMA_SearchLabel { color: #3a6ea5 ; }
      .LLAMA_SearchSpinner {
        width: 20px ; height: 20px ; flex-shrink: 0 ;
      }
      .LLAMA_SearchSpinner::before {
        display: none ;
      }
      .LLAMA_Chat_Thinking {
        margin-top: 10px ; border-top: 1px solid rgba(0,0,0,0.1) ;
        padding-top: 6px ; font-size: 12px ;
      }
      .LLAMA_Chat_Thinking summary {
        cursor: pointer ; color: #666 ; font-style: italic ;
        user-select: none ; font-size: 11px ;
      }
      .LLAMA_Chat_Thinking summary:hover { color: #333 ; }
      .LLAMA_Chat_ThinkingContent {
        margin-top: 6px ; padding: 8px ; background: rgba(0,0,0,0.04) ;
        border-radius: 6px ; white-space: pre-wrap ; word-break: break-word ;
        color: #555 ; font-size: 12px ; line-height: 1.5 ;
        max-height: 300px ; overflow-y: auto ;
      }
      .LLAMA_Chat_AiHint {
        display: block ; margin-top: 4px ; font-size: 10px ;
        color: rgba(0,0,0,0.35) ; text-align: right ; user-select: none ;
      }
      .LLAMA_Chat_Bubble a {
        color: inherit ; text-decoration: underline ;
        word-break: break-all ;
      }
      .LLAMA_Chat_Bubble--user a {
        color: #fff ;
      }
      .LLAMA_Chat_Bubble--llama a {
        color: #0b6abf ;
      }
      .LLAMA_Chat_Bubble a:hover {
        text-decoration-thickness: 2px ;
      }
      .LLAMA_Chat_SourceBadge {
        display: inline-flex ; align-items: center ;
        padding: 2px 10px ; border-radius: 12px ;
        background: rgba(11,106,191,0.1) ; font-size: 12px ;
        transition: background 0.15s ;
      }
      .LLAMA_Chat_SourceBadge:hover {
        background: rgba(11,106,191,0.2) ;
      }
      .LLAMA_Chat_SourceBadge a {
        color: #0b6abf ; text-decoration: none ; word-break: normal ;
      }
      .LLAMA_Chat_SourceBadge a:hover {
        text-decoration: underline ;
      }
      .LLAMA_Chat_PhoneBadge,
      .LLAMA_Chat_EmailBadge {
        display: inline-flex ; align-items: center ; gap: 4px ;
        padding: 2px 10px ; border-radius: 12px ;
        font-size: 12px ; transition: background 0.15s ;
      }
      .LLAMA_Chat_PhoneBadge {
        background: rgba(40,167,69,0.12) ;
      }
      .LLAMA_Chat_PhoneBadge:hover {
        background: rgba(40,167,69,0.22) ;
      }
      .LLAMA_Chat_EmailBadge {
        background: rgba(220,130,0,0.12) ;
      }
      .LLAMA_Chat_EmailBadge:hover {
        background: rgba(220,130,0,0.22) ;
      }
      .LLAMA_Chat_PhoneBadge a {
        color: #28a745 ; text-decoration: none ; word-break: normal ;
      }
      .LLAMA_Chat_EmailBadge a {
        color: #c27800 ; text-decoration: none ; word-break: normal ;
      }
      .LLAMA_Chat_PhoneBadge a:hover,
      .LLAMA_Chat_EmailBadge a:hover {
        text-decoration: underline ;
      }
      .LLAMA_Chat_BadgeIcon {
        font-size: 13px ; line-height: 1 ;
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
    const existing = bubble.querySelector(".LLAMA_Chat_AiHint");
    if (existing) {
      existing.remove();
    }
    const hint = document.createElement("span");
    hint.className = "LLAMA_Chat_AiHint";
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
          `Downscaling ${file.name}: ${img.width}\u00d7${img.height} \u2192 ${newW}\u00d7${newH}`,
          "AI / LLAMA / CHAT",
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
        resolve(AI_ONNX_LLAMA_CHAT.canvasToFile(canvas, file.name));
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
      "AI / LLAMA / CHAT",
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
          `PDF page ${pageNum} contains ${textLength} characters of text \u2014 rendering to image`,
          "AI / LLAMA / CHAT",
        );

        const blob = await AI_ONNX_LLAMA_CHAT.renderPdfPageToImage(page);
        images.push(blob);
      } else {
        window.codbi.log(
          "INFO",
          `PDF page ${pageNum} has minimal text (${textLength} chars) \u2014 attempting image extraction`,
          "AI / LLAMA / CHAT",
        );

        const extractedImages = await AI_ONNX_LLAMA_CHAT.extractImagesFromPdfPage(page);

        if (extractedImages.length > 0) {
          images.push(...extractedImages);
          window.codbi.log(
            "INFO",
            `Extracted ${extractedImages.length} image(s) from PDF page ${pageNum}`,
            "AI / LLAMA / CHAT",
          );
        } else {
          window.codbi.log(
            "INFO",
            `No extractable images found on page ${pageNum} \u2014 rendering page to image`,
            "AI / LLAMA / CHAT",
          );
          const blob = await AI_ONNX_LLAMA_CHAT.renderPdfPageToImage(page);
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

    return AI_ONNX_LLAMA_CHAT.canvasToFile(canvas, "page.png");
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

                  images.push(AI_ONNX_LLAMA_CHAT.canvasToFile(canvas, `${imageName}.png`));
                }
              }
            }
          } catch (imgError) {
            window.codbi.log("WARNING", `Failed to extract individual image: ${imgError}`, "AI / LLAMA / CHAT");
          }
        }
      }
    } catch (error) {
      window.codbi.log("WARNING", `Image extraction failed: ${error}`, "AI / LLAMA / CHAT");
    }

    return images;
  }

  // #endregion PDF.js helpers
}

window.codbi.registerFunctionality("AI.ONNX.LLAMA.CHAT", AI_ONNX_LLAMA_CHAT.functionality.bind(AI_ONNX_LLAMA_CHAT));
