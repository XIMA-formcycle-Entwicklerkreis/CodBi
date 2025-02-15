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
    expect(TestState.customFormProperties).toHaveLength(2);
    expect(TestState.customFormProperties[0]?.[0].editor).toBe("CheckboxEditor");
    expect(TestState.customFormProperties[0]?.[0].cat).toBe("codbi-cat-main");
    expect(TestState.customFormProperties[0]?.[0].property).toBe("codbi-prop-enable");
    expect(TestState.customFormProperties[0]?.[0].label).toBe("CodBi enabled");
  });
});
