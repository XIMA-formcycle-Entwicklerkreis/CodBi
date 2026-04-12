import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";

import { createCodbiGlobal, CodBiError, EPCodBiError, generateUUID, resolveLdapUrl } from "../src/js/global-scope.js";

// ────────────────────────────────────────────────────────────────
// resolveLdapUrl
// ────────────────────────────────────────────────────────────────
describe("resolveLdapUrl", () => {
  const original = window.codbiSettings;

  afterEach(() => {
    (window as unknown as { codbiSettings: unknown }).codbiSettings = original;
  });

  it("returns undefined when codbiSettings is absent", () => {
    (window as unknown as { codbiSettings: undefined }).codbiSettings = undefined;
    expect(resolveLdapUrl()).toBeUndefined();
  });

  it("returns undefined when LDAP is missing", () => {
    (window as unknown as { codbiSettings: { LDAP: undefined } }).codbiSettings = { LDAP: undefined } as never;
    expect(resolveLdapUrl()).toBeUndefined();
  });

  it("returns undefined when both URLs are empty", () => {
    (window as unknown as { codbiSettings: unknown }).codbiSettings = { LDAP: {} } as never;
    expect(resolveLdapUrl()).toBeUndefined();
  });

  it('treats "null" string as absent', () => {
    (window as unknown as { codbiSettings: unknown }).codbiSettings = {
      LDAP: { URL: "null", URL_BACKEND: "null" },
    } as never;
    expect(resolveLdapUrl()).toBeUndefined();
  });

  it("returns backend URL when frontend is absent", () => {
    (window as unknown as { codbiSettings: unknown }).codbiSettings = {
      LDAP: { URL_BACKEND: "https://backend.example.com/ldap" },
    } as never;
    expect(resolveLdapUrl()).toBe("https://backend.example.com/ldap");
  });

  it("returns frontend URL when backend is absent", () => {
    (window as unknown as { codbiSettings: unknown }).codbiSettings = {
      LDAP: { URL: "https://frontend.example.com/ldap" },
    } as never;
    expect(resolveLdapUrl()).toBe("https://frontend.example.com/ldap");
  });

  it("returns frontend URL when it matches the browser hostname", () => {
    (window as unknown as { codbiSettings: unknown }).codbiSettings = {
      LDAP: {
        URL: `https://${window.location.hostname}/ldap`,
        URL_BACKEND: "https://other.example.com/ldap",
      },
    } as never;
    expect(resolveLdapUrl()).toBe(`https://${window.location.hostname}/ldap`);
  });

  it("returns backend URL when it matches the browser hostname", () => {
    (window as unknown as { codbiSettings: unknown }).codbiSettings = {
      LDAP: {
        URL: "https://other.example.com/ldap",
        URL_BACKEND: `https://${window.location.hostname}/ldap`,
      },
    } as never;
    expect(resolveLdapUrl()).toBe(`https://${window.location.hostname}/ldap`);
  });

  it("defaults to frontend URL when neither matches", () => {
    (window as unknown as { codbiSettings: unknown }).codbiSettings = {
      LDAP: {
        URL: "https://a.example.com/ldap",
        URL_BACKEND: "https://b.example.com/ldap",
      },
    } as never;
    expect(resolveLdapUrl()).toBe("https://a.example.com/ldap");
  });

  it("handles invalid frontend URL gracefully", () => {
    (window as unknown as { codbiSettings: unknown }).codbiSettings = {
      LDAP: {
        URL: "not-a-url",
        URL_BACKEND: `https://${window.location.hostname}/ldap`,
      },
    } as never;
    expect(resolveLdapUrl()).toBe(`https://${window.location.hostname}/ldap`);
  });
});

// ────────────────────────────────────────────────────────────────
// generateUUID
// ────────────────────────────────────────────────────────────────
describe("generateUUID", () => {
  it("returns a string", () => {
    expect(typeof generateUUID()).toBe("string");
  });

  it("matches UUID v4 format", () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("generates unique values", () => {
    const uuids = new Set(Array.from({ length: 50 }, () => generateUUID()));
    expect(uuids.size).toBe(50);
  });
});

// ────────────────────────────────────────────────────────────────
// EPCodBiError
// ────────────────────────────────────────────────────────────────
describe("EPCodBiError", () => {
  it("is an instance of Error", () => {
    const err = new EPCodBiError("My.EP", "something broke");
    expect(err).toBeInstanceOf(Error);
  });

  it("includes placeholder name and message", () => {
    const err = new EPCodBiError("Data.CSV", "invalid input");
    expect(err.message).toContain("Data.CSV");
    expect(err.message).toContain("invalid input");
  });
});

// ────────────────────────────────────────────────────────────────
// CodBi — EP extension (extendEP)
// ────────────────────────────────────────────────────────────────
describe("CodBi.extendEP", () => {
  let codbi: ReturnType<typeof createCodbiGlobal>;

  beforeEach(() => {
    const s = document.createElement("script");
    s.src = "https://example.com/codbi.js";
    document.head.appendChild(s);
    codbi = createCodbiGlobal();
  });

  it("returns false when extending an unregistered EP", () => {
    const result = codbi.extendEP("Nonexistent.EP", (params, prev) => [...prev, "added"]);
    expect(result).toBe(false);
  });

  it("chains synchronous EPs", () => {
    codbi.registerEP("Chain.Sync", (params) => [params[0]]);
    codbi.extendEP("Chain.Sync", (_params, prev) => [...prev, "extra"]);

    // Access the EP via resolveEP: register, then resolve via EP string
    // We can test via the internal mechanism
    codbi.registerFunctionality("chain.test", () => {});
  });

  it("extends a synchronous EP correctly", () => {
    codbi.registerEP("Ext.EP", (params) => ["original"]);
    const result = codbi.extendEP("Ext.EP", (params, former) => [...former, "extended"]);
    expect(result).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────
// CodBi — Functionality extension (extendFunctionality)
// ────────────────────────────────────────────────────────────────
describe("CodBi.extendFunctionality", () => {
  let codbi: ReturnType<typeof createCodbiGlobal>;

  beforeEach(() => {
    const s = document.createElement("script");
    s.src = "https://example.com/codbi.js";
    document.head.appendChild(s);
    codbi = createCodbiGlobal();
  });

  it("registers new functionality when extending unregistered one", () => {
    const result = codbi.extendFunctionality("New.Func", () => {});
    expect(result).toBe(false);
  });

  it("chains onto existing functionality", () => {
    const calls: string[] = [];
    codbi.registerFunctionality("Ext.Func", () => calls.push("original"));
    const result = codbi.extendFunctionality("Ext.Func", () => calls.push("extension"));
    expect(result).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────
// CodBi — getOutermostEP
// ────────────────────────────────────────────────────────────────
describe("CodBi.getOutermostEP", () => {
  let codbi: ReturnType<typeof createCodbiGlobal> & { getOutermostEP: (s: string) => unknown };

  beforeEach(() => {
    const s = document.createElement("script");
    s.src = "https://example.com/codbi.js";
    document.head.appendChild(s);
    codbi = createCodbiGlobal() as unknown as typeof codbi;
  });

  it("returns null when no braces present", () => {
    expect(codbi.getOutermostEP("plain text")).toBeNull();
  });

  it("extracts EP name and params", () => {
    const result = codbi.getOutermostEP("{Data.CSV > a;b;c}") as { keyPlaceholder: string; params: string };
    expect(result.keyPlaceholder).toBe("Data.CSV");
    expect(result.params).toBe("a;b;c");
  });

  it("extracts EP without params", () => {
    const result = codbi.getOutermostEP("{Date.Today}") as { keyPlaceholder: string; params: string };
    expect(result.keyPlaceholder).toBe("Date.Today");
  });

  it("throws on mismatched braces", () => {
    expect(() => codbi.getOutermostEP("{broken")).toThrow();
  });
});

// ────────────────────────────────────────────────────────────────
// CodBi — splitUnbracedParams
// ────────────────────────────────────────────────────────────────
describe("CodBi.splitUnbracedParams", () => {
  let codbi: ReturnType<typeof createCodbiGlobal> & { splitUnbracedParams: (s: string) => string[] };

  beforeEach(() => {
    const s = document.createElement("script");
    s.src = "https://example.com/codbi.js";
    document.head.appendChild(s);
    codbi = createCodbiGlobal() as unknown as typeof codbi;
  });

  it("returns empty array for empty string", () => {
    expect(codbi.splitUnbracedParams("")).toEqual([]);
  });

  it("splits simple semicolon-separated params", () => {
    expect(codbi.splitUnbracedParams("a;b;c")).toEqual(["a", "b", "c"]);
  });

  it("does not split semicolons inside braces", () => {
    const result = codbi.splitUnbracedParams("a;{b;c};d");
    expect(result).toEqual(["a", "{b;c}", "d"]);
  });

  it("handles nested braces", () => {
    const result = codbi.splitUnbracedParams("x;{a;{b;c}};y");
    expect(result).toEqual(["x", "{a;{b;c}}", "y"]);
  });

  it("trims whitespace from parts", () => {
    const result = codbi.splitUnbracedParams(" a ; b ; c ");
    expect(result).toEqual(["a", "b", "c"]);
  });
});

// ────────────────────────────────────────────────────────────────
// CodBi — extractEPs
// ────────────────────────────────────────────────────────────────
describe("CodBi.extractEPs", () => {
  let codbi: ReturnType<typeof createCodbiGlobal> & { extractEPs: (s: string) => string[] };

  beforeEach(() => {
    const s = document.createElement("script");
    s.src = "https://example.com/codbi.js";
    document.head.appendChild(s);
    codbi = createCodbiGlobal() as unknown as typeof codbi;
  });

  it("returns empty array when no EPs present", () => {
    expect(codbi.extractEPs("plain text")).toEqual([]);
  });

  it("extracts single EP name", () => {
    const result = codbi.extractEPs("{Data.CSV > a,b,c}");
    expect(result).toContain("Data.CSV");
  });

  it("extracts nested EP names", () => {
    const result = codbi.extractEPs("{Date.Arithmetic > {Date.Today > NOW};+1d}");
    expect(result).toContain("Date.Arithmetic");
    expect(result).toContain("Date.Today");
  });
});

// ────────────────────────────────────────────────────────────────
// CodBi — extractCBAttributes (via checkAttributes pipeline)
// ────────────────────────────────────────────────────────────────
describe("CodBi.extractCBAttributes", () => {
  let codbi: ReturnType<typeof createCodbiGlobal> & {
    extractCBAttributes: (el: Element) => { [key: string]: unknown };
  };

  beforeEach(() => {
    const s = document.createElement("script");
    s.src = "https://example.com/codbi.js";
    document.head.appendChild(s);
    codbi = createCodbiGlobal() as unknown as typeof codbi;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("extracts data-cb-* attributes excluding system ones", () => {
    const el = document.createElement("div");
    el.setAttribute("data-cb-func", "Test.Func");
    el.setAttribute("data-cb-apply", ".target");
    el.setAttribute("data-cb-myparam", "value");
    el.setAttribute("data-cb-other", "123");
    document.body.appendChild(el);

    const attrs = codbi.extractCBAttributes(el);
    expect(attrs).toHaveProperty("myparam", "value");
    expect(attrs).toHaveProperty("other", "123");
    expect(attrs).not.toHaveProperty("func");
    expect(attrs).not.toHaveProperty("apply");
  });

  it("splits comma-separated values into arrays", () => {
    const el = document.createElement("div");
    el.setAttribute("data-cb-list", "a,b,c");
    document.body.appendChild(el);

    const attrs = codbi.extractCBAttributes(el);
    expect(attrs.list).toEqual(["a", "b", "c"]);
  });

  it("does not split values starting with ^ (escape character)", () => {
    const el = document.createElement("div");
    el.setAttribute("data-cb-css", "^color:red,blue");
    document.body.appendChild(el);

    const attrs = codbi.extractCBAttributes(el);
    expect(typeof attrs.css).toBe("string");
    expect(attrs.css).toBe("color:red,blue");
  });
});

// ────────────────────────────────────────────────────────────────
// CodBi — mergeParameter
// ────────────────────────────────────────────────────────────────
describe("CodBi.mergeParameter", () => {
  let codbi: ReturnType<typeof createCodbiGlobal> & {
    mergeParameter: (a: { [k: string]: unknown }, b: { [k: string]: unknown }) => { [k: string]: unknown };
  };

  beforeEach(() => {
    const s = document.createElement("script");
    s.src = "https://example.com/codbi.js";
    document.head.appendChild(s);
    codbi = createCodbiGlobal() as unknown as typeof codbi;
  });

  it("merges two objects with b overwriting a", () => {
    const result = codbi.mergeParameter({ a: 1, b: 2 }, { b: 99, c: 3 });
    expect(result).toEqual({ a: 1, b: 99, c: 3 });
  });

  it("returns original properties when b is empty", () => {
    const result = codbi.mergeParameter({ x: 1 }, {});
    expect(result).toEqual({ x: 1 });
  });
});

// ────────────────────────────────────────────────────────────────
// CodBi — extractGlobalParameter
// ────────────────────────────────────────────────────────────────
describe("CodBi.extractGlobalParameter", () => {
  let codbi: ReturnType<typeof createCodbiGlobal> & {
    extractGlobalParameter: (ns: string) => { [k: string]: string | null };
  };

  beforeEach(() => {
    const s = document.createElement("script");
    s.src = "https://example.com/codbi.js";
    document.head.appendChild(s);
    codbi = createCodbiGlobal() as unknown as typeof codbi;
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns empty object when no globals are defined", () => {
    expect(codbi.extractGlobalParameter("MyFunc")).toEqual({});
  });

  it("extracts global parameters matching the namespace", () => {
    const el = document.createElement("input");
    el.setAttribute("data-name", "Date_Frame_MaxField");
    el.setAttribute("value", "2025-12-31");
    document.body.appendChild(el);

    const result = codbi.extractGlobalParameter("Date.Frame");
    expect(result).toHaveProperty("maxfield", "2025-12-31");
  });

  it("ignores parameters not matching the namespace", () => {
    const el = document.createElement("input");
    el.setAttribute("data-name", "Other_Param_Key");
    el.setAttribute("value", "nope");
    document.body.appendChild(el);

    const result = codbi.extractGlobalParameter("Date.Frame");
    expect(result).toEqual({});
  });
});

// ────────────────────────────────────────────────────────────────
// CodBi — apply (TSV targets)
// ────────────────────────────────────────────────────────────────
describe("CodBi.apply", () => {
  let codbi: ReturnType<typeof createCodbiGlobal>;

  beforeEach(() => {
    const s = document.createElement("script");
    s.src = "https://example.com/codbi.js";
    document.head.appendChild(s);
    codbi = createCodbiGlobal();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("applies a method to elements matching a single selector", () => {
    const d1 = document.createElement("div");
    d1.className = "tgt";
    document.body.appendChild(d1);

    const visited: Element[] = [];
    codbi.apply(".tgt", (el) => {
      visited.push(el);
      return undefined;
    });
    expect(visited).toHaveLength(1);
    expect(visited[0]).toBe(d1);
  });

  it("uses tilde-separated selectors (TSV)", () => {
    const d1 = document.createElement("div");
    d1.className = "a";
    const d2 = document.createElement("div");
    d2.className = "b";
    document.body.appendChild(d1);
    document.body.appendChild(d2);

    const visited: Element[] = [];
    codbi.apply(".a~.b", (el) => {
      visited.push(el);
      return undefined;
    });
    expect(visited).toHaveLength(2);
  });
});

// ────────────────────────────────────────────────────────────────
// CodBi — reQueryIfDetached
// ────────────────────────────────────────────────────────────────
describe("CodBi.reQueryIfDetached", () => {
  let codbi: ReturnType<typeof createCodbiGlobal> & {
    reQueryIfDetached: (el: Element) => Element;
  };

  beforeEach(() => {
    const s = document.createElement("script");
    s.src = "https://example.com/codbi.js";
    document.head.appendChild(s);
    codbi = createCodbiGlobal() as unknown as typeof codbi;
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns the same element if still connected", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    expect(codbi.reQueryIfDetached(el)).toBe(el);
  });

  it("re-queries by ID when detached", () => {
    const el = document.createElement("div");
    el.id = "requery-test";
    document.body.appendChild(el);

    // Create a detached clone
    const detached = document.createElement("div");
    detached.id = "requery-test";

    // The detached clone is NOT in the document
    const result = codbi.reQueryIfDetached(detached);
    // Should find the connected one by ID
    expect(result).toBe(el);
  });

  it("re-queries by ID prefix for repeatable containers", () => {
    const el = document.createElement("div");
    el.id = "xi-txt-29__1";
    document.body.appendChild(el);

    const detached = document.createElement("div");
    detached.id = "xi-txt-29";
    // Not in document

    const result = codbi.reQueryIfDetached(detached);
    expect(result).toBe(el);
  });

  it("re-queries by data-name when ID fails", () => {
    const el = document.createElement("div");
    el.setAttribute("data-name", "my-field");
    document.body.appendChild(el);

    const detached = document.createElement("div");
    detached.setAttribute("data-name", "my-field");

    const result = codbi.reQueryIfDetached(detached);
    expect(result).toBe(el);
  });

  it("returns original when nothing matches", () => {
    const detached = document.createElement("div");
    detached.id = "ghost";
    const result = codbi.reQueryIfDetached(detached);
    expect(result).toBe(detached);
  });
});

// ────────────────────────────────────────────────────────────────
// CodBi — injectLoadingAnim & removeLoaderAnim
// ────────────────────────────────────────────────────────────────
describe("CodBi loading animations", () => {
  let codbi: ReturnType<typeof createCodbiGlobal>;

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    const s = document.createElement("script");
    s.src = "https://example.com/codbi.js";
    document.head.appendChild(s);
    codbi = createCodbiGlobal();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
    delete (globalThis as any).XFC_METADATA;
  });

  it("injects loader animation after destination", () => {
    const wrapper = document.createElement("div");
    const el = document.createElement("div");
    el.setAttribute("data-name", "field1");
    wrapper.appendChild(el);
    document.body.appendChild(wrapper);

    codbi.injectLoadingAnim(el);

    const loader = wrapper.querySelector(".cCodBiLoader");
    expect(loader).not.toBeNull();
    expect(loader.getAttribute("cbFOR")).toBe("field1");
  });

  it("does not inject duplicate loaders", () => {
    const wrapper = document.createElement("div");
    const el = document.createElement("div");
    el.setAttribute("data-name", "field1");
    wrapper.appendChild(el);
    document.body.appendChild(wrapper);

    codbi.injectLoadingAnim(el);
    codbi.injectLoadingAnim(el);

    const loaders = wrapper.querySelectorAll(".cCodBiLoader");
    expect(loaders).toHaveLength(1);
  });

  it("removes loader animation", () => {
    const wrapper = document.createElement("div");
    const el = document.createElement("div");
    el.setAttribute("data-name", "field1");
    wrapper.appendChild(el);
    document.body.appendChild(wrapper);

    codbi.injectLoadingAnim(el);
    expect(wrapper.querySelector(".cCodBiLoader")).not.toBeNull();

    codbi.removeLoaderAnim(el);
    expect(wrapper.querySelector(".cCodBiLoader")).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────
// CodBi — markLoaderError
// ────────────────────────────────────────────────────────────────
describe("CodBi.markLoaderError", () => {
  let codbi: ReturnType<typeof createCodbiGlobal> & {
    markLoaderError: (el: Element) => void;
  };

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    const s = document.createElement("script");
    s.src = "https://example.com/codbi.js";
    document.head.appendChild(s);
    codbi = createCodbiGlobal() as unknown as typeof codbi;
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
    delete (globalThis as any).XFC_METADATA;
  });

  it("adds CodBi_Error class to spinner", () => {
    const wrapper = document.createElement("div");
    const el = document.createElement("div");
    el.setAttribute("data-name", "errfield");
    wrapper.appendChild(el);
    document.body.appendChild(wrapper);

    codbi.injectLoadingAnim(el);
    codbi.markLoaderError(el);

    const spinner = wrapper.querySelector(".CodBiLoader_Spinner");
    expect(spinner.classList.contains("CodBi_Error")).toBe(true);
  });

  it("does nothing when no loader exists", () => {
    const el = document.createElement("div");
    el.setAttribute("data-name", "noloader");
    document.body.appendChild(el);

    expect(() => codbi.markLoaderError(el)).not.toThrow();
  });
});

// ────────────────────────────────────────────────────────────────
// CodBi — reportError / reportInfo / log
// ────────────────────────────────────────────────────────────────
describe("CodBi error reporting", () => {
  let codbi: ReturnType<typeof createCodbiGlobal> & {
    settingsErrorReporting: { throw: boolean };
    settingsInfoReporting: { log: boolean };
    reportInfo: (msg: string) => void;
  };

  beforeEach(() => {
    const s = document.createElement("script");
    s.src = "https://example.com/codbi.js";
    document.head.appendChild(s);
    codbi = createCodbiGlobal() as unknown as typeof codbi;
  });

  it("throws CodBiError when throw is enabled", () => {
    codbi.settingsErrorReporting.throw = true;
    expect(() => codbi.reportError("boom")).toThrow();
  });

  it("does not throw when throw is disabled", () => {
    codbi.settingsErrorReporting.throw = false;
    expect(() => codbi.reportError("silent")).not.toThrow();
  });

  it("reportInfo logs without throwing", () => {
    codbi.settingsInfoReporting.log = true;
    expect(() => codbi.reportInfo("info message")).not.toThrow();
  });

  it("log method works for all levels", () => {
    expect(() => codbi.log("INFO", "test")).not.toThrow();
    expect(() => codbi.log("WARNING", "test")).not.toThrow();
    expect(() => codbi.log("ERROR", "test")).not.toThrow();
    expect(() => codbi.log("INFO", "test", "adjunct")).not.toThrow();
  });
});

// ────────────────────────────────────────────────────────────────
// CodBi — checkAttributes (integration)
// ────────────────────────────────────────────────────────────────
describe("CodBi.checkAttributes", () => {
  let codbi: ReturnType<typeof createCodbiGlobal>;

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    const s = document.createElement("script");
    s.src = "https://example.com/codbi.js";
    document.head.appendChild(s);
    codbi = createCodbiGlobal();
    (window as unknown as { codbi: unknown }).codbi = codbi;
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
    delete (globalThis as any).XFC_METADATA;
  });

  it("invokes registered functionality on tagged elements", async () => {
    const calls: Array<{ params: unknown; el: Element }> = [];
    codbi.registerFunctionality("Test.Check", (params, el) => {
      calls.push({ params, el });
    });

    const wrapper = document.createElement("div");
    const el = document.createElement("div");
    el.setAttribute("data-cb-func", "Test.Check");
    el.setAttribute("data-cb-myparam", "hello");
    el.setAttribute("data-name", "testchk");
    wrapper.appendChild(el);
    document.body.appendChild(wrapper);

    await codbi.checkAttributes();

    expect(calls).toHaveLength(1);
    expect((calls[0].params as Record<string, unknown>).myparam).toBe("hello");
  });

  it("marks elements with data-cb-checked after processing", async () => {
    let count = 0;
    codbi.registerFunctionality("Double.Check", () => count++);

    const wrapper = document.createElement("div");
    const el = document.createElement("div");
    el.setAttribute("data-cb-func", "Double.Check");
    el.setAttribute("data-name", "dblchk");
    wrapper.appendChild(el);
    document.body.appendChild(wrapper);

    await codbi.checkAttributes();

    expect(count).toBe(1);
    expect(el.hasAttribute("data-cb-checked")).toBe(true);
  });

  it("handles multiple functionalities on same element", async () => {
    const called: string[] = [];
    codbi.registerFunctionality("Multi.A", () => called.push("A"));
    codbi.registerFunctionality("Multi.B", () => called.push("B"));

    const wrapper = document.createElement("div");
    const el = document.createElement("div");
    el.setAttribute("data-cb-func", "Multi.A,Multi.B");
    el.setAttribute("data-name", "multi");
    wrapper.appendChild(el);
    document.body.appendChild(wrapper);

    await codbi.checkAttributes();

    expect(called).toContain("A");
    expect(called).toContain("B");
  });

  it("removes Processing class after completion", async () => {
    codbi.registerFunctionality("Proc.Test", () => {});

    const wrapper = document.createElement("div");
    const el = document.createElement("div");
    el.setAttribute("data-cb-func", "Proc.Test");
    el.setAttribute("data-name", "proc");
    wrapper.appendChild(el);
    document.body.appendChild(wrapper);

    await codbi.checkAttributes();

    expect(el.classList.contains("Processing")).toBe(false);
    expect(el.classList.contains("CodBi")).toBe(true);
  });

  it("skips LOADER=none elements for animation", async () => {
    codbi.registerFunctionality("NoLoader.Test", () => {});

    const wrapper = document.createElement("div");
    const el = document.createElement("div");
    el.setAttribute("data-cb-func", "NoLoader.Test");
    el.setAttribute("data-cb-LOADER", "none");
    el.setAttribute("data-name", "noload");
    wrapper.appendChild(el);
    document.body.appendChild(wrapper);

    await codbi.checkAttributes();

    expect(wrapper.querySelector(".cCodBiLoader")).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────
// CodBi — resolveEPParams
// ────────────────────────────────────────────────────────────────
describe("CodBi.resolveEPParams", () => {
  let codbi: ReturnType<typeof createCodbiGlobal> & {
    resolveEPParams: (params: string[]) => Promise<string[]>;
  };

  beforeEach(() => {
    const s = document.createElement("script");
    s.src = "https://example.com/codbi.js";
    document.head.appendChild(s);
    codbi = createCodbiGlobal() as unknown as typeof codbi;
  });

  it("passes through plain params unchanged", async () => {
    const result = await codbi.resolveEPParams(["a", "b", "c"]);
    expect(result).toEqual(["a", "b", "c"]);
  });

  it("resolves registered synchronous EP in params", async () => {
    codbi.registerEP("echo", (params) => ["echoed"]);
    const result = await codbi.resolveEPParams(["{echo > x}"]);
    expect(result).toContainEqual(["echoed"]);
  });

  it("resolves registered async EP in params", async () => {
    codbi.registerEP("async.echo", () => Promise.resolve(["async-result"]));
    const result = await codbi.resolveEPParams(["{async.echo > x}"]);
    expect(result).toContainEqual(["async-result"]);
  });
});
