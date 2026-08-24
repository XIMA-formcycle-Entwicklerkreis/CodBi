// #region Imports
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { ProgressSpinner } from "primeng/progressspinner";
import { Select } from "primeng/select";
import { Textarea } from "primeng/textarea";
import { Callbacks, getJQuery, instance as getDesignerInstance } from "@de-xima/fc-form-designer";
import { getCurrentFormKey } from "./form-key";
import { AiAssistantLog } from "../ai-assistant-log/ai-assistant-log";
// pdf.js is loaded lazily by loadPdfJs() (on-demand script tag for the UMD pdf.min.js copy) so the
// heavy pdf.js code is NOT part of the initial cb-manager.js bundle — the assistant dialog then
// appears immediately on ALT+A.
import type { PDFPageProxy } from "pdfjs-dist";
import {
  applyDialogPosition,
  clampRenderedToViewport,
  enableDialogDrag,
  loadDialogPosition,
  readDialogPosition,
  saveDialogPosition,
  type DialogPosition,
} from "../dialog-position";
import { markdownToHtml } from "./markdown";
// #endregion Imports

// #region Interfaces
/** Minimal pdf.js API surface used by the assistant — the global `pdfjsLib` exposed by the UMD
 *  `pdf.min.js` build that is loaded lazily on demand (see loadPdfJs). */
interface PdfJsLib {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (args: { data: ArrayBuffer }) => { promise: Promise<PdfJsDocument> };
}

/** The pdf.js PDFDocument instance (minimal surface used by the assistant). */
interface PdfJsDocument {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
}

interface AiModel {
  id: string;
  label: string;
  /** ISO 4217 currency of the configured price (present when pricing is configured). */
  currency?: string;
  /** Price per 1,000,000 input tokens, when configured in the plugin properties. */
  pricePerMInput?: number;
  /** Price per 1,000,000 output tokens, when configured in the plugin properties. */
  pricePerMOutput?: number;
}

interface FormElement {
  technicalId: string;
  displayText?: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ text: string; value: string }>;
  actionPage?: string;
}

/** One clarifying question the AI asks the user (multiple-choice + optional free text). */
interface ClarificationQuestion {
  id: string;
  question: string;
  options?: string[];
  allowFreeText?: boolean;
  /** True when the user may pick MORE THAN ONE option (checkboxes); false = exactly one (radio). */
  multiSelect?: boolean;
}

/** One answered clarification round (used for the change log and the re-run conversation). */
interface ClarificationTurn {
  question: string;
  answer: string;
  attachmentName?: string;
}

/** Options that mark a phase-2 run as coming from the chat popup (chat about the form). */
interface ChatRunOptions {
  chatMode: boolean;
  chatHistory: Array<{ user: string; assistant: string }>;
}

/** One bubble in the Form Assistant Chat. `view` selects the per-bubble rendering — it defaults to
 *  Markdown, so AI answers are shown formatted; the user can switch a bubble to raw plain text. */
interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  /** Per-bubble view: "markdown" (default) renders the text, "plain" shows the raw text. */
  view?: "markdown" | "plain";
}
// #endregion Interfaces

/**
 * Angular component that implements the unified CodBi AI Assistant dialog.
 *
 * Registered as the `cb-ai-assistant` custom element by main.ts. Listens for the
 * `codbi:ai-assistant:open` custom event dispatched by AICodBiAssistantDialog.ts
 * (ALT+A hotkey) and shows a PrimeNG dialog that handles the two-phase AI workflow.
 *
 * Phase 1: classify the user's intent (form / workflow / both).
 * Phase 2: collect the required designer data and execute the AI action.
 */
@Component({
  selector: "cb-ai-assistant",
  standalone: true,
  imports: [FormsModule, Dialog, Select, Textarea, Button, ProgressSpinner, AiAssistantLog],
  templateUrl: "./ai-assistant.html",
  styleUrl: "./ai-assistant.scss",
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistant implements OnInit, OnDestroy {
  // #region State
  private readonly baseUrl = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  /** CodBi logo shown in the clarification popup header (same resource as the prompt manager). */
  readonly codbiLogoUrl =
    `${this.baseUrl}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg`;

  visible = false;
  models: AiModel[] = [];
  selectedModel: string | null = null;
  promptText = "";
  loading = false;
  spinnerText = "Thinking\u2026";
  resultText: string | null = null;
  errorText: string | null = null;
  /** Toast message (top-right of the whole window, stays until dismissed via X). */
  toastMessage: string | null = null;
  /** Severity of the current toast — controls the icon and accent color. */
  toastSeverity: "error" | "success" | "info" = "error";
  /** Whether the CodBi prompt database is reachable. When false, the assistant inputs are
   *  disabled (but still visible) because there are no DB prompts to send to the AI. */
  dbAvailable = true;
  /** Whether CodBi prompts (functionalities, element placeholders, standard configurations) are
   *  sent to the AI at all. Defaults to ON. When OFF, the AI only receives Formcycle widgets and
   *  workflow nodes, and no CodBi is applied in any pass. */
  useCodbi = true;
  /** When true, the AI asks ALL clarification questions at once in a single round instead of at
   *  most 3 per round. Defaults to OFF. */
  askAllQuestions = false;
  /** When true, the AI names generated form fields with the Bürgerservice technical IDs
   *  (BundID/BayernID auto-fill compatible) instead of freely-chosen names. Defaults to OFF. */
  useBuergerserviceNaming = false;
  /** When true, the AI may create ANY Formcycle widget / workflow node / trigger — including ones
   *  that are NOT installed on this system. When OFF (default), only the elements the user
   *  explicitly allowed (see the element picker dialog) are transmitted to the AI. */
  allowUninstalledElements = false;
  /** Whether the element-picker dialog is open. */
  elementSettingsVisible = false;
  /** True while the element catalog (widgets/nodes/triggers + availability) is being loaded. */
  elementsLoading = false;
  /** In-flight catalog load promise so concurrent callers share one request and can await it. */
  private elementsLoadPromise: Promise<void> | null = null;
  /** The known Formcycle widgets with their installed-status (from the backend). */
  widgetElements: Array<{ id: string; name: string; available: boolean }> = [];
  /** The known Formcycle workflow nodes with their installed-status (from the backend). */
  nodeElements: Array<{ id: string; name: string; available: boolean }> = [];
  /** The known Formcycle workflow triggers with their installed-status (from the backend). */
  triggerElements: Array<{ id: string; name: string; available: boolean }> = [];
  /** Widget identifiers the user allows the AI to use (persisted). Empty = nothing allowed. */
  private allowedWidgets = new Set<string>();
  /** Workflow-node identifiers the user allows the AI to use (persisted). */
  private allowedNodes = new Set<string>();
  /** Workflow-trigger identifiers the user allows the AI to use (persisted). */
  private allowedTriggers = new Set<string>();
  /** True once the user has configured the allowed-element sets (opened the picker / toggled the
   *  switch / changed a check). Until then the current "everything allowed" behaviour is kept — no
   *  allowed lists are sent to the backend. */
  private elementsConfigured = false;
  /** Estimated tokens used by the most recent inference (returned by the backend). */
  lastTokens = 0;
  /** Accumulated token total for the current session. */
  sessionTokens = 0;
  /** Estimated cost of the most recent inference (returned by the backend). */
  lastCost = 0;
  /** ISO 4217 currency code of the most recent run (e.g. "EUR"). Empty when no price is configured. */
  lastCurrency = "";
  /** Accumulated session cost per currency — models may be priced in different currencies. */
  sessionCostByCurrency = new Map<string, number>();
  attachedFile: File | null = null;
  // Multi-round clarification: the questions the AI asked and the answers the user gave. The
  // history is sent back to the backend on every phase-2 re-run so the AI can ask again or proceed.
  clarificationHistory: ClarificationTurn[] = [];
  /** Popup visibility for the AI's clarifying questions. */
  clarificationVisible = false;
  /** The clarification questions currently shown in the popup. */
  pendingClarification: ClarificationQuestion[] = [];
  /** Per-question selected options (multi-select — the user may pick several answers). */
  clarificationOption: Record<string, string[]> = {};
  /** Combined free-text/voice answer covering all questions (single textarea). */
  clarificationAnswerText = "";
  /** File attached to the current clarification answers (optional document). */
  clarificationFile: File | null = null;
  /** The phase-2 context needed to re-run after a clarification round (prompt/model/intent/images). */
  private phase2Context: {
    prompt: string;
    modelId: string;
    intent: "form" | "workflow" | "both";
    imageParams: Array<{ name: string; dataUrl: string }>;
    chatOptions?: ChatRunOptions;
  } | null = null;
  // The Web Speech API only works in a secure context (HTTPS); on plain HTTP the mic would show a
  // brief gauge and never transcribe, so the mic icon is only offered over HTTPS.
  readonly speechSupported =
    window.location.protocol === "https:" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  isSpeechRecording = false;
  /** Lazily-loaded pdf.js API (window.pdfjsLib, set by loading the UMD pdf.min.js copy), fetched
   *  only when a PDF file is attached, so the initial cb-manager.js bundle stays small and the
   *  assistant dialog opens instantly. */
  private pdfJs: Promise<PdfJsLib> | null = null;
  private speechRecognition: any = null;
  /** True while the model-list AJAX is in flight, so repeated opens (e.g. rapid ALT+A presses or
   *  the log-panel restore racing the Status check) never fire duplicate "Models" requests. */
  private modelsLoading = false;
  /** True once the user dismissed the dialog while a background Status/Models request was still in
   *  flight, so those callbacks must not re-open it (e.g. ALT+A open, then immediately close).
   *  Cleared on the next explicit open (or the dialog's visibleChange(true)). */
  private dialogDismissed = false;
  /** Timestamp of the last time the dialog was opened — a stray second open event within the first
   *  400ms (poll tick / host re-mount) must never toggle the freshly opened dialog closed (see
   *  openHandler). */
  private lastOpenedAt = 0;
  /** Performance timestamp of the most recent request to show the dialog (set in open()). Used by
   *  onDialogShow() to measure how long PrimeNG takes to actually render the dialog on reopen. */
  private lastShowRequestedAt = 0;
  /** True while the dialog is intentionally hidden (via CSS) but still mounted. We keep `visible`
   *  `true` so PrimeNG never tears the dialog down (which forces a full re-bootstrap / re-mount on
   *  every reopen) and hide/show is a pure CSS flip (user-preferred approach).
   *  Starts `true` (dialog closed on a fresh host) so the FIRST ALT+A opens directly instead of
   *  running the toggle's close() branch on a dialog that was never open. */
  private dialogHidden = true;
  private speechBaseText = "";
  private speechFinalText = "";
  /** The full `codbi-prop-standards` CSV that the AI set on its most recent run.
   *  `null` means the AI has never run yet this session (first-run mode). */
  private prevAiStandards: string | null = null;
  /** Whether the change-log side panel is unfolded to the right of the assistant content. */
  showLog = false;
  /** Width (px) of the unfolded change-log panel — adjustable via the draggable splitter. */
  logPanelWidth = 560;
  /** Whether the user is currently dragging the splitter between assistant content and change log. */
  logResizing = false;
  /** Current width (px) of the assistant dialog — widens to the right viewport edge when the
   *  change-log panel is unfolded and returns to the folded width when it is folded. */
  private dialogWidth = 620;
  /** Width (px) of the assistant dialog while the change-log panel is folded. The user can resize
   *  the dialog when it is not snapped; that width is remembered and restored when the log closes. */
  private foldedDialogWidth = 620;
  /** In-flight splitter-drag state (start mouse X + panel width at drag start). */
  private logResizeState: { startX: number; startWidth: number } | null = null;
  private static readonly LOG_PANEL_MIN_WIDTH = 320;
  private static readonly LOG_PANEL_MAIN_MIN_WIDTH = 430;
  /** Minimum width of each side (assistant content / change log) as a fraction of the dialog width. */
  private static readonly LOG_PANE_MIN_RATIO = 0.25;
  private readonly LOG_PANEL_WIDTH_KEY = "codbi-ai-log-panel-width";
  /** localStorage key remembering the open/closed state of the change-log panel. */
  private readonly LOG_PANEL_OPEN_KEY = "codbi-ai-log-panel-open";
  /** localStorage key remembering the CodBi on/off switch state. */
  private readonly USE_CODBI_KEY = "codbi-ai-use-codbi";
  /** localStorage key remembering the Bürgerservice field-naming switch state. */
  private readonly USE_BUERGERSERVICE_NAMING_KEY = "codbi-ai-use-buergerservice-naming";
  /** localStorage key remembering the "Nicht installierte Elemente erstellen" switch state. */
  private readonly ALLOW_UNINSTALLED_KEY = "codbi-ai-allow-uninstalled";
  /** localStorage key remembering the user's allowed-widget checks. */
  private readonly ALLOWED_WIDGETS_KEY = "codbi-ai-allowed-widgets";
  /** localStorage key remembering the user's allowed-workflow-node checks. */
  private readonly ALLOWED_NODES_KEY = "codbi-ai-allowed-nodes";
  /** localStorage key remembering the user's allowed-workflow-trigger checks. */
  private readonly ALLOWED_TRIGGERS_KEY = "codbi-ai-allowed-triggers";
  /** localStorage key remembering whether the allowed-element sets have been configured. */
  private readonly ELEMENTS_CONFIGURED_KEY = "codbi-ai-elements-configured";
  /** Whether the current user is allowed to sync the API-Documentation (Prompt Manager visibility). */
  syncAllowed = false;
  /** Cookie name for persisting the selected AI model across page reloads. */
  private readonly MODEL_COOKIE = "codbi-ai-selected-model";
  /** A log entry that used sensitive elements is auto-opened only if it is at most this old. */
  private static readonly AUTO_OPEN_WINDOW_MINUTES = 10;
  /** localStorage key written before a reload when the run generated blocked destructive SQL. */
  private static readonly BLOCKED_SQL_STORAGE_KEY = "codbi-log-blocked-sql";
  /** localStorage key holding the newest log entry that was already auto-surfaced, so a closed log
   *  is not popped open again on every reload (a NEW entry re-triggers it). */
  private static readonly SURFACED_ENTRY_KEY = "codbi-log-surfaced-entry";
  // #endregion State

  /** Reference to the embedded change-log panel (unfolds to the right of the assistant content). */
  @ViewChild("logPanel") logPanel?: AiAssistantLog;

  private readonly openHandler = (): void => {
    // ALT+A toggles the assistant: close it when it is already open, otherwise open it. Only
    // treat it as "open" once the dialog is actually rendered in the DOM (not just visible in
    // state) — the opening poll in AICodBiAssistantDialog.ts re-dispatches codbi:ai-assistant:open
    // until the dialog element appears, and a second dispatch while this.visible is already true
    // (but the DOM is not rendered yet) must not close the freshly opened dialog. A stray second
    // event shortly after opening (a poll tick or a host re-mount) must also never close it — only a
    // deliberate ALT+A press once the dialog has been open for a moment toggles it closed.
    if (!this.dialogHidden) {
      this.close();
    } else {
      this.open();
      this.focusPrompt();
    }
  };

  /** ALT+A+S hotkey (speech): open the assistant and start voice input when speech is available. */
  private readonly speechHandler = (): void => {
    this.open();
    this.focusPrompt();
    this.startSpeechWhenReady();
  };

  /** Persists the chat conversation and the dialogs' maximized state on ANY page unload, so they
   *  survive a reload that is not routed through the explicit persistPendingChat() calls in the
   *  reload paths (e.g. Formcycle's own publish-reload). Without this, maximizing the dialog and
   *  then reloading the form would reopen the dialog at its pre-maximize size. */
  private readonly beforeUnloadHandler = (): void => {
    this.persistPendingChat();
    this.persistChatSession();
    this.persistMaximized();
    this.persistChatMaximized();
  };

  /** Focuses the prompt textarea once the dialog is visible (dialog opening is async). */
  private focusPrompt(): void {
    const tryFocus = (attempt: number): void => {
      if (!this.visible) return;
      const el = document.querySelector<HTMLElement>(".cb-ai-prompt");
      if (el) {
        el.focus();
        return;
      }
      if (attempt < 20) setTimeout(() => tryFocus(attempt + 1), 100);
    };
    setTimeout(() => tryFocus(0), 200);
  }

  /** Focuses the clarification answer textarea once the "The AI needs some information" popup is
   *  visible (dialog opening is async — retry briefly until it has rendered). */
  private focusClarificationInput(): void {
    const tryFocus = (attempt: number): void => {
      if (!this.clarificationVisible) return;
      const el = document.querySelector<HTMLElement>(".cb-ai-clarification-text");
      if (el) {
        el.focus();
        return;
      }
      if (attempt < 20) setTimeout(() => tryFocus(attempt + 1), 100);
    };
    setTimeout(() => tryFocus(0), 200);
  }

  /** Starts speech recognition once the assistant is visible; no-op when speech is unsupported or already recording. */
  private startSpeechWhenReady(): void {
    if (!this.speechSupported) return;
    const tryStart = (attempt: number): void => {
      if (this.visible) {
        if (!this.isSpeechRecording) this.toggleSpeech();
        return;
      }
      if (attempt < 30) setTimeout(() => tryStart(attempt + 1), 100);
    };
    setTimeout(() => tryStart(0), 200);
  }

  /** Remembered dialog position, persisted across reloads so the browser keeps the location. */
  private dialogPosition: DialogPosition | null = loadDialogPosition("codbi-dialog-assistant-position");
  /** localStorage key remembering whether the assistant dialog was maximized (persisted so a dialog
   *  closed while maximized reopens maximized). */
  private static readonly MAXIMIZED_KEY = "codbi-ai-assistant-maximized";
  private static readonly DIALOG_STYLE_CLASS = "cb-ai-assistant-dialog";
  /** sessionStorage key caching the loaded AI model list so a re-bootstrapped host (the Angular
   *  custom element is re-created on reopen) does not have to re-fetch it with a 2-3s AJAX call. */
  private static readonly MODELS_CACHE_KEY = "codbi-models-cache";
  /** Cleanup for the custom header-drag handlers (re-enabled on every dialog show). */
  private dragCleanup: (() => void) | null = null;
  /** Remembered clarification popup position, persisted across reloads. */
  private clarificationPosition: DialogPosition | null = loadDialogPosition("codbi-dialog-clarification-position");
  private static readonly CLARIFICATION_DIALOG_STYLE_CLASS = "cb-ai-clarification-dialog";
  /** Cleanup for the clarification popup's custom drag handlers (registered on each open). */
  private clarificationDragCleanup: (() => void) | null = null;
  // #region Form chat popup
  /** Popup visibility for the AI chat (answer + continued conversation about the form). */
  chatVisible = false;
  /** The conversation shown in the chat popup (user + assistant messages). */
  chatMessages: Array<ChatMessage> = [];
  /** Cache of rendered Markdown (keyed by message text) so unchanged bubbles are not re-parsed on
   *  every change-detection cycle. */
  private readonly markdownCache = new Map<string, string>();
  /** Current chat input text. */
  chatInput = "";
  /** Position in the sent-prompt history while browsing it with Arrow Up/Down. -1 = not browsing
   *  (the input shows the current draft). */
  private chatHistoryIndex = -1;
  /** Text that was in the input when history browsing started; restored once the user arrows past
   *  the newest prompt. */
  private chatDraft = "";
  /** Index of the chat message whose copy button currently shows the "copied" state (-1 = none). */
  copiedChatIndex = -1;
  /** True while the "copy ALL questions" button in the clarification dialog shows the copied check. */
  clarificationCopiedAll = false;
  /** Id of the clarification question whose copy button currently shows the copied check. */
  clarificationCopiedQuestionId: string | null = null;
  /** True while a chat turn is being processed. */
  chatLoading = false;
  /** Remembered chat popup position, persisted across reloads. */
  private chatPosition: DialogPosition | null = loadDialogPosition("codbi-dialog-chat-position");
  /** Cleanup for the chat popup's custom drag handlers (registered on each open). */
  private chatDragCleanup: (() => void) | null = null;
  private static readonly CHAT_DIALOG_STYLE_CLASS = "cb-ai-chat-dialog";
  /** localStorage key remembering whether the chat popup was maximized. */
  private static readonly CHAT_MAXIMIZED_KEY = "codbi-ai-chat-maximized";
  /** localStorage key used to re-open the chat popup after a workflow-triggered reload. */
  private static readonly PENDING_CHAT_KEY = "codbi-pending-chat";
  /** sessionStorage key persisting the current chat conversation within the tab session — survives
   *  closing/reopening the chat and host re-creation, and is cleared automatically when the tab
   *  closes (no DB storage). */
  private static readonly CHAT_SESSION_KEY = "codbi-chat-session";
  // #endregion Form chat popup

  constructor(private readonly cdr: ChangeDetectorRef) {}

  /** Opens the Prompt Manager dialog (only available to users allowed to sync). */
  openPromptManager(): void {
    if (!this.syncAllowed) return;
    if (!document.querySelector("cb-prompt-manager")) {
      document.body.appendChild(document.createElement("cb-prompt-manager"));
    }
    // Small delay to ensure the custom element is ready in the DOM
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("codbi:prompt-manager:open"));
    }, 50);
  }

  /**
   * Queries the Local API-Doc servlet to determine whether the current user may sync the
   * API-Documentation. The Prompt Manager button is only shown for sync-allowed users.
   */
  private checkSyncAllowed(): void {
    getJQuery().ajax({
      url: `${this.baseUrl}plugin?name=CodBi_LocalAPIDoc`,
      type: "GET",
      headers: { "X-Action": "Sync Allowed" },
      success: (response: { message?: string } | null) => {
        this.syncAllowed = response?.message !== "FALSE";
        this.cdr.markForCheck();
      },
      error: () => {
        this.syncAllowed = false;
        this.cdr.markForCheck();
      },
    });
  }

  /**
   * Unfolds the change-log side panel to the right of the assistant content and opens it.
   * [elements] are names of sensitive CodBi elements that should be highlighted. Used both by the
   * manual "Change log" toggle and by the automatic popup when the last inference used sensitive
   * elements that are not marked as checked yet.
   */
  openLog(elements: string[] = []): void {
    // Explicit request to show the log/dialog — an earlier dismissal must not block this open.
    this.dialogDismissed = false;
    // The change-log panel unfolds inside the assistant dialog, so make sure the dialog is visible
    // and the model list is populated (e.g. right after a workflow-triggered page reload).
    if (this.models.length === 0) {
      this.loadModelsAndOpen();
    } else {
      this.open(); //this.visible = true;
    }
    this.cdr.markForCheck();
    this.expandAndUnfoldLog(elements);
  }

  /** Starts resizing the change-log panel via the draggable splitter. */
  startLogResize(event: MouseEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    this.logResizeState = { startX: event.clientX, startWidth: this.logPanelWidth };
    this.logResizing = true;
    this.cdr.markForCheck();
    document.addEventListener("mousemove", this.onLogResizeMove);
    document.addEventListener("mouseup", this.endLogResize);
    document.body.style.userSelect = "none";
  }

  /** Moves the splitter. The change-log panel is anchored to the right edge of the dialog, so
   *  dragging the splitter right makes it NARROWER (its left edge follows the mouse). Clamped to
   *  keep the assistant content at a usable minimum width. */
  private readonly onLogResizeMove = (event: MouseEvent): void => {
    const state = this.logResizeState;
    if (!state) return;
    const next = state.startWidth - (event.clientX - state.startX);
    // Clamp so BOTH sides stay at least 25% of the ACTUAL dialog width.
    this.logPanelWidth = this.clampLogPanelWidth(next);
    // Keep the watermark centered over the left (assistant) content as the splitter moves.
    this.applyWatermarkPosition();
    this.cdr.markForCheck();
  };

  /** Ends the splitter drag and persists the chosen panel width. */
  private readonly endLogResize = (): void => {
    this.logResizeState = null;
    this.logResizing = false;
    document.removeEventListener("mousemove", this.onLogResizeMove);
    document.removeEventListener("mouseup", this.endLogResize);
    document.body.style.userSelect = "";
    try {
      localStorage.setItem(this.LOG_PANEL_WIDTH_KEY, String(this.logPanelWidth));
    } catch {
      // ignore storage errors
    }
    this.cdr.markForCheck();
  };

  /** Restores the previously chosen change-log panel width (if any). */
  private loadLogPanelWidth(): void {
    try {
      const raw = localStorage.getItem(this.LOG_PANEL_WIDTH_KEY);
      if (raw) {
        const w = Number(raw);
        if (Number.isFinite(w) && w >= AiAssistant.LOG_PANEL_MIN_WIDTH) {
          this.logPanelWidth = w;
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  /** The dialog's ACTUAL rendered width (measured from the DOM). Falls back to the stored width when
   *  the dialog is not rendered/measurable yet (e.g. before its first layout). This is used instead
   *  of `this.dialogWidth` because that field can be stale — it is set to the full viewport width
   *  when the change log widens the dialog, but stays there after the user undocks/drags the dialog
   *  to a much smaller floating width, so the 25% guard would be computed against the wrong width. */
  private actualDialogWidth(): number {
    const el = document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`) as HTMLElement | null;
    const w = el ? Math.round(el.getBoundingClientRect().width) : 0;
    return w > 0 ? w : this.dialogWidth;
  }

  /** Clamps the change-log panel width so that BOTH sides of the dialog (assistant content + change
   *  log) always stay at least 25% of the ACTUAL dialog width. No absolute pixel floor — a hard
   *  minimum would break the 25% rule on small dialogs (it would force a wide log panel into a
   *  narrow dialog and squeeze the main content to nothing). [refWidth] overrides the measured width
   *  (e.g. the viewport, when the dialog is about to be widened). */
  private clampLogPanelWidth(width: number, refWidth?: number): number {
    const actual = this.actualDialogWidth();
    const w = refWidth ?? actual;
    const min = Math.round(w * AiAssistant.LOG_PANE_MIN_RATIO);
    const max = Math.max(min, Math.round(w * (1 - AiAssistant.LOG_PANE_MIN_RATIO) - 8));
    const result = Math.round(Math.min(Math.max(width, min), max));
    return result;
  }

  /** Persists the open/closed state of the change-log panel across reloads. */
  private setLogOpenState(open: boolean): void {
    try {
      localStorage.setItem(this.LOG_PANEL_OPEN_KEY, open ? "open" : "closed");
    } catch {
      // ignore storage errors
    }
  }

  /** Re-opens the change-log panel when the user left it open the last time. */
  private restoreLogOpenState(): void {
    const stored = localStorage.getItem(this.LOG_PANEL_OPEN_KEY);
    try {
      if (stored === "open") {
        this.openLog();
      }
    } catch {
      // ignore storage errors
    }
  }

  /** Folds / unfolds the change-log side panel (the footer "Change log" toggle). */
  toggleLog(): void {
    if (this.showLog) {
      this.showLog = false;
      this.logPanel?.clearHighlights();
      this.restoreDialogSize();
      this.setLogOpenState(false);
    } else {
      this.openLog();
      this.setLogOpenState(true);
    }
    this.cdr.markForCheck();
    // The dialog width changed — re-evaluate the footer wrap state.
    setTimeout(() => this.updateFooterLayout(), 0);
  }

  /** The embedded change-log panel auto-opened (e.g. from the `codbi:ai-assistant-log:open`
   *  event) — make sure the assistant dialog is visible, widened to the right edge and the panel is
   *  unfolded. The log data is already loaded by the opening component, so it is NOT re-opened. */
  onLogOpened(): void {
    this.open(); //this.visible = true;
    this.cdr.markForCheck();
    const show = (attempt: number): void => {
      if (this.expandDialogForLog()) {
        this.showLog = true;
        this.cdr.markForCheck();
      } else if (attempt < 30) {
        setTimeout(() => show(attempt + 1), 100);
      }
    };
    setTimeout(() => show(0), 100);
    // The dialog widened — re-evaluate the footer wrap state once the layout settles.
    setTimeout(() => this.updateFooterLayout(), 250);
  }

  /** The user folded the change-log panel via its close button. */
  onLogClosed(): void {
    this.showLog = false;
    this.logPanel?.clearHighlights();
    this.restoreDialogSize();
    this.setLogOpenState(false);
    this.cdr.markForCheck();
    // The dialog narrowed — re-evaluate whether the footer switches/buttons wrapped.
    setTimeout(() => this.updateFooterLayout(), 0);
  }

  /** Keeps the dialog footer layout in sync: when the switch group and the button group wrap onto
   *  separate lines (the dialog is too narrow), they are centered; otherwise they stay left/right
   *  aligned on one row. */
  private updateFooterLayout(): void {
    const footer = document.querySelector<HTMLElement>(".cb-ai-assistant-dialog .p-dialog-footer");
    if (!footer) return;
    const codbi = footer.querySelector<HTMLElement>(".cb-ai-footer-codbi");
    const actions = footer.querySelector<HTMLElement>(".cb-ai-footer-actions");
    const wrapped = !!codbi && !!actions && actions.offsetTop > codbi.offsetTop;
    footer.classList.toggle("cb-ai-footer-wrapped", wrapped);
  }

  /** On a viewport resize (change-log open), re-measures the ACTUAL rendered dialog width — the
   *  stored `dialogWidth` can be stale after the window shrank or after the dialog was undocked —
   *  and re-clamps the change-log panel so both sides stay at least 25% of the dialog width. Runs
   *  deferred so the viewport guard (which caps the dialog width on resize) has already applied. */
  private updatePanelWidthsForViewport(): void {
    if (!this.showLog) return;
    setTimeout(() => {
      const el = document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`) as HTMLElement | null;
      if (!el) {
        return;
      }
      const actualWidth = Math.round(el.getBoundingClientRect().width);
      if (actualWidth > 0) {
        this.dialogWidth = actualWidth;
      }
      this.logPanelWidth = this.clampLogPanelWidth(this.logPanelWidth);
      this.applyWatermarkPosition();
      this.cdr.markForCheck();
    }, 0);
  }

  private readonly onWindowResize = (): void => {
    this.updatePanelWidthsForViewport();
    this.updateFooterLayout();
  };

  /**
   * Widens the assistant dialog so its right edge reaches the right edge of the viewport, then
   * unfolds the change-log panel. The panel only unfolds once the dialog is already wide, so the
   * regular assistant content is never squeezed while the panel slides in. [elements] are the
   * sensitive CodBi elements to highlight in the log.
   */
  private expandAndUnfoldLog(elements: string[]): void {
    const expandAndShow = (attempt: number): void => {
      if (this.expandDialogForLog()) {
        // Never let the panel width leave either side below 25% of the actual dialog width.
        this.logPanelWidth = this.clampLogPanelWidth(this.logPanelWidth);
        this.showLog = true;
        this.cdr.markForCheck();
        // The embedded change-log component is created together with the dialog content; retry for
        // a few seconds until it is ready before asking it to open (with any sensitive highlights).
        const tryOpen = (openAttempt: number): void => {
          if (this.logPanel) {
            this.logPanel.open(elements);
          } else if (openAttempt < 20) {
            setTimeout(() => tryOpen(openAttempt + 1), 150);
          }
        };
        tryOpen(0);
      } else if (attempt < 30) {
        // The dialog is not rendered yet (model list may still be loading) — retry, but keep the
        // retry window short so this never floods the main thread while the dialog is rendering.
        setTimeout(() => expandAndShow(attempt + 1), 150);
      }
    };
    // Give the dialog a moment to render (and its open animation to settle) before measuring, so the
    // left edge — and therefore the expanded width — is computed from the settled position.
    setTimeout(() => expandAndShow(0), 400);
  }

  /**
   * Widens the assistant dialog so its right edge reaches the right edge of the viewport. The left
   * edge is pinned to its current position (the dialog grows to the right instead of re-centering),
   * which gives the unfolded change-log panel the maximum available space. Returns true when the
   * dialog element was measured and widened.
   */
  private expandDialogForLog(): boolean {
    const el = document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`) as HTMLElement | null;
    if (!el) {
      return false;
    }
    // Only measure/widen a dialog that is actually visible. When the assistant auto-opens right
    // after a code-triggered form reload, it can be asked to unfold the change log before the
    // model list has loaded and the dialog is still hidden (display:none). getBoundingClientRect on
    // a hidden dialog returns all zeros, which would pin the dialog full-viewport at (0,0) and
    // render the change-log panel before it is ready — leaving an empty right side. Return false so
    // the caller retries once the dialog is really on screen.
    const mask = el.closest(".p-dialog-mask") as HTMLElement | null;
    const visible = mask ? getComputedStyle(mask).display !== "none" : el.offsetParent !== null;
    // Neutralize any scale/translate transform (e.g. the Formcycle designer's zoom) BEFORE measuring,
    // so rect.left/top reflect the real (unscaled) position — otherwise the transform offsets the
    // measurement and the dialog is pushed further off-screen.
    el.style.transform = "none";
    const rect = el.getBoundingClientRect();
    if (!visible) return false;
    if (rect.width < 50 || rect.height < 50) return false;
    // The dialog must be wide enough for both panes. If its current left edge leaves too little
    // room to reach the right edge of the viewport, shift the left edge left so the dialog always
    // expands and the change-log panel never overlaps the assistant content. Never place it left of
    // the viewport edge.
    // Clamp the panel width against the viewport so a stale/huge saved width can't blow up the
    // expansion math (which would otherwise squeeze the assistant content to nothing).
    const minTotal =
      this.clampLogPanelWidth(this.logPanelWidth, window.innerWidth) + AiAssistant.LOG_PANEL_MAIN_MIN_WIDTH + 8;
    const left = Math.max(0, Math.min(rect.left, Math.max(0, Math.round(window.innerWidth - minTotal))));
    const dialogWidth = Math.max(620, Math.round(window.innerWidth - left));
    el.style.position = "fixed";
    el.style.transform = "none";
    el.style.left = `${left}px`;
    el.style.top = `${Math.max(0, Math.round(rect.top))}px`;
    this.dialogWidth = dialogWidth;
    // Apply the expanded width directly (no Angular style binding) so the resize handle and manual
    // resize are never overwritten.
    el.style.width = `${this.dialogWidth}px`;
    el.style.maxWidth = "none";
    this.applyWatermarkPosition();
    this.cdr.markForCheck();
    return true;
  }

  /** Centers the watermark over the left (assistant) content — not the whole widened dialog — and
   *  recalculates it whenever the splitter moves / the areas are resized. The watermark is capped
   *  at 200px, so its left edge sits ~100px left of the content center. */
  private applyWatermarkPosition(): void {
    if (!this.showLog) return;
    const el = document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`) as HTMLElement | null;
    if (!el) return;
    const mainWidth = this.dialogWidth - 8 - this.logPanelWidth;
    el.style.backgroundPosition = `0 0, ${Math.max(0, Math.round(mainWidth / 2) - 100)}px center`;
  }

  /** Restores the dialog to its folded width (the last width while the change-log panel was hidden). */
  private restoreDialogSize(): void {
    this.dialogWidth = this.foldedDialogWidth;
    const el = document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`) as HTMLElement | null;
    if (el) {
      el.style.width = `${this.foldedDialogWidth}px`;
      el.style.maxWidth = "";
      el.style.backgroundPosition = "";
    }
    this.cdr.markForCheck();
  }

  // #region Lifecycle
  ngOnInit(): void {
    // Restore the persisted CodBi on/off switch state.
    try {
      const saved = localStorage.getItem(this.USE_CODBI_KEY);
      if (saved !== null) {
        this.useCodbi = saved === "1" || saved === "true";
      }
    } catch {
      // ignore storage errors
    }
    // Restore the persisted Bürgerservice field-naming switch state.
    try {
      const savedNaming = localStorage.getItem(this.USE_BUERGERSERVICE_NAMING_KEY);
      if (savedNaming !== null) {
        this.useBuergerserviceNaming = savedNaming === "1" || savedNaming === "true";
      }
    } catch {
      // ignore storage errors
    }
    // Restore the persisted "Nicht installierte Elemente erstellen" switch state and the user's
    // per-element allowed sets (the element picker). The switch itself only resets the checks to a
    // preset; manual per-element changes persist until the switch is toggled again.
    try {
      const savedAllow = localStorage.getItem(this.ALLOW_UNINSTALLED_KEY);
      if (savedAllow !== null) {
        this.allowUninstalledElements = savedAllow === "1" || savedAllow === "true";
      }
    } catch {
      // ignore storage errors
    }
    this.restoreAllowedElementSets();
    // The switch defaults OFF, so the element filter is active from the start: load the catalog
    // (with availability) once and establish the baseline checks (installed only) so the very first
    // run already transmits only the allowed elements — no need to open the picker first.
    void this.ensureElementsLoaded();
    document.addEventListener("codbi:ai-assistant:open", this.openHandler);
    document.addEventListener("codbi:ai-assistant:speech", this.speechHandler);
    // Persist the chat before ANY reload so it re-opens afterwards (our own reload or Formcycle's).
    window.addEventListener("beforeunload", this.beforeUnloadHandler);
    // On window resizes, re-clamp the change-log panel (25%-75% of the actual dialog width) and
    // refresh the footer wrap state.
    window.addEventListener("resize", this.onWindowResize);
    // Re-open the chat popup with a persisted conversation after a workflow-triggered reload. This
    // MUST run before the steps below: checkSensitiveAutoOpen() can throw "Designer instance was
    // not created yet" when the Formcycle designer is not ready on first paint, and an uncaught
    // error in ngOnInit would otherwise prevent the chat from ever being restored.
    this.restorePendingChat();
    // Pre-load the AI models so a restored chat can continue immediately without waiting for the
    // assistant dialog to be opened (selectedModel is otherwise null on a fresh page).
    this.ensureModelLoaded();
    try {
      this.checkSyncAllowed();
      this.loadLogPanelWidth();
    } catch {
      // ignore designer-not-ready errors at bootstrap time
    }
    // Register the drag handle once. PrimeNG only emits (onShow) after the open animation, which is
    // disabled in this app — so we must not depend on onShow for the drag registration.
    this.dragCleanup?.();
    this.dragCleanup = enableDialogDrag(
      AiAssistant.DIALOG_STYLE_CLASS,
      "codbi-dialog-assistant-position",
      (p) => (this.dialogPosition = p),
    );
    document.documentElement.style.setProperty(
      "--cb-ai-watermark-url",
      `url('${this.baseUrl}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg')`,
    );
    // Auto-open the change-log side panel when the last inference used sensitive elements that are
    // not all marked as checked. Two independent triggers (so it works even if one is missed):
    //  1. A pending localStorage value ("codbi-log-sensitive-elements") written by the assistant
    //     right before a workflow-triggered page reload.
    //  2. The database itself: the newest log entry of the current form used sensitive elements
    //     within the last few minutes (see checkSensitiveAutoOpen).
    try {
      const pendingSensitive = localStorage.getItem("codbi-log-sensitive-elements");
      if (pendingSensitive) {
        localStorage.removeItem("codbi-log-sensitive-elements");
        let elements: string[] = [];
        try {
          const parsed = JSON.parse(pendingSensitive) as unknown;
          elements = Array.isArray(parsed)
            ? (parsed as string[]).filter((e): e is string => typeof e === "string")
            : [];
        } catch {
          // ignore malformed payload
        }
        if (elements.length > 0) {
          this.openLog(elements);
        }
      } else {
        const pendingBlocked = localStorage.getItem(AiAssistant.BLOCKED_SQL_STORAGE_KEY);
        if (pendingBlocked) {
          // The log component consumes the key and reveals the blocked SQL nodes (error icons).
          this.openLog([]);
        } else {
          this.checkSensitiveAutoOpen();
        }
      }
    } catch (err) {
      // A designer-not-ready error here must never prevent the rest of the initialisation.
      console.warn("[AICodBiAssistant] ngOnInit: sensitive auto-open skipped", err);
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener("codbi:ai-assistant:open", this.openHandler);
    document.removeEventListener("codbi:ai-assistant:speech", this.speechHandler);
    window.removeEventListener("beforeunload", this.beforeUnloadHandler);
    window.removeEventListener("resize", this.onWindowResize);
    this.stopSpeech();
    this.dragCleanup?.();
    this.dragCleanup = null;
    this.chatDragCleanup?.();
    this.chatDragCleanup = null;
    this.endLogResize();
  }
  // #endregion Lifecycle

  // #region Template helpers
  onVisibleChange(v: boolean): void {
    if (v) {
      // PrimeNG (re)showed the dialog — ensure it is not marked hidden and its CSS is restored.
      this.dialogHidden = false;
      //this.visible = true;
      this.dialogDismissed = false;
      const el = document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`) as HTMLElement | null;
      if (el) {
        el.style.display = "";
        el.style.pointerEvents = "";
        const mask = el.closest(".p-dialog-mask") as HTMLElement | null;
        if (mask) {
          mask.style.display = "";
          mask.style.pointerEvents = "";
        }
      }
    } else {
      // Native close (Escape / close button / mask click). Keep the dialog MOUNTED (user-preferred
      // approach) so a subsequent open is a fast, pure CSS flip — do NOT set visible=false, which
      // would make PrimeNG remove the dialog from the DOM and force a full host re-bootstrap (the
      // 2-3s reopen). Hide it purely via CSS instead.
      this.dialogHidden = true;
      this.dialogDismissed = true;
      // Keep visible=true so PrimeNG never destroys the element.
      //this.visible = true;
      const el = document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`) as HTMLElement | null;
      if (el) {
        el.style.display = "none";
        el.style.pointerEvents = "none";
        const mask = el.closest(".p-dialog-mask") as HTMLElement | null;
        if (mask) {
          mask.style.display = "none";
          mask.style.pointerEvents = "none";
        }
      }
      // Preserve the change-log panel state across a native close (Escape / close button / mask
      // click) so it reopens exactly as the user left it — the same behavior as the ALT+A close()
      // path. Only reset the dialog width when the log was NOT open (it was already folded then).
      if (!this.showLog) {
        this.dialogWidth = this.foldedDialogWidth;
      }
      // Remember the maximized state so a dialog closed while maximized reopens maximized.
      this.persistMaximized();
      // The dialog is kept MOUNTED (hidden via display:none), and PrimeNG nests the dialog inside its
      // mask — so removing the mask here would destroy the kept-mounted dialog. Only remove a mask
      // that is genuinely orphaned (no mounted dialog underneath it).
      setTimeout(() => {
        if (!document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`)) {
          this.removeOverlayMask(".cb-ai-assistant-mask");
        }
        if (!document.querySelector(".cb-prompt-manager-dialog")) {
          this.removeOverlayMask(".cb-prompt-manager-mask");
        }
      }, 0);
    }
    this.cdr.markForCheck();
  }

  /** Restores the remembered dialog position/size once it has rendered (best effort — see ngOnInit). */
  onDialogShow(): void {
    const el = document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`) as HTMLElement | null;
    if (el) {
      // A maximized dialog fills the viewport — never reset its width.
      if (!el.classList.contains("p-dialog-maximized")) {
        el.style.width = `${this.foldedDialogWidth}px`;
        el.style.maxWidth = "";
        el.style.backgroundPosition = "";
      }
    }
    setTimeout(() => applyDialogPosition(AiAssistant.DIALOG_STYLE_CLASS, this.dialogPosition), 0);
  }

  /** Remembers the dialog position after the user dragged it. */
  onDialogDragEnd(): void {
    const p = readDialogPosition(AiAssistant.DIALOG_STYLE_CLASS);
    if (p) {
      this.dialogPosition = p;
      saveDialogPosition("codbi-dialog-assistant-position", p);
    }
  }

  /** Re-maximizes the assistant dialog after a reopen when it was closed while maximized. Clicks
   *  PrimeNG's own maximize button so it uses the correct fill styles AND captures the current
   *  position as the pre-maximize state — un-maximizing later returns to the saved spot. */
  private restoreMaximized(): void {
    let want = false;
    try {
      want = localStorage.getItem(AiAssistant.MAXIMIZED_KEY) === "1";
    } catch {
      // ignore storage errors
    }
    if (!want) return;
    const tryRestore = (attempt: number): void => {
      const el = document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`) as HTMLElement | null;
      if (!el || el.classList.contains("p-dialog-maximized")) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        if (attempt < 30) setTimeout(() => tryRestore(attempt + 1), 100);
        return;
      }
      // Apply the saved floating position first so PrimeNG captures it as the pre-maximize size.
      applyDialogPosition(AiAssistant.DIALOG_STYLE_CLASS, this.dialogPosition);
      // PrimeNG v20 renders the maximize button as .p-dialog-maximize-button (the old
      // .p-dialog-maximize-icon class no longer exists) — match both.
      const btn = el.querySelector<HTMLElement>(".p-dialog-maximize-button, .p-dialog-maximize-icon");
      if (btn) {
        btn.click();
      }
    };
    setTimeout(() => tryRestore(0), 150);
  }

  /** Persists the assistant dialog's maximized state the moment PrimeNG toggles it (the (onMaximize)
   *  event fires on BOTH maximize and restore), so a form reload right after maximizing reopens the
   *  dialog maximized — not just a close-while-maximized. */
  onDialogMaximize(event: { maximized: boolean }): void {
    this.persistMaximized(event.maximized);
  }

  /** Persists the current maximized state, so a dialog closed or reloaded while maximized reopens
   *  maximized. Reads the rendered `p-dialog-maximized` class (robust against any PrimeNG internal
   *  reset) unless an explicit [maximized] value is supplied from PrimeNG's (onMaximize) event. */
  private persistMaximized(maximized?: boolean): void {
    const el = document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`) as HTMLElement | null;
    const isMaximized = maximized ?? !!el?.classList.contains("p-dialog-maximized");
    try {
      localStorage.setItem(AiAssistant.MAXIMIZED_KEY, isMaximized ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  }

  /** Restores the chat popup's maximized state (clicking PrimeNG's own maximize button) so a chat
   *  closed while maximized reopens maximized. */
  private restoreChatMaximized(): void {
    let want = false;
    try {
      want = localStorage.getItem(AiAssistant.CHAT_MAXIMIZED_KEY) === "1";
    } catch {
      // ignore storage errors
    }
    if (!want) return;
    const tryRestore = (attempt: number): void => {
      const el = document.querySelector(`.${AiAssistant.CHAT_DIALOG_STYLE_CLASS}`) as HTMLElement | null;
      if (!el || el.classList.contains("p-dialog-maximized")) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        if (attempt < 30) setTimeout(() => tryRestore(attempt + 1), 100);
        return;
      }
      // Apply the saved floating position first so PrimeNG captures it as the pre-maximize size.
      applyDialogPosition(AiAssistant.CHAT_DIALOG_STYLE_CLASS, this.chatPosition);
      // PrimeNG v20 renders the maximize button as .p-dialog-maximize-button (the old
      // .p-dialog-maximize-icon class no longer exists) — match both.
      const btn = el.querySelector<HTMLElement>(".p-dialog-maximize-button, .p-dialog-maximize-icon");
      if (btn) {
        btn.click();
      }
    };
    setTimeout(() => tryRestore(0), 150);
  }

  /** Persists the chat popup's maximized state the moment PrimeNG toggles it (the (onMaximize)
   *  event fires on BOTH maximize and restore), so a form reload right after maximizing reopens the
   *  popup maximized — not just a close-while-maximized. */
  onChatMaximize(event: { maximized: boolean }): void {
    this.persistChatMaximized(event.maximized);
  }

  /** Persists the chat popup's current maximized state so it reopens maximized. Reads the rendered
   *  `p-dialog-maximized` class (robust against any PrimeNG internal reset) unless an explicit
   *  [maximized] value is supplied from PrimeNG's (onMaximize) event. */
  private persistChatMaximized(maximized?: boolean): void {
    const el = document.querySelector(`.${AiAssistant.CHAT_DIALOG_STYLE_CLASS}`) as HTMLElement | null;
    const isMaximized = maximized ?? !!el?.classList.contains("p-dialog-maximized");
    try {
      localStorage.setItem(AiAssistant.CHAT_MAXIMIZED_KEY, isMaximized ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  }

  /**
   * The robust auto-open fallback: queries the newest log entry of the current form directly in the
   * database. If it used sensitive elements within the last few minutes and not all of them are
   * already acknowledged (per the persisted `sensitiveChecks`), the change-log side panel is
   * unfolded automatically (opening the assistant dialog if it is not visible). Runs once on every
   * page load, so it also works after the workflow-triggered form reload without relying on
   * localStorage or event timing.
   */
  private checkSensitiveAutoOpen(): void {
    const checkWhenReady = (attempt: number): void => {
      let formKey: string | null = null;
      try {
        formKey = getCurrentFormKey();
      } catch {
        // Designer not ready yet (e.g. right after a workflow-triggered reload) — retry briefly
        // instead of throwing out of ngOnInit.
        if (attempt < 10) {
          setTimeout(() => checkWhenReady(attempt + 1), 150);
          return;
        }
      }
      if (!formKey && attempt < 10) {
        setTimeout(() => checkWhenReady(attempt + 1), 150);
        return;
      }
      const headers: Record<string, string> = { "X-Action": "Log" };
      if (formKey) {
        headers["X-Form-Key"] = formKey;
      }
      getJQuery().ajax({
        url: `${this.baseUrl}plugin?name=CodBi_AICodBiAssistant`,
        type: "GET",
        headers,
        success: (response: unknown) => {
          const payload = response as Record<string, unknown> | null;
          const entries = (payload?.["entries"] as Array<Record<string, unknown>> | undefined) ?? [];
          const newest = entries[0];
          if (!newest) return;
          const ageMin = this.ageMinutes(String(newest["ts"] ?? ""));
          if (ageMin === null || ageMin > AiAssistant.AUTO_OPEN_WINDOW_MINUTES) return;
          const entryId = String(newest["id"] ?? "");
          // If this exact entry was already surfaced by an earlier auto-open (and the user closed
          // the log), do not pop it open again on every reload — only a NEW entry re-triggers it.
          try {
            if (localStorage.getItem(AiAssistant.SURFACED_ENTRY_KEY) === entryId) return;
          } catch {
            // ignore storage errors
          }
          // Blocked destructive SQL statements in this entry's workflow changes — auto-open the log
          // with those nodes revealed (error icons), like the sensitive-element popup.
          const blockedUsed = Array.isArray(newest["blockedSqlUsed"])
            ? (newest["blockedSqlUsed"] as unknown[]).filter((n) => typeof n === "string" && (n as string).length > 0)
            : [];
          // The (entry, element) dismiss checks already persisted for this user.
          const checks = (payload?.["sensitiveChecks"] as unknown[] | undefined) ?? [];
          const acknowledged = new Set<string>();
          for (const check of checks) {
            if (typeof check !== "object" || check === null) continue;
            const c = check as Record<string, unknown>;
            if (String(c["entryId"] ?? "") === entryId) {
              acknowledged.add(String(c["elementName"] ?? "").toLowerCase());
            }
          }
          const used = newest["sensitiveUsed"];
          const unacknowledged = Array.isArray(used)
            ? (used as unknown[])
                .map((name) => String(name))
                .filter((name) => name && !acknowledged.has(name.toLowerCase()))
            : [];
          if (unacknowledged.length === 0 && blockedUsed.length === 0) return;
          if (blockedUsed.length > 0) {
            try {
              localStorage.setItem(AiAssistant.BLOCKED_SQL_STORAGE_KEY, JSON.stringify(blockedUsed));
            } catch {
              // ignore storage errors
            }
          }
          try {
            localStorage.setItem(AiAssistant.SURFACED_ENTRY_KEY, entryId);
          } catch {
            // ignore storage errors
          }
          this.openLog(unacknowledged);
        },
        error: () => {
          // Ignore — the change log can still be opened manually.
        },
      });
    };
    checkWhenReady(0);
  }

  /** Minutes since a backend timestamp ("yyyy-MM-dd HH:mm:ss.SSS"); null when unparseable. */
  private ageMinutes(ts: string): number | null {
    if (!ts) return null;
    const normalized = ts.includes(" ") ? ts.replace(" ", "T") : ts;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return null;
    return (Date.now() - date.getTime()) / 60000;
  }

  get resultHtml(): string | null {
    return this.resultText?.replace(/\n/g, "<br>") ?? null;
  }

  // #endregion Template helpers

  // #region Model cookie persistence
  private saveModelCookie(modelId: string): void {
    document.cookie = `${this.MODEL_COOKIE}=${encodeURIComponent(modelId)}; path=/; max-age=31536000; SameSite=Lax`;
  }

  private loadModelCookie(): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${this.MODEL_COOKIE}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }
  // #endregion Model cookie persistence

  // #region Open / close
  private open(): void {
    // Reopen-fast FIRST: if the dialog element is still mounted (kept hidden via display:none on
    // close), restore its display/pointer-events so it shows instantly — no Angular re-bootstrap, no
    // PrimeNG re-create. This MUST run before the re-entry guard below, which would otherwise treat
    // the mounted-but-hidden dialog as "already visible" and return without ever showing it again.
    const openEl = document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`) as HTMLElement | null;
    if (openEl) {
      openEl.style.display = "";
      openEl.style.pointerEvents = "";
      const openMask = openEl.closest(".p-dialog-mask") as HTMLElement | null;
      if (openMask) {
        openMask.style.display = "";
        openMask.style.pointerEvents = "";
      }
      this.dialogHidden = false;
      this.dialogDismissed = false;
      this.lastOpenedAt = Date.now();
      this.lastShowRequestedAt = performance.now();
      this.forceAssistantOnScreen();
      this.restoreMaximized();
      this.cdr.markForCheck();
      setTimeout(() => this.updateFooterLayout(), 300);
      return;
    }

    // A genuinely rendered, visible dialog ignores re-entry — the opening poll in
    // AICodBiAssistantDialog.ts can re-dispatch the open event while the dialog is still rendering.
    // Only when `visible` has been true for a long time with NO dialog rendered (a stuck state, e.g.
    // caused by a dialog element destroyed externally while the state still says visible) is the
    // state reset, so the next open event (a poll tick or the next ALT+A) can render the dialog
    // afresh — otherwise it could never appear again until a page reload.
    if (this.visible) {
      if (Date.now() - this.lastOpenedAt < 1500) {
        return;
      }
      // Stuck state: reset visible and fall through to the fresh-open below, so the CURRENT open
      // renders the dialog (no need to wait for another poll tick). (close() must NOT be used here
      // — it keeps visible=true, which would leave the dialog stuck closed.)
      this.visible = false;
      this.dialogHidden = true;
      this.dialogDismissed = false;
      this.cdr.markForCheck();
    }
    // Remember when the dialog was opened so openHandler's toggle only closes it on a deliberate
    // later ALT+A press, never on a stray second open event right after opening.
    this.lastOpenedAt = Date.now();
    this.resultText = null;
    this.errorText = null;
    this.attachedFile = null;
    // Always recover from a stuck busy state so the ALT+A hotkey can reopen the dialog even after
    // an inference that closed it without a page reload.
    this.loading = false;
    // Remove any lingering modal mask from a previous close SYNCHRONOUSLY, before the dialog
    // renders again. Removing it with a setTimeout(0) races the new dialog's render: when Angular
    // renders the fresh mask fast enough, the delayed cleanup deletes it and the dialog "flashes up
    // and vanishes" (and, being stuck at visible=true with no DOM, would then refuse to open on
    // later ALT+A presses). Removing it up front is safe — the newly rendered mask is never touched.
    this.removeOverlayMask(".cb-ai-assistant-mask");

    // Show the dialog IMMEDIATELY so ALT+A responds instantly — do NOT wait for the Status/Models
    // AJAX round-trips below (they used to delay the popup by seconds while the user kept pressing
    // the hotkey). The model list and DB-status check continue in the background; the model
    // dropdown simply populates when the list arrives. When the models are already loaded (page
    // load / prior open), restore the persisted change-log panel state right away as well.
    this.dialogDismissed = false;
    this.lastShowRequestedAt = performance.now();
    this.dialogHidden = false;
    this.visible = true;
    this.forceAssistantOnScreen();
    // Re-maximize the dialog when it was closed while maximized.
    this.restoreMaximized();
    // NOTE: deliberately NOT auto-expanding the change-log panel here (no restoreLogOpenState on the
    // manual ALT+A path). Auto-expanding it runs expandAndUnfoldLog, which retry-polled the dialog
    // and flooded the main thread — that is what kept delaying a subsequent manual reopen by
    // seconds. The change-log auto-open remains only on the inference-driven auto-popup paths
    // (loadModelsAndOpen / sensitive-element popups), where it is needed to surface results.
    this.cdr.markForCheck();

    // Keep the footer (switches vs buttons) centered when it wraps onto two lines.
    setTimeout(() => this.updateFooterLayout(), 300);

    // Verify the CodBi prompt database is reachable in the background. Without DB prompts there is
    // no point sending anything to the AI — show an error and disable the inputs (still visible).
    getJQuery().ajax({
      url: `${this.baseUrl}plugin?name=CodBi_AICodBiAssistant`,
      type: "GET",
      headers: { "X-Action": "Status" },
      success: (statusResponse: unknown) => {
        const status = (statusResponse as { status?: string; error?: string } | null)?.status;
        if (status !== "ok") {
          this.dbAvailable = false;
          this.errorText =
            (statusResponse as { error?: string } | null)?.error ??
            "Database not available — AI prompts cannot be loaded.";
          this.showToast(this.errorText);
          this.cdr.markForCheck();
          return;
        }
        this.dbAvailable = true;
        // Load the models in the background (no-op when they are already available).
        this.loadModelsAndOpen();
      },
      error: (xhr: unknown) => {
        const jq = xhr as { responseJSON?: { error?: string }; statusText?: string };
        this.dbAvailable = false;
        this.errorText =
          jq.responseJSON?.error ?? jq.statusText ?? "Database not available — AI prompts cannot be loaded.";
        this.showToast(this.errorText);
        this.cdr.markForCheck();
      },
    });
  }

  /** Formats a per-1M-token price for the model dropdown (e.g. "3.00"). */
  formatModelPrice(value: number): string {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  }

  /** Persists the CodBi on/off switch state when the user toggles it. */
  onUseCodbiChange(use: boolean): void {
    this.useCodbi = use;
    try {
      localStorage.setItem(this.USE_CODBI_KEY, use ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  }

  /** Persists the Bürgerservice field-naming switch state when the user toggles it. */
  onUseBuergerserviceNamingChange(use: boolean): void {
    this.useBuergerserviceNaming = use;
    try {
      localStorage.setItem(this.USE_BUERGERSERVICE_NAMING_KEY, use ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  }

  /** Localized label for the Bürgerservice-naming switch, following the Formcycle UI language. */
  get buergerserviceSwitchLabel(): string {
    const lang = (window as unknown as { XFC_METADATA?: { currentLanguage?: string } })?.XFC_METADATA?.currentLanguage;
    switch (lang) {
      case "de":
        return "Bürgerservice-Benennung";
      case "it":
        return "Denominazione Bürgerservice";
      case "nl":
        return "Bürgerservice-naamgeving";
      default:
        return "Bürgerservice naming";
    }
  }

  /** Localized label for the "Nicht installierte Elemente erstellen" switch. */
  get allowUninstalledSwitchLabel(): string {
    const lang = (window as unknown as { XFC_METADATA?: { currentLanguage?: string } })?.XFC_METADATA?.currentLanguage;
    switch (lang) {
      case "de":
        return "Nicht installierte Elemente erstellen";
      case "it":
        return "Crea elementi non installati";
      case "nl":
        return "Niet-geïnstalleerde elementen maken";
      default:
        return "Create non-installed elements";
    }
  }

  /**
   * Persists the "Nicht installierte Elemente erstellen" switch state and — because toggling the
   * switch REPLACES the current per-element settings with a preset — also resets the checks:
   * turning the switch ON checks every element, turning it OFF checks only the installed ones.
   */
  onAllowUninstalledElementsChange(use: boolean): void {
    this.allowUninstalledElements = use;
    this.markElementsConfigured();
    try {
      localStorage.setItem(this.ALLOW_UNINSTALLED_KEY, use ? "1" : "0");
    } catch {
      // ignore storage errors
    }
    // Ensure the catalog is loaded (fetching it if needed) so the preset can be applied — otherwise
    // an empty allowed-set would filter EVERY element out on the next run.
    void this.ensureElementsLoaded().then(() => this.applySwitchPreset());
  }

  /** Opens the element-picker dialog, loading the catalog (with availability) if not loaded yet. */
  openElementSettings(): void {
    this.elementSettingsVisible = true;
    // Opening the dialog alone does NOT reset the user's per-element settings — only toggling the
    // switch does. On the very first use the catalog load establishes the baseline (see
    // ensureElementsLoaded), afterwards the persisted manual checks are preserved.
    void this.ensureElementsLoaded();
  }

  /** Closes the element-picker dialog (visibility changes). */
  onElementSettingsVisibleChange(visible: boolean): void {
    this.elementSettingsVisible = visible;
  }

  /**
   * Loads the catalog of all known Formcycle widgets / workflow nodes / workflow triggers together
   * with their installed-status from the backend (once), then invokes [onLoaded]. When the user has
   * never configured the allowed sets yet, the loaded catalog also establishes the baseline from the
   * current switch state (ON → everything checked; OFF → installed only).
   */
  private ensureElementsLoaded(): Promise<void> {
    if (this.widgetElements.length > 0 || this.nodeElements.length > 0) {
      return Promise.resolve(); // already loaded
    }
    if (this.elementsLoadPromise) {
      return this.elementsLoadPromise; // a load is already in flight — await it
    }
    this.elementsLoading = true;
    this.elementsLoadPromise = new Promise<void>((resolve) => {
      getJQuery().ajax({
        url: `${this.baseUrl}plugin?name=CodBi_AICodBiAssistant`,
        type: "GET",
        headers: { "X-Action": "AvailableElements" },
        success: (response: unknown) => {
          this.elementsLoading = false;
          this.elementsLoadPromise = null;
          const payload = (response ?? {}) as {
            widgets?: Array<{ id?: unknown; name?: unknown; available?: unknown }>;
            nodes?: Array<{ id?: unknown; name?: unknown; available?: unknown }>;
            triggers?: Array<{ id?: unknown; name?: unknown; available?: unknown }>;
          };
          this.widgetElements = this.normalizeElementList(payload.widgets);
          this.nodeElements = this.normalizeElementList(payload.nodes);
          this.triggerElements = this.normalizeElementList(payload.triggers);
          // First-ever use (no persisted settings): establish the baseline from the switch state — a
          // fresh user with the switch ON keeps the current "everything allowed" behaviour, a user
          // who turned it OFF starts with only the installed elements checked.
          if (!this.elementsConfigured) {
            this.applySwitchPreset();
          }
          this.cdr.markForCheck();
          resolve();
        },
        error: () => {
          this.elementsLoading = false;
          this.elementsLoadPromise = null;
          // Fall back to "everything allowed" (current behaviour) when the catalog cannot be loaded:
          // keep the element lists empty AND reset the configured flag so no allowed-lists are sent
          // (an empty list would filter every element out on the next run).
          this.widgetElements = [];
          this.nodeElements = [];
          this.triggerElements = [];
          this.elementsConfigured = false;
          try {
            localStorage.removeItem(this.ELEMENTS_CONFIGURED_KEY);
          } catch {
            // ignore storage errors
          }
          this.cdr.markForCheck();
          resolve();
        },
      });
    });
    return this.elementsLoadPromise;
  }

  /**
   * Applies the current switch state as the checked-set preset: switch ON → check every element;
   * switch OFF → check only the installed (available) ones. This is what REPLACES the user's manual
   * per-element settings whenever the switch is toggled.
   */
  private applySwitchPreset(): void {
    if (this.allowUninstalledElements) {
      this.checkAllElements();
    } else {
      this.checkAvailableElements();
    }
  }

  /** Maps the backend catalog entries to the frontend shape ({id, name, available}). */
  private normalizeElementList(
    list: Array<{ id?: unknown; name?: unknown; available?: unknown }> | undefined,
  ): Array<{ id: string; name: string; available: boolean }> {
    return (list ?? [])
      .map((e) => ({
        id: String(e.id ?? "").trim(),
        name: String(e.name ?? e.id ?? "").trim(),
        available: e.available === true,
      }))
      .filter((e) => e.id.length > 0);
  }

  /** Whether the given element (by category + id) is currently checked (allowed). */
  isElementChecked(category: "widgets" | "nodes" | "triggers", id: string): boolean {
    const set = this.allowedSetFor(category);
    return set.has(id);
  }

  /** Toggles an element's checked state and persists the change. */
  toggleElement(category: "widgets" | "nodes" | "triggers", id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement | null)?.checked ?? false;
    this.markElementsConfigured();
    const set = this.allowedSetFor(category);
    if (checked) {
      set.add(id);
    } else {
      set.delete(id);
    }
    this.persistAllowedElementSets();
  }

  /** Checks every widget, node and trigger (the "switch ON" preset). */
  checkAllElements(): void {
    this.markElementsConfigured();
    this.widgetElements.forEach((e) => this.allowedWidgets.add(e.id));
    this.nodeElements.forEach((e) => this.allowedNodes.add(e.id));
    this.triggerElements.forEach((e) => this.allowedTriggers.add(e.id));
    this.persistAllowedElementSets();
  }

  /** Checks only the installed (available) widgets, nodes and triggers (the "switch OFF" preset). */
  checkAvailableElements(): void {
    this.markElementsConfigured();
    this.widgetElements.forEach((e) => {
      if (e.available) this.allowedWidgets.add(e.id);
      else this.allowedWidgets.delete(e.id);
    });
    this.nodeElements.forEach((e) => {
      if (e.available) this.allowedNodes.add(e.id);
      else this.allowedNodes.delete(e.id);
    });
    this.triggerElements.forEach((e) => {
      if (e.available) this.allowedTriggers.add(e.id);
      else this.allowedTriggers.delete(e.id);
    });
    this.persistAllowedElementSets();
  }

  /** The allowed set for the given element category. */
  private allowedSetFor(category: "widgets" | "nodes" | "triggers"): Set<string> {
    switch (category) {
      case "widgets":
        return this.allowedWidgets;
      case "nodes":
        return this.allowedNodes;
      default:
        return this.allowedTriggers;
    }
  }

  /** Restores the persisted per-element allowed sets from localStorage. */
  private restoreAllowedElementSets(): void {
    this.allowedWidgets = this.readAllowedSet(this.ALLOWED_WIDGETS_KEY);
    this.allowedNodes = this.readAllowedSet(this.ALLOWED_NODES_KEY);
    this.allowedTriggers = this.readAllowedSet(this.ALLOWED_TRIGGERS_KEY);
    try {
      this.elementsConfigured = localStorage.getItem(this.ELEMENTS_CONFIGURED_KEY) === "1";
    } catch {
      // ignore storage errors
    }
  }

  /** Marks the allowed-element sets as user-configured (persisted), so they are sent on each run. */
  private markElementsConfigured(): void {
    this.elementsConfigured = true;
    try {
      localStorage.setItem(this.ELEMENTS_CONFIGURED_KEY, "1");
    } catch {
      // ignore storage errors
    }
  }

  /** Reads a persisted allowed set (JSON array) from localStorage. */
  private readAllowedSet(key: string): Set<string> {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return new Set<string>();
      const arr = JSON.parse(raw) as unknown;
      if (!Array.isArray(arr)) return new Set<string>();
      return new Set(arr.filter((v): v is string => typeof v === "string" && v.length > 0));
    } catch {
      return new Set<string>();
    }
  }

  /** Persists the per-element allowed sets to localStorage. */
  private persistAllowedElementSets(): void {
    try {
      localStorage.setItem(this.ALLOWED_WIDGETS_KEY, JSON.stringify([...this.allowedWidgets]));
      localStorage.setItem(this.ALLOWED_NODES_KEY, JSON.stringify([...this.allowedNodes]));
      localStorage.setItem(this.ALLOWED_TRIGGERS_KEY, JSON.stringify([...this.allowedTriggers]));
    } catch {
      // ignore storage errors
    }
  }

  /** Adds the checked (allowed) element lists to the phase-2 request so the backend filters the
   *  transmitted widget/node/trigger reference sections accordingly. When the switch is ON the AI may
   *  create anything (no lists are sent → no restriction); when it is OFF only the checked elements
   *  are transmitted. The lists are only sent once the catalog is loaded so they are meaningful. */
  private appendAllowedElements(data: Record<string, string>): void {
    // Switch ON = current behaviour: the AI may create any node and any widget — no filtering.
    if (this.allowUninstalledElements) return;
    const catalogLoaded =
      this.widgetElements.length > 0 || this.nodeElements.length > 0 || this.triggerElements.length > 0;
    if (!catalogLoaded) return;
    // Switch OFF: only AVAILABLE (installed) elements may be transmitted. A checked non-installed
    // element (e.g. the ePayBL node) is only usable when the switch is ON — so even a stale or
    // manual check of an unavailable element is NOT sent while the switch is OFF. This is the
    // actual guarantee behind "Nicht installierte Elemente erstellen".
    const availableOnly = (list: Array<{ id: string; available: boolean }>, set: Set<string>): string[] =>
      [...set].filter((id) => list.some((e) => e.id === id && e.available));
    data["allowedWidgets"] = JSON.stringify(availableOnly(this.widgetElements, this.allowedWidgets));
    data["allowedNodes"] = JSON.stringify(availableOnly(this.nodeElements, this.allowedNodes));
    data["allowedTriggers"] = JSON.stringify(availableOnly(this.triggerElements, this.allowedTriggers));
  }

  private loadModelsAndOpen(): void {
    if (this.models.length === 0) {
      this.restoreCachedModels();
    }
    if (this.models.length > 0) {
      this.selectedModel = this.loadModelCookie() ?? this.models[0]?.id ?? null;
      // Do not re-open the dialog when the user dismissed it while the request was in flight.
      if (!this.dialogDismissed) {
        this.visible = true;
        this.forceAssistantOnScreen();
        // Re-maximize the dialog when it was closed/reloaded while maximized.
        this.restoreMaximized();
        // Re-open the change-log panel if the user left it open the last time (persisted).
        this.restoreLogOpenState();
      }
      this.cdr.markForCheck();
      return;
    }
    // A request is already fetching the model list (e.g. the log-panel restore racing the Status
    // check) — let it finish instead of firing a duplicate.
    if (this.modelsLoading) return;
    this.modelsLoading = true;
    getJQuery().ajax({
      url: `${this.baseUrl}plugin?name=CodBi_AICodBiAssistant`,
      type: "GET",
      headers: { "X-Action": "Models" },
      success: (response: unknown) => {
        this.modelsLoading = false;
        if (!Array.isArray(response)) {
          this.errorText = (response as { error?: string } | null)?.error ?? "AI service not available.";
        } else {
          const list = response as AiModel[];
          this.models = list;
          this.cacheModels();
          const saved = this.loadModelCookie();
          this.selectedModel = saved && list.some((m) => m.id === saved) ? saved : (list[0]?.id ?? null);
        }
        // Do not re-open the dialog when the user dismissed it while the request was in flight.
        if (!this.dialogDismissed) {
          this.visible = true;
          this.forceAssistantOnScreen();
          if (this.errorText) this.showToast(this.errorText);
          // Re-maximize the dialog when it was closed/reloaded while maximized.
          this.restoreMaximized();
          // Re-open the change-log panel if the user left it open the last time (persisted).
          this.restoreLogOpenState();
        }
        this.cdr.markForCheck();
      },
      error: (xhr: unknown) => {
        this.modelsLoading = false;
        const jq = xhr as { responseJSON?: { error?: string }; statusText?: string };
        this.errorText = jq.responseJSON?.error ?? jq.statusText ?? "AI service not available.";
        // Do not re-open the dialog when the user dismissed it while the request was in flight.
        if (!this.dialogDismissed) {
          this.visible = true;
          this.forceAssistantOnScreen();
          this.showToast(this.errorText);
        }
        this.cdr.markForCheck();
      },
    });
  }

  /** Restores the AI model list from sessionStorage when present (covers the Angular host being
   *  re-created on reopen), so a reopen does not wait on the models AJAX. Returns true on restore. */
  private restoreCachedModels(): boolean {
    if (this.models.length > 0) return true;
    try {
      const raw = sessionStorage.getItem(AiAssistant.MODELS_CACHE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return false;
      const list = parsed.filter(
        (m): m is AiModel => !!m && typeof m === "object" && typeof (m as { id?: unknown }).id === "string",
      );
      if (list.length === 0) return false;
      this.models = list;
      const saved = this.loadModelCookie();
      this.selectedModel = saved && list.some((m) => m.id === saved) ? saved : (list[0]?.id ?? null);
      return true;
    } catch {
      return false;
    }
  }

  /** Saves the loaded AI model list to sessionStorage for the next host bootstrap. */
  private cacheModels(): void {
    try {
      sessionStorage.setItem(AiAssistant.MODELS_CACHE_KEY, JSON.stringify(this.models));
    } catch {
      // ignore storage errors
    }
  }

  /** Ensures the AI models are loaded and a model is selected, WITHOUT opening the assistant dialog
   *  (used on page load / after a workflow-triggered reload so the restored chat can continue
   *  immediately). Invokes [onLoaded] once the models are available (or the load failed). */
  private ensureModelLoaded(onLoaded?: () => void): void {
    if (!this.selectedModel && this.models.length === 0) {
      this.restoreCachedModels();
    }
    if (this.selectedModel) {
      onLoaded?.();
      return;
    }
    if (this.models.length > 0) {
      this.selectedModel = this.loadModelCookie() ?? this.models[0]?.id ?? null;
      onLoaded?.();
      return;
    }
    getJQuery().ajax({
      url: `${this.baseUrl}plugin?name=CodBi_AICodBiAssistant`,
      type: "GET",
      headers: { "X-Action": "Models" },
      success: (response: unknown) => {
        if (Array.isArray(response)) {
          const list = response as AiModel[];
          this.models = list;
          this.cacheModels();
          const saved = this.loadModelCookie();
          this.selectedModel = saved && list.some((m) => m.id === saved) ? saved : (list[0]?.id ?? null);
        }
        this.cdr.markForCheck();
        onLoaded?.();
      },
      error: () => {
        onLoaded?.();
      },
    });
  }

  close(): void {
    // Keep the dialog MOUNTED: DO NOT set `visible=false` — that is what makes PrimeNG remove the
    // dialog from the DOM, which then triggers the host re-bootstrap/re-mount on the next open
    // (the 2-3s reopening). Instead keep `visible=true` and hide the element purely via CSS
    // (display:none / pointer-events:none), so a reopen is a fast, pure CSS flip.
    this.dialogHidden = true;
    this.dialogDismissed = true;
    const closeEl = document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`) as HTMLElement | null;
    if (closeEl) {
      closeEl.style.display = "none";
      closeEl.style.pointerEvents = "none";
      const closeMask = closeEl.closest(".p-dialog-mask") as HTMLElement | null;
      if (closeMask) {
        closeMask.style.display = "none";
        closeMask.style.pointerEvents = "none";
      }
    }
    // Remember the maximized state so a dialog closed while maximized reopens maximized.
    this.persistMaximized();
    this.cdr.markForCheck();
    // The dialog is kept MOUNTED (hidden via display:none), and PrimeNG nests the dialog inside its
    // mask — so removing the mask here would destroy the dialog we just kept mounted. Only remove a
    // mask that is genuinely orphaned (no mounted dialog underneath it).
    setTimeout(() => {
      if (!document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`)) {
        this.removeOverlayMask(".cb-ai-assistant-mask");
      }
      if (!document.querySelector(".cb-prompt-manager-dialog")) {
        this.removeOverlayMask(".cb-prompt-manager-mask");
      }
    }, 0);
  }

  /** Forces the assistant dialog back fully inside the viewport shortly after it opens (guards
   *  against a stale/off-screen saved position leaving the header unreachable). Re-checks a few
   *  times until the dialog has actually rendered (a clamp before layout measures a 0×0 rect and
   *  does nothing), and once more shortly after so a late position restore is corrected too. */
  private forceAssistantOnScreen(): void {
    let attempts = 0;
    const tryClamp = (): void => {
      attempts++;
      const el = document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`) as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          clampRenderedToViewport(AiAssistant.DIALOG_STYLE_CLASS);
          if (attempts === 1) setTimeout(tryClamp, 200);
          return;
        }
      }
      if (attempts < 10) setTimeout(tryClamp, 80);
    };
    setTimeout(tryClamp, 0);
  }

  onModelChange(modelId: string): void {
    this.selectedModel = modelId;
    if (modelId) {
      this.saveModelCookie(modelId);
    }
  }
  // #endregion Open / close

  // #region Attachment
  triggerFileInput(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif,application/pdf";
    input.style.display = "none";
    input.addEventListener("change", (e) => this.onFileSelected(e));
    document.body.appendChild(input);
    input.click();
    // Remove input element after a short delay to keep the DOM clean
    setTimeout(() => document.body.removeChild(input), 60_000);
  }

  private onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"];
    if (!allowed.includes(file.type)) {
      this.setError("Unsupported file type. Please attach an image (PNG, JPG, WebP, GIF) or a PDF.");
      return;
    }
    const maxBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxBytes) {
      this.setError("File is too large. The maximum supported size is 10\u00a0MB.");
      return;
    }

    this.attachedFile = file;
    this.errorText = null;
    this.cdr.markForCheck();
  }

  clearAttachment(): void {
    this.attachedFile = null;
    this.cdr.markForCheck();
  }
  // #endregion Attachment

  // #region Speech input
  toggleSpeech(): void {
    if (this.isSpeechRecording) {
      this.stopSpeech();
      return;
    }
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;

    this.speechBaseText = this.promptText;
    this.speechFinalText = "";
    const rec = new SR() as any;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = String(e.results[i][0].transcript);
        if (e.results[i].isFinal) {
          this.speechFinalText += t;
        } else {
          interim = t;
        }
      }
      const parts = [this.speechBaseText, this.speechFinalText + interim].filter((s) => s.trim());
      this.promptText = parts.join(" ").trim();
      this.cdr.markForCheck();
    };

    rec.onend = () => {
      this.isSpeechRecording = false;
      this.speechRecognition = null;
      this.cdr.markForCheck();
    };

    rec.onerror = () => {
      this.isSpeechRecording = false;
      this.speechRecognition = null;
      this.cdr.markForCheck();
    };

    this.speechRecognition = rec;
    rec.start();
    this.isSpeechRecording = true;
    this.cdr.markForCheck();
  }

  private stopSpeech(): void {
    if (this.speechRecognition) {
      this.speechRecognition.stop();
      this.speechRecognition = null;
    }
    this.isSpeechRecording = false;
  }
  // #endregion Speech input

  // #region PDF.js helpers
  /** Loads (once) the pdf.js global API (window.pdfjsLib) by appending the UMD pdf.min.js script on
   *  demand, then configures its worker. Resolves to the pdf.js API so callers can use
   *  pdfjs.getDocument() right away. */
  private loadPdfJs(): Promise<PdfJsLib> {
    if (!this.pdfJs) {
      this.pdfJs = new Promise<PdfJsLib>((resolve, reject) => {
        const win = window as Window & { pdfjsLib?: PdfJsLib };
        if (win.pdfjsLib) {
          win.pdfjsLib.GlobalWorkerOptions.workerSrc = `${this.baseUrl}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.worker.min.js`;
          resolve(win.pdfjsLib);
          return;
        }
        const script = document.createElement("script");
        script.src = `${this.baseUrl}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.min.js`;
        script.onload = () => {
          if (win.pdfjsLib) {
            win.pdfjsLib.GlobalWorkerOptions.workerSrc = `${this.baseUrl}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.worker.min.js`;
            resolve(win.pdfjsLib);
          } else {
            reject(new Error("pdf.js did not initialize the global pdfjsLib"));
          }
        };
        script.onerror = () => reject(new Error("Failed to load pdf.js"));
        document.head.appendChild(script);
      });
    }
    return this.pdfJs;
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to convert canvas to blob"));
      }, "image/png");
    });
  }

  private async renderPdfPageToImage(page: PDFPageProxy): Promise<Blob> {
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Failed to get canvas 2D context");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport: viewport }).promise;
    return this.canvasToBlob(canvas);
  }

  private async processPdfFile(file: File): Promise<Array<{ name: string; dataUrl: string }>> {
    const pdfjs = await this.loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const results: Array<{ name: string; dataUrl: string }> = [];
    const baseName = file.name.replace(/\.pdf$/i, "");

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const blob = await this.renderPdfPageToImage(page);
      const dataUrl = await this.blobToDataUrl(blob);
      results.push({ name: `${baseName}_page_${pageNum}.png`, dataUrl });
    }
    return results;
  }

  /** Converts a file to a list of {name, dataUrl} entries ready for codbi-base64 params. */
  private async fileToImageParams(file: File | null): Promise<Array<{ name: string; dataUrl: string }>> {
    if (!file) return [];
    if (file.type === "application/pdf") {
      return this.processPdfFile(file);
    }
    const dataUrl = await this.blobToDataUrl(file);
    return [{ name: file.name, dataUrl }];
  }

  /** Converts the attached file to a list of {name, dataUrl} entries ready for codbi-base64 params. */
  private async buildImageParams(): Promise<Array<{ name: string; dataUrl: string }>> {
    return this.fileToImageParams(this.attachedFile);
  }

  // #region Clarification popup

  /** Opens the clarification popup for the given questions (animated fade in). */
  private openClarification(questions: ClarificationQuestion[]): void {
    this.pendingClarification = questions;
    this.clarificationOption = {};
    this.clarificationAnswerText = "";
    this.clarificationFile = null;
    this.loading = false;
    this.clarificationVisible = true;
    // The user should be able to type an answer immediately — move focus to the answer textarea.
    this.focusClarificationInput();
    // Register the popup as draggable/snappable like the main assistant dialog, and restore its
    // last remembered position once it has rendered.
    this.clarificationDragCleanup?.();
    this.clarificationDragCleanup = enableDialogDrag(
      AiAssistant.CLARIFICATION_DIALOG_STYLE_CLASS,
      "codbi-dialog-clarification-position",
      (p) => {
        this.clarificationPosition = p;
      },
    );
    setTimeout(() => applyDialogPosition(AiAssistant.CLARIFICATION_DIALOG_STYLE_CLASS, this.clarificationPosition), 0);
    this.cdr.markForCheck();
  }

  /** Handles an option click for [questionId] (quick multiple-choice answer). For multi-select
   *  questions ("multiSelect":true) the option is TOGGLED so the user may pick several (e.g. "which
   *  personal data?"). For single-select questions exactly one option is kept (radio behavior). */
  selectClarificationOption(questionId: string, option: string): void {
    const question = this.pendingClarification.find((q) => q.id === questionId);
    const multiSelect = question?.multiSelect === true;
    const current = this.clarificationOption[questionId] ?? [];
    if (multiSelect) {
      this.clarificationOption[questionId] = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
    } else {
      this.clarificationOption[questionId] = [option];
    }
    this.cdr.markForCheck();
  }

  /** Whether [option] is currently selected for [questionId] (multi-select). */
  isClarificationOptionSelected(questionId: string, option: string): boolean {
    return (this.clarificationOption[questionId] ?? []).includes(option);
  }

  /**
   * Builds the email-friendly text for a clarification question: a leading carriage return, then
   * "- " + the question, then each option on its own line prefixed with a tab and a dash ("\t- ").
   * Only the inserted text is affected — the question is displayed in the popup exactly as it is.
   */
  private formatQuestionForEmail(q: ClarificationQuestion): string {
    const optionLines = (q.options ?? []).filter((o) => o.trim().length > 0).map((o) => `\t- ${o}`);
    return ["", `- ${q.question}`, ...optionLines].join("\n");
  }

  /**
   * Builds the email-friendly text for ALL pending clarification questions at once (each formatted
   * by [formatQuestionForEmail], joined with a blank line between them).
   */
  private formatAllQuestionsForEmail(): string {
    return this.pendingClarification.map((q) => this.formatQuestionForEmail(q)).join("\n\n");
  }

  /**
   * Copies a clarification question (with its options) to the clipboard so it can be pasted into an
   * email to the person who requested the form. Falls back to showing the text in a prompt if the
   * Clipboard API is unavailable.
   */
  copyClarificationQuestion(q: ClarificationQuestion): void {
    const text = this.formatQuestionForEmail(q);
    const done = (): void => {
      this.clarificationCopiedQuestionId = q.id;
      this.showToast("Question copied to clipboard");
      this.cdr.markForCheck();
      setTimeout(() => {
        if (this.clarificationCopiedQuestionId === q.id) {
          this.clarificationCopiedQuestionId = null;
          this.cdr.markForCheck();
        }
      }, 1600);
    };
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard
        .writeText(text)
        .then(done)
        .catch(() => {
          window.prompt("Copy this question", text);
        });
    } else {
      window.prompt("Copy this question", text);
    }
  }

  /** Copies ALL pending clarification questions (formatted like the header drag & drop) to the
   *  clipboard, so they can be pasted into an email without dragging. */
  copyAllClarificationQuestions(): void {
    const text = this.formatAllQuestionsForEmail();
    if (!text) return;
    const done = (): void => {
      this.clarificationCopiedAll = true;
      this.showToast("All questions copied to clipboard", "success");
      this.cdr.markForCheck();
      setTimeout(() => {
        this.clarificationCopiedAll = false;
        this.cdr.markForCheck();
      }, 1600);
    };
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard
        .writeText(text)
        .then(done)
        .catch(() => {
          window.prompt("Copy the questions", text);
        });
    } else {
      window.prompt("Copy the questions", text);
    }
  }

  /**
   * Starts an HTML5 drag of the whole question container so it can be dropped into a mail draft
   * (e.g. Outlook) WITHOUT having to highlight the text first. Setting `text/plain` in `dragstart`
   * makes the browser synthesize a native text drop, which email clients accept as pasted text.
   */
  onClarificationQuestionDragStart(event: Event, q: ClarificationQuestion): void {
    const e = event as DragEvent;
    if (!e.dataTransfer) {
      return;
    }
    const text = this.formatQuestionForEmail(q);
    const htmlOptions =
      q.options && q.options.length > 0
        ? `<p>&nbsp;&nbsp;&nbsp;&nbsp;- ${q.options.join("</p><p>&nbsp;&nbsp;&nbsp;&nbsp;- ")}</p>`
        : "";
    e.dataTransfer.setData("text/plain", text);
    e.dataTransfer.setData("text/html", `<p>&nbsp;</p><p>- ${q.question}</p>${htmlOptions}`);
    e.dataTransfer.effectAllowed = "copy";
  }

  /**
   * Starts an HTML5 drag of the WHOLE question list so all pending questions (each formatted like a
   * single question) are dropped into the mail draft at once.
   */
  onAllClarificationQuestionsDragStart(event: Event): void {
    const e = event as DragEvent;
    if (!e.dataTransfer || this.pendingClarification.length === 0) {
      return;
    }
    const text = this.formatAllQuestionsForEmail();
    const html = this.pendingClarification
      .map((q) => {
        const options =
          q.options && q.options.length > 0
            ? `<p>&nbsp;&nbsp;&nbsp;&nbsp;- ${q.options.join("</p><p>&nbsp;&nbsp;&nbsp;&nbsp;- ")}</p>`
            : "";
        return `<p>- ${q.question}</p>${options}`;
      })
      .join("<p>&nbsp;</p>");
    e.dataTransfer.setData("text/plain", text);
    e.dataTransfer.setData("text/html", `<p>&nbsp;</p>${html}`);
    e.dataTransfer.effectAllowed = "copy";
  }

  /** Stores the document the user attached to the clarification answers. */
  onClarificationFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.clarificationFile = input?.files?.[0] ?? null;
    this.cdr.markForCheck();
  }

  /** File-name label for the attachment button. */
  get clarificationFileLabel(): string {
    return this.clarificationFile ? this.clarificationFile.name : "Attach a document";
  }

  /** Whether the clarification can be submitted. Enabled whenever questions are pending, so the user
   *  can skip optional questions (e.g. "don't answer if … is not wished") without being forced to
   *  type a placeholder — answers given via quick options, voice or the text field are all optional. */
  get clarificationReady(): boolean {
    return this.pendingClarification.length > 0;
  }

  /** Handles manual dismissal of the popup (X / Escape) without answering. */
  onClarificationVisibleChange(visible: boolean): void {
    if (!visible) this.closeClarification();
  }

  /** Called once PrimeNG requests to hide the popup — unmounts it. */
  onClarificationHide(): void {
    this.closeClarification();
  }

  /**
   * Unmounts the popup. It is mounted/unmounted via `@if` (see the template), so a fresh dialog
   * (and its modal mask) is created on every open and fully destroyed on close — the other dialogs
   * stay reachable and the popup reliably reappears on the next run.
   */
  private closeClarification(): void {
    this.clarificationVisible = false;
    // Unregister the popup's drag handler — it is re-registered on every open.
    this.clarificationDragCleanup?.();
    this.clarificationDragCleanup = null;
    // Remove any lingering clarification overlay mask (PrimeNG can leave it behind when the modal
    // is destroyed via @if), which would otherwise keep the background darkened.
    setTimeout(() => this.removeOverlayMask(".cb-ai-clarification-mask"), 0);
    this.cdr.markForCheck();
  }

  /**
   * Submits the clarification answers, hides the popup (animated fade out) and re-runs phase 2 with
   * the accumulated history so the AI can ask again or finally execute.
   */
  submitClarification(): void {
    const ctx = this.phase2Context;
    if (!ctx || !this.clarificationReady) return;
    // Combine all answers into ONE turn: the questions are listed with their number and, when a
    // multiple-choice option was picked, its answer; the single textarea holds the free/voice text.
    // Each question is followed by its available options ("- option" on its own line) so the change
    // log can display them clearly.
    const questionText = this.pendingClarification
      .map((q, i) => {
        const head = `${i + 1}. ${q.question}`;
        const opts = (q.options ?? []).filter((o) => o).map((o) => `- ${o}`);
        return opts.length > 0 ? [head, ...opts].join("\n") : head;
      })
      .join("\n");
    const optionLines = this.pendingClarification
      .map((q, i) => {
        const opts = (this.clarificationOption[q.id] ?? []).filter((o) => (o ?? "").trim().length > 0);
        // Keep only the question number + the chosen answer(s): the question text itself is already
        // shown in the change log's parent question node (and in the AI's "Question:" line), so
        // repeating it here is redundant. The number maps the answer(s) back to its question.
        return opts.length > 0 ? `${i + 1}. ${opts.join(", ")}` : "";
      })
      .filter((s) => s.length > 0);
    const free = (this.clarificationAnswerText ?? "").trim();
    const answer = [...optionLines, free].filter((s) => s.length > 0).join("\n");
    const turns: ClarificationTurn[] = [
      {
        question: questionText,
        answer: answer || "(no answer)",
        ...(this.clarificationFile ? { attachmentName: this.clarificationFile.name } : {}),
      },
    ];
    this.clarificationHistory.push(...turns);
    const file = this.clarificationFile;
    this.clarificationVisible = false;
    setTimeout(() => this.removeOverlayMask(".cb-ai-clarification-mask"), 0);
    this.loading = true;
    this.spinnerText = "Executing\u2026";
    this.cdr.markForCheck();
    void (async () => {
      let extra: Array<{ name: string; dataUrl: string }> = [];
      if (file) {
        try {
          extra = await this.fileToImageParams(file);
        } catch {
          extra = [];
        }
      }
      this.runPhase2(ctx.prompt, ctx.modelId, ctx.intent, [...ctx.imageParams, ...extra], ctx.chatOptions);
    })();
  }

  /** Ctrl+Enter in the clarification textarea submits the answers. */
  onClarificationKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.submitClarification();
    }
  }

  // #endregion Clarification popup
  // #endregion PDF.js helpers

  // #region Form chat popup

  /** Shows a run/chat error in the right surface: an error bubble in the chat popup, or a toast. */
  private failRun(msg: string, chatOptions?: ChatRunOptions): void {
    if (chatOptions?.chatMode) {
      this.chatLoading = false;
      this.chatMessages.push({ role: "assistant", text: `! ${msg}` });
      this.cdr.markForCheck();
    } else {
      this.setError(msg);
    }
  }

  /**
   * Returns a short acknowledgment bubble text for pure instruction chat turns, in the UI language.
   * This keeps the conversation coherent: a later question typed into the form assistant must not
   * appear to be answering this instruction turn.
   */
  private chatAckText(): string {
    // Prefer the plugin's own translation bundle (served through the manager's TranslocoService) so
    // the text matches the Formcycle/plugin UI language exactly. Fall back to the language switch
    // when the manager global is not available yet or the key is missing.
    const key = "codbi.chat.ack";
    try {
      const tr = (
        window as unknown as {
          CodbiPluginData?: { retrieveManagerTranslatedResource?: (id: string) => string };
        }
      )?.CodbiPluginData?.retrieveManagerTranslatedResource;
      if (tr) {
        const value = tr(key);
        if (value && value !== key) return value;
      }
    } catch {
      // ignore lookup errors and fall back to the switch below
    }
    const lang = (window as unknown as { XFC_METADATA?: { currentLanguage?: string } })?.XFC_METADATA?.currentLanguage;
    switch (lang) {
      case "de":
        return "✅ Anweisung ausgeführt.";
      case "it":
        return "✅ Istruzione eseguita.";
      case "nl":
        return "✅ Instructie uitgevoerd.";
      default:
        return "✅ Instruction applied.";
    }
  }

  /** Opens the chat popup, optionally appending an assistant answer to the conversation. */
  openChat(answer?: string): void {
    // Restore the in-session conversation when the component was re-created (e.g. host re-mount),
    // so closing and reopening the chat keeps the bubbles.
    if (this.chatMessages.length === 0) {
      this.restoreChatSession();
    }
    if (answer && answer.trim()) {
      const last = this.chatMessages[this.chatMessages.length - 1];
      if (!(last && last.role === "assistant" && last.text === answer)) {
        this.chatMessages.push({ role: "assistant", text: answer });
      }
    }
    this.chatVisible = true;
    this.chatLoading = false;
    // Register the popup as draggable/snappable like the other CodBi dialogs, and restore its last
    // remembered position once it has rendered.
    this.chatDragCleanup?.();
    this.chatDragCleanup = enableDialogDrag(
      AiAssistant.CHAT_DIALOG_STYLE_CLASS,
      "codbi-dialog-chat-position",
      (p) => (this.chatPosition = p),
    );
    setTimeout(() => applyDialogPosition(AiAssistant.CHAT_DIALOG_STYLE_CLASS, this.chatPosition), 0);
    // When the chat is opened from a prompt question the main assistant dialog closes and the
    // masks are removed right after, which re-renders the chat dialog and can wipe a just-applied
    // saved size/position before it has laid out. Re-apply the saved position once the dialog is
    // actually visible so it is restored even on that late-render path.
    const reapply = (attempt: number): void => {
      const el = document.querySelector(`.${AiAssistant.CHAT_DIALOG_STYLE_CLASS}`) as HTMLElement | null;
      if (el && this.chatVisible) {
        if (!el.classList.contains("p-dialog-maximized")) {
          applyDialogPosition(AiAssistant.CHAT_DIALOG_STYLE_CLASS, this.chatPosition);
        }
        return;
      }
      if (attempt < 10) setTimeout(() => reapply(attempt + 1), 150);
    };
    setTimeout(() => reapply(0), 250);
    // Re-maximize the chat popup when it was closed while maximized.
    this.restoreChatMaximized();
    // Force the chat dialog (and its mask) above the Formcycle designer: the designer's own
    // overlays use very high z-index values and PrimeNG's z-index manager may not assign a high
    // enough one for this dynamically created modal dialog.
    setTimeout(() => {
      const el = document.querySelector(`.${AiAssistant.CHAT_DIALOG_STYLE_CLASS}`) as HTMLElement | null;
      if (el) el.style.zIndex = "2147483000";
      const mask = document.querySelector(".cb-ai-chat-mask") as HTMLElement | null;
      if (mask) mask.style.zIndex = "2147482000";
    }, 0);
    this.scrollChatToBottom();
    this.persistChatSession();
    this.cdr.markForCheck();
  }

  /** Closes the chat popup and unregisters its drag handler. */
  closeChat(): void {
    // Persist the current size/position BEFORE the dialog is removed from the DOM, so closing and
    // reopening keeps the last spot. Dragging already saves via the custom drag coordinator, but a
    // PrimeNG resize — or a close without a preceding drag — would otherwise never reach the store.
    const p = readDialogPosition(AiAssistant.CHAT_DIALOG_STYLE_CLASS);
    if (p) {
      this.chatPosition = p;
      saveDialogPosition("codbi-dialog-chat-position", p);
    }
    this.chatVisible = false;
    // Remember the maximized state so a chat closed while maximized reopens maximized.
    this.persistChatMaximized();
    // Keep the conversation for this session (sessionStorage) so reopening shows the bubbles.
    this.persistChatSession();
    this.chatDragCleanup?.();
    this.chatDragCleanup = null;
    // A chat the user explicitly closed must not reappear on the next reload.
    try {
      localStorage.removeItem(AiAssistant.PENDING_CHAT_KEY);
    } catch {
      // ignore storage errors
    }
    this.cdr.markForCheck();
  }

  /** Persists the chat popup's size/position after the user resized it (PrimeNG `(onResizeEnd)`).
   *  Dragging already persists via the custom drag coordinator; this covers the resize handle so a
   *  resized chat reopens at the same size and spot. */
  onChatResizeEnd(): void {
    const p = readDialogPosition(AiAssistant.CHAT_DIALOG_STYLE_CLASS);
    if (p) {
      this.chatPosition = p;
      saveDialogPosition("codbi-dialog-chat-position", p);
    }
  }

  /** Handles manual dismissal of the chat popup (X / Escape). */
  onChatVisibleChange(visible: boolean): void {
    if (!visible) this.closeChat();
  }

  /**
   * Renders a chat message's text as safe Markdown HTML for the bubble's markdown view (the
   * default). Results are memoized per text, so re-renders (e.g. toggling another bubble) do not
   * re-parse unchanged messages.
   */
  markdownHtml(text: string): string {
    const cached = this.markdownCache.get(text);
    if (cached !== undefined) return cached;
    const html = markdownToHtml(text);
    // Bound the cache so a very long chat session cannot grow it unboundedly.
    if (this.markdownCache.size >= 200) this.markdownCache.clear();
    this.markdownCache.set(text, html);
    return html;
  }

  /**
   * Toggles one chat bubble between the rendered Markdown view (default) and the raw plain-text
   * view. The choice is stored on the message itself, so it survives reopening the chat.
   */
  toggleChatMessageView(index: number): void {
    const msg = this.chatMessages[index];
    if (!msg) return;
    msg.view = msg.view === "plain" ? "markdown" : "plain";
    this.cdr.markForCheck();
  }

  /**
   * Copies a chat message's text to the clipboard and briefly shows a "copied" state on its button.
   * Falls back to the legacy execCommand path when the async Clipboard API is unavailable.
   */
  copyChatMessage(text: string, index: number): void {
    const done = (): void => {
      this.copiedChatIndex = index;
      this.cdr.markForCheck();
      setTimeout(() => {
        if (this.copiedChatIndex === index) {
          this.copiedChatIndex = -1;
          this.cdr.markForCheck();
        }
      }, 1600);
    };
    const fallback = (): void => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        done();
      } catch {
        window.prompt("Copy message", text);
      }
    };
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else {
      fallback();
    }
  }

  /**
   * Handles Arrow Up in the chat input: when the caret is on the first line, browse the previously
   * sent prompts (shell-style history). When the caret is not on the first line the default
   * "move to the previous line" behavior is left untouched.
   */
  onChatArrowUp(event: Event): void {
    const e = event as KeyboardEvent;
    const input = this.chatInput ?? "";
    const caret = (e.target as HTMLTextAreaElement | null)?.selectionStart ?? input.length;
    if (input.slice(0, caret).includes("\n")) return;
    e.preventDefault();
    this.navigateChatHistory(1);
  }

  /** Handles Arrow Down in the chat input: browses forward through the prompt history when the
   *  caret is on the last line (otherwise the caret simply moves to the next line). */
  onChatArrowDown(event: Event): void {
    const e = event as KeyboardEvent;
    const input = this.chatInput ?? "";
    const caret = (e.target as HTMLTextAreaElement | null)?.selectionStart ?? input.length;
    if (input.slice(caret).includes("\n")) return;
    e.preventDefault();
    this.navigateChatHistory(-1);
  }

  /** Previously sent chat prompts, newest first — the entries recalled with Arrow Up. */
  private chatPromptHistory(): string[] {
    return this.chatMessages
      .filter((m) => m.role === "user")
      .map((m) => m.text)
      .reverse();
  }

  /**
   * Moves through the sent-prompt history. `delta` is +1 for Arrow Up (towards older prompts) and
   * -1 for Arrow Down (towards newer prompts / back to the draft). Browsing starts from the text
   * currently typed in the input, which is restored again once the user arrows past the newest
   * prompt.
   */
  private navigateChatHistory(delta: number): void {
    const history = this.chatPromptHistory();
    if (history.length === 0) return;
    // Remember the typed text when history browsing starts, so Arrow Down can bring it back.
    if (this.chatHistoryIndex === -1) {
      this.chatDraft = this.chatInput ?? "";
    }
    let next = this.chatHistoryIndex + delta;
    if (next > history.length - 1) next = history.length - 1;
    if (next < -1) next = -1;
    this.chatHistoryIndex = next;
    this.chatInput = next === -1 ? this.chatDraft : history[next];
    this.cdr.markForCheck();
  }

  /** Sends the current chat input as a new chat turn (question or instruction). */
  sendChatMessage(): void {
    const text = (this.chatInput ?? "").trim();
    if (!text || this.chatLoading) return;
    const history = this.chatHistoryPayload();
    this.chatInput = "";
    // A newly sent prompt is the newest history entry — reset the browsing position to the draft.
    this.chatHistoryIndex = -1;
    this.chatDraft = "";
    this.chatMessages.push({ role: "user", text });
    this.persistChatSession();
    this.chatLoading = true;
    this.scrollChatToBottom();
    this.cdr.markForCheck();
    this.runChatTurn(text, history);
  }

  /** Builds the completed user/assistant turn pairs of the current conversation. */
  private chatHistoryPayload(): Array<{ user: string; assistant: string }> {
    const turns: Array<{ user: string; assistant: string }> = [];
    const msgs = this.chatMessages;
    for (let i = 0; i < msgs.length; i++) {
      if (msgs[i].role !== "user") continue;
      const assistant = msgs[i + 1]?.role === "assistant" ? msgs[i + 1].text : "";
      turns.push({ user: msgs[i].text, assistant });
      i++; // the next message is this turn's assistant reply
    }
    return turns;
  }

  /**
   * Runs a chat turn as a normal phase-2 run flagged with chatMode + chatHistory. The backend
   * decides whether the message is answer-only or also contains instructions (which then modify the
   * form/workflow exactly like a regular prompt). The response is handled by the shared phase-2
   * handler (form apply / workflow reload / clarification / chat answer).
   */
  private runChatTurn(message: string, history: Array<{ user: string; assistant: string }>): void {
    const modelId = this.selectedModel;
    if (!modelId) {
      // After a workflow-triggered reload the models may not be loaded yet (the assistant dialog
      // was never opened). Load them first, then re-run the turn once a model is available.
      const retry = (): void => {
        if (this.selectedModel) {
          this.runChatTurn(message, history);
        } else {
          this.failRun("No AI model selected.", { chatMode: true, chatHistory: [] });
        }
      };
      this.ensureModelLoaded(retry);
      return;
    }
    this.runPhase2(message, modelId, "both", [], { chatMode: true, chatHistory: history });
  }

  /** Persists the chat conversation so the chat popup re-opens after a workflow-triggered reload.
   *  Only persists while the chat is actually open — a chat the user closed must NOT reappear on
   *  the next reload. */
  private persistPendingChat(): void {
    if (this.chatMessages.length === 0) return;
    if (!this.chatVisible) return;
    try {
      localStorage.setItem(
        AiAssistant.PENDING_CHAT_KEY,
        JSON.stringify({
          messages: this.chatMessages,
          clarificationHistory: this.clarificationHistory,
        }),
      );
    } catch {
      // ignore storage errors
    }
  }

  /** Persists the current chat conversation to sessionStorage (tab session only, no DB). Runs even
   *  when the chat is closed, so closing and reopening keeps the bubbles. */
  private persistChatSession(): void {
    if (this.chatMessages.length === 0) return;
    try {
      sessionStorage.setItem(
        AiAssistant.CHAT_SESSION_KEY,
        JSON.stringify({
          messages: this.chatMessages,
          clarificationHistory: this.clarificationHistory,
        }),
      );
    } catch {
      // ignore storage errors
    }
  }

  /** Restores the in-session chat conversation from sessionStorage. Returns true when messages were
   *  restored (used on open when the component was re-created). */
  private restoreChatSession(): boolean {
    try {
      const raw = sessionStorage.getItem(AiAssistant.CHAT_SESSION_KEY);
      if (!raw) return false;
      const parsed: unknown = JSON.parse(raw);
      const obj = parsed as { messages?: unknown; clarificationHistory?: unknown } | null;
      const messages = Array.isArray(obj?.messages)
        ? (obj.messages as Array<{ role?: unknown; text?: unknown }>)
            .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
            .map((m) => ({ role: m.role as "user" | "assistant", text: m.text as string }))
        : [];
      if (messages.length === 0) return false;
      this.chatMessages = messages;
      if (Array.isArray(obj?.clarificationHistory)) {
        this.clarificationHistory = obj.clarificationHistory;
      }
      return true;
    } catch {
      return false;
    }
  }

  /** Restores a persisted chat conversation (from a workflow-triggered reload) and re-opens the popup. */
  private restorePendingChat(): void {
    try {
      const raw = localStorage.getItem(AiAssistant.PENDING_CHAT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        messages?: Array<{ role: "user" | "assistant"; text: string }>;
        clarificationHistory?: Array<ClarificationTurn>;
      };
      if (!Array.isArray(parsed?.messages) || parsed.messages.length === 0) return;
      const messages = parsed.messages.filter(
        (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string",
      );
      if (messages.length === 0) return;
      this.chatMessages = messages;
      // Also restore the clarification answers (e.g. email sender/subject) so a new instruction
      // after a reload does not re-ask questions that were already answered.
      if (Array.isArray(parsed.clarificationHistory)) {
        this.clarificationHistory = parsed.clarificationHistory.filter(
          (t) => t && typeof t.question === "string" && typeof t.answer === "string",
        );
      }
      // Keep the pending key until the chat dialog has actually been rendered — if the component is
      // (re)created or the view renders late, a later attempt must still be able to restore it.
      // Once on screen, the key is cleared so a normal next page load does not re-open a stale chat.
      let attempts = 0;
      const tryOpen = (): void => {
        attempts++;
        this.openChat();
        const el = document.querySelector(`.${AiAssistant.CHAT_DIALOG_STYLE_CLASS}`) as HTMLElement | null;
        if (el && this.chatVisible) {
          try {
            localStorage.removeItem(AiAssistant.PENDING_CHAT_KEY);
          } catch {
            // ignore storage errors
          }
          return;
        }
        if (attempts < 10) setTimeout(tryOpen, 150);
      };
      setTimeout(tryOpen, 0);
    } catch {
      // ignore malformed payload
    }
  }

  /** Scrolls the chat message list to the newest message. */
  private scrollChatToBottom(): void {
    setTimeout(() => {
      const el = document.querySelector(".cb-ai-chat-dialog .cb-ai-chat-messages") as HTMLElement | null;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }

  // #endregion Form chat popup

  // #region Run (phase 1 + phase 2)
  /** Ctrl+Enter in the prompt textarea submits the request. */
  onPromptKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void this.run();
    }
  }

  async run(): Promise<void> {
    if (!this.dbAvailable) {
      this.setError("Database not available — AI prompts cannot be loaded.");
      return;
    }
    const modelId = this.selectedModel;
    const prompt = this.promptText.trim();

    if (!prompt || !modelId) {
      return;
    }

    // Reset multi-round clarification state for a fresh run.
    this.clarificationHistory = [];
    this.clarificationVisible = false;
    setTimeout(() => this.removeOverlayMask(".cb-ai-clarification-mask"), 0);
    this.phase2Context = null;
    this.loading = true;
    this.spinnerText = "Classifying request\u2026";
    this.resultText = null;
    this.errorText = null;
    this.cdr.markForCheck();

    // Convert attached file to codbi-base64 params (PDF → per-page PNG images via PDF.js;
    // images → single data URL). This matches the ai.llama.standard.qa pattern and works with
    // ImageProcessingService on the backend — no Jetty URL-encoded size limit issues.
    const imageParams = await this.buildImageParams();

    // Ensure the element catalog is loaded so the phase-1 (intent classification) AND phase-2
    // requests both carry the allowed widget/node/trigger lists — otherwise the "Nicht installierte
    // Elemente erstellen" filter would be inactive and non-installed elements would leak through.
    await this.ensureElementsLoaded();

    const phase1Data: Record<string, string> = {
      prompt,
      useCodbi: String(this.useCodbi),
      askAllQuestions: String(this.askAllQuestions),
      useBuergerserviceNaming: String(this.useBuergerserviceNaming),
    };
    this.appendAllowedElements(phase1Data);
    const phase1Form = new FormData();
    for (const [key, value] of Object.entries(phase1Data)) {
      phase1Form.append(key, value);
    }
    for (const { name, dataUrl } of imageParams) {
      phase1Form.append(`codbi-base64:${name}`, dataUrl);
    }

    getJQuery().ajax({
      url: `${this.baseUrl}plugin?name=CodBi_AICodBiAssistant`,
      type: "POST",
      headers: { "X-Action": "Run", "X-Model": modelId },
      data: phase1Form,
      processData: false,
      contentType: false,
      dataType: "json",
      success: (phase1Response: unknown) => {
        const p1 = phase1Response as Record<string, unknown> | null;

        if (!p1 || typeof p1 !== "object") {
          this.setError("Unexpected response from server.");
          return;
        }

        if ("error" in p1) {
          this.setError(String(p1["error"]));
          return;
        }

        if (p1["status"] !== "need_data" || typeof p1["intent"] !== "string") {
          this.setError("Unexpected phase 1 response format.");
          return;
        }

        const intent = p1["intent"] as "form" | "workflow" | "both";

        // Count the intent-classification inference in the token counter as well.
        const classTokens = typeof p1["tokens"] === "number" ? p1["tokens"] : 0;
        if (classTokens > 0) {
          this.lastTokens = classTokens;
          this.sessionTokens += classTokens;
        }
        // Count the cost of the classification inference (currency included when a price is set).
        const classCost = typeof p1["cost"] === "number" ? p1["cost"] : 0;
        if (classCost > 0) {
          this.lastCost = classCost;
          this.addSessionCost(String(p1["currency"] ?? ""), classCost);
        }
        if (typeof p1["currency"] === "string" && p1["currency"]) {
          this.lastCurrency = p1["currency"] as string;
        }

        this.spinnerText = "Collecting context\u2026";
        this.cdr.markForCheck();
        this.runPhase2(prompt, modelId, intent, imageParams);
      },
      error: (xhr: unknown) => {
        const jq = xhr as { responseJSON?: { error?: string }; statusText?: string };
        this.setError(jq.responseJSON?.error ?? jq.statusText ?? "Request failed.");
      },
    });
  }

  /** Accumulates [cost] into the session total for the given [currency]. */
  private addSessionCost(currency: string, cost: number): void {
    if (!currency || cost <= 0) return;
    this.sessionCostByCurrency.set(currency, (this.sessionCostByCurrency.get(currency) ?? 0) + cost);
  }

  /** Cost of the most recent run, formatted with its currency (e.g. "EUR 0.0005"). Empty when zero or no currency. */
  get lastCostLabel(): string {
    if (!this.lastCost || !this.lastCurrency) return "";
    return `${this.lastCurrency} ${this.lastCost.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`;
  }

  /** Accumulated session cost (grouped per currency), formatted for display. */
  get sessionCostLabel(): string {
    if (this.sessionCostByCurrency.size === 0) return "";
    return [...this.sessionCostByCurrency.entries()]
      .map(
        ([currency, cost]) =>
          `${currency} ${cost.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`,
      )
      .join(" \u00B7 ");
  }

  private runPhase2(
    prompt: string,
    modelId: string,
    intent: "form" | "workflow" | "both",
    imageParams: Array<{ name: string; dataUrl: string }> = [],
    chatOptions?: ChatRunOptions,
  ): void {
    // Remember the context so a clarification round can re-run phase 2 with the same inputs.
    this.phase2Context = { prompt, modelId, intent, imageParams, ...(chatOptions ? { chatOptions } : {}) };
    const designer = getDesignerInstance();
    const data: Record<string, string> = {
      prompt,
      phase: "2",
      intent,
      useCodbi: String(this.useCodbi),
      askAllQuestions: String(this.askAllQuestions),
      useBuergerserviceNaming: String(this.useBuergerserviceNaming),
      // Formcycle UI language, so the backend can localize stored change-log text (e.g. the
      // "earlier chat turns" context label) to match the UI.
      lang: (window as unknown as { XFC_METADATA?: { currentLanguage?: string } })?.XFC_METADATA?.currentLanguage ?? "",
    };
    // The checked Formcycle elements (widgets / nodes / triggers) that may be transmitted to the
    // AI, when the user has configured them via the element picker.
    this.appendAllowedElements(data);
    // Chat popup turns are sent as a normal phase-2 run flagged with chatMode + the conversation
    // history; the backend decides whether to answer only or also execute instructions.
    if (chatOptions?.chatMode) {
      data["chatMode"] = "true";
      data["chatHistory"] = JSON.stringify(chatOptions.chatHistory ?? []);
    }
    // Send the accumulated clarifying questions/answers so the AI keeps the full conversation.
    if (this.clarificationHistory.length > 0) {
      data["clarificationHistory"] = JSON.stringify(this.clarificationHistory);
    }
    // Scope the change log to the form that is currently being edited.
    const formKey = getCurrentFormKey();
    if (formKey) {
      data["formKey"] = formKey;
    }

    // Collect form persist JSON (needed for form and both)
    if (intent === "form" || intent === "both") {
      const persistWrapper = designer?.getPersist?.() as unknown as Record<string, unknown> | undefined;
      const innerJson =
        typeof persistWrapper?.["persist"] === "string"
          ? (persistWrapper["persist"] as string)
          : persistWrapper
            ? JSON.stringify(persistWrapper)
            : null;

      if (!innerJson) {
        this.setError("Designer is not available or has no form data.");
        return;
      }
      data["persist"] = innerJson;
      // Read current CodBi standards from the MultiSelect editor DOM or fallback to form property model.
      const standardsContainer = document.getElementById("CodBi_Standardslisting");
      const storedStandards = designer?.getFormPropertyValueForCurrentLang("codbi-prop-standards");
      const fallbackStandards = typeof storedStandards === "string" ? storedStandards : "";
      if (standardsContainer) {
        // DOM is available: read the actual checkbox state.
        data["currentStandards"] = Array.from(
          standardsContainer.querySelectorAll<HTMLInputElement>("input[type=checkbox]:checked"),
        )
          .map((cb) => cb.value)
          .join(",");
      } else {
        // DOM absent: read from the form property model directly.
        data["currentStandards"] = fallbackStandards;
      }
      // Tell the backend what the AI set on its last run so it can detect user overrides.
      // Omitted when null (first-run mode) — backend then treats all Cleave configs as AI-controlled.
      if (this.prevAiStandards !== null) {
        data["aiSetStandards"] = this.prevAiStandards;
      }
    }

    // Collect form elements + workflowVersionId (needed for workflow and both)
    if (intent === "workflow" || intent === "both") {
      const workflowVersionId =
        (designer as unknown as Record<string, unknown>)?.["config"] != null
          ? (designer as unknown as Record<string, Record<string, unknown>>)["config"]["workflowVersionId"]
          : undefined;

      if (!workflowVersionId) {
        this.setError("Could not determine the workflow version ID. Make sure a workflow is configured for this form.");
        return;
      }
      data["workflowVersionId"] = String(workflowVersionId);

      try {
        const persistWrapper = designer?.getPersist?.() as unknown as Record<string, unknown> | undefined;
        const innerJson =
          typeof persistWrapper?.["persist"] === "string"
            ? (persistWrapper["persist"] as string)
            : persistWrapper
              ? JSON.stringify(persistWrapper)
              : null;

        if (innerJson) {
          const formJson = JSON.parse(innerJson) as { items?: Array<Record<string, unknown>> };
          data["formElements"] = JSON.stringify(this.extractFormElements(formJson.items ?? []));
          // Also send the full persist so the backend can derive the repeatable-container structure
          // (which fields belong to a dynamic container) and pass it to the workflow AI.
          data["persist"] = innerJson;
        }
      } catch {
        // formElements will be absent; backend will proceed without them
      }
    }

    this.spinnerText = "Executing\u2026";
    this.cdr.markForCheck();

    // Build FormData with codbi-base64 image params (already processed by buildImageParams)
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value);
    }
    for (const { name, dataUrl } of imageParams) {
      formData.append(`codbi-base64:${name}`, dataUrl);
    }

    getJQuery().ajax({
      url: `${this.baseUrl}plugin?name=CodBi_AICodBiAssistant`,
      type: "POST",
      headers: { "X-Action": "Run", "X-Model": modelId },
      data: formData,
      processData: false,
      contentType: false,
      dataType: "json",
      success: (phase2Response: unknown) => {
        this.loading = false;
        if (chatOptions?.chatMode) {
          this.chatLoading = false;
        }
        const p2 = phase2Response as Record<string, unknown> | null;

        if (!p2 || typeof p2 !== "object") {
          this.failRun("Unexpected response from server.", chatOptions);
          return;
        }

        if ("error" in p2) {
          this.failRun(String(p2["error"]), chatOptions);
          return;
        }

        // The AI needs more information from the user — show the clarification popup and stop.
        // The popup collects the answers and re-runs phase 2 (multi-round) until the AI proceeds.
        if (p2["clarification"] != null) {
          const clar = p2["clarification"] as Record<string, unknown>;
          const rawQuestions = Array.isArray(clar["questions"])
            ? (clar["questions"] as Array<Record<string, unknown>>)
            : [];
          this.openClarification(
            rawQuestions.map((q, i) => ({
              id: String(q["id"] ?? `q${i + 1}`),
              question: String(q["question"] ?? ""),
              options: Array.isArray(q["options"]) ? (q["options"] as string[]).map(String) : [],
              allowFreeText: q["allowFreeText"] !== false,
              multiSelect: q["multiSelect"] === true,
            })),
          );
          return;
        }

        // Sensitive CodBi elements (AI_Log_SensitiveElements) that were used by this inference.
        // The change log is opened automatically with them highlighted.
        //  - Form-only run: no page reload — the log is opened directly via the event below.
        //  - Workflow / both run: the designer reloads the page (to store the workflow). The
        //    sensitive elements are persisted to sessionStorage inside doReload() / the
        //    workflow-only reload path, immediately before window.location.reload(), so no
        //    intermediate async rendering (loadPersistJson / MultiSelect reconstruction) can consume
        //    them. After the reload the change-log component reopens the log with them highlighted.
        const sensitive = Array.isArray(p2["sensitiveElements"])
          ? (p2["sensitiveElements"] as string[]).filter((e) => typeof e === "string" && e.length > 0)
          : [];
        // Destructive SQL statements blocked by the backend sanitizer. When present, the change log
        // is auto-opened with an error icon (same popup mechanism as sensitive elements).
        const blockedSql = Array.isArray(p2["blockedSqlElements"])
          ? (p2["blockedSqlElements"] as string[]).filter((e) => typeof e === "string" && e.length > 0)
          : [];
        const hasWorkflowReload =
          typeof p2["workflowMessage"] === "string" && (p2["workflowMessage"] as string).length > 0;
        // Form-only run (no page reload) with sensitive elements: the change-log side panel is
        // unfolded (automatic popup) inside the form-only branch below, AFTER the form changes have
        // been applied and the assistant has been closed — otherwise the close would hide it.

        const hasFormJson = "formJson" in p2 && p2["formJson"] != null;
        const hasWorkflowMessage = "workflowMessage" in p2 && typeof p2["workflowMessage"] === "string";

        // Update the token counter from the backend's estimated token count for this run.
        // lastTokens accumulates (classification + form passes) so it reflects the whole Run,
        // while sessionTokens accumulates across runs for the page session.
        const tokens = typeof p2["tokens"] === "number" ? p2["tokens"] : 0;
        if (tokens > 0) {
          this.lastTokens += tokens;
          this.sessionTokens += tokens;
        }
        // Update the cost counter the same way (input+output tokens × configured price).
        const runCost = typeof p2["cost"] === "number" ? p2["cost"] : 0;
        if (runCost > 0) {
          this.lastCost += runCost;
          this.addSessionCost(String(p2["currency"] ?? ""), runCost);
        }
        if (typeof p2["currency"] === "string" && p2["currency"]) {
          this.lastCurrency = p2["currency"] as string;
        }

        // Form chat: if the prompt contained a question, open the chat popup with the AI's answer.
        // This runs for ALL branches — the popup stays open while the form changes are applied, or
        // the conversation is persisted and the popup re-opens after a workflow-triggered reload.
        const chatAnswer = typeof p2["chatAnswer"] === "string" ? (p2["chatAnswer"] as string) : null;
        const hasChat = chatAnswer !== null && chatAnswer.trim().length > 0;
        if (hasChat) {
          // A question typed into the FORM ASSISTANT prompt (non-chat mode) must appear as a user
          // bubble in the chat conversation, otherwise the answer seems to reply to the previous
          // chat message. In chat mode the user bubble was already pushed by sendChatMessage().
          if (!chatOptions?.chatMode) {
            const currentPrompt = (this.promptText ?? "").trim();
            const lastMsg = this.chatMessages[this.chatMessages.length - 1];
            if (currentPrompt && !(lastMsg && lastMsg.role === "user" && lastMsg.text === currentPrompt)) {
              this.chatMessages.push({ role: "user", text: currentPrompt });
            }
          }
          this.openChat(chatAnswer as string);
        } else if (chatOptions?.chatMode) {
          // A pure instruction chat turn gets an acknowledgment bubble so the conversation stays
          // coherent (see chatAckText). This bubble is also persisted across workflow reloads.
          this.chatMessages.push({ role: "assistant", text: this.chatAckText() });
          this.persistChatSession();
          this.cdr.markForCheck();
        }

        // Apply form changes if present
        if (hasFormJson) {
          try {
            const d = designer as unknown as Record<string, unknown>;
            // Embed standards into the form JSON before loading so FORMCYCLE parses
            // codbi-prop-standards as part of the form from the start, avoiding any
            // post-load patching race where formI18n gets overwritten before publish().
            const formJsonToLoad = p2["formJson"] as Record<string, unknown>;
            if (typeof p2["standards"] === "string") {
              const lang: string = d["getFormEditLanguage"] ? (d["getFormEditLanguage"] as () => string)() : "default";
              const existingI18n =
                (formJsonToLoad["formI18n"] as Record<string, Record<string, unknown>> | undefined) ?? {};
              existingI18n[lang] = existingI18n[lang] ?? {};
              existingI18n[lang]["codbi-prop-standards"] = p2["standards"];
              formJsonToLoad["formI18n"] = existingI18n;
            }
            // Preserve the "CodBi" enable checkbox across the inference-driven form load.
            // Formcycle reads form properties (codbi-prop-enable) from formI18n[lang] for the
            // current edit language, but the AI's returned form JSON carries the value at the top
            // level. Copy it into formI18n[lang] so the checkbox stays checked after the load
            // (mirrors the codbi-prop-standards handling above).
            {
              const lang: string = d["getFormEditLanguage"] ? (d["getFormEditLanguage"] as () => string)() : "default";
              const existingI18n =
                (formJsonToLoad["formI18n"] as Record<string, Record<string, unknown>> | undefined) ?? {};
              existingI18n[lang] = existingI18n[lang] ?? {};
              let topEnable = formJsonToLoad["codbi-prop-enable"];
              // If the AI's returned form JSON does not carry codbi-prop-enable (models usually only
              // echo the form items), PRESERVE the currently enabled value instead of defaulting to
              // "0" — otherwise every inference-driven form load (which does not reload the page)
              // would uncheck the "CodBi" checkbox, making isCodBiEnabled() return false so that the
              // ALT+A hotkey stops opening the assistant.
              if (topEnable === undefined || topEnable === null) {
                const currentEnable =
                  typeof d["getFormPropertyValueForCurrentLang"] === "function"
                    ? (d["getFormPropertyValueForCurrentLang"] as (name: string) => unknown).call(
                        designer,
                        "codbi-prop-enable",
                      )
                    : undefined;
                topEnable = currentEnable === undefined || currentEnable === null ? "0" : currentEnable;
              }
              // Normalize to the canonical truthy "1" / falsy "0" so every downstream read
              // (enableValue below, isCodBiEnabled) sees the same value.
              topEnable = topEnable === "1" || topEnable === 1 || topEnable === true ? "1" : String(topEnable);
              existingI18n[lang]["codbi-prop-enable"] = topEnable;
              // Also write it to the top level so all subsequent reads in this handler see it.
              formJsonToLoad["codbi-prop-enable"] = topEnable;
              formJsonToLoad["formI18n"] = existingI18n;
            }
            if (typeof d["loadPersistJson"] === "function") {
              (d["loadPersistJson"] as (...args: unknown[]) => void).call(designer, formJsonToLoad);
            } else if (typeof d["loadPersist"] === "function") {
              (d["loadPersist"] as (...args: unknown[]) => void).call(
                designer,
                JSON.stringify(formJsonToLoad),
                "ai-form.json",
                false,
              );
            } else {
              throw new Error("Neither loadPersistJson nor loadPersist is available on the designer instance.");
            }
            // Notify the workflow UI that the form changed so its trigger button dropdown
            // refreshes immediately (same event the designer fires on manual property edits).
            Callbacks["persist-changed"].fire();
            // Patch the LIVE designer model so Formcycle reads the "CodBi" enable checkbox
            // correctly after the inference-driven form load. loadPersistJson drops the
            // top-level codbi-prop-enable from the live model; getFormPropertyValueForCurrentLang
            // reads the form property from there (and formI18n[lang]). Write BOTH locations and
            // also flip the visible CheckboxEditor input directly (it may already be rendered
            // unchecked).
            {
              const livePersist = designer.getPersist?.() as unknown as Record<string, unknown> | undefined;
              const liveLang = designer.getFormEditLanguage?.();
              const topEnable = formJsonToLoad["codbi-prop-enable"];
              const enableValue = topEnable === undefined || topEnable === null ? "0" : topEnable;
              if (livePersist != null) {
                livePersist["codbi-prop-enable"] = enableValue;
              }
              if (livePersist?.["formI18n"] != null && liveLang != null) {
                const liveI18n = livePersist["formI18n"] as Record<string, Record<string, unknown>>;
                liveI18n[liveLang] = liveI18n[liveLang] ?? {};
                liveI18n[liveLang]["codbi-prop-enable"] = enableValue;
              }
              setTimeout(() => {
                const cb = document.querySelector("#form-codbi-prop-enable-input") as HTMLInputElement | null;
                if (cb) {
                  const shouldCheck = enableValue === "1" || enableValue === 1 || enableValue === true;
                  if (cb.checked !== shouldCheck) {
                    cb.checked = shouldCheck;
                    cb.dispatchEvent(new Event("change", { bubbles: true }));
                  }
                }
              }, 400);
            }
            setTimeout(() => {
              const dg = getDesignerInstance();
              let readBack: unknown = "n/a";
              try {
                const api = (dg as unknown as Record<string, unknown> | null)?.["getFormPropertyValueForCurrentLang"];
                readBack =
                  typeof api === "function"
                    ? (api as (...args: unknown[]) => unknown).call(dg, "codbi-prop-enable")
                    : "no-api";
              } catch (err) {
                readBack = "err:" + String(err);
              }
              const lp = getDesignerInstance()?.getPersist?.() as unknown as Record<string, unknown> | undefined;
              const ll = getDesignerInstance()?.getFormEditLanguage?.();
              const liveI18n = (lp?.["formI18n"] as Record<string, Record<string, unknown>> | undefined)?.[
                String(ll ?? "default")
              ];
            }, 900);
            // Apply updated CodBi standard configurations if returned by the backend
            if (typeof p2["standards"] === "string") {
              const newStandards = p2["standards"] as string;
              const cpd = (window as any).CodbiPluginData as typeof window.CodbiPluginData | undefined;

              // ALWAYS patch formI18n directly first — this is the most reliable path because
              // getPersist() returns the live model object. Regardless of panel state or whether
              // setStandardsValue points to a stale instance, this ensures the value is serialised
              // when FORMCYCLE saves the form (publish / auto-save / Ctrl+S).
              {
                const persist = designer.getPersist?.();
                const lang = designer.getFormEditLanguage?.();
                if (persist?.formI18n != null && lang != null) {
                  (persist.formI18n[lang] as Record<string, unknown>) ??= {};
                  (persist.formI18n[lang] as Record<string, unknown>)["codbi-prop-standards"] = newStandards;
                }
              }

              if (typeof cpd?.setStandardsValue === "function") {
                // MultiSelect is live — also update its UI checkboxes immediately.
                cpd.setStandardsValue(newStandards);
              } else {
                // MultiSelect not yet instantiated — fire set-property as a best-effort signal
                // (may be ignored if FORMCYCLE's handler doesn't find a live editor).
                const jq = getJQuery();
                const fakeEditor = {
                  config: {
                    property: "codbi-prop-standards",
                    base: jq(),
                    id: "codbi-ai-standards-editor",
                    designer,
                  },
                  className: "MultiSelect",
                  property: "codbi-prop-standards",
                  getPropertyType: () => "form",
                  getPropertyRow: () => jq(),
                  getPanelBox: () => jq(),
                  getEditorPanel: () => jq(),
                  getElement: () => jq(),
                  getValue: () => newStandards,
                  setValue: (_v: unknown) => undefined,
                  setValueTo: (_v: unknown) => undefined,
                  hide: () => undefined,
                  show: () => undefined,
                } as any;
                Callbacks["set-property"].fire("codbi-prop-standards", newStandards, fakeEditor);
              }

              // Always record as pending so any upcoming reload (our doReload, FORMCYCLE's
              // publish-reload, or beforeunload) can restore the value via sessionStorage.
              // Use localStorage so the value survives the designer being closed and reopened.
              if (cpd) cpd.pendingStandards = newStandards;
              localStorage.setItem("codbi-pending-standards", newStandards);
              // Remember what AI set so the next run can detect user overrides.
              this.prevAiStandards = newStandards;
            }
          } catch (err) {
            this.setError(err instanceof Error ? err.message : "Failed to apply form changes.");
            return;
          }
        }

        if (hasFormJson && hasWorkflowMessage) {
          // Both: publish the form to the server so the new button is persisted, then reload.
          // This makes the workflow trigger immediately valid without any manual steps.
          // NOTE: designer.save() downloads a local file — designer.publish() saves to the server.
          // loadPersistJson() is synchronous but triggers async internal rendering; poll _isLoading
          // before calling publish() to avoid the "please wait until loading is finished" warning.
          this.resultText = `Workflow created: ${String(p2["workflowMessage"])} Saving form and reloading designer\u2026`;
          this.showToast(this.resultText, "success");
          // Keep the dialog busy (inputs/buttons disabled) until the reload happens, so the user
          // cannot click on it while the form is being saved/reloaded.
          this.loading = true;
          this.spinnerText = "Reloading designer\u2026";
          const dSave = designer as unknown as Record<string, unknown>;
          // Capture the AI-computed standards value now, before anything can consume it.
          // We do NOT write sessionStorage here — an earlier write may be consumed by a
          // MultiSelect reconstruction that loadPersistJson's async rendering triggers.
          // Instead, write sessionStorage inside doReload(), right before window.location.reload().
          const standardsForReload = typeof p2["standards"] === "string" ? (p2["standards"] as string) : undefined;
          const doReload = (): void => {
            // Write pending standards at the very last moment — after publish() completes and
            // immediately before the page unloads — so the value cannot be consumed by any
            // MultiSelect reconstruction that happened during async rendering.
            // Use localStorage so the value survives the designer being closed and reopened.
            if (typeof standardsForReload === "string") {
              localStorage.setItem("codbi-pending-standards", standardsForReload);
            }
            // Persist the sensitive elements (AI_Log_SensitiveElements) used by this run at the very
            // last moment as well, so they survive the reload and the change-log component reopens
            // with them highlighted after the page reload. localStorage (same as the standards
            // value) so it survives any reload/navigation.
            if (sensitive.length > 0) {
              localStorage.setItem("codbi-log-sensitive-elements", JSON.stringify(sensitive));
            }
            if (blockedSql.length > 0) {
              localStorage.setItem(AiAssistant.BLOCKED_SQL_STORAGE_KEY, JSON.stringify(blockedSql));
            }
            // Persist the chat conversation so the chat popup re-opens after the reload.
            this.persistPendingChat();
            window.location.reload();
          };
          const waitUntilReady = (): Promise<void> =>
            new Promise<void>((resolve) => {
              const maxWait = 10_000;
              const start = Date.now();
              const poll = (): void => {
                if (!dSave["_isLoading"] || Date.now() - start >= maxWait) {
                  resolve();
                } else {
                  setTimeout(poll, 100);
                }
              };
              poll();
            });
          if (typeof dSave["publish"] === "function") {
            waitUntilReady()
              .then(() => {
                // loadPersistJson triggers async internal rendering that can reset formI18n
                // after our synchronous patch above. By the time waitUntilReady() resolves
                // (_isLoading is false), rendering is done and the model is stable — so we
                // re-apply the formI18n patch HERE, right before publish(), to ensure it is
                // actually serialised to the server.
                if (typeof p2["standards"] === "string") {
                  const stdVal = p2["standards"] as string;
                  const lang2 = designer.getFormEditLanguage?.() ?? "default";
                  // Patch 1: update the live formI18n object (for publish() implementations
                  // that read from the live model rather than the cached persist string).
                  const persist2 = designer.getPersist?.() as unknown as Record<string, unknown> | undefined;
                  if (persist2?.["formI18n"] != null) {
                    const i18n = persist2["formI18n"] as Record<string, Record<string, unknown>>;
                    i18n[lang2] = i18n[lang2] ?? {};
                    i18n[lang2]["codbi-prop-standards"] = stdVal;
                  }
                  // Patch 2: update persist.persist (the cached serialised JSON string).
                  // publish() reads directly from this string when serialising the form to
                  // the server — patching the live formI18n object alone is not enough.
                  if (persist2 != null && typeof persist2["persist"] === "string") {
                    try {
                      const parsed = JSON.parse(persist2["persist"] as string) as Record<string, unknown>;
                      const pI18n = (parsed["formI18n"] as Record<string, Record<string, unknown>> | undefined) ?? {};
                      pI18n[lang2] = pI18n[lang2] ?? {};
                      pI18n[lang2]["codbi-prop-standards"] = stdVal;
                      parsed["formI18n"] = pI18n;
                      persist2["persist"] = JSON.stringify(parsed);
                    } catch {
                      // Ignore parse errors — fall back to the live-object patch above.
                    }
                  }
                  // Patch 3: push the value through the live editor so FORMCYCLE's
                  // set-property handler also updates its internal state (updates checkboxes
                  // + fires Callbacks so any debounced serialisation also picks up fullCSV).
                  const cpd2 = (window as any).CodbiPluginData as typeof window.CodbiPluginData | undefined;
                  if (typeof cpd2?.setStandardsValue === "function") {
                    cpd2.setStandardsValue(stdVal);
                  }
                }
                return (dSave["publish"] as () => Promise<void>).call(designer);
              })
              // Delay the reload (same as the workflow-only branch) so the workflow editor has
              // finished refreshing its model from the server. Reloading immediately after
              // publish() could otherwise leave the workflow paths of the previous version on
              // screen until a second manual reload.
              .then(() => setTimeout(doReload, 1500))
              .catch(() => setTimeout(doReload, 1500));
          } else {
            setTimeout(doReload, 2000);
          }
        } else if (hasWorkflowMessage) {
          // Workflow only: show message and reload. Persist the sensitive elements used by this run
          // right before the reload so the change-log component reopens with them highlighted.
          this.resultText = `${String(p2["workflowMessage"])} Reloading designer\u2026`;
          this.showToast(this.resultText, "success");
          // Keep the dialog busy (inputs/buttons disabled) until the reload happens.
          this.loading = true;
          this.spinnerText = "Reloading designer\u2026";
          setTimeout(() => {
            if (sensitive.length > 0) {
              localStorage.setItem("codbi-log-sensitive-elements", JSON.stringify(sensitive));
            }
            if (blockedSql.length > 0) {
              localStorage.setItem(AiAssistant.BLOCKED_SQL_STORAGE_KEY, JSON.stringify(blockedSql));
            }
            // Persist the chat conversation so the chat popup re-opens after the reload.
            this.persistPendingChat();
            window.location.reload();
          }, 1500);
        } else if (hasFormJson) {
          // Form only: wait for async rendering to complete (same as "both"), then patch
          // everything exactly as the "both" flow does to ensure standards stick.
          const dSave = designer as unknown as Record<string, unknown>;
          const doPatch = (): void => {
            if (typeof p2["standards"] === "string") {
              const stdVal = p2["standards"] as string;
              const lang2 = designer.getFormEditLanguage?.() ?? "default";
              // Patch 1: update the live formI18n object
              const persist2 = designer.getPersist?.() as unknown as Record<string, unknown> | undefined;
              if (persist2?.["formI18n"] != null) {
                const i18n = persist2["formI18n"] as Record<string, Record<string, unknown>>;
                i18n[lang2] = i18n[lang2] ?? {};
                i18n[lang2]["codbi-prop-standards"] = stdVal;
              }
              // Patch 2: update persist.persist (the cached serialised JSON string)
              if (persist2 != null && typeof persist2["persist"] === "string") {
                try {
                  const parsed = JSON.parse(persist2["persist"] as string) as Record<string, unknown>;
                  const pI18n = (parsed["formI18n"] as Record<string, Record<string, unknown>> | undefined) ?? {};
                  pI18n[lang2] = pI18n[lang2] ?? {};
                  pI18n[lang2]["codbi-prop-standards"] = stdVal;
                  parsed["formI18n"] = pI18n;
                  persist2["persist"] = JSON.stringify(parsed);
                } catch {
                  // Ignore parse errors
                }
              }
              // Patch 3: update the live checkboxes via the editor API
              const cpd2 = (window as any).CodbiPluginData as typeof window.CodbiPluginData | undefined;
              if (typeof cpd2?.setStandardsValue === "function") {
                cpd2.setStandardsValue(stdVal);
              }
            }
            this.close(); //this.visible = false;
            this.cdr.markForCheck();
            // Form-only flow has no page reload, so PrimeNG's modal mask would otherwise linger and
            // keep the background darkened. close() already hides the mask via display:none (the
            // dialog is kept mounted), so only strip a mask that is genuinely orphaned — removing a
            // mounted mask would destroy the dialog and force a slow fresh recreate on the next open.
            setTimeout(() => {
              if (!document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`)) {
                this.removeOverlayMask(".cb-ai-assistant-mask");
              }
            }, 0);
            // Automatic popup: after the form changes are applied (assistant closed), unfold the
            // change-log side panel again if the last inference used sensitive elements that are not
            // marked as checked yet, or generated destructive SQL that was blocked. openLog
            // re-opens the dialog, so it stays visible with the log.
            if (blockedSql.length > 0) {
              try {
                localStorage.setItem(AiAssistant.BLOCKED_SQL_STORAGE_KEY, JSON.stringify(blockedSql));
              } catch {
                // ignore storage errors
              }
            }
            if (sensitive.length > 0 || blockedSql.length > 0) {
              this.openLog(sensitive);
            }
          };
          const waitUntilReady = (): Promise<void> =>
            new Promise<void>((resolve) => {
              const maxWait = 10_000;
              const start = Date.now();
              const poll = (): void => {
                if (!dSave["_isLoading"] || Date.now() - start >= maxWait) {
                  resolve();
                } else {
                  setTimeout(poll, 100);
                }
              };
              poll();
            });
          waitUntilReady().then(doPatch).catch(doPatch);
        } else if (hasChat) {
          // Answer-only run: close the main assistant dialog so the chat popup with the answer is
          // clearly visible and becomes the focus (the popup was opened above).
          this.close(); //this.visible = false;
          // close() already hides the mask via display:none (dialog kept mounted); only strip a mask
          // that is genuinely orphaned so a later reopen stays a fast CSS flip.
          setTimeout(() => {
            if (!document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`)) {
              this.removeOverlayMask(".cb-ai-assistant-mask");
            }
          }, 0);
        } else {
          this.setError("Unexpected response format.");
        }
        this.cdr.markForCheck();
      },
      error: (xhr: unknown) => {
        const jq = xhr as { responseJSON?: { error?: string }; statusText?: string };
        const msg = jq.responseJSON?.error ?? jq.statusText ?? "Request failed.";
        if (chatOptions?.chatMode) {
          this.chatLoading = false;
          this.chatMessages.push({ role: "assistant", text: `! ${msg}` });
          this.cdr.markForCheck();
          return;
        }
        this.setError(msg);
      },
    });
  }

  private extractFormElements(items: Array<Record<string, unknown>>): FormElement[] {
    const containerClasses = new Set(["XPage", "XFieldSet", "XContainer", "XHeader", "XFooter"]);
    const interactiveClasses = new Set([
      "XTextField",
      "XTextArea",
      "XUpload",
      "XSelect",
      "XCheckbox",
      "XButtonList",
      "XSignature",
      "XAppointment",
    ]);
    const stripHtml = (raw: string): string =>
      raw
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();

    return items.flatMap((item) => {
      const className = String(item["className"] ?? "");
      const props = (item["properties"] ?? {}) as Record<string, unknown>;

      if (containerClasses.has(className)) {
        const nested = props["elements"];
        return Array.isArray(nested) ? this.extractFormElements(nested as Array<Record<string, unknown>>) : [];
      }

      if (!interactiveClasses.has(className)) {
        return [];
      }

      if (className === "XButtonList") {
        const buttons = props["buttons"];
        if (!Array.isArray(buttons) || buttons.length === 0) {
          return [];
        }
        return buttons
          .map((btn: unknown) => {
            const b = (btn ?? {}) as Record<string, unknown>;
            const technicalId = String(b["name"] ?? "");
            if (!technicalId) {
              return null;
            }
            const action = (b["action"] ?? {}) as Record<string, unknown>;
            const el: FormElement = { technicalId, type: "BUTTON" };
            const displayText = stripHtml(String(b["value"] ?? ""));
            if (displayText) el.displayText = displayText;
            const actionPage = String(action["page"] ?? "");
            if (actionPage) el.actionPage = actionPage;
            return el;
          })
          .filter(Boolean) as FormElement[];
      }

      const technicalId = String(props["name"] ?? "");
      if (!technicalId) {
        return [];
      }
      const el: FormElement = { technicalId, type: className };
      const label = stripHtml(String(props["label"] ?? ""));
      if (label) el.displayText = label;
      if (props["required"] === "1") el.required = true;
      const placeholder = stripHtml(String(props["placeholder"] ?? ""));
      if (placeholder) el.placeholder = placeholder;
      if (className === "XSelect") {
        const options = props["options"];
        if (Array.isArray(options) && options.length > 0) {
          const mapped = options
            .map((opt: unknown) => {
              const o = (opt ?? {}) as Record<string, unknown>;
              return {
                text: stripHtml(String(o["text"] ?? "")),
                value: String(o["value"] ?? ""),
              };
            })
            .filter((o) => o.text || o.value);
          if (mapped.length > 0) el.options = mapped;
        }
      }
      return [el];
    });
  }

  private setError(message: string): void {
    this.loading = false;
    this.errorText = message;
    this.showToast(message);
    this.cdr.markForCheck();
  }

  /** Shows a persistent toast (top-right, stays until the user dismisses it via X). */
  private showToast(message: string, severity: "error" | "success" | "info" = "error"): void {
    this.toastMessage = message;
    this.toastSeverity = severity;
    this.cdr.markForCheck();
  }

  /** PrimeNG icon shown on the toast, depending on its severity. */
  get toastIconClass(): string {
    switch (this.toastSeverity) {
      case "success":
        return "pi pi-check-circle";
      case "info":
        return "pi pi-info-circle";
      default:
        return "pi pi-exclamation-triangle";
    }
  }

  /** Dismisses the error toast (X button). */
  dismissToast(): void {
    this.toastMessage = null;
    this.cdr.markForCheck();
  }

  /** Defensively removes any leftover PrimeNG overlay mask (keeps the background from staying dark). */
  private removeOverlayMask(selector: string): void {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => el.remove());
  }
  // #endregion Run
}
