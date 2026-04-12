import { describe, expect, it } from "@jest/globals";

import { DATE_Arithmetic } from "../../src/js/EPs/date.arithmetic.js";

describe("DATE_Arithmetic.retrieve", () => {
  it("parses a date and adds days", () => {
    const result = DATE_Arithmetic.retrieve(["01.01.2024", "+5d"]);

    expect(result).toBeInstanceOf(Date);
    expect(result.getDate()).toBe(6);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getFullYear()).toBe(2024);
  });

  it("parses a date and subtracts months", () => {
    const result = DATE_Arithmetic.retrieve(["15.03.2024", "-2m"]);

    expect(result).toBeInstanceOf(Date);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getFullYear()).toBe(2024);
  });

  it("parses a date and adds years", () => {
    const result = DATE_Arithmetic.retrieve(["01.06.2020", "+3y"]);

    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2023);
  });

  it("handles explicit format and operation", () => {
    // params[1] has no +/-, so it's treated as format; operation starts at params[2]
    const result = DATE_Arithmetic.retrieve(["2024/01/15", "YYYY/MM/DD", "+10d"]);

    expect(result).toBeInstanceOf(Date);
    expect(result.getDate()).toBe(25);
    expect(result.getMonth()).toBe(0);
  });

  it("applies multiple operations", () => {
    const result = DATE_Arithmetic.retrieve(["01.01.2024", "+1d", "+1m", "+1y"]);

    expect(result).toBeInstanceOf(Date);
    expect(result.getDate()).toBe(2);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getFullYear()).toBe(2025);
  });
});
