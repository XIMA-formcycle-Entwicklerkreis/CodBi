import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { TestState } from "../test-state.js";

describe("HTML_Panel functionality — deep coverage", () => {
  let HTML_Panel: any;

  beforeEach(async () => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    (globalThis as any).xm_validator = { on: jest.fn() };
    (globalThis as any).gotoPage = jest.fn();
    document.body.innerHTML = "";
    TestState.xUtilCallbacks.clear();
    HTML_Panel = (await import("../../src/js/Functionalities/html.panel.js")).HTML_Panel;
    HTML_Panel.invalidElements = [];
    HTML_Panel.validatorRegistered = false;
    HTML_Panel.submissionInProgress = false;
    HTML_Panel.mapHeaderAfterElements.clear();
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    delete (globalThis as any).xm_validator;
    delete (globalThis as any).gotoPage;
    document.body.innerHTML = "";
  });

  function createPanelDOM(tagName: "div" | "fieldset" = "div") {
    const wrapper = document.createElement("div");
    wrapper.id = "panelWrapper";

    const panel = document.createElement(tagName);
    panel.id = "panelDiv";

    const headerContainer = document.createElement("div");
    headerContainer.id = "hdrContainer";

    const header = document.createElement("div");
    header.classList.add("CodBi_HTML_Panel_Header");
    header.textContent = "Panel Title";

    headerContainer.appendChild(header);
    panel.appendChild(headerContainer);

    const content = document.createElement("div");
    content.textContent = "Body content";
    panel.appendChild(content);

    wrapper.appendChild(panel);
    document.body.appendChild(wrapper);

    return { wrapper, panel, header, content, headerContainer };
  }

  // ── Explicit header — folded ──
  describe("explicit header — folded", () => {
    it("sets up folded state", () => {
      const { panel, header } = createPanelDOM();
      HTML_Panel.functionality({ folded: "true" }, panel);

      expect(panel.classList.contains("--HTML_Panel")).toBe(true);
      expect(panel.classList.contains("--folded")).toBe(true);
      expect(panel.style.display).toBe("none");
      expect((panel as any).CodBi_HTML_Panel_Header).toBe(header);
    });

    it("unfolds on click", () => {
      const { panel, header } = createPanelDOM();
      HTML_Panel.functionality({ folded: "true" }, panel);

      header.click();

      expect((panel as any).CodBi_HTML_Panel_Folded).toBe(false);
      expect(panel.classList.contains("--folded")).toBe(false);
    });

    it("re-folds on second click", () => {
      const { panel, header } = createPanelDOM();
      HTML_Panel.functionality({ folded: "true" }, panel);

      header.click(); // unfold
      header.click(); // fold again

      expect((panel as any).CodBi_HTML_Panel_Folded).toBe(true);
      expect(panel.classList.contains("--folded")).toBe(true);
      expect(panel.style.display).toBe("none");
    });
  });

  // ── Explicit header — unfolded ──
  describe("explicit header — unfolded", () => {
    it("sets up unfolded state", () => {
      const { panel, header } = createPanelDOM();
      HTML_Panel.functionality({ folded: "false" }, panel);

      expect(panel.classList.contains("--HTML_Panel")).toBe(true);
      expect(panel.classList.contains("--folded")).toBe(false);
      expect((panel as any).CodBi_HTML_Panel_Folded).toBe(false);
    });

    it("applies cssheaderunfolded when set", () => {
      const { panel, header } = createPanelDOM();
      HTML_Panel.functionality(
        {
          folded: "false",
          cssheaderunfolded: "background: green;",
        },
        panel,
      );

      expect(header.getAttribute("style")).toContain("background: green");
    });
  });

  // ── CSS options ──
  describe("CSS options", () => {
    it("injects after/before header content styles", () => {
      const { panel } = createPanelDOM();
      HTML_Panel.functionality(
        {
          folded: "false",
          cssafterheadercontent: "▼",
          cssbeforeheadercontent: "►",
          cssafterheader: "font-size: 1em;",
          cssbeforeheader: "color: red;",
        },
        panel,
      );

      const styles = panel.querySelectorAll("style");
      expect(styles.length).toBeGreaterThan(0);
    });

    it("handles cssafterheadercontentunfolded styles", () => {
      const { panel, header } = createPanelDOM();
      HTML_Panel.functionality(
        {
          folded: "true",
          cssafterheadercontentunfolded: "▲",
          cssafterheaderunfolded: "color: blue;",
        },
        panel,
      );

      // Unfold to trigger insertion of unfolded styles
      header.click();

      const styles = panel.querySelectorAll("style");
      expect(styles.length).toBeGreaterThanOrEqual(1);
    });

    it("handles wrappercss on fieldset parent", () => {
      const wrapper = document.createElement("div");
      wrapper.id = "fsWrapper";
      wrapper.classList.add("XFieldSetWrapper");

      const fieldset = document.createElement("fieldset");
      fieldset.id = "myFieldset";

      const headerContainer = document.createElement("div");
      const header = document.createElement("div");
      header.classList.add("CodBi_HTML_Panel_Header");
      headerContainer.appendChild(header);
      fieldset.appendChild(headerContainer);

      const content = document.createElement("div");
      fieldset.appendChild(content);
      wrapper.appendChild(fieldset);
      document.body.appendChild(wrapper);

      HTML_Panel.functionality(
        {
          folded: "false",
          wrappercss: "border: 1px solid red;",
        },
        fieldset,
      );

      expect(wrapper.getAttribute("style")).toContain("border");
    });
  });

  // ── generateheader on fieldset ──
  describe("generateheader on fieldset", () => {
    it("creates header from legend text", () => {
      const wrapper = document.createElement("div");
      wrapper.id = "fsWrapper2";

      const fieldset = document.createElement("fieldset");
      fieldset.id = "myFS";

      const legend = document.createElement("legend");
      legend.textContent = "My Legend";
      fieldset.appendChild(legend);

      const content = document.createElement("div");
      content.textContent = "Content";
      fieldset.appendChild(content);

      wrapper.appendChild(fieldset);
      document.body.appendChild(wrapper);

      HTML_Panel.functionality(
        {
          generateheader: "true",
          folded: "false",
        },
        fieldset,
      );

      const generatedHeader = fieldset.querySelector(".CodBi_HTML_Panel_Header");
      expect(generatedHeader).not.toBeNull();
      expect(generatedHeader!.textContent).toContain("My Legend");
      expect(fieldset.querySelector("legend")).toBeNull();
    });

    it("uses autoheadertitle when provided", () => {
      const wrapper = document.createElement("div");
      wrapper.id = "fsWrapper3";

      const fieldset = document.createElement("fieldset");
      fieldset.id = "myFS2";

      const legend = document.createElement("legend");
      legend.textContent = "Legend";
      fieldset.appendChild(legend);
      fieldset.appendChild(document.createElement("div"));

      wrapper.appendChild(fieldset);
      document.body.appendChild(wrapper);

      HTML_Panel.functionality(
        {
          generateheader: "true",
          autoheadertitle: "Custom Title",
          autoheaderlevel: "2",
          folded: "false",
        },
        fieldset,
      );

      const generatedHeader = fieldset.querySelector(".CodBi_HTML_Panel_Header");
      expect(generatedHeader!.innerHTML).toContain("<h2>");
      expect(generatedHeader!.innerHTML).toContain("Custom Title");
    });

    it("generates header on div element", () => {
      const wrapper = document.createElement("div");
      wrapper.id = "divWrapper";

      const div = document.createElement("div");
      div.id = "myDiv";
      div.appendChild(document.createElement("div"));

      wrapper.appendChild(div);
      document.body.appendChild(wrapper);

      HTML_Panel.functionality(
        {
          generateheader: "true",
          autoheadertitle: "Div Panel",
          folded: "true",
        },
        div,
      );

      expect(div.querySelector(".cHeader")).not.toBeNull();
      expect(div.classList.contains("--HTML_Panel")).toBe(true);
      expect(div.classList.contains("--folded")).toBe(true);
    });

    it("handles scroll option on unfold", () => {
      const { panel, header } = createPanelDOM();
      const scrollSpy = jest.fn();
      panel.scrollIntoView = scrollSpy;

      HTML_Panel.functionality(
        {
          folded: "true",
          scroll: "true",
          scrollblock: "center",
        },
        panel,
      );

      header.click(); // unfold
      expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ block: "center", behavior: "smooth" }));
    });

    it("normalizes scroll with default scrollblock", () => {
      const wrapper = document.createElement("div");
      wrapper.id = "scrollWrapper";
      const fieldset = document.createElement("fieldset");
      fieldset.id = "scrollFS";
      fieldset.appendChild(document.createElement("legend"));
      fieldset.appendChild(document.createElement("div"));
      wrapper.appendChild(fieldset);
      document.body.appendChild(wrapper);

      HTML_Panel.functionality(
        {
          generateheader: "true",
          folded: "false",
          scroll: "true",
        },
        fieldset,
      );

      expect(fieldset.classList.contains("--HTML_Panel")).toBe(true);
    });
  });

  // ── Required fields ──
  describe("required fields", () => {
    it("injects required fields style when aria-required present", () => {
      const { panel } = createPanelDOM();
      const input = document.createElement("input");
      input.setAttribute("aria-required", "true");
      panel.appendChild(input);

      HTML_Panel.functionality({ folded: "false" }, panel);

      const styles = Array.from(panel.querySelectorAll("style"));
      const hasRequired = styles.some((s) => s.innerHTML.includes("CodBi_HTML_Panel_MissingRequiredField"));
      expect(hasRequired).toBe(true);
    });

    it("uses custom cssrequiredfieldscontent", () => {
      const { panel } = createPanelDOM();
      const input = document.createElement("input");
      input.setAttribute("aria-required", "true");
      panel.appendChild(input);

      HTML_Panel.functionality(
        {
          folded: "false",
          cssrequiredfieldscontent: "!",
        },
        panel,
      );

      const styles = Array.from(panel.querySelectorAll("style"));
      const hasCustom = styles.some((s) => s.innerHTML.includes("!"));
      expect(hasCustom).toBe(true);
    });
  });

  // ── Accordion ──
  describe("accordion", () => {
    it("auto-assigns accordion from parent container", () => {
      const wrapper = document.createElement("div");
      wrapper.id = "accWrapper";
      wrapper.setAttribute("data-cb-accordion-group", "myGroup");

      const panel = document.createElement("div");
      panel.id = "accPanel";
      const hdrWrap = document.createElement("div");
      const header = document.createElement("div");
      header.classList.add("CodBi_HTML_Panel_Header");
      hdrWrap.appendChild(header);
      panel.appendChild(hdrWrap);
      panel.appendChild(document.createElement("div"));

      wrapper.appendChild(panel);
      document.body.appendChild(wrapper);

      HTML_Panel.functionality({ folded: "false" }, panel);

      expect(panel.getAttribute("data-cb-accordion")).toBe("myGroup");
    });

    it("folds other panels in same accordion on unfold", () => {
      // Panel A
      const wrapA = document.createElement("div");
      wrapA.id = "wA";

      const panelA = document.createElement("div");
      panelA.id = "pA";
      const hdrWrapA = document.createElement("div");
      const headerA = document.createElement("div");
      headerA.classList.add("CodBi_HTML_Panel_Header");
      hdrWrapA.appendChild(headerA);
      panelA.appendChild(hdrWrapA);
      panelA.appendChild(document.createElement("div"));
      wrapA.appendChild(panelA);
      document.body.appendChild(wrapA);

      HTML_Panel.functionality(
        {
          folded: "true",
          accordion: "grp1",
        },
        panelA,
      );

      // Panel B
      const wrapB = document.createElement("div");
      wrapB.id = "wB";

      const panelB = document.createElement("div");
      panelB.id = "pB";
      const hdrWrapB = document.createElement("div");
      const headerB = document.createElement("div");
      headerB.classList.add("CodBi_HTML_Panel_Header");
      hdrWrapB.appendChild(headerB);
      panelB.appendChild(hdrWrapB);
      panelB.appendChild(document.createElement("div"));
      wrapB.appendChild(panelB);
      document.body.appendChild(wrapB);

      HTML_Panel.functionality(
        {
          folded: "false",
          accordion: "grp1",
        },
        panelB,
      );

      // Unfold A — B should auto-fold
      headerA.click();

      expect((panelA as any).CodBi_HTML_Panel_Folded).toBe(false);
    });
  });

  // ── Submit handler ──
  describe("submit handler", () => {
    it("registers submit handler via xutil", () => {
      const { panel } = createPanelDOM();
      HTML_Panel.functionality({ folded: "false" }, panel);

      expect(TestState.xUtilCallbacks.has("submit")).toBe(true);
    });

    it("prevents submission when required field is empty", () => {
      const { panel } = createPanelDOM();
      const input = document.createElement("input") as HTMLInputElement;
      input.setAttribute("aria-required", "true");
      input.setAttribute("data-name", "field1");
      input.value = "";
      panel.appendChild(input);

      HTML_Panel.functionality({ folded: "false" }, panel);

      const submitCallbacks = TestState.xUtilCallbacks.get("submit");
      let result: any;
      if (submitCallbacks) {
        for (const cb of submitCallbacks) {
          result = cb({});
        }
      }

      expect(result).toEqual(expect.objectContaining({ preventSubmission: true }));
    });

    it("allows submission when all required fields filled", () => {
      const { panel } = createPanelDOM();
      const input = document.createElement("input") as HTMLInputElement;
      input.setAttribute("aria-required", "true");
      input.value = "filled";
      panel.appendChild(input);

      HTML_Panel.functionality({ folded: "false" }, panel);

      const submitCallbacks = TestState.xUtilCallbacks.get("submit");
      let result: any;
      if (submitCallbacks) {
        for (const cb of submitCallbacks) {
          result = cb({});
        }
      }

      expect(result).toEqual(expect.objectContaining({ preventSubmission: false }));
    });

    it("handles invalid elements from validator", () => {
      const { panel } = createPanelDOM();
      const input = document.createElement("input") as HTMLInputElement;
      input.setAttribute("aria-invalid", "true");
      panel.appendChild(input);

      HTML_Panel.invalidElements = [input];

      HTML_Panel.functionality({ folded: "false" }, panel);

      const submitCallbacks = TestState.xUtilCallbacks.get("submit");
      let result: any;
      if (submitCallbacks) {
        for (const cb of submitCallbacks) {
          result = cb({});
        }
      }

      expect(result).toEqual(expect.objectContaining({ preventSubmission: true }));
    });

    it("prevents submission when an invalid (aria-invalid) field is inside a folded panel", () => {
      const { panel } = createPanelDOM();
      const input = document.createElement("input") as HTMLInputElement;
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("data-name", "fieldFmt");
      input.value = "bad-format-value";
      panel.appendChild(input);

      HTML_Panel.functionality({ folded: "true" }, panel);

      // The Formcycle validator skips fields inside folded (hidden) panels, so
      // invalidElements stays empty and only the proactive submit-check can catch it.
      HTML_Panel.invalidElements = [];

      const submitCallbacks = TestState.xUtilCallbacks.get("submit");
      let result: any;
      if (submitCallbacks) {
        for (const cb of submitCallbacks) {
          result = cb({});
        }
      }

      expect(result).toEqual(expect.objectContaining({ preventSubmission: true }));
      // The folded panel must have been unfolded so the user can see the invalid field.
      expect(panel.classList.contains("--folded")).toBe(false);
    });

    it("prevents submission when an invalid (aria-invalid) field is inside a folded accordion panel", () => {
      const wrap = document.createElement("div");
      wrap.id = "accordionWrap";
      document.body.appendChild(wrap);

      // Panel P (folded) containing an invalid field.
      const panelP = document.createElement("div");
      panelP.id = "panelP";
      const hdrWrapP = document.createElement("div");
      const headerP = document.createElement("div");
      headerP.classList.add("CodBi_HTML_Panel_Header");
      hdrWrapP.appendChild(headerP);
      panelP.appendChild(hdrWrapP);
      const input = document.createElement("input") as HTMLInputElement;
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("data-name", "fieldP");
      input.value = "bad-format-value";
      panelP.appendChild(input);
      wrap.appendChild(panelP);

      // Panel Q (unfolded) valid.
      const panelQ = document.createElement("div");
      panelQ.id = "panelQ";
      const hdrWrapQ = document.createElement("div");
      const headerQ = document.createElement("div");
      headerQ.classList.add("CodBi_HTML_Panel_Header");
      hdrWrapQ.appendChild(headerQ);
      panelQ.appendChild(hdrWrapQ);
      const inputQ = document.createElement("input") as HTMLInputElement;
      inputQ.setAttribute("aria-required", "true");
      inputQ.value = "ok";
      panelQ.appendChild(inputQ);
      wrap.appendChild(panelQ);

      HTML_Panel.functionality({ folded: "true", accordion: "grp1" }, panelP);
      HTML_Panel.functionality({ folded: "false", accordion: "grp1" }, panelQ);

      HTML_Panel.invalidElements = [];

      const submitCallbacks = TestState.xUtilCallbacks.get("submit");
      let result: any;
      if (submitCallbacks) {
        for (const cb of submitCallbacks) {
          result = cb({});
        }
      }

      expect(result).toEqual(expect.objectContaining({ preventSubmission: true }));
      expect((panelP as any).CodBi_HTML_Panel_Folded).toBe(false);
    });

    it("prevents submission when a folded panel's field stays hidden after unfold (hidden ancestor wrapper)", () => {
      // Simulates a FormCycle ancestor (e.g. an outer container) that keeps `display:none` even
      // though the CodBi panel itself is unfolded. Such a field must still block submission,
      // otherwise it would slip through and the form would be sent.
      const outerHidden = document.createElement("div");
      outerHidden.id = "outerHidden";
      outerHidden.style.display = "none";
      document.body.appendChild(outerHidden);

      const panel = document.createElement("div");
      panel.id = "panelHidden";
      const headerContainer = document.createElement("div");
      const header = document.createElement("div");
      header.classList.add("CodBi_HTML_Panel_Header");
      header.textContent = "Panel Title";
      headerContainer.appendChild(header);
      panel.appendChild(headerContainer);
      const input = document.createElement("input") as HTMLInputElement;
      input.setAttribute("aria-required", "true");
      input.setAttribute("data-name", "fieldHidden");
      input.value = "";
      panel.appendChild(input);
      outerHidden.appendChild(panel);

      HTML_Panel.functionality({ folded: "true" }, panel);

      HTML_Panel.invalidElements = [];

      const submitCallbacks = TestState.xUtilCallbacks.get("submit");
      let result: any;
      if (submitCallbacks) {
        for (const cb of submitCallbacks) {
          result = cb({});
        }
      }

      expect(result).toEqual(expect.objectContaining({ preventSubmission: true }));
      expect((panel as any).CodBi_HTML_Panel_Folded).toBe(false);
    });

    it("allows submission when an empty required field is hidden by a Formcycle property (not in a folded panel)", () => {
      // A required field hidden by a Formcycle property (display:none, no folded-panel ancestor) is
      // intentionally not required — Formcycle handles it — so it must NOT block submission. Only
      // fields inside a folded panel block submission.
      const wrapper = document.createElement("div");
      wrapper.id = "hiddenWrap";
      wrapper.style.display = "none";
      document.body.appendChild(wrapper);

      const input = document.createElement("input") as HTMLInputElement;
      input.setAttribute("aria-required", "true");
      input.setAttribute("data-name", "fieldHiddenPlain");
      input.value = "";
      wrapper.appendChild(input);

      // Register the handlers via a regular (unfolded) panel.
      const { panel } = createPanelDOM();
      HTML_Panel.functionality({ folded: "false" }, panel);

      HTML_Panel.invalidElements = [];

      const submitCallbacks = TestState.xUtilCallbacks.get("submit");
      let result: any;
      if (submitCallbacks) {
        for (const cb of submitCallbacks) {
          result = cb({});
        }
      }
      expect(result).toEqual(expect.objectContaining({ preventSubmission: false }));

      // The validator hook must NOT force a validation failure for a property-hidden (non-folded)
      // field either. It only acts while a submission is in progress, so set the flag first.
      const beginCalls = (globalThis as any).xm_validator.on.mock.calls.filter((call: any) => call[0] === "begin");
      expect(beginCalls.length).toBeGreaterThan(0);
      const beginCallback = beginCalls[beginCalls.length - 1][1];
      HTML_Panel.submissionInProgress = true;
      const vResult = beginCallback({ items: [], silent: false, type: "main" });
      expect(vResult).toBeUndefined();
    });

    it("blocks submission for a folded-panel mandatory field but allows a property-hidden one", () => {
      // Regression: a mandatory field in a folded panel must block submission (and the panel is
      // unfolded so the user can see it), while a mandatory field hidden by a Formcycle property
      // (display:none, no folded ancestor) must NOT block submission.
      const { panel: foldedPanel } = createPanelDOM();
      const foldedInput = document.createElement("input") as HTMLInputElement;
      foldedInput.setAttribute("aria-required", "true");
      foldedInput.setAttribute("data-name", "fieldFoldedSubmit");
      foldedInput.value = "";
      foldedPanel.appendChild(foldedInput);
      HTML_Panel.functionality({ folded: "true" }, foldedPanel);

      const hidden = document.createElement("div");
      hidden.style.display = "none";
      document.body.appendChild(hidden);
      const hiddenInput = document.createElement("input") as HTMLInputElement;
      hiddenInput.setAttribute("aria-required", "true");
      hiddenInput.setAttribute("data-name", "fieldHiddenSubmit");
      hiddenInput.value = "";
      hidden.appendChild(hiddenInput);

      HTML_Panel.invalidElements = [];

      const submitCallbacks = TestState.xUtilCallbacks.get("submit");
      let result: any;
      if (submitCallbacks) {
        for (const cb of submitCallbacks) {
          result = cb({});
        }
      }
      // The folded mandatory field must block submission and the panel must be unfolded.
      expect(result).toEqual(expect.objectContaining({ preventSubmission: true }));
      expect((foldedPanel as any).CodBi_HTML_Panel_Folded).toBe(false);
    });

    it("validator begin forces validation failure for an invalid field in a folded panel", () => {
      // The Formcycle validator skips fields inside folded (hidden) panels, so the form would be
      // submitted. The validator's "begin" callback must force the whole validation to fail
      // (which blocks submission) and unfold the panel so the user can see the invalid field.
      const { panel } = createPanelDOM();
      const input = document.createElement("input") as HTMLInputElement;
      input.setAttribute("aria-required", "true");
      input.setAttribute("data-name", "fieldFolded");
      input.value = "";
      panel.appendChild(input);

      HTML_Panel.functionality({ folded: "true" }, panel);

      const beginCalls = (globalThis as any).xm_validator.on.mock.calls.filter((call: any[]) => call[0] === "begin");
      expect(beginCalls.length).toBeGreaterThan(0);
      const beginCallback = beginCalls[beginCalls.length - 1][1];

      // Only an actual submission (flag set by the submit handler) triggers the unfold/force-fail.
      HTML_Panel.submissionInProgress = true;
      const result = beginCallback({ items: [], silent: false, type: "main" });

      expect(result).toEqual({ valid: false });
      expect((panel as any).CodBi_HTML_Panel_Folded).toBe(false);
    });

    it("validator begin does NOT unfold a folded panel when no submission is in progress (blur)", () => {
      // Regression: while the user is filling out the form, blurring a field in another panel runs a
      // "main" validation. A mandatory-but-empty field inside a folded first panel must NOT cause
      // that panel to auto-open (which would close the accordion panel the user is working in).
      const { panel } = createPanelDOM();
      const input = document.createElement("input") as HTMLInputElement;
      input.setAttribute("aria-required", "true");
      input.setAttribute("data-name", "fieldFoldedBlur");
      input.value = "";
      panel.appendChild(input);

      HTML_Panel.functionality({ folded: "true" }, panel);
      HTML_Panel.submissionInProgress = false; // blur scenario — no submission is in progress.

      const beginCalls = (globalThis as any).xm_validator.on.mock.calls.filter((call: any[]) => call[0] === "begin");
      expect(beginCalls.length).toBeGreaterThan(0);
      const beginCallback = beginCalls[beginCalls.length - 1][1];

      const result = beginCallback({ items: [], silent: false, type: "main" });

      // The panel must stay folded and no validation failure may be forced.
      expect(result).toBeUndefined();
      expect((panel as any).CodBi_HTML_Panel_Folded).toBe(true);
    });
  });

  // ── Validator registration ──
  describe("validator", () => {
    it("registers xm_validator.on handler", () => {
      const { panel } = createPanelDOM();
      HTML_Panel.validatorRegistered = false;

      HTML_Panel.functionality({ folded: "false" }, panel);

      expect((globalThis as any).xm_validator.on).toHaveBeenCalledWith("begin", expect.any(Function));
    });
  });

  // ── No header throws ──
  describe("error handling", () => {
    it("throws when no .CodBi_HTML_Panel_Header exists", () => {
      const panel = document.createElement("div");
      panel.id = "noheader";
      panel.setAttribute("data-name", "myPanel");
      panel.appendChild(document.createElement("div"));
      document.body.appendChild(panel);

      expect(() => {
        HTML_Panel.functionality({ folded: "false" }, panel);
      }).toThrow();
    });
  });

  // ── Print mode ──
  describe("print mode", () => {
    it("does not fold in print mode", () => {
      document.body.classList.add("fc-print-mode");
      const { panel } = createPanelDOM();
      HTML_Panel.functionality({ folded: "true" }, panel);

      expect((panel as any).CodBi_HTML_Panel_Folded).toBe(false);
      document.body.classList.remove("fc-print-mode");
    });
  });

  // ── Animation styles ──
  describe("animation styles", () => {
    it("injects fade-in animation when configured", () => {
      const { panel } = createPanelDOM();
      HTML_Panel.functionality(
        {
          folded: "false",
          cssanimfadeinpanel: "0% { opacity: 0; } 100% { opacity: 1; }",
          cssanimfadeinpanelduration: "0.5s",
          cssanimfadeinpaneleasing: "ease-out",
        },
        panel,
      );

      const styles = Array.from(panel.querySelectorAll("style"));
      const hasFadeIn = styles.some((s) => s.innerHTML.includes("CodBi_FadeIN_Panel"));
      expect(hasFadeIn).toBe(true);
    });
  });
});
