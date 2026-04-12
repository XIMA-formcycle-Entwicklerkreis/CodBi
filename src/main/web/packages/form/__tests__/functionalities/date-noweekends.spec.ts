import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { getJQuery } from "@de-xima/fc-form-renderer";

describe("Date_NoWeekends.functionality", () => {
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

  it("sets beforeShowDay to noWeekends on datepicker", async () => {
    const { Date_NoWeekends } = await import("../../src/js/Functionalities/date.noweekends.js");
    const input = createInput();

    Date_NoWeekends.functionality({}, input);

    const opts = $(input).data("dp-options") || {};
    expect(opts.beforeShowDay).toBe(($ as any).datepicker.noWeekends);
  });

  it("shows error when a Saturday date is entered", async () => {
    const { Date_NoWeekends } = await import("../../src/js/Functionalities/date.noweekends.js");
    const input = createInput();

    Date_NoWeekends.functionality({}, input);

    // 21.06.2025 is a Saturday (dd.MM.yyyy with "." delimiter)
    input.value = "21.06.2025";
    $(input).trigger("change");

    expect(($(input) as any).error()).not.toBe("");
  });

  it("shows error when a Sunday date is entered", async () => {
    const { Date_NoWeekends } = await import("../../src/js/Functionalities/date.noweekends.js");
    const input = createInput();

    Date_NoWeekends.functionality({}, input);

    // 22.06.2025 is a Sunday
    input.value = "22.06.2025";
    $(input).trigger("change");

    expect(($(input) as any).error()).not.toBe("");
  });

  it("clears error when a weekday date is entered", async () => {
    const { Date_NoWeekends } = await import("../../src/js/Functionalities/date.noweekends.js");
    const input = createInput();

    Date_NoWeekends.functionality({}, input);

    // 23.06.2025 is a Monday
    input.value = "23.06.2025";
    $(input).trigger("change");

    expect(($(input) as any).error()).toBe("");
  });

  it("uses custom error message from msgnoweekends parameter", async () => {
    const { Date_NoWeekends } = await import("../../src/js/Functionalities/date.noweekends.js");
    const input = createInput();

    Date_NoWeekends.functionality({ msgnoweekends: "No weekends please!" }, input);

    // Saturday
    input.value = "21.06.2025";
    $(input).trigger("change");

    expect(($(input) as any).error()).toBe("No weekends please!");
  });

  it("respects custom delimiter", async () => {
    const { Date_NoWeekends } = await import("../../src/js/Functionalities/date.noweekends.js");
    const input = createInput();

    Date_NoWeekends.functionality({ delimiter: "/" }, input);

    // 21/06/2025 is a Saturday with "/" delimiter
    input.value = "21/06/2025";
    $(input).trigger("change");

    expect(($(input) as any).error()).not.toBe("");
  });
});
