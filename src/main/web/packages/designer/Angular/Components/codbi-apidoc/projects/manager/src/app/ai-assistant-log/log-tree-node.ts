import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewEncapsulation } from "@angular/core";

/** One node of the change-log tree rendered by the log dialog. */
export interface LogNode {
  /** Stable, unique id used for Angular tracking. */
  id: string;
  /** Human-readable label shown next to the icon (e.g. widget name, attribute name). */
  label: string;
  /**
   * Kind controls the icon and color:
   * `inference`, `prompt`, `section`, `widget`, `class`, `attr`, `func`, `param`, `node`,
   * `param-item`.
   */
  kind: string;
  /** Optional secondary value shown after the label (e.g. the attribute value). */
  value?: string;
  /** Optional small badge shown next to the label (e.g. the token count). */
  badge?: string;
  /** Raw timestamp of an inference node (used to compute the log's date range). */
  ts?: string;
  /** True for `class` nodes whose CSS class belongs to a CodBi standard configuration. */
  codbi?: boolean;
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
        (toggle)="onToggle($event)">
      <summary class="cb-log-node__summary">
        <span
            class="cb-log-node__icon cb-log-node__icon--{{ node.kind }}"
            [class.cb-log-node__icon--codbi]="isCodbiNode(node)">
          @if (isCodbiNode(node)) {
            <img
                class="cb-log-node__icon-img"
                [src]="codbiLogoUrl"
                alt="CodBi"
                title="CodBi" />
          } @else {
            <i [class]="iconClass(node.kind)" aria-hidden="true"></i>
          }
        </span>
        <span class="cb-log-node__label">{{ node.label }}</span>
        @if (node.badge) {
          <span class="cb-log-node__badge" title="Tokens used">{{ node.badge }}</span>
        }
        @if (node.value && node.kind !== 'prompt') {
          <span class="cb-log-node__value">{{ node.value }}</span>
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
      </summary>
      @if (node.kind === 'prompt' && node.value) {
        <div class="cb-log-node__prompt">{{ node.value }}</div>
      }
      @if (node.children?.length) {
        <div class="cb-log-node__children">
          @for (child of node.children; track child.id) {
            <cb-log-node [node]="child" />
          }
        </div>
      }
    </details>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogTreeNode {
  @Input() node!: LogNode;

  private readonly baseUrl = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  /** CodBi logo used as the icon for CodBi CSS class nodes (same resource as the dialog header). */
  readonly codbiLogoUrl =
    `${this.baseUrl}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg`;

  private readonly cdr: ChangeDetectorRef;

  constructor(cdr: ChangeDetectorRef) {
    this.cdr = cdr;
  }

  onToggle(event: Event): void {
    const details = event.target as HTMLDetailsElement | null;
    this.node.expanded = details?.open ?? false;
    this.cdr.markForCheck();
  }

  /** A node is expandable when it has children or renders a prompt body. */
  isExpandable(node: LogNode): boolean {
    return !!node.children?.length || (node.kind === "prompt" && !!node.value);
  }

  /** True for nodes that belong to a CodBi functionality or CSS class (rendered with the CodBi logo). */
  isCodbiNode(node: LogNode): boolean {
    return node.codbi === true && (node.kind === "class" || node.kind === "func");
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
      case "node":
        return "pi pi-sitemap";
      default:
        return "pi pi-circle";
    }
  }
}
