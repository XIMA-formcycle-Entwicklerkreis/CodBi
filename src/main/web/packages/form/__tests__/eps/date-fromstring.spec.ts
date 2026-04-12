import { describe, expect, it } from "@jest/globals";

import { DATE_FromString } from "../../src/js/EPs/date.fromstring.js";

describe("DATE_FromString.retrieve", () => {
  it("converts a DD.MM.YYYY string to Date with default format", () => {
    const result = DATE_FromString.retrieve(["15.06.2024"]);
    expect(result).toHaveLength(1);
    const date = result[0] as Date;
    expect(date.getDate()).toBe(15);
    expect(date.getMonth()).toBe(5); // June is 0-indexed
    expect(date.getFullYear()).toBe(2024);
  });

  it("converts a date string with custom YYYY/MM/DD format", () => {
    const result = DATE_FromString.retrieve(["2024/03/25", "YYYY/MM/DD"]);
    const date = result[0] as Date;
    expect(date.getDate()).toBe(25);
    expect(date.getMonth()).toBe(2); // March
    expect(date.getFullYear()).toBe(2024);
  });

  it("converts a date string with DD-MM-YYYY format", () => {
    const result = DATE_FromString.retrieve(["01-12-2023", "DD-MM-YYYY"]);
    const date = result[0] as Date;
    expect(date.getDate()).toBe(1);
    expect(date.getMonth()).toBe(11); // December
    expect(date.getFullYear()).toBe(2023);
  });

  it("converts MM/DD/YYYY format", () => {
    const result = DATE_FromString.retrieve(["12/25/2024", "MM/DD/YYYY"]);
    const date = result[0] as Date;
    expect(date.getDate()).toBe(25);
    expect(date.getMonth()).toBe(11); // December
    expect(date.getFullYear()).toBe(2024);
  });
});
