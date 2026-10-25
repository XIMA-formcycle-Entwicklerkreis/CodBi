// Tests for the CSS-class writer's deferred notifiers and the element-preview suspension that the
// "activate this standard configuration?" dialog uses while it is open.

import { afterEach, describe, expect, it, jest } from "@jest/globals";

import {
  flushElementCssClassChange,
  refreshCodbiElementMarkers,
  resumeElementPreviews,
  setElementCssClass,
  suspendElementPreviews,
} from "../src/js/CodbiElementMarkers.js";

import { resetTestState, TestState } from "./test-state.js";

/** Minimal item with a persisted property bag (the shape `setElementCssClass` writes into). */
function fakeItem(properties: Record<string, unknown>): unknown {
  return {
    getId: () => "xi-1",
    getPersist: () => ({ properties }),
  };
}

afterEach(() => {
  resetTestState();
  // Never leave a suspension behind for the next test.
  for (let i = 0; i < 5; i++) {
    resumeElementPreviews();
  }
});

describe("CodbiElementMarkers CSS-class writer", () => {
  it("writes the class and nudges the persist differ immediately by default", () => {
    const checkForChanges = jest.fn();
    TestState.designerInstance = { getPersistDiffer: () => ({ checkForChanges }) };
    const properties: Record<string, unknown> = { cssclasses: ["Keep"] };

    expect(setElementCssClass(fakeItem(properties) as never, "CodBi_NoFutureDate", true)).toBe(true);
    expect(properties.cssclasses).toEqual(["Keep", "CodBi_NoFutureDate"]);
    expect(checkForChanges).toHaveBeenCalledTimes(1);
  });

  it("postpones the persist-differ nudge until the flush when `deferNotify` is set", () => {
    const checkForChanges = jest.fn();
    TestState.designerInstance = { getPersistDiffer: () => ({ checkForChanges }) };
    const properties: Record<string, unknown> = { cssclasses: [] };

    // While the activation question is open NOTHING may be synced (which would make the designer
    // re-render the element cell and rebuild the preview under the modal) …
    setElementCssClass(fakeItem(properties) as never, "CodBi_NoFutureDate", true, { deferNotify: true });
    expect(properties.cssclasses).toEqual(["CodBi_NoFutureDate"]);
    expect(checkForChanges).not.toHaveBeenCalled();

    // … but the change still reaches the server as soon as the question is answered.
    flushElementCssClassChange();
    expect(checkForChanges).toHaveBeenCalledTimes(1);
  });

  it("only nudges the persist differ when the question is dismissed (no preview refresh)", () => {
    const checkForChanges = jest.fn();
    TestState.designerInstance = { getPersistDiffer: () => ({ checkForChanges }) };
    const properties: Record<string, unknown> = { cssclasses: [] };

    setElementCssClass(fakeItem(properties) as never, "CodBi_NoFutureDate", true, { deferNotify: true });
    // "Später": the class is still saved, but nothing is re-rendered/re-actualised.
    flushElementCssClassChange({ refreshPreview: false });

    expect(properties.cssclasses).toEqual(["CodBi_NoFutureDate"]);
    expect(checkForChanges).toHaveBeenCalledTimes(1);
  });
});

describe("element preview suspension", () => {
  it("is released exactly when the last suspension ends", () => {
    // Nested suspensions must not throw and must not leave the module frozen.
    suspendElementPreviews();
    suspendElementPreviews();
    resumeElementPreviews();
    resumeElementPreviews();

    expect(() => refreshCodbiElementMarkers()).not.toThrow();
  });

  it("tolerates an unbalanced resume", () => {
    expect(() => resumeElementPreviews()).not.toThrow();
    expect(() => refreshCodbiElementMarkers()).not.toThrow();
  });

  it("can be released WITHOUT re-applying the previews (dismissed question)", () => {
    suspendElementPreviews();
    expect(() => resumeElementPreviews(false)).not.toThrow();
    // Released, so a later change refreshes normally again.
    expect(() => refreshCodbiElementMarkers()).not.toThrow();
  });
});
