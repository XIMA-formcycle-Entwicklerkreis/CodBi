import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { getJQuery } from "@de-xima/fc-form-renderer";

describe("Date_Min.functionality", () => {
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

  it("sets datepicker maxDate option (non-reverse mode)", async () => {
    const { Date_Min } = await import("../../src/js/Functionalities/date.min.js");
    const input = createInput();

    Date_Min.functionality({ minimum: "18", unit: "y" }, input);

    const opts = $(input).data("dp-options") || {};
    expect(opts.maxDate).toBe("-18y");
  });

  it("sets datepicker minDate option (reverse mode)", async () => {
    const { Date_Min } = await import("../../src/js/Functionalities/date.min.js");
    const input = createInput();

    Date_Min.functionality({ minimum: "5", unit: "d", reverse: true }, input);

    const opts = $(input).data("dp-options") || {};
    expect(opts.minDate).toBe("+5d");
  });

  it("uses Y as default unit when not specified", async () => {
    const { Date_Min } = await import("../../src/js/Functionalities/date.min.js");
    const input = createInput();

    Date_Min.functionality({ minimum: "21" }, input);

    const opts = $(input).data("dp-options") || {};
    expect(opts.maxDate).toBe("-21y");
  });

  it("shows error on change when date too recent (non-reverse)", async () => {
    const { Date_Min } = await import("../../src/js/Functionalities/date.min.js");
    const input = createInput();

    // Require min 100 years — today's date is always too recent
    Date_Min.functionality({ minimum: "100", unit: "y" }, input);

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    input.value = `${dd}.${mm}.${yyyy}`;
    $(input).trigger("change");

    expect(($(input) as any).error()).not.toBe("");
  });

  it("clears error on change when date is valid", async () => {
    const { Date_Min } = await import("../../src/js/Functionalities/date.min.js");
    const input = createInput();

    // Require min 18 years
    Date_Min.functionality({ minimum: "18", unit: "y" }, input);

    const past = new Date();
    past.setFullYear(past.getFullYear() - 30); // 30 years ago is fine
    const dd = String(past.getDate()).padStart(2, "0");
    const mm = String(past.getMonth() + 1).padStart(2, "0");
    const yyyy = past.getFullYear();
    input.value = `${dd}.${mm}.${yyyy}`;
    $(input).trigger("change");

    expect(($(input) as any).error()).toBe("");
  });

  it("uses custom error message with date placeholder", async () => {
    const { Date_Min } = await import("../../src/js/Functionalities/date.min.js");
    const input = createInput();

    Date_Min.functionality({ minimum: "100", unit: "y", msghigher: "Must be before [%ERROR_DATE%]" }, input);

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    input.value = `${dd}.${mm}.${yyyy}`;
    $(input).trigger("change");

    expect(($(input) as any).error()).toContain("Must be before ");
    expect(($(input) as any).error()).not.toContain("[%ERROR_DATE%]");
  });
});
