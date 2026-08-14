// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region SheetJS
import * as XLSX from "xlsx";
// #endregion SheetJS
// #endregion Imports

/**
 * A single column definition of the {@link DQ_Table_View.functionality }.
 *
 * Consists of the display **label**, the name of the **data column** within the DataQuery-result, an optional
 * **JSON-flag** (marking the column as containing JSON so its cells render a maximizable JSON-viewer) and an
 * optional **width** (in characters for the Excel-export, in pixels for the on-screen table). */
interface TableViewColumn {
  /** The {@link string } displayed as the column's header (in the table as well as in the Excel-file). */
  label: string;
  /** The name of the column within the DataQuery-result that this column's cell-values shall be taken from. */
  dataColumn: string;
  /** Whether the column contains **JSON** data. When `true`, cells render a compact JSON-viewer that can be
   *  maximized into a full modal viewer; the Excel-export writes the (pretty-printed) JSON as text. */
  isJson: boolean;
  /** The optional column **width**. Applied as `width` on the `<th>` and as `width` in the exported Excel-sheet. */
  width?: number;
}

/**
 * Provides the {@link DQ_Table_View.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class DQ_Table_View {
  /**
   * Parses the `Columns`-parameter into an array of {@link TableViewColumn }s.
   *
   * The parameter is a **CSV** whose columns are separated by `,` and whose entries are separated by `;`:
   * `label;datacolumn;jsonFlag` with an optional fourth entry `;width` (e.g. `Alter;Alter;true` or
   * `Name;Name;false;25`). The third entry is the **JSON-flag** (`true`/`1`/`yes` → JSON column;
   * `false`/`0`/`no` → plain column). For backwards compatibility a plain number in the third position is
   * treated as the legacy `width`.
   *
   * The CodBi-attribute-processor already turns a comma containing value into a {@link string }-{@link Array } so both
   * a pre-split {@link Array } and a raw {@link string } are accepted.
   *
   * @param columns The raw `Columns`-parameter value.
   *
   * @returns The parsed {@link TableViewColumn }s. */
  protected static parseColumns(columns: unknown): TableViewColumn[] {
    const specs: string[] = Array.isArray(columns) ? (columns as string[]) : String(columns ?? "").split(",");

    return specs
      .map((spec) => spec.trim())
      .filter((spec) => spec.length > 0)
      .map((spec) => {
        const parts = spec.split(";").map((part) => part.trim());

        const column: TableViewColumn = {
          label: parts[0] ?? "",
          dataColumn: parts[1] ?? "",
          isJson: false,
        };

        // The 3rd entry is the JSON-flag. For backwards compatibility a plain number here is the legacy `width`.
        if (parts.length > 2 && parts[2].length > 0) {
          const third = parts[2].toLowerCase();

          if (third === "true" || third === "1" || third === "yes" || third === "json") {
            column.isJson = true;
          } else if (!(third === "false" || third === "0" || third === "no")) {
            const legacyWidth = Number(parts[2]);

            if (!Number.isNaN(legacyWidth) && legacyWidth > 0) {
              column.width = legacyWidth;
            }
          }
        }

        // The optional 4th entry is the width (`label;datacolumn;jsonFlag;width`).
        if (parts.length > 3 && parts[3].length > 0) {
          const width = Number(parts[3]);

          if (!Number.isNaN(width) && width > 0) {
            column.width = width;
          }
        }

        return column;
      });
  }
  /**
   * Normalizes a raw cell value prior to JSON-parsing.
   *
   * A DataQuery-JSON-column may deliver a JSON-array with a **leading comma** right after the opening bracket
   * (e.g. `[,{...},{...}]`, `[ ,{...}]` or `[,,{...}]`) which is not valid JSON. Such leading commas are removed
   * (the first is replaced with `[`, further ones simply dropped). A UTF-8 BOM that some DataQuery-results prefix
   * is stripped as well so the value can be parsed (and rendered/exported) correctly.
   *
   * @param raw The raw cell value.
   *
   * @returns The normalized {@link string }. */
  protected static normalizeJson(raw: unknown): string {
    let value = (typeof raw === "string" ? raw : String(raw ?? "")).trim();

    // Strip a UTF-8 BOM that some DataQuery-results prefix.
    if (value.charCodeAt(0) === 0xfeff) {
      value = value.substring(1);
    }
    // Remove a leading comma (or commas) right after the opening "[" — optionally separated by whitespace,
    // e.g. "[,...]" → "[...]", "[ ,{...}]" → "[{...}]", "[,,{...}]" → "[{...}]". Valid JSON is left untouched.
    value = value.replace(/^\[\s*,+/, "[");

    return value;
  }
  /**
   * Attempts to parse the given cell value as JSON.
   *
   * @param raw The raw cell value.
   *
   * @returns The parsed value, or `undefined` when it is not valid JSON. */
  protected static tryParseJson(raw: unknown): unknown | undefined {
    // When the DataQuery already delivered the value as a structured array/object, accept it directly.
    if (raw !== null && typeof raw === "object") {
      return raw;
    }
    const trimmed = DQ_Table_View.normalizeJson(raw);

    if (trimmed.length === 0) {
      return undefined;
    }
    if (trimmed[0] !== "{" && trimmed[0] !== "[" && trimmed[0] !== '"') {
      return undefined;
    }
    try {
      return JSON.parse(trimmed);
    } catch {
      return undefined;
    }
  }
  /**
   * Returns a pretty-printed (2-space indented) JSON {@link string } for the given raw value.
   *
   * @param raw The raw (compact) JSON {@link string }.
   *
   * @returns The pretty-printed JSON, or the raw value when it cannot be parsed. */
  protected static prettyPrintJson(raw: string): string {
    const parsed = DQ_Table_View.tryParseJson(raw);

    if (parsed === undefined) {
      return raw;
    }
    try {
      return JSON.stringify(parsed, null, 2);
    } catch {
      return raw;
    }
  }
  /**
   * Returns a compact single-line representation of a JSON value.
   *
   * @param value The JSON value.
   *
   * @returns A short human-readable {@link string }. */
  protected static compactValue(value: unknown): string {
    if (value === null) {
      return "null";
    }
    if (Array.isArray(value)) {
      const length = value.length;

      return `[${length} item${length === 1 ? "" : "s"}]`;
    }
    if (typeof value === "object") {
      return "{...}";
    }
    if (typeof value === "string") {
      return JSON.stringify(value);
    }

    return String(value);
  }
  /**
   * Returns the folded summary of an object/array showing only its FIRST property.
   *
   * @param value The JSON object/array.
   *
   * @returns A short summary {@link string }. */
  protected static summarizeObject(value: unknown): string {
    if (Array.isArray(value)) {
      const length = value.length;

      return `[${length} item${length === 1 ? "" : "s"}]`;
    }
    const entries = Object.entries(value as Record<string, unknown>);

    if (entries.length === 0) {
      return "{}";
    }
    const [firstKey, firstValue] = entries[0];

    return `{ ${firstKey}: ${DQ_Table_View.compactValue(firstValue)}, ... }`;
  }
  /**
   * Builds a foldable item for a single array element. Object/array elements render a header that is folded by
   * default (showing only their first property) and expand on click to list all entries; primitive elements render
   * as a plain line.
   *
   * @param value The array element.
   *
   * @returns The foldable {@link HTMLElement }. */
  protected static buildJsonItem(value: unknown, label?: string): HTMLElement {
    const item = document.createElement("div");

    if (value === null || typeof value !== "object") {
      item.className = "CodBi_Table_View_JsonItem CodBi_Table_View_JsonPrimitive";
      item.textContent =
        label !== undefined ? `${label}: ${DQ_Table_View.compactValue(value)}` : DQ_Table_View.compactValue(value);

      return item;
    }
    const entries: Array<[string, unknown]> = Array.isArray(value)
      ? (value as unknown[]).map((entry, index) => [`${index}`, entry] as [string, unknown])
      : Object.entries(value as Record<string, unknown>);

    item.className = "CodBi_Table_View_JsonItem";

    const header = document.createElement("div");

    header.className = "CodBi_Table_View_JsonItemHeader";
    header.setAttribute("role", "button");
    header.tabIndex = 0;
    header.title = "Click to expand/collapse";

    const toggle = document.createElement("span");

    toggle.className = "CodBi_Table_View_JsonItemToggle";
    toggle.textContent = "▶";

    const summary = document.createElement("span");

    summary.className = "CodBi_Table_View_JsonItemSummary";
    summary.textContent = DQ_Table_View.summarizeObject(value);

    header.appendChild(toggle);

    if (label !== undefined) {
      const labelEl = document.createElement("span");

      labelEl.className = "CodBi_Table_View_JsonItemLabel";
      labelEl.textContent = `${label}:`;
      header.appendChild(labelEl);
    }

    header.appendChild(summary);

    const body = document.createElement("div");

    body.className = "CodBi_Table_View_JsonItemBody";
    body.style.display = "none";

    for (const [key, entry] of entries) {
      const row = document.createElement("div");

      row.className = "CodBi_Table_View_JsonItemRow";

      const keyEl = document.createElement("span");

      keyEl.className = "CodBi_Table_View_JsonItemKey";
      keyEl.textContent = `${key}: `;

      const valueEl = document.createElement("span");

      valueEl.className = "CodBi_Table_View_JsonItemValue";
      valueEl.textContent = DQ_Table_View.compactValue(entry);

      row.appendChild(keyEl);
      row.appendChild(valueEl);
      body.appendChild(row);
    }

    let expanded = false;
    const toggleVisibility = (): void => {
      expanded = !expanded;
      toggle.textContent = expanded ? "▼" : "▶";
      body.style.display = expanded ? "block" : "none";
    };

    header.addEventListener("click", toggleVisibility);
    header.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleVisibility();
      }
    });

    item.appendChild(header);
    item.appendChild(body);

    return item;
  }
  /**
   * Builds the foldable viewer for a JSON array: one foldable item per array element, each collapsed by default.
   *
   * @param array The parsed JSON array.
   *
   * @returns The viewer {@link HTMLElement }. */
  protected static buildArrayViewer(array: unknown[]): HTMLElement {
    const list = document.createElement("div");

    list.className = "CodBi_Table_View_JsonArray";
    array.forEach((entry, index) => {
      list.appendChild(DQ_Table_View.buildJsonItem(entry, `${index}`));
    });

    return list;
  }
  /**
   * Builds a foldable viewer for a top-level JSON object: each entry is rendered as a foldable item labelled with
   * its key. This also covers array-like objects (e.g. `{"0":{...},"1":{...}}`) that some DataQuery-results return
   * instead of a plain JSON array.
   *
   * @param object The parsed JSON object.
   *
   * @returns The viewer {@link HTMLElement }. */
  protected static buildObjectViewer(object: Record<string, unknown>): HTMLElement {
    const list = document.createElement("div");

    list.className = "CodBi_Table_View_JsonArray";
    for (const [key, value] of Object.entries(object)) {
      list.appendChild(DQ_Table_View.buildJsonItem(value, key));
    }

    return list;
  }
  /**
   * Renders a single JSON-cell: a compact pretty-printed preview with a maximize button that opens the
   * modal {@link openJsonModal }. JSON arrays render a foldable viewer (each element collapsed by default,
   * showing only its first property). Non-JSON (or unparseable) values are shown as plain text.
   *
   * @param td    The {@link HTMLTableCellElement } to fill.
   * @param raw   The raw cell value.
   * @param label The column's label (used as the modal's title). */
  protected static renderJsonCell(td: HTMLTableCellElement, raw: string, label: string): void {
    const parsed = DQ_Table_View.tryParseJson(raw);

    if (parsed === undefined) {
      td.textContent = raw;
      return;
    }
    const pretty = DQ_Table_View.prettyPrintJson(raw);
    const container = document.createElement("div");

    container.className = "CodBi_Table_View_JsonCell";

    // JSON arrays render a foldable viewer — each array element is a collapsed item (showing only its first
    // property) that expands on click. Any other JSON value keeps the compact pretty-printed preview.
    let preview: HTMLElement;

    if (Array.isArray(parsed)) {
      preview = DQ_Table_View.buildArrayViewer(parsed);
    } else if (parsed !== null && typeof parsed === "object") {
      preview = DQ_Table_View.buildObjectViewer(parsed as Record<string, unknown>);
    } else {
      const pre = document.createElement("pre");

      pre.className = "CodBi_Table_View_JsonPreview";
      pre.textContent = pretty;
      pre.title = "Click to open the JSON viewer";
      pre.addEventListener("click", () => DQ_Table_View.openJsonModal(label, pretty, false, parsed));
      preview = pre;
    }

    const maximize = document.createElement("button");

    maximize.type = "button";
    maximize.className = "CodBi_Table_View_JsonMaximize";
    maximize.title = "Maximize JSON viewer";
    maximize.textContent = "⛶";
    maximize.addEventListener("click", (event) => {
      event.stopPropagation();
      DQ_Table_View.openJsonModal(label, pretty, true, parsed);
    });

    container.appendChild(preview);
    container.appendChild(maximize);
    td.appendChild(container);
  }
  /**
   * Opens a maximizable modal JSON-viewer overlay for the given pretty-printed JSON. When the parsed value is a
   * structured JSON array/object the modal shows the foldable viewer instead of the plain pretty-printed text.
   *
   * @param title     The title (usually the column label).
   * @param pretty    The pretty-printed JSON to display (fallback for non-structured values).
   * @param maximized Whether to start the viewer maximized (full screen).
   * @param parsed    The parsed JSON value (optional) — when structured, its elements render as foldable nodes. */
  protected static openJsonModal(title: string, pretty: string, maximized: boolean, parsed?: unknown): void {
    // Remove any previously open viewer to avoid stacked overlays.
    document.querySelector(".CodBi_Table_View_JsonModal")?.remove();

    const overlay = document.createElement("div");

    overlay.className = maximized ? "CodBi_Table_View_JsonModal --maximized" : "CodBi_Table_View_JsonModal";
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        overlay.remove();
      }
    });

    const dialog = document.createElement("div");

    dialog.className = "CodBi_Table_View_JsonModalDialog";

    const header = document.createElement("div");

    header.className = "CodBi_Table_View_JsonModalHeader";

    const titleEl = document.createElement("span");

    titleEl.className = "CodBi_Table_View_JsonModalTitle";
    titleEl.textContent = title.length > 0 ? `JSON — ${title}` : "JSON";

    const controls = document.createElement("div");

    controls.className = "CodBi_Table_View_JsonModalControls";

    const toggleMax = document.createElement("button");

    toggleMax.type = "button";
    toggleMax.textContent = "⛶ Maximize";
    toggleMax.addEventListener("click", () => overlay.classList.toggle("--maximized"));

    const close = document.createElement("button");

    close.type = "button";
    close.textContent = "✕ Close";
    close.addEventListener("click", () => overlay.remove());

    controls.appendChild(toggleMax);
    controls.appendChild(close);
    header.appendChild(titleEl);
    header.appendChild(controls);

    const body = document.createElement("div");

    body.className = "CodBi_Table_View_JsonModalBody";

    if (parsed !== undefined && parsed !== null && typeof parsed === "object") {
      body.appendChild(
        Array.isArray(parsed)
          ? DQ_Table_View.buildArrayViewer(parsed)
          : DQ_Table_View.buildObjectViewer(parsed as Record<string, unknown>),
      );
    } else {
      const pre = document.createElement("pre");

      pre.className = "CodBi_Table_View_JsonModalContent";
      pre.textContent = pretty;
      body.appendChild(pre);
    }

    dialog.appendChild(header);
    dialog.appendChild(body);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", onKeyDown);
      }
    };

    document.addEventListener("keydown", onKeyDown);
  }
  /**
   * Parses a boolean-style config value with a fallback default.
   *
   * Explicit `false`-values (`false`, `0`, `no`, case-insensitive) yield `false`. Any other value — including an
   * absent/empty one — yields the provided {@link defaultValue }. This makes it safe for parameters whose default
   * is `true`.
   *
   * @param value        The raw config value.
   * @param defaultValue The fallback when the value is not an explicit `false`.
   *
   * @returns The parsed {@link boolean }. */
  protected static parseBooleanFlag(value: unknown, defaultValue: boolean): boolean {
    const normalized = String(value ?? "")
      .trim()
      .toLowerCase();

    return ["false", "0", "no"].includes(normalized) ? false : defaultValue;
  }
  /**
   * Parses the `ExcludeColumns`-parameter (a CSV of column names) into a case-insensitive {@link Set } of names.
   *
   * @param value The raw CSV value.
   *
   * @returns A {@link Set } of lowercased column names. */
  protected static parseExcludedColumns(value: unknown): Set<string> {
    return new Set(
      String(value ?? "")
        .split(",")
        .map((name) => name.trim().toLowerCase())
        .filter((name) => name.length > 0),
    );
  }
  /**
   * Whether the given {@link TableViewColumn } is part of the excluded columns (matched against its `label` or
   * `datacolumn`, case-insensitively).
   *
   * @param column   The column to check.
   * @param excluded The {@link Set } of lowercased excluded column names.
   *
   * @returns `true` when the column shall be excluded from the Excel-export. */
  protected static isColumnExcluded(column: TableViewColumn, excluded: Set<string>): boolean {
    return excluded.has(column.label.trim().toLowerCase()) || excluded.has(column.dataColumn.trim().toLowerCase());
  }
  /**
   * Registers the "DQ.Table.View"-Functionality which injects a table showing the result of a Formcycle-DataQuery into
   * the tagged {@link HTMLElement } and enables exporting that table to an **Excel**-file (`.xlsx`) via a button.
   *
   * Config Parameter:
   *  - ```Columns```:   **REQUIRED** - A **CSV** defining the columns to show. Every column is
   *                     `label;datacolumn;jsonFlag` with an optional fourth entry `;width`:
   *                     e.g. `Anrede;Anrede;false,Unternehmen;Unternehmen;true,Nachricht;Nachricht;false;30`.
   *                     `label` is the header shown in the table/Excel-file, `datacolumn` is the name of the column
   *                     within the DataQuery-result, `jsonFlag` (`true` / `1` / `yes`) marks the column as containing
   *                     **JSON** so its cells render a maximizable JSON-viewer (use `false` / `0` / `no` for plain
   *                     columns; for backwards compatibility a plain number in this position is treated as the
   *                     width) and `width` (optional) defines the column's width (characters in the Excel-file,
   *                     pixels on-screen).
   *  - ```DataQuery```: **REQUIRED** - The name of the {@link https://help.formcycle.de Datasource-Query} on the
   *                     Formcycle-server whose result shall be displayed (e.g. `INHALT.Eigentuemerdialog_Dezember_2025`).
   *                     The query is executed via `$.xutil.getDataQuery`.
   *  - ```CSS```:       An optional {@link string } of one or more (space separated) CSS-Classes to apply to **both**
   *                     the tagged container and the injected table.
   *  - ```FileName```:  The name of the exported Excel-file **without** extension. The extension is always `.xlsx`.
   *                     Defaults to `Export`.
   *  - ```SheetName```: The name of the worksheet within the exported Excel-file. Defaults to `sheet1`.
   *  - ```ExportButton```: An **optional** CSS-Selector of an existing `<button>`/`<a>` that shall trigger the
   *                     export. When omitted (or no matching element is found) the table is rendered **without** any
   *                     export-button — the Excel-export is then simply not available.
   *  - ```Centered```:   Whether the content of the table-cells (```<td>```s) is centered. Defaults to ```true```;
   *                     set to ```false``` / ```0``` / ```no``` to keep the cells left-aligned.
   *  - ```ExcludeColumns```: An **optional** CSV of column names (matched against the column's `label` or
   *                     `datacolumn`) that shall be **excluded from the Excel-export** (they remain visible in the
   *                     table). E.g. `Nachricht,Wichtige_Hinweise`.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi - the container the table shall be injected into. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "dataquery :: css :: filename :: sheetname :: exportbutton :: centered :: excludecolumns")
    @TYPE.PRE("string | object", "columns")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(HTMLElement, undefined, "Is it not an Element that is tagged with this functionality?")
    toProcess: Element,
  ): void {
    // #region Normalize parameters.
    const columns: TableViewColumn[] = DQ_Table_View.parseColumns(toLoad.columns);

    if (columns.length === 0) {
      throw new Error(
        `[DQ.Table.View] The parameter "Columns" (CSV of label;datacolumn;jsonFlag[;width]) is missing or invalid on ${toProcess.getAttribute("data-name") ?? toProcess.tagName}.`,
      );
    }

    const dataQuery: string =
      toLoad.dataquery && String(toLoad.dataquery).trim().length > 0 ? String(toLoad.dataquery).trim() : "";

    if (dataQuery.length === 0) {
      throw new Error(
        `[DQ.Table.View] The parameter "DataQuery" is missing on ${toProcess.getAttribute("data-name") ?? toProcess.tagName}.`,
      );
    }

    // Optional CSS-Classes applied to both the tagged container and the injected table.
    const css: string = toLoad.css && String(toLoad.css).trim().length > 0 ? String(toLoad.css).trim() : "";

    // Always force the ".xlsx"-extension for the exported file.
    const fileName: string = (
      toLoad.filename && String(toLoad.filename).trim().length > 0 ? String(toLoad.filename).trim() : "Export"
    ).replace(/\.xlsx$/i, "");
    const sheetName: string =
      toLoad.sheetname && String(toLoad.sheetname).trim().length > 0 ? String(toLoad.sheetname).trim() : "sheet1";
    const exportButtonSelector: string | undefined =
      toLoad.exportbutton && String(toLoad.exportbutton).trim().length > 0
        ? String(toLoad.exportbutton).trim()
        : undefined;

    // Whether the content of the table-cells (<td>s) shall be centered. Defaults to true.
    const centered: boolean = DQ_Table_View.parseBooleanFlag(toLoad.centered, true);

    // Columns to exclude from the Excel-export (CSV of column names, matched against label or datacolumn).
    const excludedColumns: Set<string> = DQ_Table_View.parseExcludedColumns(toLoad.excludecolumns);
    // #endregion Normalize parameters.
    // #region Generate a unique id for this table-view instance.
    const instanceId = `codbi-table-view-${Math.random().toString(36).substring(2, 11)}`;
    // #endregion Generate a unique id for this table-view instance.
    // #region Apply the optional CSS-Classes to the tagged container.
    if (css.length > 0) {
      toProcess.classList.add(...css.split(/\s+/));
    }
    // #endregion Apply the optional CSS-Classes to the tagged container.
    // #region Create the table skeleton.
    const table = document.createElement("table");

    table.id = instanceId;
    table.className = css.length > 0 ? `CodBi_Table_View ${css}` : "CodBi_Table_View";
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");

    for (const column of columns) {
      const th = document.createElement("th");

      th.textContent = column.label;

      if (column.width !== undefined) {
        th.style.width = `${column.width}px`;
      }

      headRow.appendChild(th);
    }

    thead.appendChild(headRow);
    table.appendChild(thead);
    // #endregion Create the table skeleton.
    // #region Attach the export handler to an existing export-button (optional).
    // The export-button is optional: the export is only wired up when an element matching the
    // ExportButton-Selector exists. No button is injected — otherwise the table is shown without
    // any Excel-export. The sheet is built from the stored result rows (not from the DOM table) so
    // JSON-column cells export their JSON content (pretty-printed) instead of the viewer markup.
    let exportButton: HTMLElement | null = null;

    if (exportButtonSelector) {
      exportButton =
        (toProcess.querySelector(exportButtonSelector) as HTMLElement | null) ??
        (document.querySelector(exportButtonSelector) as HTMLElement | null);
    }

    if (exportButton) {
      exportButton.addEventListener("click", () => {
        try {
          // Build a clean temporary table from the stored result rows (the on-screen cells contain the foldable
          // JSON-viewer markup, so the sheet is NOT read from the DOM table). JSON columns export their
          // (pretty-printed) JSON content as text; every other value is coerced to a string/number.
          // Columns listed in ExcludeColumns are left out of the export (they remain visible in the table).
          // SheetJS is bundled via the npm package "xlsx" (see the import at the top of this file).
          const exportColumns = columns.filter((column) => !DQ_Table_View.isColumnExcluded(column, excludedColumns));
          const exportTable = document.createElement("table");
          const thead = document.createElement("thead");
          const headRow = document.createElement("tr");

          for (const column of exportColumns) {
            const th = document.createElement("th");

            th.textContent = column.label;
            headRow.appendChild(th);
          }

          thead.appendChild(headRow);
          exportTable.appendChild(thead);

          const tbody = document.createElement("tbody");

          for (const row of dataRows) {
            const tr = document.createElement("tr");

            for (const column of exportColumns) {
              const td = document.createElement("td");
              const raw = row[column.dataColumn] ?? "";

              if (column.isJson) {
                td.textContent = DQ_Table_View.prettyPrintJson(raw);
              } else {
                td.textContent = typeof raw === "string" || typeof raw === "number" ? raw : String(raw);
              }

              tr.appendChild(td);
            }

            tbody.appendChild(tr);
          }

          exportTable.appendChild(tbody);
          // Build the workbook from the table.
          const wb = XLSX.utils.table_to_book(exportTable, { sheet: sheetName });
          // Apply the defined column widths; columns without an explicit width get a standard default width
          // (a plain `undefined` entry would make SheetJS fall back to a very narrow column).
          const defaultColumnWidth = 12;
          const sheet = wb.Sheets[sheetName];

          if (sheet) {
            sheet["!cols"] = exportColumns.map((column) => ({
              width: column.width ?? defaultColumnWidth,
            }));
          }
          XLSX.writeFile(wb, `${fileName}.xlsx`);
        } catch (error: unknown) {
          console.error(`[DQ.Table.View] Failed to export "${fileName}.xlsx":`, error);
        }
      });
    }
    // #endregion Attach the export handler to an existing export-button (optional).
    // #region Inject the (once-only) stylesheet for the table-view.
    if (!document.querySelector("#CodBi_Table_View_Styles")) {
      const style = document.createElement("style");

      style.id = "CodBi_Table_View_Styles";
      style.textContent = `
        .CodBi_Table_View { border-collapse: collapse; width: 100%; }
        .CodBi_Table_View th, .CodBi_Table_View td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; vertical-align: top; }
        .CodBi_Table_View thead th { position: sticky; top: 0; z-index: 10; background: #f0f0f0; }
        .CodBi_Table_View .CodBi_Table_View_NoData { font-style: italic; color: #666; }
        .CodBi_Table_View .CodBi_Table_View_JsonCell { position: relative; text-align: left; }
        .CodBi_Table_View .CodBi_Table_View_JsonPreview { margin: 0; padding: 4px 6px; background: #f7f7f9; border: 1px solid #e3e3e8; border-radius: 3px; font-family: Consolas, Menlo, monospace; font-size: 11px; line-height: 1.4; max-height: 140px; overflow: auto; white-space: pre-wrap; word-break: break-word; cursor: pointer; }
        .CodBi_Table_View .CodBi_Table_View_JsonMaximize { position: absolute; top: 4px; right: 4px; border: none; background: rgba(0,0,0,0.55); color: #fff; border-radius: 3px; cursor: pointer; font-size: 12px; line-height: 1; padding: 3px 6px; }
        .CodBi_Table_View .CodBi_Table_View_JsonArray { display: flex; flex-direction: column; gap: 2px; max-height: 140px; overflow: auto; }
        .CodBi_Table_View .CodBi_Table_View_JsonItem { border: 1px solid #e3e3e8; border-radius: 3px; background: #f7f7f9; }
        .CodBi_Table_View .CodBi_Table_View_JsonItemHeader { display: flex; align-items: center; gap: 6px; padding: 2px 6px; cursor: pointer; user-select: none; font-family: Consolas, Menlo, monospace; font-size: 11px; line-height: 1.4; }
        .CodBi_Table_View .CodBi_Table_View_JsonItemHeader:hover { background: #ececf2; }
        .CodBi_Table_View .CodBi_Table_View_JsonItemToggle { color: #57606f; font-size: 9px; flex-shrink: 0; cursor: pointer; }
        .CodBi_Table_View .CodBi_Table_View_JsonItemLabel { font-weight: 600; flex-shrink: 0; }
        .CodBi_Table_View .CodBi_Table_View_JsonItemSummary { word-break: break-word; }
        .CodBi_Table_View .CodBi_Table_View_JsonItemBody { border-top: 1px dashed #d5d5dd; margin: 0 6px 4px 14px; padding: 4px 0 2px; }
        .CodBi_Table_View .CodBi_Table_View_JsonItemRow { font-family: Consolas, Menlo, monospace; font-size: 11px; line-height: 1.4; white-space: pre-wrap; word-break: break-word; }
        .CodBi_Table_View .CodBi_Table_View_JsonItemKey { font-weight: 600; }
        .CodBi_Table_View .CodBi_Table_View_JsonPrimitive { padding: 2px 6px; font-family: Consolas, Menlo, monospace; font-size: 11px; }
        .CodBi_Table_View_JsonModal { position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; }
        .CodBi_Table_View_JsonModalDialog { display: flex; flex-direction: column; min-width: 320px; max-width: 90vw; max-height: 90vh; box-shadow: 0 8px 40px rgba(0,0,0,0.35); border-radius: 8px; overflow: hidden; }
        .CodBi_Table_View_JsonModalHeader { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #2f3542; color: #fff; gap: 12px; }
        .CodBi_Table_View_JsonModalTitle { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .CodBi_Table_View_JsonModalControls { display: flex; gap: 6px; flex-shrink: 0; }
        .CodBi_Table_View_JsonModalControls button { border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer; background: #57606f; color: #fff; }
        .CodBi_Table_View_JsonModalControls button:hover { background: #6b7686; }
        .CodBi_Table_View_JsonModalBody { background: #fff; overflow: auto; width: min(80vw, 800px); height: 70vh; text-align: left; }
        .CodBi_Table_View_JsonModalContent { margin: 0; padding: 14px; font-family: Consolas, Menlo, monospace; font-size: 12px; line-height: 1.5; white-space: pre; overflow: auto; }
        .CodBi_Table_View_JsonModalBody .CodBi_Table_View_JsonArray { max-height: none; padding: 10px 14px; }
        .CodBi_Table_View_JsonModal.--maximized .CodBi_Table_View_JsonModalBody { width: 96vw; height: 94vh; }
      `;
      document.head.appendChild(style);
    }
    // #endregion Inject the (once-only) stylesheet for the table-view.
    // #region Query the DataQuery and fill the table-body.
    // Stores the result rows so the (optional) export can build the sheet from the data directly.
    const dataRows: Array<Record<string, string>> = [];

    getJQuery()
      .xutil.getDataQuery(dataQuery, [])
      .then((response: { success: boolean; result: Array<Record<string, string>> }) => {
        const tbody = document.createElement("tbody");

        if (response.success && response.result.length > 0) {
          dataRows.push(...response.result);

          for (const row of response.result) {
            const tr = document.createElement("tr");

            for (const column of columns) {
              const td = document.createElement("td");

              if (centered) {
                td.style.textAlign = "center";
              }

              const raw = row[column.dataColumn] ?? "";

              if (column.isJson) {
                DQ_Table_View.renderJsonCell(td, raw, column.label);
              } else {
                td.textContent = raw;
              }

              tr.appendChild(td);
            }

            tbody.appendChild(tr);
          }
        } else {
          const tr = document.createElement("tr");
          const td = document.createElement("td");

          td.colSpan = columns.length;
          td.className = "CodBi_Table_View_NoData";
          td.style.textAlign = centered ? "center" : "left";
          td.textContent = "No data found.";

          tr.appendChild(td);
          tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        toProcess.appendChild(table);
      })
      .catch((error: unknown) => {
        console.error(`[DQ.Table.View] DataQuery "${dataQuery}" failed:`, error);

        const tbody = document.createElement("tbody");
        const tr = document.createElement("tr");
        const td = document.createElement("td");

        td.colSpan = columns.length;
        td.className = "CodBi_Table_View_NoData";
        td.textContent = `DataQuery "${dataQuery}" failed.`;

        tr.appendChild(td);
        tbody.appendChild(tr);
        table.appendChild(tbody);
        toProcess.appendChild(table);
      });
    // #endregion Query the DataQuery and fill the table-body.
  }
  // #region Initialization
  /**
   * States whether this {@link DQ_Table_View } was successfully registered
   * via {@link window.codbi.registerFunctionality } with the CodBi and performs the registration upon class usage.
   *
   * @returns Always **true** when registration was successful. */
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("DQ.Table.View", DQ_Table_View.functionality.bind(DQ_Table_View));
  })();
  // #endregion Initialization
}
