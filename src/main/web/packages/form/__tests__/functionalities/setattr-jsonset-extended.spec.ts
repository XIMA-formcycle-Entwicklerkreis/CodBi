import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

describe("HTML.SETAttribute — extended", () => {
  let HTML_SETAttribute: any;

  beforeEach(async () => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    const mod = await import("../../src/js/Functionalities/html.setattribute.js");
    HTML_SETAttribute = mod.HTML_SETAttribute;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("sets a data attribute on an element", () => {
    const el = document.createElement("div");
    HTML_SETAttribute.functionality({ name: "data-custom", toset: "hello" }, el);
    expect(el.getAttribute("data-custom")).toBe("hello");
  });

  it("sets a class attribute on an element", () => {
    const el = document.createElement("div");
    HTML_SETAttribute.functionality({ name: "class", toset: "my-class" }, el);
    expect(el.getAttribute("class")).toBe("my-class");
  });

  it("overwrites existing attribute", () => {
    const el = document.createElement("div");
    el.setAttribute("data-x", "old");
    HTML_SETAttribute.functionality({ name: "data-x", toset: "new" }, el);
    expect(el.getAttribute("data-x")).toBe("new");
  });

  it("sets aria attribute", () => {
    const el = document.createElement("div");
    HTML_SETAttribute.functionality({ name: "aria-label", toset: "My Label" }, el);
    expect(el.getAttribute("aria-label")).toBe("My Label");
  });
});

describe("JSON.SET — extended", () => {
  let JSON_SET: any;

  beforeEach(async () => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    const mod = await import("../../src/js/Functionalities/json.set.js");
    JSON_SET = mod.JSON_SET;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("sets a property on a nested object", () => {
    const el = document.createElement("div") as any;
    el.custom = { value: "old" };
    JSON_SET.functionality({ path: "custom", property: "value", toset: "new" }, el);
    expect(el.custom.value).toBe("new");
  });

  it("sets a nested property via dot path", () => {
    const el = document.createElement("div") as any;
    el.style.color = "red";
    JSON_SET.functionality({ path: "style", property: "color", toset: "blue" }, el);
    expect(el.style.color).toBe("blue");
  });

  it("sets dataset property", () => {
    const el = document.createElement("div") as any;
    JSON_SET.functionality({ path: "dataset", property: "info", toset: "test" }, el);
    expect(el.dataset.info).toBe("test");
  });
});
