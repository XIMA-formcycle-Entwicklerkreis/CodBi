import { describe, expect, it } from "@jest/globals";

import { DATE_Today } from "../../src/js/EPs/date.today.js";

describe("DATE_Today.retrieve", () => {
  it("returns today's date when NOW is specified", () => {
    const result = DATE_Today.retrieve(["NOW"]);
    const today = new Date();
    expect(result.getDate()).toBe(today.getDate());
    expect(result.getMonth()).toBe(today.getMonth());
    expect(result.getFullYear()).toBe(today.getFullYear());
  });

  it("handles lowercase now", () => {
    const result = DATE_Today.retrieve(["now"]);
    const today = new Date();
    expect(result.getFullYear()).toBe(today.getFullYear());
  });

  it("returns today's date when no params are given", () => {
    const result = DATE_Today.retrieve([]);
    const today = new Date();
    expect(result.getDate()).toBe(today.getDate());
  });

  it("adds days to today", () => {
    const result = DATE_Today.retrieve(["+1d"]);
    const expected = new Date();
    expected.setDate(expected.getDate() + 1);
    expect(result.getDate()).toBe(expected.getDate());
  });

  it("subtracts months from today", () => {
    const result = DATE_Today.retrieve(["-1m"]);
    const expected = new Date();
    expected.setMonth(expected.getMonth() - 1);
    expect(result.getMonth()).toBe(expected.getMonth());
  });

  it("applies multiple operations to today", () => {
    const result = DATE_Today.retrieve(["+1d", "+1m"]);
    const expected = new Date();
    expected.setDate(expected.getDate() + 1);
    expected.setMonth(expected.getMonth() + 1);
    expect(result.getDate()).toBe(expected.getDate());
    expect(result.getMonth()).toBe(expected.getMonth());
  });
});
