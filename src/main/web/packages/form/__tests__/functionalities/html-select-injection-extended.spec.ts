import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

describe("HTML.Select.Injection — extended", () => {
  let HTML_Select_Injection: any;

  beforeEach(async () => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    const mod = await import("../../src/js/Functionalities/html.select.injection.js");
    HTML_Select_Injection = mod.HTML_Select_Injection;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("populates select with string values when titles not provided", () => {
    const select = document.createElement("select");
    document.body.appendChild(select);

    HTML_Select_Injection.functionality({ values: ["val1", "val2", "val3"], titles: undefined }, select);

    expect(select.options.length).toBe(3);
    expect(select.options[0]!.value).toBe("val1");
    expect(select.options[0]!.textContent).toBe("val1");
  });

  it("populates select with separate titles and values", () => {
    const select = document.createElement("select");
    document.body.appendChild(select);

    HTML_Select_Injection.functionality({ values: ["a", "b"], titles: ["Title A", "Title B"] }, select);

    expect(select.options.length).toBe(2);
    expect(select.options[0]!.getAttribute("title")).toBe("Title A");
    expect(select.options[0]!.value).toBe("a");
  });

  it("reclean=true clears existing options", () => {
    const select = document.createElement("select");
    select.innerHTML = '<option value="old">Old</option>';
    document.body.appendChild(select);

    HTML_Select_Injection.functionality({ values: ["new"], titles: undefined, reclean: "true" }, select);

    expect(select.options.length).toBe(1);
    expect(select.options[0]!.value).toBe("new");
  });

  it("reclean=false preserves existing options", () => {
    const select = document.createElement("select");
    select.innerHTML = '<option value="old">Old</option>';
    document.body.appendChild(select);

    HTML_Select_Injection.functionality({ values: ["new"], titles: undefined, reclean: "false" }, select);

    expect(select.options.length).toBe(2);
  });

  it("reclean=true as boolean clears existing options", () => {
    const select = document.createElement("select");
    select.innerHTML = '<option value="old">Old</option>';
    document.body.appendChild(select);

    HTML_Select_Injection.functionality({ values: ["new"], titles: undefined, reclean: true }, select);

    expect(select.options.length).toBe(1);
  });

  it("uses valueproperty and titleproperty for object values", () => {
    const select = document.createElement("select");
    document.body.appendChild(select);

    const items = [
      { id: "1", label: "Apple", desc: "A fruit" },
      { id: "2", label: "Banana", desc: "Another fruit" },
    ];

    HTML_Select_Injection.functionality(
      {
        values: items,
        titles: items,
        valueproperty: "id",
        titleproperty: "label",
        textproperty: undefined,
      },
      select,
    );

    expect(select.options.length).toBe(2);
    expect(select.options[0]!.value).toBe("1");
    expect(select.options[0]!.getAttribute("title")).toBe("Apple");
  });

  it("uses textproperty for display text", () => {
    const select = document.createElement("select");
    document.body.appendChild(select);

    const items = [{ val: "x", display: "Shown X" }];

    HTML_Select_Injection.functionality(
      {
        values: items,
        titles: items,
        valueproperty: "val",
        textproperty: "display",
        titleproperty: undefined,
      },
      select,
    );

    expect(select.options[0]!.textContent).toBe("Shown X");
  });
});
