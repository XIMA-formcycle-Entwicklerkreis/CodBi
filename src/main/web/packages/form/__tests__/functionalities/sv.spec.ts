import { describe, expect, it, afterEach } from "@jest/globals";

import { SV } from "../../src/js/Functionalities/sv.js";

const setSearch = (search: string): void => {
  window.history.replaceState({}, "", search);
};

describe("SV.functionality", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    // Reset the location so tests don't leak query parameters into each other.
    window.history.replaceState({}, "", window.location.pathname);
  });

  it("sets a single destination from a single source URL-parameter", () => {
    setSearch("?name=John");
    const target = document.createElement("input");
    target.setAttribute("data-name", "destName");
    document.body.appendChild(target);

    SV.functionality({ destinations: "destName", sources: "name" }, target);

    expect(target.value).toBe("John");
  });

  it("pairs arrays of destinations and sources by index", () => {
    setSearch("?first=Alice&second=Bob");
    const a = document.createElement("input");
    a.setAttribute("data-name", "destA");
    document.body.appendChild(a);
    const b = document.createElement("input");
    b.setAttribute("data-name", "destB");
    document.body.appendChild(b);

    SV.functionality({ destinations: ["destA", "destB"], sources: ["first", "second"] }, document.body);

    expect(a.value).toBe("Alice");
    expect(b.value).toBe("Bob");
  });

  it("throws when destinations and sources have different lengths", () => {
    setSearch("?first=Alice");

    expect(() => {
      SV.functionality({ destinations: ["destA", "destB"], sources: ["first"] }, document.body);
    }).toThrow(/same amount of entries/);
  });

  it("updates a form control and dispatches input/change events", () => {
    setSearch("?name=John");
    const target = document.createElement("input");
    target.setAttribute("data-name", "destName");
    document.body.appendChild(target);
    const inputSpy = jest.fn();
    const changeSpy = jest.fn();
    target.addEventListener("input", inputSpy);
    target.addEventListener("change", changeSpy);

    SV.functionality({ destinations: "destName", sources: "name" }, target);

    expect(target.getAttribute("value")).toBe("John");
    expect(inputSpy).toHaveBeenCalled();
    expect(changeSpy).toHaveBeenCalled();
  });

  it("sets the value attribute on non-form-control elements", () => {
    setSearch("?name=John");
    const target = document.createElement("div");
    target.setAttribute("data-name", "destName");
    document.body.appendChild(target);

    SV.functionality({ destinations: "destName", sources: "name" }, target);

    expect(target.getAttribute("value")).toBe("John");
  });

  it("does not create an element when the destination variable is not declared", () => {
    setSearch("?name=John");
    const logSpy = jest.spyOn(window.codbi, "log");
    expect(document.querySelector('[data-name="newDest"]')).toBeNull();

    SV.functionality({ destinations: "newDest", sources: "name" }, document.body);

    // No element may be created: Formcycle only forwards declared global variables to the
    // workflow, so inventing a DOM input would never be recognized.
    expect(document.querySelector('[data-name="newDest"]')).toBeNull();
    expect(logSpy.mock.calls.some(([level, message]) => level === "ERROR" && String(message).includes("newDest"))).toBe(
      true,
    );
  });

  it("logs an ERROR and leaves the V EP read path empty for an undeclared variable", () => {
    setSearch("?name=John");
    const logSpy = jest.spyOn(window.codbi, "log");

    SV.functionality({ destinations: "brandNew", sources: "name" }, document.body);

    // The V EP read path (data-name lookup) must stay empty because nothing was created.
    const read = document.querySelector('[data-name="brandNew"]')?.getAttribute("value");
    expect(read).toBeUndefined();
    expect(logSpy.mock.calls.some(([level]) => level === "ERROR")).toBe(true);
  });

  it("logs an explicit ERROR naming the source and destination for an undeclared variable", () => {
    setSearch("?name=John");
    const logSpy = jest.spyOn(window.codbi, "log");

    SV.functionality({ destinations: "jjjj", sources: "name" }, document.body);

    expect(document.querySelector('[data-name="jjjj"]')).toBeNull();
    expect(
      logSpy.mock.calls.some(
        ([level, message]) => level === "ERROR" && String(message).includes("jjjj") && String(message).includes("name"),
      ),
    ).toBe(true);
  });

  it("does not create anything inside the form when the variable is not declared", () => {
    setSearch("?name=John");
    const form = document.createElement("form");
    form.className = "xm-form";
    const page = document.createElement("div");
    form.appendChild(page);
    document.body.appendChild(form);
    const logSpy = jest.spyOn(window.codbi, "log");

    SV.functionality({ destinations: "inFormVar", sources: "name" }, page);

    expect(form.querySelector('[data-name="inFormVar"]')).toBeNull();
    expect(document.querySelector('[data-name="inFormVar"]')).toBeNull();
    expect(logSpy.mock.calls.some(([level]) => level === "ERROR")).toBe(true);
  });

  it("warns per destination without creating elements for multiple undeclared variables", () => {
    setSearch("?first=Alice&second=Bob");
    const logSpy = jest.spyOn(window.codbi, "log");

    SV.functionality({ destinations: ["vOne", "vTwo"], sources: ["first", "second"] }, document.body);

    expect(document.querySelector('[data-name="vOne"]')).toBeNull();
    expect(document.querySelector('[data-name="vTwo"]')).toBeNull();
    expect(logSpy.mock.calls.filter(([level]) => level === "ERROR").length).toBe(2);
  });

  it("sets an empty string when the source URL-parameter is absent", () => {
    setSearch("?other=1");
    const target = document.createElement("input");
    target.setAttribute("data-name", "destName");
    document.body.appendChild(target);

    SV.functionality({ destinations: "destName", sources: "name" }, target);

    expect(target.value).toBe("");
  });

  it("normalizes single-string parameters and matches the V EP read path", () => {
    setSearch("?name=John");
    const target = document.createElement("input");
    target.setAttribute("data-name", "destName");
    document.body.appendChild(target);

    SV.functionality({ destinations: "destName", sources: "name" }, target);

    // The value is readable back through the same data-name lookup used by the V EP.
    expect(document.querySelector('[data-name="destName"]')?.getAttribute("value")).toBe("John");
  });
});
