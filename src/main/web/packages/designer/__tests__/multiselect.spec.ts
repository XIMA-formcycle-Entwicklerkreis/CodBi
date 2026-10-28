// Regression tests for the form-level Standard Configurations treeview editor (MultiSelect).
//
// The logic under test is `_onListingChange` (the checkbox toggle handler). When a user turns a
// (holistic) standard configuration OFF in the tree, the persisted CSV must lose that entry AND the
// internally tracked value (`_currentValue`) must be kept in sync. Otherwise a later panel re-render
// (`populateStandards`, which FORMCYCLE triggers on panel rebuilds) restores the value it tracked
// BEFORE the change and snaps the configuration the user just turned OFF back ON.

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Constants } from "codbi-common";

// `MultiSelect.ts` imports `notifyFormPreviewChanged` from CodbiElementMarkers, which pulls in a lot
// of designer-side machinery (EPBuilder, MirrorSelect, badge painting, MutationObservers ...) that is
// irrelevant here. Stub the whole module so the editor under test loads in isolation.
jest.mock("../src/js/CodbiElementMarkers.js", () => ({
  notifyFormPreviewChanged: jest.fn(),
}));

import { Callbacks } from "@de-xima/fc-form-designer";

import { MultiSelect, MultiSelectType } from "../src/js/MultiSelect.js";
import type { IMultiSelectDescriptor } from "../src/js/MultiSelect.js";

import { resetTestState } from "./test-state.js";

const STANDARDS_PROPERTY = String(Constants["designer.property.standards"]);

/** Install the plugin data the designer normally publishes. */
function setPluginData(data: unknown): void {
  (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = data;
}

/** Install a `set-property` spy on the mocked (empty) Callbacks object. */
function installSetPropertySpy(): jest.MockedFunction<(property: string, value: string, editor: unknown) => void> {
  const fire = jest.fn() as unknown as (property: string, value: string, editor: unknown) => void;
  (Callbacks as Record<string, unknown>)["set-property"] = { fire };
  return fire as jest.MockedFunction<(property: string, value: string, editor: unknown) => void>;
}

/** Find the rendered checkbox belonging to one standard-configuration id. */
function checkboxFor(element: HTMLElement, id: string): HTMLInputElement | undefined {
  return Array.from(element.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')).find(
    (input) => input.value === id,
  );
}

describe("MultiSelect standard-configuration tree", () => {
  const HOLISTIC = "Holistic.CSS.Standard";

  beforeEach(() => {
    resetTestState();
    setPluginData({
      fileListing: ["Holistic.CSS.Standard.js", "Media.Input.js"],
      detStandards: { [HOLISTIC]: { Active: true }, "Media.Input": { Active: false } },
      pendingStandards: undefined,
    });
  });

  afterEach(() => {
    delete (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData;
    sessionStorage.removeItem("codbi-pending-standards");
    (Callbacks as Record<string, unknown>)["set-property"] = undefined;
  });

  function buildEditor(): {
    editor: MultiSelect;
    element: HTMLElement;
    setPropertySpy: ReturnType<typeof installSetPropertySpy>;
  } {
    const setPropertySpy = installSetPropertySpy();
    const editor = new MultiSelect({
      property: STANDARDS_PROPERTY,
      designer: {},
    } as unknown as IMultiSelectDescriptor);
    const element = editor.getElement()[0] as HTMLElement;
    return { editor, element, setPropertySpy };
  }

  function mountToggleOff(element: HTMLElement): HTMLInputElement {
    // The editor's tree is a detached element; attach it so the bubbling change event reaches
    // the editor's own `change` listener just as it would while the panel is mounted.
    document.body.appendChild(element);
    const checkbox = checkboxFor(element, HOLISTIC)!;
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    return checkbox;
  }

  it("persists turning OFF a holistic standard configuration through set-property", () => {
    const { editor, element, setPropertySpy } = buildEditor();

    // Start with the holistic config activated.
    editor.setValue(HOLISTIC);
    expect(checkboxFor(element, HOLISTIC)!.checked).toBe(true);

    mountToggleOff(element);

    // The toggle must be persisted through set-property with the config REMOVED from the CSV.
    expect(setPropertySpy).toHaveBeenCalledWith(STANDARDS_PROPERTY, "", editor);
    expect(editor.getValue()).toBe("");
  });

  it("reports the holistic standard configuration as inactive in the plugin metadata after toggling off", () => {
    const { editor, element } = buildEditor();
    editor.setValue(HOLISTIC);
    expect(
      (window as unknown as { CodbiPluginData: { detStandards: Record<string, { Active?: boolean }> } }).CodbiPluginData
        .detStandards[HOLISTIC].Active,
    ).toBe(true);

    mountToggleOff(element);

    expect(
      (window as unknown as { CodbiPluginData: { detStandards: Record<string, { Active?: boolean }> } }).CodbiPluginData
        .detStandards[HOLISTIC].Active,
    ).toBe(false);
  });

  it("keeps the checkbox off when the config is toggled off and the panel is re-rendered (regression)", () => {
    const { editor, element } = buildEditor();
    editor.setValue(HOLISTIC);

    // Turn it OFF exactly as a user would, then trigger the panel re-render that FORMCYCLE performs
    // (populateStandards → rebuilds the tree from the internally tracked value).
    mountToggleOff(element);
    window.CodbiPluginData.populateStandards();

    // Regression guard: before the fix, `_currentValue` stayed stale (the pre-toggle value), so this
    // re-render re-checked the config the user had just turned OFF.
    expect(checkboxFor(element, HOLISTIC)!.checked).toBe(false);
    expect(editor.getValue()).toBe("");
  });
});
