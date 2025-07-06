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
const angularWebComponentProjectRoot = path.resolve(currentScriptDir, "Angular/Components", "codbi-apidoc");
const angularWebComponentSourceFile = path.resolve(
  angularWebComponentProjectRoot,
  "dist",
  "manager",
  "browser",
  "main.js",
);
const angularWebComponentSourceFileCSS = path.resolve(
  angularWebComponentProjectRoot,
  "dist",
  "manager",
  "browser",
  "styles.css",
);
const tinymceSourceDir = path.resolve(currentScriptDir, "../../node_modules/tinymce");
const tinymceOutputDir = path.join(outputDir, "tinymce");
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
    const buildCommand = `ng build manager`;
    const { stdout, stderr } = await execPromise(buildCommand, { cwd: angularWebComponentProjectRoot });

    if (stdout) console.log(`Angular Build (stdout):\n${stdout}`);
    if (stderr) console.error(`Angular Build (stderr):\n${stderr}`);

    console.log("Angular web component build completed successfully.");
  } catch (error) {
    console.error("Error building Angular web component:", error.message);

    process.exit(1);
  }
}

async function copyTinyMCEAssets() {
  console.log(`Copying TinyMCE assets from ${tinymceSourceDir} to ${tinymceOutputDir}...`);

  try {
    await fs.mkdir(outputDir, { recursive: true });
    await fsExtra.emptyDir(tinymceOutputDir);
    await fsExtra.copy(tinymceSourceDir, tinymceOutputDir, {
      recursive: true, // Ensure all subdirectories are copied
      overwrite: true, // Overwrite existing files
    });
    console.log("TinyMCE assets copied successfully.");
  } catch (error) {
    console.error("Error copying TinyMCE assets:", error.message);

    process.exit(1);
  }
}

(async () => {
  console.log(`Cleaning output directory: ${outputDir}...`);

  await fsExtra.emptyDir(outputDir);
  await buildAngularWebComponent();
  await copyTinyMCEAssets();
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
