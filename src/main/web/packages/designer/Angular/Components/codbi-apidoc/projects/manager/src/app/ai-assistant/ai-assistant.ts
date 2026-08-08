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
import { Message } from "primeng/message";
import { ProgressSpinner } from "primeng/progressspinner";
import { Select } from "primeng/select";
import { Textarea } from "primeng/textarea";
import { Callbacks, getJQuery, instance as getDesignerInstance } from "@de-xima/fc-form-designer";
import { getCurrentFormKey } from "./form-key";
import { AiAssistantLog } from "../ai-assistant-log/ai-assistant-log";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFPageProxy } from "pdfjs-dist";
import {
  applyDialogPosition,
  enableDialogDrag,
  loadDialogPosition,
  readDialogPosition,
  saveDialogPosition,
  type DialogPosition,
} from "../dialog-position";
// #endregion Imports

// #region Interfaces
interface AiModel {
  id: string;
  label: string;
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

/** A snapshot of the designer state captured just before an AI change was applied. */
interface IAiHistoryEntry {
  /** ISO timestamp of when the AI was invoked. */
  timestamp: string;
  /** The user's prompt text. */
  prompt: string;
  /** The intent classified by phase 1. */
  intent: "form" | "workflow" | "both";
  /** Persist JSON captured before AI changes were applied (passed to loadPersistJson to restore). */
  persistJson: unknown;
  /** codbi-prop-standards CSV captured before AI changes were applied. */
  standards: string;
}

/** One clarifying question the AI asks the user (multiple-choice + optional free text). */
interface ClarificationQuestion {
  id: string;
  question: string;
  options?: string[];
  allowFreeText?: boolean;
}

/** One answered clarification round (used for the change log and the re-run conversation). */
interface ClarificationTurn {
  question: string;
  answer: string;
  attachmentName?: string;
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
  imports: [FormsModule, Dialog, Select, Textarea, Button, ProgressSpinner, Message, AiAssistantLog],
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
  /** Whether the CodBi prompt database is reachable. When false, the assistant inputs are
   *  disabled (but still visible) because there are no DB prompts to send to the AI. */
  dbAvailable = true;
  /** Whether CodBi prompts (functionalities, element placeholders, standard configurations) are
   *  sent to the AI at all. Defaults to ON. When OFF, the AI only receives Formcycle widgets and
   *  workflow nodes, and no CodBi is applied in any pass. */
  useCodbi = true;
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
  /** Per-question selected option. */
  clarificationOption: Record<string, string> = {};
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
  } | null = null;
  readonly speechSupported = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
  isSpeechRecording = false;
  private pdfJsWorkerConfigured = false;
  private speechRecognition: any = null;
  private speechBaseText = "";
  private speechFinalText = "";
  /** The full `codbi-prop-standards` CSV that the AI set on its most recent run.
   *  `null` means the AI has never run yet this session (first-run mode). */
  private prevAiStandards: string | null = null;
  /** Snapshots taken before each AI change — drives the undo history panel. */
  history: IAiHistoryEntry[] = [];
  /** Whether the history/undo panel is currently expanded. */
  showHistory = false;
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
  private readonly LOG_PANEL_WIDTH_KEY = "codbi-ai-log-panel-width";
  /** Whether the current user is allowed to sync the API-Documentation (Prompt Manager visibility). */
  syncAllowed = false;
  private readonly HISTORY_KEY = "codbi-ai-undo-history";
  private readonly MAX_HISTORY = 10;
  /** Cookie name for persisting the selected AI model across page reloads. */
  private readonly MODEL_COOKIE = "codbi-ai-selected-model";
  /** A log entry that used sensitive elements is auto-opened only if it is at most this old. */
  private static readonly AUTO_OPEN_WINDOW_MINUTES = 10;
  // #endregion State

  /** Reference to the embedded change-log panel (unfolds to the right of the assistant content). */
  @ViewChild("logPanel") logPanel?: AiAssistantLog;

  private readonly openHandler = (): void => this.open();

  /** Remembered dialog position, persisted across reloads so the browser keeps the location. */
  private dialogPosition: DialogPosition | null = loadDialogPosition("codbi-dialog-assistant-position");
  private static readonly DIALOG_STYLE_CLASS = "cb-ai-assistant-dialog";
  /** Cleanup for the custom header-drag handlers (re-enabled on every dialog show). */
  private dragCleanup: (() => void) | null = null;

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
    // The change-log panel unfolds inside the assistant dialog, so make sure the dialog is visible
    // and the model list is populated (e.g. right after a workflow-triggered page reload).
    if (this.models.length === 0) {
      this.loadModelsAndOpen();
    } else {
      this.visible = true;
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
    const max = Math.max(
      AiAssistant.LOG_PANEL_MIN_WIDTH,
      Math.round(this.dialogWidth - AiAssistant.LOG_PANEL_MAIN_MIN_WIDTH),
    );
    this.logPanelWidth = Math.round(Math.min(Math.max(next, AiAssistant.LOG_PANEL_MIN_WIDTH), max));
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

  /** Folds / unfolds the change-log side panel (the footer "Change log" toggle). */
  toggleLog(): void {
    if (this.showLog) {
      this.showLog = false;
      this.logPanel?.clearHighlights();
      this.restoreDialogSize();
    } else {
      this.openLog();
    }
    this.cdr.markForCheck();
  }

  /** The embedded change-log panel auto-opened (e.g. from the `codbi:ai-assistant-log:open`
   *  event) — make sure the assistant dialog is visible, widened to the right edge and the panel is
   *  unfolded. The log data is already loaded by the opening component, so it is NOT re-opened. */
  onLogOpened(): void {
    this.visible = true;
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
  }

  /** The user folded the change-log panel via its close button. */
  onLogClosed(): void {
    this.showLog = false;
    this.logPanel?.clearHighlights();
    this.restoreDialogSize();
    this.cdr.markForCheck();
  }

  /**
   * Widens the assistant dialog so its right edge reaches the right edge of the viewport, then
   * unfolds the change-log panel. The panel only unfolds once the dialog is already wide, so the
   * regular assistant content is never squeezed while the panel slides in. [elements] are the
   * sensitive CodBi elements to highlight in the log.
   */
  private expandAndUnfoldLog(elements: string[]): void {
    const expandAndShow = (attempt: number): void => {
      if (this.expandDialogForLog()) {
        // Never let the saved panel width exceed the dialog's available space.
        this.logPanelWidth = Math.min(
          this.logPanelWidth,
          Math.max(
            AiAssistant.LOG_PANEL_MIN_WIDTH,
            Math.round(this.dialogWidth - AiAssistant.LOG_PANEL_MAIN_MIN_WIDTH),
          ),
        );
        this.showLog = true;
        this.cdr.markForCheck();
        // The embedded change-log component is created together with the dialog content; retry for
        // a few seconds until it is ready before asking it to open (with any sensitive highlights).
        const tryOpen = (openAttempt: number): void => {
          if (this.logPanel) {
            this.logPanel.open(elements);
          } else if (openAttempt < 40) {
            setTimeout(() => tryOpen(openAttempt + 1), 100);
          }
        };
        tryOpen(0);
      } else if (attempt < 60) {
        // The dialog is not rendered yet (model list may still be loading) — retry.
        setTimeout(() => expandAndShow(attempt + 1), 100);
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
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    // The dialog must be wide enough for both panes. If its current left edge leaves too little
    // room to reach the right edge of the viewport, shift the left edge left so the dialog always
    // expands and the change-log panel never overlaps the assistant content.
    const minTotal = this.logPanelWidth + AiAssistant.LOG_PANEL_MAIN_MIN_WIDTH + 8;
    const left = Math.min(rect.left, Math.max(0, Math.round(window.innerWidth - minTotal)));
    el.style.position = "fixed";
    el.style.transform = "none";
    el.style.left = `${left}px`;
    el.style.top = `${rect.top}px`;
    this.dialogWidth = Math.max(620, Math.round(window.innerWidth - left));
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
    document.addEventListener("codbi:ai-assistant:open", this.openHandler);
    this.loadHistory();
    this.checkSyncAllowed();
    this.loadLogPanelWidth();
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
    const pendingSensitive = localStorage.getItem("codbi-log-sensitive-elements");
    console.log("[AICodBiAssistant] ngOnInit: pending sensitive highlight =", pendingSensitive);
    if (pendingSensitive) {
      localStorage.removeItem("codbi-log-sensitive-elements");
      let elements: string[] = [];
      try {
        const parsed = JSON.parse(pendingSensitive) as unknown;
        elements = Array.isArray(parsed) ? (parsed as string[]).filter((e): e is string => typeof e === "string") : [];
      } catch {
        // ignore malformed payload
      }
      console.log("[AICodBiAssistant] ngOnInit: opening change log with", JSON.stringify(elements));
      if (elements.length > 0) {
        this.openLog(elements);
      }
    } else {
      this.checkSensitiveAutoOpen();
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener("codbi:ai-assistant:open", this.openHandler);
    this.stopSpeech();
    this.dragCleanup?.();
    this.dragCleanup = null;
    this.endLogResize();
  }
  // #endregion Lifecycle

  // #region Template helpers
  onVisibleChange(v: boolean): void {
    this.visible = v;
    if (!v) {
      // The change-log side panel starts folded whenever the dialog is (re)opened.
      this.showLog = false;
      this.dialogWidth = this.foldedDialogWidth;
    }
    this.cdr.markForCheck();
  }

  /** Restores the remembered dialog position/size once it has rendered (best effort — see ngOnInit). */
  onDialogShow(): void {
    const el = document.querySelector(`.${AiAssistant.DIALOG_STYLE_CLASS}`) as HTMLElement | null;
    if (el) {
      el.style.width = `${this.foldedDialogWidth}px`;
      el.style.maxWidth = "";
      el.style.backgroundPosition = "";
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
      if (!getCurrentFormKey() && attempt < 10) {
        setTimeout(() => checkWhenReady(attempt + 1), 150);
        return;
      }
      const headers: Record<string, string> = { "X-Action": "Log" };
      const formKey = getCurrentFormKey();
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
          const used = newest["sensitiveUsed"];
          if (!Array.isArray(used) || used.length === 0) return;
          const ageMin = this.ageMinutes(String(newest["ts"] ?? ""));
          if (ageMin === null || ageMin > AiAssistant.AUTO_OPEN_WINDOW_MINUTES) return;
          const entryId = String(newest["id"] ?? "");
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
          const unacknowledged = (used as unknown[])
            .map((name) => String(name))
            .filter((name) => name && !acknowledged.has(name.toLowerCase()));
          if (unacknowledged.length === 0) return;
          console.log(
            "[AICodBiAssistant] checkSensitiveAutoOpen: opening change log with",
            JSON.stringify(unacknowledged),
          );
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
    this.resultText = null;
    this.errorText = null;
    this.attachedFile = null;
    this.showHistory = false;

    // First verify the CodBi prompt database is reachable. Without DB prompts there is no point
    // sending anything to the AI — show an error and disable the inputs (still visible).
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
          this.visible = true;
          this.cdr.markForCheck();
          return;
        }
        this.dbAvailable = true;
        this.loadModelsAndOpen();
      },
      error: (xhr: unknown) => {
        const jq = xhr as { responseJSON?: { error?: string }; statusText?: string };
        this.dbAvailable = false;
        this.errorText =
          jq.responseJSON?.error ?? jq.statusText ?? "Database not available — AI prompts cannot be loaded.";
        this.visible = true;
        this.cdr.markForCheck();
      },
    });
  }

  private loadModelsAndOpen(): void {
    if (this.models.length > 0) {
      this.selectedModel = this.loadModelCookie() ?? this.models[0]?.id ?? null;
      this.visible = true;
      this.cdr.markForCheck();
      return;
    }

    getJQuery().ajax({
      url: `${this.baseUrl}plugin?name=CodBi_AICodBiAssistant`,
      type: "GET",
      headers: { "X-Action": "Models" },
      success: (response: unknown) => {
        if (!Array.isArray(response)) {
          this.errorText = (response as { error?: string } | null)?.error ?? "AI service not available.";
        } else {
          const list = response as AiModel[];
          this.models = list;
          const saved = this.loadModelCookie();
          this.selectedModel = saved && list.some((m) => m.id === saved) ? saved : (list[0]?.id ?? null);
        }
        this.visible = true;
        this.cdr.markForCheck();
      },
      error: (xhr: unknown) => {
        const jq = xhr as { responseJSON?: { error?: string }; statusText?: string };
        this.errorText = jq.responseJSON?.error ?? jq.statusText ?? "AI service not available.";
        this.visible = true;
        this.cdr.markForCheck();
      },
    });
  }

  close(): void {
    this.visible = false;
    this.cdr.markForCheck();
  }

  onModelChange(modelId: string): void {
    this.selectedModel = modelId;
    if (modelId) {
      this.saveModelCookie(modelId);
    }
  }
  // #endregion Open / close

  // #region History (undo)
  toggleHistory(): void {
    this.showHistory = !this.showHistory;
    this.cdr.markForCheck();
  }

  formatHistoryTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  private loadHistory(): void {
    try {
      const raw = sessionStorage.getItem(this.HISTORY_KEY);
      this.history = raw ? (JSON.parse(raw) as IAiHistoryEntry[]) : [];
    } catch {
      this.history = [];
    }
  }

  private saveHistory(): void {
    try {
      sessionStorage.setItem(this.HISTORY_KEY, JSON.stringify(this.history));
    } catch {
      // SessionStorage full or unavailable — history lives in memory only this session.
    }
  }

  private addSnapshot(
    prompt: string,
    intent: "form" | "workflow" | "both",
    persistJson: unknown,
    standards: string,
  ): void {
    const entry: IAiHistoryEntry = { timestamp: new Date().toISOString(), prompt, intent, persistJson, standards };
    this.history = [entry, ...this.history].slice(0, this.MAX_HISTORY);
    this.saveHistory();
  }

  restoreSnapshot(entry: IAiHistoryEntry): void {
    const designer = getDesignerInstance();
    if (!designer) {
      this.setError("Designer is not available.");
      return;
    }
    try {
      const d = designer as unknown as Record<string, unknown>;
      if (typeof d["loadPersistJson"] === "function") {
        (d["loadPersistJson"] as (...args: unknown[]) => void).call(designer, entry.persistJson);
      } else if (typeof d["loadPersist"] === "function") {
        (d["loadPersist"] as (...args: unknown[]) => void).call(
          designer,
          JSON.stringify(entry.persistJson),
          "undo.json",
          false,
        );
      } else {
        throw new Error("Designer has no load method available.");
      }
      Callbacks["persist-changed"].fire();
      // Restore standards
      const cpd = (window as any).CodbiPluginData as typeof window.CodbiPluginData | undefined;
      if (typeof cpd?.setStandardsValue === "function") {
        cpd.setStandardsValue(entry.standards);
      } else {
        const jq = getJQuery();
        const fakeEditor = {
          config: { property: "codbi-prop-standards", base: jq(), id: "codbi-ai-undo-editor", designer },
          className: "MultiSelect",
          property: "codbi-prop-standards",
          getPropertyType: () => "form",
          getPropertyRow: () => jq(),
          getPanelBox: () => jq(),
          getEditorPanel: () => jq(),
          getElement: () => jq(),
          getValue: () => entry.standards,
          setValue: () => undefined,
          setValueTo: () => undefined,
          hide: () => undefined,
          show: () => undefined,
        } as any;
        Callbacks["set-property"].fire("codbi-prop-standards", entry.standards, fakeEditor);
        // Also directly patch the cached persist model so save() serialises the value
        // correctly even if the fake-editor callback is swallowed (e.g. panel closed).
        {
          const persist = designer.getPersist?.();
          const lang = designer.getFormEditLanguage?.();
          if (persist?.formI18n != null && lang != null) {
            (persist.formI18n[lang] as Record<string, unknown>) ??= {};
            (persist.formI18n[lang] as Record<string, unknown>)["codbi-prop-standards"] = entry.standards;
          }
        }
        if (cpd) cpd.pendingStandards = entry.standards;
      }
      this.prevAiStandards = null;
      this.showHistory = false;
      this.resultText = `Restored to state from ${this.formatHistoryTime(entry.timestamp)}. Save the form to keep this change.`;
      this.errorText = null;
    } catch (err) {
      this.setError(err instanceof Error ? err.message : "Failed to restore snapshot.");
    }
    this.cdr.markForCheck();
  }
  // #endregion History (undo)

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
  private ensurePdfJsWorkerConfigured(): void {
    if (this.pdfJsWorkerConfigured) {
      return;
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${this.baseUrl}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.worker.min.js`;
    this.pdfJsWorkerConfigured = true;
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
    this.ensurePdfJsWorkerConfigured();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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
    this.cdr.markForCheck();
  }

  /** Marks [questionId] as answered with the given [option] (quick multiple-choice answer). */
  selectClarificationOption(questionId: string, option: string): void {
    this.clarificationOption[questionId] = option;
    this.cdr.markForCheck();
  }

  /** Stores the document the user attached to the clarification answers. */
  onClarificationFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.clarificationFile = input?.files?.[0] ?? null;
    this.cdr.markForCheck();
  }

  /** File-name label for the attachment button. */
  get clarificationFileLabel(): string {
    return this.clarificationFile ? this.clarificationFile.name : "Attach a document (optional)";
  }

  /** Whether the clarification can be submitted (a combined answer was typed/voiced, or every
   *  question got a quick multiple-choice answer). */
  get clarificationReady(): boolean {
    if (this.pendingClarification.length === 0) return false;
    const hasCombined = (this.clarificationAnswerText ?? "").trim().length > 0;
    return (
      hasCombined || this.pendingClarification.every((q) => (this.clarificationOption[q.id] ?? "").trim().length > 0)
    );
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
    const questionText = this.pendingClarification.map((q, i) => `${i + 1}. ${q.question}`).join("\n");
    const optionLines = this.pendingClarification
      .map((q, i) => {
        const opt = (this.clarificationOption[q.id] ?? "").trim();
        return opt ? `${i + 1}. ${q.question} → ${opt}` : "";
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
      this.runPhase2(ctx.prompt, ctx.modelId, ctx.intent, [...ctx.imageParams, ...extra]);
    })();
  }

  // #endregion Clarification popup
  // #endregion PDF.js helpers

  // #region Run (phase 1 + phase 2)
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

    const phase1Form = new FormData();
    phase1Form.append("prompt", prompt);
    phase1Form.append("useCodbi", String(this.useCodbi));
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
  ): void {
    // Remember the context so a clarification round can re-run phase 2 with the same inputs.
    this.phase2Context = { prompt, modelId, intent, imageParams };
    const designer = getDesignerInstance();
    const data: Record<string, string> = { prompt, phase: "2", intent, useCodbi: String(this.useCodbi) };
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
        const p2 = phase2Response as Record<string, unknown> | null;
        console.log("[AICodBiAssistant] Phase 2 response:", JSON.stringify(p2));

        if (!p2 || typeof p2 !== "object") {
          this.setError("Unexpected response from server.");
          return;
        }

        if ("error" in p2) {
          this.setError(String(p2["error"]));
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
        const hasWorkflowReload =
          typeof p2["workflowMessage"] === "string" && (p2["workflowMessage"] as string).length > 0;
        console.log(
          "[AICodBiAssistant] run: sensitiveElements =",
          JSON.stringify(sensitive),
          "| hasWorkflowReload =",
          hasWorkflowReload,
        );
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

        // Apply form changes if present
        if (hasFormJson) {
          // Snapshot current state before applying so the user can undo.
          const prePersist = designer?.getPersist?.() as unknown as Record<string, unknown> | undefined;
          let snapPersist: unknown;
          if (typeof prePersist?.["persist"] === "string") {
            try {
              snapPersist = JSON.parse(prePersist["persist"] as string);
            } catch {
              snapPersist = prePersist;
            }
          } else {
            snapPersist = prePersist;
          }
          const snapContainer = document.getElementById("CodBi_Standardslisting");
          const snapStandards = snapContainer
            ? Array.from(snapContainer.querySelectorAll<HTMLInputElement>("input[type=checkbox]:checked"))
                .map((cb) => cb.value)
                .join(",")
            : ((designer?.getFormPropertyValueForCurrentLang("codbi-prop-standards") as string) ?? "");
          this.addSnapshot(prompt, intent, snapPersist, snapStandards);

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
                  console.log("[AICodBiAssistant] persist.formI18n[%s][codbi-prop-standards] = %s", lang, newStandards);
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
            console.log(
              "[AICodBiAssistant] doReload: persisted sensitive elements =",
              JSON.stringify(sensitive),
              "| reloading now",
            );
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
                    console.log(
                      "[AICodBiAssistant] (pre-publish) persist.formI18n[%s][codbi-prop-standards] = %s",
                      lang2,
                      stdVal,
                    );
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
              .then(doReload)
              .catch(doReload);
          } else {
            setTimeout(doReload, 2000);
          }
        } else if (hasWorkflowMessage) {
          // Workflow only: show message and reload. Persist the sensitive elements used by this run
          // right before the reload so the change-log component reopens with them highlighted.
          this.resultText = `${String(p2["workflowMessage"])} Reloading designer\u2026`;
          setTimeout(() => {
            if (sensitive.length > 0) {
              localStorage.setItem("codbi-log-sensitive-elements", JSON.stringify(sensitive));
            }
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
                console.log(
                  "[AICodBiAssistant] (form-only) persist.formI18n[%s][codbi-prop-standards] = %s",
                  lang2,
                  stdVal,
                );
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
            this.visible = false;
            this.cdr.markForCheck();
            // Automatic popup: after the form changes are applied (assistant closed), unfold the
            // change-log side panel again if the last inference used sensitive elements that are not
            // marked as checked yet. openLog re-opens the dialog, so it stays visible with the log.
            if (sensitive.length > 0) {
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
        } else {
          this.setError("Unexpected response format.");
        }
        this.cdr.markForCheck();
      },
      error: (xhr: unknown) => {
        const jq = xhr as { responseJSON?: { error?: string }; statusText?: string };
        this.setError(jq.responseJSON?.error ?? jq.statusText ?? "Request failed.");
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
    this.cdr.markForCheck();
  }
  // #endregion Run
}
