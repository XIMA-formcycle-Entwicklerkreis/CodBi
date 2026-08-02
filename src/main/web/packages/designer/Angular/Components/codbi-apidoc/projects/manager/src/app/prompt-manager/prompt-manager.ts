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
import { InputText } from "primeng/inputtext";
import { TreeModule } from "primeng/tree";
import type { TreeNode } from "primeng/api";
import { Textarea } from "primeng/textarea";
import { Tooltip } from "primeng/tooltip";
// #endregion

// #region Transloco
import { TranslocoModule, TranslocoPipe, TranslocoService } from "@ngneat/transloco";
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
  isSystem: boolean;
  /** True when a newer bundled .md version exists but the local copy was customized. */
  updateAvailable: boolean;
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
  imports: [
    CommonModule,
    FormsModule,
    Button,
    Dialog,
    Message,
    InputText,
    TreeModule,
    Textarea,
    Tooltip,
    TranslocoModule,
    TranslocoPipe,
  ],
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

  // #region Add Category dialog
  showAddCategoryDialog = false;
  newCategoryKey = "";
  newCategoryDisplayName = "";
  newCategoryPromptText = "";
  // #endregion

  // #region Add Item dialog
  showAddItemDialog = false;
  /** The parent key under which the new item will be created (e.g., "codbi.functionalities"). */
  addItemParentKey: string | null = null;
  addItemParentLabel = "";
  newItemName = "";
  newItemDisplayName = "";
  newItemPromptText = "";

  /** Computed preview of what the new item's key will look like. */
  get newItemKeyPreview(): string {
    const keyPart = this.newItemName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    if (!keyPart) return "...";
    return this.addItemParentKey ? `${this.addItemParentKey}.${keyPart}` : keyPart;
  }
  // #endregion

  // #region Rename dialog
  showRenameDialog = false;
  renameNewName = "";

  /** Computed preview of what the renamed key will look like. */
  get renameKeyPreview(): string {
    const keyPart = this.renameNewName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    if (!keyPart || !this.selectedKey) return "...";
    const parts = this.selectedKey.split(".");
    parts[parts.length - 1] = keyPart;
    return parts.join(".");
  }
  // #endregion

  /** Returns true if the currently selected prompt was created by the user (not a built-in system prompt). */
  isUserCreated(): boolean {
    return this.activeRecord != null && !this.activeRecord.isSystem;
  }

  /** Returns true when a newer bundled version of the selected prompt is available for loading. */
  hasUpdateAvailable(): boolean {
    return this.activeRecord?.updateAvailable === true;
  }

  /**
   * Returns true when the selected prompt is a server-side system standard configuration
   * (e.g. "Holistic.Cleave.Date") whose prompt text is read-only (only activation can be toggled).
   */
  isSystemApp(): boolean {
    return this.activeRecord != null && this.isSystemAppPrompt(this.activeRecord);
  }

  /** Tooltip text explaining what the user can do when a newer prompt version is available. */
  get updateHintTooltip(): string {
    return this.tr("pm.updateHint.tooltip");
  }

  /**
   * Localized display description for the selected prompt, when a translation key exists for its
   * prompt key (see `pm.desc.*` in the i18n files). Returns `null` when no translation is available.
   */
  get localizedDescription(): string | null {
    const p = this.activeRecord;
    if (!p) return null;
    const key = `pm.desc.${p.promptKey}`;
    const value = this.translocoService.translate(key);
    return value === key ? null : value;
  }

  /** Card header: the category/key path prefix (shown as a rounded badge). */
  get cardTitlePath(): string {
    if (!this.selectedKey) return "";
    const parts = this.selectedKey.split(".");
    if (parts.length <= 1) return "";
    return parts
      .slice(0, -1)
      .map((seg) => (seg === "codbi" ? "CodBi" : seg.replace(/_/g, "").replace(/^\w/, (c) => c.toUpperCase())))
      .join(" / ");
  }

  /** Card header: the element name (last key segment, or the display name). */
  get cardTitleName(): string {
    if (!this.selectedKey) return "";
    const displayName = this.editDisplayName.trim();
    if (displayName) return displayName;
    const parts = this.selectedKey.split(".");
    return this.formatCategoryLabel(parts[parts.length - 1]);
  }

  private readonly openHandler = (): void => this.open();

  constructor(
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
  ) {}

  /** Convenience wrapper around TranslocoService.translate. */
  private tr(key: string, params?: Record<string, unknown>): string {
    return this.translocoService.translate(key, params);
  }

  // #region Lifecycle
  ngOnInit(): void {
    document.addEventListener("codbi:prompt-manager:open", this.openHandler);
    // Follow the Formcycle UI language (e.g. de / en / it) so the Prompt Manager matches the host.
    const lang = (window as unknown as { XFC_METADATA?: { currentLanguage?: string } })?.XFC_METADATA?.currentLanguage;
    if (lang && ["de", "en", "it"].includes(lang)) {
      this.translocoService.setActiveLang(lang);
    }
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
    this.showAddCategoryDialog = false;
    this.showAddItemDialog = false;
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
          this.errorText = this.tr("pm.err.loadFailed", { error: err.message });
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
      const catNode = {
        label: catLabel,
        data: cat,
        type: "category",
        expanded: true,
        children: [] as TreeNode[],
        tokens: 0,
      } as TreeNode & { tokens: number };

      for (const [subKey, items] of subMap) {
        if (subKey === "") {
          for (const item of items) {
            catNode.children!.push(item);
          }
        } else {
          const subLabel = subKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          const subTokens = items.reduce((sum, it) => sum + ((it as TreeNode & { tokens?: number }).tokens ?? 0), 0);
          const subNode = {
            label: subLabel,
            data: `${cat}.${subKey}`,
            type: "subcategory",
            expanded: true,
            children: items,
            tokens: subTokens,
          } as TreeNode & { tokens: number };
          catNode.children!.push(subNode);
        }
      }

      catNode.tokens = (catNode.children ?? []).reduce(
        (sum, child) => sum + ((child as TreeNode & { tokens?: number }).tokens ?? 0),
        0,
      );
      this.treeNodes.push(catNode);
    }
  }

  private makeTreeNode(p: PromptRecord, category: string): TreeNode {
    const parts = p.promptKey.split(".");
    // Remove category prefix from label display
    const label = this.formatItemLabel(p, parts, category);
    const node = {
      label,
      data: p.promptKey,
      type: "item",
      leaf: true,
      key: p.promptKey,
      // Abstract codbi prompts (e.g., "EP Chaining") get a distinct style.
      isAbstract: this.isAbstractPrompt(p),
      // Server-side system standard configurations get a darkorange frame.
      isSystemApp: this.isSystemAppPrompt(p),
      // User-created prompts get a blue frame.
      isUserApp: this.isUserAppPrompt(p),
      // Token count of this prompt (pre + main + post).
      tokens: this.recordTokens(p),
    } as TreeNode & { isAbstract: boolean; isSystemApp: boolean; isUserApp: boolean; tokens: number };
    return node;
  }

  /**
   * Returns true for server-side system standard configurations (e.g. "Holistic.Cleave.Date",
   * "Holistic.Matomo.Tracking") that are framed in darkorange to distinguish them from abstract
   * instruction rules.
   */
  isSystemAppPrompt(p: PromptRecord): boolean {
    const parts = p.promptKey.split(".");
    return parts.length >= 4 && parts[0] === "codbi" && p.isSystem && parts[2] === "system_standard_configurations";
  }

  /**
   * Returns true for prompts created by the user in the Prompt Manager (is_system = false).
   * These get a blue frame to distinguish them from seeded/system elements.
   */
  isUserAppPrompt(p: PromptRecord): boolean {
    return !p.isSystem;
  }

  /** Rough token estimate for a text: ~4 characters per token. */
  private estimateTokens(text: string | null | undefined): number {
    if (!text) return 0;
    return Math.max(0, Math.ceil(text.length / 4));
  }

  /** Token count of a prompt record (pre + main + post). */
  private recordTokens(p: PromptRecord): number {
    return this.estimateTokens(p.prePrompt) + this.estimateTokens(p.promptText) + this.estimateTokens(p.postPrompt);
  }

  /** Total token size of all prompts in the currently selected view. */
  get viewTotalTokens(): number {
    return this.allPrompts.reduce((sum, p) => sum + this.recordTokens(p), 0);
  }

  /**
   * Returns true for abstract prompts (e.g., "EP Chaining", "OpenPLZ EPs", "Form Structure Rules",
   * "Trigger Types") that describe general rules rather than a concrete element.
   *
   * - CodBi: descriptive multi-word phrases are abstract; real EPs have dotted, single-word, or
   *   single-letter names ("Date.Today", "Sorted", "I", "BayVIS.Ansprechpartner").
   * - Formcycle: all `formcycle.general.*` sections are abstract rules; workflow node group headers
   *   (3-part keys like `formcycle.workflow_nodes.trigger_types`) are abstract, while actual nodes
   *   (`...fc_email`) and widgets are real elements.
   */
  isAbstractPrompt(p: PromptRecord): boolean {
    // User-created prompts get their own blue frame (see isUserAppPrompt) — never the abstract one.
    if (!p.isSystem) return false;
    const parts = p.promptKey.split(".");
    if (parts.length < 3) return false;
    const category = parts[0];
    if (category === "codbi") {
      // Server-side system standard configurations (e.g. Holistic.Matomo.Tracking,
      // Holistic.Cleave.*) get their own darkorange frame (see isSystemAppPrompt) instead of
      // the generic abstract frame.
      if (parts.length >= 3 && parts[2] === "system_standard_configurations") return false;
      const name = p.displayName?.trim() || "";
      return name.length > 0 && name.includes(" ");
    }
    if (category === "formcycle") {
      const sub = parts[1];
      if (sub === "general") return true;
      if (sub === "workflow_nodes") return parts.length === 3;
    }
    return false;
  }

  private formatCategoryLabel(cat: string): string {
    // "codbi" → "CodBi", "formcycle" → "Formcycle"
    if (cat === "codbi") return "CodBi";
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  /**
   * Strips all parent key segment prefixes from a display name to avoid redundancy in the tree.
   * E.g. for key "codbi.functionalities.ai_ocr" with keepFromIndex=2,
   * display "Codbi Functionalities Ai Ocr" → "Ai Ocr".
   * The comparison is case-insensitive.
   */
  /**
   * Formats a key segment for display.
   * - `"dots"` → "Ai.Llama.Std.Qa" (CodBi items)
   * - `"spaces"` → "X Text Field" (formcycle widgets, etc.)
   * - `"underscores"` → "Fc_Form_Record_Message_Posted" (workflow node names)
   */
  private formatKeySegment(segment: string, mode: "dots" | "spaces" | "underscores"): string {
    const parts = segment.split("_");
    const formatted = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
    switch (mode) {
      case "dots":
        return formatted.join(".");
      case "underscores":
        return formatted.join("_");
      default:
        return formatted.join(" ");
    }
  }

  private stripParentPrefix(name: string, parts: string[], keepFromIndex: number): string {
    const prefix = parts
      .slice(0, keepFromIndex)
      .map((p) => this.formatKeySegment(p, "spaces"))
      .join(" ");
    if (name.length >= prefix.length && name.substring(0, prefix.length).toLowerCase() === prefix.toLowerCase()) {
      const rest = name.slice(prefix.length).trim();
      if (rest) return rest;
    }
    return name;
  }

  /**
   * Extracts a fully-qualified class name from a parenthetical in a display name, e.g.
   * "CheckTrustLevelPlugin (de.xima.fc.plugin.bs.authn.plugin.node.CheckTrustLevelPlugin)"
   * → "de.xima.fc.plugin.bs.authn.plugin.node.CheckTrustLevelPlugin". Returns null if the
   * parenthetical does not contain a dotted (class-like) name.
   */
  private extractClassName(name: string | null | undefined): string | null {
    if (!name) return null;
    const m = name.match(/\(([^()]*\.[^()]*)\)/);
    return m ? m[1].trim() : null;
  }

  private formatItemLabel(p: PromptRecord, parts: string[], category: string): string {
    // CodBi items: prefer the stored displayName (preserves original formatting like
    // "Date.Today" or "EP Chaining"). Fall back to dots for real EPs, spaces for abstract.
    if (category === "codbi" && parts.length >= 3) {
      if (p.displayName && p.displayName.trim()) return p.displayName;
      const last = parts[parts.length - 1];
      // Real element placeholders use dots (e.g., "Ai.Llama.Std.Qa");
      // abstract prompts (no dot in the name) use spaces (e.g., "EP Chaining").
      const isRealEp = last.includes("_") && /^[a-z]+(_[a-z]+)+$/i.test(last) && last.split("_").length >= 2;
      return this.formatKeySegment(last, isRealEp ? "dots" : "spaces");
    }
    // Formcycle workflow sub-items: underscores as separators, last segment only.
    // Plugin nodes with a fully-qualified class name in parentheses (e.g.
    // "CheckTrustLevelPlugin (de.xima.fc.plugin.bs.authn.plugin.node.CheckTrustLevelPlugin)")
    // show the class path with dots → underscores as their label.
    if (category === "formcycle" && parts.length >= 4 && parts[1] === "workflow_nodes") {
      const className = this.extractClassName(p.displayName);
      if (className) return className.replace(/\./g, "_");
      return this.formatKeySegment(parts[parts.length - 1], "underscores");
    }
    // Condensed (Kompakt view) workflow nodes: the compact seed uses the key
    // "compact.formcycle_workflow_nodes.node_types.<name>" (or "...trigger_types.<name>"). Format
    // the last segment with underscores, exactly like the Detailed view workflow nodes, so the
    // condensed tree shows the same names (e.g. "FC_Break", "FC_Form_Submit_Button").
    if (
      category === "compact" &&
      parts.length >= 4 &&
      parts[1] === "formcycle_workflow_nodes" &&
      (parts[2] === "node_types" || parts[2] === "trigger_types")
    ) {
      const className = this.extractClassName(p.displayName);
      if (className) return className.replace(/\./g, "_");
      return this.formatKeySegment(parts[parts.length - 1], "underscores");
    }
    // Other formcycle items: spaces as separators
    const mode: "spaces" = "spaces";
    if (parts.length >= 4) {
      const label = p.displayName ? this.stripParentPrefix(p.displayName, parts, 2) : null;
      return (
        label ??
        parts
          .slice(2)
          .map((s) => this.formatKeySegment(s, mode))
          .join(" ")
      );
    }
    if (parts.length === 3) {
      const label = p.displayName ? this.stripParentPrefix(p.displayName, parts, 2) : null;
      return label ?? this.formatKeySegment(parts[2], mode);
    }
    const label = p.displayName ? this.stripParentPrefix(p.displayName, parts, 1) : null;
    return label ?? this.formatKeySegment(parts[1], mode);
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
    const parts = key.split(".");
    // 3+ parts are always items
    if (parts.length >= 3) return true;
    // 2-part keys: check known system items OR any existing record (user-created categories)
    if (parts.length === 2) {
      const editableTwoPart = new Set(["formcycle.general", "codbi.general", "codbi.classify_intent"]);
      if (editableTwoPart.has(key)) return true;
      // User-created 2-part keys (e.g., "mycompany.general") should show their card
      return this.allPrompts.some((p) => p.promptKey === key);
    }
    return false;
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

  // #region Add Category

  /** Opens the dialog to create a new top-level category. */
  openAddCategoryDialog(): void {
    this.newCategoryKey = "";
    this.newCategoryDisplayName = "";
    this.newCategoryPromptText = "";
    this.errorText = null;
    this.successText = null;
    this.showAddCategoryDialog = true;
    this.cdr.markForCheck();
  }

  /** Closes the add-category dialog. */
  closeAddCategoryDialog(): void {
    this.showAddCategoryDialog = false;
    this.cdr.markForCheck();
  }

  /** Creates a new top-level category with a `.general` prompt item. */
  addCategory(): void {
    const key = this.newCategoryKey.trim();
    if (!key) {
      this.errorText = this.tr("pm.err.categoryKeyRequired");
      this.cdr.markForCheck();
      return;
    }
    // Validate: only dots are forbidden (spaces and case are allowed)
    if (key.includes(".")) {
      this.errorText = this.tr("pm.err.categoryKeyInvalid");
      this.cdr.markForCheck();
      return;
    }
    const promptKey = `${key}.general`;
    const displayName = this.newCategoryDisplayName.trim() || this.formatCategoryLabel(key) + " General";
    const promptText =
      this.newCategoryPromptText.trim() || `General instructions for the ${this.formatCategoryLabel(key)} category.`;

    this.loading = true;
    this.errorText = null;
    this.successText = null;

    const body = JSON.stringify({
      prompt_key: promptKey,
      display_name: displayName,
      prompt_text: promptText,
      category: key,
    });

    this.http
      .post<{ status: string }>(this.servletUrl, `body=${encodeURIComponent(body)}`, {
        headers: { "X-Action": "Create", "X-View": this.xView(), "Content-Type": "application/x-www-form-urlencoded" },
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.showAddCategoryDialog = false;
          this.successText = this.tr("pm.msg.categoryCreated", { name: this.formatCategoryLabel(key) });
          this.loadPrompts();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorText = this.tr("pm.err.categoryCreateFailed", { error: err.message });
          this.cdr.markForCheck();
        },
      });
  }

  // #endregion

  // #region Add Item

  /**
   * Opens the dialog to add a new prompt item under the given parent.
   * @param parentKey The parent key (e.g., "codbi.functionalities" for a subcategory).
   */
  openAddItemDialog(parentKey: string | null): void {
    this.addItemParentKey = parentKey;
    this.addItemParentLabel = parentKey ? parentKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
    this.newItemName = "";
    this.newItemDisplayName = "";
    this.newItemPromptText = "";
    this.errorText = null;
    this.successText = null;
    this.showAddItemDialog = true;
    this.cdr.markForCheck();
  }

  /** Closes the add-item dialog. */
  closeAddItemDialog(): void {
    this.showAddItemDialog = false;
    this.cdr.markForCheck();
  }

  /** Creates a new prompt item under the currently selected parent category/subcategory. */
  addItem(): void {
    const name = this.newItemName.trim();
    if (!name) {
      this.errorText = this.tr("pm.err.itemNameRequired");
      this.cdr.markForCheck();
      return;
    }
    // Dots are not allowed in element names created via the Prompt Manager
    if (name.includes(".")) {
      this.errorText = this.tr("pm.err.itemNameDots");
      this.cdr.markForCheck();
      return;
    }
    const displayNameInput = this.newItemDisplayName.trim();
    if (displayNameInput.includes(".")) {
      this.errorText = this.tr("pm.err.displayNameDots");
      this.cdr.markForCheck();
      return;
    }
    // Convert name to key part: lowercase, replace spaces/special chars with underscores
    const keyPart = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    if (!keyPart) {
      this.errorText = this.tr("pm.err.itemNameAlpha");
      this.cdr.markForCheck();
      return;
    }

    const parent = this.addItemParentKey;
    // Determine the full key
    const promptKey = parent ? `${parent}.${keyPart}` : keyPart;
    const displayName = this.newItemDisplayName.trim() || name;
    const promptText = this.newItemPromptText.trim() || `Instructions for ${displayName}.`;

    this.loading = true;
    this.errorText = null;
    this.successText = null;

    // Extract category from parent or key
    const category = parent ? parent.split(".")[0] : keyPart;

    const body = JSON.stringify({
      prompt_key: promptKey,
      display_name: displayName,
      prompt_text: promptText,
      category,
    });

    this.http
      .post<{ status: string }>(this.servletUrl, `body=${encodeURIComponent(body)}`, {
        headers: { "X-Action": "Create", "X-View": this.xView(), "Content-Type": "application/x-www-form-urlencoded" },
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.showAddItemDialog = false;
          this.successText = this.tr("pm.msg.itemCreated", { name: displayName });
          this.loadPrompts();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorText = this.tr("pm.err.itemCreateFailed", { error: err.message });
          this.cdr.markForCheck();
        },
      });
  }

  // #endregion

  // #region Delete / Rename (user-created prompts only)

  /** Deletes the currently selected prompt. */
  deletePrompt(): void {
    const key = this.selectedKey;
    if (!key || !this.isUserCreated()) return;
    if (!confirm(this.tr("pm.confirm.delete", { name: this.editDisplayName }))) return;
    this.loading = true;
    this.errorText = null;
    this.successText = null;
    this.http
      .post<{ status: string }>(this.servletUrl, `body=${encodeURIComponent(JSON.stringify({ prompt_key: key }))}`, {
        headers: { "X-Action": "Delete", "X-View": this.xView(), "Content-Type": "application/x-www-form-urlencoded" },
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.selectedKey = null;
          this.activeRecord = null;
          this.successText = this.tr("pm.msg.deleted", { name: this.editDisplayName });
          this.loadPrompts();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorText = this.tr("pm.err.deleteFailed", { error: err.message });
          this.cdr.markForCheck();
        },
      });
  }

  /** Opens the rename dialog for the currently selected prompt. */
  openRenameDialog(): void {
    if (!this.selectedKey || !this.isUserCreated()) return;
    // Derive a suggested new name from the current display name or last key segment
    const parts = this.selectedKey.split(".");
    const lastSegment = parts[parts.length - 1]?.replace(/_/g, " ") ?? "";
    this.renameNewName = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
    this.errorText = null;
    this.successText = null;
    this.showRenameDialog = true;
    this.cdr.markForCheck();
  }

  /** Closes the rename dialog. */
  closeRenameDialog(): void {
    this.showRenameDialog = false;
    this.cdr.markForCheck();
  }

  /** Renames the currently selected prompt. */
  renamePrompt(): void {
    const oldKey = this.selectedKey;
    if (!oldKey || !this.isUserCreated()) return;
    const newName = this.renameNewName.trim();
    if (!newName) {
      this.errorText = this.tr("pm.err.newNameRequired");
      this.cdr.markForCheck();
      return;
    }
    // Dots are not allowed in element names created via the Prompt Manager
    if (newName.includes(".")) {
      this.errorText = this.tr("pm.err.newNameDots");
      this.cdr.markForCheck();
      return;
    }
    // Convert to key-safe format
    const keyPart = newName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    if (!keyPart) {
      this.errorText = this.tr("pm.err.nameAlpha");
      this.cdr.markForCheck();
      return;
    }
    // Build new key: replace last segment while keeping the prefix
    const parts = oldKey.split(".");
    parts[parts.length - 1] = keyPart;
    const newKey = parts.join(".");

    this.loading = true;
    this.errorText = null;
    this.successText = null;
    this.http
      .post<{ status: string; new_key: string }>(
        this.servletUrl,
        `body=${encodeURIComponent(JSON.stringify({ prompt_key: oldKey, new_key: newKey, display_name: newName }))}`,
        {
          headers: {
            "X-Action": "Rename",
            "X-View": this.xView(),
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.showRenameDialog = false;
          this.selectedKey = newKey;
          this.successText = this.tr("pm.msg.renamed", { name: newName });
          this.loadPrompts();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorText = this.tr("pm.err.renameFailed", { error: err.message });
          this.cdr.markForCheck();
        },
      });
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
          this.errorText = this.tr("pm.err.toggleFailed", { error: err.message });
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
          this.successText = this.tr("pm.msg.saved");
          // #region Persist pre/post active states to localStorage and update local data
          if (key) {
            localStorage.setItem(`${PromptManager.LS_PRE}${key}`, String(this.editPrePromptActive));
            localStorage.setItem(`${PromptManager.LS_POST}${key}`, String(this.editPostPromptActive));
            const localRecord = this.allPrompts.find((p) => p.promptKey === key);
            if (localRecord) {
              localRecord.prePromptActive = this.editPrePromptActive;
              localRecord.postPromptActive = this.editPostPromptActive;
              localRecord.displayName = this.editDisplayName;
              localRecord.prePrompt = this.editPrePrompt || null;
              localRecord.promptText = this.editPromptText;
              localRecord.postPrompt = this.editPostPrompt || null;
              localRecord.updateAvailable = false;
            }
          }
          // #endregion
          // Update the tree in-place without a full reload
          this.buildTree();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorText = this.tr("pm.err.saveFailed", { error: err.message });
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
          this.successText = this.tr("pm.msg.restored");
          this.loadPrompts();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorText = this.tr("pm.err.restoreFailed", { error: err.message });
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
          this.errorText = this.tr("pm.err.exportFailed", { error: err.message });
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
          this.errorText = this.tr("pm.err.invalidJson");
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
    this.successText =
      this.tr("pm.msg.importedOk", { count: completed }) +
      (errors > 0 ? this.tr("pm.msg.importedFail", { failed: errors }) : "");
    this.loadPrompts();
    this.cdr.markForCheck();
  }

  // #endregion
}
