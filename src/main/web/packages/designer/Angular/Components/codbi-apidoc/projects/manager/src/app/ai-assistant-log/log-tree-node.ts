import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewEncapsulation } from "@angular/core";

/** One node of the change-log tree rendered by the log dialog. */
export interface LogNode {
  /** Stable, unique id used for Angular tracking. */
  id: string;
  /** Human-readable label shown next to the icon (e.g. widget name, attribute name). */
  label: string;
  /**
   * Kind controls the icon and color:
   * `inference`, `section`, `widget`, `class`, `attr`, `func`, `param`, `node`, `param-item`.
   */
  kind: string;
  /** Optional secondary value shown after the label (e.g. the attribute value). */
  value?: string;
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
        [class.cb-log-node--leaf]="!node.children?.length"
        (toggle)="onToggle($event)">
      <summary class="cb-log-node__summary">
        <span class="cb-log-node__icon cb-log-node__icon--{{ node.kind }}">
          <i [class]="iconClass(node.kind)" aria-hidden="true"></i>
        </span>
        <span class="cb-log-node__label">{{ node.label }}</span>
        @if (node.value) {
          <span class="cb-log-node__value">{{ node.value }}</span>
        }
      </summary>
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

  private readonly cdr: ChangeDetectorRef;

  constructor(cdr: ChangeDetectorRef) {
    this.cdr = cdr;
  }

  onToggle(event: Event): void {
    const details = event.target as HTMLDetailsElement | null;
    this.node.expanded = details?.open ?? false;
    this.cdr.markForCheck();
  }

  iconClass(kind: string): string {
    switch (kind) {
      case "inference":
        return "pi pi-clock";
      case "section":
        return "pi pi-folder-open";
      case "widget":
        return "pi pi-th-large";
      case "class":
        return "pi pi-hashtag";
      case "attr":
        return "pi pi-pencil";
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
