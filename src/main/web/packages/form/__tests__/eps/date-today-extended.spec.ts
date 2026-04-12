import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

describe("Date.Today EP", () => {
  let DATE_Today: any;

  beforeEach(async () => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    const mod = await import("../../src/js/EPs/date.today.js");
    DATE_Today = mod.DATE_Today;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
  });

  it("returns today for NOW keyword", () => {
    const result: Date = DATE_Today.retrieve(["NOW"]);
    const today = new Date();
    expect(result.getFullYear()).toBe(today.getFullYear());
    expect(result.getMonth()).toBe(today.getMonth());
    expect(result.getDate()).toBe(today.getDate());
  });

  it("NOW is case insensitive", () => {
    const result: Date = DATE_Today.retrieve(["now"]);
    const today = new Date();
    expect(result.getDate()).toBe(today.getDate());
  });

  it("returns today for empty params", () => {
    const result: Date = DATE_Today.retrieve([]);
    const today = new Date();
    expect(result.getDate()).toBe(today.getDate());
  });

  it("adds days to today", () => {
    const result: Date = DATE_Today.retrieve(["+1d"]);
    const expected = new Date();
    expected.setDate(expected.getDate() + 1);
    expect(result.getDate()).toBe(expected.getDate());
  });

  it("subtracts months from today", () => {
    const result: Date = DATE_Today.retrieve(["-1m"]);
    const expected = new Date();
    expected.setMonth(expected.getMonth() - 1);
    expect(result.getMonth()).toBe(expected.getMonth());
  });

  it("adds years to today", () => {
    const result: Date = DATE_Today.retrieve(["+2y"]);
    const today = new Date();
    expect(result.getFullYear()).toBe(today.getFullYear() + 2);
  });

  it("handles combined arithmetic operations", () => {
    const result: Date = DATE_Today.retrieve(["+1d", "+1m", "+1y"]);
    const expected = new Date();
    expected.setDate(expected.getDate() + 1);
    expected.setMonth(expected.getMonth() + 1);
    expected.setFullYear(expected.getFullYear() + 1);
    expect(result.getFullYear()).toBe(expected.getFullYear());
    expect(result.getMonth()).toBe(expected.getMonth());
    expect(result.getDate()).toBe(expected.getDate());
  });
});
