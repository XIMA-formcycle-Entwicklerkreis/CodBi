import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs/promises";
import * as esbuild from "esbuild";
import { newEsBuildPostCssPlugin } from "@de-xima/esbuild-plugin-postcss";

const execPromise = promisify(exec);
const mode = (process.argv.find((x) => x.startsWith("--mode=")) ?? "--mode=production").substring(7);
const outputDir = process.env.web_output_dir ?? "dist";
const currentScriptDir = process.cwd();
// --- Angular Web Component Paths ---
const angularWebComponentProjectRoot = path.resolve(currentScriptDir, "Angular/Components", "codbi-apidoc");
const angularWebComponentDistDir = path.resolve(angularWebComponentProjectRoot, "dist", "manager", "browser");
const angularWebComponentSourceFile = path.resolve(angularWebComponentDistDir, "main.js");
const angularWebComponentSourceFileCSS = path.resolve(angularWebComponentDistDir, "styles.css");
const angularWebComponentSvgSourceDir = path.resolve(
  angularWebComponentProjectRoot,
  "projects",
  "manager",
  "src/app/manager",
  "assets",
  "Logos",
);
const angularWebComponentSvgOutputDir = path.join(outputDir, "assets", "svg");
// --- TinyMCE Paths ---
const tinymceSourceDir = path.resolve(currentScriptDir, "../../node_modules/tinymce");
const tinymceOutputDir = path.join(outputDir, "tinymce");
// -- i18n / Local API Documentation Manager
const i18nSourceDir = path.resolve(currentScriptDir, "Angular/Components/codbi-apidoc/projects/manager/public", "i18n");
const i18nOutputDir = path.join(outputDir, "i18n/LocalAPIDocManager");

const fontLoaders = {
  ".eot": "file",
  ".woff": "file",
  ".woff2": "file",
  ".ttf": "file",
  ".svg": "file",
  ".css": "css",
};

async function buildAngularWebComponent() {
  console.log(`Building Angular web component in ${angularWebComponentProjectRoot}...`);

  try {
    const ngBin = path.resolve(currentScriptDir, "../../node_modules", ".bin", "ng");
    const buildCommand = `"${ngBin}" build manager`;
    const { stdout, stderr } = await execPromise(buildCommand, { cwd: angularWebComponentProjectRoot });

    if (stdout) console.log(`Angular Build (stdout):\n${stdout}`);
    if (stderr) console.error(`Angular Build (stderr):\n${stderr}`);

    console.log("Angular web component build completed successfully.");
  } catch (X) {
    console.error("Error building Angular web component:", X.message);

    process.exit(1);
  }
}

async function copyTinyMCEAssets() {
  console.log(`Copying TinyMCE assets from ${tinymceSourceDir} to ${tinymceOutputDir}...`);

  try {
    await fs.mkdir(outputDir, { recursive: true });
    await fs.rm(tinymceOutputDir, { recursive: true, force: true });
    await fs.mkdir(tinymceOutputDir, { recursive: true });
    await fs.cp(tinymceSourceDir, tinymceOutputDir, { recursive: true, force: true });

    console.log("TinyMCE assets copied successfully.");
  } catch (X) {
    console.error("Error copying TinyMCE assets:", X.message);

    process.exit(1);
  }
}

async function copyI18nAssets() {
  console.log(`Copying i18n assets from ${i18nSourceDir} to ${i18nOutputDir}...`);

  try {
    await fs.mkdir(i18nOutputDir, { recursive: true });
    await fs.rm(i18nOutputDir, { recursive: true, force: true });
    await fs.mkdir(i18nOutputDir, { recursive: true });
    await fs.cp(i18nSourceDir, i18nOutputDir, { recursive: true, force: true });
    console.log("i18n assets copied successfully.");
  } catch (X) {
    console.error("Error copying i18n assets:", X.message);

    process.exit(1);
  }
}

async function copyAngularWebComponentSvgAssets() {
  console.log(
    `Copying Angular web component SVG assets from ${angularWebComponentSvgSourceDir} to ${angularWebComponentSvgOutputDir}...`,
  );

  try {
    // Ensure the output directory for SVGs exists
    await fs.mkdir(angularWebComponentSvgOutputDir, { recursive: true });
    // Clear the destination directory before copying to ensure a clean copy
    await fs.rm(angularWebComponentSvgOutputDir, { recursive: true, force: true });
    await fs.mkdir(angularWebComponentSvgOutputDir, { recursive: true });
    await fs.cp(angularWebComponentSvgSourceDir, angularWebComponentSvgOutputDir, {
      recursive: true,
      force: true,
    });
    console.log("Angular web component SVG assets copied successfully.");
  } catch (X) {
    if (X.code === "ENOENT") {
      console.warn(
        `Warning: Angular web component SVG source directory not found: ${angularWebComponentSvgSourceDir}. Skipping SVG copy.`,
      );
    } else {
      console.error("Error copying Angular web component SVG assets:", X.message);
      process.exit(1);
    }
  }
}

/** Copies the pdf.js main library (UMD build exposing window.pdfjsLib) next to cb-manager.js so the
 *  AI assistant can load it lazily (only when a PDF is attached) without shipping it in the initial
 *  bundle. Mirrors the form package's pdf.worker.min.js copy. */
async function copyPdfJsMain() {
  const pdfJsSourceFile = path.resolve(currentScriptDir, "../../node_modules/pdfjs-dist/build/pdf.min.js");
  const pdfJsOutputFile = path.join(outputDir, "pdf.min.js");
  try {
    await fs.mkdir(outputDir, { recursive: true });
    await fs.copyFile(pdfJsSourceFile, pdfJsOutputFile);
    console.log("PDF.js main library copied successfully.");
  } catch (X) {
    if (X.code === "ENOENT") {
      console.warn(
        `Warning: pdfjs-dist not found at ${pdfJsSourceFile}. PDF attachments in the AI assistant will not work.`,
      );
    } else {
      console.error("Error copying PDF.js main library:", X.message);
      process.exit(1);
    }
  }
}

(async () => {
  console.log(`Cleaning designer output files in: ${outputDir}...`);

  // Only remove designer-owned files/dirs — do NOT wipe the shared outputDir
  // (the form package writes to the same directory in parallel).
  const designerOutputs = [
    path.join(outputDir, "designer.js"),
    path.join(outputDir, "designer-frame.css"),
    path.join(outputDir, "cb-manager.js"),
    path.join(outputDir, "cb-manager.css"),
    // Clean stale code-splitting output from an earlier build so it is never deployed unused.
    path.join(outputDir, "chunks"),
    tinymceOutputDir,
    i18nOutputDir,
    angularWebComponentSvgOutputDir,
  ];

  await fs.mkdir(outputDir, { recursive: true });

  await Promise.all(designerOutputs.map((p) => fs.rm(p, { recursive: true, force: true })));

  await buildAngularWebComponent();
  await copyTinyMCEAssets();
  await copyI18nAssets();
  await copyAngularWebComponentSvgAssets();
  await copyPdfJsMain();

  await Promise.all([
    esbuild.build({
      bundle: true,
      drop: mode === "production" ? ["debugger"] : [],
      entryPoints: ["src/index.ts"],
      logLevel: "info",
      minify: mode === "production",
      outfile: path.join(outputDir, "designer.js"),
      sourcemap: mode === "production" ? false : "inline",
      target: mode === "production" ? "es6" : "esnext",
      loader: {
        ".png": "dataurl",
        ".svg": "dataurl",
        ".template": "text",
        ".html": "text",
        ...fontLoaders,
      },
    }),

    esbuild.build({
      bundle: true,
      entryPoints: ["src/index-frame.css"],
      logLevel: "info",
      minify: mode === "production",
      outfile: path.join(outputDir, "designer-frame.css"),
      plugins: [...(mode === "production" ? [newEsBuildPostCssPlugin()] : [])],
      sourcemap: mode === "production" ? false : "inline",
      target: mode === "production" ? "es6" : "esnext",
      loader: {
        ".png": "file",
        ".jpeg": "file",
        ".jpg": "file",
        ".gif": "file",
        ".svg": "file",
        ...fontLoaders,
      },
      publicPath: "plugin-resource:",
    }),

    // Single, self-contained classic bundle: cb-manager.js must load as a plain <script> (the
    // Resource servlet serves it via a query-string path, so ESM code-splitting chunks would 404).
    // pdf.js is intentionally NOT imported here anymore — the assistant loads the UMD pdf.min.js
    // copy on demand, keeping the initial bundle small so the dialog appears immediately.
    esbuild.build({
      bundle: true,
      drop: mode === "production" ? ["debugger"] : [],
      entryPoints: [angularWebComponentSourceFile],
      logLevel: "info",
      minify: mode === "production",
      outfile: path.join(outputDir, "cb-manager.js"),
      sourcemap: mode === "production" ? false : "inline",
      target: mode === "production" ? "es6" : "esnext",
      loader: { ...fontLoaders },
    }),

    esbuild.build({
      bundle: true,
      drop: mode === "production" ? ["debugger"] : [],
      entryPoints: [angularWebComponentSourceFileCSS],
      logLevel: "info",
      minify: mode === "production",
      outfile: path.join(outputDir, "cb-manager.css"),
      sourcemap: mode === "production" ? false : "inline",
      target: mode === "production" ? "es6" : "esnext",
      loader: { ...fontLoaders },
    }),
  ]);

  console.log("All builds completed!");
})().catch((error) => {
  console.error("An error occurred during the build process:", error);
  process.exit(1);
});
