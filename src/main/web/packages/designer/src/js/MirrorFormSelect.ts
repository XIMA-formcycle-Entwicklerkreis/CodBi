// #region Imports
import { $, Callbacks, Editors, type IPropertyDescriptor, type TEditorCfg } from "@de-xima/fc-form-designer";
import { rememberMirrorFormReference, resolveSelectedMirrorForm, syncMirrorChildren } from "./MirrorChildItems.js";
import { MirrorDropdown } from "./MirrorDropdown.js";
import { i18n } from "./i18n.js";
import {
  elementFromDesigner,
  elementKeyFromDesigner,
  formFromDesigner,
  formNameFromDesigner,
  mirrorFormOptions,
  setCurrentMirrorForm,
  type IMirrorOption,
} from "./MirrorSelect.js";
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
  /** Options currently shown, used to cache the chosen form's TITLE alongside its key. */
  private options: IMirrorOption[] = [];

  constructor(config: TEditorCfg<IMirrorFormSelectDescriptor>) {
    super(config, "", "text");
    this.dropdown = new MirrorDropdown(
      (value) => {
        this._value = value;
        setCurrentMirrorForm(value);
        // Cache the form TITLE next to the key: it is the fallback used to re-find the form after an
        // export/delete/re-import cycle, which assigns a new numeric project id.
        const option = this.options.find((entry) => entry.value === value);
        if (option) {
          rememberMirrorFormReference(this.config.designer, option);
        }
        Callbacks["set-property"].fire(this.config.property, value, this);
        // The source element is cleared when the source form changes, so drop the Mirror's generated
        // child items (the dependent element dropdown re-materializes them once a new element is
        // picked).
        void syncMirrorChildren(this.config.designer, value, "");
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
    // Re-bind ONLY when a form carrying the STORED title exists under a different id (the normal
    // export → delete → re-import case). The stored title is kept, only the stored id is corrected.
    // If no such form exists, the widget stays unlinked and the designer preview shows the hint.
    void mirrorFormOptions().then((options) => {
      this.options = options;
      const resolved = resolveSelectedMirrorForm(
        this.config.designer,
        options,
        initial,
        formNameFromDesigner(this.config.designer),
      );
      if (resolved && resolved !== this._value) {
        this._value = resolved;
        setCurrentMirrorForm(resolved);
        const element = elementFromDesigner(this.config.designer);
        if (element) {
          void syncMirrorChildren(
            this.config.designer,
            resolved,
            element,
            undefined,
            elementKeyFromDesigner(this.config.designer),
          );
        }
      }
      this.dropdown.setOptions(options);
      // `MirrorDropdown` falls back to the raw stored key when no option matches, so the user still
      // sees WHICH form the widget is (no longer) linked to.
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
