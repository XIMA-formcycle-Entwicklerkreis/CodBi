import { describe, expect, it } from "@jest/globals";

import { Date_Weekends } from "../../src/js/EPs/date.weekends.js";

describe("Date_Weekends EP", () => {
  it("returns weekend dates between two given dates", () => {
    // 01.01.2024 (Monday) → 14.01.2024 (Sunday)
    const result = Date_Weekends.retrieve(["01.01.2024", "14.01.2024"]);

    // Weekends in that range:
    //  06.01.2024 (Sat), 07.01.2024 (Sun), 13.01.2024 (Sat), 14.01.2024 (Sun)
    expect(result).toHaveLength(4);
    expect(result).toContain("06.01.2024");
    expect(result).toContain("07.01.2024");
    expect(result).toContain("13.01.2024");
    expect(result).toContain("14.01.2024");
  });

  it("returns empty array when range has no weekends", () => {
    // 01.01.2024 (Mon) → 05.01.2024 (Fri)
    const result = Date_Weekends.retrieve(["01.01.2024", "05.01.2024"]);

    expect(result).toEqual([]);
  });

  it("includes both Saturday and Sunday", () => {
    // 06.01.2024 (Sat) → 07.01.2024 (Sun)
    const result = Date_Weekends.retrieve(["06.01.2024", "07.01.2024"]);

    expect(result).toHaveLength(2);
  });

  it("handles begin == end on a weekend day", () => {
    // 06.01.2024 (Saturday)
    const result = Date_Weekends.retrieve(["06.01.2024", "06.01.2024"]);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe("06.01.2024");
  });

  it("handles begin == end on a weekday", () => {
    // 08.01.2024 (Monday)
    const result = Date_Weekends.retrieve(["08.01.2024", "08.01.2024"]);

    expect(result).toEqual([]);
  });

  it("formats dates in de-DE locale (DD.MM.YYYY)", () => {
    const result = Date_Weekends.retrieve(["06.01.2024", "06.01.2024"]);

    expect(result[0]).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
  });
});
