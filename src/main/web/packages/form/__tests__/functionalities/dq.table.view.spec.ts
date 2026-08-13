import { describe, expect, it } from "@jest/globals";

import { DQ_Table_View } from "../../src/js/Functionalities/dq.table.view.js";

// The JSON helpers are protected; expose them via a typed test-surface.
interface JsonHelpers {
  normalizeJson(raw: unknown): string;
  tryParseJson(raw: unknown): unknown | undefined;
  prettyPrintJson(raw: string): string;
  parseBooleanFlag(value: unknown, defaultValue: boolean): boolean;
  compactValue(value: unknown): string;
  summarizeObject(value: unknown): string;
  parseExcludedColumns(value: unknown): Set<string>;
  isColumnExcluded(column: { label: string; dataColumn: string }, excluded: Set<string>): boolean;
}

const helpers = DQ_Table_View as unknown as JsonHelpers;

describe("DQ_Table_View JSON-column handling", () => {
  describe("normalizeJson", () => {
    it("replaces a leading '[, ' with '[' before parsing", () => {
      expect(helpers.normalizeJson('[,{"a":1},{"b":2}]')).toBe('[{"a":1},{"b":2}]');
    });

    it("trims whitespace before normalizing the leading comma", () => {
      expect(helpers.normalizeJson('  [,"x","y"]  ')).toBe('["x","y"]');
    });

    it("leaves already-valid JSON arrays unchanged", () => {
      expect(helpers.normalizeJson('[{"a":1},{"b":2}]')).toBe('[{"a":1},{"b":2}]');
    });

    it("leaves non-array JSON unchanged", () => {
      expect(helpers.normalizeJson('{"a":1}')).toBe('{"a":1}');
    });

    it("leaves plain (non-JSON) values unchanged", () => {
      expect(helpers.normalizeJson("plain text")).toBe("plain text");
    });

    it("removes a leading comma even when separated by whitespace", () => {
      expect(helpers.normalizeJson('[ ,{"a":1},{"b":2}]')).toBe('[{"a":1},{"b":2}]');
    });

    it("removes multiple leading commas", () => {
      expect(helpers.normalizeJson('[,,{"a":1}]')).toBe('[{"a":1}]');
    });

    it("strips a UTF-8 BOM before parsing", () => {
      expect(helpers.normalizeJson('\uFEFF[{"a":1}]')).toBe('[{"a":1}]');
    });

    it("leaves valid arrays containing inner whitespace unchanged", () => {
      expect(helpers.normalizeJson('[ {"a":1}, {"b":2} ]')).toBe('[ {"a":1}, {"b":2} ]');
    });
  });

  describe("tryParseJson", () => {
    it("parses a JSON array with a leading comma", () => {
      expect(helpers.tryParseJson('[,{"a":1},{"b":2}]')).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it("parses a leading-comma array of primitives", () => {
      expect(helpers.tryParseJson('[,"x","y"]')).toEqual(["x", "y"]);
    });

    it("still parses ordinary valid JSON", () => {
      expect(helpers.tryParseJson('[{"a":1}]')).toEqual([{ a: 1 }]);
    });

    it("still returns undefined for non-JSON values", () => {
      expect(helpers.tryParseJson("plain text")).toBeUndefined();
    });

    it("parses an array whose leading comma is separated by whitespace", () => {
      expect(helpers.tryParseJson('[ ,{"a":1},{"b":2}]')).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it("accepts a value the DataQuery already delivered as a parsed array", () => {
      expect(helpers.tryParseJson([{ a: 1 }, { b: 2 }])).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it("accepts a value the DataQuery already delivered as a parsed object", () => {
      expect(helpers.tryParseJson({ a: 1 })).toEqual({ a: 1 });
    });
  });

  describe("prettyPrintJson", () => {
    it("pretty-prints a JSON array with a leading comma", () => {
      expect(helpers.prettyPrintJson('[,{"a":1}]')).toBe(JSON.stringify([{ a: 1 }], null, 2));
    });

    it("returns the raw value for unparseable input", () => {
      expect(helpers.prettyPrintJson("plain text")).toBe("plain text");
    });
  });

  describe("parseBooleanFlag", () => {
    it("defaults to true when the value is absent", () => {
      expect(helpers.parseBooleanFlag(undefined, true)).toBe(true);
    });

    it("defaults to true for an empty value", () => {
      expect(helpers.parseBooleanFlag("", true)).toBe(true);
    });

    it("treats 'true', '1' and 'yes' as true", () => {
      expect(helpers.parseBooleanFlag("true", true)).toBe(true);
      expect(helpers.parseBooleanFlag("1", true)).toBe(true);
      expect(helpers.parseBooleanFlag("yes", true)).toBe(true);
    });

    it("treats 'false', '0' and 'no' as false", () => {
      expect(helpers.parseBooleanFlag("false", true)).toBe(false);
      expect(helpers.parseBooleanFlag("0", true)).toBe(false);
      expect(helpers.parseBooleanFlag("no", true)).toBe(false);
    });

    it("is case-insensitive", () => {
      expect(helpers.parseBooleanFlag("FALSE", true)).toBe(false);
      expect(helpers.parseBooleanFlag("No", true)).toBe(false);
    });

    it("uses the provided default for unrecognized values", () => {
      expect(helpers.parseBooleanFlag("maybe", false)).toBe(false);
    });
  });

  describe("compactValue", () => {
    it("renders strings as quoted JSON", () => {
      expect(helpers.compactValue("Max")).toBe('"Max"');
    });

    it("renders numbers and booleans as-is", () => {
      expect(helpers.compactValue(30)).toBe("30");
      expect(helpers.compactValue(true)).toBe("true");
    });

    it("renders null as 'null'", () => {
      expect(helpers.compactValue(null)).toBe("null");
    });

    it("summarizes arrays by length", () => {
      expect(helpers.compactValue([1, 2, 3])).toBe("[3 items]");
      expect(helpers.compactValue([1])).toBe("[1 item]");
    });

    it("summarizes objects as {...}", () => {
      expect(helpers.compactValue({ a: 1 })).toBe("{...}");
    });
  });

  describe("summarizeObject", () => {
    it("shows only the first property when folded", () => {
      expect(helpers.summarizeObject({ name: "Max", age: 30 })).toBe('{ name: "Max", ... }');
    });

    it("renders an empty object as {}", () => {
      expect(helpers.summarizeObject({})).toBe("{}");
    });

    it("summarizes a nested array element by length", () => {
      expect(helpers.summarizeObject([{ a: 1 }, { b: 2 }])).toBe("[2 items]");
    });

    it("summarizes the first property even when it is an object", () => {
      expect(helpers.summarizeObject({ meta: { x: 1 }, name: "Max" })).toBe("{ meta: {...}, ... }");
    });
  });

  describe("parseExcludedColumns", () => {
    it("returns an empty set for an absent/empty value", () => {
      expect(helpers.parseExcludedColumns(undefined).size).toBe(0);
      expect(helpers.parseExcludedColumns("").size).toBe(0);
    });

    it("splits a CSV and trims each name", () => {
      expect([...helpers.parseExcludedColumns("Nachricht, Wichtige_Hinweise ,Note")]).toEqual([
        "nachricht",
        "wichtige_hinweise",
        "note",
      ]);
    });

    it("lowercases the names for case-insensitive matching", () => {
      expect(helpers.parseExcludedColumns("Nachricht").has("nachricht")).toBe(true);
    });

    it("ignores empty entries", () => {
      expect([...helpers.parseExcludedColumns("A,,B")]).toEqual(["a", "b"]);
    });
  });

  describe("isColumnExcluded", () => {
    const excluded = helpers.parseExcludedColumns("Nachricht, Wichtige_Hinweise");

    it("matches by datacolumn case-insensitively", () => {
      expect(helpers.isColumnExcluded({ label: "Message", dataColumn: "Nachricht" }, excluded)).toBe(true);
    });

    it("matches by label case-insensitively", () => {
      expect(helpers.isColumnExcluded({ label: "Wichtige_Hinweise", dataColumn: "WH" }, excluded)).toBe(true);
    });

    it("trims whitespace around the names", () => {
      expect(helpers.isColumnExcluded({ label: "  Nachricht  ", dataColumn: "x" }, excluded)).toBe(true);
    });

    it("returns false for columns not excluded", () => {
      expect(helpers.isColumnExcluded({ label: "Name", dataColumn: "Name" }, excluded)).toBe(false);
    });
  });
});
