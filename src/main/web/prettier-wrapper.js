#!/usr/bin/env node
/**
 * Prettier wrapper that applies CodBi patterns
 * This can be used as a custom formatter in VS Code
 */

const prettier = require("prettier");
const fs = require("fs");
const path = require("path");
const { applyCodBiPatterns } = require("./prettier-plugin-codbi/index.js");

// Read config
const configPath = path.join(__dirname, ".prettierrc.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Get file path from command line
const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node prettier-wrapper.js <file-path>");
  process.exit(1);
}

// Read file
const code = fs.readFileSync(filePath, "utf8");

// Format with Prettier
const formatted = prettier.format(code, {
  ...config,
  filepath: filePath,
});

// Apply CodBi patterns
const final = applyCodBiPatterns(formatted);

// Write back
fs.writeFileSync(filePath, final, "utf8");
console.log(`Formatted: ${filePath}`);
