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

/** Id of the injected stylesheet that renders the Mirror options as switches. */
const TOGGLE_STYLE_ID = "codbi-mirror-toggle-style";

/**
 * Renders the Mirror widget's boolean options as **toggle switches** instead of native
 * checkboxes.
 *
 * The editor inserts a bare `<input type="checkbox" class="codbi-mirror-checkbox">` into the item
 * property panel, so the switch look is pure CSS on that one class (a native checkbox cannot carry
 * a `::after` knob and there is no stylesheet for the designer panel). The style block is injected
 * once and keyed by [TOGGLE_STYLE_ID], so repeated registrations and re-renders do not stack it.
 *
 * CodBi orange (`#ff8c00`) matches the workflow Mirror node accent.
 */
export function ensureMirrorToggleStyle(): void {
  try {
    if (typeof document === "undefined" || document.getElementById(TOGGLE_STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = TOGGLE_STYLE_ID;
    style.textContent = `
.codbi-mirror-checkbox {
  appearance: none;
  -webkit-appearance: none;
  position: relative;
  width: 38px;
  height: 20px;
  margin: 0;
  border: 1px solid #000;
  border-radius: 999px;
  background: #55555555;
  cursor: pointer;
  transition: background-color 0.25s ease-in-out, border-color 0.25s ease-in-out;
  vertical-align: middle;
}
.codbi-mirror-checkbox::after {
  content: "";
  position: absolute;
  top: 50%;
  margin-top: -8px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #000;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  transition: left 0.25s ease-in-out;
}
.codbi-mirror-checkbox:checked {
  border-color: #ff8c00;
}
.codbi-mirror-checkbox:checked::after {
  left: 20px;
  background: #ff8c00;
}
.codbi-mirror-checkbox:focus-visible {
  outline: 2px solid #ff8c00;
  outline-offset: 2px;
}
.codbi-mirror-checkbox:disabled {
  opacity: 0.45;
  cursor: default;
}
`;
    document.head.appendChild(style);
  } catch (x) {
    console.error("[CodBi] Failed to install the Mirror toggle style", x);
  }
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
    // A switch, not a checkbox: the role makes screen readers announce on/off.
    this.input.setAttribute("role", "switch");
    this.input.setAttribute("aria-label", String(config.label ?? ""));
    this.input.addEventListener("change", () => {
      this._value = this.input.checked ? "1" : "0";
      this.input.setAttribute("aria-checked", this._value === "1" ? "true" : "false");
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
    this.input.setAttribute("aria-checked", this._value === "1" ? "true" : "false");
  }
}
