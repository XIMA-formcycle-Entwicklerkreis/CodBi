import { describe, expect, it, afterEach } from "@jest/globals";

import { URLParameter } from "../../src/js/EPs/urlparameter.js";

const setSearch = (search: string): void => {
  window.history.replaceState({}, "", search);
};

describe("URLParameter.retrieve", () => {
  afterEach(() => {
    // Reset the location so tests don't leak query parameters into each other.
    window.history.replaceState({}, "", window.location.pathname);
  });

  it("returns the value of the requested URL-parameter", () => {
    setSearch("?name=John&city=Berlin");

    expect(URLParameter.retrieve(["name"])).toBe("John");
    expect(URLParameter.retrieve(["city"])).toBe("Berlin");
  });

  it("returns an empty string when the URL-parameter is not present", () => {
    setSearch("?other=1");

    expect(URLParameter.retrieve(["missing"])).toBe("");
  });

  it("returns an empty string when the URL has no query string", () => {
    setSearch("");

    expect(URLParameter.retrieve(["name"])).toBe("");
  });

  it("trims whitespace around the parameter name", () => {
    setSearch("?token=abc123");

    expect(URLParameter.retrieve(["  token  "])).toBe("abc123");
  });

  it("decodes URL-encoded parameter values", () => {
    setSearch("?q=hello%20world");

    expect(URLParameter.retrieve(["q"])).toBe("hello world");
  });
});
