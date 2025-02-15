// Tests for register-custom-form-categories.ts

import { afterEach, describe, expect, it } from "@jest/globals";

import { registerCustomFormCategories } from "../src/js/register-custom-form-categories.js";

import { resetTestState, TestState } from "./test-state.js";

afterEach(() => resetTestState());

describe("registerCustomFormProperties", () => {
  it("registers all form properties for the code library", () => {
    TestState.customFormCategories = [];
    TestState.language = "en";
    registerCustomFormCategories();
    expect(TestState.customFormCategories).toHaveLength(1);
    expect(TestState.customFormCategories[0]?.[0].id).toBe("codbi-cat-main");
    expect(TestState.customFormCategories[0]?.[0].label).toBe("CodBi");
  });
});
