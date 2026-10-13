/**
 * Tests for the functionality metadata registry added to `CodBi`
 * (registerFunctionality metadata / describeFunctionality / resolveFunctionalityMeta / @funcElement).
 */
import { describe, expect, it, beforeEach, jest } from "@jest/globals";

import { createCodbiGlobal } from "../src/js/global-scope.js";

/** The init signature a functionality is registered with. */
type TInit = (toLoad: unknown, toProcess: Element) => unknown;

describe("CodBi functionality metadata", () => {
  beforeEach(() => {
    // Remove any published metadata left by other tests.
    delete (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData;
    jest.restoreAllMocks();
  });

  it("stores explicit metadata passed to registerFunctionality", () => {
    const codbi = createCodbiGlobal();

    expect(codbi.registerFunctionality("func.explicit", () => {}, { formElements: ["XFieldSet", "XContainer"] })).toBe(
      true,
    );

    const meta = codbi.resolveFunctionalityMeta("func.explicit");
    expect(meta?.formElements).toEqual(["XFieldSet", "XContainer"]);
    expect(meta?.source).toBe("runtime");
  });

  it("normalizes (trims + de-duplicates) the widget class names", () => {
    const codbi = createCodbiGlobal();
    codbi.registerFunctionality("func.norm", () => {}, {
      formElements: [" XFieldSet ", "XFieldSet", "", "XContainer"],
    });

    expect(codbi.resolveFunctionalityMeta("func.norm")?.formElements).toEqual(["XFieldSet", "XContainer"]);
  });

  it("is case-insensitive for the functionality id", () => {
    const codbi = createCodbiGlobal();
    codbi.registerFunctionality("Func.Case", () => {}, { formElements: ["XFieldSet"] });

    expect(codbi.resolveFunctionalityMeta("func.case")?.formElements).toEqual(["XFieldSet"]);
  });

  it("returns undefined for unknown functionalities (fail-open)", () => {
    const codbi = createCodbiGlobal();
    expect(codbi.resolveFunctionalityMeta("does.not.exist")).toBeUndefined();
  });

  it("describes an already registered functionality", () => {
    const codbi = createCodbiGlobal();
    codbi.registerFunctionality("func.describe", () => {});
    codbi.describeFunctionality("func.describe", { formElements: ["XUpload"] });

    expect(codbi.resolveFunctionalityMeta("func.describe")?.formElements).toEqual(["XUpload"]);
  });

  it("buffers describeFunctionality until the functionality is registered", () => {
    const codbi = createCodbiGlobal();
    codbi.describeFunctionality("func.pending", { formElements: ["XSelect"] });
    expect(codbi.resolveFunctionalityMeta("func.pending")).toBeUndefined();

    codbi.registerFunctionality("func.pending", () => {});
    expect(codbi.resolveFunctionalityMeta("func.pending")?.formElements).toEqual(["XSelect"]);
  });

  it("scans @funcElement tags from the live init source", () => {
    const codbi = createCodbiGlobal();
    const init: TInit = () => {
      /** @funcElement XFieldSet
       *  @funcElement XContainer, XContainerInvisible */
      return undefined;
    };
    codbi.registerFunctionality("func.scan", init);

    const meta = codbi.resolveFunctionalityMeta("func.scan");
    expect(meta?.formElements).toEqual(["XFieldSet", "XContainer", "XContainerInvisible"]);
    expect(meta?.source).toBe("tsdoc");
  });

  it("prefers runtime metadata over the scanned tags", () => {
    const codbi = createCodbiGlobal();
    const init: TInit = () => {
      /** @funcElement XFieldSet */
      return undefined;
    };
    codbi.registerFunctionality("func.prefer", init, { formElements: ["XUpload"] });

    expect(codbi.resolveFunctionalityMeta("func.prefer")?.formElements).toEqual(["XUpload"]);
  });

  it("falls back to window.CodbiPluginData.funcMeta (Tier A/B)", () => {
    const codbi = createCodbiGlobal();
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      funcMeta: { "func.published": { formElements: ["XFieldSet"], source: "tsdoc" } },
    };
    // Register without metadata so the registry stays empty and the published map is consulted.
    codbi.registerFunctionality("func.published", () => {});

    const meta = codbi.resolveFunctionalityMeta("func.published");
    expect(meta?.formElements).toEqual(["XFieldSet"]);
    expect(meta?.source).toBe("manager");
  });
});
