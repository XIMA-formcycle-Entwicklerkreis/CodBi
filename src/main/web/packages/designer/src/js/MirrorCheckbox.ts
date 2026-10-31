// #region Imports
import { $, Callbacks, Editors, type IPropertyDescriptor, type TEditorCfg } from "@de-xima/fc-form-designer";
import { refreshAllMirrors } from "./MirrorChildItems.js";
// #endregion Imports

/**
 * Custom **checkbox** editor for boolean Mirror widget options.
 *
 * A plain `<input type="checkbox">` is used instead of the designer's built-in `CheckboxEditor`
 * because the built-in editor is not rendered inside the item property panel for plugin widgets —
 * the registered custom editors of this plugin are. The stored value follows FORMCYCLE's convention:
 * `"1"` = checked, `"0"` = unchecked.
 */

/** Editor type for the Mirror widget's boolean options. */
export const MirrorCheckboxType = "com.github.xima_formcycle_entwicklerkreis.fc.plugin:fc-plugin-codbi:MirrorCheckbox";

/** Describes {@link MirrorCheckboxType}. */
export interface IMirrorCheckboxDescriptor extends IPropertyDescriptor<typeof MirrorCheckboxType> {}

/** Augments **@de-xima/fc-form-designer** so the editor is known to the {@link IEditorMap}. */
declare module "@de-xima/fc-form-designer" {
  export interface IEditorMap {
    [MirrorCheckboxType]: {
      descriptor: IMirrorCheckboxDescriptor;
      editor: MirrorCheckbox;
      value: string;
    };
  }
}

/** The minimal item shape this editor reads (persisted property bag). */
interface IMirrorCheckboxItem {
  properties?: Record<string, unknown>;
  getPersist?: () => { properties?: Record<string, unknown> } | undefined;
}

/** @returns the selected item's persisted property bag (empty when unavailable). */
function selectedProperties(designer: unknown): Record<string, unknown> {
  try {
    const item = (
      designer as { getSelectedMasterItem?: () => IMirrorCheckboxItem | undefined }
    )?.getSelectedMasterItem?.();
    return item?.getPersist?.()?.properties ?? item?.properties ?? {};
  } catch {
    return {};
  }
}

/** @returns whether a stored property value means "checked". */
function isChecked(value: unknown): boolean {
  return value === true || value === "1" || value === "true";
}

/** Checkbox editor for the Mirror widget's boolean options. */
export class MirrorCheckbox extends Editors.BaseEditor<typeof MirrorCheckboxType> {
  private readonly input: HTMLInputElement;
  private _value = "0";

  constructor(config: TEditorCfg<IMirrorCheckboxDescriptor>) {
    super(config, "0", "checkbox");
    this.input = document.createElement("input");
    this.input.type = "checkbox";
    this.input.className = "codbi-mirror-checkbox";
    this.input.title = String(config.label ?? "");
    this.input.addEventListener("change", () => {
      this._value = this.input.checked ? "1" : "0";
      Callbacks["set-property"].fire(this.config.property, this._value, this);
      // Re-run the Mirror sync so the option also takes effect for already materialized children
      // (the sync applies the triggered workflow paths server-side when it is enabled).
      try {
        void refreshAllMirrors(this.config.designer);
      } catch {
        /* ignore — the option is persisted regardless */
      }
    });

    // Seed from the item's persisted value so an existing setting is shown immediately.
    this.setValue(selectedProperties(this.config.designer)[this.config.property]);
  }

  getElement(): JQuery {
    return $(this.input);
  }

  getValue(): string {
    return this._value;
  }

  setValue(value: unknown): void {
    this._value = isChecked(value) ? "1" : "0";
    this.input.checked = this._value === "1";
  }
}
