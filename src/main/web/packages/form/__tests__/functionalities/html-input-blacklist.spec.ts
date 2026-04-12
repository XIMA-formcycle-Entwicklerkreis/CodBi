import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { getJQuery } from "@de-xima/fc-form-renderer";

describe("HTML_Input_Blacklist.functionality", () => {
  let $: ReturnType<typeof getJQuery>;

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    $ = getJQuery();
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  function createInput(): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);
    return input;
  }

  it("shows error when blacklisted value is entered via input event", async () => {
    const { HTML_Input_Blacklist } = await import("../../src/js/Functionalities/html.input.blacklist.js");
    const input = createInput();

    HTML_Input_Blacklist.functionality({ list: "bad,evil,wrong" }, input);

    input.value = "bad";
    input.dispatchEvent(new Event("input"));

    expect(($(input) as any).error()).not.toBe("");
  });

  it("clears error for non-blacklisted value", async () => {
    const { HTML_Input_Blacklist } = await import("../../src/js/Functionalities/html.input.blacklist.js");
    const input = createInput();

    HTML_Input_Blacklist.functionality({ list: "bad,evil" }, input);

    input.value = "good";
    input.dispatchEvent(new Event("input"));

    expect(($(input) as any).error()).toBe("");
  });

  it("shows error on blur for blacklisted value", async () => {
    const { HTML_Input_Blacklist } = await import("../../src/js/Functionalities/html.input.blacklist.js");
    const input = createInput();

    HTML_Input_Blacklist.functionality({ list: "test,demo" }, input);

    input.value = "test";
    input.dispatchEvent(new Event("blur"));

    expect(($(input) as any).error()).not.toBe("");
  });

  it("includes prefix and postfix in error message", async () => {
    const { HTML_Input_Blacklist } = await import("../../src/js/Functionalities/html.input.blacklist.js");
    const input = createInput();

    HTML_Input_Blacklist.functionality(
      { list: "blocked", prefix: "Error: ", postfix: " is not allowed", showblacklist: "false" },
      input,
    );

    input.value = "blocked";
    input.dispatchEvent(new Event("input"));

    expect(($(input) as any).error()).toContain("Error: ");
    expect(($(input) as any).error()).toContain(" is not allowed");
  });

  it("accepts array-typed list parameter", async () => {
    const { HTML_Input_Blacklist } = await import("../../src/js/Functionalities/html.input.blacklist.js");
    const input = createInput();

    HTML_Input_Blacklist.functionality({ list: ["alpha", "beta"] as unknown as string }, input);

    input.value = "alpha";
    input.dispatchEvent(new Event("input"));

    expect(($(input) as any).error()).not.toBe("");
  });

  it("adds beforeShowDay filter for date blacklisting", async () => {
    const { HTML_Input_Blacklist } = await import("../../src/js/Functionalities/html.input.blacklist.js");
    const input = createInput();

    HTML_Input_Blacklist.functionality({ list: "25.12.2025" }, input);

    const opts = $(input).data("dp-options") || {};
    expect(opts.beforeShowDay).toBeInstanceOf(Function);
  });
});
