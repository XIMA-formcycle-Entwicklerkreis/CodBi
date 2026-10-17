/**
 * Tests for the EP signature registry added to `CodBi` (describeEP / resolveEPSignature / scanned
 * tags / arity heuristic).
 */
import { describe, expect, it } from "@jest/globals";

import { createCodbiGlobal } from "../src/js/global-scope.js";

/** Casts an arbitrary function to the generator signature (to declare an arity > 1 in tests). */
const asGenerator = (fn: unknown): ((params: Array<string>) => Array<unknown>) =>
  fn as unknown as (params: Array<string>) => Array<unknown>;

describe("CodBi EP signatures", () => {
  it("stores a signature described via describeEP", () => {
    const codbi = createCodbiGlobal();

    expect(codbi.registerEP("sig.explicit", () => ["x"])).toBe(true);
    codbi.describeEP("sig.explicit", {
      params: [
        { index: 1, name: "input", type: "array" },
        { index: 2, name: "by", type: "string", optional: true },
      ],
      returnType: "array",
    });

    const signature = codbi.resolveEPSignature("sig.explicit");
    expect(signature?.params).toHaveLength(2);
    expect(signature?.params[0]).toMatchObject({ index: 1, name: "input", type: "array" });
    expect(signature?.params[1]).toMatchObject({ index: 2, type: "string", optional: true });
    expect(signature?.source).toBe("runtime");
  });

  it("falls back to the declared arity when no signature is known", () => {
    const codbi = createCodbiGlobal();
    codbi.registerEP(
      "sig.arity",
      asGenerator((a: string, b: string) => [a, b]),
    );

    const signature = codbi.resolveEPSignature("sig.arity");
    expect(signature?.source).toBe("heuristic");
    expect(signature?.params).toHaveLength(2);
    expect(signature?.params.every((param) => param.type === "any" && param.optional === true)).toBe(true);
  });

  it("scans @epParam / @epReturn tags from the live generator source", () => {
    const codbi = createCodbiGlobal();
    const generator = (params: Array<string>) => {
      /** @epParam 1 {array} The array to sort.
       *  @epParam 2 {string} optional Sort key.
       *  @epReturn {array} */
      return params;
    };
    codbi.registerEP("sig.scan", generator);

    const signature = codbi.resolveEPSignature("sig.scan");
    expect(signature?.params).toHaveLength(2);
    expect(signature?.params[0]).toMatchObject({ index: 1, type: "array" });
    expect(signature?.params[1]).toMatchObject({ index: 2, type: "string", optional: true });
    expect(signature?.returnType).toBe("array");
  });

  it("describes an already registered EP", () => {
    const codbi = createCodbiGlobal();
    codbi.registerEP("sig.describe", () => []);
    codbi.describeEP("sig.describe", { params: [{ index: 1, type: "number" }] });

    expect(codbi.resolveEPSignature("sig.describe")?.params[0].type).toBe("number");
  });

  it("buffers describeEP until the EP is registered", () => {
    const codbi = createCodbiGlobal();
    codbi.describeEP("sig.pending", { params: [{ index: 1, type: "boolean" }] });
    expect(codbi.resolveEPSignature("sig.pending")).toBeUndefined();

    codbi.registerEP("sig.pending", () => []);
    expect(codbi.resolveEPSignature("sig.pending")?.params[0].type).toBe("boolean");
  });

  it("keeps the original arity across extendEP and only replaces a signature when given", () => {
    const codbi = createCodbiGlobal();
    codbi.registerEP(
      "sig.extend",
      asGenerator((a: string, b: string) => [a, b]),
    );
    codbi.extendEP("sig.extend", () => []);

    // extendEP wraps the generator in a 1-arg function — the arity must still be 2.
    expect(codbi.resolveEPSignature("sig.extend")?.params).toHaveLength(2);

    codbi.describeEP("sig.extend", { params: [{ index: 1, type: "date" }] });
    expect(codbi.resolveEPSignature("sig.extend")?.params).toHaveLength(1);
    expect(codbi.resolveEPSignature("sig.extend")?.params[0].type).toBe("date");
  });

  it("returns undefined for unknown EPs", () => {
    const codbi = createCodbiGlobal();
    expect(codbi.resolveEPSignature("does.not.exist")).toBeUndefined();
  });
});
