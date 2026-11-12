import { describe, expect, it } from "@jest/globals";

import { Array_Wrap } from "../../src/js/EPs/array.wrap.js";

describe("Array.Wrap.retrieve", () => {
  it("wraps an object into a single-element array", () => {
    const result = Array_Wrap.retrieve([{ name: "A" }]);
    expect(result).toEqual([{ name: "A" }]);
  });

  it("wraps a primitive value into a single-element array", () => {
    const result = Array_Wrap.retrieve(["hello"]);
    expect(result).toEqual(["hello"]);
  });

  it("returns an already-array value unchanged", () => {
    const result = Array_Wrap.retrieve([[1, 2, 3]]);
    expect(result).toEqual([1, 2, 3]);
  });

  it("wraps a null value", () => {
    const result = Array_Wrap.retrieve([null]);
    expect(result).toEqual([null]);
  });
});
