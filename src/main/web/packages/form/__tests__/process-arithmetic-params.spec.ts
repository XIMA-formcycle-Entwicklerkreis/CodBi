import { describe, it, expect } from "@jest/globals";
import { processArithmeticParams } from "../src/js/EPs/date.today.js";

describe("processArithmeticParams", () => {
  it("adds days", () => {
    const base = new Date(2025, 0, 1); // Jan 1
    const result = processArithmeticParams(base, ["+10d"]);
    expect(result.getDate()).toBe(11);
    expect(result.getMonth()).toBe(0);
  });

  it("subtracts days", () => {
    const base = new Date(2025, 0, 15); // Jan 15
    const result = processArithmeticParams(base, ["-5d"]);
    expect(result.getDate()).toBe(10);
  });

  it("adds months", () => {
    const base = new Date(2025, 0, 1); // Jan 1
    const result = processArithmeticParams(base, ["+3m"]);
    expect(result.getMonth()).toBe(3); // April
  });

  it("subtracts months", () => {
    const base = new Date(2025, 5, 15); // Jun 15
    const result = processArithmeticParams(base, ["-2m"]);
    expect(result.getMonth()).toBe(3); // April
  });

  it("adds years", () => {
    const base = new Date(2025, 0, 1);
    const result = processArithmeticParams(base, ["+5y"]);
    expect(result.getFullYear()).toBe(2030);
  });

  it("subtracts years", () => {
    const base = new Date(2025, 0, 1);
    const result = processArithmeticParams(base, ["-10y"]);
    expect(result.getFullYear()).toBe(2015);
  });

  it("handles multiple operations sequentially", () => {
    const base = new Date(2025, 0, 1);
    const result = processArithmeticParams(base, ["+1y", "+6m", "+15d"]);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(6); // July
    expect(result.getDate()).toBe(16);
  });

  it("handles day overflow into next month", () => {
    const base = new Date(2025, 0, 28); // Jan 28
    const result = processArithmeticParams(base, ["+5d"]);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(2);
  });

  it("handles month underflow into previous year", () => {
    const base = new Date(2025, 1, 15); // Feb 15
    const result = processArithmeticParams(base, ["-3m"]);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(10); // November
  });

  it("returns same date for empty params", () => {
    const base = new Date(2025, 5, 15);
    const result = processArithmeticParams(base, []);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(15);
  });

  it("mutates the input date", () => {
    const base = new Date(2025, 0, 1);
    const result = processArithmeticParams(base, ["+1d"]);
    expect(result).toBe(base); // same reference
    expect(base.getDate()).toBe(2);
  });
});
