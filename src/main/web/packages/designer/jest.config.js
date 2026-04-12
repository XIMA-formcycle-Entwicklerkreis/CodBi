// @ts-check

/** @import { Config } from "jest"; */

/**
 * @returns {Promise<Config>}
 */
export default async () => {
  return {
    collectCoverage: true,
    collectCoverageFrom: ["src/**/*.{ts,tsx}"],
    coverageDirectory: "../../../../../target/jest-reports/designer",
    coverageReporters: ["clover", "html", "text"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    moduleNameMapper: {
      "(.+)\\.js": "$1",
      "^codbi-common$": "<rootDir>/../common/src/index",
    },
    restoreMocks: true,
    roots: ["src", "__tests__", "__mocks__"],
    silent: true,
    testEnvironment: "jsdom",
    testPathIgnorePatterns: ["/dist/", "/node_modules/"],
    testRegex: "/__tests__/.*\\.spec\\.tsx?",
    transform: {
      "^(.+\\.tsx?|.+/dist/src/.+\\.jsx?|.+/__mocks__/.+\\.tsx?)$": ["ts-jest", {}],
    },
    transformIgnorePatterns: ["node_modules/(?!(codbi-common|xdbc)/)"],
    verbose: true,
  };
};
