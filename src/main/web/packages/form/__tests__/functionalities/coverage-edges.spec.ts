import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { getJQuery } from "@de-xima/fc-form-renderer";
import $ from "jquery";

/**
 * Edge case tests for partially-covered functionalities to push coverage over 80%.
 */

// ── HTML.Input.Regex — keyup and input filter ──
describe("HTML_Input_REGEX edge cases", () => {
  let HTML_Input_REGEX: any;

  beforeEach(async () => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    HTML_Input_REGEX = (await import("../../src/js/Functionalities/html.input.regex.js")).HTML_Input_REGEX;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("keyup prevents propagation on single-char keys", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);
    HTML_Input_REGEX.functionality({ expression: "^\\d+$", flags: "g" }, input);

    const ev = new KeyboardEvent("keyup", { key: "a", cancelable: true, bubbles: true });
    let propagated = false;
    document.body.addEventListener(
      "keyup",
      () => {
        propagated = true;
      },
      { once: true },
    );
    input.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  it("keyup ignores special keys", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);
    HTML_Input_REGEX.functionality({ expression: "^\\d+$", flags: "g" }, input);

    const ev = new KeyboardEvent("keyup", { key: "Shift", cancelable: true });
    input.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });

  it("input event filters invalid characters when keyexpression set", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);
    HTML_Input_REGEX.functionality(
      {
        expression: "^\\d+$",
        keyexpression: "[0-9]",
        flags: "g",
      },
      input,
    );

    input.value = "1a2b3";
    input.dispatchEvent(new InputEvent("input", { cancelable: true }));
    expect(input.value).toBe("123");
  });

  it("input event does nothing when value already clean", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);
    HTML_Input_REGEX.functionality(
      {
        expression: "^\\d+$",
        keyexpression: "[0-9]",
        flags: "g",
      },
      input,
    );

    input.value = "123";
    input.dispatchEvent(new InputEvent("input", { cancelable: true }));
    expect(input.value).toBe("123");
  });

  it("uses custom errorprefix and errorpostfix in error message", () => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = "abc";
    document.body.appendChild(input);
    HTML_Input_REGEX.functionality(
      {
        expression: "^\\d+$",
        flags: "g",
        errorprefix: "Must match: ",
        errorpostfix: "format.",
      },
      input,
    );

    input.dispatchEvent(new Event("change"));
    expect($(input).data("error-msg")).toContain("Must match: ");
    expect($(input).data("error-msg")).toContain("format.");
  });

  it("includes expression in error message when exposeexpression is true", () => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = "abc";
    document.body.appendChild(input);
    HTML_Input_REGEX.functionality(
      {
        expression: "^\\d+$",
        flags: "g",
        exposeexpression: "true",
      },
      input,
    );

    input.dispatchEvent(new Event("change"));
    expect($(input).data("error-msg")).toContain("^\\d+$");
  });
});

// ── HTML.CSS — darkmode and replacements ──
describe("HTML_CSS edge cases", () => {
  let HTML_CSS: any;

  beforeEach(async () => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    HTML_CSS = (await import("../../src/js/Functionalities/html.css.js")).HTML_CSS;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("applies darkmode replacement", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    HTML_CSS.functionality(
      {
        css: ".test { color: red_DM; }",
        darkmode: "red|blue",
      },
      div,
    );

    const styles = document.querySelectorAll("style");
    const injected = Array.from(styles).find((s) => s.innerHTML.includes("blue"));
    expect(injected).not.toBeUndefined();
  });

  it("applies multiple darkmode replacements as array", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    HTML_CSS.functionality(
      {
        css: ".test { color: red_DM; background: green_DM; }",
        darkmode: ["red|blue", "green|yellow"],
      },
      div,
    );

    const styles = document.querySelectorAll("style");
    const injected = Array.from(styles).find((s) => s.innerHTML.includes("blue") && s.innerHTML.includes("yellow"));
    expect(injected).not.toBeUndefined();
  });

  it("applies replacements", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    HTML_CSS.functionality(
      {
        css: ".test { width: MYVAR; }",
        replacements: "MYVAR|100px",
      },
      div,
    );

    const styles = document.querySelectorAll("style");
    const injected = Array.from(styles).find((s) => s.innerHTML.includes("100px"));
    expect(injected).not.toBeUndefined();
  });

  it("handles css as array", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    HTML_CSS.functionality(
      {
        css: [".test { display: block; }"],
      },
      div,
    );

    const styles = document.querySelectorAll("style");
    const injected = Array.from(styles).find((s) => s.innerHTML.includes("display: block"));
    expect(injected).not.toBeUndefined();
  });
});

// ── Time.Frame — onNewMaximum paths ──
describe("Time_Frame edge cases", () => {
  let Time_Frame: any;

  beforeEach(async () => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    Time_Frame = (await import("../../src/js/Functionalities/time.frame.js")).Time_Frame;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  function createTimeFrameDOM() {
    const wrapper = document.createElement("div");
    const innerWrap = document.createElement("div");
    const minInput = document.createElement("input");
    minInput.type = "text";
    minInput.id = "minTime";
    const maxInput = document.createElement("input");
    maxInput.type = "text";
    maxInput.id = "maxTime";
    innerWrap.appendChild(minInput);
    innerWrap.appendChild(maxInput);
    wrapper.appendChild(innerWrap);
    document.body.appendChild(wrapper);
    return { minInput, maxInput };
  }

  it("errors on max when max < min with equalitypermitted=false", () => {
    const { minInput, maxInput } = createTimeFrameDOM();
    minInput.value = "10:00";
    maxInput.value = "09:00";

    Time_Frame.functionality(
      {
        maxfield: "#maxTime",
        equalitypermitted: "false",
      },
      minInput,
    );

    maxInput.dispatchEvent(new Event("input"));
    expect($(maxInput).data("error-msg")).toBeTruthy();
  });

  it("errors on max when max == min with equalitypermitted=false", () => {
    const { minInput, maxInput } = createTimeFrameDOM();
    minInput.value = "10:00";
    maxInput.value = "10:00";

    Time_Frame.functionality(
      {
        maxfield: "#maxTime",
        equalitypermitted: "false",
      },
      minInput,
    );

    maxInput.dispatchEvent(new Event("input"));
    expect($(maxInput).data("error-msg")).toBeTruthy();
  });

  it("clears max error when max > min with equalitypermitted=true", () => {
    const { minInput, maxInput } = createTimeFrameDOM();
    minInput.value = "10:00";
    maxInput.value = "11:00";

    Time_Frame.functionality(
      {
        maxfield: "#maxTime",
        equalitypermitted: "true",
      },
      minInput,
    );

    maxInput.dispatchEvent(new Event("input"));
    expect($(maxInput).data("error-msg")).toBe("");
  });

  it("errors on max when max == min with equalitypermitted=true", () => {
    const { minInput, maxInput } = createTimeFrameDOM();
    minInput.value = "10:00";
    maxInput.value = "10:00";

    Time_Frame.functionality(
      {
        maxfield: "#maxTime",
        equalitypermitted: "true",
      },
      minInput,
    );

    maxInput.dispatchEvent(new Event("input"));
    expect($(maxInput).data("error-msg")).not.toBe("");
  });
});

// ── Date.Frame — equalitypermitted and onNewMaximum ──
describe("Date_Frame edge cases", () => {
  let Date_Frame: any;

  beforeEach(async () => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    Date_Frame = (await import("../../src/js/Functionalities/date.frame.js")).Date_Frame;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  function createDateFrameDOM() {
    const wrapper = document.createElement("div");
    const innerWrap = document.createElement("div");
    const minInput = document.createElement("input");
    minInput.type = "text";
    minInput.id = "minDate";
    const maxInput = document.createElement("input");
    maxInput.type = "text";
    maxInput.id = "maxDate";
    innerWrap.appendChild(minInput);
    innerWrap.appendChild(maxInput);
    wrapper.appendChild(innerWrap);
    document.body.appendChild(wrapper);
    return { minInput, maxInput };
  }

  it("errors on min when min > max with equalitypermitted=false", () => {
    const { minInput, maxInput } = createDateFrameDOM();
    minInput.value = "20.06.2025";
    maxInput.value = "10.06.2025";

    Date_Frame.functionality(
      {
        maxfield: "#maxDate",
        equalitypermitted: "false",
      },
      minInput,
    );

    minInput.dispatchEvent(new Event("input"));
    expect($(minInput).data("error-msg")).toBeTruthy();
  });

  it("clears error when min < max with equalitypermitted=false", () => {
    const { minInput, maxInput } = createDateFrameDOM();
    minInput.value = "01.06.2025";
    maxInput.value = "20.06.2025";

    Date_Frame.functionality(
      {
        maxfield: "#maxDate",
        equalitypermitted: "false",
      },
      minInput,
    );

    minInput.dispatchEvent(new Event("input"));
    expect($(minInput).data("error-msg")).toBe("");
  });

  it("errors on min when min >= max with equalitypermitted=true", () => {
    const { minInput, maxInput } = createDateFrameDOM();
    minInput.value = "10.06.2025";
    maxInput.value = "10.06.2025";

    Date_Frame.functionality(
      {
        maxfield: "#maxDate",
        equalitypermitted: "true",
      },
      minInput,
    );

    minInput.dispatchEvent(new Event("input"));
    expect($(minInput).data("error-msg")).toBeTruthy();
  });

  it("errors on max when min > max via max input, equalitypermitted=true", () => {
    const { minInput, maxInput } = createDateFrameDOM();
    minInput.value = "20.06.2025";
    maxInput.value = "10.06.2025";

    Date_Frame.functionality(
      {
        maxfield: "#maxDate",
        equalitypermitted: "true",
      },
      minInput,
    );

    maxInput.dispatchEvent(new Event("input"));
    expect($(maxInput).data("error-msg")).toBeTruthy();
  });

  it("clears max error when max > min via max input, equalitypermitted=false", () => {
    const { minInput, maxInput } = createDateFrameDOM();
    minInput.value = "01.06.2025";
    maxInput.value = "20.06.2025";

    Date_Frame.functionality(
      {
        maxfield: "#maxDate",
        equalitypermitted: "false",
      },
      minInput,
    );

    maxInput.dispatchEvent(new Event("input"));
    expect($(maxInput).data("error-msg")).toBe("");
  });

  it("errors on max when max < min via max input, equalitypermitted=false", () => {
    const { minInput, maxInput } = createDateFrameDOM();
    minInput.value = "20.06.2025";
    maxInput.value = "10.06.2025";

    Date_Frame.functionality(
      {
        maxfield: "#maxDate",
        equalitypermitted: "false",
      },
      minInput,
    );

    maxInput.dispatchEvent(new Event("input"));
    expect($(maxInput).data("error-msg")).toBeTruthy();
  });
});

// ── Date.Min — reverse and unit variations ──
describe("Date_Min edge cases", () => {
  let Date_Min: any;

  beforeEach(async () => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    Date_Min = (await import("../../src/js/Functionalities/date.min.js")).Date_Min;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  function createMinDOM() {
    const wrapper = document.createElement("div");
    const innerWrap = document.createElement("div");
    const input = document.createElement("input");
    input.type = "text";
    innerWrap.appendChild(input);
    wrapper.appendChild(innerWrap);
    document.body.appendChild(wrapper);
    return input;
  }

  it("reverse=true with unit=d rejects past date", () => {
    const input = createMinDOM();
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const dd = String(pastDate.getDate()).padStart(2, "0");
    const mm = String(pastDate.getMonth() + 1).padStart(2, "0");
    const yyyy = pastDate.getFullYear();
    input.value = `${dd}.${mm}.${yyyy}`;

    Date_Min.functionality(
      {
        minimum: "5",
        unit: "d",
        reverse: "true",
      },
      input,
    );

    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect($(input).data("error-msg")).toBeTruthy();
  });

  it("reverse=true with unit=w allows future date", () => {
    const input = createMinDOM();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);
    const dd = String(futureDate.getDate()).padStart(2, "0");
    const mm = String(futureDate.getMonth() + 1).padStart(2, "0");
    const yyyy = futureDate.getFullYear();
    input.value = `${dd}.${mm}.${yyyy}`;

    Date_Min.functionality(
      {
        minimum: "2",
        unit: "w",
        reverse: "true",
      },
      input,
    );

    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect($(input).data("error-msg")).toBe("");
  });

  it("reverse=true with unit=m rejects too-early date", () => {
    const input = createMinDOM();
    const earlyDate = new Date();
    earlyDate.setDate(earlyDate.getDate() - 5);
    const dd = String(earlyDate.getDate()).padStart(2, "0");
    const mm = String(earlyDate.getMonth() + 1).padStart(2, "0");
    const yyyy = earlyDate.getFullYear();
    input.value = `${dd}.${mm}.${yyyy}`;

    Date_Min.functionality(
      {
        minimum: "3",
        unit: "m",
        reverse: "true",
      },
      input,
    );

    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect($(input).data("error-msg")).toBeTruthy();
  });

  it("reverse=false default unit=y rejects future date", () => {
    const input = createMinDOM();
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 10);
    const dd = String(futureDate.getDate()).padStart(2, "0");
    const mm = String(futureDate.getMonth() + 1).padStart(2, "0");
    const yyyy = futureDate.getFullYear();
    input.value = `${dd}.${mm}.${yyyy}`;

    Date_Min.functionality(
      {
        minimum: "18",
      },
      input,
    );

    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect($(input).data("error-msg")).toBeTruthy();
  });

  it("uses custom msghigher message for reverse=true", () => {
    const input = createMinDOM();
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 100);
    const dd = String(pastDate.getDate()).padStart(2, "0");
    const mm = String(pastDate.getMonth() + 1).padStart(2, "0");
    const yyyy = pastDate.getFullYear();
    input.value = `${dd}.${mm}.${yyyy}`;

    Date_Min.functionality(
      {
        minimum: "5",
        unit: "d",
        reverse: "true",
        msghigher: "Date must be after [%ERROR_DATE%]!",
      },
      input,
    );

    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect($(input).data("error-msg")).toContain("Date must be after");
  });
});

// ── HTML.Input.Blacklist — error branches ──
describe("HTML_Input_Blacklist edge cases", () => {
  let HTML_Input_Blacklist: any;

  beforeEach(async () => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    HTML_Input_Blacklist = (await import("../../src/js/Functionalities/html.input.blacklist.js")).HTML_Input_Blacklist;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("errors on change when value matches a list entry", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);
    HTML_Input_Blacklist.functionality(
      {
        list: "abc,def,ghi",
      },
      input,
    );

    input.value = "abc";
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect($(input).data("error-msg")).toBeTruthy();
  });

  it("allows values not in list", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);
    HTML_Input_Blacklist.functionality(
      {
        list: "abc,def",
      },
      input,
    );

    input.value = "xyz";
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect($(input).data("error-msg")).toBe("");
  });

  it("errors on input when value matches a list entry", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);
    HTML_Input_Blacklist.functionality(
      {
        list: "hello,world",
      },
      input,
    );

    input.value = "hello";
    input.dispatchEvent(new Event("input"));
    expect($(input).data("error-msg")).toBeTruthy();
  });

  it("shows custom prefix and postfix in error message on change", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);
    HTML_Input_Blacklist.functionality(
      {
        list: "forbidden",
        prefix: "Not allowed: ",
        postfix: "!",
        showblacklist: "true",
      },
      input,
    );

    input.value = "forbidden";
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect($(input).data("error-msg")).toContain("Not allowed: ");
  });

  it("clears error when value not in list", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);
    HTML_Input_Blacklist.functionality(
      {
        list: "xyz",
      },
      input,
    );

    input.value = "hello";
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect($(input).data("error-msg")).toBe("");
  });
});
