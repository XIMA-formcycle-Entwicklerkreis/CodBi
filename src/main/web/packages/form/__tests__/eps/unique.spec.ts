import { describe, expect, it } from "@jest/globals";

import { removeDuplicates } from "../../src/js/Functionalities/ldap.autocomplete.js";
import { Unique } from "../../src/js/EPs/unique.js";

describe("removeDuplicates", () => {
  it("removes duplicate primitives from an array", () => {
    const result = removeDuplicates([1, 2, 2, 3, 3, 3]);
    expect(result).toEqual([1, 2, 3]);
  });

  it("removes duplicate strings", () => {
    const result = removeDuplicates(["a", "b", "a", "c", "b"]);
    expect(result).toEqual(["a", "b", "c"]);
  });

  it("handles empty arrays", () => {
    const result = removeDuplicates([]);
    expect(result).toEqual([]);
  });

  it("handles array with no duplicates", () => {
    const result = removeDuplicates([1, 2, 3]);
    expect(result).toEqual([1, 2, 3]);
  });

  it("removes duplicates by property", () => {
    const data = [
      { name: "Alice", id: 1 },
      { name: "Bob", id: 2 },
      { name: "Alice", id: 3 },
    ];
    const result = removeDuplicates(data, "name");
    expect(result).toEqual([
      { name: "Alice", id: 1 },
      { name: "Bob", id: 2 },
    ]);
  });

  it("keeps first occurrence when filtering by property", () => {
    const data = [
      { key: "x", value: "first" },
      { key: "x", value: "second" },
    ];
    const result = removeDuplicates(data, "key");
    expect(result).toEqual([{ key: "x", value: "first" }]);
  });

  it("handles all unique items when filtering by property", () => {
    const data = [
      { name: "A", id: 1 },
      { name: "B", id: 2 },
      { name: "C", id: 3 },
    ];
    const result = removeDuplicates(data, "name");
    expect(result).toEqual(data);
  });
});

describe("Unique.retrieve", () => {
  it("removes duplicates by property when property is specified", () => {
    const data = [
      { name: "A", id: 1 },
      { name: "B", id: 2 },
      { name: "A", id: 3 },
    ];
    const result = Unique.retrieve([data, "name"]);
    expect(result).toEqual([
      { name: "A", id: 1 },
      { name: "B", id: 2 },
    ]);
  });
});
