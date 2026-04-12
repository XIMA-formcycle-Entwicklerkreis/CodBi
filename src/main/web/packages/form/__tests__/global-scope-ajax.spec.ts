import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import $ from "jquery";
import { createCodbiGlobal } from "../src/js/global-scope.js";
import { TestState, resetTestState } from "./test-state.js";

describe("CodBi AJAX and constructor paths", () => {
  let codbi: any;
  let ajaxMock: ReturnType<typeof jest.fn>;
  const origAjax = $.ajax;

  beforeEach(() => {
    resetTestState();
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    const codbiScript = document.createElement("script");
    codbiScript.src = "https://example.com/codbi.js";
    document.head.appendChild(codbiScript);
    codbi = createCodbiGlobal();
    ajaxMock = jest.fn((options: any) => {
      if (options.success) {
        options.success({ result: "NONE" });
      }
      return {} as any;
    });
    ($ as any).ajax = ajaxMock;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
    ($ as any).ajax = origAjax;
  });

  // ── log method ──
  describe("log", () => {
    it("logs INFO with console.info", () => {
      const spy = jest.spyOn(console, "info").mockImplementation(() => {});
      codbi.log("INFO", "hello");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("hello"));
      spy.mockRestore();
    });

    it("logs WARNING with console.warn", () => {
      const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
      codbi.log("WARNING", "warn");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("warn"));
      spy.mockRestore();
    });

    it("logs ERROR with console.error", () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      codbi.log("ERROR", "err");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("err"));
      spy.mockRestore();
    });

    it("includes adjunct in the output", () => {
      const spy = jest.spyOn(console, "info").mockImplementation(() => {});
      codbi.log("INFO", "msg", "MyModule");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("MyModule"));
      spy.mockRestore();
    });
  });

  // ── nncHandler ──
  describe("nncHandler", () => {
    it("calls $.ajax with correct headers", () => {
      codbi.nncHandler("MyStandard");
      expect(ajaxMock).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Action": "Code",
            "X-ActionDetail": "Standard",
            "X-Element": "MyStandard",
          }),
        }),
      );
    });

    it("does not call importRemoteModule when result is NONE", () => {
      const spy = jest.spyOn(codbi, "importRemoteModule" as any).mockResolvedValue(undefined);
      codbi.nncHandler("MyStandard");
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it("calls importRemoteModule when result is not NONE", () => {
      ajaxMock.mockImplementation((options: any) => {
        if (options.success) options.success({ result: "window.codbi.log('INFO','test')" });
        return {} as any;
      });
      const spy = jest.spyOn(codbi, "importRemoteModule" as any).mockResolvedValue(undefined);
      codbi.nncHandler("MyStandard");
      expect(spy).toHaveBeenCalledWith("window.codbi.log('INFO','test')");
      spy.mockRestore();
    });
  });

  // ── registerFunctionality ──
  describe("registerFunctionality", () => {
    it("returns false for duplicate registration", () => {
      const spy = jest.spyOn(console, "info").mockImplementation(() => {});
      codbi.registerFunctionality("dup.func", () => {});
      expect(codbi.registerFunctionality("dup.func", () => {})).toBe(false);
      spy.mockRestore();
    });

    it("clears data-cb-checked on registration for existing elements", () => {
      const el = document.createElement("div");
      el.setAttribute("data-cb-checked", "my.func other.func");
      document.body.appendChild(el);
      codbi.functionalities.delete("my.func");
      codbi.registerFunctionality("my.func", () => {});
      expect(el.getAttribute("data-cb-checked")).not.toContain("my.func");
    });
  });

  // ── extendFunctionality ──
  describe("extendFunctionality", () => {
    it("registers new when id not present", () => {
      const spy = jest.spyOn(console, "info").mockImplementation(() => {});
      const result = codbi.extendFunctionality("new.func", jest.fn());
      expect(result).toBe(false);
      spy.mockRestore();
    });

    it("extends existing, invoking both old and new", () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      codbi.registerFunctionality("ext.func", fn1);
      codbi.extendFunctionality("ext.func", fn2);
      const el = document.createElement("div");
      codbi.functionalities.get("ext.func")({}, el);
      expect(fn1).toHaveBeenCalled();
      expect(fn2).toHaveBeenCalled();
    });
  });

  // ── extendEP ──
  describe("extendEP", () => {
    it("returns false when EP is not registered", () => {
      const spy = jest.spyOn(console, "info").mockImplementation(() => {});
      expect(codbi.extendEP("missing.ep", () => [])).toBe(false);
      spy.mockRestore();
    });

    it("extends a sync EP", () => {
      codbi.registerEP("base.ep", () => ["orig"]);
      codbi.extendEP("base.ep", (_p: string[], former: string[]) => [...former, "ext"]);
      const result = codbi.availableEPs["base.ep"]([]);
      expect(result).toContain("orig");
      expect(result).toContain("ext");
    });

    it("extends an async EP", async () => {
      codbi.registerEP("async.base", () => Promise.resolve(["orig"]));
      codbi.extendEP("async.base", (_p: string[], former: string[]) => [...former, "ext"]);
      const result = await codbi.availableEPs["async.base"]([]);
      expect(result).toContain("orig");
      expect(result).toContain("ext");
    });

    it("handles async generator on async EP", async () => {
      codbi.registerEP("aa.ep", () => Promise.resolve(["a"]));
      codbi.extendEP("aa.ep", (_p: string[], former: string[]) => Promise.resolve([...former, "b"]));
      const result = await codbi.availableEPs["aa.ep"]([]);
      expect(result).toContain("a");
      expect(result).toContain("b");
    });
  });

  // ── extractEPs ──
  describe("extractEPs", () => {
    it("extracts EP name from braces", () => {
      const result = codbi.extractEPs("{Date.Today > +1d}");
      expect(result).toContain("Date.Today");
    });

    it("extracts multiple EPs", () => {
      const result = codbi.extractEPs("{EP1 > p1},{EP2 > p2}");
      expect(result).toContain("EP1");
      expect(result).toContain("EP2");
    });

    it("returns empty array for no EPs", () => {
      expect(codbi.extractEPs("plain text")).toEqual([]);
    });

    it("handles unmatched closing brace", () => {
      expect(codbi.extractEPs("test}value")).toEqual([]);
    });

    it("handles GT outside braces", () => {
      const result = codbi.extractEPs("a > b");
      expect(result).toEqual([]);
    });
  });

  // ── constructor addRow handler ──
  describe("constructor addRow handler", () => {
    it("copies data-cb-* attrs from original to clone", () => {
      const orig = document.createElement("div");
      orig.id = "row0";
      orig.setAttribute("data-dynamic-row", "0");
      const origChild = document.createElement("input");
      origChild.setAttribute("data-cb-func", "HTML.CSS");
      origChild.setAttribute("data-cb-color", "red");
      origChild.setAttribute("data-org-id", "field1");
      origChild.setAttribute("data-cb-checked", "html.css");
      orig.appendChild(origChild);
      document.body.appendChild(orig);

      const clone = document.createElement("div");
      clone.id = "row1";
      clone.setAttribute("data-dynamic-row", "1");
      const cloneChild = document.createElement("input");
      cloneChild.setAttribute("data-org-id", "field1");
      clone.appendChild(cloneChild);
      document.body.appendChild(clone);

      for (const cb of TestState.xUtilCallbacks.get("addRow") ?? []) {
        cb({ container: { "0": clone } });
      }

      expect(cloneChild.getAttribute("data-cb-func")).toBe("HTML.CSS");
      expect(cloneChild.getAttribute("data-cb-color")).toBe("red");
      // data-cb-checked is NOT copied from original — it gets freshly set by checkAttributes
      expect(cloneChild.getAttribute("data-cb-checked")).not.toContain("other.func");
    });

    it("cleans up loader and Processing classes", () => {
      const orig = document.createElement("div");
      orig.id = "r0";
      orig.setAttribute("data-dynamic-row", "0");
      document.body.appendChild(orig);

      const clone = document.createElement("div");
      clone.id = "r1";
      clone.setAttribute("data-dynamic-row", "1");
      const loader = document.createElement("div");
      loader.classList.add("cCodBiLoader");
      clone.appendChild(loader);
      const proc = document.createElement("div");
      proc.classList.add("Processing");
      clone.appendChild(proc);
      document.body.appendChild(clone);

      for (const cb of TestState.xUtilCallbacks.get("addRow") ?? []) {
        cb({ container: { "0": clone } });
      }

      expect(clone.querySelector(".cCodBiLoader")).toBeNull();
      expect(proc.classList.contains("Processing")).toBe(false);
    });

    it("skips row 0", () => {
      const clone = document.createElement("div");
      clone.id = "r0";
      clone.setAttribute("data-dynamic-row", "0");
      document.body.appendChild(clone);
      // Should not throw
      for (const cb of TestState.xUtilCallbacks.get("addRow") ?? []) {
        cb({ container: { "0": clone } });
      }
    });
  });

  // ── constructor beforeDeleteRow handler ──
  describe("constructor beforeDeleteRow handler", () => {
    it("clears errors on [data-name] fields", () => {
      const container = document.createElement("div");
      const f1 = document.createElement("input");
      f1.setAttribute("data-name", "firstName");
      $(f1).error("Required");
      container.appendChild(f1);
      const f2 = document.createElement("input");
      f2.setAttribute("data-name", "lastName");
      $(f2).error("Invalid");
      container.appendChild(f2);
      document.body.appendChild(container);

      for (const cb of TestState.xUtilCallbacks.get("beforeDeleteRow") ?? []) {
        cb({ container: { "0": container } });
      }

      expect($(f1).error()).toBe("");
      expect($(f2).error()).toBe("");
    });
  });

  // ── resolveEP — non-array with registered EP ──
  describe("resolveEP — non-array config", () => {
    it("resolves sync EP in non-array value", async () => {
      codbi.registerEP("myep", () => ["resolved"]);
      const result = await codbi.resolveEP({ "0": "{myep}" });
      expect(result["0"]).toEqual(["resolved"]);
    });

    it("resolves async EP in non-array value", async () => {
      codbi.registerEP("asyncep", () => Promise.resolve(["async_val"]));
      const result = await codbi.resolveEP({ "0": "{asyncep}" });
      expect(result["0"]).toEqual(["async_val"]);
    });

    it("resolves empty config immediately", async () => {
      const result = await codbi.resolveEP({});
      expect(result).toEqual({});
    });

    it("skips null/undefined config values", async () => {
      const result = await codbi.resolveEP({ "0": null, "1": undefined });
      expect(result["0"]).toBeNull();
    });

    it("passes through values without EP markers", async () => {
      const result = await codbi.resolveEP({ "0": "plain value", "1": "another" });
      expect(result["0"]).toBe("plain value");
      expect(result["1"]).toBe("another");
    });
  });

  // ── resolveEP — array with registered EP ──
  describe("resolveEP — array config values", () => {
    it("resolves sync EP in array value", async () => {
      codbi.registerEP("arr.ep", () => ["val1", "val2"]);
      const result = await codbi.resolveEP({ "0": ["{arr.ep}"] });
      expect(result["0"]).toContain("val1");
    });

    it("resolves async EP in array value", async () => {
      codbi.registerEP("arr.async", () => Promise.resolve(["async1"]));
      const result = await codbi.resolveEP({ "0": ["{arr.async}"] });
      expect(result["0"]).toContain("async1");
    });
  });

  // ── resolveEP — AJAX fallback ──
  describe("resolveEP AJAX fallback", () => {
    it("downloads EP via AJAX when not registered", async () => {
      jest.spyOn(codbi, "importRemoteModule" as any).mockImplementation(async () => {
        codbi.registerEP("remote.ep", () => ["remote_result"]);
      });
      ajaxMock.mockImplementation((options: any) => {
        if (options.success) options.success({ result: "code" });
        return {} as any;
      });
      const result = await codbi.resolveEP({ "0": "{remote.ep}" });
      expect(result["0"]).toEqual(["remote_result"]);
    });

    it("downloads EP via AJAX for array value", async () => {
      jest.spyOn(codbi, "importRemoteModule" as any).mockImplementation(async () => {
        codbi.registerEP("arr.remote", () => ["arr_result"]);
      });
      ajaxMock.mockImplementation((options: any) => {
        if (options.success) options.success({ result: "code" });
        return {} as any;
      });
      const result = await codbi.resolveEP({ "0": ["{arr.remote}"] });
      expect(result["0"]).toContain("arr_result");
    });
  });

  // ── loadConfig — AJAX dependency resolution ──
  describe("loadConfig AJAX dependency resolution", () => {
    it("resolves when AJAX error callback fires", async () => {
      ajaxMock.mockImplementation((options: any) => {
        if (options.error) options.error();
        return {} as any;
      });

      const el = document.createElement("div");
      el.classList.add("target");
      document.body.appendChild(el);

      await codbi.loadConfig({ targets: ".target", FUNC: "Missing.Func" } as any);
      expect(el.getAttribute("data-cb-FUNC")).toBe("Missing.Func");
    });

    it("imports remote functionality when AJAX succeeds", async () => {
      jest.spyOn(codbi, "importRemoteModule" as any).mockImplementation(async () => {
        codbi.registerFunctionality("ajax.func", () => {});
      });
      ajaxMock.mockImplementation((options: any) => {
        if (options.success) options.success({ result: "code" });
        return {} as any;
      });

      const el = document.createElement("div");
      el.classList.add("ajax-target");
      document.body.appendChild(el);

      await codbi.loadConfig({ targets: ".ajax-target", FUNC: "Ajax.Func" } as any);
      expect(el.getAttribute("data-cb-FUNC")).toBe("Ajax.Func");
    });

    it("handles EP dependency AJAX error", async () => {
      ajaxMock.mockImplementation((options: any) => {
        if (options.error) options.error();
        return {} as any;
      });

      const el = document.createElement("div");
      el.classList.add("ep-target");
      document.body.appendChild(el);

      await codbi.loadConfig({
        targets: ".ep-target",
        customAttr: "{SomeEP > param}",
      } as any);
      expect(el.getAttribute("data-cb-customAttr")).toBe("{SomeEP > param}");
    });
  });

  // ── loadConfig — duplicate target discard ──
  describe("loadConfig duplicate discard", () => {
    it("discards second load for same targets selector", async () => {
      codbi.registerFunctionality("dup.config", () => {});
      const spy = jest.spyOn(console, "info").mockImplementation(() => {});

      const el = document.createElement("div");
      el.classList.add("dup-target");
      document.body.appendChild(el);

      await codbi.loadConfig({ targets: ".dup-target", FUNC: "dup.config" } as any);
      await codbi.loadConfig({ targets: ".dup-target", FUNC: "dup.config" } as any);

      expect(spy).toHaveBeenCalledWith(expect.stringContaining("Discard"));
      spy.mockRestore();
    });
  });

  // ── checkAttributes — registered func with LOADER=none ──
  describe("checkAttributes — LOADER=none", () => {
    it("does not inject loading animation when LOADER=none", async () => {
      const fn = jest.fn();
      codbi.registerFunctionality("noloader.func", fn);

      const el = document.createElement("div");
      el.setAttribute("data-cb-func", "noloader.func");
      el.setAttribute("data-cb-LOADER", "none");
      document.body.appendChild(el);

      await codbi.checkAttributes();
      expect(fn).toHaveBeenCalled();
      expect(el.querySelector(".cCodBiLoader")).toBeNull();
    });
  });

  // ── checkAttributes — AJAX for remote functionality ──
  describe("checkAttributes AJAX for remote functionality", () => {
    it("downloads unregistered functionality via AJAX", async () => {
      const fn = jest.fn();
      jest.spyOn(codbi, "importRemoteModule" as any).mockImplementation(async () => {
        codbi.registerFunctionality("remote.func", fn);
      });
      ajaxMock.mockImplementation((options: any) => {
        if (options.success) options.success({ result: "code" });
        return {} as any;
      });

      const el = document.createElement("div");
      el.setAttribute("data-cb-func", "remote.func");
      document.body.appendChild(el);

      await codbi.checkAttributes();
      expect(ajaxMock).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-ActionDetail": "Functionality",
            "X-Element": "remote.func",
          }),
        }),
      );
      expect(fn).toHaveBeenCalled();
    });

    it("skips empty functionality names", async () => {
      const el = document.createElement("div");
      el.setAttribute("data-cb-func", ",valid.func,");
      document.body.appendChild(el);
      codbi.registerFunctionality("valid.func", jest.fn());

      await codbi.checkAttributes();
      // Should not throw or hang
    });
  });

  // ── resolveEPParams ──
  describe("resolveEPParams", () => {
    it("resolves params with registered EP", async () => {
      codbi.registerEP("v", () => ["42"]);
      const result = await codbi.resolveEPParams(["{v}"]);
      expect(result).toEqual([["42"]]);
    });

    it("resolves plain params without EPs", async () => {
      const result = await codbi.resolveEPParams(["plain", "text"]);
      expect(result).toEqual(["plain", "text"]);
    });

    it("resolves empty params array", async () => {
      const result = await codbi.resolveEPParams([]);
      expect(result).toEqual([]);
    });

    it("resolves async EP in params", async () => {
      codbi.registerEP("asyncp", () => Promise.resolve(["99"]));
      const result = await codbi.resolveEPParams(["{asyncp}"]);
      expect(result).toEqual([["99"]]);
    });
  });
});
