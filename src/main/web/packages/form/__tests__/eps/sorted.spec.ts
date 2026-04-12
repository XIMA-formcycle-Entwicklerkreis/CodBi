import { describe, expect, it } from "@jest/globals";

import { Sorted } from "../../src/js/EPs/sorted.js";

describe("Sorted.retrieve", () => {
  it("sorts an array of objects by a named property", () => {
    const input = [[{ name: "Charlie" }, { name: "Alice" }, { name: "Bob" }], "name"];
    const result = Sorted.retrieve(input as unknown as Array<unknown>);
    expect(result).toEqual([{ name: "Alice" }, { name: "Bob" }, { name: "Charlie" }]);
  });

  it("sorts case-insensitively when sorting by property", () => {
    const input = [[{ title: "banana" }, { title: "Apple" }, { title: "cherry" }], "title"];
    const result = Sorted.retrieve(input as unknown as Array<unknown>);
    expect(result).toEqual([{ title: "Apple" }, { title: "banana" }, { title: "cherry" }]);
  });

  it("returns equal elements in stable order", () => {
    const input = [
      [
        { name: "Alice", id: 1 },
        { name: "Alice", id: 2 },
      ],
      "name",
    ];
    const result = Sorted.retrieve(input as unknown as Array<unknown>);
    expect(result).toEqual([
      { name: "Alice", id: 1 },
      { name: "Alice", id: 2 },
    ]);
  });

  it("handles single-element arrays", () => {
    const input = [[{ name: "Solo" }], "name"];
    const result = Sorted.retrieve(input as unknown as Array<unknown>);
    expect(result).toEqual([{ name: "Solo" }]);
  });
});
