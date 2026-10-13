// #region Imports
import {
  $,
  Callbacks,
  Editors,
  type IPropertyDescriptor,
  type TEditorCfg,
  instance,
  registerCustomCategory,
  registerCustomEditor,
  registerLocalizableProperty,
  registerCustomProperty,
} from "@de-xima/fc-form-designer";
import { Constants } from "codbi-common";
import { setItemAttributeValue } from "./CodbiElementMarkers.js";
import { openEPBuilder } from "./EPBuilder.js";
import { codbiDocsUrl } from "./CodbiDocs.js";
import {
  CB_FUNC_ATTRIBUTE,
  type IDesignerLike,
  type IItemLike,
  parseCsv,
  selectedProperty,
  listFunctionalities,
  resolveFunctionalityEntry,
  functionalityParameters,
  parameterType,
  parameterLabel,
  currentAttributeValueForItem,
} from "./FunctionalityConfigEditor.js";
import { i18n as i18nTyped } from "./i18n.js";
// #endregion Imports

/**
 * Loosened `i18n` accessor (see the identical widening in FunctionalityConfigEditor). The strongly
 * typed `TMessageKey` union is generated from `i18n_en.properties` and may not yet include the newly
 * added keys in every (stale) build artifact; the cast is a harmless no-op once refreshed.
 */
const kI18n = i18nTyped as unknown as (key: string) => string;

/** Editor type for the per-element CodBi functionality configurator (any form element). */
export const ElementFunctionalityConfigType =
  "com.github.xima_formcycle_entwicklerkreis.fc.plugin:fc-plugin-codbi:ElementFunctionalityConfig";

/** Describes {@link ElementFunctionalityConfigType}. */
export interface IElementFunctionalityConfigDescriptor
  extends IPropertyDescriptor<typeof ElementFunctionalityConfigType> {}

/** Augments **@de-xima/fc-form-designer** so the editor is known to the {@link IEditorMap}. */
declare module "@de-xima/fc-form-designer" {
  export interface IEditorMap {
    [ElementFunctionalityConfigType]: {
      descriptor: IElementFunctionalityConfigDescriptor;
      editor: ElementFunctionalityConfigEditor;
      value: string;
    };
  }
}

/** Category id grouping the per-element CodBi property (the existing "CodBi" category). */
export const ELEMENT_FUNCTIONALITY_CATEGORY_ID = "codbi-cat-main";

/** Platform-available `designer.element.property.funcs` (the CSV of applied functionality ids). */
export const ELEMENT_FUNCS_PROPERTY = String(Constants["designer.element.property.funcs"]);
/** Platform-available `designer.element.property.funcs_name` (cached display names). */
export const ELEMENT_FUNCS_NAME_PROPERTY = String(Constants["designer.element.property.funcs_name"]);

/**
 * The **per-element CodBi configuration** editor. Unlike the Functionality widget (which wraps a
 * contained child), this editor is bound to a property exposed on EVERY form element (via the
 * element properties extension plugin) and applies the chosen functionalities DIRECTLY onto that
 * element:
 *
 * 1. a **functionality picker** with a filter box and a **“+”** button (multi-select);
 * 2. the **parameter table** of the selected functionalities (checkbox for boolean parameters, text
 *    input for string/any, each with an EP-builder launcher).
 *
 * Every change is written straight onto the selected element's config attribute table via
 * `data-cb-func` (functionalities) and `data-cb-<param>` (parameters) — the same attributes the
 * CodBi runtime and the designer preview read — and the selection is also mirrored into the
 * element's `funcs` / `funcs_name` persisted properties so it survives reloads.
 */
export class ElementFunctionalityConfigEditor extends Editors.BaseEditor<typeof ElementFunctionalityConfigType> {
  private readonly root: HTMLDivElement;
  /** Currently applied functionality ids (lowercase). */
  private selected: string[] = [];
  /** The root of the parameter table (rebuilt whenever the selection changes). */
  private readonly paramsHost: HTMLDivElement;
  /** The container holding the (filtered) functionality option rows. */
  private readonly funcOptions: HTMLDivElement;
  /** The inline filter input of the functionality listing. */
  private readonly funcFilter: HTMLInputElement;
  /** The current filter query for the functionality picker. */
  private funcQuery = "";

  constructor(config: TEditorCfg<IElementFunctionalityConfigDescriptor>) {
    super(config, "", "text");
    this.selected = parseCsv(selectedProperty(ELEMENT_FUNCS_PROPERTY));

    this.root = document.createElement("div");
    this.root.className = "codbi-func-config";
    this.root.style.cssText = "display:flex;flex-direction:column;gap:10px;";

    // #region 1. Functionality picker (list with an INLINE filter + a "+" button).
    const funcSection = document.createElement("div");
    funcSection.className = "codbi-func-config__section";
    const funcHeader = document.createElement("div");
    funcHeader.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:6px;";
    const funcTitle = document.createElement("strong");
    funcTitle.textContent = kI18n("designer.widget.functionality.funcs");
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "codbi-func-config__add";
    addButton.title = kI18n("designer.widget.functionality.addFunc");
    addButton.textContent = "+";
    funcHeader.append(funcTitle, addButton);
    // The listing box CONTAINS the filter input (top) and the option rows below it.
    const funcList = document.createElement("div");
    funcList.className = "codbi-func-config__funclist";
    funcList.style.cssText = "max-height:220px;overflow:auto;border:1px solid #d0d5dd;border-radius:4px;padding:4px;";
    const funcFilter = document.createElement("input");
    funcFilter.type = "text";
    funcFilter.className = "codbi-func-config__filter";
    funcFilter.placeholder = kI18n("designer.widget.functionality.filterFuncs");
    funcFilter.value = this.funcQuery;
    funcFilter.style.cssText = "width:100%;box-sizing:border-box;margin:0 0 4px;";
    funcFilter.addEventListener("input", () => {
      this.funcQuery = funcFilter.value;
      this.renderFunctionalityList();
    });
    addButton.addEventListener("click", () => {
      this.funcQuery = "";
      funcFilter.value = "";
      this.renderFunctionalityList();
      funcFilter.focus();
    });
    const funcOptions = document.createElement("div");
    funcList.append(funcFilter, funcOptions);
    funcSection.append(funcHeader, funcList);
    this.funcFilter = funcFilter;
    this.funcOptions = funcOptions;
    // #endregion 1. Functionality picker.

    // #region 2. Parameter table (applied directly to the selected element).
    const paramSection = document.createElement("div");
    paramSection.className = "codbi-func-config__section";
    const paramTitle = document.createElement("strong");
    paramTitle.textContent = kI18n("designer.widget.functionality.parameters");
    paramTitle.style.display = "block";
    paramTitle.style.marginBottom = "6px";
    this.paramsHost = document.createElement("div");
    this.paramsHost.className = "codbi-func-config__params";
    paramSection.append(paramTitle, this.paramsHost);
    // #endregion 2. Parameter table.

    this.root.append(funcSection, paramSection);
    this.renderFunctionalityList();
    this.renderParams();
  }

  /** See {@link Editors.BaseEditor }'s **getElement**. */
  public override getElement(): JQuery {
    return $(this.root);
  }

  /** See {@link Editors.BaseEditor }'s **setValue**. Refreshes when FORMCYCLE (re)assigns the value. */
  public override setValue(data: unknown): void {
    this.selected = parseCsv(
      data != null && String(data) !== "" ? String(data) : selectedProperty(ELEMENT_FUNCS_PROPERTY),
    );
    this.renderFunctionalityList();
    this.renderParams();
  }

  /** See {@link Editors.BaseEditor }'s **getValue**. */
  public override getValue(): string {
    return this.selected.join(",");
  }

  /** The element the editor currently applies to (the selected master item), or `undefined`. */
  private targetElement(): IItemLike | undefined {
    try {
      const designer = instance() as unknown as IDesignerLike | undefined;
      return designer?.getSelectedMasterItem?.();
    } catch {
      return undefined;
    }
  }

  /**
   * Writes one `data-cb-*` attribute onto the SELECTED element itself (the element being edited) and
   * re-asserts its `data-cb-func` tag. A no-op when no element is selected (there is no valid node to
   * carry the attribute). Uses the same write path as the Functionality widget (see
   * `setItemAttributeValue`), so the change lands in both the live and the persisted property bags.
   */
  private writeAttribute(name: string, value: string): void {
    const item = this.targetElement();
    if (item) {
      setItemAttributeValue(item as never, name, value);
      setItemAttributeValue(item as never, CB_FUNC_ATTRIBUTE, this.selected.join(","));
    }
  }

  /** Persists the current functionality selection into the element's `funcs` / `funcs_name` props. */
  private persistFunctionalities(): void {
    const csv = this.selected.join(",");
    // Cache the display names (original casing) resolved from the registry for the designer.
    const names = this.selected.map((id) => originalCaseKey(id)).filter((entry) => entry !== "");
    Callbacks["set-property"].fire(ELEMENT_FUNCS_PROPERTY, csv, this);
    Callbacks["set-property"].fire(ELEMENT_FUNCS_NAME_PROPERTY, names.join(","), this);
    // The `data-cb-func` attribute lives directly on the selected element so the runtime/preview see
    // the applied functionalities even when only toggled without touching a parameter.
    const item = this.targetElement();
    if (item) {
      setItemAttributeValue(item as never, CB_FUNC_ATTRIBUTE, csv);
    }
    this.renderParams();
  }

  /** Toggles a functionality in the current selection and persists the change. */
  private toggleFunctionality(id: string, on: boolean): void {
    const key = id.toLowerCase();
    if (on && !this.selected.includes(key)) {
      this.selected.push(key);
    } else if (!on) {
      this.selected = this.selected.filter((entry) => entry !== key);
    }
    this.persistFunctionalities();
    this.renderFunctionalityList();
  }

  /** Renders the (filtered) functionality option list with a checkbox per available functionality. */
  private renderFunctionalityList(): void {
    const query = this.funcQuery.trim().toLowerCase();
    const available = listFunctionalities();
    const fragment = document.createDocumentFragment();
    let shown = 0;
    for (const id of available) {
      const isSelected = this.selected.includes(id.toLowerCase());
      // When filtering, keep matches; without a query, always show selected entries plus everything
      // (so the user can browse). Selected entries are never hidden by a filter mismatch.
      const matches = query.length === 0 || id.toLowerCase().includes(query) || isSelected;
      if (!matches) {
        continue;
      }
      shown += 1;
      const row = document.createElement("label");
      row.style.cssText = "display:flex;align-items:center;gap:6px;padding:2px 4px;cursor:pointer;";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = id;
      checkbox.checked = isSelected;
      checkbox.addEventListener("change", () => this.toggleFunctionality(id, checkbox.checked));
      const text = document.createElement("span");
      text.textContent = id;
      row.append(checkbox, text);
      fragment.appendChild(row);
    }
    if (shown === 0) {
      const empty = document.createElement("div");
      empty.style.cssText = "padding:4px;color:#6b7280;";
      empty.textContent = kI18n("designer.widget.functionality.noResults");
      fragment.appendChild(empty);
    }
    this.funcOptions.replaceChildren(fragment);
  }

  /** Renders the parameter table of every selected functionality. */
  private renderParams(): void {
    const fragment = document.createDocumentFragment();
    const element = this.targetElement();
    let any = false;
    for (const id of this.selected) {
      const params = functionalityParameters(id);
      const names = Object.keys(params);
      if (names.length === 0) {
        continue;
      }
      any = true;
      const header = document.createElement("div");
      header.style.cssText = "font-weight:600;margin:6px 0 2px;";
      header.textContent = originalCaseKey(id) !== "" ? originalCaseKey(id) : id;
      fragment.appendChild(header);
      for (const name of names) {
        try {
          fragment.appendChild(this.buildParamRow(element, name, params[name]));
        } catch (x) {
          console.error("[CodBi] Element: could not render parameter", id, name, x);
        }
      }
    }
    if (!any) {
      const none = document.createElement("div");
      none.style.cssText = "color:#6b7280;";
      none.textContent = kI18n("designer.widget.functionality.noParams");
      fragment.appendChild(none);
    }
    this.paramsHost.replaceChildren(fragment);
  }

  /** Builds one parameter row: name + (checkbox | text input) + EP button. */
  private buildParamRow(element: IItemLike | undefined, name: string, description: string): HTMLElement {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:6px;margin:2px 0;";

    const label = document.createElement("label");
    label.style.cssText = "flex:1;";
    label.title = parameterLabel(description);
    label.textContent = name;

    const currentValue = currentAttributeValueForItem(element, name);
    const type = parameterType(description);

    const cell = document.createElement("span");
    cell.style.cssText = "display:flex;align-items:center;gap:4px;flex:1;";

    let textInput: HTMLInputElement | undefined;
    let checkbox: HTMLInputElement | undefined;

    // Writes a parameter (and re-asserts `data-cb-func`) directly onto the selected element.
    const write = (value: string): void => {
      this.writeAttribute(name, value);
      this.writeAttribute(CB_FUNC_ATTRIBUTE, this.selected.join(","));
    };

    const showText = (value: string): void => {
      if (checkbox) {
        checkbox.remove();
        checkbox = undefined;
      }
      if (!textInput) {
        textInput = document.createElement("input");
        textInput.type = "text";
        textInput.className = "codbi-func-config__value";
        textInput.style.flex = "1";
        textInput.addEventListener("change", () => {
          write(textInput?.value ?? "");
          // Clearing the text restores the checkbox for boolean parameters.
          if (isBooleanParam() && (textInput?.value ?? "").trim() === "") {
            showCheckbox();
          }
        });
        textInput.addEventListener("keydown", (event) => {
          if (event.altKey && event.key.toLowerCase() === "e") {
            event.preventDefault();
            event.stopPropagation();
            this.openBuilder(textInput as HTMLInputElement, write);
          }
          if (event.key === "Enter") {
            event.preventDefault();
            textInput?.blur();
          }
        });
        cell.insertBefore(textInput, epButton);
      }
      textInput.value = value;
    };

    const showCheckbox = (): void => {
      if (textInput) {
        textInput.remove();
        textInput = undefined;
      }
      if (!checkbox) {
        checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "codbi-func-config__bool";
        checkbox.addEventListener("change", () => write(checkbox?.checked ? "true" : "false"));
        cell.insertBefore(checkbox, epButton);
      }
      checkbox.checked = currentValue === "true" || currentValue === "1";
    };

    const isBooleanParam = (): boolean => type === "boolean";

    // The EP button opens the flat EP listing + the EP builder; on a boolean it first flips to text.
    const epButton = document.createElement("button");
    epButton.type = "button";
    epButton.className = "codbi-func-config__ep";
    epButton.title = "EP";
    epButton.textContent = "ƒ";
    epButton.style.cssText = "min-width:24px;";
    epButton.addEventListener("click", () => {
      // Triggering the builder on a checkbox converts it into a text input (per spec).
      showText(currentValue);
      if (textInput) {
        this.openBuilder(textInput, write);
      }
    });
    // The EP button must already be a child of the cell before showText/showCheckbox insert the
    // value control BEFORE it (otherwise insertBefore throws).
    cell.appendChild(epButton);

    if (
      isBooleanParam() &&
      (currentValue === "" ||
        currentValue === "true" ||
        currentValue === "false" ||
        currentValue === "1" ||
        currentValue === "0")
    ) {
      showCheckbox();
    } else {
      showText(currentValue);
    }

    row.append(label, cell);
    return row;
  }

  /** Opens the EP builder / flat listing for one parameter value input and applies the result. */
  private openBuilder(input: HTMLInputElement, write: (value: string) => void): void {
    try {
      openEPBuilder({
        document: window.document,
        anchor: this.root,
        value: input.value,
        listEPs: () => {
          try {
            const raw = window.CodbiPluginData?.fslElementplaceholder ?? "[]";
            const parsed = JSON.parse(raw) as string[];
            return Array.isArray(parsed) ? parsed.map((entry) => entry.replace(/\.(js|ts)$/i, "")) : [];
          } catch {
            return [];
          }
        },
        onApply: (value: string) => {
          input.value = value;
          write(value);
        },
      });
    } catch (x) {
      console.error("[CodBi] Element: could not open the EP builder", x);
    }
  }
}

/**
 * Resolves the ORIGINAL-CASED registry key for a (lowercased) functionality id, so display names
 * keep the casing users configure (e.g. `Date.Min`). Falls back to the id itself when no match is
 * found. (`resolveFunctionalityEntry` returns parameter/formElement metadata only, not the name.)
 */
function originalCaseKey(id: string): string {
  try {
    const entries = window.CodbiPluginData?.detFunctionalities ?? {};
    const wanted = id.toLowerCase();
    for (const candidate of Object.keys(entries)) {
      if (candidate.toLowerCase() === wanted) {
        return candidate;
      }
    }
  } catch {
    /* ignore */
  }
  return id;
}

/**
 * Registers the per-element CodBi configuration: the existing "CodBi" category and the composite
 * configurator bound to the element-scoped `funcs` property exposed on EVERY form element.
 */
export function registerElementFunctionalityProperties(): void {
  try {
    registerCustomCategory(
      {
        id: ELEMENT_FUNCTIONALITY_CATEGORY_ID,
        label: kI18n("designer.category.codbi_panel"),
        // Help icon in the current designer language (honours the `Docs_Frontend_<lang>` redirects).
        help: { type: "url", url: codbiDocsUrl() },
      },
      (items) => items.length,
    );

    registerLocalizableProperty(ELEMENT_FUNCS_PROPERTY);
    registerLocalizableProperty(ELEMENT_FUNCS_NAME_PROPERTY);

    try {
      registerCustomEditor(ElementFunctionalityConfigType, ElementFunctionalityConfigEditor);
    } catch (x) {
      console.error("[CodBi] Failed to register the element functionality config editor", x);
    }

    registerCustomProperty({
      editor: ElementFunctionalityConfigType,
      cat: ELEMENT_FUNCTIONALITY_CATEGORY_ID,
      property: ELEMENT_FUNCS_PROPERTY,
      label: kI18n("designer.element.property.funcs.label"),
    } satisfies IElementFunctionalityConfigDescriptor);
  } catch (x) {
    console.error("[CodBi] Failed to register the per-element CodBi properties", x);
  }
}
