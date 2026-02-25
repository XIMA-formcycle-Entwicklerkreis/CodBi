import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs/promises";
import * as esbuild from "esbuild";
import { newEsBuildPostCssPlugin } from "@de-xima/esbuild-plugin-postcss";
import fsExtra from "fs-extra";

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
    const buildCommand = `yarn ng build manager`;
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
    await fs.rm(tinymceOutputDir, { recursive: true, force: true });
    await fs.mkdir(outputDir, { recursive: true });
    await fsExtra.copy(tinymceSourceDir, tinymceOutputDir, { recursive: true, overwrite: true });

    console.log("TinyMCE assets copied successfully.");
  } catch (X) {
    console.error("Error copying TinyMCE assets:", X.message);

    process.exit(1);
  }
}

async function copyI18nAssets() {
  console.log(`Copying i18n assets from ${i18nSourceDir} to ${i18nOutputDir}...`);

  try {
    await fs.rm(i18nOutputDir, { recursive: true, force: true });
    await fs.mkdir(i18nOutputDir, { recursive: true });
    await fsExtra.copy(i18nSourceDir, i18nOutputDir, { recursive: true, overwrite: true });
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
    // Remove the destination directory before copying to ensure a clean copy
    await fs.rm(angularWebComponentSvgOutputDir, { recursive: true, force: true });
    // Ensure the output directory for SVGs exists
    await fs.mkdir(angularWebComponentSvgOutputDir, { recursive: true });
    // Copy all contents from source to destination
    await fsExtra.copy(angularWebComponentSvgSourceDir, angularWebComponentSvgOutputDir, {
      recursive: true,
      overwrite: true,
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

(async () => {
  console.log(`Cleaning output directory: ${outputDir}...`);

  // Retry logic for cleaning output directory (handles ENOTEMPTY/EBUSY on Windows)
  async function retryEmptyDir(dir, maxRetries = 5, delayMs = 500) {
    let lastErr;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await fs.mkdir(outputDir, { recursive: true });
        return;
      } catch (err) {
        if (err && (err.code === "ENOTEMPTY" || err.code === "EBUSY" || err.code === "EPERM")) {
          lastErr = err;
          console.warn(
            `Attempt ${attempt} to clean directory '${dir}' failed with ${err.code}. Retrying in ${delayMs}ms...`,
          );
          await new Promise((res) => setTimeout(res, delayMs));
        } else {
          throw err;
        }
      }
    }
    throw lastErr || new Error(`Failed to clean directory '${dir}' after retries`);
  }

  await retryEmptyDir(outputDir);
  await buildAngularWebComponent();
  await copyTinyMCEAssets();
  await copyI18nAssets();
  await copyAngularWebComponentSvgAssets();

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
