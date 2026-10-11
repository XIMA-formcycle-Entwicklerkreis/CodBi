// Tests for CodbiDocs.ts

import { afterEach, describe, expect, it } from "@jest/globals";

import { codbiDocsUrl } from "../src/js/CodbiDocs.js";

import { resetTestState, TestState } from "./test-state.js";

/** Minimal `window.CodbiPluginData` shape used by the tests. */
interface IPluginDataWindow {
  CodbiPluginData?: { docsAPI?: Record<string, string> };
}

afterEach(() => {
  resetTestState();
  delete (window as unknown as IPluginDataWindow).CodbiPluginData;
});

describe("codbiDocsUrl", () => {
  it("honours the administrator's per-language docs redirect (docsAPI)", () => {
    TestState.language = "de";
    (window as unknown as IPluginDataWindow).CodbiPluginData = {
      docsAPI: { en: "https://docs.example/en/", de: "https://docs.example/de/custom/" },
    };
    expect(codbiDocsUrl()).toBe("https://docs.example/de/custom/");
  });

  it("falls back to the English docsAPI entry for a language without a redirect", () => {
    TestState.language = "fr";
    (window as unknown as IPluginDataWindow).CodbiPluginData = {
      docsAPI: { en: "https://docs.example/en/", de: "https://docs.example/de/" },
    };
    expect(codbiDocsUrl()).toBe("https://docs.example/en/");
  });

  it("falls back to the configured base URL's English section when no docsAPI exists", () => {
    TestState.language = "en";
    expect(codbiDocsUrl()).toBe("https://xima-formcycle-entwicklerkreis.github.io/CodBi/form/");
  });

  it("falls back to the configured base URL's German section when no docsAPI exists", () => {
    TestState.language = "de";
    expect(codbiDocsUrl()).toBe("https://xima-formcycle-entwicklerkreis.github.io/CodBi/form/de/");
  });
});
