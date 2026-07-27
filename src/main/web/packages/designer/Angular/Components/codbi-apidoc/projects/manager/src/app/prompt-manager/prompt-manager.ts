// #region Imports
import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { Message } from "primeng/message";
import { TreeModule } from "primeng/tree";
import type { TreeNode } from "primeng/api";
import { Textarea } from "primeng/textarea";
// #endregion

// #region Interfaces
interface PromptRecord {
  promptKey: string;
  displayName: string | null;
  category: string | null;
  promptText: string | null;
  originalText: string | null;
  prePrompt: string | null;
  postPrompt: string | null;
  isActive: boolean;
  prePromptActive: boolean;
  postPromptActive: boolean;
}

interface PromptExport {
  prompt_key: string;
  display_name: string;
  prompt_text: string;
  pre_prompt: string;
  post_prompt: string;
  category: string;
}
// #endregion

/**
 * Prompt Manager — Angular component that displays all AI system prompts in a tree view + card
 * layout. Prompts with `##` sub-sections are split into individual items. Only leaf items show a
 * card; categories/subcategories select the first editable child silently.
 */
@Component({
  selector: "cb-prompt-manager",
  standalone: true,
  imports: [CommonModule, FormsModule, Button, Dialog, Message, TreeModule, Textarea],
  templateUrl: "./prompt-manager.html",
  styleUrl: "./prompt-manager.scss",
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptManager implements OnInit, OnDestroy {
  private readonly baseUrl = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  private readonly servletUrl = `${this.baseUrl}plugin?name=CodBi_AIPromptManager`;
  readonly logoUrl =
    `${this.baseUrl}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg`;

  // #region State
  visible = false;
  loading = false;
  errorText: string | null = null;
  successText: string | null = null;

  /** All prompts fetched from the backend. */
  allPrompts: PromptRecord[] = [];

  /** Tree nodes (category → subcategory → item). */
  treeNodes: TreeNode[] = [];

  /** The selected tree node's data key (prompt_key). */
  selectedKey: string | null = null;

  /** The prompt record currently shown in the card. */
  activeRecord: PromptRecord | null = null;

  /** Local edit buffers for the card. */
  editDisplayName = "";
  editPrePrompt = "";
  editPromptText = "";
  editPostPrompt = "";

  /** Local toggle states for pre/post prompt activity (independent of main isActive). */
  editPrePromptActive = true;
  editPostPromptActive = true;

  /** Filter mode: true = show all items, false = active only. */
  showAllMode = true;

  /** Filter mode: true = show only inactive items. */
  showInactiveOnly = false;

  /** View mode: "detailed" (codbi_ai_prompt) or "condensed" (codbi_compact_prompt). */
  viewMode: "detailed" | "condensed" = "detailed";

  /** Storage key prefix for persisting pre/post active states in localStorage. */
  private static readonly LS_PRE = "cb_pm_pre_";
  private static readonly LS_POST = "cb_pm_post_";
  // #endregion

  private readonly openHandler = (): void => this.open();

  constructor(
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  // #region Lifecycle
  ngOnInit(): void {
    document.addEventListener("codbi:prompt-manager:open", this.openHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener("codbi:prompt-manager:open", this.openHandler);
  }
  // #endregion

  // #region Open / Load
  open(): void {
    this.visible = true;
    this.errorText = null;
    this.successText = null;
    this.loadPrompts();
    this.cdr.markForCheck();
  }

  close(): void {
    this.visible = false;
    this.selectedKey = null;
    this.activeRecord = null;
    this.cdr.markForCheck();
  }

  private loadPrompts(): void {
    this.loading = true;
    this.errorText = null;
    this.http
      .get<{ status: string; prompts: PromptRecord[] }>(this.servletUrl, {
        headers: { "X-Action": "ListAll", "X-View": this.xView() },
      })
      .subscribe({
        next: (res) => {
          // #region Restore pre/post active states — prefer DB (from backend), fall back to localStorage
          const incoming = res.prompts ?? [];
          for (const p of incoming) {
            const fromDb = p.prePromptActive !== undefined && p.prePromptActive !== null;
            if (!fromDb) {
              const lsPre = localStorage.getItem(`${PromptManager.LS_PRE}${p.promptKey}`);
              p.prePromptActive = lsPre !== null ? lsPre === "true" : true;
            }
            const fromDbPost = p.postPromptActive !== undefined && p.postPromptActive !== null;
            if (!fromDbPost) {
              const lsPost = localStorage.getItem(`${PromptManager.LS_POST}${p.promptKey}`);
              p.postPromptActive = lsPost !== null ? lsPost === "true" : true;
            }
          }
          // #endregion
          this.allPrompts = incoming;
          this.buildTree();
          this.loading = false;
          if (this.selectedKey) {
            const found = this.allPrompts.find((p) => p.promptKey === this.selectedKey);
            if (found && this.isItemKey(found.promptKey)) {
              this.selectPrompt(found);
            } else {
              this.selectFirstItem();
            }
          } else {
            this.selectFirstItem();
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorText = `Failed to load prompts: ${err.message}`;
          this.cdr.markForCheck();
        },
      });
  }

  /** Returns the X-View header value for API requests. */
  private xView(): string {
    return this.viewMode;
  }

  /** Switches between condensed and detailed view mode. */
  switchView(mode: "detailed" | "condensed"): void {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    this.selectedKey = null;
    this.activeRecord = null;
    this.loadPrompts();
    this.cdr.markForCheck();
  }

  /** Toggles filter mode between All / Active / InActive. */
  toggleFilterMode(): void {
    this.buildTree();
    this.cdr.markForCheck();
  }

  /**
   * Builds a 3-level tree with filter support.
   * - showAllMode=true, showInactiveOnly=false: show all items
   * - showAllMode=false, showInactiveOnly=false: show only active items
   * - showInactiveOnly=true: show only inactive items
   * Category labels use proper casing (e.g., "codbi" → "CodBi").
   * Subcategory/item labels omit the category prefix.
   * Inactive items show a red cross icon in the tree.
   */
  private buildTree(): void {
    const categories = new Map<string, Map<string, TreeNode[]>>();
    this.activeMap.clear();

    for (const p of this.allPrompts) {
      this.activeMap.set(p.promptKey, p.isActive);
      // Filter: skip based on current mode
      if (this.showInactiveOnly && p.isActive) continue;
      if (!this.showAllMode && !this.showInactiveOnly && !p.isActive) continue;

      const parts = p.promptKey.split(".");
      const cat = parts[0];
      if (!categories.has(cat)) categories.set(cat, new Map());

      if (parts.length <= 2) {
        // Category-level leaf (e.g., "formcycle.general")
        const subMap = categories.get(cat)!;
        if (!subMap.has("")) subMap.set("", []);
        subMap.get("")!.push(this.makeTreeNode(p, cat));
      } else if (parts.length === 3) {
        // Subcategory (e.g., "codbi.functionalities") — add as item for tree display
        const subMap = categories.get(cat)!;
        if (!subMap.has(parts[1])) subMap.set(parts[1], []);
        subMap.get(parts[1])!.push(this.makeTreeNode(p, cat));
      } else {
        // Item under subcategory (e.g., "codbi.functionalities.ai_ocr")
        const subMap = categories.get(cat)!;
        const subKey = parts[1];
        if (!subMap.has(subKey)) subMap.set(subKey, []);
        subMap.get(subKey)!.push(this.makeTreeNode(p, cat));
      }
    }

    this.treeNodes = [];
    for (const [cat, subMap] of categories) {
      const catLabel = this.formatCategoryLabel(cat);
      const catNode: TreeNode = {
        label: catLabel,
        data: cat,
        type: "category",
        expanded: true,
        children: [],
      };

      for (const [subKey, items] of subMap) {
        if (subKey === "") {
          for (const item of items) {
            catNode.children!.push(item);
          }
        } else {
          const subLabel = subKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          const subNode: TreeNode = {
            label: subLabel,
            data: `${cat}.${subKey}`,
            type: "subcategory",
            expanded: true,
            children: items,
          };
          catNode.children!.push(subNode);
        }
      }

      this.treeNodes.push(catNode);
    }
  }

  private makeTreeNode(p: PromptRecord, category: string): TreeNode {
    const parts = p.promptKey.split(".");
    // Remove category prefix from label display
    const label = this.formatItemLabel(p, parts, category);
    const node: TreeNode = {
      label,
      data: p.promptKey,
      type: "item",
      leaf: true,
      key: p.promptKey,
    };
    return node;
  }

  private formatCategoryLabel(cat: string): string {
    // "codbi" → "CodBi", "formcycle" → "Formcycle"
    if (cat === "codbi") return "CodBi";
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  private formatItemLabel(p: PromptRecord, parts: string[], category: string): string {
    if (parts.length >= 4) {
      // Item under subcategory: show last part(s) without category prefix
      return parts
        .slice(2)
        .join(".")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    if (parts.length === 3) {
      // Subcategory: show the subcategory part
      return (
        p.displayName ??
        parts
          .slice(1)
          .join(".")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      );
    }
    // 2-part leaf: show display name or key without category
    return (
      p.displayName ??
      parts
        .slice(1)
        .join(".")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    );
  }

  /** Map of prompt_key → isActive for quick lookup in tree templates. */
  private activeMap = new Map<string, boolean>();

  /** Template helper — returns true if the tree node represents a fully inactive item (red cross). */
  isTreeNodeInactive(node: TreeNode): boolean {
    if (node.type !== "item") return false;
    const key = node.data as string;
    return key != null && this.activeMap.get(key) === false;
  }

  /**
   * Template helper — returns true if the tree node's main prompt is active
   * but one or both of pre/post prompts are inactive (yellow cross).
   */
  isTreeNodePartiallyInactive(node: TreeNode): boolean {
    if (node.type !== "item") return false;
    const key = node.data as string;
    if (key == null) return false;
    const isMainActive = this.activeMap.get(key);
    if (isMainActive === false || isMainActive === undefined) return false;
    const record = this.allPrompts.find((p) => p.promptKey === key);
    if (!record) return false;
    return record.prePromptActive === false || record.postPromptActive === false;
  }

  /** Auto-grows a textarea to fit its content. Bind to (input) event. */
  autoGrow(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }

  /** Resizes the pre-prompt textarea to fit its content. */
  autoResizePre(): void {
    const ta = document.querySelector<HTMLTextAreaElement>(".cb-pm-card-editor textarea:nth-of-type(1)");
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }

  /** Resizes the prompt textarea to fit its content. */
  autoResizePrompt(): void {
    const ta = document.querySelector<HTMLTextAreaElement>(".cb-pm-card-editor textarea:nth-of-type(2)");
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }

  /** Resizes the post-prompt textarea to fit its content. */
  autoResizePost(): void {
    const ta = document.querySelector<HTMLTextAreaElement>(".cb-pm-card-editor textarea:nth-of-type(3)");
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }

  // #region Splitter resize

  private splitterStartX = 0;
  private splitterStartWidth = 0;

  /** Starts dragging the splitter handle to resize the tree panel. */
  onSplitterMouseDown(event: MouseEvent): void {
    event.preventDefault();
    const treePanel = (event.target as HTMLElement)
      .closest(".cb-pm-layout")
      ?.querySelector(".cb-pm-tree-panel") as HTMLElement | null;
    if (!treePanel) return;
    this.splitterStartX = event.clientX;
    this.splitterStartWidth = treePanel.offsetWidth;

    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - this.splitterStartX;
      const newWidth = Math.max(150, Math.min(600, this.splitterStartWidth + delta));
      treePanel.style.width = `${newWidth}px`;
      treePanel.style.flex = "none";
      this.cdr.markForCheck();
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  // #endregion

  /** Returns true if the key represents a leaf item (editable card). Template-accessible. */
  isItemKey(key: string): boolean {
    const editableTwoPart = new Set(["formcycle.general", "codbi.general", "codbi.classify_intent"]);
    if (editableTwoPart.has(key)) return true;
    return key.split(".").length >= 3; // subcategory (3 parts) and items (4+) have cards
  }

  /** Template helper — returns true if the key is a category-level key (1 or 2 parts). */
  isCategoryKey(key: string): boolean {
    if (!key) return false;
    const parts = key.split(".");
    return parts.length <= 2;
  }
  // #endregion

  // #region Selection
  onNodeSelect(event: { node: TreeNode }): void {
    const key = event.node.data as string;
    if (!key) return;
    if (!this.isItemKey(key)) {
      // Category or subcategory without its own card — select first child item
      const firstChild = this.findFirstItemInTree(event.node);
      if (firstChild) {
        this.selectByKey(firstChild.data as string);
      } else {
        // No editable children — clear the card panel
        this.activeRecord = null;
        this.selectedKey = null;
        this.cdr.markForCheck();
      }
      return;
    }
    this.selectByKey(key);
  }

  private selectByKey(key: string): void {
    const found = this.allPrompts.find((p) => p.promptKey === key);
    if (found) this.selectPrompt(found);
  }

  private findFirstItemInTree(node: TreeNode): TreeNode | null {
    if (node.children) {
      for (const child of node.children) {
        if (child.type === "item" && child.leaf) return child;
        const found = this.findFirstItemInTree(child);
        if (found) return found;
      }
    }
    return null;
  }

  private selectPrompt(record: PromptRecord): void {
    this.selectedKey = record.promptKey;
    this.activeRecord = record;
    this.editDisplayName = record.displayName ?? record.promptKey;
    this.editPrePrompt = record.prePrompt ?? "";
    this.editPromptText = record.promptText ?? "";
    this.editPostPrompt = record.postPrompt ?? "";
    this.editPrePromptActive = record.prePromptActive ?? true;
    this.editPostPromptActive = record.postPromptActive ?? true;
    this.errorText = null;
    this.successText = null;
    this.cdr.markForCheck();
  }

  private selectFirstItem(): void {
    for (const p of this.allPrompts) {
      if (this.isItemKey(p.promptKey)) {
        this.selectPrompt(p);
        return;
      }
    }
  }
  // #endregion

  // #region Card Actions

  toggleActive(): void {
    const key = this.selectedKey;
    if (!key) return;
    this.loading = true;
    this.http
      .post<{ status: string; is_active: boolean }>(
        this.servletUrl,
        `body=${encodeURIComponent(JSON.stringify({ prompt_key: key }))}`,
        {
          headers: {
            "X-Action": "ToggleActive",
            "X-View": this.xView(),
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      )
      .subscribe({
        next: (res) => {
          if (this.activeRecord) {
            this.activeRecord.isActive = res.is_active;
          }
          // Also update allPrompts so buildTree() reads fresh data
          if (key) {
            const found = this.allPrompts.find((p) => p.promptKey === key);
            if (found) found.isActive = res.is_active;
          }
          this.loading = false;
          this.buildTree(); // Rebuild tree to reflect icon changes
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorText = `Toggle failed: ${err.message}`;
          this.cdr.markForCheck();
        },
      });
  }

  /** Toggles the pre-prompt active state locally (no backend call — included in next save). */
  togglePrePromptActive(): void {
    this.editPrePromptActive = !this.editPrePromptActive;
    this.cdr.markForCheck();
  }

  /** Toggles the post-prompt active state locally (no backend call — included in next save). */
  togglePostPromptActive(): void {
    this.editPostPromptActive = !this.editPostPromptActive;
    this.cdr.markForCheck();
  }

  save(): void {
    const key = this.selectedKey;
    if (!key) return;
    this.loading = true;
    this.errorText = null;
    this.successText = null;
    const body = JSON.stringify({
      prompt_key: key,
      display_name: this.editDisplayName,
      prompt_text: this.editPromptText,
      pre_prompt: this.editPrePrompt,
      post_prompt: this.editPostPrompt,
      is_active: this.activeRecord?.isActive ?? true,
      pre_prompt_active: this.editPrePromptActive,
      post_prompt_active: this.editPostPromptActive,
    });
    this.http
      .post<{ status: string }>(this.servletUrl, `body=${encodeURIComponent(body)}`, {
        headers: { "X-Action": "SaveOne", "X-View": this.xView(), "Content-Type": "application/x-www-form-urlencoded" },
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.successText = "Prompt saved successfully.";
          // #region Persist pre/post active states to localStorage (permanent across sessions)
          if (key) {
            localStorage.setItem(`${PromptManager.LS_PRE}${key}`, String(this.editPrePromptActive));
            localStorage.setItem(`${PromptManager.LS_POST}${key}`, String(this.editPostPromptActive));
            const localRecord = this.allPrompts.find((p) => p.promptKey === key);
            if (localRecord) {
              localRecord.prePromptActive = this.editPrePromptActive;
              localRecord.postPromptActive = this.editPostPromptActive;
            }
          }
          // #endregion
          this.loadPrompts();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorText = `Save failed: ${err.message}`;
          this.cdr.markForCheck();
        },
      });
  }

  restoreOriginal(): void {
    const key = this.selectedKey;
    if (!key) return;
    this.loading = true;
    this.errorText = null;
    this.successText = null;
    const body = JSON.stringify({ prompt_key: key });
    this.http
      .post<{ status: string }>(this.servletUrl, `body=${encodeURIComponent(body)}`, {
        headers: {
          "X-Action": "RestoreOriginal",
          "X-View": this.xView(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.successText = "Prompt restored to original.";
          this.loadPrompts();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorText = `Restore failed: ${err.message}`;
          this.cdr.markForCheck();
        },
      });
  }

  exportPrompt(): void {
    const key = this.selectedKey;
    if (!key) return;
    this.http
      .get<PromptExport>(this.servletUrl, {
        headers: { "X-Action": "Export", "X-View": this.xView() },
        params: { prompt_key: key },
      })
      .subscribe({
        next: (data) => {
          const json = JSON.stringify(data, null, 2);
          const blob = new Blob([json], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${key.replace(/\./g, "-")}.json`;
          a.click();
          URL.revokeObjectURL(url);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.errorText = `Export failed: ${err.message}`;
          this.cdr.markForCheck();
        },
      });
  }

  /** Exports all prompts whose key starts with the given prefix. */
  exportCategory(categoryKey: string): void {
    const filtered = categoryKey ? this.allPrompts.filter((p) => p.promptKey.startsWith(categoryKey)) : this.allPrompts;
    if (filtered.length === 0) return;
    const arr = filtered.map((p) => ({
      prompt_key: p.promptKey,
      display_name: p.displayName ?? "",
      prompt_text: p.promptText ?? "",
      pre_prompt: p.prePrompt ?? "",
      post_prompt: p.postPrompt ?? "",
      category: p.category ?? "",
    }));
    const json = JSON.stringify(arr, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = categoryKey ? `codbi-prompts-${categoryKey.replace(/\./g, "-")}.json` : "codbi-prompts-all.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Exports ALL prompts. */
  exportAll(): void {
    this.exportCategory("");
  }

  /** Imports multiple prompts from a JSON file (array of PromptExport). */
  importAll(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          const arr: PromptExport[] = Array.isArray(data) ? data : [data];
          if (arr.length === 0) return;
          this.loading = true;
          let completed = 0;
          let errors = 0;
          const total = arr.length;
          for (const item of arr) {
            this.http
              .post<{ status: string }>(
                this.servletUrl,
                `body=${encodeURIComponent(
                  JSON.stringify({
                    prompt_key: item.prompt_key,
                    display_name: item.display_name,
                    prompt_text: item.prompt_text,
                    pre_prompt: item.pre_prompt,
                    post_prompt: item.post_prompt,
                  }),
                )}`,
                {
                  headers: {
                    "X-Action": "Import",
                    "X-View": this.xView(),
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                },
              )
              .subscribe({
                next: () => {
                  completed++;
                  this.checkImportDone(completed, errors, total);
                },
                error: () => {
                  errors++;
                  this.checkImportDone(completed, errors, total);
                },
              });
          }
        } catch {
          this.errorText = "Invalid JSON file.";
          this.cdr.markForCheck();
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  private checkImportDone(completed: number, errors: number, total: number): void {
    if (completed + errors < total) return;
    this.loading = false;
    this.successText = `Imported ${completed} prompt(s)${errors > 0 ? ` (${errors} failed)` : ""}.`;
    this.loadPrompts();
    this.cdr.markForCheck();
  }

  importPrompt(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as PromptExport;
          this.uploadImport(data);
        } catch {
          this.errorText = "Invalid JSON file.";
          this.cdr.markForCheck();
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  private uploadImport(data: PromptExport): void {
    this.loading = true;
    this.errorText = null;
    this.successText = null;
    const body = JSON.stringify({
      prompt_key: data.prompt_key,
      display_name: data.display_name,
      prompt_text: data.prompt_text,
      pre_prompt: data.pre_prompt,
      post_prompt: data.post_prompt,
    });
    this.http
      .post<{ status: string }>(this.servletUrl, `body=${encodeURIComponent(body)}`, {
        headers: { "X-Action": "Import", "X-View": this.xView(), "Content-Type": "application/x-www-form-urlencoded" },
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.successText = `Prompt "${data.prompt_key}" imported successfully.`;
          this.loadPrompts();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorText = `Import failed: ${err.message}`;
          this.cdr.markForCheck();
        },
      });
  }
  // #endregion
}
