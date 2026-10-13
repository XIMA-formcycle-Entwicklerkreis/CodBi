// Tests for register-custom-form-properties.ts

import { afterEach, describe, expect, it } from "@jest/globals";

import { registerCustomFormProperties } from "../src/js/register-custom-form-properties.js";

import { resetTestState, TestState } from "./test-state.js";

afterEach(() => resetTestState());

describe("registerCustomFormProperties", () => {
  it("registers all form properties for the code library", () => {
    TestState.customFormProperties = [];
    TestState.language = "en";
    registerCustomFormProperties();
    expect(TestState.customFormProperties).toHaveLength(5);

    expect(TestState.customFormProperties[0]?.[0].editor).toBe("CheckboxEditor");
    expect(TestState.customFormProperties[0]?.[0].cat).toBe("codbi-cat-main");
    expect(TestState.customFormProperties[0]?.[0].property).toBe("codbi-prop-enable");
    expect(TestState.customFormProperties[0]?.[0].label).toBe("CodBi enabled");

    // "Mark CodBi elements in the designer" slider switch (toggled globally with ALT+V).
    expect(TestState.customFormProperties[1]?.[0].editor).toBe(
      "com.github.xima_formcycle_entwicklerkreis.fc.plugin:fc-plugin-codbi:CodbiSwitchEditor",
    );
    expect(TestState.customFormProperties[1]?.[0].cat).toBe("codbi-cat-main");
    expect(TestState.customFormProperties[1]?.[0].property).toBe("codbi-prop-mark-elements");
    expect(TestState.customFormProperties[1]?.[0].label).toBe("Marker");

    // "Preview mode": a preview switch appears on every element carrying `data-cb-func`.
    expect(TestState.customFormProperties[2]?.[0].editor).toBe(
      "com.github.xima_formcycle_entwicklerkreis.fc.plugin:fc-plugin-codbi:CodbiSwitchEditor",
    );
    expect(TestState.customFormProperties[2]?.[0].cat).toBe("codbi-cat-main");
    expect(TestState.customFormProperties[2]?.[0].property).toBe("codbi-prop-preview-elements");
    expect(TestState.customFormProperties[2]?.[0].label).toBe("Preview");

    expect(TestState.customFormProperties[3]?.[0].editor).toBe("SelectEditor");
    expect(TestState.customFormProperties[3]?.[0].cat).toBe("codbi-cat-main");
    expect(TestState.customFormProperties[3]?.[0].property).toBe("codbi-prop-config-template");
    expect(TestState.customFormProperties[3]?.[0].label).toBe("Config template");

    expect(TestState.customFormProperties[4]?.[0].editor).toBe(
      "com.github.xima_formcycle_entwicklerkreis.fc.plugin:fc-plugin-codbi:MultiSelect",
    );
    expect(TestState.customFormProperties[4]?.[0].cat).toBe("codbi-cat-main");
    expect(TestState.customFormProperties[4]?.[0].property).toBe("codbi-prop-standards");
    expect(TestState.customFormProperties[4]?.[0].label).toBe("Standard Configurations");
  });
});
