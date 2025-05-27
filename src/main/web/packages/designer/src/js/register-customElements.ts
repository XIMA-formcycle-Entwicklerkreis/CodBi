import { registerCustomEditor } from "@de-xima/fc-form-designer";
import { MultiSelect, SelectMultiSelectType } from "./MultiSelect";

export function registerCustomElements(): void {
  registerCustomEditor(SelectMultiSelectType, MultiSelect);
}
