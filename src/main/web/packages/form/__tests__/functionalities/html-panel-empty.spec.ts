import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { HTML_Panel } from "../../src/js/Functionalities/html.panel.js";
import { TestState, resetTestState } from "../test-state.js";

/**
 * Guards the EMPTY container panel and the accordion membership of its members.
 *
 * Reported case ("Füge zwei panels ein von denen nur eines gleichzeitig aufgeklappt sein kann."): the
 * generated form contained an accordion wrapper with two EMPTY panel containers, and the browser
 * reported
 * `[ Processing "fdPanel2" ... HTML.Panel ...] Error: Tagged <div> or <fieldset> "fdPanel2" contains
 *  no HTML-Element tagged with CSS-"CodBi_HTML_Panel_Header"`.
 *
 * Cause: with `generateheader="true"` the header was only generated when the container already had
 * children (`toProcess.children.length > 0`). An empty panel therefore fell through to the
 * `.CodBi_HTML_Panel_Header` lookup, found nothing and threw — which also kept that panel out of its
 * accordion set, so the members were not mutually exclusive.
 */
describe("HTML_Panel on empty container panels", () => {
  beforeEach(() => {
    (globalThis as any).XFC_METADATA = TestState.xfcMetaData;
    // html.panel.ts registers a `begin` handler on FORMCYCLE's form validator.
    (globalThis as any).xm_validator = { on: jest.fn() };
    (globalThis as any).gotoPage = jest.fn();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
    resetTestState();
    delete (globalThis as any).XFC_METADATA;
    delete (globalThis as any).xm_validator;
    delete (globalThis as any).gotoPage;
  });

  it("generates the header for a container panel WITHOUT children", () => {
    const panel = document.createElement("div");
    panel.id = "emptyPanel";
    panel.setAttribute("data-name", "fdPanel2");
    document.body.appendChild(panel);
    expect(panel.children.length).toBe(0);

    HTML_Panel.functionality({ generateheader: "true", autoheadertitle: "Panel 2", folded: "false" }, panel);

    const header = panel.querySelector(".CodBi_HTML_Panel_Header");
    expect(header).not.toBeNull();
    expect(header!.textContent).toContain("Panel 2");
    expect(panel.classList.contains("--HTML_Panel")).toBe(true);
    expect((panel as any).CodBi_HTML_Panel_Header).toBe(header);
    // The wrapper <div class="cHeader"> is inserted even though the container had no firstChild.
    expect(panel.querySelector(".cHeader")).not.toBeNull();
  });

  it("generates the header from autoheadertitle even WITHOUT the generateheader flag", () => {
    // Defensive: a titled panel must never fail just because the flag was not recognised (e.g. an
    // older/other casing, an array value, or a hand-written element without the flag).
    const panel = document.createElement("div");
    panel.id = "titledOnly";
    panel.setAttribute("data-name", "panel2");
    document.body.appendChild(panel);

    HTML_Panel.functionality({ autoheadertitle: "Panel 2", folded: "false" }, panel);

    const header = panel.querySelector(".CodBi_HTML_Panel_Header");
    expect(header).not.toBeNull();
    expect(header!.textContent).toContain("Panel 2");
    expect(panel.classList.contains("--HTML_Panel")).toBe(true);
  });

  it("an empty member of an accordion keeps the set name and joins the panel class", () => {
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-cb-accordion-group", "myAccordion");
    document.body.appendChild(wrapper);

    const panel = document.createElement("div");
    panel.id = "member";
    panel.setAttribute("data-name", "member");
    // The set name is repeated on EVERY member — that is what makes the group mutually exclusive.
    panel.setAttribute("data-cb-accordion", "myAccordion");
    wrapper.appendChild(panel);

    HTML_Panel.functionality({ generateheader: "true", autoheadertitle: "Panel 1", folded: "false" }, panel);

    expect(panel.classList.contains("--HTML_Panel")).toBe(true);
    expect(panel.getAttribute("data-cb-accordion")).toBe("myAccordion");
  });

  it("unfolding one member folds the other members of the SAME set", () => {
    const wrapper = document.createElement("div");
    wrapper.id = "wrapper";
    wrapper.setAttribute("data-cb-accordion-group", "myAccordion");
    document.body.appendChild(wrapper);

    const build = (id: string, title: string, folded: string): HTMLDivElement => {
      const panel = document.createElement("div");
      panel.id = id;
      panel.setAttribute("data-name", id);
      panel.setAttribute("data-cb-accordion", "myAccordion");
      // The framework tags every element it processes with `data-cb-func` as `CodBi`
      // (global-scope.ts) — the accordion lookups are scoped to `.CodBi.--HTML_Panel`.
      panel.classList.add("CodBi");
      wrapper.appendChild(panel);
      HTML_Panel.functionality({ generateheader: "true", autoheadertitle: title, folded }, panel);
      return panel;
    };

    // The first member starts FOLDED, the second one open — unfolding the first must fold the second.
    const first = build("panel1", "Panel 1", "true");
    const second = build("panel2", "Panel 2", "false");
    const firstHeader = (first as any).CodBi_HTML_Panel_Header as HTMLElement;
    expect(firstHeader).toBeTruthy();
    expect((second as any).CodBi_HTML_Panel_Folded).not.toBe(true);

    firstHeader.click(); // unfold the first member

    expect((first as any).CodBi_HTML_Panel_Folded).toBe(false);

    expect((second as any).CodBi_HTML_Panel_Folded).toBe(true);
  });
});
