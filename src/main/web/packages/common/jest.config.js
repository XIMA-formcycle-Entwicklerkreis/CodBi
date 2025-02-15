// @ts-check

/** @import { Config } from "jest"; */

/**
 * @returns {Promise<Config>}
 */
export default async () => {
  return {
    collectCoverage: true,
    collectCoverageFrom: ["src/**/*.{ts,tsx}"],
    coverageDirectory: "../../../../../target/jest-reports/common",
    coverageReporters: ["clover", "html", "text"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    moduleNameMapper: {
      "(.+)\\.js": "$1",
    },
    restoreMocks: true,
    silent: true,
    testEnvironment: "jsdom",
    testPathIgnorePatterns: ["/dist/", "/node_modules/"],
    testRegex: "/__tests__/.*\\.spec\\.tsx?",
    transform: {
      "^.+\\.tsx?$": [
        "esbuild-jest",
        {
          sourcemap: true,
          format: "cjs",
        },
      ],
    },
    verbose: true,
  };
};
