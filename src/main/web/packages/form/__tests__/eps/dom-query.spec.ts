import { describe, expect, it, afterEach } from "@jest/globals";

import { DOM_Query } from "../../src/js/EPs/dom.query.js";

describe("DOM_Query.retrieve", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("queries an element by CSS selector", () => {
    const div = document.createElement("div");
    div.id = "test-el";
    document.body.appendChild(div);

    const result = DOM_Query.retrieve(["#test-el"]);
    expect(result).toBe(div);
  });

  it("queries by class name", () => {
    const span = document.createElement("span");
    span.className = "target-class";
    document.body.appendChild(span);

    const result = DOM_Query.retrieve([".target-class"]);
    expect(result).toBe(span);
  });

  it("returns null when element is not found", () => {
    const result = DOM_Query.retrieve(["#does-not-exist"]);
    expect(result).toBeNull();
  });

  it("queries by data attribute", () => {
    const el = document.createElement("div");
    el.setAttribute("data-testid", "my-element");
    document.body.appendChild(el);

    const result = DOM_Query.retrieve(['[data-testid="my-element"]']);
    expect(result).toBe(el);
  });

  it("returns the first matching element", () => {
    const first = document.createElement("p");
    first.className = "duplicate";
    const second = document.createElement("p");
    second.className = "duplicate";
    document.body.appendChild(first);
    document.body.appendChild(second);

    const result = DOM_Query.retrieve([".duplicate"]);
    expect(result).toBe(first);
  });
});
