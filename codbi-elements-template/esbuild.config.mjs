// @ts-check
import { build, context } from "esbuild";
import { readdirSync, statSync, rmSync } from "fs";
import { join, relative, sep } from "path";

const SRC_ROOT = new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const OUT_DIR = join(SRC_ROOT, "dist");
const WATCH = process.argv.includes("--watch");

// Clean dist directory so stale artifacts from renamed files are removed.
try { rmSync(OUT_DIR, { recursive: true, force: true }); } catch { /* locked by another process — files will be overwritten */ }

// #region Collect entry points
/** Recursively finds all .ts / .tsx files, ignoring node_modules, dist, and config files. */
function collectEntries(dir) {
    const entries = [];

    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);

        if (entry === "node_modules" || entry === "dist" || entry === ".vscode") {
            continue;
        }

        if (statSync(full).isDirectory()) {
            entries.push(...collectEntries(full));
        } else if (/\.tsx?$/.test(entry) && !entry.startsWith("esbuild") && !entry.startsWith("generate") && !entry.endsWith(".d.ts")) {
            entries.push(full);
        }
    }

    return entries;
}

const entryPoints = collectEntries(SRC_ROOT);
// #endregion Collect entry points
// #region Build each entry as a standalone IIFE with CodBi dot-notation output name.
/** Converts a file path relative to SRC_ROOT into CodBi dot-notation.
 *  e.g. Functionalities/MyFunc.ts → Functionalities.MyFunc */
function toCodBiName(filePath) {
    const rel = relative(SRC_ROOT, filePath);
    const withoutExt = rel.replace(/\.[^.]+$/, "");

    return withoutExt.split(sep).join(".");
}

const builds = entryPoints.map((entry) => {
    const codbiName = toCodBiName(entry);

    console.log(`  ${codbiName}.js  ←  ${relative(SRC_ROOT, entry)}`);

    /** @type {import("esbuild").BuildOptions} */
    const options = {
        entryPoints: [entry],
        outfile: join(OUT_DIR, `${codbiName}.js`),
        bundle: true,
        format: "iife",
        platform: "browser",
        target: "es2020",
        minify: true,
        sourcemap: false,
        logLevel: "warning",
    };

    return options;
});

if (WATCH) {
    console.log("Watching for changes...\n");

    for (const options of builds) {
        const ctx = await context(options);

        await ctx.watch();
    }
} else {
    console.log(`\nBuilding ${builds.length} CodBi element(s)...\n`);

    for (const options of builds) {
        await build(options);
    }

    console.log(`\nDone — output in dist/`);
}
// #endregion Build
