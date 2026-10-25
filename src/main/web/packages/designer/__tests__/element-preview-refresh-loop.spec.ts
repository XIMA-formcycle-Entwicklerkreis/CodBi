// Regression test for the refresh STORM: a refresh pass touches the canvas (badges, preview switches,
// height pins), the canvas `MutationObserver` reports that as a mutation and a `MutationObserver`
// callback is a MICROTASK — so it runs after `refreshBadges` reset its `refreshing` guard and queues
// the next pass. Every pass therefore queued another one, dozens of times per interaction, and the
// repeated re-fitting of the preview iframes is what broke the designer layout after a few toggles.

import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { refreshCodbiElementMarkers } from "../src/js/CodbiElementMarkers.js";

import { resetTestState, TestState } from "./test-state.js";

/**
 * Builds a designer item whose content cell is a real DOM node in this document, so a refresh pass
 * really mutates the observed canvas root.
 *
 * @param cell - The content cell of the element on the canvas.
 * @returns The fake item.
 */
function fakeItem(cell: HTMLElement): unknown {
  return {
    getId: () => "xi-1",
    getPersist: () => ({
      properties: {
        attributes: [{ text: "data-cb-func", value: "Date.Min" }],
      },
    }),
    getItemContentCell: () => [cell],
  };
}

/**
 * Builds a designer instance with the marker mode ON, so a refresh pass really RENDERS a badge (and
 * therefore really mutates the observed canvas root — the situation the storm grew from).
 *
 * @param cell - The content cell of the element on the canvas.
 * @returns The fake designer instance.
 */
function designerWith(cell: HTMLElement): unknown {
  return {
    items: { "xi-1": fakeItem(cell) },
    getFormPropertyValueForCurrentLang: () => "1",
  };
}

/**
 * Counts the emitted `refresh pass` diagnostics.
 *
 * @param info - The console.info spy.
 * @returns The number of recorded refresh passes.
 */
function refreshPasses(info: { mock: { calls: unknown[][] } }): number {
  return info.mock.calls.filter((call) => String(call[0] ?? "").includes("refresh pass")).length;
}

afterEach(() => {
  resetTestState();
  jest.useRealTimers();
  document.body.innerHTML = "";
});

describe("refreshBadges self-triggering", () => {
  it("does not queue another pass from the mutations of its own pass", async () => {
    jest.useFakeTimers();
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined);

    const cell = document.createElement("div");
    document.body.appendChild(cell);
    TestState.designerInstance = designerWith(cell);

    refreshCodbiElementMarkers();

    // Run the pass (it renders the badge into the observed root = a canvas mutation) …
    jest.advanceTimersByTime(100);
    // … let the MutationObserver microtask deliver …
    await Promise.resolve();
    await Promise.resolve();
    // … and give a self-triggered pass all the time in the world to fire.
    jest.advanceTimersByTime(1000);

    expect(refreshPasses(info)).toBe(1);
  });

  it("still refreshes when a designer re-render takes a badge down", async () => {
    jest.useFakeTimers();
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined);

    const cell = document.createElement("div");
    document.body.appendChild(cell);
    TestState.designerInstance = designerWith(cell);

    refreshCodbiElementMarkers();
    jest.advanceTimersByTime(100);
    await Promise.resolve();
    await Promise.resolve();

    // The designer re-renders the cell, which DETACHES the badge we injected into it.
    cell.replaceChildren(document.createElement("span"));
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(100);

    expect(refreshPasses(info)).toBe(2);
  });

  it("ignores designer churn that leaves our widgets alone", async () => {
    jest.useFakeTimers();
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined);

    const cell = document.createElement("div");
    document.body.appendChild(cell);
    TestState.designerInstance = designerWith(cell);

    refreshCodbiElementMarkers();
    jest.advanceTimersByTime(100);
    await Promise.resolve();
    await Promise.resolve();
    const before = refreshPasses(info);

    // The platform constantly swaps <head> styles and re-measures bodies — none of that concerns us.
    document.head.appendChild(document.createElement("style"));
    document.body.appendChild(document.createElement("div"));
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(500);

    expect(refreshPasses(info)).toBe(before);
  });

  it("ignores the churn of its OWN preview nodes (the clip/fit loops run between passes)", async () => {
    jest.useFakeTimers();
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined);

    // A rendered preview cell carries the marker class, so its height pin counts as OUR mutation.
    const cell = document.createElement("div");
    cell.className = "codbi-func-preview--rendered";
    document.body.appendChild(cell);
    TestState.designerInstance = designerWith(cell);

    refreshCodbiElementMarkers();
    jest.advanceTimersByTime(100);
    await Promise.resolve();
    await Promise.resolve();
    const before = refreshPasses(info);

    // The clip/fit loop creates its iframe and resizes it on its own timer, i.e. OUTSIDE any pass.
    const frame = document.createElement("iframe");
    frame.className = "codbi-func-preview-frame";
    cell.appendChild(frame);
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(500);
    const afterAppend = refreshPasses(info);

    frame.style.height = "120px";
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(500);
    const afterFrameResize = refreshPasses(info);

    cell.style.minHeight = "120px";
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(500);
    const afterPin = refreshPasses(info);

    expect({ afterAppend, afterFrameResize, afterPin }).toEqual({
      afterAppend: before,
      afterFrameResize: before,
      afterPin: before,
    });
  });
});
