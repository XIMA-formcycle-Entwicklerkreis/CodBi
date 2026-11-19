// Tests for the color/gradient helpers behind the CSS editor's color picker and gradient generator.

import { afterEach, describe, expect, it } from "@jest/globals";

import {
  allGradientsIn,
  buildGradient,
  clearGradientHistory,
  colorTokenAt,
  firstColorToken,
  firstGradientIn,
  formatColor,
  isColorLike,
  isGradientLike,
  parseColor,
  parseGradient,
  readGradientHistory,
  rememberGradient,
  replaceColorToken,
  swatchCss,
} from "../src/js/CssColorTools.js";

describe("CssColorTools — parsing", () => {
  it("parses the hex notations", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor("#ff8c00")).toEqual({ r: 255, g: 140, b: 0, a: 1 });
    expect(parseColor("#ff8c0080")?.a).toBeCloseTo(128 / 255, 3);
    expect(parseColor("#f80")).toEqual({ r: 255, g: 136, b: 0, a: 1 });
  });

  it("parses rgb()/rgba() and hsl()/hsla()", () => {
    expect(parseColor("rgb(255, 140, 0)")).toEqual({ r: 255, g: 140, b: 0, a: 1 });
    expect(parseColor("rgba(255, 140, 0, 0.5)")?.a).toBeCloseTo(0.5, 3);
    expect(parseColor("hsl(33, 100%, 50%)")).toEqual({ r: 255, g: 140, b: 0, a: 1 });
    expect(parseColor("hsl(33 100% 50% / 0.5)")?.a).toBeCloseTo(0.5, 3);
  });

  it("parses named colors, transparency and rejects garbage", () => {
    expect(parseColor("darkorange")).toEqual({ r: 255, g: 140, b: 0, a: 1 });
    expect(parseColor("transparent")).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(parseColor("not-a-color")).toBeNull();
    expect(parseColor("")).toBeNull();
    expect(parseColor("#12345")).toBeNull();
  });

  it("recognizes color and gradient values", () => {
    expect(isColorLike("rebeccapurple")).toBe(true);
    expect(isColorLike("1px solid #000")).toBe(false);
    expect(isGradientLike("linear-gradient(45deg, #fff, #000)")).toBe(true);
    expect(isGradientLike("#fff")).toBe(false);
  });
});

describe("CssColorTools — formatting", () => {
  const orange = { r: 255, g: 140, b: 0, a: 1 };
  const translucent = { r: 255, g: 140, b: 0, a: 0.5 };

  it("formats hex, rgb and hsl", () => {
    expect(formatColor(orange, "hex")).toBe("#ff8c00");
    expect(formatColor(orange, "rgb")).toBe("rgb(255, 140, 0)");
    expect(formatColor(orange, "hsl")).toBe("hsl(33, 100%, 50%)");
  });

  it("includes the alpha channel when needed", () => {
    expect(formatColor(translucent, "hex")).toBe("#ff8c0080");
    expect(formatColor(translucent, "rgb")).toBe("rgba(255, 140, 0, 0.5)");
    expect(formatColor(translucent, "hsl")).toContain("/ 0.5");
  });

  it("round-trips through parseColor", () => {
    for (const format of ["hex", "rgb", "hsl"] as const) {
      const parsed = parseColor(formatColor(orange, format));
      expect(parsed?.r).toBe(255);
      expect(parsed?.g).toBe(140);
      expect(parsed?.b).toBe(0);
    }
  });

  it("builds an rgba() swatch background", () => {
    expect(swatchCss(translucent)).toBe("rgba(255, 140, 0, 0.5)");
  });
});

describe("CssColorTools — color tokens", () => {
  const css = "a { color: #ff8c00; border: 1px solid red; }";

  it("finds the token the caret touches", () => {
    const caret = css.indexOf("#ff8c00") + 2;
    expect(colorTokenAt(css, caret)?.text).toBe("#ff8c00");
  });

  it("returns null when the caret is not on a color", () => {
    expect(colorTokenAt(css, css.indexOf("a {"))).toBeNull();
  });

  it("finds the first color of a compound value", () => {
    expect(firstColorToken("1px solid #000")?.text).toBe("#000");
    expect(firstColorToken("rgba(0, 0, 0, .5)")?.text).toBe("rgba(0, 0, 0, .5)");
    expect(firstColorToken("inherit")).toBeNull();
  });

  it("replaces exactly one token", () => {
    const token = firstColorToken("1px solid #000");
    expect(token).not.toBeNull();
    expect(replaceColorToken("1px solid #000", token!, "#fff")).toBe("1px solid #fff");
  });
});

describe("CssColorTools — gradients", () => {
  it("parses a gradient with positions", () => {
    const spec = parseGradient("linear-gradient(45deg, #ffffff 0%, #ff8c00 100%)");

    expect(spec).toEqual({
      type: "linear",
      angle: 45,
      stops: [
        { color: "#ffffff", position: 0 },
        { color: "#ff8c00", position: 100 },
      ],
    });
  });

  it("parses nested color functions and distributes missing positions", () => {
    const spec = parseGradient("linear-gradient(90deg, rgba(0, 0, 0, .5), #fff, red)");

    expect(spec?.stops).toHaveLength(3);
    expect(spec?.stops.map((stop) => stop.position)).toEqual([0, 50, 100]);
    expect(spec?.stops[0].color).toBe("rgba(0, 0, 0, .5)");
  });

  it("returns null for non-gradients and single-stop gradients", () => {
    expect(parseGradient("#fff")).toBeNull();
    expect(parseGradient("linear-gradient(45deg, #fff)")).toBeNull();
  });

  it("builds the CSS text", () => {
    expect(
      buildGradient({
        type: "linear",
        angle: 45,
        stops: [
          { color: "#ffffff", position: 0 },
          { color: "#000000", position: 100 },
        ],
      }),
    ).toBe("linear-gradient(45deg, #ffffff 0%, #000000 100%)");

    expect(
      buildGradient({
        type: "radial",
        angle: 0,
        stops: [
          { color: "red", position: 0 },
          { color: "blue", position: 100 },
        ],
      }),
    ).toBe("radial-gradient(circle, red 0%, blue 100%)");
  });

  it("round-trips a generated gradient", () => {
    const spec = {
      type: "linear" as const,
      angle: 180,
      stops: [
        { color: "#fff", position: 0 },
        { color: "#ff8c00", position: 100 },
      ],
    };
    expect(parseGradient(buildGradient(spec))).toEqual(spec);
  });

  it("supports repeating, conic, and radial shape/position", () => {
    expect(parseGradient("repeating-linear-gradient(90deg, #fff 0%, #000 50%)")).toEqual({
      type: "linear",
      angle: 90,
      repeating: true,
      stops: [
        { color: "#fff", position: 0 },
        { color: "#000", position: 50 },
      ],
    });

    expect(
      buildGradient({
        type: "conic",
        angle: 45,
        stops: [
          { color: "red", position: 0 },
          { color: "blue", position: 100 },
        ],
      }),
    ).toBe("conic-gradient(from 45deg, red 0%, blue 100%)");

    expect(
      buildGradient({
        type: "radial",
        angle: 0,
        shape: "ellipse",
        position: "top left",
        stops: [
          { color: "red", position: 0 },
          { color: "blue", position: 100 },
        ],
      }),
    ).toBe("radial-gradient(ellipse at top left, red 0%, blue 100%)");

    expect(parseGradient("radial-gradient(ellipse at top left, red 0%, blue 100%)")).toEqual({
      type: "radial",
      angle: 0,
      shape: "ellipse",
      position: "top left",
      stops: [
        { color: "red", position: 0 },
        { color: "blue", position: 100 },
      ],
    });
  });

  it("finds the first gradient in a declaration block", () => {
    const text = ".a { background: linear-gradient(45deg, rgba(0,0,0,.5) 0%, #fff 100%); color: red; }";

    expect(firstGradientIn(text)).toBe("linear-gradient(45deg, rgba(0,0,0,.5) 0%, #fff 100%)");
    expect(firstGradientIn("color: red;")).toBeNull();
  });

  it("finds every gradient of a text", () => {
    const text =
      ".a{background:linear-gradient(45deg, rgba(0,0,0,.5) 0%, #fff 100%)}.b{background:radial-gradient(circle, red, blue)}";

    expect(allGradientsIn(text)).toHaveLength(2);
    expect(allGradientsIn(text)[1]).toBe("radial-gradient(circle, red, blue)");
  });
});

describe("CssColorTools — gradient history", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("remembers applied gradients newest first and de-duplicates them", () => {
    clearGradientHistory();
    expect(readGradientHistory()).toEqual([]);

    rememberGradient("linear-gradient(45deg, #fff 0%, #000 100%)");
    rememberGradient("linear-gradient(90deg, red 0%, blue 100%)");
    // The same gradient in another notation must not be stored twice.
    rememberGradient("linear-gradient(45deg, #ffffff 0%, #000000 100%)");

    expect(readGradientHistory()).toEqual([
      "linear-gradient(45deg, #ffffff 0%, #000000 100%)",
      "linear-gradient(90deg, red 0%, blue 100%)",
    ]);
  });

  it("ignores invalid values and caps the history", () => {
    clearGradientHistory();
    rememberGradient("not-a-gradient");
    expect(readGradientHistory()).toEqual([]);

    for (let index = 0; index < 20; index += 1) {
      rememberGradient(`linear-gradient(${index}deg, #fff 0%, #000 100%)`);
    }

    expect(readGradientHistory()).toHaveLength(12);
    expect(readGradientHistory()[0]).toBe("linear-gradient(19deg, #fff 0%, #000 100%)");
  });

  it("clears the history", () => {
    rememberGradient("linear-gradient(45deg, #fff 0%, #000 100%)");
    clearGradientHistory();

    expect(readGradientHistory()).toEqual([]);
    expect(localStorage.getItem("codbi-cse-gradient-history")).toBeNull();
  });
});
