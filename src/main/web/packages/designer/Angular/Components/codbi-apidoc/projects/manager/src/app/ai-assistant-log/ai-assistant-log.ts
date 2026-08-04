// #region Imports
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from "@angular/core";
import type { OnDestroy, OnInit } from "@angular/core";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { Message } from "primeng/message";
import { ProgressSpinner } from "primeng/progressspinner";
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
 * - **Form**: `Widgets created` / `Widgets removed`, then `Classes set` and `Attributes set`.
 *   The CodBi `data-cb-func` and `data-cb-*` attributes are marked with distinct icons; unfolding
 *   a `data-cb-func` node reveals the CodBi parameters used by the functionality.
 * - **Workflow**: one node per created workflow element; unfolding a node reveals the parameters
 *   defined for it.
 */
@Component({
  selector: "cb-ai-assistant-log",
  standalone: true,
  imports: [Dialog, Button, ProgressSpinner, Message, LogTreeNode],
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
  // #endregion Open / close / load

  // #region Tree building
  private buildTree(logs: Array<Record<string, unknown>>): LogNode[] {
    return logs.map((entry, index) => {
      const entryId = `entry-${String(entry["id"] ?? index)}`;
      const children: LogNode[] = [];
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
        value: String(entry["prompt"] ?? ""),
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

  /** A widget node whose Classes and Attributes are nested as its sub-elements. */
  private widgetDetailsNode(
    widget: Record<string, unknown>,
    id: string,
    classes: string[],
    attributes: Array<Record<string, unknown>>,
  ): LogNode {
    const children: LogNode[] = [];
    if (classes.length > 0) {
      children.push({
        id: `${id}-classes`,
        kind: "class",
        label: "Classes",
        value: classes.join(", "),
      });
    }
    if (attributes.length > 0) {
      children.push({
        id: `${id}-attrs`,
        kind: "section",
        label: "Attributes",
        children: this.buildAttributeNodes(attributes, `${id}-attrs`),
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
        children: childChildren,
        expanded: false,
      });
    });
    return result;
  }

  private buildWorkflowNode(workflow: Array<Record<string, unknown>>, entryId: string): LogNode {
    const children: LogNode[] = [];
    workflow.forEach((element, i) => {
      const childChildren: LogNode[] = [];
      const params = (element["params"] ?? {}) as Record<string, unknown>;
      for (const [key, value] of Object.entries(params)) {
        childChildren.push({
          id: `${entryId}-workflow-${i}-${key}`,
          kind: "param-item",
          label: key,
          value: typeof value === "object" && value !== null ? JSON.stringify(value) : String(value),
        });
      }
      children.push({
        id: `${entryId}-workflow-${i}`,
        kind: "node",
        label: `${String(element["nodeType"] ?? "")} "${String(element["name"] ?? "")}"`,
        children: childChildren,
        expanded: false,
      });
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
