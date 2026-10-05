// Tests for register-custom-translations.ts

import { afterEach, describe, expect, it } from "@jest/globals";

import { registerButtonActionTranslations } from "../src/js/register-custom-translations.js";

import { resetTestState, TestState } from "./test-state.js";

afterEach(() => resetTestState());

describe("registerButtonActionTranslations", () => {
  it("registers the navigation action labels so the Aktion column localizes", () => {
    TestState.customTranslations = [];
    registerButtonActionTranslations();
    expect(TestState.customTranslations).toHaveLength(1);
    const map = TestState.customTranslations[0]?.[0] as
      | Record<string, Record<string, Record<string, string>>>
      | undefined;
    expect(map?.de?.ButtonsEditor?.next).toBe("weiter");
    expect(map?.de?.ButtonsEditor?.previous).toBe("zurück");
    expect(map?.en?.ButtonsEditor?.next).toBe("next page");
    expect(map?.default?.ButtonsEditor?.next).toBe("next page");
  });
});
