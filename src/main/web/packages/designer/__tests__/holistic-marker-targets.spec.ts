import { afterEach, describe, expect, it } from "@jest/globals";

import { holisticTargetsAnchor } from "../src/js/CodbiElementMarkers.js";

/**
 * Regression tests for the GREEN holistic sub-badge decision.
 *
 * The badge must reflect what the runtime actually applies: a PAGE (or any container) that merely
 * CONTAINS a targeted field must not be marked, while the field itself — and a container whose OWN
 * rendered element is targeted — must be.
 */

/** The real targets selector of `Holistic.Media.MultipleUpload` (upload/download fields only). */
const UPLOAD_TARGETS = '.CXUpload input[type="file"]:not(.CodBi_XCL):not(.CodBi_XCL_MultipleUpload)';

/** Builds a designer item content cell (the anchor the markers work with). */
function cell(inner: string): HTMLElement {
  const cellEl = document.createElement("td");
  cellEl.className = "xm-item-content";
  cellEl.innerHTML = inner;
  const wrapper = document.createElement("table");
  const row = document.createElement("tr");
  row.appendChild(cellEl);
  wrapper.appendChild(row);
  document.body.appendChild(wrapper);
  return cellEl;
}

/** Wraps `inner` into a CHILD item's own container table (as the designer renders nested items). */
function childItem(inner: string): string {
  return `<table class="xm-item-container"><tbody><tr><td class="xm-item-content">${inner}</td></tr></tbody></table>`;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("holisticTargetsAnchor", () => {
  it("matches a leaf upload widget whose input belongs to its own cell", () => {
    const anchor = cell('<div class="CXUpload"><div class="xm-item-div"><input type="file"></div></div>');

    expect(holisticTargetsAnchor(anchor, UPLOAD_TARGETS)).toBe(true);
  });

  it("does NOT mark a PAGE that only CONTAINS an upload field (child item)", () => {
    // A page cell holds the cells of its child items — each inside its OWN `xm-item-container`.
    const page = cell(childItem('<div class="CXUpload"><input type="file"></div>'));

    expect(holisticTargetsAnchor(page, UPLOAD_TARGETS)).toBe(false);
  });

  it("does NOT mark a PAGE whose child item is the second nested control", () => {
    const page = cell(
      `${childItem('<input type="text">')}${childItem('<div class="CXUpload"><input type="file"></div>')}`,
    );

    expect(holisticTargetsAnchor(page, UPLOAD_TARGETS)).toBe(false);
  });

  it("still matches a CONTAINER by its OWN rendered element (fieldset panel)", () => {
    // The fieldset is the container's own widget; the child items live INSIDE it.
    const container = cell(`<fieldset class="my-panel">${childItem('<input type="file">')}</fieldset>`);

    // The container's own element matches…
    expect(holisticTargetsAnchor(container, "fieldset.my-panel")).toBe(true);
    // …but the upload field of its CHILD does not turn it into an upload target.
    expect(holisticTargetsAnchor(container, UPLOAD_TARGETS)).toBe(false);
  });

  it("matches when the ANCHOR itself is the targeted element", () => {
    const anchor = cell('<input type="file">');
    anchor.classList.add("CXUpload");

    expect(holisticTargetsAnchor(anchor, ".CXUpload")).toBe(true);
    expect(holisticTargetsAnchor(anchor, ".NotThere")).toBe(false);
  });

  it("supports tilde-separated target lists and tolerates invalid selectors", () => {
    const anchor = cell('<input type="text" data-vdt="time">');

    expect(holisticTargetsAnchor(anchor, '.Nope~input[data-vdt="time"]')).toBe(true);
    expect(holisticTargetsAnchor(anchor, ":::broken")).toBe(false);
  });
});
