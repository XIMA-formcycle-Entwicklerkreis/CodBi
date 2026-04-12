import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

describe("HTML.Text.Mapper — extended", () => {
  let HTML_Text_Mapper: any;

  beforeEach(async () => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    const mod = await import("../../src/js/Functionalities/html.text.mapper.js");
    HTML_Text_Mapper = mod.HTML_Text_Mapper;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("replaces multiple different placeholders", () => {
    const el = document.createElement("div");
    el.textContent = "Hello [(first)] [(last)]!";

    HTML_Text_Mapper.functionality(
      {
        replacements: { first: "John", last: "Doe" },
        property: "textContent",
      },
      el,
    );

    expect(el.textContent).toBe("Hello John Doe!");
  });

  it("replaces same placeholder multiple times", () => {
    const el = document.createElement("div");
    el.textContent = "[(name)] likes [(name)]";

    HTML_Text_Mapper.functionality(
      {
        replacements: { name: "Alice" },
        property: "textContent",
      },
      el,
    );

    expect(el.textContent).toBe("Alice likes Alice");
  });

  it("handles array of replacements (template replication)", () => {
    const el = document.createElement("div");
    el.textContent = "[(item)] ";

    HTML_Text_Mapper.functionality(
      {
        replacements: [{ item: "Apple" }, { item: "Banana" }, { item: "Cherry" }],
        property: "textContent",
      },
      el,
    );

    expect(el.textContent).toBe("Apple Banana Cherry ");
  });

  it("replaces undefined property values with empty string", () => {
    const el = document.createElement("div");
    el.textContent = "Value: [(missing)]";

    HTML_Text_Mapper.functionality(
      {
        replacements: { missing: undefined },
        property: "textContent",
      },
      el,
    );

    expect(el.textContent).toBe("Value: ");
  });

  it("applies CSS and adds CodBi--TextReady class", () => {
    const el = document.createElement("div");
    el.textContent = "[(x)]";

    HTML_Text_Mapper.functionality(
      {
        replacements: { x: "done" },
        property: "textContent",
        css: "color: red",
      },
      el,
    );

    expect(el.classList.contains("CodBi--TextReady")).toBe(true);
    expect(el.getAttribute("style")).toContain("color: red");
  });

  it("works with innerHTML property", () => {
    const el = document.createElement("div");
    el.innerHTML = "<b>[(text)]</b>";

    HTML_Text_Mapper.functionality(
      {
        replacements: { text: "Bold" },
        property: "innerHTML",
      },
      el,
    );

    expect(el.innerHTML).toContain("Bold");
  });

  it("skips undefined entries in replacement array", () => {
    const el = document.createElement("div");
    el.textContent = "[(v)]";

    HTML_Text_Mapper.functionality(
      {
        replacements: [undefined, { v: "OK" }],
        property: "textContent",
      },
      el,
    );

    expect(el.textContent).toBe("OK");
  });
});
