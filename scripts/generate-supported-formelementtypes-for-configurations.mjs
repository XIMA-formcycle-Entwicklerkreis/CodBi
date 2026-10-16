// Publishes the FORMCYCLE widget types for the standard configurations. The **`.ts` `loadConfig` is the
// runtime source** and the generator keeps the **`.json`** (read by the designer) in sync:
//
//  * The generator parses every `Configurations/*.ts` file and collects the `FUNC`/`func` of every
//    `loadConfig({ ... })` / `loadConfigs([ ... ])` call. It does NOT write a
//    `supportedFormelementtypes` into the `.ts` — that key is a derived metadata artifact (ignored by
//    the runtime) and lives only in the emitted `.json`.
//  * For a **holistic** standard configuration (file name starts with `Holistic.`) the value is the
//    literal `["Holistic"]` — the special keyword that marks the configuration as a holistic one so the
//    designer can hide it from the per-element standard-configuration listings of the form-element CodBi
//    panel (`ElementFunctionalityConfigEditor`). A holistic config resolves its targets by a runtime
//    selector (`targets` + a single `func`), never by a CSS-standard class on an element.
//  * For a **regular** standard configuration, the FORMCYCLE widget classes for each class are derived from
//    the `supportedFormelementtypes` declared by the functionality/functionalities referenced by that
//    class's OWN `FUNC`/`func` (published into the functionality `.json` files by
//    `scripts/generate-supported-formelementtypes.mjs`). Each class gets its own value derived from the
//    FUNC(s) it actually applies — a class that applies only `HTML.Input.Regex` (an `XTextField`
//    functionality) is never widened to the widget classes of other classes sharing the file. If no
//    referenced functionality declares any type (or none can be resolved), the class applies to ANY form
//    element (fail-open) and its `formelementtypes` is dropped.
//  * The `.json` files carry **no** top-level `supportedFormelementtypes` for regular configurations.
//    Instead each class's entry of the `.json`'s `classes` map folds its description AND its widget
//    list together: `classes[cssClass] = { description, formelementtypes: [...] }`, so the class name
//    appears as a key exactly once and the designer decides per-class applicability directly (no
//    `funcs`→functionality-registry resolution). `Holistic.*` files keep the literal `["Holistic"]`
//    keyword in their `.json` so the designer can hide them from the per-element listings.
//
// Every `Configurations/*.json` file is rewritten as derived output (not hand-authored); the `.ts`
// `loadConfig` calls stay as the hand-authored runtime source and never carry `supportedFormelementtypes`.
//
// The property is NOT a CodBi parameter — the runtime `loadConfig()` explicitly ignores the metadata key
// (`isStandardConfigMetadataKey` in `global-scope.ts`), and the Java side
// (`CodbiFormDesignerResourcePlugin.getDetails()`) merges the resulting `.json` into
// `window.CodbiPluginData.detStandards` so the designer can split the standard configurations into
// "applicable to this element" / "not applicable to this element" by FORMCYCLE widget class, and hide the
// holistic ones.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, parse } from "node:path";

const configurationsDir = "src/main/web/packages/form/src/js/Configurations";
const functionalitiesDir = "src/main/web/packages/form/src/js/Functionalities";

/** The literal keyword that marks a standard configuration as holistic. */
const HOLISTIC_KEYWORD = "Holistic";
/** Prefix of the file names of the holistic standard configurations. */
const HOLISTIC_FILE_PREFIX = "Holistic.";
/** The exact property name injected into the `.ts` loadConfig/loadConfigs call objects. */
const KEY = "supportedFormelementtypes";

/**
 * Extracts the plain FORMCYCLE widget class names of a functionality's `supportedFormelementtypes`
 * spec (see `TSupportedFormelementtypeSpec` in `functionality-meta.ts`). The spec may be a single
 * class name, an array of class names, or an object mapping class name → property requirements (in
 * which case the keys are the class names). Returns `[]` when the spec is absent/empty.
 */
function typesOfSpec(spec) {
  if (typeof spec === "string") {
    return [spec.trim()].filter(Boolean);
  }
  if (Array.isArray(spec)) {
    const seen = new Set();
    const result = [];
    for (const entry of spec) {
      const type = String(entry).trim();
      if (type && !seen.has(type)) {
        seen.add(type);
        result.push(type);
      }
    }
    return result;
  }
  if (spec != null && typeof spec === "object") {
    return Object.keys(spec)
      .map((type) => type.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Builds a map `functionalityName(lowercased) -> widget class names[]` from the functionality `.json`
 * files. Only functionalities that declare a `supportedFormelementtypes` spec are included; a
 * functionality without one is fail-open (applies to any element) and simply contributes nothing.
 */
function collectFunctionalityTypes() {
  const map = new Map();
  for (const file of readdirSync(functionalitiesDir)) {
    if (!file.endsWith(".json")) {
      continue;
    }
    const base = parse(file).name.toLowerCase();
    let json;
    try {
      json = JSON.parse(readFileSync(join(functionalitiesDir, file), "utf8"));
    } catch {
      continue;
    }
    const types = typesOfSpec(json.supportedFormelementtypes);
    if (types.length > 0) {
      map.set(base, types);
    }
  }
  return map;
}

const functionalityTypes = collectFunctionalityTypes();

/** Unions the widget classes of every functionality referenced in a comma-separated FUNC string. */
function typesOfFuncs(funcsCsv) {
  const seen = new Set();
  const result = [];
  for (const raw of String(funcsCsv ?? "").split(",")) {
    const funcName = raw.trim();
    if (!funcName) {
      continue;
    }
    const types = functionalityTypes.get(funcName.toLowerCase());
    if (!types) {
      continue;
    }
    for (const type of types) {
      if (!seen.has(type)) {
        seen.add(type);
        result.push(type);
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------------------------
// A small TypeScript-aware scanner over a configuration file's `loadConfig`/`loadConfigs` calls.
// It correctly skips the characters inside string literals and template literals (which may embed
// ` ${ ... }` substitutions containing nested braces, e.g. `JSON.stringify({ ... })`).
// ---------------------------------------------------------------------------------------------

/** Reads (and trims) the value of the `FUNC`/`func` property at the head of a config object's content. */
function readFuncValue(content) {
  // content is the raw text of an object literal (starting right after the `{`).
  let i = 0;
  while (i < content.length) {
    // skip whitespace, commas, newlines
    while (i < content.length && /[\s,;]/.test(content[i])) {
      i++;
    }
    // read property name up to `:`
    const nameStart = i;
    while (i < content.length && content[i] !== ":") {
      i++;
    }
    const name = content.slice(nameStart, i).trim();
    if (i >= content.length) {
      break;
    }
    i++; // skip the `:`
    if (name === "FUNC" || name === "func" || name.toLowerCase() === "func") {
      // read the property value: a quoted string (single/double/template) or an identifier expression.
      const value = readValue(content, i).text;
      return value;
    }
    // skip this property's value so we advance to the next property
    i = skipValue(content, i);
  }
  return undefined;
}

/** Parses just the value at position `start` and returns `{ text, end }`. */
function readValue(content, start) {
  let i = start;
  while (i < content.length && /\s/.test(content[i])) {
    i++;
  }
  const ch = content[i];
  const stripQuotes = (inner) => inner.replace(/\\(["'`])/g, "$1");
  if (ch === '"' || ch === "'" || ch === "`") {
    const quote = ch;
    i++;
    const innerStart = i; // index of the first char after the opening quote
    if (quote === "`") {
      // template literal — handle ${ ... } with brace depth
      const out = [];
      while (i < content.length) {
        const c = content[i];
        if (c === "\\") {
          out.push(c, content[i + 1] ?? "");
          i += 2;
          continue;
        }
        if (c === "$" && content[i + 1] === "{") {
          let depth = 1;
          let j = i + 2;
          while (j < content.length && depth > 0) {
            const cc = content[j];
            if (cc === "{") depth++;
            else if (cc === "}") depth--;
            else if (cc === '"' || cc === "'" || cc === "`") {
              const res = skipString(content, j);
              j = res.end;
              continue;
            }
            j++;
          }
          i = j;
          continue;
        }
        if (c === "`") {
          break;
        }
        out.push(c);
        i++;
      }
      const end = Math.min(i + 1, content.length); // include the closing backtick
      return { text: stripQuotes(content.slice(innerStart, end - 1).trim()), end };
    }
    // normal string literal: scan to closing unescaped quote
    while (i < content.length) {
      const c = content[i];
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === quote) {
        i++;
        break;
      }
      i++;
    }
    return { text: stripQuotes(content.slice(innerStart, i - 1).trim()), end: i };
  }
  // bare identifier / unknown expression: read until a comma or newline at brace-depth 0
  const out = [];
  let depth = 0;
  while (i < content.length) {
    const c = content[i];
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if ((c === "," || c === "\n" || c === ";") && depth === 0) {
      break;
    }
    out.push(c);
    i++;
  }
  return { text: out.join("").trim(), end: i };
}

/** Skips a full property value at position `start`, returning the index just after it. */
function skipValue(content, start) {
  const res = readValue(content, start);
  return res.end;
}

/** Skips a string literal beginning at `start` (the quote character), returning its end (past quote). */
function skipString(content, start) {
  const quote = content[start];
  let i = start + 1;
  while (i < content.length) {
    const c = content[i];
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (c === quote) {
      return { end: i + 1 };
    }
    i++;
  }
  return { end: i };
}

/** Finds the end index of the `{ ... }` object literal that starts at `start` (content[start] === '{'). */
function findObjectEnd(content, start) {
  let depth = 0;
  let i = start;
  while (i < content.length) {
    const c = content[i];
    if (c === '"' || c === "'" || c === "`") {
      const res = skipString(content, i);
      i = res.end;
      continue;
    }
    if (/[\s,]/.test(c)) {
      i++;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        return i; // index of the closing brace
      }
    }
    i++;
  }
  return -1;
}

/**
 * Scans the source of a configuration for every config object literal passed to `loadConfig({
 * ... })` or `loadConfigs([ ... ])`. Returns an array of objects describing each config object:
 * `{ startIndex, endIndex (exclusive of closing brace), indentation, alreadyHasKey, hasTargets }`.
 */
function scanConfigObjects(source) {
  const results = [];
  const singleToken = `loadConfig(`;
  const arrayToken = `loadConfigs([`;
  // Skips a `//` line comment or a `/* ... */` block comment that starts at `idx`, returning the
  // index just after it. Returns `idx` unchanged when `idx` is not the start of a comment.
  const skipComment = (idx) => {
    if (source.startsWith("//", idx)) {
      const nl = source.indexOf("\n", idx + 2);
      return nl === -1 ? source.length : nl + 1;
    }
    if (source.startsWith("/*", idx)) {
      const close = source.indexOf("*/", idx + 2);
      return close === -1 ? source.length : close + 2;
    }
    return idx;
  };
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === "/" && (source[i + 1] === "/" || source[i + 1] === "*")) {
      i = skipComment(i) - 1;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      i = skipString(source, i).end - 1;
      continue;
    }
    // `loadConfigs([` must be checked FIRST because it shares the `loadConfig(` prefix.
    if (source.startsWith(arrayToken, i)) {
      // array form: loadConfigs([ { ... }, { ... } ])
      const openBracket = i + arrayToken.length - 1; // index of `[`
      let k = openBracket + 1;
      let depth = 1;
      while (k < source.length && depth > 0) {
        const kc = source[k];
        if (kc === "/" && (source[k + 1] === "/" || source[k + 1] === "*")) {
          k = skipComment(k) - 1;
        } else if (kc === '"' || kc === "'" || kc === "`") {
          k = skipString(source, k).end - 1;
        } else if (kc === "[") depth++;
        else if (kc === "]") depth--;
        else if (kc === "{") {
          const close = findObjectEnd(source, k);
          if (close === -1) break;
          results.push(describeConfigObject(source, k + 1, close));
          k = close;
        }
        k++;
      }
      i = k;
      continue;
    }
    if (source.startsWith(singleToken, i)) {
      // single-object form: loadConfig({ ... })
      const openParen = i + singleToken.length - 1; // index of `(`
      let j = openParen + 1;
      while (j < source.length && /\s/.test(source[j])) {
        j++;
      }
      if (source[j] === "{") {
        const bodyStart = j + 1;
        const close = findObjectEnd(source, j);
        results.push(describeConfigObject(source, bodyStart, close));
        i = close;
      }
    }
  }
  return results;
}

/** Builds the descriptor for one config object literal whose body spans [bodyStart, close]. */
function describeConfigObject(source, bodyStart, close) {
  const body = source.slice(bodyStart, close);
  // indentation of the line containing the opening `{`
  let lineStart = source.lastIndexOf("\n", bodyStart - 1) + 1;
  const indent = source.slice(lineStart, bodyStart).match(/^[ \t]*/)[0];
  return {
    bodyStart,
    close, // index of closing `}`
    body,
    indent,
    funcValue: readFuncValue(body),
    hasKey: new RegExp(`(^|[\\s,])${KEY}\\s*:`).test(body),
  };
}

/** Formats the injected/updated property text with the given indentation. */
function keyLine(indent, valueArr) {
  return `${indent}${KEY}: ${JSON.stringify(valueArr)},`;
}

/**
 * Locates the existing `supportedFormelementtypes` value within one config object body (spanning
 * [bodyStart, close]) and returns its absolute `[start, end)` in `source`. The value may be an array
 * containing commas, so its span is read with `readValue` (which handles quoted strings/templates and
 * nested brackets). Returns `null` when the key is absent.
 */
function findMetadataValueSpan(source, bodyStart, close) {
  const body = source.slice(bodyStart, close);
  const keyRe = new RegExp(`(^|[\\s,])${KEY}\\s*:`);
  const m = keyRe.exec(body);
  if (!m) return null;
  let idx = bodyStart + m.index + m[0].length; // position right after `:`
  // skip whitespace between `:` and the value
  while (idx < close && /\s/.test(source[idx])) idx++;
  if (idx >= close) return null;
  const valueStart = idx;
  const valueEnd = readValue(source, idx).end;
  return { start: valueStart, end: Math.min(valueEnd, close) };
}

// ---------------------------------------------------------------------------------------------
// Process every configuration file.
// ---------------------------------------------------------------------------------------------

let written = 0;
let missingSource = [];

for (const file of readdirSync(configurationsDir)) {
  if (!file.endsWith(".ts")) {
    continue;
  }

  const tsPath = join(configurationsDir, file);
  const source = readFileSync(tsPath, "utf8");
  const baseName = parse(file).name;

  const objectInfos = scanConfigObjects(source);

  // Holistic → the literal `["Holistic"]` keyword (fixed). Regular → EVERY call derives its OWN
  // `supportedFormelementtypes` from the FUNC(s) referenced by THAT call only (a configuration's
  // `FUNC`/`func` is what actually applies — a config targeting an XTextField via `HTML.Input.Regex`
  // must NOT be widened to the widget classes of other configs sharing the file). So two configs in
  // the same file can legitimately get different values.
  const isHolistic = baseName.startsWith(HOLISTIC_FILE_PREFIX);
  const valueOf = (info) => (isHolistic ? [HOLISTIC_KEYWORD] : typesOfFuncs(info.funcValue));

  // --- Rebuild the `.ts`: inject / normalise the property in every config object. ---
  let newSource = source;
  // Apply edits from the end backwards so earlier indices stay valid.
  const edits = [];
  const tsValues = [];
  for (const info of objectInfos) {
    const valueArr = valueOf(info);
    tsValues.push(valueArr.length === 0 ? null : valueArr);
    // The `.ts` source is the hand-authored runtime config. `supportedFormelementtypes` is a purely
    // derived metadata artifact (ignored by `loadConfig()` via `isStandardConfigMetadataKey`) and is
    // NO LONGER written into the `.ts`: the designer reads the `.json` (whose per-class
    // `formelementtypes` are derived from `funcs`), and holiness is derived from the file-name
    // prefix. Remove any stale key from a prior generation so the source stays clean.
    if (info.hasKey) {
      const span = findMetadataValueSpan(source, info.bodyStart, info.close);
      if (span) {
        let lineStart = source.lastIndexOf("\n", span.start - 1) + 1;
        let lineEnd = source.indexOf("\n", span.end);
        if (lineEnd === -1) lineEnd = info.close;
        edits.push({ start: lineStart, end: lineEnd + 1, insertion: "" });
      }
    }
  }
  // apply edits (backwards)
  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  for (const e of edits) {
    newSource = newSource.slice(0, e.start) + e.insertion + newSource.slice(e.end);
  }

  if (newSource !== source) {
    writeFileSync(tsPath, newSource);
    console.log("injected .ts:", file);
    written++;
  } else {
    console.log("unchanged  .ts:", file);
  }
  tsValues.forEach((v, i) =>
    console.log(
      "   call",
      i + 1,
      v === null ? "(fail-open / any element, key dropped)" : JSON.stringify(v),
    ),
  );

  // --- Rebuild the `.json` consistent with the `.ts`. ---
  // Regular configurations fold each class's description AND its FORMCYCLE widget list into a single
  // `classes[class]` entry (`{ description, formelementtypes }`), so the class name appears as a key
  // exactly once (no separate per-class `supportedFormelementtypes` map). Each class's widget list is
  // derived from ITS `funcs[class]` FUNC(s) (the same per-call derivation injected into the `.ts`,
  // keyed by the class names the designer shows). Classes within one file may target different widget
  // types (e.g. People has both XTextField and XSelect classes), and a class with no types is
  // fail-open (applies to any element) → its `formelementtypes` is dropped. A regular file carries
  // NO top-level `supportedFormelementtypes`; only Holistic files keep the literal `["Holistic"]`
  // keyword.
  const jsonPath = join(configurationsDir, `${baseName}.json`);
  if (!existsSync(jsonPath)) {
    missingSource.push(`${file} (no .json)`);
    continue;
  }
  const configJson = JSON.parse(readFileSync(jsonPath, "utf8"));
  if (isHolistic) {
    configJson[KEY] = [HOLISTIC_KEYWORD];
  } else {
    // Merge each class's description and its widget types (derived from `funcs[class]`). The
    // description is read as-is for a plain-string (legacy) entry, or re-used for an already-merged
    // entry so re-runs are idempotent.
    const classesMap = configJson.classes ?? {};
    const funcsMap = configJson.funcs ?? {};
    const mergedClasses = {};
    for (const [cls, rawEntry] of Object.entries(classesMap)) {
      const description =
        typeof rawEntry === "string" ? rawEntry : ((rawEntry && rawEntry.description) ?? "");
      // Per-class widget list, in order of precedence:
      //   1. DERIVED from the class's OWN `funcs[cls]` FUNC(s) (each referenced functionality's
      //      `supportedFormelementtypes`), the normal case;
      //   2. else an EXPLICIT `formelementtypes` authored directly on the class entry — the escape
      //      hatch for classes that carry NO resolvable FUNC (e.g. the CSS classes of the AI
      //      standard, which are wired by a holistic AI functionality rather than a per-element FUNC
      //      and each target a DIFFERENT widget class). Without this the hand-maintained list would
      //      be silently dropped on every regeneration;
      //   3. else fail-open (applies to any element) → the `formelementtypes` key is omitted.
      const derived = funcsMap[cls] == null ? [] : typesOfFuncs(String(funcsMap[cls]));
      const explicit =
        rawEntry != null && typeof rawEntry === "object" && Array.isArray(rawEntry.formelementtypes)
          ? typesOfSpec(rawEntry.formelementtypes)
          : [];
      const types = derived.length > 0 ? derived : explicit;
      mergedClasses[cls] =
        types.length > 0 ? { description, formelementtypes: types } : { description };
    }
    if (Object.keys(mergedClasses).length > 0) {
      configJson.classes = mergedClasses;
    }
    // Regular files carry no top-level `supportedFormelementtypes` (the per-class widget lists now
    // live inside `classes`); a stale key from an older generation is removed.
    delete configJson[KEY];
  }
  writeFileSync(jsonPath, `${JSON.stringify(configJson, null, 2)}\n`);
  console.log(
    "          .json:",
    `${baseName}.json`,
    isHolistic ? JSON.stringify(configJson[KEY]) : `${Object.keys(configJson.classes ?? {}).length} class(es)`,
  );
  written++;
}

console.log(`\nDone — processed ${written} standard-configuration file(s).`);

if (missingSource.length > 0) {
  console.log(
    `\nNote: .json missing/unavailable for ${missingSource.length} file(s): ${missingSource.join(", ")}.`,
  );
}
