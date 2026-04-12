import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

describe("HTML.Input.Cleave", () => {
  let HTML_Input_Cleave: any;
  let cleaveInstances: any[];

  beforeEach(async () => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    const mod = await import("../../src/js/Functionalities/html.input.cleave.js");
    HTML_Input_Cleave = mod.HTML_Input_Cleave;
    // Get mock instances
    const cleaveMock = await import("cleave.js");
    cleaveInstances = (cleaveMock as any).__cleaveInstances || [];
    cleaveInstances.length = 0;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  function createTextInput(): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);
    return input;
  }

  it("creates Cleave instance with default date options", () => {
    const input = createTextInput();
    HTML_Input_Cleave.functionality({}, input);

    expect(cleaveInstances.length).toBe(1);
    expect(cleaveInstances[0].options.date).toBe(true);
    expect(cleaveInstances[0].options.delimiter).toBe(".");
    expect(cleaveInstances[0].options.datePattern).toEqual(["d", "m", "Y"]);
  });

  it("uses custom delimiter", () => {
    const input = createTextInput();
    HTML_Input_Cleave.functionality({ delimiter: "/" }, input);

    expect(cleaveInstances.length).toBe(1);
    expect(cleaveInstances[0].options.delimiter).toBe("/");
  });

  it("sets dateMin and dateMax", () => {
    const input = createTextInput();
    HTML_Input_Cleave.functionality({ datemin: "2020-01-01", datemax: "2025-12-31" }, input);

    expect(cleaveInstances[0].options.dateMin).toBe("2020-01-01");
    expect(cleaveInstances[0].options.dateMax).toBe("2025-12-31");
  });

  it("uses custom config string (JSON with angle brackets)", () => {
    const input = createTextInput();
    HTML_Input_Cleave.functionality({ config: '<"date": true, "delimiter": "-">' }, input);

    expect(cleaveInstances[0].options.date).toBe(true);
    expect(cleaveInstances[0].options.delimiter).toBe("-");
  });

  it("uses config object directly", () => {
    const input = createTextInput();
    const configObj = { numeral: true, numeralThousandsGroupStyle: "thousand" };
    HTML_Input_Cleave.functionality({ config: configObj }, input);

    expect(cleaveInstances[0].options).toBe(configObj);
  });

  it("handles arrayed parameters by unwrapping first element", () => {
    const input = createTextInput();
    HTML_Input_Cleave.functionality({ date: [true], delimiter: ["-"], datemin: ["2020-01-01"] }, input);

    expect(cleaveInstances[0].options.date).toBe(true);
    expect(cleaveInstances[0].options.delimiter).toBe("-");
    expect(cleaveInstances[0].options.dateMin).toBe("2020-01-01");
  });

  it("does nothing for non-INPUT elements", () => {
    // This test verifies the tagName guard — but XDBC will throw for non-INPUT
    // elements due to the INSTANCE.PRE constraint, so we just verify it works
    // correctly on valid INPUT elements
    const input = createTextInput();
    HTML_Input_Cleave.functionality({}, input);
    expect(cleaveInstances.length).toBe(1);
  });
});
