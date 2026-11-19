// Tests for the pure CSS value codec behind the CSS parameter editor.
//
// The two CodBi specifics covered here are the ones that silently corrupt a value when they are
// wrong: the `^` escape (commas would otherwise turn the value into an ARRAY) and the angle-bracket
// dialect HTML.CSS requires (`<` → `{`, `>` → `}`).

import { describe, expect, it } from "@jest/globals";

import {
  cssKindOf,
  cssNeedsEscape,
  cssValueSummary,
  decodeCssValue,
  dialectToBraces,
  encodeCssValue,
  extractPlaceholders,
  formatCss,
  isKeyframeSteps,
  lintCss,
  minifyCss,
  parseClassList,
  parseCssRules,
  serializeCssRules,
  splitDeclarations,
} from "../src/js/CssValueCodec.js";

describe("CssValueCodec — kind resolution", () => {
  it("defaults a css parameter to the stylesheet kind", () => {
    expect(cssKindOf({ type: "css" })).toBe("stylesheet");
    expect(cssKindOf(undefined)).toBe("stylesheet");
  });

  it("honours an explicit cssKind and the selector type", () => {
    expect(cssKindOf({ type: "css", cssKind: "classes" })).toBe("classes");
    expect(cssKindOf({ type: "css", cssKind: "declarations" })).toBe("declarations");
    expect(cssKindOf({ type: "selector" })).toBe("selector");
    expect(cssKindOf({ type: "css", cssKind: "bogus" })).toBe("stylesheet");
  });
});

describe("CssValueCodec — the `^` escape", () => {
  it("strips the escape prefix and reports it", () => {
    expect(decodeCssValue("^a<color:red>")).toEqual({ text: "a<color:red>", escaped: true });
    expect(decodeCssValue("a<color:red>")).toEqual({ text: "a<color:red>", escaped: false });
  });

  it("re-joins a value that was already split into an array", () => {
    expect(decodeCssValue(["rgba(0", "0", "0", ".5)"]).text).toBe("rgba(0,0,0,.5)");
  });

  it("undoes the runtime brace protection", () => {
    expect(decodeCssValue("^a °{ color: red °}").text).toBe("a { color: red }");
  });

  it("detects a comma as the escape trigger", () => {
    expect(cssNeedsEscape("rgba(0, 0, 0, .5)")).toBe(true);
    expect(cssNeedsEscape("color: red")).toBe(false);
  });

  it("prefixes ^ exactly when the stored value contains a comma", () => {
    expect(encodeCssValue("a, b", "selector")).toBe("^a, b");
    expect(encodeCssValue("a b", "selector")).toBe("a b");
    expect(encodeCssValue("color: red; background: rgba(0,0,0,.5);", "declarations")).toBe(
      "^color: red; background: rgba(0,0,0,.5);",
    );
  });
});

describe("CssValueCodec — angle bracket dialect", () => {
  it("stores a stylesheet with < and > instead of braces", () => {
    expect(encodeCssValue("body { color: red; }", "stylesheet")).toBe("body < color: red; >");
  });

  it("keeps the braces when the caller opts out", () => {
    expect(encodeCssValue("body { color: red; }", "stylesheet", true)).toBe("body { color: red; }");
  });

  it("converts the stored form back to braces for display", () => {
    expect(dialectToBraces("body < color: red; >")).toBe("body { color: red; }");
  });

  it("refuses to convert when a > is a child combinator", () => {
    expect(dialectToBraces("a > b < color: red; >")).toBe("a > b < color: red; >");
  });
});

describe("CssValueCodec — declarations and rules", () => {
  it("keeps commas inside functions and strings intact", () => {
    const declarations = splitDeclarations('background: rgba(0,0,0,.5); content: "a;b"; color: red !important');

    expect(declarations).toHaveLength(3);
    expect(declarations[0]).toEqual({ property: "background", value: "rgba(0,0,0,.5)", important: false });
    expect(declarations[1].value).toBe('"a;b"');
    expect(declarations[2]).toEqual({ property: "color", value: "red", important: true });
  });

  it("parses top level rules and keeps nested blocks inside their parent", () => {
    const rules = parseCssRules("a{color:red}\n@media print{b{color:blue}}");

    expect(rules).toHaveLength(2);
    expect(rules[0]).toEqual({ selector: "a", body: "color:red" });
    expect(rules[1].selector).toBe("@media print");
    expect(rules[1].body).toBe("b{color:blue}");
  });

  it("round-trips a rule list", () => {
    const text = serializeCssRules([
      { selector: "a", body: "color: red;" },
      { selector: "b", body: "color: blue;" },
    ]);

    expect(parseCssRules(text)).toEqual([
      { selector: "a", body: "color: red;" },
      { selector: "b", body: "color: blue;" },
    ]);
  });

  it("formats and minifies", () => {
    expect(formatCss("a{color:red;background:blue}")).toBe("a {\n  color: red;\n  background: blue;\n}");
    expect(minifyCss("a { color : red ; }")).toBe("a{color:red}");
  });
});

describe("CssValueCodec — classes and placeholders", () => {
  it("normalizes a class list", () => {
    expect(parseClassList(".a b, #c")).toEqual(["a", "b"]);
    expect(parseClassList("a a b")).toEqual(["a", "b"]);
  });

  it("finds the placeholder tokens", () => {
    expect(extractPlaceholders("color: ACCENT; background: ACCENT_DM; width: 10px;")).toEqual(["ACCENT", "ACCENT_DM"]);
  });
});

describe("CssValueCodec — linting", () => {
  it("reports a missing closing brace", () => {
    const issues = lintCss("a { color: red;", "stylesheet");

    expect(issues.some((issue) => issue.severity === "error" && issue.message.includes("closing '}' missing"))).toBe(
      true,
    );
  });

  it("warns about an unknown property", () => {
    const issues = lintCss("a { colr: red; }", "stylesheet");

    expect(issues.some((issue) => issue.message.includes('Unknown property "colr"'))).toBe(true);
  });

  it("warns about a declaration that the runtime sanitizer strips", () => {
    const issues = lintCss("a { background: url(https://example.com/x.png); }", "stylesheet");

    expect(issues.some((issue) => issue.message.includes("stripped at runtime"))).toBe(true);
  });

  it("warns about a child combinator", () => {
    const issues = lintCss("a > b { color: red; }", "stylesheet");

    expect(issues.some((issue) => issue.message.includes("child combinator"))).toBe(true);
  });

  it("warns about an ID in a class list", () => {
    const issues = lintCss("#foo", "classes");

    expect(issues.some((issue) => issue.message.includes("not a class name"))).toBe(true);
  });

  it("rejects a rule block in selector mode", () => {
    const issues = lintCss("a { color: red }", "selector");

    expect(issues.some((issue) => issue.message.includes("takes a SELECTOR"))).toBe(true);
  });

  it("uses the supplied selector validator", () => {
    const issues = lintCss("a[[", "selector", () => "invalid");

    expect(issues.some((issue) => issue.message.includes("Invalid selector: invalid"))).toBe(true);
  });
});

describe("CssValueCodec — summary", () => {
  it("counts rules and declarations of a stylesheet", () => {
    expect(cssValueSummary("^a<color:red>,b<x:y>", { type: "css" })).toBe("2 rules · 2 declarations");
  });

  it("recognises a keyframe-step list and does not lint its steps as properties", () => {
    // `HTML.Panel`'s `CSSAnimFadeINPanel` is wrapped by the runtime as `@keyframes … { <value> }`.
    const steps = "0% { opacity: 0; scale: 0; } 30% { scale: 1.1; } 60% { scale: 1; } 100% { opacity: 1; scale: 1; }";

    expect(isKeyframeSteps(steps)).toBe(true);
    expect(isKeyframeSteps("color: red; background: blue;")).toBe(false);

    const issues = lintCss(steps, "declarations");
    // No bogus `Unknown property "0% { opacity"` warnings and no "missing }" error.
    expect(issues.filter((issue) => issue.message.startsWith("Unknown property"))).toHaveLength(0);
    expect(issues.filter((issue) => issue.severity === "error")).toHaveLength(0);
  });

  it("formats a keyframe-step list as blocks, not as one declaration per line", () => {
    expect(formatCss("0% { opacity: 0; } 100% { opacity: 1; }", "declarations")).toBe(
      "0% {\n  opacity: 0;\n}\n\n100% {\n  opacity: 1;\n}",
    );
  });

  it("describes the other kinds", () => {
    expect(cssValueSummary("", { type: "css", cssKind: "classes" })).toBe("no classes");
    expect(cssValueSummary("a b c", { type: "css", cssKind: "classes" })).toBe("3 classes");
    expect(cssValueSummary("color: red;", { type: "css", cssKind: "declarations" })).toBe("1 declaration");
    expect(cssValueSummary("", { type: "css", cssKind: "declarations" })).toBe("no declarations");
    expect(cssValueSummary("a, b", { type: "selector" })).toBe("2 selectors");
  });
});
