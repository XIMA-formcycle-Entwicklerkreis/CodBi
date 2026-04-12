import { describe, expect, it, afterEach } from "@jest/globals";
import { getJQuery } from "@de-xima/fc-form-renderer";

import { HTML_Input_REGEX } from "../../src/js/Functionalities/html.input.regex.js";

describe("HTML_Input_REGEX.functionality", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("prevents invalid keys via keydown", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);

    HTML_Input_REGEX.functionality({ expression: "^\\d+$", keyexpression: "[0-9]", flags: "g", keyflags: "i" }, input);

    const event = new KeyboardEvent("keydown", { key: "a", cancelable: true });
    input.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("allows valid keys via keydown", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);

    HTML_Input_REGEX.functionality({ expression: "^\\d+$", keyexpression: "[0-9]", flags: "g", keyflags: "i" }, input);

    const event = new KeyboardEvent("keydown", { key: "5", cancelable: true });
    input.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it("sets error on change when value does not match expression", () => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = "abc";
    document.body.appendChild(input);

    HTML_Input_REGEX.functionality({ expression: "^\\d+$", flags: "g" }, input);

    input.dispatchEvent(new Event("change"));

    const $ = getJQuery();
    expect($(input).data("error-msg")).toBeTruthy();
  });

  it("clears error on change when value matches expression", () => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = "12345";
    document.body.appendChild(input);

    HTML_Input_REGEX.functionality({ expression: "^\\d+$", flags: "g" }, input);

    input.dispatchEvent(new Event("change"));

    const $ = getJQuery();
    expect($(input).data("error-msg")).toBe("");
  });

  it("replaces ° with ^ in expression", () => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = "test";
    document.body.appendChild(input);

    // ° should be replaced with ^ in the regex
    HTML_Input_REGEX.functionality({ expression: "°[a-z]+$", flags: "g" }, input);

    input.dispatchEvent(new Event("change"));

    const $ = getJQuery();
    // "test" matches ^[a-z]+$ — should clear error
    expect($(input).data("error-msg")).toBe("");
  });

  it("skips disconnected elements during change validation", () => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = "abc";
    document.body.appendChild(input);

    HTML_Input_REGEX.functionality({ expression: "^\\d+$", flags: "g" }, input);

    // Remove from DOM before triggering change
    input.remove();
    input.dispatchEvent(new Event("change"));

    const $ = getJQuery();
    // Should not set error since element is disconnected
    expect($(input).data("error-msg")).toBeFalsy();
  });
});
