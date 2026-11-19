// Regression test: a LOCAL functionality (e.g. an AI-created `Mein.Rechner`) that was removed from the
// local API-doc and synchronised must disappear from the ON-CANVAS CodBi markers, not only from the
// element config panel. The panel is re-rendered through `refreshElementConfig` (published by the per-
// element editor), while the marker badges resolve their orange sub-badges from
// `window.CodbiPluginData.detFunctionalities`. The fix therefore has two halves, both covered here:
//   1. the manager's sync REMOVES the deleted local entries from the live registry, and
//   2. `refreshElementFunctionalityConfig()` also requests a marker pass.
// This spec exercises the marker half: once the registry no longer contains the name, a marker refresh
// must not render its sub-badge again.

import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { Constants } from "codbi-common";

import { refreshCodbiElementMarkers } from "../src/js/CodbiElementMarkers.js";

import { resetTestState, TestState } from "./test-state.js";

/** One entry of an element's persisted `attributes` bag. */
interface IAttributeEntryLike {
  text: string;
  value: string;
}

/** The properties bag of the fake item. */
interface IPropertiesLike {
  attributes: IAttributeEntryLike[];
  cssclasses: string[];
}

/** The registry the designer normally publishes (a LOCAL functionality, flagged `local`). */
interface IPluginDataLike {
  detFunctionalities: Record<string, { Parameter: Record<string, unknown>; local?: boolean }>;
  detStandards: Record<string, unknown>;
}

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
 * Builds a marker item carrying the local functionality in `data-cb-func` plus its parameter.
 *
 * @param cell - The content cell of the element on the canvas.
 * @returns The fake item.
 */
function markerItem(cell: HTMLElement): unknown {
  const properties: IPropertiesLike = {
    attributes: [
      { text: "data-cb-func", value: "Mein.Rechner" },
      { text: "data-cb-layout", value: "normal" },
    ],
    cssclasses: [],
  };
  return {
    getId: () => "xi-1",
    className: "XContainer",
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

afterEach(() => {
  resetTestState();
  delete (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData;
  jest.useRealTimers();
  document.body.innerHTML = "";
});

describe("CodBi markers after a local functionality was removed", () => {
  it("drops the sub-badge of a functionality that left the registry", async () => {
    jest.useFakeTimers();
    const pluginData: IPluginDataLike = {
      detFunctionalities: {
        "mein.rechner": { Parameter: { layout: {} }, local: true },
      },
      detStandards: {},
    };
    setPluginData(pluginData);

    const cell = document.createElement("div");
    document.body.appendChild(cell);
    TestState.designerInstance = designerWith(markerItem(cell));

    // While the definition exists, the element shows its orange functionality sub-badge.
    refreshCodbiElementMarkers();
    await settle(100);
    expect(cell.querySelector(".codbi-func-item")).not.toBeNull();
    expect(cell.textContent ?? "").toContain("Mein.Rechner");

    // The manager pruned the entry during the sync (it is no longer part of the local API-doc), and the
    // panel refresh triggered a marker pass — exactly what `refreshElementFunctionalityConfig()` does.
    delete pluginData.detFunctionalities["mein.rechner"];
    refreshCodbiElementMarkers();
    await settle(100);

    // The removed functionality must not be rendered any more (the element itself keeps its
    // `data-cb-func` attribute — that is the user's decision, only the marker goes away).
    expect(cell.querySelector(".codbi-func-item")).toBeNull();
    expect(cell.textContent ?? "").not.toContain("Mein.Rechner");
  });
});
