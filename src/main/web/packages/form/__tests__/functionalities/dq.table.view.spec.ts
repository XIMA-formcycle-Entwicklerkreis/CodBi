import { describe, expect, it, jest } from "@jest/globals";

import { DQ_Table_View } from "../../src/js/Functionalities/dq.table.view.js";

/** A single URL-part replacement pair as handled by the functionality. */
interface TestUrlReplacement {
  from: string;
  to: string;
}

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
  parseUrlReplacements(partToReplace: unknown, replacement: unknown): TestUrlReplacement[];
  applyUrlReplacements(url: string, replacements: TestUrlReplacement[]): string;
  replaceUrlsInText(text: string, replacements: TestUrlReplacement[]): string;
  renderTextCell(td: HTMLTableCellElement, raw: string, replacements?: TestUrlReplacement[]): void;
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

  describe("parseUrlReplacements", () => {
    it("returns an empty list when only one of the two parameters is set", () => {
      expect(helpers.parseUrlReplacements("https://intern.example", undefined)).toEqual([]);
      expect(helpers.parseUrlReplacements(undefined, "https://public.example")).toEqual([]);
      expect(helpers.parseUrlReplacements("", "")).toEqual([]);
    });

    it("combines both CSVs by position", () => {
      expect(helpers.parseUrlReplacements("a,b", "x,y")).toEqual([
        { from: "a", to: "x" },
        { from: "b", to: "y" },
      ]);
    });

    it("only uses as many pairs as the shorter CSV provides", () => {
      expect(helpers.parseUrlReplacements("a,b,c", "x")).toEqual([{ from: "a", to: "x" }]);
    });

    it("keeps an intentionally empty replacement (removal of the part)", () => {
      expect(helpers.parseUrlReplacements("a,b", "x,")).toEqual([
        { from: "a", to: "x" },
        { from: "b", to: "" },
      ]);
    });

    it("trims the entries and skips empty 'from' entries", () => {
      expect(helpers.parseUrlReplacements(" a , ,b ", " x , y , z ")).toEqual([
        { from: "a", to: "x" },
        { from: "b", to: "z" },
      ]);
    });

    it("accepts pre-split arrays as delivered by the attribute-processor", () => {
      expect(helpers.parseUrlReplacements(["a", "b"], ["x", "y"])).toEqual([
        { from: "a", to: "x" },
        { from: "b", to: "y" },
      ]);
    });
  });

  describe("applyUrlReplacements", () => {
    it("returns the URL unchanged without replacements", () => {
      expect(helpers.applyUrlReplacements("https://intern.example/x", [])).toBe("https://intern.example/x");
    });

    it("replaces all occurrences of a part", () => {
      const replacements = helpers.parseUrlReplacements("example", "test");

      expect(helpers.applyUrlReplacements("https://example.example/x?example=1", replacements)).toBe(
        "https://test.test/x?test=1",
      );
    });

    it("pairs the CSVs in order", () => {
      const replacements = helpers.parseUrlReplacements(
        "https://intern.example,http://intern.example",
        "https://a.example,https://b.example",
      );

      expect(helpers.applyUrlReplacements("https://intern.example/x", replacements)).toBe("https://a.example/x");
      expect(helpers.applyUrlReplacements("http://intern.example/x", replacements)).toBe("https://b.example/x");
    });

    it("treats characters such as '.' literally instead of as RegExp syntax", () => {
      const replacements = helpers.parseUrlReplacements("a.b", "c.d");

      expect(helpers.applyUrlReplacements("https://axb.example", replacements)).toBe("https://axb.example");
      expect(helpers.applyUrlReplacements("https://a.b.example", replacements)).toBe("https://c.d.example");
    });

    it("removes a part when its replacement is empty", () => {
      // A trailing comma in the replacement-CSV explicitly keeps the second replacement empty (= remove the part).
      const replacements = helpers.parseUrlReplacements("nomatch,?fcpuid=", "x,");

      expect(helpers.applyUrlReplacements("https://a.example/provide/?fcpuid=1234", replacements)).toBe(
        "https://a.example/provide/1234",
      );
    });
  });

  describe("replaceUrlsInText", () => {
    it("only rewrites the URLs, not the surrounding text", () => {
      const replacements = helpers.parseUrlReplacements("intern.example", "public.example");

      expect(helpers.replaceUrlsInText("See https://intern.example/x for details.", replacements)).toBe(
        "See https://public.example/x for details.",
      );
    });

    it("leaves text without a URL untouched", () => {
      const replacements = helpers.parseUrlReplacements("intern.example", "public.example");

      expect(helpers.replaceUrlsInText("Max Mustermann", replacements)).toBe("Max Mustermann");
    });

    it("returns the text unchanged without replacements", () => {
      expect(helpers.replaceUrlsInText("See https://intern.example/x", [])).toBe("See https://intern.example/x");
    });
  });

  describe("renderTextCell", () => {
    it("renders a plain value without a URL as plain text", () => {
      const td = document.createElement("td");

      helpers.renderTextCell(td, "Max Mustermann");
      expect(td.textContent).toBe("Max Mustermann");
      expect(td.querySelector("a")).toBeNull();
    });

    it("renders an https URL as a clickable link", () => {
      const td = document.createElement("td");

      helpers.renderTextCell(td, "https://acme.example/x");
      const anchor = td.querySelector("a")!;

      expect(anchor.href).toBe("https://acme.example/x");
      expect(anchor.textContent).toBe("https://acme.example/x");
      expect(anchor.target).toBe("_blank");
      expect(anchor.rel).toContain("noopener");
    });

    it("keeps surrounding text when a URL is embedded in it", () => {
      const td = document.createElement("td");

      helpers.renderTextCell(td, "See https://acme.example/x for details.");
      expect(td.textContent).toBe("See https://acme.example/x for details.");

      const anchor = td.querySelector("a")!;

      expect(anchor.href).toBe("https://acme.example/x");
    });

    it("turns multiple URLs in one cell into links", () => {
      const td = document.createElement("td");

      helpers.renderTextCell(td, "https://a.example https://b.example");
      const anchors = td.querySelectorAll("a");

      expect(anchors.length).toBe(2);
      // Compare the literal attribute: the `href` property is canonicalized by the URL parser (adds a trailing "/").
      expect(anchors[0].getAttribute("href")).toBe("https://a.example");
      expect(anchors[1].getAttribute("href")).toBe("https://b.example");
    });

    it("prefixes bare www. links with http://", () => {
      const td = document.createElement("td");

      helpers.renderTextCell(td, "www.acme.example");
      const anchor = td.querySelector("a")!;

      expect(anchor.getAttribute("href")).toBe("http://www.acme.example");
    });

    it("treats a non-string value as text and renders it", () => {
      const td = document.createElement("td");

      helpers.renderTextCell(td, "30" as unknown as string);
      expect(td.textContent).toBe("30");
      expect(td.querySelector("a")).toBeNull();
    });

    it("does not match a protocol-less domain as a link", () => {
      const td = document.createElement("td");

      helpers.renderTextCell(td, "acme.example");
      expect(td.querySelector("a")).toBeNull();
      expect(td.textContent).toBe("acme.example");
    });

    it("keeps trailing punctuation outside the link", () => {
      const td = document.createElement("td");

      helpers.renderTextCell(td, "Visit https://a.example, please.");
      const anchor = td.querySelector("a")!;

      expect(anchor.getAttribute("href")).toBe("https://a.example");
      expect(anchor.textContent).toBe("https://a.example");
      expect(td.textContent).toBe("Visit https://a.example, please.");
    });

    it("renders a same-origin form-provide link as a normal link", () => {
      const td = document.createElement("td");
      const formProvideUrl = `${window.location.origin}/xxxx/form/provide/2602/?fcpuid=008974c0-e641-4919-8ba4-1cd29c0cc0c7`;

      helpers.renderTextCell(td, formProvideUrl);
      const anchor = td.querySelector("a")!;

      expect(anchor.href).toBe(formProvideUrl);
      expect(anchor.getAttribute("data-url")).toBeNull();
      expect(anchor.textContent).toBe(formProvideUrl);
    });

    it("renders an inbox-review link that carries an fcpuid query parameter as a normal link", () => {
      const td = document.createElement("td");
      const reviewUrl =
        "https://forms.ansbach.de/frontend-server/inbox/review.xhtml?fcpuid=2caca488-b46d-47a1-b373-94e50a2ec2e2";

      helpers.renderTextCell(td, reviewUrl);
      const anchor = td.querySelector("a")!;

      expect(anchor.href).toBe(reviewUrl);
      expect(anchor.getAttribute("data-url")).toBeNull();
      expect(anchor.textContent).toBe(reviewUrl);
    });

    it("applies the URL-part replacements to the link text and href", () => {
      const td = document.createElement("td");
      const replacements = helpers.parseUrlReplacements("https://intern.example", "https://public.example");

      helpers.renderTextCell(td, "See https://intern.example/x for details.", replacements);
      const anchor = td.querySelector("a")!;

      expect(anchor.getAttribute("href")).toBe("https://public.example/x");
      expect(anchor.textContent).toBe("https://public.example/x");
      expect(td.textContent).toBe("See https://public.example/x for details.");
    });

    it("applies multiple replacements to multiple URLs in one cell", () => {
      const td = document.createElement("td");
      const replacements = helpers.parseUrlReplacements("a.example,b.example", "x.example,y.example");

      helpers.renderTextCell(td, "https://a.example https://b.example", replacements);
      const anchors = td.querySelectorAll("a");

      expect(anchors[0].getAttribute("href")).toBe("https://x.example");
      expect(anchors[1].getAttribute("href")).toBe("https://y.example");
    });

    it("keeps a multi-parameter query string inside the link (does not truncate at &)", () => {
      const td = document.createElement("td");
      const url = "https://alpha/beta/form-management/designer/1010?vn=1&client=form-management&pid=1010";

      helpers.renderTextCell(td, url);
      const anchor = td.querySelector("a")!;

      expect(anchor.getAttribute("href")).toBe(url);
      expect(anchor.textContent).toBe(url);
      expect(td.textContent).toBe(url);
    });

    it("applies the URL-part replacement to the whole URL including & query params", () => {
      const td = document.createElement("td");
      const replacements = helpers.parseUrlReplacements("https://alpha/beta", "https://gamma/jojo");

      helpers.renderTextCell(
        td,
        "https://alpha/beta/form-management/designer/1010?vn=1&client=form-management&pid=1010",
        replacements,
      );
      const anchor = td.querySelector("a")!;

      expect(anchor.getAttribute("href")).toBe(
        "https://gamma/jojo/form-management/designer/1010?vn=1&client=form-management&pid=1010",
      );
      expect(anchor.textContent).toBe(
        "https://gamma/jojo/form-management/designer/1010?vn=1&client=form-management&pid=1010",
      );
    });

    it("renders without replacements when none are given", () => {
      const td = document.createElement("td");

      helpers.renderTextCell(td, "https://intern.example/x");
      expect(td.querySelector("a")!.getAttribute("href")).toBe("https://intern.example/x");
    });

    it("keeps the real href and does not intercept the click", () => {
      const td = document.createElement("td");

      helpers.renderTextCell(td, "https://acme.example/x");
      const anchor = td.querySelector("a")!;
      const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);

      anchor.dispatchEvent(new MouseEvent("click", { cancelable: true, bubbles: true }));

      expect(anchor.href).toBe("https://acme.example/x");
      // No `window.open` interception — the browser's native link handling applies.
      expect(openSpy).not.toHaveBeenCalled();
      openSpy.mockRestore();
    });
  });
});
