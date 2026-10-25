import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import $ from "jquery";
// Registers "Date.Min" on the window.codbi created by the jest setup file.
import "../src/js/Functionalities/date.min.js";

/**
 * End-to-end regression test for the `CodBi_NoFutureDate` STANDARD CONFIGURATION — i.e. for a date
 * field that carries ONLY the CSS class (no `data-cb-func` attribute in the markup):
 *
 * ```
 * Appointments.js -> window.codbi.loadConfig({ targets: ".CodBi_NoFutureDate", FUNC: "Date.Min", … })
 *                 -> data-cb-* attributes on the input
 *                 -> CodBi.checkAttributes() -> Date.Min functionality
 * ```
 *
 * The reported bug: future dates stayed selectable although the field carried the class, while
 * applying `data-cb-func="Date.Min" data-cb-minimum="0"` by hand worked. The class is only a MARKER —
 * its behaviour must be applied by the configuration script.
 */
describe("Standard configuration CodBi_NoFutureDate", () => {
  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    // No backend in jest: every plugin?name=CodBi_LocalAPIDoc call resolves to "NONE".
    ($ as any).ajax = (options: any) => {
      options.success?.({ result: "NONE" });
      options.error?.({});
      return { done: () => ({ fail: () => undefined }) };
    };
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("applies Date.Min (max = today) from the CSS class alone", async () => {
    // MARKUP AS FORMCYCLE RENDERS IT: the configuration class sits on the <input>.
    document.body.innerHTML =
      '<div class="xm-form-item"><input id="d" class="XItem XTextField CodBi_NoFutureDate" type="text" data-datepicker="1"></div>';

    const codbi = (window as any).codbi;
    codbi.formReady = true;

    await import("../src/js/Configurations/Appointments.js");
    await new Promise((resolve) => setTimeout(resolve, 200));

    const input = document.getElementById("d") as HTMLInputElement;

    // 1) The configuration wrote its attributes onto the field …
    expect(input.getAttribute("data-cb-func")).toBe("Date.Min");
    expect(input.getAttribute("data-cb-minimum")).toBe("0");
    // 2) … and the functionality actually ran (the calendar is restricted to today).
    expect(($(input).data("dp-options") as { maxDate?: string } | undefined)?.maxDate).toBe("-0d");

    const toText = (date: Date): string =>
      `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;

    // 3) A future date is rejected …
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    input.value = toText(tomorrow);
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect($(input).data("error-msg")).toBeTruthy();

    // … 4) while TODAY itself stays a valid value.
    input.value = toText(new Date());
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect($(input).data("error-msg")).toBe("");
  });
});
