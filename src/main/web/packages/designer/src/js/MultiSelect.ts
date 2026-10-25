// #region Imports
// #region XIMA
import { $, Callbacks, Editors, type IPropertyDescriptor, type TEditorCfg } from "@de-xima/fc-form-designer";
import { parseString } from "@de-xima/xima-common-js-lang";
// #endregion XIMA
// #region XDBC
import { DEFINED } from "xdbc/src/DBC/DEFINED";
// #endregion XDBC
// #region CodBi
import { notifyFormPreviewChanged } from "./CodbiElementMarkers.js";
import { i18n } from "./i18n.js";
// #endregion CodBi
// #endregion Imports
/** Defines the type of {@link MultiSelect }. */
export const MultiSelectType = "com.github.xima_formcycle_entwicklerkreis.fc.plugin:fc-plugin-codbi:MultiSelect";
/** Describes the {@link MultiSelectType }. */
export interface IMultiSelectDescriptor extends IPropertyDescriptor<typeof MultiSelectType> {}
/** Augmenting **@de-xima/fc-form-designer** in order to add the {@link MultiSelectType } to {@link IEditorMap }.*/
declare module "@de-xima/fc-form-designer" {
  export interface IEditorMap {
    [MultiSelectType]: {
      /** Stores the {@link IMultiSelectDescriptor }. */
      descriptor: IMultiSelectDescriptor;

      /** Stores the {@link MultiSelect }-Editor itself. */
      editor: MultiSelect;

      /** Stores the selected standard configurations CSV. */
      value: string;
    };
  }
}
/** One node of the standard-configuration tree built from the dotted configuration ids. */
interface IStandardTreeNode {
  /** The last dotted segment shown as the node's label (e.g. `Media`). */
  segment: string;
  /** The full dotted path (e.g. `Holistic.Media.Input`). */
  path: string;
  /** The configuration id when this node itself is selectable (leaf or a selectable branch). */
  id?: string;
  /** The child nodes of a branch. */
  children: Array<IStandardTreeNode>;
}
/** The rendered counterpart of one {@link IStandardTreeNode }. */
interface IStandardTreeRow {
  /** The visible row (`<div>` for a leaf, `<summary>` for a branch). */
  element: HTMLElement;
  /** The configuration id when this node is selectable. */
  id?: string;
  /** The checkbox of a selectable node. */
  input?: HTMLInputElement;
  /** The collapsible branch wrapper (only set for nodes with children). */
  branch?: HTMLDetailsElement;
  /** The rendered children of a branch. */
  children: Array<IStandardTreeRow>;
  /** The full dotted path of this node. */
  path: string;
}
/**
 * A plain {@link Editors.BaseEditor <typeof MultiSelectType>} retrieving it's  available options to display out of
 * {@link window..  CodbiPluginData.fileListing } storing the made selections.
 *
 * The options are rendered as a **treeview**: configurations are grouped by the dot-separated
 * namespaces of their ids (e.g. `Holistic.Media.Input.Speech` → `Holistic` / `Media` / `Input` /
 * `Speech`). The first list item is a filter input, and the button on its right toggles between
 * showing all configurations and only the activated ones.
 *
 * Primarily intended to be used for selecting CodBi's standard configurations that shall be included into a form. */
export class MultiSelect extends Editors.BaseEditor<typeof MultiSelectType> {
  /** Stores the container for this {@link MultiSelect }. */
  private _element: HTMLDivElement;
  /** Cache of created checkbox inputs. */
  private _inputs: HTMLInputElement[] = [];
  /** Cache for parsed file listing. */
  private _listingCache: string[] | null = null;
  /** Cache for raw file listing string to detect changes. */
  private _listingCacheRaw: string | null = null;
  /** The rendered top-level tree rows, used by the visibility (filter / only-checked) pass. */
  private _rows: Array<IStandardTreeRow> = [];
  /** The current filter query of the treeview (persisted across rebuilds). */
  private _query = "";
  /** Whether only activated configurations are shown (persisted across rebuilds). */
  private _onlyChecked = false;
  /**
   * The last value that was passed to {@link setValue}, tracked so that
   * {@link populateStandards} can restore it after rebuilding the checkbox list
   * even when the DOM checkbox state is no longer reliable (e.g. after FORMCYCLE's
   * catalog-loading re-renders the panel).
   */
  private _currentValue: string = "";
  /**
   * Set to `true` while {@link setStandardsValue} is executing its
   * {@link Callbacks} fire, so that FORMCYCLE's synchronous internal
   * reset `setValue("")` call cannot wipe {@link _currentValue} before
   * {@link populateStandards} runs to restore it.
   */
  private _protecting = false;
  /**
   * Converts a value to a stable JSON string representation.
   *
   * For objects, keys are sorted alphabetically to ensure consistent output
   * regardless of property order. This is useful for comparison and caching purposes.
   *
   * @param value - The value to stringify. Can be any type including primitives, arrays, or objects.
   *
   * @returns A stable JSON string representation of the value. */
  private stableStringify(value: unknown): string {
    if (value == null || typeof value !== "object") {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map((entry) => this.stableStringify(entry)).join(",")}]`;
    }

    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${this.stableStringify(entry)}`);

    return `{${entries.join(",")}}`;
  }
  private readonly _onListingChange = (event: Event): void => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") {
      return;
    }

    // Update the `Active` flags FIRST so anything reacting to the persisted change (the holistic
    // standard-configuration badges) already sees the new state.
    this.setStandardActive(target.value, target.checked, window.CodbiPluginData.detStandards);
    Callbacks["set-property"].fire(this.config.property, this.getValue(), this);
    // Keep the "only checked" view truthful while it is active.
    this.applyTreeVisibility();
    // Activating/deactivating a standard configuration changes what the form runtime applies to the
    // widgets (holistic configs resolve their targets by a runtime selector), so refresh the
    // RUNNING element previews. The preview renders the server-side draft, which needs a moment to
    // sync the changed form property before its iframe is reloaded.
    notifyFormPreviewChanged();
  };
  /**
   * Creates a new {@link MultiSelect } by retrieving the available options from
   * {@link window..CodbiPluginData.fileListing } and generating an appropriate {@link HTMLInputElement } for each
   * entry there. Each {@link HTMLInputElement } will trigger a **set-property** from {@link Callbacks } when
   * clicked.
   *
   * @param config - Configuration for this editor. */
  constructor(config: TEditorCfg<IMultiSelectDescriptor>) {
    // Note: the second argument is deprecated, we pass the empty string
    super(config, "", "text");
    window.CodbiPluginData.populateStandards = this.populateStandards.bind(this);
    window.CodbiPluginData.setStandardsValue = this.setStandardsValue.bind(this);

    this._element = document.createElement("div");

    this._element.setAttribute("id", "CodBi_Standardslisting");
    this._element.className = "codbi-standards-tree";
    this._element.addEventListener("change", this._onListingChange);
    this.populateStandards();
    // If the AI computed updated standards while this panel was closed, they were queued in
    // pendingStandards. Consume and apply them deferred by one event cycle so FORMCYCLE's own
    // synchronous initial setValue() call (which fires right after construction) runs first and
    // won't overwrite the AI-computed result.
    const pending =
      window.CodbiPluginData.pendingStandards ?? sessionStorage.getItem("codbi-pending-standards") ?? undefined;
    if (typeof pending === "string") {
      window.CodbiPluginData.pendingStandards = undefined;
      sessionStorage.removeItem("codbi-pending-standards");
      setTimeout(() => {
        this.setStandardsValue(pending);
      }, 0);
    }
  }
  /**
   * Sets the active state of a standard configuration in the global standards detail object.
   *
   * @param configuration - The name of the standard configuration to update.
   * @param checked - The desired active state for the configuration.
   * @param detStandards - The standards detail object containing configuration states.
   */
  private setStandardActive(
    configuration: string,
    checked: boolean,
    detStandards: Record<string, { Active?: boolean }>,
  ): void {
    if (detStandards[configuration]) {
      DEFINED.tsCheck(detStandards[configuration]).Active = checked;
    }
  }
  /**
   * Builds the dotted-namespace tree from the flat list of configuration ids.
   *
   * `Holistic.Media.Input.Speech` becomes `Holistic` → `Media` → `Input` → `Speech`; a
   * configuration whose id is also a prefix of another id (e.g. `…Speech` and
   * `…Speech.Whisper`) is represented by a **selectable branch** node that carries both its own
   * checkbox and children.
   *
   * @param listing The flat configuration ids (file names without their extension).
   *
   * @returns The top-level tree nodes, sorted alphabetically at every level. */
  private buildTree(listing: Array<string>): Array<IStandardTreeNode> {
    const root: IStandardTreeNode = { segment: "", path: "", children: [] };

    for (const configuration of listing) {
      const segments = configuration.split(".").filter((segment) => segment !== "");

      if (segments.length === 0) {
        continue;
      }

      let node = root;
      let path = "";

      for (const segment of segments) {
        path = path === "" ? segment : `${path}.${segment}`;
        let child = node.children.find((candidate) => candidate.segment === segment);

        if (!child) {
          child = { segment, path, children: [] };
          node.children.push(child);
        }

        node = child;
      }

      node.id = configuration;
    }

    const sort = (nodes: Array<IStandardTreeNode>): void => {
      nodes.sort((left, right) => left.segment.localeCompare(right.segment));

      for (const node of nodes) {
        sort(node.children);
      }
    };
    sort(root.children);

    return root.children;
  }
  /**
   * Renders one level of the tree into **container** and records the rows for the visibility pass.
   *
   * @param nodes     The nodes of this level.
   * @param container The element to append the rendered nodes to.
   *
   * @returns The rendered rows of this level. */
  private renderTree(nodes: Array<IStandardTreeNode>, container: HTMLElement): Array<IStandardTreeRow> {
    const rows = new Array<IStandardTreeRow>();

    for (const node of nodes) {
      const hasChildren = node.children.length > 0;
      const row: IStandardTreeRow = {
        element: document.createElement("div"),
        children: [],
        path: node.path,
        id: node.id,
      };
      rows.push(row);

      // The selectable part (checkbox + label) or the plain branch label.
      const select = document.createElement("span");
      select.className = "codbi-standards-tree__select";

      if (node.id) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = node.id;
        checkbox.id = `CodBi-StandardConfigSelector_${node.id}`;
        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.textContent = node.segment;
        label.title = node.id;
        select.append(checkbox, label);
        row.input = checkbox;
        this._inputs.push(checkbox);
      } else {
        const label = document.createElement("span");
        label.className = "codbi-standards-tree__branchlabel";
        label.textContent = node.segment;
        label.title = node.path;
        select.appendChild(label);
      }

      if (hasChildren) {
        // Tree nodes start FOLDED; filtering or the "only activated" view expands matches.
        const details = document.createElement("details");
        details.className = "codbi-standards-tree__branch";
        details.open = false;

        const summary = document.createElement("summary");
        summary.className = "codbi-standards-tree__row";
        const chevron = document.createElement("span");
        chevron.className = "codbi-standards-tree__chevron";
        chevron.textContent = "▸";
        // Clicking the checkbox/label must not collapse the branch.
        select.addEventListener("click", (event) => event.stopPropagation());
        summary.append(chevron, select);
        details.addEventListener("toggle", () => {
          chevron.textContent = details.open ? "▾" : "▸";
        });

        const children = document.createElement("div");
        children.className = "codbi-standards-tree__children";
        row.children = this.renderTree(node.children, children);

        details.append(summary, children);
        container.appendChild(details);
        row.element = summary;
        row.branch = details;
        continue;
      }

      const spacer = document.createElement("span");
      spacer.className = "codbi-standards-tree__chevron";
      row.element.className = "codbi-standards-tree__row";
      row.element.append(spacer, select);
      container.appendChild(row.element);
    }

    return rows;
  }
  /**
   * Applies the current {@link _query} and {@link _onlyChecked} state to the rendered tree.
   *
   * A branch stays visible while any descendant is visible; when filtering or restricting to
   * activated configurations all matching branches are expanded so the matches are immediately
   * visible. */
  private applyTreeVisibility(): void {
    const query = this._query.trim().toLowerCase();
    const onlyChecked = this._onlyChecked;

    const visit = (row: IStandardTreeRow, ancestorMatched: boolean): boolean => {
      const matched = ancestorMatched || query === "" || row.path.toLowerCase().includes(query);
      const selfVisible = row.id !== undefined && matched && (!onlyChecked || (row.input?.checked ?? false));
      let childVisible = false;

      for (const child of row.children) {
        if (visit(child, matched)) {
          childVisible = true;
        }
      }

      const visible = selfVisible || childVisible;
      row.element.hidden = !visible;

      if (row.branch) {
        row.branch.hidden = !visible;

        if (visible && (query !== "" || onlyChecked)) {
          row.branch.open = true;
        }
      }

      return visible;
    };

    for (const row of this._rows) {
      visit(row, false);
    }
  }
  /** Populates the listing of standards as a treeview. */
  protected populateStandards(): void {
    // #region Retrieve available standard configurations
    const rawListing: unknown = window.CodbiPluginData.fileListing as unknown;
    const listingKey = Array.isArray(rawListing)
      ? rawListing
          .filter((file): file is string => typeof file === "string")
          .slice()
          .sort()
          .join("\u0000")
      : typeof rawListing === "string"
        ? rawListing
        : this.stableStringify(rawListing);

    if (this._listingCacheRaw !== listingKey) {
      this._listingCacheRaw = listingKey;

      let parsedListing: string[] = [];

      if (typeof rawListing === "string") {
        try {
          parsedListing = JSON.parse(rawListing);
        } catch {
          parsedListing = [];
        }
      } else if (Array.isArray(rawListing)) {
        parsedListing = rawListing.slice();
      }

      this._listingCache = parsedListing
        .filter((file): file is string => typeof file === "string")
        .map((file) => {
          return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
        });
    }

    const listing = this._listingCache ?? [];
    // #endregion Retrieve available standard configurations
    // #region Clear
    // Use the last tracked value rather than reading live checkbox state: the checkboxes
    // may have been reset by FORMCYCLE between the previous setValue call and this repopulate.
    const bufValue: string = this._currentValue;

    this._element.innerHTML = "";
    this._inputs = [];
    this._rows = [];
    // #endregion Clear
    // #region Header: filter input (first list item) + "only checked" toggle on the right.
    const style = document.createElement("style");
    style.textContent = `
.codbi-standards-tree{display:flex;flex-direction:column;max-height:280px;border:1px solid #d0d5dd;border-radius:4px;background:#fff;white-space:normal;overflow:hidden;font:inherit;color:#344054}
.codbi-standards-tree [hidden]{display:none!important}
.codbi-standards-tree__head{display:flex;align-items:center;gap:4px;padding:4px;border-bottom:1px solid #e4e7ec;background:#f9fafb}
.codbi-standards-tree__filter{flex:1 1 auto;min-width:0;padding:2px 6px;border:1px solid darkorange;border-radius:3px;font:inherit}
.codbi-standards-tree__filter:focus{outline:none;border-bottom-width:3px}
.codbi-standards-tree__only{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:1px solid #d0d5dd;border-radius:3px;background:#fff;color:#667085;cursor:pointer;font:inherit;line-height:1}
.codbi-standards-tree__only:hover{background:#f2f4f7}
.codbi-standards-tree__only--active{background:darkorange;border-color:darkorange;color:#fff}
.codbi-standards-tree__only--active:hover{background:#c96a00;border-color:#c96a00}
.codbi-standards-tree__body{overflow:auto;padding:2px 4px}
.codbi-standards-tree__branch{display:block}
.codbi-standards-tree summary{list-style:none;display:flex;align-items:center;gap:4px;padding:1px 2px;cursor:pointer;white-space:nowrap}
.codbi-standards-tree summary::-webkit-details-marker{display:none}
.codbi-standards-tree__chevron{flex:0 0 12px;width:12px;text-align:center;color:#667085;font-size:10px}
.codbi-standards-tree__row{display:flex;align-items:center;gap:4px;padding:1px 2px;white-space:nowrap}
.codbi-standards-tree__select{display:inline-flex;align-items:center;gap:4px;min-width:0}
.codbi-standards-tree__select label,.codbi-standards-tree__branchlabel{cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.codbi-standards-tree__branchlabel{color:#475467;font-weight:600}
.codbi-standards-tree__children{margin-left:14px;padding-left:6px;border-left:1px dotted #d0d5dd}
.codbi-standards-tree input[type="checkbox"]{margin:0;appearance:none;-webkit-appearance:none;box-sizing:border-box;width:14px;height:14px;border:1px solid darkorange;border-radius:2px;background:#fff;cursor:pointer}
.codbi-standards-tree input[type="checkbox"]:checked{background:darkorange url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 6.5 5 9l5-6' fill='none' stroke='%23fff' stroke-width='2'/%3E%3C/svg%3E") center/10px 10px no-repeat}
.codbi-standards-tree input[type="checkbox"]:focus-visible{outline:2px solid darkorange;outline-offset:1px}
`;

    const head = document.createElement("div");
    head.className = "codbi-standards-tree__head";

    const filter = document.createElement("input");
    filter.type = "text";
    filter.className = "codbi-standards-tree__filter";
    filter.placeholder = i18n("designer.property.standards.filter");
    filter.title = i18n("designer.property.standards.filter");
    filter.value = this._query;
    filter.addEventListener("input", () => {
      this._query = filter.value;
      this.applyTreeVisibility();
    });

    const onlyChecked = document.createElement("button");
    onlyChecked.type = "button";
    onlyChecked.className = "codbi-standards-tree__only";
    onlyChecked.textContent = "✓";
    onlyChecked.title = i18n("designer.property.standards.onlyChecked");
    onlyChecked.setAttribute("aria-label", i18n("designer.property.standards.onlyChecked"));
    onlyChecked.setAttribute("aria-pressed", String(this._onlyChecked));
    onlyChecked.classList.toggle("codbi-standards-tree__only--active", this._onlyChecked);
    onlyChecked.addEventListener("click", (event) => {
      event.preventDefault();
      this._onlyChecked = !this._onlyChecked;
      onlyChecked.setAttribute("aria-pressed", String(this._onlyChecked));
      onlyChecked.classList.toggle("codbi-standards-tree__only--active", this._onlyChecked);
      this.applyTreeVisibility();
    });

    head.append(filter, onlyChecked);
    // #endregion Header
    // #region Generate and inject the configuration tree.
    const body = document.createElement("div");
    body.className = "codbi-standards-tree__body";
    this._rows = this.renderTree(this.buildTree(listing), body);

    this._element.append(style, head, body);
    // #endregion Generate and inject the configuration tree.
    this.setValue(bufValue);
    this.applyTreeVisibility();
  }
  /** See {@link Editors.BaseEditor }'s **getElement**. */
  override getElement(): JQuery {
    return $(this._element);
  }
  /**
   * Programmatically sets the active standard configurations, updates the UI checkboxes, and
   * fires the **set-property** callback so the form designer persists the change.
   *
   * Used by the AI assistant to apply auto-managed standard configuration updates.
   *
   * @param csv Comma-separated list of active standard configuration names.
   */
  setStandardsValue(csv: string): void {
    this._protecting = true;
    try {
      this.setValue(csv);
      Callbacks["set-property"].fire(this.config.property, this.getValue(), this);
    } finally {
      this._protecting = false;
    }
    // The standard configurations were changed programmatically (e.g. by the AI assistant), so the
    // running element previews must be re-rendered with the newly activated holistic configs.
    notifyFormPreviewChanged();
  }
  /**
   * Generates a CSV of all selected standard configurations.
   *
   * @returns A CSV of all selected standard configurations. */
  override getValue(): string {
    // If the AI queued updated standards while the panel was closed, merge them
    // with whatever the user currently has checked so manual selections are preserved.
    const pending =
      window.CodbiPluginData.pendingStandards ?? sessionStorage.getItem("codbi-pending-standards") ?? undefined;
    if (typeof pending === "string" && this._inputs.length > 0) {
      window.CodbiPluginData.pendingStandards = undefined;
      sessionStorage.removeItem("codbi-pending-standards");
      const currentlyChecked = this._inputs.filter((i) => i.checked).map((i) => i.value);
      const pendingItems = pending
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const merged = [...new Set([...currentlyChecked, ...pendingItems])].join(",");
      this.setValue(merged);
    }

    const result: string[] = [];
    for (const current of this._inputs) {
      if (current.checked) {
        result.push(current.value);
      }
    }

    return result.join(",");
  }
  /**
   * Clears all selections prior to setting the selected configurations according to the received **data**.
   *
   * @param data See {@link Editors.BaseEditor }'s **setValue**. */
  override setValue(data: unknown): void {
    const normalized = typeof data === "string" ? data : data != null ? String(data) : "";
    // Only update the tracked value when not in a protection window or the incoming value is
    // non-empty. This prevents FORMCYCLE's internal reset setValue("") call — fired synchronously
    // inside the Callbacks["set-property"] chain — from wiping the last desired value before
    // populateStandards() runs to restore it.
    if (!this._protecting || normalized !== "") {
      this._currentValue = normalized;
    }
    // Prevent FORMCYCLE's internal reset setValue("") call — fired synchronously inside the
    // Callbacks["set-property"] chain from setStandardsValue — from clearing the checkbox DOM
    // after the intended value has already been applied. The _currentValue guard above protects
    // the tracked value, but we must also protect the checkbox states.
    if (this._protecting && normalized === "") {
      return;
    }
    if (this._inputs.length === 0) {
      return;
    }
    // #region Clear selection.
    for (const element of this._inputs) {
      element.checked = false;
    }
    // #endregion Clear selection.
    // #region Clear marked standards globally
    const detStandards = window.CodbiPluginData.detStandards;

    for (const detail in detStandards) {
      this.setStandardActive(detail, false, detStandards);
    }
    // #endregion Clear marked standards globally
    // #region Set according to [data].
    const selected = new Set(
      parseString(data)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    );

    for (const element of this._inputs) {
      if (selected.has(element.value)) {
        element.checked = true;
      }
    }

    for (const standard of selected) {
      this.setStandardActive(standard, true, detStandards);
    }
    // #endregion Set according to [data].
    this.applyTreeVisibility();
  }
}
