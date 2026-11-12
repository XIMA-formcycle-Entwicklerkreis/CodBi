import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

describe("OnLoad_Conditional.functionality", () => {
  let checkAttributesSpy: jest.SpiedFunction<any>;

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    // The real createCodbiGlobal exposes checkAttributes; spy on it so the
    // functionality's trailing re-check does not recurse in assertions.
    checkAttributesSpy = jest.spyOn((window as any).codbi, "checkAttributes").mockResolvedValue(true as never);
  });

  afterEach(() => {
    checkAttributesSpy.mockRestore();
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  /**
   * Build a DOM structure: grandparent > parent > [input (tagged), target].
   * The input carries the true/false branch attributes (data-cb underscore T
   * and data-cb underscore F prefixes); the target is resolved via its CSS
   * class selector inside parent.
   */
  function createSetup(opts: {
    trueAttrs?: Record<string, string>;
    falseAttrs?: Record<string, string>;
  }): { input: HTMLElement; target: HTMLDivElement } {
    const grandparent = document.createElement("div");
    const parent = document.createElement("div");
    grandparent.appendChild(parent);

    const input = document.createElement("div");
    parent.appendChild(input);

    const target = document.createElement("div");
    target.classList.add("target-el");
    parent.appendChild(target);

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
    return { input, target };
  }

  it("applies the TRUE branch at load when candidate > reference (GT)", async () => {
    const { OnLoad_Conditional } = await import("../../src/js/Functionalities/onload.conditional.js");
    const { input, target } = createSetup({
      trueAttrs: { style: "display:block" },
      falseAttrs: { style: "display:none" },
    });

    // Simulate an EP resolving the array ".length" to 2 (more than one element).
    OnLoad_Conditional.functionality(
      {
        candidate: 2,
        reference: 1,
        mode: "GT",
        target: ".target-el",
      },
      input,
    );

    expect(target.getAttribute("data-cb-style")).toBe("display:block");
  });

  it("applies the FALSE branch at load when candidate is NOT greater than reference", async () => {
    const { OnLoad_Conditional } = await import("../../src/js/Functionalities/onload.conditional.js");
    const { input, target } = createSetup({
      trueAttrs: { style: "display:block" },
      falseAttrs: { style: "display:none" },
    });

    OnLoad_Conditional.functionality(
      {
        candidate: 1,
        reference: "1",
        mode: "GT",
        target: ".target-el",
      },
      input,
    );

    expect(target.getAttribute("data-cb-style")).toBe("display:none");
  });

  it("reads a numeric string candidate and reference", async () => {
    const { OnLoad_Conditional } = await import("../../src/js/Functionalities/onload.conditional.js");
    const { input, target } = createSetup({
      trueAttrs: { class: "passed" },
      falseAttrs: { class: "failed" },
    });

    OnLoad_Conditional.functionality(
      {
        candidate: "3",
        reference: "2",
        mode: "GTEQ",
        target: ".target-el",
      },
      input,
    );

    expect(target.getAttribute("data-cb-class")).toBe("passed");
  });

  it("handles LT (less than) comparison", async () => {
    const { OnLoad_Conditional } = await import("../../src/js/Functionalities/onload.conditional.js");
    const { input, target } = createSetup({
      trueAttrs: { title: "low" },
    });

    OnLoad_Conditional.functionality(
      {
        candidate: 0,
        reference: 1,
        mode: "LT",
        target: ".target-el",
      },
      input,
    );

    expect(target.getAttribute("data-cb-title")).toBe("low");
  });

  it("handles EQ and NEQ comparisons", async () => {
    const { OnLoad_Conditional } = await import("../../src/js/Functionalities/onload.conditional.js");
    const eqSetup = createSetup({ trueAttrs: { "data-eq": "yes" } });
    OnLoad_Conditional.functionality({ candidate: 5, reference: 5, mode: "EQ", target: ".target-el" }, eqSetup.input);
    expect(eqSetup.target.getAttribute("data-cb-data-eq")).toBe("yes");

    const neqSetup = createSetup({ trueAttrs: { "data-neq": "yes" } });
    OnLoad_Conditional.functionality({ candidate: 5, reference: 6, mode: "NEQ", target: ".target-el" }, neqSetup.input);
    expect(neqSetup.target.getAttribute("data-cb-data-neq")).toBe("yes");
  });

  it("applies the FALSE branch for an empty candidate instead of throwing", async () => {
    const { OnLoad_Conditional } = await import("../../src/js/Functionalities/onload.conditional.js");
    const { input, target } = createSetup({
      trueAttrs: { class: "shown" },
      falseAttrs: { class: "hidden" },
    });

    OnLoad_Conditional.functionality(
      {
        candidate: "",
        reference: 1,
        mode: "GT",
        target: ".target-el",
      },
      input,
    );

    // An empty candidate NEVER fulfils the condition -> the false branch applies.
    expect(target.getAttribute("data-cb-class")).toBe("hidden");
  });

  it("throws a CodBiError for a non-empty, non-numeric candidate", async () => {
    const { OnLoad_Conditional } = await import("../../src/js/Functionalities/onload.conditional.js");
    const { input } = createSetup({});

    expect(() =>
      OnLoad_Conditional.functionality(
        {
          candidate: "abc",
          reference: 1,
          mode: "GT",
          target: ".target-el",
        },
        input,
      ),
    ).toThrow(/could not be converted to a finite number/);
  });
});
