import { $, Callbacks, Editors, type IPropertyDescriptor, type TEditorCfg } from "@de-xima/fc-form-designer";
import { parseString } from "@de-xima/xima-common-js-lang";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
/** Defines the type of {@link MultiSelect }. */
export const MultiSelectType = "com.github.xima_formcycle_entwicklerkreis.fc.plugin:fc-plugin-codbi:MultiSelect";
/** Describes the {@link MultiSelectType }. */
export interface IMultiSelectDescriptor extends IPropertyDescriptor<typeof MultiSelectType> {}
/** Augmenting **@de-xima/fc-form-designer** in order to add the {@link MultiSelectType } to {@link IEditorMap }.*/
declare module "@de-xima/fc-form-designer" {
  export interface IEditorMap {
    [MultiSelectType]: {
      /** Stores the {@link IMultiSelectDescriptor }. */
      descriptor: IMultiSelectDescriptor;

      /** Stores the {@link MultiSelect }-Editor itself. */
      editor: MultiSelect;

      /** Stores the selected standard configurations CSV. */
      value: string;
    };
  }
}
/**
 * A plain {@link Editors.BaseEditor <typeof MultiSelectType>} retrieving it's  available options to display out of
 * {@link window..  CodbiPluginData.fileListing } storing the made selections.
 *
 * Primarily intended to be used for selecting CodBi's standard configurations that shall be included into a form. */
export class MultiSelect extends Editors.BaseEditor<typeof MultiSelectType> {
  /** Stores the container for this {@link MultiSelect }. */
  private readonly _element: HTMLDivElement;

  /**
   * Creates a new {@link MultiSelect } by retrieving the available options from
   * {@link window..CodbiPluginData.fileListing } and generating an appropriate {@link HTMLInputElement } for each
   * entry there. Each {@link HTMLInputElement } will trigger a **set-property** from {@link Callbacks } when
   * clicked.
   *
   * @param config - Configuration for this editor.
   */
  constructor(config: TEditorCfg<IMultiSelectDescriptor>) {
    // Note: the second argument is deprecated, we pass the empty string
    super(config, "", "text");
    // #region Retrieve available standard configurations
    // biome-ignore lint/suspicious/noExplicitAny: TODO
    const listing = JSON.parse((window as any).CodbiPluginData.fileListing).map((file: string) => {
      return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
    });
    // #endregion Retrieve available standard configurations

    // #region Generate and inject appropriate <input>s and <labels> for them.
    this._element = document.createElement("div");
    this._element.style.whiteSpace = "nowrap";
    this._element.style.overflowX = "auto";

    for (const configuration of listing) {
      const newElement = document.createElement("input");
      const newLabel = document.createElement("label");

      newElement.setAttribute("id", `CodBi-StandardConfigSelector_${configuration}`);
      newElement.setAttribute("type", "checkbox");
      newElement.setAttribute("value", configuration);
      newElement.addEventListener("click", (event) => {
        // Propagate the change.
        Callbacks["set-property"].fire(this.config.property, this.getValue(), this);
        // #region Update status globally
        DEFINED.tsCheck(window.CodbiPluginData.detStandards[configuration]).Active = INSTANCE.tsCheck<HTMLInputElement>(
          event.target,
          HTMLInputElement,
        ).checked;
        // #endregion Update status globally
      });

      newLabel.setAttribute("for", `CodBi-StandardConfigSelector_${configuration}`);
      newLabel.innerHTML = `${configuration}</br>`;

      this._element.appendChild(newElement);
      this._element.appendChild(newLabel);
      // #endregion Generate appropriate <input>s and <labels> for them.
    }
  }
  /** See {@link Editors.BaseEditor }'s **getElement**. */
  override getElement(): JQuery {
    return $(this._element);
  }
  /**
   * Generates a CSV of all selected standard configurations.
   *
   * @returns A CSV of all selected standard configurations.
   */
  override getValue(): string {
    const result: string[] = [];
    for (const current of this._element.querySelectorAll("input")) {
      if (current.checked) {
        result.push(current.value);
      }
    }

    return result.join();
  }
  /**
   * Clears all selections prior to setting the selected configurations according to the received **data**.
   *
   * @param data See {@link Editors.BaseEditor }'s **setValue**. */
  override setValue(data: unknown): void {
    // #region Clear selection.
    for (const element of this._element.querySelectorAll("input")) {
      element.checked = false;
    }
    // #endregion Clear selection.
    // #region Clear marked standards globally
    for (const detail in window.CodbiPluginData.detStandards) {
      DEFINED.tsCheck(window.CodbiPluginData.detStandards[detail]).Active = false;
    }
    // #endregion Clear marked standards globally
    // #region Set according to [data].
    for (const standard of parseString(data).split(",")) {
      const element = this._element.querySelector(`[value="${standard.trim()}"]`);

      if (element instanceof HTMLInputElement) {
        element.checked = true;
      }
      // #region Mark active Standards globally
      if (window.CodbiPluginData.detStandards[standard]) {
        DEFINED.tsCheck(window.CodbiPluginData.detStandards[standard]).Active = true;
      }
      // #endregion Mark active Standards globally
    }
    // #endregion Set according to [data].
  }
}
