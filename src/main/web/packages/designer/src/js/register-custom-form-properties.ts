import {
  registerCustomEditor,
  registerCustomFormProperty,
  type IEditorMap,
  type IPropertyDependencyDescriptor,
} from "@de-xima/fc-form-designer";
import { parseBoolean, recordValues } from "@de-xima/xima-common-js-lang";
import { CodbiConfigTemplate, Constants } from "codbi-common";
import { CodbiSwitchEditor, CodbiSwitchEditorType } from "./CodbiSwitchEditor.js";
import { MultiSelectType } from "./MultiSelect.js";
import { i18n } from "./i18n.js";
/** Defines whether the CodBi is enabled or not (for usage in {@link registerCustomFormProperties }).*/
const WhenCodBiEnabled: IPropertyDependencyDescriptor<
  keyof IEditorMap,
  [(typeof Constants)["designer.property.enable_codbi"]]
> = {
  dependencies: [Constants["designer.property.enable_codbi"]],
  test: (params) => parseBoolean(params.values[Constants["designer.property.enable_codbi"]]),
};
/** Registers the custom properties for configuring the code library. */
export function registerCustomFormProperties(): void {
  // The slider-switch editor used by the "Mark CodBi elements" property below.
  try {
    registerCustomEditor(CodbiSwitchEditorType, CodbiSwitchEditor);
  } catch (x) {
    console.error("[CodBi] Failed to register the slider switch editor", x);
  }
  // Whether the code library is enabled
  registerCustomFormProperty({
    editor: "CheckboxEditor",
    cat: Constants["designer.category.codbi_panel"],
    property: Constants["designer.property.enable_codbi"],
    label: i18n("designer.property.enable_codbi"),
  });
  // "Mark CodBi elements in the designer": paints CodBi overlays (e.g. the Mirror badge) onto the
  // design canvas. Rendered as a slider switch and also toggled globally with ALT+V (see
  // `CodbiElementMarkers.ts`).
  registerCustomFormProperty({
    editor: CodbiSwitchEditorType,
    cat: Constants["designer.category.codbi_panel"],
    property: Constants["designer.property.mark_elements"],
    label: i18n("designer.property.mark_elements"),
    // Tooltip on the editor (the label/switch itself also carry it, see `CodbiSwitchEditor`).
    title: "ALT + V",
    availableIf: WhenCodBiEnabled,
  });
  // "Preview mode": when enabled, a preview switch appears on every form element in the design
  // canvas so each element's CodBi functionalities can be previewed in isolation (see
  // `CodbiElementMarkers.ts`).
  registerCustomFormProperty({
    editor: CodbiSwitchEditorType,
    cat: Constants["designer.category.codbi_panel"],
    property: Constants["designer.property.preview_elements"],
    label: i18n("designer.property.preview_elements"),
    availableIf: WhenCodBiEnabled,
    // The companion "always show the reference" (= detailed) switch belongs next to the "Mark
    // elements" marker switch only; do NOT duplicate it after the preview switch.
    showCompanion: false,
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
    editor: MultiSelectType,
    cat: Constants["designer.category.codbi_panel"],
    property: Constants["designer.property.standards"],
    label: i18n("designer.property.standards"),
    availableIf: WhenCodBiEnabled,
  });
}
