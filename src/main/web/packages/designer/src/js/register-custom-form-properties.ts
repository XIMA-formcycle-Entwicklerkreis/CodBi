import {
  registerCustomFormProperty,
  type IEditorMap,
  type IPropertyDependencyDescriptor,
} from "@de-xima/fc-form-designer";
import { parseBoolean, recordValues } from "@de-xima/xima-common-js-lang";

import { CodbiConfigTemplate, Constants } from "codbi-common";
import { SelectMultiSelectType } from "./MultiSelect";
import { i18n } from "./i18n.js";

const WhenCodBiEnabled: IPropertyDependencyDescriptor<
  keyof IEditorMap,
  [(typeof Constants)["designer.property.enable_codbi"]]
> = {
  dependencies: [Constants["designer.property.enable_codbi"]],
  test: (params) => parseBoolean(params.values[Constants["designer.property.enable_codbi"]]),
};

/**
 * Registers the custom properties for configuring the code library.
 */
export function registerCustomFormProperties(): void {
  // Whether the code library is enabled
  registerCustomFormProperty({
    editor: "CheckboxEditor",
    cat: Constants["designer.category.codbi_panel"],
    property: Constants["designer.property.enable_codbi"],
    label: i18n("designer.property.enable_codbi"),
  });

  // Configuration template
  registerCustomFormProperty({
    editor: "SelectEditor",
    cat: Constants["designer.category.codbi_panel"],
    property: Constants["designer.property.config_template"],
    label: i18n("designer.property.config_template"),
    options: recordValues(CodbiConfigTemplate).map((configTemplateName) => ({
      text: i18n(`designer.property.config_template.option.${configTemplateName}`),
      value: configTemplateName,
    })),
    availableIf: WhenCodBiEnabled,
  });

  // Standard Configurations
  registerCustomFormProperty({
    editor: SelectMultiSelectType,
    cat: Constants["designer.category.codbi_panel"],
    property: Constants["designer.property.standards"],
    label: i18n("designer.property.standards"),
    options: recordValues(CodbiConfigTemplate).map((standardConfiguration) => ({
      text: i18n(`designer.property.config_template.option.${standardConfiguration}`),
      value: standardConfiguration,
    })),
    availableIf: WhenCodBiEnabled,
  });
}
