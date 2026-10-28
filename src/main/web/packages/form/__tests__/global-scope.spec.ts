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

// -- CodBi <[field reference]> placeholder resolution in EVERY functionality parameter -----------
// The notation originally handled only by AI.LLAMA.STANDARD.TXTVERIFY is now resolved for every
// data-cb-* parameter at functionality initialization (see global-scope.ts resolveFieldPlaceholders).

type CodBiWithFieldResolver = {
  resolveFieldPlaceholders(value: string, reference?: Element | null): string;
  resolveEP(config: { [key: string]: unknown }, reference?: Element | null): Promise<{ [key: string]: unknown }>;
  extractCBAttributes(toExtractFrom: Element): { [key: string]: unknown };
  parseAttributeValue(value: string): unknown;
};

describe("CodBi <[field reference]> placeholder resolution", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  const codbi = (): CodBiWithFieldResolver => createCodbiGlobal() as unknown as CodBiWithFieldResolver;

  it("resolves a CSS class reference", () => {
    document.body.innerHTML = `<input class="tfVorname" />`;
    (document.querySelector("input") as HTMLInputElement).value = "Anna";
    expect(codbi().resolveFieldPlaceholders("Hallo <[.tfVorname]>!")).toBe("Hallo Anna!");
  });

  it("resolves a bare class name like the AI functionalities do", () => {
    document.body.innerHTML = `<input class="tfVorname" />`;
    (document.querySelector("input") as HTMLInputElement).value = "Anna";
    expect(codbi().resolveFieldPlaceholders("<[tfVorname]>")).toBe("Anna");
  });

  it("falls back to data-name and to a raw selector", () => {
    document.body.innerHTML = `<input data-name="tfName" /><input id="tfId" />`;
    (document.querySelector('[data-name="tfName"]') as HTMLInputElement).value = "Name";
    (document.querySelector("#tfId") as HTMLInputElement).value = "Id";
    expect(codbi().resolveFieldPlaceholders("<[tfName]>")).toBe("Name");
    expect(codbi().resolveFieldPlaceholders("<[#tfId]>")).toBe("Id");
  });

  it("delegates from a wrapper element to its contained control", () => {
    document.body.innerHTML = `<div class="wrapper"><input value="inner" /></div>`;
    expect(codbi().resolveFieldPlaceholders("<[.wrapper]>")).toBe("inner");
  });

  it("scopes a reference to the nearest XContainer before the document", () => {
    document.body.innerHTML =
      `<div class="XContainer"><input class="tfName" value="first" /></div>` +
      `<div class="XContainer"><input class="tfName" value="second" /><input class="origin" /></div>`;
    const origin = document.querySelectorAll(".origin")[0];
    expect(codbi().resolveFieldPlaceholders("<[.tfName]>", origin)).toBe("second");
  });

  it("resolves <[this]> against the supplied functionality element", async () => {
    document.body.innerHTML = `<input class="tfName" value="own" />`;
    const origin = document.querySelector(".tfName") as HTMLInputElement;
    const resolved = await codbi().resolveEP({ question: "<[this]>" }, origin);
    expect(resolved.question).toBe("own");
  });

  it("keeps <[this]> when the field is still empty", async () => {
    document.body.innerHTML = `<input class="tfName" />`;
    const origin = document.querySelector(".tfName");
    const resolved = await codbi().resolveEP({ question: "<[this]>" }, origin);
    expect(resolved.question).toBe("<[this]>");
  });

  it("leaves unknown references literal", () => {
    document.body.innerHTML = "";
    expect(codbi().resolveFieldPlaceholders("<[.missing]>")).toBe("<[.missing]>");
  });

  it("unescapes a literal °<[ instead of resolving it", () => {
    document.body.innerHTML = `<input class="tfName" value="Anna" />`;
    expect(codbi().resolveFieldPlaceholders("°<[.tfName]>")).toBe("<[.tfName]>");
  });

  it("resolves [%field%] and <[field]> in ONE pass without re-scanning inserted values", async () => {
    document.body.innerHTML = `<input class="tfA" data-name="tfA" /><input class="tfB" data-name="tfB" />`;
    (document.querySelector(".tfA") as HTMLInputElement).value = "x [%tfB%] <[.tfB]>";
    (document.querySelector(".tfB") as HTMLInputElement).value = "B";
    const resolved = await codbi().resolveEP({ param: "[%tfA%] + <[.tfA]>" });
    expect(resolved.param).toBe("x [%tfB%] <[.tfB]> + x [%tfB%] <[.tfB]>");
  });

  it("does not split a data-cb-* value on commas inside <[...]>", () => {
    expect(codbi().parseAttributeValue("<[.a, .b]>")).toBe("<[.a, .b]>");
    expect(codbi().parseAttributeValue("<[.a]>, <[.b]>")).toEqual(["<[.a]>", "<[.b]>"]);
  });

  it("resolves a DOM property path on a bare name", () => {
    document.body.innerHTML = `<div class="tfRich"><b>Hallo</b></div>`;
    expect(codbi().resolveFieldPlaceholders("<[tfRich.innerHTML]>")).toBe("<b>Hallo</b>");
  });

  it("resolves a JSON path of a field's value", () => {
    document.body.innerHTML = `<input class="tfJson" value='{"total":42,"items":[{"name":"A"}]}' />`;
    expect(codbi().resolveFieldPlaceholders("<[tfJson.total]>")).toBe("42");
    expect(codbi().resolveFieldPlaceholders("<[tfJson::items[0].name]>")).toBe("A");
    expect(codbi().resolveFieldPlaceholders("<[tfJson::items]>")).toBe('[{"name":"A"}]');
  });

  it("resolves <[this::value]> against the functionality element", async () => {
    document.body.innerHTML = `<input class="tfName" value="own" />`;
    const origin = document.querySelector(".tfName") as HTMLInputElement;
    const resolved = await codbi().resolveEP({ question: "<[this::value]>" }, origin);
    expect(resolved.question).toBe("own");
  });

  it("keeps an unknown path literal and never traverses the prototype chain", () => {
    document.body.innerHTML = `<input class="tfJson" value='{"total":42}' />`;
    expect(codbi().resolveFieldPlaceholders("<[tfJson.missing]>")).toBe("<[tfJson.missing]>");
    expect(codbi().resolveFieldPlaceholders("<[tfJson::__proto__]>")).toBe("<[tfJson::__proto__]>");
  });

  it("still treats a dotted selector as a selector (the shorthand needs a bare name)", () => {
    document.body.innerHTML = `<div class="tfJson"><span class="innerHTML">nested</span></div>`;
    expect(codbi().resolveFieldPlaceholders("<[.tfJson .innerHTML]>")).toBe("nested");
    expect(codbi().resolveFieldPlaceholders("<[.tfJson::innerHTML]>")).toContain('class="innerHTML"');
  });

  it("never mutates data-cb-* attributes, so late resolvers still see the raw tokens", async () => {
    document.body.innerHTML =
      `<div class="XContainer"><input class="tfPrefix" value="P" />` +
      `<input id="origin" data-cb-pattern="<[.tfPrefix]>-\\d+" /></div>`;
    const origin = document.getElementById("origin") as HTMLElement;
    const instance = codbi();
    const resolved = await instance.resolveEP(instance.extractCBAttributes(origin), origin);

    // The init-time parameter is resolved…
    expect(resolved.pattern).toBe("P-\\d+");
    // …while the attribute keeps the raw token for AI.OCR's live resolution on file-change.
    expect(origin.getAttribute("data-cb-pattern")).toBe("<[.tfPrefix]>-\\d+");
  });
});
