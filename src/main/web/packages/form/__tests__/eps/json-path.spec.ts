import { describe, expect, it } from "@jest/globals";

import { JSON_Path, resolvePath } from "../../src/js/EPs/json.path.js";

describe("resolvePath", () => {
  it("resolves a simple dotted path", () => {
    const obj = { a: { b: { c: "found" } } };
    expect(resolvePath("a.b.c", obj)).toBe("found");
  });

  it("resolves a single-level path", () => {
    const obj = { name: "test" };
    expect(resolvePath("name", obj)).toBe("test");
  });

  it("resolves numeric values along the path", () => {
    const obj = { data: { count: 42 } };
    expect(resolvePath("data.count", obj)).toBe(42);
  });

  it("resolves array elements by index", () => {
    const obj = { items: ["a", "b", "c"] };
    expect(resolvePath("items.1", obj)).toBe("b");
  });

  it("throws when path is interrupted by undefined", () => {
    const obj = { a: { b: undefined } };
    expect(() => resolvePath("a.b.c", obj)).toThrow();
  });

  it("throws when path is interrupted by null", () => {
    const obj = { a: { b: null } };
    expect(() => resolvePath("a.b.c", obj)).toThrow();
  });

  it("returns undefined for the last part of a path that does not exist", () => {
    const obj = { a: { b: {} } };
    expect(resolvePath("a.b.c", obj)).toBeUndefined();
  });

  it("resolves method calls with ()", () => {
    const obj = {
      getData: () => ({ value: "result" }),
    };
    expect(resolvePath("getData().value", obj)).toBe("result");
  });

  it("handles deeply nested objects", () => {
    const obj = { l1: { l2: { l3: { l4: { l5: "deep" } } } } };
    expect(resolvePath("l1.l2.l3.l4.l5", obj)).toBe("deep");
  });
});

describe("JSON_Path.retrieve", () => {
  it("resolves a path from params", () => {
    const data = { user: { name: "Alice" } };
    const result = JSON_Path.retrieve([data, "user.name"]);
    expect(result).toBe("Alice");
  });

  it("resolves nested object access", () => {
    const data = { user: { address: { city: "Berlin" } } };
    const result = JSON_Path.retrieve([data, "user.address.city"]);
    expect(result).toBe("Berlin");
  });
});
