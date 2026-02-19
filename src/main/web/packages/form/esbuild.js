// @ts-nocheck
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { notEmpty, notNull } from "@de-xima/xima-common-js-lang";
import * as esbuild from "esbuild";
import { newEsBuildPostCssPlugin } from "@de-xima/esbuild-plugin-postcss";

const mode = (process.argv.find((x) => x.startsWith("--mode=")) ?? "--mode=production").substring(7);
const outputDir = process.env.web_output_dir ?? "dist";
const dirName = path.dirname(fileURLToPath(import.meta.url));
// --- PDF.js Worker Paths ---
const pdfjsWorkerSourceFile = path.resolve(dirName, "../../node_modules/pdfjs-dist/build/pdf.worker.min.js");
const pdfjsWorkerOutputFile = path.join(outputDir, "pdf.worker.min.js");
/**
 * Finds all code library configuration templates. They must have file name
 * that follows the pattern `index-config-template-<template>.ts`.
 * @returns {Promise<string[]>} A list of configuration template names.
 */
async function findConfigTemplates() {
  const configTemplateDir = path.join(dirName, "src");
  const files = await fs.readdir(configTemplateDir);
  return files
    .map((file) => /^index-config-template-(?<template>[a-zA-Z0-9-]+)\.ts$/.exec(file))
    .filter(notNull)
    .map((x) => x.groups?.template)
    .filter(notEmpty);
}
/**
 * Retrieves all typescript files in the specified directory **toGetFrom**.
 *
 * @param {string} toGetFrom The relative path leading to the directory to get the typescript files from.
 *
 * @returns { Promise < string []>} The requested typescript files. */
async function findTsFilesInDirectory(toGetFrom) {
  const targetDir = path.join(dirName, toGetFrom);

  try {
    const files = await fs.readdir(toGetFrom);

    return files.filter((file) => file.endsWith(".ts"));
  } catch (error) {
    console.warn(`WARNING: Unable to read directory ${targetDir}. Returning blanc array. ERROR: ${error.message}`);

    return [];
  }
}
/**
 * Retrieves all JSON files in the specified directory **toGetFrom**.
 *
 * @param {string} toGetFrom The relative path leading to the directory to get the typescript files from.
 *
 * @returns { Promise < string []>} The requested typescript files. */
async function findJSONFilesInDirectory(toGetFrom) {
  const targetDir = path.join(dirName, toGetFrom);

  try {
    const files = await fs.readdir(toGetFrom);

    return files.filter((file) => file.endsWith(".json"));
  } catch (error) {
    console.warn(`WARNING: Unable to read directory ${targetDir}. Returning blanc array. ERROR: ${error.message}`);

    return [];
  }
}
// #region Retrieve CodBi configuration templates.
const configTemplates = await findConfigTemplates();

console.log("CodBi configurtion templates found found: ", configTemplates);
// #endregion Retrieve CodBi configuration templates.
// #region Retrieve functionalities, **e**lement **p**laceholders & configurations.
const functionalityTsFiles = await findTsFilesInDirectory("src/js/Functionalities");
const functionalityJSONFiles = await findJSONFilesInDirectory("src/js/Functionalities");

console.log("Functionalities found: ", functionalityTsFiles);

const epsTsFiles = await findTsFilesInDirectory("src/js/EPs");
const epsJSONFiles = await findJSONFilesInDirectory("src/js/EPs");

console.log("EPs found: ", epsTsFiles);

const configurationsTsFiles = await findTsFilesInDirectory("src/js/Configurations");
const configurationsJSONFiles = await findJSONFilesInDirectory("src/js/Configurations");

console.log("Standard configurations found: ", configurationsTsFiles);
// #endregion Retrieve functionalities, **e**lement **p**laceholders & configurations.
/**
 * Copies files from one directory to another.
 *
 * @param {string[]} filesToCopy The list of files to be copied.
 * @param {string} sourcePath The source directory path.
 * @param {string} destinationPath The destination directory path. */
async function copyFiles(filesToCopy, sourcePath, destinationPath) {
  // Retry logic for mkdir and file copy
  const maxRetries = 3;
  let mkdirSuccess = false;
  for (let attempt = 1; attempt <= maxRetries && !mkdirSuccess; attempt++) {
    try {
      await fs.mkdir(destinationPath, { recursive: true });
      mkdirSuccess = true;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`[copyFiles] mkdir failed (attempt ${attempt}): ${err.message}`);
      await new Promise((res) => setTimeout(res, 100 * attempt));
    }
  }

  await Promise.all(
    filesToCopy.map(async (file) => {
      const sourceFile = path.join(sourcePath, file);
      const destinationFile = path.join(destinationPath, file);
      let copySuccess = false;
      for (let attempt = 1; attempt <= maxRetries && !copySuccess; attempt++) {
        try {
          await fs.copyFile(sourceFile, destinationFile);
          copySuccess = true;
        } catch (err) {
          if (attempt === maxRetries) throw err;
          console.warn(`[copyFiles] copyFile failed for ${file} (attempt ${attempt}): ${err.message}`);
          await new Promise((res) => setTimeout(res, 100 * attempt));
        }
      }
    }),
  );
}
/**
 * Copies the PDF.js worker file to the output directory.
 */
async function copyPdfJsWorker() {
  console.log(`Copying PDF.js worker from ${pdfjsWorkerSourceFile} to ${pdfjsWorkerOutputFile}...`);

  try {
    await fs.mkdir(outputDir, { recursive: true });
    await fs.copyFile(pdfjsWorkerSourceFile, pdfjsWorkerOutputFile);

    console.log("PDF.js worker copied successfully.");
  } catch (X) {
    console.error("Error copying PDF.js worker:", X.message);

    process.exit(1);
  }
}
/**
 * Creates ESBuild-Configurations for each file **toProcess**.
 *
 * @param toProcess The files to build configurations for.
 * @param basePath  The path to prefix the file's one with.
 * @param outputDir The directory where to place the files. */
function createIndividualTsBuildsWithSplitting(toProcess, basePath, outputDir) {
  const entryPoints = toProcess.reduce((acc, current) => {
    const baseName = path.basename(current, ".ts");
    const entryPath = path.join(basePath, current);
    acc[baseName] = entryPath;

    return acc;
  }, {});
  // No build are created if there're no files.
  if (Object.keys(entryPoints).length === 0) {
    return [];
  }

  return [
    esbuild.build({
      bundle: true,
      drop: mode === "production" ? ["debugger"] : [],
      entryPoints: entryPoints,
      logLevel: "info",
      minify: mode === "production",
      outdir: outputDir,
      sourcemap: mode === "production" ? false : "inline",
      target: mode === "production" ? "es6" : "esnext",
      loader: {
        ".png": "dataurl",
        ".template": "text",
        ".svg": "dataurl",
        ".html": "text",
      },
      splitting: true,
      format: "esm",
    }),
  ];
}

await Promise.all([
  copyPdfJsWorker(),
  ...configTemplates.map((configTemplate) =>
    esbuild.build({
      bundle: true,
      entryPoints: [`src/index-config-template-${configTemplate}.ts`],
      logLevel: "info",
      minify: mode === "production",
      publicPath: "plugin-resource:",
      outfile: path.join(outputDir, `config-template-${configTemplate}.js`),
      plugins: [...(mode === "production" ? [newEsBuildPostCssPlugin()] : [])],
      sourcemap: mode === "production" ? false : "inline",
      target: mode === "production" ? "es6" : "esnext",
    }),
  ),

  esbuild.build({
    bundle: true,
    drop: mode === "production" ? ["debugger"] : [],
    entryPoints: ["src/index-codbi.ts"], // Pfad relativ zu dirName (src/main/web/)
    logLevel: "info",
    minify: mode === "production",
    outfile: path.join(outputDir, "codbi.js"),
    sourcemap: mode === "production" ? false : "inline",
    target: mode === "production" ? "es6" : "esnext",
    loader: {
      ".png": "dataurl",
      ".template": "text",
      ".svg": "dataurl",
      ".html": "text",
    },
  }),

  esbuild.build({
    bundle: true,
    entryPoints: ["src/index-codbi.css"], // Pfad relativ zu dirName (src/main/web/)
    logLevel: "info",
    minify: mode === "production",
    loader: {
      ".png": "dataurl",
      ".jpeg": "dataurl",
      ".jpg": "dataurl",
      ".gif": "dataurl",
      ".svg": "dataurl",
    },
    publicPath: "plugin-resource:",
    outfile: path.join(outputDir, "codbi.css"),
    plugins: [...(mode === "production" ? [newEsBuildPostCssPlugin()] : [])],
    sourcemap: mode === "production" ? false : "inline",
    target: mode === "production" ? "es6" : "esnext",
  }),

  ...createIndividualTsBuildsWithSplitting(
    functionalityTsFiles,
    "src/js/Functionalities",
    process.env.web_output_dir ?? "dist",
  ),
  ...createIndividualTsBuildsWithSplitting(epsTsFiles, "src/js/EPs", process.env.web_output_dir ?? "dist"),
  ...createIndividualTsBuildsWithSplitting(
    configurationsTsFiles,
    "src/js/Configurations",
    process.env.web_output_dir ?? "dist",
  ),

  ...createIndividualTsBuildsWithSplitting(
    functionalityTsFiles,
    "src/js/Functionalities",
    // biome-ignore lint/style/useTemplate: <explanation>
    process.env.web_output_dir + "/Functionalities" ?? "dist/Functionalities",
  ),
  // biome-ignore lint/style/useTemplate: <explanation>
  ...createIndividualTsBuildsWithSplitting(epsTsFiles, "src/js/EPs", process.env.web_output_dir + "/EPs" ?? "dist/EPs"),
  ...createIndividualTsBuildsWithSplitting(
    configurationsTsFiles,
    "src/js/Configurations",
    // biome-ignore lint/style/useTemplate: <explanation>
    process.env.web_output_dir + "/Configurations" ?? "dist/Configurations",
  ),

  copyFiles(
    functionalityJSONFiles,
    "src/js/Functionalities",
    // biome-ignore lint/style/useTemplate: <explanation>
    process.env.web_output_dir + "/Functionalities" ?? "dist/Functionalities",
  ),
  // biome-ignore lint/style/useTemplate: <explanation>
  copyFiles(epsJSONFiles, "src/js/EPs", process.env.web_output_dir + "/EPs" ?? "dist/EPs"),
  copyFiles(
    configurationsJSONFiles,
    "src/js/Configurations",
    // biome-ignore lint/style/useTemplate: <explanation>
    process.env.web_output_dir + "/Configurations" ?? "dist/Configurations",
  ),
]);
