import { describe, expect, it } from "@jest/globals";

import { Data_Join } from "../../src/js/EPs/data.join.js";

describe("Data_Join.retrieve", () => {
  it("joins two objects into one", () => {
    const result = Data_Join.retrieve([{ a: 1 }, { b: 2 }]);
    expect(result).toEqual([{ a: 1, b: 2 }]);
  });

  it("later objects override earlier properties", () => {
    const result = Data_Join.retrieve([{ a: 1, b: 2 }, { b: 3 }]);
    expect(result).toEqual([{ a: 1, b: 3 }]);
  });

  it("joins a single object", () => {
    const result = Data_Join.retrieve([{ x: "hello" }]);
    expect(result).toEqual([{ x: "hello" }]);
  });

  it("joins three objects", () => {
    const result = Data_Join.retrieve([{ a: 1 }, { b: 2 }, { c: 3 }]);
    expect(result).toEqual([{ a: 1, b: 2, c: 3 }]);
  });

  it("handles nested objects", () => {
    const nested = { inner: [1, 2, 3] };
    const result = Data_Join.retrieve([{ a: 1 }, nested]);
    expect(result).toEqual([{ a: 1, inner: [1, 2, 3] }]);
  });
});
