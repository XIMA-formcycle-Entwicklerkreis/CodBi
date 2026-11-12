import { describe, expect, it } from "@jest/globals";

import { Array_Slice } from "../../src/js/EPs/array.slice.js";

const base = ["a", "b", "c", "d", "e"];

describe("Array.Slice.retrieve", () => {
  it("returns the part from the beginning index to the end when only the beginning is given", () => {
    const input = [base, 2];
    const result = Array_Slice.retrieve(input as unknown as Array<unknown>);
    expect(result).toEqual(["c", "d", "e"]);
  });

  it("returns the part between beginning and end when both are given", () => {
    const input = [base, 1, 3];
    const result = Array_Slice.retrieve(input as unknown as Array<unknown>);
    expect(result).toEqual(["b", "c"]);
  });

  it("supports a negative beginning index", () => {
    const input = [base, -2];
    const result = Array_Slice.retrieve(input as unknown as Array<unknown>);
    expect(result).toEqual(["d", "e"]);
  });

  it("supports a negative end index", () => {
    const input = [base, 1, -1];
    const result = Array_Slice.retrieve(input as unknown as Array<unknown>);
    expect(result).toEqual(["b", "c", "d"]);
  });

  it("accepts indexes provided as string parameters", () => {
    const input = [base, "1", "4"];
    const result = Array_Slice.retrieve(input as unknown as Array<unknown>);
    expect(result).toEqual(["b", "c", "d"]);
  });

  it("returns an empty array when beginning equals end", () => {
    const input = [base, 2, 2];
    const result = Array_Slice.retrieve(input as unknown as Array<unknown>);
    expect(result).toEqual([]);
  });
});
