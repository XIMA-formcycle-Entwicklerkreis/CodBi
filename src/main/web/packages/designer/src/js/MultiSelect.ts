import {
  $,
  Callbacks,
  Editors,
  type IPropertyDescriptor,
  type TEditorCfg,
  type IEditorMap,
} from "@de-xima/fc-form-designer";

import { parentElementsWithSelf } from "@de-xima/xima-common-js-dom";

import { beingInstance, filter, first, includeUntil, isInstance, parseString } from "@de-xima/xima-common-js-lang";

export interface ISelectMultiSelectOption {
  readonly icon?: string;

  readonly text?: string;

  readonly title?: string;

  readonly value?: string;
}
export const SelectMultiSelectType = "CodBi.MultiSelect";
export interface ISelectMultiSelectDescriptor extends IPropertyDescriptor<typeof SelectMultiSelectType> {
  options: ISelectMultiSelectOption[];
}
declare module "@de-xima/fc-form-designer" {
  export interface IEditorMap {
    [SelectMultiSelectType]: {
      descriptor: ISelectMultiSelectDescriptor;

      editor: MultiSelect;

      value: string;
    };
  }
}
/**

 * CSS class for the options button container.

 */

const ClassButtonContainer = "sel1btn__buttons";

/**

 * CSS class for an option button.

 */

const ClassButton = "sel1btn__button";

/**

 * CSS classes added to a button when it is selected.

 */

const ClassSelected = "sel1btn--selected";

/**

 * Name of the data attribute on a button indicating whether it is selected.

 */

const DataSelected = "selected";

/**

 * Name of the data attribute on a button with the value of the option.

 */

const DataValue = "value";

/**

 * Represents an option of the select one button editor.

 */

export interface ISelectOneButtonOption {
  readonly icon?: string;

  readonly text?: string;

  readonly title?: string;

  readonly value: string;
}

/**

 * Contains the available options that can be used to configure the editor.

 * These options can be specified when registering an editor with a property.

 */

export interface ISelectOneButtonEditorDescriptor extends IPropertyDescriptor<typeof SelectMultiSelectType> {
  options: readonly ISelectOneButtonOption[];
}

/**

 * Property editor for selecting one value by clicking on the corresponding

 * button.

 */

export class MultiSelect extends Editors.BaseEditor<typeof SelectMultiSelectType> {
  private readonly _element: HTMLDivElement;

  //private _options: readonly ISelectOneButtonOption[];

  private _value: string;

  /**

   * Creates a new select one button editor with the given configuration.

   * @param config - Configuration for this editor.

   */

  constructor(config: TEditorCfg<ISelectMultiSelectDescriptor>) {
    // Note: the second argument is deprecated, we pass the empty string

    super(config, "", "text");
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const listing = JSON.parse((window as any).CodbiPluginData.fileListing).map((file: string) => {
      return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
    });

    let selection = "";

    for (const configuration of listing) {
      selection += `<input type="checkbox" value="${configuration}" data-cb-standard = "${configuration}">${configuration}</input></br>`;
    }
    //this._options = [...config];

    this._value = "";

    this._element = document.createElement("div");
    this._element.style.whiteSpace = "nowrap";
    this._element.style.overflowX = "auto";

    this._element.innerHTML = selection;
    console.log(this._element);
  }

  override getElement(): JQuery {
    // Stellt das Auswahlmenu bereit

    return $(this._element);
  }

  /**

   * Retrieves the currently selected value.

   * @returns The value of the currently selected option. Empty string when no

   * option is selected.

   */

  override getValue(): string {
    console.log("GET");
    const result = Array<string>();

    for (const current of this._element.querySelectorAll("input")) {
      if (current.checked) {
        result.push(current.innerHTML);
      }
    }
    // Werte zurück
    console.log("GET:", result.join());
    return result.join();
  }

  /**

   * Sets the value of this editor. When no option matches the value, all

   * options are deselected and the value is set to the empty string.

   * @param data - Value of the option to select.

   */

  override setValue(data: unknown): void {
    for (const standard of data as string) {
      (this._element.querySelector(`[standard="${standard}"]`) as HTMLInputElement).checked = true;
    }
  }

  /**

   * Handles the click event when a button was pressed.

   * @param event - Click event that occurred on this editor.

   */

  private _onClick(event: MouseEvent): void {
    if (!isInstance(event.target, HTMLElement)) {
      return;
    }
  }

  /**

   * Updates the DOM for the currently selected value. When no option with the

   * given current value exists, all options are deselected. When the value was

   * changed, fires the change event.

   * @param desiredValue - New desired value to set on the editor.

   */

  private _updateValue(desiredValue: string): void {
    // biome-ignore lint/style/useConst: <explanation>
    let actualValue = "";

    if (actualValue !== this._value) {
      this._value = actualValue;

      Callbacks["set-property"].fire(this.property, actualValue, this);
    }
  }
}
