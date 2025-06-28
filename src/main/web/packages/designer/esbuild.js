import path from "node:path";
import { exec } from "node:child_process"; // Import exec
import { promisify } from "node:util"; // For using async/await with exec

import * as esbuild from "esbuild";
import { newEsBuildPostCssPlugin } from "@de-xima/esbuild-plugin-postcss";

const execPromise = promisify(exec); // Create a promisified version of exec

const mode = (process.argv.find((x) => x.startsWith("--mode=")) ?? "--mode=production").substring(7);

const outputDir = process.env.web_output_dir ?? "dist";

// Define the path to your Angular web component's project root
const angularWebComponentProjectRoot = path.resolve("Angular/Components", "codbi-apidoc");

// Define the expected output paths *after* Angular's build
// These paths should match what your Angular project's angular.json
// produces, specifically the 'outputPath' property.
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

async function buildAngularWebComponent() {
  console.log(`Building Angular web component in ${angularWebComponentProjectRoot}...`);
  try {
    const buildCommand = `ng build manager`;
    // You might add more flags here if your Angular Elements build needs them,
    // e.g., --output-hashing=none if you need predictable filenames.
    // The --project flag is important if you have a multi-project Angular workspace.

    const { stdout, stderr } = await execPromise(buildCommand, { cwd: angularWebComponentProjectRoot });

    if (stdout) console.log(`Angular Build (stdout):\n${stdout}`);
    if (stderr) console.error(`Angular Build (stderr):\n${stderr}`);

    console.log("Angular web component build completed successfully.");
  } catch (error) {
    console.error("Error building Angular web component:", error.message);
    // You might want to exit the process or throw the error to stop further Esbuild steps
    process.exit(1);
  }
}

// --- Main Build Process ---
(async () => {
  // Step 1: Automatically build the Angular web component
  await buildAngularWebComponent();

  // Step 2: Run your Esbuild processes, now using the compiled Angular output
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
      },
      publicPath: "plugin-resource:",
    }),
    esbuild.build({
      bundle: true,
      drop: mode === "production" ? ["debugger"] : [],
      entryPoints: [angularWebComponentSourceFile], // This now uses the *output* of `ng build`
      logLevel: "info",
      minify: mode === "production",
      outfile: path.join(outputDir, "cb-manager.js"),
      sourcemap: mode === "production" ? false : "inline",
      target: mode === "production" ? "es6" : "esnext",
    }),
    esbuild.build({
      bundle: true,
      drop: mode === "production" ? ["debugger"] : [],
      entryPoints: [angularWebComponentSourceFileCSS], // This also uses the *output* of `ng build`
      logLevel: "info",
      minify: mode === "production",
      outfile: path.join(outputDir, "cb-manager.css"),
      sourcemap: mode === "production" ? false : "inline",
      target: mode === "production" ? "es6" : "esnext",
    }),
  ]);

  console.log("All builds completed!");
})().catch((error) => {
  console.error("An error occurred during the build process:", error);
  process.exit(1);
});
