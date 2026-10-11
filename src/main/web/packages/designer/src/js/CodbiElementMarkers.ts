// #region Imports
import { Callbacks, instance as getDesignerInstance } from "@de-xima/fc-form-designer";
import { Constants } from "codbi-common";
import { MARK_ELEMENTS_CHANGED_EVENT } from "./CodbiSwitchEditor.js";
import { openEPBuilder } from "./EPBuilder.js";
import { i18n } from "./i18n.js";
import { mirrorElementOptions, mirrorFormOptions } from "./MirrorSelect.js";
// #endregion Imports

/**
 * CodBi element markers — the designer-side overlay painted when the
 * **“Mark CodBi elements in the designer”** mode is enabled.
 *
 * ## The switch
 * The mode is a persisted FORM property (`codbi-prop-mark-elements`, registered by
 * `register-custom-form-properties.ts` as a slider switch and declared by the Kotlin
 * `CodbiFormPropertiesExtensionPlugin`). It can be flipped two ways:
 * - the slider switch in the CodBi form-properties panel, or
 * - the global **ALT+V** shortcut (handled here), which drives the same switch so the panel stays
 *   in sync and the change is persisted.
 *
 * ## The first effect: Mirror badges
 * Every `XMirror` widget on the canvas gets a small badge pinned to the **top-left corner** of the
 * widget (nudged right). The badge shows the Mirror icon (`mirror-icon.svg`) and — on hover —
 * expands DOWNWARD to reveal the NAME of the linked source form and source element (only when a
 * source element is already selected).
 *
 * ## The second effect: CodBi function badges
 * While the same **“Mark CodBi elements in the designer”** mode is on, every form element carrying a
 * `data-cb-func` attribute also gets a badge pinned to the top-left corner. It shows the CodBi logo
 * (`Symbol_CodBi.svg`) and — on hovering the widget — expands to the right to list one sub-badge per
 * functionality that is actually known to the designer
 * (`window.CodbiPluginData.detFunctionalities`). Hovering one functionality sub-badge expands it
 * DOWNWARD (over the marker badge's bounds) to show the `data-cb-*` parameters set on the element
 * for that functionality, as a parameter/value table.
 *
 * ## The canvas is a separate document
 * FORMCYCLE renders the design canvas inside a **same-origin iframe**. The designer stylesheet
 * (`frame.css`) reaches the designer frame (palette + properties panel) but NOT the canvas, so this
 * module injects its own badge stylesheet into whichever document hosts the badges. The designer's
 * `Item` API hands us DOM nodes from that canvas iframe, so all DOM access goes through the anchor
 * node's `ownerDocument`.
 *
 * ## How the badges are kept in sync
 * The designer re-renders items in place whenever their properties change (which removes some of
 * our injected DOM). We therefore re-apply the badges idempotently on every relevant designer event
 * and on a debounced `MutationObserver` pass. `refreshBadges` only writes to the DOM when the
 * rendered state actually changed (the badge stores a content signature in `data-codbi-mark`), so
 * the observer cannot loop.
 */

/** Form property holding the persisted “mark CodBi elements” mode. */
const MARK_PROPERTY = String(Constants["designer.property.mark_elements"]);

/** Selector for the slider switch's hidden input — our own editor, so the class is stable. */
const MARK_SWITCH_INPUT_SELECTOR = ".codbi-switch__input";

/** Source form / element properties stored on an `XMirror` item. */
const MIRROR_FORM_PROPERTY = String(Constants["mirror.property.form"]);
const MIRROR_ELEMENT_PROPERTY = String(Constants["mirror.property.element"]);
const MIRROR_FORM_NAME_PROPERTY = String(Constants["mirror.property.form_name"]);
const MIRROR_ELEMENT_NAME_PROPERTY = String(Constants["mirror.property.element_name"]);

/** The widget class name of the CodBi Mirror (see `XMirror`). */
const MIRROR_CLASS_NAME = "XMirror";

/** Root class of an injected badge; `--empty` marks a Mirror without a selected source element. */
const BADGE_CLASS = "codbi-elem-badge";

/** Absolute URL of the Mirror icon served by the plugin's `Resource` servlet. */
const MIRROR_ICON_URL = (() => {
  const baseURL = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  const path = encodeURIComponent("/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/mirror-icon.svg");
  return `${baseURL}plugin?name=Resource&Path=${path}`;
})();

/** Absolute URL of the CodBi logo (the function-badge icon), served by the `Resource` servlet. */
const CODBI_LOGO_URL = (() => {
  const baseURL = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  const path = encodeURIComponent("/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg");
  return `${baseURL}plugin?name=Resource&Path=${path}`;
})();

/** Name of the element attribute that lists the applied CodBi functionalities (a CSV). */
const CB_FUNC_ATTRIBUTE = "data-cb-func";

/** Prefix of the element attributes that carry a CodBi functionality parameter. */
const CB_PARAM_PREFIX = "data-cb-";

/**
 * Badge stylesheet. Injected into every document that hosts a badge (see `installBadgeStyles`),
 * because the designer stylesheet does not reach the canvas iframe.
 */
const BADGE_CSS = `
.codbi-elem-badge{position:absolute;top:4px;left:0;transform:translateX(6px);z-index:5;display:inline-flex;align-items:center;height:22px;box-sizing:border-box;overflow:hidden;background:rgba(255,255,255,.94);border:1px solid darkorange;border-radius:5px;box-shadow:0 1px 3px rgba(15,23,42,.28);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:11px;line-height:1;color:#374151;pointer-events:none;user-select:none;white-space:nowrap}
.codbi-elem-badge__icon{flex:0 0 auto;width:20px;height:20px;box-sizing:border-box;margin:0 1px;pointer-events:none;background-repeat:no-repeat;background-position:center;background-size:16px 16px;filter:drop-shadow(0 0 1.5px rgba(56,189,248,.85)) drop-shadow(0 0 3px rgba(37,99,235,.45))}
.codbi-elem-badge__text{display:inline-block;max-width:0;overflow:hidden;opacity:0;pointer-events:none;transition:max-width .25s ease,opacity .25s ease,padding .25s ease}
*:hover>.codbi-elem-badge:not(.codbi-elem-badge--empty){border-color:#c96a00;background:#fff7ed}
*:hover>.codbi-elem-badge:not(.codbi-elem-badge--empty) .codbi-elem-badge__text{max-width:640px;opacity:1;padding:0 8px 0 0}
.codbi-elem-badge--open .codbi-elem-badge__text{max-width:640px;opacity:1;padding:0 8px 0 0}
.codbi-elem-marked{box-shadow:0 0 0 2px darkorange,0 0 10px 2px rgba(255,140,0,.6);border-radius:3px}
.codbi-mirror-icon{background-image:url("${MIRROR_ICON_URL}");background-repeat:no-repeat;background-position:center;background-size:contain}
.codbi-mirror-icon svg{display:none}
.codbi-elem-badge--funcs{overflow:visible}
.codbi-func-icon{background-image:url("${CODBI_LOGO_URL}")}
.codbi-func-list{display:inline-flex;align-items:center;gap:4px;max-width:0;overflow:hidden;opacity:0;pointer-events:none;transition:max-width .25s ease,opacity .25s ease,padding .25s ease}
*:hover>.codbi-elem-badge--funcs>.codbi-func-list{max-width:2000px;overflow:visible;opacity:1;padding:0 6px 0 2px;pointer-events:auto}
.codbi-func-item{position:relative;display:inline-flex;align-items:center;height:18px;box-sizing:border-box;padding:0 6px;border:1px solid #c96a00;border-radius:4px;background:#fff7ed;color:#7c2d12;font-size:11px;line-height:1;white-space:nowrap;pointer-events:auto;opacity:0;transition:opacity .25s ease}
/* Reveal the sub-badges only once the list is expanded (prevents a flash while overflow is still hidden). */
*:hover>.codbi-elem-badge--funcs>.codbi-func-list>.codbi-func-item{opacity:1}
/* "Detailed" mode: reveal the functionality list without hovering (the parameter table stays
   hover-only, since no --open rule targets it). */
.codbi-elem-badge--open .codbi-func-list{max-width:2000px;overflow:visible;opacity:1;padding:0 6px 0 2px;pointer-events:auto}
.codbi-elem-badge--open .codbi-func-list>.codbi-func-item{opacity:1}
.codbi-func-item__name{pointer-events:none}
.codbi-func-item__params{position:absolute;top:100%;left:-1px;margin-top:3px;z-index:6;width:max-content;max-width:var(--codbi-func-anchor-width,320px);box-sizing:border-box;padding:0 6px;border:1px solid #c96a00;border-radius:4px;background:rgba(255,255,255,.98);box-shadow:0 2px 6px rgba(15,23,42,.3);color:#374151;visibility:hidden;opacity:0;max-height:0;overflow:hidden;transform:translateY(-4px);transition:max-height .25s ease,opacity .25s ease,transform .25s ease,padding .25s ease,visibility .25s}
.codbi-func-item:hover>.codbi-func-item__params{visibility:visible;opacity:1;max-height:520px;padding:4px 6px;transform:translateY(0)}
.codbi-func-table{width:max-content;max-width:100%;border-collapse:collapse;font-size:10.5px;line-height:1.3}
.codbi-func-table th,.codbi-func-table td{border:1px solid #e7c9a3;padding:1px 5px;text-align:left;vertical-align:top}
.codbi-func-table thead th{background:#fde7cf;color:#7c2d12;font-weight:600;white-space:nowrap}
.codbi-func-table tbody th{color:#7c2d12;font-weight:600;white-space:nowrap}
.codbi-func-input{min-width:0;max-width:100%;box-sizing:border-box;border:1px solid transparent;border-radius:3px;background:transparent;padding:0 3px;margin:0;font:inherit;color:#1f2937;pointer-events:auto}
.codbi-func-input:focus{outline:none;border-color:#c96a00;background:#fff}
.codbi-func-actions{width:1%;white-space:nowrap;text-align:center}
.codbi-func-delete{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;padding:0;margin:0;border:0;border-radius:3px;background:transparent;color:#b91c1c;cursor:pointer;pointer-events:auto}
.codbi-func-delete:hover{background:#fee2e2}
.codbi-func-delete svg{display:block;width:12px;height:12px}
.codbi-func-value{display:inline-flex;align-items:center;gap:2px;max-width:100%}
.codbi-func-maximize{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;padding:0;margin:0;border:0;border-radius:3px;background:transparent;color:#2563eb;cursor:pointer;pointer-events:auto}
.codbi-func-maximize:hover{background:#dbeafe}
.codbi-func-maximize svg{display:block;width:12px;height:12px}
.codbi-func-item__params--max{min-height:40px;max-height:70vh}
.codbi-func-item__params--max .codbi-func-table{width:100%}
.codbi-func-item__params--max .codbi-func-value{width:100%}
.codbi-func-item__params--max .codbi-func-input{flex:1 1 auto;width:auto;min-width:0}
`;
// NOTE: the Mirror badge never captures the pointer (not even its icon/text). A hover-capturing
// overlay inside an item can become the drop target when a new element is dropped onto the widget,
// which breaks the designer's drop-on-item logic. Its expansion is therefore driven by hovering the
// badge's PARENT (the widget's cell) — see the `*:hover>.codbi-elem-badge` rules above.
//
// The function sub-badges are the one exception: they must capture the pointer so each can be
// hovered individually to reveal its `data-cb-*` parameters. Only the sub-badges (which exist just
// while the list is expanded) opt back into `pointer-events`, never the outer badge.
//
// `.codbi-mirror-icon` (the unconfigured Mirror placeholder) shows the SAME `mirror-icon.svg` file
// as the palette and the badge (absolute URL built at runtime); the inline SVG the widget emits is
// hidden so that file stays the single source of truth.

/** Property bag FORMCYCLE stores per item. */
type TItemProperties = Record<string, unknown>;

/** Minimal structural view of a designer `Item` — only what the markers need. */
interface IMarkerItemLike {
  className?: string | null;
  properties?: TItemProperties;
  getId?(): string;
  getPersist?(): { properties?: TItemProperties } | undefined;
  getContainer?(): JQuery | undefined;
  getItemContentCell?(): JQuery | undefined;
}

/** Minimal structural view of the designer internals used here. */
interface IDesignerLike {
  items?: Record<string, IMarkerItemLike>;
  getFormPropertyValueForCurrentLang?(name: string): unknown;
  /** Persist differ — used to nudge the server sync after a direct property mutation. */
  getPersistDiffer?(): { checkForChanges?(): void } | undefined;
  /** The currently selected item (whose property editors are currently mounted). */
  getSelectedMasterItem?(): IMarkerItemLike | undefined;
  /** Binds the property editors (attribute grid etc.) to the given item. */
  showProperties?(item: unknown): void;
  /** The item bound to a DOM element (designer `getItem`). */
  getItem?(element: unknown): IMarkerItemLike | undefined;
  /** The property view holding the editors for the selected item. */
  getPropertyView?():
    | {
        getEditorForProperty?(
          property: string,
        ): { setValue?(value: unknown): void; triggerSetProperty?(): void } | undefined;
        getPropertyEditors?(): ReadonlyArray<{
          config?: { property?: string };
          setValue?(value: unknown): void;
          triggerSetProperty?(): void;
        }>;
      }
    | undefined;
}

/** A resolved (human-readable) form/element name pair. */
interface IResolvedNames {
  formName: string;
  elementName: string;
}

/** Structural view of one entry of an item's `attributes` bag (see the designer AttributesEditor). */
interface IAttributeEntry {
  text?: unknown;
  value?: unknown;
}

/** Structural view of one CodBi functionality definition (`window.CodbiPluginData.detFunctionalities`). */
interface IFunctionalityDef {
  Description?: string;
  Parameter?: Record<string, string>;
}

/** One functionality to display on a badge, with the `data-cb-*` parameters set on the element. */
interface IFunctionalityEntry {
  name: string;
  params: Array<{ name: string; value: string }>;
}

/** The badges injected so far, keyed by the Mirror item id. */
const badges = new Map<string, HTMLElement>();

/** The CodBi function badges injected so far, keyed by the item id. */
const funcBadges = new Map<string, HTMLElement>();

/** Mirror widget elements currently highlighted with the darkorange "marked" border. */
const markedWidgets = new Set<HTMLElement>();

/** `data-cb-func` widgets currently highlighted with the darkorange "marked" border. */
const markedFuncWidgets = new Set<HTMLElement>();

/** Resolved display names per Mirror item id (see {@link resolveNames}). */
const resolvedNames = new Map<string, IResolvedNames>();

/** Form reference -> display name, resolved once per session. */
let formNameCache: Map<string, string> | null = null;
let formNamePromise: Promise<Map<string, string>> | null = null;

/** Source-form reference -> (element reference -> display name). */
const elementNameCache = new Map<string, Map<string, string>>();
const elementNamePromises = new Map<string, Promise<Map<string, string>>>();

/**
 * A node that hosts badges. The design canvas is either an iframe (its own `Document`) or a shadow
 * root inside the designer document, so all style injection / observation targets the badge node's
 * `getRootNode()`.
 */
type TMarkerRoot = Document | ShadowRoot;

/** Roots whose badge stylesheet was already injected / that are already observed. */
const styledRoots = new WeakSet<TMarkerRoot>();
const observedRoots = new WeakSet<TMarkerRoot>();

/** Foreign documents (e.g. the canvas iframe) that already received the ALT+V listener. */
const keydownDocuments = new WeakSet<Document>();

/** Runtime override (set by ALT+V) — `null` until explicitly set; used when no switch is mounted. */
let runtimeOverride: boolean | null = null;

/**
 * The latest state reported by the slider switch (`CodbiSwitchEditor`), `null` until it reports.
 * This is authoritative when present: the switch is the user's control and the persisted
 * form-property model is not reliably updated by a custom editor.
 */
let switchEnabled: boolean | null = null;

/**
 * Whether markers should show their entire text without hovering (the companion switch, right of
 * the primary one). `false` until the editor reports it.
 */
let showLabels = false;

/** Guards the `MutationObserver` against re-entrancy while we mutate the canvas ourselves. */
let refreshing = false;

/** Guards {@link resolveNames} against concurrent runs. */
let resolving = false;

/** Pending debounce handle for the observer-driven refresh. */
let refreshHandle: number | null = null;

/**
 * @returns the designer instance, or `undefined` when it has not been created yet. The designer's
 * `instance()` **throws** until the form designer is fully initialized, so every access goes
 * through this guard.
 */
function designerInstance(): IDesignerLike | undefined {
  try {
    return getDesignerInstance() as IDesignerLike | undefined;
  } catch {
    return undefined;
  }
}

/** @returns the persisted properties of an item, preferring `getPersist()`. */
function propertiesOf(item: IMarkerItemLike | undefined): TItemProperties | undefined {
  if (!item) {
    return undefined;
  }
  try {
    const persisted = item.getPersist?.()?.properties;
    if (persisted) {
      return persisted;
    }
  } catch {
    /* fall through to the live properties bag */
  }
  return item.properties;
}

/** Reads a property as a trimmed string, `""` when absent. */
function stringProp(props: TItemProperties | undefined, key: string): string {
  const value = props?.[key];
  return value == null ? "" : String(value).trim();
}

/**
 * Nudges the designer's persist differ so a DIRECT mutation of an item's properties (that bypasses
 * the property editors) is detected and synced to the server.
 */
function notifyAttributeChange(): void {
  try {
    designerInstance()?.getPersistDiffer?.()?.checkForChanges?.();
  } catch {
    /* ignore */
  }
}

/**
 * When the edited item is the SELECTED one, the designer's AttributesEditor (the grid in the
 * element config's "attributes" table) is mounted and holds its own copy of the data — so a direct
 * model mutation alone would not refresh it. This pushes the current attribute array back into that
 * editor and commits it through the designer's own property pipeline, keeping the visible table and
 * the persisted model in sync.
 */
function syncAttributesEditor(item: IMarkerItemLike): void {
  try {
    const designer = designerInstance();
    if (!designer) {
      return;
    }
    // The attribute grid is a SHARED editor that is only (re)bound to an item when that item is
    // selected. If the edited item is not the selected one, bind it first so the grid shows (and
    // commits) this item's attributes.
    if (designer.getSelectedMasterItem?.() !== item) {
      designer.showProperties?.(item);
    }
    const view = designer.getPropertyView?.();
    // Locate the attributes editor (some designer builds key it differently — fall back to a scan).
    const editor =
      view?.getEditorForProperty?.("attributes") ??
      view?.getPropertyEditors?.().find((ed) => ed?.config?.property === "attributes");
    if (!editor?.setValue || !editor.triggerSetProperty) {
      console.warn("[CodBi] Element markers: attributes editor not found — is the item selectable?");
      return;
    }
    const attrs = propertiesOf(item)?.attributes;
    editor.setValue(JSON.stringify(Array.isArray(attrs) ? attrs : []));
    editor.triggerSetProperty();
  } catch (x) {
    console.warn("[CodBi] Element markers: could not sync the attributes editor", x);
  }
}

/**
 * Resolves the item's LIVE instance at edit time. The designer can replace its `Item` objects when it
 * re-renders the canvas, leaving the instance captured when the badge was built stale (its
 * `properties` bag would be gone). We therefore re-read it from the designer's item map — and, as a
 * last resort, from the DOM binding — before writing anything.
 */
function resolveFuncItem(id: string, anchor: HTMLElement, fallback: IMarkerItemLike): IMarkerItemLike {
  const designer = designerInstance();
  try {
    const live = designer?.items?.[id];
    if (live) {
      return live;
    }
  } catch {
    /* ignore */
  }
  try {
    const fromDom = designer?.getItem?.(anchor);
    if (fromDom) {
      return fromDom;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

/**
 * @returns every writable property bag of an item — the persisted one (`getPersist().properties`)
 * and the live one (`item.properties`) when they are distinct objects. The designer's AttributesEditor
 * reads/writes these, so mutating both keeps the live model and the persisted model in sync.
 */
function writablePropertyBags(item: IMarkerItemLike): TItemProperties[] {
  const bags: TItemProperties[] = [];
  let persisted: TItemProperties | undefined;
  try {
    persisted = item.getPersist?.()?.properties;
  } catch {
    persisted = undefined;
  }
  if (persisted) {
    bags.push(persisted);
  }
  if (item.properties && item.properties !== persisted) {
    bags.push(item.properties);
  }
  return bags;
}

/**
 * Sets or updates one `data-cb-*` attribute on the item's property bag (the same bag the designer's
 * AttributesEditor reads/writes) so the change is reflected in the element's config attribute table.
 */
function setFuncAttribute(item: IMarkerItemLike, name: string, value: string): boolean {
  const bags = writablePropertyBags(item);
  if (bags.length === 0) {
    return false;
  }
  const wanted = name.toLowerCase();
  for (const props of bags) {
    const attrs: IAttributeEntry[] = Array.isArray(props.attributes)
      ? [...(props.attributes as IAttributeEntry[])]
      : [];
    const idx = attrs.findIndex(
      (a) =>
        String(a?.text ?? "")
          .trim()
          .toLowerCase() === wanted,
    );
    if (idx >= 0) {
      attrs[idx] = { ...attrs[idx], text: name, value };
    } else {
      attrs.push({ text: name, value });
    }
    props.attributes = attrs;
  }
  notifyAttributeChange();
  syncAttributesEditor(item);
  return true;
}

/**
 * Updates one attribute's value on the currently SELECTED item and syncs the designer's attribute
 * grid and persist differ — the same path the functionality-badge parameter table uses. Called by
 * the EP builder's attribute-table launcher so an applied value lands in the element config's
 * attribute table (and the persisted model), not just in the transient grid-editor input.
 *
 * @param name  The attribute name (e.g. `data-cb-func`).
 * @param value The new attribute value.
 *
 * @returns **True** when a selected item was found and updated. */
export function setSelectedItemAttributeValue(name: string, value: string): boolean {
  try {
    const item = designerInstance()?.getSelectedMasterItem?.() as IMarkerItemLike | undefined;

    if (!item || name.trim() === "") {
      console.warn("[CodBi] EP-builder launcher: no selected item for attribute", name);

      return false;
    }

    return setFuncAttribute(item, name.trim(), value);
  } catch (x) {
    console.warn("[CodBi] Element markers: could not update the selected item's attribute", x);

    return false;
  }
}

/**
 * Removes one `data-cb-*` attribute (name and value) from the item's property bags and nudges the
 * persist differ.
 */
function removeFuncAttribute(item: IMarkerItemLike, name: string): boolean {
  const bags = writablePropertyBags(item);
  if (bags.length === 0) {
    return false;
  }
  const wanted = name.toLowerCase();
  for (const props of bags) {
    const attrs: IAttributeEntry[] = Array.isArray(props.attributes)
      ? (props.attributes as IAttributeEntry[]).filter(
          (a) =>
            String(a?.text ?? "")
              .trim()
              .toLowerCase() !== wanted,
        )
      : [];
    props.attributes = attrs;
  }
  notifyAttributeChange();
  syncAttributesEditor(item);
  return true;
}

/**
 * Stops an overlay control's pointer/keyboard events from reaching the designer canvas (so typing
 * in, clicking, or deleting via the table never triggers the designer's own shortcuts/selection).
 */
function isolateControl(el: HTMLElement): void {
  const types = ["mousedown", "mouseup", "click", "dblclick", "keydown", "keyup", "keypress"] as const;
  for (const type of types) {
    el.addEventListener(type, (event) => event.stopPropagation());
  }
}

/** @returns `true` when the item is a CodBi Mirror widget. */
function isMirrorItem(item: IMarkerItemLike): boolean {
  if (item.className === MIRROR_CLASS_NAME) {
    return true;
  }
  // Defensive fallback: a Mirror always carries the source-form property, even before it is set.
  const props = propertiesOf(item);
  return props != null && MIRROR_FORM_PROPERTY in props;
}

/** @returns the CodBi functionality definitions injected by the designer resource plugin. */
function functionalityData(): Record<string, IFunctionalityDef> | undefined {
  try {
    const data = (window as unknown as { CodbiPluginData?: { detFunctionalities?: Record<string, IFunctionalityDef> } })
      .CodbiPluginData;
    return data?.detFunctionalities;
  } catch {
    return undefined;
  }
}

/** @returns the raw `attributes` bag of an item (an array of `{ text, value }`), `[]` when absent. */
function attributeEntries(item: IMarkerItemLike): IAttributeEntry[] {
  const attrs = propertiesOf(item)?.attributes;
  return Array.isArray(attrs) ? (attrs as IAttributeEntry[]) : [];
}

/** Reads the value of the first attribute whose (case-insensitive) name matches `name`. */
function attributeValue(attrs: IAttributeEntry[], name: string): string {
  const wanted = name.toLowerCase();
  for (const attr of attrs) {
    if (
      String(attr?.text ?? "")
        .trim()
        .toLowerCase() === wanted
    ) {
      return String(attr?.value ?? "").trim();
    }
  }
  return "";
}

/** @returns `true` when the item carries at least one `data-cb-func` functionality. */
function isCbFuncItem(item: IMarkerItemLike): boolean {
  return attributeValue(attributeEntries(item), CB_FUNC_ATTRIBUTE) !== "";
}

/**
 * Resolves the functionalities listed in `data-cb-func` that actually EXIST
 * (`window.CodbiPluginData.detFunctionalities`), together with the `data-cb-*` parameters set on the
 * element for each of them. The functionality name is kept as written on the element (for display)
 * but matched case-insensitively against the (lowercased) definition keys.
 */
function existingFunctionalities(item: IMarkerItemLike): IFunctionalityEntry[] {
  const attrs = attributeEntries(item);
  const data = functionalityData();
  const raw = attributeValue(attrs, CB_FUNC_ATTRIBUTE);
  const result: IFunctionalityEntry[] = [];
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const name = part.trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) {
      continue;
    }
    seen.add(key);
    const def = data?.[key];
    if (!def) {
      continue; // Only "really existing" functionalities are shown.
    }
    const params: Array<{ name: string; value: string }> = [];
    for (const paramKey of Object.keys(def.Parameter ?? {})) {
      const wanted = `${CB_PARAM_PREFIX}${paramKey}`.toLowerCase();
      for (const attr of attrs) {
        const attrName = String(attr?.text ?? "").trim();
        if (attrName.toLowerCase() === wanted) {
          params.push({ name: attrName, value: String(attr?.value ?? "").trim() });
          break;
        }
      }
    }
    result.push({ name, params });
  }
  return result;
}

/** The element a badge anchors to: the item's content cell, falling back to its container. */
function anchorFor(item: IMarkerItemLike): HTMLElement | null {
  try {
    const cell = item.getItemContentCell?.();
    if (cell && cell.length > 0 && cell[0]) {
      return cell[0];
    }
    const container = item.getContainer?.();
    if (container && container.length > 0 && container[0]) {
      return container[0];
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** @returns the root that hosts a badge: the canvas iframe document OR the designer shadow root. */
function rootFor(anchor: HTMLElement): TMarkerRoot {
  const root = anchor.getRootNode?.();
  if (root instanceof ShadowRoot || root instanceof Document) {
    return root;
  }
  return anchor.ownerDocument ?? document;
}

/** Injects the badge stylesheet into `root` (once). Works for a `Document` and a `ShadowRoot`. */
function installBadgeStyles(root: TMarkerRoot): void {
  if (styledRoots.has(root)) {
    return;
  }
  styledRoots.add(root);
  try {
    const doc = root instanceof Document ? root : (root.ownerDocument ?? document);
    const style = doc.createElement("style");
    style.id = "codbi-elem-marker-css";
    style.textContent = BADGE_CSS;
    if (root instanceof Document) {
      (root.head ?? root.documentElement)?.appendChild(style);
    } else {
      root.appendChild(style);
    }
  } catch (x) {
    console.error("[CodBi] Element markers: could not inject the badge stylesheet", x);
  }
}

/**
 * Observes `root` for DOM changes (once). Also mirrors the ALT+V shortcut into a foreign document
 * (the canvas iframe), whose keydown events do not bubble to the designer frame. Shadow-root events
 * are composed and DO reach the designer document, so no extra listener is needed there.
 */
function observeRoot(root: TMarkerRoot): void {
  const ownerDoc = root instanceof Document ? root : (root.ownerDocument ?? document);
  if (ownerDoc !== document && !keydownDocuments.has(ownerDoc)) {
    keydownDocuments.add(ownerDoc);
    try {
      ownerDoc.addEventListener("keydown", onKeyDown);
    } catch {
      /* ignore */
    }
  }
  if (observedRoots.has(root)) {
    return;
  }
  observedRoots.add(root);
  const observer = new MutationObserver(() => {
    if (refreshing) {
      return;
    }
    scheduleRefresh();
  });
  observer.observe(root, { childList: true, subtree: true });
}

/**
 * Whether the “mark CodBi elements” mode is currently ON. Resolution order:
 * 1. the state reported by the slider switch (authoritative — the user's control),
 * 2. the live switch input, if present,
 * 3. an explicit ALT+V runtime override (when no switch is mounted),
 * 4. the designer's persisted form-property model (best effort).
 */
function isMarkEnabled(): boolean {
  if (switchEnabled !== null) {
    return switchEnabled;
  }
  const input = document.querySelector<HTMLInputElement>(MARK_SWITCH_INPUT_SELECTOR);
  if (input) {
    return input.checked;
  }
  if (runtimeOverride !== null) {
    return runtimeOverride;
  }
  const designer = designerInstance();
  if (designer?.getFormPropertyValueForCurrentLang) {
    try {
      const value = designer.getFormPropertyValueForCurrentLang(MARK_PROPERTY);
      if (value === "1" || value === 1 || value === true || value === "true") {
        return true;
      }
      if (value === "0" || value === 0 || value === false || value === "false") {
        return false;
      }
    } catch {
      /* ignore and fall through */
    }
  }
  return false;
}

/** @returns the display names for one Mirror: the cached ones, else the resolved ones, else the refs. */
function namesFor(props: TItemProperties | undefined, id: string, formRef: string, elementRef: string): IResolvedNames {
  const resolved = resolvedNames.get(id);
  return {
    formName: stringProp(props, MIRROR_FORM_NAME_PROPERTY) || resolved?.formName || formRef,
    elementName: stringProp(props, MIRROR_ELEMENT_NAME_PROPERTY) || resolved?.elementName || elementRef,
  };
}

/** Resolves (and caches) the display names of every form of the current client. */
async function getFormNames(): Promise<Map<string, string>> {
  if (formNameCache) {
    return formNameCache;
  }
  if (!formNamePromise) {
    formNamePromise = mirrorFormOptions()
      .then((options) => {
        const map = new Map<string, string>();
        for (const option of options) {
          map.set(option.value, option.text || option.value);
        }
        formNameCache = map;
        return map;
      })
      .catch(() => new Map<string, string>());
  }
  return formNamePromise;
}

/** Resolves (and caches) the display names of one source form's elements. */
async function getElementNames(formRef: string): Promise<Map<string, string>> {
  const cached = elementNameCache.get(formRef);
  if (cached) {
    return cached;
  }
  let promise = elementNamePromises.get(formRef);
  if (!promise) {
    promise = mirrorElementOptions(formRef)
      .then((options) => {
        const map = new Map<string, string>();
        for (const option of options) {
          map.set(option.value, option.text || option.name || option.value);
        }
        elementNameCache.set(formRef, map);
        elementNamePromises.delete(formRef);
        return map;
      })
      .catch(() => new Map<string, string>());
    elementNamePromises.set(formRef, promise);
  }
  return promise;
}

/** @returns `true` when at least one linked Mirror still lacks a resolved display name. */
function needsResolution(): boolean {
  if (!isMarkEnabled()) {
    return false;
  }
  const designer = designerInstance();
  for (const item of Object.values(designer?.items ?? {})) {
    if (!isMirrorItem(item)) {
      continue;
    }
    const id = item.getId?.() ?? "";
    if (!id || resolvedNames.has(id)) {
      continue;
    }
    const props = propertiesOf(item);
    const formRef = stringProp(props, MIRROR_FORM_PROPERTY);
    const elementRef = stringProp(props, MIRROR_ELEMENT_PROPERTY);
    if (!formRef || !elementRef) {
      continue; // Not linked → nothing to resolve.
    }
    if (stringProp(props, MIRROR_FORM_NAME_PROPERTY) && stringProp(props, MIRROR_ELEMENT_NAME_PROPERTY)) {
      continue; // Both names already cached on the item.
    }
    return true;
  }
  return false;
}

/** Resolves the display names of every linked Mirror and re-renders the badges when done. */
async function resolveNames(): Promise<void> {
  if (resolving) {
    return;
  }
  resolving = true;
  try {
    const forms = await getFormNames();
    const designer = designerInstance();
    let changed = false;
    for (const item of Object.values(designer?.items ?? {})) {
      if (!isMirrorItem(item)) {
        continue;
      }
      const id = item.getId?.() ?? "";
      if (!id || resolvedNames.has(id)) {
        continue;
      }
      const props = propertiesOf(item);
      const formRef = stringProp(props, MIRROR_FORM_PROPERTY);
      const elementRef = stringProp(props, MIRROR_ELEMENT_PROPERTY);
      if (!formRef || !elementRef) {
        continue;
      }
      const formName = stringProp(props, MIRROR_FORM_NAME_PROPERTY) || forms.get(formRef) || formRef;
      let elementName = stringProp(props, MIRROR_ELEMENT_NAME_PROPERTY);
      if (!elementName) {
        const elements = await getElementNames(formRef);
        elementName = elements.get(elementRef) || elementRef;
      }
      resolvedNames.set(id, { formName, elementName });
      changed = true;
    }
    if (changed) {
      refreshBadges();
    }
  } catch (x) {
    console.error("[CodBi] Element markers: resolving the linked element names failed", x);
  } finally {
    resolving = false;
  }
}

/**
 * Builds the badge text. When both references are known: `CodBi · <form> ⇔ <element>`; otherwise
 * `CodBi · <the known reference>` (or just `CodBi`).
 */
function badgeText(formName: string, elementName: string): string {
  if (formName !== "" && elementName !== "") {
    return `CodBi · ${formName} ⇔ ${elementName}`;
  }
  const only = formName || elementName;
  return only === "" ? "CodBi" : `CodBi · ${only}`;
}

/**
 * Builds the badge's inner DOM: the Mirror icon plus the text that is revealed when the badge is
 * hovered (the badge expands to the right, see `BADGE_CSS`).
 */
function buildBadgeInner(doc: Document, linked: boolean, text: string): DocumentFragment {
  const fragment = doc.createDocumentFragment();
  const icon = doc.createElement("span");
  icon.className = "codbi-elem-badge__icon";
  icon.setAttribute("aria-hidden", "true");
  // Paint the shared Mirror icon (`mirror-icon.svg`) as a background image — the same icon the
  // widget uses in the palette and the canvas placeholder.
  icon.style.backgroundImage = `url("${MIRROR_ICON_URL}")`;
  fragment.appendChild(icon);
  if (linked) {
    const label = doc.createElement("span");
    label.className = "codbi-elem-badge__text";
    label.textContent = text;
    fragment.appendChild(label);
  }
  return fragment;
}

/**
 * Content signature used to make {@link ensureBadge} idempotent so the `MutationObserver` never
 * triggers an endless rebuild loop.
 */
function signatureOf(linked: boolean, text: string): string {
  return `${linked ? "1" : "0"}\u0001${text}`;
}

/** Creates or updates the badge for one Mirror item (no-op when nothing changed). */
function ensureBadge(item: IMarkerItemLike, anchor: HTMLElement): void {
  const id = item.getId?.() ?? "";
  if (!id) {
    return;
  }
  const doc = anchor.ownerDocument ?? document;
  const props = propertiesOf(item);
  const formRef = stringProp(props, MIRROR_FORM_PROPERTY);
  const elementRef = stringProp(props, MIRROR_ELEMENT_PROPERTY);
  const linked = formRef !== "" && elementRef !== "";
  const names = namesFor(props, id, formRef, elementRef);
  const text = badgeText(names.formName, names.elementName);
  const signature = signatureOf(linked, text);

  let badge = badges.get(id);
  if (!badge || !badge.isConnected || badge.parentElement !== anchor) {
    badge = doc.createElement("span");
    badge.className = BADGE_CLASS;
    badge.dataset.codbiBadge = id;
    badges.set(id, badge);
  }
  if (badge.parentElement !== anchor) {
    anchor.appendChild(badge);
  }
  // Anchor the absolutely-positioned badge to the widget without disturbing an existing position.
  if (getComputedStyle(anchor).position === "static") {
    anchor.style.position = "relative";
  }
  // The "always show the reference" state is independent of the text content, so apply it before
  // the change-signature short-circuit below.
  badge.classList.toggle("codbi-elem-badge--open", showLabels);
  if (badge.dataset.codbiMark === signature) {
    return; // Already rendered with the current reference — leave the DOM untouched.
  }
  badge.dataset.codbiMark = signature;
  badge.classList.toggle("codbi-elem-badge--empty", !linked);
  badge.replaceChildren(buildBadgeInner(doc, linked, text));
}

/** Removes a badge from the DOM and forgets it. */
function dropBadge(id: string): void {
  badges.get(id)?.remove();
  badges.delete(id);
  resolvedNames.delete(id);
}

/** Removes every injected badge and clears the darkorange "marked" border from all widgets. */
function removeAllBadges(): void {
  for (const badge of badges.values()) {
    badge.remove();
  }
  badges.clear();
  for (const widget of markedWidgets) {
    widget.classList.remove("codbi-elem-marked");
  }
  markedWidgets.clear();
}

/** Highlights one Mirror widget with the darkorange "marked" border (idempotent). */
function markWidget(anchor: HTMLElement): void {
  const widget = (anchor.querySelector(".codbi-mirror") ??
    anchor.querySelector(".codbi-mirror-placeholder") ??
    anchor) as HTMLElement;
  widget.classList.add("codbi-elem-marked");
  markedWidgets.add(widget);
}

/** Forgets marked widgets that were detached (the designer re-rendered them). */
function pruneMarkedWidgets(): void {
  for (const widget of Array.from(markedWidgets)) {
    if (!widget.isConnected) {
      markedWidgets.delete(widget);
    }
  }
}

/**
 * Content signature used to make {@link ensureFuncBadge} idempotent so the `MutationObserver` never
 * triggers an endless rebuild loop.
 */
function funcSignature(funcs: IFunctionalityEntry[]): string {
  return funcs
    .map((fn) => `${fn.name}\u0002${fn.params.map((p) => `${p.name}\u0003${p.value}`).join("\u0002")}`)
    .join("\u0001");
}

/** Inline SVG of a trash can, used by the parameter table's remove button. */
const TRASH_ICON_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';

/** Inline SVG of four outward corner arrows, used by the table's maximize button. */
const MAXIMIZE_ICON_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4h6v2H6v4H4V4zm16 0v6h-2V6h-4V4h6zM4 20v-6h2v4h4v2H4zm16 0h-6v-2h4v-4h2v6z"/></svg>';

/**
 * Bounds the parameter popup so it never overflows the form element (or, when maximized, the
 * viewport). The available width is measured from the functionality sub-badge's left edge, because
 * the popup opens at the badge — not at the element's left edge — so its usable width is the space
 * up to the form element's (maximized: the viewport's) right edge.
 */
function applyFuncPopupWidth(subBadge: HTMLElement, popup: HTMLElement, anchor: HTMLElement, maximize: boolean): void {
  try {
    const win = anchor.ownerDocument?.defaultView ?? window;
    const anchorRect = anchor.getBoundingClientRect();
    const badgeRect = subBadge.getBoundingClientRect();
    const toElement = Math.max(160, Math.round(anchorRect.right - badgeRect.left));
    const toViewport = Math.max(160, Math.round(win.innerWidth - badgeRect.left - 16));
    if (maximize) {
      // Pin the popup to the full available width so the table visibly fills the space.
      const width = Math.max(toElement, toViewport);
      popup.style.minWidth = `${width}px`;
      popup.style.maxWidth = `${width}px`;
    } else {
      popup.style.minWidth = "";
      popup.style.maxWidth = `${toElement}px`;
    }
    popup.classList.toggle("codbi-func-item__params--max", maximize);
  } catch {
    /* ignore */
  }
}

/**
 * Returns the available Element Placeholder ids (extension stripped) from the designer's file list.
 * Used to populate the EP builder's suggestions.
 *
 * @returns The available EP ids. */
function listElementPlaceholders(): Array<string> {
  try {
    const raw = window.CodbiPluginData?.fslElementplaceholder ?? "[]";
    const parsed = JSON.parse(raw) as Array<string>;

    return Array.isArray(parsed) ? parsed.map((entry) => entry.replace(/\.(js|ts)$/i, "")) : [];
  } catch {
    return [];
  }
}

/**
 * Builds the parameter/value table shown when a functionality sub-badge is hovered: one row per
 * `data-cb-*` parameter. The first column holds the (fixed) parameter name, the second an EDITABLE
 * value input and the third a trash button that removes the parameter. Every change is written
 * straight into the item's property bag, so it shows up in the element's config attribute table.
 *
 * Pressing **ALT+E** on a value input opens the {@link openEPBuilder } popup so Element Placeholders
 * can be composed and nested; applying writes the serialized value back through the same path as a
 * manual edit.
 */
function buildFuncParamTable(
  doc: Document,
  params: Array<{ name: string; value: string }>,
  resolve: () => IMarkerItemLike,
  anchor: HTMLElement,
  subBadge: HTMLElement,
  popup: HTMLElement,
): HTMLTableElement {
  const table = doc.createElement("table");
  table.className = "codbi-func-table";
  const head = doc.createElement("thead");
  const headRow = doc.createElement("tr");
  const headName = doc.createElement("th");
  headName.textContent = i18n("designer.marker.table.parameter");
  const headValue = doc.createElement("th");
  headValue.textContent = i18n("designer.marker.table.value");
  const headActions = doc.createElement("th");
  headActions.className = "codbi-func-actions";
  headRow.append(headName, headValue, headActions);
  head.appendChild(headRow);
  table.appendChild(head);

  const body = doc.createElement("tbody");
  for (const param of params) {
    const row = doc.createElement("tr");
    // Column 1 — the (fixed) parameter name.
    const name = doc.createElement("th");
    name.scope = "row";
    name.textContent = param.name;
    // Column 2 — the editable value, followed by the maximize button at its right end.
    const valueCell = doc.createElement("td");
    const valueWrap = doc.createElement("span");
    valueWrap.className = "codbi-func-value";
    const input = doc.createElement("input");
    input.type = "text";
    input.className = "codbi-func-input";
    input.value = param.value;
    // Let the input claim enough width for the whole value (a stylesheet width can still cap it).
    input.size = Math.min(Math.max(param.value.length + 1, 8), 200);
    input.title = param.name;
    isolateControl(input);
    input.addEventListener("change", () => {
      setFuncAttribute(resolve(), param.name, input.value);
    });
    input.addEventListener("keydown", (event) => {
      // #region Alt+E → open the EP builder for this attribute value.
      if (event.altKey && event.key.toLowerCase() === "e") {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        openEPBuilder({
          // Render into the DESIGNER document (not the canvas iframe) so the popup snaps to the
          // designer window's edges, exactly like the Form Assistant dialog.
          document: window.document,
          anchor,
          value: input.value,
          listEPs: listElementPlaceholders,
          onApply: (value) => {
            input.value = value;
            setFuncAttribute(resolve(), param.name, value);
            input.blur();
          },
        });

        return;
      }
      // #endregion Alt+E → open the EP builder for this attribute value.

      if (event.key === "Enter") {
        event.preventDefault();
        input.blur(); // Commits the value (fires `change`).
      }
    });
    // Maximize the whole popup (toggles between element width and the full available viewport).
    const maximize = doc.createElement("button");
    maximize.type = "button";
    maximize.className = "codbi-func-maximize";
    maximize.title = i18n("designer.marker.table.maximize");
    maximize.setAttribute("aria-label", i18n("designer.marker.table.maximize"));
    maximize.innerHTML = MAXIMIZE_ICON_SVG;
    isolateControl(maximize);
    maximize.addEventListener("click", (event) => {
      event.preventDefault();
      const next = popup.dataset.codbiMax !== "1";
      popup.dataset.codbiMax = next ? "1" : "0";
      applyFuncPopupWidth(subBadge, popup, anchor, next);
    });
    valueWrap.append(input, maximize);
    valueCell.appendChild(valueWrap);
    // Column 3 — the trash button that removes the parameter.
    const actionsCell = doc.createElement("td");
    actionsCell.className = "codbi-func-actions";
    const remove = doc.createElement("button");
    remove.type = "button";
    remove.className = "codbi-func-delete";
    remove.title = i18n("designer.marker.table.delete");
    remove.setAttribute("aria-label", i18n("designer.marker.table.delete"));
    remove.innerHTML = TRASH_ICON_SVG;
    isolateControl(remove);
    remove.addEventListener("click", (event) => {
      event.preventDefault();
      const target = resolve();
      if (removeFuncAttribute(target, param.name)) {
        ensureFuncBadge(target, anchor); // Re-render without the removed parameter.
      }
    });
    actionsCell.appendChild(remove);
    row.append(name, valueCell, actionsCell);
    body.appendChild(row);
  }
  table.appendChild(body);
  return table;
}

/**
 * Builds the function badge's inner DOM: the CodBi logo icon plus the list of functionality badges.
 * The list is revealed when the widget is hovered; hovering one functionality badge expands it
 * downward to show that functionality's `data-cb-*` parameters (see `BADGE_CSS`).
 */
function buildFuncBadgeInner(
  doc: Document,
  funcs: IFunctionalityEntry[],
  resolve: () => IMarkerItemLike,
  anchor: HTMLElement,
): DocumentFragment {
  const fragment = doc.createDocumentFragment();
  const icon = doc.createElement("span");
  icon.className = "codbi-elem-badge__icon codbi-func-icon";
  icon.setAttribute("aria-hidden", "true");
  // Paint the shared CodBi logo (`Symbol_CodBi.svg`) — the same SVG the AI-assistant log shows for
  // functionality nodes.
  icon.style.backgroundImage = `url("${CODBI_LOGO_URL}")`;
  fragment.appendChild(icon);

  const list = doc.createElement("div");
  list.className = "codbi-func-list";
  for (const func of funcs) {
    const item = doc.createElement("div");
    item.className = "codbi-func-item";
    const name = doc.createElement("span");
    name.className = "codbi-func-item__name";
    name.textContent = func.name;
    item.appendChild(name);
    if (func.params.length > 0) {
      const params = doc.createElement("div");
      params.className = "codbi-func-item__params";
      // Size the popup to the space available within the form element, measured from THIS badge.
      item.addEventListener("mouseenter", () => {
        applyFuncPopupWidth(item, params, anchor, params.dataset.codbiMax === "1");
      });
      params.appendChild(buildFuncParamTable(doc, func.params, resolve, anchor, item, params));
      item.appendChild(params);
    }
    list.appendChild(item);
  }
  fragment.appendChild(list);
  return fragment;
}

/** Creates or updates the function badge for one `data-cb-func` item (no-op when nothing changed). */
function ensureFuncBadge(item: IMarkerItemLike, anchor: HTMLElement): void {
  const id = item.getId?.() ?? "";
  if (!id) {
    return;
  }
  const doc = anchor.ownerDocument ?? document;
  const funcs = existingFunctionalities(item);
  const signature = funcSignature(funcs);

  let badge = funcBadges.get(id);
  if (!badge || !badge.isConnected || badge.parentElement !== anchor) {
    badge = doc.createElement("div");
    badge.className = `${BADGE_CLASS} codbi-elem-badge--funcs`;
    badge.dataset.codbiBadge = id;
    funcBadges.set(id, badge);
  }
  if (badge.parentElement !== anchor) {
    anchor.appendChild(badge);
  }
  // Anchor the absolutely-positioned badge to the widget without disturbing an existing position.
  if (getComputedStyle(anchor).position === "static") {
    anchor.style.position = "relative";
  }
  // Feed the form element's width to the stylesheet so the parameter table never grows wider than
  // the element the badge sits on (`--codbi-func-anchor-width`, see `BADGE_CSS`).
  const anchorWidth = anchor.clientWidth || anchor.offsetWidth || 0;
  if (anchorWidth > 0) {
    badge.style.setProperty("--codbi-func-anchor-width", `${anchorWidth}px`);
  } else {
    badge.style.removeProperty("--codbi-func-anchor-width");
  }
  // The "detailed" (always show) state is independent of the content, so apply it before the
  // change-signature short-circuit below. This reveals the functionality list without hovering,
  // but intentionally NOT the parameter table (which stays hover-only).
  badge.classList.toggle("codbi-elem-badge--open", showLabels);
  if (badge.dataset.codbiFuncMark === signature) {
    return; // Already rendered with the current functionalities — leave the DOM untouched.
  }
  badge.dataset.codbiFuncMark = signature;
  // With no known functionality the badge must not expand (mirrors the Mirror `--empty` behaviour).
  badge.classList.toggle("codbi-elem-badge--empty", funcs.length === 0);
  // Resolve the item freshly on every edit (the badge may outlive the Item instance it was built for).
  const resolve = (): IMarkerItemLike => resolveFuncItem(id, anchor, item);
  badge.replaceChildren(buildFuncBadgeInner(doc, funcs, resolve, anchor));
}

/** Removes a function badge from the DOM and forgets it. */
function dropFuncBadge(id: string): void {
  funcBadges.get(id)?.remove();
  funcBadges.delete(id);
}

/** Removes every injected function badge and clears the darkorange border from its widgets. */
function removeAllFuncBadges(): void {
  for (const badge of funcBadges.values()) {
    badge.remove();
  }
  funcBadges.clear();
  for (const widget of markedFuncWidgets) {
    widget.classList.remove("codbi-elem-marked");
  }
  markedFuncWidgets.clear();
}

/** Highlights one `data-cb-func` element with the darkorange "marked" border (idempotent). */
function markFuncWidget(anchor: HTMLElement): void {
  anchor.classList.add("codbi-elem-marked");
  markedFuncWidgets.add(anchor);
}

/** Forgets marked function widgets that were detached (the designer re-rendered them). */
function pruneMarkedFuncWidgets(): void {
  for (const widget of Array.from(markedFuncWidgets)) {
    if (!widget.isConnected) {
      markedFuncWidgets.delete(widget);
    }
  }
}

/**
 * Re-applies the badges for all marker items on the canvas: adds/updates the Mirror badges and the
 * `data-cb-func` function badges of the current items and drops the badges of removed items.
 * Idempotent — safe to call as often as needed.
 *
 * The canvas discovery (root detection + stylesheet injection) runs INDEPENDENT of the marker mode,
 * because the unconfigured Mirror placeholder must load `mirror-icon.svg` even when markers are off.
 */
function refreshBadges(): void {
  const enabled = isMarkEnabled();
  refreshing = true;
  try {
    const designer = designerInstance();
    const items = designer?.items ?? {};
    const liveMirrors = new Set<string>();
    const liveFuncs = new Set<string>();
    let mirrors = 0;
    let functions = 0;
    for (const item of Object.values(items)) {
      const isMirror = isMirrorItem(item);
      const isFunc = isCbFuncItem(item);
      if (!isMirror && !isFunc) {
        continue;
      }
      const anchor = anchorFor(item);
      if (anchor) {
        // Always inject the stylesheet + observe the canvas root (placeholder icon, see BADGE_CSS).
        const root = rootFor(anchor);
        installBadgeStyles(root);
        observeRoot(root);
      }
      const id = item.getId?.() ?? "";
      if (isMirror) {
        mirrors += 1;
        if (id) {
          liveMirrors.add(id);
        }
        if (anchor && enabled) {
          markWidget(anchor);
          try {
            ensureBadge(item, anchor);
          } catch (x) {
            console.error("[CodBi] Element markers: could not render the Mirror badge", x);
          }
        }
      }
      if (isFunc) {
        functions += 1;
        if (id) {
          liveFuncs.add(id);
        }
        if (anchor && enabled) {
          markFuncWidget(anchor);
          try {
            ensureFuncBadge(item, anchor);
          } catch (x) {
            console.error("[CodBi] Element markers: could not render the function badge", x);
          }
        }
      }
    }
    if (enabled) {
      // Drop Mirror badges whose item no longer exists or is no longer a Mirror.
      for (const id of Array.from(badges.keys())) {
        if (!liveMirrors.has(id)) {
          dropBadge(id);
        }
      }
      pruneMarkedWidgets();
      // Drop function badges whose item no longer exists or no longer carries a `data-cb-func`.
      for (const id of Array.from(funcBadges.keys())) {
        if (!liveFuncs.has(id)) {
          dropFuncBadge(id);
        }
      }
      pruneMarkedFuncWidgets();
    } else {
      removeAllBadges();
      removeAllFuncBadges();
    }
    console.log(
      "[CodBi] Element markers: %d mirror(s), %d badge(s), %d function element(s), %d function badge(s) (enabled=%s)",
      mirrors,
      badges.size,
      functions,
      funcBadges.size,
      enabled,
    );
  } finally {
    refreshing = false;
  }
  // Fill in the human-readable names for linked Mirrors (async, cached, idempotent).
  if (enabled && needsResolution()) {
    void resolveNames();
  }
}

/** Debounced refresh — coalesces bursts of canvas mutations into one pass. */
function scheduleRefresh(): void {
  if (refreshHandle !== null) {
    window.clearTimeout(refreshHandle);
  }
  refreshHandle = window.setTimeout(() => {
    refreshHandle = null;
    refreshBadges();
  }, 60);
}

/**
 * Turns the markers on/off. Used only when the form-properties switch is NOT mounted; otherwise
 * the switch (and thus the persisted property) is the single source of truth.
 */
function setRuntimeEnabled(on: boolean): void {
  runtimeOverride = on;
  refreshBadges();
}

/**
 * Global ALT+V handler: toggles the mode. When the form-properties switch input is present it is
 * flipped (so the change is persisted and the panel reflects it); the resulting `set-property`
 * callback refreshes the markers. Without the switch we toggle the runtime state directly.
 */
function toggleMarkMode(): void {
  const input = document.querySelector<HTMLInputElement>(MARK_SWITCH_INPUT_SELECTOR);
  if (input) {
    input.checked = !input.checked;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    refreshBadges();
    return;
  }
  setRuntimeEnabled(!isMarkEnabled());
}

/** The shared keydown handler (registered on the designer frame and on the canvas document). */
function onKeyDown(event: KeyboardEvent): void {
  if (event.altKey && event.key.toLowerCase() === "v") {
    event.preventDefault();
    toggleMarkMode();
  }
}

/** Installs the designer hooks, the ALT+V shortcut and the canvas mutation observers. */
export function enableCodbiElementMarkers(): void {
  try {
    // Re-apply the badges whenever the form (re)loads, items are created or a property changes.
    // The callbacks have heterogeneous signatures (some return a value the designer expects), so we
    // register through a minimal structural view — we never use the callback's arguments/return.
    const refreshSoon = (): void => scheduleRefresh();
    const events = ["designer-form-loaded", "set-property", "after-set-property"] as const;
    for (const event of events) {
      try {
        (Callbacks[event] as unknown as { add(listener: () => void): void }).add(refreshSoon);
      } catch (x) {
        console.error(`[CodBi] Element markers: failed to register the '${event}' callback`, x);
      }
    }
    // Dedicated `items-created` hook: it also LOGS the created items, so a refused/unresolved drop
    // (the designer never creates the item) can be told apart from a mere rendering problem.
    try {
      (
        Callbacks["items-created"] as unknown as {
          add(listener: (ids: Set<string>, items: Record<string, { className?: string | null }>) => unknown): void;
        }
      ).add((ids, items) => {
        console.log(
          "[CodBi] Element markers: items-created ids=%o classes=%o",
          Array.from(ids ?? []),
          Object.values(items ?? {}).map((item) => item?.className),
        );
        scheduleRefresh();
        // CRITICAL: the `items-created` event is declared to RETURN a `Set<string>` (the ids the
        // designer should draw). The designer does `fire(...).reduce(...)` over the listeners'
        // return values — returning `undefined` throws "t is not iterable" and aborts the drop, so a
        // newly dropped item is created but never placed. Return an empty set (we redraw ourselves).
        return new Set<string>();
      });
    } catch (x) {
      console.error("[CodBi] Element markers: failed to register the 'items-created' callback", x);
    }

    // The slider switch dispatches this whenever it is flipped (and whenever the designer seeds its
    // value), carrying the actual state — so the overlay updates immediately and never depends on
    // locating the input by id or on the property having been persisted.
    document.addEventListener(MARK_ELEMENTS_CHANGED_EVENT, (event: Event) => {
      const detail = (event as CustomEvent<{ enabled?: boolean; showLabels?: boolean }>).detail;
      if (typeof detail?.enabled === "boolean") {
        switchEnabled = detail.enabled;
      }
      if (typeof detail?.showLabels === "boolean") {
        showLabels = detail.showLabels;
      }
      console.log("[CodBi] Element markers: switch state =", switchEnabled, "showLabels =", showLabels);
      scheduleRefresh();
    });

    // The designer frame (palette + properties panel) is always observed; the canvas root is
    // observed lazily once we reach a marker item there (see `observeRoot`).
    installBadgeStyles(document);
    observeRoot(document);
    document.addEventListener("keydown", onKeyDown);

    // Initial pass once the designer had a chance to render its first form.
    scheduleRefresh();
    window.setTimeout(refreshBadges, 400);
    console.log("[CodBi] Element markers enabled (ALT+V toggles the mirror mode)");
  } catch (x) {
    console.error("[CodBi] Element markers: initialization failed", x);
  }
}
