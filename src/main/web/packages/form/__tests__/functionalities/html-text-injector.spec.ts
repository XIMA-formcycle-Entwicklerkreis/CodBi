import { describe, expect, it, afterEach } from "@jest/globals";

import { HTML_Text_Injector } from "../../src/js/Functionalities/html.text.injector.js";

describe("HTML_Text_Injector.functionality", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("replaces default placeholder with replacement", () => {
    const el = document.createElement("div");
    el.textContent = "Hello [[INJECTOR_REPLACEMENT]] World";
    document.body.appendChild(el);

    HTML_Text_Injector.functionality({ replacement: "CodBi", property: "textContent" }, el);

    expect(el.textContent).toBe("Hello CodBi World");
  });

  it("replaces custom placeholder", () => {
    const el = document.createElement("div");
    el.textContent = "Price: ##VALUE## EUR";
    document.body.appendChild(el);

    HTML_Text_Injector.functionality({ replacement: "42", placeholder: "##VALUE##", property: "textContent" }, el);

    expect(el.textContent).toBe("Price: 42 EUR");
  });

  it("replaces all occurrences of placeholder", () => {
    const el = document.createElement("div");
    el.textContent = "A [[X]] B [[X]] C";
    document.body.appendChild(el);

    HTML_Text_Injector.functionality({ replacement: "Z", placeholder: "[[X]]", property: "textContent" }, el);

    expect(el.textContent).toBe("A Z B Z C");
  });

  it("adds CodBi--TextReady class after processing", () => {
    const el = document.createElement("div");
    el.textContent = "Hello";
    document.body.appendChild(el);

    HTML_Text_Injector.functionality({ replacement: "!", property: "textContent" }, el);

    expect(el.classList.contains("CodBi--TextReady")).toBe(true);
  });

  it("throws when property is not a string type", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    expect(() => HTML_Text_Injector.functionality({ replacement: "x", property: "nonexistent" }, el)).toThrow();
  });
});
