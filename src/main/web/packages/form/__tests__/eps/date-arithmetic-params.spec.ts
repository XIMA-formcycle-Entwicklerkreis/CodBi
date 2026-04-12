import { describe, expect, it } from "@jest/globals";

import { processArithmeticParams } from "../../src/js/EPs/date.today.js";

describe("processArithmeticParams", () => {
  it("adds days to a date", () => {
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    const result = processArithmeticParams(date, ["+5d"]);
    expect(result.getDate()).toBe(20);
    expect(result.getMonth()).toBe(0);
    expect(result.getFullYear()).toBe(2024);
  });

  it("subtracts days from a date", () => {
    const date = new Date(2024, 0, 15);
    const result = processArithmeticParams(date, ["-5d"]);
    expect(result.getDate()).toBe(10);
  });

  it("adds months to a date", () => {
    const date = new Date(2024, 0, 15); // Jan 15
    const result = processArithmeticParams(date, ["+3m"]);
    expect(result.getMonth()).toBe(3); // April
    expect(result.getDate()).toBe(15);
  });

  it("subtracts months from a date", () => {
    const date = new Date(2024, 5, 15); // June 15
    const result = processArithmeticParams(date, ["-2m"]);
    expect(result.getMonth()).toBe(3); // April
  });

  it("adds years to a date", () => {
    const date = new Date(2024, 0, 1);
    const result = processArithmeticParams(date, ["+2y"]);
    expect(result.getFullYear()).toBe(2026);
  });

  it("subtracts years from a date", () => {
    const date = new Date(2024, 0, 1);
    const result = processArithmeticParams(date, ["-10y"]);
    expect(result.getFullYear()).toBe(2014);
  });

  it("applies multiple arithmetic operations", () => {
    const date = new Date(2024, 0, 1); // Jan 1, 2024
    const result = processArithmeticParams(date, ["+1d", "+1m", "+1y"]);
    expect(result.getDate()).toBe(2);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getFullYear()).toBe(2025);
  });

  it("handles day overflow across months", () => {
    const date = new Date(2024, 0, 30); // Jan 30
    const result = processArithmeticParams(date, ["+5d"]);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(4);
  });

  it("handles month overflow across years", () => {
    const date = new Date(2024, 10, 15); // November 15
    const result = processArithmeticParams(date, ["+3m"]);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getFullYear()).toBe(2025);
  });

  it("returns the same date object (mutated)", () => {
    const date = new Date(2024, 0, 1);
    const result = processArithmeticParams(date, ["+1d"]);
    expect(result).toBe(date);
  });
});
