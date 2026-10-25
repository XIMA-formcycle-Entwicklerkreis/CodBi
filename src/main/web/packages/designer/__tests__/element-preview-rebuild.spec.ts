// Regression test for the "preview is fucked up after the second toggle" report: the designer
// re-renders an element cell IN PLACE, which drops our preview iframe but keeps the cell element —
// and with it the `--rendered` class that hides the native element. The remembered preview signature
// then still "matched", so nothing rebuilt the iframe and the cell stayed blank for good.

import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { previewClipIsLost, refreshCodbiElementMarkers } from "../src/js/CodbiElementMarkers.js";

import { resetTestState, TestState } from "./test-state.js";

/**
 * Builds a designer item whose element preview is ON (`data-cb-preview="1"`).
 *
 * @param cell - The content cell of the element on the canvas.
 * @returns The fake item.
 */
function previewItem(cell: HTMLElement): unknown {
  return {
    getId: () => "xi-prev",
    getPersist: () => ({
      properties: {
        attributes: [{ text: "data-cb-preview", value: "1" }],
      },
    }),
    getItemContentCell: () => [cell],
  };
}

/**
 * Runs a full refresh pass and lets the queued microtasks (the MutationObserver) settle.
 *
 * @param advance - Advances the fake timers by that many milliseconds.
 * @returns A promise resolved after the pass has run.
 */
async function runPass(advance: number): Promise<void> {
  jest.advanceTimersByTime(advance);
  await Promise.resolve();
  await Promise.resolve();
}

afterEach(() => {
  resetTestState();
  delete (window as unknown as { XFC_METADATA?: unknown }).XFC_METADATA;
  jest.useRealTimers();
  document.body.innerHTML = "";
});

describe("previewClipIsLost", () => {
  /**
   * Builds an iframe whose document holds a form-like body.
   *
   * @param bodyMarkup - The markup of the fake preview page.
   * @returns The iframe and its same-origin document.
   */
  function previewFrame(bodyMarkup: string): { frame: HTMLIFrameElement; doc: Document } {
    const frame = document.createElement("iframe");
    document.body.appendChild(frame);
    const doc = frame.contentDocument;
    if (!doc) {
      throw new Error("no contentDocument");
    }
    doc.body.innerHTML = bodyMarkup;

    return { frame, doc };
  }

  it("is false while the clipped element is still inside the preview document", () => {
    const { frame, doc } = previewFrame('<div id="xi-prev"><input></div>');
    const item = doc.querySelector<HTMLElement>("#xi-prev");

    expect(previewClipIsLost(frame, item)).toBe(false);
  });

  it("is true once the preview document re-rendered the form", () => {
    const { frame, doc } = previewFrame('<div id="xi-prev"><input></div>');
    const item = doc.querySelector<HTMLElement>("#xi-prev");

    // The platform preview page re-renders the whole form: the clipped node is replaced.
    doc.body.innerHTML = '<div id="xi-prev-again"><input></div>';

    expect(previewClipIsLost(frame, item)).toBe(true);
  });

  it("is false without a clipped element or without a preview document", () => {
    const frame = document.createElement("iframe");

    expect(previewClipIsLost(frame, null)).toBe(false);
  });
});

describe("element preview after a designer re-render", () => {
  it("rebuilds the preview iframe the designer removed", async () => {
    (window as unknown as { XFC_METADATA?: unknown }).XFC_METADATA = { currentProject: { id: 42 } };
    jest.useFakeTimers();

    const cell = document.createElement("div");
    document.body.appendChild(cell);
    TestState.designerInstance = {
      items: { "xi-prev": previewItem(cell) },
      getFormPropertyValueForCurrentLang: () => "0",
    };

    refreshCodbiElementMarkers();
    await runPass(100);

    const first = cell.querySelector("iframe.codbi-func-preview-frame");
    expect(first).not.toBeNull();

    // The platform re-renders the cell: the iframe is gone, the cell element stays.
    first?.remove();
    expect(cell.querySelector("iframe.codbi-func-preview-frame")).toBeNull();

    refreshCodbiElementMarkers();
    await runPass(100);

    expect(cell.querySelector("iframe.codbi-func-preview-frame")).not.toBeNull();
  });

  it("leaves an intact preview alone (no reload on every pass)", async () => {
    (window as unknown as { XFC_METADATA?: unknown }).XFC_METADATA = { currentProject: { id: 42 } };
    jest.useFakeTimers();

    const cell = document.createElement("div");
    document.body.appendChild(cell);
    TestState.designerInstance = {
      items: { "xi-prev": previewItem(cell) },
      getFormPropertyValueForCurrentLang: () => "0",
    };

    refreshCodbiElementMarkers();
    await runPass(100);
    const first = cell.querySelector("iframe.codbi-func-preview-frame");

    refreshCodbiElementMarkers();
    await runPass(100);

    // The very same iframe instance — it was not re-created behind the user's back.
    expect(cell.querySelector("iframe.codbi-func-preview-frame")).toBe(first);
  });
});
