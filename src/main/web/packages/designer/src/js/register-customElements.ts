import { registerCustomEditor } from "@de-xima/fc-form-designer";
import { MultiSelect, MultiSelectType } from "./MultiSelect";
/** Registers the {@link MultiSelect }-Editor via {@link registerCustomEditor }. */
export function registerCustomElements(): void {
  registerCustomEditor(MultiSelectType, MultiSelect);
}
