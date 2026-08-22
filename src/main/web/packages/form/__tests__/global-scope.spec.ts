// Tests for code-library.ts

import { afterEach, describe, expect, jest, it } from "@jest/globals";

import { resetTestState } from "./test-state.js";
import { createCodbiGlobal } from "../src/js/global-scope.js";

// The code in code-library is for demonstration purposes only
// This illustrates how to write tests with jsdom and jest

//afterEach(() => resetTestState());

describe("createCodbiGlobal", () => {
  it("creates a new codbi instance", () => {
    const codbiScript = document.createElement("script");
    codbiScript.src = "https://example.com/codbi.js";
    document.head.appendChild(codbiScript);
    const codbi1 = createCodbiGlobal();
    const codbi2 = createCodbiGlobal();
    expect(codbi1).toBeDefined();
    expect(codbi2).toBeDefined();
    expect(codbi1).not.toBe(codbi2);
  });
});

// -- Formcycle [%fieldName%] placeholder resolution in data-cb-* parameters ----------------------
// CodBi now resolves [%XXX%] placeholders to the referenced field's value BEFORE element
// placeholders/functionalities are invoked (see global-scope.ts resolveFormcyclePlaceholders).

type CodBiWithPlaceholderResolver = {
  resolveFormcyclePlaceholders(value: string): string;
};

type CodBiWithResolveEp = {
  resolveEP(config: { [key: string]: unknown }): Promise<{ [key: string]: unknown }>;
};

describe("CodBi Formcycle [%fieldName%] placeholder resolution", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  const codbi = (): CodBiWithPlaceholderResolver => createCodbiGlobal() as unknown as CodBiWithPlaceholderResolver;

  it("replaces [%fieldName%] with the referenced field's current value (data-name)", () => {
    document.body.innerHTML = `<input data-name="tfVorname" name="tfVorname" />`;
    (document.querySelector("input") as HTMLInputElement).value = "Anna";
    expect(codbi().resolveFormcyclePlaceholders("Hallo [%tfVorname%]!")).toBe("Hallo Anna!");
  });

  it("falls back to the native name attribute", () => {
    document.body.innerHTML = `<input name="tfNachname" />`;
    (document.querySelector("input") as HTMLInputElement).value = "Callari";
    expect(codbi().resolveFormcyclePlaceholders("[%tfNachname%]")).toBe("Callari");
  });

  it("reads a select's selected value", () => {
    document.body.innerHTML =
      `<select data-name="selStadt"><option value="Ansbach">Ansbach</option>` +
      `<option value="Nürnberg" selected>Nürnberg</option></select>`;
    expect(codbi().resolveFormcyclePlaceholders("[%selStadt%]")).toBe("Nürnberg");
  });

  it("falls back to text content for non-control elements", () => {
    document.body.innerHTML = `<span data-name="spSumme">123</span>`;
    expect(codbi().resolveFormcyclePlaceholders("Summe: [%spSumme%]")).toBe("Summe: 123");
  });

  it("leaves placeholders of unknown fields literal", () => {
    document.body.innerHTML = "";
    expect(codbi().resolveFormcyclePlaceholders("[%tfGibtEsNicht%]")).toBe("[%tfGibtEsNicht%]");
  });

  it("resolves multiple placeholders and passes through plain strings", () => {
    document.body.innerHTML = `<input data-name="tfA" /><input data-name="tfB" />`;
    (document.querySelector('[data-name="tfA"]') as HTMLInputElement).value = "1";
    (document.querySelector('[data-name="tfB"]') as HTMLInputElement).value = "2";
    expect(codbi().resolveFormcyclePlaceholders("[%tfA%] + [%tfB%] = 3")).toBe("1 + 2 = 3");
    expect(codbi().resolveFormcyclePlaceholders("kein placeholder")).toBe("kein placeholder");
  });

  it("resolves placeholders in plain data-cb-* values before functionality invocation (via resolveEP)", async () => {
    const instance = createCodbiGlobal() as unknown as CodBiWithResolveEp;
    document.body.innerHTML = `<input data-name="tfVorname" />`;
    (document.querySelector("input") as HTMLInputElement).value = "Anna";
    const resolved = await instance.resolveEP({ toset: "[%tfVorname%]" });
    expect(resolved.toset).toBe("Anna");
  });
});
