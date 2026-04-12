import { describe, expect, it, afterEach, beforeEach } from "@jest/globals";

import { HTML_Panel_Accordion } from "../../src/js/Functionalities/html.panel.accordion.js";
import { TestState, resetTestState } from "../test-state.js";

describe("HTML_Panel_Accordion.functionality", () => {
  beforeEach(() => {
    (globalThis as any).XFC_METADATA = TestState.xfcMetaData;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    resetTestState();
    delete (globalThis as any).XFC_METADATA;
  });

  it("sets data-cb-accordion-group on the container", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    HTML_Panel_Accordion.functionality({ accordion: "myGroup" }, container);

    expect(container.getAttribute("data-cb-accordion-group")).toBe("myGroup");
  });

  it("stamps existing panels with the accordion name", () => {
    const container = document.createElement("div");
    const panel = document.createElement("div");
    panel.classList.add("CodBi", "--HTML_Panel");
    container.appendChild(panel);
    document.body.appendChild(container);

    HTML_Panel_Accordion.functionality({ accordion: "acc1" }, container);

    expect(panel.getAttribute("data-cb-accordion")).toBe("acc1");
  });

  it("does not stamp panels with NoCordion class", () => {
    const container = document.createElement("div");
    const panel = document.createElement("div");
    panel.classList.add("CodBi", "--HTML_Panel", "CodBi_HTML_Panel_NoCordion");
    container.appendChild(panel);
    document.body.appendChild(container);

    HTML_Panel_Accordion.functionality({ accordion: "acc1" }, container);

    expect(panel.getAttribute("data-cb-accordion")).toBeNull();
  });

  it("does nothing in print mode", () => {
    TestState.xfcMetaData.requestType = "print";
    const container = document.createElement("div");
    document.body.appendChild(container);

    HTML_Panel_Accordion.functionality({ accordion: "acc1" }, container);

    expect(container.getAttribute("data-cb-accordion-group")).toBeNull();
  });
});
