// Tests for code-library.ts

import { afterEach, describe, expect, jest, it } from "@jest/globals";

import { resetTestState } from "./test-state.js";
import { createCodbiGlobal } from "../src/js/global-scope.js";

// The code in code-library is for demonstration purposes only
// This illustrates how to write tests with jsdom and jest

afterEach(() => resetTestState());

describe("createCodbiGlobal", () => {
  it("creates a new codbi instance", () => {
    const codbiScript = document.createElement("script");
    codbiScript.src = "https://example.com/codbi.js";
    document.head.appendChild(codbiScript);
    const codbi1 = createCodbiGlobal();
    const codbi2 = createCodbiGlobal();
    expect(codbi1).toBeDefined();
    expect(codbi2).toBeDefined();
    expect(codbi1).not.toBe(codbi2);
  });
});

// add more tests for the CodBi class here...
