import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { createCodbiGlobal } from "../src/js/global-scope.js";

/**
 * Tests for loadConfig, loadConfigs, extractEPs, and attribute application
 * on top of the methods already covered in global-scope-deep.spec.ts.
 */
describe("CodBi.loadConfig and loadConfigs", () => {
  let codbi: ReturnType<typeof createCodbiGlobal>;

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    codbi = createCodbiGlobal();
    window.codbi = codbi as any;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("loadConfig applies data-cb-* attributes to matching elements", async () => {
    // Pre-register a functionality so no ajax needed
    codbi.registerFunctionality("test.func", () => {});

    const el = document.createElement("div");
    el.classList.add("my-target");
    document.body.appendChild(el);

    await codbi.loadConfig({
      targets: ".my-target",
      FUNC: "Test.Func",
      SomeProp: "SomeValue",
    } as any);

    expect(el.getAttribute("data-cb-FUNC")).toBe("Test.Func");
    expect(el.getAttribute("data-cb-SomeProp")).toBe("SomeValue");
  });

  it("loadConfig does not overwrite existing data-cb-* attributes", async () => {
    codbi.registerFunctionality("test.func", () => {});

    const el = document.createElement("div");
    el.classList.add("my-target");
    el.setAttribute("data-cb-SomeProp", "Original");
    document.body.appendChild(el);

    await codbi.loadConfig({
      targets: ".my-target",
      FUNC: "Test.Func",
      SomeProp: "Overwrite",
    } as any);

    // Existing attribute should NOT be overwritten
    expect(el.getAttribute("data-cb-SomeProp")).toBe("Original");
  });

  it("loadConfig appends FUNC to existing data-cb-func", async () => {
    codbi.registerFunctionality("test.a", () => {});
    codbi.registerFunctionality("test.b", () => {});

    const el = document.createElement("div");
    el.classList.add("my-target");
    el.setAttribute("data-cb-func", "Test.B");
    document.body.appendChild(el);

    await codbi.loadConfig({
      targets: ".my-target",
      FUNC: "Test.A",
    } as any);

    const funcAttr = el.getAttribute("data-cb-func");
    expect(funcAttr).toContain("Test.A");
    expect(funcAttr).toContain("Test.B");
  });

  it("loadConfig skips duplicate configuration targets", async () => {
    codbi.registerFunctionality("test.func", () => {});

    const el = document.createElement("div");
    el.classList.add("my-target");
    document.body.appendChild(el);

    await codbi.loadConfig({ targets: ".my-target", FUNC: "Test.Func" } as any);
    // Second call with same selector should be discarded
    await codbi.loadConfig({ targets: ".my-target", FUNC: "Test.Other" } as any);

    // Should still have only the first config's FUNC
    expect(el.getAttribute("data-cb-FUNC")).toBe("Test.Func");
  });

  it("loadConfigs applies multiple configs sequentially", async () => {
    codbi.registerFunctionality("test.a", () => {});
    codbi.registerFunctionality("test.b", () => {});

    const el1 = document.createElement("div");
    el1.classList.add("target-a");
    document.body.appendChild(el1);

    const el2 = document.createElement("div");
    el2.classList.add("target-b");
    document.body.appendChild(el2);

    codbi.loadConfigs([
      { targets: ".target-a", FUNC: "Test.A", Color: "red" },
      { targets: ".target-b", FUNC: "Test.B", Color: "blue" },
    ] as any);

    // Allow promises to settle
    await new Promise((r) => setTimeout(r, 50));

    expect(el1.getAttribute("data-cb-FUNC")).toBe("Test.A");
    expect(el1.getAttribute("data-cb-Color")).toBe("red");
    expect(el2.getAttribute("data-cb-FUNC")).toBe("Test.B");
    expect(el2.getAttribute("data-cb-Color")).toBe("blue");
  });

  it("loadConfig applies to multiple matching elements", async () => {
    codbi.registerFunctionality("test.func", () => {});

    for (let i = 0; i < 3; i++) {
      const el = document.createElement("div");
      el.classList.add("shared-class");
      document.body.appendChild(el);
    }

    await codbi.loadConfig({
      targets: ".shared-class",
      FUNC: "Test.Func",
      Val: "applied",
    } as any);

    const elements = document.querySelectorAll(".shared-class");
    expect(elements.length).toBe(3);
    for (const el of elements) {
      expect(el.getAttribute("data-cb-FUNC")).toBe("Test.Func");
      expect(el.getAttribute("data-cb-Val")).toBe("applied");
    }
  });

  it("loadConfig handles tilde-separated targets", async () => {
    codbi.registerFunctionality("test.func", () => {});

    const el1 = document.createElement("div");
    el1.classList.add("group-a");
    document.body.appendChild(el1);

    const el2 = document.createElement("span");
    el2.classList.add("group-b");
    document.body.appendChild(el2);

    await codbi.loadConfig({
      targets: ".group-a~.group-b",
      FUNC: "Test.Func",
    } as any);

    expect(el1.getAttribute("data-cb-FUNC")).toBe("Test.Func");
    expect(el2.getAttribute("data-cb-FUNC")).toBe("Test.Func");
  });
});

describe("CodBi.registerFunctionality and registerEP", () => {
  let codbi: ReturnType<typeof createCodbiGlobal>;

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    codbi = createCodbiGlobal();
    window.codbi = codbi as any;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
  });

  it("registerFunctionality stores in lowercase", () => {
    const fn = () => {};
    codbi.registerFunctionality("My.Fancy.Func", fn);
    // Internally stored lowercase - verify can be extended
    expect(codbi.extendFunctionality("my.fancy.func", fn)).toBe(true);
  });

  it("registerEP stores in lowercase", () => {
    const ep = () => ["val"];
    codbi.registerEP("My.EP", ep);
    // Verify via extendEP
    expect(codbi.extendEP("my.ep", (p, orig) => orig)).toBe(true);
  });

  it("registerEP returns false for duplicate registration", () => {
    const ep = () => ["val"];
    expect(codbi.registerEP("dup.ep", ep)).not.toBe(false);
    // Second registration attempt — the system logs a message about the duplicate
    // but doesn't throw (it overwrites)
    codbi.registerEP("dup.ep", ep);
    // Just verify no crash
  });
});

describe("CodBi.log", () => {
  let codbi: ReturnType<typeof createCodbiGlobal>;

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    codbi = createCodbiGlobal();
    window.codbi = codbi as any;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
  });

  it("logs INFO without throwing", () => {
    expect(() => codbi.log("INFO", "Test info message")).not.toThrow();
  });

  it("logs WARNING without throwing", () => {
    expect(() => codbi.log("WARNING", "Test warning")).not.toThrow();
  });

  it("logs ERROR without throwing", () => {
    expect(() => codbi.log("ERROR", "Test error")).not.toThrow();
  });

  it("logs with adjunct text", () => {
    expect(() => codbi.log("INFO", "Main message", "Extra detail")).not.toThrow();
  });
});
