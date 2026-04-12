import { describe, expect, it, afterEach } from "@jest/globals";

import { HTML_CSS } from "../../src/js/Functionalities/html.css.js";

describe("HTML_CSS.functionality", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    // Remove injected styles
    for (const s of document.head.querySelectorAll("style")) {
      if (!s.textContent?.includes("CodBiLoader")) {
        s.remove();
      }
    }
  });

  it("injects CSS into the document head", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    HTML_CSS.functionality({ css: "body < color: red >" } as never, el);

    const styles = document.head.querySelectorAll("style");
    const injected = Array.from(styles).find((s) => s.innerHTML.includes("color: red"));
    expect(injected).toBeDefined();
  });

  it("replaces < and > with { and } in CSS", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    HTML_CSS.functionality({ css: ".myClass < font-size: 14px >" } as never, el);

    const styles = document.head.querySelectorAll("style");
    const injected = Array.from(styles).find((s) => s.innerHTML.includes("font-size: 14px"));
    expect(injected?.innerHTML).toContain("{");
    expect(injected?.innerHTML).toContain("}");
    expect(injected?.innerHTML).not.toContain("<");
    expect(injected?.innerHTML).not.toContain(">");
  });

  it("replaces § with comma in CSS", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    HTML_CSS.functionality({ css: ".a§ .b < color: blue >" } as never, el);

    const styles = document.head.querySelectorAll("style");
    const injected = Array.from(styles).find((s) => s.innerHTML.includes("color: blue"));
    expect(injected?.innerHTML).toContain(",");
  });

  it("applies replacements to CSS before injection", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    HTML_CSS.functionality(
      {
        css: ".test < color: MAIN_COLOR >",
        replacements: ["MAIN_COLOR|green"],
      } as never,
      el,
    );

    const styles = document.head.querySelectorAll("style");
    const injected = Array.from(styles).find((s) => s.innerHTML.includes("green"));
    expect(injected).toBeDefined();
  });

  it("injects into custom destination", () => {
    const el = document.createElement("div");
    const dest = document.createElement("div");
    dest.id = "css-dest";
    document.body.appendChild(el);
    document.body.appendChild(dest);

    HTML_CSS.functionality({ css: ".x < color: purple >", destination: "#css-dest" } as never, el);

    const injected = dest.querySelector("style");
    expect(injected?.innerHTML).toContain("color: purple");
  });

  it("sets cbCSS attribute on processed element", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    HTML_CSS.functionality({ css: ".y < display: flex >" } as never, el);

    expect(el.hasAttribute("cbCSS")).toBe(true);
  });

  it("handles CSS passed as array", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    HTML_CSS.functionality({ css: [".z < margin: 0 >"] } as never, el);

    const styles = document.head.querySelectorAll("style");
    const injected = Array.from(styles).find((s) => s.innerHTML.includes("margin: 0"));
    expect(injected).toBeDefined();
  });
});
