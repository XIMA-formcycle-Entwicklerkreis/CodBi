// #region Imports
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from "@angular/core";
import type { OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { Message } from "primeng/message";
import { ProgressSpinner } from "primeng/progressspinner";
import { PrimeTemplate } from "primeng/api";
import { TranslocoPipe } from "@ngneat/transloco";
import { getJQuery } from "@de-xima/fc-form-designer";
import { getCurrentFormKey } from "../ai-assistant/form-key";
import { LogTreeNode } from "./log-tree-node";
import type { LogNode } from "./log-tree-node";
import {
  applyDialogPosition,
  loadDialogPosition,
  readDialogPosition,
  saveDialogPosition,
  type DialogPosition,
} from "../dialog-position";
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
  imports: [CommonModule, PrimeTemplate, Dialog, Button, ProgressSpinner, Message, LogTreeNode, TranslocoPipe],
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
  /** The raw log entries as returned by the backend (used for the JSON export). */
  private rawEntries: Array<Record<string, unknown>> = [];
  /** Free-text filter applied to the log entries (prompt / model / widget names). */
  searchText = "";
  /**
   * Names of CodBi elements (from `AI_Log_SensitiveElements`) that were used by the last inference
   * and should be highlighted with a lightning icon. Temporary — cleared when the dialog closes.
   */
  highlightElements: string[] = [];
  /**
   * The currently configured sensitive elements (`AI_Log_SensitiveElements`), returned by the
   * backend with every log load. Every node whose label/value matches one of these is marked with an
   * **always-on red border** (persistent, in contrast to the transient [highlightElements] bolt).
   */
  sensitiveElements: string[] = [];
  /**
   * Stable node ids whose sensitive-marking checkbox the user has ticked. Such nodes are no longer
   * marked on any load (until unticked). Persists for the current page session — it is only reset
   * when the page reloads (which re-creates this component), so checked nodes stay checked while the
   * log is reopened within the same designer session.
   */
  private acknowledgedSensitive = new Set<string>();
  /** Login name of the user viewing the log (returned by the backend) — used to attribute a check. */
  currentUser = "";
  /** Per (entry, element) check details (user + timestamp) for rendering the "checked by" badge. */
  private readonly sensitiveCheckInfo = new Map<string, { username: string; checkedAt: string }>();
  /** Session-storage key used to survive a page reload (e.g. after a workflow is created). */
  private static readonly HIGHLIGHT_STORAGE_KEY = "codbi-log-sensitive-elements";
  /** A log entry that used sensitive elements is auto-opened only if it is at most this old. */
  private static readonly AUTO_OPEN_WINDOW_MINUTES = 10;
  expandedAll = false;
  /** Technical name/key of the form whose change log is currently shown. */
  currentFormKey = "";
  /** Total tokens used by all recorded inferences of the current form (input / output / total). */
  totalTokensIn = 0;
  totalTokensOut = 0;
  totalTokens = 0;
  /** Total estimated cost of all recorded inferences of the current form, per currency (models may be priced differently). */
  costByCurrency = new Map<string, number>();

  private readonly openHandler = (event: Event): void => {
    const detail = (event as CustomEvent<{ elements?: string[] } | undefined>).detail;
    console.log("[AIAssistantLog] open event received with elements =", JSON.stringify(detail?.elements));
    this.open(detail?.elements ?? []);
  };

  private readonly cdr: ChangeDetectorRef;

  /** Remembered dialog position, persisted across reloads so the browser keeps the location. */
  private dialogPosition: DialogPosition | null = loadDialogPosition("codbi-dialog-log-position");
  private static readonly DIALOG_STYLE_CLASS = "cb-log-dialog";

  constructor(cdr: ChangeDetectorRef) {
    this.cdr = cdr;
  }

  // #region Lifecycle
  ngOnInit(): void {
    document.addEventListener("codbi:ai-assistant-log:open", this.openHandler);
    // The designer reloads the page after a workflow is created, which re-mounts this component.
    // A pending highlight persisted in localStorage (same pattern as the pending-standards value)
    // survives that reload, so reopen the log and consume it. The open is retried briefly until the
    // designer reports the current form key so the change log is scoped to the just-reloaded form
    // (and only falls back to all forms if the key never becomes available).
    const pending = localStorage.getItem(AiAssistantLog.HIGHLIGHT_STORAGE_KEY);
    console.log("[AIAssistantLog] ngOnInit: pending highlight =", pending);
    if (pending) {
      localStorage.removeItem(AiAssistantLog.HIGHLIGHT_STORAGE_KEY);
      try {
        const parsed = JSON.parse(pending) as unknown;
        const elements = Array.isArray(parsed) ? (parsed as string[]) : [];
        if (elements.length > 0) {
          const openWhenReady = (attempt: number): void => {
            if (!getCurrentFormKey() && attempt < 10) {
              setTimeout(() => openWhenReady(attempt + 1), 150);
              return;
            }
            console.log("[AIAssistantLog] ngOnInit: opening with", JSON.stringify(elements));
            this.open(elements);
          };
          openWhenReady(0);
        }
      } catch {
        // ignore malformed payload
      }
    }
    // Robust fallback (the requested approach): as soon as the log can be accessed, check the newest
    // entry of the current form directly in the database. If it used sensitive elements recently and
    // they are not all acknowledged, auto-open the change log — this survives any localStorage or
    // event-timing issue after the workflow-triggered form reload.
    const checkWhenReady = (attempt: number): void => {
      if (!getCurrentFormKey() && attempt < 10) {
        setTimeout(() => checkWhenReady(attempt + 1), 150);
        return;
      }
      console.log("[AIAssistantLog] ngOnInit: checking newest log entry for sensitive elements");
      this.load(true);
    };
    checkWhenReady(0);
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

  /** Restores the remembered dialog position once the dialog has rendered. */
  onDialogShow(): void {
    setTimeout(() => applyDialogPosition(AiAssistantLog.DIALOG_STYLE_CLASS, this.dialogPosition), 0);
  }

  /** Remembers the dialog position after the user dragged/resized it. */
  onDialogDragEnd(): void {
    const p = readDialogPosition(AiAssistantLog.DIALOG_STYLE_CLASS);
    if (p) {
      this.dialogPosition = p;
      saveDialogPosition("codbi-dialog-log-position", p);
    }
  }

  close(): void {
    this.visible = false;
    // The highlight is temporary — clear it once the dialog is dismissed.
    this.highlightElements = [];
    this.cdr.markForCheck();
  }

  /** Opens the change log. [elements] are names of sensitive CodBi elements to highlight. */
  open(elements: string[] = []): void {
    console.log("[AIAssistantLog] open() called with elements =", JSON.stringify(elements));
    // Consume any pending highlight so it does not auto-open again on a later page load.
    localStorage.removeItem(AiAssistantLog.HIGHLIGHT_STORAGE_KEY);
    this.highlightElements = elements ?? [];
    this.visible = true;
    this.errorText = null;
    this.cdr.markForCheck();
    this.load();
  }

  load(autoOpenAfterLoad = false): void {
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
        const payload = response as Record<string, unknown> | Array<Record<string, unknown>> | null;
        // Accept both the new `{ entries, totals }` shape and a bare array (backward compatible).
        const raw = Array.isArray(payload)
          ? payload
          : ((payload?.["entries"] as Array<Record<string, unknown>> | undefined) ?? []);
        const totals = !Array.isArray(payload)
          ? ((payload?.["totals"] as Record<string, unknown> | undefined) ?? {})
          : {};
        // The currently configured sensitive elements — always applied as a red border on matching
        // nodes, so the editor sees them even when the log was opened manually (not auto-opened).
        const sensitive = !Array.isArray(payload)
          ? ((payload?.["sensitiveElements"] as unknown[] | undefined) ?? [])
          : [];
        this.sensitiveElements = sensitive
          .filter((el): el is string => typeof el === "string")
          .map((el) => el.toLowerCase());
        this.updateSensitivePatterns();
        // The sensitive-element dismiss checks already persisted for this user. Nodes whose
        // (entry, element) pair is in this set stay unmarked.
        const checks = !Array.isArray(payload) ? ((payload?.["sensitiveChecks"] as unknown[] | undefined) ?? []) : [];
        // The login name of the user viewing the log (used to attribute a freshly-ticked check).
        this.currentUser = !Array.isArray(payload)
          ? String((payload?.["currentUser"] as string | undefined) ?? "")
          : "";
        this.acknowledgedSensitive.clear();
        this.sensitiveCheckInfo.clear();
        for (const check of checks) {
          if (typeof check !== "object" || check === null) continue;
          const c = check as Record<string, unknown>;
          const entryId = String(c["entryId"] ?? "");
          const elementName = String(c["elementName"] ?? "").toLowerCase();
          if (entryId && elementName) {
            const key = this.sensitiveKey(entryId, elementName);
            this.acknowledgedSensitive.add(key);
            this.sensitiveCheckInfo.set(key, {
              username: String(c["username"] ?? "") || "?",
              checkedAt: String(c["checkedAt"] ?? ""),
            });
          }
        }
        // The backend derives the totals from the summed tokens per model × configured price per 1M,
        // so we prefer those over summing per-entry values.
        this.totalTokensIn = Number(
          totals["tokensIn"] ?? raw.reduce((sum, entry) => sum + (Number(entry["tokensIn"]) || 0), 0),
        );
        this.totalTokensOut = Number(
          totals["tokensOut"] ?? raw.reduce((sum, entry) => sum + (Number(entry["tokensOut"]) || 0), 0),
        );
        this.totalTokens = this.totalTokensIn + this.totalTokensOut;
        const costObj = (totals["costByCurrency"] as Record<string, unknown> | undefined) ?? {};
        this.costByCurrency = new Map<string, number>(
          Object.entries(costObj).map(([currency, cost]) => [currency, Number(cost) || 0]),
        );
        this.rawEntries = raw;
        this.logs = this.buildTree(this.applyFilter(raw));
        this.expandSearchMatches();
        this.applyHighlights();
        this.markSensitiveNodes();
        if (autoOpenAfterLoad) {
          this.autoOpenIfRecentSensitive();
        }
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

  /** Re-applies the search filter to the already loaded entries and expands to the matches. */
  onSearchInput(event: Event): void {
    this.searchText = (event.target as HTMLInputElement | null)?.value ?? "";
    this.logs = this.buildTree(this.applyFilter(this.rawEntries));
    this.expandSearchMatches();
    this.applyHighlights();
    this.markSensitiveNodes();
    this.cdr.markForCheck();
  }

  /**
   * Marks every node whose label/value matches one of the [highlightElements] with the
   * `highlighted` flag (rendered with a lightning icon) and expands the tree down to those nodes.
   */
  private applyHighlights(): void {
    const elements = this.highlightElements.map((e) => e.toLowerCase()).filter((e) => e.length > 0);
    if (elements.length === 0) return;
    this.markAndExpandHighlights(this.logs, elements);
  }

  /** Recursively marks matching nodes and expands their ancestors. Returns true when a match was found. */
  private markAndExpandHighlights(nodes: LogNode[], elements: string[]): boolean {
    let anyMatch = false;
    for (const node of nodes) {
      const selfMatches = elements.some(
        (el) =>
          node.label.toLowerCase().includes(el) ||
          (node.value !== undefined && String(node.value).toLowerCase().includes(el)),
      );
      const childMatches = node.children ? this.markAndExpandHighlights(node.children, elements) : false;
      if (selfMatches) node.highlighted = true;
      if (childMatches) node.expanded = true;
      if (selfMatches || childMatches) anyMatch = true;
    }
    return anyMatch;
  }

  /**
   * Applies the **always-on** red border: every node whose label/value matches one of the configured
   * sensitive elements ([sensitiveElements]) is flagged with `sensitive = true` — unless the user has
   * dismissed it by ticking the node's checkbox ([acknowledgedSensitive]). Called on every load,
   * search and clear, so the marking is persistent and reflects the current configuration.
   */
  private markSensitiveNodes(): void {
    if (this.sensitiveElements.length === 0) return;
    for (const top of this.logs) {
      this.markNodeSensitive([top], this.entryIdOf(top));
    }
  }

  /** Recursively flags matching nodes as `sensitive` (rendered with an always-on red border). */
  private markNodeSensitive(nodes: LogNode[], entryId: string): void {
    for (const node of nodes) {
      const matched = this.matchingSensitiveNames(node);
      node.entryId = entryId;
      node.sensitiveNames = matched;
      const acknowledged = matched.find((name) => this.acknowledgedSensitive.has(this.sensitiveKey(entryId, name)));
      if (acknowledged) {
        // The user already dismissed this (entry, element) pair — keep it unmarked and restore the
        // checked checkbox + the "checked by … on …" badge.
        node.sensitive = false;
        node.checked = true;
        this.applyCheckInfoToNode(node, entryId);
      } else if (matched.length > 0) {
        node.sensitive = true;
        node.checked = false;
        node.checkedBy = undefined;
        node.checkedAt = undefined;
      }
      if (node.children) this.markNodeSensitive(node.children, entryId);
    }
  }

  /** Extracts the inference id from a top-level node's `entry-<id>` id. */
  private entryIdOf(top: LogNode): string {
    const m = /^entry-([0-9]+)/.exec(top.id);
    return m ? m[1] : top.id;
  }

  /** Stable key for one (entry, element) sensitive acknowledgement. */
  private sensitiveKey(entryId: string, elementName: string): string {
    return `${entryId}|${elementName.toLowerCase()}`;
  }

  /**
   * Handles the user ticking/unticking a sensitive node's dismiss checkbox. The (entry, element)
   * pair is persisted to the backend (attributed to the current user) and kept in memory so the
   * node stays unmarked on later loads; unticking removes the check again.
   */
  onSensitiveChecked(node: LogNode): void {
    const entryId = node.entryId ?? this.entryIdOf(node);
    const names = node.sensitiveNames ?? this.matchingSensitiveNames(node);
    for (const name of names) {
      const key = this.sensitiveKey(entryId, name);
      if (node.checked === true) {
        this.acknowledgedSensitive.add(key);
        this.sensitiveCheckInfo.set(key, {
          username: this.currentUser || "?",
          checkedAt: new Date().toISOString(),
        });
      } else {
        this.acknowledgedSensitive.delete(key);
        this.sensitiveCheckInfo.delete(key);
      }
      this.persistSensitiveCheck(entryId, name, node.checked === true);
    }
    if (node.checked === true) {
      this.applyCheckInfoToNode(node, entryId);
    } else {
      node.checkedBy = undefined;
      node.checkedAt = undefined;
    }
    this.cdr.markForCheck();
  }

  /** Sets the "checked by … on …" badge fields on a node from the stored check details. */
  private applyCheckInfoToNode(node: LogNode, entryId: string): void {
    for (const name of node.sensitiveNames ?? []) {
      const info = this.sensitiveCheckInfo.get(this.sensitiveKey(entryId, name));
      if (info) {
        node.checkedBy = info.username;
        node.checkedAt = info.checkedAt ? this.formatTimestamp(info.checkedAt) : undefined;
        return;
      }
    }
    node.checkedBy = undefined;
    node.checkedAt = undefined;
  }

  /**
   * The requested robust auto-open: after the log is loaded, if the NEWEST entry of the current form
   * used sensitive elements within [AUTO_OPEN_WINDOW_MINUTES] and not all of them are already
   * acknowledged, auto-open the change log with those elements highlighted. Runs on every designer
   * page load, so it also works after the workflow-triggered form reload without relying on
   * localStorage or event timing.
   */
  private autoOpenIfRecentSensitive(): void {
    if (this.visible) return;
    const newest = this.rawEntries[0];
    if (!newest) return;
    const used = newest["sensitiveUsed"];
    if (!Array.isArray(used) || used.length === 0) return;
    const ageMin = this.ageMinutes(String(newest["ts"] ?? ""));
    if (ageMin === null || ageMin > AiAssistantLog.AUTO_OPEN_WINDOW_MINUTES) return;
    const entryId = String(newest["id"] ?? "");
    const unacknowledged = (used as unknown[])
      .map((name) => String(name).toLowerCase())
      .filter((name) => name && !this.acknowledgedSensitive.has(this.sensitiveKey(entryId, name)));
    if (unacknowledged.length === 0) return;
    console.log("[AIAssistantLog] autoOpenIfRecentSensitive: opening with", JSON.stringify(unacknowledged));
    this.open(unacknowledged);
  }

  /** Minutes since a backend timestamp ("yyyy-MM-dd HH:mm:ss.SSS"); null when unparseable. */
  private ageMinutes(ts: string): number | null {
    if (!ts) return null;
    const normalized = ts.includes(" ") ? ts.replace(" ", "T") : ts;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return null;
    return (Date.now() - date.getTime()) / 60000;
  }

  /** Persists/removes one sensitive-element dismiss check for the current user on the backend. */
  private persistSensitiveCheck(entryId: string, elementName: string, checked: boolean): void {
    getJQuery().ajax({
      url: `${this.baseUrl}plugin?name=CodBi_AICodBiAssistant`,
      type: "POST",
      headers: { "X-Action": "SensitiveCheck" },
      data: { entryId, elementName, checked: String(checked) },
      dataType: "json",
    });
  }

  /** The configured sensitive element names (lowercased) that match a node's label/value. */
  private matchingSensitiveNames(node: LogNode): string[] {
    const label = node.label.toLowerCase();
    const value = node.value !== undefined ? String(node.value).toLowerCase() : "";
    const matched: string[] = [];
    for (const [name, pattern] of this.sensitivePatterns.entries()) {
      if (pattern.test(label) || (value && pattern.test(value))) matched.push(name);
    }
    return matched;
  }

  /** Cached word-boundary regexes (lowercased, regex-escaped) for each configured sensitive element. */
  private readonly sensitivePatterns = new Map<string, RegExp>();

  /** Rebuilds [sensitivePatterns] after the configured sensitive list changes. */
  private updateSensitivePatterns(): void {
    this.sensitivePatterns.clear();
    for (const name of this.sensitiveElements) {
      if (!name) continue;
      // Word-boundary match that mirrors the backend: "HTML" must not match inside "HTML.CSS".
      this.sensitivePatterns.set(name, new RegExp(`(?<![A-Za-z0-9_.])${this.escapeRegex(name)}(?![A-Za-z0-9_.])`));
    }
  }

  /** Escapes all regex-special characters in a literal string. */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /** Clears the search box and shows all log entries again. */
  clearSearch(): void {
    this.searchText = "";
    this.logs = this.buildTree(this.applyFilter(this.rawEntries));
    this.markSensitiveNodes();
    this.cdr.markForCheck();
  }

  /**
   * Expands every tree node that lies on the path down to a node whose label/value matches the
   * current [searchText], so search results are revealed instead of hidden behind collapsed
   * sections. Ancestors of a match are always opened; a matching **prompt** node is opened itself as
   * well, because the prompt's text body only renders when that leaf node is expanded.
   */
  private expandSearchMatches(): void {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return;
    this.expandToSearchMatches(this.logs, q);
  }

  /** Recursively expands the ancestors (and matching prompt leaves) of nodes matching [q]. Returns true when a match was found in this sub-tree. */
  private expandToSearchMatches(nodes: LogNode[], q: string): boolean {
    let anyMatch = false;
    for (const node of nodes) {
      const selfMatches =
        node.label.toLowerCase().includes(q) ||
        (node.value !== undefined && String(node.value).toLowerCase().includes(q));
      const childMatches = node.children ? this.expandToSearchMatches(node.children, q) : false;
      if (selfMatches || childMatches) {
        // Open the section that contains the match. A prompt node whose own text matches is also
        // opened so its body (the prompt) is visible.
        if (childMatches || (selfMatches && node.kind === "prompt")) node.expanded = true;
        anyMatch = true;
      }
    }
    return anyMatch;
  }

  /**
   * Filters the raw log entries by the current [searchText]. A case-insensitive substring match is
   * applied to the prompt, the model id and every value in the entry's `form` change description
   * (widget names, class names, attribute names/values, variable names), so e.g. typing a class name
   * or a global-variable name shows the matching inferences.
   */
  private applyFilter(entries: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) => {
      const prompt = String(entry["prompt"] ?? "").toLowerCase();
      const model = String(entry["modelId"] ?? "").toLowerCase();
      if (prompt.includes(q) || model.includes(q)) return true;
      const form = entry["form"] as Record<string, unknown> | undefined;
      if (form) {
        if (this.formMatches(form, q)) return true;
      }
      return false;
    });
  }

  /** Whether any widget/class/attribute/variable in the form change description matches [q]. */
  private formMatches(form: Record<string, unknown>, q: string): boolean {
    const sections = ["widgetsCreated", "widgetsRemoved", "classesSet", "attributesSet", "variablesSet"];
    for (const section of sections) {
      const items = form[section];
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (typeof item !== "object" || item === null) continue;
        for (const value of Object.values(item as Record<string, unknown>)) {
          if (Array.isArray(value)) {
            if (value.some((v) => typeof v === "string" && v.toLowerCase().includes(q))) return true;
          } else if (value !== null && value !== undefined) {
            if (String(value).toLowerCase().includes(q)) return true;
          }
        }
      }
    }
    return false;
  }

  /** Downloads the currently loaded change-log entries as a JSON file. */
  exportLog(): void {
    if (this.rawEntries.length === 0) {
      return;
    }
    const blob = new Blob([JSON.stringify(this.rawEntries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = this.currentFormKey ? `codbi-ai-log-${this.currentFormKey}.json` : "codbi-ai-log.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  /** Formats a single entry's estimated cost with its currency. Empty when zero or no currency. */
  private formatEntryCost(cost: number, currency: string): string {
    if (!cost || cost <= 0 || !currency) return "";
    return `${currency} ${cost.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`;
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

  /** Total estimated cost of all recorded inferences of the current form, grouped per currency. */
  get totalCostLabel(): string {
    if (this.costByCurrency.size === 0) return "";
    return [...this.costByCurrency.entries()]
      .map(
        ([currency, cost]) =>
          `${currency} ${cost.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`,
      )
      .join(" \u00B7 ");
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
      const inferenceTs = this.formatTimestamp(String(entry["ts"] ?? ""));
      const inferenceUser = String(entry["username"] ?? "");
      return {
        id: entryId,
        kind: "inference",
        label: inferenceUser ? `${inferenceTs} \u00B7 ${inferenceUser}` : inferenceTs,
        badge: [
          this.formatTokenSplit(Number(entry["tokensIn"] ?? 0), Number(entry["tokensOut"] ?? 0)) ||
            this.formatTokens(Number(entry["tokens"] ?? 0)),
          this.formatEntryCost(Number(entry["cost"] ?? 0), String(entry["currency"] ?? "")),
        ]
          .filter(Boolean)
          .join(" \u00B7 "),
        ts: String(entry["ts"] ?? ""),
        value: prompt,
        raw: entry,
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
    const variables = (form["variablesSet"] as Array<Record<string, unknown>> | undefined) ?? [];

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
    if (variables.length > 0) {
      children.push({
        id: `${entryId}-variables`,
        kind: "section",
        label: `Global variables set (${variables.length})`,
        children: variables.map((variable, i) => {
          const name = String(variable["name"] ?? "");
          const value = String(variable["value"] ?? "");
          return {
            id: `${entryId}-variables-${i}`,
            kind: "var",
            label: variable["removed"] ? `Remove ${name}` : `${name} = ${value}`,
            raw: variable as Record<string, unknown>,
          };
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

  /**
   * Whether a CSS class name belongs to a CodBi standard configuration. Recognizes the system
   * class-name prefixes (`CodBi_` / `AI_`) as well as every class defined by a standard
   * configuration in the local API doc manager (`window.CodbiPluginData.detStandards[].classes`).
   */
  private isCodbiClass(name: string): boolean {
    if (name.startsWith("CodBi_") || name.startsWith("AI_")) return true;
    const standards = (window as unknown as Record<string, unknown>)["CodbiPluginData"] as
      | Record<string, unknown>
      | undefined;
    const detStandards = standards?.["detStandards"] as Record<string, Record<string, unknown>> | undefined;
    if (!detStandards) return false;
    for (const standard of Object.values(detStandards)) {
      const classes = standard?.["classes"] as Record<string, string> | undefined;
      if (classes && Object.prototype.hasOwnProperty.call(classes, name)) return true;
    }
    return false;
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
