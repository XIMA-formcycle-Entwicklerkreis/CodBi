import { describe, expect, it, afterEach } from "@jest/globals";

import { HTML_Input_Trans_Capital } from "../../src/js/Functionalities/html.input.trans.capital.js";

describe("HTML_Input_Trans_Capital.transformer", () => {
  const transformer = HTML_Input_Trans_Capital.transformer;

  it("capitalizes the first letter of each word", () => {
    expect(transformer("hello world", {})).toBe("Hello World");
  });

  it("handles all-uppercase input", () => {
    expect(transformer("HELLO WORLD", {})).toBe("Hello World");
  });

  it("handles mixed case input", () => {
    expect(transformer("hElLo wOrLd", {})).toBe("Hello World");
  });

  it("handles hyphenated words", () => {
    expect(transformer("jean-luc picard", {})).toBe("Jean-Luc Picard");
  });

  it("handles single word", () => {
    expect(transformer("hello", {})).toBe("Hello");
  });

  it("handles empty string", () => {
    expect(transformer("", {})).toBe("");
  });

  it("handles multiple spaces between words", () => {
    expect(transformer("hello  world", {})).toBe("Hello  World");
  });

  it("handles leading whitespace", () => {
    expect(transformer(" hello", {})).toBe(" Hello");
  });
});

describe("HTML_Input_Trans_Capital.functionality", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("transforms input value on change event", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);

    HTML_Input_Trans_Capital.functionality({}, input);

    input.value = "hello world";
    input.dispatchEvent(new Event("change"));

    expect(input.value).toBe("Hello World");
  });

  it("transforms hyphenated input on change", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);

    HTML_Input_Trans_Capital.functionality({}, input);

    input.value = "anna-maria schmidt";
    input.dispatchEvent(new Event("change"));

    expect(input.value).toBe("Anna-Maria Schmidt");
  });
});
