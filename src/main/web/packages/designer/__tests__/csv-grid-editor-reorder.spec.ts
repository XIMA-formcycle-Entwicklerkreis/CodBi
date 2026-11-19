// Tests for the CSV grid editor's ROW REORDERING (dialogs opened by `openCsvGridEditor`).
//
// A `csv` parameter serializes its elements in ROW ORDER, so reordering the grid rows must reorder
// the applied parameter value. Rows are moved by dragging their `⠿` grip handle or by focusing the
// grip and pressing Arrow Up / Arrow Down.
//
// jsdom has no layout engine, so the pointer tests fake `getBoundingClientRect()` for the rows.

import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { openCsvGridEditor } from "../src/js/CsvGridEditor.js";

import type { IFunctionalityParameterSpec } from "../src/js/FunctionalityConfigEditor.js";

/** A two-column spec (`label;dataColumn`) mirroring `dq.table.view`'s `Columns` parameter. */
const SPEC: IFunctionalityParameterSpec = {
  type: "csv",
  itemName: "column",
  itemSeparator: ",",
  fieldSeparator: ";",
  columns: [
    { name: "label", label: "Label" },
    { name: "datacolumn", label: "Column" },
  ],
};

/** The helpers returned by {@link open}. */
interface IEditorUi {
  /** Clicks "Apply" and returns the value handed to `onApply`. */
  apply: () => string;
  /** All rendered element rows in DOM order. */
  rows: () => HTMLTableRowElement[];
  /** The `⠿` grip button of the row at `index`. */
  grip: (index: number) => HTMLButtonElement;
}

/**
 * Opens the CSV grid editor over `value`.
 *
 * @param value - The initial CSV value.
 * @returns The editor helpers.
 */
function open(value: string): IEditorUi {
  const onApply = jest.fn<(next: string) => void>();
  const anchor = document.createElement("div");
  document.body.appendChild(anchor);

  openCsvGridEditor({ document, anchor, value, spec: SPEC, onApply });

  const rows = (): HTMLTableRowElement[] =>
    Array.from(document.querySelectorAll<HTMLTableRowElement>(".codbi-csvg-table tbody tr[data-row-index]"));

  const grip = (index: number): HTMLButtonElement => {
    const found = document.querySelector<HTMLButtonElement>(
      `.codbi-csvg-table tbody tr[data-row-index="${index}"] .codbi-csvg-grip`,
    );
    expect(found).not.toBeNull();
    return found!;
  };

  const apply = (): string => {
    const button = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csvg-foot button")).find(
      (btn) => btn.textContent === "Apply",
    );
    expect(button).toBeDefined();
    button?.click();
    expect(onApply).toHaveBeenCalledTimes(1);
    return onApply.mock.calls[0][0];
  };

  return { apply, rows, grip };
}

/**
 * Fakes a stacked layout for the given rows (each 20px high, starting at y=0).
 *
 * @param rowEls - The rows to lay out.
 */
function fakeLayout(rowEls: HTMLTableRowElement[]): void {
  rowEls.forEach((row, index) => {
    jest.spyOn(row, "getBoundingClientRect").mockReturnValue({
      top: index * 20,
      bottom: index * 20 + 20,
      height: 20,
      left: 0,
      right: 100,
      width: 100,
      x: 0,
      y: index * 20,
      toJSON: () => ({}),
    } as DOMRect);
  });
}

/** @returns the value of the first text input of the row at `index`. */
function firstField(index: number): string | undefined {
  return document.querySelector<HTMLInputElement>(
    `.codbi-csvg-table tbody tr[data-row-index="${index}"] input.codbi-csvg-input`,
  )?.value;
}

afterEach(() => {
  document.body.innerHTML = "";
  localStorage.clear();
});

describe("CsvGridEditor — row reordering", () => {
  it("renders a drag handle for every element row", () => {
    const ui = open("a;x,b;y");

    expect(ui.rows()).toHaveLength(2);
    expect(ui.rows()[0].querySelectorAll(".codbi-csvg-grip")).toHaveLength(1);
    expect(ui.grip(1).getAttribute("aria-label")).toBe("Reorder column 2");
  });

  it("moves a row down when ArrowDown is pressed on its grip", () => {
    const ui = open("a;x,b;y,c;z");

    ui.grip(0).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    expect(firstField(0)).toBe("b");
    expect(firstField(1)).toBe("a");
    expect(ui.apply()).toBe("b;y,a;x,c;z");
  });

  it("moves a row up when ArrowUp is pressed on its grip", () => {
    const ui = open("a;x,b;y,c;z");

    ui.grip(2).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));

    expect(ui.apply()).toBe("a;x,c;z,b;y");
  });

  it("ignores ArrowUp on the first row and ArrowDown on the last row", () => {
    const ui = open("a;x,b;y");

    ui.grip(0).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    ui.grip(1).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    expect(ui.apply()).toBe("a;x,b;y");
  });

  it("drops a dragged row at the end when released below the last row", () => {
    const ui = open("a;x,b;y,c;z");
    fakeLayout(ui.rows());

    const grip = ui.grip(0);
    grip.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientY: 5 }));
    grip.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientY: 55 }));
    grip.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientY: 55 }));

    expect(ui.apply()).toBe("b;y,c;z,a;x");
    // The drop markers are cleared once the drag has finished.
    expect(document.querySelectorAll(".codbi-csvg-row--drop-before, .codbi-csvg-row--drop-after")).toHaveLength(0);
  });

  it("drops a dragged row at the top when released above the first row", () => {
    const ui = open("a;x,b;y,c;z");
    fakeLayout(ui.rows());

    const grip = ui.grip(2);
    grip.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientY: 45 }));
    grip.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientY: 2 }));
    grip.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientY: 2 }));

    expect(ui.apply()).toBe("c;z,a;x,b;y");
  });

  it("highlights the drop position while dragging", () => {
    const ui = open("a;x,b;y,c;z");
    fakeLayout(ui.rows());

    const grip = ui.grip(0);
    grip.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientY: 5 }));
    grip.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientY: 35 }));

    expect(ui.rows()[0].classList.contains("codbi-csvg-row--dragging")).toBe(true);
    expect(ui.rows()[2].classList.contains("codbi-csvg-row--drop-before")).toBe(true);

    grip.dispatchEvent(new MouseEvent("pointercancel", { bubbles: true }));
    expect(document.querySelectorAll(".codbi-csvg-row--drop-before, .codbi-csvg-row--drop-after")).toHaveLength(0);
  });

  it("keeps the order unchanged when a row is dropped onto itself", () => {
    const ui = open("a;x,b;y,c;z");
    fakeLayout(ui.rows());

    const grip = ui.grip(1);
    grip.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientY: 25 }));
    grip.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientY: 25 }));
    grip.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientY: 25 }));

    expect(ui.apply()).toBe("a;x,b;y,c;z");
  });
});
