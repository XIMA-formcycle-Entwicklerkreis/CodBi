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
import { getJQuery, instance as getDesignerInstance } from "@de-xima/fc-form-designer";
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
  // #endregion State

  private readonly openHandler = (): void => this.open();

  constructor(private readonly cdr: ChangeDetectorRef) {}

  // #region Lifecycle
  ngOnInit(): void {
    document.addEventListener("codbi:ai-assistant:open", this.openHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener("codbi:ai-assistant:open", this.openHandler);
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

  // #region Open / close
  private open(): void {
    this.resultText = null;
    this.errorText = null;

    if (this.models.length > 0) {
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
          this.selectedModel = list[0]?.id ?? null;
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
  // #endregion Open / close

  // #region Run (phase 1 + phase 2)
  run(): void {
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

    getJQuery().ajax({
      url: `${this.baseUrl}plugin?name=CodBi_AICodBiAssistant`,
      type: "POST",
      headers: { "X-Action": "Run", "X-Model": modelId },
      data: { prompt },
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

        this.spinnerText = "Collecting context\u2026";
        this.cdr.markForCheck();
        this.runPhase2(prompt, modelId, intent);
      },
      error: (xhr: unknown) => {
        const jq = xhr as { responseJSON?: { error?: string }; statusText?: string };
        this.setError(jq.responseJSON?.error ?? jq.statusText ?? "Request failed.");
      },
    });
  }

  private runPhase2(prompt: string, modelId: string, intent: "form" | "workflow" | "both"): void {
    const designer = getDesignerInstance();
    const data: Record<string, string> = { prompt, phase: "2", intent };

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

    getJQuery().ajax({
      url: `${this.baseUrl}plugin?name=CodBi_AICodBiAssistant`,
      type: "POST",
      headers: { "X-Action": "Run", "X-Model": modelId },
      data,
      dataType: "json",
      success: (phase2Response: unknown) => {
        this.loading = false;
        const p2 = phase2Response as Record<string, unknown> | null;

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

        // Apply form changes if present
        if (hasFormJson) {
          try {
            const d = designer as unknown as Record<string, unknown>;
            if (typeof d["loadPersist"] === "function") {
              (d["loadPersist"] as (...args: unknown[]) => void).call(
                designer,
                JSON.stringify(p2["formJson"]),
                "ai-form.json",
                false,
              );
            } else if (typeof d["loadPersistJson"] === "function") {
              (d["loadPersistJson"] as (...args: unknown[]) => void).call(designer, p2["formJson"]);
            } else {
              throw new Error("Neither loadPersist nor loadPersistJson is available on the designer instance.");
            }
          } catch (err) {
            this.setError(err instanceof Error ? err.message : "Failed to apply form changes.");
            return;
          }
        }

        if (hasFormJson && hasWorkflowMessage) {
          // Both: show warning to save so the button appears in workflow trigger dropdown
          this.resultText = `Form updated. Workflow task created: ${String(p2["workflowMessage"])}\n\u26a0\ufe0f Save the workflow to make the button available as a trigger, then save the form (Ctrl+S) to persist the form changes.`;
        } else if (hasWorkflowMessage) {
          // Workflow only: show message and reload
          this.resultText = `${String(p2["workflowMessage"])} Reloading designer\u2026`;
          setTimeout(() => window.location.reload(), 1500);
        } else if (hasFormJson) {
          // Form only: close dialog
          this.visible = false;
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
