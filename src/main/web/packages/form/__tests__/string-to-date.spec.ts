import { describe, it, expect } from "@jest/globals";
import { stringToDate } from "../src/js/global-scope.js";

describe("stringToDate", () => {
  it("parses DD.MM.YYYY (default-like format)", () => {
    const result = stringToDate("25.12.2024", "DD.MM.YYYY");
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(2024);
    expect(result!.getMonth()).toBe(11); // 0-indexed
    expect(result!.getDate()).toBe(25);
  });

  it("parses YYYY-MM-DD format", () => {
    const result = stringToDate("2024-06-15", "YYYY-MM-DD");
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(2024);
    expect(result!.getMonth()).toBe(5);
    expect(result!.getDate()).toBe(15);
  });

  it("parses MM/DD/YYYY format", () => {
    const result = stringToDate("03/28/2025", "MM/DD/YYYY");
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(2025);
    expect(result!.getMonth()).toBe(2);
    expect(result!.getDate()).toBe(28);
  });

  it("returns null for non-numeric input", () => {
    const result = stringToDate("abc", "DD.MM.YYYY");
    expect(result).toBeNull();
  });

  it("returns null for empty string", () => {
    const result = stringToDate("", "DD.MM.YYYY");
    expect(result).toBeNull();
  });

  it("returns null if format missing required parts", () => {
    // Format only has DD — no year or month
    const result = stringToDate("25", "DD");
    expect(result).toBeNull();
  });

  it("uses default format dd-mm-yyyy when omitted", () => {
    const result = stringToDate("15-06-2024");
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(2024);
    expect(result!.getMonth()).toBe(5);
    expect(result!.getDate()).toBe(15);
  });

  it("handles single-digit day and month", () => {
    const result = stringToDate("1.2.2023", "DD.MM.YYYY");
    expect(result).toBeInstanceOf(Date);
    expect(result!.getDate()).toBe(1);
    expect(result!.getMonth()).toBe(1);
  });

  it("handles leap year Feb 29", () => {
    const result = stringToDate("29.02.2024", "DD.MM.YYYY");
    expect(result).toBeInstanceOf(Date);
    expect(result!.getDate()).toBe(29);
    expect(result!.getMonth()).toBe(1);
  });

  it("is case-insensitive on format", () => {
    const result = stringToDate("01.06.2025", "dd.mm.yyyy");
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(2025);
  });
});
