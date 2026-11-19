// Tests for the CSS parameter editor popup (`openCssEditor`).
//
// The important behavioural contract is the STORED value: a stylesheet must be written with the
// angle-bracket dialect and a value containing a comma must carry the leading `^`, so the CodBi
// attribute processor neither converts it into an array nor mistakes braces for EP placeholders.

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { openCssEditor } from "../src/js/CssEditor.js";

import type { IFunctionalityParameterSpec } from "../src/js/FunctionalityConfigEditor.js";

/** The helpers returned by {@link open }. */
interface IEditorUi {
  /** Clicks "Apply" and returns the value handed to `onApply`. */
  apply: () => string;
  /** The textarea of the text view. */
  textarea: () => HTMLTextAreaElement;
  /** The single value input of the classes / selector view. */
  mainInput: () => HTMLInputElement;
  /** All rendered issue rows. */
  issues: () => HTMLElement[];
}

/**
 * Opens the CSS editor.
 *
 * @param value - The stored parameter value.
 * @param spec  - The parameter spec.
 * @returns The editor helpers.
 */
function open(value: unknown, spec: IFunctionalityParameterSpec): IEditorUi {
  const onApply = jest.fn<(next: string) => void>();
  const anchor = document.createElement("div");
  document.body.appendChild(anchor);

  openCssEditor({ document, anchor, value, spec, onApply });

  const apply = (): string => {
    const button = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-foot button")).find(
      (candidate) => candidate.textContent === "Apply",
    );
    expect(button).toBeDefined();
    button?.click();
    expect(onApply).toHaveBeenCalledTimes(1);
    return onApply.mock.calls[0][0];
  };

  const textarea = (): HTMLTextAreaElement => {
    const found = document.querySelector<HTMLTextAreaElement>(".codbi-csse-textarea");
    expect(found).not.toBeNull();
    return found as HTMLTextAreaElement;
  };

  const mainInput = (): HTMLInputElement => {
    const found = document.querySelector<HTMLInputElement>(".codbi-csse-main input.codbi-csse-input");
    expect(found).not.toBeNull();
    return found as HTMLInputElement;
  };

  const issues = (): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>(".codbi-csse-issue"));

  return { apply, textarea, mainInput, issues };
}

/** Switches the open editor to its Text view (a declaration parameter now starts in the grid). */
function showTextView(): void {
  Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-tab"))
    .find((tab) => tab.textContent === "Text")
    ?.click();
}

/** @returns the CSS-editor overlay, if one is open. */
function overlay(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".codbi-csse-overlay");
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  document.body.innerHTML = "";
  localStorage.clear();
});

describe("CssEditor — stylesheet mode", () => {
  it("shows the stored angle-bracket form as real braces, prettified", () => {
    const ui = open("^body<background: rgba(0,0,0,.5)>", { type: "css" });

    // The one-line stored form is formatted: one rule per block, one declaration per line.
    expect(ui.textarea().value).toBe("body {\n  background: rgba(0,0,0,.5);\n}");
  });

  it("re-applies the dialect and the ^ escape when the value contains a comma", () => {
    const ui = open("^body<background: rgba(0,0,0,.5)>", { type: "css" });

    expect(ui.apply()).toBe("^body <\n  background: rgba(0,0,0,.5);\n>");
  });

  it("stores without ^ when no comma is present", () => {
    const ui = open("body<color:red>", { type: "css" });

    expect(ui.apply()).toBe("body <\n  color: red;\n>");
  });

  it("writes the edited text back with the dialect applied", () => {
    const ui = open("", { type: "css" });
    const textarea = ui.textarea();
    textarea.value = "p { color: blue; }";
    textarea.dispatchEvent(new Event("input"));

    expect(ui.apply()).toBe("p < color: blue; >");
  });

  it("reports a missing closing brace as an error", () => {
    const ui = open("p { color: blue;", { type: "css" });

    expect(ui.issues().some((row) => row.className.includes("codbi-csse-issue--error"))).toBe(true);
  });

  it("offers a rule grid that adds a rule", () => {
    const ui = open("", { type: "css" });
    const rulesTab = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-tab")).find(
      (tab) => tab.textContent === "Rules",
    );
    rulesTab?.click();

    const addRule = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-add")).find((button) =>
      String(button.textContent).includes("Add rule"),
    );
    addRule?.click();

    expect(ui.apply()).toBe(".new-selector < color: inherit; >");
  });
});

describe("CssEditor — declaration mode", () => {
  it("keeps the declarations and escapes the comma", () => {
    const ui = open("color: red;", { type: "css", cssKind: "declarations" });
    showTextView();

    expect(ui.textarea().value).toBe("color: red;");
    expect(ui.apply()).toBe("color: red;");
  });

  it("adds a declaration through the grid", () => {
    const ui = open("color: red;", { type: "css", cssKind: "declarations" });
    const declarationsTab = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-tab")).find(
      (tab) => tab.textContent === "Declarations",
    );
    declarationsTab?.click();

    const add = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-add")).find((button) =>
      String(button.textContent).includes("Add declaration"),
    );
    add?.click();

    expect(ui.apply()).toBe("color: red; color: inherit;");
  });

  it("treats a keyframe-step list as steps — no bogus issues, @keyframes preview", () => {
    const steps = "0% { opacity: 0; } 100% { opacity: 1; }";
    const ui = open(steps, { type: "css", cssKind: "declarations" });

    // No false "1 closing '}' missing" / `Unknown property "0% { opacity"` reports.
    expect(ui.issues()).toHaveLength(0);

    // The step GRID (Rules) is the DEFAULT view — a declaration grid cannot represent `0% { … }`.
    expect(document.querySelector<HTMLButtonElement>('.codbi-csse-tab[aria-selected="true"]')?.textContent).toBe(
      "Rules",
    );
    // The text view shows the same value formatted.
    showTextView();
    expect(ui.textarea().value).toBe("0% {\n  opacity: 0;\n}\n\n100% {\n  opacity: 1;\n}");

    // The preview wraps the steps in `@keyframes` exactly like the runtime does — injected bare they
    // are invalid CSS and would be dropped.
    const srcdoc = document.querySelector<HTMLIFrameElement>(".codbi-csse-preview")?.srcdoc ?? "";
    expect(srcdoc).toContain("@keyframes codbi-csse-preview{");
    expect(srcdoc).toContain("animation:codbi-csse-preview 1.2s ease-in-out forwards");

    expect(ui.apply()).toBe("0% {\n  opacity: 0;\n}\n\n100% {\n  opacity: 1;\n}");
  });

  it("offers a filterable picker of every CSS property in the declaration grid", () => {
    const ui = open("color: red;", { type: "css", cssKind: "declarations" });

    // The property cell carries a picker button next to its (still free-text) input.
    document.querySelector<HTMLButtonElement>(".codbi-csse-main .codbi-csse-icon")?.click();
    const picker = document.querySelector<HTMLElement>(".codbi-csse-picker");
    expect(picker).not.toBeNull();

    const filter = picker?.querySelector<HTMLInputElement>("input");
    expect(filter?.placeholder).toBe("Filter properties…");
    const entries = (): string[] =>
      Array.from(picker?.querySelectorAll("button") ?? []).map((button) => String(button.textContent));

    expect(entries()).toContain("background");
    expect(entries().length).toBeGreaterThan(50);
    // The filter spans the whole listing (the entries are `width:100%`).
    expect(filter?.style.width).toBe("100%");

    // The filter input narrows the list …
    if (filter) {
      filter.value = "box-shad";
      filter.dispatchEvent(new Event("input"));
    }
    expect(entries()).toEqual(["box-shadow"]);

    // … picking an entry writes it into the property input AND closes the popup.
    picker?.querySelector<HTMLButtonElement>("button")?.click();
    expect(ui.mainInput().value).toBe("box-shadow");
    expect(document.querySelector(".codbi-csse-picker")).toBeNull();
  });

  it("closes the picker on a click outside it and when the editor closes", () => {
    open("color: red;", { type: "css", cssKind: "declarations" });
    document.querySelector<HTMLButtonElement>(".codbi-csse-main .codbi-csse-icon")?.click();
    expect(document.querySelector(".codbi-csse-picker")).not.toBeNull();

    // A pointer press anywhere outside the popup dismisses it.
    document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    expect(document.querySelector(".codbi-csse-picker")).toBeNull();

    // Re-open it — closing the EDITOR must never leave the popup behind (it lives in `body`, outside
    // the overlay).
    document.querySelector<HTMLButtonElement>(".codbi-csse-main .codbi-csse-icon")?.click();
    expect(document.querySelector(".codbi-csse-picker")).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(document.querySelector(".codbi-csse-picker")).toBeNull();
    expect(overlay()).toBeNull();
  });

  it("offers keyframe PERCENTAGES in the rule grid's picker (not CSS classes)", () => {
    open("0% { opacity: 0; } 100% { opacity: 1; }", { type: "css", cssKind: "declarations" });

    Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-tab"))
      .find((tab) => tab.textContent === "Rules")
      ?.click();
    document.querySelector<HTMLButtonElement>(".codbi-csse-icon")?.click();

    const picker = document.querySelector<HTMLElement>(".codbi-csse-picker");
    expect(picker).not.toBeNull();
    const entries = Array.from(picker?.querySelectorAll("button") ?? []).map((button) => String(button.textContent));
    // The step list …
    expect(entries).toContain("50%");
    expect(entries).toContain("from");
    // … and NOT the form's CSS classes.
    expect(entries).not.toContain(".xform");
  });
});

describe("CssEditor — classes mode", () => {
  it("renders one chip per class and applies the joined list", () => {
    const ui = open("my-table", { type: "css", cssKind: "classes" });

    expect(document.querySelectorAll(".codbi-csse-chip")).toHaveLength(1);
    expect(ui.apply()).toBe("my-table");
  });

  it("adds a class typed into the input", () => {
    const ui = open("my-table", { type: "css", cssKind: "classes" });
    const input = ui.mainInput();
    input.value = ".compact";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(document.querySelectorAll(".codbi-csse-chip")).toHaveLength(2);
    expect(ui.apply()).toBe("my-table compact");
  });
});

describe("CssEditor — selector mode", () => {
  it("counts the matches and applies the selector", () => {
    const ui = open(".codbi-csse", { type: "selector" });
    const view = document.querySelector(".codbi-csse-main");
    expect(view?.textContent).toContain("matches");

    expect(ui.apply()).toBe(".codbi-csse");
  });

  it("escapes a comma-separated selector list", () => {
    const ui = open("a, b", { type: "selector" });

    expect(ui.apply()).toBe("^a, b");
  });
});

describe("CssEditor — header, selector picker and form preview", () => {
  it("shows the parameter name in bold in the header", () => {
    openCssEditor({
      document,
      anchor: document.body,
      parameterName: "CSSHeaderUnfolded",
      value: "a<color:red>",
      spec: { type: "css" },
      onApply: jest.fn<(next: string) => void>(),
    });

    expect(document.querySelector(".codbi-csse-head b")?.textContent).toBe("CSS Editor");
    const name = document.querySelector(".codbi-csse-head .codbi-csse-sub");
    expect(name?.tagName).toBe("B");
    expect(name?.textContent).toBe("CSSHeaderUnfolded");
  });

  it("offers RGB, HSL and CMYK inputs in the color picker", () => {
    open("color: red;", { type: "css", cssKind: "declarations" });
    document.querySelector<HTMLButtonElement>(".codbi-csse-swatch")?.click();

    const picker = document.querySelector<HTMLElement>(".codbi-cse-tools");
    expect(picker).not.toBeNull();
    const grids = picker!.querySelectorAll<HTMLElement>(".codbi-cse-chans");
    expect(grids).toHaveLength(3);

    // `red` → R 255 / G 0 / B 0
    const rgbInputs = Array.from(grids[0].querySelectorAll<HTMLInputElement>("input"));
    expect(rgbInputs.map((input) => input.value)).toEqual(["255", "0", "0"]);

    // Editing a channel updates the hex field.
    rgbInputs[1].value = "128";
    rgbInputs[1].dispatchEvent(new Event("input"));
    expect(picker!.querySelector<HTMLInputElement>("input.codbi-cse-text")?.value.toLowerCase()).toBe("#ff8000");
  });

  it("shows the CodBi logo in the header", () => {
    open("a<color:red>", { type: "css" });

    const logo = document.querySelector<HTMLImageElement>(".codbi-csse-head img.codbi-csse-logo");
    expect(logo).not.toBeNull();
    expect(logo?.src).toContain("Symbol_CodBi.svg");
  });

  it("offers the form's classes in a filterable picker and applies the picked one", () => {
    const form = document.createElement("form");
    form.className = "xform";
    const field = document.createElement("input");
    field.className = "XTextField MyOwnClass";
    form.appendChild(field);
    document.body.appendChild(form);

    open("a<color:red>", { type: "css" });
    const rulesTab = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-tab")).find(
      (tab) => tab.textContent === "Rules",
    );
    rulesTab?.click();

    const picker = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-icon")).find(
      (button) => button.textContent === "▾",
    );
    picker?.click();

    const panel = document.querySelector<HTMLElement>(".codbi-csse-picker");
    expect(panel?.textContent).toContain(".XTextField");
    expect(panel?.textContent).toContain(".MyOwnClass");

    // The list is filterable.
    const filter = panel?.querySelector<HTMLInputElement>('input[type="search"]');
    filter!.value = "myown";
    filter!.dispatchEvent(new Event("input"));
    expect(panel?.textContent).toContain(".MyOwnClass");
    expect(panel?.textContent).not.toContain(".XTextField");

    const option = Array.from(panel!.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === ".MyOwnClass",
    );
    option?.click();

    const selectorInput = document.querySelector<HTMLInputElement>(".codbi-csse-main input.codbi-csse-input");
    expect(selectorInput?.value).toBe(".MyOwnClass");
    expect(document.querySelector(".codbi-csse-picker")).toBeNull();
  });

  it("renders the real form in the preview and outlines the matched elements", () => {
    const form = document.createElement("form");
    form.className = "xform";
    form.innerHTML = '<input class="XTextField" />';
    document.body.appendChild(form);

    open("^.XTextField<outline:none>", { type: "css" });
    jest.advanceTimersByTime(400);

    const frame = document.querySelector<HTMLIFrameElement>(".codbi-csse-preview");
    expect(frame?.srcdoc).toContain("XTextField");
    expect(frame?.srcdoc).toContain("data-csse-hit");
    expect(frame?.srcdoc).toContain("outline: none");
  });
});

describe("CssEditor — color picker and gradient generator", () => {
  it("shows a swatch for a color declaration and writes the picked color back", () => {
    const ui = open("color: red;", { type: "css", cssKind: "declarations" });
    const declarationsTab = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-tab")).find(
      (tab) => tab.textContent === "Declarations",
    );
    declarationsTab?.click();

    const swatch = document.querySelector<HTMLButtonElement>(".codbi-csse-swatch");
    expect(swatch).not.toBeNull();
    swatch?.click();

    expect(document.querySelector(".codbi-cse-tools")).not.toBeNull();
    const textInput = document.querySelector<HTMLInputElement>(".codbi-cse-tools input.codbi-cse-text");
    expect(textInput).not.toBeNull();
    textInput!.value = "#00ff00";
    textInput!.dispatchEvent(new Event("input"));

    const pickerApply = document.querySelector<HTMLButtonElement>(".codbi-cse-tools .codbi-cse-btn--primary");
    pickerApply?.click();

    expect(ui.apply()).toBe("color: #00ff00;");
  });

  it("lists the gradients stored in this browser and loads one on click", () => {
    localStorage.setItem(
      "codbi-cse-gradient-history",
      JSON.stringify(["linear-gradient(45deg, #ff8c00 0%, #ff2d55 100%)"]),
    );
    open("color: red;", { type: "css" });
    const gradientButton = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-toolbar button")).find(
      (button) => button.textContent === "Gradient",
    );
    gradientButton?.click();

    const builder = document.querySelector<HTMLElement>(".codbi-cse-tools");
    expect(builder).not.toBeNull();
    expect(builder!.querySelectorAll(".codbi-cse-handle")).toHaveLength(2);

    const chips = builder!.querySelectorAll<HTMLButtonElement>(".codbi-cse-preset");
    expect(chips).toHaveLength(1);
    chips[0].click();

    const code = builder!.querySelector<HTMLInputElement>("input.codbi-cse-text");
    expect(code?.value).toBe("linear-gradient(45deg, #ff8c00 0%, #ff2d55 100%)");
  });

  it("stores an inserted gradient and offers it the next time", () => {
    open("color: red;", { type: "css" });
    const gradientButton = () =>
      Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-toolbar button")).find(
        (button) => button.textContent === "Gradient",
      );

    gradientButton()?.click();
    const first = document.querySelector<HTMLElement>(".codbi-cse-tools");
    Array.from(first!.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent === "Insert")
      ?.click();

    expect(JSON.parse(localStorage.getItem("codbi-cse-gradient-history") ?? "[]")).toHaveLength(1);

    // Re-opening the builder offers the applied gradient in the "Recent" list.
    gradientButton()?.click();
    const second = document.querySelector<HTMLElement>(".codbi-cse-tools");
    expect(second!.querySelectorAll(".codbi-cse-preset")).toHaveLength(1);

    // "Clear" forgets the stored gradients.
    Array.from(second!.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent === "Clear")
      ?.click();
    expect(second!.querySelectorAll(".codbi-cse-preset")).toHaveLength(0);
    expect(second!.querySelector(".codbi-cse-hint")).not.toBeNull();
    expect(localStorage.getItem("codbi-cse-gradient-history")).toBeNull();
  });

  it("adds a stop when the gradient bar is clicked", () => {
    open("color: red;", { type: "css" });
    const gradientButton = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-toolbar button")).find(
      (button) => button.textContent === "Gradient",
    );
    gradientButton?.click();

    const builder = document.querySelector<HTMLElement>(".codbi-cse-tools");
    const bar = builder!.querySelector<HTMLElement>(".codbi-cse-bar");
    expect(bar).not.toBeNull();
    jest.spyOn(bar!, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      right: 200,
      bottom: 12,
      width: 200,
      height: 12,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    bar!.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 100 }));

    expect(builder!.querySelectorAll(".codbi-cse-handle")).toHaveLength(3);
  });

  it("inserts a generated gradient at the caret", () => {
    const ui = open("color: red;", { type: "css" });
    const gradientButton = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-toolbar button")).find(
      (button) => button.textContent === "Gradient",
    );
    gradientButton?.click();

    const builder = document.querySelector<HTMLElement>(".codbi-cse-tools");
    expect(builder).not.toBeNull();
    expect(builder?.textContent).toContain("Gradient");

    const insert = Array.from(builder!.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "Insert",
    );
    insert?.click();

    expect(ui.textarea().value).toContain("linear-gradient(180deg, #ffffff 0%, #ff8c00 100%)");
  });
});

describe("CssEditor — maximize and element-scoped preview", () => {
  it("maximizes and restores the popup", () => {
    open("a<color:red>", { type: "css" });
    const headButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-head button"));

    headButtons.find((button) => button.textContent === "⛶")?.click();
    expect(document.querySelector(".codbi-csse-popup--max")).not.toBeNull();
    expect(document.querySelector<HTMLElement>(".codbi-csse-popup")?.style.width).toBe(`${window.innerWidth}px`);

    Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-head button"))
      .find((button) => button.textContent === "❐")
      ?.click();
    expect(document.querySelector(".codbi-csse-popup--max")).toBeNull();
  });

  it("snaps to the left half when the popup is dragged to the left edge", () => {
    open("a<color:red>", { type: "css" });
    const popup = document.querySelector<HTMLElement>(".codbi-csse-popup");
    const head = document.querySelector<HTMLElement>(".codbi-csse-head");
    expect(popup).not.toBeNull();
    // The POPUP's rectangle decides the snap zone (the pointer stays inside the header).
    jest.spyOn(popup!, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 120,
      width: 700,
      height: 400,
      right: 700,
      bottom: 520,
      x: 0,
      y: 120,
      toJSON: () => ({}),
    } as DOMRect);

    head!.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 130 }));
    document.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 60, clientY: 200 }));
    document.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientX: 60, clientY: 200 }));

    expect(popup!.style.left).toBe("0px");
    expect(popup!.style.width).toBe(`${window.innerWidth / 2}px`);
    expect(popup!.style.height).toBe(`${window.innerHeight}px`);
  });

  it("uses the platform preview URL when one is provided", () => {
    const onApply = jest.fn<(next: string) => void>();
    openCssEditor({
      document,
      anchor: document.body,
      value: "a<color:red>",
      spec: { type: "css" },
      previewSrc: "https://example.test/designer/preview/1",
      onApply,
    });

    const frame = document.querySelector<HTMLIFrameElement>(".codbi-csse-preview");
    expect(frame?.getAttribute("src")).toContain("designer/preview/1");
    expect(frame?.getAttribute("src")).toContain("_cbcss=");
  });

  it("always opens with its own value — never another parameter's draft", () => {
    // Edit a declarations value in a first editor and CANCEL it (the draft bucket used to be shared).
    const first = open("color: red;", { type: "css", cssKind: "declarations" });
    showTextView();
    const firstTextarea = first.textarea();
    firstTextarea.value = "background: hotpink;";
    firstTextarea.dispatchEvent(new Event("input"));
    Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-foot button"))
      .find((button) => button.textContent === "Cancel")
      ?.click();

    // A second editor opened with a real 3-declaration value must show exactly that value.
    const value = "^position : relative ; box-shadow : 0 0 0 red ; padding-left : 2em ;";
    const ui = open(value, { type: "css", cssKind: "declarations" });
    // The declarations grid is the DEFAULT view for this kind.
    expect(document.querySelectorAll(".codbi-csse-main table tbody tr")).toHaveLength(3);

    showTextView();
    // The one-line stored value is shown formatted (one declaration per line).
    expect(ui.textarea().value).toBe("position: relative;\nbox-shadow: 0 0 0 red;\npadding-left: 2em;");
  });

  it("keeps the focus in a declaration input while typing", () => {
    open("color: red;", { type: "css", cssKind: "declarations" });
    const declarationsTab = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-tab")).find(
      (tab) => tab.textContent === "Declarations",
    );
    declarationsTab?.click();

    const input = document.querySelector<HTMLInputElement>(".codbi-csse-main input.codbi-csse-input");
    expect(input).not.toBeNull();
    input!.focus();
    input!.value = "colr";
    input!.dispatchEvent(new Event("input"));

    // The cell is NOT rebuilt, so the very same node is still focused.
    expect(document.querySelector(".codbi-csse-main input.codbi-csse-input")).toBe(input);
    expect(document.activeElement).toBe(input);
  });

  it("keeps Backspace inside the declaration inputs away from the designer", () => {
    open("color: red;", { type: "css", cssKind: "declarations" });
    const declarationsTab = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-tab")).find(
      (tab) => tab.textContent === "Declarations",
    );
    declarationsTab?.click();

    const input = document.querySelector<HTMLInputElement>(".codbi-csse-main input.codbi-csse-input");
    expect(input).not.toBeNull();

    const designerHandler = jest.fn();
    const inputHandler = jest.fn();
    document.addEventListener("keydown", designerHandler);
    input!.addEventListener("keydown", inputHandler);

    input!.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }));

    // The input still receives the key …
    expect(inputHandler).toHaveBeenCalledTimes(1);
    // … but the designer's document-level shortcut never does (it would delete the element).
    expect(designerHandler).not.toHaveBeenCalled();

    document.removeEventListener("keydown", designerHandler);
  });

  it("moves the split bar to either side with its arrows", () => {
    open("a<color:red>", { type: "css" });
    const content = document.querySelector<HTMLElement>(".codbi-csse-content");
    const side = document.querySelector<HTMLElement>(".codbi-csse-side");
    expect(content).not.toBeNull();
    // jsdom has no layout: fake a 1000px wide content area so the percentage jumps are meaningful.
    Object.defineProperty(content!, "clientWidth", { value: 1000, configurable: true });

    const buttons = (): HTMLButtonElement[] =>
      Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-splitbtn"));

    buttons()
      .find((button) => button.textContent === "◀")
      ?.click();
    expect(side!.style.flex).toBe("0 0 920px");

    buttons()
      .find((button) => button.textContent === "▶")
      ?.click();
    expect(side!.style.flex).toBe("0 0 80px");
  });

  it("clips the live preview on load and re-applies the CSS only on the Update button", () => {
    const onApply = jest.fn<(next: string) => void>();
    const clip = jest.fn<(frame: HTMLIFrameElement, id: string) => boolean>(() => true);
    openCssEditor({
      document,
      anchor: document.body,
      value: "a<color:red>",
      spec: { type: "css" },
      previewSrc: "https://example.test/designer/preview/1",
      previewElementId: "xi-1",
      previewClip: clip,
      onApply,
    });

    const frame = document.querySelector<HTMLIFrameElement>(".codbi-csse-preview");
    frame!.dispatchEvent(new Event("load"));
    expect(clip).toHaveBeenCalledWith(frame, "xi-1");

    const update = document.querySelector<HTMLButtonElement>(".codbi-csse-updatebtn");
    expect(update).not.toBeNull();
    expect(update!.classList.contains("codbi-csse-updatebtn--dirty")).toBe(false);

    // Typing does NOT touch the preview — it only marks the button as pending.
    const textarea = document.querySelector<HTMLTextAreaElement>(".codbi-csse-textarea");
    textarea!.value = "b { color: blue; }";
    textarea!.dispatchEvent(new Event("input"));
    expect(update!.classList.contains("codbi-csse-updatebtn--dirty")).toBe(true);

    // Only the explicit click updates the preview: it RELOADS the platform page (fresh cache-buster)
    // and confirms itself with a check mark.
    const srcBefore = frame!.getAttribute("src");
    update!.click();
    expect(update!.classList.contains("codbi-csse-updatebtn--dirty")).toBe(false);
    expect(frame!.getAttribute("src")).not.toBe(srcBefore);
    expect(frame!.getAttribute("src")).toContain("_cbcss=");
    expect(update!.textContent).toBe("✓");
    jest.advanceTimersByTime(900);
    expect(update!.textContent).toBe("⟳");
  });

  it("applies declarations through the injected stylesheet, not through inline styles", () => {
    const onApply = jest.fn<(next: string) => void>();
    const clip = jest.fn<(frame: HTMLIFrameElement, id: string) => boolean>(() => true);
    openCssEditor({
      document,
      anchor: document.body,
      value: "border: 1px solid red; background: hotpink;",
      spec: { type: "css", cssKind: "declarations" },
      previewSrc: "https://example.test/designer/preview/1",
      previewElementId: "xi-1",
      previewClip: clip,
      onApply,
    });

    const frame = document.querySelector<HTMLIFrameElement>(".codbi-csse-preview");
    expect(frame).not.toBeNull();

    // jsdom does not load the platform preview URL, so the preview document is supplied directly.
    const liveDoc = document.implementation.createHTMLDocument("preview");
    Object.defineProperty(frame!, "contentDocument", { configurable: true, value: liveDoc });

    // A panel header carrying the value the runtime wrote EARLIER (the old, inline border colour).
    const header = liveDoc.createElement("div");
    header.id = "xi-1";
    header.className = "CodBi_HTML_Panel_Header";
    header.setAttribute("style", "border: 1px solid blue;");
    liveDoc.body.appendChild(header);

    frame!.dispatchEvent(new Event("load"));

    // The editor writes NO inline style: it only drops the stale property so its rule can win …
    expect(header.getAttribute("style") ?? "").not.toContain("hotpink");
    expect(header.hasAttribute("data-csse-target")).toBe(true);
    // … and the whole declaration block goes into the injected stylesheet.
    const injected = liveDoc.getElementById("codbi-csse-live");
    expect(injected?.textContent).toContain("[data-csse-target]{");
    expect(injected?.textContent).toContain("background: hotpink");
  });

  it("styles only the panel's OWN header (inside its cHeader wrapper), never the panel root", () => {
    openCssEditor({
      document,
      anchor: document.body,
      value: "border-radius: 8px; background: hotpink;",
      spec: { type: "css", cssKind: "declarations" },
      previewSrc: "https://example.test/designer/preview/1",
      previewElementId: "xi-1",
      previewClip: () => true,
      onApply: jest.fn(),
    });

    const frame = document.querySelector<HTMLIFrameElement>(".codbi-csse-preview");
    const liveDoc = document.implementation.createHTMLDocument("preview");
    Object.defineProperty(frame!, "contentDocument", { configurable: true, value: liveDoc });

    // The real markup HTML.Panel builds around the panel root the preview is clipped to:
    // <div id="xi-1" class="--HTML_Panel">
    //   <div class="cHeader"><div class="CodBi_HTML_Panel_Header">   ← its OWN chrome (2 levels deep)
    //   <div class="body">
    //     <div class="CodBi_HTML_Panel"><div class="cHeader"><div class="CodBi_HTML_Panel_Header"> ← nested!
    const panel = liveDoc.createElement("div");
    panel.id = "xi-1";
    panel.className = "--HTML_Panel";
    const ownWrap = liveDoc.createElement("div");
    ownWrap.className = "cHeader";
    const ownHeader = liveDoc.createElement("div");
    ownHeader.className = "CodBi_HTML_Panel_Header";
    ownWrap.appendChild(ownHeader);

    const body = liveDoc.createElement("div");
    body.className = "body";
    const nestedPanel = liveDoc.createElement("div");
    nestedPanel.className = "CodBi_HTML_Panel";
    const nestedWrap = liveDoc.createElement("div");
    nestedWrap.className = "cHeader";
    const nestedHeader = liveDoc.createElement("div");
    nestedHeader.className = "CodBi_HTML_Panel_Header";
    nestedWrap.appendChild(nestedHeader);
    nestedPanel.appendChild(nestedWrap);
    body.appendChild(nestedPanel);

    panel.append(ownWrap, body);
    liveDoc.body.appendChild(panel);

    frame!.dispatchEvent(new Event("load"));

    // The header is the only node that carries the styling …
    expect(ownHeader.hasAttribute("data-csse-target")).toBe(true);
    // … and neither the panel ROOT (the "second panel" behind the header once unfolded) nor a nested
    // panel's header is touched.
    expect(panel.hasAttribute("data-csse-target")).toBe(false);
    expect(nestedHeader.hasAttribute("data-csse-target")).toBe(false);
  });

  it("resizes from the south-east handle and follows the pointer", () => {
    open("a<color:red>", { type: "css" });
    const popup = document.querySelector<HTMLElement>(".codbi-csse-popup");
    expect(popup).not.toBeNull();
    jest.spyOn(popup!, "getBoundingClientRect").mockReturnValue({
      left: 10,
      top: 20,
      width: 800,
      height: 500,
      right: 810,
      bottom: 520,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    } as DOMRect);

    const corner = document.querySelector<HTMLElement>(".codbi-csse-resizer--se");
    expect(corner).not.toBeNull();
    corner!.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientX: 810, clientY: 520 }));
    // The move is tracked on the DOCUMENT — the thin handle is left immediately while dragging.
    document.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 910, clientY: 600 }));

    expect(popup!.style.width).toBe("900px");
    expect(popup!.style.height).toBe("580px");

    document.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientX: 910, clientY: 600 }));
  });

  it("previews only the element the editor was invoked for", () => {
    const form = document.createElement("form");
    form.className = "xform";
    const field = document.createElement("input");
    field.className = "XTextField only-this";
    const other = document.createElement("textarea");
    other.className = "OtherField";
    form.append(field, other);
    document.body.appendChild(form);

    const onApply = jest.fn<(next: string) => void>();
    openCssEditor({
      document,
      anchor: document.body,
      value: "a<color:red>",
      spec: { type: "css" },
      previewRoot: field,
      onApply,
    });
    jest.advanceTimersByTime(400);

    const srcdoc = document.querySelector<HTMLIFrameElement>(".codbi-csse-preview")?.srcdoc ?? "";
    expect(srcdoc).toContain("only-this");
    expect(srcdoc).not.toContain("OtherField");
  });

  it("previews the SAME element for a declarations parameter (no `.sample` box)", () => {
    const field = document.createElement("div");
    field.className = "XTextField only-this";
    field.innerHTML = '<span class="codbi-badge">badge</span><span class="keep-me">inner</span>';
    document.body.appendChild(field);

    openCssEditor({
      document,
      anchor: document.body,
      value: "background: hotpink; border-radius: 6px;",
      spec: { type: "css", cssKind: "declarations" },
      previewRoot: field,
      onApply: jest.fn(),
    });
    jest.advanceTimersByTime(400);

    const srcdoc = document.querySelector<HTMLIFrameElement>(".codbi-csse-preview")?.srcdoc ?? "";
    // The cloned ELEMENT is the target of the declarations …
    expect(srcdoc).toContain('data-csse-target=""');
    expect(srcdoc).toContain("[data-csse-target]{background: hotpink;");
    expect(srcdoc).toContain("border-radius: 6px;}");
    // … not the sample box that does not exist in a real form (the parameter showed nothing before).
    expect(srcdoc).not.toContain(".sample{");
    // The CodBi designer widgets are stripped, the element's own content stays.
    expect(srcdoc).not.toContain("codbi-badge");
    expect(srcdoc).toContain("keep-me");
  });

  it("applies a `CSSAfterHeader` block to the header's ::after pseudo element", () => {
    const field = document.createElement("div");
    field.className = "XTextField";
    document.body.appendChild(field);

    openCssEditor({
      document,
      anchor: document.body,
      parameterName: "CSSAfterHeader",
      value: "color: red;",
      spec: { type: "css", cssKind: "declarations" },
      previewRoot: field,
      onApply: jest.fn(),
    });
    jest.advanceTimersByTime(400);

    const srcdoc = document.querySelector<HTMLIFrameElement>(".codbi-csse-preview")?.srcdoc ?? "";
    // The runtime writes this parameter as `.CodBi_HTML_Panel_Header::after { content: … }`, so the
    // preview must do the same — a pseudo ELEMENT also needs a `content` to render at all.
    expect(srcdoc).toContain('[data-csse-target]::after{content:"";color: red;}');
  });
});

describe("CssEditor — shell", () => {
  it("opens exactly one overlay and closes it on Escape without applying", () => {
    open("body<color:red>", { type: "css" });
    expect(overlay()).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(overlay()).toBeNull();
  });

  it("closes through Cancel without applying", () => {
    const onApply = jest.fn<(next: string) => void>();
    const anchor = document.createElement("div");
    document.body.appendChild(anchor);
    openCssEditor({ document, anchor, value: "body<color:red>", spec: { type: "css" }, onApply });

    const cancel = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-foot button")).find(
      (candidate) => candidate.textContent === "Cancel",
    );
    cancel?.click();

    expect(onApply).not.toHaveBeenCalled();
    expect(overlay()).toBeNull();
  });

  it("removes the declarations the runtime sanitizer would neutralize", () => {
    const ui = open("a { color: red; background: url(https://x/y.png); }", { type: "css" });
    const fix = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-toolbar button")).find((button) =>
      String(button.textContent).includes("Remove blocked"),
    );
    fix?.click();

    expect(ui.apply()).toBe("a < color: red; >");
  });

  it("opens the find bar with Ctrl+F", () => {
    open("a{color:red}", { type: "css" });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "f", ctrlKey: true, bubbles: true }));

    const input = document.querySelector<HTMLInputElement>('.codbi-csse-toolbar input[type="search"]');
    expect(input?.style.display).toBe("inline-block");
  });

  it("has no Reset/Snippets buttons (the toolbar edits the value only)", () => {
    open("body<color:red>", { type: "css", default: "^body<color:green>" });
    const labels = Array.from(document.querySelectorAll<HTMLButtonElement>(".codbi-csse-toolbar button")).map(
      (button) => String(button.textContent),
    );

    expect(labels.some((text) => /Reset|Snippets|Bausteine|Standard/.test(text))).toBe(false);
  });
});
