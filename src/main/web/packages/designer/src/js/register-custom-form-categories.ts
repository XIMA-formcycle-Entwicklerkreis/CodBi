import { firstIndex } from "@de-xima/xima-common-js-lang";

import { registerCustomFormCategory } from "@de-xima/fc-form-designer";

import { Constants } from "codbi-common";

import { i18n } from "./i18n.js";

/**
 * Registers all form properties for the code library.
 *
 * This plugin adds several properties to the form tab of the designer that lets
 * the user edit several settings related to the code library.
 */
export function registerCustomFormCategories(): void {
  registerCustomFormCategory(
    {
      id: Constants["designer.category.codbi_panel"],
      label: i18n("designer.category.codbi_panel"),
      help: { type: "url", url: Constants["designer.category.codbi_panel.help"] },
    },
    (cats) => firstIndex(cats, (cat) => cat.id === "formSeo") ?? 2,
  );
}
