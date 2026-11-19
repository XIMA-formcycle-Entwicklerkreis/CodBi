// #region Types
/** A color in the RGBA model (`a` is 0..1). */
export interface IRgba {
  /** Red, 0..255. */
  r: number;
  /** Green, 0..255. */
  g: number;
  /** Blue, 0..255. */
  b: number;
  /** Alpha, 0..1. */
  a: number;
}

/** The textual color formats the picker can emit. */
export type TColorFormat = "hex" | "rgb" | "hsl";

/** One stop of a gradient. */
export interface IGradientStop {
  /** The stop color (any CSS color the picker understands). */
  color: string;
  /** The stop position in percent (0..100). */
  position: number;
}

/** The parsed form of a gradient value. */
export interface IGradientSpec {
  /** `linear`, `radial` or `conic`. */
  type: "linear" | "radial" | "conic";
  /** The direction in degrees (linear) or the `from` angle (conic). */
  angle: number;
  /** Radial gradients only: the shape. Absent means `circle`. */
  shape?: "circle" | "ellipse";
  /** Radial/conic gradients only: the center (e.g. `center`, `50% 50%`). Absent means `center`. */
  position?: string;
  /** Whether the gradient repeats (`repeating-…-gradient`). */
  repeating?: boolean;
  /** The color stops, sorted by position. */
  stops: IGradientStop[];
}

/** Options for {@link openColorPicker }. */
export interface IColorPickerOptions {
  /** The document the picker is rendered into. */
  document: Document;
  /** The element the picker is anchored to. */
  anchor: HTMLElement;
  /** The current color (may be empty or invalid — the picker then starts at black). */
  value: string;
  /** Invoked with the CSS color text when the user confirms. */
  onApply: (css: string) => void;
  /** Invoked when the picker is dismissed. */
  onCancel?: () => void;
}

/** Options for {@link openGradientBuilder }. */
export interface IGradientBuilderOptions {
  /** The document the builder is rendered into. */
  document: Document;
  /** The element the builder is anchored to. */
  anchor: HTMLElement;
  /** An existing gradient to edit (optional). */
  value?: string;
  /** Invoked with the generated `linear-gradient(…)` / `radial-gradient(…)` text. */
  onInsert: (css: string) => void;
  /** Invoked when the builder is dismissed. */
  onCancel?: () => void;
}
// #endregion Types

// #region Color parsing
/** The CSS named colors (a pragmatic subset of the Level 4 list, plus `transparent`). */
const NAMED_COLORS: Readonly<Record<string, string>> = {
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  black: "#000000",
  blue: "#0000ff",
  brown: "#a52a2a",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkorange: "#ff8c00",
  darkred: "#8b0000",
  darkgrey: "#a9a9a9",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  grey: "#808080",
  hotpink: "#ff69b4",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  lightblue: "#add8e6",
  lightgray: "#d3d3d3",
  lightgreen: "#90ee90",
  lightgrey: "#d3d3d3",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  magenta: "#ff00ff",
  maroon: "#800000",
  mediumblue: "#0000cd",
  midnightblue: "#191970",
  navy: "#000080",
  olive: "#808000",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  purple: "#800080",
  rebeccapurple: "#663399",
  red: "#ff0000",
  royalblue: "#4169e1",
  salmon: "#fa8072",
  seagreen: "#2e8b57",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32",
};

/** Clamps a number into 0..1. */
function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Clamps a number into 0..max. */
function clampInt(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(value)));
}

/** Converts HSL (h in 0..360, s/l in 0..1) into RGB. */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const segment = Math.floor(hue / 60) % 6;
  const table: ReadonlyArray<[number, number, number]> = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  const [r, g, b] = table[segment] ?? table[0];

  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

/** Converts RGB (0..255) into HSL (h 0..360, s/l 0..1). */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, s: 0, l };
  }
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === rn) {
    h = 60 * (((gn - bn) / delta) % 6);
  } else if (max === gn) {
    h = 60 * ((bn - rn) / delta + 2);
  } else {
    h = 60 * ((rn - gn) / delta + 4);
  }

  return { h: (h + 360) % 360, s, l };
}

/** Converts HSV (h 0..360, s/v 0..1) into RGB — the model the picker's square works in. */
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const hue = ((h % 360) + 360) % 360;
  const c = v * s;
  const hp = hue / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = v - c;
  const segment = Math.floor(hp) % 6;
  const table: ReadonlyArray<[number, number, number]> = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  const [r, g, b] = table[segment] ?? table[0];

  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

/** Converts RGB (0..255) into HSV (h 0..360, s/v 0..1). */
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === rn) {
      h = 60 * (((gn - bn) / delta) % 6);
    } else if (max === gn) {
      h = 60 * ((bn - rn) / delta + 2);
    } else {
      h = 60 * ((rn - gn) / delta + 4);
    }
  }

  return { h: (h + 360) % 360, s: max === 0 ? 0 : delta / max, v: max };
}

/** Converts RGB (0..255) into CMYK (each 0..1). */
export function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k >= 1) {
    return { c: 0, m: 0, y: 0, k: 1 };
  }
  const divisor = 1 - k;
  return { c: (1 - rn - k) / divisor, m: (1 - gn - k) / divisor, y: (1 - bn - k) / divisor, k };
}

/** Converts CMYK (each 0..1) into RGB (0..255). */
export function cmykToRgb(c: number, m: number, y: number, k: number): { r: number; g: number; b: number } {
  const clamp = (value: number): number => clamp01(value);
  const kk = clamp(k);
  return {
    r: Math.round(255 * (1 - clamp(c)) * (1 - kk)),
    g: Math.round(255 * (1 - clamp(m)) * (1 - kk)),
    b: Math.round(255 * (1 - clamp(y)) * (1 - kk)),
  };
}

/**
 * Parses a CSS color into {@link IRgba }.
 *
 * Supports `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`/`rgba()`, `hsl()`/`hsla()` (comma or
 * space separated, slash alpha) and the named colors listed above.
 *
 * @param input - The CSS color text.
 * @returns The parsed color, or null when the text is not a color.
 */
export function parseColor(input: string): IRgba | null {
  const text = String(input ?? "")
    .trim()
    .toLowerCase();
  if (text === "") {
    return null;
  }
  if (text === "transparent") {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  const named = NAMED_COLORS[text];
  const hexText = named ?? text;
  const hexMatch = /^#([0-9a-f]{3,8})$/.exec(hexText);
  if (hexMatch) {
    const digits = hexMatch[1];
    if (digits.length === 3 || digits.length === 4) {
      const r = Number.parseInt(digits[0] + digits[0], 16);
      const g = Number.parseInt(digits[1] + digits[1], 16);
      const b = Number.parseInt(digits[2] + digits[2], 16);
      const a = digits.length === 4 ? Number.parseInt(digits[3] + digits[3], 16) / 255 : 1;
      return { r, g, b, a };
    }
    if (digits.length === 6 || digits.length === 8) {
      const r = Number.parseInt(digits.slice(0, 2), 16);
      const g = Number.parseInt(digits.slice(2, 4), 16);
      const b = Number.parseInt(digits.slice(4, 6), 16);
      const a = digits.length === 8 ? Number.parseInt(digits.slice(6, 8), 16) / 255 : 1;
      return { r, g, b, a };
    }
    return null;
  }

  const fn = /^(rgba?|hsla?)\(([^)]*)\)$/.exec(text);
  if (!fn) {
    return null;
  }
  const parts = (fn[2] ?? "")
    .replace(/\//g, " ")
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter((part) => part !== "");
  if (parts.length < 3) {
    return null;
  }
  const alphaText = parts[3];
  const alpha =
    alphaText === undefined
      ? 1
      : alphaText.endsWith("%")
        ? Number.parseFloat(alphaText) / 100
        : Number.parseFloat(alphaText);

  if (fn[1].startsWith("rgb")) {
    const channel = (raw: string): number =>
      raw.endsWith("%") ? (Number.parseFloat(raw) / 100) * 255 : Number.parseFloat(raw);
    const r = channel(parts[0]);
    const g = channel(parts[1]);
    const b = channel(parts[2]);
    if ([r, g, b, alpha].some((value) => Number.isNaN(value))) {
      return null;
    }
    return {
      r: clampInt(r, 255),
      g: clampInt(g, 255),
      b: clampInt(b, 255),
      a: clamp01(Number.isNaN(alpha) ? 1 : alpha),
    };
  }

  const h = Number.parseFloat(parts[0]);
  const s = Number.parseFloat(parts[1]) / 100;
  const l = Number.parseFloat(parts[2]) / 100;
  if ([h, s, l].some((value) => Number.isNaN(value))) {
    return null;
  }
  const rgb = hslToRgb(h, clamp01(s), clamp01(l));
  return { ...rgb, a: clamp01(Number.isNaN(alpha) ? 1 : alpha) };
}

/** @returns the two-digit hex representation of one channel. */
function hex2(value: number): string {
  return clampInt(value, 255).toString(16).padStart(2, "0");
}

/**
 * Formats a color as CSS text.
 *
 * @param color  - The color.
 * @param format - The requested notation.
 * @returns The CSS text (e.g. `#ff8c00`, `rgba(255, 140, 0, .5)` or `hsl(33 100% 50% / .5)`).
 */
export function formatColor(color: IRgba, format: TColorFormat): string {
  const alpha = clamp01(color.a);
  if (format === "rgb") {
    const r = clampInt(color.r, 255);
    const g = clampInt(color.g, 255);
    const b = clampInt(color.b, 255);
    return alpha >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${Number(alpha.toFixed(3))})`;
  }
  if (format === "hsl") {
    const { h, s, l } = rgbToHsl(color.r, color.g, color.b);
    const hue = Math.round(h);
    const sat = Math.round(s * 100);
    const light = Math.round(l * 100);
    return alpha >= 1
      ? `hsl(${hue}, ${sat}%, ${light}%)`
      : `hsl(${hue}, ${sat}%, ${light}% / ${Number(alpha.toFixed(3))})`;
  }
  const base = `#${hex2(color.r)}${hex2(color.g)}${hex2(color.b)}`;
  return alpha >= 1 ? base : `${base}${hex2(alpha * 255)}`;
}

/**
 * @returns a CSS color usable as a background (always opaque enough to see) for swatches.
 *
 * @param color - The color.
 */
export function swatchCss(color: IRgba): string {
  return `rgba(${clampInt(color.r, 255)}, ${clampInt(color.g, 255)}, ${clampInt(color.b, 255)}, ${clamp01(color.a)})`;
}

/** @returns whether the text looks like a single CSS color (used to decide whether to show a swatch). */
export function isColorLike(text: string): boolean {
  return parseColor(text) !== null;
}

/** @returns whether the text is a gradient function. */
export function isGradientLike(text: string): boolean {
  return /(?:repeating-)?(?:linear|radial|conic)-gradient\(/i.test(String(text ?? ""));
}

/**
 * Finds every gradient function in a CSS text, honouring nested parentheses (so the `rgba(…)` colors
 * inside a stop list do not terminate the match early).
 *
 * @param text - The CSS text.
 * @returns The gradient texts, in order of appearance.
 */
export function allGradientsIn(text: string): string[] {
  const source = String(text ?? "");
  const found: string[] = [];
  const pattern = /(?:repeating-)?(?:linear|radial|conic)-gradient\(/gi;
  let match = pattern.exec(source);

  while (match) {
    let depth = 0;
    let end = -1;
    for (let index = match.index; index < source.length; index += 1) {
      const char = source[index];
      if (char === "(") {
        depth += 1;
      } else if (char === ")") {
        depth -= 1;
        if (depth === 0) {
          end = index;
          break;
        }
      }
    }
    if (end < 0) {
      break;
    }
    found.push(source.slice(match.index, end + 1));
    pattern.lastIndex = end + 1;
    match = pattern.exec(source);
  }

  return found;
}

/**
 * Finds the first gradient function in a CSS text (balanced parentheses aware).
 *
 * @param text - The CSS text.
 * @returns The gradient text, or null.
 */
export function firstGradientIn(text: string): string | null {
  return allGradientsIn(text)[0] ?? null;
}

// #region Gradient history
/** localStorage key under which the gradients the author applied are remembered. */
const GRADIENT_HISTORY_KEY = "codbi-cse-gradient-history";

/** How many gradients the history keeps. */
const GRADIENT_HISTORY_LIMIT = 12;

/**
 * Reads the gradients this browser has seen applied, newest first.
 *
 * @param limit - The maximum number of entries.
 * @returns The stored gradient texts (invalid/unparsable entries are dropped).
 */
export function readGradientHistory(limit = GRADIENT_HISTORY_LIMIT): string[] {
  try {
    const raw = localStorage.getItem(GRADIENT_HISTORY_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((entry) => String(entry))
      .filter((entry) => parseGradient(entry) !== null)
      .slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Builds a semantic key for a gradient so two notations of the SAME gradient (e.g. `#fff` and
 * `#ffffff`, or `red` and `#ff0000`) are treated as one history entry.
 *
 * @param css - The gradient text.
 * @returns The comparison key (empty when the text is not a gradient).
 */
function gradientKey(css: string): string {
  const spec = parseGradient(css);
  if (!spec) {
    return "";
  }
  const stops = spec.stops.map((stop) => {
    const color = parseColor(stop.color);
    return `${color ? formatColor(color, "hex") : stop.color}@${clampInt(stop.position, 100)}`;
  });

  return [
    spec.type,
    clampInt(spec.angle, 360),
    spec.repeating === true ? "repeating" : "",
    spec.shape ?? "",
    spec.position ?? "",
    ...stops,
  ].join("|");
}

/**
 * Remembers one applied gradient (normalized, de-duplicated by meaning, newest first).
 *
 * @param css   - The gradient text that was applied.
 * @param limit - The maximum number of entries kept.
 * @returns The updated history.
 */
export function rememberGradient(css: string, limit = GRADIENT_HISTORY_LIMIT): string[] {
  const spec = parseGradient(css);
  if (!spec) {
    return readGradientHistory(limit);
  }
  const normalized = buildGradient(spec);
  const key = gradientKey(normalized);
  const next = [normalized, ...readGradientHistory(limit).filter((entry) => gradientKey(entry) !== key)].slice(
    0,
    limit,
  );
  try {
    localStorage.setItem(GRADIENT_HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the history is simply not persisted */
  }
  return next;
}

/** Forgets every remembered gradient. */
export function clearGradientHistory(): void {
  try {
    localStorage.removeItem(GRADIENT_HISTORY_KEY);
  } catch {
    /* ignore */
  }
}
// #endregion Gradient history
// #endregion Color parsing

// #region Color token lookup
/** One color token found in a CSS text. */
export interface IColorToken {
  /** The index of the first character. */
  start: number;
  /** The index AFTER the last character. */
  end: number;
  /** The token text. */
  text: string;
}

/** Matches a color token anywhere in a CSS text (hex, rgb/hsl function, named color). */
const COLOR_TOKEN_PATTERN = new RegExp(
  `#[0-9a-fA-F]{3,8}\\b|\\b(?:rgba?|hsla?)\\([^)]*\\)|\\b(?:${Object.keys(NAMED_COLORS).join("|")})\\b`,
  "gi",
);

/**
 * Finds the color token the caret sits in (or directly touches), so the editor can offer its swatch.
 *
 * @param text   - The CSS text.
 * @param caret  - The caret index.
 * @returns The token, or null when the caret is not on a color.
 */
export function colorTokenAt(text: string, caret: number): IColorToken | null {
  const source = String(text ?? "");
  COLOR_TOKEN_PATTERN.lastIndex = 0;
  for (const match of source.matchAll(COLOR_TOKEN_PATTERN)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (caret >= start && caret <= end) {
      return { start, end, text: match[0] };
    }
  }
  return null;
}

/**
 * Finds the FIRST color token of a declaration value (so a `1px solid #000` value still gets a swatch).
 *
 * @param text - The declaration value.
 * @returns The token, or null.
 */
export function firstColorToken(text: string): IColorToken | null {
  COLOR_TOKEN_PATTERN.lastIndex = 0;
  const match = COLOR_TOKEN_PATTERN.exec(String(text ?? ""));
  if (!match) {
    return null;
  }
  const start = match.index;
  return { start, end: start + match[0].length, text: match[0] };
}

/**
 * Replaces one token range inside a text with a new value.
 *
 * @param text  - The text.
 * @param token - The token to replace.
 * @param next  - The replacement.
 * @returns The updated text.
 */
export function replaceColorToken(text: string, token: IColorToken, next: string): string {
  return `${text.slice(0, token.start)}${next}${text.slice(token.end)}`;
}
// #endregion Color token lookup

// #region Gradient parsing
/** Splits a CSS function argument list on top-level commas. */
function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  for (const char of text) {
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth = Math.max(0, depth - 1);
    }
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim() !== "") {
    parts.push(current.trim());
  }
  return parts;
}

/**
 * Parses a gradient value into its editable form.
 *
 * @param value - e.g. `linear-gradient(45deg, #fff 0%, #000 100%)`.
 * @returns The spec, or null when the value is not a gradient.
 */
export function parseGradient(value: string): IGradientSpec | null {
  const text = String(value ?? "").trim();
  // No `s` flag: the designer's TS target is below ES2018, so `[\s\S]` spans the newlines.
  const match = /^(repeating-)?(linear|radial|conic)-gradient\(([\s\S]*)\)$/i.exec(text);
  if (!match) {
    return null;
  }
  const type = match[2].toLowerCase() as "linear" | "radial" | "conic";
  const args = splitTopLevel(match[3]);
  const spec: IGradientSpec = { type, angle: type === "linear" ? 180 : 0, stops: [] };
  if (match[1] !== undefined) {
    spec.repeating = true;
  }

  for (const arg of args) {
    // The optional prelude (direction / shape / position) only ever comes first.
    if (spec.stops.length === 0) {
      const angleMatch = /^(-?\d+(?:\.\d+)?)deg$/.exec(arg);
      if (angleMatch) {
        spec.angle = Number.parseFloat(angleMatch[1]);
        continue;
      }
      const radialMatch = /^(circle|ellipse)(?:\s+at\s+(.+))?$/i.exec(arg);
      if (radialMatch) {
        spec.shape = radialMatch[1].toLowerCase() === "ellipse" ? "ellipse" : "circle";
        if (radialMatch[2]) {
          spec.position = radialMatch[2].trim();
        }
        continue;
      }
      const fromMatch = /^from\s+(-?\d+(?:\.\d+)?)deg(?:\s+at\s+(.+))?$/i.exec(arg);
      if (fromMatch) {
        spec.angle = Number.parseFloat(fromMatch[1]);
        if (fromMatch[2]) {
          spec.position = fromMatch[2].trim();
        }
        continue;
      }
      const atMatch = /^at\s+(.+)$/i.exec(arg);
      if (atMatch) {
        spec.position = atMatch[1].trim();
        continue;
      }
      if (/^to\s+/i.test(arg)) {
        // Keyword directions (`to right`, …) keep the default angle.
        continue;
      }
    }

    const stopMatch = /^(.+?)(?:\s+(-?\d+(?:\.\d+)?)%)?$/.exec(arg);
    if (!stopMatch) {
      continue;
    }
    const color = stopMatch[1].trim();
    if (parseColor(color) === null) {
      continue;
    }
    const position = stopMatch[2] === undefined ? Number.NaN : Number.parseFloat(stopMatch[2]);
    spec.stops.push({ color, position });
  }

  if (spec.stops.length < 2) {
    return null;
  }
  const missing = spec.stops.filter((stop) => Number.isNaN(stop.position)).length;
  for (let index = 0; index < spec.stops.length; index += 1) {
    const stop = spec.stops[index];
    if (missing === spec.stops.length) {
      // No positions at all — distribute the stops evenly.
      stop.position = Math.round((index / Math.max(1, spec.stops.length - 1)) * 100);
    } else if (Number.isNaN(stop.position)) {
      stop.position = 0;
    }
  }

  return spec;
}

/**
 * Builds the CSS gradient text.
 *
 * @param spec - The gradient spec.
 * @returns e.g. `linear-gradient(45deg, #ffffff 0%, #000000 100%)`.
 */
export function buildGradient(spec: IGradientSpec): string {
  const stops = spec.stops.map((stop) => `${stop.color} ${clampInt(stop.position, 100)}%`).join(", ");
  const prefix = spec.repeating ? "repeating-" : "";
  const at = spec.position && spec.position !== "center" ? ` at ${spec.position}` : "";

  if (spec.type === "radial") {
    const shape = spec.shape === "ellipse" ? "ellipse" : "circle";
    return `${prefix}radial-gradient(${shape}${at}, ${stops})`;
  }
  if (spec.type === "conic") {
    return `${prefix}conic-gradient(from ${clampInt(spec.angle, 360)}deg${at}, ${stops})`;
  }
  return `${prefix}linear-gradient(${clampInt(spec.angle, 360)}deg, ${stops})`;
}
// #endregion Gradient parsing

// #region Styles
/** The stylesheet shared by the color picker and the gradient builder. */
const TOOLS_CSS = `
.codbi-cse-tools{--cse-accent:darkorange;position:fixed;z-index:100010;background:#fff;border:1px solid var(--cse-accent);border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.35);padding:8px;font:12px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#172b4d}
/* Darkorange scrollbars, mirroring the Form Assistant's change log. */
.codbi-cse-tools,.codbi-cse-tools *{scrollbar-color:#ff9f40 transparent;scrollbar-width:thin}
.codbi-cse-tools ::-webkit-scrollbar,.codbi-cse-tools::-webkit-scrollbar{width:10px;height:10px}
.codbi-cse-tools ::-webkit-scrollbar-track,.codbi-cse-tools::-webkit-scrollbar-track{background:transparent}
.codbi-cse-tools ::-webkit-scrollbar-thumb,.codbi-cse-tools::-webkit-scrollbar-thumb{background:#ff9f40;border-radius:5px}
.codbi-cse-tools ::-webkit-scrollbar-thumb:hover,.codbi-cse-tools::-webkit-scrollbar-thumb:hover{background:#ffb266}
.codbi-cse-tools ::-webkit-scrollbar-corner,.codbi-cse-tools::-webkit-scrollbar-corner{background:transparent}
.codbi-cse-head{display:flex;align-items:center;gap:6px;margin-bottom:6px}
.codbi-cse-title{font-weight:700;color:#925400}
.codbi-cse-close{margin-left:auto;border:0;background:transparent;color:#925400;cursor:pointer;font:inherit;padding:0 4px}
.codbi-cse-sv{position:relative;width:220px;height:140px;border-radius:4px;border:1px solid #e6cf9a;cursor:crosshair;touch-action:none}
.codbi-cse-sv::before{content:"";position:absolute;inset:0;border-radius:4px;background:linear-gradient(to top,#000,rgba(0,0,0,0))}
.codbi-cse-sv::after{content:"";position:absolute;inset:0;border-radius:4px;background:linear-gradient(to right,#fff,rgba(255,255,255,0))}
.codbi-cse-dot{position:absolute;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.6);pointer-events:none;z-index:2}
.codbi-cse-row{display:flex;align-items:center;gap:6px;margin-top:6px}
.codbi-cse-row input[type="range"]{flex:1 1 auto;min-width:0}
.codbi-cse-hue{height:12px;border-radius:999px;background:linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)}
.codbi-cse-range{appearance:none;height:12px;border-radius:999px;border:1px solid #e6cf9a;background:#eee}
.codbi-cse-range::-webkit-slider-thumb{appearance:none;width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid var(--cse-accent)}
.codbi-cse-text{flex:1 1 auto;min-width:0;box-sizing:border-box;border:1px solid #e6cf9a;border-radius:3px;padding:3px 6px;font:11px ui-monospace,Menlo,Consolas,monospace}
.codbi-cse-swatch{flex:0 0 auto;width:22px;height:22px;border-radius:4px;border:1px solid #c1c7d0;cursor:pointer;padding:0;background-clip:padding-box}
.codbi-cse-btn{border:1px solid #c1c7d0;border-radius:4px;background:#fff;color:#172b4d;font:inherit;padding:3px 10px;cursor:pointer}
.codbi-cse-btn:hover{background:#f4f5f7}
.codbi-cse-btn--primary{background:var(--cse-accent);border-color:var(--cse-accent);color:#fff;font-weight:700}
.codbi-cse-btn--primary:hover{background:#ff8c00}
.codbi-cse-foot{display:flex;justify-content:flex-end;gap:6px;margin-top:8px}
.codbi-cse-stops{display:flex;flex-direction:column;gap:4px;max-height:150px;overflow:auto}
.codbi-cse-stop{display:flex;align-items:center;gap:6px}
.codbi-cse-pos{width:64px;box-sizing:border-box;border:1px solid #e6cf9a;border-radius:3px;padding:2px 4px;font:11px ui-monospace,Menlo,Consolas,monospace}
.codbi-cse-bigpreview{height:118px;border-radius:6px;border:1px solid #e6cf9a;margin-bottom:10px;background-color:#fff;background-image:linear-gradient(45deg,#e6e6e6 25%,transparent 25%),linear-gradient(-45deg,#e6e6e6 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e6e6e6 75%),linear-gradient(-45deg,transparent 75%,#e6e6e6 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0;overflow:hidden}
.codbi-cse-bigfill{height:100%;width:100%}
.codbi-cse-btn--danger{border-color:#de350b;color:#de350b}
.codbi-cse-chanlabel{flex:0 0 auto;width:30px;color:#6b778c;font-size:10px;text-transform:uppercase;letter-spacing:.04em}
.codbi-cse-chans{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;flex:1 1 auto;min-width:0}
.codbi-cse-chan{width:100%;box-sizing:border-box;border:1px solid #e6cf9a;border-radius:3px;padding:2px 3px;font:10px ui-monospace,Menlo,Consolas,monospace;min-width:0}
.codbi-cse-chan:focus{outline:2px solid var(--cse-accent);outline-offset:-1px}
.codbi-cse-label{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#6b778c;margin:10px 0 4px;font-weight:700}
.codbi-cse-labelrow{display:flex;align-items:center;gap:6px;margin:10px 0 4px}
.codbi-cse-labelrow .codbi-cse-label{margin:0}
.codbi-cse-btn--tiny{padding:1px 6px;font-size:10px}
.codbi-cse-hint{color:#6b778c;font-size:10px;line-height:1.4}
.codbi-cse-check{display:inline-flex;align-items:center;gap:4px;color:#6b778c;cursor:pointer;margin-left:auto}
.codbi-cse-bar{position:relative;height:20px;border-radius:4px;border:1px solid #e6cf9a;cursor:copy;touch-action:none}
.codbi-cse-handle{position:absolute;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.5),0 0 0 1px rgba(0,0,0,.3);cursor:grab;padding:0;touch-action:none;z-index:2}
.codbi-cse-handle:active{cursor:grabbing}
.codbi-cse-handle[aria-selected="true"]{box-shadow:0 0 0 2px var(--cse-accent),0 1px 3px rgba(0,0,0,.5);z-index:3}
.codbi-cse-handle:focus-visible{outline:2px solid var(--cse-accent);outline-offset:2px}
.codbi-cse-addstop{width:100%;margin-top:8px;border:1px dashed var(--cse-accent);background:#fff;color:var(--cse-accent);border-radius:4px;padding:5px 8px;font:inherit;font-weight:600;cursor:pointer}
.codbi-cse-addstop:hover{background:#fff4e0}
.codbi-cse-stopgrid{display:grid;grid-template-columns:1fr 1fr;gap:4px;max-height:132px;overflow:auto}
.codbi-cse-stop{display:flex;align-items:center;gap:4px;padding:2px;border:1px solid #eee;border-radius:4px}
.codbi-cse-stop[aria-selected="true"]{border-color:var(--cse-accent);background:rgba(255,165,0,.12)}
.codbi-cse-stoptools{display:flex;gap:4px;margin-top:6px}
.codbi-cse-stoptools .codbi-cse-btn{flex:1 1 auto;padding:3px 4px;text-align:center}
.codbi-cse-dirs{display:grid;grid-template-columns:repeat(8,1fr);gap:3px;margin-top:4px}
.codbi-cse-dirbtn{border:1px solid #c1c7d0;background:#fff;color:#42526e;border-radius:3px;padding:1px 0;font:12px/1.3 system-ui,sans-serif;cursor:pointer}
.codbi-cse-dirbtn:hover{background:#f4f5f7}
.codbi-cse-dirbtn[aria-pressed="true"]{background:var(--cse-accent);border-color:var(--cse-accent);color:#fff}
.codbi-cse-presets{display:flex;flex-wrap:wrap;gap:4px}
.codbi-cse-preset{width:48px;height:24px;border-radius:3px;border:1px solid #c1c7d0;cursor:pointer;padding:0;background-size:cover}
.codbi-cse-preset:hover{border-color:var(--cse-accent)}
.codbi-cse-code{display:flex;align-items:center;gap:6px;margin-top:10px;background:#1f2a44;border-radius:4px;padding:5px 6px}
.codbi-cse-code .codbi-cse-text{background:transparent;border:0;color:#e6edf7}
.codbi-cse-code .codbi-cse-btn{background:#2f3d5c;border-color:#3f5073;color:#e6edf7}
.codbi-cse-code .codbi-cse-btn:hover{background:#3a4a6b}
`;
// #endregion Styles

// #region Panel helpers
/** Ensures the shared stylesheet exists in the document. */
function ensureToolsCss(doc: Document): void {
  if (doc.head?.querySelector("style[data-codbi-cse-tools]")) {
    return;
  }
  const style = doc.createElement("style");
  style.setAttribute("data-codbi-cse-tools", "");
  style.textContent = TOOLS_CSS;
  doc.head?.appendChild(style);
}

/** Creates an element with an optional class and text. */
function create<T extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: T,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[T] {
  const node = doc.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

/** Creates a button. */
function button(doc: Document, label: string, className: string): HTMLButtonElement {
  const node = create(doc, "button", className, label);
  node.type = "button";
  return node;
}

/** Positions a panel next to its anchor, clamped to the viewport. */
function placePanel(panel: HTMLElement, anchor: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const width = panel.offsetWidth || 250;
  const height = panel.offsetHeight || 260;
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
  const top = rect.bottom + height + 8 > window.innerHeight ? Math.max(8, rect.top - height - 6) : rect.bottom + 6;
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
}
// #endregion Panel helpers

// #region Color picker
/**
 * Opens an Edge-DevTools-style color picker anchored to `anchor`.
 *
 * The picker offers a saturation/value square, a hue slider, an alpha slider and a notation selector
 * (HEX / RGB / HSL); it writes the chosen color back through `onApply` in the chosen notation.
 *
 * @param options - See {@link IColorPickerOptions }.
 */
export function openColorPicker(options: IColorPickerOptions): void {
  const doc = options.document;
  ensureToolsCss(doc);

  const initial = parseColor(options.value) ?? { r: 0, g: 0, b: 0, a: 1 };
  const initialHsv = rgbToHsv(initial.r, initial.g, initial.b);
  const state = {
    h: initialHsv.h,
    s: initialHsv.s,
    v: initialHsv.v,
    a: initial.a,
    format: "hex" as TColorFormat,
  };

  const panel = create(doc, "div", "codbi-cse-tools");
  panel.style.width = "236px";

  const head = create(doc, "div", "codbi-cse-head");
  head.append(create(doc, "span", "codbi-cse-title", "Color"));
  const close = button(doc, "✕", "codbi-cse-close");
  head.appendChild(close);

  const sv = create(doc, "div", "codbi-cse-sv");
  const dot = create(doc, "div", "codbi-cse-dot");
  sv.appendChild(dot);

  const hueRow = create(doc, "div", "codbi-cse-row");
  const hue = create(doc, "input", "codbi-cse-range");
  hue.type = "range";
  hue.min = "0";
  hue.max = "360";
  hue.title = "Hue";
  hueRow.appendChild(hue);

  const alphaRow = create(doc, "div", "codbi-cse-row");
  const alpha = create(doc, "input", "codbi-cse-range");
  alpha.type = "range";
  alpha.min = "0";
  alpha.max = "100";
  alpha.title = "Alpha";
  alphaRow.appendChild(alpha);

  /** The numeric channel inputs of one notation row (e.g. R/G/B). */
  let rgbInputs: HTMLInputElement[] = [];
  let hslInputs: HTMLInputElement[] = [];
  let cmykInputs: HTMLInputElement[] = [];

  /**
   * Builds one channel row: a caption plus one number input per channel.
   *
   * @param caption - The row caption (`RGB`, `HSL`, `CMYK`).
   * @param names   - The channel names (used as placeholders/tooltips).
   * @param maxes   - The per-channel maximum.
   * @param onEdit  - Receives the current channel values.
   * @returns The row element and its inputs.
   */
  const channelRow = (
    caption: string,
    names: ReadonlyArray<string>,
    maxes: ReadonlyArray<number>,
    onEdit: (values: number[]) => void,
  ): { row: HTMLElement; inputs: HTMLInputElement[] } => {
    const row = create(doc, "div", "codbi-cse-row");
    row.appendChild(create(doc, "span", "codbi-cse-chanlabel", caption));
    const grid = create(doc, "div", "codbi-cse-chans");
    const inputs: HTMLInputElement[] = [];
    for (let index = 0; index < names.length; index += 1) {
      const field = create(doc, "input", "codbi-cse-chan");
      field.type = "number";
      field.min = "0";
      field.max = String(maxes[index]);
      field.placeholder = names[index];
      field.title = names[index];
      field.setAttribute("aria-label", `${caption} ${names[index]}`);
      field.addEventListener("input", () => {
        onEdit(inputs.map((input) => Number.parseFloat(input.value || "0")));
      });
      grid.appendChild(field);
      inputs.push(field);
    }
    row.appendChild(grid);
    return { row, inputs };
  };

  /** Sets the channel inputs without disturbing the one being typed in. */
  const setChannels = (inputs: ReadonlyArray<HTMLInputElement>, values: ReadonlyArray<number>): void => {
    for (let index = 0; index < inputs.length; index += 1) {
      const input = inputs[index];
      if (input.ownerDocument?.activeElement === input) {
        continue;
      }
      input.value = String(values[index] ?? 0);
    }
  };

  /** Applies an RGB color (keeping the alpha) and refreshes every control. */
  const applyRgb = (rgb: { r: number; g: number; b: number }): void => {
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    state.h = hsv.h;
    state.s = hsv.s;
    state.v = hsv.v;
    sync();
  };

  const rgbRow = channelRow("RGB", ["R", "G", "B"], [255, 255, 255], (values) =>
    applyRgb({ r: values[0] ?? 0, g: values[1] ?? 0, b: values[2] ?? 0 }),
  );
  rgbInputs = rgbRow.inputs;

  const hslRow = channelRow("HSL", ["H", "S", "L"], [360, 100, 100], (values) =>
    applyRgb(hslToRgb(values[0] ?? 0, clamp01((values[1] ?? 0) / 100), clamp01((values[2] ?? 0) / 100))),
  );
  hslInputs = hslRow.inputs;

  const cmykRow = channelRow("CMYK", ["C", "M", "Y", "K"], [100, 100, 100, 100], (values) =>
    applyRgb(
      cmykToRgb(
        clamp01((values[0] ?? 0) / 100),
        clamp01((values[1] ?? 0) / 100),
        clamp01((values[2] ?? 0) / 100),
        clamp01((values[3] ?? 0) / 100),
      ),
    ),
  );
  cmykInputs = cmykRow.inputs;

  const textRow = create(doc, "div", "codbi-cse-row");
  const swatch = create(doc, "span", "codbi-cse-swatch");
  const formatSelect = create(doc, "select", "codbi-cse-text");
  formatSelect.style.flex = "0 0 auto";
  formatSelect.style.width = "64px";
  for (const value of ["hex", "rgb", "hsl"] as const) {
    const option = create(doc, "option", undefined, value.toUpperCase());
    option.value = value;
    formatSelect.appendChild(option);
  }
  const textInput = create(doc, "input", "codbi-cse-text");
  textInput.type = "text";
  textInput.spellcheck = false;
  textRow.append(swatch, formatSelect, textInput);

  const foot = create(doc, "div", "codbi-cse-foot");
  const cancel = button(doc, "Cancel", "codbi-cse-btn");
  const apply = button(doc, "Apply", "codbi-cse-btn codbi-cse-btn--primary");
  foot.append(cancel, apply);

  panel.append(head, sv, hueRow, alphaRow, rgbRow.row, hslRow.row, cmykRow.row, textRow, foot);
  doc.body.appendChild(panel);
  placePanel(panel, options.anchor);

  /** @returns the current color. */
  const current = (): IRgba => ({ ...hsvToRgb(state.h, state.s, state.v), a: state.a });

  /** Renders the current state into every control. */
  const sync = (fromText = false): void => {
    const color = current();
    const css = swatchCss(color);
    sv.style.background = `hsl(${Math.round(state.h)}, 100%, 50%)`;
    dot.style.left = `${state.s * 100}%`;
    dot.style.top = `${(1 - state.v) * 100}%`;
    dot.style.background = css;
    hue.value = String(Math.round(state.h));
    alpha.value = String(Math.round(state.a * 100));
    alpha.style.backgroundImage = `linear-gradient(to right, rgba(0,0,0,0), ${css})`;
    swatch.style.background = css;
    // Keep every notation in sync: RGB, HSL and CMYK are all editable side by side.
    const hslValues = rgbToHsl(color.r, color.g, color.b);
    const cmykValues = rgbToCmyk(color.r, color.g, color.b);
    setChannels(rgbInputs, [color.r, color.g, color.b]);
    setChannels(hslInputs, [Math.round(hslValues.h), Math.round(hslValues.s * 100), Math.round(hslValues.l * 100)]);
    setChannels(cmykInputs, [
      Math.round(cmykValues.c * 100),
      Math.round(cmykValues.m * 100),
      Math.round(cmykValues.y * 100),
      Math.round(cmykValues.k * 100),
    ]);
    if (!fromText) {
      textInput.value = formatColor(color, state.format);
    }
  };

  /** Sets the saturation/value from a pointer position over the square. */
  const setFromPointer = (event: PointerEvent): void => {
    const rect = sv.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }
    state.s = clamp01((event.clientX - rect.left) / rect.width);
    state.v = 1 - clamp01((event.clientY - rect.top) / rect.height);
    sync();
  };

  let dragging = false;
  sv.addEventListener("pointerdown", (event) => {
    dragging = true;
    try {
      sv.setPointerCapture(event.pointerId);
    } catch {
      /* not supported */
    }
    setFromPointer(event);
    event.preventDefault();
  });
  sv.addEventListener("pointermove", (event) => {
    if (dragging) {
      setFromPointer(event);
    }
  });
  const stopDrag = (): void => {
    dragging = false;
  };
  sv.addEventListener("pointerup", stopDrag);
  sv.addEventListener("pointercancel", stopDrag);

  hue.addEventListener("input", () => {
    state.h = Number.parseFloat(hue.value);
    sync();
  });
  alpha.addEventListener("input", () => {
    state.a = clamp01(Number.parseFloat(alpha.value) / 100);
    sync();
  });
  formatSelect.addEventListener("change", () => {
    state.format = formatSelect.value as TColorFormat;
    textInput.value = formatColor(current(), state.format);
  });
  textInput.addEventListener("input", () => {
    const parsed = parseColor(textInput.value);
    if (!parsed) {
      return;
    }
    const hsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
    state.h = hsv.h;
    state.s = hsv.s;
    state.v = hsv.v;
    state.a = parsed.a;
    sync(true);
  });
  textInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      apply.click();
    }
  });

  /** Closes the picker. */
  const closePicker = (): void => {
    panel.remove();
    doc.removeEventListener("keydown", onKey, true);
  };
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closePicker();
      options.onCancel?.();
    }
  };

  close.addEventListener("click", () => {
    closePicker();
    options.onCancel?.();
  });
  cancel.addEventListener("click", () => {
    closePicker();
    options.onCancel?.();
  });
  apply.addEventListener("click", () => {
    options.onApply(formatColor(current(), state.format));
    closePicker();
  });
  doc.addEventListener("keydown", onKey, true);

  hue.value = String(Math.round(state.h));
  sync();
  textInput.focus();
  textInput.select();
}

/**
 * Opens the color picker for a swatch button and writes the result into `setValue`.
 *
 * @param doc      - The document.
 * @param anchor   - The swatch button.
 * @param value    - The current color.
 * @param setValue - Receives the chosen CSS color.
 */
export function pickColorFor(doc: Document, anchor: HTMLElement, value: string, setValue: (css: string) => void): void {
  openColorPicker({ document: doc, anchor, value, onApply: setValue });
}
// #endregion Color picker

// #region Gradient builder
/** The eight direction shortcuts shown as arrow buttons (cssgradient.io style). */
const DIRECTION_PRESETS: ReadonlyArray<{ label: string; deg: number }> = [
  { label: "↑", deg: 0 },
  { label: "↗", deg: 45 },
  { label: "→", deg: 90 },
  { label: "↘", deg: 135 },
  { label: "↓", deg: 180 },
  { label: "↙", deg: 225 },
  { label: "←", deg: 270 },
  { label: "↖", deg: 315 },
];

/**
 * Opens the professional gradient generator: linear / radial / conic, repeat toggle, angle or
 * shape+position, a draggable stop bar (click the bar to add a sampled stop), a stop editor list,
 * reverse / distribute helpers, the gradients this browser has already used and the live CSS output.
 *
 * @param options - See {@link IGradientBuilderOptions }.
 */
export function openGradientBuilder(options: IGradientBuilderOptions): void {
  const doc = options.document;
  ensureToolsCss(doc);

  const parsed = options.value ? parseGradient(options.value) : null;
  const spec: IGradientSpec = parsed ?? {
    type: "linear",
    angle: 180,
    stops: [
      { color: "#ffffff", position: 0 },
      { color: "#ff8c00", position: 100 },
    ],
  };

  /** The stop the stop editor targets (kept by identity so re-sorting does not lose it). */
  let selected: IGradientStop = spec.stops[0] ?? { color: "#ffffff", position: 0 };
  /** The stop currently being dragged on the bar. */
  let dragging: IGradientStop | null = null;

  /** Re-sorts the stops by position (stable, so equal positions keep their order). */
  const sortStops = (): void => {
    spec.stops.sort((left, right) => left.position - right.position);
  };

  const panel = create(doc, "div", "codbi-cse-tools");
  panel.style.width = "344px";

  const head = create(doc, "div", "codbi-cse-head");
  head.append(create(doc, "span", "codbi-cse-title", "Gradient"));
  const close = button(doc, "✕", "codbi-cse-close");
  head.appendChild(close);

  // Type + repeat.
  const typeRow = create(doc, "div", "codbi-cse-row");
  const typeSelect = create(doc, "select", "codbi-cse-text");
  typeSelect.style.flex = "0 0 auto";
  typeSelect.style.width = "96px";
  typeSelect.title = "Gradient type";
  for (const value of ["linear", "radial", "conic"] as const) {
    const option = create(doc, "option", undefined, value);
    option.value = value;
    typeSelect.appendChild(option);
  }
  typeSelect.value = spec.type;
  const repeatLabel = create(doc, "label", "codbi-cse-check");
  const repeatToggle = create(doc, "input");
  repeatToggle.type = "checkbox";
  repeatToggle.title = "repeating-…-gradient";
  repeatLabel.append(repeatToggle, create(doc, "span", undefined, "repeat"));
  typeRow.append(typeSelect, repeatLabel);

  // Geometry: angle (linear/conic) or shape + position (radial/conic).
  const geometryRow = create(doc, "div", "codbi-cse-row");
  const angleRange = create(doc, "input", "codbi-cse-range");
  angleRange.type = "range";
  angleRange.min = "0";
  angleRange.max = "360";
  angleRange.step = "1";
  angleRange.title = "Angle (deg)";
  const angleInput = create(doc, "input", "codbi-cse-pos");
  angleInput.type = "number";
  angleInput.min = "0";
  angleInput.max = "360";
  angleInput.step = "1";
  angleInput.title = "Angle (deg)";
  const angleUnit = create(doc, "span", undefined, "deg");
  geometryRow.append(angleRange, angleInput, angleUnit);

  const radialRow = create(doc, "div", "codbi-cse-row");
  const shapeSelect = create(doc, "select", "codbi-cse-text");
  shapeSelect.title = "Shape";
  for (const shape of ["circle", "ellipse"] as const) {
    const option = create(doc, "option", undefined, shape);
    option.value = shape;
    shapeSelect.appendChild(option);
  }
  const positionSelect = create(doc, "select", "codbi-cse-text");
  positionSelect.title = "Position";
  for (const position of [
    "center",
    "top",
    "bottom",
    "left",
    "right",
    "top left",
    "top right",
    "bottom left",
    "bottom right",
  ]) {
    const option = create(doc, "option", undefined, position);
    option.value = position;
    positionSelect.appendChild(option);
  }
  radialRow.append(shapeSelect, positionSelect);

  // The dominant preview, exactly like cssgradient.io's canvas.
  const bigPreview = create(doc, "div", "codbi-cse-bigpreview");
  const bigFill = create(doc, "div", "codbi-cse-bigfill");
  bigPreview.appendChild(bigFill);

  // The gradient bar: click it to add a stop, drag the round handles to move one.
  const bar = create(doc, "div", "codbi-cse-bar");
  bar.title = "Click the bar to add a color stop · drag a handle to move one";
  const addStop = button(doc, "＋ Add Color Stop", "codbi-cse-addstop");

  // Color stop grid (two columns, like the cssgradient.io color list).
  const stopsLabel = create(doc, "div", "codbi-cse-label", "Colors");
  const stopsHost = create(doc, "div", "codbi-cse-stopgrid");
  const stopTools = create(doc, "div", "codbi-cse-stoptools");
  const reverseBtn = button(doc, "⇄ Reverse", "codbi-cse-btn");
  const distributeBtn = button(doc, "≡ Distribute", "codbi-cse-btn");
  stopTools.append(reverseBtn, distributeBtn);

  // Direction shortcuts.
  const dirGrid = create(doc, "div", "codbi-cse-dirs");
  for (const preset of DIRECTION_PRESETS) {
    const dirBtn = create(doc, "button", "codbi-cse-dirbtn", preset.label);
    dirBtn.type = "button";
    dirBtn.title = `${preset.deg}deg`;
    dirBtn.dataset.deg = String(preset.deg);
    dirBtn.addEventListener("click", () => {
      spec.angle = preset.deg;
      refresh();
    });
    dirGrid.appendChild(dirBtn);
  }

  // Recently used gradients (persisted in this browser).
  const recentRow = create(doc, "div", "codbi-cse-labelrow");
  const clearRecentBtn = button(doc, "Clear", "codbi-cse-btn codbi-cse-btn--tiny");
  clearRecentBtn.title = "Forget the gradients stored in this browser";
  recentRow.append(create(doc, "span", "codbi-cse-label", "Recent"), clearRecentBtn);
  const presetsHost = create(doc, "div", "codbi-cse-presets");

  // CSS output as a dark code block with a copy button.
  const codeBox = create(doc, "div", "codbi-cse-code");
  const codeInput = create(doc, "input", "codbi-cse-text");
  codeInput.type = "text";
  codeInput.spellcheck = false;
  codeInput.readOnly = true;
  const copyBtn = button(doc, "Copy", "codbi-cse-btn");
  codeBox.append(codeInput, copyBtn);

  const foot = create(doc, "div", "codbi-cse-foot");
  const cancel = button(doc, "Cancel", "codbi-cse-btn");
  const insert = button(doc, "Insert", "codbi-cse-btn codbi-cse-btn--primary");
  foot.append(cancel, insert);

  panel.append(
    head,
    bigPreview,
    bar,
    addStop,
    stopsLabel,
    stopsHost,
    stopTools,
    typeRow,
    dirGrid,
    geometryRow,
    radialRow,
    recentRow,
    presetsHost,
    codeBox,
    foot,
  );
  doc.body.appendChild(panel);
  placePanel(panel, options.anchor);

  /** @returns the gradient color at `position` (interpolated between the neighbouring stops). */
  const colorAt = (position: number): string => {
    const stops = spec.stops;
    if (stops.length === 0) {
      return "#ffffff";
    }
    if (position <= stops[0].position) {
      return stops[0].color;
    }
    const last = stops[stops.length - 1];
    if (position >= last.position) {
      return last.color;
    }
    for (let index = 1; index < stops.length; index += 1) {
      const right = stops[index];
      const left = stops[index - 1];
      if (position > right.position) {
        continue;
      }
      const span = right.position - left.position;
      const ratio = span <= 0 ? 0 : (position - left.position) / span;
      const from = parseColor(left.color);
      const to = parseColor(right.color);
      if (!from || !to) {
        return right.color;
      }
      const mix = (a: number, b: number): number => Math.round(a + (b - a) * ratio);
      return formatColor(
        { r: mix(from.r, to.r), g: mix(from.g, to.g), b: mix(from.b, to.b), a: mix(from.a, to.a) },
        "hex",
      );
    }
    return last.color;
  };

  /** Updates the big preview, the bar background and the CSS field (cheap, no re-render). */
  const syncVisuals = (): void => {
    const css = buildGradient(spec);
    bigFill.style.background = css;
    bar.style.background = css;
    codeInput.value = css;
  };

  /** Mirrors the stop positions onto the existing handles (used while dragging, so no re-render). */
  const updateHandlePositions = (): void => {
    for (let index = 0; index < bar.children.length; index += 1) {
      const handle = bar.children[index] as HTMLElement;
      const stop = spec.stops[index];
      if (!stop) {
        continue;
      }
      handle.style.left = `${clampInt(stop.position, 100)}%`;
      handle.title = `${stop.color} · ${Math.round(stop.position)}%`;
    }
  };

  /** Moves the dragged stop to the pointer's X position on the bar. */
  const moveStopTo = (clientX: number): void => {
    if (!dragging) {
      return;
    }
    const rect = bar.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }
    dragging.position = clampInt(clamp01((clientX - rect.left) / rect.width) * 100, 100);
    updateHandlePositions();
    syncVisuals();
  };

  /** Renders one draggable handle per stop. */
  const renderBar = (): void => {
    bar.replaceChildren();
    for (const stop of spec.stops) {
      const handle = create(doc, "button", "codbi-cse-handle");
      handle.type = "button";
      handle.style.left = `${clampInt(stop.position, 100)}%`;
      const handleColor = parseColor(stop.color);
      handle.style.background = handleColor ? swatchCss(handleColor) : "#fff";
      handle.setAttribute("aria-selected", String(stop === selected));
      handle.setAttribute("aria-label", `Stop ${Math.round(stop.position)}%`);
      handle.title = `${stop.color} · ${Math.round(stop.position)}%`;

      handle.addEventListener("pointerdown", (event) => {
        selected = stop;
        dragging = stop;
        for (const other of Array.from(bar.children)) {
          other.setAttribute("aria-selected", String(other === handle));
        }
        try {
          handle.setPointerCapture(event.pointerId);
        } catch {
          /* not supported */
        }
        moveStopTo(event.clientX);
        event.preventDefault();
        event.stopPropagation();
      });
      handle.addEventListener("pointermove", (event) => {
        if (dragging === stop) {
          moveStopTo(event.clientX);
        }
      });
      const endDrag = (): void => {
        if (dragging !== stop) {
          return;
        }
        dragging = null;
        sortStops();
        refresh();
      };
      handle.addEventListener("pointerup", endDrag);
      handle.addEventListener("pointercancel", endDrag);
      handle.addEventListener("keydown", (event) => {
        const delta = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
        if (delta === 0) {
          return;
        }
        event.preventDefault();
        stop.position = clampInt(stop.position + delta, 100);
        updateHandlePositions();
        syncVisuals();
      });

      bar.appendChild(handle);
    }
  };

  /** Fully re-renders the panel from the spec. */
  const refresh = (): void => {
    syncVisuals();
    angleRange.value = String(Math.round(spec.angle));
    angleInput.value = String(Math.round(spec.angle));
    for (const node of Array.from(dirGrid.children)) {
      const deg = Number((node as HTMLElement).dataset.deg);
      node.setAttribute("aria-pressed", String(deg === Math.round(spec.angle)));
    }
    repeatToggle.checked = spec.repeating === true;
    angleRange.disabled = spec.type === "radial";
    angleInput.disabled = spec.type === "radial";
    shapeSelect.value = spec.shape ?? "circle";
    shapeSelect.disabled = spec.type !== "radial";
    positionSelect.value = spec.position ?? "center";
    positionSelect.disabled = spec.type === "linear";
    renderBar();
    renderStops();
  };

  /** Renders one editor row per stop. */
  const renderStops = (): void => {
    stopsHost.replaceChildren();
    for (let index = 0; index < spec.stops.length; index += 1) {
      const stop = spec.stops[index];
      const row = create(doc, "div", "codbi-cse-stop");
      row.setAttribute("aria-selected", String(stop === selected));
      row.addEventListener("mousedown", () => {
        // Selecting a row selects its handle (and vice versa) — no full re-render, so the focus stays.
        selected = stop;
        for (const other of Array.from(stopsHost.children)) {
          other.setAttribute("aria-selected", String(other === row));
        }
        renderBar();
      });

      const swatch = create(doc, "span", "codbi-cse-swatch");
      const color = parseColor(stop.color);
      swatch.style.background = color ? swatchCss(color) : "#fff";
      swatch.title = `Edit ${stop.color}`;
      swatch.addEventListener("click", () => {
        selected = stop;
        openColorPicker({
          document: doc,
          anchor: swatch,
          value: stop.color,
          onApply: (css) => {
            stop.color = css;
            refresh();
          },
        });
      });

      const position = create(doc, "input", "codbi-cse-pos");
      position.type = "number";
      position.min = "0";
      position.max = "100";
      position.value = String(clampInt(stop.position, 100));
      position.title = "Position (%)";
      position.addEventListener("input", () => {
        stop.position = clampInt(Number.parseFloat(position.value || "0"), 100);
        updateHandlePositions();
        syncVisuals();
      });
      position.addEventListener("change", () => {
        sortStops();
        refresh();
      });

      const remove = button(doc, "✕", "codbi-cse-btn codbi-cse-btn--danger");
      remove.title = "Remove stop";
      remove.disabled = spec.stops.length <= 2;
      remove.addEventListener("click", () => {
        const at = spec.stops.indexOf(stop);
        if (at >= 0) {
          spec.stops.splice(at, 1);
        }
        selected = spec.stops[0] ?? { color: "#ffffff", position: 0 };
        refresh();
      });

      row.append(swatch, position, remove);
      stopsHost.appendChild(row);
    }
  };

  typeSelect.addEventListener("change", () => {
    const next = typeSelect.value;
    spec.type = next === "radial" ? "radial" : next === "conic" ? "conic" : "linear";
    refresh();
  });
  repeatToggle.addEventListener("change", () => {
    spec.repeating = repeatToggle.checked;
    syncVisuals();
  });
  angleRange.addEventListener("input", () => {
    spec.angle = clampInt(Number.parseFloat(angleRange.value || "0"), 360);
    angleInput.value = String(spec.angle);
    syncVisuals();
  });
  angleInput.addEventListener("input", () => {
    spec.angle = clampInt(Number.parseFloat(angleInput.value || "0"), 360);
    angleRange.value = String(spec.angle);
    syncVisuals();
  });
  shapeSelect.addEventListener("change", () => {
    spec.shape = shapeSelect.value === "ellipse" ? "ellipse" : "circle";
    syncVisuals();
  });
  positionSelect.addEventListener("change", () => {
    spec.position = positionSelect.value;
    syncVisuals();
  });
  addStop.addEventListener("click", () => {
    const last = spec.stops[spec.stops.length - 1];
    const stop: IGradientStop = { color: last?.color ?? "#ffffff", position: last ? 100 : 0 };
    spec.stops.push(stop);
    selected = stop;
    sortStops();
    refresh();
  });
  reverseBtn.addEventListener("click", () => {
    spec.stops = spec.stops.map((stop) => ({ ...stop, position: 100 - clampInt(stop.position, 100) }));
    sortStops();
    refresh();
  });
  distributeBtn.addEventListener("click", () => {
    const last = Math.max(1, spec.stops.length - 1);
    for (let index = 0; index < spec.stops.length; index += 1) {
      spec.stops[index].position = Math.round((index / last) * 100);
    }
    sortStops();
    refresh();
  });
  copyBtn.addEventListener("click", () => {
    void navigator.clipboard?.writeText(codeInput.value);
  });

  // Clicking the empty part of the bar adds a stop with the color sampled at that position.
  bar.addEventListener("click", (event) => {
    if (event.target !== bar) {
      return;
    }
    const rect = bar.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }
    const position = clampInt(clamp01((event.clientX - rect.left) / rect.width) * 100, 100);
    const stop: IGradientStop = { color: colorAt(position), position };
    spec.stops.push(stop);
    selected = stop;
    sortStops();
    refresh();
  });

  clearRecentBtn.addEventListener("click", () => {
    clearGradientHistory();
    renderRecent();
  });

  /** Renders the gradients this browser has already seen applied (newest first). */
  function renderRecent(): void {
    presetsHost.replaceChildren();
    const history = readGradientHistory();
    if (history.length === 0) {
      presetsHost.appendChild(
        create(doc, "div", "codbi-cse-hint", "Gradients you insert are stored in this browser and listed here."),
      );
      return;
    }
    for (const entry of history) {
      const stored = parseGradient(entry);
      if (!stored) {
        continue;
      }
      const chip = create(doc, "button", "codbi-cse-preset");
      chip.type = "button";
      chip.title = entry;
      chip.setAttribute("aria-label", entry);
      chip.style.backgroundImage = entry;
      chip.addEventListener("click", () => {
        spec.type = stored.type;
        spec.angle = stored.angle;
        spec.repeating = stored.repeating === true;
        spec.shape = stored.shape;
        spec.position = stored.position;
        spec.stops = stored.stops.map((stop) => ({ ...stop }));
        selected = spec.stops[0] ?? { color: "#ffffff", position: 0 };
        refresh();
      });
      presetsHost.appendChild(chip);
    }
  }

  /** Closes the builder. */
  const closeBuilder = (): void => {
    panel.remove();
    doc.removeEventListener("keydown", onKey, true);
  };
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeBuilder();
      options.onCancel?.();
    }
  };

  close.addEventListener("click", () => {
    closeBuilder();
    options.onCancel?.();
  });
  cancel.addEventListener("click", () => {
    closeBuilder();
    options.onCancel?.();
  });
  insert.addEventListener("click", () => {
    const css = buildGradient(spec);
    // Remember what was actually applied, so it shows up in the "Recent" list next time.
    rememberGradient(css);
    options.onInsert(css);
    closeBuilder();
  });
  doc.addEventListener("keydown", onKey, true);

  refresh();
  renderRecent();
}
// #endregion Gradient builder
