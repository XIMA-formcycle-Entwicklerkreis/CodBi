// One-off migration: add the `@SupportedFormelementtype` decorator (derived from the existing
// `@funcElement` TSDoc tag) to every functionality's `functionality()` method, plus its import.
// Type-only (no property constraints) — datatype constraints are added by hand where meaningful.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "src/main/web/packages/form/src/js/Functionalities";
const IMPORT = 'import { SupportedFormelementtype } from "codbi-common";';
const METHOD = /^\s*(public|protected|private)\s+static\s+(override\s+)?functionality\s*\(/;

for (const file of readdirSync(dir)) {
  if (!file.endsWith(".ts")) {
    continue;
  }

  const path = join(dir, file);
  const content = readFileSync(path, "utf8");

  if (content.includes("@SupportedFormelementtype")) {
    console.log("skip (already decorated):", file);
    continue;
  }

  const tag = content.match(/@funcElement\s+([A-Za-z0-9_$.,\s]+)/);

  if (!tag) {
    console.log("skip (no @funcElement):", file);
    continue;
  }

  const types = Array.from(new Set(tag[1].split(/[,\s]+/).map((t) => t.trim()).filter(Boolean)));

  if (types.length === 0) {
    console.log("skip (empty tag):", file);
    continue;
  }

  const spec = types.length === 1 ? `"${types[0]}"` : `[${types.map((t) => `"${t}"`).join(", ")}]`;
  const lines = content.split(/\r?\n/);

  if (!content.includes('from "codbi-common"')) {
    let lastImport = -1;

    for (let i = 0; i < lines.length; i++) {
      if (/\bfrom\s+["']/.test(lines[i])) {
        lastImport = i;
      }
    }

    if (lastImport !== -1) {
      lines.splice(lastImport + 1, 0, IMPORT);
    }
  }

  const idx = lines.findIndex((line) => METHOD.test(line));

  if (idx === -1) {
    console.log("skip (no functionality method):", file);
    continue;
  }

  const indent = (lines[idx].match(/^\s*/) ?? [""])[0];

  lines.splice(idx, 0, `${indent}@SupportedFormelementtype(${spec})`);

  writeFileSync(path, lines.join("\n"));
  console.log("migrated:", file, "->", spec);
}
