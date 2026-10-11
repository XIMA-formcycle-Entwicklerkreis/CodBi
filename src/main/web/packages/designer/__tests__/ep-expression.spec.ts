// Tests for the Element-Placeholder expression parser/serializer (EPExpression.ts).

import { afterEach, describe, expect, it } from "@jest/globals";

import { resolveEPSignatureForId } from "../src/js/EPBuilder.js";
import { collectEPIds, createEPNode, type EPNode, parseEPValue, serializeEPValue } from "../src/js/EPExpression.js";

describe("EPExpression", () => {
  it("parses plain text into a single text segment", () => {
    expect(parseEPValue("hello")).toEqual([{ kind: "text", value: "hello" }]);
  });

  it("parses a simple EP with no params", () => {
    const segments = parseEPValue("{ Date.Today >  }");

    expect(segments).toHaveLength(1);
    expect(segments[0].kind).toBe("ep");
    expect((segments[0] as EPNode).id).toBe("Date.Today");
    expect((segments[0] as EPNode).params).toHaveLength(0);
  });

  it("parses nested EPs and multiple params", () => {
    const segments = parseEPValue("{ Sorted > { Net.URL > https://x } ; name }");
    const node = segments[0] as EPNode;

    expect(node.kind).toBe("ep");
    expect(node.id).toBe("Sorted");
    expect(node.params).toHaveLength(2);

    const nested = node.params[0][0] as EPNode;
    expect(nested.kind).toBe("ep");
    expect(nested.id).toBe("Net.URL");
    expect((nested.params[0][0] as { value: string }).value).toBe("https://x");
  });

  it("round-trips a value with surrounding literal text", () => {
    const value = "prefix { Sorted > a ; b } suffix";
    expect(serializeEPValue(parseEPValue(value))).toBe(value);
  });

  it("lowercases literal parameter values on request but keeps EP ids", () => {
    const value = "{ Sorted > { Net.URL > https://X.example } ; NACHNAME }";
    const lowercased = "{ Sorted > { Net.URL > https://x.example } ; nachname }";

    expect(serializeEPValue(parseEPValue(value), true)).toBe(lowercased);
    // Without the flag the user's casing is preserved.
    expect(serializeEPValue(parseEPValue(value))).toBe(value);
  });

  it("escapes and restores literal braces", () => {
    const segments = parseEPValue("a °{ literal °} b");
    expect(segments).toEqual([{ kind: "text", value: "a { literal } b" }]);
    expect(serializeEPValue(segments)).toBe("a °{ literal °} b");
  });

  it("treats unbalanced braces as literal text", () => {
    expect(parseEPValue("a { unclosed")).toEqual([{ kind: "text", value: "a { unclosed" }]);
  });

  it("collects nested EP ids", () => {
    const segments = parseEPValue("{ Sorted > { Net.URL > x } ; name }");
    expect(collectEPIds(segments).sort()).toEqual(["net.url", "sorted"]);
  });

  it("creates an EP node with a given number of params", () => {
    expect(createEPNode("X", 3).params).toHaveLength(3);
    expect(createEPNode("X", 0).params).toHaveLength(0);
  });

  it("is stable across parse → serialize → parse", () => {
    const once = serializeEPValue(parseEPValue("{ A > { B > c } ; d ; e }"));
    const twice = serializeEPValue(parseEPValue(once));
    expect(twice).toBe(once);
  });
});

describe("resolveEPSignatureForId", () => {
  afterEach(() => {
    delete (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData;
  });

  it("reads a typed Signature from detElementplaceholder (case-insensitive)", () => {
    (window as unknown as { CodbiPluginData: unknown }).CodbiPluginData = {
      detElementplaceholder: {
        "openplz.localities": {
          Description: "x",
          Signature: { params: [{ index: 1, type: "string" }], returnType: "any", source: "tsdoc" },
        },
      },
    };

    const signature = resolveEPSignatureForId("OpenPLZ.Localities", document.createElement("div"));
    expect(signature?.params[0].type).toBe("string");
    expect(signature?.source).toBe("tsdoc");
  });

  it("synthesizes a signature from a Parameter map when no Signature exists", () => {
    (window as unknown as { CodbiPluginData: unknown }).CodbiPluginData = {
      detElementplaceholder: {
        sorted: { Description: "x", Parameter: { "1": "The array", "2": "The key" } },
      },
    };

    const signature = resolveEPSignatureForId("Sorted", document.createElement("div"));
    expect(signature?.params).toHaveLength(2);
    expect(signature?.source).toBe("manager");
  });

  it("returns undefined when nothing is known", () => {
    (window as unknown as { CodbiPluginData: unknown }).CodbiPluginData = { detElementplaceholder: {} };
    expect(resolveEPSignatureForId("does.not.exist", document.createElement("div"))).toBeUndefined();
  });
});
