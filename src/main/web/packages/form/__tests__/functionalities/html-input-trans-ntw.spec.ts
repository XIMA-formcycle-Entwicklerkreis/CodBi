import { describe, expect, it } from "@jest/globals";

import { HTML_Input_Trans_NTW } from "../../src/js/Functionalities/html.input.trans.ntw.js";

describe("HTML_Input_Trans_NTW.transformer", () => {
  const transform = HTML_Input_Trans_NTW.transformer;
  const numberWords = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

  it("converts a single digit to its word", () => {
    expect(transform("5", { numberwords: numberWords })).toBe("five");
  });

  it("converts multiple digits separated by dashes", () => {
    expect(transform("123", { numberwords: numberWords })).toBe("one-two-three");
  });

  it("strips dots from the number string", () => {
    expect(transform("1.234", { numberwords: numberWords })).toBe("one-two-three-four");
  });

  it("ignores decimals after comma", () => {
    expect(transform("12,50", { numberwords: numberWords })).toBe("one-two");
  });

  it("adds prefix and postfix", () => {
    expect(transform("42", { numberwords: numberWords, prefix: "NUM:", postfix: "!" })).toBe("NUM:four-two!");
  });

  it("handles zero", () => {
    expect(transform("0", { numberwords: numberWords })).toBe("zero");
  });

  it("handles all digits", () => {
    expect(transform("1234567890", { numberwords: numberWords })).toBe(
      "one-two-three-four-five-six-seven-eight-nine-zero",
    );
  });

  it("defaults prefix and postfix to empty string", () => {
    expect(transform("7", { numberwords: numberWords })).toBe("seven");
  });
});

describe("HTML_Input_Trans_NTW.functionality", () => {
  it("binds a change event that transforms the input", () => {
    const input = document.createElement("input");
    input.type = "text";

    const numberWords = ["null", "eins", "zwei", "drei", "vier", "fuenf", "sechs", "sieben", "acht", "neun"];

    HTML_Input_Trans_NTW.functionality({ numberwords: numberWords }, input);

    input.value = "123";
    input.dispatchEvent(new Event("change"));

    expect(input.value).toBe("eins-zwei-drei");
  });
});
