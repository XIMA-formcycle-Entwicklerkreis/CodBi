// @ts-check

/** @import { Config } from "jest"; */

/**
 * @returns {Promise<Config>}
 */
export default async () => {
  return {
    collectCoverage: true,
    collectCoverageFrom: [
      "src/**/*.{ts,tsx}",
      // Exclude external-API-dependent modules (integration/e2e test scope)
      "!src/js/Functionalities/ai.llama.chat.ts",
      "!src/js/Functionalities/ai.llama.standard.qa.ts",
      "!src/js/Functionalities/ai.llama.standard.txtqa.ts",
      "!src/js/Functionalities/ai.ocr.ts",
      "!src/js/Functionalities/media.input.speech.ts",
      "!src/js/Functionalities/media.input.speech.whisper.ts",
      "!src/js/Functionalities/media.image.cropper.ts",
      "!src/js/Functionalities/media.multipleupload.ts",
      "!src/js/Functionalities/openplz.autocomplete.ts",
      "!src/js/Functionalities/ldap.autocomplete.ts",
      "!src/js/Functionalities/ldap.autocomplete.set.ts",
      "!src/js/Functionalities/security.captcha.google.ts",
      "!src/js/Functionalities/matomo.tracking.ts",
      "!src/js/Functionalities/form.navigator.ts",
      "!src/js/EPs/ai.llama.std.qa.ts",
      "!src/js/EPs/ldap.find.ts",
      "!src/js/EPs/openplz.ts",
      "!src/js/EPs/openplz.localities.ts",
      "!src/js/EPs/openplz.organizationalunits.ts",
      "!src/js/EPs/openplz.streets.ts",
      "!src/js/EPs/openplz.textsearch.ts",
      "!src/js/EPs/date.holidays.ts",
      "!src/js/EPs/net.url.ts",
      "!src/js/EPs/bayvis.behoerden.ts",
      "!src/js/EPs/bayvis.behoerden.id.ts",
      "!src/js/EPs/bayvis.behoerden.gebaeude.id.ts",
      "!src/js/EPs/bayvis.behoerden.details.ts",
      "!src/js/EPs/bayvis.behoerden.details.gebaeude.ts",
      "!src/js/EPs/bayvis.ansprechpartner.ts",
      "!src/js/EPs/bayvis.ansprechpartner.id.ts",
      "!src/js/EPs/bayvis.ansprechpartner.details.ts",
    ],
    coverageDirectory: "../../../../../target/jest-reports/form",
    coverageReporters: ["clover", "html", "text"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    moduleNameMapper: {
      "(.+)\\.js": "$1",
      "^codbi-common$": "<rootDir>/../common/src/index",
    },
    restoreMocks: true,
    roots: ["src", "__tests__", "__mocks__"],
    setupFiles: ["<rootDir>/__tests__/setup-codbi.ts"],
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
