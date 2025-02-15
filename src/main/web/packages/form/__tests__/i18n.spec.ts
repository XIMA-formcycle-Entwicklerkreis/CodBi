// Tests for i18n.ts

import { afterEach, describe, expect, it } from "@jest/globals";

import { i18n } from "../src/js/i18n.js";

import { DefaultXfcMetaData, resetTestState, TestState } from "./test-state.js";

afterEach(() => resetTestState());

describe("i18n", () => {
  it("returns the localized message when the current language is English", () => {
    TestState.xfcMetaData = { ...DefaultXfcMetaData, currentLanguage: "en" };
    TestState.xmFormI18n = { testString: "msg-en" };
    expect(i18n("form.test_string")).toBe("msg-en");
  });
  it("returns the localized message when the current language is German", () => {
    TestState.xfcMetaData = { ...DefaultXfcMetaData, currentLanguage: "de" };
    TestState.xmFormI18n = { testString: "msg-de" };
    expect(i18n("form.test_string")).toBe("msg-de");
  });
});
