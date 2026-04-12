import { describe, expect, it, afterEach } from "@jest/globals";

import { HTML_Select_Injection } from "../../src/js/Functionalities/html.select.injection.js";

describe("HTML_Select_Injection.functionality", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("populates a select with string titles and values", () => {
    const select = document.createElement("select");
    document.body.appendChild(select);

    HTML_Select_Injection.functionality(
      {
        titles: ["Title A", "Title B"],
        values: ["val_a", "val_b"],
      } as never,
      select,
    );

    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(2);
    expect(options[0].getAttribute("title")).toBe("Title A");
    expect(options[0].getAttribute("value")).toBe("val_a");
    expect(options[0].textContent).toBe("val_a");
  });

  it("uses values as titles when titles are absent", () => {
    const select = document.createElement("select");
    document.body.appendChild(select);

    HTML_Select_Injection.functionality({ values: ["X", "Y"] } as never, select);

    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(2);
    expect(options[0].getAttribute("title")).toBe("X");
  });

  it("cleans previous content when ReClean is true", () => {
    const select = document.createElement("select");
    select.innerHTML = '<option value="old">Old</option>';
    document.body.appendChild(select);

    HTML_Select_Injection.functionality({ values: ["New"], reclean: "true" } as never, select);

    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(1);
    expect(options[0].getAttribute("value")).toBe("New");
  });

  it("does not clean when ReClean is false", () => {
    const select = document.createElement("select");
    select.innerHTML = '<option value="old">Old</option>';
    document.body.appendChild(select);

    HTML_Select_Injection.functionality({ values: ["New"], reclean: "false" } as never, select);

    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(2);
  });

  it("extracts valueProperty from object values", () => {
    const select = document.createElement("select");
    document.body.appendChild(select);

    HTML_Select_Injection.functionality(
      {
        values: [{ id: "1", label: "One" }],
        valueproperty: "id",
        textproperty: "label",
      } as never,
      select,
    );

    const option = select.querySelector("option");
    expect(option.getAttribute("value")).toBe("1");
    expect(option.textContent).toBe("One");
  });
});
