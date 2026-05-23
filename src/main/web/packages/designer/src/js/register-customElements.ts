// #region Imports
// #region XIMA
import { registerCustomEditor } from "@de-xima/fc-form-designer";
// #endregion XIMA
import { enableLocalDocInterface } from "./LocalDocInterface.js";
import { enableAIWorkflowAssistantDialog } from "./AIWorkflowAssistantDialog.js";
import { enableAICodBiAssistantDialog } from "./AICodBiAssistantDialog.js";
import { MultiSelect, MultiSelectType } from "./MultiSelect";
// #endregion Imports
/** Registers the {@link MultiSelect }-Editor via {@link registerCustomEditor }. */
export function registerCustomElements(): void {
  registerCustomEditor(MultiSelectType, MultiSelect);
  enableLocalDocInterface();
  enableAIWorkflowAssistantDialog(); // no-op: replaced by AICodBiAssistantDialog
  enableAICodBiAssistantDialog();
}
