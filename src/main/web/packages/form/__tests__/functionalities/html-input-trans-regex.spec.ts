import { describe, expect, it, afterEach } from "@jest/globals";

import { HTML_Input_Trans_RegEx } from "../../src/js/Functionalities/html.input.trans.regex.js";

describe("HTML_Input_Trans_RegEx.transformer", () => {
  const transformer = HTML_Input_Trans_RegEx.transformer;

  it("replaces literal match with replacement string", () => {
    const result = transformer("hello123world", { extractor: "123", replacements: "" });
    expect(result).toBe("helloworld");
  });

  it("returns original string when no literal match", () => {
    const result = transformer("hello", { extractor: "xyz", replacements: "X" });
    expect(result).toBe("hello");
  });

  it("replaces only first occurrence", () => {
    const result = transformer("aaa", { extractor: "a", replacements: "b" });
    expect(result).toBe("baa");
  });

  it("handles empty replacement", () => {
    const result = transformer("hello world", { extractor: " world", replacements: "" });
    expect(result).toBe("hello");
  });
});

describe("HTML_Input_Trans_RegEx.functionality", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("transforms input value using regex on change event", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);

    HTML_Input_Trans_RegEx.functionality({ extractor: "123", replacements: "NUM" }, input);

    input.value = "item123";
    input.dispatchEvent(new Event("change"));

    expect(input.value).toBe("itemNUM");
  });
});
