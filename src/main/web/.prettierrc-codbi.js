/**
 * Prettier config that applies CodBi patterns
 * This is a JavaScript config file that wraps Prettier
 */

const { applyCodBiPatterns } = require("./prettier-plugin-codbi/index.js");

module.exports = {
  semi: true,
  trailingComma: "es5",
  singleQuote: false,
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  arrowParens: "always",
  // Note: We can't apply patterns via plugin, so we'll use a wrapper
  // The VS Code extension or script will handle pattern application
};
