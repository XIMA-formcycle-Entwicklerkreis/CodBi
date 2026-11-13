// Tests for the conditional TRUE/FALSE branch support of functionality descriptors
// (`detFunctionalities[*].branches`) and for the branch editors the per-element CodBi panel renders.

import { afterEach, describe, expect, it } from "@jest/globals";
import type { TEditorCfg } from "@de-xima/fc-form-designer";

import {
  branchFuncAttribute,
  branchParamsToRemove,
  branchQueryKey,
  buildBranchFunctionalityPicker,
  functionalityBranches,
} from "../src/js/FunctionalityConfigEditor.js";
import {
  ElementFunctionalityConfigEditor,
  flushElementConfigRenders,
  type IElementFunctionalityConfigDescriptor,
} from "../src/js/ElementFunctionalityConfigEditor.js";

import { resetTestState, TestState } from "./test-state.js";

/** An attribute entry of a form element's persisted config attribute table. */
interface ITestAttribute {
  text?: string;
  value?: string;
}

/** Reads one `data-cb-*` value from a test property bag (case-insensitive). */
function attrValue(properties: Record<string, unknown>, name: string): string | undefined {
  const attrs = (properties.attributes ?? []) as ITestAttribute[];
  return attrs.find((entry) => String(entry.text ?? "").toLowerCase() === name.toLowerCase())?.value;
}

/**
 * Builds the per-element editor with a designer instance reporting an element whose persisted
 * properties are `properties` (mutated in place by the editor's quiet writes).
 */
function buildEditor(className: string, properties: Record<string, unknown>): HTMLElement {
  const prior = (TestState.designerInstance ?? {}) as Record<string, unknown>;
  TestState.designerInstance = {
    ...prior,
    getSelectedMasterItem: () => ({ className, getPersist: () => ({ properties }) }),
  };
  const config = { designer: {} } as unknown as TEditorCfg<IElementFunctionalityConfigDescriptor>;
  const editor = new ElementFunctionalityConfigEditor(config);
  // The listings/parameter rows are built in a deferred macrotask (see the editor's scheduler).
  flushElementConfigRenders();
  return editor.getElement()[0] as HTMLElement;
}

/** Seeds the designer functionality registry with a conditional declaring two branches. */
function seedConditional(): void {
  (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
    detFunctionalities: {
      "OnLoad.Conditional": {
        Parameter: { Candidate: "The value to compare", Mode: "The comparison mode" },
        branches: {
          true: { prefix: "_T_", label: { en: "TRUE branch", de: "WENN-Zweig" } },
          false: { prefix: "_F_", label: { en: "FALSE branch", de: "SONST-Zweig" } },
        },
      },
      "Html.SetAttribute": {
        Parameter: { Name: "The attribute name", ToSet: "The value" },
        Summary: { en: "Sets an HTML attribute." },
      },
      "Other.Func": { Parameter: { Name: "A shared attribute name" } },
    },
  };
}

/** The branch section at `index` of the rendered panel. */
function branchSection(rootEl: HTMLElement, index = 0): HTMLElement {
  return rootEl.querySelectorAll<HTMLElement>(".codbi-func-config__branch")[index];
}

/** The radio inputs of a branch's functionality picker. */
function branchRadios(rootEl: HTMLElement, index = 0): HTMLInputElement[] {
  return Array.from(
    branchSection(rootEl, index).querySelectorAll<HTMLInputElement>(
      '.codbi-func-config__branch-pick input[type="radio"]',
    ),
  );
}

/** The ids offered by a branch's picker (the "no functionality" row is ""). */
function branchRadioValues(rootEl: HTMLElement, index = 0): string[] {
  return branchRadios(rootEl, index).map((radio) => radio.value);
}

/** Picks one functionality in a branch ("" = the "no functionality" row). */
function pickBranchFunctionality(rootEl: HTMLElement, id: string, index = 0): void {
  const radio = branchRadios(rootEl, index).find((entry) => entry.value === id);
  expect(radio).not.toBeUndefined();
  radio!.checked = true;
  radio!.dispatchEvent(new Event("change", { bubbles: true }));
}

afterEach(() => {
  resetTestState();
  delete (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData;
});

describe("functionalityBranches", () => {
  it("resolves the declared branches with their prefixes and localized labels", () => {
    seedConditional();
    TestState.language = "en";

    expect(functionalityBranches("onload.conditional")).toEqual([
      { key: "true", prefix: "_T_", label: "TRUE branch", description: "" },
      { key: "false", prefix: "_F_", label: "FALSE branch", description: "" },
    ]);

    // The label follows the designer language (German here).
    TestState.language = "de";
    expect(functionalityBranches("OnLoad.Conditional").map((branch) => branch.label)).toEqual([
      "WENN-Zweig",
      "SONST-Zweig",
    ]);
  });

  it("falls back to the conventional _T_/_F_ prefixes for a bare branch declaration", () => {
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detFunctionalities: { "Any.Conditional": { branches: { true: {}, false: {} } } },
    };
    TestState.language = "en";

    expect(functionalityBranches("Any.Conditional")).toEqual([
      { key: "true", prefix: "_T_", label: "TRUE", description: "" },
      { key: "false", prefix: "_F_", label: "FALSE", description: "" },
    ]);
  });

  it("returns no branches for a functionality without branch metadata", () => {
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detFunctionalities: { "Date.Min": { Parameter: { Unit: "The unit" } } },
    };

    expect(functionalityBranches("Date.Min")).toEqual([]);
  });

  it("builds the branch attribute names (data-cb-<prefix>func)", () => {
    expect(branchFuncAttribute("_T_")).toBe("data-cb-_T_func");
    expect(branchFuncAttribute("_F_")).toBe("data-cb-_F_func");
  });

  it("keys the remembered filter query per declaring functionality and branch prefix", () => {
    expect(branchQueryKey("OnLoad.Conditional", "_T_")).toBe("onload.conditional|_T_");
    expect(branchQueryKey("OnChange.Conditional", "_F_")).toBe("onchange.conditional|_F_");
  });
});

describe("branchParamsToRemove", () => {
  it("drops every parameter of the former branch functionality", () => {
    seedConditional();
    expect(branchParamsToRemove("_T_", "Html.SetAttribute", "Other.Func")).toEqual(["data-cb-_T_ToSet"]);
  });

  it("keeps parameters the NEW branch functionality also declares (case-insensitive)", () => {
    seedConditional();
    expect(branchParamsToRemove("_T_", "Html.SetAttribute", "html.setattribute")).toEqual([]);
  });

  it("returns nothing when no former branch functionality was set", () => {
    seedConditional();
    expect(branchParamsToRemove("_T_", "", "Html.SetAttribute")).toEqual([]);
  });
});

describe("buildBranchFunctionalityPicker", () => {
  it("renders a filter box and radio rows, mirroring the regular functionality listing", () => {
    seedConditional();
    TestState.language = "en";

    const picker = buildBranchFunctionalityPicker({
      document,
      ownerId: "OnLoad.Conditional",
      branch: { key: "true", prefix: "_T_", label: "TRUE branch", description: "" },
      selectedId: "",
      query: "",
      noneLabel: "\u2014 no functionality \u2014",
      filterPlaceholder: "Filter functionalities\u2026",
      onQueryChange: () => {},
      onSelect: () => {},
    });

    // Same classes as the regular listing => same look (darkorange outline, translucent background).
    expect(picker.classList.contains("codbi-func-config__funclist")).toBe(true);
    expect(picker.classList.contains("codbi-func-config__branch-pick")).toBe(true);
    expect(picker.querySelector(".codbi-func-config__filterrow")).not.toBeNull();
    expect(picker.querySelector<HTMLInputElement>(".codbi-func-config__filter")?.placeholder).toBe(
      "Filter functionalities\u2026",
    );

    const radios = Array.from(picker.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
    // The "no functionality" row comes first, is checked by default and is followed by the registry ids.
    expect(radios[0].value).toBe("");
    expect(radios[0].checked).toBe(true);
    expect(radios.map((radio) => radio.value)).toContain("Html.SetAttribute");
    // The declaring conditional is never offered (it would run itself).
    expect(radios.map((radio) => radio.value)).not.toContain("OnLoad.Conditional");
    // All radios of ONE branch share a name (one radio group per branch/prefix).
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
  });

  it("reports the clicked functionality and ignores the filter text for the 'none' row", () => {
    seedConditional();
    TestState.language = "en";
    const selected: string[] = [];
    const queries: string[] = [];

    const picker = buildBranchFunctionalityPicker({
      document,
      ownerId: "OnLoad.Conditional",
      branch: { key: "true", prefix: "_T_", label: "TRUE branch", description: "" },
      selectedId: "",
      query: "",
      noneLabel: "\u2014 no functionality \u2014",
      filterPlaceholder: "Filter functionalities\u2026",
      onQueryChange: (query) => queries.push(query),
      onSelect: (id) => selected.push(id),
    });
    document.body.appendChild(picker);

    const filter = picker.querySelector<HTMLInputElement>(".codbi-func-config__filter") as HTMLInputElement;
    filter.value = "setattr";
    filter.dispatchEvent(new Event("input", { bubbles: true }));

    // The query is reported (so the caller can remember it) and non-matching rows are hidden, while the
    // "none" row stays visible so the branch can always be cleared.
    expect(queries).toEqual(["setattr"]);
    const rows = Array.from(picker.querySelectorAll<HTMLElement>(".codbi-func-config__option"));
    const visible = rows.filter((row) => row.style.display !== "none").map((row) => row.dataset.codbiBranchFunc);
    expect(visible).toEqual(["", "Html.SetAttribute"]);

    const radio = picker.querySelector<HTMLInputElement>('input[value="Html.SetAttribute"]') as HTMLInputElement;
    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));
    expect(selected).toEqual(["Html.SetAttribute"]);

    picker.remove();
  });
});

describe("ElementFunctionalityConfigEditor branch editors", () => {
  it("renders a branch section per declared branch, without offering the conditional itself", () => {
    seedConditional();
    TestState.language = "en";
    const properties: Record<string, unknown> = { "codbi-prop-element-funcs": "OnLoad.Conditional" };

    const rootEl = buildEditor("XTextField", properties);
    const sections = Array.from(rootEl.querySelectorAll<HTMLElement>(".codbi-func-config__branch"));

    expect(sections.length).toBe(2);
    expect(sections.map((section) => section.querySelector(".codbi-func-config__branch-header")?.textContent)).toEqual([
      "TRUE branch",
      "FALSE branch",
    ]);
    // Each branch renders the SAME picker the regular functionality listing uses (filter box + rows).
    expect(sections[0].querySelector(".codbi-func-config__filter")).not.toBeNull();
    const values = branchRadioValues(rootEl);
    expect(values).toContain("Html.SetAttribute");
    expect(values).not.toContain("OnLoad.Conditional");
  });

  it("stores the chosen branch functionality as data-cb-_T_func and renders its parameter rows", () => {
    seedConditional();
    TestState.language = "en";
    const properties: Record<string, unknown> = { "codbi-prop-element-funcs": "OnLoad.Conditional" };

    const rootEl = buildEditor("XTextField", properties);
    pickBranchFunctionality(rootEl, "Html.SetAttribute");

    expect(attrValue(properties, "data-cb-_T_func")).toBe("Html.SetAttribute");
    // The regular functionality tag is NOT touched by a branch selection (only a regular parameter
    // write — or a functionality toggle — asserts `data-cb-func`).
    expect(attrValue(properties, "data-cb-func")).toBeUndefined();

    // The branch now renders the picked functionality's parameters as `_T_`-prefixed rows.
    const branch = branchSection(rootEl);
    expect(branch.querySelector<HTMLInputElement>('input[value="Html.SetAttribute"]')?.checked).toBe(true);
    const labels = Array.from(branch.querySelectorAll(".codbi-func-config__param-label")).map(
      (label) => label.textContent,
    );
    expect(labels).toEqual(["Name", "ToSet"]);
    expect(branch.querySelector(".codbi-func-config__branch-hint")).toBeNull();
  });

  it("writes a branch parameter as data-cb-_T_<param> and leaves data-cb-func alone", () => {
    seedConditional();
    TestState.language = "en";
    const properties: Record<string, unknown> = { "codbi-prop-element-funcs": "OnLoad.Conditional" };

    const rootEl = buildEditor("XTextField", properties);
    pickBranchFunctionality(rootEl, "Html.SetAttribute");

    const branch = branchSection(rootEl);
    const input = branch.querySelector<HTMLInputElement>(".codbi-func-config__param-row input");
    expect(input).not.toBeNull();
    input!.value = "style";
    input!.dispatchEvent(new Event("change"));

    expect(attrValue(properties, "data-cb-_T_Name")).toBe("style");
    // The selection is stored lowercased (see `parseCsv`) and the branch write did not disturb it.
    expect(attrValue(properties, "data-cb-func")).toBe("onload.conditional");
  });

  it("prunes the former branch functionality's parameters when the branch is switched", () => {
    seedConditional();
    TestState.language = "en";
    const properties: Record<string, unknown> = {
      "codbi-prop-element-funcs": "OnLoad.Conditional",
      attributes: [
        { text: "data-cb-_T_func", value: "Html.SetAttribute" },
        { text: "data-cb-_T_Name", value: "style" },
        { text: "data-cb-_T_ToSet", value: "display:block" },
      ],
    };

    const rootEl = buildEditor("XTextField", properties);
    // The picker reflects the stored branch functionality.
    expect(branchSection(rootEl).querySelector<HTMLInputElement>('input[value="Html.SetAttribute"]')?.checked).toBe(
      true,
    );

    // "Other.Func" declares only `Name`, so `ToSet` must disappear while `Name` is kept.
    pickBranchFunctionality(rootEl, "Other.Func");

    expect(attrValue(properties, "data-cb-_T_func")).toBe("Other.Func");
    expect(attrValue(properties, "data-cb-_T_ToSet")).toBeUndefined();
    expect(attrValue(properties, "data-cb-_T_Name")).toBe("style");
  });

  it("removes data-cb-_T_func when the branch is cleared", () => {
    seedConditional();
    TestState.language = "en";
    const properties: Record<string, unknown> = {
      "codbi-prop-element-funcs": "OnLoad.Conditional",
      attributes: [
        { text: "data-cb-_T_func", value: "Html.SetAttribute" },
        { text: "data-cb-_T_Name", value: "style" },
      ],
    };

    const rootEl = buildEditor("XTextField", properties);
    pickBranchFunctionality(rootEl, "");

    expect(attrValue(properties, "data-cb-_T_func")).toBeUndefined();
    expect(attrValue(properties, "data-cb-_T_Name")).toBeUndefined();
    // With no branch functionality chosen the hint is shown instead of parameter rows.
    expect(branchSection(rootEl).querySelector(".codbi-func-config__branch-hint")).not.toBeNull();
  });

  it("filters a branch's rows and keeps the filter text across the re-render of a selection", () => {
    seedConditional();
    TestState.language = "en";
    const properties: Record<string, unknown> = { "codbi-prop-element-funcs": "OnLoad.Conditional" };

    const rootEl = buildEditor("XTextField", properties);
    const filter = branchSection(rootEl).querySelector<HTMLInputElement>(".codbi-func-config__filter");
    expect(filter).not.toBeNull();
    filter!.value = "other";
    filter!.dispatchEvent(new Event("input", { bubbles: true }));

    const visible = () =>
      Array.from(branchSection(rootEl).querySelectorAll<HTMLElement>(".codbi-func-config__option"))
        .filter((row) => row.style.display !== "none")
        .map((row) => row.dataset.codbiBranchFunc);
    expect(visible()).toEqual(["", "Other.Func"]);

    // Selecting a functionality re-renders the whole parameter table — the filter must survive it.
    pickBranchFunctionality(rootEl, "Html.SetAttribute");
    const restored = branchSection(rootEl).querySelector<HTMLInputElement>(".codbi-func-config__filter");
    expect(restored?.value).toBe("other");
    expect(visible()).toEqual(["", "Other.Func"]);
  });
});
