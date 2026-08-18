import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
} from "@angular/core";

/** One node of the change-log tree rendered by the log dialog. */
export interface LogNode {
  /** Stable, unique id used for Angular tracking. */
  id: string;
  /** Human-readable label shown next to the icon (e.g. widget name, attribute name). */
  label: string;
  /** Login name of the user who ran the inference (top-level rows) — rendered in darkorange. */
  userLabel?: string;
  /** Readable name of the AI model used for this inference (top-level rows) — shown under the user. */
  modelLabel?: string;
  /**
   * Kind controls the icon and color:
   * `inference`, `prompt`, `section`, `widget`, `class`, `attr`, `func`, `param`, `node`,
   * `param-item`.
   */
  kind: string;
  /** Optional secondary value shown after the label (e.g. the attribute value). */
  value?: string;
  /** True when the label contains line breaks that must be preserved (e.g. clarification questions). */
  multiline?: boolean;
  /** True when a long value (e.g. a clarification answer) is expanded to show the complete text. */
  valueExpanded?: boolean;
  /** Optional small badge shown next to the label (e.g. the token count). */
  badge?: string;
  /** Raw timestamp of an inference node (used to compute the log's date range). */
  ts?: string;
  /** Raw backend entry of an inference node, used for the per-entry JSON export. */
  raw?: Record<string, unknown>;
  /** True for `class` nodes whose CSS class belongs to a CodBi standard configuration. */
  codbi?: boolean;
  /** True for nodes marked as sensitive (from `AI_Log_SensitiveElements`) — rendered with a lightning icon. */
  highlighted?: boolean;
  /**
   * True for nodes whose label/value matches a configured sensitive element (`AI_Log_SensitiveElements`).
   * Unlike [highlighted] (transient, from the last inference's auto-open) this flag is **always**
   * applied on every log load and rendered with a persistent red border.
   */
  sensitive?: boolean;
  /** True when the user ticked the node's checkbox to dismiss its sensitive marking. */
  checked?: boolean;
  /** The id of the inference (log entry) this node belongs to — set while marking sensitive nodes. */
  entryId?: string;
  /** The sensitive element names (lowercased) this node's label/value matched — set while marking. */
  sensitiveNames?: string[];
  /** Login name of the user who checked this sensitive node (shown on the "checked by" badge). */
  checkedBy?: string;
  /** Formatted date/time when this sensitive node was checked (shown on the "checked by" badge). */
  checkedAt?: string;
  /** True for workflow SQL nodes whose destructive statement was blocked by CodBi. */
  blockedSql?: boolean;
  /** The statement/DDL reasons that triggered the block (e.g. ["DROP", "TRUNCATE"]). */
  blockedSqlReasons?: string[];
  children?: LogNode[];
  expanded?: boolean;
}

/**
 * Recursive tree node used by the AiAssistantLog dialog. Renders an expandable `<details>` element
 * (or a plain leaf when there are no children) and re-renders itself for every child, producing a
 * collapsible treeview.
 */
@Component({
  selector: "cb-log-node",
  standalone: true,
  imports: [LogTreeNode],
  template: `
    <details
        class="cb-log-node"
        [open]="node.expanded ?? false"
        [class.cb-log-node--leaf]="!isExpandable(node)"
        [class.cb-log-node--sensitive]="node.sensitive === true"
        [class.cb-log-node--blocked]="node.blockedSql === true"
        (toggle)="onToggle($event)">
      <summary class="cb-log-node__summary">
        @if (node.sensitive === true) {
          <input
              type="checkbox"
              class="cb-log-node__sensitive-check"
              [checked]="node.checked === true"
              (change)="onSensitiveCheckedChange($event)"
              title="Mark as checked — remove the sensitive marking" />
        }
        <span
            class="cb-log-node__icon cb-log-node__icon--{{ node.kind }}"
            [class.cb-log-node__icon--codbi]="isCodbiNode(node)"
            [class.cb-log-node__icon--highlighted]="node.highlighted === true"
            [class.cb-log-node__icon--blocked]="node.blockedSql === true">
          @if (node.blockedSql === true) {
            <i class="pi pi-exclamation-triangle cb-log-node__blocked-icon" aria-hidden="true" title="Destructive SQL statement blocked by CodBi"></i>
          } @else if (node.highlighted === true) {
            <i class="pi pi-bolt cb-log-node__highlight-icon" aria-hidden="true" title="Sensitive element"></i>
          } @else if (isCodbiNode(node)) {
            <img
                class="cb-log-node__icon-img"
                [src]="codbiLogoUrl"
                alt="CodBi"
                title="CodBi" />
          } @else {
            <i [class]="iconClass(node.kind)" aria-hidden="true"></i>
          }
        </span>
        <span class="cb-log-node__label" [class.cb-log-node__label--stacked]="node.kind === 'inference' && !!node.userLabel">
          <span
              class="cb-log-node__label-text"
              [class.cb-log-node__label-text--pre]="node.multiline === true">{{ node.label }}</span>
          @if (node.userLabel) {
            <span class="cb-log-node__user" title="User who ran this inference">{{ node.userLabel }}</span>
          }
          @if (node.modelLabel) {
            <span class="cb-log-node__model" title="Model used for this inference">{{ node.modelLabel }}</span>
          }
        </span>
        @if (node.blockedSql === true) {
          <span class="cb-log-node__blocked-badge" [title]="blockedSqlTitle(node)">
            <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
            {{ blockedSqlTitle(node) }}
          </span>
        }
        @if (node.badge) {
          <span class="cb-log-node__badge" title="Tokens used">{{ node.badge }}</span>
        }
        @if (node.value && node.kind !== 'prompt') {
          @if (node.valueExpanded !== true) {
            <span class="cb-log-node__value">{{ node.value }}</span>
          }
          @if (node.kind !== 'inference' && valueIsLong(node)) {
            <button
                type="button"
                class="cb-log-node__value-toggle"
                [attr.title]="node.valueExpanded === true ? 'Hide full value' : 'Show full value'"
                aria-label="Toggle full value"
                (click)="toggleValue($event)">
              <i [class]="node.valueExpanded === true ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" aria-hidden="true"></i>
            </button>
          }
        }
        @if (node.checked === true && node.checkedBy) {
          <span class="cb-log-node__checked-badge" [title]="'Checked by ' + node.checkedBy + ' on ' + (node.checkedAt ?? '')">
            <i class="pi pi-check-circle" aria-hidden="true"></i>
            <span class="cb-log-node__checked-text">checked by {{ node.checkedBy }} on {{ node.checkedAt }}</span>
          </span>
        }
        @if (node.children?.length) {
          <button
              type="button"
              class="cb-log-node__expand"
              [attr.title]="subtreeExpanded(node) ? 'Collapse all sub-nodes' : 'Expand all sub-nodes'"
              (click)="toggleChildren($event)">
            <i
                [class]="subtreeExpanded(node) ? 'pi pi-angle-double-up' : 'pi pi-angle-double-down'"
                aria-hidden="true"></i>
          </button>
        }
        @if (node.kind === 'inference' && node.raw) {
          <button
              type="button"
              class="cb-log-node__export"
              title="Export this log entry as JSON"
              (click)="exportEntry($event)">
            <i class="pi pi-download" aria-hidden="true"></i>
          </button>
        }
      </summary>
      @if (node.kind === 'prompt' && node.value) {
        <div class="cb-log-node__prompt">
          <button
              type="button"
              class="cb-log-node__prompt-copy"
              [attr.title]="promptCopied ? 'Copied' : 'Copy this prompt to the clipboard'"
              aria-label="Copy prompt"
              (click)="copyPrompt($event)">
            <i [class]="promptCopied ? 'pi pi-check' : 'pi pi-copy'" aria-hidden="true"></i>
          </button>
          <button
              type="button"
              class="cb-log-node__prompt-max"
              title="Open the full prompt text in a dialog"
              aria-label="Open the full prompt in a dialog"
              (click)="openPromptDialog($event)">
            <i class="pi pi-window-maximize" aria-hidden="true"></i>
          </button>
          <span class="cb-log-node__prompt-text">{{ node.value }}</span>
        </div>
      }
      @if (node.children?.length) {
        <div class="cb-log-node__children">
          @for (child of node.children; track child.id) {
            <cb-log-node
                [node]="child"
                (sensitiveChecked)="sensitiveChecked.emit($event)"
                (promptOpen)="promptOpen.emit($event)" />
          }
        </div>
      }
    </details>
    @if (node.valueExpanded === true && node.value && node.kind !== 'prompt') {
      <div class="cb-log-node__value-full">{{ node.value }}</div>
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogTreeNode {
  @Input() node!: LogNode;
  /** Emitted when the user ticks/untickes a sensitive node's dismiss checkbox. */
  @Output() sensitiveChecked = new EventEmitter<LogNode>();
  /** Emitted with the prompt text when the user requests the full-prompt viewer. The dialog itself
   *  is rendered once by the parent AiAssistantLog (a proper top-level popup, appended to body) so
   *  it is never positioned relative to this recursive tree node / the scrollable list container. */
  @Output() promptOpen = new EventEmitter<string>();

  private readonly baseUrl = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  /** CodBi logo used as the icon for CodBi CSS class nodes (same resource as the dialog header). */
  readonly codbiLogoUrl =
    `${this.baseUrl}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg`;

  private readonly cdr: ChangeDetectorRef;

  constructor(cdr: ChangeDetectorRef) {
    this.cdr = cdr;
  }

  /** True for a short moment after the prompt was copied (shows a check icon on the copy button). */
  promptCopied = false;
  private promptCopyTimer: number | null = null;

  onToggle(event: Event): void {
    const details = event.target as HTMLDetailsElement | null;
    this.node.expanded = details?.open ?? false;
    this.cdr.markForCheck();
  }

  /**
   * Toggles a sensitive node's dismiss checkbox. When ticked the node's sensitive marking (red
   * border) and any transient bolt are removed locally and the change is emitted so the parent can
   * remember the node as acknowledged (it stays unmarked on later loads). Unticking re-marks it.
   */
  onSensitiveCheckedChange(event: Event): void {
    const checked = (event.target as HTMLInputElement | null)?.checked ?? false;
    this.node.checked = checked;
    this.node.sensitive = !checked;
    if (checked) {
      this.node.highlighted = false;
    }
    this.sensitiveChecked.emit(this.node);
    this.cdr.markForCheck();
  }

  /** A node is expandable when it has children or renders a prompt body. */
  isExpandable(node: LogNode): boolean {
    return !!node.children?.length || (node.kind === "prompt" && !!node.value);
  }

  /** True when the node's value is long enough to warrant an expand/collapse toggle. */
  valueIsLong(node: LogNode): boolean {
    return typeof node.value === "string" && node.value.length > 60;
  }

  /** Expands/collapses a long node value, revealing the complete text in a body below the row. */
  toggleValue(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.node = { ...this.node, valueExpanded: this.node.valueExpanded !== true };
    this.cdr.markForCheck();
  }

  /** True for nodes that belong to a CodBi functionality or CSS class (rendered with the CodBi logo). */
  isCodbiNode(node: LogNode): boolean {
    return node.codbi === true && (node.kind === "class" || node.kind === "func");
  }

  /** Human-readable message shown on a blocked SQL node (destructive statement replaced by CodBi). */
  blockedSqlTitle(node: LogNode): string {
    const reasons = (node.blockedSqlReasons ?? []).filter((r) => r && r.length > 0);
    const suffix = reasons.length > 0 ? ` (NO ${reasons.join(", ")} allowed)` : "";
    return `Destructive SQL statement blocked by CodBi${suffix}`;
  }

  /** True when this node and all of its descendants are expanded. */
  subtreeExpanded(node: LogNode): boolean {
    if (!node.children?.length) return true;
    if (!node.expanded) return false;
    return node.children.every((child) => this.subtreeExpanded(child));
  }

  /**
   * Expands or collapses this node and its entire sub-tree. New node objects (new references) are
   * created so the OnPush recursive tree components re-render their `[open]` bindings.
   */
  toggleChildren(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const expand = !this.subtreeExpanded(this.node);
    this.node = this.withExpanded(this.node, expand);
    this.cdr.markForCheck();
  }

  /** Downloads this inference entry's raw backend data as a JSON file. */
  exportEntry(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (!this.node.raw) {
      return;
    }
    const blob = new Blob([JSON.stringify(this.node.raw, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = (this.node.ts ?? "").replace(/[^\d]/g, "");
    a.download = ts ? `codbi-ai-log-entry-${ts}.json` : `codbi-ai-log-entry-${this.node.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** Opens the full-prompt viewer. The dialog itself lives once in the parent (AiAssistantLog) as a
   *  proper top-level popup (appended to body, centered) exactly like the chat/clarification
   *  dialogs — a dialog rendered inside this recursive tree node would be positioned relative to
   *  the scrollable list container and land off its top-left corner. */
  openPromptDialog(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.promptOpen.emit(this.node.value ?? "");
  }

  /** Copies the unfolded prompt body to the clipboard (with fallback + brief check feedback). */
  copyPrompt(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const text = this.node.value ?? "";
    if (!text) return;
    const done = (): void => {
      this.promptCopied = true;
      this.cdr.markForCheck();
      if (this.promptCopyTimer !== null) window.clearTimeout(this.promptCopyTimer);
      this.promptCopyTimer = window.setTimeout(() => {
        this.promptCopied = false;
        this.cdr.markForCheck();
      }, 1500);
    };
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard
        .writeText(text)
        .then(done)
        .catch(() => {
          window.prompt("Copy this prompt", text);
        });
    } else {
      window.prompt("Copy this prompt", text);
    }
  }

  private withExpanded(node: LogNode, expanded: boolean): LogNode {
    return {
      ...node,
      expanded,
      children: node.children?.map((child) => this.withExpanded(child, expanded)),
    };
  }

  iconClass(kind: string): string {
    switch (kind) {
      case "inference":
        return "pi pi-clock";
      case "prompt":
        return "pi pi-comment";
      case "section":
        return "pi pi-folder-open";
      case "widget":
        return "pi pi-th-large";
      case "class":
        return "pi pi-hashtag";
      case "attr":
        return "pi pi-tag";
      case "func":
        return "pi pi-bolt";
      case "param":
      case "param-item":
        return "pi pi-cog";
      case "var":
        return "pi pi-globe";
      case "node":
        return "pi pi-sitemap";
      default:
        return "pi pi-circle";
    }
  }
}
