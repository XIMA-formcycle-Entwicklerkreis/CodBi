// Generates the `parameters` metadata channel for **CodBi Functionalities**.
//
// For every `Functionalities/<name>.ts` it derives the TYPE of each parameter from
//   (a) an explicit `@ParameterTypes({ … })` method decorator (author overrides — highest priority),
//   (b) the xdbc DBC decorators on the `toLoad` parameter (`@TYPE.PRE`, `@IF.PRE`, `@OR.PRE`,
//       `@REGEX.PRE`, `@INSTANCE.PRE`, …) and
//   (c) the TSDoc `(### )Config Parameter:` block (boolean hints + defaults),
// then:
//   1. writes the merged map into the sibling `<name>.json` as `parameters`, which
//      `CodbiFormDesignerResourcePlugin.getDetails()` merges into
//      `window.CodbiPluginData.detFunctionalities[*].parameters`, and
//   2. (unless `--no-inject`) places/replaces the corresponding `@ParameterTypes({ … })`
//      decorator directly above the `functionality()` method, so the source is self-documenting and
//      the derived specs become the explicit overrides on the next run (idempotent).
//
// Usage: `node scripts/generate-parameter-types.mjs [--no-inject] [--dry]`
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/main/web/packages/form/src/js/Functionalities";
const NO_INJECT = process.argv.includes("--no-inject");
const DRY = process.argv.includes("--dry");

const PARAM_TYPES_MARKER = "@ParameterTypes(";
const DBC_DECORATORS = ["TYPE", "IF", "OR", "REGEX", "INSTANCE", "DEFINED", "EQ", "GREATER", "DIFFERENT"];

/** Type ranks — the highest-ranked signal wins when several decorators mention the same parameter. */
const RANK = { boolean: 5, enum: 4, integer: 3, number: 2, string: 1 };

/** Extracts the balanced `( … )` body that starts at the opening paren index `open`. */
function extractBalanced(content, open) {
  let depth = 0;
  let inString = null;

  for (let i = open; i < content.length; i++) {
    const c = content[i];

    if (inString) {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === inString) {
        inString = null;
      }
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inString = c;
      continue;
    }
    if (c === "(") {
      depth++;
    } else if (c === ")") {
      depth--;
      if (depth === 0) {
        return content.slice(open + 1, i);
      }
    }
  }

  return undefined;
}

/** Extracts the balanced `{ … }` / `[ … ]` / `( … )` body that starts at the opening index `open`. */
function extractBalancedAny(content, open) {
  const pairs = { "{": "}", "[": "]", "(": ")" };
  const closer = pairs[content[open]];

  if (!closer) {
    return undefined;
  }
  let depth = 0;
  let inString = null;

  for (let i = open; i < content.length; i++) {
    const c = content[i];

    if (inString) {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === inString) {
        inString = null;
      }
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inString = c;
      continue;
    }
    if (c === "{" || c === "[" || c === "(") {
      depth++;
    } else if (c === "}" || c === "]" || c === ")") {
      depth--;
      if (depth === 0) {
        return content.slice(open + 1, i);
      }
    }
  }

  return undefined;
}

/** All single/double/backtick string literals inside `text` (values only, quotes stripped). */
function stringLiterals(text) {
  const out = [];
  const re = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
  let m = re.exec(text);

  while (m !== null) {
    out.push(m[2].replace(/\\(.)/g, "$1"));
    m = re.exec(text);
  }

  return out;
}

/** Finds every `<name>.PRE( … )` DBC decorator segment in `content`. */
function dbcSegments(content) {
  const segments = [];
  const re = /@(TYPE|IF|OR|REGEX|INSTANCE|DEFINED|EQ|GREATER|DIFFERENT)\.PRE\(/g;
  let m = re.exec(content);

  while (m !== null) {
    const open = m.index + m[0].length - 1;
    const body = extractBalanced(content, open);

    if (body !== undefined) {
      segments.push({ name: m[1], body });
    }
    m = re.exec(content);
  }

  return segments;
}

/** Splits a `::`/`,` separated parameter list into bare, lower-cased tokens. */
function paramTokens(literal) {
  return literal
    .split(/::|,/)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 0);
}

/** Applies one inferred type to the target params when its rank beats the current one. */
function apply(picked, params, type, extra) {
  const rank = RANK[type] ?? 0;

  for (const name of params) {
    const current = picked.get(name);

    if (!current || rank > current.rank) {
      picked.set(name, { rank, spec: { type, ...extra } });
    }
  }
}

/** Derives an enum option list from a regex body, or `undefined` when it is not a literal alternation. */
function enumFromRegexBody(body) {
  const groups = body.match(/\(([^()]*)\)/g) ?? [];

  for (const group of groups) {
    const inner = group.slice(1, -1);

    if (!inner.includes("|")) {
      continue;
    }
    const options = inner.split("|").map((option) => option.trim());

    if (options.length < 2 || !options.every((option) => /^[A-Za-z0-9 _-]+$/.test(option))) {
      continue;
    }
    const lowered = options.map((option) => option.toLowerCase());

    if (lowered.length === 2 && lowered.includes("true") && lowered.includes("false")) {
      return { boolean: true };
    }

    return { options };
  }

  return undefined;
}

/** Infers the type contributed by one DBC decorator segment. */
function inferFromSegment(segment) {
  const literals = stringLiterals(segment.body);

  if (segment.name === "TYPE") {
    const declared = (literals[0] ?? "string").toLowerCase();

    if (declared.includes("boolean")) {
      return "boolean";
    }
    if (declared.includes("number")) {
      return "number";
    }
    return "string";
  }

  if (segment.name === "IF") {
    if (/new\s+TYPE\(\s*["']boolean["']\s*\)/.test(segment.body) || /stdExp\.boolean/.test(segment.body)) {
      return "boolean";
    }
    if (/new\s+TYPE\(\s*["']number["']\s*\)/.test(segment.body)) {
      return "number";
    }
    const regex = regexLiteral(segment.body);

    if (regex !== undefined) {
      return typeFromRegex(regex.body, regex.flags);
    }
    return "string";
  }

  if (segment.name === "OR") {
    if (/TYPE\(\s*["']boolean["']\s*\)/.test(segment.body)) {
      return "boolean";
    }
    if (/TYPE\(\s*["']number["']\s*\)/.test(segment.body)) {
      return "number";
    }
    return "string";
  }

  if (segment.name === "REGEX") {
    if (/stdExp\.boolean/.test(segment.body)) {
      return "boolean";
    }
    const regex = regexLiteral(segment.body);

    if (regex !== undefined) {
      return typeFromRegex(regex.body, regex.flags);
    }
    return "string";
  }

  return "string";
}

/** @returns the FIRST regex literal `{ body, flags }` in `text`, or undefined when there is none. */
function regexLiteral(text) {
  const m = text.match(/\/((?:[^/\\[]|\\.|\[(?:[^\]]|\\.)*\])+)\/([gimsuy]*)/);
  return m ? { body: m[1], flags: m[2] } : undefined;
}

/** Maps a regex to a parameter type (boolean / integer / number / enum / string). */
function typeFromRegex(body, flags) {
  const enumerable = enumFromRegexBody(body);

  if (enumerable?.boolean) {
    return "boolean";
  }
  if (enumerable?.options) {
    // A case-insensitive regex whose alternatives are single letters (`/(D|W|M|Y)/i`) is almost always
    // compared case-SENSITIVELY at runtime — emit lower-case options so the value actually matches.
    const options =
      flags.includes("i") && enumerable.options.every((option) => /^[A-Za-z]$/.test(option))
        ? enumerable.options.map((option) => option.toLowerCase())
        : enumerable.options;
    return { type: "enum", options };
  }
  if (/\\d/.test(body)) {
    return /\\\./.test(body) ? "number" : "integer";
  }
  return "string";
}

/** Parses the `(### )Config Parameter:` TSDoc block into per-parameter hints (boolean + default). */
function tsdocHints(content) {
  const hints = new Map();
  const header = content.indexOf("Config Parameter:");

  if (header === -1) {
    return hints;
  }
  const start = content.lastIndexOf("/**", header);
  const end = content.indexOf("*/", header);

  if (start === -1 || end === -1) {
    return hints;
  }
  // Strip the leading ` * ` JSDoc ornament from every line so bullets can be matched reliably.
  const lines = content
    .slice(start, end)
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\*?\s?/, ""));
  const headerIndex = lines.findIndex((line) => line.includes("Config Parameter:"));

  if (headerIndex === -1) {
    return hints;
  }
  const texts = new Map();
  let current = null;
  let buffer = [];
  const flush = () => {
    if (current) {
      texts.set(current, buffer.join(" ").replace(/\s+/g, " ").trim());
    }
  };

  for (const line of lines.slice(headerIndex + 1)) {
    // A new parameter bullet: `- Name: …` (the name possibly wrapped in backticks/asterisks).
    const bullet = line.match(/^\s*[-*]\s*`{0,3}([A-Za-z][\w]*?)`{0,3}\s*:\s*(.*)$/);

    if (bullet) {
      flush();
      current = bullet[1].toLowerCase();
      buffer = [bullet[2]];
    } else if (current) {
      buffer.push(line);
    }
  }
  flush();

  for (const [name, text] of texts) {
    const hint = {};

    // A bold `**TRUE**`/`**FALSE**` (or the literal word "boolean") marks a boolean parameter.
    if (/\bboolean\b/i.test(text) || /\*\*\s*["']?(?:true|false)["']?\s*\*\*/i.test(text)) {
      hint.boolean = true;
    }
    // Accept only a quoted literal, a single non-word-suffixed token (e.g. `y`, `FALSE`, `2`), so
    // prose like "defaults to the browser's …" does not become a bogus default.
    const def = text.match(/defaults?\s+to:?\s*\**\s*(?:"([^"]*)"|'([^']*)'|([\w.-]+)\**)(?=\s*[).,]|\s*$)/i);

    if (def) {
      hint.default = (def[1] ?? def[2] ?? def[3] ?? "").trim();
    }
    hints.set(name, hint);
  }

  return hints;
}

/** Reads the explicit `@ParameterTypes({ … })` spec (evaluated object literal) from `content`. */
function explicitSpec(content) {
  const at = content.indexOf(PARAM_TYPES_MARKER);

  if (at === -1) {
    return {};
  }
  const open = at + PARAM_TYPES_MARKER.length - 1;
  const body = extractBalanced(content, open);

  if (body === undefined) {
    return {};
  }
  try {
    return new Function(`return (${body});`)();
  } catch {
    return {};
  }
}

/** Derives the merged parameter spec map for one functionality file. */
function deriveSpecs(content, paramKeys) {
  const picked = new Map();
  const hints = tsdocHints(content);

  for (const segment of dbcSegments(content)) {
    const mentioned = new Set();

    for (const literal of stringLiterals(segment.body)) {
      for (const token of paramTokens(literal)) {
        if (paramKeys.some((key) => key.toLowerCase() === token)) {
          mentioned.add(token);
        }
      }
    }
    if (mentioned.size === 0) {
      continue;
    }
    const inferred = inferFromSegment(segment);
    const type = typeof inferred === "string" ? inferred : inferred.type;
    const extra = typeof inferred === "string" ? undefined : { options: inferred.options };
    apply(picked, mentioned, type, extra);
  }

  // TSDoc hints refine the DBC-derived spec (a bold TRUE/FALSE outranks a plain `@TYPE` string).
  for (const [name, hint] of hints) {
    if (!paramKeys.some((key) => key.toLowerCase() === name)) {
      continue;
    }
    if (hint.boolean) {
      apply(picked, [name], "boolean");
    }
    const existing = picked.get(name);
    const def = hint.default !== undefined ? booleanDefault(hint.default, existing?.spec.type) : undefined;

    if (existing) {
      if (def !== undefined) {
        existing.spec.default = def;
      }
    } else if (def !== undefined) {
      picked.set(name, { rank: 0, spec: { type: "string", default: def } });
    }
  }

  return picked;
}

/** Normalizes a default value: boolean defaults are lower-cased (`true`/`false`) for runtime safety. */
function booleanDefault(value, type) {
  const trimmed = String(value).trim();

  if (type === "boolean" || /^(true|false)$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return trimmed;
}

/** Builds the ordered `{ Name: spec }` map (original casing) that is written to JSON + the decorator. */
function buildParameterMap(paramKeys, jsonParameter, explicit, picked) {
  const out = {};
  const explicitByLower = new Map();

  for (const [name, value] of Object.entries(explicit ?? {})) {
    explicitByLower.set(name.toLowerCase(), value);
  }
  // Union of the JSON keys and any explicitly-declared keys (keeps order stable, JSON keys first).
  const keys = [...paramKeys];

  for (const [name] of Object.entries(explicit ?? {})) {
    if (!keys.some((key) => key.toLowerCase() === name.toLowerCase())) {
      keys.push(name);
    }
  }

  for (const key of keys) {
    const lower = key.toLowerCase();
    const explicitValue = explicitByLower.get(lower);
    let spec;

    if (explicitValue !== undefined) {
      spec = normalizeExplicit(explicitValue);
    } else {
      const derived = picked.get(lower)?.spec;
      spec = derived ? { ...derived } : { type: "string" };
    }
    // A non-empty JSON Parameter value is the persisted default when nothing else declares one.
    const jsonDefault = jsonParameter?.[key];

    if (spec.default === undefined && typeof jsonDefault === "string" && jsonDefault.trim() !== "") {
      spec.default = booleanDefault(jsonDefault, spec.type);
    }
    // Drop the redundant `type: "string"` so the JSON stays compact, but keep it explicit in the decorator.
    out[key] = spec;
  }

  return out;
}

/** Normalizes one explicit decorator entry into a spec object. */
function normalizeExplicit(value) {
  if (typeof value === "string") {
    return value === "enum" ? { type: "enum", options: [] } : { type: value };
  }
  const spec = { type: value?.type ?? "string" };

  if (Array.isArray(value?.options)) {
    spec.options = value.options.map((option) => String(option));
  }
  if (value?.default !== undefined) {
    spec.default = String(value.default);
  }
  if (value?.description) {
    spec.description = String(value.description);
  }
  return spec;
}

/** Serializes one spec as a compact but valid TS object literal. */
function specLiteral(spec) {
  const parts = [];

  if (spec.options?.length) {
    parts.push(`type: "enum"`);
    parts.push(`options: ${JSON.stringify(spec.options)}`);
  } else {
    parts.push(`type: ${JSON.stringify(spec.type ?? "string")}`);
  }
  if (spec.default !== undefined) {
    parts.push(`default: ${JSON.stringify(spec.default)}`);
  }
  if (spec.description) {
    parts.push(`description: ${JSON.stringify(spec.description)}`);
  }
  return `{ ${parts.join(", ")} }`;
}

/** Formats the whole `@ParameterTypes({ … })` decorator block at the given indentation. */
function formatDecorator(map, indent) {
  const entries = Object.entries(map);

  if (entries.length === 0) {
    return undefined;
  }
  const lines = entries.map(([name, spec]) => `${indent}  ${name}: ${specLiteral(spec)},`);
  return `${indent}${PARAM_TYPES_MARKER}{\n${lines.join("\n")}\n${indent}})`;
}

/** Removes an existing `@ParameterTypes( … )` decorator (and its preceding indentation) from source. */
function stripExistingDecorator(content) {
  const at = content.indexOf(PARAM_TYPES_MARKER);

  if (at === -1) {
    return content;
  }
  const open = at + PARAM_TYPES_MARKER.length - 1;
  const body = extractBalanced(content, open);

  if (body === undefined) {
    return content;
  }
  const end = open + 1 + body.length + 1; // past the closing `)`
  // Expand to the start of the line (indentation) and the trailing newline.
  let start = at;

  while (start > 0 && content[start - 1] !== "\n") {
    start--;
  }
  let stop = end;

  while (stop < content.length && content[stop] !== "\n") {
    stop++;
  }
  if (stop < content.length) {
    stop++;
  }
  return content.slice(0, start) + content.slice(stop);
}

/** Inserts (or replaces) the `@ParameterTypes( … )` decorator above the `functionality()` method. */
function injectDecorator(content, map) {
  const cleaned = stripExistingDecorator(content);
  const method = cleaned.match(/^([ \t]*)(public\s+static\s+(?:override\s+)?functionality\s*\()/m);

  if (!method) {
    return { content: cleaned, injected: false };
  }
  const indent = method[1];
  const decorator = formatDecorator(map, indent);

  if (!decorator) {
    return { content: cleaned, injected: false };
  }
  const lineStart = cleaned.lastIndexOf("\n", method.index) + 1;
  const next = `${cleaned.slice(0, lineStart)}${decorator}\n${cleaned.slice(lineStart)}`;
  return { content: next, injected: true };
}

/** Ensures the source imports the decorators it uses from `codbi-common` (idempotent). */
function ensureImport(content) {
  const needed = new Set(["ParameterTypes"]);

  if (/@SupportedFormelementtype\s*\(/.test(content)) {
    needed.add("SupportedFormelementtype");
  }
  const re = /import\s*\{([^}]*)\}\s*from\s*"codbi-common";/;
  const m = content.match(re);

  if (m) {
    const members = m[1]
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    let changed = false;

    for (const name of needed) {
      if (!members.includes(name)) {
        members.push(name);
        changed = true;
      }
    }
    if (!changed) {
      return content;
    }
    members.sort((a, b) => a.localeCompare(b));
    return content.replace(re, `import { ${members.join(", ")} } from "codbi-common";`);
  }
  // No `codbi-common` import yet — add one right after the last top-of-file import.
  const line = `import { ${[...needed].sort((a, b) => a.localeCompare(b)).join(", ")} } from "codbi-common";`;
  const imports = [...content.matchAll(/^import[^\n]*;$/gm)];

  if (imports.length > 0) {
    const last = imports[imports.length - 1];
    const idx = last.index + last[0].length;
    return `${content.slice(0, idx)}\n${line}${content.slice(idx)}`;
  }
  return `${line}\n${content}`;
}

let written = 0;
let injected = 0;

for (const file of readdirSync(DIR)) {
  if (!file.endsWith(".ts")) {
    continue;
  }
  const base = file.replace(/\.ts$/, "");
  const jsonPath = join(DIR, `${base}.json`);

  if (!existsSync(jsonPath)) {
    continue;
  }
  const tsPath = join(DIR, file);
  const content = readFileSync(tsPath, "utf8");
  const json = JSON.parse(readFileSync(jsonPath, "utf8"));
  const jsonParameter = json.Parameter ?? {};
  const paramKeys = Object.keys(jsonParameter);

  if (paramKeys.length === 0 && content.indexOf(PARAM_TYPES_MARKER) === -1) {
    continue;
  }
  const explicit = explicitSpec(content);
  const picked = deriveSpecs(content, paramKeys);
  const map = buildParameterMap(paramKeys, jsonParameter, explicit, picked);

  if (Object.keys(map).length === 0) {
    continue;
  }

  // 1. Publish to the sibling JSON.
  json.parameters = map;
  if (!DRY) {
    writeFileSync(jsonPath, `${JSON.stringify(json, null, 2)}\n`);
  }

  // 2. Place the decorator in the source (unless disabled).
  if (!NO_INJECT) {
    const { content: decorated, injected: didInject } = injectDecorator(content, map);

    if (didInject) {
      const updated = ensureImport(decorated);

      if (updated !== content) {
        if (!DRY) {
          writeFileSync(tsPath, updated);
        }
        injected++;
      }
    }
  }
  written++;
  console.log("wrote:", `${base}.json`, Object.keys(map).length, "param(s)");
}

console.log(`\nDone — updated ${written} functionality .json file(s); ${injected} decorator(s) placed.`);
