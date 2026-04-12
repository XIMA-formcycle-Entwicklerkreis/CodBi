import { describe, expect, it } from "@jest/globals";

import { I } from "../../src/js/EPs/i.js";

describe("I.retrieve", () => {
  it("gets element at index 0 from an array", () => {
    const result = I.retrieve(["0", ["a", "b", "c"]] as unknown as Array<string>);
    expect(result).toBe("a");
  });

  it("gets element at index 2 from an array", () => {
    const result = I.retrieve(["2", ["x", "y", "z"]] as unknown as Array<string>);
    expect(result).toBe("z");
  });

  it("gets element at index 1", () => {
    const result = I.retrieve(["1", ["first", "second", "third"]] as unknown as Array<string>);
    expect(result).toBe("second");
  });

  it("returns the value itself when not an array and index is 0", () => {
    const result = I.retrieve(["0", "singleValue"] as unknown as Array<string>);
    expect(result).toBe("singleValue");
  });

  it("throws when non-array with non-zero index", () => {
    expect(() => {
      I.retrieve(["1", "singleValue"] as unknown as Array<string>);
    }).toThrow();
  });

  it("handles index with whitespace", () => {
    const result = I.retrieve([" 0 ", ["a", "b"]] as unknown as Array<string>);
    expect(result).toBe("a");
  });
});
