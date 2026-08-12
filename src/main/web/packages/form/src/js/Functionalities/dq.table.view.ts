// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #endregion Imports

/**
 * A single column definition of the {@link DQ_Table_View.functionality }.
 *
 * Consists of the display **label**, the name of the **data column** within the DataQuery-result and an optional
 * **width** (in characters for the Excel-export, in pixels for the on-screen table). */
interface TableViewColumn {
  /** The {@link string } displayed as the column's header (in the table as well as in the Excel-file). */
  label: string;
  /** The name of the column within the DataQuery-result that this column's cell-values shall be taken from. */
  dataColumn: string;
  /** The optional column **width**. Applied as `width` on the `<th>` and as `wch` in the exported Excel-sheet. */
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
  /** Stores the {@link Promise } that resolves once SheetJS has been loaded. */
  protected static loadPromise: Promise<void> | null = null;
  /** The resource-servlet path serving the bundled SheetJS-library. */
  protected static readonly SHEETJS_RESOURCE_PATH =
    "/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/SheetJS/Main.js";
  /**
   * Ensures the SheetJS-library is loaded on the page.
   *
   * The library is served by the CodBi-Plugin's Resource-servlet (the same way TinyMCE is served) so it can be
   * updated at runtime without redeploying the JAR.
   *
   * @returns A {@link Promise } that resolves once `window.XLSX` is available. */
  protected static ensureSheetJS(): Promise<void> {
    // #region Already loaded.
    if (typeof (window as unknown as { XLSX?: unknown }).XLSX !== "undefined") {
      return Promise.resolve();
    }
    // #endregion Already loaded.
    // #region Deduplicate concurrent load requests.
    if (DQ_Table_View.loadPromise) {
      return DQ_Table_View.loadPromise;
    }
    // #endregion Deduplicate concurrent load requests.
    DQ_Table_View.loadPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");

      script.src = `${window.codbi.baseURL}plugin?name=Resource&Path=${DQ_Table_View.SHEETJS_RESOURCE_PATH}`;
      script.onload = () => {
        resolve();
      };
      script.onerror = () => {
        DQ_Table_View.loadPromise = null;

        reject(new Error(`Failed to load SheetJS from ${script.src}`));
      };

      document.head.appendChild(script);
    });

    return DQ_Table_View.loadPromise;
  }
  /**
   * Parses the `Columns`-parameter into an array of {@link TableViewColumn }s.
   *
   * The parameter is a **CSV** whose columns are separated by `,` and whose entries are separated by `;`:
   * `label;datacolumn` or `label;datacolumn;width`.
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
        };

        if (parts.length > 2 && parts[2].length > 0) {
          const width = Number(parts[2]);

          if (!Number.isNaN(width) && width > 0) {
            column.width = width;
          }
        }

        return column;
      });
  }
  /**
   * Registers the "DQ.Table.View"-Functionality which injects a table showing the result of a Formcycle-DataQuery into
   * the tagged {@link HTMLElement } and enables exporting that table to an **Excel**-file (`.xlsx`) via a button.
   *
   * Config Parameter:
   *  - ```Columns```:   **REQUIRED** - A **CSV** defining the columns to show. Every column is
   *                     `label;datacolumn` with an optional third entry `;width`:
   *                     e.g. `Anrede;Anrede;15,Unternehmen;Unternehmen;25,Vorname;Vorname;18`.
   *                     `label` is the header shown in the table/Excel-file, `datacolumn` is the name of the column
   *                     within the DataQuery-result and `width` (optional) defines the column's width (characters in
   *                     the Excel-file, pixels on-screen).
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
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi - the container the table shall be injected into. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "dataquery :: css :: filename :: sheetname :: exportbutton")
    @TYPE.PRE("string | object", "columns")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(HTMLElement, undefined, "Is it not an Element that is tagged with this functionality?")
    toProcess: Element,
  ): void {
    // #region Normalize parameters.
    const columns: TableViewColumn[] = DQ_Table_View.parseColumns(toLoad.columns);

    if (columns.length === 0) {
      throw new Error(
        `[DQ.Table.View] The parameter "Columns" (CSV of label;datacolumn[;width]) is missing or invalid on ${toProcess.getAttribute("data-name") ?? toProcess.tagName}.`,
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
    // any Excel-export.
    let exportButton: HTMLElement | null = null;

    if (exportButtonSelector) {
      exportButton =
        (toProcess.querySelector(exportButtonSelector) as HTMLElement | null) ??
        (document.querySelector(exportButtonSelector) as HTMLElement | null);
    }

    if (exportButton) {
      exportButton.addEventListener("click", () => {
        DQ_Table_View.ensureSheetJS()
          .then(() => {
            // biome-ignore lint/suspicious/noExplicitAny: SheetJS types not available without bundling.
            const XLSX = (window as any).XLSX;
            // biome-ignore lint/suspicious/noExplicitAny: Workbook type not available without bundling.
            const workbook: any = XLSX.utils.table_to_book(table, { sheet: sheetName });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            // Apply the defined column widths to the exported sheet.
            sheet["!cols"] = columns.map((column) => (column.width !== undefined ? { wch: column.width } : undefined));

            XLSX.writeFile(workbook, `${fileName}.xlsx`);
          })
          .catch((error: unknown) => {
            console.error(`[DQ.Table.View] Failed to export "${fileName}.xlsx":`, error);
          });
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
      `;
      document.head.appendChild(style);
    }
    // #endregion Inject the (once-only) stylesheet for the table-view.
    // #region Query the DataQuery and fill the table-body.
    getJQuery()
      .xutil.getDataQuery(dataQuery, [])
      .then((response: { success: boolean; result: Array<Record<string, string>> }) => {
        const tbody = document.createElement("tbody");

        if (response.success && response.result.length > 0) {
          for (const row of response.result) {
            const tr = document.createElement("tr");

            for (const column of columns) {
              const td = document.createElement("td");

              td.textContent = row[column.dataColumn] ?? "";

              tr.appendChild(td);
            }

            tbody.appendChild(tr);
          }
        } else {
          const tr = document.createElement("tr");
          const td = document.createElement("td");

          td.colSpan = columns.length;
          td.className = "CodBi_Table_View_NoData";
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
