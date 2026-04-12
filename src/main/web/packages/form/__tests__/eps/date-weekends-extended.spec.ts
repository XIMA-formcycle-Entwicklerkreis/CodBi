import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

describe("Date.Weekends EP — extended", () => {
  let Date_Weekends: any;

  beforeEach(async () => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    const mod = await import("../../src/js/EPs/date.weekends.js");
    Date_Weekends = mod.Date_Weekends;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
  });

  it("returns weekends for a single-week range", () => {
    // Mon Jun 9 2025 to Sun Jun 15 2025
    const result: string[] = Date_Weekends.retrieve(["09.06.2025", "15.06.2025"]);
    // Sat=14, Sun=15
    expect(result).toContain("14.06.2025");
    expect(result).toContain("15.06.2025");
    expect(result.length).toBe(2);
  });

  it("returns empty array when range has no weekends", () => {
    // Mon Jun 9 2025 to Fri Jun 13 2025
    const result: string[] = Date_Weekends.retrieve(["09.06.2025", "13.06.2025"]);
    expect(result.length).toBe(0);
  });

  it("includes both Saturday and Sunday as weekends", () => {
    // Sat Jun 7 to Sun Jun 8 2025
    const result: string[] = Date_Weekends.retrieve(["07.06.2025", "08.06.2025"]);
    expect(result.length).toBe(2);
  });

  it("returns single day if start = end and it's a weekend", () => {
    // Sat Jun 7 2025
    const result: string[] = Date_Weekends.retrieve(["07.06.2025", "07.06.2025"]);
    expect(result.length).toBe(1);
  });

  it("returns empty if start = end and it's a weekday", () => {
    // Mon Jun 9 2025
    const result: string[] = Date_Weekends.retrieve(["09.06.2025", "09.06.2025"]);
    expect(result.length).toBe(0);
  });
});
