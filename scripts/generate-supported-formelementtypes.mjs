// Publishes the `@SupportedFormelementtype` decorator spec of every functionality into its sibling
// `.json` file as `supportedFormelementtypes`. `CodbiFormDesignerResourcePlugin.getDetails()` merges
// those `.json` files into `window.CodbiPluginData.detFunctionalities`, which is what the designer
// reads to filter the functionalities offered for a form element (by widget type AND by element
// properties such as `datatype`).
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "src/main/web/packages/form/src/js/Functionalities";
const MARKER = "@SupportedFormelementtype(";

/** Extracts the balanced argument expression of `@SupportedFormelementtype( … )`, or undefined. */
function extractDecoratorSpec(content) {
  const at = content.indexOf(MARKER);

  if (at === -1) {
    return undefined;
  }

  const start = at + MARKER.length;
  let depth = 0;
  let inString = null;

  for (let i = start; i < content.length; i++) {
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
      if (depth === 0) {
        return content.slice(start, i).trim();
      }
      depth--;
    }
  }

  return undefined;
}

let written = 0;

for (const file of readdirSync(dir)) {
  if (!file.endsWith(".ts")) {
    continue;
  }

  const base = file.replace(/\.ts$/, "");
  const jsonPath = join(dir, `${base}.json`);

  if (!existsSync(jsonPath)) {
    continue;
  }

  const expression = extractDecoratorSpec(readFileSync(join(dir, file), "utf8"));

  if (expression === undefined) {
    continue;
  }

  let spec;

  try {
    // The argument is a literal (string | string[] | object literal) — evaluate it in isolation.
    spec = new Function(`return (${expression});`)();
  } catch (x) {
    console.log("skip (unparsable spec):", file, x.message);
    continue;
  }

  const json = JSON.parse(readFileSync(jsonPath, "utf8"));

  json.supportedFormelementtypes = spec;
  writeFileSync(jsonPath, `${JSON.stringify(json, null, 2)}\n`);
  written++;
  console.log("wrote:", `${base}.json`, JSON.stringify(spec));
}

console.log(`\nDone — updated ${written} functionality .json file(s).`);
