// @ts-check
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { notEmpty, notNull } from "@de-xima/xima-common-js-lang";
import * as esbuild from "esbuild";
import { newEsBuildPostCssPlugin } from "@de-xima/esbuild-plugin-postcss";

const mode = (process.argv.find((x) => x.startsWith("--mode=")) ?? "--mode=production").substring(7);
const outputDir = process.env.web_output_dir ?? "dist";
const dirName = path.dirname(fileURLToPath(import.meta.url));
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
// #region Retrieve CodBi configuration templates.
const configTemplates = await findConfigTemplates();

console.log("CodBi configurtion templates found found: ", configTemplates);
// #endregion Retrieve CodBi configuration templates.
// #region Retrieve functionalities, **e**lement **p**laceholders & configurations.
const functionalityTsFiles = await findTsFilesInDirectory("src/js/Functionalities");

console.log("Functionalities found: ", functionalityTsFiles);

const epsTsFiles = await findTsFilesInDirectory("src/js/EPs");

console.log("EPs found: ", epsTsFiles);

const configurationsTsFiles = await findTsFilesInDirectory("src/js/Configurations");

console.log("Standard configurations found: ", configurationsTsFiles);
// #endregion Retrieve functionalities, **e**lement **p**laceholders & configurations.
/**
 * Creates ESBuild-Configurations for each file **toProcess**.
 *
 * @param toProcess The files to build configurations for.
 * @param basePath  The path to prefix the file's one with. */
function createIndividualTsBuildsWithSplitting(toProcess, basePath) {
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

  ...createIndividualTsBuildsWithSplitting(functionalityTsFiles, "src/js/Functionalities"),
  ...createIndividualTsBuildsWithSplitting(epsTsFiles, "src/js/EPs"),
  ...createIndividualTsBuildsWithSplitting(configurationsTsFiles, "src/js/Configurations"),
]);
