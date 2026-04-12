import { describe, expect, it, afterEach } from "@jest/globals";

import { V } from "../../src/js/EPs/v.js";

describe("V.retrieve", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("retrieves a global variable value from the DOM", () => {
    const el = document.createElement("input");
    el.setAttribute("data-name", "myVar");
    el.setAttribute("value", "hello");
    document.body.appendChild(el);

    const result = V.retrieve(["myVar"]);
    expect(result).toBe("hello");
  });

  it("returns empty string when variable is not found and no REPORT flag", () => {
    const result = V.retrieve(["nonExistent"]);
    expect(result).toBe("");
  });

  it("throws when variable is not found and REPORT flag is set", () => {
    expect(() => {
      V.retrieve(["nonExistent", "REPORT"]);
    }).toThrow();
  });

  it("is case-insensitive for REPORT flag", () => {
    expect(() => {
      V.retrieve(["nonExistent", "report"]);
    }).toThrow();
  });

  it("trims the variable name before querying", () => {
    const el = document.createElement("input");
    el.setAttribute("data-name", "trimTest");
    el.setAttribute("value", "trimmed");
    document.body.appendChild(el);

    const result = V.retrieve(["  trimTest  "]);
    expect(result).toBe("trimmed");
  });

  it("retrieves the value attribute even if empty string", () => {
    const el = document.createElement("input");
    el.setAttribute("data-name", "emptyVar");
    el.setAttribute("value", "");
    document.body.appendChild(el);

    const result = V.retrieve(["emptyVar"]);
    expect(result).toBe("");
  });
});
