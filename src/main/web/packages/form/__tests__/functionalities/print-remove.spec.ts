import { describe, expect, it, afterEach, beforeEach } from "@jest/globals";

import { Print_Remove } from "../../src/js/Functionalities/print.remove.js";
import { TestState, resetTestState } from "../test-state.js";

describe("Print_Remove.functionality", () => {
  beforeEach(() => {
    (globalThis as any).XFC_METADATA = TestState.xfcMetaData;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    resetTestState();
    delete (globalThis as any).XFC_METADATA;
  });

  it("hides the element itself in print mode", () => {
    TestState.xfcMetaData.requestType = "print";
    const el = document.createElement("div");
    document.body.appendChild(el);

    Print_Remove.functionality({ documentselector: undefined } as never, el);
    expect(el.style.display).toBe("none");
  });

  it("does nothing when not in print mode", () => {
    TestState.xfcMetaData.requestType = "provide";
    const el = document.createElement("div");
    document.body.appendChild(el);

    Print_Remove.functionality({ documentselector: undefined } as never, el);
    expect(el.style.display).not.toBe("none");
  });

  it("hides element by DocumentSelector in print mode", () => {
    TestState.xfcMetaData.requestType = "print";
    const target = document.createElement("div");
    target.id = "to-hide";
    document.body.appendChild(target);

    const el = document.createElement("div");
    document.body.appendChild(el);

    Print_Remove.functionality({ documentselector: "#to-hide" }, el);
    expect(target.style.display).toBe("none");
  });

  it("hides parent by ParentalLevel in print mode", () => {
    TestState.xfcMetaData.requestType = "print";
    const parent2 = document.createElement("div");
    const parent1 = document.createElement("div");
    const el = document.createElement("div");
    parent2.appendChild(parent1);
    parent1.appendChild(el);
    document.body.appendChild(parent2);

    Print_Remove.functionality({ documentselector: undefined, parentallevel: "2" } as never, el);
    expect(parent2.style.display).toBe("none");
  });

  it("inverts behavior: hides element in provide mode when Invert=true", () => {
    TestState.xfcMetaData.requestType = "provide";
    const parent = document.createElement("div");
    const el = document.createElement("div");
    parent.appendChild(el);
    document.body.appendChild(parent);

    Print_Remove.functionality({ documentselector: undefined, invert: "true" } as never, el);
    // invert with no parentallevel → defaults parentallevel to "1"
    expect(parent.style.display).toBe("none");
  });

  it("inverted mode does NOT hide in print mode", () => {
    TestState.xfcMetaData.requestType = "print";
    const parent = document.createElement("div");
    const el = document.createElement("div");
    parent.appendChild(el);
    document.body.appendChild(parent);

    Print_Remove.functionality({ documentselector: undefined, invert: "true" } as never, el);
    expect(parent.style.display).not.toBe("none");
  });
});
