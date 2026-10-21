// #region Imports
import {
  $,
  Editors,
  type IPropertyDescriptor,
  type TEditorCfg,
  instance,
  registerCustomCategory,
  registerCustomEditor,
  registerCustomProperty,
  registerLocalizableProperty,
} from "@de-xima/fc-form-designer";
import {
  Constants,
  type TStandardConfigClassSpec,
  type TStandardConfigSupportedSpec,
  standardConfigAppliesTo,
  standardConfigClassTypes,
  standardConfigIsHolistic,
} from "codbi-common";
import { codbiDocsUrl } from "./CodbiDocs.js";
import {
  elementCssClasses,
  refreshCodbiElementMarkers,
  removeFuncAttributeQuiet,
  setElementCssClass,
  setItemAttributeValueQuiet,
  setItemPropertyValueQuiet,
} from "./CodbiElementMarkers.js";
import { openEPBuilder } from "./EPBuilder.js";
import {
  CB_FUNC_ATTRIBUTE,
  type IApplicabilityElement,
  type IDesignerLike,
  type IFunctionalityParameterSpec,
  type IItemLike,
  currentAttributeValueForItem,
  findParameterSpec,
  functionalityAppliesTo,
  functionalityParameterTypes,
  functionalityParameters,
  functionalitySummary,
  listFunctionalities,
  parameterLabel,
  parameterType,
  parseCsv,
  resolveFunctionalityEntry,
  selectedProperty,
} from "./FunctionalityConfigEditor.js";
import { ensureCodbiBranding } from "./MirrorSelect.js";
import { getDesignerLanguage, i18n as i18nTyped, localizedParameterDescription } from "./i18n.js";
// #endregion Imports

/**
 * Loosened `i18n` accessor (see the identical widening in FunctionalityConfigEditor). The strongly
 * typed `TMessageKey` union is generated from `i18n_en.properties` and may not yet include the newly
 * added keys in every (stale) build artifact; the cast is a harmless no-op once refreshed.
 */
const kI18n = i18nTyped as unknown as (key: string) => string;

/**
 * The DOM id of the form-level "CodBi aktiviert" checkbox that gates this panel's visibility. When the
 * user flips it, the panel must react immediately (no save + reload) — see {@link
 * ElementFunctionalityConfigEditor#registerCodBiEnableListener}.
 */
const CODBI_ENABLE_CHECKBOX_SELECTOR = "#form-codbi-prop-enable-input";

/**
 * Tracks which "CodBi aktiviert" checkboxes already carry our `change` listener, so re-instantiating the
 * editor (each element selection rebuilds it) never stacks a second listener on the same checkbox.
 */
const codBiEnableCheckboxesWithListener = new WeakSet<HTMLInputElement>();

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
  /** The "Parameter" heading above the table — shown only when at least one parameter is present. */
  private readonly paramTitle: HTMLElement;
  /** The container holding the (filtered) functionality option rows. */
  private readonly funcOptions: HTMLDivElement;
  /** The inline filter input of the functionality listing. */
  private readonly funcFilter: HTMLInputElement;
  /** The inline filter input of the SECOND (non-applicable) functionality listing. */
  private readonly allFuncFilter: HTMLInputElement;
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
  /** The listing box of the APPLICABLE functionality list (toggled by {@link mainToggleButton}). */
  private readonly funcList: HTMLDivElement;
  /** The header button that shows/hides the APPLICABLE functionality list. */
  private readonly mainToggleButton: HTMLButtonElement;
  /** Whether the APPLICABLE functionality list is currently visible (collapsed by default). */
  private showApplicable = false;
  /** The listing box of the APPLICABLE standard-configuration list (toggled by {@link stdMainToggleButton}). */
  private readonly stdList: HTMLDivElement;
  /** The header button that shows/hides the APPLICABLE standard-configuration list. */
  private readonly stdMainToggleButton: HTMLButtonElement;
  /** Whether the APPLICABLE standard-configuration list is currently visible (collapsed by default). */
  private showStdApplicable = false;
  /** The container holding the (filtered) APPLICABLE standard-configuration option rows. */
  private readonly stdOptions: HTMLDivElement;
  /** The inline filter input of the applicable standard-configuration listing. */
  private readonly stdFilter: HTMLInputElement;
  /** The inline filter input of the SECOND (non-applicable) standard-configuration listing. */
  private readonly stdAllFilter: HTMLInputElement;
  /** The container of the SECOND standard-config listing: configurations NOT applicable to the element. */
  private readonly stdOptionsAll: HTMLDivElement;
  /** The wrapper of the second standard-config listing (its visibility is toggled by {@link stdToggleButton}). */
  private readonly stdAllList: HTMLDivElement;
  /** The header button that shows/hides the second (non-applicable) standard-configuration list. */
  private readonly stdToggleButton: HTMLButtonElement;
  /** Whether the second (non-applicable) standard-configuration list is currently visible. */
  private showStdInapplicable = false;
  /** The current filter query for the applicable standard-configuration listing. */
  private stdQuery = "";
  /** The current filter query for the second (non-applicable) standard-configuration listing. */
  private stdAllQuery = "";
  /**
   * The listing row whose documentation the shared API-Doc viewer currently shows (right-click), if
   * any. Used to ignore `mouseleave` events of unrelated rows when deciding whether to dismiss it.
   */
  private docAnchorRow: HTMLElement | undefined;
  /** The standard-configuration section, hidden while the form-level CodBi enable checkbox is unchecked. */
  private readonly stdSection: HTMLElement;
  /** The functionality section, hidden while the form-level CodBi enable checkbox is unchecked. */
  private readonly funcSection: HTMLElement;
  /** The parameter table section, hidden while the form-level CodBi enable checkbox is unchecked. */
  private readonly paramSection: HTMLElement;
  /** The activation notice shown in place of the panel while the form-level CodBi enable checkbox is unchecked. */
  private readonly codBiDisabledHint: HTMLElement;

  constructor(config: TEditorCfg<IElementFunctionalityConfigDescriptor>) {
    super(config, "", "text");
    this.selected = parseCsv(selectedProperty(ELEMENT_FUNCS_PROPERTY));

    this.root = document.createElement("div");
    this.root.className = "codbi-func-config codbi-func-config--element";
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
    // Explains what the button is for (native tooltip).
    allToggleButton.title = kI18n("designer.element.property.funcs.more.hint");
    // The toggle of the APPLICABLE list, placed ABOVE the list it controls (the "not declared" toggle
    // sits BELOW its list). It carries the SAME `.codbi-func-config__show-all` style; only the top
    // margin is neutralized by the `--main` modifier (see frame.css). Like the second list, the
    // applicable list starts COLLAPSED and is revealed by this button.
    const mainToggleButton = document.createElement("button");
    mainToggleButton.type = "button";
    mainToggleButton.className = "codbi-func-config__show-all codbi-func-config__show-all--main";
    mainToggleButton.setAttribute("aria-expanded", "false");
    mainToggleButton.addEventListener("click", () => this.toggleApplicableList());
    // Explains what the button is for (native tooltip).
    mainToggleButton.title = kI18n("designer.element.property.funcs.hint");
    // The listing box CONTAINS the filter input (top) and the option rows below it.
    const funcList = document.createElement("div");
    funcList.className = "codbi-func-config__funclist";
    // Inside the double-button frame, so it carries no border of its own (see frame.css).
    funcList.style.cssText = "max-height:220px;overflow:auto;padding:4px;";
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
    // Inside the double-button frame, so it carries no border of its own (see frame.css).
    funcAllList.style.cssText = "max-height:220px;overflow:auto;padding:4px;display:none;";
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
    // The two toggles (the section's "Funktionalitäten" opener and the "more" opener below it) form
    // ONE stacked double button split into a TOP part and a BOTTOM part (see frame.css). The top part
    // holds the "Funktionalitäten" half AND its applicability listing (which therefore sits above the
    // divider); the bottom part holds the "Weitere Funktionalitäten" half and the complement listing.
    const funcTop = document.createElement("div");
    funcTop.className = "codbi-func-config__part";
    funcTop.append(mainToggleButton, funcList);
    const funcBottom = document.createElement("div");
    funcBottom.className = "codbi-func-config__part";
    funcBottom.append(allToggleButton, funcAllList);
    const funcToggles = document.createElement("div");
    funcToggles.className = "codbi-func-config__double";
    funcToggles.append(funcTop, funcBottom);
    funcSection.append(funcToggles);
    this.funcSection = funcSection;
    this.funcFilter = funcFilter;
    this.allFuncFilter = allFuncFilter;
    this.funcOptions = funcOptions;
    this.funcList = funcList;
    this.mainToggleButton = mainToggleButton;
    this.funcAllList = funcAllList;
    this.funcOptionsAll = funcOptionsAll;
    this.allToggleButton = allToggleButton;
    // #endregion 1. Functionality picker.

    // #region 2. Standard-configuration listing. Shows the AVAILABLE CodBi standard configurations as
    // two lists split by whether the class applies to the selected element's widget type — the same
    // "applicable / not-applicable" split as the functionality lists. Holistic configurations and any
    // `Active` (form-level toggle) state are ignored here: the Configurations metadata is global, not
    // per-form. Each row carries a checkbox (styled identically to the functionality checkboxes) that
    // applies/removes the class on the selected element — the class IS the runtime hook of the
    // configuration. A config that provides no CSS class renders an informational row without a
    // checkbox, since there is nothing to apply.
    const stdSection = document.createElement("div");
    stdSection.className = "codbi-func-config__section codbi-func-config__section--standards";
    // NOTE: no separate `<strong>` section title — the APPLICABLE list's toggle button carries the
    // "Standard configurations" label, so it acts as BOTH the section heading and its collapse control.
    // The toggle for the SECOND (non-applicable) standard-configuration list. It stays hidden until
    // the user clicks it (placed BELOW the list it controls), mirroring the functionality toggle.
    const stdToggleButton = document.createElement("button");
    stdToggleButton.type = "button";
    stdToggleButton.className = "codbi-func-config__show-all codbi-func-config__show-all--std";
    stdToggleButton.setAttribute("aria-expanded", "false");
    stdToggleButton.addEventListener("click", () => this.toggleStdInapplicableList());
    // Explains what the button is for (native tooltip).
    stdToggleButton.title = kI18n("designer.element.standardConfig.more.hint");
    // The listing box CONTAINS the filter input (top) and the option rows below it.
    const stdList = document.createElement("div");
    stdList.className = "codbi-func-config__funclist";
    // Inside the double-button frame, so it carries no border of its own (see frame.css).
    stdList.style.cssText = "max-height:160px;overflow:auto;padding:4px;";
    const stdFilter = document.createElement("input");
    stdFilter.type = "text";
    stdFilter.className = "codbi-func-config__filter";
    stdFilter.placeholder = kI18n("designer.element.standardConfig.filter");
    stdFilter.value = this.stdQuery;
    stdFilter.style.cssText = "width:100%;box-sizing:border-box;margin:0 0 4px;";
    stdFilter.addEventListener("input", () => {
      this.stdQuery = stdFilter.value;
      this.renderStandardConfigList();
    });
    // The toggle of the APPLICABLE standard-configuration list, placed between the section title and
    // the list (mirrors the functionality section). Same `.codbi-func-config__show-all` style; the
    // list starts COLLAPSED like the second one.
    const stdMainToggleButton = document.createElement("button");
    stdMainToggleButton.type = "button";
    stdMainToggleButton.className = "codbi-func-config__show-all codbi-func-config__show-all--main";
    stdMainToggleButton.setAttribute("aria-expanded", "false");
    stdMainToggleButton.addEventListener("click", () => this.toggleStdApplicableList());
    // Explains what the button is for (native tooltip).
    stdMainToggleButton.title = kI18n("designer.element.standardConfig.label.hint");
    const stdOptions = document.createElement("div");
    stdOptions.className = "codbi-func-config__options";
    stdList.append(stdFilter, stdOptions);
    // The SECOND list: available standard configurations NOT applicable to the selected element.
    const stdAllList = document.createElement("div");
    stdAllList.className = "codbi-func-config__funclist codbi-func-config__funclist--all";
    // Inside the double-button frame, so it carries no border of its own (see frame.css).
    stdAllList.style.cssText = "max-height:160px;overflow:auto;padding:4px;display:none;";
    const stdAllFilter = document.createElement("input");
    stdAllFilter.type = "text";
    stdAllFilter.className = "codbi-func-config__filter";
    stdAllFilter.placeholder = kI18n("designer.element.standardConfig.filter");
    stdAllFilter.value = this.stdAllQuery;
    stdAllFilter.style.cssText = "width:100%;box-sizing:border-box;margin:0 0 4px;";
    stdAllFilter.addEventListener("input", () => {
      this.stdAllQuery = stdAllFilter.value;
      this.renderStandardConfigList();
    });
    const stdOptionsAll = document.createElement("div");
    stdOptionsAll.className = "codbi-func-config__options codbi-func-config__options--all";
    stdAllList.append(stdAllFilter, stdOptionsAll);
    // Same stacked double-button wrapper as the functionality section (see the comment there): a TOP
    // part (opener + its applicability listing, above the divider) and a BOTTOM part (the "Weitere"
    // opener + the complement listing).
    const stdTop = document.createElement("div");
    stdTop.className = "codbi-func-config__part";
    stdTop.append(stdMainToggleButton, stdList);
    const stdBottom = document.createElement("div");
    stdBottom.className = "codbi-func-config__part";
    stdBottom.append(stdToggleButton, stdAllList);
    const stdToggles = document.createElement("div");
    stdToggles.className = "codbi-func-config__double";
    stdToggles.append(stdTop, stdBottom);
    stdSection.append(stdToggles);
    this.stdSection = stdSection;
    this.stdOptions = stdOptions;
    this.stdFilter = stdFilter;
    this.stdAllFilter = stdAllFilter;
    this.stdList = stdList;
    this.stdMainToggleButton = stdMainToggleButton;
    this.stdAllList = stdAllList;
    this.stdOptionsAll = stdOptionsAll;
    this.stdToggleButton = stdToggleButton;
    // #endregion 2. Standard-configuration listing.

    // #region 3. Parameter table (applied directly to the selected element).
    const paramSection = document.createElement("div");
    paramSection.className = "codbi-func-config__section";
    const paramTitle = document.createElement("strong");
    paramTitle.className = "codbi-func-config__title";
    paramTitle.textContent = kI18n("designer.widget.functionality.parameters");
    // Hidden until the first parameter is rendered (see `renderParams`).
    paramTitle.style.display = "none";
    this.paramTitle = paramTitle;
    this.paramsHost = document.createElement("div");
    this.paramsHost.className = "codbi-func-config__params";
    paramSection.append(paramTitle, this.paramsHost);
    this.paramSection = paramSection;
    // #endregion 3. Parameter table.

    // #region 4. CodBi-disabled notice. Shown INSTEAD of the three sections above while the form-level
    // "CodBi aktiviert" checkbox (`codbi-prop-enable`) is unchecked. Rendered as a `<details>` block
    // that is FOLDED by default: with CodBi switched off the whole settings panel collapses to one
    // line (the summary) instead of occupying the pane with the full explanation; expanding it shows
    // the message on how to enable CodBi. It is hidden completely while CodBi IS enabled
    // (`syncCodBiEnabledVisibility` toggles the `display`).
    const codBiDisabledHint = document.createElement("details");
    codBiDisabledHint.className = "codbi-func-config__disabled";
    codBiDisabledHint.open = false;
    codBiDisabledHint.style.display = "none";
    const codBiDisabledTitle = document.createElement("summary");
    codBiDisabledTitle.className = "codbi-func-config__disabled-title";
    codBiDisabledTitle.textContent = kI18n("designer.element.property.codbi.inactive.title");
    const codBiDisabledText = document.createElement("p");
    codBiDisabledText.className = "codbi-func-config__disabled-text";
    codBiDisabledText.textContent = kI18n("designer.element.property.codbi.inactive.message");
    codBiDisabledHint.append(codBiDisabledTitle, codBiDisabledText);
    this.codBiDisabledHint = codBiDisabledHint;
    // #endregion 4. CodBi-disabled notice.

    this.root.append(stdSection, funcSection, paramSection, codBiDisabledHint);
    this.renderStandardConfigList();
    this.renderFunctionalityList();
    this.renderParams();
    this.syncApplicableVisibility();
    this.syncInapplicableVisibility();
    this.syncStdApplicableVisibility();
    this.syncStdInapplicableVisibility();
    // React immediately when the user flips the form-level "CodBi aktiviert" checkbox (no save needed).
    this.registerCodBiEnableListener();
    this.syncCodBiEnabledVisibility();
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
    // Re-render BOTH listings when Formcycle (re)assigns the value / a different element is selected.
    // The standard-config listing depends on the currently selected element's widget class; without a
    // re-render here it stays locked to the state from construction time (when no element is selected
    // yet, so only fail-open configs like the "Print" ones appear applicable).
    this.renderFunctionalityList();
    this.renderStandardConfigList();
    this.renderParams();
    // Re-check the form-level "CodBi aktiviert" checkbox: the panel is hidden while CodBi is disabled.
    this.syncCodBiEnabledVisibility();
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
    const result = { className: item.className ?? undefined, properties };
    return result;
  }

  /**
   * Writes the `data-cb-func` attribute onto an element — or REMOVES it entirely when no functionality
   * is active (`csv` empty). Leaving an empty `data-cb-func` behind would make the runtime/preview
   * still treat the element as having a functionality applied, so an empty selection must drop the
   * attribute rather than persist an empty value.
   */
  private writeFuncAttribute(item: IItemLike, csv: string): void {
    if (csv === "") {
      removeFuncAttributeQuiet(item as never, CB_FUNC_ATTRIBUTE);
    } else {
      setItemAttributeValueQuiet(item as never, CB_FUNC_ATTRIBUTE, csv);
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
      // Use the QUIET write paths: they mutate the property bags and nudge the persist differ
      // without forcing the designer's shared AttributesEditor to re-valuate. The badge tables are
      // fast because their item is never the SELECTED one (so `syncAttributesEditor` early-returns);
      // this editor works on the SELECTED master item, so the non-quiet variant would run the full
      // `editor.setValue` + `triggerSetProperty` re-valuation on every keystroke — the ~1s lag.
      setItemAttributeValueQuiet(item as never, name, value);
      this.writeFuncAttribute(item, this.selected.join(","));
    }
  }

  /**
   * Persists the current functionality selection into the element's `funcs` / `funcs_name` props.
   *
   * The values are written DIRECTLY into the item's property bags (quiet write) instead of firing the
   * designer's `set-property` callback. The callback makes FORMCYCLE re-valuate the whole property view
   * of the SELECTED item (~1s) — that was the lag that made toggling a functionality feel slow — while
   * the quiet bag write + persist-differ nudge is instant, exactly like the parameter writes
   * ({@link writeAttribute}) and the standard-config class toggle (`setElementCssClass`). The on-canvas
   * badges, which the `set-property` callback used to refresh, are refreshed explicitly instead.
   */
  private persistFunctionalities(): void {
    const csv = this.selected.join(",");
    // Cache the display names (original casing) resolved from the registry for the designer.
    const names = this.selected.map((id) => originalCaseKey(id)).filter((entry) => entry !== "");
    // The `data-cb-func` attribute lives directly on the selected element so the runtime/preview see
    // the applied functionalities even when only toggled without touching a parameter.
    const item = this.targetElement();
    if (item) {
      setItemPropertyValueQuiet(item as never, ELEMENT_FUNCS_PROPERTY, csv);
      setItemPropertyValueQuiet(item as never, ELEMENT_FUNCS_NAME_PROPERTY, names.join(","));
      this.writeFuncAttribute(item, csv);
    }
    // The `set-property` callback used to re-apply the canvas badges; keep them in sync after the
    // quiet write (the selected item's config panel re-renders itself below).
    refreshCodbiElementMarkers();
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
    // BEFORE any pruning. Persisting first guarantees that any subsequent read of the property (e.g. a
    // re-valuation triggered by the pruning's removals) already sees the reduced selection, so a
    // removed functionality cannot be re-added and its checkbox cannot stay checked.
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
      // AttributesEditor re-valuation: the selection is already persisted quietly in
      // `persistFunctionalities`, so forcing a re-valuation here would only add the ~1s lag back.
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
    // Hovering the row shows the functionality's short, localized description. The id is the
    // fallback so the row still has a useful tooltip when no Summary is published.
    const tooltip = functionalitySummary(id) || id;
    row.title = tooltip;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = id;
    checkbox.checked = isSelected;
    checkbox.addEventListener("change", () => this.toggleFunctionality(id, checkbox.checked));
    const text = document.createElement("span");
    text.textContent = id;
    text.title = tooltip;
    row.append(checkbox, text);
    // Right-clicking a row opens its documentation in the shared API-Doc viewer; leaving the row
    // without reaching the viewer closes it again.
    row.addEventListener("contextmenu", (event) => this.openDocsOnRightClick(event, "functionality", id, row));
    row.addEventListener("mouseleave", () => this.onRowPointerLeave(row));
    return row;
  }

  /**
   * Whether the form-level "CodBi aktiviert" checkbox (`codbi-prop-enable`, default `"0"`) is
   * currently checked for the edited form. Mirrors the `WhenCodBiEnabled` descriptor used for the
   * form-level CodBi panel (see `register-custom-form-properties.ts`): every non-essential CodBi
   * surface stays hidden while CodBi is disabled for the form.
   *
   * The LIVE DOM checkbox is consulted FIRST: it reflects the current UI state — including an
   * unsaved toggle — so flipping it updates this panel immediately, without a save + reload. The saved
   * form-property model is only consulted when no checkbox is present (e.g. the element panel is open
   * while the form's CodBi settings panel is not rendered), mirroring `getFormPropertyValueForCurrentLang`.
   * If neither is available the panel stays visible (the previous behaviour, so the gate never hides
   * the panel due to missing plumbing).
   */
  private isCodBiEnabled(): boolean {
    // The live checkbox is the authoritative, immediate source of truth when it exists.
    try {
      const checkbox = document.querySelector<HTMLInputElement>(CODBI_ENABLE_CHECKBOX_SELECTOR);
      if (checkbox) {
        return checkbox.checked === true;
      }
    } catch {
      // ignore, fall back to the saved form-property model below
    }
    try {
      const designer = instance() as unknown as
        | {
            getFormPropertyValueForCurrentLang?: (property: string) => unknown;
          }
        | undefined;
      const value = designer?.getFormPropertyValueForCurrentLang?.(Constants["designer.property.enable_codbi"]);
      if (value === "1" || value === 1 || value === true) {
        return true;
      }
      if (value !== undefined && value !== null && value !== "") {
        // A definitive non-truthy value ("0" / 0 / false) means CodBi is disabled for this form.
        return false;
      }
    } catch {
      // ignore
    }
    // Neither the checkbox nor the property model is available — keep the panel visible.
    return true;
  }

  /**
   * Registers a `change` listener on the form-level "CodBi aktiviert" checkbox so the panel reacts
   * IMMEDIATELY when the user flips it — no save + reload required. The checkbox lives in the form's
   * CodBi settings panel (a different DOM subtree), so it is queried by id. Only one listener is ever
   * attached to a given checkbox (tracked in a module-level {@link WeakSet}), because the editor is
   * re-instantiated on every element selection but the checkbox persists.
   */
  private registerCodBiEnableListener(): void {
    try {
      const checkbox = document.querySelector<HTMLInputElement>(CODBI_ENABLE_CHECKBOX_SELECTOR);
      if (checkbox && !codBiEnableCheckboxesWithListener.has(checkbox)) {
        codBiEnableCheckboxesWithListener.add(checkbox);
        checkbox.addEventListener("change", () => this.syncCodBiEnabledVisibility());
      }
    } catch {
      // The checkbox is not rendered yet — the next editor construction re-tries the registration.
    }
  }

  /**
   * Synchronizes the panel with the form-level "CodBi aktiviert" checkbox. While CodBi is disabled the
   * three configurable sections are hidden and a notice is shown in their place (the CodBi watermark
   * stays visible behind it), so the user sees an explanation instead of an empty shell. The root stays
   * attached so the watermark renders. Re-evaluated on every {@link setValue} and on every `change` of
   * the enabling checkbox (see {@link registerCodBiEnableListener}).
   */
  private syncCodBiEnabledVisibility(): void {
    const enabled = this.isCodBiEnabled();
    const contentHidden = enabled ? "" : "none";
    this.stdSection.style.display = contentHidden;
    this.funcSection.style.display = contentHidden;
    this.paramSection.style.display = contentHidden;
    this.codBiDisabledHint.style.display = enabled ? "none" : "";
    // FOLD the panel while CodBi is inactive: without the padding/gap/watermark the editor shrinks to
    // the single collapsed summary row instead of looking like a full settings panel.
    this.root.classList.toggle("codbi-func-config--inactive", !enabled);
  }

  /** Shows/hides the APPLICABLE functionality list (and syncs its toggle button). */
  private toggleApplicableList(): void {
    this.showApplicable = !this.showApplicable;
    this.syncApplicableVisibility();
    // Focus the listing's filter right after expanding it, so the user can type immediately.
    if (this.showApplicable) {
      this.funcFilter.focus();
    }
  }

  /**
   * Sets a toggle button's `▾`/`▸` state indicator, its `aria-expanded` attribute and its
   * state-INDEPENDENT label resolved from `labelKey` — the text never changes with the state, only
   * the arrow does (e.g. "▸ Funktionalitäten" / "▾ Funktionalitäten").
   *
   * @param button   The toggle button to update.
   * @param expanded Whether the list it controls is currently expanded.
   * @param labelKey The message key of the (fixed) button label.
   */
  private syncToggleButton(button: HTMLButtonElement, expanded: boolean, labelKey: string): void {
    // The chevron is its OWN element (not part of the label text) so `frame.css` can render it larger
    // than the label — the `▸`/`▾` glyphs are barely visible at the button's 11px label size. It is
    // purely decorative (the state is exposed via `aria-expanded`).
    const chevron = document.createElement("span");
    chevron.className = "codbi-func-config__show-all__chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = expanded ? "\u25BE" : "\u25B8";
    // The label is its OWN element as well: a half of a double button must stay ONE thin line, so the
    // label is ellipsized instead of WRAPPING (a wrapped label made the "Funktionalitäten" double
    // taller than the "Standard-Konfigurationen" one — see frame.css).
    const label = document.createElement("span");
    label.className = "codbi-func-config__show-all__label";
    // The leading space keeps `textContent` identical to the previous plain-text form.
    label.textContent = ` ${kI18n(labelKey)}`;
    button.replaceChildren(chevron, label);
    button.setAttribute("aria-expanded", String(expanded));
  }

  /** Applies {@link showApplicable} to the APPLICABLE functionality list and its toggle button. */
  private syncApplicableVisibility(): void {
    this.funcList.style.display = this.showApplicable ? "block" : "none";
    // The button doubles as the section heading: "Funktionalitäten".
    this.syncToggleButton(this.mainToggleButton, this.showApplicable, "designer.widget.functionality.funcs");
  }

  /** Shows/hides the second (non-applicable) functionality list. */
  private toggleInapplicableList(): void {
    this.showInapplicable = !this.showInapplicable;
    this.syncInapplicableVisibility();
    // Focus the listing's filter right after expanding it, so the user can type immediately.
    if (this.showInapplicable) {
      this.allFuncFilter.focus();
    }
  }

  /** Applies {@link showInapplicable} to the second list and its toggle button. */
  private syncInapplicableVisibility(): void {
    this.funcAllList.style.display = this.showInapplicable ? "block" : "none";
    // "Weitere Funktionalitäten".
    this.syncToggleButton(this.allToggleButton, this.showInapplicable, "designer.element.property.funcs.more");
  }

  /**
   * Renders the two **standard-configuration** lists:
   *
   * 1. the **main** list with the CSS standard **classes** the AVAILABLE CodBi standard
   *    configurations provide AND that are applicable to the selected element (applicability by the
   *    class's own widget list / the functionalities it applies — fail-open when the config declares
   *    none), plus every class already applied to the element;
   * 2. the **second** list (hidden until toggled) with the complement — the CSS standard classes
   *    provided by configurations NOT deemed applicable to this element.
   *
   * Each row is one CSS-Class (e.g. `CodBi_NoFutureDate`, shown without the leading `.`) that a
   * standard configuration defines via `loadConfig`/`loadConfigs`. The row carries a checkbox that
   * applies/removes the class on the selected element (see {@link toggleStandardConfigClass}); its
   * checked state reflects the element's current `cssclasses`. A configuration that provides no CSS
   * classes falls back to its config id as a single informational row (no checkbox — an id is not a
   * class and cannot be applied to the element).
   */
  private renderStandardConfigList(): void {
    const query = this.stdQuery.trim().toLowerCase();
    const allQuery = this.stdAllQuery.trim().toLowerCase();
    const target = this.applicabilityElement();
    const element = this.targetElement();
    // The classes already on the element decide every checkbox's initial state.
    const applied = new Set(element ? elementCssClasses(element as never) : []);
    const mainFragment = document.createDocumentFragment();
    const otherFragment = document.createDocumentFragment();
    let mainShown = 0;

    for (const [id, classes, funcs, spec] of activeStandardConfigs()) {
      // The labels shown are the config's CSS classes (when it provides any), else its id. Only a
      // real CSS class is applicable per element, so an id-only row stays informational.
      const hasClasses = classes != null && Object.keys(classes).length > 0;
      const labels = hasClasses ? Object.keys(classes as Record<string, unknown>) : [id];
      for (const label of labels) {
        // A class the element already carries is ALWAYS shown (and checked) in the main list, so an
        // applied class cannot silently disappear even when its declared applicability excludes this
        // element (it can then still be unchecked).
        const isSelected = hasClasses && applied.has(label);
        // Applicability is decided PER CSS-CLASS from that class's own widget list (its `classes`
        // entry) / the functionalities it actually applies (`funcs[class]`), so a config file may
        // legitimately split its classes across widget types.
        const applicable = isSelected || this.standardConfigClassApplies(funcs, classes, spec, label, target);
        const lower = label.toLowerCase();
        // Each listing has its OWN inline filter. Selected entries are never hidden by a filter
        // mismatch so a selection cannot silently disappear.
        const matches =
          (applicable
            ? query.length === 0 || lower.includes(query)
            : allQuery.length === 0 || lower.includes(allQuery)) || isSelected;
        if (!matches) {
          continue;
        }
        // The class entry carries the short, human-readable description of the standard
        // configuration's CSS class (under the optimised `classes` shape). Fall back to the id so the
        // row always has a meaningful tooltip.
        const classSpec = hasClasses ? classes?.[label] : undefined;
        const classDescription = typeof classSpec === "string" ? classSpec : classSpec?.description;
        const tooltip = this.standardConfigTooltip(id, label, classDescription, funcs?.[label]);
        const row = this.buildStandardConfigRow(id, label, isSelected, hasClasses, tooltip);
        if (applicable) {
          mainShown += 1;
          mainFragment.appendChild(row);
        } else {
          otherFragment.appendChild(row);
        }
      }
    }
    if (mainShown === 0) {
      const empty = document.createElement("div");
      empty.style.cssText = "padding:4px;color:#6b7280;";
      empty.textContent = kI18n("designer.element.standardConfig.noResults");
      mainFragment.appendChild(empty);
    }
    if (otherFragment.childElementCount === 0) {
      const empty = document.createElement("div");
      empty.style.cssText = "padding:4px;color:#6b7280;";
      empty.textContent = kI18n("designer.element.standardConfig.noInapplicable");
      otherFragment.appendChild(empty);
    }
    this.stdOptions.replaceChildren(mainFragment);
    this.stdOptionsAll.replaceChildren(otherFragment);
  }

  /**
   * Whether a single standard-configuration CSS class applies to the given element.
   *
   * The preferred, self-contained path reads the class's OWN entry of the config's `classes` map
   * (`classes[cssClass].formelementtypes` — the widget types derived at build time from that class's
   * FUNC `@SupportedFormelementtype` metadata and persisted into the config `.json`). This needs no
   * `detFunctionalities`/functionality-registry resolution.
   *
   * When the class entry carries no widget types, applicability falls back to the OR across the
   * functionalities that class actually applies (`funcs[cssClass]`, a comma-separated FUNC list),
   * then to a legacy/synthetic file-level ARRAY/string `spec`, else fail-open (applies to any
   * element).
   */
  private standardConfigClassApplies(
    funcs: Record<string, string> | undefined,
    classes: Record<string, TStandardConfigClassSpec> | undefined,
    spec: TStandardConfigSupportedSpec | undefined,
    cssClass: string,
    element: IApplicabilityElement | undefined,
  ): boolean {
    // Preferred: the class's OWN widget-type list (held in its `classes` entry) — no registry lookup.
    const perClass = standardConfigClassTypes(classes, cssClass);
    if (perClass != null) {
      return standardConfigAppliesTo(perClass, element);
    }
    const csv = funcs?.[cssClass];
    if (csv == null || String(csv).trim() === "") {
      // No per-class FUNC mapping and no per-class widget list. Honor a legacy/synthetic
      // file-level ARRAY/string `spec` when present; otherwise fail-open — a config class with no
      // applicable functionality targets ANY element.
      if (Array.isArray(spec)) {
        return standardConfigAppliesTo(spec, element);
      }
      if (typeof spec === "string") {
        return standardConfigAppliesTo(spec, element);
      }
      return true;
    }
    const funcNames = String(csv)
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    return funcNames.some((name) => functionalityAppliesTo(name, element));
  }

  /**
   * Applies/removes a standard configuration's CSS class on the SELECTED element. The class is the
   * runtime hook of a standard configuration: each configuration's `loadConfig({ targets: ".<class>",
   * FUNC })` matches elements by that class, so adding/removing the class enables/disables the
   * configuration for THIS element — no `data-cb-func` needs to be written (the class carries it).
   * The listing is re-rendered afterwards so the checkbox state and the list ordering stay in sync.
   */
  private toggleStandardConfigClass(label: string, on: boolean): void {
    const item = this.targetElement();
    if (!item) {
      return;
    }
    setElementCssClass(item as never, label, on);
    this.renderStandardConfigList();
  }

  /**
   * Tooltip text of one standard-configuration row.
   *
   * The class descriptions published by the configuration `.json` files are currently English-only.
   * For other designer languages, derive the tooltip from the LOCALIZED short summaries of the
   * functionalities that class applies. When no functionality summary is available, keep the
   * published class description as the fallback.
   */
  private standardConfigTooltip(
    id: string,
    label: string,
    classDescription: string | undefined,
    funcsCsv: string | undefined,
  ): string {
    const base = classDescription || id;
    if (getDesignerLanguage().toLowerCase() === "en") {
      return base;
    }
    const summaries = String(funcsCsv ?? "")
      .split(",")
      .map((func) => func.trim())
      .filter(Boolean)
      .map((func) => functionalitySummary(func))
      .filter(Boolean);
    const unique = [...new Set(summaries)];
    return unique.length > 0 ? unique.join(" · ") : base;
  }

  /**
   * Builds one standard-configuration option row.
   *
   * When the row is a real CSS class it carries the SAME cheque-box as a functionality row (the same
   * `codbi-func-config__option` class + a plain `input[type="checkbox"]`, which `frame.css` paints
   * darkorange) and applies/removes the class on the element via {@link toggleStandardConfigClass}.
   * A configuration that provides no CSS class falls back to its id as a plain informational row (an
   * id is not a class — there is nothing to apply per element).
   *
   * Right-clicking ANY row opens the documentation of the owning standard CONFIGURATION (its
   * `detStandards[id].Description`) in the shared API-Doc viewer — independent of the CSS class shown,
   * since the doc lives with the configuration, not the class.
   *
   * @param id          The owning standard-configuration id (the `detStandards` key).
   * @param label       The CSS class name (or the config id for an id-only row).
   * @param isSelected  Whether the element already carries the class.
   * @param hasCheckbox **True** for a real CSS class (checkbox), **false** for an id-only row.
   */
  private buildStandardConfigRow(
    id: string,
    label: string,
    isSelected: boolean,
    hasCheckbox: boolean,
    tooltip: string,
  ): HTMLElement {
    if (!hasCheckbox) {
      const readOnly = document.createElement("div");
      readOnly.className = "codbi-func-config__option codbi-func-config__option--readonly";
      readOnly.style.cssText = "display:flex;align-items:center;gap:6px;padding:2px 4px;";
      readOnly.title = tooltip;
      const readOnlyText = document.createElement("span");
      readOnlyText.textContent = label;
      readOnlyText.title = tooltip;
      readOnly.append(readOnlyText);
      // Right-clicking the row opens its configuration's documentation in the shared API-Doc viewer;
      // leaving the row without reaching the viewer closes it again.
      readOnly.addEventListener("contextmenu", (event) => this.openDocsOnRightClick(event, "standard", id, readOnly));
      readOnly.addEventListener("mouseleave", () => this.onRowPointerLeave(readOnly));
      return readOnly;
    }
    const row = document.createElement("label");
    row.className = "codbi-func-config__option";
    row.style.cssText = "display:flex;align-items:center;gap:6px;padding:2px 4px;cursor:pointer;";
    row.title = tooltip;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = label;
    checkbox.checked = isSelected;
    checkbox.title = tooltip;
    checkbox.addEventListener("change", () => this.toggleStandardConfigClass(label, checkbox.checked));
    const text = document.createElement("span");
    text.textContent = label;
    text.title = tooltip;
    row.append(checkbox, text);
    // Right-clicking the row opens its configuration's documentation in the shared API-Doc viewer;
    // leaving the row without reaching the viewer closes it again.
    row.addEventListener("contextmenu", (event) => this.openDocsOnRightClick(event, "standard", id, row));
    row.addEventListener("mouseleave", () => this.onRowPointerLeave(row));
    return row;
  }

  /**
   * Opens the documentation of one functionality / standard configuration in the shared API-Doc
   * viewer — the same viewer the attribute-config `ALT+F` and CSS-config `.` flows use — when the user
   * right-clicks a listing row. The viewer is anchored to the row and stays open while the pointer
   * reaches it in time; leaving the row without doing so closes it again (see
   * {@link onRowPointerLeave}). A no-op when the local API-doc interface has not published its hook.
   *
   * @param event The originating `contextmenu` event (its default browser menu is suppressed).
   * @param kind  The registry to read the documentation from.
   * @param id    The functionality id (case-insensitive) or the standard-configuration id.
   * @param row   The listing row the viewer is anchored to.
   */
  private openDocsOnRightClick(
    event: MouseEvent,
    kind: "functionality" | "standard",
    id: string,
    row: HTMLElement,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    this.docAnchorRow = row;
    try {
      window.CodbiPluginData?.showCodbiDoc?.(kind, id, row);
    } catch (x) {
      console.error("[CodBi] Element: could not open the documentation", x);
    }
  }

  /**
   * Notifies the shared API-Doc viewer that the pointer left the listing row whose documentation it
   * currently shows, so it can dismiss unless the pointer reaches the viewer in time. Restricted to
   * the row the doc was actually opened from, so leaving an unrelated row does not close it.
   *
   * @param row The listing row the pointer left.
   */
  private onRowPointerLeave(row: HTMLElement): void {
    if (this.docAnchorRow !== row) {
      return;
    }
    try {
      window.CodbiPluginData?.codbiDocAnchorLeft?.();
    } catch {
      /* ignore */
    }
  }

  /** Shows/hides the APPLICABLE standard-configuration list (and syncs its toggle button). */
  private toggleStdApplicableList(): void {
    this.showStdApplicable = !this.showStdApplicable;
    this.syncStdApplicableVisibility();
    // Focus the listing's filter right after expanding it, so the user can type immediately.
    if (this.showStdApplicable) {
      this.stdFilter.focus();
    }
  }

  /** Applies {@link showStdApplicable} to the APPLICABLE standard-configuration list and its button. */
  private syncStdApplicableVisibility(): void {
    this.stdList.style.display = this.showStdApplicable ? "block" : "none";
    // The button doubles as the section heading: "Standard-Konfigurationen".
    this.syncToggleButton(this.stdMainToggleButton, this.showStdApplicable, "designer.element.standardConfig.label");
  }

  /** Shows/hides the second (non-applicable) standard-configuration list. */
  private toggleStdInapplicableList(): void {
    this.showStdInapplicable = !this.showStdInapplicable;
    this.syncStdInapplicableVisibility();
    // Focus the listing's filter right after expanding it, so the user can type immediately.
    if (this.showStdInapplicable) {
      this.stdAllFilter.focus();
    }
  }

  /** Applies {@link showStdInapplicable} to the second list and its toggle button. */
  private syncStdInapplicableVisibility(): void {
    this.stdAllList.style.display = this.showStdInapplicable ? "block" : "none";
    // "Weitere Standard-Konfigurationen".
    this.syncToggleButton(this.stdToggleButton, this.showStdInapplicable, "designer.element.standardConfig.more");
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
      // Hovering the group header shows the functionality's short description (localized), analogous to
      // the per-parameter rows' description tooltips. The `cursor:default` on
      // `.codbi-func-config__param-group` (see frame.css) suppresses the text-selection caret.
      const summary = functionalitySummary(id);
      if (summary) {
        header.title = summary;
      }
      fragment.appendChild(header);
      for (const name of names) {
        try {
          fragment.appendChild(this.buildParamRow(element, name, params[name], findParameterSpec(types, name)));
        } catch (x) {
          console.error("[CodBi] Element: could not render parameter", id, name, x);
        }
      }
    }
    // The "Parameter" title is shown only when there is at least one parameter to display. When the
    // selection has no parameters, both the heading and the (former) "Keine Parameter" hint are
    // hidden entirely — nothing is rendered below the highlighted double button in that case.
    this.paramTitle.style.display = any ? "" : "none";
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
 * The AVAILABLE (non-holistic) CodBi standard configurations as
 * `[id, classes, funcs, spec]` tuples.
 *
 * Every configured standard configuration is offered here — the per-element listing is NOT gated on
 * the form-level toggle state (`detStandards[*].Active`), since that flag is only populated by the
 * form-level "Standard Configurations" MultiSelect editor at runtime and is absent from the
 * `detStandards` injected by the plugin (the Configurations `.json` metadata carries no `Active`
 * field). `classes` maps each CSS-Class this configuration provides (via `loadConfig`/`loadConfigs`)
 * to its entry — under the optimised shape each class's description AND its FORMCYCLE widget list
 * are stored together (`classes[cssClass].formelementtypes`), so the class name appears as a key
 * exactly once. `funcs` maps each CSS-Class to the comma-separated FUNC list it applies. `spec` is
 * the config's top-level `supportedFormelementtypes`: absent for regular configs, `["Holistic"]`
 * for a holistic one.
 *
 * **Holistic** configurations — those published with the `"Holistic"` keyword in their
 * `supportedFormelementtypes` (case-insensitive) — are EXCLUDED: they resolve their targets by a
 * runtime selector and must not appear in the per-element standard-configuration listings. Entries
 * are sorted by id so the panel listing is stable.
 */
function activeStandardConfigs(): Array<
  [
    string,
    Record<string, TStandardConfigClassSpec> | undefined,
    Record<string, string> | undefined,
    TStandardConfigSupportedSpec,
  ]
> {
  try {
    const entries = window.CodbiPluginData?.detStandards ?? {};
    const result: Array<
      [
        string,
        Record<string, TStandardConfigClassSpec> | undefined,
        Record<string, string> | undefined,
        TStandardConfigSupportedSpec,
      ]
    > = [];
    for (const [id, def] of Object.entries(entries)) {
      if (def && !standardConfigIsHolistic(def.supportedFormelementtypes)) {
        result.push([id, def.classes, def.funcs, def.supportedFormelementtypes]);
      }
    }
    return result.sort((a, b) => a[0].localeCompare(b[0]));
  } catch {
    return [];
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
 * Re-renders the per-element CodBi config panel of the CURRENTLY SELECTED element.
 *
 * The panel's functionality/standard-configuration listings are derived from
 * `window.CodbiPluginData.detFunctionalities` (`supportedFormelementtypes`) at render time. When
 * something OUTSIDE the designer updates that registry — notably the Angular local API-doc manager
 * after a successful sync — the panel would keep showing the stale split until the element is
 * re-selected or the designer is reloaded. This hook re-runs the panel's own `setValue` (with the
 * element's unchanged selection), which rebuilds both listings and the parameter table in place.
 *
 * A no-op when no element is selected or the panel is not mounted.
 */
export function refreshElementFunctionalityConfig(): void {
  try {
    const view = (
      instance() as unknown as
        | {
            getPropertyView?: () =>
              | {
                  getEditorForProperty?: (property: string) => { setValue?: (value: unknown) => void } | undefined;
                  getPropertyEditors?: () => ReadonlyArray<{
                    config?: { property?: string };
                    setValue?: (value: unknown) => void;
                  }>;
                }
              | undefined;
          }
        | undefined
    )?.getPropertyView?.();
    // Locate the mounted panel (some designer builds key the editor differently — fall back to a scan).
    const editor =
      view?.getEditorForProperty?.(ELEMENT_FUNCS_PROPERTY) ??
      view?.getPropertyEditors?.().find((entry) => entry?.config?.property === ELEMENT_FUNCS_PROPERTY);

    // Re-render with the element's CURRENT selection: `setValue` re-reads the property and redraws.
    editor?.setValue?.(selectedProperty(ELEMENT_FUNCS_PROPERTY));
  } catch (x) {
    console.warn("[CodBi] Element: could not refresh the config panel", x);
  }
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

    // Publish the refresh hook so any OTHER part of the designer (e.g. the Angular local API-doc
    // manager after a successful sync) can make the panel re-evaluate its listings in place.
    if (window.CodbiPluginData) {
      window.CodbiPluginData.refreshElementConfig = refreshElementFunctionalityConfig;
    }
  } catch (x) {
    console.error("[CodBi] Failed to register the per-element CodBi properties", x);
  }
}
