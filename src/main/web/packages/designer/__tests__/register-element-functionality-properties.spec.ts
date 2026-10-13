// Tests for ElementFunctionalityConfigEditor.ts's registerElementFunctionalityProperties.

import { afterEach, describe, expect, it } from "@jest/globals";

import {
  ELEMENT_FUNCTIONALITY_CATEGORY_ID,
  ELEMENT_FUNCS_NAME_PROPERTY,
  ELEMENT_FUNCS_PROPERTY,
  ElementFunctionalityConfigType,
  registerElementFunctionalityProperties,
} from "../src/js/ElementFunctionalityConfigEditor.js";

import { resetTestState, TestState } from "./test-state.js";

afterEach(() => resetTestState());

describe("registerElementFunctionalityProperties", () => {
  it("registers the per-element CodBi category, editor and funcs property", () => {
    TestState.language = "en";
    registerElementFunctionalityProperties();

    // The existing "CodBi" category is (re)declared so the property lands in that panel.
    expect(TestState.customCategories).toHaveLength(1);
    expect(TestState.customCategories[0]?.[0].id).toBe(ELEMENT_FUNCTIONALITY_CATEGORY_ID);
    expect(TestState.customCategories[0]?.[0].label).toBe("CodBi");

    // The funcs + funcs_name element properties are marked localizable.
    expect(TestState.localizableProperties).toEqual([[ELEMENT_FUNCS_PROPERTY], [ELEMENT_FUNCS_NAME_PROPERTY]]);

    // The composite configurator editor is registered under its stable type id.
    expect(TestState.customEditors).toHaveLength(1);
    expect(TestState.customEditors[0]?.[0]).toBe(ElementFunctionalityConfigType);

    // The property maps the funcs property to the editor, grouped in the CodBi category.
    expect(TestState.customProperties).toHaveLength(1);
    const [desc] = TestState.customProperties[0] ?? [];
    expect(desc?.editor).toBe(ElementFunctionalityConfigType);
    expect(desc?.cat).toBe(ELEMENT_FUNCTIONALITY_CATEGORY_ID);
    expect(desc?.property).toBe(ELEMENT_FUNCS_PROPERTY);
    expect(desc?.label).toBe("Functionalities");
  });
});
