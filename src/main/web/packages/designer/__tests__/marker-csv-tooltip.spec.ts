// Regression tests for the CSV editor button inside a CodBi MARKER table cell: hovering it must show
// the same rich, table-styled tooltip as the form element's CodBi config parameter editor
// (`attachCsvValueTooltip`), rendered from the element's LIVE `data-cb-*` value.
//
// The reported gap: the config editors attached the tooltip, the on-canvas marker table (see
// `buildParamTable` in CodbiElementMarkers) only rendered a bare "⧉ Edit" button.

import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { Constants } from "codbi-common";

import { refreshCodbiElementMarkers } from "../src/js/CodbiElementMarkers.js";

import { resetTestState, TestState } from "./test-state.js";

/** One entry of an element's persisted `attributes` bag. */
interface IAttributeEntryLike {
  text: string;
  value: string;
}

/** The properties bag of the fake item (mutable, so the live getter sees new values). */
interface IPropertiesLike {
  attributes: IAttributeEntryLike[];
  cssclasses: string[];
}

/** Installs the plugin data the designer normally publishes. */
function setPluginData(data: unknown): void {
  (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = data;
}

/**
 * Runs the queued marker refresh work: advances the fake timers and lets the MutationObserver
 * microtasks run.
 *
 * @param advance - Advances the fake timers by that many milliseconds.
 * @returns A promise resolved after the pass has run.
 */
async function settle(advance: number): Promise<void> {
  jest.advanceTimersByTime(advance);
  await Promise.resolve();
  await Promise.resolve();
  jest.advanceTimersByTime(advance);
  await Promise.resolve();
  await Promise.resolve();
}

/**
 * Builds a marker item carrying one `data-cb-func` functionality with a `csv` parameter.
 *
 * @param cell       - The content cell of the element on the canvas.
 * @param properties - The element's persisted properties.
 * @returns The fake item.
 */
function markerItem(cell: HTMLElement, properties: IPropertiesLike): unknown {
  return {
    getId: () => "xi-1",
    className: "XContainer",
    getPersist: () => ({ properties }),
    getItemContentCell: () => [cell],
  };
}

/**
 * Builds a designer instance with the marker mode ON.
 *
 * @param item - The item returned by the designer's `items` map.
 * @returns The fake designer instance.
 */
function designerWith(item: unknown): unknown {
  return {
    items: { "xi-1": item },
    getFormPropertyValueForCurrentLang: (property: string) =>
      property === String(Constants["designer.property.mark_elements"]) ? "1" : "",
  };
}

/** Plugin data describing a functionality whose `Columns` parameter is a two-column CSV. */
const PLUGIN_DATA = {
  detFunctionalities: {
    "dq.table.view": {
      Parameter: { Columns: {} },
      parameters: {
        Columns: {
          type: "csv",
          itemName: "column",
          columns: [
            { name: "label", label: "Label" },
            { name: "datacolumn", label: "Column" },
          ],
          itemSeparator: ",",
          fieldSeparator: ";",
        },
      },
    },
  },
};

/** Builds the cell + item and renders the CodBi marker badges for them. */
async function renderMarkers(): Promise<{ cell: HTMLElement; properties: IPropertiesLike }> {
  jest.useFakeTimers();
  setPluginData(PLUGIN_DATA);
  const cell = document.createElement("div");
  document.body.appendChild(cell);
  const properties: IPropertiesLike = {
    attributes: [
      { text: "data-cb-func", value: "dq.table.view" },
      { text: "data-cb-columns", value: "Alter;Alter,Name;Name" },
    ],
    cssclasses: [],
  };
  TestState.designerInstance = designerWith(markerItem(cell, properties));
  refreshCodbiElementMarkers();
  await settle(100);
  return { cell, properties };
}

/** @returns the marker table's CSV launcher button ("⧉ Edit"), failing when it is missing. */
function csvButton(cell: HTMLElement): HTMLButtonElement {
  const found = cell.querySelector<HTMLButtonElement>(".codbi-func-table button.codbi-func-input");
  expect(found).not.toBeNull();
  return found!;
}

/** @returns the currently rendered CSV tooltip, or null. */
function tooltip(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".codbi-csvg-tooltip");
}

/** @returns the tooltip's header labels. */
function headerLabels(el: HTMLElement): Array<string | null> {
  return Array.from(el.querySelectorAll("thead th")).map((th) => th.textContent);
}

/** @returns the tooltip's body rows as arrays of cell texts. */
function bodyRows(el: HTMLElement): string[][] {
  return Array.from(el.querySelectorAll("tbody tr")).map((tr) =>
    Array.from(tr.querySelectorAll("td")).map((td) => td.textContent ?? ""),
  );
}

afterEach(() => {
  resetTestState();
  delete (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData;
  jest.useRealTimers();
  document.body.innerHTML = "";
});

describe("CodBi marker table — CSV parameter tooltip", () => {
  it("shows the CSV value as a table when hovering the marker's Edit button", async () => {
    const { cell } = await renderMarkers();
    expect(tooltip()).toBeNull();

    csvButton(cell).dispatchEvent(new MouseEvent("mouseenter"));

    const tip = tooltip();
    expect(tip).not.toBeNull();
    expect(headerLabels(tip!)).toEqual(["Label", "Column"]);
    expect(bodyRows(tip!)).toEqual([
      ["Alter", "Alter"],
      ["Name", "Name"],
    ]);
    // The header line carries the element/field summary (same wording as the config editors).
    expect(tip!.textContent).toContain("2 columns · 2 fields");
  });

  it("rebuilds the tooltip from the LIVE attribute value on the next hover", async () => {
    const { cell, properties } = await renderMarkers();

    csvButton(cell).dispatchEvent(new MouseEvent("mouseenter"));
    expect(bodyRows(tooltip()!)).toEqual([
      ["Alter", "Alter"],
      ["Name", "Name"],
    ]);

    // Change the value on the item itself (as the grid editor's apply path does) and hover again.
    properties.attributes[1].value = "Alter;Alter,Details;Details;true";
    csvButton(cell).dispatchEvent(new MouseEvent("mouseenter"));

    const tip = tooltip();
    expect(tip).not.toBeNull();
    expect(bodyRows(tip!)).toEqual([
      ["Alter", "Alter"],
      ["Details", "Details", "true"],
    ]);
  });

  it("keeps a native title fallback on the marker's Edit button", async () => {
    const { cell } = await renderMarkers();
    expect(csvButton(cell).title).toBe("Edit data-cb-columns (tabular CSV editor)");
  });
});
