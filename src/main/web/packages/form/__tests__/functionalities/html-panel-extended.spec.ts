import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

describe("HTML_Panel static helpers", () => {
  let HTML_Panel: any;

  beforeEach(async () => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    (globalThis as any).xm_validator = { on: () => {} };
    document.body.innerHTML = "";
    const mod = await import("../../src/js/Functionalities/html.panel.js");
    HTML_Panel = mod.HTML_Panel;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    delete (globalThis as any).xm_validator;
    document.body.innerHTML = "";
  });

  describe("determinePage", () => {
    it("returns CXPage ancestor element", () => {
      const page = document.createElement("div");
      page.classList.add("CXPage");
      const child = document.createElement("div");
      const grandchild = document.createElement("span");
      page.appendChild(child);
      child.appendChild(grandchild);
      document.body.appendChild(page);

      expect(HTML_Panel.determinePage(grandchild)).toBe(page);
    });

    it("returns null when no CXPage ancestor exists", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      expect(HTML_Panel.determinePage(el)).toBeNull();
    });

    it("returns the element itself if it is a CXPage", () => {
      const page = document.createElement("div");
      page.classList.add("CXPage");
      document.body.appendChild(page);
      expect(HTML_Panel.determinePage(page)).toBe(page);
    });
  });

  describe("unfoldPanelAncestors", () => {
    it("clicks header of folded ancestor panels", () => {
      const panel = document.createElement("div");
      const mockHeader = document.createElement("div");
      let clickCount = 0;
      mockHeader.addEventListener("click", () => clickCount++);

      (panel as any).CodBi_HTML_Panel_Folded = true;
      (panel as any).CodBi_HTML_Panel_Header = mockHeader;

      const child = document.createElement("div");
      panel.appendChild(child);
      document.body.appendChild(panel);

      HTML_Panel.unfoldPanelAncestors(child);
      expect(clickCount).toBe(1);
    });

    it("does nothing when no panels are folded", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      // Should not throw
      HTML_Panel.unfoldPanelAncestors(el);
    });
  });

  describe("functionality — print mode", () => {
    it("returns early in print mode", () => {
      (globalThis as any).XFC_METADATA = { requestType: "print" };
      const div = document.createElement("div");
      document.body.appendChild(div);

      // Should not throw — returns early
      const result = HTML_Panel.functionality({}, div);
      expect(result).toBeUndefined();
    });
  });

  describe("functionality — basic panel with explicit header", () => {
    it("attaches header and adds --HTML_Panel class to div with existing header", () => {
      const div = document.createElement("div");
      const header = document.createElement("div");
      header.classList.add("CodBi_HTML_Panel_Header");
      header.textContent = "My Panel";
      const wrapper = document.createElement("div");
      wrapper.appendChild(header);
      div.appendChild(wrapper);
      const content = document.createElement("div");
      content.textContent = "Panel content";
      div.appendChild(content);
      document.body.appendChild(div);

      HTML_Panel.functionality({ folded: "true" }, div);

      expect(div.classList.contains("--HTML_Panel")).toBe(true);
      expect((div as any).CodBi_HTML_Panel_Header).toBe(header);
    });
  });
});
