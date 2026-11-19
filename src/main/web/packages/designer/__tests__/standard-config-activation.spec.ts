// Tests for the SHARED standard-configuration activation used by BOTH the per-element CodBi config
// panel and the on-canvas CodBi marker badges: a class whose owning configuration is not activated for
// the form is only a (dimmed) marker, and acting on it asks whether that configuration shall be
// activated.

import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { Constants } from "codbi-common";

import { refreshCodbiElementMarkers, resumeElementPreviews } from "../src/js/CodbiElementMarkers.js";
import {
  activateStandardConfig,
  activeStandardConfigIds,
  requestStandardConfigActivation,
  standardConfigClassIsInactive,
  standardConfigOwnerOfClass,
} from "../src/js/StandardConfigActivation.js";

import { resetTestState, TestState } from "./test-state.js";

/** The form property holding the active standard-configuration CSV. */
const STANDARDS_PROPERTY = String(Constants["designer.property.standards"]);

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
 * Builds a designer item whose content cell is a real DOM node, carrying the given CSS classes.
 *
 * @param cell       - The content cell of the element on the canvas.
 * @param cssClasses - The element's `cssclasses` property.
 * @returns The fake item.
 */
function fakeItem(cell: HTMLElement, cssClasses: string[]): unknown {
  return {
    getId: () => "xi-1",
    className: "XTextField",
    getPersist: () => ({ properties: { cssclasses: cssClasses } }),
    getItemContentCell: () => [cell],
  };
}

/**
 * Builds a designer instance with the marker mode ON, so a pass really renders the CodBi badge.
 *
 * @param cell       - The content cell of the element on the canvas.
 * @param cssClasses - The element's `cssclasses` property.
 * @returns The fake designer instance.
 */
function designerWith(cell: HTMLElement, cssClasses: string[]): unknown {
  return {
    items: { "xi-1": fakeItem(cell, cssClasses) },
    // The marker mode is ON; every other form property (notably the standards CSV) stays empty.
    getFormPropertyValueForCurrentLang: (property: string) =>
      property === String(Constants["designer.property.mark_elements"]) ? "1" : "",
  };
}

afterEach(() => {
  resetTestState();
  delete (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData;
  jest.useRealTimers();
  // A question left open would keep the element previews frozen and would leak into the next test.
  for (const overlay of Array.from(document.querySelectorAll(".codbi-std-activate-overlay"))) {
    overlay.remove();
  }
  resumeElementPreviews(false);
  document.body.innerHTML = "";
});

describe("standard-configuration activation resolution", () => {
  it("resolves the owning configuration and marks only NOT activated configurations as inactive", () => {
    TestState.language = "en";
    setPluginData({
      detStandards: {
        // Not active for the form (neither persisted nor flagged `Active`).
        Appointments: { classes: { CodBi_NoFutureDate: { description: "x" } } },
        // Active for the form.
        "Text.Box": { Active: true, classes: { CodBi_TextRegex: { description: "y" } } },
      },
    });

    expect(standardConfigOwnerOfClass("CodBi_NoFutureDate")).toBe("Appointments");
    expect(standardConfigOwnerOfClass("CodBi_TextRegex")).toBe("Text.Box");
    // An unknown class belongs to no configuration and is therefore never dimmed (fail-open).
    expect(standardConfigOwnerOfClass("codbi-not-a-standard-class")).toBeUndefined();

    expect(standardConfigClassIsInactive("CodBi_NoFutureDate")).toBe(true);
    expect(standardConfigClassIsInactive("CodBi_TextRegex")).toBe(false);
    expect(standardConfigClassIsInactive("codbi-not-a-standard-class")).toBe(false);
  });

  it("counts a configuration active when the form's standards property selects it", () => {
    setPluginData({
      detStandards: { Appointments: { classes: { CodBi_NoFutureDate: { description: "x" } } } },
    });
    TestState.designerInstance = {
      getFormPropertyValueForCurrentLang: (property: string) => (property === STANDARDS_PROPERTY ? "Appointments" : ""),
    };

    expect(activeStandardConfigIds()).toEqual(["Appointments"]);
    expect(standardConfigClassIsInactive("CodBi_NoFutureDate")).toBe(false);
  });

  /**
   * Reported: activating a configuration from the ELEMENT panel left it unchecked in the form-level
   * "Standard Configurations" listing (and the canvas badge kept dimming its class). The standards
   * editor is the only reliable writer — its `setStandardsValue` updates the checkboxes AND persists
   * `codbi-prop-standards` — so it is resolved through the designer's property view and used.
   */
  it("persists through the resolved form-level standards editor", () => {
    setPluginData({
      detStandards: { Appointments: { Active: false, classes: { CodBi_NoFutureDate: { description: "x" } } } },
      pendingStandards: undefined,
    });
    // The real editor flips the `Active` flags while applying the CSV — the mock mirrors that, so the
    // assertion below proves the badge reads the SAME state the editor produced.
    const detStandards = (
      window as unknown as { CodbiPluginData: { detStandards: Record<string, { Active?: boolean }> } }
    ).CodbiPluginData.detStandards;
    const setStandardsValue = jest.fn(() => {
      detStandards.Appointments.Active = true;
    });
    TestState.designerInstance = {
      getFormPropertyValueForCurrentLang: () => "",
      getPropertyView: () => ({
        getEditorForProperty: (property: string) =>
          property === STANDARDS_PROPERTY ? { config: { property }, setStandardsValue } : undefined,
      }),
    };

    expect(activateStandardConfig("Appointments")).toBe(true);
    expect(setStandardsValue).toHaveBeenCalledWith("Appointments");
    // Nothing is queued for a later panel — it was persisted right away.
    expect(sessionStorage.getItem("codbi-pending-standards")).toBeNull();
    expect(standardConfigClassIsInactive("CodBi_NoFutureDate")).toBe(false);
  });

  /**
   * While the form's CodBi options were never opened, no standards editor exists. The activation must
   * then QUEUE the new CSV in the channel that editor consumes on construction (and flag the
   * configuration ACTIVE), instead of firing `set-property` with a foreign sender — which persisted
   * nothing (reported).
   */
  it("queues the activated id for a later form-level standards editor and flags the configuration active", () => {
    setPluginData({
      detStandards: { Appointments: { Active: false, classes: { CodBi_NoFutureDate: { description: "x" } } } },
      // No `setStandardsValue` and no mounted editor in this session.
      pendingStandards: undefined,
    });
    TestState.designerInstance = { getFormPropertyValueForCurrentLang: () => "" };

    expect(activateStandardConfig("Appointments")).toBe(true);
    // The MultiSelect consumes exactly this queue in its constructor.
    expect(sessionStorage.getItem("codbi-pending-standards")).toBe("Appointments");
    // The settings registry now reports the configuration as active, so the badge stops dimming it.
    expect(standardConfigClassIsInactive("CodBi_NoFutureDate")).toBe(false);

    sessionStorage.removeItem("codbi-pending-standards");
  });
});

describe("standard-configuration activation question", () => {
  it("asks before activating and activates the configuration on confirm", () => {
    TestState.language = "en";
    const setStandardsValue = jest.fn();
    setPluginData({
      detStandards: { Appointments: { classes: { CodBi_NoFutureDate: { description: "x" } } } },
      setStandardsValue,
    });

    expect(requestStandardConfigActivation("CodBi_NoFutureDate")).toBe(true);

    const dialog = document.querySelector(".codbi-std-activate-dialog") as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(Array.from(dialog.querySelectorAll("li")).map((entry) => entry.textContent)).toEqual(["CodBi_NoFutureDate"]);
    expect(setStandardsValue).not.toHaveBeenCalled();

    (dialog.querySelector(".codbi-std-activate-dialog__confirm") as HTMLButtonElement).click();
    expect(setStandardsValue).toHaveBeenCalledWith("Appointments");
    expect(document.querySelector(".codbi-std-activate-overlay")).toBeNull();
  });

  it("does not activate anything when the question is dismissed", () => {
    TestState.language = "en";
    const setStandardsValue = jest.fn();
    setPluginData({
      detStandards: { Appointments: { classes: { CodBi_NoFutureDate: { description: "x" } } } },
      setStandardsValue,
    });

    requestStandardConfigActivation("CodBi_NoFutureDate");
    (document.querySelector(".codbi-std-activate-dialog__cancel") as HTMLButtonElement).click();

    expect(setStandardsValue).not.toHaveBeenCalled();
    expect(document.querySelector(".codbi-std-activate-overlay")).toBeNull();
  });

  it("does not ask at all when the owning configuration is already active", () => {
    setPluginData({
      detStandards: {
        "Text.Box": { Active: true, classes: { CodBi_TextRegex: { description: "y" } } },
      },
    });

    expect(requestStandardConfigActivation("CodBi_TextRegex")).toBe(false);
    expect(document.querySelector(".codbi-std-activate-overlay")).toBeNull();
  });
});

describe("CodBi marker class sub-badges", () => {
  it("dims a class of a NOT activated configuration, asks on click and repaints it after activation", async () => {
    TestState.language = "en";
    jest.useFakeTimers();

    const appointments = {
      Active: false,
      classes: { CodBi_NoFutureDate: { description: "Prevents future dates." } },
    };
    const setStandardsValue = jest.fn((csv: string) => {
      // Behave like the form-level standards editor: the selected configuration becomes ACTIVE.
      if (String(csv).includes("Appointments")) {
        appointments.Active = true;
      }
    });
    setPluginData({ detStandards: { Appointments: appointments }, setStandardsValue });

    const cell = document.createElement("div");
    document.body.appendChild(cell);
    TestState.designerInstance = designerWith(cell, ["CodBi_NoFutureDate"]);

    refreshCodbiElementMarkers();
    await settle(100);

    const dimmed = cell.querySelector<HTMLElement>(".codbi-css-item");
    expect(dimmed).not.toBeNull();
    // The class is only a marker while its configuration is inactive → dimmed sub-badge.
    expect(dimmed?.classList.contains("codbi-css-item--inactive")).toBe(true);
    // … and the tooltip explains that the configuration has to be activated.
    expect(dimmed?.title).toContain("Appointments");

    dimmed!.click();
    const dialog = document.querySelector(".codbi-std-activate-dialog") as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(setStandardsValue).not.toHaveBeenCalled();

    (dialog.querySelector(".codbi-std-activate-dialog__confirm") as HTMLButtonElement).click();
    expect(setStandardsValue).toHaveBeenCalledWith("Appointments");

    // The activated configuration repaints the badge: the sub-badge is no longer dimmed.
    await settle(100);
    const repainted = cell.querySelector<HTMLElement>(".codbi-css-item");
    expect(repainted).not.toBeNull();
    expect(repainted?.classList.contains("codbi-css-item--inactive")).toBe(false);
  });
});
