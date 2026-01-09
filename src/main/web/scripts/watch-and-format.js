#!/usr/bin/env node
/**
 * File watcher that applies CodBi patterns after Prettier formats files
 * This script watches for file changes and runs the formatter automatically
 *
 * Usage: node watch-and-format.js
 * Or run in background: node watch-and-format.js &
 */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const scriptPath = path.join(__dirname, "apply-codbi-patterns.js");
const workspaceRoot = path.resolve(__dirname, "..");

// Track files being processed to avoid infinite loops
const processingFiles = new Set();
const debounceTimers = new Map();
const DEBOUNCE_MS = 500; // Wait 500ms after last change before processing

function shouldProcessFile(filePath) {
  // Only process TypeScript and JavaScript files
  if (!filePath.endsWith(".ts") && !filePath.endsWith(".js")) {
    return false;
  }

  // Skip node_modules, dist, and other ignored directories
  if (
    filePath.includes("node_modules") ||
    filePath.includes(".git") ||
    filePath.includes("dist") ||
    filePath.includes("coverage") ||
    filePath.includes(".yarn")
  ) {
    return false;
  }

  // Only process files in the workspace
  if (!filePath.startsWith(workspaceRoot)) {
    return false;
  }

  return true;
}

function applyPatterns(filePath) {
  if (processingFiles.has(filePath)) {
    return;
  }

  processingFiles.add(filePath);

  const command = `node "${scriptPath}" "${filePath}"`;

  exec(command, { cwd: workspaceRoot }, (error, stdout, stderr) => {
    processingFiles.delete(filePath);

    if (error) {
      console.error(`Error applying patterns to ${filePath}: ${error.message}`);
      return;
    }

    if (stdout.includes("Applied CodBi patterns")) {
      console.log(`✓ Applied patterns to: ${path.relative(workspaceRoot, filePath)}`);
    }
  });
}

function watchDirectory(dirPath) {
  try {
    const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
      if (!filename) return;

      const fullPath = path.join(dirPath, filename);

      // Check if file exists and should be processed
      fs.stat(fullPath, (err, stats) => {
        if (err) return;

        // Only process files (not directories) and only on change/rename
        if (!stats.isFile() || (eventType !== "change" && eventType !== "rename")) {
          return;
        }

        if (!shouldProcessFile(fullPath)) {
          return;
        }

        // Debounce: wait for file to be stable before processing
        if (debounceTimers.has(fullPath)) {
          clearTimeout(debounceTimers.get(fullPath));
        }

        const timer = setTimeout(() => {
          debounceTimers.delete(fullPath);
          applyPatterns(fullPath);
        }, DEBOUNCE_MS);

        debounceTimers.set(fullPath, timer);
      });
    });

    console.log(`Watching: ${path.relative(workspaceRoot, dirPath)}`);
    return watcher;
  } catch (error) {
    console.error(`Error watching ${dirPath}: ${error.message}`);
    return null;
  }
}

// Watch the packages directories
const packagesDir = path.join(workspaceRoot, "packages");
const watchers = [];

if (fs.existsSync(packagesDir)) {
  fs.readdirSync(packagesDir).forEach((pkg) => {
    const pkgPath = path.join(packagesDir, pkg, "src");
    if (fs.existsSync(pkgPath)) {
      const watcher = watchDirectory(pkgPath);
      if (watcher) watchers.push(watcher);
    }
  });
}

// Also watch root src if it exists
const rootSrc = path.join(workspaceRoot, "src");
if (fs.existsSync(rootSrc)) {
  const watcher = watchDirectory(rootSrc);
  if (watcher) watchers.push(watcher);
}

console.log("CodBi formatter watcher started. Press Ctrl+C to stop.");

// Cleanup on exit
process.on("SIGINT", () => {
  console.log("\nStopping watcher...");
  watchers.forEach((watcher) => watcher.close());
  process.exit(0);
});
