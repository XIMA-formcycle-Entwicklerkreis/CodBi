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
  registerCustomProperty,
  registerLocalizableProperty,
} from "@de-xima/fc-form-designer";
import { Constants } from "codbi-common";
import { setItemAttributeValue } from "./CodbiElementMarkers.js";
import { openEPBuilder } from "./EPBuilder.js";
import { containedElementItem, syncSelectedFunctionalityChild } from "./FunctionalityChildItems.js";
import { i18n as i18nTyped } from "./i18n.js";
// #endregion Imports

/**
 * Loosened `i18n` accessor. The `designer.widget.functionality.*` keys are newly added; the strongly
 * typed `TMessageKey` union is generated from `i18n_en.properties` and may not yet include them in
 * every (stale) build artifact, so the call sites use this widened signature. The keys resolve as
 * soon as the generated `localization.ts` is refreshed; the cast is then a harmless no-op.
 */
const i18n = i18nTyped as unknown as (key: string) => string;

/** Editor type for the Functionality widget's composite configurator. */
export const FunctionalityConfigType =
  "com.github.xima_formcycle_entwicklerkreis.fc.plugin:fc-plugin-codbi:FunctionalityConfig";

/** Describes {@link FunctionalityConfigType}. */
export interface IFunctionalityConfigDescriptor extends IPropertyDescriptor<typeof FunctionalityConfigType> {}

/** Augments **@de-xima/fc-form-designer** so the editor is known to the {@link IEditorMap}. */
declare module "@de-xima/fc-form-designer" {
  export interface IEditorMap {
    [FunctionalityConfigType]: {
      descriptor: IFunctionalityConfigDescriptor;
      editor: FunctionalityConfigEditor;
      value: string;
    };
  }
}

/** Category id grouping the Functionality widget's properties in the element properties panel. */
export const FUNCTIONALITY_CATEGORY_ID = "codbi-cat-functionality";

/** The `data-cb-*` attribute carrying the applied functionalities (mirrors the runtime's FUNC attribute). */
export const CB_FUNC_ATTRIBUTE = "data-cb-func";

/** One form element of the current form, as offered by the target-element selector. */
interface IFormElementOption {
  /** The stable reference stored on the widget (the element's id, falling back to its name). */
  value: string;
  /** The element's display label (falls back to name/id). */
  text: string;
  /** The FORMCYCLE widget class name (e.g. `XFieldSet`), used for the allowed-type filter. */
  className: string;
}

/** The minimal structural view of a designer item this editor needs. */
export interface IItemLike {
  getId?: () => string;
  className?: string;
  getPersist?: () => { properties?: Record<string, unknown> } | undefined;
  properties?: Record<string, unknown>;
}

/** The minimal structural view of the designer instance this editor needs. */
export interface IDesignerLike {
  items?: Record<string, IItemLike>;
  getSelectedMasterItem?: () => IItemLike | undefined;
}

/** Platform-available `functionality.property.funcs` (the CSV of applied functionality ids). */
export const FUNCS_PROPERTY = String(Constants["functionality.property.funcs"]);
/** Platform-available `functionality.property.element` (the single contained element reference). */
export const ELEMENT_PROPERTY = String(Constants["functionality.property.element"]);

/** Reads a property from the selected item's persisted property bag (or `""`). */
export function selectedProperty(name: string): string {
  try {
    const designer = instance() as unknown as IDesignerLike;
    const props = designer?.getSelectedMasterItem?.()?.getPersist?.()?.properties;
    return String(props?.[name] ?? "");
  } catch {
    return "";
  }
}

/** Parses a CSV of functionality ids into a trimmed, de-duplicated, lowercase array. */
export function parseCsv(value: string): string[] {
  return Array.from(
    new Set(
      String(value ?? "")
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  );
}

/** All available CodBi functionality ids (from the designer's `detFunctionalities`), lowercased. */
export function listFunctionalities(): string[] {
  try {
    const entries = window.CodbiPluginData?.detFunctionalities ?? {};
    return Object.keys(entries).sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

/**
 * Resolves the `detFunctionalities` entry for a functionality id **case-insensitively**. The
 * registry keys use the original casing (e.g. `Date.Min`), while the selection is stored lowercased.
 */
export function resolveFunctionalityEntry(
  id: string,
): { Parameter?: Record<string, string>; formElements?: string[] } | undefined {
  try {
    const entries = window.CodbiPluginData?.detFunctionalities ?? {};
    const wanted = id.toLowerCase();
    for (const [candidate, entry] of Object.entries(entries)) {
      if (candidate.toLowerCase() === wanted) {
        return entry as { Parameter?: Record<string, string>; formElements?: string[] };
      }
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

/** Normalizes a functionality's parameters into a name → description map. */
function normalizeParameters(raw: unknown): Record<string, string> {
  if (!raw) {
    return {};
  }
  if (Array.isArray(raw)) {
    const out: Record<string, string> = {};
    for (const item of raw) {
      if (item && typeof item === "object") {
        const record = item as {
          Name?: string;
          name?: string;
          id?: string;
          Description?: string;
          description?: string;
        };
        const key = String(record.Name ?? record.name ?? record.id ?? "").trim();
        if (key !== "") {
          out[key] = String(record.Description ?? record.description ?? "");
        }
      }
    }
    return out;
  }
  if (typeof raw === "object") {
    return raw as Record<string, string>;
  }
  return {};
}

/**
 * The parameter map (name → description) of a functionality, or an empty map. Accepts both the
 * designer's object-map shape (`{ Name: "desc" }`) and the manager's array shape
 * (`[{ Name, Description }]`), under the `Parameter` or `parameters` key.
 */
export function functionalityParameters(id: string): Record<string, string> {
  const entry = resolveFunctionalityEntry(id) as { Parameter?: unknown; parameters?: unknown } | undefined;
  return normalizeParameters(entry?.Parameter ?? entry?.parameters);
}

/**
 * Resolves the FORMCYCLE widget class names a functionality is intended for. Returns `undefined`
 * when nothing is known (⇒ "any element", fail-open). Prefers the live runtime registry
 * (`window.codbi.resolveFunctionalityMeta`) and falls back to the published `funcMeta` /
 * `detFunctionalities[id].formElements` tiers.
 */
function allowedFormElements(id: string): string[] | undefined {
  try {
    const runtime = (
      window as unknown as {
        codbi?: { resolveFunctionalityMeta?: (id: string) => { formElements?: string[] } | undefined };
      }
    ).codbi;
    const resolved = runtime?.resolveFunctionalityMeta?.(id);
    if (resolved?.formElements && resolved.formElements.length > 0) {
      return resolved.formElements;
    }
  } catch {
    /* runtime not available */
  }
  try {
    const published = window.CodbiPluginData?.funcMeta?.[id]?.formElements;
    if (Array.isArray(published) && published.length > 0) {
      return published;
    }
    const entry = resolveFunctionalityEntry(id)?.formElements;
    if (Array.isArray(entry) && entry.length > 0) {
      return entry;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

/**
 * Whether a functionality is intended for a form element of the given widget **class name** (e.g.
 * `XFieldSet`, `XContainer`, `XTextField`). When the functionality declares no supported element
 * types (or the requested type is unknown/empty) the check is **fail-open** — the functionality is
 * considered applicable, exactly like the untyped EP-signature case.
 */
export function functionalityAppliesTo(id: string, elementType: string | undefined): boolean {
  const allowed = allowedFormElements(id);
  if (!allowed || allowed.length === 0) {
    return true;
  }
  const type = String(elementType ?? "")
    .trim()
    .toLowerCase();
  if (type === "") {
    return true;
  }
  return allowed.some(
    (entry) =>
      String(entry ?? "")
        .trim()
        .toLowerCase() === type,
  );
}

/** The union of allowed widget class names across the selected functionalities (empty = any). */
export function allowedFormElementsFor(ids: string[]): Set<string> {
  const allowed = new Set<string>();
  for (const id of ids) {
    for (const type of allowedFormElements(id) ?? []) {
      allowed.add(type.toLowerCase());
    }
  }
  return allowed;
}

/**
 * The selectable FORMCYCLE form-element **types** the Functionality widget can contain. Choosing a
 * type creates a NEW element of that type inside the widget (see
 * {@link syncSelectedFunctionalityChild}). The Functionality widget itself is excluded.
 *
 * Mirrors the server-side core-widget list (`InstalledFormcycleElements.CORE_WIDGETS`).
 */
const FORM_ELEMENT_TYPES: string[] = [
  "XTextField",
  "XTextArea",
  "XUpload",
  "XSelect",
  "XCheckbox",
  "XButtonList",
  "XSpan",
  "XImage",
  "XFieldSet",
  "XContainer",
  "XContainerInvisible",
  "XLine",
  "XSpacer",
  "XPage",
  "XHeader",
  "XFooter",
].filter((type) => type !== "XFunctionality");

/** Widget types contributed by INSTALLED plugins, fetched from the server (see the `widgets` action). */
let installedWidgetTypes: string[] = [];
/** Listeners notified when {@link installedWidgetTypes} arrives, so open editors re-render. */
const widgetTypeListeners = new Set<() => void>();
/** Guards {@link fetchInstalledWidgetTypes} against duplicate requests. */
let widgetTypesRequested = false;

/** Lists the selectable form-element TYPES (option text == the widget class name). */
function listFormElementTypes(): IFormElementOption[] {
  const merged = new Set<string>([...FORM_ELEMENT_TYPES, ...installedWidgetTypes]);
  merged.delete("XFunctionality");
  return Array.from(merged)
    .sort((a, b) => a.localeCompare(b))
    .map((className) => ({ value: className, text: className, className }));
}

/**
 * Fetches the FORMCYCLE form-element TYPES installed on this system (core widgets + every
 * plugin-provided widget) from the CodBi_Mirror servlet (`action=widgets`). Runs at most once; the
 * result is merged into {@link listFormElementTypes}. Failure is non-fatal (the core list remains).
 */
function fetchInstalledWidgetTypes(): void {
  if (widgetTypesRequested) {
    return;
  }
  widgetTypesRequested = true;
  try {
    const baseURL = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
    const action = encodeURIComponent(String(Constants["mirror.servlet_action.name"]));
    const url = `${baseURL}plugin?name=${action}&action=widgets`;
    $.ajax({ url, type: "GET", dataType: "json" })
      .done((data: unknown) => {
        if (Array.isArray(data)) {
          installedWidgetTypes = data
            .map((entry) => String(entry))
            .filter((entry) => entry !== "" && entry !== "XFunctionality");
          for (const listener of widgetTypeListeners) {
            try {
              listener();
            } catch {
              /* a broken listener must not break the others */
            }
          }
        }
      })
      .fail(() => {
        /* keep the core list */
      });
  } catch {
    /* keep the core list */
  }
}

/**
 * Extracts a datatype hint (`{boolean}`, `{string}`, …) from a parameter's description, so boolean
 * parameters render as checkboxes and all others as text inputs. Missing hint ⇒ `"string"`.
 */
export function parameterType(description: string): "boolean" | "string" {
  const match = /\{\s*([A-Za-z]+)\s*\}/.exec(String(description ?? ""));
  return match?.[1]?.toLowerCase() === "boolean" ? "boolean" : "string";
}

/** Removes the leading `{Type}` hint from a description for display. */
export function parameterLabel(description: string): string {
  return String(description ?? "")
    .replace(/^\s*\{\s*[A-Za-z]+\s*\}\s*/, "")
    .trim();
}

/**
 * Reads the current value of one `data-cb-*` attribute from an item's persisted property bag.
 * Reused by both the Functionality widget editor (target = the contained child) and the per-element
 * CodBi editor (target = the selected element itself).
 */
export function currentAttributeValueForItem(item: IItemLike | undefined, name: string): string {
  try {
    const props = item?.getPersist?.()?.properties as
      | { attributes?: Array<{ text?: string; value?: string }> }
      | undefined;
    const attrs = props?.attributes;
    if (Array.isArray(attrs)) {
      const wanted = name.toLowerCase();
      const found = attrs.find(
        (entry) =>
          String(entry?.text ?? "")
            .trim()
            .toLowerCase() === wanted,
      );
      if (found) {
        return String(found.value ?? "");
      }
    }
  } catch {
    /* ignore */
  }
  return "";
}

/**
 * The **Functionality** widget's composite configurator (a single {@link Editors.BaseEditor} bound
 * to the widget's `element` property, rendering the whole configuration):
 *
 * 1. a **functionality picker** with a filter box and a **“+”** button (multi-select);
 * 2. a **target element** selector (filtered by the union of the allowed form-element types of the
 *    selected functionalities);
 * 3. the **parameter table** of the selected functionalities — a checkbox for boolean parameters
 *    and a text input for string/any parameters, each with a button that opens the flat EP listing
 *    and the EP builder (see {@link openEPBuilder}). Triggering the EP builder on a checkbox turns
 *    it into a text input; clearing the text restores the checkbox.
 *
 * Every change is written straight into the widget's persisted properties (functionalities, element)
 * or into the element's config attribute table (parameters), so it survives reloads.
 */
export class FunctionalityConfigEditor extends Editors.BaseEditor<typeof FunctionalityConfigType> {
  private readonly root: HTMLDivElement;
  /** Currently applied functionality ids (lowercase). */
  private selected: string[] = [];
  /** The chosen contained element reference. */
  private elementRef = "";
  /** The root of the parameter table (rebuilt whenever the selection changes). */
  private readonly paramsHost: HTMLDivElement;
  /** The option list shown by the functionality picker. */
  private readonly funcList: HTMLDivElement;
  /** The current filter query for the functionality picker. */
  private funcQuery = "";

  constructor(config: TEditorCfg<IFunctionalityConfigDescriptor>) {
    super(config, "", "text");
    this.selected = parseCsv(selectedProperty(FUNCS_PROPERTY));
    this.elementRef = selectedProperty(ELEMENT_PROPERTY);

    this.root = document.createElement("div");
    this.root.className = "codbi-func-config";
    this.root.style.cssText = "display:flex;flex-direction:column;gap:10px;";

    // #region 1. Functionality picker (list with an INLINE filter + a "+" button).
    const funcSection = document.createElement("div");
    funcSection.className = "codbi-func-config__section";
    const funcHeader = document.createElement("div");
    funcHeader.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:6px;";
    const funcTitle = document.createElement("strong");
    funcTitle.textContent = i18n("designer.widget.functionality.funcs");
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "codbi-func-config__add";
    addButton.title = i18n("designer.widget.functionality.addFunc");
    addButton.textContent = "+";
    funcHeader.append(funcTitle, addButton);
    // The listing box CONTAINS the filter input (top) and the option rows below it.
    this.funcList = document.createElement("div");
    this.funcList.className = "codbi-func-config__funclist";
    this.funcList.style.cssText =
      "max-height:220px;overflow:auto;border:1px solid #d0d5dd;border-radius:4px;padding:4px;";
    const funcFilter = document.createElement("input");
    funcFilter.type = "text";
    funcFilter.className = "codbi-func-config__filter";
    funcFilter.placeholder = i18n("designer.widget.functionality.filterFuncs");
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
    this.funcFilter = funcFilter;
    this.funcOptions = document.createElement("div");
    this.funcList.append(funcFilter, this.funcOptions);
    funcSection.append(funcHeader, this.funcList);
    // #endregion 1. Functionality picker.

    // #region 2. Contained element TYPE selector (a new element of the chosen type is created).
    const elemSection = document.createElement("div");
    elemSection.className = "codbi-func-config__section";
    const elemTitle = document.createElement("strong");
    elemTitle.textContent = i18n("designer.widget.functionality.element");
    elemTitle.style.display = "block";
    elemTitle.style.marginBottom = "6px";
    const elemSelect = document.createElement("select");
    elemSelect.className = "codbi-func-config__element";
    elemSelect.style.cssText = "width:100%;";
    elemSelect.addEventListener("change", () => {
      this.elementRef = elemSelect.value;
      Callbacks["set-property"].fire(this.config.property, this.elementRef, this);
      // Create a new element of the chosen TYPE inside the widget (removing the former one).
      void syncSelectedFunctionalityChild(this.elementRef).then(() => {
        this.renderParams();
        // Tag the freshly materialized child with the currently selected functionalities so the
        // CONTAINED element carries `data-cb-func` even when the user never toggles a functionality
        // afterwards (the attribute never lives on the widget itself).
        const child = containedElementItem();
        if (child) {
          setItemAttributeValue(child as never, CB_FUNC_ATTRIBUTE, this.selected.join(","));
        }
      });
    });
    elemSection.append(elemTitle, elemSelect);
    this.elementSelect = elemSelect;
    // #endregion 2. Contained element TYPE selector.

    // #region 3. Parameter table.
    const paramSection = document.createElement("div");
    paramSection.className = "codbi-func-config__section";
    const paramTitle = document.createElement("strong");
    paramTitle.textContent = i18n("designer.widget.functionality.parameters");
    paramTitle.style.display = "block";
    paramTitle.style.marginBottom = "6px";
    this.paramsHost = document.createElement("div");
    this.paramsHost.className = "codbi-func-config__params";
    paramSection.append(paramTitle, this.paramsHost);
    // #endregion 3. Parameter table.

    this.root.append(funcSection, elemSection, paramSection);
    // Re-render the type selector as soon as the installed widget types arrive.
    widgetTypeListeners.add(() => this.renderElementOptions());
    this.renderFunctionalityList();
    this.renderElementOptions();
    this.renderParams();
  }

  private readonly elementSelect: HTMLSelectElement;
  /** The inline filter input of the functionality listing. */
  private readonly funcFilter: HTMLInputElement;
  /** The container holding the (filtered) functionality option rows (inside {@link funcList}). */
  private readonly funcOptions: HTMLDivElement;

  /** See {@link Editors.BaseEditor }'s **getElement**. */
  public override getElement(): JQuery {
    return $(this.root);
  }

  /** See {@link Editors.BaseEditor }'s **setValue**. Refreshes the state when FORMCYCLE (re)assigns the value. */
  public override setValue(data: unknown): void {
    this.elementRef = data != null ? String(data) : "";
    this.selected = parseCsv(selectedProperty(FUNCS_PROPERTY));
    this.renderFunctionalityList();
    this.renderElementOptions();
    this.renderParams();
  }

  /** See {@link Editors.BaseEditor }'s **getValue**. */
  public override getValue(): string {
    return this.elementRef;
  }

  /** Persists the current functionality selection into the widget's `funcs` property (as a CSV). */
  private persistFunctionalities(): void {
    const csv = this.selected.join(",");
    Callbacks["set-property"].fire(FUNCS_PROPERTY, csv, this);
    // Mirror the selected functionality ids onto the CONTAINED element as the `data-cb-func`
    // attribute so the CodBi runtime and the designer preview see them even when the user only
    // toggles a functionality without touching a parameter. The attribute must live ONLY on the
    // CONTAINED element (a real form control) — never on the Functionality widget itself, which is
    // a container <div> the runtime would wrongly try to apply textarea-only functionalities (e.g.
    // an HTML.Input.TinyMCE tagged on the widget would be invalid). If no contained element exists
    // yet, nothing is tagged here; the new child is tagged when it materializes (see the element
    // type selector).
    const child = containedElementItem();
    if (child) {
      setItemAttributeValue(child as never, CB_FUNC_ATTRIBUTE, csv);
    }
    // The available element types may have changed ⇒ re-filter the element selector and params.
    this.renderElementOptions();
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
      empty.textContent = i18n("designer.widget.functionality.noResults");
      fragment.appendChild(empty);
    }
    this.funcOptions.replaceChildren(fragment);
  }

  /** Renders the contained-element TYPE `<select>`, filtered by the union of the allowed types. */
  private renderElementOptions(): void {
    const allowed = allowedFormElementsFor(this.selected);
    const options = listFormElementTypes().filter(
      (option) => allowed.size === 0 || allowed.has(option.className.toLowerCase()),
    );
    const fragment = document.createDocumentFragment();
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = i18n("designer.widget.functionality.filter");
    fragment.appendChild(empty);
    for (const option of options) {
      const opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.text;
      fragment.appendChild(opt);
    }
    this.elementSelect.replaceChildren(fragment);
    this.elementSelect.value = this.elementRef;
  }

  /** Renders the parameter table of every selected functionality. */
  private renderParams(): void {
    const fragment = document.createDocumentFragment();
    let any = false;
    for (const id of this.selected) {
      const params = functionalityParameters(id);
      const names = Object.keys(params);
      console.info("[CodBi] Functionality: parameters for '%s' -> %d", id, names.length);
      if (names.length === 0) {
        continue;
      }
      any = true;
      const header = document.createElement("div");
      header.style.cssText = "font-weight:600;margin:6px 0 2px;";
      header.textContent = id;
      fragment.appendChild(header);
      for (const name of names) {
        try {
          fragment.appendChild(this.buildParamRow(name, params[name]));
        } catch (x) {
          console.error("[CodBi] Functionality: could not render parameter", id, name, x);
        }
      }
    }
    if (!any) {
      const none = document.createElement("div");
      none.style.cssText = "color:#6b7280;";
      none.textContent = i18n("designer.widget.functionality.noParams");
      fragment.appendChild(none);
    }
    this.paramsHost.replaceChildren(fragment);
  }

  /** Builds one parameter row: name + (checkbox | text input) + EP button. */
  private buildParamRow(name: string, description: string): HTMLElement {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:6px;margin:2px 0;";

    const label = document.createElement("label");
    label.style.cssText = "flex:1;";
    label.title = parameterLabel(description);
    label.textContent = name;

    const currentValue = this.currentAttributeValue(name);
    const type = parameterType(description);

    // The value cell can flip between a checkbox (boolean) and a text input (any/string). The
    // current implementation always creates the text input first when the value is not a plain
    // boolean literal, and a checkbox otherwise; the flip is applied on demand below.
    const cell = document.createElement("span");
    cell.style.cssText = "display:flex;align-items:center;gap:4px;flex:1;";

    let textInput: HTMLInputElement | undefined;
    let checkbox: HTMLInputElement | undefined;

    // Writes a parameter (and the FUNC attribute) into the CONTAINED element's config attribute
    // table. The attributes live ONLY on the contained element (a real form control), never on the
    // Functionality widget itself — writing them to the container <div> would be invalid and the
    // runtime/preview must never see them there. If no contained element exists yet, the value is
    // not persisted (there is no valid node to carry it); it reapplies once a child materializes.
    const write = (value: string): void => {
      const child = containedElementItem();
      if (child) {
        setItemAttributeValue(child as never, name, value);
        setItemAttributeValue(child as never, CB_FUNC_ATTRIBUTE, this.selected.join(","));
      }
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
      console.error("[CodBi] Functionality: could not open the EP builder", x);
    }
  }

  /** Reads the current value of one `data-cb-*` attribute from the selected item. */
  private currentAttributeValue(name: string): string {
    try {
      // Prefer the CONTAINED element (its attribute table is the one the user sees); fall back to
      // the selected widget when no contained element exists yet.
      const child = containedElementItem() as
        | { getPersist?(): { properties?: Record<string, unknown> } | undefined }
        | undefined;
      const item =
        child ?? ((instance() as unknown as IDesignerLike)?.getSelectedMasterItem?.() as IItemLike | undefined);
      const props = item?.getPersist?.()?.properties as
        | { attributes?: Array<{ text?: string; value?: string }> }
        | undefined;
      const attrs = props?.attributes;
      if (Array.isArray(attrs)) {
        const wanted = name.toLowerCase();
        const found = attrs.find(
          (entry) =>
            String(entry?.text ?? "")
              .trim()
              .toLowerCase() === wanted,
        );
        if (found) {
          return String(found.value ?? "");
        }
      }
    } catch {
      /* ignore */
    }
    return "";
  }
}

/**
 * Registers the Functionality widget's designer UI: a dedicated category and the composite
 * configurator bound to the widget's `element` property. The `funcs` / `*_name` properties are
 * persisted by the configurator (via `set-property`) and need no visual editor of their own.
 */
export function registerCustomFunctionalityProperties(): void {
  try {
    // Fetch the installed widget types once (merged into the contained-element type selector).
    fetchInstalledWidgetTypes();

    registerCustomCategory(
      { id: FUNCTIONALITY_CATEGORY_ID, label: i18n("designer.widget.functionality.label") },
      (items) => items.length,
    );

    registerLocalizableProperty(ELEMENT_PROPERTY);
    registerLocalizableProperty(FUNCS_PROPERTY);

    try {
      registerCustomEditor(FunctionalityConfigType, FunctionalityConfigEditor);
    } catch (x) {
      console.error("[CodBi] Failed to register the Functionality config editor", x);
    }

    registerCustomProperty({
      editor: FunctionalityConfigType,
      cat: FUNCTIONALITY_CATEGORY_ID,
      property: ELEMENT_PROPERTY,
      label: i18n("designer.widget.functionality.element"),
    } satisfies IFunctionalityConfigDescriptor);
  } catch (x) {
    // Never let the Functionality registration abort the other CodBi designer registrations.
    console.error("[CodBi] Failed to register the Functionality widget's designer properties", x);
  }
}
