// Tests for ElementFunctionalityConfigEditor's two functionality lists: the applicable "main" list and
// the toggle-only "not declared for this element" second list.

import { afterEach, describe, expect, it } from "@jest/globals";
import type { TEditorCfg } from "@de-xima/fc-form-designer";

import {
  ElementFunctionalityConfigEditor,
  type IElementFunctionalityConfigDescriptor,
} from "../src/js/ElementFunctionalityConfigEditor.js";

import { resetTestState, TestState } from "./test-state.js";

/** Builds the editor under test with a designer instance reporting the given element. */
function buildEditor(className: string, properties: Record<string, unknown>): HTMLElement {
  TestState.designerInstance = {
    getSelectedMasterItem: () => ({ className, getPersist: () => ({ properties }) }),
  };

  const config = { designer: {} } as unknown as TEditorCfg<IElementFunctionalityConfigDescriptor>;
  const editor = new ElementFunctionalityConfigEditor(config);

  return editor.getElement()[0] as HTMLElement;
}

/** The ids shown in the option rows beneath the given options container selector. */
function optionIds(root: HTMLElement, selector: string): string[] {
  return Array.from(root.querySelectorAll(`${selector} .codbi-func-config__option`)).map(
    (row) => row.querySelector("span")?.textContent ?? "",
  );
}

afterEach(() => {
  resetTestState();
  delete (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData;
});

describe("ElementFunctionalityConfigEditor functionality lists", () => {
  it("splits the functionalities into applicable (main) and non-applicable (toggle-only) lists", () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detFunctionalities: {
        "Any.Thing": {},
        "Date.Min": { supportedFormelementtypes: { XTextField: { datatype: "dateDE" } } },
        "Html.Panel": { supportedFormelementtypes: ["XContainer"] },
      },
    };

    const rootEl = buildEditor("XTextField", { datatype: "dateDE" });

    // Main list: the fail-open functionality plus the one declared for a German date field.
    expect(optionIds(rootEl, ".codbi-func-config__options:not(.codbi-func-config__options--all)")).toEqual([
      "Any.Thing",
      "Date.Min",
    ]);
    // The complement (declared for XContainer only) lands in the second list.
    expect(optionIds(rootEl, ".codbi-func-config__options--all")).toEqual(["Html.Panel"]);
  });

  it("keeps the second list hidden until the toggle button is clicked", () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detFunctionalities: { "Html.Panel": { supportedFormelementtypes: ["XContainer"] } },
    };

    const rootEl = buildEditor("XTextField", {});
    const allList = rootEl.querySelector<HTMLElement>(".codbi-func-config__funclist--all");
    const toggle = rootEl.querySelector<HTMLButtonElement>(".codbi-func-config__show-all");

    expect(allList?.style.display).toBe("none");
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");

    toggle?.click();

    expect(allList?.style.display).toBe("block");
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
  });
});
