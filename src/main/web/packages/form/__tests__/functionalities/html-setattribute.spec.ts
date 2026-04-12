import { describe, expect, it, afterEach } from "@jest/globals";

import { HTML_SETAttribute } from "../../src/js/Functionalities/html.setattribute.js";

describe("HTML_SETAttribute.functionality", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("sets an attribute on the target element", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    HTML_SETAttribute.functionality({ name: "title", toset: "Hello" }, el);

    expect(el.getAttribute("title")).toBe("Hello");
  });

  it("sets a data attribute", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    HTML_SETAttribute.functionality({ name: "data-custom", toset: "value" }, el);

    expect(el.getAttribute("data-custom")).toBe("value");
  });

  it("overwrites existing attributes", () => {
    const el = document.createElement("div");
    el.setAttribute("title", "original");
    document.body.appendChild(el);

    HTML_SETAttribute.functionality({ name: "title", toset: "updated" }, el);

    expect(el.getAttribute("title")).toBe("updated");
  });

  it("sets aria attributes", () => {
    const el = document.createElement("button");
    document.body.appendChild(el);

    HTML_SETAttribute.functionality({ name: "aria-label", toset: "Submit form" }, el);

    expect(el.getAttribute("aria-label")).toBe("Submit form");
  });

  it("sets role attribute", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    HTML_SETAttribute.functionality({ name: "role", toset: "alert" }, el);

    expect(el.getAttribute("role")).toBe("alert");
  });
});
