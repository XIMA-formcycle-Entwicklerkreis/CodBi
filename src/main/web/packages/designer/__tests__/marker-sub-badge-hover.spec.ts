// Regression tests for ALL on-canvas CodBi marker sub-badges (orange functionality, blue
// standard-configuration class and green holistic): hovering one must only REVEAL its parameter table
// (pure CSS `:hover`) and must never leave the focus-retention `--open` class behind. The reported
// bug was a table that stayed expanded forever after a single hover — even after the pointer had left
// the badge AND the element — and that reappeared with the list on the next hover.

import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { Constants } from "codbi-common";

import { refreshCodbiElementMarkers } from "../src/js/CodbiElementMarkers.js";

import { resetTestState, TestState } from "./test-state.js";

/** One entry of an element's persisted `attributes` bag. */
interface IAttributeEntryLike {
  text: string;
  value: string;
}

/** The properties bag of the fake item (mutable, so a change re-renders the badge). */
interface IPropertiesLike {
  attributes: IAttributeEntryLike[];
  cssclasses: string[];
}

/** Every sub-badge colour a marker can show, mapped to its focus-retention `--open` class. */
const SUB_BADGES: Array<[selector: string, openClass: string]> = [
  [".codbi-func-item", "codbi-func-item--open"],
  [".codbi-css-item", "codbi-css-item--open"],
  [".codbi-holistic-item", "codbi-holistic-item--open"],
];

/** Installs the plugin data the designer normally publishes. */
function setPluginData(data: unknown): void {
  (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = data;
}

/**
 * Runs the queued marker refresh work: advances the fake timers and lets the MutationObserver
 * microtasks run.
 *
 * @param advance - Advances the fake timers by that many milliseconds.
 * @returns A promise resolved after the pass has run.
 */
async function settle(advance: number): Promise<void> {
  jest.advanceTimersByTime(advance);
  await Promise.resolve();
  await Promise.resolve();
  jest.advanceTimersByTime(advance);
  await Promise.resolve();
  await Promise.resolve();
}

/**
 * Builds a marker item that carries ALL THREE sub-badge kinds: a `data-cb-func` functionality, a
 * CodBi standard-configuration CSS class and an active holistic configuration targeting the cell.
 *
 * @param cell       - The content cell of the element on the canvas.
 * @param properties - The element's persisted properties (mutated between passes to force a rebuild).
 * @returns The fake item.
 */
function markerItem(cell: HTMLElement, properties: IPropertiesLike): unknown {
  return {
    getId: () => "xi-1",
    className: "XTextField",
    getPersist: () => ({ properties }),
    getItemContentCell: () => [cell],
  };
}

/**
 * Builds a designer instance with the marker mode ON.
 *
 * @param item - The item returned by the designer's `items` map.
 * @returns The fake designer instance.
 */
function designerWith(item: unknown): unknown {
  return {
    items: { "xi-1": item },
    getFormPropertyValueForCurrentLang: (property: string) =>
      property === String(Constants["designer.property.mark_elements"]) ? "1" : "",
  };
}

/** Plugin data providing the functionality, the blue class and the ACTIVE green holistic config. */
const PLUGIN_DATA = {
  detFunctionalities: { "date.min": { Parameter: { Minimum: {} } } },
  detStandards: {
    "Text.Box": { classes: { CodBi_TestClass: { description: "Test class." } } },
    "Holistic.Test.Target": {
      Active: true,
      targets: "div.codbi-holistic-probe",
      func: "date.min",
      classes: {},
    },
  },
};

/** @returns the sub-badge of that selector inside the cell, failing the test when it is missing. */
function subBadge(cell: HTMLElement, selector: string): HTMLElement {
  const found = cell.querySelector<HTMLElement>(selector);
  expect(found).not.toBeNull();
  return found!;
}

/** @returns whether ANY sub-badge still carries a focus-retention `--open` class. */
function anyOpen(cell: HTMLElement): boolean {
  return SUB_BADGES.some(([selector, openClass]) => {
    const found = cell.querySelector<HTMLElement>(selector);
    return found !== null && found.classList.contains(openClass);
  });
}

/** Builds the cell + item and renders the badges for them. */
async function renderMarkers(): Promise<{ cell: HTMLElement; properties: IPropertiesLike }> {
  jest.useFakeTimers();
  setPluginData(PLUGIN_DATA);
  const cell = document.createElement("div");
  // The green holistic configuration targets exactly this anchor.
  cell.className = "codbi-holistic-probe";
  document.body.appendChild(cell);
  const properties: IPropertiesLike = {
    attributes: [
      { text: "data-cb-func", value: "date.min" },
      { text: "data-cb-minimum", value: "0" },
    ],
    cssclasses: ["CodBi_TestClass"],
  };
  TestState.designerInstance = designerWith(markerItem(cell, properties));
  refreshCodbiElementMarkers();
  await settle(100);
  return { cell, properties };
}

/** Hovers every sub-badge once (each `mouseenter` records it as the "currently used" sub-badge). */
function hoverAll(cell: HTMLElement): void {
  for (const [selector] of SUB_BADGES) {
    subBadge(cell, selector).dispatchEvent(new MouseEvent("mouseenter"));
  }
}

afterEach(() => {
  resetTestState();
  delete (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData;
  jest.useRealTimers();
  document.body.innerHTML = "";
});

describe("CodBi marker sub-badge hover (all colours)", () => {
  it("does not hold any parameter table open after a single hover", async () => {
    const { cell } = await renderMarkers();

    for (const [selector, openClass] of SUB_BADGES) {
      const badge = subBadge(cell, selector);
      // Hovering only reveals the table through CSS `:hover` — it must not add the `--open` class,
      // because nothing would remove it again once the pointer leaves.
      badge.dispatchEvent(new MouseEvent("mouseenter"));
      expect(badge.classList.contains(openClass)).toBe(false);
    }

    // Leaving the badge (and the element) therefore leaves nothing behind — no matter whether the
    // pointer leaves through the functionality list or through the badge itself.
    subBadge(cell, ".codbi-func-list").dispatchEvent(new MouseEvent("mouseleave"));
    expect(anyOpen(cell)).toBe(false);
    subBadge(cell, ".codbi-elem-badge--funcs").dispatchEvent(new MouseEvent("mouseleave"));
    expect(anyOpen(cell)).toBe(false);
  });

  it("collapses again after a rebuild re-expanded a table that was only hovered", async () => {
    const { cell, properties } = await renderMarkers();
    hoverAll(cell);

    // A changed parameter changes the badge signature, so the pass really rebuilds the inner DOM.
    properties.attributes[1].value = "1";
    refreshCodbiElementMarkers();
    await settle(100);

    // The rebuild re-expands the sub-badge that was in use (the user must not lose the table while
    // editing) …
    expect(anyOpen(cell)).toBe(true);

    // … but leaving the badge must collapse it again, not leave the table on screen forever.
    subBadge(cell, ".codbi-func-list").dispatchEvent(new MouseEvent("mouseleave"));
    expect(anyOpen(cell)).toBe(false);

    // Same again, but this time the pointer leaves through the badge itself (e.g. over the logo),
    // which the badge-level safety net has to clean up as well.
    hoverAll(cell);
    properties.attributes[1].value = "2";
    refreshCodbiElementMarkers();
    await settle(100);
    expect(anyOpen(cell)).toBe(true);

    subBadge(cell, ".codbi-elem-badge--funcs").dispatchEvent(new MouseEvent("mouseleave"));
    expect(anyOpen(cell)).toBe(false);
  });
});
