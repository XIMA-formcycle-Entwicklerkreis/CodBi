// Tests for ElementFunctionalityConfigEditor's two functionality lists: the applicable "main" list and
// the toggle-only "not declared for this element" second list.

import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { TEditorCfg } from "@de-xima/fc-form-designer";

import {
  ElementFunctionalityConfigEditor,
  ELEMENT_FUNCS_PROPERTY,
  paramsToRemoveForRemovedFunctionality,
  refreshElementFunctionalityConfig,
  registerElementFunctionalityProperties,
  type IElementFunctionalityConfigDescriptor,
} from "../src/js/ElementFunctionalityConfigEditor.js";

import { resetTestState, TestState } from "./test-state.js";

/** Builds the editor under test with a designer instance reporting the given element. */
function buildEditor(className: string, properties: Record<string, unknown>): HTMLElement {
  // Preserve every other member a test placed on the fake designer — `getFormPropertyValueForCurrentLang`
  // (the form-level "CodBi aktiviert" checkbox) and `getPersistDiffer` (the draft sync the CSS-class
  // writers nudge) — and only replace the selected-item lookup.
  const prior = (TestState.designerInstance ?? {}) as Record<string, unknown>;
  TestState.designerInstance = {
    ...prior,
    getSelectedMasterItem: () => ({ className, getPersist: () => ({ properties }) }),
  };

  const config = { designer: {} } as unknown as TEditorCfg<IElementFunctionalityConfigDescriptor>;
  const editor = new ElementFunctionalityConfigEditor(config);

  return editor.getElement()[0] as HTMLElement;
}

/** The ids shown in the option rows beneath the given options container selector. */
function optionIds(root: HTMLElement, selector: string): string[] {
  return Array.from(root.querySelectorAll(`${selector} .codbi-func-config__option`)).map(
    (row) => row.querySelector("span")?.textContent ?? "",
  );
}

afterEach(() => {
  resetTestState();
  delete (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData;
  // Applying a class of a NOT activated configuration opens the activation dialog — never let it leak
  // into the next test (the editor renders into detached elements, the dialog goes to `document.body`).
  for (const overlay of Array.from(document.querySelectorAll(".codbi-std-activate-overlay"))) {
    overlay.remove();
  }
});

describe("ElementFunctionalityConfigEditor functionality lists", () => {
  it("splits the functionalities into applicable (main) and non-applicable (toggle-only) lists", () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detFunctionalities: {
        "Any.Thing": {},
        "Date.Min": { supportedFormelementtypes: { XTextField: { datatype: "dateDE" } } },
        "Html.Panel": { supportedFormelementtypes: ["XContainer"] },
      },
    };

    const rootEl = buildEditor("XTextField", { datatype: "dateDE" });

    // Main list: the fail-open functionality plus the one declared for a German date field.
    expect(optionIds(rootEl, ".codbi-func-config__options:not(.codbi-func-config__options--all)")).toEqual([
      "Any.Thing",
      "Date.Min",
    ]);
    // The complement (declared for XContainer only) lands in the second list.
    expect(optionIds(rootEl, ".codbi-func-config__options--all")).toEqual(["Html.Panel"]);
  });

  /** The functionality section (i.e. `rootEl`'s section that is NOT the standard-configuration one). */
  function funcSection(rootEl: HTMLElement): HTMLElement {
    return Array.from(rootEl.querySelectorAll<HTMLElement>(".codbi-func-config__section")).find(
      (section) => !section.classList.contains("codbi-func-config__section--standards"),
    ) as HTMLElement;
  }

  it("narrows BOTH functionality listings to the applied functionalities (only checked)", () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detFunctionalities: {
        "Any.Thing": {},
        "Date.Min": {},
        // Declared for containers only → lands in the second (not-applicable) listing.
        "Html.Panel": { supportedFormelementtypes: ["XContainer"] },
      },
    };

    const rootEl = buildEditor("XTextField", { "codbi-prop-element-funcs": "Date.Min" });
    const section = funcSection(rootEl);
    const mainList = ".codbi-func-config__options:not(.codbi-func-config__options--all)";
    const allList = ".codbi-func-config__options--all";
    // EVERY listing has its own "only checked" toggle, sitting RIGHT OF its filter input.
    const filterRows = section.querySelectorAll<HTMLElement>(".codbi-func-config__filterrow");
    expect(filterRows.length).toBe(2);
    const only = filterRows[0].querySelector<HTMLButtonElement>(".codbi-func-config__only");
    const onlyAll = filterRows[1].querySelector<HTMLButtonElement>(".codbi-func-config__only");
    expect(only?.textContent).toBe("\u2713");
    expect(onlyAll?.textContent).toBe("\u2713");

    expect(only?.getAttribute("aria-pressed")).toBe("false");
    // Everything is listed while the toggles are off.
    expect(optionIds(rootEl, mainList)).toEqual(["Any.Thing", "Date.Min"]);
    expect(optionIds(rootEl, allList)).toEqual(["Html.Panel"]);

    only?.click();

    // Only the functionality APPLIED to the element survives in the applicable list.
    expect(optionIds(rootEl, mainList)).toEqual(["Date.Min"]);
    expect(only?.getAttribute("aria-pressed")).toBe("true");
    expect(only?.classList.contains("codbi-func-config__only--active")).toBe(true);
    // The OTHER listing keeps its own (still off) state and is unaffected.
    expect(optionIds(rootEl, allList)).toEqual(["Html.Panel"]);
    expect(onlyAll?.getAttribute("aria-pressed")).toBe("false");

    only?.click();

    expect(optionIds(rootEl, mainList)).toEqual(["Any.Thing", "Date.Min"]);
    expect(only?.getAttribute("aria-pressed")).toBe("false");

    // The second listing's own toggle narrows THAT listing: nothing there is applied → empty.
    onlyAll?.click();
    expect(optionIds(rootEl, allList)).toEqual([]);
    expect(onlyAll?.getAttribute("aria-pressed")).toBe("true");
    expect(optionIds(rootEl, mainList)).toEqual(["Any.Thing", "Date.Min"]);
  });

  it("keeps the second list hidden until the toggle button is clicked", () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detFunctionalities: { "Html.Panel": { supportedFormelementtypes: ["XContainer"] } },
    };

    const rootEl = buildEditor("XTextField", {});
    const section = funcSection(rootEl);
    const allList = section.querySelector<HTMLElement>(".codbi-func-config__funclist--all");
    // The toggles of the SECOND list are the ones WITHOUT the `--main` modifier (the applicable list
    // has its own toggle above it).
    const toggle = section.querySelector<HTMLButtonElement>(
      ".codbi-func-config__show-all:not(.codbi-func-config__show-all--main)",
    );

    // Explains what the button is for (native tooltip).
    expect(toggle?.title).toBe(
      "Shows further functionalities that are not declared for the selected element (apply with care).",
    );
    expect(allList?.style.display).toBe("none");
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    // The label is state-INDEPENDENT ("Mehr Funktionalitäten"); only the arrow changes on toggle.
    expect(toggle?.textContent).toBe("\u25B8 More functionalities");

    toggle?.click();

    expect(allList?.style.display).toBe("block");
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    expect(toggle?.textContent).toBe("\u25BE More functionalities");
  });

  it("hides the APPLICABLE functionality list behind its own toggle (collapsed by default)", () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detFunctionalities: { "Any.Thing": {} },
    };

    const rootEl = buildEditor("XTextField", {});
    const section = funcSection(rootEl);
    const mainList = section.querySelector<HTMLElement>(
      ".codbi-func-config__funclist:not(.codbi-func-config__funclist--all)",
    );
    const toggle = section.querySelector<HTMLButtonElement>(".codbi-func-config__show-all--main");

    // Explains what the button is for (native tooltip).
    expect(toggle?.title).toBe(
      "Shows the functionalities applicable to the selected element. Click to show/hide the list.",
    );
    // Collapsed by default (like the not-applicable list); the toggle reveals it. Its label is the
    // FIXED section heading ("Funktionalitäten") — only the arrow reflects the state.
    expect(mainList?.style.display).toBe("none");
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    expect(toggle?.textContent).toBe("\u25B8 Functionalities");

    toggle?.click();

    expect(mainList?.style.display).toBe("block");
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    expect(toggle?.textContent).toBe("\u25BE Functionalities");
  });

  it("focuses the listing's filter input right after a toggle button expands the list", () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detFunctionalities: { "Any.Thing": {} },
    };

    const rootEl = buildEditor("XTextField", {});
    // jsdom only tracks focus on elements attached to the live document.
    document.body.appendChild(rootEl);
    const section = funcSection(rootEl);
    const mainToggle = section.querySelector<HTMLButtonElement>(".codbi-func-config__show-all--main");
    const allToggle = section.querySelector<HTMLButtonElement>(
      ".codbi-func-config__show-all:not(.codbi-func-config__show-all--main)",
    );
    const mainFilter = section.querySelector<HTMLInputElement>(
      ".codbi-func-config__funclist .codbi-func-config__filter",
    );
    const allFilter = section.querySelector<HTMLInputElement>(
      ".codbi-func-config__funclist--all .codbi-func-config__filter",
    );

    // Expanding the APPLICABLE list puts the cursor into its filter box.
    mainToggle?.click();
    expect(document.activeElement).toBe(mainFilter);

    // Expanding the non-applicable list puts the cursor into ITS filter box.
    allToggle?.click();
    expect(document.activeElement).toBe(allFilter);

    document.body.removeChild(rootEl);
  });

  it("shows an activation notice instead of the config sections while the form-level CodBi is disabled", () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detFunctionalities: { "Any.Thing": {} },
    };

    // CodBi disabled for the form -> the three configurable sections are hidden and an activation
    // notice is shown in their place (the root stays visible so the watermark can render).
    TestState.designerInstance = {
      getSelectedMasterItem: () => ({ className: "XTextField", getPersist: () => ({ properties: {} }) }),
      getFormPropertyValueForCurrentLang: () => "0",
    };
    const hiddenRoot = buildEditor("XTextField", {});
    // The root itself stays visible (inline flex) so the CodBi watermark renders behind the notice.
    expect(hiddenRoot.style.display).not.toBe("none");
    const hiddenSections = hiddenRoot.querySelectorAll<HTMLElement>(".codbi-func-config__section");
    expect(hiddenSections.length).toBeGreaterThanOrEqual(3);
    hiddenSections.forEach((section) => expect(section.style.display).toBe("none"));
    const hint = hiddenRoot.querySelector<HTMLElement>(".codbi-func-config__disabled");
    expect(hint).not.toBeNull();
    expect(hint?.style.display).toBe("");
    expect(hint?.textContent ?? "").toContain("CodBi is not activated");

    // CodBi enabled for the form -> the sections are back and the notice is hidden.
    TestState.designerInstance = {
      getSelectedMasterItem: () => ({ className: "XTextField", getPersist: () => ({ properties: {} }) }),
      getFormPropertyValueForCurrentLang: () => "1",
    };
    const shownRoot = buildEditor("XTextField", {});
    shownRoot.querySelectorAll<HTMLElement>(".codbi-func-config__section").forEach((section) => {
      expect(section.style.display).toBe("");
    });
    expect(shownRoot.querySelector<HTMLElement>(".codbi-func-config__disabled")?.style.display).toBe("none");
  });

  it("re-reveals the panel immediately when the live CodBi enable checkbox is checked (no rebuild)", () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detFunctionalities: { "Any.Thing": {} },
    };

    // A live "CodBi aktiviert" checkbox in the DOM is the authoritative source, so toggling it must
    // update an ALREADY-BUILT editor immediately (the checkbox reflection, no save + reload).
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "form-codbi-prop-enable-input";
    checkbox.checked = false;
    document.body.appendChild(checkbox);

    TestState.designerInstance = {
      getSelectedMasterItem: () => ({ className: "XTextField", getPersist: () => ({ properties: {} }) }),
    };
    const rootEl = buildEditor("XTextField", {});
    const sections = rootEl.querySelectorAll<HTMLElement>(".codbi-func-config__section");
    const hint = rootEl.querySelector<HTMLElement>(".codbi-func-config__disabled");

    // Initially the box is unchecked -> hidden sections, visible notice.
    sections.forEach((section) => expect(section.style.display).toBe("none"));
    expect(hint?.style.display).toBe("");

    // Simulate the user ticking the box - the panel must flip WITHOUT rebuilding the editor.
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    sections.forEach((section) => expect(section.style.display).toBe(""));
    expect(hint?.style.display).toBe("none");

    // And although the saved form-property model still reports disabled, the live checkbox wins.
    expect(TestState.designerInstance?.getFormPropertyValueForCurrentLang).toBeUndefined();

    document.body.removeChild(checkbox);
  });
});

describe("ElementFunctionalityConfigEditor standard-configuration lists", () => {
  /** The ids shown in the standard-config section's rows for the given scoped selector. */
  function stdOptionIds(root: HTMLElement, selector: string): string[] {
    const section = root.querySelector(".codbi-func-config__section--standards");
    expect(section).not.toBeNull();
    return Array.from((section as HTMLElement).querySelectorAll(`${selector} .codbi-func-config__option`)).map(
      (row) => row.querySelector("span")?.textContent ?? "",
    );
  }

  it("splits the AVAILABLE standard configs into applicable and non-applicable lists by widget type", () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        // Fail-open: no `supportedFormelementtypes` ⇒ applies to ANY element.
        "Open.Any": { Active: true },
        // Declared for XTextField only ⇒ applicable to our XTextField.
        "Text.Box": { supportedFormelementtypes: ["XTextField", "XTextArea"] },
        // Declared for XContainer only ⇒ NOT applicable to our XTextField.
        "Panel.Wrap": { Active: true, supportedFormelementtypes: ["XContainer"] },
        // The form-level toggle state (`Active`) is NOT consulted for the per-element listing:
        // even an inactive config is listed (it is still an AVAILABLE standard configuration).
        "Off.Config": { Active: false, supportedFormelementtypes: ["XTextField"] },
      },
    };

    const rootEl = buildEditor("XTextField", {});

    // The applicable list: fail-open + both configs declared for a text field (regardless of Active).
    // Rows are sorted by id (Off.Config < Open.Any < Text.Box).
    expect(stdOptionIds(rootEl, ".codbi-func-config__options:not(.codbi-func-config__options--all)")).toEqual([
      "Off.Config",
      "Open.Any",
      "Text.Box",
    ]);
    // The complement: declared for XContainer only.
    expect(stdOptionIds(rootEl, ".codbi-func-config__options--all")).toEqual(["Panel.Wrap"]);
  });

  it("lists every available standard config even when no `Active` flag is present (plugin-provided metadata)", () => {
    TestState.language = "en";
    // The Configurations `.json` metadata injected by the plugin carries classes/globals/
    // supportedFormelementtypes but NO `Active` field. The per-element listing must still populate:
    // it must not depend on the form-level MultiSelect editor having set `Active`.
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        // Fail-open (no spec) ⇒ applicable to any element.
        "Open.Any": { Description: "any" },
        // Applicable to our XTextField.
        "Appointments.DateFrame": { supportedFormelementtypes: ["XTextField", "XSelect"] },
        // Container-only ⇒ NOT applicable to our XTextField.
        "UI.Panels": { supportedFormelementtypes: ["XContainer", "XFieldSet"] },
      },
    };

    const rootEl = buildEditor("XTextField", {});

    expect(stdOptionIds(rootEl, ".codbi-func-config__options:not(.codbi-func-config__options--all)")).toEqual([
      "Appointments.DateFrame",
      "Open.Any",
    ]);
    expect(stdOptionIds(rootEl, ".codbi-func-config__options--all")).toEqual(["UI.Panels"]);
  });

  it("lists the per-config CSS Classes (without a leading dot) instead of the config file names", () => {
    TestState.language = "en";
    // Each standard config provides CSS classes via `loadConfig`/`loadConfigs` (e.g. CodBi_NoFutureDate).
    // The panel must show those class names — not the config file id — and split them by widget type.
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        "Appointments.DateFrame": {
          classes: {
            CodBi_NoFutureDate: {
              description: "Prevents selecting future dates.",
              formelementtypes: ["XTextField", "XSelect"],
            },
            CodBi_DateFrame_1_Begin: {
              description: "The BEGIN date field.",
              formelementtypes: ["XTextField"],
            },
          },
        },
        "Financial.LDAP": {
          classes: {
            CodBi_LDAPField: { description: "The LDAP lookup field.", formelementtypes: ["XContainer"] },
          },
        },
      },
    };

    const rootEl = buildEditor("XTextField", {});

    // The applicable list shows the CSS classes of the XTextField-able Appointments config (in the
    // order the classes are declared in `classes`).
    expect(stdOptionIds(rootEl, ".codbi-func-config__options:not(.codbi-func-config__options--all)")).toEqual([
      "CodBi_NoFutureDate",
      "CodBi_DateFrame_1_Begin",
    ]);
    // The complement shows the CSS classes of the container-only Financial config.
    expect(stdOptionIds(rootEl, ".codbi-func-config__options--all")).toEqual(["CodBi_LDAPField"]);
    // Neither list shows the raw config file ids.
    expect(stdOptionIds(rootEl, ".codbi-func-config__options")).not.toContain("Appointments.DateFrame");
    expect(stdOptionIds(rootEl, ".codbi-func-config__options")).not.toContain("Financial.LDAP");
  });

  it("matches a config whose `supportedFormelementtypes` is a comma-separated STRING (manager channel)", () => {
    TestState.language = "en";
    // The local API-doc / manager channel can publish a standard config's `supportedFormelementtypes`
    // as a comma-joined STRING (e.g. "XSelect,XTextField") instead of an array. This must NOT be
    // treated as a single (never-matching) widget type `"XSelect,XTextField"` — the XTextField-able
    // classes must still land in the applicable list for an XTextField element.
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        "Appointments.DateFrame": {
          supportedFormelementtypes: "XSelect,XTextField",
          classes: { CodBi_NoFutureDate: "Prevents selecting future dates." },
        },
        "Financial.LDAP": {
          supportedFormelementtypes: "XContainer",
          classes: { CodBi_LDAPField: "The LDAP lookup field." },
        },
        "Print.Removal": {
          Description: "fail-open (no spec ⇒ any element)",
          classes: { CodBi_XLSXExport: "Removes fields in print." },
        },
      },
    };

    const rootEl = buildEditor("XTextField", {});

    // Appointments (declares XSelect + XTextField, even as a joined string) and fail-open Print
    // config are both applicable to our XTextField.
    expect(stdOptionIds(rootEl, ".codbi-func-config__options:not(.codbi-func-config__options--all)")).toEqual([
      "CodBi_NoFutureDate",
      "CodBi_XLSXExport",
    ]);
    // The container-only Financial config (single "XContainer" string) is NOT applicable.
    expect(stdOptionIds(rootEl, ".codbi-func-config__options--all")).toEqual(["CodBi_LDAPField"]);
  });

  it("re-renders the standard-config split when `setValue` is called (element changed)", () => {
    TestState.language = "en";
    // Regression: the standard-config listing depends on the currently selected element's widget
    // class. When Formcycle (re)assigns the value after a different element is selected, the listing
    // MUST recompute `applicability` for the NEW element instead of staying locked to the state from
    // construction time (when no element was selected, so only fail-open configs appeared applicable).
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        // Applicable only to XContainer — NOT to the initially-selected XTextField.
        "Panel.Wrap": {
          classes: { CodBi_Panel: { description: "P.", formelementtypes: ["XContainer"] } },
        },
        // Fail-open (no widget types) ⇒ applicable to ANY element.
        "Print.Removal": { classes: { CodBi_Print: "P." } },
      },
    };

    // Construct with an XTextField selected: only the fail-open config is applicable at first.
    TestState.designerInstance = {
      getSelectedMasterItem: () => ({
        className: "XTextField",
        getPersist: () => ({ properties: {} }),
      }),
    };
    const config = { designer: {} } as unknown as TEditorCfg<IElementFunctionalityConfigDescriptor>;
    const editor = new ElementFunctionalityConfigEditor(config);
    const rootEl = editor.getElement()[0] as HTMLElement;

    expect(stdOptionIds(rootEl, ".codbi-func-config__options:not(.codbi-func-config__options--all)")).toEqual([
      "CodBi_Print",
    ]);
    expect(stdOptionIds(rootEl, ".codbi-func-config__options--all")).toEqual(["CodBi_Panel"]);

    // The user now selects an XContainer; Formcycle calls `setValue` again.
    TestState.designerInstance = {
      getSelectedMasterItem: () => ({
        className: "XContainer",
        getPersist: () => ({ properties: {} }),
      }),
    };
    editor.setValue("");

    // Now the XContainer-only config must appear in the APPLICABLE list.
    expect(stdOptionIds(rootEl, ".codbi-func-config__options:not(.codbi-func-config__options--all)")).toEqual([
      "CodBi_Panel",
      "CodBi_Print",
    ]);
    // ...and no longer in the complement.
    expect(stdOptionIds(rootEl, ".codbi-func-config__options--all")).toEqual([]);
  });

  it("reads each class's widget types from the config's own `classes[class].formelementtypes` entries", () => {
    TestState.language = "en";
    // A regular config `.json` — as regenerated by the generator — folds each CSS-Class's widget list
    // into its OWN `classes[cssClass].formelementtypes` entry (the optimised shape), so the designer
    // decides applicability DIRECTLY from the `classes` map WITHOUT consulting the functionality
    // registry (`detFunctionalities`) at all. One config file may legitimately split its classes
    // across different widget types.
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        // `classes`/`funcs` share the CSS-Class names; each class carries its own description + list.
        "People.Alphanumeric": {
          classes: {
            CodBi_People_Alphanumeric: {
              description: "Regex input.",
              formelementtypes: ["XTextField"],
            },
            CodBi_OpenPLZ_Select_Localities: {
              description: "Locality select injection.",
              formelementtypes: ["XSelect"],
            },
          },
        },
        // A class mapped to MULTIPLE widget types applies if the element matches ANY of them.
        "Financial.LDAP": {
          classes: {
            CodBi_LDAPField: { description: "LDAP field.", formelementtypes: ["XSelect"] },
          },
        },
        "Print.Removal": {
          Description: "fail-open: a class absent a widget list applies to any element",
          classes: { CodBi_XLSXExport: "Removes fields in print." },
        },
      },
    };

    const rootEl = buildEditor("XTextField", {});

    // Applicable to our XTextField: the Regex class (declared ["XTextField"]) and the fail-open
    // class (absent from the map ⇒ any). Rows are sorted by id:
    // CodBi_People_Alphanumeric < CodBi_XLSXExport.
    expect(stdOptionIds(rootEl, ".codbi-func-config__options:not(.codbi-func-config__options--all)")).toEqual([
      "CodBi_People_Alphanumeric",
      "CodBi_XLSXExport",
    ]);
    // The XSelect-only classes (CodBi_OpenPLZ_Select_Localities and CodBi_LDAPField) land in the
    // complement — even though CodBi_OpenPLZ_Select_Localities is in the SAME config file as the
    // XTextField-able CodBi_People_Alphanumeric (proving per-class derivation, not per-file).
    expect(stdOptionIds(rootEl, ".codbi-func-config__options--all")).toEqual([
      "CodBi_LDAPField",
      "CodBi_OpenPLZ_Select_Localities",
    ]);
  });

  it("keeps the standard-config second list hidden until its toggle is clicked", () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        "Panel.Wrap": { Active: true, supportedFormelementtypes: ["XContainer"] },
      },
    };

    const rootEl = buildEditor("XTextField", {});
    const section = rootEl.querySelector(".codbi-func-config__section--standards") as HTMLElement;
    const allList = section.querySelector<HTMLElement>(".codbi-func-config__funclist--all");
    const toggle = section.querySelector<HTMLButtonElement>(".codbi-func-config__show-all--std");

    // Explains what the button is for (native tooltip).
    expect(toggle?.title).toBe(
      "Shows further standard configurations that are not declared as applicable to the selected element.",
    );
    expect(allList?.style.display).toBe("none");
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    // The label is state-INDEPENDENT ("Mehr Standard-Konfigurationen"); only the arrow changes.
    expect(toggle?.textContent).toBe("\u25B8 More standard configurations");

    toggle?.click();

    expect(allList?.style.display).toBe("block");
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    expect(toggle?.textContent).toBe("\u25BE More standard configurations");
  });

  it("hides the APPLICABLE standard-config list behind its own toggle (collapsed by default)", () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        "Text.Box": { classes: { CodBi_TextRegex: { description: "x", formelementtypes: ["XTextField"] } } },
      },
    };

    const rootEl = buildEditor("XTextField", {});
    const section = rootEl.querySelector(".codbi-func-config__section--standards") as HTMLElement;
    const mainList = section.querySelector<HTMLElement>(
      ".codbi-func-config__funclist:not(.codbi-func-config__funclist--all)",
    );
    const toggle = section.querySelector<HTMLButtonElement>(".codbi-func-config__show-all--main");

    // Explains what the button is for (native tooltip).
    expect(toggle?.title).toBe(
      "Shows the standard configurations applicable to the selected element. Click to show/hide the list.",
    );
    // Collapsed by default (like the not-applicable list); the toggle reveals it. Its label is the
    // FIXED section heading ("Standard-Konfigurationen") — only the arrow reflects the state.
    expect(mainList?.style.display).toBe("none");
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    expect(toggle?.textContent).toBe("\u25B8 Standard configurations");

    toggle?.click();

    expect(mainList?.style.display).toBe("block");
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    expect(toggle?.textContent).toBe("\u25BE Standard configurations");
  });

  it("renders an id-only config row as read-only (no per-element checkbox)", () => {
    TestState.language = "en";
    // A config that provides NO CSS classes falls back to its id as a row. An id is not a class, so
    // there is nothing to apply to the element — the row stays informational (no checkbox).
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        "Text.Box": { Active: true, supportedFormelementtypes: ["XTextField"] },
      },
    };

    const rootEl = buildEditor("XTextField", {});
    const section = rootEl.querySelector(".codbi-func-config__section--standards") as HTMLElement;
    const row = section.querySelector<HTMLElement>(".codbi-func-config__option");

    expect(row?.classList.contains("codbi-func-config__option--readonly")).toBe(true);
    expect(row?.querySelector("input[type=checkbox]")).toBeNull();
  });

  it("applies/removes a standard-config class on the element through its checkbox", () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        Appointments: {
          classes: {
            CodBi_NoFutureDate: { description: "Prevents selecting future dates.", formelementtypes: ["XTextField"] },
          },
        },
      },
    };

    // A pre-existing UNRELATED class must survive every toggle untouched.
    const properties: Record<string, unknown> = { cssclasses: ["MyOwnClass"] };
    const rootEl = buildEditor("XTextField", properties);
    const section = rootEl.querySelector(".codbi-func-config__section--standards") as HTMLElement;
    const mainRow = ".codbi-func-config__options:not(.codbi-func-config__options--all) .codbi-func-config__option";

    // The row carries a real checkbox (styled by `.codbi-func-config__option input[type=checkbox]`),
    // initially unchecked because the element does not carry the class yet.
    let checkbox = section.querySelector<HTMLInputElement>(`${mainRow} input[type=checkbox]`);
    expect(checkbox).not.toBeNull();
    expect(checkbox?.checked).toBe(false);

    // Checking it APPLIES the class to the element (and keeps the unrelated one).
    checkbox!.checked = true;
    checkbox!.dispatchEvent(new Event("change"));
    expect(properties.cssclasses).toEqual(["MyOwnClass", "CodBi_NoFutureDate"]);

    // The re-rendered row reflects the applied state.
    checkbox = section.querySelector<HTMLInputElement>(`${mainRow} input[type=checkbox]`);
    expect(checkbox?.checked).toBe(true);

    // Unchecking removes ONLY that class again.
    checkbox!.checked = false;
    checkbox!.dispatchEvent(new Event("change"));
    expect(properties.cssclasses).toEqual(["MyOwnClass"]);
  });

  it("narrows BOTH standard-configuration listings to the applied classes (only checked)", () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        Appointments: {
          classes: { CodBi_NoFutureDate: { description: "x", formelementtypes: ["XTextField"] } },
        },
        "Text.Box": {
          classes: { CodBi_TextRegex: { description: "y", formelementtypes: ["XTextField"] } },
        },
        // Declared for containers only → lands in the second (not-applicable) listing.
        "Panel.Wrap": {
          classes: { CodBi_Panel: { description: "Panel.", formelementtypes: ["XContainer"] } },
        },
      },
    };

    const rootEl = buildEditor("XTextField", { cssclasses: ["CodBi_NoFutureDate"] });
    const section = rootEl.querySelector(".codbi-func-config__section--standards") as HTMLElement;
    const mainList = ".codbi-func-config__options:not(.codbi-func-config__options--all)";
    const allList = ".codbi-func-config__options--all";
    // EVERY listing has its own "only checked" toggle, right of its filter input.
    const filterRows = section.querySelectorAll<HTMLElement>(".codbi-func-config__filterrow");
    expect(filterRows.length).toBe(2);
    expect(filterRows[0].firstElementChild?.classList.contains("codbi-func-config__filter")).toBe(true);
    const only = filterRows[0].querySelector<HTMLButtonElement>(".codbi-func-config__only");
    const onlyAll = filterRows[1].querySelector<HTMLButtonElement>(".codbi-func-config__only");

    expect(only?.textContent).toBe("\u2713");
    expect(onlyAll?.textContent).toBe("\u2713");
    expect(only?.getAttribute("aria-pressed")).toBe("false");
    // Everything is listed while the toggles are off.
    expect(stdOptionIds(rootEl, mainList)).toEqual(["CodBi_NoFutureDate", "CodBi_TextRegex"]);
    expect(stdOptionIds(rootEl, allList)).toEqual(["CodBi_Panel"]);

    only?.click();

    // Only the class APPLIED to the element survives in the applicable list.
    expect(stdOptionIds(rootEl, mainList)).toEqual(["CodBi_NoFutureDate"]);
    expect(only?.getAttribute("aria-pressed")).toBe("true");
    expect(only?.classList.contains("codbi-func-config__only--active")).toBe(true);
    // The other listing keeps its own (still off) state.
    expect(stdOptionIds(rootEl, allList)).toEqual(["CodBi_Panel"]);
    expect(onlyAll?.getAttribute("aria-pressed")).toBe("false");

    only?.click();

    expect(stdOptionIds(rootEl, mainList)).toEqual(["CodBi_NoFutureDate", "CodBi_TextRegex"]);
    expect(only?.getAttribute("aria-pressed")).toBe("false");

    // The second listing's own toggle narrows THAT listing: nothing there is applied → empty.
    onlyAll?.click();
    expect(stdOptionIds(rootEl, allList)).toEqual([]);
    expect(onlyAll?.getAttribute("aria-pressed")).toBe("true");
    expect(stdOptionIds(rootEl, mainList)).toEqual(["CodBi_NoFutureDate", "CodBi_TextRegex"]);
  });

  it("asks before activating a NOT activated configuration when its class is applied", () => {
    TestState.language = "en";
    const setStandardsValue = jest.fn();
    // The draft sync the CSS-class writer normally nudges: while the question is OPEN it must NOT run,
    // otherwise FORMCYCLE re-renders the element preview under the modal (clipped preview + its own
    // preview menu reappearing).
    const checkForChanges = jest.fn();
    TestState.designerInstance = { getPersistDiffer: () => ({ checkForChanges }) };
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        Appointments: {
          classes: { CodBi_NoFutureDate: { description: "x", formelementtypes: ["XTextField"] } },
        },
      },
      setStandardsValue,
    };

    const properties: Record<string, unknown> = { cssclasses: [] };
    const rootEl = buildEditor("XTextField", properties);
    const section = rootEl.querySelector(".codbi-func-config__section--standards") as HTMLElement;
    const mainCheckbox = ".codbi-func-config__options:not(.codbi-func-config__options--all) input[type=checkbox]";

    // Applying the class applies it right away (it stays a marker until the configuration is active) …
    const checkbox = section.querySelector<HTMLInputElement>(mainCheckbox);
    checkbox!.checked = true;
    checkbox!.dispatchEvent(new Event("change"));
    expect(properties.cssclasses).toEqual(["CodBi_NoFutureDate"]);

    // … and a dialog ASKS whether the owning configuration shall be activated, naming the classes it
    // provides. Nothing is activated before the user confirms.
    // Nothing was synced/re-rendered yet — the user has not answered the question.
    expect(checkForChanges).not.toHaveBeenCalled();

    const dialog = document.querySelector(".codbi-std-activate-dialog") as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(Array.from(dialog.querySelectorAll("li")).map((entry) => entry.textContent)).toEqual(["CodBi_NoFutureDate"]);
    // Every listed class carries its SHORT DESCRIPTION as a tooltip (prefixed with the config path).
    const listedClass = dialog.querySelector("li") as HTMLElement;
    expect(listedClass.title.startsWith("Appointments › ")).toBe(true);
    expect(listedClass.title).toContain("x");
    expect(setStandardsValue).not.toHaveBeenCalled();

    (dialog.querySelector(".codbi-std-activate-dialog__confirm") as HTMLButtonElement).click();
    expect(setStandardsValue).toHaveBeenCalledWith("Appointments");
    expect(document.querySelector(".codbi-std-activate-overlay")).toBeNull();
    // Answering the question flushes the deferred draft sync exactly once.
    expect(checkForChanges).toHaveBeenCalledTimes(1);
  });

  it("does not activate the configuration when the dialog is dismissed", () => {
    TestState.language = "en";
    const setStandardsValue = jest.fn();
    const checkForChanges = jest.fn();
    TestState.designerInstance = { getPersistDiffer: () => ({ checkForChanges }) };
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        Appointments: {
          classes: { CodBi_NoFutureDate: { description: "x", formelementtypes: ["XTextField"] } },
        },
      },
      setStandardsValue,
    };

    const properties: Record<string, unknown> = { cssclasses: [] };
    const rootEl = buildEditor("XTextField", properties);
    const section = rootEl.querySelector(".codbi-func-config__section--standards") as HTMLElement;
    const checkbox = section.querySelector<HTMLInputElement>(
      ".codbi-func-config__options:not(.codbi-func-config__options--all) input[type=checkbox]",
    );
    checkbox!.checked = true;
    checkbox!.dispatchEvent(new Event("change"));

    const cancel = document.querySelector(".codbi-std-activate-dialog__cancel") as HTMLButtonElement;
    expect(cancel).not.toBeNull();
    cancel.click();

    // Dismissed: the configuration stays inactive, the class stays applied (the row stays dimmed) …
    expect(setStandardsValue).not.toHaveBeenCalled();
    expect(document.querySelector(".codbi-std-activate-overlay")).toBeNull();
    expect(properties.cssclasses).toEqual(["CodBi_NoFutureDate"]);
    // … and the deferred draft sync runs when the question is dismissed, not while it was open.
    expect(checkForChanges).toHaveBeenCalledTimes(1);
  });

  it("dims the classes of NOT activated configurations and offers an activate button", () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        // Not active for the form (neither persisted nor flagged `Active`).
        Appointments: {
          classes: { CodBi_NoFutureDate: { description: "x", formelementtypes: ["XTextField"] } },
        },
        // Active for the form.
        "Text.Box": {
          Active: true,
          classes: { CodBi_TextRegex: { description: "y", formelementtypes: ["XTextField"] } },
        },
      },
    };

    const rootEl = buildEditor("XTextField", {});
    const section = rootEl.querySelector(".codbi-func-config__section--standards") as HTMLElement;
    const rowOf = (label: string): HTMLElement | undefined =>
      Array.from(section.querySelectorAll<HTMLElement>(".codbi-func-config__option")).find(
        (row) => row.querySelector("span")?.textContent === label,
      );

    const inactiveRow = rowOf("CodBi_NoFutureDate");
    expect(inactiveRow?.classList.contains("codbi-func-config__option--inactive")).toBe(true);
    expect(inactiveRow?.querySelector(".codbi-func-config__std-activate")).not.toBeNull();

    const activeRow = rowOf("CodBi_TextRegex");
    expect(activeRow?.classList.contains("codbi-func-config__option--inactive")).toBe(false);
    expect(activeRow?.querySelector(".codbi-func-config__std-activate")).toBeNull();
  });

  it("prefixes the row tooltip with the full standard-configuration path", () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        Appointments: {
          classes: {
            CodBi_NoFutureDate: { description: "Prevents future dates.", formelementtypes: ["XTextField"] },
          },
        },
      },
    };

    const rootEl = buildEditor("XTextField", {});
    const row = rootEl.querySelector<HTMLElement>(".codbi-func-config__section--standards .codbi-func-config__option");

    // The user must see WHICH configuration has to be activated for the class to work.
    expect(row?.title.startsWith("Appointments › ")).toBe(true);
    expect(row?.title).toContain("Prevents future dates.");
    expect(row?.title).toContain("NOT activated");
  });

  it("localizes the row tooltip from the class's own descriptionDe (classes without a functionality)", () => {
    TestState.language = "de";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        Appointments: {
          classes: {
            // A MARKER class: it applies no functionality, so there is no localized functionality
            // summary to fall back to — only the hand-authored `descriptionDe` translates it.
            CodBi_Date_Time_Join_Date: {
              description: "Apply to the DATE input field of a date/time pair.",
              descriptionDe: "Auf das DATUMS-Eingabefeld eines Datum/Zeit-Paares anwenden.",
              descriptionIt: "Applicare al campo data di una coppia data/ora.",
              formelementtypes: ["XTextField"],
            },
          },
        },
      },
    };

    const rootEl = buildEditor("XTextField", {});
    const row = rootEl.querySelector<HTMLElement>(".codbi-func-config__section--standards .codbi-func-config__option");

    expect(row?.title).toContain("Appointments › Auf das DATUMS-Eingabefeld eines Datum/Zeit-Paares anwenden.");
    expect(row?.title).not.toContain("Apply to the DATE input field");
  });

  it("falls back to the localized functionality summary, and keeps English for an English designer", () => {
    TestState.language = "de";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detFunctionalities: {
        "date.min": { Summary: { en: "EN summary.", de: "DE Zusammenfassung." } },
      },
      detStandards: {
        Appointments: {
          classes: {
            CodBi_NoFutureDate: { description: "Prevents future dates.", formelementtypes: ["XTextField"] },
          },
          funcs: { CodBi_NoFutureDate: "Date.Min" },
        },
      },
    };

    const rootEl = buildEditor("XTextField", {});
    const germanRow = rootEl.querySelector<HTMLElement>(
      ".codbi-func-config__section--standards .codbi-func-config__option",
    );
    // No `descriptionDe` → the LOCALIZED functionality summary is used instead of the English text.
    expect(germanRow?.title).toContain("Appointments › DE Zusammenfassung.");

    // The same class in an ENGLISH designer keeps the published (English) class description.
    TestState.language = "en";
    const englishRoot = buildEditor("XTextField", {});
    const englishRow = englishRoot.querySelector<HTMLElement>(
      ".codbi-func-config__section--standards .codbi-func-config__option",
    );
    expect(englishRow?.title).toContain("Appointments › Prevents future dates.");
  });

  it("activates the configuration through the row's activate button without applying the class", () => {
    TestState.language = "en";
    const setStandardsValue = jest.fn();
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        Appointments: {
          classes: { CodBi_NoFutureDate: { description: "x", formelementtypes: ["XTextField"] } },
        },
      },
      setStandardsValue,
    };

    const properties: Record<string, unknown> = { cssclasses: [] };
    const rootEl = buildEditor("XTextField", properties);
    const section = rootEl.querySelector(".codbi-func-config__section--standards") as HTMLElement;
    const activate = section.querySelector<HTMLButtonElement>(".codbi-func-config__std-activate");

    expect(activate).not.toBeNull();
    expect(activate?.title).toContain("CodBi_NoFutureDate");
    activate!.click();

    expect(setStandardsValue).toHaveBeenCalledWith("Appointments");
    // The button must never toggle the surrounding row's checkbox.
    expect(properties.cssclasses).toEqual([]);

    // The listing reflects the activation immediately: the row is no longer dimmed.
    const row = Array.from(section.querySelectorAll<HTMLElement>(".codbi-func-config__option")).find(
      (candidate) => candidate.querySelector("span")?.textContent === "CodBi_NoFutureDate",
    );
    expect(row?.classList.contains("codbi-func-config__option--inactive")).toBe(false);
    expect(row?.querySelector(".codbi-func-config__std-activate")).toBeNull();
  });

  it("keeps a class the element already carries in the applicable list (checked) although its type excludes it", () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        // Declared for containers only — yet the XTextField below already carries the class.
        "Panel.Wrap": { classes: { CodBi_Panel: { description: "Panel.", formelementtypes: ["XContainer"] } } },
      },
    };

    const rootEl = buildEditor("XTextField", { cssclasses: ["CodBi_Panel"] });
    const section = rootEl.querySelector(".codbi-func-config__section--standards") as HTMLElement;
    const mainList = ".codbi-func-config__options:not(.codbi-func-config__options--all)";

    // Shown (and checked) in the MAIN list so the applied class can be unchecked, never hidden.
    expect(stdOptionIds(rootEl, mainList)).toEqual(["CodBi_Panel"]);
    expect(stdOptionIds(rootEl, ".codbi-func-config__options--all")).toEqual([]);
    const checkbox = section.querySelector<HTMLInputElement>(`${mainList} input[type=checkbox]`);
    expect(checkbox?.checked).toBe(true);
  });

  it('excludes holistic standard configs (the "Holistic" keyword) from both listings', () => {
    TestState.language = "en";
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detStandards: {
        // A regular config applicable to our XTextField.
        "Text.Box": { Active: true, supportedFormelementtypes: ["XTextField"] },
        // A holistic config: no per-element listing, even though it is active.
        "Holistic.RegEx": { Active: true, supportedFormelementtypes: ["Holistic"] },
        // The keyword is matched case-insensitively.
        "Holistic.Cleave": { Active: true, supportedFormelementtypes: ["holistic"] },
      },
    };

    const rootEl = buildEditor("XTextField", {});

    const applicable = stdOptionIds(rootEl, ".codbi-func-config__options:not(.codbi-func-config__options--all)");
    const complement = stdOptionIds(rootEl, ".codbi-func-config__options--all");

    // Only the regular config is listed; the holistic ones never appear.
    expect(applicable).toEqual(["Text.Box"]);
    expect(complement).toEqual([]);
    expect([...applicable, ...complement]).not.toContain("Holistic.RegEx");
    expect([...applicable, ...complement]).not.toContain("Holistic.Cleave");
  });
});

describe("refreshElementFunctionalityConfig (post-sync panel refresh)", () => {
  it("re-renders the mounted config panel through its own `setValue`", () => {
    let called = false;
    TestState.designerInstance = {
      getSelectedMasterItem: () => ({ className: "XTextField", getPersist: () => ({ properties: {} }) }),
      getPropertyView: () => ({
        getEditorForProperty: (property: string) =>
          property === ELEMENT_FUNCS_PROPERTY
            ? {
                setValue: () => {
                  called = true;
                },
              }
            : undefined,
      }),
    };

    refreshElementFunctionalityConfig();

    // Reaching the panel is the whole point: `setValue` rebuilds both listings from the (just synced)
    // `detFunctionalities`, so the changed applicability shows without a designer reload.
    expect(called).toBe(true);
  });

  it("is published on window.CodbiPluginData so the local API-doc manager can call it", () => {
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detFunctionalities: {},
      detStandards: {},
    };

    registerElementFunctionalityProperties();

    const published = (window as unknown as { CodbiPluginData: { refreshElementConfig?: unknown } }).CodbiPluginData
      .refreshElementConfig;
    expect(typeof published).toBe("function");
  });
});

describe("paramsToRemoveForRemovedFunctionality", () => {
  /** Two functionalities sharing the `Unit` parameter, each with one unique parameter. */
  function seedFunctionalities(): void {
    (window as unknown as { CodbiPluginData?: unknown }).CodbiPluginData = {
      detFunctionalities: {
        "Alpha.One": { Parameter: { Unit: "The unit", AlphaOnly: "Only Alpha" } },
        "Beta.Two": { Parameter: { Unit: "The unit", BetaOnly: "Only Beta" } },
        "No.Params": {},
      },
    };
  }

  it("keeps a shared parameter and drops the removed functionality's unique parameter", () => {
    seedFunctionalities();
    // Removing Alpha.One (Beta.Two stays active): `Unit` is still needed by Beta.Two, `AlphaOnly` is not.
    expect(paramsToRemoveForRemovedFunctionality("Alpha.One", ["beta.two"])).toEqual(["data-cb-AlphaOnly"]);
  });

  it("is symmetric: dropping the other functionality drops its unique parameter", () => {
    seedFunctionalities();
    expect(paramsToRemoveForRemovedFunctionality("Beta.Two", ["alpha.one"])).toEqual(["data-cb-BetaOnly"]);
  });

  it("matches parameters case-insensitively across functionalities", () => {
    seedFunctionalities();
    // `unit` (lowercase) is the same shared parameter; only the removed one's unique param is dropped.
    expect(paramsToRemoveForRemovedFunctionality("Alpha.One", ["Beta.Two"])).toEqual(["data-cb-AlphaOnly"]);
  });

  it("returns nothing for a functionality without parameters", () => {
    seedFunctionalities();
    expect(paramsToRemoveForRemovedFunctionality("No.Params", ["alpha.one"])).toEqual([]);
  });
});
