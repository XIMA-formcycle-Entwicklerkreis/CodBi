// Tests for code-library.ts

import { afterEach, describe, expect, jest, it } from "@jest/globals";
import { getXUtil } from "@de-xima/fc-form-renderer";

import { onDocumentReady } from "../src/js/code-library.js";

import { resetTestState } from "./test-state.js";

// The code in code-library is for demonstration purposes only
// This illustrates how to write tests with jsdom and jest

afterEach(() => resetTestState());

describe("onDocumentReady", () => {
  it("logs the number of form items when called", () => {
    const item1 = document.createElement("div");
    const item2 = document.createElement("div");
    item1.classList.add("XItem");
    item2.classList.add("XItem");
    document.body.appendChild(item1);
    document.body.appendChild(item2);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    onDocumentReady();
    expect(spy).toHaveBeenCalledWith("Form contains 2 items");
  });

  it("registers a listener for the submit event that logs a message upon submission", () => {
    const form = document.createElement("form");
    form.id = "test-form";

    onDocumentReady();

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    getXUtil().trigger("submit", [{ form, submissionBlocked: true }]);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, "Form about to be submitted has ID test-form");
    expect(spy).toHaveBeenNthCalledWith(2, "Submission is blocked: true");
  });
});
