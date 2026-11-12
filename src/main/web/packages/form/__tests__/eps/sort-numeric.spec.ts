import { describe, expect, it } from "@jest/globals";

import { Sort_Numeric } from "../../src/js/EPs/sort.numeric.js";

describe("Sort.Numeric.retrieve", () => {
  it("sorts ascending by a numeric property and returns the whole array", () => {
    const input = [
      [
        { name: "Haupt", sortierreihenfolge: 1 },
        { name: "Stellvertreter", sortierreihenfolge: 2 },
        { name: "Erster", sortierreihenfolge: 0 },
      ],
      "sortierreihenfolge",
    ];
    const result = Sort_Numeric.retrieve(input as unknown as Array<unknown>);
    expect(result).toEqual([
      { name: "Erster", sortierreihenfolge: 0 },
      { name: "Haupt", sortierreihenfolge: 1 },
      { name: "Stellvertreter", sortierreihenfolge: 2 },
    ]);
  });

  it("orders numeric values numerically, not lexicographically", () => {
    const input = [
      [
        { name: "Zweiter", sortierreihenfolge: 10 },
        { name: "Dritter", sortierreihenfolge: 3 },
        { name: "Erster", sortierreihenfolge: 2 },
      ],
      "sortierreihenfolge",
    ];
    const result = Sort_Numeric.retrieve(input as unknown as Array<unknown>);
    expect(result).toEqual([
      { name: "Erster", sortierreihenfolge: 2 },
      { name: "Dritter", sortierreihenfolge: 3 },
      { name: "Zweiter", sortierreihenfolge: 10 },
    ]);
  });

  it("treats a missing property as 0 when sorting", () => {
    const input = [
      [{ name: "MitWert", sortierreihenfolge: 5 }, { name: "OhneWert" }, { name: "Anfang", sortierreihenfolge: 0 }],
      "sortierreihenfolge",
    ];
    const result = Sort_Numeric.retrieve(input as unknown as Array<unknown>);
    expect(result).toEqual([
      { name: "OhneWert" },
      { name: "Anfang", sortierreihenfolge: 0 },
      { name: "MitWert", sortierreihenfolge: 5 },
    ]);
  });

  it("returns the array unchanged when only the array is provided", () => {
    const input = [[{ name: "B" }, { name: "A" }]];
    const result = Sort_Numeric.retrieve(input as unknown as Array<unknown>);
    expect(result).toEqual([{ name: "B" }, { name: "A" }]);
  });

  it("returns an empty array for an empty first parameter", () => {
    const input = [[], "sortierreihenfolge"];
    const result = Sort_Numeric.retrieve(input as unknown as Array<unknown>);
    expect(result).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const source = [
      { name: "B", sortierreihenfolge: 2 },
      { name: "A", sortierreihenfolge: 1 },
    ];
    const input = [source, "sortierreihenfolge"];
    Sort_Numeric.retrieve(input as unknown as Array<unknown>);
    expect(source).toEqual([
      { name: "B", sortierreihenfolge: 2 },
      { name: "A", sortierreihenfolge: 1 },
    ]);
  });
});
