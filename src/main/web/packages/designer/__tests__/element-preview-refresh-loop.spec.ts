// Regression test for the refresh STORM: a refresh pass touches the canvas (badges, preview switches,
// height pins), the canvas `MutationObserver` reports that as a mutation and a `MutationObserver`
// callback is a MICROTASK — so it runs after `refreshBadges` reset its `refreshing` guard and queues
// the next pass. Every pass therefore queued another one, dozens of times per interaction, and the
// repeated re-fitting of the preview iframes is what broke the designer layout.

import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { refreshCodbiElementMarkers, refreshPassCount } from "../src/js/CodbiElementMarkers.js";

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
 * Runs the queued refresh work: advances the fake timers and lets the MutationObserver microtasks run.
 *
 * @param advance - Advances the fake timers by that many milliseconds.
 * @returns A promise resolved after the pass has run.
 */
async function settle(advance: number): Promise<void> {
  // A MutationObserver callback is a microtask and the refresh it schedules is a 60 ms timer, so the
  // timers must run once more AFTER the microtasks — otherwise the pass never runs.
  jest.advanceTimersByTime(advance);
  await Promise.resolve();
  await Promise.resolve();
  jest.advanceTimersByTime(advance);
  await Promise.resolve();
  await Promise.resolve();
}

afterEach(() => {
  resetTestState();
  jest.useRealTimers();
  document.body.innerHTML = "";
});

describe("refreshBadges self-triggering", () => {
  it("does not queue another pass from the mutations of its own pass", async () => {
    jest.useFakeTimers();

    const cell = document.createElement("div");
    document.body.appendChild(cell);
    TestState.designerInstance = designerWith(cell);

    refreshCodbiElementMarkers();
    // Run the pass (it renders the badge into the observed root = a canvas mutation) and give a
    // self-triggered pass all the time in the world to fire.
    await settle(100);
    await settle(1000);

    expect(refreshPassCount()).toBe(1);
  });

  it("still refreshes when a designer re-render takes a badge down", async () => {
    jest.useFakeTimers();

    const cell = document.createElement("div");
    document.body.appendChild(cell);
    TestState.designerInstance = designerWith(cell);

    refreshCodbiElementMarkers();
    await settle(100);
    const before = refreshPassCount();

    // The designer re-renders the cell, which DETACHES the badge we injected into it.
    cell.replaceChildren(document.createElement("span"));
    await settle(100);

    expect(refreshPassCount()).toBe(before + 1);
  });

  it("ignores designer churn that leaves our widgets alone", async () => {
    jest.useFakeTimers();

    const cell = document.createElement("div");
    document.body.appendChild(cell);
    TestState.designerInstance = designerWith(cell);

    refreshCodbiElementMarkers();
    await settle(100);
    const before = refreshPassCount();

    // The platform constantly swaps <head> styles and re-measures bodies — none of that concerns us.
    document.head.appendChild(document.createElement("style"));
    document.body.appendChild(document.createElement("div"));
    await settle(500);

    expect(refreshPassCount()).toBe(before);
  });

  it("ignores the churn of its OWN preview nodes (the clip/fit loops run between passes)", async () => {
    jest.useFakeTimers();

    // A rendered preview cell carries the marker class, so its height pin counts as OUR mutation.
    const cell = document.createElement("div");
    cell.className = "codbi-func-preview--rendered";
    document.body.appendChild(cell);
    TestState.designerInstance = designerWith(cell);

    refreshCodbiElementMarkers();
    await settle(100);
    const before = refreshPassCount();

    // The clip/fit loop creates its iframe and resizes it on its own timer, i.e. OUTSIDE any pass.
    const frame = document.createElement("iframe");
    frame.className = "codbi-func-preview-frame";
    cell.appendChild(frame);
    await settle(500);
    const afterAppend = refreshPassCount();

    frame.style.height = "120px";
    await settle(500);
    const afterFrameResize = refreshPassCount();

    cell.style.minHeight = "120px";
    await settle(500);
    const afterPin = refreshPassCount();

    expect({ afterAppend, afterFrameResize, afterPin }).toEqual({
      afterAppend: before,
      afterFrameResize: before,
      afterPin: before,
    });
  });
});
