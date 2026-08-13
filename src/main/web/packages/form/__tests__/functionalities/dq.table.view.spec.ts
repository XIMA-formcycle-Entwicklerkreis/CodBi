import { describe, expect, it } from "@jest/globals";

import { DQ_Table_View } from "../../src/js/Functionalities/dq.table.view.js";

// The JSON helpers are protected; expose them via a typed test-surface.
interface JsonHelpers {
  normalizeJson(raw: string): string;
  tryParseJson(raw: string): unknown | undefined;
  prettyPrintJson(raw: string): string;
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
  });

  describe("prettyPrintJson", () => {
    it("pretty-prints a JSON array with a leading comma", () => {
      expect(helpers.prettyPrintJson('[,{"a":1}]')).toBe(JSON.stringify([{ a: 1 }], null, 2));
    });

    it("returns the raw value for unparseable input", () => {
      expect(helpers.prettyPrintJson("plain text")).toBe("plain text");
    });
  });
});
