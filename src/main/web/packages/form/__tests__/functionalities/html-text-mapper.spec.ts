import { describe, expect, it, afterEach } from "@jest/globals";

import { HTML_Text_Mapper } from "../../src/js/Functionalities/html.text.mapper.js";

describe("HTML_Text_Mapper.functionality", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("replaces placeholders with object values", () => {
    const el = document.createElement("div");
    el.textContent = "Hello [(name)], age [(age)]";
    document.body.appendChild(el);

    HTML_Text_Mapper.functionality(
      {
        replacements: { name: "John", age: "30" },
        property: "textContent",
        css: "",
      },
      el,
    );

    expect(el.textContent).toBe("Hello John, age 30");
  });

  it("handles array of replacement objects (template replication)", () => {
    const el = document.createElement("div");
    el.textContent = "- [(item)]";
    document.body.appendChild(el);

    HTML_Text_Mapper.functionality(
      {
        replacements: [{ item: "A" }, { item: "B" }],
        property: "textContent",
        css: "",
      },
      el,
    );

    expect(el.textContent).toBe("- A- B");
  });

  it("replaces missing properties with empty string", () => {
    const el = document.createElement("div");
    el.textContent = "Value: [(missing)]";
    document.body.appendChild(el);

    HTML_Text_Mapper.functionality(
      {
        replacements: { other: "x" },
        property: "textContent",
        css: "",
      },
      el,
    );

    expect(el.textContent).toBe("Value: [(missing)]");
  });

  it("adds CSS style and CodBi--TextReady class", () => {
    const el = document.createElement("div");
    el.textContent = "test";
    document.body.appendChild(el);

    HTML_Text_Mapper.functionality(
      {
        replacements: {},
        property: "textContent",
        css: "color: red",
      },
      el,
    );

    expect(el.classList.contains("CodBi--TextReady")).toBe(true);
    expect(el.getAttribute("style")).toContain("color: red");
  });

  it("normalizes single replacement to array", () => {
    const el = document.createElement("div");
    el.textContent = "Hi [(who)]";
    document.body.appendChild(el);

    HTML_Text_Mapper.functionality(
      {
        replacements: { who: "World" },
        property: "textContent",
        css: "",
      },
      el,
    );

    expect(el.textContent).toBe("Hi World");
  });
});
