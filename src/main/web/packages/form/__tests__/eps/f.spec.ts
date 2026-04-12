import { describe, expect, it } from "@jest/globals";

import { F } from "../../src/js/EPs/f.js";

describe("F.retrieve", () => {
  const pool = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
    { name: "Charlie", age: 30 },
  ];

  it("finds objects with a matching property value", () => {
    const result = F.retrieve(["age", 30, pool] as unknown as Array<unknown>);
    expect(result).toEqual([
      { name: "Alice", age: 30 },
      { name: "Charlie", age: 30 },
    ]);
  });

  it("finds a single matching object", () => {
    const result = F.retrieve(["name", "Bob", pool] as unknown as Array<unknown>);
    expect(result).toEqual([{ name: "Bob", age: 25 }]);
  });

  it("returns empty array when no match is found", () => {
    const result = F.retrieve(["name", "Dave", pool] as unknown as Array<unknown>);
    expect(result).toEqual([]);
  });

  it("matches string property values", () => {
    const data = [
      { status: "active", id: 1 },
      { status: "inactive", id: 2 },
      { status: "active", id: 3 },
    ];
    const result = F.retrieve(["status", "active", data] as unknown as Array<unknown>);
    expect(result).toEqual([
      { status: "active", id: 1 },
      { status: "active", id: 3 },
    ]);
  });

  it("handles empty pool array", () => {
    const result = F.retrieve(["name", "test", []] as unknown as Array<unknown>);
    expect(result).toEqual([]);
  });
});
