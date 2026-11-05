// Tests for the class-based replacement of the former `:has()` selectors of the Mirror dropdown: the
// host panel marker (`.codbi-mirror-dd-host`) and the open-list lift (`.codbi-mirror-lifted`).
//
// `frame.css` used to ask "does this settings panel contain one of our dropdowns?" with
// `:has(.codbi-mirror-dd)`. A `:has()` selector invalidates the ANCESTORS of every changed node, so each
// property-row re-render (i.e. every element selection) re-evaluated those rules across the whole panel.
// The dropdown now stamps a class instead — this spec pins that behaviour, including the stale-marker
// cleanup for the panel of the PREVIOUS selection (the designer offers no destroy hook).

import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { MirrorDropdown } from "../src/js/MirrorDropdown.js";

/** Class the dropdown stamps on its host panel (must match `frame.css`). */
const PANEL_HOST_CLASS = "codbi-mirror-dd-host";
/** Class the dropdown stamps on the ancestors of an OPEN list (must match `frame.css`). */
const LIFT_CLASS = "codbi-mirror-lifted";

/**
 * Builds `<panel> <category> <row> <dropdown root> </category> </panel>` and returns the nodes.
 *
 * The category/row wrappers mirror what the designer renders between the `.xm-panel-box` and one of our
 * editors, so the lift chain is exercised with more than one ancestor.
 */
function mountDropdown(): {
  panel: HTMLElement;
  category: HTMLElement;
  row: HTMLElement;
  dropdown: MirrorDropdown;
  button: HTMLButtonElement;
} {
  const panel = document.createElement("div");
  panel.className = "xm-panel-box";
  const category = document.createElement("div");
  category.className = "xm-panel-category";
  const row = document.createElement("div");
  row.className = "xm-pe-row";
  category.appendChild(row);
  panel.appendChild(category);
  document.body.appendChild(panel);

  const dropdown = new MirrorDropdown(() => {});
  row.appendChild(dropdown.root);
  // The designer assigns the value right after mounting the editor — that is the attach moment the
  // host marker relies on.
  dropdown.setValue("some-form");
  dropdown.setOptions([{ value: "some-form", text: "Some form" }]);

  const button = dropdown.root.querySelector<HTMLButtonElement>("button") as HTMLButtonElement;
  return { panel, category, row, dropdown, button };
}

afterEach(() => {
  document.body.replaceChildren();
  jest.restoreAllMocks();
});

describe("MirrorDropdown panel host marker", () => {
  it("marks the settings panel that hosts the dropdown", () => {
    const { panel } = mountDropdown();

    expect(panel.classList.contains(PANEL_HOST_CLASS)).toBe(true);
    // The watermark marker never lands on a wrapper INSIDE the panel.
    expect(panel.querySelectorAll(`.${PANEL_HOST_CLASS}`).length).toBe(0);
  });

  it("drops the marker from the panel of a DISCARDED dropdown (previous selection)", () => {
    const first = mountDropdown();
    expect(first.panel.classList.contains(PANEL_HOST_CLASS)).toBe(true);

    // The designer replaces the editors on the next selection without a destroy hook: the old editor's
    // root is detached while its panel box survives.
    first.dropdown.root.remove();
    const second = mountDropdown();

    expect(first.panel.classList.contains(PANEL_HOST_CLASS)).toBe(false);
    expect(second.panel.classList.contains(PANEL_HOST_CLASS)).toBe(true);
  });
});

describe("MirrorDropdown open-list lift", () => {
  it("lifts every ancestor between the open list and the panel box, and only while open", () => {
    const { panel, category, row, button } = mountDropdown();

    expect(category.classList.contains(LIFT_CLASS)).toBe(false);
    expect(row.classList.contains(LIFT_CLASS)).toBe(false);

    button.click();

    expect(category.classList.contains(LIFT_CLASS)).toBe(true);
    expect(row.classList.contains(LIFT_CLASS)).toBe(true);
    // The panel box itself gets the `> *` z-index base from `frame.css`, never the lift class.
    expect(panel.classList.contains(LIFT_CLASS)).toBe(false);

    button.click();

    expect(category.classList.contains(LIFT_CLASS)).toBe(false);
    expect(row.classList.contains(LIFT_CLASS)).toBe(false);
  });

  it("keeps a closed dropdown from lifting its row again after a re-render of the list", () => {
    const { category, row, button } = mountDropdown();

    button.click();
    expect(row.classList.contains(LIFT_CLASS)).toBe(true);

    // Closing (via the document click the designer's own interactions produce) drops the lift exactly.
    document.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(category.classList.contains(LIFT_CLASS)).toBe(false);
    expect(row.classList.contains(LIFT_CLASS)).toBe(false);
  });
});

describe("MirrorDropdown open-list portal", () => {
  /** Class the dropdown stamps on the list while it is OPEN and portaled (must match `frame.css`). */
  const LIST_PORTAL_CLASS = "codbi-mirror-dd__list--portal";

  /** The open list element (the `.codbi-mirror-dd__list` child of the dropdown root/list). */
  function listElement(dropdownRoot: HTMLElement): HTMLElement {
    return dropdownRoot.querySelector<HTMLElement>(".codbi-mirror-dd__list") as HTMLElement;
  }

  it("portals the OPEN list to document.body so it escapes every settings-panel stacking context", () => {
    const { dropdown, button } = mountDropdown();
    const list = listElement(dropdown.root);
    // Closed: the list lives inside the dropdown root (as the stylesheet lays it out inline).
    expect(list.parentElement).toBe(dropdown.root);
    expect(list.classList.contains(LIST_PORTAL_CLASS)).toBe(false);

    button.click();

    // Open: the list is moved to the body portal and marked for the `position: fixed` styling.
    expect(list.parentElement).toBe(document.body);
    expect(list.classList.contains(LIST_PORTAL_CLASS)).toBe(true);

    button.click();

    // Closed again: the list returns to its root and drops the portal styling.
    expect(list.parentElement).toBe(dropdown.root);
    expect(list.classList.contains(LIST_PORTAL_CLASS)).toBe(false);
  });

  it("restores the portaled list to its root when closed via the document click", () => {
    const { dropdown, button } = mountDropdown();
    const list = listElement(dropdown.root);

    button.click();
    expect(list.parentElement).toBe(document.body);

    document.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(list.parentElement).toBe(dropdown.root);
    expect(list.classList.contains(LIST_PORTAL_CLASS)).toBe(false);
  });
});
