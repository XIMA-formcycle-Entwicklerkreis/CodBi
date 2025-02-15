// Tests for i18n.ts

import { afterEach, describe, expect, it } from "@jest/globals";

import { i18n } from "../src/js/i18n.js";

import { resetTestState, TestState } from "./test-state.js";

afterEach(() => resetTestState());

describe("i18n", () => {
  it("return the localized message when the current language is English", () => {
    TestState.language = "en";
    expect(i18n("plugin.form_designer_resource.name")).toBe("Form designer resource");
  });
  it("return the localized message when the current language is German", () => {
    TestState.language = "de";
    expect(i18n("plugin.form_designer_resource.name")).toBe("Formular-Designer-Ressource");
  });
});
