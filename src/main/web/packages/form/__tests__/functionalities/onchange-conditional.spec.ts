import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { getJQuery } from "@de-xima/fc-form-renderer";

describe("OnChange_Conditional.functionality", () => {
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

  /**
   * Build a DOM structure: grandparent > parent > [candidate, input, target]
   * The input has data-cb-* attributes for conditional config.
   */
  function createConditionalSetup(opts: {
    trueAttrs?: Record<string, string>;
    falseAttrs?: Record<string, string>;
  }): { input: HTMLElement; candidate: HTMLInputElement; target: HTMLDivElement } {
    const grandparent = document.createElement("div");
    const parent = document.createElement("div");
    grandparent.appendChild(parent);

    const candidate = document.createElement("input") as HTMLInputElement;
    candidate.type = "text";
    candidate.classList.add("candidate-input");
    parent.appendChild(candidate);

    const input = document.createElement("div");
    parent.appendChild(input);

    const target = document.createElement("div");
    target.classList.add("target-el");
    parent.appendChild(target);

    // Set cb-* attributes for true/false actions
    if (opts.trueAttrs) {
      for (const [k, v] of Object.entries(opts.trueAttrs)) {
        input.setAttribute(`data-cb-_T_${k}`, v);
      }
    }
    if (opts.falseAttrs) {
      for (const [k, v] of Object.entries(opts.falseAttrs)) {
        input.setAttribute(`data-cb-_F_${k}`, v);
      }
    }

    document.body.appendChild(grandparent);
    return { input, candidate, target };
  }

  it("applies true-branch attrs when EQ condition is met", async () => {
    const { OnChange_Conditional } = await import("../../src/js/Functionalities/onchange.conditional.js");
    const { input, candidate, target } = createConditionalSetup({
      trueAttrs: { style: "display:block" },
      falseAttrs: { style: "display:none" },
    });

    OnChange_Conditional.functionality(
      {
        mode: "EQ",
        reference: new Date(2025, 5, 15), // local time, month 0-indexed
        target: ".target-el",
        candidate: ".candidate-input",
      },
      input,
    );

    candidate.value = "06/15/2025"; // Parsed as local time by Date constructor
    $(input).trigger("change");

    expect(target.getAttribute("data-cb-style")).toBe("display:block");
  });

  it("applies false-branch attrs when EQ condition is NOT met", async () => {
    const { OnChange_Conditional } = await import("../../src/js/Functionalities/onchange.conditional.js");
    const { input, candidate, target } = createConditionalSetup({
      trueAttrs: { style: "display:block" },
      falseAttrs: { style: "display:none" },
    });

    OnChange_Conditional.functionality(
      {
        mode: "EQ",
        reference: new Date("2025-12-25"),
        target: ".target-el",
        candidate: ".candidate-input",
      },
      input,
    );

    candidate.value = "06/15/2025";
    $(input).trigger("change");

    expect(target.getAttribute("data-cb-style")).toBe("display:none");
  });

  it("handles GT (greater than) comparison", async () => {
    const { OnChange_Conditional } = await import("../../src/js/Functionalities/onchange.conditional.js");
    const { input, candidate, target } = createConditionalSetup({
      trueAttrs: { class: "passed" },
    });

    OnChange_Conditional.functionality(
      {
        mode: "GT",
        reference: new Date("2025-01-01"),
        target: ".target-el",
        candidate: ".candidate-input",
      },
      input,
    );

    candidate.value = "06/15/2025"; // After Jan 1
    $(input).trigger("change");

    expect(target.getAttribute("data-cb-class")).toBe("passed");
  });

  it("handles dateformat parameter for DD.MM.YYYY parsing", async () => {
    const { OnChange_Conditional } = await import("../../src/js/Functionalities/onchange.conditional.js");
    const { input, candidate, target } = createConditionalSetup({
      trueAttrs: { title: "future" },
    });

    OnChange_Conditional.functionality(
      {
        mode: "GT",
        reference: new Date("2025-01-01"),
        target: ".target-el",
        candidate: ".candidate-input",
        dateformat: "DD.MM.YYYY",
      },
      input,
    );

    candidate.value = "15.06.2025";
    $(input).trigger("change");

    expect(target.getAttribute("data-cb-title")).toBe("future");
  });

  it("handles NEQ (not equal) comparison", async () => {
    const { OnChange_Conditional } = await import("../../src/js/Functionalities/onchange.conditional.js");
    const { input, candidate, target } = createConditionalSetup({
      trueAttrs: { "data-different": "yes" },
    });

    OnChange_Conditional.functionality(
      {
        mode: "NEQ",
        reference: new Date("2025-06-15"),
        target: ".target-el",
        candidate: ".candidate-input",
      },
      input,
    );

    candidate.value = "12/25/2025"; // different date
    $(input).trigger("change");

    expect(target.getAttribute("data-cb-data-different")).toBe("yes");
  });
});
