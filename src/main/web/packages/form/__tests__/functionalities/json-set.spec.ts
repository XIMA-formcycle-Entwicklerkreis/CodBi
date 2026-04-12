import { describe, expect, it } from "@jest/globals";

import { JSON_SET } from "../../src/js/Functionalities/json.set.js";

describe("JSON_SET.functionality", () => {
  it("sets a direct property on the element", () => {
    const el = document.createElement("div");

    JSON_SET.functionality({ path: "style", property: "display", toset: "none" }, el);

    expect(el.style.display).toBe("none");
  });

  it("sets a nested property via dotted path", () => {
    const el = document.createElement("div") as unknown as {
      customData: { nested: { value: string } };
    } & HTMLDivElement;
    el.customData = { nested: { value: "" } };

    JSON_SET.functionality({ path: "customData.nested", property: "value", toset: "hello" }, el);

    expect(el.customData.nested.value).toBe("hello");
  });

  it("sets property on style sub-object via path", () => {
    const el = document.createElement("div");

    JSON_SET.functionality({ path: "style", property: "color", toset: "red" }, el);

    expect(el.style.color).toBe("red");
  });

  it("overwrites existing property values", () => {
    const el = document.createElement("div") as unknown as {
      myObj: { val: string };
    } & HTMLDivElement;
    el.myObj = { val: "old" };

    JSON_SET.functionality({ path: "myObj", property: "val", toset: "new" }, el);

    expect(el.myObj.val).toBe("new");
  });
});
