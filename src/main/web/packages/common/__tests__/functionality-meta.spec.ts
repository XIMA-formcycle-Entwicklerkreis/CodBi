import { describe, expect, it } from "@jest/globals";
import {
  formElementMatchesRequirements,
  normalizeSupportedFormelementtype,
  supportedFormelementtypeOf,
  SupportedFormelementtype,
} from "../src/index";

/** Applies the decorator without decorator syntax (independent of the package's decorator config). */
function decorate(
  spec: Parameters<typeof SupportedFormelementtype>[0],
): (toLoad: unknown, toProcess: Element) => unknown {
  const fn = (_toLoad: unknown, _toProcess: Element): unknown => undefined;
  SupportedFormelementtype(spec)({}, "functionality", { value: fn });
  return fn;
}

describe("SupportedFormelementtype decorator", () => {
  it("stores the spec on the decorated function", () => {
    const fn = decorate({ XTextField: { datatype: "dateDE" } });
    expect(supportedFormelementtypeOf(fn)).toEqual({ XTextField: { datatype: "dateDE" } });
  });

  it("returns undefined for undecorated / non-function targets", () => {
    expect(supportedFormelementtypeOf(undefined)).toBeUndefined();
    expect(supportedFormelementtypeOf({})).toBeUndefined();
    expect(supportedFormelementtypeOf((): void => undefined)).toBeUndefined();
  });
});

describe("normalizeSupportedFormelementtype", () => {
  it("accepts a single class name", () => {
    expect(normalizeSupportedFormelementtype("XTextField")).toEqual({
      formElements: ["XTextField"],
      requirements: [{ type: "XTextField" }],
    });
  });

  it("accepts a list (deduplicated)", () => {
    expect(normalizeSupportedFormelementtype(["XFieldSet", "XContainer", "XFieldSet"])).toEqual({
      formElements: ["XFieldSet", "XContainer"],
      requirements: [{ type: "XFieldSet" }, { type: "XContainer" }],
    });
  });

  it("normalizes a map with constraints (trimmed, lower-cased, deduped)", () => {
    expect(normalizeSupportedFormelementtype({ XTextField: { datatype: ["dateDE", "DATEde", " "] } })).toEqual({
      formElements: ["XTextField"],
      requirements: [{ type: "XTextField", properties: { datatype: ["datede"] } }],
    });
  });

  it("treats an undefined constraint map as type-only", () => {
    expect(normalizeSupportedFormelementtype({ XTextArea: undefined })).toEqual({
      formElements: ["XTextArea"],
      requirements: [{ type: "XTextArea" }],
    });
  });

  it("yields an empty result for undefined", () => {
    expect(normalizeSupportedFormelementtype(undefined)).toEqual({ formElements: [], requirements: [] });
  });
});

describe("formElementMatchesRequirements", () => {
  const requirements = normalizeSupportedFormelementtype({
    XTextField: { datatype: "dateDE" },
    XTextArea: undefined,
  }).requirements;

  it("is fail-open for an empty/absent list", () => {
    expect(formElementMatchesRequirements([], "XSelect", {})).toBe(true);
    expect(formElementMatchesRequirements(undefined, "XSelect", {})).toBe(true);
  });

  it("matches the type only when the requirement has no constraints", () => {
    expect(formElementMatchesRequirements(requirements, "XTextArea", {})).toBe(true);
    expect(formElementMatchesRequirements(requirements, "XSelect", {})).toBe(false);
  });

  it("matches property constraints case-insensitively", () => {
    expect(formElementMatchesRequirements(requirements, "XTextField", { datatype: "dateDE" })).toBe(true);
    expect(formElementMatchesRequirements(requirements, "XTextField", { datatype: "DATede" })).toBe(true);
    expect(formElementMatchesRequirements(requirements, "XTextField", { datatype: "text" })).toBe(false);
    expect(formElementMatchesRequirements(requirements, "XTextField", {})).toBe(false);
  });

  it("supports OR-arrays and the '*' (must-be-present) wildcard", () => {
    const or = normalizeSupportedFormelementtype({ XTextField: { datatype: ["money", "plzDE"] } }).requirements;

    expect(formElementMatchesRequirements(or, "XTextField", { datatype: "plzDE" })).toBe(true);
    expect(formElementMatchesRequirements(or, "XTextField", { datatype: "email" })).toBe(false);

    const star = normalizeSupportedFormelementtype({ XTextField: { datatype: "*" } }).requirements;

    expect(formElementMatchesRequirements(star, "XTextField", { datatype: "dateDE" })).toBe(true);
    expect(formElementMatchesRequirements(star, "XTextField", { datatype: "" })).toBe(false);
  });

  it("treats a value containing '*' as a case-insensitive glob", () => {
    const glob = normalizeSupportedFormelementtype({ XTextField: { datatype: "date*" } }).requirements;

    expect(formElementMatchesRequirements(glob, "XTextField", { datatype: "dateDE" })).toBe(true);
    expect(formElementMatchesRequirements(glob, "XTextField", { datatype: "DATEus" })).toBe(true);
    expect(formElementMatchesRequirements(glob, "XTextField", { datatype: "text" })).toBe(false);
    expect(formElementMatchesRequirements(glob, "XTextField", {})).toBe(false);

    // An OR-list may mix exact values and globs.
    const mixed = normalizeSupportedFormelementtype({ XTextField: { datatype: ["time", "date*"] } }).requirements;

    expect(formElementMatchesRequirements(mixed, "XTextField", { datatype: "time" })).toBe(true);
    expect(formElementMatchesRequirements(mixed, "XTextField", { datatype: "dateDE" })).toBe(true);
    expect(formElementMatchesRequirements(mixed, "XTextField", { datatype: "money" })).toBe(false);
  });

  it("ANDs multiple property constraints", () => {
    const both = normalizeSupportedFormelementtype({ XTextField: { datatype: "dateDE", readonly: "0" } }).requirements;

    expect(formElementMatchesRequirements(both, "XTextField", { datatype: "dateDE", readonly: "0" })).toBe(true);
    expect(formElementMatchesRequirements(both, "XTextField", { datatype: "dateDE", readonly: "1" })).toBe(false);
  });

  it("supports the '*' (any widget class) type, optionally with property constraints", () => {
    const anyType = normalizeSupportedFormelementtype("*").requirements;

    expect(formElementMatchesRequirements(anyType, "XSelect", {})).toBe(true);
    expect(formElementMatchesRequirements(anyType, "XTextField", {})).toBe(true);

    const anyWithProp = normalizeSupportedFormelementtype({ "*": { datatype: "dateDE" } }).requirements;

    expect(formElementMatchesRequirements(anyWithProp, "XTextField", { datatype: "dateDE" })).toBe(true);
    expect(formElementMatchesRequirements(anyWithProp, "XSelect", { datatype: "dateDE" })).toBe(true);
    expect(formElementMatchesRequirements(anyWithProp, "XTextField", { datatype: "text" })).toBe(false);
  });
});
