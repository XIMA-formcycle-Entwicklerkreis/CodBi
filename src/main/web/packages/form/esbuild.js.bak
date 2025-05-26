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

const configTemplates = await findConfigTemplates();
console.log(configTemplates);

await Promise.all([
  esbuild.build({
    bundle: true,
    drop: mode === "production" ? ["debugger"] : [],
    entryPoints: ["src/index-codbi.ts"],
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
    entryPoints: ["src/index-codbi.css"],
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
]);
