// @ts-check

import path from "node:path";

import * as esbuild from "esbuild";
import { newEsBuildPostCssPlugin } from "@de-xima/esbuild-plugin-postcss";

const mode = (process.argv.find((x) => x.startsWith("--mode=")) ?? "--mode=production").substring(7);

const outputDir = process.env.web_output_dir ?? "dist";

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
]);
