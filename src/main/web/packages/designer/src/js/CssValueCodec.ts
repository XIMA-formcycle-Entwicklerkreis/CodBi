// #region Imports
// (none — this module is deliberately dependency-free so it can be unit-tested in isolation.)
// #endregion Imports

/**
 * The pure value-level logic behind the CSS parameter editor (see `CssEditor.ts`).
 *
 * Three things make a CodBi "CSS parameter" harder than a plain string, and every one of them is
 * handled here so the editor UI stays declarative:
 *
 * 1. **The `^` escape.** The runtime's `parseAttributeValue` splits any `data-cb-*` value that
 *    contains a comma into an ARRAY, and additionally escapes `{`/`}` so they are not mistaken for
 *    EP placeholders. A leading `^` switches both behaviours off. CSS very often contains commas
 *    (`rgba(0,0,0,.5)`, `linear-gradient(...)`, selector lists, `@media (min-width: …) and …`), so
 *    such a value MUST be stored with a `^` prefix — otherwise the functionality receives an array
 *    instead of the stylesheet.
 *
 * 2. **The angle-bracket dialect.** `HTML.CSS` converts `<`→`{`, `>`→`}` and `§`→`,` before it
 *    injects the stylesheet, precisely so that no real brace ever reaches the EP parser. Values of
 *    that parameter are therefore stored with `<`/`>` instead of `{`/`}`.
 *
 * 3. **Four different meanings.** The same parameter type is used for a whole stylesheet, for a bare
 *    declaration list (applied via `setAttribute("style", …)`), for a list of CSS classes and for a
 *    CSS selector. {@link cssKindOf } resolves which one a given parameter is.
 */

// #region Public constants
/** The escape prefix that keeps the attribute processor from CSV-splitting the value. */
export const CSS_ESCAPE_PREFIX = "^";

/** The character `HTML.CSS` maps to `<` (i.e. the opening brace in the stored form). */
export const CSS_DIALECT_OPEN = "<";

/** The character `HTML.CSS` maps to `>` (i.e. the closing brace in the stored form). */
export const CSS_DIALECT_CLOSE = ">";

/** The character `HTML.CSS` maps to `,`. */
export const CSS_DIALECT_COMMA = "§";
// #endregion Public constants

// #region Types
/**
 * The four meanings a `type: "css"` parameter can have:
 * - `stylesheet` — a whole rule list, injected as a `<style>` element (`HTML.CSS.CSS`).
 * - `declarations` — a bare `property: value;` list applied to one element's `style` attribute
 *   (`HTML.Panel.CSSHeaderUnfolded`, the `CSSProposals` / `CSSCropperHandle` styles, …).
 * - `classes` — a space separated list of CSS CLASS names (`DQ.Table.View.CSS`).
 * - `selector` — a CSS selector, not a style at all (`Print.Remove.DocumentSelector`, …).
 */
export type TCssParameterKind = "stylesheet" | "declarations" | "classes" | "selector";

/**
 * How braces are stored:
 * - `angle` — `<`/`>` (what `HTML.CSS` requires).
 * - `raw` — real `{`/`}` (kept escaped with `^` so the EP parser leaves them alone).
 */
export type TCssDialect = "angle" | "raw";

/** The severity of one {@link ICssIssue }. */
export type TCssIssueSeverity = "error" | "warning" | "info";

/** One problem found in a CSS value. */
export interface ICssIssue {
  /** How bad the problem is. */
  severity: TCssIssueSeverity;
  /** The human readable message. */
  message: string;
  /** The 1-based line the problem starts on (0 when it cannot be located). */
  line: number;
  /** An optional hint describing how to fix it. */
  hint?: string;
}

/** One rule of a parsed stylesheet. */
export interface ICssRule {
  /** The selector (or at-rule prelude, e.g. `@media (min-width: 40em)`). */
  selector: string;
  /** The declaration block WITHOUT the surrounding braces. */
  body: string;
}

/** One `property: value` pair. */
export interface ICssDeclaration {
  /** The property name (may be a `--custom-property`). */
  property: string;
  /** The value (without a trailing `!important`). */
  value: string;
  /** Whether the declaration was marked `!important`. */
  important: boolean;
}
// #endregion Types

// #region Kind / dialect resolution
/**
 * Resolves the {@link TCssParameterKind } of a parameter spec.
 *
 * An explicit `cssKind` always wins. Without one, `type: "selector"` means `selector` and every
 * other CSS parameter defaults to `stylesheet` (the `HTML.CSS` case, by far the most common).
 *
 * @param spec - The parameter spec (may be undefined).
 * @returns The resolved kind.
 */
export function cssKindOf(spec: { cssKind?: string; type?: string } | undefined): TCssParameterKind {
  const declared = String(spec?.cssKind ?? "")
    .trim()
    .toLowerCase();
  if (declared === "stylesheet" || declared === "declarations" || declared === "classes" || declared === "selector") {
    return declared;
  }
  return String(spec?.type ?? "").toLowerCase() === "selector" ? "selector" : "stylesheet";
}

/**
 * Resolves the brace dialect a kind is stored in.
 *
 * @param kind - The parameter kind.
 * @returns `angle` for stylesheets (as `HTML.CSS` requires), `raw` otherwise.
 */
export function cssDialectOf(kind: TCssParameterKind): TCssDialect {
  return kind === "stylesheet" ? "angle" : "raw";
}
// #endregion Kind / dialect resolution

// #region Value codec (`^` escape)
/**
 * Decodes a stored parameter value for editing: strips the `^` escape prefix and undoes the
 * `°{`/`°}` protection the runtime applies to escaped braces.
 *
 * A value that was already CSV-split into an array (a legacy value stored WITHOUT the `^` escape)
 * is re-joined with commas, which is exactly what the functionality would have received had the
 * escape been present.
 *
 * @param raw - The stored value (string, array or anything else).
 * @returns The editable text plus whether the value was `^`-escaped.
 */
export function decodeCssValue(raw: unknown): { text: string; escaped: boolean } {
  const asText = Array.isArray(raw) ? raw.map((entry) => String(entry)).join(",") : String(raw ?? "");
  const escaped = asText.startsWith(CSS_ESCAPE_PREFIX);
  const text = escaped ? asText.slice(CSS_ESCAPE_PREFIX.length) : asText;

  return { text: text.replace(/°\{/g, "{").replace(/°\}/g, "}"), escaped };
}

/**
 * Whether a value MUST carry the `^` escape: the attribute processor splits on every comma that is
 * not inside a `<[field reference]>`, which would turn the CSS into an array.
 *
 * @param text - The value (without the escape prefix).
 * @returns True when the value contains a comma.
 */
export function cssNeedsEscape(text: string): boolean {
  return String(text ?? "").includes(",");
}

/**
 * Encodes edited text back into the stored parameter value: applies the kind's brace dialect and
 * adds the `^` escape when the value contains a comma.
 *
 * @param text         - The edited text (as shown to the user, i.e. with real braces).
 * @param kind         - The parameter kind (drives the brace dialect).
 * @param keepVerbatim - When true the text is stored exactly as typed (no dialect conversion); used
 *                       by the editor's "raw stored form" mode.
 * @returns The value to write into the attribute.
 */
export function encodeCssValue(text: string, kind: TCssParameterKind, keepVerbatim = false): string {
  let out = String(text ?? "");

  if (kind === "stylesheet" && !keepVerbatim) {
    out = out.replace(/\{/g, CSS_DIALECT_OPEN).replace(/\}/g, CSS_DIALECT_CLOSE);
  } else if (kind === "classes") {
    out = parseClassList(out).join(" ");
  } else if (kind === "selector") {
    out = out.trim().replace(/\s*\r?\n\s*/g, " ");
  } else {
    out = out.trim();
  }

  return cssNeedsEscape(out) ? `${CSS_ESCAPE_PREFIX}${out}` : out;
}

/**
 * Converts the STORED form of a stylesheet to the display form (real braces).
 *
 * The conversion is only performed when every `>` is a closing brace — a `>` that no `<` opened is a
 * child combinator, which the dialect cannot represent at all. In that case the text is returned
 * unchanged (and {@link lintCss } reports the problem) instead of being silently mangled.
 *
 * @param text - The stored text.
 * @returns The display text.
 */
export function dialectToBraces(text: string): string {
  const source = String(text ?? "");
  if (!source.includes(CSS_DIALECT_OPEN) && !source.includes(CSS_DIALECT_CLOSE)) {
    return source;
  }

  let depth = 0;
  for (const char of source) {
    if (char === CSS_DIALECT_OPEN) {
      depth += 1;
    } else if (char === CSS_DIALECT_CLOSE) {
      if (depth === 0) {
        // An unmatched `>` — a child combinator, not a closing brace.
        return source;
      }
      depth -= 1;
    }
  }

  return source.replace(/</g, "{").replace(/>/g, "}");
}

/**
 * Converts the DISPLAY form (real braces) to the stored angle-bracket form.
 *
 * @param text - The display text.
 * @returns The stored text.
 */
export function bracesToDialect(text: string): string {
  return String(text ?? "")
    .replace(/\{/g, CSS_DIALECT_OPEN)
    .replace(/\}/g, CSS_DIALECT_CLOSE);
}
// #endregion Value codec (`^` escape)

// #region Parsing / serializing
/**
 * Splits a declaration list into {@link ICssDeclaration }s, honouring nested parentheses, strings and
 * comments (so the commas and semicolons inside `rgba(0, 0, 0, .5)` or `content: ";"` are safe).
 *
 * @param text - A `property: value; …` list (with or without the trailing `;`).
 * @returns The parsed declarations.
 */
export function splitDeclarations(text: string): ICssDeclaration[] {
  const source = stripComments(String(text ?? ""));
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let quote = "";

  for (const char of source) {
    if (quote !== "") {
      current += char;
      if (char === quote) {
        quote = "";
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth = Math.max(0, depth - 1);
    }
    if (char === ";" && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim() !== "") {
    parts.push(current);
  }

  const declarations: ICssDeclaration[] = [];
  for (const part of parts) {
    const colon = part.indexOf(":");
    if (colon <= 0) {
      continue;
    }
    const property = part.slice(0, colon).trim();
    let value = part.slice(colon + 1).trim();
    let important = false;
    if (/!\s*important$/i.test(value)) {
      important = true;
      value = value.replace(/\s*!\s*important$/i, "").trim();
    }
    if (property === "") {
      continue;
    }
    declarations.push({ property, value, important });
  }

  return declarations;
}

/**
 * Serializes declarations back into a compact `property: value;` list.
 *
 * @param declarations - The declarations.
 * @returns The declaration list.
 */
export function joinDeclarations(declarations: ReadonlyArray<ICssDeclaration>): string {
  return declarations
    .filter((declaration) => declaration.property.trim() !== "")
    .map((declaration) => {
      const important = declaration.important ? " !important" : "";
      return `${declaration.property.trim()}: ${declaration.value.trim()}${important};`;
    })
    .join(" ");
}

/** Removes `/* … *\/` comments so the parser does not see their punctuation. */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Parses a stylesheet into its top-level rules. Nested blocks (e.g. the inner rules of `@media`) are
 * kept INSIDE the owning rule's `body`, so no content is ever lost.
 *
 * @param text - The stylesheet (real braces).
 * @returns The parsed rules; anything outside a block becomes a rule with an empty body.
 */
export function parseCssRules(text: string): ICssRule[] {
  const source = String(text ?? "");
  const rules: ICssRule[] = [];
  let selector = "";
  let body = "";
  let depth = 0;
  let quote = "";

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quote !== "") {
      if (depth > 0) {
        body += char;
      } else {
        selector += char;
      }
      if (char === quote) {
        quote = "";
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      if (depth > 0) {
        body += char;
      } else {
        selector += char;
      }
      continue;
    }
    if (char === "{") {
      depth += 1;
      if (depth > 1) {
        body += char;
      }
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth <= 0) {
        rules.push({ selector: selector.trim(), body: body.trim() });
        selector = "";
        body = "";
        depth = 0;
        continue;
      }
      body += char;
      continue;
    }
    if (depth > 0) {
      body += char;
    } else {
      selector += char;
    }
  }

  if (selector.trim() !== "" || body.trim() !== "") {
    rules.push({ selector: selector.trim(), body: body.trim() });
  }

  return rules;
}

/** A keyframe step selector: `from`, `to` or a percentage. */
const KEYFRAME_STEP_SELECTOR = /^(?:from|to|-?\d+(?:\.\d+)?%)$/i;

/**
 * @param text - A `declarations` value.
 * @returns Whether it is a KEYFRAME STEP list (`0% { … } 100% { … }`) instead of a flat block.
 *
 * Some CSS parameters hold keyframe STEPS, not declarations: `HTML.Panel`'s `CSSAnimFadeINPanel` is
 * wrapped by the runtime as `@keyframes … { <value> }` (see `html.panel.ts`). Parsing such a value as
 * a flat declaration block produces bogus "unknown property" reports for every `0% { … }` prelude and
 * mangles it when formatting, so every consumer has to recognise the shape first.
 */
export function isKeyframeSteps(text: string): boolean {
  const source = String(text ?? "");
  if (!source.includes("{")) {
    return false;
  }
  const rules = parseCssRules(source);
  if (rules.length === 0) {
    return false;
  }
  return rules.every((rule) =>
    rule.selector
      .split(",")
      .map((part) => part.trim())
      .every((part) => KEYFRAME_STEP_SELECTOR.test(part)),
  );
}

/**
 * Serializes a rule list back into a stylesheet (one rule per block, newline separated).
 *
 * @param rules - The rules.
 * @returns The stylesheet text.
 */
export function serializeCssRules(rules: ReadonlyArray<ICssRule>): string {
  return rules
    .filter((rule) => rule.selector.trim() !== "")
    .map((rule) => `${rule.selector.trim()} { ${rule.body.trim()} }`)
    .join("\n");
}
// #endregion Parsing / serializing

// #region Formatting
/**
 * Pretty-prints a CSS parameter value: one selector per rule, one declaration per line, two space
 * indent — or, for a bare declaration list, one declaration per line.
 *
 * An editor always works on this form: a parameter is commonly stored as one long line
 * (`position : relative ; box-shadow : …`), which cannot be read or edited in a text field.
 *
 * @param text - The value.
 * @param kind - The parameter kind (a `declarations` value has no rules).
 * @returns The formatted value.
 */
export function formatCss(text: string, kind: TCssParameterKind = "stylesheet"): string {
  // Keyframe steps are RULES (`0% { … }`), so they take the rule path below instead of the flat
  // declaration formatting.
  if (kind === "declarations" && !isKeyframeSteps(text)) {
    return splitDeclarations(text)
      .map((declaration) => {
        const important = declaration.important ? " !important" : "";
        return `${declaration.property.trim()}: ${declaration.value.trim()}${important};`;
      })
      .join("\n");
  }
  const rules = parseCssRules(text);
  if (rules.length === 0) {
    return joinDeclarations(splitDeclarations(text));
  }

  const blocks: string[] = [];
  for (const rule of rules) {
    const selector = rule.selector.trim();
    if (selector === "") {
      continue;
    }
    if (selector.startsWith("@") && rule.body.includes("{")) {
      blocks.push(`${selector} {\n${indentBlock(rule.body)}\n}`);
      continue;
    }
    const declarations = splitDeclarations(rule.body);
    const lines = declarations.map((declaration) => {
      const important = declaration.important ? " !important" : "";
      return `  ${declaration.property}: ${declaration.value}${important};`;
    });
    blocks.push(`${selector} {\n${lines.join("\n")}\n}`);
  }

  return blocks.join("\n\n");
}

/** Indents every line of a nested block by one level (used for `@media` bodies). */
function indentBlock(body: string): string {
  return body
    .split(/\r?\n/)
    .map((line) => (line.trim() === "" ? "" : `  ${line.trim()}`))
    .join("\n");
}

/**
 * Minifies a stylesheet: no whitespace around braces / semicolons, a single space after a colon.
 *
 * @param text - The stylesheet.
 * @returns The minified stylesheet.
 */
export function minifyCss(text: string): string {
  return String(text ?? "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};:,])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}
// #endregion Formatting

// #region Class list helpers
/**
 * Parses a space separated class list into its distinct, non-empty class names.
 *
 * @param text - The class list (`.a .b` and `a,b` are both tolerated).
 * @returns The normalized class names (without a leading dot).
 */
export function parseClassList(text: string): string[] {
  const tokens = String(text ?? "")
    .split(/[\s,]+/)
    .map((token) => token.trim().replace(/^\./, ""))
    .filter((token) => token !== "" && !token.startsWith("#"));

  return Array.from(new Set(tokens));
}

/**
 * Extracts the CSS **class names** from a selector so the editor can offer them as completions.
 *
 * @param selector - A CSS selector.
 * @returns The class names found in it.
 */
export function classesInSelector(selector: string): string[] {
  const found: string[] = [];
  for (const match of String(selector ?? "").matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
    found.push(match[1]);
  }

  return Array.from(new Set(found));
}
// #endregion Class list helpers

// #region Placeholders
/**
 * Lists the `PLACEHOLDER` tokens a stylesheet references.
 *
 * `HTML.CSS` replaces every occurrence of the `Replacements` entries verbatim, so a placeholder is
 * simply a bare word that also appears on the left-hand side of a `placeholder | value` pair — the
 * editor cannot know the pairs, so it reports every ALL-CAPS-ish token that is not a CSS keyword.
 *
 * @param text - The CSS text.
 * @returns The distinct placeholder candidates, in order of appearance.
 */
export function extractPlaceholders(text: string): string[] {
  const found: string[] = [];
  for (const match of String(text ?? "").matchAll(/(?<![-\w.])([A-Z][A-Z0-9_]{2,})(?![-\w])/g)) {
    if (!found.includes(match[1])) {
      found.push(match[1]);
    }
  }

  return found;
}
// #endregion Placeholders

// #region Property dictionary
/** A pragmatic subset of the CSS property names used for the "unknown property" warning. */
const KNOWN_PROPERTIES: ReadonlySet<string> = new Set<string>([
  "accent-color",
  "align-content",
  "align-items",
  "align-self",
  "animation",
  "animation-delay",
  "animation-direction",
  "animation-duration",
  "animation-fill-mode",
  "animation-iteration-count",
  "animation-name",
  "animation-timing-function",
  "aspect-ratio",
  "backdrop-filter",
  "backface-visibility",
  "background",
  "background-attachment",
  "background-blend-mode",
  "background-clip",
  "background-color",
  "background-image",
  "background-origin",
  "background-position",
  "background-repeat",
  "background-size",
  "border",
  "border-bottom",
  "border-bottom-color",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
  "border-bottom-style",
  "border-bottom-width",
  "border-collapse",
  "border-color",
  "border-image",
  "border-left",
  "border-left-color",
  "border-left-style",
  "border-left-width",
  "border-radius",
  "border-right",
  "border-spacing",
  "border-style",
  "border-top",
  "border-top-color",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-top-style",
  "border-top-width",
  "border-width",
  "bottom",
  "box-shadow",
  "box-sizing",
  "caret-color",
  "clear",
  "clip",
  "clip-path",
  "color",
  "color-scheme",
  "column-count",
  "column-gap",
  "column-rule",
  "columns",
  "contain",
  "content",
  "cursor",
  "direction",
  "display",
  "filter",
  "flex",
  "flex-basis",
  "flex-direction",
  "flex-flow",
  "flex-grow",
  "flex-shrink",
  "flex-wrap",
  "float",
  "font",
  "font-family",
  "font-feature-settings",
  "font-size",
  "font-stretch",
  "font-style",
  "font-variant",
  "font-weight",
  "gap",
  "grid",
  "grid-area",
  "grid-auto-columns",
  "grid-auto-flow",
  "grid-auto-rows",
  "grid-column",
  "grid-column-end",
  "grid-column-start",
  "grid-row",
  "grid-row-end",
  "grid-row-start",
  "grid-template",
  "grid-template-areas",
  "grid-template-columns",
  "grid-template-rows",
  "height",
  "hyphens",
  "inset",
  "isolation",
  "justify-content",
  "justify-items",
  "justify-self",
  "left",
  "letter-spacing",
  "line-height",
  "list-style",
  "list-style-image",
  "list-style-position",
  "list-style-type",
  "margin",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "max-height",
  "max-width",
  "min-height",
  "min-width",
  "mix-blend-mode",
  "object-fit",
  "object-position",
  "opacity",
  "order",
  "outline",
  "outline-color",
  "outline-offset",
  "outline-style",
  "outline-width",
  "overflow",
  "overflow-wrap",
  "overflow-x",
  "overflow-y",
  "padding",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "perspective",
  "place-content",
  "place-items",
  "pointer-events",
  "position",
  "quotes",
  "resize",
  "right",
  "rotate",
  "row-gap",
  "scale",
  "scroll-behavior",
  "scroll-margin",
  "scroll-padding",
  "table-layout",
  "text-align",
  "text-decoration",
  "text-decoration-color",
  "text-decoration-line",
  "text-decoration-style",
  "text-indent",
  "text-overflow",
  "text-shadow",
  "text-transform",
  "top",
  "transform",
  "transform-origin",
  "transition",
  "transition-delay",
  "transition-duration",
  "transition-property",
  "transition-timing-function",
  "translate",
  "user-select",
  "vertical-align",
  "visibility",
  "white-space",
  "width",
  "will-change",
  "word-break",
  "word-spacing",
  "word-wrap",
  "writing-mode",
  "z-index",
  "zoom",
]);

/** @returns whether a property name is known (custom `--x` properties are always accepted). */
export function isKnownProperty(property: string): boolean {
  const name = String(property ?? "")
    .trim()
    .toLowerCase();
  if (name.startsWith("--") || name.startsWith("-")) {
    return true;
  }
  return KNOWN_PROPERTIES.has(name);
}

/** @returns the sorted list of known property names (used for autocompletion). */
export function knownProperties(): string[] {
  return Array.from(KNOWN_PROPERTIES).sort((a, b) => a.localeCompare(b));
}
// #endregion Property dictionary

// #region Linting
/** The patterns `HTML.CSS.sanitizeCss` removes or neutralizes at runtime, with their replacement. */
const SANITIZER_RULES: ReadonlyArray<{ pattern: RegExp; replacement: string; hint: string }> = [
  {
    pattern: /url\s*\(\s*(?:https?:\/\/[^)]*)\s*\)/gi,
    replacement: "/* external URL blocked */",
    hint: "Use a relative URL (e.g. url(/images/bg.png)) or a data: URI.",
  },
  { pattern: /javascript\s*:/gi, replacement: "blocked:", hint: "Remove the javascript: URL." },
  { pattern: /expression\s*\(/gi, replacement: "blocked(", hint: "Remove the legacy expression()." },
  { pattern: /-moz-binding\s*:/gi, replacement: "-moz-blocked:", hint: "Remove the legacy -moz-binding." },
  { pattern: /behavior\s*:/gi, replacement: "blocked:", hint: "Remove the legacy behavior property." },
];

/**
 * Applies the SAME replacements `HTML.CSS.sanitizeCss` performs at runtime, so the editor's preview
 * shows what will actually be injected (and never anything more).
 *
 * Keep this in sync with `sanitizeCss` in `html.css.ts`.
 *
 * @param text - The CSS text.
 * @returns The sanitized text.
 */
export function sanitizeCssForPreview(text: string): string {
  let out = String(text ?? "");
  for (const rule of SANITIZER_RULES) {
    rule.pattern.lastIndex = 0;
    out = out.replace(rule.pattern, rule.replacement);
  }
  return out;
}

/** @returns the 1-based line number of a character index. */
function lineAt(text: string, index: number): number {
  return text.slice(0, Math.max(0, index)).split("\n").length;
}

/**
 * Runs every check the editor can perform without a live document.
 *
 * @param text             - The CSS text (display form, i.e. with real braces).
 * @param kind             - The parameter kind (drives which checks apply).
 * @param validateSelector - Optional selector validator: returns an error message or `null`.
 * @returns The issues, ordered by line.
 */
export function lintCss(
  text: string,
  kind: TCssParameterKind,
  validateSelector?: (selector: string) => string | null,
): ICssIssue[] {
  const source = String(text ?? "");
  const issues: ICssIssue[] = [];

  if (kind === "classes") {
    const raw = source.trim();
    if (raw === "") {
      return issues;
    }
    if (raw.includes("#")) {
      issues.push({
        severity: "warning",
        message: "An ID selector is not a class name.",
        line: 1,
        hint: "Use the class name without the leading '#', or the '.class' form.",
      });
    }
    for (const token of raw.split(/\s+/)) {
      if (token.startsWith(".") === false && /[.[\]>+~:]/.test(token)) {
        issues.push({
          severity: "warning",
          message: `"${token}" is a selector, not a plain class name.`,
          line: 1,
          hint: "This parameter adds CLASSES; enter names such as 'my-table my-table--compact'.",
        });
        break;
      }
    }
    return issues;
  }

  if (kind === "selector") {
    const selector = source.trim();
    if (selector !== "" && validateSelector) {
      const error = validateSelector(selector);
      if (error) {
        issues.push({ severity: "error", message: `Invalid selector: ${error}`, line: 1 });
      }
    }
    if (selector.includes("{")) {
      issues.push({
        severity: "error",
        message: "This parameter takes a SELECTOR, not a rule block.",
        line: 1,
        hint: "Enter e.g. '.my-container' — the declarations belong to the functionality.",
      });
    }
    return issues;
  }

  const structural = lintStructure(source);
  issues.push(...structural);

  // Declarations: unknown properties. A keyframe-step list is checked per STEP (its preludes `0%` are
  // selectors, not property names).
  const declarations =
    kind === "declarations" && !isKeyframeSteps(source)
      ? splitDeclarations(source)
      : parseCssRules(source).flatMap((rule) => splitDeclarations(rule.body));

  for (const declaration of declarations) {
    if (!isKnownProperty(declaration.property)) {
      issues.push({
        severity: "warning",
        message: `Unknown property "${declaration.property}".`,
        line: 1,
        hint: "Check the spelling — unknown properties are ignored by the browser.",
      });
    }
    if (declaration.value.trim() === "") {
      issues.push({
        severity: "error",
        message: `"${declaration.property}" has no value.`,
        line: 1,
      });
    }
  }

  // Runtime sanitizer.
  for (const rule of SANITIZER_RULES) {
    rule.pattern.lastIndex = 0;
    const match = rule.pattern.exec(source);
    if (match) {
      issues.push({
        severity: "warning",
        message: `"${match[0].trim()}" is stripped at runtime (replaced with "${rule.replacement}").`,
        line: lineAt(source, match.index),
        hint: rule.hint,
      });
    }
  }

  // Child combinators cannot survive the angle-bracket dialect.
  if (kind === "stylesheet" && hasUnmatchedClosingBraceAsCombinator(source)) {
    issues.push({
      severity: "warning",
      message: "A '>' child combinator cannot be stored in the CodBi angle-bracket dialect.",
      line: 1,
      hint: "Rewrite 'a > b' as 'a b' (descendant), or move the rule into HTML.CSS via a class.",
    });
  }

  return issues.sort((a, b) => a.line - b.line);
}

/** Checks brace/paren/quote balance and reports empty rules. */
function lintStructure(source: string): ICssIssue[] {
  const issues: ICssIssue[] = [];
  let braces = 0;
  let parens = 0;
  let quote = "";
  let quoteStart = 0;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quote !== "") {
      if (char === quote && source[i - 1] !== "\\") {
        quote = "";
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      quoteStart = i;
      continue;
    }
    if (char === "{") {
      braces += 1;
    } else if (char === "}") {
      braces -= 1;
      if (braces < 0) {
        issues.push({ severity: "error", message: "Unexpected '}'.", line: lineAt(source, i) });
        braces = 0;
      }
    } else if (char === "(") {
      parens += 1;
    } else if (char === ")") {
      parens -= 1;
      if (parens < 0) {
        issues.push({ severity: "error", message: "Unexpected ')'.", line: lineAt(source, i) });
        parens = 0;
      }
    }
  }

  if (quote !== "") {
    issues.push({
      severity: "error",
      message: `Unterminated ${quote === '"' ? "double" : "single"} quote.`,
      line: lineAt(source, quoteStart),
    });
  }
  if (braces > 0) {
    issues.push({ severity: "error", message: `${braces} closing '}' missing.`, line: lineAt(source, source.length) });
  }
  if (parens > 0) {
    issues.push({ severity: "error", message: `${parens} closing ')' missing.`, line: lineAt(source, source.length) });
  }

  for (const rule of parseCssRules(source)) {
    if (rule.selector.trim() === "" && rule.body.trim() !== "") {
      issues.push({ severity: "error", message: "A rule has no selector.", line: 1 });
    }
  }

  return issues;
}

/** @returns whether the text contains a `>` that is a child combinator rather than a closing brace. */
function hasUnmatchedClosingBraceAsCombinator(source: string): boolean {
  let depth = 0;
  for (const char of source) {
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth = Math.max(0, depth - 1);
    } else if (char === ">" && depth === 0) {
      return true;
    }
  }
  return false;
}
// #endregion Linting

// #region Summary
/**
 * Builds the one-line summary shown next to the "⧉ Edit" launcher and in the tooltip header.
 *
 * @param raw  - The stored value.
 * @param spec - The parameter spec.
 * @returns A short description (e.g. `4 rules · 9 declarations · 2 placeholders`).
 */
export function cssValueSummary(raw: unknown, spec?: { cssKind?: string; type?: string }): string {
  const { text } = decodeCssValue(raw);
  const kind = cssKindOf(spec);

  if (text.trim() === "") {
    if (kind === "classes") {
      return "no classes";
    }
    if (kind === "selector") {
      return "no selector";
    }
    return kind === "declarations" ? "no declarations" : "empty stylesheet";
  }

  if (kind === "classes") {
    const count = parseClassList(text).length;
    return `${count} class${count === 1 ? "" : "es"}`;
  }
  if (kind === "selector") {
    const count = text.split(",").filter((part) => part.trim() !== "").length;
    return `${count} selector${count === 1 ? "" : "s"}`;
  }

  const display = kind === "stylesheet" ? dialectToBraces(text) : text;
  if (kind === "declarations") {
    if (isKeyframeSteps(display)) {
      const steps = parseCssRules(display).length;
      return `${steps} keyframe step${steps === 1 ? "" : "s"}`;
    }
    const count = splitDeclarations(display).length;
    return `${count} declaration${count === 1 ? "" : "s"}`;
  }

  const rules = parseCssRules(display);
  const declarations = rules.reduce((total, rule) => total + splitDeclarations(rule.body).length, 0);
  const placeholders = extractPlaceholders(display).length;
  const parts = [
    `${rules.length} rule${rules.length === 1 ? "" : "s"}`,
    `${declarations} declaration${declarations === 1 ? "" : "s"}`,
  ];
  if (placeholders > 0) {
    parts.push(`${placeholders} placeholder${placeholders === 1 ? "" : "s"}`);
  }
  return parts.join(" · ");
}
// #endregion Summary
