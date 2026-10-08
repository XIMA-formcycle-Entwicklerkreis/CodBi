// #region Imports
import { $, Callbacks, Editors, type IPropertyDescriptor, type TEditorCfg } from "@de-xima/fc-form-designer";
import { MirrorDropdown } from "./MirrorDropdown.js";
import { i18n } from "./i18n.js";
import { formFromDesigner, mirrorFormOptions, setCurrentMirrorForm } from "./MirrorSelect.js";
// #endregion Imports

/** Editor type for the Mirror widget's “source form” dropdown. */
export const MirrorFormSelectType =
  "com.github.xima_formcycle_entwicklerkreis.fc.plugin:fc-plugin-codbi:MirrorFormSelect";

/** Describes {@link MirrorFormSelectType}. */
export interface IMirrorFormSelectDescriptor extends IPropertyDescriptor<typeof MirrorFormSelectType> {}

/** Augments **@de-xima/fc-form-designer** so the editor is known to the {@link IEditorMap}. */
declare module "@de-xima/fc-form-designer" {
  export interface IEditorMap {
    [MirrorFormSelectType]: {
      descriptor: IMirrorFormSelectDescriptor;
      editor: MirrorFormSelect;
      value: string;
    };
  }
}

/**
 * Custom editor for the Mirror widget's “source form” dropdown. Uses the shared {@link MirrorDropdown}
 * UI and publishes the chosen form via {@link setCurrentMirrorForm} so the dependent element dropdown
 * reloads immediately.
 */
export class MirrorFormSelect extends Editors.BaseEditor<typeof MirrorFormSelectType> {
  private readonly dropdown: MirrorDropdown;
  private _value = "";

  constructor(config: TEditorCfg<IMirrorFormSelectDescriptor>) {
    super(config, "", "text");
    this.dropdown = new MirrorDropdown(
      (value) => {
        this._value = value;
        setCurrentMirrorForm(value);
        Callbacks["set-property"].fire(this.config.property, value, this);
      },
      undefined,
      {
        // Let the user narrow the (potentially long) form list down while typing.
        filter: true,
        filterPlaceholder: i18n("designer.widget.mirror.filterForms"),
        filterEmptyText: i18n("designer.widget.mirror.noResults"),
      },
    );

    // Seed from the item's persisted value (so an existing reference is shown immediately).
    const initial = formFromDesigner(this.config.designer);
    if (initial) {
      this._value = initial;
      setCurrentMirrorForm(initial);
    }
    void mirrorFormOptions().then((options) => {
      this.dropdown.setOptions(options);
      this.dropdown.setValue(this._value);
    });
  }

  getElement(): JQuery {
    return $(this.dropdown.root);
  }

  getValue(): string {
    return this._value;
  }

  setValue(value: unknown): void {
    this._value = value == null ? "" : String(value);
    this.dropdown.setValue(this._value);
    setCurrentMirrorForm(this._value);
  }
}
