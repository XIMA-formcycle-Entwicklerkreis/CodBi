import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

describe("CodBi utility methods — deep coverage", () => {
  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
  });

  describe("getOutermostEP", () => {
    it("returns null when no braces present", () => {
      expect(window.codbi.getOutermostEP("hello world")).toBeNull();
    });

    it("parses EP name and params", () => {
      const result = (window.codbi as any).getOutermostEP("{Date.Today > +1d ; +2m}");
      expect(result).not.toBeNull();
      expect(result.keyPlaceholder).toBe("Date.Today");
      expect(result.params).toBe("+1d ; +2m");
    });

    it("parses EP with no params", () => {
      const result = (window.codbi as any).getOutermostEP("{NOW}");
      expect(result).not.toBeNull();
      expect(result.keyPlaceholder).toBe("NOW");
    });

    it("throws on mismatched braces", () => {
      expect(() => {
        (window.codbi as any).getOutermostEP("{unclosed");
      }).toThrow();
    });
  });

  describe("splitUnbracedParams", () => {
    it("splits simple semicolon-separated params", () => {
      const result = (window.codbi as any).splitUnbracedParams("a ; b ; c");
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("preserves content within braces", () => {
      const result = (window.codbi as any).splitUnbracedParams("a ; {b ; c} ; d");
      expect(result).toEqual(["a", "{b ; c}", "d"]);
    });

    it("returns empty array for empty string", () => {
      const result = (window.codbi as any).splitUnbracedParams("");
      expect(result).toEqual([]);
    });

    it("returns empty array for null", () => {
      const result = (window.codbi as any).splitUnbracedParams(null);
      expect(result).toEqual([]);
    });

    it("handles nested braces", () => {
      const result = (window.codbi as any).splitUnbracedParams("x ; {a ; {b ; c}} ; y");
      expect(result).toEqual(["x", "{a ; {b ; c}}", "y"]);
    });

    it("handles single param with no semicolons", () => {
      const result = (window.codbi as any).splitUnbracedParams("single");
      expect(result).toEqual(["single"]);
    });
  });

  describe("extendEP", () => {
    it("returns false when EP not registered", () => {
      const result = window.codbi.extendEP("nonExistentEP_test", () => []);
      expect(result).toBe(false);
    });

    it("chains a synchronous EP", () => {
      // Register a base EP
      window.codbi.registerEP("TestExtendSync", (params) => params.map((p) => p.toUpperCase()));

      // Extend it
      const extended = window.codbi.extendEP("TestExtendSync", (params, former) => [...former, "EXTENDED"]);
      expect(extended).toBe(true);
    });
  });

  describe("extendFunctionality", () => {
    it("registers new when extending unregistered functionality", () => {
      const result = window.codbi.extendFunctionality("newExtendedFunc_test", () => {});
      expect(result).toBe(false);
    });

    it("extends existing functionality", () => {
      window.codbi.registerFunctionality("existingFunc_test", () => {});
      const result = window.codbi.extendFunctionality("existingFunc_test", () => {});
      expect(result).toBe(true);
    });
  });

  describe("reportError", () => {
    it("throws a CodBiError with the message", () => {
      expect(() => {
        window.codbi.reportError("Test error message");
      }).toThrow("Test error message");
    });
  });

  describe("log", () => {
    it("logs INFO level", () => {
      const spy = jest.spyOn(console, "info").mockImplementation(() => {});
      window.codbi.log("INFO", "test message");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("logs WARNING level", () => {
      const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
      window.codbi.log("WARNING", "test warning");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("logs ERROR level", () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      window.codbi.log("ERROR", "test error");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("logs with adjunct", () => {
      const spy = jest.spyOn(console, "info").mockImplementation(() => {});
      window.codbi.log("INFO", "test message", "adjunct");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("injectLoadingAnim / removeLoaderAnim", () => {
    it("injects loading animation after element", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      window.codbi.injectLoadingAnim(el);

      const loader = document.querySelector(".cCodBiLoader");
      expect(loader).not.toBeNull();
    });

    it("does not inject duplicate loading animation", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      window.codbi.injectLoadingAnim(el);
      window.codbi.injectLoadingAnim(el);

      const loaders = document.querySelectorAll(".cCodBiLoader");
      expect(loaders.length).toBe(1);
    });

    it("removes loading animation", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      window.codbi.injectLoadingAnim(el);
      window.codbi.removeLoaderAnim(el);

      const loader = el.querySelector(".cCodBiLoader");
      expect(loader).toBeNull();
    });
  });

  describe("nncHandler", () => {
    it("is a function", () => {
      expect(typeof window.codbi.nncHandler).toBe("function");
    });
  });
});
