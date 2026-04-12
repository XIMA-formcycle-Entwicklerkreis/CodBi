import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { getJQuery } from "@de-xima/fc-form-renderer";

describe("Time_Frame.functionality", () => {
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
  function createTimeInputs(maxSelector: string): { minInput: HTMLInputElement; maxInput: HTMLInputElement } {
    const grandparent = document.createElement("div");
    const parent = document.createElement("div");
    grandparent.appendChild(parent);

    const minInput = document.createElement("input");
    minInput.type = "text";
    parent.appendChild(minInput);

    const maxInput = document.createElement("input");
    maxInput.type = "text";
    maxInput.classList.add("max-time");
    parent.appendChild(maxInput);

    document.body.appendChild(grandparent);
    return { minInput, maxInput };
  }

  it("sets error on min field when min >= max (equality not permitted)", async () => {
    const { Time_Frame } = await import("../../src/js/Functionalities/time.frame.js");
    const { minInput, maxInput } = createTimeInputs(".max-time");

    Time_Frame.functionality(
      { maxfield: ".max-time", msgmininvalid: "Min too high", msgmaxinvalid: "Max too low" },
      minInput,
    );

    minInput.value = "14:00";
    maxInput.value = "13:00";
    minInput.dispatchEvent(new Event("input"));

    expect(($(minInput) as any).error()).toBe("Min too high");
  });

  it("clears error on both fields when min < max", async () => {
    const { Time_Frame } = await import("../../src/js/Functionalities/time.frame.js");
    const { minInput, maxInput } = createTimeInputs(".max-time");

    Time_Frame.functionality({ maxfield: ".max-time" }, minInput);

    minInput.value = "09:00";
    maxInput.value = "17:00";
    minInput.dispatchEvent(new Event("input"));

    expect(($(minInput) as any).error()).toBe("");
    expect(($(maxInput) as any).error()).toBe("");
  });

  it("sets error on max field when max <= min via max input event", async () => {
    const { Time_Frame } = await import("../../src/js/Functionalities/time.frame.js");
    const { minInput, maxInput } = createTimeInputs(".max-time");

    Time_Frame.functionality({ maxfield: ".max-time" }, minInput);

    minInput.value = "15:00";
    maxInput.value = "10:00";
    maxInput.dispatchEvent(new Event("input"));

    expect(($(maxInput) as any).error()).toBe("Maximum value is invalid.");
  });

  it("uses default error messages when none specified", async () => {
    const { Time_Frame } = await import("../../src/js/Functionalities/time.frame.js");
    const { minInput, maxInput } = createTimeInputs(".max-time");

    Time_Frame.functionality({ maxfield: ".max-time" }, minInput);

    minInput.value = "18:00";
    maxInput.value = "08:00";
    minInput.dispatchEvent(new Event("input"));

    expect(($(minInput) as any).error()).toBe("Minimum value is invalid.");
  });

  it("permits equality when equalitypermitted is true", async () => {
    const { Time_Frame } = await import("../../src/js/Functionalities/time.frame.js");
    const { minInput, maxInput } = createTimeInputs(".max-time");

    Time_Frame.functionality({ maxfield: ".max-time", equalitypermitted: true }, minInput);

    minInput.value = "12:00";
    maxInput.value = "12:00";
    minInput.dispatchEvent(new Event("input"));

    // With equality permitted, equal times should NOT produce error
    expect(($(minInput) as any).error()).toBe("");
  });

  it("rejects equality when equalitypermitted is false (default)", async () => {
    const { Time_Frame } = await import("../../src/js/Functionalities/time.frame.js");
    const { minInput, maxInput } = createTimeInputs(".max-time");

    Time_Frame.functionality({ maxfield: ".max-time" }, minInput);

    minInput.value = "12:00";
    maxInput.value = "12:00";
    minInput.dispatchEvent(new Event("input"));

    expect(($(minInput) as any).error()).toBe("Minimum value is invalid.");
  });
});
