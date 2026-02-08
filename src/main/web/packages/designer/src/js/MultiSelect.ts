// #region Imports
// #region XIMA
import { $, Callbacks, Editors, type IPropertyDescriptor, type TEditorCfg } from "@de-xima/fc-form-designer";
import { parseString } from "@de-xima/xima-common-js-lang";
// #endregion XIMA
// #region XDBC
import { DEFINED } from "xdbc/src/DBC/DEFINED";
// #endregion XDBC
// #endregion Imports
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
  private _element: HTMLDivElement;
  /** Cache of created checkbox inputs. */
  private _inputs: HTMLInputElement[] = [];
  /** Cache for parsed file listing. */
  private _listingCache: string[] | null = null;
  /** Cache for raw file listing string to detect changes. */
  private _listingCacheRaw: string | null = null;
  /**
   * Converts a value to a stable JSON string representation.
   *
   * For objects, keys are sorted alphabetically to ensure consistent output
   * regardless of property order. This is useful for comparison and caching purposes.
   *
   * @param value - The value to stringify. Can be any type including primitives, arrays, or objects.
   *
   * @returns A stable JSON string representation of the value. */
  private stableStringify(value: unknown): string {
    if (value == null || typeof value !== "object") {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map((entry) => this.stableStringify(entry)).join(",")}]`;
    }

    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${this.stableStringify(entry)}`);

    return `{${entries.join(",")}}`;
  }
  private readonly _onListingChange = (event: Event): void => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") {
      return;
    }

    Callbacks["set-property"].fire(this.config.property, this.getValue(), this);
    this.setStandardActive(target.value, target.checked, window.CodbiPluginData.detStandards);
  };
  /**
   * Creates a new {@link MultiSelect } by retrieving the available options from
   * {@link window..CodbiPluginData.fileListing } and generating an appropriate {@link HTMLInputElement } for each
   * entry there. Each {@link HTMLInputElement } will trigger a **set-property** from {@link Callbacks } when
   * clicked.
   *
   * @param config - Configuration for this editor. */
  constructor(config: TEditorCfg<IMultiSelectDescriptor>) {
    // Note: the second argument is deprecated, we pass the empty string
    super(config, "", "text");
    window.CodbiPluginData.populateStandards = this.populateStandards.bind(this);

    this._element = document.createElement("div");

    this._element.setAttribute("id", "CodBi_Standardslisting");
    this._element.addEventListener("change", this._onListingChange);
    this.populateStandards();
  }
  /**
   * Sets the active state of a standard configuration in the global standards detail object.
   *
   * @param configuration - The name of the standard configuration to update.
   * @param checked - The desired active state for the configuration.
   * @param detStandards - The standards detail object containing configuration states.
   */
  private setStandardActive(
    configuration: string,
    checked: boolean,
    detStandards: Record<string, { Active?: boolean }>,
  ): void {
    if (detStandards[configuration]) {
      DEFINED.tsCheck(detStandards[configuration]).Active = checked;
    }
  }
  /**
   * Creates a checkbox input and label for a standard configuration option.
   *
   * @param configuration - The name of the standard configuration.
   * @param fragment - The DocumentFragment to append the created elements to.
   */
  private createStandardOption(configuration: string, fragment: DocumentFragment): void {
    const newElement = document.createElement("input");
    const newLabel = document.createElement("label");
    const newLine = document.createElement("br");

    newElement.setAttribute("id", `CodBi-StandardConfigSelector_${configuration}`);
    newElement.setAttribute("type", "checkbox");
    newElement.setAttribute("value", configuration);
    newLabel.setAttribute("for", `CodBi-StandardConfigSelector_${configuration}`);
    newLabel.textContent = configuration;

    fragment.appendChild(newElement);
    fragment.appendChild(newLabel);
    fragment.appendChild(newLine);
    this._inputs.push(newElement);
  }
  /** Populates the listing of standards. */
  protected populateStandards(): void {
    // #region Retrieve available standard configurations
    const rawListing: unknown = window.CodbiPluginData.fileListing as unknown;
    const listingKey = Array.isArray(rawListing)
      ? rawListing
          .filter((file): file is string => typeof file === "string")
          .slice()
          .sort()
          .join("\u0000")
      : typeof rawListing === "string"
        ? rawListing
        : this.stableStringify(rawListing);

    if (this._listingCacheRaw !== listingKey) {
      this._listingCacheRaw = listingKey;

      let parsedListing: string[] = [];

      if (typeof rawListing === "string") {
        try {
          parsedListing = JSON.parse(rawListing);
        } catch {
          parsedListing = [];
        }
      } else if (Array.isArray(rawListing)) {
        parsedListing = rawListing.slice();
      }

      this._listingCache = parsedListing
        .filter((file): file is string => typeof file === "string")
        .map((file) => {
          return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
        });
    }

    const listing = this._listingCache ?? [];
    // #endregion Retrieve available standard configurations
    // #region Clear
    const bufValue: string = this.getValue();

    this._element.innerHTML = "";
    this._inputs = [];
    // #endregion Clear
    // #region Generate and inject appropriate <input>s and <labels> for them.
    this._element.style.whiteSpace = "nowrap";
    this._element.style.overflowX = "auto";

    const fragment = document.createDocumentFragment();
    for (const configuration of listing) {
      this.createStandardOption(configuration, fragment);
    }

    this._element.appendChild(fragment);
    // #endregion Generate appropriate <input>s and <labels> for them.
    this.setValue(bufValue);
  }
  /** See {@link Editors.BaseEditor }'s **getElement**. */
  override getElement(): JQuery {
    return $(this._element);
  }
  /**
   * Generates a CSV of all selected standard configurations.
   *
   * @returns A CSV of all selected standard configurations. */
  override getValue(): string {
    const result: string[] = [];
    for (const current of this._inputs) {
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
    if (this._inputs.length === 0) {
      return;
    }
    // #region Clear selection.
    for (const element of this._inputs) {
      element.checked = false;
    }
    // #endregion Clear selection.
    // #region Clear marked standards globally
    const detStandards = window.CodbiPluginData.detStandards;

    for (const detail in detStandards) {
      this.setStandardActive(detail, false, detStandards);
    }
    // #endregion Clear marked standards globally
    // #region Set according to [data].
    const selected = new Set(
      parseString(data)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    );

    for (const element of this._inputs) {
      if (selected.has(element.value)) {
        element.checked = true;
      }
    }

    for (const standard of selected) {
      this.setStandardActive(standard, true, detStandards);
    }
    // #endregion Set according to [data].
  }
}
