// #region Imports
import type { ICsvSubpartSpec, IFunctionalityParameterSpec } from "./FunctionalityConfigEditor.js";
// #endregion Imports

/**
 * A grid/table editor for **`type: "csv"`** Component parameters, opened inside a popup.
 *
 * A `csv` parameter holds a **CSV** string: the elements (rows) are separated by
 * {@link csvItemSeparator } (default `,`) and the subparts (fields / columns) of every element by
 * {@link csvFieldSeparator } (default `;`). The parameter's `@ParameterTypes` spec carries an
 * ordered `columns` array (see {@link ICsvSubpartSpec }) defining each subpart's type and column
 * name. This module renders a proper table (one row per element, one type-appropriate input per
 * subpart) and serializes the grid back into the CSV on apply.
 *
 * The editor is opened as a modal popup because such a nested grid does not fit inside the compact
 * parameter row of the functionality/component config panel.
 */

/** Default separator between the elements (rows) of a `csv` parameter. */
const DEFAULT_ITEM_SEPARATOR = ",";
/** Default separator between the subparts (fields) of one element of a `csv` parameter. */
const DEFAULT_FIELD_SEPARATOR = ";";

/** CodBi brand accent used for the popup chrome (matches the EP builder's `darkorange` theme). */
const CSVG_ACCENT = "darkorange";

/** Absolute URL of the CodBi logo served by the plugin's `Resource` servlet. */
const CODBI_LOGO_URL = (() => {
  const baseURL = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  const path = encodeURIComponent("/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg");

  return `${baseURL}plugin?name=Resource&Path=${path}`;
})();

/** The popup's embedded stylesheet (self-contained, mirroring the EP builder's CodBi overlay/popup style). */
const GRID_CSS = `
.codbi-csvg{--csvg-accent:${CSVG_ACCENT};font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:12px;color:#172b4d}
.codbi-csvg-overlay{position:fixed;inset:0;z-index:100000;background:rgba(9,30,66,.42);display:block}
.codbi-csvg-popup{position:fixed;display:flex;flex-direction:column;background:#fff;border:2px solid var(--csvg-accent);border-radius:8px;box-shadow:0 12px 36px rgba(0,0,0,.45);overflow:hidden}
.codbi-csvg-popup--docked{border-radius:0;max-height:100vh}
.codbi-csvg-popup::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.06;background-image:var(--csvg-logo-url,none);background-repeat:no-repeat;background-position:center;background-size:160px auto}
/* No header: the darkorange border doubles as the frame. Resize handles on every edge and corner make
   the popup resizable, each showing the appropriate resize cursor. */
.codbi-csvg-resizer{position:absolute;z-index:6;touch-action:none;background:transparent}
.codbi-csvg-resizer--se{right:0;bottom:0;width:20px;height:20px;cursor:nwse-resize}
.codbi-csvg-resizer--nw{left:0;top:0;width:14px;height:14px;cursor:nwse-resize}
.codbi-csvg-resizer--ne{right:0;top:0;width:14px;height:14px;cursor:nesw-resize}
.codbi-csvg-resizer--sw{left:0;bottom:0;width:14px;height:14px;cursor:nesw-resize}
.codbi-csvg-resizer--n{left:0;right:0;top:0;height:5px;cursor:ns-resize}
.codbi-csvg-resizer--s{left:0;right:0;bottom:0;height:5px;cursor:ns-resize}
.codbi-csvg-resizer--e{right:0;top:0;bottom:0;width:5px;cursor:ew-resize}
.codbi-csvg-resizer--w{left:0;top:0;bottom:0;width:5px;cursor:ew-resize}
.codbi-csvg-body{position:relative;flex:1 1 auto;min-height:0;padding:12px 14px;overflow:auto;min-width:520px}
.codbi-csvg-table{border-collapse:collapse;width:100%;table-layout:auto}
.codbi-csvg-table th,.codbi-csvg-table td{border:1px solid #e6cf9a;padding:4px 6px;vertical-align:middle;text-align:left;background:transparent}
.codbi-csvg-table th{background:rgba(255,165,0,.12);font-weight:600;white-space:nowrap}
.codbi-csvg-table th .codbi-csvg-req{color:#de350b;font-weight:700;margin-left:2px}
.codbi-csvg-cell{display:flex;align-items:center;gap:6px;min-width:90px;background:transparent}
.codbi-csvg-input{flex:1;box-sizing:border-box;border:1px solid #e6cf9a;border-radius:3px;padding:3px 6px;font:inherit;color:inherit;background:transparent}
.codbi-csvg-input:focus{outline:2px solid var(--csvg-accent);outline-offset:-1px;border-color:var(--csvg-accent);background:rgba(255,165,0,.05)}
.codbi-csvg-boolean{flex:0 0 auto;display:flex;align-items:center;justify-content:center;background:transparent}
.codbi-csvg-rowdel{border:0;background:transparent;color:#de350b;font-size:16px;cursor:pointer;padding:0 2px;line-height:1}
.codbi-csvg-rowdel:hover{color:#bf2600}
.codbi-csvg-add{display:inline-flex;align-items:center;gap:6px;margin-top:10px;border:1px dashed var(--csvg-accent);background:#fff;color:var(--csvg-accent);border-radius:4px;padding:5px 10px;font:inherit;cursor:pointer}
.codbi-csvg-add:hover{background:#fff4e0}
.codbi-csvg-foot{position:relative;display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:10px 14px;border-top:1px solid #f0d3a4}
.codbi-csvg-btn{border:1px solid transparent;border-radius:4px;padding:6px 14px;font:inherit;font-weight:600;cursor:pointer}
.codbi-csvg-btn--primary{background:var(--csvg-accent);color:#fff}
.codbi-csvg-btn--primary:hover{background:#ff8c00}
.codbi-csvg-btn--ghost{background:#fff;border-color:#c1c7d0;color:#172b4d}
.codbi-csvg-btn--ghost:hover{background:#f4f5f7}
.codbi-csvg-empty{color:#6b778c;padding:4px 2px}
`;

/**
 * Parses a `csv` parameter value into an array of elements, each an array of subpart values.
 *
 * The input may be a pre-split {@link Array} (the CodBi attribute processor turns a comma containing
 * value into a string array) or a raw {@link string}. Empty elements are dropped.
 *
 * @param value      The raw value.
 * @param itemSep    The separator between elements (rows).
 * @param fieldSep   The separator between subparts (fields) of one element.
 *
 * @returns The parsed rows (a 2-D array of strings). */
export function parseCsvParameter(value: unknown, itemSep: string, fieldSep: string): string[][] {
  const items: string[] = Array.isArray(value) ? (value as string[]) : String(value ?? "").split(itemSep);

  return items
    .map((item) => {
      const fields = String(item)
        .split(fieldSep)
        .map((field) => field.trim());
      return fields.length > 0 && fields.every((field) => field === "") ? [] : fields;
    })
    .filter((fields) => fields.length > 0);
}

/**
 * Serializes an array of elements (each an array of subpart values) back into the `csv` parameter
 * value, joining the subparts with {@link fieldSep} and the elements with {@link itemSep}.
 *
 * Trailing empty OPTIONAL subparts are trimmed so the resulting CSV stays compact (an empty optional
 * `width` does not produce a dangling `;`).
 *
 * @param rows       The rows to serialize.
 * @param itemSep    The separator between elements (rows).
 * @param fieldSep   The separator between subparts (fields).
 * @param columns    The subpart definitions, used to trim trailing optional empty fields.
 *
 * @returns The serialized CSV {@link string}. */
export function serializeCsvParameter(
  rows: string[][],
  itemSep: string,
  fieldSep: string,
  columns?: ICsvSubpartSpec[],
): string {
  return rows
    .map((fields) => {
      let last = fields.length;
      // Trim trailing empty subparts that are OPTIONAL (or not defined), so e.g. an empty `width`
      // does not produce a dangling `;`.
      while (last > 0) {
        const field = fields[last - 1];
        const optional = !columns?.[last - 1]?.required;
        if (field === "" || field === null || field === undefined) {
          if (!optional) {
            break;
          }
          last--;
        } else {
          break;
        }
      }
      return fields.slice(0, last).join(fieldSep);
    })
    .filter((item) => item.length > 0)
    .join(itemSep);
}

/**
 * Attaches a rich, table-styled hover tooltip to a CSV launcher button. The native `title` tooltip
 * only renders plain text, so this renders a real HTML table instead: a header row of column labels
 * and one body row per element, making the current parameter state readable at a glance.
 *
 * The tooltip is a `position:fixed` element appended to `document.body`, shown on `mouseenter` next
 * to the button and removed on `mouseleave`. Its content is (re)built on every show, so it always
 * reflects the latest CSV value.
 *
 * @param button       The "⧉ Edit" button to show the tooltip for.
 * @param getValue     Returns the current raw CSV value.
 * @param spec         The parameter spec (drives the column labels and separators).
 * @param valueSummary A short textual summary (e.g. "2 elements · 3 fields") used as the tooltip title.
 */
export function attachCsvValueTooltip(
  button: HTMLElement,
  getValue: () => string,
  spec: IFunctionalityParameterSpec | undefined,
  valueSummary: string,
): void {
  const doc = button.ownerDocument;
  const columns = (spec?.columns ?? []) as ICsvSubpartSpec[];
  const itemSep = spec?.itemSeparator ?? DEFAULT_ITEM_SEPARATOR;
  const fieldSep = spec?.fieldSeparator ?? DEFAULT_FIELD_SEPARATOR;
  const itemName = spec?.itemName ?? "element";

  const columnLabels = columns.map((col) => String(col?.label ?? col?.name ?? ""));
  const columnCount = Math.max(1, columns.length);

  let tooltip: HTMLDivElement | null = null;
  let hideTimer: number | undefined;

  const renderTooltip = (): { left: number; top: number } => {
    const rows = parseCsvParameter(getValue(), itemSep, fieldSep);
    const btnRect = button.getBoundingClientRect();

    tooltip = doc.createElement("div");
    tooltip.className = "codbi-csvg-tooltip";
    tooltip.style.cssText =
      "position:fixed;z-index:2147483647;background:#1f2a44;color:#e6edf7;" +
      "border:1px solid darkorange;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.35);" +
      "padding:6px 8px;font:12px/1.4 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;" +
      "max-width:420px;max-height:320px;overflow:auto;pointer-events:none;";

    const head = doc.createElement("div");
    head.style.cssText = "color:#ffb347;font-weight:700;margin-bottom:4px;white-space:nowrap;";
    head.textContent = rows.length > 0 ? `${valueSummary}` : `0 ${itemName}s`;
    tooltip.appendChild(head);

    if (rows.length > 0) {
      const table = doc.createElement("table");
      table.style.cssText = "border-collapse:collapse;min-width:100%;";

      const thead = doc.createElement("thead");
      const headerRow = doc.createElement("tr");
      if (columnLabels.length === 0) {
        const single = doc.createElement("th");
        single.textContent = itemName;
        headerRow.appendChild(single);
      } else {
        for (const label of columnLabels) {
          const th = doc.createElement("th");
          th.textContent = label;
          th.style.cssText =
            "border:1px solid rgba(255,179,71,.4);padding:2px 8px;text-align:left;" +
            "color:#ffb347;font-weight:700;white-space:nowrap;background:rgba(255,179,71,.08);";
          headerRow.appendChild(th);
        }
      }
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = doc.createElement("tbody");
      for (const fields of rows) {
        const tr = doc.createElement("tr");
        const n = Math.max(1, fields.length);
        for (let i = 0; i < n; i += 1) {
          const td = doc.createElement("td");
          td.textContent = fields[i] ?? "";
          td.style.cssText = "border:1px solid rgba(255,255,255,.12);padding:2px 8px;white-space:nowrap;color:#e6edf7;";
          tr.appendChild(td);
        }
        // Pad short rows with empty cells so the column alignment stays intact.
        for (let i = n; i < columnCount; i += 1) {
          const td = doc.createElement("td");
          td.style.cssText = "border:1px solid rgba(255,255,255,.12);padding:2px 8px;";
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      tooltip.appendChild(table);
    }

    tooltip.style.visibility = "hidden";
    doc.body.appendChild(tooltip);
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    tooltip.style.visibility = "";

    let left = btnRect.left;
    let top = btnRect.bottom + 6;
    if (left + tw > window.innerWidth - 8) {
      left = Math.max(8, btnRect.right - tw);
    }
    if (top + th > window.innerHeight - 8) {
      top = Math.max(8, btnRect.top - th - 6);
    }

    return { left, top };
  };

  const show = (): void => {
    if (hideTimer !== undefined) {
      window.clearTimeout(hideTimer);
      hideTimer = undefined;
    }
    if (tooltip) {
      tooltip.remove();
      tooltip = null;
    }
    const pos = renderTooltip();
    if (tooltip) {
      tooltip.style.left = `${pos.left}px`;
      tooltip.style.top = `${pos.top}px`;
    }
  };

  const hide = (): void => {
    hideTimer = window.setTimeout(() => {
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }
    }, 80);
  };

  button.addEventListener("mouseenter", show);
  button.addEventListener("mouseleave", hide);
  button.addEventListener("focus", show);
  button.addEventListener("blur", hide);
}

/** The defaults applied to a {@link ICsvSubpartSpec } (its name/label/type). */
interface INormalizedSubpart {
  /** The subpart's name (fallback header). */
  name: string;
  /** The subpart's type. Defaults to `string`. */
  type: "string" | "integer" | "number" | "boolean" | "enum";
  /** For `type: "enum"`: the allowed values. */
  options: string[];
  /** The column header (falls back to the name). */
  label: string;
  /** The default value (as string) or `""`. */
  default: string;
  /** Whether the subpart is mandatory. */
  required: boolean;
}

/** Normalizes a `csv` subpart definition for rendering. */
function normalizeSubpart(subpart: ICsvSubpartSpec | undefined, index: number): INormalizedSubpart {
  const name = String(subpart?.name ?? `field${index + 1}`);
  const type = (subpart?.type ?? "string") as INormalizedSubpart["type"];
  const options = Array.isArray(subpart?.options) ? (subpart?.options as string[]) : [];
  const label = String(subpart?.label ?? subpart?.name ?? name);

  return {
    name,
    type,
    options,
    label,
    default: subpart?.default !== undefined ? String(subpart.default) : "",
    required: subpart?.required === true,
  };
}

/** Options accepted by {@link openCsvGridEditor}. */
export interface ICsvGridEditorOptions {
  /** The document the popup shall be rendered into (usually the canvas iframe's document). */
  document: Document;
  /** An element inside the target document (used to locate its viewport). */
  anchor: HTMLElement;
  /** The current CSV value. */
  value: unknown;
  /** The parameter's spec (its `columns`/`itemName`/separators drive the grid). */
  spec?: IFunctionalityParameterSpec;
  /** Invoked with the serialized CSV when the user confirms. */
  onApply: (value: string) => void;
}

/**
 * Creates a type-appropriate input for one subpart cell.
 *
 * @returns `{ input, read, on }` where `input` is the cell element, `read()` yields the current
 *   cell value as a string and `on(handler)` subscribes to value changes.
 */
function createSubpartInput(
  doc: Document,
  subpart: INormalizedSubpart,
  initial: string,
): { input: HTMLElement; read: () => string; on: (handler: () => void) => void } {
  const cell = doc.createElement("div");
  cell.className = "codbi-csvg-cell";

  const subscribe = (handler: () => void): void => {
    cell.addEventListener("change", handler);
  };

  if (subpart.type === "boolean") {
    const checkbox = doc.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "codbi-csvg-boolean";
    checkbox.style.width = "16px";
    checkbox.style.height = "16px";
    checkbox.checked = ["true", "1", "yes", "on"].includes(initial.toLowerCase());
    cell.appendChild(checkbox);
    return { input: cell, read: () => (checkbox.checked ? "true" : "false"), on: subscribe };
  }

  if (subpart.type === "enum" && subpart.options.length > 0) {
    const select = doc.createElement("select");
    select.className = "codbi-csvg-input";
    const blank = doc.createElement("option");
    blank.value = "";
    select.appendChild(blank);
    for (const option of subpart.options) {
      const opt = doc.createElement("option");
      opt.value = option;
      opt.textContent = option;
      select.appendChild(opt);
    }
    select.value = initial;
    cell.appendChild(select);
    return { input: cell, read: () => select.value, on: subscribe };
  }

  const input = doc.createElement("input");
  input.className = "codbi-csvg-input";
  if (subpart.type === "integer" || subpart.type === "number") {
    input.type = "number";
    input.step = subpart.type === "integer" ? "1" : "any";
  } else {
    input.type = "text";
  }
  input.value = initial;
  cell.appendChild(input);
  return { input: cell, read: () => input.value, on: subscribe };
}

/** Builds one grid row (tr) for the element at `rowIndex`, bound to the live `rows` model. */
function buildRow(
  doc: Document,
  rows: string[][],
  rowIndex: number,
  normalized: INormalizedSubpart[],
  itemName: string,
  rerender: () => void,
): HTMLElement {
  const tr = doc.createElement("tr");
  const fields = rows[rowIndex];

  // Delete-cell.
  const delTd = doc.createElement("td");
  const delBtn = doc.createElement("button");
  delBtn.type = "button";
  delBtn.className = "codbi-csvg-rowdel";
  delBtn.textContent = "✕";
  delBtn.title = `Remove ${itemName}`;
  delBtn.addEventListener("click", () => {
    rows.splice(rowIndex, 1);
    rerender();
  });
  delTd.appendChild(delBtn);
  tr.appendChild(delTd);

  if (normalized.length === 0) {
    // Fall back to a single free-text field (no subpart definition present).
    const td = doc.createElement("td");
    const sub: INormalizedSubpart = {
      name: itemName,
      type: "string",
      options: [],
      label: itemName,
      default: "",
      required: false,
    };
    const { input, read, on } = createSubpartInput(doc, sub, String(fields[0] ?? ""));
    on(() => {
      fields[0] = read();
    });
    td.appendChild(input);
    tr.appendChild(td);
  } else {
    normalized.forEach((sub, colIndex) => {
      const td = doc.createElement("td");
      const { input, read, on } = createSubpartInput(doc, sub, String(fields[colIndex] ?? sub.default ?? ""));
      on(() => {
        fields[colIndex] = read();
      });
      td.appendChild(input);
      tr.appendChild(td);
    });
  }

  return tr;
}

/**
 * Opens the CSV grid editor as a modal popup for one `type: "csv"` parameter and applies the
 * resulting CSV value.
 *
 * @param options The editor options (see {@link ICsvGridEditorOptions }). */
export function openCsvGridEditor(options: ICsvGridEditorOptions): void {
  const doc = options.document;
  const spec = options.spec;
  const columns = (spec?.columns ?? []) as ICsvSubpartSpec[];
  const itemSep = spec?.itemSeparator ?? DEFAULT_ITEM_SEPARATOR;
  const fieldSep = spec?.fieldSeparator ?? DEFAULT_FIELD_SEPARATOR;
  const itemName = spec?.itemName ?? "element";

  const normalized = columns.map((col, index) => normalizeSubpart(col, index));
  const rows = parseCsvParameter(options.value, itemSep, fieldSep);

  // A reusable style element (created lazily, shared across reopenings in the same document).
  let styleEl = doc.head?.querySelector<HTMLStyleElement>("style[data-codbi-csvg]");
  if (!styleEl) {
    styleEl = doc.createElement("style");
    styleEl.setAttribute("data-codbi-csvg", "");
    styleEl.textContent = GRID_CSS;
    doc.head?.appendChild(styleEl);
  }

  const overlay = doc.createElement("div");
  // The base `codbi-csvg` class defines the `--csvg-accent` custom property (and the base font) that
  // every descendant (popup, grip, header, buttons) reads via `var(--csvg-accent)`. Without it on an
  // actual element the variable never resolves, so the darkorange border / grip would be dropped.
  overlay.className = "codbi-csvg codbi-csvg-overlay";

  const popup = doc.createElement("div");
  popup.className = "codbi-csvg-popup";
  // Brand the popup with the CodBi watermark (the faint centered logo behind the grid) —
  // the same `Symbol_CodBi.svg` the EP builder and the function badges use.
  popup.style.setProperty("--csvg-logo-url", `url("${CODBI_LOGO_URL}")`);

  // #region Geometry (move / resize / snap / dock) — mirrors the EP builder / Form Assistant dialog
  const GEOM_KEY = "codbi-csvg-geometry";
  /** Distance from a viewport edge (px) that triggers docking to that side — mirrors the EP builder. */
  const DOCK_MARGIN = 8;
  const MIN_W = 520;
  const MIN_H = 260;

  /** The viewport half the popup may dock to. */
  type DockSide = "left" | "right";
  interface Geometry {
    left: number;
    top: number;
    width: number;
    height: number;
    docked?: DockSide | null;
  }

  /** The half the popup is currently docked to, or **null** while floating. */
  let docked: DockSide | null = null;
  /** The last floating geometry, restored when a docked popup is dragged away from the edge. */
  let floatingGeometry = { left: 0, top: 0, width: 0, height: 0 };

  const clampGeometry = (geom: Geometry): Geometry => {
    const width = Math.max(MIN_W, Math.min(geom.width, window.innerWidth));
    const height = Math.max(MIN_H, Math.min(geom.height, window.innerHeight));

    return {
      width,
      height,
      left: Math.max(0, Math.min(geom.left, window.innerWidth - width)),
      top: Math.max(0, Math.min(geom.top, window.innerHeight - height)),
    };
  };

  /** Docks the popup to a viewport half: full height, half width, flush against that edge. */
  const applyDock = (side: DockSide): void => {
    docked = side;
    popup.classList.add("codbi-csvg-popup--docked");
    popup.style.maxHeight = "100vh";
    popup.style.left = side === "left" ? "0px" : "50vw";
    popup.style.top = "0px";
    popup.style.width = "50vw";
    popup.style.height = "100vh";
  };

  /** Positions the popup as a floating window at **geom** (clamped to the viewport). */
  const applyFloating = (geom: Geometry): void => {
    docked = null;
    popup.classList.remove("codbi-csvg-popup--docked");
    popup.style.maxHeight = "";
    const clamped = clampGeometry(geom);

    floatingGeometry = clamped;
    popup.style.left = `${clamped.left}px`;
    popup.style.top = `${clamped.top}px`;
    popup.style.width = `${clamped.width}px`;
    popup.style.height = `${clamped.height}px`;
  };

  const applyGeometry = (geom: Geometry): void => {
    if (geom.docked === "left" || geom.docked === "right") {
      floatingGeometry = clampGeometry(geom);
      applyDock(geom.docked);

      return;
    }

    applyFloating(geom);
  };

  const defaultGeometry = (): Geometry => {
    const width = Math.min(760, window.innerWidth * 0.9);
    const height = Math.min(560, window.innerHeight * 0.85);

    return { width, height, left: (window.innerWidth - width) / 2, top: (window.innerHeight - height) / 2 };
  };

  const readGeometry = (): Geometry | undefined => {
    try {
      const raw = localStorage.getItem(GEOM_KEY);

      return raw ? (JSON.parse(raw) as Geometry) : undefined;
    } catch {
      return undefined;
    }
  };

  const saveGeometry = (): void => {
    const rect = popup.getBoundingClientRect();
    const geom: Geometry = docked
      ? { ...floatingGeometry, docked }
      : { left: rect.left, top: rect.top, width: rect.width, height: rect.height };

    try {
      localStorage.setItem(GEOM_KEY, JSON.stringify(geom));
    } catch {
      /* ignore persistence errors */
    }
  };

  applyGeometry(readGeometry() ?? defaultGeometry());
  // #endregion Geometry (move / resize / snap / dock)

  // The popup itself is the drag handle (there is no header): dragging anywhere on it moves the
  // popup, except on interactive controls (inputs, buttons, the table, the resize handles). Dragging
  // it onto a viewport edge snaps it to that half of the screen (docking) — exactly like the EP builder.
  let dragging = false;
  let dragDX = 0;
  let dragDY = 0;
  const startDrag = (event: PointerEvent): void => {
    const target = event.target as HTMLElement;

    // Never start a drag from an interactive control (cell inputs / buttons / resize handles).
    if (target.closest("input, select, button, textarea, a, .codbi-csvg-resizer, table")) {
      return;
    }

    const rect = popup.getBoundingClientRect();

    dragging = true;
    dragDX = event.clientX - rect.left;
    dragDY = event.clientY - rect.top;
    popup.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  const moveDrag = (event: PointerEvent): void => {
    if (!dragging) {
      return;
    }

    const rect = popup.getBoundingClientRect();
    const left = Math.max(0, Math.min(event.clientX - dragDX, window.innerWidth - rect.width));
    const top = Math.max(0, Math.min(event.clientY - dragDY, window.innerHeight - rect.height));

    // Dock to the left/right viewport half once the popup is dragged onto that edge — exactly like
    // the EP builder. Dragging a docked popup away from the edge un-docks it again at its remembered
    // floating size.
    let nextSide: DockSide | null = null;

    if (left <= DOCK_MARGIN) {
      nextSide = "left";
    } else if (left + rect.width >= window.innerWidth - DOCK_MARGIN) {
      nextSide = "right";
    }

    if (nextSide) {
      if (!docked) {
        floatingGeometry = { left, top, width: rect.width, height: rect.height };
      }

      applyDock(nextSide);

      return;
    }

    if (docked) {
      docked = null;
      popup.classList.remove("codbi-csvg-popup--docked");
      popup.style.maxHeight = "";
      popup.style.width = `${floatingGeometry.width}px`;
      popup.style.height = `${floatingGeometry.height}px`;
    }

    const width = popup.getBoundingClientRect().width;
    const height = popup.getBoundingClientRect().height;

    floatingGeometry = { left, top, width, height };
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
  };
  const endMove = (event: PointerEvent): void => {
    if (!dragging) {
      return;
    }

    dragging = false;

    try {
      popup.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }

    saveGeometry();
  };

  // Resize handles on every edge and corner (n/s/e/w + nw/ne/sw/se). Each handle shows the resize
  // cursor for its direction and adjusts the matching sides of the popup, clamped to the min size and
  // the viewport. The `se` corner is additionally painted with a visible darkorange triangle so the
  // resize affordance is discoverable against the white body.
  const RESIZE_DIRS = ["n", "s", "e", "w", "nw", "ne", "sw", "se"] as const;
  type ResizeDir = (typeof RESIZE_DIRS)[number];
  let resizing = false;
  let rsDir: ResizeDir = "se";
  let rsX = 0;
  let rsY = 0;
  let rsRect = { left: 0, top: 0, width: 0, height: 0 };

  for (const dir of RESIZE_DIRS) {
    const handle = doc.createElement("div");
    handle.className = `codbi-csvg-resizer codbi-csvg-resizer--${dir}`;
    handle.dataset.dir = dir;
    handle.title = "Resize";
    handle.addEventListener("pointerdown", (event) => {
      // Resizing a docked popup un-docks it first so it resizes as a floating window.
      if (docked) {
        applyFloating(floatingGeometry);
      }

      const rect = popup.getBoundingClientRect();
      const nextDir = (event.currentTarget as HTMLElement).dataset.dir as ResizeDir;

      resizing = true;
      rsDir = nextDir;
      rsX = event.clientX;
      rsY = event.clientY;
      rsRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      event.preventDefault();
      event.stopPropagation();
    });
    handle.addEventListener("pointermove", (event) => {
      if (!resizing) {
        return;
      }

      const dx = event.clientX - rsX;
      const dy = event.clientY - rsY;
      let left = rsRect.left;
      let top = rsRect.top;
      let width = rsRect.width;
      let height = rsRect.height;

      if (rsDir.includes("w")) {
        width = Math.max(MIN_W, rsRect.width - dx);
        left = rsRect.left + (rsRect.width - width);
      } else if (rsDir.includes("e")) {
        width = Math.max(MIN_W, Math.min(rsRect.width + dx, window.innerWidth - left));
      }

      if (rsDir.includes("n")) {
        height = Math.max(MIN_H, rsRect.height - dy);
        top = rsRect.top + (rsRect.height - height);
      } else if (rsDir.includes("s")) {
        height = Math.max(MIN_H, Math.min(rsRect.height + dy, window.innerHeight - top));
      }

      applyFloating({ left, top, width, height });
    });
    const endResize = (event: PointerEvent): void => {
      if (!resizing) {
        return;
      }

      resizing = false;

      try {
        (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }

      saveGeometry();
    };
    handle.addEventListener("pointerup", endResize);
    handle.addEventListener("pointercancel", endResize);
    popup.appendChild(handle);
  }

  popup.addEventListener("pointerdown", startDrag);
  popup.addEventListener("pointermove", moveDrag);
  popup.addEventListener("pointerup", endMove);
  popup.addEventListener("pointercancel", endMove);

  // Body.
  const body = doc.createElement("div");
  body.className = "codbi-csvg-body";

  const table = doc.createElement("table");
  table.className = "codbi-csvg-table";

  // Header row (subpart column names).
  const thead = doc.createElement("thead");
  const headerRow = doc.createElement("tr");
  const cornerTh = doc.createElement("th");
  cornerTh.style.width = "28px";
  headerRow.appendChild(cornerTh);

  if (normalized.length === 0) {
    const singleTh = doc.createElement("th");
    singleTh.textContent = itemName;
    headerRow.appendChild(singleTh);
  } else {
    for (const sub of normalized) {
      const th = doc.createElement("th");
      th.textContent = sub.label || sub.name;
      if (sub.required) {
        const req = doc.createElement("span");
        req.className = "codbi-csvg-req";
        req.textContent = "*";
        req.title = "Required";
        th.appendChild(req);
      }
      headerRow.appendChild(th);
    }
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body: one row per element.
  const tbody = doc.createElement("tbody");
  const render = (): void => {
    tbody.replaceChildren();
    if (rows.length === 0) {
      const emptyRow = doc.createElement("tr");
      const emptyCell = doc.createElement("td");
      emptyCell.colSpan = (normalized.length > 0 ? normalized.length : 1) + 1;
      emptyCell.className = "codbi-csvg-empty";
      emptyCell.textContent = `No ${itemName}s defined yet. Click "Add ${itemName}" below.`;
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
      return;
    }
    rows.forEach((_fields, rowIndex) => {
      tbody.appendChild(buildRow(doc, rows, rowIndex, normalized, itemName, render));
    });
  };
  table.appendChild(tbody);
  body.appendChild(table);

  // The "Add {item}" button. Inline styles make it robust against the host designer's global button
  // resets (which may otherwise neutralise the lightweight class-based styling).
  const addButton = doc.createElement("button");
  addButton.type = "button";
  addButton.className = "codbi-csvg-add";
  addButton.textContent = `＋ Add ${itemName}`;
  addButton.style.cssText =
    `display:inline-flex;align-items:center;gap:6px;margin-top:10px;border:1px dashed ${CSVG_ACCENT};` +
    `background:#fff;color:${CSVG_ACCENT};border-radius:4px;padding:5px 10px;font:inherit;font-weight:600;cursor:pointer;`;
  addButton.addEventListener("mouseenter", () => {
    addButton.style.background = "#fff4e0";
  });
  addButton.addEventListener("mouseleave", () => {
    addButton.style.background = "#fff";
  });
  addButton.addEventListener("click", () => {
    rows.push(Array.from({ length: Math.max(1, normalized.length) }, () => ""));
    render();
  });
  body.appendChild(addButton);

  // Footer (Cancel + Apply). The Apply button uses explicit inline styles so it is ALWAYS visible as a
  // solid darkorange CodBi button — the inline styles are immune to the host page's own button CSS.
  const foot = doc.createElement("div");
  foot.className = "codbi-csvg-foot";
  const cancelBtn = doc.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "codbi-csvg-btn";
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.cssText =
    "border:1px solid #c1c7d0;border-radius:4px;padding:6px 14px;font:inherit;font-weight:600;cursor:pointer;background:#fff;color:#172b4d;";
  cancelBtn.addEventListener("mouseenter", () => {
    cancelBtn.style.background = "#f4f5f7";
  });
  cancelBtn.addEventListener("mouseleave", () => {
    cancelBtn.style.background = "#fff";
  });
  const okBtn = doc.createElement("button");
  okBtn.type = "button";
  okBtn.className = "codbi-csvg-btn codbi-csvg-btn--primary";
  okBtn.textContent = "Apply";
  okBtn.style.cssText =
    `border:1px solid ${CSVG_ACCENT};border-radius:4px;padding:6px 14px;font:inherit;font-weight:700;` +
    `cursor:pointer;background:${CSVG_ACCENT};color:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);`;
  okBtn.addEventListener("mouseenter", () => {
    okBtn.style.background = "#ff8c00";
  });
  okBtn.addEventListener("mouseleave", () => {
    okBtn.style.background = CSVG_ACCENT;
  });
  foot.append(cancelBtn, okBtn);

  popup.append(body, foot);
  overlay.appendChild(popup);
  doc.body.appendChild(overlay);

  const cleanup = (): void => {
    doc.removeEventListener("keydown", keyHandler, true);
    overlay.removeEventListener("removed", cleanup);
  };
  const close = (): void => {
    overlay.remove();
  };
  const keyHandler = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };

  cancelBtn.addEventListener("click", close);
  okBtn.addEventListener("click", () => {
    options.onApply(serializeCsvParameter(rows, itemSep, fieldSep, columns));
    close();
  });
  overlay.addEventListener("mousedown", (event) => {
    if (event.target === overlay) {
      close();
    }
  });
  doc.addEventListener("keydown", keyHandler, true);
  overlay.addEventListener("removed", cleanup);

  render();
  okBtn.focus();
}
