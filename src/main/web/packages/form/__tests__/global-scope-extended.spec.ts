import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";

import { createCodbiGlobal, CodBiError, stringToDate } from "../src/js/global-scope.js";

describe("stringToDate", () => {
  it("parses DD.MM.YYYY format (default)", () => {
    const result = stringToDate("15.06.2024");
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(15);
    expect(result!.getMonth()).toBe(5); // June (0-indexed)
    expect(result!.getFullYear()).toBe(2024);
  });

  it("parses DD-MM-YYYY format", () => {
    const result = stringToDate("25-12-2023", "dd-mm-yyyy");
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(25);
    expect(result!.getMonth()).toBe(11);
    expect(result!.getFullYear()).toBe(2023);
  });

  it("parses YYYY/MM/DD format", () => {
    const result = stringToDate("2024/03/01", "yyyy/mm/dd");
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(1);
    expect(result!.getMonth()).toBe(2); // March
    expect(result!.getFullYear()).toBe(2024);
  });

  it("parses MM/DD/YYYY format", () => {
    const result = stringToDate("12/25/2024", "mm/dd/yyyy");
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(25);
    expect(result!.getMonth()).toBe(11);
    expect(result!.getFullYear()).toBe(2024);
  });

  it("returns null when input has no digits", () => {
    const result = stringToDate("no-digits-here", "dd-mm-yyyy");
    expect(result).toBeNull();
  });

  it("is case-insensitive for format string", () => {
    const result = stringToDate("01.06.2024", "DD.MM.YYYY");
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(1);
    expect(result!.getMonth()).toBe(5);
    expect(result!.getFullYear()).toBe(2024);
  });

  it("handles single-digit day and month", () => {
    const result = stringToDate("1.2.2024", "dd.mm.yyyy");
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(1);
    expect(result!.getMonth()).toBe(1); // February
    expect(result!.getFullYear()).toBe(2024);
  });
});

describe("CodBiError", () => {
  it("is an instance of Error", () => {
    const error = new CodBiError("test error");
    expect(error).toBeInstanceOf(Error);
  });

  it("contains the error message", () => {
    const error = new CodBiError("something went wrong");
    expect(error.message).toBe("something went wrong");
  });

  it("handles undefined message", () => {
    const error = new CodBiError();
    expect(error.message).toBe("undefined");
  });
});

describe("createCodbiGlobal", () => {
  beforeEach(() => {
    const codbiScript = document.createElement("script");
    codbiScript.src = "https://example.com/codbi.js";
    document.head.appendChild(codbiScript);
  });

  it("creates a new CodBi instance", () => {
    const codbi = createCodbiGlobal();
    expect(codbi).toBeDefined();
  });

  it("creates unique instances each time", () => {
    const codbi1 = createCodbiGlobal();
    const codbi2 = createCodbiGlobal();
    expect(codbi1).not.toBe(codbi2);
  });
});

describe("CodBi.registerEP", () => {
  let codbi: ReturnType<typeof createCodbiGlobal>;

  beforeEach(() => {
    const codbiScript = document.createElement("script");
    codbiScript.src = "https://example.com/codbi.js";
    document.head.appendChild(codbiScript);
    codbi = createCodbiGlobal();
  });

  it("registers an EP and returns true", () => {
    const result = codbi.registerEP("Test.EP", (params) => params);
    expect(result).toBe(true);
  });

  it("prevents duplicate EP registration", () => {
    codbi.registerEP("Dupe.EP", (params) => params);
    const result = codbi.registerEP("Dupe.EP", (params) => params);
    expect(result).toBe(false);
  });

  it("normalizes EP names to lowercase", () => {
    codbi.registerEP("MixedCase.EP", (params) => params);
    const result = codbi.registerEP("mixedcase.ep", (params) => params);
    expect(result).toBe(false);
  });
});

describe("CodBi.registerFunctionality", () => {
  let codbi: ReturnType<typeof createCodbiGlobal>;

  beforeEach(() => {
    const codbiScript = document.createElement("script");
    codbiScript.src = "https://example.com/codbi.js";
    document.head.appendChild(codbiScript);
    codbi = createCodbiGlobal();
  });

  it("registers a functionality and returns true", () => {
    const result = codbi.registerFunctionality("Test.Func", () => {});
    expect(result).toBe(true);
  });

  it("prevents duplicate functionality registration", () => {
    codbi.registerFunctionality("Dupe.Func", () => {});
    const result = codbi.registerFunctionality("Dupe.Func", () => {});
    expect(result).toBe(false);
  });

  it("normalizes functionality names to lowercase", () => {
    codbi.registerFunctionality("MyFunc", () => {});
    const result = codbi.registerFunctionality("myfunc", () => {});
    expect(result).toBe(false);
  });
});

describe("CodBi.loadConfig", () => {
  let codbi: ReturnType<typeof createCodbiGlobal>;

  beforeEach(() => {
    const codbiScript = document.createElement("script");
    codbiScript.src = "https://example.com/codbi.js";
    document.head.appendChild(codbiScript);
    codbi = createCodbiGlobal();
    (window as unknown as { codbi: unknown }).codbi = codbi;
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("applies data-cb-* attributes to matching elements", async () => {
    const el = document.createElement("div");
    el.className = "target-el";
    document.body.appendChild(el);

    codbi.registerFunctionality("test.func", () => {});

    await codbi.loadConfig({
      targets: ".target-el",
      FUNC: "Test.Func",
      CustomParam: "value123",
    } as { targets: string });

    expect(el.getAttribute("data-cb-func")).toContain("Test.Func");
    expect(el.getAttribute("data-cb-customparam")).toBe("value123");
  });

  it("applies attributes to multiple matching elements", async () => {
    const el1 = document.createElement("div");
    el1.className = "multi-target";
    const el2 = document.createElement("div");
    el2.className = "multi-target";
    document.body.appendChild(el1);
    document.body.appendChild(el2);

    codbi.registerFunctionality("multi.func", () => {});

    await codbi.loadConfig({
      targets: ".multi-target",
      FUNC: "Multi.Func",
    } as { targets: string });

    expect(el1.getAttribute("data-cb-func")).toContain("Multi.Func");
    expect(el2.getAttribute("data-cb-func")).toContain("Multi.Func");
  });

  it("does not overwrite existing data-cb-* attributes", async () => {
    const el = document.createElement("div");
    el.className = "preserve-target";
    el.setAttribute("data-cb-customparam", "original");
    document.body.appendChild(el);

    codbi.registerFunctionality("preserve.func", () => {});

    await codbi.loadConfig({
      targets: ".preserve-target",
      FUNC: "Preserve.Func",
      CustomParam: "overridden",
    } as { targets: string });

    expect(el.getAttribute("data-cb-customparam")).toBe("original");
  });

  it("does not apply the same config twice", async () => {
    const el = document.createElement("div");
    el.className = "once-target";
    document.body.appendChild(el);

    codbi.registerFunctionality("once.func", () => {});

    await codbi.loadConfig({
      targets: ".once-target",
      FUNC: "Once.Func",
    } as { targets: string });

    await codbi.loadConfig({
      targets: ".once-target",
      FUNC: "Once.Func",
    } as { targets: string });

    // Should contain only one instance of the FUNC
    const funcAttr = el.getAttribute("data-cb-func") || "";
    const occurrences = funcAttr.split("Once.Func").length - 1;
    expect(occurrences).toBe(1);
  });
});
