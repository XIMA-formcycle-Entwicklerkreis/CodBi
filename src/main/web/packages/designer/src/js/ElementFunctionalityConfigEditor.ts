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
import { setItemAttributeValueQuiet, removeFuncAttributeQuiet } from "./CodbiElementMarkers.js";
import { openEPBuilder } from "./EPBuilder.js";
import { codbiDocsUrl } from "./CodbiDocs.js";
import {
  CB_FUNC_ATTRIBUTE,
  type IApplicabilityElement,
  type IDesignerLike,
  type IItemLike,
  parseCsv,
  selectedProperty,
  listFunctionalities,
  resolveFunctionalityEntry,
  functionalityParameters,
  functionalityParameterTypes,
  findParameterSpec,
  type IFunctionalityParameterSpec,
  functionalityAppliesTo,
  parameterType,
  parameterLabel,
  currentAttributeValueForItem,
} from "./FunctionalityConfigEditor.js";
import { i18n as i18nTyped, localizedParameterDescription } from "./i18n.js";
import { ensureCodbiBranding } from "./MirrorSelect.js";
// #endregion Imports

/**
 * Loosened `i18n` accessor (see the identical widening in FunctionalityConfigEditor). The strongly
 * typed `TMessageKey` union is generated from `i18n_en.properties` and may not yet include the newly
 * added keys in every (stale) build artifact; the cast is a harmless no-op once refreshed.
 */
const kI18n = i18nTyped as unknown as (key: string) => string;

/**
 * Computes which `data-cb-<param>` attributes should be removed from an element when the
 * functionality `removedId` is deactivated, given the still-active functionalities `remainingIds`.
 *
 * A removed functionality's parameter is dropped ONLY when no other still-active functionality also
 * declares the same parameter (comparison is case-insensitive). Parameters shared with a remaining
 * functionality are kept so that remaining functionality keeps working. Pure — no DOM / persistence
 * side effects, so it can be unit-tested in isolation.
 *
 * @param removedId    The functionality id that was just removed.
 * @param remainingIds The functionality ids that remain active (e.g. `this.selected` after removal).
 * @returns The full `data-cb-<param>` attribute names to remove (e.g. `data-cb-Unit`).
 */
export function paramsToRemoveForRemovedFunctionality(removedId: string, remainingIds: string[]): string[] {
  // The parameters still needed by the remaining active functionalities.
  const stillNeeded = new Set<string>();
  for (const id of remainingIds) {
    for (const name of Object.keys(functionalityParameters(id))) {
      stillNeeded.add(name.toLowerCase());
    }
  }
  // Only the removed functionality's parameters that no remaining functionality needs are dropped.
  return Object.keys(functionalityParameters(removedId))
    .filter((name) => !stillNeeded.has(name.toLowerCase()))
    .map((name) => `data-cb-${name}`);
}

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
  /** The container of the SECOND list: functionalities NOT applicable to the element. */
  private readonly funcOptionsAll: HTMLDivElement;
  /** The wrapper of the second list (its visibility is toggled by {@link allToggleButton}). */
  private readonly funcAllList: HTMLDivElement;
  /** The header button that shows/hides the second (non-applicable) functionality list. */
  private readonly allToggleButton: HTMLButtonElement;
  /** Whether the second (non-applicable) functionality list is currently visible. */
  private showInapplicable = false;
  /** The current filter query for the functionality picker. */
  private funcQuery = "";
  /** The current filter query for the second (non-applicable) functionality listing. */
  private allQuery = "";

  constructor(config: TEditorCfg<IElementFunctionalityConfigDescriptor>) {
    super(config, "", "text");
    this.selected = parseCsv(selectedProperty(ELEMENT_FUNCS_PROPERTY));

    this.root = document.createElement("div");
    this.root.className = "codbi-func-config";
    this.root.style.cssText = "display:flex;flex-direction:column;gap:10px;";

    // #region 1. Functionality picker (list with an INLINE filter + checkboxes). The "+" button that
    // used to sit in the header was removed as useless: the checkbox list below adds/removes
    // functionalities directly.
    const funcSection = document.createElement("div");
    funcSection.className = "codbi-func-config__section";
    // The toggle for the SECOND (non-applicable) functionality list. It is ALWAYS visible but placed
    // BELOW the list(s); the list it controls stays hidden until the user clicks it.
    const allToggleButton = document.createElement("button");
    allToggleButton.type = "button";
    allToggleButton.className = "codbi-func-config__show-all";
    allToggleButton.setAttribute("aria-expanded", "false");
    allToggleButton.addEventListener("click", () => this.toggleInapplicableList());
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
    const funcOptions = document.createElement("div");
    funcOptions.className = "codbi-func-config__options";
    funcList.append(funcFilter, funcOptions);
    // The SECOND list: functionalities NOT applicable to the currently selected element. It is hidden
    // until the user clicks the show-all toggle (placed BELOW the list). It exists so a functionality whose applicability is not
    // (yet) declared for this element — e.g. a future plugin-provided widget type that IS in fact
    // compatible — can still be applied deliberately.
    const funcAllList = document.createElement("div");
    funcAllList.className = "codbi-func-config__funclist codbi-func-config__funclist--all";
    funcAllList.style.cssText =
      "max-height:220px;overflow:auto;border:1px solid #d0d5dd;border-radius:4px;padding:4px;display:none;margin-top:6px;";
    const allFuncFilter = document.createElement("input");
    allFuncFilter.type = "text";
    allFuncFilter.className = "codbi-func-config__filter";
    allFuncFilter.placeholder = kI18n("designer.widget.functionality.filterFuncs");
    allFuncFilter.value = this.allQuery;
    allFuncFilter.style.cssText = "width:100%;box-sizing:border-box;margin:0 0 4px;";
    allFuncFilter.addEventListener("input", () => {
      this.allQuery = allFuncFilter.value;
      this.renderFunctionalityList();
    });
    const funcOptionsAll = document.createElement("div");
    funcOptionsAll.className = "codbi-func-config__options codbi-func-config__options--all";
    funcAllList.append(allFuncFilter, funcOptionsAll);
    // The non-applicable listing sits BELOW the show-all button that reveals it.
    funcSection.append(funcList, allToggleButton, funcAllList);
    this.funcFilter = funcFilter;
    this.funcOptions = funcOptions;
    this.funcAllList = funcAllList;
    this.funcOptionsAll = funcOptionsAll;
    this.allToggleButton = allToggleButton;
    // #endregion 1. Functionality picker.

    // #region 2. Parameter table (applied directly to the selected element).
    const paramSection = document.createElement("div");
    paramSection.className = "codbi-func-config__section";
    const paramTitle = document.createElement("strong");
    paramTitle.className = "codbi-func-config__title";
    paramTitle.textContent = kI18n("designer.widget.functionality.parameters");
    this.paramsHost = document.createElement("div");
    this.paramsHost.className = "codbi-func-config__params";
    paramSection.append(paramTitle, this.paramsHost);
    // #endregion 2. Parameter table.

    this.root.append(funcSection, paramSection);
    this.renderFunctionalityList();
    this.renderParams();
    this.syncInapplicableVisibility();
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
   * The applicability view of the selected element (widget class name + property bag), used to filter
   * the functionality list by the element's type and properties (e.g. its `datatype`).
   */
  private applicabilityElement(): IApplicabilityElement | undefined {
    const item = this.targetElement();

    if (!item) {
      return undefined;
    }

    let properties: Record<string, unknown> | undefined;

    try {
      properties = item.getPersist?.()?.properties;
    } catch {
      properties = undefined;
    }
    return { className: item.className ?? undefined, properties };
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
      // Use the QUIET write paths: they mutate the property bags and nudge the persist differ
      // without forcing the designer's shared AttributesEditor to re-valuate. The badge tables are
      // fast because their item is never the SELECTED one (so `syncAttributesEditor` early-returns);
      // this editor works on the SELECTED master item, so the non-quiet variant would run the full
      // `editor.setValue` + `triggerSetProperty` re-valuation on every keystroke — the ~1s lag.
      setItemAttributeValueQuiet(item as never, name, value);
      setItemAttributeValueQuiet(item as never, CB_FUNC_ATTRIBUTE, this.selected.join(","));
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
      setItemAttributeValueQuiet(item as never, CB_FUNC_ATTRIBUTE, csv);
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
    // Persist (and re-render) FIRST, so the `funcs` / `data-cb-func` reflect the reduced selection
    // BEFORE any pruning. `persistFunctionalities` fires the `set-property` callback, and the pruning
    // below runs `removeFuncAttribute` which can nudge the designer into re-valuing this very property
    // editor (`setValue`) via the attributes editor sync — if that happened while the property still
    // held the OLD selection, the removed functionality would be re-added and the checkbox would stay
    // checked. Persisting first guarantees a re-valuation reads the already-reduced selection.
    this.persistFunctionalities();
    this.renderFunctionalityList();
    if (!on) {
      // Removing a functionality also removes the element's `data-cb-<param>` attributes for the
      // parameters that belonged to it — but only when no OTHER still-active functionality needs the
      // same parameter (see {@link pruneRemovedFunctionalityParams}).
      this.pruneRemovedFunctionalityParams(key);
    }
  }

  /**
   * Removes this element's `data-cb-<param>` attributes for the parameters declared by the just
   * removed functionality (`removedId`) — but ONLY when no other still-active functionality (in
   * `this.selected`) also declares the same parameter. Parameters shared with another functionality
   * that remains active are kept, so that remaining functionality keeps working. Delegates the
   * decision (which attributes to drop) to the pure {@link paramsToRemoveForRemovedFunctionality}.
   */
  private pruneRemovedFunctionalityParams(removedId: string): void {
    const item = this.targetElement();
    if (!item) {
      return;
    }
    for (const attrName of paramsToRemoveForRemovedFunctionality(removedId, this.selected)) {
      // `removeFuncAttributeQuiet` matches both the prefixed and the bare attribute name, and is a
      // no-op when the attribute is not actually set on the element. It skips the shared
      // AttributesEditor re-valuation — a toggle already fired the `set-property` pipeline in
      // `persistFunctionalities`, so re-valuating again here would double the ~1s lag.
      removeFuncAttributeQuiet(item as never, attrName);
    }
  }

  /**
   * Renders the two functionality option lists:
   *
   * 1. the **main** list with the functionalities applicable to the selected element (plus any
   *    already-selected one, which is never hidden so a selection cannot silently disappear);
   * 2. the **second** list (hidden until toggled) with the complement — the functionalities NOT deemed
   *    applicable to this element — so they can still be applied deliberately (e.g. when a future
   *    plugin-provided widget type IS compatible but the CodBi applicability metadata does not list it).
   */
  private renderFunctionalityList(): void {
    const query = this.funcQuery.trim().toLowerCase();
    const allQuery = this.allQuery.trim().toLowerCase();
    const available = listFunctionalities();
    const target = this.applicabilityElement();
    const mainFragment = document.createDocumentFragment();
    const otherFragment = document.createDocumentFragment();
    let mainShown = 0;
    for (const id of available) {
      const isSelected = this.selected.includes(id.toLowerCase());
      // Applicable = applicable to THIS element's widget type and, where the functionality declares
      // them (via `@SupportedFormelementtype`), property constraints such as `datatype`.
      const applicable = isSelected || functionalityAppliesTo(id, target);
      // Each listing has its OWN inline filter. Selected entries are never hidden by a filter
      // mismatch so a selection cannot silently disappear.
      const matches =
        (applicable
          ? query.length === 0 || id.toLowerCase().includes(query)
          : allQuery.length === 0 || id.toLowerCase().includes(allQuery)) || isSelected;
      if (!matches) {
        continue;
      }
      const row = this.buildFunctionalityRow(id, isSelected);
      if (applicable) {
        mainShown += 1;
        mainFragment.appendChild(row);
      } else {
        otherFragment.appendChild(row);
      }
    }
    if (mainShown === 0) {
      const empty = document.createElement("div");
      empty.style.cssText = "padding:4px;color:#6b7280;";
      empty.textContent = kI18n("designer.widget.functionality.noResults");
      mainFragment.appendChild(empty);
    }
    if (otherFragment.childElementCount === 0) {
      const empty = document.createElement("div");
      empty.style.cssText = "padding:4px;color:#6b7280;";
      empty.textContent = kI18n("designer.widget.functionality.noInapplicable");
      otherFragment.appendChild(empty);
    }
    this.funcOptions.replaceChildren(mainFragment);
    this.funcOptionsAll.replaceChildren(otherFragment);
  }

  /** Builds one functionality option row (checkbox + id) wired to {@link toggleFunctionality}. */
  private buildFunctionalityRow(id: string, isSelected: boolean): HTMLElement {
    const row = document.createElement("label");
    row.className = "codbi-func-config__option";
    row.style.cssText = "display:flex;align-items:center;gap:6px;padding:2px 4px;cursor:pointer;";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = id;
    checkbox.checked = isSelected;
    checkbox.addEventListener("change", () => this.toggleFunctionality(id, checkbox.checked));
    const text = document.createElement("span");
    text.textContent = id;
    row.append(checkbox, text);
    return row;
  }

  /** Shows/hides the second (non-applicable) functionality list. */
  private toggleInapplicableList(): void {
    this.showInapplicable = !this.showInapplicable;
    this.syncInapplicableVisibility();
  }

  /** Applies {@link showInapplicable} to the second list and its toggle button. */
  private syncInapplicableVisibility(): void {
    this.funcAllList.style.display = this.showInapplicable ? "block" : "none";
    this.allToggleButton.textContent =
      (this.showInapplicable ? "\u25BE " : "\u25B8 ") +
      kI18n(
        this.showInapplicable ? "designer.element.property.funcs.hideAll" : "designer.element.property.funcs.showAll",
      );
    this.allToggleButton.setAttribute("aria-expanded", String(this.showInapplicable));
  }

  /** Renders the parameter table of every selected functionality. */
  private renderParams(): void {
    const fragment = document.createDocumentFragment();
    const element = this.targetElement();
    let any = false;
    for (const id of this.selected) {
      const params = functionalityParameters(id);
      const types = functionalityParameterTypes(id);
      const names = Object.keys(params);
      if (names.length === 0) {
        continue;
      }
      any = true;
      const header = document.createElement("div");
      header.className = "codbi-func-config__param-group";
      header.textContent = originalCaseKey(id) !== "" ? originalCaseKey(id) : id;
      fragment.appendChild(header);
      for (const name of names) {
        try {
          fragment.appendChild(this.buildParamRow(element, name, params[name], findParameterSpec(types, name)));
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
  private buildParamRow(
    element: IItemLike | undefined,
    name: string,
    description: string,
    spec?: IFunctionalityParameterSpec,
  ): HTMLElement {
    const row = document.createElement("div");
    row.className = "codbi-func-config__param-row";
    // Layout is delegated to the `.codbi-func-config__param-row` CSS (an aligned grid with a fixed
    // label column) so every value field of every parameter group lines up on the same column.

    const label = document.createElement("label");
    label.className = "codbi-func-config__param-label";
    // `display: block` + `min-width: 0` + wrapping lets long labels break inside the fixed label
    // column instead of pushing the value controls out of the panel's visible area.
    label.style.cssText = "display:block;min-width:0;overflow-wrap:anywhere;word-break:break-word;";
    // Hovering the parameter name shows a short description. The structured `parameters[*].description`
    // wins; the legacy `Parameter`-map description (after stripping any {Type} hint) is the fallback.
    label.title = localizedParameterDescription(spec) || parameterLabel(description) || name;
    label.textContent = name;

    // The parameter key is stored BARE (e.g. `Unit`), but it lives in the element config's attribute
    // table as `data-cb-<key>` (e.g. `data-cb-Unit`). Both the read and the write below must use the
    // FULL prefixed attribute name so the value lands in (and is read from) the persisted attribute,
    // otherwise the config panel and the badge/runtime would target different attributes.
    const attrName = `data-cb-${name}`;
    const currentValue = currentAttributeValueForItem(element, attrName);
    // The structured type wins; the legacy `{Type}`-in-description hint stays as a fallback.
    const type = spec?.type ?? parameterType(description);

    const cell = document.createElement("span");
    cell.style.cssText = "display:flex;align-items:center;gap:4px;flex:1 1 auto;min-width:0;";

    let textInput: HTMLInputElement | undefined;
    let checkbox: HTMLInputElement | undefined;
    let select: HTMLSelectElement | undefined;

    // Writes a parameter (and re-asserts `data-cb-func`) directly onto the selected element. Uses the
    // FULL `data-cb-<key>` attribute name (see `attrName` above) so it matches the persisted attribute.
    const write = (value: string): void => {
      this.writeAttribute(attrName, value);
      this.writeAttribute(CB_FUNC_ATTRIBUTE, this.selected.join(","));
    };

    const showText = (value: string): void => {
      if (checkbox) {
        checkbox.remove();
        checkbox = undefined;
      }
      if (select) {
        select.remove();
        select = undefined;
      }
      if (!textInput) {
        textInput = document.createElement("input");
        textInput.type = type === "integer" || type === "number" ? "number" : "text";
        if (type === "integer") {
          textInput.step = "1";
        } else if (type === "number") {
          textInput.step = "any";
        }
        textInput.className = "codbi-func-config__value";
        textInput.style.flex = "1";
        textInput.addEventListener("change", () => {
          write(textInput?.value ?? "");
          // If the text is emptied (e.g. all characters removed), revert to the ORIGINAL control.
          revertIfEmpty();
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

    const showSelect = (options: string[]): void => {
      if (textInput) {
        textInput.remove();
        textInput = undefined;
      }
      if (checkbox) {
        checkbox.remove();
        checkbox = undefined;
      }
      if (!select) {
        select = document.createElement("select");
        select.className = "codbi-func-config__value";
        select.style.flex = "1";
        const blank = document.createElement("option");
        blank.value = "";
        select.appendChild(blank);
        for (const option of options) {
          const opt = document.createElement("option");
          opt.value = option;
          opt.textContent = option;
          select.appendChild(opt);
        }
        select.addEventListener("change", () => write(select?.value ?? ""));
        cell.insertBefore(select, epButton);
      }
      select.value = currentValue;
    };

    const isBooleanParam = (): boolean => type === "boolean";

    // Restores the ORIGINAL control for a parameter type that was temporarily switched to a text
    // input: a boolean back to its checkbox, an enum back to its select. Pure string parameters have
    // no other control to go back to and simply stay a text input.
    const revertToOriginal = (): void => {
      if (isBooleanParam()) {
        showCheckbox();
      } else if (type === "enum" && spec?.options && spec.options.length > 0) {
        showSelect(spec.options);
      }
    };

    // When the (temporary) text input holds no value — the EP builder was applied without a result,
    // or the user removed all characters — restore the ORIGINAL control for the parameter type.
    const revertIfEmpty = (): void => {
      if ((textInput?.value ?? "").trim() !== "") {
        return;
      }
      revertToOriginal();
    };

    // The EP button opens the flat EP listing + the EP builder; on a boolean it first flips to text.
    const epButton = document.createElement("button");
    epButton.type = "button";
    epButton.className = "codbi-func-config__ep";
    epButton.title = "EP";
    epButton.textContent = "ƒ";
    epButton.style.cssText = "min-width:24px;";
    // Tab should flow from one parameter value field to the NEXT parameter value field, not jump onto
    // the EP launcher between them. Removing the button from the tab order (it stays clickable, and
    // the inline ALT+E shortcut still opens the builder from the focused field) keeps the sequence of
    // value inputs contiguous when tabbing through the panel.
    epButton.tabIndex = -1;
    epButton.addEventListener("click", () => {
      // Triggering the builder on a checkbox converts it into a text input (per spec).
      showText(currentValue);
      if (textInput) {
        // on applied: revert if nothing was generated; on cancel (no EP picked): always restore the
        // original boolean/enum control instead of leaving a dead text input behind.
        this.openBuilder(textInput, write, revertIfEmpty, revertToOriginal);
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
    } else if (type === "enum" && spec?.options && spec.options.length > 0) {
      showSelect(spec.options);
    } else {
      showText(currentValue);
    }

    row.append(label, cell);
    return row;
  }

  /** Opens the EP builder / flat listing for one parameter value input and applies the result. */
  private openBuilder(
    input: HTMLInputElement,
    write: (value: string) => void,
    onApplied?: () => void,
    onCancel?: () => void,
  ): void {
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
          // Let the row restore its original input type when the builder applied nothing.
          onApplied?.();
        },
        // Closing the builder WITHOUT applying (Cancel / Escape) means no EP was generated — restore
        // the original control (a boolean back to its checkbox, an enum back to its select).
        onCancel: onCancel,
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
    // Publishes the CodBi logo URL so the panel CSS can paint the CodBi watermark (`--codbi-logo-url`).
    ensureCodbiBranding();

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
      // No left-hand property label ("Funktionalitäten"): the panel is self-explanatory.
      label: "",
    } satisfies IElementFunctionalityConfigDescriptor);
  } catch (x) {
    console.error("[CodBi] Failed to register the per-element CodBi properties", x);
  }
}
