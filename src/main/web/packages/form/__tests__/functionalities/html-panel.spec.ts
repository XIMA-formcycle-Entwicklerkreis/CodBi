import { describe, expect, it, beforeEach } from "@jest/globals";

import { HTML_Panel } from "../../src/js/Functionalities/html.panel.js";

describe("HTML_Panel static helpers", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("determinePage", () => {
    it("returns the ancestor with CXPage class", () => {
      const page = document.createElement("div");
      page.classList.add("CXPage");
      const wrapper = document.createElement("div");
      const el = document.createElement("div");
      wrapper.appendChild(el);
      page.appendChild(wrapper);
      document.body.appendChild(page);

      expect(HTML_Panel.determinePage(el)).toBe(page);
    });

    it("returns null when no CXPage ancestor exists", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      expect(HTML_Panel.determinePage(el)).toBeNull();
    });

    it("returns the element itself if it has CXPage class", () => {
      const el = document.createElement("div");
      el.classList.add("CXPage");
      document.body.appendChild(el);

      expect(HTML_Panel.determinePage(el)).toBe(el);
    });

    it("returns the nearest CXPage ancestor", () => {
      const outerPage = document.createElement("div");
      outerPage.classList.add("CXPage");
      const innerPage = document.createElement("div");
      innerPage.classList.add("CXPage");
      const el = document.createElement("div");
      innerPage.appendChild(el);
      outerPage.appendChild(innerPage);
      document.body.appendChild(outerPage);

      expect(HTML_Panel.determinePage(el)).toBe(innerPage);
    });
  });

  describe("unfoldPanelAncestors", () => {
    it("clicks folded panel headers up the tree", () => {
      const panel = document.createElement("div");
      const header = document.createElement("div");
      let clicked = false;
      header.addEventListener("click", () => {
        clicked = true;
      });

      (panel as any).CodBi_HTML_Panel_Folded = true;
      (panel as any).CodBi_HTML_Panel_Header = header;

      const child = document.createElement("div");
      panel.appendChild(child);
      document.body.appendChild(panel);

      HTML_Panel.unfoldPanelAncestors(child);

      expect(clicked).toBe(true);
    });

    it("skips unfolded panels", () => {
      const panel = document.createElement("div");
      const header = document.createElement("div");
      let clicked = false;
      header.addEventListener("click", () => {
        clicked = true;
      });

      (panel as any).CodBi_HTML_Panel_Folded = false;
      (panel as any).CodBi_HTML_Panel_Header = header;

      const child = document.createElement("div");
      panel.appendChild(child);
      document.body.appendChild(panel);

      HTML_Panel.unfoldPanelAncestors(child);

      expect(clicked).toBe(false);
    });
  });
});
