// #region Imports
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from "@angular/core";
import type { OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { Message } from "primeng/message";
import { ProgressSpinner } from "primeng/progressspinner";
import { PrimeTemplate } from "primeng/api";
import { getJQuery } from "@de-xima/fc-form-designer";
import { getCurrentFormKey } from "../ai-assistant/form-key";
import { LogTreeNode } from "./log-tree-node";
import type { LogNode } from "./log-tree-node";
// #endregion Imports

/**
 * Angular component that shows a treeview of every AI assistant inference recorded in the
 * `codbi_ai_assistant_log` database table.
 *
 * Registered as the `cb-ai-assistant-log` custom element by main.ts. Listens for the
 * `codbi:ai-assistant-log:open` custom event (dispatched by the AI assistant dialog) and shows a
 * PrimeNG dialog with a scrollable, collapsible tree.
 *
 * The dialog shows only the entries of the form that is currently being edited in the designer:
 * the current form's technical name/key is resolved via [getCurrentFormKey] and sent as the
 * `X-Form-Key` header, and the backend filters the records accordingly.
 *
 * Tree layout per inference (top level = date + time of the inference):
 * - **Prompt**: unfold to see the complete prompt text that produced the inference.
 * - **Form**: `Widgets created` / `Widgets removed`, then `Classes set` and `Attributes set`.
 *   Every widget unfolds into a `Classes` node (all CSS classes), a `Config` node (the regular
 *   formcycle attributes the AI generated) and an `Attributes` node. The Attributes node contains
 *   one node per CodBi functionality (`data-cb-func`); unfolding a functionality node reveals the
 *   `data-cb-*` parameters used by it (a parameter shared by several functionalities is listed
 *   under each of them).
 * - **Workflow**: one node per created workflow element; unfolding a node reveals the parameters
 *   defined for it.
 */
@Component({
  selector: "cb-ai-assistant-log",
  standalone: true,
  imports: [CommonModule, PrimeTemplate, Dialog, Button, ProgressSpinner, Message, LogTreeNode],
  templateUrl: "./ai-assistant-log.html",
  styleUrl: "./ai-assistant-log.scss",
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistantLog implements OnInit, OnDestroy {
  private readonly baseUrl = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  /** CodBi logo shown in the dialog header (same resource as the Prompt Manager). */
  readonly logoUrl =
    `${this.baseUrl}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg`;

  visible = false;
  loading = false;
  errorText: string | null = null;
  logs: LogNode[] = [];
  expandedAll = false;
  /** Technical name/key of the form whose change log is currently shown. */
  currentFormKey = "";
  /** Total tokens used by all recorded inferences of the current form (input / output / total). */
  totalTokensIn = 0;
  totalTokensOut = 0;
  totalTokens = 0;

  private readonly openHandler = (): void => this.open();

  private readonly cdr: ChangeDetectorRef;

  constructor(cdr: ChangeDetectorRef) {
    this.cdr = cdr;
  }

  // #region Lifecycle
  ngOnInit(): void {
    document.addEventListener("codbi:ai-assistant-log:open", this.openHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener("codbi:ai-assistant-log:open", this.openHandler);
  }
  // #endregion Lifecycle

  // #region Open / close / load
  onVisibleChange(v: boolean): void {
    this.visible = v;
    this.cdr.markForCheck();
  }

  close(): void {
    this.visible = false;
    this.cdr.markForCheck();
  }

  open(): void {
    this.visible = true;
    this.errorText = null;
    this.cdr.markForCheck();
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorText = null;
    // Only show the change log of the form that is currently being edited in the designer.
    this.currentFormKey = getCurrentFormKey();
    this.cdr.markForCheck();
    const headers: Record<string, string> = { "X-Action": "Log" };
    if (this.currentFormKey) {
      headers["X-Form-Key"] = this.currentFormKey;
    }
    getJQuery().ajax({
      url: `${this.baseUrl}plugin?name=CodBi_AICodBiAssistant`,
      type: "GET",
      headers,
      success: (response: unknown) => {
        this.loading = false;
        const raw = Array.isArray(response) ? (response as Array<Record<string, unknown>>) : [];
        this.totalTokensIn = raw.reduce((sum, entry) => sum + (Number(entry["tokensIn"]) || 0), 0);
        this.totalTokensOut = raw.reduce((sum, entry) => sum + (Number(entry["tokensOut"]) || 0), 0);
        this.totalTokens = this.totalTokensIn + this.totalTokensOut;
        this.logs = this.buildTree(raw);
        this.cdr.markForCheck();
      },
      error: (xhr: unknown) => {
        this.loading = false;
        const jq = xhr as { responseJSON?: { error?: string }; statusText?: string };
        this.errorText = jq.responseJSON?.error ?? jq.statusText ?? "Failed to load the change log.";
        this.cdr.markForCheck();
      },
    });
  }

  formatTimestamp(ts: string | undefined): string {
    if (!ts) {
      return "";
    }
    // The backend returns a JDBC timestamp like "2026-08-03 16:59:19.123" (space-separated) which
    // is not parsed reliably by all browsers; normalize to ISO before constructing a Date.
    const normalized = ts.includes(" ") ? ts.replace(" ", "T") : ts;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      return ts;
    }
    return date.toLocaleString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  /** Formats a token count for display (e.g. "1,234 tokens"). Empty when there is no count. */
  private formatTokens(tokens: number): string {
    if (!tokens || tokens <= 0) return "";
    return `${tokens.toLocaleString()} tokens`;
  }

  /** Formats an input/output token split (e.g. "In 1,200 / Out 340"). Empty when both are zero. */
  private formatTokenSplit(tokensIn: number, tokensOut: number): string {
    if (!tokensIn && !tokensOut) return "";
    return `In ${tokensIn.toLocaleString()} / Out ${tokensOut.toLocaleString()}`;
  }

  /** Formats a date-only string (e.g. "08/04/2026") from a backend timestamp. */
  private formatShortDate(ts: string | undefined): string {
    if (!ts) return "";
    const normalized = ts.includes(" ") ? ts.replace(" ", "T") : ts;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString([]);
  }

  /** The date range covered by the log: "(first inference – last inference)". */
  get inferenceRange(): string {
    if (this.logs.length === 0) return "";
    // Logs are ordered newest-first, so the chronological first is the last array element.
    const first = this.formatShortDate(this.logs[this.logs.length - 1].ts);
    const last = this.formatShortDate(this.logs[0].ts);
    if (!first || !last) return "";
    return `(${first} \u2013 ${last})`;
  }

  /** Toolbar counter: "N Inferences" plus the covered date range. */
  get countLabel(): string {
    const range = this.inferenceRange;
    return `${this.logs.length} Inferences${range ? ` ${range}` : ""}`;
  }

  /** Total input/output tokens used by all recorded inferences of the current form. */
  get totalTokensLabel(): string {
    if (!this.totalTokensIn && !this.totalTokensOut) return "";
    return `In ${this.totalTokensIn.toLocaleString()} / Out ${this.totalTokensOut.toLocaleString()} tokens`;
  }
  // #endregion Open / close / load

  /** Track function for the `*ngFor` over the log entries. */
  trackById(_index: number, node: LogNode): string {
    return node.id;
  }

  // #region Tree building
  private buildTree(logs: Array<Record<string, unknown>>): LogNode[] {
    return logs.map((entry, index) => {
      const entryId = `entry-${String(entry["id"] ?? index)}`;
      const prompt = String(entry["prompt"] ?? "");
      const children: LogNode[] = [
        {
          id: `${entryId}-prompt`,
          kind: "prompt",
          label: "Prompt",
          value: prompt,
          expanded: false,
        },
      ];
      const form = entry["form"] as Record<string, unknown> | undefined;
      if (form) {
        children.push(this.buildFormNode(form, entryId));
      }
      const workflow = entry["workflow"];
      if (Array.isArray(workflow) && workflow.length > 0) {
        children.push(this.buildWorkflowNode(workflow as Array<Record<string, unknown>>, entryId));
      }
      return {
        id: entryId,
        kind: "inference",
        label: this.formatTimestamp(String(entry["ts"] ?? "")),
        badge:
          this.formatTokenSplit(Number(entry["tokensIn"] ?? 0), Number(entry["tokensOut"] ?? 0)) ||
          this.formatTokens(Number(entry["tokens"] ?? 0)),
        ts: String(entry["ts"] ?? ""),
        value: prompt,
        children,
        expanded: false,
      };
    });
  }

  private buildFormNode(form: Record<string, unknown>, entryId: string): LogNode {
    const children: LogNode[] = [];
    const created = (form["widgetsCreated"] as Array<Record<string, unknown>> | undefined) ?? [];
    const removed = (form["widgetsRemoved"] as Array<Record<string, unknown>> | undefined) ?? [];
    const classes = (form["classesSet"] as Array<Record<string, unknown>> | undefined) ?? [];
    const attributes = (form["attributesSet"] as Array<Record<string, unknown>> | undefined) ?? [];

    // Group the classes/attributes by widget name so they can be nested under the widgets.
    const classesByWidget = new Map<string, string[]>();
    const attributesByWidget = new Map<string, Array<Record<string, unknown>>>();
    const classNameByWidget = new Map<string, string>();
    for (const entry of classes) {
      const name = String(entry["widget"] ?? "");
      if (!name) continue;
      classesByWidget.set(name, Array.isArray(entry["classes"]) ? (entry["classes"] as string[]) : []);
      classNameByWidget.set(name, String(entry["className"] ?? ""));
    }
    for (const entry of attributes) {
      const name = String(entry["widget"] ?? "");
      if (!name) continue;
      attributesByWidget.set(
        name,
        Array.isArray(entry["attributes"]) ? (entry["attributes"] as Array<Record<string, unknown>>) : [],
      );
      classNameByWidget.set(name, String(entry["className"] ?? "") || (classNameByWidget.get(name) ?? ""));
    }

    const createdNames = new Set(created.map((w) => String(w["name"])));
    const removedNames = new Set(removed.map((w) => String(w["name"])));
    // Widgets that already existed but had classes/attributes changed by the AI.
    const changedNames = [...new Set([...classesByWidget.keys(), ...attributesByWidget.keys()])].filter(
      (name) => !createdNames.has(name) && !removedNames.has(name),
    );

    if (created.length > 0) {
      children.push({
        id: `${entryId}-created`,
        kind: "section",
        label: `Widgets created (${created.length})`,
        children: created.map((widget, i) =>
          this.widgetDetailsNode(
            widget,
            `${entryId}-created-${i}`,
            classesByWidget.get(String(widget["name"])) ?? [],
            attributesByWidget.get(String(widget["name"])) ?? [],
          ),
        ),
        expanded: false,
      });
    }
    if (removed.length > 0) {
      children.push({
        id: `${entryId}-removed`,
        kind: "section",
        label: `Widgets removed (${removed.length})`,
        children: removed.map((widget, i) => this.widgetNode(widget, `${entryId}-removed-${i}`)),
        expanded: false,
      });
    }
    if (changedNames.length > 0) {
      children.push({
        id: `${entryId}-changed`,
        kind: "section",
        label: `Widgets changed (${changedNames.length})`,
        children: changedNames.map((name, i) => {
          const widget = { name, className: classNameByWidget.get(name) ?? "" } as Record<string, unknown>;
          return this.widgetDetailsNode(
            widget,
            `${entryId}-changed-${i}`,
            classesByWidget.get(name) ?? [],
            attributesByWidget.get(name) ?? [],
          );
        }),
        expanded: false,
      });
    }
    return { id: `${entryId}-form`, kind: "section", label: "Form", children, expanded: false };
  }

  private widgetNode(widget: Record<string, unknown>, id: string): LogNode {
    const className = String(widget["className"] ?? "");
    const name = String(widget["name"] ?? "");
    return { id, kind: "widget", label: name ? `${className} "${name}"` : className };
  }

  /** Whether a CSS class name belongs to a CodBi standard configuration. */
  private isCodbiClass(name: string): boolean {
    return name.startsWith("CodBi_") || name.startsWith("AI_");
  }

  /** A widget node whose Classes, Config and Attributes are nested as its sub-elements. */
  private widgetDetailsNode(
    widget: Record<string, unknown>,
    id: string,
    classes: string[],
    attributes: Array<Record<string, unknown>>,
  ): LogNode {
    const children: LogNode[] = [];
    // Top-level "Classes" node holding all CSS classes that are set on the element.
    if (classes.length > 0) {
      children.push({
        id: `${id}-classes`,
        kind: "section",
        label: `Classes (${classes.length})`,
        children: classes.map((cls, i) => ({
          id: `${id}-classes-${i}`,
          kind: "class",
          label: cls,
          // Flag CodBi classes so the tree can render a distinct (CodBi) icon for them.
          codbi: this.isCodbiClass(cls),
        })),
        expanded: false,
      });
    }
    // "Config" — the regular formcycle configuration attributes the AI generated/changed.
    const configAttributes = attributes.filter((a) => a["codbi"] !== true);
    if (configAttributes.length > 0) {
      children.push({
        id: `${id}-config`,
        kind: "section",
        label: `Config (${configAttributes.length})`,
        children: this.buildAttributeNodes(configAttributes, `${id}-config`),
        expanded: false,
      });
    }
    // "Attributes" — the CodBi attributes (data-cb-func / data-cb-*) the AI set on the element.
    const codbiAttributes = attributes.filter((a) => a["codbi"] === true);
    if (codbiAttributes.length > 0) {
      children.push({
        id: `${id}-attrs`,
        kind: "section",
        label: `Attributes (${codbiAttributes.length})`,
        children: this.buildAttributeNodes(codbiAttributes, `${id}-attrs`),
        expanded: false,
      });
    }
    const className = String(widget["className"] ?? "");
    const name = String(widget["name"] ?? "");
    return { id, kind: "widget", label: name ? `${className} "${name}"` : className, children, expanded: false };
  }

  /** Converts a widget's attribute list into tree nodes (special data-cb-func / data-cb-* handling). */
  private buildAttributeNodes(attributes: Array<Record<string, unknown>>, baseId: string): LogNode[] {
    const result: LogNode[] = [];
    attributes.forEach((attribute, i) => {
      const kind = String(attribute["kind"] ?? "attr");
      const childChildren: LogNode[] = [];
      // A data-cb-func node unfolds to show the CodBi parameters used by the functionality.
      if (kind === "func" && Array.isArray(attribute["params"])) {
        const params = attribute["params"] as Array<Record<string, unknown>>;
        params.forEach((param, pi) => {
          childChildren.push({
            id: `${baseId}-${i}-p${pi}`,
            kind: String(param["kind"] ?? "param"),
            label: String(param["name"] ?? ""),
            value: String(param["value"] ?? ""),
          });
        });
      }
      result.push({
        id: `${baseId}-${i}`,
        kind,
        label: String(attribute["name"] ?? ""),
        value: String(attribute["value"] ?? ""),
        // Propagate the CodBi flag so functionality (func) nodes render the CodBi logo icon.
        codbi: attribute["codbi"] === true,
        children: childChildren,
        expanded: false,
      });
    });
    return result;
  }

  private buildWorkflowNode(workflow: Array<Record<string, unknown>>, entryId: string): LogNode {
    const children: LogNode[] = [];
    workflow.forEach((element, i) => {
      const baseId = `${entryId}-workflow-${i}`;
      const childChildren: LogNode[] = [];

      if (Array.isArray(element["elements"])) {
        // New path-based format: { name, trigger, elements, status }.
        // Trigger
        const trigger = element["trigger"] as Record<string, unknown> | undefined;
        const triggerChildren: LogNode[] = [];
        if (trigger) {
          const triggerType = String(trigger["type"] ?? "");
          if (triggerType) {
            triggerChildren.push({
              id: `${baseId}-trigger-type`,
              kind: "param-item",
              label: "Type",
              value: triggerType,
            });
          }
          const triggerParams = (trigger["params"] ?? {}) as Record<string, unknown>;
          for (const [key, value] of Object.entries(triggerParams)) {
            triggerChildren.push({
              id: `${baseId}-trigger-${key}`,
              kind: "param-item",
              label: key,
              value: typeof value === "object" && value !== null ? JSON.stringify(value) : String(value),
            });
          }
        }
        childChildren.push({
          id: `${baseId}-trigger`,
          kind: "section",
          label: "Trigger",
          children: triggerChildren,
          expanded: false,
        });

        // Path elements
        const elements = element["elements"] as Array<Record<string, unknown>>;
        const elementChildren: LogNode[] = elements.map((el, ei) => {
          const elChildren: LogNode[] = [];
          const params = (el["params"] ?? {}) as Record<string, unknown>;
          for (const [key, value] of Object.entries(params)) {
            elChildren.push({
              id: `${baseId}-elem-${ei}-${key}`,
              kind: "param-item",
              label: key,
              value: typeof value === "object" && value !== null ? JSON.stringify(value) : String(value),
            });
          }
          return {
            id: `${baseId}-elem-${ei}`,
            kind: "node",
            label: `${String(el["nodeType"] ?? "")} "${String(el["name"] ?? "")}"`,
            children: elChildren,
            expanded: false,
          };
        });
        childChildren.push({
          id: `${baseId}-elements`,
          kind: "section",
          label: `Path elements (${elementChildren.length})`,
          children: elementChildren,
          expanded: false,
        });

        // Status
        const status = element["status"] as Record<string, unknown> | undefined;
        const statusChildren: LogNode[] = [];
        if (status) {
          const stateName = String(status["endpointState"] ?? "");
          const stateType = String(status["endpointType"] ?? "");
          if (stateName)
            statusChildren.push({ id: `${baseId}-status-state`, kind: "param-item", label: "State", value: stateName });
          if (stateType)
            statusChildren.push({ id: `${baseId}-status-type`, kind: "param-item", label: "Type", value: stateType });
          const stateProps = (status["stateProperties"] ?? {}) as Record<string, unknown>;
          for (const [key, value] of Object.entries(stateProps)) {
            statusChildren.push({
              id: `${baseId}-status-${key}`,
              kind: "param-item",
              label: key,
              value: typeof value === "object" && value !== null ? JSON.stringify(value) : String(value),
            });
          }
        }
        childChildren.push({
          id: `${baseId}-status`,
          kind: "section",
          label: "Status",
          children: statusChildren,
          expanded: false,
        });

        children.push({
          id: baseId,
          kind: "node",
          label: `Path "${String(element["name"] ?? "")}"`,
          children: childChildren,
          expanded: false,
        });
      } else {
        // Legacy flat format: a single node with its parameters.
        const params = (element["params"] ?? {}) as Record<string, unknown>;
        const paramChildren: LogNode[] = [];
        for (const [key, value] of Object.entries(params)) {
          paramChildren.push({
            id: `${baseId}-${key}`,
            kind: "param-item",
            label: key,
            value: typeof value === "object" && value !== null ? JSON.stringify(value) : String(value),
          });
        }
        children.push({
          id: baseId,
          kind: "node",
          label: `${String(element["nodeType"] ?? "")} "${String(element["name"] ?? "")}"`,
          children: paramChildren,
          expanded: false,
        });
      }
    });
    return {
      id: `${entryId}-workflow`,
      kind: "section",
      label: `Workflow (${workflow.length})`,
      children,
      expanded: false,
    };
  }
  // #endregion Tree building

  // #region Expand / collapse all
  toggleAll(): void {
    this.expandedAll = !this.expandedAll;
    // Build new node objects (new references) so the OnPush recursive tree components re-render
    // their `[open]` bindings when the expanded state changes.
    this.logs = this.setAllExpanded(this.logs, this.expandedAll);
    this.cdr.markForCheck();
  }

  private setAllExpanded(nodes: LogNode[], expanded: boolean): LogNode[] {
    return nodes.map((node) => ({
      ...node,
      expanded,
      children:
        node.children && node.children.length > 0 ? this.setAllExpanded(node.children, expanded) : node.children,
    }));
  }
  // #endregion Expand / collapse all
}
