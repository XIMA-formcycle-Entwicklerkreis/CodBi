import { describe, expect, it, afterEach } from "@jest/globals";

import { HTML_Input_NoAutocomplete } from "../../src/js/Functionalities/html.input.noautocomplete.js";

describe("HTML_Input_NoAutocomplete.functionality", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("sets autocomplete=off on a text input", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);

    HTML_Input_NoAutocomplete.functionality({}, input);

    expect(input.getAttribute("autocomplete")).toBe("off");
  });
});
