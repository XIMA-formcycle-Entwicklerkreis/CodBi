// #region Imports
import { $, Callbacks, instance as getDesignerInstance } from "@de-xima/fc-form-designer";
import { Constants } from "codbi-common";
import { MARK_ELEMENTS_CHANGED_EVENT } from "./CodbiSwitchEditor.js";
import { openEPBuilder } from "./EPBuilder.js";
import { mirrorElementOptions, mirrorFormOptions } from "./MirrorSelect.js";
import { i18n } from "./i18n.js";
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

/**
 * Form property holding the designer "Preview mode" (`designer.property.preview_elements`). When ON,
 * a preview switch appears on every form element carrying `data-cb-func` so each element's CodBi
 * functionalities can be previewed in isolation (see `ensureElementPreviewSwitch`).
 */
const PREVIEW_ELEMENTS_PROPERTY = String(Constants["designer.property.preview_elements"]);

/**
 * Attribute written onto a form element (via `setItemAttributeValue`) holding the per-element
 * "preview this element" toggle (`"1"`/`"0"`). Only the designer preview reads it; the published form
 * and the CodBi runtime ignore it.
 */
const ELEMENT_PREVIEW_ATTRIBUTE = "data-cb-preview";

/** CSS class toggled on a general element while its preview is on. */
const ELEM_PREVIEW_CLASS = "codbi-elem-preview";

/** Live preview-switch widgets keyed by the element's item id. */
const previewSwitches = new Map<string, HTMLElement>();

/** Signature of the attributes last applied to a preview wrapper, so the runtime isn't re-run. */
const previewApplied = new WeakMap<HTMLElement, string>();

/** The preview-toggle icon (an eye). */
const EYE_ICON_SVG =
  '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">' +
  '<path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>' +
  '<circle cx="8" cy="8" r="2" fill="currentColor"/></svg>';

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
.codbi-func-preview-switch{position:absolute;top:4px;right:4px;z-index:30;display:inline-flex;align-items:center;gap:5px;box-sizing:border-box;background:rgba(255,255,255,.94);border:1px solid darkorange;border-radius:999px;box-shadow:0 1px 3px rgba(15,23,42,.28);padding:3px 7px;cursor:pointer;pointer-events:auto;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:11px;line-height:1;color:#374151;user-select:none}
.codbi-func-preview-switch__icon{display:inline-flex;align-items:center;justify-content:center;color:currentColor}
.codbi-func-preview-switch__input{position:absolute;opacity:0;width:0;height:0;pointer-events:none}
.codbi-func-preview-switch__track{position:relative;flex:0 0 auto;width:26px;height:14px;border-radius:999px;background:#cbd5e1;transition:background .15s}
.codbi-func-preview-switch__knob{position:absolute;top:1px;left:1px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.35);transition:transform .15s}
.codbi-func-preview-switch--on{border-color:#f97316}
.codbi-func-preview-switch--on .codbi-func-preview-switch__track{background:#ff8c00}
.codbi-func-preview-switch--on .codbi-func-preview-switch__knob{transform:translateX(12px)}
.codbi-func-preview-frame{display:block;width:100%;box-sizing:border-box;border:0;background:#fff;overflow:hidden;pointer-events:auto !important;position:relative;z-index:8}
/* Per-element "Preview mode" (the form-level preview switch). The wrapper is the element's own canvas
   cell, so it needs its own hide-children + pointer rules. */
.codbi-elem-preview{outline:2px dashed rgba(255,140,0,.55);outline-offset:2px}
.codbi-elem-preview.codbi-func-preview--rendered > *:not(.codbi-func-preview-frame):not(.codbi-func-preview-switch){display:none !important}
.codbi-elem-preview.codbi-func-preview--rendered{pointer-events:auto !important}
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
  /**
   * Whether the designer is still (re)loading a form. While `true`, `getPersist()`.
   * internally calls `getBaseProperties()`, which is not populated until loading
   * finishes — so `getPersist()` THROWS while the form is loading. Poll this before
   * reading the persist.
   */
  _isLoading?: unknown;
  /** Returns the current form persist (the serialized form JSON). */
  getPersist?(): unknown;
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
    // The attribute grid is a SHARED editor that is only bound to the item that is CURRENTLY
    // SELECTED. Committing through it is therefore only valid for that selected item. When the edited
    // item is a DIFFERENT one (e.g. the contained child of a Functionality widget, selected while the
    // widget stays selected), we must NOT call `showProperties`/`triggerSetProperty` here — rebinding
    // the selection mid-edit is jarring, and pushing the child's `data-cb-*` through the mis-bound
    // shared editor COMMITS them into the previously-selected item (the widget), which is exactly the
    // "attributes written on the widget too" regression. The model is already persisted directly via
    // `props.attributes = attrs` (see `setFuncAttribute`), so skipping the grid sync for a
    // non-selected item loses nothing — the grid shows the child's attributes once it is selected.
    const selected = designer.getSelectedMasterItem?.();
    if (selected !== item) {
      return;
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
  // DEBUG: log every attribute write with the target item, so we can see whether the data-cb-*
  // are ever written onto the Functionality WIDGET item instead of only the CONTAINED child.
  try {
    console.info(
      "[CodBi] DEBUG write attr=%s onto class=%s id=%s val=%s",
      name,
      String(item.className ?? ""),
      item.getId?.() ?? "",
      value,
    );
  } catch {
    /* debug only */
  }
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
 * Sets or updates one attribute on an arbitrary designer item's property bag — the same bag the
 * designer's AttributesEditor reads/writes. Exported so the Functionality configurator can write a
 * parameter straight into the CONTAINED element's config attribute table.
 *
 * @param item  The target item.
 * @param name  The attribute name (e.g. `data-cb-reverse`).
 * @param value The new attribute value.
 *
 * @returns **True** when the attribute was written. */
export function setItemAttributeValue(item: IMarkerItemLike, name: string, value: string): boolean {
  return setFuncAttribute(item, name, value);
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

/** @returns `true` when the item is a FORMCYCLE spacer element (`XSpacer`). */
function isSpacerItem(item: IMarkerItemLike): boolean {
  return String(item.className ?? "").toLowerCase() === "xspacer";
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

/** Removes a preview switch from the DOM and forgets it. */
function dropPreviewSwitch(id: string): void {
  previewSwitches.get(id)?.remove();
  previewSwitches.delete(id);
}

/**
 * Whether the form-level "Preview mode" is ON (the `designer.property.preview_elements` form
 * property). When ON, a preview switch is added to every element — see
 * {@link ensureElementPreviewSwitch}.
 */
function previewElementsEnabled(): boolean {
  const designer = designerInstance();
  if (designer?.getFormPropertyValueForCurrentLang) {
    try {
      const value = designer.getFormPropertyValueForCurrentLang(PREVIEW_ELEMENTS_PROPERTY);
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

/** Reads an element's persisted `data-cb-preview` toggle from its attribute bag. */
function elementPreviewOn(item: IMarkerItemLike): boolean {
  return attributeValue(attributeEntries(item), ELEMENT_PREVIEW_ATTRIBUTE) === "1";
}

/**
 * Applies/removes the **per-element** frontend preview of an arbitrary element. It reuses
 * {@link renderServerPreview} to load a genuine form instance into a hidden same-origin iframe,
 * which is then clipped to THIS element via its item id.
 */
function applyElementPreview(item: IMarkerItemLike, anchor: HTMLElement, on: boolean): void {
  try {
    anchor.classList.toggle(ELEM_PREVIEW_CLASS, on);
    if (!on) {
      previewApplied.delete(anchor);
      clearServerPreview(anchor);
      return;
    }
    const id = item.getId?.() ?? "";
    // Signature = the element's own identity; re-render only when it changed.
    const signature = `elem\u0001${id}`;
    if (previewApplied.get(anchor) === signature) {
      return;
    }
    void renderServerPreview(anchor, item, signature);
  } catch (x) {
    console.error("[CodBi] Preview: could not apply the element preview", x);
  }
}

/**
 * Creates/updates the per-element preview switch (idempotent). It is keyed by the element's item id
 * in the shared {@link previewSwitches} map and toggles the element's persisted `data-cb-preview`
 * attribute (written onto the element itself via {@link setItemAttributeValue}), so the designer
 * re-renders and `refreshBadges` re-applies the preview.
 */
function ensureElementPreviewSwitch(item: IMarkerItemLike, anchor: HTMLElement): void {
  const id = item.getId?.() ?? "";
  if (!id) {
    return;
  }
  const doc = anchor.ownerDocument ?? document;
  const on = elementPreviewOn(item);

  let widget = previewSwitches.get(id);
  if (!widget || !widget.isConnected || widget.parentElement !== anchor) {
    if (widget && widget.parentElement !== anchor) {
      widget.remove();
    }
    const button = doc.createElement("button");
    button.type = "button";
    button.className = "codbi-func-preview-switch codbi-func-preview-switch--element";
    button.dataset.codbiPreview = id;
    const icon = doc.createElement("span");
    icon.className = "codbi-func-preview-switch__icon";
    icon.innerHTML = EYE_ICON_SVG;
    const track = doc.createElement("span");
    track.className = "codbi-func-preview-switch__track";
    const knob = doc.createElement("span");
    knob.className = "codbi-func-preview-switch__knob";
    track.appendChild(knob);
    button.append(icon, track);
    for (const type of ["mousedown", "mouseup", "click", "dblclick", "keydown", "keyup"] as const) {
      button.addEventListener(type, (event) => event.stopPropagation());
    }
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const current = elementPreviewOn(item);
      // Write the toggle onto the element's own attribute bag; the designer re-renders and
      // refreshBadges re-applies the preview (and the `after-set-property` callback refreshes).
      setItemAttributeValue(item, ELEMENT_PREVIEW_ATTRIBUTE, current ? "0" : "1");
    });
    widget = button;
    previewSwitches.set(id, widget);
  }

  widget.classList.toggle("codbi-func-preview-switch--on", on);
  widget.title = on ? "Vorschau deaktivieren" : "Vorschau mit Funktionalitäten";
  if (widget.parentElement !== anchor) {
    anchor.appendChild(widget);
  }
  if (getComputedStyle(anchor).position === "static") {
    anchor.style.position = "relative";
  }
  applyElementPreview(item, anchor, on);
}

/**
 * Loads the CONTAINED element's frontend preview by embedding the platform's OWN designer-preview page
 * for the current form (`…/form-management/designer/preview/<projectId>?xfd2id=<draft>`) in a hidden,
 * SAME-ORIGIN iframe. Because that page is a genuine formcycle render, it brings the full bootstrap
 * (`XM_FORM_MODEL` / `XFC_METADATA` / …), the form runtime AND — via this plugin's form-render callback
 * — the CodBi runtime, so every functionality (e.g. `HTML.Input.TinyMCE`) initialises exactly like on a
 * real form. This replaces the impossible approach of assembling a form page ourselves: a plugin cannot
 * produce the platform's inline model/validation bootstrap.
 *
 * The iframe is then clipped to the CONTAINED element (see {@link clipPreviewToElement}).
 */
async function renderServerPreview(
  wrapper: HTMLElement,
  child: IMarkerItemLike | undefined,
  signature: string,
): Promise<void> {
  try {
    const elementRef = child?.getId?.() ?? "";
    const url = designerPreviewUrl();
    if (!url) {
      console.warn("[CodBi] Preview: cannot determine the designer preview URL — skipping preview");
      return;
    }
    const doc = wrapper.ownerDocument ?? document;
    let frame = wrapper.querySelector<HTMLIFrameElement>(":scope > .codbi-func-preview-frame");
    if (!frame) {
      frame = doc.createElement("iframe");
      frame.className = "codbi-func-preview-frame";
      frame.setAttribute("title", "CodBi form preview");
      // Plain same-origin iframe (no `sandbox`): the platform preview page is trusted and its runtime
      // (plus TinyMCE's nested editors) must run unfettered; sandboxing it can break those sub-frames.
      frame.style.height = "360px";
      wrapper.appendChild(frame);
    }
    const target = frame;
    // The preview page renders the form asynchronously, so the element may appear AFTER `load`.
    target.addEventListener("load", () => scheduleClip(target, elementRef), { once: true });
    target.src = url;
    wrapper.classList.add("codbi-func-preview--rendered");
    // Mark applied only once the iframe is pointed at the preview (a re-enable with the same target
    // skips the reload; changing the contained element changes the signature and reloads).
    previewApplied.set(wrapper, signature);
    console.info("[CodBi] Preview: form preview loading %s", url);
  } catch (x) {
    console.error("[CodBi] Preview: form preview failed", x);
  }
}

/**
 * Keeps the preview fitted to the element: retries until the element exists, then re-fits a few more
 * times AFTER success, because a functionality (e.g. `HTML.Input.TinyMCE`) mounts its editor
 * asynchronously AFTER the form rendered and thereby changes the element's height (and the preview
 * chrome settles late).
 */
function scheduleClip(frame: HTMLIFrameElement, elementRef: string, attempts = 0): void {
  const ok = clipPreviewToElement(frame, elementRef);
  if (attempts >= 16) {
    if (!ok) {
      sizePreviewToFullDocument(frame);
    }
    return;
  }
  window.setTimeout(() => scheduleClip(frame, elementRef, attempts + 1), ok ? 500 : 250);
}

/** A form control — never a valid "item wrapper" (its siblings include the functionality's own UI). */
function isFormControl(node: HTMLElement): boolean {
  const tag = node.tagName;
  return tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT" || tag === "BUTTON";
}

/** Pop-up/overlay nodes that must never be hidden (calendar, menus, autocomplete, select menus). */
function isPreviewPopup(node: Element): boolean {
  const cls = typeof (node as HTMLElement).className === "string" ? (node as HTMLElement).className : "";
  return /ui-datepicker|tox-tinymce-aux|tox-menu|tox-pop|ui-autocomplete|ui-selectmenu|xm-select-options/i.test(cls);
}

/**
 * The FORMCYCLE preview page overlays its own chrome on top of the form: notably the "preview tools"
 * trigger (`#previewForm:previewToolsDial`) that opens the preview-tools palette. It is not a sibling
 * of the clipped element (so the sibling-hiding does not remove it) and would sit on top of / beside
 * the preview. Hides every such chrome node (and, defensively, those inside nested same-origin
 * iframes the preview may frame the form in).
 */
function hidePreviewChrome(doc: Document): void {
  const selectors = [
    '[id="previewForm:previewToolsDial"]',
    '[id*="previewToolsDial"]',
    '[id="previewForm:previewToolsButton"]',
  ];
  const hideIn = (d: Document): void => {
    for (const selector of selectors) {
      for (const node of Array.from(d.querySelectorAll<HTMLElement>(selector))) {
        node.style.display = "none";
        node.setAttribute("aria-hidden", "true");
      }
    }
  };
  hideIn(doc);
  for (const frame of Array.from(doc.querySelectorAll("iframe"))) {
    try {
      const inner = (frame as HTMLIFrameElement).contentDocument;
      if (inner) {
        hideIn(inner);
      }
    } catch {
      /* cross-origin — ignore */
    }
  }
}

/**
 * Resolves the single-element FORMCYCLE "item wrapper" for [el]: the node that represents ONE form
 * element (as opposed to the whole form).
 *
 * - If a functionality rendered an editor (TinyMCE → `.tox-tinymce`), the wrapper is the closest
 *   ancestor that CONTAINS the editor — never the bare `<textarea>`: the editor is a sibling of the
 *   textarea, so treating the textarea as the wrapper hid the editor and collapsed the height to 0.
 * - Otherwise the nearest ancestor/self with an item class (`.XItem` / `xm-item…`), skipping form
 *   controls (the field itself carries `XItem XTextArea`, which would otherwise win).
 */
function resolveItemWrapper(el: HTMLElement, owner: Document): HTMLElement | null {
  const editor = owner.querySelector<HTMLElement>(".tox-tinymce, .mce-tinymce, .tox-editor-container");
  if (editor) {
    let found: HTMLElement | null = null;
    for (let n: HTMLElement | null = el; n && n !== owner.body; n = n.parentElement) {
      if (n.contains(editor)) {
        found = n; // keep climbing → the highest ancestor that still contains the editor
      }
    }
    if (found && !isFormControl(found)) {
      return found;
    }
  }
  for (let n: HTMLElement | null = el; n && n !== owner.body; n = n.parentElement) {
    if (isFormControl(n)) {
      continue;
    }
    const cls = typeof n.className === "string" ? n.className : "";
    if (/XItem|xm-item/i.test(cls) || n.hasAttribute("data-xm-appendable")) {
      return n;
    }
  }
  return null;
}

/**
 * Re-anchors a page/container element to its full CONTENT card, so the preview clips the whole
 * element instead of a tiny inner node whose content lives among its siblings.
 *
 * FORMCYCLE renders pages and containers so the element's own id often sits on a SMALL inner node:
 * - a page   → the `.CXPage` header/title (~60px), whose fields are its SIBLINGS inside the `.XPage`
 *   content block; and
 * - a container/fieldset → the `.CXContainer`/`.CXFieldSet` wrapper, whose fields are its
 *   `.dynamic-row`/`.XFieldSetWrapper` DESCENDANTS.
 *
 * The sibling-hiding in {@link clipPreviewToElement} would hide that content (the page fields, or
 * everything outside a container), leaving the grey rectangle with the whole form in the DOM but
 * invisible. This resolves:
 * - page → the `.XPage` content block (title + all page fields),
 * - container/fieldset → its `.CXContainer`/`.CXFieldSet` wrapper (never the parent page).
 *
 * @returns the content card, or `item` unchanged when `el`/`item` is a plain field.
 */
function elementContentCard(el: HTMLElement, item: HTMLElement, owner: Document): HTMLElement {
  const isPage = /(^|\s)(CXPage|XPage)(\s|$)/;
  const isContainer = /(^|\s)(CXContainer|XContainer|CXFieldSet|XFieldSet)(\s|$)/;
  const itemIsPage = isPage.test(String(item.className ?? ""));
  const itemIsContainer = isContainer.test(String(item.className ?? ""));
  // A plain field: nothing to re-anchor — keep the resolved wrapper.
  if (!isPage.test(String(el.className ?? "")) && !itemIsPage && !itemIsContainer) {
    return item;
  }
  let card: HTMLElement | null = itemIsPage || itemIsContainer ? item : null;
  let n: HTMLElement | null = card ? card.parentElement : item;
  while (n && n !== owner.body) {
    const cls = String(n.className ?? "");
    if (isContainer.test(cls)) {
      card = n;
    } else if (isPage.test(cls)) {
      // A container/fieldset never absorbs its (page) ancestor — it is bounded by the page.
      if (itemIsContainer) {
        break;
      }
      card = n;
    }
    n = n.parentElement;
  }
  return card ?? item;
}

/** Pop-up/overlay selectors whose height must be included in the iframe (calendar, menus, …). */
const PREVIEW_POPUP_SELECTORS = [
  ".ui-datepicker",
  ".ui-autocomplete",
  ".ui-selectmenu-menu",
  ".tox-tinymce-aux",
  ".tox-menu",
  ".tox-pop",
  ".xm-select-options",
  "[role='listbox']",
];

/** One active preview iframe + the element it shows, for pop-up-aware re-fitting. */
interface IPreviewFit {
  frame: HTMLIFrameElement;
  owner: Document;
  item: HTMLElement;
  timer?: number;
}

/** Active previews (re-fitted whenever the preview document mutates). */
const previewFits = new Set<IPreviewFit>();
/** Preview documents already observed (install the MutationObserver at most once per document). */
const observedPreviewDocs = new WeakSet<Document>();

/** Registers/updates the fit record for [frame] and returns it. */
function registerPreviewFit(frame: HTMLIFrameElement, owner: Document, item: HTMLElement): IPreviewFit {
  for (const entry of previewFits) {
    if (entry.frame === frame) {
      entry.owner = owner;
      entry.item = item;
      return entry;
    }
  }
  const entry: IPreviewFit = { frame, owner, item };
  previewFits.add(entry);
  return entry;
}

/** Unregisters the fit record of [frame] (called when the preview iframe is removed). */
function unregisterPreviewFit(frame: HTMLIFrameElement): void {
  for (const entry of Array.from(previewFits)) {
    if (entry.frame === frame) {
      if (entry.timer !== undefined) {
        window.clearTimeout(entry.timer);
      }
      previewFits.delete(entry);
    }
  }
}

/** Debounced re-fit of one preview (called from the DOM observer). */
function scheduleFit(entry: IPreviewFit): void {
  if (entry.timer !== undefined) {
    window.clearTimeout(entry.timer);
  }
  entry.timer = window.setTimeout(() => {
    entry.timer = undefined;
    fitPreviewHeight(entry);
  }, 60);
}

/** Observes [owner] so pop-ups added/removed AFTER the initial clip are reflected in the height. */
function observePreview(owner: Document): void {
  if (observedPreviewDocs.has(owner) || !owner.body) {
    return;
  }
  observedPreviewDocs.add(owner);
  try {
    const observer = new MutationObserver(() => {
      for (const entry of previewFits) {
        if (entry.owner === owner) {
          scheduleFit(entry);
        }
      }
    });
    observer.observe(owner.body, { childList: true, subtree: true });
  } catch {
    /* ignore */
  }
}

/**
 * Sizes the iframe to hold the element AND any open pop-up (jQuery-UI calendar, TinyMCE menu, …) that
 * has been appended to the preview document, so pop-ups are fully visible instead of clipped at the
 * iframe edge. Returns the applied height.
 */
function fitPreviewHeight(entry: IPreviewFit): number {
  const { frame, owner, item } = entry;
  let bottom = item.getBoundingClientRect().bottom;
  // A freshly-revealed region (inactive page / header / footer) may not have finished laying out when
  // this first runs: the element rect is 0 while its OWN content (scrollHeight) is real. Use the
  // larger of the viewport-anchored bottom and the element's own content height so the iframe does
  // not collapse to the 60px minimum ("too thin" / blank preview) until the 500 ms re-fit corrects it.
  if (bottom <= 0) {
    const own = item.scrollHeight || item.offsetHeight;
    if (own > 0) {
      bottom = own;
    }
  }
  // Include the rendered editor (TinyMCE) height: the tagged field often collapses to 0 once the
  // editor takes over, so the item's own rect alone would be too small.
  const editor = owner.querySelector<HTMLElement>(".tox-tinymce, .mce-tinymce, .tox-editor-container");
  if (editor) {
    const editorRect = editor.getBoundingClientRect();
    if (editorRect.height > 0) {
      bottom = Math.max(bottom, editorRect.bottom);
    }
  }
  for (const selector of PREVIEW_POPUP_SELECTORS) {
    for (const popup of Array.from(owner.querySelectorAll<HTMLElement>(selector))) {
      const rect = popup.getBoundingClientRect();
      if (rect.height > 0 && rect.width > 0) {
        bottom = Math.max(bottom, rect.bottom);
      }
    }
  }
  const height = Math.max(60, Math.min(Math.ceil(bottom) + 12, 4000));
  frame.style.height = `${height}px`;
  // Ask the designer to recompute the item layout so the item grows to the iframe's new height.
  try {
    window.dispatchEvent(new Event("resize"));
  } catch {
    /* ignore */
  }
  return height;
}

/**
 * Clips the preview iframe to the CONTAINED element so the widget shows just that element (as if it
 * were a native designer element): it hides the element's SIBLINGS (other elements, pages, buttons,
 * preview chrome) but NEVER its own children, and grows the iframe to the element's full frontend
 * height so there is no scrollbar. Returns `false` while the element is not (yet) present.
 */
function clipPreviewToElement(frame: HTMLIFrameElement, elementRef: string): boolean {
  try {
    const cdoc = frame.contentDocument;
    if (!cdoc || !cdoc.body) {
      return false;
    }
    const el = elementRef ? findPreviewElement(cdoc, elementRef) : null;
    const owner = el?.ownerDocument;
    if (!el || !owner || !owner.body) {
      return false;
    }
    let item: HTMLElement = resolveItemWrapper(el, owner) ?? el;
    // A page/container's designer id often sits on a SMALL inner node — for a page that is the
    // `.CXPage` header/title (~60px), for a container/fieldset the `.CXContainer`/`.CXFieldSet`
    // wrapper — while the ACTUAL content (the page's / container's fields) are that node's SIBLINGS
    // or descendants. The sibling-hiding below would hide them, leaving a grey rectangle with the
    // whole form in the DOM but invisible. Re-anchor such elements to their full content card:
    // - page  → the `.XPage` content block (title + all page fields),
    // - container/fieldset → the `.CXContainer`/`.CXFieldSet` wrapper (its `.dynamic-row` fields).
    item = elementContentCard(el, item, owner);
    // The top-level block (body child) that contains the item.
    let top: HTMLElement = item;
    while (top.parentElement && top.parentElement !== owner.body) {
      top = top.parentElement;
    }
    // Reveal the element's own ancestor path (item → top). Formcycle renders the CURRENT page's
    // content and hides every OTHER region (`display:none` on inactive pages, collapsed header/footer
    // areas) until the user navigates to it. `findPreviewElement` still locates such an element, but
    // its `getBoundingClientRect()` is 0 while a hidden ancestor keeps it out of layout — so the
    // iframe collapsed to the 60px minimum (a blank / "too thin" preview). Forcing the element's own
    // ancestors visible lets the element lay out, and the re-fits in `scheduleClip` then measure it
    // correctly. The other (hidden) regions stay hidden via the sibling-hiding below.
    for (let a: HTMLElement | null = item; a && a !== owner.body; a = a.parentElement) {
      const cs = owner.defaultView?.getComputedStyle(a);
      if (cs && cs.display === "none") {
        // Pages/containers/regions are block-level; restoring `block` (or `table` for tables) brings
        // the element back into layout without disturbing the siblings around it.
        a.style.display = a.tagName === "TABLE" ? "table" : "block";
      }
    }
    // Hide the element's SIBLINGS at every level up to the top-level block, and every other top-level
    // node — but NEVER a node that contains the functionality's editor (its UI is a sibling of the
    // tagged field) and never a pop-up. This is done unconditionally (not only when the wrapper was
    // recognised), so re-enabling the preview reliably isolates the element even if the editor has not
    // mounted yet (in which case the not-yet-created editor is simply a new node, never hidden).
    const editor = owner.querySelector<HTMLElement>(".tox-tinymce, .mce-tinymce, .tox-editor-container");
    const containsEditor = (node: Element): boolean => editor !== null && (node === editor || node.contains(editor));
    const shouldHide = (sibling: Element, keep: Element): boolean =>
      sibling !== keep && !isPreviewPopup(sibling) && !containsEditor(sibling);
    let node: HTMLElement = item;
    while (node !== top) {
      const parent = node.parentElement;
      if (!parent) {
        break;
      }
      for (const sibling of Array.from(parent.children)) {
        if (shouldHide(sibling, node)) {
          (sibling as HTMLElement).style.display = "none";
        }
      }
      node = parent;
    }
    for (const child of Array.from(owner.body.children)) {
      if (shouldHide(child, top)) {
        (child as HTMLElement).style.display = "none";
      }
    }
    // No scrolling inside the widget. Fit the iframe to the element PLUS any open pop-up (calendar,
    // TinyMCE menu, …) via the MutationObserver, so pop-ups are never cut off at the iframe edge.
    owner.documentElement.style.overflow = "hidden";
    owner.documentElement.style.height = "auto";
    owner.body.style.margin = "0";
    owner.body.style.overflow = "hidden";
    owner.body.style.height = "auto";
    // Keep the form page's own backdrop, but make the ELEMENT a distinct, self-contained white card so
    // it stands out in the preview. A bare transparent wrapper on a pure-white backdrop would make the
    // element's (white) controls invisible — a "white rectangle". Only shade the element wrapper, never
    // the ancestor containers or the body, whose backdrop gives the card its contrast.
    item.style.background = "#fff";
    item.style.borderRadius = "3px";
    item.style.boxShadow = "0 1px 3px rgba(15,23,42,.25)";
    item.style.border = "1px solid rgba(15,23,42,.12)";
    item.style.padding = "8px";
    // Collapse the element's ancestor containers and scroll it to the top of the preview viewport.
    // Without this the element can sit deep inside its (non-hidden) page/row containers, so the
    // measured `bottom` would be hundreds of px and the iframe would show a large grey/empty page
    // area around the element instead of a compact preview (seen as a "grey rectangle").
    for (let n: HTMLElement | null = item.parentElement; n && n !== owner.body; n = n.parentElement) {
      n.style.height = "auto";
      n.style.minHeight = "0";
    }
    try {
      item.scrollIntoView({ block: "start", inline: "nearest" });
    } catch {
      item.scrollIntoView();
    }
    const fit = registerPreviewFit(frame, owner, item);
    observePreview(owner);
    const height = fitPreviewHeight(fit);
    console.info(
      "[CodBi] Preview: preview clipped to %s (item=%s, height=%d, wrapper=%o)",
      elementRef,
      `${item.tagName}.${item.className || ""}`,
      height,
      wrapper !== null,
    );
    return true;
  } catch (x) {
    console.error("[CodBi] Preview: could not clip the preview to the element", x);
    return false;
  }
}

/** Finds [id] in [doc] or in a nested same-origin iframe (the preview page may frame the form). */
function findPreviewElement(doc: Document, id: string): HTMLElement | null {
  const direct = doc.getElementById(id);
  if (direct) {
    return direct as HTMLElement;
  }
  // The rendered element may carry the designer item id only as `xi` / `data-xi` (on its wrapper,
  // e.g. `id="xi-tf-datum-xc"`), not as the element's own `id`. Fall back to those attributes so a
  // plain element is located even when its rendered `id` differs from the designer's `getId()`.
  const attr = doc.querySelector<HTMLElement>(`[xi="${id}"], [data-xi="${id}"]`);
  if (attr) {
    return attr;
  }
  for (const frame of Array.from(doc.querySelectorAll("iframe"))) {
    try {
      const inner = (frame as HTMLIFrameElement).contentDocument;
      if (!inner) {
        continue;
      }
      const found = inner.getElementById(id);
      if (found) {
        return found as HTMLElement;
      }
      const attrInner = inner.querySelector<HTMLElement>(`[xi="${id}"], [data-xi="${id}"]`);
      if (attrInner) {
        return attrInner;
      }
    } catch {
      /* cross-origin — ignore */
    }
  }
  return null;
}

/** Fallback sizing: show the whole preview document (clamped) when the element cannot be located. */
function sizePreviewToFullDocument(frame: HTMLIFrameElement): void {
  try {
    const full = frame.contentDocument?.documentElement?.scrollHeight ?? 0;
    if (full > 0) {
      frame.style.height = `${Math.min(full, 1600)}px`;
    }
  } catch {
    /* ignore */
  }
}

/** The designer's current form/project id (`XFC_METADATA.currentProject.id`), or `""`. */
function currentProjectId(): string {
  try {
    const meta = (window as unknown as { XFC_METADATA?: { currentProject?: { id?: number | string } } }).XFC_METADATA;
    const id = meta?.currentProject?.id;
    return id === undefined || id === null ? "" : String(id);
  } catch {
    return "";
  }
}

/**
 * The platform's designer-preview URL for the CURRENT form, e.g.
 * `http://host/context/form-management/designer/preview/152?xfd2id=<draftId>`. Loading this URL in a
 * hidden iframe yields a real formcycle form instance (full bootstrap + runtime + CodBi runtime), so
 * the preview shows full form-level fidelity instead of a hand-patched element.
 *
 * The project id comes from `XFC_METADATA.currentProject.id`; the `xfd2id` (the form-design / draft id)
 * is read from the designer page's URL (walking up the frame chain, since the designer may be framed).
 */
function designerPreviewUrl(): string {
  const projectId = currentProjectId();
  if (!projectId) {
    return "";
  }
  const base = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  const draftId = designerDraftId();
  const query = draftId ? `?xfd2id=${encodeURIComponent(draftId)}` : "";
  return `${base}form-management/designer/preview/${encodeURIComponent(projectId)}${query}`;
}

/** The `xfd2id` (form-design / draft id) from the designer page URL, or `""`. */
function designerDraftId(): string {
  const read = (search: string): string => {
    try {
      return new URLSearchParams(search).get("xfd2id") ?? "";
    } catch {
      return "";
    }
  };
  let win: Window | null = window;
  for (let depth = 0; depth < 6 && win; depth++) {
    try {
      const id = read(win.location.search);
      if (id) {
        return id;
      }
      if (win === win.top) {
        break;
      }
      win = win.parent;
    } catch {
      break; // cross-origin ancestor
    }
  }
  return "";
}

/** Removes the whole-form preview iframe (and, with it, its runtime) from a widget wrapper. */
function clearServerPreview(wrapper: HTMLElement): void {
  try {
    const frame = wrapper.querySelector<HTMLIFrameElement>(":scope > .codbi-func-preview-frame");
    if (frame) {
      unregisterPreviewFit(frame);
      frame.remove();
    }
    wrapper.classList.remove("codbi-func-preview--rendered");
  } catch {
    /* ignore */
  }
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
  const elementPreview = previewElementsEnabled();
  refreshing = true;
  try {
    const designer = designerInstance();
    const items = designer?.items ?? {};
    const liveMirrors = new Set<string>();
    const liveFuncs = new Set<string>();
    const livePreview = new Set<string>();
    let mirrors = 0;
    let functions = 0;
    for (const item of Object.values(items)) {
      const isMirror = isMirrorItem(item);
      const isFunc = isCbFuncItem(item);
      // In preview mode we ALSO need to reach plain elements (fields, fieldsets, containers, pages)
      // so they get their own preview switch — so don't bail out on non-widget items in that mode.
      if (!isMirror && !isFunc && !elementPreview) {
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
      // Per-element preview: when the form-level "Preview mode" is ON, EVERY element (fields,
      // fieldsets, containers, pages) gets its own preview switch (see ensureElementPreviewSwitch),
      // not just those carrying `data-cb-func`. Widgets (Mirror) and the FORMCYCLE spacer (which has
      // nothing to preview — it is pure layout) are excluded here.
      if (elementPreview && !isMirror && !isSpacerItem(item) && anchor) {
        if (id) {
          livePreview.add(id);
        }
        try {
          ensureElementPreviewSwitch(item, anchor);
        } catch (x) {
          console.error("[CodBi] Element markers: could not render the element preview switch", x);
        }
      }
    }
    // Drop preview switches whose widget no longer exists (always, independent of the mode).
    for (const id of Array.from(previewSwitches.keys())) {
      if (!livePreview.has(id)) {
        dropPreviewSwitch(id);
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

/**
 * Toggles the per-element "Preview mode" for the currently selected designer element (e.g. via
 * ALT+P). It mirrors the per-element preview switch's behaviour: it flips the element's persisted
 * `data-cb-preview` attribute; the designer's `after-set-property` / `set-property` callbacks then
 * refresh the badges and re-apply (or clear) the frontend preview — see {@link applyElementPreview}.
 * When no element is selected, nothing happens.
 */
function toggleElementPreview(): void {
  const item = designerInstance()?.getSelectedMasterItem?.() as IMarkerItemLike | undefined;
  if (!item || !item.getId?.()) {
    return;
  }
  const current = elementPreviewOn(item);
  setItemAttributeValue(item, ELEMENT_PREVIEW_ATTRIBUTE, current ? "0" : "1");
}

/** The shared keydown handler (registered on the designer frame and on the canvas document). */
function onKeyDown(event: KeyboardEvent): void {
  const key = event.key.toLowerCase();
  if (event.altKey && key === "v") {
    event.preventDefault();
    toggleMarkMode();
  } else if (event.altKey && key === "p") {
    event.preventDefault();
    toggleElementPreview();
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
