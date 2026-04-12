import { describe, expect, it } from "@jest/globals";

import { formatWaitTime } from "../../src/js/commons/format-wait-time.js";

describe("formatWaitTime", () => {
  it("returns empty string for null", () => {
    expect(formatWaitTime(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatWaitTime(undefined)).toBe("");
  });

  it("returns empty string for 0", () => {
    expect(formatWaitTime(0)).toBe("");
  });

  it("returns empty string for negative values", () => {
    expect(formatWaitTime(-1000)).toBe("");
  });

  it("formats milliseconds under 60s as seconds", () => {
    expect(formatWaitTime(5000)).toBe("(~5s)");
  });

  it("rounds to nearest second", () => {
    expect(formatWaitTime(1500)).toBe("(~2s)");
  });

  it("formats 1 second", () => {
    expect(formatWaitTime(1000)).toBe("(~1s)");
  });

  it("formats exactly 59 seconds", () => {
    expect(formatWaitTime(59000)).toBe("(~59s)");
  });

  it("formats 60 seconds as 1 minute", () => {
    expect(formatWaitTime(60000)).toBe("(~1m)");
  });

  it("formats 90 seconds as 2 minutes (rounded)", () => {
    expect(formatWaitTime(90000)).toBe("(~2m)");
  });

  it("formats 5 minutes", () => {
    expect(formatWaitTime(300000)).toBe("(~5m)");
  });

  it("formats large values", () => {
    expect(formatWaitTime(3600000)).toBe("(~60m)");
  });
});
