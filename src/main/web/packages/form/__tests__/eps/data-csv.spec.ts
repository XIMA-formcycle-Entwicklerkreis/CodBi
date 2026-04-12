import { describe, expect, it } from "@jest/globals";

import { Data_CSV } from "../../src/js/EPs/data.csv.js";

describe("Data_CSV.retrieve", () => {
  it("splits a single CSV string into an array", () => {
    const result = Data_CSV.retrieve(["a,b,c"]);
    expect(result).toEqual(["a", "b", "c"]);
  });

  it("handles multiple CSV strings", () => {
    const result = Data_CSV.retrieve(["a,b", "c,d"]);
    expect(result).toEqual(["a", "b", "c", "d"]);
  });

  it("handles non-string elements by passing them through", () => {
    const obj = { key: "value" };
    const result = Data_CSV.retrieve(["a,b", obj as unknown as string]);
    expect(result).toEqual(["a", "b", obj]);
  });

  it("handles a single value with no commas", () => {
    const result = Data_CSV.retrieve(["hello"]);
    expect(result).toEqual(["hello"]);
  });

  it("handles empty strings between commas", () => {
    const result = Data_CSV.retrieve(["a,,b"]);
    expect(result).toEqual(["a", "", "b"]);
  });

  it("handles trailing commas", () => {
    const result = Data_CSV.retrieve(["a,b,"]);
    expect(result).toEqual(["a", "b", ""]);
  });
});
