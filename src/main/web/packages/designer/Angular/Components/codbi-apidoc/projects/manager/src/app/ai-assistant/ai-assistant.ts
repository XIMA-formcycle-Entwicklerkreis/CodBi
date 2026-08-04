// #region Imports
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
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
import * as pdfjsLib from "pdfjs-dist";
import type { PDFPageProxy } from "pdfjs-dist";
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
  imports: [FormsModule, Dialog, Select, Textarea, Button, ProgressSpinner, Message],
  templateUrl: "./ai-assistant.html",
  styleUrl: "./ai-assistant.scss",
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistant implements OnInit, OnDestroy {
  // #region State
  private readonly baseUrl = `${window.location.href.split("/").slice(0, 4).join("/")}/`;

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
  attachedFile: File | null = null;
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
  private readonly HISTORY_KEY = "codbi-ai-undo-history";
  private readonly MAX_HISTORY = 10;
  /** Cookie name for persisting the selected AI model across page reloads. */
  private readonly MODEL_COOKIE = "codbi-ai-selected-model";
  // #endregion State

  private readonly openHandler = (): void => this.open();

  constructor(private readonly cdr: ChangeDetectorRef) {}

  /** Opens the Prompt Manager dialog. */
  openPromptManager(): void {
    if (!document.querySelector("cb-prompt-manager")) {
      document.body.appendChild(document.createElement("cb-prompt-manager"));
    }
    // Small delay to ensure the custom element is ready in the DOM
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("codbi:prompt-manager:open"));
    }, 50);
  }

  /** Opens the change-log dialog showing every AI inference recorded in the database. */
  openLog(): void {
    if (!document.querySelector("cb-ai-assistant-log")) {
      document.body.appendChild(document.createElement("cb-ai-assistant-log"));
    }
    // Small delay to ensure the custom element is ready in the DOM
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("codbi:ai-assistant-log:open"));
    }, 50);
  }

  // #region Lifecycle
  ngOnInit(): void {
    document.addEventListener("codbi:ai-assistant:open", this.openHandler);
    this.loadHistory();
    document.documentElement.style.setProperty(
      "--cb-ai-watermark-url",
      `url('${this.baseUrl}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg')`,
    );
  }

  ngOnDestroy(): void {
    document.removeEventListener("codbi:ai-assistant:open", this.openHandler);
    this.stopSpeech();
  }
  // #endregion Lifecycle

  // #region Template helpers
  onVisibleChange(v: boolean): void {
    this.visible = v;
    this.cdr.markForCheck();
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

  /** Converts the attached file to a list of {name, dataUrl} entries ready for codbi-base64 params. */
  private async buildImageParams(): Promise<Array<{ name: string; dataUrl: string }>> {
    const file = this.attachedFile;
    if (!file) return [];
    if (file.type === "application/pdf") {
      return this.processPdfFile(file);
    }
    const dataUrl = await this.blobToDataUrl(file);
    return [{ name: file.name, dataUrl }];
  }
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

  private runPhase2(
    prompt: string,
    modelId: string,
    intent: "form" | "workflow" | "both",
    imageParams: Array<{ name: string; dataUrl: string }> = [],
  ): void {
    const designer = getDesignerInstance();
    const data: Record<string, string> = { prompt, phase: "2", intent, useCodbi: String(this.useCodbi) };
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
          // Workflow only: show message and reload
          this.resultText = `${String(p2["workflowMessage"])} Reloading designer\u2026`;
          setTimeout(() => window.location.reload(), 1500);
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
