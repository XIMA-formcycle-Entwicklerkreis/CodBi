import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { getJQuery } from "@de-xima/fc-form-renderer";

describe("Date_Frame.functionality", () => {
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

  /** Build a DOM tree: grandparent > parent > [minInput, maxInput] */
  function createDateInputs(): { minInput: HTMLInputElement; maxInput: HTMLInputElement } {
    const grandparent = document.createElement("div");
    const parent = document.createElement("div");
    grandparent.appendChild(parent);

    const minInput = document.createElement("input");
    minInput.type = "text";
    parent.appendChild(minInput);

    const maxInput = document.createElement("input");
    maxInput.type = "text";
    maxInput.classList.add("max-date");
    parent.appendChild(maxInput);

    document.body.appendChild(grandparent);
    return { minInput, maxInput };
  }

  it("shows min error when min date > max date", async () => {
    const { Date_Frame } = await import("../../src/js/Functionalities/date.frame.js");
    const { minInput, maxInput } = createDateInputs();

    Date_Frame.functionality({ maxfield: ".max-date" }, minInput);

    minInput.value = "25.12.2025";
    maxInput.value = "01.01.2025";
    minInput.dispatchEvent(new Event("input"));

    expect(($(minInput) as any).error()).toBe("Minimum value is invalid.");
  });

  it("clears errors when min date < max date", async () => {
    const { Date_Frame } = await import("../../src/js/Functionalities/date.frame.js");
    const { minInput, maxInput } = createDateInputs();

    Date_Frame.functionality({ maxfield: ".max-date" }, minInput);

    minInput.value = "01.01.2025";
    maxInput.value = "31.12.2025";
    minInput.dispatchEvent(new Event("input"));

    expect(($(minInput) as any).error()).toBe("");
  });

  it("shows max error when max date < min date via max input", async () => {
    const { Date_Frame } = await import("../../src/js/Functionalities/date.frame.js");
    const { minInput, maxInput } = createDateInputs();

    Date_Frame.functionality({ maxfield: ".max-date" }, minInput);

    minInput.value = "15.06.2025";
    maxInput.value = "01.01.2025";
    maxInput.dispatchEvent(new Event("input"));

    expect(($(maxInput) as any).error()).toBe("Maximum value is invalid.");
  });

  it("uses custom error messages", async () => {
    const { Date_Frame } = await import("../../src/js/Functionalities/date.frame.js");
    const { minInput, maxInput } = createDateInputs();

    Date_Frame.functionality(
      { maxfield: ".max-date", msgmininvalid: "Start too late", msgmaxinvalid: "End too early" },
      minInput,
    );

    minInput.value = "31.12.2025";
    maxInput.value = "01.01.2025";
    minInput.dispatchEvent(new Event("input"));

    expect(($(minInput) as any).error()).toBe("Start too late");
  });

  it("permits equality when equalitypermitted is false (uses > comparison)", async () => {
    const { Date_Frame } = await import("../../src/js/Functionalities/date.frame.js");
    const { minInput, maxInput } = createDateInputs();

    Date_Frame.functionality({ maxfield: ".max-date" }, minInput);

    minInput.value = "15.06.2025";
    maxInput.value = "15.06.2025";
    minInput.dispatchEvent(new Event("input"));

    // With equalitypermitted = false (default), uses > comparison, so equal dates do NOT error
    expect(($(minInput) as any).error()).toBe("");
  });

  it("rejects equal dates when equalitypermitted is true (uses >= comparison)", async () => {
    const { Date_Frame } = await import("../../src/js/Functionalities/date.frame.js");
    const { minInput, maxInput } = createDateInputs();

    Date_Frame.functionality({ maxfield: ".max-date", equalitypermitted: true }, minInput);

    minInput.value = "15.06.2025";
    maxInput.value = "15.06.2025";
    minInput.dispatchEvent(new Event("input"));

    // With equalitypermitted = true, uses >= comparison, so equal dates TRIGGER error
    expect(($(minInput) as any).error()).toBe("Minimum value is invalid.");
  });
});
